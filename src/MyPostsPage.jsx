import React, { useState, useEffect, useCallback } from "react";
import { C, FONT, LUD, Spinner, Btn, Modal, Label, Tag, StatusBadge, VerifiedBadge, Avatar, fmt, fmtPrice, logError, safeDisplayName } from "./shared";
import * as sb from "./supabase";
import { AcuerdoModal } from "./MiCuentaPage";

export function MyPostCard({post,session,onEdit,onToggle,onDelete,onOpenCurso,toggling,ofertasPendientes,inscriptos}){
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
        sb.insertNotificacion({usuario_id:null,alumno_email:ofertaAceptadaInfo.email,tipo:"busqueda_eliminada",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(e=>logError("notif busqueda_eliminada",e));
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
export function ContraofertaModal({oferta,miRol,session,onClose,onEnviada}){
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
      sb.insertNotificacion({usuario_id:null,alumno_email:destinatario,tipo:"contraoferta",publicacion_id:oferta.busqueda_id,pub_titulo:oferta.busqueda_titulo,leida:false},session.access_token).catch(e=>logError("notif contraoferta",e));
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
      },session.access_token).catch(e=>logError("email contraoferta",e));
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
export function OfertasRecibidasModal({post,session,onClose,onContactar}){
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
        sb.insertNotificacion({usuario_id:null,alumno_email:o.ofertante_email,tipo:"oferta_aceptada",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(e=>logError("notif oferta_aceptada",e));
        // Email al docente cuya oferta fue aceptada
        sb.sendEmail("oferta_aceptada",o.ofertante_email,{pub_titulo:post.titulo,pub_id:post.id,alumno_nombre:sb.getDisplayName(session.user.email)||session.user.email.split("@")[0]},session.access_token).catch(e=>logError("email oferta_aceptada",e));
        const ofertaActualizada={...o,estado:"aceptada",busqueda_titulo:post.titulo,busqueda_autor_email:session.user.email};
        setAcuerdoOferta(ofertaActualizada);
        await cargar();
      } else {
        if(estado==="rechazada"){
          sb.insertNotificacion({usuario_id:null,alumno_email:o.ofertante_email,tipo:"oferta_rechazada",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(e=>logError("notif oferta_rechazada",e));
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
export default function MyPostsPage({session,onEdit,onNew,onOpenCurso,onOpenChat,onRefreshOfertas}){
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
