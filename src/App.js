import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as sb from "./supabase";
import { trackPage, trackLogin, trackPublicacionCreada, trackOnboardingComplete, trackFarosPlay, setUserId, setUserProperties, trackPurchase, trackPerfilView } from "./analytics";
import {
  C, FONT, _themeKey,
  applyTheme, toast, ToastContainer,
  t,
  _avatarCache,
  Btn,
  useMPRetorno,
  LegalModal,
} from "./shared";
// ─── EAGER IMPORTS (shell crítico) ────────────────────────────────────────────
import FavBtn from "./components/FavBtn";
import DenunciaModal from "./components/DenunciaModal";
import PostChatBtn from "./components/PostChatBtn";
import ShareBtn from "./components/ShareBtn";
import OfertarBtn from "./components/OfertarBtn";
import Sidebar from "./components/Sidebar";
import { User, GraduationCap, Sparkles } from "lucide-react";
import ScrollToTopBtn from "./components/ScrollToTopBtn";
import CookieBanner from "./components/CookieBanner";
import UpdateBanner from "./components/UpdateBanner";
import PushPermissionBanner from "./components/PushPermissionBanner";
import usePushSubscription from "./hooks/usePushSubscription";
import ChatBotWidget from "./components/ChatBotWidget";
import FinalizarClaseModal from "./components/FinalizarClaseModal";
import { MyPostCard, ContraofertaModal, OfertasRecibidasModal } from "./MyPostsPage";
import ExplorePage from "./ExplorePage";

// ─── LAZY IMPORTS (páginas y modales que no se necesitan en el primer render) ──
const LandingPage       = React.lazy(() => import('./LandingPage'));
const AuthScreen        = React.lazy(() => import('./AuthScreen'));
const TerminosPage      = React.lazy(() => import('./TerminosPage'));
const PoliticaDevoluciones   = React.lazy(() => import('./PoliticaDevoluciones'));
const DefensaConsumidorPage  = React.lazy(() => import('./DefensaConsumidorPage'));
const AyudaPage         = React.lazy(() => import('./AyudaPage'));
const LibroQuejasPage   = React.lazy(() => import('./LibroQuejasPage'));
const AccesibilidadPage = React.lazy(() => import('./AccesibilidadPage'));
const PrivacidadPage    = React.lazy(() => import('./PrivacidadPage'));
const AgendaPage        = React.lazy(() => import('./AgendaPage'));
const AdminPage         = React.lazy(() => import('./AdminPage'));
const InscripcionesPage = React.lazy(() => import('./InscripcionesPage'));
const ChatsPage         = React.lazy(() => import('./ChatsPage'));
const FavoritosPage     = React.lazy(() => import('./FavoritosPage'));
const ChatModal         = React.lazy(() => import('./components/ChatModal'));
const CertificadoPage   = React.lazy(() => import('./components/CertificadoPage'));
const NotifPanel        = React.lazy(() => import('./components/NotifPanel'));

// CursoPage ecosystem — lazy loaded (solo se descarga al abrir un curso)
const CursoPage = React.lazy(() => import('./CursoPage'));


// ─── LAZY IMPORTS ─────────────────────────────────────────────────────────────
const DetailModal    = React.lazy(() => import('./DetailModal'));
const PostFormModal  = React.lazy(() => import('./PostFormModal'));
const OnboardingModal= React.lazy(() => import('./OnboardingModal'));
const MiCuentaPage   = React.lazy(() => import('./MiCuentaPage'));

// Named exports from PostFormModal bundle
const PerfilPage     = React.lazy(() => import('./PostFormModal').then(m => ({ default: m.PerfilPage })));
const FarosPage      = React.lazy(() => import('./FarosPage'));
const ShikakuPage    = React.lazy(() => import('./ShikakuPage'));
const JuegosHub      = React.lazy(() => import('./JuegosHub'));

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
// Named exports for lazy-loaded modules that need these components
export { FavBtn, OfertarBtn, ShareBtn, DenunciaModal, PostChatBtn,
         MyPostCard, OfertasRecibidasModal, FinalizarClaseModal,
         ContraofertaModal };

