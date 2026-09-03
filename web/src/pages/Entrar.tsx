import { useCallback, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { ErrorApi } from '../lib/api';
import { useAviso } from '../components/Aviso';
import { BotonGoogle } from '../components/BotonGoogle';
import { AccesoTelefono } from '../components/AccesoTelefono';
import { Logo } from '../components/Logo';
import { IconoCheck } from '../components/Iconos';
import { contenedorStagger, subirYAparecer, tapBoton } from '../lib/animaciones';

/**
 * Inicio de sesión — la pieza que faltaba en el entregable.
 * Dos vías: email + contraseña, y Google (Google Identity Services).
 */
export function Entrar() {
  const { entrarConEmail, registrarse, config } = useAuth();
  const aviso = useAviso();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const volverA = params.get('volver') || '/mis-eventos';

  const [modo, setModo] = useState<'entrar' | 'registro'>('entrar');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefonoRegistro, setTelefonoRegistro] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const alEntrar = useCallback(() => {
    aviso('¡Bienvenido a Haslap!');
    navigate(volverA, { replace: true });
  }, [aviso, navigate, volverA]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      if (modo === 'entrar') await entrarConEmail(email.trim(), password);
      else await registrarse(nombre.trim(), email.trim(), password, telefonoRegistro.trim());
      alEntrar();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No pudimos completar el acceso.');
    } finally {
      setEnviando(false);
    }
  };

  const rellenarDemo = () => {
    setModo('entrar');
    setEmail('tere@haslap.com');
    setPassword('haslap123');
    setError('');
  };

  return (
    <div className="contenedor grid gap-12 py-12 lg:grid-cols-2 lg:py-20">
      {/* ---------- Formulario ---------- */}
      <motion.div
        initial="oculto"
        animate="visible"
        variants={contenedorStagger}
        className="mx-auto w-full max-w-md"
      >
        <motion.div variants={subirYAparecer} className="lg:hidden">
          <Logo />
        </motion.div>

        <motion.h1
          variants={subirYAparecer}
          className="mt-6 text-[32px] leading-tight font-extrabold tracking-tight text-texto lg:mt-0"
        >
          {modo === 'entrar' ? 'Entra en Haslap' : 'Crea tu cuenta'}
        </motion.h1>
        <motion.p variants={subirYAparecer} className="mt-2 text-[15px] text-texto-suave">
          {modo === 'entrar'
            ? 'Accede para apuntarte a salidas y gestionar tus eventos.'
            : 'Regístrate para unirte a eventos y clubes de running.'}
        </motion.p>

        {/* Google, cuando esté disponible: es el camino con menos fricción */}
        {config?.google?.habilitado && (
          <motion.div variants={subirYAparecer} className="mt-8">
            <BotonGoogle onListo={alEntrar} onError={(m) => setError(m)} />
          </motion.div>
        )}

        {/* Teléfono: es la identidad que comparte con la app, así que va primero */}
        {modo === 'entrar' && (
          <motion.div variants={subirYAparecer} className="mt-8">
            <AccesoTelefono
              onListo={alEntrar}
              deshabilitado={!config?.telefono?.habilitado}
              motivo={config?.telefono?.motivo}
            />
          </motion.div>
        )}

        <motion.div variants={subirYAparecer} className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-linea" />
          <span className="text-[12px] text-texto-tenue">
            {modo === 'entrar' ? 'o con tu email' : 'con tus datos'}
          </span>
          <span className="h-px flex-1 bg-linea" />
        </motion.div>

        <motion.form variants={subirYAparecer} onSubmit={enviar} className="space-y-4">
          {/* Sin animación de altura: el campo es un input y no puede quedar
              recortado si la animación se interrumpe. */}
          <AnimatePresence initial={false}>
            {modo === 'registro' && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="etiqueta" htmlFor="nombre">Nombre</label>
                <input
                  id="nombre"
                  className="campo"
                  placeholder="Tu nombre"
                  autoComplete="name"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required={modo === 'registro'}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="etiqueta" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="campo"
              placeholder="tu@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {modo === 'registro' && (
            <div>
              <label className="etiqueta" htmlFor="telefonoRegistro">Teléfono</label>
              <input
                id="telefonoRegistro"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="campo"
                placeholder="+34 612 345 678"
                value={telefonoRegistro}
                onChange={(e) => setTelefonoRegistro(e.target.value)}
                required
              />
              <p className="mt-1.5 text-[12px] text-texto-tenue">
                Con este número entrarás también en la app, con la misma cuenta.
              </p>
            </div>
          )}

          <div>
            <label className="etiqueta" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="campo"
              placeholder={modo === 'registro' ? 'Mínimo 8 caracteres' : '••••••••'}
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={modo === 'registro' ? 8 : undefined}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-ds-md bg-red-50 px-3 py-2 text-[13px] text-red-600"
              role="alert"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            {...tapBoton}
            type="submit"
            disabled={enviando}
            className="btn btn-lg btn-acento w-full"
          >
            {enviando
              ? 'Un momento...'
              : modo === 'entrar'
                ? 'Iniciar sesión'
                : 'Crear cuenta'}
          </motion.button>
        </motion.form>

        <motion.p variants={subirYAparecer} className="mt-5 text-center text-[14px] text-texto-suave">
          {modo === 'entrar' ? '¿Aún no tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setModo(modo === 'entrar' ? 'registro' : 'entrar');
              setError('');
            }}
            className="font-semibold text-verde hover:underline"
          >
            {modo === 'entrar' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </motion.p>

        {/* Atajo para probar sin crear cuenta. Solo aplica al seed en memoria:
            contra el backend real haría falta una cuenta de verdad. */}
        <motion.div
          variants={subirYAparecer}
          hidden={config?.origen === 'haslapapp'}
          className="mt-6 rounded-ds-md border border-dashed border-linea bg-white p-3.5"
        >
          <p className="text-[12px] text-texto-suave">
            <strong className="text-texto">Cuenta de prueba:</strong> tere@haslap.com / haslap123
          </p>
          <button
            type="button"
            onClick={rellenarDemo}
            className="btn btn-sm btn-fantasma mt-1.5 -ml-4"
          >
            Rellenar automáticamente
          </button>
        </motion.div>
      </motion.div>

      {/* ---------- Panel lateral ---------- */}
      <motion.aside
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hidden rounded-ds-2xl bg-verde p-10 text-white lg:flex lg:flex-col lg:justify-between"
      >
        <div>
          <Logo />
          <h2 className="mt-10 text-[30px] leading-tight font-extrabold tracking-tight">
            Plataforma para <span className="text-fluor">runners como tú.</span>
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/65">
            Descubre salidas, únete a clubes y crea eventos de running en tu ciudad.
          </p>

          <ul className="mt-9 space-y-3.5">
            {[
              'Inscríbete a cualquier salida en dos clics',
              'Filtra por ciudad, nivel, fecha y plazas',
              'Crea y publica tus propios eventos',
              'Gestiona tus clubes desde cualquier navegador',
            ].map((punto) => (
              <li key={punto} className="flex items-start gap-3 text-[14px] text-white/85">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-fluor text-texto">
                  <IconoCheck className="h-3.5 w-3.5" />
                </span>
                {punto}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 rounded-ds-lg bg-white/5 p-5">
          <p className="text-[13px] leading-relaxed text-white/70">
            Las funciones sociales — chat, asistentes, feed y estadísticas — son exclusivas de la
            app de Haslap.
          </p>
          <Link to="/premium" className="mt-3 inline-block text-[13px] font-semibold text-fluor">
            Ver planes premium →
          </Link>
        </div>
      </motion.aside>
    </div>
  );
}
