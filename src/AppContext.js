import { createContext, useContext } from "react";

// ── Acciones globales de la app, expuestas vía Context ──────────────────────────
// Reemplaza los globals window.__openPub / __openDetail / _openNewPost /
// _resetCuentaBadge, que acoplaban componentes a través del objeto window.
// App.js provee estas acciones; los componentes hijos las consumen con
// useAppActions(). Acoplamiento explícito y rastreable (en vez de oculto).
//
// Acciones disponibles:
//   - openPub(pubId)        → abre la publicación (curso si es oferta, si no detalle)
//   - openDetail(pubId)     → abre siempre el DetailModal (preguntas/respuestas Q&A)
//   - openNewPost()         → abre el formulario de nueva publicación
//   - resetCuentaBadge()    → marca como leídas las notifs de "Mi cuenta"
export const AppActionsContext = createContext(null);

export const useAppActions = () => useContext(AppActionsContext) || {};
