import { useState, useEffect, useCallback, useRef } from "react";
import * as sb from "./supabase";

const C={bg:"#0D0D0D",surface:"#111",card:"#181818",border:"#242424",accent:"#F5C842",accentDim:"#F5C84215",text:"#F0EDE6",muted:"#666",success:"#4ECB71",danger:"#E05C5C",sidebar:"#0A0A0A",info:"#5CA8E0",purple:"#C85CE0",warn:"#E0955C"};
const FONT="'Open Sans',sans-serif";
const MATERIAS=["Matemáticas","Física","Química","Inglés","Programación","Historia","Biología","Literatura","Economía","Arte"];
const avatarColor=(l)=>["#F5C842","#4ECB71","#E05C5C","#5CA8E0","#C85CE0"][(l||"?").toUpperCase().charCodeAt(0)%5];
const fmt=(d)=>d?new Date(d).toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"}):"";
const fmtPrice=(p)=>p?`$${Number(p).toLocaleString("es-AR")}`:"A convenir";
const calcAvg=(arr)=>{if(!arr||!arr.length)return null;return arr.reduce((a,r)=>a+(r.estrellas||0),0)/arr.length;};
const calcDuracion=(ini,fin)=>{if(!ini||!fin)return null;const d=Math.round((new Date(fin)-new Date(ini))/(86400000));if(d<=0)return null;if(d<7)return `${d} día${d!==1?"s":""}`;if(d<30)return `${Math.round(d/7)} semana${Math.round(d/7)!==1?"s":""}`;return `${Math.round(d/30)} mes${Math.round(d/30)!==1?"es":""}`;};

const Spinner=({small})=>(<div style={{display:"flex",justifyContent:"center",padding:small?"4px":"32px 0"}}><div style={{width:small?16:26,height:small?16:26,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:"50%",animation:"spin .8s linear infinite"}}/></div>);
const Avatar=({letra,size=38})=>(<div style={{width:size,height:size,borderRadius:"50%",background:avatarColor(letra),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*.4,color:"#0D0D0D",flexShrink:0,fontFamily:FONT}}>{(letra||"?")[0].toUpperCase()}</div>);
const Tag=({tipo})=>(<span style={{fontSize:11,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",padding:"3px 10px",borderRadius:20,background:tipo==="oferta"?"#4ECB7122":"#F5C84222",color:tipo==="oferta"?C.success:C.accent,border:`1px solid ${tipo==="oferta"?"#4ECB7144":"#F5C84244"}`,fontFamily:FONT}}>{tipo==="oferta"?"📚 Oferta":"🔍 Búsqueda"}</span>);
const StatusBadge=({activo,finalizado})=>{
  if(finalizado)return<span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:"#5CA8E015",color:C.info,border:"1px solid #5CA8E033",fontFamily:FONT}}>✓ Finalizada</span>;
  return<span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:activo?"#4ECB7115":"#E05C5C15",color:activo?C.success:C.danger,border:`1px solid ${activo?"#4ECB7133":"#E05C5C33"}`,fontFamily:FONT}}>{activo?"● Activa":"○ Pausada"}</span>;
};
const VerifiedBadge=()=>(<span style={{fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:20,background:"#5CA8E022",color:C.info,border:"1px solid #5CA8E044",fontFamily:FONT}}>✓ Verificado</span>);
const StarRating=({val,count,small})=>{if(!count&&!val)return <span style={{color:C.muted,fontSize:small?11:12,fontStyle:"italic"}}>Sin valoraciones</span>;const v=parseFloat(val)||0;return <span style={{color:C.accent,fontSize:small?12:13}}>{"★".repeat(Math.round(v))}{"☆".repeat(5-Math.round(v))}<span style={{color:C.muted,marginLeft:4,fontSize:small?11:12}}>{v.toFixed(1)}{count!==undefined&&` (${count})`}</span></span>;};
const Input=({style={},...props})=>(<input style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:FONT,...style}} {...props}/>);
const Btn=({children,variant="primary",style={},...props})=>(<button style={{background:variant==="primary"?C.accent:variant==="danger"?C.danger:variant==="success"?C.success:variant==="warn"?C.warn:variant==="info"?C.info:"transparent",color:["primary","success","warn","info"].includes(variant)?"#0D0D0D":variant==="danger"?"#fff":C.text,border:variant==="ghost"?`1px solid ${C.border}`:"none",borderRadius:10,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,...style}} {...props}>{children}</button>);
const ErrMsg=({msg})=>msg?<div style={{color:C.danger,fontSize:12,margin:"5px 0",fontFamily:FONT}}>{msg}</div>:null;
const Label=({children})=><div style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:1,marginBottom:5,textTransform:"uppercase"}}>{children}</div>;
const Modal=({children,onClose,width="min(600px,97vw)"})=>(<div style={{position:"fixed",inset:0,background:"#000c",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:12,fontFamily:FONT}} onClick={onClose}><div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,width,maxHeight:"94vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>{children}</div></div>);
const Chip=({label,val})=>val?(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 12px"}}><div style={{color:C.muted,fontSize:10,letterSpacing:1,marginBottom:1}}>{label}</div><div style={{color:C.text,fontWeight:600,fontSize:13}}>{val}</div></div>):null;
const MiniStars=({val,count})=>{if(!val)return null;const v=parseFloat(val);return(<span style={{display:"inline-flex",alignItems:"center",gap:3,background:"#F5C84218",border:"1px solid #F5C84233",borderRadius:20,padding:"2px 8px"}}><span style={{color:C.accent,fontSize:11}}>★</span><span style={{color:C.accent,fontSize:11,fontWeight:700}}>{v.toFixed(1)}</span>{count>0&&<span style={{color:C.muted,fontSize:10}}>({count})</span>}</span>);};

// ─── CALENDARIO ────────────────────────────────────────────────────────────────
function CalendarioCurso({post,compact=false}){
  const [mesOffset,setMesOffset]=useState(0);const [diaSelec,setDiaSelec]=useState(null);
  const cs=useRef(null);
  if(!cs.current){try{cs.current=post.clases_sinc?JSON.parse(post.clases_sinc):[]}catch{cs.current=[];}}
  if(!cs.current.length)return null;
  const hoy=new Date();const base=new Date(hoy.getFullYear(),hoy.getMonth()+mesOffset,1);
  const year=base.getFullYear();const month=base.getMonth();
  const primerDia=(base.getDay()+6)%7;const diasEnMes=new Date(year,month+1,0).getDate();
  const inicio=post.fecha_inicio?new Date(post.fecha_inicio):null;const fin=post.fecha_fin?new Date(post.fecha_fin):null;
  const DIAS_NOMBRES=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const claseDias=new Set();
  for(let d=1;d<=diasEnMes;d++){const f=new Date(year,month,d);if(inicio&&f<inicio)continue;if(fin&&f>fin)continue;if(cs.current.some(c=>c.dia===DIAS_NOMBRES[(f.getDay()+6)%7]))claseDias.add(d);}
  const clasesDelDia=(d)=>{const dn=DIAS_NOMBRES[(new Date(year,month,d).getDay()+6)%7];return cs.current.filter(c=>c.dia===dn);};
  const celdas=[];for(let i=0;i<primerDia;i++)celdas.push(null);for(let d=1;d<=diasEnMes;d++)celdas.push(d);
  const mesLabel=base.toLocaleDateString("es-AR",{month:"long",year:"numeric"});
  return(
    <div style={{background:C.card,borderRadius:14,padding:compact?10:16,border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <button onClick={()=>setMesOffset(m=>m-1)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"2px 9px",cursor:"pointer",fontFamily:FONT,fontSize:15}}>‹</button>
        <span style={{color:C.text,fontWeight:600,fontSize:compact?12:13,textTransform:"capitalize"}}>{mesLabel}</span>
        <button onClick={()=>setMesOffset(m=>m+1)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"2px 9px",cursor:"pointer",fontFamily:FONT,fontSize:15}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2}}>
        {["Lu","Ma","Mi","Ju","Vi","Sá","Do"].map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:C.muted,fontWeight:600}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {celdas.map((d,i)=>{
          if(!d)return <div key={i}/>;
          const tc=claseDias.has(d);const esHoy=d===hoy.getDate()&&month===hoy.getMonth()&&year===hoy.getFullYear();const sel=diaSelec===d;
          return(<div key={i} onClick={()=>tc&&setDiaSelec(sel?null:d)} style={{textAlign:"center",padding:compact?"4px 1px":"5px 1px",borderRadius:7,fontSize:compact?11:12,fontWeight:tc?700:400,background:sel?C.accent:tc?C.accentDim:"transparent",color:sel?"#0D0D0D":tc?C.accent:esHoy?C.text:C.muted,border:esHoy?`1px solid ${C.border}`:"1px solid transparent",cursor:tc?"pointer":"default"}}>
            {d}{tc&&!sel&&<div style={{width:3,height:3,background:C.accent,borderRadius:"50%",margin:"1px auto 0"}}/>}
          </div>);
        })}
      </div>
      {diaSelec&&clasesDelDia(diaSelec).map((c,i)=>(<div key={i} style={{marginTop:8,background:C.accentDim,border:`1px solid #F5C84233`,borderRadius:9,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14}}>🕐</span><div><div style={{color:C.accent,fontWeight:700,fontSize:11}}>{c.dia} {new Date(year,month,diaSelec).toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</div><div style={{color:C.text,fontSize:12}}>{c.hora_inicio} → {c.hora_fin}</div></div></div>))}
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthScreen({onLogin}){
  const [mode,setMode]=useState("login");const [email,setEmail]=useState("");const [pass,setPass]=useState("");const [pass2,setPass2]=useState("");
  const [loading,setLoading]=useState(false);const [err,setErr]=useState("");const [ok,setOk]=useState("");
  const handle=async()=>{
    setErr("");setOk("");if(!email){setErr("Ingresá tu email");return;}
    if(mode!=="forgot"&&!pass){setErr("Ingresá contraseña");return;}
    if(mode==="register"&&pass!==pass2){setErr("Las contraseñas no coinciden");return;}
    setLoading(true);
    try{
      if(mode==="forgot"){await sb.resetPassword(email);setOk("Te enviamos un email.");}
      else if(mode==="register"){
        const r=await sb.signUp(email,pass);
        if(r.access_token){
          // Crear el registro en la tabla usuarios (requiere el UUID del auth user)
          const uid=r.user?.id;
          if(uid){
            try{await sb.insertUsuario({id:uid,email,nombre:email.split("@")[0]},r.access_token);}catch{}
          }
          sb.saveSession(r);onLogin(r);
        }else setOk("Confirmá tu email y luego iniciá sesión.");
      }
      else{
        const r=await sb.signIn(email,pass);
        // Asegurar que el registro existe en la tabla usuarios
        const uid=r.user?.id;
        if(uid){try{await sb.upsertUsuario({id:uid,email,nombre:email.split("@")[0]},r.access_token);}catch{}}
        sb.saveSession(r);onLogin(r);
      }
    }catch(e){setErr(e.message||"Error");}finally{setLoading(false);}
  };
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:FONT}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:22,padding:"36px 32px",width:"min(420px,92vw)",textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:10}}>🎓</div>
        <h2 style={{fontFamily:"Georgia,serif",color:C.text,fontSize:26,margin:"0 0 4px"}}>ClasseLink</h2>
        <p style={{color:C.muted,marginBottom:24,fontSize:13}}>Conectá con profesores y estudiantes</p>
        <div style={{display:"flex",gap:4,marginBottom:20,background:C.card,borderRadius:12,padding:4}}>
          {["login","register"].map(m=>(<button key={m} onClick={()=>{setMode(m);setErr("");setOk("");}} style={{flex:1,padding:"8px",borderRadius:9,border:"none",fontWeight:600,fontSize:13,cursor:"pointer",background:mode===m?C.accent:"transparent",color:mode===m?"#0D0D0D":C.muted,fontFamily:FONT}}>{m==="login"?"Iniciar sesión":"Registrarse"}</button>))}
        </div>
        {mode==="forgot"?(<>
          <Input type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={{marginBottom:10}}/>
          <ErrMsg msg={err}/>{ok&&<div style={{color:C.success,fontSize:13,marginBottom:8}}>{ok}</div>}
          <Btn onClick={handle} disabled={loading} style={{width:"100%",marginBottom:10}}>{loading?"Enviando...":"Enviar link"}</Btn>
          <button onClick={()=>{setMode("login");setErr("");setOk("");}} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:FONT}}>← Volver</button>
        </>):(<>
          <Input type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={{marginBottom:9}} onKeyDown={e=>e.key==="Enter"&&handle()}/>
          <Input type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)} style={{marginBottom:9}} onKeyDown={e=>e.key==="Enter"&&handle()}/>
          {mode==="register"&&<Input type="password" placeholder="Repetir contraseña" value={pass2} onChange={e=>setPass2(e.target.value)} style={{marginBottom:9}}/>}
          <ErrMsg msg={err}/>{ok&&<div style={{color:C.success,fontSize:13,marginBottom:8}}>{ok}</div>}
          <Btn onClick={handle} disabled={loading} style={{width:"100%",padding:"12px",fontSize:14,marginBottom:12,borderRadius:12}}>{loading?"...":mode==="login"?"Entrar →":"Crear cuenta →"}</Btn>
          {mode==="login"&&<button onClick={()=>{setMode("forgot");setErr("");setOk("");}} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:FONT}}>¿Olvidaste tu contraseña?</button>}
        </>)}
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({page,setPage,session,onLogout,onNewPost,unreadCount,ofertasCount,notifCount,mobile,open,onClose}){
  const nombre=sb.getDisplayName(session.user.email);
  const nav=[
    {id:"explore",icon:"⊞",label:"Explorar"},
    {id:"chats",icon:"💬",label:"Mis chats",badge:unreadCount},
    {id:"favoritos",icon:"★",label:"Favoritos"},
    {id:"inscripciones",icon:"📚",label:"Mis inscripciones",badge:notifCount},
    {id:"cuenta",icon:"👤",label:"Mi cuenta",badge:ofertasCount},
  ];
  const inner=(
    <div style={{width:224,height:"100%",background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",fontFamily:FONT}}>
      <div style={{padding:"16px 16px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>🎓</span><span style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,color:C.text}}>Classe<span style={{color:C.accent}}>Link</span></span></div>
        {mobile&&<button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>×</button>}
      </div>
      <nav style={{padding:"10px 8px",flex:1}}>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:C.muted,padding:"0 8px",marginBottom:6}}>MENÚ</div>
        {nav.map(item=>(<button key={item.id} onClick={()=>{setPage(item.id);if(mobile)onClose();}} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:9,border:"none",background:page===item.id?C.accentDim:"transparent",color:page===item.id?C.accent:C.muted,fontWeight:page===item.id?600:400,fontSize:12,cursor:"pointer",marginBottom:2,fontFamily:FONT,textAlign:"left"}}>
          <span style={{fontSize:13}}>{item.icon}</span>{item.label}
          {item.badge>0&&<span style={{marginLeft:"auto",background:C.danger,color:"#fff",borderRadius:20,fontSize:9,fontWeight:700,padding:"1px 5px"}}>{item.badge}</span>}
        </button>))}
        <div style={{margin:"10px 0 8px",height:1,background:C.border}}/>
        <Btn onClick={()=>{onNewPost();if(mobile)onClose();}} style={{width:"100%",padding:"8px 10px",fontSize:11,borderRadius:9}}>+ Nueva publicación</Btn>
      </nav>
      <div style={{padding:"8px 8px",borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 9px",marginBottom:5}}>
          <Avatar letra={nombre[0]} size={26}/>
          <div style={{overflow:"hidden"}}><div style={{color:C.text,fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{nombre}</div><div style={{color:C.muted,fontSize:10,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{session.user.email}</div></div>
        </div>
        <button onClick={onLogout} style={{width:"100%",background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"6px 10px",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",gap:6,fontFamily:FONT}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.danger;e.currentTarget.style.color=C.danger;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>↩ Cerrar sesión</button>
      </div>
    </div>
  );
  if(mobile)return(<>{open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"#000a",zIndex:89}}/>}<div style={{position:"fixed",left:0,top:0,height:"100vh",zIndex:90,transform:open?"translateX(0)":"translateX(-100%)",transition:"transform .25s"}}>{inner}</div></>);
  return <div style={{position:"fixed",left:0,top:0,height:"100vh",zIndex:40}}>{inner}</div>;
}

// ─── FAV BUTTON — estrella visible en gris cuando no está guardada ─────────────
function FavBtn({post,session,onFavChange}){
  const [favId,setFavId]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{sb.getFavoritos(session.user.email,session.access_token).then(favs=>{const f=favs.find(f=>f.publicacion_id===post.id);setFavId(f?.id||null);}).finally(()=>setLoading(false));},[post.id,session]);
  const toggle=async(e)=>{e.stopPropagation();if(loading)return;setLoading(true);try{if(favId){await sb.deleteFavorito(favId,session.access_token);setFavId(null);}else{const r=await sb.insertFavorito({publicacion_id:post.id,usuario_email:session.user.email,usuario_id:session.user.id},session.access_token);setFavId(r[0]?.id);}if(onFavChange)onFavChange();}finally{setLoading(false);}};
  return(
    <button onClick={toggle} title={favId?"Quitar favorito":"Agregar a favoritos"}
      style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:favId?C.accent:"#aaa",transition:"color .15s",padding:"0 3px",lineHeight:1,opacity:loading?.5:1}}
      onMouseEnter={e=>{if(!favId)e.currentTarget.style.color=C.accent;}}
      onMouseLeave={e=>{if(!favId)e.currentTarget.style.color="#aaa";}}>
      {favId?"★":"☆"}
    </button>
  );
}

// ─── OFERTAR BTN — solo se muestra en el modal de detalle, NO en la card ──────
function OfertarBtn({post,session}){
  const [open,setOpen]=useState(false);const [precio,setPrecio]=useState("");const [tipo,setTipo]=useState("hora");const [msg,setMsg]=useState("");const [saving,setSaving]=useState(false);const [ok,setOk]=useState(false);
  if(post.tipo!=="busqueda"||post.autor_email===session.user.email||post.activo===false||post.finalizado)return null;
  const cerrar=()=>setOpen(false);
  const enviar=async()=>{
    if(!msg.trim())return;setSaving(true);
    try{
      const payload={busqueda_id:post.id,busqueda_autor_email:post.autor_email,ofertante_id:session.user.id,ofertante_email:session.user.email,ofertante_nombre:sb.getDisplayName(session.user.email),precio:precio?parseFloat(precio):null,precio_tipo:tipo,mensaje:msg,leida:false};
      await sb.insertOfertaBusq(payload,session.access_token);
      setOk(true);setTimeout(()=>{cerrar();setOk(false);setMsg("");setPrecio("");},1400);
    }catch(e){
      const msg2=e.message||"";
      if(msg2.includes("estado"))alert("Error de esquema: la columna 'estado' no existe. Pedí al admin que ejecute el SQL de actualización.");
      else alert("Error: "+msg2);
    }finally{setSaving(false);}
  };
  const iS={width:"100%",background:"#1a1a1a",border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:9};
  return(
    <>
      <button onClick={e=>{e.stopPropagation();setOpen(true);}} style={{background:"#5CA8E022",border:"1px solid #5CA8E044",borderRadius:10,color:C.info,padding:"7px 14px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT}}>🙋 Ofertar mis clases</button>
      {open&&(
        <div style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:FONT,boxSizing:"border-box"}} onClick={cerrar}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,width:"min(430px,92vw)",padding:"24px"}} onClick={e=>e.stopPropagation()}>
            {ok?(<div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:38,marginBottom:10}}>✓</div><div style={{color:C.success,fontWeight:700,fontSize:15}}>¡Oferta enviada!</div><div style={{color:C.muted,fontSize:12,marginTop:6}}>El estudiante verá tu propuesta.</div></div>):(<>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>Ofertá tus clases</h3><button onClick={cerrar} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer",fontFamily:FONT}}>×</button></div>
              <div style={{background:C.card,borderRadius:9,padding:"9px 12px",marginBottom:13,fontSize:12,color:C.muted}}>Para: <span style={{color:C.text,fontWeight:600}}>{post.titulo}</span></div>
              <Label>Precio (opcional)</Label>
              <div style={{display:"flex",gap:7,marginBottom:9}}><input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Precio" type="number" min="0" style={{...iS,margin:0,flex:2}}/><select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...iS,margin:0,flex:1,cursor:"pointer"}}><option value="hora">/ hora</option><option value="clase">/ clase</option><option value="mes">/ mes</option></select></div>
              <Label>Mensaje al estudiante</Label>
              <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Contale tu experiencia, disponibilidad..." style={{...iS,minHeight:85,resize:"vertical"}}/>
              <Btn onClick={enviar} disabled={saving||!msg.trim()} style={{width:"100%",padding:"10px"}}>{saving?"Enviando...":"Enviar oferta →"}</Btn>
            </>)}
          </div>
        </div>
      )}
    </>
  );
}

