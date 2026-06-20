import React from "react";
import { Search, Calendar, MessageCircle, Bookmark, GraduationCap, Lightbulb, User, LogOut, Moon, Sun, Plus, Bell, Shield } from "lucide-react";
import * as sb from "../supabase";
import {
  C, FONT, FONT_DISPLAY, LUD, accentFor,
  _avatarCache,
  setLang, t,
  Avatar,
} from "../shared";

export default function Sidebar({page,setPage,session,onLogout,onNewPost,unreadCount,ofertasCount,notifCount,totalNotifsUnread,ofertasAceptadasNuevas,mobile,open,onClose,theme,onToggleTheme,onForceRender,esAdmin,juegosBadge,onOpenAdmin,onOpenNotifPanel}){
  const nombre=sb.getDisplayName(session.user.email);
  const nav=[
    {id:"explore",Icon:Search,label:t("explore")},
    {id:"agenda",Icon:Calendar,label:t("agenda")},
    {id:"chats",Icon:MessageCircle,label:t("chats"),badge:unreadCount},
    {id:"favoritos",Icon:Bookmark,label:t("favorites")},
    {id:"inscripciones",Icon:GraduationCap,label:t("classes"),badge:notifCount},
    {id:"juegos",Icon:Lightbulb,label:"Juegos",badge:juegosBadge?1:0,badgeDot:true},
    {id:"cuenta",Icon:User,label:t("account"),badge:ofertasAceptadasNuevas+ofertasCount},
  ];
  const accN=accentFor("cursos");// acento del rediseño para el nav activo (azul curso)
  const avatarUrl=_avatarCache[session.user.email]||localStorage.getItem("cl_avatar_"+session.user.email)||null;
  const avatarColorSelf=(()=>{try{return localStorage.getItem("avatarColor_"+session.user.email)||undefined;}catch{return undefined;}})();
  const inner=(
    <div style={{width:236,height:"100%",background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",fontFamily:FONT}}>
      {/* Logo */}
      <div style={{padding:"20px 20px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>{setPage("explore");if(mobile&&onClose)onClose();}} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:9}}>
          <img src="/logo.png" alt="Luderis" style={{width:30,height:30,objectFit:"contain",borderRadius:8}}/>
          <span style={{fontSize:19,fontWeight:800,color:C.text,letterSpacing:"-.02em",whiteSpace:"nowrap",fontFamily:FONT_DISPLAY}}>Luderis</span>
        </button>
        {mobile&&<button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer",padding:2}}>×</button>}
      </div>

      {/* + Publicar (arriba, como el diseño) */}
      <div style={{padding:"0 16px 14px"}}>
        <button id="tour-btn-publicar" onClick={()=>{onNewPost();if(mobile)onClose();}}
          style={{width:"100%",padding:"11px 14px",borderRadius:12,border:"none",background:LUD.grad,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:7,boxShadow:"0 4px 14px rgba(26,110,216,.3)",transition:"transform .15s,box-shadow .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(26,110,216,.36)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 4px 14px rgba(26,110,216,.3)";}}>
          <Plus size={17} strokeWidth={2.4}/> Publicar
        </button>
      </div>

      {/* Nav */}
      <nav style={{padding:"4px 12px",flex:1,overflowY:"auto"}}>
        {nav.map(item=>{
          const active=page===item.id;
          return(<button key={item.id} onClick={()=>{setPage(item.id);if(mobile)onClose();}}
            style={{position:"relative",width:"100%",display:"flex",alignItems:"center",gap:11,padding:"10px 13px",borderRadius:10,border:"none",
              background:active?accN.soft:"transparent",
              color:active?accN.text:C.textSoft||C.text,
              fontWeight:active?650:500,fontSize:14,cursor:"pointer",marginBottom:2,fontFamily:FONT,textAlign:"left",
              transition:"background .14s,color .14s"}}
            onMouseEnter={e=>{if(!active){e.currentTarget.style.background=C.surfaceAlt||C.bg;}}}
            onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";}}}>
            {active&&<span style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:3,height:20,borderRadius:3,background:accN.solid}}/>}
            <item.Icon size={19} strokeWidth={active?2.1:1.8} style={{flexShrink:0}}/>
            <span style={{flex:1}}>{item.label}</span>
            {item.badge>0&&(
              item.badgeDot
                ?<span style={{width:7,height:7,borderRadius:"50%",background:"#E5484D",flexShrink:0}}/>
                :<span style={{background:"#E5484D",color:"#fff",borderRadius:9,fontSize:11,fontWeight:700,minWidth:18,height:18,padding:"0 5px",display:"flex",alignItems:"center",justifyContent:"center"}}>{item.badge>9?"9+":item.badge}</span>
            )}
          </button>);
        })}
      </nav>

      {/* Pie: admin (si corresponde) + usuario + acciones */}
      <div style={{padding:"12px",borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
        {esAdmin&&(
          <button onClick={()=>{if(mobile)onClose();onOpenAdmin&&onOpenAdmin();}}
            style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 11px",borderRadius:10,cursor:"pointer",fontFamily:FONT,border:`1px solid ${C.border}`,background:C.surfaceAlt||C.bg,color:C.textSoft||C.text,transition:"all .14s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#8B5CF6";e.currentTarget.style.background="rgba(139,92,246,.10)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.surfaceAlt||C.bg;}}>
            <span style={{width:26,height:26,borderRadius:7,background:"#8B5CF61F",color:"#8B5CF6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Shield size={15} strokeWidth={2}/></span>
            <div style={{flex:1,textAlign:"left",minWidth:0}}>
              <div style={{fontSize:13,fontWeight:650,color:C.text}}>Panel de admin</div>
              <div style={{fontSize:11,color:C.faint||C.muted}}>Solo administradores</div>
            </div>
          </button>
        )}
        {/* Tarjeta de usuario (→ Mi cuenta) + campana */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 4px"}}>
          <button onClick={()=>{setPage("cuenta");if(mobile)onClose();}} style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:FONT,textAlign:"left"}}>
            {avatarUrl&&avatarUrl.startsWith("http")
              ?<div style={{width:36,height:36,borderRadius:"50%",overflow:"hidden",flexShrink:0}}><img src={avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/></div>
              :<Avatar letra={nombre[0]} size={36} color={avatarColorSelf}/>}
            <div style={{overflow:"hidden",flex:1,minWidth:0}}>
              <div style={{color:C.text,fontSize:13,fontWeight:650,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{nombre}</div>
              <div style={{color:C.faint||C.muted,fontSize:11.5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{session.user.email}</div>
            </div>
          </button>
          <button onClick={()=>{onOpenNotifPanel&&onOpenNotifPanel();}} aria-label="Notificaciones"
            style={{position:"relative",width:36,height:36,borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,color:(totalNotifsUnread??notifCount)>0?accN.solid:C.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .14s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=accN.solid;e.currentTarget.style.color=accN.solid;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=(totalNotifsUnread??notifCount)>0?accN.solid:C.muted;}}>
            <Bell size={16} strokeWidth={2}/>
            {(totalNotifsUnread??notifCount)>0&&<span style={{position:"absolute",top:-4,right:-4,minWidth:16,height:16,padding:"0 4px",borderRadius:8,background:"#E5484D",color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{Math.min(totalNotifsUnread??notifCount,9)}</span>}
          </button>
        </div>
        {/* Oscuro / Salir */}
        <div style={{display:"flex",gap:8}}>
          <button onClick={onToggleTheme}
            style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"8px",cursor:"pointer",fontSize:12.5,fontWeight:600,fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .14s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.borderStrong||C.accent;e.currentTarget.style.background=C.surfaceAlt||C.bg;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background="transparent";}}>
            {theme==="light"?<><Moon size={15} strokeWidth={2}/> Oscuro</>:<><Sun size={15} strokeWidth={2}/> Claro</>}
          </button>
          <button onClick={onLogout}
            style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"8px",cursor:"pointer",fontSize:12.5,fontWeight:600,fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .14s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.danger;e.currentTarget.style.color=C.danger;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
            <LogOut size={15} strokeWidth={2}/> {t("logout")}
          </button>
        </div>
        {/* Idioma (compacto) */}
        <div style={{display:"flex",gap:6}}>
          {[["es",t("langEs")],["en",t("langEn")]].map(([key,label])=>(
            <button key={key}
              onClick={()=>{setLang(key);if(onForceRender)onForceRender();else{onToggleTheme();setTimeout(onToggleTheme,10);}}}
              style={{flex:1,background:(localStorage.getItem("cl_lang")||"es")===key?accN.soft:"transparent",
                border:`1px solid ${(localStorage.getItem("cl_lang")||"es")===key?accN.solid:C.border}`,
                borderRadius:8,color:(localStorage.getItem("cl_lang")||"es")===key?accN.text:C.muted,
                padding:"5px 8px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:FONT,
                display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all .14s"}}>
              {label}
            </button>
          ))}
        </div>
      </div>
      </div>
  );
  // backdrop solo-mouse; la navegación del sidebar es accesible por teclado
  if(mobile)return(<>{/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
    {open&&<div onClick={onClose} aria-hidden="true" style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:89}}/>}<div style={{position:"fixed",left:0,top:0,height:"100vh",zIndex:90,transform:open?"translateX(0)":"translateX(-100%)",transition:"transform .25s",boxShadow:"4px 0 20px rgba(0,0,0,.1)"}}>{inner}</div></>);
  return <div style={{position:"fixed",left:0,top:0,height:"100vh",zIndex:40}}>{inner}</div>;
}
