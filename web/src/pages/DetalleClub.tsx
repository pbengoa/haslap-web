import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { api, ErrorApi } from '../lib/api';
import type { Club, Evento } from '../lib/tipos';
import { fechaCorta, hora } from '../lib/formato';
import { useAuth } from '../lib/auth';
import { useAviso } from '../components/Aviso';
import { Portada } from '../components/Portada';
import { EscudoClub } from '../components/TarjetaClub';
import { BannerDescargaApp, EstadisticasBloqueadas } from '../components/BloqueadoEnApp';
import { EstadoVacio } from '../components/Esqueletos';
import {
  IconoFlechaIzquierda,
  IconoNivel,
  IconoPersonas,
  IconoRuta,
  IconoUbicacion,
} from '../components/Iconos';
import { alHacerScroll, contenedorStagger, subirYAparecer, tapBoton } from '../lib/animaciones';

export function DetalleClub({
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

  const [club, setClub] = useState<Club | null>(null);
  const [salidas, setSalidas] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    api
      .club(id)
      .then((r) => {
        if (!vivo) return;
        setClub(r.club);
        setSalidas(r.proximasSalidas);
      })
      .catch(() => vivo && setClub(null))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [id, refresco]);

  const alternarMembresia = async () => {
    if (!club) return;
    if (!usuario) {
      navigate(`/entrar?volver=/clubes/${club.slug}`);
      return;
    }
    setEnviando(true);
    try {
      const { club: actualizado } = club.esMiembro
        ? await api.salirClub(club.id)
        : await api.unirseClub(club.id);
      setClub(actualizado);
      aviso(actualizado.esMiembro ? `¡Bienvenido a ${club.nombre}!` : `Has salido de ${club.nombre}.`);
    } catch (e) {
      aviso(e instanceof ErrorApi ? e.message : 'No pudimos completar la acción.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div className="contenedor py-8">
        <div className="tarjeta h-[400px] animate-pulse bg-linea-suave" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="contenedor py-20 text-center">
        <h1 className="text-[24px] font-extrabold text-texto">Este club no existe</h1>
        <Link to="/clubes" className="btn btn-md btn-identidad mt-6">
          Ver todos los clubes
        </Link>
      </div>
    );
  }

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

      <motion.div initial="oculto" animate="visible" variants={contenedorStagger}>
        <motion.div variants={subirYAparecer} className="relative">
          <Portada
            src={club.portada}
            alt={club.nombre}
            className="h-56 w-full rounded-ds-xl sm:h-72"
          />
          <EscudoClub
            club={club}
            className="absolute -bottom-8 left-6 h-24 w-24 border-4 border-white text-[12px] shadow-card sm:left-8"
          />
        </motion.div>

        <motion.div
          variants={subirYAparecer}
          className="mt-12 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between"
        >
          <div className="max-w-2xl">
            <h1 className="text-[32px] leading-tight font-extrabold tracking-tight text-texto">
              {club.nombre}
            </h1>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[14px] text-texto-suave">
              <IconoUbicacion className="h-4 w-4 text-verde" />
              {club.ciudad}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-texto-suave">{club.descripcion}</p>
          </div>

          <div className="shrink-0 lg:w-64">
            <motion.button
              {...tapBoton}
              type="button"
              onClick={alternarMembresia}
              disabled={enviando}
              className={`btn btn-lg w-full ${club.esMiembro ? 'btn-contorno' : 'btn-acento'}`}
            >
              {enviando ? 'Un momento...' : club.esMiembro ? 'Salir del club' : 'Unirme al club'}
            </motion.button>
            <div className="mt-3 flex items-center justify-center gap-2 text-[13px] text-texto-suave">
              <div className="flex -space-x-2" aria-hidden="true">
                {[47, 12, 32, 68].map((n) => (
                  <img
                    key={n}
                    src={`https://i.pravatar.cc/64?img=${n}`}
                    alt=""
                    className="h-6 w-6 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              {club.miembros.toLocaleString('es-ES')} miembros
            </div>
          </div>
        </motion.div>

        {/* Métricas públicas del club */}
        <motion.div variants={subirYAparecer} className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            club.nivel ? { icono: <IconoNivel className="h-5 w-5" />, clave: 'Nivel', valor: club.nivel } : null,
            club.salidasPorSemana !== null
              ? { icono: <IconoRuta className="h-5 w-5" />, clave: 'Salidas por semana', valor: String(club.salidasPorSemana) }
              : null,
            { icono: <IconoPersonas className="h-5 w-5" />, clave: 'Miembros', valor: club.miembros.toLocaleString('es-ES') },
          ]
            .filter((d): d is { icono: React.ReactElement; clave: string; valor: string } => d !== null)
            .map((dato) => (
            <div key={dato.clave} className="tarjeta flex items-center justify-between p-5">
              <div>
                <p className="text-[12px] text-texto-tenue">{dato.clave}</p>
                <p className="mt-1 text-[17px] font-bold text-texto">{dato.valor}</p>
              </div>
              <span className="text-verde">{dato.icono}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Próximas salidas */}
      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-[22px] font-extrabold tracking-tight text-texto">Próximas salidas</h2>
          <Link to={`/eventos?ciudad=${club.ciudad}`} className="btn btn-sm btn-fantasma">
            Ver todas
          </Link>
        </div>

        {salidas.length === 0 ? (
          <EstadoVacio
            titulo="Sin salidas programadas"
            texto="Este club todavía no ha publicado su próxima salida."
          />
        ) : (
          <motion.ul {...alHacerScroll} variants={contenedorStagger} className="space-y-3">
            {salidas.map((salida) => (
              <motion.li
                key={salida.id}
                variants={subirYAparecer}
                className="tarjeta flex flex-col gap-4 p-3 sm:flex-row sm:items-center"
              >
                <Link to={`/eventos/${salida.slug}`} className="shrink-0">
                  <Portada
                    src={salida.portada}
                    alt={salida.titulo}
                    className="h-24 w-full rounded-ds-md sm:h-20 sm:w-32"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link to={`/eventos/${salida.slug}`}>
                    <h3 className="truncate text-[15px] font-bold text-texto hover:text-verde">
                      {salida.titulo}
                    </h3>
                  </Link>
                  <p className="mt-0.5 text-[13px] text-texto-suave">
                    {fechaCorta(salida.fecha)} — {hora(salida.fecha)}
                  </p>
                  <p className="text-[13px] text-texto-suave">
                    {salida.lugar}, {salida.ciudad}
                  </p>
                </div>

                <div className="flex items-center gap-4 sm:pr-3">
                  <span className="text-[13px] font-semibold text-texto-suave">
                    {salida.asistentes} / {salida.plazas}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUnirse(salida)}
                    disabled={salida.completo && !salida.inscrito}
                    className={`btn btn-sm ${salida.inscrito ? 'btn-contorno' : 'btn-identidad'}`}
                  >
                    {salida.inscrito ? 'Apuntado' : salida.completo ? 'Completo' : 'Unirme'}
                  </button>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </section>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <EstadisticasBloqueadas
          titulo="Estadísticas del club"
          metricas={['Miembros activos', 'Asistencia media', 'Kilómetros del grupo']}
        />
        <div className="lg:pt-0">
          <BannerDescargaApp
            titulo="Con la app puedes ver los miembros del club y chatear"
            texto="Recibe notificaciones de cada salida y sigue al resto de runners."
          />
        </div>
      </div>
    </div>
  );
}
