import ReactGA from "react-ga4";

const GA_ID = "G-8736B9HZGL";
const CONSENT_KEY = "cl_cookie_consent";

// Debe llamarse ANTES de initGA para que GA4 respete el estado desde el inicio
export const initConsentMode = () => {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function(){ window.dataLayer.push(arguments); };
  }
  const stored = localStorage.getItem(CONSENT_KEY);
  window.gtag("consent", "default", {
    analytics_storage: stored === "granted" ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
};

export const grantConsent = () => {
  try { localStorage.setItem(CONSENT_KEY, "granted"); } catch {}
  window.gtag?.("consent", "update", { analytics_storage: "granted" });
};

export const denyConsent = () => {
  try { localStorage.setItem(CONSENT_KEY, "denied"); } catch {}
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
};

export const getConsentStatus = () => {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
};

export const initGA = () => {
  ReactGA.initialize(GA_ID);
};

export const trackPage = (pageName) => {
  ReactGA.send({ hitType: "pageview", page: `/${pageName}`, title: pageName });
};

export const trackEvent = (category, action, label) => {
  ReactGA.event({ category, action, label });
};

// ── Identidad ─────────────────────────────────────────────────────────────
export const setUserId = (id) => {
  if (id) ReactGA.set({ user_id: id });
};

export const setUserProperties = ({ rol, city } = {}) => {
  const props = {};
  if (rol) props.rol = rol;
  if (city) props.ciudad = city;
  if (Object.keys(props).length) ReactGA.set(props);
};

// ── Adquisición ────────────────────────────────────────────────────────────
export const trackRegister = () =>
  ReactGA.event({ category: "adquisicion", action: "registro" });

export const trackLogin = (method = "email") =>
  ReactGA.event({ category: "adquisicion", action: "login", label: method });

// ── Exploración ────────────────────────────────────────────────────────────
export const trackSearchIA = (query, materia = "") =>
  ReactGA.event({ category: "exploracion", action: "busqueda_ia", label: materia || query.slice(0, 50) });

export const trackSearchManual = (query) =>
  ReactGA.event({ category: "exploracion", action: "busqueda_manual", label: query.slice(0, 50) });

export const trackFilterApplied = (filtro, valor) =>
  ReactGA.event({ category: "exploracion", action: "filtro_aplicado", label: `${filtro}:${valor}` });

export const trackSeccionExplore = (seccion) =>
  ReactGA.event({ category: "exploracion", action: "cambio_seccion", label: seccion });

// ── Conversión ─────────────────────────────────────────────────────────────
export const trackPostView = (post) =>
  ReactGA.event({ category: "conversion", action: "ver_publicacion", label: `${post.materia || "sin_materia"}|${post.tipo}` });

export const trackPerfilView = () =>
  ReactGA.event({ category: "conversion", action: "ver_perfil" });

export const trackChatStart = (post) =>
  ReactGA.event({ category: "conversion", action: "chat_iniciado", label: post.materia || post.titulo?.slice(0, 40) });

export const trackOfertaEnviada = (post) =>
  ReactGA.event({ category: "conversion", action: "oferta_enviada", label: post.materia || post.titulo?.slice(0, 40) });

export const trackCheckoutStart = (post) =>
  ReactGA.event({ category: "conversion", action: "checkout_iniciado", label: `${post.materia}|${post.precio}` });

export const trackInscripcion = (post) =>
  ReactGA.event({ category: "conversion", action: "inscripcion_completada", label: `${post.materia || "sin_materia"}|${post.modo || post.tipo}` });

// Evento estándar GA4 e-commerce — alimenta el reporte de ingresos automáticamente
export const trackPurchase = (post, precioFinal) => {
  const precio = precioFinal || post.precio || 0;
  ReactGA.event("purchase", {
    transaction_id: `${post.id}_${Date.now()}`,
    value: Number(precio),
    currency: post.moneda || "ARS",
    items: [{
      item_id: post.id,
      item_name: post.titulo,
      item_category: post.materia || "sin_materia",
      item_category2: post.tipo,
      price: Number(precio),
      quantity: 1,
    }],
  });
};

// ── Favoritos ──────────────────────────────────────────────────────────────
export const trackFavoriteAdd = (post) =>
  ReactGA.event({ category: "engagement", action: "favorito_agregado", label: post.materia || post.titulo?.slice(0, 40) });

// ── Docente ────────────────────────────────────────────────────────────────
export const trackPublicacionCreada = (tipo, materia) =>
  ReactGA.event({ category: "docente", action: "publicacion_creada", label: `${tipo}|${materia || "sin_materia"}` });

// ── Engagement ─────────────────────────────────────────────────────────────
export const trackOnboardingComplete = (rol) =>
  ReactGA.event({ category: "engagement", action: "onboarding_completado", label: rol });

export const trackFarosPlay = () =>
  ReactGA.event({ category: "engagement", action: "faros_jugado" });
