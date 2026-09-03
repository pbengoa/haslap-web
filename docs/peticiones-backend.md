# Pendientes con el backend — módulo `haslapapp`

**De:** equipo web de Haslap · **Para:** Emilio
**Revisado contra PRE:** 5 de agosto de 2026 · módulo v1.0.68
**Docs de la API:** <https://haslapapp-api.pages.dev/>

> Todo lo que pedimos en la primera versión de este documento **está entregado y
> verificado**: A1 y A2 (fuga de datos), B1 (consumo desde navegador), C1, C2 y C3 (bugs)
> y D1–D7. La web ya lo consume. Gracias.
>
> Aquí queda solo lo que falta.

---

## 1. Config de Firebase para el acceso por teléfono 🔴

**Es lo único que nos bloquea.**

El acceso por teléfono ya está construido en la web (número → código SMS) y conectado a
`verifyotp`. Pero **el SMS lo pide el navegador a Firebase**, y para eso necesita la config
web del proyecto. Hoy no hay forma de obtenerla: `bootstrap` solo devuelve
`firebase_chat: "chat-pre"`, que es el nombre de la colección de Firestore.

**Necesitamos tres valores:**

| Dato | Para qué |
|---|---|
| `apiKey` (web) | Inicializar el SDK de Firebase en el navegador |
| `authDomain` | Idem |
| `projectId` | Idem |

**Y dar de alta los dominios** en Firebase Console → Authentication → Settings →
Authorized domains: `localhost` para desarrollo y el dominio de la web cuando lo tengamos.
Sin eso Firebase rechaza el envío del SMS.

> Estos valores **no son secretos**: en cualquier app web de Firebase viajan en el bundle
> del navegador. La seguridad está en la lista de dominios autorizados.

**Lo más cómodo sería que `bootstrap` devolviera un bloque `firebase_auth`** con esos tres
campos. Así PRE y producción se configuran solos y no hay que pasarlos a mano. Pero si nos
los mandas por privado, también nos sirve.

En cuanto los tengamos, el teléfono queda operativo: el código ya está puesto y se activa
con dos variables de entorno.

---

## 2. Acceso con Google 🟡 — en decisión, no urge

Retiramos la urgencia. Tu argumento es sólido y lo damos por bueno:

- Añadir Google obliga a añadir Apple (requisito de la App Store).
- El email oculto de Apple rompe la vinculación de cuentas, y eso os generó incidencias.

**No nos bloquea:** la web funciona con teléfono y email.

Sobre el problema de fondo que señalaste —gente que se registra con email en un sitio y
luego entra con teléfono en otro creyendo que ya tiene cuenta— lo hemos resuelto por
nuestra parte sin tocar el backend:

- **El teléfono es la vía principal de la web**, igual que en la app.
- **El alta por email también pide el teléfono** (que ya exigíais). Así toda cuenta creada
  desde la web nace con el mismo identificador que usa la app.

Si algún día entra Google o Apple, el teléfono sigue siendo la clave de unión.

---

## 3. Detalle de evento sin participantes 🟢 — mejora, no urgente

`controller=event` devuelve la lista de participantes. Ya no hay datos sensibles (lo
arreglasteis en A1: solo llegan nombre, avatar y datos de running), así que esto ya no es
un problema de seguridad.

Pero **la web no muestra quién asiste** —eso es exclusivo de la app— así que son nombres de
terceros viajando sin que se usen. Nos vendría bien que fuera opcional:

```
GET controller=event&id=1119                        → sin participantes
GET controller=event&id=1119&include=participants   → con ellos (para la app)
```

Menos payload y menos superficie de exposición. Si os complica, lo dejamos: hoy los
descartamos en nuestra capa intermedia.

---

## 4. `login` revela si un email está registrado 🟢 — detalle menor

```bash
curl -X POST ".../controller=login" -d '{"login_type":"email","email":"no@existe.test","password":"x"}'
# → {"error":"Email not registered","code":404}
```

Con un email que no existe responde `Email not registered`; con uno que sí existe y
contraseña mala, otro mensaje. Eso permite averiguar qué correos tienen cuenta probándolos
uno a uno.

Lo habitual es devolver **el mismo error en ambos casos** («Email o contraseña
incorrectos», 401). Es un cambio de una línea y no afecta a quien use bien la API.

---

## Resumen

| # | Qué | Estado | ¿Nos bloquea? |
|---|---|---|---|
| 1 | Config de Firebase web | 🔴 Pendiente | **Sí** — el acceso por teléfono |
| 2 | Google / Apple | 🟡 En decisión | No |
| 3 | Detalle sin participantes | 🟢 Mejora | No |
| 4 | Mensaje de login unificado | 🟢 Detalle | No |

Con el punto 1 resuelto, la web queda funcionalmente completa para el MVP.
