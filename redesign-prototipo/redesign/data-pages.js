/* Datos mock para las páginas internas — agenda, chats, inscripciones, cuenta, juegos */
window.LUDERIS = window.LUDERIS || {};

// ── Usuario actual ────────────────────────────────────────────────────────
window.LUDERIS.ME = {
  nombre: "Camila Sánchez", email: "camila.sanchez@email.com",
  ciudad: "Buenos Aires", desde: "2024", rol: "ambos", materia: "Inglés",
  bio: "Profesora de inglés y estudiante de UX. Apasionada por enseñar y seguir aprendiendo.",
  rating: 4.9, reviews: 86, racha: 12,
};

// ── Mis clases (inscripciones + clases acordadas) ─────────────────────────
window.LUDERIS.INSCRIPCIONES = [
  { id: "i1", postId: "p1", titulo: "Inglés conversacional para adultos", docente: "María Belén Ríos", materia: "Idiomas", rol: "alumno", modalidad: "virtual", estado: "en_curso", estadoTxt: "En curso", diasFin: 18, progreso: 0.45, proxima: "Hoy 18:00", precio: 8500, tipo: "mes" },
  { id: "i2", postId: "p2", titulo: "Desarrollo web full-stack con React y Node", docente: "Tomás Alderete", materia: "Programación", rol: "alumno", modalidad: "virtual", estado: "inicia", estadoTxt: "Inicia en 2 días", diasIni: 2, progreso: 0, proxima: "Lun 10:00", precio: 24000, tipo: "mes" },
  { id: "i3", titulo: "Apoyo escolar primaria — matemática", docente: "Vos", materia: "Apoyo escolar", rol: "docente", modalidad: "presencial", estado: "en_curso", estadoTxt: "En curso", diasFin: 40, progreso: 0.3, proxima: "Mié 17:00", precio: 3800, tipo: "hora", alumnos: 3 },
  { id: "i4", titulo: "Preparación First de Cambridge", docente: "Vos", materia: "Idiomas", rol: "docente", modalidad: "virtual", estado: "finaliza", estadoTxt: "Finaliza mañana", diasFin: 1, progreso: 0.92, proxima: "Mañana 19:00", precio: 6000, tipo: "hora", alumnos: 1 },
  { id: "i5", postId: "p11", titulo: "Yoga y meditación para reducir el estrés", docente: "Agustina Ferro", materia: "Bienestar", rol: "alumno", modalidad: "virtual", estado: "hoy", estadoTxt: "Inicia hoy", diasIni: 0, progreso: 0, proxima: "Hoy 20:00", precio: 4000, tipo: "hora" },
  { id: "i6", postId: "p6", titulo: "Finanzas personales para principiantes", docente: "Federico Paz", materia: "Negocios", rol: "alumno", modalidad: "virtual", estado: "finalizada", estadoTxt: "Finalizada", progreso: 1, valorar: true, precio: 12000, tipo: "mes" },
];

// ── FAQs por post ─────────────────────────────────────────────────────────
window.LUDERIS.FAQS = {
  p1: [
    { q: "¿Cuántas clases por semana?", a: "El plan incluye 2 clases en vivo por semana de 60 minutos. También podés acceder al material grabado cuando quieras." },
    { q: "¿Qué nivel necesito para arrancar?", a: "El curso acepta desde nivel cero hasta intermedio. La primera clase es una evaluación de nivel para adaptar el plan a vos." },
    { q: "¿Puedo ver las grabaciones?", a: "Sí, todas las clases en vivo quedan disponibles en tu espacio por 60 días después de cada sesión." },
    { q: "¿Cómo cancelo o pauso?", a: "Podés pausar o cancelar con 72 hs de anticipación desde tu panel de Mis clases, sin cargo." },
  ],
  p2: [
    { q: "¿Necesito saber programar de antes?", a: "No es necesario, pero conviene tener nociones básicas de lógica. El curso arranca desde los fundamentos de JavaScript." },
    { q: "¿Cuánto tiempo lleva por semana?", a: "Recomendamos dedicar entre 10 y 15 horas semanales para seguir el ritmo del curso." },
    { q: "¿El portfolio queda en mi GitHub?", a: "Sí, los tres proyectos del curso los subís vos a tu GitHub. El docente te guía en cada paso." },
    { q: "¿Hay certificado al finalizar?", a: "Sí, Luderis emite un certificado digital verificable al completar el 80% del curso." },
  ],
  default: [
    { q: "¿Cómo funciona la primera clase?", a: "Es una presentación y diagnóstico de nivel para adaptar el plan de trabajo a tus objetivos." },
    { q: "¿Cómo me contacto con el docente?", a: "Podés escribirle directamente a través del chat de la plataforma desde el momento en que confirmás." },
    { q: "¿Qué pasa si necesito cancelar una clase?", a: "Cancelando con 24 hs de anticipación no hay cargo. Después de ese plazo se cobra el 50% de la sesión." },
    { q: "¿Hay garantía de devolución?", a: "Si después de la primera clase no quedás conforme, te devolvemos el importe completo sin preguntas." },
  ],
};

