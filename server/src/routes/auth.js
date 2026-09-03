import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { usuarios, nuevoId } from '../db.js';
import {
  firmarToken,
  usuarioPublico,
  requiereAuth,
  verificarGoogleIdToken,
  googleConfigurado,
  GOOGLE_CLIENT_ID,
} from '../auth.js';

const router = Router();

const emailValido = (email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
const buscarPorEmail = (email) =>
  usuarios.find((u) => u.email.toLowerCase() === String(email).toLowerCase());

/**
 * Métodos de login disponibles.
 *
 * Tiene que devolver **la misma forma** que `/auth/config` del BFF
 * (`server/src/haslapapp/rutas.js`): el front lee `telefono`, `email` y `google`
 * sin distinguir el origen. Si una de las dos rutas se queda corta, la pantalla
 * de acceso revienta solo en ese modo.
 */
router.get('/config', (_req, res) => {
  res.json({
    telefono: {
      // El seed no manda SMS: no tiene sentido ofrecer el acceso por teléfono.
      habilitado: false,
      motivo: 'Con datos de prueba se entra con email.',
    },
    email: { habilitado: true },
    google: {
      habilitado: true,
      // Con clientId real el front pinta el botón oficial de Google Identity Services.
      // Sin él, cae al modo demo para poder probar el flujo sin credenciales.
      modo: googleConfigurado ? 'real' : 'demo',
      clientId: GOOGLE_CLIENT_ID || null,
      motivo: null,
    },
    origen: 'dummy',
  });
});

/** Registro con email y contraseña. */
router.post('/registro', async (req, res) => {
  const { nombre, email, password, ciudad } = req.body || {};

  if (!nombre || String(nombre).trim().length < 2) {
    return res.status(400).json({ error: 'Escribe tu nombre.' });
  }
  if (!emailValido(email)) {
    return res.status(400).json({ error: 'Introduce un email válido.' });
  }
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }
  if (buscarPorEmail(email)) {
    return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
  }

  const usuario = {
    id: nuevoId('u'),
    nombre: String(nombre).trim(),
    email: String(email).toLowerCase(),
    passwordHash: await bcrypt.hash(String(password), 10),
    avatar: null,
    ciudad: ciudad || 'Madrid',
    proveedor: 'email',
  };
  usuarios.push(usuario);

  res.status(201).json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
});

/** Login con email y contraseña. */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const usuario = buscarPorEmail(email || '');

  // Mismo mensaje para email inexistente y contraseña incorrecta.
  const credencialesInvalidas = () =>
    res.status(401).json({ error: 'Email o contraseña incorrectos.' });

  if (!usuario || !usuario.passwordHash) return credencialesInvalidas();
  const ok = await bcrypt.compare(String(password || ''), usuario.passwordHash);
  if (!ok) return credencialesInvalidas();

  res.json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
});

/**
 * Login con Google.
 * - modo real: recibe `credential` (ID token de Google Identity Services) y lo verifica.
 * - modo demo: sin GOOGLE_CLIENT_ID, acepta un perfil simulado para poder probar el flujo.
 */
router.post('/google', async (req, res) => {
  try {
    let perfil;

    if (googleConfigurado) {
      const { credential } = req.body || {};
      if (!credential) {
        return res.status(400).json({ error: 'Falta el credential de Google.' });
      }
      perfil = await verificarGoogleIdToken(credential);
    } else {
      // Modo demo: nunca se activa si hay GOOGLE_CLIENT_ID configurado.
      const demo = req.body?.demo || {};
      perfil = {
        googleId: `demo-${demo.email || 'runner'}`,
        email: String(demo.email || 'runner.demo@gmail.com').toLowerCase(),
        nombre: demo.nombre || 'Runner Demo',
        avatar: demo.avatar || 'https://i.pravatar.cc/160?img=68',
      };
      if (!emailValido(perfil.email)) {
        return res.status(400).json({ error: 'Introduce un email válido.' });
      }
    }

    let usuario = buscarPorEmail(perfil.email);

    if (usuario) {
      // Cuenta existente: se vincula con Google y se completan datos que falten.
      usuario.googleId = perfil.googleId;
      usuario.avatar = usuario.avatar || perfil.avatar;
    } else {
      usuario = {
        id: nuevoId('u'),
        nombre: perfil.nombre,
        email: perfil.email,
        passwordHash: null,
        avatar: perfil.avatar,
        ciudad: 'Madrid',
        proveedor: 'google',
        googleId: perfil.googleId,
      };
      usuarios.push(usuario);
    }

    res.json({
      token: firmarToken(usuario),
      usuario: usuarioPublico(usuario),
      modo: googleConfigurado ? 'real' : 'demo',
    });
  } catch (err) {
    res.status(401).json({ error: 'No pudimos verificar tu cuenta de Google.', detalle: err.message });
  }
});

/** Usuario de la sesión actual. */
router.get('/yo', requiereAuth, (req, res) => {
  res.json({ usuario: usuarioPublico(req.usuario) });
});

export default router;
