import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { ErrorApi } from '../lib/api';
import { IconoFlecha, IconoFlechaIzquierda, IconoMovil } from './Iconos';
import { tapBoton } from '../lib/animaciones';

/**
 * Acceso por teléfono en dos pasos: número → código SMS.
 *
 * Es la vía principal a propósito. La app identifica a la gente por su número,
 * así que entrar aquí con el teléfono lleva a la misma cuenta que en la app.
 * Con email+contraseña como única opción acabaríamos con cuentas duplicadas:
 * alguien se registra en la web, luego entra en la app con su móvil y aparece
 * como usuario nuevo.
 *
 * El SMS lo pide el navegador a Firebase; este componente solo orquesta los dos
 * pasos y manda al servidor el token que Firebase devuelve.
 */
export function AccesoTelefono({
  onListo,
  deshabilitado,
  motivo,
}: {
  onListo: () => void;
  deshabilitado?: boolean;
  motivo?: string | null;
}) {
  const { entrarConTelefono, pedirCodigoSms } = useAuth();

  const [paso, setPaso] = useState<'numero' | 'codigo'>('numero');
  const [telefono, setTelefono] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (deshabilitado) {
    return (
      <div className="rounded-ds-md border border-dashed border-linea bg-superficie p-4">
        <p className="inline-flex items-center gap-2 text-[14px] font-semibold text-texto">
          <IconoMovil className="h-4 w-4 text-verde" />
          Acceso con tu teléfono
        </p>
        <p className="mt-1.5 text-[13px] text-texto-suave">
          {motivo || 'Todavía no está disponible en la web.'}
        </p>
      </div>
    );
  }

  const normalizar = (n: string) => n.replace(/[^\d+]/g, '');

  const pedirCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numero = normalizar(telefono);
    // El backend guarda los números en E.164 (+34...), así que se exige aquí.
    if (!/^\+\d{9,15}$/.test(numero)) {
      setError('Escribe el número con su prefijo, por ejemplo +34612345678.');
      return;
    }
    setEnviando(true);
    try {
      await pedirCodigoSms(numero);
      setPaso('codigo');
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No pudimos enviarte el SMS.');
    } finally {
      setEnviando(false);
    }
  };

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (codigo.trim().length < 4) {
      setError('Introduce el código que te hemos enviado.');
      return;
    }
    setEnviando(true);
    try {
      await entrarConTelefono(normalizar(telefono), codigo.trim());
      onListo();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'El código no es correcto.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={paso === 'numero' ? pedirCodigo : confirmar} className="space-y-3">
      {paso === 'numero' ? (
        <>
          <label className="etiqueta" htmlFor="telefono">
            Tu teléfono
          </label>
          <div className="flex gap-2">
            <input
              id="telefono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="campo flex-1"
              placeholder="+34 612 345 678"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
            <motion.button
              {...tapBoton}
              type="submit"
              disabled={enviando}
              className="btn btn-md btn-acento shrink-0"
            >
              {enviando ? 'Enviando...' : 'Enviar código'}
              {!enviando && <IconoFlecha className="h-4 w-4" />}
            </motion.button>
          </div>
          <p className="text-[12px] text-texto-tenue">
            Es el mismo número con el que entras en la app, así usas la misma cuenta.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <label className="etiqueta mb-0" htmlFor="codigo">
              Código enviado a {normalizar(telefono)}
            </label>
            <button
              type="button"
              onClick={() => {
                setPaso('numero');
                setCodigo('');
                setError('');
              }}
              className="btn btn-sm btn-fantasma"
            >
              <IconoFlechaIzquierda className="h-3.5 w-3.5" />
              Cambiar
            </button>
          </div>
          <div className="flex gap-2">
            <input
              id="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="campo flex-1 tracking-[0.4em]"
              placeholder="······"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
            />
            <motion.button
              {...tapBoton}
              type="submit"
              disabled={enviando}
              className="btn btn-md btn-acento shrink-0"
            >
              {enviando ? 'Comprobando...' : 'Entrar'}
            </motion.button>
          </div>
        </>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="rounded-ds-md bg-red-50 px-3 py-2 text-[13px] text-red-600"
        >
          {error}
        </motion.p>
      )}
    </form>
  );
}
