import React from "react";
import { C, LUD, Avatar } from "../shared";

export default function LeaderboardView({posts,reseñasMap,reseñasUserMap,onOpenPerfil,filtroMateria}){
  // Agrupar por autor y calcular score
  const docentes=React.useMemo(()=>{
    const map={};
    posts.filter(p=>p.tipo==="oferta"&&p.activo!==false).forEach(p=>{
      const email=p.autor_email;
      if(!map[email])map[email]={
        email,nombre:p.autor_nombre||p.autor_display_name||email.split("@")[0],
        pubs:[],totalInscriptos:0,avgRating:0,materias:new Set(),
      };
      map[email].pubs.push(p);
      map[email].materias.add(p.materia||"");
    });
    return Object.values(map).map(d=>{
      const avgUser=reseñasUserMap[d.email];
      const totalReseñas=d.pubs.reduce((a,p)=>{const r=reseñasMap[p.id];return a+(r?.count||0);},0);
      const score=Math.round(
        (avgUser||0)*20 +                     // rating (max 100)
        Math.min(d.pubs.length,10)*5 +        // publicaciones (max 50)
        Math.min(totalReseñas,20)*2            // reseñas (max 40)
      );
      return{...d,avgUser:avgUser||0,totalReseñas,score,materias:[...d.materias].filter(Boolean).slice(0,3)};
    }).sort((a,b)=>b.score-a.score||b.avgUser-a.avgUser);
  },[posts,reseñasMap,reseñasUserMap]);

  // Filtrar por materia si hay filtro activo
  const visibles=filtroMateria
    ?docentes.filter(d=>d.materias.includes(filtroMateria))
    :docentes;

  const MEDALLAS=["🥇","🥈","🥉"];

  if(!visibles.length)return(
    <div style={{textAlign:"center",padding:"48px 0",color:C.muted,fontSize:14}}>
      No hay docentes en esta materia todavía.
    </div>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{background:LUD.grad,borderRadius:14,padding:"14px 18px",marginBottom:4,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:24}}>🏆</span>
        <div>
          <div style={{fontWeight:800,color:"#fff",fontSize:15}}>Ranking de docentes</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.75)"}}>Basado en rating, publicaciones y reseñas{filtroMateria?` · ${filtroMateria}`:""}</div>
        </div>
      </div>
      {visibles.slice(0,20).map((d,i)=>(
        <div key={d.email} onClick={()=>onOpenPerfil&&onOpenPerfil(d.email)}
          style={{background:i<3?"linear-gradient(135deg,"+["#FFF9E6","#F0F4FF","#F4FFF4"][i]+","+C.surface+")":C.surface,border:`1px solid ${i<3?["#F59E0B40","#1A6ED840","#2EC4A040"][i]:C.border}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",gap:14,alignItems:"center",transition:"box-shadow .15s"}}
          onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,.1)"}
          onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
          {/* Posición */}
          <div style={{width:36,height:36,borderRadius:"50%",background:i<3?["linear-gradient(135deg,#F59E0B,#D97706)","linear-gradient(135deg,#94A3B8,#64748B)","linear-gradient(135deg,#CD7F32,#A0522D)"][i]:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:i<3?18:14,color:i<3?"#fff":C.muted,flexShrink:0}}>
            {i<3?MEDALLAS[i]:i+1}
          </div>
          {/* Avatar */}
          <Avatar letra={d.nombre[0]} size={44}/>
          {/* Info */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:2}}>{d.nombre}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {d.avgUser>0&&<span style={{fontSize:12,color:"#F59E0B",fontWeight:700}}>★ {d.avgUser.toFixed(1)}</span>}
              <span style={{fontSize:11,color:C.muted}}>{d.pubs.length} clase{d.pubs.length!==1?"s":""}</span>
              {d.totalReseñas>0&&<span style={{fontSize:11,color:C.muted}}>{d.totalReseñas} reseña{d.totalReseñas!==1?"s":""}</span>}
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>
              {d.materias.map(m=><span key={m} style={{fontSize:10,background:C.accentDim,color:C.accent,borderRadius:20,padding:"1px 7px",fontWeight:600}}>{m}</span>)}
            </div>
          </div>
          {/* Score */}
          <div style={{textAlign:"center",flexShrink:0}}>
            <div style={{fontSize:20,fontWeight:800,color:i<3?["#F59E0B","#64748B","#CD7F32"][i]:C.accent}}>{d.score}</div>
            <div style={{fontSize:9,color:C.muted,fontWeight:600}}>pts</div>
          </div>
        </div>
      ))}
      <div style={{textAlign:"center",fontSize:11,color:C.muted,padding:"8px 0"}}>
        El ranking se actualiza en tiempo real basado en reseñas y actividad.
      </div>
    </div>
  );
}
