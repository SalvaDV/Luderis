// Webhook de Stripe — crea la inscripción y el hold de escrow DEL LADO DEL
// SERVIDOR, después de verificar la firma.
//
// Antes no existía: `CursoPage` insertaba la inscripción desde el navegador
// apenas Stripe confirmaba, así que alcanzaba con no llamar a Stripe y ejecutar
// ese insert para entrar gratis a cualquier curso pago. La inscripción ahora
// solo la crea esta función (el cliente perdió el INSERT por RLS).
//
// Deploy: requiere --no-verify-jwt (Stripe no manda JWT de Supabase; la
// autenticidad la da la firma HMAC del header stripe-signature).
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "stripe-signature, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...CORS, "Content-Type": "application/json" },
  });

async function getComisionPct(supabase: ReturnType<typeof createClient>): Promise<number> {
  try {
    const { data } = await supabase.from("config").select("valor").eq("clave", "comision_pct").single();
    if (data?.valor) return parseFloat(data.valor) / 100;
  } catch { /* cae al default de abajo */ }
  return parseFloat(Deno.env.get("LUDERIS_COMISION_PCT") ?? "10") / 100;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  // Fail-closed: sin secret no se puede verificar nada, así que no se procesa.
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error("stripe-webhook: faltan STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET");
    return json({ error: "webhook no configurado" }, 500);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

  // ── Verificar firma ────────────────────────────────────────────────────
  const sig = req.headers.get("stripe-signature");
  if (!sig) return json({ error: "falta stripe-signature" }, 401);

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    // En Deno hay que usar la variante async: la sincrónica usa crypto de Node.
    event = await stripe.webhooks.constructEventAsync(raw, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("stripe-webhook: firma inválida:", (err as Error).message);
    return json({ error: "firma inválida" }, 401);
  }

  if (event.type !== "payment_intent.succeeded") {
    return json({ received: true, ignored: event.type });
  }

  try {
    const pi = event.data.object as Stripe.PaymentIntent;
    const meta = pi.metadata ?? {};
    const publicacionId = meta.publicacion_id;
    const alumnoEmail   = meta.alumno_email;
    const docenteEmail  = meta.docente_email;
    // Stripe maneja el monto en la unidad mínima (centavos).
    const monto = (pi.amount_received ?? pi.amount ?? 0) / 100;

    if (!publicacionId || !alumnoEmail) {
      return json({ received: true, skipped: "metadata incompleta" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Registrar el pago ────────────────────────────────────────────────
    // `mp_payment_id` es la clave natural de la tabla; para Stripe se usa el id
    // del payment intent, que también es único.
    await supabase.from("pagos").upsert({
      mp_payment_id:  pi.id,
      publicacion_id: publicacionId,
      alumno_email:   alumnoEmail,
      docente_email:  docenteEmail ?? null,
      monto,
      estado:         "approved",
      tipo:           "stripe",
      raw_data:       pi,
      updated_at:     new Date().toISOString(),
    }, { onConflict: "mp_payment_id" });

    // ── Idempotencia ─────────────────────────────────────────────────────
    // Stripe reintenta el webhook hasta recibir un 2xx. El CAS sobre
    // acreditado_at hace que solo la primera entrega acredite (mismo patrón
    // que mp-webhook).
    const { data: claim } = await supabase
      .from("pagos")
      .update({ acreditado_at: new Date().toISOString() })
      .eq("mp_payment_id", pi.id)
      .is("acreditado_at", null)
      .select("id")
      .maybeSingle();
    if (!claim) return json({ received: true, idempotent: true });

    // ── Inscribir al alumno ──────────────────────────────────────────────
    const { data: alumno } = await supabase
      .from("usuarios").select("id").eq("email", alumnoEmail).single();

    if (alumno?.id) {
      const { error: inscErr } = await supabase.from("inscripciones").insert({
        publicacion_id: publicacionId,
        alumno_id:      alumno.id,
        alumno_email:   alumnoEmail,
        pagado_mp:      true,
        mp_payment_id:  pi.id,
      });
      if (inscErr && !inscErr.message?.includes("uq_inscripcion") && !inscErr.code?.includes("23505")) {
        console.error("stripe-webhook: error inscripción, code:", inscErr.code ?? "desconocido");
      }
    }

    // ── Retener el pago del docente (escrow) ─────────────────────────────
    if (docenteEmail && monto > 0) {
      const { data: docente } = await supabase
        .from("usuarios").select("id").eq("email", docenteEmail).single();

      if (docente?.id) {
        const comisionPct = await getComisionPct(supabase);
        const comision    = parseFloat((monto * comisionPct).toFixed(2));
        const montoNeto   = parseFloat((monto - comision).toFixed(2));

        await supabase.from("billetera_movimientos").insert({
          usuario_id:       docente.id,
          tipo:             "cobro_clase",
          monto:            montoNeto,
          estado:           "pendiente",
          descripcion:      `Pago retenido (Stripe) — alumno: ${alumnoEmail}`,
          publicacion_id:   publicacionId,
          mp_payment_id:    pi.id,
          comision_luderis: comision,
        });
      }

      await supabase.from("notificaciones").insert({
        alumno_email:   docenteEmail,
        tipo:           "pago_aprobado_mp",
        publicacion_id: publicacionId,
        pub_titulo:     "Pago aprobado con tarjeta",
        leida:          false,
      });
    }

    return json({ received: true });
  } catch (err) {
    console.error("stripe-webhook error:", (err as Error).message);
    // 500 para que Stripe reintente: el CAS evita que el reintento duplique.
    return json({ error: "error procesando el evento" }, 500);
  }
});
