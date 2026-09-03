# Haslap — web

Front del MVP web de Haslap: descubrir salidas de running, ver clubes e
inscribirse. React 19 + Vite + Tailwind v4 + `motion`.

## Arrancar

```bash
nvm use && npm install && npm run dev
```

Web en http://localhost:5173.

## Necesita una API

Este repo es **solo el front**. No funciona solo: el navegador no puede hablar
con el backend de PrestaShop directamente —la cookie de sesión es
`SameSite=Lax` y no viaja cross-site— y además la forma en que responde no es la
que consume esta interfaz. Entre medias va un BFF en Node, que vive fuera de
este repositorio.

| Situación | Qué configurar |
|---|---|
| Desarrollo | Nada. El proxy de Vite reenvía `/api` a `http://localhost:4000` |
| Front desplegado por su cuenta | `VITE_API_URL` con el dominio del servidor |

Sin API el catálogo aparece vacío y el acceso falla.

## Variables

Copia `.env.example` a `.env`. Todas se leen **al construir**, así que un cambio
obliga a volver a construir.

- `VITE_API_URL` — dónde vive la API. Vacío = mismo origen.
- `VITE_FIREBASE_*` — acceso por teléfono. Son públicas por diseño; la seguridad
  está en los dominios autorizados de Firebase, no en ocultarlas.

## Antes de dar algo por terminado

- `npx tsc -b` sin errores.
- `npm run build` pasa.
- Revisa la pantalla en el navegador, no solo el código.

## Reglas que no se rompen

1. **La web no muestra estadísticas ni funciones sociales.** Eso vive en la app.
   Cuando una pantalla las necesite, se enseña el bloque bloqueado con CTA de
   descarga (`components/BloqueadoEnApp.tsx`).
2. **El color sigue la regla 60/25/10/5.** Blanco domina, verde `#4A7D76` es
   identidad, el texto nunca es negro puro y el flúor `#D8FF2A` es acento
   escaso: uno o dos por pantalla.
3. **Nada de datos inventados en pantalla.** Cifras y textos solo si son reales
   o vienen del API.
4. **Las animaciones nunca bloquean el render.** Si una animación no llega a
   correr, el contenido tiene que verse igual.
