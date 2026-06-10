import React, { useState, useEffect, useCallback } from "react";
import { C, FONT, FONT_DISPLAY, Spinner, Avatar, useConfirm, toast } from "./shared";
import * as sb from "./supabase";
import { useAppActions } from "./AppContext";

// ─── CHATS PAGE — título real de la publicación (sin "Conversación") ───────────
export default function ChatsPage({session,onOpenChat}){
  const {openPub}=useAppActions();
  const [grupos,setGrupos]=useState([]);const [loading,setLoading]=useState(true);
  const [nombresMap,setNombresMap]=useState({});
  const [busquedaChat,setBusquedaChat]=useState("");
  const [grupoChats,setGrupoChats]=useState([]);
  const miEmail=session.user.email;
  const {confirm,confirmEl}=useConfirm();

  const cargar=useCallback(()=>{
    setLoading(true);
    sb.getMisChats(miEmail,session.access_token).then(async msgs=>{
      // ── Extraer chats grupales antes de filtrar ──────────────────────────────
      const gMap={};
      msgs.filter(m=>m.para_nombre==="__grupo__").forEach(m=>{
        const pk=m.publicacion_id;
        if(!pk)return;
        if(!gMap[pk]||m.created_at>gMap[pk].lastTime){
          gMap[pk]={pubId:pk,pubTitulo:m.pub_titulo||"Curso",lastTime:m.created_at,lastTexto:m.texto};
        }
      });
      setGrupoChats(Object.values(gMap).sort((a,b)=>new Date(b.lastTime)-new Date(a.lastTime)));

      // ── Chats directos (lógica original) ─────────────────────────────────────
      msgs=msgs.filter(m=>m.para_nombre!=="__grupo__"&&m.de_nombre!=="__grupo__");
      const pubMap={};
      msgs.forEach(m=>{
        const otro=m.de_nombre===miEmail?m.para_nombre:m.de_nombre;
        const pKey=m.publicacion_id||"sin-pub";
        if(!pubMap[pKey])pubMap[pKey]={pubId:m.publicacion_id,pubTitulo:m.pub_titulo||"",chats:{},lastTime:m.created_at};
        if(!pubMap[pKey].pubTitulo&&m.pub_titulo)pubMap[pKey].pubTitulo=m.pub_titulo;
        const cKey=otro;
        if(!pubMap[pKey].chats[cKey])pubMap[pKey].chats[cKey]={otro,ultimo:m,unread:0};
        else if(m.created_at>pubMap[pKey].chats[cKey].ultimo.created_at)pubMap[pKey].chats[cKey].ultimo=m;
        if(m.de_nombre!==miEmail&&!m.leido)pubMap[pKey].chats[cKey].unread++;
        if(m.created_at>pubMap[pKey].lastTime)pubMap[pKey].lastTime=m.created_at;
      });
      // Fetch pub titles
      const sinTitulo=Object.values(pubMap).filter(g=>g.pubId&&!g.pubTitulo);
      if(sinTitulo.length>0){
        try{const allPubs=await sb.getPublicaciones({},session.access_token);const pubById={};allPubs.forEach(p=>{pubById[p.id]=p.titulo;});sinTitulo.forEach(g=>{if(pubById[g.pubId])g.pubTitulo=pubById[g.pubId];});}catch{}
      }
      // Fetch display names for all "otro" emails
      const otroEmails=[...new Set(Object.values(pubMap).flatMap(g=>Object.values(g.chats).map(c=>c.otro)))];
      const nMap={};
      await Promise.all(otroEmails.map(async email=>{
        try{const u=await sb.getUsuarioByEmail(email,session.access_token);nMap[email]=u?.nombre||u?.display_name||email.split("@")[0];}catch{nMap[email]=email.split("@")[0];}
      }));
      setNombresMap(nMap);
      setGrupos(Object.values(pubMap).sort((a,b)=>new Date(b.lastTime)-new Date(a.lastTime)));
    }).finally(()=>setLoading(false));
  },[miEmail,session.access_token]);// eslint-disable-line

  useEffect(()=>{
    cargar();
  },[cargar]);// eslint-disable-line

  const borrarChat=async(pubId,otroEmail,e)=>{
    e.stopPropagation();
    if(!await confirm({msg:"¿Borrar esta conversación? Se eliminarán todos los mensajes.",confirmLabel:"Borrar",danger:true}))return;
    try{
      // Use admin-actions edge function which has service role to bypass RLS
      const res=await fetch(`${sb.SUPABASE_URL}/functions/v1/admin-actions`,{
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":sb.SUPABASE_KEY,"x-user-token":session.access_token,"Authorization":`Bearer ${session.access_token}`},
        body:JSON.stringify({action:"borrar_chat",pub_id:pubId,email_b:otroEmail})
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Error al borrar");
      cargar();
    }catch(err){toast("Error al borrar: "+err.message,"error");}
  };

  const getNombre=(email)=>nombresMap[email]||email.split("@")[0];

  const normChat=(s)=>(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  const q=normChat(busquedaChat.trim());
  const gruposFiltrados=busquedaChat.trim()
    ?grupos.filter(g=>{
        if(normChat(g.pubTitulo||"").includes(q))return true;
        return Object.values(g.chats).some(c=>normChat(getNombre(c.otro)).includes(q)||normChat(c.otro).includes(q));
      })
    :grupos;
  const gruposChatsFiltrados=busquedaChat.trim()
    ?grupoChats.filter(g=>normChat(g.pubTitulo||"").includes(q))
    :grupoChats;

  const hayAlgo=grupos.length>0||grupoChats.length>0;
  const hayResultados=gruposFiltrados.length>0||gruposChatsFiltrados.length>0;

  return(
    <div style={{fontFamily:FONT}}>
      {confirmEl}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:12}}>
        <h2 style={{fontFamily:FONT_DISPLAY,fontSize:21,color:C.text,margin:0,fontWeight:800,letterSpacing:"-.02em"}}>Mis chats</h2>
        {(grupos.length+grupoChats.length)>3&&(
          <div style={{display:"flex",alignItems:"center",gap:7,background:C.bg,border:`1px solid ${busquedaChat?C.accent:C.border}`,borderRadius:9,padding:"7px 12px",flex:1,maxWidth:240,transition:"border-color .15s"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={busquedaChat} onChange={e=>setBusquedaChat(e.target.value)} aria-label="Buscar chat" placeholder="Buscar chat…" style={{background:"none",border:"none",outline:"none",color:C.text,fontSize:13,fontFamily:FONT,flex:1,minWidth:0}}/>
            {busquedaChat&&<button onClick={()=>setBusquedaChat("")} style={{background:"none",border:"none",color:C.muted,fontSize:15,cursor:"pointer",padding:0,lineHeight:1,flexShrink:0}}>×</button>}
          </div>
        )}
      </div>
      {loading?<Spinner/>:!hayAlgo?(
        <div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,marginBottom:12,color:C.border}}>◻</div><p style={{color:C.muted,fontSize:13,marginBottom:8}}>No iniciaste ninguna conversación.</p><p style={{color:C.muted,fontSize:12}}>Inscribite en una clase o que acepten tu oferta para poder chatear.</p></div>
      ):!hayResultados?(
        <div style={{textAlign:"center",padding:"40px 0"}}><div style={{fontSize:32,marginBottom:10,color:C.border}}>🔍</div><p style={{color:C.muted,fontSize:13}}>Sin resultados para "{busquedaChat}"</p><button onClick={()=>setBusquedaChat("")} style={{background:"none",border:"none",color:C.accent,fontSize:12,cursor:"pointer",fontFamily:FONT,textDecoration:"underline"}}>Limpiar búsqueda</button></div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>

          {/* ── Chats grupales ─────────────────────────────────────────────── */}
          {gruposChatsFiltrados.length>0&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{height:1,flex:1,background:C.border}}/>
                <span style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.5,display:"flex",alignItems:"center",gap:4}}>
                  <span>👥</span> CHATS GRUPALES
                </span>
                <div style={{height:1,flex:1,background:C.border}}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {gruposChatsFiltrados.map((g,i)=>(
                  <div key={i}
                    role="button" tabIndex={0} aria-label={`Abrir chat grupal de ${g.pubTitulo||"la publicación"}`}
                    onClick={()=>{if(openPub)openPub(g.pubId);}}
                    onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();if(openPub)openPub(g.pubId);}}}
                    style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:13,padding:"11px 15px",display:"flex",alignItems:"center",gap:11,cursor:"pointer",transition:"border-color .12s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:C.accent+"18",border:`1px solid ${C.accent}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>👥</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.pubTitulo}</div>
                      <div style={{color:C.muted,fontSize:12}}>Chat grupal · {g.lastTexto?.startsWith("[img]")?"📷 Imagen":g.lastTexto||"—"}</div>
                    </div>
                    <span style={{fontSize:12,color:C.accent,fontWeight:600,flexShrink:0}}>Ver →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Chats directos ─────────────────────────────────────────────── */}
          {gruposFiltrados.map((g,gi)=>(
            <div key={gi}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{height:1,flex:1,background:C.border}}/>
                <span style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.5,whiteSpace:"nowrap",maxWidth:"70%",overflow:"hidden",textOverflow:"ellipsis"}}>{g.pubTitulo||"Sin título"}</span>
                <div style={{height:1,flex:1,background:C.border}}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {Object.values(g.chats).sort((a,b)=>new Date(b.ultimo.created_at)-new Date(a.ultimo.created_at)).map((c,i)=>(
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  <div key={i} style={{background:C.card,border:`1px solid ${c.unread>0?C.accent:C.border}`,borderRadius:13,padding:"11px 15px",display:"flex",alignItems:"center",gap:11,position:"relative"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=c.unread>0?C.accent:C.border}>
                    <div role="button" tabIndex={0} aria-label={`Abrir chat con ${getNombre(c.otro)}`} onClick={()=>onOpenChat({id:g.pubId,autor_email:c.otro,titulo:g.pubTitulo,autor_nombre:getNombre(c.otro)})} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onOpenChat({id:g.pubId,autor_email:c.otro,titulo:g.pubTitulo,autor_nombre:getNombre(c.otro)});}}} style={{display:"flex",alignItems:"center",gap:11,flex:1,minWidth:0,cursor:"pointer"}}>
                      <Avatar letra={getNombre(c.otro)[0]} size={34}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:1}}>{getNombre(c.otro)}</div>
                        <div style={{color:C.muted,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                          <span style={{color:c.ultimo.de_nombre===miEmail?C.accent:C.text,fontWeight:600,fontSize:11}}>{c.ultimo.de_nombre===miEmail?"Vos":getNombre(c.otro)}: </span>
                          {c.ultimo.texto?.startsWith("[img]")?"📷 Imagen":c.ultimo.texto}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                      {c.unread>0&&<span style={{background:C.accent,color:"#fff",borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 7px"}}>{c.unread} nuevo{c.unread!==1?"s":""}</span>}
                      <button onClick={(e)=>borrarChat(g.pubId,c.otro,e)}
                        style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,fontSize:12,padding:"3px 8px",cursor:"pointer",fontFamily:FONT,flexShrink:0,transition:"all .12s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.danger;e.currentTarget.style.color=C.danger;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
