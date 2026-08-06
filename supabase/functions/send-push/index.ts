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

const maskEmail = (e: string): string => {
  const [u, d] = (e ?? "").split("@");
  return u ? `${u.slice(0, 2)}***@${d ?? "?"}` : "—";
};

/**
 * ¿Existe una relación real entre estas dos personas dentro de la plataforma?
 * Sin esto, cualquier usuario con sesión podía mandarle una push con título,
 * cuerpo y URL arbitrarios a CUALQUIER email registrado, con el ícono y el
 * origen de Luderis — phishing directo, porque la url termina en openWindow().
 * Las tres vías cubren todos los envíos legítimos del frontend: chat, curso
 * (docente↔alumno inscripto) y ofertas sobre una búsqueda.
 */
async function existeRelacion(a: string, b: string, sbUrl: string, key: string): Promise<boolean> {
  const headers = { "apikey": key, "Authorization": `Bearer ${key}` };
  const enc = encodeURIComponent;
  const hayFilas = async (path: string): Promise<boolean> => {
    try {
      const res = await fetch(`${sbUrl}/rest/v1/${path}`, { headers });
      if (!res.ok) return false;
      const filas = await res.json();
      return Array.isArray(filas) && filas.length > 0;
    } catch { return false; }
  };

  // 1) Se escribieron por chat (en cualquier dirección)
  if (await hayFilas(
    `mensajes?select=id&limit=1&or=(and(de_nombre.eq.${enc(a)},para_nombre.eq.${enc(b)}),` +
    `and(de_nombre.eq.${enc(b)},para_nombre.eq.${enc(a)}))`
  )) return true;

  // 2) Uno está inscripto en una publicación del otro
  for (const [alumno, autor] of [[a, b], [b, a]]) {
    if (await hayFilas(
      `inscripciones?select=id,publicaciones!inner(autor_email)&limit=1` +
      `&alumno_email=eq.${enc(alumno)}&publicaciones.autor_email=eq.${enc(autor)}`
    )) return true;
  }

  // 3) Uno ofertó sobre una búsqueda del otro
  for (const [ofertante, dueno] of [[a, b], [b, a]]) {
    if (await hayFilas(
      `ofertas_busqueda?select=id&limit=1` +
      `&ofertante_email=eq.${enc(ofertante)}&busqueda_autor_email=eq.${enc(dueno)}`
    )) return true;
  }

  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Permite: service role key (llamadas internas desde send-email / smart-worker)
  //          O JWT de usuario autenticado (llamadas desde el frontend)
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authToken   = (req.headers.get("Authorization") ?? req.headers.get("apikey") ?? "")
                        .replace(/^Bearer\s+/i, "").trim();

  // El gate real es el getUser() de más abajo, que verifica la firma contra
  // GoTrue. Acá solo se distingue la llamada interna (service role) de la del
  // frontend. (Antes había además un decode con atob() sin verificar firma:
  // redundante y engañoso, porque parecía ser el control de acceso.)
  const isServiceRole = !!SERVICE_KEY && authToken === SERVICE_KEY;
  if (!isServiceRole && !authToken) {
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

    // La URL tiene que ser una ruta interna de la app. El service worker la abre
    // con clients.openWindow(): una URL absoluta convertía la push en un link
    // externo con la marca de Luderis.
    const destino = typeof url === "string" && url.startsWith("/") && !url.startsWith("//")
      ? url : "/";

    // Un usuario solo puede notificar a alguien con quien ya interactuó.
    if (!isServiceRole && to !== callerEmail) {
      const relacionados = await existeRelacion(callerEmail, String(to), SB_URL, SB_SERVICE);
      if (!relacionados) {
        console.warn(`[send-push] bloqueado: ${maskEmail(callerEmail)} -> ${maskEmail(String(to))} sin relación`);
        return new Response(
          JSON.stringify({ error: "No autorizado: no hay relación con ese destinatario" }),
          { status: 403, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
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

    const payload = JSON.stringify({
      title: String(title).slice(0, 120),
      body:  typeof body === "string" ? body.slice(0, 300) : "",
      url:   destino,
      tag,
    });

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
    console.log(`[send-push] to=${maskEmail(String(to))} sent=${sent}/${subs.length} caller=${maskEmail(callerEmail)}`);

    return new Response(JSON.stringify({ ok: true, sent }), { headers: CORS });
  } catch (err: any) {
    console.error("[send-push] error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
});
