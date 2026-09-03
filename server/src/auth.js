/**
 * Autenticación: sesión por JWT, login con email/contraseña y login con Google.
 */
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { usuarios } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'haslap-mvp-secret-solo-para-desarrollo';
const JWT_EXPIRA = '7d';

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const googleConfigurado = Boolean(GOOGLE_CLIENT_ID);

const googleClient = googleConfigurado ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export function firmarToken(usuario) {
  return jwt.sign({ sub: usuario.id, email: usuario.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRA,
  });
}

/** Quita el passwordHash antes de devolver un usuario por la API. */
export function usuarioPublico(usuario) {
  if (!usuario) return null;
  const { passwordHash, googleId, ...resto } = usuario;
  return resto;
}

function usuarioDesdeAuthHeader(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    return usuarios.find((u) => u.id === payload.sub) || null;
  } catch {
    return null;
  }
}

/** Adjunta req.usuario si el token es válido; nunca corta la petición. */
export function authOpcional(req, _res, next) {
  req.usuario = usuarioDesdeAuthHeader(req);
  next();
}

/** Exige sesión válida. */
export function requiereAuth(req, res, next) {
  req.usuario = req.usuario || usuarioDesdeAuthHeader(req);
  if (!req.usuario) {
    return res.status(401).json({ error: 'Necesitas iniciar sesión para hacer esto.' });
  }
  next();
}

/**
 * Verifica el ID token que devuelve Google Identity Services.
 * Solo se usa cuando GOOGLE_CLIENT_ID está configurado.
 */
export async function verificarGoogleIdToken(credential) {
  if (!googleClient) {
    throw new Error('Google no está configurado en el servidor.');
  }
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new Error('Google no devolvió un email.');
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    nombre: payload.name || payload.email.split('@')[0],
    avatar: payload.picture || null,
  };
}
