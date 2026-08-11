-- CURSOS Y GRUPALES: EL PAGO SE LIBERA POR GOTEO SEMANAL.
--
-- Regla de producto (Salvador, 2026-08-08): las particulares son 1 a 1 y la
-- asistencia define el cobro; los cursos son 1 a muchos y se cobran si la
-- clase se dio y el material se entregó, SIN importar si cada alumno asistió.
-- El que no quiere seguir, pide reembolso.
--
-- Cómo se traduce acá:
--   • La plata retenida de un curso se libera al docente semana a semana,
--     repartida sobre la duración del curso (fecha_inicio → fecha_fin; si no
--     hay fechas cargadas, 4 semanas desde la compra).
--   • El reembolso del alumno es el remanente aún no liberado (con su parte
--     proporcional de la comisión — reembolsar_inscripcion ya lo hace así).
--   • Una disputa abierta frena el goteo de ese alumno, igual que en todo lo
--     demás.
--   • Los cursos quedan AFUERA del flujo de declarar horas: eso, con la regla
--     de presencia, congelaba el pago por cada ausente silencioso — un absurdo
--     para un producto donde faltar es problema del que falta.
--
-- Esto además repone el reloj automático que los cursos perdieron cuando se
-- unificó todo al de 72 hs: desde entonces solo cobraban si el alumno tocaba
-- "confirmar recepción". Si nadie tocaba, el docente no cobraba nunca.
--
-- El calendario manda: marcar el curso como "finalizado" antes de tiempo NO
-- adelanta el goteo (sería un botón de "pagame todo ya").

create or replace function public.gotear_cursos()
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_h record;
  v_ini date; v_fin date; v_sem_tot int; v_sem_ok int;
  v_objetivo numeric; v_delta numeric;
  v_n int := 0; v_total numeric := 0; v_frenados int := 0;
begin
  for v_h in
    select bm.id as hold_id, bm.monto, bm.monto_liberado, bm.usuario_id as docente_id,
           bm.publicacion_id, bm.mp_payment_id, bm.created_at as compra_at,
           i.id as ins_id, i.alumno_email,
           p.fecha_inicio, p.fecha_fin, p.titulo,
           ud.email as docente_email
      from public.billetera_movimientos bm
      join public.inscripciones i on i.id = bm.inscripcion_id
      join public.publicaciones p on p.id = bm.publicacion_id
      join public.usuarios ud on ud.id = bm.usuario_id
     where bm.estado = 'pendiente' and bm.tipo = 'cobro_clase'
       and coalesce(i.estado,'activa') = 'activa'
       and i.clases_totales is null
       and coalesce(p.modo,'') <> 'particular'
     for update of bm
  loop
    -- Una disputa abierta de ese alumno con ese docente frena su goteo.
    if exists (select 1 from public.disputas d
                where d.estado = 'abierta'
                  and (d.inscripcion_id = v_h.ins_id
                       or (d.alumno_email = v_h.alumno_email
                           and d.docente_email = v_h.docente_email))) then
      v_frenados := v_frenados + 1;
      continue;
    end if;

    v_ini := greatest(coalesce(v_h.fecha_inicio, v_h.compra_at::date), v_h.compra_at::date);
    v_fin := case when v_h.fecha_fin is not null and v_h.fecha_fin > v_ini
                  then v_h.fecha_fin else v_ini + 28 end;
    v_sem_tot := greatest(ceil((v_fin - v_ini) / 7.0)::int, 1);
    v_sem_ok  := least(floor((current_date - v_ini) / 7.0)::int, v_sem_tot);
    if v_sem_ok <= 0 then continue; end if;

    -- Multiplicar antes de dividir y redondear a centavos; la última semana
    -- libera el resto exacto.
    v_objetivo := round(coalesce(v_h.monto,0) * v_sem_ok / v_sem_tot, 2);
    if v_sem_ok >= v_sem_tot then v_objetivo := coalesce(v_h.monto,0); end if;
    v_delta := v_objetivo - coalesce(v_h.monto_liberado,0);
    if v_delta <= 0 then continue; end if;

    update public.billetera_movimientos
       set monto_liberado = coalesce(monto_liberado,0) + v_delta,
           estado = case when coalesce(monto_liberado,0) + v_delta >= coalesce(monto,0)
                         then 'liberado' else 'pendiente' end,
           liberado_at = case when coalesce(monto_liberado,0) + v_delta >= coalesce(monto,0)
                              then now() else liberado_at end
     where id = v_h.hold_id;

    insert into public.billetera_movimientos
      (usuario_id, tipo, monto, monto_liberado, estado, descripcion,
       publicacion_id, mp_payment_id, inscripcion_id, created_at)
    values
      (v_h.docente_id, 'cobro_clase', v_delta, v_delta, 'liberado',
       'Curso «' || coalesce(v_h.titulo,'') || '» — semana ' || v_sem_ok || ' de ' || v_sem_tot,
       v_h.publicacion_id, v_h.mp_payment_id, v_h.ins_id, now());

    perform public.incrementar_saldo(v_h.docente_id, v_delta);

    -- Aviso al docente. INSERT directo: notificar() exige un usuario logueado
    -- y acá no hay ninguno (corre por cron).
    insert into public.notificaciones (usuario_id, alumno_email, tipo, publicacion_id, pub_titulo, leida)
    values (v_h.docente_id, v_h.docente_email, 'pago_liberado', v_h.publicacion_id,
            'Se liberó $' || trim(to_char(v_delta,'FM999999990.00')) || ' de tu curso «' ||
            coalesce(v_h.titulo,'') || '» (semana ' || v_sem_ok || ' de ' || v_sem_tot || ')', false);

    v_n := v_n + 1;
    v_total := v_total + v_delta;
  end loop;

  return jsonb_build_object('ok', true, 'liberaciones', v_n,
                            'monto_total', v_total, 'frenados_por_disputa', v_frenados);
