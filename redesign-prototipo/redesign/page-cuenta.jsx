/* Página Mi Cuenta — perfil, actividad, stats de docente, mis publicaciones */
(function () {
  const { useTheme, Icon, UI, tx, PageKit, CardsUI } = window;
  const { Avatar, Stars, VerifiedBadge, PrimaryBtn } = UI;
  const { PageTitle, Segmented, StatCard, Card } = PageKit;
  const { fmtPrice } = CardsUI;

  function MiCuenta() {
    const { C, A } = useTheme();
    const ME = window.LUDERIS.ME;
    const ACT = window.LUDERIS.ACTIVIDAD;
    const DS = window.LUDERIS.DOCENTE_STATS;
    const [tab, setTab] = React.useState("publicaciones");
    const L = window.LUDERIS;

    const TABS = [
      { id: "publicaciones", label: "Publicaciones", count: L.POSTS.filter((p) => p.tipo === "oferta" && p.modo === "curso").slice(0,3).length + L.POSTS.filter((p) => p.tipo === "oferta" && p.modo === "particular").slice(0,3).length + L.POSTS.filter((p) => p.tipo === "busqueda").slice(0,2).length },
      { id: "analytics", label: "Analytics" },
      { id: "clases", label: "Mis clases", count: L.INSCRIPCIONES.length },
      { id: "negociaciones", label: "Negociaciones", count: L.NEGOCIACIONES.length },
      { id: "credenciales", label: "Credenciales", count: L.CREDENCIALES.length },
      { id: "resenas", label: "Reseñas", count: L.RESENAS.length },
      { id: "alertas", label: "Alertas" },
      { id: "referidos", label: "Referidos" },
      { id: "finanzas", label: "Finanzas" },
      { id: "ajustes", label: "Ajustes" },
    ];
    const P2 = window.PageCuenta2 || {};

    return React.createElement("div", null,
      React.createElement(PageTitle, { title: "Mi cuenta" }),
      React.createElement(ProfileHeader, { ME }),
      React.createElement(TabBar, { tabs: TABS, value: tab, onChange: setTab }),

      tab === "publicaciones" && React.createElement(Publicaciones, null),
      tab === "analytics" && React.createElement(Resumen, { ACT, DS }),
      tab === "clases" && P2.MisClasesMini && React.createElement(P2.MisClasesMini, null),
      tab === "negociaciones" && P2.Negociaciones && React.createElement(P2.Negociaciones, null),
      tab === "credenciales" && P2.Credenciales && React.createElement(P2.Credenciales, null),
      tab === "resenas" && P2.Resenas && React.createElement(P2.Resenas, { ME }),
      tab === "alertas" && P2.Alertas && React.createElement(P2.Alertas, null),
      tab === "referidos" && P2.Referidos && React.createElement(P2.Referidos, null),
      tab === "finanzas" && P2.Finanzas && React.createElement(P2.Finanzas, null),
      tab === "ajustes" && React.createElement(Ajustes, { ME })
    );
  }

  // Barra de tabs horizontal con subrayado (scrollable)
  function TabBar({ tabs, value, onChange }) {
    const { C, A } = useTheme();
    return React.createElement("div", {
      className: "ld-scroll",
      style: { display: "flex", gap: 4, margin: "22px 0 22px", borderBottom: `1px solid ${C.border}`, overflowX: "auto", scrollbarWidth: "none" },
    },
      tabs.map((t) => {
        const active = value === t.id;
        return React.createElement("button", {
          key: t.id, onClick: () => onChange(t.id),
          style: {
            position: "relative", display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 11px",
            border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit",
            fontSize: 13, fontWeight: active ? 700 : 500, color: active ? A.curso.text : C.muted,
            whiteSpace: "nowrap", flexShrink: 0,
          },
        },
          t.label,
          t.count != null && React.createElement("span", { style: { fontSize: 11.5, fontWeight: 700, color: active ? A.curso.text : C.faint, background: active ? A.curso.soft : C.surfaceAlt, borderRadius: 7, padding: "1px 7px" } }, t.count),
          active && React.createElement("span", { style: { position: "absolute", left: 8, right: 8, bottom: -1, height: 2.5, borderRadius: 3, background: A.curso.solid } })
        );
      })
    );
  }

  function ProfileHeader({ ME }) {
    const { C, A } = useTheme();
    return React.createElement("div", {
      style: { position: "relative", overflow: "hidden", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: C.shadow },
    },
      // ── Portada ──
      React.createElement("div", { style: { position: "relative", height: 150, background: "linear-gradient(120deg,#1A6ED8,#2563C9 45%,#0F9C82)", overflow: "hidden" } },
        React.createElement("div", { style: { position: "absolute", inset: 0, background: "radial-gradient(circle at 80% -20%, rgba(255,255,255,.25), transparent 55%)" } }),
        React.createElement("button", {
          onClick: () => window.__ldToast && window.__ldToast("Elegí una imagen de portada", "info"),
          style: { position: "absolute", top: 14, right: 14, display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 20, border: "none", background: "rgba(255,255,255,.22)", color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(4px)" },
        }, React.createElement(Icon, { name: "palette", size: 15 }), "Editar portada")
      ),
      // ── Contenido (estilo LinkedIn: avatar arriba-izq, todo apilado debajo) ──
      React.createElement("div", { style: { position: "relative", padding: "0 26px 24px" } },
        // Avatar flotante a la izquierda
        React.createElement("div", { style: { position: "relative", width: 112, marginTop: -58 } },
          React.createElement("div", { style: { display: "inline-block", border: `4px solid ${C.surface}`, borderRadius: "50%", background: C.surface } }, React.createElement(Avatar, { name: ME.nombre, size: 112 })),
          React.createElement("button", { onClick: () => window.__ldToast && window.__ldToast("Cambiá tu foto de perfil", "info"), "aria-label": "Cambiar foto", style: { position: "absolute", bottom: 8, right: 8, width: 30, height: 30, borderRadius: "50%", border: `2px solid ${C.surface}`, background: A.curso.solid, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: "palette", size: 14 }))
        ),
        // Nombre + verificación
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 12 } },
          React.createElement("h2", { style: { ...tx("display", { fontSize: 24 }), color: C.text, margin: 0 } }, ME.nombre),
          React.createElement(VerifiedBadge, { size: 20 })
        ),
        // Titular (headline)
        React.createElement("p", { style: { ...tx("body"), color: C.textSoft, margin: "5px 0 0", maxWidth: 620 } }, ME.bio),
        // Meta: ubicación · desde · rating
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 9 } },
          React.createElement("span", { style: { fontSize: 13, color: C.muted, display: "inline-flex", alignItems: "center", gap: 5 } }, React.createElement(Icon, { name: "map-pin", size: 14 }), ME.ciudad),
          React.createElement("span", { style: { fontSize: 13, color: C.muted, display: "inline-flex", alignItems: "center", gap: 5 } }, React.createElement(Icon, { name: "graduation-cap", size: 14 }), `Miembro desde ${ME.desde}`),
          React.createElement("span", { style: { width: 3, height: 3, borderRadius: "50%", background: C.faint } }),
          React.createElement(Stars, { value: ME.rating, count: ME.reviews, size: 14 })
        ),
        // Acciones (pills)
        React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 } },
          React.createElement(PillBtn, { primary: true, icon: "plus", label: "Publicar", onClick: () => window.__ldPublish && window.__ldPublish() }),
          React.createElement(PillBtn, { icon: "user", label: "Ver perfil público", onClick: () => window.__ldProfile && window.__ldProfile({ autor_nombre: ME.nombre, materia: ME.materia, ciudad: ME.ciudad, rating: ME.rating, reviews: ME.reviews, verificado: true }) }),
          React.createElement(PillBtn, { icon: "palette", label: "Editar perfil", onClick: () => window.__ldNav && window.__ldNav("cuenta") })
        )
      )
    );
  }

  // Botón tipo LinkedIn (pill)
  function PillBtn({ primary, icon, label, onClick }) {
    const { C, A } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: primary
        ? { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 22, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 650, color: "#fff", background: A.curso.solid, boxShadow: h ? "0 4px 14px rgba(26,110,216,.35)" : "none", transition: "all .15s" }
        : { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 22, border: `1.5px solid ${h ? A.curso.solid : C.borderStrong}`, background: h ? A.curso.soft : "transparent", color: h ? A.curso.text : C.textSoft, fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, cursor: "pointer", transition: "all .15s" },
    }, React.createElement(Icon, { name: icon, size: 16 }), label);
  }

  function GhostBtn({ icon, label, onClick }) {
    const { C } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 15px", borderRadius: 10, border: `1px solid ${h ? C.borderStrong : C.border}`, background: h ? C.surfaceAlt : "transparent", color: C.textSoft, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
    }, React.createElement(Icon, { name: icon, size: 16 }), label);
  }

  function Resumen({ ACT, DS }) {
    const { C, A } = useTheme();
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 26 } },
      // Actividad como alumno
      React.createElement("div", null,
        React.createElement(SubHead, { icon: "book-open", title: "Mi actividad como alumno" }),
        React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } },
          React.createElement(StatCard, { icon: "graduation-cap", label: "Cursos inscripto", value: ACT.inscripto, accentKey: "curso" }),
          React.createElement(StatCard, { icon: "play-circle", label: "En curso", value: ACT.enCurso, accentKey: "clase" }),
          React.createElement(StatCard, { icon: "check", label: "Completados", value: ACT.completados, accentKey: "pedido" })
        )
      ),
      // Stats como docente
      React.createElement("div", null,
        React.createElement(SubHead, { icon: "trending-up", title: "Mi actividad como docente" }),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 } },
          React.createElement(StatCard, { icon: "megaphone", label: "Publicaciones activas", value: DS.publicaciones, accentKey: "clase" }),
          React.createElement(StatCard, { icon: "users", label: "Alumnos activos", value: DS.alumnosActivos, accentKey: "curso" }),
          React.createElement(StatCard, { icon: "star", label: "Valoración", value: DS.rating, accentKey: "clase" }),
          React.createElement(StatCard, { icon: "message-circle", label: "Tasa de respuesta", value: DS.tasaRespuesta, suffix: "%", accentKey: "pedido" })
        ),
        React.createElement("div", { className: "ld-cuenta-grid", style: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 } },
          React.createElement(VistasCard, { DS }),
          React.createElement(IngresosCard, { DS })
        )
      )
    );
  }

  function SubHead({ icon, title }) {
    const { C } = useTheme();
    return React.createElement("h3", { style: { ...tx("h2"), color: C.text, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 } },
      React.createElement(Icon, { name: icon, size: 17, color: C.muted, stroke: 2 }), title);
  }

  function VistasCard({ DS }) {
    const { C, A } = useTheme();
    const max = Math.max(...DS.vistasSemana.map((d) => d.v));
    return React.createElement(Card, { pad: 20 },
      React.createElement("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 } },
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 13, color: C.muted, fontWeight: 500 } }, "Vistas esta semana"),
          React.createElement("div", { style: { fontSize: 24, fontWeight: 750, color: C.text, letterSpacing: "-.02em" } }, DS.vistasTotales.toLocaleString("es-AR"))),
        React.createElement("span", { style: { fontSize: 12.5, fontWeight: 650, color: C.teal, display: "inline-flex", alignItems: "center", gap: 4 } }, React.createElement(Icon, { name: "trending-up", size: 14 }), "+18%")
      ),
      React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 10, height: 90 } },
        DS.vistasSemana.map((d, i) => React.createElement("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 } },
          React.createElement("div", { style: { width: "100%", maxWidth: 26, height: `${(d.v / max) * 70}px`, borderRadius: 6, background: `linear-gradient(180deg,${A.curso.solid},${A.curso.solid}aa)`, opacity: i === 3 ? 1 : .55 } }),
          React.createElement("span", { style: { fontSize: 11, color: C.faint, fontWeight: 500 } }, d.d)
        ))
      )
    );
  }

  function IngresosCard({ DS }) {
    const { C, A } = useTheme();
    return React.createElement(Card, { pad: 20, style: { display: "flex", flexDirection: "column" } },
      React.createElement("div", { style: { fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 4 } }, "Ingresos estimados (mes)"),
      React.createElement("div", { style: { fontSize: 28, fontWeight: 750, color: C.text, letterSpacing: "-.02em", marginBottom: 4 } }, fmtPrice(DS.ingresosEst, "ARS")),
      React.createElement("div", { style: { fontSize: 12.5, color: C.faint, marginBottom: "auto" } }, "Según alumnos activos y precios"),
      React.createElement("button", { onClick: () => window.__ldNav && window.__ldNav("cuenta"), style: { marginTop: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 16px", borderRadius: 10, border: `1px solid ${A.curso.solid}`, background: A.curso.soft, color: A.curso.text, fontFamily: "inherit", fontSize: 13, fontWeight: 650, cursor: "pointer" } },
        React.createElement(Icon, { name: "trending-up", size: 16 }), "Ver detalle de cobros")
    );
  }

  function Publicaciones() {
    const { C, A } = useTheme();
    const ALL = window.LUDERIS.POSTS;
    // "Mis" publicaciones: cursos + clases ofertadas + pedidos publicados
    const MIS_CURSOS  = ALL.filter((p) => p.tipo === "oferta" && p.modo === "curso").slice(0, 3);
    const MIS_CLASES  = ALL.filter((p) => p.tipo === "oferta" && p.modo === "particular").slice(0, 3);
    const MIS_PEDIDOS = ALL.filter((p) => p.tipo === "busqueda").slice(0, 2);
    const GRUPOS = {
      cursos:  { label: "Cursos",  accent: "curso",  items: MIS_CURSOS },
      clases:  { label: "Clases",  accent: "clase",  items: MIS_CLASES },
      pedidos: { label: "Pedidos", accent: "pedido", items: MIS_PEDIDOS },
    };
    const [sub, setSub] = React.useState("cursos");
    const g = GRUPOS[sub];
    const total = MIS_CURSOS.length + MIS_CLASES.length + MIS_PEDIDOS.length;

    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" } },
        React.createElement("div", { style: { fontSize: 14, color: C.muted } }, React.createElement("span", { style: { fontWeight: 700, color: C.text } }, total), " publicaciones activas"),
        React.createElement(PrimaryBtn, { icon: "plus", size: "sm", onClick: () => window.__ldPublish && window.__ldPublish() }, "Nueva publicación")
      ),
      // Selector de tipo
      React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" } },
        Object.entries(GRUPOS).map(([id, grp]) => {
          const active = sub === id;
          const ac = A[grp.accent];
          return React.createElement("button", {
            key: id, onClick: () => setSub(id),
            style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: active ? 650 : 500, border: `1px solid ${active ? "transparent" : C.border}`, background: active ? ac.solid : C.surface, color: active ? "#fff" : C.textSoft, transition: "all .14s" },
          },
            grp.label,
            React.createElement("span", { style: { fontSize: 11.5, fontWeight: 700, color: active ? "#fff" : C.faint, background: active ? "rgba(255,255,255,.22)" : C.surfaceAlt, borderRadius: 7, padding: "1px 7px" } }, grp.items.length)
          );
        })
      ),
      // Lista del grupo activo
      g.items.length === 0
        ? React.createElement("div", { style: { textAlign: "center", padding: "42px 0", color: C.faint } },
            React.createElement(Icon, { name: "megaphone", size: 34, stroke: 1.4 }),
            React.createElement("p", { style: { marginTop: 12, fontSize: 14 } }, `No tenés ${g.label.toLowerCase()} publicados todavía.`))
        : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
            g.items.map((p) => React.createElement(MyPost, { key: p.id, p, accent: g.accent }))
          )
    );
  }

  function MyPost({ p, accent }) {
    const { C, A } = useTheme();
    const [h, setH] = React.useState(false);
    const ac = A[accent] || A.curso;
    const isPedido = p.tipo === "busqueda";
    return React.createElement("article", {
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { display: "flex", gap: 16, alignItems: "center", background: C.surface, border: `1px solid ${h ? C.borderStrong : C.border}`, borderLeft: `3px solid ${ac.solid}`, borderRadius: 14, padding: 16, boxShadow: h ? C.shadowHover : C.shadow, transition: "all .16s", flexWrap: "wrap" },
    },
      React.createElement("div", { style: { flex: 1, minWidth: 220 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" } },
          isPedido
            ? React.createElement("span", { style: { fontSize: 11, fontWeight: 650, color: ac.text, background: ac.soft, borderRadius: 6, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 } }, React.createElement(Icon, { name: "clock", size: 11 }), `Expira en ${p.expira_dias}d`)
            : React.createElement("span", { style: { fontSize: 11, fontWeight: 650, color: C.teal, background: C.key === "dark" ? "#10271F" : "#E7F6F1", borderRadius: 6, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 } }, React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: C.teal } }), "Activa"),
          React.createElement("span", { style: { fontSize: 12, color: C.faint } }, p.materia)
        ),
        React.createElement("h3", { style: { ...tx("cardTitle"), color: C.text, margin: 0 } }, p.titulo)
      ),
      isPedido
        ? React.createElement("div", { style: { display: "flex", gap: 22 } },
            React.createElement(MiniStat, { icon: "megaphone", value: Math.floor(Math.random() * 6) + 2, label: "ofertas" }),
            React.createElement(MiniStat, { icon: "eye", value: (p.expira_dias * 40), label: "vistas" })
          )
        : React.createElement("div", { style: { display: "flex", gap: 22 } },
            React.createElement(MiniStat, { icon: "eye", value: p.vistas, label: "vistas" }),
            React.createElement(MiniStat, { icon: "users", value: p.inscriptos || 0, label: "alumnos" }),
            React.createElement(MiniStat, { icon: "star", value: p.rating || "—", label: `${p.reviews || 0} reseñas` })
          ),
      React.createElement("div", { style: { display: "flex", gap: 8 } },
        React.createElement(IconAction, { icon: "sliders-horizontal", label: "Editar", onClick: () => window.__ldPublish && window.__ldPublish(p) }),
        React.createElement(IconAction, { icon: "trending-up", label: "Estadísticas", onClick: () => window.__ldStats && window.__ldStats(p) })
      )
    );
  }

  function MiniStat({ icon, value, label }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { textAlign: "center", minWidth: 56 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 16, fontWeight: 700, color: C.text } },
        React.createElement(Icon, { name: icon, size: 14, color: C.faint }), value),
      React.createElement("div", { style: { fontSize: 11, color: C.faint, marginTop: 2 } }, label)
    );
  }

  function IconAction({ icon, label, onClick }) {
    const { C } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick, "aria-label": label, title: label, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { width: 38, height: 38, borderRadius: 10, border: `1px solid ${h ? C.borderStrong : C.border}`, background: h ? C.surfaceAlt : "transparent", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
    }, React.createElement(Icon, { name: icon, size: 17 }));
  }

  function SettingsCard({ title, desc, danger, children }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { background: C.surface, border: `1px solid ${danger ? "rgba(229,72,77,.3)" : C.border}`, borderRadius: 16, padding: "20px 22px", boxShadow: C.shadow } },
      React.createElement("div", { style: { fontSize: 14.5, fontWeight: 700, color: danger ? "#E5484D" : C.text, marginBottom: desc ? 4 : 16 } }, title),
      desc && React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginBottom: 16, lineHeight: 1.55, maxWidth: 560 } }, desc),
      children
    );
  }

  function InfoRow({ label, value, last }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "11px 0", borderBottom: last ? "none" : `1px solid ${C.hairline}` } },
      React.createElement("span", { style: { fontSize: 13.5, color: C.muted, fontWeight: 500 } }, label),
      React.createElement("span", { style: { fontSize: 13.5, color: C.text, fontWeight: 600, textAlign: "right" } }, value)
    );
  }

  function SettingToggle({ icon, title, desc, on, onChange }) {
    const { C, A } = useTheme();
    return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 13, padding: "12px 0" } },
      React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: C.surfaceAlt, color: C.textSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: icon, size: 17 })),
      React.createElement("div", { style: { flex: 1, minWidth: 0 } },
        React.createElement("div", { style: { fontSize: 13.5, fontWeight: 600, color: C.text } }, title),
        React.createElement("div", { style: { fontSize: 12, color: C.muted, marginTop: 1 } }, desc)),
      React.createElement(SettingSwitch, { on, onChange })
    );
  }
  function SettingSwitch({ on, onChange }) {
    const { C, A } = useTheme();
    return React.createElement("button", { onClick: onChange, role: "switch", "aria-checked": on, style: { width: 44, height: 25, borderRadius: 13, border: "none", cursor: "pointer", background: on ? A.curso.solid : C.borderStrong, position: "relative", flexShrink: 0, transition: "background .16s" } },
      React.createElement("span", { style: { position: "absolute", top: 3, left: on ? 22 : 3, width: 19, height: 19, borderRadius: "50%", background: "#fff", transition: "left .16s", boxShadow: "0 1px 3px rgba(0,0,0,.3)" } }));
  }

  function LegalRow({ label, page, onNav, last }) {
    const { C } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick: () => onNav(page), onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: 10, border: "none", background: h ? C.surfaceAlt : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left", marginBottom: last ? 0 : 2 },
    },
      React.createElement("span", { style: { fontSize: 13.5, color: C.text, fontWeight: 500 } }, label),
      React.createElement(Icon, { name: "chevron-right", size: 16, color: C.faint })
    );
  }

  function Ajustes({ ME }) {
    const { C, A } = useTheme();
    const [edit, setEdit] = React.useState(false);
    const [form, setForm] = React.useState({ nombre: ME.nombre, ciudad: ME.ciudad, materia: ME.materia, bio: ME.bio });
    const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const [notif, setNotif] = React.useState({ mensajes: true, ofertas: true, resenas: true, marketing: false, email: true });
    const tg = (k) => setNotif((n) => ({ ...n, [k]: !n[k] }));
    const [confirmDel, setConfirmDel] = React.useState(false);
    const [delText, setDelText] = React.useState("");
    const nav = (p) => window.__ldNav && window.__ldNav(p);

    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 } },

      // Datos personales (editable)
      React.createElement(SettingsCard, { title: "Datos personales" },
        edit
          ? React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
              React.createElement(SettingField, { label: "Nombre y apellido", value: form.nombre, onChange: (v) => setF("nombre", v) }),
              React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } },
                React.createElement("div", { style: { flex: 1, minWidth: 180 } }, React.createElement(SettingField, { label: "Ciudad", value: form.ciudad, onChange: (v) => setF("ciudad", v) })),
                React.createElement("div", { style: { flex: 1, minWidth: 180 } }, React.createElement(SettingField, { label: "Materia principal", value: form.materia, onChange: (v) => setF("materia", v) }))),
              React.createElement(SettingField, { label: "Biografía", value: form.bio, onChange: (v) => setF("bio", v), area: true }),
              React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" } },
                React.createElement(GhostBtn, { icon: "x", label: "Cancelar", onClick: () => setEdit(false) }),
                React.createElement(PrimaryBtn, { icon: "check", size: "sm", onClick: () => setEdit(false) }, "Guardar cambios")))
          : React.createElement("div", null,
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 4 } },
                React.createElement(Avatar, { name: form.nombre, size: 52 }),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { fontSize: 15, fontWeight: 650, color: C.text } }, form.nombre),
                  React.createElement("div", { style: { fontSize: 13, color: C.muted } }, `${form.materia} · ${form.ciudad}`)),
                React.createElement(GhostBtn, { icon: "palette", label: "Editar", onClick: () => setEdit(true) })),
              React.createElement("p", { style: { ...tx("body"), color: C.textSoft, margin: "12px 0 0" } }, form.bio))
      ),

      // Información de cuenta
      React.createElement(SettingsCard, { title: "Información de cuenta" },
        React.createElement("div", null,
          React.createElement(InfoRow, { label: "Email", value: ME.email || "camila@email.com" }),
          React.createElement(InfoRow, { label: "Miembro desde", value: ME.desde || "2023" }),
          React.createElement(InfoRow, { label: "Plan", value: "Gratuito" }),
          React.createElement(InfoRow, { label: "ID de usuario", value: React.createElement("span", { style: { fontFamily: "monospace", fontSize: 12, color: C.muted } }, "usr_8f3a91c2…"), last: true })
        ),
        React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 } },
          React.createElement(GhostBtn, { icon: "message-circle", label: "Cambiar contraseña", onClick: () => window.__ldToast && window.__ldToast("Te enviamos un email para cambiar tu contraseña", "success") }),
          React.createElement(GhostBtn, { icon: "bookmark", label: "Descargar mis datos", onClick: () => window.__ldToast && window.__ldToast("Preparando la descarga de tus datos…", "info") }))
      ),

      // Notificaciones (toggles funcionales)
      React.createElement(SettingsCard, { title: "Notificaciones", desc: "Elegí qué avisos querés recibir dentro de la app y por email." },
        React.createElement("div", { style: { display: "flex", flexDirection: "column" } },
          React.createElement(SettingToggle, { icon: "message-circle", title: "Mensajes nuevos", desc: "Cuando alguien te escribe", on: notif.mensajes, onChange: () => tg("mensajes") }),
          React.createElement(SettingToggle, { icon: "megaphone", title: "Ofertas y negociaciones", desc: "Ofertas recibidas en tus pedidos", on: notif.ofertas, onChange: () => tg("ofertas") }),
          React.createElement(SettingToggle, { icon: "star", title: "Reseñas", desc: "Cuando recibís una valoración", on: notif.resenas, onChange: () => tg("resenas") }),
          React.createElement(SettingToggle, { icon: "bell", title: "Novedades y promociones", desc: "Tips y novedades de Luderis", on: notif.marketing, onChange: () => tg("marketing") }),
          React.createElement(SettingToggle, { icon: "globe", title: "Resumen por email", desc: "Un resumen semanal de tu actividad", on: notif.email, onChange: () => tg("email") })
        )
      ),

      // Privacidad y legales (navegan)
      React.createElement(SettingsCard, { title: "Privacidad y legales" },
        React.createElement("div", { style: { margin: "0 -6px" } },
          React.createElement(LegalRow, { label: "Política de privacidad", page: "privacidad", onNav: nav }),
          React.createElement(LegalRow, { label: "Términos y condiciones", page: "terminos", onNav: nav }),
          React.createElement(LegalRow, { label: "Defensa del consumidor", page: "consumidor", onNav: nav }),
          React.createElement(LegalRow, { label: "Libro de quejas", page: "quejas", onNav: nav }),
          React.createElement(LegalRow, { label: "Accesibilidad", page: "accesibilidad", onNav: nav }),
          React.createElement(LegalRow, { label: "Centro de ayuda", page: "ayuda", onNav: nav, last: true })
        )
      ),

      // Cerrar sesión
      React.createElement("button", {
        onClick: () => window.__ldToast && window.__ldToast("Sesión cerrada", "info"),
        style: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 18px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.textSoft, fontFamily: "inherit", fontSize: 14, fontWeight: 650, cursor: "pointer", boxShadow: C.shadow },
      }, React.createElement(Icon, { name: "log-out", size: 17 }), "Cerrar sesión"),

      // Zona de peligro
      React.createElement(SettingsCard, { title: "Zona de peligro", danger: true, desc: "Eliminar tu cuenta borrará permanentemente tu perfil, publicaciones y datos. Esta acción no se puede deshacer." },
        !confirmDel
          ? React.createElement("button", { onClick: () => setConfirmDel(true), style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, border: "1px solid #E5484D", background: "transparent", color: "#E5484D", fontFamily: "inherit", fontSize: 13.5, fontWeight: 650, cursor: "pointer" } }, React.createElement(Icon, { name: "x", size: 16 }), "Eliminar mi cuenta")
          : React.createElement("div", { style: { background: "rgba(229,72,77,.07)", border: "1px solid rgba(229,72,77,.25)", borderRadius: 12, padding: 16 } },
              React.createElement("div", { style: { fontSize: 13.5, color: C.text, marginBottom: 10 } }, "Escribí ", React.createElement("strong", null, "ELIMINAR"), " para confirmar:"),
              React.createElement("input", { value: delText, onChange: (e) => setDelText(e.target.value), placeholder: "ELIMINAR", style: { width: "100%", maxWidth: 240, border: `1.5px solid ${delText === "ELIMINAR" ? "#E5484D" : C.border}`, borderRadius: 10, padding: "10px 14px", fontFamily: "inherit", fontSize: 14, color: C.text, background: C.surface, outline: "none", marginBottom: 12, boxSizing: "border-box" } }),
              React.createElement("div", { style: { display: "flex", gap: 9, flexWrap: "wrap" } },
                React.createElement("button", { onClick: () => { setConfirmDel(false); setDelText(""); }, style: { padding: "9px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" } }, "Cancelar"),
                React.createElement("button", { disabled: delText !== "ELIMINAR", onClick: () => nav("quejas"), style: { padding: "9px 18px", borderRadius: 10, border: "none", background: delText === "ELIMINAR" ? "#E5484D" : "rgba(229,72,77,.4)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: delText === "ELIMINAR" ? "pointer" : "not-allowed", opacity: delText === "ELIMINAR" ? 1 : .7 } }, "Solicitar eliminación"))
            )
      )
    );
  }

  function SettingField({ label, value, onChange, area }) {
    const { C, A } = useTheme();
    const [f, setF] = React.useState(false);
    const base = { width: "100%", border: `1.5px solid ${f ? A.curso.solid : C.border}`, borderRadius: 10, padding: "10px 13px", fontFamily: "inherit", fontSize: 14, color: C.text, background: C.surfaceAlt, outline: "none", boxShadow: f ? `0 0 0 4px ${A.curso.ring}` : "none", boxSizing: "border-box" };
    return React.createElement("label", { style: { display: "block" } },
      React.createElement("span", { style: { display: "block", fontSize: 13, fontWeight: 600, color: C.textSoft, marginBottom: 6 } }, label),
      area
        ? React.createElement("textarea", { value, onChange: (e) => onChange(e.target.value), onFocus: () => setF(true), onBlur: () => setF(false), rows: 3, style: { ...base, resize: "vertical", lineHeight: 1.5 } })
        : React.createElement("input", { value, onChange: (e) => onChange(e.target.value), onFocus: () => setF(true), onBlur: () => setF(false), style: base })
    );
  }

  window.PageMiCuenta = MiCuenta;
})();
