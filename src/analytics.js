import ReactGA from "react-ga4";

const GA_ID = "G-8736B9HZGL";

export const initGA = () => {
  ReactGA.initialize(GA_ID);
};

export const trackPage = (pageName) => {
  ReactGA.send({ hitType: "pageview", page: `/${pageName}`, title: pageName });
};

export const trackEvent = (category, action, label) => {
  ReactGA.event({ category, action, label });
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

// ── Docente ────────────────────────────────────────────────────────────────
export const trackPublicacionCreada = (tipo, materia) =>
  ReactGA.event({ category: "docente", action: "publicacion_creada", label: `${tipo}|${materia || "sin_materia"}` });

// ── Engagement ─────────────────────────────────────────────────────────────
export const trackOnboardingComplete = (rol) =>
  ReactGA.event({ category: "engagement", action: "onboarding_completado", label: rol });

export const trackFarosPlay = () =>
  ReactGA.event({ category: "engagement", action: "faros_jugado" });
