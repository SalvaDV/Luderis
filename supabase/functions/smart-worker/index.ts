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

// ── Unsubscribe token simple (HMAC-like con email) ───────────────────────────
const makeUnsubToken = (email: string) => btoa(email + ":luderis-unsub-v1").replace(/=/g, "");

Deno.serve(async (req) => {
  // Handle unsubscribe GET request
  if (req.method === "GET") {
    const url = new URL(req.url);
    const token = url.searchParams.get("unsub");
    if (token) {
      try {
        const decoded = atob(token.replace(/-/g, "="));
        const email = decoded.replace(":luderis-unsub-v1", "");
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

    if (!pubs?.length) {
      return new Response(JSON.stringify({ ok: true, enviados: 0, msg: "Sin clases mañana" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    let enviados = 0;

    for (const pub of pubs) {
      try {
        // Buscar inscriptos a esta clase
        const inscripciones = await supa(
          `inscripciones?publicacion_id=eq.${pub.id}&select=alumno_email`
        );

        if (!inscripciones?.length) continue;

        const fechaFormateada = new Date(pub.fecha_inicio).toLocaleDateString("es-AR", {
          weekday: "long", day: "numeric", month: "long",
        });
        const hora  = pub.hora_inicio ? ` a las ${pub.hora_inicio.slice(0, 5)}` : "";
        const lugar = pub.modalidad === "presencial" && pub.ubicacion
          ? `<p style="color:#5A7294">📍 Ubicación: <strong>${pub.ubicacion}</strong></p>`
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
      <div style="background:linear-gradient(135deg,#0F3F7A,#1A6ED8,#2EC4A0);padding:32px 40px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800">⏰ Recordatorio de clase</h1>
        <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px">Tu clase es mañana</p>
      </div>
      <div style="padding:32px 40px">
        <h2 style="color:#0D1F3C;font-size:20px;margin:0 0 16px">${pub.titulo}</h2>
        <div style="background:#F6F9FF;border:1px solid #DDE5F5;border-radius:10px;padding:16px 20px;margin:16px 0">
          <div style="font-size:11px;color:#5A7294;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px">Cuándo</div>
          <div style="font-size:16px;color:#0D1F3C;font-weight:700;text-transform:capitalize">${fechaFormateada}${hora}</div>
        </div>
        <div style="background:#F6F9FF;border:1px solid #DDE5F5;border-radius:10px;padding:16px 20px;margin:16px 0">
          <div style="font-size:11px;color:#5A7294;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px">Docente</div>
          <div style="font-size:15px;color:#0D1F3C;font-weight:600">${pub.autor_nombre || pub.autor_email.split("@")[0]}</div>
        </div>
        ${lugar}
        <p style="text-align:center;margin:24px 0">
          <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#1A6ED8,#2EC4A0);color:#fff;text-decoration:none;padding:14px 32px;border-radius:24px;font-weight:700;font-size:15px">
            Ver mi clase →
          </a>
        </p>
        <p style="font-size:12px;color:#A0AEC0;text-align:center">Si tenés alguna duda, escribile al docente por el chat de Luderis.</p>
        <div style="text-align:center;padding:16px 0 0">
          <a href="${APP_URL}/functions/v1/smart-worker?unsub=${makeUnsubToken(insc.alumno_email)}" style="font-size:11px;color:#A0AEC0;text-decoration:underline">
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

          await sendEmail(
            insc.alumno_email,
            `⏰ Recordatorio: "${pub.titulo}" es mañana`,
            html
          );
          enviados++;
        }

        // También avisar al docente
        const htmlDocente = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F6F9FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,110,216,.08);border:1px solid #DDE5F5">
      <div style="background:linear-gradient(135deg,#0F3F7A,#1A6ED8,#2EC4A0);padding:32px 40px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800">📋 Tus clases de mañana</h1>
        <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px">Tenés ${inscripciones.length} alumno${inscripciones.length !== 1 ? "s" : ""} inscripto${inscripciones.length !== 1 ? "s" : ""}</p>
      </div>
      <div style="padding:32px 40px">
        <h2 style="color:#0D1F3C;font-size:20px;margin:0 0 16px">${pub.titulo}</h2>
        <div style="background:#F6F9FF;border:1px solid #DDE5F5;border-radius:10px;padding:16px 20px;margin:16px 0">
          <div style="font-size:11px;color:#5A7294;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px">Cuándo</div>
          <div style="font-size:16px;color:#0D1F3C;font-weight:700;text-transform:capitalize">${new Date(pub.fecha_inicio).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}${pub.hora_inicio ? ` a las ${pub.hora_inicio.slice(0, 5)}` : ""}</div>
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

        await sendEmail(
          pub.autor_email,
          `📋 Tenés clases mañana — "${pub.titulo}"`,
          htmlDocente
        );
        enviados++;

      } catch (e) {
        console.error(`Error procesando pub ${pub.id}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, enviados, clases: pubs.length }),
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
