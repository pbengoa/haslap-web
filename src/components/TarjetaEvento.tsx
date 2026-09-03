import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { Evento } from '../lib/tipos';
import { aforo, etiquetaFecha, fechaCorta, hora, precio } from '../lib/formato';
import { subirYAparecer } from '../lib/animaciones';
import { IconoCalendario, IconoPersonas, IconoReloj, IconoUbicacion } from './Iconos';
import { Portada } from './Portada';
import { Inclinable } from './Movimiento';

export function TarjetaEvento({
  evento,
  onUnirse,
  ocupado = false,
}: {
  evento: Evento;
  onUnirse?: (evento: Evento) => void;
  ocupado?: boolean;
}) {
  // El flúor solo marca urgencia real (hoy / mañana). Si lo llevaran todas las
  // tarjetas dejaría de guiar la mirada y sería ruido de fondo.
  const etiqueta = etiquetaFecha(evento.fecha);
  const esInminente = etiqueta === 'Hoy' || etiqueta === 'Mañana';

  return (
    <Inclinable className="h-full" intensidad={5}>
    <motion.article
      variants={subirYAparecer}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="tarjeta group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-card-hover"
    >
      <Link to={`/eventos/${evento.slug}`} className="relative block">
        <Portada
          src={evento.portada}
          alt={evento.titulo}
          className="h-40 w-full"
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`badge absolute top-3 left-3 uppercase ${
            esInminente ? 'bg-fluor text-texto' : 'bg-white/95 text-texto-suave'
          }`}
        >
          {etiqueta}
        </span>
        {evento.completo && (
          <span className="badge absolute top-3 right-3 bg-texto text-white">Completo</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/eventos/${evento.slug}`} className="min-w-0">
          <h3 className="truncate text-[15px] font-bold text-texto group-hover:text-verde">
            {evento.titulo}
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-texto-suave">{evento.lugar}</p>
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-texto-suave">
          <span className="inline-flex items-center gap-1.5">
            <IconoCalendario className="h-3.5 w-3.5" />
            {fechaCorta(evento.fecha)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconoReloj className="h-3.5 w-3.5" />
            {hora(evento.fecha)}
          </span>
          {evento.ciudad && (
            <span className="inline-flex items-center gap-1.5">
              <IconoUbicacion className="h-3.5 w-3.5" />
              {evento.ciudad}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-linea-suave pt-3.5">
          {evento.nivel ? (
            <div className="min-w-0">
              <p className="text-[11px] text-texto-tenue">Nivel</p>
              <p className="truncate text-[13px] font-semibold text-verde">{evento.nivel}</p>
            </div>
          ) : evento.distanciaKm ? (
            <div className="min-w-0">
              <p className="text-[11px] text-texto-tenue">Distancia</p>
              <p className="truncate text-[13px] font-semibold text-verde">{evento.distanciaKm} km</p>
            </div>
          ) : (
            <span />
          )}
          <div className="text-center">
            <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-texto-suave">
              <IconoPersonas className="h-3.5 w-3.5" />
              {aforo(evento.asistentes, evento.plazas)}
            </p>
            <p className="text-[11px] text-texto-tenue">{precio(evento.precio)}</p>
          </div>

          {onUnirse ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              disabled={ocupado || (evento.completo && !evento.inscrito)}
              onClick={() => onUnirse(evento)}
              className={`btn btn-sm shrink-0 ${evento.inscrito ? 'btn-contorno' : 'btn-identidad'}`}
            >
              {evento.inscrito ? 'Apuntado' : evento.completo ? 'Completo' : 'Unirme'}
            </motion.button>
          ) : (
            <Link to={`/eventos/${evento.slug}`} className="btn btn-sm btn-identidad shrink-0">
              Ver evento
            </Link>
          )}
        </div>
      </div>
    </motion.article>
    </Inclinable>
  );
}
