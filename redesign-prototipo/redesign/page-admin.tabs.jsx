/* Panel de Administración — tabs de contenido + shell */
(function () {
  const { useTheme, Icon, UI, tx } = window;
  const { Avatar } = UI;
  const { ACard, KpiCard, AdminSidebar, TAB_LABELS, SC, fmt } = window.AdminUI;
  const D = () => window.LUDERIS.ADMIN;

  // ── Mini badge de estado ────────────────────────────────────────────────
  function Tag({ label, color }) {
    return React.createElement("span", { style: { fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: color + "1A", color, border: `1px solid ${color}44`, whiteSpace: "nowrap" } }, label);
  }

  function SectionTitle({ title, sub }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { marginBottom: 16 } },
      React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: C.text } }, title),
      sub && React.createElement("div", { style: { fontSize: 13, color: C.muted, marginTop: 2 } }, sub)
    );
  }

  function ABtn({ label, icon, tone = "default", onClick, sm }) {
    const { C } = useTheme();
    const [h, setH] = React.useState(false);
    const tones = {
      default: { bg: h ? C.surfaceAlt : "transparent", bd: h ? C.borderStrong : C.border, fg: C.textSoft },
      primary: { bg: SC.accent, bd: SC.accent, fg: "#fff" },
      success: { bg: h ? SC.success : SC.success + "1A", bd: SC.success + (h ? "" : "55"), fg: h ? "#fff" : SC.success },
      danger:  { bg: h ? SC.danger : SC.danger + "12", bd: SC.danger + (h ? "" : "55"), fg: h ? "#fff" : SC.danger },
    }[tone];
    return React.createElement("button", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { display: "inline-flex", alignItems: "center", gap: 6, padding: sm ? "6px 11px" : "8px 14px", borderRadius: 9, border: `1px solid ${tones.bd}`, background: tones.bg, color: tones.fg, fontFamily: "inherit", fontSize: sm ? 12.5 : 13.5, fontWeight: 600, cursor: "pointer", transition: "all .14s", whiteSpace: "nowrap" },
    }, icon && React.createElement(Icon, { name: icon, size: sm ? 14 : 15 }), label);
  }

  // ════════ DASHBOARD ════════
  function OverviewTab() {
    const { C } = useTheme();
    const A = D();
    const k = A.kpis;
    const comision = Math.round(k.ingresos * (k.comisionPct / 100));
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 22 } },
      // Alerta moderación
      React.createElement("div", { style: { background: SC.danger + "12", border: `1px solid ${SC.danger}33`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } },
        React.createElement(Icon, { name: "alert-triangle", size: 16, color: SC.danger }),
        React.createElement("span", { style: { fontWeight: 700, color: SC.danger, fontSize: 13 } }, "2 denuncias pendientes de revisión"),
        React.createElement("span", { style: { color: C.muted, fontSize: 12.5 } }, "→ Revisalas en Moderación")
      ),
      // KPIs
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 14 } },
        React.createElement(KpiCard, { label: "Usuarios totales", value: k.usuarios.toLocaleString("es-AR"), trend: 4, trendLabel: `+${k.usuariosHoy} hoy · +${k.usuariosSemana} esta semana`, color: SC.info, icon: "users", spark: A.serie.map((s) => s.u) }),
        React.createElement(KpiCard, { label: "Ingresos totales", value: fmt(k.ingresos), trendLabel: `Comisión Luderis: ${fmt(comision)} (${k.comisionPct}%)`, color: SC.warn, icon: "dollar-sign", spark: A.serie.map((s) => s.i) }),
        React.createElement(KpiCard, { label: "Inscripciones", value: k.inscripciones.toLocaleString("es-AR"), trend: 6, trendLabel: `+${k.inscSemana} esta semana`, color: SC.success, icon: "graduation-cap" }),
        React.createElement(KpiCard, { label: "Tasa de conversión", value: `${k.conversion}%`, trendLabel: `Ticket promedio: ${fmt(k.ticketProm)}`, color: SC.purple, icon: "trending-up" }),
        React.createElement(KpiCard, { label: "Publicaciones activas", value: k.pubsActivas, sub: `${k.pubsInactivas} inactivas`, color: SC.accent, icon: "book-open" }),
        React.createElement(KpiCard, { label: "Rating promedio", value: `${k.rating} ★`, sub: "Sobre todas las reseñas", color: SC.warn, icon: "star" })
      ),
      // Gráfico + donut
      React.createElement("div", { className: "ld-admin-grid", style: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 } },
        React.createElement(ACard, null,
          React.createElement("div", { style: { fontWeight: 700, color: C.text, fontSize: 15 } }, "Actividad — últimos 7 días"),
          React.createElement("div", { style: { fontSize: 12, color: C.muted, marginTop: 2, marginBottom: 18 } }, "Nuevos usuarios e inscripciones"),
          React.createElement(BarsChart, { data: A.serie })
        ),
        React.createElement(ACard, null,
          React.createElement("div", { style: { fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 16 } }, "Distribución de roles"),
          React.createElement(Donut, { data: A.roles })
        )
      ),
      // Feed
      React.createElement(ACard, null,
        React.createElement("div", { style: { fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 14 } }, "Actividad reciente"),
        React.createElement("div", { style: { display: "flex", flexDirection: "column" } },
          A.actividad.map((a, i) => React.createElement(FeedRow, { key: i, a, last: i === A.actividad.length - 1 }))
        )
      )
    );
  }

  const FEED_META = {
    usuario: { icon: "user", color: SC.info }, pago: { icon: "credit-card", color: SC.warn },
    denuncia: { icon: "alert-triangle", color: SC.danger }, inscripcion: { icon: "graduation-cap", color: SC.success },
    queja: { icon: "message-circle", color: SC.accent },
  };
  function FeedRow({ a, last }) {
    const { C } = useTheme();
    const m = FEED_META[a.tipo] || FEED_META.usuario;
    return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: last ? "none" : `1px solid ${C.hairline}` } },
      React.createElement("div", { style: { width: 30, height: 30, borderRadius: 8, background: m.color + "1A", color: m.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: m.icon, size: 14 })),
      React.createElement("div", { style: { flex: 1, fontSize: 13, color: C.text, fontWeight: 500 } }, a.txt),
      React.createElement("div", { style: { fontSize: 12, color: C.faint, whiteSpace: "nowrap" } }, a.hace)
    );
  }

  // Barras agrupadas (usuarios / inscripciones)
  function BarsChart({ data }) {
    const { C } = useTheme();
    const max = Math.max(...data.map((d) => d.u));
    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 14, height: 150 } },
        data.map((d, i) => React.createElement("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 } },
          React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 3, height: 130, width: "100%", justifyContent: "center" } },
            React.createElement("div", { title: `${d.u} usuarios`, style: { width: 12, height: `${(d.u / max) * 100}%`, borderRadius: 4, background: SC.info } }),
            React.createElement("div", { title: `${d.i} inscripciones`, style: { width: 12, height: `${(d.i / max) * 100}%`, borderRadius: 4, background: SC.success } })
          ),
          React.createElement("span", { style: { fontSize: 11, color: C.faint } }, d.d)
        ))
      ),
      React.createElement("div", { style: { display: "flex", gap: 16, marginTop: 14, justifyContent: "center" } },
        React.createElement(Legend, { color: SC.info, label: "Usuarios" }),
        React.createElement(Legend, { color: SC.success, label: "Inscripciones" })
      )
    );
  }
  function Legend({ color, label }) {
    const { C } = useTheme();
    return React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted } },
      React.createElement("span", { style: { width: 9, height: 9, borderRadius: "50%", background: color } }), label);
  }

  // Donut SVG
  function Donut({ data }) {
    const { C } = useTheme();
    const total = data.reduce((s, d) => s + d.value, 0);
    const R = 52, sw = 18, cx = 70, cy = 70, circ = 2 * Math.PI * R;
    let acc = 0;
    return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" } },
      React.createElement("svg", { width: 140, height: 140, viewBox: "0 0 140 140" },
        React.createElement("circle", { cx, cy, r: R, fill: "none", stroke: C.hairline, strokeWidth: sw }),
        data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * circ;
          const el = React.createElement("circle", { key: i, cx, cy, r: R, fill: "none", stroke: d.color, strokeWidth: sw, strokeDasharray: `${dash} ${circ - dash}`, strokeDashoffset: -acc * circ, transform: `rotate(-90 ${cx} ${cy})`, strokeLinecap: "butt" });
          acc += frac;
          return el;
        }),
        React.createElement("text", { x: cx, y: cy - 4, textAnchor: "middle", fontSize: 22, fontWeight: 800, fill: C.text }, total.toLocaleString("es-AR")),
        React.createElement("text", { x: cx, y: cy + 14, textAnchor: "middle", fontSize: 11, fill: C.muted }, "usuarios")
      ),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
        data.map((d, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 } },
          React.createElement("span", { style: { width: 10, height: 10, borderRadius: 3, background: d.color } }),
          React.createElement("span", { style: { color: C.text, fontWeight: 600 } }, d.rol),
          React.createElement("span", { style: { color: C.faint } }, d.value.toLocaleString("es-AR"))
        ))
      )
    );
  }

  // ════════ VERIFICACIONES ════════
  function VerifTab() {
    const { C } = useTheme();
    const [list, setList] = React.useState(D().verificaciones);
    const resolve = (id) => setList((l) => l.filter((v) => v.id !== id));
    if (list.length === 0) return React.createElement(EmptyAdmin, { icon: "shield-check", title: "Sin solicitudes pendientes", sub: "Todas las verificaciones fueron procesadas." });
    return React.createElement("div", null,
      React.createElement(SectionTitle, { title: "Verificaciones pendientes", sub: `${list.length} docente${list.length !== 1 ? "s" : ""} esperando aprobación` }),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
        list.map((v) => React.createElement(ACard, { key: v.id, style: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" } },
          React.createElement(Avatar, { name: v.nombre, size: 46 }),
          React.createElement("div", { style: { flex: 1, minWidth: 200 } },
            React.createElement("div", { style: { fontSize: 14.5, fontWeight: 700, color: C.text } }, v.nombre),
            React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginTop: 1 } }, v.email),
            React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 7, flexWrap: "wrap" } },
              React.createElement(Tag, { label: v.materia, color: SC.accent }),
              React.createElement("span", { style: { fontSize: 12, color: C.textSoft, display: "inline-flex", alignItems: "center", gap: 5 } }, React.createElement(Icon, { name: "file-text", size: 13 }), v.doc))
          ),
          React.createElement("div", { style: { fontSize: 12, color: C.faint, whiteSpace: "nowrap" } }, v.hace),
          React.createElement("div", { style: { display: "flex", gap: 8 } },
            React.createElement(ABtn, { label: "Ver documento", icon: "eye" }),
            React.createElement(ABtn, { label: "Rechazar", icon: "x", tone: "danger", onClick: () => resolve(v.id) }),
            React.createElement(ABtn, { label: "Aprobar", icon: "check", tone: "success", onClick: () => resolve(v.id) }))
        ))
      )
    );
  }

  // ════════ USUARIOS ════════
  const ROL_META = { alumno: { label: "Alumno", color: SC.success }, docente: { label: "Docente", color: SC.accent }, admin: { label: "Admin", color: SC.purple } };
  function UsersTab() {
    const { C } = useTheme();
    const [users, setUsers] = React.useState(D().usuarios);
    const [q, setQ] = React.useState("");
    const toggle = (id) => setUsers((u) => u.map((x) => x.id === id ? { ...x, bloqueado: !x.bloqueado } : x));
    const filtered = users.filter((u) => !q || u.nombre.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()));
    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" } },
        React.createElement(SectionTitle, { title: "Usuarios", sub: `${users.length} registrados` }),
        React.createElement(AdminSearch, { value: q, onChange: setQ, placeholder: "Buscar por nombre o email…" })
      ),
      React.createElement(Table, {
        cols: ["Usuario", "Rol", "Alta", "Estado", ""],
        rows: filtered.map((u) => [
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, React.createElement(Avatar, { name: u.nombre, size: 32 }), React.createElement("div", null, React.createElement("div", { style: { fontSize: 13, fontWeight: 650, color: C.text } }, u.nombre), React.createElement("div", { style: { fontSize: 11.5, color: C.faint } }, u.email))),
          React.createElement(Tag, { label: ROL_META[u.rol].label, color: ROL_META[u.rol].color }),
          React.createElement("span", { style: { fontSize: 12.5, color: C.muted } }, u.alta),
          u.bloqueado ? React.createElement(Tag, { label: "Bloqueado", color: SC.danger }) : React.createElement(Tag, { label: "Activo", color: SC.success }),
          React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "flex-end" } },
            React.createElement(ABtn, { label: u.bloqueado ? "Desbloquear" : "Bloquear", icon: "ban", tone: u.bloqueado ? "default" : "danger", sm: true, onClick: () => toggle(u.id) }))
        ])
      })
    );
  }

  // ════════ PUBLICACIONES ════════
  function PubsTab() {
    const { C } = useTheme();
    const [pubs, setPubs] = React.useState(D().pubsList);
    const toggle = (id) => setPubs((p) => p.map((x) => x.id === id ? { ...x, activo: !x.activo } : x));
    return React.createElement("div", null,
      React.createElement(SectionTitle, { title: "Publicaciones", sub: `${pubs.filter((p) => p.activo).length} activas de ${pubs.length}` }),
      React.createElement(Table, {
        cols: ["Publicación", "Autor", "Tipo", "Precio", "Estado", ""],
        rows: pubs.map((p) => [
          React.createElement("div", null, React.createElement("div", { style: { fontSize: 13, fontWeight: 650, color: C.text } }, p.titulo), React.createElement("div", { style: { fontSize: 11.5, color: C.faint } }, "#" + p.id)),
          React.createElement("span", { style: { fontSize: 12.5, color: C.muted } }, p.autor),
          React.createElement(Tag, { label: p.tipo, color: p.tipo === "Curso" ? SC.accent : SC.warn }),
          React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: C.text } }, fmt(p.precio)),
          p.activo ? React.createElement(Tag, { label: "Activa", color: SC.success }) : React.createElement(Tag, { label: "Inactiva", color: SC.faint || "#888" }),
          React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "flex-end" } },
            React.createElement(ABtn, { label: p.activo ? "Desactivar" : "Activar", sm: true, tone: p.activo ? "default" : "success", onClick: () => toggle(p.id) }),
            React.createElement(ABtn, { label: "Eliminar", icon: "trash", tone: "danger", sm: true }))
        ])
      })
    );
  }

  // ════════ PAGOS ════════
  const PAGO_META = { aprobado: { label: "Aprobado", color: SC.success }, en_disputa: { label: "En disputa", color: SC.danger }, reembolsado: { label: "Reembolsado", color: SC.warn } };
  function PaymentsTab() {
    const { C } = useTheme();
    const A = D();
    const totalAprob = A.pagos.filter((p) => p.estado === "aprobado").reduce((s, p) => s + p.monto, 0);
    return React.createElement("div", null,
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 20 } },
        React.createElement(MiniKpi, { label: "Ingresos del mes", value: fmt(totalAprob), color: SC.success }),
        React.createElement(MiniKpi, { label: "Comisión (10%)", value: fmt(Math.round(totalAprob * .1)), color: SC.warn }),
        React.createElement(MiniKpi, { label: "En disputa", value: A.pagos.filter((p) => p.estado === "en_disputa").length, color: SC.danger })
      ),
      React.createElement(SectionTitle, { title: "Pagos recientes" }),
      React.createElement(Table, {
        cols: ["Fecha", "Monto", "Alumno", "Docente", "Estado"],
        rows: A.pagos.map((p) => [
          React.createElement("span", { style: { fontSize: 12.5, color: C.muted } }, p.fecha),
          React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, fmt(p.monto)),
          React.createElement("span", { style: { fontSize: 12.5, color: C.textSoft } }, p.alumno),
          React.createElement("span", { style: { fontSize: 12.5, color: C.textSoft } }, p.docente),
          React.createElement(Tag, { label: PAGO_META[p.estado].label, color: PAGO_META[p.estado].color })
        ])
      })
    );
  }

  // ════════ ESCROW ════════
  function EscrowTab() {
    const { C } = useTheme();
    const [list, setList] = React.useState(D().escrow);
    const liberar = (id) => setList((l) => l.filter((e) => e.id !== id));
    return React.createElement("div", null,
      React.createElement(SectionTitle, { title: "Fondos en escrow", sub: "Pagos retenidos hasta que se confirme la clase" }),
      list.length === 0
        ? React.createElement(EmptyAdmin, { icon: "package", title: "Sin fondos retenidos", sub: "No hay pagos en escrow por el momento." })
        : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
            list.map((e) => React.createElement(ACard, { key: e.id, style: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" } },
              React.createElement("div", { style: { width: 42, height: 42, borderRadius: 11, background: SC.warn + "1A", color: SC.warn, display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: "package", size: 20 })),
              React.createElement("div", { style: { flex: 1, minWidth: 180 } },
                React.createElement("div", { style: { fontSize: 16, fontWeight: 750, color: C.text } }, fmt(e.monto)),
                React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginTop: 2 } }, `${e.docente} ← ${e.alumno}`)),
              React.createElement(Tag, { label: e.finaliza, color: e.estado === "en_disputa" ? SC.danger : SC.info }),
              e.estado === "en_disputa"
                ? React.createElement(ABtn, { label: "Resolver disputa", icon: "alert-triangle", tone: "danger" })
                : React.createElement(ABtn, { label: "Liberar pago", icon: "check", tone: "success", onClick: () => liberar(e.id) })
            ))
          )
    );
  }

  // ════════ RETIROS ════════
  function RetirosTab() {
    const { C } = useTheme();
    const [list, setList] = React.useState(D().retiros);
    const pay = (id) => setList((l) => l.filter((r) => r.id !== id));
    return React.createElement("div", null,
      React.createElement(SectionTitle, { title: "Solicitudes de retiro", sub: `${list.length} pendiente${list.length !== 1 ? "s" : ""}` }),
      list.length === 0
        ? React.createElement(EmptyAdmin, { icon: "wallet", title: "Sin solicitudes", sub: "No hay retiros pendientes." })
        : React.createElement(Table, {
            cols: ["Docente", "Monto", "Solicitado", "Estado", ""],
            rows: list.map((r) => [
              React.createElement("div", null, React.createElement("div", { style: { fontSize: 13, fontWeight: 650, color: C.text } }, r.docente), React.createElement("div", { style: { fontSize: 11.5, color: C.faint } }, r.email)),
              React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, fmt(r.monto)),
              React.createElement("span", { style: { fontSize: 12.5, color: C.muted } }, r.fecha),
              React.createElement(Tag, { label: "Pendiente", color: SC.warn }),
              React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "flex-end" } }, React.createElement(ABtn, { label: "Marcar pagado", icon: "check", tone: "success", sm: true, onClick: () => pay(r.id) }))
            ])
          })
    );
  }

  // ════════ DENUNCIAS ════════
  function ReportsTab() {
    const { C } = useTheme();
    const [list, setList] = React.useState(D().denuncias);
    const resolve = (id) => setList((l) => l.map((d) => d.id === id ? { ...d, revisada: true } : d));
    return React.createElement("div", null,
      React.createElement(SectionTitle, { title: "Denuncias", sub: `${list.filter((d) => !d.revisada).length} sin revisar` }),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
        list.map((d) => React.createElement(ACard, { key: d.id, style: { display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap", opacity: d.revisada ? .6 : 1, borderColor: d.revisada ? C.border : SC.danger + "44" } },
          React.createElement("div", { style: { width: 38, height: 38, borderRadius: 10, background: SC.danger + "1A", color: SC.danger, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "alert-triangle", size: 18 })),
          React.createElement("div", { style: { flex: 1, minWidth: 200 } },
            React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.text } }, d.motivo),
            React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginTop: 2 } }, d.sobre),
            React.createElement("div", { style: { fontSize: 12, color: C.faint, marginTop: 4 } }, d.hace)),
          d.revisada
            ? React.createElement(Tag, { label: "Resuelta", color: SC.success })
            : React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
                React.createElement(ABtn, { label: "Descartar", sm: true, onClick: () => resolve(d.id) }),
                React.createElement(ABtn, { label: "Eliminar publicación", icon: "trash", tone: "danger", sm: true, onClick: () => resolve(d.id) }))
        ))
      )
    );
  }

  // ════════ CONFIG ════════
  function ConfigTab() {
    const { C } = useTheme();
    const [cfg, setCfg] = React.useState({ comision_pct: 10, max_publicaciones_docente: 20, verificacion_ia_activa: true, mp_activo: true, stripe_activo: true });
    const [saving, setSaving] = React.useState(false);
    const set = (k, v) => setCfg((p) => ({ ...p, [k]: v }));
    const save = () => { setSaving(true); setTimeout(() => setSaving(false), 900); };

    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16, maxWidth: 680 } },

      // Pagos y comisiones
      React.createElement(ACard, null,
        React.createElement(CfgHead, { icon: "credit-card", title: "Pagos y comisiones" }),
        React.createElement(CfgRow, { label: "Comisión de Luderis", sub: "Porcentaje que retiene Luderis de cada transacción" },
          React.createElement(NumField, { value: cfg.comision_pct, min: 0, max: 50, onChange: (v) => set("comision_pct", v), suffix: "%" })),
        React.createElement(CfgRow, { label: "Mercado Pago activo", sub: "Habilitar pagos con MP" },
          React.createElement(Switch, { on: cfg.mp_activo, onChange: () => set("mp_activo", !cfg.mp_activo) })),
        React.createElement(CfgRow, { label: "Stripe activo", sub: "Habilitar pagos con tarjeta (USD/EUR)", last: true },
          React.createElement(Switch, { on: cfg.stripe_activo, onChange: () => set("stripe_activo", !cfg.stripe_activo) }))
      ),

      // Publicaciones
      React.createElement(ACard, null,
        React.createElement(CfgHead, { icon: "book-open", title: "Publicaciones" }),
        React.createElement(CfgRow, { label: "Máx. publicaciones por docente", sub: "Límite de publicaciones activas por usuario" },
          React.createElement(NumField, { value: cfg.max_publicaciones_docente, min: 1, max: 100, onChange: (v) => set("max_publicaciones_docente", v) })),
        React.createElement(CfgRow, { label: "Verificación IA activa", sub: "Requerir verificación de conocimiento al publicar", last: true },
          React.createElement(Switch, { on: cfg.verificacion_ia_activa, onChange: () => set("verificacion_ia_activa", !cfg.verificacion_ia_activa) }))
      ),

      // Administradores
      React.createElement(ACard, null,
        React.createElement(CfgHead, { icon: "user", title: "Administradores" }),
        React.createElement("div", { style: { fontSize: 13, color: C.muted, lineHeight: 1.6 } },
          "Cambiá el rol de un usuario a ", React.createElement("strong", { style: { color: C.text } }, "Admin"), " desde la tabla de Usuarios para darle acceso al panel.")
      ),

      React.createElement("div", null,
        React.createElement(ABtn, { label: saving ? "Guardando…" : "Guardar configuración", icon: "check", tone: "primary", onClick: save }))
    );
  }

  function CfgHead({ icon, title }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, marginBottom: 6 } },
      React.createElement("div", { style: { width: 30, height: 30, borderRadius: 8, background: SC.accent + "1A", color: SC.accent, display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: icon, size: 16 })),
      React.createElement("div", { style: { fontWeight: 700, color: C.text, fontSize: 15 } }, title));
  }

  function CfgRow({ label, sub, last, children }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 0", borderBottom: last ? "none" : `1px solid ${C.hairline}` } },
      React.createElement("div", { style: { minWidth: 0 } },
        React.createElement("div", { style: { fontSize: 13.5, fontWeight: 600, color: C.text } }, label),
        sub && React.createElement("div", { style: { fontSize: 12, color: C.muted, marginTop: 2 } }, sub)),
      React.createElement("div", { style: { flexShrink: 0 } }, children));
  }

  function NumField({ value, min, max, onChange, suffix }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7 } },
      React.createElement("input", { type: "number", min, max, value, onChange: (e) => onChange(Number(e.target.value)), style: { width: 72, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", textAlign: "center" } }),
      suffix && React.createElement("span", { style: { color: C.muted, fontSize: 14 } }, suffix));
  }

  function Switch({ on, onChange }) {
    const { C } = useTheme();
    return React.createElement("button", { onClick: onChange, style: { width: 46, height: 26, borderRadius: 13, border: "none", cursor: "pointer", background: on ? SC.accent : C.borderStrong, position: "relative", flexShrink: 0, transition: "background .16s" } },
      React.createElement("span", { style: { position: "absolute", top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .16s", boxShadow: "0 1px 3px rgba(0,0,0,.3)" } }));
  }

  // ════════ ANUNCIOS GLOBALES ════════
  const ANUNCIO_TIPOS = [
    { id: "info", label: "Info", color: SC.info },
    { id: "success", label: "Éxito", color: SC.success },
    { id: "warn", label: "Aviso", color: SC.warn },
    { id: "danger", label: "Urgente", color: SC.danger },
  ];
  function NotifsTab() {
    const { C } = useTheme();
    const [titulo, setTitulo] = React.useState("");
    const [mensaje, setMensaje] = React.useState("");
    const [tipo, setTipo] = React.useState("info");
    const [hist, setHist] = React.useState(D().anuncios);
    const [sending, setSending] = React.useState(false);
    const enviar = () => {
      if (!titulo.trim() || !mensaje.trim()) return;
      setSending(true);
      setTimeout(() => {
        setHist((h) => [{ id: "a" + Date.now(), titulo, mensaje, tipo, fecha: "hoy", destinatarios: D().kpis.usuarios }, ...h]);
        setTitulo(""); setMensaje(""); setTipo("info"); setSending(false);
      }, 800);
    };
    const tColor = (t) => (ANUNCIO_TIPOS.find((x) => x.id === t) || ANUNCIO_TIPOS[0]).color;
    const inputStyle = { width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 12px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
    const lbl = (t) => React.createElement("div", { style: { fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" } }, t);

    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16, maxWidth: 680 } },
      // Form
      React.createElement(ACard, null,
        React.createElement(CfgHead, { icon: "megaphone", title: "Enviar anuncio global" }),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14, marginTop: 8 } },
          React.createElement("div", null, lbl("Tipo"),
            React.createElement("div", { style: { display: "flex", gap: 7, flexWrap: "wrap" } },
              ANUNCIO_TIPOS.map((t) => {
                const active = tipo === t.id;
                return React.createElement("button", { key: t.id, onClick: () => setTipo(t.id),
                  style: { background: active ? t.color : t.color + "1F", border: "none", borderRadius: 8, padding: "7px 15px", fontSize: 12.5, fontWeight: 700, color: active ? "#fff" : t.color, cursor: "pointer", fontFamily: "inherit" } }, t.label);
              }))),
          React.createElement("div", null, lbl("Título"),
            React.createElement("input", { value: titulo, onChange: (e) => setTitulo(e.target.value), placeholder: "Ej: Actualización importante de Luderis", style: inputStyle })),
          React.createElement("div", null, lbl("Mensaje"),
            React.createElement("textarea", { value: mensaje, onChange: (e) => setMensaje(e.target.value), placeholder: "Detalle de la notificación…", rows: 3, style: { ...inputStyle, resize: "vertical", lineHeight: 1.5 } })),
          React.createElement("div", null,
            React.createElement(ABtn, { label: sending ? "Enviando…" : "Publicar anuncio a todos los usuarios", icon: "megaphone", tone: "primary", onClick: enviar }))
        )
      ),
      // Historial
      React.createElement(ACard, null,
        React.createElement("div", { style: { fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 14 } }, "Historial de anuncios"),
        hist.length === 0
          ? React.createElement("div", { style: { color: C.muted, fontSize: 13 } }, "Sin anuncios enviados aún.")
          : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
              hist.map((n) => React.createElement("div", { key: n.id, style: { background: C.surfaceAlt, borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${tColor(n.tipo)}` } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" } },
                  React.createElement("span", { style: { fontWeight: 700, color: C.text, fontSize: 13.5 } }, n.titulo),
                  React.createElement("span", { style: { fontSize: 11.5, color: C.faint, whiteSpace: "nowrap" } }, `${n.fecha} · ${n.destinatarios.toLocaleString("es-AR")} usuarios`)),
                React.createElement("div", { style: { fontSize: 12.5, color: C.muted, lineHeight: 1.5 } }, n.mensaje)
              ))
            )
      )
    );
  }

  // ════════ DOCENTES ════════
  function DocentesTab() {
    const { C } = useTheme();
    const [sort, setSort] = React.useState("inscriptos");
    const [exp, setExp] = React.useState(null);
    const list = [...D().docentes].sort((a, b) => sort === "rating" ? b.rating - a.rating : b.inscriptos - a.inscriptos);
    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" } },
        React.createElement(SectionTitle, { title: `Docentes (${list.length})` }),
        React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 6 } },
          React.createElement(ABtn, { label: "Por inscripciones", sm: true, tone: sort === "inscriptos" ? "primary" : "default", onClick: () => setSort("inscriptos") }),
          React.createElement(ABtn, { label: "Por rating", sm: true, tone: sort === "rating" ? "primary" : "default", onClick: () => setSort("rating") }))
      ),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
        list.map((d) => {
          const open = exp === d.email;
          return React.createElement("div", { key: d.email, style: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" } },
            React.createElement("div", { onClick: () => setExp(open ? null : d.email), style: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" } },
              React.createElement(Avatar, { name: d.nombre, size: 38 }),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 13.5, fontWeight: 700, color: C.text } }, d.nombre),
                React.createElement("div", { style: { fontSize: 11.5, color: C.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, d.email)),
              React.createElement("div", { style: { display: "flex", gap: 18, alignItems: "center", flexShrink: 0 } },
                React.createElement(DocStat, { value: d.inscriptos, label: "Inscriptos", color: SC.info }),
                React.createElement(DocStat, { value: d.cursos, label: "Cursos", color: SC.accent }),
                React.createElement(DocStat, { value: `★ ${d.rating.toFixed(1)}`, label: "Rating", color: SC.warn }),
                React.createElement(Icon, { name: "chevron-right", size: 16, color: C.faint, style: { transform: open ? "rotate(90deg)" : "none", transition: "transform .16s" } }))
            ),
            open && React.createElement("div", { style: { borderTop: `1px solid ${C.hairline}`, padding: "12px 16px", background: C.surfaceAlt } },
              React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" } }, "Publicaciones"),
              React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 7 } },
                d.pubs.map((p, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 9 } },
                  React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: p.activo ? SC.success : C.faint, flexShrink: 0 } }),
                  React.createElement("span", { style: { flex: 1, fontSize: 12.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, p.titulo),
                  React.createElement("span", { style: { fontSize: 12, color: C.muted } }, fmt(p.precio)),
                  React.createElement("span", { style: { fontSize: 11, color: p.activo ? SC.success : C.faint } }, p.activo ? "activa" : "inactiva")
                )))
            )
          );
        })
      )
    );
  }
  function DocStat({ value, label, color }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { textAlign: "center" } },
      React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color } }, value),
      React.createElement("div", { style: { fontSize: 10, color: C.muted } }, label));
  }

  // ════════ QUEJAS ════════
  const QUEJA_META = {
    recibida: { label: "Recibida", color: SC.info }, en_revision: { label: "En revisión", color: SC.warn },
    resuelta: { label: "Resuelta", color: SC.success }, cerrada: { label: "Cerrada", color: "#94A3B8" },
  };
  function QuejasTab() {
    const { C } = useTheme();
    const [quejas, setQuejas] = React.useState(D().quejas);
    const [filtro, setFiltro] = React.useState("todas");
    const [open, setOpen] = React.useState(null);
    const setEstado = (id, est) => setQuejas((qs) => qs.map((q) => q.id === id ? { ...q, estado: est } : q));
    const stats = ["recibida", "en_revision", "resuelta", "cerrada"].map((e) => quejas.filter((q) => q.estado === e).length);
    const filtered = quejas.filter((q) => filtro === "todas" || q.estado === filtro);
    return React.createElement("div", null,
      stats[0] > 0 && React.createElement("div", { style: { background: SC.info + "12", border: `1px solid ${SC.info}33`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 18 } },
        React.createElement(Icon, { name: "message-circle", size: 16, color: SC.info }),
        React.createElement("span", { style: { fontWeight: 700, color: SC.info, fontSize: 13 } }, `${stats[0]} queja${stats[0] > 1 ? "s" : ""} sin revisar`),
        React.createElement("span", { style: { color: C.muted, fontSize: 12.5 } }, "→ Cambiá el estado a “En revisión” para iniciar seguimiento")),
      // Stats
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 12, marginBottom: 18 } },
        React.createElement(MiniKpi, { label: "Total", value: quejas.length, color: C.text }),
        React.createElement(MiniKpi, { label: "Recibidas", value: stats[0], color: SC.info }),
        React.createElement(MiniKpi, { label: "En revisión", value: stats[1], color: SC.warn }),
        React.createElement(MiniKpi, { label: "Resueltas", value: stats[2], color: SC.success })),
      // Filtros
      React.createElement("div", { style: { display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 } },
        ["todas", "recibida", "en_revision", "resuelta", "cerrada"].map((e) => React.createElement(ABtn, { key: e, label: e === "todas" ? "Todas" : QUEJA_META[e].label, sm: true, tone: filtro === e ? "primary" : "default", onClick: () => setFiltro(e) }))),
      // Lista
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
        filtered.map((q) => {
          const m = QUEJA_META[q.estado];
          const isOpen = open === q.id;
          return React.createElement("div", { key: q.id, style: { background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${m.color}`, borderRadius: 12, padding: "14px 16px" } },
            React.createElement("div", { onClick: () => setOpen(isOpen ? null : q.id), style: { cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 12 } },
              React.createElement("div", { style: { minWidth: 0 } },
                React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" } },
                  React.createElement("span", { style: { fontFamily: "monospace", fontSize: 12.5, fontWeight: 800, color: SC.accent } }, q.numero),
                  React.createElement(Tag, { label: m.label, color: m.color }),
                  React.createElement("span", { style: { fontSize: 11.5, color: C.faint } }, q.fecha)),
                React.createElement("div", { style: { fontSize: 13, color: C.text } }, React.createElement("strong", null, q.nombre), React.createElement("span", { style: { color: C.muted, marginLeft: 8 } }, q.email)),
                React.createElement("div", { style: { fontSize: 12.5, color: C.muted, fontStyle: "italic", marginTop: 2 } }, q.categoria)),
              React.createElement(Icon, { name: "chevron-right", size: 16, color: C.faint, style: { transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .16s", flexShrink: 0 } })),
            isOpen && React.createElement("div", { style: { marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.hairline}` } },
              React.createElement("div", { style: { fontSize: 13.5, color: C.textSoft, lineHeight: 1.6, marginBottom: 12 } }, q.descripcion),
              React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
                React.createElement(ABtn, { label: "En revisión", sm: true, onClick: () => setEstado(q.id, "en_revision") }),
                React.createElement(ABtn, { label: "Resolver", sm: true, tone: "success", onClick: () => setEstado(q.id, "resuelta") }),
                React.createElement(ABtn, { label: "Cerrar", sm: true, onClick: () => setEstado(q.id, "cerrada") })))
          );
        })
      )
    );
  }

  // ════════ LIQUIDACIONES ════════
  function LiquidacionesTab() {
    const { C } = useTheme();
    const L = D().liquidaciones;
    const totalNeto = L.reduce((s, l) => s + l.neto, 0);
    const totalCom = L.reduce((s, l) => s + l.comision, 0);
    const totalClases = L.reduce((s, l) => s + l.clases, 0);
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
      // Generador
      React.createElement(ACard, null,
        React.createElement(CfgHead, { icon: "file-text", title: "Generar liquidaciones" }),
        React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginTop: 8 } },
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" } }, "Período"),
            React.createElement("input", { type: "month", defaultValue: "2026-05", style: { background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" } })),
          React.createElement("div", { style: { flex: 1, minWidth: 200 } },
            React.createElement("div", { style: { fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" } }, "Docente (opcional — vacío = todos)"),
            React.createElement("input", { placeholder: "email@docente.com", style: { width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" } })),
          React.createElement(ABtn, { label: "Generar liquidaciones", icon: "file-text", tone: "primary" })),
        React.createElement("div", { style: { marginTop: 10, fontSize: 12, color: C.muted } }, "Genera PDFs, los sube a Storage y envía emails a los docentes.")
      ),
      // Stats
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 } },
        React.createElement(MiniKpi, { label: "Docentes", value: L.length, color: SC.accent }),
        React.createElement(MiniKpi, { label: "Clases totales", value: totalClases, color: SC.info }),
        React.createElement(MiniKpi, { label: "Neto a pagar", value: fmt(totalNeto), color: SC.success }),
        React.createElement(MiniKpi, { label: "Comisiones", value: fmt(totalCom), color: SC.warn })),
      // Tabla
      React.createElement(SectionTitle, { title: "Liquidaciones — Mayo 2026" }),
      React.createElement(Table, {
        cols: ["Docente", "Período", "Clases", "Neto", "Comisión", ""],
        rows: L.map((l) => [
          React.createElement("span", { style: { fontSize: 12.5, color: C.text, fontWeight: 600 } }, l.docente),
          React.createElement("span", { style: { fontSize: 12.5, color: C.muted } }, l.periodo),
          React.createElement("span", { style: { fontSize: 13, color: C.text } }, l.clases),
          React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: SC.success } }, fmt(l.neto)),
          React.createElement("span", { style: { fontSize: 12.5, color: SC.warn } }, fmt(l.comision)),
          React.createElement("div", { style: { display: "flex", justifyContent: "flex-end" } }, React.createElement(ABtn, { label: "PDF", icon: "file-text", sm: true }))
        ])
      })
    );
  }

  // ════════ ANTI-PUENTEO ════════
  function AntipuenteoTab() {
    const { C } = useTheme();
    const [list, setList] = React.useState(D().antipuenteo);
    const [solo, setSolo] = React.useState(true);
    const act = (id, tipo) => setList((l) => l.map((a) => a.id === id ? { ...a, revisada: true, advertencias: tipo === "advertir" ? a.advertencias + 1 : a.advertencias, bloqueado: tipo === "bloquear" } : a));
    const shown = list.filter((a) => !solo || !a.revisada);
    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" } },
        React.createElement(SectionTitle, { title: "Intentos de contacto externo", sub: "Mensajes bloqueados por compartir datos fuera de Luderis" }),
        React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text, cursor: "pointer" } },
          React.createElement("input", { type: "checkbox", checked: solo, onChange: (e) => setSolo(e.target.checked) }), "Solo no revisadas")),
      shown.length === 0
        ? React.createElement(EmptyAdmin, { icon: "bell-off", title: "Sin alertas pendientes", sub: "No hay intentos de contacto externo sin revisar." })
        : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
            shown.map((a) => React.createElement("div", { key: a.id, style: { background: C.surface, border: `1px solid ${a.revisada ? C.border : SC.danger + "44"}`, borderRadius: 12, padding: "14px 16px", opacity: a.revisada ? .65 : 1 } },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" } },
                React.createElement("div", { style: { width: 34, height: 34, borderRadius: 9, background: SC.danger + "1A", color: SC.danger, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "bell-off", size: 16 })),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text } }, a.autor),
                  React.createElement("div", { style: { fontSize: 11.5, color: C.faint } }, `Para ${a.contra} · ${a.fecha}`)),
                a.advertencias > 0 && React.createElement(Tag, { label: `${a.advertencias} advertencia${a.advertencias > 1 ? "s" : ""}`, color: SC.warn }),
                a.bloqueado && React.createElement(Tag, { label: "Bloqueado", color: SC.danger })),
              React.createElement("div", { style: { background: C.surfaceAlt, borderRadius: 9, padding: "10px 13px", fontSize: 13, color: C.textSoft, fontStyle: "italic", marginBottom: a.revisada ? 0 : 12 } }, `“${a.mensaje}”`),
              !a.revisada && React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
                React.createElement(ABtn, { label: "Marcar revisada", sm: true, onClick: () => act(a.id, "revisar") }),
                React.createElement(ABtn, { label: "Advertir", icon: "alert-triangle", sm: true, tone: "default", onClick: () => act(a.id, "advertir") }),
                React.createElement(ABtn, { label: "Bloquear usuario", icon: "ban", sm: true, tone: "danger", onClick: () => act(a.id, "bloquear") }))
            ))
          )
    );
  }

  // ── Placeholder para tabs no desarrollados ───────────────────────────────
  function SoonTab({ label }) {
    return React.createElement(EmptyAdmin, { icon: "sparkles", title: label, sub: "Esta sección está disponible en el panel completo." });
  }

  // ── Helpers compartidos ───────────────────────────────────────────────────
  function MiniKpi({ label, value, color }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" } },
      React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em" } }, label),
      React.createElement("div", { style: { fontSize: 24, fontWeight: 800, color: color || C.text, marginTop: 6, lineHeight: 1 } }, value));
  }

  function AdminSearch({ value, onChange, placeholder }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 12px", minWidth: 240 } },
      React.createElement(Icon, { name: "search", size: 16, color: C.faint }),
      React.createElement("input", { value, onChange: (e) => onChange(e.target.value), placeholder, style: { border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: C.text, flex: 1 } }));
  }

  function EmptyAdmin({ icon, title, sub }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { textAlign: "center", padding: "60px 0", color: C.faint } },
      React.createElement(Icon, { name: icon, size: 38, stroke: 1.4 }),
      React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: C.textSoft, marginTop: 14 } }, title),
      React.createElement("div", { style: { fontSize: 13, marginTop: 4 } }, sub));
  }

  function Table({ cols, rows }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", overflowX: "auto" } },
      React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", minWidth: 600 } },
        React.createElement("thead", null, React.createElement("tr", { style: { background: C.surfaceAlt } },
          cols.map((c, i) => React.createElement("th", { key: i, style: { textAlign: i === cols.length - 1 ? "right" : "left", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em", padding: "11px 16px", whiteSpace: "nowrap" } }, c)))),
        React.createElement("tbody", null,
          rows.map((r, ri) => React.createElement("tr", { key: ri, style: { borderTop: `1px solid ${C.hairline}` } },
            r.map((cell, ci) => React.createElement("td", { key: ci, style: { padding: "12px 16px", verticalAlign: "middle", textAlign: ci === r.length - 1 ? "right" : "left" } }, cell))))
        )
      )
    );
  }

  // ════════ SHELL ════════
  const TAB_COMPONENTS = {
    overview: OverviewTab, verif: VerifTab, users: UsersTab, pubs: PubsTab, docentes: DocentesTab,
    payments: PaymentsTab, escrow: EscrowTab, retiros: RetirosTab, liquidaciones: LiquidacionesTab,
    reports: ReportsTab, quejas: QuejasTab, antipuenteo: AntipuenteoTab, notifs: NotifsTab, config: ConfigTab,
  };

  function AdminPanel({ onClose }) {
    const { C } = useTheme();
    const [tab, setTabRaw] = React.useState("overview");
    const [sbOpen, setSbOpen] = React.useState(false);
    const isMobile = window.innerWidth < 768;
    const setTab = (id, justClose) => { if (!justClose) setTabRaw(id); setSbOpen(false); };
    const badges = { verif: D().verificaciones.length, escrow: D().escrow.length, retiros: D().retiros.length, reports: D().denuncias.filter((d) => !d.revisada).length };
    const Comp = TAB_COMPONENTS[tab] || (() => React.createElement(SoonTab, { label: TAB_LABELS[tab] }));

    return React.createElement("div", { style: { position: "fixed", inset: 0, background: C.bg, zIndex: 200, fontFamily: "inherit", display: "flex" } },
      React.createElement("style", null, `@media(max-width:900px){.ld-admin-grid{grid-template-columns:1fr !important;}}`),
      React.createElement(AdminSidebar, { tab, setTab, badges, onExit: onClose, open: sbOpen, isMobile }),
      React.createElement("div", { style: { marginLeft: isMobile ? 0 : 224, flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%", overflowY: "auto" } },
        // Topbar
        React.createElement("div", { style: { background: C.surface, borderBottom: `1px solid ${C.border}`, padding: isMobile ? "0 14px" : "0 28px", height: 58, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10, flexShrink: 0 } },
          isMobile && React.createElement("button", { onClick: () => setSbOpen((o) => !o), style: { background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", color: C.text } }, React.createElement(Icon, { name: sbOpen ? "x" : "menu", size: 20 })),
          React.createElement("div", { style: { minWidth: 0 } },
            React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: "-.01em" } }, TAB_LABELS[tab]),
            !isMobile && React.createElement("div", { style: { fontSize: 11.5, color: C.muted } }, "Luderis Admin · camila@email.com")),
          React.createElement("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 } },
            React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, background: SC.success + "1A", border: `1px solid ${SC.success}44`, borderRadius: 20, padding: "4px 12px", fontSize: 11.5, fontWeight: 700, color: SC.success } }, React.createElement("span", { style: { width: 7, height: 7, borderRadius: "50%", background: SC.success } }), "En vivo")
          )
        ),
        // Contenido
        React.createElement("div", { style: { flex: 1, padding: isMobile ? "16px 14px 60px" : "26px 30px 60px", maxWidth: 1180, width: "100%", boxSizing: "border-box" } },
          React.createElement(Comp, null)
        )
      )
    );
  }

  window.AdminPanel = AdminPanel;
})();
