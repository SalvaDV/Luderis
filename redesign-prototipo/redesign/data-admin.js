/* Datos mock para el Panel de Administración */
window.LUDERIS = window.LUDERIS || {};

window.LUDERIS.ADMIN = {
  kpis: {
    usuarios: 4820, usuariosHoy: 23, usuariosSemana: 168,
    ingresos: 2_840_500, pagos: 612, comisionPct: 10,
    inscripciones: 1340, inscSemana: 47,
    conversion: 46, ticketProm: 4640,
    pubsActivas: 318, pubsInactivas: 41,
    rating: 4.8,
  },
  // serie de 7 días: usuarios nuevos e inscripciones
  serie: [
    { d: "Lun", u: 18, i: 5 },
    { d: "Mar", u: 24, i: 8 },
    { d: "Mié", u: 21, i: 6 },
    { d: "Jue", u: 31, i: 11 },
    { d: "Vie", u: 28, i: 9 },
    { d: "Sáb", u: 16, i: 4 },
    { d: "Dom", u: 23, i: 7 },
  ],
  roles: [
    { rol: "Alumnos", value: 3980, color: "#10B981" },
    { rol: "Docentes", value: 832, color: "#1A6ED8" },
    { rol: "Admins", value: 8, color: "#8B5CF6" },
  ],
  actividad: [
    { tipo: "usuario", txt: "Nuevo registro — lucia.fernandez@email.com", hace: "hace 4 min" },
    { tipo: "pago", txt: "Pago aprobado — $24.000 · Curso de React", hace: "hace 12 min" },
    { tipo: "denuncia", txt: "Nueva denuncia sobre publicación #2841", hace: "hace 31 min" },
    { tipo: "inscripcion", txt: "Inscripción — Inglés conversacional", hace: "hace 48 min" },
    { tipo: "queja", txt: "Queja recibida — demora en reembolso", hace: "hace 1 h" },
    { tipo: "usuario", txt: "Nuevo docente solicitó verificación", hace: "hace 2 h" },
  ],
  verificaciones: [
    { id: "v1", nombre: "Florencia Quiroga", email: "flor.quiroga@email.com", materia: "Matemática · Física", doc: "Profesorado UBA", hace: "hace 2 h" },
    { id: "v2", nombre: "Diego Sosa", email: "diego.sosa@email.com", materia: "Programación", doc: "Ing. en Sistemas UTN", hace: "hace 5 h" },
    { id: "v3", nombre: "Mariana Téllez", email: "m.tellez@email.com", materia: "Inglés", doc: "Traductorado + CELTA", hace: "hace 1 día" },
  ],
  usuarios: [
    { id: "u1", nombre: "Lucía Fernández", email: "lucia.fernandez@email.com", rol: "alumno", alta: "08 jun 2026", bloqueado: false },
    { id: "u2", nombre: "María Belén Ríos", email: "mb.rios@email.com", rol: "docente", alta: "12 mar 2026", bloqueado: false },
    { id: "u3", nombre: "Tomás Alderete", email: "tomas.a@email.com", rol: "docente", alta: "02 feb 2026", bloqueado: false },
    { id: "u4", nombre: "Juan Pérez", email: "jperez@email.com", rol: "alumno", alta: "21 may 2026", bloqueado: true },
    { id: "u5", nombre: "Camila Sánchez", email: "camila@email.com", rol: "admin", alta: "01 ene 2026", bloqueado: false },
    { id: "u6", nombre: "Ramiro Acosta", email: "r.acosta@email.com", rol: "docente", alta: "18 abr 2026", bloqueado: false },
  ],
  pubsList: [
    { id: "p2841", titulo: "Guitarra criolla y eléctrica", autor: "Lucas Vega", tipo: "Clase", precio: 5000, activo: true },
    { id: "p2840", titulo: "Desarrollo web full-stack", autor: "Tomás Alderete", tipo: "Curso", precio: 24000, activo: true },
    { id: "p2839", titulo: "Apoyo escolar primaria", autor: "Valentina Luna", tipo: "Clase", precio: 3800, activo: true },
    { id: "p2838", titulo: "Curso de criptomonedas 100% ganancia", autor: "Cuenta sospechosa", tipo: "Curso", precio: 99000, activo: false },
  ],
  pagos: [
    { id: "pg1", fecha: "08 jun", monto: 24000, alumno: "lucia.f@email.com", docente: "tomas.a@email.com", estado: "aprobado" },
    { id: "pg2", fecha: "08 jun", monto: 8500, alumno: "jose.m@email.com", docente: "mb.rios@email.com", estado: "aprobado" },
    { id: "pg3", fecha: "07 jun", monto: 6000, alumno: "ana.l@email.com", docente: "laura.g@email.com", estado: "en_disputa" },
    { id: "pg4", fecha: "07 jun", monto: 19500, alumno: "pedro.r@email.com", docente: "caro.m@email.com", estado: "aprobado" },
    { id: "pg5", fecha: "06 jun", monto: 4000, alumno: "sol.d@email.com", docente: "agus.f@email.com", estado: "reembolsado" },
  ],
  escrow: [
    { id: "e1", monto: 24000, docente: "tomas.a@email.com", alumno: "lucia.f@email.com", finaliza: "Libera en 2 días", estado: "retenido" },
    { id: "e2", monto: 6000, docente: "laura.g@email.com", alumno: "ana.l@email.com", finaliza: "En disputa", estado: "en_disputa" },
  ],
  retiros: [
    { id: "r1", docente: "María Belén Ríos", email: "mb.rios@email.com", monto: 76500, fecha: "07 jun", estado: "pendiente" },
    { id: "r2", docente: "Tomás Alderete", email: "tomas.a@email.com", monto: 216000, fecha: "06 jun", estado: "pendiente" },
  ],
  denuncias: [
    { id: "d1", motivo: "Contenido engañoso / estafa", sobre: "Publicación #2838 — Curso de criptomonedas", autor: "Cuenta sospechosa", hace: "hace 30 min", revisada: false },
    { id: "d2", motivo: "Lenguaje inapropiado en chat", sobre: "Usuario jperez@email.com", autor: "—", hace: "hace 3 h", revisada: false },
    { id: "d3", motivo: "Spam", sobre: "Publicación #2790", autor: "promo_xyz", hace: "ayer", revisada: true },
  ],
  anuncios: [
    { id: "a1", titulo: "Nueva política de reembolsos", mensaje: "A partir de julio, los reembolsos se procesan en 48 hs hábiles.", tipo: "info", fecha: "05 jun 2026", destinatarios: 4820 },
    { id: "a2", titulo: "Mantenimiento programado", mensaje: "El sábado 7/6 de 2 a 4 AM la plataforma estará en mantenimiento.", tipo: "warn", fecha: "03 jun 2026", destinatarios: 4790 },
    { id: "a3", titulo: "¡Llegamos a 800 docentes!", mensaje: "Gracias por hacer crecer la comunidad de Luderis.", tipo: "success", fecha: "28 may 2026", destinatarios: 4610 },
  ],
  docentes: [
    { email: "mb.rios@email.com", nombre: "María Belén Ríos", inscriptos: 340, cursos: 3, rating: 4.9, pubs: [
      { titulo: "Inglés conversacional para adultos", precio: 8500, activo: true },
      { titulo: "Preparación First de Cambridge", precio: 6000, activo: true },
      { titulo: "Inglés para viajar", precio: 4500, activo: false },
    ]},
    { email: "tomas.a@email.com", nombre: "Tomás Alderete", inscriptos: 218, cursos: 4, rating: 4.8, pubs: [
      { titulo: "Desarrollo web full-stack con React y Node", precio: 24000, activo: true },
      { titulo: "JavaScript desde cero", precio: 16000, activo: true },
    ]},
    { email: "caro.m@email.com", nombre: "Carolina Méndez", inscriptos: 130, cursos: 2, rating: 4.9, pubs: [
      { titulo: "Diseño UX/UI desde cero", precio: 19500, activo: true },
    ]},
    { email: "valen.luna@email.com", nombre: "Valentina Luna", inscriptos: 78, cursos: 1, rating: 5.0, pubs: [
      { titulo: "Apoyo escolar primaria", precio: 3800, activo: true },
    ]},
    { email: "r.acosta@email.com", nombre: "Ramiro Acosta", inscriptos: 88, cursos: 2, rating: 4.8, pubs: [
      { titulo: "Física universitaria — CBC", precio: 6500, activo: true },
    ]},
  ],
  quejas: [
    { id: "q1", numero: "QJ-2026-0148", nombre: "José Martínez", email: "jose.m@email.com", rol: "alumno", categoria: "Demora en reembolso", descripcion: "Cancelé un curso hace 10 días y todavía no recibí el reembolso.", estado: "recibida", fecha: "07 jun 2026" },
    { id: "q2", numero: "QJ-2026-0147", nombre: "Laura Giménez", email: "laura.g@email.com", rol: "docente", categoria: "Problema con cobro", descripcion: "No me aparece acreditado el pago de una alumna del mes pasado.", estado: "en_revision", fecha: "05 jun 2026" },
    { id: "q3", numero: "QJ-2026-0145", nombre: "Ana López", email: "ana.l@email.com", rol: "alumno", categoria: "Docente no se presentó", descripcion: "El docente no se conectó a la clase pactada y no respondió mensajes.", estado: "resuelta", fecha: "01 jun 2026" },
    { id: "q4", numero: "QJ-2026-0142", nombre: "Pedro Ruiz", email: "pedro.r@email.com", rol: "otro", categoria: "Consulta general", descripcion: "Quería saber cómo facturar como docente extranjero.", estado: "cerrada", fecha: "28 may 2026" },
  ],
  liquidaciones: [
    { id: "l1", docente: "mb.rios@email.com", periodo: "Mayo 2026", clases: 42, neto: 318000, comision: 35333 },
    { id: "l2", docente: "tomas.a@email.com", periodo: "Mayo 2026", clases: 28, neto: 604800, comision: 67200 },
    { id: "l3", docente: "caro.m@email.com", periodo: "Mayo 2026", clases: 16, neto: 280800, comision: 31200 },
    { id: "l4", docente: "valen.luna@email.com", periodo: "Mayo 2026", clases: 35, neto: 119700, comision: 13300 },
  ],
  antipuenteo: [
    { id: "ap1", autor: "lucas.vega@email.com", mensaje: "Mejor escribime al wsp 11-5•••-••••  así arreglamos directo", contra: "lucia.f@email.com", fecha: "08 jun · 14:22", advertencias: 0, revisada: false },
    { id: "ap2", autor: "promo_xyz@email.com", mensaje: "Pagame por transferencia a alias profe.mate y nos salteamos la comisión", contra: "jose.m@email.com", fecha: "07 jun · 19:40", advertencias: 2, revisada: false },
    { id: "ap3", autor: "carla.dev@email.com", mensaje: "te paso mi mail personal: carla•••@gmail.com", contra: "pedro.r@email.com", fecha: "06 jun · 10:05", advertencias: 1, revisada: true },
  ],
};
