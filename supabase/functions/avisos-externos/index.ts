/**
 * avisos-externos — saca de la app los avisos que tienen plata en juego.
 *
 * Las notificaciones viven en la campanita. Para las que arrancan un plazo
 * (aprobar horas, disputas, retiros, vencimientos) eso no alcanza: si el
 * usuario no abre la app, el plazo corre igual y se entera tarde. Esta función
 * corre cada 5 minutos por pg_cron y manda push + email de las críticas que
 * todavía no salieron.
 *
 * El email lo arma send-email, con la plantilla propia de cada evento. Antes
 * esta función tenía su propio HTML genérico: dos diseños distintos para el
 * mismo producto, y un texto que no decía qué había que hacer ni para cuándo.
 * Si a alguien le quedaron varias novedades en el mismo tick, va un solo mail
 * de resumen en vez de cinco seguidos.
 *
 * Auth: header x-cron-key contra config.cron_secret_avisos. Marca
 * aviso_externo_at SIEMPRE (haya salido o no el envío): mejor perder un aviso
 * que reintentar infinito y spamear. Solo mira no leídas de las últimas 48 hs.
 *
 * ?dry=1 → devuelve lo que mandaría, sin enviar ni marcar.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// tipo de notificación → plantilla de send-email + qué mostrar en el push.
// `pt` es pub_titulo: en confirmar_clase trae el nombre de la clase; en el
// resto ya es la frase completa que escribió el emisor.
const CRITICOS: Record<string, {
  template: string;
  titulo: string;
  cuerpo: (pt: string | null) => string;
  data?: (pt: string | null) => Record<string, unknown>;
}> = {
  confirmar_clase: {
    template: "horas_por_confirmar",
    titulo: "Tenés horas de clase por confirmar",
    cuerpo: (pt) => pt
      ? `El docente registró horas de "${pt}". Aprobalas u objetalas — si no respondés, se aprueban solas.`
      : "El docente registró horas de una clase. Entrá para aprobarlas u objetarlas.",
    data: (pt) => ({ pub_titulo: pt ?? "" }),
  },
  horas_ajustadas: {
    template: "horas_ajustadas",
    titulo: "Revisamos las horas de una clase",
    cuerpo: (pt) => pt ?? "Ajustamos las horas de una clase con el registro de presencia.",
    data: (pt) => ({ detalle: pt ?? "" }),
  },
  disputa_abierta: {
    template: "reclamo_horas",
    titulo: "Hay un reclamo de horas abierto",
    cuerpo: (pt) => pt ?? "Se abrió un reclamo sobre las horas de una clase.",
    data: (pt) => ({ detalle: pt ?? "" }),
  },
  disputa_resuelta: {
    template: "reclamo_resuelto",
    titulo: "Se resolvió el reclamo de horas",
    cuerpo: (pt) => pt ?? "El reclamo de horas de tu clase quedó resuelto.",
    data: (pt) => ({ detalle: pt ?? "" }),
  },
  retiro_solicitado: {
    template: "resumen_novedades",
    titulo: "Hay un retiro pendiente",
    cuerpo: (pt) => pt ?? "Hay una solicitud de retiro esperando que la proceses.",
    data: (pt) => ({ items: [{ titulo: "Retiro pendiente", cuerpo: pt ?? "Hay una solicitud esperando que la proceses." }] }),
  },
  retiro_procesado: {
    template: "retiro_procesado",
    titulo: "Procesamos tu retiro",
    cuerpo: (pt) => pt ?? "Tu retiro fue procesado.",
    data: () => ({}),
  },
  retiro_rechazado: {
    template: "retiro_rechazado",
    titulo: "Tu retiro fue rechazado",
    cuerpo: (pt) => pt ?? "Rechazamos tu solicitud y devolvimos el monto a tu saldo.",
    data: (pt) => ({ motivo: pt ?? "" }),
  },
  horas_por_vencer: {
    template: "horas_por_vencer",
    titulo: "Tenés horas por vencer",
    cuerpo: (pt) => pt ?? "Te quedan horas compradas sin usar que están por vencer.",
    data: (pt) => ({ detalle: pt ?? "" }),
  },
  // "Te pagaron" sonaba a transferencia de alguien. Lo que pasa es que la plata
  // que ya estaba retenida pasó a tu saldo.
  pago_liberado: {
    template: "pago_liberado",
    titulo: "Se liberó tu pago",
    cuerpo: (pt) => pt ?? "La plata que estaba retenida ya pasó a tu saldo de Luderis.",
    data: (pt) => ({ detalle: pt ?? "" }),
  },
};

Deno.serve(async (req) => {
  try {
    const SB_URL = Deno.env.get("SUPABASE_URL")!;
    const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    const porEmail = new Map<string, typeof pendientes>();
    for (const n of pendientes) {
      if (!n.alumno_email) continue;
      if (!porEmail.has(n.alumno_email)) porEmail.set(n.alumno_email, []);
      porEmail.get(n.alumno_email)!.push(n);
    }

    const enviar = (path: string, body: unknown) => fetch(`${SB_URL}/functions/v1/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SB_KEY}`, "apikey": SB_KEY },
      body: JSON.stringify(body),
    });

    let pushOk = 0, emailOk = 0;
    const resumen: unknown[] = [];

    for (const [email, notifs] of porEmail) {
      const items = notifs.map((n) => {
        const c = CRITICOS[n.tipo];
        return { tipo: n.tipo, cfg: c, titulo: c.titulo, cuerpo: c.cuerpo(n.pub_titulo ?? null), pt: n.pub_titulo ?? null };
      });
      resumen.push({ email, tipos: items.map((i) => i.tipo) });
      if (dry) continue;

      // Push: uno por noticia, que el sistema operativo los apila solo.
      for (const it of items) {
        try {
          const r = await enviar("send-push", {
            to: email, title: it.titulo, body: it.cuerpo, url: "/", tag: "aviso-critico",
          });
          if (r.ok) pushOk++;
        } catch (e) { console.warn("push fallo:", (e as Error).message); }
      }

      // Email: la plantilla propia si es una sola novedad, un resumen si son varias.
      try {
        const body = items.length === 1
          ? { to: email, template: items[0].cfg.template, data: items[0].cfg.data?.(items[0].pt) ?? {} }
          : { to: email, template: "resumen_novedades",
              data: { items: items.map((i) => ({ titulo: i.titulo, cuerpo: i.cuerpo })) } };
        const r = await enviar("send-email", body);
        if (r.ok) emailOk++;
        else console.warn("email fallo:", r.status, await r.text());
      } catch (e) { console.warn("email fallo:", (e as Error).message); }
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
