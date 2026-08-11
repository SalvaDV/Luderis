import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { C, FONT } from "../shared";

// ─── BARRA DE ACCIONES ────────────────────────────────────────────────────────
// Piezas para una barra de acciones tranquila, con una sola jerarquía visible.
//
// El problema que resuelve: la barra de la clase tenía hasta ocho elementos, cada
// uno de un color distinto (naranja, azul, verde, rojo). Los colores no estaban
// comunicando nada — se usaban solo para diferenciar un botón de otro, y eso
// gasta el significado del color: cuando todo es rojo, nada es urgente. Peor
// todavía, "Cancelar y reembolsar" (irreversible, mueve plata) tenía el mismo
// peso que "Iniciar clase", que se toca todos los días.
//
// Reglas:
//   • Una sola acción principal, rellena con el acento.
//   • Todo lo demás, neutro: borde fino y texto normal. Sin color.
//   • El color queda reservado para ESTADO (en vivo) y para lo destructivo,
//     y lo destructivo vive dentro del menú, no suelto en la barra.
//   • El rol de la persona es contexto, no una acción: va a la izquierda y en
//     tono bajo.

const BASE = {
  borderRadius: 8,
  padding: "6px 13px",
  fontSize: 12,
  fontFamily: FONT,
  fontWeight: 600,
  whiteSpace: "nowrap",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  lineHeight: 1.4,
  transition: "background .15s, border-color .15s, opacity .15s",
};

export function AccionPrimaria({ children, disabled, style, ...props }) {
  return (
    <button disabled={disabled} aria-disabled={disabled} {...props}
      style={{
        ...BASE,
        background: C.accent, color: "#fff", border: "1px solid transparent",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        ...style,
      }}>
      {children}
    </button>
  );
}

// Texto en C.text y no C.muted: a 12px, el gris claro sobre gris claro no llega
// al contraste mínimo de WCAG AA.
export function AccionNeutra({ children, disabled, style, ...props }) {
  return (
    <button disabled={disabled} aria-disabled={disabled} {...props}
      onMouseEnter={e => { e.currentTarget.style.background = C.surfaceAlt || C.bg; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      style={{
        ...BASE,
        background: "transparent", color: C.text,
        border: `1px solid ${C.border}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        ...style,
      }}>
      {children}
    </button>
  );
}

// Estado, no acción decorativa: acá el rojo sí significa algo.
export function AccionEnVivo({ children, style, ...props }) {
  return (
    <button {...props}
      style={{
        ...BASE,
        background: C.danger + "12", color: C.danger,
        border: `1px solid ${C.danger}33`, fontWeight: 700,
        cursor: "pointer", ...style,
      }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.danger, display: "inline-block", animation: "ldVivoPulse 1.2s infinite" }} />
      <style>{"@keyframes ldVivoPulse{0%,100%{opacity:.4}50%{opacity:1}}"}</style>
      {children}
    </button>
  );
}

export function Rol({ children, color }) {
  return (
    <span style={{ fontSize: 12, color: color || C.muted, fontWeight: 500, whiteSpace: "nowrap", marginRight: "auto" }}>
      {children}
    </span>
  );
}

// ─── MENÚ "MÁS" ───────────────────────────────────────────────────────────────
// Lo que se hace una vez —o lo que no tiene vuelta atrás— vive acá adentro.
// `items`: [{ label, onClick, peligro?, oculto? }]
export function MenuMas({ items = [], etiqueta = "Más acciones" }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const visibles = items.filter(i => i && !i.oculto);

  useEffect(() => {
    if (!abierto) return;
    const fuera = e => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    const esc = e => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", esc); };
  }, [abierto]);

  if (!visibles.length) return null;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button onClick={() => setAbierto(v => !v)}
        aria-haspopup="menu" aria-expanded={abierto} aria-label={etiqueta} title={etiqueta}
        onMouseEnter={e => { e.currentTarget.style.background = C.surfaceAlt || C.bg; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        style={{ ...BASE, background: "transparent", color: C.text, border: `1px solid ${C.border}`, padding: "6px 9px", cursor: "pointer" }}>
        <MoreHorizontal size={15} strokeWidth={2.2} />
      </button>
      {abierto && (
        <div role="menu"
          style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 40,
            minWidth: 210, background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, boxShadow: "0 10px 32px rgba(0,0,0,.16)",
            padding: 5, fontFamily: FONT,
          }}>
          {visibles.map((it, i) => (
            <button key={i} role="menuitem"
              onClick={() => { setAbierto(false); it.onClick?.(); }}
              disabled={it.disabled}
              onMouseEnter={e => { e.currentTarget.style.background = it.peligro ? C.danger + "10" : (C.surfaceAlt || C.bg); }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: "transparent", border: "none", borderRadius: 8,
                padding: "9px 11px", cursor: it.disabled ? "not-allowed" : "pointer",
                color: it.peligro ? C.danger : C.text,
                fontSize: 12.5, fontFamily: FONT, fontWeight: 500,
                opacity: it.disabled ? 0.5 : 1, transition: "background .12s",
              }}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
