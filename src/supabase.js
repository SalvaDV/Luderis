const SUPABASE_URL = "https://hptdyehzqfpgtrpuydny.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g";

const SESSION_KEY = "classelink_session";

// ── Persistencia de sesión ────────────────────────────────────────────────────
export const saveSession = (s) => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {} };
export const loadSession = () => { try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; } catch { return null; } };
export const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch {} };

let _onSessionRefresh = null;
export const setSessionRefreshCallback = (fn) => { _onSessionRefresh = fn; };

const authFetch = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error_description || data.message || "Error");
  return data;
};

export const signUp = (email, password) => authFetch("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email, password }) });
export const signIn = (email, password) => authFetch("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
export const resetPassword = (email) => authFetch("/auth/v1/recover", { method: "POST", body: JSON.stringify({ email }) });
export const refreshSession = (refresh_token) => authFetch("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token }) });

const db = async (path, method = "GET", body = null, token, prefer = "") => {
  const doReq = async (t) => {
    const headers = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${t || SUPABASE_KEY}`,
      "Content-Type": "application/json",
    };
    if (prefer) headers["Prefer"] = prefer;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      const err = text ? JSON.parse(text) : {};
      if (err.message?.includes("JWT") || err.code === "PGRST303")
        throw Object.assign(new Error("JWT expired"), { isExpired: true });
      throw new Error(text);
    }
    return text ? JSON.parse(text) : [];
  };
  try {
    return await doReq(token);
  } catch (e) {
    if (e.isExpired && _onSessionRefresh) {
      const s = await _onSessionRefresh();
      if (s?.access_token) return await doReq(s.access_token);
    }
    throw e;
  }
};

// ── Publicaciones ─────────────────────────────────────────────────────────────
export const getPublicaciones = (filtros = {}, token) => {
  let q = "publicaciones?select=*&order=created_at.desc";
  if (filtros.tipo) q += `&tipo=eq.${filtros.tipo}`;
  if (filtros.materia) q += `&materia=eq.${encodeURIComponent(filtros.materia)}`;
  return db(q, "GET", null, token);
};
export const insertPublicacion = (data, token) => db("publicaciones", "POST", data, token, "return=representation");
export const updatePublicacion = (id, data, token) => db(`publicaciones?id=eq.${id}`, "PATCH", data, token, "return=representation");
export const deletePublicacion = (id, token) => db(`publicaciones?id=eq.${id}`, "DELETE", null, token);

// ── Reseñas ───────────────────────────────────────────────────────────────────
export const getReseñas = (pubId, token) => db(`rese%C3%B1as?publicacion_id=eq.${pubId}&order=created_at.desc`, "GET", null, token);
export const insertReseña = (data, token) => db("rese%C3%B1as", "POST", data, token, "return=representation");

// ── Mensajes ──────────────────────────────────────────────────────────────────
export const getMensajes = (pubId, miEmail, otroEmail, token) => {
  const q = `mensajes?publicacion_id=eq.${pubId}&or=(and(de_nombre.eq.${encodeURIComponent(miEmail)},para_nombre.eq.${encodeURIComponent(otroEmail)}),and(de_nombre.eq.${encodeURIComponent(otroEmail)},para_nombre.eq.${encodeURIComponent(miEmail)}))&order=created_at.asc`;
  return db(q, "GET", null, token);
};
export const getMisChats = (miEmail, token) => db(`mensajes?or=(de_nombre.eq.${encodeURIComponent(miEmail)},para_nombre.eq.${encodeURIComponent(miEmail)})&order=created_at.desc`, "GET", null, token);
export const insertMensaje = (data, token) => db("mensajes", "POST", data, token, "return=representation");

// ── Verificación con IA ───────────────────────────────────────────────────────
export const verificarConIA = async (titulo, materia, respuesta) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: `Sos un evaluador de conocimiento para una plataforma educativa. Tu tarea es:
1. Generar UNA pregunta específica y concreta sobre el tema exacto del curso ("${titulo}" de la materia "${materia}").
2. Evaluar si la respuesta del docente es correcta o al menos razonable.
Respondé SOLO en JSON con este formato exacto (sin markdown):
{"pregunta":"...", "correcta":true/false, "feedback":"..."}`,
      messages: [{ role: "user", content: respuesta ? `Tema del curso: "${titulo}"\nRespuesta del docente: "${respuesta}"\nEvaluá si la respuesta es correcta.` : `Tema del curso: "${titulo}"\nGenerá la pregunta (no evalúes nada, la respuesta aún no existe, dejá correcta:false y feedback vacío)` }]
    })
  });
  const data = await res.json();
  const text = data.content?.map(c => c.text || "").join("") || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
};
