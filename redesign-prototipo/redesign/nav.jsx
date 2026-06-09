/* Navegación — Sidebar fija (desktop) + Top bar + Bottom nav (mobile) */
(function () {
  const { useTheme, Icon, UI } = window;
  const { Avatar, IconBtn, PrimaryBtn } = UI;

  const NAV = [
    { id: "explore", icon: "search", label: "Inicio" },
    { id: "agenda", icon: "calendar", label: "Mi agenda" },
    { id: "chats", icon: "message-circle", label: "Mis chats", badge: 3 },
    { id: "favoritos", icon: "bookmark", label: "Favoritos" },
    { id: "inscripciones", icon: "graduation-cap", label: "Mis clases", badge: 1 },
    { id: "juegos", icon: "lightbulb", label: "Juegos", dot: true },
    { id: "cuenta", icon: "user", label: "Mi cuenta" },
  ];
  // mobile muestra 5 destinos clave
  const MOBILE_NAV = ["explore", "agenda", "chats", "inscripciones", "cuenta"];

  function Wordmark({ small }) {
    const { C } = useTheme();
    return React.createElement("button", { onClick: () => window.__ldNav && window.__ldNav("explore"), "aria-label": "Ir a Inicio", style: { display: "flex", alignItems: "center", gap: 9, background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" } },
      React.createElement("img", { src: "../assets/logo.png", alt: "", style: { width: small ? 26 : 30, height: small ? 26 : 30, borderRadius: 8 } }),
      React.createElement("span", { style: { fontSize: small ? 17 : 19, fontWeight: 750, color: C.text, letterSpacing: "-.02em" } }, "Luderis")
    );
  }

  function NavItem({ item, active, onClick }) {
    const { C, A } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      "aria-current": active ? "page" : undefined,
      style: {
        position: "relative", width: "100%", display: "flex", alignItems: "center", gap: 11,
        padding: "10px 13px", borderRadius: 10, border: "none", cursor: "pointer",
        background: active ? A.curso.soft : h ? C.surfaceAlt : "transparent",
        color: active ? A.curso.text : C.textSoft,
        fontWeight: active ? 650 : 500, fontSize: 14, fontFamily: "inherit", textAlign: "left",
        transition: "background .14s, color .14s", marginBottom: 2,
      },
    },
      active && React.createElement("span", {
        style: { position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, borderRadius: 3, background: A.curso.solid },
      }),
      React.createElement(Icon, { name: item.icon, size: 19, stroke: active ? 2.1 : 1.8 }),
      React.createElement("span", { style: { flex: 1 } }, item.label),
      item.badge > 0 && !item.dot && React.createElement("span", {
        style: { background: "#E5484D", color: "#fff", borderRadius: 9, fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, padding: "0 5px", display: "flex", alignItems: "center", justifyContent: "center" },
      }, item.badge),
      item.dot && React.createElement("span", { style: { width: 7, height: 7, borderRadius: "50%", background: "#E5484D" } })
    );
  }

  function Sidebar({ page, setPage, theme, onToggleTheme }) {
    const { C } = useTheme();
    return React.createElement("aside", {
      style: {
        position: "fixed", left: 0, top: 0, bottom: 0, width: 252, zIndex: 30,
        background: C.surface, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", fontFamily: "inherit",
      },
    },
      React.createElement("div", { style: { padding: "20px 20px 16px" } }, React.createElement(Wordmark, null)),
      React.createElement("div", { style: { padding: "0 16px 14px" } },
        React.createElement(PrimaryBtn, { full: true, icon: "plus", onClick: () => window.__ldPublish && window.__ldPublish() }, "Publicar")
      ),
      React.createElement("nav", { style: { flex: 1, overflowY: "auto", padding: "4px 12px" } },
        NAV.map((it) => React.createElement(NavItem, { key: it.id, item: it, active: page === it.id, onClick: () => setPage(it.id) }))
      ),
      // pie: usuario + acciones
      React.createElement("div", { style: { padding: "12px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 } },
        React.createElement(AdminBtn, null),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "6px 6px" } },
          React.createElement(Avatar, { name: "Vos", size: 36 }),
          React.createElement("div", { style: { minWidth: 0, flex: 1 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 650, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, "Camila Sánchez"),
            React.createElement("div", { style: { fontSize: 11.5, color: C.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, "camila@email.com")
          )
        ),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement(SmallBtn, { icon: theme === "light" ? "moon" : "sun", label: theme === "light" ? "Oscuro" : "Claro", onClick: onToggleTheme }),
          React.createElement(SmallBtn, { icon: "log-out", label: "Salir", onClick: () => window.__ldToast && window.__ldToast("Sesión cerrada", "info") })
        )
      )
    );
  }

  function AdminBtn() {
    const { C } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick: () => window.__ldAdmin && window.__ldAdmin(),
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 11px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
        border: `1px solid ${h ? "#8B5CF6" : C.border}`,
        background: h ? "rgba(139,92,246,.10)" : C.surfaceAlt,
        color: h ? "#8B5CF6" : C.textSoft, transition: "all .14s",
      },
    },
      React.createElement("span", { style: { width: 26, height: 26, borderRadius: 7, background: "#8B5CF61F", color: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
        React.createElement(Icon, { name: "shield-check", size: 15 })),
      React.createElement("div", { style: { flex: 1, textAlign: "left", minWidth: 0 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 650, color: h ? "#8B5CF6" : C.text } }, "Panel de admin"),
        React.createElement("div", { style: { fontSize: 11, color: C.faint } }, "Solo administradores")),
      React.createElement(Icon, { name: "chevron-right", size: 15, color: C.faint })
    );
  }

  function SmallBtn({ icon, label, onClick }) {
    const { C } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "8px", borderRadius: 9, border: `1px solid ${h ? C.borderStrong : C.border}`,
        background: h ? C.surfaceAlt : "transparent", color: C.muted, fontSize: 12.5, fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit", transition: "all .14s",
      },
    }, React.createElement(Icon, { name: icon, size: 15 }), label);
  }

  // ── Top bar — sticky, minimal ────────────────────────────────────────────
  function TopBar({ isMobile, onNotif, notifCount }) {
    const { C } = useTheme();
    return React.createElement("header", {
      style: {
        position: "sticky", top: 0, zIndex: 20, height: 60,
        background: C.key === "dark" ? "rgba(17,28,46,.82)" : "rgba(255,255,255,.82)",
        backdropFilter: "saturate(180%) blur(12px)",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "0 16px" : "0 28px", gap: 12,
      },
    },
      isMobile
        ? React.createElement(Wordmark, { small: true })
        : React.createElement("div", { style: { fontSize: 14, color: C.key === "dark" ? "#FFFFFF" : C.muted, fontWeight: 500, whiteSpace: "nowrap" } },
            "Buen día, ", React.createElement("span", { style: { color: C.text, fontWeight: 750 } }, "Camila"), " 👋"),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
        React.createElement(IconBtn, { icon: "bell", label: "Notificaciones", badge: notifCount != null ? notifCount : 2, onClick: onNotif }),
        React.createElement("button", { onClick: () => window.__ldNav && window.__ldNav("cuenta"), "aria-label": "Mi cuenta", style: { border: "none", background: "transparent", padding: 0, cursor: "pointer", borderRadius: "50%" } }, React.createElement(Avatar, { name: "Camila", size: 40 }))
      )
    );
  }

  // ── Bottom nav (mobile) — fija, estable ──────────────────────────────────
  function BottomNav({ page, setPage }) {
    const { C, A } = useTheme();
    const items = MOBILE_NAV.map((id) => NAV.find((n) => n.id === id));
    return React.createElement("nav", {
      style: {
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40, height: 64,
        background: C.key === "dark" ? "rgba(17,28,46,.94)" : "rgba(255,255,255,.94)",
        backdropFilter: "blur(12px)", borderTop: `1px solid ${C.border}`,
        display: "flex", paddingBottom: "env(safe-area-inset-bottom,0)",
      },
    },
      items.map((it) => {
        const active = page === it.id;
        return React.createElement("button", {
          key: it.id, onClick: () => setPage(it.id),
          style: {
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 3, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit",
            color: active ? A.curso.solid : C.muted, position: "relative", minHeight: 44,
          },
        },
          React.createElement("span", { style: { position: "relative" } },
            React.createElement(Icon, { name: it.icon, size: 22, stroke: active ? 2.2 : 1.8 }),
            it.badge > 0 && React.createElement("span", { style: { position: "absolute", top: -3, right: -6, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 8, background: "#E5484D", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" } }, it.badge)
          ),
          React.createElement("span", { style: { fontSize: 11, fontWeight: active ? 650 : 500 } }, it.label)
        );
      })
    );
  }

  // FAB de publicar para mobile
  function PublishFab({ onClick }) {
    const { A } = useTheme();
    return React.createElement("button", {
      onClick,
      "aria-label": "Publicar",
      style: {
        position: "fixed", right: 18, bottom: 80, zIndex: 41, width: 56, height: 56, borderRadius: 18,
        border: "none", cursor: "pointer", color: "#fff", background: "linear-gradient(135deg,#1A6ED8,#0F9C82)",
        boxShadow: "0 8px 22px rgba(26,110,216,.4)", display: "flex", alignItems: "center", justifyContent: "center",
      },
    }, React.createElement(Icon, { name: "plus", size: 26, stroke: 2.4 }));
  }

  window.NavUI = { Sidebar, TopBar, BottomNav, PublishFab, Wordmark, NAV };
})();
