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


-- ═══════════════════════════════════════════════════════════════════════════
-- PASO B de 2 — DESTRUCTIVO, se aplica DESPUÉS de que el deploy esté vivo.
-- Corta la escritura directa del cliente sobre `inscripciones`. Aplicarlo antes
-- del deploy rompe inscribirse y finalizar clase en la app que está corriendo.
-- Requiere que el paso A ya esté aplicado (las RPCs tienen que existir).
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists "inscripciones insert own" on public.inscripciones;
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