// ─── DENUNCIA MODAL ───────────────────────────────────────────────────────────
function DenunciaModal({post,session,onClose}){
  const [motivo,setMotivo]=useState("");const [detalle,setDetalle]=useState("");const [saving,setSaving]=useState(false);const [ok,setOk]=useState(false);
  const MOTIVOS=["El profesor no se presentó","No hay contenido publicado","El contenido es incorrecto o engañoso","Comportamiento inapropiado","Publicación falsa o fraudulenta","Otro"];
  const enviar=async()=>{if(!motivo)return;setSaving(true);try{await sb.insertDenuncia({publicacion_id:post.id,denunciante_id:session.user.id,denunciante_email:session.user.email,motivo,detalle,autor_email:post.autor_email},session.access_token);setOk(true);}catch{setOk(true);}finally{setSaving(false);}};
  return(
    <Modal onClose={onClose} width="min(440px,95vw)">
      <div style={{padding:"20px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{color:C.danger,margin:0,fontSize:16,fontWeight:700}}>⚑ Denunciar publicación</h3><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button></div>
        {ok?(<div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:36,marginBottom:12}}>✓</div><div style={{color:C.success,fontWeight:700,fontSize:15,marginBottom:8}}>Denuncia enviada</div><div style={{color:C.muted,fontSize:13}}>Revisaremos tu reporte.</div><Btn onClick={onClose} style={{marginTop:16}}>Cerrar</Btn></div>):(
          <><div style={{background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:10,padding:"10px 13px",marginBottom:14,fontSize:12,color:C.muted}}>Publicación: <span style={{color:C.text,fontWeight:600}}>{post.titulo}</span></div>
          <Label>Motivo</Label>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:12}}>{MOTIVOS.map(m=>(<button key={m} onClick={()=>setMotivo(m)} style={{background:motivo===m?"#E05C5C22":C.card,border:`1px solid ${motivo===m?C.danger:C.border}`,borderRadius:9,padding:"9px 12px",color:motivo===m?C.danger:C.muted,fontSize:12,cursor:"pointer",fontFamily:FONT,textAlign:"left"}}>{m}</button>))}</div>
          <Label>Detalles (opcional)</Label>
          <textarea value={detalle} onChange={e=>setDetalle(e.target.value)} placeholder="Describí lo que ocurrió..." style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",resize:"vertical",minHeight:65,boxSizing:"border-box",fontFamily:FONT,marginBottom:12}}/>
          <Btn onClick={enviar} disabled={saving||!motivo} variant="danger" style={{width:"100%",padding:"10px"}}>{saving?"Enviando...":"Enviar denuncia"}</Btn></>
        )}
      </div>
    </Modal>
  );
}

// ─── POST CHAT BTN — solo permite chat si está inscripto o tiene oferta aceptada
function PostChatBtn({post,session,onOpenChat}){
  const [permitido,setPermitido]=useState(null);
  const miEmail=session.user.email;
  useEffect(()=>{
    if(post.autor_email===miEmail){setPermitido(false);return;}
    // Si es una búsqueda de otro usuario, chequear si hay oferta aceptada
    if(post.tipo==="busqueda"){
      sb.getOfertaAceptada(post.id,miEmail,session.access_token).then(r=>setPermitido(r&&r.length>0)).catch(()=>setPermitido(false));
      return;
    }
    // Si es una oferta, chequear inscripcion
    sb.getMisInscripciones(miEmail,session.access_token).then(ins=>setPermitido(ins.some(i=>i.publicacion_id===post.id))).catch(()=>setPermitido(false));
  },[post.id,post.tipo,post.autor_email,miEmail,session.access_token]);
  if(permitido===null)return null;
  if(!permitido)return <span style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>Inscribite para chatear</span>;
  return <button onClick={e=>{e.stopPropagation();onOpenChat(post);}} style={{background:C.accent,color:"#0D0D0D",border:"none",borderRadius:9,padding:"5px 12px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT}}>💬 Contactar</button>;
}

// ─── POST CARD (sin OfertarBtn — solo aparece en DetailModal) ─────────────────
function PostCard({post,session,onOpenChat,onOpenDetail,onOpenPerfil,avgPub,countPub,avgUser}){
  const nombre=post.autor_nombre||sb.getDisplayName(post.autor_email)||post.autor_email?.split("@")[0]||"Usuario";
  const esMio=post.autor_email===session.user.email;
  return(
    <div onClick={()=>onOpenDetail(post)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 18px",cursor:"pointer",transition:"border-color .2s,transform .15s",position:"relative",overflow:"hidden",fontFamily:FONT}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";}}>
      <div style={{position:"absolute",top:0,left:0,width:"100%",height:3,background:post.tipo==="oferta"?C.success:C.accent}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,gap:8}}>
        <div style={{display:"flex",gap:8,alignItems:"center",minWidth:0}}>
          <Avatar letra={nombre[0]}/>
          <div style={{minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
              <button onClick={e=>{e.stopPropagation();onOpenPerfil(post.autor_email);}} style={{fontWeight:600,color:C.text,fontSize:13,background:"none",border:"none",cursor:"pointer",fontFamily:FONT,padding:0}} onMouseEnter={e=>{e.currentTarget.style.color=C.accent;}} onMouseLeave={e=>{e.currentTarget.style.color=C.text;}}>{nombre}</button>
              {post.verificado&&<VerifiedBadge/>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2,flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:C.muted}}>{post.materia}{post.created_at?` · ${fmt(post.created_at)}`:""}</span>
              {avgUser&&<MiniStars val={avgUser}/>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <FavBtn post={post} session={session}/>
          <Tag tipo={post.tipo}/>
        </div>
      </div>
      <h3 style={{color:C.text,fontSize:14,fontWeight:700,margin:"0 0 4px",lineHeight:1.3}}>{post.titulo}</h3>
      <p style={{color:C.muted,fontSize:12,lineHeight:1.5,margin:"0 0 8px"}}>{post.descripcion?.slice(0,110)}{post.descripcion?.length>110?"...":""}</p>
      {avgPub&&<div style={{marginBottom:7}}><MiniStars val={avgPub} count={countPub}/></div>}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
        {post.tipo==="oferta"&&post.modo==="curso"&&<span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:"#4ECB7115",color:C.success,border:"1px solid #4ECB7133"}}>📦 Curso</span>}
        {post.tipo==="oferta"&&post.modo==="particular"&&<span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:"#5CA8E015",color:C.info,border:"1px solid #5CA8E033"}}>👤 Clase particular</span>}
        {post.precio&&<span style={{fontSize:12,color:C.accent,fontWeight:700,background:C.accentDim,borderRadius:7,padding:"2px 8px"}}>💰 {fmtPrice(post.precio)}{post.precio_tipo&&post.modo!=="curso"?` /${post.precio_tipo}`:""}</span>}
        {post.fecha_inicio&&<span style={{fontSize:11,color:C.muted,background:C.surface,borderRadius:7,padding:"2px 7px"}}>📅 {fmt(post.fecha_inicio)}</span>}
      </div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}} onClick={e=>e.stopPropagation()}>
        {!esMio&&<PostChatBtn post={post} session={session} onOpenChat={onOpenChat}/>}
        {esMio&&<span style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>Tu publicación</span>}
      </div>
    </div>
  );
}

