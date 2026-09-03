/**
 * Rutas del BFF. Exponen la misma superficie que ya consume el front
 * (`/api/eventos`, `/api/clubes`, ...) pero por detrás hablan con PrestaShop.
 */
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { llamar, ErrorHaslapapp } from './cliente.js';
import { mapearEvento, mapearClub, mapearUsuario } from './mapeo.js';

const JWT_SECRET = process.env.JWT_SECRET || 'haslap-mvp-secret-solo-para-desarrollo';

/**
 * El SMS de verificación lo pide el navegador a Firebase, así que hace falta la
 * config web del proyecto (apiKey y authDomain). No son secretos —son públicos
 * por diseño en Firebase—, pero sin ellos el acceso por teléfono no se ofrece.
 */
const firebaseConfigurado = Boolean(process.env.FIREBASE_API_KEY && process.env.FIREBASE_AUTH_DOMAIN);
const router = Router();

/**
 * Sesión: PrestaShop autentica por cookie `SameSite=Lax`, que el navegador no
 * envía cross-site. Guardamos esa cookie dentro de un JWT propio que sí viaja
 * bien, y la reinyectamos en cada llamada al backend.
 */
const firmar = (usuario, cookie) => jwt.sign({ usuario, cookie }, JWT_SECRET, { expiresIn: '7d' });

function sesionDe(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

const cookieDe = (req) => sesionDe(req)?.cookie || null;

/** Envuelve un handler async para no repetir try/catch en cada ruta. */
const ruta = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    if (err instanceof ErrorHaslapapp) {
      return res.status(err.status >= 400 && err.status < 600 ? err.status : 502).json({ error: err.message });
    }
    console.error('[bff]', err);
    res.status(500).json({ error: 'Error interno del BFF.' });
  }
};

/* ------------------------------ meta / salud ------------------------------ */

router.get('/salud', ruta(async (_req, res) => {
  const { bruto } = await llamar('healthcheck').catch((e) => ({ bruto: { error: e.message } }));
  res.json({ ok: true, origen: 'haslapapp', backend: bruto?.details ?? bruto ?? null });
}));

router.get('/meta', ruta(async (_req, res) => {
  // Niveles y terrenos son filas configurables desde el back-office, no una
  // lista fija en código: se leen de `bootstrap` en cada arranque.
  const [boot, prov] = await Promise.all([
    llamar('bootstrap'),
    llamar('states').catch(() => ({ psdata: [] })),
  ]);

  const provincias = Array.isArray(prov.psdata) ? prov.psdata : [];
  res.json({
    ciudades: provincias.map((p) => p.name).filter(Boolean).sort(),
    provincias: provincias.map((p) => ({
      id: String(p.id_state),
      nombre: p.name,
      eventosAbiertos: p.open_events ?? null,
    })),
    niveles: (boot.psdata?.event_levels || []).map((n) => ({ codigo: n.code, nombre: n.name })),
    terrenos: (boot.psdata?.event_terrains || []).map((t) => ({ codigo: t.code, nombre: t.name })),
  });
}));

router.get('/estadisticas', ruta(async (_req, res) => {
  const { psdata } = await llamar('stats');
  res.json({
    salidasAbiertas: psdata?.open_events ?? 0,
    clubes: psdata?.clubs ?? 0,
    ciudades: psdata?.cities ?? 0,
    plazasDisponibles: psdata?.available_slots ?? 0,
  });
}));

/* --------------------------------- auth ---------------------------------- */

/**
 * Métodos de acceso disponibles.
 *
 * El teléfono va primero a propósito. La app de Haslap identifica a la gente
 * por su número, así que si la web empujara al email+contraseña acabaríamos con
 * cuentas duplicadas: alguien se registra en la web con email, luego entra en
 * la app con su teléfono y aparece como usuario nuevo. Con el teléfono como vía
 * principal, web y app comparten identidad.
 */
router.get('/auth/config', (_req, res) => {
  res.json({
    telefono: {
      habilitado: firebaseConfigurado,
      // Sin config de Firebase web no se puede pedir el SMS desde el navegador.
      motivo: firebaseConfigurado
        ? null
        : 'Todavía no está disponible en la web. Puedes entrar con tu email.',
    },
    email: { habilitado: true },
    google: {
      habilitado: false,
      modo: 'no-disponible',
      clientId: null,
      motivo:
        'Todavía no está disponible en la web.',
    },
    origen: 'haslapapp',
  });
});

/**
 * Acceso por teléfono.
 *
 * El SMS lo pide el navegador directamente a Firebase; aquí solo llega el
 * `idToken` que devuelve Firebase al validar el código. El backend lo verifica
 * contra las claves públicas de Google y resuelve el cliente por su número.
 */
