import React from "react";
import { C, FONT } from "../shared";

export default function BusquedaIA({onBuscar,iaLoading,onClose,seccion}){
  const [q,setQ]=React.useState("");
  const submit=()=>{if(q.trim()){onBuscar(q.trim());onClose();}};
  const esPedidos=seccion==="pedidos";
  const esClases=seccion==="clases";
  const iaDesc=esPedidos
    ?"Describí qué sabés enseñar. La IA va a encontrar los pedidos de alumnos más afines a vos."
    :esClases
    ?"Describí qué querés aprender. La IA va a buscar los mejores docentes disponibles."
    :"Describí qué querés aprender. La IA va a buscar los cursos más relevantes.";
  const iaPlaceholder=esPedidos
    ?"Ej: quiero dar clases de inglés a adultos principiantes en CABA…"
    :esClases
    ?"Ej: clases de guitarra para principiantes, presencial en Palermo…"
    :"Ej: Python para principiantes con seguimiento y ejercicios prácticos…";
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"8px",fontFamily:FONT}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,width:"min(480px,calc(100vw - 24px))",boxShadow:"0 8px 40px rgba(0,0,0,.2)",overflow:"hidden"}}>
        <div style={{padding:"20px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:15,fontWeight:700,color:C.text}}>✨ Buscar con IA</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>×</button>
        </div>
        <div style={{padding:"12px 20px 20px"}}>
          <p style={{fontSize:13,color:C.muted,margin:"0 0 12px"}}>{iaDesc}</p>
          <textarea value={q} onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}}
            placeholder={iaPlaceholder}
            autoFocus rows={3}
            style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 13px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,resize:"none",boxSizing:"border-box",marginBottom:10}}/>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button onClick={onClose} style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${C.border}`,background:"none",color:C.muted,fontSize:13,cursor:"pointer",fontFamily:FONT}}>Cancelar</button>
            <button onClick={submit} disabled={!q.trim()||iaLoading}
              style={{padding:"8px 18px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#7B3FBE,#1A6ED8)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT,opacity:(!q.trim()||iaLoading)?.5:1}}>
              {iaLoading?"Buscando…":"Buscar →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
