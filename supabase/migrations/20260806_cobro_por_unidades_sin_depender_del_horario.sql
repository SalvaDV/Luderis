-- ═══════════════════════════════════════════════════════════════════════════
-- FLUJO DE COBRO: autorizar por unidades compradas, no por el horario cargado
--
-- Problema (verificado en producción): las compras por unidades no tenían NINGÚN
-- camino de liberación. Los tres estaban cerrados a la vez:
--   1. `registrar_clase_dictada` exigía que el día coincidiera con un slot de
--      `clases_sinc`. Las 3 publicaciones con inscriptos activos tienen el array
--      vacío → siempre cortaba en "La publicación no tiene horarios programados",
--      y `clases_realizadas` quedó en cero filas: ese camino nunca se completó.
--   2. `confirmar_recepcion_inscripcion` sólo libera `if clases_totales is null`.
--   3. El cron `auto_liberar_inscripciones_vencidas` filtra por el mismo
--      `clases_totales is null`.
-- Resultado: la plata entraba al hold y no salía nunca.
--
-- Cambio de fondo: el cobro deja de depender de la higiene del calendario. La
-- invariante pasa a ser "no podés registrar más clases que unidades compradas",
-- que es más fuerte que "coincide con un slot" (hoy un docente con horarios podía
-- registrar clases infinitas y uno sin horarios ninguna). La inscripción es la
-- única fuente de verdad: no hay reserva por chat, el alumno se inscribe.
--
-- `clases_sinc` sigue usándose, pero sólo para deducir la duración de la clase.
--
-- Nota para cuando se implemente "extender a más horas": el top-up debería sumar
-- sobre `clases_totales`/`clases_restantes` de la MISMA inscripción y dejar el
-- hold nuevo bajo `inscripciones.mp_payment_id`, o `_liberar_hold_parcial` habrá
-- que iterarlo sobre todos los holds pendientes de la publicación.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Liberación parcial del hold (una unidad por vez) ─────────────────────
-- `_liberar_hold_pago` libera todo o nada. Para el cobro por unidades hace falta
-- liberar de a una clase, acumulando en `monto_liberado` hasta cerrar el hold.
-- Es idempotente por `clase_realizada_id`: una misma clase no puede pagar dos
-- veces, aunque se la dispare desde dos caminos distintos.
CREATE OR REPLACE FUNCTION public._liberar_hold_parcial(
  p_mp_payment_id text,
  p_monto         numeric,
  p_clase_id      uuid
)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_hold      billetera_movimientos%rowtype;
  v_restante  numeric;
  v_liberar   numeric;
begin
  if p_mp_payment_id is null or coalesce(p_monto,0) <= 0 then return 0; end if;

  -- Idempotencia: esta clase ya se cobró.
  if exists (
    select 1 from billetera_movimientos
     where clase_realizada_id = p_clase_id and tipo = 'cobro_clase'
  ) then
    return 0;
  end if;

  select * into v_hold
    from billetera_movimientos
   where mp_payment_id = p_mp_payment_id and estado = 'pendiente'
   order by created_at
   limit 1
   for update;
  if not found then return 0; end if;

  v_restante := coalesce(v_hold.monto,0) - coalesce(v_hold.monto_liberado,0);
  v_liberar  := least(p_monto, v_restante);
  if v_liberar <= 0 then return 0; end if;

  update billetera_movimientos
     set monto_liberado = coalesce(monto_liberado,0) + v_liberar,
         estado = case
                    when coalesce(monto_liberado,0) + v_liberar >= coalesce(monto,0)
                    then 'liberado' else 'pendiente'
                  end,
         liberado_at = case
                    when coalesce(monto_liberado,0) + v_liberar >= coalesce(monto,0)
                    then now() else liberado_at
                  end
   where id = v_hold.id;

  -- Crédito real al docente, trazable a la clase que lo generó.
  insert into billetera_movimientos
    (usuario_id, tipo, monto, monto_liberado, estado, descripcion, publicacion_id, mp_payment_id, clase_realizada_id, created_at)
  values
    (v_hold.usuario_id, 'cobro_clase', v_liberar, v_liberar, 'liberado', 'Clase confirmada — pago liberado',
     v_hold.publicacion_id, p_mp_payment_id, p_clase_id, now());

  perform public.incrementar_saldo(v_hold.usuario_id, v_liberar);
  return v_liberar;
