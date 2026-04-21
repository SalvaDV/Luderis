-- ═══════════════════════════════════════════════════════════════════════════
-- Denormalizar rating agregado en la tabla publicaciones
-- Motivo: ExplorePage hacía N+1 (1 query por publicación) para calcular el
-- promedio de estrellas. Con estas columnas denormalizadas + triggers, la vista
-- `publicaciones_con_autor` ya incluye el rating calculado → 1 sola query.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Columnas nuevas (NULL si no hay reseñas)
-- IMPORTANTE: la vista `publicaciones_con_autor` debe incluir estas columnas.
-- Si la vista hace `SELECT publicaciones.*` ya las recoge automáticamente.
-- Si la vista enumera columnas específicas, hay que recrearla agregando:
--   calificacion_promedio, cantidad_reseñas
ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS calificacion_promedio NUMERIC(3,2);
ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS cantidad_reseñas INTEGER NOT NULL DEFAULT 0;

-- Índice para ordenar por rating
CREATE INDEX IF NOT EXISTS idx_publicaciones_rating
  ON publicaciones(calificacion_promedio DESC NULLS LAST);

-- 2. Backfill: calcular rating actual de todas las publicaciones
WITH agg AS (
  SELECT
    publicacion_id,
    AVG(estrellas)::NUMERIC(3,2) AS avg_estrellas,
    COUNT(*)::INTEGER            AS total
  FROM reseñas
  WHERE estrellas IS NOT NULL
  GROUP BY publicacion_id
)
UPDATE publicaciones p
SET
  calificacion_promedio = agg.avg_estrellas,
  cantidad_reseñas      = agg.total
FROM agg
WHERE p.id = agg.publicacion_id;

-- 3. Trigger para mantener los agregados al día
CREATE OR REPLACE FUNCTION fn_recalc_rating_publicacion(pub_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE publicaciones
  SET
    calificacion_promedio = sub.avg_estrellas,
    cantidad_reseñas      = sub.total
  FROM (
    SELECT
      AVG(estrellas)::NUMERIC(3,2) AS avg_estrellas,
      COUNT(*)::INTEGER            AS total
    FROM reseñas
    WHERE publicacion_id = pub_id AND estrellas IS NOT NULL
  ) AS sub
  WHERE publicaciones.id = pub_id;
END;
$$;

CREATE OR REPLACE FUNCTION fn_resena_after_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM fn_recalc_rating_publicacion(NEW.publicacion_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM fn_recalc_rating_publicacion(OLD.publicacion_id);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.publicacion_id IS DISTINCT FROM NEW.publicacion_id THEN
      PERFORM fn_recalc_rating_publicacion(OLD.publicacion_id);
    END IF;
    PERFORM fn_recalc_rating_publicacion(NEW.publicacion_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_resena_rating_insert ON reseñas;
DROP TRIGGER IF EXISTS trg_resena_rating_update ON reseñas;
DROP TRIGGER IF EXISTS trg_resena_rating_delete ON reseñas;

CREATE TRIGGER trg_resena_rating_insert
  AFTER INSERT ON reseñas
  FOR EACH ROW EXECUTE FUNCTION fn_resena_after_change();

CREATE TRIGGER trg_resena_rating_update
  AFTER UPDATE ON reseñas
  FOR EACH ROW EXECUTE FUNCTION fn_resena_after_change();

CREATE TRIGGER trg_resena_rating_delete
  AFTER DELETE ON reseñas
  FOR EACH ROW EXECUTE FUNCTION fn_resena_after_change();
