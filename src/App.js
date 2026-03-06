import { useState, useEffect } from "react";

const SUPABASE_URL = "https://hptdyehzqfpgtrpuydny.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g";

const api = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.method === "POST" ? "return=representation" : "",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const db = {
  getPublicaciones: (filtros = {}) => {
    let q = "publicaciones?order=created_at.desc";
    if (filtros.tipo) q += `&tipo=eq.${filtros.tipo}`;
    if (filtros.materia) q += `&materia=eq.${encodeURIComponent(filtros.materia)}`;
    return api(q);
  },
  insertPublicacion: (data) => api("publicaciones", { method: "POST", body: JSON.stringify(data) }),
  getReseñas: (pubId) => api(`rese%C3%B1as?publicacion_id=eq.${pubId}&order=created_at.desc`),
  insertReseña: (data) => api("rese%C3%B1as", { method: "POST", body: JSON.stringify(data) }),
  getMensajes: (pubId) => api(`mensajes?publicacion_id=eq.${pubId}&order=created_at.asc`),
  insertMensaje: (data) => api("mensajes", { method: "POST", body: JSON.stringify(data) }),
};

const COLORS = {
  bg: "#0D0D0D", surface: "#161616", card: "#1E1E1E", border: "#2A2A2A",
  accent: "#F5C842", accentDim: "#F5C84222", text: "#F0EDE6", muted: "#888",
  success: "#4ECB71", tag: "#252525",
};

const MATERIAS = ["Matemáticas", "Física", "Química", "Inglés", "Programación", "Historia", "Biología", "Literatura", "Economía", "Arte"];

function Stars({ val }) {
  const v = parseFloat(val) || 0;
  return (
    <span style={{ color: COLORS.accent, fontSize: 13 }}>
      {"★".repeat(Math.round(v))}{"☆".repeat(5 - Math.round(v))}
      <span style={{ color: COLORS.muted, marginLeft: 4, fontSize: 12 }}>{v.toFixed(1)}</span>
    </span>
  );
}

function Avatar({ letra, size = 38 }) {
  const colors = ["#F5C842", "#4ECB71", "#E05C5C", "#5CA8E0", "#C85CE0"];
  const l = (letra || "?")[0].toUpperCase();
  const color = colors[l.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.4, color: "#0D0D0D", flexShrink: 0 }}>
      {l}
    </div>
  );
}

function Tag({ tipo }) {
  const isOferta = tipo === "oferta";
  return (
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, background: isOferta ? "#4ECB7122" : "#F5C84222", color: isOferta ? "#4ECB71" : "#F5C842", border: `1px solid ${isOferta ? "#4ECB7144" : "#F5C84244"}` }}>
      {isOferta ? "📚 Oferta" : "🔍 Búsqueda"}
    </span>
  );
}

