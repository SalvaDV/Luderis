import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const MP_ENABLED = Deno.env.get("MP_ENABLED") ?? "false";
  if (MP_ENABLED !== "true") {
    return new Response(
      JSON.stringify({ error: "MP_DISABLED", code: "MP_DISABLED" }),
      { status: 503, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { publicacion_id, titulo, descripcion, precio, modo, cantidad = 1, alumno_email, alumno_nombre, docente_email, tipo } = body;

    if (!publicacion_id || !precio || !alumno_email) {
      return new Response(
        JSON.stringify({ error: "Faltan campos requeridos" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    const APP_URL = Deno.env.get("APP_URL") ?? "https://classelink.vercel.app";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // ── Validar precio contra la BD (excepto recargas de billetera) ─────
    const ES_RECARGA = tipo === "recarga_billetera" ||
      publicacion_id === "00000000-0000-0000-0000-000000000001";

    if (!ES_RECARGA) {
      const { data: pub, error: pubErr } = await supabase
        .from("publicaciones")
        .select("precio, autor_email, activo")
        .eq("id", publicacion_id)
        .single();

      if (pubErr || !pub) {
        return new Response(
          JSON.stringify({ error: "Publicación no encontrada" }),
          { status: 404, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }

      if (!pub.activo) {
        return new Response(
          JSON.stringify({ error: "Esta publicación no está activa" }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }

      // El precio enviado por el cliente debe coincidir con el de la BD (tolerancia $1)
      const precioReal = parseFloat(pub.precio);
      const precioCliente = parseFloat(precio) * Number(cantidad);
      if (Math.abs(precioReal - precioCliente) > 1) {
        return new Response(
          JSON.stringify({ error: "El precio no coincide", precio_real: precioReal }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }

      // El alumno no puede pagar su propia publicación
      if (pub.autor_email === alumno_email) {
        return new Response(
          JSON.stringify({ error: "No podés pagar tu propia publicación" }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Crear preferencia en MercadoPago ────────────────────────────────
    const preferencia = {
      items: [{ id: publicacion_id, title: titulo ?? "Clase en Luderis", description: descripcion ?? "Clase particular", category_id: "education", quantity: Number(cantidad), unit_price: Number(precio), currency_id: "ARS" }],
      payer: { email: alumno_email, name: alumno_nombre ?? alumno_email.split("@")[0] },
      back_urls: {
        success: `${APP_URL}?mp=success&pub=${publicacion_id}`,
        failure: `${APP_URL}?mp=failure&pub=${publicacion_id}`,
        pending: `${APP_URL}?mp=pending&pub=${publicacion_id}`,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({ publicacion_id, alumno_email, docente_email, modo, tipo }),
      payment_methods: { installments: modo === "curso" ? 12 : 1 },
      statement_descriptor: "LUDERIS",
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
      body: JSON.stringify(preferencia),
    });

    const mpData = await mpRes.json();
    if (!mpRes.ok) throw new Error(mpData.message ?? `MP error ${mpRes.status}`);

    return new Response(
      JSON.stringify({
        preference_id: mpData.id,
        checkout_url: MP_ACCESS_TOKEN?.startsWith("TEST-") ? mpData.sandbox_init_point : mpData.init_point,
        expires_at: mpData.expiration_date_to,
      }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
