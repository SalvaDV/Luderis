import React, { useState, useEffect } from "react";

const FONT = "'Inter','Segoe UI',system-ui,sans-serif";
const ACCENT = "#7B3FBE";
const TEXT = "#0D1F3C";
const MUTED = "#6B7A99";
const BORDER = "#E2E8F0";
const BG = "#FAFBFF";
const SURFACE = "#FFFFFF";

const SECCIONES = [
  { id: "s1",  titulo: "1. Aceptación de los Términos" },
  { id: "s2",  titulo: "2. Definiciones" },
  { id: "s3",  titulo: "3. Registro y Cuenta de Usuario" },
  { id: "s4",  titulo: "4. Roles: Alumno y Docente" },
  { id: "s5",  titulo: "5. Publicaciones y Contenido" },
  { id: "s6",  titulo: "6. Verificación de Docentes" },
  { id: "s7",  titulo: "7. Sistema de Pagos" },
  { id: "s8",  titulo: "8. Comisiones y Tarifas" },
  { id: "s9",  titulo: "9. Sistema de Reseñas" },
  { id: "s10", titulo: "10. Comunicaciones entre Usuarios" },
  { id: "s11", titulo: "11. Menores de Edad" },
  { id: "s12", titulo: "12. Conductas Prohibidas" },
  { id: "s13", titulo: "13. Propiedad Intelectual" },
  { id: "s14", titulo: "14. Privacidad y Protección de Datos" },
  { id: "s15", titulo: "15. Limitación de Responsabilidad" },
  { id: "s16", titulo: "16. Modificaciones de los Términos" },
  { id: "s17", titulo: "17. Suspensión y Cancelación de Cuentas" },
  { id: "s18", titulo: "18. Legislación Aplicable y Jurisdicción" },
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
    document.title = "Términos y Condiciones — Luderis";
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
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: ACCENT, letterSpacing: "-.4px" }}>Luderis</span>
            </a>
            <span style={{ color: BORDER, fontSize: 18, margin: "0 4px" }}>|</span>
            <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>Términos y Condiciones</span>
          </div>
          <a
            href="/"
            style={{
              fontSize: 13, color: ACCENT, fontWeight: 600,
              padding: "6px 14px", border: `1px solid ${ACCENT}`,
              borderRadius: 20, textDecoration: "none"
            }}
          >
            ← Volver a Luderis
          </a>
        </div>
      </header>

      <div className="tc-layout" style={{ display: "flex", maxWidth: 1200, margin: "0 auto", padding: "32px 24px", gap: 40 }}>

        {/* Sidebar índice */}
        <aside className={`tc-sidebar${menuOpen ? " open" : ""}`} style={{ width: 260, flexShrink: 0 }}>
          {menuOpen && (
            <button
              onClick={() => setMenuOpen(false)}
              style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: TEXT, marginBottom: 16, display: "block" }}
            >✕ Cerrar</button>
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
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="tc-content" style={{ flex: 1, maxWidth: 740 }}>

          {/* Intro */}
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: TEXT, marginBottom: 10, lineHeight: 1.2 }}>
              Términos y Condiciones de Uso
            </h1>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 6 }}>
              <strong>Última actualización:</strong> Abril de 2026
            </p>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>
              <strong>Vigencia:</strong> A partir de la fecha de publicación
            </p>
            <Destacado>
              Antes de usar Luderis, leé estos Términos y Condiciones con atención.
              Al registrarte o usar la plataforma, aceptás todo lo que se establece en este documento.
              Si tenés dudas, escribinos a <a href="mailto:contacto@luderis.com.ar">contacto@luderis.com.ar</a>.
            </Destacado>
          </div>

          {/* ── Sección 1 ── */}
          <Seccion id="s1" titulo="1. Aceptación de los Términos">
            <P>
              Estos Términos y Condiciones (en adelante, "los Términos") regulan el acceso y uso de la
              plataforma Luderis (en adelante, "la Plataforma"), operada por su titular (persona física),
              con domicilio en la Ciudad Autónoma de Buenos Aires, República Argentina.
            </P>
            <P>
              Al acceder, registrarte o usar Luderis de cualquier manera, declarás haber leído,
              comprendido y aceptado estos Términos en su totalidad. Si no estás de acuerdo, no debés
              usar la Plataforma.
            </P>
            <P>
              La aceptación de los Términos es indispensable para el uso de la Plataforma. Su uso implica
              la aceptación plena y sin reservas de todas las disposiciones incluidas en este documento,
              así como en la <a href="/privacidad">Política de Privacidad</a> de Luderis.
            </P>
          </Seccion>

          {/* ── Sección 2 ── */}
          <Seccion id="s2" titulo="2. Definiciones">
            <P>Para facilitar la lectura de estos Términos, se establecen las siguientes definiciones:</P>
            <Ul>
              <Li><strong>Luderis / la Plataforma:</strong> sitio web y aplicación web accesible en luderis.com.ar que conecta a alumnos con docentes particulares.</Li>
              <Li><strong>Usuario:</strong> cualquier persona que accede o usa la Plataforma, ya sea como Alumno, Docente o ambos.</Li>
              <Li><strong>Alumno:</strong> usuario que busca aprender y se inscribe en clases o cursos ofrecidos por Docentes.</Li>
              <Li><strong>Docente:</strong> usuario que ofrece sus servicios de enseñanza a través de la Plataforma.</Li>
              <Li><strong>Publicación:</strong> oferta de clase, curso o búsqueda publicada por un Usuario en la Plataforma.</Li>
              <Li><strong>Inscripción:</strong> acción mediante la cual un Alumno confirma su interés y acceso a una Publicación.</Li>
              <Li><strong>Servicio:</strong> la intermediación tecnológica que brinda Luderis para conectar a Alumnos y Docentes.</Li>
              <Li><strong>Contenido:</strong> textos, imágenes, datos, materiales educativos u otro material publicado por los Usuarios.</Li>
            </Ul>
          </Seccion>

          {/* ── Sección 3 ── */}
          <Seccion id="s3" titulo="3. Registro y Cuenta de Usuario">
            <P>
              Para acceder a las funciones principales de Luderis es necesario crear una cuenta. Al
              registrarte, declarás que:
            </P>
            <Ul>
              <Li>La información que proporcionás es verdadera, precisa y actualizada.</Li>
              <Li>Sos mayor de 18 años, o contás con autorización de tu padre, madre o tutor legal (ver Sección 11).</Li>
              <Li>No tenés una cuenta previamente suspendida o inhabilitada por Luderis.</Li>
              <Li>Sos responsable de mantener la confidencialidad de tu contraseña y de toda actividad que ocurra bajo tu cuenta.</Li>
            </Ul>
            <P>
              Podés registrarte mediante email y contraseña, o a través de tu cuenta de Google. Luderis
              no se hace responsable por pérdidas derivadas del acceso no autorizado a tu cuenta.
            </P>
            <P>
              Luderis se reserva el derecho de rechazar el registro, cancelar cuentas o eliminar
              publicaciones a su sola discreción, especialmente ante conductas que violen estos Términos.
            </P>
          </Seccion>

          {/* ── Sección 4 ── */}
          <Seccion id="s4" titulo="4. Roles: Alumno y Docente">
            <P>La Plataforma permite dos roles principales, que pueden coexistir en una misma cuenta:</P>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: "16px 0 8px" }}>4.1 Alumno</h3>
            <Ul>
              <Li>Puede buscar, visualizar e inscribirse en clases y cursos publicados por Docentes.</Li>
              <Li>Puede enviar mensajes a Docentes a través del chat interno de la Plataforma.</Li>
              <Li>Puede dejar reseñas sobre clases que haya cursado y finalizado.</Li>
              <Li>No puede publicar clases ni cursos propios mientras opere exclusivamente como Alumno.</Li>
            </Ul>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: "16px 0 8px" }}>4.2 Docente</h3>
            <Ul>
              <Li>Puede crear y gestionar publicaciones de clases, cursos o búsqueda de alumnos.</Li>
              <Li>Es responsable de la veracidad, exactitud y cumplimiento de lo ofrecido en sus publicaciones.</Li>
              <Li>Debe completar el proceso de verificación de identidad para operar como Docente (ver Sección 6).</Li>
              <Li>Es libre de fijar sus propios precios, modalidades y horarios, dentro de los parámetros de la Plataforma.</Li>
              <Li>Reconoce que Luderis actúa como intermediario y no como empleador.</Li>
            </Ul>

            <Destacado>
              Luderis no es empleador de los Docentes ni garantiza que los Alumnos contraten sus servicios.
              La relación entre Alumno y Docente es directa y es responsabilidad de ambas partes.
            </Destacado>
          </Seccion>

          {/* ── Sección 5 ── */}
          <Seccion id="s5" titulo="5. Publicaciones y Contenido">
            <P>
              Los Docentes pueden publicar ofertas de clases particulares, cursos grupales o búsqueda
              de alumnos. Al crear una publicación, el Docente declara que:
            </P>
            <Ul>
              <Li>La información es veraz y no resulta engañosa para los Alumnos.</Li>
              <Li>Tiene los conocimientos, habilitaciones o títulos necesarios para enseñar lo que ofrece.</Li>
              <Li>El precio informado es el real y no incluye cargos ocultos.</Li>
              <Li>El contenido publicado no infringe derechos de terceros ni viola la legislación vigente.</Li>
            </Ul>
            <P>
              Luderis se reserva el derecho de moderar, editar, ocultar o eliminar cualquier publicación
              que considere inapropiada, engañosa o que viole estos Términos, sin previo aviso y sin
              obligación de dar explicaciones al usuario.
            </P>
            <P>
              Las publicaciones deben referirse exclusivamente a servicios educativos. Está prohibido
              publicar servicios ajenos a la enseñanza o aprendizaje.
            </P>
          </Seccion>

          {/* ── Sección 6 ── */}
          <Seccion id="s6" titulo="6. Verificación de Docentes">
            <P>
              Para publicar clases o cursos, los Docentes deben completar un proceso de verificación
              que incluye:
            </P>
            <Ul>
              <Li><strong>Verificación de identidad (KYC):</strong> nombre completo, DNI, fecha de nacimiento y situación fiscal.</Li>
              <Li><strong>Verificación de conocimiento mediante IA:</strong> responder correctamente una pregunta generada automáticamente sobre la materia que desean enseñar.</Li>
            </Ul>
            <P>
              La verificación tiene como objetivo brindar mayor confianza a los Alumnos. Sin embargo,
              Luderis no garantiza ni certifica la idoneidad profesional de los Docentes, ni asume
              responsabilidad por la calidad de sus clases.
            </P>
            <P>
              Los Docentes verificados reciben una insignia de verificación visible en su perfil y publicaciones.
              Luderis se reserva el derecho de revocar esta verificación si detecta información falsa o
              conductas que violen estos Términos.
            </P>
          </Seccion>

          {/* ── Sección 7 ── */}
          <Seccion id="s7" titulo="7. Sistema de Pagos">
            <P>
              Luderis facilita el cobro de clases y cursos a través de los siguientes procesadores de pago:
            </P>
            <Ul>
              <Li><strong>MercadoPago</strong> — para pagos en pesos argentinos.</Li>
              <Li><strong>Stripe</strong> — para pagos en moneda extranjera (USD u otras divisas).</Li>
            </Ul>
            <P>
              Al realizar un pago, el Usuario acepta también los Términos y Condiciones del procesador
              correspondiente. Luderis no almacena datos de tarjetas de crédito ni débito.
            </P>
            <P>
              Los pagos son procesados de forma segura por los proveedores mencionados. En caso de
              disputas relacionadas con un pago, el Usuario podrá contactar al soporte de Luderis en
              <a href="mailto:contacto@luderis.com.ar"> contacto@luderis.com.ar</a>.
            </P>
            <Destacado>
              Luderis actúa como intermediario en la relación entre Alumno y Docente.
              No garantiza la devolución de pagos salvo en los casos expresamente indicados en la
              política de reembolsos vigente. Las devoluciones quedan sujetas a las políticas del
              procesador de pago utilizado.
            </Destacado>
            <P>
              Las acreditaciones están sujetas a los tiempos de procesamiento de MercadoPago y Stripe,
              que pueden variar según el método de pago utilizado.
            </P>
          </Seccion>

          {/* ── Sección 8 ── */}
          <Seccion id="s8" titulo="8. Comisiones y Tarifas">
            <P>
              Luderis puede cobrar una comisión por los servicios de intermediación prestados.
              Los porcentajes de comisión vigentes serán informados en la Plataforma al momento
              de crear o gestionar una publicación.
            </P>
            <P>
              El uso de determinadas funcionalidades de la Plataforma puede requerir el pago de
              tarifas adicionales, que serán claramente informadas antes de cualquier transacción.
            </P>
            <P>
              Luderis se reserva el derecho de modificar las comisiones con un preaviso mínimo de
              15 (quince) días, notificando a los usuarios afectados por correo electrónico.
            </P>
          </Seccion>

          {/* ── Sección 9 ── */}
          <Seccion id="s9" titulo="9. Sistema de Reseñas">
            <P>
              Los Alumnos pueden dejar reseñas sobre los Docentes y las clases cursadas, únicamente
              una vez que la clase o curso haya sido marcado como finalizado.
            </P>
            <P>Las reseñas deben:</P>
            <Ul>
              <Li>Reflejar una experiencia real con el Docente o clase evaluada.</Li>
              <Li>Ser respetuosas y no contener insultos, discriminación ni información personal.</Li>
              <Li>No ser publicadas con fines de perjudicar maliciosamente la reputación de un Docente.</Li>
            </Ul>
            <P>
              Luderis se reserva el derecho de eliminar reseñas que violen estas pautas. Las calificaciones
              afectan el posicionamiento de las publicaciones dentro de la Plataforma.
            </P>
            <P>
              Los Docentes no pueden solicitar, presionar ni condicionar a los Alumnos para que dejen
              reseñas favorables. Dicha conducta es causal de suspensión de cuenta.
            </P>
          </Seccion>

          {/* ── Sección 10 ── */}
          <Seccion id="s10" titulo="10. Comunicaciones entre Usuarios">
            <P>
              Luderis pone a disposición de los Usuarios un sistema de mensajería interna para facilitar
              la coordinación entre Alumnos y Docentes. Este canal debe usarse exclusivamente para
              fines relacionados con las clases y cursos dentro de la Plataforma.
            </P>
            <P>Está prohibido utilizar el chat para:</P>
            <Ul>
              <Li>Compartir información de contacto personal (teléfono, correo, redes sociales) con el fin de evadir el pago a través de la Plataforma.</Li>
              <Li>Enviar contenido inapropiado, spam, publicidad ajena o malware.</Li>
              <Li>Acosar, amenazar o discriminar a otros usuarios.</Li>
            </Ul>
            <P>
              Luderis puede monitorear las comunicaciones en la medida permitida por la ley para
              garantizar el cumplimiento de estos Términos y la seguridad de sus usuarios.
            </P>
          </Seccion>

          {/* ── Sección 11 ── */}
          <Seccion id="s11" titulo="11. Menores de Edad">
            <P>
              Luderis está dirigido a personas mayores de 18 años. Los menores de edad podrán usar
              la Plataforma únicamente con el consentimiento expreso, verificable y previo de su padre,
              madre o tutor legal.
            </P>
            <P>
              Al registrar a un menor de edad, el representante legal declara que:
            </P>
            <Ul>
              <Li>Es el padre, madre o tutor legal del menor.</Li>
              <Li>Ha leído y acepta estos Términos en nombre del menor.</Li>
              <Li>Asume plena responsabilidad por el uso que el menor haga de la Plataforma.</Li>
              <Li>Comprende que el menor no podrá actuar como Docente ni realizar pagos de forma autónoma.</Li>
            </Ul>
            <P>
              Luderis se reserva el derecho de solicitar documentación que acredite el vínculo familiar
              o la tutela legal en caso de duda razonable.
            </P>
          </Seccion>

          {/* ── Sección 12 ── */}
          <Seccion id="s12" titulo="12. Conductas Prohibidas">
            <P>Los Usuarios de Luderis no podrán, bajo ninguna circunstancia:</P>
            <Ul>
              <Li>Publicar información falsa, engañosa o que induzca a error.</Li>
              <Li>Usar la Plataforma para actividades ilegales o contrarias a la moral y buenas costumbres.</Li>
              <Li>Suplantar la identidad de otras personas o entidades.</Li>
              <Li>Realizar pagos fuera de la Plataforma con el fin de evadir comisiones.</Li>
              <Li>Distribuir virus, malware o cualquier software dañino.</Li>
              <Li>Realizar scraping, robots o accesos automatizados no autorizados.</Li>
              <Li>Acosar, amenazar, discriminar o intimidar a otros usuarios o al equipo de Luderis.</Li>
              <Li>Publicar contenido de naturaleza sexual, violenta o que incite al odio.</Li>
              <Li>Manipular el sistema de reseñas o calificaciones.</Li>
              <Li>Crear múltiples cuentas para evadir suspensiones o restricciones.</Li>
            </Ul>
            <P>
              El incumplimiento de cualquiera de estas prohibiciones puede resultar en la suspensión
              inmediata de la cuenta, sin derecho a reembolso de servicios contratados, y en la
              denuncia ante las autoridades competentes si correspondiere.
            </P>
          </Seccion>

          {/* ── Sección 13 ── */}
          <Seccion id="s13" titulo="13. Propiedad Intelectual">
            <P>
              Todos los elementos que componen la Plataforma —incluyendo diseño, código, logotipos,
              textos, gráficos y funcionalidades— son propiedad de Luderis o de sus licenciantes, y
              están protegidos por las leyes de propiedad intelectual vigentes en Argentina.
            </P>
            <P>
              Los Usuarios conservan la titularidad del contenido que publican en la Plataforma.
              Al publicarlo, otorgan a Luderis una licencia no exclusiva, gratuita y mundial para
              mostrar, reproducir y distribuir dicho contenido dentro de la Plataforma con fines
              operativos y de promoción del servicio.
            </P>
            <P>
              Está prohibido reproducir, distribuir, modificar o usar cualquier elemento de Luderis
              sin autorización previa y escrita de sus titulares.
            </P>
          </Seccion>

          {/* ── Sección 14 ── */}
          <Seccion id="s14" titulo="14. Privacidad y Protección de Datos">
            <P>
              Luderis recopila y trata datos personales de sus Usuarios en conformidad con la
              <strong> Ley N° 25.326 de Protección de Datos Personales</strong> de la República Argentina.
            </P>
            <P>Los datos recopilados incluyen, entre otros:</P>
            <Ul>
              <Li>Nombre, correo electrónico y contraseña (encriptada).</Li>
              <Li>Información de perfil (foto, ubicación, bio).</Li>
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
              Para más detalle, consultá nuestra Política de Privacidad.
            </P>
          </Seccion>

          {/* ── Sección 15 ── */}
          <Seccion id="s15" titulo="15. Limitación de Responsabilidad">
            <P>
              Luderis es una plataforma de intermediación tecnológica. No es parte de los acuerdos
              entre Alumnos y Docentes, y por lo tanto no asume responsabilidad por:
            </P>
            <Ul>
              <Li>La calidad, exactitud o resultados de las clases o cursos.</Li>
              <Li>El incumplimiento de obligaciones por parte de Alumnos o Docentes.</Li>
              <Li>Daños directos o indirectos derivados del uso o la imposibilidad de uso de la Plataforma.</Li>
              <Li>Interrupciones del servicio por causas ajenas a su control (fuerza mayor, fallas de terceros, etc.).</Li>
              <Li>Pérdidas de datos por causas no imputables a Luderis.</Li>
            </Ul>
            <P>
              En ningún caso la responsabilidad de Luderis superará el monto total abonado por el
              Usuario durante los últimos 3 (tres) meses en la Plataforma.
            </P>
            <Destacado>
              Luderis brinda el servicio "tal como está" y no garantiza resultados educativos específicos,
              disponibilidad ininterrumpida del servicio ni que la Plataforma esté libre de errores.
            </Destacado>
          </Seccion>

          {/* ── Sección 16 ── */}
          <Seccion id="s16" titulo="16. Modificaciones de los Términos">
            <P>
              Luderis puede modificar estos Términos en cualquier momento. Cuando los cambios sean
              significativos, notificará a los Usuarios con al menos <strong>15 (quince) días de anticipación</strong> mediante:
            </P>
            <Ul>
              <Li>Correo electrónico a la dirección registrada en la cuenta.</Li>
              <Li>Aviso destacado dentro de la Plataforma.</Li>
            </Ul>
            <P>
              El uso continuado de la Plataforma tras la entrada en vigencia de las modificaciones
              implica la aceptación de los nuevos Términos. Si no estás de acuerdo con los cambios,
              podés cerrar tu cuenta antes de que entren en vigor.
            </P>
          </Seccion>

          {/* ── Sección 17 ── */}
          <Seccion id="s17" titulo="17. Suspensión y Cancelación de Cuentas">
            <P>
              Los Usuarios pueden cancelar su cuenta en cualquier momento desde la sección
              "Mi cuenta" dentro de la Plataforma. La cancelación no exime al Usuario de
              obligaciones pendientes (pagos, compromisos de clases, etc.).
            </P>
            <P>
              Luderis puede suspender o cancelar una cuenta, de forma temporal o permanente, en los siguientes casos:
            </P>
            <Ul>
              <Li>Violación de estos Términos o la legislación aplicable.</Li>
              <Li>Comportamiento fraudulento o sospecha fundada de fraude.</Li>
              <Li>Múltiples reportes de otros usuarios.</Li>
              <Li>Inactividad prolongada de la cuenta (más de 24 meses consecutivos).</Li>
            </Ul>
            <P>
              En caso de suspensión por violación de Términos, Luderis no estará obligado a reembolsar
              montos pagados ni a mantener el acceso a publicaciones anteriores.
            </P>
          </Seccion>

          {/* ── Sección 18 ── */}
          <Seccion id="s18" titulo="18. Legislación Aplicable y Jurisdicción">
            <P>
              Estos Términos se rigen por la legislación vigente en la <strong>República Argentina</strong>,
              en particular por:
            </P>
            <Ul>
              <Li>Código Civil y Comercial de la Nación.</Li>
              <Li>Ley N° 24.240 de Defensa del Consumidor y sus modificatorias.</Li>
              <Li>Ley N° 25.326 de Protección de Datos Personales.</Li>
              <Li>Ley N° 25.506 de Firma Digital.</Li>
            </Ul>
            <P>
              Para la resolución de cualquier controversia derivada de estos Términos, las partes
              se someten a la jurisdicción de los <strong>Tribunales Ordinarios de la Ciudad Autónoma
              de Buenos Aires</strong>, con renuncia expresa a cualquier otro fuero.
            </P>
          </Seccion>

          {/* ── Sección 19 ── */}
          <Seccion id="s19" titulo="19. Contacto">
            <P>
              Si tenés preguntas, consultas o reclamos relacionados con estos Términos o con el uso
              de la Plataforma, podés contactarnos por los siguientes medios:
            </P>
            <div style={{
              background: SURFACE, border: `1px solid ${BORDER}`,
              borderRadius: 12, padding: "20px 24px", marginTop: 12
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                  <span style={{ fontSize: 20 }}>🌐</span>
                  <div>
                    <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Plataforma</div>
                    <a href="/" style={{ fontSize: 15, color: ACCENT, fontWeight: 600 }}>
                      luderis.com.ar
                    </a>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📍</span>
                  <div>
                    <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Domicilio</div>
                    <span style={{ fontSize: 15, color: TEXT }}>Ciudad Autónoma de Buenos Aires, Argentina</span>
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
              Este documento es un borrador con fines informativos y debe ser revisado por un profesional del derecho antes de su publicación oficial.
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
