/* Explore — Hero sobrio, tabs de sección, buscador, categorías, accesos rápidos */
(function () {
  const { useTheme, Icon, tx } = window;

  const SECTIONS = [
    { id: "cursos", label: "Cursos", icon: "graduation-cap", accent: "curso" },
    { id: "clases", label: "Clases", icon: "user", accent: "clase" },
    { id: "pedidos", label: "Pedidos", icon: "megaphone", accent: "pedido" },
  ];

  // ── Segmented control de secciones ───────────────────────────────────────
  function SegTabs({ value, onChange }) {
    const { C, A } = useTheme();
    return React.createElement("div", {
      role: "tablist",
      style: {
        display: "inline-flex", gap: 4, padding: 4, background: "rgba(255,255,255,.16)",
        border: "1px solid rgba(255,255,255,.22)", borderRadius: 12, width: "fit-content",
        backdropFilter: "blur(6px)",
      },
    },
      SECTIONS.map((s) => {
        const active = value === s.id;
        const ac = A[s.accent];
        return React.createElement("button", {
          key: s.id, role: "tab", "aria-selected": active, onClick: () => onChange(s.id),
          style: {
            display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9,
            border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 650,
            background: active ? "#fff" : "transparent",
            color: active ? ac.text : "rgba(255,255,255,.88)",
            boxShadow: active ? "0 2px 8px rgba(0,0,0,.15)" : "none", transition: "all .16s",
          },
        },
          React.createElement(Icon, { name: s.icon, size: 16, stroke: 2 }),
          s.label
        );
      })
    );
  }

  // ── Buscador con IA ──────────────────────────────────────────────────────
  function SearchBar({ value, onChange, onClear, placeholder }) {
    const { C, A } = useTheme();
    const [focus, setFocus] = React.useState(false);
    return React.createElement("div", {
      style: {
        display: "flex", alignItems: "center", gap: 10, background: C.surface,
        border: `1.5px solid ${focus ? A.curso.solid : C.borderStrong}`,
        boxShadow: focus ? `0 0 0 4px ${A.curso.ring}` : C.shadow,
        borderRadius: 13, padding: "5px 6px 5px 16px", transition: "all .16s",
      },
    },
      React.createElement(Icon, { name: "search", size: 19, color: C.faint }),
      React.createElement("input", {
        value, onChange: (e) => onChange(e.target.value),
        onFocus: () => setFocus(true), onBlur: () => setFocus(false),
        placeholder: placeholder || "Buscá una materia, tema o docente…",
        style: {
          flex: 1, border: "none", outline: "none", background: "transparent",
          fontFamily: "inherit", fontSize: 15, color: C.text, padding: "9px 0", minWidth: 0,
        },
      }),
      value
        ? React.createElement("button", {
            onClick: onClear, "aria-label": "Limpiar",
            style: { border: "none", background: "transparent", color: C.faint, cursor: "pointer", padding: 8, display: "flex" },
          }, React.createElement(Icon, { name: "x", size: 17 }))
        : React.createElement("button", {
            onClick: () => window.__ldToast && window.__ldToast("Describirí lo que necesitás y la IA te sugiere docentes", "info"),
            style: {
              display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 10,
              border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 650,
              color: A.pedido.text, background: A.pedido.soft, whiteSpace: "nowrap", flexShrink: 0,
            },
          },
            React.createElement(Icon, { name: "sparkles", size: 15, stroke: 0, style: { fill: A.pedido.solid } }),
            "Buscar con IA")
    );
  }

  // ── Hero sobrio ──────────────────────────────────────────────────────────
  const ACCENT_KEY = { cursos: "curso", clases: "clase", pedidos: "pedido" };
  function Hero({ section, search, setSearch, count, userCity, children, collapsed }) {
    const { C, A } = useTheme();
    const ac = A[ACCENT_KEY[section] || "curso"];
    const meta = {
      cursos: { eyebrow: "Cursos", title: "Aprendé a tu ritmo, con seguimiento real", ph: "Describí qué querés aprender…" },
      clases: { eyebrow: "Clases particulares", title: "Encontrá tu docente ideal", ph: "Buscá una materia o docente…" },
      pedidos: { eyebrow: "Pedidos de alumnos", title: "Alumnos esperando un docente como vos", ph: "Buscá pedidos por materia o tema…" },
    }[section];

    // ── Modo colapsado: barra compacta con degradado sutil ────────────────
    if (collapsed) {
      return React.createElement("div", {
        style: {
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          background: `${ac.heroGrad}`, borderRadius: 14, padding: "12px 18px",
          boxShadow: C.shadow, transition: "background .5s ease",
        },
      },
        React.createElement("div", { style: { flexShrink: 0 } }, children),
        React.createElement("div", { style: { flex: 1, minWidth: 200 } },
          React.createElement(SearchBar, { value: search, onChange: setSearch, onClear: () => setSearch(""), placeholder: meta.ph, compact: true })
        )
      );
    }

    return React.createElement("section", {
      style: {
        position: "relative", overflow: "hidden",
        background: ac.heroGrad,
        borderRadius: 18, padding: "28px 28px 24px",
        boxShadow: C.shadow, transition: "background .5s ease",
      },
    },
      // círculos decorativos semitransparentes
      React.createElement("div", { style: { position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,.05)", top: -80, right: -60, pointerEvents: "none" } }),
      React.createElement("div", { style: { position: "absolute", width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.06)", bottom: -60, left: 20, pointerEvents: "none" } }),
      React.createElement("div", { style: { position: "relative", zIndex: 1 } },
        React.createElement("div", { style: { marginBottom: 18 } }, children), // SegTabs
        React.createElement("div", { style: tx("eyebrow", { color: "rgba(255,255,255,.85)", marginBottom: 8 }) }, meta.eyebrow),
        React.createElement("h1", { style: tx("display", { color: "#fff", margin: "0 0 6px", maxWidth: 620, textShadow: "0 1px 12px rgba(0,0,0,.12)" }) }, meta.title),
        React.createElement("p", { style: tx("body", { color: "rgba(255,255,255,.9)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }) },
          userCity && React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600, color: "#fff" } },
            React.createElement(Icon, { name: "map-pin", size: 14 }), userCity),
          count != null && React.createElement("span", null, `${count} ${section === "pedidos" ? "pedidos activos" : section === "cursos" ? "cursos disponibles" : "docentes disponibles"}`)
        ),
        React.createElement(SearchBar, { value: search, onChange: setSearch, onClear: () => setSearch(""), placeholder: meta.ph })
      )
    );
  }

  // ── Categorías con iconos de línea ───────────────────────────────────────
  function CategoryRow({ categories, active, onPick, onSeeAll, accentKey }) {
    const { C, A } = useTheme();
    const ac = A[accentKey];
    return React.createElement("div", null,
      React.createElement(SectionHeader, { title: "Explorar por categoría", action: "Ver todas", onAction: onSeeAll }),
      React.createElement("div", {
        className: "ld-scroll",
        style: { display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" },
      },
        categories.map((cat) => {
          const isActive = active === cat.label;
          const cac = A[cat.accent] || ac;
          return React.createElement(CatTile, { key: cat.label, cat, cac, isActive, onClick: () => onPick(cat.label) });
        })
      )
    );
  }

  function CatTile({ cat, cac, isActive, onClick }) {
    const { C } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        flexShrink: 0, width: 130, display: "flex", flexDirection: "column", gap: 11, padding: "15px 14px",
        background: isActive ? cac.soft : C.surface, textAlign: "left", fontFamily: "inherit", cursor: "pointer",
        border: `1px solid ${isActive ? "transparent" : C.border}`, borderRadius: 14,
        boxShadow: h && !isActive ? C.shadowHover : "none", transform: h ? "translateY(-2px)" : "none",
        transition: "all .16s", outline: isActive ? `1.5px solid ${cac.ring}` : "none",
      },
    },
      React.createElement("span", {
        style: { width: 40, height: 40, borderRadius: 11, background: cac.soft, color: cac.solid, display: "flex", alignItems: "center", justifyContent: "center" },
      }, React.createElement(Icon, { name: cat.icon, size: 21, stroke: 1.9 })),
      React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 13.5, fontWeight: 650, color: C.text, lineHeight: 1.25 } }, cat.label),
        React.createElement("div", { style: { fontSize: 12, color: C.faint, marginTop: 3, fontWeight: 500 } }, `${cat.count} ${cat.count === 1 ? "opción" : "opciones"}`)
      )
    );
  }

  // ── Accesos rápidos ──────────────────────────────────────────────────────
  function QuickAccess({ items }) {
    const { C, A } = useTheme();
    return React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 },
    },
      items.map((it) => React.createElement(QuickCard, { key: it.title, it }))
    );
  }
  function QuickCard({ it }) {
    const { C, A } = useTheme();
    const ac = A[it.accent] || A.curso;
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick: it.onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        display: "flex", alignItems: "center", gap: 13, padding: "15px 16px", background: C.surface,
        border: `1px solid ${h ? C.borderStrong : C.border}`, borderRadius: 13, cursor: "pointer",
        fontFamily: "inherit", textAlign: "left", boxShadow: h ? C.shadowHover : "none",
        transform: h ? "translateY(-2px)" : "none", transition: "all .16s",
      },
    },
      React.createElement("span", { style: { width: 38, height: 38, borderRadius: 10, background: ac.soft, color: ac.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
        React.createElement(Icon, { name: it.icon, size: 19, stroke: 2 })),
      React.createElement("div", { style: { minWidth: 0 } },
        React.createElement("div", { style: { fontSize: 13.5, fontWeight: 650, color: C.text } }, it.title),
        React.createElement("div", { style: { fontSize: 12, color: C.muted, marginTop: 1 } }, it.desc)
      )
    );
  }

  // ── Encabezado de sección reutilizable ───────────────────────────────────
  function SectionHeader({ title, sub, action, onAction }) {
    const { C, A } = useTheme();
    return React.createElement("div", {
      style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14, gap: 12 },
    },
      React.createElement("div", { style: { minWidth: 0 } },
        React.createElement("h2", { style: tx("h2", { color: C.text, margin: 0, whiteSpace: "nowrap" }) }, title),
        sub && React.createElement("p", { style: { ...tx("meta"), color: C.muted, margin: "4px 0 0" } }, sub)
      ),
      action && React.createElement("button", {
        onClick: onAction,
        style: { display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "transparent", color: A.curso.text, fontFamily: "inherit", fontSize: 13, fontWeight: 650, cursor: "pointer", whiteSpace: "nowrap" },
      }, action, React.createElement(Icon, { name: "arrow-right", size: 15, stroke: 2.2 }))
    );
  }

  // ── Docentes destacados ──────────────────────────────────────────────────
  function TeacherCard({ t, onOpen }) {
    const { C, A } = useTheme();
    const ac = A[t.accent] || A.clase;
    const [h, setH] = React.useState(false);
    const initials = t.nombre.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const hue = t.nombre.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % 360;
    return React.createElement("button", {
      onClick: () => onOpen && onOpen(t),
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        flexShrink: 0, width: 200, display: "flex", flexDirection: "column", alignItems: "flex-start",
        gap: 0, padding: "18px 16px 16px", background: C.surface, textAlign: "left",
        border: `1px solid ${h ? C.borderStrong : C.border}`, borderRadius: 16,
        cursor: "pointer", fontFamily: "inherit",
        boxShadow: h ? C.shadowHover : C.shadow,
        transform: h ? "translateY(-3px)" : "none", transition: "all .18s",
      },
    },
      // Avatar grande
      React.createElement("div", { style: { position: "relative", marginBottom: 12 } },
        React.createElement("div", {
          style: {
            width: 56, height: 56, borderRadius: 16,
            background: `oklch(75% 0.14 ${hue})`,
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 750, letterSpacing: "-.5px",
          },
        }, initials),
        t.verificado && React.createElement("span", {
          title: "Verificado",
          style: { position: "absolute", bottom: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: ac.solid, border: `2px solid ${C.surface}`, display: "flex", alignItems: "center", justifyContent: "center" },
        }, React.createElement(Icon, { name: "check", size: 10, stroke: 3, color: "#fff" })),
        t.disponible_hoy && React.createElement("span", {
          title: "Disponible hoy",
          style: { position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: C.teal, border: `2px solid ${C.surface}` },
        })
      ),
      // Nombre
      React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3, lineHeight: 1.2 } }, t.nombre),
      // Materias
      React.createElement("div", { style: { fontSize: 12, color: ac.text, fontWeight: 600, marginBottom: 8 } }, t.materias.slice(0, 2).join(" · ")),
      // Bio
      React.createElement("div", { style: { fontSize: 12.5, color: C.muted, lineHeight: 1.45, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } }, t.bio),
      // Rating
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5, marginBottom: 10 } },
        React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, t.rating.toFixed(1)),
        React.createElement("span", { style: { color: "#F59E0B", fontSize: 13 } }, "★"),
        React.createElement("span", { style: { fontSize: 12, color: C.faint } }, `(${t.reviews})`),
        React.createElement("span", { style: { color: C.border } }, "·"),
        React.createElement(Icon, { name: "map-pin", size: 12, color: C.faint }),
        React.createElement("span", { style: { fontSize: 12, color: C.faint } }, t.ciudad)
      ),
      // Stats: publicaciones + alumnos
      React.createElement("div", { style: { marginTop: "auto", paddingTop: 10, borderTop: `1px solid ${C.hairline}`, width: "100%", display: "flex", gap: 12 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4 } },
          React.createElement(Icon, { name: "book-open", size: 13, color: ac.solid }),
          React.createElement("span", { style: { fontSize: 12, fontWeight: 650, color: C.textSoft } }, t.publicaciones),
          React.createElement("span", { style: { fontSize: 11.5, color: C.faint } }, "public.")
        ),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4 } },
          React.createElement(Icon, { name: "users", size: 13, color: ac.solid }),
          React.createElement("span", { style: { fontSize: 12, fontWeight: 650, color: C.textSoft } }, t.alumnos),
          React.createElement("span", { style: { fontSize: 11.5, color: C.faint } }, "alumnos")
        )
      )
    );
  }

  function FeaturedTeachers({ teachers, onOpen }) {
    const { C, A } = useTheme();
    return React.createElement("div", { style: { display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }, className: "ld-scroll" },
      teachers.map((t) => React.createElement(TeacherCard, { key: t.id, t, onOpen }))
    );
  }

  // ── Banda de confianza (3 columnas) ──────────────────────────────────────
  const TRUST = [
    { icon: "graduation-cap", title: "Conectate directamente", desc: "Elegí tu docente y coordiná en la plataforma. Comisión transparente, informada antes de confirmar.", link: "Ver cómo funciona", accent: "curso" },
    { icon: "badge-check", title: "Tu privacidad, protegida", desc: "Tu email nunca se comparte. Todos los contactos pasan por la plataforma.", link: "Cómo protegemos tus datos", accent: "pedido" },
    { icon: "check", title: "Docentes verificados", desc: "El sistema valida el conocimiento de cada docente antes de publicar.", link: "Conocer el sistema de verificación", accent: "clase" },
  ];
  function TrustBand() {
    const { C, A } = useTheme();
    return React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "8px 4px", boxShadow: C.shadow },
    },
      TRUST.map((t, i) => {
        const ac = A[t.accent];
        return React.createElement("div", { key: t.title, style: { padding: "24px 26px", borderLeft: i === 0 ? "none" : `1px solid ${C.hairline}`, display: "flex", flexDirection: "column", alignItems: "flex-start" } },
          React.createElement("div", { style: { width: 44, height: 44, borderRadius: 12, background: ac.soft, color: ac.solid, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 } },
            React.createElement(Icon, { name: t.icon, size: 22, stroke: 1.9 })),
          React.createElement("h3", { style: { ...tx("h2"), color: C.text, margin: "0 0 7px" } }, t.title),
          React.createElement("p", { style: { ...tx("meta"), color: C.muted, margin: "0 0 12px", lineHeight: 1.5, flex: 1 } }, t.desc),
          React.createElement("button", { onClick: () => window.__ldToast && window.__ldToast("Próximamente", "info"), style: { display: "inline-flex", alignItems: "center", gap: 5, border: "none", background: "transparent", color: ac.text, fontFamily: "inherit", fontSize: 13, fontWeight: 650, cursor: "pointer", padding: 0, whiteSpace: "nowrap", textAlign: "left" } },
            t.link, React.createElement(Icon, { name: "arrow-right", size: 15, stroke: 2.2 }))
        );
      })
    );
  }

  // ── CTA "¿Querés enseñar?" ────────────────────────────────────────────────
  function EnsenarCTA() {
    const { C, A } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("div", {
      style: { display: "flex", alignItems: "center", gap: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px", boxShadow: C.shadow, flexWrap: "wrap" },
    },
      React.createElement("div", { style: { width: 44, height: 44, borderRadius: 12, background: A.clase.soft, color: A.clase.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
        React.createElement(Icon, { name: "users", size: 22, stroke: 1.9 })),
      React.createElement("div", { style: { flex: 1, minWidth: 200 } },
        React.createElement("div", { style: { fontSize: 15.5, fontWeight: 700, color: C.text } }, "¿Querés enseñar?"),
        React.createElement("div", { style: { fontSize: 13.5, color: C.muted, marginTop: 2 } }, "Publicá tu primera clase gratis y empezá a recibir alumnos.")
      ),
      React.createElement("button", {
        onClick: () => window.__ldPublish && window.__ldPublish(),
        onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
        style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 650, color: "#fff", background: "linear-gradient(135deg,#1A6ED8,#0F9C82)", whiteSpace: "nowrap", transform: h ? "translateY(-1px)" : "none", boxShadow: h ? "0 6px 18px rgba(26,110,216,.3)" : "0 2px 8px rgba(26,110,216,.2)" },
      }, React.createElement(Icon, { name: "plus", size: 16, stroke: 2.2 }), "Publicar una clase")
    );
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const LEGAL_LINKS = [
    { id: "terminos", label: "Términos" },
    { id: "privacidad", label: "Privacidad" },
    { id: "quejas", label: "Quejas" },
    { id: "accesibilidad", label: "Accesibilidad" },
    { id: "consumidor", label: "Consumidor" },
    { id: "ayuda", label: "Ayuda" },
  ];
  function ExploreFooter() {
    const { C } = useTheme();
    const item = (icon, txt) => React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: C.muted, fontWeight: 500 } },
      React.createElement(Icon, { name: icon, size: 15, color: C.faint }), txt);
    return React.createElement("div", {
      style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "8px 4px 4px", borderTop: `1px solid ${C.hairline}` },
    },
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 28, flexWrap: "wrap" } },
        item("message-circle", "contacto@luderis.com"),
        item("map-pin", "Buenos Aires, Argentina"),
        item("badge-check", "Plataforma segura · Comisión transparente")
      ),
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px 8px", flexWrap: "wrap" } },
        LEGAL_LINKS.map((l, i) => React.createElement(React.Fragment, { key: l.id },
          i > 0 && React.createElement("span", { style: { color: C.border, fontSize: 12 } }, "·"),
          React.createElement(FooterLegalLink, { l })
        ))
      ),
      React.createElement("div", { style: { fontSize: 12, color: C.faint } }, `© ${new Date().getFullYear()} Luderis · Hecho en Argentina`)
    );
  }
  function FooterLegalLink({ l }) {
    const { C } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick: () => window.__ldNav && window.__ldNav(l.id),
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { border: "none", background: "transparent", padding: "2px 4px", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 500, color: h ? C.textSoft : C.muted, textDecoration: h ? "underline" : "none" },
    }, l.label);
  }

  window.ExploreUI = { Hero, SegTabs, SearchBar, CategoryRow, QuickAccess, SectionHeader, TrustBand, EnsenarCTA, ExploreFooter, FeaturedTeachers, TeacherCard, SECTIONS };
})();
