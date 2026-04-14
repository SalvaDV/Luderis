import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://7048964b77b715c46288eb43fddb4129@o4511175376437248.ingest.us.sentry.io/4511175379517440",
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
});

const FONT = "'Inter','Segoe UI',sans-serif";

function ErrorFallback({ error, resetError }) {
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={({ error, resetError }) => <ErrorFallback error={error} resetError={resetError} />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
