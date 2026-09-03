# Haslap — contexto para agentes

Repo del **MVP web de Haslap**: plataforma para descubrir eventos de running e inscribirse.
Front en React + Vite + TypeScript, back en Node + Express con datos dummy en memoria.

Si vas a tocar este repo, lee primero las tres fichas de abajo. No son sugerencias:
describen decisiones ya tomadas que se rompen con facilidad si no las conoces.

| Ficha | Qué fija | Léela antes de |
|---|---|---|
| [docs/producto.md](docs/producto.md) | Qué es Haslap y **qué NO puede hacer la web** | Añadir cualquier funcionalidad |
| [docs/marca.md](docs/marca.md) | Sistema de color 60/25/10/5 y tokens | Tocar cualquier estilo |
| [docs/contenido.md](docs/contenido.md) | Tono de voz y reglas de copy | Escribir cualquier texto visible |
| [docs/backend.md](docs/backend.md) | Conexión con PrestaShop y **datos que no hay que propagar** | Tocar el servidor o el mapeo |
| [docs/peticiones-backend.md](docs/peticiones-backend.md) | Cambios pedidos al equipo de PrestaShop | Saber qué está bloqueado y por qué |

## Arrancar

```bash
nvm use && npm install && npm run dev
```

Web en http://localhost:5173, API en http://localhost:4000.
Cuenta de prueba: `tere@haslap.com` / `haslap123`.

## Las cuatro reglas que no se rompen

1. **La web no muestra estadísticas ni funciones sociales.** Eso vive en la app. Cuando
   una pantalla las necesite, se muestra el bloque bloqueado con CTA de descarga.
   Detalle en [docs/producto.md](docs/producto.md).
2. **El color sigue la regla 60/25/10/5.** Blanco domina, verde es identidad, el texto
   nunca es negro puro y el flúor es acento escaso. Detalle en [docs/marca.md](docs/marca.md).
3. **Nada de datos inventados en pantalla.** Cifras, testimonios y logos solo si son
   reales o vienen del API. Detalle en [docs/contenido.md](docs/contenido.md).
4. **Las animaciones nunca bloquean el render.** Solo se anima la entrada; nada de
   `AnimatePresence mode="wait"` envolviendo páginas o pasos de formulario, ni animaciones
   de altura que recorten inputs. Si la animación no llega a correr, el contenido tiene
   que verse igual.

## Mapa del repo

```
server/src/
  index.js          app de Express y endpoints sueltos (salud, meta, estadisticas)
  db.js             seed en memoria — eventos, clubes, usuarios, inscripciones
  auth.js           JWT, middleware de sesión, verificación de Google
  serializers.js    campos derivados (asistentes, plazas, inscrito)
  routes/           auth · eventos · clubes · mi

web/src/
  index.css         @theme de Tailwind v4 — aquí viven los tokens de color
  lib/              api, contexto de auth, formatos, presets de animación
  components/       navbar, tarjetas, modales, bloqueos de app, landing, iconos
  pages/            Home · Eventos · DetalleEvento · Clubes · DetalleClub ·
                    MisEventos · Entrar · Premium
```

## Antes de dar algo por terminado

- `npx tsc -b` en `web/` sin errores.
- `npm run build` pasa.
- Revisa la pantalla en el navegador, no solo el código.
- Repasa el checklist de [docs/marca.md](docs/marca.md#checklist-antes-de-cerrar-una-pantalla).
