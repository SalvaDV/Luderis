/* Sistema de diseño refinado de Luderis — tokens, acentos y escala tipográfica */
(function () {
  // ── Paletas base ────────────────────────────────────────────────────────
  const THEMES = {
    light: {
      bg: "#F4F7FB", surface: "#FFFFFF", surfaceAlt: "#FAFBFD",
      border: "#E7ECF3", borderStrong: "#D4DDE9", hairline: "#EEF2F7",
      text: "#0F1B2E", textSoft: "#39495F", muted: "#5A6A82", faint: "#8593A7",
      primary: "#1A6ED8", teal: "#0F9C82",
      shadow: "0 1px 2px rgba(16,27,46,.04), 0 4px 16px rgba(16,27,46,.05)",
      shadowHover: "0 2px 4px rgba(16,27,46,.05), 0 12px 28px rgba(16,27,46,.10)",
      overlay: "rgba(10,18,32,.45)",
    },
    dark: {
      bg: "#0A1220", surface: "#111C2E", surfaceAlt: "#0E1727",
      border: "#21304700", borderStrong: "#2A3A52", hairline: "#1A2740",
      text: "#E9EFF8", textSoft: "#B4C2D6", muted: "#8597B0", faint: "#5E708C",
    },
  };
  THEMES.dark.border = "#203049";
  THEMES.dark.primary = "#4C95F0";
  THEMES.dark.teal = "#28C2A4";
  THEMES.dark.shadow = "0 1px 2px rgba(0,0,0,.3), 0 6px 20px rgba(0,0,0,.35)";
  THEMES.dark.shadowHover = "0 2px 6px rgba(0,0,0,.4), 0 16px 36px rgba(0,0,0,.5)";
  THEMES.dark.overlay = "rgba(2,6,14,.6)";

  // ── Acentos por sección (mismo ADN, más sobrios y con buen contraste) ─────
  const ACCENTS = {
    light: {
      curso:  { solid: "#1A6ED8", text: "#1257AE", soft: "#EAF2FC", line: "#1A6ED8", ring: "#1A6ED833", heroGrad: "linear-gradient(135deg, #0A2A5E 0%, #1A6ED8 55%, #2EC4A0 100%)" },
      clase:  { solid: "#B96A12", text: "#9A5510", soft: "#FAF1E5", line: "#C97A1E", ring: "#C97A1E33", heroGrad: "linear-gradient(135deg, #7A3500 0%, #D4700A 55%, #F5C842 100%)" },
      pedido: { solid: "#6A49DE", text: "#5638C2", soft: "#F0ECFC", line: "#7B5CF0", ring: "#7B5CF033", heroGrad: "linear-gradient(135deg, #1A0A3D 0%, #7B5CF0 55%, #E05C9A 100%)" },
    },
    dark: {
      curso:  { solid: "#4C95F0", text: "#7FB3F5", soft: "#13243C", line: "#4C95F0", ring: "#4C95F040", heroGrad: "linear-gradient(135deg, #0A2A5E 0%, #1A6ED8 55%, #2EC4A0 100%)" },
      clase:  { solid: "#E0992E", text: "#EBB463", soft: "#2A2113", line: "#E0992E", ring: "#E0992E40", heroGrad: "linear-gradient(135deg, #7A3500 0%, #D4700A 55%, #F5C842 100%)" },
      pedido: { solid: "#9B82F2", text: "#B6A4F6", soft: "#1E1A38", line: "#9B82F2", ring: "#9B82F240", heroGrad: "linear-gradient(135deg, #1A0A3D 0%, #7B5CF0 55%, #E05C9A 100%)" },
    },
  };

  // ── Escala tipográfica (consistente — corrige la queja principal) ─────────
  // size, weight, lineHeight, letterSpacing
  const TYPE = {
    eyebrow: { fontSize: 12, fontWeight: 600, lineHeight: 1.2, letterSpacing: ".09em", textTransform: "uppercase" },
    display: { fontSize: 27, fontWeight: 700, lineHeight: 1.18, letterSpacing: "-.02em" },
    h1:      { fontSize: 21, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-.015em" },
    h2:      { fontSize: 16, fontWeight: 700, lineHeight: 1.3,  letterSpacing: "-.01em" },
    cardTitle:{ fontSize: 15.5, fontWeight: 650, lineHeight: 1.35, letterSpacing: "-.005em" },
    body:    { fontSize: 14, fontWeight: 450, lineHeight: 1.55 },
    bodyStrong:{ fontSize: 14, fontWeight: 600, lineHeight: 1.45 },
    meta:    { fontSize: 13, fontWeight: 500, lineHeight: 1.4 },
    micro:   { fontSize: 12, fontWeight: 500, lineHeight: 1.35 },
    price:   { fontSize: 18, fontWeight: 750, lineHeight: 1.1, letterSpacing: "-.01em" },
  };

  const DENSITY = {
    equilibrada: { gap: 16, cardPad: 18, sectionGap: 30, radius: 14 },
    compacta:    { gap: 12, cardPad: 15, sectionGap: 22, radius: 12 },
    amplia:      { gap: 20, cardPad: 22, sectionGap: 38, radius: 16 },
  };

  function build(themeKey, density) {
    const C = { ...THEMES[themeKey === "dark" ? "dark" : "light"] };
    return {
      key: themeKey === "dark" ? "dark" : "light",
      C,
      A: ACCENTS[themeKey === "dark" ? "dark" : "light"],
      ts: TYPE,
      D: DENSITY[density] || DENSITY.equilibrada,
    };
  }

  window.LD = { THEMES, ACCENTS, TYPE, DENSITY, build };
  window.LDContext = React.createContext(build("light", "equilibrada"));
  window.useTheme = () => React.useContext(window.LDContext);
  // helper: aplica un objeto de la escala tipográfica como estilo
  window.tx = (name, extra) => Object.assign({}, window.LD.TYPE[name], extra || {});
})();