// ─── EXPLORE PAGE ─────────────────────────────────────────────────────────────
function ExplorePage({session,onOpenChat,onOpenDetail,onOpenPerfil}){
  const [posts,setPosts]=useState([]);const [loading,setLoading]=useState(true);
  const [filtroTipo,setFiltroTipo]=useState("all");const [filtroMateria,setFiltroMateria]=useState("");const [filtroModo,setFiltroModo]=useState("all");const [busqueda,setBusqueda]=useState("");
  const [reseñasMap,setReseñasMap]=useState({});const [reseñasUserMap,setReseñasUserMap]=useState({});
  const cargar=useCallback(async()=>{
    setLoading(true);
    try{
      const f={};if(filtroTipo!=="all")f.tipo=filtroTipo;if(filtroMateria)f.materia=filtroMateria;
      const d=await sb.getPublicaciones(f,session.access_token);
      const activos=d.filter(p=>p.activo!==false&&!p.finalizado);
      setPosts(activos);
      const reseñasProm=activos.map(p=>sb.getReseñas(p.id,session.access_token).catch(()=>[]));
      const allReseñas=await Promise.all(reseñasProm);
      const pMap={};const uMap={};
      activos.forEach((p,i)=>{const r=allReseñas[i];const avg=calcAvg(r);pMap[p.id]={avg,count:r.length};if(!uMap[p.autor_email])uMap[p.autor_email]={sum:0,count:0};r.forEach(rv=>{uMap[p.autor_email].sum+=(rv.estrellas||0);uMap[p.autor_email].count++;});});
      setReseñasMap(pMap);
      const finalUMap={};Object.keys(uMap).forEach(email=>{if(uMap[email].count>0)finalUMap[email]=uMap[email].sum/uMap[email].count;});
      setReseñasUserMap(finalUMap);
    }finally{setLoading(false);}
  },[session,filtroTipo,filtroMateria]);
  useEffect(()=>{cargar();},[cargar]);
  const filtered=posts.filter(p=>{
    const q=busqueda.toLowerCase();if(busqueda&&!p.titulo?.toLowerCase().includes(q)&&!p.descripcion?.toLowerCase().includes(q)&&!(p.autor_nombre||p.autor_email?.split('@')[0]||'').toLowerCase().includes(q))return false;
    if(filtroModo!=="all"&&p.tipo==="oferta"&&p.modo!==filtroModo)return false;
    if(filtroModo!=="all"&&p.tipo==="busqueda")return false;
    return true;
  });
  return(
    <div style={{fontFamily:FONT}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:"clamp(19px,4vw,30px)",fontWeight:700,margin:"0 0 5px",lineHeight:1.2}}>Conectá con el <span style={{color:C.accent}}>conocimiento</span></h1>
        <p style={{color:C.muted,fontSize:13,margin:0}}>Publicá lo que querés aprender o lo que podés enseñar.</p>
      </div>
      <Input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍  Buscá por tema o nombre de usuario..." style={{marginBottom:11,background:C.surface,padding:"10px 14px"}}/>
      {/* Filtro tipo publicación */}
      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
        {["all","busqueda","oferta"].map(t=>(<button key={t} onClick={()=>{setFiltroTipo(t);if(t!=="oferta")setFiltroModo("all");}} style={{background:filtroTipo===t?C.accent:C.surface,color:filtroTipo===t?"#0D0D0D":C.muted,border:`1px solid ${filtroTipo===t?C.accent:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{t==="all"?"Todo":t==="busqueda"?"🔍 Búsquedas":"📚 Ofertas"}</button>))}
      </div>
      {/* Filtro modo — solo visible cuando se muestran ofertas */}
      {(filtroTipo==="all"||filtroTipo==="oferta")&&(
        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
          {[{v:"all",l:"Todos"},{v:"curso",l:"📦 Cursos"},{v:"particular",l:"👤 Clases particulares"}].map(({v,l})=>(
            <button key={v} onClick={()=>setFiltroModo(v)} style={{background:filtroModo===v?"#4ECB7122":C.card,color:filtroModo===v?C.success:C.muted,border:`1px solid ${filtroModo===v?"#4ECB7144":C.border}`,borderRadius:20,padding:"4px 11px",fontSize:11,fontWeight:filtroModo===v?700:400,cursor:"pointer",fontFamily:FONT}}>{l}</button>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:5,marginBottom:18,overflowX:"auto",paddingBottom:3}}>
        {["Todas",...MATERIAS].map(m=>(<button key={m} onClick={()=>setFiltroMateria(m==="Todas"?"":m)} style={{background:(m==="Todas"&&!filtroMateria)||filtroMateria===m?C.accent:C.card,color:(m==="Todas"&&!filtroMateria)||filtroMateria===m?"#0D0D0D":C.muted,border:"none",borderRadius:20,padding:"5px 10px",fontSize:11,fontWeight:(m==="Todas"&&!filtroMateria)||filtroMateria===m?700:400,cursor:"pointer",whiteSpace:"nowrap",fontFamily:FONT}}>{m}</button>))}
      </div>
      <div style={{display:"flex",gap:9,marginBottom:18,flexWrap:"wrap"}}>
        {[{label:"Activas",val:filtered.length},{label:"Búsquedas",val:filtered.filter(p=>p.tipo==="busqueda").length},{label:"Cursos",val:filtered.filter(p=>p.tipo==="oferta"&&p.modo==="curso").length},{label:"Clases part.",val:filtered.filter(p=>p.tipo==="oferta"&&p.modo==="particular").length}].map(s=>(<div key={s.label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,padding:"10px 15px",flex:1,minWidth:70}}><div style={{fontSize:20,fontWeight:700,color:C.accent}}>{s.val}</div><div style={{color:C.muted,fontSize:11}}>{s.label}</div></div>))}
      </div>
      {loading?<Spinner/>:filtered.length===0?(<div style={{textAlign:"center",color:C.muted,padding:"46px 0",fontSize:13}}>{posts.length===0?"¡Sé el primero en publicar! 🚀":"Sin resultados."}</div>):(
        <div style={{display:"grid",gap:11}}>
          {filtered.map(p=><PostCard key={p.id} post={p} session={session} onOpenChat={onOpenChat} onOpenDetail={onOpenDetail} onOpenPerfil={onOpenPerfil} avgPub={reseñasMap[p.id]?.avg} countPub={reseñasMap[p.id]?.count} avgUser={reseñasUserMap[p.autor_email]}/>)}
        </div>
      )}
    </div>
  );
}

// ─── MY POST CARD ─────────────────────────────────────────────────────────────
function MyPostCard({post,session,onEdit,onToggle,onDelete,onOpenCurso,toggling,ofertasPendientes,inscriptos}){
  const [confirmDelete,setConfirmDelete]=useState(false);
  const activo=post.activo!==false;const finalizado=!!post.finalizado;
  return(
    <div style={{background:C.card,border:`1px solid ${ofertasPendientes>0?C.accent:C.border}`,borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden",fontFamily:FONT}}>
      <div style={{position:"absolute",top:0,left:0,width:"100%",height:3,background:finalizado?C.info:activo?post.tipo==="oferta"?C.success:C.accent:C.muted}}/>
      <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
        <div style={{flex:1,minWidth:0}}>
          {ofertasPendientes>0&&<div style={{display:"inline-flex",alignItems:"center",gap:5,background:C.accentDim,border:`1px solid #F5C84244`,borderRadius:20,padding:"3px 10px",marginBottom:8,fontSize:11,color:C.accent,fontWeight:700}}>🔔 {ofertasPendientes} oferta{ofertasPendientes!==1?"s":""} nueva{ofertasPendientes!==1?"s":""}</div>}
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}><Tag tipo={post.tipo}/><StatusBadge activo={activo} finalizado={finalizado}/>{post.verificado&&<VerifiedBadge/>}{!finalizado&&(post.inscripciones_cerradas||post.inscripcionesCerradas)&&<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:"#E0955C15",color:C.warn,border:"1px solid #E0955C33"}}>Inscripciones cerradas</span>}</div>
          <h3 style={{color:activo?C.text:C.muted,fontSize:13,fontWeight:700,margin:"0 0 3px"}}>{post.titulo}</h3>
          <p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.4}}>{post.descripcion?.slice(0,90)}</p>
          {post.precio&&<div style={{marginTop:4,fontSize:12,color:C.muted}}>💰 <span style={{color:C.accent,fontWeight:600}}>{fmtPrice(post.precio)}</span></div>}
          {post.tipo==="oferta"&&inscriptos!==undefined&&<div style={{marginTop:4,fontSize:12,color:C.muted}}>👥 <span style={{color:C.text,fontWeight:600}}>{inscriptos}</span> inscripto{inscriptos!==1?"s":""}</div>}
          {post.created_at&&<div style={{marginTop:4,fontSize:11,color:C.muted}}>Publicado {fmt(post.created_at)}</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0,minWidth:95}}>
          {post.tipo==="oferta"&&<button onClick={()=>onOpenCurso(post)} style={{background:C.accentDim,border:`1px solid #F5C84244`,borderRadius:8,color:C.accent,padding:"5px 8px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:FONT}}>📋 Contenido</button>}
          {!finalizado&&<button onClick={()=>onEdit(post)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"5px 8px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:FONT}}>✏️ Editar</button>}
          {!finalizado&&<button onClick={()=>onToggle(post)} disabled={toggling===post.id} style={{background:activo?"#E0955C15":"#4ECB7115",border:`1px solid ${activo?"#E0955C33":"#4ECB7133"}`,borderRadius:8,color:activo?C.warn:C.success,padding:"5px 8px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:FONT,opacity:toggling===post.id?.5:1}}>{toggling===post.id?"...":(activo?"⏸ Pausar":"▶ Activar")}</button>}
          <button onClick={()=>setConfirmDelete(true)} style={{background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:8,color:C.danger,padding:"5px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>🗑 Eliminar</button>
          {confirmDelete&&(
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:FONT}} onClick={()=>setConfirmDelete(false)}>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:"28px 28px",width:"min(400px,92vw)",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:42,marginBottom:12}}>🗑️</div>
                <h3 style={{color:C.text,fontSize:17,fontWeight:700,margin:"0 0 8px"}}>¿Eliminar publicación?</h3>
                <p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:"0 0 22px"}}>Se eliminará <strong style={{color:C.text}}>"{post.titulo}"</strong> permanentemente. El contenido, inscripciones y reseñas asociadas también se borrarán. Esta acción no se puede deshacer.</p>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setConfirmDelete(false)} style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,borderRadius:11,color:C.muted,padding:"10px",cursor:"pointer",fontSize:13,fontFamily:FONT,fontWeight:600}}>Cancelar</button>
                  <button onClick={()=>{setConfirmDelete(false);onDelete(post);}} style={{flex:1,background:C.danger,border:"none",borderRadius:11,color:"#fff",padding:"10px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:FONT}}>Sí, eliminar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── OFERTAS RECIBIDAS MODAL ───────────────────────────────────────────────────
function OfertasRecibidasModal({post,session,onClose,onContactar}){
  const [ofertas,setOfertas]=useState([]);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(null);
  const cargar=useCallback(async()=>{const all=await sb.getOfertasSobre(post.id,session.access_token);setOfertas(all);setLoading(false);},[post.id,session]);
  useEffect(()=>{cargar();},[cargar]);
  const responder=async(o,estado)=>{
    setSaving(o.id);
    try{
      await sb.updateOfertaBusq(o.id,{estado,leida:true},session.access_token);
      if(estado==="aceptada"){onContactar({id:post.id,autor_email:o.ofertante_email,titulo:post.titulo,autor_nombre:o.ofertante_nombre});onClose();}
      else await cargar();
    }finally{setSaving(null);}
  };
  const EB={pendiente:{c:C.accent,t:"Pendiente"},aceptada:{c:C.success,t:"✓ Aceptada"},rechazada:{c:C.danger,t:"✗ Rechazada"}};
  return(
    <Modal onClose={onClose} width="min(520px,97vw)">
      <div style={{padding:"20px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><div><h3 style={{color:C.text,margin:"0 0 3px",fontSize:16,fontWeight:700}}>Ofertas recibidas</h3><div style={{fontSize:12,color:C.muted}}>{post.titulo}</div></div><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button></div>
        {loading?<Spinner/>:ofertas.length===0?<div style={{color:C.muted,textAlign:"center",padding:"30px 0",fontSize:13}}>Sin ofertas aún.</div>:(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {ofertas.map(o=>{const eb=EB[o.estado||"pendiente"];return(
              <div key={o.id} style={{background:C.card,border:`1px solid ${o.estado==="aceptada"?C.success:o.estado==="rechazada"?C.danger:(!o.leida?C.accent:C.border)}`,borderRadius:13,padding:"14px 16px"}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <Avatar letra={o.ofertante_nombre?.[0]||"?"} size={36}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                      <span style={{fontWeight:600,color:C.text,fontSize:13}}>{o.ofertante_nombre}</span>
                      <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:eb.c+"22",color:eb.c,border:`1px solid ${eb.c}44`}}>{eb.t}</span>
                    </div>
                    {o.precio&&<div style={{fontSize:12,color:C.accent,fontWeight:600,marginBottom:5}}>💰 {fmtPrice(o.precio)} /{o.precio_tipo}</div>}
                    <p style={{color:C.muted,fontSize:12,margin:"0 0 10px",lineHeight:1.5}}>{o.mensaje}</p>
                    {o.estado==="pendiente"&&<div style={{display:"flex",gap:8}}>
                      <button onClick={()=>responder(o,"aceptada")} disabled={saving===o.id} style={{background:"#4ECB7122",border:"1px solid #4ECB7144",borderRadius:8,color:C.success,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>✓ Aceptar</button>
                      <button onClick={()=>responder(o,"rechazada")} disabled={saving===o.id} style={{background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:8,color:C.danger,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>✗ Rechazar</button>
                      <span style={{fontSize:11,color:C.muted,alignSelf:"center"}}>{fmt(o.created_at)}</span>
                    </div>}
                    {o.estado==="aceptada"&&<Btn onClick={()=>{onContactar({id:post.id,autor_email:o.ofertante_email,titulo:post.titulo,autor_nombre:o.ofertante_nombre});onClose();}} style={{padding:"6px 14px",fontSize:12}}>💬 Chatear</Btn>}
                  </div>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── MY POSTS PAGE ─────────────────────────────────────────────────────────────
// Carga TODAS las publicaciones y filtra en cliente por autor_email
// Esto garantiza que se ven pausadas y finalizadas (igual que v13 que funcionaba)
function MyPostsPage({session,onEdit,onNew,onOpenCurso,onOpenChat,onRefreshOfertas}){
  const [posts,setPosts]=useState([]);const [loading,setLoading]=useState(true);const [toggling,setToggling]=useState(null);
  const [ofertasMap,setOfertasMap]=useState({});const [ofertasModal,setOfertasModal]=useState(null);
  const cargar=useCallback(async()=>{
    setLoading(true);
    try{
      const [d,ofertasRaw]=await Promise.all([
        sb.getMisPublicaciones(session.user.email,session.access_token),
        sb.getOfertasRecibidas(session.user.email,session.access_token)
      ]);
      setPosts(d||[]);
      const map={};ofertasRaw.forEach(o=>{map[o.busqueda_id]=(map[o.busqueda_id]||0)+1;});
      setOfertasMap(map);
    }finally{setLoading(false);}
  },[session]);
  useEffect(()=>{cargar();},[cargar]);
  const toggle=async(post)=>{setToggling(post.id);try{await sb.updatePublicacion(post.id,{activo:post.activo===false},session.access_token);await cargar();}catch(e){alert("Error: "+e.message);}finally{setToggling(null);}};
  const remove=async(post)=>{await sb.deletePublicacion(post.id,session.access_token);cargar();};
  return(
    <div style={{fontFamily:FONT}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h2 style={{fontSize:20,color:C.text,margin:"0 0 3px",fontWeight:700}}>Mis publicaciones</h2><p style={{color:C.muted,fontSize:12,margin:0}}>{posts.length} publicación{posts.length!==1?"es":""}</p></div>
        <Btn onClick={onNew} style={{padding:"7px 13px",fontSize:12}}>+ Nueva</Btn>
      </div>
      {loading?<Spinner/>:posts.length===0?(<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,marginBottom:12}}>📭</div><p style={{color:C.muted,fontSize:13}}>Todavía no publicaste nada.</p><Btn onClick={onNew} style={{marginTop:12}}>Crear primera publicación</Btn></div>):(
        <div style={{display:"grid",gap:14}}>
          {posts.map(p=>(<div key={p.id}>
            <MyPostCard post={p} session={session} onEdit={onEdit} onToggle={toggle} onDelete={remove} onOpenCurso={onOpenCurso} toggling={toggling} ofertasPendientes={ofertasMap[p.id]||0}/>
            {ofertasMap[p.id]>0&&<button onClick={()=>setOfertasModal(p)} style={{width:"100%",marginTop:6,background:C.accentDim,border:`1px solid #F5C84244`,borderRadius:9,color:C.accent,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT}}>🔔 Ver {ofertasMap[p.id]} oferta{ofertasMap[p.id]!==1?"s":""} nueva{ofertasMap[p.id]!==1?"s":""}</button>}
          </div>))}
        </div>
      )}
      {ofertasModal&&<OfertasRecibidasModal post={ofertasModal} session={session} onClose={()=>{setOfertasModal(null);cargar();if(onRefreshOfertas)onRefreshOfertas();}} onContactar={onOpenChat}/>}
    </div>
  );
}

// ─── FAVORITOS PAGE ───────────────────────────────────────────────────────────
function FavoritosPage({session,onOpenDetail,onOpenChat,onOpenPerfil}){
  const [posts,setPosts]=useState([]);const [loading,setLoading]=useState(true);const [filtroTipo,setFiltroTipo]=useState("all");
  useEffect(()=>{
    sb.getFavoritos(session.user.email,session.access_token).then(async fs=>{
      if(fs.length>0){const all=await sb.getPublicaciones({},session.access_token);const ids=new Set(fs.map(f=>f.publicacion_id));setPosts(all.filter(p=>ids.has(p.id)));}
    }).finally(()=>setLoading(false));
  },[session]);
  const filtered=posts.filter(p=>filtroTipo==="all"||p.tipo===filtroTipo);
  return(
    <div style={{fontFamily:FONT}}>
      <h2 style={{fontSize:20,color:C.text,margin:"0 0 16px",fontWeight:700}}>Favoritos</h2>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {["all","busqueda","oferta"].map(t=>(<button key={t} onClick={()=>setFiltroTipo(t)} style={{background:filtroTipo===t?C.accent:C.surface,color:filtroTipo===t?"#0D0D0D":C.muted,border:`1px solid ${filtroTipo===t?C.accent:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{t==="all"?"Todo ★":t==="busqueda"?"🔍 Búsquedas":"📚 Ofertas"}</button>))}
      </div>
      {loading?<Spinner/>:filtered.length===0?(<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,marginBottom:12}}>★</div><p style={{color:C.muted,fontSize:13}}>{posts.length===0?"No guardaste favoritos aún.":"Sin resultados."}</p></div>):(
        <div style={{display:"grid",gap:11}}>{filtered.map(p=><PostCard key={p.id} post={p} session={session} onOpenChat={onOpenChat} onOpenDetail={onOpenDetail} onOpenPerfil={onOpenPerfil}/>)}</div>
      )}
    </div>
  );
}

// ─── INSCRIPCIONES PAGE — con tiempo hasta inicio / hasta fin ─────────────────
function InscripcionesPage({session,onOpenCurso,onOpenChat,onMarkNotifsRead}){
  useEffect(()=>{if(onMarkNotifsRead)onMarkNotifsRead();},[]);// eslint-disable-line
  const [inscripciones,setInscripciones]=useState([]);const [posts,setPosts]=useState({});const [loading,setLoading]=useState(true);const [ayudantePubs,setAyudantePubs]=useState([]);
  useEffect(()=>{
    const miEmail2=session.user.email;
    sb.getMisInscripciones(miEmail2,session.access_token).then(async ins=>{
      setInscripciones(ins);
      const ids=[...new Set(ins.map(i=>i.publicacion_id))];
      // También cargar publicaciones donde soy ayudante
      const todasPubs=await sb.getPublicaciones({},session.access_token);
      const ayudanteDe=todasPubs.filter(p=>(p.ayudantes||[]).includes(miEmail2)&&!ids.includes(p.id));
      setAyudantePubs(ayudanteDe);
      const map={};
      todasPubs.filter(p=>ids.includes(p.id)||ayudanteDe.some(a=>a.id===p.id)).forEach(p=>map[p.id]=p);
      setPosts(map);
    }).finally(()=>setLoading(false));
  },[session]);

  const tiempoInfo=(p,ins)=>{
    if(!p)return null;
    const hoy=new Date();hoy.setHours(0,0,0,0);
    const ini=p.fecha_inicio?new Date(p.fecha_inicio):null;
    const fin=p.fecha_fin?new Date(p.fecha_fin):null;
    if(ini)ini.setHours(0,0,0,0);
    if(fin)fin.setHours(0,0,0,0);
    // Clase ya finalizada manualmente
    if(ins.clase_finalizada||p.finalizado)return{icon:"✅",texto:"Clase finalizada",color:C.success};
    // Todavía no empezó
    if(ini&&hoy<ini){
      const dias=Math.ceil((ini-hoy)/86400000);
      if(dias===0)return{icon:"🟢",texto:"Inicia hoy",color:C.success};
      if(dias===1)return{icon:"📅",texto:"Inicia mañana",color:C.info};
      return{icon:"📅",texto:`Inicia en ${dias} día${dias!==1?"s":""}`,color:C.info};
    }
    // Ya empezó — mostrar cuánto falta para terminar
    if(fin){
      const dias=Math.ceil((fin-hoy)/86400000);
      if(dias<0)return{icon:"📦",texto:"Período finalizado",color:C.muted};
      if(dias===0)return{icon:"⚠️",texto:"Finaliza hoy",color:C.danger};
      if(dias===1)return{icon:"⏳",texto:"Finaliza mañana",color:C.warn};
      return{icon:"⏳",texto:`Finaliza en ${dias} día${dias!==1?"s":""}`,color:dias<=7?C.danger:dias<=30?C.warn:C.muted};
    }
    // Empezó pero sin fecha de fin
    if(ini&&hoy>=ini)return{icon:"🟢",texto:"En curso",color:C.success};
    return null;
  };

  const renderCard=(ins)=>{
    const p=posts[ins.publicacion_id];if(!p)return null;
    const finalizado=ins.clase_finalizada||!!p.finalizado;
    const ti=tiempoInfo(p,ins);
    return(
      <div key={ins.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 18px",display:"flex",gap:13,alignItems:"center",flexWrap:"wrap",transition:"border-color .15s"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
        <div onClick={()=>onOpenCurso(p)} style={{display:"flex",gap:12,alignItems:"center",flex:1,minWidth:0,cursor:"pointer"}}>
          <div style={{width:44,height:44,borderRadius:11,background:finalizado?"#4ECB7115":C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
            {finalizado?"✅":"📦"}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titulo}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:3}}>{p.materia} · {p.autor_nombre||p.autor_email?.split("@")[0]}</div>
            {ti?<span style={{fontSize:11,color:ti.color,fontWeight:600}}>{ti.icon} {ti.texto}</span>
              :<span style={{fontSize:11,color:C.muted}}>Inscripto {fmt(ins.created_at)}</span>}
          </div>
        </div>
        <button onClick={()=>onOpenChat({id:p.id,autor_email:p.autor_email,titulo:p.titulo,autor_nombre:p.autor_nombre||p.autor_email?.split("@")[0]})}
          style={{background:C.accent,color:"#0D0D0D",border:"none",borderRadius:9,padding:"7px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,flexShrink:0}}>
          💬 Contactar
        </button>
      </div>
    );
  };

  const cursos=inscripciones.filter(i=>!posts[i.publicacion_id]||posts[i.publicacion_id]?.modo==="curso");
  const clases=inscripciones.filter(i=>posts[i.publicacion_id]&&posts[i.publicacion_id]?.modo!=="curso");

  return(
    <div style={{fontFamily:FONT}}>
      <h2 style={{fontSize:20,color:C.text,margin:"0 0 18px",fontWeight:700}}>Mis inscripciones</h2>
      {loading?<Spinner/>:inscripciones.length===0?null:(
        <>
          {cursos.length>0&&<>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:13,fontWeight:700,color:C.text}}>📦 Cursos</span>
              <span style={{background:C.accentDim,color:C.accent,borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px"}}>{cursos.length}</span>
            </div>
            <div style={{display:"grid",gap:9,marginBottom:22}}>{cursos.map(renderCard)}</div>
          </>}
          {clases.length>0&&<>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:13,fontWeight:700,color:C.text}}>👤 Clases particulares</span>
              <span style={{background:"#4ECB7115",color:C.success,borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px"}}>{clases.length}</span>
            </div>
            <div style={{display:"grid",gap:9}}>{clases.map(renderCard)}</div>
          </>}
        </>
      )}
      {/* ── Cursos donde soy ayudante ── */}
      {ayudantePubs.length>0&&(
        <div style={{marginTop:inscripciones.length>0?28:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:13,fontWeight:700,color:C.text}}>🎓 Soy ayudante</span>
            <span style={{background:"#C85CE015",color:C.purple,borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px",border:"1px solid #C85CE033"}}>{ayudantePubs.length}</span>
          </div>
          <div style={{display:"grid",gap:9}}>
            {ayudantePubs.map(p=>(
              <div key={p.id} style={{background:C.card,border:"1px solid #C85CE033",borderRadius:14,padding:"14px 18px",display:"flex",gap:13,alignItems:"center",flexWrap:"wrap",cursor:"pointer",transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.purple} onMouseLeave={e=>e.currentTarget.style.borderColor="#C85CE033"}
                onClick={()=>onOpenCurso(p)}>
                <div style={{width:44,height:44,borderRadius:11,background:"#C85CE015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🎓</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titulo}</div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:3}}>{p.materia} · {p.autor_nombre||p.autor_email?.split("@")[0]}</div>
                  <span style={{fontSize:11,color:C.purple,fontWeight:600}}>✦ Sos ayudante</span>
                </div>
                <button onClick={e=>{e.stopPropagation();onOpenCurso(p);}} style={{background:"#C85CE022",border:"1px solid #C85CE044",borderRadius:9,color:C.purple,padding:"7px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,flexShrink:0}}>📋 Ver contenido →</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {inscripciones.length===0&&ayudantePubs.length===0&&!loading&&(
        <div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,marginBottom:12}}>📚</div><p style={{color:C.muted,fontSize:13}}>No estás inscripto en ningún curso.</p></div>
      )}
    </div>
  );
}

// ─── CHATS PAGE — título real de la publicación (sin "Conversación") ───────────
function ChatsPage({session,onOpenChat}){
  const [grupos,setGrupos]=useState([]);const [loading,setLoading]=useState(true);
  const miEmail=session.user.email;
  useEffect(()=>{
    sb.getMisChats(miEmail,session.access_token).then(async msgs=>{
      msgs=msgs.filter(m=>m.para_nombre!=="__grupo__"&&m.de_nombre!=="__grupo__");
      const pubMap={};
      msgs.forEach(m=>{
        const otro=m.de_nombre===miEmail?m.para_nombre:m.de_nombre;
        const pKey=m.publicacion_id||"sin-pub";
        if(!pubMap[pKey])pubMap[pKey]={pubId:m.publicacion_id,pubTitulo:m.pub_titulo||"",chats:{},lastTime:m.created_at};
        if(!pubMap[pKey].pubTitulo&&m.pub_titulo)pubMap[pKey].pubTitulo=m.pub_titulo;
        const cKey=otro;
        if(!pubMap[pKey].chats[cKey])pubMap[pKey].chats[cKey]={otro,ultimo:m,unread:0};
        if(m.de_nombre!==miEmail&&!m.leido)pubMap[pKey].chats[cKey].unread++;
        if(m.created_at>pubMap[pKey].lastTime)pubMap[pKey].lastTime=m.created_at;
      });
      // Fetch titles for groups that don't have one yet
      const sinTitulo=Object.values(pubMap).filter(g=>g.pubId&&!g.pubTitulo);
      if(sinTitulo.length>0){
        try{
          const allPubs=await sb.getPublicaciones({},session.access_token);
          const pubById={};allPubs.forEach(p=>{pubById[p.id]=p.titulo;});
          sinTitulo.forEach(g=>{if(pubById[g.pubId])g.pubTitulo=pubById[g.pubId];});
        }catch{}
      }
      setGrupos(Object.values(pubMap).sort((a,b)=>new Date(b.lastTime)-new Date(a.lastTime)));
    }).finally(()=>setLoading(false));
  },[miEmail,session.access_token]);
  return(
    <div style={{fontFamily:FONT}}>
      <h2 style={{fontSize:20,color:C.text,margin:"0 0 16px",fontWeight:700}}>Mis chats</h2>
      {loading?<Spinner/>:grupos.length===0?(<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,marginBottom:12}}>💬</div><p style={{color:C.muted,fontSize:13}}>No iniciaste ninguna conversación.</p></div>):(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {grupos.map((g,gi)=>(
            <div key={gi}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{height:1,flex:1,background:C.border}}/>
                <span style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.5,whiteSpace:"nowrap",maxWidth:"70%",overflow:"hidden",textOverflow:"ellipsis"}}>{g.pubTitulo||"Sin título"}</span>
                <div style={{height:1,flex:1,background:C.border}}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {Object.values(g.chats).sort((a,b)=>new Date(b.ultimo.created_at)-new Date(a.ultimo.created_at)).map((c,i)=>(
                  <div key={i} onClick={()=>onOpenChat({id:g.pubId,autor_email:c.otro,titulo:g.pubTitulo,autor_nombre:c.otro.split("@")[0]})}
                    style={{background:C.card,border:`1px solid ${c.unread>0?C.accent:C.border}`,borderRadius:13,padding:"11px 15px",cursor:"pointer",display:"flex",alignItems:"center",gap:11}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=c.unread>0?C.accent:C.border}>
                    <Avatar letra={c.otro[0]} size={34}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:1}}>{c.otro.split("@")[0]}</div>
                      <div style={{color:C.muted,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        <span style={{color:c.ultimo.de_nombre===miEmail?C.accent:C.text,fontWeight:600,fontSize:11}}>{c.ultimo.de_nombre===miEmail?"Vos":c.otro.split("@")[0]}: </span>
                        {c.ultimo.texto}
                      </div>
                    </div>
                    {c.unread>0&&<span style={{background:C.accent,color:"#0D0D0D",borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 7px",flexShrink:0}}>{c.unread} nuevo{c.unread!==1?"s":""}</span>}
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

// ─── CHAT MODAL ───────────────────────────────────────────────────────────────
function ChatModal({post,session,onClose,onUnreadChange}){
  const miEmail=session.user.email;const otroEmail=post.autor_email;
  const [msgs,setMsgs]=useState([]);const [input,setInput]=useState("");const [loading,setLoading]=useState(true);
  const bottomRef=useRef(null);const markedRef=useRef(false);
  const marcar=useCallback(async()=>{
    try{await sb.marcarLeidos(post.id,miEmail,session.access_token);}catch{}
    // Borrar notificaciones de nuevo_mensaje de esta pub
    try{await sb.marcarTodasNotifsLeidas(miEmail,session.access_token);}catch{}
    if(onUnreadChange)onUnreadChange();
  },[post.id,miEmail,session.access_token,onUnreadChange]);
  const cargar=useCallback(async()=>{
    try{
      // Traer todos los mensajes del usuario y filtrar por esta conversación
      const todos=await sb.getMisChats(miEmail,session.access_token);
      const data=todos.filter(m=>
        String(m.publicacion_id)===String(post.id)&&
        m.para_nombre!=="__grupo__"&&
        (m.de_nombre===otroEmail||m.para_nombre===otroEmail||m.de_nombre===miEmail)
      );
      setMsgs(data);setLoading(false);
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),50);
      const tieneNoLeidos=data.some(m=>m.para_nombre===miEmail&&!m.leido);
      if(tieneNoLeidos||!markedRef.current){await marcar();markedRef.current=true;}
    }catch(e){console.error(e);setLoading(false);}
  },[post.id,miEmail,otroEmail,session.access_token,marcar]);
  useEffect(()=>{cargar();const t=setInterval(cargar,3000);return()=>clearInterval(t);},[cargar]);
  const send=async()=>{
    if(!input.trim())return;const txt=input;setInput("");
    try{
      await sb.insertMensaje({publicacion_id:post.id,de_usuario:session.user.id,para_usuario:null,de_nombre:miEmail,para_nombre:otroEmail,texto:txt,leido:false,pub_titulo:post.titulo},session.access_token);
      // Notificación al receptor por cada mensaje
      sb.insertNotificacion({usuario_id:null,alumno_email:otroEmail,tipo:"nuevo_mensaje",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      cargar();
    }catch(e){alert("Error al enviar: "+e.message);}
  };
  const nombre=post.autor_nombre||otroEmail?.split("@")[0]||"Usuario";
  return(
    <div style={{position:"fixed",inset:0,background:"#000b",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,padding:"12px"}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,width:"min(500px,98vw)",height:"min(680px,90vh)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div style={{display:"flex",gap:9,alignItems:"center"}}>
            <Avatar letra={nombre[0]} size={32}/>
            <div><div style={{fontWeight:700,color:C.text,fontSize:13}}>{nombre}</div><div style={{fontSize:11,color:C.muted,maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.titulo}</div></div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:6}}>
          {loading?<Spinner/>:msgs.length===0?<div style={{color:C.muted,textAlign:"center",padding:28,fontSize:13}}>Empezá la conversación 👋</div>
            :msgs.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.de_nombre===miEmail?"flex-end":"flex-start"}}><div style={{background:m.de_nombre===miEmail?C.accent:C.card,color:m.de_nombre===miEmail?"#0D0D0D":C.text,padding:"8px 12px",borderRadius:13,maxWidth:"78%",fontSize:13,lineHeight:1.5}}>{m.texto}</div></div>))}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:"10px 13px",borderTop:`1px solid ${C.border}`,display:"flex",gap:7,flexShrink:0}}>
          <Input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Escribí un mensaje..."/>
          <button onClick={send} style={{background:C.accent,border:"none",borderRadius:9,padding:"9px 13px",fontWeight:700,cursor:"pointer",color:"#0D0D0D",fontSize:15,flexShrink:0}}>↑</button>
        </div>
      </div>
    </div>
  );
}

function FinalizarClaseModal({post,session,onClose,onFinalizado}){
  const [inscripciones,setInscripciones]=useState([]);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);
  useEffect(()=>{sb.getInscripciones(post.id,session.access_token).then(ins=>{setInscripciones(ins.filter(i=>!i.clase_finalizada));}).finally(()=>setLoading(false));},[post.id,session]);
  const finalizar=async()=>{setSaving(true);try{await sb.updatePublicacion(post.id,{finalizado:true},session.access_token).catch(()=>{});await Promise.all(inscripciones.map(ins=>sb.updateInscripcion(ins.id,{clase_finalizada:true,fecha_finalizacion:new Date().toISOString()},session.access_token)));await Promise.all(inscripciones.map(ins=>sb.insertNotificacion({usuario_id:ins.alumno_id||null,alumno_email:ins.alumno_email,tipo:"valorar_curso",publicacion_id:post.id,pub_titulo:post.titulo,leida:false}).catch(()=>{})));onFinalizado();onClose();}finally{setSaving(false);}};
  return(
    <Modal onClose={onClose} width="min(420px,95vw)">
      <div style={{padding:"20px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>✅ Marcar clases finalizadas</h3><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button></div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",marginBottom:14,fontSize:12,color:C.muted}}>Publicación: <span style={{color:C.text,fontWeight:600}}>{post.titulo}</span></div>
        {loading?<Spinner/>:inscripciones.length===0?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No hay alumnos con clase pendiente.</div>:(
          <><div style={{color:C.muted,fontSize:13,marginBottom:12}}>Se notificará a <strong style={{color:C.text}}>{inscripciones.length} alumno{inscripciones.length!==1?"s":""}</strong>.</div>
          <Btn onClick={finalizar} disabled={saving} variant="success" style={{width:"100%",padding:"10px"}}>{saving?"Procesando...":"✅ Confirmar"}</Btn></>
        )}
      </div>
    </Modal>
  );
}

function InscritosCount({pubId,session}){
  const [count,setCount]=useState(null);
  useEffect(()=>{sb.getInscripciones(pubId,session.access_token).then(ins=>setCount(ins.length)).catch(()=>setCount(0));},[pubId,session]);
  return <div style={{color:C.muted,fontSize:13}}>👥 <span style={{color:C.text,fontWeight:600}}>{count===null?"...":count}</span> alumnos inscriptos</div>;
}

function ReseñasSeccion({post,session,inscripcion,esMio}){
  const [reseñas,setReseñas]=useState([]);const [loading,setLoading]=useState(true);
  const [reseña,setReseña]=useState("");const [estrella,setEstrella]=useState(5);const [saving,setSaving]=useState(false);const [err,setErr]=useState("");
  const finalizado=!!post.finalizado||(inscripcion?.clase_finalizada);
  const cargar=()=>sb.getReseñas(post.id,session.access_token).then(r=>setReseñas(r)).finally(()=>setLoading(false));
  useEffect(()=>{cargar();},[post.id]); // eslint-disable-line
  const puedeResena=!esMio&&inscripcion?.clase_finalizada;
  // Solo mostrar sección si el curso finalizó (o hay reseñas ya)
  if(!finalizado&&reseñas.length===0&&!loading)return(
    <div style={{color:C.muted,fontSize:12,fontStyle:"italic",textAlign:"center",padding:"18px 0"}}>
      Las reseñas se habilitarán cuando el docente finalice las clases.
    </div>
  );
  const enviar=async()=>{
    if(!reseña.trim()){setErr("Escribí tu reseña");return;}setSaving(true);setErr("");
    try{await sb.insertReseña({publicacion_id:post.id,autor_id:session.user.id,autor_nombre:sb.getDisplayName(session.user.email),autor_pub_email:post.autor_email,texto:reseña,estrellas:estrella},session.access_token);
      if(inscripcion?.clase_finalizada)await sb.updateInscripcion(inscripcion.id,{valorado:true},session.access_token).catch(()=>{});
      await cargar();setReseña("");
    }catch(e){setErr("Error: "+e.message);}finally{setSaving(false);}
  };
  return(<>
    <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:12}}>Reseñas ({reseñas.length})</div>
    {loading?<Spinner/>:reseñas.map(r=>(<div key={r.id} style={{background:"#1a1a1a",borderRadius:11,padding:"10px 13px",marginBottom:8}}><div style={{display:"flex",gap:7,alignItems:"center",marginBottom:4}}><Avatar letra={r.autor_nombre?.[0]||"?"} size={26}/><span style={{fontWeight:600,color:C.text,fontSize:12}}>{r.autor_nombre}</span><span style={{color:C.accent,fontSize:11}}>{"★".repeat(r.estrellas||0)}</span></div><p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.5}}>{r.texto}</p></div>))}
    {puedeResena&&(<div style={{marginTop:12}}>
      {inscripcion?.clase_finalizada&&<div style={{fontSize:11,color:C.success,marginBottom:8,background:"#4ECB7115",border:"1px solid #4ECB7133",borderRadius:8,padding:"6px 10px"}}>⭐ El docente finalizó las clases</div>}
      <div style={{display:"flex",gap:3,marginBottom:7}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setEstrella(n)} style={{background:"none",border:"none",fontSize:19,cursor:"pointer",color:n<=estrella?C.accent:C.border}}>★</button>)}</div>
      <textarea value={reseña} onChange={e=>setReseña(e.target.value)} placeholder="Dejá tu reseña..." style={{width:"100%",background:"#1a1a1a",border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",resize:"vertical",minHeight:65,boxSizing:"border-box",fontFamily:FONT}}/>
      <ErrMsg msg={err}/>
      <Btn onClick={enviar} disabled={saving} variant="ghost" style={{marginTop:6,color:C.accent,border:`1px solid ${C.accent}`,fontSize:12,padding:"6px 13px"}}>{saving?"Guardando...":"Publicar reseña"}</Btn>
    </div>)}
    {!esMio&&inscripcion&&!inscripcion.clase_finalizada&&!loading&&<div style={{marginTop:10,fontSize:12,color:C.muted,fontStyle:"italic"}}>Podrás dejar una reseña cuando el docente finalice las clases.</div>}
  </>);
}



// ─── AYUDANTE BUSCADOR — el docente agrega ayudantes por ID ───────────────────
function AyudanteBuscador({post,session,ayudantesActuales,onUpdate}){
  const [idInput,setIdInput]=useState("");const [saving,setSaving]=useState(false);const [err,setErr]=useState("");
  const agregar=async()=>{
    const id=idInput.trim();if(!id){setErr("Ingresá un ID de usuario");return;}
    if(ayudantesActuales.includes(id)){setErr("Ya es ayudante de este curso");return;}
    if(id===session.user.id){setErr("No podés agregarte como ayudante de tu propio curso");return;}
    setSaving(true);setErr("");
    try{
      // Verificar que el usuario existe
      const usuario=await sb.getUsuarioById(id,session.access_token);
      if(!usuario){setErr("❌ No existe ningún usuario con ese ID. Pedile que verifique su ID en Mi cuenta.");setSaving(false);return;}
      const newAyuds=[...ayudantesActuales,id];
      await sb.updatePublicacion(post.id,{ayudantes:newAyuds},session.access_token);
      // Notificar al nuevo ayudante por email
      const emailAyudante=usuario.email;
      if(emailAyudante){
        sb.insertNotificacion({usuario_id:id,alumno_email:emailAyudante,tipo:"nuevo_ayudante",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      }
      onUpdate(newAyuds);setIdInput("");
      setErr("");
    }catch(e){setErr("Error: "+e.message);}finally{setSaving(false);}
  };
  const quitar=async(id)=>{
    const newAyuds=ayudantesActuales.filter(a=>a!==id);
    await sb.updatePublicacion(post.id,{ayudantes:newAyuds},session.access_token);
    onUpdate(newAyuds);
  };
  return(
    <div style={{marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:12}}>
      <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1,marginBottom:8}}>AYUDANTES</div>
      {ayudantesActuales.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
        {ayudantesActuales.map(id=>(
          <div key={id} style={{display:"flex",alignItems:"center",gap:5,background:"#C85CE015",border:"1px solid #C85CE033",borderRadius:20,padding:"3px 10px"}}>
            <span style={{fontSize:11,color:C.purple,fontFamily:"monospace"}}>{id.slice(0,8)}…</span>
            <button onClick={()=>quitar(id)} style={{background:"none",border:"none",color:C.danger,fontSize:13,cursor:"pointer",padding:0,lineHeight:1}}>×</button>
          </div>
        ))}
      </div>}
      <div style={{display:"flex",gap:7}}>
        <input value={idInput} onChange={e=>{setIdInput(e.target.value);setErr("");}} placeholder="ID del usuario a agregar como ayudante" style={{flex:1,background:C.surface,border:`1px solid ${err?C.danger:C.border}`,borderRadius:9,padding:"7px 11px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT}}/>
        <button onClick={agregar} disabled={saving||!idInput.trim()} style={{background:"#C85CE022",border:"1px solid #C85CE044",borderRadius:9,color:C.purple,padding:"7px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>+</button>
      </div>
      {err&&<div style={{fontSize:11,color:C.danger,marginTop:4}}>{err}</div>}
      <div style={{fontSize:10,color:C.muted,marginTop:5}}>El usuario encontrará su ID en Mi cuenta → Editar perfil.</div>
    </div>
  );
}

// ─── CHAT CURSO — chat grupal para inscriptos + dueño + ayudantes ─────────────
function ChatCurso({post,session,ayudantes=[]}){
  const [msgs,setMsgs]=useState([]);const [input,setInput]=useState("");const [loading,setLoading]=useState(true);
  const miEmail=session.user.email;
  const bottomRef=useRef(null);const listRef=useRef(null);const didScrollRef=useRef(false);
  const cargar=useCallback(async()=>{
    try{
      const grupal=await sb.getMensajesGrupo(post.id,session.access_token).catch(()=>[]);
      // Agregar display names desde localStorage
      const withNames=grupal.map(m=>({...m,de_nombre_display:sb.getDisplayName(m.de_nombre)}));
      setMsgs(withNames);
      if(!didScrollRef.current&&withNames.length>0){didScrollRef.current=true;setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),60);}
    }finally{setLoading(false);}
  },[post.id,session.access_token]);
  useEffect(()=>{cargar();const t=setInterval(cargar,6000);return()=>clearInterval(t);},[cargar]);
  const send=async()=>{
    if(!input.trim())return;const txt=input.trim();setInput("");
    const displayNombre=session.user.user_metadata?.display_name||miEmail.split("@")[0];
    try{
      await sb.insertMensaje({publicacion_id:post.id,de_usuario:session.user.id,para_usuario:null,de_nombre:miEmail,para_nombre:"__grupo__",texto:txt,leido:true,pub_titulo:post.titulo},session.access_token);
      // Notificar a todos los inscriptos (excepto al que manda)
      const inscriptos=await sb.getInscripciones(post.id,session.access_token).catch(()=>[]);
      const todos=[...inscriptos.map(i=>i.alumno_email),post.autor_email].filter(e=>e!==miEmail);
      await Promise.all(todos.map(e=>sb.insertNotificacion({usuario_id:null,alumno_email:e,tipo:"chat_grupal",publicacion_id:post.id,pub_titulo:post.titulo,leida:false}).catch(()=>{})));
      await cargar();setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),60);
    }catch(e){alert("Error al enviar: "+e.message);}
  };
  const esOwner=(email)=>email===post.autor_email;
  const esAyudante=(email)=>ayudantes.includes(email);
  const getDisplayName=(m)=>m.de_nombre_display||m.de_nombre.split("@")[0];
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontWeight:700,color:C.text,fontSize:14}}>Chat grupal</span>
      </div>
      <div ref={listRef} style={{height:340,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
        {loading?<Spinner/>:msgs.length===0?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"24px 0"}}>Iniciá la conversación del grupo 👋</div>
          :msgs.map((m,i)=>{
            const esMiMsg=m.de_nombre===miEmail;
            const isOwner=esOwner(m.de_nombre);const isAyud=esAyudante(m.de_nombre);
            const isSpec=isOwner||isAyud;
            const bgMsg=esMiMsg?C.accent:isOwner?"#C85CE033":isAyud?"#5CA8E033":C.surface;
            const borderMsg=esMiMsg?"transparent":isOwner?"#C85CE055":isAyud?"#5CA8E055":C.border;
            const colorMsg=esMiMsg?"#0D0D0D":C.text;
            const nameColor=isOwner?C.purple:isAyud?C.info:C.muted;
            const roleLabel=isOwner?" · docente":isAyud?" · ayudante":"";
            return(<div key={i} style={{display:"flex",justifyContent:esMiMsg?"flex-end":"flex-start",gap:6,alignItems:"flex-end"}}>
              {!esMiMsg&&<Avatar letra={(m.de_nombre||"?")[0]} size={24}/>}
              <div style={{maxWidth:"75%"}}>
                {!esMiMsg&&<div style={{fontSize:10,color:nameColor,fontWeight:isSpec?700:500,marginBottom:3}}>
                  {getDisplayName(m)}{roleLabel}
                </div>}
                <div style={{background:bgMsg,color:colorMsg,padding:"8px 12px",borderRadius:esMiMsg?"13px 13px 4px 13px":"13px 13px 13px 4px",fontSize:12,lineHeight:1.5,border:`1px solid ${borderMsg}`}}>
                  {m.texto}
                </div>
              </div>
            </div>);
          })}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"10px 13px",borderTop:`1px solid ${C.border}`,display:"flex",gap:7}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Escribí al grupo..." style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"8px 13px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT}}/>
        <button onClick={send} disabled={!input.trim()} style={{background:input.trim()?C.accent:C.surface,border:`1px solid ${input.trim()?C.accent:C.border}`,borderRadius:"50%",width:34,height:34,cursor:input.trim()?"pointer":"default",fontSize:15,flexShrink:0,transition:"all .15s"}}>↑</button>
      </div>
    </div>
  );
}

// ─── CERRAR INSCRIPCIONES MODAL ───────────────────────────────────────────────
function CerrarInscModal({post,session,onClose,onCerrado}){
  const [saving,setSaving]=useState(false);const [ok,setOk]=useState(false);
  const cerrar=async()=>{setSaving(true);try{await sb.updatePublicacion(post.id,{inscripciones_cerradas:true},session.access_token);setOk(true);if(onCerrado)onCerrado();setTimeout(onClose,1200);}finally{setSaving(false);}};
  return(<Modal onClose={onClose} width="min(400px,95vw)">
    <div style={{padding:"20px 22px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <h3 style={{color:C.warn,margin:0,fontSize:16,fontWeight:700}}>Cerrar inscripciones</h3>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button>
      </div>
      {ok?<div style={{textAlign:"center",padding:"16px 0",color:C.success,fontWeight:700}}>✓ Inscripciones cerradas</div>:(
        <>
          <p style={{color:C.muted,fontSize:13,marginBottom:16}}>Los usuarios ya inscriptos mantendrán su acceso. No se aceptarán nuevas inscripciones.</p>
          <Btn onClick={cerrar} disabled={saving} variant="warn" style={{width:"100%",padding:"10px"}}>{saving?"Procesando...":"Cerrar inscripciones"}</Btn>
        </>
      )}
    </div>
  </Modal>);
}

// ─── CURSO PAGE ───────────────────────────────────────────────────────────────
function CursoPage({post,session,onClose,onUpdatePost}){
  const [contenido,setContenido]=useState([]);const [loading,setLoading]=useState(true);
  const [inscripcion,setInscripcion]=useState(null);const [inscripciones,setInscripciones]=useState([]);const [inscLoading,setInscLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);const [nuevoTipo,setNuevoTipo]=useState("video");const [nuevoTitulo,setNuevoTitulo]=useState("");const [nuevoUrl,setNuevoUrl]=useState("");const [nuevoTexto,setNuevoTexto]=useState("");const [savingC,setSavingC]=useState(false);
  const [calExpanded,setCalExpanded]=useState(false);const [showFinalizar,setShowFinalizar]=useState(false);const [showDenuncia,setShowDenuncia]=useState(false);const [showCerrarInsc,setShowCerrarInsc]=useState(false);const [localFinalizado,setLocalFinalizado]=useState(!!post.finalizado);const [localCerrado,setLocalCerrado]=useState(!!(post.inscripciones_cerradas||post.inscripcionesCerradas));const refreshPost=async()=>{try{const pubs=await sb.getMisPublicaciones(post.autor_email,session.access_token);const fresh=pubs.find(p=>p.id===post.id);if(fresh&&onUpdatePost)onUpdatePost(fresh);}catch{}};
  const esMio=post.autor_email===session.user.email;const miEmail=session.user.email;
  const [needsValoracion,setNeedsValoracion]=useState(false);
  const pageRef=useRef(null);
  useEffect(()=>{
    if(pageRef.current)pageRef.current.scrollTop=0;
    Promise.all([sb.getContenido(post.id,session.access_token),sb.getMisInscripciones(miEmail,session.access_token),esMio?sb.getInscripciones(post.id,session.access_token):Promise.resolve([])]).then(([cont,misIns,todos])=>{
      setContenido(cont);const miInsc=misIns.find(i=>i.publicacion_id===post.id)||null;setInscripcion(miInsc);if(esMio)setInscripciones(todos);
      if(miInsc?.clase_finalizada&&!miInsc?.valorado)setNeedsValoracion(true);
    }).finally(()=>{setLoading(false);setInscLoading(false);});
  },[post.id,miEmail,esMio,session]);
  const inscribirse=async()=>{setInscLoading(true);try{const r=await sb.insertInscripcion({publicacion_id:post.id,alumno_id:session.user.id,alumno_email:miEmail},session.access_token);setInscripcion(r[0]);}finally{setInscLoading(false);}};
  const desinscribirse=async()=>{if(!inscripcion)return;setInscLoading(true);try{await sb.deleteInscripcion(inscripcion.id,session.access_token);setInscripcion(null);}finally{setInscLoading(false);}};
  const addContenido=async()=>{if(!nuevoTitulo.trim())return;setSavingC(true);try{const data={publicacion_id:post.id,tipo:nuevoTipo,titulo:nuevoTitulo,orden:contenido.length+1};if(nuevoTipo!=="texto"&&nuevoTipo!=="aviso"&&nuevoTipo!=="tarea")data.url=nuevoUrl;else data.texto=nuevoTexto;const r=await sb.insertContenido(data,session.access_token);setContenido(prev=>[...prev,r[0]]);setNuevoTitulo("");setNuevoUrl("");setNuevoTexto("");setShowAdd(false);}finally{setSavingC(false);}};
  const removeContenido=async(id)=>{await sb.deleteContenido(id,session.access_token);setContenido(prev=>prev.filter(c=>c.id!==id));};
  const esAyudante=(post.ayudantes||[]).includes(miEmail);const tieneAcceso=esMio||esAyudante||!!inscripcion;const duracion=calcDuracion(post.fecha_inicio,post.fecha_fin);const hasCal=post.sinc==="sinc"&&post.clases_sinc;
  // Gate: if not owner and not inscribed, show access wall
  if(!tieneAcceso&&!loading&&!inscLoading){
    const cerrado=localCerrado||(post.inscripciones_cerradas||post.inscripcionesCerradas);
    return(<div style={{position:"fixed",inset:0,background:C.bg,zIndex:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:FONT,gap:16,padding:24}}>
      <button onClick={onClose} style={{position:"absolute",top:20,left:20,background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>← Volver</button>
      <div style={{fontSize:48,marginBottom:8}}>{cerrado?"🚫":"🔒"}</div>
      <h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:0}}>{cerrado?"Inscripciones cerradas":"Contenido restringido"}</h2>
      <p style={{color:C.muted,fontSize:14,textAlign:"center",maxWidth:360,margin:0}}>{cerrado?"El docente ya cerró las inscripciones para este curso.":"Inscribite gratis para acceder a todo el contenido."}</p>
      {!cerrado&&(inscLoading?<Spinner/>:<Btn onClick={inscribirse} variant="success" style={{padding:"10px 28px",fontSize:14}}>Inscribirme gratis →</Btn>)}
      <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:13,cursor:"pointer",fontFamily:FONT}}>Volver atrás</button>
    </div>);
  }
  const iS={width:"100%",background:"#1a1a1a",border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:8};
  return(
    <div  ref={pageRef} style={{position:"fixed",inset:0,background:C.bg,zIndex:300,overflowY:"auto",fontFamily:FONT}}>
      <div style={{position:"sticky",top:0,zIndex:10,background:C.sidebar,borderBottom:`1px solid ${C.border}`,padding:"12px 20px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onClose} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>← Volver</button>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:C.text,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.titulo}</div><div style={{fontSize:11,color:C.muted}}>{post.materia} · {post.autor_nombre||post.autor_email?.split("@")[0]}</div></div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {esMio&&!localFinalizado&&!localCerrado&&<button onClick={()=>setShowCerrarInsc(true)} style={{background:"#E0955C15",border:"1px solid #E0955C33",borderRadius:9,color:C.warn,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:600}}>🔒 Cerrar inscripciones</button>}
          {esMio&&!localFinalizado&&localCerrado&&<button onClick={async()=>{try{await sb.updatePublicacion(post.id,{inscripciones_cerradas:false},session.access_token);setLocalCerrado(false);refreshPost();}catch(e){alert("Error: "+e.message);}}} style={{background:"#4ECB7115",border:"1px solid #4ECB7133",borderRadius:9,color:C.success,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:600}}>🔓 Reabrir inscripciones</button>}
          {esMio&&!localFinalizado&&<button onClick={()=>setShowFinalizar(true)} style={{background:"#4ECB7122",border:"1px solid #4ECB7144",borderRadius:9,color:C.success,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:600}}>Finalizar clase</button>}
          {localFinalizado&&esMio&&<span style={{fontSize:12,color:C.info,fontWeight:600}}>✓ Clase finalizada</span>}
          {!esMio&&inscripcion&&<button onClick={()=>setShowDenuncia(true)} style={{background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:9,color:C.danger,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>Denunciar</button>}
          {esMio?<span style={{fontSize:12,color:C.muted}}>Sos el docente</span>:(
            inscLoading?<Spinner small/>:(
              localFinalizado?<span style={{fontSize:12,color:C.info}}>Clase finalizada</span>:
              localCerrado?<span style={{fontSize:12,color:C.muted}}>Inscripciones cerradas</span>:
              inscripcion?<button onClick={desinscribirse} style={{background:"none",border:`1px solid ${C.danger}`,borderRadius:9,color:C.danger,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>Desinscribirme</button>
              :(localCerrado||(post.inscripciones_cerradas||post.inscripcionesCerradas))?<span style={{fontSize:12,color:C.muted}}>Inscripciones cerradas</span>
              :<Btn onClick={inscribirse} variant="success" style={{padding:"7px 14px",fontSize:12}}>Inscribirme gratis →</Btn>
            )
          )}
        </div>
      </div>
      {needsValoracion&&(
        <div style={{background:"linear-gradient(135deg,#F5C84220,#F5C84210)",border:`1px solid #F5C84244`,margin:"16px 20px",borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:24}}>⭐</span>
          <div style={{flex:1}}><div style={{color:C.accent,fontWeight:700,fontSize:14,marginBottom:2}}>¡El docente marcó las clases como finalizadas!</div><div style={{color:C.muted,fontSize:12}}>Contanos tu experiencia.</div></div>
          <a href="#resenas" style={{background:C.accent,color:"#0D0D0D",borderRadius:9,padding:"7px 14px",fontSize:12,fontWeight:700,textDecoration:"none"}}>Valorar →</a>
        </div>
      )}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px",display:"grid",gridTemplateColumns:hasCal?"1fr 300px":"1fr",gap:22,alignItems:"start"}}>
        <div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:18}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}><Tag tipo={post.tipo}/>{post.verificado&&<VerifiedBadge/>}{post.sinc&&<span style={{fontSize:11,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"2px 8px",color:C.muted}}>{post.sinc==="sinc"?"🔴 Sincrónico":"📹 Asincrónico"}</span>}</div>
            <p style={{color:C.muted,fontSize:13,lineHeight:1.7,marginBottom:12}}>{post.descripcion}</p>
            <div style={{display:"flex",gap:9,flexWrap:"wrap"}}><Chip label="MODALIDAD" val={post.modo==="curso"?"Curso":"Clase particular"}/>{duracion&&<Chip label="DURACIÓN" val={duracion}/>}{post.fecha_inicio&&<Chip label="INICIO" val={fmt(post.fecha_inicio)}/>}{post.fecha_fin&&<Chip label="FIN" val={fmt(post.fecha_fin)}/>}</div>
          </div>
          {!esMio&&(<div style={{background:inscripcion?"#4ECB7115":C.card,border:`1px solid ${inscripcion?"#4ECB7133":C.border}`,borderRadius:12,padding:"12px 16px",marginBottom:18}}>
            <div style={{color:inscripcion?C.success:C.text,fontWeight:600,fontSize:13}}>{inscripcion?"✓ Estás inscripto":"Inscribite para acceder al contenido"}</div>
            {inscripcion&&<div style={{color:C.muted,fontSize:12,marginTop:2}}>Inscripto el {fmt(inscripcion.created_at)}</div>}
          </div>)}
          {esMio&&(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 18px",marginBottom:18}}>
            <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:10}}>Alumnos ({inscripciones.length})</div>
            {inscripciones.length===0?<div style={{color:C.muted,fontSize:12}}>Nadie inscripto aún.</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {inscripciones.map(ins=>{
                  const isAyud=(post.ayudantes||[]).includes(ins.alumno_email);
                  return(<div key={ins.id} style={{display:"flex",alignItems:"center",gap:9,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                    <Avatar letra={ins.alumno_email[0]} size={26}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{color:C.text,fontSize:12,fontWeight:600}}>{sb.getDisplayName(ins.alumno_email)}</div>
                      <div style={{fontSize:10,color:C.muted}}>{ins.alumno_email}</div>
                      {isAyud&&<div style={{fontSize:10,color:C.info}}>Ayudante</div>}
                    </div>
                    {ins.clase_finalizada&&<span style={{fontSize:10,background:"#4ECB7115",border:"1px solid #4ECB7133",borderRadius:20,color:C.success,padding:"1px 7px"}}>✓</span>}
                    <button onClick={async()=>{
                      const ayuds=post.ayudantes||[];
                      const newAyuds=isAyud?ayuds.filter(e=>e!==ins.alumno_email):[...ayuds,ins.alumno_email];
                      await sb.updatePublicacion(post.id,{ayudantes:newAyuds},session.access_token);
                      post.ayudantes=newAyuds;setInscripciones([...inscripciones]);
                      // Notificar al nuevo ayudante
                      if(!isAyud){
                        sb.insertNotificacion({usuario_id:null,alumno_email:ins.alumno_email,tipo:"nuevo_ayudante",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
                      }
                    }} style={{background:isAyud?"#C85CE022":"#5CA8E015",border:`1px solid ${isAyud?"#C85CE044":"#5CA8E033"}`,borderRadius:7,color:isAyud?C.purple:C.info,padding:"3px 9px",cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:FONT,flexShrink:0}}>
                      {isAyud?"Quitar ayudante":"+ Ayudante"}
                    </button>
                  </div>);
                })}
              </div>
            )}
            <AyudanteBuscador post={post} session={session} ayudantesActuales={post.ayudantes||[]} onUpdate={ayuds=>{post.ayudantes=ayuds;setInscripciones([...inscripciones]);}}/>
          </div>)}
          {!esMio&&(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 16px",marginBottom:18}}><InscritosCount pubId={post.id} session={session}/></div>)}
          <div id="contenido" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontWeight:700,color:C.text,fontSize:14}}>📋 Contenido <span style={{color:C.muted,fontWeight:400,fontSize:12}}>({contenido.length})</span></div>
              {(esMio||esAyudante)&&<button onClick={()=>setShowAdd(v=>!v)} style={{background:C.accentDim,border:`1px solid #F5C84233`,borderRadius:8,color:C.accent,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:600}}>+ Agregar</button>}
            </div>
            {esMio&&showAdd&&(
              <div style={{background:"#1a1a1a",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:14}}>
                <div style={{display:"flex",gap:5,marginBottom:9,flexWrap:"wrap"}}>
                  {[["video","🎬"],["archivo","📁"],["texto","📝"],["aviso","📢"],["tarea","📌"],["link","🔗"]].map(([v,ic])=>(<button key={v} onClick={()=>setNuevoTipo(v)} style={{padding:"6px 9px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",background:nuevoTipo===v?C.accent:C.surface,color:nuevoTipo===v?"#0D0D0D":C.muted,border:`1px solid ${nuevoTipo===v?"transparent":C.border}`,fontFamily:FONT}}>{ic} {v}</button>))}
                </div>
                <input value={nuevoTitulo} onChange={e=>setNuevoTitulo(e.target.value)} placeholder="Título" style={iS}/>
                {nuevoTipo!=="texto"&&nuevoTipo!=="aviso"&&nuevoTipo!=="tarea"?<input value={nuevoUrl} onChange={e=>setNuevoUrl(e.target.value)} placeholder="URL" style={iS}/>:<textarea value={nuevoTexto} onChange={e=>setNuevoTexto(e.target.value)} placeholder="Contenido..." style={{...iS,minHeight:70,resize:"vertical"}}/>}
                <div style={{display:"flex",gap:8}}><Btn onClick={addContenido} disabled={savingC||!nuevoTitulo.trim()} style={{padding:"7px 14px",fontSize:12}}>{savingC?"...":"Guardar"}</Btn><button onClick={()=>setShowAdd(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"7px 14px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>Cancelar</button></div>
              </div>
            )}
            {loading?<Spinner/>:contenido.length===0?<div style={{textAlign:"center",padding:"30px 0",color:C.muted,fontSize:13}}>{esMio?"Cargá el primer contenido.":"El docente aún no cargó contenido."}</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {contenido.map((c,i)=>{
                  const TIPO={video:{icon:"🎬",color:C.info},archivo:{icon:"📁",color:C.success},texto:{icon:"📝",color:C.text},aviso:{icon:"📢",color:C.accent},tarea:{icon:"📌",color:C.purple},link:{icon:"🔗",color:C.info}};
                  const t=TIPO[c.tipo]||{icon:"📄",color:C.text};
                  return(<div key={c.id} style={{background:"#1a1a1a",border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 15px",opacity:tieneAcceso?1:.6}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:9}}>
                      <div style={{display:"flex",alignItems:"center",gap:9,flex:1,minWidth:0}}>
                        <div style={{width:34,height:34,borderRadius:9,background:C.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,border:`1px solid ${C.border}`}}>{t.icon}</div>
                        <div style={{minWidth:0,flex:1}}>
                          <div style={{fontWeight:600,color:t.color,fontSize:13,marginBottom:2}}>{i+1}. {c.titulo}</div>
                          {c.tipo==="texto"&&c.texto&&tieneAcceso&&<p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.5}}>{c.texto}</p>}
                          {c.tipo==="aviso"&&c.texto&&<p style={{color:C.accent,fontSize:12,margin:0,background:C.accentDim,borderRadius:7,padding:"6px 9px"}}>{c.texto}</p>}
                          {c.tipo==="tarea"&&c.texto&&tieneAcceso&&<p style={{color:C.purple,fontSize:12,margin:0,background:"#C85CE015",borderRadius:7,padding:"6px 9px"}}>{c.texto}</p>}
                          {(c.tipo==="video"||c.tipo==="archivo"||c.tipo==="link")&&c.url&&tieneAcceso&&<a href={c.url} target="_blank" rel="noreferrer" style={{color:C.info,fontSize:12,textDecoration:"none"}}>{c.tipo==="video"?"▶ Ver video":c.tipo==="archivo"?"📥 Abrir":"→ Link"}</a>}
                          {!tieneAcceso&&<div style={{color:C.muted,fontSize:11,marginTop:2}}>🔒 Inscribite para ver</div>}
                        </div>
                      </div>
                      {(esMio||esAyudante)&&<button onClick={()=>removeContenido(c.id)} style={{background:"none",border:"none",color:C.danger,fontSize:15,cursor:"pointer",flexShrink:0}}>×</button>}
                    </div>
                  </div>);
                })}
              </div>
            )}
          </div>
          {tieneAcceso&&<div style={{marginBottom:18}}><ChatCurso post={post} session={session} ayudantes={post.ayudantes||[]}/></div>}
          <div id="resenas" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px"}}>
            <ReseñasSeccion post={post} session={session} inscripcion={inscripcion} esMio={esMio}/>
          </div>
        </div>
        {hasCal&&(
          <div style={{position:"sticky",top:70}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
              <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontWeight:700,color:C.text,fontSize:14}}>📅 Calendario</span>
                <button onClick={()=>setCalExpanded(true)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,color:C.muted,padding:"4px 9px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>↗</button>
              </div>
              <div style={{padding:"14px"}}><CalendarioCurso post={post} compact/></div>
            </div>
          </div>
        )}
      </div>
      {calExpanded&&(<div style={{position:"fixed",inset:0,background:"#000d",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setCalExpanded(false)}><div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"28px",width:"min(780px,96vw)",maxHeight:"92vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><h3 style={{color:C.text,margin:0,fontSize:18}}>📅 Calendario de clases</h3><button onClick={()=>setCalExpanded(false)} style={{background:"none",border:"none",color:C.muted,fontSize:24,cursor:"pointer"}}>×</button></div><CalendarioCurso post={post}/></div></div>)}
      {showFinalizar&&<FinalizarClaseModal post={post} session={session} onClose={()=>setShowFinalizar(false)} onFinalizado={()=>{setLocalFinalizado(true);refreshPost();}}/>}
      {showDenuncia&&<DenunciaModal post={post} session={session} onClose={()=>setShowDenuncia(false)}/>}
      {showCerrarInsc&&<CerrarInscModal post={post} session={session} onClose={()=>setShowCerrarInsc(false)} onCerrado={()=>{setLocalCerrado(true);refreshPost();}}/>}
    </div>
  );
}


// ─── INSCRIBIRSE BTN — botón rápido desde el DetailModal ──────────────────────
function InscribirseBtn({post,session,onDone}){
  const [loading,setLoading]=useState(false);const [ok,setOk]=useState(false);
  const inscribirse=async()=>{
    setLoading(true);
    try{
      await sb.insertInscripcion({publicacion_id:post.id,alumno_id:session.user.id,alumno_email:session.user.email},session.access_token);
      setOk(true);
      setTimeout(()=>onDone(),700);
    }catch(e){
      if(e.message?.includes("uq_inscripcion")){onDone();}// ya inscripto
      else alert("Error: "+e.message);
    }finally{setLoading(false);}
  };
  if(ok)return<span style={{fontSize:12,color:C.success,fontWeight:700}}>✓ Inscripto</span>;
  return<button onClick={inscribirse} disabled={loading} style={{background:"#4ECB7122",color:C.success,border:"1px solid #4ECB7144",borderRadius:11,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT}}>{loading?"...":"📚 Inscribirme gratis"}</button>;
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function DetailModal({post,session,onClose,onChat,onOpenCurso,onOpenPerfil}){
  const [reseñas,setReseñas]=useState([]);const [reseñasUsuario,setReseñasUsuario]=useState([]);const [loading,setLoading]=useState(true);
  const [reseña,setReseña]=useState("");const [estrella,setEstrella]=useState(5);const [saving,setSaving]=useState(false);const [err,setErr]=useState("");
  const [inscripcion,setInscripcion]=useState(null);const [puedeChat,setPuedeChat]=useState(false);
  const nombre=post.autor_nombre||sb.getDisplayName(post.autor_email)||post.autor_email?.split("@")[0]||"Usuario";const esMio=post.autor_email===session.user.email;
  useEffect(()=>{
    Promise.all([
      sb.getReseñas(post.id,session.access_token),
      sb.getReseñasByAutor(post.autor_email,session.access_token),
      sb.getMisInscripciones(session.user.email,session.access_token),
      post.tipo==="busqueda"?sb.getOfertaAceptada(post.id,session.user.email,session.access_token).catch(()=>[]):Promise.resolve([])
    ]).then(([pub,usr,ins,ofertaAcept])=>{
      setReseñas(pub);setReseñasUsuario(usr);
      const insc=ins.find(i=>i.publicacion_id===post.id)||null;
      setInscripcion(insc);
      setPuedeChat(!!insc||(Array.isArray(ofertaAcept)&&ofertaAcept.length>0));
    }).finally(()=>setLoading(false));
  },[post.id,post.autor_email,post.tipo,session]);
  const avgPub=calcAvg(reseñas);const avgUser=calcAvg(reseñasUsuario);
  const puedeResena=!esMio&&!!inscripcion;
  const enviar=async()=>{
    if(!reseña.trim()){setErr("Escribí tu reseña");return;}setSaving(true);setErr("");
    try{await sb.insertReseña({publicacion_id:post.id,autor_id:session.user.id,autor_nombre:sb.getDisplayName(session.user.email),autor_pub_email:post.autor_email,texto:reseña,estrellas:estrella},session.access_token);const[pub,usr]=await Promise.all([sb.getReseñas(post.id,session.access_token),sb.getReseñasByAutor(post.autor_email,session.access_token)]);setReseñas(pub);setReseñasUsuario(usr);setReseña("");}
    catch(e){setErr("Error: "+e.message);}finally{setSaving(false);}
  };
  return(
    <Modal onClose={onClose} width="min(660px,97vw)">
      <div style={{padding:"19px 21px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button onClick={()=>{onClose();onOpenPerfil(post.autor_email);}} style={{background:"none",border:"none",cursor:"pointer",padding:0}}><Avatar letra={nombre[0]} size={48}/></button>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:3}}>
                <button onClick={()=>{onClose();onOpenPerfil(post.autor_email);}} style={{fontWeight:700,color:C.text,fontSize:15,background:"none",border:"none",cursor:"pointer",fontFamily:FONT,padding:0}} onMouseEnter={e=>e.currentTarget.style.color=C.accent} onMouseLeave={e=>e.currentTarget.style.color=C.text}>{nombre}</button>
                {post.verificado&&<VerifiedBadge/>}
              </div>
              <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Valoración del docente:</div>
              {loading?<Spinner small/>:<StarRating val={avgUser} count={reseñasUsuario.length}/>}
              <div style={{marginTop:6}}><Tag tipo={post.tipo}/></div>
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer",flexShrink:0}}>×</button>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:13,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
          <div><div style={{fontSize:10,color:C.muted,letterSpacing:1,marginBottom:3}}>VALORACIÓN PUBLICACIÓN</div>{loading?<Spinner small/>:<StarRating val={avgPub} count={reseñas.length}/>}</div>
          <div style={{width:1,height:28,background:C.border}}/>
          <div><div style={{fontSize:10,color:C.muted,letterSpacing:1,marginBottom:3}}>MATERIA</div><span style={{background:C.accentDim,color:C.accent,fontSize:12,fontWeight:600,padding:"2px 9px",borderRadius:7}}>{post.materia}</span></div>
          {post.created_at&&<><div style={{width:1,height:28,background:C.border}}/><div><div style={{fontSize:10,color:C.muted,letterSpacing:1,marginBottom:3}}>PUBLICADO</div><span style={{color:C.muted,fontSize:12}}>{fmt(post.created_at)}</span></div></>}
        </div>
        <h2 style={{color:C.text,fontSize:18,fontWeight:700,margin:"0 0 7px"}}>{post.titulo}</h2>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.7,marginBottom:13}}>{post.descripcion}</p>
        {post.tipo==="oferta"&&(<div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:13}}>
          {post.modo==="curso"?(<><Chip label="MODALIDAD" val="📦 Curso"/>{post.sinc&&<Chip label="TIPO" val={post.sinc==="sinc"?"🔴 Sincrónico":"📹 Asincrónico"}/>}{post.precio&&<Chip label="PRECIO" val={fmtPrice(post.precio)}/>}{calcDuracion(post.fecha_inicio,post.fecha_fin)&&<Chip label="DURACIÓN" val={calcDuracion(post.fecha_inicio,post.fecha_fin)}/>}{post.fecha_inicio&&<Chip label="INICIO" val={fmt(post.fecha_inicio)}/>}</>)
          :(<><Chip label="MODALIDAD" val="👤 Clase particular"/>{post.precio&&<Chip label="PRECIO" val={`${fmtPrice(post.precio)} /${post.precio_tipo||"hora"}`}/>}<Chip label="HORARIO" val="A convenir"/></>)}
        </div>)}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:13}}>
          {/* ── Botón Inscribirse (prioridad principal para ofertas) ── */}
          {post.tipo==="oferta"&&!esMio&&!loading&&!inscripcion&&!post.finalizado&&!(post.inscripciones_cerradas||post.inscripcionesCerradas)&&(
            <InscribirseBtn post={post} session={session} onDone={()=>{onClose();onOpenCurso(post);}}/>
          )}
          {post.tipo==="oferta"&&!esMio&&!loading&&!inscripcion&&(post.inscripciones_cerradas||post.inscripcionesCerradas)&&(
            <span style={{fontSize:12,color:C.muted,fontStyle:"italic",alignSelf:"center"}}>Inscripciones cerradas</span>
          )}
          {/* ── Ver curso (ya inscripto o dueño) ── */}
          {post.tipo==="oferta"&&(esMio||inscripcion)&&<button onClick={()=>{onClose();onOpenCurso(post);}} style={{background:"#4ECB7122",color:C.success,border:"1px solid #4ECB7144",borderRadius:11,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT}}>📚 Ver curso</button>}
          {/* ── Chat ── */}
          {!esMio&&puedeChat&&<button onClick={()=>{onClose();onChat(post);}} style={{background:C.accent,color:"#0D0D0D",border:"none",borderRadius:11,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT}}>💬 Chatear</button>}
          {!esMio&&post.tipo==="busqueda"&&!puedeChat&&<span style={{fontSize:12,color:C.muted,fontStyle:"italic",alignSelf:"center"}}>Esperando que el autor acepte tu oferta</span>}
          {/* OfertarBtn SOLO aquí */}
          <OfertarBtn post={post} session={session}/>
        </div>
        {post.tipo==="oferta"&&post.modo==="curso"&&post.sinc==="sinc"&&(<div style={{margin:"14px 0"}}><div style={{fontWeight:600,color:C.text,fontSize:13,marginBottom:7}}>📅 Calendario</div><CalendarioCurso post={post}/></div>)}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:14}}>
          <h4 style={{color:C.text,marginBottom:11,fontSize:13}}>Reseñas ({reseñas.length})</h4>
          {loading?<Spinner/>:reseñas.map(r=>(<div key={r.id} style={{background:C.card,borderRadius:11,padding:"10px 13px",marginBottom:8}}><div style={{display:"flex",gap:7,alignItems:"center",marginBottom:4}}><Avatar letra={r.autor_nombre?.[0]||"?"} size={26}/><span style={{fontWeight:600,color:C.text,fontSize:12}}>{r.autor_nombre}</span><span style={{color:C.accent,fontSize:11}}>{"★".repeat(r.estrellas||0)}</span></div><p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.5}}>{r.texto}</p></div>))}
          {puedeResena&&(<div style={{marginTop:12}}><div style={{display:"flex",gap:3,marginBottom:7}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setEstrella(n)} style={{background:"none",border:"none",fontSize:19,cursor:"pointer",color:n<=estrella?C.accent:C.border}}>★</button>)}</div><textarea value={reseña} onChange={e=>setReseña(e.target.value)} placeholder="Dejá tu reseña..." style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",resize:"vertical",minHeight:65,boxSizing:"border-box",fontFamily:FONT}}/><ErrMsg msg={err}/><Btn onClick={enviar} disabled={saving} variant="ghost" style={{marginTop:6,color:C.accent,border:`1px solid ${C.accent}`,fontSize:12,padding:"6px 13px"}}>{saving?"Guardando...":"Publicar reseña"}</Btn></div>)}
          {!esMio&&!inscripcion&&!loading&&<div style={{marginTop:10,fontSize:12,color:C.muted,fontStyle:"italic"}}>Inscribite al curso para poder dejar una reseña.</div>}
        </div>
      </div>
    </Modal>
  );
}

// ─── VERIFICACIÓN IA ──────────────────────────────────────────────────────────
function VerificacionIA({titulo,materia,onVerificado}){
  const [pregunta,setPregunta]=useState("");const [respuesta,setRespuesta]=useState("");const [estado,setEstado]=useState("cargando");const [feedback,setFeedback]=useState("");
  // Solo dispara cuando cambia la materia para no spamear en cada letra
  useEffect(()=>{if(!titulo||!materia)return;setEstado("cargando");setRespuesta("");setPregunta("");setFeedback("");sb.verificarConIA(titulo,materia,"").then(r=>{setPregunta(r.pregunta||"Contá tu experiencia.");setEstado("esperando");}).catch(()=>{setPregunta("Contá brevemente tu experiencia enseñando este tema.");setEstado("esperando");});},[materia]); // eslint-disable-line
  const evaluar=async()=>{if(!respuesta.trim())return;setEstado("evaluando");try{const r=await sb.verificarConIA(titulo,materia,respuesta);setFeedback(r.feedback||"");if(r.correcta){setEstado("ok");onVerificado();}else setEstado("error");}catch{setEstado("error");setFeedback("No se pudo evaluar.");}};
  if(estado==="ok")return <div style={{color:C.success,fontSize:12,padding:"7px 11px",background:"#4ECB7115",borderRadius:8,border:"1px solid #4ECB7133"}}>✓ ¡Verificado!</div>;
  return(<div style={{background:C.accentDim,border:`1px solid #F5C84233`,borderRadius:10,padding:12,marginTop:8}}>
    <div style={{color:C.accent,fontSize:10,fontWeight:700,marginBottom:5,letterSpacing:1}}>✓ VERIFICACIÓN (IA)</div>
    {estado==="cargando"?<div style={{color:C.muted,fontSize:12,display:"flex",alignItems:"center",gap:6}}><Spinner small/>Generando...</div>:(<>
      <p style={{color:C.text,fontSize:12,marginBottom:7,lineHeight:1.5}}>{pregunta}</p>
      <textarea value={respuesta} onChange={e=>setRespuesta(e.target.value)} placeholder="Tu respuesta..." style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",color:C.text,fontSize:12,outline:"none",resize:"vertical",minHeight:52,boxSizing:"border-box",fontFamily:FONT,marginBottom:7}}/>
      {estado==="error"&&<div style={{color:C.danger,fontSize:11,marginBottom:5}}>{feedback||"Respuesta incorrecta."}</div>}
      <div style={{display:"flex",gap:7,alignItems:"center"}}>
        <button onClick={evaluar} disabled={estado==="evaluando"||!respuesta.trim()} style={{background:C.accent,color:"#0D0D0D",border:"none",borderRadius:8,padding:"5px 12px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:FONT,opacity:!respuesta.trim()?.5:1}}>{estado==="evaluando"?"Evaluando...":"Verificar →"}</button>
        <button onClick={()=>{/* Omitir: publicar sin verificación */onVerificado(false);}} style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:FONT}}>Omitir (sin verificar)</button>
      </div>
    </>)}
  </div>);
}

// ─── POST FORM MODAL ──────────────────────────────────────────────────────────
function PostFormModal({session,postToEdit,onClose,onSave}){
  const editing=!!postToEdit;
  const [tipo,setTipo]=useState(postToEdit?.tipo||"busqueda");const [materia,setMateria]=useState(postToEdit?.materia||"");const [titulo,setTitulo]=useState(postToEdit?.titulo||"");const [descripcion,setDescripcion]=useState(postToEdit?.descripcion||"");
  const [modo,setModo]=useState(postToEdit?.modo||"particular");const [precio,setPrecio]=useState(postToEdit?.precio||"");const [precioTipo,setPrecioTipo]=useState(postToEdit?.precio_tipo||"hora");
  const [sinc,setSinc]=useState(postToEdit?.sinc||"sinc");const [fechaInicio,setFechaInicio]=useState(postToEdit?.fecha_inicio||"");const [fechaFin,setFechaFin]=useState(postToEdit?.fecha_fin||"");
  const [clasesSinc,setClasesSinc]=useState(()=>{try{return postToEdit?.clases_sinc?JSON.parse(postToEdit.clases_sinc):[]}catch{return [];}});
  const [verificado,setVerificado]=useState(postToEdit?.verificado||false);const [saving,setSaving]=useState(false);const [err,setErr]=useState("");
  const DESC_MAX=300;
  const addClase=()=>setClasesSinc(prev=>[...prev,{dia:"Lunes",hora_inicio:"09:00",hora_fin:"10:00"}]);
  const updClase=(i,f,v)=>setClasesSinc(prev=>prev.map((c,idx)=>idx===i?{...c,[f]:v}:c));
  const remClase=(i)=>setClasesSinc(prev=>prev.filter((_,idx)=>idx!==i));
  const durCalc=calcDuracion(fechaInicio,fechaFin);
  const iS={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:9,fontFamily:FONT};
  const guardar=async()=>{
    if(!titulo||!descripcion||!materia){setErr("Completá título, materia y descripción");return;}
    setSaving(true);setErr("");
    try{
      const data={tipo,materia,titulo,descripcion,autor_id:session.user.id,activo:true,verificado,modo};
      if(tipo==="oferta"){if(precio)data.precio=parseFloat(precio);if(modo==="particular")data.precio_tipo=precioTipo;else{data.sinc=sinc;if(fechaInicio)data.fecha_inicio=fechaInicio;if(fechaFin)data.fecha_fin=fechaFin;if(sinc==="sinc")data.clases_sinc=JSON.stringify(clasesSinc);}}
      if(editing){await sb.updatePublicacion(postToEdit.id,data,session.access_token);onSave();}
      else{const r=await sb.insertPublicacion(data,session.access_token);onSave(r[0]);}
      onClose();
    }catch(e){setErr("Error: "+e.message);}finally{setSaving(false);}
  };
  return(
    <Modal onClose={onClose}>
      <div style={{padding:"20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>{editing?"Editar publicación":"Nueva publicación"}</h3><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button></div>
        <div style={{display:"flex",gap:7,marginBottom:11}}>{["busqueda","oferta"].map(t=>(<button key={t} onClick={()=>setTipo(t)} style={{flex:1,padding:"8px",borderRadius:9,fontWeight:700,fontSize:12,cursor:"pointer",background:tipo===t?(t==="oferta"?C.success:C.accent):C.card,color:tipo===t?"#0D0D0D":C.muted,border:`1px solid ${tipo===t?"transparent":C.border}`,fontFamily:FONT}}>{t==="busqueda"?"🔍 Busco clases":"📚 Ofrezco clases"}</button>))}</div>
        <select value={materia} onChange={e=>setMateria(e.target.value)} style={{...iS,cursor:"pointer"}}><option value="">Seleccioná una materia</option>{MATERIAS.map(m=><option key={m} value={m}>{m}</option>)}</select>
        <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Título del curso o clase" style={iS}/>
        <div style={{position:"relative",marginBottom:9}}>
          <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value.slice(0,DESC_MAX))} placeholder="Descripción..." style={{...iS,minHeight:72,resize:"vertical",marginBottom:0,paddingBottom:22}}/>
          <span style={{position:"absolute",bottom:8,right:11,fontSize:10,color:descripcion.length>=DESC_MAX?C.danger:C.muted,fontFamily:FONT,pointerEvents:"none"}}>{descripcion.length}/{DESC_MAX}</span>
        </div>
        {tipo==="oferta"&&(<>
          <Label>Modalidad</Label>
          <div style={{display:"flex",gap:7,marginBottom:11}}>{[{v:"particular",l:"👤 Clase particular"},{v:"curso",l:"📦 Curso"}].map(({v,l})=>(<button key={v} onClick={()=>setModo(v)} style={{flex:1,padding:"7px",borderRadius:9,fontWeight:600,fontSize:12,cursor:"pointer",background:modo===v?C.accent:C.card,color:modo===v?"#0D0D0D":C.muted,border:`1px solid ${modo===v?"transparent":C.border}`,fontFamily:FONT}}>{l}</button>))}</div>
          {modo==="particular"&&(<div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginBottom:4}}><Label>Precio</Label><div style={{display:"flex",gap:7}}><input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Precio" type="number" min="0" style={{...iS,margin:0,flex:2}}/><select value={precioTipo} onChange={e=>setPrecioTipo(e.target.value)} style={{...iS,margin:0,flex:1,cursor:"pointer"}}><option value="hora">/ hora</option><option value="clase">/ clase</option></select></div></div>)}
          {modo==="curso"&&(<div style={{borderTop:`1px solid ${C.border}`,paddingTop:10}}>
            <Label>Precio total</Label><input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Precio" type="number" min="0" style={iS}/>
            <Label>Tipo</Label>
            <div style={{display:"flex",gap:7,marginBottom:9}}>{[{v:"sinc",l:"🔴 Sincrónico"},{v:"asinc",l:"📹 Asincrónico"}].map(({v,l})=>(<button key={v} onClick={()=>setSinc(v)} style={{flex:1,padding:"7px",borderRadius:9,fontWeight:600,fontSize:12,cursor:"pointer",background:sinc===v?C.accent:C.card,color:sinc===v?"#0D0D0D":C.muted,border:`1px solid ${sinc===v?"transparent":C.border}`,fontFamily:FONT}}>{l}</button>))}</div>
            <div style={{display:"flex",gap:7,marginBottom:9}}>
              <div style={{flex:1}}><Label>Inicio</Label><input type="date" value={fechaInicio} onChange={e=>{setFechaInicio(e.target.value);if(fechaFin&&fechaFin<=e.target.value)setFechaFin("");}} style={{...iS,margin:0,colorScheme:"dark"}}/></div>
              <div style={{flex:1}}><Label>Fin</Label><input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} min={fechaInicio?(()=>{const d=new Date(fechaInicio);d.setDate(d.getDate()+1);return d.toISOString().split("T")[0];})():undefined} disabled={!fechaInicio} style={{...iS,margin:0,colorScheme:"dark",opacity:fechaInicio?1:0.4,cursor:fechaInicio?"auto":"not-allowed"}}/></div>
            </div>
            {durCalc&&<div style={{background:C.accentDim,border:`1px solid #F5C84233`,borderRadius:8,padding:"7px 12px",marginBottom:9,fontSize:12,color:C.accent}}>⏱ Duración: <strong>{durCalc}</strong></div>}
            {sinc==="sinc"&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><Label>Horarios</Label><button onClick={addClase} style={{background:C.accentDim,border:`1px solid #F5C84244`,borderRadius:7,color:C.accent,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:FONT}}>+ Agregar</button></div>
              {clasesSinc.map((c,i)=>(<div key={i} style={{display:"flex",gap:5,alignItems:"center",marginBottom:6,background:C.card,borderRadius:9,padding:"7px 9px",border:`1px solid ${C.border}`}}>
                <select value={c.dia} onChange={e=>updClase(i,"dia",e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 7px",color:C.text,fontSize:11,fontFamily:FONT,cursor:"pointer",outline:"none",flex:2}}>{["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map(d=><option key={d}>{d}</option>)}</select>
                <input type="time" value={c.hora_inicio} onChange={e=>updClase(i,"hora_inicio",e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 7px",color:C.text,fontSize:11,fontFamily:FONT,outline:"none",colorScheme:"dark",flex:2}}/>
                <span style={{color:C.muted,fontSize:11}}>→</span>
                <input type="time" value={c.hora_fin} onChange={e=>updClase(i,"hora_fin",e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 7px",color:C.text,fontSize:11,fontFamily:FONT,outline:"none",colorScheme:"dark",flex:2}}/>
                <button onClick={()=>remClase(i)} style={{background:"none",border:"none",color:C.danger,fontSize:15,cursor:"pointer",flexShrink:0}}>×</button>
              </div>))}
            </>)}
          </div>)}
          {titulo&&materia&&!verificado&&<VerificacionIA titulo={titulo} materia={materia} onVerificado={(v)=>{setVerificado(v!==false);}}/>}
          {verificado&&<div style={{color:C.success,fontSize:11,padding:"5px 10px",background:"#4ECB7115",borderRadius:7,border:"1px solid #4ECB7133",marginTop:5}}>✓ Verificado</div>}
        </>)}
        <ErrMsg msg={err}/>
        <Btn onClick={guardar} disabled={saving} style={{width:"100%",padding:"10px",fontSize:13,marginTop:11,borderRadius:11}}>{saving?"Guardando...":editing?"Guardar cambios":"Publicar"}</Btn>
      </div>
    </Modal>
  );
}

// ─── PERFIL PAGE — página completa del perfil de otro usuario (solo lectura) ──
function PerfilPage({autorEmail,session,onClose,onOpenDetail}){
  const [pubs,setPubs]=useState([]);const [reseñas,setReseñas]=useState([]);const [docs,setDocs]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  // Guard: autorEmail puede llegar vacío/null
  useEffect(()=>{
    if(!autorEmail){setError("Email de usuario no disponible.");setLoading(false);return;}
    setLoading(true);setError(null);
    Promise.all([
      sb.getPublicaciones({autor:autorEmail},session.access_token).catch(()=>[]),
      sb.getReseñasByAutor(autorEmail,session.access_token).catch(()=>[]),
      sb.getDocumentos(autorEmail,session.access_token).catch(()=>[])
    ]).then(([p,r,d])=>{setPubs((p||[]).filter(x=>x.activo!==false));setReseñas(r||[]);setDocs(d||[]);})
    .catch(e=>setError(e.message))
    .finally(()=>setLoading(false));
  },[autorEmail,session]);
  const nombre=autorEmail?(autorEmail.split("@")[0]):"Usuario";
  const savedColor=autorEmail?localStorage.getItem("avatarColor_"+autorEmail):null;
  const perfilColor=savedColor||avatarColor(nombre[0]);
  const avg=calcAvg(reseñas);
  const TIPO_ICON={titulo:"🎓",certificado:"📜",experiencia:"💼",otro:"📄"};
  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:400,overflowY:"auto",fontFamily:FONT}}>
      <div style={{position:"sticky",top:0,zIndex:10,background:C.sidebar,borderBottom:`1px solid ${C.border}`,padding:"12px 20px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onClose} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>← Volver</button>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:C.text,fontSize:15}}>{nombre}</div><div style={{fontSize:11,color:C.muted}}>Perfil del usuario</div></div>
      </div>
      <div style={{maxWidth:720,margin:"0 auto",padding:"24px 20px"}}>
        {error?<div style={{color:C.danger,textAlign:"center",padding:40,fontSize:14}}>{error}</div>:(
        <>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"24px",marginBottom:20}}>
          <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:16}}>
            <div style={{width:68,height:68,borderRadius:"50%",background:perfilColor,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:26,color:"#0D0D0D",fontFamily:FONT,flexShrink:0}}>{nombre[0].toUpperCase()}</div>
            <div style={{flex:1}}><h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:"0 0 3px"}}>{nombre}</h2><div style={{color:C.muted,fontSize:13,marginBottom:6}}>{autorEmail}</div><StarRating val={avg} count={reseñas.length}/></div>
          </div>
          <div style={{display:"flex",gap:9,flexWrap:"wrap"}}><Chip label="PUBLICACIONES" val={`${pubs.length}`}/><Chip label="RESEÑAS" val={`${reseñas.length}`}/>{avg&&<Chip label="PROMEDIO" val={`${avg.toFixed(1)} ★`}/>}</div>
        </div>
        {loading?<Spinner/>:<>
          {docs.length>0&&(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:20}}>
            <h3 style={{color:C.text,fontSize:15,fontWeight:700,margin:"0 0 14px"}}>Credenciales</h3>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {docs.map(d=>(<div key={d.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:20,flexShrink:0}}>{TIPO_ICON[d.tipo]||"📄"}</span>
                <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,color:C.text,fontSize:13}}>{d.titulo}</div>{d.institucion&&<div style={{color:C.muted,fontSize:12,marginTop:1}}>{d.institucion}</div>}{d.año&&<div style={{color:C.muted,fontSize:11,marginTop:1}}>{d.año}</div>}{d.descripcion&&<div style={{color:C.muted,fontSize:12,marginTop:4,lineHeight:1.4}}>{d.descripcion}</div>}</div>
              </div>))}
            </div>
          </div>)}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:20}}>
            <h3 style={{color:C.text,fontSize:15,fontWeight:700,margin:"0 0 14px"}}>Publicaciones activas ({pubs.length})</h3>
            {pubs.length===0?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"24px 0"}}>Sin publicaciones activas.</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {pubs.map(p=>(<div key={p.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 15px",cursor:"pointer"}} onClick={()=>{onClose();setTimeout(()=>onOpenDetail(p),80);}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}><Tag tipo={p.tipo}/>{p.verificado&&<VerifiedBadge/>}<span style={{marginLeft:"auto",fontSize:11,color:C.muted}}>{fmt(p.created_at)}</span></div>
                  <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:3}}>{p.titulo}</div>
                  <div style={{fontSize:12,color:C.muted}}>{p.materia}</div>
                </div>))}
              </div>
            )}
          </div>
          {reseñas.length>0&&(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px"}}>
            <h3 style={{color:C.text,fontSize:15,fontWeight:700,margin:"0 0 14px"}}>Reseñas recibidas ({reseñas.length})</h3>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {reseñas.map(r=>(<div key={r.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,padding:"10px 13px"}}>
                <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:4}}><Avatar letra={r.autor_nombre?.[0]||"?"} size={26}/><span style={{fontWeight:600,color:C.text,fontSize:12}}>{r.autor_nombre}</span><span style={{color:C.accent,fontSize:11}}>{"★".repeat(r.estrellas||0)}</span></div>
                <p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.5}}>{r.texto}</p>
              </div>))}
            </div>
          </div>)}
        </>}
        </>)}
      </div>
    </div>
  );
}

