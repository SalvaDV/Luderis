-- Métrica agregada "responde rápido" para el perfil público.
-- RLS impide que un visitante lea los mensajes del docente, así que la mediana
-- se calcula server-side (SECURITY DEFINER) y solo se expone el número
-- (sin contenido ni contrapartes). Ventana: últimos 90 días. El frontend solo
-- muestra el badge con muestras >= 3.
create or replace function public.get_tiempo_respuesta_docente(p_email text)
returns jsonb
language sql
security definer
set search_path to 'public','pg_temp'
stable
as $$
  select jsonb_build_object(
    'mediana_min', round((percentile_cont(0.5) within group (
        order by extract(epoch from (r.resp_at - m.created_at))/60
      ))::numeric)::int,
    'muestras', count(*)
  )
  from mensajes m
  cross join lateral (
    select r.created_at as resp_at
    from mensajes r
    where r.de_nombre = p_email
      and r.para_nombre = m.de_nombre
      and coalesce(r.publicacion_id::text,'') = coalesce(m.publicacion_id::text,'')
      and r.created_at > m.created_at
    order by r.created_at
    limit 1
  ) r
  where m.para_nombre = p_email
    and m.de_nombre <> p_email
    and m.created_at > now() - interval '90 days';
$$;

revoke execute on function public.get_tiempo_respuesta_docente(text) from public;
revoke execute on function public.get_tiempo_respuesta_docente(text) from anon;
grant execute on function public.get_tiempo_respuesta_docente(text) to authenticated;
