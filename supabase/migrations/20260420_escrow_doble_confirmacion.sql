-- ═══════════════════════════════════════════════════════════════════════════
-- Escrow — Doble confirmación (alumno + docente)
-- Corrige vulnerabilidad: un docente podía marcar clase_finalizada sin dictarla
-- y cobrar automáticamente a las 72hs si el alumno no disputaba.
--
-- Flujo nuevo:
--   1. Docente marca inscripciones.clase_finalizada = true
--      → NO pasa a "retenido" todavía
--      → Se notifica al alumno para confirmar
--   2. Alumno marca inscripciones.alumno_confirmada = true
--      → pago.estado_escrow pasa a "retenido"
--      → Arranca ventana de 72hs para disputa (retrocompat)
--   3. Si pasan 7 días sin respuesta del alumno y sin disputa → auto-confirmación
--      (previene deadlock si el alumno ghostea)
--   4. Después de 72hs en "retenido" sin disputa → "liberado" (como antes)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Nuevas columnas en inscripciones
ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS alumno_confirmada BOOLEAN DEFAULT false;
ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS alumno_confirmada_at TIMESTAMPTZ;
ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS clase_finalizada_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_inscripciones_alumno_confirmada
  ON inscripciones(alumno_confirmada) WHERE alumno_confirmada = false;
CREATE INDEX IF NOT EXISTS idx_inscripciones_clase_finalizada_at
  ON inscripciones(clase_finalizada_at) WHERE clase_finalizada = true;

-- 2. BEFORE trigger: setea timestamps automáticos
CREATE OR REPLACE FUNCTION fn_inscripcion_set_timestamps()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.clase_finalizada = true
     AND (OLD.clase_finalizada IS NULL OR OLD.clase_finalizada = false)
     AND NEW.clase_finalizada_at IS NULL THEN
    NEW.clase_finalizada_at := NOW();
  END IF;
  IF NEW.alumno_confirmada = true
     AND (OLD.alumno_confirmada IS NULL OR OLD.alumno_confirmada = false)
     AND NEW.alumno_confirmada_at IS NULL THEN
    NEW.alumno_confirmada_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inscripcion_set_timestamps ON inscripciones;
CREATE TRIGGER trg_inscripcion_set_timestamps
  BEFORE UPDATE OF clase_finalizada, alumno_confirmada ON inscripciones
  FOR EACH ROW EXECUTE FUNCTION fn_inscripcion_set_timestamps();

-- 3. AFTER trigger: mover pago a "retenido" sólo si AMBAS partes confirmaron
CREATE OR REPLACE FUNCTION fn_inscripcion_finalizada()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.clase_finalizada = true
     AND NEW.alumno_confirmada = true
     AND (OLD.clase_finalizada IS DISTINCT FROM NEW.clase_finalizada
          OR OLD.alumno_confirmada IS DISTINCT FROM NEW.alumno_confirmada) THEN
    UPDATE pagos
    SET
      estado_escrow       = 'retenido',
      clase_finalizada_at = COALESCE(clase_finalizada_at, NOW())
    WHERE
      publicacion_id = NEW.publicacion_id
      AND alumno_email = NEW.alumno_email
      AND estado = 'approved'
      AND estado_escrow = 'pendiente';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inscripcion_finalizada ON inscripciones;
CREATE TRIGGER trg_inscripcion_finalizada
  AFTER UPDATE OF clase_finalizada, alumno_confirmada ON inscripciones
  FOR EACH ROW EXECUTE FUNCTION fn_inscripcion_finalizada();

-- 4. Auto-confirmación: si docente marcó hace +7 días y alumno no respondió ni disputó
CREATE OR REPLACE FUNCTION fn_auto_confirmar_alumno()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  confirmados INTEGER;
BEGIN
  UPDATE inscripciones
  SET
    alumno_confirmada    = true,
    alumno_confirmada_at = NOW()
  WHERE
    clase_finalizada = true
    AND (alumno_confirmada IS NULL OR alumno_confirmada = false)
    AND clase_finalizada_at < NOW() - INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM disputas d
      JOIN pagos p ON p.id = d.pago_id
      WHERE p.publicacion_id = inscripciones.publicacion_id
        AND p.alumno_email   = inscripciones.alumno_email
        AND d.estado         = 'abierta'
    );
  GET DIAGNOSTICS confirmados = ROW_COUNT;
  RETURN confirmados;
END;
$$;

-- 5. Actualizar cron: auto-confirmar primero, después liberar (en orden)
SELECT cron.unschedule('liberar_pagos_vencidos') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'liberar_pagos_vencidos'
);

SELECT cron.schedule(
  'liberar_pagos_vencidos',
  '0 3 * * *',
  $$
    SELECT fn_auto_confirmar_alumno();
    SELECT fn_liberar_pagos_vencidos();
  $$
);

-- 6. Backfill: para inscripciones existentes con clase_finalizada=true pero sin
--    clase_finalizada_at, asumimos fecha actual como baseline conservador.
UPDATE inscripciones
SET clase_finalizada_at = NOW()
WHERE clase_finalizada = true AND clase_finalizada_at IS NULL;

-- Para las ya finalizadas sin doble confirmación, damos 7 días de gracia al alumno
-- antes de auto-confirmar (se procesará en el próximo run del cron).

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS: el alumno puede confirmar sólo sus propias inscripciones
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inscripciones'
      AND policyname = 'inscripciones_alumno_update_confirmacion'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "inscripciones_alumno_update_confirmacion" ON inscripciones
        FOR UPDATE
        USING (auth.jwt() ->> 'email' = alumno_email)
        WITH CHECK (auth.jwt() ->> 'email' = alumno_email)
    $POLICY$;
  END IF;
END$$;
