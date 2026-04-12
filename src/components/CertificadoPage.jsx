import React, { useState, useEffect } from "react";
import { C, FONT } from "../shared";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://hptdyehzqfpgtrpuydny.supabase.co";
const ANON_KEY = process.env.REACT_APP_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g";

export default function CertificadoPage({certId,onClose}){
  const [cert,setCert]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);

  useEffect(()=>{
    if(!certId)return;
    let mounted=true;
    fetch(`${SUPABASE_URL}/rest/v1/certificados?id=eq.${encodeURIComponent(certId)}&select=*`,{
      headers:{"apikey":ANON_KEY,"Authorization":`Bearer ${ANON_KEY}`}
    })
    .then(r=>r.json())
    .then(data=>{
      if(!mounted)return;
      if(data?.[0])setCert(data[0]);
      else setError("Certificado no encontrado. Verificá el ID.");
    })
    .catch(()=>{if(mounted)setError("Error al verificar el certificado.");})
    .finally(()=>{if(mounted)setLoading(false);});
    return()=>{mounted=false;};
  },[certId]);

  const fecha=cert?new Date(cert.fecha_emision).toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"}):null;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:FONT}} onClick={onClose}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,width:"min(520px,96vw)",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#0F3F7A,#1A6ED8,#2EC4A0)",padding:"24px 28px",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:12,right:14,background:"none",border:"none",color:"rgba(255,255,255,.7)",fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:36}}>🎓</span>
            <div>
              <div style={{color:"#fff",fontWeight:800,fontSize:18}}>Verificación de Certificado</div>
              <div style={{color:"rgba(255,255,255,.7)",fontSize:12}}>Luderis — Plataforma Educativa Argentina</div>
            </div>
          </div>
        </div>

        <div style={{padding:"24px 28px"}}>
          {loading&&(
            <div style={{textAlign:"center",padding:"32px 0"}}>
              <div style={{width:32,height:32,border:`3px solid ${C.accent}`,borderTop:"3px solid transparent",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 12px"}}/>
              <div style={{color:C.muted,fontSize:14}}>Verificando certificado…</div>
            </div>
          )}

          {error&&(
            <div style={{textAlign:"center",padding:"24px 0"}}>
              <div style={{fontSize:40,marginBottom:12}}>❌</div>
              <div style={{color:C.danger,fontWeight:700,fontSize:15,marginBottom:8}}>Certificado inválido</div>
              <div style={{color:C.muted,fontSize:13}}>{error}</div>
            </div>
          )}

          {cert&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {/* Badge verificado */}
              <div style={{background:"#2EC4A012",border:"1px solid #2EC4A040",borderRadius:12,padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}>✅</span>
                <div>
                  <div style={{fontWeight:700,color:"#0F6E56",fontSize:14}}>Certificado verificado</div>
                  <div style={{fontSize:11,color:C.muted}}>Este documento es auténtico y fue emitido por Luderis</div>
                </div>
              </div>

              {/* Datos */}
              {[
                {label:"Alumno",value:cert.alumno_nombre,icon:"👤",big:true},
                {label:"Curso completado",value:cert.curso_titulo,icon:"📚",big:true},
                {label:"Materia",value:cert.materia,icon:"🏷️"},
                {label:"Docente",value:cert.docente_nombre,icon:"🎓"},
                {label:"Fecha de emisión",value:fecha,icon:"📅"},
                {label:"ID del certificado",value:cert.id,icon:"🔑",mono:true},
              ].filter(d=>d.value).map(({label,value,icon,big,mono})=>(
                <div key={label} style={{background:C.bg,borderRadius:10,padding:"10px 14px",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:.4,marginBottom:3,textTransform:"uppercase"}}>{icon} {label}</div>
                  <div style={{fontSize:big?16:14,fontWeight:big?700:500,color:C.text,fontFamily:mono?"monospace":FONT}}>{value}</div>
                </div>
              ))}

              <div style={{textAlign:"center",fontSize:11,color:C.muted,marginTop:4}}>
                Emitido por <strong>Luderis</strong> · luderis.com
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
