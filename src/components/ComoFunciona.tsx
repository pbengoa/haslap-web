import { motion } from 'motion/react';
import { alHacerScroll, contenedorStagger, subirYAparecer } from '../lib/animaciones';
import { DemoApp, DemoApuntarse, DemoFiltrar } from './Demostraciones';

/**
 * "Cómo funciona" en tres tarjetas: texto arriba, demostración dentro.
 *
 * Sustituye a las tres columnas de texto que había antes. La diferencia no es
 * estética: cada bloque **enseña** lo que dice en vez de contarlo, y el tercero
 * explica la frontera web/app en positivo —lo que la app te da— en lugar de
 * presentarla como una limitación. Por eso es el único en verde oscuro: no es
 * un paso menos, es otro sitio.
 *
 * La sección va a sangre sobre superficie gris para separar el "cómo" del
 * catálogo de arriba sin necesidad de más titulares.
 */

const PASOS = [
  {
    numero: '01',
    titulo: 'Filtra hasta que encaje',
    texto:
      'Ciudad, nivel, terreno y plazas libres. El ritmo va escrito en la tarjeta, no en la letra pequeña.',
    demo: <DemoFiltrar />,
    oscuro: false,
  },
  {
    numero: '02',
    titulo: 'Apúntate en dos clics',
    texto:
      'Entras con tu teléfono, el mismo de la app. Sin formularios largos y sin esperar a que nadie te acepte.',
    demo: <DemoApuntarse />,
    oscuro: false,
  },
  {
    numero: '03',
    titulo: 'El día de la salida, la app',
    texto:
      'La web es para encontrar y apuntarte. Ver quién viene, hablar con el grupo y sumar kilómetros pasa en la app.',
    demo: <DemoApp oscuro />,
    oscuro: true,
  },
];

export function ComoFunciona() {
  return (
    <section className="mt-24 border-y border-linea bg-superficie py-16 sm:py-20">
      <div className="contenedor">
        <motion.div {...alHacerScroll} variants={contenedorStagger} className="max-w-2xl">
          <motion.p
            variants={subirYAparecer}
            className="text-[12px] font-extrabold tracking-[0.12em] text-verde uppercase"
          >
            Cómo funciona
          </motion.p>
          <motion.h2
            variants={subirYAparecer}
            className="mt-4 text-[30px] leading-[1.05] font-black tracking-[-0.04em] text-texto sm:text-[40px]"
          >
            De no conocer a nadie a estar corriendo el sábado
          </motion.h2>
        </motion.div>

        <motion.div
          {...alHacerScroll}
          variants={contenedorStagger}
          className="mt-9 grid gap-5 lg:grid-cols-3"
        >
          {PASOS.map((paso) => (
            <motion.article
              key={paso.numero}
              variants={subirYAparecer}
              className={`flex flex-col rounded-ds-xl border p-6 ${
                paso.oscuro ? 'border-verde-900 bg-verde-900' : 'border-linea bg-white'
              }`}
            >
              <span
                className={`text-[13px] font-black tracking-[0.08em] ${
                  paso.oscuro ? 'text-fluor' : 'text-fluor-600'
                }`}
              >
                {paso.numero}
              </span>
              <h3
                className={`mt-2.5 text-[20px] font-extrabold tracking-tight ${
                  paso.oscuro ? 'text-white' : 'text-texto'
                }`}
              >
                {paso.titulo}
              </h3>
              <p
                className={`mt-2 flex-1 text-[14px] leading-relaxed ${
                  paso.oscuro ? 'text-white/70' : 'text-texto-suave'
                }`}
              >
                {paso.texto}
              </p>

              <div className="mt-5" aria-hidden="true">
                {paso.demo}
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
