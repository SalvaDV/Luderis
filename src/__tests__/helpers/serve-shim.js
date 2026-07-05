// Shim de `serve` de deno.land/std para correr edge functions bajo vitest.
// El alias en vite.config.js redirige "https://deno.land/std@.../http/server.ts"
// acá: en vez de levantar un servidor, capturamos el handler para invocarlo
// directamente en los tests con objetos Request estándar.
export function serve(handler) {
  globalThis.__edgeHandler = handler;
}
