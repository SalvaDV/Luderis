/* Datos para las pantallas que faltaban: notificaciones, perfil público, materias */
window.LUDERIS = window.LUDERIS || {};

window.LUDERIS.MATERIAS = [
  "Idiomas", "Programación", "Ciencia y Matemática", "Música", "Arte y Diseño",
  "Negocios y Finanzas", "Cocina", "Deportes", "Apoyo escolar", "Bienestar",
];

// Tipos de notificación con icono + acento (mapea a los del original)
window.LUDERIS.NOTIF_TIPOS = {
  nuevo_mensaje:       { icon: "message-circle", accent: "curso",  label: "Nuevo mensaje" },
  nueva_inscripcion:   { icon: "graduation-cap", accent: "curso",  label: "Nueva inscripción" },
  nueva_pregunta:      { icon: "lightbulb",      accent: "pedido", label: "Nueva pregunta" },
  pregunta_respondida: { icon: "check",          accent: "pedido", label: "Respondieron tu pregunta" },
  nueva_resena:        { icon: "star",           accent: "clase",  label: "Nueva reseña" },
  oferta_recibida:     { icon: "megaphone",      accent: "pedido", label: "Oferta recibida" },
  acuerdo_confirmado:  { icon: "badge-check",    accent: "curso",  label: "Acuerdo confirmado" },
  clase_proxima:       { icon: "calendar",       accent: "clase",  label: "Clase próxima" },
  pago_recibido:       { icon: "trending-up",    accent: "curso",  label: "Pago recibido" },
};

window.LUDERIS.NOTIFICACIONES = [
  { id: "n1", tipo: "nuevo_mensaje",      titulo: "Esteban Ledesma te escribió sobre “Mentor para proyecto final”", grupo: "Hoy", hace: "hace 12 min", leida: false },
  { id: "n2", tipo: "nueva_inscripcion",  titulo: "Lucía Fernández se inscribió en “Inglés conversacional para adultos”", grupo: "Hoy", hace: "hace 1 h", leida: false },
  { id: "n3", tipo: "oferta_recibida",    titulo: "Recibiste una oferta de $8.000/hora en tu pedido", grupo: "Hoy", hace: "hace 2 h", leida: false },
  { id: "n4", tipo: "clase_proxima",      titulo: "Tu clase de Inglés con Joaquín empieza en 1 hora", grupo: "Hoy", hace: "hace 3 h", leida: true },
  { id: "n5", tipo: "nueva_resena",       titulo: "Marina Díaz dejó una reseña de 4★ en “Preparación First”", grupo: "Ayer", hace: "ayer · 18:40", leida: true },
  { id: "n6", tipo: "pago_recibido",      titulo: "Acreditamos $8.500 por el pago de Lucía Fernández", grupo: "Ayer", hace: "ayer · 14:10", leida: true },
  { id: "n7", tipo: "pregunta_respondida",titulo: "Diego Sosa respondió tu pregunta sobre la clase de guitarra", grupo: "Ayer", hace: "ayer · 09:25", leida: true },
  { id: "n8", tipo: "acuerdo_confirmado", titulo: "Confirmaste el acuerdo con Julián Romero por clases de piano", grupo: "Esta semana", hace: "lun · 11:00", leida: true },
  { id: "n9", tipo: "nueva_pregunta",     titulo: "Te hicieron una pregunta en “Inglés conversacional para adultos”", grupo: "Esta semana", hace: "dom · 20:15", leida: true },
];

// Perfil público de docente (ejemplo: María Belén Ríos)
window.LUDERIS.PERFIL = {
  nombre: "María Belén Ríos", email: "mbrios", materia: "Idiomas", ciudad: "Online · GMT-3",
  verificado: true, rating: 4.9, reviews: 127, alumnos: 340, respuesta: "Responde en ~2 h",
  desde: "Docente desde 2021", idiomas: ["Español", "Inglés"],
  bio: "Profesora de Inglés con más de 8 años de experiencia. Me especializo en conversación para adultos y preparación de exámenes internacionales. Mi enfoque es práctico: vas a hablar desde la primera clase.",
  credenciales: [
    { tipo: "Título", titulo: "Profesorado de Inglés", institucion: "I.S.P. Joaquín V. González", anio: "2019", verificado: true },
    { tipo: "Certificado", titulo: "C2 Proficiency (CPE)", institucion: "Cambridge English", anio: "2021", verificado: true },
    { tipo: "Certificado", titulo: "TEFL — Teaching English", institucion: "International TEFL Academy", anio: "2020", verificado: true },
  ],
  resenas: [
    { id: "pr1", autor: "Lucía Fernández", rating: 5, fecha: "Mayo 2026", texto: "Una genia total. En tres meses pasé de no animarme a hablar a tener reuniones en inglés en el trabajo." },
    { id: "pr2", autor: "Joaquín Pérez", rating: 5, fecha: "Abril 2026", texto: "Clases súper dinámicas y material muy bueno. Mucha paciencia para explicar." },
    { id: "pr3", autor: "Marina Díaz", rating: 4, fecha: "Marzo 2026", texto: "Muy buena preparación, aprobé el First. Me hubiera gustado un poco más de práctica oral." },
  ],
};
