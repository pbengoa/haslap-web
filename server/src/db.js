/**
 * Store en memoria con data dummy para el MVP.
 * No hay base de datos todavía: al reiniciar el server se vuelve al seed.
 */
import bcrypt from 'bcryptjs';

/** Devuelve una fecha ISO a N días de hoy, a la hora indicada. */
function enDias(dias, hora = '08:30') {
  const [h, m] = hora.split(':').map(Number);
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const foto = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

export const usuarios = [
  {
    id: 'u_1',
    nombre: 'Tere Vidal',
    email: 'tere@haslap.com',
    passwordHash: bcrypt.hashSync('haslap123', 10),
    avatar: 'https://i.pravatar.cc/160?img=47',
    ciudad: 'Madrid',
    proveedor: 'email',
  },
  {
    id: 'u_2',
    nombre: 'Javier Morales',
    email: 'javier@haslap.com',
    passwordHash: bcrypt.hashSync('haslap123', 10),
    avatar: 'https://i.pravatar.cc/160?img=12',
    ciudad: 'Madrid',
    proveedor: 'email',
  },
  {
    id: 'u_3',
    nombre: 'Laura G.',
    email: 'laura@haslap.com',
    passwordHash: bcrypt.hashSync('haslap123', 10),
    avatar: 'https://i.pravatar.cc/160?img=32',
    ciudad: 'Barcelona',
    proveedor: 'email',
  },
];

export const clubes = [
  {
    id: 'c_1',
    nombre: 'Mad Runners',
    slug: 'mad-runners',
    ciudad: 'Madrid',
    iniciales: 'MAD',
    color: '#111111',
    descripcion:
      'Comunidad de runners que disfrutan entrenando juntos, compartiendo rutas y mejorando día a día. Todos los niveles son bienvenidos.',
    nivel: 'Todos los niveles',
    salidasPorSemana: 3,
    miembros: 1254,
    portada: foto('1552674605-db6ffd4facb5'),
    premium: true,
    organizadorId: 'u_2',
  },
  {
    id: 'c_2',
    nombre: 'Green Runners',
    slug: 'green-runners',
    ciudad: 'Madrid',
    iniciales: 'GR',
    color: '#4A7D76',
    descripcion:
      'Salidas por parques y zonas verdes de Madrid. Ritmo conversado, cero presión y mucha comunidad.',
    nivel: 'Intermedio',
    salidasPorSemana: 2,
    miembros: 842,
    portada: foto('1571008887538-b36bb32f4571'),
    premium: false,
    organizadorId: 'u_1',
  },
  {
    id: 'c_3',
    nombre: 'Run East Madrid',
    slug: 'run-east-madrid',
    ciudad: 'Madrid',
    iniciales: 'RUN EAST',
    color: '#D8FF2A',
    descripcion:
      'Series, tempo y tiradas largas por el este de Madrid. Para quienes buscan bajar marca con buen ambiente.',
    nivel: 'Avanzado',
    salidasPorSemana: 4,
    miembros: 623,
    portada: foto('1502224562085-639556652f33'),
    premium: true,
    organizadorId: 'u_2',
  },
  {
    id: 'c_4',
    nombre: 'Run Barcelona',
    slug: 'run-barcelona',
    ciudad: 'Barcelona',
    iniciales: 'RUN BCN',
    color: '#4A7D76',
    descripcion:
      'Comunidad de running en Barcelona. Salidas grupales todas las semanas por la playa, Collserola y ciudad.',
    nivel: 'Intermedio',
    salidasPorSemana: 3,
    miembros: 128,
    portada: foto('1476480862126-209bfaa8edc8'),
    premium: false,
    organizadorId: 'u_3',
  },
];

export const eventos = [
  {
    id: 'e_1',
    slug: 'running-al-amanecer-madrid-rio',
    titulo: 'Running al amanecer por Madrid Río',
    resumen:
      'Comenzamos el día con buena energía, kilómetros y un gran grupo. ¡Todos son bienvenidos!',
    descripcion:
      'Trote suave de 10K por Madrid Río para disfrutar del amanecer y conocer gente con la misma pasión por el running. Ritmo cómodo, sin prisas y con buen ambiente.\n\nPunto de encuentro en la entrada principal junto al puente. Lleva agua y ganas de disfrutar.',
    fecha: enDias(1, '08:30'),
    ciudad: 'Madrid',
    lugar: 'Madrid Río',
    direccion: 'Puente de Toledo, 28005 Madrid',
    nivel: 'Intermedio',
    distanciaKm: 10,
    ritmo: '5:30 – 6:00 min/km',
    terreno: 'Asfalto y tierra compacta',
    precio: 0,
    plazas: 60,
    portada: foto('1552674605-db6ffd4facb5'),
    organizadorId: 'u_2',
    clubId: 'c_1',
    destacado: true,
  },
  {
    id: 'e_2',
    slug: 'larga-distancia-18k-casa-de-campo',
    titulo: 'Larga distancia: 18K por Casa de Campo',
    resumen:
      'Tirada larga y tranquila por la Casa de Campo. Ritmo cómodo para disfrutar, conversar y sumar kilómetros juntos.',
    descripcion:
      'Tirada larga y tranquila por la Casa de Campo. Ritmo cómodo para disfrutar, conversar y sumar kilómetros juntos.\n\nPunto de encuentro en la entrada principal junto al lago. Lleva agua y ganas de disfrutar.',
    fecha: enDias(4, '09:00'),
    ciudad: 'Madrid',
    lugar: 'Casa de Campo',
    direccion: 'Entrada principal Casa de Campo, 28011 Madrid',
    nivel: 'Intermedio',
    distanciaKm: 18,
    ritmo: '5:30 – 6:00 min/km',
    terreno: 'Tierra y sendero',
    precio: 0,
    plazas: 30,
    portada: foto('1571008887538-b36bb32f4571'),
    organizadorId: 'u_3',
    clubId: 'c_1',
    destacado: true,
  },
  {
    id: 'e_3',
    slug: 'trote-suave-tecnica-madrid-rio',
    titulo: 'Trote suave + técnica de carrera',
    resumen:
      'Sesión pensada para quien empieza: 5K muy suaves y 20 minutos de ejercicios de técnica.',
    descripcion:
      'Sesión pensada para quien empieza en el running. Hacemos 5K muy suaves y terminamos con 20 minutos de ejercicios de técnica de carrera guiados.\n\nNo necesitas experiencia previa, solo zapatillas y ganas.',
    fecha: enDias(7, '19:00'),
    ciudad: 'Madrid',
    lugar: 'Madrid Río',
    direccion: 'Matadero Madrid, 28045 Madrid',
    nivel: 'Principiante',
    distanciaKm: 5,
    ritmo: '6:30 – 7:00 min/km',
    terreno: 'Asfalto',
    precio: 0,
    plazas: 30,
    portada: foto('1502224562085-639556652f33'),
    organizadorId: 'u_1',
    clubId: 'c_2',
    destacado: true,
  },
  {
    id: 'e_4',
    slug: 'rodaje-suave-por-el-retiro',
    titulo: 'Rodaje suave por el Retiro',
    resumen: 'Rodaje de 8K por el Retiro a ritmo conversado, entre semana y después del trabajo.',
    descripcion:
      'Rodaje de 8K por el Parque del Retiro a ritmo conversado. Perfecto para soltar piernas entre semana después del trabajo.\n\nSalimos puntuales desde la Puerta de Alcalá.',
    fecha: enDias(3, '19:00'),
    ciudad: 'Madrid',
    lugar: 'Parque del Retiro',
    direccion: 'Puerta de Alcalá, 28009 Madrid',
    nivel: 'Todos los niveles',
    distanciaKm: 8,
    ritmo: '6:00 min/km',
    terreno: 'Tierra compacta',
    precio: 0,
    plazas: 25,
    portada: foto('1486218119243-13883505764c'),
    organizadorId: 'u_2',
    clubId: 'c_1',
    destacado: false,
  },
  {
    id: 'e_5',
    slug: 'series-en-la-pista-de-vallehermoso',
    titulo: 'Series en la pista de Vallehermoso',
    resumen: '10 x 400m con recuperación activa. Sesión de calidad para bajar marca en 10K.',
    descripcion:
      'Sesión de calidad en pista: calentamiento, 10 x 400m con recuperación activa y vuelta a la calma.\n\nRecomendado si ya corres 10K por debajo de 55 minutos.',
    fecha: enDias(6, '19:30'),
    ciudad: 'Madrid',
    lugar: 'Pista Vallehermoso',
    direccion: 'C. de Sinesio Delgado, 28029 Madrid',
    nivel: 'Avanzado',
    distanciaKm: 6,
    ritmo: '4:15 min/km en series',
    terreno: 'Pista de atletismo',
    precio: 5,
    plazas: 20,
    portada: foto('1461896836934-ffe607ba8211'),
    organizadorId: 'u_2',
    clubId: 'c_3',
    destacado: false,
  },
  {
    id: 'e_6',
    slug: 'salida-10k-barceloneta',
    titulo: 'Salida 10K Barceloneta',
    resumen: 'Diez kilómetros junto al mar con parada final para desayunar todos juntos.',
    descripcion:
      'Diez kilómetros junto al mar saliendo desde la Barceloneta. Terminamos con un desayuno de grupo en el paseo.\n\nRitmo cómodo, nadie se queda atrás.',
    fecha: enDias(2, '08:00'),
    ciudad: 'Barcelona',
    lugar: 'Barceloneta',
    direccion: 'Passeig Marítim, 08003 Barcelona',
    nivel: 'Todos los niveles',
    distanciaKm: 10,
    ritmo: '5:45 min/km',
    terreno: 'Paseo marítimo',
    precio: 0,
    plazas: 40,
    portada: foto('1476480862126-209bfaa8edc8'),
    organizadorId: 'u_3',
    clubId: 'c_4',
    destacado: true,
  },
  {
    id: 'e_7',
    slug: 'tirada-larga-en-collserola',
    titulo: 'Tirada larga en Collserola',
    resumen: 'Trail de 16K por Collserola con 600m de desnivel positivo. Nivel avanzado.',
    descripcion:
      'Trail de 16K por Collserola con unos 600m de desnivel positivo. Subida constante y bajada técnica.\n\nImprescindible llevar al menos 500ml de agua.',
    fecha: enDias(9, '08:30'),
    ciudad: 'Barcelona',
    lugar: 'Collserola',
    direccion: 'Baixador de Vallvidrera, 08017 Barcelona',
    nivel: 'Avanzado',
    distanciaKm: 16,
    ritmo: '6:30 min/km',
    terreno: 'Trail / montaña',
    precio: 0,
    plazas: 18,
    portada: foto('1502224562085-639556652f33'),
    organizadorId: 'u_3',
    clubId: 'c_4',
    destacado: false,
  },
  {
    id: 'e_8',
    slug: 'fartlek-por-la-playa',
    titulo: 'Fartlek por la playa',
    resumen: 'Juego de ritmos sobre arena compacta, 45 minutos de trabajo variable.',
    descripcion:
      'Juego de ritmos sobre arena compacta: 45 minutos alternando tramos rápidos y suaves según sensaciones.\n\nEntrenamiento divertido y exigente a partes iguales.',
    fecha: enDias(11, '10:00'),
    ciudad: 'Barcelona',
    lugar: 'Platja del Bogatell',
    direccion: 'Platja del Bogatell, 08005 Barcelona',
    nivel: 'Intermedio',
    distanciaKm: 9,
    ritmo: 'Variable',
    terreno: 'Arena',
    precio: 0,
    plazas: 24,
    portada: foto('1486218119243-13883505764c'),
    organizadorId: 'u_3',
    clubId: 'c_4',
    destacado: false,
  },
];

/** Inscripciones a eventos: { id, eventoId, usuarioId, creadoEn } */
export const inscripciones = [
  { id: 'i_1', eventoId: 'e_1', usuarioId: 'u_1', creadoEn: new Date().toISOString() },
  { id: 'i_2', eventoId: 'e_6', usuarioId: 'u_1', creadoEn: new Date().toISOString() },
];

/** Membresías de club: { id, clubId, usuarioId } */
export const membresias = [{ id: 'm_1', clubId: 'c_1', usuarioId: 'u_1' }];

/**
 * Ocupación "de mentira" para que los contadores no partan en 0:
 * asistentes ya apuntados que no son usuarios registrados de la demo.
 */
export const asistentesBase = {
  e_1: 41,
  e_2: 18,
  e_3: 15,
  e_4: 12,
  e_5: 8,
  e_6: 27,
  e_7: 11,
  e_8: 14,
};

let contador = 1000;
export const nuevoId = (prefijo) => `${prefijo}_${++contador}`;
