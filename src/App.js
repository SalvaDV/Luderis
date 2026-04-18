import React, { useState, useEffect, useCallback, useRef } from "react";
import * as sb from "./supabase";
import {
  C, FONT, LUD, _themeKey,
  applyTheme, toast, ToastContainer, logError,
  MATERIAS, CATEGORIAS_DATA, getPubTipo, TIPO_PUB,
  avatarColor, fmt, fmtRel, fmtPrice, calcAvg, calcDuracion,
  MONEDA_SYM, setLang, STRINGS, t,
  maskEmail, safeDisplayName, CONTACT_REGEX, sanitizeContactInfo,
  _avatarCache, useAutorAvatar,
  Spinner, SkeletonCard, SkeletonList,
  Avatar, Tag, StatusBadge, VerifiedBadge, StarRating,
  Input, Btn, SearchableSelect,
  ErrMsg, Label, Modal, Chip, MiniStars, useConfirm,
  CalendarioCurso,
  useMPRetorno,
  useDebounce,
  useIntersectionObserver,
} from "./shared";
import LandingPage from "./LandingPage";
import AuthScreen from "./AuthScreen";
import { PriceSlider } from "./PostFormModal";
import { AcuerdoModal, EspacioClaseModal } from "./MiCuentaPage";
import AgendaPage, { DocentesDestacados } from "./AgendaPage";
import AdminPage from "./AdminPage";
import FavBtn from "./components/FavBtn";
import DocBadge from "./components/DocBadge";
import DenunciaModal from "./components/DenunciaModal";
import PostChatBtn from "./components/PostChatBtn";
import ShareBtn, { useShareToast } from "./components/ShareBtn";
import OfertarBtn from "./components/OfertarBtn";
import PostCard from "./components/PostCard";
import LeaderboardView from "./components/LeaderboardView";
import Sidebar from "./components/Sidebar";
import CertificadoPage from "./components/CertificadoPage";
import ChatModal from "./components/ChatModal";
import ScrollToTopBtn from "./components/ScrollToTopBtn";
import ChatBotWidget from "./components/ChatBotWidget";
import BusquedaIA from "./components/BusquedaIA";
import MiniDropdown from "./components/MiniDropdown";
import FinalizarClaseModal from "./components/FinalizarClaseModal";
import NotifPanel from "./components/NotifPanel";
import MyPostsPage, { MyPostCard, ContraofertaModal, OfertasRecibidasModal } from "./MyPostsPage";
import InscripcionesPage from "./InscripcionesPage";
import ChatsPage from "./ChatsPage";
import FavoritosPage from "./FavoritosPage";

import ExplorePage from "./ExplorePage";

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

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
// Named exports for lazy-loaded modules that need these components
export { FavBtn, OfertarBtn, ShareBtn, DenunciaModal, PostChatBtn,
         MyPostCard, OfertasRecibidasModal, FinalizarClaseModal,
         ContraofertaModal };

