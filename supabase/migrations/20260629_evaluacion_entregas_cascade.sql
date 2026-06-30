-- Consistencia de borrado: evaluacion_entregas.publicacion_id quedaba en NO ACTION
-- mientras el resto de las hijas de publicaciones cascadean. Eso hacía que borrar
-- una publicación con entregas de examen fallara con error de FK. Lo unificamos a
-- ON DELETE CASCADE (igual que evaluaciones, quiz_entregas, progreso_modulos, etc.).
alter table public.evaluacion_entregas drop constraint evaluacion_entregas_publicacion_id_fkey;
alter table public.evaluacion_entregas add constraint evaluacion_entregas_publicacion_id_fkey
  foreign key (publicacion_id) references public.publicaciones(id) on delete cascade;
