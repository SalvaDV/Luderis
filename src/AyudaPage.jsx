import React, { useState, useMemo } from "react";

const FONT   = "'Inter','Segoe UI',system-ui,sans-serif";
const ACCENT = "#7B3FBE";
const TEXT   = "#0D1F3C";
const MUTED  = "#6B7A99";
const BORDER = "#E2E8F0";
const BG     = "#FAFBFF";
const SURFACE= "#FFFFFF";

// ─── CONTENIDO FAQ ──────────────────────────────────────────────────────────
const CATEGORIAS = [
  {
    id: "cuenta", emoji: "🔐", titulo: "Cuenta y acceso",
    desc: "Registro, contraseña, perfil y configuración",
    preguntas: [
      {
        q: "¿Cómo me registro en Luderis?",
        a: "Podés registrarte con tu email y una contraseña, o directamente con tu cuenta de Google. Hacé clic en "Ingresar" desde la página principal y elegí la opción "Crear cuenta". Solo te lleva un par de minutos.",
      },
      {
        q: "Olvidé mi contraseña, ¿qué hago?",
        a: "En la pantalla de login, hacé clic en "¿Olvidaste tu contraseña?" e ingresá tu email. Te vamos a mandar un link para resetearla. Revisá también la carpeta de spam si no llega en unos minutos.",
      },
      {
        q: "¿Puedo ser alumno y docente al mismo tiempo?",
        a: "Sí. Luderis permite el rol "ambos". Podés inscribirte en cursos como alumno y publicar tus propias clases como docente, todo desde la misma cuenta.",
      },
      {
        q: "¿Cómo cambio mi foto o datos de perfil?",
        a: "Andá a Mi cuenta → tocás tu nombre o foto → editás los datos que quieras. Podés cambiar nombre, bio, ubicación y foto de perfil.",
      },
      {
        q: "¿Cómo elimino mi cuenta?",
        a: "Podés solicitarlo desde Mi cuenta → Configuración → Eliminar cuenta. Tené en cuenta que esta acción es irreversible y perderás acceso a todas tus clases, historial y datos.",
      },
      {
        q: "¿Puedo tener dos cuentas con el mismo email?",
        a: "No. Cada email está asociado a una única cuenta. Si querés cambiar el email de tu cuenta, escribinos a contacto@luderis.com.ar.",
      },
    ],
  },
  {
    id: "pagos", emoji: "💳", titulo: "Pagos y cobros",
    desc: "Métodos de pago, comisiones y acreditaciones",
    preguntas: [
      {
        q: "¿Qué métodos de pago aceptan?",
        a: "Aceptamos pagos a través de MercadoPago (tarjetas, débito, Mercado Crédito, transferencia bancaria) y Stripe (tarjetas de crédito/débito internacionales). El docente puede ofrecer ambas opciones o solo una.",
      },
      {
        q: "¿Los precios incluyen impuestos?",
        a: "Sí. El precio que ves en cada publicación es el precio final. No hay cargos adicionales ocultos al momento de pagar.",
      },
      {
        q: "¿Cuándo se acredita el cobro al docente?",
        a: "Los tiempos de acreditación dependen del procesador de pago. Con MercadoPago suele ser entre 2 y 14 días hábiles según el método. Con Stripe, entre 2 y 7 días hábiles.",
      },
      {
        q: "¿Puedo pedir una devolución?",
        a: "Sí, en ciertos casos. Podés cancelar dentro de las 72 hs del pago sin consumir el servicio (derecho de arrepentimiento). También si el docente cancela la clase o no se presenta. Ver la política completa en /devoluciones.",
      },
      {
        q: "¿Qué comisión cobra Luderis?",
        a: "Luderis cobra una comisión por cada transacción procesada a través de la plataforma. El porcentaje exacto se muestra al momento de publicar o contratar un servicio.",
      },
      {
        q: "¿Es seguro pagar en Luderis?",
        a: "Sí. Los pagos son procesados por MercadoPago y Stripe, que cuentan con encriptación TLS y certificaciones de seguridad internacionales. Luderis nunca almacena datos de tarjetas.",
      },
      {
        q: "El pago fue rechazado, ¿qué hago?",
        a: "Verificá que los datos de la tarjeta sean correctos, que tengas fondos suficientes y que la tarjeta no esté vencida. Si el problema persiste, intentá con otro método de pago o contactá a tu banco.",
      },
    ],
  },
  {
    id: "alumno", emoji: "🎓", titulo: "Como alumno",
    desc: "Inscripciones, clases y reseñas",
    preguntas: [
      {
        q: "¿Cómo me inscribo en un curso o clase?",
        a: "Buscá la clase que te interesa, abrí el detalle y hacé clic en "Inscribirme". Si la clase tiene un precio, se te pedirá que completes el pago a través de la plataforma.",
      },
      {
        q: "¿Puedo cancelar una inscripción?",
        a: "Podés cancelar dentro de las 72 hs del pago si no comenzaste a consumir el contenido (derecho de arrepentimiento, Ley 24.240). Pasado ese plazo, las cancelaciones quedan sujetas a la política de devoluciones.",
      },
      {
        q: "¿Cómo contacto al docente antes de inscribirme?",
        a: "En el detalle de cada publicación hay un botón de chat. Podés escribirle al docente directamente para consultar dudas antes de inscribirte.",
      },
      {
        q: "¿Cómo dejo una reseña?",
        a: "Podés dejar una reseña una vez que la clase o curso esté marcado como finalizado. Andá a la publicación en "Mis clases" y vas a ver la opción de calificar.",
      },
      {
        q: "¿Qué pasa si el docente cancela la clase?",
        a: "Si el docente cancela sin aviso o no se presenta, tenés derecho a una devolución completa. Contactanos a contacto@luderis.com.ar con los detalles del caso.",
      },
      {
        q: "¿Puedo inscribirme en más de una clase al mismo tiempo?",
        a: "Sí, podés estar inscripto en tantos cursos y clases como quieras, siempre que no haya conflictos de horarios.",
      },
      {
        q: "¿Cómo accedo al contenido de mis clases?",
        a: "Desde la sección "Mis clases" (ícono de diploma en la barra de navegación) podés ver todas tus inscripciones activas y acceder al contenido de cada una.",
      },
    ],
  },
  {
    id: "docente", emoji: "👨‍🏫", titulo: "Como docente",
    desc: "Publicaciones, verificación y cobros",
    preguntas: [
      {
        q: "¿Cómo publico una clase o curso?",
        a: "Hacé clic en el botón "+ Nueva publicación" y seguí los pasos del formulario. Podés elegir entre clase particular, curso grupal o búsqueda de alumnos. Completá título, descripción, precio, modalidad y horarios.",
      },
      {
        q: "¿Qué es la verificación de docente?",
        a: "Es un proceso de dos pasos: verificación de identidad (DNI y datos personales) y una pregunta generada por IA sobre tu materia para confirmar que tenés conocimientos en el área. Los docentes verificados tienen una insignia visible en su perfil.",
      },
      {
        q: "¿Es obligatorio verificarse para publicar?",
        a: "No es obligatorio, pero los docentes verificados tienen mayor visibilidad y confianza de los alumnos. Podés publicar sin verificarte, pero algunas funciones pueden estar limitadas.",
      },
      {
        q: "¿Puedo modificar una publicación después de publicarla?",
        a: "Sí. Desde Mi cuenta → Mis publicaciones podés editar cualquier dato de tu publicación. Si hay alumnos ya inscriptos, te recomendamos notificarlos de cambios importantes por el chat.",
      },
      {
        q: "¿Cómo configuro el precio de mis clases?",
        a: "Al crear una publicación podés fijar un precio en pesos o en dólares. También podés ofrecer paquetes con descuento (ej: 5 clases con 15% off) o una primera clase gratuita.",
      },
      {
        q: "¿Qué pasa si un alumno no se presenta?",
        a: "Si el alumno no se presentó y ya había pagado, ese pago te corresponde según las condiciones acordadas. Si tenés dudas sobre cómo manejarlo, contactanos.",
      },
      {
        q: "¿Puedo dar clases presenciales y virtuales?",
        a: "Sí. Podés elegir la modalidad (virtual, presencial o mixta) al crear cada publicación. Para clases presenciales, podés indicar tu ubicación para que los alumnos cercanos te encuentren más fácil.",
      },
    ],
  },
  {
    id: "chat", emoji: "💬", titulo: "Comunicación",
    desc: "Chat, notificaciones y mensajes",
    preguntas: [
      {
        q: "¿Cómo funciona el chat interno?",
        a: "El chat de Luderis es un sistema de mensajería directo entre alumnos y docentes. Solo podés chatear con docentes de publicaciones que hayas visto o en las que estés inscripto.",
      },
      {
        q: "¿Puedo compartir mi número de teléfono o Instagram?",
        a: "El intercambio de datos de contacto fuera de la plataforma va en contra de nuestras condiciones de uso, ya que las transacciones externas no tienen protección. Usá el chat interno para coordinar todo.",
      },
      {
        q: "¿Cómo activo las notificaciones?",
        a: "Cuando ingresás a la app, se te pedirá permiso para enviar notificaciones. Si lo rechazaste, podés activarlas desde la configuración de tu navegador o dispositivo.",
      },
      {
        q: "¿Puedo bloquear o reportar a un usuario?",
        a: "Sí. Dentro de cualquier publicación o perfil podés usar el botón de reporte (⚑). También podés escribirnos a contacto@luderis.com.ar con el detalle de la situación.",
      },
      {
        q: "¿Los mensajes son privados?",
        a: "Sí, los mensajes son privados entre las partes. Sin embargo, Luderis puede revisarlos si hay una denuncia activa o para resolver una disputa, en los términos que indica nuestra política de privacidad.",
      },
    ],
  },
  {
    id: "tecnico", emoji: "🛠️", titulo: "Problemas técnicos",
    desc: "Errores, carga lenta y compatibilidad",
    preguntas: [
      {
        q: "La app no carga o está muy lenta, ¿qué hago?",
        a: "Probá refrescando la página (F5 o Ctrl+R). Si el problema persiste, limpiá el caché del navegador o probá en modo incógnito. Si sigue sin funcionar, escribinos a contacto@luderis.com.ar.",
      },
      {
        q: "¿La plataforma funciona en celular?",
        a: "Sí. Luderis está optimizada para funcionar en dispositivos móviles desde el navegador. No requiere instalación de aplicación.",
      },
      {
        q: "No recibo el email de verificación o recuperación de contraseña.",
        a: "Revisá la carpeta de spam o correo no deseado. Si usás Gmail, revisá también en la pestaña "Promociones". Si no llegó en 10 minutos, podés solicitar el reenvío desde la pantalla de login.",
      },
      {
        q: "¿En qué navegadores funciona Luderis?",
        a: "Recomendamos Chrome, Edge, Firefox o Safari en sus versiones más recientes. Si tenés problemas con un navegador específico, probá con otro.",
      },
      {
        q: "Se cerró mi sesión solo, ¿es normal?",
        a: "Las sesiones tienen un tiempo de expiración por seguridad. Si la inactividad es prolongada, es posible que se cierre sola. Podés volver a ingresar normalmente.",
      },
    ],
  },
  {
    id: "seguridad", emoji: "⚖️", titulo: "Seguridad y reportes",
    desc: "Reportes, estafas y protección",
    preguntas: [
      {
        q: "¿Cómo sé si un docente es confiable?",
        a: "Fijate en la insignia de verificación ✓, las reseñas de otros alumnos, la antigüedad del perfil y la cantidad de clases dictadas. Los docentes verificados pasaron por un proceso de validación de identidad y conocimiento.",
      },
      {
        q: "¿Qué hago si creo que me están estafando?",
        a: "No realices ningún pago fuera de la plataforma. Cortá el contacto y reportalo desde la publicación o escribinos urgente a contacto@luderis.com.ar. También podés hacer una denuncia ante la Defensa al Consumidor.",
      },
      {
        q: "¿Cómo reporto una publicación o usuario?",
        a: "En cada publicación hay un botón de reporte (⚑ o "Denunciar"). Completá el motivo y lo revisaremos a la brevedad. También podés escribirnos directamente.",
      },
      {
        q: "¿Qué hace Luderis con las denuncias?",
        a: "Todas las denuncias son revisadas por nuestro equipo. Según la gravedad, podemos ocultar la publicación, suspender la cuenta o tomar acciones legales. Notificamos al denunciante del resultado.",
      },
      {
        q: "¿Mis datos están seguros?",
        a: "Sí. Usamos Supabase con encriptación en reposo y en tránsito. Los datos de pago son procesados por MercadoPago y Stripe, nunca pasan por nuestros servidores. Cumplimos con la Ley 25.326 de Protección de Datos Personales.",
      },
    ],
  },
];

