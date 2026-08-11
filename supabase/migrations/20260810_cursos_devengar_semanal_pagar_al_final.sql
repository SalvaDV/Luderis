-- CURSOS: SE DEVENGA POR SEMANA, SE PAGA AL FINAL.
--
-- Ajuste sobre el goteo de 20260808: la parte del docente se va GANANDO semana
-- a semana (así una baja en la semana 3 le paga lo justo), pero la plata NO se
-- acredita por semana. Se acredita toda junta cuando el curso termina — o, si
-- el alumno se baja antes, la parte ya ganada en ese momento.
--
-- Criterio de Salvador: "si no hay problemas, que cobre todo". El goteo semanal
-- era correcto para calcular cuánto le corresponde, pero acreditar de a poco
-- fragmenta la billetera y adelanta plata sobre un curso que todavía puede
-- salir mal.
--
-- Una disputa abierta sigue frenando la acreditación.
--
-- Verificado contra producción con rollback: a mitad de curso no paga nada;
-- baja en semana 2 de 4 reparte 45 al docente y 50 al alumno (45 de neto sin
-- usar + 5 de su comisión); curso terminado paga los 90 de una; correrlo dos
-- veces no duplica.

-- Fracción ganada de un curso, escalonada por semana completa (0 a 1).
create or replace function public._fraccion_devengada_curso(p_ini date, p_fin date)
returns numeric
language sql stable
as $$
  select least(
    floor(greatest(current_date - p_ini, 0) / 7.0)
    / greatest(ceil(greatest(p_fin - p_ini, 1) / 7.0), 1)
  , 1)::numeric
$$;

-- El cron diario ahora solo paga cursos TERMINADOS, completos.
drop function if exists public.gotear_cursos();

create or replace function public.liberar_cursos_terminados()
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_h record; v_ini date; v_fin date; v_delta numeric;
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
    v_ini := greatest(coalesce(v_h.fecha_inicio, v_h.compra_at::date), v_h.compra_at::date);
    v_fin := case when v_h.fecha_fin is not null and v_h.fecha_fin > v_ini
                  then v_h.fecha_fin else v_ini + 28 end;
    if public._fraccion_devengada_curso(v_ini, v_fin) < 1 then continue; end if;

    if exists (select 1 from public.disputas d
                where d.estado = 'abierta'
                  and (d.inscripcion_id = v_h.ins_id
                       or (d.alumno_email = v_h.alumno_email
                           and d.docente_email = v_h.docente_email))) then
      v_frenados := v_frenados + 1;
      continue;
    end if;

    v_delta := coalesce(v_h.monto,0) - coalesce(v_h.monto_liberado,0);
    if v_delta <= 0 then continue; end if;

    update public.billetera_movimientos
       set monto_liberado = coalesce(monto,0), estado = 'liberado', liberado_at = now()
     where id = v_h.hold_id;

    insert into public.billetera_movimientos
      (usuario_id, tipo, monto, monto_liberado, estado, descripcion,
       publicacion_id, mp_payment_id, inscripcion_id, created_at)
    values
      (v_h.docente_id, 'cobro_clase', v_delta, v_delta, 'liberado',
       'Curso «' || coalesce(v_h.titulo,'') || '» terminado — pago completo',
       v_h.publicacion_id, v_h.mp_payment_id, v_h.ins_id, now());

    perform public.incrementar_saldo(v_h.docente_id, v_delta);

    insert into public.notificaciones (usuario_id, alumno_email, tipo, publicacion_id, pub_titulo, leida)
    values (v_h.docente_id, v_h.docente_email, 'pago_liberado', v_h.publicacion_id,
            'Terminó tu curso «' || coalesce(v_h.titulo,'') || '»: liberamos el pago completo — $' ||
            trim(to_char(v_delta,'FM999999990.00')), false);

    v_n := v_n + 1;
    v_total := v_total + v_delta;
  end loop;

  return jsonb_build_object('ok', true, 'cursos_pagados', v_n,
                            'monto_total', v_total, 'frenados_por_disputa', v_frenados);
end $$;

do $$
begin
  perform cron.unschedule('gotear-cursos')
    where exists (select 1 from cron.job where jobname = 'gotear-cursos');
  perform cron.unschedule('liberar-cursos-terminados')
    where exists (select 1 from cron.job where jobname = 'liberar-cursos-terminados');
  perform cron.schedule('liberar-cursos-terminados', '15 4 * * *',
    'select public.liberar_cursos_terminados()');
end $$;

-- Baja a mitad de curso: la parte ganada va al docente EN ESE MOMENTO (la
-- relación con ese alumno terminó ahí, no hay por qué hacerlo esperar al final
-- de un curso que ya no le da), el resto vuelve al alumno con su comisión.
create or replace function public.reembolsar_inscripcion(
  p_inscripcion_id uuid, p_motivo text default null
) returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_ins public.inscripciones%rowtype; v_email text; v_rol text; v_por text;
  v_row public.billetera_movimientos%rowtype; v_hold numeric := 0; v_bruto numeric;
  v_pay text;
  v_pub record; v_es_curso boolean := false;
  v_ini date; v_fin date; v_deveng numeric; v_lib_doc numeric := 0; v_delta numeric;
