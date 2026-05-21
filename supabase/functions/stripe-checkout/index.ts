import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY no configurada");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    const body = await req.json();
    const { action } = body;

    // ── Crear Payment Intent ──────────────────────────────────────────────────
    if (action === "create_payment_intent") {
      const {
        publicacion_id, titulo, precio, moneda = "usd",
        alumno_email, alumno_nombre, docente_email,
        comision_pct = 10,
      } = body;

      if (!publicacion_id || !precio || !alumno_email) {
        return new Response(
          JSON.stringify({ error: "Faltan campos requeridos" }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }

      // ARS no está soportado por Stripe — validar antes de proceder
      const monedaStripe = moneda.toLowerCase();
      if (monedaStripe === "ars" || monedaStripe === "cop" || monedaStripe === "clp" || monedaStripe === "pyg") {
        return new Response(
          JSON.stringify({ error: `La moneda ${moneda.toUpperCase()} no es compatible con pagos por tarjeta. Usá Mercado Pago para precios en ${moneda.toUpperCase()}.` }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      const amount = Math.round(Number(precio) * 100);
      const comisionAmount = Math.round(amount * (comision_pct / 100));

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: monedaStripe,
        metadata: {
          publicacion_id,
          titulo: titulo?.slice(0, 100) || "",
          alumno_email,
          alumno_nombre: alumno_nombre || "",
          docente_email: docente_email || "",
          comision_pct: String(comision_pct),
          comision_amount: String(comisionAmount),
        },
        receipt_email: alumno_email,
        description: `Luderis - ${titulo || "Clase"}`,
      });

      return new Response(
        JSON.stringify({
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
          amount,
          currency: monedaStripe,
        }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // ── Verificar estado de pago ──────────────────────────────────────────────
    if (action === "verify_payment") {
      const { payment_intent_id } = body;
      if (!payment_intent_id) throw new Error("Falta payment_intent_id");

      const pi = await stripe.paymentIntents.retrieve(payment_intent_id);

      return new Response(
        JSON.stringify({
          status: pi.status,
          succeeded: pi.status === "succeeded",
          amount: pi.amount,
          currency: pi.currency,
          metadata: pi.metadata,
        }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Acción no reconocida" }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("stripe-checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
