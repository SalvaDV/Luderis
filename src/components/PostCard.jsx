import React from "react";
import * as sb from "../supabase";
import {
  C, FONT, LUD,
  fmtRel, fmtPrice, fmt,
  safeDisplayName,
  useAutorAvatar,
  Avatar, Tag, MiniStars,
  getPubTipo, TIPO_PUB,
} from "../shared";
import FavBtn from "./FavBtn";
import DocBadge from "./DocBadge";
import ShareBtn from "./ShareBtn";
import PostChatBtn from "./PostChatBtn";

export default function PostCard({post,session,onOpenChat,onOpenDetail,onOpenPerfil,avgPub,countPub,avgUser,yaOferte,fueRechazado,isFav,favId,onFavChange}){
  const nombre=post.autor_nombre||sb.getDisplayName(post.autor_email)||safeDisplayName(post.autor_nombre,post.autor_email)||"Usuario";
  const esMio=post.autor_email===session.user.email;
  const autorAvatar=useAutorAvatar(post.autor_email,session.access_token);
  const T=getPubTipo(post);
  return(
    <div onClick={()=>onOpenDetail(post)} className="cl-card-anim"
      style={{background:post.tipo==="busqueda"?TIPO_PUB.pedido.bg:C.surface,border:`1px solid ${fueRechazado?C.danger+"40":post.tipo==="busqueda"?TIPO_PUB.pedido.border:C.border}`,borderRadius:10,padding:"16px 18px",cursor:"pointer",transition:"box-shadow .18s,border-color .18s",fontFamily:FONT,borderLeft:esMio?`3px solid ${C.accent}`:fueRechazado?`3px solid ${C.danger}`:post.tipo==="busqueda"?`3px solid ${TIPO_PUB.pedido.accent}`:undefined}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 2px 14px ${T.dim}`;e.currentTarget.style.borderColor=fueRechazado?C.danger+"60":T.accent+"50";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=fueRechazado?C.danger+"40":post.tipo==="busqueda"?TIPO_PUB.pedido.border:C.border;}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:8}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-start",minWidth:0}}>
          <Avatar letra={nombre[0]} img={autorAvatar||undefined}/>
          <div style={{minWidth:0,flex:1}}>
            <button onClick={e=>{e.stopPropagation();onOpenPerfil(post.autor_email);}}
              style={{fontWeight:600,color:C.text,fontSize:14,background:"none",border:"none",cursor:"pointer",fontFamily:FONT,padding:0,textAlign:"left",lineHeight:1.3,display:"block"}}
              onMouseEnter={e=>{e.currentTarget.style.color=C.accent;e.currentTarget.style.textDecoration="underline";}}
              onMouseLeave={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.textDecoration="none";}}>
              {nombre}
            </button>
            {post.tipo==="oferta"&&<DocBadge avgUser={avgUser} countPub={countPub} post={post}/>}
      {post.tipo==="oferta"&&post.autor_disponible_ahora&&post.autor_disponible_hasta&&new Date(post.autor_disponible_hasta)>new Date()&&(
        <span style={{display:"inline-block",fontSize:10,fontWeight:700,color:"#fff",background:"#16A34A",borderRadius:20,padding:"1px 8px",marginTop:2}}>🟢 Disponible hoy</span>
      )}
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3,flexWrap:"wrap"}}>
              {post.materia&&<span style={{fontSize:13,color:C.muted}}>{post.materia}</span>}
              {post.created_at&&<span style={{fontSize:13,color:C.muted}}>· {fmtRel(post.created_at)}</span>}
              {avgUser&&<MiniStars val={avgUser}/>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <Tag tipo={post.tipo}/>
          {post.created_at&&(()=>{const diff=(Date.now()-new Date(post.created_at));if(diff<86400000)return<span style={{background:LUD.grad,color:"#fff",borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 7px",letterSpacing:.3,boxShadow:"0 2px 6px rgba(26,110,216,.3)"}}>HOY</span>;if(diff<259200000)return<span style={{background:"#2EC4A0",color:"#fff",borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 7px",letterSpacing:.3}}>NUEVO</span>;return null;})()}
          <FavBtn post={post} session={session} onFavChange={onFavChange} isFav={isFav} favId={favId}/>
        </div>
      </div>

      {/* Content */}
      <h3 style={{color:C.text,fontSize:15,fontWeight:600,margin:"0 0 5px",lineHeight:1.35}}>{post.titulo}</h3>
      <p style={{color:C.muted,fontSize:14,lineHeight:1.6,margin:"0 0 10px"}}>{post.descripcion?.slice(0,120)}{post.descripcion?.length>120?"...":""}</p>
      {avgPub&&<div style={{marginBottom:9}}><MiniStars val={avgPub} count={countPub}/></div>}

      {/* Tags info */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {post.precio?<span style={{fontSize:13,fontWeight:800,color:T.accent}}>{fmtPrice(post.precio,post.moneda)}<span style={{fontSize:12,fontWeight:400,color:C.muted}}>{post.precio_tipo&&post.modo!=="curso"?` /${post.precio_tipo}`:""}</span></span>:<span style={{fontSize:13,fontWeight:700,color:C.success}}>Gratis</span>}
        {(post.modo==="grupal"||post.modo==="curso")&&<span style={{fontSize:13,color:TIPO_PUB.curso.accent,background:TIPO_PUB.curso.dim,borderRadius:4,padding:"3px 8px",border:`1px solid ${TIPO_PUB.curso.border}`}}>🎓 Curso</span>}
        {post.modo==="particular"&&<span style={{fontSize:13,color:TIPO_PUB.particular.accent,background:TIPO_PUB.particular.dim,borderRadius:4,padding:"3px 8px",border:`1px solid ${TIPO_PUB.particular.border}`}}>👤 Particular</span>}
        {post.modalidad==="virtual"&&<span style={{fontSize:13,color:C.muted,background:C.bg,borderRadius:4,padding:"3px 8px",border:`1px solid ${C.border}`}}>🌐 Virtual</span>}
        {post.modalidad==="presencial"&&<span style={{fontSize:13,color:C.muted,background:C.bg,borderRadius:4,padding:"3px 8px",border:`1px solid ${C.border}`}}>📍 Presencial</span>}
        {post.modalidad==="mixto"&&<span style={{fontSize:13,color:C.muted,background:C.bg,borderRadius:4,padding:"3px 8px",border:`1px solid ${C.border}`}}>↔ Mixto</span>}
        {post.tiene_prueba&&<span style={{fontSize:12,color:"#0F6E56",fontWeight:700,background:"#2EC4A012",border:"1px solid #2EC4A040",borderRadius:4,padding:"3px 8px"}}>✓ Prueba</span>}
        {(()=>{try{const pqs=JSON.parse(post.paquetes||"[]").filter(p=>p?.clases>0);const mejor=pqs.sort((a,b)=>(b.descuento||0)-(a.descuento||0))[0];return mejor?.descuento>0?<span style={{fontSize:12,color:"#0F6E56",fontWeight:700,background:"#2EC4A012",border:"1px solid #2EC4A040",borderRadius:4,padding:"3px 8px"}}>📦 -{mejor.descuento}%</span>:null;}catch{return null;}})()}
        {post.fecha_inicio&&<span style={{fontSize:13,color:C.muted,background:C.bg,borderRadius:4,padding:"3px 8px",border:`1px solid ${C.border}`}}>Inicia {fmt(post.fecha_inicio)}</span>}
        {yaOferte&&!esMio&&<span style={{fontSize:12,fontWeight:600,padding:"3px 8px",borderRadius:4,background:"#F59E0B12",border:"1px solid #F59E0B30",color:"#B45309"}}>Oferta enviada</span>}
        {fueRechazado&&<span style={{fontSize:12,fontWeight:600,padding:"3px 8px",borderRadius:4,background:C.danger+"12",color:C.danger,border:`1px solid ${C.danger}30`}}>Oferta rechazada</span>}
        {post.tipo==="busqueda"&&post.expires_at&&(()=>{const daysLeft=Math.ceil((new Date(post.expires_at)-new Date())/86400000);if(daysLeft<=3&&daysLeft>0)return(<div style={{fontSize:10,color:"#B45309",fontWeight:600}}>⏱ Expira en {daysLeft} día{daysLeft!==1?"s":""}</div>);return null;})()}
      </div>

      {/* Footer */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid ${C.border}`,paddingTop:10,gap:8}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {post.vistas>0&&<span style={{fontSize:13,color:C.muted}}>{post.vistas} vista{post.vistas!==1?"s":""}</span>}
          {post.cantidad_inscriptos>0&&<span style={{fontSize:13,color:C.muted}}>{post.cantidad_inscriptos} inscripto{post.cantidad_inscriptos!==1?"s":""}</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <ShareBtn post={post}/>
          {!esMio&&<PostChatBtn post={post} session={session} onOpenChat={onOpenChat}/>}
          {esMio&&<span style={{fontSize:13,color:C.muted,fontStyle:"italic"}}>Tu publicación</span>}
        </div>
      </div>
    </div>
  );
}
