# Pendientes que dependen de vos (no son código)

Estos ítems no los puedo hacer yo desde el código — necesitan tu acción.

## 1. Mergear y deployar el trabajo de la auditoría
- Branch: `fix/auditoria-tandas-1-2` (17 commits, build OK, 56 tests verdes).
- Mergealo a `main` para deployar el frontend (Vercel).
- ⚠️ Las migraciones de seguridad (RLS de pagos/categorías/billetera, bucket avatars)
  **ya están aplicadas en producción** vía MCP — el merge solo lleva el frontend.

## 2. Pase visual (QA manual)
- `npm start` y recorré: login → onboarding → explorar → detalle → chat → mi cuenta.
- Los cambios de a11y son ARIA/teclado/contraste → no debería haber regresión visual,
  pero conviene confirmarlo (el preview headless no me dejó verificarlo a mí).

## 3. Test con lector de pantalla (cierra Accesibilidad a 10)
- Probar con **NVDA** (Windows) o **VoiceOver** (Mac) los flujos críticos:
  que se anuncien labels, botones, modales (rol "diálogo"), y que el foco quede
  atrapado dentro de los modales y vuelva al cerrar.

## 4. Supabase Pro (cierra Seguridad a 10) — ~US$25/mes
Al activar Pro, configurar en el Dashboard:
- **Authentication → Leaked Password Protection** (chequea contra HaveIBeenPwned).
- **Authentication → MFA** (al menos TOTP).
- **Custom Auth Domain** (`auth.luderis.com`) — el login con Google mostrará
  "Ir a luderis.com" en vez de la URL de supabase. También configurar en Google Cloud Console.
- **SMTP propio** (Resend/SendGrid) — el SMTP built-in tiene rate limit bajo.

## 5. Decisión de marca (opcional)
- El teal de marca `#2EC4A0` no cumple contraste AA como **texto** (2.2:1).
  Ya lo mitigué con un token `successText` (#147D63) que se usa solo para textos,
  dejando el teal intacto en fondos/acentos. Si querés un verde de marca que
  cumpla AA también como fondo-con-texto-oscuro, es una decisión tuya de branding.

## 6. Infra para tests faltantes (cierra QA a 10)
- Instalar **Playwright** (`npm i -D @playwright/test`) para el E2E del flujo de pago.
- Instalar **Deno** para correr los tests de edge functions (ver docs/testing.md).
