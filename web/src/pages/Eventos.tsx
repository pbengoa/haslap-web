import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { api, type FiltrosEventos } from '../lib/api';
import type { Evento, Opcion } from '../lib/tipos';
import { TarjetaEvento } from '../components/TarjetaEvento';
import { RejillaEsqueletos } from '../components/Esqueletos';
import { IconoBuscar, IconoCerrar } from '../components/Iconos';
import { contenedorStagger, entrarDesdeIzquierda, resorte, subirYAparecer } from '../lib/animaciones';

const CUANDO = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'hoy', texto: 'Hoy' },
  { valor: 'manana', texto: 'Mañana' },
  { valor: 'finde', texto: 'Este finde' },
];

/** Cuánto esperamos desde la última tecla antes de buscar. */
const ESPERA_BUSQUEDA = 350;

// Los niveles llegan de /api/meta: el backend real no los tiene y devuelve [].
// En ese caso el selector no se pinta en vez de ofrecer un filtro que no filtra.

/**
 * Catálogo de salidas.
 *
 * La página se divide en dos zonas con trabajos distintos: una cabecera oscura
 * que solo hace una cosa —buscar— y una barra de filtros pegajosa que acompaña
 * a los resultados mientras se hace scroll. Antes ambas cosas vivían juntas en
 * un bloque blanco y el buscador se perdía entre seis controles.
 *
 * Todos los filtros viven en la URL para que una búsqueda se pueda compartir.
 */
