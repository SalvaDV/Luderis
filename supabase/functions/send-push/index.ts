/**
 * send-push — Web Push notifications via VAPID
 * Body: { to: string (email), title: string, body: string, url?: string, tag?: string }
 *
 * Deploy: supabase functions deploy send-push --no-verify-jwt
 * Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */
// @ts-ignore
import webpush from "npm:web-push@3.6.7";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contacto@luderis.com";
    const SB_URL        = Deno.env.get("SUPABASE_URL")!;
    const SB_SERVICE    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    console.log(`[send-push] to=${to} sent=${sent}/${subs.length}`);

    return new Response(JSON.stringify({ ok: true, sent }), { headers: CORS });
  } catch (err: any) {
    console.error("[send-push] error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
});
