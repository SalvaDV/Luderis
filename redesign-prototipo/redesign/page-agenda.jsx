/* Página Mi Agenda — calendario mensual + próximas clases */
(function () {
  const { useTheme, Icon, UI, tx, PageKit } = window;
  const { Avatar } = UI;
  const { PageTitle, RolBadge, ModChip, Card, EmptyState } = PageKit;

  const DIAS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
  const DIAS_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  function Agenda() {
    const { C, A } = useTheme();
    const AG = window.LUDERIS.AGENDA;
    const [sel, setSel] = React.useState(0); // día relativo seleccionado (0 = hoy)

    // referencia: "hoy" = lunes de esta semana para el grid simple
    const today = new Date();
    const jsDay = (today.getDay() + 6) % 7; // 0=lunes
    const monthLabel = today.toLocaleString("es-AR", { month: "long", year: "numeric" });
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstWeekday = (new Date(today.getFullYear(), today.getMonth(), 1).getDay() + 6) % 7;
    const todayDate = today.getDate();

    // map: para cada "dia relativo" (0..6 desde hoy) cuántas clases
    const byRel = {};
    AG.forEach((c) => { byRel[c.dia] = byRel[c.dia] || []; byRel[c.dia].push(c); });
    // qué fecha del mes corresponde a cada dia relativo
    const relToDate = (rel) => todayDate + rel;

    const selClases = (byRel[sel] || []).sort((a, b) => a.hora.localeCompare(b.hora));
    const selLabel = sel === 0 ? "Hoy" : sel === 1 ? "Mañana" : DIAS_FULL[(jsDay + sel) % 7];

    return React.createElement("div", null,
      React.createElement(PageTitle, { title: "Mi agenda", sub: "Tus próximas clases y horarios en un solo lugar." }),

      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 18 } },
        React.createElement("div", { className: "ld-agenda-grid", style: { display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 18 } },
          // ── Calendario ──
          React.createElement(Card, { pad: 20 },
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 } },
              React.createElement("h2", { style: { ...tx("h2"), color: C.text, margin: 0, textTransform: "capitalize" } }, monthLabel),
              React.createElement("div", { style: { display: "flex", gap: 6 } },
                React.createElement(NavBtn, { icon: "arrow-left", onClick: () => window.__ldToast && window.__ldToast("Mostrando el mes actual", "info") }),
                React.createElement(NavBtn, { icon: "arrow-right", onClick: () => window.__ldToast && window.__ldToast("Mostrando el mes actual", "info") })
              )
            ),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 } },
              DIAS.map((d) => React.createElement("div", { key: d, style: { textAlign: "center", fontSize: 11, fontWeight: 650, color: C.faint, textTransform: "uppercase", letterSpacing: ".04em", padding: "4px 0" } }, d))
            ),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 } },
              Array.from({ length: firstWeekday }).map((_, i) => React.createElement("div", { key: "e" + i })),
              Array.from({ length: daysInMonth }).map((_, i) => {
                const date = i + 1;
                const rel = date - todayDate;
                const has = rel >= 0 && rel <= 6 && byRel[rel];
                const isToday = date === todayDate;
                const isSel = rel === sel && rel >= 0 && rel <= 6;
                const isPast = date < todayDate;
                return React.createElement("button", {
                  key: date, onClick: () => { if (rel >= 0 && rel <= 6) setSel(rel); },
                  disabled: !(rel >= 0 && rel <= 6),
                  style: {
                    position: "relative", aspectRatio: "1", borderRadius: 9, border: isToday ? `1.5px solid ${A.curso.solid}` : "1px solid transparent",
                    background: isSel ? A.curso.solid : isToday ? A.curso.soft : "transparent",
                    color: isSel ? "#fff" : isPast ? C.faint : C.text, opacity: isPast ? .5 : 1,
                    fontSize: 13, fontWeight: isToday || isSel ? 700 : 500, cursor: rel >= 0 && rel <= 6 ? "pointer" : "default",
                    fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .14s",
                  },
                },
                  date,
                  has && React.createElement("span", { style: { position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2 } },
                    byRel[rel].slice(0, 3).map((_, k) => React.createElement("span", { key: k, style: { width: 4, height: 4, borderRadius: "50%", background: isSel ? "rgba(255,255,255,.9)" : A.curso.solid } })))
                );
              })
            ),
            React.createElement("div", { style: { display: "flex", gap: 16, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.hairline}`, fontSize: 12, color: C.muted } },
              React.createElement(Legend, { color: A.curso.solid, label: "Con clases" }),
              React.createElement(Legend, { color: A.curso.soft, label: "Hoy", border: A.curso.solid })
            )
          ),

          // ── Día seleccionado ──
          React.createElement("div", null,
            React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 } },
              React.createElement("h2", { style: { ...tx("h2"), color: C.text, margin: 0 } }, selLabel),
              React.createElement("span", { style: { fontSize: 13, color: C.faint, fontWeight: 500 } }, `${selClases.length} clase${selClases.length !== 1 ? "s" : ""}`)
            ),
            selClases.length === 0
              ? React.createElement(Card, { pad: 28, style: { textAlign: "center" } },
                  React.createElement("div", { style: { color: C.faint, marginBottom: 8, display: "flex", justifyContent: "center" } }, React.createElement(Icon, { name: "calendar", size: 26 })),
                  React.createElement("p", { style: { ...tx("body"), color: C.muted, margin: 0 } }, "Sin clases este día. ¡Aprovechá para descansar!"))
              : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
                  selClases.map((c) => React.createElement(AgendaSlot, { key: c.id, c })))
          )
        ),

        // ── Próximas (semana) ──
        React.createElement("div", null,
          React.createElement("h2", { style: { ...tx("h2"), color: C.text, margin: "8px 0 14px" } }, "Esta semana"),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 } },
            [...AG].sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora)).map((c) => React.createElement(WeekCard, { key: c.id, c, jsDay, DIAS_FULL }))
          )
        )
      )
    );
  }

  function Legend({ color, label, border }) {
    return React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 } },
      React.createElement("span", { style: { width: 12, height: 12, borderRadius: 4, background: color, border: border ? `1.5px solid ${border}` : "none" } }), label);
  }

  function NavBtn({ icon, onClick }) {
    const { C } = useTheme();
    const [h, setH] = React.useState(false);
    return React.createElement("button", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false), "aria-label": icon,
      style: { width: 32, height: 32, borderRadius: 8, border: `1px solid ${h ? C.borderStrong : C.border}`, background: h ? C.surfaceAlt : "transparent", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
    }, React.createElement(Icon, { name: icon, size: 16 }));
  }

  function AgendaSlot({ c }) {
    const { C, A } = useTheme();
    const ac = c.rol === "docente" ? A.clase : A.curso;
    const [h, setH] = React.useState(false);
    return React.createElement("div", {
      onClick: () => window.__ldNav && window.__ldNav("inscripciones"),
      onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { display: "flex", gap: 13, background: C.surface, border: `1px solid ${h ? C.borderStrong : C.border}`, borderRadius: 13, padding: 15, boxShadow: h ? C.shadowHover : C.shadow, transition: "all .16s", cursor: "pointer" },
    },
      React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 56, padding: "4px 8px", borderRadius: 10, background: ac.soft } },
        React.createElement("span", { style: { fontSize: 16, fontWeight: 750, color: ac.text, lineHeight: 1.1 } }, c.hora),
        React.createElement("span", { style: { fontSize: 11, color: ac.text, opacity: .8, marginTop: 2 } }, `${c.dur}m`)
      ),
      React.createElement("div", { style: { flex: 1, minWidth: 0 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7, marginBottom: 5 } },
          React.createElement("h3", { style: { ...tx("cardTitle"), color: C.text, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, c.titulo),
        ),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } },
          React.createElement(RolBadge, { rol: c.rol }),
          React.createElement(ModChip, { modalidad: c.modalidad }),
          React.createElement("span", { style: { fontSize: 12.5, color: C.muted, display: "inline-flex", alignItems: "center", gap: 5 } }, React.createElement(Avatar, { name: c.con, size: 18 }), c.con)
        )
      ),
      c.modalidad === "virtual" && React.createElement("button", {
        onClick: (e) => { e.stopPropagation(); window.__ldToast && window.__ldToast(`Te unís a “${c.titulo}”`, "success"); },
        style: { alignSelf: "center", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 650, color: "#fff", background: "linear-gradient(135deg,#1A6ED8,#0F9C82)", whiteSpace: "nowrap", flexShrink: 0 },
      }, React.createElement(Icon, { name: "play-circle", size: 15 }), "Unirme")
    );
  }

  function WeekCard({ c, jsDay, DIAS_FULL }) {
    const { C, A } = useTheme();
    const ac = c.rol === "docente" ? A.clase : A.curso;
    const dayLabel = c.dia === 0 ? "Hoy" : c.dia === 1 ? "Mañana" : DIAS_FULL[(jsDay + c.dia) % 7];
    return React.createElement("div", {
      style: { display: "flex", alignItems: "center", gap: 12, background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${ac.solid}`, borderRadius: 12, padding: "13px 15px", boxShadow: C.shadow },
    },
      React.createElement("div", { style: { minWidth: 0, flex: 1 } },
        React.createElement("div", { style: { fontSize: 13.5, fontWeight: 650, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 } }, c.titulo),
        React.createElement("div", { style: { fontSize: 12.5, color: C.muted, display: "flex", alignItems: "center", gap: 7 } },
          React.createElement("span", { style: { fontWeight: 600, color: ac.text } }, dayLabel),
          React.createElement("span", { style: { color: C.border } }, "·"),
          React.createElement("span", null, c.hora),
          React.createElement("span", { style: { color: C.border } }, "·"),
          React.createElement(ModChip, { modalidad: c.modalidad })
        )
      )
    );
  }

  window.PageAgenda = Agenda;
})();
