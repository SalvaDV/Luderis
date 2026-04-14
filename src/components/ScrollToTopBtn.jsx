import React, { useState, useEffect } from "react";
import { LUD, FONT } from "../shared";

export default function ScrollToTopBtn(){
  const [visible,setVisible]=useState(false);
  useEffect(()=>{
    const el=document.getElementById("app-main-scroll")||window;
    const onScroll=()=>setVisible((el.scrollTop||window.scrollY||0)>400);
    el.addEventListener("scroll",onScroll,{passive:true});
    return()=>el.removeEventListener("scroll",onScroll);
  },[]);
  if(!visible)return null;
  return(
    <button onClick={()=>{const el=document.getElementById("app-main-scroll");if(el)el.scrollTo({top:0,behavior:"smooth"});else window.scrollTo({top:0,behavior:"smooth"});}}
      style={{position:"fixed",bottom:80,right:16,width:40,height:40,borderRadius:"50%",background:LUD.grad,border:"none",color:"#fff",fontSize:18,cursor:"pointer",boxShadow:"0 4px 14px rgba(26,110,216,.35)",zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",transition:"opacity .2s",fontFamily:FONT,animation:"fadeUp .2s ease"}}
      title="Volver arriba">↑</button>
  );
}