// ─── COMPONENTES ─────────────────────────────────────────────────────────────

function FaqItem({ pregunta, respuesta }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: `1px solid ${BORDER}`,
      transition: "background .15s",
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", textAlign: "left", background: "none", border: "none",
          padding: "16px 0", cursor: "pointer", fontFamily: FONT,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: TEXT, lineHeight: 1.4 }}>{pregunta}</span>
        <span style={{
          fontSize: 18, color: ACCENT, flexShrink: 0, lineHeight: 1,
          transition: "transform .2s", transform: open ? "rotate(45deg)" : "none",
        }}>+</span>
      </button>
      {open && (
        <div style={{
          fontSize: 14, color: MUTED, lineHeight: 1.75,
          paddingBottom: 16, paddingRight: 32,
          animation: "fadeDown .15s ease",
        }}>
          {respuesta}
        </div>
      )}
    </div>
  );
}

function CategoriaCard({ cat, activa, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: activa ? ACCENT : SURFACE,
        border: `1px solid ${activa ? ACCENT : BORDER}`,
        borderRadius: 12, padding: "14px 16px",
        cursor: "pointer", fontFamily: FONT,
        display: "flex", flexDirection: "column", gap: 6,
        textAlign: "left", transition: "all .15s",
        boxShadow: activa ? "0 4px 14px rgba(123,63,190,.25)" : "none",
      }}
    >
      <span style={{ fontSize: 24 }}>{cat.emoji}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: activa ? "#fff" : TEXT }}>{cat.titulo}</span>
      <span style={{ fontSize: 11, color: activa ? "rgba(255,255,255,.75)" : MUTED, lineHeight: 1.4 }}>{cat.desc}</span>
    </button>
  );
}

