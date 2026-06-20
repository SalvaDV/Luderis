import { captureException } from "./sentry";
import type { Database } from "./database.types";

// Tipos de las filas/tablas generados desde el esquema de Supabase (database.types.ts).
// Disponibles para tipar gradualmente los retornos: ej. db<Tables["usuarios"]["Row"][]>(...).
export type Tables = Database["public"]["Tables"];

// Alias de la capa de datos. `Token` admite undefined/null porque `db`/`rpc`
// caen al anon key cuando no hay sesión; así los call-sites pueden pasar undefined.
type Token = string | null | undefined;
type Id = string | number;
type Row = Record<string, any>;

interface Filtros {
  texto?: string;
  materia?: string;
  tipo?: string;
  categoria?: string;
  modalidad?: string;
  precioMin?: number;
  precioMax?: number;
  limite?: number;
  offset?: number;
  autor?: string;
}

export const SUPABASE_URL: string = process.env.REACT_APP_SUPABASE_URL || "";
export const SUPABASE_KEY: string = process.env.REACT_APP_SUPABASE_KEY || "";

const SESSION_KEY = "classelink_session";

// ── Reporte central de errores de red/DB ──────────────────────────────────────
// Los call-sites usan .catch(()=>[]) para no romper la UI, pero eso ocultaba TODO
// fallo (red, RLS, 500). Reportamos acá una sola vez para que sea visible en Sentry
// sin cambiar el comportamiento de fallback. Se omiten los JWT expirados (esperados).
const reportSupabaseError = (path: string, method: string, err: any): void => {
  if (err?.isExpired) return;
  try {
    captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { layer: "supabase", method },
      extra: { path: String(path).split("?")[0] }, // sin querystring (evita PII en tags)
    });
  } catch {}
};

// ── Session ───────────────────────────────────────────────────────────────────

export const saveSession = (s: any): void => {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
};

