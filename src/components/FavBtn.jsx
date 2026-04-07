import React, { useState, useEffect } from "react";
import * as sb from "../supabase";
import { C } from "../shared";

export default function FavBtn({post,session,onFavChange,isFav,favId:favIdProp}){
  const [favId,setFavId]=useState(favIdProp||null);
  const [loading,setLoading]=useState(isFav===undefined);
  useEffect(()=>{
    if(isFav!==undefined){setFavId(favIdProp||null);setLoading(false);return;}
    sb.getFavoritos(session.user.email,session.access_token)
      .then(favs=>{const f=favs.find(f=>f.publicacion_id===post.id);setFavId(f?.id||null);})
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[post.id,session.user.email,isFav,favIdProp]);// eslint-disable-line
  const toggle=async(e)=>{
    e.stopPropagation();if(loading)return;setLoading(true);
    try{
      if(favId){await sb.deleteFavorito(favId,session.access_token);setFavId(null);}
      else{const r=await sb.insertFavorito({publicacion_id:post.id,usuario_email:session.user.email,usuario_id:session.user.id},session.access_token);setFavId(r?.[0]?.id||null);}
      if(onFavChange)onFavChange();
    }catch{}finally{setLoading(false);}
  };
  const active=!!favId;
  return(
    <button onClick={toggle} title={active?"Quitar favorito":"Agregar a favoritos"}
      style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:active?C.accent:"#aaa",transition:"color .15s",padding:"0 3px",lineHeight:1,opacity:loading?0.5:1}}
      onMouseEnter={e=>{if(!active)e.currentTarget.style.color=C.accent;}}
      onMouseLeave={e=>{if(!active)e.currentTarget.style.color="#aaa";}}>
      {active?"★":"☆"}
    </button>
  );
}