end $function$;

-- Primitiva interna: sólo la invocan las RPCs de confirmación y el cron.
-- Ojo: hay que revocar de PUBLIC, no sólo de anon/authenticated —
-- CREATE OR REPLACE FUNCTION otorga EXECUTE a PUBLIC por defecto y esos roles
-- lo heredan (verificado: con el revoke acotado, authenticated seguía pudiendo).
REVOKE EXECUTE ON FUNCTION public._liberar_hold_parcial(text,numeric,uuid) FROM PUBLIC, anon, authenticated;

-- ── 2. Registrar la clase: autorizar por unidades, no por slot ──────────────
CREATE OR REPLACE FUNCTION public.registrar_clase_dictada(p_pub_id uuid, p_fecha date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_uid     uuid := auth.uid();
  v_email   text := auth.email();
  v_pub     public.publicaciones%rowtype;
  v_slots   jsonb;
  v_slot    jsonb;
  v_dia     text;
  v_match   jsonb := null;
  v_dur     int;
  v_ins     record;
  v_n       int := 0;
  v_dup     int := 0;
  v_sin_u   int := 0;
begin
  if v_uid is null then return jsonb_build_object('error','No autorizado'); end if;

  select * into v_pub from public.publicaciones where id = p_pub_id;
  if not found then return jsonb_build_object('error','Publicación no encontrada'); end if;
  if v_pub.autor_id is distinct from v_uid then
    return jsonb_build_object('error','Solo el docente puede registrar la clase');
  end if;

  if p_fecha > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    return jsonb_build_object('error','Esa clase todavía no ocurrió');
  end if;

  -- El horario ya no autoriza: sólo sirve para deducir la duración.
  begin
    v_slots := coalesce(v_pub.clases_sinc, '[]')::jsonb;
  exception when others then
    v_slots := '[]'::jsonb;
  end;
  if jsonb_typeof(v_slots) = 'array' and jsonb_array_length(v_slots) > 0 then
    v_dia := (array['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'])
               [extract(dow from p_fecha)::int + 1];
    for v_slot in select * from jsonb_array_elements(v_slots) loop
      if v_slot->>'dia' = v_dia then v_match := v_slot; exit; end if;
    end loop;
  end if;

  if v_match is not null then
    begin
      v_dur := greatest(round(extract(epoch from (
                 (v_match->>'hora_fin')::time - (v_match->>'hora_inicio')::time)) / 60)::int, 0);
    exception when others then v_dur := null;
    end;
  end if;
  if v_dur is null or v_dur = 0 then v_dur := 60; end if;

  -- Una fila por alumno con inscripción activa Y unidades disponibles.
  for v_ins in
    select i.id, i.alumno_email, i.clases_totales, i.clases_restantes
      from public.inscripciones i
     where i.publicacion_id = p_pub_id
       and coalesce(i.estado,'activa') = 'activa'
       and i.alumno_email is not null
  loop
    -- Tope real: no se puede dictar (ni cobrar) más de lo comprado.
    if v_ins.clases_totales is not null and coalesce(v_ins.clases_restantes,0) <= 0 then
      v_sin_u := v_sin_u + 1;
      continue;
    end if;

    if exists (
      select 1 from public.clases_realizadas cr
       where cr.publicacion_id = p_pub_id
         and cr.alumno_email = v_ins.alumno_email
         and cr.fecha_clase::date = p_fecha
    ) then
      v_dup := v_dup + 1;
      continue;
    end if;

    insert into public.clases_realizadas
      (publicacion_id, docente_email, alumno_email, fecha_clase, duracion_min, confirmado_docente, confirmado_alumno)
    values
      (p_pub_id, v_email, v_ins.alumno_email, p_fecha, v_dur, true, false);
    v_n := v_n + 1;

    -- Consumir la unidad al dictarla; el dinero se libera recién al confirmar.
    if v_ins.clases_totales is not null then
      update public.inscripciones
         set clases_restantes = greatest(coalesce(clases_restantes,0) - 1, 0)
       where id = v_ins.id;
    end if;

    perform public.notificar(v_ins.alumno_email, 'confirmar_clase', p_pub_id, v_pub.titulo);
  end loop;

  if v_n = 0 and v_sin_u > 0 and v_dup = 0 then
    return jsonb_build_object('error','No quedan clases compradas por confirmar. El alumno tiene que sumar más horas.');
  end if;

  return jsonb_build_object('ok', true, 'registradas', v_n, 'ya_estaban', v_dup,
                            'sin_unidades', v_sin_u, 'duracion_min', v_dur);
end $function$;

-- ── 3. Confirmar la clase libera la unidad correspondiente ──────────────────
CREATE OR REPLACE FUNCTION public.confirmar_clase(p_clase_id uuid, p_usuario_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_clase    clases_realizadas%rowtype;
  v_ambos    boolean;
  v_caller   text := auth.email();
  v_ins      public.inscripciones%rowtype;
  v_unidad   numeric := 0;
  v_liberado numeric := 0;
begin
  if v_caller is null then
    return jsonb_build_object('error', 'No autenticado');
  end if;

  select * into v_clase from clases_realizadas where id = p_clase_id;
  if not found then return jsonb_build_object('error', 'Clase no encontrada'); end if;

  -- La identidad sale del JWT, nunca del parámetro (spoofeable).
  if v_caller = v_clase.docente_email then
    update clases_realizadas set confirmado_docente = true where id = p_clase_id;
  elsif v_caller = v_clase.alumno_email then
    update clases_realizadas set confirmado_alumno = true where id = p_clase_id;
  else
    return jsonb_build_object('error', 'No autorizado');
  end if;

  select confirmado_docente and confirmado_alumno into v_ambos
    from clases_realizadas where id = p_clase_id;

  if v_ambos then
    update clases_realizadas
       set confirmada_at = now()
     where id = p_clase_id and confirmada_at is null;

    -- Compra por unidades: liberar la parte proporcional del hold.
    select * into v_ins
      from public.inscripciones
     where publicacion_id = v_clase.publicacion_id
       and alumno_email  = v_clase.alumno_email
       and coalesce(estado,'activa') = 'activa'
     order by created_at
     limit 1;

    if found and v_ins.clases_totales is not null then
      -- Proporcional a lo efectivamente retenido (respeta la comisión).
      select coalesce(bm.monto,0) / greatest(v_ins.clases_totales,1) into v_unidad
        from billetera_movimientos bm
       where bm.mp_payment_id = v_ins.mp_payment_id and bm.estado = 'pendiente'
       order by bm.created_at
       limit 1;

      if coalesce(v_unidad,0) <= 0 then
        v_unidad := coalesce(v_ins.precio_por_clase, 0);
      end if;

      v_liberado := public._liberar_hold_parcial(v_ins.mp_payment_id, v_unidad, p_clase_id);
    end if;
  end if;

  return jsonb_build_object('ok', true, 'ambos_confirmaron', v_ambos,
                            'monto_liberado', coalesce(v_liberado,0));
end $function$;

-- ── 4. Red de seguridad: que el alumno ausente no congele la plata ──────────
-- Antes sólo cubría la compra entera (`clases_totales is null`). Ahora también
-- libera las clases por unidad que el docente registró y el alumno nunca
-- confirmó, pasados 7 días.
CREATE OR REPLACE FUNCTION public.auto_liberar_inscripciones_vencidas()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_ins    record;
  v_cl     record;
  v_n      int := 0;
  v_monto  numeric := 0;
  v_lib    numeric;
  v_unidad numeric;
begin
  -- (a) Compra entera: liberar el hold completo.
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

  -- (b) Compra por unidades: liberar clase por clase las no confirmadas.
  for v_cl in
    select cr.id as clase_id, i.mp_payment_id, i.clases_totales, i.precio_por_clase
      from public.clases_realizadas cr
      join public.inscripciones i
        on i.publicacion_id = cr.publicacion_id
       and i.alumno_email  = cr.alumno_email
       and coalesce(i.estado,'activa') = 'activa'
     where cr.confirmado_docente = true
       and coalesce(cr.confirmado_alumno,false) = false
       and i.clases_totales is not null
       and cr.fecha_clase < (now() - interval '7 days')::date
       and not exists (
         select 1 from public.billetera_movimientos bm
          where bm.clase_realizada_id = cr.id and bm.tipo = 'cobro_clase'
       )
  loop
    select coalesce(bm.monto,0) / greatest(v_cl.clases_totales,1) into v_unidad
      from public.billetera_movimientos bm
     where bm.mp_payment_id = v_cl.mp_payment_id and bm.estado = 'pendiente'
     order by bm.created_at
     limit 1;
    if coalesce(v_unidad,0) <= 0 then v_unidad := coalesce(v_cl.precio_por_clase,0); end if;

    v_lib := public._liberar_hold_parcial(v_cl.mp_payment_id, v_unidad, v_cl.clase_id);
    if v_lib > 0 then v_n := v_n + 1; v_monto := v_monto + v_lib; end if;
  end loop;

  return jsonb_build_object('ok', true, 'inscripciones_liberadas', v_n, 'monto_total', v_monto);
end $function$;

-- ── 5. Unificar el tercer camino: el botón "Liberar pago" ───────────────────
-- `liberar_pago_clase` marcaba el hold como liberado ENTERO. Con la liberación
-- parcial por unidad eso permitiría cobrar las 4 clases habiendo dictado 1.
-- Ahora delega en la misma primitiva idempotente que usa la confirmación: sólo
-- puede liberar la unidad de esa clase, y una sola vez. Verificado: liberar por
-- confirmación + apretar el botón dos veces deja UNA sola fila de crédito.
CREATE OR REPLACE FUNCTION public.liberar_pago_clase(p_clase_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $f$
declare v_clase clases_realizadas%rowtype; v_ins inscripciones%rowtype;
        v_caller text := auth.email(); v_unidad numeric := 0; v_lib numeric := 0;
begin
  select * into v_clase from clases_realizadas where id = p_clase_id;
  if not found then return jsonb_build_object('error','Clase no encontrada'); end if;
  if v_caller is not null and v_caller <> v_clase.docente_email and v_caller <> v_clase.alumno_email then
    return jsonb_build_object('error','No autorizado'); end if;
  if not (v_clase.confirmado_docente and v_clase.confirmado_alumno) then
    return jsonb_build_object('error','La clase aún no fue confirmada por ambas partes'); end if;

  select * into v_ins from inscripciones where publicacion_id=v_clase.publicacion_id
     and alumno_email=v_clase.alumno_email and coalesce(estado,'activa')='activa' order by created_at limit 1;
  if not found then return jsonb_build_object('error','No hay inscripción activa para esta clase'); end if;

  select coalesce(bm.monto,0)/greatest(coalesce(v_ins.clases_totales,1),1) into v_unidad
    from billetera_movimientos bm
   where bm.mp_payment_id=v_ins.mp_payment_id and bm.estado='pendiente' order by bm.created_at limit 1;
  if coalesce(v_unidad,0)<=0 then v_unidad := coalesce(v_ins.precio_por_clase,0); end if;

  v_lib := public._liberar_hold_parcial(v_ins.mp_payment_id, v_unidad, p_clase_id);
  if v_lib <= 0 then return jsonb_build_object('ok',true,'ya_liberada',true,'monto_liberado',0); end if;
  return jsonb_build_object('ok',true,'monto_liberado',v_lib);
end $f$;
