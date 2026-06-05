-- ═══════════════════════════════════════════════════════════════════════════
-- Tanda 2 — Hardening de seguridad (Security Advisor 2026-06-05)
--
-- 1. pagos      : RLS habilitada SIN policies → las lecturas del cliente volvían
--                 vacías en silencio (dashboard de cobros del docente roto).
--                 Agregamos SELECT para alumno/docente/admin. Las escrituras
--                 siguen siendo exclusivas del webhook (service_role bypassa RLS).
-- 2. categorias : RLS habilitada SIN policies → datos de referencia públicos
--                 inaccesibles. Agregamos SELECT público.
-- 3. grants     : anon/authenticated tenían INSERT/UPDATE/DELETE/TRUNCATE sobre
--                 pagos y categorias (default de Supabase). Defensa en profundidad:
--                 revocamos escrituras (RLS ya las bloqueaba, pero evita sorpresas
--                 si alguien agrega una policy permisiva en el futuro).
-- 4. avatars    : el bucket público no necesita policy SELECT amplia para servir
--                 imágenes por URL pública; esa policy solo habilitaba LISTAR/
--                 enumerar todos los archivos. La eliminamos.
--
-- NOTA: NO se toca el schema `trading` (proyecto personal separado).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. pagos: SELECT para las partes involucradas + admin ───────────────────
DROP POLICY IF EXISTS pagos_select_partes ON public.pagos;
CREATE POLICY pagos_select_partes ON public.pagos
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = alumno_email
    OR auth.jwt() ->> 'email' = docente_email
    OR EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.email = auth.jwt() ->> 'email' AND u.rol = 'admin'
    )
  );

-- ── 2. categorias: lectura pública (datos de referencia) ────────────────────
DROP POLICY IF EXISTS categorias_select_public ON public.categorias;
CREATE POLICY categorias_select_public ON public.categorias
  FOR SELECT
  USING (true);

-- ── 3. Revocar escrituras del cliente (defensa en profundidad) ──────────────
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.pagos      FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.categorias FROM anon, authenticated;
-- anon no necesita leer pagos (no tiene email en el JWT igual)
REVOKE SELECT ON public.pagos FROM anon;

-- ── 4. avatars: cortar el listado/enumeración del bucket público ────────────
-- La visualización sigue funcionando vía /storage/v1/object/public/avatars/...
DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