export const loadSession = (): any => {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

export const clearSession = (): void => {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
};

// ── Display name (localStorage) ───────────────────────────────────────────────

export const getDisplayName = (email?: string | null): string => {
  if (!email) return "Usuario";
  try {
    return localStorage.getItem("dn_" + email) || email.split("@")[0];
  } catch {
    return email.split("@")[0];
  }
};

export const setDisplayName = (email?: string | null, name?: string | null): void => {
  if (!email) return;
  try {
    localStorage.setItem("dn_" + email, name || email.split("@")[0]);
  } catch {}
};

// ── Usuarios ──────────────────────────────────────────────────────────────────

// Se llama al registrarse para crear el registro en la tabla pública usuarios.
// return=minimal: pedir la fila de vuelta (RETURNING *) requiere SELECT en TODAS
// las columnas, pero authenticated no lo tiene en columnas sensibles (tokens MP)
// → daba 403 y revertía el INSERT/UPDATE entero. No necesitamos la fila de vuelta.
export const insertUsuario = (data: Row, token: Token) =>
  db("usuarios", "POST", data, token, "return=minimal");

// ── Quejas (libro de quejas público) ─────────────────────────────────────────
export const insertQueja = (data: Row) =>
  db("quejas", "POST", data, null, "return=minimal");

// Actualiza campos del perfil (nombre, bio, etc.) en la tabla usuarios
export const updateUsuario = (id: Id, data: Row, token: Token) =>
  db(`usuarios?id=eq.${id}`, "PATCH", data, token, "return=minimal");

// Se llama al hacer login para asegurarse que existe (por si se creó antes del fix)
export const upsertUsuario = (data: Row, token: Token) =>
  db("usuarios", "POST", data, token, "return=minimal,resolution=merge-duplicates");

let _onSessionRefresh: (() => Promise<any>) | null = null;
export const setSessionRefreshCallback = (fn: () => Promise<any>): void => { _onSessionRefresh = fn; };

// ── Auth ──────────────────────────────────────────────────────────────────────

const authFetch = async (path: string, opts: RequestInit = {}): Promise<any> => {
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
  if (!res.ok) {
    const msg = data.error_description || data.message || data.error || "Error";
    const err: any = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
};

export const signUp = (e: string, p: string) =>
  authFetch("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email: e, password: p }) });

export const signIn = (e: string, p: string) =>
  authFetch("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: e, password: p }) });

export const resetPassword = (e: string) =>
  authFetch("/auth/v1/recover", {
    method: "POST",
    body: JSON.stringify({ email: e, redirect_to: window.location.origin }),
  });

export const updatePassword = async (accessToken: string, newPassword: string): Promise<any> => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: newPassword }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error_description || data.msg || data.message || "Error al actualizar la contraseña");
  return data;
};

// ── Google OAuth ──────────────────────────────────────────────────────────────

export const signInWithGoogle = (): void => {
  const redirectTo = `${window.location.origin}`;
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
};

// Extraer sesión del hash de la URL (callback de OAuth)
export const getSessionFromUrl = async (): Promise<any> => {
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
  const expires_at = Math.floor(Date.now() / 1000) + 3600;
  return { access_token, refresh_token, user, expires_at };
};

export const refreshSession = (rt: string) =>
  authFetch("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: rt }) });

// ── DB helper ─────────────────────────────────────────────────────────────────

export const db = async <T = any>(path: string, method: string = "GET", body: any = null, token?: Token, prefer: string = ""): Promise<T> => {
  const doReq = async (t?: Token): Promise<any> => {
    const h: Record<string, string> = {
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
      const err: any = text ? JSON.parse(text) : {};
      if (res.status === 401 || err.message?.includes("JWT") || err.code === "PGRST303" || err.code === "PGRST301")
        throw Object.assign(new Error(err.message || "JWT expired"), { isExpired: true });
      throw new Error(text);
    }
    return text ? JSON.parse(text) : [];
  };
  try {
    return await doReq(token);
  } catch (e: any) {
    if (e.isExpired && _onSessionRefresh) {
      const s = await _onSessionRefresh();
      if (s?.access_token) return await doReq(s.access_token);
    }
    reportSupabaseError(path, method, e);
    throw e;
  }
};

// RPC helper
const rpc = async <T = any>(fn: string, params: any, token?: Token): Promise<T> => {
  const doReq = async (t?: Token): Promise<any> => {
    const h: Record<string, string> = {
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
      const err: any = text ? JSON.parse(text) : {};
      throw new Error(err.message || text);
    }
    return text ? JSON.parse(text) : [];
  };
  try {
    return await doReq(token);
  } catch (e: any) {
    if (e.isExpired && _onSessionRefresh) {
      const s = await _onSessionRefresh();
      if (s?.access_token) return await doReq(s.access_token);
    }
    reportSupabaseError(`rpc/${fn}`, "POST", e);
    throw e;
  }
};

// ── Categorías ────────────────────────────────────────────────────────────────

export const getCategorias = (token: Token) =>
  db("categorias?order=orden.asc", "GET", null, token);

// ── Publicaciones ─────────────────────────────────────────────────────────────

export const getPublicaciones = (filtros: Filtros = {}, token?: Token) => {
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
  if (filtros.tipo)   q += `&tipo=eq.${filtros.tipo}`;
  if (filtros.autor)  q += `&autor_email=eq.${encodeURIComponent(filtros.autor)}`;
  if (filtros.limite) q += `&limit=${filtros.limite}`;
  if (filtros.offset) q += `&offset=${filtros.offset}`;
  return db(q, "GET", null, token);
};

export const buscarPublicaciones = (filtros: Filtros = {}, token?: Token) =>
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

export const getMisPublicaciones = (email: string, token: Token) =>
  db(`publicaciones_con_autor?autor_email=eq.${encodeURIComponent(email)}&order=created_at.desc`, "GET", null, token);

export const insertPublicacion = (data: Row, token: Token) =>
  db("publicaciones", "POST", data, token, "return=representation");

export const updatePublicacion = (id: Id, data: Row, token: Token) =>
  db(`publicaciones?id=eq.${id}`, "PATCH", data, token, "return=representation");

export const deletePublicacion = (id: Id, token: Token) =>
  db(`publicaciones?id=eq.${id}`, "DELETE", null, token);

// ── Reseñas ───────────────────────────────────────────────────────────────────

export const getReseñas = (pubId: Id, token: Token) =>
  db(`reseñas?publicacion_id=eq.${pubId}&order=created_at.desc`, "GET", null, token);

// S2-A5: bulk query para evitar N+1 al cargar reseñas de muchas publicaciones
export const getReseñasBulk = (ids: Id[], token: Token) => {
  if (!ids?.length) return Promise.resolve([]);
  const inClause = ids.join(",");
  // Solo se usan publicacion_id y estrellas para el promedio; no pedir autor_email
  // (PII innecesaria; además el rol anon ya no tiene grant sobre esa columna).
  return db(`reseñas?publicacion_id=in.(${inClause})&select=publicacion_id,estrellas`, "GET", null, token);
};

export const getReseñasByAutor = (autorEmail: string, token: Token) =>
  db(`reseñas?autor_email=eq.${encodeURIComponent(autorEmail)}`, "GET", null, token);

export const insertReseña = (data: Row, token: Token) =>
  db("reseñas", "POST", data, token, "return=representation");

// ── Mensajes (1 a 1) ──────────────────────────────────────────────────────────

export const getMensajes = (pubId: Id, miEmail: string, otroEmail: string, token: Token) => {
  const q = `mensajes?publicacion_id=eq.${pubId}&or=(and(de_nombre.eq.${encodeURIComponent(miEmail)},para_nombre.eq.${encodeURIComponent(otroEmail)}),and(de_nombre.eq.${encodeURIComponent(otroEmail)},para_nombre.eq.${encodeURIComponent(miEmail)}))&order=created_at.asc`;
  return db(q, "GET", null, token);
};

export const getMisChats = (miEmail: string, token: Token) =>
  db(`mensajes?or=(de_nombre.eq.${encodeURIComponent(miEmail)},para_nombre.eq.${encodeURIComponent(miEmail)})&order=created_at.desc&limit=400`, "GET", null, token);

export const getMensajesGrupo = (pubId: Id, token: Token) =>
  rpc("get_mensajes_grupo", { pub_id: pubId }, token);

export const insertMensaje = (data: Row, token: Token) =>
  db("mensajes", "POST", data, token, "return=representation");

export const updateReseñasNombre = (autorEmail: string, nuevoNombre: string, token: Token) =>
  db(`reseñas?autor_email=eq.${encodeURIComponent(autorEmail)}`, "PATCH", { autor_nombre: nuevoNombre }, token);

export const updatePublicacionesNombre = (autorEmail: string, nuevoNombre: string, token: Token) =>
  db(`publicaciones?autor_email=eq.${encodeURIComponent(autorEmail)}`, "PATCH", { autor_nombre: nuevoNombre }, token);

export const updateMensajesNombre = (email: string, nuevoNombre: string, token: Token) =>
  Promise.all([
    db(`mensajes?de_nombre=eq.${encodeURIComponent(email)}`, "PATCH", { de_nombre: nuevoNombre }, token).catch(() => {}),
  ]);

export const marcarLeidos = (pubId: Id, miEmail: string, token: Token) =>
  db(`mensajes?publicacion_id=eq.${pubId}&para_nombre=eq.${encodeURIComponent(miEmail)}&leido=eq.false`, "PATCH", { leido: true }, token);

// ── Inscripciones ─────────────────────────────────────────────────────────────

export const getInscripciones = (pubId: Id, token: Token) =>
  db(`inscripciones?publicacion_id=eq.${pubId}&order=created_at.desc`, "GET", null, token);

export const getMisInscripciones = (email: string, token: Token) =>
  db(`inscripciones?alumno_email=eq.${encodeURIComponent(email)}&order=created_at.desc`, "GET", null, token);

export const insertInscripcion = (data: Row, token: Token) =>
  db("inscripciones", "POST", data, token, "return=representation");

export const deleteInscripcion = (id: Id, token: Token) =>
  db(`inscripciones?id=eq.${id}`, "DELETE", null, token);

export const getInscripcionByPubEmail = (pubId: Id, email: string, token: Token) =>
  db(`inscripciones?publicacion_id=eq.${pubId}&alumno_email=eq.${encodeURIComponent(email)}`, "GET", null, token);

export const updateInscripcion = (id: Id, data: Row, token: Token) =>
  db(`inscripciones?id=eq.${id}`, "PATCH", data, token, "return=representation");

// ── Contenido curso ───────────────────────────────────────────────────────────

export const getContenido = (pubId: Id, token: Token) =>
  db(`contenido_curso?publicacion_id=eq.${pubId}&order=orden.asc`, "GET", null, token);

export const insertContenido = (data: Row, token: Token) =>
  db("contenido_curso", "POST", data, token, "return=representation");

export const updateContenido = (id: Id, data: Row, token: Token) =>
  db(`contenido_curso?id=eq.${id}`, "PATCH", data, token, "return=representation");

export const deleteContenido = (id: Id, token: Token) =>
  db(`contenido_curso?id=eq.${id}`, "DELETE", null, token);

// ── Favoritos ─────────────────────────────────────────────────────────────────

export const getFavoritos = (email: string, token: Token) =>
  db(`favoritos?usuario_email=eq.${encodeURIComponent(email)}`, "GET", null, token);

export const insertFavorito = (data: Row, token: Token) =>
  db("favoritos", "POST", data, token, "return=representation");

export const deleteFavorito = (id: Id, token: Token) =>
  db(`favoritos?id=eq.${id}`, "DELETE", null, token);

// ── Alertas de exploracion (S2-M1) ───────────────────────────────────────────
// Nota: 'alertas_busquedas' (plural) es una feature distinta — avisa a docentes
// cuando alumnos buscan clases. Estas funciones son para la tabla nueva
// 'alertas_busqueda' (singular) que avisa a alumnos cuando hay clases nuevas.
export const getAlertasBusqueda = (token: Token) =>
  db("alertas_busqueda?order=created_at.desc", "GET", null, token).catch(() => []);

export const insertAlertaExploracion = (data: Row, token: Token) =>
  db("alertas_busqueda", "POST", data, token, "return=representation");

export const deleteAlertaExploracion = (id: Id, token: Token) =>
  db(`alertas_busqueda?id=eq.${id}`, "DELETE", null, token);

// ── Ofertas sobre búsquedas ───────────────────────────────────────────────────

export const getOfertasSobre = (busquedaId: Id, token: Token) =>
  db(`ofertas_busqueda?busqueda_id=eq.${busquedaId}&order=created_at.desc`, "GET", null, token);

export const getOfertasRecibidas = (duenoEmail: string, token: Token) =>
  db(`ofertas_busqueda?busqueda_autor_email=eq.${encodeURIComponent(duenoEmail)}&leida=eq.false&estado=eq.pendiente`, "GET", null, token);

export const getMisOfertas = (email: string, token: Token) =>
  db(`ofertas_busqueda?ofertante_email=eq.${encodeURIComponent(email)}`, "GET", null, token);

export const insertOfertaBusq = (data: Row, token: Token) =>
  db("ofertas_busqueda", "POST", data, token, "return=representation");

export const updateOfertaBusq = (id: Id, data: Row, token: Token) =>
  db(`ofertas_busqueda?id=eq.${id}`, "PATCH", data, token, "return=representation");

export const deleteOfertaBusq = (id: Id, token: Token) =>
  db(`ofertas_busqueda?id=eq.${id}`, "DELETE", null, token);

export const getOfertaAceptada = (busquedaId: Id, ofertanteEmail: string, token: Token) =>
  db(`ofertas_busqueda?busqueda_id=eq.${busquedaId}&ofertante_email=eq.${encodeURIComponent(ofertanteEmail)}&estado=eq.aceptada`, "GET", null, token);

export const getOfertasAceptadasRecibidas = (duenoEmail: string, token: Token) =>
  db(`ofertas_busqueda?busqueda_autor_email=eq.${encodeURIComponent(duenoEmail)}&estado=eq.aceptada`, "GET", null, token);

// ── Denuncias ─────────────────────────────────────────────────────────────────

export const insertDenuncia = (data: Row, token: Token) =>
  db("denuncias", "POST", data, token, "return=representation");

// ── Notificaciones ────────────────────────────────────────────────────────────

export const getNotificaciones = (email: string, token: Token) =>
  db(`notificaciones?alumno_email=eq.${encodeURIComponent(email)}&leida=eq.false&order=created_at.desc`, "GET", null, token);

export const getTodasNotificaciones = (email: string, token: Token) =>
  db(`notificaciones?alumno_email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=60`, "GET", null, token);

export const insertNotificacion = (data: Row, token: Token) =>
  db("notificaciones", "POST", data, token, "return=minimal");

export const marcarNotifLeida = (id: Id, token: Token) =>
  db(`notificaciones?id=eq.${id}`, "PATCH", { leida: true }, token);

export const marcarTodasNotifsLeidas = (email: string, token: Token) =>
  db(`notificaciones?alumno_email=eq.${encodeURIComponent(email)}&leida=eq.false`, "PATCH", { leida: true }, token);

export const marcarNotifsTipoLeidas = (email: string, tipos: string[], token: Token) =>
  db(`notificaciones?alumno_email=eq.${encodeURIComponent(email)}&tipo=in.(${tipos.map(t => encodeURIComponent(t)).join(",")})&leida=eq.false`, "PATCH", { leida: true }, token);

// ── Vistas ────────────────────────────────────────────────────────────────────

export const incrementarVistas = (pubId: Id, token: Token) =>
  rpc("incrementar_vistas", { p_publicacion_id: pubId }, token).catch(() => {});

// ── Documentos / Credenciales ─────────────────────────────────────────────────

export const getDocumentos = (email: string, token: Token) =>
  db(`documentos?usuario_email=eq.${encodeURIComponent(email)}&order=created_at.asc`, "GET", null, token);

export const insertDocumento = (data: Row, token: Token) =>
  db("documentos", "POST", data, token, "return=representation");

export const deleteDocumento = (id: Id, token: Token) =>
  db(`documentos?id=eq.${id}`, "DELETE", null, token);

// ── Verificación IA ───────────────────────────────────────────────────────────

export const getUsuarioByIdFull = (id: Id, token: Token) =>
  db(`usuarios?id=eq.${id}&select=id,email,nombre,display_name,bio,ubicacion,avatar_url,banner_url,titulo_profesional,anios_experiencia,metodologia,idiomas,franja_horaria,linkedin_url,sitio_web`, "GET", null, token)
    .then((r: any) => r?.[0] || null).catch(() => null);

export const getUsuarioById = (id: Id, token: Token) =>
  db(`usuarios?id=eq.${id}&select=id,email,nombre,display_name`, "GET", null, token)
    .then((r: any) => r?.[0] || null).catch(() => null);

export const getUsuarioByEmail = (email: string, token: Token) =>
  db(`usuarios?email=eq.${encodeURIComponent(email)}&select=id,email,nombre,display_name,bio,ubicacion,avatar_url,banner_url,rol,titulo_profesional,anios_experiencia,metodologia,idiomas,franja_horaria,linkedin_url,sitio_web,onboarding_completado,materias_interes`, "GET", null, token)
    .then((r: any) => r?.[0] || null).catch(() => null);

// ── IA helper — llama a la Supabase Edge Function "ai-proxy" ─────────────────

export const callIA = async (system: string, userMsg: string, maxTokens: number = 600, userToken: string = ""): Promise<string> => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${userToken || SUPABASE_KEY}`,
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
  return data.content?.map((c: any) => c.text || "").join("") || "";
};

// Multi-turn: acepta el historial completo como array [{role:"user"|"assistant", content:"..."}]
export const callIAChat = async (system: string, messages: any[], maxTokens: number = 600, userToken: string = ""): Promise<string> => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${userToken || SUPABASE_KEY}`,
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
  return data.content?.map((c: any) => c.text || "").join("") || "";
};

// Ludy usa su propia edge function — el system prompt vive en el servidor
export const callLudy = async (messages: any[], maxTokens: number = 600): Promise<string> => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ludy-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ messages, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  const data = await res.json();
  return data.text || "";
};

