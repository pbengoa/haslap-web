import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { api, ErrorApi } from '../lib/api';
import type { Evento } from '../lib/tipos';
import { fechaLarga, hora, precio } from '../lib/formato';
import { useAuth } from '../lib/auth';
import { useAviso } from '../components/Aviso';
import { Portada } from '../components/Portada';
import {
  BannerDescargaApp,
  EstadisticasBloqueadas,
  QuienSeApunta,
} from '../components/BloqueadoEnApp';
import {
  IconoCalendario,
  IconoCompartir,
  IconoFlechaIzquierda,
  IconoNivel,
  IconoPersonas,
  IconoReloj,
  IconoRuta,
  IconoTerreno,
  IconoUbicacion,
  IconoVerificado,
} from '../components/Iconos';
import { alHacerScroll, contenedorStagger, subirYAparecer, tapBoton } from '../lib/animaciones';

export function DetalleEvento({
  onUnirse,
  refresco,
}: {
  onUnirse: (evento: Evento) => void;
  refresco: number;
}) {
  const { id = '' } = useParams();
  const { usuario } = useAuth();
  const aviso = useAviso();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [saliendo, setSaliendo] = useState(false);
  const [noEncontrado, setNoEncontrado] = useState(false);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setNoEncontrado(false);
    api
      .evento(id)
      .then((r) => vivo && setEvento(r.evento))
      .catch(() => vivo && setNoEncontrado(true))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [id, refresco]);

  const cancelar = async () => {
    if (!evento) return;
    setSaliendo(true);
    try {
      const { evento: actualizado } = await api.salirEvento(evento.id);
      setEvento(actualizado);
      aviso('Has cancelado tu inscripción.');
    } catch (e) {
      aviso(e instanceof ErrorApi ? e.message : 'No pudimos cancelar la inscripción.', 'error');
    } finally {
      setSaliendo(false);
    }
  };

  const compartir = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: evento?.titulo, url });
      else {
        await navigator.clipboard.writeText(url);
        aviso('Enlace copiado al portapapeles.');
      }
    } catch {
      /* el usuario canceló el diálogo de compartir */
    }
  };

  if (cargando) {
    return (
      <div className="contenedor py-8">
        <div className="tarjeta h-[420px] animate-pulse bg-linea-suave" />
      </div>
    );
  }

  if (noEncontrado || !evento) {
    return (
      <div className="contenedor py-20 text-center">
        <h1 className="text-[24px] font-extrabold text-texto">Este evento no existe</h1>
        <p className="mt-2 text-[15px] text-texto-suave">
          Puede que se haya cancelado o que el enlace esté mal.
        </p>
        <Link to="/eventos" className="btn btn-md btn-identidad mt-6">
          Ver todos los eventos
        </Link>
      </div>
    );
  }

  const ocupacion =
    evento.plazas === null ? null : Math.min((evento.asistentes / evento.plazas) * 100, 100);

  return (
    <div className="contenedor py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="btn btn-sm btn-fantasma mb-5 -ml-4"
      >
        <IconoFlechaIzquierda className="h-4 w-4" />
        Volver
      </button>

      <motion.div
        initial="oculto"
        animate="visible"
        variants={contenedorStagger}
        className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
      >
        {/* ---------- Columna izquierda ---------- */}
        <motion.div variants={subirYAparecer}>
          <Portada
            src={evento.portada}
            alt={evento.titulo}
            className="h-64 w-full rounded-ds-xl sm:h-[360px]"
          />
        </motion.div>

        {/* ---------- Columna derecha: la conversión ---------- */}
        <motion.div variants={subirYAparecer}>
          <span className="badge bg-verde-100 text-verde uppercase">Evento de running</span>

          <h1 className="mt-3 text-[32px] leading-[1.1] font-extrabold tracking-tight text-texto sm:text-[38px]">
            {evento.titulo}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-texto-suave">{evento.resumen}</p>

          <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3 text-[14px]">
            <span className="inline-flex items-center gap-2 text-texto">
              <IconoCalendario className="h-4 w-4 text-verde" />
              {fechaLarga(evento.fecha)}
            </span>
            <span className="inline-flex items-center gap-2 text-texto">
              <IconoReloj className="h-4 w-4 text-verde" />
              {hora(evento.fecha)}
            </span>
            <span className="inline-flex items-start gap-2 text-texto">
              <IconoUbicacion className="mt-0.5 h-4 w-4 shrink-0 text-verde" />
              <span>
                {/* Hay eventos sin localidad: mejor omitirla que dejar ", España" suelto. */}
                {evento.ciudad ? `${evento.ciudad}, España` : 'España'}
                {evento.lugar && evento.lugar !== evento.ciudad && (
                  <span className="block text-[13px] text-texto-suave">{evento.lugar}</span>
                )}
              </span>
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {evento.nivel && (
              <span className="inline-flex items-center gap-2 rounded-full bg-linea-suave px-3.5 py-2 text-[13px] font-medium text-texto">
                <IconoNivel className="h-4 w-4 text-verde" />
                Nivel {evento.nivel.toLowerCase()}
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-linea-suave px-3.5 py-2 text-[13px] font-medium text-texto">
              <IconoPersonas className="h-4 w-4 text-verde" />
              {evento.plazas === null
                ? `${evento.asistentes} asistentes`
                : `${evento.asistentes}/${evento.plazas} asistentes`}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-linea-suave px-3.5 py-2 text-[13px] font-medium text-texto">
              {precio(evento.precio)}
            </span>
          </div>

          {/* Plazas disponibles */}
          {ocupacion !== null && (
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="text-texto-suave">Plazas disponibles</span>
                <span className="font-semibold text-texto">
                  {evento.plazasDisponibles} / {evento.plazas}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-linea">
                <motion.div
                  className="h-full rounded-full bg-verde"
                  initial={{ width: 0 }}
                  animate={{ width: `${ocupacion}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                />
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {evento.inscrito ? (
              <>
                <div className="flex items-center gap-2.5 rounded-ds-md bg-verde-50 px-4 py-3.5 text-[14px] font-semibold text-verde">
                  <IconoVerificado className="h-5 w-5" />
                  Ya estás apuntado a esta salida
                </div>
                <button
                  type="button"
                  onClick={cancelar}
                  disabled={saliendo}
                  className="btn btn-md btn-contorno w-full"
                >
                  {saliendo ? 'Cancelando...' : 'Cancelar inscripción'}
                </button>
              </>
            ) : (
              <motion.button
                {...tapBoton}
                type="button"
                disabled={evento.completo}
                onClick={() => onUnirse(evento)}
                className="btn btn-lg btn-acento w-full"
              >
                {evento.completo ? 'Evento completo' : 'Unirme'}
              </motion.button>
            )}

            <button type="button" onClick={compartir} className="btn btn-md btn-contorno w-full">
              <IconoCompartir className="h-4 w-4" />
              Compartir evento
            </button>
          </div>

          {!usuario && (
            <p className="mt-3 text-center text-[12px] text-texto-tenue">
              Necesitas{' '}
              <Link to={`/entrar?volver=/eventos/${evento.slug}`} className="font-semibold text-verde">
                iniciar sesión
              </Link>{' '}
              para apuntarte.
            </p>
          )}
        </motion.div>
      </motion.div>

      {/* ---------- Descripción / organizador / ubicación ---------- */}
      <motion.div
        {...alHacerScroll}
        variants={contenedorStagger}
        className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
      >
        <motion.section variants={subirYAparecer}>
          <h2 className="text-[17px] font-bold text-texto">Descripción</h2>
          {evento.descripcion.split('\n\n').map((parrafo) => (
            <p key={parrafo} className="mt-3 text-[14px] leading-relaxed text-texto-suave">
              {parrafo}
            </p>
          ))}

          <dl className="mt-6 grid gap-5 sm:grid-cols-3">
            {[
              evento.distanciaKm
                ? { icono: <IconoRuta className="h-4 w-4" />, clave: 'Distancia aproximada', valor: `${evento.distanciaKm} km` }
                : null,
              evento.ritmo
                ? { icono: <IconoReloj className="h-4 w-4" />, clave: 'Ritmo estimado', valor: evento.ritmo }
                : null,
              evento.terreno
                ? { icono: <IconoTerreno className="h-4 w-4" />, clave: 'Tipo de terreno', valor: evento.terreno }
                : null,
            ]
              // El backend puede no tener ritmo ni terreno: se omite la fila
              // entera en vez de enseñar un hueco o un dato inventado.
              .filter((d): d is { icono: React.ReactElement; clave: string; valor: string } => d !== null)
              .map((dato) => (
              <div key={dato.clave} className="flex gap-3">
                <span className="mt-0.5 text-verde">{dato.icono}</span>
                <div>
                  <dt className="text-[13px] font-semibold text-texto">{dato.clave}</dt>
                  <dd className="mt-0.5 text-[13px] text-texto-suave">{dato.valor}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-8">
            <QuienSeApunta />
          </div>

          {/* Las estadísticas viven en esta columna, no en la lateral: así las dos
              columnas quedan a una altura parecida y el blanco es aire, no un hueco. */}
          <div className="mt-6">
            <EstadisticasBloqueadas />
          </div>
        </motion.section>

        <motion.aside variants={subirYAparecer} className="space-y-6">
          {/* Organizador */}
          <section className="tarjeta p-5">
            <h2 className="text-[15px] font-bold text-texto">Organizador</h2>
            <div className="mt-4 flex items-center gap-3">
              {evento.organizador?.avatar ? (
                <img
                  src={evento.organizador.avatar}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-full bg-verde text-[15px] font-bold text-white">
                  {evento.organizador?.nombre.slice(0, 1)}
                </span>
              )}
              <div>
                <p className="inline-flex items-center gap-1.5 text-[14px] font-bold text-texto">
                  {evento.organizador?.nombre}
                  <IconoVerificado className="h-4 w-4 text-verde" />
                </p>
                <p className="text-[12px] text-texto-suave">Organizador en Haslap</p>
              </div>
            </div>
            {evento.club && (
              <Link
                to={`/clubes/${evento.clubId}`}
                className="btn btn-sm btn-contorno mt-4 w-full"
              >
                Ver club {evento.club.nombre}
              </Link>
            )}
          </section>

          {/* Ubicación */}
          <section className="tarjeta overflow-hidden">
            <h2 className="px-5 pt-5 text-[15px] font-bold text-texto">Ubicación</h2>
            <div className="relative mt-4 h-40 bg-verde-50">
              {/* Mapa decorativo: en producción iría un mapa real. */}
              <svg viewBox="0 0 400 160" className="h-full w-full" aria-hidden="true">
                <rect width="400" height="160" fill="var(--color-verde-100)" />
                <path d="M0 110h400M0 60h400M120 0v160M280 0v160" stroke="var(--color-linea)" strokeWidth="6" />
                <path d="M0 130 Q120 90 200 120 T400 95" stroke="var(--color-verde)" strokeOpacity="0.45" strokeWidth="10" fill="none" />
                <circle cx="200" cy="80" r="24" fill="var(--color-verde)" opacity="0.15" />
              </svg>
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-verde">
                <IconoUbicacion className="h-8 w-8" />
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-texto">Punto de encuentro</p>
                <p className="truncate text-[13px] text-texto-suave">{evento.direccion}</p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evento.direccion)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-fantasma shrink-0"
              >
                Cómo llegar
              </a>
            </div>
          </section>

        </motion.aside>
      </motion.div>

      <div className="mt-10">
        <BannerDescargaApp />
      </div>
    </div>
  );
}
