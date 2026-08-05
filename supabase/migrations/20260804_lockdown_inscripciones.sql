-- ═══════════════════════════════════════════════════════════════════════════
-- LOCKDOWN DE `inscripciones` — cierra 3 agujeros críticos (auditoría 2026-08-04)
--
-- Causa raíz común: `grant update/insert` a `authenticated` sobre TODAS las
-- columnas, más una policy de UPDATE sin `with check` (Postgres reusa el `using`,
-- que solo fija `alumno_id`). Resultado: el cliente podía escribir por PATCH/POST
-- cualquier columna de una fila propia, incluidas mp_payment_id, pagado_mp,
-- clase_finalizada, alumno_confirmada, clases_totales y precio_por_clase.
--
--  C1) Un docente leía el mp_payment_id del pago de un alumno suyo, se inscribía
--      como alumno en una publicación ajena, apuntaba su fila a ese pago y
--      llamaba a reembolsar_inscripcion(): la función busca los holds POR
--      mp_payment_id y le acreditaba el BRUTO (neto + comisión de Luderis).
--      Como los ids de pago de MP son numéricos y correlativos, la misma
--      maniobra servía para robar holds de terceros.
--  C2) El docente podía setear alumno_confirmada=true junto con
--      clase_finalizada=true en un solo PATCH, anulando por completo la doble
--      confirmación que introdujo 20260420_escrow_doble_confirmacion.sql.
--  C3) El INSERT dejaba fijar pagado_mp / mp_payment_id / clases_totales a mano,
--      o sea fabricar una inscripción con pinta de pagada.
--
-- NO se cierra la auto-inscripción: inscribirse sin pago online es una función
-- deliberada del producto ("Inscribirme y coordinar el pago con el docente",
-- cursos gratis y clases de prueba). Lo que se cierra es la escritura libre de
-- columnas: ahora entra por RPC, que decide qué campos se setean.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Cortar la escritura directa del cliente ──────────────────────────────
revoke insert, update, delete on public.inscripciones from anon, authenticated;

-- Lo único que el alumno escribe por PATCH directo es su propia confirmación de
-- recepción y la marca de "ya valoré". Todo lo demás pasa por RPC.
grant update (alumno_confirmada, valorado) on public.inscripciones to authenticated;
grant delete on public.inscripciones to authenticated;  -- desinscribirse (policy: solo la propia)

-- ── 2. Policies de UPDATE: solo el alumno, y con `with check` explícito ─────
-- La policy vieja daba UPDATE también al autor de la publicación (C2) y no
-- declaraba `with check`, así que la fila podía mutar a cualquier cosa que
-- siguiera cumpliendo el `using`.
drop policy if exists "inscripciones update own or owner" on public.inscripciones;
drop policy if exists "inscripciones_alumno_update_confirmacion" on public.inscripciones;

create policy "inscripciones update alumno" on public.inscripciones
  for update to authenticated
  using  (alumno_id = auth.uid())
  with check (alumno_id = auth.uid());

-- ── 3. INSERT vía RPC ───────────────────────────────────────────────────────
drop policy if exists "inscripciones insert own" on public.inscripciones;

-- Inscribe al usuario de la sesión. Setea SOLO los campos que el alumno puede
-- decidir: nunca pagado_mp, mp_payment_id, clases_totales ni precio_por_clase
-- (esos los escribe el webhook con service_role, tras verificar el pago real).
create or replace function public.inscribirse(
  p_pub_id uuid,
  p_es_prueba boolean default false
) returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_pub    public.publicaciones%rowtype;
  v_email  text := auth.email();
  v_uid    uuid := auth.uid();
  v_id     uuid;
