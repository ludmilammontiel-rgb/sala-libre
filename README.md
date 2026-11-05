# Sala Libre · React + Vite + Supabase

Aplicación de reservas de salas con roles `usuario` y `admin`, en español, inspirada en el diseño oscuro de la consigna.

## 1. Base de datos

1. Creá un proyecto en https://supabase.com.
2. Abrí **SQL Editor → New query** y ejecutá completo `supabase/01_esquema.sql` **una sola vez, sobre un proyecto vacío**.
3. Entrá en **Authentication → Providers → Email**; para pruebas locales podés decidir si requerir confirmación por correo.
4. El esquema crea perfiles automáticamente al registrarse; incluye RLS, triggers, exclusión de reservas superpuestas, RPC de disponibilidad, cancelación y reporte.

**Si ya ejecutaste scripts de la consigna:** no ejecutes `01_esquema.sql` sobre esas mismas tablas: daría errores de tabla existente. Usá una base limpia o revisá qué objetos ya tenés.

## 2. Variables de entorno

En la carpeta raíz duplicá `.env.example` como `.env` y reemplazá:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_o_publishable
```

Encontrás ambos valores en **Supabase → Project Settings → API / API Keys**. Usá solo la clave **anon/publishable**, **nunca** `service_role` o una clave secreta. `.env` está en `.gitignore`.

## 3. Ejecutar en VS Code

Abrí la carpeta `sala-libre`, abrí una terminal y ejecutá:

```bash
npm install
npm run dev
```

Abrí la URL indicada, habitualmente `http://localhost:5173`.

## 4. Crear administrador

1. Registrate desde la app (o Authentication → Users).
2. Abrí `supabase/02_promover_admin.sql`, cambiá `TU_CORREO@EJEMPLO.COM` por el correo exacto y ejecutalo en SQL Editor.
3. Cerrá sesión y volvé a ingresar. Aparecerá **Administración**.

## 5. Pruebas requeridas

- Usuario A: buscá lugar para 2 personas el próximo día hábil de 11 a 12; reservá Box 1.
- Repetí la búsqueda: Box 1 ya no debe aparecer.
- Usuario B: no debe ver en “Mis reservas” las del usuario A.
- Admin: intentá bloquear Sala Andes; si existe una reserva confirmada cruzada, la base lo rechaza.
- Cancelá una reserva futura; queda registrada como `cancelada` y libera el horario.
- Probá una sala de capacidad insuficiente, sala inactiva y fin anterior al inicio.

## Archivos

La estructura solicitada está bajo `src/` e incluye todas las pantallas y componentes. El SQL está en `supabase/`.

## Nota técnica

Los horarios se envían como `timestamptz` con zona Argentina UTC−03; la validación y las fechas de los reportes se calculan en `America/Argentina/Buenos_Aires`. El backend evita doble reserva mediante una exclusión GiST. Para despliegues fuera de Argentina, hay que adaptar la conversión en `src/lib/horario.js`.
