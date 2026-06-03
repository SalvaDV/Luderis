/**
 * Supabase Edge Function: smart-worker (Recordatorios)
 * Envía emails de recordatorio 24hs antes de una clase sincrónica.
 *
 * Llamar con un cron job diario desde Supabase Dashboard → Database → Cron Jobs:
 *   SELECT cron.schedule('recordatorios-diarios', '0 10 * * *', $$
 *     SELECT net.http_post(
 *       url := 'https://hptdyehzqfpgtrpuydny.supabase.co/functions/v1/smart-worker',
 *       headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
 *     ) AS request_id;
 *   $$);
 *
 * O invocar manualmente desde el dashboard para testear.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPA_URL    = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_KEY  = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL  = Deno.env.get("FROM_EMAIL") ?? "hola@luderis.com";
const APP_URL     = Deno.env.get("APP_URL") ?? "https://luderis.com";

// Intenta push via send-push. Retorna cantidad de subscripciones que recibieron.
const tryPush = async (email: string, title: string, body: string, tag: string): Promise<number> => {
  if (!SUPA_URL || !SERVICE_KEY) return 0;
  try {
    const res = await fetch(`${SUPA_URL}/functions/v1/send-push`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, title, body, url: APP_URL, tag }),
    });
    if (!res.ok) return 0;
    const j = await res.json();
    return (j.sent as number) ?? 0;
  } catch { return 0; }
};

const supa = async (path: string, method = "GET", body: unknown = null) => {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!RESEND_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `Luderis <${FROM_EMAIL}>`, to: [to], subject, html }),
  });
};

// ── HTML escape para templates de email ──────────────────────────────────────
// Previene HTML injection en caso de que un docente ponga tags en el título de su clase.
// (Los clientes de email no ejecutan JS, pero sí renderizan HTML arbitrario)
const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// ── Unsubscribe token con HMAC-SHA256 ────────────────────────────────────────
// Usa UNSUB_SECRET (Supabase Secret) para generar un token que NO se puede
// forjar conociendo solo el email — el token anterior era btoa(email) y era trivialmente
// falsificable por cualquiera que conociera el email de un usuario.
const getUnsubKey = async (): Promise<CryptoKey> => {
  const secret = Deno.env.get("UNSUB_SECRET") || "luderis-unsub-fallback-v2-change-me";
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
};

const makeUnsubToken = async (email: string): Promise<string> => {
  const key = await getUnsubKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  // Formato: base64url(email) + "." + primeros 32 chars del HMAC hex
  return btoa(email).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "") + "." + hex.slice(0, 32);
};

const verifyUnsubToken = async (token: string): Promise<string | null> => {
  try {
    const [emailB64, providedSig] = token.split(".");
    if (!emailB64 || !providedSig) return null;
    const email = atob(emailB64.replace(/-/g, "+").replace(/_/g, "/"));
    const key = await getUnsubKey();
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email));
    const expectedHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    // Comparación de tiempo constante (evita timing attacks)
    if (providedSig !== expectedHex.slice(0, 32)) return null;
    return email;
  } catch { return null; }
};

Deno.serve(async (req) => {
  // Handle unsubscribe GET request
  if (req.method === "GET") {
    const url = new URL(req.url);
    const token = url.searchParams.get("unsub");
    if (token) {
      try {
        const email = await verifyUnsubToken(token);
        if (!email) {
          return new Response("Token inválido o expirado", { status: 400 });
        }
        // Guardar preferencia en DB
        await supa(`usuarios?email=eq.${encodeURIComponent(email)}`, "PATCH", { recordatorios_activos: false });
        return new Response(
          `<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#F6F9FF">
            <h2 style="color:#0D1F3C">✓ Desuscripción exitosa</h2>
            <p style="color:#5A7294">Ya no recibirás recordatorios de clases de Luderis.</p>
            <a href="https://luderis.com" style="color:#1A6ED8">Volver a Luderis</a>
          </body></html>`,
          { status: 200, headers: { "Content-Type": "text/html" } }
        );
      } catch {
        return new Response("Error al procesar", { status: 400 });
      }
    }
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // Calcular ventana de mañana (±30 min para cubrir cualquier hora del día siguiente)
    const ahora  = new Date();
    const manana = new Date(ahora);
    manana.setDate(manana.getDate() + 1);
    const desde = new Date(manana); desde.setHours(0, 0, 0, 0);
    const hasta = new Date(manana); hasta.setHours(23, 59, 59, 999);

    const desdeStr = desde.toISOString().split("T")[0];
    const hastaStr = hasta.toISOString().split("T")[0];

    // Buscar publicaciones con clases sincrónicas que empiezan mañana
    const pubs = await supa(
      `publicaciones?sinc=eq.sinc&activo=eq.true&select=id,titulo,autor_email,autor_nombre,fecha_inicio,hora_inicio,modalidad,ubicacion&fecha_inicio=gte.${desdeStr}&fecha_inicio=lte.${hastaStr}`
    );

    let enviados = 0;

    for (const pub of (pubs ?? [])) {
      try {
        // Buscar inscriptos a esta clase
        const inscripciones = await supa(
          `inscripciones?publicacion_id=eq.${pub.id}&select=alumno_email`
        );

        if (!inscripciones?.length) continue;

        const fechaFormateada = new Date(pub.fecha_inicio).toLocaleDateString("es-AR", {
          weekday: "long", day: "numeric", month: "long",
        });
        const hora  = pub.hora_inicio ? ` a las ${esc(pub.hora_inicio.slice(0, 5))}` : "";
        // Escapar datos de la DB que se inyectan en HTML (previene HTML injection)
        const lugar = pub.modalidad === "presencial" && pub.ubicacion
          ? `<p style="color:#5A7294">📍 Ubicación: <strong>${esc(pub.ubicacion)}</strong></p>`
          : `<p style="color:#5A7294">💻 Clase online — el docente te enviará el link por chat</p>`;

        // Enviar a cada inscripto (respetando preferencia de unsubscribe)
        for (const insc of inscripciones) {
          // Verificar si el usuario desactivó recordatorios
          const userPrefs = await supa(
            `usuarios?email=eq.${encodeURIComponent(insc.alumno_email)}&select=recordatorios_activos`,
            "GET"
          ).catch(() => []);
          if (userPrefs?.[0]?.recordatorios_activos === false) continue;

          const html = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F6F9FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,110,216,.08);border:1px solid #DDE5F5">
      <div style="background:linear-gradient(160deg,#0A2A5E 0%,#1A6ED8 55%,#2EC4A0 100%);padding:32px 40px;text-align:center">
        <img src="https://classelink.vercel.app/logo.png" width="56" height="56" style="border-radius:14px;display:block;margin:0 auto 10px" alt=""/>
        <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;letter-spacing:-.5px">Luderis</h1>
        <p style="color:rgba(255,255,255,.75);margin:6px 0 0;font-size:13px">⏰ Recordatorio de clase</p>
      </div>
      <div style="padding:32px 40px">
        <h2 style="color:#0D1F3C;font-size:20px;margin:0 0 16px">${esc(pub.titulo)}</h2>
        <div style="background:#F6F9FF;border:1px solid #DDE5F5;border-radius:10px;padding:16px 20px;margin:16px 0">
          <div style="font-size:11px;color:#5A7294;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px">Cuándo</div>
          <div style="font-size:16px;color:#0D1F3C;font-weight:700;text-transform:capitalize">${esc(fechaFormateada)}${hora}</div>
        </div>
        <div style="background:#F6F9FF;border:1px solid #DDE5F5;border-radius:10px;padding:16px 20px;margin:16px 0">
          <div style="font-size:11px;color:#5A7294;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px">Docente</div>
          <div style="font-size:15px;color:#0D1F3C;font-weight:600">${esc(pub.autor_nombre || pub.autor_email.split("@")[0])}</div>
        </div>
        ${lugar}
        <p style="text-align:center;margin:24px 0">
          <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#1A6ED8,#2EC4A0);color:#fff;text-decoration:none;padding:14px 32px;border-radius:24px;font-weight:700;font-size:15px">
            Ver mi clase →
          </a>
        </p>
        <p style="font-size:12px;color:#A0AEC0;text-align:center">Si tenés alguna duda, escribile al docente por el chat de Luderis.</p>
        <div style="text-align:center;padding:16px 0 0">
          <a href="${APP_URL}/functions/v1/smart-worker?unsub=${await makeUnsubToken(insc.alumno_email)}" style="font-size:11px;color:#A0AEC0;text-decoration:underline">
            Ya no recordarme sobre mis clases
          </a>
        </div>
      </div>
      <div style="padding:20px 40px;text-align:center;border-top:1px solid #DDE5F5;background:#F6F9FF">
        <p style="color:#A0AEC0;font-size:12px;margin:4px 0">© Luderis · <a href="${APP_URL}" style="color:#1A6ED8;text-decoration:none">luderis.com</a></p>
      </div>
    </div>
  </div>
</body></html>`;

          // Push primero; email solo si no hay subscripción activa
          const pushSent = await tryPush(
            insc.alumno_email,
            `⏰ Tu clase es mañana`,
            `${pub.titulo} — ${fechaFormateada}${hora}`,
            `recordatorio-${pub.id}`
          );
          if (pushSent === 0) {
            await sendEmail(insc.alumno_email, `⏰ Recordatorio: "${pub.titulo}" es mañana`, html);
          }
          enviados++;
        }

        // También avisar al docente
        const htmlDocente = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F6F9FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,110,216,.08);border:1px solid #DDE5F5">
      <div style="background:linear-gradient(160deg,#0A2A5E 0%,#1A6ED8 55%,#2EC4A0 100%);padding:32px 40px;text-align:center">
        <img src="https://classelink.vercel.app/logo.png" width="56" height="56" style="border-radius:14px;display:block;margin:0 auto 10px" alt=""/>
        <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;letter-spacing:-.5px">Luderis</h1>
        <p style="color:rgba(255,255,255,.75);margin:6px 0 0;font-size:13px">📋 Tus clases de mañana · ${inscripciones.length} alumno${inscripciones.length !== 1 ? "s" : ""} inscripto${inscripciones.length !== 1 ? "s" : ""}</p>
      </div>
      <div style="padding:32px 40px">
        <h2 style="color:#0D1F3C;font-size:20px;margin:0 0 16px">${esc(pub.titulo)}</h2>
        <div style="background:#F6F9FF;border:1px solid #DDE5F5;border-radius:10px;padding:16px 20px;margin:16px 0">
          <div style="font-size:11px;color:#5A7294;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px">Cuándo</div>
          <div style="font-size:16px;color:#0D1F3C;font-weight:700;text-transform:capitalize">${esc(new Date(pub.fecha_inicio).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }))}${pub.hora_inicio ? ` a las ${esc(pub.hora_inicio.slice(0, 5))}` : ""}</div>
        </div>
        ${lugar}
        <p style="text-align:center;margin:24px 0">
          <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#1A6ED8,#2EC4A0);color:#fff;text-decoration:none;padding:14px 32px;border-radius:24px;font-weight:700;font-size:15px">
            Ver mi clase →
          </a>
        </p>
      </div>
      <div style="padding:20px 40px;text-align:center;border-top:1px solid #DDE5F5;background:#F6F9FF">
        <p style="color:#A0AEC0;font-size:12px;margin:4px 0">© Luderis · <a href="${APP_URL}" style="color:#1A6ED8;text-decoration:none">luderis.com</a></p>
      </div>
    </div>
  </div>
</body></html>`;

        // Push primero al docente; email si no tiene subscripción
        const pushDoc = await tryPush(
          pub.autor_email,
          `📋 Tus clases de mañana`,
          `${inscripciones.length} alumno${inscripciones.length !== 1 ? "s" : ""} en "${pub.titulo}"`,
          `recordatorio-doc-${pub.id}`
        );
        if (pushDoc === 0) {
          await sendEmail(pub.autor_email, `📋 Tenés clases mañana — "${pub.titulo}"`, htmlDocente);
        }
        enviados++;

      } catch (e) {
        console.error(`Error procesando pub ${pub.id}:`, e);
      }
    }

    // ── Digest diario de alertas ──────────────────────────────────────────────
    try {
      const pendingAlerts = await supa(
        "alertas_digest_queue?sent_at=is.null&select=*&order=created_at.asc"
      ) as any[];

      if (pendingAlerts?.length) {
        // Agrupar por usuario
        const byUser: Record<string, any[]> = {};
        for (const row of pendingAlerts) {
          if (!byUser[row.usuario_email]) byUser[row.usuario_email] = [];
          byUser[row.usuario_email].push(row);
        }

        for (const [email, matches] of Object.entries(byUser)) {
          try {
            const count = matches.length;
            // Intentar push primero vía send-email (que internamente llama a send-push)
            const emailRes = await fetch(`${SUPA_URL}/functions/v1/send-email`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                template: "alerta_digest",
                to: email,
                data: { matches, count },
              }),
            });
            if (emailRes.ok) {
              // Marcar como enviados
              const ids = matches.map((m: any) => m.id).join(",");
              await supa(
                `alertas_digest_queue?id=in.(${ids})`,
                "PATCH",
                { sent_at: new Date().toISOString() }
              );
              enviados++;
            }
          } catch (e) {
            console.error(`Error enviando digest a ${email}:`, e);
          }
        }
      }
    } catch (e) {
      console.error("Error procesando digest de alertas:", e);
    }

    // ── Limpieza de filas antiguas (sent_at > 30 días) ────────────────────────
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      await supa(
        `alertas_digest_queue?sent_at=lt.${cutoff.toISOString()}`,
        "DELETE"
      );
    } catch { /* silencioso */ }

    return new Response(
      JSON.stringify({ ok: true, enviados, clases: pubs?.length ?? 0 }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("smart-worker error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
