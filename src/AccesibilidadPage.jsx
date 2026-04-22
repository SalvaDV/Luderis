import React, { useState, useEffect } from "react";

const FONT    = "'Inter','Segoe UI',system-ui,sans-serif";
const ACCENT  = "#7B3FBE";
const TEXT    = "#0D1F3C";
const MUTED   = "#6B7A99";
const BORDER  = "#E2E8F0";
const BG      = "#FAFBFF";
const SURFACE = "#FFFFFF";
const SUCCESS = "#2E7D52";

const SECCIONES = [
  { id: "s1",  titulo: "1. Nuestro compromiso" },
  { id: "s2",  titulo: "2. Funciones de accesibilidad" },
  { id: "s3",  titulo: "3. Navegacion por teclado" },
  { id: "s4",  titulo: "4. Lectores de pantalla" },
  { id: "s5",  titulo: "5. Contraste y visualizacion" },
  { id: "s6",  titulo: "6. Tecnologias de asistencia" },
  { id: "s7",  titulo: "7. Limitaciones conocidas" },
  { id: "s8",  titulo: "8. Reportar un problema" },
  { id: "s9",  titulo: "9. Contacto de accesibilidad" },
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
    success: { bg: "#ECFDF5", border: "#A7F3D0", color: SUCCESS },
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

function FeatureGrid({ items }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 12, marginBottom: 20,
    }}>
      {items.map(f => (
        <div key={f.titulo} style={{
          background: SURFACE, border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: "16px",
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>{f.emoji}</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: TEXT, marginBottom: 5 }}>{f.titulo}</div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{f.desc}</div>
        </div>
      ))}
    </div>
  );
}

function AtajoRow({ teclas, accion }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: `1px solid ${BORDER}`, gap: 12,
    }}>
      <span style={{ fontSize: 14, color: TEXT }}>{accion}</span>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {teclas.map(t => (
          <kbd key={t} style={{
            background: "#F1F5F9", border: `1px solid ${BORDER}`,
            borderRadius: 6, padding: "3px 8px", fontSize: 12,
            fontFamily: "monospace", color: TEXT, whiteSpace: "nowrap",
          }}>{t}</kbd>
        ))}
      </div>
    </div>
  );
}

