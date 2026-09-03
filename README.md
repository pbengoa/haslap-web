# Haslap — web

Front del MVP web de Haslap: descubrir salidas de running, ver clubes e
inscribirse. React 19 + Vite + Tailwind v4 + `motion`.

## Arrancar

```bash
nvm use && npm install && npm run dev
```

Web en http://localhost:5173.

## De dónde salen los datos

El navegador habla **directo** con el módulo `haslapapp` de PrestaShop. No hay
servidor intermedio: el módulo autentica por Bearer token y admite peticiones
cross-origin, así que el front se basta solo y se despliega como sitio estático.

La traducción entre lo que responde PrestaShop y lo que consume la interfaz vive
en `src/lib/mapeo.ts`, y el cliente HTTP en `src/lib/haslapapp.ts`. Si un campo
llega raro, esos son los dos sitios donde mirar.

Con `VITE_API_URL` vacío se apunta a PRE (`haslap.okoiagency.com`).

## Variables

Copia `.env.example` a `.env`. Todas se leen **al construir**, así que un cambio
obliga a volver a construir.

- `VITE_API_URL` — el PrestaShop contra el que se trabaja. Vacío = PRE.
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
