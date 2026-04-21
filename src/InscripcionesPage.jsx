import React, { useState, useEffect } from "react";
import { C, FONT, Spinner, Avatar, fmt, fmtPrice, logError, safeDisplayName } from "./shared";
import * as sb from "./supabase";
import { AcuerdoModal, EspacioClaseModal } from "./MiCuentaPage";

// ─── INSCRIPCIONES PAGE — con tiempo hasta inicio / hasta fin ─────────────────
export default function InscripcionesPage({session,onOpenCurso,onOpenChat,onMarkNotifsRead}){
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

  const confirmarClaseAlumno=async(ins)=>{
    try{
      await sb.updateInscripcion(ins.id,{alumno_confirmada:true,alumno_confirmada_at:new Date().toISOString()},session.access_token);
      setInscripciones(prev=>prev.map(i=>i.id===ins.id?{...i,alumno_confirmada:true,alumno_confirmada_at:new Date().toISOString()}:i));
    }catch(e){
      logError("confirmarClaseAlumno",e);
      alert("No se pudo confirmar: "+(e.message||"error"));
    }
  };

  const renderCard=(ins)=>{
    const p=posts[ins.publicacion_id];if(!p)return null;
    const finalizado=ins.clase_finalizada||!!p.finalizado;
    const pendienteConfirmacion=!!ins.clase_finalizada&&!ins.alumno_confirmada;
    const ti=tiempoInfo(p,ins);
    const tieneNotif=pubsNotifPend.has(p.id);
    const borderColor=pendienteConfirmacion?"#FFB84D":(tieneNotif?C.accent:C.border);
    return(
      <div key={ins.id} style={{background:C.card,border:`1px solid ${borderColor}`,borderRadius:14,padding:"14px 18px",display:"flex",gap:13,alignItems:"center",flexWrap:"wrap",transition:"border-color .15s"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=pendienteConfirmacion?"#FF9800":C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=borderColor}>
        <div onClick={()=>{marcarNotifPubLeida(p.id);onOpenCurso(p);}} style={{display:"flex",gap:12,alignItems:"center",flex:1,minWidth:0,cursor:"pointer"}}>
          <div style={{width:44,height:44,borderRadius:11,background:finalizado?"#4ECB7115":tieneNotif?C.accentDim:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,position:"relative"}}>
            {finalizado?"✓":"·"}
            {tieneNotif&&<span style={{position:"absolute",top:-4,right:-4,background:C.danger,color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>!</span>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titulo}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:3}}>{p.materia} · {p.autor_nombre||safeDisplayName(p.autor_nombre,p.autor_email)}</div>
            {pendienteConfirmacion&&<span style={{fontSize:11,color:"#FF9800",fontWeight:700}}>⏳ El docente marcó la clase como finalizada — confirmá si la recibiste</span>}
            {!pendienteConfirmacion&&tieneNotif&&<span style={{fontSize:11,color:C.accent,fontWeight:700}}>🔔 Clase finalizada — dejá tu reseña</span>}
            {!pendienteConfirmacion&&!tieneNotif&&(ti?<span style={{fontSize:11,color:ti.color,fontWeight:600}}>{ti.icon} {ti.texto}</span>
              :<span style={{fontSize:11,color:C.muted}}>Inscripto {fmt(ins.created_at)}</span>)}
          </div>
        </div>
        {pendienteConfirmacion&&(
          <button onClick={(e)=>{e.stopPropagation();confirmarClaseAlumno(ins);}}
            style={{background:"#4ECB71",color:"#fff",border:"none",borderRadius:9,padding:"7px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,flexShrink:0}}>
            ✓ Confirmar
          </button>
        )}
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
