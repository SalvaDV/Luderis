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
    if (!["anon", "authenticated"].includes(payload.role)) return false;
    // user JWTs have iss with project URL; anon keys have iss="supabase"
    if (payload.role === "authenticated" && (!payload.iss || !payload.iss.includes(projectRef))) return false;
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

  try {
    const body = await req.json();
    const anthropicKey = Deno.env.get("ANTHROPIC_KEY") ?? "";
    const groqKey      = Deno.env.get("GROQ_KEY") ?? "";

    // max_tokens siempre viene del servidor — ignorar valor del cliente
    const max_tokens = MAX_TOKENS_CAP;

    // Intentar Anthropic primero si hay key
    if (anthropicKey.length > 20) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ ...body, max_tokens }),
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
          ...(body.system ? [{ role: "system", content: body.system }] : []),
          ...(body.messages || []),
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
