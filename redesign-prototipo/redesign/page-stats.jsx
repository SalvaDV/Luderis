/* Modal de estadísticas de una publicación */
(function () {
  const { useTheme, Icon, UI, tx } = window;
  const { Avatar } = UI;

  const SC = { info: "#3B82F6", success: "#10B981", warn: "#F59E0B", purple: "#8B5CF6", accent: "#1A6ED8" };
  const fmt = (n) => "$" + Number(n || 0).toLocaleString("es-AR");

  function StatsModal({ post, onClose }) {
    const { C, A } = useTheme();
    if (!post) return null;
    const ac = post.modo === "particular" ? A.clase : A.curso;
    const vistas = post.vistas || 600;
    const alumnos = post.inscriptos || 0;
    const conv = vistas ? Math.max(2, Math.round((alumnos / vistas) * 100)) : 0;
    // serie 7 días derivada del total
    const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const base = Math.round(vistas / 7);
    const serie = dias.map((d, i) => ({ d, v: Math.max(8, Math.round(base * (0.6 + ((i * 7 + post.titulo.length) % 9) / 10))) }));
    const maxV = Math.max(...serie.map((s) => s.v));
    const fuentes = [
      { label: "Búsqueda", pct: 46, color: SC.accent },
      { label: "Categorías", pct: 28, color: SC.success },
      { label: "Perfil docente", pct: 17, color: SC.purple },
      { label: "Compartido", pct: 9, color: SC.warn },
    ];
    const ingresoEst = alumnos * (post.precio || 0);

    return React.createElement(React.Fragment, null,
      React.createElement("div", { onClick: onClose, style: { position: "fixed", inset: 0, background: C.overlay, zIndex: 80, animation: "ldFade .15s ease" } }),
      React.createElement("div", { style: { position: "fixed", zIndex: 81, top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(640px,94vw)", maxHeight: "92vh", background: C.surface, borderRadius: 18, boxShadow: C.shadowHover, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "inherit" } },
        // Header
        React.createElement("div", { style: { padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexShrink: 0 } },
          React.createElement("div", { style: { minWidth: 0 } },
            React.createElement("div", { style: { fontSize: 11.5, fontWeight: 700, color: ac.text, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 } }, "Estadísticas"),
            React.createElement("h2", { style: { ...tx("h1", { fontSize: 19 }), color: C.text, margin: 0, lineHeight: 1.25 } }, post.titulo)),
          React.createElement("button", { onClick: onClose, "aria-label": "Cerrar", style: { width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "x", size: 18 }))
        ),
        // Body
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "22px 24px" } },
          // KPIs
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 12, marginBottom: 24 } },
            React.createElement(Kpi, { icon: "eye", label: "Vistas totales", value: vistas.toLocaleString("es-AR"), color: SC.info, trend: "+18%" }),
            React.createElement(Kpi, { icon: "users", label: "Alumnos", value: alumnos, color: SC.success }),
            React.createElement(Kpi, { icon: "trending-up", label: "Conversión", value: conv + "%", color: SC.purple }),
            React.createElement(Kpi, { icon: "star", label: "Valoración", value: post.rating ? post.rating.toFixed(1) : "—", color: SC.warn, sub: `${post.reviews || 0} reseñas` })
          ),
          // Vistas 7 días
          React.createElement("div", { style: { marginBottom: 24 } },
            React.createElement(SubHead, { title: "Vistas — últimos 7 días" }),
            React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 10, height: 130, marginTop: 14 } },
              serie.map((s, i) => React.createElement("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 } },
                React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: C.faint } }, s.v),
                React.createElement("div", { title: `${s.v} vistas`, style: { width: "100%", maxWidth: 30, height: `${(s.v / maxV) * 86}px`, borderRadius: 6, background: `linear-gradient(180deg,${ac.solid},${ac.solid}aa)`, opacity: i === 4 ? 1 : .6 } }),
                React.createElement("span", { style: { fontSize: 11, color: C.faint } }, s.d)
              ))
            )
          ),
          // Fuentes de tráfico
          React.createElement("div", { style: { marginBottom: 24 } },
            React.createElement(SubHead, { title: "De dónde llegan" }),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 11, marginTop: 14 } },
              fuentes.map((fu, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 12 } },
                React.createElement("span", { style: { fontSize: 13, color: C.textSoft, width: 110, flexShrink: 0 } }, fu.label),
                React.createElement("div", { style: { flex: 1, height: 8, borderRadius: 4, background: C.surfaceAlt, overflow: "hidden" } }, React.createElement("div", { style: { height: "100%", width: `${fu.pct}%`, borderRadius: 4, background: fu.color } })),
                React.createElement("span", { style: { fontSize: 12.5, fontWeight: 700, color: C.text, width: 36, textAlign: "right" } }, fu.pct + "%")
              ))
            )
          ),
          // Ingresos estimados
          post.modo !== undefined && React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, background: ac.soft, borderRadius: 14, padding: "16px 18px" } },
            React.createElement("div", { style: { width: 42, height: 42, borderRadius: 11, background: C.surface, color: ac.solid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "trending-up", size: 20 })),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontSize: 12.5, color: ac.text, fontWeight: 600 } }, "Ingreso estimado de esta publicación"),
              React.createElement("div", { style: { fontSize: 22, fontWeight: 800, color: C.text, marginTop: 2 } }, ingresoEst > 0 ? fmt(ingresoEst) : "—")),
            React.createElement("div", { style: { fontSize: 12, color: ac.text, textAlign: "right" } }, `${alumnos} × ${fmt(post.precio)}`, React.createElement("br"), `/${post.precio_tipo || "mes"}`)
          )
        ),
        // Footer
        React.createElement("div", { style: { padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 } },
          React.createElement("button", { onClick: () => { onClose(); window.__ldPublish && window.__ldPublish(post); }, style: { display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 11, border: `1px solid ${C.border}`, background: "transparent", color: C.textSoft, fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, cursor: "pointer" } }, React.createElement(Icon, { name: "sliders-horizontal", size: 16 }), "Editar publicación"),
          React.createElement("button", { onClick: onClose, style: { padding: "10px 20px", borderRadius: 11, border: "none", background: ac.solid, color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 650, cursor: "pointer" } }, "Listo")
        )
      )
    );
  }

  function Kpi({ icon, label, value, color, trend, sub }) {
    const { C } = useTheme();
    return React.createElement("div", { style: { background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 13, padding: "14px 15px" } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
        React.createElement("div", { style: { width: 30, height: 30, borderRadius: 8, background: color + "1F", color, display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: icon, size: 15 })),
        trend && React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: SC.success } }, trend)),
      React.createElement("div", { style: { fontSize: 22, fontWeight: 800, color: C.text, marginTop: 10, lineHeight: 1 } }, value),
      React.createElement("div", { style: { fontSize: 11.5, color: C.muted, marginTop: 4 } }, sub || label)
    );
  }

  function SubHead({ title }) {
    const { C } = useTheme();
    return React.createElement("h3", { style: { fontSize: 14, fontWeight: 700, color: C.text, margin: 0 } }, title);
  }

  window.StatsModal = StatsModal;
})();
