
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSesion } from '../context/SesionContext';
import { fmtFechaHora, fmtHora, mensajeError } from '../lib/horario';

export default function MisReservas() {
  const { usuario } = useSesion();
  const location = useLocation();

  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState('proximas');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState(location.state?.mensaje || '');
  const [ocupado, setOcupado] = useState(null);
  const [ahora, setAhora] = useState(() => Date.now());

  const cargar = async () => {
    const { data, error } = await supabase
      .from('reservas')
      .select('id,inicio,fin,personas,estado,salas(nombre)')
      .eq('usuario_id', usuario.id)
      .order('inicio', { ascending: false });

    if (error) {
      setError(mensajeError(error));
    } else {
      setReservas(data || []);
      setError('');
    }
  };

  useEffect(() => {
    cargar();
  }, [usuario.id]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setAhora(Date.now());
    }, 60000);

    return () => clearInterval(intervalo);
  }, []);

  const cancelar = async (id) => {
    if (!window.confirm('¿Querés cancelar esta reserva?')) return;

    setOcupado(id);
    setError('');
    setMensaje('');

    const { error } = await supabase.rpc('cancelar_reserva', {
      p_id: id
    });

    if (error) {
      setError(mensajeError(error));
    } else {
      setMensaje('La reserva fue cancelada correctamente.');
      await cargar();
      setFiltro('canceladas');
    }

    setOcupado(null);
  };

  const proximas = reservas.filter(
    r => r.estado === 'confirmada' &&
         new Date(r.fin).getTime() > ahora
  );

  const pasadas = reservas.filter(
    r => r.estado === 'confirmada' &&
         new Date(r.fin).getTime() <= ahora
  );

  const canceladas = reservas.filter(
    r => r.estado === 'cancelada'
  );

  const grupos = {
    proximas,
    pasadas,
    canceladas
  };

  const reservasFiltradas = grupos[filtro];

  return (
    <>
      <h1>Mis reservas</h1>
      <p className="muted">
        Consultá tus próximas reservas y revisá tu historial.
      </p>

      {mensaje && <p className="exito">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      <div className="filtros-reservas">
        <button
          className={filtro === 'proximas' ? 'filtro-activo' : ''}
          onClick={() => setFiltro('proximas')}
        >
          Próximas ({proximas.length})
        </button>

        <button
          className={filtro === 'pasadas' ? 'filtro-activo' : ''}
          onClick={() => setFiltro('pasadas')}
        >
          Pasadas ({pasadas.length})
        </button>

        <button
          className={filtro === 'canceladas' ? 'filtro-activo' : ''}
          onClick={() => setFiltro('canceladas')}
        >
          Canceladas ({canceladas.length})
        </button>
      </div>

      <div className="lista-reservas">
        {reservasFiltradas.map(r => (
          <article className="panel reserva-item" key={r.id}>
            <div>
              <h3>{r.salas?.nombre || 'Sala'}</h3>

              <p className="muted">
                {fmtFechaHora(r.inicio)} a {fmtHora(r.fin)}
                {' · '}
                {r.personas} persona(s)
              </p>

              <span className={`estado ${r.estado}`}>
                {r.estado}
              </span>
            </div>

            {r.estado === 'confirmada' &&
              new Date(r.inicio).getTime() > ahora && (
                <button
                  className="boton-secundario"
                  onClick={() => cancelar(r.id)}
                  disabled={ocupado === r.id}
                >
                  {ocupado === r.id ? 'Cancelando...' : 'Cancelar'}
                </button>
              )}
          </article>
        ))}

        {reservasFiltradas.length === 0 && (
          <div className="panel vacio">
            No hay reservas en esta categoría.
          </div>
        )}
      </div>
    </>
  );
}

