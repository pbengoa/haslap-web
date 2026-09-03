import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import type { Club, Evento, Opcion } from '../lib/tipos';
import { alHacerScroll, contenedorStagger, subirYAparecer } from '../lib/animaciones';
import { TarjetaEvento } from '../components/TarjetaEvento';
import { TarjetaClub } from '../components/TarjetaClub';
import { RejillaEsqueletos, EsqueletoClub } from '../components/Esqueletos';
import {
  FranjaCiudades,
  HeroInicio,
  Manifiesto,
  ParaQuien,
  type Estadisticas,
} from '../components/Landing';
import { ComoFunciona } from '../components/ComoFunciona';
import { Preguntas } from '../components/Preguntas';
import { IconoFlecha } from '../components/Iconos';

/** Salidas que pedimos: la primera hace de portada del hero, el resto van a la rejilla. */
const SALIDAS_EN_PORTADA = 4;

/**
 * Home.
 *
 * El orden está pensado para convertir rápido, no para contar una historia
 * bonita: primero qué es y qué puedes hacer, después el producto real, y solo
 * cuando ya hay interés, el porqué de la marca.
 *
 *   hero (valor + CTA + prueba)  →  salidas reales  →  para quién es
 *   →  clubes  →  cómo funciona  →  por qué existimos  →  dudas  →  cierre
 *
 * El hero va a sangre y en verde oscuro: es el único bloque de la web que rompe
 * el fondo blanco, y por eso puede permitírselo. De la franja de ciudades hacia
 * abajo manda otra vez el blanco y los componentes reales (TarjetaEvento,
 * TarjetaClub, las demos), solo que con más aire y titulares más grandes.
 */
export function Home({
  onUnirse,
  onCrearEvento,
  refresco,
}: {
  onUnirse: (evento: Evento) => void;
  onCrearEvento: () => void;
  refresco: number;
}) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [clubes, setClubes] = useState<Club[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [niveles, setNiveles] = useState<Opcion[]>([]);
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    Promise.all([
      api.eventos({ destacados: true, limite: SALIDAS_EN_PORTADA }),
      api.clubes({ limite: 3 }),
      api.estadisticas(),
      api.meta(),
    ])
      .then(([e, c, s, m]) => {
        if (!vivo) return;
        setEventos(e.eventos);
        setClubes(c.clubes);
        setEstadisticas(s);
        setNiveles(m.niveles);
        setCiudades(m.ciudades ?? []);
      })
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [refresco]);

  const [destacado, ...resto] = eventos;

  return (
    <div>
      {/* ----------------------------------------------------------------
        * Hero
        *
        * El CTA de acento apunta a BUSCAR, no a crear. Quien llega por primera
        * vez no quiere publicar una salida: quiere encontrar una. Crear pasa a
        * acción secundaria, para quien ya sabe a qué viene.
        * ---------------------------------------------------------------- */}
      <HeroInicio
        datos={estadisticas}
        destacado={destacado ?? null}
        cargando={cargando}
        onUnirse={onUnirse}
        onCrearEvento={onCrearEvento}
      />

      <FranjaCiudades ciudades={ciudades} />

      <div className="contenedor pt-16">
        {/* ---------- El producto, inmediatamente ---------- */}
        <section>
          <div className="mb-7 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div>
              <h2 className="text-[26px] leading-tight font-black tracking-[-0.035em] text-texto sm:text-[34px]">
                Salidas abiertas ahora mismo
              </h2>
              <p className="mt-2 text-[15px] text-texto-suave sm:text-[16px]">
                Con plazas libres y listas para apuntarse.
              </p>
            </div>
            <Link to="/eventos" className="btn btn-md btn-contorno shrink-0">
              {estadisticas ? `Ver las ${estadisticas.salidasAbiertas}` : 'Ver todas'}
              <IconoFlecha className="h-4 w-4" />
            </Link>
          </div>

          {cargando ? (
            <RejillaEsqueletos cantidad={3} />
          ) : (
            <motion.div
              {...alHacerScroll}
              variants={contenedorStagger}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {resto.map((evento) => (
                <TarjetaEvento key={evento.id} evento={evento} onUnirse={onUnirse} />
              ))}
            </motion.div>
          )}
        </section>

        {/* ---------- Quita la barrera del ritmo ---------- */}
        <ParaQuien niveles={niveles} />

        {/* ---------- Clubes populares ---------- */}
        <section className="mt-24">
          <div className="mb-7 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div>
              <h2 className="text-[26px] leading-tight font-black tracking-[-0.035em] text-texto sm:text-[34px]">
                Clubes que salen cada semana
              </h2>
              <p className="mt-2 text-[15px] text-texto-suave sm:text-[16px]">
                Grupos fijos, mismo día y misma hora. Sin cuota de entrada.
              </p>
            </div>
            <Link to="/clubes" className="btn btn-md btn-contorno shrink-0">
              {estadisticas ? `Ver los ${estadisticas.clubes}` : 'Ver todos'}
              <IconoFlecha className="h-4 w-4" />
            </Link>
          </div>

          {cargando ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <EsqueletoClub key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              {...alHacerScroll}
              variants={contenedorStagger}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {clubes.map((club) => (
                <TarjetaClub key={club.id} club={club} />
              ))}
            </motion.div>
          )}
        </section>
      </div>

      {/* ---------- Cómo funciona: demostrado, no contado ---------- */}
      <ComoFunciona />

      <div className="contenedor pb-4">
        {/* ---------- Por qué existimos: ahora que ya sabe qué es ---------- */}
        <Manifiesto />

        {/* ---------- Objeciones reales antes del cierre ---------- */}
        <Preguntas />

        {/* ---------- Cierre ---------- */}
        <motion.section
          {...alHacerScroll}
          variants={contenedorStagger}
          className="relative mt-24 overflow-hidden rounded-ds-xl bg-verde-900 px-8 py-16 text-center text-white sm:px-12 sm:py-20"
        >
          <div className="patron-diagonal pointer-events-none absolute inset-0" aria-hidden="true" />

          <div className="relative">
            <motion.h2
              variants={subirYAparecer}
              className="mx-auto max-w-3xl text-[32px] leading-[1.05] font-black tracking-[-0.04em] text-balance sm:text-[46px]"
            >
              Tu próxima salida ya está publicada. Solo falta que aparezcas.
            </motion.h2>
            <motion.p
              variants={subirYAparecer}
              className="mx-auto mt-5 max-w-md text-[16px] text-white/65 sm:text-[17px]"
            >
              Mira lo que hay esta semana en tu ciudad. Apuntarte lleva dos clics.
            </motion.p>
            <motion.div
              variants={subirYAparecer}
              className="mt-8 flex flex-wrap justify-center gap-3"
            >
              <Link to="/eventos" className="btn btn-lg btn-acento">
                Ver salidas abiertas
                <IconoFlecha className="h-4 w-4" />
              </Link>
              <Link to="/clubes" className="btn btn-lg btn-contorno-claro">
                Explorar clubes
              </Link>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
