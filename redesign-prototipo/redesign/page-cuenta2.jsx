/* Mi cuenta — secciones adicionales: clases, negociaciones, credenciales, reseñas, alertas, referidos, finanzas */
(function () {
  const { useTheme, Icon, UI, tx, PageKit, CardsUI } = window;
  const { Avatar, Stars, VerifiedBadge, PrimaryBtn, Pill } = UI;
  const { Card, StatCard, RolBadge, ModChip, EmptyState } = PageKit;
  const { fmtPrice } = CardsUI;

  const fmt = (n) => "$" + Number(Math.abs(n)).toLocaleString("es-AR");

  // ── Mis clases (versión compacta dentro de la cuenta) ──────────────────────
  function MisClasesMini() {
    const { C, A } = useTheme();
    const INS = window.LUDERIS.INSCRIPCIONES;
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
      React.createElement(SectionHint, { text: "Tus cursos y clases activos, como alumno y como docente.", action: "Ver todo", onAction: () => window.__ldNav("inscripciones") }),
      INS.slice(0, 5).map((i) => React.createElement("div", { key: i.id, style: { display: "flex", alignItems: "center", gap: 13, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: "13px 16px", boxShadow: C.shadow } },
        React.createElement(Avatar, { name: i.docente === "Vos" ? "Camila" : i.docente, size: 40 }),
        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" } },
            React.createElement(RolBadge, { rol: i.rol }),
            React.createElement("span", { style: { fontSize: 12, color: i.estado === "finalizada" ? C.faint : C.teal, fontWeight: 600 } }, i.estadoTxt)),
          React.createElement("div", { style: { fontSize: 13.5, fontWeight: 650, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, i.titulo)),
        React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } },
          React.createElement("div", { style: { fontSize: 14, fontWeight: 750, color: C.text } }, fmtPrice(i.precio, "ARS")),
          React.createElement("div", { style: { fontSize: 11.5, color: C.faint } }, `/${i.tipo}`))
      ))
    );
  }

  function SectionHint({ text, action, onAction }) {
    const { C, A } = useTheme();
    return React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 } },
      React.createElement("p", { style: { ...tx("meta"), color: C.muted, margin: 0 } }, text),
      action && React.createElement("button", { onClick: onAction, style: { display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "transparent", color: A.curso.text, fontFamily: "inherit", fontSize: 13, fontWeight: 650, cursor: "pointer", whiteSpace: "nowrap" } }, action, React.createElement(Icon, { name: "arrow-right", size: 14, stroke: 2.2 }))
    );
  }

  // ── Negociaciones ──────────────────────────────────────────────────────────
  const NEG_ESTADO = {
    pendiente: { label: "Pendiente", color: "#B96A12", soft: "clase" },
    aceptada: { label: "Aceptada", color: "#0F9C82", soft: "teal" },
    contraoferta: { label: "Contraoferta", color: "#6A49DE", soft: "pedido" },
    rechazada: { label: "Rechazada", color: "#8593A7", soft: "muted" },
  };
  function Negociaciones() {
    const { C, A } = useTheme();
    const NEG = window.LUDERIS.NEGOCIACIONES;
    const [filtro, setFiltro] = React.useState("todas");
    const list = NEG.filter((n) => filtro === "todas" || (filtro === "recibidas" ? n.tipo === "recibida" : n.tipo === "enviada"));
    return React.createElement("div", null,
      React.createElement("div", { style: { marginBottom: 18 } },
        React.createElement(PageKit.Segmented, { value: filtro, onChange: setFiltro, options: [
          { id: "todas", label: "Todas", count: NEG.length },
          { id: "recibidas", label: "Recibidas", count: NEG.filter((n) => n.tipo === "recibida").length },
          { id: "enviadas", label: "Enviadas", count: NEG.filter((n) => n.tipo === "enviada").length },
        ] })),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
        list.map((n) => React.createElement(NegCard, { key: n.id, n })))
    );
  }
  function NegCard({ n }) {
    const { C, A } = useTheme();
    const est = NEG_ESTADO[n.estado];
    const estBg = { clase: A.clase.soft, teal: C.key === "dark" ? "#10271F" : "#E7F6F1", pedido: A.pedido.soft, muted: C.surfaceAlt }[est.soft];
    return React.createElement("article", { style: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, boxShadow: C.shadow } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 } },
        React.createElement(Avatar, { name: n.persona, size: 42 }),
        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
            React.createElement("span", { style: { fontSize: 13.5, fontWeight: 650, color: C.text } }, n.persona),
            React.createElement("span", { style: { fontSize: 11, fontWeight: 650, color: n.tipo === "recibida" ? A.curso.text : A.pedido.text, background: n.tipo === "recibida" ? A.curso.soft : A.pedido.soft, borderRadius: 6, padding: "2px 7px" } }, n.tipo === "recibida" ? "Recibida" : "Enviada")),
          React.createElement("div", { style: { fontSize: 12.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, n.pub)),
        React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } },
          React.createElement("div", { style: { fontSize: 16, fontWeight: 750, color: C.text } }, fmt(n.monto)),
          React.createElement("div", { style: { fontSize: 11.5, color: C.faint } }, `/${n.tipoPrecio}`))
      ),
      React.createElement("p", { style: { ...tx("body"), color: C.textSoft, margin: "0 0 14px", background: C.surfaceAlt, borderRadius: 10, padding: "10px 14px" } }, `“${n.mensaje}”`),
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
          React.createElement("span", { style: { fontSize: 12, fontWeight: 650, color: est.color, background: estBg, borderRadius: 7, padding: "4px 10px" } }, est.label),
          React.createElement("span", { style: { fontSize: 12, color: C.faint } }, n.hace)),
        n.estado === "pendiente" && React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement(MiniBtn, { label: "Rechazar", onClick: () => window.__ldToast && window.__ldToast("Oferta rechazada", "info") }),
          React.createElement(MiniBtn, { label: "Contraofertar", onClick: () => window.__ldToast && window.__ldToast("Abriendo contraoferta…", "info") }),
          React.createElement(MiniBtn, { label: "Aceptar", primary: true, onClick: () => window.__ldToast && window.__ldToast("¡Oferta aceptada! Coordiná la primera clase por chat.", "success") })),
        n.estado === "contraoferta" && React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement(MiniBtn, { label: "Ver detalle", onClick: () => window.__ldToast && window.__ldToast("Abriendo detalle de la negociación…", "info") }),
          React.createElement(MiniBtn, { label: "Aceptar", primary: true, onClick: () => window.__ldToast && window.__ldToast("¡Contraoferta aceptada!", "success") }))
      )
    );
  }
  function MiniBtn({ label, primary, onClick }) {
    const { C, A } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: primary
        ? { padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 650, color: "#fff", background: A.curso.solid, opacity: h ? .92 : 1 }
        : { padding: "8px 14px", borderRadius: 9, border: `1px solid ${h ? C.borderStrong : C.border}`, background: h ? C.surfaceAlt : "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: C.textSoft },
    }, label);
  }

  // ── Credenciales ───────────────────────────────────────────────────────────
  function Credenciales() {
    const { C, A } = useTheme();
    const CR = window.LUDERIS.CREDENCIALES;
    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" } },
        React.createElement(SectionHint, { text: "Tus títulos y certificados respaldan tu perfil docente." }),
        React.createElement(PrimaryBtn, { icon: "plus", size: "sm", onClick: () => window.__ldToast && window.__ldToast("Abriendo el formulario de credencial…", "info") }, "Agregar credencial")),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 } },
        CR.map((cr) => React.createElement("div", { key: cr.id, style: { display: "flex", gap: 13, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, boxShadow: C.shadow } },
          React.createElement("div", { style: { width: 42, height: 42, borderRadius: 11, background: A.curso.soft, color: A.curso.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: cr.tipo === "Título" ? "graduation-cap" : "badge-check", size: 21, stroke: 1.9 })),
          React.createElement("div", { style: { flex: 1, minWidth: 0 } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 } },
              React.createElement("span", { style: { fontSize: 11, fontWeight: 650, color: C.faint, textTransform: "uppercase", letterSpacing: ".04em" } }, cr.tipo),
              cr.verificado && React.createElement(VerifiedBadge, { size: 14 })),
            React.createElement("div", { style: { fontSize: 14, fontWeight: 650, color: C.text, marginBottom: 2 } }, cr.titulo),
            React.createElement("div", { style: { fontSize: 12.5, color: C.muted } }, `${cr.institucion} · ${cr.anio}`),
            !cr.verificado && React.createElement("div", { style: { fontSize: 11.5, color: "#B96A12", marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 } }, React.createElement(Icon, { name: "clock", size: 12 }), "En verificación"))
        )))
    );
  }

  // ── Reseñas ─────────────────────────────────────────────────────────────────
  function Resenas({ ME }) {
    const { C, A } = useTheme();
    const RES = window.LUDERIS.RESENAS;
    const avg = (RES.reduce((a, r) => a + r.rating, 0) / RES.length).toFixed(1);
    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", gap: 16, alignItems: "center", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 18, boxShadow: C.shadow } },
        React.createElement("div", { style: { textAlign: "center", paddingRight: 18, borderRight: `1px solid ${C.hairline}` } },
          React.createElement("div", { style: { fontSize: 34, fontWeight: 800, color: C.text, lineHeight: 1 } }, ME.rating),
          React.createElement("div", { style: { marginTop: 4 } }, React.createElement(Stars, { value: ME.rating, size: 13 })),
          React.createElement("div", { style: { fontSize: 12, color: C.faint, marginTop: 4 } }, `${ME.reviews} reseñas`)),
        React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 6 } },
          [5, 4, 3, 2, 1].map((n) => {
            const pct = n === 5 ? 78 : n === 4 ? 16 : n === 3 ? 4 : n === 2 ? 1 : 1;
            return React.createElement("div", { key: n, style: { display: "flex", alignItems: "center", gap: 9 } },
              React.createElement("span", { style: { fontSize: 12, color: C.muted, width: 10 } }, n),
              React.createElement(Icon, { name: "star", size: 11, color: "#F2A33A", stroke: 0, style: { fill: "#F2A33A" } }),
              React.createElement("div", { style: { flex: 1, height: 6, borderRadius: 3, background: C.surfaceAlt, overflow: "hidden" } }, React.createElement("div", { style: { height: "100%", width: `${pct}%`, background: "#F2A33A", borderRadius: 3 } })),
              React.createElement("span", { style: { fontSize: 11.5, color: C.faint, width: 28, textAlign: "right" } }, `${pct}%`));
          }))),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
        RES.map((r) => React.createElement("div", { key: r.id, style: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, boxShadow: C.shadow } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 11, marginBottom: 10 } },
            React.createElement(Avatar, { name: r.autor, size: 38 }),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { style: { fontSize: 13.5, fontWeight: 650, color: C.text } }, r.autor),
              React.createElement("div", { style: { fontSize: 12, color: C.faint } }, `${r.pub} · ${r.fecha}`)),
            React.createElement("div", { style: { display: "flex", gap: 1 } }, Array.from({ length: 5 }).map((_, i) => React.createElement(Icon, { key: i, name: "star", size: 14, color: i < r.rating ? "#F2A33A" : C.border, stroke: 0, style: { fill: i < r.rating ? "#F2A33A" : C.border } })))),
          React.createElement("p", { style: { ...tx("body"), color: C.textSoft, margin: 0 } }, r.texto)
        )))
    );
  }

  // ── Alertas ─────────────────────────────────────────────────────────────────
  function Alertas() {
    const { C, A } = useTheme();
    const [alertas, setAlertas] = React.useState(window.LUDERIS.ALERTAS);
    const toggle = (id) => setAlertas((a) => a.map((x) => x.id === id ? { ...x, activa: !x.activa } : x));
    const remove = (id) => { setAlertas((a) => a.filter((x) => x.id !== id)); window.__ldToast && window.__ldToast("Alerta eliminada", "info"); };
    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", gap: 13, alignItems: "flex-start", background: A.curso.soft, borderRadius: 13, padding: "15px 18px", marginBottom: 18 } },
        React.createElement("div", { style: { color: A.curso.solid, flexShrink: 0, marginTop: 1 } }, React.createElement(Icon, { name: "bell", size: 19 })),
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 14, fontWeight: 650, color: C.text, marginBottom: 2 } }, "Alertas de publicaciones"),
          React.createElement("div", { style: { fontSize: 13, color: C.textSoft } }, "Te avisamos por email cuando aparezca una clase o pedido que coincida con tus criterios."))),
      React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 14 } }, React.createElement(PrimaryBtn, { icon: "plus", size: "sm", onClick: () => window.__ldToast && window.__ldToast("Configurá tu nueva alerta de búsqueda", "info") }, "Nueva alerta")),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
        alertas.map((a) => React.createElement("div", { key: a.id, style: { display: "flex", alignItems: "center", gap: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: "14px 18px", boxShadow: C.shadow } },
          React.createElement("div", { style: { width: 38, height: 38, borderRadius: 10, background: a.activa ? A.curso.soft : C.surfaceAlt, color: a.activa ? A.curso.solid : C.faint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "search", size: 18 })),
          React.createElement("div", { style: { flex: 1, minWidth: 0 } },
            React.createElement("div", { style: { fontSize: 13.5, fontWeight: 650, color: C.text } }, a.criterio),
            React.createElement("div", { style: { fontSize: 12, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
              React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4 } }, React.createElement(Icon, { name: "clock", size: 12 }), a.frecuencia),
              a.nuevos > 0 && React.createElement("span", { style: { color: C.teal, fontWeight: 650 } }, `${a.nuevos} nuevos`))),
          React.createElement(Toggle2, { on: a.activa, onChange: () => toggle(a.id) }),
          React.createElement("button", { onClick: () => remove(a.id), "aria-label": "Eliminar", style: { width: 34, height: 34, borderRadius: 9, border: "none", background: "transparent", color: C.faint, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: "x", size: 16 }))
        )))
    );
  }
  function Toggle2({ on, onChange }) {
    const { C, A } = useTheme();
    return React.createElement("button", { onClick: onChange, role: "switch", "aria-checked": on, style: { width: 42, height: 24, borderRadius: 13, border: "none", cursor: "pointer", background: on ? A.curso.solid : C.borderStrong, position: "relative", flexShrink: 0 } },
      React.createElement("span", { style: { position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .16s", boxShadow: "0 1px 3px rgba(0,0,0,.3)" } }));
  }

  // ── Referidos ───────────────────────────────────────────────────────────────
  function Referidos() {
    const { C, A } = useTheme();
    const R = window.LUDERIS.REFERIDOS;
    const [copied, setCopied] = React.useState(false);
    return React.createElement("div", null,
      React.createElement("div", { style: { position: "relative", overflow: "hidden", background: "linear-gradient(120deg,#1A6ED8,#0F9C82)", borderRadius: 16, padding: "24px 26px", marginBottom: 20, color: "#fff" } },
        React.createElement("div", { style: { fontSize: 18, fontWeight: 750, marginBottom: 4 } }, "Invitá y ganá $2.500 por amigo"),
        React.createElement("div", { style: { fontSize: 13.5, opacity: .9, marginBottom: 18, maxWidth: 440 } }, "Compartí tu link. Cuando tu invitado tome su primera clase, ambos reciben crédito en su billetera."),
        React.createElement("div", { style: { display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,.18)", borderRadius: 10, padding: "10px 15px", fontSize: 14, fontWeight: 600 } },
            React.createElement(Icon, { name: "globe", size: 16 }), R.link),
          React.createElement("button", { onClick: () => { setCopied(true); setTimeout(() => setCopied(false), 1600); }, style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 650, color: A.curso.text, background: "#fff", whiteSpace: "nowrap" } }, React.createElement(Icon, { name: copied ? "check" : "bookmark", size: 15, stroke: 2.2 }), copied ? "¡Copiado!" : "Copiar link"))),
      React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 } },
        React.createElement(StatCard, { icon: "users", label: "Invitados", value: R.invitados, accentKey: "curso" }),
        React.createElement(StatCard, { icon: "check", label: "Completados", value: R.completados, accentKey: "clase" }),
        React.createElement(StatCard, { icon: "clock", label: "Pendientes", value: R.pendientes, accentKey: "pedido" }),
        React.createElement(StatCard, { icon: "trending-up", label: "Ganado", value: fmt(R.ganado), accentKey: "curso" })),
      React.createElement("h3", { style: { ...tx("h2"), color: C.text, margin: "0 0 12px" } }, "Tus invitados"),
      React.createElement(Card, { pad: 0 },
        R.lista.map((p, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 13, padding: "13px 18px", borderBottom: i === R.lista.length - 1 ? "none" : `1px solid ${C.hairline}` } },
          React.createElement(Avatar, { name: p.nombre, size: 36 }),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontSize: 13.5, fontWeight: 600, color: C.text } }, p.nombre),
            React.createElement("div", { style: { fontSize: 12, color: C.faint } }, p.fecha)),
          React.createElement("span", { style: { fontSize: 12, fontWeight: 650, color: p.estado === "completado" ? C.teal : "#B96A12", background: p.estado === "completado" ? (C.key === "dark" ? "#10271F" : "#E7F6F1") : A.clase.soft, borderRadius: 7, padding: "4px 10px" } }, p.estado === "completado" ? "Completado" : "Pendiente")
        )))
    );
  }

  // ── Finanzas ─────────────────────────────────────────────────────────────────
  function Finanzas() {
    const { C, A } = useTheme();
    const F = window.LUDERIS.FINANZAS;
    const [sub, setSub] = React.useState("cobros");
    return React.createElement("div", null,
      React.createElement("div", { style: { marginBottom: 18 } },
        React.createElement(PageKit.Segmented, { value: sub, onChange: setSub, options: [{ id: "cobros", label: "Cobros" }, { id: "billetera", label: "Billetera" }] })),
      React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 } },
        React.createElement(StatCard, { icon: "trending-up", label: "Saldo disponible", value: fmt(F.saldo), accentKey: "curso" }),
        React.createElement(StatCard, { icon: "clock", label: "Pendiente de acreditar", value: fmt(F.pendiente), accentKey: "clase" }),
        React.createElement(StatCard, { icon: "check", label: "Cobrado este mes", value: fmt(F.cobradoMes), accentKey: "pedido" })),
      // MP conectado + retirar
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20, flexWrap: "wrap", boxShadow: C.shadow } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
          React.createElement("div", { style: { width: 40, height: 40, borderRadius: 11, background: C.key === "dark" ? "#10271F" : "#E7F6F1", color: C.teal, display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: "check", size: 20, stroke: 2.4 })),
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 14, fontWeight: 650, color: C.text } }, "MercadoPago conectado"),
            React.createElement("div", { style: { fontSize: 12.5, color: C.muted } }, "Recibís tus cobros automáticamente"))),
        React.createElement(PrimaryBtn, { icon: "trending-up", size: "sm", onClick: () => window.__ldToast && window.__ldToast("Solicitud de retiro enviada a MercadoPago", "success") }, "Retirar saldo")),
      React.createElement("h3", { style: { ...tx("h2"), color: C.text, margin: "0 0 12px" } }, "Movimientos recientes"),
      React.createElement(Card, { pad: 0 },
        F.movimientos.map((m, i) => {
          const pos = m.monto > 0;
          return React.createElement("div", { key: m.id, style: { display: "flex", alignItems: "center", gap: 13, padding: "14px 18px", borderBottom: i === F.movimientos.length - 1 ? "none" : `1px solid ${C.hairline}` } },
            React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: pos ? (C.key === "dark" ? "#10271F" : "#E7F6F1") : C.surfaceAlt, color: pos ? C.teal : C.muted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: m.tipo === "ingreso" ? "arrow-right" : m.tipo === "retiro" ? "arrow-left" : "x", size: 16, stroke: 2.2 })),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { style: { fontSize: 13.5, fontWeight: 600, color: C.text } }, m.concepto),
              React.createElement("div", { style: { fontSize: 12, color: C.faint } }, m.pub ? `${m.pub} · ${m.fecha}` : m.fecha)),
            React.createElement("div", { style: { fontSize: 14.5, fontWeight: 750, color: pos ? C.teal : C.text } }, (pos ? "+" : "−") + fmt(m.monto)));
        }))
    );
  }

  window.PageCuenta2 = { MisClasesMini, Negociaciones, Credenciales, Resenas, Alertas, Referidos, Finanzas };
})();
