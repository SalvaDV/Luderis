import React, { useState, useEffect } from "react";
import * as sb from "../supabase";
import { C, FONT } from "../shared";

export default function PostChatBtn({post,session,onOpenChat}){
  const [permitido,setPermitido]=useState(null);
  const [estadoOferta,setEstadoOferta]=useState(null);// null | "pendiente" | "rechazada" | "aceptada"
  const miEmail=session.user.email;
  useEffect(()=>{
    if(post.autor_email===miEmail){setPermitido(false);return;}
    if(post.tipo==="busqueda"){
      sb.getMisOfertas(miEmail,session.access_token).then(ofertas=>{
        const mia=ofertas.find(o=>o.busqueda_id===post.id);
        if(!mia){setEstadoOferta(null);setPermitido(false);return;}
        setEstadoOferta(mia.estado);
        setPermitido(mia.estado==="aceptada");
      }).catch(()=>setPermitido(false));
      return;
    }
    // Permitir a inscriptos Y co-docentes (ayudantes) — sin traer todas las pubs
    Promise.all([
      sb.getMisInscripciones(miEmail,session.access_token).catch(()=>[]),
      sb.getPublicaciones({autor:post.autor_email},session.access_token).catch(()=>[]),
    ]).then(([ins,pubs])=>{
      const estaInscripto=ins.some(i=>i.publicacion_id===post.id);
      if(estaInscripto){setPermitido(true);return;}
      const pub=pubs.find(p=>p.id===post.id);
      const esAyud=(pub?.ayudantes||[]).includes(session.user.id);
      setPermitido(esAyud);
    }).catch(()=>setPermitido(false));
  },[post.id,post.tipo,post.autor_email,miEmail,session.access_token]);
  if(permitido===null)return null;
  if(!permitido){
    if(post.tipo==="busqueda"){
      if(estadoOferta==="pendiente")return<span style={{fontSize:11,color:C.warn,fontStyle:"italic"}}>⏳ Pendiente de respuesta</span>;
      if(estadoOferta==="rechazada")return<span style={{fontSize:11,color:C.danger,fontStyle:"italic"}}>✗ Oferta rechazada</span>;
      return<span style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>Ofertá para chatear</span>;
    }
    return<span style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>Inscribite para chatear</span>;
  }
  return <button onClick={e=>{e.stopPropagation();onOpenChat(post);}} style={{background:C.accent,color:"#fff",border:"none",borderRadius:9,padding:"5px 12px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT}}>Contactar</button>;
}
