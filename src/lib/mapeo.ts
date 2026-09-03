import type { Club, ClubResumen, Entrada, Evento, Usuario } from './tipos';

/**
 * Traduce las respuestas de PrestaShop a las formas que consume la interfaz.
 *
 * Antes esto vivía en un servidor intermedio. Ahora el navegador habla directo
 * con el módulo, así que la traducción viaja con el front — pero las reglas no
 * cambian, y hay dos que conviene no perder de vista:
 *
 *  - `max_participants = 0` significa **sin límite**, no cero plazas.
 *  - Nivel, ritmo y terreno son opcionales. Los eventos antiguos los tienen a
 *    `null` y la interfaz oculta lo que falte en vez de inventarlo.
 *
 * SOBRE LOS DATOS DE TERCEROS
 * `personaPublica()` es una lista blanca: se declara qué se conserva, no qué se
 * quita, para que un campo nuevo al otro lado no se cuele solo. Y `participants`
 * no se propaga nunca: la web no muestra quién asiste —eso es de la app— así que
 * esos nombres no entran en el estado de la aplicación.
 */

type Bruto = Record<string, unknown>;

const texto = (v: unknown): string => (typeof v === 'string' ? v : '');
const numero = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number(v);

/**
 * "2026-06-08 19:30:00" → "2026-06-08T19:30:00".
 *
 * A propósito NO se convierte a UTC. PrestaShop guarda la hora de pared del
 * evento; pasarla por `toISOString()` la desplazaría según la zona horaria del
 * navegador y una salida a las 19:30 se mostraría a las 21:30 en otro país. Se
 * entrega sin zona para que se interprete tal cual está escrita.
 */
function aIso(fecha: unknown): string | null {
  if (typeof fecha !== 'string') return null;
  const limpia = fecha.trim().replace(' ', 'T');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(limpia)) return null;
  return Number.isNaN(new Date(limpia).getTime()) ? null : limpia;
}

/** Lista blanca: lo único que se conserva de una persona. */
function personaPublica(bruto: unknown) {
  if (!bruto || typeof bruto !== 'object') return null;
  const c = bruto as Bruto;
  const nombre = [texto(c.firstname), texto(c.lastname)].filter(Boolean).join(' ').trim();
  if (!nombre) return null;
  return {
    id: String(c.id ?? ''),
    nombre,
    avatar: texto(c.avatar) || null,
    ciudad: '',
  };
}

/** Recorta una descripción larga para usarla como resumen de tarjeta. */
function resumir(valor: unknown, largo = 150): string {
  const limpio = texto(valor).replace(/\s+/g, ' ').trim();
  if (limpio.length <= largo) return limpio;
  return `${limpio.slice(0, limpio.lastIndexOf(' ', largo)).trim()}…`;
}

/** Genera las iniciales del escudo: el backend no guarda ni iniciales ni color. */
function iniciales(nombre: string): string {
  const palabras = nombre
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

/**
 * Precios a partir de las entradas.
 *
 * Un evento puede tener varias (general, socios, early bird...), así que se
 * expone la lista y, para las tarjetas, el precio más bajo. Las entradas solo
 * llegan si se pidió `with_tickets=1`.
 *
 * Se usa `price_with_tax` y no `price`: el importe que se anuncia tiene que ser
 * el que se cobra.
 */
function precios(ev: Bruto, gratis: boolean) {
  const brutas = Array.isArray(ev.tickets) ? (ev.tickets as Bruto[]) : [];

  const entradas: Entrada[] = brutas
    .filter((t) => t && t.active !== false)
    .map((t) => ({
      id: String(t.id_event_ticket ?? t.id ?? ''),
      idProducto: numero(t.id_product),
      nombre: texto(t.name) || 'Entrada',
      descripcion: texto(t.description),
      precio: numero(t.price_with_tax ?? t.price),
      disponibles: numero(t.quantity),
    }));

  const conPrecio = entradas
    .map((t) => t.precio)
    .filter((p): p is number => typeof p === 'number' && !Number.isNaN(p));

  return {
    entradas,
    // "Desde": el mínimo. Si el evento es gratis, 0. Si requiere entrada pero no
    // se cargaron los tickets, null → la interfaz dice "Con entrada".
    precio: gratis ? 0 : conPrecio.length ? Math.min(...conPrecio) : null,
    variasEntradas: entradas.length > 1,
  };
}

function mapearClubResumen(bruto: unknown): ClubResumen | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const c = bruto as Bruto;
  const nombre = texto(c.title);
  return {
    id: String(c.id ?? c.id_customer_club ?? ''),
    nombre,
    iniciales: iniciales(nombre),
    color: '#4A7D76',
  };
}

