-- SALA LIBRE · Ejecutar una sola vez en Supabase > SQL Editor.
-- Requiere un proyecto NUEVO, sin tablas anteriores con estos nombres.
create extension if not exists btree_gist;

create table public.perfiles (
 id uuid primary key references auth.users(id) on delete cascade,
 nombre text not null,
 rol text not null default 'usuario' check (rol in ('usuario','admin'))
);
create table public.salas (
 id bigint generated always as identity primary key,
 nombre text not null unique,
 capacidad int not null check (capacidad > 0),
 descripcion text not null default '',
 equipamiento text[] not null default '{}',
 activa boolean not null default true
);
create table public.reservas (
 id bigint generated always as identity primary key,
 usuario_id uuid not null references public.perfiles(id),
 sala_id bigint not null references public.salas(id),
 inicio timestamptz not null,
 fin timestamptz not null,
 personas int not null check (personas > 0),
 estado text not null default 'confirmada' check (estado in ('confirmada','cancelada')),
 creada_en timestamptz not null default now(),
 constraint reserva_fin_positivo check(fin > inicio),
 constraint reserva_sin_superposicion exclude using gist
   (sala_id with =, tstzrange(inicio,fin,'[)') with &&)
   where (estado = 'confirmada')
);
create table public.bloqueos (
 id bigint generated always as identity primary key,
 sala_id bigint not null references public.salas(id),
 inicio timestamptz not null,
 fin timestamptz not null,
 motivo text not null,
 constraint bloqueo_fin_positivo check(fin>inicio),
 constraint bloqueo_sin_superposicion exclude using gist
  (sala_id with =, tstzrange(inicio,fin,'[)') with &&)
);
create index on public.reservas(usuario_id,inicio);
create index on public.bloqueos(sala_id,inicio);

-- Cada nueva cuenta recibe un perfil de tipo usuario.
create or replace function public.crear_perfil() returns trigger language plpgsql
security definer set search_path = '' as $$
begin
 insert into public.perfiles(id,nombre)
 values(new.id, coalesce(nullif(new.raw_user_meta_data->>'nombre',''),split_part(new.email,'@',1)));
 return new;
end $$;
create trigger al_registrarse after insert on auth.users for each row execute function public.crear_perfil();

create or replace function public.es_admin() returns boolean language sql stable
security definer set search_path = '' as $$
 select exists (select 1 from public.perfiles where id=auth.uid() and rol='admin');
$$;

-- Las validaciones están en la base y funcionan incluso si se saltea React.
create or replace function public.validar_intervalo(p_inicio timestamptz,p_fin timestamptz)
returns void language plpgsql set search_path = '' as $$
declare ini timestamp := p_inicio at time zone 'America/Argentina/Buenos_Aires';
        fin timestamp := p_fin at time zone 'America/Argentina/Buenos_Aires';
begin
 if p_fin<=p_inicio then raise exception 'El horario de finalización debe ser posterior.'; end if;
 if ini::date<>fin::date or extract(isodow from ini)>5 then
  raise exception 'Solo se reserva de lunes a viernes, en el mismo día.';
 end if;
 if ini::time<'09:00' or fin::time>'18:00' then
  raise exception 'El horario debe estar entre las 09:00 y las 18:00.';
 end if;
 if extract(minute from ini)::int%30<>0 or extract(minute from fin)::int%30<>0
    or extract(second from ini)<>0 or extract(second from fin)<>0 then
  raise exception 'Los horarios deben ser tramos de 30 minutos.';
 end if;
 if p_inicio<now() then raise exception 'No se puede reservar en el pasado.'; end if;
end $$;

create or replace function public.validar_reserva() returns trigger language plpgsql
set search_path = '' as $$
declare sala record;
begin
 perform public.validar_intervalo(new.inicio,new.fin);
 select * into sala from public.salas where id=new.sala_id for update;
 if not found then raise exception 'La sala no existe.'; end if;
 if not sala.activa then raise exception 'La sala % no está disponible.',sala.nombre; end if;
 if new.personas>sala.capacidad then
   raise exception 'La sala % admite hasta % personas.',sala.nombre,sala.capacidad;
 end if;
 if exists(select 1 from public.bloqueos b where b.sala_id=new.sala_id
     and tstzrange(b.inicio,b.fin,'[)') && tstzrange(new.inicio,new.fin,'[)')) then
  raise exception 'La sala está bloqueada en ese horario.';
 end if;
 return new;
end $$;
create trigger trg_validar_reserva before insert on public.reservas
for each row execute function public.validar_reserva();

create or replace function public.validar_bloqueo() returns trigger language plpgsql
set search_path = '' as $$
begin
 perform public.validar_intervalo(new.inicio,new.fin);
 perform 1 from public.salas where id=new.sala_id for update;
 if exists(select 1 from public.reservas r where r.sala_id=new.sala_id
  and r.estado='confirmada'
  and tstzrange(r.inicio,r.fin,'[)') && tstzrange(new.inicio,new.fin,'[)')) then
  raise exception using message='El bloqueo se superpone con reservas confirmadas.',errcode='P0002';
 end if;
 return new;
end $$;
create trigger trg_validar_bloqueo before insert on public.bloqueos
for each row execute function public.validar_bloqueo();

