import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, User, Monitor, MapPin, ArrowLeftRight, CheckCircle, Package, Users } from "lucide-react";
import * as sb from "../supabase";
import {
  C, FONT, LUD, tx,
  fmtRel, fmtPrice, fmt,
  safeDisplayName,
  useAutorAvatar,
  Avatar, MiniStars,
  getPubTipo, TIPO_PUB,
} from "../shared";
import FavBtn from "./FavBtn";
import DocBadge from "./DocBadge";
import ShareBtn from "./ShareBtn";
import PostChatBtn from "./PostChatBtn";

/*
  PostCard alineada al prototipo (redesign-prototipo/redesign/cards.jsx → PostCard).
  Cambios visuales respecto a la versión anterior (todo lo funcional se conserva):
   · Avatar 42 (antes 38)
   · Nombre tx-cardTitle-ish: 13.5px/650 (antes 14/600), badge verificado inline al lado del nombre
   · Subtítulo "materia · ciudad" (cae a fecha relativa si no hay ciudad)
   · "Disponible hoy" = pill SOFT teal (antes verde sólido agresivo)
   · Título tx("cardTitle") con clamp CSS a 2 líneas (antes margin distinto)
   · Descripción tx("body") 14px, clamp CSS a 2 líneas (antes slice JS a 130 + 13px)
   · PRECIO movido al footer, alineado a la derecha, tx("price") + /precio_tipo en faint
   · Footer: izquierda = estrellas + inscriptos · derecha = precio + acciones
   · Cluster superior derecho reducido: solo favorito (la identidad de tipo va en el pill + acento)
*/

const Pill=({icon:Icon,label,color,bg,border})=>(
  <span style={{display:"inline-flex",alignItems:"center",gap:4,...tx("micro"),color,background:bg,borderRadius:7,padding:"3px 9px",border:`1px solid ${border}`,whiteSpace:"nowrap",flexShrink:0}}>
    {Icon&&<Icon size={11} strokeWidth={2.2}/>}{label}
  </span>
);

