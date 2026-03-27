/**
 * storage.js — encapsula localStorage/sessionStorage
 *
 * Centralizar aquí evita:
 * - try/catch duplicados en toda la app
 * - acoplamiento directo al navegador (fácil de mockear en tests)
 * - acceso disperso a keys que pueden colisionar
 *
 * NUNCA guardar datos sensibles (tokens reales, contraseñas).
 * El access_token/refresh_token de Supabase sí va acá porque es
 * el patrón estándar de SPAs — la alternativa (httpOnly cookie) 
 * requiere un backend propio.
 */

const PREFIX = "cl_";

// ── Primitivas seguras ─────────────────────────────────────────────────────────

export const local = {
  get: (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
  },
  remove: (key) => {
    try { localStorage.removeItem(PREFIX + key); } catch {}
  },
  // Para strings simples sin serialización JSON
  getString: (key, fallback = "") => {
    try { return localStorage.getItem(PREFIX + key) ?? fallback; } catch { return fallback; }
  },
  setString: (key, value) => {
    try { localStorage.setItem(PREFIX + key, value); } catch {}
  },
};

export const session = {
  get: (key, fallback = null) => {
    try {
      const raw = sessionStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    try { sessionStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
  },
  getString: (key, fallback = "") => {
    try { return sessionStorage.getItem(PREFIX + key) ?? fallback; } catch { return fallback; }
  },
  setString: (key, value) => {
    try { sessionStorage.setItem(PREFIX + key, value); } catch {}
  },
};

// ── Claves con semántica ───────────────────────────────────────────────────────

const KEYS = {
  SESSION:        "session",           // session Supabase completa
  THEME:          "theme",             // "light" | "dark"
  DISPLAY_NAME:   (email) => `dn_${email}`,
  AVATAR_COLOR:   (email) => `avatar_${email}`,
  ONBOARDING:     (email) => `onboard_${email}`,
  MATERIAS_VISTAS: "mv",
  OFERTAS_DESCAR: (email) => `descartadas_${email}`,
  OFERTAS_VISTAS: (email) => `ofertasVistas_${email}`,
  PAGE:           "page",              // página activa (sessionStorage)
  CURSO_TAB:      (pubId) => `ctab_${pubId}`,
  CHAT_SEEN:      (pubId) => `cseen_${pubId}`,
};

export const authStorage = {
  save:  (s)  => local.set(KEYS.SESSION, s),
  load:  ()   => local.get(KEYS.SESSION, null),
  clear: ()   => local.remove(KEYS.SESSION),
};

export const themeStorage = {
  get: ()        => local.getString(KEYS.THEME, "light"),
  set: (theme)   => local.setString(KEYS.THEME, theme),
};

export const profileStorage = {
  getDisplayName: (email) => local.getString(KEYS.DISPLAY_NAME(email), ""),
  setDisplayName: (email, name) => local.setString(KEYS.DISPLAY_NAME(email), name),
  getAvatarColor: (email) => local.getString(KEYS.AVATAR_COLOR(email), ""),
  setAvatarColor: (email, color) => local.setString(KEYS.AVATAR_COLOR(email), color),
  isOnboardingDone: (email) => local.getString(KEYS.ONBOARDING(email), "") === "1",
  setOnboardingDone: (email) => local.setString(KEYS.ONBOARDING(email), "1"),
};

export const materiaStorage = {
  track: (materia) => {
    const p = local.get(KEYS.MATERIAS_VISTAS, {});
    p[materia] = (p[materia] || 0) + 1;
    local.set(KEYS.MATERIAS_VISTAS, p);
  },
  getFrecuentes: () => {
    const p = local.get(KEYS.MATERIAS_VISTAS, {});
    return Object.entries(p).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([m])=>m);
  },
};

export const ofertasStorage = {
  getDescartadas: (email) => local.get(KEYS.OFERTAS_DESCAR(email), []),
  addDescartada: (email, id) => {
    const arr = local.get(KEYS.OFERTAS_DESCAR(email), []);
    local.set(KEYS.OFERTAS_DESCAR(email), [...arr, id]);
  },
  getVistas: (email) => local.get(KEYS.OFERTAS_VISTAS(email), []),
  addVista: (email, id) => {
    const arr = local.get(KEYS.OFERTAS_VISTAS(email), []);
    local.set(KEYS.OFERTAS_VISTAS(email), [...arr, id]);
  },
};

export const navStorage = {
  getPage: () => session.getString(KEYS.PAGE, "explore"),
  setPage: (page) => session.setString(KEYS.PAGE, page),
  getCursoTab: (pubId) => session.getString(KEYS.CURSO_TAB(pubId), "contenido"),
  setCursoTab: (pubId, tab) => session.setString(KEYS.CURSO_TAB(pubId), tab),
  getChatSeen: (pubId) => session.get(KEYS.CHAT_SEEN(pubId), 0),
  setChatSeen: (pubId) => session.set(KEYS.CHAT_SEEN(pubId), Date.now()),
};
