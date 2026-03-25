/**
 * theme.js — sistema de tokens de diseño
 *
 * Reemplaza el anti-patrón del objeto C global mutable (Object.assign).
 * Uso: consumir via ThemeContext en React, no importar directamente.
 *
 * Los tokens siguen nomenclatura semántica (no literal):
 * - bg: fondo de página
 * - surface: fondo de componente (card, modal)
 * - elevated: superficie elevada sobre surface
 * - border: color de borde default
 * - text: texto primario
 * - muted: texto secundario/placeholder
 * - accent: color de acción principal
 * - accentFg: texto sobre accent (siempre blanco en ambos temas)
 */

export const themes = {
  light: {
    // Fondos
    bg:        "#F3F2EF",
    surface:   "#FFFFFF",
    elevated:  "#FFFFFF",
    card:      "#FFFFFF",

    // Bordes
    border:    "#E0DED8",
    borderHover: "#C8C6BE",

    // Texto
    text:      "#191919",
    muted:     "#666666",
    placeholder: "#9CA3AF",

    // Accent (azul LinkedIn)
    accent:    "#0A66C2",
    accentDim: "#0A66C212",
    accentFg:  "#FFFFFF",

    // Semánticos
    success:   "#057642",
    successBg: "#05764212",
    danger:    "#CC1016",
    dangerBg:  "#CC101612",
    warn:      "#B24020",
    warnBg:    "#B2402012",
    info:      "#0A66C2",
    infoBg:    "#0A66C212",
    purple:    "#7B3FBE",
    purpleBg:  "#7B3FBE12",

    // Layout
    sidebar:   "#FFFFFF",
    sidebarBorder: "#E0DED8",

    // Input
    inputBg:   "#F8F8F6",
    inputBorder: "#D1CFC8",
    inputFocus: "#0A66C2",
  },

  dark: {
    // Fondos
    bg:        "#0D0D0D",
    surface:   "#111111",
    elevated:  "#181818",
    card:      "#181818",

    // Bordes
    border:    "#242424",
    borderHover: "#3A3A3A",

    // Texto
    text:      "#F0EDE6",
    muted:     "#666666",
    placeholder: "#4A4A4A",

    // Accent (amarillo dorado en dark)
    accent:    "#F5C842",
    accentDim: "#F5C84215",
    accentFg:  "#0D0D0D",

    // Semánticos
    success:   "#4ECB71",
    successBg: "#4ECB7115",
    danger:    "#E05C5C",
    dangerBg:  "#E05C5C15",
    warn:      "#E0955C",
    warnBg:    "#E0955C15",
    info:      "#5CA8E0",
    infoBg:    "#5CA8E015",
    purple:    "#C85CE0",
    purpleBg:  "#C85CE015",

    // Layout
    sidebar:   "#0A0A0A",
    sidebarBorder: "#242424",

    // Input
    inputBg:   "#1A1A1A",
    inputBorder: "#333333",
    inputFocus: "#F5C842",
  },
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
};

export const radius = {
  sm:  4,
  md:  8,
  lg:  12,
  xl:  16,
  full: 9999,
};

export const typography = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  sizes: {
    xs:   10,
    sm:   11,
    base: 13,
    md:   14,
    lg:   16,
    xl:   18,
    xxl:  22,
    hero: 28,
  },
  weights: {
    regular: 400,
    medium:  500,
    semibold: 600,
    bold:    700,
  },
};

/**
 * Genera el objeto de estilos base de input según el tema activo.
 * Usar en lugar de hardcodear background:#1a1a1a en cada componente.
 */
export const inputStyle = (theme, overrides = {}) => ({
  width: "100%",
  background: theme.inputBg,
  border: `1px solid ${theme.inputBorder}`,
  borderRadius: radius.md,
  padding: "9px 12px",
  color: theme.text,
  fontSize: typography.sizes.base,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: typography.fontFamily,
  transition: "border-color .15s, box-shadow .15s",
  ...overrides,
});

export const buttonStyles = {
  primary: (theme) => ({
    background: theme.accent,
    color: theme.accentFg,
    border: "none",
    borderRadius: radius.full,
    padding: "8px 20px",
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.md,
    cursor: "pointer",
    fontFamily: typography.fontFamily,
    transition: "opacity .15s, transform .1s",
  }),
  ghost: (theme) => ({
    background: "transparent",
    color: theme.accent,
    border: `1px solid ${theme.accent}`,
    borderRadius: radius.full,
    padding: "8px 20px",
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.md,
    cursor: "pointer",
    fontFamily: typography.fontFamily,
    transition: "background .15s, color .15s",
  }),
  danger: (theme) => ({
    background: theme.danger,
    color: "#fff",
    border: "none",
    borderRadius: radius.full,
    padding: "8px 20px",
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.md,
    cursor: "pointer",
    fontFamily: typography.fontFamily,
  }),
};
