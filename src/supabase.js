const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://hptdyehzqfpgtrpuydny.supabase.co";
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g";

const SESSION_KEY = "classelink_session";

// ── Session ───────────────────────────────────────────────────────────────────

export const saveSession = (s) => {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
};

export const loadSession = () => {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

export const clearSession = () => {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
};

// ── Display name (localStorage) ───────────────────────────────────────────────

export const getDisplayName = (email) => {
  if (!email) return "Usuario";
  try {
    return localStorage.getItem("dn_" + email) || email.split("@")[0];
  } catch {
    return email.split("@")[0];
  }
};

export const setDisplayName = (email, name) => {
  if (!email) return;
  try {
    localStorage.setItem("dn_" + email, name || email.split("@")[0]);
  } catch {}
};

// ── Usuarios ──────────────────────────────────────────────────────────────────

// Se llama al registrarse para crear el registro en la tabla pública usuarios
export const insertUsuario = (data, token) =>
  db("usuarios", "POST", data, token, "return=representation");

// Actualiza campos del perfil (nombre, bio, etc.) en la tabla usuarios
export const updateUsuario = (id, data, token) =>
  db(`usuarios?id=eq.${id}`, "PATCH", data, token, "return=representation");

// Se llama al hacer login para asegurarse que existe (por si se creó antes del fix)
export const upsertUsuario = (data, token) =>
  db("usuarios", "POST", data, token, "return=representation,resolution=merge-duplicates");

let _onSessionRefresh = null;
export const setSessionRefreshCallback = (fn) => { _onSessionRefresh = fn; };

// ── Auth ──────────────────────────────────────────────────────────────────────

const authFetch = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    ...opts,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error_description || data.message || "Error");
  return data;
};

