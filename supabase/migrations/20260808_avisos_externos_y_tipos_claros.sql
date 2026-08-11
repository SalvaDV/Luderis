-- AVISOS QUE SALEN DE LA APP + CADA NOTICIA CON SU NOMBRE.
--
-- Problema 1: todas las notificaciones viven en la campanita de la app. Las que
-- arrancan un plazo con plata (aprobar horas, disputas, retiros) no le llegan a
-- quien no abre la app — y el plazo corre igual. Se agrega una marca
-- aviso_externo_at y una tarea cada 5 minutos (edge function avisos-externos)
-- que manda push + email de las críticas pendientes.
--
-- Problema 2: usábamos el tipo 'confirmar_clase' para todo (ajustes, disputas,
-- resoluciones), así que el docente recibía "Confirmá las horas de tu clase"
-- cuando el contenido real era "te recortamos el pago". Tipos nuevos con
-- títulos honestos; 'confirmar_clase' queda solo para lo que es.

alter table public.notificaciones
  add column if not exists aviso_externo_at timestamptz;

-- Lo ya existente se marca como enviado: si no, el primer tick mandaría de
-- golpe la historia entera por mail.
update public.notificaciones set aviso_externo_at = now() where aviso_externo_at is null;

create index if not exists idx_notificaciones_aviso_pendiente
  on public.notificaciones (created_at)
  where aviso_externo_at is null;

alter table public.notificaciones drop constraint if exists notificaciones_tipo_check;
alter table public.notificaciones add constraint notificaciones_tipo_check check (tipo = any (array[
  'valorar_curso','nueva_oferta','oferta_aceptada','oferta_rechazada','nuevo_mensaje',
  'nueva_inscripcion','nuevo_documento','publicacion_destacada','sistema','nuevo_ayudante',
  'chat_grupal','clase_iniciada','nuevo_contenido','busqueda_eliminada','busqueda_acordada',
  'contraoferta','pago_aprobado_mp','alerta_publicacion','nueva_pregunta','pregunta_respondida',
  'alerta_contacto','pago_liberado','confirmar_clase','retiro_solicitado','acuerdo_confirmado',
  'liquidacion_disponible','retiro_procesado','retiro_rechazado',
  'horas_ajustadas','disputa_abierta','disputa_resuelta','horas_por_vencer']));

-- Secreto para el cron (la tabla config no es legible por usuarios) y agenda.
do $$
declare v_secret text; v_cmd text;
begin
  select valor into v_secret from public.config where clave = 'cron_secret_avisos';
  if v_secret is null then
    v_secret := encode(gen_random_bytes(24), 'hex');
    insert into public.config (clave, valor) values ('cron_secret_avisos', v_secret);
  end if;

  -- El Bearer anon pasa el gateway (si exige JWT); la autorización real es el
  -- x-cron-key, que la función compara contra config.
  v_cmd := format(
    $cmd$select net.http_post(
      url := 'https://hptdyehzqfpgtrpuydny.supabase.co/functions/v1/avisos-externos',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g',
        'x-cron-key', %L),
      body := '{}'::jsonb)$cmd$, v_secret);

  perform cron.unschedule('avisos-externos')
    where exists (select 1 from cron.job where jobname = 'avisos-externos');
  perform cron.schedule('avisos-externos', '*/5 * * * *', v_cmd);
end $$;

-- ── Emisores: cada evento con su tipo ───────────────────────────────────────

-- El alumno objeta → al docente le llega "se abrió un reclamo", no "confirmá".
create or replace function public.objetar_horas_clase(p_clase_id uuid, p_horas numeric, p_motivo text default null)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_clase public.clases_realizadas%rowtype;
  v_caller text := auth.email();
  v_min int;
  v_ins_id uuid;
  v_disputa_id uuid;
