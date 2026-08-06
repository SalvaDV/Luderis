-- ═══════════════════════════════════════════════════════════════════════════
-- liberar_pago_clase: race condition + prorrateo roto (auditoría 2026-08-04)
--
-- La versión anterior (que vivía solo en la DB, sin migración) tenía tres bugs:
--
--  1) RACE: leía el hold con `select ... where estado='pendiente' limit 1` SIN
--     `for update`, acreditaba el saldo, y recién AL FINAL marcaba la fila como
--     liberada. Dos llamadas en paralelo leían la misma fila y ambas acreditaban
--     → cada corrida concurrente duplicaba el pago. (`_liberar_hold_pago`, del
--     escrow unificado, sí usa `for update`; este camino quedó sin migrar.)
--
--  2) PRORRATEO: `select i.clases_totales into v_mov.monto` pisaba el MONTO del
--     movimiento con la CANTIDAD de clases, y después se usaba esa variable como
--     importe en varias ramas.
--
--  3) CONSUMO TOTAL: liberaba una cuota pero marcaba el hold ENTERO como
--     'liberado', así que a partir de la segunda clase del paquete no quedaba
--     nada 'pendiente' y el resto del dinero quedaba varado.
--
-- Se agrega `monto_liberado` para poder consumir el hold de a cuotas, y
-- `liberado_at` para que la liquidación fiscal pueda filtrar por período.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.billetera_movimientos
  add column if not exists monto_liberado numeric not null default 0,
  add column if not exists liberado_at    timestamptz;

comment on column public.billetera_movimientos.monto_liberado is
  'Cuánto del hold ya se liberó (paquetes: se libera de a una clase).';
comment on column public.billetera_movimientos.liberado_at is
  'Cuándo pasó a liberado. Fuente de verdad del período en generar-liquidacion.';

-- ── _liberar_hold_pago: sellar liberado_at ─────────────────────────────────
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
    update billetera_movimientos
       set estado = 'liberado',
           monto_liberado = coalesce(v_row.monto, 0),
           liberado_at = now()
     where id = v_row.id;
    perform public.incrementar_saldo(v_row.usuario_id, v_row.monto);
    v_total := v_total + coalesce(v_row.monto, 0);
  end loop;
  return v_total;
end $$;

revoke execute on function public._liberar_hold_pago(text) from public, anon, authenticated;

-- ── liberar_pago_clase: una cuota por clase, sin carreras ──────────────────
create or replace function public.liberar_pago_clase(p_clase_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_clase     clases_realizadas%rowtype;
  v_mov       billetera_movimientos%rowtype;
  v_caller    text := auth.email();
  v_doc_id    uuid;
  v_clases    int;
  v_cuota     numeric;
  v_restante  numeric;
begin
  select * into v_clase from clases_realizadas where id = p_clase_id;
  if not found then return jsonb_build_object('error','Clase no encontrada'); end if;

  if v_caller is not null
     and v_caller <> v_clase.docente_email
     and v_caller <> v_clase.alumno_email then
    return jsonb_build_object('error','No autorizado');
  end if;

  if not (v_clase.confirmado_docente and v_clase.confirmado_alumno) then
    return jsonb_build_object('error','La clase aún no fue confirmada por ambas partes');
  end if;

  -- Idempotencia por clase: si esta clase ya liberó su cuota, no se libera otra
  -- vez (dos confirmaciones simultáneas, reintento del cliente, etc.).
  if exists (select 1 from billetera_movimientos
              where clase_realizada_id = p_clase_id and estado = 'liberado') then
    return jsonb_build_object('ok', true, 'ya_liberado', true, 'monto_liberado', 0);
  end if;

  select id into v_doc_id from usuarios where email = v_clase.docente_email limit 1;
  if v_doc_id is null then return jsonb_build_object('error','Docente no encontrado'); end if;

  -- El `for update` serializa: la segunda llamada concurrente espera acá y,
  -- cuando entra, ya ve monto_liberado actualizado por la primera.
  select bm.* into v_mov
    from billetera_movimientos bm
   where bm.publicacion_id = v_clase.publicacion_id
     and bm.usuario_id = v_doc_id
     and bm.estado = 'pendiente'
   order by bm.created_at
   limit 1
   for update;

  if not found then
    return jsonb_build_object('error','No hay fondos pendientes para esta clase');
  end if;

  -- Cuota = monto del hold / clases del paquete (1 si no es paquete).
  select greatest(coalesce(i.clases_totales, 1), 1) into v_clases
    from inscripciones i
   where i.publicacion_id = v_clase.publicacion_id
     and i.alumno_email = v_clase.alumno_email
   limit 1;
  v_clases := coalesce(v_clases, 1);

  v_restante := coalesce(v_mov.monto, 0) - coalesce(v_mov.monto_liberado, 0);
  v_cuota    := least(round(coalesce(v_mov.monto, 0) / v_clases, 2), v_restante);

  if v_cuota <= 0 then
    return jsonb_build_object('error','El hold ya fue liberado por completo');
  end if;

  -- Asiento de la cuota liberada + acreditación del saldo del docente.
  insert into billetera_movimientos(
    usuario_id, tipo, monto, estado, descripcion,
    publicacion_id, clase_realizada_id, mp_payment_id, liberado_at, monto_liberado, created_at
  ) values (
    v_doc_id, 'cobro_clase', v_cuota, 'liberado',
    'Clase confirmada — pago liberado',
    v_clase.publicacion_id, p_clase_id, v_mov.mp_payment_id, now(), v_cuota, now()
  );

  perform public.incrementar_saldo(v_doc_id, v_cuota);

  -- Consumir el hold: solo se cierra cuando se liberó todo.
  update billetera_movimientos
     set monto_liberado = coalesce(monto_liberado, 0) + v_cuota,
         estado = case
           when coalesce(monto_liberado, 0) + v_cuota >= coalesce(monto, 0) then 'liberado'
           else 'pendiente' end,
         liberado_at = case
           when coalesce(monto_liberado, 0) + v_cuota >= coalesce(monto, 0) then now()
           else liberado_at end
   where id = v_mov.id;

  return jsonb_build_object('ok', true, 'monto_liberado', v_cuota, 'de_clases', v_clases);
end $$;

revoke execute on function public.liberar_pago_clase(uuid) from public, anon;
grant  execute on function public.liberar_pago_clase(uuid) to authenticated;
