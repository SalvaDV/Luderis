// Tests de contrato de la edge function liberar-pago (escrow → docente).
// Ejecuta el HANDLER REAL contra un PostgREST/MP simulados. Cubre: auth interna,
// claim atómico (CAS retenido→procesando), idempotencia de la transferencia MP
// (X-Idempotency-Key) y rollback a "retenido" si algo falla a mitad de camino.
import {
  installDeno, takeHandler,
  pgJson, pgNoRows, pgMinimal, makeFetchRouter, countCalls,
} from "./helpers/edge-env";

const SB = "http://sb.local";
let handler;
let env;

beforeAll(async () => {
  env = installDeno({
    SUPABASE_URL: SB,
    SUPABASE_SERVICE_ROLE_KEY: "srv-key",
    MP_ACCESS_TOKEN: "mp-tok",
    LIBERAR_PAGO_SECRET: "cron-secret",
  });
  await import("../../supabase/functions/liberar-pago/index.ts");
  handler = takeHandler();
});

const reqLiberar = (body, auth = "Bearer cron-secret") =>
  handler(new Request("http://edge.local/liberar-pago", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) },
    body: JSON.stringify(body),
  }));

const PAGO = {
  id: "pg1", monto: 1000,
  docente_email: "docente@test.com", alumno_email: "alumno@test.com",
  publicacion_id: "22222222-2222-2222-2222-222222222222",
  mp_payment_id: "777", raw_data: {},
};

// Backend del happy path; `sinLiberarOk:false` hace fallar el UPDATE a liberado
function backend({ claimGana = true, liberarOk = true, conMp = true } = {}) {
  const r = makeFetchRouter();
  r.on("PATCH", (u, c) => u.includes("/rest/v1/pagos"), (call) => {
    const b = call.body || {};
    // maybeSingle moderno: el server devuelve ARRAY; [] ⇒ data:null sin error
    if (b.estado_escrow === "procesando") return claimGana ? pgJson([PAGO]) : pgJson([]); // claim CAS
    if (b.estado_escrow === "liberado")  return liberarOk ? pgMinimal(204) : pgJson({ message: "boom" }, 500);
    if (b.estado_escrow === "retenido")  return pgMinimal(204); // rollback
    return pgJson({ message: "PATCH inesperado" }, 500);
  })
    .on("GET", "/rest/v1/pagos", () => pgJson({ estado_escrow: "liberado" })) // consulta post claim-miss
    .on("GET", "/rest/v1/mp_conexiones", () =>
      conMp ? pgJson({ mp_user_id: 555, mp_email: "doc@mp.com", mp_access_token: "x" }) : pgNoRows())
    .on("GET", "/rest/v1/usuarios", () => pgJson({ id: "u-docente" }))
    .on("GET", "/rest/v1/config", () => pgJson({ valor: "10" }))
    .on("POST", "api.mercadopago.com/v1/payments", () => pgJson({ id: 9001, status: "approved" }))
    .on("POST", "/rest/v1/billetera_movimientos", () => pgMinimal(201))
    .on("POST", "/rest/v1/notificaciones", () => pgMinimal(201));
  return r;
}

describe("liberar-pago — auth interna", () => {
  test("sin LIBERAR_PAGO_SECRET configurado → 503 (cerrado por defecto)", async () => {
    env.del("LIBERAR_PAGO_SECRET");
    const res = await reqLiberar({ pago_id: "pg1" });
    expect(res.status).toBe(503);
    env.set("LIBERAR_PAGO_SECRET", "cron-secret");
  });

  test("bearer incorrecto → 401", async () => {
    const res = await reqLiberar({ pago_id: "pg1" }, "Bearer intruso");
    expect(res.status).toBe(401);
  });
});

describe("liberar-pago — escrow", () => {
  test("happy path: claim atómico, transferencia MP idempotente y neto correcto", async () => {
    const router = backend();
    globalThis.fetch = router.fetch;
    const res = await reqLiberar({ pago_id: "pg1" });
    expect(res.status).toBe(200);
    const out = await res.json();
    expect(out).toMatchObject({ ok: true, metodo: "mp_transfer", monto_neto: 900, comision: 100 });

    // La transferencia a MP viaja con X-Idempotency-Key = pago_id (anti doble envío)
    const transfer = router.calls.find((c) => c.url.includes("api.mercadopago.com/v1/payments"));
    expect(transfer.headers.get("X-Idempotency-Key")).toBe("pg1");
    expect(transfer.body.transaction_amount).toBe(900);
    expect(transfer.body.collector).toEqual({ id: 555 });

    // Movimiento de billetera registrado como liberado
    const mov = router.calls.find((c) => c.url.includes("billetera_movimientos"));
    expect(mov.body.estado).toBe("liberado");
    expect(mov.body.monto).toBe(900);
  });

  test("claim perdido (otro proceso lo tomó): 409 y CERO transferencias", async () => {
    const router = backend({ claimGana: false });
    globalThis.fetch = router.fetch;
    const res = await reqLiberar({ pago_id: "pg1" });
    expect(res.status).toBe(409);
    expect(countCalls(router, "POST", "api.mercadopago.com")).toBe(0);
    expect(countCalls(router, "POST", "billetera_movimientos")).toBe(0);
  });

  test("falla al persistir 'liberado' → rollback a 'retenido' para que el cron reintente", async () => {
    const router = backend({ liberarOk: false });
    globalThis.fetch = router.fetch;
    const res = await reqLiberar({ pago_id: "pg1" });
    expect(res.status).toBe(500);
    // Devolvió la fila a "retenido" acotado a estado procesando (solo la que reclamamos)
    const rollback = router.calls.find(
      (c) => c.method === "PATCH" && c.body?.estado_escrow === "retenido",
    );
    expect(rollback).toBeTruthy();
    expect(rollback.url).toContain("estado_escrow=eq.procesando");
  });

  test("docente sin MP conectado: libera igual (pendiente manual), sin transferencia", async () => {
    const router = backend({ conMp: false });
    globalThis.fetch = router.fetch;
    const res = await reqLiberar({ pago_id: "pg1" });
    expect(res.status).toBe(200);
    expect((await res.json()).metodo).toBe("pendiente_mp_desconectado");
    expect(countCalls(router, "POST", "api.mercadopago.com")).toBe(0);
  });
});
