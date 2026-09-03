import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, borrarToken, guardarToken, tokenGuardado } from './api';
import type { ConfigAuth, Usuario } from './tipos';

type ContextoAuth = {
  usuario: Usuario | null;
  cargando: boolean;
  config: ConfigAuth | null;
  entrarConEmail: (email: string, password: string) => Promise<void>;
  /** Paso 1 del acceso por teléfono: Firebase manda el SMS. */
  pedirCodigoSms: (telefono: string) => Promise<void>;
  /** Paso 2: se canjea el código por una sesión. */
  entrarConTelefono: (telefono: string, codigo: string) => Promise<void>;
  registrarse: (nombre: string, email: string, password: string, telefono: string) => Promise<void>;
  entrarConGoogle: (credential: string) => Promise<void>;
  entrarConGoogleDemo: (perfil: { email: string; nombre: string }) => Promise<void>;
  salir: () => void;
};

const Contexto = createContext<ContextoAuth | null>(null);

export function ProveedorAuth({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [config, setConfig] = useState<ConfigAuth | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al arrancar: leemos la config de login y restauramos la sesión si hay token.
  useEffect(() => {
    let vivo = true;

    api
      .configAuth()
      .then((c) => vivo && setConfig(c))
      .catch(() => undefined);

    if (!tokenGuardado()) {
      setCargando(false);
      return () => {
        vivo = false;
      };
    }

    api
      .yo()
      .then(({ usuario }) => vivo && setUsuario(usuario))
      .catch(() => borrarToken())
      .finally(() => vivo && setCargando(false));

    return () => {
      vivo = false;
    };
  }, []);

  const aplicarSesion = useCallback((datos: { token: string; usuario: Usuario }) => {
    guardarToken(datos.token);
    setUsuario(datos.usuario);
  }, []);

  const valor = useMemo<ContextoAuth>(
    () => ({
      usuario,
      cargando,
      config,
      entrarConEmail: async (email, password) => {
        aplicarSesion(await api.login({ email, password }));
      },
      pedirCodigoSms: async (telefono) => {
        const { enviarSmsFirebase } = await import('./firebase');
        await enviarSmsFirebase(telefono);
      },
      entrarConTelefono: async (telefono, codigo) => {
        const { confirmarSmsFirebase } = await import('./firebase');
        const idToken = await confirmarSmsFirebase(codigo);
        aplicarSesion(await api.loginTelefono({ idToken, telefono }));
      },
      registrarse: async (nombre, email, password, telefono) => {
        aplicarSesion(await api.registro({ nombre, email, password, telefono }));
      },
      entrarConGoogle: async (credential) => {
        aplicarSesion(await api.loginGoogle({ credential }));
      },
      entrarConGoogleDemo: async (perfil) => {
        aplicarSesion(await api.loginGoogle({ demo: perfil }));
      },
      salir: () => {
        borrarToken();
        setUsuario(null);
      },
    }),
    [usuario, cargando, config, aplicarSesion],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <ProveedorAuth>');
  return ctx;
}
