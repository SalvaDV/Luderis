import React, { useState, useEffect, useRef } from "react";
import { C, FONT, Spinner, fmtRel, logError } from "../shared";
import * as sb from "../supabase";

export default function NotifPanel({session,open,onClose,onOpenDetail,onOpenCurso}){
  const [notifs,setNotifs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("todas");

  const autoMarkTimer=useRef(null);
  useEffect(()=>{
    if(!open)return;
    setLoading(true);
    sb.getTodasNotificaciones(session.user.email,session.access_token).then(data=>{
      setNotifs((data||[]).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)));
      autoMarkTimer.current=setTimeout(()=>{
        sb.marcarTodasNotifsLeidas(session.user.email,session.access_token).catch(e=>logError("auto marcar notifs leídas",e));
        setNotifs(p=>p.map(n=>({...n,leida:true})));
      },2000);
    }).catch(e=>logError("cargar notificaciones",e)).finally(()=>setLoading(false));
    return()=>clearTimeout(autoMarkTimer.current);
  },[open,session.user.email,session.access_token]);

  const marcarTodo=async()=>{
    clearTimeout(autoMarkTimer.current);
    await sb.marcarTodasNotifsLeidas(session.user.email,session.access_token).catch(e=>logError("marcar todo leído",e));
    setNotifs(p=>p.map(n=>({...n,leida:true})));
  };

  const TIPO_INFO={
    nueva_inscripcion:{icon:"🎓",color:"#2EC4A0",label:"Nueva inscripción"},
    nueva_oferta:{icon:"📩",color:"#1A6ED8",label:"Nueva oferta"},
    oferta_aceptada:{icon:"✅",color:"#2EC4A0",label:"Oferta aceptada"},
    oferta_rechazada:{icon:"❌",color:"#E53E3E",label:"Oferta rechazada"},
    contraoferta:{icon:"🔄",color:"#F59E0B",label:"Contraoferta"},
    nuevo_mensaje:{icon:"💬",color:"#7B3FBE",label:"Mensaje nuevo"},
    chat_grupal:{icon:"💬",color:"#1A6ED8",label:"Mensaje en grupo"},
    clase_iniciada:{icon:"📹",color:"#C80000",label:"¡Clase en vivo!"},
    nuevo_contenido:{icon:"📚",color:"#1A6ED8",label:"Nuevo contenido"},
    nuevo_ayudante:{icon:"🤝",color:"#2EC4A0",label:"Co-docente agregado"},
    valorar_curso:{icon:"⭐",color:"#F59E0B",label:"Valorar curso"},
    alerta_publicacion:{icon:"🔔",color:"#1A6ED8",label:"Alerta de búsqueda"},
    pago_aprobado_mp:{icon:"💳",color:"#009EE3",label:"Pago aprobado"},
    sistema:{icon:"📣",color:"#7B3FBE",label:"Anuncio de Luderis"},
  };

  const tabs=[
    {id:"todas",label:"Todas"},
    {id:"noLeidas",label:"Sin leer"},
  ];

  const filtradas=notifs.filter(n=>tab==="noLeidas"?!n.leida:true);
  const sinLeer=notifs.filter(n=>!n.leida).length;

  if(!open)return null;
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:498}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:"min(380px,100vw)",background:C.surface,borderLeft:`1px solid ${C.border}`,zIndex:499,display:"flex",flexDirection:"column",boxShadow:"-4px 0 24px rgba(0,0,0,.12)",animation:"slideInRight .2s ease",fontFamily:FONT}}>
        <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{padding:"18px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div style={{fontWeight:700,color:C.text,fontSize:17}}>🔔 Notificaciones</div>
            {sinLeer>0&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{sinLeer} sin leer</div>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {sinLeer>0&&<button onClick={marcarTodo} style={{background:"none",border:"none",color:C.accent,fontSize:12,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>Marcar todo leído</button>}
            <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:1,padding:"10px",border:"none",background:"none",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:tab===t.id?700:400,color:tab===t.id?C.accent:C.muted,borderBottom:`2px solid ${tab===t.id?C.accent:"transparent"}`,marginBottom:-1,transition:"all .15s"}}>
              {t.label}{t.id==="noLeidas"&&sinLeer>0?` (${sinLeer})`:""}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          {loading?<Spinner/>:filtradas.length===0?(
            <div style={{textAlign:"center",padding:"48px 24px"}}>
              <div style={{fontSize:40,marginBottom:12}}>🔔</div>
              <div style={{color:C.muted,fontSize:14}}>{tab==="noLeidas"?"Todo leído ✓":"Sin notificaciones aún"}</div>
            </div>
          ):(
            filtradas.map((n,i)=>{
              const info=TIPO_INFO[n.tipo]||{icon:"📌",color:C.muted,label:n.tipo};
              return(
                <div key={n.id||i}
                  onClick={()=>{
                    if(n.publicacion_id){
                      sb.db(`notificaciones?id=eq.${n.id}`,"PATCH",{leida:true},session.access_token,"return=minimal").catch(()=>{});
                      setNotifs(p=>p.map(x=>x.id===n.id?{...x,leida:true}:x));
                      onClose();
                    }
                  }}
                  style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,cursor:n.publicacion_id?"pointer":"default",background:n.leida?"transparent":C.accentDim+"80",display:"flex",gap:12,alignItems:"flex-start",transition:"background .12s"}}
                  onMouseEnter={e=>{if(n.publicacion_id)e.currentTarget.style.background=C.bg;}}
                  onMouseLeave={e=>e.currentTarget.style.background=n.leida?"transparent":C.accentDim+"80"}>
                  {/* Icono */}
                  <div style={{width:40,height:40,borderRadius:"50%",background:info.color+"18",border:`1px solid ${info.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                    {info.icon}
                  </div>
                  {/* Contenido */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:n.leida?400:700,color:C.text,fontSize:13,marginBottom:2}}>{info.label}</div>
                    <div style={{fontSize:12,color:C.muted,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.pub_titulo||""}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:4}}>{fmtRel(n.created_at)}</div>
                  </div>
                  {!n.leida&&<div style={{width:8,height:8,borderRadius:"50%",background:C.accent,flexShrink:0,marginTop:4}}/>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
