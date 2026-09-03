import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { api, ErrorApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAviso } from './Aviso';
import { proximoSabado } from '../lib/formato';
import { IconoCheck, IconoFlecha } from './Iconos';
import { tapBoton } from '../lib/animaciones';

const PASOS = ['Info', 'Detalles', 'Publicar'] as const;

const formularioVacio = {
  titulo: '',
  descripcion: '',
  fecha: proximoSabado(),
  ciudad: 'Madrid',
  lugar: '',
  nivel: 'Todos los niveles',
  distanciaKm: 10,
  plazas: 30,
  precio: 0,
};

/** Wizard de 3 pasos del mockup "Modal: Crear evento". */
export function ModalCrearEvento({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const { usuario } = useAuth();
  const aviso = useAviso();
  const navigate = useNavigate();

  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState(formularioVacio);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cerrar = () => {
    onCerrar();
    // Se resetea después de la animación de salida.
    setTimeout(() => {
      setPaso(0);
      setDatos(formularioVacio);
      setError('');
    }, 250);
  };

  const cambiar = (campo: keyof typeof formularioVacio, valor: string | number) =>
    setDatos((prev) => ({ ...prev, [campo]: valor }));

  const siguiente = () => {
    setError('');
    if (paso === 0) {
      if (datos.titulo.trim().length < 4) return setError('El título necesita al menos 4 caracteres.');
      if (!datos.fecha) return setError('Selecciona la fecha y la hora.');
    }
    if (paso === 1 && !datos.lugar.trim()) {
      return setError('Indica el punto de encuentro.');
    }
    setPaso((p) => Math.min(p + 1, PASOS.length - 1));
  };

  const publicar = async () => {
    setError('');
    setEnviando(true);
    try {
      const { evento } = await api.crearEvento(datos);
      aviso('¡Evento publicado! Ya aparece en Descubrir.');
      cerrar();
      navigate(`/eventos/${evento.slug}`);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No pudimos crear el evento.');
    } finally {
      setEnviando(false);
    }
  };

  // Sin sesión no se puede crear: mandamos a iniciar sesión.
  if (abierto && !usuario) {
    return (
      <Modal abierto={abierto} onCerrar={cerrar} titulo="Inicia sesión para crear un evento">
        <p className="text-[14px] text-texto-suave">
          Necesitas una cuenta de Haslap para publicar salidas y gestionar a los asistentes.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              cerrar();
              navigate('/entrar');
            }}
            className="btn btn-md btn-acento flex-1"
          >
            Iniciar sesión
          </button>
          <button type="button" onClick={cerrar} className="btn btn-md btn-contorno">
            Ahora no
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Crear evento"
      ancho="max-w-xl"
      subtitulo={
        <div className="mt-3 flex items-center gap-2">
          {PASOS.map((nombre, i) => (
            <div key={nombre} className="flex flex-1 items-center gap-2">
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors ${
                  i < paso
                    ? 'bg-verde text-white'
                    : i === paso
                      ? 'bg-fluor text-texto'
                      : 'bg-linea-suave text-texto-tenue'
                }`}
              >
                {i < paso ? <IconoCheck className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={`text-[12px] font-medium ${i === paso ? 'text-texto' : 'text-texto-tenue'}`}
              >
                {nombre}
              </span>
              {i < PASOS.length - 1 && (
                <span className="relative h-px flex-1 bg-linea">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-verde"
                    initial={false}
                    animate={{ width: i < paso ? '100%' : '0%' }}
                    transition={{ duration: 0.35 }}
                  />
                </span>
              )}
            </div>
          ))}
        </div>
      }
    >
      {/* Solo animación de entrada, con key={paso} para que se repita en cada paso.
          Con AnimatePresence mode="wait" el paso siguiente no se monta hasta que
          termina la salida del anterior, y si esa animación se corta el usuario se
          queda con el formulario en blanco. */}
      <div>
        <motion.div
          key={paso}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
          className="space-y-4"
        >
          {paso === 0 && (
            <>
              <div>
                <label className="etiqueta" htmlFor="titulo">Título del evento</label>
                <input
                  id="titulo"
                  className="campo"
                  placeholder="Ej: Rodaje suave por el parque"
                  value={datos.titulo}
                  onChange={(e) => cambiar('titulo', e.target.value)}
                />
              </div>
              <div>
                <label className="etiqueta" htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  className="campo h-28 resize-none py-3"
                  placeholder="Cuéntanos sobre tu salida..."
                  maxLength={500}
                  value={datos.descripcion}
                  onChange={(e) => cambiar('descripcion', e.target.value)}
                />
                <p className="mt-1 text-right text-[11px] text-texto-tenue">
                  {datos.descripcion.length}/500
                </p>
              </div>
              <div>
                <label className="etiqueta" htmlFor="fecha">Fecha y hora</label>
                <input
                  id="fecha"
                  type="datetime-local"
                  className="campo"
                  value={datos.fecha}
                  onChange={(e) => cambiar('fecha', e.target.value)}
                />
              </div>
            </>
          )}

          {paso === 1 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="etiqueta" htmlFor="ciudad">Ciudad</label>
                  <select
                    id="ciudad"
                    className="campo"
                    value={datos.ciudad}
                    onChange={(e) => cambiar('ciudad', e.target.value)}
                  >
                    <option>Madrid</option>
                    <option>Barcelona</option>
                    <option>Valencia</option>
                    <option>Sevilla</option>
                  </select>
                </div>
                <div>
                  <label className="etiqueta" htmlFor="nivel">Nivel</label>
                  <select
                    id="nivel"
                    className="campo"
                    value={datos.nivel}
                    onChange={(e) => cambiar('nivel', e.target.value)}
                  >
                    <option>Todos los niveles</option>
                    <option>Principiante</option>
                    <option>Intermedio</option>
                    <option>Avanzado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="etiqueta" htmlFor="lugar">Punto de encuentro</label>
                <input
                  id="lugar"
                  className="campo"
                  placeholder="Ej: Entrada principal del Retiro"
                  value={datos.lugar}
                  onChange={(e) => cambiar('lugar', e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="etiqueta" htmlFor="distancia">Distancia (km)</label>
                  <input
                    id="distancia"
                    type="number"
                    min={1}
                    className="campo"
                    value={datos.distanciaKm}
                    onChange={(e) => cambiar('distanciaKm', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="etiqueta" htmlFor="plazas">Plazas</label>
                  <input
                    id="plazas"
                    type="number"
                    min={1}
                    className="campo"
                    value={datos.plazas}
                    onChange={(e) => cambiar('plazas', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="etiqueta" htmlFor="precio">Precio (€)</label>
                  <input
                    id="precio"
                    type="number"
                    min={0}
                    className="campo"
                    value={datos.precio}
                    onChange={(e) => cambiar('precio', Number(e.target.value))}
                  />
                </div>
              </div>
            </>
          )}

          {paso === 2 && (
            <div className="rounded-ds-lg border border-linea bg-superficie p-5">
              <p className="text-[11px] font-semibold tracking-wide text-verde uppercase">
                Resumen
              </p>
              <h3 className="mt-1 text-[18px] font-extrabold text-texto">{datos.titulo}</h3>
              <dl className="mt-4 grid gap-x-6 gap-y-2.5 text-[13px] sm:grid-cols-2">
                {[
                  ['Cuándo', new Date(datos.fecha).toLocaleString('es-ES')],
                  ['Dónde', `${datos.lugar}, ${datos.ciudad}`],
                  ['Nivel', datos.nivel],
                  ['Distancia', `${datos.distanciaKm} km`],
                  ['Plazas', String(datos.plazas)],
                  ['Precio', datos.precio === 0 ? 'Gratis' : `${datos.precio} €`],
                ].map(([clave, valor]) => (
                  <div key={clave} className="flex justify-between gap-3 sm:block">
                    <dt className="text-texto-tenue">{clave}</dt>
                    <dd className="font-semibold text-texto sm:mt-0.5">{valor}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-linea pt-3 text-[12px] text-texto-suave">
                Las estadísticas del evento y el chat con los asistentes se gestionan desde la app.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-ds-md bg-red-50 px-3 py-2 text-[13px] text-red-600"
        >
          {error}
        </motion.p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => (paso === 0 ? cerrar() : setPaso((p) => p - 1))}
          className="btn btn-md btn-fantasma"
        >
          {paso === 0 ? 'Cancelar' : 'Atrás'}
        </button>

        {paso < PASOS.length - 1 ? (
          <motion.button {...tapBoton} type="button" onClick={siguiente} className="btn btn-md btn-identidad">
            Siguiente
            <IconoFlecha className="h-4 w-4" />
          </motion.button>
        ) : (
          <motion.button
            {...tapBoton}
            type="button"
            onClick={publicar}
            disabled={enviando}
            className="btn btn-md btn-acento"
          >
            {enviando ? 'Publicando...' : 'Publicar evento'}
          </motion.button>
        )}
      </div>
    </Modal>
  );
}
