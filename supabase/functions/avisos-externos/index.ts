/**
 * avisos-externos — saca de la app los avisos que tienen plata en juego.
 *
 * Las notificaciones viven en la campanita de la app. Para las que arrancan un
 * plazo (aprobar horas, disputas, retiros, vencimientos) eso no alcanza: si el
 * usuario no abre la app, el plazo corre igual y se entera tarde. Esta función
 * corre cada 5 minutos por pg_cron y manda push + email de las críticas que
 * todavía no salieron.
 *
 * El email usa EL MISMO diseño que send-email (header con degradé, tarjeta,
 * botón, footer): el usuario no tiene por qué notar que lo mandó otro circuito.
 *
 * Auth: header x-cron-key contra config.cron_secret_avisos (tabla no legible
 * por usuarios). Marca aviso_externo_at SIEMPRE (haya salido o no el envío):
 * mejor perder un aviso que reintentar infinito y spamear. Solo mira
 * notificaciones no leídas de las últimas 48 hs.
 *
 * ?dry=1 → devuelve lo que mandaría, sin enviar ni marcar.
 *
 * Deploy: verify_jwt on; el cron manda Bearer anon + x-cron-key.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Qué tipos salen de la app, con qué título y qué cuerpo. `pt` es pub_titulo:
// en confirmar_clase trae el nombre de la clase; en el resto ya es la frase
// completa que escribió el emisor.
const CRITICOS: Record<string, { titulo: string; cuerpo: (pt: string | null) => string }> = {
  confirmar_clase: {
    titulo: "Tenés horas de clase por confirmar",
    cuerpo: (pt) => pt
      ? `El docente registró horas de "${pt}". Entrá a Luderis para aprobarlas u objetarlas — si no respondés, se aprueban solas.`
      : "El docente registró horas de una clase. Entrá a Luderis para aprobarlas u objetarlas.",
  },
  horas_ajustadas:  { titulo: "Revisamos las horas de una clase", cuerpo: (pt) => pt ?? "Ajustamos las horas de una clase con el registro de presencia." },
  disputa_abierta:  { titulo: "Hay un reclamo de horas abierto",  cuerpo: (pt) => pt ?? "Se abrió un reclamo sobre las horas de una clase." },
  disputa_resuelta: { titulo: "Se resolvió el reclamo de horas",  cuerpo: (pt) => pt ?? "El reclamo de horas de tu clase quedó resuelto." },
  retiro_solicitado:{ titulo: "Hay un retiro pendiente",          cuerpo: (pt) => pt ?? "Hay una solicitud de retiro esperando que la proceses." },
  retiro_procesado: { titulo: "Procesamos tu retiro",             cuerpo: (pt) => pt ?? "Tu retiro fue procesado." },
  retiro_rechazado: { titulo: "Tu retiro fue rechazado",          cuerpo: (pt) => pt ?? "Rechazamos tu solicitud de retiro y devolvimos el monto a tu saldo." },
  horas_por_vencer: { titulo: "Tenés horas por vencer",           cuerpo: (pt) => pt ?? "Te quedan horas compradas sin usar que están por vencer." },
  pago_liberado:    { titulo: "Te pagaron una clase",             cuerpo: (pt) => pt ?? "Se liberó un pago a tu saldo de Luderis." },
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ── Mismo molde visual que send-email ────────────────────────────────────────
const BRAND = { blue: "#1A6ED8", teal: "#2EC4A0", bg: "#F6F9FF", text: "#0D1F3C", muted: "#5A7294", border: "#DDE5F5" };

const emailBase = (content: string, appUrl: string, preheader = "") => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Luderis</title>
  <style>
    body{margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:${BRAND.text};}
    .wrapper{max-width:600px;margin:0 auto;padding:32px 16px;}
    .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,110,216,.08);border:1px solid ${BRAND.border};}
    .header{background:linear-gradient(160deg,#0A2A5E 0%,#1A6ED8 55%,#2EC4A0 100%);padding:32px 40px;text-align:center;}
    .header img{width:56px;height:56px;border-radius:14px;display:block;margin:0 auto 10px;}
    .header h1{color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-.5px;}
    .header p{color:rgba(255,255,255,.75);margin:6px 0 0;font-size:13px;letter-spacing:0.3px;}
    .body{padding:32px 40px;}
    .body h2{color:${BRAND.text};font-size:20px;font-weight:700;margin:0 0 12px;}
    .body p{color:${BRAND.muted};font-size:15px;line-height:1.7;margin:0 0 16px;}
    .body strong{color:${BRAND.text};}
    .btn{display:inline-block;background:linear-gradient(135deg,${BRAND.blue},${BRAND.teal});color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:24px;font-weight:700;font-size:15px;margin:8px 0;box-shadow:0 4px 14px rgba(26,110,216,.3);}
    .info-box{background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:10px;padding:16px 20px;margin:16px 0;}
    .info-box .label{font-size:11px;color:${BRAND.muted};font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px;}
    .info-box .value{font-size:15px;color:${BRAND.text};font-weight:600;}
    .divider{height:1px;background:${BRAND.border};margin:24px 0;}
    .footer{padding:24px 40px;text-align:center;border-top:1px solid ${BRAND.border};background:${BRAND.bg};}
    .footer p{color:${BRAND.muted};font-size:12px;margin:4px 0;}
    .footer a{color:${BRAND.blue};text-decoration:none;}
    @media(max-width:480px){.body,.header,.footer{padding:24px 20px!important;}}
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>` : ""}
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <img src="${appUrl}/logo.png" alt="Luderis"/>
        <h1>Luderis</h1>
        <p>Aprendé lo que quieras · Enseñá lo que sabés</p>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Luderis · Buenos Aires, Argentina</p>
        <p><a href="${appUrl}">Ir a Luderis</a> · <a href="mailto:contacto@luderis.com">Contacto</a></p>
        <p style="margin-top:8px;color:#A0AEC0;font-size:11px;">Recibís este email porque hay una novedad con plazos o dinero en tu cuenta de Luderis.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

function emailContenido(items: { titulo: string; cuerpo: string }[], appUrl: string): string {
  if (items.length === 1) {
    return `
      <h2>${esc(items[0].titulo)}</h2>
      <p>${esc(items[0].cuerpo)}</p>
      <div style="text-align:center"><a class="btn" href="${appUrl}">Abrir Luderis</a></div>`;
  }
  const cajas = items.map((i) => `
    <div class="info-box">
      <div class="label">${esc(i.titulo)}</div>
      <div class="value" style="font-weight:500;line-height:1.6">${esc(i.cuerpo)}</div>
    </div>`).join("");
  return `
    <h2>Tenés ${items.length} novedades</h2>
    ${cajas}
    <div style="text-align:center"><a class="btn" href="${appUrl}">Abrir Luderis</a></div>`;
}

Deno.serve(async (req) => {
  try {
    const SB_URL  = Deno.env.get("SUPABASE_URL")!;
    const SB_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND  = Deno.env.get("RESEND_API_KEY") ?? "";
    const FROM    = Deno.env.get("FROM_EMAIL") ?? "avisos@luderis.com.ar";
    const APP_URL = Deno.env.get("APP_URL") ?? "https://classelink.vercel.app";
    const supa = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

    const { data: cfg } = await supa.from("config").select("valor")
      .eq("clave", "cron_secret_avisos").single();
    const key = req.headers.get("x-cron-key") ?? "";
    if (!cfg?.valor || key !== cfg.valor) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const dry = new URL(req.url).searchParams.get("dry") === "1";
    const desde = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

    const { data: pendientes, error } = await supa.from("notificaciones")
      .select("id, alumno_email, tipo, pub_titulo")
      .is("aviso_externo_at", null)
      .eq("leida", false)
      .in("tipo", Object.keys(CRITICOS))
      .gt("created_at", desde)
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) throw error;
    if (!pendientes?.length) {
      return new Response(JSON.stringify({ ok: true, enviados: 0 }), { status: 200 });
    }

    // Un solo email por persona por tick, con todas sus novedades adentro. El
    // push va uno por noticia (el sistema los apila).
    const porEmail = new Map<string, typeof pendientes>();
    for (const n of pendientes) {
      if (!n.alumno_email) continue;
      if (!porEmail.has(n.alumno_email)) porEmail.set(n.alumno_email, []);
      porEmail.get(n.alumno_email)!.push(n);
    }

    let pushOk = 0, emailOk = 0;
    const resumen: unknown[] = [];

    for (const [email, notifs] of porEmail) {
      const items = notifs.map((n) => {
        const c = CRITICOS[n.tipo];
        return { titulo: c.titulo, cuerpo: c.cuerpo(n.pub_titulo ?? null) };
      });
      resumen.push({ email, tipos: notifs.map((n) => n.tipo) });
      if (dry) continue;

      for (const it of items) {
        try {
          const r = await fetch(`${SB_URL}/functions/v1/send-push`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SB_KEY}`, "apikey": SB_KEY },
            body: JSON.stringify({ to: email, title: it.titulo, body: it.cuerpo, url: "/", tag: "aviso-critico" }),
          });
          if (r.ok) pushOk++;
        } catch (e) { console.warn("push fallo:", (e as Error).message); }
      }

      if (RESEND) {
        try {
          const asunto = items.length === 1 ? items[0].titulo : `Tenés ${items.length} novedades en Luderis`;
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND}` },
            body: JSON.stringify({
              from: `Luderis <${FROM}>`, to: [email], subject: asunto,
              html: emailBase(emailContenido(items, APP_URL), APP_URL, items[0].cuerpo),
            }),
          });
          if (r.ok) emailOk++;
          else console.warn("email fallo:", r.status, await r.text());
        } catch (e) { console.warn("email fallo:", (e as Error).message); }
      }
    }

    if (!dry) {
      await supa.from("notificaciones")
        .update({ aviso_externo_at: new Date().toISOString() })
        .in("id", pendientes.map((n) => n.id));
    }

    return new Response(JSON.stringify({
      ok: true, dry, pendientes: pendientes.length,
      personas: porEmail.size, push_ok: pushOk, email_ok: emailOk,
      ...(dry ? { resumen } : {}),
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("avisos-externos error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
