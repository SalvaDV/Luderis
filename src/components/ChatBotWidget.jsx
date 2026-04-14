import React, { useState, useRef, useEffect } from "react";
import { C, FONT } from "../shared";
import * as sb from "../supabase";

export default function ChatBotWidget(){
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState([{from:"bot",text:"¡Hola! Soy Ludy 🦊, la asistente virtual de Luderis. Podés preguntarme cualquier cosa sobre la plataforma — cómo publicar, inscribirte, usar el chat, exámenes, pagos, o lo que necesites. ¿En qué te ayudo?"}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [failCount,setFailCount]=useState(0);
  const endRef=useRef(null);
  useEffect(()=>{if(open)endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,open]);

  // SYSTEM_LUDY movido a la edge function ludy-chat — no exponer en el cliente

  const QUICK_ACTIONS=[
    {label:"¿Cómo me inscribo?",q:"¿Cómo me inscribo a un curso?"},
    {label:"¿Cómo publico?",q:"¿Cómo publico una clase o curso?"},
    {label:"¿Cómo funciona el chat?",q:"¿Cuándo puedo chatear con un docente?"},
    {label:"¿Cómo uso los pedidos?",q:"¿Cómo funciona el sistema de pedidos?"},
  ];
  const handleQuick=(quickQ)=>{setInput(quickQ);setTimeout(()=>sendMsg(quickQ),50);};
  const sendMsg=async(overrideQ)=>{
    const q=(overrideQ||input).trim();if(!q)return;
    setInput("");
    const newUserMsg={from:"user",text:q};
    const nextMsgs=[...msgs,newUserMsg];
    setMsgs(nextMsgs);
    setLoading(true);
    try{
      const history=nextMsgs
        .filter(m=>m.from==="user"||m.from==="bot")
        .filter(m=>!m.action)
        .slice(-10)
        .map(m=>({role:m.from==="user"?"user":"assistant",content:m.text}));
      const text=await sb.callLudy(history,600).catch(()=>null);
      if(!text){
        setFailCount(n=>n+1);
        setMsgs(prev=>[...prev,{from:"bot",text:"Lo siento, no pude procesar tu consulta en este momento.",action:true}]);
        return;
      }
      const needsSupport=text.includes("[NECESITA_SOPORTE]");
      const cleanText=text.replace("[NECESITA_SOPORTE]","").trim();
      setMsgs(prev=>[...prev,{from:"bot",text:cleanText},...(needsSupport?[{from:"bot",text:"Si el problema persiste, podés hablar directo con el equipo:",action:true}]:[])]);
      if(needsSupport)setFailCount(n=>n+1);
    }catch{
      setFailCount(n=>n+1);
      setMsgs(prev=>[...prev,{from:"bot",text:"Hubo un error al procesar tu consulta.",action:true}]);
    }finally{setLoading(false);}
  };
  const openWhatsApp=()=>window.open("https://wa.me/5492345459787?text=Hola,%20necesito%20ayuda%20con%20Luderis","_blank","noopener,noreferrer");
  return(
    <div style={{position:"fixed",bottom:22,right:22,zIndex:500,fontFamily:FONT}} className="cl-chatbot-fab">
      <style>{`.cl-chatbot-fab{bottom:22px!important;right:22px!important}@media(max-width:768px){.cl-chatbot-fab{bottom:74px!important;right:14px!important}}`}</style>
      {open&&(
        <div style={{position:"absolute",bottom:64,right:0,width:"min(340px,88vw)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,boxShadow:"0 8px 32px #0008",display:"flex",flexDirection:"column",maxHeight:460,overflow:"hidden"}}>
          {/* Header */}
          <div style={{background:"var(--cl-section-accent)",borderRadius:"20px 20px 0 0",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <span style={{fontSize:20}}>🦊</span>
              <div>
              <div style={{fontWeight:700,color:"#fff",fontSize:13}}>Ludy · Asistente de Luderis</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.7)",display:"flex",alignItems:"center",gap:4}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"#2EC4A0",display:"inline-block",animation:"pulse 2s infinite"}}/>
                En línea · Responde al instante
              </div>
            </div>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer"}}>×</button>
          </div>
          {/* Quick action buttons */}
          <div style={{padding:"10px 12px 0",display:"flex",gap:5,flexWrap:"wrap",borderBottom:`1px solid ${C.border}`}}>
            {QUICK_ACTIONS.slice(0,4).map((a,i)=>(<button key={i} onClick={()=>handleQuick(a.q)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"4px 9px",fontSize:10,cursor:"pointer",fontFamily:FONT,marginBottom:8}}>{a.label}</button>))}
          </div>
          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:9}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start"}}>
                {m.action?(
                  <div style={{display:"flex",flexDirection:"column",gap:7,alignItems:"flex-start"}}>
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px 16px 16px 4px",padding:"9px 13px",maxWidth:220,fontSize:12,color:C.text,lineHeight:1.5}}>{m.text}</div>
                    <button onClick={openWhatsApp} style={{background:"#25D366",border:"none",borderRadius:20,color:"#fff",padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:7}}>
                      <span style={{fontSize:16}}>💬</span> Hablar con representante
                    </button>
                  </div>
                ):(
                  <div style={{background:m.from==="user"?"var(--cl-section-accent)":C.card,color:m.from==="user"?"#fff":C.text,borderRadius:m.from==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"9px 13px",maxWidth:220,fontSize:12,lineHeight:1.5,border:`1px solid ${m.from==="user"?"transparent":C.border}`}}>{m.text}</div>
                )}
              </div>
            ))}
            {loading&&<div style={{display:"flex",gap:4,padding:"9px 13px",background:C.card,borderRadius:"16px 16px 16px 4px",width:50,border:`1px solid ${C.border}`}}>{[0,1,2].map(i=>(<div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.muted,animation:`bounce .8s ${i*.2}s infinite`}}/>))}</div>}
            <div ref={endRef}/>
          </div>
          {/* Input */}
          <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()} placeholder="Escribí tu pregunta..." style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"8px 13px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT}}/>
            <button onClick={()=>sendMsg()} disabled={!input.trim()||loading} style={{background:"var(--cl-section-accent)",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:15,flexShrink:0,opacity:!input.trim()?0.5:1}}>↑</button>
          </div>
        </div>
      )}
      {/* FAB button */}
      <button onClick={()=>setOpen(v=>!v)} style={{width:52,height:52,borderRadius:"50%",background:open?C.border:"var(--cl-section-accent)",border:"none",cursor:"pointer",fontSize:22,boxShadow:"0 4px 16px #0006",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {open?"×":"💬"}
      </button>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}
