/**
 * send-push — Web Push notifications via VAPID
 * Body: { to: string (email), title: string, body: string, url?: string, tag?: string }
 *
 * Deploy: supabase functions deploy send-push --no-verify-jwt
 * Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 *
 * SEGURIDAD: Aunque el JWT de Supabase no se verifica automáticamente en el gateway
 * (--no-verify-jwt), esta función valida manualmente que el caller esté autenticado
 * con un JWT de usuario válido. Esto previene que cualquier persona sin sesión
 * pueda enviar push notifications arbitrarias a cualquier email.
 */
// @ts-ignore
import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function isAuthenticated(req: Request, projectRef: string): boolean {
  try {
    const auth = req.headers.get("Authorization") ?? req.headers.get("apikey") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!token) return false;
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Permite: service role key (llamadas internas desde send-email / smart-worker)
  //          O JWT de usuario autenticado (llamadas desde el frontend)
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const projectRef  = supabaseUrl.replace(/^https?:\/\//, "").split(".")[0];
  const authToken   = (req.headers.get("Authorization") ?? req.headers.get("apikey") ?? "")
                        .replace(/^Bearer\s+/i, "").trim();

  const isServiceRole = SERVICE_KEY && authToken === SERVICE_KEY;
  if (!isServiceRole && !isAuthenticated(req, projectRef)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  try {
    const SB_URL     = Deno.env.get("SUPABASE_URL")!;
    const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ── Verificar caller ──────────────────────────────────────────────────
    // Llamadas internas (send-email / smart-worker / recordatorio-clases) usan la
    // service role key y NO pasan por acá. Para el resto (frontend) se exige un
    // JWT de usuario válido: evita que un visitante sin sesión spamee push a
    // cualquier email. (Antes este bloque rechazaba también al service role,
    // contradiciendo el gate de arriba → las push internas fallaban en silencio.)
    let callerEmail = "service";
    if (!isServiceRole) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const jwtToken   = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (!jwtToken) {
        return new Response(JSON.stringify({ error: "No autorizado: se requiere sesión activa" }), {
          status: 401, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      const supaAdmin = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false } });
      const { data: { user }, error: authErr } = await supaAdmin.auth.getUser(jwtToken);
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "No autorizado: token inválido o expirado" }), {
          status: 401, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      callerEmail = user.email ?? "user";
    }

    const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contacto@luderis.com";

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return new Response(JSON.stringify({ error: "VAPID keys not set" }), { status: 503, headers: CORS });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

    const { to, title, body, url = "/", tag = "default" } = await req.json();
    if (!to || !title) {
      return new Response(JSON.stringify({ error: "Missing to or title" }), { status: 400, headers: CORS });
    }

    // Fetch subscriptions for this email
    const subsRes = await fetch(
      `${SB_URL}/rest/v1/push_subscriptions?user_email=eq.${encodeURIComponent(to)}`,
      { headers: { "apikey": SB_SERVICE, "Authorization": `Bearer ${SB_SERVICE}` } }
    );
    const subs: Array<{ id: string; subscription: webpush.PushSubscription }> = await subsRes.json();

    if (!subs.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: CORS });
    }

    const payload = JSON.stringify({ title, body, url, tag });

    const results = await Promise.allSettled(
      subs.map(async (row) => {
        try {
          await webpush.sendNotification(row.subscription, payload);
        } catch (e: any) {
          // Expired subscription — clean up
          if (e.statusCode === 410 || e.statusCode === 404) {
            await fetch(`${SB_URL}/rest/v1/push_subscriptions?id=eq.${row.id}`, {
              method: "DELETE",
              headers: { "apikey": SB_SERVICE, "Authorization": `Bearer ${SB_SERVICE}` },
            });
          }
          throw e;
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    console.log(`[send-push] to=${to} sent=${sent}/${subs.length} caller=${callerEmail}`);

    return new Response(JSON.stringify({ ok: true, sent }), { headers: CORS });
  } catch (err: any) {
    console.error("[send-push] error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
});
