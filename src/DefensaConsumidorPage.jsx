import React, { useState, useEffect } from "react";

const FONT = "'Inter','Segoe UI',system-ui,sans-serif";
const ACCENT = "#7B3FBE";
const TEXT = "#0D1F3C";
const MUTED = "#6B7A99";
const BORDER = "#E2E8F0";
const BG = "#FAFBFF";
const SURFACE = "#FFFFFF";
const SUCCESS = "#2E7D52";
const WARN_C = "#B45309";

const SECCIONES = [
  { id: "s1",  titulo: "1. Tus derechos como consumidor" },
  { id: "s2",  titulo: "2. Cómo reclamar ante Luderis" },
  { id: "s3",  titulo: "3. Organismos oficiales de defensa" },
  { id: "s4",  titulo: "4. COPREC — Conciliación gratuita" },
  { id: "s5",  titulo: "5. Libro de Quejas Digital" },
  { id: "s6",  titulo: "6. Garantías legales" },
  { id: "s7",  titulo: "7. Datos de contacto" },
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

function Badge({ type = "info", children }) {
  const styles = {
    success: { background: "#ECFDF5", border: `1px solid #A7F3D0`, color: SUCCESS },
    warn:    { background: "#FFFBEB", border: `1px solid #FDE68A`, color: WARN_C },
    info:    { background: "#F3EEFF", border: `1px solid #D4B8FF`, color: "#4A1D96" },
    neutral: { background: "#F7FAFC", border: `1px solid ${BORDER}`, color: MUTED },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{ ...s, borderRadius: 10, padding: "14px 18px", marginBottom: 16, fontSize: 14, lineHeight: 1.7 }}>
      {children}
    </div>
  );
}

function PasoReclamo({ n, titulo, desc }) {
  return (
    <div style={{
      display: "flex", gap: 14, alignItems: "flex-start",
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 12, padding: "16px 18px"
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%",
        background: "linear-gradient(135deg,#7B3FBE,#1A6ED8)",
        color: "#fff", fontSize: 14, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>{n}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, marginBottom: 4 }}>{titulo}</div>
        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

function OrganismoCard({ emoji, nombre, desc, url, urlLabel }) {
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 24 }}>{emoji}</span>
        <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{nombre}</div>
      </div>
      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: 0 }}>{desc}</p>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 13, color: ACCENT, fontWeight: 600, marginTop: 4
          }}>
          {urlLabel || url} →
        </a>
      )}
    </div>
  );
}

function BotonesOficiales() {
  const botones = [
    {
      emoji: "🏛️",
      label: "Presentar reclamo ante\nDefensa al Consumidor",
      url: "https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario",
      color: "#1A6ED8",
    },
    {
      emoji: "⚖️",
      label: "Iniciar conciliación\nen COPREC",
      url: "https://www.coprec.gob.ar",
      color: "#2E7D52",
    },
    {
      emoji: "📋",
      label: "Libro de Quejas\nDigital",
      url: "https://www.argentina.gob.ar/libro-de-quejas-digital",
      color: "#7B3FBE",
    },
  ];
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
      {botones.map(b => (
        <a
          key={b.label}
          href={b.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: "1 1 180px", minWidth: 160,
            background: b.color, color: "#fff",
            borderRadius: 12, padding: "16px 18px",
            display: "flex", flexDirection: "column", gap: 8,
            textDecoration: "none", transition: "opacity .2s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <span style={{ fontSize: 26 }}>{b.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, whiteSpace: "pre-line" }}>{b.label}</span>
        </a>
      ))}
    </div>
  );
}

function DerechosGrid() {
  const derechos = [
    { emoji: "📋", titulo: "Información clara", desc: "Tenés derecho a recibir información veraz, detallada y suficiente sobre los servicios que contratás." },
    { emoji: "💰", titulo: "Precio transparente", desc: "El precio informado en la plataforma es el precio final. No pueden existir cargos ocultos." },
    { emoji: "↩️", titulo: "Arrepentimiento", desc: "Podés cancelar una compra online dentro de las 72 hs sin necesidad de dar ninguna explicación (art. 34, Ley 24.240)." },
    { emoji: "🔒", titulo: "Datos personales", desc: "Tus datos no pueden ser cedidos sin tu consentimiento (Ley 25.326 de Protección de Datos Personales)." },
    { emoji: "⚖️", titulo: "Trato digno", desc: "Tenés derecho a ser tratado con respeto y sin discriminación en todas las interacciones con la plataforma." },
    { emoji: "📣", titulo: "Reclamo gratuito", desc: "Podés presentar un reclamo ante Luderis o ante organismos públicos sin costo alguno." },
  ];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 12, marginBottom: 20
    }}>
      {derechos.map(d => (
        <div key={d.titulo} style={{
          background: SURFACE, border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: "16px 16px"
        }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>{d.emoji}</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: TEXT, marginBottom: 6 }}>{d.titulo}</div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{d.desc}</div>
        </div>
      ))}
    </div>
  );
}

