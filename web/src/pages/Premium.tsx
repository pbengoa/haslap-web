import { useState } from 'react';
import { motion } from 'motion/react';
import { useAviso } from '../components/Aviso';
import {
  IconoCandado,
  IconoChat,
  IconoCheck,
  IconoDescarga,
  IconoGrafico,
  IconoPersonas,
} from '../components/Iconos';
import { alHacerScroll, contenedorStagger, resorte, subirYAparecer, tapBoton } from '../lib/animaciones';

const PLANES = [
  {
    id: 'organizador',
    etiqueta: 'Premium organizador',
    nombre: 'Organizador',
    precioMes: 9.99,
    resumen: 'Ideal para quienes organizan eventos con frecuencia.',
    ventajas: [
      'Evento destacado en búsquedas',
      'Portada personalizada del organizador',
      'URL personalizada (ej. haslap.com/tuclub)',
      'Estadísticas básicas (opcional)*',
      'Duplicar eventos en un clic',
      'Programar publicación de eventos',
      'Soporte prioritario',
    ],
  },
  {
    id: 'club',
    etiqueta: 'Premium club',
    nombre: 'Club',
    precioMes: 19.99,
    popular: true,
    resumen: 'Para clubes y comunidades que quieren más control y funciones.',
    ventajas: [
      'Todo lo del plan Organizador',
      'Varios administradores',
      'Eventos privados mediante enlace',
      'Formularios personalizados para apuntarse',
      'Exportar asistentes a CSV / Excel',
      'Integraciones (Zapier, Make, etc.)',
      'Soporte prioritario',
    ],
  },
];

const SOLO_APP = [
  { icono: <IconoPersonas className="h-5 w-5" />, titulo: 'Ver asistentes', texto: 'Consulta la lista completa de personas apuntadas a un evento.' },
  { icono: <IconoChat className="h-5 w-5" />, titulo: 'Chat', texto: 'Chatea con otros asistentes antes y después del evento.' },
  { icono: <IconoGrafico className="h-5 w-5" />, titulo: 'Estadísticas', texto: 'Kilómetros, ritmos y evolución de tus salidas.' },
  { icono: <IconoPersonas className="h-5 w-5" />, titulo: 'Seguidores', texto: 'Sigue a otros usuarios y recibe sus novedades.' },
];

