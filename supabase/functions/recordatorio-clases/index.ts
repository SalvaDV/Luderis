/**
 * recordatorio-clases — push ~1h antes de cada clase sincrónica.
 *
 * Invocada por pg_cron cada 15 min con header x-cron-key (el valor vive en
 * config.cron_secret_recordatorios, tabla NO legible por anon/authenticated).
 * Ventana: clases que empiezan en (50, 75] minutos desde ahora (hora AR) —
 * más ancha que el intervalo del cron, así siempre cae exactamente un tick.
 * Dedup: tabla recordatorios_clase con UNIQUE(pub, clase, fecha) — solo el tick
 * que logra insertar envía; reintentos/dobles ticks salen idempotentes.
 * ?dry=1 → calcula y devuelve lo que enviaría, sin registrar dedup ni enviar.
 *
 * Deploy: supabase functions deploy recordatorio-clases --no-verify-jwt
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TZ = "America/Argentina/Buenos_Aires";
// Mismos nombres (con acentos) que usa clases_sinc / AgendaPage
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function ahoraAR() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    fecha: `${get("year")}-${get("month")}-${get("day")}`,           // YYYY-MM-DD (AR)
    minutos: parseInt(get("hour")) * 60 + parseInt(get("minute")),   // minutos del día (AR)
    diaNombre: DIAS[idx] ?? "",
  };
}

function parseHora(h: unknown): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(h ?? "").trim());
  if (!m) return null;
  const min = parseInt(m[1]) * 60 + parseInt(m[2]);
  return min >= 0 && min < 24 * 60 ? min : null;
}

Deno.serve(async (req) => {
  try {
    const SB_URL = Deno.env.get("SUPABASE_URL")!;
    const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

    // ── Auth: x-cron-key contra config ──────────────────────────────────────
    const { data: cfg } = await supa.from("config").select("valor")
      .eq("clave", "cron_secret_recordatorios").single();
    const key = req.headers.get("x-cron-key") ?? "";
    if (!cfg?.valor || key !== cfg.valor) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const dry = new URL(req.url).searchParams.get("dry") === "1";
    const { fecha, minutos, diaNombre } = ahoraAR();

    // ── Publicaciones sincrónicas activas con horario semanal ───────────────
    const { data: pubs, error: pubsErr } = await supa.from("publicaciones_con_autor")
      .select("id,titulo,autor_email,clases_sinc,fecha_inicio,fecha_fin,modo")
      .eq("sinc", "sinc")
      .not("clases_sinc", "is", null)
      .or("activo.is.null,activo.eq.true")
      .or("finalizado.is.null,finalizado.eq.false");
    if (pubsErr) throw pubsErr;

    // ── Clases de HOY que empiezan en (50, 75] minutos ──────────────────────
    const candidatos: Array<{ pub: any; key: string; hora: string; delta: number }> = [];
    for (const p of pubs ?? []) {
      let clases: any[] = [];
      try { clases = JSON.parse(p.clases_sinc); } catch { continue; }
      if (!Array.isArray(clases)) continue;
      for (const c of clases) {
        if ((c?.dia ?? "") !== diaNombre) continue;
        const ini = parseHora(c?.hora_inicio);
        if (ini === null) continue;
        const delta = ini - minutos;
        if (delta <= 50 || delta > 75) continue;
        // Vigencia (fechas date-only comparadas como string YYYY-MM-DD)
        const desde = String(p.fecha_inicio ?? "").slice(0, 10);
        const hasta = String(p.fecha_fin ?? "").slice(0, 10);
        if (desde && fecha < desde) continue;
        // Particulares recurrentes no tienen fin; cursos respetan fecha_fin
        if (p.modo !== "particular" && hasta && fecha > hasta) continue;
        candidatos.push({ pub: p, key: `${c.dia}_${c.hora_inicio}`, hora: String(c.hora_inicio), delta });
      }
    }

    // ── Dedup + envío ────────────────────────────────────────────────────────
    let enviados = 0;
    const detalle: Array<{ pub: string; hora: string; destinatarios: number }> = [];
    for (const cand of candidatos) {
      if (!dry) {
        const { data: ins, error: dedupErr } = await supa.from("recordatorios_clase")
          .upsert(
            { publicacion_id: cand.pub.id, clase_key: cand.key, fecha },
            { onConflict: "publicacion_id,clase_key,fecha", ignoreDuplicates: true },
          )
          .select("id");
        if (dedupErr) { console.error("dedup error:", dedupErr.message); continue; }
        if (!ins?.length) continue; // otro tick ya lo envió hoy
      }

      const { data: insc } = await supa.from("inscripciones")
        .select("alumno_email,estado").eq("publicacion_id", cand.pub.id);
      const emails = new Set<string>();
      for (const i of insc ?? []) {
        if (i.alumno_email && i.estado !== "cancelada") emails.add(i.alumno_email);
      }
      if (cand.pub.autor_email) emails.add(cand.pub.autor_email);
      detalle.push({ pub: cand.pub.titulo, hora: cand.hora, destinatarios: emails.size });
      if (dry) continue;

      await Promise.allSettled([...emails].map((to) =>
        fetch(`${SB_URL}/functions/v1/send-push`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SB_KEY}` },
          body: JSON.stringify({
            to,
            title: "Tu clase empieza pronto",
            body: `${cand.pub.titulo} — hoy a las ${cand.hora} hs`,
            url: `/?pub=${cand.pub.id}`,
            tag: `recordatorio-${cand.pub.id}`,
          }),
        })
      ));
      enviados += emails.size;
    }

    return new Response(
      JSON.stringify({ ok: true, dry, fecha, dia: diaNombre, min: minutos, candidatos: candidatos.length, enviados, detalle }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("recordatorio-clases error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
