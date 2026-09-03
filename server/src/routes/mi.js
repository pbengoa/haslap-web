import { Router } from 'express';
import { eventos, clubes, inscripciones, membresias } from '../db.js';
import { serializarEvento, serializarClub } from '../serializers.js';
import { requiereAuth } from '../auth.js';

const router = Router();

router.use(requiereAuth);

/** GET /api/mi/eventos — "Mis eventos", separados en próximos y pasados. */
router.get('/eventos', (req, res) => {
  const mios = inscripciones
    .filter((i) => i.usuarioId === req.usuario.id)
    .map((i) => eventos.find((e) => e.id === i.eventoId))
    .filter(Boolean)
    .map((e) => serializarEvento(e, req.usuario));

  const ahora = Date.now();
  const proximos = mios
    .filter((e) => new Date(e.fecha).getTime() >= ahora)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const pasados = mios
    .filter((e) => new Date(e.fecha).getTime() < ahora)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  res.json({ proximos, pasados });
});

/** GET /api/mi/clubes — clubes a los que pertenezco. */
router.get('/clubes', (req, res) => {
  const mios = membresias
    .filter((m) => m.usuarioId === req.usuario.id)
    .map((m) => clubes.find((c) => c.id === m.clubId))
    .filter(Boolean)
    .map((c) => serializarClub(c, req.usuario));

  res.json({ clubes: mios });
});

/** GET /api/mi/eventos/organizados — eventos que yo he creado. */
router.get('/eventos/organizados', (req, res) => {
  const mios = eventos
    .filter((e) => e.organizadorId === req.usuario.id)
    .map((e) => serializarEvento(e, req.usuario))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  res.json({ eventos: mios });
});

export default router;
