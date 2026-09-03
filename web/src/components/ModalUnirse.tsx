import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { api, ErrorApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAviso } from './Aviso';
import type { Evento } from '../lib/tipos';
import { fechaLarga, hora, precio } from '../lib/formato';
import { IconoCalendario, IconoPersonas, IconoUbicacion } from './Iconos';
import { tapBoton } from '../lib/animaciones';

/** Modal "Unirse al evento" del design system. */
export function ModalUnirse({
  evento,
  onCerrar,
  onInscrito,
}: {
  evento: Evento | null;
  onCerrar: () => void;
  onInscrito: (evento: Evento) => void;
}) {
  const { usuario } = useAuth();
  const aviso = useAviso();
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const confirmar = async () => {
    if (!evento) return;
    setError('');
    setEnviando(true);
    try {
      const { evento: actualizado } = await api.unirseEvento(evento.id);
      onInscrito(actualizado);
      aviso(`¡Estás dentro! Te esperamos en ${actualizado.lugar}.`);
      onCerrar();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No pudimos completar la inscripción.');
    } finally {
      setEnviando(false);
    }
  };

  if (!evento) return null;

  // Sin sesión: primero hay que entrar (con email o con Google).
  if (!usuario) {
    return (
      <Modal abierto onCerrar={onCerrar} titulo="Inicia sesión para unirte">
        <p className="text-[14px] text-texto-suave">
          Crea tu cuenta o entra con Google para apuntarte a <strong>{evento.titulo}</strong>.
        </p>
        <div className="mt-6 flex gap-3">
          <motion.button
            {...tapBoton}
            type="button"
            onClick={() => navigate(`/entrar?volver=/eventos/${evento.slug}`)}
            className="btn btn-md btn-acento flex-1"
          >
            Iniciar sesión
          </motion.button>
          <button type="button" onClick={onCerrar} className="btn btn-md btn-contorno">
            Ahora no
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Unirse al evento">
      <div className="rounded-ds-lg border border-linea p-4">
        <h3 className="text-[16px] font-bold text-texto">{evento.titulo}</h3>
        <ul className="mt-3 space-y-2 text-[13px] text-texto-suave">
          <li className="flex items-center gap-2">
            <IconoCalendario className="h-4 w-4 text-verde" />
            {fechaLarga(evento.fecha)} · {hora(evento.fecha)}
          </li>
          <li className="flex items-center gap-2">
            <IconoUbicacion className="h-4 w-4 text-verde" />
            {evento.lugar}, {evento.ciudad}
          </li>
          <li className="flex items-center gap-2">
            <IconoPersonas className="h-4 w-4 text-verde" />
            {evento.plazas === null
              ? `${evento.asistentes} personas apuntadas`
              : `${evento.plazasDisponibles} plazas disponibles de ${evento.plazas}`}
          </li>
        </ul>
        <p className="mt-3 border-t border-linea-suave pt-3 text-[13px] font-semibold text-texto">
          {precio(evento.precio)}
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-ds-md bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</p>
      )}

      <motion.button
        {...tapBoton}
        type="button"
        onClick={confirmar}
        disabled={enviando}
        className="btn btn-lg btn-acento mt-5 w-full"
      >
        {enviando ? 'Apuntándote...' : 'Unirme al evento'}
      </motion.button>
      <p className="mt-3 text-center text-[12px] text-texto-tenue">
        Al unirte aceptas las normas de la comunidad.
      </p>
    </Modal>
  );
}
