import React, { useState, useEffect } from "react";
import * as sb from "./supabase";
import {
  C, FONT,
  Avatar, Spinner, StarRating, Tag, VerifiedBadge,
  fmt, fmtRel, fmtPrice, calcAvg, calcDuracion,
  safeDisplayName, CATEGORIAS_DATA, CalendarioCurso,
  LUD,
} from "./shared";
import { FavBtn, OfertarBtn, ShareBtn } from "./App";
import { DescExpandible, InscribirseBtn, RelacionadasSection, ReseñasSeccion } from "./CursoPage";

function DetailModal({post,session,onClose,onChat,onOpenCurso,onOpenPerfil,onOpenDetail2}){
  const [reseñas,setReseñas]=useState([]);const [reseñasUsuario,setReseñasUsuario]=useState([]);const [loading,setLoading]=useState(true);
  const [inscripcion,setInscripcion]=useState(null);const [puedeChat,setPuedeChat]=useState(false);const [miOfertaPendiente,setMiOfertaPendiente]=useState(false);
  const nombre=post.autor_nombre||sb.getDisplayName(post.autor_email)||safeDisplayName(post.autor_nombre,post.autor_email)||"Usuario";
  const esMio=post.autor_email===session.user.email;
  const esAyudante=(post.ayudantes||[]).includes(session.user.id);

  useEffect(()=>{
    // Bloquear scroll del body mientras la página está abierta
    document.body.style.overflow="hidden";
    try{sb.incrementarVistas(post.id,session.access_token);}catch{}
    Promise.all([
      sb.getReseñas(post.id,session.access_token),
      sb.getReseñasByAutor(post.autor_email,session.access_token),
      sb.getMisInscripciones(session.user.email,session.access_token),
      post.tipo==="busqueda"&&!esMio?sb.getMisOfertas(session.user.email,session.access_token).catch(()=>[]):Promise.resolve([])
    ]).then(([pub,usr,ins,misOfertas])=>{
      setReseñas(pub);setReseñasUsuario(usr);
      const insc=ins.find(i=>i.publicacion_id===post.id)||null;
      setInscripcion(insc);
      if(post.tipo==="busqueda"){
        const miOfertaEsta=misOfertas.filter(o=>o.busqueda_id===post.id);
        setMiOfertaPendiente(!!miOfertaEsta.find(o=>o.estado==="pendiente"));
        setPuedeChat(!!miOfertaEsta.find(o=>o.estado==="aceptada"));
      }else{setPuedeChat(!!insc);}
    }).finally(()=>setLoading(false));
    return()=>{document.body.style.overflow="";};
  },[post.id,post.autor_email,post.tipo,session]);// eslint-disable-line

  const avgPub=calcAvg(reseñas);const avgUser=calcAvg(reseñasUsuario);

  return(
    <div style={{position:"fixed",inset:0,zIndex:200,background:C.bg,display:"flex",flexDirection:"column",fontFamily:FONT,overflowY:"auto",WebkitOverflowScrolling:"touch",animation:"fadeIn .18s ease"}}>

      {/* ── Barra superior ── */}
      <div style={{position:"sticky",top:0,zIndex:10,background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 20px",height:60,display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 8px rgba(0,0,0,.06)"}}>
        <button onClick={onClose}
          style={{width:38,height:38,borderRadius:"50%",background:C.bg,border:`1px solid ${C.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:C.text,flexShrink:0,transition:"background .15s",marginRight:4}}
          onMouseEnter={e=>e.currentTarget.style.background=C.border}
          onMouseLeave={e=>e.currentTarget.style.background=C.bg}>←</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,color:C.text,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.titulo}</div>
          <div style={{fontSize:12,color:C.muted}}>{post.materia}{post.tipo==="busqueda"?" · Búsqueda":""}</div>
        </div>
        <div style={{display:"flex",gap:8,flexShrink:0}}>
          <ShareBtn post={post} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 12px",fontSize:12}}/>
          <FavBtn post={post} session={session} onFavChange={()=>{}}/>
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div style={{flex:1,maxWidth:900,margin:"0 auto",width:"100%",padding:"0 0 100px"}}>

        {/* ── Banner visual de categoría ── */}
        {(()=>{const catData=CATEGORIAS_DATA[post.materia]||{emoji:"📚",grad:`linear-gradient(135deg,${LUD.dark},${LUD.blue})`};return(
          <div style={{height:140,background:catData.grad,display:"flex",alignItems:"center",padding:"0 28px",gap:20,position:"relative",overflow:"hidden",marginBottom:0}}>
            <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,.06)",top:-60,right:-40,pointerEvents:"none"}}/>
            <div style={{position:"absolute",width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.04)",bottom:-40,left:60,pointerEvents:"none"}}/>
            <span style={{fontSize:64,filter:"drop-shadow(0 4px 12px rgba(0,0,0,.25))",position:"relative",zIndex:1,lineHeight:1}}>{catData.emoji}</span>
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
            <Tag tipo={post.tipo}/>
            {post.vistas>0&&<span style={{fontSize:12,color:C.muted,display:"inline-flex",alignItems:"center",gap:3}}>· 👁 <strong>{post.vistas}</strong> vista{post.vistas!==1?"s":""}</span>}
            {post.created_at&&<span style={{fontSize:12,color:C.muted}}>· Publicado {fmtRel(post.created_at)}</span>}
          </div>
          <div style={{height:1,background:C.border,margin:"0 0 24px"}}/>
        </div>

        {/* ── Layout principal: contenido izquierdo + caja flotante derecha ── */}
        <div style={{display:"flex",gap:32,alignItems:"flex-start",padding:"0 20px",flexWrap:"wrap"}}>

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

            {/* Chips de detalles */}
            {post.tipo==="oferta"&&(
              <div style={{marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${C.border}`}}>
                <h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:"0 0 14px"}}>Detalles</h2>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
                  {[
                    post.modo==="curso"&&{label:"Tipo",val:"Curso grupal",icon:"📚"},
                    post.modo==="particular"&&{label:"Tipo",val:"Clase particular",icon:"👤"},
                    post.sinc&&{label:"Sincronismo",val:post.sinc==="sinc"?"Sincrónico":"Asincrónico",icon:"🕐"},
                    post.modalidad&&{label:"Lugar",val:post.modalidad==="virtual"?"Online":post.modalidad==="presencial"?"Presencial":"Mixto",icon:post.modalidad==="virtual"?"🌐":"📍"},
                    post.fecha_inicio&&{label:"Inicio",val:fmt(post.fecha_inicio),icon:"📅"},
                    calcDuracion(post.fecha_inicio,post.fecha_fin)&&{label:"Duración",val:calcDuracion(post.fecha_inicio,post.fecha_fin),icon:"⏱"},
                    post.nivel&&{label:"Nivel",val:post.nivel,icon:"📊"},
                    post.max_alumnos&&{label:"Cupo máx.",val:`${post.max_alumnos} alumnos`,icon:"👥"},
                    post.ubicacion&&post.modalidad!=="virtual"&&{label:"Zona",val:post.ubicacion,icon:"📍"},
                    post.requisitos&&{label:"Requisitos",val:post.requisitos,icon:"📋"},
                    post.idioma&&{label:"Idioma",val:post.idioma,icon:"🌐"},
                    post.frecuencia&&{label:"Frecuencia",val:post.frecuencia,icon:"🔄"},
                    post.otorga_certificado&&{label:"Certificado",val:"Incluido al completar",icon:"🎓"},
                  ].filter(Boolean).map(({label,val,icon})=>(
                    <div key={label} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                      <div style={{fontSize:22,marginBottom:8,lineHeight:1}}>{icon}</div>
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

          </div>

          {/* ─ Caja flotante derecha ─ */}
          <div style={{flex:"0 0 300px",minWidth:260}}>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"24px",boxShadow:"0 4px 24px rgba(0,0,0,.08)"}}>

              {/* Precio */}
              {post.precio?(
                <div style={{marginBottom:16}}>
                  <span style={{fontSize:26,fontWeight:800,color:C.text}}>{fmtPrice(post.precio,post.moneda)}</span>
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
                  <span style={{fontSize:13}}>👥</span>
                  <span style={{fontSize:12,color:C.muted}}>{post.cantidad_inscriptos} inscripto{post.cantidad_inscriptos!==1?"s":""}</span>
                </div>}
                {post.vistas>0&&<div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontSize:12}}>👁</span>
                  <span style={{fontSize:12,color:C.muted}}>{post.vistas}</span>
                </div>}
              </div>

              {/* Acciones */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {loading?(
                  <Spinner small/>
                ):(
                  <>
                    {esAyudante&&<div style={{fontSize:12,color:C.purple,fontWeight:700,background:"#7B5CF010",border:"1px solid #7B5CF030",borderRadius:8,padding:"8px 12px",textAlign:"center"}}>✦ Sos co-docente de este curso</div>}

                    {post.tipo==="oferta"&&!esMio&&!esAyudante&&!inscripcion&&!post.finalizado&&!post.inscripciones_cerradas&&(
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        <InscribirseBtn post={post} session={session} onDone={()=>{onClose();onOpenCurso(post);}}/>
                        {/* Anti-puenteo */}
                        <div style={{background:C.warn+"10",border:`1px solid ${C.warn}25`,borderRadius:8,padding:"8px 10px",display:"flex",gap:6,alignItems:"flex-start"}}>
                          <span style={{fontSize:12,flexShrink:0}}>⚠️</span>
                          <span style={{fontSize:11,color:C.muted,lineHeight:1.4}}>Por favor realizá el pago a través de la plataforma. Las transacciones fuera de Luderis no tienen protección.</span>
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
                      <button onClick={()=>{onClose();onChat(post);}} style={{width:"100%",background:LUD.grad,color:"#fff",border:"none",borderRadius:20,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 14px rgba(26,110,216,.3)"}}>
                        Chatear con el docente
                      </button>
                    )}
                    <OfertarBtn post={post} session={session}/>
                  </>
                )}
              </div>

              {/* Info extra */}
              <div style={{marginTop:16,paddingTop:14,borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {icon:"✓",txt:"Sin intermediarios ni comisiones"},
                  post.tipo==="oferta"&&{icon:"🔒",txt:"Pago acordado directamente"},
                  post.tipo==="busqueda"&&{icon:"📩",txt:"Recibís ofertas de docentes"},
                ].filter(Boolean).map(({icon,txt})=>(
                  <div key={txt} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <span style={{fontSize:13,color:C.success,flexShrink:0}}>{icon}</span>
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
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,padding:"12px 20px",display:"flex",alignItems:"center",gap:12,zIndex:20,boxShadow:"0 -2px 16px rgba(0,0,0,.08)"}}
        className="detail-cta-mobile">
        <style>{`.detail-cta-mobile{display:none!important}@media(max-width:768px){.detail-cta-mobile{display:flex!important}}`}</style>
        {post.precio?<div style={{flex:1}}><span style={{fontWeight:800,color:C.text,fontSize:18}}>{fmtPrice(post.precio,post.moneda)}</span><span style={{fontSize:12,color:C.muted}}> /{post.precio_tipo||"hora"}</span></div>:<div style={{flex:1,fontWeight:700,color:C.success}}>Gratis</div>}
        <div style={{display:"flex",gap:8}}>
          {!esMio&&puedeChat&&<button onClick={()=>{onClose();onChat(post);}} style={{background:LUD.grad,color:"#fff",border:"none",borderRadius:20,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT}}>Chatear</button>}
          {post.tipo==="oferta"&&!esMio&&!esAyudante&&!inscripcion&&!post.finalizado&&!post.inscripciones_cerradas&&<InscribirseBtn post={post} session={session} onDone={()=>{onClose();onOpenCurso(post);}}/>}
          {post.tipo==="oferta"&&(esMio||esAyudante||inscripcion)&&<button onClick={()=>{onClose();onOpenCurso(post);}} style={{background:C.success+"15",color:C.success,border:`1px solid ${C.success}44`,borderRadius:20,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT}}>Ver curso</button>}
          {post.tipo==="busqueda"&&!esMio&&<OfertarBtn post={post} session={session}/>}
        </div>
      </div>
    </div>
  );
}

// ─── VERIFICACIÓN IA ──────────────────────────────────────────────────────────
export default DetailModal;
