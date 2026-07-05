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

// Comisión Luderis: fuente única en la tabla config (clave comision_pct, en %).
// Fallback a env var o 10%. Misma lógica en mp-webhook y mp-checkout.
async function getComisionPct(supabase: ReturnType<typeof createClient>): Promise<number> {
  try {
    const { data } = await supabase.from("config").select("valor").eq("clave", "comision_pct").single();
    if (data?.valor) return parseFloat(data.valor) / 100;
  } catch {}
  return parseFloat(Deno.env.get("LUDERIS_COMISION_PCT") ?? "10") / 100;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!; // token de Luderis
  const INTERNAL_SECRET = Deno.env.get("LIBERAR_PAGO_SECRET") ?? "";

  // LIBERAR_PAGO_SECRET es obligatorio — si no está configurado, rechazar todo
  if (!INTERNAL_SECRET) {
    console.error("liberar-pago: LIBERAR_PAGO_SECRET no configurado — rechazando request por seguridad");
    return new Response(JSON.stringify({ error: "Servicio no disponible: secret no configurado" }), { status: 503, headers: CORS });
  }

  // Validar que el caller es interno (pg_net o admin)
  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader !== `Bearer ${INTERNAL_SECRET}`) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: CORS });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  let pago_id: string | null = null;
  try {
    const body = await req.json();
    pago_id = body?.pago_id ?? null;
    if (!pago_id) return new Response(JSON.stringify({ error: "Falta pago_id" }), { status: 400, headers: CORS });

    // 1. Reclamar el pago de forma ATÓMICA: compare-and-swap "retenido" -> "procesando".
    //    Evita un race condition: si el cron y el admin (o dos disparos del cron) corren a la vez,
    //    solo UNO matchea la fila en estado "retenido" y avanza; el otro recibe 0 filas y aborta.
    //    Sin esto, ambos pasarían el check y producirían doble inserción en billetera_movimientos
    //    y doble notificación. Incluimos mp_payment_id y raw_data en el RETURNING porque pasos
    //    posteriores los usan (antes no se seleccionaban → quedaban undefined: bug latente).
    const { data: pago, error: claimErr } = await supabase
      .from("pagos")
      .update({ estado_escrow: "procesando" })
      .eq("id", pago_id)
      .eq("estado_escrow", "retenido")
      .select("id, monto, docente_email, alumno_email, publicacion_id, mp_payment_id, raw_data")
      .maybeSingle();

    if (claimErr) throw claimErr;

    if (!pago) {
      // No matcheó: o no existe, o ya no está "retenido" (otro proceso lo tomó/liberó).
      const { data: existe } = await supabase
        .from("pagos").select("estado_escrow").eq("id", pago_id).maybeSingle();
      if (!existe) {
        return new Response(JSON.stringify({ error: "Pago no encontrado" }), { status: 404, headers: CORS });
      }
      return new Response(
        JSON.stringify({ error: `Estado inválido: ${existe.estado_escrow}. Debe ser "retenido" (¿ya procesado?).` }),
        { status: 409, headers: CORS }
      );
    }

    // 2. Buscar conexión MP y usuario_id del docente
    const [{ data: mpConn }, { data: docenteUser }] = await Promise.all([
      supabase
        .from("mp_conexiones")
        .select("mp_user_id, mp_email, mp_access_token")
        .eq("usuario_email", pago.docente_email)
        .single(),
      supabase
        .from("usuarios")
        .select("id")
        .eq("email", pago.docente_email)
        .single(),
    ]);

    const montoTotal  = Number(pago.monto);
    const comisionPct = await getComisionPct(supabase);
    const comision    = Math.round(montoTotal * comisionPct);
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

    // 5. Registrar movimiento en billetera del docente
    if (docenteUser?.id) {
      // (supabase-js no rechaza en errores de PG y su builder no tiene .catch:
      // el patrón .catch anterior tiraba TypeError en runtime)
      const { error: movErr } = await supabase.from("billetera_movimientos").insert({
        usuario_id:       docenteUser.id,
        tipo:             "ingreso",
        monto:            montoNeto,
        descripcion:      `Clase liberada — alumno: ${pago.alumno_email}`,
        publicacion_id:   pago.publicacion_id,
        mp_payment_id:    mpTransferId ?? pago.mp_payment_id,
        comision_luderis: comision,
        estado:           "liberado",
      });
      if (movErr) console.error("billetera insert error:", movErr.message);
    }

    // 6. Notificar al docente (alumno_email = campo "destinatario" de la notif, aquí el docente)
    await supabase.from("notificaciones").insert({
      usuario_id:     docenteUser?.id ?? null,
      alumno_email:   pago.docente_email,
      tipo:           "pago_liberado",
      pub_titulo:     `Tu pago de $${montoNeto.toLocaleString("es")} fue acreditado en tu billetera.`,
      publicacion_id: pago.publicacion_id,
      leida:          false,
    }).then(null, () => {});

    return new Response(
      JSON.stringify({ ok: true, metodo, monto_neto: montoNeto, comision, mp_transfer_id: mpTransferId }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("liberar-pago error:", err);
    // Rollback best-effort: si alcanzamos a reclamar el pago ("procesando") pero algo falló
    // antes de marcarlo "liberado", lo devolvemos a "retenido" para que el cron lo reintente.
    // El reintento NO duplica dinero: la transferencia MP usa X-Idempotency-Key = pago_id.
    // El WHERE estado_escrow='procesando' garantiza que solo afecta una fila que nosotros
    // dejamos a medias (si nunca reclamamos, matchea 0 filas y es inocuo).
    if (pago_id) {
      try {
        await supabase.from("pagos")
          .update({ estado_escrow: "retenido" })
          .eq("id", pago_id)
          .eq("estado_escrow", "procesando");
      } catch (_) { /* best-effort, ya estamos en el handler de error */ }
    }
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
