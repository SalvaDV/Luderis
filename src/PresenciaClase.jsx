import React, { useState, useEffect, useRef } from "react";
import { Video, X, Users, UserX } from "lucide-react";
import * as sb from "./supabase";
import { C, FONT, tx } from "./shared";

// ─── BARRA DE PRESENCIA ──────────────────────────────────────────────────────
// Mientras está montada, late cada 60 s contra presencia_ping. Vive en App para
// sobrevivir a la navegación: si el alumno se va a mirar otra pantalla en el
// medio de la clase, su presencia no se corta.
//
// Lo que se mide NO es este cronómetro sino el solapamiento con la otra parte,
// que calcula el servidor. Por eso la barra muestra si el otro está conectado:
// es el dato que de verdad define cuánto se va a poder cobrar.

const LATIDO_MS = 60000;

export function BarraPresencia({ pubId, titulo, session, onSalir, auto = false }) {
  const [otros, setOtros] = useState(0);
  const [error, setError] = useState("");
  const [ahora, setAhora] = useState(Date.now());
  const desdeRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // Latido
  useEffect(() => {
    if (!pubId || !session?.access_token) return;
    let vivo = true;
    const latir = async () => {
      try {
        const r = await sb.presenciaPing(pubId, session.access_token);
        if (!vivo) return;
        if (r?.error) { setError(r.error); return; }
        setError("");
        if (r.desde && !desdeRef.current) desdeRef.current = new Date(r.desde).getTime();
        setOtros(Number(r.otros_presentes || 0));
      } catch { /* un latido perdido no corta la clase: lo cubre el siguiente */ }
    };
    latir();
    const id = setInterval(latir, LATIDO_MS);
    const alCerrarPestana = () => sb.presenciaCerrarAlSalir(pubId, session.access_token);
    window.addEventListener("pagehide", alCerrarPestana);
    return () => {
      vivo = false;
      clearInterval(id);
      window.removeEventListener("pagehide", alCerrarPestana);
      sb.presenciaCerrar(pubId, session.access_token).catch(() => {});
    };
  }, [pubId, session]);

  // Cronómetro visible
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const seg = desdeRef.current ? Math.max(0, Math.floor((ahora - desdeRef.current) / 1000)) : 0;
  const hh = Math.floor(seg / 3600), mm = Math.floor((seg % 3600) / 60), ss = seg % 60;
  const reloj = (hh > 0 ? `${hh}:` : "") + `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  const acompanado = otros > 0;

  // En modo automático el latido corre igual, pero no se muestra nada hasta que
  // aparece la otra parte: mientras estés solo mirando el contenido no medís
  // nada y no tiene sentido ocupar pantalla diciéndolo.
  if (auto && !acompanado && !error) return null;

  return (
    <div role="status" aria-live="polite"
      style={{
        position: "fixed", left: "50%", transform: "translateX(-50%)",
        bottom: isMobile ? 76 : 18, zIndex: 690,
        width: isMobile ? "calc(100vw - 24px)" : "auto", maxWidth: 460,
        background: C.card, border: `1px solid ${acompanado ? C.success + "55" : C.border}`,
        borderRadius: 14, boxShadow: "0 8px 28px rgba(0,0,0,.18)",
        padding: "10px 12px", display: "flex", alignItems: "center", gap: 10,
        fontFamily: FONT,
      }}>
      {/* keyframes propias: `pulse` solo está declarada en la pantalla de auth */}
      <style>{"@keyframes ldPresenciaPulse{0%,100%{opacity:.45}50%{opacity:1}}"}</style>
      <span style={{
        width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
        background: acompanado ? C.success : C.warn,
        animation: "ldPresenciaPulse 1.4s infinite",
      }} />
      <span style={{ display: "inline-flex", color: C.accent, flexShrink: 0 }}>
        <Video size={16} strokeWidth={2} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ ...tx("cardTitle"), color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          En clase · {reloj}
        </div>
        <div style={{ ...tx("micro"), color: error ? C.danger : (acompanado ? C.successText : C.muted), display: "flex", alignItems: "center", gap: 4 }}>
          {error ? error : acompanado ? (
            <><Users size={11} strokeWidth={2} />Ambos conectados — se está midiendo</>
          ) : (
            <><UserX size={11} strokeWidth={2} />Esperando a la otra parte</>
          )}
        </div>
      </div>
      <button onClick={onSalir} aria-label="Terminar la clase"
        style={{
          background: "none", border: `1px solid ${C.border}`, borderRadius: 20,
          color: C.muted, padding: "5px 12px", cursor: "pointer", flexShrink: 0,
          fontSize: 11, fontWeight: 700, fontFamily: FONT,
          display: "inline-flex", alignItems: "center", gap: 4,
        }}>
        <X size={12} strokeWidth={2.4} />Terminar
      </button>
      {titulo && <span style={{ display: "none" }}>{titulo}</span>}
    </div>
  );
}

export default BarraPresencia;
