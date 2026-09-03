/**
 * Traduce las respuestas de PrestaShop a las formas que ya consume el front,
 * y — más importante — recorta todo lo que no debe salir de aquí.
 *
 * SOBRE LOS DATOS PERSONALES
 * El backend ya no expone el objeto Customer completo (se corrigió en agosto de
 * 2026: ya no llegan `passwd`, `secure_key`, email ni teléfono). Aun así
 * `personaPublica()` sigue siendo una lista blanca: se elige qué sale, no qué se
 * quita, para que un campo nuevo al otro lado no se filtre solo.
 *
 * Y seguimos sin propagar `participants`: la web no muestra quién asiste — eso es
 * de la app — así que esos nombres no tienen por qué llegar al navegador.
 */

/**
 * "2026-06-08 19:30:00" → "2026-06-08T19:30:00".
 *
 * A propósito NO se convierte a UTC. PrestaShop guarda la hora de pared del
 * evento, y pasarla por `toISOString()` la desplazaría según la zona horaria
 * del servidor: una salida a las 19:30 acabaría mostrándose a las 21:30 según
 * dónde corra el Node. Se entrega sin zona para que el navegador la interprete
 * tal cual está escrita.
 */
function aIso(fecha) {
  if (!fecha || typeof fecha !== 'string') return null;
  const limpia = fecha.trim().replace(' ', 'T');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(limpia)) return null;
  const d = new Date(limpia);
  return Number.isNaN(d.getTime()) ? null : limpia;
}

/** Lista blanca: lo único que puede salir de una persona hacia el navegador. */
function personaPublica(customer) {
  if (!customer || typeof customer !== 'object') return null;
  const nombre = [customer.firstname, customer.lastname].filter(Boolean).join(' ').trim();
  if (!nombre) return null;
  return {
    id: String(customer.id ?? ''),
    nombre,
    avatar: customer.avatar || null,
    ciudad: null,
  };
}

/** Recorta una descripción larga para usarla como resumen de tarjeta. */
function resumirTexto(texto, largo = 150) {
  const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!limpio) return '';
  if (limpio.length <= largo) return limpio;
  return limpio.slice(0, limpio.lastIndexOf(' ', largo)).trim() + '…';
}

/**
 * Precios a partir de las entradas del evento.
 *
 * Corrección respecto a nuestra primera especificación: un evento puede tener
 * VARIAS entradas (general, socios, early bird...), no un precio único. Se
 * expone la lista completa y, para las tarjetas, el precio más bajo.
 * Las entradas solo llegan si se pide `with_tickets=1`.
 */
function precios(ev, gratis) {
  const entradas = Array.isArray(ev.tickets) ? ev.tickets : [];

  const lista = entradas
    .filter((t) => t && t.active !== false)
    .map((t) => ({
      id: String(t.id_event_ticket ?? t.id ?? ''),
      nombre: t.name || 'Entrada',
      descripcion: t.description || '',
      precio: t.price != null ? Number(t.price) : null,
      disponibles: t.quantity != null ? Number(t.quantity) : null,
    }));

  const conPrecio = lista.map((t) => t.precio).filter((p) => typeof p === 'number' && !Number.isNaN(p));

  return {
    entradas: lista,
    // `precio` es "desde": el mínimo de las entradas. Si el evento es gratis, 0.
    // Si requiere entrada pero no nos han cargado los tickets, null → la UI dice
    // "Con entrada" en lugar de inventar un importe.
    precio: gratis ? 0 : conPrecio.length ? Math.min(...conPrecio) : null,
    variasEntradas: lista.length > 1,
  };
}

/**
 * Evento de PrestaShop → Evento del front.
 *
 * Nivel, ritmo y terreno ya existen en el backend, pero son opcionales: los
 * eventos antiguos los tienen a null. La UI sigue ocultando lo que falte en vez
 * de rellenarlo con algo inventado.
 */
