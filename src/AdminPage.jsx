import React, { useState, useEffect, useCallback } from "react";
import * as sb from "./supabase";
import { C, FONT, toast, fmt, fmtRel, fmtPrice, safeDisplayName, Avatar, Spinner, Btn, useConfirm, logError } from "./shared";

// ─── ADMIN EMAILS — solo estos pueden acceder ─────────────────────────────────
const FALLBACK_ADMIN = "salvadordevedia@gmail.com";

// ─── DB DIRECTO (usa anon key para lecturas admin — requiere RLS permisivo o service role) ──
const SUPA_URL = "https://hptdyehzqfpgtrpuydny.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g";

const adminDb = async (path, method = "GET", body = null, token) => {
  const h = { "apikey": ANON_KEY, "Authorization": `Bearer ${token || ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" };
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : [];
};

// ─── CONFIG PERSISTIDA EN LOCALSTORAGE ───────────────────────────────────────
// Admin action via Edge Function (bypasea RLS con service role)
const adminAction = async (action, params, token) => {
  const res = await fetch("https://hptdyehzqfpgtrpuydny.supabase.co/functions/v1/admin-actions", {
    method: "POST",
    headers: {"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g", "x-user-token": token},
    body: JSON.stringify({action, ...params}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
};

const getConfig = () => { try { return JSON.parse(localStorage.getItem("ldrs_admin_cfg") || "{}"); } catch { return {}; } };
const saveConfig = (cfg) => { try { localStorage.setItem("ldrs_admin_cfg", JSON.stringify({ ...getConfig(), ...cfg })); } catch {} };

// ─── COMPONENTES UI ───────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px", ...style }}>
    {children}
  </div>
);

const StatBox = ({ label, value, sub, color = C.accent, icon }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ fontSize: 22 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: FONT, lineHeight: 1 }}>{value ?? "—"}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FONT }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT }}>{sub}</div>}
  </div>
);

const Badge = ({ children, color = C.accent }) => (
  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: color + "18", color, border: `1px solid ${color}40`, whiteSpace: "nowrap", fontFamily: FONT }}>
    {children}
  </span>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick}
    style={{ background: active ? C.accent : "transparent", color: active ? "#fff" : C.muted, border: `1px solid ${active ? C.accent : C.border}`, borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: active ? 700 : 400, cursor: "pointer", fontFamily: FONT, transition: "all .15s" }}>
    {label}
  </button>
);

const SearchInput = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, outline: "none", fontFamily: FONT, width: "100%", boxSizing: "border-box" }} />
);

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "📊 Resumen", },
  { id: "docentes", label: "🎓 Docentes" },
  { id: "users", label: "👥 Usuarios" },
  { id: "pubs", label: "📋 Publicaciones" },
  { id: "reports", label: "🚨 Denuncias" },
  { id: "payments", label: "💰 Pagos" },
  { id: "notifs", label: "📣 Anuncios" },
  { id: "config", label: "⚙️ Configuración" },
];

export default function AdminPage({ session, onClose, onChatUser }) {
  const [tab, setTab] = useState("overview");
  const [isAdmin, setIsAdmin] = React.useState(session?.user?.email === FALLBACK_ADMIN);
  const [checkingAdmin, setCheckingAdmin] = React.useState(session?.user?.email !== FALLBACK_ADMIN);

  React.useEffect(() => {
    if (session?.user?.email === FALLBACK_ADMIN) { setIsAdmin(true); setCheckingAdmin(false); return; }
    let mounted=true;
    // Check rol in DB
    adminDb(`usuarios?email=eq.${encodeURIComponent(session.user.email)}&select=rol`, "GET", null, session.access_token)
      .then(rows => { if(mounted)setIsAdmin(rows?.[0]?.rol === "admin"); })
      .catch(() => { if(mounted)setIsAdmin(false); })
      .finally(() => { if(mounted)setCheckingAdmin(false); });
    return()=>{mounted=false;};
  }, [session]);

  if (checkingAdmin) return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner />
    </div>
  );

  if (!isAdmin) return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Acceso restringido</div>
        <div style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>No tenés permisos para ver este panel.</div>
        <Btn onClick={onClose}>Volver</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 500, overflowY: "auto", fontFamily: FONT }}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: FONT }}>← Salir</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="Luderis" style={{ width: 24, height: 24, objectFit: "contain" }} onError={e=>e.target.style.display="none"}/>
          <div style={{ fontWeight: 800, fontSize: 17, color: C.text }}>Panel de Administración</div>
        </div>
          <div style={{ fontSize: 11, color: C.muted }}>Luderis · {session.user.email}</div>
        </div>
        <div style={{ fontSize: 11, color: C.muted, background: C.bg, padding: "4px 10px", borderRadius: 20, border: `1px solid ${C.border}` }}>🟢 En vivo</div>
      </div>

      {/* Tab bar */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 8px", display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: "none", border: "none", borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent", color: tab === t.id ? C.accent : C.muted, padding: "12px 10px", fontSize: 12, fontWeight: tab === t.id ? 700 : 400, cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap", transition: "all .15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
        {tab === "overview" && <OverviewTab session={session} />}
        {tab === "docentes" && <DocentesTab session={session} />}
        {tab === "users" && <UsersTab session={session} onChatUser={onChatUser} />}
        {tab === "pubs" && <PubsTab session={session} />}
        {tab === "reports" && <ReportsTab session={session} />}
        {tab === "payments" && <PaymentsTab session={session} />}
        {tab === "notifs" && <NotifsTab session={session} />}
        {tab === "config" && <ConfigTab session={session} />}
      </div>
    </div>
  );
}

// ─── TAB: RESUMEN ─────────────────────────────────────────────────────────────
function OverviewTab({ session }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actividad, setActividad] = useState([]);

  useEffect(() => {
    let mounted=true;
    Promise.all([
      adminDb("usuarios?select=id,created_at,email,rol,bloqueado", "GET", null, session.access_token).catch(e=>{logError("admin/usuarios",e);return[];}),
      adminDb("publicaciones?select=id,created_at,activo,tipo,precio,moneda,materia,autor_email,autor_nombre", "GET", null, session.access_token).catch(e=>{logError("admin/publicaciones",e);return[];}),
      adminDb("inscripciones?select=id,created_at,publicacion_id", "GET", null, session.access_token).catch(e=>{logError("admin/inscripciones",e);return[];}),
      adminDb("pagos?select=id,monto,estado,created_at", "GET", null, session.access_token).catch(e=>{logError("admin/pagos",e);return[];}),
      adminDb("denuncias?select=id,created_at,revisada", "GET", null, session.access_token).catch(e=>{logError("admin/denuncias",e);return[];}),
      adminDb("rese%C3%B1as?select=id,estrellas,created_at", "GET", null, session.access_token).catch(e=>{logError("admin/reseñas",e);return[];}),
    ]).then(([users, pubs, insc, pagos, denuncias, resenas]) => {
      if(!mounted)return;
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const semana = new Date(hoy); semana.setDate(semana.getDate() - 7);
      const mes = new Date(hoy); mes.setDate(mes.getDate() - 30);

      const pagosAprobados = pagos.filter(p => p.estado === "approved" || p.estado === "succeeded");
      const ingresoTotal = pagosAprobados.reduce((a, p) => a + (Number(p.monto) || 0), 0);

      // Ingresos por tipo de clase (particular vs curso)
      const ingresosPorTipo = {};
      pagosAprobados.forEach(p => {
        const tipo = p.modo || "otro";
        if (!ingresosPorTipo[tipo]) ingresosPorTipo[tipo] = { monto: 0, count: 0 };
        ingresosPorTipo[tipo].monto += Number(p.monto) || 0;
        ingresosPorTipo[tipo].count++;
      });

      // Top materias por publicaciones
      const materiaCount = {};
      pubs.forEach(p => { if(p.materia) materiaCount[p.materia] = (materiaCount[p.materia]||0)+1; });
      const topMaterias = Object.entries(materiaCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

      const comisionPct = Number(getConfig().comision_pct) || 10;

      // KPIs de denuncias
      const motivoCount = {};
      denuncias.forEach(d => { if(d.motivo) motivoCount[d.motivo] = (motivoCount[d.motivo]||0)+1; });
      const denResueltas = denuncias.filter(d => d.revisada).length;
      const accionesMap = {};
      denuncias.filter(d=>d.accion_tomada).forEach(d=>{accionesMap[d.accion_tomada]=(accionesMap[d.accion_tomada]||0)+1;});

      // Métricas adicionales
      const pubsInactivas = pubs.filter(p => p.activo === false).length;
      const pubsActivas = pubs.filter(p => p.activo !== false).length;
      const usuariosBloqueados = users.filter(u => u.bloqueado).length;
      const usuariosPorRol = users.reduce((acc, u) => { const r = u.rol || "alumno"; acc[r] = (acc[r]||0)+1; return acc; }, {});
      const ratingPromedio = resenas.length > 0 ? (resenas.reduce((a,r)=>a+(Number(r.estrellas)||0),0)/resenas.length).toFixed(1) : null;
      const nuevosUltimoMes = users.filter(u => new Date(u.created_at) >= mes).length;

      // Cohort: últimos 7 días — nuevos usuarios y nuevas inscripciones por día
      const cohortUsuarios = Array.from({length:7},(_,i)=>{
        const d = new Date(hoy); d.setDate(d.getDate() - (6-i));
        const next = new Date(d); next.setDate(next.getDate()+1);
        return { dia: d.toLocaleDateString("es-AR",{weekday:"short"}), count: users.filter(u=>{ const t=new Date(u.created_at); return t>=d&&t<next; }).length };
      });
      const cohortInscripciones = Array.from({length:7},(_,i)=>{
        const d = new Date(hoy); d.setDate(d.getDate() - (6-i));
        const next = new Date(d); next.setDate(next.getDate()+1);
        return { dia: d.toLocaleDateString("es-AR",{weekday:"short"}), count: insc.filter(x=>{ const t=new Date(x.created_at); return t>=d&&t<next; }).length };
      });

      // Top docentes por inscripciones
      const pubIdToAutor = {};
      pubs.forEach(p => { pubIdToAutor[p.id] = { email: p.autor_email, nombre: p.autor_nombre }; });
      const inscPorAutor = {};
      insc.forEach(i => {
        const autor = pubIdToAutor[i.publicacion_id];
        if (!autor?.email) return;
        if (!inscPorAutor[autor.email]) inscPorAutor[autor.email] = { nombre: autor.nombre, count: 0 };
        inscPorAutor[autor.email].count++;
      });
      const topDocentes = Object.entries(inscPorAutor).map(([email, d]) => ({ email, nombre: d.nombre, count: d.count })).sort((a,b)=>b.count-a.count).slice(0,5);

      setStats({
        totalUsuarios: users.length,
        nuevosHoy: users.filter(u => new Date(u.created_at) >= hoy).length,
        nuevosSemana: users.filter(u => new Date(u.created_at) >= semana).length,
        nuevosUltimoMes,
        totalPubs: pubs.length,
        pubsActivas,
        pubsInactivas,
        totalInscripciones: insc.length,
        inscSemana: insc.filter(i => new Date(i.created_at) >= semana).length,
        totalPagos: pagosAprobados.length,
        ingresoTotal,
        denunciasPendientes: denuncias.filter(d => !d.revisada).length,
        ingresosPorTipo,
        topMaterias,
        topDocentes,
        comisionPct,
        usuariosBloqueados,
        usuariosPorRol,
        ratingPromedio,
        cohortUsuarios,
        cohortInscripciones,
        inscPorPub: pubsActivas > 0 ? (insc.length / pubsActivas).toFixed(1) : "—",
        tasaResolucion: denuncias.length > 0 ? Math.round((denResueltas/denuncias.length)*100) : 0,
        denResueltas,
        accionesMap,
        kpiDenuncias: {
          total: denuncias.length,
          pendientes: denuncias.filter(d => !d.revisada).length,
          tasaResolucion: denuncias.length > 0 ? Math.round((denuncias.filter(d => d.revisada).length / denuncias.length) * 100) : 0,
          bloqueados: usuariosBloqueados,
          topMotivos: Object.entries(
            denuncias.reduce((acc, d) => { const m = d.motivo || "Sin especificar"; acc[m] = (acc[m]||0)+1; return acc; }, {})
          ).sort((a,b)=>b[1]-a[1]).slice(0,5),
        },
      });

      // Actividad reciente — últimas 20 acciones combinadas
      const items = [
        ...users.slice(-5).map(u => ({ tipo: "usuario", texto: `Nuevo usuario: ${u.email}`, time: u.created_at })),
        ...insc.slice(-5).map(i => ({ tipo: "inscripcion", texto: "Nueva inscripción", time: i.created_at })),
        ...pagosAprobados.slice(-5).map(p => ({ tipo: "pago", texto: `Pago aprobado: $${p.monto}`, time: p.created_at })),
        ...denuncias.filter(d => !d.revisada).slice(-3).map(d => ({ tipo: "denuncia", texto: "⚠ Nueva denuncia pendiente", time: d.created_at })),
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15);
      setActividad(items);
    }).finally(() => { if(mounted)setLoading(false); });
    return()=>{mounted=false;};
  }, [session]);

  if (loading) return <div style={{ padding: 40 }}><Spinner /></div>;
  if (!stats) return null;

  const ICON = { usuario: "👤", inscripcion: "🎓", pago: "💰", denuncia: "🚨" };
  const COLOR = { usuario: C.info, inscripcion: C.success, pago: "#F59E0B", denuncia: C.danger };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {stats.denunciasPendientes > 0 && (
        <div style={{ background: C.danger + "15", border: `1px solid ${C.danger}40`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <div style={{ fontWeight: 700, color: C.danger, fontSize: 14 }}>{stats.denunciasPendientes} denuncia{stats.denunciasPendientes > 1 ? "s" : ""} pendiente{stats.denunciasPendientes > 1 ? "s" : ""} de revisión</div>
            <div style={{ color: C.muted, fontSize: 12 }}>Revisalas en la pestaña Denuncias</div>
          </div>
        </div>
      )}

      {/* KPIs principales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 14 }}>
        <StatBox icon="👥" label="Usuarios totales" value={stats.totalUsuarios} sub={`+${stats.nuevosHoy} hoy · +${stats.nuevosSemana} esta semana`} color={C.info} />
        <StatBox icon="📋" label="Publicaciones" value={stats.totalPubs} sub={`${stats.pubsActivas} activas`} color={C.accent} />
        <StatBox icon="🎓" label="Inscripciones" value={stats.totalInscripciones} sub={`+${stats.inscSemana} esta semana`} color={C.success} />
        <StatBox icon="💰" label="Ingresos totales" value={`$${stats.ingresoTotal.toLocaleString("es-AR")}`} sub={`${stats.totalPagos} pagos aprobados`} color="#F59E0B" />
        <StatBox icon="🏦" label="Comisión Luderis" value={`$${Math.round(stats.ingresoTotal * (stats.comisionPct/100)).toLocaleString("es-AR")}`} sub={`${stats.comisionPct}% del total`} color="#8B5CF6" />
        <StatBox icon="📈" label="Ticket promedio" value={stats.totalPagos > 0 ? `$${Math.round(stats.ingresoTotal / stats.totalPagos).toLocaleString("es-AR")}` : "—"} sub="por transacción" color={C.accent} />
        <StatBox icon="🔄" label="Tasa conversión" value={stats.totalInscripciones > 0 ? `${Math.round((stats.totalPagos/stats.totalInscripciones)*100)}%` : "—"} sub="inscriptos que pagaron" color={C.success} />
        <StatBox icon="🚨" label="Denuncias pend." value={stats.denunciasPendientes} color={stats.denunciasPendientes > 0 ? C.danger : C.muted} />
      </div>

      {/* KPIs de denuncias */}
      {stats.topMotivos !== undefined && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          <Card>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>🚨 Motivos más frecuentes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.topMotivos.length === 0 ? <div style={{ color: C.muted, fontSize: 13 }}>Sin denuncias aún</div> :
                stats.topMotivos.map(([motivo, count]) => (
                  <div key={motivo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: C.text }}>{motivo}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ height: 6, borderRadius: 3, background: C.danger, width: Math.max(16, (count/stats.topMotivos[0]?.[1])*60) }} />
                      <span style={{ fontSize: 12, color: C.muted }}>{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
          <Card>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>📊 Estadísticas de moderación</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: C.muted }}>Tasa de resolución</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: stats.tasaResolucion >= 80 ? C.success : C.warn }}>{stats.tasaResolucion}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: C.muted }}>Resueltas / Total</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{stats.denResueltas} / {stats.denunciasPendientes + stats.denResueltas}</span>
              </div>
              {Object.entries(stats.accionesMap).map(([accion, count]) => (
                <div key={accion} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{accion}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* KPIs por categoría */}
      {stats.ingresosPorTipo && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          <Card>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>💰 Ingresos por tipo de clase</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(stats.ingresosPorTipo).map(([tipo, data]) => (
                <div key={tipo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{tipo === "particular" ? "🎯 Clases particulares" : tipo === "curso" ? "📚 Cursos" : `📋 ${tipo}`}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{data.count} inscripciones</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>${data.monto.toLocaleString("es-AR")}</div>
                </div>
              ))}
              {Object.keys(stats.ingresosPorTipo).length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>Sin datos aún</div>}
            </div>
          </Card>
          <Card>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>📚 Top materias por inscripciones</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.topMaterias.map(([materia, count], i) => (
                <div key={materia} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, minWidth: 16 }}>#{i+1}</span>
                    <span style={{ fontSize: 13, color: C.text }}>{materia}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ height: 6, borderRadius: 3, background: C.accent, width: Math.max(20, (count / stats.topMaterias[0]?.[1]) * 80) }} />
                    <span style={{ fontSize: 12, color: C.muted, minWidth: 20, textAlign: "right" }}>{count}</span>
                  </div>
                </div>
              ))}
              {stats.topMaterias.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>Sin datos aún</div>}
            </div>
          </Card>
        </div>
      )}

      {/* KPIs de denuncias */}
      {stats.kpiDenuncias && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          <Card>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>🚨 Métricas de denuncias</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.danger }}>{stats.kpiDenuncias.total}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Total denuncias</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.success }}>{stats.kpiDenuncias.tasaResolucion}%</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Tasa resolución</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.warn }}>{stats.kpiDenuncias.pendientes}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Pendientes</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#8B5CF6" }}>{stats.kpiDenuncias.bloqueados}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Usuarios bloqueados</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>📋 Motivos más frecuentes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.kpiDenuncias.topMotivos.map(([motivo, count]) => (
                <div key={motivo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.text }}>{motivo || "Sin especificar"}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ height: 6, borderRadius: 3, background: C.danger, width: Math.max(20, (count / (stats.kpiDenuncias.topMotivos[0]?.[1] || 1)) * 60) }} />
                    <span style={{ fontSize: 12, color: C.muted, minWidth: 16, textAlign: "right" }}>{count}</span>
                  </div>
                </div>
              ))}
              {stats.kpiDenuncias.topMotivos.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>Sin denuncias aún</div>}
            </div>
          </Card>
        </div>
      )}

      {/* Tendencia 7 días */}
      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>📈 Tendencia 7 días</div>
        {[
          { label: "Nuevos usuarios", data: stats.cohortUsuarios, color: C.info },
          { label: "Nuevas inscripciones", data: stats.cohortInscripciones, color: C.success },
        ].map(({ label, data, color }) => {
          const maxVal = Math.max(...data.map(d => d.count), 1);
          return (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 600 }}>{label}</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 44 }}>
                {data.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ fontSize: 9, color: C.muted }}>{d.count > 0 ? d.count : ""}</div>
                    <div style={{ width: "100%", background: color, borderRadius: "3px 3px 0 0", height: Math.max(3, (d.count / maxVal) * 34), opacity: d.count > 0 ? 0.85 : 0.15 }} />
                    <div style={{ fontSize: 9, color: C.muted }}>{d.dia}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Top docentes + Funnel conversión */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        <Card>
          <div style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>🏆 Top docentes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.topDocentes.length === 0 ? <div style={{ color: C.muted, fontSize: 13 }}>Sin datos aún</div> :
              stats.topDocentes.map((d, i) => (
                <div key={d.email} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, minWidth: 16 }}>#{i+1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: C.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nombre || d.email.split("@")[0]}</div>
                    <div style={{ fontSize: 10, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.email}</div>
                  </div>
                  <span style={{ fontSize: 12, color: C.info, fontWeight: 700, flexShrink: 0 }}>{d.count} insc.</span>
                </div>
              ))}
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>🎯 Funnel de conversión</div>
          {[
            { label: "Usuarios registrados", value: stats.totalUsuarios, pct: 100, color: C.info },
            { label: "Inscripciones totales", value: stats.totalInscripciones, pct: stats.totalUsuarios > 0 ? Math.round((stats.totalInscripciones / stats.totalUsuarios) * 100) : 0, color: C.success },
            { label: "Pagos aprobados", value: stats.totalPagos, pct: stats.totalInscripciones > 0 ? Math.round((stats.totalPagos / stats.totalInscripciones) * 100) : 0, color: "#F59E0B" },
          ].map(({ label, value, pct, color }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.text }}>{label}</span>
                <span style={{ fontSize: 12, color, fontWeight: 700 }}>{value} <span style={{ color: C.muted, fontWeight: 400 }}>({pct}%)</span></span>
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", background: color, borderRadius: 4, width: `${pct}%`, transition: "width .4s" }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>Insc. por usuario: <span style={{ color: C.text, fontWeight: 700 }}>{stats.inscPorPub}</span></div>
        </Card>
      </div>

      {/* Plataforma en números */}
      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>💤 Plataforma en números</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ background: C.bg, borderRadius: 10, padding: "10px 14px", minWidth: 100 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.danger }}>{stats.usuariosBloqueados}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Bloqueados</div>
          </div>
          <div style={{ background: C.bg, borderRadius: 10, padding: "10px 14px", minWidth: 100 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.warn }}>{stats.pubsInactivas}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Pubs. inactivas</div>
          </div>
          {stats.ratingPromedio && (
            <div style={{ background: C.bg, borderRadius: 10, padding: "10px 14px", minWidth: 100 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#F59E0B" }}>★ {stats.ratingPromedio}</div>
              <div style={{ fontSize: 11, color: C.muted }}>Rating promedio</div>
            </div>
          )}
          <div style={{ background: C.bg, borderRadius: 10, padding: "10px 14px", minWidth: 100 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.info }}>{stats.nuevosUltimoMes}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Nuevos (30d)</div>
          </div>
          {Object.entries(stats.usuariosPorRol).map(([rol, count]) => (
            <div key={rol} style={{ background: C.bg, borderRadius: 10, padding: "10px 14px", minWidth: 90 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>{count}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{rol === "admin" ? "Admins" : rol === "docente" ? "Docentes" : "Alumnos"}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 16 }}>Actividad reciente</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {actividad.length === 0 ? <div style={{ color: C.muted, fontSize: 13 }}>Sin actividad reciente</div> :
            actividad.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLOR[item.tipo], flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 13, color: C.text }}>{item.texto}</div>
                <div style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>{fmtRel(item.time)}</div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

// ─── TAB: DOCENTES ────────────────────────────────────────────────────────────
function DocentesTab({ session }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("inscripciones");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    let mounted=true;
    Promise.all([
      adminDb("publicaciones?select=id,titulo,autor_email,autor_nombre,activo,tipo,precio&tipo=eq.oferta", "GET", null, session.access_token).catch(() => []),
      adminDb("rese%C3%B1as?select=estrellas,publicacion_id", "GET", null, session.access_token).catch(() => []),
      adminDb("inscripciones?select=id,publicacion_id", "GET", null, session.access_token).catch(() => []),
    ]).then(([pubs, resenas, insc]) => {
      if(!mounted)return;
      // Build per-docente stats
      const docenteMap = {};
      pubs.forEach(p => {
        if (!p.autor_email) return;
        if (!docenteMap[p.autor_email]) docenteMap[p.autor_email] = { email: p.autor_email, nombre: p.autor_nombre, pubs: [], inscCount: 0, ratings: [] };
        docenteMap[p.autor_email].pubs.push(p);
      });
      const pubIdToAutor = {};
      pubs.forEach(p => { pubIdToAutor[p.id] = p.autor_email; });
      insc.forEach(i => {
        const ae = pubIdToAutor[i.publicacion_id];
        if (ae && docenteMap[ae]) docenteMap[ae].inscCount++;
      });
      resenas.forEach(r => {
        const ae = pubIdToAutor[r.publicacion_id];
        if (ae && docenteMap[ae]) docenteMap[ae].ratings.push(Number(r.estrellas)||0);
      });
      const result = Object.values(docenteMap).map(d => ({
        ...d,
        pubCount: d.pubs.length,
        ratingAvg: d.ratings.length > 0 ? (d.ratings.reduce((a,b)=>a+b,0)/d.ratings.length).toFixed(1) : null,
      }));
      setData(result);
    }).finally(() => { if(mounted)setLoading(false); });
    return()=>{mounted=false;};
  }, [session]);

  if (loading) return <div style={{ padding: 40 }}><Spinner /></div>;

  const sorted = [...data].sort((a, b) => sortBy === "rating" ? (b.ratingAvg||0) - (a.ratingAvg||0) : b.inscCount - a.inscCount);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 16 }}>🎓 Docentes ({data.length})</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[["inscripciones","Por inscripciones"],["rating","Por rating"]].map(([v,l]) => (
            <button key={v} onClick={() => setSortBy(v)}
              style={{ background: sortBy===v ? C.accent : "transparent", color: sortBy===v ? "#fff" : C.muted, border: `1px solid ${sortBy===v ? C.accent : C.border}`, borderRadius: 20, padding: "5px 13px", fontSize: 12, cursor: "pointer", fontFamily: FONT }}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowX: "auto" }}>
        {sorted.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>Sin docentes aún.</div>}
        {sorted.map(d => (
          <div key={d.email} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div onClick={() => setExpanded(expanded === d.email ? null : d.email)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.accent, fontSize: 15, flexShrink: 0 }}>
                {(d.nombre || d.email)[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{d.nombre || d.email.split("@")[0]}</div>
                <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.email}</div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.info }}>{d.inscCount}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Inscriptos</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>{d.pubCount}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Cursos</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#F59E0B" }}>{d.ratingAvg ? `★ ${d.ratingAvg}` : "—"}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Rating</div>
                </div>
                <span style={{ fontSize: 13, color: C.muted }}>{expanded === d.email ? "▲" : "▼"}</span>
              </div>
            </div>
            {expanded === d.email && (
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 16px", background: C.bg }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>PUBLICACIONES</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {d.pubs.map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.activo ? C.success : C.muted, flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.titulo}</div>
                      {p.precio && <span style={{ fontSize: 11, color: C.muted }}>${Number(p.precio).toLocaleString("es-AR")}</span>}
                      <span style={{ fontSize: 10, color: p.activo ? C.success : C.muted }}>{p.activo ? "activa" : "inactiva"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB: USUARIOS ────────────────────────────────────────────────────────────
function UsersTab({ session, onChatUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const {confirm:confirmU,confirmEl:confirmElU}=useConfirm();

  const cargar = useCallback(() => {
    setLoading(true);
    adminDb("usuarios?select=*&order=created_at.desc", "GET", null, session.access_token)
      .then(setUsers).catch(() => toast("Error cargando usuarios", "error"))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => { cargar(); }, [cargar]);

  const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = users.filter(u => {
    const q = norm(search);
    if (q && !norm(u.email).includes(q) && !norm(u.nombre).includes(q)) return false;
    if (filtro === "bloqueados" && !u.bloqueado) return false;
    if (filtro === "docentes" && u.rol !== "docente") return false;
    if (filtro === "alumnos" && u.rol !== "alumno") return false;
    return true;
  });

  const bloquear = async (u) => {
    if(actionLoading)return;
    setActionLoading(true);
    try {
      await adminAction("toggle_bloqueo", { user_id: u.id, bloqueado: !u.bloqueado }, session.access_token);
      setUsers(prev => prev.map(x => x.id === u.id ? {...x, bloqueado: !u.bloqueado} : x));
      toast(u.bloqueado ? "Usuario desbloqueado ✓" : "Usuario bloqueado ✓", "success");
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setActionLoading(false); }
  };

  const eliminar = async (u) => {
    if (!await confirmU({msg:`¿Eliminar el usuario ${u.email}? Esta acción no se puede deshacer.`,confirmLabel:"Eliminar",danger:true})) return;
    if(actionLoading)return;
    setActionLoading(true);
    try {
      await adminAction("eliminar_usuario", { user_id: u.id, user_email: u.email }, session.access_token);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast("Usuario eliminado ✓", "success");
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setActionLoading(false); }
  };

  const cambiarRol = async (u, rol) => {
    if(actionLoading)return;
    setActionLoading(true);
    try {
      await adminAction("cambiar_rol", { user_id: u.id, rol }, session.access_token);
      setUsers(prev => prev.map(x => x.id === u.id ? {...x, rol} : x));
      toast(`Rol cambiado a ${rol} ✓`, "success");
    } catch (e) {
      toast("Error: " + e.message, "error");
    }
    finally { setActionLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {confirmElU}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200 }}><SearchInput value={search} onChange={setSearch} placeholder="Buscar por email o nombre…" /></div>
        <div style={{ display: "flex", gap: 6 }}>
          {["todos", "docentes", "alumnos", "bloqueados"].map(f => <Pill key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} active={filtro === f} onClick={() => setFiltro(f)} />)}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Usuario", "Email", "Rol", "Estado", "Registrado", "Acciones"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: .3, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}`, background: u.bloqueado ? C.danger + "08" : "transparent" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar letra={(u.nombre || u.email)[0]} size={28} img={u.avatar_url} />
                        <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{u.nombre || u.email.split("@")[0]}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>{u.email}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <select value={u.rol || "alumno"} onChange={e => cambiarRol(u, e.target.value)}
                        style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px", color: C.text, fontSize: 12, cursor: "pointer", fontFamily: FONT }}>
                        <option value="alumno">Alumno</option>
                        <option value="docente">Docente</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {u.bloqueado ? <Badge color={C.danger}>Bloqueado</Badge> : <Badge color={C.success}>Activo</Badge>}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>{fmt(u.created_at)}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button onClick={() => bloquear(u)} disabled={actionLoading}
                          style={{ background: u.bloqueado ? C.success + "20" : C.warn + "20", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: u.bloqueado ? C.success : C.warn, cursor: "pointer", fontFamily: FONT }}>
                          {u.bloqueado ? "Desbloquear" : "Bloquear"}
                        </button>
                        <button onClick={() => { if(onChatUser) onChatUser(u); }}
                          style={{ background: C.info + "20", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: C.info, cursor: "pointer", fontFamily: FONT }}>
                          💬 Chat
                        </button>
                        <button onClick={() => eliminar(u)} disabled={actionLoading}
                          style={{ background: C.danger + "20", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: C.danger, cursor: "pointer", fontFamily: FONT }}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>Sin resultados</div>}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── TAB: PUBLICACIONES ───────────────────────────────────────────────────────
function PubsTab({ session }) {
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const {confirm:confirmP,confirmEl:confirmElP}=useConfirm();

  const cargar = useCallback(() => {
    setLoading(true);
    adminDb("publicaciones_con_autor?select=*&order=created_at.desc&limit=200", "GET", null, session.access_token)
      .then(setPubs).catch(() => adminDb("publicaciones?select=*&order=created_at.desc&limit=200", "GET", null, session.access_token).then(setPubs))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => { cargar(); }, [cargar]);

  const toggleActivo = async (pub) => {
    try {
      await adminAction("toggle_pub", { pub_id: pub.id, activo: !pub.activo }, session.access_token);
      setPubs(prev => prev.map(p => p.id === pub.id ? {...p, activo: !pub.activo} : p));
      toast(pub.activo ? "Publicación pausada ✓" : "Publicación activada ✓", "success");
    } catch (e) { toast("Error: " + e.message, "error"); }
  };

  const eliminar = async (pub) => {
    if (!await confirmP({msg:"¿Eliminar esta publicación?",confirmLabel:"Eliminar",danger:true})) return;
    try {
      await adminAction("eliminar_pub", { pub_id: pub.id }, session.access_token);
      setPubs(prev => prev.filter(p => p.id !== pub.id));
      toast("Publicación eliminada ✓", "success");
    } catch (e) { toast("Error: " + e.message, "error"); }
  };

  const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = pubs.filter(p => {
    const q = norm(search);
    if (q && !norm(p.titulo).includes(q) && !norm(p.autor_email).includes(q) && !norm(p.materia).includes(q)) return false;
    if (filtro === "activas" && !p.activo) return false;
    if (filtro === "pausadas" && p.activo) return false;
    if (filtro === "ofertas" && p.tipo !== "oferta") return false;
    if (filtro === "busquedas" && p.tipo !== "busqueda") return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {confirmElP}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200 }}><SearchInput value={search} onChange={setSearch} placeholder="Buscar por título, materia, autor…" /></div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[["todas","Todas"],["activas","Activas"],["pausadas","Pausadas"],["ofertas","Clases"],["busquedas","Pedidos"]].map(([f,l]) => <Pill key={f} label={l} active={filtro === f} onClick={() => setFiltro(f)} />)}
        </div>
      </div>

      <div style={{ color: C.muted, fontSize: 12 }}>{filtered.length} publicaciones</div>

      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(p => (
            <Card key={p.id} style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{p.titulo}</span>
                    <Badge color={p.tipo === "oferta" ? C.accent : "#F59E0B"}>{p.tipo === "oferta" ? "Clase" : "Pedido"}</Badge>
                    {p.activo ? <Badge color={C.success}>Activa</Badge> : <Badge color={C.muted}>Pausada</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>{p.autor_email} · {p.materia} · {fmt(p.created_at)}</div>
                  {p.precio && <div style={{ fontSize: 12, color: C.accent, marginTop: 4, fontWeight: 700 }}>{fmtPrice(p.precio, p.moneda)}</div>}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => toggleActivo(p)}
                    style={{ background: p.activo ? C.warn + "20" : C.success + "20", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: p.activo ? C.warn : C.success, cursor: "pointer", fontFamily: FONT }}>
                    {p.activo ? "Pausar" : "Activar"}
                  </button>
                  <button onClick={() => eliminar(p)}
                    style={{ background: C.danger + "20", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: C.danger, cursor: "pointer", fontFamily: FONT }}>
                    Eliminar
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: 32, fontSize: 13 }}>Sin resultados</div>}
        </div>
      )}
    </div>
  );
}

