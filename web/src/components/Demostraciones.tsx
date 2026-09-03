import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import {
  IconoCandado,
  IconoCheck,
  IconoNivel,
  IconoPersonas,
  IconoReloj,
  IconoRuta,
} from './Iconos';

/**
 * Demostraciones de la sección "Cómo funciona".
 *
 * En vez de fotos de stock, cada bloque enseña **el producto haciendo lo que
 * dice el texto**: los filtros filtrando, el botón apuntándote, las estadísticas
 * bloqueadas. Se entiende sin leer, que es de lo que se trata.
 *
 * Reglas que cumplen las tres:
 *  - Solo se animan cuando entran en pantalla, y una vez dentro se repiten en
 *    bucle lento. Nada se mueve fuera de vista gastando batería.
 *  - Con `prefers-reduced-motion` se quedan quietas en su estado final, que
 *    sigue explicando la idea.
 *  - Nada arranca invisible: si la animación no corre, se ve el estado final.
 */

/** Repite un paso cada N ms mientras el bloque esté en pantalla. */
function usePasos(cantidad: number, ms: number, activo: boolean) {
  const reducido = useReducedMotion();
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    // Sin movimiento o fuera de pantalla: se muestra el estado final y se para.
    if (!activo || reducido) {
      if (reducido) setPaso(cantidad - 1);
      return;
    }
    const t = setInterval(() => setPaso((p) => (p + 1) % cantidad), ms);
    return () => clearInterval(t);
  }, [activo, reducido, cantidad, ms]);

  return paso;
}

/**
 * Panel donde vive cada demo. Va dentro de la tarjeta del paso, así que es una
 * superficie hundida —no otra tarjeta— para que no se lean como dos cajas
 * apiladas. En el paso oscuro se hunde con blanco translúcido en vez de gris.
 */
