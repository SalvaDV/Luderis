/**
 * Supabase Edge Function: mp-webhook
 * Recibe notificaciones IPN de Mercado Pago cuando un pago cambia de estado.
 *
 * FLUJO DE FONDOS:
 * - Cursos: acreditación inmediata al docente (producto entregado completo)
 * - Paquetes de clases (paquete_clase): fondos retenidos como "pendiente"
 *   Se liberan al docente clase por clase cuando ambas partes confirman (RPC liberar_pago_clase)
 * - Recarga de billetera: va directo al saldo del usuario
 *
 * COMISIÓN: Luderis retiene COMISION_PCT % del monto bruto.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMISION_PCT = () => parseFloat(Deno.env.get("LUDERIS_COMISION_PCT") ?? "10") / 100;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const url   = new URL(req.url);
    const topic = url.searchParams.get("topic") ?? url.searchParams.get("type");
    const id    = url.searchParams.get("id")    ?? url.searchParams.get("data.id");

    if (topic !== "payment" && topic !== "merchant_order") {
      return new Response("ok", { status: 200, headers: CORS });
    }

    const MP_ACCESS_TOKEN  = Deno.env.get("MP_ACCESS_TOKEN");
    const MP_WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET"); // secret en dashboard de MP
    const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Variables de entorno faltantes");
    }

    // ── Validar firma de Mercado Pago (x-signature) ────────────────────────
    if (MP_WEBHOOK_SECRET) {
      const xSignature = req.headers.get("x-signature");
      const xRequestId = req.headers.get("x-request-id");
      if (!xSignature || !xRequestId) {
        return new Response("Unauthorized", { status: 401, headers: CORS });
      }
      // MP envía: ts=TIMESTAMP,v1=HASH
      const parts = Object.fromEntries(xSignature.split(",").map(p => p.split("=")));
      const ts = parts["ts"]; const hash = parts["v1"];
      const manifest = `id:${id ?? ""};request-id:${xRequestId};ts:${ts};`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw", encoder.encode(MP_WEBHOOK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
      const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,"0")).join("");
      if (hash !== expected) {
        console.warn("mp-webhook: firma inválida, rechazando request");
        return new Response("Invalid signature", { status: 401, headers: CORS });
      }
    }

    // ── Obtener detalle del pago desde MP ────────────────────────────────
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
    });
    if (!mpRes.ok) throw new Error(`MP payment fetch error: ${mpRes.status}`);
    const pago = await mpRes.json();

    let meta: Record<string, string> = {};
    try { meta = JSON.parse(pago.external_reference ?? "{}"); } catch {}

    const estado  = pago.status as string;
    const monto   = parseFloat(pago.transaction_amount) || 0;
    const mpPayId = String(pago.id);
    const tipo    = meta.tipo ?? "clase";

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // ── Guardar/actualizar en tabla pagos ────────────────────────────────
    await supabase.from("pagos").upsert({
      mp_payment_id:    mpPayId,
      mp_preference_id: pago.preference_id,
      publicacion_id:   meta.publicacion_id ?? null,
      alumno_email:     meta.alumno_email   ?? pago.payer?.email,
      docente_email:    meta.docente_email  ?? null,
      monto, estado,
      modo:             meta.modo ?? null,
      tipo:             tipo,
      raw_data:         pago,
      updated_at:       new Date().toISOString(),
    }, { onConflict: "mp_payment_id" });

    // ── Si el pago fue aprobado ───────────────────────────────────────────
    if (estado === "approved" && meta.publicacion_id && meta.alumno_email) {

      // ── 1. Obtener user_id del alumno ──────────────────────────────────
      const { data: alumno } = await supabase
        .from("usuarios").select("id")
        .eq("email", meta.alumno_email).single();

      // ── 2. Inscribir al alumno (idempotente) ───────────────────────────
      if (alumno?.id) {
        const inscData: Record<string, unknown> = {
          publicacion_id: meta.publicacion_id,
          alumno_id:      alumno.id,
          alumno_email:   meta.alumno_email,
          pagado_mp:      true,
          mp_payment_id:  mpPayId,
        };
        // Para paquetes: guardar cantidad de clases
        if (meta.clases_cantidad) {
          inscData.clases_totales   = parseInt(meta.clases_cantidad);
          inscData.clases_restantes = parseInt(meta.clases_cantidad);
          inscData.precio_por_clase = monto / parseInt(meta.clases_cantidad);
        }
        const { error: inscErr } = await supabase.from("inscripciones").insert(inscData);
        if (inscErr && !inscErr.message?.includes("uq_inscripcion") && !inscErr.code?.includes("23505")) {
          console.error("Error inscripción:", inscErr);
        }
      }

      // ── 3. Acreditar al docente ────────────────────────────────────────
      const ES_RECARGA = tipo === "recarga_billetera" ||
        meta.publicacion_id === "00000000-0000-0000-0000-000000000001";

      // Paquetes de clases: fondos RETENIDOS hasta confirmación de cada clase
      const ES_PAQUETE = tipo === "paquete_clase";

      if (!ES_RECARGA && meta.docente_email && monto > 0) {
        const comision  = parseFloat((monto * COMISION_PCT()).toFixed(2));
        const montoNeto = parseFloat((monto - comision).toFixed(2));

        const { data: docente } = await supabase
          .from("usuarios").select("id")
          .eq("email", meta.docente_email).single();

        if (docente?.id) {
          if (ES_PAQUETE) {
            // ── RETENCIÓN: registrar como pendiente, NO sumar al saldo ──
            await supabase.from("billetera_movimientos").insert({
              usuario_id:       docente.id,
              tipo:             "cobro_clase",
              monto:            montoNeto,
              estado:           "pendiente",          // ← retenido por Luderis
              descripcion:      `Paquete ${meta.clases_cantidad ?? "N"} clases — alumno: ${meta.alumno_email}`,
              publicacion_id:   meta.publicacion_id,
              mp_payment_id:    mpPayId,
              comision_luderis: comision,
            });
            // NOTA: el saldo NO se incrementa aquí.
            // Se libera clase por clase via RPC liberar_pago_clase()

          } else {
            // ── ACREDITACIÓN INMEDIATA (cursos, clases sueltas) ──────────
            await supabase.rpc("incrementar_saldo", {
              p_usuario_id: docente.id,
              p_monto:      montoNeto,
            }).catch(async () => {
              const { data: bilActual } = await supabase
                .from("billetera").select("saldo")
                .eq("usuario_id", docente.id).single();
              await supabase.from("billetera").upsert(
                { usuario_id: docente.id, saldo: (parseFloat(bilActual?.saldo ?? "0") + montoNeto) },
                { onConflict: "usuario_id" }
              );
            });

            await supabase.from("billetera_movimientos").insert({
              usuario_id:       docente.id,
              tipo:             "cobro_clase",
              monto:            montoNeto,
              estado:           "liberado",
              descripcion:      `Pago por clase — alumno: ${meta.alumno_email}`,
              publicacion_id:   meta.publicacion_id,
              mp_payment_id:    mpPayId,
              comision_luderis: comision,
            });
          }
        }
      }

      // ── 4. Notificar al docente ────────────────────────────────────────
      if (meta.docente_email) {
        const descNotif = ES_PAQUETE
          ? `Nuevo paquete de ${meta.clases_cantidad ?? "N"} clases comprado`
          : "Pago aprobado por Mercado Pago";
        await supabase.from("notificaciones").insert({
          alumno_email:   meta.docente_email,
          tipo:           "pago_aprobado_mp",
          publicacion_id: meta.publicacion_id,
          pub_titulo:     descNotif,
          leida:          false,
        });
      }
    }

    return new Response(JSON.stringify({ received: true, estado }), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("mp-webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
