# Prompt de auditoría integral — Luderis

> Prompt reutilizable para correr una auditoría completa de la app. Diseñado para
> ejecutarse en 4 pistas paralelas (subagentes), una por bloque. Generado 2026-08-04.
> Resultados de la corrida: ver `docs/auditoria-2026-08-hallazgos.md`.

## Contexto que hay que dar SIEMPRE al auditor

Luderis: plataforma educativa argentina en producción. React 18 + Vite 8 +
react-router-dom v7 + Supabase (PostgREST/GoTrue por `fetch` manual, sin SDK) +
Mercado Pago / Stripe, desplegada en Vercel.

Auditorías previas ya documentadas — **leerlas primero y NO repetir hallazgos como
nuevos, sino verificar su estado actual**:
- `docs/plan-seguridad-authuid.md` (auditoría 2026-06-05)
- `docs/plan-arquitectura.md` (parcialmente desactualizado: hoy hay Vite y router)
- `docs/testing.md` (desactualizado: los tests de edge ya existen)

Ya resuelto en commits recientes (no reportar como pendiente sin verificar):
RLS de escrow, revocación de EXECUTE de `anon` en RPCs de escrow, lockdown de
UPDATE en `mensajes`, N+1 de chats, índices duplicados.

Formato de salida para todas las pistas: markdown, hallazgos ordenados por
severidad (**crítico / alto / medio / bajo**), cada uno con `archivo:línea`, por qué
importa y fix concreto. Checklist accionable al final. Marcar `[YA DOCUMENTADO]` lo
que ya figure en los planes previos, con su estado verificado. Nada genérico: todo
referenciado al repo real. **Solo lectura sobre `src/`** (correr build/tests/audit sí).

---

## Pista 1 — Seguridad backend (Supabase + edge functions)

1. **RLS**: las ~30 migraciones de `supabase/migrations/`. Por cada tabla, ¿policies
   coherentes con su flujo? Estado de los pendientes documentados: `clases_realizadas`,
   `alertas_busquedas`, `anuncios_globales`, `referidos`.
2. **Edge functions** (16 en `supabase/functions/`): por cada una, ¿valida JWT y
   ownership? ¿valida inputs? ¿usa `service_role` y puede filtrarla en logs/responses?
   ¿`mp-webhook` verifica firma HMAC y es idempotente ante reintentos de MP?
3. **Rate limiting**: ¿`20260704_ia_rate_limits.sql` está efectivamente consultada por
   `ai-proxy` y `ludy-chat`? ¿Hay bypass?
4. **RPCs**: todas las `SECURITY DEFINER` de las migraciones. ¿Alguna con EXECUTE para
   `anon`/`authenticated` que no debería (mismo patrón del fix de escrow)? Atención a
   las que reciben identidad por parámetro (ej. `confirmar_clase(p_usuario_email)`):
   ¿validan contra el JWT o confían en el argumento?
5. **Escrow / carreras**: `20260706_escrow_unificado.sql` + `liberar-pago`. Mapear
   transiciones del ledger. ¿Puede una carrera entre liberación automática (7 días) y
   confirmación del alumno duplicar liberación o reembolso? ¿Locks/transacciones?
6. **PII en logs**: `console.log/error` en `supabase/functions/` que loguee emails,
   tokens o payloads completos.
7. Correr `get_advisors` (security) del MCP de Supabase y triar contra lo conocido.

## Pista 2 — Seguridad frontend, accesibilidad y consistencia visual

**Seguridad:**
1. XSS: `dangerouslySetInnerHTML`, `innerHTML`, inyección desde datos de usuario.
   ¿`sanitizeContactInfo` / `moderarMensaje` (`src/shared.jsx`) cubren emails ofuscados,
   números con espacios/unicode, acortadores, homoglifos?
2. CSP de `vercel.json`: ¿`'unsafe-inline'` en `script-src` es evitable con nonces?
   ¿`img-src https:` demasiado amplio? ¿falta `upgrade-insecure-requests`?
3. Gate de admin: `REACT_APP_ADMIN_EMAIL` es client-side (va en el bundle). ¿Cada acción
   sensible valida rol server-side (`admin-actions` / RLS) o solo esconde UI?
4. Password: ¿sigue en `length >= 6` client-side en `AuthScreen.jsx`? ¿validación server?
5. Secretos hardcodeados en `src/` y `vite.config.js`. Qué se guarda en
   `localStorage`/`sessionStorage` (¿tokens? ¿PII?).

