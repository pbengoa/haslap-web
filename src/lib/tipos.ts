export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  avatar: string | null;
  ciudad: string;
  proveedor: 'email' | 'google';
};

export type ClubResumen = {
  id: string;
  nombre: string;
  iniciales: string;
  color: string;
};

export type Entrada = {
  id: string;
  /** Producto de PrestaShop detras de la entrada: lo que pide `addtocart`. */
  idProducto: number | null;
  nombre: string;
  descripcion: string;
  precio: number | null;
  disponibles: number | null;
};

/** Nivel o terreno: filas configurables en el back-office, no una lista fija. */
export type Opcion = { codigo: string; nombre: string };

export type Meta = {
  ciudades: string[];
  provincias: { id: string; nombre: string; eventosAbiertos: number | null }[];
  niveles: Opcion[];
  terrenos: Opcion[];
};

export type Evento = {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  descripcion: string;
  fecha: string | null;
  fechaFin: string | null;
  ciudad: string;
  lugar: string;
  direccion: string;
  nivel: string | null;
  /** Código estable del nivel (`beginner`...) — el que entiende el filtro. */
  nivelCodigo: string | null;
  distanciaKm: number | null;
  ritmo: string | null;
  ritmoMin: number | null;
  ritmoMax: number | null;
  terreno: string | null;
  terrenoCodigo: string | null;
  /** Precio "desde": el más bajo de sus entradas. */
  precio: number | null;
  entradas: Entrada[];
  variasEntradas: boolean;
  requiereEntrada: boolean;
  plazas: number | null;
  portada: string;
  destacado: boolean;
  asistentes: number;
  plazasDisponibles: number | null;
  completo: boolean;
  gratis: boolean;
  inscrito: boolean;
  esRecurrente: boolean;
  /** Lo organizo yo. Alimenta la pestana "Organizo yo" de Mis eventos. */
  esOrganizador: boolean;
  clubId: string | null;
  club: ClubResumen | null;
  organizador: { id: string; nombre: string; avatar: string | null; ciudad: string } | null;
};

export type Club = {
  id: string;
  nombre: string;
  slug: string;
  ciudad: string;
  iniciales: string;
  color: string;
  descripcion: string;
  nivel: string | null;
  salidasPorSemana: number | null;
  totalEventos: number | null;
  miembros: number;
  portada: string;
  premium: boolean;
  esMiembro: boolean;
  esOrganizador: boolean;
  organizador: { id: string; nombre: string; avatar: string | null } | null;
};

export type MetodoAcceso = {
  habilitado: boolean;
  /** Por qué no está disponible, si no lo está. Se muestra al usuario. */
  motivo?: string | null;
};

export type ConfigAuth = {
  /** Vía principal: es la identidad que comparte con la app. */
  telefono: MetodoAcceso;
  email: MetodoAcceso;
  google: MetodoAcceso & { modo: 'real' | 'demo' | 'no-disponible'; clientId: string | null };
  /** 'haslapapp' = backend real de PrestaShop; 'dummy' = seed en memoria. */
  origen?: 'haslapapp' | 'dummy';
};
