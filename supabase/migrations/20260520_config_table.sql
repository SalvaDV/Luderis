-- Tabla de configuración global de la plataforma (gestionada desde el panel admin)
create table if not exists public.config (
  clave            text primary key,
  valor            text not null,
  actualizado_por  text,
  updated_at       timestamptz default now()
);

-- Solo admins pueden leer y escribir (via admin-actions con service role)
alter table public.config enable row level security;

create policy "solo_admins_leen_config" on public.config
  for select using (
    exists (
      select 1 from public.usuarios
      where email = auth.jwt() ->> 'email'
        and rol = 'admin'
    )
  );

-- Insertar valores por defecto si no existen
insert into public.config (clave, valor, actualizado_por) values
  ('comision_pct',               '10',   'sistema'),
  ('max_publicaciones_docente',  '20',   'sistema'),
  ('verificacion_ia_activa',     'true', 'sistema'),
  ('mp_activo',                  'true', 'sistema'),
  ('stripe_activo',              'false','sistema')
on conflict (clave) do nothing;
