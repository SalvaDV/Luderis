/* Notificaciones — panel lateral deslizable desde la campana */
(function () {
  const { useTheme, Icon, UI, tx } = window;

  function NotifPanel({ open, onClose }) {
    const { C, A } = useTheme();
    const TIPOS = window.LUDERIS.NOTIF_TIPOS;
    const [tab, setTab] = React.useState("todas");
    const [notifs, setNotifs] = React.useState(window.LUDERIS.NOTIFICACIONES);
    if (!open) return null;

    const sinLeer = notifs.filter((n) => !n.leida).length;
    const filtradas = notifs.filter((n) => tab === "noLeidas" ? !n.leida : true);
    const ORDEN = ["Hoy", "Ayer", "Esta semana", "Anteriores"];
    const grupos = ORDEN.map((g) => ({ label: g, items: filtradas.filter((n) => n.grupo === g) })).filter((g) => g.items.length);
    const marcarTodo = () => setNotifs((p) => p.map((n) => ({ ...n, leida: true })));
    const markOne = (id) => setNotifs((p) => p.map((n) => n.id === id ? { ...n, leida: true } : n));

    return React.createElement(React.Fragment, null,
      React.createElement("div", { onClick: onClose, style: { position: "fixed", inset: 0, background: C.overlay, zIndex: 70, animation: "ldFade .15s ease" } }),
      React.createElement("div", {
        className: "ld-filter-drawer",
        style: { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(400px,96vw)", background: C.surface, zIndex: 71, boxShadow: "-8px 0 32px rgba(0,0,0,.18)", display: "flex", flexDirection: "column", fontFamily: "inherit" },
      },
        // Header
        React.createElement("div", { style: { padding: "18px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 } },
          React.createElement("div", null,
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
              React.createElement(Icon, { name: "bell", size: 18, color: C.text }),
              React.createElement("span", { style: tx("h1", { color: C.text }) }, "Notificaciones")),
            sinLeer > 0 && React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginTop: 3 } }, `${sinLeer} sin leer`)),
          React.createElement("button", { onClick: onClose, "aria-label": "Cerrar", style: { width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: "x", size: 18 }))
        ),
        // Tabs + marcar todo
        React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 } },
          React.createElement("div", { style: { display: "flex" } },
            [["todas", "Todas"], ["noLeidas", "Sin leer"]].map(([id, label]) => React.createElement("button", {
              key: id, onClick: () => setTab(id),
              style: { position: "relative", padding: "13px 14px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: tab === id ? 700 : 500, color: tab === id ? A.curso.text : C.muted },
            }, label, id === "noLeidas" && sinLeer > 0 ? ` (${sinLeer})` : "",
              tab === id && React.createElement("span", { style: { position: "absolute", left: 10, right: 10, bottom: -1, height: 2.5, borderRadius: 3, background: A.curso.solid } }))
            )),
          sinLeer > 0 && React.createElement("button", { onClick: marcarTodo, style: { border: "none", background: "transparent", color: A.curso.text, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "8px 6px", whiteSpace: "nowrap", flexShrink: 0 } }, "Marcar leídas")
        ),
        // Lista agrupada
        React.createElement("div", { style: { flex: 1, overflowY: "auto" } },
          grupos.length === 0
            ? React.createElement("div", { style: { textAlign: "center", padding: "60px 24px", color: C.muted } },
                React.createElement("div", { style: { marginBottom: 12, display: "flex", justifyContent: "center", color: C.faint } }, React.createElement(Icon, { name: "bell", size: 40, stroke: 1.5 })),
                React.createElement("div", { style: { fontSize: 14 } }, tab === "noLeidas" ? "Todo leído ✓" : "Sin notificaciones aún"))
            : grupos.map((g) => React.createElement("div", { key: g.label },
                React.createElement("div", { style: { padding: "9px 20px 5px", background: C.surfaceAlt, borderBottom: `1px solid ${C.hairline}`, position: "sticky", top: 0, zIndex: 1 } },
                  React.createElement("span", { style: { ...tx("eyebrow"), color: C.faint } }, g.label)),
                g.items.map((n) => React.createElement(NotifRow, { key: n.id, n, tipo: TIPOS[n.tipo], onClick: () => markOne(n.id) }))
              ))
        ),
        React.createElement("div", { style: { padding: 14, borderTop: `1px solid ${C.border}`, flexShrink: 0 } },
          React.createElement("button", { onClick: () => { onClose(); window.__ldNav("notificaciones"); }, style: { width: "100%", padding: "11px", borderRadius: 11, border: `1px solid ${C.border}`, background: "transparent", color: C.textSoft, fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, cursor: "pointer" } }, "Ver todas las notificaciones")
        )
      )
    );
  }

  function NotifRow({ n, tipo, onClick }) {
    const { C, A } = useTheme();
    const ac = A[tipo.accent];
    const [h, setH] = React.useState(false);
    return React.createElement("div", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { padding: "14px 20px", borderBottom: `1px solid ${C.hairline}`, cursor: "pointer", background: n.leida ? (h ? C.surfaceAlt : "transparent") : (h ? C.surfaceAlt : ac.soft), display: "flex", gap: 12, alignItems: "flex-start", transition: "background .12s" },
    },
      React.createElement("div", { style: { width: 40, height: 40, borderRadius: 11, background: ac.soft, color: ac.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
        React.createElement(Icon, { name: tipo.icon, size: 18, stroke: 1.9, style: tipo.icon === "star" ? { fill: ac.solid } : undefined, ...(tipo.icon === "star" ? { stroke: 0 } : {}) })),
      React.createElement("div", { style: { flex: 1, minWidth: 0 } },
        React.createElement("div", { style: { fontSize: 12, fontWeight: 650, color: ac.text, marginBottom: 3 } }, tipo.label),
        React.createElement("div", { style: { fontSize: 13.5, color: C.text, lineHeight: 1.45, fontWeight: n.leida ? 450 : 600 } }, n.titulo),
        React.createElement("div", { style: { fontSize: 11.5, color: C.faint, marginTop: 5 } }, n.hace)),
      !n.leida && React.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: ac.solid, flexShrink: 0, marginTop: 5 } })
    );
  }

  // Página completa de notificaciones (desde la barra inferior / "ver todas")
  function NotifPage() {
    const { C, A } = useTheme();
    const TIPOS = window.LUDERIS.NOTIF_TIPOS;
    const [tab, setTab] = React.useState("todas");
    const [notifs, setNotifs] = React.useState(window.LUDERIS.NOTIFICACIONES);
    const sinLeer = notifs.filter((n) => !n.leida).length;
    const filtradas = notifs.filter((n) => tab === "noLeidas" ? !n.leida : true);
    const ORDEN = ["Hoy", "Ayer", "Esta semana", "Anteriores"];
    const grupos = ORDEN.map((g) => ({ label: g, items: filtradas.filter((n) => n.grupo === g) })).filter((g) => g.items.length);
    const markOne = (id) => setNotifs((p) => p.map((n) => n.id === id ? { ...n, leida: true } : n));

    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" } },
        React.createElement("h1", { style: tx("display", { color: C.text, margin: 0 }) }, "Notificaciones"),
        sinLeer > 0 && React.createElement("button", { onClick: () => setNotifs((p) => p.map((n) => ({ ...n, leida: true }))), style: { display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.textSoft, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 10, padding: "9px 14px" } }, React.createElement(Icon, { name: "check", size: 15, stroke: 2.2 }), "Marcar todo leído")
      ),
      React.createElement("div", { style: { display: "inline-flex", gap: 4, padding: 4, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 22 } },
        [["todas", "Todas"], ["noLeidas", `Sin leer${sinLeer ? ` (${sinLeer})` : ""}`]].map(([id, label]) => React.createElement("button", {
          key: id, onClick: () => setTab(id),
          style: { padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 650, background: tab === id ? C.surface : "transparent", color: tab === id ? A.curso.text : C.muted, boxShadow: tab === id ? C.shadow : "none" },
        }, label))
      ),
      React.createElement("div", { style: { maxWidth: 680 } },
        grupos.length === 0
          ? React.createElement(window.PageKit.EmptyState, { icon: "bell", title: tab === "noLeidas" ? "Todo leído" : "Sin notificaciones", sub: "Cuando pase algo importante, lo vas a ver acá." })
          : grupos.map((g) => React.createElement("div", { key: g.label, style: { marginBottom: 24 } },
              React.createElement("div", { style: { ...tx("eyebrow"), color: C.faint, marginBottom: 10 } }, g.label),
              React.createElement(window.PageKit.Card, { pad: 0 },
                g.items.map((n, i) => React.createElement(NotifRowFull, { key: n.id, n, tipo: TIPOS[n.tipo], last: i === g.items.length - 1, onClick: () => markOne(n.id) }))
              )
            ))
      )
    );
  }

  function NotifRowFull({ n, tipo, last, onClick }) {
    const { C, A } = useTheme();
    const ac = A[tipo.accent];
    const [h, setH] = React.useState(false);
    return React.createElement("div", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { padding: "16px 18px", borderBottom: last ? "none" : `1px solid ${C.hairline}`, cursor: "pointer", background: n.leida ? (h ? C.surfaceAlt : "transparent") : (h ? C.surfaceAlt : ac.soft), display: "flex", gap: 13, alignItems: "flex-start" },
    },
      React.createElement("div", { style: { width: 42, height: 42, borderRadius: 11, background: ac.soft, color: ac.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
        React.createElement(Icon, { name: tipo.icon, size: 19, stroke: tipo.icon === "star" ? 0 : 1.9, style: tipo.icon === "star" ? { fill: ac.solid } : undefined })),
      React.createElement("div", { style: { flex: 1, minWidth: 0 } },
        React.createElement("div", { style: { fontSize: 12.5, fontWeight: 650, color: ac.text, marginBottom: 3 } }, tipo.label),
        React.createElement("div", { style: { fontSize: 14, color: C.text, lineHeight: 1.45, fontWeight: n.leida ? 450 : 600 } }, n.titulo),
        React.createElement("div", { style: { fontSize: 12, color: C.faint, marginTop: 5 } }, n.hace)),
      !n.leida && React.createElement("div", { style: { width: 9, height: 9, borderRadius: "50%", background: ac.solid, flexShrink: 0, marginTop: 6 } })
    );
  }

  window.NotifUI = { NotifPanel, NotifPage };
})();
