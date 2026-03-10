const SUPABASE_URL = "https://hptdyehzqfpgtrpuydny.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g";
const SESSION_KEY = "classelink_session";

// ── Session ───────────────────────────────────────────────────────────────────
export const saveSession  = (s) => { try{localStorage.setItem(SESSION_KEY,JSON.stringify(s));}catch{} };
export const loadSession  = ()  => { try{const s=localStorage.getItem(SESSION_KEY);return s?JSON.parse(s):null;}catch{return null;} };
export const clearSession = ()  => { try{localStorage.removeItem(SESSION_KEY);}catch{} };

// ── Display name (localStorage) ───────────────────────────────────────────────
export const getDisplayName = (email) => {
  if(!email) return "Usuario";
  try { return localStorage.getItem("dn_"+email) || email.split("@")[0]; } catch { return email.split("@")[0]; }
};
export const setDisplayName = (email, name) => {
  if(!email) return;
  try { localStorage.setItem("dn_"+email, name||email.split("@")[0]); } catch {}
};

// ── Usuarios ──────────────────────────────────────────────────────────────────
// Se llama al registrarse para crear el registro en la tabla pública usuarios
export const insertUsuario = (data, token) =>
  db("usuarios","POST",data,token,"return=representation");

// Se llama al hacer login para asegurarse que existe (por si se creó antes del fix)
export const upsertUsuario = (data, token) =>
  db("usuarios","POST",data,token,"return=representation,resolution=merge-duplicates");

let _onSessionRefresh = null;
export const setSessionRefreshCallback = (fn) => { _onSessionRefresh = fn; };