// ─── MI CUENTA PAGE — perfil + credenciales + gestión de publicaciones ─────────
function MiCuentaPage({session,onOpenDetail,onOpenCurso,onEdit,onNew,onOpenChat,onRefreshOfertas}){
  const [pubs,setPubs]=useState([]);const [reseñas,setReseñas]=useState([]);const [docs,setDocs]=useState([]);const [loading,setLoading]=useState(true);
  const [toggling,setToggling]=useState(null);const [ofertasMap,setOfertasMap]=useState({});const [ofertasModal,setOfertasModal]=useState(null);
  // Credenciales
  const [showAddDoc,setShowAddDoc]=useState(false);
  const [docTipo,setDocTipo]=useState("titulo");const [docTitulo,setDocTitulo]=useState("");const [docInst,setDocInst]=useState("");const [docAño,setDocAño]=useState("");const [docDesc,setDocDesc]=useState("");const [savingDoc,setSavingDoc]=useState(false);
  // Perfil edición
  const [editingPerfil,setEditingPerfil]=useState(false);const [displayName,setDisplayName]=useState(()=>{try{return localStorage.getItem("dn_"+session.user.email)||"";}catch{return "";}});const [savingDisplayName,setSavingDisplayName]=useState(false);
  const [avatarColor2,setAvatarColor2]=useState("");
  const email=session.user.email;const uid=session.user.id;const nombre=sb.getDisplayName(email)||email.split("@")[0];
  const AVATAR_COLORS=["#F5C842","#4ECB71","#E05C5C","#5CA8E0","#C85CE0","#E0955C","#5CE0C8","#E05CA8"];
  const savedColor=localStorage.getItem("avatarColor_"+email);
  const currentColor=avatarColor2||savedColor||avatarColor(nombre[0]);
  const [inscritosMap,setInscritosMap]=useState({});
  const cargar=useCallback(async()=>{
    setLoading(true);
    try{
      const [p,r,d,ofertasRaw]=await Promise.all([
        sb.getMisPublicaciones(email,session.access_token).catch(()=>[]),
        sb.getReseñasByAutor(email,session.access_token).catch(()=>[]),
        sb.getDocumentos(email,session.access_token).catch(()=>[]),
        sb.getOfertasRecibidas(email,session.access_token).catch(()=>[])
      ]);
      const pubs2=p||[];setPubs(pubs2);setReseñas(r||[]);setDocs(d||[]);
      const map={};(ofertasRaw||[]).forEach(o=>{map[o.busqueda_id]=(map[o.busqueda_id]||0)+1;});setOfertasMap(map);
      // Traer inscriptos para publicaciones oferta
      const ofertas2=pubs2.filter(pub=>pub.tipo==="oferta");
      const inscCounts=await Promise.all(ofertas2.map(pub=>sb.getInscripciones(pub.id,session.access_token).catch(()=>[])));
      const imap={};ofertas2.forEach((pub,i)=>{imap[pub.id]=inscCounts[i].length;});setInscritosMap(imap);
    }catch(e){console.error("cargar error",e);}finally{setLoading(false);}
  },[session,email]);
  useEffect(()=>{cargar();},[cargar]);
  const avg=calcAvg(reseñas);
  const toggle=async(post)=>{setToggling(post.id);try{await sb.updatePublicacion(post.id,{activo:post.activo===false},session.access_token);await cargar();}catch(e){alert("Error: "+e.message);}finally{setToggling(null);}};
  const remove=async(post)=>{await sb.deletePublicacion(post.id,session.access_token);cargar();};
  const addDoc=async()=>{
    if(!docTitulo.trim())return;setSavingDoc(true);
    try{
      await sb.insertDocumento({usuario_id:session.user.id,usuario_email:email,tipo:docTipo,titulo:docTitulo,institucion:docInst,año:docAño,descripcion:docDesc},session.access_token);
      setDocTitulo("");setDocInst("");setDocAño("");setDocDesc("");setShowAddDoc(false);await cargar();
    }catch(e){alert("Error: "+e.message);}finally{setSavingDoc(false);}
  };
  const removeDoc=async(id)=>{try{await sb.deleteDocumento(id,session.access_token);await cargar();}catch(e){alert(e.message);}};
  const saveColor=(c)=>{localStorage.setItem("avatarColor_"+email,c);setAvatarColor2(c);};
  const TIPOS_DOC=[{v:"titulo",l:"🎓 Título"},{v:"certificado",l:"📜 Certificado"},{v:"experiencia",l:"💼 Experiencia"},{v:"otro",l:"📄 Otro"}];
  const TIPO_ICON={titulo:"🎓",certificado:"📜",experiencia:"💼",otro:"📄"};
  const iS={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:9,fontFamily:FONT};
  const ofertas=pubs.filter(p=>p.tipo==="oferta");
  const busquedas=pubs.filter(p=>p.tipo==="busqueda");
  return(
    <div style={{fontFamily:FONT}}>
      {/* ── Header perfil ── */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"22px 24px",marginBottom:20}}>
        <div style={{display:"flex",gap:16,alignItems:"flex-start",marginBottom:16}}>
          <div style={{position:"relative"}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:currentColor,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:24,color:"#0D0D0D",fontFamily:FONT,flexShrink:0}}>{nombre[0].toUpperCase()}</div>
          </div>
          <div style={{flex:1}}>
            <h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:"0 0 3px"}}>{displayName||nombre}</h2>
            <div style={{color:C.muted,fontSize:13,marginBottom:6}}>{email}</div>
            {avg?<StarRating val={avg} count={reseñas.length}/>:<span style={{color:C.muted,fontSize:12,fontStyle:"italic"}}>Sin valoraciones aún</span>}
          </div>
          <button onClick={()=>setEditingPerfil(v=>!v)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>✏️ Editar</button>
        </div>
        {editingPerfil&&(
          <div style={{background:"#1a1a1a",border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:12}}>
            <Label>Nombre visible</Label>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder={nombre} style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT}}/>
              <button onClick={async()=>{
                const newName=displayName.trim()||email.split("@")[0];
                setSavingDisplayName(true);
                sb.setDisplayName(email,newName);
                // Actualizar autor_nombre en todas las publicaciones del usuario
                try{
                  const mispubs=await sb.getMisPublicaciones(email,session.access_token);
                  // autor_nombre se obtiene de la vista via JOIN con usuarios — no necesita actualización directa
                }catch{}
                setSavingDisplayName(false);
                alert("Nombre actualizado en tu perfil y publicaciones.");
              }} disabled={savingDisplayName} style={{background:C.accent,border:"none",borderRadius:9,color:"#0D0D0D",padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>{savingDisplayName?"Guardando...":"Guardar"}</button>
            </div>
            <Label>Color de avatar</Label>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              {AVATAR_COLORS.map(c=>(<button key={c} onClick={()=>saveColor(c)} style={{width:28,height:28,borderRadius:"50%",background:c,border:currentColor===c?`3px solid ${C.text}`:"3px solid transparent",cursor:"pointer",padding:0}}/>))}
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setEditingPerfil(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"7px 14px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>Cerrar</button>
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
          <Chip label="PUBLICACIONES" val={`${pubs.length}`}/>
          <Chip label="RESEÑAS" val={`${reseñas.length}`}/>
          {avg&&<Chip label="PROMEDIO" val={`${avg.toFixed(1)} ★`}/>}
          {pubs.filter(p=>p.finalizado).length>0&&<Chip label="FINALIZADOS" val={`${pubs.filter(p=>p.finalizado).length} ✅`}/>}
        </div>
        <div style={{marginTop:10,fontSize:11,color:C.muted,fontFamily:"monospace",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",wordBreak:"break-all",userSelect:"all"}}>ID: {uid}</div>
      </div>

      {/* ── Credenciales ── */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{color:C.text,fontSize:16,fontWeight:700,margin:0}}>Mis credenciales</h3>
          <button onClick={()=>setShowAddDoc(v=>!v)} style={{background:C.accentDim,border:`1px solid #F5C84244`,borderRadius:8,color:C.accent,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>+ Agregar</button>
        </div>
        {showAddDoc&&(
          <div style={{background:"#1a1a1a",border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:14}}>
            <Label>Tipo</Label>
            <div style={{display:"flex",gap:6,marginBottom:9,flexWrap:"wrap"}}>
              {TIPOS_DOC.map(({v,l})=>(<button key={v} onClick={()=>setDocTipo(v)} style={{padding:"6px 10px",borderRadius:8,fontSize:12,cursor:"pointer",background:docTipo===v?C.accent:C.surface,color:docTipo===v?"#0D0D0D":C.muted,border:`1px solid ${docTipo===v?"transparent":C.border}`,fontFamily:FONT,fontWeight:600}}>{l}</button>))}
            </div>
            <input value={docTitulo} onChange={e=>setDocTitulo(e.target.value)} placeholder="Título / nombre del documento *" style={iS}/>
            <input value={docInst} onChange={e=>setDocInst(e.target.value)} placeholder="Institución (opcional)" style={iS}/>
            <input value={docAño} onChange={e=>setDocAño(e.target.value)} placeholder="Año (opcional)" style={iS}/>
            <div style={{position:"relative",marginBottom:9}}>
              <textarea value={docDesc} onChange={e=>setDocDesc(e.target.value.slice(0,300))} placeholder="Descripción adicional (opcional)" style={{...iS,minHeight:55,resize:"vertical",marginBottom:0,paddingBottom:20}}/>
              <span style={{position:"absolute",bottom:6,right:11,fontSize:10,color:docDesc.length>=300?C.danger:C.muted,fontFamily:FONT,pointerEvents:"none"}}>{docDesc.length}/300</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={addDoc} disabled={savingDoc||!docTitulo.trim()} style={{padding:"7px 16px",fontSize:12}}>{savingDoc?"Guardando...":"Guardar"}</Btn>
              <button onClick={()=>setShowAddDoc(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"7px 14px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>Cancelar</button>
            </div>
          </div>
        )}
        {loading?<Spinner/>:docs.length===0?(
          <div style={{textAlign:"center",padding:"24px 0",color:C.muted,fontSize:13}}>Agregá títulos y credenciales para que los estudiantes puedan verlos en tu perfil.</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {docs.map(d=>(<div key={d.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:20,flexShrink:0}}>{TIPO_ICON[d.tipo]||"📄"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,color:C.text,fontSize:13}}>{d.titulo}</div>
                {d.institucion&&<div style={{color:C.muted,fontSize:12,marginTop:1}}>{d.institucion}</div>}
                {d.año&&<div style={{color:C.muted,fontSize:11,marginTop:1}}>📅 {d.año}</div>}
                {d.descripcion&&<div style={{color:C.muted,fontSize:12,marginTop:4,lineHeight:1.4}}>{d.descripcion}</div>}
              </div>
              <button onClick={()=>removeDoc(d.id)} style={{background:"none",border:"none",color:C.danger,fontSize:15,cursor:"pointer",flexShrink:0,padding:"0 3px"}}>×</button>
            </div>))}
          </div>
        )}
      </div>

      {/* ── Clases Ofrecidas ── */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{color:C.text,fontSize:16,fontWeight:700,margin:0}}>Clases Ofrecidas <span style={{color:C.muted,fontWeight:400,fontSize:13}}>({ofertas.length})</span></h3>
          <Btn onClick={onNew} style={{padding:"6px 12px",fontSize:12}}>+ Nueva</Btn>
        </div>
        {loading?<Spinner/>:ofertas.length===0?(
          <div style={{textAlign:"center",padding:"24px 0",color:C.muted,fontSize:13}}>No publicaste ninguna oferta aún.<br/><button onClick={onNew} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:13,fontFamily:FONT,marginTop:8}}>+ Crear oferta →</button></div>
        ):(
          <>
            {(()=>{
              const activas=ofertas.filter(p=>!p.finalizado);
              const finalizadas=ofertas.filter(p=>!!p.finalizado);
              const particulares=activas.filter(p=>p.modo==="particular");
              const cursos=activas.filter(p=>p.modo==="curso");
              return(<>
                {particulares.length>0&&(
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Clases particulares</div>
                    <div style={{display:"grid",gap:10}}>
                      {particulares.map(p=>(<div key={p.id}><MyPostCard post={p} session={session} onEdit={onEdit} onToggle={toggle} onDelete={remove} onOpenCurso={onOpenCurso} toggling={toggling} ofertasPendientes={0} inscriptos={inscritosMap[p.id]}/></div>))}
                    </div>
                  </div>
                )}
                {cursos.length>0&&(
                  <div style={{marginBottom:finalizadas.length>0?20:0}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Cursos activos</div>
                    <div style={{display:"grid",gap:10}}>
                      {cursos.map(p=>(<div key={p.id}><MyPostCard post={p} session={session} onEdit={onEdit} onToggle={toggle} onDelete={remove} onOpenCurso={onOpenCurso} toggling={toggling} ofertasPendientes={0} inscriptos={inscritosMap[p.id]}/></div>))}
                    </div>
                  </div>
                )}
                {finalizadas.length>0&&(
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1,textTransform:"uppercase"}}>✅ Finalizados</div>
                      <span style={{fontSize:10,background:"#4ECB7115",color:C.success,border:"1px solid #4ECB7133",borderRadius:20,padding:"1px 7px",fontWeight:700}}>{finalizadas.length}</span>
                    </div>
                    <div style={{display:"grid",gap:10}}>
                      {finalizadas.map(p=>(<div key={p.id}><MyPostCard post={p} session={session} onEdit={onEdit} onToggle={toggle} onDelete={remove} onOpenCurso={onOpenCurso} toggling={toggling} ofertasPendientes={0} inscriptos={inscritosMap[p.id]}/></div>))}
                    </div>
                  </div>
                )}
              </>);
            })()}
          </>
        )}
      </div>

      {/* ── Búsquedas ── */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{color:C.text,fontSize:16,fontWeight:700,margin:0}}>Búsquedas <span style={{color:C.muted,fontWeight:400,fontSize:13}}>({busquedas.length})</span></h3>
          <Btn onClick={onNew} style={{padding:"6px 12px",fontSize:12}}>+ Nueva</Btn>
        </div>
        {loading?<Spinner/>:busquedas.length===0?(
          <div style={{textAlign:"center",padding:"24px 0",color:C.muted,fontSize:13}}>No publicaste ninguna búsqueda aún.</div>
        ):(
          <div style={{display:"grid",gap:12}}>
            {busquedas.map(p=>{
              const cnt=ofertasMap[p.id]||0;
              return(<div key={p.id} style={{background:C.surface,border:`1px solid ${cnt>0?C.accent:C.border}`,borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,width:"100%",height:3,background:p.activo!==false?C.accent:C.muted}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    {cnt>0&&<div style={{display:"inline-flex",alignItems:"center",gap:5,background:C.accentDim,border:`1px solid #F5C84244`,borderRadius:20,padding:"3px 10px",marginBottom:8,fontSize:11,color:C.accent,fontWeight:700}}>🔔 {cnt} oferta{cnt!==1?"s":""} nueva{cnt!==1?"s":""}</div>}
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}><Tag tipo={p.tipo}/><StatusBadge activo={p.activo!==false} finalizado={!!p.finalizado}/></div>
                    <h3 style={{color:C.text,fontSize:13,fontWeight:700,margin:"0 0 3px"}}>{p.titulo}</h3>
                    <p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.4}}>{p.descripcion?.slice(0,90)}</p>
                    {p.created_at&&<div style={{marginTop:4,fontSize:11,color:C.muted}}>Publicado {fmt(p.created_at)}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0,minWidth:95}}>
                    {cnt>0&&<button onClick={()=>setOfertasModal(p)} style={{background:C.accentDim,border:`1px solid #F5C84244`,borderRadius:8,color:C.accent,padding:"5px 8px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:FONT}}>Ver ofertas</button>}
                    <button onClick={()=>onEdit(p)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"5px 8px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:FONT}}>Editar</button>
                    <button onClick={()=>toggle(p)} disabled={toggling===p.id} style={{background:p.activo!==false?"#E0955C15":"#4ECB7115",border:`1px solid ${p.activo!==false?"#E0955C33":"#4ECB7133"}`,borderRadius:8,color:p.activo!==false?C.warn:C.success,padding:"5px 8px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:FONT,opacity:toggling===p.id?.5:1}}>{toggling===p.id?"...":(p.activo!==false?"Pausar":"Activar")}</button>
                    <button onClick={()=>remove(p)} style={{background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:8,color:C.danger,padding:"5px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>Eliminar</button>
                  </div>
                </div>
              </div>);
            })}
          </div>
        )}
      </div>

      {/* ── Reseñas recibidas ── */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px"}}>
        <h3 style={{color:C.text,fontSize:16,fontWeight:700,margin:"0 0 14px"}}>Reseñas recibidas ({reseñas.length})</h3>
        {loading?<Spinner/>:reseñas.length===0?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Todavía no recibiste reseñas.</div>:(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {reseñas.map(r=>(<div key={r.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,padding:"10px 13px"}}>
              <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:4}}><Avatar letra={r.autor_nombre?.[0]||"?"} size={26}/><span style={{fontWeight:600,color:C.text,fontSize:12}}>{r.autor_nombre}</span><span style={{color:C.accent,fontSize:11}}>{"★".repeat(r.estrellas||0)}</span></div>
              <p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.5}}>{r.texto}</p>
            </div>))}
          </div>
        )}
      </div>

      {ofertasModal&&<OfertasRecibidasModal post={ofertasModal} session={session} onClose={()=>{setOfertasModal(null);cargar();if(onRefreshOfertas)onRefreshOfertas();}} onContactar={onOpenChat}/>}
    </div>
  );
}

// ─── CHATBOT WIDGET — flotante abajo a la derecha ──────────────────────────────
function ChatBotWidget(){
  const [open,setOpen]=useState(false);const [msgs,setMsgs]=useState([{from:"bot",text:"¡Hola! 👋 Soy el asistente de ClasseLink. ¿En qué puedo ayudarte?"}]);
  const [input,setInput]=useState("");const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{if(open)endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,open]);
  const FAQS=[
    {q:"¿Cómo me inscribo a un curso?",a:"Abrí la publicación del curso y hacé clic en '📚 Ver curso'. Dentro de la página del curso encontrás el botón 'Inscribirme gratis'. Con eso tendrás acceso a todo el contenido al instante.",tags:["inscrib","curso","acceso","unirme","anotarme"]},
    {q:"¿Cómo publico una clase o curso?",a:"Hacé clic en '+ Nueva publicación' en el menú lateral o en el botón '+ Publicar' arriba. Elegí si ofrecés clases (docente) o buscás clases (alumno), completá los datos y publicá.",tags:["public","ofrec","creo","nueva","anunci"]},
    {q:"¿Cómo verifico mi perfil?",a:"Al crear una publicación de oferta, el sistema te hace una pregunta sobre tu materia con IA. Si respondés correctamente, obtenés la insignia ✓ Verificado que da más confianza a los alumnos.",tags:["verific","insignia","confianza","validar"]},
    {q:"¿Cómo contacto a un docente?",a:"Para chatear con un docente necesitás estar inscripto en su clase. Una vez inscripto, aparece el botón '💬 Iniciar conversación' en la publicación.",tags:["contact","chat","mensaje","hablar","escribir","docente"]},
    {q:"¿Cómo finalizo una clase?",a:"Entrá a tu publicación desde Mi cuenta → Contenido → botón 'Finalizar clase' (verde) en la barra de arriba. Esto notifica a todos los inscriptos para que puedan valorarte.",tags:["finaliz","terminar","cerrar","complet"]},
    {q:"¿Cómo dejo una reseña?",a:"Las reseñas se habilitan cuando el docente finaliza las clases. Entrá al curso y en la parte inferior verás la sección para calificar con estrellas y escribir tu opinión.",tags:["reseña","opinión","valorar","calific","estrellas","puntaje"]},
    {q:"¿Cómo funciona el sistema de ofertas?",a:"Publicá una búsqueda explicando qué necesitás aprender. Los docentes interesados te envían ofertas con su precio y mensaje. Desde Mi cuenta podés aceptar o rechazar cada una.",tags:["oferta","busqueda","busco","propuest","sistem","recib"]},
    {q:"¿Cómo veo el perfil de un docente?",a:"Hacé clic en el nombre o avatar del docente en cualquier publicación o card. Verás su perfil completo con credenciales, historial de publicaciones y reseñas recibidas.",tags:["perfil","docente","ver","quien","credencial","historial"]},
    {q:"¿Puedo chatear sin estar inscripto?",a:"No, el chat individual está disponible solo si estás inscripto en la clase del docente, o si el docente aceptó tu oferta de búsqueda. También hay un chat grupal dentro de cada curso para inscriptos.",tags:["chatear","sin inscrib","acceso chat","hablar sin"]},
    {q:"¿Cómo agrego favoritos?",a:"En cada publicación de la lista hay un botón ★. Hacé clic para guardar. Podés ver todos tus favoritos en la sección 'Favoritos' del menú lateral.",tags:["favorit","guardar","★","star","lista"]},
    {q:"¿Cómo cambio mi nombre visible?",a:"Andá a Mi cuenta → 'Editar perfil' → campo 'Nombre visible'. Ese nombre se mostrará en chats, reseñas y publicaciones.",tags:["nombre","display","cambiar","editar perfil","apodo"]},
    {q:"¿Cómo funciona el chat grupal?",a:"Cada curso tiene un chat grupal visible para todos los inscriptos y el docente. Aparece dentro de la página del curso, abajo del contenido. El docente puede designar ayudantes que también tienen acceso especial.",tags:["grupal","grupo","chat curso","todos","ayudante"]},
    {q:"¿Cómo cierro las inscripciones?",a:"Desde la página de tu curso (Mi cuenta → Contenido), usá el botón naranja 'Cerrar inscripciones' en la barra superior. Los alumnos ya inscriptos mantienen su acceso.",tags:["cerrar inscripciones","cupo","no más inscrib"]},
    {q:"¿Cómo agrego a un ayudante?",a:"Dentro de la página del curso, en el panel 'Alumnos', hay una sección 'Ayudantes'. Ingresá el ID del usuario (lo encuentra en su Mi cuenta → Editar perfil) y agregalo. Tendrá acceso de edición y color especial en el chat.",tags:["ayudante","asistente","colaborad","agregar ayud"]},
    {q:"¿Hay costo por usar ClasseLink?",a:"ClasseLink es gratuito para alumnos y docentes. El precio lo fija cada docente en su publicación y lo arreglan directamente.",tags:["costo","gratis","precio","pago","cobro","cuánto"]},
  ];
  // Matching mejorado: busca por tags y keywords
  const matchFaq=(q)=>{
    const ql=q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
    // Buscar por tags primero
    let best=null;let bestScore=0;
    for(const f of FAQS){
      let score=0;
      for(const tag of (f.tags||[])){
        if(ql.includes(tag.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")))score+=2;
      }
      // Buscar palabras de la pregunta
      const words=f.q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").split(" ").filter(w=>w.length>3);
      for(const w of words){if(ql.includes(w))score+=1;}
      if(score>bestScore){bestScore=score;best=f;}
    }
    return bestScore>=2?best:null;
  };
  const send=async()=>{
    if(!input.trim())return;
    const q=input.trim();setInput("");
    setMsgs(prev=>[...prev,{from:"user",text:q}]);
    setLoading(true);
    // Check FAQs first
    const faq=matchFaq(q);
    if(faq){setTimeout(()=>{setMsgs(prev=>[...prev,{from:"bot",text:faq.a}]);setLoading(false);},600);return;}
    // Use AI
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,system:"Sos el asistente de soporte de ClasseLink, una plataforma educativa para conectar profesores y estudiantes. Respondé en español, de forma breve y amable. Si no podés resolver el problema, sugerí contactar al soporte humano.",messages:[{role:"user",content:q}]})});
      const data=await res.json();
      const text=data.content?.map(c=>c.text||"").join("")||"No pude procesar tu consulta.";
      setMsgs(prev=>[...prev,{from:"bot",text:text},{from:"bot",text:"¿Pudo resolver tu problema? Si necesitás hablar con una persona, tocá 👇",action:true}]);
    }catch{
      setMsgs(prev=>[...prev,{from:"bot",text:"Lo siento, no pude procesar tu consulta.",},{from:"bot",text:"¿Querés hablar con un representante?",action:true}]);
    }finally{setLoading(false);}
  };
  const openWhatsApp=()=>window.open("https://wa.me/5492345459787?text=Hola,%20necesito%20ayuda%20con%20ClasseLink","_blank");
  return(
    <div style={{position:"fixed",bottom:22,right:22,zIndex:500,fontFamily:FONT}}>
      {open&&(
        <div style={{position:"absolute",bottom:64,right:0,width:"min(340px,92vw)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,boxShadow:"0 8px 32px #0008",display:"flex",flexDirection:"column",maxHeight:460,overflow:"hidden"}}>
          {/* Header */}
          <div style={{background:C.accent,borderRadius:"20px 20px 0 0",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <span style={{fontSize:20}}>🎓</span>
              <div><div style={{fontWeight:700,color:"#0D0D0D",fontSize:13}}>Soporte ClasseLink</div><div style={{fontSize:11,color:"#0D0D0D99"}}>Responde al instante</div></div>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"#0D0D0D",fontSize:18,cursor:"pointer"}}>×</button>
          </div>
          {/* Quick FAQ buttons */}
          <div style={{padding:"10px 12px 0",display:"flex",gap:5,flexWrap:"wrap",borderBottom:`1px solid ${C.border}`}}>
            {FAQS.slice(0,4).map((f,i)=>(<button key={i} onClick={()=>{setInput(f.q);}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"4px 9px",fontSize:10,cursor:"pointer",fontFamily:FONT,marginBottom:8}}>{f.q}</button>))}
          </div>
          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:9}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start"}}>
                {m.action?(
                  <div style={{display:"flex",flexDirection:"column",gap:7,alignItems:"flex-start"}}>
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px 16px 16px 4px",padding:"9px 13px",maxWidth:220,fontSize:12,color:C.text,lineHeight:1.5}}>{m.text}</div>
                    <button onClick={openWhatsApp} style={{background:"#25D366",border:"none",borderRadius:20,color:"#fff",padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:7}}>
                      <span style={{fontSize:16}}>💬</span> Hablar con representante
                    </button>
                  </div>
                ):(
                  <div style={{background:m.from==="user"?C.accent:C.card,color:m.from==="user"?"#0D0D0D":C.text,borderRadius:m.from==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"9px 13px",maxWidth:220,fontSize:12,lineHeight:1.5,border:`1px solid ${m.from==="user"?"transparent":C.border}`}}>{m.text}</div>
                )}
              </div>
            ))}
            {loading&&<div style={{display:"flex",gap:4,padding:"9px 13px",background:C.card,borderRadius:"16px 16px 16px 4px",width:50,border:`1px solid ${C.border}`}}>{[0,1,2].map(i=>(<div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.muted,animation:`bounce .8s ${i*.2}s infinite`}}/>))}</div>}
            <div ref={endRef}/>
          </div>
          {/* Input */}
          <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Escribí tu pregunta..." style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"8px 13px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT}}/>
            <button onClick={send} disabled={!input.trim()||loading} style={{background:C.accent,border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:15,flexShrink:0,opacity:!input.trim()?0.5:1}}>↑</button>
          </div>
        </div>
      )}
      {/* FAB button */}
      <button onClick={()=>setOpen(v=>!v)} style={{width:52,height:52,borderRadius:"50%",background:open?C.border:C.accent,border:"none",cursor:"pointer",fontSize:22,boxShadow:"0 4px 16px #0006",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {open?"×":"💬"}
      </button>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [session,setSession]=useState(()=>sb.loadSession());
  const [chatPost,setChatPost]=useState(null);const [detailPost,setDetailPost]=useState(null);const [cursoPost,setCursoPost]=useState(null);const [perfilEmail,setPerfilEmail]=useState(null);
  const [page,setPageRaw]=useState(()=>{try{return sessionStorage.getItem("cl_page")||"explore";}catch{return "explore";}});
  const setPage=(p)=>{try{sessionStorage.setItem("cl_page",p);}catch{}setPageRaw(p);};
  const [showForm,setShowForm]=useState(false);const [editPost,setEditPost]=useState(null);const [myPostsKey,setMyPostsKey]=useState(0);
  const [unread,setUnread]=useState(0);const [ofertasCount,setOfertasCount]=useState(0);const [notifCount,setNotifCount]=useState(0);const [notifs,setNotifs]=useState([]);const [showNotifs,setShowNotifs]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(false);const [isMobile,setIsMobile]=useState(window.innerWidth<768);
  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<768);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  const sessionRef=useRef(session);useEffect(()=>{sessionRef.current=session;},[session]);
  useEffect(()=>{sb.setSessionRefreshCallback(async()=>{const c=sessionRef.current;if(!c?.refresh_token)return null;try{const s=await sb.refreshSession(c.refresh_token);sb.saveSession(s);setSession(s);return s;}catch{sb.clearSession();setSession(null);return null;}});},[]);
  const chatPostRef=useRef(null);
  const refreshUnread=useCallback(()=>{
    if(!session)return;
    Promise.all([
      sb.getMisChats(session.user.email,session.access_token),
      sb.getOfertasRecibidas(session.user.email,session.access_token),
      sb.getNotificaciones(session.user.email,session.access_token).catch(()=>[])
    ]).then(([msgs,ofertas,nfs])=>{
      const openId=chatPostRef.current?.id;
      const openOtro=chatPostRef.current?.autor_email;
      setUnread(msgs.filter(m=>m.de_nombre!==session.user.email&&!m.leido&&m.para_nombre!=="__grupo__"&&!(m.publicacion_id===openId&&(m.de_nombre===openOtro||m.para_nombre===openOtro))).length);
      setOfertasCount(ofertas.length);
      setNotifCount(nfs.length);setNotifs(nfs);
    }).catch(()=>{});
  },[session]);
  useEffect(()=>{refreshUnread();const t=setInterval(refreshUnread,15000);return()=>clearInterval(t);},[refreshUnread]);
  const logout=()=>{sb.clearSession();setSession(null);};
  const openChat=(p)=>{chatPostRef.current=p;setChatPost(p);};
  const closeChat=()=>{chatPostRef.current=null;setChatPost(null);refreshUnread();};
  if(!session)return(<><style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}html,body,#root{background:${C.bg};min-height:100vh;font-family:${FONT}}`}</style><AuthScreen onLogin={s=>{sb.saveSession(s);setSession(s);}}/></>);
  const SW=isMobile?0:224;
  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:FONT,color:C.text,display:"flex"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}html,body,#root{background:${C.bg};min-height:100vh;font-family:${FONT}}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}`}</style>
      <Sidebar page={page} setPage={setPage} session={session} onLogout={logout} onNewPost={()=>{setEditPost(null);setShowForm(true);}} unreadCount={unread} ofertasCount={ofertasCount} notifCount={notifCount} mobile={isMobile} open={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>
      {isMobile&&(<div style={{position:"fixed",top:0,left:0,right:0,height:50,background:C.sidebar,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 13px",zIndex:50}}><button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",color:C.text,fontSize:21,cursor:"pointer"}}>☰</button><span style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,color:C.text}}>Classe<span style={{color:C.accent}}>Link</span></span><Btn onClick={()=>{setEditPost(null);setShowForm(true);}} style={{padding:"5px 9px",fontSize:11}}>+ Publicar</Btn></div>)}
      <main style={{marginLeft:SW,flex:1,padding:isMobile?"66px 13px 22px":"30px 28px",minHeight:"100vh",maxWidth:`calc(100vw - ${SW}px)`}}>
        <div style={{maxWidth:820,margin:"0 auto"}}>
          {page==="explore"&&<ExplorePage session={session} onOpenChat={openChat} onOpenDetail={setDetailPost} onOpenPerfil={setPerfilEmail}/>}
          {page==="chats"&&<ChatsPage session={session} onOpenChat={openChat}/>}
          {page==="favoritos"&&<FavoritosPage session={session} onOpenDetail={setDetailPost} onOpenChat={openChat} onOpenPerfil={setPerfilEmail}/>}
          {page==="inscripciones"&&<InscripcionesPage session={session} onOpenCurso={setCursoPost} onOpenChat={openChat} onMarkNotifsRead={()=>{sb.marcarTodasNotifsLeidas(session.user.email,session.access_token).then(refreshUnread).catch(()=>{});}}/>}
          {page==="cuenta"&&<MiCuentaPage key={myPostsKey} session={session} onOpenDetail={setDetailPost} onOpenCurso={setCursoPost} onEdit={p=>{setEditPost(p);setShowForm(true);}} onNew={()=>{setEditPost(null);setShowForm(true);}} onOpenChat={openChat} onRefreshOfertas={refreshUnread}/>}
        </div>
      </main>
      {chatPost&&<ChatModal post={chatPost} session={session} onClose={closeChat} onUnreadChange={refreshUnread}/>}
      {detailPost&&<DetailModal post={detailPost} session={session} onClose={()=>setDetailPost(null)} onChat={p=>{setDetailPost(null);openChat(p);}} onOpenCurso={p=>{setDetailPost(null);setCursoPost(p);}} onOpenPerfil={setPerfilEmail}/>}
      {cursoPost&&<CursoPage post={cursoPost} session={session} onClose={()=>setCursoPost(null)} onUpdatePost={p=>setCursoPost(p)}/>}
      {perfilEmail&&<PerfilPage autorEmail={perfilEmail} session={session} onClose={()=>setPerfilEmail(null)} onOpenDetail={(p)=>{setPerfilEmail(null);setTimeout(()=>setDetailPost(p),80);}}/>}
      {showForm&&<PostFormModal session={session} postToEdit={editPost} onClose={()=>{setShowForm(false);setEditPost(null);}} onSave={()=>setMyPostsKey(k=>k+1)}/>}
      <ChatBotWidget/>
    </div>
  );
}
