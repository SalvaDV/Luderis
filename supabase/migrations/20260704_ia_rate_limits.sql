-- Rate-limiting para los endpoints de IA (ai-proxy, ludy-chat).
-- Ventana fija por clave (usuario), contador atómico en un solo upsert.
-- Solo lo usan las edge functions vía service_role: sin grants a clientes.
create table if not exists public.ia_rate_limits (
  clave text primary key,
  ventana_inicio timestamptz not null default now(),
  contador integer not null default 1
);
alter table public.ia_rate_limits enable row level security;

create or replace function public.ia_rate_check(p_clave text, p_max integer, p_ventana_seg integer)
returns boolean
language sql
security definer
set search_path to 'public','pg_temp'
as $$
  insert into ia_rate_limits as r (clave, ventana_inicio, contador)
  values (p_clave, now(), 1)
  on conflict (clave) do update set
    contador = case when r.ventana_inicio < now() - make_interval(secs => p_ventana_seg)
                    then 1 else r.contador + 1 end,
    ventana_inicio = case when r.ventana_inicio < now() - make_interval(secs => p_ventana_seg)
                          then now() else r.ventana_inicio end
  returning contador <= p_max;
$$;

revoke execute on function public.ia_rate_check(text, integer, integer) from public, anon, authenticated;
