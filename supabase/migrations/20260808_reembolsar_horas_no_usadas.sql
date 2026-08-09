-- Los paquetes de horas —el producto principal— no tenían reembolso:
-- reembolsar_inscripcion cortaba con "Los paquetes de clases se gestionan por
-- clase". Un alumno cuyo docente desaparecía quedaba atrapado 30 días hasta que
-- expirar_horas_vencidas le devolvía CRÉDITO, no dinero.
--
-- Esta RPC hace a pedido lo mismo que ya hacía la expiración: devuelve la parte
-- no consumida del hold. No inventa un camino nuevo para la plata.
create or replace function public.reembolsar_horas_no_usadas(
  p_inscripcion_id uuid, p_motivo text default null
) returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_ins public.inscripciones%rowtype;
  v_email text := (select auth.email()); v_uid uuid := (select auth.uid());
  v_rol text; v_autor uuid; v_por text;
  v_h record; v_dev numeric; v_total numeric := 0; v_min_no int; v_comp int;
begin
  select * into v_ins from public.inscripciones where id = p_inscripcion_id;
  if not found then return jsonb_build_object('error','Inscripción no encontrada'); end if;

  select rol into v_rol from public.usuarios where id = v_uid;
  select autor_id into v_autor from public.publicaciones where id = v_ins.publicacion_id;
  if v_ins.alumno_id = v_uid or v_ins.alumno_email is not distinct from v_email then v_por := 'alumno';
  elsif v_autor = v_uid then v_por := 'docente';
  elsif coalesce(v_rol,'') = 'admin' then v_por := 'admin';
  else return jsonb_build_object('error','No autorizado'); end if;

  -- Si hay horas declaradas esperando aprobación, primero se resuelven: si no,
  -- el alumno podría reembolsar justo antes de confirmar y dejar al docente sin
  -- cobrar una clase que ya dio.
  v_comp := public._minutos_comprometidos(v_ins.publicacion_id, v_ins.alumno_email);
  if v_comp > 0 then
    return jsonb_build_object('error',
      'Hay ' || trim(to_char(v_comp/60.0,'FM999990.00')) ||
      ' h declaradas esperando confirmación. Resolvelas antes de pedir el reembolso.');
  end if;

  for v_h in
    select bm.id as bm_id, bm.monto, bm.monto_liberado, bm.minutos
      from public.billetera_movimientos bm
     where bm.inscripcion_id = p_inscripcion_id and bm.estado = 'pendiente'
       and bm.tipo = 'cobro_clase'
     for update
  loop
    v_dev := coalesce(v_h.monto,0) - coalesce(v_h.monto_liberado,0);
    if v_dev <= 0 then continue; end if;

    v_min_no := floor(coalesce(v_h.minutos,0) * (v_dev / nullif(coalesce(v_h.monto,0),0)))::int;

    update public.billetera_movimientos
       set estado = 'reembolsado', liberado_at = now(),
           descripcion = coalesce(descripcion,'') || ' · reembolsado sin usar'
     where id = v_h.bm_id;

    insert into public.billetera_movimientos
      (usuario_id, tipo, monto, monto_liberado, estado, descripcion,
       publicacion_id, inscripcion_id)
    values
      (v_ins.alumno_id, 'reembolso', v_dev, v_dev, 'liberado',
       coalesce(p_motivo, 'Horas no usadas — crédito a tu saldo de Luderis'),
       v_ins.publicacion_id, p_inscripcion_id);

    perform public.incrementar_saldo(v_ins.alumno_id, v_dev);

    if v_min_no > 0 then
      update public.inscripciones
         set minutos_totales = greatest(coalesce(minutos_totales,0) - v_min_no,
                                        coalesce(minutos_consumidos,0)),
             clases_restantes = greatest(
               ceil((greatest(coalesce(minutos_totales,0) - v_min_no, coalesce(minutos_consumidos,0))
                     - coalesce(minutos_consumidos,0))::numeric / 60)::int, 0)
       where id = p_inscripcion_id;
    end if;

    v_total := v_total + v_dev;
  end loop;

  if v_total = 0 then
    return jsonb_build_object('error','No quedan horas sin usar para reembolsar');
  end if;

  -- Sin minutos disponibles, la inscripción se cierra.
  update public.inscripciones
     set estado = 'cancelada', motivo_cancelacion = p_motivo, cancelado_por = v_por
   where id = p_inscripcion_id
     and coalesce(minutos_totales,0) - coalesce(minutos_consumidos,0) <= 0;

  return jsonb_build_object('ok', true, 'monto_reembolsado', v_total, 'reembolsado_por', v_por);
end $$;

revoke all on function public.reembolsar_horas_no_usadas(uuid, text) from public, anon;
grant execute on function public.reembolsar_horas_no_usadas(uuid, text) to authenticated;

-- Que el camino viejo no sea un callejón sin salida: si es un paquete, delega.
-- Así la UI de desinscripción que ya existía pasa a funcionar para horas sin
-- tocar el frontend.
create or replace function public.reembolsar_inscripcion(
  p_inscripcion_id uuid, p_motivo text default null
) returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_ins public.inscripciones%rowtype; v_email text; v_rol text; v_por text;
  v_autor uuid; v_row public.billetera_movimientos%rowtype; v_hold numeric := 0; v_bruto numeric;
  v_pay text;
begin
  select * into v_ins from public.inscripciones where id = p_inscripcion_id;
  if not found then return jsonb_build_object('error','Inscripción no encontrada'); end if;

  if v_ins.clases_totales is not null then
    return public.reembolsar_horas_no_usadas(p_inscripcion_id, p_motivo);
  end if;

  select email, rol into v_email, v_rol from public.usuarios where id = auth.uid();
  select autor_id into v_autor from public.publicaciones where id = v_ins.publicacion_id;
  if v_ins.alumno_id = auth.uid() or v_ins.alumno_email is not distinct from v_email then
    v_por := 'alumno';
  elsif v_autor = auth.uid() then
    v_por := 'docente';
  elsif coalesce(v_rol, '') = 'admin' then
    v_por := 'admin';
  else
    return jsonb_build_object('error','No autorizado');
  end if;

  if coalesce(v_ins.estado, 'activa') = 'cancelada' then
    return jsonb_build_object('ok', true, 'ya_cancelada', true);
  end if;

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
      v_bruto := coalesce(v_row.monto, 0) + coalesce(v_row.comision_luderis, 0);
      update public.billetera_movimientos set estado = 'reembolsado' where id = v_row.id;
      v_hold := v_hold + v_bruto;
    end loop;
  end if;

  if coalesce(v_ins.pagado_mp, false) and v_hold = 0 then
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

  return jsonb_build_object('ok', true, 'monto_reembolsado', v_hold, 'cancelado_por', v_por);
end $$;
