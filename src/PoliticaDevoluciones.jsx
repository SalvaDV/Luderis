import React, { useState, useEffect } from "react";

const FONT = "'Inter','Segoe UI',system-ui,sans-serif";
const ACCENT = "#7B3FBE";
const TEXT = "#0D1F3C";
const MUTED = "#6B7A99";
const BORDER = "#E2E8F0";
const BG = "#FAFBFF";
const SURFACE = "#FFFFFF";
const SUCCESS = "#2E7D52";
const WARN = "#B45309";
const DANGER = "#C53030";

const SECCIONES = [
  { id: "s1",  titulo: "1. Principios Generales" },
  { id: "s2",  titulo: "2. Casos en que aplica una devolución" },
  { id: "s3",  titulo: "3. Casos en que NO aplica una devolución" },
  { id: "s4",  titulo: "4. Cómo solicitar una devolución" },
  { id: "s5",  titulo: "5. Plazos y proceso de revisión" },
  { id: "s6",  titulo: "6. Formas de devolución" },
  { id: "s7",  titulo: "7. Pagos con MercadoPago" },
  { id: "s8",  titulo: "8. Pagos con Stripe" },
  { id: "s9",  titulo: "9. Disputas y mediación" },
  { id: "s10", titulo: "10. Responsabilidad del Docente" },
  { id: "s11", titulo: "11. Abusos del sistema de devoluciones" },
  { id: "s12", titulo: "12. Modificaciones de esta política" },
  { id: "s13", titulo: "13. Contacto" },
];

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Seccion({ id, titulo, children }) {
  return (
    <section id={id} style={{ marginBottom: 48, scrollMarginTop: 90 }}>
      <h2 style={{
        fontSize: 20, fontWeight: 700, color: TEXT,
        borderBottom: `2px solid ${ACCENT}`, paddingBottom: 8,
        marginBottom: 20, display: "inline-block"
      }}>
        {titulo}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: TEXT }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }) {
  return <p style={{ marginBottom: 12 }}>{children}</p>;
}

function Li({ children }) {
  return <li style={{ marginBottom: 8, paddingLeft: 4 }}>{children}</li>;
}

function Ul({ children }) {
  return (
    <ul style={{ paddingLeft: 22, marginBottom: 16, marginTop: 4, listStyle: "disc" }}>
      {children}
    </ul>
  );
}

function Badge({ type, children }) {
  const styles = {
    success: { background: "#ECFDF5", border: `1px solid #A7F3D0`, color: SUCCESS },
    warn:    { background: "#FFFBEB", border: `1px solid #FDE68A`, color: WARN },
    danger:  { background: "#FFF5F5", border: `1px solid #FEB2B2`, color: DANGER },
    info:    { background: "#F3EEFF", border: `1px solid #D4B8FF`, color: "#4A1D96" },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{
      ...s, borderRadius: 10, padding: "14px 18px",
      marginBottom: 16, fontSize: 14, lineHeight: 1.65
    }}>
      {children}
    </div>
  );
}

