-- Agregar columnas nuevas a publicaciones
alter table publicaciones
  add column if not exists autor_email text,
  add column if not exists precio numeric,
  add column if not exists precio_tipo text default 'hora',
  add column if not exists fecha_inicio date,
  add column if not exists fecha_fin date;

-- Agregar política para update y delete propios
create policy "users can insert own publicaciones" on publicaciones
  for insert with check (true);

create policy "public read mensajes" on mensajes
  for select using (true);

create policy "public insert mensajes" on mensajes
  for insert with check (true);