export const verificarConIA = async (titulo: string, materia: string, descripcion?: string, respuesta?: string, userToken: string = ""): Promise<any> => {
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

export const getQuizEntregas = (quizId: Id, token: Token) =>
  db(`quiz_entregas?quiz_id=eq.${quizId}&order=created_at.desc`, "GET", null, token).catch(() => []);

export const getMiEntregaQuiz = (quizId: Id, alumnoEmail: string, token: Token) =>
  db(`quiz_entregas?quiz_id=eq.${quizId}&alumno_email=eq.${encodeURIComponent(alumnoEmail)}`, "GET", null, token)
    .then((r: any) => r?.[0] || null).catch(() => null);

export const insertEntregaQuiz = (data: Row, token: Token) =>
  db("quiz_entregas", "POST", data, token, "return=representation");

export const updateEntregaQuiz = (id: Id, data: Row, token: Token) =>
  db(`quiz_entregas?id=eq.${id}`, "PATCH", data, token, "return=representation");

// ── Progreso de módulos ───────────────────────────────────────────────────────

export const getProgresoModulos = (pubId: Id, email: string, token: Token) =>
  db(`progreso_modulos?publicacion_id=eq.${pubId}&alumno_email=eq.${encodeURIComponent(email)}`, "GET", null, token)
    .catch(() => []);

export const upsertProgresoModulo = (data: Row, token: Token) =>
  db("progreso_modulos", "POST", data, token, "return=representation,resolution=merge-duplicates");

// ── Flashcard SRS revisiones ──────────────────────────────────────────────────

export const getFlashcardRevisiones = (contenidoId: Id, email: string, token: Token) =>
  db(`flashcard_revisiones?contenido_id=eq.${contenidoId}&alumno_email=eq.${encodeURIComponent(email)}`, "GET", null, token)
    .catch(() => []);

export const upsertFlashcardRevision = (data: Row, token: Token) =>
  db("flashcard_revisiones", "POST", data, token, "return=representation,resolution=merge-duplicates");

// ── Tracking de materias vistas (para recomendaciones) ───────────────────────

export const trackMateria = (materia: string): void => {
  try {
    const p = JSON.parse(localStorage.getItem("cl_mv") || "{}");
    p[materia] = (p[materia] || 0) + 1;
    localStorage.setItem("cl_mv", JSON.stringify(p));
  } catch {}
};

export const getMateriasFrecuentes = (): string[] => {
  try {
    return Object.entries(JSON.parse(localStorage.getItem("cl_mv") || "{}"))
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
      .map(([m]) => m);
  } catch { return []; }
};

// ── Búsquedas recientes ───────────────────────────────────────────────────────

export const guardarBusqueda = (data: Row, token: Token) =>
  db("busquedas_recientes", "POST", data, token, "return=representation").catch(() => null);

export const getBusquedasRecientes = (usuarioId: Id, token: Token) =>
  db(`busquedas_recientes?usuario_id=eq.${usuarioId}&order=created_at.desc&limit=8`, "GET", null, token)
    .catch(() => []);

// ── Foro ──────────────────────────────────────────────────────────────────────

export const getForoPosts = (pubId: Id, token: Token) =>
  db(`foro_posts?publicacion_id=eq.${pubId}&order=created_at.asc&select=*,respuestas:foro_respuestas(count)`, "GET", null, token)
    .catch(() => []);

export const insertForoPost = (data: Row, token: Token) =>
  db("foro_posts", "POST", data, token, "return=representation");

export const getForoRespuestas = (postId: Id, token: Token) =>
  db(`foro_respuestas?foro_post_id=eq.${postId}&order=created_at.asc`, "GET", null, token)
    .catch(() => []);

export const insertForoRespuesta = (data: Row, token: Token) =>
  db("foro_respuestas", "POST", data, token, "return=representation");

export const deleteForoPost = (id: Id, token: Token) =>
  db(`foro_posts?id=eq.${id}`, "DELETE", null, token);

// ── Clases realizadas ─────────────────────────────────────────────────────────

export const insertClaseRealizada = (data: Row, token: Token) =>
  db('clases_realizadas', 'POST', data, token, 'return=representation');
export const getClasesRealizadas = (email: string, token: Token) =>
  db(`clases_realizadas?or=(docente_email.eq.${encodeURIComponent(email)},alumno_email.eq.${encodeURIComponent(email)})&order=fecha_clase.desc`, 'GET', null, token);
export const confirmarClase = (claseId: Id, userEmail: string, token: Token) =>
  rpc('confirmar_clase', { p_clase_id: claseId, p_usuario_email: userEmail }, token);

// ── Publicaciones por IDs ─────────────────────────────────────────────────────

export const getPublicacionesByIds = (ids: Id[], token: Token) => {
  if (!ids || !ids.length) return Promise.resolve([]);
  const filter = ids.map(id => `id.eq.${id}`).join(",");
  return db(`publicaciones_con_autor?or=(${filter})&select=*`, "GET", null, token).catch(() => []);
};

// ── Skills ────────────────────────────────────────────────────────────────────

export const getSkillsDB = (pubId: Id, token: Token) =>
  db(`skills?publicacion_id=eq.${pubId}&order=orden.asc`, "GET", null, token).catch(() => []);

export const upsertSkill = (data: Row, token: Token) =>
  db("skills", "POST", data, token, "return=representation");

export const updateSkill = (id: Id, data: Row, token: Token) =>
  db(`skills?id=eq.${id}`, "PATCH", data, token, "return=representation");

export const deleteSkill = (id: Id, token: Token) =>
  db(`skills?id=eq.${id}`, "DELETE", null, token);

// ── User Skill Levels ─────────────────────────────────────────────────────────

export const getMySkillLevels = (email: string, pubId: Id, token: Token) =>
  db(`user_skill_levels?select=*,skills!inner(publicacion_id)&usuario_email=eq.${encodeURIComponent(email)}&skills.publicacion_id=eq.${pubId}`, "GET", null, token)
    .catch(() => []);

export const getSkillLevelsByPub = (pubId: Id, token: Token) =>
  db(`user_skill_levels?select=*,skills!inner(publicacion_id)&skills.publicacion_id=eq.${pubId}`, "GET", null, token)
    .catch(() => []);

export const upsertSkillLevel = (data: Row, token: Token) =>
  db("user_skill_levels", "POST", data, token, "return=representation,resolution=merge-duplicates");

// ── Evaluaciones formales ─────────────────────────────────────────────────────

// Lee evaluaciones via RPC SECURITY DEFINER: el dueño recibe el contenido completo,
// el alumno recibe el contenido sin respuestas (correcta/correctas/explicacion).
export const getEvaluaciones = (pubId: Id, token: Token) =>
  rpc("get_evaluaciones_pub", { p_pub_id: pubId }, token).catch(() => []);

export const insertEvaluacion = (data: Row, token: Token) =>
  db("evaluaciones", "POST", data, token, "return=representation");

export const updateEvaluacion = (id: Id, data: Row, token: Token) =>
  db(`evaluaciones?id=eq.${id}`, "PATCH", data, token, "return=representation");

export const deleteEvaluacion = (id: Id, token: Token) =>
  db(`evaluaciones?id=eq.${id}`, "DELETE", null, token);

export const getEvaluacionEntregas = (evalId: Id, token: Token) =>
  db(`evaluacion_entregas?evaluacion_id=eq.${evalId}&order=created_at.desc`, "GET", null, token).catch(() => []);

export const getMiEntregaEval = (evalId: Id, email: string, token: Token) =>
  db(`evaluacion_entregas?evaluacion_id=eq.${evalId}&alumno_email=eq.${encodeURIComponent(email)}`, "GET", null, token).catch(() => []);

// La entrega se hace via RPC SECURITY DEFINER: el server deriva el email del alumno
// (no spoofeable), corrige el multiple_choice del lado servidor y guarda score_auto.
export const insertEvaluacionEntrega = (data: Row, token: Token) =>
  rpc("entregar_evaluacion", {
    p_eval_id: data.evaluacion_id,
    p_respuesta_json: data.respuesta_json,
  }, token).then((row: any) => (row ? [row] : []));

export const updateEvaluacionEntrega = (id: Id, data: Row, token: Token) =>
  db(`evaluacion_entregas?id=eq.${id}`, "PATCH", data, token, "return=representation");

// ── Emails con Resend (via Edge Function send-email) ──────────────────────────

export const sendEmail = async (template: string, to: string, data: Row = {}, token: string = ""): Promise<any> => {
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

// ── Web Push (via Edge Function send-push) ────────────────────────────────────

// token (6º parámetro) = session.access_token del usuario que dispara la notificación.
// Es obligatorio — sin JWT de usuario la función rechaza la llamada para evitar spam.
export const sendPush = async (to: string | string[], title: string, body: string, url: string = "/", tag: string = "default", token?: Token): Promise<void> => {
  if (!token) return; // sin sesión activa no enviar
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ to, title, body, url, tag }),
    });
  } catch {}
};

