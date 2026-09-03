# Marca y color

Estándar de color de Haslap. Cualquier pantalla nueva se mide contra esto.

## La regla 60 / 25 / 10 / 5

El color no se reparte por gusto: cada uno tiene un peso y una intención.

| Peso | Papel | Color | Token | Dónde va |
|---|---|---|---|---|
| **60%** | Base | `#FFFFFF` / `#F5F8F7` | `bg-white`, `bg-superficie` | Fondos, tarjetas, imágenes y aire. Es lo que evita la sobrecarga cognitiva |
| **25%** | Identidad | `#4A7D76` | `verde` (+ `verde-50/100/700/800/900`) | Marca, tarjetas, eventos, clubes, iconos, superficies destacadas |
| **10%** | Texto | `#1E2A27` | `texto`, `texto-suave`, `texto-tenue` | Todo el texto. Lleva matiz verde a propósito |
| **5%** | Acento | `#D8FF2A` | `fluor`, `fluor-600` | Vida y adrenalina: CTA principal y lo que deba atraer la mirada |

Los tokens viven en `web/src/index.css`, dentro de `@theme`. Son la única fuente de verdad.

## Botones

Se nombran por su **papel en la regla**, no por su color. Así la regla no se rompe al
añadir pantallas nuevas.

| Clase | Peso | Cuándo |
|---|---|---|
| `btn-acento` | 5% | La acción más importante de la pantalla. Uno por vista, dos como mucho |
| `btn-identidad` | 25% | Acciones dentro de tarjetas y navegación entre contenido |
| `btn-contorno` | base | Alternativas y estados ya resueltos ("Apuntado", "Cancelar inscripción") |
| `btn-fantasma` | base | Navegación secundaria y enlaces con forma de botón |

Tamaños: `btn-sm` · `btn-md` · `btn-lg`. Siempre junto a `btn`.

## Reglas duras

No son preferencias. Romper una de estas es un bug de diseño:

- **Nunca `#000` ni `text-black`.** El texto es `texto` (`#1E2A27`). El negro puro no
  pertenece al sistema.
- **Nunca el flúor como superficie grande.** Es un punto de atención, no un fondo. Si un
  bloque necesita destacar, la superficie va en verde y el flúor se queda en el botón.
- **Nunca negro como superficie.** Las secciones oscuras van en `bg-verde`.
- **Máximo dos acentos por pantalla**, y separados en el scroll. Si hay tres, sobra uno.
- **La barra superior no lleva flúor.** Es cromo persistente: competiría con el CTA de
  cada página.
- **Nada de hex sueltos en JSX.** Siempre tokens. La única excepción viva es el color
  propio de cada club, que es un dato del club y viene del API.
- **No se añaden colores nuevos** sin decidir antes en qué peso de la regla entran.

## Decisiones ya tomadas (no las deshagas sin querer)

- **El badge de fecha de una tarjeta solo es flúor si el evento es hoy o mañana.** En
  todas las tarjetas dejaría de guiar la mirada y sería ruido de fondo.
- **El banner de descarga de la app es superficie verde con botón flúor**, no una banda
  flúor entera.
- **Los empujones secundarios a la app** (tarjeta de estadísticas, "¿Quién se apunta?")
  van en `btn-contorno` / `btn-identidad`, nunca en acento: competirían con "Unirme".

> Ojo: la lámina de Design System del entregable original (`Haslap_Web_MVP_Entregable_v2.pptx`,
> slide 8) muestra un "Botón principal" negro. Está **desactualizada** respecto a esta regla:
> con 60/25/10/5 el botón negro no existe. Manda este documento.

## Tipografía y forma

- Inter. Título 36–44 bold · sección 20–24 bold · cuerpo 14–16 · caption 10–12.
- Radios: 8 / 12 / 16 / 24 / 32 / 999 px → `rounded-ds-sm|md|lg|xl|2xl` y `rounded-full`.
- Rejilla de espaciado de 8px.

## Checklist antes de cerrar una pantalla

- [ ] ¿Domina el blanco? Si el ojo no descansa, sobra color.
- [ ] ¿Cuántos elementos flúor hay? Cuéntalos. Dos como mucho.
- [ ] ¿El flúor está en lo que de verdad quieres que pulsen?
- [ ] ¿Hay algún `#000`, `text-black` o `bg-black`?
- [ ] ¿Algún hex suelto que debería ser token?
- [ ] ¿Las superficies oscuras son verdes, no negras?

Verificación rápida en consola del navegador:

```js
// Cuenta los acentos visibles. Ojo: hay que acotar a body y descartar los
// nodos sin render, o cuentas <head>, <script> y <meta> como si fueran negros.
[...document.body.querySelectorAll('*')]
  .filter((el) => el.getClientRects().length)
  .filter((el) => getComputedStyle(el).backgroundColor === 'rgb(216, 255, 42)')
  .map((el) => el.textContent.trim().slice(0, 30) || el.tagName);
```

```bash
# Colores prohibidos o fuera de sistema en el código
grep -rnE "#[0-9a-fA-F]{3,6}|text-black|bg-black" web/src --include="*.tsx"
```
