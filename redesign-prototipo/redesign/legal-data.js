/* Contenido de las páginas legales — fiel a la app de Luderis */
window.LUDERIS = window.LUDERIS || {};

// Documentos legales tipo texto (título + sangría de secciones)
window.LUDERIS.LEGAL_DOCS = {
  terminos: {
    label: "Términos", title: "Términos y Condiciones", icon: "graduation-cap",
    updated: "Última actualización: marzo 2026",
    intro: "Estos Términos regulan el uso de Luderis, una plataforma que conecta alumnos y docentes para clases particulares y cursos. Al usar la plataforma aceptás estas condiciones.",
    sections: [
      { t: "1. Aceptación de los Términos", p: ["Al registrarte o usar Luderis aceptás estos Términos en su totalidad. Si no estás de acuerdo, no podés utilizar la plataforma.", "El uso continuado tras una modificación implica la aceptación de la versión vigente."] },
      { t: "2. Definiciones", list: ["Plataforma: el sitio y la app de Luderis.", "Usuario: toda persona registrada.", "Alumno: usuario que contrata o se inscribe en clases.", "Docente: usuario que publica y ofrece clases.", "Publicación: una clase, curso o pedido creado en la plataforma."] },
      { t: "3. Registro y Cuenta de Usuario", p: ["Debés brindar información veraz y mantenerla actualizada. Sos responsable de la confidencialidad de tu contraseña y de toda actividad en tu cuenta.", "Una cuenta es personal e intransferible."] },
      { t: "4. Roles: Alumno y Docente", p: ["Una misma cuenta puede actuar como alumno y como docente. Cada rol implica obligaciones propias: el docente debe brindar el servicio ofrecido y el alumno debe abonar el precio acordado."] },
      { t: "5. Publicaciones y Contenido", p: ["El docente es responsable del contenido de sus publicaciones. No se permite contenido falso, engañoso, ofensivo ni que infrinja derechos de terceros.", "Luderis puede moderar, editar o dar de baja publicaciones que incumplan estas reglas."] },
      { t: "6. Verificación de Docentes", p: ["Luderis valida la identidad y los conocimientos de los docentes antes de habilitar sus publicaciones. La insignia de verificación indica que el docente superó este proceso."] },
      { t: "7. Sistema de Pagos", p: ["Los pagos se procesan a través de MercadoPago. El precio informado en la plataforma es el precio final, sin cargos ocultos.", "Luderis no almacena los datos de tu tarjeta."] },
      { t: "8. Comisiones y Tarifas", p: ["Luderis cobra una comisión transparente sobre cada operación, informada antes de confirmar. No existen costos de alta ni mensualidades obligatorias."] },
      { t: "9. Sistema de Reseñas", p: ["Las reseñas reflejan experiencias reales de alumnos que cursaron con el docente. Está prohibido manipular reseñas o publicar valoraciones falsas."] },
      { t: "10. Comunicaciones entre Usuarios", p: ["Todas las comunicaciones deben realizarse dentro de la plataforma. No compartas datos de contacto privados antes de coordinar a través de Luderis: protege tu privacidad y tu seguridad."] },
      { t: "11. Menores de Edad", p: ["Los menores de 18 años sólo pueden usar la plataforma con autorización y supervisión de un adulto responsable, quien acepta estos Términos en su nombre."] },
      { t: "12. Conductas Prohibidas", list: ["Suplantar identidad o falsear información.", "Acosar, discriminar o agredir a otros usuarios.", "Evadir el sistema de pagos de la plataforma.", "Publicar contenido ilegal o que infrinja derechos de autor."] },
      { t: "13. Propiedad Intelectual", p: ["El contenido propio de Luderis (marca, diseño y software) está protegido. El material didáctico de cada docente le pertenece y no puede reproducirse sin su autorización."] },
      { t: "14. Limitación de Responsabilidad", p: ["Luderis es un intermediario que conecta alumnos y docentes. No es parte del contrato de enseñanza y no garantiza resultados académicos específicos."] },
      { t: "15. Legislación Aplicable y Jurisdicción", p: ["Estos Términos se rigen por las leyes de la República Argentina. Cualquier controversia se someterá a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires."] },
      { t: "16. Contacto", p: ["Ante cualquier duda sobre estos Términos, escribinos a contacto@luderis.com."] },
    ],
  },
  privacidad: {
    label: "Privacidad", title: "Política de Privacidad", icon: "badge-check",
    updated: "Última actualización: marzo 2026",
    intro: "En Luderis protegemos tus datos personales conforme a la Ley 25.326 de Protección de Datos Personales. Esta política explica qué datos recopilamos y cómo los usamos.",
    sections: [
      { t: "1. Qué datos recopilamos", list: ["Datos de registro: nombre, email y contraseña.", "Datos de perfil: foto, biografía, ubicación y materias.", "Datos de uso: publicaciones, mensajes e inscripciones.", "Datos de pago: procesados por MercadoPago (no almacenamos tu tarjeta)."] },
      { t: "2. Cómo usamos tus datos", p: ["Usamos tus datos para operar la plataforma, conectar alumnos y docentes, procesar pagos, enviarte notificaciones relevantes y mejorar el servicio."] },
      { t: "3. Con quién compartimos datos", p: ["Tu email nunca se comparte con otros usuarios. Sólo compartimos datos con proveedores necesarios para operar (procesador de pagos, infraestructura) y cuando lo exige la ley."] },
      { t: "4. Tus derechos (ARCO)", p: ["Podés ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición sobre tus datos personales escribiéndonos a contacto@luderis.com."] },
      { t: "5. Cookies y rastreo", p: ["Usamos cookies necesarias para el funcionamiento y cookies de análisis para entender el uso de la plataforma. Podés gestionarlas desde tu navegador."] },
      { t: "6. Retención de datos", p: ["Conservamos tus datos mientras tu cuenta esté activa y durante los plazos legales aplicables. Al eliminar tu cuenta, borramos o anonimizamos tus datos personales."] },
      { t: "7. Seguridad", p: ["Aplicamos medidas técnicas y organizativas para proteger tus datos: cifrado en tránsito, control de accesos y monitoreo. Ningún sistema es 100% infalible, pero trabajamos para minimizar riesgos."] },
      { t: "8. Menores de edad", p: ["No recopilamos datos de menores de 18 años sin el consentimiento de su responsable legal."] },
      { t: "9. Cambios a esta política", p: ["Podemos actualizar esta política. Te avisaremos de cambios sustanciales a través de la plataforma o por email."] },
      { t: "10. Contacto y DPO", p: ["Para consultas sobre privacidad o para ejercer tus derechos, escribí a contacto@luderis.com. La AAIP es la autoridad de control en Argentina."] },
    ],
  },
  accesibilidad: {
    label: "Accesibilidad", title: "Declaración de Accesibilidad", icon: "check",
    updated: "Última actualización: marzo 2026",
    intro: "Queremos que Luderis sea usable por todas las personas. Trabajamos para cumplir las pautas WCAG 2.1 nivel AA y mejoramos la accesibilidad de forma continua.",
    features: [
      { icon: "monitor", t: "Navegación por teclado", d: "Toda la plataforma puede operarse sin mouse, sólo con el teclado." },
      { icon: "search", t: "Zoom hasta 200%", d: "El contenido se adapta al zoom del navegador sin perder funcionalidad." },
      { icon: "moon", t: "Modo oscuro / claro", d: "Seleccionable para reducir la fatiga visual." },
      { icon: "monitor", t: "Diseño responsive", d: "Funciona en celulares y tablets de distintos tamaños." },
      { icon: "badge-check", t: "Etiquetas ARIA", d: "Botones e inputs con etiquetas descriptivas para lectores de pantalla." },
      { icon: "palette", t: "Contraste de color", d: "Relaciones de contraste de al menos 4.5:1 en texto." },
    ],
    sections: [
      { t: "1. Nuestro compromiso", p: ["Nos comprometemos a garantizar la accesibilidad digital para personas con discapacidad, mejorando continuamente la experiencia de uso para todos."] },
      { t: "2. Navegación por teclado", p: ["Podés recorrer la plataforma con Tab y Shift+Tab, activar elementos con Enter o Espacio y cerrar diálogos con Escape. El foco siempre es visible."] },
      { t: "3. Lectores de pantalla", p: ["La plataforma es compatible con lectores de pantalla como NVDA, VoiceOver y TalkBack, con estructura semántica y etiquetas ARIA."] },
      { t: "4. Limitaciones conocidas", p: ["Algunos contenidos de terceros (como videos embebidos) pueden no cumplir totalmente las pautas. Trabajamos para resolverlo."] },
      { t: "5. Reportar un problema", p: ["Si encontrás una barrera de accesibilidad, escribinos a contacto@luderis.com describiendo el problema. Respondemos a la brevedad."] },
    ],
  },
  consumidor: {
    label: "Consumidor", title: "Defensa del Consumidor", icon: "badge-check",
    updated: "Marco legal: Ley 24.240 de Defensa del Consumidor",
    intro: "Como usuario de Luderis tenés derechos protegidos por la Ley 24.240. Acá te contamos cuáles son y cómo ejercerlos.",
    rights: [
      { t: "Información clara", d: "Tenés derecho a información veraz, detallada y suficiente sobre los servicios que contratás." },
      { t: "Precio transparente", d: "El precio informado en la plataforma es el precio final. No pueden existir cargos ocultos." },
      { t: "Arrepentimiento", d: "Podés cancelar una compra online dentro de las 72 hs sin dar explicaciones (art. 34, Ley 24.240)." },
      { t: "Datos personales", d: "Tus datos no pueden cederse sin tu consentimiento (Ley 25.326)." },
      { t: "Trato digno", d: "Tenés derecho a un trato respetuoso y sin discriminación." },
      { t: "Reclamo gratuito", d: "Podés reclamar ante Luderis o ante organismos públicos sin costo alguno." },
    ],
    sections: [
      { t: "1. Cómo reclamar ante Luderis", p: ["Escribinos a contacto@luderis.com o usá el Libro de Quejas digital. Tenés respuesta dentro de los 10 días hábiles."] },
      { t: "2. Organismos oficiales de defensa", p: ["Podés acudir a la Dirección Nacional de Defensa del Consumidor o a la autoridad local de tu jurisdicción."] },
      { t: "3. COPREC — Conciliación gratuita", p: ["El Servicio de Conciliación Previa en las Relaciones de Consumo (COPREC) ofrece una instancia gratuita de conciliación antes de la vía judicial."] },
      { t: "4. Garantías legales", p: ["Los servicios contratados gozan de las garantías previstas por la ley. Ante incumplimientos podés exigir el cumplimiento, la sustitución o la devolución."] },
    ],
  },
};

