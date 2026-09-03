import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import type { Club, Evento } from '../lib/tipos';
import { useAuth } from '../lib/auth';
import { TarjetaEvento } from '../components/TarjetaEvento';
import { TarjetaClub } from '../components/TarjetaClub';
import { RejillaEsqueletos, EstadoVacio } from '../components/Esqueletos';
import { EstadisticasBloqueadas } from '../components/BloqueadoEnApp';
import { contenedorStagger, resorte, subirYAparecer } from '../lib/animaciones';

const PESTANAS = [
  { id: 'proximos', texto: 'Próximos' },
  { id: 'organizados', texto: 'Organizo yo' },
  { id: 'clubes', texto: 'Mis clubes' },
] as const;

type Pestana = (typeof PESTANAS)[number]['id'];

export function MisEventos({
  onUnirse,
  refresco,
}: {
  onUnirse: (evento: Evento) => void;
  refresco: number;
}) {
  const { usuario, cargando: cargandoAuth } = useAuth();

  const [pestana, setPestana] = useState<Pestana>('proximos');
  const [proximos, setProximos] = useState<Evento[]>([]);
  const [organizados, setOrganizados] = useState<Evento[]>([]);
  const [clubes, setClubes] = useState<Club[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!usuario) {
      setCargando(false);
      return;
    }
    let vivo = true;
    setCargando(true);
    Promise.all([api.misEventos(), api.misEventosOrganizados(), api.misClubes()])
      .then(([mis, org, cl]) => {
        if (!vivo) return;
        setProximos(mis.proximos);
        setOrganizados(org.eventos);
        setClubes(cl.clubes);
      })
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [usuario, refresco]);

  if (cargandoAuth) {
    return (
      <div className="contenedor py-8">
        <RejillaEsqueletos cantidad={3} />
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="contenedor py-20 text-center">
        <h1 className="text-[28px] font-extrabold tracking-tight text-texto">
          Inicia sesión para ver tus eventos
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-texto-suave">
          Aquí aparecerán las salidas a las que te has apuntado y los clubes a los que perteneces.
        </p>
        <Link to="/entrar?volver=/mis-eventos" className="btn btn-lg btn-acento mt-7">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="contenedor py-8">
      <motion.header initial="oculto" animate="visible" variants={contenedorStagger}>
        <motion.h1
          variants={subirYAparecer}
          className="text-[34px] leading-tight font-extrabold tracking-tight text-texto"
        >
          Hola, {usuario.nombre.split(' ')[0]}
        </motion.h1>
        <motion.p variants={subirYAparecer} className="mt-1.5 text-[15px] text-texto-suave">
          Estas son tus próximas salidas y los clubes a los que perteneces.
        </motion.p>

        <motion.div variants={subirYAparecer} className="mt-6 flex flex-wrap gap-2">
          {PESTANAS.map((p) => {
            const activa = pestana === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPestana(p.id)}
                className={`chip relative ${activa ? 'chip-activo' : ''}`}
              >
                {activa && (
                  <motion.span
                    layoutId="pestana-mis-eventos"
                    transition={resorte}
                    className="absolute inset-0 -z-10 rounded-full bg-verde"
                  />
                )}
                {p.texto}
              </button>
            );
          })}
        </motion.div>
      </motion.header>

      {/*
        El contenido de la pestaña se anima al montar, no al entrar en pantalla.
        Con `whileInView` + `once` el contenedor se quedaba en `visible` de la
        pestaña anterior y no volvía a propagar la variante, así que las tarjetas
        nuevas nacían en `oculto` y la pestaña se veía vacía. La `key` remonta el
        bloque en cada cambio para que la entrada se reproduzca desde cero.
      */}
      <div key={pestana} className="mt-8">
        {cargando ? (
          <RejillaEsqueletos cantidad={3} />
        ) : pestana === 'proximos' ? (
          proximos.length === 0 ? (
            <EstadoVacio
              titulo="Todavía no te has apuntado a nada"
              texto="Explora los eventos disponibles y únete a tu primera salida."
            />
          ) : (
            <motion.div
              initial="oculto"
              animate="visible"
              variants={contenedorStagger}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {proximos.map((evento) => (
                <TarjetaEvento key={evento.id} evento={evento} onUnirse={onUnirse} />
              ))}
            </motion.div>
          )
        ) : pestana === 'organizados' ? (
          organizados.length === 0 ? (
            <EstadoVacio
              titulo="Aún no has creado ningún evento"
              texto='Usa el botón "Crear evento" de la barra superior para publicar tu primera salida.'
            />
          ) : (
            <motion.div
              initial="oculto"
              animate="visible"
              variants={contenedorStagger}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {organizados.map((evento) => (
                <TarjetaEvento key={evento.id} evento={evento} />
              ))}
            </motion.div>
          )
        ) : clubes.length === 0 ? (
          <EstadoVacio
            titulo="No perteneces a ningún club"
            texto="Únete a un club para no perderte sus salidas semanales."
          />
        ) : (
          <motion.div
            initial="oculto"
            animate="visible"
            variants={contenedorStagger}
            className="grid gap-5 sm:grid-cols-2"
          >
            {clubes.map((club) => (
              <TarjetaClub key={club.id} club={club} />
            ))}
          </motion.div>
        )}
      </div>

      <div className="mt-12 max-w-xl">
        <EstadisticasBloqueadas
          titulo="Tus estadísticas de running"
          metricas={['Kilómetros acumulados', 'Salidas completadas', 'Ritmo medio']}
        />
      </div>
    </div>
  );
}
