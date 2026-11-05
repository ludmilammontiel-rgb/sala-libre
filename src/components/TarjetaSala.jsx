import {Link} from 'react-router-dom';
export default function TarjetaSala({sala,query=''}){
  return <article className="sala-card"><p className="muted small">Hasta {sala.capacidad} personas</p><h3>{sala.nombre}</h3><p className="muted descripcion">{sala.descripcion || 'Sala de trabajo compartido.'}</p><div className="etiquetas">{(sala.equipamiento||[]).map(x=><span key={x}>{x}</span>)}</div><Link className="boton full" to={`/reservar/${sala.id}${query}`}>Reservar</Link></article>;
}
