/** Set de iconos del design system, en SVG inline (sin dependencias). */
type Props = { className?: string };

const base = 'h-4 w-4';

const Svg = ({
  children,
  className,
  relleno = false,
}: {
  children: React.ReactNode;
  className?: string;
  relleno?: boolean;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill={relleno ? 'currentColor' : 'none'}
    stroke={relleno ? 'none' : 'currentColor'}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className ?? base}
  >
    {children}
  </svg>
);

export const IconoBuscar = ({ className }: Props) => (
  <Svg className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Svg>
);

export const IconoUbicacion = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);

export const IconoCalendario = ({ className }: Props) => (
  <Svg className={className}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </Svg>
);

export const IconoReloj = ({ className }: Props) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconoPersonas = ({ className }: Props) => (
  <Svg className={className}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    <path d="M16 5.5a3.2 3.2 0 0 1 0 6.4M17.5 14.8c2 .8 3.5 2.6 3.5 5.2" />
  </Svg>
);

export const IconoNivel = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M5 20v-5M12 20V8M19 20V4" />
  </Svg>
);

export const IconoRuta = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M4 18c0-2.5 2-3 4-3s4-.5 4-3-2-3-4-3-4-.5-4-3" />
    <path d="M12 18h5a3 3 0 0 0 0-6h-1" />
  </Svg>
);

export const IconoTerreno = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M3 18h18" />
    <path d="m5 14 4-5 3 3.5L15.5 8 21 14" />
  </Svg>
);

export const IconoCorazon = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M12 20s-7-4.4-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7 2.7C19 15.6 12 20 12 20Z" />
  </Svg>
);

export const IconoCompartir = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M12 15V4M12 4 8.5 7.5M12 4l3.5 3.5" />
    <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </Svg>
);

export const IconoCampana = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
    <path d="M10.5 18a1.8 1.8 0 0 0 3 0" />
  </Svg>
);

export const IconoCandado = ({ className }: Props) => (
  <Svg className={className}>
    <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
    <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
  </Svg>
);

export const IconoMovil = ({ className }: Props) => (
  <Svg className={className}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </Svg>
);

export const IconoFlecha = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M5 12h13M13 7l5 5-5 5" />
  </Svg>
);

export const IconoFlechaIzquierda = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M19 12H6M11 7l-5 5 5 5" />
  </Svg>
);

export const IconoChevron = ({ className }: Props) => (
  <Svg className={className}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const IconoCerrar = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M6 6 18 18M18 6 6 18" />
  </Svg>
);

export const IconoMenu = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconoCheck = ({ className }: Props) => (
  <Svg className={className}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
);

export const IconoMas = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconoEstrella = ({ className }: Props) => (
  <Svg className={className} relleno>
    <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5Z" />
  </Svg>
);

export const IconoVerificado = ({ className }: Props) => (
  <Svg className={className} relleno>
    <path d="m12 2 2.4 1.8 3-.2.9 2.9 2.4 1.8-1.2 2.7 1.2 2.7-2.4 1.8-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9L3.3 15.7l1.2-2.7-1.2-2.7 2.4-1.8.9-2.9 3 .2L12 2Z" />
    <path d="m8.5 12 2.4 2.4 4.6-4.8" stroke="#fff" strokeWidth="2" fill="none" />
  </Svg>
);

export const IconoGrafico = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M4 19h16" />
    <rect x="6" y="11" width="3" height="6" rx="1" />
    <rect x="11" y="7" width="3" height="10" rx="1" />
    <rect x="16" y="13" width="3" height="4" rx="1" />
  </Svg>
);

export const IconoChat = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M20 12.5c0 3.6-3.6 6.5-8 6.5-1 0-2-.15-2.9-.43L4 20l1.2-3.2A6.7 6.7 0 0 1 4 12.5C4 8.9 7.6 6 12 6s8 2.9 8 6.5Z" />
  </Svg>
);

export const IconoDescarga = ({ className }: Props) => (
  <Svg className={className}>
    <path d="M12 4v10M8 10.5l4 4 4-4" />
    <path d="M5 19h14" />
  </Svg>
);

/** Logo de Google, en sus colores oficiales. */
export const IconoGoogle = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? base}>
    <path
      fill="#4285F4"
      d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.56-5.17 3.56-8.87Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.28a12 12 0 0 0 0 10.74l3.99-3.09Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.63l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
    />
  </svg>
);
