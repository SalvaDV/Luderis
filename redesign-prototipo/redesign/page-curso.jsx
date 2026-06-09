/* Página de curso/clase — material, sesiones, info, FAQs */
(function () {
  const { useTheme, Icon, UI, tx, PageKit } = window;
  const { Avatar, VerifiedBadge } = UI;
  const { PageTitle } = PageKit;

  const TIPO_META = {
    video:  { icon: "play-circle",   color: "#1A6ED8", label: "Video" },
    pdf:    { icon: "file-text",     color: "#B96A12", label: "PDF"   },
    link:   { icon: "globe",         color: "#0F9C82", label: "Link"  },
    tarea:  { icon: "edit",          color: "#6A49DE", label: "Tarea" },
  };

  function PageCurso({ inscripcionId, onBack }) {
    const { C, A } = useTheme();
    const [tab, setTab] = React.useState("material");
    const INS = window.LUDERIS.INSCRIPCIONES || [];
    const ins = INS.find((i) => i.id === inscripcionId) || INS[0];
    if (!ins) return null;

    const isCurso = !ins.modalidad || ins.modalidad !== "presencial" || ins.rol === "alumno";
    const ac = ins.rol === "docente" ? A.clase : A.curso;
    const material = (window.LUDERIS.MATERIAL || {})[ins.id];
    const post = (window.LUDERIS.POSTS || []).find((p) => p.id === ins.postId);
    const esParticular = post ? post.modo === "particular" : ins.modalidad === "presencial";

    // Barra de progreso
    const pct = Math.round((ins.progreso || 0) * 100);

    return React.createElement("div", null,

      // ── Header ───────────────────────────────────────────────────────────
      React.createElement("button", {
        onClick: onBack,
        style: { display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: C.muted, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20, padding: 0 },
      }, React.createElement(Icon, { name: "arrow-left", size: 15 }), "Mis clases"),

      React.createElement("div", {
        style: { background: ac.heroGrad, borderRadius: 18, padding: "26px 28px 22px", marginBottom: 24, position: "relative", overflow: "hidden" },
      },
        React.createElement("div", { style: { position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,.05)", top: -70, right: -50, pointerEvents: "none" } }),
        React.createElement("div", { style: { position: "relative", zIndex: 1 } },
          React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16, flexWrap: "wrap" } },
            React.createElement("div", { style: { flex: 1, minWidth: 200 } },
              React.createElement("div", { style: { fontSize: 12, fontWeight: 650, color: "rgba(255,255,255,.7)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 } },
                ins.materia),
              React.createElement("h1", { style: { ...tx("display"), color: "#fff", margin: "0 0 10px", fontSize: 22, lineHeight: 1.25, textShadow: "0 1px 8px rgba(0,0,0,.12)" } }, ins.titulo),
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,.85)" } },
                React.createElement(Avatar, { name: ins.docente === "Vos" ? "Camila" : ins.docente, size: 26 }),
                React.createElement("span", null, ins.docente === "Vos" ? "Tu clase" : ins.docente),
                React.createElement("span", { style: { color: "rgba(255,255,255,.4)" } }, "·"),
                React.createElement(Icon, { name: ins.modalidad === "presencial" ? "map-pin" : "monitor", size: 13 }),
                React.createElement("span", { style: { textTransform: "capitalize" } }, ins.modalidad),
                ins.proxima && React.createElement(React.Fragment, null,
                  React.createElement("span", { style: { color: "rgba(255,255,255,.4)" } }, "·"),
                  React.createElement(Icon, { name: "calendar", size: 13 }),
                  React.createElement("span", null, ins.proxima)
                )
              )
            ),
            ins.estado === "en_curso" && ins.proxima && React.createElement("button", {
              onClick: () => window.__ldToast && window.__ldToast(`Te unís a “${ins.titulo}”`, "success"),
              style: { display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 11, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 650, color: ac.text, background: "#fff", whiteSpace: "nowrap", flexShrink: 0 },
            }, React.createElement(Icon, { name: "play-circle", size: 17 }), "Unirse a la clase")
          ),
          // Progreso
          ins.progreso > 0 && React.createElement("div", null,
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "rgba(255,255,255,.8)", marginBottom: 6, fontWeight: 500 } },
              React.createElement("span", null, "Progreso del curso"),
              React.createElement("span", { style: { fontWeight: 700, color: "#fff" } }, `${pct}% completado`)
            ),
            React.createElement("div", { style: { height: 7, borderRadius: 4, background: "rgba(255,255,255,.2)", overflow: "hidden" } },
              React.createElement("div", { style: { height: "100%", width: `${pct}%`, borderRadius: 4, background: "#fff", transition: "width .4s ease" } })
            )
          )
        )
      ),

      // ── Tabs ─────────────────────────────────────────────────────────────
      React.createElement("div", {
        className: "ld-scroll",
        style: { display: "flex", gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 24, overflowX: "auto" },
      },
        [["material","Material","book-open"],["sesiones","Sesiones","calendar"],["practicas","Pr\u00e1cticas","sparkles"],["comunidad", esParticular ? "Chat" : "Comunidad","message-circle"],["info","Info","info"]].map(([id, label, icon]) =>
          React.createElement("button", {
            key: id, onClick: () => setTab(id),
            style: { position: "relative", display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: tab === id ? 700 : 500, color: tab === id ? ac.text : C.muted },
          },
            React.createElement(Icon, { name: icon, size: 15, stroke: tab === id ? 2.2 : 1.8 }),
            label,
            tab === id && React.createElement("span", { style: { position: "absolute", left: 6, right: 6, bottom: -1, height: 2.5, borderRadius: 3, background: ac.solid } })
          )
        )
      ),

      // ── Contenido ────────────────────────────────────────────────────────
      tab === "material" && React.createElement(MaterialTab, { material, ac }),
      tab === "sesiones" && React.createElement(SesionesTab, { ins, ac }),
      tab === "practicas" && React.createElement(PracticasTab, { ins, ac, esParticular }),
      tab === "comunidad" && React.createElement(ComunidadTab, { ins, ac, esParticular }),
      tab === "info"     && React.createElement(InfoTab, { ins, ac }),
    );
  }

  // ── Tab: Material ─────────────────────────────────────────────────────────
  function MaterialTab({ material, ac }) {
    const { C } = useTheme();
    if (!material) return React.createElement("div", { style: { textAlign: "center", padding: "48px 0", color: C.faint } },
      React.createElement(Icon, { name: "book-open", size: 36, stroke: 1.4 }),
      React.createElement("p", { style: { marginTop: 12, fontSize: 14 } }, "El material estará disponible cuando empiece el curso.")
    );
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 24 } },
      material.unidades.map((u, ui) =>
        React.createElement("div", { key: ui },
          React.createElement("h3", { style: { fontSize: 13.5, fontWeight: 700, color: C.text, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: ".04em" } }, u.titulo),
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
            u.items.map((it, ii) => React.createElement(MaterialItem, { key: ii, it, ac }))
          )
        )
      )
    );
  }

  function MaterialItem({ it, ac }) {
    const { C } = useTheme();
    const meta = TIPO_META[it.tipo] || TIPO_META.link;
    const [h, setH] = React.useState(false);
    return React.createElement("div", {
      onClick: () => { if (!it.bloqueado) window.__ldToast && window.__ldToast(`Abriendo: ${it.label}`, "info"); },
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: {
        display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
        background: it.bloqueado ? C.surfaceAlt : C.surface,
        border: `1px solid ${h && !it.bloqueado ? C.borderStrong : C.border}`,
        borderRadius: 11, cursor: it.bloqueado ? "default" : "pointer",
        opacity: it.bloqueado ? .55 : 1, transition: "all .14s",
      },
    },
      // Icono tipo
      React.createElement("div", {
        style: { width: 36, height: 36, borderRadius: 9, background: it.bloqueado ? C.surfaceAlt : `${meta.color}18`, color: it.bloqueado ? C.faint : meta.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
      }, React.createElement(Icon, { name: it.bloqueado ? "lock" : meta.icon, size: 18, stroke: 1.9 })),
      // Info
      React.createElement("div", { style: { flex: 1, minWidth: 0 } },
        React.createElement("div", { style: { fontSize: 13.5, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, it.label),
        it.dur && React.createElement("div", { style: { fontSize: 12, color: C.faint, marginTop: 2 } }, it.dur)
      ),
      // Estado derecho
      it.proximo
        ? React.createElement("span", { style: { fontSize: 11.5, fontWeight: 650, color: C.teal, background: C.key === "dark" ? "#10271F" : "#E7F6F1", borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap" } }, "En vivo hoy")
        : it.entregado
          ? React.createElement("span", { style: { fontSize: 11.5, fontWeight: 650, color: ac.text, background: ac.soft, borderRadius: 6, padding: "3px 8px" } }, "Entregado")
          : it.visto
            ? React.createElement(Icon, { name: "check", size: 16, stroke: 2.5, color: C.teal })
            : !it.bloqueado && React.createElement("span", { style: { fontSize: 11.5, color: C.faint } }, "Pendiente")
    );
  }

  // ── Tab: Sesiones ─────────────────────────────────────────────────────────
  const SESIONES_MOCK = [
    { n: 1, titulo: "Evaluación de nivel y presentación",  fecha: "29 may · 18:00", dur: "62 min", grabacion: true,  estado: "pasada" },
    { n: 2, titulo: "Presente simple — rutinas y hábitos", fecha: "3 jun · 18:00",  dur: "58 min", grabacion: true,  estado: "pasada" },
    { n: 3, titulo: "Pasado simple — hechos y anécdotas",  fecha: "8 jun · 18:00",  dur: null,     grabacion: false, estado: "proxima" },
    { n: 4, titulo: "Futuro — planes y predicciones",       fecha: "12 jun · 18:00", dur: null,     grabacion: false, estado: "pendiente" },
    { n: 5, titulo: "Repaso intermedio + ejercicios oral",  fecha: "15 jun · 18:00", dur: null,     grabacion: false, estado: "pendiente" },
  ];
  function SesionesTab({ ins, ac }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
      SESIONES_MOCK.map((s) => {
        const isPasada = s.estado === "pasada";
        const isProxima = s.estado === "proxima";
        return React.createElement("div", {
          key: s.n,
          style: { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: C.surface, border: `1px solid ${isProxima ? ac.solid : C.border}`, borderRadius: 12, boxShadow: isProxima ? `0 0 0 3px ${ac.ring}` : C.shadow },
        },
          // Número
          React.createElement("div", {
            style: { width: 36, height: 36, borderRadius: 10, background: isPasada ? C.surfaceAlt : isProxima ? ac.soft : C.surfaceAlt, color: isPasada ? C.faint : isProxima ? ac.solid : C.faint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 750, flexShrink: 0 },
          }, isPasada ? React.createElement(Icon, { name: "check", size: 16, stroke: 2.5 }) : s.n),
          // Info
          React.createElement("div", { style: { flex: 1, minWidth: 0 } },
            React.createElement("div", { style: { fontSize: 13.5, fontWeight: 650, color: C.text } }, `Clase ${s.n} — ${s.titulo}`),
            React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 6 } },
              React.createElement(Icon, { name: "calendar", size: 13 }), s.fecha,
              s.dur && React.createElement(React.Fragment, null, React.createElement("span", { style: { color: C.border } }, "·"), s.dur)
            )
          ),
          // Acción
          isPasada && s.grabacion
            ? React.createElement("button", { onClick: () => window.__ldToast && window.__ldToast("Reproduciendo la grabación…", "info"), style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textSoft, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" } },
                React.createElement(Icon, { name: "play-circle", size: 14 }), "Ver grabación")
            : isProxima
              ? React.createElement("button", { onClick: () => window.__ldToast && window.__ldToast("Te unís a la clase en vivo…", "success"), style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "none", background: ac.solid, color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 650, cursor: "pointer", whiteSpace: "nowrap" } },
                  React.createElement(Icon, { name: "video", size: 14 }), "Unirse")
              : React.createElement("span", { style: { fontSize: 12, color: C.faint } }, "Próximamente")
        );
      })
    );
  }

  // ── Tab: Info + FAQs ──────────────────────────────────────────────────────
  function InfoTab({ ins, ac }) {
    const { C } = useTheme();
    const post = (window.LUDERIS.POSTS || []).find((p) => p.id === ins.postId);
    const faqs = (window.LUDERIS.FAQS || {})[ins.postId] || (window.LUDERIS.FAQS || {}).default || [];
    const [openFaq, setOpenFaq] = React.useState(null);

    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 26 } },
      // Descripción
      post && React.createElement("div", null,
        React.createElement("h3", { style: { ...tx("h2"), color: C.text, margin: "0 0 10px" } }, "Descripción"),
        React.createElement("p", { style: { ...tx("body"), color: C.textSoft, margin: 0, lineHeight: 1.65 } }, post.descripcion + " Trabajamos con material propio y un plan adaptado a tu nivel y objetivos.")
      ),
      // Qué incluye
      React.createElement("div", null,
        React.createElement("h3", { style: { ...tx("h2"), color: C.text, margin: "0 0 12px" } }, "Qué incluye"),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 9 } },
          ["Material descargable por unidad", "Clases en vivo con grabación disponible 60 días", "Seguimiento personalizado de progreso", "Chat directo con el docente", post && post.tiene_prueba ? "Primera clase de prueba sin cargo" : "Atención entre clases"].map((t, i) =>
            React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.textSoft } },
              React.createElement("span", { style: { width: 22, height: 22, borderRadius: "50%", background: ac.soft, color: ac.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
                React.createElement(Icon, { name: "check", size: 13, stroke: 2.6 })), t)
          )
        )
      ),
      // FAQs
      faqs.length > 0 && React.createElement("div", null,
        React.createElement("h3", { style: { ...tx("h2"), color: C.text, margin: "0 0 12px" } }, "Preguntas frecuentes"),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
          faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return React.createElement("div", { key: i, style: { border: `1px solid ${isOpen ? ac.solid : C.border}`, borderRadius: 11, overflow: "hidden", transition: "border-color .14s" } },
              React.createElement("button", {
                onClick: () => setOpenFaq(isOpen ? null : i),
                style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", border: "none", background: isOpen ? ac.soft : C.surface, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 650, color: isOpen ? ac.text : C.text, textAlign: "left", transition: "background .14s" },
              }, faq.q, React.createElement(Icon, { name: "chevron-right", size: 16, color: isOpen ? ac.solid : C.faint, style: { transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .16s", flexShrink: 0 } })),
              isOpen && React.createElement("div", { style: { padding: "10px 14px 13px", fontSize: 13.5, color: C.textSoft, lineHeight: 1.6, borderTop: `1px solid ${C.hairline}` } }, faq.a)
            );
          })
        )
      )
    );
  }

  // ── Tab: Prácticas con IA ──────────────────────────────────────────────────
  const PRACTICA_BANK = {
    "Idiomas": [
      { q: "¿Cuál es la diferencia entre “since” y “for” al hablar de tiempo?", a: "“For” acompaña una duración (for three years); “since” marca el punto de inicio (since 2019)." },
      { q: "Completá: “I ___ (live) here since 2019.”", a: "I have lived here since 2019 — presente perfecto: la acción empezó en el pasado y continúa hoy." },
      { q: "¿Qué es un phrasal verb? Dá un ejemplo.", a: "Un verbo + partícula que cambia el significado. Ej.: “give up” (rendirse), “look after” (cuidar)." },
      { q: "¿Cuándo usamos “used to”?", a: "Para hábitos o estados del pasado que ya no ocurren. Ej.: “I used to play tennis.”" },
    ],
    "Programación": [
      { q: "¿Qué diferencia hay entre “==” y “===” en JavaScript?", a: "“==” compara con coerción de tipos; “===” compara valor y tipo sin coerción. Usá “===” por defecto." },
      { q: "¿Qué imprime console.log(typeof [])?", a: "“object”. Los arrays son objetos en JS; para detectarlos usá Array.isArray()." },
      { q: "¿Para qué sirve useEffect en React?", a: "Para ejecutar efectos secundarios (fetch, timers, suscripciones) después del render, según su array de dependencias." },
    ],
    "Apoyo escolar": [
      { q: "Resolvé: 3/4 + 1/8", a: "7/8. Buscás común denominador (8): 6/8 + 1/8 = 7/8." },
      { q: "Despejá x: 2x + 6 = 14", a: "x = 4. Restás 6 (2x = 8) y dividís por 2." },
      { q: "¿Cuál es el área de un triángulo?", a: "base × altura ÷ 2." },
    ],
    default: [
      { q: "Explicá con tus palabras la idea central de la última unidad.", a: "Pista: resumila en una sola oración; si te cuesta, repasá el material y volvé a intentarlo." },
      { q: "Dá un ejemplo propio de algo visto en clase.", a: "Conectá el concepto con algo de tu día a día: así se fija mucho mejor." },
    ],
  };

  function DeckRow({ d, ac }) {
    const { C, A } = useTheme();
    const [h, setH] = React.useState(false);
    const isShared = d.tipo === "compartido";
    return React.createElement("div", {
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.surface, border: `1px solid ${h ? C.borderStrong : C.border}`, borderRadius: 12, transition: "all .14s" },
    },
      React.createElement("span", { style: { width: 38, height: 38, borderRadius: 10, background: isShared ? A.pedido.soft : C.surfaceAlt, color: isShared ? A.pedido.solid : C.muted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "book-open", size: 18, stroke: 1.9 })),
      React.createElement("div", { style: { flex: 1, minWidth: 0 } },
        React.createElement("div", { style: { fontSize: 13.5, fontWeight: 650, color: C.text } }, d.titulo),
        React.createElement("div", { style: { fontSize: 12, color: C.faint, marginTop: 2 } }, `${d.n} tarjetas${isShared ? " · por " + d.autor : " · personal"}`)
      ),
      React.createElement("button", { onClick: () => window.__ldToast && window.__ldToast(`Practicando “${d.titulo}”…`, "info"), style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "none", background: ac.soft, color: ac.text, fontFamily: "inherit", fontSize: 12.5, fontWeight: 650, cursor: "pointer", whiteSpace: "nowrap" } }, React.createElement(Icon, { name: "play-circle", size: 14 }), "Practicar")
    );
  }

  function PracticasTab({ ins, ac, esParticular }) {
    const { C, A } = useTheme();
    const ia = A.pedido;
    const bank = PRACTICA_BANK[ins.materia] || PRACTICA_BANK.default;
    const [idx, setIdx] = React.useState(-1);
    const [loading, setLoading] = React.useState(false);
    const [flipped, setFlipped] = React.useState(false);
    const card = idx >= 0 ? bank[idx % bank.length] : null;
    const generar = () => { setLoading(true); setFlipped(false); setTimeout(() => { setIdx((i) => i + 1); setLoading(false); }, 850); };
    const esDocente = ins.rol === "docente";
    const decks = [
      { titulo: "Vocabulario — Unidad 1", n: 24, tipo: "compartido", autor: esDocente ? "Vos" : ins.docente },
      { titulo: "Errores frecuentes a evitar", n: 16, tipo: "compartido", autor: esDocente ? "Vos" : ins.docente },
      { titulo: "Mis tarjetas", n: 8, tipo: "personal" },
    ];
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 26 } },
      React.createElement("style", null, "@keyframes ldCardFade{from{transform:translateY(7px)}to{transform:translateY(0)}}.ld-cardfade{animation:ldCardFade .34s ease}"),
      // Encabezado IA
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
        React.createElement("span", { style: { width: 40, height: 40, borderRadius: 11, background: ia.soft, color: ia.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "sparkles", size: 21, stroke: 1.9 })),
        React.createElement("div", null,
          React.createElement("h3", { style: { ...tx("h2"), color: C.text, margin: 0 } }, "Prácticas con IA"),
          React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginTop: 1 } }, "Generá preguntas de práctica a partir del material del curso")
        )
      ),
      // Tarjeta de práctica (revelar respuesta)
      React.createElement("div", {
        onClick: () => card && !loading && setFlipped((f) => !f),
        style: { height: 224, borderRadius: 16, border: `1px solid ${card ? ia.solid + "55" : C.border}`, background: flipped ? ia.soft : (card ? C.surface : C.surfaceAlt), padding: "22px 24px", boxShadow: card ? C.shadow : "none", cursor: card && !loading ? "pointer" : "default", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden", transition: "background .3s ease, border-color .2s ease" },
      },
        loading
          ? React.createElement("div", { className: "ld-cardfade", style: { margin: "auto", textAlign: "center", color: ia.solid, fontSize: 14, fontWeight: 600 } }, React.createElement(Icon, { name: "sparkles", size: 26, color: ia.solid, style: { marginBottom: 8 } }), React.createElement("div", null, "Generando pregunta…"))
          : card
            ? React.createElement("div", { key: (flipped ? "a" : "q") + idx, className: "ld-cardfade", style: { display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" } },
                React.createElement("div", { style: { ...tx("eyebrow"), color: ia.solid, marginBottom: 12 } }, flipped ? "Respuesta" : "Pregunta"),
                React.createElement("p", { style: { fontSize: flipped ? 16 : 18, fontWeight: flipped ? 500 : 650, color: C.text, margin: 0, lineHeight: flipped ? 1.5 : 1.4, flex: 1 } }, flipped ? card.a : card.q),
                React.createElement("div", { style: { fontSize: 12, color: flipped ? ia.text : C.faint, marginTop: 14, display: "flex", alignItems: "center", gap: 6, opacity: flipped ? .85 : 1 } }, React.createElement(Icon, { name: "swap", size: 13 }), flipped ? "Tocá para volver a la pregunta" : "Tocá la tarjeta para ver la respuesta")
              )
            : React.createElement("div", { style: { margin: "auto", textAlign: "center", color: C.faint, maxWidth: 300 } },
                React.createElement(Icon, { name: "sparkles", size: 30, stroke: 1.5, style: { marginBottom: 10 } }),
                React.createElement("p", { style: { fontSize: 14, color: C.muted, margin: 0 } }, "Presioná ", React.createElement("strong", { style: { color: C.text } }, "Generar con IA"), " para practicar con una pregunta basada en el material del docente.")
              )
      ),
      // Botón generar
      React.createElement("button", { onClick: generar, disabled: loading, style: { alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 11, border: "none", cursor: loading ? "default" : "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 650, color: "#fff", background: ia.solid, opacity: loading ? .6 : 1 } }, React.createElement(Icon, { name: "sparkles", size: 16 }), card ? "Generar otra" : "Generar con IA"),
      // Mazos
      React.createElement("div", null,
        React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } },
          React.createElement("h3", { style: { ...tx("h2"), color: C.text, margin: 0 } }, "Mazos de flashcards"),
          esDocente && React.createElement("button", { onClick: () => window.__ldToast && window.__ldToast("Nuevo mazo de flashcards", "info"), style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.textSoft, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" } }, React.createElement(Icon, { name: "plus", size: 14 }), "Crear mazo")
        ),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
          decks.map((d, i) => React.createElement(DeckRow, { key: i, d, ac }))
        )
      )
    );
  }

  // ── Tab: Comunidad / Chat con el docente ──────────────────────────────────
  const COMU_GRUPAL = [
    { de: "docente", nombre: "María Belén Ríos", txt: "¡Hola a todos! Hoy vemos pasado simple. Repasen el PDF de la Unidad 2 antes de la clase 🙌", hora: "Ayer · 17:10" },
    { de: "alumno", nombre: "Lucía Fernández", txt: "Buenísimo, ya lo descargué. ¿La clase es a las 18?", hora: "Ayer · 17:24" },
    { de: "ayudante", nombre: "Diego Sosa", txt: "Sí, 18:00 por videollamada. El link lo paso 5 minutos antes 👍", hora: "Ayer · 17:26" },
    { de: "mi", nombre: "Vos", txt: "Perfecto, ahí estoy. ¿Hay algo para entregar?", hora: "Ayer · 17:30" },
    { de: "docente", nombre: "María Belén Ríos", txt: "Sí: grabá un audio de 2 minutos contando qué hiciste el finde, en pasado. Lo escuchamos juntos.", hora: "Ayer · 17:32" },
  ];
  const COMU_PARTICULAR = [
    { de: "docente", nombre: "María Belén Ríos", txt: "¡Hola Camila! ¿Cómo venís con los ejercicios de la última clase?", hora: "Hoy · 11:02" },
    { de: "mi", nombre: "Vos", txt: "Bien, me trabé un poco con el condicional. ¿Lo vemos hoy?", hora: "Hoy · 11:10" },
    { de: "docente", nombre: "María Belén Ríos", txt: "Dale, arrancamos con eso. Te paso un par de ejemplos antes de la clase 👍", hora: "Hoy · 11:12" },
  ];

  function ComunidadTab({ ins, ac, esParticular }) {
    const { C, A } = useTheme();
    const docenteNombre = ins.docente === "Vos" ? "María Belén Ríos" : ins.docente;
    const base = esParticular ? COMU_PARTICULAR : COMU_GRUPAL;
    const [msgs, setMsgs] = React.useState(base);
    const [input, setInput] = React.useState("");
    const scRef = React.useRef(null);
    const send = () => {
      const t2 = input.trim(); if (!t2) return;
      setMsgs((m) => [...m, { de: "mi", nombre: "Vos", txt: t2, hora: "Ahora" }]);
      setInput("");
      setTimeout(() => { if (scRef.current) scRef.current.scrollTop = scRef.current.scrollHeight; }, 30);
    };
    const roleMeta = (de) => de === "docente" ? { ac: A.pedido, label: "Docente" } : de === "ayudante" ? { ac: A.clase, label: "Ayudante" } : null;
    return React.createElement("div", { style: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: C.shadow } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 11, padding: "13px 16px", borderBottom: `1px solid ${C.border}` } },
        React.createElement("span", { style: { width: 36, height: 36, borderRadius: 10, background: ac.soft, color: ac.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "message-circle", size: 18 })),
        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
          React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: C.text } }, esParticular ? "Chat con el docente" : "Comunidad del curso"),
          React.createElement("div", { style: { fontSize: 12, color: C.muted } }, esParticular ? docenteNombre : `${msgs.length} mensajes · alumnos y docente`)
        ),
        !esParticular && React.createElement("div", { style: { display: "flex", gap: 6 } },
          React.createElement("span", { style: { fontSize: 10.5, fontWeight: 650, background: A.pedido.soft, color: A.pedido.text, borderRadius: 20, padding: "3px 9px" } }, "Docente"),
          React.createElement("span", { style: { fontSize: 10.5, fontWeight: 650, background: A.clase.soft, color: A.clase.text, borderRadius: 20, padding: "3px 9px" } }, "Ayudante")
        )
      ),
      React.createElement("div", { ref: scRef, className: "ld-scroll", style: { maxHeight: 340, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10, background: C.bg } },
        msgs.map((m, i) => {
          const mine = m.de === "mi";
          const rm = roleMeta(m.de);
          return React.createElement("div", { key: i, style: { display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%" } },
            !mine && React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingLeft: 2 } },
              React.createElement("span", { style: { fontSize: 12, fontWeight: 650, color: rm ? rm.ac.text : C.textSoft } }, m.nombre),
              rm && React.createElement("span", { style: { fontSize: 9.5, fontWeight: 700, background: rm.ac.soft, color: rm.ac.text, borderRadius: 20, padding: "1px 7px" } }, rm.label)
            ),
            React.createElement("div", { style: { background: mine ? ac.solid : C.surface, color: mine ? "#fff" : C.text, border: mine ? "none" : `1px solid ${C.border}`, borderRadius: mine ? "14px 5px 14px 14px" : "5px 14px 14px 14px", padding: "9px 13px", fontSize: 13.5, lineHeight: 1.5 } }, m.txt),
            React.createElement("div", { style: { fontSize: 10.5, color: C.faint, marginTop: 3, padding: "0 4px" } }, m.hora)
          );
        })
      ),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "11px 13px", borderTop: `1px solid ${C.border}` } },
        React.createElement("input", { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => { if (e.key === "Enter") send(); }, "aria-label": "Escribí un mensaje", placeholder: esParticular ? "Escribile al docente…" : "Escribí al grupo…", style: { flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 20, padding: "9px 15px", color: C.text, fontSize: 13.5, fontFamily: "inherit", outline: "none" } }),
        React.createElement("button", { onClick: send, "aria-label": "Enviar", style: { width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", background: ac.solid, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "arrow-right", size: 17, stroke: 2.2, style: { transform: "rotate(-90deg)" } }))
      )
    );
  }

  window.PageCurso = PageCurso;
})();
