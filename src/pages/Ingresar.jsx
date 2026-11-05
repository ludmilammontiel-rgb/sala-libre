import {useState} from 'react';
import {Navigate,useLocation,useNavigate} from 'react-router-dom';
import {supabase} from '../lib/supabase';
import {useSesion} from '../context/SesionContext';
import {mensajeError} from '../lib/horario';
export default function Ingresar(){
 const {usuario}=useSesion(),navigate=useNavigate(),location=useLocation();const [registrar,setRegistrar]=useState(false),[nombre,setNombre]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[exito,setExito]=useState(''),[esperando,setEsperando]=useState(false);
 if(usuario)return <Navigate to={location.state?.desde||'/salas'} replace/>;
 const enviar=async(e)=>{e.preventDefault();setError('');setExito('');setEsperando(true);try{
  if(registrar){const {data,error}=await supabase.auth.signUp({email,password,options:{data:{nombre}}});if(error)throw error;if(data.session)navigate('/salas');else setExito('Cuenta creada. Revisá tu correo y confirmá la cuenta para ingresar.');}
  else {const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;navigate(location.state?.desde||'/salas');}
 }catch(err){setError(mensajeError(err))}finally{setEsperando(false)}};
 return <div className="auth-card panel"><span className="eyebrow">BIENVENIDO A SALA LIBRE</span><h1>{registrar?'Crear cuenta':'Ingresar'}</h1><p className="muted">Reservá salas para trabajar o reunirte.</p><form onSubmit={enviar} className="formulario">{registrar&&<label>Nombre<input value={nombre} onChange={e=>setNombre(e.target.value)} required minLength={2}/></label>}<label>Correo electrónico<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="tu@correo.com"/></label><label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6}/></label>{error&&<p className="error">{error}</p>}{exito&&<p className="exito">{exito}</p>}<button className="boton" disabled={esperando}>{esperando?'Procesando...':registrar?'Registrarme':'Ingresar'}</button></form><button className="link-boton" onClick={()=>{setRegistrar(!registrar);setError('');setExito('')}}>{registrar?'Ya tengo cuenta':'¿No tenés cuenta? Registrate'}</button></div>
}