export default function PostCard({post,session,onOpenChat,onOpenDetail,onOpenPerfil,avgPub,countPub,avgUser,yaOferte,fueRechazado,isFav,favId,onFavChange}){
  const nombre=post.autor_nombre||sb.getDisplayName(post.autor_email)||safeDisplayName(post.autor_nombre,post.autor_email)||"Usuario";
  const esMio=post.autor_email===session.user.email;
  const autorAvatar=useAutorAvatar(post.autor_email,session.access_token);
  const T=getPubTipo(post);
  const disponibleHoy=post.tipo==="oferta"&&post.autor_disponible_ahora&&post.autor_disponible_hasta&&new Date(post.autor_disponible_hasta)>new Date();
  const dispHardLight=(C.teal||"#0F9C82");

  return(
    <motion.div onClick={()=>onOpenDetail(post)}
      whileHover={{y:-3,boxShadow:C.shadowHover}}
      whileTap={{scale:0.985,y:-1}}
      transition={{type:"spring",stiffness:340,damping:26}}
      style={{
        position:"relative",display:"flex",flexDirection:"column",
        background:post.tipo==="busqueda"?TIPO_PUB.pedido.dim:C.surface,
        border:`1px solid ${fueRechazado?C.danger+"40":post.tipo==="busqueda"?TIPO_PUB.pedido.border:C.border}`,
        borderRadius:14,padding:"18px",cursor:"pointer",
        boxShadow:C.shadow,willChange:"transform",fontFamily:FONT,
        borderLeft:fueRechazado?`3px solid ${C.danger}`:post.tipo==="busqueda"?`3px solid ${TIPO_PUB.pedido.accent}`:undefined,
      }}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",gap:11,marginBottom:13}}>
        <Avatar letra={nombre[0]} size={42} img={autorAvatar||undefined} color={post.autor_avatar_color||undefined}/>
        <div style={{minWidth:0,flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
            <button onClick={e=>{e.stopPropagation();onOpenPerfil(post.autor_email);}}
              style={{...tx("bodyStrong"),fontWeight:650,color:C.text,background:"none",border:"none",cursor:"pointer",fontFamily:FONT,padding:0,textAlign:"left",lineHeight:1.3,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}
              onMouseEnter={e=>{e.currentTarget.style.color=C.accent;e.currentTarget.style.textDecoration="underline";}}
              onMouseLeave={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.textDecoration="none";}}>
              {nombre}
            </button>
            {post.tipo==="oferta"&&<DocBadge avgUser={avgUser} countPub={countPub} post={post}/>}
            {esMio&&(
              <span style={{display:"inline-flex",alignItems:"center",gap:3,...tx("micro"),fontWeight:700,color:T.accent,background:T.dim,borderRadius:6,padding:"2px 7px",border:`1px solid ${T.border}`,textTransform:"uppercase",letterSpacing:.4}}>
                <User size={9} strokeWidth={2.5}/>Mía
              </span>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2,...tx("meta"),color:C.muted}}>
            {post.materia&&<span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{post.materia}</span>}
            <span style={{color:C.border}}>·</span>
            <span style={{whiteSpace:"nowrap"}}>{post.ciudad||fmtRel(post.created_at)}</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <FavBtn post={post} session={session} onFavChange={onFavChange} isFav={isFav} favId={favId}/>
        </div>
      </div>

      {/* Disponible hoy — pill soft (estilo prototipo) */}
      {disponibleHoy&&(
        <div style={{marginBottom:9}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:5,...tx("micro"),fontWeight:650,color:dispHardLight,background:(localStorage.getItem("cl_theme")==="dark")?"#10271F":"#E7F6F1",borderRadius:7,padding:"3px 9px",whiteSpace:"nowrap"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:dispHardLight,display:"inline-block"}}/>Disponible hoy
          </span>
        </div>
      )}

      {/* Título + descripción (clamp CSS, escala tipográfica) */}
      <h3 style={{...tx("cardTitle"),color:C.text,margin:"0 0 6px",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{post.titulo}</h3>
      <p style={{...tx("body"),color:C.muted,margin:"0 0 14px",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",flex:1}}>{post.descripcion}</p>

      {/* Pills: tipo (acento) + modalidad + prueba + estados */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14,alignItems:"center"}}>
        {(post.modo==="grupal"||post.modo==="curso")&&<Pill icon={GraduationCap} label="Curso" color={TIPO_PUB.curso.accent} bg={TIPO_PUB.curso.dim} border={TIPO_PUB.curso.border}/>}
        {post.modo==="particular"&&<Pill icon={User} label="Particular" color={TIPO_PUB.particular.accent} bg={TIPO_PUB.particular.dim} border={TIPO_PUB.particular.border}/>}
        {post.modalidad==="virtual"&&<Pill icon={Monitor} label="Virtual" color={C.muted} bg={C.bg} border={C.border}/>}
        {post.modalidad==="presencial"&&<Pill icon={MapPin} label="Presencial" color={C.muted} bg={C.bg} border={C.border}/>}
        {post.modalidad==="mixto"&&<Pill icon={ArrowLeftRight} label="Mixto" color={C.muted} bg={C.bg} border={C.border}/>}
        {post.tiene_prueba&&<Pill icon={CheckCircle} label="Prueba gratis" color="#0F6E56" bg="#2EC4A012" border="#2EC4A040"/>}
        {(()=>{try{const pqs=JSON.parse(post.paquetes||"[]").filter(p=>p?.clases>0);const mejor=pqs.sort((a,b)=>(b.descuento||0)-(a.descuento||0))[0];return mejor?.descuento>0?<Pill icon={Package} label={`Pack -${mejor.descuento}%`} color="#0F6E56" bg="#2EC4A012" border="#2EC4A040"/>:null;}catch{return null;}})()}
        {post.fecha_inicio&&<span style={{...tx("micro"),color:C.muted,background:C.bg,borderRadius:7,padding:"3px 9px",border:`1px solid ${C.border}`}}>Inicia {fmt(post.fecha_inicio)}</span>}
        {yaOferte&&!esMio&&<Pill label="Oferta enviada" color="#B45309" bg="#F59E0B12" border="#F59E0B30"/>}
        {fueRechazado&&<Pill label="Oferta rechazada" color={C.danger} bg={C.danger+"12"} border={C.danger+"30"}/>}
        {post.tipo==="oferta"&&post.inscripciones_cerradas&&!post.finalizado&&<Pill label="Cupos llenos" color="#71717A" bg="#71717A12" border="#71717A30"/>}
        {post.tipo==="oferta"&&post.finalizado&&<Pill label="Finalizado" color={C.successText} bg={C.success+"12"} border={C.success+"30"}/>}
        {post.tipo==="busqueda"&&post.expires_at&&(()=>{const d=Math.ceil((new Date(post.expires_at)-new Date())/86400000);if(d<=3&&d>0)return<span style={{...tx("micro"),color:"#B45309",fontWeight:600}}>Expira en {d}d</span>;return null;})()}
      </div>

      {/* Footer: fila 1 = estrellas + precio · fila 2 = acciones (evita solapamiento en cards angostas) */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- stopPropagation evita activar la card */}
      <div style={{display:"flex",flexDirection:"column",gap:11,borderTop:`1px solid ${C.hairline||C.border}`,paddingTop:13}} onClick={e=>e.stopPropagation()}>
        {/* Fila 1: reseñas/inscriptos + precio */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <div style={{display:"flex",gap:9,alignItems:"center",minWidth:0,flexWrap:"wrap"}}>
            {avgPub?<MiniStars val={avgPub} count={countPub}/>:<span style={{...tx("meta"),color:C.faint,whiteSpace:"nowrap"}}>Sin reseñas</span>}
            {post.cantidad_inscriptos>0&&<>
              <span style={{color:C.border}}>·</span>
              <span style={{...tx("meta"),color:C.muted,display:"inline-flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}><Users size={13}/>{post.cantidad_inscriptos}</span>
            </>}
          </div>
          <div style={{textAlign:"right",flexShrink:0,whiteSpace:"nowrap"}}>
            {post.precio
              ?<><span style={{...tx("price"),color:C.text}}>{fmtPrice(post.precio,post.moneda)}</span>{post.precio_tipo&&post.modo!=="curso"&&<span style={{...tx("micro"),color:C.faint,fontWeight:500}}> /{post.precio_tipo}</span>}</>
              :<span style={{...tx("bodyStrong"),color:C.successText}}>Gratis</span>}
          </div>
        </div>
        {/* Fila 2: acciones */}
        <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
          <ShareBtn post={post}/>
          {!esMio&&<PostChatBtn post={post} session={session} onOpenChat={onOpenChat} grad={T.grad} accent={T.accent}/>}
        </div>
      </div>
    </motion.div>
  );
}
