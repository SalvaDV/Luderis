/**
 * privacy.js — utilidades de privacidad para ClasseLink
 *
 * PRINCIPIOS:
 * 1. Nunca mostrar emails completos de otros usuarios en la UI.
 * 2. Sanitizar mensajes de chat para detectar intentos de compartir
 *    datos de contacto externos (evasión de plataforma).
 * 3. El "safeDisplayName" es la única función que debe usarse
 *    para mostrar el nombre de un usuario en la UI pública.
 *
 * NOTA sobre la sanitización de chat:
 * La sanitización en frontend es solo una capa visual/UX.
 * Para protección real, implementar también en Supabase Edge Functions
 * o triggers de DB. El dato llega a la DB sin sanitizar — eso es
 * intencional para no perder mensajes legítimos (ej: "mi gmail es...")
 * pero sí mostrarlo oculto en la UI.
 */

// ── Enmascaramiento de emails ──────────────────────────────────────────────────

/**
 * Enmascara un email para mostrar solo los primeros 3 caracteres.
 * "juan.perez@gmail.com" → "jua***"
 */
export const maskEmail = (email) => {
  if (!email) return "Usuario";
  const local = email.split("@")[0];
  if (local.length <= 3) return local + "***";
  return local.slice(0, 3) + "***";
};

/**
 * Nombre seguro para mostrar en UI pública.
 * Prioriza: displayName > nombre > parte local del email (enmascarada)
 * NUNCA expone el email completo.
 */
export const safeDisplayName = (nombre, email) => {
  if (nombre && nombre.trim() && !nombre.includes("@")) return nombre.trim();
  if (email) return maskEmail(email);
  return "Usuario";
};

/**
 * Nombre para el propio usuario (puede ver su email completo).
 */
export const ownDisplayName = (email, displayName) => {
  if (displayName && displayName.trim()) return displayName.trim();
  if (email) return email.split("@")[0];
  return "Usuario";
};

// ── Sanitización de contenido libre ───────────────────────────────────────────

/**
 * Regex para detectar:
 * - Emails: usuario@dominio.ext
 * - Teléfonos: +54 9 11 1234-5678, (011) 4123-4567, etc.
 * - Redes sociales: "instagram: @user", "mi wa:", "tg: @user"
 * - WhatsApp links: wa.me/...
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const PHONE_REGEX = /(\+?[\d\s\-().]{7,}[\d])/g;

const SOCIAL_REGEX = /\b(instagram|ig|insta|whatsapp|wsp|wa|telegram|tg|signal|twitter|face|facebook|fb)\s*[:=@\-]?\s*[@]?\w+/gi;

const WALINK_REGEX = /wa\.me\/\d+/gi;

/**
 * Reemplaza datos de contacto en texto libre.
 * Útil para mensajes de chat donde usuarios intentan saltar la plataforma.
 *
 * @param {string} text
 * @returns {string}
 */
export const sanitizeContactInfo = (text) => {
  if (!text || typeof text !== "string") return text;

  return text
    .replace(EMAIL_REGEX, "[📧 email oculto]")
    .replace(WALINK_REGEX, "[📵 link externo oculto]")
    .replace(SOCIAL_REGEX, "[📵 contacto externo oculto]")
    .replace(PHONE_REGEX, (match) => {
      // Solo ocultar si tiene suficientes dígitos para ser un teléfono real
      const digits = match.replace(/\D/g, "");
      if (digits.length >= 7) return "[📵 teléfono oculto]";
      return match; // No es teléfono, probablemente es un número normal
    });
};

/**
 * Versión más agresiva para campos de perfil/bio donde
 * no debería haber datos de contacto externos.
 */
export const sanitizeBio = (text) => {
  if (!text) return text;
  return sanitizeContactInfo(text);
};

// ── Validaciones de input ──────────────────────────────────────────────────────

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() ?? "");

export const isStrongPassword = (pass) =>
  typeof pass === "string" && pass.length >= 8;

// ── Rate limiting simple en cliente ───────────────────────────────────────────
// No reemplaza rate limiting en servidor, pero da feedback inmediato al usuario.

const attempts = {};

export const rateLimiter = {
  /**
   * @param {string} key - identificador de la acción (ej: "login", "sendMessage")
   * @param {number} maxAttempts
   * @param {number} windowMs
   * @returns {boolean} true si está permitido, false si está limitado
   */
  check: (key, maxAttempts = 5, windowMs = 60_000) => {
    const now = Date.now();
    if (!attempts[key]) attempts[key] = [];
    // Limpiar intentos fuera de la ventana
    attempts[key] = attempts[key].filter(t => now - t < windowMs);
    if (attempts[key].length >= maxAttempts) return false;
    attempts[key].push(now);
    return true;
  },
  reset: (key) => { delete attempts[key]; },
};
