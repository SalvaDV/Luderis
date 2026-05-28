-- ═══════════════════════════════════════════════════════════════════════════
-- Fix S1-C1: fn_liberar_pagos_vencidos no excluía disputas abiertas.
-- Un pago disputado podía liberarse automáticamente a las 72hs.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION fn_liberar_pagos_vencidos()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  liberados INTEGER;
BEGIN
  UPDATE pagos
  SET
    estado_escrow = 'liberado',
    liberado_at   = NOW()
  WHERE
    estado_escrow       = 'retenido'
    AND clase_finalizada_at < NOW() - INTERVAL '72 hours'
    AND NOT EXISTS (
      SELECT 1 FROM disputas d
      WHERE d.pago_id = pagos.id AND d.estado = 'abierta'
    );

  GET DIAGNOSTICS liberados = ROW_COUNT;
  RETURN liberados;
END;
$$;
