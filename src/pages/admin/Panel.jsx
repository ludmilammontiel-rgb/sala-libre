import {useState} from 'react';
import {supabase} from '../../lib/supabase';
import {hoy,mensajeError} from '../../lib/horario';
export default function Panel(){
 const [desde,setDesde]=useState(hoy().slice(0,7)+'-01'),[hasta,setHasta]=useState(hoy()),[filas,setFilas]=useState([]),[error,setError]=useState(''),[cargando,setCargando]=useState(false);
 async function consultar(e){e.preventDefault();setCargando(true);setError('');const {data,error}=await supabase.rpc('resumen_reservas',{p_desde:desde,p_hasta:hasta});if(error)setError(mensajeError(error));else setFilas(data||[]);setCargando(false)}
 return <><form className="panel busqueda" onSubmit={consultar}><div className="campos"><label>Desde<input type="date" value={desde} onChange={e=>setDesde(e.target.value)}/></label><label>Hasta<input type="date" value={hasta} onChange={e=>setHasta(e.target.value)}/></label></div><button className="boton" disabled={cargando}>{cargando?'Consultando...':'Consultar horas utilizadas'}</button>{error&&<p className="error">{error}</p>}</form><div className="tabla-wrap"><table><thead><tr><th>Sala</th><th>Confirmadas</th><th>Canceladas</th><th>Horas utilizadas</th></tr></thead><tbody>{filas.map(f=><tr key={f.sala}><td>{f.sala}</td><td>{f.confirmadas}</td><td>{f.canceladas}</td><td>{f.horas}</td></tr>)}{filas.length===0&&<tr><td colSpan="4">Elegí un período y consultá el resumen.</td></tr>}</tbody></table></div></>
}
