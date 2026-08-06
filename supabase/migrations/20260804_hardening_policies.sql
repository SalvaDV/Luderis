-- ═══════════════════════════════════════════════════════════════════════════
-- Hardening de policies y grants (auditoría 2026-08-04)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── NOTA DE ALCANCE ────────────────────────────────────────────────────────
-- Las policies de `notificaciones` y `alertas_digest_queue` NO están acá: se
-- movieron a 20260804_pendiente_notificaciones.sql porque romperían la app tal
-- como está desplegada hoy (ver ese archivo). Esta migración es aplicable sin
-- ningún cambio de código.

-- ── 3. usuarios: grants por columna ────────────────────────────────────────
-- El trigger protect_usuario_privileged_cols ya bloquea rol/verificado/bloqueado/
-- email/tokens de MP, pero el grant cubría TODAS las columnas y dejaba libres
-- calificaciones_suma, calificaciones_count, advertencias, dias_racha y nivel:
-- un PATCH bastaba para aparecer con 5 estrellas en el perfil público.
-- Lista blanca de lo que el usuario edita de su propio perfil. El agujero que
-- cierra es que el grant cubría TODAS las columnas y dejaba libres
-- calificaciones_suma, calificaciones_count, advertencias, dias_racha y nivel:
-- un PATCH bastaba para aparecer con 5 estrellas en el perfil público. El
-- trigger protect_usuario_privileged_cols NO cubre ninguna de esas.
--
-- `rol` SÍ va en la lista, aunque suene contradictorio: el onboarding lo manda
-- en su UPDATE (OnboardingModal.jsx:462) y sin el privilegio de columna Postgres
-- rechaza el statement entero, incluso cuando el valor no cambia. El control
-- real sobre `rol` es el trigger, que sigue bloqueando cualquier cambio efectivo.
-- Igual criterio para email/verificado/bloqueado/mp_*: los cubre el trigger.
revoke update on public.usuarios from anon, authenticated;
grant update (
  nombre, display_name, bio, avatar, avatar_url, avatar_color, banner_url,
  ubicacion, materias, materias_interes, nivel_educativo, objetivo,
  titulo_profesional, anios_experiencia, metodologia, idiomas, franja_horaria,
  linkedin_url, sitio_web, video_presentacion,
  disponible_ahora, disponible_hasta, disponible_mensaje,
  recordatorios_activos, onboarding_completado, referido_por,
  rol, ultimo_acceso, updated_at
) on public.usuarios to authenticated;

-- ── 4. referidos y anuncios_globales: RLS activa sin policies ──────────────
-- Deny-all silencioso: el programa de referidos falla en cada alta (el insert de
-- AuthScreen se pierde en un .catch) y el historial de anuncios del admin sale
-- siempre vacío.
create policy "referidos select propios" on public.referidos
  for select to authenticated
  using (referidor_id = (select auth.uid()) or referido_id = (select auth.uid()));

create policy "referidos insert propio" on public.referidos
  for insert to authenticated
  with check (referido_id = (select auth.uid()));

create policy "anuncios select admin" on public.anuncios_globales
  for select to authenticated
  using (exists (select 1 from public.usuarios u
                  where u.id = (select auth.uid()) and u.rol = 'admin'));

-- ── 5. Revokes que nunca surtieron efecto ──────────────────────────────────
-- 20260703_fix_rls_deny_all_y_hardening.sql revocó EXECUTE solo de `anon`, pero
-- Postgres lo concede a PUBLIC por defecto y anon hereda de PUBLIC: no quitó
-- nada. Las 6 funciones siguen hoy ejecutables sin sesión (confirmado por el
-- advisor). Es el patrón que 20260706 sí aplicó bien (`from public, anon`).
revoke execute on function public.get_avg_time_faros(uuid)       from public, anon;
revoke execute on function public.get_avg_time_shikaku(text)     from public, anon;
revoke execute on function public.get_leaderboard_faros(integer) from public, anon;
revoke execute on function public.get_leaderboard_shikaku(integer) from public, anon;
revoke execute on function public.get_evaluaciones_pub(uuid)     from public, anon;
revoke execute on function public.incrementar_vistas(uuid)       from public, anon;

-- incrementar_vistas la llama la ficha pública, que sí puede verse sin sesión:
-- se deja abierta a anon a propósito, pero explícitamente y no por herencia.
grant execute on function public.incrementar_vistas(uuid) to anon, authenticated;
grant execute on function public.get_avg_time_faros(uuid)         to authenticated;
grant execute on function public.get_avg_time_shikaku(text)       to authenticated;
grant execute on function public.get_leaderboard_faros(integer)   to authenticated;
grant execute on function public.get_leaderboard_shikaku(integer) to authenticated;
grant execute on function public.get_evaluaciones_pub(uuid)       to authenticated;

-- ── 6. pagos.estado_escrow sin CHECK ───────────────────────────────────────
-- billetera_movimientos.estado sí tiene constraint; esta columna no, y
-- liberar-pago ya introdujo 'procesando', que no figuraba en ninguna parte.
update public.pagos set estado_escrow = 'pendiente'
 where estado_escrow is not null
   and estado_escrow not in ('pendiente','retenido','procesando','liberado','reembolsado','en_disputa');

alter table public.pagos drop constraint if exists pagos_estado_escrow_check;
alter table public.pagos add constraint pagos_estado_escrow_check
  check (estado_escrow is null or estado_escrow in
    ('pendiente','retenido','procesando','liberado','reembolsado','en_disputa'));

-- ── 7. metricas_docente: sacarla del alcance de anon ───────────────────────
-- Es una proyección agregada por docente (incluye su email); nadie sin sesión
-- necesita leerla.
revoke select on public.metricas_docente from anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- NO SE TOCA ACÁ (a propósito): la fuga de `autor_email` vía
-- `publicaciones_con_autor` y la enumeración de emails vía `usuarios`
-- (`usuarios public read` tiene `using (true)`).
--
-- Se verificó que cerrarlas rompe la app hoy: el cliente consume la vista en
-- App.jsx:806 y AdminPage.jsx:1288, y `src/supabase.ts` filtra y proyecta
-- `usuarios.email` en getUsuarioByEmail / getUsuariosByEmails (:508, :517), que
-- es lo que sostiene chats y perfiles. Postgres exige privilegio SELECT sobre
-- las columnas usadas en el WHERE, así que un grant por columna sin `email`
-- rompería también el filtrado.
--
-- Es el mismo bloqueo que ya documenta docs/plan-seguridad-authuid.md: depende
-- de migrar la identidad de email mutable a auth.uid(). Hacerlo requiere su
-- propia sesión con backup; ver ese plan.
-- ═══════════════════════════════════════════════════════════════════════════
