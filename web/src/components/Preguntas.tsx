import { useState } from 'react';
import { motion } from 'motion/react';
import { alHacerScroll, contenedorStagger, resorte, subirYAparecer } from '../lib/animaciones';
import { IconoMas } from './Iconos';

/**
 * Preguntas frecuentes.
 *
 * No es relleno: son las objeciones reales que frenan a alguien antes de
 * apuntarse a correr con desconocidos. La primera —«¿tengo que ser rápido?»— es
 * la que más gente para, y por eso va primero.
 *
 * El desplegable **no anima la altura**: la respuesta aparece con su altura
 * natural y solo se le anima la opacidad. Si la animación no llega a correr, la
 * respuesta se lee igual — una animación no puede dejar contenido inaccesible.
 */
const PREGUNTAS = [
  {
    p: '¿Tengo que ser rápido para apuntarme?',
    r: 'No. Cada salida indica su nivel y su ritmo antes de que te apuntes, así que sabes si te encaja sin tener que preguntar. Hay salidas de nivel principiante en las que nadie se queda atrás.',
  },
  {
    p: '¿Y si no conozco a nadie?',
    r: 'Es el caso normal, no la excepción: casi todo el mundo llega a su primera salida sin conocer a nadie. Para eso existe Haslap.',
  },
  {
    p: '¿Cuesta dinero?',
    r: 'Descubrir salidas y apuntarte no cuesta nada. Algunas salidas concretas tienen entrada de pago —carreras organizadas, sobre todo— y en ese caso lo verás indicado en la propia salida antes de apuntarte.',
  },
  {
    p: '¿Necesito la app para apuntarme?',
    r: 'No, puedes apuntarte desde la web. La app es para el día de la salida: ver quién viene, hablar con el grupo y seguir tus kilómetros.',
  },
  {
    p: 'Si me registro en la web, ¿tengo que registrarme otra vez en la app?',
    r: 'No. Se entra con el mismo teléfono en los dos sitios, así que es la misma cuenta. Lo que hagas en la web lo verás en la app.',
  },
  {
    p: '¿Puedo organizar mis propias salidas?',
    r: 'Sí. Publicas la salida con su día, punto de encuentro, distancia y nivel, y quien quiera se apunta. No hace falta tener un club.',
  },
];

export function Preguntas() {
  const [abierta, setAbierta] = useState<number | null>(0);

  return (
    <motion.section
      {...alHacerScroll}
      variants={contenedorStagger}
      className="mt-24 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:gap-14"
    >
      <motion.div variants={subirYAparecer}>
        <p className="text-[12px] font-extrabold tracking-[0.12em] text-verde uppercase">
          Antes de que preguntes
        </p>
        <h2 className="mt-4 text-[26px] leading-[1.08] font-black tracking-[-0.035em] text-texto sm:text-[34px]">
          Lo que suele frenar a la gente
        </h2>
      </motion.div>

      <motion.ul variants={subirYAparecer} className="divide-y divide-linea border-y border-linea">
        {PREGUNTAS.map((item, i) => {
          const estaAbierta = abierta === i;
          return (
            <li key={item.p}>
              <button
                type="button"
                onClick={() => setAbierta(estaAbierta ? null : i)}
                aria-expanded={estaAbierta}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-[16px] leading-snug font-semibold text-texto">{item.p}</span>
                <motion.span
                  animate={{ rotate: estaAbierta ? 45 : 0 }}
                  transition={resorte}
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
                    estaAbierta ? 'bg-verde text-white' : 'bg-linea-suave text-texto-suave'
                  }`}
                >
                  <IconoMas className="h-4 w-4" />
                </motion.span>
              </button>

              {estaAbierta && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-2xl pb-6 text-[15px] leading-relaxed text-texto-suave"
                >
                  {item.r}
                </motion.p>
              )}
            </li>
          );
        })}
      </motion.ul>
    </motion.section>
  );
}