begin
  if v_uid is null then
    return jsonb_build_object('error','No autorizado');
  end if;

  select * into v_pub from public.publicaciones where id = p_pub_id;
  if not found then
    return jsonb_build_object('error','Publicación no encontrada');
  end if;
  if v_pub.autor_id = v_uid then
    return jsonb_build_object('error','No podés inscribirte en tu propia publicación');
  end if;
  if coalesce(v_pub.activo, true) = false
     or coalesce(v_pub.finalizado, false) = true
     or coalesce(v_pub.inscripciones_cerradas, false) = true then
    return jsonb_build_object('error','Las inscripciones están cerradas');
  end if;

  -- Idempotente: si ya estaba inscripto se devuelve la fila existente.
  select id into v_id from public.inscripciones
   where publicacion_id = p_pub_id and alumno_id = v_uid
   limit 1;
  if v_id is not null then
    return jsonb_build_object('ok', true, 'id', v_id, 'ya_inscripto', true);
  end if;

  insert into public.inscripciones (publicacion_id, alumno_id, alumno_email, es_prueba)
  values (p_pub_id, v_uid, v_email, coalesce(p_es_prueba, false))
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

revoke execute on function public.inscribirse(uuid, boolean) from public, anon;
grant  execute on function public.inscribirse(uuid, boolean) to authenticated;

-- ── 4. El docente finaliza la clase por RPC (ya no por PATCH) ───────────────
-- RLS no puede restringir columnas, así que la única forma de que el docente
-- marque clase_finalizada SIN poder tocar alumno_confirmada es sacarlo del
-- PATCH directo. Esto es lo que restituye la doble confirmación (C2).
create or replace function public.finalizar_clase_publicacion(p_pub_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare v_autor uuid; v_rol text; v_n int; v_ahora timestamptz := now();
begin
  select autor_id into v_autor from public.publicaciones where id = p_pub_id;
  if not found then return jsonb_build_object('error','Publicación no encontrada'); end if;

  select rol into v_rol from public.usuarios where id = auth.uid();
  if v_autor is distinct from auth.uid() and coalesce(v_rol,'') <> 'admin' then
    return jsonb_build_object('error','No autorizado');
  end if;

  update public.inscripciones
     set clase_finalizada = true,
         fecha_finalizacion = coalesce(fecha_finalizacion, v_ahora)
   where publicacion_id = p_pub_id
     and coalesce(estado,'activa') = 'activa'
     and coalesce(clase_finalizada, false) = false;
  get diagnostics v_n = row_count;

  return jsonb_build_object('ok', true, 'finalizadas', v_n);
end $$;

revoke execute on function public.finalizar_clase_publicacion(uuid) from public, anon;
grant  execute on function public.finalizar_clase_publicacion(uuid) to authenticated;

-- ── 5. Defensa en profundidad en reembolsar_inscripcion ─────────────────────
-- Aun con la escritura cerrada, la función no debe confiar en
-- `inscripciones.mp_payment_id` a secas: se valida que ese pago sea realmente
-- de ese alumno y de esa publicación antes de tocar un solo hold.
create or replace function public.reembolsar_inscripcion(p_inscripcion_id uuid, p_motivo text default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_ins public.inscripciones%rowtype; v_email text; v_rol text; v_por text;
  v_autor uuid; v_row public.billetera_movimientos%rowtype; v_hold numeric := 0; v_bruto numeric;
  v_pay text;
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

  -- El pago se resuelve contra `pagos`, cruzando publicación + alumno. Si la
  -- inscripción apunta a un pago que no es suyo, no se reembolsa nada.
  select p.mp_payment_id into v_pay
    from public.pagos p
   where p.mp_payment_id = v_ins.mp_payment_id
     and p.publicacion_id = v_ins.publicacion_id
     and p.alumno_email is not distinct from v_ins.alumno_email
   limit 1;

  -- Marcar como reembolsados los holds pendientes y sumar el bruto a devolver
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

  -- Si estaba pago pero ya no hay nada retenido, el pago fue liberado al docente:
  -- NO se puede reembolsar sin clawback → error explícito (no cancelar en silencio).
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
