-- ═══════════════════════════════════════════════════════════════════════════
-- S2-M1: Alertas de búsqueda
-- Permite a usuarios guardar filtros de búsqueda y recibir notificaciones
-- cuando se publican nuevas clases que coincidan con sus criterios.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Tabla ──────────────────────────────────────────────────────────────
CREATE TABLE alertas_busqueda (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  usuario_email   text        NOT NULL,
  nombre          text        NOT NULL DEFAULT '',   -- etiqueta descriptiva auto-generada
  materia         text,                              -- null = cualquier materia
  modo            text,                              -- null = cualquier modo
  tipo            text,                              -- null = cualquier tipo
  precio_max      numeric,                           -- null = sin límite
  ubicacion       text,                              -- null = cualquier ciudad
  activa          boolean     DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  ultima_notif_at timestamptz                        -- desde cuándo buscar publicaciones nuevas
);

-- Evitar alertas duplicadas por usuario con exactamente los mismos filtros
CREATE UNIQUE INDEX uq_alerta_usuario_filtros
  ON alertas_busqueda (usuario_id,
    COALESCE(materia,  '__any__'),
    COALESCE(modo,     '__any__'),
    COALESCE(tipo,     '__any__'),
    COALESCE(precio_max::text, '__any__'),
    COALESCE(ubicacion,'__any__'));

-- ── 2. RLS ────────────────────────────────────────────────────────────────
ALTER TABLE alertas_busqueda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alertas_select_own" ON alertas_busqueda
  FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "alertas_insert_own" ON alertas_busqueda
  FOR INSERT WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "alertas_update_own" ON alertas_busqueda
  FOR UPDATE USING (usuario_id = auth.uid());

CREATE POLICY "alertas_delete_own" ON alertas_busqueda
  FOR DELETE USING (usuario_id = auth.uid());

-- ── 3. Función de chequeo (corre con SECURITY DEFINER para acceder a todo) ──
CREATE OR REPLACE FUNCTION check_alertas_busqueda()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  alerta  RECORD;
  pub     RECORD;
  cnt     INTEGER := 0;
  desde   timestamptz;
BEGIN
  FOR alerta IN
    SELECT * FROM alertas_busqueda WHERE activa = true
  LOOP
    desde := COALESCE(alerta.ultima_notif_at, NOW() - INTERVAL '25 hours');

    FOR pub IN
      SELECT p.id, p.titulo, p.autor_id
      FROM publicaciones p
      WHERE
        p.created_at > desde
        AND p.activo    = true
        AND (p.finalizado IS NULL OR p.finalizado = false)
        AND p.autor_id != alerta.usuario_id
        AND (alerta.materia   IS NULL OR p.materia   = alerta.materia)
        AND (alerta.modo      IS NULL OR p.modo      = alerta.modo)
        AND (alerta.tipo      IS NULL OR p.tipo      = alerta.tipo)
        AND (alerta.ubicacion IS NULL OR p.ubicacion ILIKE '%' || alerta.ubicacion || '%')
        AND (alerta.precio_max IS NULL OR p.precio IS NULL OR p.precio <= alerta.precio_max)
    LOOP
      INSERT INTO notificaciones (usuario_id, alumno_email, tipo, publicacion_id, pub_titulo, leida, metadata)
      SELECT
        alerta.usuario_id,
        alerta.usuario_email,
        'alerta_busqueda',
        pub.id,
        pub.titulo,
        false,
        jsonb_build_object('alerta_nombre', alerta.nombre)
      WHERE NOT EXISTS (
        SELECT 1 FROM notificaciones n
        WHERE n.usuario_id       = alerta.usuario_id
          AND n.publicacion_id   = pub.id
          AND n.tipo             = 'alerta_busqueda'
      );

      cnt := cnt + 1;
    END LOOP;

    UPDATE alertas_busqueda
    SET ultima_notif_at = NOW()
    WHERE id = alerta.id;
  END LOOP;

  RETURN cnt;
END;
$$;

-- ── 4. Cron job: se ejecuta cada día a las 8:00 UTC ───────────────────────
SELECT cron.schedule(
  'check-alertas-busqueda',
  '0 8 * * *',
  'SELECT check_alertas_busqueda()'
);
