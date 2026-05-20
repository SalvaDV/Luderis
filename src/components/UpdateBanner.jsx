import React, { useState, useEffect } from "react";
import { FONT, LUD } from "../shared";

export default function UpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener("sw-update-available", handler);
    return () => window.removeEventListener("sw-update-available", handler);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 72, left: "50%", transform: "translateX(-50%)",
      zIndex: 9998, background: "#0D1F3C", color: "#fff", fontFamily: FONT,
      padding: "12px 20px", borderRadius: 12, display: "flex", alignItems: "center",
      gap: 14, boxShadow: "0 4px 24px rgba(0,0,0,.35)", maxWidth: 420, width: "calc(100% - 32px)",
      animation: "fadeSlideUp .25s ease",
    }}>
      <span style={{ fontSize: 20 }}>🚀</span>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4, flex: 1 }}>
        Hay una nueva versión de Luderis disponible.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: LUD.grad, border: "none", borderRadius: 20,
          color: "#fff", padding: "7px 16px", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: FONT, flexShrink: 0,
        }}
      >
        Actualizar
      </button>
    </div>
  );
}
