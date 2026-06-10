import React, { useState, useEffect, useCallback, useRef } from "react";
import { C, FONT, FONT_DISPLAY, Spinner, Avatar, useConfirm, toast } from "./shared";
import * as sb from "./supabase";
import { useAppActions } from "./AppContext";
import ChatModal from "./components/ChatModal";

// Hora compacta estilo mensajería: hoy → HH:MM, ayer → "Ayer", resto → dd/mm
const horaChat=(iso)=>{
  if(!iso)return "";
  const d=new Date(iso),now=new Date();
  if(d.toDateString()===now.toDateString())return d.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
  const ayer=new Date(now);ayer.setDate(now.getDate()-1);
  if(d.toDateString()===ayer.toDateString())return "Ayer";
  return d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"});
};
const preview=(t)=>(t||"").startsWith("[img]")?"📷 Imagen":(t||"—");

// ─── CHATS PAGE — vista master-detail (lista + conversación) ────────────────────
export default function ChatsPage({session,onOpenChat,onUnreadChange,isMobile=false}){
  const {openPub}=useAppActions();
  const [grupos,setGrupos]=useState([]);const [loading,setLoading]=useState(true);
  const [nombresMap,setNombresMap]=useState({});
  const [busquedaChat,setBusquedaChat]=useState("");
  const [grupoChats,setGrupoChats]=useState([]);
  const [selected,setSelected]=useState(null);// {id,autor_email,titulo,autor_nombre}
  const [hoverKey,setHoverKey]=useState(null);
  const miEmail=session.user.email;
  const {confirm,confirmEl}=useConfirm();
  const autoSelDone=useRef(false);

  const cargar=useCallback(()=>{
    // No reseteamos `loading` en refrescos: el spinner solo aplica a la primera
    // carga. Si no, cada refresh (al marcar leídos) desmontaría el panel derecho
    // y reiniciaría el WebSocket del chat en loop.
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
      setSelected(s=>(s&&s.id===pubId&&s.autor_email===otroEmail)?null:s);
      cargar();
    }catch(err){toast("Error al borrar: "+err.message,"error");}
  };

  const getNombre=(email)=>nombresMap[email]||email.split("@")[0];

  // ── Aplanar todas las conversaciones en una sola lista ordenada ──────────────
  const lista=[];
  grupoChats.forEach(g=>lista.push({
    key:`grupo|${g.pubId}`,tipo:"grupo",pubId:g.pubId,pubTitulo:g.pubTitulo,
    nombre:g.pubTitulo,ultimoTexto:`Chat grupal · ${preview(g.lastTexto)}`,unread:0,lastTime:g.lastTime,
  }));
  grupos.forEach(g=>Object.values(g.chats).forEach(c=>{
    const yo=c.ultimo.de_nombre===miEmail;
    lista.push({
      key:`${g.pubId}|${c.otro}`,tipo:"directo",pubId:g.pubId,pubTitulo:g.pubTitulo,otro:c.otro,
      nombre:getNombre(c.otro),
      ultimoTexto:`${yo?"Vos: ":""}${preview(c.ultimo.texto)}`,
      unread:c.unread,lastTime:c.ultimo.created_at,
    });
  }));
  lista.sort((a,b)=>new Date(b.lastTime)-new Date(a.lastTime));

  const norm=(s)=>(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  const q=norm(busquedaChat.trim());
  const filtrados=q?lista.filter(c=>norm(c.nombre).includes(q)||norm(c.pubTitulo).includes(q)||(c.otro&&norm(c.otro).includes(q))):lista;

  const totalUnread=lista.reduce((a,c)=>a+c.unread,0);
  const selKey=selected?`${selected.id}|${selected.autor_email}`:null;

  const abrir=(c)=>{
    if(c.tipo==="grupo"){if(openPub)openPub(c.pubId);return;}
    const post={id:c.pubId,autor_email:c.otro,titulo:c.pubTitulo,autor_nombre:c.nombre};
    if(isMobile){if(onOpenChat)onOpenChat(post);}
    else setSelected(post);
  };

  // Auto-seleccionar el primer chat directo en desktop (una sola vez tras cargar)
  useEffect(()=>{
    if(isMobile||autoSelDone.current||loading)return;
    const primero=filtrados.find(c=>c.tipo==="directo");
    if(primero){
      autoSelDone.current=true;
      setSelected({id:primero.pubId,autor_email:primero.otro,titulo:primero.pubTitulo,autor_nombre:primero.nombre});
    }
  },[loading,isMobile,filtrados]);// eslint-disable-line

  const onConvUnread=useCallback(()=>{cargar();if(onUnreadChange)onUnreadChange();},[cargar,onUnreadChange]);

  // ── Render de una fila de la lista ──────────────────────────────────────────
  // Función plana (no componente) + hover en el padre: evita crear un tipo de
  // componente nuevo en cada render, que remontaría todas las filas en cada refresh.
  const renderFila=(c)=>{
    const active=c.key===selKey;
    const h=c.key===hoverKey;
    const grupo=c.tipo==="grupo";
    return(
      <div key={c.key} role="button" tabIndex={0} aria-label={`Abrir chat de ${c.nombre}`}
        onClick={()=>abrir(c)}
        onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();abrir(c);}}}
        onMouseEnter={()=>setHoverKey(c.key)} onMouseLeave={()=>setHoverKey(k=>k===c.key?null:k)}
        style={{display:"flex",gap:12,padding:"12px 14px",borderBottom:`1px solid ${C.hairline}`,cursor:"pointer",background:active?C.accentDim:h?C.surfaceAlt:"transparent",transition:"background .14s",position:"relative"}}>
        <div style={{flexShrink:0}}>
          {grupo
            ?<div style={{width:44,height:44,borderRadius:"50%",background:C.accentDim,color:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`1px solid ${C.accent}30`}}>👥</div>
            :<Avatar letra={(c.nombre||"?")[0]} size={44}/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:8}}>
            <span style={{fontSize:13.5,fontWeight:c.unread?700:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.nombre}</span>
            <span style={{fontSize:11.5,color:c.unread?C.accent:C.faint,fontWeight:c.unread?700:500,flexShrink:0}}>{horaChat(c.lastTime)}</span>
          </div>
          <div style={{fontSize:12,color:C.faint,margin:"1px 0 4px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.pubTitulo||"—"}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{flex:1,fontSize:12.5,color:c.unread?C.textSoft:C.muted,fontWeight:c.unread?600:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.ultimoTexto}</span>
            {c.unread>0&&<span style={{flexShrink:0,minWidth:19,height:19,padding:"0 6px",borderRadius:10,background:C.accent,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{c.unread}</span>}
            {!grupo&&h&&(
              <button onClick={(e)=>borrarChat(c.pubId,c.otro,e)} aria-label="Borrar conversación"
                style={{flexShrink:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,fontSize:12,padding:"2px 6px",cursor:"pointer",fontFamily:FONT,lineHeight:1.2}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.danger;e.currentTarget.style.color=C.danger;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>🗑</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Panel lista (búsqueda + filas) ──────────────────────────────────────────
  const listPanel=(
    <div style={{display:"flex",flexDirection:"column",background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",boxShadow:C.shadow,height:"100%",minHeight:0}}>
      <div style={{padding:14,borderBottom:`1px solid ${C.hairline}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:9,background:C.surfaceAlt,border:`1px solid ${busquedaChat?C.accent:C.border}`,borderRadius:10,padding:"8px 12px",transition:"border-color .15s"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input id="chats-buscar" name="chats-buscar" type="search" value={busquedaChat} onChange={e=>setBusquedaChat(e.target.value)} aria-label="Buscar conversación" placeholder="Buscar conversación…" style={{flex:1,border:"none",outline:"none",background:"transparent",fontFamily:FONT,fontSize:13.5,color:C.text,minWidth:0}}/>
          {busquedaChat&&<button onClick={()=>setBusquedaChat("")} style={{background:"none",border:"none",color:C.muted,fontSize:16,cursor:"pointer",padding:0,lineHeight:1,flexShrink:0}}>×</button>}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",minHeight:0}}>
        {filtrados.length===0
          ?<div style={{padding:"40px 20px",textAlign:"center",color:C.muted,fontSize:13}}>{busquedaChat?`Sin resultados para "${busquedaChat}"`:"No iniciaste ninguna conversación."}</div>
          :filtrados.map(renderFila)}
      </div>
    </div>
  );

  // ── Panel conversación (derecha, desktop) ───────────────────────────────────
  const emptyPanel=(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:C.shadow,textAlign:"center",padding:24}}>
      <div style={{fontSize:34,marginBottom:10,opacity:.5}}>💬</div>
      <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:4}}>Elegí una conversación</div>
      <div style={{fontSize:13,color:C.muted}}>Seleccioná un chat de la lista para ver los mensajes.</div>
    </div>
  );

  return(
    <div style={{fontFamily:FONT,display:"flex",flexDirection:"column",height:isMobile?"auto":"calc(100vh - 96px)"}}>
      {confirmEl}
      <div style={{marginBottom:16,flexShrink:0}}>
        <h2 style={{fontFamily:FONT_DISPLAY,fontSize:21,color:C.text,margin:0,fontWeight:800,letterSpacing:"-.02em"}}>Mis chats</h2>
        <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>
          {totalUnread>0?`Tenés ${totalUnread} mensaje${totalUnread!==1?"s":""} sin leer.`:"Coordiná tus clases con docentes y alumnos."}
        </p>
      </div>

      {loading?<Spinner/>:isMobile?(
        listPanel
      ):(
        <div style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:16,flex:1,minHeight:460}}>
          {listPanel}
          {selected
            ?<ChatModal key={selKey} post={selected} session={session} embedded onClose={()=>setSelected(null)} onUnreadChange={onConvUnread}/>
            :emptyPanel}
        </div>
      )}
    </div>
  );
}
