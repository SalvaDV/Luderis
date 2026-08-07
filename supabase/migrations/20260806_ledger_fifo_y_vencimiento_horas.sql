-- ═══════════════════════════════════════════════════════════════════════════
-- CARTERA DE HORAS: ledger FIFO por inscripción + vencimiento a 30 días
--
-- Bug que cierra (estaba vivo): comprar más horas sobre la misma publicación le
-- cobraba al alumno sin darle nada. Existe UNIQUE (publicacion_id, alumno_id),
-- así que el INSERT de la segunda inscripción fallaba con 23505, el webhook se
-- comía el error como "idempotente", `clases_totales` no subía… pero el cobro sí
-- ocurría y se creaba un hold nuevo. Encima `inscripciones.mp_payment_id` seguía
-- apuntando al PRIMER pago, así que ese hold no lo liquidaba nadie: plata en el
-- limbo.
--
-- Causa de fondo: la cartera estaba atada a UN pago. Ahora:
--   · la cartera es la inscripción (una por alumno+publicación);
--   · cada compra deja su propio hold atado a esa inscripción, con los minutos
--     que compró y su propio vencimiento;
--   · al liquidar una clase se consumen los holds del más viejo al más nuevo
--     (FIFO), así da igual cuántas compras haya.
--
-- Vencimiento: las horas duran 30 días desde SU compra (por eso FIFO: se gasta
-- primero lo que vence primero). Lo no usado no se reembolsa a la tarjeta —
-- vuelve como crédito en la billetera de Luderis del alumno.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. El hold pertenece a una cartera, tiene minutos y vence ───────────────
ALTER TABLE public.billetera_movimientos
  ADD COLUMN IF NOT EXISTS inscripcion_id uuid REFERENCES public.inscripciones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS minutos        integer,
  ADD COLUMN IF NOT EXISTS expira_at      timestamptz;

COMMENT ON COLUMN public.billetera_movimientos.inscripcion_id IS
  'Cartera a la que pertenece el hold. Permite consumir FIFO entre varias compras.';
COMMENT ON COLUMN public.billetera_movimientos.minutos IS
  'Minutos de clase que compró este pago. Sirve para devolver los no usados al vencer.';

CREATE INDEX IF NOT EXISTS idx_bm_hold_fifo
  ON public.billetera_movimientos (inscripcion_id, created_at)
  WHERE estado = 'pendiente';

-- Backfill: atar los holds existentes a su inscripción por el pago.
UPDATE public.billetera_movimientos bm
   SET inscripcion_id = i.id
  FROM public.inscripciones i
 WHERE bm.inscripcion_id IS NULL
   AND bm.mp_payment_id IS NOT NULL
   AND i.mp_payment_id = bm.mp_payment_id;

-- ── 2. Liberación FIFO sobre la cartera ─────────────────────────────────────
-- Reemplaza a `_liberar_hold_parcial`, que sólo miraba un mp_payment_id.
-- Idempotente por clase: una clase no puede cobrarse dos veces aunque la
-- disparen dos caminos distintos.
CREATE OR REPLACE FUNCTION public._liberar_fifo(
  p_ins_id   uuid,
  p_monto    numeric,
  p_clase_id uuid
)
 RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare
  v_hold      public.billetera_movimientos%rowtype;
  v_pend      numeric := coalesce(p_monto,0);
  v_total     numeric := 0;
  v_restante  numeric;
  v_tomar     numeric;
begin
  if p_ins_id is null or v_pend <= 0 then return 0; end if;

  if exists (
    select 1 from public.billetera_movimientos
     where clase_realizada_id = p_clase_id and tipo = 'cobro_clase'
  ) then
    return 0;
  end if;

  for v_hold in
    select * from public.billetera_movimientos
     where inscripcion_id = p_ins_id and estado = 'pendiente'
     order by coalesce(expira_at, 'infinity'::timestamptz), created_at
     for update
  loop
    exit when v_pend <= 0;

    v_restante := coalesce(v_hold.monto,0) - coalesce(v_hold.monto_liberado,0);
    if v_restante <= 0 then continue; end if;

    v_tomar := least(v_pend, v_restante);

    update public.billetera_movimientos
       set monto_liberado = coalesce(monto_liberado,0) + v_tomar,
           estado = case when coalesce(monto_liberado,0) + v_tomar >= coalesce(monto,0)
                         then 'liberado' else 'pendiente' end,
           liberado_at = case when coalesce(monto_liberado,0) + v_tomar >= coalesce(monto,0)
                         then now() else liberado_at end
     where id = v_hold.id;

    insert into public.billetera_movimientos
      (usuario_id, tipo, monto, monto_liberado, estado, descripcion,
       publicacion_id, mp_payment_id, inscripcion_id, clase_realizada_id, created_at)
    values
      (v_hold.usuario_id, 'cobro_clase', v_tomar, v_tomar, 'liberado',
       'Clase confirmada — pago liberado',
       v_hold.publicacion_id, v_hold.mp_payment_id, p_ins_id, p_clase_id, now());

    perform public.incrementar_saldo(v_hold.usuario_id, v_tomar);

    v_pend  := v_pend - v_tomar;
    v_total := v_total + v_tomar;
  end loop;

  return v_total;