// ── Material de curso (por inscripción) ───────────────────────────────────
window.LUDERIS.MATERIAL = {
  i1: {
    unidades: [
      {
        titulo: "Unidad 1 — Primeros pasos",
        items: [
          { tipo: "video", label: "Introducción: qué vamos a hacer", dur: "8 min", visto: true },
          { tipo: "pdf",   label: "Guía de pronunciación — fonética básica", visto: true },
          { tipo: "link",  label: "Vocabulario interactivo — Quizlet Unidad 1", visto: true },
          { tipo: "tarea", label: "Ejercicio de escritura: presentación", entregado: true },
        ],
      },
      {
        titulo: "Unidad 2 — Presente simple y rutinas",
        items: [
          { tipo: "video", label: "Clase en vivo — 5 jun · Grabación", dur: "58 min", visto: true },
          { tipo: "pdf",   label: "Apuntes Unidad 2", visto: false },
          { tipo: "link",  label: "Practica de listening — BBC Learning English", visto: false },
          { tipo: "tarea", label: "Speaking: grabá un audio de 2 minutos", entregado: false },
        ],
      },
      {
        titulo: "Unidad 3 — Pasado simple",
        items: [
          { tipo: "video", label: "Clase en vivo — 8 jun · En vivo hoy 18:00", dur: null, visto: false, proximo: true },
          { tipo: "pdf",   label: "Material Unidad 3 — disponible tras la clase", bloqueado: true },
        ],
      },
    ],
  },
  i2: {
    unidades: [
      {
        titulo: "Módulo 1 — Fundamentos de JavaScript",
        items: [
          { tipo: "video", label: "Variables, tipos y funciones", dur: "42 min", visto: false },
          { tipo: "pdf",   label: "Guía de ejercicios JS", visto: false },
          { tipo: "tarea", label: "Mini-proyecto: calculadora en consola", entregado: false },
        ],
      },
    ],
  },
};

// ── Agenda — próximas clases (con día/hora) ───────────────────────────────
window.LUDERIS.AGENDA = [
  { id: "a1", titulo: "Inglés conversacional", con: "María Belén Ríos", rol: "alumno", dia: 0, hora: "18:00", dur: 60, modalidad: "virtual", materia: "Idiomas" },
  { id: "a2", titulo: "Yoga y meditación", con: "Agustina Ferro", rol: "alumno", dia: 0, hora: "20:00", dur: 45, modalidad: "virtual", materia: "Bienestar" },
  { id: "a3", titulo: "Apoyo escolar — Mateo", con: "Mateo (alumno)", rol: "docente", dia: 2, hora: "17:00", dur: 60, modalidad: "presencial", materia: "Apoyo escolar" },
  { id: "a4", titulo: "First de Cambridge — Paula", con: "Paula Ibáñez", rol: "docente", dia: 1, hora: "19:00", dur: 60, modalidad: "virtual", materia: "Idiomas" },
  { id: "a5", titulo: "Desarrollo web — clase 1", con: "Tomás Alderete", rol: "alumno", dia: 4, hora: "10:00", dur: 90, modalidad: "virtual", materia: "Programación" },
  { id: "a6", titulo: "Apoyo escolar — Sofía", con: "Sofía (alumna)", rol: "docente", dia: 4, hora: "16:00", dur: 60, modalidad: "presencial", materia: "Apoyo escolar" },
];

