-- ── FIX CRÍTICO: un participante podía reescribir mensajes ajenos ─────────────
-- La policy UPDATE no tenía WITH CHECK y el GRANT de UPDATE cubría TODAS las
-- columnas (texto, de_nombre, created_at, ...): el destinatario matcheaba el
-- USING por para_nombre y podía editar el contenido del remitente (suplantación
-- + evasión de la moderación de contacto, que corre solo al enviar).

-- 1) Reparar filas corruptas por updateMensajesNombre (pisaba de_nombre=email
--    con el display name y rompía el pareo de conversaciones). Mapeo verificado
--    de forma única contra usuarios.nombre/display_name. (Valores aplicados en
--    la migración remota.)

-- 2) Grants de columna: los clientes solo pueden actualizar leido/leido_at.
revoke update on table public.mensajes from anon, authenticated;
grant update (leido, leido_at) on public.mensajes to authenticated;

-- 3) Policy con WITH CHECK: solo el destinatario marca leído.
drop policy if exists "mensajes update leido" on public.mensajes;
create policy "mensajes marcar leido" on public.mensajes
  for update to authenticated
  using (
    para_usuario = auth.uid()
    or para_nombre = (select u.email from usuarios u where u.id = auth.uid())
  )
  with check (
    para_usuario = auth.uid()
    or para_nombre = (select u.email from usuarios u where u.id = auth.uid())
  );
