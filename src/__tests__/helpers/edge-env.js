// Utilidades para testear edge functions de Supabase (Deno) bajo vitest/Node.
//
// installDeno(env): crea globalThis.Deno con env.get y serve-que-captura,
// ANTES de importar dinámicamente el módulo de la función. El handler queda en
// globalThis.__edgeHandler (tanto para Deno.serve como para el shim de
// deno.land/std → serve-shim.js).
//
// Las respuestas pg*() imitan el contrato de PostgREST que espera
// @supabase/supabase-js v2 (arrays, objetos para .single()/.maybeSingle(),
// y el error PGRST116 con 406 cuando un maybeSingle no matchea filas).

export function installDeno(env = {}) {
  const store = { ...env };
  globalThis.__edgeHandler = undefined;
  globalThis.Deno = {
    env: { get: (k) => store[k] },
    serve: (h) => { globalThis.__edgeHandler = h; },
  };
  return {
    set: (k, v) => { store[k] = v; },
    del: (k) => { delete store[k]; },
  };
}

// El import del módulo de la función se hace EN el test (con ruta literal, para
// que vite lo transforme); acá solo se recupera el handler que capturó el shim.
export function takeHandler() {
  const h = globalThis.__edgeHandler;
  if (!h) throw new Error("La edge function no registró handler (¿falta el shim de serve?)");
  return h;
}

// HMAC-SHA256 hex — mismo formato que valida mp-webhook (manifest de Mercado Pago)
export async function hmacHex(secret, msg) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Firma un webhook de MP como lo haría Mercado Pago: manifest id/request-id/ts
export async function signMpWebhook(secret, dataId, requestId = "req-1", ts = "1700000000") {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = await hmacHex(secret, manifest);
  return { "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": requestId };
}

// ── Respuestas estilo PostgREST ───────────────────────────────────────────────
const JSON_HDR = { "Content-Type": "application/json" };

export const pgJson = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: JSON_HDR });

// .single()/.maybeSingle() con 0 filas → PostgREST responde 406 PGRST116;
// supabase-js lo convierte en data:null (maybeSingle) o error (single).
export const pgNoRows = () =>
  new Response(JSON.stringify({
    code: "PGRST116",
    // postgrest-js identifica el caso maybeSingle-sin-filas por este texto exacto
    details: "Results contain 0 rows, application/vnd.pgrst.object+json requires 1 row",
    hint: null,
    message: "JSON object requested, multiple (or no) rows returned",
  }), { status: 406, headers: JSON_HDR });

// INSERT/UPDATE con Prefer: return=minimal → 201/204 sin body
export const pgMinimal = (status = 201) => new Response(null, { status });

// Registra las llamadas fetch y las rutea por (method, predicate de URL).
// Cualquier request sin ruta definida hace fallar el test con contexto.
export function makeFetchRouter() {
  const calls = [];
  const routes = [];
  const router = {
    calls,
    on(method, match, respond) {
      routes.push({ method, match, respond });
      return router;
    },
    fetch: async (input, init = {}) => {
      const url = String(input instanceof Request ? input.url : input);
      const method = (init.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : {}));
      let body = init.body ?? null;
      if (body == null && input instanceof Request) { try { body = await input.clone().text(); } catch { body = null; } }
      if (typeof body !== "string" && body != null) body = String(body);
      let parsed = null;
      try { parsed = body ? JSON.parse(body) : null; } catch { parsed = body; }
      const call = { method, url, body: parsed, headers };
      calls.push(call);
      for (const r of routes) {
        const okMethod = r.method === "*" || r.method === method;
        const okUrl = typeof r.match === "function" ? r.match(url) : url.includes(r.match);
        if (okMethod && okUrl) return typeof r.respond === "function" ? r.respond(call) : r.respond;
      }
      throw new Error(`[fetch-router] sin ruta para ${method} ${url}`);
    },
  };
  return router;
}

export const countCalls = (router, method, urlPart) =>
  router.calls.filter((c) => c.method === method && c.url.includes(urlPart)).length;
