import React, { useState, useEffect } from "react";

const FONT    = "'Inter','Segoe UI',system-ui,sans-serif";
const ACCENT  = "#7B3FBE";
const TEXT    = "#0D1F3C";
const MUTED   = "#6B7A99";
const BORDER  = "#E2E8F0";
const BG      = "#FAFBFF";
const SURFACE = "#FFFFFF";

const SECCIONES = [
  { id: "s1",  titulo: "1. Qué datos recopilamos" },
  { id: "s2",  titulo: "2. Cómo usamos tus datos" },
  { id: "s3",  titulo: "3. Con quién compartimos datos" },
  { id: "s4",  titulo: "4. Tus derechos (ARCO)" },
  { id: "s5",  titulo: "5. Cookies y rastreo" },
  { id: "s6",  titulo: "6. Retención de datos" },
  { id: "s7",  titulo: "7. Seguridad" },
  { id: "s8",  titulo: "8. Transferencias internacionales" },
  { id: "s9",  titulo: "9. Menores de edad" },
  { id: "s10", titulo: "10. Cambios a esta política" },
  { id: "s11", titulo: "11. Contacto y DPO" },
];

const scrollTo = id => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

function Seccion({ id, titulo, children }) {
  return (
    <section id={id} style={{ marginBottom: 48, scrollMarginTop: 90 }}>
      <h2 style={{
        fontSize: 20, fontWeight: 700, color: TEXT,
        borderBottom: `2px solid ${ACCENT}`, paddingBottom: 8,
        marginBottom: 20, display: "inline-block",
      }}>{titulo}</h2>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: TEXT }}>{children}</div>
    </section>
  );
}

const P = ({ children }) => <p style={{ marginBottom: 12 }}>{children}</p>;
const Li = ({ children }) => <li style={{ marginBottom: 8, paddingLeft: 4 }}>{children}</li>;
const Ul = ({ children }) => (
  <ul style={{ paddingLeft: 22, marginBottom: 16, marginTop: 4, listStyle: "disc" }}>{children}</ul>
);

function Badge({ type = "info", children }) {
  const s = {
    info:    { bg: "#F3EEFF", border: "#D4B8FF", color: "#4A1D96" },
    success: { bg: "#ECFDF5", border: "#A7F3D0", color: "#2E7D52" },
    warn:    { bg: "#FFFBEB", border: "#FDE68A", color: "#B45309" },
    neutral: { bg: "#F7FAFC", border: BORDER,    color: MUTED },
  }[type] || {};
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 10, padding: "14px 18px", marginBottom: 16,
      fontSize: 14, lineHeight: 1.7,
    }}>{children}</div>
  );
}

function DatoCard({ categoria, emoji, items, base }) {
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 12, padding: "18px 20px", marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{categoria}</div>
          <div style={{ fontSize: 12, color: MUTED }}>Base legal: {base}</div>
        </div>
      </div>
      <Ul>{items.map((it, i) => <Li key={i}>{it}</Li>)}</Ul>
    </div>
  );
}

function TerceroCard({ nombre, emoji, uso, url }) {
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 12, padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{nombre}</span>
      </div>
      <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.5 }}>{uso}</p>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, color: ACCENT }}>
          Ver política de privacidad →
        </a>
      )}
    </div>
  );
}

function DerechoCard({ emoji, titulo, desc, como }) {
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 12, padding: "16px 18px",
    }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, marginBottom: 4 }}>{titulo}</div>
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, marginBottom: 6 }}>{desc}</div>
          <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>Como ejercerlo: {como}</div>
        </div>
      </div>
    </div>
  );
}

function CookieRow({ nombre, tipo, proposito, duracion }) {
  const colores = { Esencial: "#2E7D52", Analitica: "#1A6ED8", Marketing: "#B45309" };
  return (
    <tr>
      <td style={{ padding: "10px 14px", border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13 }}>{nombre}</td>
      <td style={{ padding: "10px 14px", border: `1px solid ${BORDER}`, fontSize: 12 }}>
        <span style={{
          background: (colores[tipo] || ACCENT) + "18",
          color: colores[tipo] || ACCENT,
          borderRadius: 20, padding: "2px 10px", fontWeight: 700, whiteSpace: "nowrap",
        }}>{tipo}</span>
      </td>
      <td style={{ padding: "10px 14px", border: `1px solid ${BORDER}`, color: MUTED, fontSize: 13 }}>{proposito}</td>
      <td style={{ padding: "10px 14px", border: `1px solid ${BORDER}`, color: MUTED, fontSize: 13, whiteSpace: "nowrap" }}>{duracion}</td>
    </tr>
  );
}

