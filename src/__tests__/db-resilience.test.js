// Resiliencia del cliente de datos (src/supabase.ts): candados de regresión
// para los bugs reales que ya nos mordieron — refresh+retry en 401, errores
// no-JSON (HTML de un 502 de gateway) y respuestas return=minimal.
import * as sb from "../supabase";

const jsonRes = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
});

afterEach(() => {
  sb.setSessionRefreshCallback(null);
  vi.restoreAllMocks();
});

describe("db() — refresh y retry en 401", () => {
  test("401 → refresca sesión UNA vez y reintenta con el token nuevo", async () => {
    const refresh = vi.fn(async () => ({ access_token: "token-nuevo" }));
    sb.setSessionRefreshCallback(refresh);

    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push(opts.headers.Authorization);
      return calls.length === 1
        ? jsonRes(401, { message: "JWT expired" })
        : jsonRes(200, [{ id: 1 }]);
    });

    const out = await sb.db("cosas?select=*", "GET", null, "token-viejo");
    expect(out).toEqual([{ id: 1 }]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["Bearer token-viejo", "Bearer token-nuevo"]);
  });

  test("si el refresh no devuelve sesión, propaga el error original (sin loop)", async () => {
    sb.setSessionRefreshCallback(vi.fn(async () => null));
    global.fetch = vi.fn(async () => jsonRes(401, { message: "JWT expired" }));

    await expect(sb.db("cosas", "GET", null, "tok")).rejects.toThrow(/JWT expired/);
    expect(global.fetch).toHaveBeenCalledTimes(1); // no reintenta sin token nuevo
  });
});

describe("db() — errores que no son JSON (regresión del fix #8)", () => {
  test("un 502 con HTML no crashea el parser: el error llega legible", async () => {
    global.fetch = vi.fn(async () => jsonRes(502, "<html>Bad Gateway</html>"));
    await expect(sb.db("cosas", "GET", null, "tok")).rejects.toThrow(/Bad Gateway/);
  });

  test("error vacío (status sin body) tampoco crashea", async () => {
    global.fetch = vi.fn(async () => jsonRes(500, ""));
    await expect(sb.db("cosas", "GET", null, "tok")).rejects.toThrow(/HTTP 500/);
  });
});

describe("db() — respuestas mínimas", () => {
  test("return=minimal (body vacío con 2xx) resuelve como lista vacía", async () => {
    global.fetch = vi.fn(async () => jsonRes(201, ""));
    const out = await sb.db("cosas", "POST", { a: 1 }, "tok", "return=minimal");
    expect(out).toEqual([]);
  });
});
