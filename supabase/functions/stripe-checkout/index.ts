import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // ── Verificar JWT del usuario ─────────────────────────────────────────────
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader   = req.headers.get("Authorization") ?? "";
    const jwtToken     = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!jwtToken) {
      return new Response(JSON.stringify({ error: "No autorizado: se requiere sesión activa" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supaAuth = createClient(SUPABASE_URL, SUPABASE_SRK, { auth: { persistSession: false } });
    const { data: { user: jwtUser }, error: jwtErr } = await supaAuth.auth.getUser(jwtToken);
    if (jwtErr || !jwtUser) {
      return new Response(JSON.stringify({ error: "No autorizado: token inválido" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY no configurada");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    const body = await req.json();
    const { action } = body;

    // ── Crear Payment Intent ──────────────────────────────────────────────────
    if (action === "create_payment_intent") {
      // `docente_email` del body se ignora: define a quién se le acredita la
      // plata, así que sale de la BD (ver `autorEmail`).
      const {
        publicacion_id, titulo, precio, moneda = "usd",
        alumno_email, alumno_nombre,
      } = body;

      if (!publicacion_id || !precio || !alumno_email) {
        return new Response(
          JSON.stringify({ error: "Faltan campos requeridos" }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }

      // alumno_email debe coincidir con el JWT — evita pagar en nombre de otro
      if (alumno_email !== jwtUser.email) {
        return new Response(
          JSON.stringify({ error: "No autorizado: alumno_email no coincide con la sesión activa" }),
          { status: 403, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }

      // ARS no está soportado por Stripe
      const monedaStripe = moneda.toLowerCase();
      if (["ars", "cop", "clp", "pyg"].includes(monedaStripe)) {
        return new Response(
          JSON.stringify({ error: `La moneda ${moneda.toUpperCase()} no es compatible con Stripe. Usá Mercado Pago.` }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }

      // ── Validar precio y autor contra la BD ─────────────────────────────
      // Sin esto el cliente fija el monto que quiere y el destinatario de la plata.
      const { data: pub, error: pubErr } = await supaAuth
        .from("publicaciones_con_autor")
        .select("precio, autor_email, activo")
        .eq("id", publicacion_id)
        .single();

      if (pubErr && pubErr.code !== "PGRST116") {
        return new Response(
          JSON.stringify({ error: "Error al validar publicación" }),
          { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      if (!pub) {
        return new Response(
          JSON.stringify({ error: "Publicación no encontrada" }),
          { status: 404, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      if (pub.activo === false) {
        return new Response(
          JSON.stringify({ error: "Esta publicación no está activa" }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      // El precio se manda en la moneda de la publicación (ver CursoPage), así
      // que se compara directo contra el de la BD, con tolerancia de 1 unidad.
      if (Math.abs(parseFloat(precio) - parseFloat(pub.precio)) > 1) {
        return new Response(
          JSON.stringify({ error: "El precio no coincide" }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      if (pub.autor_email === alumno_email) {
        return new Response(
          JSON.stringify({ error: "No podés pagar tu propia publicación" }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      const autorEmail = pub.autor_email;

      const amount = Math.round(Number(precio) * 100);

      // comision_pct siempre desde DB — el cliente no puede manipularla
      const { data: configRow } = await supaAuth
        .from("config").select("valor").eq("clave", "comision_pct").single();
      const comision_pct    = configRow?.valor ? parseFloat(configRow.valor) : 10;
      const comisionAmount  = Math.round(amount * (comision_pct / 100));

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: monedaStripe,
        metadata: {
          publicacion_id,
          titulo:           titulo?.slice(0, 100) || "",
          alumno_email,
          alumno_nombre:    alumno_nombre || "",
          docente_email:    autorEmail || "",
          comision_pct:     String(comision_pct),
          comision_amount:  String(comisionAmount),
        },
        receipt_email: alumno_email,
        description:   `Luderis - ${titulo || "Clase"}`,
      });

      return new Response(
        JSON.stringify({
          client_secret:      paymentIntent.client_secret,
          payment_intent_id:  paymentIntent.id,
          amount,
          currency:           monedaStripe,
        }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // ── Verificar estado de pago ──────────────────────────────────────────────
    if (action === "verify_payment") {
      const { payment_intent_id } = body;
      if (!payment_intent_id) throw new Error("Falta payment_intent_id");

      const pi = await stripe.paymentIntents.retrieve(payment_intent_id);

      // El intent tiene que ser del que pregunta. Sin esto, cualquier usuario
      // con sesión consulta un payment_intent_id ajeno y se lleva la metadata
      // completa (alumno_email, docente_email, título) de transacciones de otros.
      if (pi.metadata?.alumno_email !== jwtUser.email) {
        return new Response(
          JSON.stringify({ error: "No autorizado: el pago no pertenece a esta sesión" }),
          { status: 403, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          status:     pi.status,
          succeeded:  pi.status === "succeeded",
          amount:     pi.amount,
          currency:   pi.currency,
          metadata:   pi.metadata,
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
