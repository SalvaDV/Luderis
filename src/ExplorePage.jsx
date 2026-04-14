import React, { useState, useEffect, useCallback, useRef } from "react";
import * as sb from "./supabase";
import {
  C, FONT, LUD,
  Spinner, Avatar, Tag, MiniStars, SearchableSelect, Btn, Chip,
  fmtPrice, fmtRel, fmt,
  safeDisplayName, _avatarCache,
  MATERIAS, CATEGORIAS_DATA, getPubTipo, TIPO_PUB,
  useDebounce, useIntersectionObserver,
} from "./shared";
import BusquedaIA from "./components/BusquedaIA";
import MiniDropdown from "./components/MiniDropdown";
import PostCard from "./components/PostCard";
import FavBtn from "./components/FavBtn";
import LeaderboardView from "./components/LeaderboardView";
import { DocentesDestacados } from "./AgendaPage";
import { PriceSlider } from "./PostFormModal";

export default function ExplorePage({session,onOpenChat,onOpenDetail,onOpenPerfil,onOpenCurso}){
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
    filtroTipo!=="all"&&(filtroTipo==="oferta"?"Clases":"Pedidos"),
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
                style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:6,background:C.bg,border:`2px solid ${iaQuery?C.accent:C.border}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                onMouseLeave={e=>e.currentTarget.style.borderColor=iaQuery?C.accent:C.border}>
                {!iaQuery&&<span style={{fontSize:13,background:"linear-gradient(135deg,#7B3FBE,#1A6ED8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700,flexShrink:0}}>✦</span>}
                <span style={{color:iaQuery?C.text:C.muted,fontSize:13,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {iaQuery?iaQuery:seccion==="pedidos"?"Describí qué sabés enseñar…":"Describí lo que querés aprender…"}
                </span>
                {iaQuery&&<span onClick={e=>{e.stopPropagation();setIaQuery("");setIaResults(null);setIaExplanation("");setPagina(1);}} style={{color:C.muted,fontSize:16,lineHeight:1,flexShrink:0}}>×</span>}
              </button>
              <button onClick={()=>setPanelOpen(v=>!v)}
                style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",background:hasFilters?C.accentDim:C.bg,border:`1px solid ${hasFilters?C.accent:C.border}`,borderRadius:10,color:hasFilters?C.accent:C.muted,padding:"11px 13px",cursor:"pointer",flexShrink:0}}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                {activeFilters.length>0&&<span style={{position:"absolute",top:-5,right:-5,background:C.accent,color:"#fff",borderRadius:"50%",width:16,height:16,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>{activeFilters.length}</span>}
              </button>
            </div>

            {/* Chips de sección: Cursos / Clases / Pedidos */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {[
                {id:"cursos",label:"Cursos",T:TIPO_PUB.curso},
                {id:"clases",label:"Clases",T:TIPO_PUB.particular},
                ...(esDocente?[{id:"pedidos",label:"Pedidos",T:TIPO_PUB.pedido}]:[]),
              ].map(({id,label,T})=>{
                const active=seccion===id;
                return(<button key={id}
                  onClick={()=>{setSeccion(id);setFiltroTipo("all");setFiltroModo("all");try{sessionStorage.setItem("cl_seccion_explore",id);}catch{}}}
                  style={{padding:"6px 18px",borderRadius:20,fontSize:13,fontWeight:active?700:400,cursor:"pointer",fontFamily:FONT,
                    background:active?T.accent:"transparent",
                    color:active?"#fff":C.muted,
                    border:`1.5px solid ${active?T.accent:C.border}`,
                    boxShadow:active?"0 2px 8px rgba(0,0,0,.12)":"none",
                    transition:"all .15s"}}>{label}</button>);
              })}
            </div>
            {/* Ordenar + resultados + vista — una sola fila compacta */}
            <div style={{display:"flex",alignItems:"center",gap:6,overflow:"visible"}}>
              <span style={{fontSize:12,color:C.muted,whiteSpace:"nowrap",flexShrink:0}}>Ordenar</span>
              <MiniDropdown value={ordenamiento} onChange={v=>{setOrdenamiento(v);setPagina(1);}} fontSize={12} options={[
                {value:"relevancia",label:"Relevancia"},
                {value:"recientes",label:"Recientes"},
                {value:"rating",label:"Calificados"},
                {value:"precio_asc",label:"Precio ↑"},
                {value:"precio_desc",label:"Precio ↓"},
                {value:"vistas",label:"Populares"},
                {value:"cercania",label:"Cercanos"},
              ]}/>
              <span style={{fontSize:12,color:C.muted,whiteSpace:"nowrap",marginLeft:"auto",flexShrink:0}}>{sorted.length} resultado{sorted.length!==1?"s":""}</span>
              <div style={{display:"flex",gap:2,border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",flexShrink:0}}>
                {[["cards","▦"],["lista","≡"],["ranking","🏆"]].map(([m,icon])=>(
                  <button key={m} onClick={()=>setViewMode(m)} style={{background:viewMode===m?C.accent:"none",border:"none",color:viewMode===m?"#fff":C.muted,width:32,height:30,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .12s"}}>{icon}</button>
                ))}
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
    {showBusquedaIA&&<BusquedaIA onBuscar={buscarConIA} iaLoading={iaLoading} onClose={()=>setShowBusquedaIA(false)} seccion={seccion}/>}
  </>);
}
