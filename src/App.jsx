import {NavLink,Route,Routes,Navigate,useNavigate} from 'react-router-dom';
import {DoorOpen,CalendarDays,ShieldCheck,LogOut} from 'lucide-react';
import {supabase,configurado} from './lib/supabase';
import {useSesion} from './context/SesionContext';
import RutaPrivada from './components/RutaPrivada';
import Ingresar from './pages/Ingresar';
import Catalogo from './pages/Catalogo';
import Reservar from './pages/Reservar';
import MisReservas from './pages/MisReservas';
import Admin from './pages/admin/Admin';
export default function App(){
 const {perfil,usuario,esAdmin}=useSesion();const navigate=useNavigate();
 const salir=async()=>{await supabase.auth.signOut();navigate('/ingresar')};
 return <div className="layout"><aside className="sidebar"><div className="marca"><span className="logo">SL</span><b>Sala Libre</b></div><nav className="menu"><NavLink to="/salas"><DoorOpen size={17}/> Salas</NavLink><NavLink to="/mis-reservas"><CalendarDays size={17}/> Mis reservas</NavLink>{esAdmin&&<NavLink to="/admin"><ShieldCheck size={17}/> Administración</NavLink>}</nav><div className="sidebar-pie"><p className="eyebrow">SESIÓN</p><div className="identidad">{usuario ? <><b>{perfil?.nombre||usuario.email}</b><span className="tag">{perfil?.rol||'usuario'}</span></>:'Sin iniciar sesión'}</div>{usuario&&<button className="boton-secundario full" onClick={salir}><LogOut size={15}/> Salir</button>}</div></aside><main className="principal">{!configurado&&<div className="alerta">Falta configurar Supabase: copiá <code>.env.example</code> a <code>.env</code> y completá las claves de tu proyecto.</div>}<Routes><Route path="/ingresar" element={<Ingresar/>}/><Route element={<RutaPrivada/>}><Route path="/salas" element={<Catalogo/>}/><Route path="/reservar/:id" element={<Reservar/>}/><Route path="/mis-reservas" element={<MisReservas/>}/></Route><Route element={<RutaPrivada admin/>}><Route path="/admin/*" element={<Admin/>}/></Route><Route path="*" element={<Navigate to={usuario?'/salas':'/ingresar'} replace/>}/></Routes></main></div>
}
