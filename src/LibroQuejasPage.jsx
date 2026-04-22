import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const FONT    = "'Inter','Segoe UI',system-ui,sans-serif";
const ACCENT  = "#7B3FBE";
const TEXT    = "#0D1F3C";
const MUTED   = "#6B7A99";
const BORDER  = "#E2E8F0";
const BG      = "#FAFBFF";
const SURFACE = "#FFFFFF";
const SUCCESS = "#2E7D52";
const DANGER  = "#C53030";

// Supabase anon client (solo INSERT público)
const sb = createClient(
  process.env.REACT_APP_SUPABASE_URL || "",
  process.env.REACT_APP_SUPABASE_ANON_KEY || ""
);

const CATEGORIAS = [
  "Pago / Cobro",
  "Clase cancelada o no dictada",
  "Contenido engañoso o incorrecto",
  "Problemas técnicos de la plataforma",
  "Conducta inapropiada de un usuario",
  "Solicitud de devolución no resuelta",
  "Demoras en acreditación",
  "Otro",
];

function genNumero() {
  const year  = new Date().getFullYear();
  const rand  = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LUD-${year}-${rand}`;
}

function Campo({ label, required, children, hint }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
        {label} {required && <span style={{ color: DANGER }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 12, color: MUTED, marginTop: 5, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

const iStyle = {
  width: "100%", padding: "11px 14px",
  border: `1.5px solid ${BORDER}`, borderRadius: 10,
  fontSize: 14, fontFamily: FONT, color: TEXT,
  background: SURFACE, outline: "none",
  transition: "border-color .15s",
  boxSizing: "border-box",
};

function Confirmacion({ numero, email, onNueva }) {
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: "40px 32px", textAlign: "center",
      maxWidth: 520, margin: "0 auto",
      animation: "fadeUp .3s ease",
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginBottom: 8 }}>
        Queja registrada correctamente
      </h2>
      <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
        Enviamos una confirmación a <strong>{email}</strong>.<br/>
        Nuestro equipo la revisará dentro de las <strong>48 horas hábiles</strong>.
      </p>

      <div style={{
        background: "#F3EEFF", border: `1px solid #D4B8FF`,
        borderRadius: 12, padding: "16px 20px", marginBottom: 28,
      }}>
        <div style={{ fontSize: 11, color: "#7B3FBE", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>
          Número de queja
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: ACCENT, letterSpacing: ".04em" }}>
          {numero}
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
          Guardá este número para hacer seguimiento
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={onNueva}
          style={{
            background: ACCENT, color: "#fff", border: "none",
            borderRadius: 10, padding: "12px 24px", fontSize: 14,
            fontWeight: 700, cursor: "pointer", fontFamily: FONT,
          }}>
          Registrar otra queja
        </button>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 4 }}>
          <a href="/ayuda" style={{ fontSize: 13, color: MUTED }}>Centro de ayuda</a>
          <span style={{ color: BORDER }}>·</span>
          <a href="/consumidor" style={{ fontSize: 13, color: MUTED }}>Defensa al Consumidor</a>
          <span style={{ color: BORDER }}>·</span>
          <a href="https://www.coprec.gob.ar" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: MUTED }}>COPREC</a>
        </div>
      </div>
    </div>
  );
}

