## Bloqueante 1 — Config de Firebase para el acceso por teléfono

Es lo que nos tiene sin login por teléfono en la web.

El acceso está construido y conectado a `verifyotp`, pero **el SMS lo pide el navegador a
Firebase**, y para eso necesita la config web del proyecto. Hoy `bootstrap` solo devuelve
`firebase_chat: "chat-pre"`, que es el nombre de la colección de Firestore
(`bootstrap.php`, `getFirebaseConfig()`).

Necesitamos tres valores:

- `apiKey` (la web)
- `authDomain`
- `projectId`

Y que des de alta los dominios en Firebase Console → Authentication → Settings →
Authorized domains: `localhost` y el dominio de la web cuando lo tengamos.

No son secretos: en cualquier app web de Firebase viajan en el bundle del navegador. La
seguridad está en la lista de dominios.

Lo más cómodo sería que `bootstrap` devolviera un bloque `firebase_auth` con esos tres
campos, así PRE y producción se configuran solos. Pero si nos los mandas por privado,
también vale.

En cuanto los tengamos, el teléfono queda operativo: el código ya está puesto.

---

## Bloqueante 2 — `checkout` tiene las URLs de retorno fijas a PrestaShop

En `checkout.php:90-91`:

```php
$successUrl = $shopUrl . '?fc=module&module=haslapapp&controller=checkoutsuccess&id_cart=' . $cart->id;
$cancelUrl  = $shopUrl . '?fc=module&module=haslapapp&controller=checkoutcancel&id_cart='  . $cart->id;
```

Para la app en webview funciona. Para la web no: al terminar de pagar, Stripe devuelve a la
persona a un JSON de PrestaShop en vez de a la ficha de su salida. Se queda colgada, sin
saber si ha quedado apuntada.

Lo que necesitamos: que `checkout` acepte `success_url` y `cancel_url` en el body y los pase
a `StripeCheckoutService::createCheckoutSession()`, que ya los recibe como parámetros.

```json
POST controller=checkout
{
  "id_cart": 26,
  "success_url": "https://web.haslap.com/pago/ok?id_cart={ID}",
  "cancel_url":  "https://web.haslap.com/pago/cancelado?id_cart={ID}"
}
```

Si no llegan, que siga usando las de ahora. Así la app no se entera del cambio.

Valídalos contra una lista de dominios permitidos configurable desde el back-office. Un
`success_url` libre es un redirect abierto, y encima con el `id_cart` en la URL.

---

## Aviso 1 — `addtocart` deja saltarse la autenticación

`addtocart.php:46-58`:

```php
// For testing: allow id_customer in the request
if (isset($json['id_customer']) && (int)$json['id_customer'] > 0) {
    $customerId = (int)$json['id_customer'];
    $this->context->customer = new Customer($customerId);
    $this->context->cart = CartService::getOrCreateCart($customerId);
} else {
    $this->requireLogin();   // ← solo por esta rama
}
```

Mandando `id_customer` en el body, cualquiera crea un carrito a nombre de otro cliente sin
estar autenticado. Los ids son enteros correlativos, no hace falta adivinar nada.

`checkout` sí comprueba que el carrito sea del cliente autenticado (línea 64), así que hoy
no se llega a cobrar a nadie. Pero es un endpoint público escribiendo sobre datos de
terceros.

Quitar esa rama, o dejarla detrás de una constante que en producción esté apagada.

---

## Aviso 2 — `checkoutsuccess` nunca recibe lo que espera

`checkout` construye el `successUrl` con `id_cart` (línea 90) y `checkoutsuccess` lee
`session_id` (`checkoutsuccess.php:32`):

```php
$sessionId = Tools::getValue('session_id', null);
if (empty($sessionId)) {
    return $this->sendError('Session ID is required', 400);
}
```

O sea que responde **400 siempre** que lo llama el flujo real. No rompe nada porque el
pedido lo crea el webhook, pero hoy no sirve para lo que dice servir.

Que el `successUrl` lleve `session_id={CHECKOUT_SESSION_ID}` —el marcador que sustituye
Stripe— o que el controlador acepte también `id_cart`. Nos da igual cuál.

---

## Preguntas

**1. ¿Existen los endpoints `stats` y `states`?**

Nuestro BFF los llama, pero no los encontramos en `controllers/front/` de la v1.0.66.

- `stats` lo usamos para las cifras de la home (salidas abiertas, clubes, ciudades, plazas).
- `states` para la lista de ciudades y provincias. Vemos que `bootstrap` ya devuelve
  `states` dentro de `psdata`; si es lo mismo, lo leemos de ahí y no necesitamos nada.

**2. ¿Los eventos tienen ya nivel, ritmo y terreno?**

En la v1.0.66 no vemos esos campos: `HaslapappCustomerEvent` no los declara y la tabla
`customer_event` no los tiene. Tampoco encontramos "terrain" en ninguna parte del módulo.

