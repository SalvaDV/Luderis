/**
 * Supabase Edge Function: mp-webhook
 * Recibe notificaciones IPN de Mercado Pago cuando un pago cambia de estado.
 * Actualiza la tabla `pagos` en Supabase e inscribe al alumno si el pago fue aprobado.
 *
 * Deploy:
 *   supabase functions deploy mp-webhook
 *
 * Tabla SQL a crear en Supabase:
 *   CREATE TABLE pagos (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     mp_payment_id TEXT UNIQUE,
 *     mp_preference_id TEXT,
 *     publicacion_id UUID REFERENCES publicaciones(id),
 *     alumno_email TEXT,
 *     docente_email TEXT,
 *     monto NUMERIC,
 *     estado TEXT, -- "approved" | "pending" | "rejected" | "refunded"
 *     modo TEXT,   -- "particular" | "curso"
 *     raw_data JSONB,
 *     created_at TIMESTAMPTZ DEFAULT NOW(),
 *     updated_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") ?? url.searchParams.get("type");
    const id = url.searchParams.get("id") ?? url.searchParams.get("data.id");

    // MP solo nos interesa cuando notifica sobre pagos
    if (topic !== "payment" && topic !== "merchant_order") {
      return new Response("ok", { status: 200, headers: CORS });
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // service role para escribir sin RLS

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
    let meta = {};
    try { meta = JSON.parse(pago.external_reference ?? "{}"); } catch {}

    const estado = pago.status; // "approved" | "pending" | "rejected" | "refunded"

    // ── Guardar/actualizar en tabla pagos ────────────────────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { error: upsertErr } = await supabase
      .from("pagos")
      .upsert({
        mp_payment_id:    String(pago.id),
        mp_preference_id: pago.preference_id,
        publicacion_id:   meta.publicacion_id ?? null,
        alumno_email:     meta.alumno_email ?? pago.payer?.email,
        docente_email:    meta.docente_email ?? null,
        monto:            pago.transaction_amount,
        estado,
        modo:             meta.modo ?? null,
        raw_data:         pago,
        updated_at:       new Date().toISOString(),
      }, { onConflict: "mp_payment_id" });

    if (upsertErr) console.error("Supabase upsert error:", upsertErr);

    // ── Si el pago fue aprobado → inscribir al alumno ────────────────────
    if (estado === "approved" && meta.publicacion_id && meta.alumno_email) {
      // Obtener el user_id del alumno por email
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", meta.alumno_email)
        .single();

      if (usuario?.id) {
        // Insertar inscripción (ignora si ya existe)
        const { error: inscErr } = await supabase
          .from("inscripciones")
          .insert({
            publicacion_id: meta.publicacion_id,
            alumno_id:      usuario.id,
            alumno_email:   meta.alumno_email,
            pagado_mp:      true,       // flag para saber que pagó por MP
            mp_payment_id:  String(pago.id),
          })
          .select()
          .single();

        if (inscErr && !inscErr.message?.includes("uq_inscripcion")) {
          console.error("Error inscripción:", inscErr);
        }

        // Notificar al docente
        if (meta.docente_email) {
          await supabase.from("notificaciones").insert({
            alumno_email: meta.docente_email,
            tipo:         "pago_aprobado_mp",
            publicacion_id: meta.publicacion_id,
            pub_titulo:   pago.description,
            leida:        false,
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true, estado }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("mp-webhook error:", err);
    // Devolver 200 igualmente — MP reintenta si recibe != 200
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});