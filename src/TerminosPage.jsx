import React, { useState, useEffect } from "react";

const FONT = "'Inter','Segoe UI',system-ui,sans-serif";
const ACCENT = "#7B3FBE";
const TEXT = "#0D1F3C";
const MUTED = "#6B7A99";
const BORDER = "#E2E8F0";
const BG = "#FAFBFF";
const SURFACE = "#FFFFFF";

const SECCIONES = [
  { id: "s1",  titulo: "1. AceptaciÃ³n de los TÃ©rminos" },
  { id: "s2",  titulo: "2. Definiciones" },
  { id: "s3",  titulo: "3. Registro y Cuenta de Usuario" },
  { id: "s4",  titulo: "4. Roles: Alumno y Docente" },
  { id: "s5",  titulo: "5. Publicaciones y Contenido" },
  { id: "s6",  titulo: "6. VerificaciÃ³n de Docentes" },
  { id: "s7",  titulo: "7. Sistema de Pagos" },
  { id: "s8",  titulo: "8. Comisiones y Tarifas" },
  { id: "s9",  titulo: "9. Sistema de ReseÃ±as" },
  { id: "s10", titulo: "10. Comunicaciones entre Usuarios" },
  { id: "s11", titulo: "11. Menores de Edad" },
  { id: "s12", titulo: "12. Conductas Prohibidas" },
  { id: "s13", titulo: "13. Propiedad Intelectual" },
  { id: "s14", titulo: "14. Privacidad y ProtecciÃ³n de Datos" },
  { id: "s15", titulo: "15. LimitaciÃ³n de Responsabilidad" },
  { id: "s16", titulo: "16. Modificaciones de los TÃ©rminos" },
  { id: "s17", titulo: "17. SuspensiÃ³n y CancelaciÃ³n de Cuentas" },
  { id: "s18", titulo: "18. LegislaciÃ³n Aplicable y JurisdicciÃ³n" },
  { id: "s19", titulo: "19. Contacto" },
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

function P({ children, style }) {
  return <p style={{ marginBottom: 12, ...style }}>{children}</p>;
}

function Li({ children }) {
  return (
    <li style={{ marginBottom: 8, paddingLeft: 4 }}>
      {children}
    </li>
  );
}

function Ul({ children }) {
  return (
    <ul style={{ paddingLeft: 22, marginBottom: 16, marginTop: 4, listStyle: "disc" }}>
      {children}
    </ul>
  );
}

function Destacado({ children }) {
  return (
    <div style={{
      background: "#F3EEFF", border: `1px solid #D4B8FF`,
      borderRadius: 10, padding: "14px 18px", marginBottom: 16,
      fontSize: 14, color: "#4A1D96", lineHeight: 1.65
    }}>
      {children}
    </div>
  );
}

export default function TerminosPage() {
  const [activeSection, setActiveSection] = useState("s1");
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    document.title = “Luderis | Términos”;
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
              >â˜°</button>
            )}
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: ACCENT, letterSpacing: "-.4px" }}>Luderis</span>
            </a>
            <span style={{ color: BORDER, fontSize: 18, margin: "0 4px" }}>|</span>
            <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>TÃ©rminos y Condiciones</span>
          </div>
          <a
            href="/"
            style={{
              fontSize: 13, color: ACCENT, fontWeight: 600,
              padding: "6px 14px", border: `1px solid ${ACCENT}`,
              borderRadius: 20, textDecoration: "none"
            }}
          >
            â† Volver a Luderis
          </a>
        </div>
      </header>

      <div className="tc-layout" style={{ display: "flex", maxWidth: 1200, margin: "0 auto", padding: "32px 24px", gap: 40 }}>

        {/* Sidebar Ã­ndice */}
        <aside className={`tc-sidebar${menuOpen ? " open" : ""}`} style={{ width: 260, flexShrink: 0 }}>
          {menuOpen && (
            <button
              onClick={() => setMenuOpen(false)}
              style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: TEXT, marginBottom: 16, display: "block" }}
            >âœ• Cerrar</button>
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
              <button
                key={s.id}
                onClick={() => { scrollTo(s.id); setMenuOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "8px 16px", background: "none",
                  border: "none", cursor: "pointer", fontFamily: FONT,
                  fontSize: 13, lineHeight: 1.4,
                  color: activeSection === s.id ? ACCENT : MUTED,
                  fontWeight: activeSection === s.id ? 600 : 400,
                  borderLeft: `3px solid ${activeSection === s.id ? ACCENT : "transparent"}`,
                  transition: "all .15s"
                }}
              >
                {s.titulo}
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${BORDER}`, margin: "12px 16px 0", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <a href="/devoluciones" style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>ðŸ’¸ PolÃ­tica de Devoluciones</a>
              <a href="/consumidor" style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>âš–ï¸ Defensa al Consumidor</a>
              <a href="/privacidad" style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>ðŸ”’ PolÃ­tica de Privacidad</a>
              <a href="/accesibilidad" style={{ fontSize: 12, color: MUTED, display: "block", padding: "2px 0" }}>â™¿ Accesibilidad</a>
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="tc-content" style={{ flex: 1, maxWidth: 740 }}>

          {/* Intro */}
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: TEXT, marginBottom: 10, lineHeight: 1.2 }}>
              TÃ©rminos y Condiciones de Uso
            </h1>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 6 }}>
              <strong>Ãšltima actualizaciÃ³n:</strong> Mayo de 2026
            </p>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>
              <strong>Vigencia:</strong> A partir de la fecha de publicaciÃ³n
            </p>
            <Destacado>
              Antes de usar Luderis, leÃ© estos TÃ©rminos y Condiciones con atenciÃ³n.
              Al registrarte o usar la plataforma, aceptÃ¡s todo lo que se establece en este documento.
              Si tenÃ©s dudas, escribinos a <a href="mailto:contacto@luderis.com.ar">contacto@luderis.com.ar</a>.
            </Destacado>
          </div>

          {/* â”€â”€ SecciÃ³n 1 â”€â”€ */}
          <Seccion id="s1" titulo="1. AceptaciÃ³n de los TÃ©rminos">
            <P>
              Estos TÃ©rminos y Condiciones (en adelante, "los TÃ©rminos") regulan el acceso y uso de la
              plataforma Luderis (en adelante, "la Plataforma"), operada por{" "}
              <strong>Salvador Ignacio De Vedia</strong> (en adelante, "el Titular"),
              con domicilio en la Ciudad AutÃ³noma de Buenos Aires, RepÃºblica Argentina.
            </P>
            <P>
              Al acceder, registrarte o usar Luderis de cualquier manera, declarÃ¡s haber leÃ­do,
              comprendido y aceptado estos TÃ©rminos en su totalidad. Si no estÃ¡s de acuerdo, no debÃ©s
              usar la Plataforma.
            </P>
            <P>
              La aceptaciÃ³n de los TÃ©rminos es indispensable para el uso de la Plataforma. Su uso implica
              la aceptaciÃ³n plena y sin reservas de todas las disposiciones incluidas en este documento,
              asÃ­ como en la <a href="/privacidad">PolÃ­tica de Privacidad</a> de Luderis.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 2 â”€â”€ */}
          <Seccion id="s2" titulo="2. Definiciones">
            <P>Para facilitar la lectura de estos TÃ©rminos, se establecen las siguientes definiciones:</P>
            <Ul>
              <Li><strong>Luderis / la Plataforma:</strong> sitio web y aplicaciÃ³n web accesible en luderis.com.ar que conecta a alumnos con docentes particulares.</Li>
              <Li><strong>Usuario:</strong> cualquier persona que accede o usa la Plataforma, ya sea como Alumno, Docente o ambos.</Li>
              <Li><strong>Alumno:</strong> usuario que busca aprender y se inscribe en clases o cursos ofrecidos por Docentes.</Li>
              <Li><strong>Docente:</strong> usuario que ofrece sus servicios de enseÃ±anza a travÃ©s de la Plataforma.</Li>
              <Li><strong>PublicaciÃ³n:</strong> oferta de clase, curso o bÃºsqueda publicada por un Usuario en la Plataforma.</Li>
              <Li><strong>InscripciÃ³n:</strong> acciÃ³n mediante la cual un Alumno confirma su interÃ©s y acceso a una PublicaciÃ³n.</Li>
              <Li><strong>Servicio:</strong> la intermediaciÃ³n tecnolÃ³gica que brinda Luderis para conectar a Alumnos y Docentes.</Li>
              <Li><strong>Contenido:</strong> textos, imÃ¡genes, datos, materiales educativos u otro material publicado por los Usuarios.</Li>
            </Ul>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 3 â”€â”€ */}
          <Seccion id="s3" titulo="3. Registro y Cuenta de Usuario">
            <P>
              Para acceder a las funciones principales de Luderis es necesario crear una cuenta. Al
              registrarte, declarÃ¡s que:
            </P>
            <Ul>
              <Li>La informaciÃ³n que proporcionÃ¡s es verdadera, precisa y actualizada.</Li>
              <Li>Sos mayor de 18 aÃ±os; o tenÃ©s entre 13 y 17 aÃ±os y contÃ¡s con autorizaciÃ³n de tu padre, madre o tutor legal (ver SecciÃ³n 11); o tenÃ©s menos de 13 aÃ±os, en cuyo caso no podÃ©s usar la Plataforma.</Li>
              <Li>No tenÃ©s una cuenta previamente suspendida o inhabilitada por Luderis.</Li>
              <Li>Sos responsable de mantener la confidencialidad de tu contraseÃ±a y de toda actividad que ocurra bajo tu cuenta.</Li>
            </Ul>
            <P>
              PodÃ©s registrarte mediante email y contraseÃ±a, o a travÃ©s de tu cuenta de Google. Luderis
              no se hace responsable por pÃ©rdidas derivadas del acceso no autorizado a tu cuenta.
            </P>
            <P>
              Luderis se reserva el derecho de rechazar el registro, cancelar cuentas o eliminar
              publicaciones a su sola discreciÃ³n, especialmente ante conductas que violen estos TÃ©rminos.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 4 â”€â”€ */}
          <Seccion id="s4" titulo="4. Roles: Alumno y Docente">
            <P>La Plataforma permite dos roles principales, que pueden coexistir en una misma cuenta:</P>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: "16px 0 8px" }}>4.1 Alumno</h3>
            <Ul>
              <Li>Puede buscar, visualizar e inscribirse en clases y cursos publicados por Docentes.</Li>
              <Li>Puede enviar mensajes a Docentes a travÃ©s del chat interno de la Plataforma.</Li>
              <Li>Puede dejar reseÃ±as sobre clases que haya cursado y finalizado.</Li>
              <Li>No puede publicar clases ni cursos propios mientras opere exclusivamente como Alumno.</Li>
            </Ul>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: "16px 0 8px" }}>4.2 Docente</h3>
            <Ul>
              <Li>Puede crear y gestionar publicaciones de clases, cursos o bÃºsqueda de alumnos.</Li>
              <Li>Es responsable de la veracidad, exactitud y cumplimiento de lo ofrecido en sus publicaciones.</Li>
              <Li>Debe completar el proceso de verificaciÃ³n de identidad para operar como Docente (ver SecciÃ³n 6).</Li>
              <Li>Es libre de fijar sus propios precios, modalidades y horarios, dentro de los parÃ¡metros de la Plataforma.</Li>
              <Li>Reconoce que Luderis actÃºa como intermediario y no como empleador.</Li>
            </Ul>

            <Destacado>
              Luderis no es empleador de los Docentes ni garantiza que los Alumnos contraten sus servicios.
              La relaciÃ³n entre Alumno y Docente es directa y es responsabilidad de ambas partes.
            </Destacado>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 5 â”€â”€ */}
          <Seccion id="s5" titulo="5. Publicaciones y Contenido">
            <P>
              Los Docentes pueden publicar ofertas de clases particulares, cursos grupales o bÃºsqueda
              de alumnos. Al crear una publicaciÃ³n, el Docente declara que:
            </P>
            <Ul>
              <Li>La informaciÃ³n es veraz y no resulta engaÃ±osa para los Alumnos.</Li>
              <Li>Tiene los conocimientos, habilitaciones o tÃ­tulos necesarios para enseÃ±ar lo que ofrece.</Li>
              <Li>El precio informado es el real y no incluye cargos ocultos.</Li>
              <Li>El contenido publicado no infringe derechos de terceros ni viola la legislaciÃ³n vigente.</Li>
            </Ul>
            <P>
              Luderis se reserva el derecho de moderar, editar, ocultar o eliminar cualquier publicaciÃ³n
              que considere inapropiada, engaÃ±osa o que viole estos TÃ©rminos, sin previo aviso y sin
              obligaciÃ³n de dar explicaciones al usuario.
            </P>
            <P>
              Las publicaciones deben referirse exclusivamente a servicios educativos. EstÃ¡ prohibido
              publicar servicios ajenos a la enseÃ±anza o aprendizaje.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 6 â”€â”€ */}
          <Seccion id="s6" titulo="6. VerificaciÃ³n de Docentes">
            <P>
              Para publicar clases o cursos, los Docentes deben completar un proceso de verificaciÃ³n
              que incluye:
            </P>
            <Ul>
              <Li><strong>VerificaciÃ³n de identidad (KYC):</strong> nombre completo, DNI, fecha de nacimiento y situaciÃ³n fiscal.</Li>
              <Li><strong>VerificaciÃ³n de conocimiento mediante IA:</strong> responder correctamente una pregunta generada automÃ¡ticamente sobre la materia que desean enseÃ±ar.</Li>
            </Ul>
            <P>
              La verificaciÃ³n tiene como objetivo brindar mayor confianza a los Alumnos. Sin embargo,
              Luderis no garantiza ni certifica la idoneidad profesional de los Docentes, ni asume
              responsabilidad por la calidad de sus clases.
            </P>
            <P>
              Los Docentes verificados reciben una insignia de verificaciÃ³n visible en su perfil y publicaciones.
              Luderis se reserva el derecho de revocar esta verificaciÃ³n si detecta informaciÃ³n falsa o
              conductas que violen estos TÃ©rminos.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 7 â”€â”€ */}
          <Seccion id="s7" titulo="7. Sistema de Pagos">
            <P>
              Luderis facilita el cobro de clases y cursos a travÃ©s de MercadoPago, para pagos en pesos
              argentinos (ARS) y dÃ³lares estadounidenses (USD).
            </P>
            <P>
              Al realizar un pago, el Usuario acepta tambiÃ©n los TÃ©rminos y Condiciones de MercadoPago.
              Luderis no almacena datos de tarjetas de crÃ©dito ni dÃ©bito.
            </P>
            <P>
              Los pagos son procesados de forma segura. En caso de disputas relacionadas con un pago,
              el Usuario podrÃ¡ contactar al soporte de Luderis en
              <a href="mailto:contacto@luderis.com.ar"> contacto@luderis.com.ar</a>.
            </P>
            <Destacado>
              Luderis actÃºa como intermediario en la relaciÃ³n entre Alumno y Docente.
              No garantiza la devoluciÃ³n de pagos salvo en los casos expresamente indicados en la
              <a href="/devoluciones">polÃ­tica de devoluciones</a> vigente. Las devoluciones quedan sujetas a las polÃ­ticas del
              procesador de pago utilizado.
            </Destacado>
            <P>
              Las acreditaciones estÃ¡n sujetas a los tiempos de procesamiento de MercadoPago,
              que pueden variar segÃºn el mÃ©todo de pago utilizado.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 8 â”€â”€ */}
          <Seccion id="s8" titulo="8. Comisiones y Tarifas">
            <P>
              Luderis cobra una comisiÃ³n sobre cada transacciÃ³n procesada a travÃ©s de la Plataforma
              por los servicios de intermediaciÃ³n prestados. El porcentaje de comisiÃ³n vigente es
              variable y es regulado desde el panel de administraciÃ³n de la Plataforma.
            </P>
            <P>
              El porcentaje exacto aplicable a cada transacciÃ³n es informado claramente al Docente
              en el momento de crear o gestionar una publicaciÃ³n, y al Alumno antes de confirmar
              cualquier pago. No existen cargos ocultos.
            </P>
            <P>
              Luderis se reserva el derecho de modificar el porcentaje de comisiÃ³n con un preaviso
              mÃ­nimo de <strong>15 (quince) dÃ­as corridos</strong>, notificando a los Docentes afectados
              por correo electrÃ³nico y mediante aviso destacado dentro de la Plataforma.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 9 â”€â”€ */}
          <Seccion id="s9" titulo="9. Sistema de ReseÃ±as">
            <P>
              Los Alumnos pueden dejar reseÃ±as sobre los Docentes y las clases cursadas, Ãºnicamente
              una vez que la clase o curso haya sido marcado como finalizado.
            </P>
            <P>Las reseÃ±as deben:</P>
            <Ul>
              <Li>Reflejar una experiencia real con el Docente o clase evaluada.</Li>
              <Li>Ser respetuosas y no contener insultos, discriminaciÃ³n ni informaciÃ³n personal.</Li>
              <Li>No ser publicadas con fines de perjudicar maliciosamente la reputaciÃ³n de un Docente.</Li>
            </Ul>
            <P>
              Luderis se reserva el derecho de eliminar reseÃ±as que violen estas pautas. Las calificaciones
              afectan el posicionamiento de las publicaciones dentro de la Plataforma.
            </P>
            <P>
              Los Docentes no pueden solicitar, presionar ni condicionar a los Alumnos para que dejen
              reseÃ±as favorables. Dicha conducta es causal de suspensiÃ³n de cuenta.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 10 â”€â”€ */}
          <Seccion id="s10" titulo="10. Comunicaciones entre Usuarios">
            <P>
              Luderis pone a disposiciÃ³n de los Usuarios un sistema de mensajerÃ­a interna para facilitar
              la coordinaciÃ³n entre Alumnos y Docentes. Este canal debe usarse exclusivamente para
              fines relacionados con las clases y cursos dentro de la Plataforma.
            </P>
            <P>EstÃ¡ prohibido utilizar el chat para:</P>
            <Ul>
              <Li>Compartir informaciÃ³n de contacto personal (telÃ©fono, correo, redes sociales) con el fin de evadir el pago a travÃ©s de la Plataforma.</Li>
              <Li>Enviar contenido inapropiado, spam, publicidad ajena o malware.</Li>
              <Li>Acosar, amenazar o discriminar a otros usuarios.</Li>
            </Ul>
            <P>
              Luderis puede monitorear las comunicaciones en la medida permitida por la ley para
              garantizar el cumplimiento de estos TÃ©rminos y la seguridad de sus usuarios.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 11 â”€â”€ */}
          <Seccion id="s11" titulo="11. Menores de Edad">
            <P>
              Luderis da la bienvenida a estudiantes que buscan clases particulares para el colegio y
              la universidad. La Plataforma acepta usuarios segÃºn la siguiente clasificaciÃ³n etaria:
            </P>
            <Ul>
              <Li><strong>Mayores de 18 aÃ±os:</strong> pueden usar la Plataforma sin restricciones adicionales.</Li>
              <Li><strong>Entre 13 y 17 aÃ±os:</strong> pueden usar la Plataforma como Alumnos Ãºnicamente, con el consentimiento expreso y verificable de su padre, madre o tutor legal. No pueden actuar como Docentes ni realizar pagos de forma autÃ³noma.</Li>
              <Li><strong>Menores de 13 aÃ±os:</strong> no pueden registrarse ni usar la Plataforma bajo ninguna circunstancia.</Li>
            </Ul>
            <P>
              Al registrar a un usuario de entre 13 y 17 aÃ±os, el representante legal declara que:
            </P>
            <Ul>
              <Li>Es el padre, madre o tutor legal del menor.</Li>
              <Li>Ha leÃ­do y acepta estos TÃ©rminos en nombre del menor.</Li>
              <Li>Asume plena responsabilidad por el uso que el menor haga de la Plataforma.</Li>
              <Li>SupervisarÃ¡ el uso que el menor haga de la Plataforma, incluyendo los contenidos a los que accede y las comunicaciones que realiza.</Li>
            </Ul>
            <P>
              Luderis se reserva el derecho de solicitar documentaciÃ³n que acredite el vÃ­nculo familiar
              o la tutela legal en caso de duda razonable, y de cancelar cuentas de menores de 13 aÃ±os
              junto con todos los datos asociados.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 12 â”€â”€ */}
          <Seccion id="s12" titulo="12. Conductas Prohibidas">
            <P>Los Usuarios de Luderis no podrÃ¡n, bajo ninguna circunstancia:</P>
            <Ul>
              <Li>Publicar informaciÃ³n falsa, engaÃ±osa o que induzca a error.</Li>
              <Li>Usar la Plataforma para actividades ilegales o contrarias a la moral y buenas costumbres.</Li>
              <Li>Suplantar la identidad de otras personas o entidades.</Li>
              <Li>Realizar pagos fuera de la Plataforma con el fin de evadir comisiones.</Li>
              <Li>Distribuir virus, malware o cualquier software daÃ±ino.</Li>
              <Li>Realizar scraping, robots o accesos automatizados no autorizados.</Li>
              <Li>Acosar, amenazar, discriminar o intimidar a otros usuarios o al equipo de Luderis.</Li>
              <Li>Publicar contenido de naturaleza sexual, violenta o que incite al odio.</Li>
              <Li>Manipular el sistema de reseÃ±as o calificaciones.</Li>
              <Li>Crear mÃºltiples cuentas para evadir suspensiones o restricciones.</Li>
            </Ul>
            <P>
              El incumplimiento de cualquiera de estas prohibiciones puede resultar en la suspensiÃ³n
              inmediata de la cuenta, sin derecho a reembolso de servicios contratados, y en la
              denuncia ante las autoridades competentes si correspondiere.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 13 â”€â”€ */}
          <Seccion id="s13" titulo="13. Propiedad Intelectual">
            <P>
              Todos los elementos que componen la Plataforma â€”incluyendo diseÃ±o, cÃ³digo, logotipos,
              textos, grÃ¡ficos y funcionalidadesâ€” son propiedad de Luderis o de sus licenciantes, y
              estÃ¡n protegidos por las leyes de propiedad intelectual vigentes en Argentina.
            </P>
            <P>
              Los Usuarios conservan la titularidad del contenido que publican en la Plataforma.
              Al publicarlo, otorgan a Luderis una licencia no exclusiva, gratuita y mundial para
              mostrar, reproducir y distribuir dicho contenido dentro de la Plataforma con fines
              operativos y de promociÃ³n del servicio.
            </P>
            <P>
              EstÃ¡ prohibido reproducir, distribuir, modificar o usar cualquier elemento de Luderis
              sin autorizaciÃ³n previa y escrita de sus titulares.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 14 â”€â”€ */}
          <Seccion id="s14" titulo="14. Privacidad y ProtecciÃ³n de Datos">
            <P>
              Luderis recopila y trata datos personales de sus Usuarios en conformidad con la
              <strong> Ley NÂ° 25.326 de ProtecciÃ³n de Datos Personales</strong> de la RepÃºblica Argentina.
            </P>
            <P>Los datos recopilados incluyen, entre otros:</P>
            <Ul>
              <Li>Nombre, correo electrÃ³nico y contraseÃ±a (encriptada).</Li>
              <Li>InformaciÃ³n de perfil (foto, ubicaciÃ³n, bio).</Li>
              <Li>Historial de publicaciones, inscripciones y mensajes.</Li>
              <Li>Datos de pago procesados por terceros (MercadoPago / Stripe).</Li>
            </Ul>
            <P>
              Luderis no vende ni cede datos personales a terceros con fines comerciales.
              Los datos son utilizados exclusivamente para brindar y mejorar el servicio.
            </P>
            <P>
              Los Usuarios tienen derecho a acceder, rectificar y suprimir sus datos personales
              escribiendo a <a href="mailto:contacto@luderis.com.ar">contacto@luderis.com.ar</a>.
              Para mÃ¡s detalle, consultÃ¡ nuestra PolÃ­tica de Privacidad.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 15 â”€â”€ */}
          <Seccion id="s15" titulo="15. LimitaciÃ³n de Responsabilidad">
            <P>
              Luderis es una plataforma de intermediaciÃ³n tecnolÃ³gica. No es parte de los acuerdos
              entre Alumnos y Docentes, y por lo tanto no asume responsabilidad por:
            </P>
            <Ul>
              <Li>La calidad, exactitud o resultados de las clases o cursos.</Li>
              <Li>El incumplimiento de obligaciones por parte de Alumnos o Docentes.</Li>
              <Li>DaÃ±os directos o indirectos derivados del uso o la imposibilidad de uso de la Plataforma.</Li>
              <Li>Interrupciones del servicio por causas ajenas a su control (fuerza mayor, fallas de terceros, etc.).</Li>
              <Li>PÃ©rdidas de datos por causas no imputables a Luderis.</Li>
            </Ul>
            <P>
              En ningÃºn caso la responsabilidad de Luderis superarÃ¡ el monto total abonado por el
              Usuario durante los Ãºltimos 3 (tres) meses en la Plataforma.
            </P>
            <Destacado>
              Luderis brinda el servicio "tal como estÃ¡" y no garantiza resultados educativos especÃ­ficos,
              disponibilidad ininterrumpida del servicio ni que la Plataforma estÃ© libre de errores.
            </Destacado>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 16 â”€â”€ */}
          <Seccion id="s16" titulo="16. Modificaciones de los TÃ©rminos">
            <P>
              Luderis puede modificar estos TÃ©rminos en cualquier momento. Cuando los cambios sean
              significativos, notificarÃ¡ a los Usuarios con al menos <strong>15 (quince) dÃ­as de anticipaciÃ³n</strong> mediante:
            </P>
            <Ul>
              <Li>Correo electrÃ³nico a la direcciÃ³n registrada en la cuenta.</Li>
              <Li>Aviso destacado dentro de la Plataforma.</Li>
            </Ul>
            <P>
              El uso continuado de la Plataforma tras la entrada en vigencia de las modificaciones
              implica la aceptaciÃ³n de los nuevos TÃ©rminos. Si no estÃ¡s de acuerdo con los cambios,
              podÃ©s cerrar tu cuenta antes de que entren en vigor.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 17 â”€â”€ */}
          <Seccion id="s17" titulo="17. SuspensiÃ³n y CancelaciÃ³n de Cuentas">
            <P>
              Los Usuarios pueden cancelar su cuenta en cualquier momento desde la secciÃ³n
              "Mi cuenta" dentro de la Plataforma. La cancelaciÃ³n no exime al Usuario de
              obligaciones pendientes (pagos, compromisos de clases, etc.).
            </P>
            <P>
              Luderis puede suspender o cancelar una cuenta, de forma temporal o permanente, en los siguientes casos:
            </P>
            <Ul>
              <Li>ViolaciÃ³n de estos TÃ©rminos o la legislaciÃ³n aplicable.</Li>
              <Li>Comportamiento fraudulento o sospecha fundada de fraude.</Li>
              <Li>MÃºltiples reportes de otros usuarios.</Li>
              <Li>Inactividad prolongada de la cuenta (mÃ¡s de 24 meses consecutivos).</Li>
            </Ul>
            <P>
              En caso de suspensiÃ³n por violaciÃ³n de TÃ©rminos, Luderis no estarÃ¡ obligado a reembolsar
              montos pagados ni a mantener el acceso a publicaciones anteriores.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 18 â”€â”€ */}
          <Seccion id="s18" titulo="18. LegislaciÃ³n Aplicable y JurisdicciÃ³n">
            <P>
              Estos TÃ©rminos se rigen por la legislaciÃ³n vigente en la <strong>RepÃºblica Argentina</strong>,
              en particular por:
            </P>
            <Ul>
              <Li>CÃ³digo Civil y Comercial de la NaciÃ³n.</Li>
              <Li>Ley NÂ° 24.240 de Defensa del Consumidor y sus modificatorias.</Li>
              <Li>Ley NÂ° 25.326 de ProtecciÃ³n de Datos Personales.</Li>
              <Li>Ley NÂ° 25.506 de Firma Digital.</Li>
            </Ul>
            <P>
              Para la resoluciÃ³n de cualquier controversia derivada de estos TÃ©rminos, las partes
              se someten a la jurisdicciÃ³n de los <strong>Tribunales Ordinarios de la Ciudad AutÃ³noma
              de Buenos Aires</strong>, con renuncia expresa a cualquier otro fuero.
            </P>
          </Seccion>

          {/* â”€â”€ SecciÃ³n 19 â”€â”€ */}
          <Seccion id="s19" titulo="19. Contacto">
            <P>
              Si tenÃ©s preguntas, consultas o reclamos relacionados con estos TÃ©rminos o con el uso
              de la Plataforma, podÃ©s contactarnos por los siguientes medios:
            </P>
            <div style={{
              background: SURFACE, border: `1px solid ${BORDER}`,
              borderRadius: 12, padding: "20px 24px", marginTop: 12
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>ðŸ“§</span>
                  <div>
                    <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Email</div>
                    <a href="mailto:contacto@luderis.com.ar" style={{ fontSize: 15, color: ACCENT, fontWeight: 600 }}>
                      contacto@luderis.com.ar
                    </a>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>ðŸŒ</span>
                  <div>
                    <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Plataforma</div>
                    <a href="/" style={{ fontSize: 15, color: ACCENT, fontWeight: 600 }}>
                      luderis.com.ar
                    </a>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>ðŸ“</span>
                  <div>
                    <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Domicilio</div>
                    <span style={{ fontSize: 15, color: TEXT }}>Ciudad AutÃ³noma de Buenos Aires, Argentina</span>
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
              Â© {new Date().getFullYear()} Luderis. Todos los derechos reservados.
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
