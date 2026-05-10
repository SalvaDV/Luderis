import React, { useState, useEffect, useRef } from "react";
import * as sb from "../supabase";

const FONT = "'Inter','Segoe UI',sans-serif";

// Regex pre-filtro: detecta emails, teléfonos, links y menciones a apps externas
const CONTACT_REGEX = /(\b[\w.+-]+@[\w-]+\.\w{2,}\b)|(\b(?:\+?54\s?)?(?:11|2[0-9]{2}|3[0-9]{2}|4[0-9]{2}|9\s?\d{1,4})[\s-]?\d{3,4}[\s-]?\d{4}\b)|(https?:\/\/[^\s]+)|(wa\.me|t\.me|telegram|whatsapp|instagram|wpp|ws\s|wasap|ig\s|@\w{3,}(?:\s|$)|contactame\s+por|escribime\s+(?:al|por|a\s+mi)|mi\s+(?:mail|correo|cel|celu|numero|numero|whatsapp|insta|telegram)|por\s+(?:whatsapp|telegram|instagram|insta|mail|wpp|afuera\s+de\s+luderis|otro\s+lado)|fuera\s+de\s+(?:la\s+)?(?:plataforma|luderis|app))/i;

export default function PreguntasSection({ publicacionId, session, docenteId, docenteEmail, pubTitulo, C }) {
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [respTextos, setRespTextos] = useState({});
  const [respondiendo, setRespondiendo] = useState(null);
  const [bloqueadoModal, setBloqueadoModal] = useState(null);
  const textareaRef = useRef(null);

  const esDocente = session?.user?.id === docenteId;
  const token = session?.access_token;

  useEffect(() => {
    cargarPreguntas();
  }, [publicacionId]);

  const cargarPreguntas = async () => {
    setLoading(true);
    try {
      const data = await sb.getPreguntasPublicacion(publicacionId);
      setPreguntas(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const moderarTexto = async (texto, tipo) => {
    if (CONTACT_REGEX.test(texto)) {
      return { bloqueado: true, razon: "Contiene información de contacto externo detectada automáticamente." };
    }
    try {
      const system = `Sos un moderador de una plataforma educativa. Tu tarea es detectar si el siguiente mensaje intenta compartir información de contacto externo (email, teléfono, redes sociales, apps de mensajería como WhatsApp o Telegram) o invita a continuar la comunicación fuera de la plataforma, de manera directa o indirecta. Respondé SOLO con JSON válido: {"bloqueado":true/false,"razon":"..."} donde razon está vacío si bloqueado es false.`;
      const respIA = await sb.callIA(system, `Tipo: ${tipo}. Mensaje: "${texto}"`, 150, token);
      const parsed = JSON.parse(respIA.trim().replace(/^```json\s*/i, "").replace(/```$/i, ""));
      if (parsed.bloqueado) return { bloqueado: true, razon: parsed.razon || "Posible contacto externo detectado por IA." };
    } catch {}
    return { bloqueado: false };
  };

  const handleEnviarPregunta = async () => {
    const textoTrim = texto.trim();
    if (!textoTrim || !token) return;
    setSending(true);
    const mod = await moderarTexto(textoTrim, "pregunta");
    if (mod.bloqueado) {
      await registrarAlerta(textoTrim, "pregunta", mod.razon);
      setBloqueadoModal(mod.razon);
      setSending(false);
      return;
    }
    try {
      const nombreUsuario = session?.user?.user_metadata?.nombre || session?.user?.email?.split("@")[0] || "Anónimo";
      await sb.insertPregunta({
        publicacion_id: publicacionId,
        autor_email: session.user.email,
        autor_nombre: nombreUsuario,
        pregunta: textoTrim,
      }, token);
      // Resolver email del docente si no vino como prop
      let emailDocente = docenteEmail;
      if (!emailDocente && docenteId) {
        const rows = await sb.db(`/usuarios?id=eq.${docenteId}&select=email`, "GET", null, token).catch(() => []);
        emailDocente = rows?.[0]?.email;
      }
      // Notificar al docente
      if (emailDocente && emailDocente !== session.user.email) {
        await sb.insertNotificacion({
          usuario_id: null,
          alumno_email: emailDocente,
          tipo: "nueva_pregunta",
          publicacion_id: publicacionId,
          pub_titulo: `${nombreUsuario} preguntó en "${pubTitulo || "tu publicación"}"`,
          leida: false,
        }, token);
      }
      setTexto("");
      await cargarPreguntas();
    } catch (e) { console.error("[PreguntasSection] error enviando pregunta:", e); }
    setSending(false);
  };

  const handleResponder = async (preguntaId) => {
    const respTrim = (respTextos[preguntaId] || "").trim();
    if (!respTrim || !token) return;
    setRespondiendo(preguntaId);
    const mod = await moderarTexto(respTrim, "respuesta");
    if (mod.bloqueado) {
      await registrarAlerta(respTrim, "respuesta", mod.razon);
      setBloqueadoModal(mod.razon);
      setRespondiendo(null);
      return;
    }
    try {
      await sb.responderPregunta(preguntaId, respTrim, token);
      // Notificar al alumno que hizo la pregunta
      const pregunta = preguntas.find(p => p.id === preguntaId);
      if (pregunta?.autor_email && pregunta.autor_email !== session.user.email) {
        await sb.insertNotificacion({
          usuario_id: null,
          alumno_email: pregunta.autor_email,
          tipo: "pregunta_respondida",
          publicacion_id: publicacionId,
          pub_titulo: `Te respondieron en "${pubTitulo || "una publicación"}"`,
          leida: false,
        }, token);
      }
      setRespTextos(v => ({ ...v, [preguntaId]: "" }));
      await cargarPreguntas();
    } catch (e) { console.error("[PreguntasSection] error respondiendo:", e); }
    setRespondiendo(null);
  };

  const registrarAlerta = async (textoBloqueado, tipo, razon) => {
    try {
      await sb.insertAlertaContacto({
        publicacion_id: publicacionId,
        autor_email: session?.user?.email || "desconocido",
        tipo,
        texto_bloqueado: textoBloqueado,
        razon,
      }, token);
      // Notificar a cada admin del sistema
      const admins = await sb.db("/usuarios?rol=eq.admin&select=email", "GET", null, token).catch(() => []);
      for (const admin of (admins || [])) {
        await sb.insertNotificacion({
          usuario_id: null,
          alumno_email: admin.email,
          tipo: "alerta_contacto",
          pub_titulo: `🔇 Contacto externo bloqueado — ${session?.user?.email}. Razón: ${razon}`,
          leida: false,
        }, token).catch(() => {});
      }
    } catch {}
  };

  const formatFecha = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>❓</span> Preguntas frecuentes
        <span style={{ fontSize: 13, fontWeight: 400, color: C.muted, marginLeft: 4 }}>({preguntas.length})</span>
      </h3>

      {/* Formulario nueva pregunta */}
      {session && !esDocente && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Hacé tu pregunta sobre esta publicación…"
            rows={3}
            style={{ width: "100%", boxSizing: "border-box", resize: "vertical", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontFamily: FONT, fontSize: 13, color: C.text, outline: "none" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              onClick={handleEnviarPregunta}
              disabled={sending || !texto.trim()}
              style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: sending || !texto.trim() ? "not-allowed" : "pointer", opacity: sending || !texto.trim() ? 0.6 : 1, transition: "opacity .15s" }}>
              {sending ? "Verificando…" : "Enviar pregunta"}
            </button>
          </div>
        </div>
      )}

      {!session && (
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.muted, marginBottom: 20 }}>
          Iniciá sesión para hacer una pregunta.
        </p>
      )}

      {/* Lista de preguntas */}
      {loading ? (
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.muted }}>Cargando preguntas…</p>
      ) : preguntas.length === 0 ? (
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.muted }}>
          Todavía no hay preguntas. ¡Sé el primero en preguntar!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {preguntas.map(p => (
            <div key={p.id} style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              {/* Pregunta */}
              <div style={{ padding: "14px 16px", background: C.surface }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accentDim || "#e8eaf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.accent, flexShrink: 0 }}>
                    {(p.autor_nombre || p.autor_email || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.text }}>{p.autor_nombre || p.autor_email?.split("@")[0]}</span>
                      <span style={{ fontFamily: FONT, fontSize: 11, color: C.muted }}>{formatFecha(p.created_at)}</span>
                    </div>
                    <p style={{ fontFamily: FONT, fontSize: 13, color: C.text, margin: 0, lineHeight: 1.5 }}>{p.pregunta}</p>
                  </div>
                </div>
              </div>

              {/* Respuesta existente */}
              {p.respuesta && (
                <div style={{ padding: "12px 16px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#d4edda", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>✓</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: "#2e7d32", marginBottom: 4 }}>Respuesta del docente</div>
                      <p style={{ fontFamily: FONT, fontSize: 13, color: C.text, margin: 0, lineHeight: 1.5 }}>{p.respuesta}</p>
                      <span style={{ fontFamily: FONT, fontSize: 11, color: C.muted }}>{formatFecha(p.respondido_at)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulario respuesta (solo docente, solo si no hay respuesta) */}
              {esDocente && !p.respuesta && (
                <div style={{ padding: "12px 16px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
                  <textarea
                    value={respTextos[p.id] || ""}
                    onChange={e => setRespTextos(v => ({ ...v, [p.id]: e.target.value }))}
                    placeholder="Escribí tu respuesta pública…"
                    rows={2}
                    style={{ width: "100%", boxSizing: "border-box", resize: "vertical", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontFamily: FONT, fontSize: 13, color: C.text, outline: "none" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <button
                      onClick={() => handleResponder(p.id)}
                      disabled={respondiendo === p.id || !(respTextos[p.id] || "").trim()}
                      style={{ background: "#2e7d32", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: respondiendo === p.id || !(respTextos[p.id] || "").trim() ? 0.6 : 1 }}>
                      {respondiendo === p.id ? "Verificando…" : "Responder"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal bloqueo por contacto externo */}
      {bloqueadoModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setBloqueadoModal(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.25)", textAlign: "center" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
            <h3 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: "#c62828", marginBottom: 8 }}>Mensaje no permitido</h3>
            <p style={{ fontFamily: FONT, fontSize: 14, color: "#444", lineHeight: 1.6, marginBottom: 8 }}>
              Tu mensaje fue bloqueado porque parece contener información de contacto externo o invitaciones a comunicarse fuera de Luderis.
            </p>
            <p style={{ fontFamily: FONT, fontSize: 12, color: "#888", marginBottom: 20 }}>
              Toda la comunicación debe ocurrir dentro de la plataforma. Un administrador fue notificado.
            </p>
            <button
              onClick={() => setBloqueadoModal(null)}
              style={{ background: "#c62828", color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", fontFamily: FONT, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
