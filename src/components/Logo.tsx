import { Link } from 'react-router-dom';

/**
 * Logotipo oficial de Haslap: el wordmark en itálica, tal cual viene del
 * entregable de marca. No hay isotipo aparte, así que no existe una versión
 * "solo símbolo" — donde no quepa el wordmark se usa el favicon.
 *
 * `invertido` lo pasa a blanco para cuando va sobre el verde oscuro. Al ser
 * tinta plana sobre transparencia, `brightness-0 invert` da blanco puro y evita
 * tener que mantener un segundo archivo.
 */
export function Logo({
  className = 'h-7',
  invertido = false,
}: {
  className?: string;
  invertido?: boolean;
}) {
  return (
    <Link to="/" className="inline-flex shrink-0 items-center" aria-label="Haslap — inicio">
      <img
        src="/logo-haslap.png"
        alt="Haslap"
        width={971}
        height={284}
        className={`w-auto shrink-0 ${className} ${invertido ? 'brightness-0 invert' : ''}`}
      />
    </Link>
  );
}
