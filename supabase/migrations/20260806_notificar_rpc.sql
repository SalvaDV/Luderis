-- ═══════════════════════════════════════════════════════════════════════════
-- RPC `notificar()` — destraba el cierre de F1 (auditoría 2026-08)
--
-- La policy de INSERT de `notificaciones` es hoy `auth.role() = 'authenticated'`:
-- cualquier cuenta con sesión puede insertar una notificación para CUALQUIER
-- destinatario, con tipo y texto arbitrarios. El panel de admin la usa para
-- avisos oficiales ("tu retiro fue procesado"), así que se pueden suplantar.
--
-- No se puede simplemente restringir la policy: la app notifica a terceros desde
-- el cliente en 8 lugares legítimos (chat, ofertas, preguntas, ayudantes,
-- finalizar clase). Esta RPC es el reemplazo: valida server-side que exista una
-- relación real entre quien notifica y el destinatario, con el mismo criterio
-- que ya usa send-push tras la auditoría.
--
-- PASO A de 2 (aditivo). El paso B, que restringe la policy, va después de que
-- el deploy con los call-sites migrados esté vivo.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.notificar(
  p_email       text,
  p_tipo        text,
  p_pub_id      uuid    default null,
  p_pub_titulo  text    default null,
  p_accion_url  text    default null
) returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare
  v_uid        uuid := auth.uid();
  v_yo         text := auth.email();
  v_destino_id uuid;
  v_rol        text;
  v_relacion   boolean := false;
  v_id         uuid;
begin
  if v_uid is null then
    return jsonb_build_object('error','No autorizado');
  end if;
  if p_email is null or p_tipo is null then
    return jsonb_build_object('error','Faltan destinatario o tipo');
  end if;

  select id into v_destino_id from public.usuarios where email = p_email limit 1;
  if v_destino_id is null then
    -- No se filtra si el email existe o no: mismo mensaje en ambos casos.
    return jsonb_build_object('error','Destinatario no válido');
  end if;

  select rol into v_rol from public.usuarios where id = v_uid;

  -- ¿Hay relación real entre las dos personas?
  if p_email = v_yo then
    v_relacion := true;                       -- notificarse a uno mismo
  elsif coalesce(v_rol,'') = 'admin' then
    v_relacion := true;                       -- el admin notifica avisos oficiales
  elsif exists (
    -- se escribieron por chat, en cualquier dirección
    select 1 from public.mensajes m
     where (m.de_nombre = v_yo and m.para_nombre = p_email)
        or (m.de_nombre = p_email and m.para_nombre = v_yo)
     limit 1
  ) then
    v_relacion := true;
  elsif exists (
    -- uno está inscripto en una publicación del otro
    select 1
      from public.inscripciones i
      join public.publicaciones p on p.id = i.publicacion_id
     where (i.alumno_id = v_uid and p.autor_id = v_destino_id)
        or (i.alumno_id = v_destino_id and p.autor_id = v_uid)
     limit 1
  ) then
    v_relacion := true;
  elsif exists (
    -- uno ofertó sobre una búsqueda del otro
    select 1 from public.ofertas_busqueda o
     where (o.ofertante_email = v_yo and o.busqueda_autor_email = p_email)
        or (o.ofertante_email = p_email and o.busqueda_autor_email = v_yo)
     limit 1
  ) then
    v_relacion := true;
  end if;

  if not v_relacion then
    return jsonb_build_object('error','No hay relación con ese destinatario');
  end if;

  -- La URL tiene que ser una ruta interna: el panel de notificaciones navega a
  -- ella, así que una URL absoluta convertiría el aviso en un link externo con
  -- la marca de Luderis.
  if p_accion_url is not null
     and (left(p_accion_url, 1) <> '/' or left(p_accion_url, 2) = '//') then
    return jsonb_build_object('error','accion_url debe ser una ruta interna');
  end if;

  insert into public.notificaciones (usuario_id, alumno_email, tipo, publicacion_id, pub_titulo, accion_url, leida)
  values (v_destino_id, p_email, left(p_tipo, 60), p_pub_id, left(p_pub_titulo, 200), p_accion_url, false)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

revoke execute on function public.notificar(text, text, uuid, text, text) from public, anon;
grant  execute on function public.notificar(text, text, uuid, text, text) to authenticated;