function MateriaTag({ m, selected, onClick }) {
  return (
    <button onClick={() => onClick(m)} style={{ background: selected ? COLORS.accent : COLORS.tag, color: selected ? "#0D0D0D" : COLORS.muted, border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: selected ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap" }}>
      {m}
    </button>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <div style={{ width: 28, height: 28, border: `3px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

function PostCard({ post, onOpenChat, onOpenDetail }) {
  const fecha = new Date(post.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div onClick={() => onOpenDetail(post)}
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "22px 24px", cursor: "pointer", transition: "border-color .2s, transform .15s", position: "relative", overflow: "hidden" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 3, background: post.tipo === "oferta" ? COLORS.success : COLORS.accent }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Avatar letra={post.autor_nombre?.[0] || "?"} />
          <div>
            <div style={{ fontWeight: 600, color: COLORS.text, fontSize: 14 }}>{post.autor_nombre}</div>
            <Stars val={post.valoracion} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <Tag tipo={post.tipo} />
          <span style={{ fontSize: 11, color: COLORS.muted }}>{fecha}</span>
        </div>
      </div>
      <div style={{ marginBottom: 6 }}>
        <span style={{ background: COLORS.accentDim, color: COLORS.accent, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 8 }}>{post.materia}</span>
      </div>
      <h3 style={{ color: COLORS.text, fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, margin: "8px 0", lineHeight: 1.3 }}>{post.titulo}</h3>
      <p style={{ color: COLORS.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{post.descripcion}</p>
      <div style={{ marginTop: 16 }}>
        <button onClick={e => { e.stopPropagation(); onOpenChat(post); }}
          style={{ background: COLORS.accent, color: "#0D0D0D", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          💬 Contactar
        </button>
      </div>
    </div>
  );
}

function ChatModal({ post, miNombre, onClose }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  const cargar = () => db.getMensajes(post.id).then(data => {
    const relevantes = data.filter(m =>
      (m.de_nombre === miNombre && m.para_nombre === post.autor_nombre) ||
      (m.de_nombre === post.autor_nombre && m.para_nombre === miNombre)
    );
    setMsgs(relevantes);
    setLoading(false);
  });

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 3000);
    return () => clearInterval(interval);
  }, [post.id]);

  const send = async () => {
    if (!input.trim()) return;
    const txt = input;
    setInput("");
    await db.insertMensaje({ publicacion_id: post.id, de_nombre: miNombre, para_nombre: post.autor_nombre, texto: txt });
    cargar();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20, width: "min(460px, 95vw)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Avatar letra={post.autor_nombre?.[0]} size={36} />
            <div>
              <div style={{ fontWeight: 700, color: COLORS.text }}>{post.autor_nombre}</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>{post.titulo}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px", display: "flex", flexDirection: "column", gap: 10, minHeight: 200 }}>
          {loading ? <Spinner /> :
            msgs.length === 0
              ? <div style={{ color: COLORS.muted, textAlign: "center", padding: 30, fontSize: 14 }}>Empezá la conversación 👋</div>
              : msgs.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.de_nombre === miNombre ? "flex-end" : "flex-start" }}>
                  <div style={{ background: m.de_nombre === miNombre ? COLORS.accent : COLORS.card, color: m.de_nombre === miNombre ? "#0D0D0D" : COLORS.text, padding: "10px 14px", borderRadius: 14, maxWidth: "75%", fontSize: 14, lineHeight: 1.5 }}>
                    {m.texto}
                  </div>
                </div>
              ))
          }
        </div>
        <div style={{ padding: "14px 18px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Escribí un mensaje..."
            style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px", color: COLORS.text, fontSize: 14, outline: "none" }} />
          <button onClick={send} style={{ background: COLORS.accent, border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer", color: "#0D0D0D", fontSize: 18 }}>↑</button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ post, miNombre, onClose, onChat }) {
  const [reseñas, setReseñas] = useState([]);
  const [reseña, setReseña] = useState("");
  const [estrella, setEstrella] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.getReseñas(post.id).then(setReseñas).finally(() => setLoading(false));
  }, [post.id]);

  const enviarReseña = async () => {
    if (!reseña.trim()) return;
    setSaving(true);
    await db.insertReseña({ publicacion_id: post.id, autor_nombre: miNombre, autor_avatar: miNombre[0], texto: reseña, estrellas: estrella });
    const updated = await db.getReseñas(post.id);
    setReseñas(updated);
    setReseña("");
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20, width: "min(600px, 95vw)", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ padding: "22px 26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Avatar letra={post.autor_nombre?.[0]} size={50} />
              <div>
                <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 16 }}>{post.autor_nombre}</div>
                <Stars val={post.valoracion} />
                <div style={{ marginTop: 4 }}><Tag tipo={post.tipo} /></div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 24, cursor: "pointer" }}>×</button>
          </div>
          <span style={{ background: COLORS.accentDim, color: COLORS.accent, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 8 }}>{post.materia}</span>
          <h2 style={{ color: COLORS.text, fontFamily: "Georgia, serif", fontSize: 22, margin: "10px 0 12px" }}>{post.titulo}</h2>
          <p style={{ color: COLORS.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>{post.descripcion}</p>
          <button onClick={() => { onClose(); onChat(post); }}
            style={{ background: COLORS.accent, color: "#0D0D0D", border: "none", borderRadius: 12, padding: "11px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 28 }}>
            💬 Iniciar conversación
          </button>
          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 20 }}>
            <h4 style={{ color: COLORS.text, marginBottom: 14 }}>Reseñas ({reseñas.length})</h4>
            {loading ? <Spinner /> : reseñas.map(r => (
              <div key={r.id} style={{ background: COLORS.card, borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                  <Avatar letra={r.autor_avatar || r.autor_nombre?.[0]} size={30} />
                  <div>
                    <span style={{ fontWeight: 600, color: COLORS.text, fontSize: 13 }}>{r.autor_nombre}</span>
                    <span style={{ marginLeft: 8 }}><Stars val={r.estrellas} /></span>
                  </div>
                </div>
                <p style={{ color: COLORS.muted, fontSize: 14, margin: 0 }}>{r.texto}</p>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8, display: "flex", gap: 4 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setEstrella(n)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: n <= estrella ? COLORS.accent : COLORS.border }}>★</button>
                ))}
              </div>
              <textarea value={reseña} onChange={e => setReseña(e.target.value)} placeholder="Dejá tu reseña..."
                style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px", color: COLORS.text, fontSize: 14, outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box" }} />
              <button onClick={enviarReseña} disabled={saving}
                style={{ marginTop: 8, background: COLORS.surface, color: COLORS.accent, border: `1px solid ${COLORS.accent}`, borderRadius: 10, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Guardando..." : "Publicar reseña"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewPostModal({ miNombre, onClose, onPublish }) {
  const [tipo, setTipo] = useState("busqueda");
  const [materia, setMateria] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const publicar = async () => {
    if (!titulo || !descripcion || !materia) { setError("Completá todos los campos"); return; }
    setSaving(true);
    setError("");
    try {
      const result = await db.insertPublicacion({ tipo, autor_nombre: miNombre, autor_avatar: miNombre[0].toUpperCase(), materia, titulo, descripcion, valoracion: 4.5 });
      onPublish(result[0]);
      onClose();
    } catch (e) {
      setError("Error al publicar. Revisá la conexión.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px", color: COLORS.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20, width: "min(500px, 95vw)", padding: "26px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ color: COLORS.text, fontFamily: "Georgia, serif", margin: 0 }}>Nueva publicación</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar letra={miNombre[0]} size={28} />
          <span style={{ color: COLORS.text, fontSize: 14 }}>{miNombre}</span>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {["busqueda", "oferta"].map(t => (
            <button key={t} onClick={() => setTipo(t)} style={{ flex: 1, padding: "10px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", background: tipo === t ? (t === "oferta" ? COLORS.success : COLORS.accent) : COLORS.card, color: tipo === t ? "#0D0D0D" : COLORS.muted, border: `1px solid ${tipo === t ? "transparent" : COLORS.border}` }}>
              {t === "busqueda" ? "🔍 Busco clases" : "📚 Ofrezco clases"}
            </button>
          ))}
        </div>
        <select value={materia} onChange={e => setMateria(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Seleccioná una materia</option>
          {MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título de la publicación" style={inputStyle} />
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción detallada..." style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} />
        {error && <div style={{ color: "#E05C5C", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button onClick={publicar} disabled={saving}
          style={{ width: "100%", background: COLORS.accent, color: "#0D0D0D", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 15, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Publicando..." : "Publicar"}
        </button>
      </div>
    </div>
  );
}

function LoginModal({ onLogin }) {
  const [nombre, setNombre] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: COLORS.bg, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "40px 36px", width: "min(380px, 90vw)", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎓</div>
        <h2 style={{ fontFamily: "Georgia, serif", color: COLORS.text, fontSize: 28, margin: "0 0 8px" }}>ClasseLink</h2>
        <p style={{ color: COLORS.muted, marginBottom: 28, fontSize: 15 }}>Conectá con profesores y estudiantes</p>
        <input value={nombre} onChange={e => setNombre(e.target.value)}
          onKeyDown={e => e.key === "Enter" && nombre.trim() && onLogin(nombre.trim())}
          placeholder="¿Cómo te llamás?"
          style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "13px 16px", color: COLORS.text, fontSize: 16, outline: "none", boxSizing: "border-box", marginBottom: 14, textAlign: "center" }} />
        <button onClick={() => nombre.trim() && onLogin(nombre.trim())}
          style={{ width: "100%", background: COLORS.accent, color: "#0D0D0D", border: "none", borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
          Entrar →
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [miNombre, setMiNombre] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroMateria, setFiltroMateria] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [chatPost, setChatPost] = useState(null);
  const [detailPost, setDetailPost] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const cargarPosts = async () => {
    setLoading(true);
    try {
      const filtros = {};
      if (filtroTipo !== "all") filtros.tipo = filtroTipo;
      if (filtroMateria) filtros.materia = filtroMateria;
      const data = await db.getPublicaciones(filtros);
      setPosts(data);
    } catch (e) {
      console.error("Error cargando posts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (miNombre) cargarPosts(); }, [miNombre, filtroTipo, filtroMateria]);

  const filtered = posts.filter(p => {
    if (!busqueda) return true;
    return p.titulo?.toLowerCase().includes(busqueda.toLowerCase()) || p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
  });

  if (!miNombre) return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      <LoginModal onLogin={setMiNombre} />
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "Inter, Helvetica Neue, sans-serif", color: COLORS.text }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>

      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "0 24px", position: "sticky", top: 0, background: COLORS.bg + "EE", backdropFilter: "blur(12px)", zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>🎓</span>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: COLORS.text }}>
              Classe<span style={{ color: COLORS.accent }}>Link</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar letra={miNombre[0]} size={30} />
              <span style={{ color: COLORS.muted, fontSize: 14 }}>{miNombre}</span>
            </div>
            <button onClick={() => setShowNew(true)}
              style={{ background: COLORS.accent, color: "#0D0D0D", border: "none", borderRadius: 10, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              + Publicar
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 700, margin: "0 0 12px", lineHeight: 1.2 }}>
            Conectá con el <span style={{ color: COLORS.accent }}>conocimiento</span>
          </h1>
          <p style={{ color: COLORS.muted, fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
            Publicá lo que querés aprender o lo que podés enseñar.
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="🔍  Buscá por tema o descripción..."
            style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "13px 18px", color: COLORS.text, fontSize: 15, outline: "none" }} />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {["all", "busqueda", "oferta"].map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              style={{ background: filtroTipo === t ? COLORS.accent : COLORS.surface, color: filtroTipo === t ? "#0D0D0D" : COLORS.muted, border: `1px solid ${filtroTipo === t ? COLORS.accent : COLORS.border}`, borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {t === "all" ? "Todo" : t === "busqueda" ? "🔍 Búsquedas" : "📚 Ofertas"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
          <MateriaTag m="Todas" selected={!filtroMateria} onClick={() => setFiltroMateria("")} />
          {MATERIAS.map(m => <MateriaTag key={m} m={m} selected={filtroMateria === m} onClick={v => setFiltroMateria(filtroMateria === v ? "" : v)} />)}
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          {[
            { label: "Publicaciones", val: posts.length },
            { label: "Búsquedas activas", val: posts.filter(p => p.tipo === "busqueda").length },
            { label: "Docentes disponibles", val: posts.filter(p => p.tipo === "oferta").length },
          ].map(s => (
            <div key={s.label} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "14px 20px", flex: 1, minWidth: 120 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: COLORS.accent }}>{s.val}</div>
              <div style={{ color: COLORS.muted, fontSize: 13 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: COLORS.muted, padding: "60px 0", fontSize: 15 }}>
            {posts.length === 0 ? "¡Sé el primero en publicar! 🚀" : "No hay publicaciones con esos filtros."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filtered.map(p => <PostCard key={p.id} post={p} onOpenChat={setChatPost} onOpenDetail={setDetailPost} />)}
          </div>
        )}
      </div>

      {chatPost && <ChatModal post={chatPost} miNombre={miNombre} onClose={() => setChatPost(null)} />}
      {detailPost && <DetailModal post={detailPost} miNombre={miNombre} onClose={() => setDetailPost(null)} onChat={p => { setDetailPost(null); setChatPost(p); }} />}
      {showNew && <NewPostModal miNombre={miNombre} onClose={() => setShowNew(false)} onPublish={p => { if (p) { setPosts(prev => [p, ...prev]); } }} />}
    </div>
  );
}
