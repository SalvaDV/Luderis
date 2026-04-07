import React, { useState } from "react";
import * as sb from "../supabase";
import { C, FONT, Modal, Btn, Label } from "../shared";

export default function DenunciaModal({post,session,onClose}){
  const [motivo,setMotivo]=useState("");const [detalle,setDetalle]=useState("");const [saving,setSaving]=useState(false);const [ok,setOk]=useState(false);
  const MOTIVOS=["El profesor no se presentó","No hay contenido publicado","El contenido es incorrecto o engañoso","Comportamiento inapropiado","Publicación falsa o fraudulenta","Otro"];
  const enviar=async()=>{if(!motivo)return;setSaving(true);try{await sb.insertDenuncia({publicacion_id:post.id,denunciante_id:session.user.id,denunciante_email:session.user.email,motivo,detalle,autor_email:post.autor_email},session.access_token);setOk(true);}catch{setOk(true);}finally{setSaving(false);}};
  return(
    <Modal onClose={onClose} width="min(440px,95vw)">
      <div style={{padding:"20px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{color:C.danger,margin:0,fontSize:16,fontWeight:700}}>⚑ Denunciar publicación</h3><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",padding:"8px 12px",margin:"-8px -8px -8px 0",borderRadius:8,lineHeight:1,minWidth:44,minHeight:44,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button></div>
        {ok?(<div style={{textAlign:"center",padding:"24px 0"}}><div style={{color:C.success,fontWeight:700,fontSize:15,marginBottom:8}}>Denuncia enviada</div><div style={{color:C.muted,fontSize:13}}>Revisaremos tu reporte.</div><Btn onClick={onClose} style={{marginTop:16}}>Cerrar</Btn></div>):(
          <><div style={{background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:10,padding:"10px 13px",marginBottom:14,fontSize:12,color:C.muted}}>Publicación: <span style={{color:C.text,fontWeight:600}}>{post.titulo}</span></div>
          <Label>Motivo</Label>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:12}}>{MOTIVOS.map(m=>(<button key={m} onClick={()=>setMotivo(m)} style={{background:motivo===m?"#E05C5C22":C.card,border:`1px solid ${motivo===m?C.danger:C.border}`,borderRadius:9,padding:"9px 12px",color:motivo===m?C.danger:C.muted,fontSize:12,cursor:"pointer",fontFamily:FONT,textAlign:"left"}}>{m}</button>))}</div>
          <Label>Detalles (opcional)</Label>
          <textarea value={detalle} onChange={e=>setDetalle(e.target.value)} placeholder="Describí lo que ocurrió..." style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",resize:"vertical",minHeight:65,boxSizing:"border-box",fontFamily:FONT,marginBottom:12}}/>
          <Btn onClick={enviar} disabled={saving||!motivo} variant="danger" style={{width:"100%",padding:"10px"}}>{saving?"Enviando...":"Enviar denuncia"}</Btn></>
        )}
      </div>
    </Modal>
  );
}
