import { llamar, llamarConSobre, type Parametros } from './haslapapp';
import { mapearClub, mapearEvento, mapearUsuario } from './mapeo';
import { firebaseConfigurado } from './firebase';
import type { Club, ConfigAuth, Evento, Meta, Opcion, Usuario } from './tipos';

export { ErrorApi, borrarToken, guardarToken, tokenGuardado } from './haslapapp';
import { guardarToken } from './haslapapp';

export type FiltrosEventos = {
  q?: string;
  ciudad?: string;
  nivel?: string;
  terreno?: string;
  cuando?: string;
  gratis?: boolean;
  conPlazas?: boolean;
  clubId?: string;
  destacados?: boolean;
  limite?: number;
};

/** Sesión recién abierta: el token y quién es. */
type Sesion = { token: string; usuario: Usuario };

/**
 * Traduce el chip de fecha al rango que entiende el backend.
 *
 * `date_from` y `date_to` son inclusivos y con granularidad de día, así que un
 * "hoy" es el mismo día en los dos extremos.
 */
function rango(cuando?: string): Parametros {
  const dia = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hoy = new Date();

  if (cuando === 'hoy') return { date_from: dia(hoy), date_to: dia(hoy) };

  if (cuando === 'manana') {
    const d = new Date(hoy);
    d.setDate(d.getDate() + 1);
    return { date_from: dia(d), date_to: dia(d) };
  }

  if (cuando === 'finde') {
    // El sábado que viene, y hoy mismo si hoy ya es sábado.
    const sabado = new Date(hoy);
    sabado.setDate(sabado.getDate() + ((6 - sabado.getDay() + 7) % 7));
    const domingo = new Date(sabado);
    domingo.setDate(domingo.getDate() + 1);
    return { date_from: dia(sabado), date_to: dia(domingo) };
  }

  return {};
}

/**
 * Abre sesión a partir de la respuesta de `login` o `verifyotp`.
 *
 * El módulo solo emite token si se lo piden con `issue_token`, y lo devuelve
 * junto al cliente. Si falta el token o el cliente no tiene id, no hay sesión:
 * es lo que pasa cuando un teléfono verificado no está registrado todavía.
 */
function abrirSesion(psdata: unknown, mensaje: string): Sesion {
  const sobre = (psdata ?? {}) as Record<string, unknown>;
  const usuario = mapearUsuario(sobre.customer ?? sobre);
  const token = typeof sobre.token === 'string' ? sobre.token : '';

  if (!usuario || !token) {
    throw new ErrorSinCuenta(mensaje);
  }

  guardarToken(token);
  return { token, usuario };
}

/** El teléfono se verificó, pero no hay ninguna cuenta con ese número. */
export class ErrorSinCuenta extends Error {
  status = 404;
}