// ── Mercado Pago ──────────────────────────────────────────────────────────────

export const createMPCheckout = async (data: Row, token: Token): Promise<any> => {
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

export const getMisPagos = (email: string, token: Token) =>
  db(`pagos?alumno_email=eq.${encodeURIComponent(email)}&order=created_at.desc`, "GET", null, token).catch(() => []);

// S2-C2: verificar si un docente tiene MP Connect activo (SECURITY DEFINER bypassea RLS)
export const getDocenteMPConnected = (email: string, token: Token) =>
  db(`rpc/get_docente_mp_connected`, "POST", { p_email: email }, token)
    .then((r: any) => r === true || r === "true")
    .catch(() => null); // null = desconocido, no bloquear

// Libera el pago retenido de un paquete de clases una vez que ambas partes confirman
export const liberarPagoClase = async (claseId: Id, token: Token): Promise<any> => {
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

// ── Verificaciones docente (KYC) ──────────────────────────────────────────────

// Redimensiona y comprime una imagen en el cliente antes de subirla (ahorra ancho
// de banda y storage, mejora LCP). Devuelve {body,type,ext}; ante cualquier fallo
// usa el archivo original sin romper la subida.
const resizeImage = (file: File, maxDim: number, quality: number = 0.85): Promise<{ body: Blob | File; type: string; ext: string }> => new Promise((resolve) => {
  const fallback = () => {
    const ext = (file.name?.split(".").pop() || "jpg").toLowerCase().replace("jpeg", "jpg");
    resolve({ body: file, type: file.type || "image/jpeg", ext });
  };
  try {
    if (!file?.type?.startsWith("image/") || file.type === "image/gif") { fallback(); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { fallback(); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (blob && blob.size < file.size) resolve({ body: blob, type: "image/webp", ext: "webp" });
        else fallback();
      }, "image/webp", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); fallback(); };
    img.src = url;
  } catch { fallback(); }
});

// Sube avatar/portada vía la edge function `subir-foto`, que usa el service_role
// para escribir en el bucket. Necesario porque el storage-api de este proyecto NO
// valida los JWT de usuario (trata todo como anon → RLS rechaza con 400, incluso
// con token válido y policy abierta; ni un restart lo arregló). La función valida
// la sesión contra gotrue y escribe SOLO en la carpeta propia del usuario.
const uploadFotoFn = async (tipo: "avatar" | "banner", body: Blob | File, type: string, token: Token): Promise<string> => {
  const doReq = (t?: Token) => fetch(`${SUPABASE_URL}/functions/v1/subir-foto`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${t || SUPABASE_KEY}`,
      "apikey": SUPABASE_KEY,
      "Content-Type": type,
      "x-foto-tipo": tipo,
    },
    body,
  });
  let res = await doReq(token);
  // Si el token está vencido, refrescamos y reintentamos una vez.
  if (!res.ok && (res.status === 401 || res.status === 403) && _onSessionRefresh) {
    const s = await _onSessionRefresh();
    if (s?.access_token) res = await doReq(s.access_token);
  }
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data.url;
};

// userId queda por compatibilidad de firma; la función deriva el id del token.
export const uploadAvatar = async (_userId: Id, file: File, token: Token): Promise<string> => {
  const { body, type } = await resizeImage(file, 512);
  return uploadFotoFn("avatar", body, type, token);
};

export const uploadBanner = async (_userId: Id, file: File, token: Token): Promise<string> => {
  const { body, type } = await resizeImage(file, 1280);
  return uploadFotoFn("banner", body, type, token);
};

export const uploadDniFoto = async (userId: Id, file: File, token: Token): Promise<string> => {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/dni_frente_${Date.now()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/dni-fotos/${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": file.type || "image/jpeg",
      "apikey": SUPABASE_KEY,
    },
    body: file,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Upload error ${res.status}`); }
  return `${SUPABASE_URL}/storage/v1/object/sign/dni-fotos/${path}`;
};