end $$;

REVOKE EXECUTE ON FUNCTION public._liberar_fifo(uuid,numeric,uuid) FROM PUBLIC, anon, authenticated;

-- ── 3. Liquidar la clase usando la cartera entera ──────────────────────────
CREATE OR REPLACE FUNCTION public._liquidar_clase(p_clase_id uuid)
 RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare
  v_clase public.clases_realizadas%rowtype;
  v_ins   public.inscripciones%rowtype;
  v_cap   int;
  v_monto numeric := 0;
  v_hold  numeric := 0;
  v_lib   numeric := 0;
begin
  select * into v_clase from public.clases_realizadas where id = p_clase_id;
  if not found then return 0; end if;
  if v_clase.objetada_at is not null then return 0; end if;

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

  -- Precio de la clase = proporción de minutos sobre TODO lo retenido en la
  -- cartera (no sobre un pago suelto), así varias compras se cobran parejo.
  -- OJO: se calcula ANTES de consumir. Si se usara el saldo ya descontado, la
  -- última clase de la cartera se cobraría dividiendo por cero minutos.
  select coalesce(sum(coalesce(bm.monto,0) - coalesce(bm.monto_liberado,0)), 0) into v_hold
    from public.billetera_movimientos bm
   where bm.inscripcion_id = v_ins.id and bm.estado = 'pendiente';

  if v_hold > 0 then
    v_monto := v_hold * (coalesce(v_clase.duracion_min,0)::numeric
                         / greatest(v_cap - coalesce(v_ins.minutos_consumidos,0),
                                    coalesce(v_clase.duracion_min,0)));
  end if;

  update public.inscripciones
     set minutos_consumidos = least(coalesce(minutos_consumidos,0) + coalesce(v_clase.duracion_min,0), v_cap),
         clases_restantes   = greatest(
           ceil((v_cap - least(coalesce(minutos_consumidos,0) + coalesce(v_clase.duracion_min,0), v_cap))::numeric / 60)::int, 0)
   where id = v_ins.id;

  if coalesce(v_monto,0) <= 0 then return 0; end if;

  v_lib := public._liberar_fifo(v_ins.id, v_monto, p_clase_id);
  return coalesce(v_lib,0);
end $$;

