import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configurado = Boolean(url && key && !url.includes('TU-PROYECTO'));
// Una URL local válida permite mostrar la pantalla de configuración sin bloquear React.
export const supabase = createClient(configurado ? url : 'https://placeholder.supabase.co', configurado ? key : 'clave-de-ejemplo');
