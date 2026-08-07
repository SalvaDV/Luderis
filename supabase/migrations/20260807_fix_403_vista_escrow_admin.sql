-- El panel de admin consulta con el token del usuario (rol `authenticated`), no
-- con service_role: la vista solo tenía GRANT para service_role, así que
-- PostgREST devolvía 403 y el tablero de escrow no cargaba.
--
-- Se concede a authenticated pero el filtro de admin va DENTRO de la vista: un
-- usuario común la consulta y ve cero filas. La vista no es security_invoker, o
-- sea que bypassea la RLS de las tablas de abajo, así que el chequeo tiene que
-- estar acá o expondría los emails de todos.
create or replace view public.admin_escrow_retenido as
  select
    bm.id                as movimiento_id,
    bm.mp_payment_id,
    bm.inscripcion_id,
    bm.clase_realizada_id,
    bm.monto             as monto_neto,
    bm.comision_luderis,
    coalesce(bm.monto,0) - coalesce(bm.monto_liberado,0) as pendiente_de_liberar,
    bm.created_at,
    bm.expira_at,
    ud.email             as docente_email,
    p.titulo             as publicacion_titulo,
    i.alumno_email,
    cr.fecha_clase,
    cr.duracion_min,
    cr.confirmado_docente,
    cr.confirmado_alumno,
    cr.objetada_at,
    (select count(*) from public.disputas d
      where d.clase_realizada_id = cr.id and d.estado = 'abierta') as disputas_abiertas
  from public.billetera_movimientos bm
  left join public.usuarios      ud on ud.id = bm.usuario_id
  left join public.publicaciones p  on p.id  = bm.publicacion_id
  left join public.inscripciones i  on i.id  = bm.inscripcion_id
  left join public.clases_realizadas cr on cr.id = bm.clase_realizada_id
 where bm.estado = 'pendiente' and bm.tipo = 'cobro_clase'
   and exists (select 1 from public.usuarios u
                where u.id = (select auth.uid()) and u.rol = 'admin');

revoke all on public.admin_escrow_retenido from public, anon;
grant select on public.admin_escrow_retenido to authenticated, service_role;
