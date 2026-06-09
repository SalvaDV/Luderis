/* Panel de Administración — overlay full-screen (solo rol admin) */
(function () {
  const { useTheme, Icon, UI, tx } = window;
  const { Avatar } = UI;

  // Paleta de estados (consistente en claro/oscuro)
  const SC = { success: "#10B981", warn: "#F59E0B", danger: "#EF4444", purple: "#8B5CF6", info: "#3B82F6", accent: "#1A6ED8" };

  const SIDEBAR_GROUPS = [
    { label: "Plataforma", items: [
      { id: "overview", label: "Dashboard", icon: "layout-dashboard" },
      { id: "verif", label: "Verificaciones", icon: "shield-check", badge: "verif" },
      { id: "pubs", label: "Publicaciones", icon: "book-open" },
    ]},
    { label: "Usuarios", items: [
      { id: "docentes", label: "Docentes", icon: "graduation-cap" },
      { id: "users", label: "Usuarios", icon: "users" },
    ]},
    { label: "Finanzas", items: [
      { id: "payments", label: "Pagos", icon: "credit-card" },
      { id: "escrow", label: "Escrow", icon: "package", badge: "escrow" },
      { id: "retiros", label: "Retiros", icon: "wallet", badge: "retiros" },
      { id: "liquidaciones", label: "Liquidaciones", icon: "file-text" },
    ]},
    { label: "Moderación", items: [
      { id: "reports", label: "Denuncias", icon: "alert-triangle", badge: "reports" },
      { id: "quejas", label: "Quejas", icon: "message-circle" },
      { id: "antipuenteo", label: "Anti-puenteo", icon: "bell-off" },
    ]},
    { label: "Sistema", items: [
      { id: "notifs", label: "Anuncios", icon: "megaphone" },
      { id: "config", label: "Configuración", icon: "settings" },
    ]},
  ];
  const TAB_LABELS = {};
  SIDEBAR_GROUPS.forEach((g) => g.items.forEach((it) => { TAB_LABELS[it.id] = it.label; }));

  function fmt(n) { return "$" + Number(n).toLocaleString("es-AR"); }

  // ── Sidebar oscuro ─────────────────────────────────────────────────────
  function AdminSidebar({ tab, setTab, badges, onExit, open, isMobile }) {
    const SB = "#0F1E3C", SBline = "rgba(255,255,255,.08)", SBtext = "rgba(255,255,255,.65)";
    return React.createElement(React.Fragment, null,
      isMobile && open && React.createElement("div", { onClick: () => setTab(tab, true), style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 99 } }),
      React.createElement("aside", {
        style: { width: 224, background: SB, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: isMobile ? (open ? 0 : -244) : 0, bottom: 0, zIndex: 100, overflowY: "auto", borderRight: `1px solid ${SBline}`, transition: isMobile ? "left .25s ease" : "none" },
      },
        // Logo
        React.createElement("div", { style: { padding: "20px 20px 16px", borderBottom: `1px solid ${SBline}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 } },
          React.createElement("img", { src: "../assets/logo.png", alt: "", style: { width: 28, height: 28, borderRadius: 6 } }),
          React.createElement("div", null,
            React.createElement("div", { style: { color: "#fff", fontWeight: 750, fontSize: 15, letterSpacing: "-.02em" } }, "Luderis"),
            React.createElement("div", { style: { color: SBtext, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" } }, "Admin Panel"))
        ),
        // Grupos
        React.createElement("div", { style: { flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 18 } },
          SIDEBAR_GROUPS.map((group) => React.createElement("div", { key: group.label },
            React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: "1.2px", textTransform: "uppercase", padding: "0 10px", marginBottom: 4 } }, group.label),
            group.items.map((item) => {
              const active = tab === item.id;
              const bc = item.badge ? (badges[item.badge] || 0) : 0;
              return React.createElement(SBItem, { key: item.id, item, active, badgeCount: bc, onClick: () => setTab(item.id), SBtext });
            })
          ))
        ),
        // Footer
        React.createElement("div", { style: { padding: "12px 10px", borderTop: `1px solid ${SBline}`, flexShrink: 0 } },
          React.createElement(SBExit, { onExit, SBtext })
        )
      )
    );
  }

  function SBItem({ item, active, badgeCount, onClick, SBtext }) {
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, background: active ? "rgba(255,255,255,.12)" : h ? "rgba(255,255,255,.06)" : "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "background .15s", marginBottom: 1 },
    },
      React.createElement(Icon, { name: item.icon, size: 15, stroke: active ? 2.4 : 1.8, color: active ? "#fff" : SBtext }),
      React.createElement("span", { style: { flex: 1, fontSize: 13, color: active ? "#fff" : SBtext, fontWeight: active ? 700 : 400, textAlign: "left" } }, item.label),
      badgeCount > 0 && React.createElement("span", { style: { background: "#EF4444", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "1px 6px", minWidth: 18, textAlign: "center" } }, badgeCount),
      active && React.createElement(Icon, { name: "chevron-right", size: 12, color: "rgba(255,255,255,.4)" })
    );
  }

  function SBExit({ onExit, SBtext }) {
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick: onExit, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, background: h ? "rgba(255,255,255,.06)" : "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" },
    }, React.createElement(Icon, { name: "log-out", size: 15, color: SBtext }), React.createElement("span", { style: { fontSize: 13, color: SBtext } }, "Salir del panel"));
  }

  // ── Card genérica ────────────────────────────────────────────────────────
  function ACard({ children, style }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px", ...style } }, children);
  }

  // ── KPI Card ───────────────────────────────────────────────────────────
  function KpiCard({ label, value, sub, trend, trendLabel, color, icon, spark }) {
    const { C } = useTheme();
    const up = trend == null || trend >= 0;
    return React.createElement("div", { style: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12, boxShadow: C.shadow } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
        React.createElement("div", { style: { width: 38, height: 38, borderRadius: 10, background: color + "1F", display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: icon, size: 18, stroke: 2, color })),
        trend != null && React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: up ? SC.success : SC.danger, background: (up ? SC.success : SC.danger) + "1A", padding: "3px 8px", borderRadius: 20 } },
          React.createElement(Icon, { name: up ? "trending-up" : "trending-down", size: 11 }), `${up ? "+" : ""}${trend}%`)
      ),
      React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: "-.02em" } }, value),
        React.createElement("div", { style: { fontSize: 13, color: C.muted, marginTop: 5 } }, label)
      ),
      spark && React.createElement(Sparkline, { data: spark, color }),
      (sub || trendLabel) && React.createElement("div", { style: { fontSize: 11.5, color: C.faint } }, sub || trendLabel)
    );
  }

  function Sparkline({ data, color }) {
    const w = 200, h = 34, max = Math.max(...data), min = Math.min(...data);
    const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / (max - min || 1)) * (h - 4) - 2]);
    const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L${w} ${h} L0 ${h} Z`;
    const gid = "sg" + Math.random().toString(36).slice(2, 7);
    return React.createElement("svg", { width: "100%", height: h, viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none", style: { display: "block" } },
      React.createElement("defs", null, React.createElement("linearGradient", { id: gid, x1: "0", y1: "0", x2: "0", y2: "1" },
        React.createElement("stop", { offset: "0%", stopColor: color, stopOpacity: .3 }),
        React.createElement("stop", { offset: "100%", stopColor: color, stopOpacity: 0 }))),
      React.createElement("path", { d: area, fill: `url(#${gid})` }),
      React.createElement("path", { d: line, fill: "none", stroke: color, strokeWidth: 1.5 })
    );
  }

  window.AdminUI = { SIDEBAR_GROUPS, TAB_LABELS, AdminSidebar, ACard, KpiCard, Sparkline, SC, fmt };
})();
