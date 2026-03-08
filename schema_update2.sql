-- Agregar columna activo
alter table publicaciones
  add column if not exists activo boolean default true;

-- Políticas para que cada usuario pueda editar y eliminar sus propias publicaciones
create policy "users can update own publicaciones" on publicaciones
  for update using (autor_email = auth.jwt() ->> 'email');

create policy "users can delete own publicaciones" on publicaciones
  for delete using (autor_email = auth.jwt() ->> 'email');