router.post('/auth/telefono', ruta(async (req, res) => {
  const { idToken, telefono } = req.body || {};
  if (!idToken || !telefono) {
    return res.status(400).json({ error: 'Falta el código de verificación.' });
  }

  const { psdata, cookie } = await llamar('verifyotp', {
    metodo: 'POST',
    cuerpo: { idToken, userPhone: telefono },
  });

  const usuario = mapearUsuario(psdata);
  if (!usuario) return res.status(401).json({ error: 'No pudimos verificar tu teléfono.' });

  res.json({ token: firmar(usuario, cookie), usuario: { ...usuario, proveedor: 'telefono' } });
}));

router.post('/auth/login', ruta(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Introduce email y contraseña.' });

  const { psdata, cookie } = await llamar('login', {
    metodo: 'POST',
    cuerpo: { login_type: 'email', email, password },
  });

  const usuario = mapearUsuario(psdata);
  if (!usuario) return res.status(401).json({ error: 'Email o contraseña incorrectos.' });

  res.json({ token: firmar(usuario, cookie), usuario });
}));

router.post('/auth/registro', ruta(async (req, res) => {
  const { nombre, email, password, telefono } = req.body || {};
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos para crear la cuenta.' });
  }
  // El backend exige teléfono en el alta: es la identidad común con la app.
  if (!telefono) {
    return res.status(400).json({ error: 'Necesitamos tu teléfono para crear la cuenta.' });
  }

  const [firstname, ...resto] = String(nombre).trim().split(' ');
  const { psdata, cookie } = await llamar('register', {
    metodo: 'POST',
    cuerpo: {
      email,
      password,
      firstname,
      lastname: resto.join(' ') || firstname,
      phone: telefono,
    },
  });
  const usuario = mapearUsuario(psdata);
  res.status(201).json({ token: firmar(usuario, cookie), usuario });
}));

router.post('/auth/google', (_req, res) => {
  res.status(501).json({ error: 'El acceso con Google todavía no está disponible.' });
});

router.get('/auth/yo', ruta(async (req, res) => {
  const sesion = sesionDe(req);
  if (!sesion) return res.status(401).json({ error: 'Necesitas iniciar sesión.' });
  // Se confía en el usuario del token; revalidar contra `me` en cada carga
  // multiplicaría las llamadas al backend sin aportar nada en este MVP.
  res.json({ usuario: sesion.usuario });
}));

/* -------------------------------- eventos -------------------------------- */

router.get('/eventos', ruta(async (req, res) => {
  const { q, ciudad, nivel, terreno, limite, destacados, clubId } = req.query;

  // Todos estos filtros los resuelve ya el backend (agosto 2026). Antes se
  // traía el listado entero y se filtraba aquí, que no aguantaba el catálogo.
  const { psdata } = await llamar('events', {
    params: {
      search: q || undefined,
      city: ciudad && ciudad !== 'todas' ? ciudad : undefined,
      level: nivel && nivel !== 'todos' ? nivel : undefined,
      terrain: terreno && terreno !== 'todos' ? terreno : undefined,
      id_customer_club: clubId || undefined,
      free: req.query.gratis === 'true' ? 1 : undefined,
      with_slots: req.query.conPlazas === 'true' ? 1 : undefined,
      date_from: req.query.desde || undefined,
      date_to: req.query.hasta || undefined,
      with_tickets: 1,
      limit: Number(limite) || 50,
    },
    cookie: cookieDe(req),
  });

  let eventos = (psdata?.events || []).map(mapearEvento).filter(Boolean);
  if (destacados === 'true') eventos = eventos.slice(0, Number(limite) || 3);

  res.json({ total: psdata?.pagination?.total ?? eventos.length, eventos });
}));

router.get('/eventos/:id', ruta(async (req, res) => {
  const { psdata } = await llamar('event', {
    params: { id: req.params.id, with_tickets: 1 },
    cookie: cookieDe(req),
  });
  const evento = mapearEvento(psdata);
  if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' });
  res.json({ evento });
}));

router.post('/eventos/:id/inscripcion', ruta(async (req, res) => {
  const cookie = cookieDe(req);
  if (!cookie) return res.status(401).json({ error: 'Necesitas iniciar sesión para apuntarte.' });

  await llamar('eventparticipant', {
    metodo: 'POST',
    cuerpo: { id_customer_event: Number(req.params.id) },
    cookie,
  });
  const { psdata } = await llamar('event', { params: { id: req.params.id }, cookie });
  res.status(201).json({ evento: mapearEvento(psdata) });
}));

router.delete('/eventos/:id/inscripcion', ruta(async (req, res) => {
  const cookie = cookieDe(req);
  if (!cookie) return res.status(401).json({ error: 'Necesitas iniciar sesión.' });

  await llamar('eventparticipant', {
    metodo: 'DELETE',
    cuerpo: { id_customer_event: Number(req.params.id) },
    cookie,
  });
  const { psdata } = await llamar('event', { params: { id: req.params.id }, cookie });
  res.json({ evento: mapearEvento(psdata) });
}));

