/* Página Juegos — hub de juegos diarios + leaderboard */
(function () {
  const { useTheme, Icon, UI, tx, PageKit } = window;
  const { Avatar } = UI;
  const { PageTitle, Card } = PageKit;

  function Juegos() {
    const { C, A } = useTheme();
    const JUEGOS = window.LUDERIS.JUEGOS;
    const LB = window.LUDERIS.LEADERBOARD;
    const ME = window.LUDERIS.ME;

    return React.createElement("div", null,
      React.createElement(PageTitle, { title: "Juegos", sub: "Desafíos diarios para mantener la mente activa. Sumá puntos y cuidá tu racha." }),

      // Tira de racha
      React.createElement("div", { style: { display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" } },
        React.createElement(StreakStat, { icon: "zap", label: "Racha actual", value: ME.racha, suffix: "días", accent: "clase" }),
        React.createElement(StreakStat, { icon: "trending-up", label: "Puntos totales", value: "2.480", accent: "curso" }),
        React.createElement(StreakStat, { icon: "star", label: "Posición", value: "#3", accent: "pedido" })
      ),

      React.createElement("div", { className: "ld-juegos-grid", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 } },
        JUEGOS.map((g) => React.createElement(GameCard, { key: g.id, g }))
      ),

      // Leaderboard
      React.createElement("h2", { style: { ...tx("h2"), color: C.text, margin: "0 0 14px" } }, "Tabla de líderes"),
      React.createElement(Card, { pad: 0 },
        LB.map((r, i) => React.createElement(LBRow, { key: r.pos, r, last: i === LB.length - 1 }))
      )
    );
  }

  function StreakStat({ icon, label, value, suffix, accent }) {
    const { C, A } = useTheme();
    const ac = A[accent];
    return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 13, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", boxShadow: C.shadow, flex: 1, minWidth: 160 } },
      React.createElement("div", { style: { width: 40, height: 40, borderRadius: 11, background: ac.soft, color: ac.solid, display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: icon, size: 20, stroke: 2 })),
      React.createElement("div", null,
        React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 4 } },
          React.createElement("span", { style: { fontSize: 22, fontWeight: 750, color: C.text, letterSpacing: "-.02em" } }, value),
          suffix && React.createElement("span", { style: { fontSize: 12.5, color: C.faint, fontWeight: 600 } }, suffix)),
        React.createElement("div", { style: { fontSize: 12.5, color: C.muted, fontWeight: 500 } }, label)
      )
    );
  }

  function GameCard({ g }) {
    const { C } = useTheme();
    const [h, setH] = React.useState(false);
    const play = () => window.__ldToast && window.__ldToast(g.done ? `Resultado de ${g.nombre}: ¡bien jugado!` : `Abriendo ${g.nombre}…`, g.done ? "info" : "success");
    return React.createElement("div", {
      onClick: play,
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { background: C.surface, border: `1px solid ${g.done ? g.color + "44" : C.border}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", boxShadow: h ? C.shadowHover : C.shadow, transform: h ? "translateY(-3px)" : "none", transition: "all .18s" },
    },
      React.createElement("div", { style: { background: g.grad, padding: "20px 20px 18px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" } },
        React.createElement("div", null,
          React.createElement("div", { style: { width: 46, height: 46, borderRadius: 13, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color: "#fff" } }, React.createElement(Icon, { name: g.icon, size: 24, stroke: 2 })),
          React.createElement("div", { style: { fontSize: 21, fontWeight: 800, color: "#fff", letterSpacing: "-.01em" } }, g.nombre),
          React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,.82)", marginTop: 2 } }, g.tagline)
        ),
        g.done
          ? React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.22)", borderRadius: 20, padding: "5px 11px", fontSize: 11.5, fontWeight: 700, color: "#fff" } }, React.createElement(Icon, { name: "check", size: 13, stroke: 2.6 }), g.tiempo)
          : React.createElement("span", { style: { background: "rgba(255,255,255,.22)", borderRadius: 20, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, color: "#fff" } }, "Nuevo hoy")
      ),
      React.createElement("div", { style: { padding: "16px 20px 18px" } },
        React.createElement("p", { style: { ...tx("body"), color: C.muted, margin: "0 0 16px", minHeight: 42 } }, g.reglas),
        React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
          React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.textSoft, fontWeight: 600 } },
            React.createElement(Icon, { name: "zap", size: 14, color: g.color }), `Racha de ${g.racha} días`),
          React.createElement("button", {
            onClick: (e) => { e.stopPropagation(); play(); },
            style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 650, color: "#fff", background: g.done ? C.faint : g.color, whiteSpace: "nowrap" },
          }, g.done ? "Ver resultado" : "Jugar", React.createElement(Icon, { name: "arrow-right", size: 15, stroke: 2.2 }))
        )
      )
    );
  }

  function LBRow({ r, last }) {
    const { C, A } = useTheme();
    const medal = r.pos <= 3;
    const medalColor = ["#E8B923", "#9CA9B8", "#C77B3A"][r.pos - 1];
    return React.createElement("div", {
      style: { display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderBottom: last ? "none" : `1px solid ${C.hairline}`, background: r.yo ? A.curso.soft : "transparent" },
    },
      React.createElement("div", { style: { width: 28, textAlign: "center", fontSize: 15, fontWeight: 750, color: medal ? medalColor : C.faint } }, medal ? "" : r.pos,
        medal && React.createElement(Icon, { name: "star", size: 18, color: medalColor, stroke: 0, style: { fill: medalColor } })),
      React.createElement(Avatar, { name: r.nombre, size: 36 }),
      React.createElement("div", { style: { flex: 1, minWidth: 0 } },
        React.createElement("div", { style: { fontSize: 13.5, fontWeight: r.yo ? 700 : 600, color: r.yo ? A.curso.text : C.text } }, r.nombre, r.yo && React.createElement("span", { style: { fontSize: 11.5, fontWeight: 600, color: A.curso.text, marginLeft: 7 } }, "Vos")),
        React.createElement("div", { style: { fontSize: 12, color: C.muted, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 1 } }, React.createElement(Icon, { name: "zap", size: 12 }), `${r.racha} días de racha`)
      ),
      React.createElement("div", { style: { fontSize: 15, fontWeight: 750, color: C.text } }, r.pts.toLocaleString("es-AR"),
        React.createElement("span", { style: { fontSize: 11.5, color: C.faint, fontWeight: 600, marginLeft: 3 } }, "pts"))
    );
  }

  window.PageJuegos = Juegos;
})();
