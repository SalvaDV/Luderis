/**
 * Edge Function: liberar-pago
 * Transfiere el 90% de un pago retenido al docente vía MP.
 * Invocada por el pg_cron job (via pg_net) o manualmente por el admin.
 *
 * Body: { pago_id: string }
 *
 * Flujo:
 *   1. Obtiene el pago de la BD (valida que esté en estado "retenido")
 *   2. Busca la conexión MP del docente
 *   3. Realiza la transferencia usando el token de Luderis
 *   4. Actualiza estado_escrow a "liberado"
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const COMISION_LUDERIS = 0.10; // 10%

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!; // token de Luderis
  const INTERNAL_SECRET = Deno.env.get("LIBERAR_PAGO_SECRET") ?? "";

  // Validar que el caller es interno (pg_net o admin)
  const authHeader = req.headers.get("Authorization") ?? "";
  if (INTERNAL_SECRET && authHeader !== `Bearer ${INTERNAL_SECRET}`) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: CORS });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { pago_id } = await req.json();
    if (!pago_id) return new Response(JSON.stringify({ error: "Falta pago_id" }), { status: 400, headers: CORS });

    // 1. Obtener el pago
    const { data: pago, error: pagoErr } = await supabase
      .from("pagos")
      .select("id, monto, docente_email, alumno_email, estado_escrow, publicacion_id")
      .eq("id", pago_id)
      .single();

    if (pagoErr || !pago) {
      return new Response(JSON.stringify({ error: "Pago no encontrado" }), { status: 404, headers: CORS });
    }

    if (pago.estado_escrow !== "retenido") {
      return new Response(
        JSON.stringify({ error: `Estado inválido: ${pago.estado_escrow}. Debe ser "retenido".` }),
        { status: 400, headers: CORS }
      );
    }

    // 2. Buscar conexión MP del docente
    const { data: mpConn } = await supabase
      .from("mp_conexiones")
      .select("mp_user_id, mp_email, mp_access_token")
      .eq("usuario_email", pago.docente_email)
      .single();

    const montoTotal  = Number(pago.monto);
    const comision    = Math.round(montoTotal * COMISION_LUDERIS);
    const montoNeto   = montoTotal - comision;

    let mpTransferId: string | null = null;
    let metodo = "pendiente_mp";

    if (mpConn?.mp_user_id) {
      // 3a. Docente tiene MP conectado → transferir via API de MP
      // MP permite enviar dinero entre cuentas usando el endpoint de pagos
      // con payment_method_id: "account_money" al collector del docente
      const transferBody = {
        transaction_amount: montoNeto,
        currency_id:        "ARS",
        payment_method_id:  "account_money",
        payer: {
          // El pagador es Luderis (se debita de la cuenta con MP_ACCESS_TOKEN)
          type: "customer",
        },
        metadata: {
          pago_luderis_id:   pago_id,
          docente_email:     pago.docente_email,
          alumno_email:      pago.alumno_email,
          publicacion_id:    pago.publicacion_id,
          comision_luderis:  comision,
        },
        description: `Pago Luderis — clase a ${pago.alumno_email}`,
        // Destinatario: la cuenta del docente
        collector: { id: mpConn.mp_user_id },
      };

      const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
          "X-Idempotency-Key": pago_id, // evita duplicados
        },
        body: JSON.stringify(transferBody),
      });

      const mpData = await mpRes.json();

      if (mpRes.ok && (mpData.status === "approved" || mpData.status === "in_process")) {
        mpTransferId = String(mpData.id);
        metodo = "mp_transfer";
      } else {
        // Si falla la transferencia automática, loguear y continuar como "liberado_manual"
        console.error("MP transfer failed:", JSON.stringify(mpData));
        metodo = "liberado_manual_mp_error";
      }
    } else {
      // 3b. Docente no tiene MP conectado → marcar como liberado pendiente
      // El admin deberá contactar al docente para que conecte su cuenta
      metodo = "pendiente_mp_desconectado";
      console.warn(`Docente ${pago.docente_email} no tiene MP conectado. Pago ${pago_id} liberado sin transferencia.`);
    }

    // 4. Actualizar estado en BD
    const { error: updateErr } = await supabase
      .from("pagos")
      .update({
        estado_escrow: "liberado",
        liberado_at:   new Date().toISOString(),
        raw_data:      {
          ...((pago as any).raw_data ?? {}),
          liberacion: { metodo, mp_transfer_id: mpTransferId, monto_neto: montoNeto, comision },
        },
      })
      .eq("id", pago_id);

    if (updateErr) throw updateErr;

    // 5. Notificar al docente
    await supabase.from("notificaciones").insert({
      alumno_email:   pago.docente_email,
      tipo:           "pago_liberado",
      publicacion_id: pago.publicacion_id,
      leida:          false,
    }).catch(() => {});

    return new Response(
      JSON.stringify({ ok: true, metodo, monto_neto: montoNeto, comision, mp_transfer_id: mpTransferId }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("liberar-pago error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