export default function AccesibilidadPage() {
  const [activeSection, setActiveSection] = useState("s1");
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    document.title = "Accesibilidad — Luderis";
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

      {/* Header */}
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
            <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>Accesibilidad</span>
          </div>
          <a href="/" style={{
            fontSize: 13, color: ACCENT, fontWeight: 600,
            padding: "6px 14px", border: `1px solid ${ACCENT}`,
            borderRadius: 20, textDecoration: "none",
          }}>← Volver</a>
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
              <a href="/privacidad" style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>🔒 Privacidad</a>
              <a href="/terminos"   style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>📄 Terminos y Condiciones</a>
              <a href="/ayuda"      style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>🙋 Centro de ayuda</a>
            </div>
          </div>
        </aside>

        {/* Contenido */}
        <main style={{ flex: 1, maxWidth: 740 }}>

          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: TEXT, marginBottom: 10, lineHeight: 1.2 }}>
              Accesibilidad en Luderis
            </h1>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 6 }}>
              <strong>Ultima actualizacion:</strong> Abril de 2026
            </p>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>
              Creemos que la educacion debe ser accesible para todas las personas, sin importar sus capacidades.
            </p>
            <Badge type="info">
              ♿ Luderis trabaja activamente para mejorar la accesibilidad de su plataforma
              y aspira a cumplir con las pautas WCAG 2.1 nivel AA. Reconocemos que hay areas
              de mejora y nos comprometemos a seguir trabajando en ellas.
            </Badge>
          </div>

          <Seccion id="s1" titulo="1. Nuestro compromiso">
            <P>
              En Luderis creemos que el aprendizaje debe estar al alcance de todos.
              Nos comprometemos a hacer nuestra plataforma accesible para personas con distintas
              capacidades visuales, auditivas, motoras y cognitivas.
            </P>
            <P>
              Nuestro objetivo es cumplir con las <strong>Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1, nivel AA</strong>,
              estandar internacional de referencia en accesibilidad digital, y con la legislacion argentina vigente.
            </P>
            <Badge type="success">
              ✅ Tomamos en serio los reportes de accesibilidad. Si encontras una barrera,
              escribinos a <a href="mailto:contacto@luderis.com.ar">contacto@luderis.com.ar</a> y la priorizamos.
            </Badge>
          </Seccion>

          <Seccion id="s2" titulo="2. Funciones de accesibilidad">
            <P>Luderis incluye o trabaja en incluir las siguientes caracteristicas:</P>
            <FeatureGrid items={[
              { emoji: "⌨️", titulo: "Navegacion por teclado", desc: "Toda la plataforma puede operarse sin mouse, usando solo el teclado." },
              { emoji: "🔍", titulo: "Zoom hasta 200%", desc: "El contenido se adapta al zoom del navegador sin perdida de funcionalidad." },
              { emoji: "🌗", titulo: "Modo oscuro / claro", desc: "Seleccionable desde Mi cuenta para reducir fatiga visual." },
              { emoji: "📱", titulo: "Diseno responsive", desc: "Funciona en celulares y tablets con distintos tamanos de pantalla." },
              { emoji: "🏷️", titulo: "Etiquetas ARIA", desc: "Botones e inputs tienen etiquetas descriptivas para lectores de pantalla." },
              { emoji: "🎨", titulo: "Contraste de color", desc: "Relaciones de contraste de al menos 4.5:1 en texto sobre fondo." },
            ]} />
          </Seccion>

          <Seccion id="s3" titulo="3. Navegacion por teclado">
            <P>
              Podes navegar toda la plataforma sin usar el mouse. Los atajos de teclado principales son:
            </P>
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "0 20px", marginBottom: 16 }}>
              <AtajoRow teclas={["Tab"]}            accion="Moverse al siguiente elemento interactivo" />
              <AtajoRow teclas={["Shift", "Tab"]}   accion="Moverse al elemento anterior" />
              <AtajoRow teclas={["Enter"]}           accion="Activar boton o link enfocado" />
              <AtajoRow teclas={["Espacio"]}         accion="Activar checkbox o boton" />
              <AtajoRow teclas={["Esc"]}             accion="Cerrar modal o menu abierto" />
              <AtajoRow teclas={["↑", "↓"]}          accion="Navegar opciones de un menu desplegable" />
              <AtajoRow teclas={["Inicio", "Fin"]}   accion="Ir al primer o ultimo elemento de una lista" />
            </div>
            <P>
              El foco de teclado es visible en todo momento con un borde destacado.
              Si encontras elementos sin foco visible, reportalo como un problema de accesibilidad.
            </P>
          </Seccion>

          <Seccion id="s4" titulo="4. Lectores de pantalla">
            <P>
              Luderis es compatible con los lectores de pantalla mas utilizados:
            </P>
            <Ul>
              <Li><strong>NVDA</strong> (Windows) — recomendado con Chrome o Firefox</Li>
              <Li><strong>JAWS</strong> (Windows) — recomendado con Chrome</Li>
              <Li><strong>VoiceOver</strong> (macOS / iOS) — recomendado con Safari</Li>
              <Li><strong>TalkBack</strong> (Android) — recomendado con Chrome</Li>
            </Ul>
            <P>
              Los elementos interactivos tienen etiquetas <code>aria-label</code> descriptivas.
              Los iconos decorativos estan marcados como <code>aria-hidden</code> para no generar
              ruido en la lectura. Los modales atrapan el foco correctamente mientras estan abiertos.
            </P>
            <Badge type="neutral">
              Si tu lector de pantalla tiene dificultades con alguna parte de la plataforma,
              reportalo indicando el lector, navegador y version que usas.
            </Badge>
          </Seccion>

          <Seccion id="s5" titulo="5. Contraste y visualizacion">
            <P>
              Luderis ofrece dos temas de color diseados para facilitar la lectura:
            </P>
            <Ul>
              <Li>
                <strong>Modo claro:</strong> texto oscuro (#0D1F3C) sobre fondo blanco (#FFFFFF).
                Relacion de contraste: 14.5:1 (supera el minimo AA de 4.5:1).
              </Li>
              <Li>
                <strong>Modo oscuro:</strong> texto claro sobre fondo oscuro (#1A1F2E).
                Diseado para reducir la fatiga visual en entornos con poca luz.
              </Li>
            </Ul>
            <P>
              Para usuarios con baja vision, recomendamos:
            </P>
            <Ul>
              <Li>Usar el zoom del navegador (Ctrl + / Cmd +) hasta el nivel que resulte comodo.</Li>
              <Li>Activar el modo de alto contraste del sistema operativo si lo necesitas.</Li>
              <Li>Configurar el tamano de fuente base del navegador desde sus ajustes de accesibilidad.</Li>
            </Ul>
          </Seccion>

          <Seccion id="s6" titulo="6. Tecnologias de asistencia">
            <P>Luderis fue probada con las siguientes tecnologias de asistencia:</P>
            <div style={{ overflowX: "auto", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F3EEFF" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: "#4A1D96", fontWeight: 700, border: `1px solid ${BORDER}` }}>Tecnologia</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: "#4A1D96", fontWeight: 700, border: `1px solid ${BORDER}` }}>Navegador</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: "#4A1D96", fontWeight: 700, border: `1px solid ${BORDER}` }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["NVDA 2024", "Chrome 120+", "✅ Compatible"],
                    ["JAWS 2024", "Chrome 120+", "✅ Compatible"],
                    ["VoiceOver macOS 14", "Safari 17+", "✅ Compatible"],
                    ["VoiceOver iOS 17", "Safari mobile", "⚠️ Parcial"],
                    ["TalkBack Android", "Chrome mobile", "⚠️ Parcial"],
                    ["Dragon NaturallySpeaking", "Chrome 120+", "✅ Compatible"],
                  ].map(([t, n, e], i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? SURFACE : BG }}>
                      <td style={{ padding: "10px 14px", border: `1px solid ${BORDER}`, color: TEXT }}>{t}</td>
                      <td style={{ padding: "10px 14px", border: `1px solid ${BORDER}`, color: TEXT }}>{n}</td>
                      <td style={{ padding: "10px 14px", border: `1px solid ${BORDER}`, color: e.includes("⚠️") ? "#B45309" : SUCCESS, fontWeight: 600 }}>{e}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>

          <Seccion id="s7" titulo="7. Limitaciones conocidas">
            <P>
              Reconocemos que la plataforma todavia tiene areas de mejora en accesibilidad.
              Las limitaciones actualmente conocidas incluyen:
            </P>
            <Ul>
              <Li>Algunos graficos SVG de estadisticas no tienen descripciones alternativas completas para lectores de pantalla.</Li>
              <Li>El chat en tiempo real puede no anunciar automaticamente los mensajes nuevos en todos los lectores de pantalla.</Li>
              <Li>Algunos controles personalizados (como el slider de precios) tienen soporte de teclado limitado.</Li>
              <Li>El mapa de ubicaciones no tiene una alternativa textual completa.</Li>
            </Ul>
            <P>
              Estamos trabajando activamente en resolver estas limitaciones.
              Si encontras un problema no listado aqui, por favor reportalo.
            </P>
          </Seccion>

          <Seccion id="s8" titulo="8. Reportar un problema">
            <P>
              Si encontras una barrera de accesibilidad en Luderis, queremos saberlo.
              Tu reporte nos ayuda a mejorar la experiencia para todos.
            </P>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {[
                { n: "1", t: "Describir el problema", d: "Que elemento o funcion no es accesible, y que esperabas que hiciera." },
                { n: "2", t: "Indicar tu configuracion", d: "Sistema operativo, navegador, version, y tecnologia de asistencia que usas (si aplica)." },
                { n: "3", t: "Enviar el reporte", d: "Por email a contacto@luderis.com.ar con el asunto Reporte de accesibilidad." },
                { n: "4", t: "Seguimiento", d: "Te respondemos en hasta 5 dias habiles con el estado del reporte." },
              ].map(p => (
                <div key={p.n} style={{
                  display: "flex", gap: 14,
                  background: SURFACE, border: `1px solid ${BORDER}`,
                  borderRadius: 10, padding: "14px 16px",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "linear-gradient(135deg,#7B3FBE,#1A6ED8)",
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{p.n}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, marginBottom: 3 }}>{p.t}</div>
                    <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{p.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Seccion>

          <Seccion id="s9" titulo="9. Contacto de accesibilidad">
            <P>Para consultas y reportes especificos de accesibilidad:</P>
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 22 }}>📧</span>
                  <div>
                    <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Email</div>
                    <a href="mailto:contacto@luderis.com.ar" style={{ fontSize: 15, color: ACCENT, fontWeight: 700 }}>
                      contacto@luderis.com.ar
                    </a>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 22 }}>⏱️</span>
                  <div>
                    <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Tiempo de respuesta</div>
                    <span style={{ fontSize: 15, color: TEXT }}>Hasta 5 dias habiles</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="/ayuda" style={{ fontSize: 13, color: ACCENT, fontWeight: 600, padding: "8px 14px", border: `1px solid ${ACCENT}`, borderRadius: 20, textDecoration: "none" }}>
                🙋 Centro de ayuda
              </a>
              <a href="/quejas" style={{ fontSize: 13, color: ACCENT, fontWeight: 600, padding: "8px 14px", border: `1px solid ${ACCENT}`, borderRadius: 20, textDecoration: "none" }}>
                📋 Libro de quejas
              </a>
            </div>
          </Seccion>

          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 32, marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 13, color: MUTED }}>© {new Date().getFullYear()} Luderis. Todos los derechos reservados.</p>
            <p style={{ fontSize: 12, color: MUTED }}>
              Este documento es un borrador y puede ser actualizado periodicamente.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
