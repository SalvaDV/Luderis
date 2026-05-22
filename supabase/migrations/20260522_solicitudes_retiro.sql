create table if not exists public.solicitudes_retiro (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid references public.usuarios(id) on delete cascade,
  email         text not null,
  nombre        text,
  monto         numeric(12,2) not null check (monto > 0),
  cbu_alias     text not null,
  titular       text not null,
  estado        text not null default 'pendiente' check (estado in ('pendiente','procesado','rechazado')),
  notas_admin   text,
  created_at    timestamptz default now(),
  procesado_at  timestamptz
);

alter table public.solicitudes_retiro enable row level security;

create policy "retiros_usuario_lee_propios" on public.solicitudes_retiro
  for select using (usuario_id = auth.uid());

create policy "retiros_usuario_inserta" on public.solicitudes_retiro
  for insert with check (usuario_id = auth.uid());

create policy "retiros_admin_lee_todos" on public.solicitudes_retiro
  for select using (
    exists (select 1 from public.usuarios where email = auth.jwt() ->> 'email' and rol = 'admin')
  );

create policy "retiros_admin_actualiza" on public.solicitudes_retiro
  for update using (
    exists (select 1 from public.usuarios where email = auth.jwt() ->> 'email' and rol = 'admin')
  );
