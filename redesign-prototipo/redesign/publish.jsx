/* Publicar — wizard de 4 pasos (modal a pantalla completa) */
(function () {
  const { useTheme, Icon, UI, tx } = window;
  const { PrimaryBtn } = UI;

  const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-AR");

  function PublishModal({ open, onClose, editPost }) {
    const { C, A } = useTheme();
    if (!open) return null;
    const MAT = window.LUDERIS.MATERIAS;
    const isEdit = !!(editPost && editPost.id);

    const initTipo = isEdit ? (editPost.tipo === "busqueda" ? "busqueda" : "oferta") : "oferta";
    const initModo = isEdit ? (editPost.modo === "particular" ? "particular" : "curso") : "curso";
    const [tipo, setTipo] = React.useState(initTipo);      // oferta | busqueda
    const [modo, setModo] = React.useState(initModo);        // curso | particular
    const [paso, setPaso] = React.useState(isEdit ? 2 : 1);
    const [f, setF] = React.useState(isEdit
      ? { materia: editPost.materia || "", titulo: editPost.titulo || "", descripcion: editPost.descripcion || "", requisitos: editPost.requisitos || "", modalidad: editPost.modalidad || "", nivel: editPost.nivel || "", sinc: editPost.sinc || "sinc", precio: editPost.precio != null ? String(editPost.precio) : "", precioTipo: editPost.precio_tipo || "hora", moneda: editPost.moneda || "ARS", prueba: !!editPost.tiene_prueba, certificado: !!editPost.certificado }
      : { materia: "", titulo: "", descripcion: "", requisitos: "", modalidad: "", nivel: "", sinc: "sinc", precio: "", precioTipo: "hora", moneda: "ARS", prueba: false, certificado: false });
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
    const [done, setDone] = React.useState(false);

    const totalPasos = tipo === "busqueda" ? 2 : 4;
    const labels = tipo === "busqueda" ? ["Tipo", "Contenido"] : ["Tipo y formato", "Contenido", "Detalles", "Precio"];

    const canNext = () => {
      if (paso === 1) return tipo === "busqueda" || !!modo;
      if (paso === 2) return f.titulo.trim().length >= 3 && f.materia && f.descripcion.trim().length >= 10;
      if (paso === 3) return tipo === "busqueda" || (!!f.modalidad && !!f.nivel);
      return true;
    };
    const next = () => {
      if (!canNext()) return;
      if ((tipo === "busqueda" && paso === 2) || paso === totalPasos) { setDone(true); return; }
      setPaso((p) => p + 1);
    };

    const ac = A[tipo === "busqueda" ? "pedido" : modo === "particular" ? "clase" : "curso"];

    if (done) return React.createElement(Shell, { onClose },
      React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "56px 28px", flex: 1 } },
        React.createElement("div", { style: { width: 68, height: 68, borderRadius: "50%", background: C.key === "dark" ? "#10271F" : "#E7F6F1", color: C.teal, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 } }, React.createElement(Icon, { name: "check", size: 34, stroke: 2.4 })),
        React.createElement("h2", { style: tx("display", { color: C.text, margin: "0 0 8px" }) }, isEdit ? "¡Cambios guardados!" : tipo === "busqueda" ? "¡Pedido publicado!" : "¡Publicación enviada!"),
        React.createElement("p", { style: { ...tx("body"), color: C.muted, margin: "0 0 8px", maxWidth: 420 } }, isEdit ? "Tu publicación se actualizó correctamente." : tipo === "busqueda" ? "Los docentes ya pueden ver tu pedido y enviarte ofertas." : "La revisamos y, una vez aprobada la verificación, queda visible para los alumnos."),
        React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 18 } },
          React.createElement("button", { onClick: onClose, style: { padding: "11px 20px", borderRadius: 11, border: `1px solid ${C.border}`, background: "transparent", color: C.textSoft, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" } }, "Cerrar"),
          React.createElement(PrimaryBtn, { onClick: () => { onClose(); window.__ldNav("cuenta"); } }, "Ver mis publicaciones"))
      )
    );

    return React.createElement(Shell, { onClose },
      // Header con título + paso
      React.createElement("div", { style: { padding: "20px 26px 0", flexShrink: 0 } },
        React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 } },
          React.createElement("div", null,
            React.createElement("h2", { style: tx("h1", { color: C.text, margin: 0 }) }, isEdit ? "Editar publicación" : paso === 1 ? "Nueva publicación" : paso === 2 ? "Contanos más" : paso === 3 ? `Detalles ${modo === "curso" ? "del curso" : "de la clase"}` : "Precio y condiciones"),
            React.createElement("div", { style: { fontSize: 13, color: C.muted, marginTop: 3 } }, isEdit ? `Editando · paso ${paso} de ${totalPasos}` : `Paso ${paso} de ${totalPasos}`)),
          React.createElement("button", { onClick: onClose, "aria-label": "Cerrar", style: { width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "x", size: 18 }))
        ),
        // Stepper
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 18, marginBottom: 4 } },
          labels.map((label, i) => {
            const n = i + 1; const isDone = n < paso; const active = n === paso;
            return React.createElement("button", { key: i, onClick: () => isDone && setPaso(n), style: { flex: 1, cursor: isDone ? "pointer" : "default", border: "none", background: "transparent", padding: 0, textAlign: "left", fontFamily: "inherit" } },
              React.createElement("div", { style: { height: 4, borderRadius: 3, background: active || isDone ? ac.solid : C.border, marginBottom: 7, transition: "background .2s" } }),
              React.createElement("div", { style: { fontSize: 11.5, fontWeight: active ? 700 : 500, color: active ? ac.text : isDone ? C.textSoft : C.faint, display: "flex", alignItems: "center", gap: 4 } }, isDone && React.createElement(Icon, { name: "check", size: 12, stroke: 2.6 }), label));
          })
        )
      ),

      // Cuerpo scrollable
      React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "20px 26px 8px" } },
        paso === 1 && React.createElement(Paso1, { tipo, setTipo, modo, setModo }),
        paso === 2 && React.createElement(Paso2, { f, set, tipo, materias: MAT }),
        paso === 3 && tipo === "oferta" && React.createElement(Paso3, { f, set, modo }),
        paso === 4 && tipo === "oferta" && React.createElement(Paso4, { f, set, modo })
      ),

      // Footer
      React.createElement("div", { style: { padding: "16px 26px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0 } },
        paso > 1
          ? React.createElement("button", { onClick: () => setPaso((p) => p - 1), style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 16px", borderRadius: 11, border: `1px solid ${C.border}`, background: "transparent", color: C.textSoft, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" } }, React.createElement(Icon, { name: "arrow-left", size: 16 }), "Atrás")
          : React.createElement("span", null),
        React.createElement("button", { onClick: next, disabled: !canNext(), style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 11, border: "none", cursor: canNext() ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: 14, fontWeight: 650, color: "#fff", background: canNext() ? "linear-gradient(135deg,#1A6ED8,#0F9C82)" : C.borderStrong, opacity: canNext() ? 1 : .7 } },
          (paso === totalPasos || (tipo === "busqueda" && paso === 2)) ? (isEdit ? "Guardar cambios" : "Publicar") : "Siguiente", React.createElement(Icon, { name: (paso === totalPasos || (tipo === "busqueda" && paso === 2)) && isEdit ? "check" : "arrow-right", size: 16, stroke: 2.2 }))
      )
    );
  }

  function Shell({ children, onClose }) {
    const { C } = useTheme();
    return React.createElement(React.Fragment, null,
      React.createElement("div", { onClick: onClose, style: { position: "fixed", inset: 0, background: C.overlay, zIndex: 80, animation: "ldFade .15s ease" } }),
      React.createElement("div", { style: { position: "fixed", zIndex: 81, top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(680px,94vw)", maxHeight: "92vh", background: C.surface, borderRadius: 18, boxShadow: "0 24px 64px rgba(0,0,0,.28)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "inherit" } }, children)
    );
  }

  // ── PASO 1 ──
  function Paso1({ tipo, setTipo, modo, setModo }) {
    const { C, A } = useTheme();
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 24 } },
      React.createElement(FieldGroup, { label: "¿Qué querés hacer?" },
        React.createElement("div", { style: { display: "flex", gap: 10 } },
          [["oferta", "Ofrezco clases", "graduation-cap", "Soy docente y quiero enseñar"], ["busqueda", "Busco un docente", "megaphone", "Soy alumno y necesito ayuda"]].map(([v, l, ic, d]) => {
            const sel = tipo === v; const ac = v === "busqueda" ? A.pedido : A.curso;
            return React.createElement(BigOption, { key: v, sel, ac, icon: ic, title: l, desc: d, onClick: () => setTipo(v) });
          }))
      ),
      tipo === "oferta" && React.createElement(FieldGroup, { label: "Formato" },
        React.createElement("div", { style: { display: "flex", gap: 10 } },
          [["curso", "Curso", "graduation-cap", "Estructurado, con varias clases y opción de certificado"], ["particular", "Clase particular", "user", "Clases 1 a 1, por hora, a demanda"]].map(([v, l, ic, d]) => {
            const sel = modo === v; const ac = v === "particular" ? A.clase : A.curso;
            return React.createElement(BigOption, { key: v, sel, ac, icon: ic, title: l, desc: d, onClick: () => setModo(v) });
          }))
      )
    );
  }
  function BigOption({ sel, ac, icon, title, desc, onClick }) {
    const { C } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { flex: 1, position: "relative", textAlign: "left", padding: "18px 16px", borderRadius: 15, cursor: "pointer", fontFamily: "inherit", background: sel ? ac.soft : C.surface, border: `1.5px solid ${sel ? ac.solid : h ? C.borderStrong : C.border}`, transition: "all .16s" },
    },
      sel && React.createElement("div", { style: { position: "absolute", top: 12, right: 12, width: 20, height: 20, borderRadius: "50%", background: ac.solid, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: "check", size: 13, stroke: 3 })),
      React.createElement("div", { style: { width: 42, height: 42, borderRadius: 11, background: sel ? "#fff" : C.surfaceAlt, color: ac.solid, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 } }, React.createElement(Icon, { name: icon, size: 21, stroke: 1.9 })),
      React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: sel ? ac.text : C.text, marginBottom: 4 } }, title),
      React.createElement("div", { style: { fontSize: 12.5, color: C.muted, lineHeight: 1.45 } }, desc)
    );
  }

  // ── PASO 2 ──
  function Paso2({ f, set, tipo, materias }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 20 } },
      React.createElement(TextField, { label: "Título", value: f.titulo, onChange: (v) => set("titulo", v), placeholder: tipo === "busqueda" ? "Ej: Busco profe de inglés para conversación" : "Ej: Inglés conversacional para adultos", hint: "Claro y específico. Mínimo 3 caracteres." }),
      React.createElement(SelectField, { label: "Materia", value: f.materia, onChange: (v) => set("materia", v), options: [["", "Elegí una materia"], ...materias.map((m) => [m, m])] }),
      React.createElement(TextField, { label: "Descripción", value: f.descripcion, onChange: (v) => set("descripcion", v), placeholder: tipo === "busqueda" ? "Contá qué necesitás, tu nivel y disponibilidad…" : "Contá qué van a aprender, tu método y para quién es…", area: true, hint: "Mínimo 10 caracteres." }),
      React.createElement(TextField, { label: tipo === "busqueda" ? "Requisitos del docente (opcional)" : "Requisitos previos (opcional)", value: f.requisitos, onChange: (v) => set("requisitos", v), placeholder: tipo === "busqueda" ? "Ej: con experiencia en exámenes internacionales" : "Ej: conocimientos básicos de álgebra" })
    );
  }

  // ── PASO 3 ──
  function Paso3({ f, set, modo }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 22 } },
      React.createElement(ChipField, { label: "Modalidad", value: f.modalidad, onChange: (v) => set("modalidad", v), options: [["presencial", "Presencial"], ["virtual", "Virtual"], ["mixto", "Mixto"]] }),
      React.createElement(ChipField, { label: "Nivel de alumnos", value: f.nivel, onChange: (v) => set("nivel", v), options: [["primaria", "Primaria"], ["secundaria", "Secundaria"], ["universitario", "Universitario"], ["adultos", "Adultos"], ["todos", "Todos"]] }),
      modo === "curso" && React.createElement(ChipField, { label: "Dictado", value: f.sinc, onChange: (v) => set("sinc", v), options: [["sinc", "Sincrónico (en vivo)"], ["asinc", "Asincrónico (grabado)"]] }),
      modo === "curso" && React.createElement(ToggleField, { label: "Otorga certificado", desc: "Los alumnos reciben un certificado al aprobar el curso.", on: f.certificado, onChange: () => set("certificado", !f.certificado) })
    );
  }

  // ── PASO 4 ──
  function Paso4({ f, set, modo }) {
    const { C, A } = useTheme();
    const comision = Math.round((Number(f.precio) || 0) * 0.1);
    const neto = (Number(f.precio) || 0) - comision;
    // Unidades de precio según el formato
    const unidades = modo === "particular"
      ? [["hora", "por hora"], ["clase", "por clase"]]
      : [["mes", "por mes"], ["total", "precio total"], ["clase", "por clase"]];
    const unidadEf = unidades.some(([v]) => v === f.precioTipo) ? f.precioTipo : unidades[0][0];
    const unidadLabel = (unidades.find(([v]) => v === unidadEf) || unidades[0])[1];
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 22 } },
      React.createElement(FieldGroup, { label: "Precio" },
        React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "flex-end" } },
          React.createElement("div", { style: { flex: 1 } }, React.createElement(TextField, { value: f.precio, onChange: (v) => set("precio", v.replace(/[^0-9]/g, "")), placeholder: "0", prefix: "$" })),
          React.createElement(SelectInline, { value: unidadEf, onChange: (v) => set("precioTipo", v), options: unidades })
        )
      ),
      f.precio && React.createElement("div", { style: { background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 13, padding: "14px 18px" } },
        React.createElement(Linea, { l: `Precio ${unidadLabel}`, v: fmt(f.precio) }),
        React.createElement(Linea, { l: "Comisión Luderis (10%)", v: "− " + fmt(comision), muted: true }),
        React.createElement("div", { style: { height: 1, background: C.border, margin: "10px 0" } }),
        React.createElement(Linea, { l: "Recibís", v: fmt(neto), strong: true })
      ),
      React.createElement(ToggleField, { label: "Ofrecer clase de prueba gratis", desc: "Aumenta mucho las chances de que te elijan.", on: f.prueba, onChange: () => set("prueba", !f.prueba) }),
      React.createElement("div", { style: { display: "flex", gap: 11, alignItems: "flex-start", background: A.curso.soft, borderRadius: 12, padding: "13px 16px" } },
        React.createElement("div", { style: { color: A.curso.solid, flexShrink: 0, marginTop: 1 } }, React.createElement(Icon, { name: "badge-check", size: 18 })),
        React.createElement("div", { style: { fontSize: 12.5, color: C.textSoft, lineHeight: 1.5 } }, "Antes de publicar te haremos una breve verificación para mostrar la insignia de docente verificado en tu publicación."))
    );
  }
  function Linea({ l, v, muted, strong }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
      React.createElement("span", { style: { fontSize: strong ? 14 : 13, color: muted ? C.muted : C.textSoft, fontWeight: strong ? 700 : 500 } }, l),
      React.createElement("span", { style: { fontSize: strong ? 16 : 13.5, color: strong ? C.text : C.textSoft, fontWeight: strong ? 750 : 600 } }, v));
  }

  // ── Campos reutilizables ──
  function FieldGroup({ label, children }) {
    const { C } = useTheme();
    return React.createElement("div", null,
      React.createElement("div", { style: { fontSize: 13, fontWeight: 650, color: C.textSoft, marginBottom: 10 } }, label),
      children);
  }
  function TextField({ label, value, onChange, placeholder, area, hint, prefix }) {
    const { C, A } = useTheme();
    const [foc, setFoc] = React.useState(false);
    const base = { width: "100%", border: `1.5px solid ${foc ? A.curso.solid : C.border}`, borderRadius: 11, padding: prefix ? "12px 14px 12px 30px" : "12px 14px", fontFamily: "inherit", fontSize: 14.5, color: C.text, background: C.surfaceAlt, outline: "none", boxShadow: foc ? `0 0 0 4px ${A.curso.ring}` : "none", boxSizing: "border-box" };
    return React.createElement("label", { style: { display: "block" } },
      label && React.createElement("span", { style: { display: "block", fontSize: 13, fontWeight: 650, color: C.textSoft, marginBottom: 8 } }, label),
      React.createElement("div", { style: { position: "relative" } },
        prefix && React.createElement("span", { style: { position: "absolute", left: 14, top: area ? 12 : "50%", transform: area ? "none" : "translateY(-50%)", color: C.muted, fontSize: 14.5, fontWeight: 600 } }, prefix),
        area
          ? React.createElement("textarea", { value, onChange: (e) => onChange(e.target.value), placeholder, onFocus: () => setFoc(true), onBlur: () => setFoc(false), rows: 4, style: { ...base, resize: "vertical", lineHeight: 1.5 } })
          : React.createElement("input", { value, onChange: (e) => onChange(e.target.value), placeholder, onFocus: () => setFoc(true), onBlur: () => setFoc(false), style: base })),
      hint && React.createElement("span", { style: { display: "block", fontSize: 11.5, color: C.faint, marginTop: 6 } }, hint)
    );
  }
  function SelectField({ label, value, onChange, options }) {
    const { C } = useTheme();
    return React.createElement("label", { style: { display: "block" } },
      label && React.createElement("span", { style: { display: "block", fontSize: 13, fontWeight: 650, color: C.textSoft, marginBottom: 8 } }, label),
      React.createElement("select", { value, onChange: (e) => onChange(e.target.value), style: { width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 11, padding: "12px 14px", fontFamily: "inherit", fontSize: 14.5, color: value ? C.text : C.faint, background: C.surfaceAlt, outline: "none", cursor: "pointer", boxSizing: "border-box" } },
        options.map(([v, l]) => React.createElement("option", { key: v, value: v }, l)))
    );
  }
  function SelectInline({ value, onChange, options }) {
    const { C } = useTheme();
    return React.createElement("select", { value, onChange: (e) => onChange(e.target.value), style: { border: `1.5px solid ${C.border}`, borderRadius: 11, padding: "12px 14px", fontFamily: "inherit", fontSize: 14, color: C.textSoft, background: C.surfaceAlt, outline: "none", cursor: "pointer", fontWeight: 600, height: 47 } },
      options.map(([v, l]) => React.createElement("option", { key: v, value: v }, l)));
  }
  function ChipField({ label, value, onChange, options }) {
    const { C, A } = useTheme();
    return React.createElement(FieldGroup, { label },
      React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } },
        options.map(([v, l]) => {
          const sel = value === v;
          return React.createElement("button", { key: v, onClick: () => onChange(v), style: { padding: "9px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: sel ? 650 : 500, border: `1.5px solid ${sel ? "transparent" : C.border}`, background: sel ? A.curso.solid : C.surface, color: sel ? "#fff" : C.textSoft, transition: "all .14s" } }, l);
        }))
    );
  }
  function ToggleField({ label, desc, on, onChange }) {
    const { C, A } = useTheme();
    return React.createElement("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, cursor: "pointer", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" } },
      React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 14, fontWeight: 650, color: C.text } }, label),
        desc && React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginTop: 2 } }, desc)),
      React.createElement("button", { onClick: (e) => { e.preventDefault(); onChange(); }, role: "switch", "aria-checked": on, style: { width: 46, height: 27, borderRadius: 14, border: "none", cursor: "pointer", background: on ? A.curso.solid : C.borderStrong, position: "relative", flexShrink: 0 } },
        React.createElement("span", { style: { position: "absolute", top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "#fff", transition: "left .16s", boxShadow: "0 1px 3px rgba(0,0,0,.3)" } }))
    );
  }

  window.PublishUI = { PublishModal };
})();
