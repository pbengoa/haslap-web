/**
 * API del MVP web de Haslap.
 * Data dummy en memoria — no hay base de datos todavía.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import cors from 'cors';

import { authOpcional, googleConfigurado } from './auth.js';
import rutasHaslapapp from './haslapapp/rutas.js';
import { haslapappConfigurado } from './haslapapp/cliente.js';
import authRouter from './routes/auth.js';
import eventosRouter from './routes/eventos.js';
import clubesRouter from './routes/clubes.js';
import miRouter from './routes/mi.js';
import { eventos, clubes, usuarios } from './db.js';

const app = express();
// API_PORT y no PORT: así ninguna herramienta que inyecte PORT (el dev server, un
// runner de previsualización...) se lleva por delante el puerto de la API.
// En un hosting el puerto lo impone la plataforma con PORT, así que se acepta
// como reserva; API_PORT sigue mandando en local.
const PORT = Number(process.env.API_PORT) || Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());
app.use(authOpcional);

/**
 * Dos orígenes de datos:
 *   - haslapapp: BFF contra el PrestaShop de PRE (si hay HASLAP_API_URL)
 *   - dummy:     seed en memoria, para trabajar sin backend
 * El BFF se monta primero y atiende todo lo que sabe resolver.
 */
if (haslapappConfigurado) {
  app.use('/api', rutasHaslapapp);
}

app.get('/api/salud', (_req, res) => {
  res.json({
    ok: true,
    entorno: 'desarrollo',
    google: googleConfigurado ? 'real' : 'demo',
    datos: { eventos: eventos.length, clubes: clubes.length, usuarios: usuarios.length },
  });
});

/**
 * Cifras agregadas para la landing. Salen de los datos reales del store, no
 * son texto fijo: si mañana hay 40 eventos, la home lo dice sola.
 */
app.get('/api/estadisticas', (_req, res) => {
  const ahora = Date.now();
  const abiertos = eventos.filter((e) => new Date(e.fecha).getTime() >= ahora);

  res.json({
    salidasAbiertas: abiertos.length,
    clubes: clubes.length,
    ciudades: [...new Set(eventos.map((e) => e.ciudad))].length,
    plazasDisponibles: abiertos.reduce((total, e) => total + e.plazas, 0),
  });
});

/** Ciudades y niveles disponibles, para los filtros del front. */
app.get('/api/meta', (_req, res) => {
  res.json({
    ciudades: [...new Set(eventos.map((e) => e.ciudad))].sort(),
    niveles: ['Principiante', 'Todos los niveles', 'Intermedio', 'Avanzado'],
  });
});

app.use('/api/auth', authRouter);
app.use('/api/eventos', eventosRouter);
app.use('/api/clubes', clubesRouter);
app.use('/api/mi', miRouter);

/**
 * En producción este mismo proceso sirve el front ya construido.
 *
 * No es una comodidad: el cliente llama a `/api` en relativo, así que front y
 * API tienen que compartir origen. En desarrollo eso lo resuelve el proxy de
 * Vite y `web/dist` no existe, así que este bloque no se monta.
 */
const DIST = fileURLToPath(new URL('../../web/dist', import.meta.url));

if (existsSync(DIST)) {
  app.use(express.static(DIST));
  // Cualquier ruta que no sea de la API la resuelve el router del navegador.
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(join(DIST, 'index.html')));
}

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

app.use((err, _req, res, _next) => {
  console.error('[haslap-api]', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`[haslap-api] escuchando en http://localhost:${PORT}`);
  if (haslapappConfigurado) {
    console.log(`[haslap-api] origen de datos: haslapapp → ${process.env.HASLAP_API_URL}`);
  } else {
    console.log('[haslap-api] origen de datos: dummy en memoria');
    console.log(`[haslap-api] login con Google en modo: ${googleConfigurado ? 'real' : 'demo'}`);
  }
});
