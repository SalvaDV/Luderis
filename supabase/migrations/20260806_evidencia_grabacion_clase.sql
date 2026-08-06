-- ═══════════════════════════════════════════════════════════════════════════
-- EVIDENCIA DE LA CLASE (grabación) CON VIDA DE 72 HORAS
--
-- El docente adjunta el link de la grabación al registrar la clase. Queda
-- visible para el alumno (junto a la clase a aprobar) y para el admin (en el
-- ticket de disputa). Se borra automáticamente:
--   · al liquidarse la clase (aprobación, aceptación u orden del admin), o
--   · a las 72 hs, salvo que haya una disputa abierta sobre esa clase — en ese
--     caso se conserva hasta que el admin resuelva, porque es justamente la
--     prueba que necesita mirar.
--
-- Nota de producto: meet.jit.si (gratuito) no graba del lado del servidor, así
-- que la grabación la aporta el docente (grabación local de Jitsi/OBS subida a
-- su Drive o similar). Hosting propio de video queda para una fase con storage
-- pago.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.clases_realizadas
  ADD COLUMN IF NOT EXISTS evidencia_url       text,
  ADD COLUMN IF NOT EXISTS evidencia_expira_at timestamptz;

-- ── Registrar con evidencia opcional ────────────────────────────────────────
-- Cambia la firma: se dropea la de 3 args para que PostgREST no tenga dos
-- candidatas ambiguas. La llamada vieja (3 args nombrados) matchea la nueva por
-- el default.
DROP FUNCTION IF EXISTS public.registrar_clase_dictada(uuid, date, numeric);

CREATE OR REPLACE FUNCTION public.registrar_clase_dictada(
  p_pub_id uuid, p_fecha date, p_horas numeric DEFAULT 1, p_evidencia_url text DEFAULT null
)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare
  v_uid uuid := auth.uid(); v_email text := auth.email(); v_pub public.publicaciones%rowtype;
  v_min int;
  v_ins public.inscripciones%rowtype;
  v_cap int; v_disp int; v_n int := 0; v_dup int := 0; v_sin_u int := 0;
  v_evid text := nullif(trim(coalesce(p_evidencia_url,'')),'');
begin
  if v_uid is null then return jsonb_build_object('error','No autorizado'); end if;
  select * into v_pub from public.publicaciones where id = p_pub_id;
  if not found then return jsonb_build_object('error','Publicación no encontrada'); end if;
  if v_pub.autor_id is distinct from v_uid then
    return jsonb_build_object('error','Solo el docente puede registrar la clase'); end if;
  if p_fecha > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    return jsonb_build_object('error','Esa clase todavía no ocurrió'); end if;

  -- Solo links http(s): nada de javascript: ni data:.
  if v_evid is not null and v_evid !~* '^https?://' then
    return jsonb_build_object('error','El link de la grabación tiene que empezar con http(s)://');
  end if;

  v_min := round(coalesce(p_horas,1) * 60)::int;
  if v_min <= 0 then return jsonb_build_object('error','Las horas tienen que ser mayores a cero'); end if;
  if v_min > 24*60 then return jsonb_build_object('error','Una clase no puede durar más de 24 horas'); end if;

  for v_ins in
    select i.* from public.inscripciones i
     where i.publicacion_id = p_pub_id and coalesce(i.estado,'activa') = 'activa'
       and i.alumno_email is not null
  loop
    if exists (select 1 from public.clases_realizadas cr
                where cr.publicacion_id = p_pub_id and cr.alumno_email = v_ins.alumno_email
                  and cr.fecha_clase::date = p_fecha) then
      v_dup := v_dup + 1; continue; end if;

    v_cap := public._capacidad_min(v_ins);
    if v_cap > 0 then
      v_disp := v_cap - coalesce(v_ins.minutos_consumidos,0)
                      - public._minutos_comprometidos(p_pub_id, v_ins.alumno_email);
      if v_disp < v_min then v_sin_u := v_sin_u + 1; continue; end if;
    end if;

    insert into public.clases_realizadas
      (publicacion_id, docente_email, alumno_email, fecha_clase, duracion_min,
       confirmado_docente, confirmado_alumno, evidencia_url, evidencia_expira_at)
    values
      (p_pub_id, v_email, v_ins.alumno_email, p_fecha, v_min, true, false,
       v_evid, case when v_evid is not null then now() + interval '72 hours' end);
    v_n := v_n + 1;
    perform public.notificar(v_ins.alumno_email, 'confirmar_clase', p_pub_id, v_pub.titulo);
  end loop;

  if v_n = 0 and v_sin_u > 0 and v_dup = 0 then
    return jsonb_build_object('error','No quedan horas compradas suficientes. El alumno tiene que sumar más horas.'); end if;
  return jsonb_build_object('ok', true, 'registradas', v_n, 'ya_estaban', v_dup, 'sin_horas', v_sin_u, 'duracion_min', v_min);
