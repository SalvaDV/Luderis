import React, { useState, useEffect, useCallback, useRef } from "react";
import * as sb from "../supabase";
import { C, FONT, safeDisplayName, sanitizeContactInfo, Avatar, Spinner } from "../shared";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://hptdyehzqfpgtrpuydny.supabase.co";
const ANON_KEY = process.env.REACT_APP_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g";

export default function ChatModal({post,session,onClose,onUnreadChange}){
  const miEmail=session.user.email;const otroEmail=post.autor_email;
  const [msgs,setMsgs]=useState([]);const [input,setInput]=useState("");const [loading,setLoading]=useState(true);
  const [enviando,setEnviando]=useState(false);
  const [otroEscribiendo,setOtroEscribiendo]=useState(false);
  const [imagenPrevia,setImagenPrevia]=useState(null);// base64 de imagen a enviar
  const [leyendoImg,setLeyendoImg]=useState(false);
  const bottomRef=useRef(null);const markedRef=useRef(false);
  const cargandoRef=useRef(false);// evitar cargar() simultáneos
  const escribiendoTimer=useRef(null);
  const fileInputRef=useRef(null);

  // Broadcast "escribiendo" al otro via localStorage (cross-tab) o Realtime
  const emitirEscribiendo=useCallback(()=>{
    try{localStorage.setItem(`cl_typing_${post.id}_${miEmail}`,Date.now());}catch{}
  },[post.id,miEmail]);

  // Detectar si el otro está escribiendo via polling de localStorage
  useEffect(()=>{
    const check=()=>{
      try{
        const ts=parseInt(localStorage.getItem(`cl_typing_${post.id}_${otroEmail}`)||"0");
        setOtroEscribiendo(Date.now()-ts<3000);
      }catch{}
    };
    const t=setInterval(check,500);
    return()=>clearInterval(t);
  },[post.id,otroEmail]);

  const handleInputChange=(e)=>{
    setInput(e.target.value);
    emitirEscribiendo();
    clearTimeout(escribiendoTimer.current);
    escribiendoTimer.current=setTimeout(()=>{
      try{localStorage.removeItem(`cl_typing_${post.id}_${miEmail}`);}catch{}
    },2500);
  };
  const marcar=useCallback(async()=>{
    try{await sb.marcarLeidos(post.id,miEmail,session.access_token);}catch{}
    // Borrar notificaciones de nuevo_mensaje de esta pub
    try{await sb.marcarNotifsTipoLeidas(miEmail,["nuevo_mensaje","chat_grupal"],session.access_token);}catch{}
    if(onUnreadChange)onUnreadChange();
  },[post.id,miEmail,session.access_token,onUnreadChange]);
  const cargar=useCallback(async()=>{
    if(cargandoRef.current)return;// evitar requests simultáneos
    cargandoRef.current=true;
    try{
      // Traer todos los mensajes del usuario y filtrar por esta conversación
      const todos=await sb.getMisChats(miEmail,session.access_token);
      const data=todos.filter(m=>
        String(m.publicacion_id)===String(post.id)&&
        m.para_nombre!=="__grupo__"&&
        (m.de_nombre===otroEmail||m.para_nombre===otroEmail||m.de_nombre===miEmail)
      );
      setMsgs(data);setLoading(false);
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),50);
      const tieneNoLeidos=data.some(m=>m.para_nombre===miEmail&&!m.leido);
      if(tieneNoLeidos||!markedRef.current){await marcar();markedRef.current=true;}
    }catch(e){console.error(e);setLoading(false);}
    finally{cargandoRef.current=false;}
  },[post.id,miEmail,otroEmail,session.access_token,marcar]);
  useEffect(()=>{
    cargar();
    // Supabase Realtime en vez de polling — escucha INSERT en mensajes de este chat
    let canal=null;
    try{
      const ws=new WebSocket(`${SUPABASE_URL.replace("https","wss")}/realtime/v1/websocket?apikey=${ANON_KEY}&vsn=1.0.0`);
      canal=ws;
      ws.onopen=()=>{
        ws.send(JSON.stringify({topic:`realtime:mensajes_${post.id}`,event:"phx_join",payload:{},ref:"1"}));
        ws.send(JSON.stringify({topic:"phoenix",event:"heartbeat",payload:{},ref:"hb"}));
      };
      ws.onmessage=(e)=>{
        try{
          const msg=JSON.parse(e.data);
          if(msg.event==="INSERT"||msg.payload?.type==="INSERT"){cargar();}
        }catch{}
      };
      ws.onerror=()=>{
        ws.close();
        const t=setInterval(cargar,5000);canal={close:()=>clearInterval(t)};
      };
    }catch{
      const t=setInterval(cargar,5000);canal={close:()=>clearInterval(t)};
    }
    return()=>{try{canal?.close?.();}catch{}};
  },[cargar]);

  // Procesar imagen seleccionada
  const handleImageSelect=(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    if(file.size>4*1024*1024){alert("La imagen no puede superar 4MB");return;}
    setLeyendoImg(true);
    const reader=new FileReader();
    reader.onload=(ev)=>{setImagenPrevia(ev.target.result);setLeyendoImg(false);};
    reader.onerror=()=>setLeyendoImg(false);
    reader.readAsDataURL(file);
    e.target.value="";
  };

  const sendMsg=async(overrideQ)=>{
    const txt=(overrideQ||input).trim();
    if(!txt&&!imagenPrevia)return;
    if(enviando)return;
    const mensajeTexto=imagenPrevia?`[img]${imagenPrevia}[/img]${txt?" "+txt:""}`:txt;
    setInput("");setImagenPrevia(null);setEnviando(true);
    try{localStorage.removeItem(`cl_typing_${post.id}_${miEmail}`);}catch{}
    try{
      await sb.insertMensaje({publicacion_id:post.id,de_usuario:session.user.id,para_usuario:null,de_nombre:miEmail,para_nombre:otroEmail,texto:mensajeTexto,leido:false,pub_titulo:post.titulo},session.access_token);
      sb.insertNotificacion({usuario_id:null,alumno_email:otroEmail,tipo:"nuevo_mensaje",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      (()=>{const ck=`cl_email_sent_${post.id}_${otroEmail}`;const last=parseInt(localStorage.getItem(ck)||"0");if(Date.now()-last>2*60*60*1000){sb.sendEmail("nuevo_mensaje",otroEmail,{pub_titulo:post.titulo,de_nombre:sb.getDisplayName(miEmail)||miEmail.split("@")[0],preview:imagenPrevia?"[Imagen]":txt},session.access_token).catch(()=>{});try{localStorage.setItem(ck,Date.now());}catch{}}})();
      cargar();
    }catch(e){alert("Error al enviar: "+e.message);}
    finally{setEnviando(false);}
  };
  const nombre=post.autor_nombre||safeDisplayName(null,otroEmail)||"Usuario";
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,padding:"8px"}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,width:"min(500px,calc(100vw - 16px))",height:"min(680px,85vh)",maxHeight:"85dvh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Anti-puenteo */}
        <div style={{background:C.warn+"12",borderBottom:`1px solid ${C.warn}25`,padding:"6px 14px",display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
          <span style={{fontSize:12}}>🛡️</span>
          <span style={{fontSize:11,color:C.muted}}>Realizá los pagos a través de Luderis para estar protegido.</span>
        </div>
        <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div style={{display:"flex",gap:9,alignItems:"center"}}>
            <Avatar letra={nombre[0]} size={32}/>
            <div><div style={{fontWeight:700,color:C.text,fontSize:13}}>{nombre}</div><div style={{fontSize:11,color:C.muted,maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.titulo}</div></div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:6}}>
          {loading?<Spinner/>:msgs.length===0?<div style={{color:C.muted,textAlign:"center",padding:28,fontSize:13}}>Empezá la conversación 👋</div>
            :msgs.map((m,i)=>{
              const esPropio=m.de_nombre===miEmail;
              const isImg=m.texto?.startsWith("[img]");
              const imgSrc=isImg?m.texto.match(/\[img\]([\s\S]*?)\[\/img\]/)?.[1]:null;
              const textoPosterImg=isImg?m.texto.replace(/\[img\][\s\S]*?\[\/img\]/,"").trim():"";
              return(
                <div key={i} style={{display:"flex",justifyContent:esPropio?"flex-end":"flex-start"}}>
                  <div style={{background:esPropio?C.accent:C.card,color:esPropio?"#fff":C.text,padding:imgSrc?"6px 6px":undefined,borderRadius:13,maxWidth:"78%",overflow:"hidden"}}>
                    {imgSrc&&<img src={imgSrc} alt="img" style={{maxWidth:"100%",maxHeight:220,borderRadius:9,display:"block",cursor:"pointer"}} onClick={()=>window.open(imgSrc,"_blank","noopener,noreferrer")}/>}
                    {(textoPosterImg||!isImg)&&<div style={{padding:"8px 12px",fontSize:13,lineHeight:1.5}}>{sanitizeContactInfo(isImg?textoPosterImg:m.texto)}</div>}
                  </div>
                </div>
              );
            })}
          <div ref={bottomRef}/>
        </div>
        {/* Indicador "Escribiendo..." */}
        {otroEscribiendo&&(
          <div style={{padding:"4px 16px",fontSize:11,color:C.muted,display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <div style={{display:"flex",gap:3,alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:C.muted,animation:`pulse 1.2s ${i*0.2}s infinite`}}/>)}
            </div>
            escribiendo…
          </div>
        )}
        {/* Preview de imagen */}
        {imagenPrevia&&(
          <div style={{padding:"6px 13px",flexShrink:0,display:"flex",alignItems:"center",gap:8,background:C.bg,borderTop:`1px solid ${C.border}`}}>
            <img src={imagenPrevia} alt="preview" style={{height:52,width:52,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}`}}/>
            <div style={{flex:1,fontSize:12,color:C.muted}}>Imagen lista para enviar</div>
            <button onClick={()=>setImagenPrevia(null)} style={{background:"none",border:"none",color:C.danger,fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
        )}
        <div style={{padding:"10px 13px",borderTop:`1px solid ${C.border}`,display:"flex",gap:7,flexShrink:0,alignItems:"flex-end"}}>
          {/* Botón imagen */}
          <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImageSelect}/>
          <button onClick={()=>!leyendoImg&&fileInputRef.current?.click()}
            disabled={leyendoImg}
            style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 10px",cursor:leyendoImg?"default":"pointer",color:C.muted,fontSize:16,flexShrink:0,lineHeight:1,transition:"all .15s",opacity:leyendoImg?.5:1}}
            title="Enviar imagen"
            onMouseEnter={e=>{if(!leyendoImg){e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
            {leyendoImg?"⏳":"📎"}
          </button>
          <textarea value={input} onChange={handleInputChange}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}}
            placeholder="Escribí un mensaje... (Shift+Enter para nueva línea)"
            rows={1}
            style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 13px",color:C.text,fontSize:14,outline:"none",fontFamily:FONT,resize:"none",lineHeight:1.5,maxHeight:120,overflowY:"auto",boxSizing:"border-box",transition:"border-color .15s"}}
            onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}
          />
          <button onClick={()=>sendMsg()} disabled={(!input.trim()&&!imagenPrevia)||enviando}
            style={{background:C.accent,border:"none",borderRadius:9,padding:"9px 13px",fontWeight:700,cursor:"pointer",color:"#fff",fontSize:15,flexShrink:0,opacity:((!input.trim()&&!imagenPrevia)||enviando)?.4:1,transition:"opacity .15s"}}>
            {enviando?"…":"↑"}
          </button>
        </div>
      </div>
    </div>
  );
}
