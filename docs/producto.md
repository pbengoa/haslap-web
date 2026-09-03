# Producto: qué es Haslap y qué hace esta web

## La idea

En cualquier ciudad hay cientos de personas que salen a correr a la misma hora, por las
mismas calles y al mismo ritmo. No corren juntas porque no se conocen.

Haslap las pone en contacto: alguien publica una salida, el resto se apunta y se ven en el
punto de encuentro. Sin cuotas, sin pruebas de nivel y sin tener que ser rápido.

**Misión:** que salir a correr acompañado sea tan fácil como salir a correr solo.

## La frontera web / app

Es la decisión de producto más importante del proyecto y la que más fácil se rompe por
descuido. **La web es la parte funcional. La app es la parte social.**

### La web SÍ hace

- Descubrir eventos y clubes (buscar, filtrar por ciudad, nivel, fecha, precio y plazas).
- Ver la ficha completa de un evento o un club.
- Inscribirse a un evento y cancelar la inscripción.
- Unirse a un club y salir de él.
- Crear y publicar eventos.
- Iniciar sesión con email o con Google.
- Ver "Mis eventos": a qué me he apuntado, qué organizo, a qué clubes pertenezco.

### La web NO hace, nunca

- **Estadísticas de ningún tipo**: ni del evento, ni del club, ni personales.
- **Lista de asistentes.** Se puede decir *cuántos* van (42/60), nunca *quiénes*.
- **Chat, mensajes directos, feed, seguidores, grupos, invitaciones, perfiles completos.**

### Qué hacer cuando una pantalla pide algo de la segunda lista

No se implementa y no se oculta: **se enseña bloqueado**. Los componentes ya existen en
`web/src/components/BloqueadoEnApp.tsx`:

| Componente | Para qué |
|---|---|
| `<EstadisticasBloqueadas />` | Métricas con los valores difuminados y CTA de descarga |
| `<QuienSeApunta />` | Sustituye a la lista de asistentes |
| `<BannerDescargaApp />` | Cierre de página empujando a la app |

La razón de enseñarlo bloqueado y no esconderlo: el usuario tiene que saber que la función
existe. Es lo que convierte una limitación en un motivo para descargar la app.

**Si alguien pide "muéstrame quién va" o "añade estadísticas a la web", la respuesta
correcta es usar uno de esos bloques, no construir la función.**

## Roadmap (del entregable)

- **Fase 1 — MVP.** Es lo que hay hoy: descubrir, inscribirse, crear eventos, clubes, login.
- **Fase 2 — Premium.** URLs personalizadas, estadísticas opcionales, pago de planes.
- **Fase 3 —** Integraciones y automatizaciones (Zapier, Make, exportar asistentes).

La pantalla `/premium` ya muestra los planes, pero **el pago no está implementado** y es
fase 2. El botón muestra un aviso, no cobra.

## Estado técnico y límites actuales

- **Datos dummy en memoria.** Lo que se crea o se apunta se pierde al reiniciar la API.
  El siguiente paso natural es Postgres.
- **Login con Google en modo demo** mientras no haya `GOOGLE_CLIENT_ID`. Con el client ID
  configurado pasa a ser el botón oficial y verificación real del ID token, sin tocar código.
- **Los botones de "Descargar app" muestran un aviso**; en producción irían a App Store /
  Google Play.
- **Las imágenes vienen de Unsplash** y caen a un degradado de marca si no hay red.

## Reglas de producto

- Un evento siempre dice **nivel y ritmo por adelantado**. Es lo que quita el miedo a
  apuntarse y no es negociable en la ficha.
- Los contadores de plazas son públicos; la identidad de quien va, no.
- Los filtros viven en la URL para que una búsqueda se pueda compartir.
- Nada obliga a registrarse para *mirar*. El registro solo se pide al inscribirse, crear o
  unirse a un club.
