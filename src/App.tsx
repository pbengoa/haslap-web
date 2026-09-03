import { useCallback, useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';

import { BarraProgresoScroll } from './components/Movimiento';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ModalUnirse } from './components/ModalUnirse';
import { ModalCrearEvento } from './components/ModalCrearEvento';
import { transicionPagina } from './lib/animaciones';
import type { Evento } from './lib/tipos';

import { Home } from './pages/Home';
import { Eventos } from './pages/Eventos';
import { DetalleEvento } from './pages/DetalleEvento';
import { Clubes } from './pages/Clubes';
import { DetalleClub } from './pages/DetalleClub';
import { MisEventos } from './pages/MisEventos';
import { Entrar } from './pages/Entrar';
import { Premium } from './pages/Premium';

/** Al cambiar de ruta volvemos arriba del todo. */
function ScrollArriba() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

/**
 * Animación de entrada de cada página.
 *
 * A propósito no usamos <AnimatePresence mode="wait">: obligaría a esperar a que
 * termine la animación de salida antes de montar la página siguiente, y si esa
 * animación se queda a medias (pestaña en segundo plano, rAF throttled) el usuario
 * se queda con la pantalla en blanco. Animando solo la entrada no hay nada que
 * pueda bloquear el render.
 */
function Pagina({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial="oculto"
      animate="visible"
      variants={transicionPagina}
      className="min-h-[60vh]"
    >
      {children}
    </motion.main>
  );
}

function NoEncontrado() {
  return (
    <div className="contenedor py-24 text-center">
      <p className="text-[13px] font-semibold tracking-wide text-verde uppercase">Error 404</p>
      <h1 className="mt-3 text-[32px] font-extrabold tracking-tight text-texto">
        Esta página no existe
      </h1>
      <p className="mt-2 text-[15px] text-texto-suave">
        Puede que el enlace esté mal o que el contenido ya no esté disponible.
      </p>
      <Link to="/" className="btn btn-lg btn-acento mt-7">
        Volver al inicio
      </Link>
    </div>
  );
}

export default function App() {
  const location = useLocation();

  // Estado compartido de los dos modales globales.
  const [eventoAUnirse, setEventoAUnirse] = useState<Evento | null>(null);
  const [crearAbierto, setCrearAbierto] = useState(false);

  /**
   * Al inscribirse (o crear un evento) subimos este contador para que las páginas
   * vuelvan a pedir sus datos y los contadores queden al día.
   */
  const [refresco, setRefresco] = useState(0);
  const refrescar = useCallback(() => setRefresco((n) => n + 1), []);

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollArriba />
      <BarraProgresoScroll />
      <Navbar onCrearEvento={() => setCrearAbierto(true)} />

      <div className="flex-1">
        <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <Pagina>
                  <Home
                    onUnirse={setEventoAUnirse}
                    onCrearEvento={() => setCrearAbierto(true)}
                    refresco={refresco}
                  />
                </Pagina>
              }
            />
            <Route
              path="/eventos"
              element={
                <Pagina>
                  <Eventos onUnirse={setEventoAUnirse} refresco={refresco} />
                </Pagina>
              }
            />
            <Route
              path="/eventos/:id"
              element={
                <Pagina>
                  <DetalleEvento onUnirse={setEventoAUnirse} refresco={refresco} />
                </Pagina>
              }
            />
            <Route
              path="/clubes"
              element={
                <Pagina>
                  <Clubes refresco={refresco} />
                </Pagina>
              }
            />
            <Route
              path="/clubes/:id"
              element={
                <Pagina>
                  <DetalleClub onUnirse={setEventoAUnirse} refresco={refresco} />
                </Pagina>
              }
            />
            <Route
              path="/mis-eventos"
              element={
                <Pagina>
                  <MisEventos onUnirse={setEventoAUnirse} refresco={refresco} />
                </Pagina>
              }
            />
            <Route
              path="/entrar"
              element={
                <Pagina>
                  <Entrar />
                </Pagina>
              }
            />
            <Route
              path="/premium"
              element={
                <Pagina>
                  <Premium />
                </Pagina>
              }
            />
            <Route
              path="*"
              element={
                <Pagina>
                  <NoEncontrado />
                </Pagina>
              }
            />
        </Routes>
      </div>

      <Footer />

      <ModalUnirse
        evento={eventoAUnirse}
        onCerrar={() => setEventoAUnirse(null)}
        onInscrito={refrescar}
      />
      <ModalCrearEvento
        abierto={crearAbierto}
        onCerrar={() => {
          setCrearAbierto(false);
          refrescar();
        }}
      />
    </div>
  );
}
