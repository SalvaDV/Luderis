import React from "react";
import * as sb from "../supabase";
import {
  C, FONT, LUD,
  _avatarCache,
  setLang, t,
  Avatar,
} from "../shared";

export default function Sidebar({page,setPage,session,onLogout,onNewPost,unreadCount,ofertasCount,notifCount,ofertasAceptadasNuevas,mobile,open,onClose,theme,onToggleTheme,onForceRender,esAdmin}){
  const nombre=sb.getDisplayName(session.user.email);
  const nav=[
    {id:"explore",icon:"🔍",label:t("explore")},
    {id:"agenda",icon:"📅",label:t("agenda")},
    {id:"chats",icon:"💬",label:t("chats"),badge:unreadCount},
    {id:"favoritos",icon:"★",label:t("favorites")},
    {id:"inscripciones",icon:"🎓",label:t("classes"),badge:notifCount},
    {id:"cuenta",icon:"👤",label:t("account"),badge:ofertasAceptadasNuevas+ofertasCount},
  ];
  const inner=(
    <div style={{width:224,height:"100%",background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",fontFamily:FONT}}>
      {/* Logo */}
      <div style={{padding:"16px 20px 14px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <img src="/logo.png" alt="Luderis" style={{width:32,height:32,objectFit:"contain"}}/>
            <span style={{fontSize:16,fontWeight:700,color:C.text,letterSpacing:"-.3px",whiteSpace:"nowrap"}}>Luderis</span>
          </div>
          {mobile&&<button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer",padding:2}}>×</button>}
        </div>
      </div>

      {/* Barra progreso perfil */}
      {(()=>{
        const emailBase=session.user.email;
        const criterios=[
          {ok:nombre&&nombre!==emailBase.split("@")[0],label:"Nombre"},
          {ok:!!localStorage.getItem("cl_avatar_"+emailBase),label:"Foto"},
          {ok:!!localStorage.getItem("cl_bio_"+emailBase)||false,label:"Bio"},
          {ok:!!localStorage.getItem("cl_user_city"),label:"Ciudad"},
          {ok:localStorage.getItem("cl_onboarding_done_"+emailBase)==="1",label:"Onboarding"},
        ];
        const done=criterios.filter(x=>x.ok).length;
        const pct=Math.round((done/criterios.length)*100);
        const siguiente=criterios.find(x=>!x.ok);
        return pct<100?(
          <div style={{padding:"8px 16px",borderBottom:`1px solid ${C.border}`,background:C.accentDim,cursor:"pointer"}} onClick={()=>{}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:10,fontWeight:700,color:C.accent,letterSpacing:.3}}>PERFIL {pct}% COMPLETO</span>
              {siguiente&&<span style={{fontSize:10,color:C.muted}}>Falta: {siguiente.label}</span>}
            </div>
            <div style={{height:4,background:C.border,borderRadius:2}}>
              <div style={{height:"100%",width:`${pct}%`,background:pct>=80?C.success:LUD.grad,borderRadius:2,transition:"width .5s ease"}}/>
            </div>
          </div>
        ):null;
      })()}
      {/* User card */}
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,background:`linear-gradient(135deg,${C.accentDim},${C.bg})`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {(()=>{const av=_avatarCache[session.user.email]||localStorage.getItem("cl_avatar_"+session.user.email)||null;return av&&av.startsWith("http")?<div style={{width:40,height:40,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:`2px solid ${C.accent}40`}}><img src={av} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/></div>:<Avatar letra={nombre[0]} size={40}/>;})()}
          <div style={{overflow:"hidden",flex:1}}>
            <div style={{color:C.text,fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{nombre}</div>
            <div style={{color:C.muted,fontSize:11,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:1}}>{session.user.email}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{padding:"8px 8px",flex:1,overflowY:"auto"}}>
        {nav.map(item=>{
          const active=page===item.id;
          return(<button key={item.id} onClick={()=>{setPage(item.id);if(mobile)onClose();}}
            style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:"none",
              background:active?C.accentDim:"transparent",
              color:active?C.accent:C.text,
              fontWeight:active?600:400,fontSize:13,cursor:"pointer",marginBottom:1,fontFamily:FONT,textAlign:"left",
              transition:"background .12s,color .12s"}}
            onMouseEnter={e=>{if(!active){e.currentTarget.style.background=C.bg;}}}
            onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";}}}>
            <span style={{fontSize:16,lineHeight:1}}>{item.icon}</span>
            <span style={{flex:1}}>{item.label}</span>
            {item.badge>0&&<span style={{background:C.danger,color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px",minWidth:18,textAlign:"center"}}>{item.badge>9?"9+":item.badge}</span>}
            {active&&<span style={{width:3,height:22,borderRadius:2,background:LUD.grad,flexShrink:0}}/>}
          </button>);
        })}
        <div style={{margin:"10px 8px",height:1,background:C.border}}/>
        {esAdmin&&(
          <button onClick={()=>{if(mobile)onClose();window.__openAdmin&&window.__openAdmin();}}
            style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#7B3FBE20,#1A6ED820)",color:"#7B3FBE",fontWeight:600,fontSize:13,cursor:"pointer",marginBottom:4,fontFamily:FONT,textAlign:"left",transition:"background .12s"}}
            onMouseEnter={e=>e.currentTarget.style.background="linear-gradient(135deg,#7B3FBE30,#1A6ED830)"}
            onMouseLeave={e=>e.currentTarget.style.background="linear-gradient(135deg,#7B3FBE20,#1A6ED820)"}>
            <span style={{fontSize:16}}>⚙️</span>
            <span>Panel Admin</span>
          </button>
        )}
        <button onClick={()=>{onNewPost();if(mobile)onClose();}}
          style={{width:"100%",padding:"9px 12px",borderRadius:20,border:"none",background:LUD.grad,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"0 4px 12px rgba(26,110,216,.3)",transition:"opacity .15s"}}
          onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          + Publicar
        </button>
      </nav>

      {/* Footer */}
      <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:6}}>
        {/* Campana notificaciones */}
        <button onClick={()=>{if(typeof window._openNotifPanel==="function")window._openNotifPanel();}}
          style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,border:`1px solid ${(unreadCount+ofertasCount+notifCount)>0?C.accent+"40":C.border}`,background:(unreadCount+ofertasCount+notifCount)>0?C.accentDim:"none",cursor:"pointer",fontFamily:FONT,fontSize:12,color:(unreadCount+ofertasCount+notifCount)>0?C.accent:C.muted,width:"100%",transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=(unreadCount+ofertasCount+notifCount)>0?C.accent+"40":C.border;e.currentTarget.style.color=(unreadCount+ofertasCount+notifCount)>0?C.accent:C.muted;}}>
          <span style={{fontSize:15}}>🔔</span>
          <span style={{flex:1}}>Notificaciones</span>
          {(unreadCount+ofertasCount+notifCount)>0&&<span style={{background:C.danger,color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{Math.min(unreadCount+ofertasCount+notifCount,99)}</span>}
        </button>
        <div style={{display:"flex",gap:6}}>
          <button onClick={onToggleTheme}
            style={{flex:1,background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"6px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
            {theme==="light"?t("dark"):t("light")}
          </button>
          <button onClick={onLogout}
            style={{flex:1,background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"6px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.danger;e.currentTarget.style.color=C.danger;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
            ↩ {t("logout")}
          </button>
        </div>
        {/* Selector de idioma */}
        <div style={{display:"flex",gap:6}}>
          {[["es",t("langEs")],["en",t("langEn")]].map(([key,label])=>(
            <button key={key}
              onClick={()=>{setLang(key);if(onForceRender)onForceRender();else{onToggleTheme();setTimeout(onToggleTheme,10);}}}
              style={{flex:1,background:(localStorage.getItem("cl_lang")||"es")===key?C.accentDim:"none",
                border:`1px solid ${(localStorage.getItem("cl_lang")||"es")===key?C.accent:C.border}`,
                borderRadius:8,color:(localStorage.getItem("cl_lang")||"es")===key?C.accent:C.muted,
                padding:"5px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT,
                display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all .15s"}}>
              {label}
            </button>
          ))}
        </div>
      </div>
      </div>
  );
  if(mobile)return(<>{open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:89}}/>}<div style={{position:"fixed",left:0,top:0,height:"100vh",zIndex:90,transform:open?"translateX(0)":"translateX(-100%)",transition:"transform .25s",boxShadow:"4px 0 20px rgba(0,0,0,.1)"}}>{inner}</div></>);
  return <div style={{position:"fixed",left:0,top:0,height:"100vh",zIndex:40}}>{inner}</div>;
}