function TablaPlazos() {
  const rows = [
    { motivo: "Error de la plataforma (cobro duplicado, error técnico)", plazo: "24–48 hs", resultado: "Devolución automática" },
    { motivo: "Clase cancelada por el Docente", plazo: "2–5 días hábiles", resultado: "Devolución completa" },
    { motivo: "Clase no iniciada (sin aviso previo del Docente)", plazo: "2–5 días hábiles", resultado: "Devolución completa" },
    { motivo: "Contenido engañoso verificado", plazo: "5–10 días hábiles", resultado: "Devolución completa o parcial" },
    { motivo: "Acuerdo mutuo entre Alumno y Docente", plazo: "3–7 días hábiles", resultado: "Según lo acordado" },
  ];
  return (
    <div style={{ overflowX: "auto", marginBottom: 16 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F3EEFF" }}>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#4A1D96", fontWeight: 700, border: `1px solid ${BORDER}` }}>Motivo</th>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#4A1D96", fontWeight: 700, border: `1px solid ${BORDER}`, whiteSpace: "nowrap" }}>Plazo estimado</th>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#4A1D96", fontWeight: 700, border: `1px solid ${BORDER}` }}>Resultado esperado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? SURFACE : BG }}>
              <td style={{ padding: "10px 14px", border: `1px solid ${BORDER}`, color: TEXT }}>{r.motivo}</td>
              <td style={{ padding: "10px 14px", border: `1px solid ${BORDER}`, color: TEXT, whiteSpace: "nowrap" }}>{r.plazo}</td>
              <td style={{ padding: "10px 14px", border: `1px solid ${BORDER}`, color: TEXT }}>{r.resultado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PasosContacto() {
  const pasos = [
    { n: "1", titulo: "Contactá a Luderis", desc: 'Enviá un email a contacto@luderis.com.ar con el asunto "Solicitud de devolución".' },
    { n: "2", titulo: "Incluí los datos necesarios", desc: "Email de tu cuenta, nombre de la clase/curso, fecha de pago, monto abonado y motivo detallado de la solicitud." },
    { n: "3", titulo: "Adjuntá evidencia", desc: "Capturas de pantalla, conversaciones del chat interno u otros elementos que respalden tu reclamo (si los tenés)." },
    { n: "4", titulo: "Esperá la confirmación", desc: "Te enviaremos un acuse de recibo dentro de las 48 hs hábiles e iniciaremos el proceso de revisión." },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
      {pasos.map(p => (
        <div key={p.n} style={{
          display: "flex", gap: 14, alignItems: "flex-start",
          background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px"
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7B3FBE,#1A6ED8)",
            color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0
          }}>
            {p.n}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, marginBottom: 4 }}>{p.titulo}</div>
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{p.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PoliticaDevoluciones() {
  const [activeSection, setActiveSection] = useState("s1");
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    document.title = "Política de Devoluciones — Luderis";
    const handler = () => {
      const sections = SECCIONES.map(s => document.getElementById(s.id)).filter(Boolean);
      const scrollY = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].offsetTop <= scrollY) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FONT, color: TEXT }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        a { color: ${ACCENT}; text-decoration: none; }
        a:hover { text-decoration: underline; }
        @media(max-width: 768px) {
          .tc-layout { flex-direction: column !important; }
          .tc-sidebar { display: none; }
          .tc-sidebar.open { display: block !important; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 200; background: ${SURFACE}; overflow-y: auto; padding: 24px; }
          .tc-content { max-width: 100% !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: SURFACE, borderBottom: `1px solid ${BORDER}`,
        boxShadow: "0 1px 8px rgba(0,0,0,.06)"
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button
                onClick={() => setMenuOpen(v => !v)}
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: TEXT, padding: "4px 6px" }}
              >☰</button>
            )}
            <a href="/" style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: ACCENT, letterSpacing: "-.4px" }}>Luderis</span>
            </a>
            <span style={{ color: BORDER, fontSize: 18, margin: "0 4px" }}>|</span>
            <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>Política de Devoluciones</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a href="/terminos" style={{ fontSize: 12, color: MUTED, padding: "6px 10px" }}>
              Términos y Condiciones
            </a>
            <a href="/" style={{
              fontSize: 13, color: ACCENT, fontWeight: 600,
              padding: "6px 14px", border: `1px solid ${ACCENT}`,
              borderRadius: 20, textDecoration: "none"
            }}>
              ← Volver a Luderis
            </a>
          </div>
        </div>
      </header>

      <div className="tc-layout" style={{ display: "flex", maxWidth: 1200, margin: "0 auto", padding: "32px 24px", gap: 40 }}>

        {/* Sidebar */}
        <aside className={`tc-sidebar${menuOpen ? " open" : ""}`} style={{ width: 260, flexShrink: 0 }}>
          {menuOpen && (
            <button onClick={() => setMenuOpen(false)}
              style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: TEXT, marginBottom: 16, display: "block" }}>
              ✕ Cerrar
            </button>
          )}
          <div style={{
            position: isMobile ? "static" : "sticky", top: 80,
            background: SURFACE, border: `1px solid ${BORDER}`,
            borderRadius: 12, padding: "20px 0", maxHeight: "calc(100vh - 110px)", overflowY: "auto"
          }}>
            <div style={{ padding: "0 16px 12px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".8px" }}>
              Contenido
            </div>
            {SECCIONES.map(s => (
              <button key={s.id} onClick={() => { scrollTo(s.id); setMenuOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "8px 16px", background: "none",
                  border: "none", cursor: "pointer", fontFamily: FONT,
                  fontSize: 13, lineHeight: 1.4,
                  color: activeSection === s.id ? ACCENT : MUTED,
                  fontWeight: activeSection === s.id ? 600 : 400,
                  borderLeft: `3px solid ${activeSection === s.id ? ACCENT : "transparent"}`,
                  transition: "all .15s"
                }}>
                {s.titulo}
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${BORDER}`, margin: "12px 16px 0", paddingTop: 12 }}>
              <a href="/terminos" style={{ fontSize: 12, color: MUTED, display: "block", padding: "4px 0" }}>
                📄 Términos y Condiciones
              </a>
            </div>
          </div>
        </aside>

        {/* Contenido */}
        <main className="tc-content" style={{ flex: 1, maxWidth: 740 }}>

          {/* Intro */}
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: TEXT, marginBottom: 10, lineHeight: 1.2 }}>
              Política de Devoluciones y Reembolsos
            </h1>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 6 }}>
              <strong>Última actualización:</strong> Abril de 2026
            </p>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>
              <strong>Aplicable a:</strong> todas las transacciones realizadas en luderis.com.ar
            </p>
            <Badge type="info">
              En Luderis queremos que tanto Alumnos como Docentes tengan una experiencia justa.
              Esta política explica con claridad en qué situaciones se puede solicitar un reembolso,
              cómo hacerlo y qué esperar del proceso. Si tenés alguna duda,
              escribinos a <a href="mailto:contacto@luderis.com.ar">contacto@luderis.com.ar</a>.
            </Badge>
          </div>

          {/* ── S1 ── */}
          <Seccion id="s1" titulo="1. Principios Generales">
            <P>
              Luderis actúa como intermediario tecnológico entre Alumnos y Docentes.
              Los pagos realizados en la Plataforma corresponden a servicios educativos brindados
              directamente por los Docentes, y no por Luderis.
            </P>
            <P>
              Esta política se aplica a todos los pagos procesados a través de la Plataforma,
              ya sea mediante <strong>MercadoPago</strong> o <strong>Stripe</strong>.
              Los pagos realizados fuera de Luderis (en efectivo, transferencia directa u otras vías)
              <strong> no están cubiertos por esta política</strong> y Luderis no puede intervenir en ellos.
            </P>
            <Badge type="warn">
              ⚠️ Te recomendamos siempre realizar los pagos dentro de la plataforma.
              Las transacciones externas no tienen protección de Luderis.
            </Badge>
            <P>
              Las solicitudes de devolución son evaluadas caso por caso por el equipo de Luderis,
              en base a los criterios establecidos en esta política y a la legislación argentina vigente,
              especialmente la <strong>Ley N° 24.240 de Defensa del Consumidor</strong>.
            </P>
          </Seccion>

          {/* ── S2 ── */}
          <Seccion id="s2" titulo="2. Casos en que aplica una devolución">
            <P>Luderis reconoce el derecho a solicitar una devolución en los siguientes casos:</P>

            <h3 style={{ fontSize: 15, fontWeight: 700, color: SUCCESS, margin: "16px 0 8px" }}>✅ Devolución completa</h3>
            <Ul>
              <Li><strong>Clase o curso cancelado por el Docente</strong> sin aviso previo o sin ofrecerle al Alumno una alternativa aceptable.</Li>
              <Li><strong>Clase no iniciada</strong>: el Docente no se presentó y no brindó acceso a los contenidos en el plazo acordado.</Li>
              <Li><strong>Error técnico de la plataforma</strong>: el pago fue procesado pero el Alumno no pudo acceder a la clase por fallas de Luderis.</Li>
              <Li><strong>Cobro duplicado</strong>: se procesaron dos pagos por el mismo concepto.</Li>
              <Li><strong>Derecho de arrepentimiento</strong>: si el pago fue realizado de forma remota (online), el Alumno puede solicitar la devolución dentro de las <strong>72 horas posteriores al pago</strong> y siempre que no haya comenzado a consumir el servicio, conforme al artículo 34 de la Ley N° 24.240.</Li>
            </Ul>

            <h3 style={{ fontSize: 15, fontWeight: 700, color: WARN, margin: "16px 0 8px" }}>🔶 Devolución parcial (a evaluar)</h3>
            <Ul>
              <Li><strong>Contenido engañoso verificado</strong>: la descripción de la clase o curso no corresponde a lo efectivamente dictado, y el Alumno ya cursó parte del contenido.</Li>
              <Li><strong>Interrupción parcial del servicio</strong>: el curso fue suspendido antes de finalizar sin causa justificada por parte del Docente, y ya se había dictado una parte.</Li>
              <Li><strong>Acuerdo mutuo</strong>: Alumno y Docente acuerdan una devolución parcial y lo notifican a Luderis.</Li>
            </Ul>
          </Seccion>

          {/* ── S3 ── */}
          <Seccion id="s3" titulo="3. Casos en que NO aplica una devolución">
            <Badge type="danger">
              ❌ Las siguientes situaciones <strong>no generan derecho a devolución</strong> por parte de Luderis.
            </Badge>
            <Ul>
              <Li>El Alumno asistió a la clase o accedió al contenido del curso y simplemente no le gustó o cambió de opinión.</Li>
              <Li>El Alumno no se presentó a la clase o no accedió al contenido sin aviso previo al Docente.</Li>
              <Li>El Alumno solicitó la devolución más de <strong>14 días corridos</strong> después de la fecha de la clase o del vencimiento del acceso al curso.</Li>
              <Li>La insatisfacción se debe a expectativas personales no mencionadas en la descripción del curso.</Li>
              <Li>El pago fue realizado fuera de la plataforma (efectivo, transferencia directa, etc.).</Li>
              <Li>El curso fue marcado como finalizado por el Docente y aceptado por el Alumno.</Li>
              <Li>El reclamo fue presentado luego de que el Alumno haya dejado una reseña positiva sobre la clase.</Li>
              <Li>Se detectó que el reclamo es fraudulento o abusivo (ver Sección 11).</Li>
            </Ul>
          </Seccion>

          {/* ── S4 ── */}
          <Seccion id="s4" titulo="4. Cómo solicitar una devolución">
            <P>Para iniciar una solicitud de devolución, seguí estos pasos:</P>
            <PasosContacto />
            <Badge type="info">
              📧 Email para solicitudes: <strong>contacto@luderis.com.ar</strong><br/>
              Asunto recomendado: <strong>"Solicitud de devolución — [nombre del curso/clase]"</strong>
            </Badge>
            <P>
              También podés contactarnos directamente desde la sección de <strong>Ayuda</strong> dentro de la aplicación,
              si ya tenés una cuenta activa.
            </P>
          </Seccion>

          {/* ── S5 ── */}
          <Seccion id="s5" titulo="5. Plazos y proceso de revisión">
            <P>
              Una vez recibida la solicitud, Luderis iniciará un proceso de revisión que incluye:
            </P>
            <Ul>
              <Li>Verificación de los datos del pago en el sistema.</Li>
              <Li>Consulta al Docente involucrado (cuando corresponda).</Li>
              <Li>Revisión de las conversaciones del chat interno (si aplica).</Li>
              <Li>Evaluación según los criterios de esta política.</Li>
            </Ul>
            <P>Los plazos estimados según el tipo de reclamo son:</P>
            <TablaPlazos />
            <P style={{ fontSize: 13, color: MUTED }}>
              * Los plazos son estimativos y pueden variar según la complejidad del caso y la disponibilidad de las partes.
              En períodos de alto volumen de solicitudes, los plazos pueden extenderse hasta un máximo de 15 días hábiles.
            </P>
          </Seccion>

          {/* ── S6 ── */}
          <Seccion id="s6" titulo="6. Formas de devolución">
            <P>Las devoluciones aprobadas se realizan siempre por el mismo medio de pago utilizado originalmente:</P>
            <Ul>
              <Li>
                <strong>MercadoPago:</strong> el monto se acredita en el saldo de MercadoPago del Alumno.
                El tiempo de acreditación depende de MercadoPago y puede tardar entre 2 y 15 días hábiles.
              </Li>
              <Li>
                <strong>Stripe:</strong> el monto se devuelve al método de pago original (tarjeta de crédito/débito).
                El tiempo de acreditación depende del banco emisor y puede tardar entre 5 y 10 días hábiles.
              </Li>
            </Ul>
            <P>
              Luderis no puede acreditar devoluciones en medios distintos al utilizado para el pago original,
              ni realizar transferencias bancarias directas como forma de reembolso.
            </P>
            <Badge type="warn">
              Las comisiones de los procesadores de pago (MercadoPago o Stripe) pueden no ser recuperables
              dependiendo de la política de cada proveedor. En esos casos, la devolución será por el monto
              neto recibido por Luderis.
            </Badge>
          </Seccion>

          {/* ── S7 ── */}
          <Seccion id="s7" titulo="7. Pagos con MercadoPago">
            <P>
              Los pagos procesados a través de MercadoPago están sujetos también a las políticas de
              devolución y contracargos de MercadoPago. En caso de disputas iniciadas directamente
              con MercadoPago (contracargo), Luderis cooperará en el proceso pero no garantiza
              el resultado de la disputa.
            </P>
            <P>
              Para operaciones con MercadoPago, recomendamos iniciar primero el reclamo a través de
              Luderis antes de escalar a MercadoPago, ya que un proceso interno puede resolverse más rápido.
            </P>
            <P>
              Los pagos en cuotas solo pueden ser devueltos de forma total, ya que MercadoPago
              no admite devoluciones parciales de pagos en cuotas. Esto puede implicar que el Alumno
              deba continuar abonando cuotas a la tarjeta mientras el reembolso se procesa.
            </P>
          </Seccion>

          {/* ── S8 ── */}
          <Seccion id="s8" titulo="8. Pagos con Stripe">
            <P>
              Los pagos procesados a través de Stripe en moneda extranjera (USD u otras divisas)
              serán devueltos en la misma moneda de origen, al tipo de cambio vigente al momento
              del reembolso. Luderis no se hace responsable por diferencias cambiarias entre la
              fecha del pago y la fecha de la devolución.
            </P>
            <P>
              Los Alumnos que hayan pagado con Stripe también pueden iniciar un proceso de disputa
              (chargeback) directamente con su entidad bancaria o tarjeta. En ese caso, Stripe puede
              suspender temporalmente los fondos mientras dura la disputa, lo que puede afectar el
              pago al Docente.
            </P>
            <P>
              Recomendamos siempre contactar a Luderis primero antes de iniciar un chargeback,
              ya que esto permite una resolución más ágil y evita costos adicionales.
            </P>
          </Seccion>

          {/* ── S9 ── */}
          <Seccion id="s9" titulo="9. Disputas y mediación">
            <P>
              En caso de desacuerdo entre un Alumno y un Docente, Luderis puede actuar como
              mediador para facilitar una solución. El proceso de mediación es:
            </P>
            <Ul>
              <Li>Voluntario para ambas partes, aunque Luderis puede requerirlo como condición para procesar una devolución.</Li>
              <Li>Confidencial: las comunicaciones durante la mediación no serán divulgadas a terceros.</Li>
              <Li>No vinculante: si no se llega a un acuerdo, Luderis tomará una decisión en base a las evidencias disponibles.</Li>
            </Ul>
            <P>
              La decisión final de Luderis sobre una devolución es definitiva dentro del ámbito de
              la plataforma. Los Usuarios conservan siempre el derecho de recurrir a las instancias
              legales correspondientes (organismos de defensa del consumidor, justicia ordinaria).
            </P>
            <P>
              Para reclamos ante organismos de defensa del consumidor en Argentina, podés ingresar a{" "}
              <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" target="_blank" rel="noopener noreferrer">
                www.argentina.gob.ar/defensadelconsumidor
              </a>.
            </P>
          </Seccion>

          {/* ── S10 ── */}
          <Seccion id="s10" titulo="10. Responsabilidad del Docente">
            <P>
              Cuando una devolución se aprueba por causa imputable al Docente (cancelación, no presentación,
              contenido engañoso), Luderis puede:
            </P>
            <Ul>
              <Li>Descontar el monto a reembolsar del saldo pendiente de acreditación al Docente.</Li>
              <Li>Solicitar al Docente que cubra el monto de la devolución si el mismo ya fue acreditado.</Li>
              <Li>Registrar el incidente en el historial del Docente, lo que puede afectar su posicionamiento en la Plataforma.</Li>
              <Li>Suspender temporalmente al Docente si se registran múltiples incidentes en un período corto.</Li>
            </Ul>
            <P>
              Los Docentes serán notificados de cualquier reclamo en su contra y tendrán la oportunidad
              de presentar su versión antes de que Luderis tome una decisión final.
            </P>
          </Seccion>

          {/* ── S11 ── */}
          <Seccion id="s11" titulo="11. Abusos del sistema de devoluciones">
            <P>
              Luderis monitorea el uso del sistema de devoluciones para detectar patrones de abuso.
              Se considera abuso del sistema:
            </P>
            <Ul>
              <Li>Solicitar devoluciones de forma reiterada sin motivo legítimo.</Li>
              <Li>Acceder al contenido de un curso y luego reclamar que no tuvo acceso.</Li>
              <Li>Presentar evidencia falsa o manipulada para sustentar un reclamo.</Li>
              <Li>Coordinar con terceros para realizar reclamos fraudulentos.</Li>
            </Ul>
            <P>
              Los Usuarios que abusen del sistema de devoluciones podrán ser suspendidos de la
              Plataforma de forma temporal o permanente, y Luderis se reserva el derecho de
              iniciar las acciones legales correspondientes.
            </P>
          </Seccion>

          {/* ── S12 ── */}
          <Seccion id="s12" titulo="12. Modificaciones de esta política">
            <P>
              Luderis puede modificar esta Política de Devoluciones en cualquier momento.
              Los cambios significativos serán notificados con al menos <strong>15 (quince) días de anticipación</strong> mediante:
            </P>
            <Ul>
              <Li>Correo electrónico a la dirección registrada en la cuenta.</Li>
              <Li>Aviso destacado dentro de la Plataforma.</Li>
            </Ul>
            <P>
              La política vigente al momento de realizar un pago es la que aplica para ese pago en particular,
              independientemente de modificaciones posteriores.
            </P>
          </Seccion>

          {/* ── S13 ── */}
          <Seccion id="s13" titulo="13. Contacto">
            <P>Para solicitudes de devolución o consultas sobre esta política:</P>
            <div style={{
              background: SURFACE, border: `1px solid ${BORDER}`,
              borderRadius: 12, padding: "20px 24px", marginTop: 12
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📧</span>
                  <div>
                    <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Email</div>
                    <a href="mailto:contacto@luderis.com.ar" style={{ fontSize: 15, color: ACCENT, fontWeight: 600 }}>
                      contacto@luderis.com.ar
                    </a>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>⏱️</span>
                  <div>
                    <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Tiempo de respuesta</div>
                    <span style={{ fontSize: 15, color: TEXT }}>Hasta 48 horas hábiles</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📋</span>
                  <div>
                    <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>También podés consultar</div>
                    <a href="/terminos" style={{ fontSize: 15, color: ACCENT }}>Términos y Condiciones →</a>
                  </div>
                </div>
              </div>
            </div>
          </Seccion>

          {/* Footer */}
          <div style={{
            borderTop: `1px solid ${BORDER}`, paddingTop: 32, marginTop: 16,
            display: "flex", flexDirection: "column", gap: 8
          }}>
            <p style={{ fontSize: 13, color: MUTED }}>
              © {new Date().getFullYear()} Luderis. Todos los derechos reservados.
            </p>
            <p style={{ fontSize: 12, color: MUTED }}>
              Esta política es un borrador con fines informativos y debe ser revisada por un profesional del derecho antes de su publicación oficial.
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
