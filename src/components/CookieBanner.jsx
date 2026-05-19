import React, { useState } from "react";
import { grantConsent, denyConsent, getConsentStatus } from "../analytics";
import { FONT, LUD } from "../shared";

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => getConsentStatus() === null);

  if (!visible) return null;

  const accept = () => { grantConsent(); setVisible(false); };
  const reject = () => { denyConsent(); setVisible(false); };

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: "#0D1F3C", color: "#fff", fontFamily: FONT,
      padding: "14px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, flexWrap: "wrap",
      boxShadow: "0 -4px 24px rgba(0,0,0,.25)",
    }}>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, flex: 1, minWidth: 200 }}>
        Usamos cookies de análisis para mejorar tu experiencia en Luderis.
        Podés ver nuestra{" "}
        <a href="/privacidad" style={{ color: LUD.teal, textDecoration: "underline" }}>
          política de privacidad
        </a>.
      </p>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button onClick={reject} style={{
          background: "transparent", border: "1px solid rgba(255,255,255,.3)",
          borderRadius: 20, color: "rgba(255,255,255,.7)", padding: "8px 18px",
          fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
          transition: "border-color .15s",
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.7)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.3)"}>
          Rechazar
        </button>
        <button onClick={accept} style={{
          background: LUD.grad, border: "none",
          borderRadius: 20, color: "#fff", padding: "8px 20px",
          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
          boxShadow: "0 2px 10px rgba(26,110,216,.4)",
        }}>
          Aceptar
        </button>
      </div>
    </div>
  );
}
