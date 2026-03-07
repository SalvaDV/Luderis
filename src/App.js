import { useState, useEffect, useCallback, useRef } from "react";
import * as sb from "./supabase";

const C = {
  bg:"#0D0D0D", surface:"#111", card:"#181818", border:"#242424",
  accent:"#F5C842", accentDim:"#F5C84215", text:"#F0EDE6", muted:"#666",
  success:"#4ECB71", danger:"#E05C5C", sidebar:"#0A0A0A",
};
const FONT = "'Open Sans', sans-serif";
const MATERIAS = ["Matemáticas","Física","Química","Inglés","Programación","Historia","Biología","Literatura","Economía","Arte"];
const avatarColor = (l) => ["#F5C842","#4ECB71","#E05C5C","#5CA8E0","#C85CE0"][(l||"?").toUpperCase().charCodeAt(0)%5];
const fmt = (d) => d ? new Date(d).toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"}) : "";
const fmtPrice = (p) => p ? `$${Number(p).toLocaleString("es-AR")}` : "A convenir";
const DIAS_SEMANA = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
const Spinner = ({small}) => (
  <div style={{display:"flex",justifyContent:"center",padding:small?"8px":"40px 0"}}>
    <div style={{width:small?18:28,height:small?18:28,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
  </div>
);
const Avatar = ({letra,size=38}) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:avatarColor(letra),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*.4,color:"#0D0D0D",flexShrink:0,fontFamily:FONT}}>
    {(letra||"?")[0].toUpperCase()}
  </div>
);
const Tag = ({tipo}) => (
  <span style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",padding:"3px 10px",borderRadius:20,background:tipo==="oferta"?"#4ECB7122":"#F5C84222",color:tipo==="oferta"?C.success:C.accent,border:`1px solid ${tipo==="oferta"?"#4ECB7144":"#F5C84244"}`,fontFamily:FONT}}>
    {tipo==="oferta"?"📚 Oferta":"🔍 Búsqueda"}
  </span>
);
const StatusBadge = ({activo}) => (
  <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:activo?"#4ECB7115":"#E05C5C15",color:activo?C.success:C.danger,border:`1px solid ${activo?"#4ECB7133":"#E05C5C33"}`,fontFamily:FONT}}>
    {activo?"● Activa":"○ Pausada"}
  </span>
);
const VerifiedBadge = () => (
  <span title="Conocimiento verificado" style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:"#5CA8E022",color:"#5CA8E0",border:"1px solid #5CA8E044",fontFamily:FONT}}>✓ Verificado</span>
);
const ValoracionDisplay = ({reseñas}) => {
  if(!reseñas||reseñas.length===0) return <span style={{color:C.muted,fontSize:12,fontStyle:"italic"}}>Sin valoraciones aún</span>;
  const avg = reseñas.reduce((a,r)=>a+(r.estrellas||0),0)/reseñas.length;
  return <span style={{color:C.accent,fontSize:13}}>{"★".repeat(Math.round(avg))}{"☆".repeat(5-Math.round(avg))}<span style={{color:C.muted,marginLeft:4,fontSize:12}}>{avg.toFixed(1)} ({reseñas.length} reseña{reseñas.length!==1?"s":""})</span></span>;
};
const Input = ({style={}, ...props}) => (
  <input style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:FONT,...style}} {...props}/>
);
const Btn = ({children,variant="primary",style={}, ...props}) => (
  <button style={{background:variant==="primary"?C.accent:variant==="danger"?C.danger:"transparent",color:variant==="primary"?"#0D0D0D":C.text,border:variant==="ghost"?`1px solid ${C.border}`:"none",borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,...style}} {...props}>{children}</button>
);
const ErrMsg = ({msg}) => msg ? <div style={{color:C.danger,fontSize:13,margin:"6px 0",fontFamily:FONT}}>{msg}</div> : null;
const Label = ({children}) => <div style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>{children}</div>;

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
const Modal = ({children,onClose,width="min(520px,95vw)"}) => (
  <div style={{position:"fixed",inset:0,background:"#000b",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:FONT}}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,width,maxHeight:"92vh",overflowY:"auto"}}>
      {children}
    </div>
  </div>
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthScreen({onLogin}) {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [pass2,setPass2]=useState("");
  const [loading,setLoading]=useState(false); const [err,setErr]=useState(""); const [ok,setOk]=useState("");
  const handle = async () => {
    setErr(""); setOk("");
    if(!email){setErr("Ingresá tu email");return;}
    if(mode!=="forgot"&&!pass){setErr("Ingresá tu contraseña");return;}
    if(mode==="register"&&pass!==pass2){setErr("Las contraseñas no coinciden");return;}
    setLoading(true);
    try {
      if(mode==="forgot"){await sb.resetPassword(email);setOk("Te enviamos un email para restablecer tu contraseña.");}
      else if(mode==="register"){const r=await sb.signUp(email,pass);if(r.access_token){sb.saveSession(r);onLogin(r);}else setOk("Revisá tu email para confirmar la cuenta.");}
      else{const r=await sb.signIn(email,pass);sb.saveSession(r);onLogin(r);}
    }catch(e){setErr(e.message||"Error");}
    finally{setLoading(false);}
  };
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:FONT}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:24,padding:"40px 36px",width:"min(420px,90vw)",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🎓</div>
        <h2 style={{fontFamily:"Georgia,serif",color:C.text,fontSize:28,margin:"0 0 4px"}}>ClasseLink</h2>
        <p style={{color:C.muted,marginBottom:28,fontSize:14}}>Conectá con profesores y estudiantes</p>
        <div style={{display:"flex",gap:4,marginBottom:24,background:C.card,borderRadius:12,padding:4}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");setOk("");}} style={{flex:1,padding:"9px",borderRadius:9,border:"none",fontWeight:600,fontSize:13,cursor:"pointer",background:mode===m?C.accent:"transparent",color:mode===m?"#0D0D0D":C.muted,fontFamily:FONT}}>
              {m==="login"?"Iniciar sesión":"Registrarse"}
            </button>
          ))}
        </div>
        {mode==="forgot"?(
          <>
            <Input type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={{marginBottom:10}}/>
            <ErrMsg msg={err}/>{ok&&<div style={{color:C.success,fontSize:13,marginBottom:10}}>{ok}</div>}
            <Btn onClick={handle} disabled={loading} style={{width:"100%",marginBottom:12}}>{loading?"Enviando...":"Enviar link"}</Btn>
            <button onClick={()=>{setMode("login");setErr("");setOk("");}} style={{background:"none",border:"none",color:C.muted,fontSize:13,cursor:"pointer",fontFamily:FONT}}>← Volver</button>
          </>
        ):(
          <>
            <Input type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={{marginBottom:10}} onKeyDown={e=>e.key==="Enter"&&handle()}/>
            <Input type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)} style={{marginBottom:10}} onKeyDown={e=>e.key==="Enter"&&handle()}/>
            {mode==="register"&&<Input type="password" placeholder="Repetir contraseña" value={pass2} onChange={e=>setPass2(e.target.value)} style={{marginBottom:10}}/>}
            <ErrMsg msg={err}/>{ok&&<div style={{color:C.success,fontSize:13,marginBottom:10}}>{ok}</div>}
            <Btn onClick={handle} disabled={loading} style={{width:"100%",padding:"13px",fontSize:15,marginBottom:14,borderRadius:12}}>{loading?"...":mode==="login"?"Entrar →":"Crear cuenta →"}</Btn>
            {mode==="login"&&<button onClick={()=>{setMode("forgot");setErr("");setOk("");}} style={{background:"none",border:"none",color:C.muted,fontSize:13,cursor:"pointer",fontFamily:FONT}}>¿Olvidaste tu contraseña?</button>}
          </>
        )}
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({page,setPage,session,onLogout,onNewPost,unreadCount,mobile,open,onClose}) {
  const nombre = session.user.email.split("@")[0];
  const nav = [{id:"explore",icon:"⊞",label:"Explorar"},{id:"chats",icon:"💬",label:"Mis chats",badge:unreadCount},{id:"myposts",icon:"◧",label:"Mis publicaciones"}];
  const inner = (
    <div style={{width:220,height:"100%",background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",fontFamily:FONT}}>
      <div style={{padding:"20px 18px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🎓</span>
          <span style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:C.text}}>Classe<span style={{color:C.accent}}>Link</span></span>
        </div>
        {mobile&&<button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>×</button>}
      </div>
      <nav style={{padding:"12px 10px",flex:1}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:C.muted,padding:"0 8px",marginBottom:8}}>MENÚ</div>
        {nav.map(item=>(
          <button key={item.id} onClick={()=>{setPage(item.id);if(mobile)onClose();}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",background:page===item.id?C.accentDim:"transparent",color:page===item.id?C.accent:C.muted,fontWeight:page===item.id?600:400,fontSize:14,cursor:"pointer",marginBottom:2,fontFamily:FONT,textAlign:"left"}}>
            <span style={{fontSize:15}}>{item.icon}</span>{item.label}
            {item.badge>0&&<span style={{marginLeft:"auto",background:C.danger,color:"#fff",borderRadius:20,fontSize:11,fontWeight:700,padding:"1px 7px"}}>{item.badge}</span>}
          </button>
        ))}
        <div style={{margin:"14px 0 10px",height:1,background:C.border}}/>
        <Btn onClick={()=>{onNewPost();if(mobile)onClose();}} style={{width:"100%",padding:"10px 12px",fontSize:13,borderRadius:10,display:"flex",alignItems:"center",gap:8}}>
          <span>+</span> Nueva publicación
        </Btn>
      </nav>
      <div style={{padding:"12px 10px",borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",marginBottom:6}}>
          <Avatar letra={nombre[0]} size={30}/>
          <div style={{overflow:"hidden"}}>
            <div style={{color:C.text,fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{nombre}</div>
            <div style={{color:C.muted,fontSize:11,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{session.user.email}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{width:"100%",background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,padding:"8px 12px",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:8,fontFamily:FONT}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.danger;e.currentTarget.style.color=C.danger;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
          ↩ Cerrar sesión
        </button>
      </div>
    </div>
  );
  if(mobile) return (
    <>{open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"#000a",zIndex:89}}/>}
    <div style={{position:"fixed",left:0,top:0,height:"100vh",zIndex:90,transform:open?"translateX(0)":"translateX(-100%)",transition:"transform .25s ease"}}>{inner}</div></>
  );
  return <div style={{position:"fixed",left:0,top:0,height:"100vh",zIndex:40}}>{inner}</div>;
}

// ─── POST CARD ────────────────────────────────────────────────────────────────
function PostCard({post,miEmail,onOpenChat,onOpenDetail}) {
  const nombre = post.autor_nombre||post.autor_email?.split("@")[0]||"Usuario";
  const esMio = post.autor_email===miEmail;
  const modoLabel = post.modo==="curso"?"📦 Curso":"👤 Clase particular";
  const sincLabel = post.sinc==="sinc"?"🔴 Sincrónico":"📹 Asincrónico";
  return (
    <div onClick={()=>onOpenDetail(post)}
      style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",cursor:"pointer",transition:"border-color .2s,transform .15s",position:"relative",overflow:"hidden",fontFamily:FONT}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";}}>
      <div style={{position:"absolute",top:0,left:0,width:"100%",height:3,background:post.tipo==="oferta"?C.success:C.accent}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:8}}>
        <div style={{display:"flex",gap:10,alignItems:"center",minWidth:0}}>
          <Avatar letra={nombre[0]}/>
          <div style={{minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{fontWeight:600,color:C.text,fontSize:14}}>{nombre}</span>
              {post.verificado&&<VerifiedBadge/>}
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:1}}>{post.materia}</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end",flexShrink:0}}>
          <Tag tipo={post.tipo}/>
          {post.tipo==="oferta"&&<span style={{fontSize:10,color:C.muted,background:C.surface,borderRadius:8,padding:"2px 7px"}}>{modoLabel}</span>}
        </div>
      </div>
      <h3 style={{color:C.text,fontSize:15,fontWeight:700,margin:"0 0 5px",lineHeight:1.3}}>{post.titulo}</h3>
      <p style={{color:C.muted,fontSize:13,lineHeight:1.5,margin:"0 0 10px"}}>{post.descripcion?.slice(0,120)}{post.descripcion?.length>120?"...":""}</p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
        {post.tipo==="oferta"&&post.modo==="curso"&&post.sinc&&<span style={{fontSize:11,color:C.muted,background:C.surface,borderRadius:8,padding:"2px 8px"}}>{sincLabel}</span>}
        {post.precio&&<span style={{fontSize:12,color:C.accent,fontWeight:700,background:C.accentDim,borderRadius:8,padding:"2px 8px"}}>💰 {fmtPrice(post.precio)}{post.precio_tipo&&post.modo!=="curso"?` /${post.precio_tipo}`:""}</span>}
        {post.fecha_inicio&&<span style={{fontSize:11,color:C.muted,background:C.surface,borderRadius:8,padding:"2px 8px"}}>📅 {fmt(post.fecha_inicio)}</span>}
      </div>
      {!esMio&&(
        <button onClick={e=>{e.stopPropagation();onOpenChat(post);}} style={{background:C.accent,color:"#0D0D0D",border:"none",borderRadius:10,padding:"6px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT}}>
          💬 Contactar
        </button>
      )}
      {esMio&&<span style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>Tu publicación</span>}
    </div>
  );
}

// ─── MY POST CARD ─────────────────────────────────────────────────────────────
function MyPostCard({post,onEdit,onToggle,onDelete,toggling}) {
  const [confirmDelete,setConfirmDelete]=useState(false);
  const activo = post.activo!==false;
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 18px",position:"relative",overflow:"hidden",fontFamily:FONT}}>
      <div style={{position:"absolute",top:0,left:0,width:"100%",height:3,background:activo?post.tipo==="oferta"?C.success:C.accent:C.muted}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
            <Tag tipo={post.tipo}/><StatusBadge activo={activo}/>
            {post.verificado&&<VerifiedBadge/>}
          </div>
          <h3 style={{color:activo?C.text:C.muted,fontSize:14,fontWeight:700,margin:"0 0 3px"}}>{post.titulo}</h3>
          <p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.4}}>{post.descripcion?.slice(0,100)}</p>
          {post.precio&&<div style={{marginTop:5,fontSize:12,color:C.muted}}>💰 <span style={{color:C.accent,fontWeight:600}}>{fmtPrice(post.precio)}</span>{post.precio_tipo&&post.modo!=="curso"?` /${post.precio_tipo}`:""}</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
          <button onClick={()=>onEdit(post)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT}}>✏️ Editar</button>
          <button onClick={()=>onToggle(post)} disabled={toggling===post.id}
            style={{background:activo?"#E05C5C15":"#4ECB7115",border:`1px solid ${activo?"#E05C5C33":"#4ECB7133"}`,borderRadius:8,color:activo?C.danger:C.success,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT,opacity:toggling===post.id?.5:1}}>
            {toggling===post.id?"...":(activo?"⏸ Pausar":"▶ Activar")}
          </button>
          {!confirmDelete
            ?<button onClick={()=>setConfirmDelete(true)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"5px 10px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>🗑 Eliminar</button>
            :<div style={{display:"flex",flexDirection:"column",gap:3}}>
              <div style={{fontSize:10,color:C.danger,textAlign:"center"}}>¿Seguro?</div>
              <button onClick={()=>onDelete(post)} style={{background:C.danger,border:"none",borderRadius:8,color:"#fff",padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>Sí</button>
              <button onClick={()=>setConfirmDelete(false)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"5px 10px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>No</button>
            </div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── MY POSTS PAGE ────────────────────────────────────────────────────────────
function MyPostsPage({session,onEdit,onNew}) {
  const [posts,setPosts]=useState([]); const [loading,setLoading]=useState(true); const [toggling,setToggling]=useState(null);
  const cargar = useCallback(async()=>{
    setLoading(true);
    try{const d=await sb.getPublicaciones({},session.access_token);setPosts(d.filter(p=>p.autor_email===session.user.email));}
    finally{setLoading(false);}
  },[session]);
  useEffect(()=>{cargar();},[cargar]);
  const toggle = async(post)=>{
    setToggling(post.id);
    try{ await sb.updatePublicacion(post.id,{activo:post.activo===false?true:false},session.access_token); await cargar(); }
    catch(e){alert("Error al cambiar estado: "+e.message);}
    finally{setToggling(null);}
  };
  const remove = async(post)=>{ await sb.deletePublicacion(post.id,session.access_token); cargar(); };
  return (
    <div style={{fontFamily:FONT}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div><h2 style={{fontSize:20,color:C.text,margin:"0 0 3px",fontWeight:700}}>Mis publicaciones</h2><p style={{color:C.muted,fontSize:13,margin:0}}>{posts.length} publicación{posts.length!==1?"es":""}</p></div>
        <Btn onClick={onNew} style={{padding:"8px 14px",fontSize:13}}>+ Nueva</Btn>
      </div>
      {loading?<Spinner/>:posts.length===0?(
        <div style={{textAlign:"center",padding:"60px 0"}}>
          <div style={{fontSize:42,marginBottom:12}}>📭</div>
          <p style={{color:C.muted,fontSize:14}}>Todavía no publicaste nada.</p>
          <Btn onClick={onNew} style={{marginTop:12}}>Crear primera publicación</Btn>
        </div>
      ):(
        <div style={{display:"grid",gap:10}}>{posts.map(p=><MyPostCard key={p.id} post={p} onEdit={onEdit} onToggle={toggle} onDelete={remove} toggling={toggling}/>)}</div>
      )}
    </div>
  );
}

// ─── CHATS PAGE ───────────────────────────────────────────────────────────────
function ChatsPage({session,onOpenChat}) {
  const [chats,setChats]=useState([]); const [loading,setLoading]=useState(true);
  const miEmail = session.user.email;
  useEffect(()=>{
    sb.getMisChats(miEmail,session.access_token).then(msgs=>{
      const map={};
      msgs.forEach(m=>{
        const otro=m.de_nombre===miEmail?m.para_nombre:m.de_nombre;
        const key=`${m.publicacion_id}__${otro}`;
        if(!map[key])map[key]={pubId:m.publicacion_id,otro,ultimo:m,unread:0,pubTitulo:m.pub_titulo||"Conversación"};
        if(m.de_nombre!==miEmail&&!m.leido)map[key].unread++;
      });
      setChats(Object.values(map));
    }).finally(()=>setLoading(false));
  },[miEmail,session.access_token]);
  return (
    <div style={{fontFamily:FONT}}>
      <h2 style={{fontSize:20,color:C.text,margin:"0 0 18px",fontWeight:700}}>Mis chats</h2>
      {loading?<Spinner/>:chats.length===0?(
        <div style={{textAlign:"center",padding:"60px 0"}}>
          <div style={{fontSize:42,marginBottom:12}}>💬</div>
          <p style={{color:C.muted,fontSize:14}}>No iniciaste ninguna conversación.</p>
        </div>
      ):(
        <div style={{display:"grid",gap:8}}>
          {chats.map((c,i)=>(
            <div key={i} onClick={()=>onOpenChat({id:c.pubId,autor_email:c.otro,titulo:c.pubTitulo,autor_nombre:c.otro.split("@")[0]})}
              style={{background:C.card,border:`1px solid ${c.unread>0?C.accent:C.border}`,borderRadius:14,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"border-color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
              onMouseLeave={e=>e.currentTarget.style.borderColor=c.unread>0?C.accent:C.border}>
              <Avatar letra={c.otro[0]} size={38}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,color:C.text,fontSize:13,marginBottom:2}}>{c.otro.split("@")[0]}</div>
                <div style={{color:C.muted,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.ultimo.texto}</div>
              </div>
              {c.unread>0&&<span style={{background:C.accent,color:"#0D0D0D",borderRadius:20,fontSize:11,fontWeight:700,padding:"2px 8px",flexShrink:0}}>{c.unread} nuevo{c.unread!==1?"s":""}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CHAT MODAL ───────────────────────────────────────────────────────────────
function ChatModal({post,session,onClose}) {
  const miEmail = session.user.email;
  const otroEmail = post.autor_email;
  const [msgs,setMsgs]=useState([]); const [input,setInput]=useState(""); const [loading,setLoading]=useState(true);
  const bottomRef=useRef(null);
  const cargar = useCallback(async()=>{
    try{
      const data = await sb.getMensajes(post.id,miEmail,otroEmail,session.access_token);
      setMsgs(data);
      setLoading(false);
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),50);
    }catch(e){console.error("Error cargando mensajes:",e);}
  },[post.id,miEmail,otroEmail,session.access_token]);
  useEffect(()=>{cargar();const t=setInterval(cargar,3000);return()=>clearInterval(t);},[cargar]);
  const send = async()=>{
    if(!input.trim())return;
    const txt=input; setInput("");
    try{
      await sb.insertMensaje({publicacion_id:post.id,de_nombre:miEmail,para_nombre:otroEmail,texto:txt,leido:false},session.access_token);
      cargar();
    }catch(e){alert("Error al enviar: "+e.message);}
  };
  const nombre = post.autor_nombre||otroEmail?.split("@")[0]||"Usuario";
  return (
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,width:"min(460px,95vw)",maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <Avatar letra={nombre[0]} size={34}/>
            <div><div style={{fontWeight:700,color:C.text,fontSize:14}}>{nombre}</div><div style={{fontSize:11,color:C.muted}}>{post.titulo}</div></div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer"}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:7,minHeight:160}}>
          {loading?<Spinner/>:msgs.length===0?<div style={{color:C.muted,textAlign:"center",padding:24,fontSize:13}}>Empezá la conversación 👋</div>
            :msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.de_nombre===miEmail?"flex-end":"flex-start"}}>
                <div style={{background:m.de_nombre===miEmail?C.accent:C.card,color:m.de_nombre===miEmail?"#0D0D0D":C.text,padding:"8px 12px",borderRadius:12,maxWidth:"80%",fontSize:13,lineHeight:1.5}}>{m.texto}</div>
              </div>
            ))}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
          <Input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Escribí un mensaje..."/>
          <button onClick={send} style={{background:C.accent,border:"none",borderRadius:10,padding:"10px 13px",fontWeight:700,cursor:"pointer",color:"#0D0D0D",fontSize:16,flexShrink:0}}>↑</button>
        </div>
      </div>
    </div>
  );
}

// ─── CALENDARIO CURSO ─────────────────────────────────────────────────────────
function CalendarioCurso({post}) {
  const [mesOffset,setMesOffset]=useState(0);
  const clasesSinc = (() => { try{ return post.clases_sinc ? JSON.parse(post.clases_sinc) : []; }catch{return [];} })();
  if(clasesSinc.length===0||post.sinc!=="sinc") return null;

  const DIAS_MAP={"Domingo":0,"Lunes":1,"Martes":2,"Miércoles":3,"Jueves":4,"Viernes":5,"Sábado":6};
  const hoy=new Date();
  const base=new Date(hoy.getFullYear(),hoy.getMonth()+mesOffset,1);
  const year=base.getFullYear(); const month=base.getMonth();
  const primerDia=(base.getDay()+6)%7; // lunes=0
  const diasEnMes=new Date(year,month+1,0).getDate();
  const inicio=post.fecha_inicio?new Date(post.fecha_inicio):null;
  const fin=post.fecha_fin?new Date(post.fecha_fin):null;
  const mesLabel=base.toLocaleDateString("es-AR",{month:"long",year:"numeric"});

  // Calcular qué días del mes tienen clases
  const claseDias=new Set();
  for(let d=1;d<=diasEnMes;d++){
    const fecha=new Date(year,month,d);
    if(inicio&&fecha<inicio)continue;
    if(fin&&fecha>fin)continue;
    const diaSemana=(fecha.getDay()+6)%7; // lunes=0
    const tieneClase=clasesSinc.some(c=>DIAS_MAP[c.dia]!==undefined&&(DIAS_MAP[c.dia])===diaSemana+1||c.dia==="Lunes"&&diaSemana===0||c.dia==="Martes"&&diaSemana===1||c.dia==="Miércoles"&&diaSemana===2||c.dia==="Jueves"&&diaSemana===3||c.dia==="Viernes"&&diaSemana===4||c.dia==="Sábado"&&diaSemana===5||c.dia==="Domingo"&&diaSemana===6);
    if(tieneClase)claseDias.add(d);
  }

  // Horarios del día seleccionado
  const [diaSelec,setDiaSelec]=useState(null);
  const clasesDelDia=(d)=>{
    if(!d)return [];
    const fecha=new Date(year,month,d);
    const diaSemana=(fecha.getDay()+6)%7;
    const nombres=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
    return clasesSinc.filter(c=>c.dia===nombres[diaSemana]);
  };

  const celdas=[];
  for(let i=0;i<primerDia;i++)celdas.push(null);
  for(let d=1;d<=diasEnMes;d++)celdas.push(d);

  return (
    <div style={{background:C.card,borderRadius:14,padding:"16px",marginTop:16,border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button onClick={()=>setMesOffset(m=>m-1)} style={{background:"none",border:` 1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"4px 10px",cursor:"pointer",fontFamily:FONT}}>‹</button>
        <span style={{color:C.text,fontWeight:600,fontSize:14,textTransform:"capitalize"}}>{mesLabel}</span>
        <button onClick={()=>setMesOffset(m=>m+1)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"4px 10px",cursor:"pointer",fontFamily:FONT}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:3}}>
        {["Lu","Ma","Mi","Ju","Vi","Sá","Do"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:C.muted,fontWeight:600,padding:"2px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {celdas.map((d,i)=>{
          if(!d)return <div key={i}/>;
          const tieneClase=claseDias.has(d);
          const esHoy=d===hoy.getDate()&&month===hoy.getMonth()&&year===hoy.getFullYear();
          const selec=diaSelec===d;
          return (
            <div key={i} onClick={()=>tieneClase&&setDiaSelec(selec?null:d)}
              style={{textAlign:"center",padding:"6px 2px",borderRadius:8,fontSize:13,fontWeight:tieneClase?700:400,background:selec?C.accent:tieneClase?C.accentDim:"transparent",color:selec?"#0D0D0D":tieneClase?C.accent:esHoy?C.text:C.muted,border:esHoy?`1px solid ${C.border}`:"1px solid transparent",cursor:tieneClase?"pointer":"default",position:"relative"}}>
              {d}
              {tieneClase&&!selec&&<div style={{width:4,height:4,background:C.accent,borderRadius:"50%",margin:"2px auto 0"}}/>}
            </div>
          );
        })}
      </div>
      {diaSelec&&clasesDelDia(diaSelec).map((c,i)=>(
        <div key={i} style={{marginTop:10,background:C.accentDim,border:`1px solid #F5C84233`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🕐</span>
          <div>
            <div style={{color:C.accent,fontWeight:700,fontSize:13}}>{c.dia} {new Date(year,month,diaSelec).toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</div>
            <div style={{color:C.text,fontSize:13}}>{c.hora_inicio} → {c.hora_fin}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function DetailModal({post,session,onClose,onChat}) {
  const [reseñas,setReseñas]=useState([]); const [reseña,setReseña]=useState(""); const [estrella,setEstrella]=useState(5);
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [err,setErr]=useState("");
  const nombre = post.autor_nombre||post.autor_email?.split("@")[0]||"Usuario";
  const esMio = post.autor_email===session.user.email;

  useEffect(()=>{ sb.getReseñas(post.id,session.access_token).then(setReseñas).finally(()=>setLoading(false)); },[post.id]);

  const enviar = async()=>{
    if(!reseña.trim()){setErr("Escribí tu reseña");return;}
    setSaving(true); setErr("");
    try{
      const mn=session.user.email.split("@")[0];
      await sb.insertReseña({publicacion_id:post.id,autor_nombre:mn,texto:reseña,estrellas:estrella},session.access_token);
      const nuevas = await sb.getReseñas(post.id,session.access_token);
      setReseñas(nuevas); setReseña("");
    }catch(e){setErr("Error al guardar: "+e.message);}
    finally{setSaving(false);}
  };

  const InfoChip = ({label,val}) => val?(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px"}}>
      <div style={{color:C.muted,fontSize:10,letterSpacing:1,marginBottom:2}}>{label}</div>
      <div style={{color:C.text,fontWeight:600,fontSize:13}}>{val}</div>
    </div>
  ):null;

  return (
    <Modal onClose={onClose} width="min(640px,95vw)">
      <div style={{padding:"20px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <Avatar letra={nombre[0]} size={46}/>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,color:C.text,fontSize:15}}>{nombre}</span>
                {post.verificado&&<VerifiedBadge/>}
              </div>
              {loading?<Spinner small/>:<ValoracionDisplay reseñas={reseñas}/>}
              <div style={{marginTop:5,display:"flex",gap:6,flexWrap:"wrap"}}><Tag tipo={post.tipo}/></div>
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",flexShrink:0}}>×</button>
        </div>

        <div style={{marginBottom:8}}><span style={{background:C.accentDim,color:C.accent,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:8}}>{post.materia}</span></div>
        <h2 style={{color:C.text,fontSize:19,margin:"8px 0 8px",lineHeight:1.3,fontWeight:700}}>{post.titulo}</h2>
        <p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:14}}>{post.descripcion}</p>

        {/* Detalles del modo */}
        {post.tipo==="oferta"&&(
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
            {post.modo==="curso"?(
              <>
                <InfoChip label="MODALIDAD" val="📦 Curso"/>
                {post.sinc&&<InfoChip label="TIPO" val={post.sinc==="sinc"?"🔴 Sincrónico":"📹 Asincrónico"}/>}
                {post.precio&&<InfoChip label="PRECIO CURSO" val={fmtPrice(post.precio)}/>}
                {post.duracion_curso&&<InfoChip label="DURACIÓN" val={post.duracion_curso}/>}
                {post.fecha_inicio&&<InfoChip label="INICIO" val={fmt(post.fecha_inicio)}/>}
                {post.fecha_fin&&<InfoChip label="FIN" val={fmt(post.fecha_fin)}/>}
                {post.sinc==="sinc"&&post.dias_clases&&<InfoChip label="DÍAS" val={post.dias_clases}/>}
                {post.sinc==="sinc"&&post.clases_sinc&&(()=>{
                  try{
                    const clases=JSON.parse(post.clases_sinc);
                    return clases.length>0&&<InfoChip label="CLASES" val={clases.map(c=>`${c.dia} ${c.hora_inicio}-${c.hora_fin}`).join(" · ")}/>;
                  }catch{return null;}
                })()}
              </>
            ):(
              <>
                <InfoChip label="MODALIDAD" val="👤 Clase particular"/>
                {post.precio&&<InfoChip label="PRECIO" val={`${fmtPrice(post.precio)} /${post.precio_tipo||"hora"}`}/>}
                <InfoChip label="HORARIO" val="A convenir con el alumno"/>
              </>
            )}
          </div>
        )}

        {!esMio&&<button onClick={()=>{onClose();onChat(post);}} style={{background:C.accent,color:"#0D0D0D",border:"none",borderRadius:12,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:16,fontFamily:FONT}}>💬 Iniciar conversación</button>}

        {post.tipo==="oferta"&&post.modo==="curso"&&post.sinc==="sinc"&&(
          <div style={{marginBottom:20}}>
            <h4 style={{color:C.text,fontSize:14,marginBottom:4,marginTop:4}}>📅 Calendario de clases</h4>
            <CalendarioCurso post={post}/>
          </div>
        )}

        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16}}>
          <h4 style={{color:C.text,marginBottom:12,fontSize:14}}>Reseñas ({reseñas.length})</h4>
          {loading?<Spinner/>:reseñas.map(r=>(
            <div key={r.id} style={{background:C.card,borderRadius:12,padding:"10px 13px",marginBottom:8}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5}}>
                <Avatar letra={r.autor_avatar||r.autor_nombre?.[0]} size={26}/>
                <span style={{fontWeight:600,color:C.text,fontSize:13}}>{r.autor_nombre}</span>
                <span style={{color:C.accent,fontSize:12}}>{"★".repeat(r.estrellas||0)}</span>
              </div>
              <p style={{color:C.muted,fontSize:13,margin:0,lineHeight:1.5}}>{r.texto}</p>
            </div>
          ))}
          {!esMio&&(
            <div style={{marginTop:12}}>
              <div style={{display:"flex",gap:3,marginBottom:8}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setEstrella(n)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:n<=estrella?C.accent:C.border}}>★</button>)}</div>
              <textarea value={reseña} onChange={e=>setReseña(e.target.value)} placeholder="Dejá tu reseña..." style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",color:C.text,fontSize:13,outline:"none",resize:"vertical",minHeight:70,boxSizing:"border-box",fontFamily:FONT}}/>
              <ErrMsg msg={err}/>
              <Btn onClick={enviar} disabled={saving} variant="ghost" style={{marginTop:6,color:C.accent,border:`1px solid ${C.accent}`,fontSize:13,padding:"7px 14px"}}>{saving?"Guardando...":"Publicar reseña"}</Btn>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── VERIFICACIÓN IA ──────────────────────────────────────────────────────────
function VerificacionIA({titulo,materia,onVerificado}) {
  const [pregunta,setPregunta]=useState(""); const [respuesta,setRespuesta]=useState("");
  const [estado,setEstado]=useState("cargando"); // cargando | esperando | evaluando | ok | error
  const [feedback,setFeedback]=useState("");

  useEffect(()=>{
    if(!titulo||!materia)return;
    setEstado("cargando"); setRespuesta(""); setPregunta(""); setFeedback("");
    sb.verificarConIA(titulo,materia,"").then(r=>{
      setPregunta(r.pregunta||"Contá brevemente tu experiencia en el tema.");
      setEstado("esperando");
    }).catch(()=>{setPregunta("Contá brevemente tu experiencia enseñando este tema.");setEstado("esperando");});
  },[titulo,materia]);

  const evaluar = async()=>{
    if(!respuesta.trim())return;
    setEstado("evaluando");
    try{
      const r = await sb.verificarConIA(titulo,materia,respuesta);
      setFeedback(r.feedback||"");
      if(r.correcta){setEstado("ok");onVerificado();}
      else{setEstado("error");}
    }catch{setEstado("error");setFeedback("No se pudo evaluar, pero podés continuar igual.");}
  };

  if(estado==="ok") return <div style={{color:C.success,fontSize:13,padding:"8px 12px",background:"#4ECB7115",borderRadius:8,border:"1px solid #4ECB7133"}}>✓ ¡Verificado! Tu publicación tendrá la insignia de conocimiento verificado.</div>;

  return (
    <div style={{background:C.accentDim,border:`1px solid #F5C84233`,borderRadius:10,padding:14,marginTop:8}}>
      <div style={{color:C.accent,fontSize:11,fontWeight:700,marginBottom:6,letterSpacing:1}}>✓ VERIFICACIÓN DE CONOCIMIENTO (IA)</div>
      {estado==="cargando"?<div style={{color:C.muted,fontSize:13,display:"flex",alignItems:"center",gap:8}}><Spinner small/>Generando pregunta sobre tu curso...</div>
      :<>
        <p style={{color:C.text,fontSize:13,marginBottom:8,lineHeight:1.5}}>{pregunta}</p>
        <textarea value={respuesta} onChange={e=>setRespuesta(e.target.value)} placeholder="Tu respuesta..." style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",resize:"vertical",minHeight:60,boxSizing:"border-box",fontFamily:FONT,marginBottom:8}}/>
        {estado==="error"&&<div style={{color:C.danger,fontSize:12,marginBottom:6}}>{feedback||"Respuesta incorrecta. Intentá de nuevo."}</div>}
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={evaluar} disabled={estado==="evaluando"||!respuesta.trim()} style={{background:C.accent,color:"#0D0D0D",border:"none",borderRadius:8,padding:"7px 14px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,opacity:!respuesta.trim()?.5:1}}>
            {estado==="evaluando"?"Evaluando...":"Verificar →"}
          </button>
          <button onClick={onVerificado} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:FONT}}>Omitir verificación</button>
        </div>
      </>}
    </div>
  );
}

// ─── POST FORM MODAL ──────────────────────────────────────────────────────────
function PostFormModal({session,postToEdit,onClose,onSave}) {
  const editing = !!postToEdit;
  const [tipo,setTipo]=useState(postToEdit?.tipo||"busqueda");
  const [materia,setMateria]=useState(postToEdit?.materia||"");
  const [titulo,setTitulo]=useState(postToEdit?.titulo||"");
  const [descripcion,setDescripcion]=useState(postToEdit?.descripcion||"");
  const [modo,setModo]=useState(postToEdit?.modo||"particular"); // particular | curso
  const [precio,setPrecio]=useState(postToEdit?.precio||"");
  const [precioTipo,setPrecioTipo]=useState(postToEdit?.precio_tipo||"hora");
  // Curso
  const [sinc,setSinc]=useState(postToEdit?.sinc||"sinc");
  const [duracionCurso,setDuracionCurso]=useState(postToEdit?.duracion_curso||"");
  const [fechaInicio,setFechaInicio]=useState(postToEdit?.fecha_inicio||"");
  const [fechaFin,setFechaFin]=useState(postToEdit?.fecha_fin||"");
  // Clases recurrentes: array de {dia, hora_inicio, hora_fin} guardado como JSON
  const [clasesSinc,setClasesSinc]=useState(()=>{
    try{ return postToEdit?.clases_sinc ? JSON.parse(postToEdit.clases_sinc) : []; }catch{return [];}
  });
  const [verificado,setVerificado]=useState(postToEdit?.verificado||false);
  const [saving,setSaving]=useState(false); const [err,setErr]=useState("");

  const DIAS_SEMANA = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const addClase = ()=>setClasesSinc(prev=>[...prev,{dia:"Lunes",hora_inicio:"09:00",hora_fin:"10:00"}]);
  const updateClase = (i,field,val)=>setClasesSinc(prev=>prev.map((c,idx)=>idx===i?{...c,[field]:val}:c));
  const removeClase = (i)=>setClasesSinc(prev=>prev.filter((_,idx)=>idx!==i));

  const iS={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:10,fontFamily:FONT};

  const guardar = async()=>{
    if(!titulo||!descripcion||!materia){setErr("Completá título, materia y descripción");return;}
    setSaving(true);setErr("");
    try{
      const nombre=session.user.email.split("@")[0];
      const data={tipo,materia,titulo,descripcion,autor_email:session.user.email,autor_nombre:nombre,autor_avatar:nombre[0].toUpperCase(),activo:true,verificado,modo};
      if(tipo==="oferta"){
        if(precio)data.precio=parseFloat(precio);
        if(modo==="particular"){data.precio_tipo=precioTipo;}
        else{
          data.sinc=sinc; data.duracion_curso=duracionCurso;
          if(fechaInicio)data.fecha_inicio=fechaInicio;
          if(fechaFin)data.fecha_fin=fechaFin;
          if(sinc==="sinc")data.clases_sinc=JSON.stringify(clasesSinc);
        }
      }
      if(editing){await sb.updatePublicacion(postToEdit.id,data,session.access_token);onSave();}
      else{const r=await sb.insertPublicacion(data,session.access_token);onSave(r[0]);}
      onClose();
    }catch(e){setErr("Error: "+e.message);}
    finally{setSaving(false);}
  };

  return (
    <Modal onClose={onClose}>
      <div style={{padding:"22px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <h3 style={{color:C.text,margin:0,fontSize:17,fontWeight:700}}>{editing?"Editar publicación":"Nueva publicación"}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer"}}>×</button>
        </div>

        {/* Tipo */}
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {["busqueda","oferta"].map(t=>(
            <button key={t} onClick={()=>setTipo(t)} style={{flex:1,padding:"9px",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",background:tipo===t?(t==="oferta"?C.success:C.accent):C.card,color:tipo===t?"#0D0D0D":C.muted,border:`1px solid ${tipo===t?"transparent":C.border}`,fontFamily:FONT}}>
              {t==="busqueda"?"🔍 Busco clases":"📚 Ofrezco clases"}
            </button>
          ))}
        </div>

        {/* Materia y título */}
        <select value={materia} onChange={e=>setMateria(e.target.value)} style={{...iS,cursor:"pointer"}}><option value="">Seleccioná una materia</option>{MATERIAS.map(m=><option key={m} value={m}>{m}</option>)}</select>
        <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Título del curso o clase" style={iS}/>
        <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} placeholder="Descripción detallada..." style={{...iS,minHeight:80,resize:"vertical"}}/>

        {/* Si es oferta: modo */}
        {tipo==="oferta"&&(
          <>
            <Label>Modalidad</Label>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[{v:"particular",l:"👤 Clase particular"},{v:"curso",l:"📦 Curso"}].map(({v,l})=>(
                <button key={v} onClick={()=>setModo(v)} style={{flex:1,padding:"8px",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",background:modo===v?C.accent:C.card,color:modo===v?"#0D0D0D":C.muted,border:`1px solid ${modo===v?"transparent":C.border}`,fontFamily:FONT}}>{l}</button>
              ))}
            </div>

            {modo==="particular"&&(
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,marginBottom:4}}>
                <Label>Precio (el horario se arregla con el estudiante)</Label>
                <div style={{display:"flex",gap:8}}>
                  <input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Precio" type="number" min="0" style={{...iS,margin:0,flex:2}}/>
                  <select value={precioTipo} onChange={e=>setPrecioTipo(e.target.value)} style={{...iS,margin:0,flex:1,cursor:"pointer"}}>
                    <option value="hora">/ hora</option><option value="clase">/ clase</option>
                  </select>
                </div>
              </div>
            )}

            {modo==="curso"&&(
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,display:"flex",flexDirection:"column",gap:0}}>
                <Label>Precio del curso completo</Label>
                <input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Precio total del curso" type="number" min="0" style={iS}/>

                <Label>Duración total del curso</Label>
                <input value={duracionCurso} onChange={e=>setDuracionCurso(e.target.value)} placeholder="Ej: 8 semanas, 20 horas, 12 clases..." style={iS}/>

                <Label>Tipo de curso</Label>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  {[{v:"sinc",l:"🔴 Sincrónico"},{v:"asinc",l:"📹 Asincrónico"}].map(({v,l})=>(
                    <button key={v} onClick={()=>setSinc(v)} style={{flex:1,padding:"8px",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",background:sinc===v?C.accent:C.card,color:sinc===v?"#0D0D0D":C.muted,border:`1px solid ${sinc===v?"transparent":C.border}`,fontFamily:FONT}}>{l}</button>
                  ))}
                </div>

                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <div style={{flex:1}}><Label>Fecha de inicio</Label><input type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} style={{...iS,margin:0,colorScheme:"dark"}}/></div>
                  <div style={{flex:1}}><Label>Fecha de fin</Label><input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} style={{...iS,margin:0,colorScheme:"dark"}}/></div>
                </div>

                {sinc==="sinc"&&(
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <Label>Horarios de clases recurrentes</Label>
                      <button onClick={addClase} style={{background:C.accentDim,border:`1px solid #F5C84244`,borderRadius:8,color:C.accent,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>+ Agregar</button>
                    </div>
                    {clasesSinc.length===0&&<div style={{color:C.muted,fontSize:12,marginBottom:10,fontStyle:"italic"}}>Agregá los horarios semanales de las clases.</div>}
                    {clasesSinc.map((c,i)=>(
                      <div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:7,background:C.card,borderRadius:10,padding:"8px 10px",border:`1px solid ${C.border}`}}>
                        <select value={c.dia} onChange={e=>updateClase(i,"dia",e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 8px",color:C.text,fontSize:12,fontFamily:FONT,cursor:"pointer",outline:"none",flex:2}}>
                          {["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map(d=><option key={d} value={d}>{d}</option>)}
                        </select>
                        <input type="time" value={c.hora_inicio} onChange={e=>updateClase(i,"hora_inicio",e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 8px",color:C.text,fontSize:12,fontFamily:FONT,outline:"none",colorScheme:"dark",flex:2}}/>
                        <span style={{color:C.muted,fontSize:12}}>→</span>
                        <input type="time" value={c.hora_fin} onChange={e=>updateClase(i,"hora_fin",e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 8px",color:C.text,fontSize:12,fontFamily:FONT,outline:"none",colorScheme:"dark",flex:2}}/>
                        <button onClick={()=>removeClase(i)} style={{background:"none",border:"none",color:C.danger,fontSize:16,cursor:"pointer",flexShrink:0,padding:"0 4px"}}>×</button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Verificación IA */}
            {titulo&&materia&&!verificado&&(
              <VerificacionIA titulo={titulo} materia={materia} onVerificado={()=>setVerificado(true)}/>
            )}
            {verificado&&<div style={{color:C.success,fontSize:12,padding:"6px 10px",background:"#4ECB7115",borderRadius:8,border:"1px solid #4ECB7133",marginTop:6}}>✓ Conocimiento verificado</div>}
          </>
        )}

        <ErrMsg msg={err}/>
        <Btn onClick={guardar} disabled={saving} style={{width:"100%",padding:"11px",fontSize:14,marginTop:12,borderRadius:12}}>{saving?"Guardando...":editing?"Guardar cambios":"Publicar"}</Btn>
      </div>
    </Modal>
  );
}

// ─── EXPLORE PAGE ─────────────────────────────────────────────────────────────
function ExplorePage({session,onOpenChat,onOpenDetail}) {
  const [posts,setPosts]=useState([]); const [loading,setLoading]=useState(true);
  const [filtroTipo,setFiltroTipo]=useState("all"); const [filtroMateria,setFiltroMateria]=useState(""); const [busqueda,setBusqueda]=useState("");
  const cargar = useCallback(async()=>{
    setLoading(true);
    try{const f={};if(filtroTipo!=="all")f.tipo=filtroTipo;if(filtroMateria)f.materia=filtroMateria;
    const d=await sb.getPublicaciones(f,session.access_token);setPosts(d.filter(p=>p.activo!==false));}
    finally{setLoading(false);}
  },[session,filtroTipo,filtroMateria]);
  useEffect(()=>{cargar();},[cargar]);
  const filtered=posts.filter(p=>!busqueda||p.titulo?.toLowerCase().includes(busqueda.toLowerCase())||p.descripcion?.toLowerCase().includes(busqueda.toLowerCase()));
  return (
    <div style={{fontFamily:FONT}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:"clamp(20px,4vw,34px)",fontWeight:700,margin:"0 0 5px",lineHeight:1.2}}>Conectá con el <span style={{color:C.accent}}>conocimiento</span></h1>
        <p style={{color:C.muted,fontSize:13,margin:0}}>Publicá lo que querés aprender o lo que podés enseñar.</p>
      </div>
      <Input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍  Buscá por tema..." style={{marginBottom:12,background:C.surface,padding:"11px 15px"}}/>
      <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
        {["all","busqueda","oferta"].map(t=>(
          <button key={t} onClick={()=>setFiltroTipo(t)} style={{background:filtroTipo===t?C.accent:C.surface,color:filtroTipo===t?"#0D0D0D":C.muted,border:`1px solid ${filtroTipo===t?C.accent:C.border}`,borderRadius:20,padding:"5px 13px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>
            {t==="all"?"Todo":t==="busqueda"?"🔍 Búsquedas":"📚 Ofertas"}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:22,overflowX:"auto",paddingBottom:4}}>
        {["Todas",...MATERIAS].map(m=>(
          <button key={m} onClick={()=>setFiltroMateria(m==="Todas"?"":m)} style={{background:(m==="Todas"&&!filtroMateria)||filtroMateria===m?C.accent:C.card,color:(m==="Todas"&&!filtroMateria)||filtroMateria===m?"#0D0D0D":C.muted,border:"none",borderRadius:20,padding:"5px 11px",fontSize:11,fontWeight:(m==="Todas"&&!filtroMateria)||filtroMateria===m?700:400,cursor:"pointer",whiteSpace:"nowrap",fontFamily:FONT}}>
            {m}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        {[{label:"Activas",val:posts.length},{label:"Búsquedas",val:posts.filter(p=>p.tipo==="busqueda").length},{label:"Docentes",val:posts.filter(p=>p.tipo==="oferta").length}].map(s=>(
          <div key={s.label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 16px",flex:1,minWidth:80}}>
            <div style={{fontSize:22,fontWeight:700,color:C.accent}}>{s.val}</div>
            <div style={{color:C.muted,fontSize:11}}>{s.label}</div>
          </div>
        ))}
      </div>
      {loading?<Spinner/>:filtered.length===0?(
        <div style={{textAlign:"center",color:C.muted,padding:"50px 0",fontSize:14}}>{posts.length===0?"¡Sé el primero en publicar! 🚀":"Sin resultados."}</div>
      ):(
        <div style={{display:"grid",gap:12}}>{filtered.map(p=><PostCard key={p.id} post={p} miEmail={session.user.email} onOpenChat={onOpenChat} onOpenDetail={onOpenDetail}/>)}</div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session,setSession]=useState(()=>sb.loadSession());
  const [page,setPage]=useState("explore");
  const [chatPost,setChatPost]=useState(null);
  const [detailPost,setDetailPost]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [editPost,setEditPost]=useState(null);
  const [myPostsKey,setMyPostsKey]=useState(0);
  const [unread,setUnread]=useState(0);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [isMobile,setIsMobile]=useState(window.innerWidth<768);

  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<768);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);

  const sessionRef=useRef(session);
  useEffect(()=>{sessionRef.current=session;},[session]);

  useEffect(()=>{
    sb.setSessionRefreshCallback(async()=>{
      const c=sessionRef.current; if(!c?.refresh_token)return null;
      try{const s=await sb.refreshSession(c.refresh_token);sb.saveSession(s);setSession(s);return s;}
      catch{sb.clearSession();setSession(null);return null;}
    });
  },[]);

  const logout = ()=>{sb.clearSession();setSession(null);};

  useEffect(()=>{
    if(!session)return;
    const check=()=>sb.getMisChats(session.user.email,session.access_token).then(msgs=>{
      setUnread(msgs.filter(m=>m.de_nombre!==session.user.email&&!m.leido).length);
    }).catch(()=>{});
    check(); const t=setInterval(check,15000); return()=>clearInterval(t);
  },[session]);

  if(!session) return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}html,body,#root{background:${C.bg};min-height:100vh;font-family:${FONT}}`}</style>
      <AuthScreen onLogin={s=>{sb.saveSession(s);setSession(s);}}/>
    </>
  );

  const SW = isMobile?0:220;
  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:FONT,color:C.text,display:"flex"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}html,body,#root{background:${C.bg};min-height:100vh;font-family:${FONT}}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}`}</style>
      <Sidebar page={page} setPage={setPage} session={session} onLogout={logout} onNewPost={()=>{setEditPost(null);setShowForm(true);}} unreadCount={unread} mobile={isMobile} open={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>
      {isMobile&&(
        <div style={{position:"fixed",top:0,left:0,right:0,height:52,background:C.sidebar,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px",zIndex:50}}>
          <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",color:C.text,fontSize:22,cursor:"pointer"}}>☰</button>
          <span style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:700,color:C.text}}>Classe<span style={{color:C.accent}}>Link</span></span>
          <Btn onClick={()=>{setEditPost(null);setShowForm(true);}} style={{padding:"5px 10px",fontSize:12}}>+ Publicar</Btn>
        </div>
      )}
      <main style={{marginLeft:SW,flex:1,padding:isMobile?"68px 14px 24px":"34px 34px",minHeight:"100vh",maxWidth:`calc(100vw - ${SW}px)`}}>
        <div style={{maxWidth:820,margin:"0 auto"}}>
          {page==="explore"&&<ExplorePage session={session} onOpenChat={setChatPost} onOpenDetail={setDetailPost}/>}
          {page==="chats"&&<ChatsPage session={session} onOpenChat={setChatPost}/>}
          {page==="myposts"&&<MyPostsPage key={myPostsKey} session={session} onEdit={p=>{setEditPost(p);setShowForm(true);}} onNew={()=>{setEditPost(null);setShowForm(true);}}/>}
        </div>
      </main>
      {chatPost&&<ChatModal post={chatPost} session={session} onClose={()=>setChatPost(null)}/>}
      {detailPost&&<DetailModal post={detailPost} session={session} onClose={()=>setDetailPost(null)} onChat={p=>{setDetailPost(null);setChatPost(p);}}/>}
      {showForm&&<PostFormModal session={session} postToEdit={editPost} onClose={()=>{setShowForm(false);setEditPost(null);}} onSave={()=>setMyPostsKey(k=>k+1)}/>}
    </div>
  );
}