export function Premium() {
  const [anual, setAnual] = useState(false);
  const aviso = useAviso();

  const precioDe = (mes: number) => (anual ? mes * 10 : mes);

  return (
    <div className="contenedor py-12">
      <motion.header
        initial="oculto"
        animate="visible"
        variants={contenedorStagger}
        className="text-center"
      >
        <motion.span
          variants={subirYAparecer}
          className="badge bg-verde-100 text-verde uppercase"
        >
          Premium
        </motion.span>
        <motion.h1
          variants={subirYAparecer}
          className="mt-4 text-[38px] leading-tight font-extrabold tracking-tight text-texto sm:text-[46px]"
        >
          Planes Premium
        </motion.h1>
        <motion.p
          variants={subirYAparecer}
          className="mx-auto mt-3 max-w-lg text-[16px] text-texto-suave"
        >
          Más herramientas para organizadores y clubes que quieren llevar su comunidad al siguiente
          nivel.
        </motion.p>

        {/* Conmutador mensual / anual */}
        <motion.div
          variants={subirYAparecer}
          className="mt-7 inline-flex items-center gap-1 rounded-full bg-linea-suave p-1"
        >
          {[
            { id: false, texto: 'Mensual' },
            { id: true, texto: 'Anual' },
          ].map((opcion) => (
            <button
              key={String(opcion.id)}
              type="button"
              onClick={() => setAnual(opcion.id)}
              className="relative rounded-full px-5 py-2 text-[13px] font-semibold transition-colors"
            >
              {anual === opcion.id && (
                <motion.span
                  layoutId="conmutador-premium"
                  transition={resorte}
                  className="absolute inset-0 rounded-full bg-white shadow-sm"
                />
              )}
              <span className={`relative ${anual === opcion.id ? 'text-texto' : 'text-texto-suave'}`}>
                {opcion.texto}
              </span>
            </button>
          ))}
          <span className="badge ml-1 bg-fluor text-texto">Ahorra 2 meses</span>
        </motion.div>
      </motion.header>

      {/* ---------- Planes ---------- */}
      <motion.div
        {...alHacerScroll}
        variants={contenedorStagger}
        className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2"
      >
        {PLANES.map((plan) => (
          <motion.article
            key={plan.id}
            variants={subirYAparecer}
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className={`tarjeta relative flex flex-col p-7 ${plan.popular ? 'ring-2 ring-verde' : ''}`}
          >
            {plan.popular && (
              <span className="badge absolute -top-3 right-6 bg-verde text-white">Popular</span>
            )}

            <p className="text-[11px] font-semibold tracking-wide text-verde uppercase">
              {plan.etiqueta}
            </p>
            <h2 className="mt-2 text-[26px] font-extrabold tracking-tight text-texto">
              {plan.nombre}
            </h2>

            <p className="mt-3 flex items-baseline gap-1.5">
              <motion.span
                key={`${plan.id}-${anual}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="text-[32px] font-extrabold text-texto"
              >
                {precioDe(plan.precioMes).toFixed(2).replace('.', ',')} €
              </motion.span>
              <span className="text-[14px] text-texto-suave">/ {anual ? 'año' : 'mes'}</span>
            </p>

            <p className="mt-2 text-[14px] text-texto-suave">{plan.resumen}</p>

            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.ventajas.map((ventaja) => (
                <li key={ventaja} className="flex items-start gap-2.5 text-[14px] text-texto-suave">
                  <IconoCheck className="mt-0.5 h-4 w-4 shrink-0 text-verde" />
                  {ventaja}
                </li>
              ))}
            </ul>

            <motion.button
              {...tapBoton}
              type="button"
              onClick={() => aviso('El pago de planes premium llega en la fase 2 del roadmap.')}
              className={`btn btn-lg mt-7 w-full ${plan.popular ? 'btn-acento' : 'btn-identidad'}`}
            >
              Elegir plan {plan.nombre}
            </motion.button>
          </motion.article>
        ))}
      </motion.div>

      <motion.p
        {...alHacerScroll}
        variants={subirYAparecer}
        className="mx-auto mt-6 max-w-4xl rounded-ds-md bg-linea-suave px-5 py-4 text-[13px] text-texto-suave"
      >
        * Las estadísticas básicas (visitas, clics, asistentes) son opcionales y pueden requerir
        mayor complejidad técnica en una primera versión.
      </motion.p>

      {/* ---------- Funciones solo en la app ---------- */}
      <motion.section {...alHacerScroll} variants={contenedorStagger} className="mt-16">
        <motion.h2
          variants={subirYAparecer}
          className="text-[24px] font-extrabold tracking-tight text-texto"
        >
          Funciones disponibles solo en la app
        </motion.h2>
        <motion.p variants={subirYAparecer} className="mt-1.5 text-[14px] text-texto-suave">
          La web sirve para descubrir e inscribirte. Todo lo social vive en la aplicación.
        </motion.p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SOLO_APP.map((funcion) => (
            <motion.article
              key={funcion.titulo}
              variants={subirYAparecer}
              whileHover={{ y: -4 }}
              className="tarjeta relative p-5"
            >
              <span className="absolute top-4 right-4 text-texto-tenue">
                <IconoCandado className="h-4 w-4" />
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-verde-50 text-verde">
                {funcion.icono}
              </span>
              <h3 className="mt-3.5 text-[15px] font-bold text-texto">{funcion.titulo}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-texto-suave">{funcion.texto}</p>
              <button
                type="button"
                onClick={() =>
                  alert('En producción esto abriría la ficha de Haslap en App Store / Google Play.')
                }
                className="btn btn-sm btn-fantasma mt-3 -ml-4"
              >
                <IconoDescarga className="h-4 w-4" />
                Descarga la app
              </button>
            </motion.article>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
