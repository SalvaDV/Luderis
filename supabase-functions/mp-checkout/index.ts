import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://classelink.vercel.app,https://luderis.vercel.app,http://localhost:3000")
  .split(",").map(s => s.trim()).filter(Boolean);

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const CORS = corsHeaders(req.headers.get("origin"));
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
    const { publicacion_id, titulo, descripcion, precio, modo, cantidad = 1, clases_cantidad, alumno_email, alumno_nombre, docente_email, tipo } = body;

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

      if (!pub) {
        return new Response(
          JSON.stringify({ error: "Publicación no encontrada", id: publicacion_id }),
          { status: 404, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      if (pubErr) {
        return new Response(
          JSON.stringify({ error: "Error al validar publicación: " + pubErr.message }),
          { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }

      if (!pub.activo) {
        return new Response(
          JSON.stringify({ error: "Esta publicación no está activa" }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }

      // Validar que el precio enviado por el cliente coincida con el de la BD.
      // Para paquetes permitimos un descuento máximo (DESCUENTO_MAX_PAQUETE) por escalonamiento.
      // Para clases/cursos individuales sólo se acepta rounding (± $1).
      const precioReal = parseFloat(pub.precio);
      if (!Number.isFinite(precioReal) || precioReal <= 0) {
        return new Response(
          JSON.stringify({ error: "Precio inválido en publicación" }),
          { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      const precioClienteNum = parseFloat(precio);
      const cantidadNum = Number(cantidad);
      const clasesCantidadNum = Number(clases_cantidad);
      if (!Number.isFinite(precioClienteNum) || precioClienteNum <= 0 ||
          !Number.isFinite(cantidadNum) || cantidadNum <= 0) {
        return new Response(
          JSON.stringify({ error: "Precio o cantidad inválidos" }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      const esPaquete = tipo === "paquete_clase" && Number.isFinite(clasesCantidadNum) && clasesCantidadNum > 0;
      const precioCliente = esPaquete ? precioClienteNum : precioClienteNum * cantidadNum;
      const precioEsperado = esPaquete ? precioReal * clasesCantidadNum : precioReal * cantidadNum;

      // Descuento máximo permitido para paquetes (configurable por env). Default 20%.
      const DESCUENTO_MAX_PAQUETE = Math.max(0, Math.min(0.5, parseFloat(Deno.env.get("DESCUENTO_MAX_PAQUETE") ?? "0.20")));
      const tolerancia = esPaquete ? precioEsperado * DESCUENTO_MAX_PAQUETE : 1;

      // Nunca permitir cobrar MÁS de lo esperado (protege al alumno).
      // Permitir cobrar menos sólo dentro de la tolerancia (descuento autorizado).
      if (precioCliente > precioEsperado + 1 || precioCliente < precioEsperado - tolerancia) {
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
      external_reference: JSON.stringify({ publicacion_id, alumno_email, docente_email, modo, tipo, clases_cantidad: clases_cantidad ?? null }),
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
