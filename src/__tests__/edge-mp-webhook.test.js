// Tests de contrato de la edge function mp-webhook — se ejecuta el HANDLER REAL
// (importado vía shims Deno, ver helpers/edge-env.js) contra un PostgREST/MP
// simulados. Cubre la ruta del dinero: firma, idempotencia (CAS acreditado_at),
// acreditación inmediata vs retención de paquetes.
import {
  installDeno, takeHandler, signMpWebhook,
  pgJson, pgNoRows, pgMinimal, makeFetchRouter, countCalls,
} from "./helpers/edge-env";

const SECRET = "whsec-test";
const SB = "http://sb.local";
// Publicación ficticia que identifica una recarga de saldo (no es un curso).
const RECARGA_SENTINELA = "00000000-0000-0000-0000-000000000001";
let handler;

beforeAll(async () => {
  installDeno({
    MP_ACCESS_TOKEN: "mp-tok",
    MP_WEBHOOK_SECRET: SECRET,
    SUPABASE_URL: SB,
    SUPABASE_SERVICE_ROLE_KEY: "srv-key",
  });
  await import("../../supabase/functions/mp-webhook/index.ts");
  handler = takeHandler();
});

// Pago aprobado "estándar" que devuelve la API de MP
const pagoMp = (over = {}) => ({
  id: 777,
  status: "approved",
  transaction_amount: 1000,
  preference_id: "pref-1",
  external_reference: JSON.stringify({
    publicacion_id: "11111111-1111-1111-1111-111111111111",
    alumno_email: "alumno@test.com",
    docente_email: "docente@test.com",
    modo: "curso",
    tipo: "clase",
    ...over.meta,
  }),
  ...over.pago,
});

// Backend simulado con la primera entrega exitosa (claim CAS gana)
function backendPrimeraEntrega({ claimGana = true, meta, pago, inscripcionDuplicada = false, pub } = {}) {
  const r = makeFetchRouter();
  r.on("GET", "api.mercadopago.com/v1/payments/777", () => pgJson(pagoMp({ meta, pago })))
    .on("POST", "/rest/v1/pagos", () => pgMinimal(201))                       // upsert registro
    .on("GET", "/rest/v1/config", () => pgJson({ valor: "10" }))              // comisión 10%
    .on("PATCH", (u) => u.includes("/rest/v1/pagos") && u.includes("acreditado_at=is.null"),
      () => (claimGana ? pgJson({ id: "pg-row-1" }) : pgNoRows()))            // CAS idempotencia
    .on("GET", (u) => u.includes("/rest/v1/usuarios") && u.includes("alumno%40test.com"),
      () => pgJson({ id: "u-alumno" }))
    .on("GET", (u) => u.includes("/rest/v1/usuarios") && u.includes("docente%40test.com"),
      () => pgJson({ id: "u-docente" }))
    // Duración de la unidad comprada: una publicación "por clase" puede tener
    // clases de 90 min y asumir 60 le comería horas pagas al alumno.
    .on("GET", "/rest/v1/publicaciones",
      () => pgJson(pub ?? { precio_tipo: "hora", duracion_clase_min: null }))
    .on("POST", "/rest/v1/inscripciones",
      () => (inscripcionDuplicada
        // 23505: ya estaba inscripto → es una RECOMPRA de horas
        ? new Response(JSON.stringify({ code: "23505", message: "uq_inscripcion_publicacion_alumno" }),
            { status: 409, headers: { "Content-Type": "application/json" } })
        : pgJson({ id: "insc-1" })))
    .on("POST", "/rest/v1/rpc/sumar_horas_inscripcion", () => pgJson("insc-1"))
    .on("POST", "/rest/v1/rpc/incrementar_saldo", () => new Response(null, { status: 204 }))
    .on("POST", "/rest/v1/billetera_movimientos", () => pgMinimal(201))
    .on("POST", "/rest/v1/notificaciones", () => pgMinimal(201));
  return r;
}

const reqWebhook = async (query, headers = {}) =>
  handler(new Request(`http://edge.local/mp-webhook?${query}`, { method: "POST", headers }));

describe("mp-webhook — gates de entrada", () => {
  test("merchant_order se ignora con 200 (antes: fetch a MP con id inválido → 500 → retry infinito)", async () => {
    globalThis.fetch = () => { throw new Error("no debería llamar a la red"); };
    const res = await reqWebhook("topic=merchant_order&id=999");
    expect(res.status).toBe(200);
  });

  test("sin firma → 401", async () => {
    globalThis.fetch = () => { throw new Error("no debería llamar a la red"); };
    const res = await reqWebhook("topic=payment&id=777");
    expect(res.status).toBe(401);
  });

  test("firma inválida → 401 y NO consulta a MP", async () => {
    const router = backendPrimeraEntrega();
    globalThis.fetch = router.fetch;
    const res = await reqWebhook("topic=payment&id=777", {
      "x-signature": "ts=1700000000,v1=deadbeef",
      "x-request-id": "req-1",
    });
    expect(res.status).toBe(401);
    expect(countCalls(router, "GET", "api.mercadopago.com")).toBe(0);
  });
});