// ── Chats ─────────────────────────────────────────────────────────────────
window.LUDERIS.CHATS = [
  { id: "c1", persona: "María Belén Ríos", pub: "Inglés conversacional para adultos", ultimo: "Perfecto, nos vemos hoy a las 18 entonces 👍", hora: "10:42", unread: 0, tipo: "directo", online: true },
  { id: "c2", persona: "Tomás Alderete", pub: "Desarrollo web full-stack", ultimo: "Te paso el material antes de empezar el lunes.", hora: "9:15", unread: 2, tipo: "directo", online: false },
  { id: "c3", persona: "Paula Ibáñez", pub: "Necesito preparar examen First", ultimo: "¿Podemos pasar la clase del jueves a las 19?", hora: "Ayer", unread: 1, tipo: "directo", online: false },
  { id: "c4", persona: "Grupo · Apoyo escolar primaria", pub: "Apoyo escolar primaria — matemática", ultimo: "Recordatorio: mañana entregamos la guía 3.", hora: "Ayer", unread: 0, tipo: "grupo", online: false, miembros: 3 },
  { id: "c5", persona: "Agustina Ferro", pub: "Yoga y meditación", ultimo: "Traé ropa cómoda y una botella de agua 🧘", hora: "Lun", unread: 0, tipo: "directo", online: true },
  { id: "c6", persona: "Federico Paz", pub: "Finanzas personales", ultimo: "Gracias por el curso, lo recomendé a un amigo.", hora: "12 may", unread: 0, tipo: "directo", online: false },
];

// Conversación de ejemplo (para el panel de chat)
window.LUDERIS.CHAT_THREAD = [
  { de: "ellos", txt: "¡Hola Camila! Vi que te inscribiste al curso de inglés, ¡bienvenida! 😊", hora: "10:30" },
  { de: "mi", txt: "¡Hola María! Sí, tengo muchas ganas de arrancar.", hora: "10:34" },
  { de: "ellos", txt: "Genial. La primera clase es hoy a las 18:00 por videollamada. Te paso el link unos minutos antes.", hora: "10:36" },
  { de: "mi", txt: "Perfecto. ¿Necesito preparar algo para la primera clase?", hora: "10:38" },
  { de: "ellos", txt: "Nada en especial, sólo vení con ganas de hablar. Vamos a hacer una evaluación corta para ver tu nivel.", hora: "10:40" },
  { de: "ellos", txt: "Perfecto, nos vemos hoy a las 18 entonces 👍", hora: "10:42" },
];

// ── Juegos ──────────────────────────────────────────────────────────────────
window.LUDERIS.JUEGOS = [
  { id: "faros", nombre: "Faros", tagline: "Iluminá toda la grilla", icon: "lightbulb", grad: "linear-gradient(135deg,#1A6ED8,#0F9C82)", color: "#1A6ED8", done: true, tiempo: "1:42", racha: 12, reglas: "Colocá faros para iluminar cada celda sin que se apunten entre sí." },
  { id: "shikaku", nombre: "Shikaku", tagline: "Dividí la grilla en rectángulos", icon: "code", grad: "linear-gradient(135deg,#6A49DE,#B96A12)", color: "#6A49DE", done: false, tiempo: null, racha: 5, reglas: "Partí la grilla en rectángulos; cada uno con un número igual a su área." },
];
window.LUDERIS.LEADERBOARD = [
  { pos: 1, nombre: "Lucía M.", pts: 2840, racha: 31 },
  { pos: 2, nombre: "Joaquín R.", pts: 2610, racha: 24 },
  { pos: 3, nombre: "Camila Sánchez", pts: 2480, racha: 12, yo: true },
  { pos: 4, nombre: "Martín Q.", pts: 2210, racha: 9 },
  { pos: 5, nombre: "Sofía C.", pts: 1990, racha: 7 },
  { pos: 6, nombre: "Diego S.", pts: 1840, racha: 15 },
];

// ── Mi cuenta — actividad y stats ──────────────────────────────────────────
window.LUDERIS.ACTIVIDAD = { inscripto: 4, enCurso: 2, completados: 7 };
window.LUDERIS.DOCENTE_STATS = {
  publicaciones: 3, alumnosActivos: 4, vistasTotales: 2110, rating: 4.9, reviews: 86,
  ingresosEst: 64200, tasaRespuesta: 96,
  vistasSemana: [
    { d: "L", v: 210 }, { d: "M", v: 340 }, { d: "M", v: 280 }, { d: "J", v: 410 },
    { d: "V", v: 360 }, { d: "S", v: 190 }, { d: "D", v: 120 },
  ],
};