export default function LibroQuejasPage() {
  const [form, setForm] = useState({
    nombre: "", email: "", rol: "", categoria: "", descripcion: "", referencia: "",
  });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [enviado, setEnviado]   = useState(null); // { numero, email }
  const [apiError, setApiError] = useState("");

  const isMobile = window.innerWidth < 768;

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: "" }));
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim())       e.nombre      = "El nombre es obligatorio";
    if (!form.email.trim())        e.email       = "El email es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email inválido";
    if (!form.rol)                 e.rol         = "Seleccioná tu rol";
    if (!form.categoria)           e.categoria   = "Seleccioná una categoría";
    if (!form.descripcion.trim())  e.descripcion = "Describí la situación";
    else if (form.descripcion.trim().length < 30) e.descripcion = "La descripción debe tener al menos 30 caracteres";
    return e;
  };

  const enviar = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    setApiError("");
    const numero = genNumero();

    const { error } = await sb.from("quejas").insert({
      numero_queja: numero,
      nombre:       form.nombre.trim(),
      email:        form.email.trim().toLowerCase(),
      rol:          form.rol,
      categoria:    form.categoria,
      descripcion:  form.descripcion.trim(),
      referencia:   form.referencia.trim() || null,
    });

    setLoading(false);

    if (error) {
      setApiError("Hubo un error al registrar la queja. Por favor escribinos a contacto@luderis.com.ar.");
      return;
    }

    setEnviado({ numero, email: form.email.trim() });
  };

  const iS = (k) => ({
    ...iStyle,
    borderColor: errors[k] ? DANGER : BORDER,
  });

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FONT, color: TEXT }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: ${ACCENT}; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:none; } }
        input:focus, textarea:focus, select:focus { border-color: ${ACCENT} !important; outline: none; }
      `}</style>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: SURFACE, borderBottom: `1px solid ${BORDER}`,
        boxShadow: "0 1px 8px rgba(0,0,0,.06)",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/" style={{ fontSize: 20, fontWeight: 800, color: ACCENT, letterSpacing: "-.4px", textDecoration: "none" }}>Luderis</a>
            <span style={{ color: BORDER, fontSize: 18 }}>|</span>
            <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>Libro de Quejas</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a href="/ayuda" style={{ fontSize: 13, color: MUTED, padding: "6px 10px", textDecoration: "none" }}>Centro de ayuda</a>
            <a href="/" style={{ fontSize: 13, color: MUTED, padding: "6px 10px", textDecoration: "none" }}>← Volver</a>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "28px 16px" : "40px 24px" }}>

        {/* Título */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: TEXT, marginBottom: 8 }}>
            📋 Libro de Quejas
          </h1>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, maxWidth: 600 }}>
            Registrá formalmente tu queja. Tu reclamo quedará registrado en nuestro sistema
            y recibirás un número de seguimiento. Nos comprometemos a responderte
            dentro de las <strong>48 horas hábiles</strong>.
          </p>
        </div>

        {enviado ? (
          <Confirmacion numero={enviado.numero} email={enviado.email}
            onNueva={() => { setEnviado(null); setForm({ nombre:"",email:"",rol:"",categoria:"",descripcion:"",referencia:"" }); }} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 32, alignItems: "start" }}>

            {/* Formulario */}
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: isMobile ? "24px 20px" : "32px" }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 24 }}>Datos del reclamo</h2>

              <Campo label="Nombre completo" required>
                <input value={form.nombre} onChange={e => set("nombre", e.target.value)}
                  placeholder="Tu nombre y apellido" style={iS("nombre")} />
                {errors.nombre && <div style={{ fontSize: 12, color: DANGER, marginTop: 4 }}>{errors.nombre}</div>}
              </Campo>

              <Campo label="Email" required hint="Te enviamos la confirmación y el número de seguimiento a este email.">
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="tu@email.com" style={iS("email")} />
                {errors.email && <div style={{ fontSize: 12, color: DANGER, marginTop: 4 }}>{errors.email}</div>}
              </Campo>

              <Campo label="¿Sos alumno o docente?" required>
                <select value={form.rol} onChange={e => set("rol", e.target.value)} style={iS("rol")}>
                  <option value="">Seleccioná una opción</option>
                  <option value="alumno">Alumno</option>
                  <option value="docente">Docente</option>
                  <option value="otro">Otro</option>
                </select>
                {errors.rol && <div style={{ fontSize: 12, color: DANGER, marginTop: 4 }}>{errors.rol}</div>}
              </Campo>

              <Campo label="Categoría de la queja" required>
                <select value={form.categoria} onChange={e => set("categoria", e.target.value)} style={iS("categoria")}>
                  <option value="">Seleccioná una categoría</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.categoria && <div style={{ fontSize: 12, color: DANGER, marginTop: 4 }}>{errors.categoria}</div>}
              </Campo>

              <Campo label="Descripción del problema" required hint="Cuanto más detallada sea tu descripción, más rápido podemos ayudarte. Mínimo 30 caracteres.">
                <textarea
                  value={form.descripcion}
                  onChange={e => set("descripcion", e.target.value)}
                  placeholder="Describí lo que ocurrió con el mayor detalle posible: qué pasó, cuándo, con qué publicación o docente, qué intentaste hacer para resolverlo…"
                  rows={6}
                  style={{ ...iS("descripcion"), resize: "vertical", lineHeight: 1.6 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  {errors.descripcion
                    ? <div style={{ fontSize: 12, color: DANGER }}>{errors.descripcion}</div>
                    : <div />}
                  <div style={{ fontSize: 11, color: form.descripcion.length < 30 ? DANGER : MUTED }}>
                    {form.descripcion.length} / 30 mín.
                  </div>
                </div>
              </Campo>

              <Campo label="Número de transacción o referencia" hint="Opcional. Si tenés el ID de tu pago o la URL de la publicación, pegalo acá.">
                <input value={form.referencia} onChange={e => set("referencia", e.target.value)}
                  placeholder="Ej: MP-123456789 o https://luderis.com.ar/curso/..." style={iS("referencia")} />
              </Campo>

              {apiError && (
                <div style={{
                  background: "#FFF5F5", border: `1px solid #FEB2B2`,
                  borderRadius: 10, padding: "12px 16px",
                  fontSize: 14, color: DANGER, marginBottom: 16, lineHeight: 1.5,
                }}>{apiError}</div>
              )}

              <button
                onClick={enviar}
                disabled={loading}
                style={{
                  width: "100%", background: loading ? MUTED : ACCENT,
                  color: "#fff", border: "none", borderRadius: 12,
                  padding: "14px", fontSize: 15, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: FONT, transition: "opacity .15s",
                }}>
                {loading ? "Registrando…" : "📋 Registrar queja"}
              </button>

              <p style={{ fontSize: 12, color: MUTED, marginTop: 12, lineHeight: 1.6, textAlign: "center" }}>
                Al enviar, aceptás nuestros{" "}
                <a href="/terminos">Términos y Condiciones</a> y la{" "}
                <a href="/devoluciones">Política de Devoluciones</a>.
              </p>
            </div>

            {/* Panel lateral info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Proceso */}
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, marginBottom: 14 }}>¿Qué pasa después?</div>
                {[
                  { n: "1", t: "Recibís confirmación", d: "Te enviamos el número de queja a tu email inmediatamente." },
                  { n: "2", t: "Revisión del caso", d: "Nuestro equipo analiza la situación en hasta 48 hs hábiles." },
                  { n: "3", t: "Te contactamos", d: "Te respondemos con una solución o pedimos más información." },
                  { n: "4", t: "Resolución", d: "Trabajamos para resolver el problema de forma justa para ambas partes." },
                ].map(p => (
                  <div key={p.n} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: "linear-gradient(135deg,#7B3FBE,#1A6ED8)",
                      color: "#fff", fontSize: 11, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>{p.n}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{p.t}</div>
                      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{p.d}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Escalar a organismos */}
              <div style={{ background: "#FFFBEB", border: `1px solid #FDE68A`, borderRadius: 14, padding: "18px" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#92400E", marginBottom: 10 }}>
                  ¿Querés escalar el reclamo?
                </div>
                <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.65, marginBottom: 12 }}>
                  Si no recibís respuesta en el plazo indicado, podés recurrir a organismos oficiales.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <a href="/consumidor" style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>
                    ⚖️ Defensa al Consumidor →
                  </a>
                  <a href="https://www.coprec.gob.ar" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>
                    🏛️ Conciliación COPREC →
                  </a>
                  <a href="https://www.argentina.gob.ar/libro-de-quejas-digital" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>
                    📋 Libro de Quejas oficial →
                  </a>
                </div>
              </div>

              {/* Contacto directo */}
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: TEXT, marginBottom: 8 }}>Contacto directo</div>
                <a href="mailto:contacto@luderis.com.ar"
                  style={{ fontSize: 13, color: ACCENT, fontWeight: 600, display: "block" }}>
                  📧 contacto@luderis.com.ar
                </a>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Respuesta en hasta 48 hs hábiles</div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