export const api = {
  /**
   * Métodos de acceso disponibles.
   *
   * Lo decide el front porque depende de su propia configuración: el SMS lo pide
   * el navegador a Firebase, así que sin las claves de Firebase no se puede
   * ofrecer aunque el backend lo soporte.
   */
  configAuth: async (): Promise<ConfigAuth> => ({
    telefono: {
      habilitado: firebaseConfigurado,
      motivo: firebaseConfigurado
        ? null
        : 'Todavía no está disponible en la web. Puedes entrar con tu email.',
    },
    email: { habilitado: true },
    google: {
      habilitado: false,
      modo: 'no-disponible',
      clientId: null,
      motivo: 'Todavía no está disponible en la web.',
    },
    origen: 'haslapapp',
  }),

  login: async ({ email, password }: { email: string; password: string }): Promise<Sesion> => {
    const psdata = await llamar('login', {
      metodo: 'POST',
      cuerpo: {
        login_type: 'email',
        email,
        password,
        issue_token: true,
        token_label: 'web',
      },
    });
    return abrirSesion(psdata, 'Email o contraseña incorrectos.');
  },

  /**
   * Acceso por teléfono.
   *
   * Aquí solo llega el `idToken` que devuelve Firebase al validar el código; el
   * backend lo verifica contra las claves públicas de Google y resuelve el
   * cliente por su número. Si ese número no tiene cuenta responde 200 sin
   * sesión, y eso se convierte en un error con nombre propio para que la
   * pantalla pueda ofrecer el registro.
   */
  loginTelefono: async ({
    idToken,
    telefono,
  }: {
    idToken: string;
    telefono: string;
  }): Promise<Sesion> => {
    const { psdata } = await llamarConSobre('verifyotp', {
      metodo: 'POST',
      cuerpo: {
        idToken,
        userPhone: telefono,
        issue_token: true,
        token_label: 'web',
      },
    });
    return abrirSesion(psdata, 'Este número todavía no tiene cuenta en Haslap.');
  },

  /**
   * Alta con email.
   *
   * `register` no emite token, así que se entra justo después con las mismas
   * credenciales. El teléfono es obligatorio en el backend: es el identificador
   * que comparte con la app, y sin él la misma persona acabaría con dos cuentas.
   */
  registro: async ({
    nombre,
    email,
    password,
    telefono,
  }: {
    nombre: string;
    email: string;
    password: string;
    telefono: string;
  }): Promise<Sesion> => {
    const [firstname, ...resto] = nombre.trim().split(' ');
    await llamar('register', {
      metodo: 'POST',
      cuerpo: {
        email,
        password,
        firstname,
        lastname: resto.join(' ') || firstname,
        phone: telefono,
      },
    });
    return api.login({ email, password });
  },

  loginGoogle: async (_cuerpo?: unknown): Promise<Sesion> => {
    throw new ErrorSinCuenta('El acceso con Google todavía no está disponible.');
  },

  /** Quién soy. Sirve además para comprobar que el token sigue vivo. */
  yo: async (): Promise<{ usuario: Usuario }> => {
    const psdata = await llamar('me');
    const sobre = (psdata ?? {}) as Record<string, unknown>;
    const usuario = mapearUsuario(sobre.customer ?? sobre);
    if (!usuario) throw new ErrorSinCuenta('Tu sesión ha caducado.');
    return { usuario };
  },

  /**
   * Ciudades, provincias, niveles y terrenos.
   *
   * Son dos llamadas: los catálogos viven en `bootstrap` y las provincias con
   * eventos abiertos en `states`. Se piden a la vez porque ninguna depende de la
   * otra.
   */
  meta: async (): Promise<Meta> => {
    const [boot, estados] = await Promise.all([
      llamar<Record<string, unknown>>('bootstrap'),
      llamar<unknown[]>('states').catch(() => [] as unknown[]),
    ]);

    const provincias = (Array.isArray(estados) ? estados : []) as Record<string, unknown>[];
    const catalogo = (clave: string): Opcion[] =>
      ((boot?.[clave] as Record<string, unknown>[]) || []).map((o) => ({
        codigo: String(o.code ?? ''),
        nombre: String(o.name ?? ''),
      }));

    return {
      ciudades: provincias
        .map((p) => String(p.name ?? ''))
        .filter(Boolean)
        .sort(),
      provincias: provincias.map((p) => ({
        id: String(p.id_state ?? ''),
        nombre: String(p.name ?? ''),
        eventosAbiertos: p.open_events === undefined ? null : Number(p.open_events),
      })),
      // `event_levels` y no `levels`: los segundos son los niveles de
      // gamificación que se ganan con puntos, otra cosa distinta.
      niveles: catalogo('event_levels'),
      terrenos: catalogo('event_terrains'),
    };
  },

  estadisticas: async () => {
    const s = (await llamar<Record<string, unknown>>('stats')) ?? {};
    return {
      salidasAbiertas: Number(s.open_events) || 0,
      clubes: Number(s.clubs) || 0,
      ciudades: Number(s.cities) || 0,
      plazasDisponibles: Number(s.available_slots) || 0,
    };
  },

  eventos: async (filtros: FiltrosEventos = {}): Promise<{ total: number; eventos: Evento[] }> => {
    const psdata = await llamar<Record<string, unknown>>('events', {
      params: {
        search: filtros.q || undefined,
        city: filtros.ciudad && filtros.ciudad !== 'todas' ? filtros.ciudad : undefined,
        level: filtros.nivel && filtros.nivel !== 'todos' ? filtros.nivel : undefined,
        terrain: filtros.terreno && filtros.terreno !== 'todos' ? filtros.terreno : undefined,
        id_customer_club: filtros.clubId || undefined,
        free: filtros.gratis ? 1 : undefined,
        with_slots: filtros.conPlazas ? 1 : undefined,
        with_tickets: 1,
        limit: filtros.limite || 50,
        ...rango(filtros.cuando),
      },
    });

    let eventos = ((psdata?.events as unknown[]) || []).map(mapearEvento).filter(Boolean) as Evento[];
    if (filtros.destacados) eventos = eventos.slice(0, filtros.limite || 3);

    const paginacion = psdata?.pagination as Record<string, unknown> | undefined;
    return { total: Number(paginacion?.total) || eventos.length, eventos };
  },

  evento: async (id: string): Promise<{ evento: Evento }> => {
    const psdata = await llamar('event', { params: { id, with_tickets: 1 } });
    const evento = mapearEvento(psdata);
    if (!evento) throw new ErrorSinCuenta('Esta salida ya no existe.');
    return { evento };
  },

  crearEvento: async (cuerpo: Record<string, unknown>): Promise<{ evento: Evento | null }> => {
    const psdata = await llamar('event', {
      metodo: 'POST',
      cuerpo: {
        title: cuerpo.titulo,
        description: cuerpo.descripcion,
        start_date: cuerpo.fecha,
        end_date: cuerpo.fecha,
        location_name: cuerpo.lugar,
        location_description: cuerpo.lugar,
        distance_run: cuerpo.distanciaKm,
        max_participants: cuerpo.plazas,
      },
    });
    return { evento: mapearEvento(psdata) };
  },

  unirseEvento: async (id: string): Promise<{ evento: Evento }> => {
    await llamar('eventparticipant', {
      metodo: 'POST',
      cuerpo: { id_customer_event: Number(id) },
    });
    return api.evento(id);
  },

  salirEvento: async (id: string): Promise<{ evento: Evento }> => {
    await llamar('eventparticipant', {
      metodo: 'DELETE',
      cuerpo: { id_customer_event: Number(id) },
    });
    return api.evento(id);
  },

  clubes: async (
    filtros: { q?: string; ciudad?: string; limite?: number } = {},
  ): Promise<{ total: number; clubes: Club[] }> => {
    const psdata = await llamar<Record<string, unknown>>('clubs', {
      params: { search: filtros.q || undefined, limit: filtros.limite || 50 },
    });

    let clubes = ((psdata?.clubs as unknown[]) || []).map(mapearClub).filter(Boolean) as Club[];
    // El backend no filtra clubes por ciudad, así que se hace aquí.
    if (filtros.ciudad && filtros.ciudad !== 'todas') {
      const ciudad = filtros.ciudad.toLowerCase();
      clubes = clubes.filter((c) => c.ciudad.toLowerCase() === ciudad);
    }
    return { total: clubes.length, clubes };
  },

  club: async (id: string): Promise<{ club: Club; proximasSalidas: Evento[] }> => {
    // `include_events` evita una segunda llamada para las próximas salidas.
    const psdata = await llamar<Record<string, unknown>>('club', {
      params: { id, include_events: 1 },
    });
    const club = mapearClub(psdata);
    if (!club) throw new ErrorSinCuenta('Este club ya no existe.');

    const proximasSalidas = ((psdata?.events as unknown[]) || [])
      .map(mapearEvento)
      .filter(Boolean) as Evento[];
    return { club, proximasSalidas };
  },

  unirseClub: async (id: string): Promise<{ club: Club }> => {
    await llamar('clubmember', { metodo: 'POST', cuerpo: { id_customer_club: Number(id) } });
    const { club } = await api.club(id);
    return { club };
  },

  salirClub: async (id: string): Promise<{ club: Club }> => {
    await llamar('clubmember', { metodo: 'DELETE', cuerpo: { id_customer_club: Number(id) } });
    const { club } = await api.club(id);
    return { club };
  },

  misEventos: async (): Promise<{ proximos: Evento[]; pasados: Evento[] }> => {
    const lista = await eventosDelCliente();
    const ahora = Date.now();
    return {
      proximos: lista.filter((e) => e.fecha && new Date(e.fecha).getTime() >= ahora),
      pasados: lista.filter((e) => e.fecha && new Date(e.fecha).getTime() < ahora),
    };
  },

  misEventosOrganizados: async (): Promise<{ eventos: Evento[] }> => ({
    eventos: (await eventosDelCliente()).filter((e) => e.esOrganizador),
  }),

  misClubes: async (): Promise<{ clubes: Club[] }> => {
    const psdata = await llamar<Record<string, unknown>>('customerclubs', {
      params: { limit: 100 },
    });
    const brutos = (psdata?.clubs as unknown[]) || (Array.isArray(psdata) ? psdata : []);
    return { clubes: brutos.map(mapearClub).filter(Boolean) as Club[] };
  },
};

/** Las salidas del cliente, que alimentan tanto "a las que voy" como "las que organizo". */
async function eventosDelCliente(): Promise<Evento[]> {
  const psdata = await llamar<Record<string, unknown>>('customerevents', { params: { limit: 100 } });
  const brutos = (psdata?.events as unknown[]) || (Array.isArray(psdata) ? psdata : []);
  return brutos.map(mapearEvento).filter(Boolean) as Evento[];
}
