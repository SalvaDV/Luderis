import React from "react";
import { GraduationCap, User, Monitor, MapPin, ArrowLeftRight, CheckCircle, Package } from "lucide-react";
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

// Badge pill consistente para todo el card
const Pill=({icon:Icon,label,color,bg,border})=>(
  <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:12,color,background:bg,borderRadius:6,padding:"3px 8px",border:`1px solid ${border}`,fontWeight:500,lineHeight:1.3,flexShrink:0}}>
    {Icon&&<Icon size={10} strokeWidth={2.5}/>}{label}
  </span>
);

export default function PostCard({post,session,onOpenChat,onOpenDetail,onOpenPerfil,avgPub,countPub,avgUser,yaOferte,fueRechazado,isFav,favId,onFavChange}){
  const nombre=post.autor_nombre||sb.getDisplayName(post.autor_email)||safeDisplayName(post.autor_nombre,post.autor_email)||"Usuario";
  const esMio=post.autor_email===session.user.email;
  const autorAvatar=useAutorAvatar(post.autor_email,session.access_token);
  const T=getPubTipo(post);
  return(
    <div onClick={()=>onOpenDetail(post)} className="cl-card-anim"
      style={{
        position:"relative",
        background:esMio
          ?`linear-gradient(150deg,${C.accent}07 0%,${C.surface} 50%)`
          :post.tipo==="busqueda"?TIPO_PUB.pedido.dim:C.surface,
        border:`1px solid ${esMio?C.accent+"35":fueRechazado?C.danger+"40":post.tipo==="busqueda"?TIPO_PUB.pedido.border:C.border}`,
        borderRadius:12,padding:"16px 18px",cursor:"pointer",
        transition:"box-shadow .2s,border-color .2s,transform .15s",
        willChange:"transform",fontFamily:FONT,
        borderLeft:fueRechazado?`3px solid ${C.danger}`:post.tipo==="busqueda"?`3px solid ${TIPO_PUB.pedido.accent}`:undefined,
      }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow=esMio?`0 4px 24px ${C.accent}20,0 1px 6px rgba(0,0,0,.04)`:`0 4px 20px ${T.dim},0 1px 6px rgba(0,0,0,.06)`;e.currentTarget.style.borderColor=esMio?C.accent+"55":fueRechazado?C.danger+"60":T.accent+"40";e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=esMio?C.accent+"35":fueRechazado?C.danger+"40":post.tipo==="busqueda"?TIPO_PUB.pedido.border:C.border;e.currentTarget.style.transform="none";}}
      onMouseDown={e=>e.currentTarget.style.transform="translateY(-1px) scale(0.99)"}
      onMouseUp={e=>e.currentTarget.style.transform="translateY(-2px)"}>

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
              <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:"#fff",background:"#16A34A",borderRadius:20,padding:"2px 8px",marginTop:2}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,.8)",display:"inline-block",flexShrink:0,animation:"pulse 2s infinite"}}/>Disponible hoy
              </span>
            )}
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3,flexWrap:"wrap"}}>
              {post.materia&&<span style={{fontSize:12,color:C.muted}}>{post.materia}</span>}
              {post.created_at&&<span style={{fontSize:12,color:C.muted}}>· {fmtRel(post.created_at)}</span>}
              {avgUser&&<MiniStars val={avgUser}/>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <Tag tipo={post.tipo} modo={post.modo}/>
          {post.created_at&&(()=>{const diff=(Date.now()-new Date(post.created_at));if(diff<86400000)return<span style={{background:LUD.grad,color:"#fff",borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 7px",letterSpacing:.3,boxShadow:"0 2px 6px rgba(26,110,216,.3)"}}>HOY</span>;if(diff<259200000)return<span style={{background:"#2EC4A0",color:"#fff",borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 7px",letterSpacing:.3}}>NUEVO</span>;return null;})()}
          {esMio&&(
            <div style={{background:T.grad,color:"#fff",borderRadius:20,padding:"3px 9px",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",gap:3,boxShadow:`0 2px 8px ${T.accent}50`,letterSpacing:.5,textTransform:"uppercase",flexShrink:0}}>
              <User size={8} strokeWidth={2.5}/>Mía
            </div>
          )}
          <FavBtn post={post} session={session} onFavChange={onFavChange} isFav={isFav} favId={favId}/>
        </div>
      </div>

      {/* Content */}
      <h3 style={{color:C.text,fontSize:15,fontWeight:700,margin:"0 0 4px",lineHeight:1.35}}>{post.titulo}</h3>
      <p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:"0 0 10px"}}>{post.descripcion?.slice(0,130)}{post.descripcion?.length>130?"…":""}</p>
      {avgPub&&<div style={{marginBottom:9}}><MiniStars val={avgPub} count={countPub}/></div>}

      {/* Precio + badges */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
        {post.precio
          ?<span style={{fontSize:14,fontWeight:800,color:T.accent}}>{fmtPrice(post.precio,post.moneda)}{post.precio_tipo&&post.modo!=="curso"&&<span style={{fontSize:12,fontWeight:400,color:C.muted}}> /{post.precio_tipo}</span>}</span>
          :<span style={{fontSize:13,fontWeight:700,color:C.success}}>Gratis</span>}
        <span style={{width:1,height:14,background:C.border,display:"inline-block",flexShrink:0,alignSelf:"center"}}/>
        {(post.modo==="grupal"||post.modo==="curso")&&<Pill icon={GraduationCap} label="Curso" color={TIPO_PUB.curso.accent} bg={TIPO_PUB.curso.dim} border={TIPO_PUB.curso.border}/>}
        {post.modo==="particular"&&<Pill icon={User} label="Particular" color={TIPO_PUB.particular.accent} bg={TIPO_PUB.particular.dim} border={TIPO_PUB.particular.border}/>}
        {post.modalidad==="virtual"&&<Pill icon={Monitor} label="Virtual" color={C.muted} bg={C.bg} border={C.border}/>}
        {post.modalidad==="presencial"&&<Pill icon={MapPin} label="Presencial" color={C.muted} bg={C.bg} border={C.border}/>}
        {post.modalidad==="mixto"&&<Pill icon={ArrowLeftRight} label="Mixto" color={C.muted} bg={C.bg} border={C.border}/>}
        {post.tiene_prueba&&<Pill icon={CheckCircle} label="Prueba gratis" color="#0F6E56" bg="#2EC4A012" border="#2EC4A040"/>}
        {(()=>{try{const pqs=JSON.parse(post.paquetes||"[]").filter(p=>p?.clases>0);const mejor=pqs.sort((a,b)=>(b.descuento||0)-(a.descuento||0))[0];return mejor?.descuento>0?<Pill icon={Package} label={`Pack -${mejor.descuento}%`} color="#0F6E56" bg="#2EC4A012" border="#2EC4A040"/>:null;}catch{return null;}})()}
        {post.fecha_inicio&&<span style={{fontSize:12,color:C.muted,background:C.bg,borderRadius:6,padding:"3px 8px",border:`1px solid ${C.border}`}}>Inicia {fmt(post.fecha_inicio)}</span>}
        {yaOferte&&!esMio&&<span style={{fontSize:12,fontWeight:600,padding:"3px 8px",borderRadius:6,background:"#F59E0B12",border:"1px solid #F59E0B30",color:"#B45309"}}>Oferta enviada</span>}
        {fueRechazado&&<span style={{fontSize:12,fontWeight:600,padding:"3px 8px",borderRadius:6,background:C.danger+"12",color:C.danger,border:`1px solid ${C.danger}30`}}>Oferta rechazada</span>}
        {post.tipo==="busqueda"&&post.expires_at&&(()=>{const d=Math.ceil((new Date(post.expires_at)-new Date())/86400000);if(d<=3&&d>0)return<span style={{fontSize:11,color:"#B45309",fontWeight:600}}>Expira en {d}d</span>;return null;})()}
      </div>

      {/* Footer */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid ${C.border}`,paddingTop:10,gap:8}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {post.vistas>0&&<span style={{fontSize:12,color:C.muted}}>{post.vistas} vista{post.vistas!==1?"s":""}</span>}
          {post.cantidad_inscriptos>0&&<span style={{fontSize:12,color:C.muted}}>{post.cantidad_inscriptos} inscripto{post.cantidad_inscriptos!==1?"s":""}</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <ShareBtn post={post}/>
          {!esMio&&<PostChatBtn post={post} session={session} onOpenChat={onOpenChat} grad={T.grad} accent={T.accent}/>}
        </div>
      </div>
    </div>
  );
}