// FAQ de Ayuda
window.LUDERIS.AYUDA = [
  { id: "cuenta", icon: "user", titulo: "Cuenta y acceso", desc: "Registro, contraseña y perfil", preguntas: [
    { q: "¿Cómo me registro en Luderis?", a: "Podés registrarte con tu email y una contraseña, o directamente con tu cuenta de Google. Hacé clic en Ingresar y elegí Crear cuenta. Te lleva un par de minutos." },
    { q: "Olvidé mi contraseña, ¿qué hago?", a: "En la pantalla de login hacé clic en ¿Olvidaste tu contraseña? e ingresá tu email. Te mandamos un link para resetearla. Revisá también el spam." },
    { q: "¿Puedo ser alumno y docente a la vez?", a: "Sí. Luderis permite el rol ambos: podés inscribirte en cursos y publicar tus propias clases desde la misma cuenta." },
    { q: "¿Cómo cambio mi foto o datos de perfil?", a: "Andá a Mi cuenta, tocá tu nombre o foto y editá los datos que quieras: nombre, bio, ubicación y foto." },
  ] },
  { id: "pagos", icon: "trending-up", titulo: "Pagos y cobros", desc: "Métodos, comisiones y acreditaciones", preguntas: [
    { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos pagos a través de MercadoPago: tarjetas de crédito y débito, dinero en cuenta y transferencia bancaria." },
    { q: "¿Cuánto cobra Luderis de comisión?", a: "Cobramos una comisión transparente sobre cada operación, que se te informa antes de confirmar. No hay costos de alta ni mensualidades." },
    { q: "¿Cuándo recibo mi dinero como docente?", a: "Los cobros se acreditan en tu cuenta de MercadoPago según los plazos del procesador, una vez confirmada la clase." },
  ] },
  { id: "alumno", icon: "graduation-cap", titulo: "Como alumno", desc: "Inscripciones, clases y reseñas", preguntas: [
    { q: "¿Cómo me inscribo en una clase?", a: "Buscá la clase que te interese, abrí la publicación y tocá Inscribirme. Coordinás el resto con el docente por el chat de la plataforma." },
    { q: "¿Puedo probar antes de pagar?", a: "Muchos docentes ofrecen una clase de prueba gratis. Vas a ver el distintivo Prueba gratis en la tarjeta de la publicación." },
    { q: "¿Cómo dejo una reseña?", a: "Al finalizar un curso te aparece la opción de valorarlo desde Mis clases. Tu reseña ayuda a otros alumnos a elegir." },
  ] },
  { id: "docente", icon: "megaphone", titulo: "Como docente", desc: "Publicar, gestionar y crecer", preguntas: [
    { q: "¿Cómo publico mi primera clase?", a: "Tocá Publicar, elegí el tipo (curso o clase particular), completá los datos y precio, y enviá a verificación. Es gratis." },
    { q: "¿Cómo me verifican como docente?", a: "Validamos tu identidad y tus conocimientos antes de publicar. Una vez aprobado, recibís la insignia de docente verificado." },
    { q: "¿Puedo responder pedidos de alumnos?", a: "Sí. En la sección Pedidos vas a ver alumnos buscando docentes. Podés ofrecerte directamente desde ahí." },
  ] },
  { id: "chat", icon: "message-circle", titulo: "Comunicación", desc: "Chats y coordinación", preguntas: [
    { q: "¿Cómo me comunico con un docente?", a: "Desde cualquier publicación tocás Chatear. Toda la comunicación queda dentro de la plataforma para tu seguridad." },
    { q: "¿Por qué no puedo compartir mi email?", a: "Para protegerte, las comunicaciones pasan por la plataforma. Compartir contactos privados antes de coordinar va contra los Términos." },
  ] },
  { id: "seguridad", icon: "badge-check", titulo: "Seguridad y reportes", desc: "Privacidad, denuncias y soporte", preguntas: [
    { q: "¿Cómo reporto a un usuario?", a: "En cada publicación o chat tenés la opción de denunciar. Nuestro equipo revisa cada reporte y toma medidas." },
    { q: "¿Mis datos están seguros?", a: "Sí. Aplicamos cifrado y control de accesos, y tu email nunca se comparte con otros usuarios. Ver la Política de Privacidad." },
  ] },
];