export const signUp = (e, p) =>
  authFetch("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email: e, password: p }) });

export const signIn = (e, p) =>
  authFetch("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: e, password: p }) });

export const resetPassword = (e) =>
  authFetch("/auth/v1/recover", { method: "POST", body: JSON.stringify({ email: e }) });

// ── Google OAuth ──────────────────────────────────────────────────────────────

export const signInWithGoogle = () => {
  const redirectTo = `${window.location.origin}`;
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
};

// Extraer sesión del hash de la URL (callback de OAuth)
export const getSessionFromUrl = async () => {
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.replace("#", ""));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${access_token}` }
  });
  if (!res.ok) return null;
  const user = await res.json();
  return { access_token, refresh_token, user };
};

export const refreshSession = (rt) =>
  authFetch("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: rt }) });

// ── DB helper ─────────────────────────────────────────────────────────────────

export const db = async (path, method = "GET", body = null, token, prefer = "") => {
  const doReq = async (t) => {
    const h = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${t || SUPABASE_KEY}`,
      "Content-Type": "application/json",
    };
    if (prefer) h["Prefer"] = prefer;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: h,
      body: body ? JSON.stringify(body) : undefined,
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

// RPC helper
const rpc = async (fn, params, token) => {
  const doReq = async (t) => {
    const h = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${t || SUPABASE_KEY}`,
      "Content-Type": "application/json",
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: h,
      body: JSON.stringify(params),
    });
    const text = await res.text();
    if (!res.ok) {
      const err = text ? JSON.parse(text) : {};
      throw new Error(err.message || text);
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

// ── Categorías ────────────────────────────────────────────────────────────────

export const getCategorias = (token) =>
  db("categorias?order=orden.asc", "GET", null, token);

// ── Publicaciones ─────────────────────────────────────────────────────────────

export const getPublicaciones = (filtros = {}, token) => {
  if (filtros.texto || filtros.materia) {
    return rpc("buscar_publicaciones", {
      p_texto:      filtros.texto      || filtros.materia || null,
      p_tipo:       filtros.tipo       || null,
      p_categoria:  filtros.categoria  || null,
      p_modalidad:  filtros.modalidad  || null,
      p_precio_min: filtros.precioMin  || null,
      p_precio_max: filtros.precioMax  || null,
      p_limit:      filtros.limite     || 50,
      p_offset:     filtros.offset     || 0,
    }, token);
  }
  let q = "publicaciones_con_autor?select=*&order=created_at.desc";
  if (filtros.tipo)  q += `&tipo=eq.${filtros.tipo}`;
  if (filtros.autor) q += `&autor_email=eq.${encodeURIComponent(filtros.autor)}`;
  return db(q, "GET", null, token);
};

export const buscarPublicaciones = (filtros = {}, token) =>
  rpc("buscar_publicaciones", {
    p_texto:      filtros.texto      || null,
    p_tipo:       filtros.tipo       || null,
    p_categoria:  filtros.categoria  || null,
    p_modalidad:  filtros.modalidad  || null,
    p_precio_min: filtros.precioMin  || null,
    p_precio_max: filtros.precioMax  || null,
    p_limit:      filtros.limite     || 50,
    p_offset:     filtros.offset     || 0,
  }, token);

export const getMisPublicaciones = (email, token) =>
  db(`publicaciones_con_autor?autor_email=eq.${encodeURIComponent(email)}&order=created_at.desc`, "GET", null, token);

export const insertPublicacion = (data, token) =>
  db("publicaciones", "POST", data, token, "return=representation");

export const updatePublicacion = (id, data, token) =>
  db(`publicaciones?id=eq.${id}`, "PATCH", data, token, "return=representation");

export const deletePublicacion = (id, token) =>
  db(`publicaciones?id=eq.${id}`, "DELETE", null, token);

// ── Reseñas ───────────────────────────────────────────────────────────────────

export const getReseñas = (pubId, token) =>
  db(`reseñas?publicacion_id=eq.${pubId}&order=created_at.desc`, "GET", null, token);

export const getReseñasByAutor = (autorEmail, token) =>
  db(`reseñas?autor_email=eq.${encodeURIComponent(autorEmail)}`, "GET", null, token);

export const insertReseña = (data, token) =>
  db("reseñas", "POST", data, token, "return=representation");

// ── Mensajes (1 a 1) ──────────────────────────────────────────────────────────

export const getMensajes = (pubId, miEmail, otroEmail, token) => {
  const q = `mensajes?publicacion_id=eq.${pubId}&or=(and(de_nombre.eq.${encodeURIComponent(miEmail)},para_nombre.eq.${encodeURIComponent(otroEmail)}),and(de_nombre.eq.${encodeURIComponent(otroEmail)},para_nombre.eq.${encodeURIComponent(miEmail)}))&order=created_at.asc`;
  return db(q, "GET", null, token);
};

export const getMisChats = (miEmail, token) =>
  db(`mensajes?or=(de_nombre.eq.${encodeURIComponent(miEmail)},para_nombre.eq.${encodeURIComponent(miEmail)})&order=created_at.asc`, "GET", null, token);

export const getMensajesGrupo = (pubId, token) =>
  rpc("get_mensajes_grupo", { pub_id: pubId }, token);

export const insertMensaje = (data, token) =>
  db("mensajes", "POST", data, token, "return=representation");

export const updateReseñasNombre = (autorEmail, nuevoNombre, token) =>
  db(`reseñas?autor_email=eq.${encodeURIComponent(autorEmail)}`, "PATCH", { autor_nombre: nuevoNombre }, token);

export const updateMensajesNombre = (email, nuevoNombre, token) =>
  Promise.all([
    db(`mensajes?de_nombre=eq.${encodeURIComponent(email)}`, "PATCH", { de_nombre: nuevoNombre }, token).catch(() => {}),
  ]);

export const marcarLeidos = (pubId, miEmail, token) =>
  db(`mensajes?publicacion_id=eq.${pubId}&para_nombre=eq.${encodeURIComponent(miEmail)}&leido=eq.false`, "PATCH", { leido: true }, token);

// ── Inscripciones ─────────────────────────────────────────────────────────────

export const getInscripciones = (pubId, token) =>
  db(`inscripciones?publicacion_id=eq.${pubId}&order=created_at.desc`, "GET", null, token);

export const getMisInscripciones = (email, token) =>
  db(`inscripciones?alumno_email=eq.${encodeURIComponent(email)}&order=created_at.desc`, "GET", null, token);

export const insertInscripcion = (data, token) =>
  db("inscripciones", "POST", data, token, "return=representation");

export const deleteInscripcion = (id, token) =>
  db(`inscripciones?id=eq.${id}`, "DELETE", null, token);

export const getInscripcionByPubEmail = (pubId, email, token) =>
  db(`inscripciones?publicacion_id=eq.${pubId}&alumno_email=eq.${encodeURIComponent(email)}`, "GET", null, token);

export const updateInscripcion = (id, data, token) =>
  db(`inscripciones?id=eq.${id}`, "PATCH", data, token, "return=representation");

// ── Contenido curso ───────────────────────────────────────────────────────────

export const getContenido = (pubId, token) =>
  db(`contenido_curso?publicacion_id=eq.${pubId}&order=orden.asc`, "GET", null, token);

export const insertContenido = (data, token) =>
  db("contenido_curso", "POST", data, token, "return=representation");

export const updateContenido = (id, data, token) =>
  db(`contenido_curso?id=eq.${id}`, "PATCH", data, token, "return=representation");

export const deleteContenido = (id, token) =>
  db(`contenido_curso?id=eq.${id}`, "DELETE", null, token);

// ── Favoritos ─────────────────────────────────────────────────────────────────

export const getFavoritos = (email, token) =>
  db(`favoritos?usuario_email=eq.${encodeURIComponent(email)}`, "GET", null, token);

export const insertFavorito = (data, token) =>
  db("favoritos", "POST", data, token, "return=representation");

export const deleteFavorito = (id, token) =>
  db(`favoritos?id=eq.${id}`, "DELETE", null, token);

// ── Ofertas sobre búsquedas ───────────────────────────────────────────────────

export const getOfertasSobre = (busquedaId, token) =>
  db(`ofertas_busqueda?busqueda_id=eq.${busquedaId}&order=created_at.desc`, "GET", null, token);

export const getOfertasRecibidas = (duenoEmail, token) =>
  db(`ofertas_busqueda?busqueda_autor_email=eq.${encodeURIComponent(duenoEmail)}&leida=eq.false&estado=eq.pendiente`, "GET", null, token);

export const getMisOfertas = (email, token) =>
  db(`ofertas_busqueda?ofertante_email=eq.${encodeURIComponent(email)}`, "GET", null, token);

export const insertOfertaBusq = (data, token) =>
  db("ofertas_busqueda", "POST", data, token, "return=representation");

export const updateOfertaBusq = (id, data, token) =>
  db(`ofertas_busqueda?id=eq.${id}`, "PATCH", data, token, "return=representation");

export const deleteOfertaBusq = (id, token) =>
  db(`ofertas_busqueda?id=eq.${id}`, "DELETE", null, token);

export const getOfertaAceptada = (busquedaId, ofertanteEmail, token) =>
  db(`ofertas_busqueda?busqueda_id=eq.${busquedaId}&ofertante_email=eq.${encodeURIComponent(ofertanteEmail)}&estado=eq.aceptada`, "GET", null, token);

export const getOfertasAceptadasRecibidas = (duenoEmail, token) =>
  db(`ofertas_busqueda?busqueda_autor_email=eq.${encodeURIComponent(duenoEmail)}&estado=eq.aceptada`, "GET", null, token);

// ── Denuncias ─────────────────────────────────────────────────────────────────

export const insertDenuncia = (data, token) =>
  db("denuncias", "POST", data, token, "return=representation");

// ── Notificaciones ────────────────────────────────────────────────────────────

export const getNotificaciones = (email, token) =>
  db(`notificaciones?alumno_email=eq.${encodeURIComponent(email)}&leida=eq.false&order=created_at.desc`, "GET", null, token);

export const getTodasNotificaciones = (email, token) =>
  db(`notificaciones?alumno_email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=60`, "GET", null, token);

export const insertNotificacion = (data, token) =>
  db("notificaciones", "POST", data, token, "return=minimal");

export const marcarNotifLeida = (id, token) =>
  db(`notificaciones?id=eq.${id}`, "PATCH", { leida: true }, token);

export const marcarTodasNotifsLeidas = (email, token) =>
  db(`notificaciones?alumno_email=eq.${encodeURIComponent(email)}&leida=eq.false`, "PATCH", { leida: true }, token);

export const marcarNotifsTipoLeidas = (email, tipos, token) =>
  db(`notificaciones?alumno_email=eq.${encodeURIComponent(email)}&tipo=in.(${tipos.map(t => encodeURIComponent(t)).join(",")})&leida=eq.false`, "PATCH", { leida: true }, token);

// ── Vistas ────────────────────────────────────────────────────────────────────

export const incrementarVistas = (pubId, token) =>
  rpc("incrementar_vistas", { p_publicacion_id: pubId }, token).catch(() => {});

// ── Documentos / Credenciales ─────────────────────────────────────────────────

export const getDocumentos = (email, token) =>
  db(`documentos?usuario_email=eq.${encodeURIComponent(email)}&order=created_at.asc`, "GET", null, token);

export const insertDocumento = (data, token) =>
  db("documentos", "POST", data, token, "return=representation");

export const deleteDocumento = (id, token) =>
  db(`documentos?id=eq.${id}`, "DELETE", null, token);

// ── Verificación IA ───────────────────────────────────────────────────────────

export const getUsuarioByIdFull = (id, token) =>
  db(`usuarios?id=eq.${id}&select=id,email,nombre,display_name,bio,ubicacion,avatar_url,titulo_profesional,anios_experiencia,metodologia,idiomas,franja_horaria,linkedin_url,sitio_web`, "GET", null, token)
    .then(r => r?.[0] || null).catch(() => null);

export const getUsuarioById = (id, token) =>
  db(`usuarios?id=eq.${id}&select=id,email,nombre,display_name`, "GET", null, token)
    .then(r => r?.[0] || null).catch(() => null);

export const getUsuarioByEmail = (email, token) =>
  db(`usuarios?email=eq.${encodeURIComponent(email)}&select=id,email,nombre,display_name,bio,ubicacion,avatar_url,rol,titulo_profesional,anios_experiencia,metodologia,idiomas,franja_horaria,linkedin_url,sitio_web`, "GET", null, token)
    .then(r => r?.[0] || null).catch(() => null);

// ── IA helper — llama a la Supabase Edge Function "ai-proxy" ─────────────────

export const callIA = async (system, userMsg, maxTokens = 600, userToken = "") => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error ${res.status}`);
  }
  const data = await res.json();
  return data.content?.map(c => c.text || "").join("") || "";
};

