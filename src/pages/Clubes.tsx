import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { api, ErrorApi } from '../lib/api';
import type { Club } from '../lib/tipos';
import { TarjetaClub } from '../components/TarjetaClub';
import { EsqueletoClub, EstadoVacio } from '../components/Esqueletos';
import { IconoBuscar } from '../components/Iconos';
import { useAuth } from '../lib/auth';
import { useAviso } from '../components/Aviso';
import { alHacerScroll, contenedorStagger, subirYAparecer } from '../lib/animaciones';
import { useNavigate } from 'react-router-dom';

export function Clubes({ refresco }: { refresco: number }) {
  const { usuario } = useAuth();
  const aviso = useAviso();
  const navigate = useNavigate();

  const [clubes, setClubes] = useState<Club[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    api
      .clubes({ q: busqueda })
      .then((r) => vivo && setClubes(r.clubes))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [busqueda, refresco]);

  const alternarMembresia = async (club: Club) => {
    if (!usuario) {
      navigate(`/entrar?volver=/clubes`);
      return;
    }
    setEnviandoId(club.id);
    try {
      const { club: actualizado } = club.esMiembro
        ? await api.salirClub(club.id)
        : await api.unirseClub(club.id);
      setClubes((prev) => prev.map((c) => (c.id === actualizado.id ? actualizado : c)));
      aviso(actualizado.esMiembro ? `Te has unido a ${club.nombre}.` : `Has salido de ${club.nombre}.`);
    } catch (e) {
      aviso(e instanceof ErrorApi ? e.message : 'No pudimos completar la acción.', 'error');
    } finally {
      setEnviandoId(null);
    }
  };

  return (
    <div className="contenedor py-8">
      <motion.header initial="oculto" animate="visible" variants={contenedorStagger}>
        <motion.h1
          variants={subirYAparecer}
          className="text-[34px] leading-tight font-extrabold tracking-tight text-texto"
        >
          Clubes de running
        </motion.h1>
        <motion.p variants={subirYAparecer} className="mt-1.5 text-[15px] text-texto-suave">
          Encuentra tu comunidad y sal a correr acompañado cada semana.
        </motion.p>

        <motion.div variants={subirYAparecer} className="relative mt-6 max-w-md">
          <IconoBuscar className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-texto-tenue" />
          <input
            className="campo pl-10"
            placeholder="Buscar clubes por nombre o ciudad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar clubes"
          />
        </motion.div>
      </motion.header>

      <div className="mt-8">
        {cargando ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <EsqueletoClub key={i} />
            ))}
          </div>
        ) : clubes.length === 0 ? (
          <EstadoVacio
            titulo="No encontramos clubes"
            texto="Prueba con otro nombre o busca por ciudad."
          />
        ) : (
          <motion.div
            {...alHacerScroll}
            variants={contenedorStagger}
            className="grid gap-5 sm:grid-cols-2"
          >
            {clubes.map((club) => (
              <TarjetaClub
                key={club.id}
                club={club}
                onUnirse={alternarMembresia}
                ocupado={enviandoId === club.id}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
