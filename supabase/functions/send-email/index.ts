/**
 * Supabase Edge Function: send-email
 * Envía emails transaccionales usando Resend (resend.com).
 * Para templates elegibles intenta push primero (via send-push);
 * solo manda email si el push no llegó a ninguna subscripción.
 *
 * Secrets:
 *   RESEND_API_KEY, FROM_EMAIL, APP_URL
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Helpers de seguridad ───────────────────────────────────────────────────────
const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const safeUrl = (u: unknown, fallback = "#"): string => {
  const s = String(u ?? "").trim();
  return /^https?:\/\//i.test(s) ? s : fallback;
};

const URL_KEYS = new Set(["pdf_url", "pub_url"]);
function escapeData(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      typeof v === "string" ? (URL_KEYS.has(k) ? safeUrl(v) : esc(v)) : v,
    ])
  );
}

// ── Paleta ─────────────────────────────────────────────────────────────────────
const BRAND = {
  blue:   "#1A6ED8",
  teal:   "#2EC4A0",
  bg:     "#F6F9FF",
  text:   "#0D1F3C",
  muted:  "#5A7294",
  border: "#DDE5F5",
};

// ── Base HTML ──────────────────────────────────────────────────────────────────
const emailBase = (content: string, preheader = "") => `
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
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <img src="https://classelink.vercel.app/logo.png" alt="Luderis"/>
        <h1>Luderis</h1>
        <p>Aprendé lo que quieras · Enseñá lo que sabés</p>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Luderis · Buenos Aires, Argentina</p>
        <p><a href="{APP_URL}">Ir a Luderis</a> · <a href="mailto:contacto@luderis.com">Contacto</a></p>
        <p style="margin-top:8px;color:#A0AEC0;font-size:11px;">Recibís este email porque tenés una cuenta en Luderis.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

// ── Templates ──────────────────────────────────────────────────────────────────
const TEMPLATES: Record<string, (data: any, appUrl: string) => { subject: string; html: string; preheader?: string }> = {

  bienvenida: (data, appUrl) => ({
    subject: "¡Bienvenido/a a Luderis! 🎓",
    preheader: "Tu cuenta está lista. Empezá a explorar clases y docentes.",
    html: emailBase(`
      <h2>¡Hola, ${data.nombre || "!"}  Bienvenido/a a Luderis</h2>
      <p>Tu cuenta ya está activa. Podés explorar clases, cursos y docentes, o publicar lo que sabés enseñar.</p>
      <div class="info-box">
        <div class="label">Tu cuenta</div>
        <div class="value">${data.email}</div>
      </div>
      <p style="text-align:center;margin:24px 0;">
        <a href="${appUrl}" class="btn">Explorar clases →</a>
      </p>
      <div class="divider"/>
      <p style="font-size:13px;color:${BRAND.muted};">
        <strong>¿Qué podés hacer?</strong><br/>
        🔍 Buscar clases con IA · 📚 Inscribirte en cursos · 💬 Chatear con docentes · ⭐ Dejar reseñas
      </p>
    `, "Tu cuenta está lista. Empezá a explorar."),
  }),

  nueva_inscripcion: (data, appUrl) => ({
    subject: `Nueva inscripción en "${data.pub_titulo}"`,
    preheader: `${data.alumno_nombre} se inscribió en tu clase.`,
    html: emailBase(`
      <h2>¡Tenés un nuevo alumno!</h2>
      <p><strong>${data.alumno_nombre}</strong> se inscribió en tu publicación.</p>
      <div class="info-box">
        <div class="label">Publicación</div>
        <div class="value">${data.pub_titulo}</div>
      </div>
      <div class="info-box">
        <div class="label">Alumno</div>
        <div class="value">${data.alumno_nombre}</div>
      </div>
      <p>Entrá a Luderis para ver los detalles y coordinar con tu nuevo alumno.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${data.pub_id ? `${appUrl}?pub=${data.pub_id}` : `${appUrl}?page=cuenta`}" class="btn">Ver la clase →</a>
      </p>
    `, `${data.alumno_nombre} se inscribió en tu clase.`),
  }),

  oferta_recibida: (data, appUrl) => ({
    subject: `Recibiste una oferta para "${data.pub_titulo}"`,
    preheader: "Un docente quiere enseñarte.",
    html: emailBase(`
      <h2>¡Recibiste una oferta!</h2>
      <p>Un docente respondió a tu búsqueda.</p>
      <div class="info-box">
        <div class="label">Tu búsqueda</div>
        <div class="value">${data.pub_titulo}</div>
      </div>
      <div class="info-box">
        <div class="label">Docente</div>
        <div class="value">${data.docente_nombre}</div>
      </div>
      ${data.mensaje ? `<div class="info-box"><div class="label">Mensaje</div><div class="value" style="font-style:italic">"${data.mensaje}"</div></div>` : ""}
      <p>Entrá para ver la oferta completa y aceptar o rechazar.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${appUrl}?page=cuenta&tab=ofertas" class="btn">Ver oferta →</a>
      </p>
    `, "Un docente respondió a tu búsqueda."),
  }),

  oferta_aceptada: (data, appUrl) => ({
    subject: `Tu oferta fue aceptada 🎉`,
    preheader: "¡Felicitaciones! Tu oferta fue aceptada.",
    html: emailBase(`
      <h2>¡Tu oferta fue aceptada!</h2>
      <p><strong>${data.alumno_nombre}</strong> aceptó tu oferta. Ya podés chatear directamente.</p>
      <div class="info-box">
        <div class="label">Publicación</div>
        <div class="value">${data.pub_titulo}</div>
      </div>
      <div class="info-box">
        <div class="label">Alumno</div>
        <div class="value">${data.alumno_nombre}</div>
      </div>
      <p>El próximo paso es coordinar los detalles por el chat de Luderis.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${appUrl}?page=chats" class="btn">Ir al chat →</a>
      </p>
    `, "¡Tu oferta fue aceptada!"),
  }),

  pago_aprobado: (data, appUrl) => ({
    subject: `Pago aprobado — ${data.pub_titulo} 💳`,
    preheader: "Tu pago fue procesado exitosamente.",
    html: emailBase(`
      <h2>¡Pago aprobado!</h2>
      <p>Tu pago fue procesado exitosamente. Ya tenés acceso completo a la clase.</p>
      <div class="info-box">
        <div class="label">Clase / Curso</div>
        <div class="value">${data.pub_titulo}</div>
      </div>
      <div class="info-box">
        <div class="label">Monto pagado</div>
        <div class="value">$${Number(data.monto).toLocaleString("es-AR")}</div>
      </div>
      <div class="info-box">
        <div class="label">N° de transacción</div>
        <div class="value" style="font-size:12px;color:${BRAND.muted};">${data.mp_payment_id}</div>
      </div>
      <p>Guardá este email como comprobante de pago.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${appUrl}" class="btn">Ir a mis clases →</a>
      </p>
    `, "Tu pago fue procesado exitosamente."),
  }),

  clase_finalizada: (data, appUrl) => ({
    subject: `La clase "${data.pub_titulo}" finalizó — dejá tu reseña`,
    preheader: "Contanos cómo fue tu experiencia.",
    html: emailBase(`
      <h2>¿Cómo fue tu experiencia?</h2>
      <p>La clase <strong>${data.pub_titulo}</strong> finalizó. Tu opinión ayuda a otros alumnos a elegir.</p>
      <div class="info-box">
        <div class="label">Docente</div>
        <div class="value">${data.docente_nombre}</div>
      </div>
      <p style="text-align:center;margin:24px 0;">
        <a href="${appUrl}" class="btn">Dejar mi reseña →</a>
      </p>
      <p style="font-size:13px;color:${BRAND.muted};">Las reseñas son públicas y ayudan a la comunidad. ¡Gracias por participar!</p>
    `, "Contanos cómo fue tu experiencia."),
  }),

  nuevo_mensaje: (data, appUrl) => ({
    subject: `Nuevo mensaje de ${data.de_nombre}`,
    preheader: `"${(data.preview || "").slice(0, 60)}..."`,
    html: emailBase(`
      <h2>Tenés un mensaje nuevo</h2>
      <p><strong>${data.de_nombre}</strong> te escribió sobre <strong>${data.pub_titulo}</strong>.</p>
      ${data.preview ? `<div class="info-box"><div class="label">Mensaje</div><div class="value" style="font-style:italic">"${data.preview.slice(0,120)}${data.preview.length>120?"...":""}"</div></div>` : ""}
      <p style="text-align:center;margin:24px 0;">
        <a href="${appUrl}?page=chats" class="btn">Responder →</a>
      </p>
    `, `Nuevo mensaje de ${data.de_nombre}.`),
  }),

  comprobante_inscripcion: (data: any, appUrl: string) => ({
    subject: `Inscripción confirmada — ${data.pub_titulo}`,
    preheader: "Tu inscripción fue registrada exitosamente.",
    html: emailBase(`
      <h2>¡Inscripción confirmada!</h2>
      <p>Te inscribiste exitosamente. Guardá este email como comprobante.</p>
      <div class="info-box">
        <div class="label">Clase / Curso</div>
        <div class="value">${data.pub_titulo}</div>
      </div>
      <div class="info-box">
        <div class="label">Docente</div>
        <div class="value">${data.docente_nombre}</div>
      </div>
      ${data.modalidad ? `<div class="info-box"><div class="label">Modalidad</div><div class="value">${data.modalidad}</div></div>` : ""}
      ${data.precio ? `<div class="info-box"><div class="label">Precio</div><div class="value">$${Number(data.precio).toLocaleString("es-AR")} ${data.moneda || "ARS"}</div></div>` : ""}
      <p>Ya podés acceder al contenido desde Luderis.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${data.pub_id ? `${appUrl}?pub=${data.pub_id}` : appUrl}" class="btn">Ver mi inscripción →</a>
      </p>
    `, "Tu inscripción fue confirmada."),
  }),

  contraoferta: (data: any, appUrl: string) => ({
    subject: `Nueva contraoferta en "${data.pub_titulo}"`,
    preheader: `${data.de_nombre} te envió una contraoferta.`,
    html: emailBase(`
      <h2>Recibiste una contraoferta</h2>
      <p><strong>${data.de_nombre}</strong> respondió con una contraoferta.</p>
      <div class="info-box">
        <div class="label">Publicación</div>
        <div class="value">${data.pub_titulo}</div>
      </div>
      <div class="info-box">
        <div class="label">Precio propuesto</div>
        <div class="value">$${Number(data.precio_nuevo).toLocaleString("es-AR")} / ${data.tipo_precio || "hora"}</div>
      </div>
      ${data.mensaje ? `<div class="info-box"><div class="label">Mensaje</div><div class="value" style="font-style:italic">"${data.mensaje}"</div></div>` : ""}
      <p>Ingresá a Luderis para aceptar, rechazar o hacer tu propia contraoferta.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${appUrl}?page=cuenta&tab=ofertas" class="btn">Ver la contraoferta →</a>
      </p>
    `, `${data.de_nombre} te envió una contraoferta.`),
  }),

  nueva_evaluacion: (data: any, appUrl: string) => ({
    subject: `Nueva evaluación disponible — ${data.curso_titulo}`,
    preheader: "Tu docente publicó una nueva evaluación.",
    html: emailBase(`
      <h2>Nueva evaluación disponible</h2>
      <p>Tu docente publicó una nueva evaluación en el curso.</p>
      <div class="info-box">
        <div class="label">Evaluación</div>
        <div class="value">${data.pub_titulo}</div>
      </div>
      <div class="info-box">
        <div class="label">Tipo</div>
        <div class="value" style="text-transform:capitalize">${data.tipo_eval || "evaluación"}</div>
      </div>
      <p>Ingresá a Luderis para completarla antes de la fecha límite.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${data.pub_id ? `${appUrl}?pub=${data.pub_id}` : appUrl}" class="btn">Ir a la evaluación →</a>
      </p>
    `, "Tu docente publicó una nueva evaluación."),
  }),

  docente_aprobado: (data: any, appUrl: string) => ({
    subject: "¡Tu solicitud como docente fue aprobada! 🎉",
    preheader: "Ya podés publicar clases y cursos en Luderis.",
    html: emailBase(`
      <h2>¡Felicitaciones, ${data.nombre}!</h2>
      <p>Tu solicitud para ser docente en Luderis fue <strong>aprobada</strong>. Ya podés empezar a publicar clases y cursos.</p>
      <div class="info-box" style="background:#EBF8F4;border-color:#2EC4A040;">
        <div class="label" style="color:#2EC4A0;">Estado</div>
        <div class="value" style="color:#0F3F7A;font-weight:800;">✅ Verificado como Docente</div>
      </div>
      <p>Desde tu perfil ya podés crear publicaciones, subir contenido y conectar con tus futuros alumnos.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${appUrl}?page=publicar" class="btn">Crear mi primera clase →</a>
      </p>
    `, "¡Tu solicitud como docente fue aprobada!"),
  }),

  docente_rechazado: (data: any, appUrl: string) => ({
    subject: "Tu solicitud como docente requiere revisión",
    preheader: "Recibimos tu solicitud. Hay algo que necesitamos que corrijas.",
    html: emailBase(`
      <h2>Hola, ${data.nombre}</h2>
      <p>Revisamos tu solicitud para ser docente en Luderis y por el momento <strong>no pudimos aprobarla</strong>.</p>
      ${data.razon ? `
      <div class="info-box" style="border-color:#F87171;background:#FEF2F2;">
        <div class="label" style="color:#DC2626;">Motivo</div>
        <div class="value">${data.razon}</div>
      </div>` : ""}
      <p>Si creés que es un error o querés volver a enviar tu solicitud con los datos correctos, podés hacerlo desde tu perfil.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${appUrl}?page=cuenta" class="btn">Volver a solicitar →</a>
      </p>
      <p style="font-size:13px;color:#5A7294;">¿Tenés dudas? Escribinos a <a href="mailto:contacto@luderis.com" style="color:#1A6ED8;">contacto@luderis.com</a>.</p>
    `, "Hay algo que necesitamos que corrijas en tu solicitud."),
  }),

  liquidacion_disponible: (data: any, appUrl: string) => ({
    subject: `Tu liquidación de ${data.periodo_label} está disponible 💰`,
    preheader: `Monto neto: $${Number(data.monto_neto).toLocaleString("es-AR")}. Descargá tu PDF.`,
    html: emailBase(`
      <h2>Tu liquidación mensual está lista</h2>
      <p>¡Hola <strong>${data.nombre}</strong>! Ya procesamos tu liquidación de <strong>${data.periodo_label}</strong>.</p>
      <div class="info-box">
        <div class="label">Período</div>
        <div class="value">${data.periodo_label}</div>
      </div>
      <div class="info-box">
        <div class="label">Clases cobradas</div>
        <div class="value">${data.cantidad_clases}</div>
      </div>
      <div class="info-box">
        <div class="label">Monto bruto total</div>
        <div class="value">$${Number(data.monto_bruto).toLocaleString("es-AR")}</div>
      </div>
      <div class="info-box">
        <div class="label">Comisión Luderis (10%)</div>
        <div class="value" style="color:#5A7294;">- $${Number(data.comision).toLocaleString("es-AR")}</div>
      </div>
      <div class="info-box" style="background:#EBF8F4;border-color:#2EC4A040;">
        <div class="label" style="color:#2EC4A0;">MONTO NETO A COBRAR</div>
        <div class="value" style="font-size:22px;font-weight:800;color:#0F3F7A;">$${Number(data.monto_neto).toLocaleString("es-AR")}</div>
      </div>
      <p style="text-align:center;margin:24px 0;">
        <a href="${data.pdf_url}" class="btn">Descargar PDF →</a>
      </p>
      <div class="divider"/>
      <p style="font-size:13px;color:#5A7294;">
        <strong>¿Cómo facturar?</strong><br/>
        Emití tu factura/recibo electrónico desde AFIP (o tu app de facturación) por el monto neto indicado.
        El PDF adjunto sirve como referencia para la emisión del comprobante. Tenés 30 días para emitirlo.
      </p>
      <p style="text-align:center;margin:16px 0;">
        <a href="${appUrl}?page=cuenta&tab=pagos" style="color:#1A6ED8;font-size:13px;">Ver mis liquidaciones en Luderis →</a>
      </p>
    `, `Liquidación ${data.periodo_label} — Neto: $${Number(data.monto_neto).toLocaleString("es-AR")}`),
  }),

  nuevo_ayudante: (data: any, appUrl: string) => ({
    subject: `Ahora sos co-docente de "${data.pub_titulo}"`,
    preheader: `${data.docente_nombre} te agregó como co-docente.`,
    html: emailBase(`
      <h2>¡Sos co-docente!</h2>
      <p><strong>${data.docente_nombre}</strong> te agregó como co-docente en su publicación. Ahora podés subir contenido y ver los alumnos inscriptos.</p>
      <div class="info-box">
        <div class="label">Publicación</div>
        <div class="value" style="font-size:17px;font-weight:700;">${data.pub_titulo}</div>
      </div>
      <div class="info-box">
        <div class="label">Docente principal</div>
        <div class="value">${data.docente_nombre}</div>
      </div>
      <p>Como co-docente podés agregar contenido, responder en el foro y ver la lista de alumnos inscriptos.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${data.pub_id ? `${appUrl}?pub=${data.pub_id}` : appUrl}" class="btn">Ir a la clase →</a>
      </p>
    `, `${data.docente_nombre} te agregó como co-docente.`),
  }),

  alerta_digest: (data: any, appUrl: string) => {
    const matches: any[] = Array.isArray(data.matches) ? data.matches : [];
    const count = data.count ?? matches.length;
    const matchesHtml = matches.map((m: any) => {
      const pubUrl = m.pub_id ? `${appUrl}?pub=${encodeURIComponent(m.pub_id)}` : appUrl;
      return `
      <div style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;margin:12px 0;">
        <div style="padding:16px 20px;background:#fff;">
          <a href="${pubUrl}" style="font-size:16px;font-weight:700;color:${BRAND.text};text-decoration:none;display:block;margin-bottom:8px;">${esc(m.pub_titulo)}</a>
          <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:12px;">
            ${m.tipo      ? `<span style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:20px;padding:3px 10px;color:${BRAND.muted};">${esc(m.tipo)}</span>` : ""}
            ${m.materia   ? `<span style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:20px;padding:3px 10px;color:${BRAND.muted};">${esc(m.materia)}</span>` : ""}
            ${m.modalidad ? `<span style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:20px;padding:3px 10px;color:${BRAND.muted};">${esc(m.modalidad)}</span>` : ""}
            ${m.precio    ? `<span style="background:#EBF8F4;border:1px solid #2EC4A040;border-radius:20px;padding:3px 10px;color:#0F7A4A;font-weight:700;">${esc(m.precio)}</span>` : ""}
          </div>
          ${m.criterio_desc ? `<div style="font-size:12px;color:${BRAND.muted};margin-top:8px;font-style:italic;">Tu alerta: "${esc(m.criterio_desc)}"</div>` : ""}
        </div>
        <div style="padding:10px 20px;background:${BRAND.bg};border-top:1px solid ${BRAND.border};text-align:right;">
          <a href="${pubUrl}" style="font-size:13px;font-weight:700;color:${BRAND.blue};text-decoration:none;">Ver publicación →</a>
        </div>
      </div>`;
    }).join("");
    return {
      subject: count === 1
        ? `🔔 Nueva publicación que puede interesarte — ${esc(matches[0]?.pub_titulo ?? "")}`
        : `🔔 ${count} nuevas publicaciones que pueden interesarte`,
      preheader: count === 1
        ? `Apareció algo que coincide con tu alerta: ${esc(matches[0]?.pub_titulo ?? "")}`
        : `${count} nuevas publicaciones coinciden con tus alertas de búsqueda.`,
      html: emailBase(`
        <h2>${count === 1 ? "¡Apareció algo para vos!" : `¡${count} nuevas publicaciones para vos!`}</h2>
        <p style="color:${BRAND.muted};">
          ${count === 1
            ? "Esta publicación coincide con una de tus alertas de búsqueda."
            : `Estas publicaciones coinciden con tus alertas de búsqueda. Te las resumimos en un solo email.`}
        </p>
        ${matchesHtml}
        <p style="text-align:center;margin:28px 0;">
          <a href="${appUrl}" class="btn">Explorar en Luderis →</a>
        </p>
        <p style="font-size:12px;color:#A0AEC0;text-align:center;">Podés pausar o eliminar tus alertas desde Mi Cuenta → Alertas.</p>
      `, count === 1 ? `Nueva publicación: ${esc(matches[0]?.pub_titulo ?? "")}` : `${count} novedades que coinciden con tus alertas`),
    };
  },
};

// ── Push configs (push-first para estos templates) ────────────────────────────
// Si el push llega a ≥1 subscripción → se omite el email.
// Si sent=0 (sin subscripción activa) → se envía el email como fallback.
type PushCfg = { title: string; body: string; url: string; tag: string };
const PUSH_CONFIGS: Record<string, (d: Record<string, unknown>, appUrl: string) => PushCfg> = {

  nuevo_mensaje: (d, appUrl) => ({
    title: `Nuevo mensaje de ${d.de_nombre}`,
    body:  d.preview ? `"${String(d.preview).slice(0, 80)}"` : "Tenés un mensaje nuevo",
    url:   `${appUrl}?page=chats`,
    tag:   `msg-${d.de_nombre}`,
  }),

  nueva_inscripcion: (d, appUrl) => ({
    title: "¡Nuevo alumno!",
    body:  `${d.alumno_nombre} se inscribió en "${d.pub_titulo}"`,
    url:   d.pub_id ? `${appUrl}?pub=${d.pub_id}` : `${appUrl}?page=cuenta`,
    tag:   `insc-${d.pub_id ?? Date.now()}`,
  }),

  oferta_recibida: (d, appUrl) => ({
    title: "¡Recibiste una oferta!",
    body:  `${d.docente_nombre} quiere enseñarte "${d.pub_titulo}"`,
    url:   `${appUrl}?page=cuenta&tab=ofertas`,
    tag:   `oferta-${d.pub_id ?? Date.now()}`,
  }),

  oferta_aceptada: (d, appUrl) => ({
    title: "¡Tu oferta fue aceptada! 🎉",
    body:  `${d.alumno_nombre} aceptó tu oferta en "${d.pub_titulo}"`,
    url:   `${appUrl}?page=chats`,
    tag:   `oferta-ok-${d.pub_id ?? Date.now()}`,
  }),

  contraoferta: (d, appUrl) => ({
    title: "Nueva contraoferta",
    body:  `${d.de_nombre} propone $${Number(d.precio_nuevo).toLocaleString("es-AR")} / ${d.tipo_precio ?? "hora"}`,
    url:   `${appUrl}?page=cuenta&tab=ofertas`,
    tag:   `contra-${d.pub_id ?? Date.now()}`,
  }),

  clase_finalizada: (d, appUrl) => ({
    title: "¿Cómo fue tu clase?",
    body:  `Dejá tu reseña de "${d.pub_titulo}"`,
    url:   appUrl,
    tag:   `resena-${d.pub_id ?? Date.now()}`,
  }),

  nueva_evaluacion: (d, appUrl) => ({
    title: "Nueva evaluación disponible",
    body:  String(d.pub_titulo),
    url:   d.pub_id ? `${appUrl}?pub=${d.pub_id}` : appUrl,
    tag:   `eval-${d.pub_id ?? Date.now()}`,
  }),

  alerta_digest: (d, appUrl) => {
    const matches = Array.isArray(d.matches) ? d.matches as any[] : [];
    const count = (d.count as number) ?? matches.length;
    return {
      title: count === 1 ? "🔔 Nueva publicación para vos" : `🔔 ${count} novedades para vos`,
      body:  count === 1 ? String(matches[0]?.pub_titulo ?? "Nueva publicación") : `${count} publicaciones que coinciden con tus alertas`,
      url:   appUrl,
      tag:   `digest-alertas-${new Date().toISOString().slice(0, 10)}`,
    };
  },
};

// Llama a send-push con service role key y retorna cuántas subscripciones recibieron
async function tryPush(supaUrl: string, serviceKey: string, email: string, cfg: PushCfg): Promise<number> {
  try {
    const res = await fetch(`${supaUrl}/functions/v1/send-push`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: email, ...cfg }),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return (json.sent as number) ?? 0;
  } catch {
    return 0;
  }
}

// ── Handler principal ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const SUPA_URL  = Deno.env.get("SUPABASE_URL")!;
    const SUPA_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Permite service role key (llamadas internas) O JWT de usuario válido
    if (token !== SUPA_KEY) {
      const supaAuth = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });
      const { data: { user }, error: authErr } = await supaAuth.auth.getUser(token);
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "hola@luderis.com";
    const APP_URL    = Deno.env.get("APP_URL")    ?? "https://luderis.com";

    const body = await req.json();
    const { template, to, data = {} } = body;

    if (!template || !to) {
      return new Response(
        JSON.stringify({ error: "Faltan campos: template, to" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const tplFn = TEMPLATES[template];
    if (!tplFn) {
      return new Response(
        JSON.stringify({ error: `Template desconocido: ${template}. Disponibles: ${Object.keys(TEMPLATES).join(", ")}` }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const safeData = escapeData(data as Record<string, unknown>);

    // ── Intentar push primero para templates elegibles ─────────────────────────
    const pushCfgFn = PUSH_CONFIGS[template];
    if (pushCfgFn) {
      const pushCfg = pushCfgFn(safeData, APP_URL);
      const targets = Array.isArray(to) ? (to as string[]) : [to as string];
      let pushSent = 0;
      for (const email of targets) {
        pushSent += await tryPush(SUPA_URL, SUPA_KEY, email, pushCfg);
      }
      if (pushSent > 0) {
        console.log(`Push delivered | template=${template} | to=${targets.join(",")} | sent=${pushSent}`);
        return new Response(
          JSON.stringify({ ok: true, channel: "push", sent: pushSent }),
          { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      // sent=0 → sin subscripción activa → continuar con email como fallback
    }

    // ── Enviar email ───────────────────────────────────────────────────────────
    if (!RESEND_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY no configurado", code: "NO_KEY" }),
        { status: 503, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const { subject, html } = tplFn(safeData, APP_URL);
    const htmlFinal = html.replace(/\{APP_URL\}/g, APP_URL);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    `Luderis <${FROM_EMAIL}>`,
        to:      Array.isArray(to) ? to : [to],
        subject,
        html:    htmlFinal,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error(`Resend error ${res.status}:`, JSON.stringify(result));
      throw new Error(result.message ?? `Resend error ${res.status}`);
    }

    console.log(`Email sent | template=${template} | to=${Array.isArray(to)?to.join(","):to} | id=${result.id}`);

    return new Response(
      JSON.stringify({ ok: true, channel: "email", id: result.id }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("send-email error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