export function mapearEvento(bruto: unknown): Evento | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const ev = bruto as Bruto;

  const asistentes = Number(ev.total_participants) || 0;
  const max = Number(ev.max_participants) || 0;
  const conLimite = max > 0;
  const gratis = !ev.required_ticket;

  const nivel = (ev.level ?? null) as Bruto | null;
  const terreno = (ev.terrain ?? null) as Bruto | null;

  return {
    id: String(ev.id ?? ev.id_customer_event ?? ''),
    // El backend genera el slug y `event` acepta id o slug, así que la URL puede
    // ser legible.
    slug: texto(ev.slug) || String(ev.id ?? ev.id_customer_event ?? ''),
    titulo: texto(ev.title) || 'Salida sin título',
    resumen: resumir(ev.description),
    descripcion: texto(ev.description).trim(),
    fecha: aIso(ev.start_date),
    fechaFin: aIso(ev.end_date),
    ciudad: texto(ev.location_name),
    lugar: texto(ev.location_name),
    direccion: texto(ev.location_description) || texto(ev.location_name),

    // level y terrain llegan como { id, code, name }: son filas configurables
    // desde el back-office, no una lista cerrada. Se usa el `name` que manda el
    // backend y el `code` solo para filtrar.
    nivel: nivel ? texto(nivel.name) || null : null,
    nivelCodigo: nivel ? texto(nivel.code) || null : null,
    terreno: terreno ? texto(terreno.name) || null : null,
    terrenoCodigo: terreno ? texto(terreno.code) || null : null,
    // El backend ya da el ritmo formateado ("6:00 - 6:40 min/km"); los otros dos
    // vienen en segundos por km por si hiciera falta ordenar.
    ritmo: texto(ev.pace_formatted) || null,
    ritmoMin: numero(ev.pace_min),
    ritmoMax: numero(ev.pace_max),

    distanciaKm: numero(ev.distance_run),
    ...precios(ev, gratis),
    gratis,
    requiereEntrada: Boolean(ev.required_ticket),

    plazas: conLimite ? max : null,
    asistentes,
    plazasDisponibles: conLimite ? Math.max(max - asistentes, 0) : null,
    completo: conLimite && asistentes >= max,

    portada: texto(ev.cover_image),
    destacado: false,
    esRecurrente: Boolean(ev.is_recurring),
    inscrito: ev.is_participant === true,
    esOrganizador: ev.is_owner === true,

    clubId: ev.id_customer_club ? String(ev.id_customer_club) : null,
    club: mapearClubResumen(ev.club),
    organizador: personaPublica(ev.customer),

    // participants NUNCA se propaga.
  };
}

export function mapearClub(bruto: unknown): Club | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const c = bruto as Bruto;
  const nombre = texto(c.title) || 'Club sin nombre';
  const nivel = (c.level ?? null) as Bruto | null;

  return {
    id: String(c.id ?? c.id_customer_club ?? ''),
    slug: texto(c.slug) || String(c.id ?? c.id_customer_club ?? ''),
    nombre,
    ciudad: texto(c.city) || texto(c.location_name),
    iniciales: iniciales(nombre),
    color: '#4A7D76',
    descripcion: texto(c.description).trim(),

    nivel: nivel ? texto(nivel.name) || null : null,
    // El backend lo calcula de los eventos recientes; 0 significa "aún ninguna",
    // que no es lo mismo que "no lo sabemos".
    salidasPorSemana: numero(c.sessions_per_week),
    totalEventos: numero(c.total_events),

    miembros: Number(c.total_participants) || 0,
    portada: texto(c.cover_image),
    premium: false,
    esMiembro: c.is_member === true,
    esOrganizador: c.is_owner === true,
    organizador: personaPublica(c.customer),

    // participants NUNCA se propaga.
  };
}

/** Usuario propio (`me`, `login`, `verifyotp`): aquí sí es su propio email. */
export function mapearUsuario(bruto: unknown): Usuario | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const c = bruto as Bruto;
  const id = String(c.id ?? '');
  // Sin id no hay cuenta. `verifyotp` responde 200 con solo el teléfono cuando
  // el número no está registrado, y eso no es una sesión.
  if (!id) return null;

  return {
    id,
    nombre: [texto(c.firstname), texto(c.lastname)].filter(Boolean).join(' ').trim() || 'Runner',
    email: texto(c.email),
    avatar: texto(c.avatar) || null,
    ciudad: '',
    proveedor: 'email',
  };
}

export const utilidades = { aIso, iniciales, resumir, personaPublica };
