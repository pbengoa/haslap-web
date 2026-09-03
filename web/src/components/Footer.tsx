import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { IconoDescarga } from './Iconos';
import { alHacerScroll, subirYAparecer, tapBoton } from '../lib/animaciones';

export function Footer() {
  const abrirTienda = () =>
    alert('En producción esto abriría la ficha de Haslap en App Store / Google Play.');

  return (
    <footer className="mt-20 border-t border-linea bg-white">
      <div className="contenedor py-12">
        <motion.div
          {...alHacerScroll}
          variants={subirYAparecer}
          className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between"
        >
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-[14px] leading-relaxed text-texto-suave">
              Descubre salidas, únete a clubes y crea eventos de running en tu ciudad.
            </p>
            <p className="mt-4 text-[15px] font-bold text-verde">
              Run together. <span className="text-fluor-600">Go further.</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="mb-3 text-[13px] font-bold text-texto">Explorar</p>
              <ul className="space-y-2 text-[13px] text-texto-suave">
                <li><Link to="/eventos" className="hover:text-verde">Eventos</Link></li>
                <li><Link to="/clubes" className="hover:text-verde">Clubes</Link></li>
                <li><Link to="/mis-eventos" className="hover:text-verde">Mis eventos</Link></li>
                <li><Link to="/premium" className="hover:text-verde">Premium</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-[13px] font-bold text-texto">En la app</p>
              <ul className="space-y-2 text-[13px] text-texto-tenue">
                <li>Chat y mensajes</li>
                <li>Ver asistentes</li>
                <li>Feed y grupos</li>
                <li>Estadísticas</li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="mb-3 text-[13px] font-bold text-texto">Descarga la app</p>
              <p className="mb-3 text-[13px] text-texto-suave">
                Las funciones sociales son exclusivas de la aplicación.
              </p>
              <motion.button
                {...tapBoton}
                type="button"
                onClick={abrirTienda}
                className="btn btn-sm btn-identidad"
              >
                <IconoDescarga className="h-4 w-4" />
                Descargar
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="mt-10 border-t border-linea-suave pt-6 text-[12px] text-texto-tenue">
          © {new Date().getFullYear()} Haslap · MVP web con datos de prueba.
        </div>
      </div>
    </footer>
  );
}