export default function AyudaPage() {
  const [busqueda, setBusqueda]   = useState("");
  const [catActiva, setCatActiva] = useState(null);

  const resultados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q && !catActiva) return null;
    return CATEGORIAS.flatMap(c => {
      if (catActiva && c.id !== catActiva) return [];
      return c.preguntas
        .filter(p => !q || p.q.toLowerCase().includes(q) || p.a.toLowerCase().includes(q))
        .map(p => ({ ...p, cat: c }));
    });
  }, [busqueda, catActiva]);

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FONT, color: TEXT }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: ${ACCENT}; }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:none; } }
      `}</style>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: SURFACE, borderBottom: `1px solid ${BORDER}`,
        boxShadow: "0 1px 8px rgba(0,0,0,.06)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/" style={{ fontSize: 20, fontWeight: 800, color: ACCENT, letterSpacing: "-.4px", textDecoration: "none" }}>Luderis</a>
            <span style={{ color: BORDER, fontSize: 18 }}>|</span>
            <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>Centro de ayuda</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a href="/quejas" style={{
              fontSize: 13, color: ACCENT, fontWeight: 600,
              padding: "6px 14px", border: `1px solid ${ACCENT}`, borderRadius: 20, textDecoration: "none",
            }}>📋 Libro de quejas</a>
            <a href="/" style={{ fontSize: 13, color: MUTED, padding: "6px 10px", textDecoration: "none" }}>← Volver</a>
          </div>
        </div>
      </header>

      {/* Hero buscador */}
      <div style={{
        background: "linear-gradient(135deg,#7B3FBE 0%,#1A6ED8 100%)",
        padding: isMobile ? "40px 20px 48px" : "56px 24px 64px",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: "#fff", marginBottom: 10, lineHeight: 1.2 }}>
          ¿En qué podemos ayudarte?
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,.8)", marginBottom: 28 }}>
          Encontrá respuestas rápidas o contactanos directamente
        </p>
        <div style={{
          maxWidth: 560, margin: "0 auto", position: "relative",
        }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none" }}>🔍</span>
          <input
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setCatActiva(null); }}
            placeholder="Buscá tu pregunta… ej: cómo pagar, cancelar inscripción…"
            style={{
              width: "100%", padding: "16px 16px 16px 48px",
              borderRadius: 14, border: "none", fontSize: 15,
              fontFamily: FONT, outline: "none", boxShadow: "0 4px 24px rgba(0,0,0,.18)",
            }}
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: MUTED }}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "28px 16px" : "40px 24px" }}>

        {/* Categorías */}
        {!busqueda && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Explorá por tema</h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
              gap: 12,
            }}>
              {CATEGORIAS.map(c => (
                <CategoriaCard key={c.id} cat={c} activa={catActiva === c.id}
                  onClick={() => setCatActiva(v => v === c.id ? null : c.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Resultados de búsqueda o categoría */}
        {resultados !== null && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>
                {busqueda
                  ? `${resultados.length} resultado${resultados.length !== 1 ? "s" : ""} para "${busqueda}"`
                  : `${CATEGORIAS.find(c => c.id === catActiva)?.titulo}`}
              </h2>
              {(busqueda || catActiva) && (
                <button onClick={() => { setBusqueda(""); setCatActiva(null); }}
                  style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "4px 14px", fontSize: 13, color: MUTED, cursor: "pointer", fontFamily: FONT }}>
                  Ver todo
                </button>
              )}
            </div>
            {resultados.length === 0 ? (
              <div style={{
                background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14,
                padding: "40px 24px", textAlign: "center",
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontWeight: 700, color: TEXT, marginBottom: 8 }}>No encontramos resultados</div>
                <div style={{ fontSize: 14, color: MUTED, marginBottom: 20 }}>Probá con otras palabras o contactanos directamente.</div>
                <a href="mailto:contacto@luderis.com.ar"
                  style={{ fontSize: 14, color: ACCENT, fontWeight: 600 }}>
                  contacto@luderis.com.ar →
                </a>
              </div>
            ) : (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "0 24px" }}>
                {resultados.map((r, i) => (
                  <div key={i}>
                    {busqueda && (
                      <div style={{ paddingTop: 12, fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>
                        {r.cat.emoji} {r.cat.titulo}
                      </div>
                    )}
                    <FaqItem pregunta={r.q} respuesta={r.a} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FAQ por categorías (vista por defecto sin filtro) */}
        {resultados === null && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {CATEGORIAS.map(cat => (
              <div key={cat.id} id={cat.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>{cat.titulo}</h2>
                </div>
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "0 24px" }}>
                  {cat.preguntas.map((p, i) => (
                    <FaqItem key={i} pregunta={p.q} respuesta={p.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ¿No encontraste lo que buscabas? */}
        <div style={{
          marginTop: 56, background: "linear-gradient(135deg,#F3EEFF,#EEF6FF)",
          border: `1px solid #D4B8FF`, borderRadius: 16,
          padding: isMobile ? "24px 20px" : "32px 40px",
          display: "flex", flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between", gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 6 }}>
              ¿No encontraste lo que buscabas?
            </div>
            <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
              Nuestro equipo te responde por email en menos de 48 horas hábiles.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
            <a href="mailto:contacto@luderis.com.ar"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: ACCENT, color: "#fff", borderRadius: 10,
                padding: "11px 20px", fontSize: 14, fontWeight: 700,
                textDecoration: "none", transition: "opacity .2s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              📧 Escribirnos
            </a>
            <a href="/quejas"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: SURFACE, color: ACCENT, border: `1px solid ${ACCENT}`,
                borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 700,
                textDecoration: "none", transition: "opacity .2s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              📋 Libro de quejas
            </a>
          </div>
        </div>

        {/* Links legales */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${BORDER}`, display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
          {[
            ["📄 Términos y Condiciones", "/terminos"],
            ["💸 Política de Devoluciones", "/devoluciones"],
            ["⚖️ Defensa al Consumidor", "/consumidor"],
            ["📋 Libro de Quejas", "/quejas"],
          ].map(([label, href]) => (
            <a key={href} href={href} style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}
              onMouseEnter={e => e.currentTarget.style.color = ACCENT}
              onMouseLeave={e => e.currentTarget.style.color = MUTED}>
              {label}
            </a>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: MUTED, paddingBottom: 40 }}>
          © {new Date().getFullYear()} Luderis · contacto@luderis.com.ar
        </div>
      </div>
    </div>
  );
}
