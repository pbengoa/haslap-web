/**
 * Presets de animación compartidos (librería `motion`).
 * Todo pasa por MotionConfig reducedMotion="user", así que se desactiva solo
 * si el sistema del usuario pide menos movimiento.
 */
import type { Transition, Variants } from 'motion/react';

export const suave: Transition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] };
export const resorte: Transition = { type: 'spring', stiffness: 380, damping: 30 };

/** Contenedor que va soltando a sus hijos uno detrás de otro. */
export const contenedorStagger: Variants = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/** Entrada estándar: aparece subiendo. */
export const subirYAparecer: Variants = {
  oculto: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: suave },
};

export const aparecer: Variants = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: suave },
};

export const entrarDesdeIzquierda: Variants = {
  oculto: { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0, transition: suave },
};

/** Entrada de cada página del router (solo entrada: ver el comentario en App.tsx). */
export const transicionPagina: Variants = {
  oculto: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

/** Se dispara al entrar en pantalla, una sola vez. */
export const alHacerScroll = {
  initial: 'oculto',
  whileInView: 'visible',
  viewport: { once: true, amount: 0.15 },
} as const;

export const tapBoton = { whileTap: { scale: 0.97 }, whileHover: { scale: 1.02 } } as const;
