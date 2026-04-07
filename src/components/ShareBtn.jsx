import React, { useState, useEffect } from "react";
import { C, FONT, toast } from "../shared";

function ShareToast({msg,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2200);return()=>clearTimeout(t);},[onDone]);
  return(
    <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"10px 20px",fontSize:12,color:C.text,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 4px 20px #0008",fontFamily:FONT,display:"flex",alignItems:"center",gap:8}}>
      <span style={{color:C.success}}>✓</span>{msg}
    </div>
  );
}

export function useShareToast(){
  const [toastMsg,setToastMsg]=useState(null);
  const show=(msg)=>setToastMsg(msg);
  const el=toastMsg?<ShareToast msg={toastMsg} onDone={()=>setToastMsg(null)}/>:null;
  return [show,el];
}

export default function ShareBtn({post,style={}}){
  const [menu,setMenu]=useState(false);
  const url=`${window.location.origin}${window.location.pathname}?pub=${post.id}`;
  const txt=`${post.titulo} — Luderis`;
  const copiar=async(e)=>{e.stopPropagation();try{await navigator.clipboard.writeText(url);toast("Link copiado","success");}catch{toast("No se pudo copiar","error");}setMenu(false);};
  const whatsapp=(e)=>{e.stopPropagation();window.open(`https://wa.me/?text=${encodeURIComponent(txt+" "+url)}`,"_blank");setMenu(false);};
  const email=(e)=>{e.stopPropagation();window.open(`mailto:?subject=${encodeURIComponent(txt)}&body=${encodeURIComponent(url)}`);setMenu(false);};
  const nativo=async(e)=>{e.stopPropagation();if(navigator.share)try{await navigator.share({title:txt,url});return;}catch{}copiar(e);};
  return(
    <div style={{position:"relative",display:"inline-block"}} onClick={e=>e.stopPropagation()}>
      <button onClick={e=>{e.stopPropagation();if(navigator.share){nativo(e);}else setMenu(v=>!v);}}
        title="Compartir" style={{background:"none",border:`1px solid ${C.border}`,fontSize:13,cursor:"pointer",color:C.muted,padding:"5px 10px",lineHeight:1,borderRadius:8,...style,display:"flex",alignItems:"center",gap:4,transition:"all .15s"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
        ⤴ <span style={{fontSize:11}}>Compartir</span>
      </button>
      {menu&&(
        <>
          <div onClick={()=>setMenu(false)} style={{position:"fixed",inset:0,zIndex:299}}/>
          <div style={{position:"absolute",right:0,top:"calc(100% + 4px)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"6px",zIndex:300,boxShadow:"0 8px 24px rgba(0,0,0,.15)",display:"flex",flexDirection:"column",gap:2,minWidth:190,animation:"fadeUp .12s ease"}}>
            {[
              {icon:"⎘",label:"Copiar enlace",fn:copiar,color:C.text},
              {icon:"🟢",label:"WhatsApp",fn:whatsapp,color:"#25D366"},
              {icon:"✉️",label:"Email",fn:email,color:C.muted},
            ].map(({icon,label,fn,color})=>(
              <button key={label} onClick={fn} style={{background:"none",border:"none",cursor:"pointer",fontFamily:FONT,fontSize:13,color,padding:"9px 12px",borderRadius:8,textAlign:"left",display:"flex",gap:10,alignItems:"center",transition:"background .1s",fontWeight:label==="WhatsApp"?600:400}}
                onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                onMouseLeave={e=>e.currentTarget.style.background="none"}>
                <span style={{fontSize:16,flexShrink:0}}>{icon}</span>{label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
