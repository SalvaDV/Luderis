/**
 * avisos-externos — saca de la app los avisos que tienen plata en juego.
 *
 * Las notificaciones viven en la campanita de la app. Para las que arrancan un
 * plazo (aprobar horas, disputas, retiros, vencimientos) eso no alcanza: si el
 * usuario no abre la app, el plazo corre igual y se entera tarde. Esta función
 * corre cada 5 minutos por pg_cron y manda push + email de las críticas que
 * todavía no salieron.
 *
 * Auth: header x-cron-key contra config.cron_secret_avisos (tabla no legible
 * por usuarios). Marca aviso_externo_at SIEMPRE (haya salido o no el envío):
 * mejor perder un aviso que reintentar infinito y spamear. Solo mira
 * notificaciones no leídas de las últimas 48 hs.
 *
 * ?dry=1 → devuelve lo que mandaría, sin enviar ni marcar.
 *
 * Deploy: supabase functions deploy avisos-externos --no-verify-jwt
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

function emailHtml(items: { titulo: string; cuerpo: string }[], appUrl: string): string {
  const filas = items.map((i) => `
    <tr><td style="padding:10px 0;border-bottom:1px solid #DDE5F5">
      <div style="font-weight:700;color:#0D1F3C;font-size:15px">${i.titulo}</div>
      <div style="color:#5A7294;font-size:13px;line-height:1.6;margin-top:2px">${i.cuerpo}</div>
    </td></tr>`).join("");
  return `
  <div style="background:#F6F9FF;padding:28px 16px;font-family:system-ui,-apple-system,Segoe UI,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #DDE5F5;border-radius:14px;padding:26px 28px">
      <div style="font-weight:800;font-size:18px;color:#1A6ED8;margin-bottom:14px">Luderis</div>
      <table style="width:100%;border-collapse:collapse">${filas}</table>
      <a href="${appUrl}" style="display:block;text-align:center;background:#1A6ED8;color:#fff;text-decoration:none;border-radius:10px;padding:13px;font-weight:700;font-size:14px;margin-top:20px">Abrir Luderis</a>
      <div style="color:#5A7294;font-size:11px;margin-top:16px;line-height:1.5">
        Recibís este aviso porque hay una novedad con plazos o dinero en tu cuenta.
      </div>
    </div>
  </div>`;
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

    // Agrupar por destinatario: un solo email por persona por tick, con todas
    // sus novedades adentro. El push sí va uno por noticia (el sistema los apila).
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

      // Push: send-push acepta el service role como caller interno.
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

      // Email: uno solo con todo.
      if (RESEND) {
        try {
          const asunto = items.length === 1 ? items[0].titulo : `Tenés ${items.length} novedades en Luderis`;
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND}` },
            body: JSON.stringify({ from: `Luderis <${FROM}>`, to: [email], subject: asunto, html: emailHtml(items, APP_URL) }),
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
