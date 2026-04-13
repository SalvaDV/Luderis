import React, { useState, useEffect, useCallback, useRef } from "react";
import * as sb from "./supabase";
import {
  C, FONT, LUD, _themeKey,
  applyTheme, toast, ToastContainer,
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

function BusquedaIA({onBuscar,iaLoading,onClose}){
  const [q,setQ]=React.useState("");
  const submit=()=>{if(q.trim()){onBuscar(q.trim());onClose();}};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"8px",fontFamily:FONT}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,width:"min(480px,calc(100vw - 24px))",boxShadow:"0 8px 40px rgba(0,0,0,.2)",overflow:"hidden"}}>
        <div style={{padding:"20px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:15,fontWeight:700,color:C.text}}>✨ Buscar con IA</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>×</button>
        </div>
        <div style={{padding:"12px 20px 20px"}}>
          <p style={{fontSize:12,color:C.muted,margin:"0 0 12px"}}>Describí lo que querés aprender o encontrar. La IA va a buscar los cursos más relevantes.</p>
          <textarea value={q} onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}}
            placeholder="Ej: clases de guitarra para principiantes…"
            autoFocus rows={3}
            style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 13px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,resize:"none",boxSizing:"border-box",marginBottom:10}}/>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button onClick={onClose} style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${C.border}`,background:"none",color:C.muted,fontSize:13,cursor:"pointer",fontFamily:FONT}}>Cancelar</button>
            <button onClick={submit} disabled={!q.trim()||iaLoading}
              style={{padding:"8px 18px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#7B3FBE,#1A6ED8)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT,opacity:(!q.trim()||iaLoading)?.5:1}}>
              {iaLoading?"Buscando…":"Buscar →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExplorePage({session,onOpenChat,onOpenDetail,onOpenPerfil,onOpenCurso}){
  const [posts,setPosts]=useState([]);const [loading,setLoading]=useState(true);
  const [busqueda,setBusqueda]=useState(""); const [panelOpen,setPanelOpen]=useState(false);
  const [filtroTipo,setFiltroTipo]=useState("all"); const [filtroModo,setFiltroModo]=useState("all");
  const [filtroModalidad,setFiltroModalidad]=useState("all");
  const [filtroSinc,setFiltroSinc]=useState("all"); const [filtroMateria,setFiltroMateria]=useState("");
  const [filtroDurMin,setFiltroDurMin]=useState(0); const [maxDurSemanas,setMaxDurSemanas]=useState(0);
  const [filtroFechaDesde,setFiltroFechaDesde]=useState(""); const [filtroFechaHasta,setFiltroFechaHasta]=useState("");
  const [precioMin,setPrecioMin]=useState(0); const [precioMax,setPrecioMax]=useState(0);
  const [sliderMin,setSliderMin]=useState(0); const [sliderMax,setSliderMax]=useState(0);
  const [reseñasMap,setReseñasMap]=useState({}); const [reseñasUserMap,setReseñasUserMap]=useState({});
  const [categorias,setCategorias]=useState([]);
  const [favsMap,setFavsMap]=useState({});
  const [rechazadasIds,setRechazadasIds]=useState(new Set());
  const [seenRechazadas,setSeenRechazadas]=useState(()=>{try{return new Set(JSON.parse(localStorage.getItem("cl_seen_rechazadas")||"[]"));}catch{return new Set();}});
  const [pendientesIds,setPendientesIds]=useState(new Set());
  const [mostrarRechazadas,setMostrarRechazadas]=useState(false);
  const [filtroUbicacion,setFiltroUbicacion]=useState("");
  const [filtroMoneda,setFiltroMoneda]=useState("");
  const [userCity,setUserCity]=useState(()=>{try{return localStorage.getItem("cl_user_city")||"";}catch{return "";}});
  const [geoLoading,setGeoLoading]=useState(false);
  const [showBusquedaIA,setShowBusquedaIA]=useState(false);
  const [iaQuery,setIaQuery]=useState("");// texto de la última búsqueda IA
  const [iaResults,setIaResults]=useState(null);// null=sin búsqueda, [ids]=resultados IA
  const [iaExplanation,setIaExplanation]=useState("");
  const [iaLoading,setIaLoading]=useState(false);
  const [ordenamiento,setOrdenamiento]=useState("relevancia");
  const [seccion,setSeccion]=useState(()=>{try{const s=sessionStorage.getItem("cl_seccion_explore");if(s)return s;}catch{}return "cursos";});// "cursos" | "clases" | "pedidos"

  // Palabras clave de cercanía para el prompt IA
  const PALABRAS_CERCA=["cerca","cercanía","mi zona","mi barrio","mi ciudad","presencial cerca","local"];
  const CIUDADES_ARG=["buenos aires","caba","palermo","belgrano","caballito","córdoba","rosario","mendoza","tucumán","salta","mar del plata","bahía blanca","san isidro","tigre","quilmes","lomas","avellaneda","lanús","morón","merlo"];

  // Función que lanza búsqueda IA y popula iaResults
  const buscarConIA=useCallback(async(q)=>{
    if(!q.trim()||iaLoading)return;
    setIaLoading(true);setIaResults(null);setIaExplanation("");setIaQuery(q);
    setModoVista("resultados");
    // Guardar en historial local
    try{
      const prev=JSON.parse(localStorage.getItem("cl_busq_recientes")||"[]");
      const updated=[q,...prev.filter(s=>s!==q)].slice(0,8);
      localStorage.setItem("cl_busq_recientes",JSON.stringify(updated));
    }catch{}

    // Detectar si el query menciona ubicación
    const qLow=q.toLowerCase();
    const mencionaUbic=PALABRAS_CERCA.some(p=>qLow.includes(p))||CIUDADES_ARG.some(c=>qLow.includes(c));
    const cityCtx=(mencionaUbic||userCity)?`\nCiudad del usuario: ${userCity||"desconocida"}. ${mencionaUbic?"El usuario menciona ubicación: priorizá publicaciones presenciales en o cerca de "+userCity+".":"Si busca presencial, considerá la ciudad del usuario."}`:"";

    try{
      const qNorm=(s)=>(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      const qTokens=qLow.split(/\s+/).filter(w=>w.length>2);
      const preFiltered=posts.filter(p=>{
        const txt=qNorm((p.titulo||"")+" "+(p.descripcion||"")+" "+(p.materia||""));
        return qTokens.length===0||qTokens.some(w=>txt.includes(qNorm(w)));
      });
      const postsCtx=(preFiltered.length>0?preFiltered:posts).slice(0,60).map(p=>({id:p.id,titulo:p.titulo,materia:p.materia,descripcion:(p.descripcion||"").slice(0,80),tipo:p.tipo,precio:p.precio,modalidad:p.modalidad,ubicacion:p.ubicacion||""}));
      const raw=await sb.callIA(
        `Sos un asistente de búsqueda para Luderis, plataforma educativa argentina.${cityCtx}\nEl usuario describe lo que busca. Devolvé las publicaciones más relevantes.\nSOLO respondé con JSON válido: {"ids":["id1","id2"],"explanation":"frase breve en español","mencionaUbicacion":true/false}\nMáximo 20 IDs ordenados por relevancia. Sin resultados: {"ids":[],"explanation":"No encontré clases que coincidan.","mencionaUbicacion":false}`,
        `Busco: "${q}"\n\nPublicaciones disponibles:\n${JSON.stringify(postsCtx)}\n\nRespondé SOLO JSON.`,
        800,session?.access_token
      );
      const match=raw.match(/\{[\s\S]*\}/);
      if(!match)throw new Error("bad json");
      const parsed=JSON.parse(match[0]);
      setIaResults(parsed.ids||[]);
      setIaExplanation(parsed.explanation||"");
    }catch{
      // Fallback local
      const words=qLow.split(/\s+/).filter(w=>w.length>2);
      const scored=posts.map(p=>{
        const txt=((p.titulo||"")+" "+(p.descripcion||"")+" "+(p.materia||"")+" "+(p.ubicacion||"")).toLowerCase();
        let sc=words.reduce((a,w)=>a+(txt.includes(w)?1:0),0);
        if(userCity&&p.modalidad==="presencial"&&(p.ubicacion||"").toLowerCase().includes(userCity.toLowerCase()))sc+=2;
        return{p,sc};
      }).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc).slice(0,20);
      setIaResults(scored.map(x=>x.p.id));
      setIaExplanation(scored.length>0?"Resultado local (IA no disponible)":"Sin resultados.");
    }finally{setIaLoading(false);}
  },[posts,userCity,session,iaLoading]);// eslint-disable-line

  // Función simple de distancia aproximada por texto (sin coordenadas)
  // Si ambas ciudades son iguales → 0. Si una está en el campo ubicacion → baja distancia.
  // Publicaciones sin ubicación → distancia media. Presenciales de otra provincia → alta.
  const distanciaScore=(p)=>{
    if(p.modalidad==="virtual")return 999;// virtuales van al final en orden cercania
    if(!userCity)return 500;
    const ub=(p.ubicacion||"").toLowerCase();
    const city=userCity.toLowerCase();
    if(ub.includes(city))return 0;
    // Ciudades del AMBA cerca de CABA
    const amba=["amba","gran buenos aires","buenos aires","gba","conurbano","palermo","belgrano","san isidro","tigre","quilmes","lomas","avellaneda","lanús","morón"];
    if(amba.some(a=>city.includes(a)||ub.includes(a)))return 100;
    if(!ub)return 300;// sin ubicación
    return 600;// otra zona
  };


  // Detectar ciudad del usuario via geolocalización (una sola vez)
  const detectarUbicacion=useCallback(()=>{
    if(!navigator.geolocation)return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async(pos)=>{
        try{
          // Reverse geocoding con API pública (no requiere key)
          const res=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=es`);
          const data=await res.json();
          const city=data.address?.city||data.address?.town||data.address?.village||data.address?.suburb||"";
          if(city){setUserCity(city);try{localStorage.setItem("cl_user_city",city);}catch{}}
        }catch{}finally{setGeoLoading(false);}
      },
      ()=>setGeoLoading(false),
      {timeout:8000,maximumAge:3600000}
    );
  },[]);

  useEffect(()=>{
    // Auto-detectar si no tenemos ciudad guardada
    if(!userCity)detectarUbicacion();
  },[]);// eslint-disable-line
  const [modoVista,setModoVista]=useState("home");// "home" | "resultados"
  const PAGE_SIZE=20;
  const [pagina,setPagina]=useState(1);
  const sentinelRef=useRef(null);
  const isSentinelVisible=useIntersectionObserver(sentinelRef,{threshold:0.1});
  const busquedaDebounced=useDebounce(busqueda,280);
  const searchInputRef=useRef(null);

  const cargar=useCallback(async()=>{
    setLoading(true);
    try{
      const [d,misOfertas,favs,cats]=await Promise.all([
        sb.getPublicaciones({},session.access_token),
        sb.getMisOfertas(session.user.email,session.access_token).catch(()=>[]),
        sb.getFavoritos(session.user.email,session.access_token).catch(()=>[]),
        sb.getCategorias(session.access_token).catch(()=>[]),
      ]);
      const activos=d.filter(p=>{
        if(p.activo===false||p.finalizado)return false;
        // Búsquedas expiradas no se muestran
        if(p.tipo==='busqueda'&&p.expires_at&&new Date(p.expires_at)<new Date())return false;
        return true;
      });
      setPosts(activos);
      setCategorias(cats||[]);
      const fm={};(favs||[]).forEach(f=>{fm[f.publicacion_id]=f.id;});
      setFavsMap(fm);
      const rechSet=new Set();const pendSet=new Set();
      (misOfertas||[]).forEach(o=>{
        if(o.estado==="rechazada")rechSet.add(o.busqueda_id);
        if(o.estado==="pendiente")pendSet.add(o.busqueda_id);
      });
      setRechazadasIds(rechSet);setPendientesIds(pendSet);
      // ya no hace nada aquí — la visibilidad del banner se deriva del estado
      const precios=activos.filter(p=>p.precio>0).map(p=>+p.precio);
      if(precios.length){const mn=Math.floor(Math.min(...precios)/100)*100;const mx=Math.ceil(Math.max(...precios)/100)*100;setPrecioMin(mn);setPrecioMax(mx);setSliderMin(mn);setSliderMax(mx);}
      const durs=activos.filter(p=>p.fecha_inicio&&p.fecha_fin).map(p=>Math.ceil((new Date(p.fecha_fin)-new Date(p.fecha_inicio))/604800000));
      if(durs.length)setMaxDurSemanas(Math.max(...durs)+1);
      const hayDesnorm=activos.some(p=>p.calificacion_promedio!==undefined&&p.calificacion_promedio!==null);
      if(hayDesnorm){
        const pMap={};const uMap={};
        activos.forEach(p=>{
          const avg=parseFloat(p.calificacion_promedio)||0;const cnt=parseInt(p.cantidad_reseñas)||0;
          pMap[p.id]={avg:avg||null,count:cnt};
          if(!uMap[p.autor_email])uMap[p.autor_email]={sum:0,count:0};
          if(avg>0&&cnt>0){uMap[p.autor_email].sum+=avg*cnt;uMap[p.autor_email].count+=cnt;}
        });
        setReseñasMap(pMap);
        const fU={};Object.keys(uMap).forEach(e=>{if(uMap[e].count>0)fU[e]=uMap[e].sum/uMap[e].count;});
        setReseñasUserMap(fU);
      } else {
        // Consultar todas las publicaciones, no solo 20
        const rData=await Promise.allSettled(activos.map(p=>sb.getReseñas(p.id,session.access_token)));
        const pMap={};const uMap={};
        activos.forEach((p,i)=>{
          const r=rData[i].status==="fulfilled"?rData[i].value:[];
          const avg=r.length?r.reduce((a,rv)=>a+(rv.estrellas||0),0)/r.length:null;
          pMap[p.id]={avg,count:r.length};
          if(!uMap[p.autor_email])uMap[p.autor_email]={sum:0,count:0};
          r.forEach(rv=>{uMap[p.autor_email].sum+=(rv.estrellas||0);uMap[p.autor_email].count++;});
        });
        setReseñasMap(pMap);
        const fU={};Object.keys(uMap).forEach(e=>{if(uMap[e].count>0)fU[e]=uMap[e].sum/uMap[e].count;});
        setReseñasUserMap(fU);
      }
    }catch(e){console.error(e);}finally{setLoading(false);}
  },[session]);// eslint-disable-line
  useEffect(()=>{cargar();},[cargar]);

  // Solo cambia a resultados por filtros (no por búsqueda escrita — eso requiere Enter)
  useEffect(()=>{
    if(filtroTipo!=="all"||filtroModo!=="all"||filtroModalidad!=="all"||filtroMateria||filtroUbicacion){
      setModoVista("resultados");
    }
  },[filtroTipo,filtroModo,filtroModalidad,filtroMateria,filtroUbicacion]);

  const goHome=()=>{
    setModoVista("home");
    setBusqueda("");
    setFiltroTipo("all");setFiltroModo("all");setFiltroModalidad("all");
    setFiltroMateria("");setFiltroUbicacion("");
  };

  const norm=(s)=>(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const filtered=posts.filter(p=>{
    const q=norm(busquedaDebounced.trim());
    if(q&&!norm(p.titulo).includes(q)&&!norm(p.descripcion).includes(q)&&!norm(p.materia).includes(q)&&!norm(safeDisplayName(p.autor_nombre,p.autor_email)).includes(q))return false;
    if(filtroTipo!=="all"&&p.tipo!==filtroTipo)return false;
    if(filtroModo!=="all"&&p.modo!==filtroModo)return false;
    if(filtroModalidad!=="all"&&p.modalidad!==filtroModalidad)return false;
    if(filtroSinc!=="all"&&p.sinc!==filtroSinc)return false;
    if(filtroMateria&&norm(p.materia)!==norm(filtroMateria))return false;
    if(filtroMoneda&&p.moneda&&p.moneda!==filtroMoneda)return false;
    if(filtroUbicacion){
      const ubQ=filtroUbicacion.toLowerCase().trim();
      // Coincidencia parcial: incluye alguna palabra del filtro
      const words=ubQ.split(/\s+/).filter(w=>w.length>2);
      const ubMatch=(p.ubicacion||"").toLowerCase();
      const matches=words.length>0?words.some(w=>ubMatch.includes(w)):ubMatch.includes(ubQ);
      if(!matches)return false;
    }
    if(precioMax>0&&sliderMin>precioMin&&p.precio&&+p.precio<sliderMin)return false;
    if(precioMax>0&&sliderMax<precioMax&&p.precio&&+p.precio>sliderMax)return false;
    if(filtroFechaDesde&&p.fecha_inicio&&p.fecha_inicio<filtroFechaDesde)return false;
    if(filtroFechaHasta&&p.fecha_inicio&&p.fecha_inicio>filtroFechaHasta)return false;
    if(filtroDurMin>0&&p.fecha_inicio&&p.fecha_fin){const sem=Math.ceil((new Date(p.fecha_fin)-new Date(p.fecha_inicio))/604800000);if(sem<filtroDurMin)return false;}
    if(p.tipo==="busqueda"&&p.autor_email!==session.user.email&&rechazadasIds.has(p.id)&&!mostrarRechazadas)return false;
    return true;
  });

  const activeFilters=[
    filtroTipo!=="all"&&(filtroTipo==="oferta"?"Clases":"Búsquedas"),
    filtroModo!=="all"&&(filtroModo==="curso"?"Cursos":"Particulares"),
    filtroModalidad!=="all"&&(filtroModalidad==="presencial"?"Presencial":filtroModalidad==="virtual"?"Virtual":"Mixto"),
    filtroSinc!=="all"&&(filtroSinc==="sinc"?"Sincrónico":"Asincrónico"),
    filtroMateria&&filtroMateria,
    (sliderMin>precioMin||sliderMax<precioMax)&&"Precio",
    filtroFechaDesde&&`Desde ${fmt(filtroFechaDesde)}`,
    filtroFechaHasta&&`Hasta ${fmt(filtroFechaHasta)}`,
    filtroDurMin>0&&`Duración`,
    filtroUbicacion&&`📍 ${filtroUbicacion}`,
    filtroMoneda&&`💱 ${filtroMoneda}`,
  ].filter(Boolean);
  const hasFilters=activeFilters.length>0||busqueda;

  // Lista filtrada por IA (si hay) o todos los posts
  // Alumnos solo ven ofertas (clases/cursos), docentes ven todo
  const rolUsuario=localStorage.getItem("cl_rol_"+session.user.email)||"alumno";
  const esDocente=rolUsuario==="docente"||rolUsuario==="ambos";
  const postsPorRol=rolUsuario==="alumno"?posts.filter(p=>p.tipo==="oferta"||p.autor_email===session.user.email):posts;
  const todosPedidos=posts.filter(p=>p.tipo==="busqueda"&&p.autor_email!==session.user.email);
  // Filtro por sección (cursos vs clases)
  const visiblePosts=postsPorRol.filter(p=>{
    if(seccion==="pedidos") return p.tipo==="busqueda"&&p.autor_email!==session.user.email;
    if(p.tipo==="busqueda"){
      if(p.autor_email===session.user.email)return true;
      return false;// en sección cursos/clases, las busquedas ajenas se muestran aparte
    }
    if(seccion==="cursos")return p.modo==="curso"||p.modo==="grupal";
    if(seccion==="clases")return p.modo==="particular"||!p.modo;
    return true;
  });
  const filteredConRol=iaResults!==null
    ?visiblePosts.filter(p=>iaResults.includes(p.id)).sort((a,b)=>iaResults.indexOf(a.id)-iaResults.indexOf(b.id))
    :visiblePosts.filter(p=>(filtroTipo==="all"||p.tipo===filtroTipo)&&(filtroModo==="all"||p.modo===filtroModo||(filtroModo==="curso"&&p.modo==="grupal"))&&(!filtroMateria||norm(p.materia)===norm(filtroMateria))&&(filtroModalidad==="all"||p.modalidad===filtroModalidad)&&(filtroSinc==="all"||p.sinc===filtroSinc)&&(sliderMin===precioMin||!p.precio||(+p.precio)>=sliderMin)&&(sliderMax===precioMax||!p.precio||(+p.precio)<=sliderMax));
  const baseList=filteredConRol;

  // Aplicar ordenamiento — cómputo directo sin useMemo (posts <500, no necesita memo)
  const _sortBase=[...baseList];
  const sorted=(()=>{
    switch(ordenamiento){
      case"recientes":return _sortBase.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
      case"rating":return _sortBase.sort((a,b)=>(reseñasMap[b.id]?.avg||0)-(reseñasMap[a.id]?.avg||0));
      case"precio_asc":return _sortBase.sort((a,b)=>(+a.precio||999999)-(+b.precio||999999));
      case"precio_desc":return _sortBase.sort((a,b)=>(+b.precio||0)-(+a.precio||0));
      case"vistas":return _sortBase.sort((a,b)=>(b.vistas||0)-(a.vistas||0));
      case"cercania":return _sortBase.sort((a,b)=>distanciaScore(a)-distanciaScore(b));
      default:
        if(iaResults!==null)return _sortBase;
        return _sortBase.sort((a,b)=>{
          const rA=reseñasMap[a.id]?.avg||0;const rB=reseñasMap[b.id]?.avg||0;
          const tA=new Date(a.created_at||0).getTime();const tB=new Date(b.created_at||0).getTime();
          return(rB*2+tB/1e11)-(rA*2+tA/1e11);
        });
    }
  })();


  useEffect(()=>{setPagina(1);},[busquedaDebounced,filtroTipo,filtroModo,filtroModalidad,filtroSinc,filtroMateria,sliderMin,sliderMax,filtroFechaDesde,filtroFechaHasta,filtroDurMin,iaResults]);// eslint-disable-line
  useEffect(()=>{if(isSentinelVisible&&!loading)setPagina(p=>p+1);},[isSentinelVisible]);// eslint-disable-line
  // Propagate section accent to CSS custom properties so the entire app page reflects it
  const sT=seccion==="clases"?TIPO_PUB.particular:seccion==="pedidos"?TIPO_PUB.pedido:TIPO_PUB.curso;
  useEffect(()=>{
    document.documentElement.style.setProperty('--cl-section-accent', sT.accent);
    document.documentElement.style.setProperty('--cl-section-tint', sT.accent+'13');
    document.documentElement.style.setProperty('--cl-section-grad', sT.grad);
  },[sT.accent,sT.grad]);
  const clearAll=()=>{setFiltroTipo("all");setFiltroModo("all");setFiltroModalidad("all");setFiltroSinc("all");setFiltroMateria("");setSliderMin(precioMin);setSliderMax(precioMax);setFiltroFechaDesde("");setFiltroFechaHasta("");setFiltroDurMin(0);setBusqueda("");setFiltroUbicacion("");setFiltroMoneda("");};
  const selS={width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 10px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT,cursor:"pointer",boxSizing:"border-box",colorScheme:localStorage.getItem("cl_theme")||"light"};
  const FL=({ch})=><div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:7,letterSpacing:.2}}>{ch}</div>;
  const FC=({label,active,onClick})=>(<button onClick={onClick} style={{padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:active?600:400,cursor:"pointer",fontFamily:FONT,background:active?sT.accent:"transparent",color:active?"#fff":C.muted,border:`1px solid ${active?sT.accent:C.border}`,marginBottom:5,marginRight:5,transition:"all .12s"}}>{label}</button>);

  // Barra de búsqueda — click abre el modal IA (es el buscador principal)
  const searchBarJSX=(
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      {/* El input actúa como trigger del modal IA */}
      <button onClick={()=>setShowBusquedaIA(true)}
        style={{flex:1,minWidth:200,display:"flex",alignItems:"center",gap:10,background:C.surface,border:`2px solid ${iaQuery?C.accent:C.border}`,borderRadius:10,padding:"12px 16px",cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"border-color .2s",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
        onMouseLeave={e=>e.currentTarget.style.borderColor=iaQuery?C.accent:C.border}>
        <span style={{fontSize:16,flexShrink:0,background:"linear-gradient(135deg,#7B3FBE,#1A6ED8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700}}>✦</span>
        <span style={{color:iaQuery?C.text:C.muted,fontSize:14,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {iaQuery?iaQuery:"Describí lo que querés aprender…"}
        </span>
        {iaQuery&&<span onClick={e=>{e.stopPropagation();setIaQuery("");setIaResults(null);setIaExplanation("");}} style={{color:C.muted,fontSize:16,lineHeight:1,flexShrink:0,cursor:"pointer"}}>×</span>}
      </button>
      <button onClick={()=>setPanelOpen(v=>!v)}
        style={{display:"flex",alignItems:"center",gap:6,background:hasFilters?C.accentDim:C.bg,border:`1px solid ${hasFilters?C.accent:C.border}`,borderRadius:10,color:hasFilters?C.accent:C.muted,padding:"12px 16px",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>
        ≡ Filtros{activeFilters.length>0&&<span style={{background:C.accent,color:"#fff",borderRadius:"50%",width:18,height:18,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,marginLeft:2}}>{activeFilters.length}</span>}
      </button>
    </div>
  );

  const [viewMode,setViewMode]=useState("cards");// "cards" | "lista"
  // Categorías visuales para el home — combina datos de DB con CATEGORIAS_DATA
  const cats=(categorias.length>0
    ?categorias.map(c=>({label:c.nombre,slug:c.slug,count:posts.filter(p=>p.materia===c.nombre).length}))
    :MATERIAS.map(m=>({label:m,count:posts.filter(p=>p.materia===m).length}))
  ).filter(c=>c.count>0||categorias.length===0).slice(0,19);

  // Publicaciones destacadas para el home (las más recientes con mejor rating)
  const destacadas=posts.filter(p=>p.tipo==="oferta").slice(0,6);
  const recientes=posts.slice(0,8);
  const cursos=posts.filter(p=>p.tipo==="oferta"&&(p.modo==="curso"||p.modo==="grupal")).slice(0,6);
  const particulares=posts.filter(p=>p.tipo==="oferta"&&p.modo==="particular").slice(0,6);
  // Búsquedas de alumnos visibles al docente en cada sección
  const busquedasCursos=posts.filter(p=>p.tipo==="busqueda"&&p.autor_email!==session.user.email&&(p.modo==="curso"||p.modo==="grupal"||!p.modo)).slice(0,8);
  const busquedasClases=posts.filter(p=>p.tipo==="busqueda"&&p.autor_email!==session.user.email&&(p.modo==="particular"||!p.modo)).slice(0,8);

  return(<>
    <div style={{fontFamily:FONT,animation:"fadeUp .2s ease"}}>

      {/* Drawer de filtros — siempre disponible */}
      {panelOpen&&(
        <>
          <div onClick={()=>setPanelOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:150,animation:"fadeIn .15s ease"}}/>
          <div style={{position:"fixed",top:0,right:0,bottom:0,width:"min(320px,90vw)",background:C.surface,zIndex:151,boxShadow:"-4px 0 24px rgba(0,0,0,.12)",overflowY:"auto",WebkitOverflowScrolling:"touch",animation:"slideInRight .2s ease",display:"flex",flexDirection:"column",fontFamily:FONT}}>
            <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px 14px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:C.surface,zIndex:1}}>
              <span style={{fontWeight:700,color:C.text,fontSize:16}}>Filtros</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {hasFilters&&<button onClick={clearAll} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:FONT,textDecoration:"underline"}}>Limpiar todo</button>}
                <button onClick={()=>setPanelOpen(false)} style={{width:32,height:32,borderRadius:"50%",background:C.bg,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:18,color:C.text,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            </div>
            <div style={{padding:"16px 20px",flex:1}}>
              {/* Filtros contextuales a la sección activa */}
              {seccion==="cursos"&&(<div style={{marginBottom:16}}><FL ch="Sincronismo"/><div style={{display:"flex",flexWrap:"wrap"}}>{[["all","Todos"],["sinc","En vivo"],["asinc","A tu ritmo"]].map(([v,l])=><FC key={v} label={l} active={filtroSinc===v} onClick={()=>setFiltroSinc(v)}/>)}</div></div>)}
              <div style={{marginBottom:16}}><FL ch="Modalidad"/><div style={{display:"flex",flexWrap:"wrap"}}>{[["all","Todas"],["presencial","Presencial"],["virtual","Virtual"],["mixto","Mixto"]].map(([v,l])=><FC key={v} label={l} active={filtroModalidad===v} onClick={()=>setFiltroModalidad(v)}/>)}</div></div>
              <div style={{marginBottom:16}}><FL ch="Materia"/>
                <SearchableSelect value={filtroMateria} onChange={setFiltroMateria} options={categorias.length>0?categorias.map(c=>c.nombre):MATERIAS} placeholder="Todas"/>
              </div>
              <div style={{marginBottom:16}}><FL ch="Ubicación"/>
                <div style={{position:"relative"}}>
                  <input value={filtroUbicacion} onChange={e=>setFiltroUbicacion(e.target.value)} placeholder={userCity?`Tu ciudad: ${userCity}`:"Ej: Palermo, CABA"} style={{width:"100%",background:C.bg,border:`1px solid ${filtroUbicacion?C.accent:C.border}`,borderRadius:8,padding:"9px 36px 9px 12px",color:C.text,fontSize:14,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                  <button title="Usar mi ubicación" onClick={()=>{if(userCity){setFiltroUbicacion(userCity);}else{detectarUbicacion();setTimeout(()=>{if(userCity)setFiltroUbicacion(userCity);},2000);}}}
                    style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:15,color:C.accent,padding:0,lineHeight:1}}>
                    {geoLoading?"⏳":"📍"}
                  </button>
                </div>
                {userCity&&!filtroUbicacion&&<button onClick={()=>setFiltroUbicacion(userCity)} style={{background:"none",border:"none",color:C.accent,fontSize:11,cursor:"pointer",fontFamily:FONT,padding:"4px 0",fontWeight:600}}>Usar {userCity}</button>}
                {filtroUbicacion&&<button onClick={()=>setFiltroUbicacion("")} style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:FONT,padding:"4px 0",textDecoration:"underline"}}>Limpiar</button>}
              </div>
              <div style={{marginBottom:16}}><FL ch="Moneda"/>
                <div style={{display:"flex",flexWrap:"wrap"}}>
                  {[["","Todas"],["ARS","$ ARS"],["USD","US$ USD"],["EUR","€ EUR"],["BRL","R$ BRL"],["CLP","CLP"]].map(([v,l])=><FC key={v} label={l} active={filtroMoneda===v} onClick={()=>setFiltroMoneda(v)}/>)}
                </div>
              </div>
              {precioMax>0&&(<div style={{marginBottom:16}}><FL ch="Precio por hora"/><PriceSlider min={precioMin} max={precioMax} valMin={sliderMin} valMax={sliderMax} onChangeMin={setSliderMin} onChangeMax={setSliderMax}/></div>)}
              <div style={{marginBottom:16}}><FL ch="Fecha de inicio"/>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Desde</div><input type="date" value={filtroFechaDesde} onChange={e=>setFiltroFechaDesde(e.target.value)} style={selS}/></div>
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Hasta</div><input type="date" value={filtroFechaHasta} min={filtroFechaDesde||undefined} onChange={e=>setFiltroFechaHasta(e.target.value)} style={selS}/></div>
                  {(filtroFechaDesde||filtroFechaHasta)&&<button onClick={()=>{setFiltroFechaDesde("");setFiltroFechaHasta("");}} style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:FONT,textAlign:"left",padding:0,textDecoration:"underline"}}>Limpiar fechas</button>}
                </div>
              </div>
              {maxDurSemanas>0&&(<div style={{marginBottom:16}}><FL ch="Duración mínima"/><select value={filtroDurMin} onChange={e=>setFiltroDurMin(+e.target.value)} style={selS}><option value={0}>Cualquier duración</option>{[1,2,4,8,12,16].filter(v=>v<maxDurSemanas).map(v=><option key={v} value={v}>{v} sem.</option>)}</select></div>)}
            </div>
            <div style={{padding:"14px 20px",borderTop:`1px solid ${C.border}`,position:"sticky",bottom:0,background:C.surface}}>
              <button onClick={()=>{setPanelOpen(false);setModoVista("resultados");}} style={{width:"100%",background:sT.grad,border:"none",borderRadius:20,color:"#fff",padding:"13px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:FONT,boxShadow:`0 4px 14px ${sT.accent}40`}}>
                Ver {filtered.length} resultado{filtered.length!==1?"s":""}
              </button>
            </div>
          </div>
        </>
      )}
            {/* ══ VISTA HOME ══ */}
      {modoVista==="home"&&(
        <div>
          {/* Hero con búsqueda grande */}
          {(()=>{
            const T=seccion==="cursos"?TIPO_PUB.curso:seccion==="clases"?TIPO_PUB.particular:TIPO_PUB.pedido;
            const heroTitle=seccion==="cursos"?"Aprendé a tu ritmo":seccion==="clases"?"Encontrá tu profe ideal":"Pedidos de alumnos";
            const heroSub=seccion==="cursos"?"Cursos estructurados con seguimiento real":seccion==="clases"?"Clases 1 a 1, a tu horario y ritmo":"Alumnos esperando que alguien como vos los contacte";
            return(
          <div style={{background:T.heroGrad,borderRadius:16,padding:"28px 28px 24px",marginBottom:24,position:"relative",overflow:"hidden",transition:"background .5s ease"}}>
            <div style={{position:"absolute",width:280,height:280,borderRadius:"50%",background:"rgba(255,255,255,.04)",top:-80,right:-60,pointerEvents:"none"}}/>
            <div style={{position:"absolute",width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,.06)",bottom:-60,left:20,pointerEvents:"none"}}/>
            <div style={{position:"relative",zIndex:1}}>
              {/* Tabs Cursos / Clases / Pedidos */}
              <div style={{display:"flex",gap:4,background:"rgba(255,255,255,.12)",borderRadius:12,padding:4,marginBottom:20,backdropFilter:"blur(8px)",width:"fit-content"}}>
                {[
                  {id:"cursos",icon:"🎓",label:"Cursos"},
                  {id:"clases",icon:"👤",label:"Clases"},
                  ...(esDocente?[{id:"pedidos",icon:"📣",label:"Pedidos"}]:[]),
                ].map(tab=>(
                  <button key={tab.id} onClick={()=>{setSeccion(tab.id);setFiltroModo("all");setModoVista("home");try{sessionStorage.setItem("cl_seccion_explore",tab.id);}catch{}}}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:700,transition:"all .2s",
                      background:seccion===tab.id?"#fff":"transparent",
                      color:seccion===tab.id?(tab.id==="cursos"?LUD.blue:tab.id==="clases"?"#C8660A":"#7B5CF0"):"rgba(255,255,255,.8)",
                      boxShadow:seccion===tab.id?"0 2px 8px rgba(0,0,0,.15)":"none"}}>
                    <span style={{fontSize:15}}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
              <h1 style={{color:"#fff",fontSize:"clamp(18px,4vw,26px)",fontWeight:800,margin:"0 0 4px",letterSpacing:"-.5px"}}>{heroTitle}</h1>
              <p style={{color:"rgba(255,255,255,.8)",fontSize:14,margin:"0 0 18px",lineHeight:1.5,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                {userCity&&<span style={{background:"rgba(255,255,255,.15)",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600,backdropFilter:"blur(4px)"}}>📍 {userCity}</span>}
                {loading?<span style={{background:"rgba(255,255,255,.2)",borderRadius:8,padding:"2px 24px",animation:"pulse 1.5s infinite"}}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>:
                  seccion==="pedidos"?`${todosPedidos.length} pedido${todosPedidos.length!==1?"s":""} esperando respuesta`:
                  visiblePosts.filter(p=>p.tipo==="oferta").length>0
                    ?`${visiblePosts.filter(p=>p.tipo==="oferta").length} ${seccion==="cursos"?"cursos disponibles":"docentes disponibles"}`
                    :heroSub}
              </p>
              <button onClick={()=>setShowBusquedaIA(true)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,.15)",border:"2px solid rgba(255,255,255,.25)",borderRadius:14,padding:"14px 20px",cursor:"pointer",fontFamily:FONT,textAlign:"left",backdropFilter:"blur(8px)",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.22)";e.currentTarget.style.borderColor="rgba(255,255,255,.5)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.15)";e.currentTarget.style.borderColor="rgba(255,255,255,.25)";}}>
                <span style={{fontSize:18,fontWeight:700,color:"rgba(255,255,255,.9)"}}>✦</span>
                <span style={{color:"rgba(255,255,255,.65)",fontSize:15,flex:1}}>{seccion==="pedidos"?"Buscá pedidos por materia o tema…":seccion==="cursos"?"Describí qué querés aprender…":"Describí qué clase estás buscando…"}</span>
                <span style={{background:"rgba(255,255,255,.2)",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:600,color:"rgba(255,255,255,.8)",flexShrink:0,whiteSpace:"nowrap"}}>Buscar con IA</span>
              </button>
            </div>
          </div>
            );
          })()}

          {/* ── Vista especial: Pedidos ── */}
          {seccion==="pedidos"&&(
            <div style={{marginBottom:24}}>
              <div style={{background:`linear-gradient(135deg,${TIPO_PUB.pedido.dim},#E05C9A10)`,border:`1px solid ${TIPO_PUB.pedido.border}`,borderRadius:16,padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:28}}>📣</span>
                <div>
                  <div style={{fontWeight:700,color:TIPO_PUB.pedido.accent,fontSize:15}}>Alumnos buscando docentes</div>
                  <div style={{fontSize:13,color:C.muted}}>Contactalos directamente y ofrecé tus servicios</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
                {todosPedidos.length===0
                  ?<div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px",color:C.muted,fontSize:14}}>No hay pedidos activos en este momento.</div>
                  :todosPedidos.map(p=>(
                    <div key={p.id} onClick={()=>onOpenDetail(p)}
                      style={{background:TIPO_PUB.pedido.bg,border:`1px solid ${TIPO_PUB.pedido.border}`,borderRadius:14,padding:"16px",cursor:"pointer",borderTop:`3px solid ${TIPO_PUB.pedido.accent}`,transition:"all .18s"}}
                      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px ${TIPO_PUB.pedido.dim}`;}}
                      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                        <Avatar letra={(p.autor_nombre||p.autor_email||"?")[0]} size={30}/>
                        <div style={{minWidth:0,flex:1}}>
                          <div style={{fontSize:11,fontWeight:600,color:TIPO_PUB.pedido.accent,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{safeDisplayName(p.autor_nombre,p.autor_email)}</div>
                          <div style={{fontSize:10,color:C.muted}}>{p.materia||"Sin materia"}</div>
                        </div>
                      </div>
                      <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:8,lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{p.titulo}</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:10,fontWeight:700,color:TIPO_PUB.pedido.accent,background:TIPO_PUB.pedido.dim,borderRadius:20,padding:"2px 8px"}}>📣 {p.modo==="curso"||p.modo==="grupal"?"Pedido de curso":"Pedido de clase"}</span>
                        {p.expires_at&&(()=>{const d=Math.ceil((new Date(p.expires_at)-new Date())/86400000);return d>0&&d<=7?<span style={{fontSize:10,color:C.warn}}>⏱ {d}d</span>:null;})()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Categorías — cards con foto visual */}
          {seccion==="pedidos"?null:<div style={{marginBottom:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontWeight:700,color:C.text,fontSize:16}}>Explorar por categoría</div>
              <button onClick={()=>setModoVista("resultados")} style={{background:"none",border:"none",color:C.accent,fontSize:13,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>Ver todo →</button>
            </div>
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
              <style>{`.cl-cats-row::-webkit-scrollbar{display:none}`}</style>
              <div style={{display:"flex",gap:12,paddingBottom:6}} className="cl-cats-row">
                {cats.map(cat=>{
                  const data=CATEGORIAS_DATA[cat.label]||{emoji:"📚",grad:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",bg:"#1A6ED8"};
                  return(
                    <button key={cat.label} onClick={()=>{setFiltroMateria(cat.label);setModoVista("resultados");}}
                      style={{flexShrink:0,width:"min(120px,42vw)",borderRadius:14,overflow:"hidden",border:"none",cursor:"pointer",fontFamily:FONT,padding:0,background:"transparent",transition:"transform .2s",textAlign:"left",display:"flex",flexDirection:"column"}}
                      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-4px) scale(1.02)"}
                      onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                      {/* Área visual */}
                      <div style={{height:90,background:data.grad,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",borderRadius:"14px 14px 0 0",overflow:"hidden",flexShrink:0}}>
                        <div style={{position:"absolute",width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,.1)",top:-20,right:-20,pointerEvents:"none"}}/>
                        <span style={{fontSize:42,filter:"drop-shadow(0 2px 8px rgba(0,0,0,.2))",lineHeight:1,position:"relative",zIndex:1}}>{data.emoji}</span>
                        {cat.count>0&&<span style={{position:"absolute",bottom:6,right:7,background:"rgba(0,0,0,.4)",color:"#fff",borderRadius:20,fontSize:10,fontWeight:700,padding:"1px 6px",backdropFilter:"blur(4px)"}}>{cat.count}</span>}
                      </div>
                      {/* Label — altura fija para que todas sean iguales */}
                      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 14px 14px",padding:"8px 9px",flex:1,height:48,display:"flex",alignItems:"center"}}>
                        <div style={{fontWeight:600,color:C.text,fontSize:11,lineHeight:1.35,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",width:"100%"}}>{cat.label}</div>
                      </div>
                    </button>
                  );
                })}
                {/* Ver todo */}
                <button onClick={()=>setModoVista("resultados")}
                  style={{flexShrink:0,width:130,borderRadius:14,overflow:"hidden",border:`2px dashed ${C.border}`,cursor:"pointer",fontFamily:FONT,padding:0,background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,height:130+36,transition:"border-color .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <span style={{fontSize:28,color:C.muted}}>→</span>
                  <span style={{fontSize:12,fontWeight:600,color:C.muted}}>Ver todas</span>
                </button>
              </div>
            </div>
          </div>}

          {/* Accesos rápidos — distintos según sección */}
          {seccion==="pedidos"?null:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:24}}>
            {(seccion==="cursos"?[
              {icon:"⚡",title:"Sincrónicos",desc:"Con docente en vivo",onClick:()=>{setFiltroSinc("sinc");setModoVista("resultados");}},
              {icon:"🎬",title:"A tu ritmo",desc:"Grabados, cuando quieras",onClick:()=>{setFiltroSinc("asinc");setModoVista("resultados");}},
              {icon:"🌐",title:"Online",desc:"Desde cualquier lugar",onClick:()=>{setFiltroModalidad("virtual");setModoVista("resultados");}},
              {icon:"📍",title:"Presencial",desc:userCity?`Cerca de ${userCity}`:"Cerca tuyo",onClick:()=>{setFiltroModalidad("presencial");if(userCity)setFiltroUbicacion(userCity);setModoVista("resultados");}},
            ]:[
              {icon:"👤",title:"Uno a uno",desc:"Atención personalizada",onClick:()=>{setFiltroModalidad("all");setModoVista("resultados");}},
              {icon:"🌐",title:"Online",desc:"Desde cualquier lugar",onClick:()=>{setFiltroModalidad("virtual");setModoVista("resultados");}},
              {icon:"📍",title:"Presencial",desc:userCity?`Cerca de ${userCity}`:"Cerca tuyo",onClick:()=>{setFiltroModalidad("presencial");if(userCity)setFiltroUbicacion(userCity);setModoVista("resultados");}},
              {icon:"📦",title:"Por paquete",desc:"Comprá varias clases",onClick:()=>{setModoVista("resultados");}},
            ]).map(item=>(
              <button key={item.title} onClick={item.onClick}
                style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 14px",cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"all .18s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px rgba(0,0,0,.08)`;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                <div style={{fontSize:24,marginBottom:8}}>{item.icon}</div>
                <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:2}}>{item.title}</div>
                <div style={{fontSize:11,color:C.muted}}>{item.desc}</div>
              </button>
            ))}
          </div>}

          {/* Publicaciones destacadas — scroll horizontal */}
          {seccion!=="pedidos"&&(loading?<Spinner/>:(seccion==="cursos"?[
            {label:"✨ Cursos recientes",data:cursos.slice(0,8)},
            {label:"⭐ Mejor valorados",data:[...cursos].sort((a,b)=>(reseñasMap[b.id]?.avg||0)-(reseñasMap[a.id]?.avg||0)).slice(0,6)},
          ]:[
            {label:"✨ Docentes disponibles",data:particulares.slice(0,8)},
            {label:"⭐ Mejor valorados",data:[...particulares].sort((a,b)=>(reseñasMap[b.id]?.avg||0)-(reseñasMap[a.id]?.avg||0)).slice(0,6)},
          ]).map(({label,data})=>data.length>0&&(
            <div key={label} style={{marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontWeight:700,color:C.text,fontSize:15}}>{label}</div>
                <button onClick={()=>setModoVista("resultados")} style={{background:"none",border:"none",color:C.accent,fontSize:13,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>Ver todos →</button>
              </div>
              <div style={{display:"flex",gap:14,overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",paddingBottom:8}}>
                <style>{`.cl-hscroll::-webkit-scrollbar{display:none}`}</style>
                <div style={{display:"flex",gap:14}} className="cl-hscroll">
                  {data.map(p=>(
                    <div key={p.id} onClick={()=>onOpenDetail(p)}
                      style={{background:p.tipo==="busqueda"?TIPO_PUB.pedido.bg:C.surface,border:`1px solid ${p.tipo==="busqueda"?TIPO_PUB.pedido.border:C.border}`,borderRadius:12,padding:"16px",cursor:"pointer",flexShrink:0,width:"min(220px,72vw)",transition:"all .18s",borderTop:`3px solid ${getPubTipo(p).accent}`}}
                      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.09)";e.currentTarget.style.transform="translateY(-2px)";}}
                      onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}>
                      {/* Avatar + nombre */}
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                        {(()=>{const av=_avatarCache[p.autor_email]||localStorage.getItem("cl_avatar_"+p.autor_email)||null;return av&&av.startsWith("http")?<div style={{width:32,height:32,borderRadius:"50%",overflow:"hidden",flexShrink:0}}><img src={av} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/></div>:<Avatar letra={(p.autor_nombre||p.autor_email||"?")[0]} size={32}/>;})()}
                        <div style={{minWidth:0,flex:1}}>
                          <div style={{fontSize:11,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{safeDisplayName(p.autor_nombre,p.autor_email)}</div>
                          <div style={{fontSize:10,color:C.muted}}>{p.materia}</div>
                        </div>
                        <FavBtn post={p} session={session} onFavChange={()=>cargar()} isFav={p.id in favsMap} favId={favsMap[p.id]||null}/>
                      </div>
                      {/* Título */}
                      <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:6,lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{p.titulo}</div>
                      {/* Tags */}
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                        <Tag tipo={p.tipo}/>
                        {(p.modo==="curso"||p.modo==="grupal")&&<span style={{fontSize:10,color:getPubTipo(p).accent,background:getPubTipo(p).dim,borderRadius:20,padding:"2px 8px",fontWeight:600}}>🎓 Curso</span>}
                        {p.modo==="particular"&&<span style={{fontSize:10,color:getPubTipo(p).accent,background:getPubTipo(p).dim,borderRadius:20,padding:"2px 8px",fontWeight:600}}>👤 Clase</span>}
                        {p.modalidad==="virtual"&&<span style={{fontSize:10,color:C.info,background:C.info+"12",borderRadius:20,padding:"2px 8px",fontWeight:600}}>🌐 Virtual</span>}
                        {p.modalidad==="presencial"&&<span style={{fontSize:10,color:C.muted,background:C.bg,borderRadius:20,padding:"2px 8px",border:`1px solid ${C.border}`}}>📍 Presencial</span>}
                      </div>
                      {/* Rating + verificado */}
                      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                        {reseñasMap[p.id]?.avg&&<MiniStars val={reseñasMap[p.id].avg} count={reseñasMap[p.id].count}/>}
                        {p.verificado&&<span style={{fontSize:9,fontWeight:700,color:C.info,background:C.info+"12",borderRadius:20,padding:"2px 7px",border:`1px solid ${C.info}30`,letterSpacing:.3}}>✓ VERIF.</span>}
                        {p.tipo==="oferta"&&p.autor_disponible_ahora&&p.autor_disponible_hasta&&new Date(p.autor_disponible_hasta)>new Date()&&<span style={{fontSize:9,fontWeight:700,color:"#fff",background:"#16A34A",borderRadius:20,padding:"2px 7px",letterSpacing:.3}}>🟢 Disponible</span>}
                      </div>
                      {/* Precio + inscriptos */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        {p.tipo==="busqueda"
                          ?<div style={{fontSize:12,color:TIPO_PUB.pedido.accent,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>📣 {p.modo==="curso"||p.modo==="grupal"?"Pedido de curso":"Pedido de clase"}</div>
                          :p.precio?<div style={{fontWeight:800,color:getPubTipo(p).accent,fontSize:15}}>{fmtPrice(p.precio,p.moneda)}<span style={{fontSize:11,fontWeight:400,color:C.muted}}> /{p.precio_tipo||"hora"}</span></div>
                          :<div style={{fontWeight:600,color:C.success,fontSize:13}}>Gratis</div>}
                        {p.cantidad_inscriptos>0&&<span style={{fontSize:10,color:C.muted}}>👥{p.cantidad_inscriptos}</span>}
                      </div>
                      {p.tipo==="busqueda"&&p.expires_at&&(()=>{const daysLeft=Math.ceil((new Date(p.expires_at)-new Date())/86400000);if(daysLeft<=3&&daysLeft>0)return(<div style={{fontSize:10,color:"#B45309",fontWeight:600,marginTop:4}}>⏱ Expira en {daysLeft} día{daysLeft!==1?"s":""}</div>);return null;})()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )))}

          {/* Banner CTA: IA search — hidden in pedidos view */}
          {seccion!=="pedidos"&&(()=>{
            const T=seccion==="cursos"?TIPO_PUB.curso:TIPO_PUB.particular;
            return(
            <div style={{background:`linear-gradient(135deg,${T.dim},${T.border})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"20px 24px",marginBottom:24,display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{fontSize:36}}>{seccion==="cursos"?"🎓":"👤"}</div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontWeight:700,color:C.text,fontSize:15,marginBottom:4}}>
                  {seccion==="cursos"?"¿No encontrás el curso que buscás?":"¿No encontrás el docente ideal?"}
                </div>
                <div style={{fontSize:13,color:C.muted}}>
                  {seccion==="cursos"
                    ?"Describí el tema y te mostramos lo más relevante con IA."
                    :"Describí qué necesitás y encontramos el docente perfecto."}
                </div>
              </div>
              <button onClick={()=>setShowBusquedaIA(true)} style={{background:T.grad,border:"none",borderRadius:20,color:"#fff",padding:"10px 22px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,boxShadow:`0 4px 12px ${T.dim}`,flexShrink:0,whiteSpace:"nowrap"}}>
                Buscar con IA →
              </button>
            </div>
            );
          })()}
          {posts.length>3&&seccion!=="pedidos"&&<DocentesDestacados posts={posts} onOpenPerfil={onOpenPerfil} session={session}/>}

          {/* ── Footer estilo ML ── */}
          <div style={{marginTop:32,paddingTop:24,borderTop:`1px solid ${C.border}`}}>
            {/* 3 pilares */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:0,marginBottom:24}}>
              {[
                {icon:"🎓",title:"Aprendé sin intermediarios",desc:"Conectate directamente con el docente. Sin comisiones, sin sorpresas.",link:"Ver cómo funciona"},
                {icon:"🔒",title:"Tu privacidad, protegida",desc:"Tu email nunca se comparte. Todos los contactos pasan por la plataforma.",link:"Cómo protegemos tus datos"},
                {icon:"⭐",title:"Docentes verificados",desc:"El sistema valida el conocimiento de cada docente antes de publicar.",link:"Conocer el sistema de verificación"},
              ].map((item,i,arr)=>(
                <div key={item.title} style={{textAlign:"center",padding:"20px 24px",borderRight:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{fontSize:36,marginBottom:12}}>{item.icon}</div>
                  <div style={{fontWeight:700,color:C.text,fontSize:15,marginBottom:8}}>{item.title}</div>
                  <div style={{color:C.muted,fontSize:13,lineHeight:1.6,marginBottom:10}}>{item.desc}</div>
                  <button style={{background:"none",border:"none",color:C.accent,fontSize:13,cursor:"pointer",fontFamily:FONT,fontWeight:600,padding:0}}
                    onClick={()=>setModoVista("resultados")}>
                    {item.link} →
                  </button>
                </div>
              ))}
            </div>

            {/* Banners informativos */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12,marginBottom:20}}>
              <div style={{border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24}}>🤝</span>
                <div>
                  <div style={{fontWeight:600,color:C.text,fontSize:13,marginBottom:2}}>¿Querés enseñar?</div>
                  <button style={{background:"none",border:"none",color:C.accent,fontSize:12,cursor:"pointer",fontFamily:FONT,padding:0,fontWeight:600}}
                    onClick={()=>setModoVista("resultados")}>
                    Publicá tu primera clase gratis →
                  </button>
                </div>
              </div>
              {esDocente&&<div style={{border:`1px solid ${TIPO_PUB.pedido.border}`,borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24}}>📣</span>
                <div>
                  <div style={{fontWeight:600,color:C.text,fontSize:13,marginBottom:2}}>¿Querés ver pedidos de alumnos?</div>
                  <button style={{background:"none",border:"none",color:TIPO_PUB.pedido.accent,fontSize:12,cursor:"pointer",fontFamily:FONT,padding:0,fontWeight:600}}
                    onClick={()=>{setSeccion("pedidos");try{sessionStorage.setItem("cl_seccion_explore","pedidos");}catch{}}}>
                    Ver pedidos activos →
                  </button>
                </div>
              </div>}
            </div>

            {/* Pie */}
            <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:24,padding:"16px 0",flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,color:C.muted,fontSize:12}}>
                <span>✉️</span>
                <span>contacto@luderis.com</span>
              </div>
              <div style={{width:1,height:14,background:C.border}}/>
              <div style={{display:"flex",alignItems:"center",gap:6,color:C.muted,fontSize:12}}>
                <span>🇦🇷</span>
                <span>Buenos Aires, Argentina</span>
              </div>
              <div style={{width:1,height:14,background:C.border}}/>
              <div style={{display:"flex",alignItems:"center",gap:6,color:C.muted,fontSize:12}}>
                <span>🔒</span>
                <span>Plataforma segura · Sin comisiones</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ VISTA RESULTADOS ══ */}
      {modoVista==="resultados"&&(
        <div>
          {/* ── Barra superior: volver + buscador IA ── */}
          <div style={{background:C.surface,borderRadius:12,padding:"14px 16px",marginBottom:14,border:`1px solid ${C.border}`,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <button onClick={goHome}
                style={{width:34,height:34,borderRadius:"50%",background:C.bg,border:`1px solid ${C.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:C.text,flexShrink:0,transition:"background .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.border}
                onMouseLeave={e=>e.currentTarget.style.background=C.bg}>←</button>
              {/* Buscador principal — trigger del modal */}
              <button onClick={()=>setShowBusquedaIA(true)}
                style={{flex:1,display:"flex",alignItems:"center",gap:10,background:C.bg,border:`2px solid ${iaQuery?C.accent:C.border}`,borderRadius:10,padding:"11px 16px",cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                onMouseLeave={e=>e.currentTarget.style.borderColor=iaQuery?C.accent:C.border}>
                <span style={{fontSize:15,background:"linear-gradient(135deg,#7B3FBE,#1A6ED8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700}}>✦</span>
                <span style={{color:iaQuery?C.text:C.muted,fontSize:14,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {iaQuery?iaQuery:"Describí lo que querés aprender…"}
                </span>
                {iaQuery&&<span onClick={e=>{e.stopPropagation();setIaQuery("");setIaResults(null);setIaExplanation("");setPagina(1);}} style={{color:C.muted,fontSize:16,lineHeight:1,flexShrink:0}}>×</span>}
              </button>
              <button onClick={()=>setPanelOpen(v=>!v)}
                style={{display:"flex",alignItems:"center",gap:6,background:hasFilters?C.accentDim:C.bg,border:`1px solid ${hasFilters?C.accent:C.border}`,borderRadius:10,color:hasFilters?C.accent:C.muted,padding:"11px 14px",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>
                ≡ Filtros{activeFilters.length>0&&<span style={{background:C.accent,color:"#fff",borderRadius:"50%",width:18,height:18,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,marginLeft:2}}>{activeFilters.length}</span>}
              </button>
            </div>

            {/* Chips de tipo + modalidad + ordenamiento */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {(()=>{const T=seccion==="clases"?TIPO_PUB.particular:seccion==="pedidos"?TIPO_PUB.pedido:TIPO_PUB.curso;return[["all","Todo"],["oferta","Clases"],["busqueda","Pedidos"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFiltroTipo(v)} style={{padding:"4px 14px",borderRadius:20,fontSize:12,fontWeight:filtroTipo===v?600:400,cursor:"pointer",fontFamily:FONT,background:filtroTipo===v?T.accent:"transparent",color:filtroTipo===v?"#fff":C.muted,border:`1px solid ${filtroTipo===v?T.accent:C.border}`,transition:"all .12s"}}>{l}</button>
              ));})()}
              <div style={{width:1,height:18,background:C.border,margin:"0 2px"}}/>
              {[["presencial","📍 Presencial"],["virtual","🌐 Virtual"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFiltroModalidad(filtroModalidad===v?"all":v)} style={{padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:filtroModalidad===v?600:400,cursor:"pointer",fontFamily:FONT,background:filtroModalidad===v?C.accentDim:"transparent",color:filtroModalidad===v?C.accent:C.muted,border:`1px solid ${filtroModalidad===v?C.accent:C.border}`,transition:"all .12s"}}>{l}</button>
              ))}
              {/* Selector de ordenamiento */}
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>Ordenar:</span>
                <select value={ordenamiento} onChange={e=>{setOrdenamiento(e.target.value);setPagina(1);}}
                  style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"4px 8px",color:C.text,fontSize:12,outline:"none",cursor:"pointer",fontFamily:FONT,colorScheme:localStorage.getItem("cl_theme")||"light"}}>
                  <option value="relevancia">Más relevantes</option>
                  <option value="recientes">Más recientes</option>
                  <option value="rating">Mejor calificados</option>
                  <option value="precio_asc">Precio: menor a mayor</option>
                  <option value="precio_desc">Precio: mayor a menor</option>
                  <option value="vistas">Más vistos</option>
                  <option value="cercania">Más cercanos</option>
                </select>
                <span style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{sorted.length} resultado{sorted.length!==1?"s":""}</span>
                <div style={{display:"flex",gap:2,border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
                  {[["cards","▦"],["lista","≡"],["ranking","🏆"]].map(([m,icon])=>(
                    <button key={m} onClick={()=>setViewMode(m)} style={{background:viewMode===m?C.accent:"none",border:"none",color:viewMode===m?"#fff":C.muted,width:30,height:28,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .12s"}}>{icon}</button>
                  ))}
                </div>
              </div>
            </div>
            {activeFilters.length>0&&(
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`,alignItems:"center"}}>
                {activeFilters.map(f=><span key={f} style={{background:C.accentDim,border:`1px solid ${C.accent}30`,borderRadius:20,padding:"2px 10px",fontSize:11,color:C.accent,fontWeight:500}}>{f}</span>)}
                <button onClick={clearAll} style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:FONT,textDecoration:"underline",marginLeft:4}}>Limpiar todo</button>
              </div>
            )}
            {/* Explanation de la búsqueda */}
            {iaExplanation&&(
              <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13,background:"linear-gradient(135deg,#7B3FBE,#1A6ED8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700,flexShrink:0}}>✦</span>
                <span style={{fontSize:12,color:C.muted,flex:1,lineHeight:1.4}}>{iaExplanation}</span>
              </div>
            )}
          </div>

          {/* Banner rechazadas — aparece cuando hay IDs nuevos no vistos */}
          {(()=>{const nuevas=[...rechazadasIds].filter(id=>!seenRechazadas.has(id));return nuevas.length>0&&(
            <div style={{background:C.danger+"10",border:`1px solid ${C.danger}25`,borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <span style={{fontSize:12,color:C.muted,flex:1}}>
                <span style={{color:C.danger,fontWeight:700}}>{nuevas.length}</span> búsqueda{nuevas.length!==1?"s":""} donde tu oferta fue rechazada (oculta{nuevas.length!==1?"s":""})
              </span>
              <button onClick={()=>{const next=new Set([...seenRechazadas,...rechazadasIds]);setSeenRechazadas(next);try{localStorage.setItem("cl_seen_rechazadas",JSON.stringify([...next]));}catch{}}} style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer",lineHeight:1,padding:"2px 6px",flexShrink:0,borderRadius:"50%",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background=C.border} onMouseLeave={e=>e.currentTarget.style.background="none"} title="Cerrar">×</button>
            </div>
          );})()}

          {/* Banner docente nuevo sin publicaciones */}
          {(()=>{
            const esDoc=rolUsuario==="docente"||rolUsuario==="ambos";
            const misPubs=posts.filter(p=>p.autor_email===session.user.email&&p.tipo==="oferta");
            let yaVisto=false;try{yaVisto=localStorage.getItem("cl_hide_docwelcome_"+session.user.email)==="1";}catch{}
            if(!esDoc||misPubs.length>0||loading||yaVisto)return null;
            return(
              <div data-docwelcome="1" style={{background:`linear-gradient(135deg,${C.accentDim},${C.bg})`,border:`1px solid ${C.accent}33`,borderRadius:14,padding:"16px 18px",marginBottom:14,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:4}}>📢 ¿Querés aparecer acá?</div>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>Publicá tu primera clase y empezá a recibir alumnos. Solo tarda 2 minutos.</div>
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center"}}>
                  <button onClick={()=>{if(typeof window._openNewPost==="function")window._openNewPost();}}
                    style={{background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"8px 18px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 10px rgba(26,110,216,.25)"}}>
                    Publicar ahora →
                  </button>
                  <button onClick={e=>{e.currentTarget.closest("[data-docwelcome]").remove();try{localStorage.setItem("cl_hide_docwelcome_"+session.user.email,"1");}catch{}}}
                    style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer",lineHeight:1,padding:"2px 4px"}} title="Cerrar">×</button>
                </div>
              </div>
            );
          })()}

          {/* Lista de resultados */}
          {loading?<Spinner/>:sorted.length===0?(
            <div style={{textAlign:"center",color:C.muted,padding:"60px 0",fontSize:13}}>
              <div style={{fontSize:26,marginBottom:10,color:C.border}}>◎</div>
              {hasFilters||iaQuery?"Sin resultados con esos filtros.":posts.length===0?"Todavía no hay publicaciones.":"Sin resultados."}
              {(hasFilters||iaQuery)&&<div style={{marginTop:8,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                {hasFilters&&<button onClick={clearAll} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontFamily:FONT,fontSize:13,textDecoration:"underline"}}>Limpiar filtros</button>}
                {iaQuery&&<button onClick={()=>{setIaQuery("");setIaResults(null);}} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontFamily:FONT,fontSize:13,textDecoration:"underline"}}>Limpiar búsqueda IA</button>}
              </div>}
            </div>
          ):viewMode==="ranking"?(
            <LeaderboardView posts={posts} reseñasMap={reseñasMap} reseñasUserMap={reseñasUserMap} onOpenPerfil={onOpenPerfil} filtroMateria={filtroMateria}/>
          ):(
            <div>
              <div style={viewMode==="cards"?{display:"grid",gap:11}:{display:"flex",flexDirection:"column",gap:1,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
                {sorted.slice(0,pagina*PAGE_SIZE).map(p=>(
                  viewMode==="lista"?(
                    <div key={p.id} onClick={()=>onOpenDetail(p)} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 16px",cursor:"pointer",background:C.surface,borderBottom:`1px solid ${C.border}`,transition:"background .12s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                      onMouseLeave={e=>e.currentTarget.style.background=C.surface}>
                      <Avatar letra={(p.autor_nombre||p.autor_email||"?")[0]} size={36}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,color:C.text,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titulo}</div>
                        <div style={{fontSize:12,color:C.muted}}>{p.materia} · {fmtRel(p.created_at)}</div>
                      </div>
                      <div style={{flexShrink:0,textAlign:"right"}}>
                        {p.precio?<div style={{fontWeight:700,color:C.accent,fontSize:14}}>{fmtPrice(p.precio)}</div>:<div style={{fontSize:12,color:C.success,fontWeight:600}}>Gratis</div>}
                      {p.tiene_prueba&&<div style={{fontSize:10,color:"#0F6E56",fontWeight:700,background:"#2EC4A012",borderRadius:6,padding:"1px 6px",marginTop:2}}>✓ Clase de prueba</div>}
                      {(()=>{try{const pqs=JSON.parse(p.paquetes||"[]");const mejor=pqs.filter(x=>x.clases>0).sort((a,b)=>(b.descuento||0)-(a.descuento||0))[0];return mejor?.descuento>0?<div style={{fontSize:10,color:"#0F6E56",fontWeight:700,background:"#2EC4A012",borderRadius:6,padding:"1px 6px",marginTop:2}}>📦 Pack -{mejor.descuento}%</div>:null;}catch{return null;}})()}
                        <Tag tipo={p.tipo}/>
                      </div>
                    </div>
                  ):(
                    <PostCard key={p.id} post={p} session={session} onOpenChat={onOpenChat} onOpenDetail={onOpenDetail} onOpenPerfil={onOpenPerfil} avgPub={reseñasMap[p.id]?.avg} countPub={reseñasMap[p.id]?.count} avgUser={reseñasUserMap[p.autor_email]} yaOferte={pendientesIds.has(p.id)} fueRechazado={rechazadasIds.has(p.id)} isFav={p.id in favsMap} favId={favsMap[p.id]||null} onFavChange={()=>{cargar();}}/>
                  )
                ))}
              </div>
              {/* Sentinel para infinite scroll */}
              <div ref={sentinelRef} style={{height:40,display:"flex",alignItems:"center",justifyContent:"center",marginTop:8}}>
                {pagina*PAGE_SIZE<sorted.length?(
                  <div style={{display:"flex",alignItems:"center",gap:8,color:C.muted,fontSize:12}}>
                    <div style={{width:16,height:16,border:`2px solid ${C.accent}`,borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
                    Cargando más…
                  </div>
                ):(
                  sorted.length>0&&<div style={{color:C.muted,fontSize:11}}>
                    {sorted.length} publicación{sorted.length!==1?"es":""} en total
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
    {showBusquedaIA&&<BusquedaIA onBuscar={buscarConIA} iaLoading={iaLoading} onClose={()=>setShowBusquedaIA(false)}/>}
  </>);
}
function MyPostCard({post,session,onEdit,onToggle,onDelete,onOpenCurso,toggling,ofertasPendientes,inscriptos}){
  const [confirmDelete,setConfirmDelete]=useState(false);
  const [ofertaAceptadaInfo,setOfertaAceptadaInfo]=useState(null);
  const [loadingDelete,setLoadingDelete]=useState(false);
  const [descExpanded,setDescExpanded]=useState(false);
  const activo=post.activo!==false;const finalizado=!!post.finalizado;
  const pendienteValidacion=post.activo===false&&post.estado_validacion==="pendiente";
  const DESC_MAX=160;
  const descLarga=(post.descripcion?.length||0)>DESC_MAX;

  const handleClickEliminar=async()=>{
    if(post.tipo==="busqueda"){
      try{
        const todas=await sb.getOfertasSobre(post.id,session.access_token);
        const aceptada=todas.find(o=>o.estado==="aceptada");
        setOfertaAceptadaInfo(aceptada?{nombre:aceptada.ofertante_nombre||safeDisplayName(null,aceptada.ofertante_email),email:aceptada.ofertante_email}:null);
      }catch{setOfertaAceptadaInfo(null);}
    }
    setConfirmDelete(true);
  };

  const handleConfirmDelete=async()=>{
    setLoadingDelete(true);
    try{
      if(post.tipo==="busqueda"&&ofertaAceptadaInfo?.email){
        sb.insertNotificacion({usuario_id:null,alumno_email:ofertaAceptadaInfo.email,tipo:"busqueda_eliminada",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      }
      setConfirmDelete(false);
      onDelete(post);
    }finally{setLoadingDelete(false);}
  };

  return(
    <div style={{background:C.surface,border:`1px solid ${ofertasPendientes>0?C.accent+"60":C.border}`,borderRadius:10,padding:"16px 18px",fontFamily:FONT,transition:"box-shadow .15s"}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,.06)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
      {/* Badges */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8,alignItems:"center"}}>
        <Tag tipo={post.tipo}/>
        <StatusBadge activo={activo} finalizado={finalizado} pendiente={pendienteValidacion}/>
        {post.verificado&&<VerifiedBadge/>}
        {ofertasPendientes>0&&<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}33`}}>{ofertasPendientes} oferta{ofertasPendientes!==1?"s":""}</span>}
        {!finalizado&&post.inscripciones_cerradas&&<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:C.warn+"12",color:C.warn,border:`1px solid ${C.warn}30`}}>Inscripciones cerradas</span>}
        {post.tipo==="busqueda"&&post.expires_at&&(()=>{const daysLeft=Math.ceil((new Date(post.expires_at)-new Date())/86400000);if(daysLeft<=0)return<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:C.danger+"12",color:C.danger,border:`1px solid ${C.danger}30`}}>⏱ Expirada</span>;if(daysLeft<=3)return<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:"#FEF3C7",color:"#B45309",border:"1px solid #F59E0B33"}}>⏱ Expira en {daysLeft} día{daysLeft!==1?"s":""}</span>;return null;})()}
      </div>
      {/* Contenido + acciones */}
      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
        <div style={{flex:1,minWidth:0}}>
          <h3 style={{color:C.text,fontSize:14,fontWeight:600,margin:"0 0 5px",lineHeight:1.35,wordBreak:"break-word"}}>{post.titulo}</h3>
          <p style={{color:C.muted,fontSize:13,margin:"0 0 6px",lineHeight:1.55}}>
            {descLarga&&!descExpanded?post.descripcion.slice(0,DESC_MAX)+"...":post.descripcion}
            {descLarga&&<button onClick={e=>{e.stopPropagation();setDescExpanded(v=>!v);}} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:12,fontFamily:FONT,padding:"0 0 0 4px",fontWeight:600}}>{descExpanded?"Menos ▲":"Más ▼"}</button>}
          </p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {post.precio&&<span style={{fontSize:12,color:C.accent,fontWeight:600}}>{fmtPrice(post.precio,post.moneda)}</span>}
            {post.tipo==="oferta"&&inscriptos!==undefined&&<span style={{fontSize:12,color:C.muted}}>{inscriptos} inscripto{inscriptos!==1?"s":""}</span>}
            {post.vistas>0&&<span style={{fontSize:12,color:C.muted}}>👁 {post.vistas}</span>}
            {post.created_at&&<span style={{fontSize:12,color:C.muted}}>{fmt(post.created_at)}</span>}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0,minWidth:88}}>
          {post.tipo==="oferta"&&<button onClick={()=>onOpenCurso(pendienteValidacion?{...post,_openValidacion:true}:post)} style={{background:pendienteValidacion?C.accent:C.accentDim,border:`1px solid ${C.accent}${pendienteValidacion?"":"44"}`,borderRadius:6,color:pendienteValidacion?"#fff":C.accent,padding:"6px 8px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:FONT,textAlign:"center"}}>{pendienteValidacion?"⏳ Validar":"Contenido"}</button>}
          {!finalizado&&<button onClick={()=>onEdit(post)} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"6px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT,textAlign:"center",transition:"border-color .12s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>Editar</button>}
          {!finalizado&&!pendienteValidacion&&<button onClick={()=>onToggle(post)} disabled={toggling===post.id} style={{background:activo?C.warn+"12":C.success+"12",border:`1px solid ${activo?C.warn+"40":C.success+"40"}`,borderRadius:6,color:activo?C.warn:C.success,padding:"6px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT,textAlign:"center",opacity:toggling===post.id?.5:1}}>{toggling===post.id?"...":(activo?"Pausar":"Activar")}</button>}
          {post.tipo==="busqueda"&&post.expires_at&&Math.ceil((new Date(post.expires_at)-new Date())/86400000)<=3&&(
            <button onClick={async()=>{try{await sb.updatePublicacion(post.id,{expires_at:new Date(Date.now()+14*86400000).toISOString()},session.access_token);if(onToggle)onToggle({...post,_renovar:true});}catch(e){alert("Error: "+e.message);}}} style={{background:C.success+"12",border:`1px solid ${C.success}40`,borderRadius:6,color:C.success,padding:"6px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT,textAlign:"center",fontWeight:600}}>Renovar</button>
          )}
          <button onClick={handleClickEliminar} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,padding:"6px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT,textAlign:"center",transition:"all .12s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.danger;e.currentTarget.style.color=C.danger;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>Eliminar</button>
        </div>
      </div>
      {confirmDelete&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:FONT}} onClick={()=>setConfirmDelete(false)}>
          <div style={{background:C.surface,borderRadius:12,padding:"28px",width:"min(400px,92vw)",textAlign:"center",boxShadow:"0 8px 40px rgba(0,0,0,.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:44,height:44,borderRadius:"50%",background:C.danger+"12",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:20,color:C.danger}}>✕</div>
            <h3 style={{color:C.text,fontSize:17,fontWeight:700,margin:"0 0 8px"}}>¿Eliminar {post.tipo==="busqueda"?"búsqueda":"publicación"}?</h3>
            {ofertaAceptadaInfo&&<div style={{background:C.warn+"10",border:`1px solid ${C.warn}30`,borderRadius:8,padding:"10px 13px",marginBottom:12,fontSize:12,color:C.warn,textAlign:"left"}}>⚠️ <strong style={{color:C.text}}>{ofertaAceptadaInfo.nombre}</strong> tiene una oferta aceptada. Se le avisará.</div>}
            <p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:"0 0 22px"}}>Se eliminará <strong style={{color:C.text}}>"{post.titulo}"</strong> permanentemente.</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmDelete(false)} style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"10px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>Cancelar</button>
              <button onClick={handleConfirmDelete} disabled={loadingDelete} style={{flex:1,background:C.danger,border:"none",borderRadius:20,color:"#fff",padding:"10px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:FONT,opacity:loadingDelete?.6:1}}>{loadingDelete?"...":"Sí, eliminar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONTRAOFERTA MODAL ───────────────────────────────────────────────────────
function ContraofertaModal({oferta,miRol,session,onClose,onEnviada}){
  // miRol: "alumno" (dueño búsqueda) o "docente" (ofertante)
  const [precio,setPrecio]=useState("");
  const [tipo,setTipo]=useState(oferta.precio_tipo||"hora");
  const [msg,setMsg]=useState("");
  const [saving,setSaving]=useState(false);
  const enviar=async()=>{
    if(!precio)return;setSaving(true);
    try{
      await sb.updateOfertaBusq(oferta.id,{
        contraoferta_precio:parseFloat(precio),
        contraoferta_tipo:tipo,
        contraoferta_mensaje:msg,
        contraoferta_de:miRol,
        estado:"pendiente",
        leida:false,
      },session.access_token);
      // Notificar al otro
      const destinatario=miRol==="alumno"?oferta.ofertante_email:oferta.busqueda_autor_email;
      sb.insertNotificacion({usuario_id:null,alumno_email:destinatario,tipo:"contraoferta",publicacion_id:oferta.busqueda_id,pub_titulo:oferta.busqueda_titulo,leida:false},session.access_token).catch(()=>{});
      // Email al destinatario de la contraoferta
      const miNombreContra=sb.getDisplayName(session.user.email)||session.user.email.split("@")[0];
      sb.sendEmail("contraoferta",destinatario,{
        pub_titulo:oferta.busqueda_titulo,
        pub_id:oferta.busqueda_id,
        de_nombre:miNombreContra,
        mi_rol:miRol,
        precio_nuevo:precio,
        tipo_precio:tipo,
        mensaje:msg,
      },session.access_token).catch(()=>{});
      onEnviada();
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const iS={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:9};
  const precioActual=oferta.contraoferta_precio||oferta.precio;
  return(
    <Modal onClose={onClose} width="min(420px,96vw)">
      <div style={{padding:"22px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>Contraoferta</h3>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>×</button>
        </div>
        <div style={{background:C.card,borderRadius:9,padding:"10px 13px",marginBottom:14,fontSize:12,color:C.muted}}>
          {oferta.busqueda_titulo}
          {precioActual&&<div style={{color:C.accent,fontWeight:600,marginTop:3}}>Precio actual: {fmtPrice(precioActual)} /{oferta.contraoferta_tipo||oferta.precio_tipo||"hora"}</div>}
        </div>
        <Label>Tu propuesta de precio</Label>
        <div style={{display:"flex",gap:7,marginBottom:9}}>
          <input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Monto" type="number" min="0" style={{...iS,margin:0,flex:2}}/>
          <select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...iS,margin:0,flex:1,cursor:"pointer",colorScheme:localStorage.getItem("cl_theme")||"light"}}>
            <option value="hora">/ hora</option>
            <option value="clase">/ clase</option>
            <option value="mes">/ mes</option>
          </select>
        </div>
        <Label>Mensaje (opcional)</Label>
        <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Explicá tu propuesta..." style={{...iS,minHeight:75,resize:"vertical"}}/>
        <Btn onClick={enviar} disabled={saving||!precio} style={{width:"100%",padding:"10px"}}>{saving?"Enviando...":"Enviar contraoferta →"}</Btn>
      </div>
    </Modal>
  );
}

// ─── OFERTAS RECIBIDAS MODAL ───────────────────────────────────────────────────
function OfertasRecibidasModal({post,session,onClose,onContactar}){
  const [ofertas,setOfertas]=useState([]);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(null);
  const [acuerdoOferta,setAcuerdoOferta]=useState(null);
  const cargar=useCallback(async()=>{
    const all=await sb.getOfertasSobre(post.id,session.access_token);
    // Marcar como leídas en state local inmediatamente (borra el borde amarillo al instante)
    setOfertas(all.map(o=>({...o,leida:true})));
    setLoading(false);
    // Persistir en DB en background solo las que no estaban leídas
    all.filter(o=>!o.leida).forEach(o=>sb.updateOfertaBusq(o.id,{leida:true},session.access_token).catch(()=>{}));
  },[post.id,session]);
  useEffect(()=>{cargar();},[cargar]);
  const responder=async(o,estado)=>{
    setSaving(o.id);
    try{
      await sb.updateOfertaBusq(o.id,{estado,leida:true},session.access_token);
      if(estado==="aceptada"){
        await sb.updatePublicacion(post.id,{activo:false},session.access_token).catch(e=>console.warn("No se pudo desactivar busqueda:",e.message));
        sb.insertNotificacion({usuario_id:null,alumno_email:o.ofertante_email,tipo:"oferta_aceptada",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
        // Email al docente cuya oferta fue aceptada
        sb.sendEmail("oferta_aceptada",o.ofertante_email,{pub_titulo:post.titulo,pub_id:post.id,alumno_nombre:sb.getDisplayName(session.user.email)||session.user.email.split("@")[0]},session.access_token).catch(()=>{});
        const ofertaActualizada={...o,estado:"aceptada",busqueda_titulo:post.titulo,busqueda_autor_email:session.user.email};
        setAcuerdoOferta(ofertaActualizada);
        await cargar();
      } else {
        if(estado==="rechazada"){
          sb.insertNotificacion({usuario_id:null,alumno_email:o.ofertante_email,tipo:"oferta_rechazada",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
        }
        await cargar();
      }
    }finally{setSaving(null);}
  };
  const EB={pendiente:{c:C.accent,t:"Pendiente"},aceptada:{c:C.success,t:"✓ Aceptada"},rechazada:{c:C.danger,t:"✗ Rechazada"}};
  return(
    <>
    <Modal onClose={onClose} width="min(520px,97vw)">
      <div style={{padding:"20px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><div><h3 style={{color:C.text,margin:"0 0 3px",fontSize:16,fontWeight:700}}>Ofertas recibidas</h3><div style={{fontSize:12,color:C.muted}}>{post.titulo}</div></div><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button></div>
        {loading?<Spinner/>:ofertas.length===0?<div style={{color:C.muted,textAlign:"center",padding:"30px 0",fontSize:13}}>Sin ofertas aún.</div>:(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {ofertas.map(o=>{const eb=EB[o.estado||"pendiente"];
              const tieneContra=!!o.contraoferta_precio&&o.estado==="pendiente";
              const contraEsDeAlumno=o.contraoferta_de==="alumno";// yo soy alumno, si la contra es mía, el docente debe responder
              return(
              <div key={o.id} style={{background:C.card,border:`1px solid ${o.estado==="aceptada"?C.success:o.estado==="rechazada"?C.danger:(!o.leida?C.accent:C.border)}`,borderRadius:13,padding:"14px 16px"}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <Avatar letra={o.ofertante_nombre?.[0]||"?"} size={36}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                      <span style={{fontWeight:600,color:C.text,fontSize:13}}>{o.ofertante_nombre}</span>
                      <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:eb.c+"22",color:eb.c,border:`1px solid ${eb.c}44`}}>{eb.t}</span>
                      {tieneContra&&<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:"#C85CE015",color:"#C85CE0",border:"1px solid #C85CE033"}}>↔ Negociando</span>}
                    </div>
                    {/* Oferta original */}
                    {o.precio&&<div style={{fontSize:12,color:C.muted,marginBottom:2}}>Oferta: <span style={{color:C.accent,fontWeight:600}}>{fmtPrice(o.precio)} /{o.precio_tipo}</span></div>}
                    <p style={{color:C.muted,fontSize:12,margin:"0 0 8px",lineHeight:1.5}}>{o.mensaje}</p>
                    {/* Historial de negociación — línea de tiempo de precios */}
                    {(o.precio||o.contraoferta_precio)&&(
                      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:6,flexWrap:"wrap"}}>
                        {o.precio&&<span style={{fontSize:11,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"2px 7px",color:C.muted}}>Oferta: <span style={{color:C.text,fontWeight:600}}>{fmtPrice(o.precio)}/{o.precio_tipo}</span></span>}
                        {o.contraoferta_precio&&<><span style={{color:C.muted,fontSize:11}}>→</span><span style={{fontSize:11,background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:6,padding:"2px 7px",color:C.accent,fontWeight:600}}>Contra: {fmtPrice(o.contraoferta_precio)}/{o.contraoferta_tipo||o.precio_tipo}</span></>}
                        {o.acuerdo_confirmado&&o.precio&&<><span style={{color:C.muted,fontSize:11}}>→</span><span style={{fontSize:11,background:"#4ECB7115",border:"1px solid #4ECB7133",borderRadius:6,padding:"2px 7px",color:C.success,fontWeight:600}}>Acordado ✓</span></>}
                      </div>
                    )}
                    {/* Historial de contraoferta */}
                    {tieneContra&&(
                      <div style={{background:contraEsDeAlumno?"#C85CE011":"#F5C84211",border:`1px solid ${contraEsDeAlumno?"#C85CE033":"#F5C84233"}`,borderRadius:9,padding:"8px 11px",marginBottom:8}}>
                        <div style={{fontSize:10,fontWeight:700,color:contraEsDeAlumno?"#C85CE0":C.accent,marginBottom:3}}>
                          {contraEsDeAlumno?"Tu contraoferta":"Contraoferta del docente"}
                        </div>
                        <div style={{fontSize:12,color:C.accent,fontWeight:600}}>{fmtPrice(o.contraoferta_precio)} /{o.contraoferta_tipo||o.precio_tipo}</div>
                        <div style={{fontSize:12,color:C.muted,marginTop:2}}>{o.contraoferta_mensaje}</div>
                      </div>
                    )}
                    {o.estado==="pendiente"&&<div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                      <button onClick={()=>responder(o,"aceptada")} disabled={saving===o.id} style={{background:"#4ECB7122",border:"1px solid #4ECB7144",borderRadius:8,color:C.success,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>✓ Aceptar</button>
                      <button onClick={()=>{onContactar({id:post.id,autor_email:o.ofertante_email,titulo:post.titulo,autor_nombre:o.ofertante_nombre});onClose();}} disabled={saving===o.id} style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:8,color:C.accent,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>💬 Negociar</button>
                      <button onClick={()=>responder(o,"rechazada")} disabled={saving===o.id} style={{background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:8,color:C.danger,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>✗ Rechazar</button>
                      <span style={{fontSize:11,color:C.muted,alignSelf:"center"}}>{fmt(o.created_at)}</span>
                    </div>}
                    {o.estado==="aceptada"&&<div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                      <Btn onClick={()=>{onContactar({id:post.id,autor_email:o.ofertante_email,titulo:post.titulo,autor_nombre:o.ofertante_nombre});onClose();}} style={{padding:"6px 14px",fontSize:12}}>Chatear</Btn>
                      <button onClick={()=>setAcuerdoOferta({...o,busqueda_titulo:post.titulo,busqueda_autor_email:session.user.email})} style={{background:"#4ECB7115",border:"1px solid #4ECB7133",borderRadius:9,color:C.success,padding:"6px 13px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:700}}>
                        {o.acuerdo_confirmado?"✓ Ver acuerdo":"📋 Crear acuerdo"}
                      </button>
                    </div>}
                  </div>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>
    </Modal>
    {acuerdoOferta&&<AcuerdoModal oferta={acuerdoOferta} session={session} onClose={()=>setAcuerdoOferta(null)} onConfirmado={()=>{cargar();setAcuerdoOferta(null);}}/>}
    </>
  );
}

// ─── MY POSTS PAGE ─────────────────────────────────────────────────────────────
// Carga TODAS las publicaciones y filtra en cliente por autor_email
// Esto garantiza que se ven pausadas y finalizadas (igual que v13 que funcionaba)
function MyPostsPage({session,onEdit,onNew,onOpenCurso,onOpenChat,onRefreshOfertas}){
  const [posts,setPosts]=useState([]);const [loading,setLoading]=useState(true);const [toggling,setToggling]=useState(null);
  const [ofertasMap,setOfertasMap]=useState({});const [ofertasModal,setOfertasModal]=useState(null);
  const cargar=useCallback(async()=>{
    setLoading(true);
    try{
      const [d,ofertasRaw]=await Promise.all([
        sb.getMisPublicaciones(session.user.email,session.access_token),
        sb.getOfertasRecibidas(session.user.email,session.access_token)
      ]);
      setPosts(d||[]);
      const map={};ofertasRaw.forEach(o=>{map[o.busqueda_id]=(map[o.busqueda_id]||0)+1;});
      setOfertasMap(map);
    }finally{setLoading(false);}
  },[session]);
  useEffect(()=>{cargar();},[cargar]);
  const toggle=async(post)=>{if(post.activo===false&&post.estado_validacion==="pendiente")return;setToggling(post.id);try{await sb.updatePublicacion(post.id,{activo:post.activo===false},session.access_token);await cargar();}catch(e){alert("Error: "+e.message);}finally{setToggling(null);}};
  const remove=async(post)=>{await sb.deletePublicacion(post.id,session.access_token);cargar();};
  return(
    <div style={{fontFamily:FONT}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h2 style={{fontSize:20,color:C.text,margin:"0 0 3px",fontWeight:700}}>Mis publicaciones</h2><p style={{color:C.muted,fontSize:12,margin:0}}>{posts.length} publicación{posts.length!==1?"es":""}</p></div>
        <Btn onClick={onNew} style={{padding:"7px 13px",fontSize:12}}>+ Nueva</Btn>
      </div>
      {loading?<Spinner/>:posts.length===0?(
        <div style={{maxWidth:480,margin:"0 auto"}}>
          {/* Checklist guiado para docentes nuevos */}
          <div style={{background:`linear-gradient(135deg,${C.accentDim},${C.bg})`,border:`1px solid ${C.accent}33`,borderRadius:18,padding:"28px 28px 24px",marginBottom:16}}>
            <div style={{fontSize:28,marginBottom:10}}>👋</div>
            <div style={{fontWeight:800,color:C.text,fontSize:17,marginBottom:6}}>¡Bienvenido/a a Luderis!</div>
            <p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:"0 0 20px"}}>Seguí estos pasos para empezar a recibir alumnos.</p>
            {[
              {n:1,icon:"👤",label:"Completá tu perfil",sub:"Nombre, foto y bio generan más confianza.",done:true},
              {n:2,icon:"📢",label:"Publicá tu primera clase",sub:"Describí lo que enseñás, el precio y tu modalidad.",done:false,action:true},
              {n:3,icon:"🎓",label:"Conseguí tu primer alumno",sub:"Vas a recibir una notificación cuando alguien se inscriba.",done:false},
            ].map(s=>(
              <div key={s.n} style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:14,opacity:s.done||s.action?1:.55}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:s.done?C.success:s.action?C.accent:C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,color:s.done||s.action?"#fff":C.muted,fontWeight:700}}>
                  {s.done?"✓":s.n}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,color:C.text,fontSize:13,marginBottom:2}}>{s.icon} {s.label}</div>
                  <div style={{color:C.muted,fontSize:11,lineHeight:1.4}}>{s.sub}</div>
                  {s.action&&<button onClick={onNew} style={{marginTop:8,background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"7px 18px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 10px rgba(26,110,216,.25)"}}>Publicar ahora →</button>}
                </div>
              </div>
            ))}
          </div>
          <p style={{color:C.muted,fontSize:11,textAlign:"center"}}>¿Tenés dudas? Usá el chat de soporte en la esquina inferior derecha.</p>
        </div>
      ):(
        <div style={{display:"grid",gap:14}}>
          {posts.map(p=>(<div key={p.id}>
            <MyPostCard post={p} session={session} onEdit={onEdit} onToggle={toggle} onDelete={remove} onOpenCurso={onOpenCurso} toggling={toggling} ofertasPendientes={ofertasMap[p.id]||0}/>
            {ofertasMap[p.id]>0&&<button onClick={()=>setOfertasModal(p)} style={{width:"100%",marginTop:6,background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:9,color:C.accent,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT}}>Ver {ofertasMap[p.id]} oferta{ofertasMap[p.id]!==1?"s":""} nueva{ofertasMap[p.id]!==1?"s":""}</button>}
          </div>))}
        </div>
      )}
      {ofertasModal&&<OfertasRecibidasModal post={ofertasModal} session={session} onClose={()=>{setOfertasModal(null);cargar();if(onRefreshOfertas)onRefreshOfertas();}} onContactar={onOpenChat}/>}
    </div>
  );
}

// ─── FAVORITOS PAGE ───────────────────────────────────────────────────────────
function FavoritosPage({session,onOpenDetail,onOpenChat,onOpenPerfil}){
  const [posts,setPosts]=useState([]);const [loading,setLoading]=useState(true);const [filtroTipo,setFiltroTipo]=useState("all");
  useEffect(()=>{
    let mounted=true;
    sb.getFavoritos(session.user.email,session.access_token).then(async fs=>{
      if(!mounted)return;
      if(fs.length>0){const all=await sb.getPublicaciones({},session.access_token);if(mounted){const ids=new Set(fs.map(f=>f.publicacion_id));setPosts(all.filter(p=>ids.has(p.id)));}}
    }).finally(()=>{if(mounted)setLoading(false);});
    return()=>{mounted=false;};
  },[session]);
  const filtered=posts.filter(p=>filtroTipo==="all"||p.tipo===filtroTipo);
  return(
    <div style={{fontFamily:FONT}}>
      <h2 style={{fontSize:20,color:C.text,margin:"0 0 16px",fontWeight:700}}>Favoritos</h2>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {["all","busqueda","oferta"].map(t=>(<button key={t} onClick={()=>setFiltroTipo(t)} style={{background:filtroTipo===t?C.accent:C.surface,color:filtroTipo===t?"#fff":C.muted,border:`1px solid ${filtroTipo===t?C.accent:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{t==="all"?"Todo":t==="busqueda"?"Búsquedas":"Ofertas"}</button>))}
      </div>
      {loading?<Spinner/>:filtered.length===0?(<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,marginBottom:12}}>★</div><p style={{color:C.muted,fontSize:13}}>{posts.length===0?"No guardaste favoritos aún.":"Sin resultados."}</p></div>):(
        <div style={{display:"grid",gap:11}}>{filtered.map(p=><PostCard key={p.id} post={p} session={session} onOpenChat={onOpenChat} onOpenDetail={onOpenDetail} onOpenPerfil={onOpenPerfil}/>)}</div>
      )}
    </div>
  );
}

// ─── INSCRIPCIONES PAGE — con tiempo hasta inicio / hasta fin ─────────────────
function InscripcionesPage({session,onOpenCurso,onOpenChat,onMarkNotifsRead}){
  // Marcar notifs como leídas cuando el usuario cliquea una pub concreta, no al montar
  const [inscripciones,setInscripciones]=useState([]);const [posts,setPosts]=useState({});const [loading,setLoading]=useState(true);const [ayudantePubs,setAyudantePubs]=useState([]);
  const [clasesAcordadas,setClasesAcordadas]=useState([]);
  const [espacioActivo,setEspacioActivo]=useState(null);
  // notifs de tipo nuevo_ayudante no leídas, indexadas por publicacion_id
  const [ayudanteNotifs,setAyudanteNotifs]=useState({});
  // IDs de publicaciones recién notificadas (valorar_curso) sin leer
  const [pubsNotifPend,setPubsNotifPend]=useState(new Set());
  useEffect(()=>{
    const miEmail2=session.user.email;const miUid2=session.user.id;
    let mounted=true;
    Promise.all([
      sb.getMisInscripciones(miEmail2,session.access_token),
      sb.getPublicaciones({},session.access_token),
      sb.getMisOfertas(miEmail2,session.access_token).catch(()=>[]),
      sb.getOfertasAceptadasRecibidas(miEmail2,session.access_token).catch(()=>[]),
      sb.getNotificaciones(miEmail2,session.access_token).catch(()=>[]),
    ]).then(([ins,todasPubs,misOfertas,ofertasRecibidas,notifs])=>{
      if(!mounted)return;
      const insArr=ins||[];
      setInscripciones(insArr);
      const ids=[...new Set(insArr.map(i=>i.publicacion_id))];
      // ayudantes es uuid[] — comparar con UUID del usuario, no su email
      const ayudanteDe=todasPubs.filter(p=>(p.ayudantes||[]).includes(miUid2)&&!ids.includes(p.id));
      setAyudantePubs(ayudanteDe);
      const map={};
      todasPubs.filter(p=>ids.includes(p.id)||ayudanteDe.some(a=>a.id===p.id)).forEach(p=>map[p.id]=p);
      setPosts(map);
      const comoDocente=(misOfertas||[]).filter(o=>o.estado==="aceptada"&&!o.finalizada_cuenta).map(o=>({...o,_rol:"docente"}));
      const comoAlumno=(ofertasRecibidas||[]).filter(o=>!o.finalizada_cuenta).map(o=>({...o,_rol:"alumno"}));
      setClasesAcordadas([...comoDocente,...comoAlumno]);
      // Indexar notifs de nuevo_ayudante por publicacion_id
      const nMap={};
      (notifs||[]).filter(n=>n.tipo==="nuevo_ayudante").forEach(n=>{nMap[n.publicacion_id]=n;});
      setAyudanteNotifs(nMap);
      // Indexar IDs de publicaciones con notif de valorar_curso no leídas
      const pendSet=new Set();
      (notifs||[]).filter(n=>n.tipo==="valorar_curso"&&!n.leida).forEach(n=>{if(n.publicacion_id)pendSet.add(n.publicacion_id);});
      // También marcar clases acordadas recién aceptadas
      (notifs||[]).filter(n=>n.tipo==="busqueda_acordada"&&!n.leida).forEach(n=>{if(n.publicacion_id)pendSet.add(n.publicacion_id);});
      (notifs||[]).filter(n=>n.tipo==="nuevo_contenido"&&!n.leida).forEach(n=>{if(n.publicacion_id)pendSet.add(n.publicacion_id);});
      setPubsNotifPend(pendSet);
    }).finally(()=>{if(mounted)setLoading(false);});
    return()=>{mounted=false;};
  },[session]);

  // Marca la notif de ayudante de una pub como leída
  const marcarAyudanteLeida=async(pubId)=>{
    const n=ayudanteNotifs[pubId];
    if(!n)return;
    try{
      await sb.marcarNotifLeida(n.id,session.access_token);
      setAyudanteNotifs(prev=>{const next={...prev};delete next[pubId];return next;});
    }catch{}
  };

  const tiempoInfo=(p,ins)=>{
    if(!p)return null;
    const hoy=new Date();hoy.setHours(0,0,0,0);
    const ini=p.fecha_inicio?new Date(p.fecha_inicio):null;
    const fin=p.fecha_fin?new Date(p.fecha_fin):null;
    if(ini)ini.setHours(0,0,0,0);
    if(fin)fin.setHours(0,0,0,0);
    // Clase ya finalizada manualmente
    if(ins.clase_finalizada||p.finalizado)return{icon:"✓",texto:"Clase finalizada",color:C.success};
    // Todavía no empezó
    if(ini&&hoy<ini){
      const dias=Math.ceil((ini-hoy)/86400000);
      if(dias===0)return{icon:"🟢",texto:"Inicia hoy",color:C.success};
      if(dias===1)return{icon:"📅",texto:"Inicia mañana",color:C.info};
      return{icon:"📅",texto:`Inicia en ${dias} día${dias!==1?"s":""}`,color:C.info};
    }
    // Ya empezó — mostrar cuánto falta para terminar
    if(fin){
      const dias=Math.ceil((fin-hoy)/86400000);
      if(dias<0)return{icon:"·",texto:"Período finalizado",color:C.muted};
      if(dias===0)return{icon:"⚠️",texto:"Finaliza hoy",color:C.danger};
      if(dias===1)return{icon:"⏳",texto:"Finaliza mañana",color:C.warn};
      return{icon:"⏳",texto:`Finaliza en ${dias} día${dias!==1?"s":""}`,color:dias<=7?C.danger:dias<=30?C.warn:C.muted};
    }
    // Empezó pero sin fecha de fin
    if(ini&&hoy>=ini)return{icon:"🟢",texto:"En curso",color:C.success};
    return null;
  };

  const marcarNotifPubLeida=async(pubId)=>{
    if(!pubsNotifPend.has(pubId))return;
    try{
      await sb.marcarNotifsTipoLeidas(session.user.email,["valorar_curso","nuevo_ayudante","busqueda_acordada","nuevo_contenido"],session.access_token);
      setPubsNotifPend(prev=>{const next=new Set(prev);next.delete(pubId);return next;});
      if(onMarkNotifsRead)onMarkNotifsRead();
    }catch{}
  };

  const renderCard=(ins)=>{
    const p=posts[ins.publicacion_id];if(!p)return null;
    const finalizado=ins.clase_finalizada||!!p.finalizado;
    const ti=tiempoInfo(p,ins);
    const tieneNotif=pubsNotifPend.has(p.id);
    return(
      <div key={ins.id} style={{background:C.card,border:`1px solid ${tieneNotif?C.accent:C.border}`,borderRadius:14,padding:"14px 18px",display:"flex",gap:13,alignItems:"center",flexWrap:"wrap",transition:"border-color .15s"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=tieneNotif?C.accent:C.border}>
        <div onClick={()=>{marcarNotifPubLeida(p.id);onOpenCurso(p);}} style={{display:"flex",gap:12,alignItems:"center",flex:1,minWidth:0,cursor:"pointer"}}>
          <div style={{width:44,height:44,borderRadius:11,background:finalizado?"#4ECB7115":tieneNotif?C.accentDim:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,position:"relative"}}>
            {finalizado?"✓":"·"}
            {tieneNotif&&<span style={{position:"absolute",top:-4,right:-4,background:C.danger,color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>!</span>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titulo}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:3}}>{p.materia} · {p.autor_nombre||safeDisplayName(p.autor_nombre,p.autor_email)}</div>
            {tieneNotif&&<span style={{fontSize:11,color:C.accent,fontWeight:700}}>🔔 Clase finalizada — dejá tu reseña</span>}
            {!tieneNotif&&(ti?<span style={{fontSize:11,color:ti.color,fontWeight:600}}>{ti.icon} {ti.texto}</span>
              :<span style={{fontSize:11,color:C.muted}}>Inscripto {fmt(ins.created_at)}</span>)}
          </div>
        </div>
        <button onClick={()=>onOpenChat({id:p.id,autor_email:p.autor_email,titulo:p.titulo,autor_nombre:p.autor_nombre||safeDisplayName(p.autor_nombre,p.autor_email)})}
          style={{background:C.accent,color:"#fff",border:"none",borderRadius:9,padding:"7px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,flexShrink:0}}>
          Contactar
        </button>
      </div>
    );
  };

  const cursos=inscripciones.filter(i=>!posts[i.publicacion_id]||posts[i.publicacion_id]?.modo==="curso");
  const clases=inscripciones.filter(i=>posts[i.publicacion_id]&&posts[i.publicacion_id]?.modo!=="curso");

  return(
    <div style={{fontFamily:FONT}}>
      <h2 style={{fontSize:20,color:C.text,margin:"0 0 18px",fontWeight:700}}>Mis inscripciones</h2>
      {loading?<Spinner/>:inscripciones.length===0?null:(
        <>
          {cursos.length>0&&<>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:13,fontWeight:700,color:C.text}}>Cursos</span>
              <span style={{background:C.accentDim,color:C.accent,borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px"}}>{cursos.length}</span>
            </div>
            <div style={{display:"grid",gap:9,marginBottom:22}}>{cursos.map(renderCard)}</div>
          </>}
          {clases.length>0&&<>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:13,fontWeight:700,color:C.text}}>Clases particulares</span>
              <span style={{background:"#4ECB7115",color:C.success,borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px"}}>{clases.length}</span>
            </div>
            <div style={{display:"grid",gap:9}}>{clases.map(renderCard)}</div>
          </>}
        </>
      )}
      {/* ── Cursos donde soy ayudante ── */}
      {ayudantePubs.length>0&&(
        <div style={{marginTop:inscripciones.length>0?28:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:13,fontWeight:700,color:C.text}}>Soy ayudante</span>
            <span style={{background:"#C85CE015",color:C.purple,borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px",border:"1px solid #C85CE033"}}>{ayudantePubs.length}</span>
          </div>
          <div style={{display:"grid",gap:9}}>
            {ayudantePubs.map(p=>{
              const tieneNotif=!!ayudanteNotifs[p.id];
              return(
              <div key={p.id} style={{background:C.card,border:`1px solid ${tieneNotif?"#C85CE088":"#C85CE033"}`,borderRadius:14,padding:"14px 18px",display:"flex",gap:13,alignItems:"center",flexWrap:"wrap",cursor:"pointer",transition:"border-color .15s",position:"relative"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.purple} onMouseLeave={e=>e.currentTarget.style.borderColor=tieneNotif?"#C85CE088":"#C85CE033"}
                onClick={()=>{marcarAyudanteLeida(p.id);onOpenCurso(p);}}>
                {tieneNotif&&(
                  <div style={{position:"absolute",top:10,right:12,background:C.purple,color:"#fff",borderRadius:20,fontSize:9,fontWeight:700,padding:"2px 7px",letterSpacing:.5}}>
                    🔔 Nuevo
                  </div>
                )}
                <div style={{width:44,height:44,borderRadius:11,background:"#C85CE015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>✦</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",padding:"2px 7px",borderRadius:10,background:p.modo==="particular"?"#5CA8E015":"#4ECB7115",color:p.modo==="particular"?C.info:C.success,border:`1px solid ${p.modo==="particular"?"#5CA8E033":"#4ECB7133"}`}}>{p.modo==="particular"?"Clase particular":"Curso"}</span>
                  {p.sinc&&p.modo!=="particular"&&<span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:10,background:C.surface,color:C.muted,border:`1px solid ${C.border}`}}>{p.sinc==="sinc"?"Sincrónico":"Asincrónico"}</span>}
                </div>
                <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titulo}</div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:3}}>{p.materia} · {p.autor_nombre||safeDisplayName(p.autor_nombre,p.autor_email)}</div>
                  <span style={{fontSize:11,color:C.purple,fontWeight:600}}>✦ Sos ayudante</span>
                </div>
                <button onClick={e=>{e.stopPropagation();marcarAyudanteLeida(p.id);onOpenCurso(p);}} style={{background:"#C85CE022",border:"1px solid #C85CE044",borderRadius:9,color:C.purple,padding:"7px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,flexShrink:0}}>Ver contenido →</button>
              </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Clases acordadas */}
      {clasesAcordadas.length>0&&(
        <div style={{marginTop:inscripciones.length>0||ayudantePubs.length>0?28:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:13,fontWeight:700,color:C.text}}>Clases particulares acordadas</span>
            <span style={{background:"#4ECB7115",color:C.success,borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px",border:"1px solid #4ECB7133"}}>{clasesAcordadas.length}</span>
          </div>
          <div style={{display:"grid",gap:9}}>
            {clasesAcordadas.map(o=>{
              const soyDoc=o._rol==="docente";
              const otroN=soyDoc?(o.busqueda_autor_nombre||safeDisplayName(o.busqueda_autor_nombre,o.busqueda_autor_email)):(o.ofertante_nombre||safeDisplayName(o.ofertante_nombre,o.ofertante_email));
              return(
                <div key={o.id} onClick={()=>setEspacioActivo(o)} style={{background:C.card,border:"1px solid #4ECB7133",borderRadius:14,padding:"14px 18px",display:"flex",gap:13,alignItems:"center",cursor:"pointer",transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.success} onMouseLeave={e=>e.currentTarget.style.borderColor="#4ECB7133"}>
                  <div style={{width:44,height:44,borderRadius:11,background:"#4ECB7115",border:"1px solid #4ECB7133",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:C.success,fontWeight:700,flexShrink:0}}>{soyDoc?"✦":"◈"}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.busqueda_titulo||"Clase particular"}</div>
                    <div style={{fontSize:12,color:C.muted,marginBottom:4}}>{soyDoc?"Alumno":"Docente"}: <span style={{color:C.text,fontWeight:600}}>{otroN}</span></div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,background:"#4ECB7115",color:C.success,border:"1px solid #4ECB7133",borderRadius:20,padding:"1px 8px",fontWeight:700}}>Acordada</span>
                      {soyDoc&&<span style={{fontSize:11,background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}33`,borderRadius:20,padding:"1px 8px",fontWeight:600}}>Sos el docente</span>}
                      {o.precio&&<span style={{fontSize:11,color:C.muted}}>{fmtPrice(o.precio)}/{o.precio_tipo||"hora"}</span>}
                    </div>
                  </div>
                  <span style={{fontSize:12,color:C.success,fontWeight:700,flexShrink:0}}>Entrar →</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {inscripciones.length===0&&ayudantePubs.length===0&&clasesAcordadas.length===0&&!loading&&(
        <div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:36,marginBottom:12,color:C.border}}>◎</div><p style={{color:C.muted,fontSize:13}}>No estás inscripto en ningún curso ni clase.</p></div>
      )}
      {espacioActivo&&<EspacioClaseModal oferta={espacioActivo} session={session} onClose={()=>setEspacioActivo(null)}/>}
    </div>
  );
}

// ─── CHATS PAGE — título real de la publicación (sin "Conversación") ───────────
function ChatsPage({session,onOpenChat}){
  const [grupos,setGrupos]=useState([]);const [loading,setLoading]=useState(true);
  const [nombresMap,setNombresMap]=useState({});
  const miEmail=session.user.email;
  const {confirm,confirmEl}=useConfirm();

  const cargar=()=>{
    setLoading(true);
    sb.getMisChats(miEmail,session.access_token).then(async msgs=>{
      msgs=msgs.filter(m=>m.para_nombre!=="__grupo__"&&m.de_nombre!=="__grupo__");
      const pubMap={};
      msgs.forEach(m=>{
        const otro=m.de_nombre===miEmail?m.para_nombre:m.de_nombre;
        const pKey=m.publicacion_id||"sin-pub";
        if(!pubMap[pKey])pubMap[pKey]={pubId:m.publicacion_id,pubTitulo:m.pub_titulo||"",chats:{},lastTime:m.created_at};
        if(!pubMap[pKey].pubTitulo&&m.pub_titulo)pubMap[pKey].pubTitulo=m.pub_titulo;
        const cKey=otro;
        if(!pubMap[pKey].chats[cKey])pubMap[pKey].chats[cKey]={otro,ultimo:m,unread:0};
        else if(m.created_at>pubMap[pKey].chats[cKey].ultimo.created_at)pubMap[pKey].chats[cKey].ultimo=m;
        if(m.de_nombre!==miEmail&&!m.leido)pubMap[pKey].chats[cKey].unread++;
        if(m.created_at>pubMap[pKey].lastTime)pubMap[pKey].lastTime=m.created_at;
      });
      // Fetch pub titles
      const sinTitulo=Object.values(pubMap).filter(g=>g.pubId&&!g.pubTitulo);
      if(sinTitulo.length>0){
        try{const allPubs=await sb.getPublicaciones({},session.access_token);const pubById={};allPubs.forEach(p=>{pubById[p.id]=p.titulo;});sinTitulo.forEach(g=>{if(pubById[g.pubId])g.pubTitulo=pubById[g.pubId];});}catch{}
      }
      // Fetch display names for all "otro" emails
      const otroEmails=[...new Set(Object.values(pubMap).flatMap(g=>Object.values(g.chats).map(c=>c.otro)))];
      const nMap={};
      await Promise.all(otroEmails.map(async email=>{
        try{const u=await sb.getUsuarioByEmail(email,session.access_token);nMap[email]=u?.nombre||u?.display_name||email.split("@")[0];}catch{nMap[email]=email.split("@")[0];}
      }));
      setNombresMap(nMap);
      setGrupos(Object.values(pubMap).sort((a,b)=>new Date(b.lastTime)-new Date(a.lastTime)));
    }).finally(()=>setLoading(false));
  };

  useEffect(()=>{
    let active=true;
    setLoading(true);
    sb.getMisChats(miEmail,session.access_token).then(async msgs=>{
      if(!active)return;
      msgs=msgs.filter(m=>m.para_nombre!=="__grupo__"&&m.de_nombre!=="__grupo__");
      const pubMap={};
      msgs.forEach(m=>{const otro=m.de_nombre===miEmail?m.para_nombre:m.de_nombre;const pKey=m.publicacion_id||"sin-pub";if(!pubMap[pKey])pubMap[pKey]={pubId:m.publicacion_id,pubTitulo:m.pub_titulo||"",chats:{},lastTime:m.created_at};if(!pubMap[pKey].pubTitulo&&m.pub_titulo)pubMap[pKey].pubTitulo=m.pub_titulo;const cKey=otro;if(!pubMap[pKey].chats[cKey])pubMap[pKey].chats[cKey]={otro,ultimo:m,unread:0};else if(m.created_at>pubMap[pKey].chats[cKey].ultimo.created_at)pubMap[pKey].chats[cKey].ultimo=m;if(m.de_nombre!==miEmail&&!m.leido)pubMap[pKey].chats[cKey].unread++;if(m.created_at>pubMap[pKey].lastTime)pubMap[pKey].lastTime=m.created_at;});
      const sinTitulo=Object.values(pubMap).filter(g=>g.pubId&&!g.pubTitulo);
      if(sinTitulo.length>0){try{const allPubs=await sb.getPublicaciones({},session.access_token);const pubById={};allPubs.forEach(p=>{pubById[p.id]=p.titulo;});sinTitulo.forEach(g=>{if(pubById[g.pubId])g.pubTitulo=pubById[g.pubId];});}catch{}}
      const otroEmails=[...new Set(Object.values(pubMap).flatMap(g=>Object.values(g.chats).map(c=>c.otro)))];
      const nMap={};await Promise.all(otroEmails.map(async email=>{try{const u=await sb.getUsuarioByEmail(email,session.access_token);nMap[email]=u?.nombre||u?.display_name||email.split("@")[0];}catch{nMap[email]=email.split("@")[0];}}));
      if(!active)return;
      setNombresMap(nMap);setGrupos(Object.values(pubMap).sort((a,b)=>new Date(b.lastTime)-new Date(a.lastTime)));
    }).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[miEmail,session.access_token]);// eslint-disable-line

  const borrarChat=async(pubId,otroEmail,e)=>{
    e.stopPropagation();
    if(!await confirm({msg:"¿Borrar esta conversación? Se eliminarán todos los mensajes.",confirmLabel:"Borrar",danger:true}))return;
    try{
      // Use admin-actions edge function which has service role to bypass RLS
      const res=await fetch("https://hptdyehzqfpgtrpuydny.supabase.co/functions/v1/admin-actions",{
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g","x-user-token":session.access_token},
        body:JSON.stringify({action:"borrar_chat",pub_id:pubId,email_a:miEmail,email_b:otroEmail})
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Error al borrar");
      cargar();
    }catch(err){toast("Error al borrar: "+err.message,"error");}
  };

  const getNombre=(email)=>nombresMap[email]||email.split("@")[0];

  return(
    <div style={{fontFamily:FONT}}>
      {confirmEl}
      <h2 style={{fontSize:20,color:C.text,margin:"0 0 16px",fontWeight:700}}>Mis chats</h2>
      {loading?<Spinner/>:grupos.length===0?(<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,marginBottom:12,color:C.border}}>◻</div><p style={{color:C.muted,fontSize:13,marginBottom:8}}>No iniciaste ninguna conversación.</p><p style={{color:C.muted,fontSize:12}}>Inscribite en una clase o que acepten tu oferta para poder chatear.</p></div>):(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {grupos.map((g,gi)=>(
            <div key={gi}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{height:1,flex:1,background:C.border}}/>
                <span style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.5,whiteSpace:"nowrap",maxWidth:"70%",overflow:"hidden",textOverflow:"ellipsis"}}>{g.pubTitulo||"Sin título"}</span>
                <div style={{height:1,flex:1,background:C.border}}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {Object.values(g.chats).sort((a,b)=>new Date(b.ultimo.created_at)-new Date(a.ultimo.created_at)).map((c,i)=>(
                  <div key={i} style={{background:C.card,border:`1px solid ${c.unread>0?C.accent:C.border}`,borderRadius:13,padding:"11px 15px",display:"flex",alignItems:"center",gap:11,position:"relative"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=c.unread>0?C.accent:C.border}>
                    <div onClick={()=>onOpenChat({id:g.pubId,autor_email:c.otro,titulo:g.pubTitulo,autor_nombre:getNombre(c.otro)})} style={{display:"flex",alignItems:"center",gap:11,flex:1,minWidth:0,cursor:"pointer"}}>
                      <Avatar letra={getNombre(c.otro)[0]} size={34}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:1}}>{getNombre(c.otro)}</div>
                        <div style={{color:C.muted,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                          <span style={{color:c.ultimo.de_nombre===miEmail?C.accent:C.text,fontWeight:600,fontSize:11}}>{c.ultimo.de_nombre===miEmail?"Vos":getNombre(c.otro)}: </span>
                          {c.ultimo.texto}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                      {c.unread>0&&<span style={{background:C.accent,color:"#fff",borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 7px"}}>{c.unread} nuevo{c.unread!==1?"s":""}</span>}
                      <button onClick={(e)=>borrarChat(g.pubId,c.otro,e)}
                        style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,fontSize:12,padding:"3px 8px",cursor:"pointer",fontFamily:FONT,flexShrink:0,transition:"all .12s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.danger;e.currentTarget.style.color=C.danger;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function FinalizarClaseModal({post,session,onClose,onFinalizado}){
  const [inscripciones,setInscripciones]=useState([]);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);
  useEffect(()=>{
    let mounted=true;
    sb.getInscripciones(post.id,session.access_token)
      .then(ins=>{if(mounted)setInscripciones(ins.filter(i=>!i.clase_finalizada));})
      .finally(()=>{if(mounted)setLoading(false);});
    return()=>{mounted=false;};
  },[post.id,session.access_token]);// eslint-disable-line
  const finalizar=async()=>{setSaving(true);try{
    await sb.updatePublicacion(post.id,{finalizado:true},session.access_token);// no silenciar — si falla, no marcar inscripciones
    await Promise.all(inscripciones.map(ins=>sb.updateInscripcion(ins.id,{clase_finalizada:true,fecha_finalizacion:new Date().toISOString()},session.access_token)));
    await Promise.all(inscripciones.map(ins=>sb.insertNotificacion({usuario_id:ins.alumno_id||null,alumno_email:ins.alumno_email,tipo:"valorar_curso",publicacion_id:post.id,pub_titulo:post.titulo,leida:false}).catch(()=>{})));
    onFinalizado();onClose();
  }catch(e){alert("Error al finalizar: "+e.message);}finally{setSaving(false);}};
  return(
    <Modal onClose={onClose} width="min(420px,95vw)">
      <div style={{padding:"20px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>Marcar clases finalizadas</h3><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button></div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",marginBottom:14,fontSize:12,color:C.muted}}>Publicación: <span style={{color:C.text,fontWeight:600}}>{post.titulo}</span></div>
        {loading?<Spinner/>:inscripciones.length===0?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No hay alumnos con clase pendiente.</div>:(
          <><div style={{color:C.muted,fontSize:13,marginBottom:12}}>Se notificará a <strong style={{color:C.text}}>{inscripciones.length} alumno{inscripciones.length!==1?"s":""}</strong>.</div>
          <Btn onClick={finalizar} disabled={saving} variant="success" style={{width:"100%",padding:"10px"}}>{saving?"Procesando...":"Confirmar"}</Btn></>
        )}
      </div>
    </Modal>
  );
}


// CursoPage ecosystem — lazy loaded (solo se descarga al abrir un curso)
const CursoPage = React.lazy(() => import('./CursoPage'));


// ─── LAZY IMPORTS ─────────────────────────────────────────────────────────────
const DetailModal    = React.lazy(() => import('./DetailModal'));
const PostFormModal  = React.lazy(() => import('./PostFormModal'));
const OnboardingModal= React.lazy(() => import('./OnboardingModal'));
const MiCuentaPage   = React.lazy(() => import('./MiCuentaPage'));

// Named exports from PostFormModal bundle
const PerfilPage     = React.lazy(() => import('./PostFormModal').then(m => ({ default: m.PerfilPage })));

function NotifPanel({session,open,onClose,onOpenDetail,onOpenCurso}){
  const [notifs,setNotifs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("todas");

  const autoMarkTimer=useRef(null);
  useEffect(()=>{
    if(!open)return;
    setLoading(true);
    // Cargar TODAS las notifs (no solo sin leer) para el panel
    sb.getTodasNotificaciones(session.user.email,session.access_token).then(data=>{
      setNotifs((data||[]).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)));
      // Auto-marcar como leídas después de 2s (el usuario ya las vio)
      autoMarkTimer.current=setTimeout(()=>{
        sb.marcarTodasNotifsLeidas(session.user.email,session.access_token).catch(()=>{});
        setNotifs(p=>p.map(n=>({...n,leida:true})));
      },2000);
    }).catch(()=>{}).finally(()=>setLoading(false));
    return()=>clearTimeout(autoMarkTimer.current);
  },[open,session.user.email,session.access_token]);

  const marcarTodo=async()=>{
    clearTimeout(autoMarkTimer.current);
    await sb.marcarTodasNotifsLeidas(session.user.email,session.access_token).catch(()=>{});
    setNotifs(p=>p.map(n=>({...n,leida:true})));
  };

  const TIPO_INFO={
    nueva_inscripcion:{icon:"🎓",color:"#2EC4A0",label:"Nueva inscripción"},
    nueva_oferta:{icon:"📩",color:"#1A6ED8",label:"Nueva oferta"},
    oferta_aceptada:{icon:"✅",color:"#2EC4A0",label:"Oferta aceptada"},
    oferta_rechazada:{icon:"❌",color:"#E53E3E",label:"Oferta rechazada"},
    contraoferta:{icon:"🔄",color:"#F59E0B",label:"Contraoferta"},
    nuevo_mensaje:{icon:"💬",color:"#7B3FBE",label:"Mensaje nuevo"},
    chat_grupal:{icon:"💬",color:"#1A6ED8",label:"Mensaje en grupo"},
    clase_iniciada:{icon:"📹",color:"#C80000",label:"¡Clase en vivo!"},
    nuevo_contenido:{icon:"📚",color:"#1A6ED8",label:"Nuevo contenido"},
    nuevo_ayudante:{icon:"🤝",color:"#2EC4A0",label:"Co-docente agregado"},
    valorar_curso:{icon:"⭐",color:"#F59E0B",label:"Valorar curso"},
    alerta_publicacion:{icon:"🔔",color:"#1A6ED8",label:"Alerta de búsqueda"},
    pago_aprobado_mp:{icon:"💳",color:"#009EE3",label:"Pago aprobado"},
    sistema:{icon:"📣",color:"#7B3FBE",label:"Anuncio de Luderis"},
  };

  const tabs=[
    {id:"todas",label:"Todas"},
    {id:"noLeidas",label:"Sin leer"},
  ];

  const filtradas=notifs.filter(n=>tab==="noLeidas"?!n.leida:true);
  const sinLeer=notifs.filter(n=>!n.leida).length;

  if(!open)return null;
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:498}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:"min(380px,100vw)",background:C.surface,borderLeft:`1px solid ${C.border}`,zIndex:499,display:"flex",flexDirection:"column",boxShadow:"-4px 0 24px rgba(0,0,0,.12)",animation:"slideInRight .2s ease",fontFamily:FONT}}>
        <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{padding:"18px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div style={{fontWeight:700,color:C.text,fontSize:17}}>🔔 Notificaciones</div>
            {sinLeer>0&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{sinLeer} sin leer</div>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {sinLeer>0&&<button onClick={marcarTodo} style={{background:"none",border:"none",color:C.accent,fontSize:12,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>Marcar todo leído</button>}
            <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:1,padding:"10px",border:"none",background:"none",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:tab===t.id?700:400,color:tab===t.id?C.accent:C.muted,borderBottom:`2px solid ${tab===t.id?C.accent:"transparent"}`,marginBottom:-1,transition:"all .15s"}}>
              {t.label}{t.id==="noLeidas"&&sinLeer>0?` (${sinLeer})`:""}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          {loading?<Spinner/>:filtradas.length===0?(
            <div style={{textAlign:"center",padding:"48px 24px"}}>
              <div style={{fontSize:40,marginBottom:12}}>🔔</div>
              <div style={{color:C.muted,fontSize:14}}>{tab==="noLeidas"?"Todo leído ✓":"Sin notificaciones aún"}</div>
            </div>
          ):(
            filtradas.map((n,i)=>{
              const info=TIPO_INFO[n.tipo]||{icon:"📌",color:C.muted,label:n.tipo};
              return(
                <div key={n.id||i}
                  onClick={()=>{
                    if(n.publicacion_id){
                      // Marcar como leída
                      sb.db(`notificaciones?id=eq.${n.id}`,"PATCH",{leida:true},session.access_token,"return=minimal").catch(()=>{});
                      setNotifs(p=>p.map(x=>x.id===n.id?{...x,leida:true}:x));
                      onClose();
                      // Navegar a la publicación
                    }
                  }}
                  style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,cursor:n.publicacion_id?"pointer":"default",background:n.leida?"transparent":C.accentDim+"80",display:"flex",gap:12,alignItems:"flex-start",transition:"background .12s"}}
                  onMouseEnter={e=>{if(n.publicacion_id)e.currentTarget.style.background=C.bg;}}
                  onMouseLeave={e=>e.currentTarget.style.background=n.leida?"transparent":C.accentDim+"80"}>
                  {/* Icono */}
                  <div style={{width:40,height:40,borderRadius:"50%",background:info.color+"18",border:`1px solid ${info.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                    {info.icon}
                  </div>
                  {/* Contenido */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:n.leida?400:700,color:C.text,fontSize:13,marginBottom:2}}>{info.label}</div>
                    <div style={{fontSize:12,color:C.muted,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.pub_titulo||""}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:4}}>{fmtRel(n.created_at)}</div>
                  </div>
                  {!n.leida&&<div style={{width:8,height:8,borderRadius:"50%",background:C.accent,flexShrink:0,marginTop:4}}/>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

function ScrollToTopBtn(){
  const [visible,setVisible]=useState(false);
  useEffect(()=>{
    const el=document.getElementById("app-main-scroll")||window;
    const onScroll=()=>setVisible((el.scrollTop||window.scrollY||0)>400);
    el.addEventListener("scroll",onScroll,{passive:true});
    return()=>el.removeEventListener("scroll",onScroll);
  },[]);
  if(!visible)return null;
  return(
    <button onClick={()=>{const el=document.getElementById("app-main-scroll");if(el)el.scrollTo({top:0,behavior:"smooth"});else window.scrollTo({top:0,behavior:"smooth"});}}
      style={{position:"fixed",bottom:80,right:16,width:40,height:40,borderRadius:"50%",background:LUD.grad,border:"none",color:"#fff",fontSize:18,cursor:"pointer",boxShadow:"0 4px 14px rgba(26,110,216,.35)",zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",transition:"opacity .2s",fontFamily:FONT,animation:"fadeUp .2s ease"}}
      title="Volver arriba">↑</button>
  );
}

function ChatBotWidget(){
  const [open,setOpen]=useState(false);const [msgs,setMsgs]=useState([{from:"bot",text:"¡Hola! 👋 Soy el asistente de ClasseLink. ¿En qué puedo ayudarte?"}]);
  const [input,setInput]=useState("");const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{if(open)endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,open]);
  const FAQS=[
    {q:"¿Cómo me inscribo a un curso?",a:"Abrí la publicación del curso y hacé clic en 'Ver curso'. Dentro de la página del curso encontrás el botón 'Inscribirme'. Con eso tendrás acceso a todo el contenido al instante.",tags:["inscrib","curso","acceso","unirme","anotarme"]},
    {q:"¿Cómo publico una clase o curso?",a:"Hacé clic en '+ Nueva publicación' en el menú lateral o en el botón '+ Publicar' arriba. Elegí si ofrecés clases (docente) o buscás clases (alumno), completá los datos y publicá.",tags:["public","ofrec","creo","nueva","anunci"]},
    {q:"¿Cómo verifico mi perfil?",a:"Al crear una publicación de oferta, el sistema te hace una pregunta sobre tu materia con IA. Si respondés correctamente, obtenés la insignia ✓ Verificado que da más confianza a los alumnos.",tags:["verific","insignia","confianza","validar"]},
    {q:"¿Cómo contacto a un docente?",a:"Para chatear con un docente necesitás estar inscripto en su clase. Una vez inscripto, aparece el botón '💬 Iniciar conversación' en la publicación.",tags:["contact","chat","mensaje","hablar","escribir","docente"]},
    {q:"¿Cómo finalizo una clase?",a:"Entrá a tu publicación desde Mi cuenta → Contenido → botón 'Finalizar clase' (verde) en la barra de arriba. Esto notifica a todos los inscriptos para que puedan valorarte.",tags:["finaliz","terminar","cerrar","complet"]},
    {q:"¿Cómo dejo una reseña?",a:"Las reseñas se habilitan cuando el docente finaliza las clases. Entrá al curso y en la parte inferior verás la sección para calificar con estrellas y escribir tu opinión.",tags:["reseña","opinión","valorar","calific","estrellas","puntaje"]},
    {q:"¿Cómo funciona el sistema de ofertas?",a:"Publicá una búsqueda explicando qué necesitás aprender. Los docentes interesados te envían ofertas con su precio y mensaje. Desde Mi cuenta podés aceptar o rechazar cada una.",tags:["oferta","busqueda","busco","propuest","sistem","recib"]},
    {q:"¿Cómo veo el perfil de un docente?",a:"Hacé clic en el nombre o avatar del docente en cualquier publicación o card. Verás su perfil completo con credenciales, historial de publicaciones y reseñas recibidas.",tags:["perfil","docente","ver","quien","credencial","historial"]},
    {q:"¿Puedo chatear sin estar inscripto?",a:"No, el chat individual está disponible solo si estás inscripto en la clase del docente, o si el docente aceptó tu oferta de búsqueda. También hay un chat grupal dentro de cada curso para inscriptos.",tags:["chatear","sin inscrib","acceso chat","hablar sin"]},
    {q:"¿Cómo agrego favoritos?",a:"En cada publicación de la lista hay un botón ★. Hacé clic para guardar. Podés ver todos tus favoritos en la sección 'Favoritos' del menú lateral.",tags:["favorit","guardar","★","star","lista"]},
    {q:"¿Cómo cambio mi nombre visible?",a:"Andá a Mi cuenta → 'Editar perfil' → campo 'Nombre visible'. Ese nombre se mostrará en chats, reseñas y publicaciones.",tags:["nombre","display","cambiar","editar perfil","apodo"]},
    {q:"¿Cómo funciona el chat grupal?",a:"Cada curso tiene un chat grupal visible para todos los inscriptos y el docente. Aparece dentro de la página del curso, abajo del contenido. El docente puede designar ayudantes que también tienen acceso especial.",tags:["grupal","grupo","chat curso","todos","ayudante"]},
    {q:"¿Cómo cierro las inscripciones?",a:"Desde la página de tu curso (Mi cuenta → Contenido), usá el botón naranja 'Cerrar inscripciones' en la barra superior. Los alumnos ya inscriptos mantienen su acceso.",tags:["cerrar inscripciones","cupo","no más inscrib"]},
    {q:"¿Cómo agrego a un ayudante?",a:"Dentro de la página del curso, en el panel 'Alumnos', hay una sección 'Ayudantes'. Ingresá el ID del usuario (lo encuentra en su Mi cuenta → Editar perfil) y agregalo. Tendrá acceso de edición y color especial en el chat.",tags:["ayudante","asistente","colaborad","agregar ayud"]},
    {q:"¿Hay costo por usar ClasseLink?",a:"ClasseLink es gratuito para alumnos y docentes. El precio lo fija cada docente en su publicación y lo arreglan directamente.",tags:["costo","gratis","precio","pago","cobro","cuánto"]},
  ];
  // Matching mejorado: busca por tags y keywords
  const matchFaq=(q)=>{
    const ql=q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
    // Buscar por tags primero
    let best=null;let bestScore=0;
    for(const f of FAQS){
      let score=0;
      for(const tag of (f.tags||[])){
        if(ql.includes(tag.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")))score+=2;
      }
      // Buscar palabras de la pregunta
      const words=f.q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").split(" ").filter(w=>w.length>3);
      for(const w of words){if(ql.includes(w))score+=1;}
      if(score>bestScore){bestScore=score;best=f;}
    }
    return bestScore>=2?best:null;
  };
  const QUICK_ACTIONS=[
    {label:"¿Cómo me inscribo?",q:"¿Cómo me inscribo a un curso?"},
    {label:"¿Cómo publico?",q:"¿Cómo publico una clase?"},
    {label:"¿Cómo verifico mi perfil?",q:"¿Cómo verifico mi perfil?"},
    {label:"¿Cómo funciona el quiz?",q:"¿Cómo funciona el sistema de exámenes/quizzes?"},
    {label:"¿Cómo contacto al docente?",q:"¿Cómo contacto a un docente?"},
    {label:"¿Cómo cambio mi nombre?",q:"¿Cómo cambio mi nombre visible?"},
  ];
  const handleQuick=(quickQ)=>{setInput(quickQ);setTimeout(()=>sendMsg(quickQ),50);};
  const sendMsg=async(overrideQ)=>{
    const q=(overrideQ||input).trim();if(!q)return;
    setInput("");
    setMsgs(prev=>[...prev,{from:"user",text:q}]);
    setLoading(true);
    // Check FAQs first
    const faq=matchFaq(q);
    if(faq){setTimeout(()=>{setMsgs(prev=>[...prev,{from:"bot",text:faq.a}]);setLoading(false);},600);return;}
    // Use AI
    try{
      const SYSTEM_CHATBOT=`Sos el asistente de soporte de ClasseLink, una plataforma educativa argentina que conecta docentes y estudiantes.\n\nFUNCIONES PRINCIPALES:\n- Explorar: ver publicaciones de clases y búsquedas. Botón ✦ IA para búsqueda inteligente.\n- Publicar: botón "+ Publicar". Elegís "Busco clases" o "Ofrezco clases". Los docentes se verifican respondiendo una pregunta de IA sobre su tema.\n- Inscripción: abrís una publicación → Ver curso → Inscribirme.\n- Chat: disponible si estás inscripto o si el docente aceptó tu oferta.\n- Favoritos: botón ★ en cada publicación.\n- Ofertas: en búsquedas podés ofertar tus clases con precio y mensaje.\n- Quiz/Exámenes: en la página del curso, tab "Exámenes". Multiple choice (nota automática) o Entregable (corregido por docente).\n- Notas: tab "Notas" en el curso. Los alumnos ven sus notas, docentes ven tabla completa.\n- Verificación: los docentes suman badge ✓ respondiendo una pregunta de IA al publicar.\n- Mi cuenta: gestionar publicaciones, ver estadísticas, editar perfil y bio.\n- Modo oscuro/claro: Mi cuenta → Editar perfil → botones Tema.\n\nRespondé en español, de forma breve y amable. Si no podés resolver el problema en 2 intentos, sugerí contactar al soporte por WhatsApp.`;
      const text=await sb.callIA(SYSTEM_CHATBOT,q,350,"").catch(()=>"Lo siento, el asistente no está disponible en este momento.");
      // Mostrar siempre la opción de contacto humano junto a la respuesta de IA
      setMsgs(prev=>[...prev,{from:"bot",text:text},{from:"bot",text:"¿Necesitás ayuda de una persona?",action:true}]);
    }catch{
      setMsgs(prev=>[...prev,{from:"bot",text:"Lo siento, no pude procesar tu consulta en este momento."},{from:"bot",text:"Podés hablar con un representante:",action:true}]);
    }finally{setLoading(false);}
  };
  const openWhatsApp=()=>window.open("https://wa.me/5492345459787?text=Hola,%20necesito%20ayuda%20con%20ClasseLink","_blank","noopener,noreferrer");
  return(
    <div style={{position:"fixed",bottom:22,right:22,zIndex:500,fontFamily:FONT}} className="cl-chatbot-fab">
      <style>{`.cl-chatbot-fab{bottom:22px!important;right:22px!important}@media(max-width:768px){.cl-chatbot-fab{bottom:74px!important;left:14px!important;right:auto!important}}`}</style>
      {open&&(
        <div style={{position:"absolute",bottom:64,right:0,width:"min(340px,88vw)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,boxShadow:"0 8px 32px #0008",display:"flex",flexDirection:"column",maxHeight:460,overflow:"hidden"}}>
          {/* Header */}
          <div style={{background:"var(--cl-section-accent)",borderRadius:"20px 20px 0 0",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <span style={{fontSize:20}}>🎓</span>
              <div>
              <div style={{fontWeight:700,color:"#fff",fontSize:13}}>Soporte Luderis</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.7)",display:"flex",alignItems:"center",gap:4}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"#2EC4A0",display:"inline-block",animation:"pulse 2s infinite"}}/>
                En línea · Responde al instante
              </div>
            </div>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer"}}>×</button>
          </div>
          {/* Quick action buttons */}
          <div style={{padding:"10px 12px 0",display:"flex",gap:5,flexWrap:"wrap",borderBottom:`1px solid ${C.border}`}}>
            {QUICK_ACTIONS.slice(0,4).map((a,i)=>(<button key={i} onClick={()=>handleQuick(a.q)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"4px 9px",fontSize:10,cursor:"pointer",fontFamily:FONT,marginBottom:8}}>{a.label}</button>))}
          </div>
          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:9}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start"}}>
                {m.action?(
                  <div style={{display:"flex",flexDirection:"column",gap:7,alignItems:"flex-start"}}>
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px 16px 16px 4px",padding:"9px 13px",maxWidth:220,fontSize:12,color:C.text,lineHeight:1.5}}>{m.text}</div>
                    <button onClick={openWhatsApp} style={{background:"#25D366",border:"none",borderRadius:20,color:"#fff",padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:7}}>
                      <span style={{fontSize:16}}>💬</span> Hablar con representante
                    </button>
                  </div>
                ):(
                  <div style={{background:m.from==="user"?"var(--cl-section-accent)":C.card,color:m.from==="user"?"#fff":C.text,borderRadius:m.from==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"9px 13px",maxWidth:220,fontSize:12,lineHeight:1.5,border:`1px solid ${m.from==="user"?"transparent":C.border}`}}>{m.text}</div>
                )}
              </div>
            ))}
            {loading&&<div style={{display:"flex",gap:4,padding:"9px 13px",background:C.card,borderRadius:"16px 16px 16px 4px",width:50,border:`1px solid ${C.border}`}}>{[0,1,2].map(i=>(<div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.muted,animation:`bounce .8s ${i*.2}s infinite`}}/>))}</div>}
            <div ref={endRef}/>
          </div>
          {/* Input */}
          <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()} placeholder="Escribí tu pregunta..." style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"8px 13px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT}}/>
            <button onClick={()=>sendMsg()} disabled={!input.trim()||loading} style={{background:"var(--cl-section-accent)",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:15,flexShrink:0,opacity:!input.trim()?0.5:1}}>↑</button>
          </div>
        </div>
      )}
      {/* FAB button */}
      <button onClick={()=>setOpen(v=>!v)} style={{width:52,height:52,borderRadius:"50%",background:open?C.border:"var(--cl-section-accent)",border:"none",cursor:"pointer",fontSize:22,boxShadow:"0 4px 16px #0006",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {open?"×":"💬"}
      </button>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}

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
        if(u.avatar_url){localStorage.setItem("cl_avatar_"+email,u.avatar_url);_avatarCache[email]=u.avatar_url;}
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
  const [notifPanelOpen,setNotifPanelOpen]=useState(false);
  // Exponer función global para que el sidebar pueda abrir el panel
  useEffect(()=>{window._openNotifPanel=()=>setNotifPanelOpen(v=>!v);return()=>{window._openNotifPanel=null;};},[]);// eslint-disable-line
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

  const mostrarNotifPush=useCallback((titulo,cuerpo,{icon="/logo.png",tag="luderis-notif",pubId=null}={})=>{
    if(!("Notification" in window)||Notification.permission!=="granted")return;
    try{
      const n=new Notification(titulo,{body:cuerpo,icon,badge:"/logo.png",tag,renotify:true,silent:false});
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
  useEffect(()=>{
    refreshUnread();
    let t=setInterval(refreshUnread,8000);
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
    }catch{}
    const onVisibility=()=>{
      clearInterval(t);
      if(!document.hidden){
        refreshUnread(); // actualizar inmediatamente al volver
        t=setInterval(refreshUnread,8000);
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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes tabPulse{0%,100%{opacity:1}50%{opacity:0.5}}*{box-sizing:border-box}html,body,#root{background:${C.bg};color:${C.text};min-height:100vh;font-family:${FONT};overflow-x:hidden;max-width:100vw}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}::-webkit-scrollbar-track{background:transparent}.cl-card-anim{animation:fadeUp .2s ease both}.cl-fade{animation:fadeIn .15s ease both}input,textarea,select{color-scheme:${_themeKey()==="light"?"light":"dark"};background-color:${C.surface}!important;color:${C.text}!important;border-color:${C.border}}input::placeholder,textarea::placeholder{color:${C.muted};opacity:1}input:focus,textarea:focus,select:focus{border-color:${C.accent}!important;outline:none}@media(max-width:768px){input,textarea,select{font-size:16px!important}.cl-hide-desk{display:none!important}button{-webkit-tap-highlight-color:transparent}}.cl-tabs-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.cl-tabs-scroll::-webkit-scrollbar{display:none}.cl-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:600px){.cl-grid-2{grid-template-columns:1fr!important}}.cl-row-wrap{display:flex;flex-wrap:wrap;gap:8px}`}</style>
      <Sidebar page={page} setPage={setPage} session={session} onLogout={logout} onNewPost={()=>{setEditPost(null);setShowForm(true);}} unreadCount={unread} ofertasCount={ofertasCount} notifCount={notifCount} ofertasAceptadasNuevas={ofertasAceptadasNuevas} mobile={isMobile} open={sidebarOpen} onClose={()=>setSidebarOpen(false)} theme={currentTheme} onToggleTheme={toggleTheme} onForceRender={()=>forceThemeRender(n=>n+1)} esAdmin={esAdmin}/>
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
              <button onClick={()=>setNotifPanelOpen(v=>!v)} style={{position:"relative",background:"none",border:"none",cursor:"pointer",padding:"6px",borderRadius:"50%",fontSize:18,lineHeight:1,color:notifCount>0?C.accent:C.muted}}>
                🔔
                {notifCount>0&&<span style={{position:"absolute",top:2,right:2,background:C.danger,color:"#fff",borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 4px",lineHeight:1.4,minWidth:14,textAlign:"center"}}>{notifCount>9?"9+":notifCount}</span>}
              </button>
              <Btn onClick={()=>{setEditPost(null);setShowForm(true);}} style={{padding:"6px 14px",fontSize:12,borderRadius:16}}>{t("newPost")}</Btn>
            </div>
          </div>
          {/* Bottom navbar mobile — scroll horizontal con fade en los extremos */}
          <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,zIndex:50}}>
            <div style={{display:"flex",height:58,width:"100%"}}>
              {[
                {id:"explore",icon:"🔍",label:t("explore"),badge:0},
                {id:"chats",icon:"💬",label:t("chats"),badge:unread},
                {id:"inscripciones",icon:"🎓",label:t("classes"),badge:notifCount},
                {id:"cuenta",icon:"👤",label:t("account"),badge:ofertasAceptadasNuevas+ofertasCount},
              ].map(item=>(
                <button key={item.id} onClick={()=>setPage(item.id)}
                  style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"6px 0",position:"relative",fontFamily:FONT,borderTop:`2px solid ${page===item.id?"var(--cl-section-accent)":"transparent"}`,transition:"all .15s"}}>
                  <span style={{fontSize:20,color:page===item.id?"var(--cl-section-accent)":C.muted,lineHeight:1,transition:"color .15s"}}>{item.icon}</span>
                  <span style={{fontSize:10,color:page===item.id?"var(--cl-section-accent)":C.muted,fontWeight:page===item.id?600:400,whiteSpace:"nowrap",transition:"color .15s"}}>{item.label}</span>
                  {item.badge>0&&<span style={{position:"absolute",top:4,right:10,background:C.danger,color:"#fff",borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 4px",lineHeight:1.4}}>{item.badge>9?"9+":item.badge}</span>}
                </button>
              ))}
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
      {showOnboarding&&session&&<React.Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",zIndex:200}}><div style={{background:C.surface,borderRadius:16,padding:"32px 48px",color:C.text,fontFamily:FONT,fontSize:14}}>Cargando…</div></div>}><OnboardingModal session={session} upgradeMode={onboardingUpgrade} onClose={()=>{try{localStorage.setItem("cl_onboarding_done_"+session.user.email,"dismissed");}catch{}setShowOnboarding(false);setOnboardingUpgrade(false);}} onPublicar={()=>{setPage("cuenta");setEditPost(null);setShowForm(true);}}/></React.Suspense>}
      {showAdmin&&<AdminPage session={session} onClose={()=>setShowAdmin(false)} onChatUser={(u)=>{setShowAdmin(false);openChat({autor_email:u.email,titulo:"Mensaje desde Admin",id:"admin_"+u.id});}}/>}
      <ScrollToTopBtn/>
      <ChatBotWidget/>
      <ToastContainer/>
      <NotifPanel session={session} open={notifPanelOpen} onClose={()=>setNotifPanelOpen(false)} onOpenDetail={setDetailPost} onOpenCurso={setCursoPost}/>
    </div>
  );
}
