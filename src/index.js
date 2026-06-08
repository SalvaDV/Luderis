import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

import { captureException, scheduleSentry } from './sentry';
import { initConsentMode, initGA, initClarity, getConsentStatus } from './analytics';
import { register as registerSW } from './serviceWorkerRegistration';

initConsentMode(); // debe ir antes de initGA
initGA();
// Clarity (session recording) solo si el usuario ya consintió en una visita previa
if (getConsentStatus() === 'granted') initClarity();

// Auto-reload once when a new deployment invalidates old JS chunks
window.addEventListener("error", (e) => {
  const msg = e?.message || "";
  if (msg.includes("Loading chunk") || msg.includes("ChunkLoadError")) {
    const key = "chunk_reload_at";
    const last = parseInt(sessionStorage.getItem(key) || "0", 10);
    if (Date.now() - last > 10000) {
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    }
  }
});

const FONT = "'Inter','Segoe UI',sans-serif";

const isChunkError = (err) =>
  err?.message?.includes("Loading chunk") ||
  err?.name === "ChunkLoadError" ||
  err?.message?.includes("Failed to fetch dynamically imported module");

function ErrorFallback({ error, resetError }) {
  if (isChunkError(error)) {
    window.location.reload();
    return null;
  }
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F6F9FF", fontFamily: FONT, padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "40px 32px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(26,110,216,.1)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
        <h2 style={{ color: "#0D1F3C", fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>Algo salió mal</h2>
        <p style={{ color: "#718096", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
          Ocurrió un error inesperado. Ya lo registramos automáticamente. Podés intentar recargar la página.
        </p>
        {error?.message && (
          <div style={{ background: "#FFF5F5", border: "1px solid #FED7D7", borderRadius: 8, padding: "8px 12px", marginBottom: 20, fontSize: 12, color: "#C53030", textAlign: "left", wordBreak: "break-word" }}>
            {error.message}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={resetError}
            style={{ background: "linear-gradient(135deg,#1A6ED8,#2EC4A0)", border: "none", borderRadius: 20, color: "#fff", padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FONT }}>
            Reintentar
          </button>
          <button onClick={() => window.location.reload()}
            style={{ background: "none", border: "1px solid #DDE5F5", borderRadius: 20, color: "#718096", padding: "10px 20px", fontSize: 14, cursor: "pointer", fontFamily: FONT }}>
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
}

// ErrorBoundary propio (sin dependencia de Sentry, para no cargarlo en el path
// crítico). Reporta a Sentry vía el wrapper diferido cuando captura un error.
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.resetError = this.resetError.bind(this);
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { layer: "react" },
      extra: { componentStack: info?.componentStack },
    });
  }
  resetError() {
    this.setState({ error: null });
  }
  render() {
    if (this.state.error) {
      return this.props.fallback({ error: this.state.error, resetError: this.resetError });
    }
    return this.props.children;
  }
}

registerSW();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppErrorBoundary fallback={({ error, resetError }) => <ErrorFallback error={error} resetError={resetError} />}>
        <App />
      </AppErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);

// Cargar Sentry cuando el navegador esté idle (fuera del path crítico).
scheduleSentry();
