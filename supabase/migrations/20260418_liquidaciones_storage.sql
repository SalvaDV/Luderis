-- ═══════════════════════════════════════════════════════════════════════════
-- Liquidaciones Storage Bucket — Fase 4
-- Bucket privado para PDFs de liquidaciones mensuales de docentes
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Crear bucket "liquidaciones" (privado — solo service role o el propio docente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'liquidaciones',
  'liquidaciones',
  false,
  5242880,  -- 5 MB max por PDF
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS en storage.objects para el bucket liquidaciones

-- El docente puede leer sus propias liquidaciones
-- Path esperado: "{docente_email}/{periodo}.pdf"  ej: "juan@example.com/2026-04.pdf"
CREATE POLICY "liquidaciones_docente_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'liquidaciones'
    AND auth.jwt() ->> 'email' = split_part(name, '/', 1)
  );

-- Solo service role puede insertar/actualizar (Edge Function usa service key)
-- No necesitamos policy de INSERT para usuarios porque solo lo hace la EF con service_role

-- 3. Programar el cron de liquidaciones el día 1 de cada mes a las 04:00 UTC
--    Requiere pg_cron habilitado en Supabase Dashboard → Extensions
--    Requiere también que la EF generar-liquidacion esté deployada y que
--    GENERAR_LIQ_SECRET esté configurado como env var.
--
-- Si pg_cron no está habilitado todavía, ejecutar esto manualmente después:
--
-- SELECT cron.unschedule('generar_liquidaciones_mensuales')
-- WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generar_liquidaciones_mensuales');
--
-- SELECT cron.schedule(
--   'generar_liquidaciones_mensuales',
--   '0 4 1 * *',
--   $$
--     SELECT net.http_post(
--       url      := current_setting('app.supabase_url') || '/functions/v1/generar-liquidacion',
--       headers  := jsonb_build_object(
--                     'Content-Type', 'application/json',
--                     'Authorization', 'Bearer ' || current_setting('app.generar_liq_secret')
--                   ),
--       body     := '{"periodo":null}'::jsonb
--     );
--   $$
-- );
