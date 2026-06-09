/* Kit compartido para páginas internas — encabezado, segmented, stat, empty, rol badge */
(function () {
  const { useTheme, Icon, UI, tx } = window;
  const { Avatar } = UI;

  // Encabezado de página estandarizado (corrige inconsistencia de títulos)
  function PageTitle({ title, sub, action }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 22, flexWrap: "wrap" } },
      React.createElement("div", null,
        React.createElement("h1", { style: tx("display", { color: C.text, margin: 0, whiteSpace: "nowrap" }) }, title),
        sub && React.createElement("p", { style: { ...tx("body"), color: C.muted, margin: "6px 0 0" } }, sub)
      ),
      action
    );
  }

  // Segmented filter (reutiliza estilo del Explore)
  function Segmented({ value, onChange, options, accentKey = "curso" }) {
    const { C, A } = useTheme();
    const ac = A[accentKey];
    return React.createElement("div", {
      role: "tablist",
      style: { display: "inline-flex", gap: 4, padding: 4, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 11, width: "fit-content", maxWidth: "100%", flexWrap: "nowrap", overflowX: "auto" },
    },
      options.map((o) => {
        const active = value === o.id;
        return React.createElement("button", {
          key: o.id, role: "tab", "aria-selected": active, onClick: () => onChange(o.id),
          style: {
            display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
            border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
            background: active ? C.surface : "transparent", color: active ? ac.text : C.muted,
            boxShadow: active ? C.shadow : "none", transition: "color .16s", whiteSpace: "nowrap",
          },
        },
          o.icon && React.createElement(Icon, { name: o.icon, size: 15, stroke: 2 }),
          o.label,
          o.count != null && React.createElement("span", { style: { fontSize: 11.5, fontWeight: 700, color: active ? ac.text : C.faint, background: active ? ac.soft : C.surface, borderRadius: 7, padding: "1px 7px", border: active ? "none" : `1px solid ${C.border}` } }, o.count)
        );
      })
    );
  }

  function StatCard({ icon, label, value, accentKey = "curso", suffix }) {
    const { C, A } = useTheme();
    const ac = A[accentKey];
    return React.createElement("div", {
      style: { flex: 1, minWidth: 130, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", boxShadow: C.shadow },
    },
      React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: ac.soft, color: ac.solid, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 } },
        React.createElement(Icon, { name: icon, size: 19, stroke: 2 })),
      React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 4 } },
        React.createElement("span", { style: { fontSize: 26, fontWeight: 750, color: C.text, letterSpacing: "-.02em", lineHeight: 1 } }, value),
        suffix && React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: C.faint } }, suffix)
      ),
      React.createElement("div", { style: { fontSize: 13, color: C.muted, marginTop: 5, fontWeight: 500 } }, label)
    );
  }

  function RolBadge({ rol }) {
    const { C, A } = useTheme();
    const docente = rol === "docente";
    const ac = docente ? A.clase : A.curso;
    return React.createElement("span", {
      style: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 650, color: ac.text, background: ac.soft, borderRadius: 7, padding: "3px 8px", whiteSpace: "nowrap", flexShrink: 0 },
    },
      React.createElement(Icon, { name: docente ? "graduation-cap" : "user", size: 12, stroke: 2 }),
      docente ? "Doy esta clase" : "Soy alumno"
    );
  }

  function EmptyState({ icon = "search", title, sub, cta, onCta }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { textAlign: "center", padding: "64px 20px" } },
      React.createElement("div", { style: { width: 64, height: 64, borderRadius: 18, background: C.surfaceAlt, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.faint } },
        React.createElement(Icon, { name: icon, size: 28 })),
      React.createElement("h3", { style: tx("h1", { color: C.text, margin: "0 0 6px" }) }, title),
      sub && React.createElement("p", { style: { ...tx("body"), color: C.muted, margin: "0 auto 18px", maxWidth: 340 } }, sub),
      cta && React.createElement(UI.PrimaryBtn, { onClick: onCta }, cta)
    );
  }

  // Modalidad chip pequeño
  function ModChip({ modalidad }) {
    const { C } = useTheme();
    const m = { virtual: ["monitor", "Virtual"], presencial: ["map-pin", "Presencial"], mixto: ["swap", "Mixto"] }[modalidad] || ["monitor", "Virtual"];
    return React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: C.muted, fontWeight: 500 } },
      React.createElement(Icon, { name: m[0], size: 13 }), m[1]);
  }

  // Card genérica con padding del sistema
  function Card({ children, pad = 18, style }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: pad, boxShadow: C.shadow, ...style } }, children);
  }

  window.PageKit = { PageTitle, Segmented, StatCard, RolBadge, EmptyState, ModChip, Card };
})();