router.post('/eventos', ruta(async (req, res) => {
  const cookie = cookieDe(req);
  if (!cookie) return res.status(401).json({ error: 'Necesitas iniciar sesión para crear un evento.' });

  const { titulo, descripcion, fecha, lugar, distanciaKm, plazas } = req.body || {};
  const { psdata } = await llamar('event', {
    metodo: 'POST',
    cuerpo: {
      title: titulo,
      description: descripcion,
      start_date: fecha,
      end_date: fecha,
      location_name: lugar,
      location_description: lugar,
      distance_run: distanciaKm,
      max_participants: plazas,
    },
    cookie,
  });
  res.status(201).json({ evento: mapearEvento(psdata) });
}));

/* --------------------------------- clubes -------------------------------- */

router.get('/clubes', ruta(async (req, res) => {
  const { q, ciudad, limite } = req.query;
  const { psdata } = await llamar('clubs', {
    params: { search: q || undefined, limit: Number(limite) || 50 },
    cookie: cookieDe(req),
  });

  let clubes = (psdata?.clubs || []).map(mapearClub).filter(Boolean);
  if (ciudad && ciudad !== 'todas') {
    clubes = clubes.filter((c) => c.ciudad.toLowerCase() === String(ciudad).toLowerCase());
  }
  res.json({ total: clubes.length, clubes });
}));

router.get('/clubes/:id', ruta(async (req, res) => {
  const cookie = cookieDe(req);
  // `include_events` evita la segunda llamada que hacíamos antes para
  // reconstruir las próximas salidas del club a mano.
  const { psdata } = await llamar('club', {
    params: { id: req.params.id, include_events: 1 },
    cookie,
  });
  const club = mapearClub(psdata);
  if (!club) return res.status(404).json({ error: 'Club no encontrado.' });

  const proximasSalidas = (psdata?.events || []).map(mapearEvento).filter(Boolean);
  res.json({ club, proximasSalidas });
}));

router.post('/clubes/:id/membresia', ruta(async (req, res) => {
  const cookie = cookieDe(req);
  if (!cookie) return res.status(401).json({ error: 'Necesitas iniciar sesión.' });
  await llamar('clubmember', {
    metodo: 'POST',
    cuerpo: { id_customer_club: Number(req.params.id) },
    cookie,
  });
  const { psdata } = await llamar('club', { params: { id: req.params.id }, cookie });
  res.status(201).json({ club: mapearClub(psdata) });
}));

router.delete('/clubes/:id/membresia', ruta(async (req, res) => {
  const cookie = cookieDe(req);
  if (!cookie) return res.status(401).json({ error: 'Necesitas iniciar sesión.' });
  await llamar('clubmember', {
    metodo: 'DELETE',
    cuerpo: { id_customer_club: Number(req.params.id) },
    cookie,
  });
  const { psdata } = await llamar('club', { params: { id: req.params.id }, cookie });
  res.json({ club: mapearClub(psdata) });
}));

/* ---------------------------------- mío ---------------------------------- */

router.get('/mi/eventos', ruta(async (req, res) => {
  const cookie = cookieDe(req);
  if (!cookie) return res.status(401).json({ error: 'Necesitas iniciar sesión.' });

  const { psdata } = await llamar('customerevents', { params: { limit: 100 }, cookie });
  const lista = (psdata?.events || psdata || []).map(mapearEvento).filter(Boolean);
  const ahora = Date.now();

  res.json({
    proximos: lista.filter((e) => e.fecha && new Date(e.fecha).getTime() >= ahora),
    pasados: lista.filter((e) => e.fecha && new Date(e.fecha).getTime() < ahora),
  });
}));

router.get('/mi/eventos/organizados', ruta(async (req, res) => {
  const cookie = cookieDe(req);
  if (!cookie) return res.status(401).json({ error: 'Necesitas iniciar sesión.' });
  const { psdata } = await llamar('customerevents', { params: { limit: 100 }, cookie });
  const eventos = (psdata?.events || psdata || []).map(mapearEvento).filter((e) => e && e.esOrganizador);
  res.json({ eventos });
}));

router.get('/mi/clubes', ruta(async (req, res) => {
  const cookie = cookieDe(req);
  if (!cookie) return res.status(401).json({ error: 'Necesitas iniciar sesión.' });
  const { psdata } = await llamar('customerclubs', { params: { limit: 100 }, cookie });
  res.json({ clubes: (psdata?.clubs || psdata || []).map(mapearClub).filter(Boolean) });
}));

export default router;
