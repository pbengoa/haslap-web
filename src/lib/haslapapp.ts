/**
 * Cliente HTTP contra el módulo `haslapapp` de PrestaShop.
 *
 * El navegador habla directo con el backend. Puede hacerlo porque el módulo
 * autentica por **Bearer token** —no por cookie— y responde
 * `Access-Control-Allow-Origin: *` con `Authorization` entre las cabeceras
 * permitidas. Con cookies esto sería imposible: `SameSite=Lax` no viaja
 * cross-site, y `Allow-Origin: *` sin `Allow-Credentials` lo rechaza el propio
 * navegador por especificación.
 *
 * Todas las respuestas del módulo vienen envueltas:
 *
 *   { success: true, message: "...", code: 200, psdata: { ... } }
 *
 * Aquí se desenvuelve `psdata` y se convierten los fallos en `ErrorApi`.
 */

const BASE = (import.meta.env.VITE_API_URL || 'https://haslap.okoiagency.com').replace(/\/+$/, '');
const TIEMPO_LIMITE = 20000;

const CLAVE_TOKEN = 'haslap.token';

export const tokenGuardado = () => localStorage.getItem(CLAVE_TOKEN);
export const guardarToken = (token: string) => localStorage.setItem(CLAVE_TOKEN, token);
export const borrarToken = () => localStorage.removeItem(CLAVE_TOKEN);

export class ErrorApi extends Error {
  status: number;
  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
  }
}

export type Parametros = Record<string, string | number | boolean | undefined | null>;

/** Construye la URL de un controlador del módulo. */
function url(controlador: string, params: Parametros = {}): string {
  const u = new URL('/index.php', BASE);
  u.searchParams.set('fc', 'module');
  u.searchParams.set('module', 'haslapapp');
  u.searchParams.set('controller', controlador);
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== '' && valor !== false) {
      u.searchParams.set(clave, String(valor));
    }
  }
  return u.toString();
}

type Opciones = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Parametros;
  cuerpo?: unknown;
};

/**
 * Llama a un controlador del módulo y devuelve su `psdata`.
 *
 * El token va en `Authorization` siempre que exista, también en las llamadas
 * públicas: el catálogo cambia según quién mire —`is_participant`, `is_member`,
 * `is_owner`— y sin token esos campos vuelven siempre en false.
 */
export async function llamar<T = unknown>(controlador: string, opciones: Opciones = {}): Promise<T> {
  const { metodo = 'GET', params = {}, cuerpo = null } = opciones;
  const token = tokenGuardado();

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_LIMITE);

  let respuesta: Response;
  try {
    respuesta = await fetch(url(controlador, params), {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      signal: control.signal,
    });
  } catch (err) {
    clearTimeout(temporizador);
    const esTiempo = err instanceof DOMException && err.name === 'AbortError';
    throw new ErrorApi(
      esTiempo
        ? 'El servidor de Haslap tardó demasiado en responder.'
        : 'No pudimos conectar con Haslap. Revisa tu conexión.',
      esTiempo ? 504 : 502,
    );
  }
  clearTimeout(temporizador);

  const texto = await respuesta.text();

  let datos: Record<string, unknown>;
  try {
    datos = texto ? JSON.parse(texto) : {};
  } catch {
    // PrestaShop puede responder HTML: un 500, una página de mantenimiento...
    throw new ErrorApi('El servidor de Haslap devolvió una respuesta no válida.', 502);
  }

  if (datos.success === false || !respuesta.ok) {
    const mensaje =
      (typeof datos.error === 'string' && datos.error) ||
      (typeof datos.message === 'string' && datos.message) ||
      'Algo ha ido mal. Inténtalo de nuevo.';
    throw new ErrorApi(mensaje, Number(datos.code) || respuesta.status);
  }

  return datos.psdata as T;
}

/**
 * Igual que `llamar`, pero devuelve además el sobre completo.
 *
 * `verifyotp` distingue "existe y ha entrado" de "no está registrado" por el
 * código —201 frente a 200—, no por el contenido de `psdata`.
 */
export async function llamarConSobre<T = unknown>(
  controlador: string,
  opciones: Opciones = {},
): Promise<{ psdata: T; code: number; message: string }> {
  const { metodo = 'POST', params = {}, cuerpo = null } = opciones;
  const token = tokenGuardado();

  const respuesta = await fetch(url(controlador, params), {
    method: metodo,
    headers: {
      Accept: 'application/json',
      ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

  const texto = await respuesta.text();
  let datos: Record<string, unknown>;
  try {
    datos = texto ? JSON.parse(texto) : {};
  } catch {
    throw new ErrorApi('El servidor de Haslap devolvió una respuesta no válida.', 502);
  }

  if (datos.success === false || !respuesta.ok) {
    const mensaje =
      (typeof datos.error === 'string' && datos.error) ||
      (typeof datos.message === 'string' && datos.message) ||
      'Algo ha ido mal. Inténtalo de nuevo.';
    throw new ErrorApi(mensaje, Number(datos.code) || respuesta.status);
  }

  return {
    psdata: datos.psdata as T,
    code: Number(datos.code) || respuesta.status,
    message: typeof datos.message === 'string' ? datos.message : '',
  };
}

export const urlDe = url;
