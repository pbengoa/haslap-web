# Haslap — MVP web

> **¿Vas a tocar el código (tú o un agente)?** Empieza por [AGENTS.md](AGENTS.md).
> Ahí están los límites del proyecto: [qué puede y qué no puede hacer la web](docs/producto.md),
> el [sistema de color 60/25/10/5](docs/marca.md) y las [reglas de copy](docs/contenido.md).

Versión web del MVP de Haslap: **descubrir eventos de running e inscribirse**.
Las funciones sociales y las estadísticas siguen siendo exclusivas de la app — en la web
aparecen bloqueadas con un CTA de descarga, tal y como define el entregable.

Front en **React + Vite + TypeScript**, back en **Node + Express**, animaciones con
**motion**, y **datos dummy en memoria** (no hay base de datos: al reiniciar el server
se vuelve al seed).

---

## Arrancar

Requiere Node >= 20.19 (hay un `.nvmrc` con la 22).

```bash
nvm use && npm install && npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000

`npm run dev` levanta los dos a la vez. Por separado: `npm run dev:api` / `npm run dev:web`.

### Cuenta de prueba

```
tere@haslap.com / haslap123
```

Ya viene inscrita a dos eventos y es miembro de un club, para ver "Mis eventos" con datos.

---

## Login

Dos vías, que era lo que faltaba en el entregable original:

**1. Email y contraseña** — registro y acceso, contraseñas con `bcrypt`, sesión por JWT
(7 días) guardada en `localStorage`.

**2. Google** — el botón funciona en dos modos según haya o no `GOOGLE_CLIENT_ID`:

| | Sin `GOOGLE_CLIENT_ID` (por defecto) | Con `GOOGLE_CLIENT_ID` |
|---|---|---|
| Botón | Propio, abre un panel de demo | Botón oficial de Google Identity Services |
| Credencial | Perfil simulado | ID token real de Google |
| Verificación | — | `google-auth-library` verifica el token en el server |

Así se puede probar el flujo completo sin credenciales, y al poner el client ID pasa a ser
real sin tocar código. Para activarlo:

```bash
cp server/.env.example server/.env
# GOOGLE_CLIENT_ID=<tu client id de Google Cloud Console>
```

El client ID se crea en Google Cloud Console → Credenciales → ID de cliente de OAuth 2.0,
tipo "Aplicación web", con `http://localhost:5173` en orígenes autorizados.

En ambos casos, si el email ya existe la cuenta se vincula en vez de duplicarse.

---

## Qué hace la web

| Ruta | Pantalla |
|---|---|
| `/` | Home — hero, qué es Haslap, cifras, eventos, para quién es, clubes, cómo funciona, preguntas frecuentes |
| `/eventos` | Listado con búsqueda y filtros (ciudad, nivel, hoy/mañana/finde, gratis, con plazas) |
| `/eventos/:slug` | Detalle del evento + inscripción |
| `/clubes` | Listado de clubes |
| `/clubes/:slug` | Detalle del club + próximas salidas |
| `/mis-eventos` | Mis inscripciones, eventos que organizo y mis clubes |
| `/entrar` | Login / registro (email + Google) |
| `/premium` | Planes Organizador y Club |

Los filtros van en la URL, así que una búsqueda se puede compartir.

### Lo que se queda en la app

