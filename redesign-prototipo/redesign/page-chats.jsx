/* Página Mis Chats — lista de conversaciones + panel de conversación */
(function () {
  const { useTheme, Icon, UI, tx, PageKit } = window;
  const { Avatar } = UI;
  const { PageTitle, EmptyState } = PageKit;

  function Chats({ isMobile }) {
    const { C, A } = useTheme();
    const CHATS = window.LUDERIS.CHATS;
    const [q, setQ] = React.useState("");
    const [active, setActive] = React.useState(isMobile ? null : CHATS[0].id);

    const norm = (s) => (s || "").toLowerCase();
    const filtered = CHATS.filter((c) => !q || norm(c.persona).includes(norm(q)) || norm(c.pub).includes(norm(q)));
    const current = CHATS.find((c) => c.id === active);

    const totalUnread = CHATS.reduce((a, c) => a + c.unread, 0);

    const listPanel = React.createElement("div", {
      style: { display: "flex", flexDirection: "column", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: C.shadow, height: "100%" },
    },
      React.createElement("div", { style: { padding: 14, borderBottom: `1px solid ${C.hairline}` } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px" } },
          React.createElement(Icon, { name: "search", size: 17, color: C.faint }),
          React.createElement("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Buscar conversación…", style: { flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 13.5, color: C.text } })
        )
      ),
      React.createElement("div", { style: { flex: 1, overflowY: "auto" } },
        filtered.length === 0
          ? React.createElement("div", { style: { padding: "40px 20px", textAlign: "center", color: C.muted, fontSize: 13 } }, "Sin conversaciones.")
          : filtered.map((c) => React.createElement(ChatRow, { key: c.id, c, active: c.id === active, onClick: () => setActive(c.id) }))
      )
    );

    const convoPanel = current && React.createElement(Conversation, { c: current, onBack: () => setActive(null), isMobile });

    return React.createElement("div", { style: { height: "100%", display: "flex", flexDirection: "column" } },
      React.createElement(PageTitle, {
        title: "Mis chats",
        sub: totalUnread > 0 ? `Tenés ${totalUnread} mensaje${totalUnread !== 1 ? "s" : ""} sin leer.` : "Coordiná tus clases con docentes y alumnos.",
      }),
      isMobile
        ? (active ? convoPanel : listPanel)
        : React.createElement("div", { style: { display: "grid", gridTemplateColumns: "340px 1fr", gap: 16, height: "calc(100vh - 230px)", minHeight: 460 } },
            listPanel,
            current ? convoPanel : React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14 } },
              React.createElement(EmptyState, { icon: "message-circle", title: "Elegí una conversación", sub: "Seleccioná un chat de la lista para ver los mensajes." }))
          )
    );
  }

  function ChatRow({ c, active, onClick }) {
    const { C, A } = useTheme();
    const [h, setH] = React.useState(false);
    const grupo = c.tipo === "grupo";
    return React.createElement("button", {
      onClick, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false),
      style: { width: "100%", display: "flex", gap: 12, padding: "13px 14px", border: "none", borderBottom: `1px solid ${C.hairline}`, background: active ? A.curso.soft : h ? C.surfaceAlt : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "background .14s" },
    },
      React.createElement("div", { style: { position: "relative", flexShrink: 0 } },
        grupo
          ? React.createElement("div", { style: { width: 44, height: 44, borderRadius: "50%", background: A.curso.soft, color: A.curso.solid, display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: "users", size: 21 }))
          : React.createElement(Avatar, { name: c.persona, size: 44 }),
        c.online && !grupo && React.createElement("span", { style: { position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: C.teal, border: `2px solid ${active ? A.curso.soft : C.surface}` } })
      ),
      React.createElement("div", { style: { flex: 1, minWidth: 0 } },
        React.createElement("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 } },
          React.createElement("span", { style: { fontSize: 13.5, fontWeight: c.unread ? 700 : 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, c.persona),
          React.createElement("span", { style: { fontSize: 11.5, color: c.unread ? A.curso.text : C.faint, fontWeight: c.unread ? 650 : 500, flexShrink: 0 } }, c.hora)
        ),
        React.createElement("div", { style: { fontSize: 12, color: C.faint, margin: "1px 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, c.pub),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
          React.createElement("span", { style: { flex: 1, fontSize: 12.5, color: c.unread ? C.textSoft : C.muted, fontWeight: c.unread ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, c.ultimo),
          c.unread > 0 && React.createElement("span", { style: { flexShrink: 0, minWidth: 19, height: 19, padding: "0 6px", borderRadius: 10, background: A.curso.solid, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" } }, c.unread)
        )
      )
    );
  }

  function Conversation({ c, onBack, isMobile }) {
    const { C, A } = useTheme();
    const thread = window.LUDERIS.CHAT_THREAD;
    const [draft, setDraft] = React.useState("");
    const [sent, setSent] = React.useState([]);
    const scrollRef = React.useRef(null);
    React.useEffect(() => { setSent([]); }, [c.id]);
    React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [c.id, sent.length]);
    const send = () => {
      const txt = draft.trim();
      if (!txt) return;
      const hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      setSent((s) => [...s, { de: "mi", txt, hora }]);
      setDraft("");
    };

    return React.createElement("div", {
      style: { display: "flex", flexDirection: "column", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: C.shadow, height: isMobile ? "calc(100vh - 230px)" : "100%", minHeight: isMobile ? 440 : undefined },
    },
      // header
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: `1px solid ${C.hairline}` } },
        isMobile && React.createElement("button", { onClick: onBack, "aria-label": "Volver", style: { border: "none", background: "transparent", color: C.muted, cursor: "pointer", display: "flex", padding: 4, marginLeft: -4 } }, React.createElement(Icon, { name: "arrow-left", size: 20 })),
        React.createElement(Avatar, { name: c.persona, size: 40 }),
        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
          React.createElement("div", { style: { fontSize: 14, fontWeight: 650, color: C.text } }, c.persona),
          React.createElement("div", { style: { fontSize: 12, color: c.online ? C.teal : C.faint, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 } },
            c.online && React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: C.teal } }),
            c.online ? "En línea" : c.pub)
        ),
        React.createElement("button", { onClick: () => window.__ldToast && window.__ldToast("Abriendo la publicación…", "info"), "aria-label": "Ver publicación", style: { border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", borderRadius: 9, padding: "7px 12px", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 } },
          React.createElement(Icon, { name: "graduation-cap", size: 15 }), !isMobile && "Ver clase")
      ),
      // mensajes
      React.createElement("div", { ref: scrollRef, style: { flex: 1, overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10, background: C.bg } },
        React.createElement("div", { style: { textAlign: "center", marginBottom: 4 } },
          React.createElement("span", { style: { fontSize: 11.5, color: C.faint, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 12px", fontWeight: 500 } }, "Hoy")),
        thread.map((m, i) => React.createElement(Bubble, { key: i, m })),
        React.createElement(Bubble, { m: { de: "ellos", txt: c.ultimo, hora: c.hora } }),
        sent.map((m, i) => React.createElement(Bubble, { key: "s" + i, m }))
      ),
      // composer
      React.createElement("div", { style: { padding: 12, borderTop: `1px solid ${C.hairline}`, display: "flex", gap: 9, alignItems: "center" } },
        React.createElement("input", {
          value: draft, onChange: (e) => setDraft(e.target.value),
          placeholder: "Escribí un mensaje…",
          onKeyDown: (e) => { if (e.key === "Enter") send(); },
          style: { flex: 1, border: `1px solid ${C.border}`, borderRadius: 11, padding: "11px 15px", fontFamily: "inherit", fontSize: 14, color: C.text, background: C.surfaceAlt, outline: "none" },
        }),
        React.createElement("button", {
          onClick: send, "aria-label": "Enviar",
          style: { width: 42, height: 42, borderRadius: 11, border: "none", cursor: "pointer", color: "#fff", background: "linear-gradient(135deg,#1A6ED8,#0F9C82)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
        }, React.createElement(Icon, { name: "arrow-right", size: 19, stroke: 2.2 }))
      )
    );
  }

  function Bubble({ m }) {
    const { C, A } = useTheme();
    const mine = m.de === "mi";
    return React.createElement("div", { style: { display: "flex", justifyContent: mine ? "flex-end" : "flex-start" } },
      React.createElement("div", { style: { maxWidth: "76%", display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: 3 } },
        React.createElement("div", {
          style: {
            padding: "10px 14px", borderRadius: 15, fontSize: 14, lineHeight: 1.45,
            background: mine ? "linear-gradient(135deg,#1A6ED8,#1666CC)" : C.surface,
            color: mine ? "#fff" : C.text,
            border: mine ? "none" : `1px solid ${C.border}`,
            borderBottomRightRadius: mine ? 5 : 15, borderBottomLeftRadius: mine ? 15 : 5,
          },
        }, m.txt),
        React.createElement("span", { style: { fontSize: 10.5, color: C.faint, padding: "0 4px" } }, m.hora)
      )
    );
  }

  window.PageChats = Chats;
})();
