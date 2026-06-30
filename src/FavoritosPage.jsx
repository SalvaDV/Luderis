import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { C, FONT, FONT_DISPLAY, SkeletonList } from "./shared";
import * as sb from "./supabase";
import PostCard from "./components/PostCard";

export default function FavoritosPage({session,onOpenDetail,onOpenChat,onOpenPerfil,onGoExplore}){
  const [posts,setPosts]=useState([]);const [loading,setLoading]=useState(true);const [filtroTipo,setFiltroTipo]=useState("all");
  useEffect(()=>{
    let mounted=true;
    sb.getFavoritos(session.user.email,session.access_token).then(async fs=>{
      if(!mounted)return;
      if(fs.length>0){const ids=fs.map(f=>f.publicacion_id);const pubs=await sb.getPublicacionesByIds(ids,session.access_token);if(mounted)setPosts(pubs||[]);}
    }).finally(()=>{if(mounted)setLoading(false);});
    return()=>{mounted=false;};
  },[session]);
  const filtered=posts.filter(p=>filtroTipo==="all"||p.tipo===filtroTipo);
  return(
    <div style={{fontFamily:FONT}}>
      <h2 style={{fontFamily:FONT_DISPLAY,fontSize:21,color:C.text,margin:"0 0 16px",fontWeight:800,letterSpacing:"-.02em"}}>Favoritos</h2>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {["all","busqueda","oferta"].map(t=>(<button key={t} onClick={()=>setFiltroTipo(t)} style={{background:filtroTipo===t?C.accent:C.surface,color:filtroTipo===t?"#fff":C.muted,border:`1px solid ${filtroTipo===t?C.accent:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{t==="all"?"Todo":t==="busqueda"?"Pedidos":"Clases"}</button>))}
      </div>
      {loading?<SkeletonList n={5}/>:filtered.length===0?(<div style={{textAlign:"center",padding:"60px 0"}}><div style={{width:56,height:56,borderRadius:"50%",background:C.accentDim,color:C.accent,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Heart size={26} strokeWidth={1.8}/></div><p style={{color:C.muted,fontSize:13,marginBottom:posts.length===0?16:0}}>{posts.length===0?"No guardaste favoritos aún.":"Sin resultados."}</p>{posts.length===0&&onGoExplore&&<button onClick={onGoExplore} style={{background:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",border:"none",borderRadius:20,color:"#fff",padding:"10px 22px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 12px rgba(26,110,216,.25)"}}>Explorar clases →</button>}</div>):(
        <div style={{display:"grid",gap:11}}>{filtered.map(p=><PostCard key={p.id} post={p} session={session} onOpenChat={onOpenChat} onOpenDetail={onOpenDetail} onOpenPerfil={onOpenPerfil}/>)}</div>
      )}
    </div>
  );
}
