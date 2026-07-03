-- ── FIX: tablas con RLS habilitado SIN policies = deny-all silencioso ─────────
-- clases_realizadas: el frontend inserta (registrar clase) y lee (lista de
-- clases, gate de desinscripción) con token de usuario → todo devolvía vacío o
-- fallaba. Las confirmaciones siguen vía RPC confirmar_clase (security definer).
create policy "clases select participante" on public.clases_realizadas
  for select using (
    docente_email = (select u.email from usuarios u where u.id = auth.uid())
    or alumno_email = (select u.email from usuarios u where u.id = auth.uid())
  );
create policy "clases insert participante" on public.clases_realizadas
  for insert with check (
    docente_email = (select u.email from usuarios u where u.id = auth.uid())
    or alumno_email = (select u.email from usuarios u where u.id = auth.uid())
  );

-- alertas_busquedas (alertas de docentes): CRUD del dueño por email.
create policy "alertas_busq select propias" on public.alertas_busquedas
  for select using (email = (select u.email from usuarios u where u.id = auth.uid()));
create policy "alertas_busq insert propias" on public.alertas_busquedas
  for insert with check (email = (select u.email from usuarios u where u.id = auth.uid()));
create policy "alertas_busq update propias" on public.alertas_busquedas
  for update using (email = (select u.email from usuarios u where u.id = auth.uid()));
create policy "alertas_busq delete propias" on public.alertas_busquedas
  for delete using (email = (select u.email from usuarios u where u.id = auth.uid()));

-- ── Hardening: SECURITY DEFINER innecesariamente ejecutables por anon ─────────
-- La app siempre llama con token de usuario; anon no las necesita.
revoke execute on function public.get_avg_time_faros(uuid) from anon;
revoke execute on function public.get_avg_time_shikaku(text) from anon;
revoke execute on function public.get_leaderboard_faros(integer) from anon;
revoke execute on function public.get_leaderboard_shikaku(integer) from anon;
revoke execute on function public.get_evaluaciones_pub(uuid) from anon;
revoke execute on function public.incrementar_vistas(uuid) from anon;

-- check_alertas_busqueda la invoca solo pg_cron (rol postgres): ningún usuario
-- debería poder disparar el batch de alertas.
revoke execute on function public.check_alertas_busqueda() from anon, authenticated;
