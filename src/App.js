import { useState, useEffect, useCallback } from "react";
import * as sb from "./supabase";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg: "#0D0D0D", surface: "#161616", card: "#1E1E1E", border: "#2A2A2A",
  accent: "#F5C842", accentDim: "#F5C84222", text: "#F0EDE6", muted: "#777",
  success: "#4ECB71", danger: "#E05C5C",
};
const MATERIAS = ["Matemáticas","Física","Química","Inglés","Programación","Historia","Biología","Literatura","Economía","Arte"];

// ─── UTILS ───────────────────────────────────────────────────────────────────
const avatarColor = (l) => ["#F5C842","#4ECB71","#E05C5C","#5CA8E0","#C85CE0"][(l||"?").toUpperCase().charCodeAt(0) % 5];
const fmt = (d) => d ? new Date(d).toLocaleDateString("es-AR", { day:"numeric", month:"short", year:"numeric" }) : "";
const fmtPrice = (p) => p ? `$${Number(p).toLocaleString("es-AR")}` : "A convenir";

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display:"flex", justifyContent:"center", padding:"40px 0" }}>
    <div style={{ width:28, height:28, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.accent}`, borderRadius:"50%", animation:"spin .8s linear infinite" }} />
  </div>
);

const Avatar = ({ letra, size=38 }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", background:avatarColor(letra), display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:size*.4, color:"#0D0D0D", flexShrink:0 }}>
    {(letra||"?")[0].toUpperCase()}
  </div>
);

const Stars = ({ val }) => {
  const v = parseFloat(val)||0;
  return <span style={{ color:C.accent, fontSize:13 }}>{"★".repeat(Math.round(v))}{"☆".repeat(5-Math.round(v))}<span style={{ color:C.muted, marginLeft:4, fontSize:12 }}>{v.toFixed(1)}</span></span>;
};

const Tag = ({ tipo }) => (
  <span style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", padding:"3px 10px", borderRadius:20, background:tipo==="oferta"?"#4ECB7122":"#F5C84222", color:tipo==="oferta"?C.success:C.accent, border:`1px solid ${tipo==="oferta"?"#4ECB7144":"#F5C84244"}` }}>
    {tipo==="oferta" ? "📚 Oferta" : "🔍 Búsqueda"}
  </span>
);

const Input = ({ style={}, ...props }) => (
  <input style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", ...style }} {...props} />
);

const Btn = ({ children, variant="primary", style={}, ...props }) => (
  <button style={{
    background: variant==="primary" ? C.accent : variant==="danger" ? C.danger : C.surface,
    color: variant==="primary" ? "#0D0D0D" : C.text,
    border: variant==="outline" ? `1px solid ${C.border}` : "none",
    borderRadius:10, padding:"10px 20px", fontWeight:700, fontSize:14, cursor:"pointer", ...style
  }} {...props}>{children}</button>
);

const ErrMsg = ({ msg }) => msg ? <div style={{ color:C.danger, fontSize:13, margin:"6px 0" }}>{msg}</div> : null;

// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const handle = async () => {
    setErr(""); setOk("");
    if (!email) { setErr("Ingresá tu email"); return; }
    if (mode !== "forgot" && !pass) { setErr("Ingresá tu contraseña"); return; }
    if (mode === "register" && pass !== pass2) { setErr("Las contraseñas no coinciden"); return; }
    setLoading(true);
    try {
      if (mode === "forgot") {
        await sb.resetPassword(email);
        setOk("Te enviamos un email para restablecer tu contraseña.");
      } else if (mode === "register") {
        const res = await sb.signUp(email, pass);
        if (res.access_token) onLogin(res);
        else setOk("Revisá tu email para confirmar la cuenta, luego iniciá sesión.");
      } else {
        const res = await sb.signIn(email, pass);
        onLogin(res);
      }
    } catch (e) {
      setErr(e.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"40px 36px", width:"min(400px,90vw)", textAlign:"center" }}>
        <div style={{ fontSize:52, marginBottom:12 }}>🎓</div>
        <h2 style={{ fontFamily:"Georgia,serif", color:C.text, fontSize:28, margin:"0 0 4px" }}>ClasseLink</h2>
        <p style={{ color:C.muted, marginBottom:28, fontSize:14 }}>Conectá con profesores y estudiantes</p>

        <div style={{ display:"flex", gap:8, marginBottom:24, background:C.card, borderRadius:12, padding:4 }}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setErr(""); setOk(""); }} style={{ flex:1, padding:"8px", borderRadius:9, border:"none", fontWeight:600, fontSize:13, cursor:"pointer", background:mode===m ? C.accent : "transparent", color:mode===m ? "#0D0D0D" : C.muted }}>
              {m === "login" ? "Iniciar sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        {mode === "forgot" ? (
          <>
            <p style={{ color:C.muted, fontSize:13, marginBottom:16 }}>Ingresá tu email y te mandamos un link para restablecer tu contraseña.</p>
            <Input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom:12 }} />
            <ErrMsg msg={err} />
            {ok && <div style={{ color:C.success, fontSize:13, marginBottom:10 }}>{ok}</div>}
            <Btn onClick={handle} disabled={loading} style={{ width:"100%", marginBottom:12 }}>{loading ? "Enviando..." : "Enviar link"}</Btn>
            <button onClick={() => { setMode("login"); setErr(""); setOk(""); }} style={{ background:"none", border:"none", color:C.muted, fontSize:13, cursor:"pointer" }}>← Volver al login</button>
          </>
        ) : (
          <>
            <Input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom:10 }} onKeyDown={e => e.key==="Enter" && handle()} />
            <Input type="password" placeholder="Contraseña" value={pass} onChange={e => setPass(e.target.value)} style={{ marginBottom:10 }} onKeyDown={e => e.key==="Enter" && handle()} />
            {mode === "register" && <Input type="password" placeholder="Repetir contraseña" value={pass2} onChange={e => setPass2(e.target.value)} style={{ marginBottom:10 }} />}
            <ErrMsg msg={err} />
            {ok && <div style={{ color:C.success, fontSize:13, marginBottom:10 }}>{ok}</div>}
            <Btn onClick={handle} disabled={loading} style={{ width:"100%", padding:"13px", fontSize:15, marginBottom:14 }}>
              {loading ? "..." : mode === "login" ? "Entrar →" : "Crear cuenta →"}
            </Btn>
            {mode === "login" && (
              <button onClick={() => { setMode("forgot"); setErr(""); setOk(""); }} style={{ background:"none", border:"none", color:C.muted, fontSize:13, cursor:"pointer" }}>¿Olvidaste tu contraseña?</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── POST CARD ────────────────────────────────────────────────────────────────
function PostCard({ post, onOpenChat, onOpenDetail }) {
  const nombre = post.autor_nombre || post.autor_email?.split("@")[0] || "Usuario";
  return (
    <div onClick={() => onOpenDetail(post)}
      style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px", cursor:"pointer", transition:"border-color .2s, transform .15s", position:"relative", overflow:"hidden" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ position:"absolute", top:0, left:0, width:"100%", height:3, background:post.tipo==="oferta"?C.success:C.accent }} />

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <Avatar letra={nombre[0]} />
          <div>
            <div style={{ fontWeight:600, color:C.text, fontSize:14 }}>{nombre}</div>
            <Stars val={post.valoracion||4.5} />
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
          <Tag tipo={post.tipo} />
        </div>
      </div>

      <div style={{ marginBottom:8 }}>
        <span style={{ background:C.accentDim, color:C.accent, fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:8 }}>{post.materia}</span>
      </div>

      <h3 style={{ color:C.text, fontFamily:"Georgia,serif", fontSize:17, fontWeight:700, margin:"8px 0", lineHeight:1.3 }}>{post.titulo}</h3>
      <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, margin:"0 0 12px" }}>{post.descripcion}</p>

      {post.tipo === "oferta" && (
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:12 }}>
          {post.precio && (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", fontSize:13 }}>
              💰 <span style={{ color:C.accent, fontWeight:700 }}>{fmtPrice(post.precio)}</span>
              {post.precio_tipo && <span style={{ color:C.muted }}> / {post.precio_tipo}</span>}
            </div>
          )}
          {(post.fecha_inicio || post.fecha_fin) && (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", fontSize:13, color:C.muted }}>
              📅 {fmt(post.fecha_inicio)}{post.fecha_fin ? ` → ${fmt(post.fecha_fin)}` : ""}
            </div>
          )}
        </div>
      )}

      <button onClick={e => { e.stopPropagation(); onOpenChat(post); }}
        style={{ background:C.accent, color:"#0D0D0D", border:"none", borderRadius:10, padding:"8px 18px", fontWeight:700, fontSize:13, cursor:"pointer" }}>
        💬 Contactar
      </button>
    </div>
  );
}

// ─── CHAT MODAL ───────────────────────────────────────────────────────────────
function ChatModal({ post, session, onClose }) {
  const miEmail = session.user.email;
  const miNombre = miEmail.split("@")[0];
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(() => {
    sb.getMensajes(post.id, session.access_token).then(data => {
      const rel = data.filter(m =>
        (m.de_nombre === miEmail && m.para_nombre === post.autor_email) ||
        (m.de_nombre === post.autor_email && m.para_nombre === miEmail)
      );
      setMsgs(rel);
      setLoading(false);
    });
  }, [post.id, miEmail, post.autor_email, session.access_token]);

  useEffect(() => { cargar(); const t = setInterval(cargar, 3000); return () => clearInterval(t); }, [cargar]);

  const send = async () => {
    if (!input.trim()) return;
    const txt = input; setInput("");
    await sb.insertMensaje({ publicacion_id:post.id, de_nombre:miEmail, para_nombre:post.autor_email, texto:txt }, session.access_token);
    cargar();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#000a", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, width:"min(460px,95vw)", maxHeight:"80vh", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"18px 22px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <Avatar letra={(post.autor_nombre||post.autor_email||"?")[0]} size={36} />
            <div>
              <div style={{ fontWeight:700, color:C.text }}>{post.autor_nombre || post.autor_email}</div>
              <div style={{ fontSize:12, color:C.muted }}>{post.titulo}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:22, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px 22px", display:"flex", flexDirection:"column", gap:10, minHeight:200 }}>
          {loading ? <Spinner /> : msgs.length === 0
            ? <div style={{ color:C.muted, textAlign:"center", padding:30, fontSize:14 }}>Empezá la conversación 👋</div>
            : msgs.map((m,i) => (
              <div key={i} style={{ display:"flex", justifyContent:m.de_nombre===miEmail?"flex-end":"flex-start" }}>
                <div style={{ background:m.de_nombre===miEmail?C.accent:C.card, color:m.de_nombre===miEmail?"#0D0D0D":C.text, padding:"10px 14px", borderRadius:14, maxWidth:"75%", fontSize:14, lineHeight:1.5 }}>
                  {m.texto}
                </div>
              </div>
            ))
          }
        </div>
        <div style={{ padding:"14px 18px", borderTop:`1px solid ${C.border}`, display:"flex", gap:10 }}>
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()} placeholder="Escribí un mensaje..." />
          <button onClick={send} style={{ background:C.accent, border:"none", borderRadius:10, padding:"10px 16px", fontWeight:700, cursor:"pointer", color:"#0D0D0D", fontSize:18 }}>↑</button>
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function DetailModal({ post, session, onClose, onChat }) {
  const [reseñas, setReseñas] = useState([]);
  const [reseña, setReseña] = useState("");
  const [estrella, setEstrella] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const nombre = post.autor_nombre || post.autor_email?.split("@")[0] || "Usuario";

  useEffect(() => { sb.getReseñas(post.id, session.access_token).then(setReseñas).finally(() => setLoading(false)); }, [post.id]);

  const enviar = async () => {
    if (!reseña.trim()) return;
    setSaving(true);
    const miNombre = session.user.email.split("@")[0];
    await sb.insertReseña({ publicacion_id:post.id, autor_nombre:miNombre, autor_avatar:miNombre[0], texto:reseña, estrellas:estrella }, session.access_token);
    setReseñas(await sb.getReseñas(post.id, session.access_token));
    setReseña(""); setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#000b", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, width:"min(600px,95vw)", maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ padding:"22px 26px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
            <div style={{ display:"flex", gap:14, alignItems:"center" }}>
              <Avatar letra={nombre[0]} size={50} />
              <div>
                <div style={{ fontWeight:700, color:C.text, fontSize:16 }}>{nombre}</div>
                <Stars val={post.valoracion||4.5} />
                <div style={{ marginTop:4 }}><Tag tipo={post.tipo} /></div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:24, cursor:"pointer" }}>×</button>
          </div>

          <span style={{ background:C.accentDim, color:C.accent, fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:8 }}>{post.materia}</span>
          <h2 style={{ color:C.text, fontFamily:"Georgia,serif", fontSize:22, margin:"10px 0 10px" }}>{post.titulo}</h2>
          <p style={{ color:C.muted, fontSize:15, lineHeight:1.7, marginBottom:16 }}>{post.descripcion}</p>

          {post.tipo === "oferta" && (post.precio || post.fecha_inicio) && (
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:20 }}>
              {post.precio && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 16px" }}>
                  <div style={{ color:C.muted, fontSize:11, marginBottom:2 }}>PRECIO</div>
                  <div style={{ color:C.accent, fontWeight:700, fontSize:18 }}>{fmtPrice(post.precio)}</div>
                  {post.precio_tipo && <div style={{ color:C.muted, fontSize:12 }}>por {post.precio_tipo}</div>}
                </div>
              )}
              {post.fecha_inicio && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 16px" }}>
                  <div style={{ color:C.muted, fontSize:11, marginBottom:2 }}>INICIO</div>
                  <div style={{ color:C.text, fontWeight:600 }}>{fmt(post.fecha_inicio)}</div>
                </div>
              )}
              {post.fecha_fin && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 16px" }}>
                  <div style={{ color:C.muted, fontSize:11, marginBottom:2 }}>FIN</div>
                  <div style={{ color:C.text, fontWeight:600 }}>{fmt(post.fecha_fin)}</div>
                </div>
              )}
            </div>
          )}

          <button onClick={() => { onClose(); onChat(post); }}
            style={{ background:C.accent, color:"#0D0D0D", border:"none", borderRadius:12, padding:"11px 24px", fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:28 }}>
            💬 Iniciar conversación
          </button>

          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:20 }}>
            <h4 style={{ color:C.text, marginBottom:14 }}>Reseñas ({reseñas.length})</h4>
            {loading ? <Spinner /> : reseñas.map(r => (
              <div key={r.id} style={{ background:C.card, borderRadius:12, padding:"14px 16px", marginBottom:12 }}>
                <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:8 }}>
                  <Avatar letra={r.autor_avatar||r.autor_nombre?.[0]} size={30} />
                  <span style={{ fontWeight:600, color:C.text, fontSize:13 }}>{r.autor_nombre}</span>
                  <span style={{ marginLeft:4 }}><Stars val={r.estrellas} /></span>
                </div>
                <p style={{ color:C.muted, fontSize:14, margin:0 }}>{r.texto}</p>
              </div>
            ))}
            <div style={{ marginTop:16 }}>
              <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                {[1,2,3,4,5].map(n => <button key={n} onClick={() => setEstrella(n)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:n<=estrella?C.accent:C.border }}>★</button>)}
              </div>
              <textarea value={reseña} onChange={e => setReseña(e.target.value)} placeholder="Dejá tu reseña..."
                style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", color:C.text, fontSize:14, outline:"none", resize:"vertical", minHeight:80, boxSizing:"border-box" }} />
              <Btn onClick={enviar} disabled={saving} variant="outline" style={{ marginTop:8, color:C.accent, borderColor:C.accent }}>
                {saving ? "Guardando..." : "Publicar reseña"}
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NEW POST MODAL ───────────────────────────────────────────────────────────
function NewPostModal({ session, onClose, onPublish }) {
  const [tipo, setTipo] = useState("busqueda");
  const [materia, setMateria] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [precioTipo, setPrecioTipo] = useState("hora");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const publicar = async () => {
    if (!titulo || !descripcion || !materia) { setErr("Completá título, materia y descripción"); return; }
    setSaving(true); setErr("");
    try {
      const nombre = session.user.email.split("@")[0];
      const data = {
        tipo, materia, titulo, descripcion,
        autor_email: session.user.email,
        autor_nombre: nombre,
        autor_avatar: nombre[0].toUpperCase(),
        valoracion: 4.5,
      };
      if (tipo === "oferta") {
        if (precio) { data.precio = parseFloat(precio); data.precio_tipo = precioTipo; }
        if (fechaInicio) data.fecha_inicio = fechaInicio;
        if (fechaFin) data.fecha_fin = fechaFin;
      }
      const result = await sb.insertPublicacion(data, session.access_token);
      onPublish(result[0]);
      onClose();
    } catch (e) {
      setErr("Error al publicar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const iStyle = { width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:12 };

  return (
    <div style={{ position:"fixed", inset:0, background:"#000b", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, width:"min(520px,95vw)", maxHeight:"90vh", overflowY:"auto", padding:"26px 28px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
          <h3 style={{ color:C.text, fontFamily:"Georgia,serif", margin:0 }}>Nueva publicación</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:22, cursor:"pointer" }}>×</button>
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
          <Avatar letra={session.user.email[0]} size={28} />
          <span style={{ color:C.text, fontSize:14 }}>{session.user.email.split("@")[0]}</span>
        </div>

        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          {["busqueda","oferta"].map(t => (
            <button key={t} onClick={() => setTipo(t)} style={{ flex:1, padding:"10px", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer", background:tipo===t?(t==="oferta"?C.success:C.accent):C.card, color:tipo===t?"#0D0D0D":C.muted, border:`1px solid ${tipo===t?"transparent":C.border}` }}>
              {t==="busqueda" ? "🔍 Busco clases" : "📚 Ofrezco clases"}
            </button>
          ))}
        </div>

        <select value={materia} onChange={e => setMateria(e.target.value)} style={{ ...iStyle, cursor:"pointer" }}>
          <option value="">Seleccioná una materia</option>
          {MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título de la publicación" style={iStyle} />

        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción detallada..."
          style={{ ...iStyle, minHeight:90, resize:"vertical" }} />

        {tipo === "oferta" && (
          <>
            <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14, marginBottom:12 }}>
              <div style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:10 }}>PRECIO Y FECHAS (opcional)</div>

              <div style={{ display:"flex", gap:10, marginBottom:12 }}>
                <input value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Precio (ej: 5000)" type="number" min="0"
                  style={{ ...iStyle, margin:0, flex:2 }} />
                <select value={precioTipo} onChange={e => setPrecioTipo(e.target.value)}
                  style={{ ...iStyle, margin:0, flex:1, cursor:"pointer" }}>
                  <option value="hora">por hora</option>
                  <option value="clase">por clase</option>
                  <option value="mes">por mes</option>
                  <option value="curso">por curso</option>
                </select>
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ color:C.muted, fontSize:12, marginBottom:4 }}>Fecha de inicio</div>
                  <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                    style={{ ...iStyle, margin:0, colorScheme:"dark" }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:C.muted, fontSize:12, marginBottom:4 }}>Fecha de fin</div>
                  <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                    style={{ ...iStyle, margin:0, colorScheme:"dark" }} />
                </div>
              </div>
            </div>
          </>
        )}

        <ErrMsg msg={err} />
        <Btn onClick={publicar} disabled={saving} style={{ width:"100%", padding:"12px", fontSize:15, marginTop:4 }}>
          {saving ? "Publicando..." : "Publicar"}
        </Btn>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroMateria, setFiltroMateria] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [chatPost, setChatPost] = useState(null);
  const [detailPost, setDetailPost] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const cargar = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const filtros = {};
      if (filtroTipo !== "all") filtros.tipo = filtroTipo;
      if (filtroMateria) filtros.materia = filtroMateria;
      setPosts(await sb.getPublicaciones(filtros, session.access_token));
    } finally {
      setLoading(false);
    }
  }, [session, filtroTipo, filtroMateria]);

  useEffect(() => { cargar(); }, [cargar]);

  const filtered = posts.filter(p => !busqueda ||
    p.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (!session) return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <AuthScreen onLogin={setSession} />
    </>
  );

  const nombre = session.user.email.split("@")[0];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"Inter,Helvetica Neue,sans-serif", color:C.text }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>

      {/* HEADER */}
      <div style={{ borderBottom:`1px solid ${C.border}`, padding:"0 24px", position:"sticky", top:0, background:C.bg+"EE", backdropFilter:"blur(12px)", zIndex:50 }}>
        <div style={{ maxWidth:900, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:24 }}>🎓</span>
            <span style={{ fontFamily:"Georgia,serif", fontSize:21, fontWeight:700 }}>
              Classe<span style={{ color:C.accent }}>Link</span>
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Avatar letra={nombre[0]} size={30} />
              <span style={{ color:C.muted, fontSize:13 }}>{nombre}</span>
            </div>
            <Btn onClick={() => setShowNew(true)} style={{ padding:"8px 18px" }}>+ Publicar</Btn>
            <button onClick={() => setSession(null)} title="Cerrar sesión"
              style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, padding:"7px 10px", cursor:"pointer", fontSize:13 }}>
              ↩
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 24px" }}>
        {/* HERO */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(26px,5vw,44px)", fontWeight:700, margin:"0 0 10px", lineHeight:1.2 }}>
            Conectá con el <span style={{ color:C.accent }}>conocimiento</span>
          </h1>
          <p style={{ color:C.muted, fontSize:15, maxWidth:480, margin:"0 auto" }}>
            Publicá lo que querés aprender o lo que podés enseñar.
          </p>
        </div>

        {/* SEARCH */}
        <Input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍  Buscá por tema o descripción..."
          style={{ marginBottom:16, background:C.surface, padding:"13px 18px", fontSize:15 }} />

        {/* TIPO FILTER */}
        <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
          {["all","busqueda","oferta"].map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              style={{ background:filtroTipo===t?C.accent:C.surface, color:filtroTipo===t?"#0D0D0D":C.muted, border:`1px solid ${filtroTipo===t?C.accent:C.border}`, borderRadius:20, padding:"6px 16px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              {t==="all"?"Todo":t==="busqueda"?"🔍 Búsquedas":"📚 Ofertas"}
            </button>
          ))}
        </div>

        {/* MATERIA FILTER */}
        <div style={{ display:"flex", gap:8, marginBottom:28, overflowX:"auto", paddingBottom:4 }}>
          {["Todas",...MATERIAS].map(m => (
            <button key={m} onClick={() => setFiltroMateria(m==="Todas"?"":m)}
              style={{ background:(m==="Todas"&&!filtroMateria)||filtroMateria===m?C.accent:C.card, color:(m==="Todas"&&!filtroMateria)||filtroMateria===m?"#0D0D0D":C.muted, border:"none", borderRadius:20, padding:"6px 14px", fontSize:13, fontWeight:(m==="Todas"&&!filtroMateria)||filtroMateria===m?700:400, cursor:"pointer", whiteSpace:"nowrap" }}>
              {m}
            </button>
          ))}
        </div>

        {/* STATS */}
        <div style={{ display:"flex", gap:14, marginBottom:28, flexWrap:"wrap" }}>
          {[
            { label:"Publicaciones", val:posts.length },
            { label:"Búsquedas activas", val:posts.filter(p=>p.tipo==="busqueda").length },
            { label:"Docentes disponibles", val:posts.filter(p=>p.tipo==="oferta").length },
          ].map(s => (
            <div key={s.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 20px", flex:1, minWidth:110 }}>
              <div style={{ fontFamily:"Georgia,serif", fontSize:26, fontWeight:700, color:C.accent }}>{s.val}</div>
              <div style={{ color:C.muted, fontSize:13 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* POSTS */}
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div style={{ textAlign:"center", color:C.muted, padding:"60px 0", fontSize:15 }}>
            {posts.length === 0 ? "¡Sé el primero en publicar! 🚀" : "No hay publicaciones con esos filtros."}
          </div>
        ) : (
          <div style={{ display:"grid", gap:16 }}>
            {filtered.map(p => <PostCard key={p.id} post={p} onOpenChat={setChatPost} onOpenDetail={setDetailPost} />)}
          </div>
        )}
      </div>

      {chatPost && <ChatModal post={chatPost} session={session} onClose={() => setChatPost(null)} />}
      {detailPost && <DetailModal post={detailPost} session={session} onClose={() => setDetailPost(null)} onChat={p => { setDetailPost(null); setChatPost(p); }} />}
      {showNew && <NewPostModal session={session} onClose={() => setShowNew(false)} onPublish={p => { if(p) { setPosts(prev => [p,...prev]); } }} />}
    </div>
  );
}
