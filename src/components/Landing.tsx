import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  alHacerScroll,
  contenedorStagger,
  entrarDesdeIzquierda,
  subirYAparecer,
  tapBoton,
} from '../lib/animaciones';
import { aforo, etiquetaFecha, hora } from '../lib/formato';
import type { Evento, Opcion } from '../lib/tipos';
import { IconoFlecha, IconoPersonas } from './Iconos';
import {
  Contador,
  Inclinable,
  Marquesina,
  PuntoLatido,
  TituloPorPalabras,
} from './Movimiento';

/**
 * Bloques de contexto de la landing.
 *
 * Sin esto la home entra directa al catálogo de eventos y quien llega de cero
 * nunca llega a saber qué es Haslap ni si es para él. Estas secciones responden,
 * en orden: qué somos, cuánta gente hay ya, y si encajo.
 */

export type Estadisticas = {
  salidasAbiertas: number;
  clubes: number;
  ciudades: number;
  plazasDisponibles: number;
};

/* ------------------------------------------------------------------ *
 * Hero — bloque verde oscuro a sangre
 * ------------------------------------------------------------------ */

/**
 * La salida real que hace de "imagen" del hero.
 *
 * A propósito no hay stack de avatares como en el mockup: serían caras
 * inventadas. En su lugar va el aforo real, que dice lo mismo —hay gente
 * apuntada— y además es verdad.
 */
