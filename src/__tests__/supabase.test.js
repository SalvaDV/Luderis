import * as sb from "../supabase";

// Captura la última llamada a fetch para inspeccionar URL/opciones
let lastUrl, lastOpts;
beforeEach(() => {
  lastUrl = null; lastOpts = null;
  global.fetch = vi.fn((url, opts) => {
    lastUrl = url; lastOpts = opts;
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve("[]"),
      json: () => Promise.resolve([]),
    });
  });
});

describe("construcción de queries (capa de datos)", () => {
  test("getMisChats filtra por emisor o receptor", async () => {
    await sb.getMisChats("juan@mail.com", "tok");
    expect(lastUrl).toContain("/rest/v1/mensajes");
    expect(lastUrl).toContain("or=(de_nombre.eq.");
    expect(lastUrl).toContain("para_nombre.eq.");
  });

  test("getReseñasBulk arma cláusula in.(...) y pide solo columnas no-PII", async () => {
    await sb.getReseñasBulk([1, 2, 3], "tok");
    expect(lastUrl).toContain("publicacion_id=in.(1,2,3)");
    expect(lastUrl).toContain("select=publicacion_id,estrellas");
    expect(lastUrl).not.toContain("autor_email");
  });

  test("getReseñasBulk no llama a la red con lista vacía", async () => {
    const r = await sb.getReseñasBulk([], "tok");
    expect(r).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("getUsuariosByEmails arma or=(email.eq...) y pide solo columnas de nombre (no PII)", async () => {
    await sb.getUsuariosByEmails(["a@b.com", "c@d.com"], "tok");
    expect(lastUrl).toContain("/rest/v1/usuarios");
    expect(lastUrl).toContain("or=(email.eq.a%40b.com,email.eq.c%40d.com)");
    expect(lastUrl).toContain("select=email,nombre,display_name");
    expect(lastUrl).not.toContain("bio"); // no arrastra PII
  });

  test("getUsuariosByEmails deduplica emails repetidos en una sola cláusula", async () => {
    await sb.getUsuariosByEmails(["a@b.com", "a@b.com"], "tok");
    expect(lastUrl).toContain("or=(email.eq.a%40b.com)");
  });

  test("getUsuariosByEmails no llama a la red con lista vacía", async () => {
    const r = await sb.getUsuariosByEmails([], "tok");
    expect(r).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("insertReseña hace POST con body JSON y Prefer representation", async () => {
    await sb.insertReseña({ publicacion_id: 1, estrellas: 5 }, "tok");
    expect(lastOpts.method).toBe("POST");
    expect(JSON.parse(lastOpts.body)).toEqual({ publicacion_id: 1, estrellas: 5 });
    expect(lastOpts.headers.Prefer).toContain("return=representation");
  });

  test("manda el token del usuario en Authorization", async () => {
    await sb.getMisChats("a@b.com", "mi-token-jwt");
    expect(lastOpts.headers.Authorization).toBe("Bearer mi-token-jwt");
  });
});

describe("seguridad: encoding de inputs en filtros", () => {
  test("el email con caracteres especiales se URL-encodea (anti-inyección PostgREST)", async () => {
    await sb.getMisInscripciones("a+b@mail.com", "tok");
    // '+' y '@' deben quedar percent-encoded, no crudos en el filtro
    expect(lastUrl).toContain("a%2Bb%40mail.com");
    expect(lastUrl).not.toContain("a+b@mail.com");
  });

  test("un intento de romper el filtro con coma/paréntesis se encodea", async () => {
    await sb.getMisInscripciones("x,y)@h.com", "tok");
    expect(lastUrl).not.toContain("x,y)@h.com");
    expect(lastUrl).toContain("%2C"); // coma encodeada
  });
});

describe("getPublicaciones", () => {
  test("usa la vista publicaciones_con_autor y filtra por autor encodeado", async () => {
    await sb.getPublicaciones({ autor: "doc@mail.com" }, "tok");
    expect(lastUrl).toContain("publicaciones_con_autor");
    expect(lastUrl).toContain("autor_email=eq.doc%40mail.com");
  });

  test("usa RPC buscar_publicaciones cuando hay texto", async () => {
    await sb.getPublicaciones({ texto: "guitarra" }, "tok");
    expect(lastUrl).toContain("/rpc/buscar_publicaciones");
    expect(JSON.parse(lastOpts.body).p_texto).toBe("guitarra");
  });
});
