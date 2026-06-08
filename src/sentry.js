// ── Sentry diferido (lazy) ────────────────────────────────────────────────────
// @sentry/react pesa ~15 KB gzip. Antes se importaba eager en index.js y
// supabase.js, así que viajaba en el bundle crítico y bloqueaba el arranque.
// Acá lo cargamos por import() dinámico DESPUÉS del primer render (cuando el
// navegador está idle), así sale del path crítico. Los errores que ocurran
// antes de que cargue se encolan y se envían apenas Sentry esté listo.

let _sentry = null;
let _initPromise = null;
const _queue = []; // errores capturados antes de que Sentry cargue

const DSN = "https://7048964b77b715c46288eb43fddb4129@o4511175376437248.ingest.us.sentry.io/4511175379517440";

// Carga e inicializa Sentry una sola vez. Devuelve la instancia (o null en dev).
export function loadSentry() {
  if (_initPromise) return _initPromise;
  // En desarrollo no tiene sentido cargar el SDK: Sentry queda enabled:false.
  if (process.env.NODE_ENV !== "production") {
    _initPromise = Promise.resolve(null);
    return _initPromise;
  }
  _initPromise = import("@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn: DSN,
        environment: process.env.NODE_ENV,
        enabled: true,
        tracesSampleRate: 0.1,
      });
      _sentry = Sentry;
      // Vaciar la cola de errores que llegaron antes de cargar
      while (_queue.length) {
        const { err, ctx } = _queue.shift();
        try { Sentry.captureException(err, ctx); } catch {}
      }
      return Sentry;
    })
    .catch(() => null); // si falla la carga del SDK, no rompemos la app
  return _initPromise;
}

// Captura un error. Si Sentry todavía no cargó, lo encola y dispara la carga.
export function captureException(err, ctx) {
  if (_sentry) {
    try { _sentry.captureException(err, ctx); } catch {}
    return;
  }
  if (process.env.NODE_ENV !== "production") return; // dev: no-op
  _queue.push({ err, ctx });
  loadSentry();
}

// Programa la carga de Sentry cuando el navegador esté idle (no bloquea el arranque).
export function scheduleSentry() {
  if (process.env.NODE_ENV !== "production") return;
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 2000));
  idle(() => loadSentry());
}