end $$;

-- ── La liquidación borra la evidencia ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public._liquidar_clase(p_clase_id uuid)
 RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare
  v_clase public.clases_realizadas%rowtype;
  v_ins   public.inscripciones%rowtype;
  v_cap   int;
  v_monto numeric := 0;
  v_lib   numeric := 0;
begin
  select * into v_clase from public.clases_realizadas where id = p_clase_id;
  if not found then return 0; end if;
  if v_clase.objetada_at is not null then return 0; end if;

  -- Horas acordadas → la grabación ya cumplió su función.
  update public.clases_realizadas
     set evidencia_url = null, evidencia_expira_at = null
   where id = p_clase_id and evidencia_url is not null;

  select * into v_ins from public.inscripciones
   where publicacion_id = v_clase.publicacion_id
     and alumno_email   = v_clase.alumno_email
     and coalesce(estado,'activa') = 'activa'
   order by created_at limit 1;
  if not found then return 0; end if;
  if v_ins.clases_totales is null and v_ins.minutos_totales is null then return 0; end if;

  v_cap := public._capacidad_min(v_ins);
  if v_cap <= 0 then return 0; end if;

  update public.inscripciones
     set minutos_consumidos = least(coalesce(minutos_consumidos,0) + coalesce(v_clase.duracion_min,0), v_cap),
         clases_restantes   = greatest(
           ceil((v_cap - least(coalesce(minutos_consumidos,0) + coalesce(v_clase.duracion_min,0), v_cap))::numeric / 60)::int, 0)
   where id = v_ins.id;

  select coalesce(bm.monto,0) * (coalesce(v_clase.duracion_min,0)::numeric / v_cap) into v_monto
    from public.billetera_movimientos bm
   where bm.mp_payment_id = v_ins.mp_payment_id and bm.estado = 'pendiente'
   order by bm.created_at limit 1;
  if coalesce(v_monto,0) <= 0 then return 0; end if;

  v_lib := public._liberar_hold_parcial(v_ins.mp_payment_id, v_monto, p_clase_id);
  return coalesce(v_lib,0);
end $$;

-- ── El cron también limpia evidencias vencidas ─────────────────────────────
-- (se conservan mientras haya una disputa abierta sobre esa clase)
CREATE OR REPLACE FUNCTION public.auto_liberar_inscripciones_vencidas()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare v_ins record; v_cl record; v_n int := 0; v_monto numeric := 0; v_lib numeric; v_evid int;
begin
  for v_ins in
    select i.* from public.inscripciones i
    where i.clase_finalizada = true and coalesce(i.alumno_confirmada,false) = false
      and coalesce(i.estado,'activa') = 'activa' and i.clases_totales is null
      and i.fecha_finalizacion is not null and i.fecha_finalizacion < now() - interval '7 days'
      and exists (select 1 from public.billetera_movimientos bm
                   where bm.mp_payment_id = i.mp_payment_id and bm.estado = 'pendiente')
  loop
    v_lib := public._liberar_hold_pago(v_ins.mp_payment_id);
    if v_lib > 0 then v_n := v_n + 1; v_monto := v_monto + v_lib; end if;
  end loop;

  for v_cl in
    select cr.id as clase_id from public.clases_realizadas cr
     where cr.confirmado_docente = true and coalesce(cr.confirmado_alumno,false) = false
       and cr.objetada_at is null
       and cr.created_at < now() - interval '72 hours'
       and not exists (select 1 from public.billetera_movimientos bm
                        where bm.clase_realizada_id = cr.id and bm.tipo = 'cobro_clase')
  loop
    update public.clases_realizadas
       set confirmado_alumno = true, confirmada_at = coalesce(confirmada_at, now())
     where id = v_cl.clase_id;
    v_lib := public._liquidar_clase(v_cl.clase_id);
    if v_lib > 0 then v_n := v_n + 1; v_monto := v_monto + v_lib; end if;
  end loop;

  -- Evidencias vencidas (>72 hs) sin disputa abierta.
  update public.clases_realizadas cr
     set evidencia_url = null, evidencia_expira_at = null
   where cr.evidencia_url is not null
     and cr.evidencia_expira_at < now()
     and not exists (select 1 from public.disputas d
                      where d.clase_realizada_id = cr.id and d.estado = 'abierta');
  get diagnostics v_evid = row_count;

  return jsonb_build_object('ok', true, 'inscripciones_liberadas', v_n,
                            'monto_total', v_monto, 'evidencias_borradas', v_evid);
end $$;
