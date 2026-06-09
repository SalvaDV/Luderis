/* Primitivas de UI refinadas — Avatar, Stars, Pill, Badge, botones, tabs */
(function () {
  const { useTheme, Icon } = window;

  const AVATAR_COLORS = [
    ["#1A6ED8", "#EAF2FC"], ["#0F9C82", "#E6F6F1"], ["#B96A12", "#FAF1E5"],
    ["#6A49DE", "#F0ECFC"], ["#C0397B", "#FBEAF2"], ["#3E7C59", "#EAF4EE"],
  ];
  function Avatar({ name = "?", size = 38, img }) {
    const { C } = useTheme();
    const letter = (name || "?").trim()[0]?.toUpperCase() || "?";
    const code = letter.charCodeAt(0) || 63;
    const [fg, bg] = AVATAR_COLORS[code % AVATAR_COLORS.length];
    if (img) {
      return React.createElement("img", {
        src: img, alt: name,
        style: { width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `1px solid ${C.border}` },
      });
    }
    return React.createElement("div", {
      style: {
        width: size, height: size, borderRadius: "50%", background: bg, color: fg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: size * 0.42, flexShrink: 0, userSelect: "none",
      },
    }, letter);
  }

  function Stars({ value, count, size = 13 }) {
    const { C, A } = useTheme();
    if (!value) return null;
    return React.createElement("span", {
      style: { display: "inline-flex", alignItems: "center", gap: 4, lineHeight: 1 },
    },
      React.createElement(Icon, { name: "star", size, color: "#F2A33A", stroke: 0, style: { fill: "#F2A33A" } }),
      React.createElement("span", { style: { fontSize: size, fontWeight: 700, color: C.text } }, value.toFixed(1)),
      count != null && React.createElement("span", { style: { fontSize: size - 1, color: C.faint, fontWeight: 500 } }, `(${count})`)
    );
  }

  // Pill sobrio: icono de línea + texto, borde sutil
  function Pill({ icon, label, tone = "neutral", accent }) {
    const { C, A } = useTheme();
    let color = C.muted, bg = C.surfaceAlt, border = C.border;
    if (tone === "accent" && accent) { color = accent.text; bg = accent.soft; border = "transparent"; }
    if (tone === "success") { color = C.teal; bg = C.key === "dark" ? "#10271F" : "#E7F6F1"; border = "transparent"; }
    return React.createElement("span", {
      style: {
        display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
        color, background: bg, border: `1px solid ${border}`, borderRadius: 7, padding: "4px 9px",
        lineHeight: 1.2, whiteSpace: "nowrap", flexShrink: 0,
      },
    },
      icon && React.createElement(Icon, { name: icon, size: 13, stroke: 2 }),
      label
    );
  }

  function VerifiedBadge({ size = 14 }) {
    const { A } = useTheme();
    return React.createElement("span", {
      title: "Docente verificado",
      style: { display: "inline-flex", color: A.curso.solid, flexShrink: 0 },
    }, React.createElement(Icon, { name: "badge-check", size, stroke: 2 }));
  }

  // Botón ícono redondo (top bar / acciones)
  function IconBtn({ icon, label, onClick, badge, size = 40 }) {
    const { C } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick, "aria-label": label, title: label,
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        position: "relative", width: size, height: size, borderRadius: 10,
        border: `1px solid ${h ? C.borderStrong : C.border}`, background: h ? C.surfaceAlt : C.surface,
        color: C.textSoft, cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", transition: "all .15s", flexShrink: 0,
      },
    },
      React.createElement(Icon, { name: icon, size: 19 }),
      badge > 0 && React.createElement("span", {
        style: {
          position: "absolute", top: -4, right: -4, minWidth: 17, height: 17, padding: "0 4px",
          borderRadius: 9, background: "#E5484D", color: "#fff", fontSize: 10, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.surface}`,
        },
      }, badge > 9 ? "9+" : badge)
    );
  }

  // Botón primario con leve gradiente de marca (único uso de gradiente fuerte)
  function PrimaryBtn({ children, onClick, icon, full, size = "md" }) {
    const { A } = useTheme();
    const [h, setH] = React.useState(false);
    const pad = size === "sm" ? "8px 14px" : size === "lg" ? "13px 22px" : "10px 18px";
    const fs = size === "sm" ? 13 : 14;
    return React.createElement("button", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        width: full ? "100%" : undefined, padding: pad, fontSize: fs, fontWeight: 650,
        color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
        background: "linear-gradient(135deg,#1A6ED8,#0F9C82)",
        boxShadow: h ? "0 6px 18px rgba(26,110,216,.32)" : "0 2px 8px rgba(26,110,216,.22)",
        transform: h ? "translateY(-1px)" : "none", transition: "all .16s", fontFamily: "inherit",
      },
    },
      icon && React.createElement(Icon, { name: icon, size: 17, stroke: 2.2 }),
      children
    );
  }

  window.UI = { Avatar, Stars, Pill, VerifiedBadge, IconBtn, PrimaryBtn, AVATAR_COLORS };
})();