describe("mp-webhook — la ruta del dinero", () => {
  test("primera entrega: inscribe y RETIENE el pago (pendiente), sin acreditar al instante", async () => {
    const router = backendPrimeraEntrega();
    globalThis.fetch = router.fetch;
    const res = await reqWebhook("topic=payment&id=777", await signMpWebhook(SECRET, "777"));
    expect(res.status).toBe(200);

    // Reclamó la idempotencia (CAS sobre acreditado_at IS NULL)
    const cas = router.calls.find((c) => c.method === "PATCH" && c.url.includes("acreditado_at=is.null"));
    expect(cas).toBeTruthy();
    expect(cas.body.acreditado_at).toBeTruthy();

    // Inscripción del alumno
    const insc = router.calls.find((c) => c.method === "POST" && c.url.includes("/rest/v1/inscripciones"));
    expect(insc.body.alumno_email).toBe("alumno@test.com");
    expect(insc.body.pagado_mp).toBe(true);
    expect(insc.body.mp_payment_id).toBe("777");

    // Escrow: NO se acredita al instante (nada de incrementar_saldo)
    expect(countCalls(router, "POST", "rpc/incrementar_saldo")).toBe(0);

    // El pago queda RETENIDO (pendiente), neto = 1000 - 10% = 900, comisión 100
    const mov = router.calls.find((c) => c.method === "POST" && c.url.includes("billetera_movimientos"));
    expect(mov.body.estado).toBe("pendiente");
    expect(mov.body.monto).toBe(900);
    expect(mov.body.comision_luderis).toBe(100);
  });

  test("SEGUNDA entrega del mismo pago: idempotente — cero acreditaciones/inscripciones", async () => {
    const router = backendPrimeraEntrega({ claimGana: false }); // el CAS ya no matchea
    globalThis.fetch = router.fetch;
    const res = await reqWebhook("topic=payment&id=777", await signMpWebhook(SECRET, "777"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ idempotent: true });

    expect(countCalls(router, "POST", "rpc/incrementar_saldo")).toBe(0);
    expect(countCalls(router, "POST", "/rest/v1/inscripciones")).toBe(0);
    expect(countCalls(router, "POST", "billetera_movimientos")).toBe(0);
  });

  test("paquete de clases: fondos RETENIDOS (pendiente), sin acreditación inmediata", async () => {
    const router = backendPrimeraEntrega({ meta: { tipo: "paquete_clase", clases_cantidad: "4" } });
    globalThis.fetch = router.fetch;
    const res = await reqWebhook("topic=payment&id=777", await signMpWebhook(SECRET, "777"));
    expect(res.status).toBe(200);

    // La inscripción registra el paquete
    const insc = router.calls.find((c) => c.url.includes("/rest/v1/inscripciones"));
    expect(insc.body.clases_totales).toBe(4);
    expect(insc.body.clases_restantes).toBe(4);

    // NO se toca el saldo; el movimiento queda pendiente (escrow)
    expect(countCalls(router, "POST", "rpc/incrementar_saldo")).toBe(0);
    const mov = router.calls.find((c) => c.url.includes("billetera_movimientos"));
    expect(mov.body.estado).toBe("pendiente");
    expect(mov.body.monto).toBe(900);
    // El hold pertenece a la cartera y vence: así se consume FIFO y lo no usado
    // vuelve como crédito al alumno.
    expect(mov.body.inscripcion_id).toBe("insc-1");
    expect(mov.body.minutos).toBe(240);               // 4 unidades × 60 min (precio por hora)
    expect(mov.body.expira_at).toBeTruthy();
  });

  test("recompra: el alumno ya inscripto SUMA horas a su cartera (antes pagaba y no recibía nada)", async () => {
    // Regresión: UNIQUE (publicacion_id, alumno_id) hacía fallar el INSERT con
    // 23505, el webhook se comía el error como "idempotente" y clases_totales no
    // subía — pero el cobro sí ocurría y el hold quedaba huérfano.
    const router = backendPrimeraEntrega({
      meta: { tipo: "paquete_clase", clases_cantidad: "2" },
      inscripcionDuplicada: true,
    });
    globalThis.fetch = router.fetch;
    const res = await reqWebhook("topic=payment&id=777", await signMpWebhook(SECRET, "777"));
    expect(res.status).toBe(200);

    // Se suman las horas a la inscripción existente
    const suma = router.calls.find((c) => c.url.includes("rpc/sumar_horas_inscripcion"));
    expect(suma).toBeTruthy();
    expect(suma.body.p_unidades).toBe(2);
    expect(suma.body.p_minutos).toBe(120);

    // Y el hold nuevo queda atado a esa misma cartera (si no, nadie lo liquida)
    const mov = router.calls.find((c) => c.url.includes("billetera_movimientos"));
    expect(mov.body.inscripcion_id).toBe("insc-1");
    expect(mov.body.estado).toBe("pendiente");
  });

  test("publicación que cobra POR CLASE de 90 min: compra 2 → 180 min, no 120", async () => {
    // Asumir 60 min por unidad le comía media hora paga por clase al alumno.
    const router = backendPrimeraEntrega({
      meta: { tipo: "paquete_clase", clases_cantidad: "2" },
      pub: { precio_tipo: "clase", duracion_clase_min: 90 },
    });
    globalThis.fetch = router.fetch;
    await reqWebhook("topic=payment&id=777", await signMpWebhook(SECRET, "777"));

    const insc = router.calls.find((c) => c.url.includes("/rest/v1/inscripciones"));
    expect(insc.body.minutos_totales).toBe(180);
  });

  test("recarga de billetera (publicacion_id sentinela): no inscribe ni acredita al docente", async () => {
    const router = backendPrimeraEntrega({
      meta: { publicacion_id: RECARGA_SENTINELA, docente_email: null, tipo: "recarga_billetera" },
    });
    globalThis.fetch = router.fetch;
    const res = await reqWebhook("topic=payment&id=777", await signMpWebhook(SECRET, "777"));
    expect(res.status).toBe(200);
    expect(countCalls(router, "POST", "rpc/incrementar_saldo")).toBe(0);
    expect(countCalls(router, "POST", "billetera_movimientos")).toBe(0);
    expect(countCalls(router, "POST", "/rest/v1/inscripciones")).toBe(0);
  });

  // Regresión de seguridad: `tipo` sale del external_reference, que se arma con
  // datos del cliente. Declarar "recarga_billetera" sobre una publicación real
  // salteaba la validación de precio en mp-checkout y, acá, dejaba al docente
  // sin cobrar mientras el alumno igual quedaba inscripto.
  test("tipo=recarga_billetera sobre una publicación REAL no cuenta como recarga", async () => {
    const router = backendPrimeraEntrega({ meta: { tipo: "recarga_billetera" } });
    globalThis.fetch = router.fetch;
    const res = await reqWebhook("topic=payment&id=777", await signMpWebhook(SECRET, "777"));
    expect(res.status).toBe(200);

    // El docente cobra igual: se crea el hold retenido por el neto
    const mov = router.calls.find((c) => c.method === "POST" && c.url.includes("billetera_movimientos"));
    expect(mov.body.estado).toBe("pendiente");
    expect(mov.body.monto).toBe(900);
    expect(countCalls(router, "POST", "/rest/v1/inscripciones")).toBe(1);
  });

  // Regresión de seguridad: con MP Connect el neto ya viajó directo a la cuenta
  // del docente. Crear el hold como 'pendiente' hacía que la liberación (o el
  // cron de 7 días) se lo acreditara una SEGUNDA vez al saldo interno.
  test("split inmediato (MP Connect): asienta 'liberado', no un hold reembolsable", async () => {
    const router = backendPrimeraEntrega({ meta: { split_inmediato: true } });
    globalThis.fetch = router.fetch;
    const res = await reqWebhook("topic=payment&id=777", await signMpWebhook(SECRET, "777"));
    expect(res.status).toBe(200);

    const mov = router.calls.find((c) => c.method === "POST" && c.url.includes("billetera_movimientos"));
    expect(mov.body.estado).toBe("liberado");
    expect(mov.body.monto).toBe(900);
    // El saldo interno NO se toca: la plata está en la cuenta de MP del docente
    expect(countCalls(router, "POST", "rpc/incrementar_saldo")).toBe(0);
  });

  test("pago no aprobado (pending): registra el pago pero no inscribe ni acredita", async () => {
    const router = backendPrimeraEntrega({ pago: { status: "pending" } });
    globalThis.fetch = router.fetch;
    const res = await reqWebhook("topic=payment&id=777", await signMpWebhook(SECRET, "777"));
    expect(res.status).toBe(200);
    expect(countCalls(router, "POST", "/rest/v1/pagos")).toBe(1); // upsert de registro
    expect(countCalls(router, "POST", "/rest/v1/inscripciones")).toBe(0);
    expect(countCalls(router, "POST", "rpc/incrementar_saldo")).toBe(0);
  });
});
