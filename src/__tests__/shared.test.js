import {
  safeDisplayName,
  fmtPrice,
  calcAvg,
  calcDuracion,
  sanitizeContactInfo,
  moderarMensaje,
} from "../shared";

// ─── safeDisplayName ──────────────────────────────────────────────────────────
describe("safeDisplayName", () => {
  test("devuelve el nombre si es válido y no es un email", () => {
    expect(safeDisplayName("Juan Pérez", "juan@mail.com")).toBe("Juan Pérez");
  });
  test("recorta espacios del nombre", () => {
    expect(safeDisplayName("  Ana  ", null)).toBe("Ana");
  });
  test("enmascara el email si el nombre falta o contiene @", () => {
    const r = safeDisplayName("", "juan@mail.com");
    expect(r).not.toBe("juan@mail.com"); // no expone el email completo
    expect(typeof r).toBe("string");
  });
  test("usa el email cuando el nombre es en realidad un email", () => {
    const r = safeDisplayName("juan@mail.com", "juan@mail.com");
    expect(r).not.toBe("Usuario");
  });
  test("fallback a 'Usuario' sin nombre ni email", () => {
    expect(safeDisplayName(null, null)).toBe("Usuario");
  });
});

// ─── fmtPrice ─────────────────────────────────────────────────────────────────
describe("fmtPrice", () => {
  test("'A convenir' cuando no hay precio", () => {
    expect(fmtPrice(null)).toBe("A convenir");
    expect(fmtPrice(undefined)).toBe("A convenir");
    expect(fmtPrice("")).toBe("A convenir");
  });
  test("'Gratis' cuando el precio es 0", () => {
    expect(fmtPrice(0)).toBe("Gratis");
    expect(fmtPrice("0")).toBe("Gratis");
  });
  test("formatea con símbolo y número", () => {
    const r = fmtPrice(5000, "ARS");
    expect(r).toMatch(/^\$/);
    expect(r.replace(/\D/g, "")).toBe("5000");
  });
});

// ─── calcAvg ──────────────────────────────────────────────────────────────────
describe("calcAvg", () => {
  test("null sin reseñas", () => {
    expect(calcAvg([])).toBeNull();
    expect(calcAvg(null)).toBeNull();
  });
  test("promedia las estrellas", () => {
    expect(calcAvg([{ estrellas: 4 }, { estrellas: 2 }])).toBe(3);
  });
  test("trata estrellas faltantes como 0", () => {
    expect(calcAvg([{ estrellas: 5 }, {}])).toBe(2.5);
  });
});

// ─── calcDuracion ─────────────────────────────────────────────────────────────
describe("calcDuracion", () => {
  test("null si falta una fecha o el rango es inválido", () => {
    expect(calcDuracion(null, "2026-01-10")).toBeNull();
    expect(calcDuracion("2026-01-10", "2026-01-10")).toBeNull(); // 0 días
    expect(calcDuracion("2026-01-10", "2026-01-05")).toBeNull(); // negativo
  });
  test("días para rangos cortos", () => {
    expect(calcDuracion("2026-01-01", "2026-01-04")).toMatch(/d[íi]a/);
  });
  test("semanas para rangos medios", () => {
    expect(calcDuracion("2026-01-01", "2026-01-15")).toMatch(/semana/);
  });
  test("meses para rangos largos", () => {
    expect(calcDuracion("2026-01-01", "2026-04-01")).toMatch(/mes/);
  });
});

// ─── sanitizeContactInfo (anti-puenteo) ───────────────────────────────────────
describe("sanitizeContactInfo", () => {
  test("oculta emails", () => {
    const r = sanitizeContactInfo("escribime a juan@mail.com dale");
    expect(r).not.toContain("juan@mail.com");
    expect(r).toContain("oculto");
  });
  test("oculta números de teléfono", () => {
    const r = sanitizeContactInfo("mi cel es 1156781234");
    expect(r).not.toContain("1156781234");
    expect(r).toContain("oculto");
  });
  test("oculta handles de redes sociales", () => {
    const r = sanitizeContactInfo("seguime en instagram: juanperez");
    expect(r.toLowerCase()).toContain("oculto");
  });
  test("deja pasar texto limpio", () => {
    const limpio = "¿A qué hora es la clase de mañana?";
    expect(sanitizeContactInfo(limpio)).toBe(limpio);
  });
  test("maneja valores vacíos", () => {
    expect(sanitizeContactInfo("")).toBe("");
    expect(sanitizeContactInfo(null)).toBeNull();
  });
});

// ─── moderarMensaje ───────────────────────────────────────────────────────────
describe("moderarMensaje", () => {
  test("permite mensajes normales", () => {
    expect(moderarMensaje("Hola, ¿cuándo arrancamos?")).toEqual({
      ok: true, block: false, advertencia: null,
    });
  });
  test("bloquea amenazas", () => {
    const r = moderarMensaje("te mato");
    expect(r.ok).toBe(false);
    expect(r.block).toBe(true);
  });
  test("bloquea compartir email (puenteo)", () => {
    const r = moderarMensaje("mi mail es juan@gmail.com");
    expect(r.block).toBe(true);
    expect(r.advertencia).toMatch(/Luderis/);
  });
  test("bloquea compartir teléfono (puenteo)", () => {
    const r = moderarMensaje("llamame al 11 5678 1234");
    expect(r.block).toBe(true);
  });
  test("bloquea mención de redes sociales", () => {
    const r = moderarMensaje("hablemos por whatsapp");
    expect(r.block).toBe(true);
  });
  test("advierte (sin bloquear) ante lenguaje ofensivo", () => {
    const r = moderarMensaje("sos un boludo");
    expect(r.ok).toBe(false);
    expect(r.block).toBe(false);
    expect(r.advertencia).toMatch(/respetuoso/i);
  });
  test("maneja vacío", () => {
    expect(moderarMensaje("")).toEqual({ ok: true, block: false, advertencia: null });
  });
});