export const getSignedDniUrl = async (path: string, token: Token): Promise<string | null> => {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/dni-fotos/${path}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "apikey": SUPABASE_KEY },
    body: JSON.stringify({ expiresIn: 300 }),
  });
  const data = await res.json();
  return data.signedURL ? `${SUPABASE_URL}/storage/v1${data.signedURL}` : null;
};

export const getVerificacionesPendientes = (token: Token) =>
  db("verificaciones_usuario?estado=eq.pendiente&order=created_at.asc&select=*,usuarios!verificaciones_usuario_usuario_id_fkey(nombre,email,avatar_url)", "GET", null, token).catch(() => []);

export const getPagosDocente = (email: string, token: Token) =>
  db(`pagos?docente_email=eq.${encodeURIComponent(email)}&order=created_at.desc`, "GET", null, token).catch(() => []);

// Pagos con info de escrow para el dashboard del docente
export const getPagosDocenteEscrow = (email: string, token: Token) =>
  db(`pagos?docente_email=eq.${encodeURIComponent(email)}&estado=eq.approved&select=id,monto,estado_escrow,clase_finalizada_at,liberado_at,alumno_email,publicacion_id,created_at&order=created_at.desc&limit=50`, "GET", null, token).catch(() => []);

// Liquidaciones del docente
export const getLiquidaciones = (email: string, token: Token) =>
  db(`liquidaciones?docente_email=eq.${encodeURIComponent(email)}&order=periodo.desc&limit=24`, "GET", null, token).catch(() => []);