-- Evitar cambios directos de los campos críticos: cancelar solo por RPC.
create or replace function public.reserva_solo_cancelacion() returns trigger
language plpgsql set search_path = '' as $$
begin
 if new.id<>old.id or new.usuario_id<>old.usuario_id or new.sala_id<>old.sala_id or
 new.inicio<>old.inicio or new.fin<>old.fin or new.personas<>old.personas or
 new.creada_en<>old.creada_en or new.estado<>'cancelada' or old.estado<>'confirmada' then
 raise exception 'Solo se permite cancelar reservas confirmadas.';
 end if;
 return new;
end $$;
create trigger trg_reserva_update before update on public.reservas
for each row execute function public.reserva_solo_cancelacion();

alter table public.perfiles enable row level security;
alter table public.salas enable row level security;
alter table public.reservas enable row level security;
alter table public.bloqueos enable row level security;
create policy perfiles_ver on public.perfiles for select to authenticated
 using (id=auth.uid() or public.es_admin());
create policy salas_ver on public.salas for select to authenticated using (true);
create policy salas_crear on public.salas for insert to authenticated with check(public.es_admin());
create policy salas_editar on public.salas for update to authenticated
 using(public.es_admin()) with check(public.es_admin());
create policy reservas_ver on public.reservas for select to authenticated
 using(usuario_id=auth.uid() or public.es_admin());
create policy reservas_crear on public.reservas for insert to authenticated
 with check(usuario_id=auth.uid() and estado='confirmada');
create policy bloqueos_ver on public.bloqueos for select to authenticated using (true);
create policy bloqueos_crear on public.bloqueos for insert to authenticated with check(public.es_admin());
create policy bloqueos_borrar on public.bloqueos for delete to authenticated using(public.es_admin());

-- Función RPC para buscar salas realmente disponibles.
create or replace function public.salas_disponibles(p_inicio timestamptz,p_fin timestamptz,p_personas int)
returns setof public.salas language plpgsql stable security invoker set search_path = '' as $$
begin
 perform public.validar_intervalo(p_inicio,p_fin);
 if p_personas<1 then raise exception 'La cantidad de personas debe ser positiva.'; end if;
 return query
 select s.* from public.salas s
 where s.activa and s.capacidad>=p_personas
 and not exists(select 1 from public.reservas r where r.sala_id=s.id and r.estado='confirmada'
  and tstzrange(r.inicio,r.fin,'[)')&&tstzrange(p_inicio,p_fin,'[)'))
 and not exists(select 1 from public.bloqueos b where b.sala_id=s.id
  and tstzrange(b.inicio,b.fin,'[)')&&tstzrange(p_inicio,p_fin,'[)'))
 order by s.capacidad,s.nombre;
end $$;

-- La función valida identidad y propiedad de la reserva.
create or replace function public.cancelar_reserva(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'Debés iniciar sesión.';end if;
 update public.reservas set estado='cancelada'
 where id=p_id and estado='confirmada' and inicio>now()
   and (usuario_id=auth.uid() or public.es_admin());
 if not found then raise exception 'La reserva no existe, ya empezó o no te pertenece.';end if;
end $$;

create or replace function public.resumen_reservas(p_desde date,p_hasta date)
returns table(sala text,confirmadas bigint,canceladas bigint,horas numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.es_admin() then raise exception 'Acceso exclusivo de administración.';end if;
 if p_desde>p_hasta then raise exception 'Período inválido.';end if;
 return query select s.nombre,
 count(r.id) filter(where r.estado='confirmada'),
 count(r.id) filter(where r.estado='cancelada'),
 coalesce(round(sum(extract(epoch from r.fin-r.inicio)/3600)
  filter(where r.estado='confirmada')::numeric,1),0)
 from public.salas s left join public.reservas r
 on r.sala_id=s.id and (r.inicio at time zone 'America/Argentina/Buenos_Aires')::date between p_desde and p_hasta
 group by s.id,s.nombre order by horas desc;
end $$;

-- Permisos explícitos para las funciones ejecutadas desde el navegador.
revoke all on function public.cancelar_reserva(bigint) from public;
revoke all on function public.resumen_reservas(date,date) from public;
grant execute on function public.cancelar_reserva(bigint) to authenticated;
grant execute on function public.resumen_reservas(date,date) to authenticated;

grant usage on schema public to authenticated;
grant select on public.perfiles,public.salas,public.reservas,public.bloqueos to authenticated;
grant insert on public.reservas,public.bloqueos,public.salas to authenticated;
grant update on public.salas to authenticated;
grant delete on public.bloqueos to authenticated;
grant usage,select on all sequences in schema public to authenticated;

insert into public.salas(nombre,capacidad,descripcion,equipamiento) values
 ('Box 1',2,'Cabina silenciosa para llamadas o trabajo en pareja.',array['Monitor 24"','Auriculares']),
 ('Sala Pampa',4,'Mesa redonda para reuniones cortas.',array['TV 50"','Pizarra']),
 ('Sala Andes',8,'Sala de reuniones con videoconferencia.',array['Pantalla 65"','Cámara','Pizarra']),
 ('Aula Taller',20,'Espacio flexible para capacitaciones.',array['Proyector','Sonido','Mesas móviles']);