export default function App(){
  const [session,setSession]=useState(()=>sb.loadSession());
  // Tema: fuerza re-render global al cambiar
  const [,forceThemeRender]=useState(0);
  // Exponer setter global para que MiCuentaPage lo llame
  window.__setAppTheme=(key)=>{applyTheme(key);forceThemeRender(n=>n+1);};
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [onboardingUpgrade,setOnboardingUpgrade]=useState(false);
  const [showAdmin,setShowAdmin]=useState(false);
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
      document.title=`${pub.titulo} — Luderis`;
      let meta=document.querySelector("meta[name='description']");
      if(!meta){meta=document.createElement("meta");meta.name="description";document.head.appendChild(meta);}
      meta.content=((pub.descripcion||"").slice(0,155))||`Clases de ${pub.materia||"educación"} en Luderis`;
    }
  },[cursoPost,detailPost]);const [perfilEmail,setPerfilEmail]=useState(null);const [certVerifId,setCertVerifId]=useState(null);const [chatsKey,setChatsKey]=useState(0);
  const [page,setPageRaw]=useState(()=>{try{return sessionStorage.getItem("cl_page")||"explore";}catch{return "explore";}});
  const setPage=(p)=>{try{sessionStorage.setItem("cl_page",p);}catch{}setPageRaw(p);};
  const [showForm,setShowForm]=useState(false);const [editPost,setEditPost]=useState(null);const [myPostsKey,setMyPostsKey]=useState(0);
  const [unread,setUnread]=useState(0);const [ofertasCount,setOfertasCount]=useState(0);const [notifCount,setNotifCount]=useState(0);const [notifs,setNotifs]=useState([]);const [showNotifs,setShowNotifs]=useState(false);
  const [juegosBadge,setJuegosBadge]=useState(false);
  const [notifPanelOpen,setNotifPanelOpen]=useState(false);
  // Exponer función global para que el sidebar pueda abrir el panel
  useEffect(()=>{window._openNotifPanel=()=>setNotifPanelOpen(v=>!v);return()=>{window._openNotifPanel=null;};},[]);// eslint-disable-line
  // Tipos de notif que alimentan cada badge
  const TIPOS_CUENTA=["oferta_aceptada","oferta_rechazada","contraoferta","nueva_oferta","nueva_inscripcion","sistema"];
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
    return()=>{window.__openPub=null;};
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
      if(pub){setDetailPost(pub);setPage("inscripciones");}
    }catch{}
  });
  const sessionRef=useRef(session);useEffect(()=>{sessionRef.current=session;},[session]);
  useEffect(()=>{window.__openAdmin=()=>setShowAdmin(true);return()=>{window.__openAdmin=null;};},[]);
  // Siempre inicia como false — se confirma desde DB (no localStorage) para evitar spoofing
  const [esAdmin,setEsAdmin]=useState(false);
  // Rol real del usuario (DB-verified, no localStorage)
  const [rolSesion,setRolSesion]=useState("alumno");

  // Re-sync rol from DB on app load and on window focus
  useEffect(()=>{
    const syncRol=()=>{
      if(!session?.user?.email)return;
      sb.getUsuarioByEmail(session.user.email,session.access_token).then(u=>{
        if(u?.rol){
          try{localStorage.setItem("cl_rol_"+session.user.email,u.rol);}catch{}
          setRolSesion(u.rol);
          setEsAdmin(u.rol==="admin"||session.user.email==="salvadordevedia@gmail.com");
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
      if(abandonadas.length>0&&window.__pushNotif){
        const pub=abandonadas[0];
        window.__pushNotif(
          "¿Seguís aprendiendo? 📚",
          `Hace más de 7 días que no entraste a "${pub.pub_titulo||"tu clase"}". ¡No pierdas el ritmo!`
        );
      }
    }).catch(()=>{});
  },[session]);

  // ── Notificaciones push del browser ────────────────────────────────────────
  const pedirPermisoNotif=useCallback(()=>{
    if(!("Notification" in window))return;
    if(Notification.permission==="default"){
      Notification.requestPermission().then(p=>{
        if(p==="granted"){
          try{localStorage.setItem("cl_notif_ok","1");}catch{}
        }
      });
    }
  },[]);

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

  // Pedir permiso la primera vez que el usuario entra (con delay para no ser intrusivo)
  useEffect(()=>{
    if(!session)return;
    if(!("Notification" in window))return;
    // Si ya está granted no hacer nada, si está denied tampoco
    if(Notification.permission==="granted"){try{localStorage.setItem("cl_notif_ok","1");}catch{}return;}
    if(Notification.permission==="denied")return;
    // Si es la primera vez (default), pedir después de 8 segundos
    const ya=localStorage.getItem("cl_notif_asked_"+session.user.email);
    if(!ya){
      setTimeout(()=>{
        try{localStorage.setItem("cl_notif_asked_"+session.user.email,"1");}catch{}
        pedirPermisoNotif();
      },8000);
    }
  },[session,pedirPermisoNotif]);

  // Exponer globalmente para usarla desde cualquier lado
  useEffect(()=>{
    window.__pushNotif=mostrarNotifPush;
    return()=>{window.__pushNotif=null;};
  },[mostrarNotifPush]);

  useEffect(()=>{
    if(!window.location.hash.includes("access_token"))return;
    sb.getSessionFromUrl().then(async s=>{
      if(!s)return;
      window.location.hash="";
      sb.saveSession(s);
      try{
        await sb.upsertUsuario({
          id:s.user.id,email:s.user.email,
          nombre:s.user.user_metadata?.full_name||s.user.email.split("@")[0],
          avatar_url:s.user.user_metadata?.avatar_url||null,
        },s.access_token);
        const nombre=s.user.user_metadata?.full_name||s.user.email.split("@")[0];
        try{localStorage.setItem("dn_"+s.user.email,nombre);}catch{}
      }catch{}
      setSession(s);
    }).catch(()=>{});
  },[]);// eslint-disable-line

  useEffect(()=>{sb.setSessionRefreshCallback(async()=>{const c=sessionRef.current;if(!c?.refresh_token)return null;try{const s=await sb.refreshSession(c.refresh_token);sb.saveSession(s);setSession(s);return s;}catch{sb.clearSession();setSession(null);return null;}});},[]);

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

  // ── Faros badge: show until user wins today's puzzle ─────────────────────────
  useEffect(() => {
    if (!session?.access_token) { setJuegosBadge(false); return; }
    let mounted = true;
    sb.getTodaysPuzzle(session.access_token)
      .then(p => {
        if (!mounted || !p) return;
        return sb.getTodaysPuzzleResult(session.access_token, p.id);
      })
      .then(result => {
        if (!mounted) return;
        setJuegosBadge(!result);
      })
      .catch(() => { if (mounted) setJuegosBadge(false); });
    return () => { mounted = false; };
  }, [session?.access_token]); // eslint-disable-line

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
        const LABELS={oferta_aceptada:"✅ Oferta aceptada",nueva_inscripcion:"🎓 Nueva inscripción",sistema:"📣 Anuncio de Luderis",nueva_oferta:"📩 Nueva oferta",oferta_rechazada:"❌ Oferta rechazada",contraoferta:"🔄 Contraoferta recibida"};
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
    if(!session?.user?.email||!session?.access_token)return;
    const email=session.user.email;
    const token=session.access_token;
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
    };
    let ws,heartbeat,dead=false,retries=0;
    const MAX_RETRIES=5;
    const connect=()=>{
      if(dead||retries>=MAX_RETRIES)return;
      retries++;
      try{
        ws=new WebSocket(`${sb.SUPABASE_URL.replace("https","wss")}/realtime/v1/websocket?apikey=${sb.SUPABASE_KEY}&vsn=1.0.0`);
        ws.onopen=()=>{
          retries=0;// reset al conectar exitosamente
          // Supabase Realtime v2: channel arbitrario + access_token del usuario para RLS
          ws.send(JSON.stringify({
            topic:"realtime:luderis-notifs",event:"phx_join",
            payload:{
              config:{broadcast:{ack:false,self:false},presence:{key:""},
                postgres_changes:[{event:"INSERT",schema:"public",table:"notificaciones",filter:`alumno_email=eq.${email}`}]
              },
              access_token:token
            },ref:"1"
          }));
          heartbeat=setInterval(()=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({topic:"phoenix",event:"heartbeat",payload:{},ref:"hb"}));},25000);
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
        ws.onclose=()=>{clearInterval(heartbeat);if(!dead&&retries<MAX_RETRIES)setTimeout(connect,Math.min(5000*retries,30000));};
        ws.onerror=()=>{try{ws.close();}catch{}};
      }catch{}
    };
    connect();
    return()=>{dead=true;clearInterval(heartbeat);try{ws?.close();}catch{}};
  },[session?.user?.email,session?.access_token,refreshUnread]);

  useEffect(()=>{
    refreshUnread();
    let t=setInterval(refreshUnread,30000);// fallback — Realtime cubre el tiempo real
    // Share link handler — si viene ?pub=ID en la URL, abrir el popup
    try{
      const params=new URLSearchParams(window.location.search);
      // Abrir perfil de docente si viene ?perfil=email en la URL
      const perfilParam=params.get("perfil");
      if(perfilParam){setPerfilEmail(decodeURIComponent(perfilParam));setPage("explore");}
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
        refreshUnread(); // actualizar inmediatamente al volver
        t=setInterval(refreshUnread,30000);
      }
    };
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{clearInterval(t);document.removeEventListener("visibilitychange",onVisibility);};
  },[refreshUnread]);
  const PAGE_TITLES={explore:"Explorar — Luderis",chats:"Mis chats — Luderis",favoritos:"Favoritos — Luderis",inscripciones:"Mis inscripciones — Luderis",cuenta:"Mi cuenta — Luderis"};
  useEffect(()=>{
    document.title=PAGE_TITLES[page]||"Luderis — Aprendé y enseñá lo que quieras";
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
  if(!session){
    const showAuth=window.location.hash==="#auth"||sessionStorage.getItem("ld_auth")==="1";
    const goAuth=()=>{sessionStorage.setItem("ld_auth","1");window.location.hash="#auth";forceThemeRender(n=>n+1);};
    if(!showAuth)return(<><style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}@keyframes fadeSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}*{box-sizing:border-box;margin:0;padding:0}html,body,#root{min-height:100vh;font-family:${FONT};overflow-x:hidden;max-width:100vw}`}</style><LandingPage onEnter={goAuth}/></>);
    return(<><style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}@keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}html,body,#root{background:#F6F9FF;min-height:100vh;font-family:${FONT};overflow-x:hidden;max-width:100vw}input,textarea,select{color-scheme:light;background-color:#F4F7FF!important;color:#0D1F3C!important}input::placeholder,textarea::placeholder{color:#A0AEC0;opacity:1}`}</style><AuthScreen onLogin={s=>{sessionStorage.removeItem("ld_auth");window.location.hash="";sb.saveSession(s);setSession(s);}}/></>);
  }
  const SW=isMobile?0:224;
  return(
    <div style={{minHeight:"100vh",background:`var(--cl-section-tint, ${C.bg})`,fontFamily:FONT,color:C.text,display:"flex",transition:"background .4s ease",overflowX:"hidden",maxWidth:"100vw"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes tabPulse{0%,100%{opacity:1}50%{opacity:0.5}}@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}*{box-sizing:border-box}html,body,#root{background:${C.bg};color:${C.text};min-height:100vh;font-family:${FONT};overflow-x:hidden;max-width:100vw}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}::-webkit-scrollbar-track{background:transparent}.cl-card-anim{animation:fadeUp .2s ease both}.cl-fade{animation:fadeIn .15s ease both}.sk{background:linear-gradient(90deg,var(--cl-sk-a,#E2E8F0) 25%,var(--cl-sk-b,#F7FAFC) 50%,var(--cl-sk-a,#E2E8F0) 75%);background-size:400px;animation:shimmer 1.4s infinite linear;border-radius:6px}.cl-card-anim:nth-child(1){animation-delay:0ms}.cl-card-anim:nth-child(2){animation-delay:40ms}.cl-card-anim:nth-child(3){animation-delay:80ms}.cl-card-anim:nth-child(4){animation-delay:120ms}.cl-card-anim:nth-child(5){animation-delay:160ms}.cl-card-anim:nth-child(6){animation-delay:200ms}input,textarea,select{color-scheme:${_themeKey()==="light"?"light":"dark"};background-color:${C.surface}!important;color:${C.text}!important;border-color:${C.border}}input::placeholder,textarea::placeholder{color:${C.muted};opacity:1}input:focus,textarea:focus,select:focus{border-color:${C.accent}!important;outline:none}@media(max-width:768px){input,textarea,select{font-size:16px!important}.cl-hide-desk{display:none!important}button{-webkit-tap-highlight-color:transparent}}.cl-tabs-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.cl-tabs-scroll::-webkit-scrollbar{display:none}.cl-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:600px){.cl-grid-2{grid-template-columns:1fr!important}}.cl-row-wrap{display:flex;flex-wrap:wrap;gap:8px}.curso-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.curso-actions::-webkit-scrollbar{display:none}@media(max-width:600px){.curso-actions{overflow-x:auto!important;flex-wrap:nowrap!important;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px;gap:6px!important}.curso-actions button,.curso-actions a{white-space:nowrap;font-size:11px!important;padding:5px 9px!important;min-height:0!important}.curso-actions span{white-space:nowrap;font-size:11px!important}.curso-pad{padding:12px 14px!important}.curso-card{padding:13px 15px!important;border-radius:12px!important}.curso-main-header{padding:8px 12px!important}}`}</style>
      <Sidebar page={page} setPage={setPage} session={session} onLogout={logout} onNewPost={()=>{setEditPost(null);setShowForm(true);}} unreadCount={unread} ofertasCount={ofertasCount} notifCount={notifCount} ofertasAceptadasNuevas={ofertasAceptadasNuevas} mobile={isMobile} open={sidebarOpen} onClose={()=>setSidebarOpen(false)} theme={currentTheme} onToggleTheme={toggleTheme} onForceRender={()=>forceThemeRender(n=>n+1)} esAdmin={esAdmin} juegosBadge={juegosBadge}/>
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
              <button onClick={()=>setNotifPanelOpen(v=>!v)} style={{position:"relative",background:"none",border:"none",cursor:"pointer",padding:"6px",borderRadius:"50%",lineHeight:1,color:notifCount>0?C.accent:C.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {notifCount>0&&<span style={{position:"absolute",top:2,right:2,background:C.danger,color:"#fff",borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 4px",lineHeight:1.4,minWidth:14,textAlign:"center"}}>{notifCount>9?"9+":notifCount}</span>}
              </button>
              <Btn onClick={()=>{setEditPost(null);setShowForm(true);}} style={{padding:"6px 14px",fontSize:12,borderRadius:16}}>{t("newPost")}</Btn>
            </div>
          </div>
          {/* Bottom navbar mobile — SVG icons + pill active state */}
          <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,zIndex:50}}>
            <div style={{display:"flex",height:60,width:"100%"}}>
              {[
                {id:"explore",svg:`<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>`,label:t("explore"),badge:0},
                {id:"chats",svg:`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,label:t("chats"),badge:unread},
                {id:"juegos",svg:`<circle cx="10" cy="10" r="7"/><path d="M10 7v6M7 10h6"/>`,label:"Juegos",badge:juegosBadge?1:0,badgeDot:true},
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
          {page==="explore"&&<ExplorePage session={session} onOpenChat={openChat} onOpenDetail={setDetailPost} onOpenPerfil={setPerfilEmail} onOpenCurso={setCursoPost}/>}
          {page==="agenda"&&<AgendaPage session={session} onOpenCurso={setCursoPost}/>}
          {page==="chats"&&<ChatsPage key={chatsKey} session={session} onOpenChat={openChat}/>}
          {page==="favoritos"&&<FavoritosPage session={session} onOpenDetail={setDetailPost} onOpenChat={openChat} onOpenPerfil={setPerfilEmail}/>}
          {page==="inscripciones"&&<InscripcionesPage session={session} onOpenCurso={setCursoPost} onOpenChat={openChat} onMarkNotifsRead={()=>{sb.marcarNotifsTipoLeidas(session.user.email,["valorar_curso","nuevo_ayudante","busqueda_acordada","nuevo_contenido"],session.access_token).then(refreshUnread).catch(()=>{});}}/>}
          {page==="juegos"&&(
            <React.Suspense fallback={
              <div style={{padding:"48px",textAlign:"center",color:C.muted,fontFamily:FONT}}>
                Cargando…
              </div>
            }>
              <FarosPage
                session={session}
                onBack={()=>setPage("explore")}
                onWin={()=>setJuegosBadge(false)}
              />
            </React.Suspense>
          )}
          {page==="cuenta"&&<React.Suspense fallback={<div style={{padding:"48px",textAlign:"center",color:C.muted,fontFamily:FONT}}>Cargando…</div>}><MiCuentaPage key={myPostsKey} session={session} onOpenDetail={setDetailPost} onOpenCurso={setCursoPost} onEdit={p=>{setEditPost(p);setShowForm(true);}} onNew={()=>{setEditPost(null);setShowForm(true);}} onOpenChat={openChat} onRefreshOfertas={refreshUnread} onStartOnboarding={()=>{setOnboardingUpgrade(true);setShowOnboarding(true);}} onClearBadge={()=>{
            setOfertasAceptadasNuevas(0);
            setOfertasCount(0);
            sb.marcarNotifsTipoLeidas(session.user.email,["oferta_aceptada","oferta_rechazada","contraoferta","nueva_oferta","nueva_inscripcion"],session.access_token).then(refreshUnread).catch(()=>{});
          }}/>
          </React.Suspense>}
        </div>
      </main>
      {chatPost&&<ChatModal post={chatPost} session={session} onClose={closeChat} onUnreadChange={refreshUnread}/>}
      {detailPost&&<React.Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",zIndex:200}}><div style={{background:C.surface,borderRadius:16,padding:"32px 48px",color:C.text,fontFamily:FONT,fontSize:14}}>Cargando publicación…</div></div>}><DetailModal post={detailPost} session={session} onClose={()=>setDetailPost(null)} onChat={p=>{setDetailPost(null);openChat(p);}} onOpenCurso={p=>{setDetailPost(null);setCursoPost(p);}} onOpenPerfil={setPerfilEmail} onOpenDetail2={p=>{setDetailPost(null);setTimeout(()=>setDetailPost(p),80);}}/></React.Suspense>}
      {cursoPost&&<React.Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",zIndex:200}}><div style={{background:C.surface,borderRadius:16,padding:"32px 48px",color:C.text,fontFamily:FONT,fontSize:14}}>Cargando curso…</div></div>}><CursoPage post={cursoPost} session={session} onClose={()=>setCursoPost(null)} onUpdatePost={p=>setCursoPost(p)}/></React.Suspense>}
      {certVerifId&&<CertificadoPage certId={certVerifId} onClose={()=>setCertVerifId(null)}/>}
      {perfilEmail&&<React.Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",zIndex:200}}><div style={{background:C.surface,borderRadius:16,padding:"32px 48px",color:C.text,fontFamily:FONT,fontSize:14}}>Cargando perfil…</div></div>}><PerfilPage autorEmail={perfilEmail} session={session} onClose={()=>setPerfilEmail(null)} onOpenDetail={(p)=>{setPerfilEmail(null);setTimeout(()=>setDetailPost(p),80);}} onOpenChat={(p)=>{setPerfilEmail(null);setTimeout(()=>openChat(p),80);}}/></React.Suspense>}
      {showForm&&<React.Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",zIndex:200}}><div style={{background:C.surface,borderRadius:16,padding:"32px 48px",color:C.text,fontFamily:FONT,fontSize:14}}>Cargando formulario…</div></div>}><PostFormModal session={session} postToEdit={editPost} modoInicial={editPost?undefined:(()=>{try{return sessionStorage.getItem("cl_seccion")||"curso";}catch{return"curso";}})()  } onClose={()=>{setShowForm(false);setEditPost(null);}}
  onSave={(newPub,meta)=>{
    setMyPostsKey(k=>k+1);
    if(newPub&&(meta?.esCursoNuevo||meta?.esParticularNuevo)){
      // Abrir CursoPage directo en tab validación
      setTimeout(()=>setCursoPost({...newPub,_openValidacion:true}),200);
    }
  }}/>
      </React.Suspense>}
      {showOnboarding&&session&&<React.Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",zIndex:200}}><div style={{background:C.surface,borderRadius:16,padding:"32px 48px",color:C.text,fontFamily:FONT,fontSize:14}}>Cargando…</div></div>}><OnboardingModal session={session} upgradeMode={onboardingUpgrade} onClose={()=>{try{localStorage.setItem("cl_onboarding_done_"+session.user.email,"1");}catch{}sb.updateUsuario(session.user.id,{onboarding_completado:true},session.access_token).catch(()=>{});setShowOnboarding(false);setOnboardingUpgrade(false);}} onPublicar={()=>{setPage("cuenta");setEditPost(null);setShowForm(true);}}/></React.Suspense>}
      {showAdmin&&<AdminPage session={session} onClose={()=>setShowAdmin(false)} onChatUser={(u)=>{setShowAdmin(false);openChat({autor_email:u.email,titulo:"Mensaje desde Admin",id:"admin_"+u.id});}}/>}
      <ScrollToTopBtn/>
      {!chatPost&&!detailPost&&!cursoPost&&!showForm&&!notifPanelOpen&&<ChatBotWidget/>}
      <ToastContainer/>
      <NotifPanel session={session} open={notifPanelOpen} onClose={()=>setNotifPanelOpen(false)} onOpenDetail={setDetailPost} onOpenCurso={setCursoPost}/>
    </div>
  );
}
