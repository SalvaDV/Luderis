import React from "react";
import { BadgeCheck, Star, Flame } from "lucide-react";

export default function DocBadge({avgUser,countPub,post}){
  if(post.verificado)return<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:"#1A6ED812",color:"#1A6ED8",border:"1px solid #1A6ED840",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:3}}><BadgeCheck size={10} strokeWidth={2.5}/>Verificado</span>;
  if(avgUser>=4.5&&countPub>=3)return<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:"#F59E0B12",color:"#B45309",border:"1px solid #F59E0B40",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:3}}><Star size={10} strokeWidth={2.5}/>Top Valorado</span>;
  if(countPub>=10)return<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:"#E05C5C12",color:"#C53030",border:"1px solid #E05C5C40",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:3}}><Flame size={10} strokeWidth={2.5}/>Popular</span>;
  return null;
}