function Marco({ children, oscuro = false }: { children: React.ReactNode; oscuro?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-ds-lg p-4 ${oscuro ? 'bg-white/7' : 'bg-superficie'}`}>
      <div className="pointer-events-none select-none">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 1. Filtrar: los chips se encienden y la lista responde
 * ------------------------------------------------------------------ */
const FILTROS = ['Principiante', 'Este finde', 'Con plazas'];
const SALIDAS = [
  { nombre: 'Rodaje por el parque', nivel: 'Principiante', finde: true, plazas: true },
  { nombre: 'Series en pista', nivel: 'Avanzado', finde: false, plazas: true },
  { nombre: 'Tirada larga al amanecer', nivel: 'Principiante', finde: true, plazas: false },
  { nombre: 'Trote suave junto al río', nivel: 'Principiante', finde: true, plazas: true },
];

export function DemoFiltrar() {
  const ref = useRef<HTMLDivElement>(null);
  const enVista = useInView(ref, { amount: 0.4 });
  const activos = usePasos(FILTROS.length + 1, 1600, enVista);

  const visibles = SALIDAS.filter((s) => {
    if (activos > 0 && s.nivel !== 'Principiante') return false;
    if (activos > 1 && !s.finde) return false;
    if (activos > 2 && !s.plazas) return false;
    return true;
  });

  return (
    <div ref={ref}>
      <Marco>
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f, i) => {
            const encendido = i < activos;
            return (
              <motion.span
                key={f}
                animate={{ scale: encendido ? 1 : 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                className={`inline-flex h-8 items-center rounded-full px-3.5 text-[12px] font-medium transition-colors ${
                  encendido
                    ? 'bg-verde text-white'
                    : 'border border-linea bg-white text-texto-suave'
                }`}
              >
                {f}
              </motion.span>
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          <AnimatePresence initial={false} mode="popLayout">
            {visibles.map((s) => (
              <motion.div
                key={s.nombre}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.28 }}
                className="flex items-center gap-3 rounded-ds-md border border-linea bg-white p-2.5"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-ds-sm bg-verde-50 text-verde">
                  <IconoRuta className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-texto">
                    {s.nombre}
                  </span>
                  <span className="block text-[11px] text-texto-suave">{s.nivel}</span>
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.p
          key={visibles.length}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-[12px] text-texto-tenue"
        >
          {visibles.length} {visibles.length === 1 ? 'salida encontrada' : 'salidas encontradas'}
        </motion.p>
      </Marco>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 2. Apuntarse: el botón cambia y el contador sube
 * ------------------------------------------------------------------ */
export function DemoApuntarse() {
  const ref = useRef<HTMLDivElement>(null);
  const enVista = useInView(ref, { amount: 0.4 });
  const paso = usePasos(2, 2200, enVista);
  const apuntado = paso === 1;

  return (
    <div ref={ref}>
      <Marco>
        <div className="rounded-ds-md border border-linea bg-white p-4">
          <p className="text-[15px] font-bold text-texto">Rodaje suave por el Retiro</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-texto-suave">
            <span className="inline-flex items-center gap-1.5">
              <IconoNivel className="h-3.5 w-3.5 text-verde" />
              Todos los niveles
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconoReloj className="h-3.5 w-3.5 text-verde" />
              6:00 min/km
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-linea-suave pt-3.5">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-texto-suave">
              <IconoPersonas className="h-4 w-4" />
              <motion.span
                key={apuntado ? 'con' : 'sin'}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                className="inline-block tabular-nums"
              >
                {apuntado ? 13 : 12}
              </motion.span>
              /25
            </span>

            {/* Verde, no flúor: es el color que tiene de verdad el botón dentro de
                una tarjeta. El flúor se reserva al CTA del detalle, y una demo
                que no coincide con el producto engaña más que ayuda. */}
            <motion.span
              layout
              animate={{
                backgroundColor: apuntado ? '#FFFFFF' : '#4A7D76',
                color: apuntado ? '#4A7D76' : '#FFFFFF',
              }}
              transition={{ duration: 0.3 }}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold ${
                apuntado ? 'ring-1 ring-verde/30' : ''
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {apuntado ? (
                  <motion.span
                    key="ok"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.18 }}
                    className="inline-flex items-center gap-1.5"
                  >
                    <IconoCheck className="h-4 w-4" />
                    Apuntado
                  </motion.span>
                ) : (
                  <motion.span
                    key="unirme"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.18 }}
                  >
                    Unirme
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.span>
          </div>
        </div>
      </Marco>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 3. La app: lo que la web no enseña
 * ------------------------------------------------------------------ */
const METRICAS = ['Quién viene', 'Chat del grupo', 'Tus kilómetros'];

/** `oscuro` la adapta a la tarjeta verde del paso 3, donde el blanco es el texto. */
export function DemoApp({ oscuro = false }: { oscuro?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const enVista = useInView(ref, { amount: 0.4 });
  const paso = usePasos(METRICAS.length + 1, 1200, enVista);

  return (
    <div ref={ref}>
      <Marco oscuro={oscuro}>
        <div className="flex items-center justify-between gap-3">
          <p className={`text-[14px] font-bold ${oscuro ? 'text-white' : 'text-texto'}`}>
            En la app
          </p>
          <span
            className={`badge ${oscuro ? 'bg-white/12 text-white/75' : 'bg-linea-suave text-texto-suave'}`}
          >
            <IconoCandado className="h-3.5 w-3.5" />
            Solo en la app
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {METRICAS.map((m, i) => (
            <div key={m} className="flex items-center justify-between gap-4">
              <span className={`text-[13px] ${oscuro ? 'text-white/70' : 'text-texto-suave'}`}>
                {m}
              </span>
              <motion.span
                animate={{
                  // El dato "se asoma" y se vuelve a difuminar: existe, pero aquí no.
                  filter: i < paso ? 'blur(1px)' : 'blur(4px)',
                  opacity: i < paso ? 0.75 : 0.4,
                }}
                transition={{ duration: 0.5 }}
                className={`h-4 rounded-full ${oscuro ? 'bg-white/45' : 'bg-verde/40'}`}
                style={{ width: `${58 - i * 10}px` }}
              />
            </div>
          ))}
        </div>
      </Marco>
    </div>
  );
}
