-- Primero creá tu usuario desde la app y confirmá el correo.
-- Luego reemplazá el email y ejecutá este script en SQL Editor.
update public.perfiles set rol='admin'
where id=(select id from auth.users where email='TU_CORREO@EJEMPLO.COM');
-- Comprobación (debe mostrar una fila):
select nombre,rol from public.perfiles where rol='admin';
