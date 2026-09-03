/**
 * Cálculo de los campos derivados que consume el front (asistentes, plazas, si estoy inscrito...).
 */
import { usuarios, clubes, inscripciones, membresias, asistentesBase } from './db.js';

function organizadorDe(id) {
  const u = usuarios.find((x) => x.id === id);
  if (!u) return null;
  return { id: u.id, nombre: u.nombre, avatar: u.avatar, ciudad: u.ciudad };
}

export function contarAsistentes(eventoId) {
  const base = asistentesBase[eventoId] ?? 0;
  const reales = inscripciones.filter((i) => i.eventoId === eventoId).length;
  return base + reales;
}

export function serializarEvento(evento, usuarioActual = null) {
  const asistentes = contarAsistentes(evento.id);
  const club = clubes.find((c) => c.id === evento.clubId) || null;

  return {
    ...evento,
    asistentes,
    plazasDisponibles: Math.max(evento.plazas - asistentes, 0),
    completo: asistentes >= evento.plazas,
    gratis: evento.precio === 0,
    organizador: organizadorDe(evento.organizadorId),
    club: club ? { id: club.id, nombre: club.nombre, iniciales: club.iniciales, color: club.color } : null,
    inscrito: usuarioActual
      ? inscripciones.some((i) => i.eventoId === evento.id && i.usuarioId === usuarioActual.id)
      : false,
  };
}

export function serializarClub(club, usuarioActual = null) {
  const miembrosReales = membresias.filter((m) => m.clubId === club.id).length;
  return {
    ...club,
    miembros: club.miembros + miembrosReales,
    organizador: organizadorDe(club.organizadorId),
    esMiembro: usuarioActual
      ? membresias.some((m) => m.clubId === club.id && m.usuarioId === usuarioActual.id)
      : false,
  };
}