// ─── TAB: DENUNCIAS ───────────────────────────────────────────────────────────
function ReportsTab({ session }) {
  const [denuncias, setDenuncias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("pendientes");

  const cargar = useCallback(() => {
    setLoading(true);
    adminDb("denuncias?select=*&order=created_at.desc&limit=200", "GET", null, session.access_token)
      .then(setDenuncias).catch(() => toast("Error cargando denuncias", "error"))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => { cargar(); }, [cargar]);

  const resolver = async (d, accion) => {
    try {
      const emailBloq = d.autor_email || d.denunciado_email;
      await adminAction("resolver_denuncia", {
        denuncia_id: d.id, accion_tomada: accion,
        publicacion_id: d.publicacion_id || null,
        denunciado_email: emailBloq || null,
      }, session.access_token);
      setDenuncias(prev => prev.map(x => x.id === d.id ? {...x, revisada: true, accion_tomada: accion} : x));
      toast("Denuncia resuelta ✓", "success");
    } catch (e) { toast("Error: " + e.message, "error"); }
  };

  const filtered = denuncias.filter(d => {
    if (filtro === "pendientes") return !d.revisada;
    if (filtro === "resueltas") return d.revisada;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {["pendientes", "resueltas", "todas"].map(f => <Pill key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} active={filtro === f} onClick={() => setFiltro(f)} />)}
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(d => (
            <Card key={d.id} style={{ borderLeft: !d.revisada ? `3px solid ${C.danger}` : `3px solid ${C.success}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 18 }}>🚨</span>
                    <Badge color={d.revisada ? C.success : C.danger}>{d.revisada ? "Resuelta" : "Pendiente"}</Badge>
                    <span style={{ fontSize: 11, color: C.muted }}>{fmt(d.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}><strong>Motivo:</strong> {d.motivo || "Sin especificar"}</div>
                  {d.detalle && <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{d.detalle}</div>}
                  {d.denunciante_email && <div style={{ fontSize: 12, color: C.muted }}>Denunciante: {d.denunciante_email}</div>}
                  {d.autor_email && <div style={{ fontSize: 12, color: C.muted }}>Denunciado: {d.autor_email}</div>}
                  {d.publicacion_id && <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>Pub ID: {d.publicacion_id}</div>}
                  {d.accion_tomada && <div style={{ fontSize: 12, color: C.success, marginTop: 4 }}>✓ Acción: {d.accion_tomada}</div>}
                </div>
                {!d.revisada && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
                    <button onClick={() => resolver(d, "advertencia")}
                      style={{ background: C.warn + "20", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: C.warn, cursor: "pointer", fontFamily: FONT }}>
                      Advertencia
                    </button>
                    <button onClick={() => resolver(d, "eliminar_pub")}
                      style={{ background: C.danger + "20", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: C.danger, cursor: "pointer", fontFamily: FONT }}>
                      Eliminar pub
                    </button>
                    <button onClick={() => resolver(d, "bloquear_usuario")}
                      style={{ background: "#7B3FBE20", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#7B3FBE", cursor: "pointer", fontFamily: FONT }}>
                      Bloquear usuario
                    </button>
                    <button onClick={() => resolver(d, "desestimada")}
                      style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 11, color: C.muted, cursor: "pointer", fontFamily: FONT }}>
                      Desestimar
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: 32, fontSize: 13 }}>Sin denuncias {filtro}</div>}
        </div>
      )}
    </div>
  );
}

// ─── TAB: PAGOS ───────────────────────────────────────────────────────────────
function PaymentsTab({ session }) {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    setLoading(true);
    adminDb("pagos?select=*&order=created_at.desc&limit=200", "GET", null, session.access_token)
      .then(setPagos).catch(() => toast("Error cargando pagos", "error"))
      .finally(() => setLoading(false));
  }, [session]);

  const filtered = pagos.filter(p => {
    if (filtro === "aprobados") return p.estado === "approved" || p.estado === "succeeded";
    if (filtro === "pendientes") return p.estado === "pending";
    if (filtro === "rechazados") return p.estado === "rejected" || p.estado === "failed";
    return true;
  });

  const totalAprobado = filtered.filter(p => p.estado === "approved" || p.estado === "succeeded").reduce((a, p) => a + (Number(p.monto) || 0), 0);
  const ESTADO_COLOR = { approved: C.success, succeeded: C.success, pending: C.warn, rejected: C.danger, failed: C.danger };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {["todos", "aprobados", "pendientes", "rechazados"].map(f => <Pill key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} active={filtro === f} onClick={() => setFiltro(f)} />)}
        <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: C.accent }}>
          Total aprobado: ${totalAprobado.toLocaleString("es-AR")}
        </span>
      </div>

      {loading ? <Spinner /> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {["Fecha", "Alumno", "Docente", "Monto", "Estado", "Método"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: .3, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>{fmt(p.created_at)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.text }}>{p.alumno_email?.split("@")[0] || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.text }}>{p.docente_email?.split("@")[0] || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.accent }}>${Number(p.monto || 0).toLocaleString("es-AR")}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge color={ESTADO_COLOR[p.estado] || C.muted}>{p.estado || "—"}</Badge>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>{p.modo || "mp"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>Sin pagos</div>}
        </Card>
      )}
    </div>
  );
}

// ─── TAB: NOTIFICACIONES GLOBALES ─────────────────────────────────────────────
function NotifsTab({ session }) {
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipo, setTipo] = useState("info");
  const [loading, setLoading] = useState(false);
  const [enviadas, setEnviadas] = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);

  useEffect(() => {
    adminDb("anuncios_globales?select=*&order=created_at.desc&limit=20", "GET", null, session.access_token)
      .then(setEnviadas).catch(() => {})
      .finally(() => setLoadingHist(false));
  }, [session]);

  const enviar = async () => {
    if (!titulo.trim() || !mensaje.trim()) { toast("Completá título y mensaje", "warn"); return; }
    setLoading(true);
    try {
      const result = await adminAction("enviar_anuncio", { titulo, mensaje, tipo, enviada_por: session.user.email }, session.access_token);
      toast(`✓ Anuncio enviado a ${result.destinatarios} usuarios`, "success");
      setTitulo(""); setMensaje("");
      // Reload history
      adminDb("anuncios_globales?select=*&order=created_at.desc&limit=20", "GET", null, session.access_token).then(setEnviadas).catch(() => {});
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setLoading(false); }
  };

  const TIPO_COLORS = { info: C.info, warn: C.warn, success: C.success, danger: C.danger };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 16 }}>📣 Enviar anuncio global</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 6 }}>TIPO</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["info", "success", "warn", "danger"].map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  style={{ background: tipo === t ? TIPO_COLORS[t] : TIPO_COLORS[t] + "20", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: tipo === t ? "#fff" : TIPO_COLORS[t], cursor: "pointer", fontFamily: FONT }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 6 }}>TÍTULO</div>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Actualización importante de Luderis"
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 14, outline: "none", fontFamily: FONT, boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 6 }}>MENSAJE</div>
            <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Detalle de la notificación…" rows={3}
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 14, outline: "none", fontFamily: FONT, boxSizing: "border-box", resize: "vertical" }} />
          </div>
          <Btn onClick={enviar} disabled={loading} style={{ alignSelf: "flex-start" }}>
            {loading ? "Enviando…" : "📣 Publicar anuncio a todos los usuarios"}
          </Btn>
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 16 }}>Historial de anuncios</div>
        {loadingHist ? <Spinner /> : enviadas.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13 }}>Sin notificaciones enviadas aún</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {enviadas.map(n => (
              <div key={n.id} style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{n.titulo}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{fmt(n.created_at)} · {n.destinatarios} usuarios</span>
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>{n.mensaje}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── ROW Y TOGGLE (fuera de ConfigTab para evitar re-creación en cada render) ──
function CfgRow({ label, sub, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.border}`, gap: 16 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function CfgToggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? C.accent : C.border, border: "none", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: value ? 23 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
    </button>
  );
}

// ─── TAB: CONFIGURACIÓN ───────────────────────────────────────────────────────
const CFG_DEFAULTS = { comision_pct: 10, max_publicaciones_docente: 20, verificacion_ia_activa: true, mp_activo: true, stripe_activo: true };

function ConfigTab({ session }) {
  const [cfg, setCfg] = useState(CFG_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar config desde DB, fallback a localStorage
  useEffect(() => {
    adminDb("config?select=clave,valor&order=clave.asc", "GET", null, session.access_token)
      .then(rows => {
        const fromDb = {};
        rows.forEach(r => {
          try { fromDb[r.clave] = JSON.parse(r.valor); } catch { fromDb[r.clave] = r.valor; }
        });
        setCfg(prev => ({ ...prev, ...getConfig(), ...fromDb }));
      })
      .catch(() => {
        // Tabla config no existe aún — usar localStorage
        setCfg(prev => ({ ...prev, ...getConfig() }));
      })
      .finally(() => setLoading(false));
  }, [session]);

  const guardar = async () => {
    setSaving(true);
    saveConfig(cfg); // siempre guardar en localStorage como backup
    try {
      // Upsert cada clave en la tabla config via Edge Function (bypasea RLS)
      const rows = Object.entries(cfg).map(([clave, valor]) => ({
        clave, valor: JSON.stringify(valor), actualizado_por: session.user.email,
      }));
      await adminAction("upsert_config", { rows }, session.access_token);
      toast("✓ Configuración guardada en la DB", "success");
    } catch {
      // Si falla (tabla no existe), quedó en localStorage
      toast("✓ Configuración guardada localmente", "success");
    }
    setSaving(false);
  };

  const set = (key, val) => setCfg(p => ({ ...p, [key]: val }));

  if (loading) return <div style={{ padding: 40 }}><Spinner /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 4 }}>💰 Pagos y comisiones</div>
        <CfgRow label="Comisión de Luderis" sub="Porcentaje que retiene Luderis de cada transacción">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" min={0} max={50} value={cfg.comision_pct}
              onChange={e => set("comision_pct", Number(e.target.value))}
              style={{ width: 70, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 14, outline: "none", fontFamily: FONT, textAlign: "center" }} />
            <span style={{ color: C.muted, fontSize: 14 }}>%</span>
          </div>
        </CfgRow>
        <CfgRow label="Mercado Pago activo" sub="Habilitar pagos con MP">
          <CfgToggle value={cfg.mp_activo} onChange={v => set("mp_activo", v)} />
        </CfgRow>
        <CfgRow label="Stripe activo" sub="Habilitar pagos con tarjeta (USD/EUR)">
          <CfgToggle value={cfg.stripe_activo} onChange={v => set("stripe_activo", v)} />
        </CfgRow>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 4 }}>🎓 Publicaciones</div>
        <CfgRow label="Máx. publicaciones por docente" sub="Límite de publicaciones activas por usuario">
          <input type="number" min={1} max={100} value={cfg.max_publicaciones_docente}
            onChange={e => set("max_publicaciones_docente", Number(e.target.value))}
            style={{ width: 70, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 14, outline: "none", fontFamily: FONT, textAlign: "center" }} />
        </CfgRow>
        <CfgRow label="Verificación IA activa" sub="Requerir verificación de conocimiento al publicar">
          <CfgToggle value={cfg.verificacion_ia_activa} onChange={v => set("verificacion_ia_activa", v)} />
        </CfgRow>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 8 }}>👤 Administradores</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 12, lineHeight: 1.6 }}>
          Cambiá el rol de un usuario a <strong>Admin</strong> desde la tabla de Usuarios para darle acceso al panel.
        </div>

      </Card>

      <Btn onClick={guardar} disabled={saving} style={{ alignSelf: "flex-start" }}>
        {saving ? "Guardando…" : "💾 Guardar configuración"}
      </Btn>
    </div>
  );
}
