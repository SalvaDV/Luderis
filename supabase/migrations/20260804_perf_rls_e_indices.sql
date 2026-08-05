-- ═══════════════════════════════════════════════════════════════════════════
-- Performance de RLS e índices (auditoría 2026-08-04)
-- El advisor de performance devolvió 279 avisos. Acá se atacan los dos grupos
-- mecánicos y seguros; el tercero (policies permisivas duplicadas) se documenta
-- al final porque consolidarlas es una decisión por tabla, no un reemplazo.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. auth_rls_initplan (113 avisos) ──────────────────────────────────────
-- `auth.uid()` / `auth.email()` / `auth.jwt()` / `auth.role()` sueltos dentro de
-- una policy se re-evalúan UNA VEZ POR FILA. Envolviéndolos en un subselect,
-- Postgres los computa una sola vez por query (InitPlan). Es el costo oculto que
-- dejó el hardening de RLS de julio: mismo resultado, mucho menos CPU.
--
-- La reescritura es puramente sintáctica y se salta lo que ya está envuelto.
do $$
declare
  r record;
  v_qual  text;
  v_check text;
  v_sql   text;
  n int := 0;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
      from pg_policies
     where schemaname = 'public'
       and (coalesce(qual, '')       ~ 'auth\.(uid|email|jwt|role)\(\)'
         or coalesce(with_check, '') ~ 'auth\.(uid|email|jwt|role)\(\)')
       -- Saltear las que ya están envueltas: Postgres las renderiza como
       -- "( SELECT auth.uid() AS uid)", así que basta con buscar esa forma.
       and coalesce(qual, '')       !~* 'select auth\.'
       and coalesce(with_check, '') !~* 'select auth\.'
  loop
    v_qual  := regexp_replace(r.qual,       '(auth\.(uid|email|jwt|role)\(\))', '(select \1)', 'g');
    v_check := regexp_replace(r.with_check, '(auth\.(uid|email|jwt|role)\(\))', '(select \1)', 'g');

    v_sql := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    if v_qual  is not null then v_sql := v_sql || format(' using (%s)', v_qual); end if;
    if v_check is not null then v_sql := v_sql || format(' with check (%s)', v_check); end if;

    execute v_sql;
    n := n + 1;
  end loop;
  raise notice 'policies reescritas para InitPlan: %', n;
end $$;

-- ── 2. Foreign keys sin índice (19 avisos) ─────────────────────────────────
-- Sin CONCURRENTLY a propósito: las migraciones corren dentro de una
-- transacción y CREATE INDEX CONCURRENTLY no lo permite. Con el volumen
-- actual (tablas casi vacías) el lock es instantáneo.
-- Sin índice de cobertura, cada join o borrado en cascada por esa FK termina en
-- seq scan. Varias son del circuito de dinero.
create index if not exists idx_alertas_busquedas_usuario_id
  on public.alertas_busquedas (usuario_id);
create index if not exists idx_alertas_publicacion_usuario_id
  on public.alertas_publicacion (usuario_id);
create index if not exists idx_billetera_mov_clase_realizada_id
  on public.billetera_movimientos (clase_realizada_id);
create index if not exists idx_billetera_mov_publicacion_id
  on public.billetera_movimientos (publicacion_id);
create index if not exists idx_eval_entregas_evaluacion_id
  on public.evaluacion_entregas (evaluacion_id);
create index if not exists idx_eval_entregas_publicacion_id
  on public.evaluacion_entregas (publicacion_id);
create index if not exists idx_evaluaciones_publicacion_id
  on public.evaluaciones (publicacion_id);
create index if not exists idx_foro_posts_publicacion_id
  on public.foro_posts (publicacion_id);
create index if not exists idx_foro_respuestas_foro_post_id
  on public.foro_respuestas (foro_post_id);
create index if not exists idx_notificaciones_publicacion_id
  on public.notificaciones (publicacion_id);
create index if not exists idx_push_subs_user_id
  on public.push_subscriptions (user_id);
create index if not exists idx_puzzle_results_puzzle_id
  on public.puzzle_results (puzzle_id);
create index if not exists idx_quiz_entregas_publicacion_id
  on public.quiz_entregas (publicacion_id);
create index if not exists idx_quiz_entregas_quiz_id
  on public.quiz_entregas (quiz_id);
create index if not exists idx_referidos_referidor_id
  on public.referidos (referidor_id);
create index if not exists idx_resenias_clase_realizada_id
  on public."reseñas" (clase_realizada_id);
create index if not exists idx_skills_publicacion_id
  on public.skills (publicacion_id);
create index if not exists idx_solicitudes_retiro_usuario_id
  on public.solicitudes_retiro (usuario_id);
create index if not exists idx_user_skill_levels_skill_id
  on public.user_skill_levels (skill_id);

-- Índice para el chequeo cruzado que agregó liberar-pago (ledger por pago).
create index if not exists idx_billetera_mov_mp_payment_id
  on public.billetera_movimientos (mp_payment_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PENDIENTE, a mano: multiple_permissive_policies (123 avisos)
--
-- Cuando una tabla tiene varias policies PERMISSIVE para el mismo rol y la misma
-- acción, Postgres evalúa TODAS y las combina con OR, en cada query. Las peores:
-- alertas_publicacion y verificaciones_usuario (20 c/u), notificaciones y
-- quiz_entregas (15 c/u).
--
-- Consolidarlas es semánticamente equivalente pero hay que hacerlo tabla por
-- tabla y verificando, porque un OR mal transcripto abre o cierra acceso. El
-- patrón, por ejemplo en `notificaciones`, donde hoy conviven dos policies de
-- SELECT ("read by email" y "read own"):
--
--   drop policy "notificaciones read by email" on public.notificaciones;
--   drop policy "notificaciones read own"      on public.notificaciones;
--   create policy "notificaciones read" on public.notificaciones
--     for select to authenticated
--     using (alumno_email = (select auth.email()) or usuario_id = (select auth.uid()));
--
-- Los 24 índices no usados que reporta el advisor tampoco se dropean acá: con
-- volumen ~0 en producción, "nunca usado" todavía no significa "inútil". Revisar
-- después de acumular tráfico real.
-- ═══════════════════════════════════════════════════════════════════════════
