import React, { useState, useEffect } from "react";
import { C, Spinner, Btn, Modal, logError, toast } from "../shared";
import * as sb from "../supabase";

export default function FinalizarClaseModal({post,session,onClose,onFinalizado}){
  const [inscripciones,setInscripciones]=useState([]);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);
  const [confirmando,setConfirmando]=useState(false);
  useEffect(()=>{
    let mounted=true;
    sb.getInscripciones(post.id,session.access_token)
      .then(ins=>{if(mounted)setInscripciones(ins.filter(i=>!i.clase_finalizada));})
      .finally(()=>{if(mounted)setLoading(false);});
    return()=>{mounted=false;};
  },[post.id,session.access_token]);// eslint-disable-line
  const finalizar=async()=>{setSaving(true);try{
    const ahora=new Date().toISOString();
    await sb.updatePublicacion(post.id,{finalizado:true},session.access_token);
    await Promise.all(inscripciones.map(ins=>sb.updateInscripcion(ins.id,{clase_finalizada:true,fecha_finalizacion:ahora},session.access_token)));
    await Promise.all(inscripciones.map(ins=>sb.insertNotificacion({
      usuario_id:ins.alumno_id||null,
      alumno_email:ins.alumno_email,
      tipo:"confirmar_clase",
      publicacion_id:post.id,
      pub_titulo:post.titulo,
      leida:false,
    },session.access_token).catch(e=>logError("notif confirmar_clase",e))));
    onFinalizado();onClose();
  }catch(e){toast("Error al finalizar: "+e.message,"error");}finally{setSaving(false);}};
  return(
    <Modal onClose={onClose} width="min(420px,95vw)">
      <div style={{padding:"20px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>Marcar clases finalizadas</h3><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button></div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",marginBottom:14,fontSize:12,color:C.muted}}>Publicación: <span style={{color:C.text,fontWeight:600}}>{post.titulo}</span></div>
        {loading?<Spinner/>:inscripciones.length===0?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No hay alumnos con clase pendiente.</div>:(
          confirmando?(
            <>
              <div style={{background:"#FFF3E0",border:"1px solid #FFB74D",borderRadius:10,padding:"12px 14px",marginBottom:14,fontSize:13,color:"#E65100"}}>
                ¿Confirmás que la clase finalizó? Se notificará a <strong>{inscripciones.length} alumno{inscripciones.length!==1?"s":""}</strong> para que confirmen el pago. Esta acción no se puede deshacer.
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn onClick={()=>setConfirmando(false)} variant="ghost" style={{flex:1,padding:"10px"}}>Cancelar</Btn>
                <Btn onClick={finalizar} disabled={saving} variant="success" style={{flex:1,padding:"10px"}}>{saving?"Procesando...":"Sí, finalizar"}</Btn>
              </div>
            </>
          ):(
            <>
              <div style={{color:C.muted,fontSize:13,marginBottom:12}}>Se notificará a <strong style={{color:C.text}}>{inscripciones.length} alumno{inscripciones.length!==1?"s":""}</strong> para que confirmen que recibieron la clase.</div>
              <Btn onClick={()=>setConfirmando(true)} variant="success" style={{width:"100%",padding:"10px"}}>Marcar como finalizada</Btn>
            </>
          )
        )}
      </div>
    </Modal>
  );
}
