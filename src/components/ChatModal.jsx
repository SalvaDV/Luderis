import React, { useState, useEffect, useCallback, useRef } from "react";
import * as sb from "../supabase";
import { C, FONT, safeDisplayName, sanitizeContactInfo, moderarMensaje, Avatar, Spinner, toast, fmtRel, useFocusTrap } from "../shared";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const ANON_KEY = process.env.REACT_APP_SUPABASE_KEY;

export default function ChatModal({post,session,onClose,onUnreadChange}){
  const miEmail=session.user.email;const otroEmail=post.autor_email;
  // Canal Realtime por-par (mismo string para ambos lados): scopea el "escribiendo…"
  // a esta conversación. Los INSERT de mensajes se filtran además por RLS + por par.
  const chanTopic=`realtime:chat_${post.id}_${[miEmail,otroEmail].map(s=>(s||"").toLowerCase().replace(/[^a-z0-9]/g,"")).sort().join("_")}`;
  const [msgs,setMsgs]=useState([]);const [input,setInput]=useState("");const [loading,setLoading]=useState(true);
  const [enviando,setEnviando]=useState(false);
  const [otroEscribiendo,setOtroEscribiendo]=useState(false);
  const [imagenPrevia,setImagenPrevia]=useState(null);// base64 de imagen a enviar
  const [leyendoImg,setLeyendoImg]=useState(false);
  const bottomRef=useRef(null);const markedRef=useRef(false);
  const cargandoRef=useRef(false);// evitar cargar() simultáneos
  const fileInputRef=useRef(null);
  const wsRef=useRef(null);            // socket Realtime vivo (para emitir "escribiendo")
  const lastTypingSentRef=useRef(0);   // throttle del broadcast de typing
  const typingClearRef=useRef(null);   // timeout para limpiar "escribiendo…"

  // "Escribiendo…" via Realtime broadcast (cross-usuario; el approach viejo con
  // localStorage solo sincronizaba entre pestañas del mismo navegador).
  const emitirEscribiendo=useCallback(()=>{
    const ws=wsRef.current;
    if(!ws||ws.readyState!==WebSocket.OPEN)return;
    const now=Date.now();
    if(now-lastTypingSentRef.current<900)return;// throttle: 1 broadcast c/900ms
    lastTypingSentRef.current=now;
    try{
      ws.send(JSON.stringify({
        topic:chanTopic,event:"broadcast",
        payload:{type:"broadcast",event:"typing",payload:{from:miEmail}},ref:"bt"
      }));
    }catch{}
  },[chanTopic,miEmail]);

  const handleInputChange=(e)=>{
    setInput(e.target.value);
    emitirEscribiendo();
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
      // Query dirigida: solo los mensajes de esta conversación (evita traer todos)
      const data=await sb.getMensajes(post.id,miEmail,otroEmail,session.access_token);
      setMsgs(data||[]);setLoading(false);
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),50);
      const tieneNoLeidos=data.some(m=>m.para_nombre===miEmail&&!m.leido);
      if(tieneNoLeidos||!markedRef.current){await marcar();markedRef.current=true;}
    }catch(e){console.error(e);setLoading(false);}
    finally{cargandoRef.current=false;}
  },[post.id,miEmail,otroEmail,session.access_token,marcar]);
  useEffect(()=>{
    cargar();
    // Supabase Realtime: postgres_changes (INSERT en mensajes de esta pub, scopeado
    // por RLS) para recibir mensajes en vivo, + broadcast "typing". El payload del
    // phx_join debe incluir el binding de postgres_changes y el access_token del
    // usuario (RLS), si no Supabase no emite ningún evento. Patrón espejo del WS de
    // notificaciones en App.jsx (heartbeat en intervalo + reconexión con backoff).
    let ws,heartbeat,reconnectTimer,pollFallback,dead=false,retries=0;
    const token=session.access_token;

    const showTyping=()=>{
      setOtroEscribiendo(true);
      clearTimeout(typingClearRef.current);
      typingClearRef.current=setTimeout(()=>setOtroEscribiendo(false),2500);
    };
    const scheduleReconnect=()=>{
      if(dead)return;
      retries++;
      reconnectTimer=setTimeout(connect,Math.min(2000*retries,15000));
    };
    function connect(){
      if(dead||!token)return;
      try{
        ws=new WebSocket(`${SUPABASE_URL.replace("https","wss")}/realtime/v1/websocket?apikey=${ANON_KEY}&vsn=1.0.0`);
        wsRef.current=ws;
        ws.onopen=()=>{
          retries=0;
          ws.send(JSON.stringify({
            topic:chanTopic,event:"phx_join",
            payload:{
              config:{
                broadcast:{ack:false,self:false},
                postgres_changes:[{event:"INSERT",schema:"public",table:"mensajes",filter:`publicacion_id=eq.${post.id}`}]
              },
              access_token:token
            },ref:"1"
          }));
          heartbeat=setInterval(()=>{
            if(ws.readyState===WebSocket.OPEN)
              ws.send(JSON.stringify({topic:"phoenix",event:"heartbeat",payload:{},ref:"hb"}));
          },25000);
        };
        ws.onmessage=(e)=>{
          try{
            const msg=JSON.parse(e.data);
            if(msg.event==="postgres_changes"){
              const rec=msg.payload?.data?.record;
              // filtrar a esta conversación 1-a-1 (la pub puede tener varios chats)
              if(rec&&(
                (rec.de_nombre===miEmail&&rec.para_nombre===otroEmail)||
                (rec.de_nombre===otroEmail&&rec.para_nombre===miEmail)
              )) cargar();
            }else if(msg.event==="broadcast"&&msg.payload?.event==="typing"){
              if(msg.payload?.payload?.from!==miEmail) showTyping();
            }
          }catch{}
        };
        ws.onclose=()=>{clearInterval(heartbeat);if(!dead)scheduleReconnect();};
        ws.onerror=()=>{try{ws.close();}catch{}};
      }catch{
        // Sin WebSocket: fallback a polling de baja frecuencia
        pollFallback=setInterval(cargar,5000);
      }
    }
    connect();
    return()=>{
      dead=true;
      clearInterval(heartbeat);clearTimeout(reconnectTimer);clearInterval(pollFallback);
      clearTimeout(typingClearRef.current);
      wsRef.current=null;
      try{ws?.close();}catch{}
    };
  },[cargar,post.id,miEmail,otroEmail,chanTopic,session.access_token]);// eslint-disable-line react-hooks/exhaustive-deps

  // Procesar imagen seleccionada
  const handleImageSelect=(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    if(file.size>4*1024*1024){toast("La imagen no puede superar 4MB","warn");return;}
    setLeyendoImg(true);
    const reader=new FileReader();
    reader.onload=(ev)=>{setImagenPrevia(ev.target.result);setLeyendoImg(false);};
    reader.onerror=()=>{setLeyendoImg(false);toast("No se pudo procesar la imagen","error");};
    reader.readAsDataURL(file);
    e.target.value="";
  };

  const sendMsg=async(overrideQ)=>{
    const txt=(overrideQ||input).trim();
    if(!txt&&!imagenPrevia)return;
    if(enviando)return;
    if(txt){
      const mod=moderarMensaje(txt);
      if(mod.advertencia){
        toast(mod.advertencia,mod.block?"error":"warn",5000);
        if(mod.block)return;
      }
    }
    const mensajeTexto=imagenPrevia?`[img]${imagenPrevia}[/img]${txt?" "+txt:""}`:txt;
    setInput("");setImagenPrevia(null);setEnviando(true);
    try{
      await sb.insertMensaje({publicacion_id:post.id,de_usuario:session.user.id,para_usuario:null,de_nombre:miEmail,para_nombre:otroEmail,texto:mensajeTexto,leido:false,pub_titulo:post.titulo},session.access_token);
      sb.insertNotificacion({usuario_id:null,alumno_email:otroEmail,tipo:"nuevo_mensaje",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      (()=>{const ck=`cl_email_sent_${post.id}_${otroEmail}`;const last=parseInt(localStorage.getItem(ck)||"0");if(Date.now()-last>2*60*60*1000){sb.sendEmail("nuevo_mensaje",otroEmail,{pub_titulo:post.titulo,de_nombre:sb.getDisplayName(miEmail)||miEmail.split("@")[0],preview:imagenPrevia?"[Imagen]":txt},session.access_token).catch(()=>{});try{localStorage.setItem(ck,Date.now());}catch{}}})();
      sb.sendPush(otroEmail,`Nuevo mensaje — ${post.titulo}`,imagenPrevia?"[Imagen]":txt.slice(0,80)||"…",`/?chat=${post.id}`,"nuevo_mensaje",session.access_token).catch(()=>{});
      cargar();
    }catch(e){toast("No se pudo enviar el mensaje. Intentá de nuevo.","error");}
    finally{setEnviando(false);}
  };
  const nombre=post.autor_nombre||safeDisplayName(null,otroEmail)||"Usuario";
  const trapRef=useFocusTrap(true);
  return(
    <div role="dialog" aria-modal="true" aria-label={`Chat con ${nombre}`} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,padding:"8px"}}>
      <div ref={trapRef} tabIndex={-1} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,width:"min(500px,calc(100vw - 16px))",height:"min(680px,85vh)",maxHeight:"85dvh",display:"flex",flexDirection:"column",overflow:"hidden",outline:"none"}}>
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
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:esPropio?"flex-end":"flex-start",gap:2}}>
                  <div style={{background:esPropio?C.accent:C.accentDim||"#EEF4FF",color:esPropio?"#fff":C.text,padding:imgSrc?"6px 6px":undefined,borderRadius:13,maxWidth:"78%",overflow:"hidden",border:`1px solid ${esPropio?"transparent":C.border}`}}>
                    {imgSrc&&<button type="button" onClick={()=>window.open(imgSrc,"_blank","noopener,noreferrer")} aria-label="Abrir imagen en tamaño completo" style={{padding:0,border:"none",background:"none",cursor:"pointer",display:"block"}}><img src={imgSrc} alt="Imagen del mensaje" loading="lazy" decoding="async" style={{maxWidth:"100%",maxHeight:220,borderRadius:9,display:"block"}}/></button>}
                    {(textoPosterImg||!isImg)&&<div style={{padding:"8px 12px",fontSize:13,lineHeight:1.5}}>{sanitizeContactInfo(isImg?textoPosterImg:m.texto)}</div>}
                  </div>
                  {m.created_at&&<div style={{fontSize:10,color:C.muted,paddingInline:4}}>{fmtRel(m.created_at)}</div>}
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
          <input ref={fileInputRef} type="file" accept="image/*" aria-label="Adjuntar imagen" style={{display:"none"}} onChange={handleImageSelect}/>
          <button onClick={()=>!leyendoImg&&fileInputRef.current?.click()}
            disabled={leyendoImg}
            style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 10px",cursor:leyendoImg?"default":"pointer",color:C.muted,fontSize:16,flexShrink:0,lineHeight:1,transition:"all .15s",opacity:leyendoImg?.5:1}}
            title="Enviar imagen"
            onMouseEnter={e=>{if(!leyendoImg){e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
            {leyendoImg?"⏳":"📎"}
          </button>
          <textarea value={input} onChange={handleInputChange}
            aria-label="Escribí un mensaje"
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}}
            placeholder="Escribí un mensaje..."
            rows={1}
            style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 13px",color:C.text,fontSize:14,outline:"none",fontFamily:FONT,resize:"none",lineHeight:1.5,maxHeight:120,overflowY:"hidden",boxSizing:"border-box",transition:"border-color .15s, box-shadow .15s"}}
            onFocus={e=>{e.target.style.borderColor=C.accent;e.target.style.boxShadow=`0 0 0 3px ${C.accent}22`;}}
            onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none";}}
            onInput={e=>{const el=e.target;el.style.overflowY="hidden";el.style.height="0";const h=Math.min(el.scrollHeight,120);el.style.height=h+"px";el.style.overflowY=h>=120?"auto":"hidden";}}
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
