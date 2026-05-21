-- Tablas etiquetas y publicacion_tags eliminadas — sin uso en frontend.
-- Si se necesita tagging en el futuro, recrear con una nueva migración.
drop table if exists public.publicacion_tags cascade;
drop table if exists public.etiquetas cascade;
