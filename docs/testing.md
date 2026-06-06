# Testing — estado y roadmap

## Cómo correr
- `npm test` — modo watch (desarrollo)
- `npm run test:ci` — corrida única (CI / pre-push)

## Cobertura actual (Jest + React Testing Library)
- **`src/__tests__/shared.test.js`** (27 tests) — lógica pura crítica:
  - `sanitizeContactInfo` / `moderarMensaje` (anti-puenteo + moderación)
  - `safeDisplayName`, `fmtPrice`, `calcAvg`, `calcDuracion`
- **`src/__tests__/supabase.test.js`** (9 tests) — capa de datos:
  - Construcción de queries PostgREST
  - **Encoding anti-inyección** de inputs en filtros (emails con `+ @ , )`)
  - Token de usuario en Authorization; columnas no-PII en bulk
- **`src/__tests__/FarosGameLogic.test.js`** — lógica del juego.

Total: **56 tests verdes.**

## Pendiente para llegar a 10 (requiere infra no instalada acá)

### 1. Edge functions (Deno) — lo más crítico de seguridad
Necesita Deno instalado (`deno test`). Tests a escribir:
- `mp-checkout`: validación de precio contra DB (±$1), `alumno_email===JWT`,
  no pagar la propia publicación, comisión.
- `admin-actions`: autorización por rol (admin vs user), ownership en `borrar_chat`.
- `mp-webhook`: validación de firma HMAC, idempotencia de inscripción.
Sugerencia: extraer la lógica pura (cálculo de comisión, validación de precio)
a un módulo testeable e importarlo desde la función.

### 2. E2E (Playwright) — flujo de pago end-to-end
Necesita `@playwright/test`. Escenario clave:
signup → onboarding → publicar → inscribir → pagar (MP sandbox) →
confirmar clase → liberar pago.
Más: navegación por teclado de los flujos críticos (a11y E2E).

### 3. Component tests (Jest, ampliables ya)
- `AuthScreen`: validaciones de formulario (password corta, no coinciden, términos).
- Render de estados vacíos/error en listados.

## Recomendación
Antes de los refactors grandes (router, descomponer archivos, TypeScript),
completar al menos los tests de edge functions (seguridad) y el E2E de pago:
son la red de seguridad que hace seguro el resto.
