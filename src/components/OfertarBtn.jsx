import React, { useState, useEffect } from "react";
import * as sb from "../supabase";
import { C, FONT, Label, Btn } from "../shared";

export default function OfertarBtn({post,session}){
  const [open,setOpen]=useState(false);const [precio,setPrecio]=useState("");const [tipo,setTipo]=useState("hora");const [msg,setMsg]=useState("");const [saving,setSaving]=useState(false);const [ok,setOk]=useState(false);
  const [miOferta,setMiOferta]=useState(null);// null=cargando, obj=encontrada, false=no hay
  useEffect(()=>{
    if(post.tipo!=="busqueda"||post.autor_email===session.user.email)return;
    let mounted=true;
    sb.getMisOfertas(session.user.email,session.access_token).then(ofertas=>{
      if(!mounted)return;
      // Buscar la más reciente sobre esta búsqueda (cualquier estado)
      const mia=ofertas.filter(o=>o.busqueda_id===post.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
      setMiOferta(mia||false);
    }).catch(()=>{if(mounted)setMiOferta(false);});
    return()=>{mounted=false;};
  },[post.id,session.user.email,session.access_token]); // eslint-disable-line
  // Solo para búsquedas de clases particulares — cursos tienen precio fijo
  if(post.tipo!=="busqueda"||post.autor_email===session.user.email||post.activo===false||post.finalizado)return null;
  if(post.modo==="curso")return null;
  if(miOferta===null)return null;// cargando
  if(miOferta&&miOferta.estado==="pendiente"){
    const diasEspera=miOferta.created_at?Math.floor((Date.now()-new Date(miOferta.created_at))/86400000):null;
    return(
      <div style={{display:"flex",flexDirection:"column",gap:3,alignSelf:"center"}}>
        <span style={{fontSize:12,color:C.warn,fontStyle:"italic"}}>Tu oferta está pendiente de respuesta</span>
        {diasEspera!==null&&<span style={{fontSize:10,color:C.muted}}>Enviada {diasEspera===0?"hoy":diasEspera===1?"hace 1 día":`hace ${diasEspera} días`}</span>}
      </div>
    );
  }
  if(miOferta&&miOferta.estado==="rechazada"){
    return<span style={{fontSize:12,color:C.danger,fontStyle:"italic",alignSelf:"center"}}>Tu oferta fue rechazada</span>;
  }
  const cerrar=()=>setOpen(false);
  const enviar=async()=>{
    if(!msg.trim())return;setSaving(true);
    try{
      const payload={busqueda_id:post.id,busqueda_autor_email:post.autor_email,busqueda_titulo:post.titulo,busqueda_materia:post.materia||null,ofertante_id:session.user.id,ofertante_email:session.user.email,ofertante_nombre:sb.getDisplayName(session.user.email),precio:precio?parseFloat(precio):null,precio_tipo:tipo,mensaje:msg,leida:false};
      await sb.insertOfertaBusq(payload,session.access_token);
      // Notificar al dueño de la búsqueda que recibió una nueva oferta
      sb.insertNotificacion({usuario_id:null,alumno_email:post.autor_email,tipo:"nueva_oferta",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      // Email al dueño de la búsqueda
      sb.sendEmail("oferta_recibida",post.autor_email,{pub_titulo:post.titulo,pub_id:post.id,docente_nombre:sb.getDisplayName(session.user.email)||session.user.email.split("@")[0],mensaje:msg},session.access_token).catch(()=>{});
      setOk(true);
      // Actualizar estado local y cerrar el popup
      setMiOferta({busqueda_id:post.id,estado:"pendiente",created_at:new Date().toISOString()});
      cerrar();
    }catch(e){
      const msg2=e.message||"";
      if(msg2.includes("estado"))alert("Error de esquema: la columna 'estado' no existe. Pedí al admin que ejecute el SQL de actualización.");
      else alert("Error: "+msg2);
    }finally{setSaving(false);}
  };
  const iS={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:9};
  return(
    <>
      <button onClick={e=>{e.stopPropagation();setOpen(true);}} style={{background:"#5CA8E022",border:"1px solid #5CA8E044",borderRadius:10,color:C.info,padding:"7px 14px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT}}>Ofertar mis clases</button>
      {open&&(
        <div style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:FONT,boxSizing:"border-box"}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,width:"min(430px,92vw)",padding:"24px"}} onClick={e=>e.stopPropagation()}>
            {ok?(<div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:38,marginBottom:10}}>✓</div><div style={{color:C.success,fontWeight:700,fontSize:15}}>¡Oferta enviada!</div><div style={{color:C.muted,fontSize:12,marginTop:6}}>El estudiante verá tu propuesta.</div></div>):(<>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>Ofertá tus clases</h3><button onClick={cerrar} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer",fontFamily:FONT}}>×</button></div>
              <div style={{background:C.card,borderRadius:9,padding:"9px 12px",marginBottom:13,fontSize:12,color:C.muted}}>Para: <span style={{color:C.text,fontWeight:600}}>{post.titulo}</span></div>
              <Label>Precio (opcional)</Label>
              <div style={{display:"flex",gap:7,marginBottom:9}}><input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Precio" type="number" min="0" style={{...iS,margin:0,flex:2}}/><select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...iS,margin:0,flex:1,cursor:"pointer"}}><option value="hora">/ hora</option><option value="clase">/ clase</option><option value="mes">/ mes</option></select></div>
              <Label>Mensaje al estudiante</Label>
              <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Contale tu experiencia, disponibilidad..." style={{...iS,minHeight:85,resize:"vertical"}}/>
              <Btn onClick={enviar} disabled={saving||!msg.trim()} style={{width:"100%",padding:"10px"}}>{saving?"Enviando...":"Enviar oferta →"}</Btn>
            </>)}
          </div>
        </div>
      )}
    </>
  );
}
