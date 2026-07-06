-- ═══════════════════════════════════════════════════════════════════════════
-- UNIFICACIÓN DE ESCROW (ledger interno billetera_movimientos)
-- Antes: cursos/clases sueltas se acreditaban AL INSTANTE al docente; los
-- paquetes se retenían. Inconsistente y rompía reembolsos limpios.
-- Ahora (modelo que la UI del alumno ya prometía — "confirmá para liberar el
-- pago o se acredita automático en 7 días"):
--   • cursos/clases sueltas se RETIENEN (billetera_movimientos.estado='pendiente')
--   • se LIBERAN al docente cuando el alumno confirma la recepción, o auto a
--     los 7 días de finalizada la clase si el alumno no confirma
--   • mientras siga retenido, alumno/docente pueden REEMBOLSAR al saldo del alumno
-- Aplica SOLO a no-paquetes (clases_totales IS NULL). Los paquetes conservan su
-- flujo por-clase (confirmar_clase → liberar_pago_clase), intacto.
-- Solo dinero RETENIDO es reembolsable: nunca se hace clawback de lo ya liberado.
-- ═══════════════════════════════════════════════════════════════════════════

-- El CHECK de estado no contemplaba reembolsos; se agrega el nuevo estado.
alter table public.billetera_movimientos drop constraint if exists billetera_movimientos_estado_check;
alter table public.billetera_movimientos add constraint billetera_movimientos_estado_check
  check (estado = any (array['pendiente'::text,'liberado'::text,'reembolsado'::text]));

-- ── Helper interno: libera al docente los holds 'pendiente' de un pago ────────
-- Idempotente: si ya están liberados, matchea 0 filas y devuelve 0 (sin doble
-- crédito). Devuelve el total neto liberado.
create or replace function public._liberar_hold_pago(p_mp_payment_id text)
returns numeric language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare v_total numeric := 0; v_row billetera_movimientos%rowtype;
begin
  if p_mp_payment_id is null then return 0; end if;
  for v_row in
    select * from billetera_movimientos
    where mp_payment_id = p_mp_payment_id and estado = 'pendiente'
    for update
  loop
    update billetera_movimientos set estado = 'liberado' where id = v_row.id;
    perform public.incrementar_saldo(v_row.usuario_id, v_row.monto);
    v_total := v_total + coalesce(v_row.monto, 0);
  end loop;
  return v_total;
end $$;

-- ── A. El alumno confirma la recepción → libera el pago retenido al docente ───
create or replace function public.confirmar_recepcion_inscripcion(p_inscripcion_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare v_ins public.inscripciones%rowtype; v_email text; v_liberado numeric := 0;
begin
  select * into v_ins from public.inscripciones where id = p_inscripcion_id;
  if not found then return jsonb_build_object('error','Inscripción no encontrada'); end if;

  -- Autorización: solo el alumno de la inscripción
  select email into v_email from public.usuarios where id = auth.uid();
  if v_ins.alumno_id is distinct from auth.uid()
     and (v_email is null or v_ins.alumno_email is distinct from v_email) then
    return jsonb_build_object('error','No autorizado');
  end if;

  if not coalesce(v_ins.clase_finalizada, false) then
    return jsonb_build_object('error','La clase todavía no fue finalizada por el docente');
  end if;
  if coalesce(v_ins.alumno_confirmada, false) then
    return jsonb_build_object('ok', true, 'ya_confirmada', true); -- idempotente
  end if;

  update public.inscripciones
    set alumno_confirmada = true, alumno_confirmada_at = now()
    where id = p_inscripcion_id;

  -- Liberar hold al docente (solo no-paquete; los paquetes se liberan por clase)
  if v_ins.clases_totales is null then
    v_liberado := public._liberar_hold_pago(v_ins.mp_payment_id);
  end if;

  return jsonb_build_object('ok', true, 'monto_liberado', coalesce(v_liberado, 0));
end $$;

-- ── B. Auto-liberación a los 7 días si el alumno no confirmó (cron) ───────────
create or replace function public.auto_liberar_inscripciones_vencidas()
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare v_ins record; v_n int := 0; v_monto numeric := 0; v_lib numeric;
begin
  for v_ins in
    select i.* from public.inscripciones i
    where i.clase_finalizada = true
      and coalesce(i.alumno_confirmada, false) = false
      and coalesce(i.estado, 'activa') = 'activa'
      and i.clases_totales is null
      and i.fecha_finalizacion is not null
      and i.fecha_finalizacion < now() - interval '7 days'
      and exists (
        select 1 from public.billetera_movimientos bm
        where bm.mp_payment_id = i.mp_payment_id and bm.estado = 'pendiente'
      )
  loop
    v_lib := public._liberar_hold_pago(v_ins.mp_payment_id);
    if v_lib > 0 then v_n := v_n + 1; v_monto := v_monto + v_lib; end if;
  end loop;
  return jsonb_build_object('ok', true, 'inscripciones_liberadas', v_n, 'monto_total', v_monto);
end $$;

-- ── C. Reembolso al saldo del alumno (desinscripción o cancelación) ───────────
-- Reembolsa el BRUTO (neto retenido + comisión) de lo que siga 'pendiente'.
create or replace function public.reembolsar_inscripcion(p_inscripcion_id uuid, p_motivo text default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_ins public.inscripciones%rowtype; v_email text; v_rol text; v_por text;
  v_autor uuid; v_row public.billetera_movimientos%rowtype; v_hold numeric := 0; v_bruto numeric;
begin
  select * into v_ins from public.inscripciones where id = p_inscripcion_id;
  if not found then return jsonb_build_object('error','Inscripción no encontrada'); end if;

  -- Los paquetes se gestionan por clase, no por este camino
  if v_ins.clases_totales is not null then
    return jsonb_build_object('error','Los paquetes de clases se gestionan por clase');
  end if;

  -- Autorización: alumno (self), docente (autor de la pub) o admin
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
    return jsonb_build_object('ok', true, 'ya_cancelada', true); -- idempotente
  end if;

  -- Marcar como reembolsados los holds pendientes y sumar el bruto a devolver
  for v_row in
    select * from public.billetera_movimientos
    where mp_payment_id = v_ins.mp_payment_id and estado = 'pendiente'
    for update
  loop
    v_bruto := coalesce(v_row.monto, 0) + coalesce(v_row.comision_luderis, 0);
    update public.billetera_movimientos set estado = 'reembolsado' where id = v_row.id;
    v_hold := v_hold + v_bruto;
  end loop;

  -- Si estaba pago pero ya no hay nada retenido, el pago fue liberado al docente:
  -- NO se puede reembolsar sin clawback → error explícito (no cancelar en silencio).
  if coalesce(v_ins.pagado_mp, false) and v_hold = 0 then
    return jsonb_build_object('error','El pago ya fue liberado al docente; no es reembolsable');
  end if;

  if v_hold > 0 and v_ins.alumno_id is not null then
    perform public.incrementar_saldo(v_ins.alumno_id, v_hold);
    insert into public.billetera_movimientos(usuario_id, tipo, monto, estado, descripcion, publicacion_id, mp_payment_id)
      values (v_ins.alumno_id, 'reembolso', v_hold, 'liberado',
              coalesce(p_motivo, 'Reembolso de inscripción'), v_ins.publicacion_id, v_ins.mp_payment_id);
  end if;

  update public.inscripciones
    set estado = 'cancelada', motivo_cancelacion = p_motivo, cancelado_por = v_por
    where id = p_inscripcion_id;

  return jsonb_build_object('ok', true, 'monto_reembolsado', v_hold, 'cancelado_por', v_por);
end $$;

-- ── D. Cancelación del docente: reembolsa a TODOS los inscriptos ──────────────
create or replace function public.cancelar_publicacion_con_reembolso(p_pub_id uuid, p_motivo text default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare v_autor uuid; v_rol text; v_ins record; v_n int := 0; v_total numeric := 0; v_res jsonb;
begin
  select autor_id into v_autor from public.publicaciones where id = p_pub_id;
  if not found then return jsonb_build_object('error','Publicación no encontrada'); end if;
  select rol into v_rol from public.usuarios where id = auth.uid();
  if v_autor is distinct from auth.uid() and coalesce(v_rol, '') <> 'admin' then
    return jsonb_build_object('error','No autorizado');
  end if;

  for v_ins in
    select id from public.inscripciones
    where publicacion_id = p_pub_id and coalesce(estado, 'activa') = 'activa' and clases_totales is null
  loop
    v_res := public.reembolsar_inscripcion(v_ins.id, coalesce(p_motivo, 'Curso cancelado por el docente'));
    if (v_res->>'ok') = 'true' then
      v_n := v_n + 1;
      v_total := v_total + coalesce((v_res->>'monto_reembolsado')::numeric, 0);
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'reembolsadas', v_n, 'monto_total', v_total);
end $$;

-- ── Grants: helpers/cron cerrados; RPCs de usuario abiertos a authenticated ───
revoke execute on function public._liberar_hold_pago(text) from public, anon, authenticated;
revoke execute on function public.auto_liberar_inscripciones_vencidas() from public, anon, authenticated;
grant execute on function public.confirmar_recepcion_inscripcion(uuid) to authenticated;
grant execute on function public.reembolsar_inscripcion(uuid, text) to authenticated;
grant execute on function public.cancelar_publicacion_con_reembolso(uuid, text) to authenticated;

-- ── Cron: auto-liberación diaria (ventana de 7 días, no hace falta más fino) ──
select cron.schedule('auto-liberar-escrow', '0 4 * * *',
  $$select public.auto_liberar_inscripciones_vencidas()$$);