function TarjetaDestacada({
  evento,
  onUnirse,
}: {
  evento: Evento;
  onUnirse: (evento: Evento) => void;
}) {
  const libres = evento.plazasDisponibles;
  // Flúor solo cuando la escasez es real. Con aforo abierto no hay urgencia que marcar.
  const apremia = libres !== null && libres > 0 && libres <= 5;

  const datos = [evento.nivel, evento.ritmo, evento.distanciaKm ? `${evento.distanciaKm} km` : null]
    .filter((d): d is string => Boolean(d));

  return (
    <Inclinable intensidad={5}>
      <div className="rounded-ds-xl bg-white p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          {libres !== null ? (
            <span
              className={`badge uppercase ${apremia ? 'bg-fluor text-texto' : 'bg-verde-100 text-verde'}`}
            >
              {libres === 1 ? '1 plaza' : `${libres} plazas`}
            </span>
          ) : (
            <span className="badge bg-verde-100 text-verde uppercase">Plazas abiertas</span>
          )}
          <span className="text-[13px] font-semibold text-texto-suave">
            {etiquetaFecha(evento.fecha)} {hora(evento.fecha)}
          </span>
        </div>

        <Link to={`/eventos/${evento.slug}`} className="mt-4 block">
          <h3 className="text-[20px] leading-tight font-extrabold tracking-tight text-texto sm:text-[22px]">
            {evento.titulo}
          </h3>
          <p className="mt-1.5 text-[14px] text-texto-suave">
            {[evento.club?.nombre, evento.ciudad].filter(Boolean).join(' · ')}
          </p>
        </Link>

        {datos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {datos.map((dato, i) => (
              <span
                key={dato}
                className={`inline-flex h-[30px] items-center rounded-full px-3 text-[12px] font-semibold ${
                  i === 0 ? 'bg-verde-100 text-verde' : 'bg-superficie text-texto-suave'
                }`}
              >
                {dato}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-linea pt-4">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-texto-suave">
            <IconoPersonas className="h-4 w-4" />
            {aforo(evento.asistentes, evento.plazas)}
          </span>
          <motion.button
            {...tapBoton}
            type="button"
            disabled={evento.completo && !evento.inscrito}
            onClick={() => onUnirse(evento)}
            className={`btn btn-sm ${evento.inscrito ? 'btn-contorno' : 'btn-identidad'}`}
          >
            {evento.inscrito ? 'Apuntado' : evento.completo ? 'Completo' : 'Apuntarme'}
          </motion.button>
        </div>
      </div>
    </Inclinable>
  );
}

function EsqueletoDestacada() {
  return (
    <div className="animate-pulse rounded-ds-xl bg-white p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] sm:p-6">
      <div className="flex items-center justify-between">
        <span className="h-6 w-20 rounded-full bg-linea" />
        <span className="h-4 w-24 rounded-full bg-linea-suave" />
      </div>
      <div className="mt-5 h-6 w-3/4 rounded-full bg-linea" />
      <div className="mt-2.5 h-4 w-1/2 rounded-full bg-linea-suave" />
      <div className="mt-5 flex gap-2">
        <span className="h-[30px] w-24 rounded-full bg-linea-suave" />
        <span className="h-[30px] w-20 rounded-full bg-linea-suave" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-linea pt-4">
        <span className="h-4 w-16 rounded-full bg-linea-suave" />
        <span className="h-9 w-28 rounded-full bg-linea" />
      </div>
    </div>
  );
}

/**
 * Hero de la home.
 *
 * Todas las cifras vienen del API: el contador del badge, las tres columnas de
 * abajo y la salida destacada. Mientras no han llegado, cada hueco se calla en
 * vez de enseñar un número de relleno.
 */
export function HeroInicio({
  datos,
  destacado,
  cargando,
  onUnirse,
  onCrearEvento,
}: {
  datos: Estadisticas | null;
  destacado: Evento | null;
  cargando: boolean;
  onUnirse: (evento: Evento) => void;
  onCrearEvento: () => void;
}) {
  const cifras = datos
    ? [
        { valor: datos.plazasDisponibles, etiqueta: 'plazas libres' },
        { valor: datos.clubes, etiqueta: datos.clubes === 1 ? 'club' : 'clubes' },
        { valor: datos.ciudades, etiqueta: datos.ciudades === 1 ? 'ciudad' : 'ciudades' },
      ]
    : [];

  return (
    <section className="relative overflow-hidden bg-verde-900">
      {/* Decorado: trama diagonal y dos círculos que se salen por la derecha. */}
      <div className="patron-diagonal pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-30 -right-40 h-130 w-130 rounded-full border border-fluor/20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-10 -right-16 h-75 w-75 rounded-full border border-fluor/10"
        aria-hidden="true"
      />

      <motion.div
        initial="oculto"
        animate="visible"
        variants={contenedorStagger}
        className="contenedor relative grid gap-12 pt-14 pb-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-14 lg:pt-20 lg:pb-24"
      >
        <div>
          {datos && (
            <motion.p
              variants={entrarDesdeIzquierda}
              className="inline-flex items-center gap-2.5 rounded-full border border-fluor/25 bg-fluor/10 py-1.5 pr-3.5 pl-3 text-[12px] font-bold tracking-[0.06em] text-fluor uppercase"
            >
              <PuntoLatido />
              {datos.salidasAbiertas}{' '}
              {datos.salidasAbiertas === 1 ? 'salida abierta' : 'salidas abiertas'}
            </motion.p>
          )}

          <motion.h1
            variants={entrarDesdeIzquierda}
            className="mt-5 text-[44px] leading-[0.98] font-black tracking-[-0.045em] text-white sm:text-[62px] lg:text-[78px] lg:leading-[0.96]"
          >
            Este sábado
            <br />
            hay gente
            <br />
            corriendo
            <br />
            <span className="text-fluor">por tu barrio.</span>
          </motion.h1>

          <motion.p
            variants={entrarDesdeIzquierda}
            className="mt-6 max-w-md text-[17px] leading-relaxed text-white/70 sm:text-[18px]"
          >
            Salidas con nivel y ritmo escritos por adelantado. Miras, te apuntas y apareces. Sin
            cuotas y sin conocer a nadie.
          </motion.p>

          <motion.div variants={entrarDesdeIzquierda} className="mt-8 flex flex-wrap gap-3">
            <Link to="/eventos" className="btn btn-lg btn-acento">
              Ver salidas abiertas
              <IconoFlecha className="h-4 w-4" />
            </Link>
            <motion.button
              {...tapBoton}
              type="button"
              onClick={onCrearEvento}
              className="btn btn-lg btn-contorno-claro"
            >
              Publicar una salida
            </motion.button>
          </motion.div>

          {cifras.length > 0 && (
            <motion.div
              variants={entrarDesdeIzquierda}
              className="mt-11 flex gap-10 border-t border-white/15 pt-6 sm:gap-12"
            >
              {cifras.map((cifra) => (
                <div key={cifra.etiqueta}>
                  <Contador
                    valor={cifra.valor}
                    className="block text-[26px] leading-none font-black tracking-tight text-white sm:text-[30px]"
                  />
                  <div className="mt-1.5 text-[13px] text-white/55">{cifra.etiqueta}</div>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* El producto como imagen: una salida de verdad, elevada sobre el verde. */}
        {(cargando || destacado) && (
          <motion.div variants={subirYAparecer} className="lg:translate-y-8">
            {destacado ? (
              <TarjetaDestacada evento={destacado} onUnirse={onUnirse} />
            ) : (
              <EsqueletoDestacada />
            )}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Franja de ciudades
 * ------------------------------------------------------------------ */
/**
 * Las ciudades salen de `/meta`, que las deduce de los eventos que hay. Si
 * todavía no han llegado —o hay tan pocas que la marquesina se vería vacía— la
 * franja no se pinta.
 */
export function FranjaCiudades({ ciudades }: { ciudades: string[] }) {
  if (ciudades.length < 4) return null;

  return (
    <div className="bg-fluor py-3.5 text-[13px] font-extrabold tracking-[0.1em] text-texto uppercase">
      <Marquesina elementos={ciudades} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Qué es Haslap y por qué existe
 * ------------------------------------------------------------------ */
export function Manifiesto() {
  return (
    <motion.section {...alHacerScroll} variants={contenedorStagger} className="mt-24">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <motion.div variants={subirYAparecer}>
          <p className="text-[12px] font-extrabold tracking-[0.12em] text-verde uppercase">
            Por qué existe Haslap
          </p>
          <TituloPorPalabras
            texto="Nadie debería dejar de correr por no tener con quién."
            resalta={['con', 'quién']}
            className="mt-4 text-[34px] leading-[1.04] font-black tracking-[-0.045em] text-balance text-texto sm:text-[46px]"
          />
        </motion.div>

        <motion.div variants={subirYAparecer} className="lg:pt-12">
          <p className="text-[16px] leading-relaxed text-pretty text-texto-suave sm:text-[17px]">
            En tu ciudad hay cientos de personas que salen a la misma hora y por las mismas calles
            que tú. La única razón por la que corréis por separado es que no os conocéis.
          </p>

          <p className="mt-7 border-l-[3px] border-fluor pl-5 text-[18px] leading-snug font-bold text-texto sm:text-[19px]">
            Que salir a correr acompañado sea tan fácil como salir a correr solo.
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ *
 * ¿Es para mí? — la barrera real del running en grupo es el ritmo
 * ------------------------------------------------------------------ */
/**
 * Cada perfil se ata a un `código` de nivel del backend, no a su etiqueta: el
 * nombre visible ("Principiante") se puede cambiar desde el back-office, el
 * código no. Si un nivel no existe en esta instalación, su tarjeta no se pinta.
 */
const PERFILES = [
  {
    codigo: 'beginner',
    titulo: 'Estás empezando',
    texto:
      'Salidas de nivel principiante, ritmos suaves y grupos donde nadie se queda atrás. No hace falta que corras rápido: hace falta que aparezcas.',
  },
  {
    codigo: 'intermediate',
    titulo: 'Ya corres de forma habitual',
    texto:
      'Rodajes entre semana y tiradas largas el fin de semana, a ritmo conversado, para sumar kilómetros sin que se te hagan eternos.',
  },
  {
    codigo: 'advanced',
    titulo: 'Vas a por marca',
    texto:
      'Series en pista, tempo y clubes que aprietan de verdad. Encuentra gente de tu nivel que te obligue a no bajar el pie.',
  },
];

/**
 * Esta sección promete que cada salida indica su nivel. Si el origen de datos
 * no tiene niveles (el backend real de PrestaShop no los guarda) la sección no
 * se pinta: prometerlo sería mentir al visitante.
 */
export function ParaQuien({ niveles }: { niveles: Opcion[] }) {
  const disponibles = PERFILES.map((p) => ({
    ...p,
    nivel: niveles.find((n) => n.codigo === p.codigo),
  })).filter((p) => p.nivel);

  if (disponibles.length === 0) return null;

  return (
    <motion.section {...alHacerScroll} variants={contenedorStagger} className="mt-24">
      <motion.div variants={subirYAparecer} className="max-w-2xl">
        <p className="text-[12px] font-extrabold tracking-[0.12em] text-verde uppercase">
          Para quién es
        </p>
        <h2 className="mt-4 text-[30px] leading-[1.05] font-black tracking-[-0.04em] text-texto sm:text-[40px]">
          No importa a qué ritmo vayas
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-pretty text-texto-suave sm:text-[17px]">
          La duda de siempre antes de una salida en grupo es «¿aguantaré?». Cada salida dice su
          nivel y su ritmo por adelantado, así que lo sabes antes de ir.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {disponibles.map((perfil, i) => (
          <motion.article
            key={perfil.titulo}
            variants={subirYAparecer}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="tarjeta flex flex-col p-6 sm:p-7"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="badge bg-verde-100 text-verde uppercase">{perfil.nivel!.nombre}</span>
              <span
                className="text-[30px] font-black tracking-[-0.04em] text-linea"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>

            <h3 className="mt-4 text-[20px] font-extrabold tracking-tight text-texto">
              {perfil.titulo}
            </h3>
            <p className="mt-2.5 flex-1 text-[14px] leading-relaxed text-texto-suave">
              {perfil.texto}
            </p>

            <Link
              to={`/eventos?nivel=${encodeURIComponent(perfil.codigo)}`}
              className="btn btn-sm btn-fantasma mt-5 -ml-4 w-fit"
            >
              Ver salidas de este nivel
              <IconoFlecha className="h-4 w-4" />
            </Link>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