Nos importa porque es una promesa central de la web: cada salida dice su nivel y su ritmo
por adelantado. Si no existen, no los pintamos — pero entonces la sección "No importa a qué
ritmo vayas" de la home se cae entera.

Ojo: `bootstrap` devuelve `levels`, pero salen de `haslapapp_points_level` (los niveles de
gamificación). No son lo mismo que la dificultad de una salida, ¿verdad?

**3. ¿Está dado de alta el webhook de Stripe en PRE?**

Todo el pago cuelga de él: si `stripewebhook` no recibe el `checkout.session.completed`, no
se crea el pedido, no salta `createEventTicketsForOrder()` y **la persona paga pero no queda
apuntada**. Es el único punto donde un fallo silencioso cuesta dinero real, y desde fuera no
podemos comprobarlo.

**4. ¿Nos dejas un evento de prueba en PRE con entradas?**

Con `required_ticket = 1` y dos entradas de precios distintos, para probar el selector.
Ahora mismo no tenemos contra qué desarrollar.

**5. ¿Cuánto aguanta el `post_max_size` del PHP?**

Vamos a mandar las portadas de evento como base64 en el body, según el contrato de
`ImageService`. El límite del servicio son 10 MB de imagen, que en base64 son unos 13,5 MB
de JSON. Queremos saber si el servidor los acepta o si le ponemos un tope más bajo desde la
web.

**6. ¿Está configurado el bucket de Google Cloud Storage para eventos en PRE?**

Lo preguntamos porque el fallo es mudo. En `EventService.php:668`, si la subida de la imagen
no sale bien, el evento se guarda igual, responde 200 y no avisa de nada:

```php
// If image fails, it's not critical - event is already saved without image
```

Si la carpeta de destino no está configurada, alguien publicará su salida con foto, verá
"evento publicado" y la foto no estará en ninguna parte. Solo con confirmarnos que el bucket
está puesto en PRE nos vale; lo demás lo comprobamos nosotros con el evento de prueba.

Un detalle que vimos de paso: en eventos el campo se llama `image` y en clubes
`cover_image`, y el de clubes solo valida que sea un string. No nos molesta, pero por si
quieres igualarlos algún día.

---

## Lo que hacemos nosotros

Para que quede claro el reparto y no esperes nada por nuestra parte:

- **Portada de evento: ponerla y enseñarla.** Vamos a añadir el selector de imagen al
  formulario de crear y editar salida, y a pintarla en la tarjeta y en la ficha. Enseñar la
  que ya viene de la app funciona desde hace tiempo; lo que falta es poder subirla desde la
  web. El contrato está claro y no necesitamos nada tuyo: campo `image` en el body de
  `event` (POST y PUT), data URI base64, 10 MB, JPG/PNG/GIF/WebP, y `ImageService`
  redimensiona a 1200×1200 y sube a Google Cloud Storage.
- **Pagos.** Proxear `addtocart`, `checkout`, `applycoupon`, `orderconfirmation` y
  `customertickets` desde nuestro BFF; el selector de entrada, la redirección a Stripe, las
  páginas de vuelta y "mis entradas".
- Propagar el `id_product` de cada entrada al navegador, que ya nos llega y se nos perdía.
- Mostrar `price_with_tax` en vez de `price`, para no anunciar un importe y cobrar otro.
- Editar y borrar eventos, y crear clubes: el CRUD ya existe en `event` y `club`, solo nos
  falta usarlo.
- Recuperar contraseña (`recovery`), cerrar sesión de verdad (`logout`) y borrar cuenta
  (`deleteaccount`).

No tocaremos `redeemticket` ni nada social: el canje con QR, el chat y las estadísticas son
de la app.

---

## Resumen

| # | Qué | ¿Nos bloquea? |
|---|---|---|
| B1 | Config de Firebase web (`apiKey`, `authDomain`, `projectId`) + dominios | **Sí** — login por teléfono |
| B2 | `success_url` / `cancel_url` en el body de `checkout` | **Sí** — pagos |
| A1 | `id_customer` salta el `requireLogin()` en `addtocart` | No — seguridad |
| A2 | `checkoutsuccess` espera `session_id` y recibe `id_cart` | No |
| P1 | ¿Existen `stats` y `states`? | Sí, degradado |
| P2 | ¿Los eventos tienen nivel, ritmo y terreno? | Sí, degradado |
| P3 | ¿Webhook de Stripe activo en PRE? | Sí, para probar |
| P4 | Evento de prueba con entradas en PRE | Sí, para probar |
| P5 | ¿`post_max_size` del PHP? | No |
| P6 | ¿Bucket de GCS configurado para eventos en PRE? | No — pero falla mudo |

Con B1 la web tiene login por teléfono. Con B2 y las confirmaciones, puede cobrar.
