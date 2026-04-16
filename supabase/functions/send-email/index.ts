/**
 * Supabase Edge Function: send-email
 * Envía emails transaccionales usando Resend (resend.com)
 * Templates: bienvenida, nueva_inscripcion, oferta_aceptada, pago_aprobado, etc.
 *
 * Deploy:
 *   supabase functions deploy send-email --no-verify-jwt
 *
 * Secrets a configurar en Supabase Dashboard → Edge Functions → Secrets:
 *   RESEND_API_KEY   → tu API key de resend.com (re_xxxx)
 *   FROM_EMAIL       → ej: hola@luderis.com (debe estar verificado en Resend)
 *   APP_URL          → https://classelink.vercel.app
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Paleta de colores Luderis ──────────────────────────────────────────────────
const BRAND = {
  blue:   "#1A6ED8",
  teal:   "#2EC4A0",
  dark:   "#0F3F7A",
  bg:     "#F6F9FF",
  text:   "#0D1F3C",
  muted:  "#5A7294",
  border: "#DDE5F5",
};

// ── Base HTML del email ────────────────────────────────────────────────────────
const emailBase = (content: string, preheader = "") => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Luderis</title>
  <style>
    body { margin:0; padding:0; background:${BRAND.bg}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; color:${BRAND.text}; }
    .wrapper { max-width:600px; margin:0 auto; padding:32px 16px; }
    .card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(26,110,216,.08); border:1px solid ${BRAND.border}; }
    .header { background:linear-gradient(135deg,${BRAND.dark},${BRAND.blue},${BRAND.teal}); padding:32px 40px; text-align:center; }
    .header img { width:48px; height:48px; margin-bottom:12px; }
    .header h1 { color:#fff; margin:0; font-size:28px; font-weight:800; letter-spacing:-.5px; }
    .body { padding:32px 40px; }
    .body h2 { color:${BRAND.text}; font-size:20px; font-weight:700; margin:0 0 12px; }
    .body p { color:${BRAND.muted}; font-size:15px; line-height:1.7; margin:0 0 16px; }
    .body strong { color:${BRAND.text}; }
    .btn { display:inline-block; background:linear-gradient(135deg,${BRAND.blue},${BRAND.teal}); color:#fff!important; text-decoration:none; padding:14px 32px; border-radius:24px; font-weight:700; font-size:15px; margin:8px 0; box-shadow:0 4px 14px rgba(26,110,216,.3); }
    .info-box { background:${BRAND.bg}; border:1px solid ${BRAND.border}; border-radius:10px; padding:16px 20px; margin:16px 0; }
    .info-box .label { font-size:11px; color:${BRAND.muted}; font-weight:700; letter-spacing:.5px; text-transform:uppercase; margin-bottom:4px; }
    .info-box .value { font-size:15px; color:${BRAND.text}; font-weight:600; }
    .divider { height:1px; background:${BRAND.border}; margin:24px 0; }
    .footer { padding:24px 40px; text-align:center; border-top:1px solid ${BRAND.border}; background:${BRAND.bg}; }
    .footer p { color:${BRAND.muted}; font-size:12px; margin:4px 0; }
    .footer a { color:${BRAND.blue}; text-decoration:none; }
    @media(max-width:480px){ .body,.header,.footer{ padding:24px 20px!important; } }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>Luderis</h1>
        <p style="color:rgba(255,255,255,.75);margin:4px 0 0;font-size:14px;">Aprendé lo que quieras, enseñá lo que sabés.</p>
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

  comprobante_inscripcion: (data, appUrl) => ({
    subject: `Comprobante de inscripción — ${data.pub_titulo}`,
    preheader: "Tu inscripción fue registrada exitosamente.",
    html: emailBase(`
      <h2>¡Te inscribiste exitosamente!</h2>
      <p>Tu inscripción fue registrada. Ya tenés acceso a la clase.</p>
      <div class="info-box">
        <div class="label">Clase / Curso</div>
        <div class="value">${data.pub_titulo}</div>
      </div>
      <div class="info-box">
        <div class="label">Docente</div>
        <div class="value">${data.docente_nombre}</div>
      </div>
      ${data.modalidad ? `<div class="info-box"><div class="label">Modalidad</div><div class="value">${data.modalidad}</div></div>` : ""}
      ${data.precio ? `<div class="info-box"><div class="label">Precio acordado</div><div class="value">${data.moneda || "ARS"} ${Number(data.precio).toLocaleString("es-AR")}</div></div>` : ""}
      <p style="text-align:center;margin:24px 0;">
        <a href="${data.pub_id ? `${appUrl}?pub=${data.pub_id}` : appUrl}" class="btn">Ver mi clase →</a>
      </p>
      <p style="font-size:12px;color:#A0AEC0;text-align:center;">Guardá este email como comprobante de tu inscripción.</p>
    `, "Tu inscripción fue registrada exitosamente."),
  }),

  contraoferta: (data, appUrl) => ({
    subject: `Nueva contraoferta en "${data.pub_titulo}"`,
    preheader: `${data.de_nombre} te hizo una contraoferta.`,
    html: emailBase(`
      <h2>Recibiste una contraoferta</h2>
      <p><strong>${data.de_nombre}</strong> ${data.mi_rol === "alumno" ? "(el alumno)" : "(el docente)"} te hizo una contraoferta.</p>
      <div class="info-box">
        <div class="label">Publicación</div>
        <div class="value">${data.pub_titulo}</div>
      </div>
      <div class="info-box">
        <div class="label">Nuevo precio propuesto</div>
        <div class="value" style="font-size:20px;color:${BRAND.blue};font-weight:800;">$${Number(data.precio_nuevo).toLocaleString("es-AR")} / ${data.tipo_precio || "hora"}</div>
      </div>
      ${data.mensaje ? `<div class="info-box"><div class="label">Mensaje</div><div class="value" style="font-style:italic">"${data.mensaje}"</div></div>` : ""}
      <p>Entrá para aceptar, rechazar o hacer tu propia contraoferta.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${appUrl}?page=cuenta&tab=ofertas" class="btn">Ver contraoferta →</a>
      </p>
    `, `${data.de_nombre} te hizo una contraoferta.`),
  }),

  nueva_evaluacion: (data, appUrl) => ({
    subject: `Nueva evaluación en "${data.curso_titulo}"`,
    preheader: "Hay una nueva evaluación disponible en tu curso.",
    html: emailBase(`
      <h2>Nueva evaluación disponible</h2>
      <p>Tu docente publicó una nueva evaluación en el curso.</p>
      <div class="info-box">
        <div class="label">Evaluación</div>
        <div class="value">${data.pub_titulo}</div>
      </div>
      <div class="info-box">
        <div class="label">Tipo</div>
        <div class="value">${data.tipo_eval === "diagnostico" ? "🔍 Diagnóstico" : data.tipo_eval === "checkpoint" ? "📍 Checkpoint" : "🏁 Evaluación final"}</div>
      </div>
      <p style="text-align:center;margin:24px 0;">
        <a href="${data.pub_id ? `${appUrl}?pub=${data.pub_id}` : appUrl}" class="btn">Ir a la evaluación →</a>
      </p>
    `, "Hay una nueva evaluación disponible."),
  }),

  alerta_coincidencia: (data, appUrl) => ({
    subject: `🔔 Nueva clase que puede interesarte — ${data.pub_titulo}`,
    preheader: "Encontramos una publicación que coincide con tu alerta.",
    html: emailBase(`
      <h2>¡Encontramos algo para vos!</h2>
      <p>Apareció una publicación que coincide con tu alerta.</p>
      <div class="info-box">
        <div class="label">Tu alerta</div>
        <div class="value" style="font-style:italic">"${data.alerta_descripcion}"</div>
      </div>
      <div class="divider"/>
      <div class="info-box">
        <div class="label">Nueva publicación</div>
        <div class="value" style="font-size:17px;font-weight:700;">${data.pub_titulo}</div>
      </div>
      ${data.pub_materia ? `<div class="info-box"><div class="label">Materia</div><div class="value">${data.pub_materia}</div></div>` : ""}
      <div class="info-box">
        <div class="label">Tipo</div>
        <div class="value">${data.pub_tipo}</div>
      </div>
      ${data.pub_precio ? `<div class="info-box"><div class="label">Precio</div><div class="value" style="color:${BRAND.blue};font-weight:700;">${data.pub_precio}</div></div>` : ""}
      ${data.pub_modalidad ? `<div class="info-box"><div class="label">Modalidad</div><div class="value">${data.pub_modalidad}</div></div>` : ""}
      ${data.razon ? `<div class="info-box" style="background:#EBF8F4;border-color:#2EC4A040;"><div class="label" style="color:#2EC4A0;">¿Por qué coincide?</div><div class="value">${data.razon}</div></div>` : ""}
      <p style="text-align:center;margin:24px 0;">
        <a href="${data.pub_url || appUrl}" class="btn">Ver publicación →</a>
      </p>
      <p style="font-size:12px;color:#A0AEC0;text-align:center;">Podés pausar o eliminar esta alerta desde Mi Cuenta → Alertas.</p>
    `, "Encontramos una publicación que coincide con tu alerta."),
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
};

// ── Templates adicionales ──────────────────────────────────────────────────────
Object.assign(TEMPLATES, {

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

  alerta_publicacion: (data: any, appUrl: string) => ({
    subject: `Nueva publicación que te puede interesar — ${data.pub_titulo}`,
    preheader: `Se publicó algo similar a lo que buscabas: ${data.criterio_desc}`,
    html: emailBase(`
      <h2>¡Apareció algo que te puede interesar!</h2>
      <p>Una nueva publicación coincide con tu alerta: <em>${data.criterio_desc}</em></p>
      <div class="info-box">
        <div class="label">Publicación</div>
        <div class="value">${data.pub_titulo}</div>
      </div>
      ${data.materia ? `<div class="info-box"><div class="label">Materia</div><div class="value">${data.materia}</div></div>` : ""}
      ${data.modalidad ? `<div class="info-box"><div class="label">Modalidad</div><div class="value">${data.modalidad}</div></div>` : ""}
      ${data.precio ? `<div class="info-box"><div class="label">Precio</div><div class="value">${data.precio}</div></div>` : ""}
      ${data.descripcion ? `<div class="info-box"><div class="label">Descripción</div><div class="value" style="font-size:13px">${data.descripcion}…</div></div>` : ""}
      <p style="text-align:center;margin:24px 0;">
        <a href="${appUrl}" class="btn">Ver publicación →</a>
      </p>
      <p style="font-size:12px;color:#718096;text-align:center;">Podés gestionar tus alertas desde Mi Cuenta → Alertas.</p>
    `, `Nueva publicación: ${data.pub_titulo}`),
  }),

});

// ── Handler principal ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "hola@luderis.com";
    const APP_URL    = Deno.env.get("APP_URL")    ?? "https://classelink.vercel.app";

    if (!RESEND_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY no configurado", code: "NO_KEY" }),
        { status: 503, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

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

    const { subject, html } = tplFn(data, APP_URL);
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
    if (!res.ok) throw new Error(result.message ?? `Resend error ${res.status}`);

    return new Response(
      JSON.stringify({ ok: true, id: result.id }),
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