begin
  if v_caller is null then return jsonb_build_object('error','No autenticado'); end if;

  select * into v_clase from public.clases_realizadas where id = p_clase_id;
  if not found then return jsonb_build_object('error','Clase no encontrada'); end if;
  if v_caller is distinct from v_clase.alumno_email then
    return jsonb_build_object('error','Solo el alumno puede objetar las horas'); end if;
  if coalesce(v_clase.confirmado_alumno,false) then
    return jsonb_build_object('error','Ya aprobaste esta clase'); end if;
  if v_clase.objetada_at is not null then
    return jsonb_build_object('error','Ya objetaste esta clase'); end if;

  v_min := round(coalesce(p_horas,0) * 60)::int;
  if v_min < 0 then return jsonb_build_object('error','Las horas no pueden ser negativas'); end if;
  if v_min > coalesce(v_clase.duracion_min,0) then
    return jsonb_build_object('error','No podés objetar declarando más horas que el docente'); end if;

  update public.clases_realizadas
     set duracion_objetada_min = v_min, objetada_at = now(), objetada_motivo = p_motivo
   where id = p_clase_id;

  select id into v_ins_id from public.inscripciones
   where publicacion_id = v_clase.publicacion_id and alumno_email = v_clase.alumno_email
     and coalesce(estado,'activa') = 'activa'
   order by created_at limit 1;

  insert into public.disputas
    (clase_realizada_id, inscripcion_id, alumno_email, docente_email, motivo, descripcion,
     estado, horas_docente, horas_alumno)
  values
    (p_clase_id, v_ins_id, v_clase.alumno_email, v_clase.docente_email, 'horas_declaradas',
     coalesce(p_motivo,''), 'abierta',
     coalesce(v_clase.duracion_min,0)::numeric/60, v_min::numeric/60)
  returning id into v_disputa_id;

  perform public.notificar(v_clase.docente_email, 'disputa_abierta',
                           v_clase.publicacion_id, 'Un alumno objetó las horas de una clase. El pago queda frenado hasta resolverlo.');

  return jsonb_build_object('ok', true, 'horas_objetadas', v_min::numeric/60, 'disputa_id', v_disputa_id);
end $$;

-- El docente sostiene → al alumno le llega "reclamo en curso".
create or replace function public.sostener_horas_clase(
  p_clase_id uuid,
  p_descargo text default null
) returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_clase   public.clases_realizadas%rowtype;
  v_caller  text := auth.email();
  v_disputa uuid;
  v_admin   text;
begin
  if v_caller is null then return jsonb_build_object('error','No autenticado'); end if;

  select * into v_clase from public.clases_realizadas where id = p_clase_id;
  if not found then return jsonb_build_object('error','Clase no encontrada'); end if;

  if v_caller is distinct from v_clase.docente_email then
    return jsonb_build_object('error','Solo el docente puede responder la objeción');
  end if;
  if v_clase.objetada_at is null then
    return jsonb_build_object('error','Esta clase no tiene una objeción abierta');
  end if;

  update public.disputas
     set descargo_docente = nullif(btrim(coalesce(p_descargo,'')),''),
         descargo_at      = now(),
         updated_at       = now()
   where clase_realizada_id = p_clase_id and estado = 'abierta'
   returning id into v_disputa;

  if v_disputa is null then
    return jsonb_build_object('error','No hay una disputa abierta para esta clase');
  end if;

  perform public.notificar(v_clase.alumno_email, 'disputa_abierta', v_clase.publicacion_id,
    'El docente sostiene las horas declaradas. Lo resuelve el equipo de Luderis.');

  for v_admin in select email from public.usuarios where rol = 'admin' loop
    perform public.notificar(v_admin, 'sistema', v_clase.publicacion_id,
      'Disputa de horas sin acuerdo: hay que resolverla desde el panel');
  end loop;

  return jsonb_build_object('ok', true, 'disputa_id', v_disputa);
end $$;

