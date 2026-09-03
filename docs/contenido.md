# Contenido: tono de voz y reglas de copy

## Idioma

Español de España, **tuteo** siempre. Nada de "usted" ni de neutro latinoamericano.
En el código, los nombres de variables y componentes también van en español para que el
dominio se lea igual en el código y en la pantalla (`evento`, `inscripcion`, `salida`).

## Voz

Cercana y directa, como un compañero de club, no como una marca deportiva.

- Frases cortas. Si una frase necesita una coma para respirar, pártela.
- Se habla de **personas**, no de "usuarios" ni de "la comunidad Haslap".
- Se nombra el problema real antes que el producto: *"¿aguantaré el ritmo?"* le importa
  más a alguien que "plataforma integral de running".

| En vez de | Escribe |
|---|---|
| "¡Únete ya a la mejor comunidad de running!" | "Únete a runners como tú" |
| "Regístrate para acceder a la plataforma" | "Entra para apuntarte a salidas" |
| "Evento sin plazas disponibles" | "Evento completo" |
| "Usuarios inscritos: 42" | "42/60 asistentes" |

## Prohibido

- **Inventar cifras.** Los números de la landing salen de `GET /api/estadisticas`, que los
  calcula del store real. Si un dato no existe, no se pone.
- **Inventar testimonios, reseñas o citas de personas.** No hay sección de testimonios a
  propósito: se añadirá cuando haya frases reales de runners reales con su permiso.
- **Inventar logos, clubes o marcas** que no existan.
- **Épica de marca vacía**: "revoluciona tu forma de correr", "la app definitiva",
  "transforma tu vida". Fuera.
- **Cadenas de exclamaciones** y emojis en la interfaz. Un "¡" puntual en un mensaje de
  éxito vale; "¡¡Genial!! 🎉🔥" no.

## Textos que ya están decididos

- Claim: **"Run together. Go further."**
- Hero: "Descubre tu próxima salida" / "Únete a runners como tú, descubre clubes y
  participa en salidas cerca de ti."
- Misión: "Nuestra misión es que salir a correr acompañado sea tan fácil como salir a
  correr solo."
- Cierre web/app: "La web para descubrir e inscribirte. La app para vivirlo."

## Vocabulario

| Término | Uso |
|---|---|
| **salida** | La quedada para correr, en lenguaje de runner. Preferido en copy narrativo |
| **evento** | El mismo objeto, en lenguaje de producto. Preferido en interfaz y navegación |
| **club** | Comunidad estable que organiza salidas cada semana |
| **apuntarse / unirse** | Lo que hace el usuario. En botones: "Unirme" |
| **inscripción** | El registro resultante. En botones: "Cancelar inscripción" |
| **runner** | Se usa; está asentado en español y es como se llaman entre ellos |
| **organizador** | Quien publica la salida |

## Mensajes de error y de éxito

- El error dice **qué ha pasado y qué hacer**, sin culpar a nadie:
  "Email o contraseña incorrectos." · "Este evento ya no tiene plazas disponibles."
- Un mismo mensaje para email inexistente y contraseña incorrecta: no se filtra si una
  cuenta existe.
- El éxito confirma **el siguiente paso real**, no felicita:
  "¡Estás dentro! Te esperamos en Casa de Campo."

## Accesibilidad del texto

- Todo icono decorativo lleva `aria-hidden`; si comunica algo, lleva texto alternativo.
- Los botones con solo icono llevan `aria-label` en español.
- Nunca se usa el color como único portador de información: el nivel de un evento se
  escribe, además de pintarse en verde.
