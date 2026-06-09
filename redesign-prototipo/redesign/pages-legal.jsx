/* Páginas legales — documento, FAQ de ayuda, libro de quejas */
(function () {
  const { useTheme, Icon, UI, tx, PageKit } = window;
  const { PrimaryBtn } = UI;
  const { Card } = PageKit;

  // Encabezado común con botón Volver
  function LegalHead({ icon, title, updated }) {
    const { C, A } = useTheme();
    return React.createElement("div", { style: { marginBottom: 26 } },
      React.createElement("button", {
        onClick: () => window.__ldNav("explore"),
        style: { display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: C.muted, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 18, padding: 0 },
      }, React.createElement(Icon, { name: "arrow-left", size: 15 }), "Volver al inicio"),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } },
        React.createElement("div", { style: { width: 48, height: 48, borderRadius: 13, background: A.curso.soft, color: A.curso.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
          React.createElement(Icon, { name: icon, size: 24, stroke: 1.9 })),
        React.createElement("div", null,
          React.createElement("h1", { style: tx("display", { color: C.text, margin: 0 }) }, title),
          updated && React.createElement("div", { style: { fontSize: 13, color: C.faint, marginTop: 4, fontWeight: 500 } }, updated)
        )
      )
    );
  }

  // ── Documento legal (Términos, Privacidad, Accesibilidad, Consumidor) ──────
  function DocPage({ docId }) {
    const { C, A } = useTheme();
    const doc = window.LUDERIS.LEGAL_DOCS[docId];
    const [activeSec, setActiveSec] = React.useState(0);
    if (!doc) return null;

    return React.createElement("div", null,
      React.createElement(LegalHead, { icon: doc.icon, title: doc.title, updated: doc.updated }),

      React.createElement(Card, { pad: 0, style: { marginBottom: 22, display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 18px", background: A.curso.soft, border: "none" } },
        React.createElement("div", { style: { color: A.curso.solid, flexShrink: 0, marginTop: 1 } }, React.createElement(Icon, { name: "lightbulb", size: 18 })),
        React.createElement("p", { style: { ...tx("body"), color: C.textSoft, margin: 0 } }, doc.intro)
      ),

      React.createElement("div", { className: "ld-legal-grid", style: { display: "grid", gridTemplateColumns: "210px 1fr", gap: 28, alignItems: "start" } },
        // TOC sticky
        React.createElement("nav", { className: "ld-legal-toc", style: { position: "sticky", top: 76, display: "flex", flexDirection: "column", gap: 2 } },
          doc.sections.map((s, i) => React.createElement("button", {
            key: i, onClick: () => { setActiveSec(i); const el = document.getElementById(`${docId}-sec-${i}`); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" }); },
            style: { textAlign: "left", border: "none", background: "transparent", color: activeSec === i ? A.curso.text : C.muted, fontFamily: "inherit", fontSize: 13, fontWeight: activeSec === i ? 650 : 500, cursor: "pointer", padding: "7px 11px", borderRadius: 8, borderLeft: `2px solid ${activeSec === i ? A.curso.solid : "transparent"}`, lineHeight: 1.35 },
          }, s.t))
        ),
        // Contenido
        React.createElement("div", null,
          doc.features && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 30 } },
            doc.features.map((f, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 12, padding: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, boxShadow: C.shadow } },
              React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: A.curso.soft, color: A.curso.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: f.icon, size: 18 })),
              React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 13.5, fontWeight: 650, color: C.text, marginBottom: 3 } }, f.t),
                React.createElement("div", { style: { fontSize: 12.5, color: C.muted, lineHeight: 1.45 } }, f.d))
            ))
          ),
          doc.rights && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginBottom: 30 } },
            doc.rights.map((r, i) => React.createElement("div", { key: i, style: { padding: 16, background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${A.curso.solid}`, borderRadius: 12, boxShadow: C.shadow } },
              React.createElement("div", { style: { fontSize: 13.5, fontWeight: 700, color: C.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 } }, React.createElement(Icon, { name: "check", size: 15, color: A.curso.solid, stroke: 2.4 }), r.t),
              React.createElement("div", { style: { fontSize: 12.5, color: C.muted, lineHeight: 1.5 } }, r.d))
            )
          ),
          doc.sections.map((s, i) => React.createElement(DocSection, { key: i, s, id: `${docId}-sec-${i}` }))
        )
      )
    );
  }

  function DocSection({ s, id }) {
    const { C, A } = useTheme();
    return React.createElement("section", { id, style: { marginBottom: 32, scrollMarginTop: 76 } },
      React.createElement("h2", { style: { ...tx("h1"), color: C.text, margin: "0 0 12px", paddingBottom: 8, borderBottom: `2px solid ${A.curso.soft}`, display: "inline-block" } }, s.t),
      s.p && s.p.map((para, i) => React.createElement("p", { key: i, style: { ...tx("body"), color: C.textSoft, margin: "0 0 12px", maxWidth: 680 } }, para)),
      s.list && React.createElement("ul", { style: { margin: "4px 0 0", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9, maxWidth: 680 } },
        s.list.map((li, i) => React.createElement("li", { key: i, style: { ...tx("body"), color: C.textSoft, display: "flex", gap: 10, alignItems: "flex-start" } },
          React.createElement("span", { style: { color: A.curso.solid, flexShrink: 0, marginTop: 7, width: 6, height: 6, borderRadius: "50%", background: A.curso.solid } }),
          li))
      )
    );
  }

  // ── Ayuda (FAQ con acordeón + búsqueda) ────────────────────────────────────
  function AyudaPage() {
    const { C, A } = useTheme();
    const CATS = window.LUDERIS.AYUDA;
    const [q, setQ] = React.useState("");
    const [open, setOpen] = React.useState("cuenta-0");

    const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const ql = norm(q.trim());
    const cats = CATS.map((c) => ({ ...c, preguntas: c.preguntas.filter((p) => !ql || norm(p.q).includes(ql) || norm(p.a).includes(ql)) })).filter((c) => c.preguntas.length > 0);

    return React.createElement("div", null,
      React.createElement(LegalHead, { icon: "lightbulb", title: "Centro de ayuda", updated: "¿En qué te podemos ayudar?" }),

      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1.5px solid ${C.borderStrong}`, borderRadius: 13, padding: "12px 16px", marginBottom: 26, boxShadow: C.shadow, maxWidth: 560 } },
        React.createElement(Icon, { name: "search", size: 19, color: C.faint }),
        React.createElement("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Buscar en la ayuda…", style: { flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 15, color: C.text } }),
        q && React.createElement("button", { onClick: () => setQ(""), "aria-label": "Limpiar", style: { border: "none", background: "transparent", color: C.faint, cursor: "pointer", display: "flex", padding: 2 } }, React.createElement(Icon, { name: "x", size: 17 }))
      ),

      cats.length === 0
        ? React.createElement(PageKit.EmptyState, { icon: "search", title: "Sin resultados", sub: "Probá con otras palabras o escribinos a contacto@luderis.com." })
        : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 28 } },
            cats.map((c) => React.createElement("div", { key: c.id },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 } },
                React.createElement("div", { style: { width: 34, height: 34, borderRadius: 9, background: A.curso.soft, color: A.curso.solid, display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: c.icon, size: 17 })),
                React.createElement("div", null,
                  React.createElement("h2", { style: { ...tx("h2"), color: C.text, margin: 0 } }, c.titulo),
                  React.createElement("div", { style: { fontSize: 12.5, color: C.faint } }, c.desc))
              ),
              React.createElement(Card, { pad: 0 },
                c.preguntas.map((p, i) => React.createElement(FaqRow, { key: i, p, id: `${c.id}-${i}`, open, setOpen, last: i === c.preguntas.length - 1 }))
              )
            ))
          ),

      React.createElement("div", { style: { marginTop: 30, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", background: A.curso.soft, borderRadius: 14, padding: "18px 22px" } },
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: C.text } }, "¿No encontraste lo que buscabas?"),
          React.createElement("div", { style: { fontSize: 13.5, color: C.textSoft, marginTop: 2 } }, "Escribinos y te respondemos a la brevedad.")),
        React.createElement(PrimaryBtn, { icon: "message-circle", size: "sm" }, "Contactar soporte")
      )
    );
  }

  function FaqRow({ p, id, open, setOpen, last }) {
    const { C, A } = useTheme();
    const isOpen = open === id;
    return React.createElement("div", { style: { borderBottom: last ? "none" : `1px solid ${C.hairline}` } },
      React.createElement("button", {
        onClick: () => setOpen(isOpen ? null : id),
        style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "15px 18px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left" },
      },
        React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: C.text } }, p.q),
        React.createElement("span", { style: { color: isOpen ? A.curso.solid : C.faint, flexShrink: 0, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .18s", display: "flex" } }, React.createElement(Icon, { name: "chevron-right", size: 18 }))
      ),
      isOpen && React.createElement("div", { style: { padding: "0 18px 16px", maxWidth: 700 } },
        React.createElement("p", { style: { ...tx("body"), color: C.muted, margin: 0 } }, p.a))
    );
  }

  // ── Libro de Quejas (formulario) ───────────────────────────────────────────
  function QuejasPage() {
    const { C, A } = useTheme();
    const [sent, setSent] = React.useState(false);
    const [form, setForm] = React.useState({ nombre: "", email: "", motivo: "servicio", detalle: "", referencia: "" });
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const valid = form.nombre && form.email && form.detalle;

    if (sent) return React.createElement("div", null,
      React.createElement(LegalHead, { icon: "megaphone", title: "Libro de Quejas", updated: "Reclamo registrado" }),
      React.createElement(Card, { pad: 36, style: { textAlign: "center", maxWidth: 560, margin: "0 auto" } },
        React.createElement("div", { style: { width: 60, height: 60, borderRadius: "50%", background: C.key === "dark" ? "#10271F" : "#E7F6F1", color: C.teal, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" } }, React.createElement(Icon, { name: "check", size: 30, stroke: 2.4 })),
        React.createElement("h2", { style: tx("h1", { color: C.text, margin: "0 0 8px" }) }, "Tu reclamo fue registrado"),
        React.createElement("p", { style: { ...tx("body"), color: C.muted, margin: "0 0 22px" } }, "Te enviamos un comprobante a tu email. Respondemos dentro de los 10 días hábiles."),
        React.createElement(PrimaryBtn, { onClick: () => window.__ldNav("explore") }, "Volver al inicio")
      )
    );

    return React.createElement("div", null,
      React.createElement(LegalHead, { icon: "megaphone", title: "Libro de Quejas", updated: "Dejá tu reclamo y lo gestionamos" }),
      React.createElement("div", { className: "ld-legal-grid", style: { display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "start" } },
        React.createElement(Card, { pad: 24 },
          React.createElement("h2", { style: { ...tx("h2"), color: C.text, margin: "0 0 20px" } }, "Datos del reclamo"),
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 18 } },
            React.createElement(Field, { label: "Nombre y apellido", value: form.nombre, onChange: (v) => set("nombre", v), placeholder: "Tu nombre completo" }),
            React.createElement(Field, { label: "Email", value: form.email, onChange: (v) => set("email", v), placeholder: "tu@email.com", type: "email" }),
            React.createElement(SelectField, { label: "Motivo", value: form.motivo, onChange: (v) => set("motivo", v), options: [["servicio", "Problema con un servicio"], ["pago", "Problema con un pago"], ["docente", "Conducta de un docente"], ["tecnico", "Problema técnico"], ["otro", "Otro"]] }),
            React.createElement(Field, { label: "Número de referencia (opcional)", value: form.referencia, onChange: (v) => set("referencia", v), placeholder: "Ej: MP-123456789" }),
            React.createElement(Field, { label: "Detalle del reclamo", value: form.detalle, onChange: (v) => set("detalle", v), placeholder: "Describí qué pasó, cuándo y con qué publicación o docente…", area: true })
          ),
          React.createElement("div", { style: { marginTop: 22, display: "flex", justifyContent: "flex-end" } },
            React.createElement("button", { onClick: () => valid && setSent(true), disabled: !valid, style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 11, border: "none", cursor: valid ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: 14, fontWeight: 650, color: "#fff", background: valid ? "linear-gradient(135deg,#1A6ED8,#0F9C82)" : C.borderStrong, opacity: valid ? 1 : .7 } },
              React.createElement(Icon, { name: "arrow-right", size: 16, stroke: 2.2 }), "Enviar reclamo")
          )
        ),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
          React.createElement(InfoBox, { icon: "clock", title: "Plazo de respuesta", desc: "Respondemos dentro de los 10 días hábiles de recibido el reclamo." }),
          React.createElement(InfoBox, { icon: "badge-check", title: "Reclamo gratuito", desc: "Presentar un reclamo no tiene ningún costo, conforme la Ley 24.240." }),
          React.createElement(InfoBox, { icon: "users", title: "Organismos oficiales", desc: "También podés acudir a Defensa del Consumidor o al COPREC." })
        )
      )
    );
  }

  function Field({ label, value, onChange, placeholder, type = "text", area }) {
    const { C, A } = useTheme();
    const [f, setF] = React.useState(false);
    const base = { width: "100%", border: `1.5px solid ${f ? A.curso.solid : C.border}`, borderRadius: 10, padding: "11px 14px", fontFamily: "inherit", fontSize: 14, color: C.text, background: C.surfaceAlt, outline: "none", boxShadow: f ? `0 0 0 4px ${A.curso.ring}` : "none", boxSizing: "border-box" };
    return React.createElement("label", { style: { display: "block" } },
      React.createElement("span", { style: { display: "block", fontSize: 13, fontWeight: 600, color: C.textSoft, marginBottom: 7 } }, label),
      area
        ? React.createElement("textarea", { value, onChange: (e) => onChange(e.target.value), placeholder, onFocus: () => setF(true), onBlur: () => setF(false), rows: 4, style: { ...base, resize: "vertical", lineHeight: 1.5 } })
        : React.createElement("input", { type, value, onChange: (e) => onChange(e.target.value), placeholder, onFocus: () => setF(true), onBlur: () => setF(false), style: base })
    );
  }

  function SelectField({ label, value, onChange, options }) {
    const { C } = useTheme();
    return React.createElement("label", { style: { display: "block" } },
      React.createElement("span", { style: { display: "block", fontSize: 13, fontWeight: 600, color: C.textSoft, marginBottom: 7 } }, label),
      React.createElement("select", { value, onChange: (e) => onChange(e.target.value), style: { width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", fontFamily: "inherit", fontSize: 14, color: C.text, background: C.surfaceAlt, outline: "none", cursor: "pointer", boxSizing: "border-box" } },
        options.map(([v, l]) => React.createElement("option", { key: v, value: v }, l)))
    );
  }

  function InfoBox({ icon, title, desc }) {
    const { C, A } = useTheme();
    return React.createElement("div", { style: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: "16px 18px", boxShadow: C.shadow } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: A.curso.solid } },
        React.createElement(Icon, { name: icon, size: 17 }),
        React.createElement("span", { style: { fontSize: 13.5, fontWeight: 650, color: C.text } }, title)),
      React.createElement("p", { style: { ...tx("meta"), color: C.muted, margin: 0, lineHeight: 1.5 } }, desc)
    );
  }

  window.PageLegal = { DocPage, AyudaPage, QuejasPage };
})();
