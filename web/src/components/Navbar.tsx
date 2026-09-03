import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { resorte, tapBoton } from '../lib/animaciones';
import { Logo } from './Logo';
import {
  IconoCampana,
  IconoCerrar,
  IconoChevron,
  IconoMas,
  IconoMenu,
  IconoUbicacion,
} from './Iconos';

const enlaces = [
  { a: '/', texto: 'Descubrir' },
  { a: '/eventos', texto: 'Eventos' },
  { a: '/clubes', texto: 'Clubes' },
  { a: '/mis-eventos', texto: 'Mis eventos' },
];

function Avatar({ nombre, avatar, className = 'h-8 w-8' }: { nombre: string; avatar: string | null; className?: string }) {
  if (avatar) {
    return <img src={avatar} alt="" className={`${className} rounded-full object-cover`} />;
  }
  return (
    <span
      className={`${className} grid place-items-center rounded-full bg-verde text-[12px] font-bold text-white`}
      aria-hidden="true"
    >
      {nombre.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function Navbar({ onCrearEvento }: { onCrearEvento: () => void }) {
  const { usuario, salir } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [conScroll, setConScroll] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const alScroll = () => setConScroll(window.scrollY > 8);
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);

  // Al cambiar de página cerramos los menús abiertos.
  useEffect(() => {
    setMenuAbierto(false);
    setPerfilAbierto(false);
  }, [location.pathname]);

  /**
   * En la home el hero es un bloque verde oscuro a sangre, así que la barra se
   * viste de oscuro para formar parte de él. En cuanto se hace scroll —o se
   * abre el menú móvil, que es blanco— vuelve a la barra blanca de siempre.
   */
  const sobreOscuro = location.pathname === '/' && !conScroll && !menuAbierto;

  return (
    <motion.header
      initial={{ y: -72 }}
      animate={{ y: 0 }}
      transition={{ ...resorte, delay: 0.05 }}
      className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors ${
        sobreOscuro
          ? 'border-white/10 bg-verde-900'
          : conScroll
            ? 'border-linea bg-white/90 shadow-[0_4px_20px_-16px_rgba(30,42,39,0.35)]'
            : 'border-transparent bg-white/90'
      }`}
    >
      <nav className="contenedor flex h-16 items-center gap-3" aria-label="Principal">
        <Logo className="h-6" invertido={sobreOscuro} />

        <ul className="ml-6 hidden items-center gap-1 lg:flex">
          {enlaces.map((enlace) => (
            <li key={enlace.a}>
              <NavLink
                to={enlace.a}
                end={enlace.a === '/'}
                className={({ isActive }) =>
                  `relative inline-flex h-9 items-center rounded-full px-3.5 text-[14px] font-medium transition-colors ${
                    sobreOscuro
                      ? isActive
                        ? 'bg-white/10 font-semibold text-white'
                        : 'text-white/68 hover:text-white'
                      : isActive
                        ? 'text-verde'
                        : 'text-texto-suave hover:text-texto'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {enlace.texto}
                    {isActive && !sobreOscuro && (
                      // layoutId hace que el punto se deslice entre secciones.
                      <motion.span
                        layoutId="indicador-nav"
                        transition={resorte}
                        className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-verde"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] xl:inline-flex ${
              sobreOscuro ? 'border-white/20 text-white/72' : 'border-linea text-texto-suave'
            }`}
          >
            <IconoUbicacion className={`h-3.5 w-3.5 ${sobreOscuro ? 'text-fluor' : 'text-verde'}`} />
            Madrid
          </span>

          <motion.button
            {...tapBoton}
            type="button"
            onClick={onCrearEvento}
            className="btn btn-sm btn-identidad hidden sm:inline-flex"
          >
            <IconoMas className="h-4 w-4" />
            Crear evento
          </motion.button>

          {usuario ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setPerfilAbierto((v) => !v)}
                aria-expanded={perfilAbierto}
                aria-haspopup="menu"
                className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 hover:bg-linea-suave"
              >
                <Avatar nombre={usuario.nombre} avatar={usuario.avatar} />
                <span
                  className={`hidden text-[14px] font-medium sm:inline ${
                    sobreOscuro ? 'text-white' : 'text-texto'
                  }`}
                >
                  {usuario.nombre.split(' ')[0]}
                </span>
                <IconoChevron
                  className={`h-3.5 w-3.5 ${sobreOscuro ? 'text-white/60' : 'text-texto-tenue'}`}
                />
              </button>

              <AnimatePresence>
                {perfilAbierto && (
                  <>
                    <button
                      type="button"
                      aria-label="Cerrar menú"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setPerfilAbierto(false)}
                    />
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-ds-lg border border-linea bg-white shadow-modal"
                    >
                      <div className="border-b border-linea-suave p-4">
                        <p className="truncate text-[14px] font-bold text-texto">{usuario.nombre}</p>
                        <p className="truncate text-[12px] text-texto-suave">{usuario.email}</p>
                        <p className="mt-1.5 text-[11px] text-texto-tenue">
                          Sesión con {usuario.proveedor === 'google' ? 'Google' : 'email'}
                        </p>
                      </div>
                      <Link
                        to="/mis-eventos"
                        role="menuitem"
                        className="block px-4 py-2.5 text-[14px] text-texto-suave hover:bg-superficie hover:text-texto"
                      >
                        Mis eventos
                      </Link>
                      <Link
                        to="/premium"
                        role="menuitem"
                        className="block px-4 py-2.5 text-[14px] text-texto-suave hover:bg-superficie hover:text-texto"
                      >
                        Premium
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          salir();
                          navigate('/');
                        }}
                        className="block w-full px-4 py-2.5 text-left text-[14px] text-texto-suave hover:bg-superficie hover:text-texto"
                      >
                        Cerrar sesión
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <button
                type="button"
                className={`hidden h-9 w-9 place-items-center rounded-full sm:grid ${
                  sobreOscuro
                    ? 'text-white/60 hover:bg-white/10 hover:text-white'
                    : 'text-texto-tenue hover:bg-linea-suave hover:text-texto'
                }`}
                aria-label="Notificaciones (disponibles en la app)"
                onClick={() => alert('Las notificaciones están disponibles en la app de Haslap.')}
              >
                <IconoCampana className="h-[18px] w-[18px]" />
              </button>
              <Link
                to="/entrar"
                className={`btn btn-sm ${sobreOscuro ? 'btn-contorno-claro' : 'btn-contorno'}`}
              >
                Iniciar sesión
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-expanded={menuAbierto}
            aria-label="Abrir menú"
            className={`grid h-9 w-9 place-items-center rounded-full lg:hidden ${
              sobreOscuro ? 'text-white hover:bg-white/10' : 'text-texto hover:bg-linea-suave'
            }`}
          >
            {menuAbierto ? <IconoCerrar className="h-5 w-5" /> : <IconoMenu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Menú móvil */}
      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-linea bg-white lg:hidden"
          >
            <ul className="contenedor flex flex-col py-3">
              {enlaces.map((enlace) => (
                <li key={enlace.a}>
                  <NavLink
                    to={enlace.a}
                    end={enlace.a === '/'}
                    className={({ isActive }) =>
                      `block rounded-ds-md px-3 py-3 text-[15px] font-medium ${
                        isActive ? 'bg-verde-50 text-verde' : 'text-texto-suave'
                      }`
                    }
                  >
                    {enlace.texto}
                  </NavLink>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={onCrearEvento}
                  className="btn btn-md btn-identidad mt-2 w-full"
                >
                  <IconoMas className="h-4 w-4" />
                  Crear evento
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
