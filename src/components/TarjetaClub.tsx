import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { Club } from '../lib/tipos';
import { subirYAparecer } from '../lib/animaciones';
import { IconoPersonas } from './Iconos';

/** Cuadro con las iniciales del club, como en el mockup de "Clubes populares". */
export function EscudoClub({ club, className = '' }: { club: Club; className?: string }) {
  const textoOscuro = club.color.toLowerCase() === '#d8ff2a';
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-ds-md text-center leading-[1.05] font-extrabold ${className}`}
      style={{ backgroundColor: club.color, color: textoOscuro ? 'var(--color-texto)' : '#FFFFFF' }}
      aria-hidden="true"
    >
      {club.iniciales.split(' ').map((parte) => (
        <span key={parte} className="block">
          {parte}
        </span>
      ))}
    </span>
  );
}

export function TarjetaClub({
  club,
  onUnirse,
  ocupado = false,
}: {
  club: Club;
  onUnirse?: (club: Club) => void;
  ocupado?: boolean;
}) {
  return (
    <motion.article
      variants={subirYAparecer}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="tarjeta flex items-center gap-4 p-4 transition-shadow hover:shadow-card-hover"
    >
      <Link to={`/clubes/${club.slug}`} className="shrink-0">
        <EscudoClub club={club} className="h-14 w-14 text-[10px]" />
      </Link>

      <div className="min-w-0 flex-1">
        <Link to={`/clubes/${club.slug}`}>
          <h3 className="truncate text-[15px] font-bold text-texto hover:text-verde">
            {club.nombre}
          </h3>
        </Link>
        <p className="text-[13px] text-texto-suave">{club.ciudad}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-texto-suave">
          <span className="inline-flex items-center gap-1.5">
            <IconoPersonas className="h-3.5 w-3.5" />
            {club.miembros.toLocaleString('es-ES')}
          </span>
          {club.salidasPorSemana !== null && (
            <>
              <span className="text-linea">·</span>
              <span>{club.salidasPorSemana} salidas / semana</span>
            </>
          )}
          {club.nivel && (
            <>
              <span className="text-linea">·</span>
              <span className="font-semibold text-verde">{club.nivel}</span>
            </>
          )}
        </div>
      </div>

      {onUnirse ? (
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          disabled={ocupado}
          onClick={() => onUnirse(club)}
          className={`btn btn-sm shrink-0 ${club.esMiembro ? 'btn-contorno' : 'btn-identidad'}`}
        >
          {club.esMiembro ? 'Miembro' : 'Unirse'}
        </motion.button>
      ) : (
        <Link to={`/clubes/${club.slug}`} className="btn btn-sm btn-identidad shrink-0">
          Ver club
        </Link>
      )}
    </motion.article>
  );
}