// Multi-turn: acepta el historial completo como array [{role:"user"|"assistant", content:"..."}]
export const callIAChat = async (system, messages, maxTokens = 600) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error ${res.status}`);
  }
  const data = await res.json();
  return data.content?.map(c => c.text || "").join("") || "";
};

export const verificarConIA = async (titulo, materia, descripcion, respuesta, userToken = "") => {
  const contexto = `Tema: "${titulo}"${descripcion ? ` — ${descripcion.slice(0, 200)}` : ""}. Materia: "${materia}".`;
  const system = `Sos un evaluador de conocimiento para una plataforma educativa. Evaluás si el docente conoce el tema específico que está publicando. SIEMPRE respondé con JSON válido sin markdown, SOLO el objeto JSON. Formato: {"pregunta":"...","correcta":true,"feedback":"..."} - "pregunta": una pregunta técnica y específica sobre el tema exacto del título/descripción - "correcta": true si demuestra conocimiento básico del tema, false si está vacía o incorrecta - "feedback": máximo 1 oración`;
  const userMsg = respuesta
    ? `${contexto}\nRespuesta del docente: "${respuesta}"\nRespondé SOLO JSON.`
    : `Generá una pregunta específica sobre este tema: ${contexto}\nRespondé SOLO JSON con correcta:false y feedback vacío.`;
  const raw = await callIA(system, userMsg, 400, userToken);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Respuesta no es JSON");
  return JSON.parse(match[0]);
};

// ── Quiz ──────────────────────────────────────────────────────────────────────

export const getQuizEntregas = (quizId, token) =>
  db(`quiz_entregas?quiz_id=eq.${quizId}&order=created_at.desc`, "GET", null, token).catch(() => []);

export const getMiEntregaQuiz = (quizId, alumnoEmail, token) =>
  db(`quiz_entregas?quiz_id=eq.${quizId}&alumno_email=eq.${encodeURIComponent(alumnoEmail)}`, "GET", null, token)
    .then(r => r?.[0] || null).catch(() => null);

export const insertEntregaQuiz = (data, token) =>
  db("quiz_entregas", "POST", data, token, "return=representation");

export const updateEntregaQuiz = (id, data, token) =>
  db(`quiz_entregas?id=eq.${id}`, "PATCH", data, token, "return=representation");

// ── Tracking de materias vistas (para recomendaciones) ───────────────────────

export const trackMateria = (materia) => {
  try {
    const p = JSON.parse(localStorage.getItem("cl_mv") || "{}");
    p[materia] = (p[materia] || 0) + 1;
    localStorage.setItem("cl_mv", JSON.stringify(p));
  } catch {}
};

export const getMateriasFrecuentes = () => {
  try {
    return Object.entries(JSON.parse(localStorage.getItem("cl_mv") || "{}"))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([m]) => m);
  } catch { return []; }
};

// ── Búsquedas recientes ───────────────────────────────────────────────────────

export const guardarBusqueda = (data, token) =>
  db("busquedas_recientes", "POST", data, token, "return=representation").catch(() => null);

export const getBusquedasRecientes = (usuarioId, token) =>
  db(`busquedas_recientes?usuario_id=eq.${usuarioId}&order=created_at.desc&limit=8`, "GET", null, token)
    .catch(() => []);

// ── Foro ──────────────────────────────────────────────────────────────────────

export const getForoPosts = (pubId, token) =>
  db(`foro_posts?publicacion_id=eq.${pubId}&order=created_at.asc&select=*,respuestas:foro_respuestas(count)`, "GET", null, token)
    .catch(() => []);

export const insertForoPost = (data, token) =>
  db("foro_posts", "POST", data, token, "return=representation");

export const getForoRespuestas = (postId, token) =>
  db(`foro_respuestas?foro_post_id=eq.${postId}&order=created_at.asc`, "GET", null, token)
    .catch(() => []);

export const insertForoRespuesta = (data, token) =>
  db("foro_respuestas", "POST", data, token, "return=representation");

export const deleteForoPost = (id, token) =>
  db(`foro_posts?id=eq.${id}`, "DELETE", null, token);

// ── Clases realizadas ─────────────────────────────────────────────────────────

export const insertClaseRealizada = (data, token) =>
  db('clases_realizadas', 'POST', data, token, 'return=representation');
export const getClasesRealizadas = (email, token) =>
  db(`clases_realizadas?or=(docente_email.eq.${encodeURIComponent(email)},alumno_email.eq.${encodeURIComponent(email)})&order=fecha_clase.desc`, 'GET', null, token);
export const confirmarClase = (claseId, userEmail, token) =>
  rpc('confirmar_clase', { p_clase_id: claseId, p_usuario_email: userEmail }, token);

// ── Publicaciones por IDs ─────────────────────────────────────────────────────

export const getPublicacionesByIds = (ids, token) => {
  if (!ids || !ids.length) return Promise.resolve([]);
  const filter = ids.map(id => `id.eq.${id}`).join(",");
  return db(`publicaciones_con_autor?or=(${filter})&select=*`, "GET", null, token).catch(() => []);
};

// ── Skills ────────────────────────────────────────────────────────────────────

export const getSkillsDB = (pubId, token) =>
  db(`skills?publicacion_id=eq.${pubId}&order=orden.asc`, "GET", null, token).catch(() => []);

export const upsertSkill = (data, token) =>
  db("skills", "POST", data, token, "return=representation");

export const updateSkill = (id, data, token) =>
  db(`skills?id=eq.${id}`, "PATCH", data, token, "return=representation");

export const deleteSkill = (id, token) =>
  db(`skills?id=eq.${id}`, "DELETE", null, token);

// ── User Skill Levels ─────────────────────────────────────────────────────────

export const getMySkillLevels = (email, pubId, token) =>
  db(`user_skill_levels?select=*,skills!inner(publicacion_id)&usuario_email=eq.${encodeURIComponent(email)}&skills.publicacion_id=eq.${pubId}`, "GET", null, token)
    .catch(() => []);

export const getSkillLevelsByPub = (pubId, token) =>
  db(`user_skill_levels?select=*,skills!inner(publicacion_id)&skills.publicacion_id=eq.${pubId}`, "GET", null, token)
    .catch(() => []);

export const upsertSkillLevel = (data, token) =>
  db("user_skill_levels", "POST", data, token, "return=representation,resolution=merge-duplicates");

// ── Evaluaciones formales ─────────────────────────────────────────────────────

export const getEvaluaciones = (pubId, token) =>
  db(`evaluaciones?publicacion_id=eq.${pubId}&order=created_at.asc`, "GET", null, token).catch(() => []);

export const insertEvaluacion = (data, token) =>
  db("evaluaciones", "POST", data, token, "return=representation");

export const updateEvaluacion = (id, data, token) =>
  db(`evaluaciones?id=eq.${id}`, "PATCH", data, token, "return=representation");

export const deleteEvaluacion = (id, token) =>
  db(`evaluaciones?id=eq.${id}`, "DELETE", null, token);

export const getEvaluacionEntregas = (evalId, token) =>
  db(`evaluacion_entregas?evaluacion_id=eq.${evalId}&order=created_at.desc`, "GET", null, token).catch(() => []);

export const getMiEntregaEval = (evalId, email, token) =>
  db(`evaluacion_entregas?evaluacion_id=eq.${evalId}&alumno_email=eq.${encodeURIComponent(email)}`, "GET", null, token).catch(() => []);

export const insertEvaluacionEntrega = (data, token) =>
  db("evaluacion_entregas", "POST", data, token, "return=representation");

export const updateEvaluacionEntrega = (id, data, token) =>
  db(`evaluacion_entregas?id=eq.${id}`, "PATCH", data, token, "return=representation");

// ── Emails con Resend (via Edge Function send-email) ──────────────────────────

export const sendEmail = async (template, to, data = {}, token = "") => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${token || SUPABASE_KEY}`,
    },
    body: JSON.stringify({ template, to, data }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
  return json;
};

