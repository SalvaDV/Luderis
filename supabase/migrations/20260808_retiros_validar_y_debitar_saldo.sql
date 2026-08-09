-- RETIROS: el mismo dinero se podía retirar infinitas veces.
--
-- El alta la hacía el cliente con un INSERT directo cuya única defensa era
-- `usuario_id = auth.uid()`: no validaba saldo. Y aprobar un retiro desde el
-- panel solo cambiaba el estado y mandaba un aviso — nunca debitaba nada. O sea
-- que con $10 de saldo se podía pedir cualquier monto, y cobrarlo una y otra vez.
--
-- Ahora el saldo se debita al PEDIR, no al aprobar: así el dinero queda
-- reservado y no se puede pedir dos veces. Si el admin rechaza, se devuelve.
--
-- Verificado contra producción con rollback: pedir de más se rechaza con el
-- saldo real; pedir dos veces el mismo monto falla la segunda; rechazar devuelve
-- el saldo al valor original.

alter table public.billetera_movimientos
  add column if not exists solicitud_retiro_id uuid references public.solicitudes_retiro(id) on delete set null;

-- 'retiro_procesado' y 'retiro_rechazado' no estaban en el CHECK, así que los
-- avisos del panel de admin venían fallando en silencio desde siempre.
alter table public.notificaciones drop constraint if exists notificaciones_tipo_check;
alter table public.notificaciones add constraint notificaciones_tipo_check check (tipo = any (array[
  'valorar_curso','nueva_oferta','oferta_aceptada','oferta_rechazada','nuevo_mensaje',
  'nueva_inscripcion','nuevo_documento','publicacion_destacada','sistema','nuevo_ayudante',
  'chat_grupal','clase_iniciada','nuevo_contenido','busqueda_eliminada','busqueda_acordada',
  'contraoferta','pago_aprobado_mp','alerta_publicacion','nueva_pregunta','pregunta_respondida',
  'alerta_contacto','pago_liberado','confirmar_clase','retiro_solicitado','acuerdo_confirmado',
  'liquidacion_disponible','retiro_procesado','retiro_rechazado']));

create or replace function public.solicitar_retiro(
  p_monto numeric, p_cbu_alias text, p_titular text
) returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text := (select auth.email());
  v_saldo numeric;
  v_id    uuid;
  v_nom   text;
  v_admin text;
begin
  if v_uid is null then return jsonb_build_object('error','No autenticado'); end if;
  if coalesce(p_monto,0) <= 0 then
    return jsonb_build_object('error','El monto tiene que ser mayor a cero'); end if;
  if nullif(btrim(coalesce(p_cbu_alias,'')),'') is null
     or nullif(btrim(coalesce(p_titular,'')),'') is null then
    return jsonb_build_object('error','Faltan el CBU/alias y el titular de la cuenta'); end if;

  -- El lock es lo que impide que dos pedidos simultáneos se lleven el mismo saldo.
  select saldo into v_saldo from public.billetera where usuario_id = v_uid for update;
  if v_saldo is null then v_saldo := 0; end if;
  if v_saldo < p_monto then
    return jsonb_build_object('error',
      'Tu saldo disponible es $' || trim(to_char(v_saldo,'FM999999990.00')) ||
      '. No podés retirar más que eso.', 'saldo', v_saldo);
  end if;

  select nombre into v_nom from public.usuarios where id = v_uid;

  update public.billetera set saldo = saldo - p_monto, updated_at = now()
   where usuario_id = v_uid;

  insert into public.solicitudes_retiro (usuario_id, email, nombre, monto, cbu_alias, titular, estado)
  values (v_uid, v_email, v_nom, p_monto, btrim(p_cbu_alias), btrim(p_titular), 'pendiente')
  returning id into v_id;

  insert into public.billetera_movimientos
    (usuario_id, tipo, monto, estado, descripcion, solicitud_retiro_id)
  values (v_uid, 'retiro', p_monto, 'pendiente',
          'Retiro solicitado — a la espera de la transferencia', v_id);

  for v_admin in select email from public.usuarios where rol = 'admin' loop
    perform public.notificar(v_admin, 'retiro_solicitado', null,
      'Hay un retiro pendiente de procesar');
  end loop;

  return jsonb_build_object('ok', true, 'solicitud_id', v_id,
                            'saldo_restante', v_saldo - p_monto);
end $$;

create or replace function public.resolver_retiro(
  p_solicitud_id uuid, p_estado text, p_notas text default null
) returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare v_sol public.solicitudes_retiro%rowtype; v_rol text;
begin
  select rol into v_rol from public.usuarios where id = (select auth.uid());
  if coalesce(v_rol,'') is distinct from 'admin' then
    return jsonb_build_object('error','Solo un administrador puede resolver un retiro'); end if;
  if p_estado not in ('procesado','rechazado') then
    return jsonb_build_object('error','Estado inválido'); end if;

  select * into v_sol from public.solicitudes_retiro where id = p_solicitud_id for update;
  if not found then return jsonb_build_object('error','Solicitud no encontrada'); end if;
  if v_sol.estado is distinct from 'pendiente' then
    return jsonb_build_object('error','Esa solicitud ya fue resuelta'); end if;

  update public.solicitudes_retiro
     set estado = p_estado, notas_admin = p_notas, procesado_at = now()
   where id = p_solicitud_id;

  if p_estado = 'procesado' then
    -- El saldo ya se debitó al pedirlo: acá solo se asienta que la plata salió.
    update public.billetera_movimientos
       set estado = 'liberado', liberado_at = now(),
           descripcion = 'Retiro transferido a tu cuenta'
     where solicitud_retiro_id = p_solicitud_id and estado = 'pendiente';
    perform public.notificar(v_sol.email, 'retiro_procesado', null,
      'Procesamos tu retiro. El dinero debería llegar en 5 a 7 días hábiles.');
  else
    -- Rechazado: la plata vuelve al saldo, que se había reservado al pedirlo.
    update public.billetera_movimientos
       set estado = 'reembolsado',
           descripcion = 'Retiro rechazado — el monto volvió a tu saldo'
     where solicitud_retiro_id = p_solicitud_id and estado = 'pendiente';
    perform public.incrementar_saldo(v_sol.usuario_id, v_sol.monto);
    perform public.notificar(v_sol.email, 'retiro_rechazado', null,
      'Rechazamos tu solicitud de retiro y devolvimos el monto a tu saldo.' ||
      coalesce(' Motivo: ' || p_notas, ''));
  end if;

  return jsonb_build_object('ok', true, 'estado', p_estado);
end $$;

-- El alta y la resolución pasan solo por las RPCs: con INSERT/UPDATE directos
-- el chequeo de saldo se puede saltear.
revoke insert, update, delete on public.solicitudes_retiro from anon, authenticated;
revoke all on function public.solicitar_retiro(numeric, text, text) from public, anon;
revoke all on function public.resolver_retiro(uuid, text, text)     from public, anon;
grant execute on function public.solicitar_retiro(numeric, text, text) to authenticated;
grant execute on function public.resolver_retiro(uuid, text, text)     to authenticated;
