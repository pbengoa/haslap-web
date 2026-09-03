/**
 * Verificación del teléfono por SMS con Firebase.
 *
 * El SDK se carga **bajo demanda** (import dinámico) desde `auth.tsx`: solo pesa
 * para quien elige entrar con el móvil, no para todo el que abre la web.
 *
 * Lo que ocurre aquí no toca nunca a PrestaShop: el navegador pide el SMS a
 * Firebase y, al validar el código, Firebase devuelve un `idToken`. Ese token es
 * lo único que viaja a nuestro servidor, que se lo pasa a `verifyotp` para que
 * el backend lo verifique contra las claves públicas de Google.
 *
 * Configuración necesaria en `web/.env` (los valores de Firebase web son
 * públicos por diseño; la seguridad está en los dominios autorizados):
 *
 *   VITE_FIREBASE_API_KEY=...
 *   VITE_FIREBASE_AUTH_DOMAIN=...
 *
 * Además hay que dar de alta el dominio de la web (y `localhost` en desarrollo)
 * en Firebase Console → Authentication → Settings → Authorized domains.
 */

type ConfirmacionSms = { confirm: (codigo: string) => Promise<{ user: unknown }> };

let confirmacionPendiente: ConfirmacionSms | null = null;

export const firebaseConfigurado = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
);

async function auth() {
  if (!firebaseConfigurado) {
    throw new Error('Falta la configuración de Firebase para el acceso con teléfono.');
  }

  const [{ initializeApp, getApps }, authMod] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ]);

  const app = getApps()[0] ?? initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  });

  const instancia = authMod.getAuth(app);
  // Los SMS llegan en el idioma del navegador, no en el del proyecto.
  instancia.useDeviceLanguage();
  return { authMod, instancia };
}

/** Paso 1: Firebase envía el SMS. Devuelve cuando el envío se ha aceptado. */
export async function enviarSmsFirebase(telefono: string) {
  const { authMod, instancia } = await auth();

  // reCAPTCHA invisible: obligatorio para el login por teléfono en web.
  // Se recrea en cada intento porque, una vez resuelto, no se puede reutilizar.
  const contenedorId = 'recaptcha-haslap';
  document.getElementById(contenedorId)?.remove();
  const contenedor = document.createElement('div');
  contenedor.id = contenedorId;
  document.body.appendChild(contenedor);

  const verificador = new authMod.RecaptchaVerifier(instancia, contenedorId, {
    size: 'invisible',
  });

  confirmacionPendiente = (await authMod.signInWithPhoneNumber(
    instancia,
    telefono,
    verificador,
  )) as unknown as ConfirmacionSms;
}

/** Paso 2: valida el código y devuelve el idToken que espera el backend. */
export async function confirmarSmsFirebase(codigo: string) {
  if (!confirmacionPendiente) {
    throw new Error('Pide primero el código por SMS.');
  }
  const credencial = await confirmacionPendiente.confirm(codigo);
  const usuario = credencial.user as { getIdToken: () => Promise<string> };
  const idToken = await usuario.getIdToken();
  confirmacionPendiente = null;
  return idToken;
}
