-- ═══════════════════════════════════════════════════════════════════════════
-- Tanda 2 — Lockdown de billetera (prevención de inflación de saldo)
--
-- PROBLEMA detectado:
--   • billetera tenía policies de INSERT/UPDATE para el propio usuario
--     (auth.uid() = usuario_id) SIN restricción de columna → un usuario podía
--     hacer PATCH billetera?usuario_id=eq.<él> {saldo: 999999} e inflar su saldo.
--   • billetera_movimientos tenía INSERT con WITH CHECK (true) para `public`
--     → cualquiera podía insertar movimientos de billetera falsos.
--
-- El saldo SOLO debe modificarlo el backend:
--   - webhook mp-webhook (service_role, bypassa RLS)
--   - RPC incrementar_saldo / liberar_pago_clase (SECURITY DEFINER, bypassa RLS)
--
-- Verificado: el frontend SOLO lee estas tablas (MiCuentaPage BilleteraTab),
-- nunca las escribe. Por lo tanto revocar la escritura del cliente no rompe nada.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── billetera: el cliente solo puede LEER su propia billetera ───────────────
DROP POLICY IF EXISTS billetera_insert ON public.billetera;
DROP POLICY IF EXISTS billetera_update ON public.billetera;
-- (se conserva billetera_read: auth.uid() = usuario_id)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.billetera FROM anon, authenticated;
REVOKE SELECT ON public.billetera FROM anon;

-- ── billetera_movimientos: el cliente solo puede LEER sus movimientos ───────
DROP POLICY IF EXISTS bil_mov_insert ON public.billetera_movimientos;
-- (se conserva bil_mov_read: auth.uid() = usuario_id)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.billetera_movimientos FROM anon, authenticated;
REVOKE SELECT ON public.billetera_movimientos FROM anon;