begin
  select * into v_ins from public.inscripciones where id = p_inscripcion_id;
  if not found then return jsonb_build_object('error','Inscripción no encontrada'); end if;

  if v_ins.clases_totales is not null then
    return public.reembolsar_horas_no_usadas(p_inscripcion_id, p_motivo);
  end if;

  select email, rol into v_email, v_rol from public.usuarios where id = auth.uid();
  select autor_id, modo, fecha_inicio, fecha_fin, titulo into v_pub
    from public.publicaciones where id = v_ins.publicacion_id;
  if v_ins.alumno_id = auth.uid() or v_ins.alumno_email is not distinct from v_email then
    v_por := 'alumno';
  elsif v_pub.autor_id = auth.uid() then
    v_por := 'docente';
  elsif coalesce(v_rol, '') = 'admin' then
    v_por := 'admin';
  else
    return jsonb_build_object('error','No autorizado');
  end if;

  if coalesce(v_ins.estado, 'activa') = 'cancelada' then
    return jsonb_build_object('ok', true, 'ya_cancelada', true);
  end if;

  v_es_curso := coalesce(v_pub.modo,'') <> 'particular';

  select p.mp_payment_id into v_pay
    from public.pagos p
   where p.mp_payment_id = v_ins.mp_payment_id
     and p.publicacion_id = v_ins.publicacion_id
     and p.alumno_email is not distinct from v_ins.alumno_email
   limit 1;

  if v_pay is not null then
    for v_row in
      select * from public.billetera_movimientos
      where mp_payment_id = v_pay and estado = 'pendiente'
      for update
    loop
      -- En un curso, primero se le paga al docente lo ya ganado por semanas
      -- dictadas hasta la baja.
      if v_es_curso then
        v_ini := greatest(coalesce(v_pub.fecha_inicio, v_row.created_at::date), v_row.created_at::date);
        v_fin := case when v_pub.fecha_fin is not null and v_pub.fecha_fin > v_ini
                      then v_pub.fecha_fin else v_ini + 28 end;
        v_deveng := round(coalesce(v_row.monto,0) * public._fraccion_devengada_curso(v_ini, v_fin), 2);
        v_delta := v_deveng - coalesce(v_row.monto_liberado,0);
        if v_delta > 0 then
          update public.billetera_movimientos
             set monto_liberado = coalesce(monto_liberado,0) + v_delta
           where id = v_row.id;
          v_row.monto_liberado := coalesce(v_row.monto_liberado,0) + v_delta;

          insert into public.billetera_movimientos
            (usuario_id, tipo, monto, monto_liberado, estado, descripcion,
             publicacion_id, mp_payment_id, inscripcion_id, created_at)
          values
            (v_row.usuario_id, 'cobro_clase', v_delta, v_delta, 'liberado',
             'Curso «' || coalesce(v_pub.titulo,'') || '» — parte dictada hasta la baja del alumno',
             v_row.publicacion_id, v_pay, p_inscripcion_id, now());

          perform public.incrementar_saldo(v_row.usuario_id, v_delta);
          v_lib_doc := v_lib_doc + v_delta;

          insert into public.notificaciones (usuario_id, alumno_email, tipo, publicacion_id, pub_titulo, leida)
          select u.id, u.email, 'pago_liberado', v_row.publicacion_id,
                 'Un alumno se dio de baja de «' || coalesce(v_pub.titulo,'') ||
                 '»: te acreditamos la parte dictada — $' || trim(to_char(v_delta,'FM999999990.00')), false
            from public.usuarios u where u.id = v_row.usuario_id;
        end if;
      end if;

      v_bruto := public._bruto_no_usado(v_row.monto, v_row.monto_liberado, v_row.comision_luderis);
      update public.billetera_movimientos set estado = 'reembolsado' where id = v_row.id;
      if v_bruto > 0 then v_hold := v_hold + v_bruto; end if;
    end loop;
  end if;

  if coalesce(v_ins.pagado_mp, false) and v_hold = 0 and v_lib_doc = 0 then
    return jsonb_build_object('error','El pago ya fue liberado al docente; no es reembolsable');
  end if;

  if v_hold > 0 and v_ins.alumno_id is not null then
    perform public.incrementar_saldo(v_ins.alumno_id, v_hold);
    insert into public.billetera_movimientos(usuario_id, tipo, monto, estado, descripcion, publicacion_id, mp_payment_id)
      values (v_ins.alumno_id, 'reembolso', v_hold, 'liberado',
              coalesce(p_motivo, 'Reembolso de inscripción'), v_ins.publicacion_id, v_pay);
  end if;

  update public.inscripciones
    set estado = 'cancelada', motivo_cancelacion = p_motivo, cancelado_por = v_por
    where id = p_inscripcion_id;

  return jsonb_build_object('ok', true, 'monto_reembolsado', v_hold,
                            'acreditado_al_docente', v_lib_doc, 'cancelado_por', v_por);
end $$;
