import { motion } from 'motion/react';
import { IconoCandado, IconoDescarga, IconoMovil } from './Iconos';
import { alHacerScroll, subirYAparecer, tapBoton } from '../lib/animaciones';

/**
 * La web es la parte funcional (descubrir + inscribirse). Estadísticas y funciones
 * sociales viven solo en la app, así que aquí siempre se empuja a la descarga.
 */

export function BannerDescargaApp({
  titulo = 'Descarga la app para ver quién asiste y acceder a funciones sociales',
  texto = 'Chatea con otros runners, recibe notificaciones y mucho más.',
}: {
  titulo?: string;
  texto?: string;
}) {
  // La superficie es identidad (verde) y el flúor se reserva para el botón: así el
  // acento marca la acción concreta y no una banda entera.
  return (
    <motion.aside
      {...alHacerScroll}
      variants={subirYAparecer}
      className="flex flex-col gap-4 rounded-ds-lg bg-verde p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="flex items-start gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-ds-md bg-white/15 text-fluor">
          <IconoMovil className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[15px] leading-snug font-bold text-white">{titulo}</p>
          <p className="mt-0.5 text-[13px] text-white/70">{texto}</p>
        </div>
      </div>
      <motion.button
        {...tapBoton}
        type="button"
        onClick={() => alert('En producción esto abriría la ficha de Haslap en App Store / Google Play.')}
        className="btn btn-md btn-acento shrink-0"
      >
        <IconoDescarga className="h-4 w-4" />
        Descargar app
      </motion.button>
    </motion.aside>
  );
}

/**
 * Tarjeta de estadísticas bloqueada: se ve la forma del dato, no el dato.
 * Es la manera de dejar claro que existe, pero que se consulta en la app.
 */
export function EstadisticasBloqueadas({
  titulo = 'Estadísticas del evento',
  metricas = ['Visitas a la página', 'Clics en "Unirme"', 'Perfil de asistentes'],
}: {
  titulo?: string;
  metricas?: string[];
}) {
  return (
    <motion.section
      {...alHacerScroll}
      variants={subirYAparecer}
      className="tarjeta relative overflow-hidden p-5"
      aria-label={`${titulo} — disponible en la app`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-bold text-texto">{titulo}</h3>
        <span className="badge bg-linea-suave text-texto-suave">
          <IconoCandado className="h-3.5 w-3.5" />
          Solo en la app
        </span>
      </div>

      {/* Placeholders difuminados: sugieren el dato sin mostrarlo. */}
      <div className="space-y-3" aria-hidden="true">
        {metricas.map((metrica, i) => (
          <div key={metrica} className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-texto-suave">{metrica}</span>
            <span
              className="h-5 rounded-full bg-linea blur-[3px]"
              style={{ width: `${64 - i * 12}px` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-linea pt-4">
        <p className="text-[13px] text-texto-suave">
          Las estadísticas y las funciones sociales están disponibles en la app de Haslap.
        </p>
        <motion.button
          {...tapBoton}
          type="button"
          onClick={() => alert('En producción esto abriría la ficha de Haslap en App Store / Google Play.')}
          className="btn btn-sm btn-contorno mt-3"
        >
          <IconoDescarga className="h-4 w-4" />
          Descargar app para más información
        </motion.button>
      </div>
    </motion.section>
  );
}

/** Bloque "¿Quién se apunta?" del mockup de detalle de evento. */
export function QuienSeApunta() {
  return (
    <div className="flex flex-col gap-4 rounded-ds-lg bg-verde-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3.5">
        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-verde/15 text-verde">
          <IconoCandado className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[15px] font-bold text-texto">¿Quién se apunta?</p>
          <p className="mt-0.5 max-w-md text-[13px] text-texto-suave">
            Para ver los asistentes y chatear con el grupo, descarga la app de Haslap.
          </p>
        </div>
      </div>
      <motion.button
        {...tapBoton}
        type="button"
        onClick={() => alert('En producción esto abriría la ficha de Haslap en App Store / Google Play.')}
        className="btn btn-md btn-identidad shrink-0"
      >
        Descargar app
      </motion.button>
    </div>
  );
}
