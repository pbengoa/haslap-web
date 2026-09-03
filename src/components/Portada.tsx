import { useState } from 'react';

/**
 * Imagen de portada con degradado de marca por debajo.
 * Si la foto no carga (sin red, URL caída) la tarjeta se sigue viendo bien.
 */
export function Portada({
  src,
  alt,
  className = '',
  imgClassName = '',
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [fallo, setFallo] = useState(false);

  // Sin src no se intenta cargar nada: se va directo al degradado de marca.
  // Con src="" el navegador no dispara `onError` de forma fiable y se queda
  // el texto alternativo con el icono de imagen rota.
  const hayImagen = Boolean(src && src.trim()) && !fallo;

  return (
    <div className={`portada-fallback relative overflow-hidden ${className}`}>
      {hayImagen && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFallo(true)}
          className={`h-full w-full object-cover ${imgClassName}`}
        />
      )}
      {!hayImagen && (
        <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <svg viewBox="0 0 32 32" className="h-10 w-10 text-fluor opacity-70">
            <path d="M11.5 5 7 27h4.6l4.5-22zM23.5 5 19 27h4.6l4.5-22z" fill="currentColor" />
            <path d="M9 13.5h14l-.9 4.5H8.1z" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  );
}
