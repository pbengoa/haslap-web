const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const meses = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const mesesCortos = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Sábado, 25 de mayo de 2026" */
export function fechaLarga(iso: string) {
  const d = new Date(iso);
  return `${capital(dias[d.getDay()])}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "25 May" */
export function fechaCorta(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${mesesCortos[d.getMonth()]}`;
}

/** "08:30" */
export function hora(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Etiqueta de la portada: "Hoy", "Mañana" o "Mié 5 Jun". */
export function etiquetaFecha(iso: string) {
  const d = new Date(iso);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = new Date(d);
  objetivo.setHours(0, 0, 0, 0);
  const diff = Math.round((objetivo.getTime() - hoy.getTime()) / 86400000);

  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  return `${capital(dias[d.getDay()]).slice(0, 3)} ${fechaCorta(iso)}`;
}

/**
 * `null` significa que el evento requiere entrada pero el importe vive en el
 * producto de PrestaShop y no llega en el listado. Se dice eso, no un precio
 * inventado ni un "0 €" falso.
 */
export const precio = (valor: number | null) => {
  if (valor === null) return 'Con entrada';
  return valor === 0 ? 'Gratis' : `${valor.toString().replace('.', ',')} €`;
};

/** "8/20" si hay aforo; "8 apuntados" si el evento no tiene límite. */
export const aforo = (asistentes: number, plazas: number | null) =>
  plazas === null ? `${asistentes} apuntados` : `${asistentes}/${plazas}`;

/** Fecha por defecto del formulario "Crear evento": el próximo sábado a las 09:00. */
export function proximoSabado() {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
