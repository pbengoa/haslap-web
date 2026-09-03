import type { Club, ConfigAuth, Evento, Meta, Usuario } from './tipos';

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

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = tokenGuardado();
  const respuesta = await fetch(`/api${ruta}`, {
    ...opciones,
    headers: {
      ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opciones.headers || {}),
    },
  });

  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : {};

  if (!respuesta.ok) {
    throw new ErrorApi(datos.error || 'Algo ha ido mal. Inténtalo de nuevo.', respuesta.status);
  }
  return datos as T;
}

const query = (params: Record<string, string | number | boolean | undefined | null>) => {
  const sp = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== '' && valor !== false) {
      sp.set(clave, String(valor));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export type FiltrosEventos = {
  q?: string;
  ciudad?: string;
  nivel?: string;
  cuando?: string;
  gratis?: boolean;
  conPlazas?: boolean;
  clubId?: string;
  destacados?: boolean;
  limite?: number;
};

export const api = {
  configAuth: () => pedir<ConfigAuth>('/auth/config'),

  loginTelefono: (cuerpo: { idToken: string; telefono: string }) =>
    pedir<{ token: string; usuario: Usuario }>('/auth/telefono', {
      method: 'POST',
      body: JSON.stringify(cuerpo),
    }),

  registro: (cuerpo: { nombre: string; email: string; password: string; telefono: string }) =>
    pedir<{ token: string; usuario: Usuario }>('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(cuerpo),
    }),

  login: (cuerpo: { email: string; password: string }) =>
    pedir<{ token: string; usuario: Usuario }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(cuerpo),
    }),

  loginGoogle: (cuerpo: { credential?: string; demo?: { email: string; nombre: string } }) =>
    pedir<{ token: string; usuario: Usuario; modo: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(cuerpo),
    }),

  yo: () => pedir<{ usuario: Usuario }>('/auth/yo'),

  meta: () => pedir<Meta>('/meta'),

  estadisticas: () =>
    pedir<{
      salidasAbiertas: number;
      clubes: number;
      ciudades: number;
      plazasDisponibles: number;
    }>('/estadisticas'),

  eventos: (filtros: FiltrosEventos = {}) =>
    pedir<{ total: number; eventos: Evento[] }>(`/eventos${query(filtros)}`),

  evento: (id: string) => pedir<{ evento: Evento }>(`/eventos/${id}`),

  crearEvento: (cuerpo: Record<string, unknown>) =>
    pedir<{ evento: Evento }>('/eventos', { method: 'POST', body: JSON.stringify(cuerpo) }),

  unirseEvento: (id: string) =>
    pedir<{ evento: Evento }>(`/eventos/${id}/inscripcion`, { method: 'POST' }),

  salirEvento: (id: string) =>
    pedir<{ evento: Evento }>(`/eventos/${id}/inscripcion`, { method: 'DELETE' }),

  clubes: (filtros: { q?: string; ciudad?: string; limite?: number } = {}) =>
    pedir<{ total: number; clubes: Club[] }>(`/clubes${query(filtros)}`),

  club: (id: string) =>
    pedir<{ club: Club; proximasSalidas: Evento[] }>(`/clubes/${id}`),

  unirseClub: (id: string) =>
    pedir<{ club: Club }>(`/clubes/${id}/membresia`, { method: 'POST' }),

  salirClub: (id: string) =>
    pedir<{ club: Club }>(`/clubes/${id}/membresia`, { method: 'DELETE' }),

  misEventos: () => pedir<{ proximos: Evento[]; pasados: Evento[] }>('/mi/eventos'),

  misClubes: () => pedir<{ clubes: Club[] }>('/mi/clubes'),

  misEventosOrganizados: () => pedir<{ eventos: Evento[] }>('/mi/eventos/organizados'),
};
