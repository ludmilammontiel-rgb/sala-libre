import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {fmtFechaHora,fmtHora,mensajeError} from '../../lib/horario';
export default function Reservas(){
 const [filas,setFilas]=useState([]),[error,setError]=useState(''),[mensaje,setMensaje]=useState('');
 const cargar=async()=>{const {data,error}=await supabase.from('reservas').select('id,usuario_id,personas,estado,inicio,fin,salas(nombre),perfiles(nombre)').order('inicio',{ascending:false});if(error)setError(mensajeError(error));else setFilas(data||[])};
 useEffect(()=>{cargar()},[]);
 const cancelar=async(r)=>{if(!window.confirm('¿Cancelar esta reserva?'))return;setError('');setMensaje('');const {error}=await supabase.rpc('cancelar_reserva',{p_id:r.id});if(error)setError(mensajeError(error));else{setMensaje('Reserva cancelada.');cargar()}};
 return <><div className="cabecera"><h2>Todas las reservas</h2><button className="boton-secundario" onClick={cargar}>Actualizar</button></div>{error&&<p className="error">{error}</p>}{mensaje&&<p className="exito">{mensaje}</p>}<div className="tabla-wrap"><table><thead><tr><th>Sala</th><th>Usuario</th><th>Inicio</th><th>Fin</th><th>Personas</th><th>Estado</th><th></th></tr></thead><tbody>{filas.map(r=><tr key={r.id}><td>{r.salas?.nombre}</td><td>{r.perfiles?.nombre||r.usuario_id?.slice(0,8)}</td><td>{fmtFechaHora(r.inicio)}</td><td>{fmtHora(r.fin)}</td><td>{r.personas}</td><td><span className={`estado ${r.estado}`}>{r.estado}</span></td><td>{r.estado==='confirmada'&&new Date(r.inicio)>new Date()&&<button className="boton-secundario" onClick={()=>cancelar(r)}>Cancelar</button>}</td></tr>)}{!filas.length&&<tr><td colSpan="7">No se encontraron reservas.</td></tr>}</tbody></table></div></>
}
