import {Navigate,Outlet,useLocation} from 'react-router-dom';
import {useSesion} from '../context/SesionContext';
export default function RutaPrivada({admin=false}){
 const {usuario,cargando,esAdmin}=useSesion();const location=useLocation();
 if(cargando)return <div className="notice">Cargando sesión...</div>;
 if(!usuario)return <Navigate to="/ingresar" state={{desde:location.pathname}} replace/>;
 if(admin&&!esAdmin)return <Navigate to="/salas" replace/>;
 return <Outlet/>;
}