// ── Auth ──────────────────────────────────────────────────────────────────────
const authFetch = async (path, opts={}) => {
  const res = await fetch(`${SUPABASE_URL}${path}`,{
    headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json"},
    ...opts,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if(!res.ok) throw new Error(data.error_description||data.message||"Error");
  return data;
};

export const signUp         = (e,p) => authFetch("/auth/v1/signup",{method:"POST",body:JSON.stringify({email:e,password:p})});
export const signIn         = (e,p) => authFetch("/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email:e,password:p})});
export const resetPassword  = (e)   => authFetch("/auth/v1/recover",{method:"POST",body:JSON.stringify({email:e})});
export const refreshSession = (rt)  => authFetch("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:JSON.stringify({refresh_token:rt})});

// ── DB helper ─────────────────────────────────────────────────────────────────
const db = async (path, method="GET", body=null, token, prefer="") => {
  const doReq = async (t) => {
    const h = {"apikey":SUPABASE_KEY,"Authorization":`Bearer ${t||SUPABASE_KEY}`,"Content-Type":"application/json"};
    if(prefer) h["Prefer"]=prefer;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{method,headers:h,body:body?JSON.stringify(body):undefined});
    const text = await res.text();
    if(!res.ok){
      const err = text?JSON.parse(text):{};
      if(err.message?.includes("JWT")||err.code==="PGRST303") throw Object.assign(new Error("JWT expired"),{isExpired:true});
      throw new Error(text);
    }
    return text?JSON.parse(text):[];
  };
  try{ return await doReq(token); }
  catch(e){
    if(e.isExpired&&_onSessionRefresh){const s=await _onSessionRefresh();if(s?.access_token)return await doReq(s.access_token);}
    throw e;
  }
};

// RPC helper
const rpc = async (fn, params, token) => {
  const doReq = async (t) => {
    const h = {"apikey":SUPABASE_KEY,"Authorization":`Bearer ${t||SUPABASE_KEY}`,"Content-Type":"application/json"};
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`,{method:"POST",headers:h,body:JSON.stringify(params)});
    const text = await res.text();
    if(!res.ok){ const err=text?JSON.parse(text):{}; throw new Error(err.message||text); }
    return text?JSON.parse(text):[];
  };
  try{ return await doReq(token); }
  catch(e){
    if(e.isExpired&&_onSessionRefresh){const s=await _onSessionRefresh();if(s?.access_token)return await doReq(s.access_token);}
    throw e;
  }
};

// ── Publicaciones ─────────────────────────────────────────────────────────────
// Usamos la VIEW publicaciones_con_autor que expone autor_email y autor_nombre
export const getPublicaciones = (filtros={},token) => {
  let q="publicaciones_con_autor?select=*&order=created_at.desc";
  if(filtros.tipo)    q+=`&tipo=eq.${filtros.tipo}`;
  if(filtros.materia) q+=`&materia=eq.${encodeURIComponent(filtros.materia)}`;
  if(filtros.autor)   q+=`&autor_email=eq.${encodeURIComponent(filtros.autor)}`;
  return db(q,"GET",null,token);
};

export const getMisPublicaciones = (email,token) =>
  db(`publicaciones_con_autor?autor_email=eq.${encodeURIComponent(email)}&order=created_at.desc`,"GET",null,token);

// Para insertar/actualizar usamos la tabla base (no la view)
export const insertPublicacion = (data,token) => db("publicaciones","POST",data,token,"return=representation");
export const updatePublicacion = (id,data,token) => db(`publicaciones?id=eq.${id}`,"PATCH",data,token,"return=representation");
export const deletePublicacion = (id,token) => db(`publicaciones?id=eq.${id}`,"DELETE",null,token);

// ── Reseñas ───────────────────────────────────────────────────────────────────
// Usamos join con usuarios para obtener autor_nombre y autor_pub_email
export const getReseñas = (pubId,token) =>
  db(`reseñas?publicacion_id=eq.${pubId}&order=created_at.desc`,"GET",null,token);

export const getReseñasByAutor = (autorEmail,token) =>
  db(`reseñas?autor_pub_email=eq.${encodeURIComponent(autorEmail)}`,"GET",null,token);

export const insertReseña = (data,token) =>
  db("reseñas","POST",data,token,"return=representation");

// ── Mensajes (1 a 1) ──────────────────────────────────────────────────────────
// El código usa de_nombre/para_nombre (emails) como texto
export const getMensajes = (pubId,miEmail,otroEmail,token) => {
  const q=`mensajes?publicacion_id=eq.${pubId}&or=(and(de_nombre.eq.${encodeURIComponent(miEmail)},para_nombre.eq.${encodeURIComponent(otroEmail)}),and(de_nombre.eq.${encodeURIComponent(otroEmail)},para_nombre.eq.${encodeURIComponent(miEmail)}))&order=created_at.asc`;
  return db(q,"GET",null,token);
};

export const getMisChats = (miEmail,token) =>
  db(`mensajes?or=(de_nombre.eq.${encodeURIComponent(miEmail)},para_nombre.eq.${encodeURIComponent(miEmail)})&order=created_at.asc`,"GET",null,token);

// Mensajes grupales via RPC (bypasa el filtro de pares de emails)
export const getMensajesGrupo = (pubId,token) =>
  rpc("get_mensajes_grupo",{pub_id:pubId},token);

export const insertMensaje = (data,token) =>
  db("mensajes","POST",data,token,"return=representation");

export const marcarLeidos = (pubId,miEmail,token) =>
  db(`mensajes?publicacion_id=eq.${pubId}&para_nombre=eq.${encodeURIComponent(miEmail)}&leido=eq.false`,"PATCH",{leido:true},token);

// ── Inscripciones ─────────────────────────────────────────────────────────────
export const getInscripciones    = (pubId,token) =>
  db(`inscripciones?publicacion_id=eq.${pubId}&order=created_at.desc`,"GET",null,token);

export const getMisInscripciones = (email,token) =>
  db(`inscripciones?alumno_email=eq.${encodeURIComponent(email)}&order=created_at.desc`,"GET",null,token);

export const insertInscripcion = (data,token) =>
  db("inscripciones","POST",data,token,"return=representation");

export const deleteInscripcion = (id,token) =>
  db(`inscripciones?id=eq.${id}`,"DELETE",null,token);

export const updateInscripcion = (id,data,token) =>
  db(`inscripciones?id=eq.${id}`,"PATCH",data,token,"return=representation");

// ── Contenido curso ───────────────────────────────────────────────────────────
export const getContenido    = (pubId,token) =>
  db(`contenido_curso?publicacion_id=eq.${pubId}&order=orden.asc`,"GET",null,token);
export const insertContenido = (data,token) =>
  db("contenido_curso","POST",data,token,"return=representation");
export const updateContenido = (id,data,token) =>
  db(`contenido_curso?id=eq.${id}`,"PATCH",data,token,"return=representation");
export const deleteContenido = (id,token) =>
  db(`contenido_curso?id=eq.${id}`,"DELETE",null,token);

// ── Favoritos ─────────────────────────────────────────────────────────────────
export const getFavoritos   = (email,token) =>
  db(`favoritos?usuario_email=eq.${encodeURIComponent(email)}`,"GET",null,token);
export const insertFavorito = (data,token) =>
  db("favoritos","POST",data,token,"return=representation");
export const deleteFavorito = (id,token) =>
  db(`favoritos?id=eq.${id}`,"DELETE",null,token);

// ── Ofertas sobre búsquedas ───────────────────────────────────────────────────
export const getOfertasSobre = (busquedaId,token) =>
  db(`ofertas_busqueda?busqueda_id=eq.${busquedaId}&order=created_at.desc`,"GET",null,token);

export const getOfertasRecibidas = (duenoEmail,token) =>
  db(`ofertas_busqueda?busqueda_autor_email=eq.${encodeURIComponent(duenoEmail)}&leida=eq.false&estado=eq.pendiente`,"GET",null,token);

export const getMisOfertas = (email,token) =>
  db(`ofertas_busqueda?ofertante_email=eq.${encodeURIComponent(email)}`,"GET",null,token);

export const insertOfertaBusq = (data,token) =>
  db("ofertas_busqueda","POST",data,token,"return=representation");

export const updateOfertaBusq = (id,data,token) =>
  db(`ofertas_busqueda?id=eq.${id}`,"PATCH",data,token,"return=representation");

export const deleteOfertaBusq = (id,token) =>
  db(`ofertas_busqueda?id=eq.${id}`,"DELETE",null,token);

export const getOfertaAceptada = (busquedaId,ofertanteEmail,token) =>
  db(`ofertas_busqueda?busqueda_id=eq.${busquedaId}&ofertante_email=eq.${encodeURIComponent(ofertanteEmail)}&estado=eq.aceptada`,"GET",null,token);

// Ofertas aceptadas donde soy dueño de la búsqueda (para "Clases acordadas" en Mi cuenta)
export const getOfertasAceptadasRecibidas = (duenoEmail,token) =>
  db(`ofertas_busqueda?busqueda_autor_email=eq.${encodeURIComponent(duenoEmail)}&estado=eq.aceptada`,"GET",null,token);

// ── Denuncias ─────────────────────────────────────────────────────────────────
export const insertDenuncia = (data,token) =>
  db("denuncias","POST",data,token,"return=representation");

// ── Notificaciones ────────────────────────────────────────────────────────────
export const getNotificaciones = (email,token) =>
  db(`notificaciones?alumno_email=eq.${encodeURIComponent(email)}&leida=eq.false&order=created_at.desc`,"GET",null,token);

export const insertNotificacion = (data,token) =>
  db("notificaciones","POST",data,token,"return=representation");

export const marcarNotifLeida = (id,token) =>
  db(`notificaciones?id=eq.${id}`,"PATCH",{leida:true},token);

// Marca TODAS las notificaciones del email como leídas
export const marcarTodasNotifsLeidas = (email,token) =>
  db(`notificaciones?alumno_email=eq.${encodeURIComponent(email)}&leida=eq.false`,"PATCH",{leida:true},token);

// ── Documentos / Credenciales ─────────────────────────────────────────────────
export const getDocumentos   = (email,token) =>
  db(`documentos?usuario_email=eq.${encodeURIComponent(email)}&order=created_at.asc`,"GET",null,token);
export const insertDocumento = (data,token) =>
  db("documentos","POST",data,token,"return=representation");
export const deleteDocumento = (id,token) =>
  db(`documentos?id=eq.${id}`,"DELETE",null,token);

// ── Verificación IA ───────────────────────────────────────────────────────────

export const getUsuarioById = (id,token) =>
  db(`usuarios?id=eq.${id}&select=id,email,nombre,display_name`,"GET",null,token).then(r=>r?.[0]||null).catch(()=>null);
export const verificarConIA = async (titulo, materia, respuesta) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 400,
      system: `Sos un evaluador de conocimiento para una plataforma educativa.
Tu tarea: evaluar si el docente conoce el tema "${titulo}" de la materia "${materia}".
SIEMPRE respondé con JSON válido sin markdown, sin texto extra, SOLO el objeto JSON.
Formato: {"pregunta":"...","correcta":true,"feedback":"..."}
- "pregunta": una pregunta técnica y específica sobre el tema
- "correcta": true si demuestra conocimiento básico, false si está vacía o incorrecta
- "feedback": máximo 1 oración`,
      messages: [{ role: "user", content: respuesta
        ? `Tema: "${titulo}" | Materia: "${materia}"\nRespuesta: "${respuesta}"\nRespondé SOLO JSON.`
        : `Generá una pregunta sobre "${titulo}" de "${materia}". Respondé SOLO JSON con correcta:false y feedback vacío.`
      }]
    })
  });
  if (!res.ok) throw new Error("Error de API");
  const data = await res.json();
  const raw = data.content?.map(c => c.text || "").join("") || "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Respuesta no es JSON");
  return JSON.parse(match[0]);
};
