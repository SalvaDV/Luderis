-- ═══════════════════════════════════════════════════════════════════════════
-- FIX (producción): el admin no veía ninguna verificación pendiente
--
-- supabase.ts pide el embed `usuarios!verificaciones_usuario_usuario_id_fkey`
-- para listar las verificaciones pendientes, pero `verificaciones_usuario` no
-- tenía NINGUNA foreign key. PostgREST no podía resolver la relación y devolvía
--   "Could not find a relationship between 'verificaciones_usuario' and
--    'usuarios' in the schema cache"
-- La llamada está envuelta en `.catch(() => [])`, así que fallaba en silencio:
-- el panel mostraba la lista vacía. Había 10 verificaciones pendientes reales
-- que ningún admin podía ver ni aprobar.
--
-- Se crea el FK con el nombre que la query ya espera (y que además es la
-- convención por defecto de Postgres, igual que el resto de las tablas que
-- referencian usuarios). Verificado antes de aplicar: 0 filas huérfanas y 0 con
-- usuario_id nulo, así que la constraint valida sin tocar datos.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.verificaciones_usuario
  ADD CONSTRAINT verificaciones_usuario_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;

-- PostgREST cachea el schema: sin esto el embed sigue fallando hasta el próximo
-- reload automático.
NOTIFY pgrst, 'reload schema';
