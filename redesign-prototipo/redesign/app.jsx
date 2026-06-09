/* App principal — wiring de estado, filtros, layout responsive y tweaks */
(function () {
  const { useTheme, Icon, LD, LDContext, UI, NavUI, ExploreUI, CardsUI, tx } = window;
  const { PrimaryBtn } = UI;
  const { Sidebar, TopBar, BottomNav, PublishFab } = NavUI;
  const { Hero, SegTabs, CategoryRow, QuickAccess, SectionHeader, TrustBand, EnsenarCTA, ExploreFooter, FeaturedTeachers } = ExploreUI;
  const { PostCard, PostCardRow, PedidoCard, PedidoCardRow, ResultsToolbar } = CardsUI;

  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const FONT_STACK = {
    "Hanken Grotesk": "'Hanken Grotesk', system-ui, sans-serif",
    "Plus Jakarta Sans": "'Plus Jakarta Sans', system-ui, sans-serif",
    "Manrope": "'Manrope', system-ui, sans-serif",
    "System": "system-ui, -apple-system, 'Segoe UI', sans-serif",
  };
  window.TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "dark": false,
    "density": "equilibrada",
    "font": "Hanken Grotesk"
  }/*EDITMODE-END*/;

  // ── Chip de filtro ────────────────────────────────────────────────────────
  function Chip({ label, active, onClick, accent }) {
    const { C, A } = useTheme();
    const ac = accent || A.curso;
    return React.createElement("button", {
      onClick,
      style: {
        padding: "7px 14px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit",
        fontSize: 13, fontWeight: active ? 650 : 500,
        border: `1px solid ${active ? "transparent" : C.border}`,
        background: active ? ac.solid : C.surface, color: active ? "#fff" : C.textSoft, transition: "all .14s",
      },
    }, label);
  }

  // ── Drawer de filtros ───────────────────────────────────────────────────
  function FilterPanel({ open, onClose, state, set, resultCount, accent }) {
    const { C, A } = useTheme();
    if (!open) return null;
    const ac = accent || A.curso;
    const FL = (t) => React.createElement("div", { style: { ...tx("eyebrow"), color: C.faint, marginBottom: 10 } }, t);
    return React.createElement(React.Fragment, null,
      React.createElement("div", { onClick: onClose, style: { position: "fixed", inset: 0, background: C.overlay, zIndex: 60, animation: "ldFade .15s ease" } }),
      React.createElement("div", {
        className: "ld-filter-drawer",
        style: { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(380px,92vw)", background: C.surface, zIndex: 61, boxShadow: "-8px 0 32px rgba(0,0,0,.18)", display: "flex", flexDirection: "column", fontFamily: "inherit" },
      },
        React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${C.border}` } },
          React.createElement("h2", { style: tx("h1", { color: C.text, margin: 0 }) }, "Filtros"),
          React.createElement("button", { onClick: onClose, "aria-label": "Cerrar", style: { width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: "x", size: 18 }))
        ),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 26 } },
          React.createElement("div", null, FL("Modalidad"),
            React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } },
              [["all", "Todas"], ["presencial", "Presencial"], ["virtual", "Virtual"], ["mixto", "Mixto"]].map(([v, l]) =>
                React.createElement(Chip, { key: v, label: l, active: state.modalidad === v, accent: ac, onClick: () => set({ modalidad: v }) })))),
          React.createElement("div", null, FL("Nivel educativo"),
            React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } },
              [["all", "Todos"], ["primaria", "Primaria"], ["secundaria", "Secundaria"], ["universitario", "Universitario"], ["adultos", "Adultos"]].map(([v, l]) =>
                React.createElement(Chip, { key: v, label: l, active: state.nivel === v, accent: ac, onClick: () => set({ nivel: v }) })))),
          React.createElement("div", null, FL("Precio máximo por hora/mes"),
            React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } },
              [["all", "Sin límite"], ["5000", "Hasta $5.000"], ["10000", "Hasta $10.000"], ["20000", "Hasta $20.000"]].map(([v, l]) =>
                React.createElement(Chip, { key: v, label: l, active: state.precioMax === v, accent: ac, onClick: () => set({ precioMax: v }) })))),
          React.createElement("div", null, FL("Dictado"),
            React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } },
              [["all", "Todos"], ["sinc", "En vivo"], ["asinc", "A tu ritmo"]].map(([v, l]) =>
                React.createElement(Chip, { key: v, label: l, active: state.sinc === v, accent: ac, onClick: () => set({ sinc: v }) })))),
          React.createElement("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer" } },
            React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: C.text } }, "Solo docentes verificados"),
              React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginTop: 2 } }, "Con credenciales validadas")),
            React.createElement(Toggle, { on: state.verificado, onChange: () => set({ verificado: !state.verificado }), accent: ac })
          ),
          React.createElement("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer" } },
            React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: C.text } }, "Con clase de prueba gratis"),
              React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginTop: 2 } }, "Probá antes de comprometerte")),
            React.createElement(Toggle, { on: state.prueba, onChange: () => set({ prueba: !state.prueba }), accent: ac })
          )
        ),
        React.createElement("div", { style: { padding: 18, borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 } },
          React.createElement("button", { onClick: () => set({ modalidad: "all", nivel: "all", precioMax: "all", prueba: false, sinc: "all", verificado: false }), style: { padding: "12px 16px", borderRadius: 11, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" } }, "Limpiar"),
          React.createElement("button", { onClick: onClose, style: { flex: 1, padding: "12px 16px", borderRadius: 11, border: "none", background: ac.solid, color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 650, cursor: "pointer" } }, `Ver ${resultCount} resultado${resultCount !== 1 ? "s" : ""}`)
        )
      )
    );
  }

  function Toggle({ on, onChange, accent }) {
    const { C, A } = useTheme();
    const ac = accent || A.curso;
    return React.createElement("button", {
      onClick: onChange, role: "switch", "aria-checked": on,
      style: { width: 46, height: 27, borderRadius: 14, border: "none", cursor: "pointer", background: on ? ac.solid : C.borderStrong, position: "relative", transition: "background .16s", flexShrink: 0 },
    }, React.createElement("span", { style: { position: "absolute", top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "#fff", transition: "left .16s", boxShadow: "0 1px 3px rgba(0,0,0,.3)" } }));
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  function EmptyState({ onReset }) {
    const { C, A } = useTheme();
    return React.createElement("div", { style: { textAlign: "center", padding: "60px 20px", gridColumn: "1/-1" } },
      React.createElement("div", { style: { width: 64, height: 64, borderRadius: 18, background: C.surfaceAlt, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.faint } },
        React.createElement(Icon, { name: "search", size: 28 })),
      React.createElement("h3", { style: tx("h1", { color: C.text, margin: "0 0 6px" }) }, "No encontramos resultados"),
      React.createElement("p", { style: { ...tx("body"), color: C.muted, margin: "0 0 18px" } }, "Probá con otros términos o quitá algunos filtros."),
      React.createElement(PrimaryBtn, { onClick: onReset }, "Limpiar búsqueda")
    );
  }

  // ── Tile de categoría (grilla "Ver todas") ────────────────────────────────
  function CatGridTile({ cat, accentKey, onClick }) {
    const { C, A } = useTheme();
    const cac = A[cat.accent] || A[accentKey] || A.curso;
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        display: "flex", alignItems: "center", gap: 13, padding: "16px 16px", background: C.surface,
        border: `1px solid ${h ? C.borderStrong : C.border}`, borderRadius: 14, cursor: "pointer",
        fontFamily: "inherit", textAlign: "left", boxShadow: h ? C.shadowHover : "none",
        transform: h ? "translateY(-2px)" : "none", transition: "all .16s",
      },
    },
      React.createElement("span", { style: { width: 44, height: 44, borderRadius: 12, background: cac.soft, color: cac.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
        React.createElement(Icon, { name: cat.icon, size: 22, stroke: 1.9 })),
      React.createElement("div", { style: { minWidth: 0 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 650, color: C.text, lineHeight: 1.25 } }, cat.label),
        React.createElement("div", { style: { fontSize: 12.5, color: C.faint, marginTop: 2, fontWeight: 500 } }, `${cat.count} ${cat.count === 1 ? "opción" : "opciones"}`)
      )
    );
  }

  // ── App ─────────────────────────────────────────────────────────────────
  function App() {
    const POSTS = window.LUDERIS.POSTS;
    const CATS = window.LUDERIS.CATEGORIES;

    // tweaks (panel del toolbar)
    const [t, setTweak] = window.useTweaks(window.TWEAK_DEFAULTS);
    const theme = t.dark ? "dark" : "light";
    const density = t.density;
    const font = t.font;
    const setTheme = (v) => setTweak("dark", (typeof v === "function" ? v(theme) : v) === "dark");
    const tokens = React.useMemo(() => LD.build(theme, density), [theme, density]);

    const [page, setPage] = React.useState("explore");
    const [cursoId, setCursoId] = React.useState(null);
    const [section, setSection] = React.useState("cursos");
    const [search, setSearch] = React.useState("");
    const [category, setCategory] = React.useState("");
    const [sort, setSort] = React.useState("relevancia");
    const [mode, setMode] = React.useState("home"); // home | resultados
    const [viewMode, setViewMode] = React.useState("grid");
    const [filters, setFilters] = React.useState({ modalidad: "all", nivel: "all", precioMax: "all", prueba: false, sinc: "all", verificado: false });
    const [filterOpen, setFilterOpen] = React.useState(false);
    const [favs, setFavs] = React.useState(() => new Set(["p1", "p9"]));
    const [notifOpen, setNotifOpen] = React.useState(false);
    const [publishOpen, setPublishOpen] = React.useState(false);
    const [editPost, setEditPost] = React.useState(null);
    const [statsPost, setStatsPost] = React.useState(null);
    const [adminOpen, setAdminOpen] = React.useState(false);
    const [detailPost, setDetailPost] = React.useState(null);
    const [profilePost, setProfilePost] = React.useState(null);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 900);
    const scrollerRef = React.useRef(null);

    React.useEffect(() => {
      const fn = () => setIsMobile(window.innerWidth < 900);
      window.addEventListener("resize", fn);
      return () => window.removeEventListener("resize", fn);
    }, []);
    React.useEffect(() => { document.body.style.fontFamily = FONT_STACK[font] || font; }, [font]);

    const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch }));
    const activeFilterCount = (filters.modalidad !== "all" ? 1 : 0) + (filters.nivel !== "all" ? 1 : 0) + (filters.precioMax !== "all" ? 1 : 0) + (filters.prueba ? 1 : 0) + (filters.sinc !== "all" ? 1 : 0) + (filters.verificado ? 1 : 0);

    const myRoles = React.useMemo(() => {
      const map = {};
      (window.LUDERIS.INSCRIPCIONES || []).forEach((i) => { if (i.postId) map[i.postId] = i.rol; });
      return map;
    }, []);

    const toggleFav = (id) => setFavs((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const goResults = () => { setMode("resultados"); scrollerRef.current && scrollerRef.current.scrollTo({ top: 0, behavior: "smooth" }); };
    const goCategorias = () => { setMode("categorias"); scrollerRef.current && scrollerRef.current.scrollTo({ top: 0, behavior: "smooth" }); };
    const goHome = () => { setMode("home"); setSearch(""); setCategory(""); setFilters({ modalidad: "all", nivel: "all", precioMax: "all", prueba: false, sinc: "all", verificado: false }); };
    const changeSection = (s) => { setSection(s); setMode("home"); setCategory(""); setSearch(""); };

    React.useEffect(() => { if (search || category) setMode("resultados"); }, [search, category]);

    // ── Filtrado por sección ──
    const inSection = (p) => {
      if (section === "pedidos") return p.tipo === "busqueda";
      if (p.tipo === "busqueda") return false;
      if (section === "cursos") return p.modo === "curso" || p.modo === "grupal";
      return p.modo === "particular";
    };
    const sectionPosts = POSTS.filter(inSection);

    const qt = norm(search.trim());
    const matches = (p) => {
      if (qt && !(norm(p.titulo).includes(qt) || norm(p.descripcion).includes(qt) || norm(p.materia).includes(qt) || norm(p.autor_nombre).includes(qt))) return false;
      if (category && p.materia !== category) return false;
      if (filters.modalidad !== "all" && p.modalidad !== filters.modalidad) return false;
      if (filters.nivel !== "all" && p.nivel !== filters.nivel && p.nivel !== "todos") return false;
      if (filters.precioMax !== "all" && p.precio > Number(filters.precioMax)) return false;
      if (filters.prueba && !p.tiene_prueba) return false;
      if (filters.sinc !== "all" && p.sinc !== filters.sinc) return false;
      if (filters.verificado && !p.verificado) return false;
      return true;
    };
    let results = sectionPosts.filter(matches);
    results = [...results].sort((a, b) => {
      if (sort === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sort === "precio_asc") return (a.precio || 1e9) - (b.precio || 1e9);
      if (sort === "precio_desc") return (b.precio || 0) - (a.precio || 0);
      if (sort === "recientes") return (b.nuevo ? 1 : 0) - (a.nuevo ? 1 : 0);
      return (b.rating || 0) * 2 + (b.inscriptos || 0) / 100 - ((a.rating || 0) * 2 + (a.inscriptos || 0) / 100);
    });

    // categorías con conteo para la sección activa
    const catsWithCount = CATS.map((c) => ({ ...c, count: sectionPosts.filter((p) => p.materia === c.label).length })).filter((c) => c.count > 0);

    const ac = tokens.A[section === "cursos" ? "curso" : section === "clases" ? "clase" : "pedido"];

    const quickItems = {
      cursos: [
        { icon: "zap", title: "En vivo", desc: "Con docente en tiempo real", accent: "curso", onClick: () => { setFilter({ sinc: "sinc" }); goResults(); } },
        { icon: "play-circle", title: "A tu ritmo", desc: "Grabados, cuando quieras", accent: "curso", onClick: () => { setFilter({ sinc: "asinc" }); goResults(); } },
        { icon: "globe", title: "Online", desc: "Desde cualquier lugar", accent: "curso", onClick: () => { setFilter({ modalidad: "virtual" }); goResults(); } },
        { icon: "badge-check", title: "Verificados", desc: "Docentes con credenciales", accent: "curso", onClick: () => { setFilter({ verificado: true }); goResults(); } },
      ],
      clases: [
        { icon: "star", title: "Mejor valorados", desc: "Docentes con más reseñas", accent: "clase", onClick: () => { setSort("rating"); goResults(); } },
        { icon: "globe", title: "Online", desc: "Desde cualquier lugar", accent: "clase", onClick: () => { setFilter({ modalidad: "virtual" }); goResults(); } },
        { icon: "map-pin", title: "Presencial", desc: "Cerca tuyo", accent: "clase", onClick: () => { setFilter({ modalidad: "presencial" }); goResults(); } },
        { icon: "trending-up", title: "Más económicos", desc: "Ordenados por precio", accent: "clase", onClick: () => { setSort("precio_asc"); goResults(); } },
      ],
      pedidos: [
        { icon: "bell", title: "Recientes", desc: "Pedidos publicados hoy", accent: "pedido", onClick: () => { setSort("recientes"); goResults(); } },
        { icon: "globe", title: "Online", desc: "Clases a distancia", accent: "pedido", onClick: () => { setFilter({ modalidad: "virtual" }); goResults(); } },
        { icon: "map-pin", title: "Presencial", desc: "Cerca tuyo", accent: "pedido", onClick: () => { setFilter({ modalidad: "presencial" }); goResults(); } },
        { icon: "sparkles", title: "Sugeridos para vos", desc: "Según tu perfil", accent: "pedido", onClick: () => { setSort("rating"); goResults(); } },
      ],
    }[section];

    const featured = results.slice(0, 6);
    const C = tokens.C;

    const gridCols = isMobile ? "1fr" : viewMode === "list" ? "1fr" : viewMode === "grid-lg" ? "repeat(auto-fill,minmax(420px,1fr))" : "repeat(auto-fill,minmax(300px,1fr))";
    const isList = !isMobile && viewMode === "list";
    const renderGrid = (list) => React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: gridCols, gap: isList ? 6 : tokens.D.gap },
    },
      list.length === 0
        ? React.createElement(EmptyState, { onReset: goHome })
        : list.map((p) => p.tipo === "busqueda"
            ? isList
              ? React.createElement(PedidoCardRow, { key: p.id, post: p, onOpen: setDetailPost })
              : React.createElement(PedidoCard, { key: p.id, post: p, onOpen: setDetailPost })
            : isList
              ? React.createElement(PostCardRow, { key: p.id, post: p, fav: favs.has(p.id), onFav: toggleFav, onOpen: setDetailPost, myRole: myRoles[p.id] })
              : React.createElement(PostCard, { key: p.id, post: p, fav: favs.has(p.id), onFav: toggleFav, onOpen: setDetailPost, myRole: myRoles[p.id] }))
    );

    const exploreContent = React.createElement("div", {
      style: { maxWidth: 1120, margin: "0 auto", padding: isMobile ? "18px 16px 96px" : "26px 28px 60px", display: "flex", flexDirection: "column", gap: tokens.D.sectionGap },
    },
      React.createElement(Hero, { section, search, setSearch, userCity: "Buenos Aires", count: mode === "home" ? sectionPosts.length : null, collapsed: mode !== "home" },
        React.createElement(SegTabs, { value: section, onChange: changeSection })
      ),

      mode === "home"
        ? React.createElement(React.Fragment, null,
            catsWithCount.length > 0 && React.createElement(CategoryRow, { categories: catsWithCount, active: category, accentKey: section === "cursos" ? "curso" : section === "clases" ? "clase" : "pedido", onPick: (lbl) => { setCategory(lbl); }, onSeeAll: goCategorias }),
            React.createElement("div", null,
              React.createElement(SectionHeader, { title: "Accesos rápidos" }),
              React.createElement(QuickAccess, { items: quickItems })
            ),
                    React.createElement("div", null,
              React.createElement(SectionHeader, { title: section === "pedidos" ? "Pedidos destacados" : "Destacados para vos", sub: section === "pedidos" ? "Alumnos buscando docentes ahora" : "Seleccionados por valoración y disponibilidad", action: "Ver todos", onAction: goResults }),
              renderGrid(featured)
            ),
            section !== "pedidos" && React.createElement("div", null,
              React.createElement(SectionHeader, { title: "Docentes destacados", sub: "Los mejor valorados de la plataforma", action: "Ver todos", onAction: () => setPage("docentes") }),
              React.createElement(FeaturedTeachers, { teachers: window.LUDERIS.TEACHERS, onOpen: setProfilePost })
            ),
            React.createElement(TrustBand, null),
            React.createElement(EnsenarCTA, null),
            React.createElement(ExploreFooter, null)
          )
        : mode === "categorias"
        ? React.createElement(React.Fragment, null,
            React.createElement("div", null,
              React.createElement("button", { onClick: goHome, style: { display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: C.muted, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 } },
                React.createElement(Icon, { name: "arrow-left", size: 15 }), "Volver al inicio"),
              React.createElement(SectionHeader, { title: "Todas las categorías", sub: `Explorá ${section === "pedidos" ? "pedidos" : section === "cursos" ? "cursos" : "clases"} por materia` }),
              React.createElement("div", { style: { display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(180px,1fr))", gap: 12 } },
                catsWithCount.map((cat) => React.createElement(CatGridTile, { key: cat.label, cat, accentKey: section === "cursos" ? "curso" : section === "clases" ? "clase" : "pedido", onClick: () => { setCategory(cat.label); goResults(); } }))
              )
            )
          )
        : React.createElement(React.Fragment, null,
            React.createElement("div", null,
              React.createElement("button", { onClick: goHome, style: { display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: C.muted, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 } },
                React.createElement(Icon, { name: "arrow-left", size: 15 }), "Volver al inicio"),
              (category || search) && React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" } },
                category && React.createElement(ActiveTag, { label: category, onClear: () => setCategory(""), ac }),
                search && React.createElement(ActiveTag, { label: `"${search}"`, onClear: () => setSearch(""), ac })
              ),
              React.createElement(ResultsToolbar, { count: results.length, sort, setSort, onOpenFilters: () => setFilterOpen(true), activeFilters: activeFilterCount, viewMode, setViewMode }),
              renderGrid(results)
            )
          )
    );

    // ── Router de páginas + triggers globales ──
    React.useEffect(() => {
      window.__ldNav = (p) => { if (p === "__publish") { setEditPost(null); setPublishOpen(true); return; } setPage(p); setCursoId(null); };
      window.__ldCurso = (inscId) => { setCursoId(inscId); setPage("curso"); };
      window.__ldDetail = (post) => setDetailPost(post);
      window.__ldProfile = (post) => setProfilePost(post);
      window.__ldPublish = (post) => { setEditPost(post && post.id ? post : null); setPublishOpen(true); };
      window.__ldStats = (post) => setStatsPost(post);
      window.__ldAdmin = () => setAdminOpen(true);
    }, []);
    React.useEffect(() => { window.scrollTo({ top: 0 }); if (scrollerRef.current) scrollerRef.current.scrollTop = 0; }, [page]);
    const isFullHeightPage = page === "chats";
    const pageWrap = (node) => React.createElement("div", {
      style: { maxWidth: 1120, margin: "0 auto", padding: isMobile ? "18px 16px 96px" : "26px 28px 60px", height: isFullHeightPage && !isMobile ? "calc(100vh - 60px)" : undefined, boxSizing: "border-box" },
    }, node);

    let content;
    if (page === "explore") content = exploreContent;
    else if (page === "agenda") content = pageWrap(React.createElement(window.PageAgenda));
    else if (page === "chats") content = pageWrap(React.createElement(window.PageChats, { isMobile }));
    else if (page === "favoritos") content = pageWrap(React.createElement(window.PageFavoritos));
    else if (page === "inscripciones") content = pageWrap(React.createElement(window.PageMisClases));
    else if (page === "cuenta") content = pageWrap(React.createElement(window.PageMiCuenta));
    else if (page === "notificaciones") content = pageWrap(React.createElement(window.NotifUI.NotifPage));
    else if (page === "docentes") content = pageWrap(React.createElement(window.PageDocentes));
    else if (page === "curso") content = pageWrap(React.createElement(window.PageCurso, { inscripcionId: cursoId, onBack: () => setPage("inscripciones") }));
    else if (page === "juegos") content = pageWrap(React.createElement(window.PageJuegos));
    else if (page === "ayuda") content = pageWrap(React.createElement(window.PageLegal.AyudaPage));
    else if (page === "quejas") content = pageWrap(React.createElement(window.PageLegal.QuejasPage));
    else if (["terminos", "privacidad", "accesibilidad", "consumidor"].includes(page)) content = pageWrap(React.createElement(window.PageLegal.DocPage, { docId: page }));
    else content = pageWrap(React.createElement(Placeholder, { page }));

    return React.createElement(LDContext.Provider, { value: tokens },
      React.createElement("div", { style: { minHeight: "100vh", background: C.bg, color: C.text } },
        !isMobile && React.createElement(Sidebar, { page, setPage, theme, onToggleTheme: () => setTheme((t) => t === "light" ? "dark" : "light") }),
        React.createElement("div", {
          ref: scrollerRef,
          style: { marginLeft: isMobile ? 0 : 252, minHeight: "100vh" },
        },
          React.createElement(TopBar, { isMobile, onNotif: () => setNotifOpen(true), notifCount: 4 }),
          content
        ),
        isMobile && React.createElement(React.Fragment, null,
          React.createElement(PublishFab, { onClick: () => { setEditPost(null); setPublishOpen(true); } }),
          React.createElement(BottomNav, { page, setPage })
        ),
        React.createElement(window.NotifUI.NotifPanel, { open: notifOpen, onClose: () => setNotifOpen(false) }),
        adminOpen && window.AdminPanel && React.createElement(window.AdminPanel, { onClose: () => setAdminOpen(false) }),
        statsPost && window.StatsModal && React.createElement(window.StatsModal, { post: statsPost, onClose: () => setStatsPost(null) }),
        React.createElement(window.PublishUI.PublishModal, { key: publishOpen ? (editPost ? editPost.id : "new") : "closed", open: publishOpen, editPost, onClose: () => { setPublishOpen(false); setEditPost(null); } }),
        detailPost && React.createElement(window.DetailUI.DetailModal, { post: detailPost, onClose: () => setDetailPost(null) }),
        profilePost && React.createElement(window.DetailUI.ProfileModal, { post: profilePost, onClose: () => setProfilePost(null) }),
        React.createElement(FilterPanel, { open: filterOpen, onClose: () => setFilterOpen(false), state: filters, set: setFilter, resultCount: results.length, accent: ac }),
        React.createElement(window.TweaksPanel, null,
          React.createElement(window.TweakSection, { label: "Apariencia" }),
          React.createElement(window.TweakToggle, { label: "Modo oscuro", value: t.dark, onChange: (v) => setTweak("dark", v) }),
          React.createElement(window.TweakRadio, { label: "Densidad", value: t.density, options: ["compacta", "equilibrada", "amplia"], onChange: (v) => setTweak("density", v) }),
          React.createElement(window.TweakSection, { label: "Tipograf\u00eda" }),
          React.createElement(window.TweakSelect, { label: "Fuente", value: t.font, options: ["Hanken Grotesk", "Plus Jakarta Sans", "Manrope", "System"], onChange: (v) => setTweak("font", v) })
        )
      )
    );
  }

  function ActiveTag({ label, onClear, ac }) {
    const { C } = useTheme();
    return React.createElement("span", {
      style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 8px 6px 13px", borderRadius: 9, background: ac.soft, color: ac.text, fontSize: 13, fontWeight: 600 },
    }, label,
      React.createElement("button", { onClick: onClear, "aria-label": "Quitar", style: { border: "none", background: "transparent", color: ac.text, cursor: "pointer", display: "flex", padding: 2, opacity: .8 } }, React.createElement(Icon, { name: "x", size: 14, stroke: 2.4 })));
  }

  window.LuderisApp = App;

  function Placeholder({ page }) {
    const { C } = useTheme();
    return React.createElement(window.PageKit.EmptyState, { icon: "sparkles", title: "Sección en construcción", sub: "Esta página todavía no forma parte del rediseño.", cta: "Volver al inicio", onCta: () => window.__ldNav("explore") });
  }
})();
