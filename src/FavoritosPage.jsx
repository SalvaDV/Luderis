import React, { useState, useEffect } from "react";
import { C, FONT, Spinner } from "./shared";
import * as sb from "./supabase";
import PostCard from "./components/PostCard";

export default function FavoritosPage({session,onOpenDetail,onOpenChat,onOpenPerfil}){
  const [posts,setPosts]=useState([]);const [loading,setLoading]=useState(true);const [filtroTipo,setFiltroTipo]=useState("all");
  useEffect(()=>{
    let mounted=true;
    sb.getFavoritos(session.user.email,session.access_token).then(async fs=>{
      if(!mounted)return;
      if(fs.length>0){const all=await sb.getPublicaciones({},session.access_token);if(mounted){const ids=new Set(fs.map(f=>f.publicacion_id));setPosts(all.filter(p=>ids.has(p.id)));}}
    }).finally(()=>{if(mounted)setLoading(false);});
    return()=>{mounted=false;};
  },[session]);
  const filtered=posts.filter(p=>filtroTipo==="all"||p.tipo===filtroTipo);
  return(
    <div style={{fontFamily:FONT}}>
      <h2 style={{fontSize:20,color:C.text,margin:"0 0 16px",fontWeight:700}}>Favoritos</h2>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {["all","busqueda","oferta"].map(t=>(<button key={t} onClick={()=>setFiltroTipo(t)} style={{background:filtroTipo===t?C.accent:C.surface,color:filtroTipo===t?"#fff":C.muted,border:`1px solid ${filtroTipo===t?C.accent:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{t==="all"?"Todo":t==="busqueda"?"Búsquedas":"Ofertas"}</button>))}
      </div>
      {loading?<Spinner/>:filtered.length===0?(<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,marginBottom:12}}>★</div><p style={{color:C.muted,fontSize:13}}>{posts.length===0?"No guardaste favoritos aún.":"Sin resultados."}</p></div>):(
        <div style={{display:"grid",gap:11}}>{filtered.map(p=><PostCard key={p.id} post={p} session={session} onOpenChat={onOpenChat} onOpenDetail={onOpenDetail} onOpenPerfil={onOpenPerfil}/>)}</div>
      )}
    </div>
  );
}
