import React from "react";
import * as sb from "../supabase";
import { C, FONT } from "../shared";

// Extraído de PostFormModal.jsx: MiCuentaPage lo importaba estáticamente y eso
// arrastraba todo PostFormModal (incl. PerfilPage) a su chunk, rompiendo el
// code-splitting (INEFFECTIVE_DYNAMIC_IMPORT). Vive solo para que el lazy-load
// de PostFormModal sea efectivo.

const STREAK_MILESTONES=[3,7,14,30,60,100,365];
const STREAK_LABELS={3:"3 días 🌱",7:"1 semana 🔥",14:"2 semanas ⚡",30:"1 mes 🏆",60:"2 meses 💎",100:"100 días 🦁",365:"1 año 👑"};

// calcStreak ya no existe en frontend — la fuente de verdad es el servidor (RPC actualizar_streak)

export function StreakBadge({session}){
  const [streak,setStreak]=React.useState(1);
  const [showModal,setShowModal]=React.useState(false);
  const [newMilestone,setNewMilestone]=React.useState(null);

  React.useEffect(()=>{
    // Llamamos al servidor para obtener/actualizar la racha con hora confiable
    if(!session?.user?.id||!session?.access_token)return;
    sb.actualizarStreak(session.user.id,session.access_token)
      .then(dias=>{
        const n=typeof dias==="number"?dias:1;
        setStreak(n);
        // Detectar si acabamos de alcanzar un milestone
        const prev=parseInt(localStorage.getItem(`cl_streak_prev_${session.user.id}`)||"0");
        if(STREAK_MILESTONES.includes(n)&&n>prev){
          setNewMilestone(n);
          localStorage.setItem(`cl_streak_prev_${session.user.id}`,String(n));
          setTimeout(()=>setNewMilestone(null),5000);
        }
      })
      .catch(()=>{}); // fire & forget: si falla el RPC, el badge queda en 1
  },[session?.user?.id,session?.access_token]);

  const nextMilestone=STREAK_MILESTONES.find(m=>m>streak)||null;
  const progress=nextMilestone?(streak/(nextMilestone))*100:100;

  return(
    <>
      <button onClick={()=>setShowModal(true)}
        style={{display:"inline-flex",alignItems:"center",gap:6,background:streak>=7?"linear-gradient(135deg,#E0955C22,#F59E0B22)":"#E0955C12",border:`1px solid ${streak>=7?"#F59E0B55":"#E0955C33"}`,borderRadius:20,padding:"5px 14px",marginBottom:10,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}
        onMouseEnter={e=>e.currentTarget.style.background=streak>=7?"linear-gradient(135deg,#E0955C33,#F59E0B33)":"#E0955C22"}
        onMouseLeave={e=>e.currentTarget.style.background=streak>=7?"linear-gradient(135deg,#E0955C22,#F59E0B22)":"#E0955C12"}>
        <span style={{fontSize:streak>=30?20:streak>=7?18:15}}>{streak>=30?"🏆":streak>=7?"🔥":"🌱"}</span>
        <span style={{fontWeight:700,color:streak>=7?"#B45309":C.warn,fontSize:13}}>{streak} día{streak!==1?"s":""}</span>
        {streak>=3&&<span style={{color:C.muted,fontSize:10}}>en Luderis</span>}
      </button>

      {/* Modal de detalle del streak */}
      {showModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:FONT}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,width:"min(360px,95vw)",padding:"28px 24px"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:48,marginBottom:8}}>{streak>=100?"👑":streak>=30?"🏆":streak>=14?"⚡":streak>=7?"🔥":"🌱"}</div>
              <div style={{fontSize:28,fontWeight:800,color:C.text}}>{streak} día{streak!==1?"s":" "} seguido{streak!==1?"s":""}</div>
              <div style={{color:C.muted,fontSize:13,marginTop:4}}>Tu racha activa en Luderis</div>
            </div>
            {/* Barra de progreso al siguiente milestone */}
            {nextMilestone&&(
              <div style={{marginBottom:20}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:6}}>
                  <span>Progreso</span>
                  <span>Próximo: {STREAK_LABELS[nextMilestone]}</span>
                </div>
                <div style={{height:8,background:C.bg,borderRadius:4,border:`1px solid ${C.border}`}}>
                  <div style={{height:"100%",width:`${Math.min(progress,100)}%`,background:"linear-gradient(90deg,#F59E0B,#E0955C)",borderRadius:4,transition:"width .5s ease"}}/>
                </div>
                <div style={{textAlign:"right",fontSize:11,color:C.muted,marginTop:4}}>{nextMilestone-streak} día{nextMilestone-streak!==1?"s":""} más</div>
              </div>
            )}
            {/* Milestones desbloqueados */}
            <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginBottom:20}}>
              {STREAK_MILESTONES.filter(m=>m<=streak).map(m=>(
                <span key={m} style={{background:"linear-gradient(135deg,#F59E0B,#E0955C)",color:"#fff",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>{STREAK_LABELS[m]}</span>
              ))}
              {STREAK_MILESTONES.filter(m=>m>streak).slice(0,2).map(m=>(
                <span key={m} style={{background:C.bg,border:`1px solid ${C.border}`,color:C.muted,borderRadius:20,padding:"3px 10px",fontSize:11}}>🔒 {STREAK_LABELS[m]}</span>
              ))}
            </div>
            <button onClick={()=>setShowModal(false)}
              style={{width:"100%",background:C.accent,border:"none",borderRadius:12,color:"#fff",padding:"11px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT}}>
              ¡Seguir aprendiendo!
            </button>
          </div>
        </div>
      )}

      {/* Celebración de milestone */}
      {newMilestone&&(
        <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:600,background:"linear-gradient(135deg,#F59E0B,#E0955C)",borderRadius:20,padding:"12px 24px",color:"#fff",fontWeight:700,fontSize:15,boxShadow:"0 8px 30px rgba(245,158,11,.4)",animation:"fadeUp .3s ease",fontFamily:FONT,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:22}}>🎉</span> ¡Lograste {STREAK_LABELS[newMilestone]}!
        </div>
      )}
    </>
  );
}

export default StreakBadge;