export function Eventos({
  onUnirse,
  refresco,
}: {
  onUnirse: (evento: Evento) => void;
  refresco: number;
}) {
  const [params, setParams] = useSearchParams();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [niveles, setNiveles] = useState<Opcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState(params.get('q') ?? '');

  const filtros: FiltrosEventos = useMemo(
    () => ({
      q: params.get('q') ?? '',
      ciudad: params.get('ciudad') ?? 'todas',
      nivel: params.get('nivel') ?? 'todos',
      cuando: params.get('cuando') ?? 'todos',
      gratis: params.get('gratis') === 'true',
      conPlazas: params.get('conPlazas') === 'true',
    }),
    [params],
  );

  useEffect(() => {
    api
      .meta()
      .then((m) => {
        setCiudades(m.ciudades);
        setNiveles(m.niveles);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    api
      .eventos(filtros)
      .then((r) => vivo && setEventos(r.eventos))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [filtros, refresco]);

  /** Escribe un filtro en la URL, para que la búsqueda sea compartible. */
  const cambiarFiltro = (clave: string, valor: string | boolean) => {
    const siguiente = new URLSearchParams(params);
    const vacio = valor === false || valor === '' || valor === 'todos' || valor === 'todas';
    if (vacio) siguiente.delete(clave);
    else siguiente.set(clave, String(valor));
    setParams(siguiente, { replace: true });
  };

  /**
   * Se busca solo, al dejar de teclear. Antes había que pulsar "Buscar", y con
   * el resto de filtros aplicándose al instante la incoherencia se notaba.
   * Solo se escribe en la URL si el término cambia de verdad: si no, cada
   * render dispararía una petición nueva.
   */
  useEffect(() => {
    const actual = params.get('q') ?? '';
    if (busqueda.trim() === actual) return;
    const t = setTimeout(() => cambiarFiltro('q', busqueda.trim()), ESPERA_BUSQUEDA);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, params]);

  const limpiar = () => {
    setBusqueda('');
    setParams(new URLSearchParams(), { replace: true });
  };

  /** Filtros puestos, en lenguaje humano: sirven para explicar un cero resultados. */
  const activos = useMemo(() => {
    const lista: { clave: string; texto: string }[] = [];
    if (filtros.q) lista.push({ clave: 'q', texto: `«${filtros.q}»` });
    if (filtros.ciudad !== 'todas') lista.push({ clave: 'ciudad', texto: filtros.ciudad! });
    if (filtros.nivel !== 'todos') {
      const nivel = niveles.find((n) => n.codigo === filtros.nivel);
      lista.push({ clave: 'nivel', texto: nivel?.nombre ?? filtros.nivel! });
    }
    if (filtros.cuando !== 'todos') {
      lista.push({
        clave: 'cuando',
        texto: CUANDO.find((c) => c.valor === filtros.cuando)?.texto ?? filtros.cuando!,
      });
    }
    if (filtros.gratis) lista.push({ clave: 'gratis', texto: 'Gratis' });
    if (filtros.conPlazas) lista.push({ clave: 'conPlazas', texto: 'Con plazas' });
    return lista;
  }, [filtros, niveles]);

  const quitar = (clave: string) => {
    if (clave === 'q') setBusqueda('');
    cambiarFiltro(clave, clave === 'gratis' || clave === 'conPlazas' ? false : '');
  };

  return (
    <div>
      {/* ----------------------------------------------------------------
        * Cabecera: una sola tarea, buscar.
        * ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-verde-900">
        <div className="patron-diagonal pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -top-40 -right-32 h-120 w-120 rounded-full border border-fluor/15"
          aria-hidden="true"
        />

        <motion.div
          initial="oculto"
          animate="visible"
          variants={contenedorStagger}
          className="contenedor relative pt-12 pb-10 lg:pt-16"
        >
          <motion.h1
            variants={entrarDesdeIzquierda}
            className="max-w-2xl text-[34px] leading-[1.02] font-black tracking-[-0.04em] text-balance text-white sm:text-[46px]"
          >
            Encuentra tu próxima salida
          </motion.h1>

          <motion.form
            variants={entrarDesdeIzquierda}
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              cambiarFiltro('q', busqueda.trim());
            }}
            className="mt-7 max-w-2xl"
          >
            <div className="relative">
              <IconoBuscar
                className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-texto-tenue"
                aria-hidden="true"
              />
              <input
                className="h-14 w-full rounded-full border border-transparent bg-white pr-14 pl-13 text-[16px] text-texto placeholder:text-texto-tenue focus:border-fluor focus:ring-4 focus:ring-fluor/25 focus:outline-none"
                placeholder="Salida, lugar o club…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar salidas"
                type="search"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  aria-label="Borrar búsqueda"
                  className="absolute top-1/2 right-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-texto-tenue transition-colors hover:bg-superficie hover:text-texto"
                >
                  <IconoCerrar className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.form>
        </motion.div>
      </section>

      {/* ----------------------------------------------------------------
        * Filtros: se quedan pegados bajo la barra mientras se hace scroll.
        * `top-16` es justo la altura del navbar.
        * ---------------------------------------------------------------- */}
      <div className="sticky top-16 z-30 border-b border-linea bg-base/95 backdrop-blur-md">
        <div className="contenedor flex flex-wrap items-center gap-2 py-3">
          {CUANDO.map((opcion) => {
            const activo = filtros.cuando === opcion.valor;
            return (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => cambiarFiltro('cuando', opcion.valor)}
                aria-pressed={activo}
                className={`chip relative ${activo ? 'chip-activo' : ''}`}
              >
                {activo && (
                  <motion.span
                    layoutId="chip-cuando"
                    transition={resorte}
                    className="absolute inset-0 -z-10 rounded-full bg-verde"
                  />
                )}
                {opcion.texto}
              </button>
            );
          })}

          <span className="mx-1 h-5 w-px bg-linea" aria-hidden="true" />

          <button
            type="button"
            onClick={() => cambiarFiltro('gratis', !filtros.gratis)}
            aria-pressed={filtros.gratis}
            className={`chip ${filtros.gratis ? 'chip-activo' : ''}`}
          >
            Gratis
          </button>
          <button
            type="button"
            onClick={() => cambiarFiltro('conPlazas', !filtros.conPlazas)}
            aria-pressed={filtros.conPlazas}
            className={`chip ${filtros.conPlazas ? 'chip-activo' : ''}`}
          >
            Con plazas
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              className="chip cursor-pointer pr-3"
              value={filtros.ciudad}
              onChange={(e) => cambiarFiltro('ciudad', e.target.value)}
              aria-label="Ciudad"
            >
              <option value="todas">Todas las ciudades</option>
              {ciudades.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {niveles.length > 0 && (
              <select
                className="chip cursor-pointer pr-3"
                value={filtros.nivel}
                onChange={(e) => cambiarFiltro('nivel', e.target.value)}
                aria-label="Nivel"
              >
                <option value="todos">Cualquier nivel</option>
                {niveles.map((n) => (
                  <option key={n.codigo} value={n.codigo}>
                    {n.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="contenedor pt-7 pb-4">
        {/* Recuento + filtros puestos. `role="status"` para que un lector de
            pantalla cante el resultado sin que haya que ir a buscarlo. */}
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p role="status" aria-live="polite" className="text-[14px] text-texto-suave">
            {cargando
              ? 'Buscando salidas…'
              : eventos.length === 1
                ? '1 salida'
                : `${eventos.length} salidas`}
          </p>

          {activos.map((f) => (
            <button
              key={f.clave}
              type="button"
              onClick={() => quitar(f.clave)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-verde-100 pr-2 pl-3 text-[13px] font-semibold text-verde transition-colors hover:bg-verde hover:text-white"
            >
              {f.texto}
              <IconoCerrar className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">Quitar este filtro</span>
            </button>
          ))}

          {activos.length > 1 && (
            <button
              type="button"
              onClick={limpiar}
              className="text-[13px] font-semibold text-texto-suave underline underline-offset-4 hover:text-texto"
            >
              Limpiar todo
            </button>
          )}
        </div>

        {cargando ? (
          <RejillaEsqueletos cantidad={6} />
        ) : eventos.length === 0 ? (
          <SinResultados activos={activos} onQuitar={quitar} onLimpiar={limpiar} />
        ) : (
          <motion.div
            key={params.toString()}
            initial="oculto"
            animate="visible"
            variants={contenedorStagger}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {eventos.map((evento) => (
              <TarjetaEvento key={evento.id} evento={evento} onUnirse={onUnirse} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * Cero resultados con salida.
 *
 * Un "no hay nada" a secas deja al visitante sin siguiente paso. Aquí se le
 * ofrece quitar cada filtro por su nombre, que casi siempre es lo que quería
 * hacer.
 */
function SinResultados({
  activos,
  onQuitar,
  onLimpiar,
}: {
  activos: { clave: string; texto: string }[];
  onQuitar: (clave: string) => void;
  onLimpiar: () => void;
}) {
  return (
    <motion.div
      variants={subirYAparecer}
      initial="oculto"
      animate="visible"
      className="tarjeta flex flex-col items-center px-6 py-16 text-center"
    >
      <svg viewBox="0 0 32 32" className="h-10 w-10 text-verde opacity-30" aria-hidden="true">
        <path d="M11.5 5 7 27h4.6l4.5-22zM23.5 5 19 27h4.6l4.5-22z" fill="currentColor" />
        <path d="M9 13.5h14l-.9 4.5H8.1z" fill="currentColor" />
      </svg>

      <p className="mt-4 text-[18px] font-extrabold tracking-tight text-texto">
        Ninguna salida encaja con esto
      </p>

      {activos.length > 0 ? (
        <>
          <p className="mt-1.5 max-w-sm text-[14px] text-texto-suave">
            Prueba a quitar uno de los filtros:
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {activos.map((f) => (
              <button
                key={f.clave}
                type="button"
                onClick={() => onQuitar(f.clave)}
                className="chip"
              >
                Quitar {f.texto}
              </button>
            ))}
          </div>
          {activos.length > 1 && (
            <button type="button" onClick={onLimpiar} className="btn btn-md btn-contorno mt-4">
              Ver todas las salidas
            </button>
          )}
        </>
      ) : (
        <p className="mt-1.5 max-w-sm text-[14px] text-texto-suave">
          Todavía no hay salidas publicadas. Vuelve en un rato o publica tú la primera.
        </p>
      )}
    </motion.div>
  );
}
