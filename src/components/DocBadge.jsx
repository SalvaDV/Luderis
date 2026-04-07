import React from "react";
import { C } from "../shared";

export default function DocBadge({avgUser,countPub,post}){
  if(post.verificado)return<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:"#1A6ED812",color:"#1A6ED8",border:"1px solid #1A6ED840",whiteSpace:"nowrap"}}>✓ Verificado</span>;
  if(avgUser>=4.5&&countPub>=3)return<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:"#F59E0B12",color:"#B45309",border:"1px solid #F59E0B40",whiteSpace:"nowrap"}}>⭐ Top Valorado</span>;
  if(countPub>=10)return<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:"#E05C5C12",color:"#C53030",border:"1px solid #E05C5C40",whiteSpace:"nowrap"}}>🔥 Popular</span>;
  return null;
}