-- El docente acepta la objeción → "reclamo resuelto".
create or replace function public.aceptar_objecion_clase(p_clase_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare v_clase public.clases_realizadas%rowtype; v_caller text := auth.email(); v_lib numeric := 0;
begin
  if v_caller is null then return jsonb_build_object('error','No autenticado'); end if;
  select * into v_clase from public.clases_realizadas where id = p_clase_id;
  if not found then return jsonb_build_object('error','Clase no encontrada'); end if;
  if v_caller is distinct from v_clase.docente_email then
    return jsonb_build_object('error','Solo el docente puede aceptar la objeción'); end if;
  if v_clase.objetada_at is null then
    return jsonb_build_object('error','Esta clase no tiene una objeción abierta'); end if;

  update public.clases_realizadas
     set duracion_min = coalesce(duracion_objetada_min, duracion_min),
         objetada_at = null, confirmado_alumno = true,
         confirmada_at = coalesce(confirmada_at, now())
   where id = p_clase_id;

  v_lib := public._liquidar_clase(p_clase_id);

  update public.disputas
     set estado = 'resuelta_alumno',
         horas_finales = coalesce(v_clase.duracion_objetada_min,0)::numeric/60,
         resolucion = 'El docente aceptó las horas declaradas por el alumno',
         resuelto_at = now(), updated_at = now()
   where clase_realizada_id = p_clase_id and estado = 'abierta';

  perform public.notificar(v_clase.alumno_email, 'disputa_resuelta',
                           v_clase.publicacion_id, 'El docente aceptó tu objeción de horas');
  return jsonb_build_object('ok', true, 'monto_liberado', coalesce(v_lib,0));
end $$;

-- El admin resuelve → "reclamo resuelto" para los dos.
create or replace function public.resolver_disputa_horas(p_disputa_id uuid, p_horas numeric, p_resolucion text default null)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_disp   public.disputas%rowtype;
  v_clase  public.clases_realizadas%rowtype;
  v_email  text := auth.email();
  v_rol    text;
  v_min    int;
  v_lib    numeric := 0;
  v_estado text;
begin
  select rol into v_rol from public.usuarios where id = auth.uid();
  if coalesce(v_rol,'') is distinct from 'admin' then
    return jsonb_build_object('error','Solo un administrador puede resolver la disputa');
  end if;

  select * into v_disp from public.disputas where id = p_disputa_id;
  if not found then return jsonb_build_object('error','Disputa no encontrada'); end if;
  if v_disp.motivo is distinct from 'horas_declaradas' then
    return jsonb_build_object('error','Esta disputa no es por horas declaradas'); end if;
  if v_disp.estado is distinct from 'abierta' then
    return jsonb_build_object('error','Esta disputa ya fue resuelta'); end if;

  select * into v_clase from public.clases_realizadas where id = v_disp.clase_realizada_id;
  if not found then return jsonb_build_object('error','La clase de la disputa no existe'); end if;

  v_min := round(coalesce(p_horas,0) * 60)::int;
  if v_min < 0 then return jsonb_build_object('error','Las horas no pueden ser negativas'); end if;
  if v_min > coalesce(v_clase.duracion_min,0) then
    return jsonb_build_object('error','No se pueden fijar más horas que las declaradas por el docente'); end if;

  update public.clases_realizadas
     set duracion_min = v_min, objetada_at = null,
         confirmado_alumno = true, confirmada_at = coalesce(confirmada_at, now())
   where id = v_clase.id;

  v_lib := public._liquidar_clase(v_clase.id);

  v_estado := case
    when v_min = coalesce(v_clase.duracion_objetada_min,-1) then 'resuelta_alumno'
    when v_min = coalesce(v_clase.duracion_min,-1)          then 'resuelta_docente'
    else 'resuelta_parcial' end;

  update public.disputas
     set estado = v_estado, horas_finales = v_min::numeric/60,
         resolucion = p_resolucion, admin_email = v_email,
         resuelto_at = now(), updated_at = now()
   where id = p_disputa_id;

  perform public.notificar(v_disp.alumno_email,  'disputa_resuelta', v_clase.publicacion_id,
                           'Resolvimos la disputa de horas de tu clase');
  perform public.notificar(v_disp.docente_email, 'disputa_resuelta', v_clase.publicacion_id,
                           'Resolvimos la disputa de horas de tu clase');

  return jsonb_build_object('ok', true, 'horas_finales', v_min::numeric/60,
                            'monto_liberado', coalesce(v_lib,0), 'estado', v_estado);
end $$;