// ── Pantalla de nueva contraseña (recovery flow desde email) ─────────────────
function ResetPasswordScreen({ accessToken, onSuccess, onCancel }) {
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (pass1.length < 6) { setErr("La contraseña debe tener al menos 6 caracteres"); return; }
    if (pass1 !== pass2) { setErr("Las contraseñas no coinciden"); return; }
    setLoading(true); setErr("");
    try {
      await sb.updatePassword(accessToken, pass1);
      setDone(true);
      setTimeout(onSuccess, 1800);
    } catch (e) {
      const msg = (e.message || "").toLowerCase();
      if (msg.includes("at least") || msg.includes("password should")) {
        setErr("La contraseña debe tener al menos 6 caracteres");
      } else {
        setErr(e.message || "No se pudo actualizar la contraseña. Intentá de nuevo.");
      }
    } finally { setLoading(false); }
  };

  const iS={width:"100%",background:"#F4F7FF",border:"1.5px solid #DDE5F5",borderRadius:10,padding:"12px 14px",color:"#0D1F3C",fontSize:16,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:12};

  return (
    <div style={{minHeight:"100vh",display:"flex",fontFamily:FONT,background:"#F6F9FF"}}>
      <style>{`
        .reset-left{display:flex!important}
        @media(max-width:720px){.reset-left{display:none!important}}
        .reset-logo-m{display:none!important}
        @media(max-width:720px){.reset-logo-m{display:flex!important}}
        input{color-scheme:light;background-color:#F4F7FF!important;color:#0D1F3C!important}
        input::placeholder{color:#A0AEC0;opacity:1}
      `}</style>

      {/* Panel izquierdo — igual que AuthScreen */}
      <div className="reset-left" style={{flex:"0 0 400px",background:"linear-gradient(160deg,#0A2A5E 0%,#1A6ED8 55%,#2EC4A0 100%)",display:"flex",flexDirection:"column",padding:"48px 40px",position:"relative",overflow:"hidden",justifyContent:"space-between"}}>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:44}}>
            <div style={{width:52,height:52,borderRadius:14,background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>
              <img src="/logo.png" alt="Luderis" style={{width:36,height:36,objectFit:"contain"}}/>
            </div>
            <span style={{fontSize:26,fontWeight:800,color:"#fff",letterSpacing:"-.5px"}}>Luderis</span>
          </div>
          <h2 style={{color:"#fff",fontSize:31,fontWeight:800,lineHeight:1.2,margin:"0 0 14px",letterSpacing:"-.5px"}}>
            Aprendé lo que quieras,<br/>enseñá lo que sabés.
          </h2>
          <p style={{color:"rgba(255,255,255,.7)",fontSize:14,lineHeight:1.75,margin:0}}>
            Conectamos personas para compartir conocimiento.<br/>Transparente, seguro y sin cargos ocultos.
          </p>
        </div>
        <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:10}}>
          {[
            {n:"Clases particulares",d:"Encontrá tu docente ideal",icon:<User size={14} strokeWidth={2}/>},
            {n:"Cursos completos",d:"Con evaluaciones y certificados",icon:<GraduationCap size={14} strokeWidth={2}/>},
            {n:"Búsqueda con IA",d:"Te encuentra lo mejor",icon:<Sparkles size={14} strokeWidth={2}/>},
          ].map(({n,d,icon})=>(
            <div key={n} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,.09)",borderRadius:14,padding:"12px 16px",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.1)"}}>
              <div style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,color:"#fff"}}>{icon}</div>
              <div>
                <div style={{color:"#fff",fontWeight:700,fontSize:13}}>{n}</div>
                <div style={{color:"rgba(255,255,255,.6)",fontSize:11,marginTop:1}}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
        <div style={{width:"min(420px,100%)"}}>

          {/* Logo mobile */}
          <div className="reset-logo-m" style={{alignItems:"center",gap:10,marginBottom:24,justifyContent:"center"}}>
            <img src="/logo.png" alt="Luderis" style={{width:40,height:40,objectFit:"contain"}}/>
            <span style={{fontSize:22,fontWeight:800,background:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Luderis</span>
          </div>

          <button onClick={onCancel} style={{background:"none",border:"none",color:"#718096",fontSize:13,cursor:"pointer",fontFamily:FONT,padding:"0 0 18px",display:"flex",alignItems:"center",gap:5}}
            onMouseEnter={e=>e.currentTarget.style.color="#1A6ED8"} onMouseLeave={e=>e.currentTarget.style.color="#718096"}>
            ← Volver al inicio
          </button>

          <h2 style={{color:"#0D1F3C",fontSize:24,fontWeight:800,margin:"0 0 4px",letterSpacing:"-.4px"}}>Nueva contraseña</h2>
          <p style={{color:"#718096",fontSize:14,margin:"0 0 28px"}}>Elegí una contraseña segura para tu cuenta</p>

          {done ? (
            <div style={{textAlign:"center",padding:"24px 0",color:"#16a34a",fontSize:15,fontWeight:600,lineHeight:1.7}}>
              ✓ Contraseña actualizada correctamente.<br/>
              <span style={{fontSize:13,color:"#718096",fontWeight:400}}>Iniciando sesión…</span>
            </div>
          ) : (
            <>
              <div style={{marginBottom:0}}>
                <label style={{display:"block",fontWeight:600,fontSize:13,color:"#0D1F3C",marginBottom:6}}>Nueva contraseña</label>
                <input type="password" value={pass1} onChange={e=>setPass1(e.target.value)} placeholder="Mínimo 6 caracteres"
                  onKeyDown={e=>e.key==="Enter"&&handleSubmit()} style={iS}/>
              </div>
              <div style={{marginBottom:8}}>
                <label style={{display:"block",fontWeight:600,fontSize:13,color:"#0D1F3C",marginBottom:6}}>Confirmar contraseña</label>
                <input type="password" value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="Repetí tu contraseña"
                  onKeyDown={e=>e.key==="Enter"&&handleSubmit()} style={iS}/>
              </div>
              {err && <div style={{background:"#FFF0F0",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",color:"#B91C1C",fontSize:13,marginBottom:14}}>⚠ {err}</div>}
              <Btn onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"13px",fontSize:15,fontWeight:700,borderRadius:12,marginTop:4}}>
                {loading ? "Actualizando…" : "Actualizar contraseña"}
              </Btn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [session,setSession]=useState(()=>sb.loadSession());
  const [recoverySession,setRecoverySession]=useState(null);
  // Tema: fuerza re-render global al cambiar
  const [,forceThemeRender]=useState(0);
  useEffect(()=>{window.__setAppTheme=(key)=>{applyTheme(key);forceThemeRender(n=>n+1);};},[]); // eslint-disable-line
  const { showBanner: showPushBanner, subscribe: subscribePush, dismiss: dismissPush, triggerBanner: triggerPushBanner } = usePushSubscription(session);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [onboardingUpgrade,setOnboardingUpgrade]=useState(false);
  const [showAdmin,setShowAdmin]=useState(false);
  const [legalTab,setLegalTab]=useState(null);
  // Verificar onboarding cada vez que cambia la sesión
  // Cargar perfil completo desde DB al login — fuente de verdad
  useEffect(()=>{
    if(!session?.user?.email)return;
    const email=session.user.email;
    let mounted=true;
    sb.getUsuarioByEmail(email,session.access_token).then(u=>{
      if(!mounted)return;
      if(!u)return;
      // Sincronizar localStorage con los datos reales de la DB
      try{
        // Solo cachear avatares de dominios confiables
        const av=u.avatar_url&&["supabase.co","googleusercontent.com","gravatar.com","github.com","githubusercontent.com"].some(d=>{try{const h=new URL(u.avatar_url).hostname;return h===d||h.endsWith("."+d);}catch{return false;}})?u.avatar_url:null;
        if(av){localStorage.setItem("cl_avatar_"+email,av);_avatarCache[email]=av;}
        else{try{localStorage.removeItem("cl_avatar_"+email);}catch{}}
        if(u.bio)localStorage.setItem("cl_bio_"+email,u.bio);
        if(u.ubicacion)localStorage.setItem("cl_user_city",u.ubicacion);
        if(u.rol)localStorage.setItem("cl_rol_"+email,u.rol);
        if(u.onboarding_completado)localStorage.setItem("cl_onboarding_done_"+email,"1");
        if(u.materias_interes?.length)localStorage.setItem("cl_materias_pref_"+email,JSON.stringify(u.materias_interes));
      }catch{}
      // Verificar onboarding — solo mostrar si nunca fue completado ni descartado
      if(!u.onboarding_completado){
        try{const done=localStorage.getItem("cl_onboarding_done_"+email);if(!done){setOnboardingUpgrade(false);setShowOnboarding(true);}}catch{}
      }
    }).catch(()=>{
      if(!mounted)return;
      // Fallback a localStorage si falla la DB
      try{const done=localStorage.getItem("cl_onboarding_done_"+email);if(!done){setOnboardingUpgrade(false);setShowOnboarding(true);}}catch{}
    });
    return()=>{mounted=false;};
  },[session?.user?.email]);// eslint-disable-line
  const [chatPost,setChatPost]=useState(null);const [detailPost,setDetailPost]=useState(null);
  const [cursoPost,setCursoPostRaw]=useState(null);
  const setCursoPost=(p)=>{try{if(p)sessionStorage.setItem("cl_curso_id",p.id);else sessionStorage.removeItem("cl_curso_id");}catch{}setCursoPostRaw(p);};
  // Restaurar curso abierto al refrescar
  useEffect(()=>{
    if(!session)return;
    const id=sessionStorage.getItem("cl_curso_id");
    if(!id)return;
    let mounted=true;
    sb.getPublicacionesByIds([id],session.access_token).then(pubs=>{
      if(!mounted)return;
      const pub=pubs?.[0];
      if(pub&&pub.tipo==="oferta")setCursoPostRaw(pub);
      else sessionStorage.removeItem("cl_curso_id");
    }).catch(()=>{});
    return()=>{mounted=false;};
  },[session?.user?.email]);// eslint-disable-line
  // SEO: update title/meta when viewing a specific publication
  useEffect(()=>{
    if(cursoPost||detailPost){
      const pub=cursoPost||detailPost;
      document.title=`Luderis | ${pub.titulo}`;
      let meta=document.querySelector("meta[name='description']");
      if(!meta){meta=document.createElement("meta");meta.name="description";document.head.appendChild(meta);}
      meta.content=((pub.descripcion||"").slice(0,155))||`Clases de ${pub.materia||"educación"} en Luderis`;
    }
  },[cursoPost,detailPost]);const [perfilEmail,setPerfilEmail]=useState(null);const openPerfil=useCallback((email)=>{if(email)trackPerfilView();setPerfilEmail(email);},[]);const [certVerifId,setCertVerifId]=useState(null);const [chatsKey,setChatsKey]=useState(0);
  const [page,setPageRaw]=useState(()=>{try{return sessionStorage.getItem("cl_page")||"explore";}catch{return "explore";}});
  const setPage=(p)=>{try{sessionStorage.setItem("cl_page",p);}catch{}setPageRaw(p);};
  const [showForm,setShowForm]=useState(false);const [editPost,setEditPost]=useState(null);const [myPostsKey,setMyPostsKey]=useState(0);
  const [unread,setUnread]=useState(0);const [ofertasCount,setOfertasCount]=useState(0);const [notifCount,setNotifCount]=useState(0);const [notifs,setNotifs]=useState([]);
  const [farosWonToday,setFarosWonToday]=useState(false);
  const [shikakuWonToday,setShikakuWonToday]=useState(false);
  // Badge rojo en "Juegos": visible mientras quede al menos 1 juego pendiente
  const juegosBadge = !farosWonToday || !shikakuWonToday;
  const [notifPanelOpen,setNotifPanelOpen]=useState(false);
  // Función para abrir el panel de notificaciones (pasada como prop a Sidebar)
  const openNotifPanel=useCallback(()=>setNotifPanelOpen(v=>!v),[]);
  // Tipos de notif que alimentan cada badge
  const TIPOS_CUENTA=["oferta_aceptada","oferta_rechazada","contraoferta","nueva_oferta","nueva_inscripcion","sistema","retiro_procesado","retiro_rechazado"];
  const TIPOS_INSC=["valorar_curso","nuevo_ayudante","busqueda_acordada","nuevo_contenido","clase_iniciada"];
  // Badge Actividad: MiCuentaPage llama esto al abrir la tab → marca como leídas en DB
  useEffect(()=>{
    window._resetCuentaBadge=()=>{
      setOfertasAceptadasNuevas(0);setOfertasCount(0);
      const s=sessionRef.current;
      if(s?.user?.email)sb.marcarNotifsTipoLeidas(s.user.email,TIPOS_CUENTA,s.access_token).catch(()=>{});
    };
    return()=>{window._resetCuentaBadge=null;};
  },[]);// eslint-disable-line
  // Badge Inscripciones: marca como leídas en DB al navegar a esa sección
  useEffect(()=>{
    if(page!=="inscripciones")return;
    setNotifCount(0);
    const s=sessionRef.current;
    if(s?.user?.email)sb.marcarNotifsTipoLeidas(s.user.email,TIPOS_INSC,s.access_token).catch(()=>{});
  },[page]);// eslint-disable-line
  // Exponer apertura del formulario de nueva publicación (usado por banners)
  useEffect(()=>{window._openNewPost=()=>{setEditPost(null);setShowForm(true);};return()=>{window._openNewPost=null;};},[]);// eslint-disable-line
  // Exponer navegación a publicación (para notification click)
  useEffect(()=>{
    window.__openPub=(pubId)=>{
      if(!pubId)return;
      sb.getPublicacionesByIds([pubId],session?.access_token).then(pubs=>{
        const pub=pubs?.[0];
        if(!pub)return;
        if(pub.tipo==="oferta")setCursoPost(pub);
        else setDetailPost(pub);
      }).catch(()=>{});
    };
    // Siempre abre DetailModal (para notifs de preguntas/respuestas Q&A)
    window.__openDetail=(pubId)=>{
      if(!pubId)return;
      sb.getPublicacionesByIds([pubId],session?.access_token).then(pubs=>{
        const pub=pubs?.[0];
        if(pub)setDetailPost(pub);
      }).catch(()=>{});
    };
    return()=>{window.__openPub=null;window.__openDetail=null;};
  },[session]);//eslint-disable-line
  const [ofertasAceptadasNuevas,setOfertasAceptadasNuevas]=useState(0);
  const [sidebarOpen,setSidebarOpen]=useState(false);const [isMobile,setIsMobile]=useState(window.innerWidth<768);
  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<768);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);

  // ── Retorno de Mercado Pago ───────────────────────────────────────────────
  useMPRetorno(async(pubId)=>{
    // Al volver con pago aprobado, abrir la publicación para inscribir
    if(!session)return;
    try{
      const pubs=await sb.getPublicaciones({},session.access_token);
      const pub=pubs.find(p=>p.id===pubId);
      if(pub){
        trackPurchase(pub);
        setDetailPost(pub);setPage("inscripciones");
      }
    }catch{}
  });
  const sessionRef=useRef(session);useEffect(()=>{sessionRef.current=session;},[session]);
  // Función para abrir el panel de admin (pasada como prop a Sidebar)
  const openAdmin=useCallback(()=>setShowAdmin(true),[]);
  // Abrir modal legal desde URL ?legal=tc|priv|quejas|acceso|consumidor|cookies
  useEffect(()=>{
    const p=new URLSearchParams(window.location.search).get("legal");
    if(p)setLegalTab(p);
  },[]);
  // Siempre inicia como false — se confirma desde DB (no localStorage) para evitar spoofing
  const [esAdmin,setEsAdmin]=useState(false);
  // Rol real del usuario (DB-verified, no localStorage)
  const [,setRolSesion]=useState("alumno");

  // Re-sync rol from DB on app load and on window focus
  useEffect(()=>{
    const syncRol=()=>{
      if(!session?.user?.email)return;
      sb.getUsuarioByEmail(session.user.email,session.access_token).then(u=>{
        if(u?.rol){
          try{localStorage.setItem("cl_rol_"+session.user.email,u.rol);}catch{}
          setRolSesion(u.rol);
          setEsAdmin(u.rol==="admin");
          setUserId(session.user.id);
          setUserProperties({rol:u.rol,city:u.ubicacion||localStorage.getItem("cl_user_city")||""});
        }
      }).catch(()=>{});
    };
    syncRol();
    window.addEventListener("focus",syncRol);
    return()=>window.removeEventListener("focus",syncRol);
  },[session]);
  // Handle Google OAuth callback — tokens come back in URL hash
  // ── Detección de abandono temprano ─────────────────────────────────────────
  useEffect(()=>{
    if(!session)return;
    const KEY=`cl_abandon_check_${session.user.email}`;
    const lastCheck=parseInt(localStorage.getItem(KEY)||"0");
    const ahora=Date.now();
    // Chequear una vez cada 24 horas
    if(ahora-lastCheck<86400000)return;
    localStorage.setItem(KEY,String(ahora));
    // Verificar inscripciones sin actividad reciente
    sb.getMisInscripciones(session.user.email,session.access_token).then(inscripciones=>{
      if(!inscripciones?.length)return;
      const hace7dias=new Date(ahora-7*86400000).toISOString();
      const abandonadas=inscripciones.filter(i=>{
        if(i.completada||i.activo===false)return false;
        const ultimo=i.ultimo_acceso||i.created_at;
        return ultimo<hace7dias;
      });
      if(abandonadas.length>0&&window.__pushNotif&&document.hidden){
        const pub=abandonadas[0];
        window.__pushNotif(
          "¿Seguís aprendiendo? 📚",
          `Hace más de 7 días que no entraste a "${pub.pub_titulo||"tu clase"}". ¡No pierdas el ritmo!`
        );
      }
    }).catch(()=>{});
  },[session]);

  // SVG como data URL para el ícono de notificaciones (no depende de archivos externos)
  const NOTIF_ICON="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231A6ED8'/%3E%3Ctext x='32' y='44' font-size='36' text-anchor='middle' font-family='system-ui'%3E📚%3C/text%3E%3C/svg%3E";

  const mostrarNotifPush=useCallback((titulo,cuerpo,{tag="luderis-notif",pubId=null}={})=>{
    if(!("Notification" in window)||Notification.permission!=="granted")return;
    try{
      const n=new Notification(titulo,{body:cuerpo,icon:NOTIF_ICON,tag,renotify:true,silent:false});
      n.onclick=()=>{
        window.focus();n.close();
        if(pubId&&window.__openPub)window.__openPub(pubId);
      };
      setTimeout(()=>n.close(),8000);
    }catch{}
  },[]);

  // El permiso de notificaciones se pide vía PushPermissionBanner (usePushSubscription),
  // y se dispara al completar el onboarding — no a ciegas a los 8s. Ver triggerPushBanner.

  // Exponer globalmente para usarla desde cualquier lado
  useEffect(()=>{
    window.__pushNotif=mostrarNotifPush;
    return()=>{window.__pushNotif=null;};
  },[mostrarNotifPush]);

  useEffect(()=>{
    const hash=window.location.hash;
    if(!hash.includes("access_token"))return;
    const hashParams=new URLSearchParams(hash.replace("#",""));
    const isRecovery=hashParams.get("type")==="recovery";

    if(isRecovery){
      // Flujo de reset: parsear JWT localmente (sin API call que puede fallar)
      const access_token=hashParams.get("access_token");
      const refresh_token=hashParams.get("refresh_token");
      if(!access_token)return;
      window.location.hash="";
      try{
        const b64=access_token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");
        const payload=JSON.parse(atob(b64));
        const user={id:payload.sub,email:payload.email,user_metadata:payload.user_metadata||{}};
        const expires_at=payload.exp||Math.floor(Date.now()/1000)+3600;
        setRecoverySession({access_token,refresh_token,user,expires_at});
      }catch{
        // Si falla el parseo del JWT, intentar vía API como fallback
        fetch(`${sb.SUPABASE_URL}/auth/v1/user`,{headers:{"apikey":sb.SUPABASE_KEY,"Authorization":`Bearer ${access_token}`}})
          .then(r=>r.ok?r.json():null)
          .then(user=>{if(user)setRecoverySession({access_token,refresh_token,user,expires_at:Math.floor(Date.now()/1000)+3600});})
          .catch(()=>{});
      }
      return;
    }

    // Flujo normal de Google OAuth
    sb.getSessionFromUrl().then(async s=>{
      if(!s)return;
      window.location.hash="";
      sb.saveSession(s);
      trackLogin("google");
      try{
        // Fix #10: no sobreescribir avatar con null si Google no lo provee
        const _uData={id:s.user.id,email:s.user.email,nombre:s.user.user_metadata?.full_name||s.user.email.split("@")[0]};
        if(s.user.user_metadata?.avatar_url)_uData.avatar_url=s.user.user_metadata.avatar_url;
        await sb.upsertUsuario(_uData,s.access_token);
        const nombre=s.user.user_metadata?.full_name||s.user.email.split("@")[0];
        try{localStorage.setItem("dn_"+s.user.email,nombre);}catch{}
      }catch{}
      setSession(s);
    }).catch(()=>{});
  },[]);// eslint-disable-line

  useEffect(()=>{sb.setSessionRefreshCallback(async()=>{const c=sessionRef.current;if(!c?.refresh_token)return null;try{const s=await sb.refreshSession(c.refresh_token);sb.saveSession(s);setSession(s);return s;}catch{sb.clearSession();setSession(null);toast("Tu sesión expiró. Iniciá sesión nuevamente.","error",0);return null;}});},[]);

  // ── Proactive token refresh — renueva el JWT 5 min antes de que expire ────────
  useEffect(()=>{
    if(!session?.refresh_token)return;
    const doRefresh=async()=>{
      const c=sessionRef.current;
      if(!c?.refresh_token)return;
      try{const s=await sb.refreshSession(c.refresh_token);sb.saveSession(s);setSession(s);}catch{}
    };
    // expires_at: Unix timestamp en segundos (viene de Supabase auth)
    // Fallback: asumir 3600s de vida si no está presente
    const expiresAt=(session.expires_at??Math.floor(Date.now()/1000)+3600)*1000;
    const msLeft=expiresAt-Date.now();
    const delay=Math.max(msLeft-5*60*1000,0);// 5 min antes de expirar, mínimo 0
    const t=setTimeout(doRefresh,delay);
    return()=>clearTimeout(t);
  },[session?.expires_at,session?.refresh_token]);// eslint-disable-line

  // ── Faros: inicializa desde DB; se actualiza inmediatamente al ganar ──────────
  useEffect(() => {
    if (!session?.access_token) { setFarosWonToday(false); return; }
    let mounted = true;
    sb.getTodaysPuzzle(session.access_token)
      .then(p => {
        if (!mounted || !p) return;
        return sb.getTodaysPuzzleResult(session.access_token, p.id);
      })
      .then(result => {
        if (!mounted) return;
        setFarosWonToday(!!result);
      })
      .catch(() => { if (mounted) setFarosWonToday(false); });
    return () => { mounted = false; };
  }, [session?.access_token]); // eslint-disable-line

  // ── Shikaku badge: inicializa desde DB; se actualiza inmediatamente al ganar ──
  useEffect(() => {
    if (!session?.access_token) { setShikakuWonToday(false); return; }
    let mounted = true;
    const today = new Date().toLocaleDateString('sv');
    sb.getShikakuResult(session.access_token, today)
      .then(result => { if (mounted) setShikakuWonToday(!!result); })
      .catch(() => { if (mounted) setShikakuWonToday(false); });
    return () => { mounted = false; };
  }, [session?.access_token]); // eslint-disable-line

  // Set de IDs de publicaciones donde el usuario ya está inscripto (para redirigir directo a CursoPage)
  const inscritosRef=useRef(new Set());
  const refreshInscritos=useCallback(()=>{
    if(!session)return;
    sb.getMisInscripciones(session.user.email,session.access_token)
      .then(ins=>{inscritosRef.current=new Set((ins||[]).map(i=>i.publicacion_id));})
      .catch(()=>{});
  },[session?.user?.email,session?.access_token]);// eslint-disable-line
  useEffect(()=>{refreshInscritos();},[refreshInscritos]);
  const openDetail=useCallback((post)=>{
    if(post?.tipo==="oferta"&&inscritosRef.current.has(post.id)){setCursoPost(post);}
    else{setDetailPost(post);}
  },[]);// eslint-disable-line

  const chatPostRef=useRef(null);
  const refreshUnread=useCallback(()=>{
    if(!session)return;
    Promise.all([
      sb.getMisChats(session.user.email,session.access_token),
      sb.getOfertasRecibidas(session.user.email,session.access_token),
      sb.getNotificaciones(session.user.email,session.access_token).catch(()=>[]),
    ]).then(([msgs,ofertas,nfs])=>{
      const openId=chatPostRef.current?.id;
      const openOtro=chatPostRef.current?.autor_email;
      const newUnread=msgs.filter(m=>m.de_nombre!==session.user.email&&!m.leido&&m.para_nombre!=="__grupo__"&&!(m.publicacion_id===openId&&(m.de_nombre===openOtro||m.para_nombre===openOtro))).length;
      // Push notification si hay mensajes nuevos y la tab no está activa
      if(newUnread>0&&document.hidden&&window.__pushNotif){
        const lastMsg=msgs.filter(m=>m.de_nombre!==session.user.email&&!m.leido&&m.para_nombre!=="__grupo__").slice(-1)[0];
        if(lastMsg){
          const senderName=sb.getDisplayName(lastMsg.de_nombre)||"Alguien";
          const isImg=lastMsg.texto?.startsWith("[img]");
          const preview=isImg?"📷 Imagen":(lastMsg.texto||"").slice(0,100);
          window.__pushNotif(
            `💬 Mensaje de ${senderName}`,
            preview,
            {tag:`luderis-chat-${lastMsg.publicacion_id}`,pubId:lastMsg.publicacion_id}
          );
        }
      }
      setUnread(newUnread);
      setOfertasCount(ofertas.length);
      // Notifs para Mis inscripciones
      const notifsInsc=(nfs||[]).filter(n=>["valorar_curso","nuevo_ayudante","busqueda_acordada","nuevo_contenido","clase_iniciada"].includes(n.tipo));
      setNotifCount(notifsInsc.length);setNotifs(nfs||[]);
      // Push urgente para clase en vivo
      const claseViva=notifsInsc.filter(n=>n.tipo==="clase_iniciada"&&!n.leida);
      if(claseViva.length>0&&window.__pushNotif){
        const n=claseViva[0];
        window.__pushNotif("📹 ¡Clase en vivo!",`${n.pub_titulo} — Uníte ahora`,{tag:`luderis-clase-${n.publicacion_id}`,pubId:n.publicacion_id});
      }
      // Badge Mi Cuenta: notifs de ofertas/contras/inscripciones recibidas
      const notifsCuenta=(nfs||[]).filter(n=>["oferta_aceptada","oferta_rechazada","contraoferta","nueva_oferta","nueva_inscripcion","sistema"].includes(n.tipo));
      // Push para notificaciones nuevas
      if(notifsCuenta.length>0&&document.hidden&&window.__pushNotif){
        const lastNotif=notifsCuenta[0];
        const LABELS={oferta_aceptada:"✅ Oferta aceptada",nueva_inscripcion:"🎓 Nueva inscripción",sistema:"📣 Anuncio de Luderis",nueva_oferta:"📩 Nueva oferta",oferta_rechazada:"❌ Oferta rechazada",contraoferta:"🔄 Contraoferta recibida",retiro_procesado:"💰 Retiro procesado",retiro_rechazado:"❌ Retiro rechazado"};
        window.__pushNotif(
          LABELS[lastNotif.tipo]||"🔔 Notificación",
          lastNotif.pub_titulo||"Tenés una notificación nueva en Luderis",
          {tag:`luderis-cuenta-${lastNotif.tipo}`,pubId:lastNotif.publicacion_id}
        );
      }
      setOfertasAceptadasNuevas(notifsCuenta.length);
    }).catch(()=>{});
  },[session]);
  // ── Supabase Realtime: notificaciones instantáneas ─────────────────────────
  useEffect(()=>{
    if(!session?.user?.email)return;
    const email=session.user.email;
    const getToken=()=>sessionRef.current?.access_token;
    if(!getToken())return;
    const NOTIF_LABELS={
      nueva_inscripcion:{icon:"🎓",label:"Nueva inscripción",type:"success"},
      nueva_oferta:{icon:"📩",label:"Nueva oferta",type:"info"},
      oferta_aceptada:{icon:"✅",label:"Oferta aceptada",type:"success"},
      oferta_rechazada:{icon:"❌",label:"Oferta rechazada",type:"error"},
      contraoferta:{icon:"🔄",label:"Contraoferta recibida",type:"info"},
      nuevo_mensaje:{icon:"💬",label:"Mensaje nuevo",type:"info"},
      clase_iniciada:{icon:"📹",label:"¡Clase en vivo!",type:"success"},
      nuevo_contenido:{icon:"📚",label:"Nuevo contenido",type:"info"},
      nuevo_ayudante:{icon:"🤝",label:"¡Sos co-docente!",type:"success"},
      valorar_curso:{icon:"⭐",label:"Valorar curso",type:"info"},
      pago_aprobado_mp:{icon:"💳",label:"Pago aprobado",type:"success"},
      sistema:{icon:"📣",label:"Anuncio de Luderis",type:"info"},
      nueva_pregunta:    {icon:"❓",label:"Nueva pregunta en tu publicación",type:"info"},
      pregunta_respondida:{icon:"✅",label:"Tu pregunta fue respondida",type:"success"},
      alerta_contacto:   {icon:"🔇",label:"Alerta de moderación",type:"error"},
      pago_liberado:     {icon:"💰",label:"Pago acreditado",type:"success"},
      retiro_procesado:  {icon:"💰",label:"Retiro procesado",type:"success"},
      retiro_rechazado:  {icon:"❌",label:"Retiro rechazado",type:"error"},
      retiro_solicitado: {icon:"💳",label:"Solicitud de retiro recibida",type:"info"},
      busqueda_acordada: {icon:"🤝",label:"Búsqueda acordada",type:"success"},
      busqueda_eliminada:{icon:"❌",label:"Búsqueda eliminada",type:"error"},
      acuerdo_confirmado:{icon:"🤝",label:"Acuerdo confirmado",type:"success"},
    };
    let ws,heartbeat,reconnectTimer,dead=false,retries=0,joinedToken=null;
    // Refresca la sesión si hay refresh_token; devuelve el token nuevo (o null)
    const tryRefresh=async()=>{
      const c=sessionRef.current;
      if(!c?.refresh_token)return null;
      try{const s=await sb.refreshSession(c.refresh_token);sb.saveSession(s);setSession(s);return s?.access_token||null;}catch{return null;}
    };
    const scheduleReconnect=()=>{
      if(dead)return;
      retries++;
      // backoff con techo de 30s; nunca se rinde permanentemente
      reconnectTimer=setTimeout(connect,Math.min(3000*retries,30000));
    };
    const connect=async()=>{
      if(dead)return;
      let token=getToken();
      if(!token)token=await tryRefresh();// si no hay token, intentar refrescar antes de conectar
      if(!token||dead)return;
      try{
        ws=new WebSocket(`${sb.SUPABASE_URL.replace("https","wss")}/realtime/v1/websocket?apikey=${sb.SUPABASE_KEY}&vsn=1.0.0`);
        ws.onopen=()=>{
          retries=0;// reset al conectar exitosamente
          joinedToken=getToken();
          // Supabase Realtime v2: channel arbitrario + access_token del usuario para RLS
          ws.send(JSON.stringify({
            topic:"realtime:luderis-notifs",event:"phx_join",
            payload:{
              config:{broadcast:{ack:false,self:false},presence:{key:""},
                postgres_changes:[{event:"INSERT",schema:"public",table:"notificaciones",filter:`alumno_email=eq.${email}`}]
              },
              access_token:joinedToken
            },ref:"1"
          }));
          heartbeat=setInterval(()=>{
            if(ws.readyState!==WebSocket.OPEN)return;
            const cur=getToken();
            // Si el token se renovó (refresh proactivo), empujarlo al socket vivo
            // para que Supabase no cierre la conexión al expirar el JWT viejo.
            if(cur&&cur!==joinedToken){
              ws.send(JSON.stringify({topic:"realtime:luderis-notifs",event:"access_token",payload:{access_token:cur},ref:"at"}));
              joinedToken=cur;
            }
            ws.send(JSON.stringify({topic:"phoenix",event:"heartbeat",payload:{},ref:"hb"}));
          },25000);
        };
        ws.onmessage=(e)=>{
          try{
            const msg=JSON.parse(e.data);
            // Supabase envía postgres_changes con payload.data.type === "INSERT"
            if(msg.event==="postgres_changes"){
              const record=msg.payload?.data?.record;
              if(!record)return;
              refreshUnread();
              if(record.tipo){
                const info=NOTIF_LABELS[record.tipo]||{icon:"🔔",label:"Notificación",type:"info"};
                const texto=record.pub_titulo?`${info.icon} ${info.label} — ${record.pub_titulo}`:`${info.icon} ${info.label}`;
                toast(texto,info.type,5000);
              }
            }
          }catch{}
        };
        ws.onclose=async()=>{
          clearInterval(heartbeat);
          if(dead)return;
          // Si el socket cerró por JWT expirado, refrescar antes de reintentar.
          await tryRefresh();
          scheduleReconnect();
        };
        ws.onerror=()=>{try{ws.close();}catch{}};
      }catch{scheduleReconnect();}
    };
    connect();
    return()=>{dead=true;clearInterval(heartbeat);clearTimeout(reconnectTimer);try{ws?.close();}catch{}};
  },[session?.user?.email,refreshUnread]);// eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{
    refreshUnread();
    let t=setInterval(refreshUnread,30000);// fallback — Realtime cubre el tiempo real
    // Share link handler — si viene ?pub=ID en la URL, abrir el popup
    try{
      const params=new URLSearchParams(window.location.search);
      // Abrir perfil de docente si viene ?perfil=email en la URL
      const perfilParam=params.get("perfil");
      if(perfilParam){openPerfil(decodeURIComponent(perfilParam));setPage("explore");}
      // Abrir verificación de certificado si viene ?certificado=ID
      const certParam=params.get("certificado");
      if(certParam){setCertVerifId(certParam);}
      // Guardar código de referido si viene ?ref=CODE
      const refCode=params.get("ref");
      if(refCode){try{localStorage.setItem("cl_ref_code",refCode);}catch{}}
      const pubId=params.get("pub");
      if(pubId){
        window.history.replaceState({},"",window.location.pathname);
        sb.db(`publicaciones_con_autor?id=eq.${pubId}`,"GET",null,session.access_token)
          .then(r=>{if(r?.[0])setDetailPost(r[0]);}).catch(()=>{});
      }
      // MP Connect OAuth return → navegar a Mi Cuenta (PagosTab maneja el toast)
      const mpConnect=params.get("mp_connect");
      if(mpConnect){setPage("cuenta");}
    }catch{}
    const onVisibility=()=>{
      clearInterval(t);
      if(!document.hidden){
        // Al volver el foco: si el JWT está por vencer (<10 min), refrescarlo.
        // Los navegadores throttlean los timers en pestañas en segundo plano,
        // así que el refresh proactivo por setTimeout puede no haber corrido.
        const c=sessionRef.current;
        if(c?.refresh_token){
          const expMs=(c.expires_at??Math.floor(Date.now()/1000)+3600)*1000;
          if(expMs-Date.now()<10*60*1000){
            sb.refreshSession(c.refresh_token).then(s=>{sb.saveSession(s);setSession(s);}).catch(()=>{});
          }
        }
        refreshUnread(); // actualizar inmediatamente al volver
        t=setInterval(refreshUnread,30000);
      }
    };
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{clearInterval(t);document.removeEventListener("visibilitychange",onVisibility);};
  },[refreshUnread]);// eslint-disable-line react-hooks/exhaustive-deps
  // ── Google Analytics: track page navigation ──────────────────────────────
  useEffect(()=>{
    trackPage(page);
    if(page==="faros")trackFarosPlay();
  },[page]);// eslint-disable-line

  const PAGE_TITLES={explore:"Luderis",agenda:"Luderis | Agenda",chats:"Luderis | Chats",favoritos:"Luderis | Favoritos",inscripciones:"Luderis | Mis clases",cuenta:"Luderis | Mi cuenta",juegos:"Luderis | Juegos",faros:"Luderis | Faros",shikaku:"Luderis | Shikaku"};
  useEffect(()=>{
    document.title=PAGE_TITLES[page]||"Luderis";
    // Update meta description per page
    const descs={
      explore:"Explorá clases particulares, cursos online y presenciales en Argentina. Matemática, inglés, guitarra, programación y mucho más.",
      chats:"Tus conversaciones con docentes y alumnos en Luderis.",
      inscripciones:"Tus clases y cursos activos en Luderis.",
      cuenta:"Gestioná tu perfil, publicaciones y estadísticas en Luderis.",
    };
    let meta=document.querySelector("meta[name='description']");
    if(!meta){meta=document.createElement("meta");meta.name="description";document.head.appendChild(meta);}
    meta.content=descs[page]||"Luderis — La plataforma educativa argentina. Encontrá docentes verificados para clases particulares y cursos online o presenciales.";
    // OG tags
    let ogTitle=document.querySelector("meta[property='og:title']");
    if(!ogTitle){ogTitle=document.createElement("meta");ogTitle.setAttribute("property","og:title");document.head.appendChild(ogTitle);}
    ogTitle.content=document.title;
    let ogDesc=document.querySelector("meta[property='og:description']");
    if(!ogDesc){ogDesc=document.createElement("meta");ogDesc.setAttribute("property","og:description");document.head.appendChild(ogDesc);}
    ogDesc.content=meta.content;
  },[page]);// eslint-disable-line
  const logout=()=>{sb.clearSession();setSession(null);try{sessionStorage.removeItem("cl_curso_id");sessionStorage.removeItem("cl_page");}catch{};setPage("explore");};
  const openChat=(p)=>{chatPostRef.current=p;setChatPost(p);};
  const closeChat=()=>{chatPostRef.current=null;setChatPost(null);refreshUnread();setChatsKey(k=>k+1);};
  // Tema con estado React para re-render
  const [currentTheme,setCurrentTheme]=useState(_themeKey());
  const toggleTheme=()=>{const next=currentTheme==="light"?"dark":"light";applyTheme(next);setCurrentTheme(next);forceThemeRender(n=>n+1);};
  // Rutas públicas sin autenticación
  const _SF=<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,color:C.muted}}></div>;
  if(window.location.pathname==="/terminos")return <React.Suspense fallback={_SF}><TerminosPage/></React.Suspense>;
  if(window.location.pathname==="/devoluciones")return <React.Suspense fallback={_SF}><PoliticaDevoluciones/></React.Suspense>;
  if(window.location.pathname==="/consumidor")return <React.Suspense fallback={_SF}><DefensaConsumidorPage/></React.Suspense>;
  if(window.location.pathname==="/ayuda")return <React.Suspense fallback={_SF}><AyudaPage/></React.Suspense>;
  if(window.location.pathname==="/quejas")return <React.Suspense fallback={_SF}><LibroQuejasPage/></React.Suspense>;
  if(window.location.pathname==="/accesibilidad")return <React.Suspense fallback={_SF}><AccesibilidadPage/></React.Suspense>;
  if(window.location.pathname==="/privacidad")return <React.Suspense fallback={_SF}><PrivacidadPage/></React.Suspense>;
  // Flujo de reset de contraseña (link desde email)
  if(recoverySession){
    return <ResetPasswordScreen
      accessToken={recoverySession.access_token}
      onSuccess={()=>{
        sb.saveSession(recoverySession);
        setRecoverySession(null);
        setSession(recoverySession);
      }}
      onCancel={()=>{
        setRecoverySession(null);
      }}
    />;
  }
  if(!session){
    const showAuth=window.location.hash==="#auth"||sessionStorage.getItem("ld_auth")==="1";
    const goAuth=()=>{sessionStorage.setItem("ld_auth","1");window.location.hash="#auth";forceThemeRender(n=>n+1);};
    if(!showAuth)return(<><style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}@keyframes fadeSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}*{box-sizing:border-box;margin:0;padding:0}html,body,#root{min-height:100vh;font-family:${FONT};overflow-x:hidden;max-width:100vw}`}</style><React.Suspense fallback={null}><LandingPage onEnter={goAuth}/></React.Suspense></>);
    return(<><style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}@keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}html,body,#root{background:#F6F9FF;min-height:100vh;font-family:${FONT};overflow-x:hidden;max-width:100vw}input,textarea,select{color-scheme:light;background-color:#F4F7FF!important;color:#0D1F3C!important}input::placeholder,textarea::placeholder{color:#A0AEC0;opacity:1}`}</style><React.Suspense fallback={null}><AuthScreen onLogin={s=>{sessionStorage.removeItem("ld_auth");window.location.hash="";sb.saveSession(s);setSession(s);}}/></React.Suspense></>);
  }
  const SW=isMobile?0:224;
  return(
    <div style={{minHeight:"100vh",background:`var(--cl-section-tint, ${C.bg})`,fontFamily:FONT,color:C.text,display:"flex",transition:"background .4s ease",overflowX:"hidden",maxWidth:"100vw"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes tabPulse{0%,100%{opacity:1}50%{opacity:0.5}}@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}*{box-sizing:border-box}html,body,#root{background:${C.bg};color:${C.text};min-height:100vh;font-family:${FONT};overflow-x:hidden;max-width:100vw}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}::-webkit-scrollbar-track{background:transparent}.cl-card-anim{animation:fadeUp .2s ease both}.cl-fade{animation:fadeIn .15s ease both}.sk{background:linear-gradient(90deg,var(--cl-sk-a,#E2E8F0) 25%,var(--cl-sk-b,#F7FAFC) 50%,var(--cl-sk-a,#E2E8F0) 75%);background-size:400px;animation:shimmer 1.4s infinite linear;border-radius:6px}.cl-card-anim:nth-child(1){animation-delay:0ms}.cl-card-anim:nth-child(2){animation-delay:40ms}.cl-card-anim:nth-child(3){animation-delay:80ms}.cl-card-anim:nth-child(4){animation-delay:120ms}.cl-card-anim:nth-child(5){animation-delay:160ms}.cl-card-anim:nth-child(6){animation-delay:200ms}input,textarea,select{color-scheme:${_themeKey()==="light"?"light":"dark"};background-color:${C.surface}!important;color:${C.text}!important;border-color:${C.border}}input::placeholder,textarea::placeholder{color:${C.muted};opacity:1}input:focus,textarea:focus,select:focus{border-color:${C.accent}!important;outline:none}@media(max-width:768px){input,textarea,select{font-size:16px!important}.cl-hide-desk{display:none!important}button{-webkit-tap-highlight-color:transparent}}.cl-tabs-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.cl-tabs-scroll::-webkit-scrollbar{display:none}.cl-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:600px){.cl-grid-2{grid-template-columns:1fr!important}}.cl-row-wrap{display:flex;flex-wrap:wrap;gap:8px}.curso-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.curso-actions::-webkit-scrollbar{display:none}@media(max-width:600px){.curso-actions{overflow-x:auto!important;flex-wrap:nowrap!important;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px;gap:6px!important}.curso-actions button,.curso-actions a{white-space:nowrap;font-size:11px!important;padding:5px 9px!important;min-height:0!important}.curso-actions span{white-space:nowrap;font-size:11px!important}.curso-pad{padding:12px 14px!important}.curso-card{padding:13px 15px!important;border-radius:12px!important}.curso-main-header{padding:8px 12px!important}}`}</style>
      <Sidebar page={page} setPage={setPage} session={session} onLogout={logout} onNewPost={()=>{setEditPost(null);setShowForm(true);}} unreadCount={unread} ofertasCount={ofertasCount} notifCount={notifCount} totalNotifsUnread={notifs.filter(n=>!n.leida).length} ofertasAceptadasNuevas={ofertasAceptadasNuevas} mobile={isMobile} open={sidebarOpen} onClose={()=>setSidebarOpen(false)} theme={currentTheme} onToggleTheme={toggleTheme} onForceRender={()=>forceThemeRender(n=>n+1)} esAdmin={esAdmin} juegosBadge={juegosBadge} onOpenAdmin={openAdmin} onOpenNotifPanel={openNotifPanel}/>
      {isMobile&&(
        <>
          {/* Top bar mobile */}
          <div style={{position:"fixed",top:0,left:0,right:0,height:52,background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",zIndex:50,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",color:C.text,fontSize:20,cursor:"pointer",padding:"4px 6px",lineHeight:1}}>☰</button>
              <span style={{fontSize:16,fontWeight:700,color:C.text,letterSpacing:"-.3px",whiteSpace:"nowrap"}}>Luderis</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {/* Campana notificaciones */}
              {(()=>{const totalNoLeidas=notifs.filter(n=>!n.leida).length;return(
              <button onClick={()=>setNotifPanelOpen(v=>!v)} style={{position:"relative",background:"none",border:"none",cursor:"pointer",padding:"6px",borderRadius:"50%",lineHeight:1,color:totalNoLeidas>0?C.accent:C.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {totalNoLeidas>0&&<span style={{position:"absolute",top:0,right:0,background:C.danger,color:"#fff",borderRadius:10,fontSize:9,fontWeight:700,padding:"2px 5px",lineHeight:1.3,minWidth:16,textAlign:"center",boxShadow:"0 1px 4px rgba(0,0,0,.25)"}}>{totalNoLeidas>9?"9+":totalNoLeidas}</span>}
              </button>
              );})()}
              <Btn id="tour-btn-publicar" onClick={()=>{setEditPost(null);setShowForm(true);}} style={{padding:"6px 14px",fontSize:12,borderRadius:16}}>{t("newPost")}</Btn>
            </div>
          </div>
          {/* Bottom navbar mobile — SVG icons + pill active state */}
          <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,zIndex:50}}>
            <div style={{display:"flex",height:60,width:"100%"}}>
              {[
                {id:"explore",svg:`<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>`,label:t("explore"),badge:0},
                {id:"chats",svg:`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,label:t("chats"),badge:unread},
                {id:"favoritos",svg:`<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`,label:"Favoritos",badge:0},
                {id:"inscripciones",svg:`<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,label:t("classes"),badge:notifCount},
                {id:"cuenta",svg:`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,label:t("account"),badge:ofertasAceptadasNuevas+ofertasCount},
              ].map(item=>{
                const active=page===item.id;
                return(
                  <button key={item.id} onClick={()=>setPage(item.id)}
                    style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"4px 0 6px",position:"relative",fontFamily:FONT}}>
                    <div style={{borderRadius:14,padding:"5px 14px",background:active?`${C.accent}18`:"transparent",transition:"background .2s"}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active?C.accent:C.muted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",transition:"stroke .15s"}} dangerouslySetInnerHTML={{__html:item.svg}}/>
                    </div>
                    <span style={{fontSize:10,color:active?C.accent:C.muted,fontWeight:active?600:400,whiteSpace:"nowrap",transition:"color .15s"}}>{item.label}</span>
                    {item.badge>0&&(
                      item.badgeDot
                        ?<span style={{position:"absolute",top:6,right:"calc(50% - 14px)",width:8,height:8,borderRadius:"50%",background:C.danger||"#E53E3E"}}/>
                        :<span style={{position:"absolute",top:4,right:10,background:C.danger||"#E53E3E",color:"#fff",borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 4px",lineHeight:1.4}}>{item.badge>9?"9+":item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      <main style={{marginLeft:SW,flex:1,padding:isMobile?"62px 8px 70px":"24px 24px 24px",minHeight:"100vh",width:`calc(100vw - ${SW}px)`,maxWidth:`calc(100vw - ${SW}px)`,boxSizing:"border-box",background:"transparent",overflowX:"hidden"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <AnimatePresence mode="wait">
          <motion.div key={page}
            initial={{opacity:0,y:10}}
            animate={{opacity:1,y:0}}
            exit={{opacity:0,y:-6}}
            transition={{duration:0.18,ease:"easeOut"}}>
          {page==="explore"&&<ExplorePage session={session} onOpenChat={openChat} onOpenDetail={openDetail} onOpenPerfil={openPerfil} onOpenCurso={setCursoPost}/>}
          {page==="agenda"&&<React.Suspense fallback={<div style={{padding:"48px",textAlign:"center",color:C.muted,fontFamily:FONT}}></div>}><AgendaPage session={session} onOpenCurso={setCursoPost} onGoExplore={()=>setPage("explore")}/></React.Suspense>}
          {page==="chats"&&<React.Suspense fallback={<div style={{padding:"48px",textAlign:"center",color:C.muted,fontFamily:FONT}}></div>}><ChatsPage key={chatsKey} session={session} onOpenChat={openChat}/></React.Suspense>}
          {page==="favoritos"&&<React.Suspense fallback={<div style={{padding:"48px",textAlign:"center",color:C.muted,fontFamily:FONT}}></div>}><FavoritosPage session={session} onOpenDetail={openDetail} onOpenChat={openChat} onOpenPerfil={openPerfil} onGoExplore={()=>setPage("explore")}/></React.Suspense>}
          {page==="inscripciones"&&<React.Suspense fallback={<div style={{padding:"48px",textAlign:"center",color:C.muted,fontFamily:FONT}}></div>}><InscripcionesPage session={session} onOpenCurso={setCursoPost} onOpenChat={openChat} onGoExplore={()=>setPage("explore")} onMarkNotifsRead={()=>{sb.marcarNotifsTipoLeidas(session.user.email,["valorar_curso","nuevo_ayudante","busqueda_acordada","nuevo_contenido"],session.access_token).then(refreshUnread).catch(()=>{});}}/>
          </React.Suspense>}
          {page==="juegos"&&(
            <React.Suspense fallback={<div style={{padding:"48px",textAlign:"center",color:C.muted,fontFamily:FONT}}>Cargando…</div>}>
              <JuegosHub
                session={session}
                onPlayFaros={()=>setPage("faros")}
                onPlayShikaku={()=>setPage("shikaku")}
                farosWonToday={farosWonToday}
                shikakuWonToday={shikakuWonToday}
              />
            </React.Suspense>
          )}
          {page==="faros"&&(
            <React.Suspense fallback={<div style={{padding:"48px",textAlign:"center",color:C.muted,fontFamily:FONT}}>Cargando…</div>}>
              <FarosPage
                session={session}
                onBack={()=>setPage("juegos")}
                onWin={()=>setFarosWonToday(true)}
              />
            </React.Suspense>
          )}
          {page==="shikaku"&&(
            <React.Suspense fallback={<div style={{padding:"48px",textAlign:"center",color:C.muted,fontFamily:FONT}}>Cargando…</div>}>
              <ShikakuPage
                session={session}
                onBack={()=>setPage("juegos")}
                onWin={()=>setShikakuWonToday(true)}
              />
            </React.Suspense>
          )}
          {page==="cuenta"&&<React.Suspense fallback={<div style={{padding:"48px",textAlign:"center",color:C.muted,fontFamily:FONT}}>Cargando…</div>}><MiCuentaPage key={myPostsKey} session={session} onOpenDetail={setDetailPost} onOpenCurso={setCursoPost} onEdit={p=>{setEditPost(p);setShowForm(true);}} onNew={()=>{setEditPost(null);setShowForm(true);}} onOpenChat={openChat} onRefreshOfertas={refreshUnread} onStartOnboarding={()=>{setOnboardingUpgrade(true);setShowOnboarding(true);}} onClearBadge={()=>{
            setOfertasAceptadasNuevas(0);
            setOfertasCount(0);
            sb.marcarNotifsTipoLeidas(session.user.email,["oferta_aceptada","oferta_rechazada","contraoferta","nueva_oferta","nueva_inscripcion"],session.access_token).then(refreshUnread).catch(()=>{});
          }}/>
          </React.Suspense>}
          </motion.div>
          </AnimatePresence>
        </div>
      </main>
      {chatPost&&<React.Suspense fallback={null}><ChatModal post={chatPost} session={session} onClose={closeChat} onUnreadChange={refreshUnread}/></React.Suspense>}
      {detailPost&&<React.Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",zIndex:200}}><div style={{background:C.surface,borderRadius:16,padding:"32px 48px",color:C.text,fontFamily:FONT,fontSize:14}}>Cargando publicación…</div></div>}><DetailModal post={detailPost} session={session} onClose={()=>setDetailPost(null)} onChat={p=>{setDetailPost(null);openChat(p);}} onOpenCurso={p=>{setDetailPost(null);setCursoPost(p);}} onOpenPerfil={openPerfil} onOpenDetail2={p=>{setDetailPost(null);setTimeout(()=>setDetailPost(p),80);}}/></React.Suspense>}
      {cursoPost&&<React.Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",zIndex:200}}><div style={{background:C.surface,borderRadius:16,padding:"32px 48px",color:C.text,fontFamily:FONT,fontSize:14}}>Cargando curso…</div></div>}><CursoPage post={cursoPost} session={session} onClose={()=>setCursoPost(null)} onUpdatePost={p=>setCursoPost(p)}/></React.Suspense>}
      {certVerifId&&<React.Suspense fallback={null}><CertificadoPage certId={certVerifId} onClose={()=>setCertVerifId(null)}/></React.Suspense>}
      {perfilEmail&&<React.Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",zIndex:200}}><div style={{background:C.surface,borderRadius:16,padding:"32px 48px",color:C.text,fontFamily:FONT,fontSize:14}}>Cargando perfil…</div></div>}><PerfilPage autorEmail={perfilEmail} session={session} onClose={()=>setPerfilEmail(null)} onOpenDetail={(p)=>{setPerfilEmail(null);setTimeout(()=>setDetailPost(p),80);}} onOpenChat={(p)=>{setPerfilEmail(null);setTimeout(()=>openChat(p),80);}}/></React.Suspense>}
      {showForm&&<React.Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",zIndex:200}}><div style={{background:C.surface,borderRadius:16,padding:"32px 48px",color:C.text,fontFamily:FONT,fontSize:14}}>Cargando formulario…</div></div>}><PostFormModal session={session} postToEdit={editPost} modoInicial={editPost?undefined:(()=>{try{return sessionStorage.getItem("cl_seccion")||"curso";}catch{return"curso";}})()  } onClose={()=>{setShowForm(false);setEditPost(null);}}
  onSave={(newPub,meta)=>{
    setMyPostsKey(k=>k+1);
    if(newPub)trackPublicacionCreada(newPub.tipo||"desconocido",newPub.materia);
    if(newPub&&(meta?.esCursoNuevo||meta?.esParticularNuevo)){
      // Abrir CursoPage directo en tab validación
      setTimeout(()=>setCursoPost({...newPub,_openValidacion:true}),200);
    }
  }}/>
      </React.Suspense>}
      {showOnboarding&&session&&<React.Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",zIndex:200}}><div style={{background:C.surface,borderRadius:16,padding:"32px 48px",color:C.text,fontFamily:FONT,fontSize:14}}>Cargando…</div></div>}><OnboardingModal session={session} upgradeMode={onboardingUpgrade} onClose={(rol)=>{try{localStorage.setItem("cl_onboarding_done_"+session.user.email,"1");}catch{}sb.updateUsuario(session.user.id,{onboarding_completado:true},session.access_token).catch(()=>{});if(rol)trackOnboardingComplete(rol);setShowOnboarding(false);setOnboardingUpgrade(false);triggerPushBanner();}} onPublicar={()=>{setPage("cuenta");setEditPost(null);setShowForm(true);}}/></React.Suspense>}
      {showAdmin&&<React.Suspense fallback={null}><AdminPage session={session} onClose={()=>setShowAdmin(false)} onChatUser={(u)=>{setShowAdmin(false);openChat({autor_email:u.email,titulo:"Mensaje desde Admin",id:"admin_"+u.id});}}/></React.Suspense>}
      {legalTab&&<LegalModal tab={legalTab} onClose={()=>{setLegalTab(null);window.history.replaceState({},"",window.location.pathname);}}/>}
      <ScrollToTopBtn/>
      {!chatPost&&!detailPost&&!cursoPost&&!showForm&&!notifPanelOpen&&<ChatBotWidget/>}
      <ToastContainer/>
      <UpdateBanner/>
      <CookieBanner/>
      {showPushBanner&&<PushPermissionBanner onAccept={subscribePush} onDismiss={dismissPush}/>}
      <React.Suspense fallback={null}><NotifPanel session={session} open={notifPanelOpen} onClose={()=>setNotifPanelOpen(false)} onOpenDetail={setDetailPost} onOpenCurso={setCursoPost}/></React.Suspense>
    </div>
  );
}
