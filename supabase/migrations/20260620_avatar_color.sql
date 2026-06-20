-- Color de avatar elegible por el usuario, visible en toda la app
-- (cards, ranking, perfil público), no solo en Mi Cuenta.
-- Se guarda en usuarios.avatar_color y se expone en la vista publicaciones_con_autor.

alter table public.usuarios add column if not exists avatar_color text;

-- authenticated puede actualizar su propio color (RLS "usuarios update own" ya limita por id).
grant update (avatar_color) on public.usuarios to authenticated;
-- IMPORTANTE: usuarios usa grants POR COLUMNA. Sin SELECT en la columna nueva, cualquier
-- query que la incluya (getUsuarioByIdFull/ByEmail) falla con 42501 → 401 y NO carga el
-- perfil (avatar/banner se ven default). Replicamos los grants de avatar_url.
grant select (avatar_color) on public.usuarios to anon, authenticated;

-- Exponer el color en la vista que usan las cards/ranking (columna nueva al final).
create or replace view public.publicaciones_con_autor as
 SELECT p.id, p.tipo, p.autor_id, p.titulo, p.descripcion, p.materia, p.categoria_id,
    p.precio, p.precio_tipo, p.moneda, p.modo, p.modalidad, p.ubicacion, p.plataforma,
    p.fecha_inicio, p.fecha_fin, p.sinc, p.duracion_curso, p.dias_clases, p.horario,
    p.duracion_clase, p.clases_sinc, p.activo, p.verificado, p.finalizado,
    p.inscripciones_cerradas, p.ayudantes, p.destacado, p.vistas, p.calificacion_promedio,
    p."cantidad_reseñas", p.cantidad_inscriptos, p.created_at, p.updated_at, p.banner_url,
    p.idioma, p.frecuencia, p.otorga_certificado, p.nivel, p.requisitos, p.max_alumnos,
    p.tiene_prueba, p.precio_prueba, p.paquetes,
    u.nombre AS autor_nombre, u.display_name AS autor_display_name, u.email AS autor_email,
    u.avatar_url AS autor_avatar_url, u.ubicacion AS autor_ubicacion,
    u.avatar_color AS autor_avatar_color
   FROM publicaciones p
     LEFT JOIN usuarios u ON p.autor_id = u.id;
