import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const anthropicKey = Deno.env.get("ANTHROPIC_KEY") ?? "";
    const groqKey = Deno.env.get("GROQ_KEY") ?? "";

    // Intentar Anthropic primero si hay key
    if (anthropicKey.length > 20) {
      console.log("Trying Anthropic...");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Anthropic OK");
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      const errData = await res.json().catch(() => ({}));
      console.log("Anthropic failed:", res.status, errData?.error?.type, "→ fallback Groq");
    }

    // Fallback: Groq
    console.log("Using Groq...");
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: body.max_tokens || 600,
        messages: [
          ...(body.system ? [{ role: "system", content: body.system }] : []),
          ...(body.messages || []),
        ],
      }),
    });
    const groqData = await groqRes.json();
    console.log("Groq response status:", groqRes.status);
    return new Response(JSON.stringify({
      content: [{ type: "text", text: groqData.choices?.[0]?.message?.content || "" }],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (e) {
    console.error("Error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
