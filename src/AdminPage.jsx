import React, { useState, useEffect, useCallback } from "react";
import * as sb from "./supabase";
import { C, FONT, toast, fmt, fmtRel, fmtPrice, safeDisplayName, Avatar, Spinner, Btn } from "./shared";

// ─── ADMIN EMAILS — solo estos pueden acceder ─────────────────────────────────
const ADMIN_EMAILS = ["salvadordevedia@gmail.com"];

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
  { id: "users", label: "👥 Usuarios" },
  { id: "pubs", label: "📋 Publicaciones" },
  { id: "reports", label: "🚨 Denuncias" },
  { id: "payments", label: "💰 Pagos" },
  { id: "notifs", label: "📣 Notificaciones" },
  { id: "config", label: "⚙️ Configuración" },
];

export default function AdminPage({ session, onClose }) {
  const [tab, setTab] = useState("overview");
  const isAdmin = ADMIN_EMAILS.includes(session?.user?.email);

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
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: FONT }}>← Salir</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: C.text }}>Panel de Administración</div>
          <div style={{ fontSize: 11, color: C.muted }}>Luderis · {session.user.email}</div>
        </div>
        <div style={{ fontSize: 11, color: C.muted, background: C.bg, padding: "4px 10px", borderRadius: 20, border: `1px solid ${C.border}` }}>🟢 En vivo</div>
      </div>

      {/* Tab bar */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: "none", border: "none", borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent", color: tab === t.id ? C.accent : C.muted, padding: "12px 14px", fontSize: 13, fontWeight: tab === t.id ? 700 : 400, cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap", transition: "all .15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
        {tab === "overview" && <OverviewTab session={session} />}
        {tab === "users" && <UsersTab session={session} />}
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
    Promise.all([
      adminDb("usuarios?select=id,created_at,email", "GET", null, session.access_token).catch(() => []),
      adminDb("publicaciones?select=id,created_at,activo,tipo,precio,moneda", "GET", null, session.access_token).catch(() => []),
      adminDb("inscripciones?select=id,created_at", "GET", null, session.access_token).catch(() => []),
      adminDb("pagos?select=id,monto,estado,created_at", "GET", null, session.access_token).catch(() => []),
      adminDb("denuncias?select=id,created_at,revisada", "GET", null, session.access_token).catch(() => []),
    ]).then(([users, pubs, insc, pagos, denuncias]) => {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const semana = new Date(hoy); semana.setDate(semana.getDate() - 7);
      const mes = new Date(hoy); mes.setDate(mes.getDate() - 30);

      const pagosAprobados = pagos.filter(p => p.estado === "approved" || p.estado === "succeeded");
      const ingresoTotal = pagosAprobados.reduce((a, p) => a + (Number(p.monto) || 0), 0);

      setStats({
        totalUsuarios: users.length,
        nuevosHoy: users.filter(u => new Date(u.created_at) >= hoy).length,
        nuevosSemana: users.filter(u => new Date(u.created_at) >= semana).length,
        totalPubs: pubs.length,
        pubsActivas: pubs.filter(p => p.activo).length,
        totalInscripciones: insc.length,
        inscSemana: insc.filter(i => new Date(i.created_at) >= semana).length,
        totalPagos: pagosAprobados.length,
        ingresoTotal,
        denunciasPendientes: denuncias.filter(d => !d.revisada).length,
      });

      // Actividad reciente — últimas 20 acciones combinadas
      const items = [
        ...users.slice(-5).map(u => ({ tipo: "usuario", texto: `Nuevo usuario: ${u.email}`, time: u.created_at })),
        ...insc.slice(-5).map(i => ({ tipo: "inscripcion", texto: "Nueva inscripción", time: i.created_at })),
        ...pagosAprobados.slice(-5).map(p => ({ tipo: "pago", texto: `Pago aprobado: $${p.monto}`, time: p.created_at })),
        ...denuncias.filter(d => !d.revisada).slice(-3).map(d => ({ tipo: "denuncia", texto: "⚠ Nueva denuncia pendiente", time: d.created_at })),
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15);
      setActividad(items);
    }).finally(() => setLoading(false));
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
        <StatBox icon="👥" label="Usuarios totales" value={stats.totalUsuarios} sub={`+${stats.nuevosHoy} hoy · +${stats.nuevosSemana} esta semana`} color={C.info} />
        <StatBox icon="📋" label="Publicaciones" value={stats.totalPubs} sub={`${stats.pubsActivas} activas`} color={C.accent} />
        <StatBox icon="🎓" label="Inscripciones" value={stats.totalInscripciones} sub={`+${stats.inscSemana} esta semana`} color={C.success} />
        <StatBox icon="💰" label="Pagos aprobados" value={stats.totalPagos} sub={`Total: $${stats.ingresoTotal.toLocaleString("es-AR")}`} color="#F59E0B" />
        <StatBox icon="🚨" label="Denuncias pend." value={stats.denunciasPendientes} color={stats.denunciasPendientes > 0 ? C.danger : C.muted} />
      </div>

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

// ─── TAB: USUARIOS ────────────────────────────────────────────────────────────
function UsersTab({ session }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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
    setActionLoading(true);
    try {
      await adminDb(`usuarios?id=eq.${u.id}`, "PATCH", { bloqueado: !u.bloqueado }, session.access_token);
      toast(u.bloqueado ? "Usuario desbloqueado" : "Usuario bloqueado", "success");
      cargar(); setSelected(null);
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setActionLoading(false); }
  };

  const eliminar = async (u) => {
    if (!window.confirm(`¿Eliminar el usuario ${u.email}? Esta acción no se puede deshacer.`)) return;
    setActionLoading(true);
    try {
      await adminDb(`publicaciones?autor_id=eq.${u.id}`, "DELETE", null, session.access_token).catch(() => {});
      await adminDb(`usuarios?id=eq.${u.id}`, "DELETE", null, session.access_token);
      toast("Usuario eliminado", "success");
      cargar(); setSelected(null);
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setActionLoading(false); }
  };

  const cambiarRol = async (u, rol) => {
    setActionLoading(true);
    try {
      await adminDb(`usuarios?id=eq.${u.id}`, "PATCH", { rol }, session.access_token);
      toast(`Rol cambiado a ${rol}`, "success");
      cargar();
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setActionLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => bloquear(u)} disabled={actionLoading}
                          style={{ background: u.bloqueado ? C.success + "20" : C.warn + "20", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: u.bloqueado ? C.success : C.warn, cursor: "pointer", fontFamily: FONT }}>
                          {u.bloqueado ? "Desbloquear" : "Bloquear"}
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

  const cargar = useCallback(() => {
    setLoading(true);
    adminDb("publicaciones_con_autor?select=*&order=created_at.desc&limit=200", "GET", null, session.access_token)
      .then(setPubs).catch(() => adminDb("publicaciones?select=*&order=created_at.desc&limit=200", "GET", null, session.access_token).then(setPubs))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => { cargar(); }, [cargar]);

  const toggleActivo = async (pub) => {
    try {
      await adminDb(`publicaciones?id=eq.${pub.id}`, "PATCH", { activo: !pub.activo }, session.access_token);
      toast(pub.activo ? "Publicación pausada" : "Publicación activada", "success");
      cargar();
    } catch (e) { toast("Error: " + e.message, "error"); }
  };

  const eliminar = async (pub) => {
    if (!window.confirm("¿Eliminar esta publicación?")) return;
    try {
      await adminDb(`publicaciones?id=eq.${pub.id}`, "DELETE", null, session.access_token);
      toast("Publicación eliminada", "success");
      cargar();
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
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200 }}><SearchInput value={search} onChange={setSearch} placeholder="Buscar por título, materia, autor…" /></div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["todas", "activas", "pausadas", "ofertas", "busquedas"].map(f => <Pill key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} active={filtro === f} onClick={() => setFiltro(f)} />)}
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
                    <Badge color={p.tipo === "oferta" ? C.accent : "#F59E0B"}>{p.tipo === "oferta" ? "Clase" : "Búsqueda"}</Badge>
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
    adminDb("denuncias?select=*&order=created_at.desc", "GET", null, session.access_token)
      .then(setDenuncias).catch(() => toast("Error cargando denuncias", "error"))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => { cargar(); }, [cargar]);

  const resolver = async (d, accion) => {
    try {
      await adminDb(`denuncias?id=eq.${d.id}`, "PATCH", { revisada: true, accion_tomada: accion }, session.access_token);
      if (accion === "eliminar_pub" && d.publicacion_id) {
        await adminDb(`publicaciones?id=eq.${d.publicacion_id}`, "DELETE", null, session.access_token).catch(() => {});
      }
      if (accion === "bloquear_usuario" && d.denunciado_email) {
        const u = await adminDb(`usuarios?email=eq.${encodeURIComponent(d.denunciado_email)}`, "GET", null, session.access_token).catch(() => []);
        if (u[0]) await adminDb(`usuarios?id=eq.${u[0].id}`, "PATCH", { bloqueado: true }, session.access_token).catch(() => {});
      }
      toast("Denuncia resuelta", "success");
      cargar();
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
                  {d.descripcion && <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{d.descripcion}</div>}
                  {d.denunciante_email && <div style={{ fontSize: 12, color: C.muted }}>Denunciante: {d.denunciante_email}</div>}
                  {d.denunciado_email && <div style={{ fontSize: 12, color: C.muted }}>Denunciado: {d.denunciado_email}</div>}
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
    adminDb("notificaciones_globales?select=*&order=created_at.desc&limit=20", "GET", null, session.access_token)
      .then(setEnviadas).catch(() => {})
      .finally(() => setLoadingHist(false));
  }, [session]);

  const enviar = async () => {
    if (!titulo.trim() || !mensaje.trim()) { toast("Completá título y mensaje", "warn"); return; }
    setLoading(true);
    try {
      // Obtener todos los usuarios
      const users = await adminDb("usuarios?select=id,email", "GET", null, session.access_token);
      // Insertar notificación para cada usuario
      const batch = users.map(u => ({
        alumno_email: u.email,
        tipo: "sistema",
        pub_titulo: titulo,
        leida: false,
      }));
      // Insertar en lotes de 50
      for (let i = 0; i < batch.length; i += 50) {
        await adminDb("notificaciones", "POST", batch.slice(i, i + 50), session.access_token);
      }
      // Guardar en historial
      await adminDb("notificaciones_globales", "POST", { titulo, mensaje, tipo, enviada_por: session.user.email, destinatarios: users.length }, session.access_token).catch(() => {});
      toast(`Notificación enviada a ${users.length} usuarios`, "success");
      setTitulo(""); setMensaje("");
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setLoading(false); }
  };

  const TIPO_COLORS = { info: C.info, warn: C.warn, success: C.success, danger: C.danger };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 16 }}>📣 Enviar notificación global</div>
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
            {loading ? "Enviando…" : "📣 Enviar a todos los usuarios"}
          </Btn>
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 16 }}>Historial de notificaciones</div>
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

