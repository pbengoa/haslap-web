# Conexión con el backend de Haslap (PrestaShop)

La web puede funcionar con dos orígenes de datos. Los decide una sola variable.

| `HASLAP_API_URL` | Origen | Para qué |
|---|---|---|
| sin definir | `dummy` — seed en memoria (`server/src/db.js`) | Trabajar en el front sin depender de nadie |
| definida | `haslapapp` — PrestaShop real vía BFF | Datos de verdad |

```bash
cp server/.env.example server/.env   # y poner HASLAP_API_URL
npm run dev
```

El servidor dice en el arranque cuál está usando:

```
[haslap-api] origen de datos: haslapapp → https://haslap.okoiagency.com
```

## Por qué hay un BFF y no llamadas directas

El navegador **no puede** hablar con el módulo de PrestaShop directamente. Tres razones,
las tres bloqueantes:

1. **La sesión es una cookie `SameSite=Lax`**, que el navegador no envía en peticiones
   cross-site. Todo lo autenticado fallaría.
2. **El módulo responde `Access-Control-Allow-Origin: *` sin `Allow-Credentials`**, y esa
   combinación con cookies la rechaza el propio navegador por especificación.
3. **Varios endpoints devuelven datos personales de terceros** (ver aviso abajo).

Así que el Node hace de intermediario:

```
Navegador ──JWT propio──> Node (BFF) ──cookie PrestaShop──> haslapapp
```

El BFF guarda la cookie de PrestaShop dentro de su propio JWT, que sí viaja bien al
navegador, y la reinyecta en cada llamada al backend.

Código en `server/src/haslapapp/`: `cliente.js` (HTTP), `mapeo.js` (traducción y filtrado),
`rutas.js` (endpoints).

## ⚠️ Aviso de seguridad — datos expuestos por el backend

Los endpoints `clubs` y `event` del módulo devuelven, **sin autenticación**, el objeto
Customer completo de cada participante. Comprobado en PRE y en producción:

| Campo | Estado |
|---|---|
| `passwd` (hash de contraseña) | expuesto |
| `secure_key` | expuesto |
| `email`, `phone_number`, `birthday`, `lastname` | expuestos |

`mapeo.js` los filtra con **lista blanca** (`personaPublica()`): se declara qué sale, no qué
se quita, para que un campo nuevo en el backend no se cuele solo. **Nunca sustituyas esa
lista blanca por una lista negra.**

Esto no arregla el problema de origen: cualquiera puede llamar al endpoint sin pasar por
esta web. Hay que corregirlo en el módulo.

## Campos que el backend no tiene

`customer_event` no guarda **nivel, ritmo ni tipo de terreno**, y el precio vive en el
producto de PrestaShop (en el listado solo llega `required_ticket`). El mapeo los devuelve
como `null` y la interfaz los omite — nunca los inventa:

- Sin `nivel` → la tarjeta muestra la distancia.
- Sin `ritmo` ni `terreno` → esas filas desaparecen del detalle.
- `max_participants = 0` significa **sin límite**, no cero plazas: se muestra
  "6 apuntados" en vez de "6/0" y se oculta la barra de aforo.
- Sin niveles, la sección "No importa a qué ritmo vayas" de la home **no se pinta**:
  prometía algo que el backend no puede cumplir.
- El módulo no admite login con Google, así que ese botón se oculta.

## Entorno PRE

`haslap.okoiagency.com` — Stripe en modo test, emails desactivados, push neutralizadas.

Las credenciales de panel, SSH y base de datos están en el documento de acceso y **no se
guardan en este repositorio**. Para levantar la web no hacen falta: basta con la URL, que
es HTTP público. El túnel SSH a MySQL solo sirve para inspeccionar datos a mano.

> El servidor tiene fail2ban: varios intentos fallidos de SSH bloquean la IP. Si pasa,
> avisar en lugar de reintentar.

## Cosas rotas que conviene mirar

- `healthcheck` devuelve **503** en PRE y en producción: falta la tabla
  `haslapapp_geolocation`. Como `getEvents` la usa para ordenar por proximidad, ese orden
  está caído.
- `required_ticket` existe en el ObjectModel y en la BD, pero **no en el `CREATE TABLE`**
  de `sql/tables/events.php`: una instalación limpia se rompería.
- En `EventService.php:127` y `:169` el filtro `id_customer` se aplica a
  `e.id_customer_club`; el mismo filtro en `getCalendarEvents` (línea 1203) usa
  `e.id_customer`. Uno de los dos está mal.
