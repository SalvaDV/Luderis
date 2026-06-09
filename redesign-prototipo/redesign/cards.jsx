/* Tarjetas de publicación + barra de resultados (orden / filtros) */
(function () {
  const { useTheme, Icon, UI, tx } = window;
  const { Avatar, Stars, Pill, VerifiedBadge } = UI;

  const MODALIDAD = {
    virtual: { icon: "monitor", label: "Virtual" },
    presencial: { icon: "map-pin", label: "Presencial" },
    mixto: { icon: "swap", label: "Mixto" },
  };
  const NIVEL = { primaria: "Primaria", secundaria: "Secundaria", universitario: "Universitario", adultos: "Adultos", todos: "Todos los niveles" };
  const fmtPrice = (p, m) => {
    if (p == null) return "A convenir";
    if (p === 0) return "Gratis";
    const sym = { ARS: "$", USD: "US$", EUR: "€" }[m] || "$";
    return sym + Number(p).toLocaleString("es-AR");
  };
  const accentFor = (post, A) => post.tipo === "busqueda" ? A.pedido : (post.modo === "particular" ? A.clase : A.curso);

  // ── Badge de rol del usuario ─────────────────────────────────────────────
  function MyRoleBadge({ role, C }) {
    if (!role) return null;
    const isDoc = role === "docente";
    return React.createElement("span", {
      style: {
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 650, padding: "2px 8px", borderRadius: 6,
        background: isDoc ? "#E7F6F1" : "#EAF2FC",
        color: isDoc ? "#0F7A5A" : "#1257AE",
        whiteSpace: "nowrap",
      },
    },
      React.createElement(Icon, { name: isDoc ? "user" : "graduation-cap", size: 11, stroke: 2.2 }),
      isDoc ? "Doy esta clase" : "Soy alumno"
    );
  }

  // ── Tarjeta de oferta (curso / clase) ────────────────────────────────────
  function PostCard({ post, onOpen, fav, onFav, myRole }) {
    const { C, A, D } = useTheme();
    const ac = accentFor(post, A);
    const [h, setH] = React.useState(false);
    const mod = MODALIDAD[post.modalidad];
    return React.createElement("article", {
      onClick: () => onOpen && onOpen(post),
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        display: "flex", flexDirection: "column", background: C.surface,
        border: `1px solid ${h ? C.borderStrong : C.border}`, borderRadius: D.radius,
        padding: D.cardPad, cursor: "pointer", boxShadow: h ? C.shadowHover : C.shadow,
        transform: h ? "translateY(-3px)" : "none", transition: "all .18s", fontFamily: "inherit",
      },
    },
      // Header
      React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 13 } },
        React.createElement(Avatar, { name: post.autor_nombre, size: 42 }),
        React.createElement("div", { style: { minWidth: 0, flex: 1 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" } },
            React.createElement("span", { style: { fontSize: 13.5, fontWeight: 650, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, post.autor_nombre),
            post.verificado && React.createElement(VerifiedBadge, { size: 15 }),
            React.createElement(MyRoleBadge, { role: myRole, C })
          ),
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginTop: 2, fontSize: 12.5, color: C.muted, fontWeight: 500 } },
            React.createElement("span", null, post.materia),
            React.createElement("span", { style: { color: C.border } }, "·"),
            React.createElement("span", { style: { whiteSpace: "nowrap" } }, post.ciudad)
          )
        ),
        React.createElement(BookmarkBtn, { active: fav, onClick: (e) => { e.stopPropagation(); onFav && onFav(post.id); } })
      ),
      // Disponible hoy
      post.disponible_hoy && React.createElement("div", { style: { marginBottom: 9 } },
        React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 650, color: C.teal, background: C.key === "dark" ? "#10271F" : "#E7F6F1", borderRadius: 7, padding: "3px 9px", whiteSpace: "nowrap" } },
          React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: C.teal } }), "Disponible hoy")
      ),
      // Título + descripción
      React.createElement("h3", { style: { ...tx("cardTitle"), color: C.text, margin: "0 0 6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } }, post.titulo),
      React.createElement("p", { style: { ...tx("body"), color: C.muted, margin: "0 0 14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 } }, post.descripcion),
      // Pills
      React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 } },
        React.createElement(Pill, { icon: post.modo === "particular" ? "user" : "graduation-cap", label: post.modo === "particular" ? "Particular" : "Curso", tone: "accent", accent: ac }),
        mod && React.createElement(Pill, { icon: mod.icon, label: mod.label }),
        post.tiene_prueba && React.createElement(Pill, { icon: "check", label: "Prueba gratis", tone: "success" })
      ),
      // Footer
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: 13, borderTop: `1px solid ${C.hairline}` } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, minWidth: 0 } },
          post.rating ? React.createElement(Stars, { value: post.rating, count: post.reviews }) : React.createElement("span", { style: { fontSize: 12.5, color: C.faint } }, "Sin reseñas"),
          post.inscriptos > 0 && React.createElement(React.Fragment, null,
            React.createElement("span", { style: { color: C.border } }, "·"),
            React.createElement("span", { style: { fontSize: 12.5, color: C.muted, display: "inline-flex", alignItems: "center", gap: 4 } },
              React.createElement(Icon, { name: "users", size: 13 }), post.inscriptos))
        ),
        React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } },
          React.createElement("span", { style: { ...tx("price"), color: C.text } }, fmtPrice(post.precio, post.moneda)),
          React.createElement("span", { style: { fontSize: 12.5, color: C.faint, fontWeight: 500 } }, `/${post.precio_tipo}`)
        )
      )
    );
  }

  function BookmarkBtn({ active, onClick }) {
    const { C, A } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick, "aria-label": active ? "Quitar de favoritos" : "Guardar", "aria-pressed": active,
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        width: 34, height: 34, borderRadius: 9, border: "none", cursor: "pointer", flexShrink: 0,
        background: h || active ? A.curso.soft : "transparent", color: active ? A.curso.solid : C.faint,
        display: "flex", alignItems: "center", justifyContent: "center", transition: "all .14s",
      },
    }, React.createElement(Icon, { name: "bookmark", size: 18, stroke: active ? 0 : 1.9, style: active ? { fill: A.curso.solid } : undefined }));
  }

  // ── Tarjeta de pedido ────────────────────────────────────────────────────
  function PedidoCard({ post, onOpen }) {
    const { C, A, D } = useTheme();
    const ac = A.pedido;
    const [h, setH] = React.useState(false);
    const mod = MODALIDAD[post.modalidad];
    return React.createElement("article", {
      onClick: () => onOpen && onOpen(post),
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        display: "flex", flexDirection: "column", background: C.surface,
        border: `1px solid ${h ? ac.ring : C.border}`, borderLeft: `3px solid ${ac.solid}`,
        borderRadius: D.radius, padding: D.cardPad, cursor: "pointer",
        boxShadow: h ? C.shadowHover : C.shadow, transform: h ? "translateY(-3px)" : "none", transition: "all .18s",
      },
    },
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 } },
        React.createElement(Pill, { icon: "megaphone", label: "Pedido", tone: "accent", accent: ac }),
        post.expira_dias <= 7 && React.createElement("span", { style: { fontSize: 11.5, color: C.muted, display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 } },
          React.createElement(Icon, { name: "clock", size: 13 }), `Expira en ${post.expira_dias}d`)
      ),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 11 } },
        React.createElement(Avatar, { name: post.autor_nombre, size: 34 }),
        React.createElement("div", { style: { minWidth: 0 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 650, color: C.text } }, post.autor_nombre),
          React.createElement("div", { style: { fontSize: 12, color: C.muted } }, post.materia)
        )
      ),
      React.createElement("h3", { style: { ...tx("cardTitle"), color: C.text, margin: "0 0 6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } }, post.titulo),
      React.createElement("p", { style: { ...tx("body"), color: C.muted, margin: "0 0 14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 } }, post.descripcion),
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: 12, borderTop: `1px solid ${C.hairline}` } },
        mod && React.createElement(Pill, { icon: mod.icon, label: mod.label }),
        React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: ac.text } }, `Hasta ${fmtPrice(post.precio, post.moneda)}/${post.precio_tipo}`)
      )
    );
  }

  // ── Tarjeta modo LISTA (fila horizontal compacta) ────────────────────────
  function PostCardRow({ post, onOpen, fav, onFav, myRole }) {
    const { C, A, D } = useTheme();
    const ac = accentFor(post, A);
    const [h, setH] = React.useState(false);
    const mod = MODALIDAD[post.modalidad];
    return React.createElement("article", {
      onClick: () => onOpen && onOpen(post),
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        display: "flex", alignItems: "center", gap: 14, background: C.surface,
        border: `1px solid ${h ? C.borderStrong : C.border}`, borderRadius: D.radius,
        padding: "12px 16px", cursor: "pointer",
        boxShadow: h ? C.shadowHover : C.shadow,
        transition: "all .16s", fontFamily: "inherit",
      },
    },
      // Avatar
      React.createElement(Avatar, { name: post.autor_nombre, size: 40 }),
      // Bloque central
      React.createElement("div", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5 } },
          React.createElement("span", { style: { fontSize: 13, fontWeight: 650, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, post.autor_nombre),
          post.verificado && React.createElement(VerifiedBadge, { size: 14 }),
          post.disponible_hoy && React.createElement("span", { style: { fontSize: 11, fontWeight: 650, color: C.teal, background: C.key === "dark" ? "#10271F" : "#E7F6F1", borderRadius: 5, padding: "1px 6px", whiteSpace: "nowrap" } }, "Hoy"),
          React.createElement(MyRoleBadge, { role: myRole, C })
        ),
        React.createElement("div", { style: { fontSize: 14, fontWeight: 650, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, post.titulo),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" } },
          React.createElement(Pill, { icon: post.modo === "particular" ? "user" : "graduation-cap", label: post.modo === "particular" ? "Particular" : "Curso", tone: "accent", accent: ac }),
          mod && React.createElement(Pill, { icon: mod.icon, label: mod.label }),
          post.tiene_prueba && React.createElement(Pill, { icon: "check", label: "Prueba gratis", tone: "success" })
        )
      ),
      // Bloque derecho
      React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 } },
        React.createElement("div", { style: { textAlign: "right" } },
          React.createElement("div", { style: { ...tx("price"), color: C.text, fontSize: 15 } }, fmtPrice(post.precio, post.moneda)),
          React.createElement("div", { style: { fontSize: 11.5, color: C.faint, fontWeight: 500 } }, `/${post.precio_tipo}`)
        ),
        post.rating
          ? React.createElement(Stars, { value: post.rating, count: post.reviews })
          : React.createElement("span", { style: { fontSize: 11.5, color: C.faint } }, "Sin reseñas")
      ),
      React.createElement(BookmarkBtn, { active: fav, onClick: (e) => { e.stopPropagation(); onFav && onFav(post.id); } })
    );
  }

  function PedidoCardRow({ post, onOpen }) {
    const { C, A, D } = useTheme();
    const ac = A.pedido;
    const [h, setH] = React.useState(false);
    const mod = MODALIDAD[post.modalidad];
    return React.createElement("article", {
      onClick: () => onOpen && onOpen(post),
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        display: "flex", alignItems: "center", gap: 14, background: C.surface,
        border: `1px solid ${h ? ac.ring : C.border}`, borderLeft: `3px solid ${ac.solid}`,
        borderRadius: D.radius, padding: "12px 16px", cursor: "pointer",
        boxShadow: h ? C.shadowHover : C.shadow, transition: "all .16s",
      },
    },
      React.createElement(Avatar, { name: post.autor_nombre, size: 40 }),
      React.createElement("div", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
          React.createElement(Pill, { icon: "megaphone", label: "Pedido", tone: "accent", accent: ac }),
          post.expira_dias <= 7 && React.createElement("span", { style: { fontSize: 11.5, color: C.muted, display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 } },
            React.createElement(Icon, { name: "clock", size: 12 }), `Expira en ${post.expira_dias}d`)
        ),
        React.createElement("div", { style: { fontSize: 14, fontWeight: 650, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, post.titulo),
        React.createElement("div", { style: { fontSize: 12.5, color: C.muted } }, `${post.autor_nombre} · ${post.materia}`)
      ),
      React.createElement("div", { style: { flexShrink: 0, textAlign: "right" } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: ac.text } }, `Hasta ${fmtPrice(post.precio, post.moneda)}`),
        React.createElement("div", { style: { fontSize: 11.5, color: C.faint } }, `/${post.precio_tipo}`),
        mod && React.createElement("div", { style: { marginTop: 4 } }, React.createElement(Pill, { icon: mod.icon, label: mod.label }))
      )
    );
  }

  // ── Barra de resultados (conteo, orden, filtros) ─────────────────────────
  const SORTS = [
    { id: "relevancia", label: "Relevancia" },
    { id: "rating", label: "Mejor valorados" },
    { id: "recientes", label: "Más recientes" },
    { id: "precio_asc", label: "Precio: menor a mayor" },
    { id: "precio_desc", label: "Precio: mayor a menor" },
  ];
  function ResultsToolbar({ count, sort, setSort, onOpenFilters, activeFilters, viewMode, setViewMode }) {
    const { C, A } = useTheme();
    const [open, setOpen] = React.useState(false);
    const cur = SORTS.find((s) => s.id === sort) || SORTS[0];

    const VIEWS = [
      { id: "list", icon: "menu", label: "Lista" },
      { id: "grid", icon: "sliders-horizontal", label: "Cuadrícula" },
      { id: "grid-lg", icon: "play-circle", label: "Grande" },
    ];

    return React.createElement("div", {
      style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" },
    },
      React.createElement("div", { style: { fontSize: 14, color: C.muted, fontWeight: 500 } },
        React.createElement("span", { style: { color: C.text, fontWeight: 700 } }, count), ` resultado${count !== 1 ? "s" : ""}`),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },

        // ── Botones de vista ──────────────────────────────────────────────
        React.createElement("div", { style: { display: "flex", gap: 2, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 3 } },
          VIEWS.map((v) => {
            const active = (viewMode || "grid") === v.id;
            return React.createElement("button", {
              key: v.id, onClick: () => setViewMode && setViewMode(v.id), title: v.label, "aria-label": v.label,
              style: { width: 34, height: 34, borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: active ? C.surface : "transparent", color: active ? A.curso.solid : C.faint, boxShadow: active ? C.shadow : "none", transition: "all .14s" },
            }, React.createElement(Icon, { name: v.icon, size: 16, stroke: active ? 2.2 : 1.8 }));
          })
        ),

        // ── Orden ─────────────────────────────────────────────────────────
        React.createElement("div", { style: { position: "relative" } },
          React.createElement("button", {
            onClick: () => setOpen((v) => !v),
            style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 13px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.textSoft, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" },
          },
            React.createElement(Icon, { name: "swap", size: 15 }),
            React.createElement("span", { className: "ld-hide-mobile" }, cur.label),
            React.createElement(Icon, { name: "chevron-right", size: 14, style: { transform: "rotate(90deg)" } })
          ),
          open && React.createElement(React.Fragment, null,
            React.createElement("div", { onClick: () => setOpen(false), style: { position: "fixed", inset: 0, zIndex: 50 } }),
            React.createElement("div", {
              style: { position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 51, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadowHover, padding: 6, minWidth: 220 },
            },
              SORTS.map((s) => React.createElement("button", {
                key: s.id, onClick: () => { setSort(s.id); setOpen(false); },
                style: { width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: s.id === sort ? 650 : 500, color: s.id === sort ? A.curso.text : C.textSoft, background: s.id === sort ? A.curso.soft : "transparent", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
              }, s.label, s.id === sort && React.createElement(Icon, { name: "check", size: 15, stroke: 2.4 })))
            )
          )
        ),

        // ── Filtros ────────────────────────────────────────────────────────
        React.createElement("button", {
          onClick: onOpenFilters,
          style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 13px", borderRadius: 10, border: `1px solid ${activeFilters > 0 ? A.curso.solid : C.border}`, background: activeFilters > 0 ? A.curso.soft : C.surface, color: activeFilters > 0 ? A.curso.text : C.textSoft, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" },
        },
          React.createElement(Icon, { name: "sliders-horizontal", size: 16 }), "Filtros",
          activeFilters > 0 && React.createElement("span", { style: { background: A.curso.solid, color: "#fff", borderRadius: 8, fontSize: 11, fontWeight: 700, minWidth: 17, height: 17, padding: "0 4px", display: "flex", alignItems: "center", justifyContent: "center" } }, activeFilters)
        )
      )
    );
  }

  window.CardsUI = { PostCard, PostCardRow, PedidoCard, PedidoCardRow, ResultsToolbar, fmtPrice, MODALIDAD, NIVEL, SORTS };
})();
