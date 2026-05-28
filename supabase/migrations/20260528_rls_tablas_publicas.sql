-- ═══════════════════════════════════════════════════════════════════════════
-- Fix S1-C4: RLS para tablas reseñas, mensajes y denuncias
-- Estas tablas no tenían Row Level Security habilitado.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── reseñas ───────────────────────────────────────────────────────────────
ALTER TABLE "reseñas" ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer reseñas (son públicas por diseño)
CREATE POLICY "resenas_select_public" ON "reseñas"
  FOR SELECT USING (true);

-- Solo el autor puede insertar su propia reseña
CREATE POLICY "resenas_insert_own" ON "reseñas"
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = autor_email);

-- Solo el autor puede editar su reseña
CREATE POLICY "resenas_update_own" ON "reseñas"
  FOR UPDATE USING (auth.jwt() ->> 'email' = autor_email);

-- ── mensajes ──────────────────────────────────────────────────────────────
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

-- Solo el emisor o receptor pueden leer un mensaje
CREATE POLICY "mensajes_select_participante" ON mensajes
  FOR SELECT USING (
    auth.jwt() ->> 'email' = de_nombre
    OR auth.jwt() ->> 'email' = para_nombre
  );

-- Solo el emisor puede insertar
CREATE POLICY "mensajes_insert_own" ON mensajes
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = de_nombre);

-- Solo el receptor puede marcar como leído (PATCH leido=true)
CREATE POLICY "mensajes_update_receptor" ON mensajes
  FOR UPDATE USING (auth.jwt() ->> 'email' = para_nombre);

-- ── denuncias ─────────────────────────────────────────────────────────────
ALTER TABLE denuncias ENABLE ROW LEVEL SECURITY;

-- El autor puede leer sus propias denuncias; admins pueden leer todas
CREATE POLICY "denuncias_select" ON denuncias
  FOR SELECT USING (
    auth.jwt() ->> 'email' = autor_email
    OR EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email' AND u.rol = 'admin'
    )
  );

-- Cualquier usuario autenticado puede crear una denuncia
CREATE POLICY "denuncias_insert_auth" ON denuncias
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' = autor_email
    AND auth.role() = 'authenticated'
  );
