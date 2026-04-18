/**
 * Edge Function: mp-oauth
 * Maneja el flujo OAuth de Mercado Pago para que los docentes conecten su cuenta.
 *
 * Acciones:
 *   GET  ?action=authorize&user_id=X       → redirige al login de MP
 *   GET  ?action=callback&code=X&state=X   → intercambia code por tokens, guarda en BD
 *   POST { action:"status",     user_id }  → retorna si el docente tiene MP conectado
 *   POST { action:"disconnect", user_id }  → desconecta la cuenta de MP
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const MP_CLIENT_ID  = Deno.env.get("MP_CLIENT_ID")!;
  const MP_SECRET     = Deno.env.get("MP_CLIENT_SECRET")!;
  const APP_URL       = Deno.env.get("APP_URL") ?? "https://classelink.vercel.app";
  const REDIRECT_URI  = `${SUPABASE_URL}/functions/v1/mp-oauth?action=callback`;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const url      = new URL(req.url);
  const action   = url.searchParams.get("action");

  // ── GET: authorize — redirige al login de MP ────────────────────────────
  if (req.method === "GET" && action === "authorize") {
    const userId = url.searchParams.get("user_id");
    if (!userId) return new Response("Falta user_id", { status: 400 });

    const authUrl = new URL("https://auth.mercadopago.com/authorization");
    authUrl.searchParams.set("client_id",    MP_CLIENT_ID);
    authUrl.searchParams.set("response_type","code");
    authUrl.searchParams.set("platform_id",  "mp");
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("state",        userId); // usamos state para pasar el user_id

    return Response.redirect(authUrl.toString(), 302);
  }

  // ── GET: callback — MP redirige acá con el code ─────────────────────────
  if (req.method === "GET" && action === "callback") {
    const code   = url.searchParams.get("code");
    const userId = url.searchParams.get("state");

    if (!code || !userId) {
      return Response.redirect(`${APP_URL}?mp_connect=error`, 302);
    }

    try {
      // Intercambiar code por access_token
      const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:     MP_CLIENT_ID,
          client_secret: MP_SECRET,
          grant_type:    "authorization_code",
          code,
          redirect_uri:  REDIRECT_URI,
        }),
      });

      if (!tokenRes.ok) {
        console.error("MP token error:", await tokenRes.text());
        return Response.redirect(`${APP_URL}?mp_connect=error`, 302);
      }

      const tokens = await tokenRes.json();
      // tokens: { access_token, token_type, expires_in, scope, user_id, refresh_token, public_key }

      // Obtener email del usuario Supabase
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("email")
        .eq("id", userId)
        .single();

      if (!usuario?.email) {
        return Response.redirect(`${APP_URL}?mp_connect=error`, 302);
      }

      // Obtener info del perfil MP del docente
      const perfilRes = await fetch("https://api.mercadopago.com/users/me", {
        headers: { "Authorization": `Bearer ${tokens.access_token}` },
      });
      const perfil = perfilRes.ok ? await perfilRes.json() : {};

      // Guardar / actualizar conexión en BD
      await supabase.from("mp_conexiones").upsert({
        usuario_id:       userId,
        usuario_email:    usuario.email,
        mp_user_id:       String(tokens.user_id),
        mp_email:         perfil.email ?? null,
        mp_access_token:  tokens.access_token,
        mp_refresh_token: tokens.refresh_token ?? null,
        mp_public_key:    tokens.public_key ?? null,
        updated_at:       new Date().toISOString(),
      }, { onConflict: "usuario_id" });

      return Response.redirect(`${APP_URL}?mp_connect=success`, 302);

    } catch (err) {
      console.error("mp-oauth callback error:", err);
      return Response.redirect(`${APP_URL}?mp_connect=error`, 302);
    }
  }

  // ── POST: status / disconnect ────────────────────────────────────────────
  if (req.method === "POST") {
    let body: { action: string; user_id: string };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400, headers: CORS });
    }

    const { action: postAction, user_id } = body;
    if (!user_id) return new Response(JSON.stringify({ error: "Falta user_id" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });

    // ── status ──────────────────────────────────────────────────────────────
    if (postAction === "status") {
      const { data } = await supabase
        .from("mp_conexiones")
        .select("mp_email, mp_user_id, connected_at")
        .eq("usuario_id", user_id)
        .single();

      return new Response(
        JSON.stringify({
          connected:    !!data,
          mp_email:     data?.mp_email ?? null,
          mp_user_id:   data?.mp_user_id ?? null,
          connected_at: data?.connected_at ?? null,
        }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // ── disconnect ──────────────────────────────────────────────────────────
    if (postAction === "disconnect") {
      await supabase.from("mp_conexiones").delete().eq("usuario_id", user_id);
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Acción desconocida" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  return new Response("Method not allowed", { status: 405, headers: CORS });
});
