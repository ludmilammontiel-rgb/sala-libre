import {createContext,useContext,useEffect,useState} from 'react';
import {supabase,configurado} from '../lib/supabase';
const SesionContext=createContext(null);
export const useSesion=()=>useContext(SesionContext);
export function SesionProvider({children}) {
  const [sesion,setSesion]=useState(null),[perfil,setPerfil]=useState(null),[cargando,setCargando]=useState(true);
  useEffect(()=>{
    let vigente=true;
    const cargar=async(s)=>{
      if(!vigente)return;
      setSesion(s);setPerfil(null);
      if(s?.user){const {data}=await supabase.from('perfiles').select('*').eq('id',s.user.id).maybeSingle();if(vigente)setPerfil(data);}
      if(vigente)setCargando(false);
    };
    if(!configurado){setCargando(false);return;}
    supabase.auth.getSession().then(({data})=>cargar(data.session)).catch(()=>setCargando(false));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_evento,s)=>{setTimeout(()=>cargar(s),0)});
    return ()=>{vigente=false;subscription.unsubscribe()};
  },[]);
  const recargarPerfil=async()=>{if(!sesion)return;const {data}=await supabase.from('perfiles').select('*').eq('id',sesion.user.id).single();setPerfil(data)};
  return <SesionContext.Provider value={{sesion,usuario:sesion?.user,perfil,cargando,esAdmin:perfil?.rol==='admin',recargarPerfil}}>{children}</SesionContext.Provider>;
}
