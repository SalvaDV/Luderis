-- Recordatorio push ~1h antes de cada clase.
-- Dedup: una fila por (publicación, clase semanal, fecha). El edge function
-- recordatorio-clases inserta con ON CONFLICT DO NOTHING: solo el tick del cron
-- que logra insertar envía las push; los demás salen sin duplicar.
create table if not exists public.recordatorios_clase (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones(id) on delete cascade,
  clase_key text not null,          -- "Lunes_18:00"
  fecha date not null,              -- día (AR) al que corresponde el recordatorio
  created_at timestamptz not null default now(),
  unique (publicacion_id, clase_key, fecha)
);
alter table public.recordatorios_clase enable row level security;
-- Sin policies: solo service_role (el edge function) la toca.

-- Secret compartido cron→edge function (valor real seteado en la migración remota;
-- vive en config, que NO es legible por anon/authenticated).
-- insert into public.config (clave, valor) values ('cron_secret_recordatorios', '<secret>')
--   on conflict (clave) do update set valor = excluded.valor;

-- Cron: cada 15 min. La ventana de envío del function es (50,75] min antes de la
-- clase, así siempre cae exactamente un tick dentro (y el dedup absorbe extras).
-- select cron.schedule('recordatorio-clases','*/15 * * * *', $$SELECT net.http_post(
--   url := 'https://<ref>.supabase.co/functions/v1/recordatorio-clases',
--   headers := '{"Content-Type":"application/json","x-cron-key":"<secret>"}'::jsonb,
--   body := '{}'::jsonb)$$);
