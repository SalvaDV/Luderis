import React from "react";
import { C, FONT } from "../shared";

export default function MiniDropdown({value,onChange,options,fontSize=12}){
  const [open,setOpen]=React.useState(false);
  const ref=React.useRef(null);
  React.useEffect(()=>{
    if(!open)return;
    const handler=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[open]);
  const current=options.find(o=>o.value===value)||options[0];
  return(
    <div ref={ref} style={{position:"relative",flexShrink:0}}>
      <button onClick={()=>setOpen(v=>!v)}
        style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontFamily:FONT,fontSize,color:C.text,padding:"2px 0",whiteSpace:"nowrap"}}>
        <span style={{fontWeight:500}}>{current?.label}</span>
        <span style={{fontSize:fontSize-2,color:C.muted,lineHeight:1}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,.12)",zIndex:200,minWidth:140,overflow:"hidden",animation:"fadeUp .12s ease"}}>
          {options.map(o=>(
            <button key={o.value} onClick={()=>{onChange(o.value);setOpen(false);}}
              style={{display:"block",width:"100%",textAlign:"left",background:o.value===value?C.accentDim:"none",border:"none",padding:"9px 14px",fontFamily:FONT,fontSize,cursor:"pointer",color:o.value===value?C.accent:C.text,fontWeight:o.value===value?600:400,transition:"background .1s"}}
              onMouseEnter={e=>{if(o.value!==value)e.currentTarget.style.background=C.bg;}}
              onMouseLeave={e=>{if(o.value!==value)e.currentTarget.style.background="none";}}>{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
