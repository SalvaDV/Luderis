/* Detalle de publicación (modal) + Perfil público de docente */
(function () {
  const { useTheme, Icon, UI, tx, CardsUI } = window;
  const { Avatar, Stars, VerifiedBadge, Pill, PrimaryBtn } = UI;
  const { fmtPrice, MODALIDAD } = CardsUI;

  function Overlay({ children, onClose }) {
    const { C } = useTheme();
    return React.createElement(React.Fragment, null,
      React.createElement("div", { onClick: onClose, style: { position: "fixed", inset: 0, background: C.overlay, zIndex: 80, animation: "ldFade .15s ease" } }),
      React.createElement("div", { style: { position: "fixed", zIndex: 81, top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(640px,94vw)", maxHeight: "92vh", background: C.surface, borderRadius: 18, boxShadow: "0 24px 64px rgba(0,0,0,.28)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "inherit" } }, children)
    );
  }

  // ── FAQ accordion ────────────────────────────────────────────────────────
  function FAQSection({ postId, ac }) {
    const { C } = useTheme();
    const faqs = (window.LUDERIS.FAQS || {})[postId] || (window.LUDERIS.FAQS || {}).default || [];
    const [open, setOpen] = React.useState(null);
    if (!faqs.length) return null;
    return React.createElement("div", { style: { marginBottom: 22 } },
      React.createElement("h3", { style: { ...tx("h2"), color: C.text, margin: "0 0 10px" } }, "Preguntas frecuentes"),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
        faqs.map((faq, i) => {
          const isOpen = open === i;
          return React.createElement("div", {
            key: i,
            style: { border: `1px solid ${isOpen ? ac.solid : C.border}`, borderRadius: 11, overflow: "hidden", transition: "border-color .14s" },
          },
            React.createElement("button", {
              onClick: () => setOpen(isOpen ? null : i),
              style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", border: "none", background: isOpen ? ac.soft : C.surface, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 650, color: isOpen ? ac.text : C.text, textAlign: "left", transition: "background .14s" },
            },
              faq.q,
              React.createElement(Icon, { name: "chevron-right", size: 16, color: isOpen ? ac.solid : C.faint, style: { transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .16s", flexShrink: 0 } })
            ),
            isOpen && React.createElement("div", { style: { padding: "10px 14px 13px", fontSize: 13.5, color: C.textSoft, lineHeight: 1.6, borderTop: `1px solid ${C.hairline}` } }, faq.a)
          );
        })
      )
    );
  }

  // ── Detalle de publicación ────────────────────────────────────────────────
  function DetailModal({ post, onClose }) {
    const { C, A } = useTheme();
    if (!post) return null;
    const isPedido = post.tipo === "busqueda";
    const ac = isPedido ? A.pedido : post.modo === "particular" ? A.clase : A.curso;
    const mod = MODALIDAD[post.modalidad];
    // ¿ya inscripto?
    const inscripcion = (window.LUDERIS.INSCRIPCIONES || []).find((i) => i.postId === post.id && i.rol === "alumno");
    const isCurso = post.modo === "curso" || post.modo === "grupal";
    const [inscripto, setInscripto] = React.useState(false);

    return React.createElement(Overlay, { onClose },
      // Banda superior con acento
      React.createElement("div", { style: { height: 6, background: ac.solid, flexShrink: 0 } }),
      React.createElement("div", { style: { padding: "20px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 } },
        React.createElement(Pill, { icon: isPedido ? "megaphone" : post.modo === "particular" ? "user" : "graduation-cap", label: isPedido ? "Pedido" : post.modo === "particular" ? "Clase particular" : "Curso", tone: "accent", accent: ac }),
        React.createElement("button", { onClick: onClose, "aria-label": "Cerrar", style: { width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: "x", size: 18 }))
      ),
      React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "0 26px 24px" } },
        React.createElement("h2", { style: tx("display", { color: C.text, margin: "0 0 14px", fontSize: 23 }) }, post.titulo),
        // Autor
        React.createElement("button", { onClick: () => { onClose(); window.__ldProfile && window.__ldProfile(post); }, style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18, padding: "10px 12px", margin: "0 -12px 18px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", width: "calc(100% + 24px)", textAlign: "left" } },
          React.createElement(Avatar, { name: post.autor_nombre, size: 46 }),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
              React.createElement("span", { style: { fontSize: 14.5, fontWeight: 650, color: C.text } }, post.autor_nombre),
              post.verificado && React.createElement(VerifiedBadge, { size: 15 })),
            React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginTop: 1 } }, post.rating ? `${post.rating} ★ · ${post.reviews} reseñas · Ver perfil` : "Ver perfil")),
          React.createElement(Icon, { name: "chevron-right", size: 18, color: C.faint })),

        // Metadatos
        React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 } },
          mod && React.createElement(Pill, { icon: mod.icon, label: mod.label }),
          React.createElement(Pill, { icon: "map-pin", label: post.ciudad }),
          post.nivel && React.createElement(Pill, { icon: "graduation-cap", label: CardsUI.NIVEL[post.nivel] || post.nivel }),
          post.tiene_prueba && React.createElement(Pill, { icon: "check", label: "Prueba gratis", tone: "success" }),
          post.disponible_hoy && React.createElement(Pill, { icon: "zap", label: "Disponible hoy", tone: "success" })
        ),

        // Descripción
        React.createElement(Block, { title: "Descripción" },
          React.createElement("p", { style: { ...tx("body"), color: C.textSoft, margin: 0 } }, post.descripcion + " Trabajamos con material propio y un plan adaptado a tu nivel y tus objetivos. Cada clase queda registrada para que puedas seguir tu progreso.")),

        // Qué incluye
        !isPedido && React.createElement(Block, { title: "Qué incluye" },
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 9 } },
            ["Material de estudio descargable", "Seguimiento personalizado de tu progreso", post.modo === "curso" ? "Acceso a las clases grabadas" : "Horarios flexibles a coordinar", post.tiene_prueba ? "Primera clase de prueba sin cargo" : "Atención por chat entre clases"].map((t, i) =>
              React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.textSoft } },
                React.createElement("span", { style: { width: 22, height: 22, borderRadius: "50%", background: ac.soft, color: ac.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "check", size: 13, stroke: 2.6 })), t))
          )),

        // Estadísticas
        !isPedido && React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 4, marginBottom: 22 } },
          React.createElement(MiniStat, { icon: "star", label: "Valoración", value: post.rating ? post.rating.toFixed(1) : "—" }),
          React.createElement(MiniStat, { icon: "users", label: "Alumnos", value: post.inscriptos || "—" }),
          React.createElement(MiniStat, { icon: "monitor", label: "Vistas", value: post.vistas || "—" })
        ),

        // FAQs (solo ofertas)
        !isPedido && React.createElement(FAQSection, { postId: post.id, ac })
      ),

      // Footer fijo: precio + CTA
      React.createElement("div", { style: { padding: "16px 26px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexShrink: 0 } },
        inscripto
          ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flex: 1 } },
              React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 650, color: C.teal } },
                React.createElement(Icon, { name: "check", size: 18, stroke: 2.5 }), "¡Inscripción confirmada!"),
              React.createElement("button", { onClick: () => { onClose(); window.__ldNav && window.__ldNav("inscripciones"); }, style: { marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: C.teal, color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 650, cursor: "pointer" } },
                React.createElement(Icon, { name: "graduation-cap", size: 15 }), "Ver mis clases")
            )
          : React.createElement(React.Fragment, null,
              React.createElement("div", null,
                inscripcion
                  ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7 } },
                      React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 650, color: C.teal, background: C.key === "dark" ? "#10271F" : "#E7F6F1", borderRadius: 7, padding: "4px 10px" } },
                        React.createElement("span", { style: { width: 7, height: 7, borderRadius: "50%", background: C.teal } }),
                        inscripcion.estadoTxt)
                    )
                  : React.createElement(React.Fragment, null,
                      React.createElement("span", { style: { ...tx("price"), color: C.text, fontSize: 22 } }, isPedido ? `Hasta ${fmtPrice(post.precio, post.moneda)}` : fmtPrice(post.precio, post.moneda)),
                      React.createElement("span", { style: { fontSize: 13, color: C.faint, fontWeight: 500 } }, `/${post.precio_tipo}`))
              ),
              React.createElement("div", { style: { display: "flex", gap: 10 } },
                !inscripcion && React.createElement("button", { onClick: () => { onClose(); window.__ldNav && window.__ldNav("chats"); }, style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 18px", borderRadius: 11, border: `1px solid ${C.border}`, background: "transparent", color: C.textSoft, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" } }, React.createElement(Icon, { name: "message-circle", size: 17 }), "Mensaje"),
                inscripcion
                  ? React.createElement(PrimaryBtn, { icon: isCurso ? "play-circle" : "calendar", onClick: () => { onClose(); window.__ldCurso && window.__ldCurso(inscripcion.id); } }, isCurso ? "Ir al curso" : "Ir a la clase")
                  : React.createElement(PrimaryBtn, { icon: isPedido ? "megaphone" : "graduation-cap", onClick: () => { setInscripto(true); } }, isPedido ? "Ofrecer mis clases" : post.modo === "particular" ? "Reservar clase" : "Inscribirme"))
            )
      )
    );
  }
  function Block({ title, children }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { marginBottom: 22 } },
      React.createElement("h3", { style: { ...tx("h2"), color: C.text, margin: "0 0 10px" } }, title), children);
  }
  function MiniStat({ icon, label, value }) {
    const { C, A } = useTheme();
    return React.createElement("div", { style: { flex: 1, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", textAlign: "center" } },
      React.createElement("div", { style: { display: "inline-flex", color: A.curso.solid, marginBottom: 5 } }, React.createElement(Icon, { name: icon, size: 17, stroke: icon === "star" ? 0 : 1.9, style: icon === "star" ? { fill: A.curso.solid } : undefined })),
      React.createElement("div", { style: { fontSize: 16, fontWeight: 750, color: C.text } }, value),
      React.createElement("div", { style: { fontSize: 11.5, color: C.faint, marginTop: 1 } }, label)
    );
  }

  // ── Perfil público de docente ──────────────────────────────────────────────
  function ProfileModal({ post, onClose }) {
    const { C, A } = useTheme();
    const [tab, setTab] = React.useState("clases");
    if (!post) return null;
    const P = window.LUDERIS.PERFIL;
    const nombre = post.autor_nombre || P.nombre;
    const ac = A.curso;
    // publicaciones del mismo autor (o algunas de ejemplo)
    const pubs = window.LUDERIS.POSTS.filter((p) => p.tipo === "oferta").slice(0, 3);

    return React.createElement(Overlay, { onClose },
      // Banner
      React.createElement("div", { style: { position: "relative", height: 96, background: "linear-gradient(120deg,#1A6ED8,#0F9C82)", flexShrink: 0 } },
        React.createElement("button", { onClick: onClose, "aria-label": "Cerrar", style: { position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: 10, border: "none", background: "rgba(255,255,255,.22)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: "x", size: 18 }))),
      React.createElement("div", { style: { flex: 1, overflowY: "auto" } },
        // Encabezado de perfil
        React.createElement("div", { style: { padding: "0 26px 18px" } },
          React.createElement("div", { style: { marginTop: -34, marginBottom: 12 } }, React.createElement("div", { style: { display: "inline-block", border: `4px solid ${C.surface}`, borderRadius: "50%" } }, React.createElement(Avatar, { name: nombre, size: 76 }))),
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            React.createElement("h2", { style: tx("display", { color: C.text, margin: 0, fontSize: 22 }) }, nombre),
            React.createElement(VerifiedBadge, { size: 19 })),
          React.createElement("div", { style: { fontSize: 13.5, color: C.muted, marginTop: 4, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } },
            React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5 } }, React.createElement(Icon, { name: "graduation-cap", size: 15 }), post.materia || P.materia),
            React.createElement("span", { style: { color: C.border } }, "·"),
            React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5 } }, React.createElement(Icon, { name: "map-pin", size: 15 }), post.ciudad || P.ciudad)),
          // stats fila
          React.createElement("div", { style: { display: "flex", gap: 22, marginTop: 16 } },
            React.createElement(PStat, { value: (post.rating || P.rating).toFixed(1), label: "Valoración", star: true }),
            React.createElement(PStat, { value: post.reviews || P.reviews, label: "Reseñas" }),
            React.createElement(PStat, { value: P.alumnos, label: "Alumnos" })),
          React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 18 } },
            React.createElement(PrimaryBtn, { icon: "message-circle", full: false, onClick: () => { onClose(); window.__ldNav && window.__ldNav("chats"); } }, "Enviar mensaje"),
            React.createElement("button", { onClick: () => window.__ldToast && window.__ldToast("Docente guardado en favoritos", "success"), style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 11, border: `1px solid ${C.border}`, background: "transparent", color: C.textSoft, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" } }, React.createElement(Icon, { name: "bookmark", size: 16 }), "Guardar"))
        ),
        // Tabs
        React.createElement("div", { style: { display: "flex", gap: 4, padding: "0 26px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.surface, zIndex: 2 } },
          [["clases", "Clases"], ["resenas", "Reseñas"], ["credenciales", "Credenciales"], ["sobre", "Sobre mí"]].map(([id, label]) => React.createElement("button", {
            key: id, onClick: () => setTab(id),
            style: { position: "relative", padding: "13px 12px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: tab === id ? 700 : 500, color: tab === id ? ac.text : C.muted },
          }, label, tab === id && React.createElement("span", { style: { position: "absolute", left: 8, right: 8, bottom: -1, height: 2.5, borderRadius: 3, background: ac.solid } }))
          )),
        // Contenido de tab
        React.createElement("div", { style: { padding: "20px 26px 26px" } },
          tab === "clases" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
            pubs.map((p) => React.createElement("button", { key: p.id, onClick: () => { onClose(); window.__ldDetail(p); }, style: { display: "flex", alignItems: "center", gap: 12, padding: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left", boxShadow: C.shadow } },
              React.createElement("div", { style: { width: 40, height: 40, borderRadius: 10, background: A.curso.soft, color: A.curso.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: p.modo === "particular" ? "user" : "graduation-cap", size: 19 })),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 13.5, fontWeight: 650, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, p.titulo),
                React.createElement("div", { style: { fontSize: 12.5, color: C.muted } }, p.rating ? `${p.rating} ★ · ${p.reviews} reseñas` : "Nueva")),
              React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } },
                React.createElement("div", { style: { fontSize: 14, fontWeight: 750, color: C.text } }, fmtPrice(p.precio, p.moneda)),
                React.createElement("div", { style: { fontSize: 11.5, color: C.faint } }, `/${p.precio_tipo}`)))
            )),
          tab === "resenas" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
            P.resenas.map((r) => React.createElement("div", { key: r.id, style: { paddingBottom: 14, borderBottom: `1px solid ${C.hairline}` } },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 } },
                React.createElement(Avatar, { name: r.autor, size: 34 }),
                React.createElement("div", { style: { flex: 1 } },
                  React.createElement("div", { style: { fontSize: 13, fontWeight: 650, color: C.text } }, r.autor),
                  React.createElement("div", { style: { fontSize: 11.5, color: C.faint } }, r.fecha)),
                React.createElement("div", { style: { display: "flex", gap: 1 } }, Array.from({ length: 5 }).map((_, i) => React.createElement(Icon, { key: i, name: "star", size: 13, stroke: 0, style: { fill: i < r.rating ? "#F2A33A" : C.border } })))),
              React.createElement("p", { style: { ...tx("body"), color: C.textSoft, margin: 0 } }, r.texto))
            )),
          tab === "credenciales" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
            P.credenciales.map((cr, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 12, padding: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, boxShadow: C.shadow } },
              React.createElement("div", { style: { width: 40, height: 40, borderRadius: 10, background: A.curso.soft, color: A.curso.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: cr.tipo === "Título" ? "graduation-cap" : "badge-check", size: 20 })),
              React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                  React.createElement("span", { style: { fontSize: 11, fontWeight: 650, color: C.faint, textTransform: "uppercase", letterSpacing: ".04em" } }, cr.tipo),
                  cr.verificado && React.createElement(VerifiedBadge, { size: 13 })),
                React.createElement("div", { style: { fontSize: 14, fontWeight: 650, color: C.text, marginTop: 2 } }, cr.titulo),
                React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginTop: 1 } }, `${cr.institucion} · ${cr.anio}`)))
            )),
          tab === "sobre" && React.createElement("div", null,
            React.createElement("p", { style: { ...tx("body"), color: C.textSoft, margin: "0 0 18px" } }, P.bio),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
              React.createElement(InfoLine, { icon: "clock", label: P.respuesta }),
              React.createElement(InfoLine, { icon: "graduation-cap", label: P.desde }),
              React.createElement(InfoLine, { icon: "globe", label: "Idiomas: " + P.idiomas.join(", ") })))
        )
      )
    );
  }
  function PStat({ value, label, star }) {
    const { C } = useTheme();
    return React.createElement("div", null,
      React.createElement("div", { style: { fontSize: 19, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 4 } }, star && React.createElement(Icon, { name: "star", size: 16, stroke: 0, style: { fill: "#F2A33A" } }), value),
      React.createElement("div", { style: { fontSize: 12, color: C.faint, marginTop: 1 } }, label));
  }
  function InfoLine({ icon, label }) {
    const { C, A } = useTheme();
    return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: C.textSoft } },
      React.createElement("span", { style: { color: A.curso.solid, display: "inline-flex" } }, React.createElement(Icon, { name: icon, size: 16 })), label);
  }

  window.DetailUI = { DetailModal, ProfileModal };
})();
