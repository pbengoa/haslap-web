import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconoCheck, IconoCerrar } from './Iconos';

type Tipo = 'exito' | 'error';
type Aviso = { id: number; texto: string; tipo: Tipo };

const Contexto = createContext<((texto: string, tipo?: Tipo) => void) | null>(null);

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const mostrar = useCallback((texto: string, tipo: Tipo = 'exito') => {
    const id = Date.now() + Math.random();
    setAvisos((prev) => [...prev, { id, texto, tipo }]);
    setTimeout(() => setAvisos((prev) => prev.filter((a) => a.id !== id)), 4000);
  }, []);

  const valor = useMemo(() => mostrar, [mostrar]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {avisos.map((aviso) => (
            <motion.div
              key={aviso.id}
              role="status"
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full px-4 py-2.5 text-[14px] font-medium shadow-modal ${
                aviso.tipo === 'exito' ? 'bg-verde-900 text-white' : 'bg-red-600 text-white'
              }`}
            >
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                  aviso.tipo === 'exito' ? 'bg-fluor text-texto' : 'bg-white/20 text-white'
                }`}
              >
                {aviso.tipo === 'exito' ? (
                  <IconoCheck className="h-3.5 w-3.5" />
                ) : (
                  <IconoCerrar className="h-3.5 w-3.5" />
                )}
              </span>
              {aviso.texto}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Contexto.Provider>
  );
}

export function useAviso() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAviso debe usarse dentro de <ProveedorAvisos>');
  return ctx;
}
