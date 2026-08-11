import React, { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
import * as sb from "../supabase";
import { C, FONT, tx, toast } from "../shared";

// Barra para declarar las horas dictadas, dentro de la propia clase.
//
// Antes esto vivía en la Agenda: un calendario, donde a nadie se le ocurre
// buscar cómo cobrar. Acá el docente ya tiene el contexto (sabe qué clase es y
// a quién se la dio) y el número viene pre-cargado con lo que midió la app.
//
// Solo aplica a clases particulares: los cursos se liberan solos, semana a
// semana, y el servidor rechaza declarar horas sobre ellos.

export default function BarraDeclararHoras({ post, session, esMio, onRegistrada }) {
  const [disp, setDisp] = useState(null);      // horas compradas sin registrar
  const [medido, setMedido] = useState(null);  // minutos que midió la app hoy
  const [horas, setHoras] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [oculta, setOculta] = useState(false);

  const esParticular = post?.modo === "particular";
  const hoyISO = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

  const cargar = useCallback(async () => {
    if (!esMio || !esParticular || !post?.id) return;
    try {
      const [h, m] = await Promise.all([
        sb.horasPorRegistrar(post.id, session.access_token).catch(() => 0),
        sb.minutosMedidos(post.id, hoyISO, session.access_token).catch(() => null),
      ]);
      const hs = Number(h || 0);
      setDisp(hs);
      const min = m?.error ? null : Number(m?.minutos || 0);
      setMedido(min);
      setHoras(min > 0 ? String(Math.min(min / 60, hs)) : "1");
    } catch { /* si falla, la barra simplemente no aparece */ }
  }, [esMio, esParticular, post?.id, session.access_token, hoyISO]);

  useEffect(() => { cargar(); }, [cargar]);

  if (!esMio || !esParticular || oculta || !(disp > 0)) return null;

  const declarar = async () => {
    const h = Number(horas);
    if (!h || h <= 0) { toast("Poné cuántas horas diste", "error"); return; }
    if (h > disp) { toast("Solo quedan " + disp + " h sin registrar", "error"); return; }
    setGuardando(true);
    try {
      const r = await sb.registrarClaseDictada(post.id, hoyISO, session.access_token, h);
      if (r?.error) { toast(r.error, "error", 5000); return; }
      toast("Registraste " + h + " h. El alumno tiene que aprobarlas para que cobres.", "success", 4500);
      cargar();
      if (onRegistrada) onRegistrada();
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setGuardando(false); }
  };

  return (
    <div style={{
      background: C.warn + "10", borderBottom: "1px solid " + C.warn + "33",
      padding: "10px 16px", display: "flex", alignItems: "center",
      gap: 10, flexWrap: "wrap", fontFamily: FONT,
    }}>
      <span style={{ display: "inline-flex", color: C.warn, flexShrink: 0 }}><Clock size={16} strokeWidth={2.2} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ ...tx("cardTitle"), color: C.text }}>
          ¿Diste esta clase? Declarala para cobrar
        </div>
        <div style={{ ...tx("micro"), color: C.muted, marginTop: 1 }}>
          Quedan {disp} h compradas sin registrar
          {medido > 0
            ? " · la app midió " + (medido / 60).toLocaleString("es-AR", { maximumFractionDigits: 2 }) + " h hoy"
            : " · sin registro de presencia hoy"}
        </div>
      </div>
      <input type="number" min="0.25" step="0.25" max={disp} inputMode="decimal" aria-label="Horas dictadas"
        value={horas} onChange={e => setHoras(e.target.value)}
        style={{ width: 72, background: C.surface, border: "1px solid " + C.border, borderRadius: 8, padding: "6px 9px", color: C.text, fontSize: 13, fontFamily: FONT, outline: "none", textAlign: "center", flexShrink: 0 }} />
      <button onClick={declarar} disabled={guardando}
        style={{ background: guardando ? C.border : C.accent, border: "none", borderRadius: 20, color: guardando ? C.muted : "#fff", padding: "7px 16px", cursor: guardando ? "default" : "pointer", fontSize: 12.5, fontWeight: 700, fontFamily: FONT, flexShrink: 0, whiteSpace: "nowrap" }}>
        {guardando ? "Registrando…" : "Declarar y cobrar"}
      </button>
      <button onClick={() => setOculta(true)} aria-label="Ahora no"
        style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12, fontFamily: FONT, flexShrink: 0 }}>
        Ahora no
      </button>
    </div>
  );
}
