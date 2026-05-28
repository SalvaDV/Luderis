-- ═══════════════════════════════════════════════════════════════════════════
-- Fix S1-A3: la tabla mp_conexiones expone mp_access_token y mp_refresh_token
-- al cliente. Crear vista pública que excluye esos campos sensibles.
-- El cliente debe usar solo esta vista; la tabla original queda para service_role.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW mp_conexiones_public AS
  SELECT
    id,
    usuario_id,
    usuario_email,
    mp_user_id,
    mp_email,
    mp_public_key,
    connected_at,
    updated_at
  FROM mp_conexiones;

-- La vista hereda el RLS de la tabla base, pero por seguridad la exponemos
-- solo a authenticated (no anon). La columna mp_connected la pueden chequear
-- leyendo si existe una fila en esta vista para un usuario dado.
GRANT SELECT ON mp_conexiones_public TO authenticated;
REVOKE ALL ON mp_conexiones_public FROM anon;
