import React, { useState, useEffect, useCallback } from "react";
import * as sb from "./supabase";
import { SUPABASE_URL as SUPA_URL, SUPABASE_KEY as ANON_KEY } from "./supabase";
import { C, FONT, toast, fmt, fmtRel, fmtPrice, safeDisplayName, Avatar, Spinner, Btn, useConfirm, logError } from "./shared";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  LayoutDashboard, ShieldCheck, GraduationCap, Users, BookOpen,
  AlertTriangle, MessageSquare, BellOff, CreditCard, Package,
  FileText, Megaphone, Settings, TrendingUp, TrendingDown,
  DollarSign, UserCheck, BookMarked, BarChart2, RefreshCw,
  ChevronRight, LogOut, Activity
} from "lucide-react";

// Admin fallback email (optional, only for bootstrapping). Set REACT_APP_ADMIN_EMAIL in env to use.
const FALLBACK_ADMIN = (process.env.REACT_APP_ADMIN_EMAIL || "").toLowerCase();

const adminDb = async (path, method = "GET", body = null, token) => {
  const h = { "apikey": ANON_KEY, "Authorization": `Bearer ${token || ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" };
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : [];
};

// Admin action via Edge Function (bypasea RLS con service role)
const adminAction = async (action, params, token) => {
  const res = await fetch(`${SUPA_URL}/functions/v1/admin-actions`, {
    method: "POST",
    headers: {"Content-Type": "application/json", "apikey": ANON_KEY, "x-user-token": token},
    body: JSON.stringify({action, ...params}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
};

const getConfig = () => { try { return JSON.parse(localStorage.getItem("ldrs_admin_cfg") || "{}"); } catch { return {}; } };
const saveConfig = (cfg) => { try { localStorage.setItem("ldrs_admin_cfg", JSON.stringify({ ...getConfig(), ...cfg })); } catch {} };

// ─── ADMIN DESIGN TOKENS ─────────────────────────────────────────────────────
const A = {
  bg:      "var(--cl-bg, #F6F9FF)",
  surface: "var(--cl-surface, #FFFFFF)",
  card:    "var(--cl-surface, #FFFFFF)",
  border:  "var(--cl-border, #DDE5F5)",
  text:    "var(--cl-text, #0D1F3C)",
  muted:   "var(--cl-muted, #5A7294)",
  accent:  "#1A6ED8",
  success: "#10B981",
  warn:    "#F59E0B",
  danger:  "#EF4444",
  purple:  "#8B5CF6",
  info:    "#3B82F6",
  sidebar: "#0F1E3C",
  sidebarBorder: "rgba(255,255,255,0.08)",
  sidebarText: "rgba(255,255,255,0.65)",
  sidebarActive: "rgba(255,255,255,0.12)",
};

// ─── COMPONENTES UI ───────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: "20px 22px", ...style }}>
    {children}
  </div>
);

const Badge = ({ children, color = A.accent }) => (
  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: color + "18", color, border: `1px solid ${color}40`, whiteSpace: "nowrap", fontFamily: FONT }}>
    {children}
  </span>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick}
    style={{ background: active ? A.accent : "transparent", color: active ? "#fff" : A.muted, border: `1px solid ${active ? A.accent : A.border}`, borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: active ? 700 : 400, cursor: "pointer", fontFamily: FONT, transition: "all .15s" }}>
    {label}
  </button>
);

const SearchInput = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ background: A.bg, border: `1px solid ${A.border}`, borderRadius: 8, padding: "8px 12px", color: A.text, fontSize: 13, outline: "none", fontFamily: FONT, width: "100%", boxSizing: "border-box" }} />
);

const StatBox = ({ label, value, sub, color = A.accent, icon }) => (
  <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: A.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: FONT, lineHeight: 1 }}>{value ?? "—"}</div>
    {sub && <div style={{ fontSize: 11, color: A.muted, fontFamily: FONT }}>{sub}</div>}
  </div>
);

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, trendLabel, color = A.accent, Icon, sparkData }) {
  const trendUp = trend >= 0;
  return (
    <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {Icon && <Icon size={18} color={color} strokeWidth={2} />}
        </div>
        {trend != null && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: trendUp ? A.success : A.danger, background: (trendUp ? A.success : A.danger) + "15", padding: "3px 8px", borderRadius: 20 }}>
            {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trendUp ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 30, fontWeight: 800, color: A.text, lineHeight: 1, fontFamily: FONT, letterSpacing: "-1px" }}>{value ?? "—"}</div>
        <div style={{ fontSize: 13, color: A.muted, marginTop: 4, fontFamily: FONT }}>{label}</div>
      </div>
      {sparkData && sparkData.length > 0 && (
        <div style={{ height: 36 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="count" stroke={color} strokeWidth={1.5} fill={`url(#spark-${label})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {sub && <div style={{ fontSize: 11, color: A.muted, fontFamily: FONT }}>{sub}</div>}
      {trendLabel && <div style={{ fontSize: 11, color: A.muted, fontFamily: FONT }}>{trendLabel}</div>}
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const SIDEBAR_GROUPS = [
  {
    label: "Plataforma",
    items: [
      { id: "overview",       label: "Dashboard",      Icon: LayoutDashboard },
      { id: "verificaciones", label: "Verificaciones", Icon: ShieldCheck, badge: "verif" },
      { id: "pubs",           label: "Publicaciones",  Icon: BookOpen },
    ],
  },
  {
    label: "Usuarios",
    items: [
      { id: "docentes", label: "Docentes", Icon: GraduationCap },
      { id: "users",    label: "Usuarios", Icon: Users },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { id: "payments",      label: "Pagos",        Icon: CreditCard },
      { id: "escrow",        label: "Escrow",        Icon: Package },
      { id: "liquidaciones", label: "Liquidaciones", Icon: FileText },
    ],
  },
  {
    label: "Moderación",
    items: [
      { id: "reports",         label: "Denuncias",    Icon: AlertTriangle, badge: "reports" },
      { id: "quejas",          label: "Quejas",       Icon: MessageSquare },
      { id: "alertas_contacto",label: "Anti-puenteo", Icon: BellOff },
    ],
  },
  {
    label: "Sistema",
    items: [
      { id: "notifs", label: "Anuncios",      Icon: Megaphone },
      { id: "config", label: "Configuración", Icon: Settings },
    ],
  },
];

function Sidebar({ tab, setTab, pendingVerifCount, pendingReportsCount, onClose }) {
  return (
    <div style={{
      width: 220, minHeight: "100vh", background: A.sidebar, display: "flex", flexDirection: "column",
      position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: "auto",
      borderRight: `1px solid ${A.sidebarBorder}`,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${A.sidebarBorder}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="Luderis" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6 }} onError={e => e.target.style.display = "none"} />
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: FONT, letterSpacing: "-0.3px" }}>Luderis</div>
            <div style={{ color: A.sidebarText, fontSize: 10, fontFamily: FONT, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <div style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 20 }}>
        {SIDEBAR_GROUPS.map(group => (
          <div key={group.label}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, textTransform: "uppercase", padding: "0 10px", marginBottom: 4, fontFamily: FONT }}>
              {group.label}
            </div>
            {group.items.map(item => {
              const active = tab === item.id;
              const badgeCount = item.badge === "verif" ? pendingVerifCount : item.badge === "reports" ? pendingReportsCount : 0;
              return (
                <button key={item.id} onClick={() => setTab(item.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8,
                    background: active ? A.sidebarActive : "transparent",
                    border: "none", cursor: "pointer", fontFamily: FONT, transition: "background .15s",
                    marginBottom: 1,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                  <item.Icon size={15} color={active ? "#fff" : A.sidebarText} strokeWidth={active ? 2.5 : 1.8} />
                  <span style={{ flex: 1, fontSize: 13, color: active ? "#fff" : A.sidebarText, fontWeight: active ? 700 : 400, textAlign: "left" }}>
                    {item.label}
                  </span>
                  {badgeCount > 0 && (
                    <span style={{ background: "#EF4444", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "1px 6px", lineHeight: 1.5, minWidth: 18, textAlign: "center" }}>
                      {badgeCount}
                    </span>
                  )}
                  {active && <ChevronRight size={12} color="rgba(255,255,255,0.4)" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${A.sidebarBorder}`, flexShrink: 0 }}>
        <button onClick={onClose}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          <LogOut size={15} color={A.sidebarText} />
          <span style={{ fontSize: 13, color: A.sidebarText }}>Salir del panel</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminPage({ session, onClose, onChatUser }) {
  const [tab, setTab] = useState("overview");
  const [pendingVerifCount, setPendingVerifCount] = useState(0);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const userEmailLc = (session?.user?.email || "").toLowerCase();
  const isFallbackAdmin = !!FALLBACK_ADMIN && userEmailLc === FALLBACK_ADMIN;
  const [isAdmin, setIsAdmin] = React.useState(isFallbackAdmin);
  const [checkingAdmin, setCheckingAdmin] = React.useState(!isFallbackAdmin);

  React.useEffect(() => {
    if (isFallbackAdmin) { setIsAdmin(true); setCheckingAdmin(false); return; }
    let mounted = true;
    adminDb(`usuarios?email=eq.${encodeURIComponent(session.user.email)}&select=rol`, "GET", null, session.access_token)
      .then(rows => { if (mounted) setIsAdmin(rows?.[0]?.rol === "admin"); })
      .catch(() => { if (mounted) setIsAdmin(false); })
      .finally(() => { if (mounted) setCheckingAdmin(false); });
    return () => { mounted = false; };
  }, [session, isFallbackAdmin]);

  React.useEffect(() => {
    if (!isAdmin) return;
    sb.getVerificacionesPendientes(session.access_token)
      .then(rows => setPendingVerifCount(Array.isArray(rows) ? rows.length : 0))
      .catch(() => {});
    adminDb("denuncias?select=id&revisada=eq.false", "GET", null, session.access_token)
      .then(rows => setPendingReportsCount(Array.isArray(rows) ? rows.length : 0))
      .catch(() => {});
  }, [isAdmin, session.access_token]);

  const TAB_LABELS = {
    overview: "Dashboard", verificaciones: "Verificaciones", docentes: "Docentes",
    users: "Usuarios", pubs: "Publicaciones", reports: "Denuncias", quejas: "Quejas",
    alertas_contacto: "Anti-puenteo", payments: "Pagos", escrow: "Escrow",
    liquidaciones: "Liquidaciones", notifs: "Anuncios", config: "Configuración",
  };

  if (checkingAdmin) return (
    <div style={{ position: "fixed", inset: 0, background: A.bg, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner />
    </div>
  );

  if (!isAdmin) return (
    <div style={{ position: "fixed", inset: 0, background: A.bg, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: A.danger + "18", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <ShieldCheck size={28} color={A.danger} />
        </div>
        <div style={{ color: A.text, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Acceso restringido</div>
        <div style={{ color: A.muted, fontSize: 14, marginBottom: 24 }}>No tenés permisos para ver este panel.</div>
        <Btn onClick={onClose}>Volver</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: A.bg, zIndex: 500, fontFamily: FONT, display: "flex" }}>
      {/* Sidebar */}
      <Sidebar
        tab={tab} setTab={setTab}
        pendingVerifCount={pendingVerifCount}
        pendingReportsCount={pendingReportsCount}
        onClose={onClose}
      />

      {/* Main */}
      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflowY: "auto" }}>
        {/* Topbar */}
        <div style={{ background: A.surface, borderBottom: `1px solid ${A.border}`, padding: "0 28px", height: 56, display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: A.text, letterSpacing: "-0.3px" }}>{TAB_LABELS[tab] || tab}</div>
            <div style={{ fontSize: 11, color: A.muted }}>Luderis Admin · {session.user.email}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: A.success + "15", border: `1px solid ${A.success}40`, borderRadius: 20, padding: "4px 12px" }}>
              <Activity size={11} color={A.success} />
              <span style={{ fontSize: 11, fontWeight: 700, color: A.success, fontFamily: FONT }}>En vivo</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "28px 32px", maxWidth: 1280, width: "100%", boxSizing: "border-box" }}>
          {tab === "overview"         && <OverviewTab session={session} />}
          {tab === "verificaciones"   && <VerificacionesTab session={session} onCountChange={setPendingVerifCount} />}
          {tab === "docentes"         && <DocentesTab session={session} />}
          {tab === "users"            && <UsersTab session={session} onChatUser={onChatUser} />}
          {tab === "pubs"             && <PubsTab session={session} />}
          {tab === "reports"          && <ReportsTab session={session} />}
          {tab === "quejas"           && <QuejasTab session={session} />}
          {tab === "alertas_contacto" && <AlertasContactoTab session={session} />}
          {tab === "payments"         && <PaymentsTab session={session} />}
          {tab === "escrow"           && <EscrowTab session={session} />}
          {tab === "liquidaciones"    && <LiquidacionesTab session={session} />}
          {tab === "notifs"           && <NotifsTab session={session} />}
          {tab === "config"           && <ConfigTab session={session} />}
        </div>
      </div>
    </div>
  );
}

// ─── TAB: VERIFICACIONES ──────────────────────────────────────────────────────
function VerificacionesTab({ session, onCountChange }) {
  const [verifs, setVerifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null); // verificacion_id en curso
  const [razonRechazo, setRazonRechazo] = useState({}); // { [id]: string }
  const [mostrarRazon, setMostrarRazon] = useState({}); // { [id]: bool }

  const cargar = useCallback(async () => {
    setLoading(true);
    const rows = await sb.getVerificacionesPendientes(session.access_token).catch(() => []);
    setVerifs(rows);
    onCountChange(rows.length);
    setLoading(false);
  }, [session.access_token, onCountChange]);

  useEffect(() => { cargar(); }, [cargar]);

  const aprobar = async (v) => {
    if (procesando) return;
    setProcesando(v.id);
    try {
      await adminAction("aprobar_verificacion", { verificacion_id: v.id, user_id: v.usuario_id }, session.access_token);
      toast("✅ Docente aprobado. Se envió email de confirmación.");
      cargar();
    } catch (e) {
      toast("Error: " + e.message, "error");
    } finally { setProcesando(null); }
  };

  const rechazar = async (v) => {
    if (procesando) return;
    const razon = razonRechazo[v.id] || "";
    if (!razon.trim()) { setMostrarRazon(prev => ({ ...prev, [v.id]: true })); return; }
    setProcesando(v.id);
    try {
      await adminAction("rechazar_verificacion", { verificacion_id: v.id, user_id: v.usuario_id, razon }, session.access_token);
      toast("❌ Solicitud rechazada. Se notificó al usuario.");
      cargar();
    } catch (e) {
      toast("Error: " + e.message, "error");
    } finally { setProcesando(null); }
  };

  const verFoto = async (path) => {
    if (!path) return;
    // path es la URL completa devuelta por uploadDniFoto — extraemos el path de storage
    const storagePath = path.replace(/.*\/object\/sign\/dni-fotos\//, "");
    const signed = await sb.getSignedDniUrl(storagePath, session.access_token).catch(() => null);
    if (signed) window.open(signed, "_blank", "noopener,noreferrer");
    else toast("No se pudo generar el link de la foto.", "error");
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40 }}><Spinner /></div>;

  if (verifs.length === 0) return (
    <Card style={{ textAlign: "center", padding: "40px 24px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
      <div style={{ fontWeight: 700, color: C.text, fontSize: 16, marginBottom: 6 }}>Sin verificaciones pendientes</div>
      <div style={{ color: C.muted, fontSize: 13 }}>Todas las solicitudes están procesadas.</div>
    </Card>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800, color: C.text, fontSize: 17 }}>Verificaciones pendientes ({verifs.length})</div>
        <button onClick={cargar} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: FONT }}>↺ Actualizar</button>
      </div>
      {verifs.map(v => {
        const usuario = v.usuarios || {};
        const fechaSolicitud = v.created_at ? new Date(v.created_at).toLocaleDateString("es-AR") : "—";
        return (
          <Card key={v.id}>
            {/* Usuario */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <Avatar user={usuario} size={42} />
              <div>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{usuario.nombre || "Sin nombre"}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>{usuario.email}</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>Solicitó el {fechaSolicitud}</div>
              </div>
              <Badge color="#F59E0B" style={{ marginLeft: "auto" }}>Pendiente</Badge>
            </div>

            {/* Datos KYC */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
              {[
                ["DNI", v.dni || "—"],
                ["Fecha nac.", v.fecha_nacimiento ? new Date(v.fecha_nacimiento + "T12:00:00").toLocaleDateString("es-AR") : "—"],
                ["CUIT/CUIL", v.cuit || "—"],
                ["Situación fiscal", v.situacion_fiscal || "—"],
                ["PEP", v.es_pep ? "Sí" : "No"],
                ["Términos", v.terminos_aceptados ? "Aceptados" : "No aceptados"],
              ].map(([label, val]) => (
                <div key={label} style={{ background: C.bg, borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Foto DNI */}
            {v.foto_dni_frente && (
              <button onClick={() => verFoto(v.foto_dni_frente)}
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.accent, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: FONT, marginBottom: 14 }}>
                🪪 Ver foto del DNI
              </button>
            )}

            {/* Razón de rechazo */}
            {mostrarRazon[v.id] && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 5 }}>Motivo del rechazo (requerido)</label>
                <textarea value={razonRechazo[v.id] || ""} onChange={e => setRazonRechazo(prev => ({ ...prev, [v.id]: e.target.value }))}
                  placeholder="Ej: La foto del DNI no es legible. Por favor volvé a subir una foto más clara."
                  rows={3}
                  style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: FONT, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => aprobar(v)} disabled={!!procesando}
                style={{ flex: 1, background: "#10B981", border: "none", borderRadius: 10, color: "#fff", padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FONT, opacity: procesando === v.id ? 0.6 : 1 }}>
                {procesando === v.id ? "Procesando…" : "✅ Aprobar"}
              </button>
              <button
                onClick={() => {
                  if (!mostrarRazon[v.id]) { setMostrarRazon(prev => ({ ...prev, [v.id]: true })); return; }
                  rechazar(v);
                }}
                disabled={!!procesando}
                style={{ flex: 1, background: "#EF4444", border: "none", borderRadius: 10, color: "#fff", padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FONT, opacity: procesando === v.id ? 0.6 : 1 }}>
                {procesando === v.id ? "Procesando…" : mostrarRazon[v.id] ? "Confirmar rechazo" : "❌ Rechazar"}
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── CUSTOM TOOLTIP RECHARTS ──────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 10, padding: "8px 12px", boxShadow: "0 4px 16px rgba(0,0,0,.08)", fontFamily: FONT }}>
      <div style={{ fontSize: 11, color: A.muted, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: p.color || A.text }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          {prefix}{typeof p.value === "number" ? p.value.toLocaleString("es-AR") : p.value}{suffix}
        </div>
      ))}
    </div>
  );
};

// ─── TAB: RESUMEN ─────────────────────────────────────────────────────────────
function OverviewTab({ session }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actividad, setActividad] = useState([]);

  useEffect(() => {
    let mounted=true;
    Promise.all([
      adminDb("usuarios?select=id,created_at,email,rol,bloqueado", "GET", null, session.access_token).catch(e=>{logError("admin/usuarios",e);return[];}),
      adminDb("publicaciones?select=id,created_at,activo,tipo,precio,moneda,materia,autor_id,usuarios!publicaciones_autor_id_fkey(email,nombre)", "GET", null, session.access_token).catch(e=>{logError("admin/publicaciones",e);return[];}),
      adminDb("inscripciones?select=id,created_at,publicacion_id", "GET", null, session.access_token).catch(e=>{logError("admin/inscripciones",e);return[];}),
      adminDb("pagos?select=id,monto,estado,created_at", "GET", null, session.access_token).catch(e=>{logError("admin/pagos",e);return[];}),
      adminDb("denuncias?select=id,created_at,revisada", "GET", null, session.access_token).catch(e=>{logError("admin/denuncias",e);return[];}),
      adminDb("rese%C3%B1as?select=id,estrellas,created_at", "GET", null, session.access_token).catch(e=>{logError("admin/reseñas",e);return[];}),
      adminDb("quejas?select=id,estado,created_at", "GET", null, session.access_token).catch(e=>{logError("admin/quejas",e);return[];}),
    ]).then(([users, pubs, insc, pagos, denuncias, resenas, quejas]) => {
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
      pubs.forEach(p => { pubIdToAutor[p.id] = { email: p.usuarios?.email, nombre: p.usuarios?.nombre }; });
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
        quejasSinAtender: (quejas||[]).filter(q => q.estado === "recibida").length,
        quejasTotal: (quejas||[]).length,
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
        ...(quejas||[]).filter(q => q.estado === "recibida").slice(-3).map(q => ({ tipo: "queja", texto: "📋 Nueva queja recibida", time: q.created_at })),
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15);
      setActividad(items);
    }).finally(() => { if(mounted)setLoading(false); });
    return()=>{mounted=false;};
  }, [session]);

  if (loading) return <div style={{ padding: 60, display: "flex", justifyContent: "center" }}><Spinner /></div>;
  if (!stats) return null;

  const COLOR_ACT = { usuario: A.info, inscripcion: A.success, pago: A.warn, denuncia: A.danger, queja: A.accent };
  const ICON_ACT = {
    usuario: <UserCheck size={13} />, inscripcion: <BookMarked size={13} />,
    pago: <CreditCard size={13} />, denuncia: <AlertTriangle size={13} />, queja: <MessageSquare size={13} />
  };

  const convRate = stats.totalInscripciones > 0 ? Math.round((stats.totalPagos / stats.totalInscripciones) * 100) : 0;
  const comisionTotal = Math.round(stats.ingresoTotal * (stats.comisionPct / 100));
  const ticketProm = stats.totalPagos > 0 ? Math.round(stats.ingresoTotal / stats.totalPagos) : 0;

  // Datos para gráfico de área — 30 días de usuarios
  const mesData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (29 - i));
    const next = new Date(d); next.setDate(next.getDate() + 1);
    return {
      dia: d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
      usuarios: 0, inscripciones: 0,
      _d: d, _next: next,
    };
  });

  // Donut data para roles
  const rolesData = Object.entries(stats.usuariosPorRol).map(([rol, count]) => ({
    name: rol === "admin" ? "Admin" : rol === "docente" ? "Docentes" : "Alumnos",
    value: count,
    color: rol === "admin" ? A.purple : rol === "docente" ? A.accent : A.success,
  }));

  const PIE_COLORS = [A.success, A.accent, A.purple, A.warn];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Alertas */}
      {(stats.denunciasPendientes > 0 || stats.quejasSinAtender > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {stats.denunciasPendientes > 0 && (
            <div style={{ background: A.danger + "10", border: `1px solid ${A.danger}30`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <AlertTriangle size={16} color={A.danger} />
              <span style={{ fontWeight: 700, color: A.danger, fontSize: 13 }}>{stats.denunciasPendientes} denuncia{stats.denunciasPendientes > 1 ? "s" : ""} pendiente{stats.denunciasPendientes > 1 ? "s" : ""} de revisión</span>
              <span style={{ color: A.muted, fontSize: 12 }}>→ Revisalas en Moderación</span>
            </div>
          )}
          {stats.quejasSinAtender > 0 && (
            <div style={{ background: A.info + "10", border: `1px solid ${A.info}30`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <MessageSquare size={16} color={A.info} />
              <span style={{ fontWeight: 700, color: A.info, fontSize: 13 }}>{stats.quejasSinAtender} queja{stats.quejasSinAtender > 1 ? "s" : ""} sin revisar</span>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards — fila 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        <KpiCard
          label="Usuarios totales" value={stats.totalUsuarios.toLocaleString("es-AR")}
          trend={stats.nuevosUltimoMes > 0 ? Math.round((stats.nuevosHoy / Math.max(stats.totalUsuarios - stats.nuevosUltimoMes, 1)) * 100) : null}
          trendLabel={`+${stats.nuevosHoy} hoy · +${stats.nuevosSemana} esta semana`}
          color={A.info} Icon={Users} sparkData={stats.cohortUsuarios}
        />
        <KpiCard
          label="Ingresos totales" value={`$${stats.ingresoTotal.toLocaleString("es-AR")}`}
          sub={`${stats.totalPagos} pagos aprobados`}
          trendLabel={`Comisión Luderis: $${comisionTotal.toLocaleString("es-AR")} (${stats.comisionPct}%)`}
          color={A.warn} Icon={DollarSign} sparkData={stats.cohortInscripciones}
        />
        <KpiCard
          label="Inscripciones" value={stats.totalInscripciones.toLocaleString("es-AR")}
          trend={stats.inscSemana > 0 ? null : null}
          trendLabel={`+${stats.inscSemana} esta semana · ${stats.inscPorPub} por publicación`}
          color={A.success} Icon={BookMarked} sparkData={stats.cohortInscripciones}
        />
        <KpiCard
          label="Tasa de conversión" value={`${convRate}%`}
          sub="inscriptos que pagaron"
          trendLabel={`Ticket promedio: $${ticketProm.toLocaleString("es-AR")}`}
          color={A.purple} Icon={TrendingUp}
        />
        <KpiCard
          label="Publicaciones activas" value={stats.pubsActivas.toLocaleString("es-AR")}
          sub={`${stats.pubsInactivas} inactivas`}
          color={A.accent} Icon={BookOpen}
        />
        <KpiCard
          label="Rating promedio" value={stats.ratingPromedio ? `${stats.ratingPromedio} ★` : "—"}
          sub="Sobre todas las reseñas"
          color={A.warn} Icon={BarChart2}
        />
      </div>

      {/* Gráfico de área — crecimiento 7 días */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, color: A.text, fontSize: 15 }}>Actividad — últimos 7 días</div>
              <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>Nuevos usuarios e inscripciones</div>
            </div>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.cohortUsuarios.map((u, i) => ({ ...u, inscripciones: stats.cohortInscripciones[i]?.count || 0 }))} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={A.info} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={A.info} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradInsc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={A.success} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={A.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={A.border} vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: A.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: A.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: A.muted }} />
                <Area type="monotone" dataKey="count" name="Usuarios" stroke={A.info} strokeWidth={2} fill="url(#gradUsers)" dot={false} />
                <Area type="monotone" dataKey="inscripciones" name="Inscripciones" stroke={A.success} strokeWidth={2} fill="url(#gradInsc)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut — distribución de roles */}
        <Card>
          <div style={{ fontWeight: 700, color: A.text, fontSize: 15, marginBottom: 4 }}>Distribución de roles</div>
          <div style={{ fontSize: 12, color: A.muted, marginBottom: 16 }}>{stats.totalUsuarios} usuarios en total</div>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rolesData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                  {rolesData.map((entry, index) => (
                    <Cell key={index} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ fontFamily: FONT, fontSize: 12, borderRadius: 8, border: `1px solid ${A.border}` }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {rolesData.map(r => (
              <div key={r.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, display: "inline-block" }} />
                  <span style={{ fontSize: 12, color: A.muted }}>{r.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: A.text }}>{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Fila: Top materias (barras) + Funnel conversión */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, color: A.text, fontSize: 15, marginBottom: 4 }}>Top materias</div>
          <div style={{ fontSize: 12, color: A.muted, marginBottom: 16 }}>Por cantidad de publicaciones</div>
          {stats.topMaterias.length === 0 ? (
            <div style={{ color: A.muted, fontSize: 13 }}>Sin datos aún</div>
          ) : (
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topMaterias.map(([m, c]) => ({ name: m.length > 14 ? m.slice(0, 14) + "…" : m, count: c }))} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: A.muted }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: A.text }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Publicaciones" fill={A.accent} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontWeight: 700, color: A.text, fontSize: 15, marginBottom: 4 }}>Funnel de conversión</div>
          <div style={{ fontSize: 12, color: A.muted, marginBottom: 20 }}>Del registro al pago</div>
          {[
            { label: "Usuarios registrados", value: stats.totalUsuarios, color: A.info },
            { label: "Con inscripción", value: stats.totalInscripciones, color: A.success },
            { label: "Con pago aprobado", value: stats.totalPagos, color: A.warn },
          ].map(({ label, value, color }, i, arr) => {
            const pct = arr[0].value > 0 ? Math.round((value / arr[0].value) * 100) : 0;
            return (
              <div key={label} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: A.text }}>{label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color }}>{value.toLocaleString("es-AR")}</span>
                    <span style={{ fontSize: 11, color: A.muted }}>({pct}%)</span>
                  </div>
                </div>
                <div style={{ height: 8, background: A.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: color, borderRadius: 4, width: `${pct}%`, transition: "width .6s ease" }} />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 8, padding: "10px 14px", background: A.bg, borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: A.muted }}>Insc. por publicación</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: A.text }}>{stats.inscPorPub}</span>
          </div>
        </Card>
      </div>

      {/* Fila: Top docentes + Moderación */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, color: A.text, fontSize: 15, marginBottom: 16 }}>Top docentes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.topDocentes.length === 0 ? <div style={{ color: A.muted, fontSize: 13 }}>Sin datos aún</div> :
              stats.topDocentes.map((d, i) => (
                <div key={d.email} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: A.muted, minWidth: 20 }}>#{i + 1}</span>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: A.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: A.accent, fontSize: 13, flexShrink: 0 }}>
                    {(d.nombre || d.email)[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: A.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nombre || d.email.split("@")[0]}</div>
                    <div style={{ fontSize: 11, color: A.muted }}>{d.email}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: A.success, flexShrink: 0 }}>{d.count} insc.</span>
                </div>
              ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, color: A.text, fontSize: 15, marginBottom: 16 }}>Moderación</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Total denuncias", value: stats.kpiDenuncias.total, color: A.danger },
              { label: "Tasa resolución", value: `${stats.kpiDenuncias.tasaResolucion}%`, color: stats.kpiDenuncias.tasaResolucion >= 80 ? A.success : A.warn },
              { label: "Pendientes", value: stats.kpiDenuncias.pendientes, color: A.warn },
              { label: "Bloqueados", value: stats.kpiDenuncias.bloqueados, color: A.purple },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: A.bg, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, color: A.muted, marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
          {stats.kpiDenuncias.topMotivos.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Motivos frecuentes</div>
              {stats.kpiDenuncias.topMotivos.slice(0, 3).map(([motivo, count]) => (
                <div key={motivo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: A.text }}>{motivo || "Sin especificar"}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ height: 5, borderRadius: 3, background: A.danger, width: Math.max(20, (count / (stats.kpiDenuncias.topMotivos[0]?.[1] || 1)) * 60) }} />
                    <span style={{ fontSize: 11, color: A.muted, minWidth: 14 }}>{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Feed de actividad */}
      <Card>
        <div style={{ fontWeight: 700, color: A.text, fontSize: 15, marginBottom: 18 }}>Actividad reciente</div>
        {actividad.length === 0 ? (
          <div style={{ color: A.muted, fontSize: 13 }}>Sin actividad reciente</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {actividad.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, paddingBottom: i < actividad.length - 1 ? 14 : 0, marginBottom: i < actividad.length - 1 ? 14 : 0, borderBottom: i < actividad.length - 1 ? `1px solid ${A.border}` : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLOR_ACT[item.tipo] + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: COLOR_ACT[item.tipo] }}>
                  {ICON_ACT[item.tipo]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: A.text, lineHeight: 1.4 }}>{item.texto}</div>
                </div>
                <div style={{ fontSize: 11, color: A.muted, whiteSpace: "nowrap", flexShrink: 0 }}>{fmtRel(item.time)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Plataforma en números */}
      <Card>
        <div style={{ fontWeight: 700, color: A.text, fontSize: 15, marginBottom: 14 }}>Plataforma en números</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Bloqueados", value: stats.usuariosBloqueados, color: A.danger },
            { label: "Pubs. inactivas", value: stats.pubsInactivas, color: A.warn },
            { label: "Nuevos (30d)", value: stats.nuevosUltimoMes, color: A.info },
            ...(stats.ratingPromedio ? [{ label: "Rating promedio", value: `★ ${stats.ratingPromedio}`, color: A.warn }] : []),
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: A.bg, border: `1px solid ${A.border}`, borderRadius: 12, padding: "14px 18px", minWidth: 100 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: FONT }}>{value}</div>
              <div style={{ fontSize: 11, color: A.muted, marginTop: 4 }}>{label}</div>
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
      adminDb("publicaciones?select=id,titulo,autor_id,activo,tipo,precio,usuarios!publicaciones_autor_id_fkey(email,nombre)&tipo=eq.oferta", "GET", null, session.access_token).catch(() => []),
      adminDb("rese%C3%B1as?select=estrellas,publicacion_id", "GET", null, session.access_token).catch(() => []),
      adminDb("inscripciones?select=id,publicacion_id", "GET", null, session.access_token).catch(() => []),
    ]).then(([pubs, resenas, insc]) => {
      if(!mounted)return;
      // Build per-docente stats
      const docenteMap = {};
      pubs.forEach(p => {
        const ae = p.usuarios?.email; if (!ae) return;
        if (!docenteMap[ae]) docenteMap[ae] = { email: ae, nombre: p.usuarios?.nombre, pubs: [], inscCount: 0, ratings: [] };
        docenteMap[ae].pubs.push(p);
      });
      const pubIdToAutor = {};
      pubs.forEach(p => { pubIdToAutor[p.id] = p.usuarios?.email; });
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

// ─── TAB: QUEJAS ─────────────────────────────────────────────────────────────
function QuejasTab({ session }) {
  const [quejas, setQuejas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState(null);

  const ESTADO_COLOR = {
    recibida: "#3B82F6",
    en_revision: "#F59E0B",
    resuelta: C.success,
    cerrada: C.muted,
  };
  const ESTADO_LABEL = {
    recibida: "Recibida",
    en_revision: "En revisión",
    resuelta: "Resuelta",
    cerrada: "Cerrada",
  };
  const ROL_ICON = { alumno: "🎓", docente: "📚", otro: "👤" };

  const cargar = useCallback(() => {
    setLoading(true);
    adminDb("quejas?select=*&order=created_at.desc&limit=500", "GET", null, session.access_token)
      .then(rows => { setQuejas(rows || []); })
      .catch(() => toast("Error cargando quejas", "error"))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (queja, nuevoEstado, e) => {
    if (e) e.stopPropagation();
    try {
      await adminDb(`quejas?id=eq.${queja.id}`, "PATCH", { estado: nuevoEstado }, session.access_token);
      setQuejas(prev => prev.map(q => q.id === queja.id ? { ...q, estado: nuevoEstado } : q));
      if (detalle?.id === queja.id) setDetalle(prev => ({ ...prev, estado: nuevoEstado }));
      toast(`Estado actualizado a: ${ESTADO_LABEL[nuevoEstado]}`, "success");
    } catch (err) { toast("Error: " + err.message, "error"); }
  };

  const stats = {
    total: quejas.length,
    recibidas: quejas.filter(q => q.estado === "recibida").length,
    en_revision: quejas.filter(q => q.estado === "en_revision").length,
    resueltas: quejas.filter(q => q.estado === "resuelta").length,
    cerradas: quejas.filter(q => q.estado === "cerrada").length,
  };

  const filtered = quejas.filter(q => {
    if (filtroEstado !== "todas" && q.estado !== filtroEstado) return false;
    if (filtroRol !== "todos" && q.rol !== filtroRol) return false;
    if (busqueda) {
      const b = busqueda.toLowerCase();
      return (
        (q.numero_queja || "").toLowerCase().includes(b) ||
        (q.nombre || "").toLowerCase().includes(b) ||
        (q.email || "").toLowerCase().includes(b) ||
        (q.categoria || "").toLowerCase().includes(b) ||
        (q.descripcion || "").toLowerCase().includes(b)
      );
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Alerta si hay quejas sin atender */}
      {stats.recibidas > 0 && (
        <div style={{ background: "#3B82F615", border: "1px solid #3B82F640", borderRadius: 12, padding: "13px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <div style={{ fontWeight: 700, color: "#3B82F6", fontSize: 14 }}>
              {stats.recibidas} queja{stats.recibidas > 1 ? "s" : ""} nueva{stats.recibidas > 1 ? "s" : ""} sin revisar
            </div>
            <div style={{ color: C.muted, fontSize: 12 }}>Cambiá el estado a "En revisión" para iniciar el seguimiento</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 12 }}>
        <StatBox icon="📋" label="Total quejas" value={stats.total} color={C.text} />
        <StatBox icon="🔵" label="Recibidas" value={stats.recibidas} color="#3B82F6" />
        <StatBox icon="🟡" label="En revisión" value={stats.en_revision} color="#F59E0B" />
        <StatBox icon="🟢" label="Resueltas" value={stats.resueltas} color={C.success} />
        <StatBox icon="⚫" label="Cerradas" value={stats.cerradas} color={C.muted} />
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["todas", "recibida", "en_revision", "resuelta", "cerrada"].map(e => (
            <Pill key={e} label={e === "todas" ? "Todas" : ESTADO_LABEL[e]} active={filtroEstado === e} onClick={() => setFiltroEstado(e)} />
          ))}
        </div>
        <div style={{ height: 24, width: 1, background: C.border }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["todos", "alumno", "docente", "otro"].map(r => (
            <Pill key={r} label={r === "todos" ? "Todos" : (ROL_ICON[r] + " " + r.charAt(0).toUpperCase() + r.slice(1))} active={filtroRol === r} onClick={() => setFiltroRol(r)} />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por N° queja, nombre, email, categoría..." />
        </div>
        <button onClick={cargar}
          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: C.muted, cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap" }}>
          🔄 Actualizar
        </button>
      </div>

      {/* Contador de resultados */}
      <div style={{ fontSize: 12, color: C.muted }}>
        Mostrando <strong style={{ color: C.text }}>{filtered.length}</strong> de {quejas.length} quejas
      </div>

      {/* Lista */}
      {loading ? <div style={{ padding: 40 }}><Spinner /></div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(q => {
            const color = ESTADO_COLOR[q.estado] || C.muted;
            const isOpen = detalle?.id === q.id;
            return (
              <Card key={q.id}
                style={{ borderLeft: `3px solid ${color}`, cursor: "pointer", transition: "box-shadow .15s" }}
                onClick={() => setDetalle(isOpen ? null : q)}>
                {/* Fila principal */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 800, color: C.accent, letterSpacing: .3 }}>
                        {q.numero_queja}
                      </span>
                      <Badge color={color}>{ESTADO_LABEL[q.estado] || q.estado}</Badge>
                      <Badge color={C.muted}>{ROL_ICON[q.rol] || ""} {q.rol}</Badge>
                      <span style={{ fontSize: 11, color: C.muted }}>{fmt(q.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: C.text, marginBottom: 3 }}>
                      <strong>{q.nombre}</strong>
                      <span style={{ color: C.muted, marginLeft: 8 }}>{q.email}</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>{q.categoria}</div>
                  </div>
                  <span style={{ fontSize: 14, color: C.muted, flexShrink: 0, paddingTop: 2 }}>{isOpen ? "▲" : "▼"}</span>
                </div>

                {/* Detalle expandido */}
                {isOpen && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ background: C.bg, borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>Descripción del reclamo</div>
                      <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.65 }}>{q.descripcion}</p>
                    </div>

                    {q.referencia && (
                      <div style={{ marginBottom: 14 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: .5 }}>Referencia: </span>
                        <span style={{ fontSize: 12, color: C.text, fontFamily: "monospace" }}>{q.referencia}</span>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, fontSize: 12 }}>
                      <div><span style={{ color: C.muted }}>ID: </span><span style={{ fontFamily: "monospace", color: C.text }}>{q.id}</span></div>
                      <div><span style={{ color: C.muted }}>Ingresado: </span><span style={{ color: C.text }}>{q.created_at ? new Date(q.created_at).toLocaleString("es-AR") : "—"}</span></div>
                    </div>

                    {/* Botones de cambio de estado */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Cambiar estado</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[
                        { id: "recibida", label: "🔵 Recibida" },
                        { id: "en_revision", label: "🟡 En revisión" },
                        { id: "resuelta", label: "🟢 Resuelta" },
                        { id: "cerrada", label: "⚫ Cerrada" },
                      ].map(({ id, label }) => (
                        <button key={id}
                          onClick={e => cambiarEstado(q, id, e)}
                          style={{
                            background: q.estado === id ? (ESTADO_COLOR[id] + "22") : C.bg,
                            border: `1px solid ${q.estado === id ? ESTADO_COLOR[id] : C.border}`,
                            borderRadius: 6, padding: "6px 12px", fontSize: 12,
                            fontWeight: q.estado === id ? 700 : 400,
                            color: q.estado === id ? ESTADO_COLOR[id] : C.muted,
                            cursor: "pointer", fontFamily: FONT, transition: "all .1s",
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {filtered.length === 0 && !loading && (
            <div style={{ textAlign: "center", color: C.muted, padding: "48px 0", fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              {busqueda ? `Sin resultados para "${busqueda}"` : "No hay quejas con ese estado"}
            </div>
          )}
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

// ─── TAB: ESCROW ──────────────────────────────────────────────────────────────
function EscrowTab({ session }) {
  const [pagosRetenidos, setPagosRetenidos] = useState([]);
  const [disputas, setDisputas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liberando, setLiberando] = useState(null); // pago_id en proceso
  const [resolviendo, setResolviendo] = useState(null);
  const [resolucionModal, setResolucionModal] = useState(null); // { disputa, tipo }
  const [resolucionText, setResolucionText] = useState("");

  const cargar = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminDb("pagos?estado_escrow=in.(retenido,en_disputa)&select=id,monto,docente_email,alumno_email,estado_escrow,clase_finalizada_at,liberado_at,publicacion_id,created_at&order=clase_finalizada_at.asc&limit=100", "GET", null, session.access_token),
      adminDb("disputas?estado=eq.abierta&select=*&order=created_at.desc&limit=50", "GET", null, session.access_token),
    ]).then(([p, d]) => {
      setPagosRetenidos(p || []);
      setDisputas(d || []);
    }).catch(() => toast("Error cargando escrow", "error"))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => { cargar(); }, [cargar]);

  const liberar = async (pago_id) => {
    setLiberando(pago_id);
    try {
      const r = await adminAction("liberar_pago_manual", { pago_id }, session.access_token);
      toast(`✓ Liberado — ${r.metodo} — neto $${Number(r.monto_neto||0).toLocaleString("es-AR")}`, "success");
      cargar();
    } catch(e) { toast("Error: " + e.message, "error"); }
    finally { setLiberando(null); }
  };

  const resolverDisputa = async (disputa, estado) => {
    setResolviendo(disputa.id);
    try {
      await adminAction("resolver_disputa", { disputa_id: disputa.id, estado, resolucion: resolucionText || null }, session.access_token);
      toast(`✓ Disputa resuelta a favor del ${estado === "resuelta_docente" ? "docente" : "alumno"}`, "success");
      setResolucionModal(null); setResolucionText("");
      cargar();
    } catch(e) { toast("Error: " + e.message, "error"); }
    finally { setResolviendo(null); }
  };

  const horasRetenido = (at) => {
    if (!at) return "—";
    const h = Math.floor((Date.now() - new Date(at).getTime()) / 3600000);
    return h >= 72 ? `⚠️ ${h}h (vencido)` : `${h}h / 72h`;
  };

  const totalRetenido = pagosRetenidos.reduce((a, p) => a + Number(p.monto || 0), 0);

  if (loading) return <div style={{ padding: 40 }}><Spinner /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
        <StatBox icon="📦" label="Pagos retenidos" value={pagosRetenidos.filter(p => p.estado_escrow === "retenido").length} color={C.warn} sub="Esperando 72hs" />
        <StatBox icon="⚠️" label="En disputa" value={pagosRetenidos.filter(p => p.estado_escrow === "en_disputa").length} color={C.danger} sub="Requieren intervención" />
        <StatBox icon="💰" label="Monto retenido total" value={`$${totalRetenido.toLocaleString("es-AR")}`} color={C.accent} sub="Suma de todos los retenidos" />
        <StatBox icon="🚨" label="Disputas abiertas" value={disputas.length} color={C.danger} sub="Sin resolver" />
      </div>

      {/* Pagos retenidos */}
      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 14 }}>📦 Pagos retenidos / en disputa</div>
        {pagosRetenidos.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13 }}>No hay pagos retenidos ✓</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Docente", "Alumno", "Monto", "Estado", "Tiempo retenido", "Acción"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.muted, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagosRetenidos.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "8px 12px" }}>{p.docente_email?.split("@")[0]}</td>
                    <td style={{ padding: "8px 12px" }}>{p.alumno_email?.split("@")[0]}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: C.accent }}>${Number(p.monto || 0).toLocaleString("es-AR")}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <Badge color={p.estado_escrow === "en_disputa" ? C.danger : C.warn}>{p.estado_escrow}</Badge>
                    </td>
                    <td style={{ padding: "8px 12px", color: C.muted }}>{horasRetenido(p.clase_finalizada_at)}</td>
                    <td style={{ padding: "8px 12px" }}>
                      {p.estado_escrow === "retenido" && (
                        <button
                          onClick={() => liberar(p.id)}
                          disabled={liberando === p.id}
                          style={{ background: C.success, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT, opacity: liberando === p.id ? .6 : 1 }}
                        >{liberando === p.id ? "…" : "Liberar ahora"}</button>
                      )}
                      {p.estado_escrow === "en_disputa" && (
                        <span style={{ fontSize: 11, color: C.muted }}>Ver disputas ↓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Disputas abiertas */}
      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 14 }}>🚨 Disputas abiertas</div>
        {disputas.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13 }}>No hay disputas abiertas ✓</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {disputas.map(d => (
              <div key={d.id} style={{ background: C.bg, border: `1px solid ${C.danger}40`, borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <div>
                    <Badge color={C.danger}>{d.motivo}</Badge>
                    <span style={{ marginLeft: 8, fontSize: 12, color: C.muted }}>{fmt(d.created_at)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setResolucionModal({ disputa: d, tipo: "docente" })}
                      style={{ background: C.success, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                      ✓ Favor docente
                    </button>
                    <button onClick={() => setResolucionModal({ disputa: d, tipo: "alumno" })}
                      style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                      ↩ Reembolso alumno
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.text }}>
                  <strong>Alumno:</strong> {d.alumno_email} · <strong>Docente:</strong> {d.docente_email}
                </div>
                {d.descripcion && <div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontStyle: "italic" }}>"{d.descripcion}"</div>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal resolución disputa */}
      {resolucionModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 28, width: "min(480px,92vw)", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>
              {resolucionModal.tipo === "docente" ? "✓ Resolver a favor del docente" : "↩ Reembolso al alumno"}
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
              {resolucionModal.tipo === "docente"
                ? "El pago se liberará al docente. Asegurate de haber verificado que la clase se dio."
                : "El pago se marcará como 'reembolsado'. Deberás gestionar el reembolso manualmente en MercadoPago."}
            </div>
            <textarea
              value={resolucionText}
              onChange={e => setResolucionText(e.target.value)}
              placeholder="Notas de resolución (opcional)…"
              rows={3}
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 13, outline: "none", fontFamily: FONT, boxSizing: "border-box", resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => { setResolucionModal(null); setResolucionText(""); }}
                style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", color: C.muted, fontFamily: FONT }}>
                Cancelar
              </button>
              <button
                onClick={() => resolverDisputa(resolucionModal.disputa, resolucionModal.tipo === "docente" ? "resuelta_docente" : "resuelta_alumno")}
                disabled={!!resolviendo}
                style={{ background: resolucionModal.tipo === "docente" ? C.success : C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 700, fontFamily: FONT, opacity: resolviendo ? .6 : 1 }}>
                {resolviendo ? "Procesando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB: LIQUIDACIONES ───────────────────────────────────────────────────────
function LiquidacionesTab({ session }) {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [periodoGen, setPeriodoGen] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [docenteGen, setDocenteGen] = useState("");
  const [filtroP, setFiltroP] = useState("");

  const SUPA_URL_LIQ = "https://hptdyehzqfpgtrpuydny.supabase.co";
  const ANON_LIQ = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g";

  const cargar = useCallback(() => {
    setLoading(true);
    adminDb("liquidaciones?select=*&order=periodo.desc,docente_email.asc&limit=200", "GET", null, session.access_token)
      .then(setLiquidaciones)
      .catch(() => toast("Error cargando liquidaciones", "error"))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => { cargar(); }, [cargar]);

  const generar = async () => {
    setGenerando(true);
    try {
      const r = await adminAction("generar_liquidacion_manual", {
        periodo: periodoGen || null,
        docente_email: docenteGen.trim() || null,
      }, session.access_token);
      toast(`✓ ${r.exitosos || 0} liquidaciones generadas`, "success");
      cargar();
    } catch(e) { toast("Error: " + e.message, "error"); }
    finally { setGenerando(false); }
  };

  const downloadPdf = async (liq) => {
    // Generar signed URL usando el token del admin
    try {
      const path = `${liq.docente_email}/${liq.periodo}.pdf`;
      const res = await fetch(`${SUPA_URL_LIQ}/storage/v1/object/sign/liquidaciones/${encodeURIComponent(path)}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}`, "apikey": ANON_LIQ, "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn: 3600 }),
      });
      if (!res.ok) { toast("No se pudo generar el link", "error"); return; }
      const d = await res.json();
      if (d.signedURL) window.open(`${SUPA_URL_LIQ}${d.signedURL}`, "_blank", "noopener");
      else toast("PDF no disponible", "warn");
    } catch { toast("Error al descargar", "error"); }
  };

  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const periodoLabel = (p) => { const [y,m] = p.split("-").map(Number); return `${meses[m-1]} ${y}`; };

  const filtered = filtroP ? liquidaciones.filter(l => l.periodo === filtroP) : liquidaciones;
  const periodos = [...new Set(liquidaciones.map(l => l.periodo))].sort().reverse();

  const totalNeto = filtered.reduce((a, l) => a + Number(l.monto_neto || 0), 0);
  const totalCom  = filtered.reduce((a, l) => a + Number(l.comision_luderis || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Generador manual */}
      <Card>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 14 }}>⚙️ Generar liquidaciones</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>PERÍODO</div>
            <input type="month" value={periodoGen} onChange={e => setPeriodoGen(e.target.value)}
              style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, outline: "none", fontFamily: FONT }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>DOCENTE (opcional — vacío = todos)</div>
            <input value={docenteGen} onChange={e => setDocenteGen(e.target.value)}
              placeholder="email@docente.com"
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, outline: "none", fontFamily: FONT, boxSizing: "border-box" }} />
          </div>
          <Btn onClick={generar} disabled={generando} style={{ alignSelf: "flex-end" }}>
            {generando ? "Generando PDFs…" : "📄 Generar liquidaciones"}
          </Btn>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
          Genera PDFs, los sube a Storage y envía emails a los docentes. Idempotente (sobreescribe si ya existe).
        </div>
      </Card>

      {/* Stats del período filtrado */}
      {filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
          <StatBox icon="👩‍🏫" label="Docentes" value={filtered.length} color={C.accent} />
          <StatBox icon="📚" label="Clases totales" value={filtered.reduce((a, l) => a + (l.cantidad_clases || 0), 0)} color={C.info} />
          <StatBox icon="💸" label="Neto a pagar" value={`$${totalNeto.toLocaleString("es-AR")}`} color={C.success} />
          <StatBox icon="🏦" label="Comisiones" value={`$${totalCom.toLocaleString("es-AR")}`} color={C.warn} />
        </div>
      )}

      {/* Filtro por período */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <Pill label="Todos" active={!filtroP} onClick={() => setFiltroP("")} />
        {periodos.map(p => <Pill key={p} label={periodoLabel(p)} active={filtroP === p} onClick={() => setFiltroP(p)} />)}
      </div>

      {/* Tabla */}
      {loading ? <Spinner /> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {["Período", "Docente", "Clases", "Monto bruto", "Comisión", "Monto neto", "PDF"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: .3, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: C.text, fontSize: 13 }}>{periodoLabel(l.periodo)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.text }}>{l.docente_email?.split("@")[0] || "—"}<br/><span style={{ fontSize: 10, color: C.muted }}>{l.docente_email}</span></td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: C.text }}>{l.cantidad_clases}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: C.text }}>${Number(l.monto_bruto || 0).toLocaleString("es-AR")}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: C.muted }}>- ${Number(l.comision_luderis || 0).toLocaleString("es-AR")}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.success }}>${Number(l.monto_neto || 0).toLocaleString("es-AR")}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {l.pdf_url ? (
                      <button onClick={() => downloadPdf(l)}
                        style={{ background: "none", border: `1px solid ${C.accent}`, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: C.accent, cursor: "pointer", fontFamily: FONT, fontWeight: 700 }}>
                        ⬇ PDF
                      </button>
                    ) : <span style={{ fontSize: 11, color: C.muted }}>Sin PDF</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>Sin liquidaciones{filtroP ? ` para ${periodoLabel(filtroP)}` : ""}</div>}
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

// ─── TAB: ALERTAS CONTACTO EXTERNO ───────────────────────────────────────────
function AlertasContactoTab({ session }) {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soloNoRevisadas, setSoloNoRevisadas] = useState(true);
  const [accionando, setAccionando] = useState(null); // alertaId + tipo: "revisar"|"advertir"|"bloquear"
  // advertencias por email cacheadas para no re-fetchear
  const [advertenciasMap, setAdvertenciasMap] = useState({});

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await sb.getAlertasContacto(soloNoRevisadas, session.access_token);
      const arr = Array.isArray(data) ? data : [];
      setAlertas(arr);
      // Cargar advertencias de todos los usuarios únicos involucrados
      const emails = [...new Set(arr.map(a => a.autor_email).filter(Boolean))];
      if (emails.length > 0) {
        const rows = await adminDb(
          `usuarios?email=in.(${emails.map(e => encodeURIComponent(e)).join(",")})&select=email,advertencias,bloqueado`,
          "GET", null, session.access_token
        ).catch(() => []);
        const map = {};
        (rows || []).forEach(r => { map[r.email] = r; });
        setAdvertenciasMap(map);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [soloNoRevisadas]); // eslint-disable-line

  const setAccion = (id, tipo) => setAccionando(v => v?.id === id && v?.tipo === tipo ? null : { id, tipo });
  const enAccion = (id, tipo) => accionando?.id === id && accionando?.tipo === tipo;

  const marcar = async (id) => {
    setAccionando({ id, tipo: "revisar" });
    try {
      await sb.marcarAlertaRevisada(id, session.access_token);
      setAlertas(v => soloNoRevisadas ? v.filter(a => a.id !== id) : v.map(a => a.id === id ? { ...a, revisada: true } : a));
    } catch {}
    setAccionando(null);
  };

  const advertir = async (alerta) => {
    setAccionando({ id: alerta.id, tipo: "advertir" });
    try {
      // +1 advertencia en DB
      const rows = await adminDb(
        `usuarios?email=eq.${encodeURIComponent(alerta.autor_email)}&select=advertencias`,
        "GET", null, session.access_token
      ).catch(() => []);
      const actual = rows?.[0]?.advertencias ?? 0;
      await adminDb(
        `usuarios?email=eq.${encodeURIComponent(alerta.autor_email)}`,
        "PATCH", { advertencias: actual + 1 }, session.access_token
      );
      // Notificación campana al usuario
      await sb.insertNotificacion({
        usuario_id: null,
        alumno_email: alerta.autor_email,
        tipo: "sistema",
        pub_titulo: "⚠️ Advertencia: intentaste compartir contacto externo. Toda la comunicación debe ocurrir dentro de Luderis. Ante reincidencias tu cuenta puede ser suspendida.",
        leida: false,
      }, session.access_token);
      // Marcar alerta como revisada
      await sb.marcarAlertaRevisada(alerta.id, session.access_token);
      // Actualizar UI
      setAdvertenciasMap(v => ({ ...v, [alerta.autor_email]: { ...(v[alerta.autor_email] || {}), advertencias: actual + 1 } }));
      setAlertas(v => soloNoRevisadas ? v.filter(a => a.id !== alerta.id) : v.map(a => a.id === alerta.id ? { ...a, revisada: true } : a));
    } catch (e) { console.error(e); }
    setAccionando(null);
  };

  const bloquear = async (alerta) => {
    setAccionando({ id: alerta.id, tipo: "bloquear" });
    try {
      // Marcar bloqueado en DB
      await adminDb(
        `usuarios?email=eq.${encodeURIComponent(alerta.autor_email)}`,
        "PATCH", { bloqueado: true }, session.access_token
      );
      // Mail de ban
      await sb.sendEmail("ban_usuario", alerta.autor_email, {
        razon: "intentos reiterados de compartir información de contacto externo",
      }, session.access_token);
      // Marcar alerta como revisada
      await sb.marcarAlertaRevisada(alerta.id, session.access_token);
      // Actualizar UI
      setAdvertenciasMap(v => ({ ...v, [alerta.autor_email]: { ...(v[alerta.autor_email] || {}), bloqueado: true } }));
      setAlertas(v => soloNoRevisadas ? v.filter(a => a.id !== alerta.id) : v.map(a => a.id === alerta.id ? { ...a, revisada: true } : a));
    } catch (e) { console.error(e); }
    setAccionando(null);
  };

  const fmtFecha = (iso) => iso ? new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>🔇 Intentos de contacto externo</h2>
          <p style={{ fontFamily: FONT, fontSize: 13, color: C.muted, margin: "4px 0 0" }}>Mensajes bloqueados automáticamente por compartir datos de contacto fuera de Luderis.</p>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 13, color: C.text, cursor: "pointer" }}>
          <input type="checkbox" checked={soloNoRevisadas} onChange={e => setSoloNoRevisadas(e.target.checked)} />
          Solo no revisadas
        </label>
      </div>

      {loading ? (
        <Spinner />
      ) : alertas.length === 0 ? (
        <Card><p style={{ fontFamily: FONT, fontSize: 14, color: C.muted, margin: 0 }}>No hay alertas{soloNoRevisadas ? " sin revisar" : ""}.</p></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {alertas.map(a => {
            const userInfo = advertenciasMap[a.autor_email] || {};
            const adv = userInfo.advertencias ?? 0;
            const estaBloqueado = userInfo.bloqueado ?? false;
            return (
              <Card key={a.id} style={{ borderLeft: `4px solid ${a.revisada ? C.border : estaBloqueado ? "#6a1b9a" : "#c62828"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Badges tipo + estado */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <Badge color={a.tipo === "pregunta" ? "#1565c0" : "#6a1b9a"}>{a.tipo === "pregunta" ? "Pregunta" : "Respuesta"}</Badge>
                      {a.revisada && <Badge color={C.muted}>Revisada</Badge>}
                      {estaBloqueado && <Badge color="#6a1b9a">Usuario bloqueado</Badge>}
                      <span style={{ fontFamily: FONT, fontSize: 12, color: C.muted }}>{fmtFecha(a.created_at)}</span>
                    </div>
                    {/* Info usuario con contador de advertencias */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: C.muted }}>
                        <strong>Usuario:</strong> {a.autor_email}
                      </span>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: adv === 0 ? "#f3f4f6" : adv >= 3 ? "#fee2e2" : "#fef3c7",
                        color: adv === 0 ? C.muted : adv >= 3 ? "#991b1b" : "#92400e",
                        border: `1px solid ${adv === 0 ? C.border : adv >= 3 ? "#fca5a5" : "#fcd34d"}`,
                        borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: FONT,
                      }}>
                        ⚠️ {adv} advertencia{adv !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {a.publicaciones?.titulo && (
                      <div style={{ fontFamily: FONT, fontSize: 12, color: C.muted, marginBottom: 6 }}>
                        <strong>Publicación:</strong> {a.publicaciones.titulo}
                      </div>
                    )}
                    {/* Texto bloqueado */}
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
                      <p style={{ fontFamily: FONT, fontSize: 13, color: "#7f1d1d", margin: 0, wordBreak: "break-word" }}>{a.texto_bloqueado}</p>
                    </div>
                    {a.razon && (
                      <div style={{ fontFamily: FONT, fontSize: 12, color: C.muted }}>
                        <strong>Razón IA:</strong> {a.razon}
                      </div>
                    )}
                  </div>
                  {/* Acciones */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                    {!a.revisada && (
                      <button onClick={() => marcar(a.id)} disabled={!!accionando}
                        style={{ background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", fontFamily: FONT, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: accionando ? 0.5 : 1 }}>
                        {enAccion(a.id, "revisar") ? "…" : "Marcar revisada"}
                      </button>
                    )}
                    {!estaBloqueado && (
                      <>
                        <button onClick={() => advertir(a)} disabled={!!accionando}
                          style={{ background: "#fff8e1", color: "#e65100", border: "1px solid #ffcc80", borderRadius: 8, padding: "7px 14px", fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: accionando ? 0.5 : 1 }}>
                          {enAccion(a.id, "advertir") ? "Enviando…" : "⚠️ Advertir"}
                        </button>
                        <button onClick={() => bloquear(a)} disabled={!!accionando}
                          style={{ background: "#fce4ec", color: "#b71c1c", border: "1px solid #ef9a9a", borderRadius: 8, padding: "7px 14px", fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: accionando ? 0.5 : 1 }}>
                          {enAccion(a.id, "bloquear") ? "Bloqueando…" : "🚫 Bloquear"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