// Lee un valor de la tabla config (ej: "comision_pct")
export const getConfigValor = (clave: string, token: Token) =>
  db(`config?clave=eq.${encodeURIComponent(clave)}&select=valor`, "GET", null, token)
    .then((rows: any) => rows?.[0]?.valor ?? null)
    .catch(() => null);

// Genera una URL firmada (1hs) para descargar el PDF de una liquidación
// Path en Storage: "{docente_email}/{periodo}.pdf"
export const getLiquidacionSignedUrl = async (docenteEmail: string, periodo: string, token: Token): Promise<string | null> => {
  const path = `${docenteEmail}/${periodo}.pdf`;
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/liquidaciones/${encodeURIComponent(path)}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token || SUPABASE_KEY}`,
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 3600 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.signedURL ? `${SUPABASE_URL}${data.signedURL}` : null;
  } catch {
    return null;
  }
};

// ── Streak / Racha ────────────────────────────────────────────────────────────
// Llama al RPC del servidor para calcular la racha con hora confiable (no manipulable por el cliente)
export const actualizarStreak = (usuarioId: Id, token: Token) =>
  rpc("actualizar_streak", { p_usuario_id: usuarioId }, token);

// ── Alertas de búsquedas por materia ──────────────────────────────────────────

export const getAlertasBusquedas = (email: string, token: Token) =>
  db(`alertas_busquedas?email=eq.${encodeURIComponent(email)}&order=created_at.desc`, 'GET', null, token);

export const insertAlertaBusqueda = (data: Row, token: Token) =>
  db('alertas_busquedas', 'POST', data, token, 'return=representation');

export const updateAlertaBusqueda = (id: Id, data: Row, token: Token) =>
  db(`alertas_busquedas?id=eq.${id}`, 'PATCH', data, token);

export const deleteAlertaBusqueda = (id: Id, token: Token) =>
  db(`alertas_busquedas?id=eq.${id}`, 'DELETE', null, token);

export const getAlertasMatchingMateria = (materia: string, token: Token) =>
  db(`alertas_busquedas?activa=eq.true&materias=cs.{${encodeURIComponent(materia)}}`, 'GET', null, token);

// ── Métricas docente ──────────────────────────────────────────────────────────

export const getMetricasDocente = (email: string, token: Token) =>
  db(`metricas_docente?autor_email=eq.${encodeURIComponent(email)}`, 'GET', null, token);

// Atómico vía RPC SECURITY DEFINER (incrementar_clicks_contacto): evita la
// race condition del read-modify-write y permite contar el click aunque quien
// lo hace no sea el dueño de la publicación (RLS de UPDATE solo deja al dueño).
export const registrarClickContacto = (pubId: Id, token: Token) =>
  rpc('incrementar_clicks_contacto', { p_publicacion_id: pubId }, token).catch(() => {});

// ── Alertas de publicaciones ──────────────────────────────────────────────────

// ── Faros puzzle helpers ──────────────────────────────────────────────────────

// Returns today's puzzle or null if none exists yet
export const getTodaysPuzzle = (token: Token) => {
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  return db(`puzzles?date=eq.${today}&limit=1`, 'GET', null, token)
    .then((rows: any) => rows?.[0] ?? null);
};

// Returns the user's result for today's puzzle, or null if not solved
export const getTodaysPuzzleResult = (token: Token, puzzleId: Id) =>
  db(`puzzle_results?puzzle_id=eq.${puzzleId}&limit=1`, 'GET', null, token)
    .then((rows: any) => rows?.[0] ?? null);

// Saves the user's result. Silently ignores duplicates (409 conflict).
export const submitPuzzleResult = async (token: Token, puzzleId: Id, timeSeconds: number): Promise<any> => {
  try {
    return await db(
      'puzzle_results',
      'POST',
      { puzzle_id: puzzleId, time_seconds: timeSeconds },
      token,
      'return=representation'
    );
  } catch (e: any) {
    // UNIQUE violation (user solved it already) — not an error for us
    if (e.message?.includes('23505') || e.message?.includes('unique')) return null;
    throw e;
  }
};

// ── Leaderboard & community stats ────────────────────────────────────────────

// {avg_seconds, player_count} for a Faros puzzle (all users, SECURITY DEFINER)
export const getAvgTimeFaros = (token: Token, puzzleId: Id) =>
  rpc('get_avg_time_faros', { p_puzzle_id: puzzleId }, token)
    .then((rows: any) => rows?.[0] ?? null)
    .catch(() => null);

// {avg_seconds, player_count} for a Shikaku date (all users, SECURITY DEFINER)
export const getAvgTimeShikaku = (token: Token, dateStr: string) =>
  rpc('get_avg_time_shikaku', { p_date: dateStr }, token)
    .then((rows: any) => rows?.[0] ?? null)
    .catch(() => null);

// [{pos, nombre, total_score, games_played, best_time, is_me}] — top 10 + current user
export const getLeaderboardFaros = (token: Token, limit: number = 10) =>
  rpc('get_leaderboard_faros', { lim: limit }, token)
    .then((rows: any) => (Array.isArray(rows) ? rows : []))
    .catch(() => []);

export const getLeaderboardShikaku = (token: Token, limit: number = 10) =>
  rpc('get_leaderboard_shikaku', { lim: limit }, token)
    .then((rows: any) => (Array.isArray(rows) ? rows : []))
    .catch(() => []);

// ── Shikaku puzzle helpers ────────────────────────────────────────────────────

// Returns the user's result for a given date, or null if not solved
export const getShikakuResult = (token: Token, dateStr: string) =>
  db(`shikaku_results?puzzle_date=eq.${dateStr}&limit=1`, 'GET', null, token)
    .then((rows: any) => rows?.[0] ?? null)
    .catch(() => null);

// Returns array of puzzle_date strings (last 30) for streak calculation
export const getShikakuStreak = (token: Token) =>
  db('shikaku_results?select=puzzle_date&order=completed_at.desc&limit=30', 'GET', null, token)
    .then((rows: any) => (rows || []).map((r: any) => r.puzzle_date).filter(Boolean))
    .catch(() => []);

// Saves the user's result. Silently ignores duplicates.
export const submitShikakuResult = async (token: Token, dateStr: string, timeSeconds: number): Promise<any> => {
  try {
    return await db(
      'shikaku_results',
      'POST',
      { puzzle_date: dateStr, time_seconds: timeSeconds },
      token,
      'return=representation'
    );
  } catch (e: any) {
    if (e.message?.includes('23505') || e.message?.includes('unique')) return null;
    throw e;
  }
};

export const dispararAlertas = async (pub: Row, token: Token): Promise<void> => {
  try {
    const alertas = await db(
      `alertas_publicacion?activa=eq.true&usuario_id=neq.${pub.autor_id}&select=*`,
      "GET", null, token
    ).catch(() => []);

    if (!alertas?.length) return;

    const pubTexto = `${pub.titulo} ${pub.descripcion || ""} ${pub.materia || ""}`.toLowerCase();

    for (const alerta of alertas) {
      try {
        let criterios: any = {};
        try { criterios = JSON.parse(alerta.criterios_json || "{}"); } catch {}

        const tipoAlerta = alerta.tipo_alerta || "ambos";
        if (tipoAlerta !== "ambos" && pub.tipo !== tipoAlerta) continue;

        let score = 0;

        if (criterios.materia && pub.materia === criterios.materia) score += 4;
        if (criterios.tipo && criterios.tipo !== "cualquiera" && pub.tipo === criterios.tipo) score += 2;
        if (criterios.modalidad && criterios.modalidad !== "cualquiera" && pub.modalidad === criterios.modalidad) score += 1;

        (criterios.palabras_clave || []).forEach((kw: string) => {
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
              50, token || ""
            );
            if (raw.toLowerCase().includes("si")) score += 3;
          } catch {}
        }

        if (score >= 2) {
          // Encolar en digest diario en lugar de enviar email inmediato
          await db("alertas_digest_queue", "POST", {
            usuario_email: alerta.usuario_email,
            usuario_id:    alerta.usuario_id || null,
            pub_id:        pub.id || null,
            pub_titulo:    pub.titulo,
            materia:       pub.materia || null,
            tipo:          pub.tipo === "oferta" ? "Clase/Curso" : "Búsqueda",
            precio:        pub.precio ? `$${Number(pub.precio).toLocaleString("es-AR")}` : null,
            modalidad:     pub.modalidad || null,
            criterio_desc: criterios.resumen || alerta.descripcion || null,
          }, token, "resolution=ignore-duplicates").catch(() => null); // silencioso si falla
        }
      } catch { /* silencioso por alerta */ }
    }
  } catch { /* silencioso */ }
};

// ── Q&A pública en publicaciones ──────────────────────────────────────────────

export const getPreguntasPublicacion = (publicacionId: Id) =>
  db(`preguntas_publicacion?publicacion_id=eq.${publicacionId}&flag_pregunta=eq.false&order=created_at.asc&select=*`);

export const insertPregunta = (data: Row, token: Token) =>
  db("preguntas_publicacion", "POST", data, token, "return=representation");

export const responderPregunta = (preguntaId: Id, respuesta: string, token: Token) =>
  db(`preguntas_publicacion?id=eq.${preguntaId}`, "PATCH",
    { respuesta, respondido_at: new Date().toISOString() }, token, "return=representation");

// ── Alertas contacto externo ──────────────────────────────────────────────────

export const insertAlertaContacto = (data: Row, token: Token) =>
  db("alertas_contacto_externo", "POST", data, token, "return=representation");

export const getAlertasContacto = (soloNoRevisadas: boolean = false, token?: Token) =>
  db(`alertas_contacto_externo?${soloNoRevisadas ? "revisada=eq.false&" : ""}order=created_at.desc&select=*,publicaciones(titulo)`, "GET", null, token);

export const marcarAlertaRevisada = (alertaId: Id, token: Token) =>
  db(`alertas_contacto_externo?id=eq.${alertaId}`, "PATCH", { revisada: true }, token);
