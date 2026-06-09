/* Página Mis Clases (inscripciones) + Favoritos */
(function () {
  const { useTheme, Icon, UI, tx, PageKit, CardsUI } = window;
  const { Avatar, Stars } = UI;
  const { PageTitle, Segmented, RolBadge, ModChip, Card, EmptyState } = PageKit;
  const { fmtPrice } = CardsUI;

  const ESTADO_META = {
    hoy:        { icon: "zap", label: "Inicia hoy", tone: "teal" },
    inicia:     { icon: "calendar", label: "Próxima", tone: "info" },
    en_curso:   { icon: "play-circle", label: "En curso", tone: "teal" },
    finaliza:   { icon: "clock", label: "Por finalizar", tone: "warn" },
    finalizada: { icon: "check", label: "Finalizada", tone: "muted" },
  };

  function MisClases() {
    const { C, A } = useTheme();
    const INS = window.LUDERIS.INSCRIPCIONES;
    const [tab, setTab] = React.useState("activas");

    const activas = INS.filter((i) => i.estado !== "finalizada");
    const finalizadas = INS.filter((i) => i.estado === "finalizada");
    const list = tab === "activas" ? activas : finalizadas;

    return React.createElement("div", null,
      React.createElement(PageTitle, { title: "Mis clases", sub: "Seguí tus cursos y clases, como alumno y como docente." }),
      React.createElement("div", { style: { marginBottom: 20 } },
        React.createElement(Segmented, {
          value: tab, onChange: setTab,
          options: [
            { id: "activas", label: "Activas", count: activas.length },
            { id: "finalizadas", label: "Finalizadas", count: finalizadas.length },
          ],
        })
      ),
      list.length === 0
        ? React.createElement(EmptyState, { icon: "graduation-cap", title: tab === "activas" ? "No tenés clases activas" : "Todavía no completaste clases", sub: "Cuando te inscribas o acuerdes una clase, va a aparecer acá.", cta: "Explorar clases", onCta: () => window.__ldNav && window.__ldNav("explore") })
        : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
            list.map((i) => React.createElement(ClaseCard, { key: i.id, i })))
    );
  }

  function ClaseCard({ i }) {
    const { C, A } = useTheme();
    const esDoc = i.rol === "docente";
    const ac = esDoc ? A.clase : A.curso;
    const em = ESTADO_META[i.estado];
    const toneColor = { teal: C.teal, info: A.curso.solid, warn: "#B96A12", muted: C.faint }[em.tone];
    const toneBg = { teal: C.key === "dark" ? "#10271F" : "#E7F6F1", info: A.curso.soft, warn: A.clase.soft, muted: C.surfaceAlt }[em.tone];
    const [h, setH] = React.useState(false);

    return React.createElement("article", {
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { background: C.surface, border: `1px solid ${h ? C.borderStrong : C.border}`, borderRadius: 14, padding: 18, boxShadow: h ? C.shadowHover : C.shadow, transition: "all .16s", cursor: "pointer" },
    },
      React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "flex-start" } },
        React.createElement(Avatar, { name: i.docente === "Vos" ? "Camila" : i.docente, size: 46 }),
        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" } },
            React.createElement(RolBadge, { rol: i.rol }),
            React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 650, color: toneColor, background: toneBg, borderRadius: 7, padding: "3px 8px", whiteSpace: "nowrap" } },
              React.createElement(Icon, { name: em.icon, size: 12, stroke: 2.2 }), i.estadoTxt)
          ),
          React.createElement("h3", { style: { ...tx("cardTitle"), color: C.text, margin: "0 0 4px" } }, i.titulo),
          React.createElement("div", { style: { fontSize: 12.5, color: C.muted, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
            React.createElement("span", null, esDoc ? `${i.alumnos} ${i.alumnos === 1 ? "alumno" : "alumnos"}` : i.docente),
            React.createElement("span", { style: { color: C.border } }, "·"),
            React.createElement(ModChip, { modalidad: i.modalidad }),
            i.proxima && i.estado !== "finalizada" && React.createElement(React.Fragment, null,
              React.createElement("span", { style: { color: C.border } }, "·"),
              React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, color: C.textSoft, fontWeight: 600 } }, React.createElement(Icon, { name: "calendar", size: 13 }), i.proxima))
          )
        ),
        React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } },
          React.createElement("div", { style: { fontSize: 15, fontWeight: 750, color: C.text } }, fmtPrice(i.precio, "ARS")),
          React.createElement("div", { style: { fontSize: 12, color: C.faint } }, `/${i.tipo}`)
        )
      ),
      // Barra de progreso (cursos en curso)
      i.estado !== "finalizada" && i.progreso > 0 && React.createElement("div", { style: { marginTop: 14 } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.muted, marginBottom: 5, fontWeight: 500 } },
          React.createElement("span", { style: { whiteSpace: "nowrap" } }, "Progreso del curso"),
          React.createElement("span", { style: { fontWeight: 650, color: C.textSoft } }, `${Math.round(i.progreso * 100)}%`)),
        React.createElement("div", { style: { height: 6, borderRadius: 3, background: C.surfaceAlt, overflow: "hidden" } },
          React.createElement("div", { style: { height: "100%", width: `${i.progreso * 100}%`, borderRadius: 3, background: `linear-gradient(90deg,${ac.solid},${C.teal})` } }))
      ),
      // Acciones
      React.createElement("div", { style: { display: "flex", gap: 9, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.hairline}` } },
        i.valorar
          ? React.createElement(ActionBtn, { icon: "star", label: "Valorar curso", primary: true, ac, onClick: () => window.__ldNav && window.__ldNav("cuenta") })
          : i.modalidad === "virtual" && i.estado !== "finalizada"
            ? React.createElement(ActionBtn, { icon: "play-circle", label: "Ir a la clase", primary: true, ac, onClick: () => window.__ldCurso && window.__ldCurso(i.id) })
            : React.createElement(ActionBtn, { icon: "calendar", label: "Ver detalle", ac, onClick: () => window.__ldCurso && window.__ldCurso(i.id) }),
        React.createElement(ActionBtn, { icon: "message-circle", label: "Chat", ac, onClick: () => window.__ldNav && window.__ldNav("chats") })
      )
    );
  }

  function ActionBtn({ icon, label, primary, ac, onClick }) {
    const { C } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick: (e) => { e.stopPropagation(); onClick && onClick(); },
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: primary
        ? { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 650, color: "#fff", background: ac.solid, opacity: h ? .92 : 1 }
        : { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: `1px solid ${h ? C.borderStrong : C.border}`, background: h ? C.surfaceAlt : "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: C.textSoft },
    }, React.createElement(Icon, { name: icon, size: 15, stroke: 2 }), label);
  }

  // ── Favoritos ────────────────────────────────────────────────────────────
  function Favoritos() {
    const { C, A } = useTheme();
    const POSTS = window.LUDERIS.POSTS;
    const [filtro, setFiltro] = React.useState("all");
    const [favs, setFavs] = React.useState(() => new Set(["p1", "p9", "p3", "p5", "b2"]));

    const favList = POSTS.filter((p) => favs.has(p.id));
    const filtered = favList.filter((p) => filtro === "all" || (filtro === "oferta" ? p.tipo === "oferta" : p.tipo === "busqueda"));
    const { PostCard, PedidoCard } = window.CardsUI;

    const toggleFav = (id) => setFavs((s) => { const n = new Set(s); n.delete(id); return n; });

    return React.createElement("div", null,
      React.createElement(PageTitle, { title: "Favoritos", sub: "Las clases y pedidos que guardaste para después." }),
      React.createElement("div", { style: { marginBottom: 20 } },
        React.createElement(Segmented, {
          value: filtro, onChange: setFiltro,
          options: [
            { id: "all", label: "Todo", count: favList.length },
            { id: "oferta", label: "Clases", count: favList.filter((p) => p.tipo === "oferta").length },
            { id: "busqueda", label: "Pedidos", count: favList.filter((p) => p.tipo === "busqueda").length },
          ],
        })
      ),
      filtered.length === 0
        ? React.createElement(EmptyState, { icon: "bookmark", title: "No guardaste favoritos aún", sub: "Tocá el marcador en cualquier clase o pedido para guardarlo acá.", cta: "Explorar clases", onCta: () => window.__ldNav && window.__ldNav("explore") })
        : React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(310px,1fr))", gap: 16 } },
            filtered.map((p) => p.tipo === "busqueda"
              ? React.createElement(PedidoCard, { key: p.id, post: p })
              : React.createElement(PostCard, { key: p.id, post: p, fav: true, onFav: toggleFav })))
    );
  }

  window.PageMisClases = MisClases;
  window.PageFavoritos = Favoritos;
})();
