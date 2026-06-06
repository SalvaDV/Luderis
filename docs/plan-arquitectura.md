# Plan de arquitectura — roadmap hacia el 10

> Orden recomendado por relación valor/riesgo. Cada fase es una sesión dedicada
> con QA visual. NO hacer todo de un saque.

## Estado base
- React 18 + Create React App (CRA, deprecado) + Supabase (fetch manual) + Vercel.
- Navegación por estado/`sessionStorage` (sin router).
- Archivos gigantes: `CursoPage` (5.242), `AdminPage` (2.681), `MiCuentaPage` (2.478),
  `PostFormModal` (1.260), `ExplorePage` (1.141), `supabase.js` (1.072).
- 100% inline-styles, sin TypeScript, comunicación por globals `window.__`.

## Fase 1 — Router real (UX + Arquitectura)  · riesgo medio
- Instalar `react-router-dom`. Rutas: `/`, `/explorar`, `/curso/:id`, `/cuenta`,
  `/inscripciones`, `/chats`, `/agenda`, `/perfil/:email`, `/admin`.
- Reemplazar `page`/`sessionStorage` y los deep-links manuales (`?pub=`, `?legal=`,
  `?perfil=`, `?mp=`) por rutas/searchParams.
- Beneficio: back-button, compartir links, SEO por sección, code-splitting por ruta.
- Riesgo: toca App.js a fondo (el switch de `page`). QA visual de toda la navegación.

## Fase 2 — Quitar globals window.__ · riesgo bajo-medio
- Reemplazar `window.__openPub`, `__pushNotif`, `_openNewPost`, `_resetCuentaBadge`
  por Context API (NotifContext, NavContext). Elimina acoplamiento oculto.

## Fase 3 — Descomponer archivos gigantes · riesgo medio (incremental)
- `CursoPage`: extraer sub-componentes (Chat, Contenido, Evaluaciones, Quiz,
  Flashcards, Foro, Jitsi, Skills) a `src/curso/*`. Es el de mayor deuda.
- Igual con `AdminPage` (tabs → componentes) y `MiCuentaPage` (tabs).
- Hacerlo de a un sub-componente por vez, verificando.

## Fase 4 — TypeScript gradual · riesgo bajo
- Renombrar `supabase.js` → `.ts` primero (tipar las ~120 funciones del data-layer:
  evita errores de orden de params). Generar tipos con
  `supabase gen types typescript`. Luego ir archivo por archivo (`allowJs:true`).

## Fase 5 — Design tokens / salir de inline-styles · riesgo medio
- Extraer `C` (colores), spacing, radios, tipografía a CSS variables o Tailwind.
- Hoy ya existe `applyTheme` → buena base para tokens. Migrar componente por componente.

## Fase 6 — CRA → Vite · riesgo medio
- CRA está deprecado. Migrar a Vite mejora build/dev y habilita mejor code-splitting.
- Hacerlo al final, cuando el resto esté estable y testeado.

## Recomendación transversal
- Antes de Fase 3+ conviene tener los tests de edge functions + E2E de pago
  (ver docs/testing.md) como red de seguridad.
- Adoptar el SDK oficial `@supabase/supabase-js` reduciría `supabase.js` y el
  WebSocket de realtime manual de `App.js` (~100 líneas frágiles).