export function mapearEvento(ev) {
  if (!ev || typeof ev !== 'object') return null;

  const total = Number(ev.total_participants) || 0;
  // max_participants = 0 significa "sin límite", no "cero plazas".
  const max = Number(ev.max_participants) || 0;
  const conLimite = max > 0;
  const gratis = !ev.required_ticket;

  return {
    id: String(ev.id ?? ev.id_customer_event ?? ''),
    // El backend genera el slug ("run-club-llevant-coffee-run-1135") y `event`
    // acepta id o slug, así que la URL puede ser legible.
    slug: ev.slug || String(ev.id ?? ev.id_customer_event ?? ''),
    titulo: ev.title || 'Salida sin título',
    resumen: resumirTexto(ev.description),
    descripcion: String(ev.description || '').trim(),
    fecha: aIso(ev.start_date),
    fechaFin: aIso(ev.end_date),
    ciudad: ev.location_name || '',
    lugar: ev.location_name || '',
    direccion: ev.location_description || ev.location_name || '',

    // level y terrain llegan como { id, code, name }. Son filas configurables
    // desde el back-office, no una lista cerrada en código: se usa el `name` que
    // manda el backend y el `code` solo para filtrar.
    nivel: ev.level?.name ?? null,
    nivelCodigo: ev.level?.code ?? null,
    terreno: ev.terrain?.name ?? null,
    terrenoCodigo: ev.terrain?.code ?? null,
    // El backend ya da el ritmo formateado ("6:00 - 6:40 min/km"); pace_min y
    // pace_max vienen en segundos por km por si hiciera falta ordenar o filtrar.
    ritmo: ev.pace_formatted ?? null,
    ritmoMin: ev.pace_min ?? null,
    ritmoMax: ev.pace_max ?? null,

    distanciaKm: ev.distance_run != null ? Number(ev.distance_run) : null,
    ...precios(ev, gratis),
    gratis,
    requiereEntrada: Boolean(ev.required_ticket),

    plazas: conLimite ? max : null,
    asistentes: total,
    plazasDisponibles: conLimite ? Math.max(max - total, 0) : null,
    completo: conLimite && total >= max,

    portada: ev.cover_image || '',
    destacado: false,
    esRecurrente: Boolean(ev.is_recurring),
    inscrito: ev.is_participant === true,
    esOrganizador: ev.is_owner === true,

    clubId: ev.id_customer_club ? String(ev.id_customer_club) : null,
    club: ev.club ? mapearClubResumen(ev.club) : null,
    organizador: personaPublica(ev.customer),

    // participants NUNCA se propaga: contiene datos personales de terceros.
  };
}

function mapearClubResumen(club) {
  if (!club || typeof club !== 'object') return null;
  const nombre = club.title || '';
  return {
    id: String(club.id ?? club.id_customer_club ?? ''),
    nombre,
    iniciales: iniciales(nombre),
    color: '#4A7D76',
  };
}

/** Genera las iniciales del escudo: el backend no guarda ni iniciales ni color. */
function iniciales(nombre) {
  const palabras = String(nombre || '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!palabras.length) return '?';
  if (palabras.length === 1) return palabras[0].slice(0, 3).toUpperCase();
  return palabras
    .slice(0, 2)
    .map((p) => p.slice(0, 3).toUpperCase())
    .join(' ');
}

/** Club de PrestaShop → Club del front. */
export function mapearClub(club) {
  if (!club || typeof club !== 'object') return null;
  const nombre = club.title || 'Club sin nombre';

  return {
    id: String(club.id ?? club.id_customer_club ?? ''),
    slug: club.slug || String(club.id ?? club.id_customer_club ?? ''),
    nombre,
    ciudad: club.city || club.location_name || '',
    iniciales: iniciales(nombre),
    color: '#4A7D76',
    descripcion: String(club.description || '').trim(),

    nivel: club.level?.name ?? null,
    // El backend lo calcula de los eventos recientes; 0 significa "aún ninguna",
    // que no es lo mismo que "no lo sabemos".
    salidasPorSemana: club.sessions_per_week != null ? Number(club.sessions_per_week) : null,
    totalEventos: club.total_events != null ? Number(club.total_events) : null,

    miembros: Number(club.total_participants) || 0,
    portada: club.cover_image || '',
    premium: false,
    esMiembro: club.is_member === true,
    esOrganizador: club.is_owner === true,
    organizador: personaPublica(club.customer),

    // participants NUNCA se propaga.
  };
}

/** Usuario propio (`me` / `login`): aquí sí es su propio email. */
export function mapearUsuario(customer) {
  if (!customer || typeof customer !== 'object') return null;
  return {
    id: String(customer.id ?? ''),
    nombre: [customer.firstname, customer.lastname].filter(Boolean).join(' ').trim() || 'Runner',
    email: customer.email || '',
    avatar: customer.avatar || null,
    ciudad: '',
    proveedor: 'email',
  };
}

export const utilidades = { aIso, iniciales, resumirTexto, personaPublica };
