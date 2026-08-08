-- Un caso aislado de "él dice una cosa y yo otra" es irresoluble; la repetición
-- no. Un alumno que objeta todas sus clases está sacando clases gratis, y un
-- docente objetado siempre está inflando horas. Eso se ve contando, y la
-- sanción vive en la cuenta, no en la resolución caso por caso.
--
-- Se cuenta la objeción aunque después se haya resuelto: objetada_at se limpia
-- cuando el docente acepta, así que hay que mirar también las disputas.
--
-- El filtro de admin va DENTRO de la vista (mismo criterio que
-- admin_escrow_retenido): la vista no es security_invoker, así que sin el
-- chequeo acá expondría el historial de todos.
create or replace view public.admin_patron_disputas as
with marcadas as (
  select cr.id, cr.alumno_email, cr.docente_email,
         (cr.objetada_at is not null
          or exists (select 1 from public.disputas d where d.clase_realizada_id = cr.id)) as hubo_objecion
    from public.clases_realizadas cr
), alu as (
  select alumno_email as email, count(*) as clases,
         count(*) filter (where hubo_objecion) as objetadas
    from marcadas group by alumno_email
), doc as (
  select docente_email as email, count(*) as clases,
         count(*) filter (where hubo_objecion) as objetadas
    from marcadas group by docente_email
)
select
  coalesce(a.email, d.email)   as email,
  coalesce(a.clases, 0)        as clases_como_alumno,
  coalesce(a.objetadas, 0)     as objeto_veces,
  coalesce(d.clases, 0)        as clases_como_docente,
  coalesce(d.objetadas, 0)     as fue_objetado_veces
from alu a
full join doc d on d.email = a.email
where exists (select 1 from public.usuarios u
               where u.id = (select auth.uid()) and u.rol = 'admin');

revoke all on public.admin_patron_disputas from public, anon;
grant select on public.admin_patron_disputas to authenticated, service_role;
