-- Índices idénticos duplicados (advisor duplicate_index): mismo costo de escritura
-- dos veces sin beneficio. Se conserva uno por par.
drop index if exists public.idx_insc_pub;                      -- queda idx_inscripciones_publicacion_id
drop index if exists public.idx_msgs_pub;                      -- queda idx_mensajes_publicacion_id
drop index if exists public.idx_pubs_autor_id;                 -- queda idx_publicaciones_autor_id
drop index if exists public.idx_pubs_created;                  -- queda idx_publicaciones_created_at
drop index if exists public.idx_pubs_tipo;                     -- queda idx_publicaciones_tipo
drop index if exists public."idx_reseñas_pub";                 -- queda idx_reseñas_publicacion_id