end $$;

-- Cron diario, después del reloj de clases (4:00) y antes del vencimiento (4:30).
do $$
begin
  perform cron.unschedule('gotear-cursos')
    where exists (select 1 from cron.job where jobname = 'gotear-cursos');
  perform cron.schedule('gotear-cursos', '15 4 * * *', 'select public.gotear_cursos()');
end $$;

-- Los cursos no declaran horas: única modificación a registrar_clase_dictada
-- es el guard de modo al principio.
create or replace function public.registrar_clase_dictada(
  p_pub_id uuid, p_fecha date, p_horas numeric default 1, p_evidencia_url text default null)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_uid uuid := auth.uid(); v_email text := auth.email(); v_pub public.publicaciones%rowtype;
  v_min int;
  v_ins public.inscripciones%rowtype;
  v_cap int; v_disp int; v_n int := 0; v_sin_u int := 0; v_max_disp int := 0;
  v_evid text := nullif(trim(coalesce(p_evidencia_url,'')),'');
  v_pres int;
begin
  if v_uid is null then return jsonb_build_object('error','No autorizado'); end if;
  select * into v_pub from public.publicaciones where id = p_pub_id;
  if not found then return jsonb_build_object('error','Publicación no encontrada'); end if;
  if v_pub.autor_id is distinct from v_uid then
    return jsonb_build_object('error','Solo el docente puede registrar la clase'); end if;
  if coalesce(v_pub.modo,'') is distinct from 'particular' then
    return jsonb_build_object('error','Los cursos y clases grupales no declaran horas: el pago se libera semana a semana de forma automática.');
  end if;
  if p_fecha > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    return jsonb_build_object('error','Esa clase todavía no ocurrió'); end if;

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
    v_cap := public._capacidad_min(v_ins);
    if v_cap > 0 then
      v_disp := v_cap - coalesce(v_ins.minutos_consumidos,0)
                      - public._minutos_comprometidos(p_pub_id, v_ins.alumno_email);
      v_max_disp := greatest(v_max_disp, v_disp);
      if v_disp < v_min then v_sin_u := v_sin_u + 1; continue; end if;
    end if;

    v_pres := case
      when public.hubo_presencia(p_pub_id, v_email, v_ins.alumno_email, p_fecha)
        then public.minutos_presencia_compartida(p_pub_id, v_email, v_ins.alumno_email, p_fecha)
      else null end;

    insert into public.clases_realizadas
      (publicacion_id, docente_email, alumno_email, fecha_clase, duracion_min,
       confirmado_docente, confirmado_alumno, evidencia_url, evidencia_expira_at,
       minutos_presencia)
    values
      (p_pub_id, v_email, v_ins.alumno_email, p_fecha, v_min, true, false,
       v_evid, case when v_evid is not null then now() + interval '72 hours' end,
       v_pres);
    v_n := v_n + 1;
    perform public.notificar(v_ins.alumno_email, 'confirmar_clase', p_pub_id, v_pub.titulo);
  end loop;

  if v_n = 0 and v_sin_u > 0 then
    return jsonb_build_object(
      'error', case when v_max_disp <= 0
                    then 'No quedan horas compradas sin registrar. El alumno tiene que sumar más horas.'
                    else 'Solo quedan ' || trim(to_char(v_max_disp/60.0,'FM999990.00')) ||
                         ' h sin registrar. Cargá esa cantidad o menos.' end,
      'horas_disponibles', round(v_max_disp/60.0, 2));
  end if;

  return jsonb_build_object('ok', true, 'registradas', v_n, 'sin_horas', v_sin_u,
                            'duracion_min', v_min,
                            'horas_disponibles', round(greatest(v_max_disp - v_min,0)/60.0, 2));
end $$;
