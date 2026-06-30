-- Idempotencia de acreditación en mp-webhook.
-- MP entrega webhooks at-least-once (reintentos + notificaciones repetidas del
-- mismo pago). Sin una marca atómica, el bloque que acredita al docente
-- (incrementar_saldo + billetera_movimientos) corría en cada entrega → doble cobro.
-- mp-webhook ahora reclama la acreditación con un compare-and-swap sobre esta
-- columna: UPDATE ... SET acreditado_at=now() WHERE mp_payment_id=X AND acreditado_at IS NULL.
-- Solo la primera entrega gana el claim y acredita; las repetidas matchean 0 filas.
alter table public.pagos add column if not exists acreditado_at timestamptz;
comment on column public.pagos.acreditado_at is 'Marca de idempotencia: cuándo el webhook acreditó por primera vez este pago (CAS para evitar doble-acreditación en entregas repetidas de MP).';
