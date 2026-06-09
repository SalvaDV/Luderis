/* Página Docentes destacados — grilla filtrable */
(function () {
  const { useTheme, Icon, UI, tx, PageKit } = window;
  const { PrimaryBtn } = UI;
  const { PageTitle, EmptyState } = PageKit;

  const FILTROS = [
    { id: "all",       label: "Todos"       },
    { id: "curso",     label: "Cursos"      },
    { id: "clase",     label: "Clases part."},
    { id: "online",    label: "Online"      },
    { id: "presencial",label: "Presencial"  },
  ];

  function PageDocentes() {
    const { C, A } = useTheme();
    const [filtro, setFiltro] = React.useState("all");
    const [search, setSearch] = React.useState("");
    const TEACHERS = window.LUDERIS.TEACHERS || [];
    const { TeacherCard } = window.ExploreUI;

    const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const filtered = TEACHERS.filter((t) => {
      if (filtro === "curso"      && t.accent !== "curso")  return false;
      if (filtro === "clase"      && t.accent !== "clase")  return false;
      if (filtro === "online"     && t.ciudad !== "Online") return false;
      if (filtro === "presencial" && t.ciudad === "Online") return false;
      if (search) {
        const q = norm(search);
        if (!norm(t.nombre).includes(q) && !t.materias.some((m) => norm(m).includes(q))) return false;
      }
      return true;
    });

    return React.createElement("div", null,
      React.createElement(PageTitle, { title: "Docentes", sub: "Los mejor valorados de la plataforma." }),

      // Buscador + chips
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 } },
        React.createElement("div", {
          style: { display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "5px 6px 5px 14px" },
        },
          React.createElement(Icon, { name: "search", size: 18, color: C.faint }),
          React.createElement("input", {
            value: search, onChange: (e) => setSearch(e.target.value),
            placeholder: "Buscá un docente o materia…",
            style: { flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 14, color: C.text, padding: "8px 0" },
          }),
          search && React.createElement("button", {
            onClick: () => setSearch(""),
            style: { border: "none", background: "transparent", color: C.faint, cursor: "pointer", padding: 6, display: "flex" },
          }, React.createElement(Icon, { name: "x", size: 16 }))
        ),
        React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
          FILTROS.map((f) => {
            const active = filtro === f.id;
            return React.createElement("button", {
              key: f.id, onClick: () => setFiltro(f.id),
              style: { padding: "7px 14px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: active ? 650 : 500, border: `1px solid ${active ? "transparent" : C.border}`, background: active ? A.curso.solid : C.surface, color: active ? "#fff" : C.textSoft, transition: "all .14s" },
            }, f.label);
          })
        )
      ),

      // Contador
      React.createElement("div", { style: { fontSize: 13.5, color: C.muted, marginBottom: 16, fontWeight: 500 } },
        React.createElement("span", { style: { color: C.text, fontWeight: 700 } }, filtered.length),
        ` docente${filtered.length !== 1 ? "s" : ""}`
      ),

      // Grilla
      filtered.length === 0
        ? React.createElement(EmptyState, { icon: "users", title: "No encontramos docentes", sub: "Probá con otro filtro o término de búsqueda.", cta: "Ver todos", onCta: () => { setFiltro("all"); setSearch(""); } })
        : React.createElement("div", {
            style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 },
          },
            filtered.map((t) => React.createElement(TeacherCard, { key: t.id, t, onOpen: (t) => window.__ldProfile && window.__ldProfile(t) }))
          )
    );
  }

  window.PageDocentes = PageDocentes;
})();
