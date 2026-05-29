import React, { useState, useEffect } from "react";
import {
  Megaphone, Eye, BookOpen, HelpCircle, Layers, GraduationCap, Users, Lock,
  AlertTriangle, Check, Inbox, Video, Folder, FileText, Bell, Bookmark, Link2,
  User, Clock, Globe, MapPin, Calendar, Timer, BarChart2, Clipboard, RefreshCw,
  Settings, Wrench, Palette, Search, Zap,
} from "lucide-react";
import * as sb from "./supabase";
import { trackPostView, trackChatStart } from "./analytics";
import {
  C, FONT,
  Avatar, Spinner, StarRating, Tag, VerifiedBadge,
  fmt, fmtRel, fmtPrice, calcAvg, calcDuracion,
  safeDisplayName, CATEGORIAS_DATA, CalendarioCurso,
  LUD, getPubTipo,
} from "./shared";
import { FavBtn, OfertarBtn, ShareBtn } from "./App";
import { DescExpandible, InscribirseBtn, RelacionadasSection, ReseñasSeccion } from "./CursoPage";
import PreguntasSection from "./components/PreguntasSection";

function DetailModal({post,session,onClose,onChat,onOpenCurso,onOpenPerfil,onOpenDetail2}){
  const [reseñas,setReseñas]=useState([]);const [reseñasUsuario,setReseñasUsuario]=useState([]);const [loading,setLoading]=useState(true);
  const [inscripcion,setInscripcion]=useState(null);const [puedeChat,setPuedeChat]=useState(false);const [miOfertaPendiente,setMiOfertaPendiente]=useState(false);
  const [skills,setSkills]=useState([]);
  const [contenidoCount,setContenidoCount]=useState(null);
  const [modulosPreview,setModulosPreview]=useState([]);
  const nombre=post.autor_nombre||sb.getDisplayName(post.autor_email)||safeDisplayName(post.autor_nombre,post.autor_email)||"Usuario";
  const esMio=post.autor_email===session.user.email;
  const esAyudante=(post.ayudantes||[]).includes(session.user.id);

  useEffect(()=>{
    // JSON-LD Course schema para SEO
    const schema={
      "@context":"https://schema.org",
      "@type":"Course",
      "name":post.titulo,
      "description":post.descripcion||post.titulo,
      "provider":{"@type":"Person","name":post.autor_nombre||post.autor_email},
      ...(post.precio>0&&{"offers":{"@type":"Offer","price":post.precio,"priceCurrency":post.moneda||"ARS","availability":"https://schema.org/InStock"}}),
      ...(post.materia&&{"about":{"@type":"Thing","name":post.materia}}),
    };
    const tag=document.createElement("script");
    tag.type="application/ld+json";tag.id="course-schema";
    tag.textContent=JSON.stringify(schema);
    document.head.appendChild(tag);
    return()=>{document.getElementById("course-schema")?.remove();};
  },[post.id]);// eslint-disable-line

  useEffect(()=>{
    // Bloquear scroll del body mientras la página está abierta
    document.body.style.overflow="hidden";
    let mounted=true;
    trackPostView(post);
    try{sb.incrementarVistas(post.id,session.access_token);}catch{}
    Promise.all([
      sb.getReseñas(post.id,session.access_token),
      sb.getReseñasByAutor(post.autor_email,session.access_token),
      sb.getMisInscripciones(session.user.email,session.access_token),
      post.tipo==="busqueda"&&!esMio?sb.getMisOfertas(session.user.email,session.access_token).catch(()=>[]):Promise.resolve([]),
      post.modo==="curso"?sb.getSkillsDB(post.id,session.access_token).catch(()=>[]):Promise.resolve([]),
      post.modo==="curso"?sb.getContenido(post.id,session.access_token).catch(()=>[]):Promise.resolve([])
    ]).then(([pub,usr,ins,misOfertas,sk,cont])=>{
      if(!mounted)return;
      setReseñas(pub);setReseñasUsuario(usr);setSkills(sk||[]);
      if(cont&&cont.length){const mods=cont.filter(c=>!["quiz","flashcards"].includes(c.tipo));setContenidoCount({modulos:mods.length,quizzes:cont.filter(c=>c.tipo==="quiz").length,mazos:cont.filter(c=>c.tipo==="flashcards").length});setModulosPreview(mods.slice(0,2));}
      const insc=ins.find(i=>i.publicacion_id===post.id)||null;
      setInscripcion(insc);
      if(post.tipo==="busqueda"){
        const miOfertaEsta=misOfertas.filter(o=>o.busqueda_id===post.id);
        setMiOfertaPendiente(!!miOfertaEsta.find(o=>o.estado==="pendiente"));
        setPuedeChat(!!miOfertaEsta.find(o=>o.estado==="aceptada"));
      }else{setPuedeChat(!!insc);}
    }).finally(()=>{if(mounted)setLoading(false);});
    return()=>{mounted=false;document.body.style.overflow="";};
  },[post.id,post.autor_email,post.tipo,session]);// eslint-disable-line

  const avgPub=calcAvg(reseñas);const avgUser=calcAvg(reseñasUsuario);

  return(
    <div style={{position:"fixed",inset:0,zIndex:200,background:C.bg,display:"flex",flexDirection:"column",fontFamily:FONT,overflowY:"auto",WebkitOverflowScrolling:"touch",animation:"fadeIn .18s ease"}}>
      <style>{`
        @media(max-width:600px){
          .dm-topbar{padding:0 14px!important}
          .dm-banner{padding:0 16px!important;height:110px!important}
          .dm-banner-emoji{font-size:44px!important}
          .dm-body-pad{padding:0 12px!important}
          .dm-main-layout{gap:16px!important}
          .dm-sidebar{flex:1 1 100%!important;min-width:0!important}
        }
      `}</style>

      {/* ── Barra superior ── */}
      {(()=>{const T=getPubTipo(post);return(
      <div className="dm-topbar" style={{position:"sticky",top:0,zIndex:10,background:C.surface,borderBottom:`2px solid ${T.accent}`,padding:"0 28px",height:64,display:"flex",alignItems:"center",gap:14,boxShadow:"0 1px 8px rgba(0,0,0,.06)"}}>
        <button onClick={onClose}
          style={{width:36,height:36,borderRadius:"50%",background:T.dim,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.accent,flexShrink:0,transition:"background .15s"}}
          onMouseEnter={e=>e.currentTarget.style.background=T.border}
          onMouseLeave={e=>e.currentTarget.style.background=T.dim}>←</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,color:C.text,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.titulo}</div>
          <div style={{fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:5}}>{post.materia}{post.tipo==="busqueda"&&<span style={{color:T.accent,fontWeight:600,display:"inline-flex",alignItems:"center",gap:3}}>· <Megaphone size={11} strokeWidth={2}/>Pedido</span>}</div>
        </div>
        <div style={{display:"flex",gap:8,flexShrink:0}}>
          <ShareBtn post={post} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 12px",fontSize:12}}/>
          <FavBtn post={post} session={session} onFavChange={()=>{}}/>
        </div>
      </div>
      );})()}

      {/* ── Cuerpo ── */}
      <div style={{flex:1,maxWidth:900,margin:"0 auto",width:"100%",padding:"0 0 100px"}}>

        {/* ── Banner visual de categoría ── */}
        {(()=>{const catData=CATEGORIAS_DATA[post.materia]||{emoji:"📚",grad:`linear-gradient(135deg,${LUD.dark},${LUD.blue})`};return(
          <div className="dm-banner" style={{height:140,background:catData.grad,display:"flex",alignItems:"center",padding:"0 28px",gap:20,position:"relative",overflow:"hidden",marginBottom:0}}>
            <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,.06)",top:-60,right:-40,pointerEvents:"none"}}/>
            <div style={{position:"absolute",width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.04)",bottom:-40,left:60,pointerEvents:"none"}}/>
            <span className="dm-banner-emoji" style={{fontSize:64,filter:"drop-shadow(0 4px 12px rgba(0,0,0,.25))",position:"relative",zIndex:1,lineHeight:1}}>{catData.emoji}</span>
            <div style={{position:"relative",zIndex:1,flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,.7)",letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>{post.materia}</div>
              <h1 style={{color:"#fff",fontSize:"clamp(18px,3.5vw,26px)",fontWeight:800,margin:0,lineHeight:1.2,letterSpacing:"-.3px",textShadow:"0 2px 8px rgba(0,0,0,.2)",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{post.titulo}</h1>
            </div>
          </div>
        );})()}

        {/* ── Meta: rating + tags ── */}
        <div style={{padding:"16px 20px 0"}}>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:16}}>
            {avgPub?<span style={{fontSize:13,color:"#B45309",fontWeight:600}}>★ {parseFloat(avgPub).toFixed(1)} <span style={{color:C.muted,fontWeight:400}}>({reseñas.length} reseña{reseñas.length!==1?"s":""})</span></span>:null}
            {post.verificado&&<VerifiedBadge/>}
            <Tag tipo={post.tipo} modo={post.modo}/>
            {post.vistas>0&&<span style={{fontSize:12,color:C.muted,display:"inline-flex",alignItems:"center",gap:3}}>· <Eye size={12} strokeWidth={2}/><strong>{post.vistas}</strong> vista{post.vistas!==1?"s":""}</span>}
            {post.created_at&&<span style={{fontSize:12,color:C.muted}}>· Publicado {fmtRel(post.created_at)}</span>}
          </div>
          <div style={{height:1,background:C.border,margin:"0 0 24px"}}/>
        </div>

        {/* ── Layout principal: contenido izquierdo + caja flotante derecha ── */}
        <div className="dm-main-layout dm-body-pad" style={{display:"flex",gap:32,alignItems:"flex-start",padding:"0 20px",flexWrap:"wrap"}}>

          {/* ─ Columna izquierda ─ */}
          <div style={{flex:"1 1 340px",minWidth:0}}>

            {/* Autor */}
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${C.border}`}}>
              <button onClick={()=>{onClose();onOpenPerfil(post.autor_email);}} style={{background:"none",border:"none",cursor:"pointer",padding:0,flexShrink:0}}><Avatar letra={nombre[0]} size={52}/></button>
              <div style={{flex:1,minWidth:0}}>
                <button onClick={()=>{onClose();onOpenPerfil(post.autor_email);}}
                  style={{fontWeight:700,color:C.text,fontSize:16,background:"none",border:"none",cursor:"pointer",fontFamily:FONT,padding:0,textAlign:"left",display:"block",marginBottom:3}}
                  onMouseEnter={e=>e.currentTarget.style.color=C.accent} onMouseLeave={e=>e.currentTarget.style.color=C.text}>
                  {nombre}
                </button>
                {loading?<Spinner small/>:<StarRating val={avgUser} count={reseñasUsuario.length}/>}
                {esMio&&<div style={{fontSize:12,color:C.muted,marginTop:2,fontStyle:"italic"}}>Tu publicación</div>}
                {!esMio&&avgUser>=4&&<div style={{fontSize:11,color:C.success,marginTop:2,display:"flex",alignItems:"center",gap:4,fontWeight:600}}><span style={{width:6,height:6,borderRadius:"50%",background:C.success,display:"inline-block"}}/>Docente con alta calificación</div>}
                {esAyudante&&<span style={{fontSize:12,color:C.purple,fontWeight:700}}>✦ Co-docente</span>}
              </div>
            </div>

            {/* Descripción */}
            <div style={{marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${C.border}`}}>
              <h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:"0 0 10px"}}>Descripción</h2>
              <DescExpandible texto={post.descripcion||""} max={400}/>
            </div>

            {/* Lo que vas a aprender */}
            {skills.length>0&&(
              <div style={{marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${C.border}`}}>
                <h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:"0 0 14px"}}>Lo que vas a aprender</h2>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
                  {skills.map(s=>{
                    const ICONS={conceptual:BookOpen,procedimental:Settings,practica:Wrench,creativa:Palette,interpretativa:Search,performance:Zap};
                    const SkillIcon=ICONS[s.tipo]||null;
                    return(
                      <div key={s.id} style={{display:"flex",alignItems:"flex-start",gap:10,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px"}}>
                        <span style={{lineHeight:1,flexShrink:0,color:C.muted}}>{SkillIcon?<SkillIcon size={16} strokeWidth={1.8}/>:"✦"}</span>
                        <span style={{fontSize:13,color:C.text,fontWeight:500,lineHeight:1.4}}>{s.nombre}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Preview de contenido */}
            {post.modo==="curso"&&modulosPreview.length>0&&!esMio&&!esAyudante&&!inscripcion&&(
              <div style={{marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${C.border}`}}>
                <h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:"0 0 14px"}}>Vista previa del contenido</h2>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {modulosPreview.map((c,i)=>{
                    const TIPO_IC={video:Video,archivo:Folder,texto:FileText,aviso:Bell,tarea:Bookmark,link:Link2};
                    const TIPO_CLR={video:"#1A6ED8",archivo:"#2EC4A0",texto:"#5A7294",aviso:"#E8881A",tarea:"#7B5CF0",link:"#0EA5E9"};
                    const TipoIcon=TIPO_IC[c.tipo]||FileText;const clr=TIPO_CLR[c.tipo]||C.muted;
                    return(
                      <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,background:C.bg,border:`1px solid ${C.border}`,borderLeft:`3px solid ${clr}`,borderRadius:10,padding:"10px 14px"}}>
                        <span style={{flexShrink:0,color:clr}}><TipoIcon size={16} strokeWidth={1.8}/></span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.titulo}</div>
                          <div style={{fontSize:11,color:C.muted,textTransform:"capitalize"}}>{c.tipo}</div>
                        </div>
                        <span style={{fontSize:11,color:C.muted,flexShrink:0}}>Módulo {i+1}</span>
                      </div>
                    );
                  })}
                  {contenidoCount&&contenidoCount.modulos>2&&(
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,fontSize:12}}>
                      <Lock size={13} strokeWidth={2}/>
                      <span>+{contenidoCount.modulos-2} módulos más · Inscribite para acceder</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chips de detalles */}
            {post.tipo==="oferta"&&(
              <div style={{marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${C.border}`}}>
                <h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:"0 0 14px"}}>Detalles</h2>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
                  {[
                    post.modo==="curso"&&{label:"Tipo",val:"Curso grupal",Icon:BookOpen},
                    post.modo==="particular"&&{label:"Tipo",val:"Clase particular",Icon:User},
                    post.sinc&&{label:"Sincronismo",val:post.sinc==="sinc"?"Sincrónico":"Asincrónico",Icon:Clock},
                    post.modalidad&&{label:"Lugar",val:post.modalidad==="virtual"?"Online":post.modalidad==="presencial"?"Presencial":"Mixto",Icon:post.modalidad==="virtual"?Globe:MapPin},
                    post.fecha_inicio&&{label:"Inicio",val:fmt(post.fecha_inicio),Icon:Calendar},
                    calcDuracion(post.fecha_inicio,post.fecha_fin)&&{label:"Duración",val:calcDuracion(post.fecha_inicio,post.fecha_fin),Icon:Timer},
                    post.nivel&&{label:"Nivel",val:post.nivel,Icon:BarChart2},
                    post.max_alumnos&&{label:"Cupo máx.",val:`${post.max_alumnos} alumnos`,Icon:Users},
                    post.ubicacion&&post.modalidad!=="virtual"&&{label:"Zona",val:post.ubicacion,Icon:MapPin},
                    post.requisitos&&{label:"Requisitos",val:post.requisitos,Icon:Clipboard},
                    post.idioma&&{label:"Idioma",val:post.idioma,Icon:Globe},
                    post.frecuencia&&{label:"Frecuencia",val:post.frecuencia,Icon:RefreshCw},
                    post.otorga_certificado&&{label:"Certificado",val:"Incluido al completar",Icon:GraduationCap},
                  ].filter(Boolean).map(({label,val,Icon:ChipIcon})=>(
                    <div key={label} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                      <div style={{marginBottom:8,color:C.muted}}><ChipIcon size={20} strokeWidth={1.8}/></div>
                      <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:.5,marginBottom:4,textTransform:"uppercase"}}>{label}</div>
                      <div style={{fontSize:13,color:C.text,fontWeight:700,lineHeight:1.3}}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendario si lo tiene */}
            {post.tipo==="oferta"&&post.modo==="curso"&&post.sinc==="sinc"&&(
              <div style={{marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${C.border}`}}>
                <h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:"0 0 14px"}}>Horarios</h2>
                <CalendarioCurso post={post}/>
              </div>
            )}

            {/* Reseñas */}
            {/* ── Reseñas ── */}
            <div>
              <ReseñasSeccion post={post} session={session} inscripcion={inscripcion} esMio={esMio}/>
            </div>

            {/* ── Preguntas públicas ── */}
            {post.tipo !== "busqueda" && (
              <PreguntasSection
                publicacionId={post.id}
                session={session}
                docenteId={post.autor_id}
                docenteEmail={post.autor_email}
                pubTitulo={post.titulo}
                C={C}
              />
            )}

          </div>

          {/* ─ Caja flotante derecha ─ */}
          <div className="dm-sidebar" style={{flex:"0 0 300px",minWidth:260}}>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"24px",boxShadow:"0 4px 24px rgba(0,0,0,.08)"}}>

              {/* Precio */}
              {post.precio?(
                <div style={{marginBottom:16}}>
                  <span style={{fontSize:26,fontWeight:800,color:getPubTipo(post).accent}}>{fmtPrice(post.precio,post.moneda)}</span>
                  <span style={{fontSize:14,color:C.muted,fontWeight:400}}> /{post.precio_tipo||"hora"}</span>
                </div>
              ):(
                <div style={{fontSize:16,fontWeight:700,color:C.success,marginBottom:16}}>Gratis</div>
              )}

              {/* Valoración compacta */}
              {/* Stats rápidos */}
              <div style={{display:"flex",gap:12,marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
                {avgPub&&<div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{color:"#B45309",fontSize:13,fontWeight:700}}>★ {parseFloat(avgPub).toFixed(1)}</span>
                  <span style={{color:C.muted,fontSize:12}}>({reseñas.length})</span>
                </div>}
                {post.cantidad_inscriptos>0&&<div style={{display:"flex",alignItems:"center",gap:4}}>
                  <Users size={13} strokeWidth={1.8} color={C.muted}/>
                  <span style={{fontSize:12,color:C.muted}}>{post.cantidad_inscriptos} inscripto{post.cantidad_inscriptos!==1?"s":""}</span>
                </div>}
                {post.vistas>0&&<div style={{display:"flex",alignItems:"center",gap:4}}>
                  <Eye size={12} strokeWidth={2} color={C.muted}/>
                  <span style={{fontSize:12,color:C.muted}}>{post.vistas}</span>
                </div>}
              </div>

              {/* Contador de módulos */}
              {post.modo==="curso"&&contenidoCount&&(contenidoCount.modulos>0||contenidoCount.quizzes>0)&&(
                <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
                  {contenidoCount.modulos>0&&<span style={{fontSize:12,color:C.muted,display:"inline-flex",alignItems:"center",gap:4}}><BookOpen size={13} strokeWidth={1.8}/><strong>{contenidoCount.modulos}</strong> módulo{contenidoCount.modulos!==1?"s":""}</span>}
                  {contenidoCount.quizzes>0&&<span style={{fontSize:12,color:C.muted,display:"inline-flex",alignItems:"center",gap:4}}><HelpCircle size={13} strokeWidth={1.8}/><strong>{contenidoCount.quizzes}</strong> evaluación{contenidoCount.quizzes!==1?"es":""}</span>}
                  {contenidoCount.mazos>0&&<span style={{fontSize:12,color:C.muted,display:"inline-flex",alignItems:"center",gap:4}}><Layers size={13} strokeWidth={1.8}/><strong>{contenidoCount.mazos}</strong> mazo{contenidoCount.mazos!==1?"s":""}</span>}
                </div>
              )}
              {/* Criterio de certificado */}
              {post.modo==="curso"&&post.otorga_certificado&&(
                <div style={{background:"#1A6ED808",border:"1px solid #1A6ED822",borderRadius:8,padding:"8px 12px",marginBottom:12,display:"flex",gap:8,alignItems:"flex-start"}}>
                  <GraduationCap size={15} strokeWidth={1.8} color={C.accent} style={{flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:C.text}}>Otorga certificado</div>
                    {post.aprobacion_pct&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>Completá el {post.aprobacion_pct}% de los módulos</div>}
                  </div>
                </div>
              )}
              {/* Acciones */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {loading?(
                  <Spinner small/>
                ):(
                  <>
                    {esAyudante&&<div style={{fontSize:12,color:C.purple,fontWeight:700,background:"#7B5CF010",border:"1px solid #7B5CF030",borderRadius:8,padding:"8px 12px",textAlign:"center"}}>✦ Sos co-docente de este curso</div>}

                    {post.tipo==="oferta"&&!esMio&&!esAyudante&&!inscripcion&&!post.finalizado&&!post.inscripciones_cerradas&&(
                      <div style={{display:"flex",flexDirection:"column",gap:8}} className="detail-body-inscribirse">
                        <style>{`.detail-body-inscribirse{display:flex!important}@media(max-width:768px){.detail-body-inscribirse{display:none!important}}`}</style>
                        <InscribirseBtn post={post} session={session} onDone={()=>{onClose();onOpenCurso(post);}}/>
                        {/* Anti-puenteo */}
                        <div style={{background:C.warn+"10",border:`1px solid ${C.warn}25`,borderRadius:8,padding:"8px 10px",display:"flex",gap:6,alignItems:"flex-start"}}>
                          <AlertTriangle size={12} strokeWidth={2} color={C.warn} style={{flexShrink:0}}/>
                          <span style={{fontSize:11,color:C.muted,lineHeight:1.4}}>Por favor realizá el pago a través de la plataforma. Las transacciones fuera de Luderis no tienen protección. <a href="/devoluciones" target="_blank" rel="noopener noreferrer" style={{color:"inherit",fontWeight:600,textDecoration:"underline"}}>Ver política de devoluciones</a> · <a href="/terminos" target="_blank" rel="noopener noreferrer" style={{color:"inherit",fontWeight:600,textDecoration:"underline"}}>T&C</a></span>
                        </div>
                      </div>
                    )}
                    {post.tipo==="oferta"&&!esMio&&!esAyudante&&!loading&&!inscripcion&&post.inscripciones_cerradas&&(
                      <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"8px",background:C.bg,borderRadius:8}}>Inscripciones cerradas</div>
                    )}
                    {post.tipo==="oferta"&&(esMio||esAyudante||inscripcion)&&(
                      <button onClick={()=>{onClose();onOpenCurso(post);}} style={{width:"100%",background:C.success+"15",color:C.success,border:`1px solid ${C.success}44`,borderRadius:20,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT}}>
                        Ver contenido del curso
                      </button>
                    )}
                    {!esMio&&puedeChat&&(
                      <button onClick={()=>{trackChatStart(post);onClose();onChat(post);}} style={{width:"100%",background:LUD.grad,color:"#fff",border:"none",borderRadius:20,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 14px rgba(26,110,216,.3)"}}>
                        Chatear con el docente
                      </button>
                    )}
                    <OfertarBtn post={post} session={session}/>
                  </>
                )}
              </div>

              {/* Rating prominente */}
              {reseñasUsuario&&reseñasUsuario.length>0&&(()=>{const avg=calcAvg(reseñasUsuario);return avg>0&&(
                <div style={{background:"#FFF9E6",border:"1px solid #F59E0B33",borderRadius:12,padding:"10px 14px",display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{textAlign:"center",flexShrink:0}}>
                    <div style={{fontSize:22,fontWeight:800,color:"#F59E0B",lineHeight:1}}>{avg.toFixed(1)}</div>
                    <div style={{display:"flex",gap:1}}>{Array.from({length:5}).map((_,j)=><span key={j} style={{fontSize:10,color:j<Math.round(avg)?"#F59E0B":"#E5E7EB"}}>★</span>)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#92400E"}}>{reseñasUsuario.length} reseña{reseñasUsuario.length!==1?"s":""}</div>
                    <div style={{fontSize:11,color:"#B45309"}}>de alumnos verificados</div>
                  </div>
                </div>
              );})()}
              {/* Info extra */}
              <div style={{marginTop:8,paddingTop:12,borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:6}}>
                {[
                  {Icon:Check,txt:"Pago seguro · sin cargos ocultos",color:C.success},
                  post.tipo==="oferta"&&{Icon:Lock,txt:"Pago acordado directamente",color:C.muted},
                  post.tipo==="busqueda"&&{Icon:Inbox,txt:"Recibís ofertas de docentes",color:C.muted},
                ].filter(Boolean).map(({Icon:InfoIcon,txt,color})=>(
                  <div key={txt} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <InfoIcon size={13} strokeWidth={2} color={color} style={{flexShrink:0,marginTop:1}}/>
                    <span style={{fontSize:12,color:C.muted}}>{txt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Publicaciones relacionadas — ancho completo ── */}
        <div style={{padding:"0 20px 0"}}>
          <RelacionadasSection post={post} session={session} onOpenDetail2={(p)=>{onClose();setTimeout(()=>onOpenDetail2&&onOpenDetail2(p),80);}}/>
        </div>
      </div>

      {/* ── Barra CTA fija en mobile ── */}
      <div className="detail-cta-mobile" style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,zIndex:20,boxShadow:"0 -2px 16px rgba(0,0,0,.08)"}}>
        <style>{`.detail-cta-mobile{display:none!important}@media(max-width:768px){.detail-cta-mobile{display:block!important}}`}</style>
        {/* Aviso anti-puenteo — visible en mobile */}
        {post.tipo==="oferta"&&!esMio&&!esAyudante&&!inscripcion&&!post.finalizado&&!post.inscripciones_cerradas&&(
          <div style={{padding:"6px 16px",background:C.warn+"10",borderBottom:`1px solid ${C.warn}25`,display:"flex",alignItems:"center",gap:6}}>
            <AlertTriangle size={11} strokeWidth={2} color={C.warn} style={{flexShrink:0}}/>
            <span style={{fontSize:11,color:C.muted,lineHeight:1.3}}>Realizá el pago a través de la plataforma. Las transacciones fuera de Luderis no tienen protección.</span>
          </div>
        )}
        <div style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:12}}>
          {post.precio?<div style={{flex:1}}><span style={{fontWeight:800,color:getPubTipo(post).accent,fontSize:18}}>{fmtPrice(post.precio,post.moneda)}</span><span style={{fontSize:12,color:C.muted}}> /{post.precio_tipo||"hora"}</span></div>:<div style={{flex:1,fontWeight:700,color:C.success}}>Gratis</div>}
          <div style={{display:"flex",gap:8}}>
            {!esMio&&puedeChat&&<button onClick={()=>{trackChatStart(post);onClose();onChat(post);}} style={{background:LUD.grad,color:"#fff",border:"none",borderRadius:20,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT}}>Chatear</button>}
            {post.tipo==="oferta"&&!esMio&&!esAyudante&&!inscripcion&&!post.finalizado&&!post.inscripciones_cerradas&&<InscribirseBtn post={post} session={session} onDone={()=>{onClose();onOpenCurso(post);}}/>}
            {post.tipo==="oferta"&&(esMio||esAyudante||inscripcion)&&<button onClick={()=>{onClose();onOpenCurso(post);}} style={{background:C.success+"15",color:C.success,border:`1px solid ${C.success}44`,borderRadius:20,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT}}>Ver curso</button>}
            {post.tipo==="busqueda"&&!esMio&&<OfertarBtn post={post} session={session}/>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VERIFICACIÓN IA ──────────────────────────────────────────────────────────
export default DetailModal;