Siguiendo el objetivo del entregable ("las funciones sociales seguirán siendo exclusivas
de la aplicación"), en la web aparecen visibles pero bloqueadas:

- **Estadísticas** (evento, club y personales) — tarjeta con los valores difuminados y CTA
  "Descargar app para más información".
- **Lista de asistentes** — bloque "¿Quién se apunta?".
- **Chat, mensajes, feed, seguidores, grupos** — en `/premium`, con candado.

---

## API

Todo bajo `/api`. El front la llama por el proxy de Vite, así que en desarrollo no hay CORS.

```
GET    /api/salud
GET    /api/meta                          ciudades y niveles para los filtros
GET    /api/estadisticas                  cifras agregadas para la landing

GET    /api/auth/config                   qué métodos de login hay disponibles
POST   /api/auth/registro
POST   /api/auth/login
POST   /api/auth/google                   { credential } o { demo } según el modo
GET    /api/auth/yo                       usuario de la sesión

GET    /api/eventos                       ?q&ciudad&nivel&cuando&gratis&conPlazas&destacados&limite
GET    /api/eventos/:idOslug
POST   /api/eventos                       crear evento (requiere sesión)
POST   /api/eventos/:id/inscripcion       unirse
DELETE /api/eventos/:id/inscripcion       cancelar

GET    /api/clubes                        ?q&ciudad&limite
GET    /api/clubes/:idOslug               club + próximas salidas
POST   /api/clubes/:id/membresia
DELETE /api/clubes/:id/membresia

GET    /api/mi/eventos                    próximos y pasados
GET    /api/mi/eventos/organizados
GET    /api/mi/clubes
```

---

## Estructura

```
AGENTS.md           punto de entrada para agentes de IA
CLAUDE.md           atajo a AGENTS.md para Claude Code
docs/
  producto.md       qué es Haslap y la frontera web / app
  marca.md          sistema de color 60/25/10/5 y tokens
  contenido.md      tono de voz y reglas de copy
server/
  src/
    index.js          app de Express
    db.js             seed en memoria (eventos, clubes, usuarios, inscripciones)
    auth.js           JWT, middleware de sesión, verificación de Google
    serializers.js    campos derivados (asistentes, plazas, si estoy inscrito)
    routes/           auth · eventos · clubes · mi
web/
  src/
    lib/              api, contexto de auth, formatos, presets de animación
    components/       navbar, tarjetas, modales, bloqueos de app, iconos
    pages/            Home · Eventos · DetalleEvento · Clubes · DetalleClub ·
                      MisEventos · Entrar · Premium
```

### Design system y regla de color 60 / 25 / 10 / 5

Los tokens están en `web/src/index.css` (`@theme` de Tailwind v4). El color no se reparte
por gusto: cada uno tiene un porcentaje y una intención.

| Peso | Papel | Color | Dónde |
|---|---|---|---|
| **60%** | Base | `#FFFFFF` + superficie `#F5F8F7` | Fondos, tarjetas, imágenes y aire. Evita la sobrecarga cognitiva |
| **25%** | Identidad | verde `#4A7D76` | Marca, tarjetas, eventos, clubes, iconos y superficies destacadas |
| **10%** | Texto | `#1E2A27` | Nunca negro puro: lleva matiz verde para pertenecer al sistema |
| **5%** | Acento | flúor `#D8FF2A` | Vida y adrenalina. Solo CTA principal y lo que deba atraer la mirada |

Los botones se llaman por su papel, no por su color, para que la regla no se rompa al
añadir pantallas:

```
btn-acento     → 5%.  La acción más importante de la pantalla. Uno por vista
btn-identidad  → 25%. Acciones dentro de tarjetas y navegación entre contenido
btn-contorno   → base. Alternativas y estados ya resueltos ("Apuntado")
btn-fantasma   → base. Navegación secundaria
```

Tres decisiones que hacen que el 5% siga siendo 5%:

- **El badge de fecha solo es flúor si el evento es hoy o mañana.** En todas las tarjetas
  dejaría de guiar la mirada y sería ruido.
- **El banner de descarga es una superficie verde con el botón en flúor**, no una banda
  flúor entera: el acento marca la acción, no el bloque.
- **La barra superior no lleva flúor.** Es cromo persistente y competiría con el CTA de
  cada página.

### Animaciones

Las primitivas están en [`web/src/components/Movimiento.tsx`](web/src/components/Movimiento.tsx):

| Pieza | Qué hace | API de motion |
|---|---|---|
| `BarraProgresoScroll` | Línea flúor de progreso arriba | `useScroll` + `useSpring` |
| `Contador` | Las cifras suben al entrar en pantalla | `useMotionValue` + `animate` + `useInView` |
| `Inclinable` | Las tarjetas se giran hacia el cursor | `useMotionValue` + `useSpring` + `useTransform` |
| `TituloPorPalabras` | El titular se revela palabra a palabra | variantes + `staggerChildren` |
| `Demostraciones` | Tres mini-demos del producto en bucle | `useInView` + `AnimatePresence` + `layout` |
| `useParallax` | La foto del hero se despega al hacer scroll | `useScroll` + `useTransform` |

Más lo de antes: entrada de página, stagger de tarjetas, hover con elevación, indicador
deslizante en nav y chips, y muelles en los modales.

Dos reglas que cumplen todas:

- **Nunca esconden contenido.** Nada arranca en `opacity: 0`. El `Contador` lleva una red de
  seguridad: si a los 1,5 s no ha entrado en pantalla, planta la cifra igualmente — un
  número en 0 no es una animación pendiente, es un dato mal.
- **Respetan `prefers-reduced-motion`.** `MotionConfig` cubre las variantes, pero **no** lo
  que se mueve con MotionValue: eso se comprueba a mano con `useReducedMotion()`. Con
  movimiento reducido, `Inclinable` devuelve un div normal y el parallax vale 0.

Las animaciones nunca bloquean el render: se anima solo la **entrada** de páginas y pasos de
formulario, sin `AnimatePresence mode="wait"`, para que ningún contenido dependa de que
termine una animación de salida.

---

## Notas y limitaciones

- **Datos en memoria.** Todo lo que se cree o se apunte se pierde al reiniciar la API.
  El siguiente paso natural es Postgres + Prisma.
- **Imágenes desde Unsplash.** Si no hay red, cada portada cae a un degradado de marca.
- **Los botones de "Descargar app"** muestran un aviso; en producción irían a App Store /
  Google Play.
- **El pago de los planes premium** no está implementado (fase 2 del roadmap).
- **Aviso de `npm audit`:** `react-router-dom` 7.18.2 aparece con un aviso de severidad alta
  (GHSA-qwww-vcr4-c8h2). Solo afecta al modo RSC, que esta app no usa (SPA de cliente, sin
  server actions), y a día de hoy no hay versión publicada que lo corrija.
