/**
 * Cliente HTTP contra el módulo haslapapp de PrestaShop (entorno PRE).
 *
 * Este servidor Node hace de BFF: el navegador nunca habla con PrestaShop.
 * Hay tres razones para ello, y las tres son bloqueantes si se intenta llamar
 * a PrestaShop directamente desde el front:
 *
 *  1. La sesión de PrestaShop es una cookie `SameSite=Lax`, que el navegador
 *     no envía en peticiones cross-site. Aquí la cookie vive en el servidor.
 *  2. El módulo responde `Access-Control-Allow-Origin: *` sin
 *     `Allow-Credentials`, combinación que el navegador rechaza con cookies.
 *  3. Varios endpoints devuelven datos personales y hashes de contraseña de
 *     terceros. Se filtran aquí (ver mapeo.js) y nunca salen hacia el cliente.
 */

const BASE = process.env.HASLAP_API_URL || 'https://haslap.okoiagency.com';
const TIMEOUT = Number(process.env.HASLAP_API_TIMEOUT || 20000);

/**
 * Origen de datos.
 *
 * `HASLAP_MODO=dummy` fuerza el seed en memoria aunque haya URL configurada.
 * Sirve para trabajar en las pantallas con sesión iniciada sin depender de PRE:
 * el seed trae una cuenta de prueba ya inscrita a eventos y en un club, así que
 * "Mis eventos", inscribirse y cancelar funcionan de punta a punta.
 */
export const haslapappConfigurado =
  Boolean(process.env.HASLAP_API_URL) && process.env.HASLAP_MODO !== 'dummy';

/** Construye la URL de un controlador del módulo. */
function url(controlador, params = {}) {
  const u = new URL('/index.php', BASE);
  u.searchParams.set('fc', 'module');
  u.searchParams.set('module', 'haslapapp');
  u.searchParams.set('controller', controlador);
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      u.searchParams.set(clave, String(valor));
    }
  }
  return u.toString();
}

export class ErrorHaslapapp extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

/**
 * Llama a un controlador del módulo.
 *
 * @param {string} controlador  nombre del front controller (events, clubs, login...)
 * @param {object} opciones
 * @param {'GET'|'POST'|'PUT'|'DELETE'} opciones.metodo
 * @param {object} opciones.params   query string
 * @param {object} opciones.cuerpo   body JSON
 * @param {string} opciones.cookie   cookie de sesión de PrestaShop, si la hay
 * @returns {Promise<{psdata: any, cookie: string|null}>}
 */
export async function llamar(controlador, opciones = {}) {
  const { metodo = 'GET', params = {}, cuerpo = null, cookie = null } = opciones;

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIMEOUT);

  let respuesta;
  try {
    respuesta = await fetch(url(controlador, params), {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      signal: control.signal,
      redirect: 'follow',
    });
  } catch (err) {
    clearTimeout(temporizador);
    const esTimeout = err.name === 'AbortError';
    throw new ErrorHaslapapp(
      esTimeout ? 'El backend de Haslap no respondió a tiempo.' : 'No se pudo contactar con el backend de Haslap.',
      esTimeout ? 504 : 502,
    );
  }
  clearTimeout(temporizador);

  const texto = await respuesta.text();

  let datos;
  try {
    datos = texto ? JSON.parse(texto) : {};
  } catch {
    // PrestaShop puede devolver HTML (error 500, página de mantenimiento...).
    throw new ErrorHaslapapp('El backend devolvió una respuesta no válida.', 502);
  }

  // La cookie de sesión solo se propaga hacia arriba; nunca hacia el navegador.
  const setCookie = respuesta.headers.getSetCookie?.() ?? [];
  const cookieSesion =
    setCookie
      .map((c) => c.split(';')[0])
      .filter((c) => c.startsWith('PrestaShop-'))
      .join('; ') || null;

  if (datos.success === false) {
    throw new ErrorHaslapapp(datos.error || datos.message || 'Error del backend.', datos.code || respuesta.status);
  }

  return { psdata: datos.psdata, cookie: cookieSesion, bruto: datos };
}

export const urlDe = url;
