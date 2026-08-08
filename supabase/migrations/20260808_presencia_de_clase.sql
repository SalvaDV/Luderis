-- REGISTRO DE PRESENCIA — evidencia objetiva de cuánto duró una clase.
--
-- El problema: cuando el alumno objeta las horas declaradas, hoy no hay con qué
-- decidir. La única evidencia es `evidencia_url`, una grabación que adjunta a
-- mano la parte interesada. Sin nada más, cualquier resolución es arbitraria.
--
-- La idea: que la duración se MIDA en vez de DECLARARSE. Cada parte reporta su
-- propia presencia con un heartbeat, y la duración de la clase es el
-- SOLAPAMIENTO entre ambas — no la unión.
--
-- Por qué el solapamiento y no la suma: es lo que hace que la medición resista
-- aunque la reporte el cliente. Inflar la propia presencia no sirve de nada,
-- porque el resultado está acotado por lo que reporta la contraparte. Un docente
-- que deja la pestaña abierta tres horas solo mide cero. Para inflar la medición
-- harían falta las DOS partes coordinadas, que es exactamente el caso en el que
-- no hay conflicto.
--
-- Todos los timestamps los pone el servidor (now()), nunca el cliente: un reloj
-- de máquina se cambia en dos clics.
--
-- `origen` deja la puerta abierta: hoy 'app' (reportado por el navegador de cada
-- parte), mañana 'webhook' si se contrata un proveedor de video que reporte la
-- asistencia server-side. La lógica de disputas no cambia cuando eso pase.

create table if not exists public.clase_presencias (
  id             uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones(id) on delete cascade,
  usuario_email  text not null,
  rol            text not null check (rol in ('docente','alumno')),
  origen         text not null default 'app' check (origen in ('app','webhook')),
  inicio_at      timestamptz not null default now(),
  visto_at       timestamptz not null default now(),
  fin_at         timestamptz,
  created_at     timestamptz not null default now()
);

comment on table public.clase_presencias is
  'Presencia reportada por cada parte durante una clase. La duración de la clase es el solapamiento entre docente y alumno, nunca la suma.';
comment on column public.clase_presencias.visto_at is
  'Último heartbeat. Si el navegador se cierra de golpe y fin_at queda null, este es el fin efectivo.';

create index if not exists idx_clase_presencias_pub_email
  on public.clase_presencias (publicacion_id, usuario_email, inicio_at desc);
create index if not exists idx_clase_presencias_abiertas
  on public.clase_presencias (publicacion_id, usuario_email) where fin_at is null;

-- Nadie toca esta tabla directamente: si el alumno pudiera escribirla, podría
-- fabricar la evidencia que después se usa para decidir sobre su propia plata.
alter table public.clase_presencias enable row level security;
revoke all on public.clase_presencias from public, anon, authenticated;

-- ── Minutos con AMBAS partes presentes en una fecha ─────────────────────────
create or replace function public.minutos_presencia_compartida(
  p_pub_id        uuid,
  p_docente_email text,
  p_alumno_email  text,
  p_fecha         date
) returns integer
language sql stable security definer set search_path to 'public','pg_temp'
as $$
  with doc as (
    select inicio_at as ini, coalesce(fin_at, visto_at) as fin
      from public.clase_presencias
     where publicacion_id = p_pub_id and usuario_email = p_docente_email
       and rol = 'docente'
       and (inicio_at at time zone 'America/Argentina/Buenos_Aires')::date = p_fecha
  ), alu as (
    select inicio_at as ini, coalesce(fin_at, visto_at) as fin
      from public.clase_presencias
     where publicacion_id = p_pub_id and usuario_email = p_alumno_email
       and rol = 'alumno'
       and (inicio_at at time zone 'America/Argentina/Buenos_Aires')::date = p_fecha
  )
  select coalesce(
    round(sum(extract(epoch from (least(d.fin, a.fin) - greatest(d.ini, a.ini))) / 60.0))
  , 0)::int
  from doc d
  join alu a on least(d.fin, a.fin) > greatest(d.ini, a.ini);
$$;

-- ── Heartbeat ───────────────────────────────────────────────────────────────
-- Lo llama el navegador de cada parte cada 60 s mientras la clase está abierta.
-- Si pasaron más de 3 minutos sin señal (dos latidos perdidos), se cierra la
-- sesión anterior en su último visto_at y se abre una nueva: así una caída de
-- conexión no se cuenta como tiempo de clase.
create or replace function public.presencia_ping(p_pub_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text := (select auth.email());
  v_pub   public.publicaciones%rowtype;
  v_rol   text;
  v_id    uuid;
  v_ini   timestamptz;
  v_otro  int := 0;
begin
  if v_uid is null then return jsonb_build_object('error','No autenticado'); end if;

  select * into v_pub from public.publicaciones where id = p_pub_id;
  if not found then return jsonb_build_object('error','Publicación no encontrada'); end if;

  if v_pub.autor_id = v_uid then
    v_rol := 'docente';
  elsif exists (select 1 from public.inscripciones i
                 where i.publicacion_id = p_pub_id
                   and i.alumno_email = v_email
                   and coalesce(i.estado,'activa') = 'activa') then
    v_rol := 'alumno';
  else
    return jsonb_build_object('error','No sos parte de esta clase');
  end if;

  -- Cerrar lo que quedó colgado de una sesión anterior.
  update public.clase_presencias
     set fin_at = visto_at
   where publicacion_id = p_pub_id and usuario_email = v_email
     and fin_at is null and visto_at < now() - interval '3 minutes';

  update public.clase_presencias
     set visto_at = now()
   where publicacion_id = p_pub_id and usuario_email = v_email and fin_at is null
   returning id, inicio_at into v_id, v_ini;

  if v_id is null then
    insert into public.clase_presencias (publicacion_id, usuario_email, rol, origen)
    values (p_pub_id, v_email, v_rol, 'app')
    returning id, inicio_at into v_id, v_ini;
  end if;

  -- ¿Está la otra parte conectada ahora mismo?
  select count(*) into v_otro
    from public.clase_presencias
   where publicacion_id = p_pub_id and usuario_email <> v_email
     and fin_at is null and visto_at > now() - interval '3 minutes';

  return jsonb_build_object(
    'ok', true, 'sesion_id', v_id, 'rol', v_rol, 'desde', v_ini,
    'minutos', greatest(round(extract(epoch from (now() - v_ini)) / 60.0), 0),
    'otros_presentes', v_otro);
end $$;

-- ── Cierre explícito ────────────────────────────────────────────────────────
create or replace function public.presencia_cerrar(p_pub_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare v_email text := (select auth.email()); v_n int;
begin
  if v_email is null then return jsonb_build_object('error','No autenticado'); end if;
  update public.clase_presencias set fin_at = now()
   where publicacion_id = p_pub_id and usuario_email = v_email and fin_at is null;
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', true, 'cerradas', v_n);
end $$;

revoke all on function public.presencia_ping(uuid)    from public, anon;
revoke all on function public.presencia_cerrar(uuid)  from public, anon;
revoke all on function public.minutos_presencia_compartida(uuid, text, text, date) from public, anon;
grant execute on function public.presencia_ping(uuid)   to authenticated;
grant execute on function public.presencia_cerrar(uuid) to authenticated;
grant execute on function public.minutos_presencia_compartida(uuid, text, text, date) to authenticated, service_role;
