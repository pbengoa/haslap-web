import { useEffect, useRef, type ReactNode } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';

/**
 * Primitivas de movimiento de la landing.
 *
 * Dos reglas que cumplen todas:
 *
 *  1. **Nunca esconden contenido.** Si la animación no llega a ejecutarse —pestaña en
 *     segundo plano, rAF throttled, IntersectionObserver que no dispara— el texto y las
 *     cifras se ven igual. Nada arranca en `opacity: 0`.
 *  2. **Respetan `prefers-reduced-motion`.** `MotionConfig` cubre las animaciones por
 *     variantes, pero NO lo que se mueve con MotionValue: eso hay que comprobarlo a mano
 *     con `useReducedMotion()`, y aquí se hace.
 */

/* ------------------------------------------------------------------ *
 * Barra de progreso de scroll
 * ------------------------------------------------------------------ */
export function BarraProgresoScroll() {
  const { scrollYProgress } = useScroll();
  // El muelle evita que la barra vaya a tirones con la rueda del ratón.
  const escala = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX: escala }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-fluor"
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ *
 * Contador que sube al entrar en pantalla
 * ------------------------------------------------------------------ */
export function Contador({ valor, className }: { valor: number | undefined; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const enVista = useInView(ref, { once: true, amount: 0.4 });
  const reducido = useReducedMotion();

  const cuenta = useMotionValue(0);
  const texto = useTransform(cuenta, (v) => Math.round(v).toLocaleString('es-ES'));

  useEffect(() => {
    if (valor === undefined) return;

    // Sin movimiento, o si la animación no puede correr: se planta el valor final.
    if (reducido) {
      cuenta.set(valor);
      return;
    }

    // Red de seguridad: si en 1,5 s el contador no ha entrado en vista (o el observer
    // no ha disparado), se enseña la cifra igualmente. Un número que se queda en 0
    // no es una animación pendiente, es un dato mal.
    const red = setTimeout(() => {
      if (cuenta.get() === 0) cuenta.set(valor);
    }, 1500);

    if (!enVista) return () => clearTimeout(red);

    const control = animate(cuenta, valor, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => {
      clearTimeout(red);
      control.stop();
    };
  }, [valor, enVista, reducido, cuenta]);

  if (valor === undefined) return <span className={className}>—</span>;

  return (
    <motion.span ref={ref} className={className}>
      {texto}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ *
 * Tarjeta que se inclina hacia el cursor
 * ------------------------------------------------------------------ */
export function Inclinable({
  children,
  className,
  intensidad = 6,
}: {
  children: ReactNode;
  className?: string;
  intensidad?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducido = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const muelle = { stiffness: 260, damping: 22, mass: 0.4 };
  const rotX = useSpring(useTransform(y, [-0.5, 0.5], [intensidad, -intensidad]), muelle);
  const rotY = useSpring(useTransform(x, [-0.5, 0.5], [-intensidad, intensidad]), muelle);

  // Solo con ratón: en táctil no hay hover y el giro se quedaría pegado.
  const conPuntero = () =>
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducido || !conPuntero() || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };

  const alSalir = () => {
    x.set(0);
    y.set(0);
  };

  if (reducido) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      onPointerMove={alMover}
      onPointerLeave={alSalir}
      style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * Titular que se revela palabra a palabra
 * ------------------------------------------------------------------ */
export function TituloPorPalabras({
  texto,
  className,
  resalta = [],
}: {
  texto: string;
  className?: string;
  /** Palabras que van en verde, para marcar el foco de la frase. */
  resalta?: string[];
}) {
  const limpia = (p: string) => p.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
  const marcadas = new Set(resalta.map(limpia));

  return (
    <motion.h2
      className={className}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ staggerChildren: 0.045 }}
    >
      {texto.split(' ').map((palabra, i) => (
        <motion.span
          key={`${palabra}-${i}`}
          className="inline-block"
          variants={{
            // Arranca tenue, no invisible: si la animación no corre, se lee igual.
            oculto: { opacity: 0.18, y: '0.28em' },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            },
          }}
        >
          <span className={marcadas.has(limpia(palabra)) ? 'text-verde' : undefined}>
            {palabra}
          </span>
          {i < texto.split(' ').length - 1 && ' '}
        </motion.span>
      ))}
    </motion.h2>
  );
}

/* ------------------------------------------------------------------ *
 * Punto que late — señal de "esto está vivo ahora mismo"
 * ------------------------------------------------------------------ */
export function PuntoLatido({ className = 'h-[7px] w-[7px]' }: { className?: string }) {
  const reducido = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      animate={reducido ? undefined : { opacity: [1, 0.35, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      className={`inline-block shrink-0 rounded-full bg-fluor ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Marquesina horizontal en bucle
 * ------------------------------------------------------------------ */
/**
 * Desfile continuo de palabras. La lista se pinta **dos veces** y el
 * desplazamiento va justo hasta el -50%: al reiniciarse, la segunda copia está
 * exactamente donde estaba la primera y el bucle no se nota.
 *
 * Con `prefers-reduced-motion` no se mueve: se queda la primera copia quieta,
 * que sigue diciendo lo mismo.
 */
export function Marquesina({ elementos }: { elementos: string[] }) {
  const reducido = useReducedMotion();
  const duplicados = [...elementos, ...elementos];

  // Ritmo constante independientemente de cuántas ciudades haya: si la lista
  // crece, la marquesina tarda más en dar la vuelta en vez de acelerarse.
  const duracion = Math.max(18, elementos.length * 3.2);

  return (
    <div className="overflow-hidden" aria-hidden="true">
      <motion.div
        animate={reducido ? undefined : { x: ['0%', '-50%'] }}
        transition={{ duration: duracion, ease: 'linear', repeat: Infinity }}
        className="flex w-max items-center gap-10 whitespace-nowrap"
      >
        {duplicados.map((elemento, i) => (
          <span key={`${elemento}-${i}`} className="inline-flex items-center gap-10">
            {elemento}
            <span className="opacity-40">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Parallax vertical ligado al scroll
 * ------------------------------------------------------------------ */
export function useParallax(referencia: React.RefObject<HTMLElement | null>, distancia = 60) {
  const reducido = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: referencia,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, reducido ? 0 : distancia]);
  return y as MotionValue<number>;
}