**Accesibilidad:**
6. `eslint-plugin-jsx-a11y` está en devDependencies pero no hay config de ESLint en la
   raíz: ¿corre en algún lado (scripts, CI, hooks)?
7. Muestreo de `Sidebar`, `ExplorePage`, `DetailModal`, `PostFormModal`, `PostCard`:
   botones sin aria-label, divs clickeables sin rol/teclado, modales sin focus-trap,
   imágenes sin alt.
8. Contraste WCAG AA de los tokens `C` de `src/shared.jsx`, tema claro **y** oscuro.
9. ¿`AccesibilidadPage.jsx` declara cosas que el código no cumple?

**Consistencia visual (reglas del CLAUDE.md del repo):**
10. Hex crudos `#[0-9a-fA-F]{3,8}` fuera de `shared.jsx` (resumen cuantitativo, top 10
    archivos). `fontSize` mágicos fuera de `TYPE`/`tx()`. Colores inline que rompan dark
    mode. Emojis en UI. Imports desde `redesign-prototipo/` (prohibidos).

## Pista 3 — Arquitectura, performance y dependencias

1. **Estado real vs `plan-arquitectura.md`**, fase por fase, con % completado y evidencia:
   router real vs `sessionStorage`/query-params ad-hoc; globals `window.__`;
   descomposición de monolitos (tamaños actuales vs los del plan); TypeScript
   (`.jsx` vs `.ts`, `checkJs`, `any` en el data-layer); CRA→Vite.
2. **Basura en `src/`**: archivos no importados; verificar si van al repo (`git ls-files`,
   `.gitignore`) porque puede haber PII personal del dueño.
3. **N+1 y queries sin límite** en `src/supabase.ts` y sus call-sites (loops con await,
   fetch por ítem, selects sin `limit`).
4. **Bundle**: correr `npm run build`, reportar chunks y gzip. ¿`React.lazy` por ruta?
   ¿Qué engorda el entry?
5. **Re-renders**: memoización en listas de `ExplorePage`/`CursoPage`; estados que fuerzan
   render global.
6. **Realtime**: ¿sigue el WebSocket manual de `App.jsx` o migró al SDK?
7. **Assets**: pesos de `public/` (logo, favicon, íconos), residuos del prototipo.
8. **Deps**: `npm audit` (sin fix); dead deps por grep de imports; ubicación correcta de
   `@supabase/supabase-js` (dev vs runtime).

## Pista 4 — Datos, testing, observabilidad y legal

1. **Migraciones**: leer en orden cronológico. Columnas/tablas huérfanas (¿`pagos.estado_escrow`
   quedó como dead data que puede divergir del ledger?), FKs sin `ON DELETE`, estados sin
   CHECK, defaults peligrosos, duplicación conceptual (el mismo estado en dos lugares).
2. **Escrow**: ciclo de vida completo del dinero (pago → retención → liberación/reembolso).
   Estados inalcanzables, transiciones sin validar, montos que puedan desincronizarse.
3. **Testing**: correr `npm run test:ci` y `npm run typecheck`, reportar resultado real.
   ¿Qué cubren de verdad `edge-liberar-pago.test.js` y `edge-mp-webhook.test.js`? Gaps:
   `mp-checkout` (precio, comisión), `admin-actions` (autorización), E2E de pago.
4. **Observabilidad**: qué captura `src/sentry.js`; ¿las edge functions reportan errores o
   fallan en silencio?; jobs programados (`recordatorio-clases`, `smart-worker`,
   `generar-liquidacion`): si fallan, ¿alguien se entera? ¿reintentos?
5. **Legal (Ley 25.326 + Defensa del Consumidor)**: cruzar `PrivacidadPage`, `TerminosPage`,
   `PoliticaDevoluciones`, `DefensaConsumidorPage`, `LibroQuejasPage` contra el código real.
   ¿Se declaran TODOS los terceros que reciben datos (Supabase, MP, Stripe, Sentry, GA,
   Clarity, Nominatim, MyMemory — todos aparecen en la CSP)? ¿Retención y derecho de
   acceso/supresión? ¿Existe flujo real de borrado de cuenta o solo se declara? ¿El botón de
   arrepentimiento coincide con el reembolso que implementa el escrow? ¿`CookieBanner`
   bloquea analytics hasta consentir o es decorativo?
