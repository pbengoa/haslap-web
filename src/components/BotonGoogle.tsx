import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { IconoGoogle } from './Iconos';
import { tapBoton } from '../lib/animaciones';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (respuesta: { credential: string }) => void;
          }) => void;
          renderButton: (elemento: HTMLElement, opciones: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const SCRIPT_GIS = 'https://accounts.google.com/gsi/client';

function cargarScriptGoogle() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_GIS}"]`);
    if (existente) {
      existente.addEventListener('load', () => resolve());
      existente.addEventListener('error', () => reject(new Error('No se pudo cargar Google.')));
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_GIS;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google.'));
    document.head.appendChild(script);
  });
}

/**
 * Botón de "Continuar con Google".
 *
 * - Con GOOGLE_CLIENT_ID en el servidor: renderiza el botón oficial de Google Identity
 *   Services y el backend verifica el ID token.
 * - Sin client ID (esta demo): simula el perfil que devolvería Google para poder
 *   probar el flujo completo con data dummy.
 */
export function BotonGoogle({
  onListo,
  onError,
}: {
  onListo: () => void;
  onError: (mensaje: string) => void;
}) {
  const { config, entrarConGoogle, entrarConGoogleDemo } = useAuth();
  const contenedor = useRef<HTMLDivElement>(null);
  const [cargando, setCargando] = useState(false);
  const [emailDemo, setEmailDemo] = useState('runner.demo@gmail.com');
  const [pidiendoEmail, setPidiendoEmail] = useState(false);

  // El backend de PrestaShop solo admite email/contraseña y OTP de teléfono.
  // Cuando dice que Google no está disponible, el botón no se pinta.
  const disponible = config?.google?.habilitado !== false;
  const modoReal = config?.google?.modo === 'real' && Boolean(config.google.clientId);

  useEffect(() => {
    if (!modoReal || !contenedor.current) return;
    let cancelado = false;

    cargarScriptGoogle()
      .then(() => {
        if (cancelado || !contenedor.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: config!.google.clientId!,
          callback: async (respuesta) => {
            try {
              await entrarConGoogle(respuesta.credential);
              onListo();
            } catch {
              onError('No pudimos verificar tu cuenta de Google.');
            }
          },
        });
        window.google.accounts.id.renderButton(contenedor.current, {
          theme: 'outline',
          size: 'large',
          width: 360,
          text: 'continue_with',
          shape: 'pill',
          locale: 'es',
        });
      })
      .catch(() => onError('No se pudo cargar el inicio de sesión de Google.'));

    return () => {
      cancelado = true;
    };
  }, [modoReal, config, entrarConGoogle, onListo, onError]);

  if (!disponible) return null;

  if (modoReal) {
    return <div ref={contenedor} className="flex justify-center [color-scheme:light]" />;
  }

  const entrarDemo = async () => {
    setCargando(true);
    try {
      await entrarConGoogleDemo({
        email: emailDemo.trim(),
        nombre: emailDemo.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      });
      onListo();
    } catch {
      onError('No pudimos completar el acceso con Google.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <motion.button
        {...tapBoton}
        type="button"
        onClick={() => (pidiendoEmail ? entrarDemo() : setPidiendoEmail(true))}
        disabled={cargando}
        className="btn btn-lg w-full border border-linea bg-white text-texto hover:bg-superficie"
      >
        <IconoGoogle className="h-5 w-5" />
        {cargando ? 'Conectando...' : 'Continuar con Google'}
      </motion.button>

      {/* Se anima solo opacidad/posición: nunca la altura, para que el input
          de dentro no quede recortado si la animación no llega a terminar. */}
      {pidiendoEmail && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-3 rounded-ds-md border border-dashed border-linea bg-superficie p-3"
        >
          <p className="text-[12px] text-texto-suave">
            <strong className="text-texto">Modo demo.</strong> No hay <code>GOOGLE_CLIENT_ID</code>{' '}
            configurado, así que simulamos la cuenta que devolvería Google. Con el client ID puesto,
            aquí aparece el botón oficial y el servidor verifica el ID token.
          </p>
          <div className="mt-2.5 flex gap-2">
            <input
              className="campo h-10 flex-1 text-[13px]"
              value={emailDemo}
              onChange={(e) => setEmailDemo(e.target.value)}
              placeholder="tu.email@gmail.com"
              aria-label="Email de la cuenta de Google simulada"
            />
            <button
              type="button"
              onClick={entrarDemo}
              disabled={cargando}
              className="btn btn-md btn-identidad shrink-0"
            >
              Entrar
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
