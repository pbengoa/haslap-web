import { Router } from 'express';
import { clubes, eventos, membresias, nuevoId } from '../db.js';
import { serializarClub, serializarEvento } from '../serializers.js';
import { requiereAuth } from '../auth.js';

const router = Router();

/** GET /api/clubes — listado con búsqueda y filtro por ciudad. */
router.get('/', (req, res) => {
  const { q, ciudad, limite } = req.query;

  let lista = clubes.map((c) => serializarClub(c, req.usuario));

  if (q) {
    const termino = String(q).toLowerCase();
    lista = lista.filter((c) =>
      [c.nombre, c.ciudad, c.descripcion].some((campo) => campo.toLowerCase().includes(termino)),
    );
  }
  if (ciudad && ciudad !== 'todas') {
    lista = lista.filter((c) => c.ciudad.toLowerCase() === String(ciudad).toLowerCase());
  }

  lista.sort((a, b) => b.miembros - a.miembros);
  if (limite) lista = lista.slice(0, Number(limite));

  res.json({ total: lista.length, clubes: lista });
});

/** GET /api/clubes/:id — detalle + próximas salidas del club. */
router.get('/:id', (req, res) => {
  const club = clubes.find((c) => c.id === req.params.id || c.slug === req.params.id);
  if (!club) return res.status(404).json({ error: 'Club no encontrado.' });

  const proximasSalidas = eventos
    .filter((e) => e.clubId === club.id && new Date(e.fecha) >= new Date(Date.now() - 3600_000))
    .map((e) => serializarEvento(e, req.usuario))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  res.json({ club: serializarClub(club, req.usuario), proximasSalidas });
});

/** POST /api/clubes/:id/membresia — unirse al club. */
router.post('/:id/membresia', requiereAuth, (req, res) => {
  const club = clubes.find((c) => c.id === req.params.id || c.slug === req.params.id);
  if (!club) return res.status(404).json({ error: 'Club no encontrado.' });

  const yaEsMiembro = membresias.some(
    (m) => m.clubId === club.id && m.usuarioId === req.usuario.id,
  );
  if (yaEsMiembro) return res.status(409).json({ error: 'Ya eres miembro de este club.' });

  membresias.push({ id: nuevoId('m'), clubId: club.id, usuarioId: req.usuario.id });
  res.status(201).json({ club: serializarClub(club, req.usuario) });
});

/** DELETE /api/clubes/:id/membresia — salir del club. */
router.delete('/:id/membresia', requiereAuth, (req, res) => {
  const club = clubes.find((c) => c.id === req.params.id || c.slug === req.params.id);
  if (!club) return res.status(404).json({ error: 'Club no encontrado.' });

  const idx = membresias.findIndex((m) => m.clubId === club.id && m.usuarioId === req.usuario.id);
  if (idx === -1) return res.status(409).json({ error: 'No eras miembro de este club.' });

  membresias.splice(idx, 1);
  res.json({ club: serializarClub(club, req.usuario) });
});

export default router;
