import { Router } from 'express';
import { eventos, inscripciones, nuevoId } from '../db.js';
import { serializarEvento } from '../serializers.js';
import { requiereAuth } from '../auth.js';

const router = Router();

const inicioDelDia = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** Filtros de la barra de chips: hoy / mañana / fin de semana. */
function pasaFiltroFecha(evento, cuando) {
  if (!cuando || cuando === 'todos') return true;

  const fecha = new Date(evento.fecha);
  const hoy = inicioDelDia(new Date());
  const dias = Math.round((inicioDelDia(fecha) - hoy) / 86400000);

  if (cuando === 'hoy') return dias === 0;
  if (cuando === 'manana') return dias === 1;
  if (cuando === 'finde') {
    // Sábado o domingo dentro de los próximos 7 días.
    const diaSemana = fecha.getDay();
    return dias >= 0 && dias <= 7 && (diaSemana === 0 || diaSemana === 6);
  }
  return true;
}

/** GET /api/eventos — listado con filtros y búsqueda. */
router.get('/', (req, res) => {
  const { q, ciudad, nivel, cuando, gratis, conPlazas, clubId, destacados, limite } = req.query;

  let lista = eventos
    .map((e) => serializarEvento(e, req.usuario))
    .filter((e) => new Date(e.fecha) >= new Date(Date.now() - 3600_000));

  if (q) {
    const termino = String(q).toLowerCase();
    lista = lista.filter((e) =>
      [e.titulo, e.resumen, e.ciudad, e.lugar, e.club?.nombre]
        .filter(Boolean)
        .some((campo) => campo.toLowerCase().includes(termino)),
    );
  }
  if (ciudad && ciudad !== 'todas') {
    lista = lista.filter((e) => e.ciudad.toLowerCase() === String(ciudad).toLowerCase());
  }
  if (nivel && nivel !== 'todos') {
    lista = lista.filter((e) => e.nivel.toLowerCase() === String(nivel).toLowerCase());
  }
  if (clubId) lista = lista.filter((e) => e.clubId === clubId);
  if (gratis === 'true') lista = lista.filter((e) => e.gratis);
  if (conPlazas === 'true') lista = lista.filter((e) => !e.completo);
  if (destacados === 'true') lista = lista.filter((e) => e.destacado);
  if (cuando) lista = lista.filter((e) => pasaFiltroFecha(e, cuando));

  lista.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  if (limite) lista = lista.slice(0, Number(limite));

  res.json({ total: lista.length, eventos: lista });
});

/** GET /api/eventos/:id — acepta id o slug. */
router.get('/:id', (req, res) => {
  const evento = eventos.find((e) => e.id === req.params.id || e.slug === req.params.id);
  if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' });
  res.json({ evento: serializarEvento(evento, req.usuario) });
});

/** POST /api/eventos/:id/inscripcion — unirse al evento. */
router.post('/:id/inscripcion', requiereAuth, (req, res) => {
  const evento = eventos.find((e) => e.id === req.params.id || e.slug === req.params.id);
  if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' });

  const yaInscrito = inscripciones.some(
    (i) => i.eventoId === evento.id && i.usuarioId === req.usuario.id,
  );
  if (yaInscrito) {
    return res.status(409).json({ error: 'Ya estás inscrito en este evento.' });
  }

  const serializado = serializarEvento(evento, req.usuario);
  if (serializado.completo) {
    return res.status(409).json({ error: 'Este evento ya no tiene plazas disponibles.' });
  }

  inscripciones.push({
    id: nuevoId('i'),
    eventoId: evento.id,
    usuarioId: req.usuario.id,
    creadoEn: new Date().toISOString(),
  });

  res.status(201).json({ evento: serializarEvento(evento, req.usuario) });
});

/** DELETE /api/eventos/:id/inscripcion — cancelar inscripción. */
router.delete('/:id/inscripcion', requiereAuth, (req, res) => {
  const evento = eventos.find((e) => e.id === req.params.id || e.slug === req.params.id);
  if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' });

  const idx = inscripciones.findIndex(
    (i) => i.eventoId === evento.id && i.usuarioId === req.usuario.id,
  );
  if (idx === -1) return res.status(409).json({ error: 'No estabas inscrito en este evento.' });

  inscripciones.splice(idx, 1);
  res.json({ evento: serializarEvento(evento, req.usuario) });
});

/** POST /api/eventos — crear evento (wizard del mockup). */
router.post('/', requiereAuth, (req, res) => {
  const { titulo, descripcion, fecha, ciudad, lugar, nivel, distanciaKm, plazas, precio, clubId } =
    req.body || {};

  if (!titulo || String(titulo).trim().length < 4) {
    return res.status(400).json({ error: 'El título necesita al menos 4 caracteres.' });
  }
  if (!fecha || Number.isNaN(Date.parse(fecha))) {
    return res.status(400).json({ error: 'Selecciona una fecha y hora válidas.' });
  }
  if (!ciudad) return res.status(400).json({ error: 'Indica la ciudad.' });

  const texto = String(descripcion || '').trim();
  const evento = {
    id: nuevoId('e'),
    slug: String(titulo)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''),
    titulo: String(titulo).trim(),
    resumen: texto.slice(0, 140) || 'Nueva salida creada desde la web de Haslap.',
    descripcion: texto || 'Nueva salida creada desde la web de Haslap.',
    fecha: new Date(fecha).toISOString(),
    ciudad: String(ciudad),
    lugar: lugar || ciudad,
    direccion: lugar || ciudad,
    nivel: nivel || 'Todos los niveles',
    distanciaKm: Number(distanciaKm) || 10,
    ritmo: 'A confirmar',
    terreno: 'A confirmar',
    precio: Number(precio) || 0,
    plazas: Number(plazas) || 30,
    portada:
      'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=1200&q=70',
    organizadorId: req.usuario.id,
    clubId: clubId || null,
    destacado: false,
  };

  eventos.push(evento);
  res.status(201).json({ evento: serializarEvento(evento, req.usuario) });
});

export default router;
