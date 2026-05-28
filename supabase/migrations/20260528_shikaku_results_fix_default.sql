-- Fix: agregar DEFAULT auth.uid() a usuario_id en shikaku_results.
-- Sin este default, el INSERT desde el cliente no pasa usuario_id y falla
-- con NOT NULL violation, impidiendo guardar cualquier resultado.
-- puzzle_results ya lo tenía correctamente; esto lo equipara.

ALTER TABLE shikaku_results
  ALTER COLUMN usuario_id SET DEFAULT auth.uid();