-- ── 4. El botón viejo también va por la cartera ────────────────────────────
CREATE OR REPLACE FUNCTION public.liberar_pago_clase(p_clase_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare v_clase public.clases_realizadas%rowtype; v_caller text := auth.email(); v_lib numeric := 0;
begin
  select * into v_clase from public.clases_realizadas where id = p_clase_id;
  if not found then return jsonb_build_object('error','Clase no encontrada'); end if;
  if v_caller is not null and v_caller <> v_clase.docente_email and v_caller <> v_clase.alumno_email then
    return jsonb_build_object('error','No autorizado'); end if;
  if not (v_clase.confirmado_docente and v_clase.confirmado_alumno) then
    return jsonb_build_object('error','La clase aún no fue confirmada por ambas partes'); end if;

  v_lib := public._liquidar_clase(p_clase_id);
  if v_lib <= 0 then return jsonb_build_object('ok',true,'ya_liberada',true,'monto_liberado',0); end if;
  return jsonb_build_object('ok',true,'monto_liberado',v_lib);
end $$;

-- ── 5. Vencimiento a 30 días → crédito en la billetera del alumno ──────────
-- Lo no usado no se reembolsa a la tarjeta: vuelve como saldo de Luderis, que es
-- lo acordado. Devuelve el neto retenido (la comisión ya se cobró al pagar).
CREATE OR REPLACE FUNCTION public.expirar_horas_vencidas()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare
  v_h        record;
  v_n        int := 0;
  v_total    numeric := 0;
  v_devolver numeric;
  v_min_no   int;
begin
  for v_h in
    select bm.*, i.alumno_id, i.id as ins_id, i.minutos_totales, i.minutos_consumidos
      from public.billetera_movimientos bm
      join public.inscripciones i on i.id = bm.inscripcion_id
     where bm.estado = 'pendiente'
       and bm.expira_at is not null
       and bm.expira_at < now()
       and i.alumno_id is not null
     for update of bm
  loop
    v_devolver := coalesce(v_h.monto,0) - coalesce(v_h.monto_liberado,0);
    if v_devolver <= 0 then continue; end if;

    -- Minutos que quedaron sin dictar en este pago.
    v_min_no := floor(coalesce(v_h.minutos,0)
                      * (v_devolver / nullif(coalesce(v_h.monto,0),0)))::int;

    update public.billetera_movimientos
       set estado = 'reembolsado', liberado_at = now(),
           descripcion = coalesce(descripcion,'') || ' · horas vencidas a los 30 días'
     where id = v_h.id;

    -- Crédito al alumno (no es reembolso a la tarjeta: es saldo de Luderis).
    insert into public.billetera_movimientos
      (usuario_id, tipo, monto, monto_liberado, estado, descripcion,
       publicacion_id, inscripcion_id, created_at)
    values
      (v_h.alumno_id, 'reembolso', v_devolver, v_devolver, 'liberado',
       'Horas vencidas — crédito a tu saldo de Luderis',
       v_h.publicacion_id, v_h.ins_id, now());

    perform public.incrementar_saldo(v_h.alumno_id, v_devolver);

    -- La cartera pierde las horas vencidas.
    if v_min_no > 0 then
      update public.inscripciones
         set minutos_totales = greatest(coalesce(minutos_totales,0) - v_min_no,
                                        coalesce(minutos_consumidos,0)),
             clases_restantes = greatest(
               ceil((greatest(coalesce(minutos_totales,0) - v_min_no, coalesce(minutos_consumidos,0))
                     - coalesce(minutos_consumidos,0))::numeric / 60)::int, 0)
       where id = v_h.ins_id;
    end if;

    v_n := v_n + 1;
    v_total := v_total + v_devolver;
  end loop;

  return jsonb_build_object('ok', true, 'holds_vencidos', v_n, 'devuelto_al_alumno', v_total);
end $$;

REVOKE EXECUTE ON FUNCTION public.expirar_horas_vencidas() FROM PUBLIC, anon, authenticated;

-- ── 6. Sumar horas a la cartera (compra nueva sobre la misma publicación) ──
-- La usa el webhook: si ya hay inscripción activa, suma capacidad en vez de
-- intentar un INSERT que rebota contra el UNIQUE.
CREATE OR REPLACE FUNCTION public.sumar_horas_inscripcion(
  p_pub_id     uuid,
  p_alumno_id  uuid,
  p_minutos    integer,
  p_unidades   integer
)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
declare v_ins public.inscripciones%rowtype;
begin
  select * into v_ins from public.inscripciones
   where publicacion_id = p_pub_id and alumno_id = p_alumno_id
   for update;
  if not found then return null; end if;

  update public.inscripciones
     set minutos_totales = coalesce(minutos_totales, coalesce(clases_totales,0)*60) + coalesce(p_minutos,0),
         clases_totales  = coalesce(clases_totales,0) + coalesce(p_unidades,0),
         clases_restantes = coalesce(clases_restantes,0) + coalesce(p_unidades,0),
         estado = case when coalesce(estado,'activa') <> 'activa' then 'activa' else estado end
   where id = v_ins.id;

  return v_ins.id;
end $$;

REVOKE EXECUTE ON FUNCTION public.sumar_horas_inscripcion(uuid,uuid,integer,integer) FROM PUBLIC, anon, authenticated;

-- ── 7. Cron del vencimiento ─────────────────────────────────────────────────
-- 30 min después del auto-liberar (4:00), para que una clase confirmada ese
-- mismo día se cobre antes de que expire el saldo.
select cron.schedule('expirar-horas-vencidas', '30 4 * * *',
  $cron$select public.expirar_horas_vencidas()$cron$);