export default function DefensaConsumidorPage() {
  const [activeSection, setActiveSection] = useState("s1");
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    document.title = "Defensa al Consumidor — Luderis";
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
        a { color: ${ACCENT}; text-decoration: none; }
        a:hover { text-decoration: underline; }
        @media(max-width:768px){
          .tc-layout{ flex-direction:column !important; }
          .tc-sidebar{ display:none; }
          .tc-sidebar.open{ display:block !important; position:fixed; top:0; left:0; right:0; bottom:0; z-index:200; background:${SURFACE}; overflow-y:auto; padding:24px; }
          .tc-content{ max-width:100% !important; }
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
              <button onClick={() => setMenuOpen(v => !v)}
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: TEXT, padding: "4px 6px" }}>☰</button>
            )}
            <a href="/" style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: ACCENT, letterSpacing: "-.4px" }}>Luderis</span>
            </a>
            <span style={{ color: BORDER, fontSize: 18, margin: "0 4px" }}>|</span>
            <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>Defensa al Consumidor</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a href="/terminos" style={{ fontSize: 12, color: MUTED, padding: "6px 10px", display: isMobile ? "none" : "inline" }}>T&C</a>
            <a href="/devoluciones" style={{ fontSize: 12, color: MUTED, padding: "6px 10px", display: isMobile ? "none" : "inline" }}>Devoluciones</a>
            <a href="/" style={{
              fontSize: 13, color: ACCENT, fontWeight: 600,
              padding: "6px 14px", border: `1px solid ${ACCENT}`,
              borderRadius: 20, textDecoration: "none"
            }}>← Volver</a>
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
                  padding: "8px 16px", background: "none", border: "none",
                  cursor: "pointer", fontFamily: FONT, fontSize: 13, lineHeight: 1.4,
                  color: activeSection === s.id ? ACCENT : MUTED,
                  fontWeight: activeSection === s.id ? 600 : 400,
                  borderLeft: `3px solid ${activeSection === s.id ? ACCENT : "transparent"}`,
                  transition: "all .15s"
                }}>{s.titulo}</button>
            ))}
            <div style={{ borderTop: `1px solid ${BORDER}`, margin: "12px 16px 0", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <a href="/terminos"    style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>📄 Términos y Condiciones</a>
              <a href="/devoluciones" style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>💸 Política de Devoluciones</a>
              <a href="/ayuda"        style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>🙋 Centro de ayuda</a>
              <a href="/quejas"       style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>📋 Libro de Quejas</a>
            </div>
          </div>
        </aside>

        {/* Contenido */}
        <main className="tc-content" style={{ flex: 1, maxWidth: 740 }}>

          {/* Intro */}
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: TEXT, marginBottom: 10, lineHeight: 1.2 }}>
              Defensa al Consumidor
            </h1>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>
              En Luderis creemos en relaciones de consumo justas y transparentes.
              Esta página te explica cuáles son tus derechos, cómo reclamar ante nosotros
              y cómo acceder a los organismos oficiales del Estado argentino si lo necesitás.
            </p>
            <Badge type="info">
              ⚖️ Luderis opera bajo la <strong>Ley N° 24.240 de Defensa del Consumidor</strong> de la República Argentina
              y sus modificatorias. Como usuario de la plataforma, sos un consumidor protegido por esta ley.
            </Badge>
          </div>

          {/* ── S1 ── */}
          <Seccion id="s1" titulo="1. Tus derechos como consumidor">
            <P>
              La Ley N° 24.240 y sus modificatorias te garantizan, entre otros, los siguientes derechos:
            </P>
            <DerechosGrid />
            <P>
              Estos derechos no pueden ser renunciados ni limitados por contrato. Si alguna cláusula
              de los <a href="/terminos">Términos y Condiciones</a> de Luderis contradijera estos derechos,
              prevalece siempre la ley.
            </P>
          </Seccion>

          {/* ── S2 ── */}
          <Seccion id="s2" titulo="2. Cómo reclamar ante Luderis">
            <P>
              Antes de recurrir a organismos externos, te pedimos que intentes resolver el problema
              directamente con Luderis. En la mayoría de los casos podemos resolverlo de forma más
              ágil y sin trámites adicionales.
            </P>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <PasoReclamo n="1" titulo="Contactanos por email"
                desc='Enviá tu reclamo a contacto@luderis.com.ar con el asunto "Reclamo — [descripción breve". Describí el problema con el mayor detalle posible.' />
              <PasoReclamo n="2" titulo="Plazo de respuesta"
                desc="Nos comprometemos a acusar recibo dentro de las 48 horas hábiles e iniciar la revisión del caso. El plazo de resolución varía según la complejidad." />
              <PasoReclamo n="3" titulo="Si no quedás conforme"
                desc="Si nuestra respuesta no te satisface, podés escalar el reclamo a los organismos oficiales que se detallan en la sección siguiente." />
            </div>
            <Badge type="success">
              ✅ <strong>Nota:</strong> También podés ver nuestra{" "}
              <a href="/devoluciones">Política de Devoluciones</a> para reclamos específicos sobre pagos y reembolsos.
            </Badge>
          </Seccion>

          {/* ── S3 ── */}
          <Seccion id="s3" titulo="3. Organismos oficiales de defensa">
            <P>
              Si no llegamos a una solución satisfactoria, tenés derecho a presentar tu reclamo
              ante los siguientes organismos públicos, de forma <strong>gratuita</strong>:
            </P>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <OrganismoCard
                emoji="🏛️"
                nombre="Dirección Nacional de Defensa del Consumidor"
                desc="Organismo del Ministerio de Economía que recibe reclamos de consumidores de todo el país. Podés presentar tu denuncia online."
                url="https://www.argentina.gob.ar/produccion/defensadelconsumidor"
                urlLabel="argentina.gob.ar/defensadelconsumidor"
              />
              <OrganismoCard
                emoji="📱"
                nombre="Ventanilla Única Federal (VUF)"
                desc="Sistema centralizado para presentar reclamos ante organismos de defensa del consumidor de todo el país desde un solo lugar."
                url="https://www.argentina.gob.ar/produccion/defensadelconsumidor/ventanilla-unica-federal"
                urlLabel="Acceder a VUF"
              />
              <OrganismoCard
                emoji="🏙️"
                nombre="Defensa al Consumidor de CABA"
                desc="Para usuarios de la Ciudad Autónoma de Buenos Aires, podés iniciar el reclamo ante la Dirección General de Defensa y Protección del Consumidor porteña."
                url="https://www.buenosaires.gob.ar/defensaconsumidor"
                urlLabel="buenosaires.gob.ar/defensaconsumidor"
              />
              <OrganismoCard
                emoji="📞"
                nombre="Línea gratuita 0800-666-1518"
                desc="Línea de atención al consumidor del Ministerio de Economía de la Nación. Atención de lunes a viernes en horario hábil."
                url={null}
              />
            </div>
            <BotonesOficiales />
          </Seccion>

          {/* ── S4 ── */}
          <Seccion id="s4" titulo="4. COPREC — Conciliación gratuita">
            <P>
              El <strong>COPREC (Servicio de Conciliación Previa en las Relaciones de Consumo)</strong>
              {" "}es un sistema oficial del Estado argentino que permite resolver disputas entre
              consumidores y empresas de forma <strong>gratuita, rápida y sin necesidad de un abogado</strong>.
            </P>
            <div style={{
              background: "#ECFDF5", border: `1px solid #A7F3D0`,
              borderRadius: 12, padding: "18px 20px", marginBottom: 16
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: SUCCESS, marginBottom: 12 }}>
                ✅ Ventajas del COPREC
              </div>
              <Ul>
                <Li>Es completamente <strong>gratuito</strong> para el consumidor.</Li>
                <Li>No necesitás abogado para iniciar el proceso.</Li>
                <Li>El trámite es en línea y sin necesidad de presentarte físicamente.</Li>
                <Li>Si se llega a un acuerdo, tiene la misma validez que una sentencia judicial.</Li>
                <Li>La empresa está <strong>obligada a participar</strong> del proceso de conciliación.</Li>
              </Ul>
            </div>
            <P>
              El COPREC aplica cuando el monto reclamado no supera <strong>55 salarios mínimos</strong>
              {" "}(umbral que se actualiza periódicamente). Para montos mayores, corresponde la vía judicial ordinaria.
            </P>
            <div style={{ marginTop: 16 }}>
              <a
                href="https://www.coprec.gob.ar"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#2E7D52", color: "#fff", borderRadius: 10,
                  padding: "12px 20px", fontSize: 14, fontWeight: 700,
                  textDecoration: "none", transition: "opacity .2s"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                ⚖️ Iniciar conciliación en COPREC →
              </a>
            </div>
          </Seccion>

          {/* ── S5 ── */}
          <Seccion id="s5" titulo="5. Libro de Quejas Digital">
            <P>
              El <strong>Libro de Quejas Digital</strong> es una herramienta oficial del Estado argentino
              obligatoria para todos los proveedores de bienes y servicios. Permite a los consumidores
              registrar sus quejas de manera formal.
            </P>
            <P>
              Podés acceder al Libro de Quejas Digital de Luderis a través del sitio oficial del gobierno:
            </P>
            <div style={{ marginTop: 12, marginBottom: 20 }}>
              <a
                href="https://www.argentina.gob.ar/libro-de-quejas-digital"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: ACCENT, color: "#fff", borderRadius: 10,
                  padding: "12px 20px", fontSize: 14, fontWeight: 700,
                  textDecoration: "none", transition: "opacity .2s"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                📋 Acceder al Libro de Quejas Digital →
              </a>
            </div>
            <Badge type="neutral">
              💡 El registro en el Libro de Quejas no reemplaza el reclamo directo ante Luderis ni ante los
              organismos de defensa del consumidor, pero es un derecho que podés ejercer en cualquier momento.
            </Badge>
          </Seccion>

          {/* ── S6 ── */}
          <Seccion id="s6" titulo="6. Garantías legales">
            <P>
              Luderis garantiza el cumplimiento de las obligaciones establecidas en la
              Ley N° 24.240 de Defensa del Consumidor, en particular:
            </P>
            <Ul>
              <Li>
                <strong>Derecho de arrepentimiento (art. 34):</strong> podés cancelar cualquier contratación
                realizada de forma remota dentro de las <strong>72 horas</strong> sin costo ni penalidad,
                siempre que no hayas comenzado a consumir el servicio.
              </Li>
              <Li>
                <strong>Información veraz (art. 4):</strong> Luderis se compromete a brindar información
                clara, detallada y suficiente sobre todos los servicios disponibles en la plataforma.
              </Li>
              <Li>
                <strong>Trato digno (art. 8 bis):</strong> todos los usuarios tienen derecho a ser tratados
                con respeto, sin discriminación y sin prácticas abusivas.
              </Li>
              <Li>
                <strong>Precio final (art. 10 bis):</strong> el precio mostrado en la plataforma incluye
                todos los impuestos y cargos aplicables. No existen costos ocultos.
              </Li>
              <Li>
                <strong>Protección en servicios de plataformas digitales (Res. 171/2023):</strong>{" "}
                Luderis cumple con las obligaciones de transparencia e información aplicables a plataformas
                digitales de intermediación.
              </Li>
            </Ul>
          </Seccion>

          {/* ── S7 ── */}
          <Seccion id="s7" titulo="7. Datos de contacto">
            <P>Para ejercer tus derechos como consumidor podés contactarnos por:</P>
            <div style={{
              background: SURFACE, border: `1px solid ${BORDER}`,
              borderRadius: 12, padding: "20px 24px", marginBottom: 20
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22 }}>📧</span>
                  <div>
                    <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Email de reclamos</div>
                    <a href="mailto:contacto@luderis.com.ar" style={{ fontSize: 15, color: ACCENT, fontWeight: 700 }}>
                      contacto@luderis.com.ar
                    </a>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22 }}>📍</span>
                  <div>
                    <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Domicilio legal</div>
                    <span style={{ fontSize: 15, color: TEXT }}>Ciudad Autónoma de Buenos Aires, Argentina</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22 }}>⏱️</span>
                  <div>
                    <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Tiempo de respuesta</div>
                    <span style={{ fontSize: 15, color: TEXT }}>Hasta 48 horas hábiles</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22 }}>⚖️</span>
                  <div>
                    <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Fuero aplicable</div>
                    <span style={{ fontSize: 15, color: TEXT }}>Tribunales Ordinarios de CABA · Ley 24.240</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="/terminos" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 13, color: ACCENT, fontWeight: 600,
                padding: "8px 14px", border: `1px solid ${ACCENT}`,
                borderRadius: 20, textDecoration: "none"
              }}>📄 Términos y Condiciones</a>
              <a href="/devoluciones" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 13, color: ACCENT, fontWeight: 600,
                padding: "8px 14px", border: `1px solid ${ACCENT}`,
                borderRadius: 20, textDecoration: "none"
              }}>💸 Política de Devoluciones</a>
            </div>
          </Seccion>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 32, marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 13, color: MUTED }}>© {new Date().getFullYear()} Luderis. Todos los derechos reservados.</p>
            <p style={{ fontSize: 12, color: MUTED }}>
              Este documento es un borrador con fines informativos y debe ser revisado por un profesional del derecho antes de su publicación oficial.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