export default function PrivacidadPage() {
  const [activeSection, setActiveSection] = useState("s1");
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    document.title = "Luderis | Privacidad";
    const handler = () => {
      const sections = SECCIONES.map(s => document.getElementById(s.id)).filter(Boolean);
      const scrollY = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].offsetTop <= scrollY) { setActiveSection(sections[i].id); break; }
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
        a { color: ${ACCENT}; }
        @media(max-width:768px){
          .tc-layout { flex-direction: column !important; }
          .tc-sidebar { display: none; }
          .tc-sidebar.open { display: block !important; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 200; background: ${SURFACE}; overflow-y: auto; padding: 24px; }
        }
      `}</style>

      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: SURFACE, borderBottom: `1px solid ${BORDER}`,
        boxShadow: "0 1px 8px rgba(0,0,0,.06)",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setMenuOpen(v => !v)}
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: TEXT }}>
                ☰
              </button>
            )}
            <a href="/" style={{ fontSize: 20, fontWeight: 800, color: ACCENT, letterSpacing: "-.4px", textDecoration: "none" }}>Luderis</a>
            <span style={{ color: BORDER, fontSize: 18 }}>|</span>
            <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>Privacidad</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a href="/terminos" style={{ fontSize: 12, color: MUTED, padding: "6px 10px", display: isMobile ? "none" : "inline", textDecoration: "none" }}>T&C</a>
            <a href="/" style={{
              fontSize: 13, color: ACCENT, fontWeight: 600,
              padding: "6px 14px", border: `1px solid ${ACCENT}`,
              borderRadius: 20, textDecoration: "none",
            }}>← Volver</a>
          </div>
        </div>
      </header>

      <div className="tc-layout" style={{ display: "flex", maxWidth: 1200, margin: "0 auto", padding: "32px 24px", gap: 40 }}>

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
            borderRadius: 12, padding: "20px 0",
            maxHeight: "calc(100vh - 110px)", overflowY: "auto",
          }}>
            <div style={{ padding: "0 16px 12px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".8px" }}>
              Contenido
            </div>
            {SECCIONES.map(s => (
              <button key={s.id} onClick={() => { scrollTo(s.id); setMenuOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "8px 16px", background: "none", border: "none",
                  cursor: "pointer", fontFamily: FONT, fontSize: 13, lineHeight: 1.4,
                  color: activeSection === s.id ? ACCENT : MUTED,
                  fontWeight: activeSection === s.id ? 600 : 400,
                  borderLeft: `3px solid ${activeSection === s.id ? ACCENT : "transparent"}`,
                  transition: "all .15s",
                }}>{s.titulo}</button>
            ))}
            <div style={{ borderTop: `1px solid ${BORDER}`, margin: "12px 16px 0", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <a href="/terminos"      style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>📄 Terminos y Condiciones</a>
              <a href="/accesibilidad" style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>♿ Accesibilidad</a>
              <a href="/consumidor"    style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>⚖️ Defensa al Consumidor</a>
            </div>
          </div>
        </aside>

        <main style={{ flex: 1, maxWidth: 740 }}>

          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans','Hanken Grotesk',sans-serif", fontSize: 31, fontWeight: 800, color: TEXT, marginBottom: 10, lineHeight: 1.18, letterSpacing: "-.02em" }}>
              Política de Privacidad
            </h1>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 6 }}>
              <strong>Última actualización:</strong> Mayo de 2026
            </p>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>
              <strong>Aplica a:</strong> todos los usuarios de luderis.com.ar
            </p>
            <Badge type="info">
              🔒 Luderis cumple con la <strong>Ley N° 25.326 de Protección de Datos Personales</strong> de
              la República Argentina. Tus datos son tuyos: solo los usamos para brindarte el servicio
              y nunca los vendemos a terceros.
            </Badge>
          </div>

          <Seccion id="s1" titulo="1. Qué datos recopilamos">
            <P>Recopilamos distintos tipos de datos según cómo uses la plataforma:</P>

            <DatoCard
              emoji="👤" categoria="Datos de cuenta"
              base="Ejecución del contrato"
              items={[
                "Nombre completo y email (requeridos para el registro)",
                "Contraseña (almacenada con hash bcrypt, nunca en texto plano)",
                "Foto de perfil (opcional)",
                "Biografía y ubicación (opcionales)",
                "Rol en la plataforma (alumno, docente, ambos)",
              ]}
            />
            <DatoCard
              emoji="🎓" categoria="Datos de actividad"
              base="Ejecución del contrato"
              items={[
                "Publicaciones creadas (cursos, clases, búsquedas)",
                "Inscripciones a clases y cursos",
                "Reseñas y calificaciones enviadas",
                "Mensajes en el chat interno",
                "Favoritos guardados",
              ]}
            />
            <DatoCard
              emoji="💳" categoria="Datos de pago"
              base="Ejecución del contrato / Obligación legal"
              items={[
                "Historial de transacciones (monto, fecha, estado)",
                "Datos bancarios para cobros (docentes): procesados y almacenados por MercadoPago",
                "Luderis NO almacena números de tarjeta ni CVV",
              ]}
            />
            <DatoCard
              emoji="📊" categoria="Datos técnicos"
              base="Interés legítimo"
              items={[
                "Dirección IP y tipo de navegador",
                "Páginas visitadas y tiempo de sesión (via Google Analytics, con tu consentimiento)",
                "Mapas de calor y grabación de sesión anonimizada (via Microsoft Clarity, con tu consentimiento)",
                "Errores y logs (via Sentry, anonimizados)",
                "Preferencias de tema (claro/oscuro) y configuraciones",
              ]}
            />
          </Seccion>

          <Seccion id="s2" titulo="2. Cómo usamos tus datos">
            <P>Usamos tus datos exclusivamente para los siguientes fines:</P>
            <Ul>
              <Li><strong>Brindarte el servicio:</strong> autenticación, publicaciones, inscripciones, pagos y chat.</Li>
              <Li><strong>Personalizar tu experiencia:</strong> recomendaciones de cursos, resultados de búsqueda relevantes.</Li>
              <Li><strong>Mejorar la plataforma:</strong> análisis anónimo de uso para detectar problemas y priorizar mejoras.</Li>
              <Li><strong>Comunicaciones transaccionales:</strong> emails de confirmación, recuperación de contraseña, notificaciones de clases.</Li>
              <Li><strong>Seguridad y prevención de fraude:</strong> detección de comportamientos anómalos o usos indebidos.</Li>
              <Li><strong>Cumplimiento legal:</strong> conservación de registros de transacciones según la normativa fiscal y financiera argentina.</Li>
            </Ul>
            <Badge type="warn">
              No usamos tus datos para publicidad de terceros ni para perfilado automatizado con efectos significativos sobre vos.
            </Badge>
          </Seccion>

          <Seccion id="s3" titulo="3. Con quién compartimos datos">
            <P>
              Solo compartimos datos con terceros en la medida necesaria para brindarte el servicio.
              Todos nuestros proveedores están obligados contractualmente a proteger tus datos:
            </P>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 16 }}>
              <TerceroCard emoji="🗄️" nombre="Supabase"
                uso="Base de datos y autenticación. Almacena todos los datos de la plataforma con encriptación en reposo."
                url="https://supabase.com/privacy" />
              <TerceroCard emoji="💳" nombre="MercadoPago"
                uso="Procesamiento de pagos en pesos argentinos. Maneja datos de tarjeta de forma independiente."
                url="https://www.mercadopago.com.ar/privacidad" />
              <TerceroCard emoji="📊" nombre="Google Analytics (GA4)"
                uso="Analítica de uso de la plataforma: páginas visitadas, duración de sesión, tráfico. Los datos se procesan de forma anónima y agregada."
                url="https://policies.google.com/privacy" />
              <TerceroCard emoji="🎥" nombre="Microsoft Clarity"
                uso="Mapas de calor y grabación de sesión anonimizada para entender cómo se usa la plataforma. Solo se activa con tu consentimiento; los campos sensibles se enmascaran."
                url="https://privacy.microsoft.com/privacystatement" />
              <TerceroCard emoji="🔍" nombre="Sentry"
                uso="Monitoreo de errores en producción. Los datos se anonimizan antes de enviarlos."
                url="https://sentry.io/privacy/" />
              <TerceroCard emoji="📧" nombre="Resend"
                uso="Envío de emails transaccionales (confirmaciones, recuperación de contraseña)."
                url="https://resend.com/privacy" />
              <TerceroCard emoji="🤖" nombre="Anthropic (Claude API)"
                uso="Búsqueda inteligente y verificación de docentes. Solo procesa el texto de búsqueda, sin datos personales identificables."
                url="https://www.anthropic.com/privacy" />
            </div>
            <P>
              Luderis puede divulgar datos personales si es requerido por orden judicial, autoridad
              competente o para cumplir con obligaciones legales vigentes en Argentina.
            </P>
          </Seccion>

          <Seccion id="s4" titulo="4. Tus derechos (ARCO)">
            <P>
              La Ley 25.326 te garantiza los derechos ARCO sobre tus datos personales.
              Podes ejercerlos en cualquier momento escribiendo a{" "}
              <a href="mailto:contacto@luderis.com.ar">contacto@luderis.com.ar</a>:
            </P>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <DerechoCard emoji="👁️" titulo="Acceso"
                desc="Podés solicitar una copia completa de todos los datos personales que tenemos sobre vos."
                como="Email a contacto@luderis.com.ar. Respondemos en 30 días hábiles." />
              <DerechoCard emoji="✏️" titulo="Rectificación"
                desc="Podés corregir datos incorrectos o incompletos. Muchos datos podés editarlos directamente desde Mi cuenta."
                como="Desde Mi cuenta o por email." />
              <DerechoCard emoji="🗑️" titulo="Cancelación (supresión)"
                desc="Podés solicitar la eliminación de tus datos. Algunos datos deben conservarse por obligaciones legales (ej: registros de pagos)."
                como="Desde Mi cuenta o por email. Procesamos en 30 días hábiles." />
              <DerechoCard emoji="🚫" titulo="Oposición"
                desc="Podés oponerte al uso de tus datos para fines específicos (ej: análisis de uso)."
                como="Por email indicando el tratamiento al que te oponés." />
            </div>
            <Badge type="neutral">
              La DNPDP (Dirección Nacional de Protección de Datos Personales) es el organismo
              de control al que podes recurrir si consideras que tus derechos no fueron respetados.
              {" "}<a href="https://www.argentina.gob.ar/aaip/datospersonales" target="_blank" rel="noopener noreferrer">
                argentina.gob.ar/datospersonales
              </a>
            </Badge>
          </Seccion>

          <Seccion id="s5" titulo="5. Cookies y rastreo">
            <P>
              Luderis usa cookies y tecnologías similares para el funcionamiento de la plataforma.
              A continuación el detalle de las cookies que utilizamos:
            </P>
            <div style={{ overflowX: "auto", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F3EEFF" }}>
                    {["Nombre", "Tipo", "Propósito", "Duración"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#4A1D96", fontWeight: 700, border: `1px solid ${BORDER}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <CookieRow nombre="sb-auth-token"  tipo="Esencial"   proposito="Mantiene la sesión iniciada (Supabase Auth)" duracion="7 días" />
                  <CookieRow nombre="luderis-theme"  tipo="Esencial"   proposito="Preferencia de tema (claro/oscuro)" duracion="Persistente" />
                  <CookieRow nombre="luderis-rol"    tipo="Esencial"   proposito="Preferencias de rol de usuario" duracion="Persistente" />
                  <CookieRow nombre="_ga"            tipo="Analitica"  proposito="Google Analytics: distingue usuarios únicos" duracion="2 años" />
                  <CookieRow nombre="_ga_*"          tipo="Analitica"  proposito="Google Analytics: almacena estado de sesión" duracion="2 años" />
                  <CookieRow nombre="_clck / _clsk"  tipo="Analitica"  proposito="Microsoft Clarity: identifica la sesión para mapas de calor y grabación (solo con consentimiento)" duracion="1 año" />
                  <CookieRow nombre="sentry-*"       tipo="Analitica"  proposito="Monitoreo de errores (anonimizado)" duracion="1 año" />
                </tbody>
              </table>
            </div>
            <P>
              No utilizamos cookies de publicidad ni de rastreo entre sitios.
              Podés limpiar las cookies de Luderis desde la configuración de tu navegador en cualquier momento.
            </P>
          </Seccion>

          <Seccion id="s6" titulo="6. Retención de datos">
            <P>Conservamos tus datos durante los siguientes periodos:</P>
            <Ul>
              <Li><strong>Datos de cuenta activa:</strong> mientras la cuenta esté activa.</Li>
              <Li><strong>Tras la eliminación de cuenta:</strong> 30 días en backups, luego se eliminan permanentemente.</Li>
              <Li><strong>Registros de transacciones:</strong> 10 años según la normativa fiscal argentina (Ley 11.683).</Li>
              <Li><strong>Logs de errores:</strong> 90 días (luego son eliminados automáticamente).</Li>
              <Li><strong>Mensajes de chat:</strong> se eliminan junto con la cuenta, salvo que haya una disputa activa.</Li>
            </Ul>
          </Seccion>

          <Seccion id="s7" titulo="7. Seguridad">
            <P>Implementamos las siguientes medidas para proteger tus datos:</P>
            <Ul>
              <Li><strong>Encriptación en tránsito:</strong> toda la comunicación usa TLS 1.2+.</Li>
              <Li><strong>Encriptación en reposo:</strong> los datos en Supabase se almacenan encriptados.</Li>
              <Li><strong>Contraseñas hasheadas:</strong> usamos bcrypt con salt aleatorio.</Li>
              <Li><strong>Row Level Security (RLS):</strong> cada usuario solo puede acceder a sus propios datos en la base de datos.</Li>
              <Li><strong>Tokens de acceso de corta duración:</strong> las sesiones expiran automáticamente por inactividad.</Li>
              <Li><strong>Monitoreo de errores:</strong> Sentry detecta comportamientos anómalos en tiempo real.</Li>
            </Ul>
            <P>
              En caso de una brecha de seguridad que afecte datos personales, notificaremos a los
              usuarios afectados y a la DNPDP dentro de las 72 horas de tener conocimiento del incidente.
            </P>
          </Seccion>

          <Seccion id="s8" titulo="8. Transferencias internacionales">
            <P>
              Algunos de nuestros proveedores operan fuera de Argentina. En esos casos,
              nos aseguramos de que cuenten con garantías adecuadas:
            </P>
            <Ul>
              <Li><strong>Supabase:</strong> servidores en us-east-1 (Virginia, EEUU). Cumple con SOC 2 Type II.</Li>
              <Li><strong>Google Analytics:</strong> opera globalmente con certificaciones de privacidad. Los datos se procesan de forma anónima y agregada.</Li>
              <Li><strong>Sentry:</strong> datos anonimizados antes del envío.</Li>
              <Li><strong>Anthropic:</strong> solo procesa texto de búsqueda, sin datos identificables.</Li>
            </Ul>
            <P>
              Todas las transferencias internacionales se realizan bajo el marco del artículo 12
              de la Ley 25.326 (países con nivel de protección adecuado o con garantías contractuales).
            </P>
          </Seccion>

          <Seccion id="s9" titulo="9. Menores de edad">
            <P>
              Luderis da la bienvenida a estudiantes menores de edad que buscan clases para el colegio
              o la universidad. La Plataforma acepta usuarios a partir de los <strong>13 años</strong>.
            </P>
            <P>
              Los menores de entre 13 y 17 años pueden usar la plataforma únicamente como Alumnos,
              con consentimiento verificable de su representante legal, quien es responsable de
              supervisar el uso de la Plataforma por parte del menor.
            </P>
            <P>
              No recopilamos intencionalmente datos personales de menores de 13 años. Si detectamos
              que un menor de 13 años se registró sin consentimiento parental, eliminaremos la
              cuenta y todos los datos asociados de forma inmediata.
            </P>
          </Seccion>

          <Seccion id="s10" titulo="10. Cambios a esta política">
            <P>
              Podemos actualizar esta Política de Privacidad periódicamente. Cuando los cambios
              sean significativos, te notificaremos con al menos <strong>15 días de anticipación</strong> por email
              y con un aviso destacado en la plataforma.
            </P>
            <P>
              La versión vigente siempre estará disponible en <a href="/privacidad">luderis.com.ar/privacidad</a>.
              El uso continuado de la plataforma tras los cambios implica la aceptación de la nueva política.
            </P>
          </Seccion>

          <Seccion id="s11" titulo="11. Contacto y DPO">
            <P>Para ejercer tus derechos o consultar sobre privacidad:</P>
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { emoji: "📧", label: "Email de privacidad", valor: "contacto@luderis.com.ar", href: "mailto:contacto@luderis.com.ar" },
                  { emoji: "⏱️", label: "Tiempo de respuesta", valor: "30 días hábiles (plazo legal)" },
                  { emoji: "📍", label: "Domicilio", valor: "Ciudad Autónoma de Buenos Aires, Argentina" },
                  { emoji: "⚖️", label: "Organismo de control", valor: "DNPDP — Dirección Nacional de Protección de Datos Personales" },
                ].map(({ emoji, label, valor, href }) => (
                  <div key={label} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 22 }}>{emoji}</span>
                    <div>
                      <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</div>
                      {href
                        ? <a href={href} style={{ fontSize: 15, color: ACCENT, fontWeight: 700 }}>{valor}</a>
                        : <span style={{ fontSize: 14, color: TEXT }}>{valor}</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <a href="https://www.argentina.gob.ar/aaip/datospersonales" target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 13, color: ACCENT, fontWeight: 600,
                padding: "8px 14px", border: `1px solid ${ACCENT}`,
                borderRadius: 20, textDecoration: "none",
              }}>
              🏛️ DNPDP — Organismo de control →
            </a>
          </Seccion>

          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 32, marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 13, color: MUTED }}>© {new Date().getFullYear()} Luderis. Todos los derechos reservados.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
