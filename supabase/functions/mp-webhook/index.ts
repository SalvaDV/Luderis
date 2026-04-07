/**
 * Supabase Edge Function: mp-webhook
 * Recibe notificaciones IPN de Mercado Pago cuando un pago cambia de estado.
 * - Registra el pago en tabla `pagos`
 * - Inscribe al alumno si el pago fue aprobado
 * - Acredita el monto neto al docente en `billetera_movimientos`
 *
 * COMISIÓN: Luderis retiene COMISION_PCT % del monto bruto.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Comisión de la plataforma (10%). Configurable via env var LUDERIS_COMISION_PCT.
const COMISION_PCT = () => parseFloat(Deno.env.get("LUDERIS_COMISION_PCT") ?? "10") / 100;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") ?? url.searchParams.get("type");
    const id    = url.searchParams.get("id")    ?? url.searchParams.get("data.id");

    // MP solo nos interesa cuando notifica sobre pagos
    if (topic !== "payment" && topic !== "merchant_order") {
      return new Response("ok", { status: 200, headers: CORS });
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Variables de entorno faltantes");
    }

    // ── Obtener detalle del pago desde MP ────────────────────────────────
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
    });
    if (!mpRes.ok) throw new Error(`MP payment fetch error: ${mpRes.status}`);
    const pago = await mpRes.json();

    // ── Parsear metadata interna ─────────────────────────────────────────
    let meta: Record<string, string> = {};
    try { meta = JSON.parse(pago.external_reference ?? "{}"); } catch {}

    const estado  = pago.status as string;
    const monto   = parseFloat(pago.transaction_amount) || 0;
    const mpPayId = String(pago.id);

    // ── Guardar/actualizar en tabla pagos ────────────────────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { error: upsertErr } = await supabase
      .from("pagos")
      .upsert({
        mp_payment_id:    mpPayId,
        mp_preference_id: pago.preference_id,
        publicacion_id:   meta.publicacion_id ?? null,
        alumno_email:     meta.alumno_email   ?? pago.payer?.email,
        docente_email:    meta.docente_email  ?? null,
        monto,
        estado,
        modo:             meta.modo ?? null,
        raw_data:         pago,
        updated_at:       new Date().toISOString(),
      }, { onConflict: "mp_payment_id" });

    if (upsertErr) console.error("Supabase upsert error:", upsertErr);

    // ── Si el pago fue aprobado ───────────────────────────────────────────
    if (estado === "approved" && meta.publicacion_id && meta.alumno_email) {

      // ── 1. Obtener user_id del alumno ──────────────────────────────────
      const { data: alumno } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", meta.alumno_email)
        .single();

      // ── 2. Inscribir al alumno (idempotente) ───────────────────────────
      if (alumno?.id) {
        const { error: inscErr } = await supabase
          .from("inscripciones")
          .insert({
            publicacion_id: meta.publicacion_id,
            alumno_id:      alumno.id,
            alumno_email:   meta.alumno_email,
            pagado_mp:      true,
            mp_payment_id:  mpPayId,
          });

        if (inscErr && !inscErr.message?.includes("uq_inscripcion") && !inscErr.code?.includes("23505")) {
          console.error("Error inscripción:", inscErr);
        }
      }

      // ── 3. Acreditar al docente ────────────────────────────────────────
      // Solo si es una compra de clase (no recarga de billetera)
      const ES_RECARGA = meta.tipo === "recarga_billetera" ||
        meta.publicacion_id === "00000000-0000-0000-0000-000000000001";

      if (!ES_RECARGA && meta.docente_email && monto > 0) {
        const comision  = parseFloat((monto * COMISION_PCT()).toFixed(2));
        const montoNeto = parseFloat((monto - comision).toFixed(2));

        // Obtener user_id del docente
        const { data: docente } = await supabase
          .from("usuarios")
          .select("id")
          .eq("email", meta.docente_email)
          .single();

        if (docente?.id) {
          // Crear/actualizar fila en billetera (upsert por usuario_id)
          await supabase.from("billetera").upsert(
            { usuario_id: docente.id, saldo: montoNeto },
            { onConflict: "usuario_id", ignoreDuplicates: false }
          );
          // Sumar al saldo existente via RPC si existe, sino insertar
          await supabase.rpc("incrementar_saldo", {
            p_usuario_id: docente.id,
            p_monto:      montoNeto,
          }).catch(async () => {
            // Fallback: upsert manual si la RPC no existe aún
            const { data: bilActual } = await supabase
              .from("billetera")
              .select("saldo")
              .eq("usuario_id", docente.id)
              .single();
            const saldoActual = parseFloat(bilActual?.saldo ?? "0");
            await supabase
              .from("billetera")
              .upsert({ usuario_id: docente.id, saldo: saldoActual + montoNeto },
                { onConflict: "usuario_id" });
          });

          // Registrar movimiento
          await supabase.from("billetera_movimientos").insert({
            usuario_id:     docente.id,
            tipo:           "cobro_clase",
            monto:          montoNeto,
            descripcion:    `Pago por clase — alumno: ${meta.alumno_email}`,
            publicacion_id: meta.publicacion_id,
            mp_payment_id:  mpPayId,
            comision_luderis: comision,
          });
        }
      }

      // ── 4. Notificar al docente ────────────────────────────────────────
      if (meta.docente_email) {
        await supabase.from("notificaciones").insert({
          alumno_email:   meta.docente_email,
          tipo:           "pago_aprobado_mp",
          publicacion_id: meta.publicacion_id,
          pub_titulo:     pago.description,
          leida:          false,
        });
      }
    }

    return new Response(JSON.stringify({ received: true, estado }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("mp-webhook error:", err);
    // Devolver 200 igual — MP reintenta si recibe != 200
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
