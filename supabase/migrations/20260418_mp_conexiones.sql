-- ═══════════════════════════════════════════════════════════════════════════
-- MP Marketplace — Fase 3
-- Tabla para almacenar las conexiones OAuth de los docentes con Mercado Pago
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mp_conexiones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        UUID NOT NULL UNIQUE,
  usuario_email     TEXT NOT NULL UNIQUE,
  mp_user_id        TEXT NOT NULL,        -- collector_id del docente en MP
  mp_email          TEXT,                  -- email registrado en MP del docente
  mp_access_token   TEXT NOT NULL,         -- token OAuth del docente
  mp_refresh_token  TEXT,
  mp_public_key     TEXT,
  connected_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mp_conexiones_email ON mp_conexiones(usuario_email);

-- RLS: solo el propio usuario y el service role pueden ver/modificar su conexión
ALTER TABLE mp_conexiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mp_conexiones_select_own" ON mp_conexiones
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "mp_conexiones_delete_own" ON mp_conexiones
  FOR DELETE USING (auth.uid() = usuario_id);

-- INSERT/UPDATE solo desde service role (Edge Function con SUPABASE_SERVICE_ROLE_KEY)
-- No se expone al cliente directamente
