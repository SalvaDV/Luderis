# Testing — estado y roadmap

## Cómo correr
- `npm test` — modo watch (desarrollo)
- `npm run test:ci` — corrida única (CI / pre-push)

## Cobertura actual (Vitest)

- **`src/__tests__/shared.test.js`** (37) — lógica pura crítica:
  - `sanitizeContactInfo` / `moderarMensaje` (anti-puenteo + moderación), incluida
    la batería de bypasses unicode (arroba fullwidth, ancho cero, "arroba"/"[at]",
    dígitos fullwidth, acortadores).
  - `safeDisplayName`, `fmtPrice`, `calcAvg`, `calcDuracion`
- **`src/__tests__/supabase.test.js`** (12) — capa de datos:
  - Construcción de queries PostgREST
  - **Encoding anti-inyección** de inputs en filtros (emails con `+ @ , )`)
  - Token de usuario en Authorization; columnas no-PII en bulk
- **`src/__tests__/edge-mp-webhook.test.js`** (10) — ruta del dinero: firma HMAC,
  idempotencia (CAS sobre `acreditado_at`), retención vs split inmediato,
  `tipo=recarga_billetera` sobre una publicación real.
- **`src/__tests__/edge-liberar-pago.test.js`** (8) — claim atómico, idempotencia
  hacia MP, rollback, y chequeo cruzado contra el ledger interno.
- **`src/__tests__/db-resilience.test.js`** (5)
- **`src/__tests__/FarosGameLogic.test.js`** (20) — lógica del juego.

Total: **92 tests verdes.**

### Cómo se testean las edge functions sin Deno
`src/__tests__/helpers/edge-env.js` instala shims de `Deno.serve` / `Deno.env` y
un router de `fetch`, así que el HANDLER REAL de la función corre bajo Vitest
contra un PostgREST y un Mercado Pago simulados. **No hace falta instalar Deno.**
Es el patrón a reutilizar para cubrir lo que falta.

## Pendiente

### 1. Edge functions — lo que falta cubrir
Reutilizando `helpers/edge-env.js` (ver arriba), sin infraestructura extra:
- `mp-checkout`: validación de precio contra DB (±$1), `alumno_email===JWT`,
  no pagar la propia publicación, y que `docente_email` salga de la BD y no del body.
- `admin-actions`: autorización por rol (admin vs user), ownership en `borrar_chat`.
- `stripe-webhook`: verificación de firma e idempotencia (función nueva, sin tests).

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
