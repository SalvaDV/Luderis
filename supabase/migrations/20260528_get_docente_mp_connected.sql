-- ═══════════════════════════════════════════════════════════════════════════
-- Fix S2-C2: función para verificar si un docente tiene MP Connect activo.
-- La tabla mp_conexiones tiene RLS que sólo permite ver filas propias.
-- Esta función SECURITY DEFINER corre con permisos del owner y permite
-- que cualquier usuario autenticado verifique si otro usuario tiene MP.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_docente_mp_connected(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM mp_conexiones WHERE usuario_email = p_email
  );
$$;

-- Solo usuarios autenticados pueden llamar esta función
REVOKE ALL ON FUNCTION get_docente_mp_connected(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_docente_mp_connected(TEXT) TO authenticated;
