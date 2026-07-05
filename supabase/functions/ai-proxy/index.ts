import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_TOKENS_CAP = 1000; // el cliente no puede inflar esto

// Verifica JWT Supabase (anon key o user session) — igual que ludy-chat
function isValidSupabaseJwt(token: string, projectRef: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const pad = (s: string) => s + "=".repeat((4 - s.length % 4) % 4);
    const payload = JSON.parse(atob(pad(parts[1].replace(/-/g, "+").replace(/_/g, "/"))));
    if (payload.role !== "authenticated") return false;
    if (!payload.iss || !payload.iss.includes(projectRef)) return false;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── Verificar JWT Supabase ────────────────────────────────────────────────
  const SUPA_URL   = Deno.env.get("SUPABASE_URL") ?? "";
  const projectRef = SUPA_URL.replace(/^https?:\/\//, "").split(".")[0];
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("apikey") ?? "";
  const jwtToken   = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!jwtToken || !isValidSupabaseJwt(jwtToken, projectRef)) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Rate limit: 40 req / 5 min por usuario (moderación + asistente + alertas)
  // (fail-open: si el check falla, no bloqueamos el producto)
  try {
    const pad = (s: string) => s + "=".repeat((4 - s.length % 4) % 4);
    const sub = JSON.parse(atob(pad(jwtToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))).sub ?? "";
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const rl = await fetch(`${SUPA_URL}/rest/v1/rpc/ia_rate_check`, {
      method: "POST",
      headers: { "apikey": SERVICE, "Authorization": `Bearer ${SERVICE}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_clave: `ai:${sub}`, p_max: 40, p_ventana_seg: 300 }),
    });
    if (rl.ok && (await rl.json()) === false) {
      return new Response(JSON.stringify({ error: "Demasiadas solicitudes de IA. Esperá unos minutos." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch { /* fail-open */ }

  try {
    const body = await req.json().catch(() => ({}));
    const anthropicKey = Deno.env.get("ANTHROPIC_KEY") ?? "";
    const groqKey      = Deno.env.get("GROQ_KEY") ?? "";

    // ── Hardening (A1): el servidor fija el modelo y SOLO acepta system+messages.
    //    Nunca se reenvía el body crudo del cliente (evita que se elija un modelo
    //    caro, se inyecten params como `tools`, o se abuse de la API key de Luderis).
    const FIXED_MODEL = "claude-haiku-4-5-20251001";
    const max_tokens  = Math.min(Number(body.max_tokens) || MAX_TOKENS_CAP, MAX_TOKENS_CAP);

    const system = typeof body.system === "string" ? body.system.slice(0, 8000) : "";
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .slice(-20)
      .map((m: any) => ({
        role: m?.role === "assistant" ? "assistant" : "user",
        content: typeof m?.content === "string" ? m.content.slice(0, 8000) : "",
      }))
      .filter((m: { content: string }) => m.content.length > 0);

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Intentar Anthropic primero si hay key
    if (anthropicKey.length > 20) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model: FIXED_MODEL, max_tokens, system, messages }),
      });
      if (res.ok) {
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      console.log("Anthropic failed:", res.status, "→ fallback Groq");
    }

    // Fallback: Groq
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          ...messages,
        ],
      }),
    });
    const groqData = await groqRes.json();
    return new Response(JSON.stringify({
      content: [{ type: "text", text: groqData.choices?.[0]?.message?.content || "" }],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (e) {
    console.error("ai-proxy error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
