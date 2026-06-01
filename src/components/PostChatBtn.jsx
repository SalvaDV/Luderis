import React, { useState, useEffect } from "react";
import { Clock, X } from "lucide-react";
import * as sb from "../supabase";
import { C, FONT } from "../shared";

export default function PostChatBtn({post,session,onOpenChat,grad,accent}){
  const [permitido,setPermitido]=useState(null);
  const [estadoOferta,setEstadoOferta]=useState(null);// null | "pendiente" | "rechazada" | "aceptada"
  const miEmail=session.user.email;
  useEffect(()=>{
    if(post.autor_email===miEmail){setPermitido(false);return;}
    let mounted=true;
    if(post.tipo==="busqueda"){
      sb.getMisOfertas(miEmail,session.access_token).then(ofertas=>{
        if(!mounted)return;
        const mia=ofertas.find(o=>o.busqueda_id===post.id);
        if(!mia){setEstadoOferta(null);setPermitido(false);return;}
        setEstadoOferta(mia.estado);
        setPermitido(mia.estado==="aceptada");
      }).catch(()=>{if(mounted)setPermitido(false);});
      return()=>{mounted=false;};
    }
    // Permitir a inscriptos Y co-docentes (ayudantes)
    const esAyud=(post.ayudantes||[]).includes(session.user.id);
    if(esAyud){setPermitido(true);return()=>{mounted=false;};}
    sb.getMisInscripciones(miEmail,session.access_token).then(ins=>{
      if(!mounted)return;
      setPermitido(ins.some(i=>i.publicacion_id===post.id));
    }).catch(()=>{if(mounted)setPermitido(false);});
    return()=>{mounted=false;};
  },[post.id,post.tipo,post.autor_email,miEmail,session.access_token]);// eslint-disable-line react-hooks/exhaustive-deps
  if(permitido===null)return null;
  if(!permitido){
    if(post.tipo==="busqueda"){
      if(estadoOferta==="pendiente")return<span style={{fontSize:11,color:C.warn,fontStyle:"italic",display:"inline-flex",alignItems:"center",gap:3}}><Clock size={10} strokeWidth={2}/>Pendiente de respuesta</span>;
      if(estadoOferta==="rechazada")return<span style={{fontSize:11,color:C.danger,fontStyle:"italic",display:"inline-flex",alignItems:"center",gap:3}}><X size={10} strokeWidth={2.5}/>Oferta rechazada</span>;
      return<span style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>Ofertá para chatear</span>;
    }
    return<span style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>Inscribite para chatear</span>;
  }
  return <button onClick={e=>{e.stopPropagation();onOpenChat(post);}} style={{background:grad||C.accent,color:"#fff",border:"none",borderRadius:9,padding:"5px 12px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,boxShadow:`0 2px 8px ${accent||C.accent}40`}}>Contactar</button>;
}
