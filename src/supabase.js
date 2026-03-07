const SUPABASE_URL = "https://hptdyehzqfpgtrpuydny.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g";
const SESSION_KEY = "classelink_session";

export const saveSession  = (s) => { try{localStorage.setItem(SESSION_KEY,JSON.stringify(s));}catch{} };
export const loadSession  = ()  => { try{const s=localStorage.getItem(SESSION_KEY);return s?JSON.parse(s):null;}catch{return null;} };
export const clearSession = ()  => { try{localStorage.removeItem(SESSION_KEY);}catch{} };

let _onSessionRefresh = null;
export const setSessionRefreshCallback = (fn) => { _onSessionRefresh = fn; };

const authFetch = async (path, options={}) => {
  const res = await fetch(`${SUPABASE_URL}${path}`,{
    headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json"},
    ...options,
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

// ── Publicaciones ──────────────────────────────────────────────────────────────
export const getPublicaciones = (filtros={},token) => {
  let q="publicaciones?select=*&order=created_at.desc";
  if(filtros.tipo)    q+=`&tipo=eq.${filtros.tipo}`;
  if(filtros.materia) q+=`&materia=eq.${encodeURIComponent(filtros.materia)}`;
  if(filtros.autor)   q+=`&autor_email=eq.${encodeURIComponent(filtros.autor)}`;
  return db(q,"GET",null,token);
};
export const insertPublicacion = (data,token) => db("publicaciones","POST",data,token,"return=representation");
export const updatePublicacion = (id,data,token) => db(`publicaciones?id=eq.${id}`,"PATCH",data,token,"return=representation");
export const deletePublicacion = (id,token) => db(`publicaciones?id=eq.${id}`,"DELETE",null,token);

// ── Reseñas ────────────────────────────────────────────────────────────────────
export const getReseñas        = (pubId,token) => db(`rese%C3%B1as?publicacion_id=eq.${pubId}&order=created_at.desc`,"GET",null,token);
export const getReseñasByAutor = (autorEmail,token) => db(`rese%C3%B1as?autor_pub_email=eq.${encodeURIComponent(autorEmail)}`,"GET",null,token);
export const insertReseña      = (data,token) => db("rese%C3%B1as","POST",data,token,"return=representation");

// ── Mensajes ───────────────────────────────────────────────────────────────────
export const getMensajes = (pubId,miEmail,otroEmail,token) => {
  const q=`mensajes?publicacion_id=eq.${pubId}&or=(and(de_nombre.eq.${encodeURIComponent(miEmail)},para_nombre.eq.${encodeURIComponent(otroEmail)}),and(de_nombre.eq.${encodeURIComponent(otroEmail)},para_nombre.eq.${encodeURIComponent(miEmail)}))&order=created_at.asc`;
  return db(q,"GET",null,token);
};
export const getMisChats   = (miEmail,token) => db(`mensajes?or=(de_nombre.eq.${encodeURIComponent(miEmail)},para_nombre.eq.${encodeURIComponent(miEmail)})&order=created_at.desc`,"GET",null,token);
export const insertMensaje = (data,token) => db("mensajes","POST",data,token,"return=representation");
export const marcarLeidos  = (pubId,miEmail,token) => db(`mensajes?publicacion_id=eq.${pubId}&para_nombre=eq.${encodeURIComponent(miEmail)}&leido=eq.false`,"PATCH",{leido:true},token);

// ── Inscripciones ──────────────────────────────────────────────────────────────
export const getInscripciones    = (pubId,token) => db(`inscripciones?publicacion_id=eq.${pubId}&order=created_at.desc`,"GET",null,token);
export const getMisInscripciones = (email,token) => db(`inscripciones?alumno_email=eq.${encodeURIComponent(email)}&order=created_at.desc`,"GET",null,token);
export const insertInscripcion   = (data,token) => db("inscripciones","POST",data,token,"return=representation");
export const deleteInscripcion   = (id,token) => db(`inscripciones?id=eq.${id}`,"DELETE",null,token);
export const updateInscripcion   = (id,data,token) => db(`inscripciones?id=eq.${id}`,"PATCH",data,token,"return=representation");

// ── Contenido curso ────────────────────────────────────────────────────────────
export const getContenido    = (pubId,token) => db(`contenido_curso?publicacion_id=eq.${pubId}&order=orden.asc`,"GET",null,token);
export const insertContenido = (data,token) => db("contenido_curso","POST",data,token,"return=representation");
export const updateContenido = (id,data,token) => db(`contenido_curso?id=eq.${id}`,"PATCH",data,token,"return=representation");
export const deleteContenido = (id,token) => db(`contenido_curso?id=eq.${id}`,"DELETE",null,token);

// ── Favoritos ──────────────────────────────────────────────────────────────────
export const getFavoritos    = (email,token) => db(`favoritos?usuario_email=eq.${encodeURIComponent(email)}`,"GET",null,token);
export const insertFavorito  = (data,token) => db("favoritos","POST",data,token,"return=representation");
export const deleteFavorito  = (id,token) => db(`favoritos?id=eq.${id}`,"DELETE",null,token);

// ── Ofertas sobre búsquedas ────────────────────────────────────────────────────
export const getOfertasSobre     = (busquedaId,token) => db(`ofertas_busqueda?busqueda_id=eq.${busquedaId}&order=created_at.desc`,"GET",null,token);
export const getOfertasRecibidas = (duenoEmail,token) => db(`ofertas_busqueda?busqueda_autor_email=eq.${encodeURIComponent(duenoEmail)}&leida=eq.false`,"GET",null,token);
export const getMisOfertas       = (email,token) => db(`ofertas_busqueda?ofertante_email=eq.${encodeURIComponent(email)}`,"GET",null,token);
export const insertOfertaBusq    = (data,token) => db("ofertas_busqueda","POST",data,token,"return=representation");
export const marcarOfertaLeida   = (id,token) => db(`ofertas_busqueda?id=eq.${id}`,"PATCH",{leida:true},token);
export const updateOfertaBusq    = (id,data,token) => db(`ofertas_busqueda?id=eq.${id}`,"PATCH",data,token,"return=representation");
export const deleteOfertaBusq    = (id,token) => db(`ofertas_busqueda?id=eq.${id}`,"DELETE",null,token);

// ── Denuncias ──────────────────────────────────────────────────────────────────
export const insertDenuncia = (data,token) => db("denuncias","POST",data,token,"return=representation");

// ── Email (via Supabase Edge Functions o simplemente log) ─────────────────────
// Usamos un endpoint propio de notificacion que guarda la notificacion pendiente
export const insertNotificacion = (data,token) => db("notificaciones","POST",data,token,"return=representation");

// ── Verificación IA ────────────────────────────────────────────────────────────
export const verificarConIA = async (titulo,materia,respuesta) => {
  const res = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514",max_tokens:300,
      system:`Sos evaluador de conocimiento educativo. Sobre el curso "${titulo}" de "${materia}":
1. Generá UNA pregunta específica y técnica.
2. Evaluá si la respuesta es correcta/razonable.
Respondé SOLO JSON sin markdown: {"pregunta":"...","correcta":true/false,"feedback":"..."}`,
      messages:[{role:"user",content:respuesta
        ?`Tema: "${titulo}"\nRespuesta: "${respuesta}"\nEvaluá.`
        :`Tema: "${titulo}"\nGenerá solo la pregunta. correcta:false, feedback:""`}]
    })
  });
  const data = await res.json();
  const text = data.content?.map(c=>c.text||"").join("")||"{}";
  return JSON.parse(text.replace(/```json|```/g,"").trim());
};
