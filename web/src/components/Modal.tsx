import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconoCerrar } from './Iconos';

export function Modal({
  abierto,
  onCerrar,
  titulo,
  subtitulo,
  children,
  ancho = 'max-w-lg',
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  subtitulo?: ReactNode;
  children: ReactNode;
  ancho?: string;
}) {
  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', alPulsar);
    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener('keydown', alPulsar);
    };
  }, [abierto, onCerrar]);

  return (
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCerrar}
            className="fixed inset-0 bg-texto/45 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={`relative z-10 my-auto w-full ${ancho} rounded-ds-xl bg-white p-6 shadow-modal`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[20px] leading-tight font-extrabold text-texto">{titulo}</h2>
                {subtitulo && <div className="mt-1 text-[13px] text-texto-suave">{subtitulo}</div>}
              </div>
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar"
                className="-mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-texto-tenue hover:bg-linea-suave hover:text-texto"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