// ─── TAB: CONFIGURACIÓN ───────────────────────────────────────────────────────
function ConfigTab({ session }) {
  const [cfg, setCfg] = useState({ comision_pct: 10, max_publicaciones_docente: 20, verificacion_ia_activa: true, mp_activo: true, stripe_activo: true, admins: ADMIN_EMAILS.join(", ") });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = getConfig();
    setCfg(prev => ({ ...prev, ...stored }));
  }, []);

  const guardar = () => {
    setSaving(true);
    saveConfig(cfg);
    setTimeout(() => { setSaving(false); toast("Configuración guardada", "success"); }, 500);
  };

  const Row = ({ label, sub, children }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.border}`, gap: 16 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? C.accent : C.border, border: "none", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: value ? 23 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 4 }}>💰 Pagos y comisiones</div>
        <Row label="Comisión de Luderis" sub="Porcentaje que retiene Luderis de cada transacción">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" min={0} max={50} value={cfg.comision_pct}
              onChange={e => setCfg(p => ({ ...p, comision_pct: Number(e.target.value) }))}
              style={{ width: 70, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 14, outline: "none", fontFamily: FONT, textAlign: "center" }} />
            <span style={{ color: C.muted, fontSize: 14 }}>%</span>
          </div>
        </Row>
        <Row label="Mercado Pago activo" sub="Habilitar pagos con MP">
          <Toggle value={cfg.mp_activo} onChange={v => setCfg(p => ({ ...p, mp_activo: v }))} />
        </Row>
        <Row label="Stripe activo" sub="Habilitar pagos con tarjeta (USD/EUR)">
          <Toggle value={cfg.stripe_activo} onChange={v => setCfg(p => ({ ...p, stripe_activo: v }))} />
        </Row>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 4 }}>🎓 Publicaciones</div>
        <Row label="Máx. publicaciones por docente" sub="Límite de publicaciones activas por usuario">
          <input type="number" min={1} max={100} value={cfg.max_publicaciones_docente}
            onChange={e => setCfg(p => ({ ...p, max_publicaciones_docente: Number(e.target.value) }))}
            style={{ width: 70, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 14, outline: "none", fontFamily: FONT, textAlign: "center" }} />
        </Row>
        <Row label="Verificación IA activa" sub="Requerir verificación de conocimiento al publicar">
          <Toggle value={cfg.verificacion_ia_activa} onChange={v => setCfg(p => ({ ...p, verificacion_ia_activa: v }))} />
        </Row>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 4 }}>👤 Administradores</div>
        <Row label="Emails con acceso admin" sub="Separados por coma">
          <input value={cfg.admins} onChange={e => setCfg(p => ({ ...p, admins: e.target.value }))}
            style={{ width: 280, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 13, outline: "none", fontFamily: FONT }} />
        </Row>
      </Card>

      <Btn onClick={guardar} disabled={saving} style={{ alignSelf: "flex-start" }}>
        {saving ? "Guardando…" : "💾 Guardar configuración"}
      </Btn>

      <div style={{ fontSize: 11, color: C.muted }}>
        ⚠ La configuración se guarda localmente en este navegador. Para persistirla en la DB, se requiere una tabla <code>config</code> en Supabase.
      </div>
    </div>
  );
}