// ── Mercado Pago ──────────────────────────────────────────────────────────────

export const createMPCheckout = async (data, token) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/mp-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${token || SUPABASE_KEY}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (res.status === 503 && json.code === "MP_DISABLED") return { disabled: true };
  if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
  return json;
};

export const getMisPagos = (email, token) =>
  db(`pagos?alumno_email=eq.${encodeURIComponent(email)}&order=created_at.desc`, "GET", null, token).catch(() => []);

// Libera el pago retenido de un paquete de clases una vez que ambas partes confirman
export const liberarPagoClase = async (claseId, token) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/liberar_pago_clase`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ p_clase_id: claseId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.hint || `Error ${res.status}`);
  }
  return res.json().catch(() => null);
};

export const getPagosDocente = (email, token) =>
  db(`pagos?docente_email=eq.${encodeURIComponent(email)}&order=created_at.desc`, "GET", null, token).catch(() => []);

// ── Alertas de búsquedas por materia ──────────────────────────────────────────

export const getAlertasBusquedas = (email, token) =>
  db(`alertas_busquedas?email=eq.${encodeURIComponent(email)}&order=created_at.desc`, 'GET', null, token);

export const insertAlertaBusqueda = (data, token) =>
  db('alertas_busquedas', 'POST', data, token, 'return=representation');

export const updateAlertaBusqueda = (id, data, token) =>
  db(`alertas_busquedas?id=eq.${id}`, 'PATCH', data, token);

export const deleteAlertaBusqueda = (id, token) =>
  db(`alertas_busquedas?id=eq.${id}`, 'DELETE', null, token);

export const getAlertasMatchingMateria = (materia, token) =>
  db(`alertas_busquedas?activa=eq.true&materias=cs.{${encodeURIComponent(materia)}}`, 'GET', null, token);

// ── Métricas docente ──────────────────────────────────────────────────────────

export const getMetricasDocente = (email, token) =>
  db(`metricas_docente?autor_email=eq.${encodeURIComponent(email)}`, 'GET', null, token);

export const registrarClickContacto = async (pubId, token) => {
  try {
    const p = await db(`publicaciones?id=eq.${pubId}&select=clicks_contacto`, 'GET', null, token);
    if (p && p[0]) {
      await db(`publicaciones?id=eq.${pubId}`, 'PATCH', { clicks_contacto: (p[0].clicks_contacto || 0) + 1 }, token);
    }
  } catch {}
};

// ── Alertas de publicaciones ──────────────────────────────────────────────────

export const dispararAlertas = async (pub, token) => {
  try {
    const alertas = await db(
      `alertas_publicacion?activa=eq.true&usuario_id=neq.${pub.autor_id}&select=*`,
      "GET", null, token
    ).catch(() => []);

    if (!alertas?.length) return;

    const pubTexto = `${pub.titulo} ${pub.descripcion || ""} ${pub.materia || ""}`.toLowerCase();

    for (const alerta of alertas) {
      try {
        let criterios = {};
        try { criterios = JSON.parse(alerta.criterios_json || "{}"); } catch {}

        const tipoAlerta = alerta.tipo_alerta || "ambos";
        if (tipoAlerta !== "ambos" && pub.tipo !== tipoAlerta) continue;

        let score = 0;

        if (criterios.materia && pub.materia === criterios.materia) score += 4;
        if (criterios.tipo && criterios.tipo !== "cualquiera" && pub.tipo === criterios.tipo) score += 2;
        if (criterios.modalidad && criterios.modalidad !== "cualquiera" && pub.modalidad === criterios.modalidad) score += 1;

        (criterios.palabras_clave || []).forEach(kw => {
          const k = kw.toLowerCase().trim();
          if (!k) return;
          if (pubTexto.includes(k)) { score += 2; return; }
          const raiz = k.slice(0, Math.max(5, k.length - 2));
          if (pubTexto.includes(raiz)) score += 1;
        });

        if (score < 2 && alerta.descripcion && pub.titulo) {
          try {
            const raw = await callIA(
              "Respondé SOLO con 'si' o 'no'. ¿La publicación podría ser relevante para esta búsqueda?",
              `Búsqueda del usuario: "${alerta.descripcion}" Publicación: "${pub.titulo} — ${(pub.descripcion || "").slice(0, 100)}"`,
              50, token
            );
            if (raw.toLowerCase().includes("si")) score += 3;
          } catch {}
        }

        if (score >= 2) {
          await sendEmail("alerta_publicacion", alerta.usuario_email, {
            pub_titulo:   pub.titulo,
            materia:      pub.materia || "",
            tipo:         pub.tipo === "oferta" ? "Clase/Curso" : "Búsqueda",
            precio:       pub.precio ? `$${Number(pub.precio).toLocaleString("es-AR")}` : "Gratis",
            modalidad:    pub.modalidad || "",
            descripcion:  (pub.descripcion || "").slice(0, 150),
            criterio_desc: criterios.resumen || alerta.descripcion,
          }, token);
        }
      } catch { /* silencioso por alerta */ }
    }
  } catch { /* silencioso */ }
};