// ── Negociaciones (ofertas enviadas/recibidas) ────────────────────────────
window.LUDERIS.NEGOCIACIONES = [
  { id: "n1", tipo: "recibida", persona: "Esteban Ledesma", pub: "Mentor para proyecto final de bootcamp", monto: 8000, tipoPrecio: "hora", estado: "pendiente", hace: "hace 2 h", mensaje: "Hola, me interesa tu perfil. ¿Podemos arrancar esta semana?" },
  { id: "n2", tipo: "enviada", persona: "Julián Romero", pub: "Busco profe de piano para principiante", monto: 5000, tipoPrecio: "hora", estado: "aceptada", hace: "ayer", mensaje: "Te ofrezco clases los martes y jueves." },
  { id: "n3", tipo: "recibida", persona: "Paula Ibáñez", pub: "Preparar examen First de Cambridge", monto: 6000, tipoPrecio: "hora", estado: "contraoferta", hace: "hace 3 d", mensaje: "¿Podrías hacerlo a $5.500 la hora?" },
  { id: "n4", tipo: "enviada", persona: "Camila Núñez", pub: "Apoyo en química para 4° año", monto: 4500, tipoPrecio: "hora", estado: "rechazada", hace: "hace 5 d", mensaje: "Gracias, pero ya encontré a alguien." },
];

// ── Credenciales (títulos / certificados) ─────────────────────────────────
window.LUDERIS.CREDENCIALES = [
  { id: "cr1", tipo: "Título", titulo: "Profesorado de Inglés", institucion: "I.S.P. Joaquín V. González", anio: "2019", verificado: true },
  { id: "cr2", tipo: "Certificado", titulo: "C2 Proficiency (CPE)", institucion: "Cambridge English", anio: "2021", verificado: true },
  { id: "cr3", tipo: "Curso", titulo: "Diseño UX/UI", institucion: "Coderhouse", anio: "2023", verificado: false },
];

// ── Reseñas recibidas ──────────────────────────────────────────────────────
window.LUDERIS.RESENAS = [
  { id: "r1", autor: "Lucía Fernández", pub: "Inglés conversacional para adultos", rating: 5, fecha: "Mayo 2026", texto: "Camila es una genia. En tres meses pasé de no animarme a hablar a tener reuniones en inglés en el trabajo." },
  { id: "r2", autor: "Joaquín Pérez", pub: "Inglés conversacional para adultos", rating: 5, fecha: "Abril 2026", texto: "Clases súper dinámicas y material muy bueno. Explica con mucha paciencia." },
  { id: "r3", autor: "Marina Díaz", pub: "Preparación First de Cambridge", rating: 4, fecha: "Marzo 2026", texto: "Muy buena preparación, aprobé el examen. Me hubiera gustado un poco más de práctica oral." },
];

// ── Alertas de publicaciones ───────────────────────────────────────────────
window.LUDERIS.ALERTAS = [
  { id: "al1", criterio: "Clases de inglés online para adultos", activa: true, frecuencia: "Diaria", nuevos: 3 },
  { id: "al2", criterio: "Apoyo escolar de matemática en zona norte", activa: true, frecuencia: "Semanal", nuevos: 0 },
  { id: "al3", criterio: "Pedidos de programación con React", activa: false, frecuencia: "Diaria", nuevos: 0 },
];

// ── Referidos ───────────────────────────────────────────────────────────────
window.LUDERIS.REFERIDOS = {
  link: "luderis.com/r/camila86", invitados: 8, completados: 5, pendientes: 3, ganado: 12500,
  lista: [
    { nombre: "Andrea G.", estado: "completado", fecha: "12 may" },
    { nombre: "Pablo M.", estado: "completado", fecha: "8 may" },
    { nombre: "Rocío T.", estado: "pendiente", fecha: "3 may" },
    { nombre: "Lucas V.", estado: "completado", fecha: "28 abr" },
    { nombre: "Sofía R.", estado: "pendiente", fecha: "20 abr" },
  ],
};

// ── Finanzas ────────────────────────────────────────────────────────────────
window.LUDERIS.FINANZAS = {
  saldo: 38400, pendiente: 12000, cobradoMes: 64200, mpConectado: true,
  movimientos: [
    { id: "m1", concepto: "Pago de Lucía Fernández", pub: "Inglés conversacional", monto: 8500, fecha: "Hoy", tipo: "ingreso" },
    { id: "m2", concepto: "Retiro a cuenta bancaria", pub: "", monto: -20000, fecha: "Ayer", tipo: "retiro" },
    { id: "m3", concepto: "Pago de Joaquín Pérez", pub: "Inglés conversacional", monto: 8500, fecha: "2 jun", tipo: "ingreso" },
    { id: "m4", concepto: "Comisión Luderis", pub: "", monto: -1700, fecha: "2 jun", tipo: "comision" },
    { id: "m5", concepto: "Pago de Marina Díaz", pub: "First de Cambridge", monto: 6000, fecha: "30 may", tipo: "ingreso" },
  ],
};
