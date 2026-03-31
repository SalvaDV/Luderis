import React, { useState, useEffect, useRef } from "react";
import * as sb from "./supabase";

// ─── TEMAS ────────────────────────────────────────────────────────────────────
export const THEMES={
  dark:{bg:"#080F1C",surface:"#0E1829",card:"#131E2F",border:"#1E2D42",accent:"#2EC4A0",accentDim:"#2EC4A015",text:"#E8EFF8",muted:"#5C7A9A",success:"#2EC4A0",danger:"#E05C5C",sidebar:"#080F1C",info:"#1A6ED8",purple:"#7B5CF0",warn:"#E0955C",sidebarBorder:"#1E2D42"},
  light:{bg:"#F6F9FF",surface:"#FFFFFF",card:"#FFFFFF",border:"#DDE5F5",accent:"#1A6ED8",accentDim:"#1A6ED810",text:"#0D1F3C",muted:"#5A7294",success:"#2EC4A0",danger:"#E53E3E",sidebar:"#FFFFFF",info:"#1A6ED8",purple:"#7B5CF0",warn:"#DD8A1A",sidebarBorder:"#DDE5F5"},
};
export let _themeKey=()=>{try{return localStorage.getItem("cl_theme")||"light";}catch{return "light";}};
export const C={...THEMES[_themeKey()]};
export function applyTheme(key){Object.assign(C,THEMES[key]||THEMES.dark);try{localStorage.setItem("cl_theme",key);}catch{}}
export const FONT="-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";

// ─── TOAST GLOBAL ─────────────────────────────────────────────────────────────
let _toastCb=null;
export const toast=(msg,type="info",dur=3000)=>{if(_toastCb)_toastCb({msg,type,id:Date.now()});};
export function ToastContainer(){
  const [items,setItems]=useState([]);
  useEffect(()=>{_toastCb=(item)=>{setItems(p=>[...p.slice(-3),item]);setTimeout(()=>setItems(p=>p.filter(t=>t.id!==item.id)),item.dur||3000);};return()=>{_toastCb=null;};},[]);
  const colors={success:"#2EC4A0",error:"#E53E3E",info:"#1A6ED8",warn:"#DD8A1A"};
  if(!items.length)return null;
  return(<div style={{position:"fixed",bottom:80,right:16,zIndex:9000,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
    {items.map(t=>(<div key={t.id} style={{background:C.surface,border:`2px solid ${colors[t.type]||colors.info}`,borderRadius:12,padding:"12px 16px",fontSize:13,color:C.text,fontFamily:FONT,boxShadow:"0 8px 24px rgba(0,0,0,.15)",animation:"fadeUp .2s ease",maxWidth:280,fontWeight:500,display:"flex",alignItems:"center",gap:8}}>
      <span style={{color:colors[t.type]||colors.info,fontSize:16}}>{t.type==="success"?"✓":t.type==="error"?"✕":t.type==="warn"?"⚠":"◎"}</span>
      {t.msg}
    </div>))}
  </div>);
}

// ─── DATOS DE CATEGORÍAS ──────────────────────────────────────────────────────
export const MATERIAS=["Idiomas","Arte y Creatividad","Música","Deportes y Actividad Física","Cocina y Gastronomía","Desarrollo Personal y Bienestar","Negocios y Finanzas","Marketing y Comunicación","Programación y Tecnología","Diseño y Multimedia","Ciencia y Matemática","Humanidades y Ciencias Sociales","Oficios y Manualidades","Educación y Tutorías","Conducción y Manejo","Animales y Cuidado","Hobbies y Tiempo Libre","Viajes y Cultura","Otros"];

export const CATEGORIAS_DATA={
  "Idiomas":              {emoji:"🌍",grad:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",bg:"#1A6ED8"},
  "Arte y Creatividad":   {emoji:"🎨",grad:"linear-gradient(135deg,#E05C9A,#F5A623)",bg:"#E05C9A"},
  "Música":               {emoji:"🎵",grad:"linear-gradient(135deg,#7B5CF0,#E05C9A)",bg:"#7B5CF0"},
  "Deportes y Actividad Física":{emoji:"⚽",grad:"linear-gradient(135deg,#2EC4A0,#1A6ED8)",bg:"#2EC4A0"},
  "Cocina y Gastronomía": {emoji:"🍳",grad:"linear-gradient(135deg,#F5A623,#E05C5C)",bg:"#F5A623"},
  "Desarrollo Personal y Bienestar":{emoji:"🧘",grad:"linear-gradient(135deg,#2EC4A0,#7B5CF0)",bg:"#2EC4A0"},
  "Negocios y Finanzas":  {emoji:"💼",grad:"linear-gradient(135deg,#0F3F7A,#1A6ED8)",bg:"#0F3F7A"},
  "Marketing y Comunicación":{emoji:"📢",grad:"linear-gradient(135deg,#E05C5C,#F5A623)",bg:"#E05C5C"},
  "Programación y Tecnología":{emoji:"💻",grad:"linear-gradient(135deg,#1A6ED8,#7B5CF0)",bg:"#1A6ED8"},
  "Diseño y Multimedia":  {emoji:"🖌️",grad:"linear-gradient(135deg,#7B5CF0,#2EC4A0)",bg:"#7B5CF0"},
  "Ciencia y Matemática": {emoji:"🔬",grad:"linear-gradient(135deg,#0F3F7A,#2EC4A0)",bg:"#0F3F7A"},
  "Humanidades y Ciencias Sociales":{emoji:"📚",grad:"linear-gradient(135deg,#E05C9A,#7B5CF0)",bg:"#E05C9A"},
  "Oficios y Manualidades":{emoji:"🔨",grad:"linear-gradient(135deg,#F5A623,#2EC4A0)",bg:"#F5A623"},
  "Educación y Tutorías": {emoji:"🎓",grad:"linear-gradient(135deg,#1A6ED8,#0F3F7A)",bg:"#1A6ED8"},
  "Conducción y Manejo":  {emoji:"🚗",grad:"linear-gradient(135deg,#333,#666)",bg:"#444"},
  "Animales y Cuidado":   {emoji:"🐾",grad:"linear-gradient(135deg,#2EC4A0,#F5A623)",bg:"#2EC4A0"},
  "Hobbies y Tiempo Libre":{emoji:"🎮",grad:"linear-gradient(135deg,#7B5CF0,#E05C5C)",bg:"#7B5CF0"},
  "Viajes y Cultura":     {emoji:"✈️",grad:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",bg:"#1A6ED8"},
  "Otros":                {emoji:"✨",grad:"linear-gradient(135deg,#666,#999)",bg:"#666"},
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export const avatarColor=(l)=>["#F5C842","#4ECB71","#E05C5C","#5CA8E0","#C85CE0"][(l||"?").toUpperCase().charCodeAt(0)%5];
export const fmt=(d)=>d?new Date(d).toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"}):"";
export const fmtRel=(d)=>{if(!d)return"";const diff=(Date.now()-new Date(d))/1000;if(diff<60)return"ahora";if(diff<3600)return`hace ${Math.floor(diff/60)}min`;if(diff<86400)return`hace ${Math.floor(diff/3600)}h`;if(diff<604800)return`hace ${Math.floor(diff/86400)}d`;return fmt(d);};
export const MONEDA_SYM={"ARS":"$","USD":"US$","EUR":"€","BRL":"R$","CLP":"CLP$","COP":"COL$","MXN":"MX$","UYU":"$U","PEN":"S/","BOB":"Bs","PYG":"₲"};
export const fmtPrice=(p,moneda)=>{if(!p)return "A convenir";const sym=MONEDA_SYM[moneda]||moneda||"$";return `${sym}${Number(p).toLocaleString("es-AR")}`;};
export const calcAvg=(arr)=>{if(!arr||!arr.length)return null;return arr.reduce((a,r)=>a+(r.estrellas||0),0)/arr.length;};
export const calcDuracion=(ini,fin)=>{if(!ini||!fin)return null;const d=Math.round((new Date(fin)-new Date(ini))/(86400000));if(d<=0)return null;if(d<7)return `${d} día${d!==1?"s":""}`;if(d<30)return `${Math.round(d/7)} semana${Math.round(d/7)!==1?"s":""}`;return `${Math.round(d/30)} mes${Math.round(d/30)!==1?"es":""}`;};

// ─── IDIOMA ───────────────────────────────────────────────────────────────────
let _langKey=()=>{try{return localStorage.getItem("cl_lang")||"es";}catch{return "es";}};
let _LANG=_langKey();
export const setLang=(l)=>{_LANG=l;try{localStorage.setItem("cl_lang",l);}catch{}};
export const STRINGS={
  es:{
    explore:"Explorar",agenda:"Mi agenda",chats:"Mis chats",favorites:"Favoritos",
    classes:"Mis inscripciones",account:"Mi cuenta",newPost:"+ Publicar",
    search:"Buscar clases, materias o docentes...",filters:"Filtros",aiSearch:"✦ IA",
    allResults:"resultado",signin:"Iniciar sesión",register:"Registrarse",
    enterBtn:"Ingresar",createBtn:"Crear cuenta gratis",forgotPass:"¿Olvidaste tu contraseña?",
    welcomeBack:"Bienvenido de nuevo",createAccount:"Crear tu cuenta",
    recoverPass:"Recuperar contraseña",freeAlways:"Es gratis. Siempre.",
    offer:"Oferta",search2:"Búsqueda",all:"Todo",
    presential:"📍 Presencial",virtual:"🌐 Virtual",
    publish:"Publicaciones",stats:"Estadísticas",activity:"Actividad",
    credentials:"Credenciales",reviews:"Reseñas",
    viewPost:"Ver publicación →",editProfile:"Editar perfil",
    logout:"Cerrar sesión",theme:"Tema",dark:"🌙 Oscuro",light:"☀️ Claro",
    lang:"Idioma",langEs:"🇦🇷 Español",langEn:"🇺🇸 English",
    newPublication:"+ Nueva publicación",
    chatSupport:"Soporte Luderis",respondsNow:"Responde al instante",
    sendMsg:"Enviar mensaje →",contactTitle:"¿Tenés alguna pregunta?",
    aboutUs:"Sobre nosotros",contact:"Contacto",functions:"Funciones",howItWorks:"¿Cómo funciona?",
  },
  en:{
    explore:"Explore",agenda:"My schedule",chats:"My chats",favorites:"Favorites",
    classes:"My classes",account:"My account",newPost:"+ Publish",
    search:"Search classes, subjects or teachers...",filters:"Filters",aiSearch:"✦ AI",
    allResults:"result",signin:"Sign in",register:"Sign up",
    enterBtn:"Sign in",createBtn:"Create free account",forgotPass:"Forgot your password?",
    welcomeBack:"Welcome back",createAccount:"Create your account",
    recoverPass:"Recover password",freeAlways:"It's free. Always.",
    offer:"Offer",search2:"Search",all:"All",
    presential:"📍 In-person",virtual:"🌐 Online",
    publish:"Publications",stats:"Statistics",activity:"Activity",
    credentials:"Credentials",reviews:"Reviews",
    viewPost:"View publication →",editProfile:"Edit profile",
    logout:"Sign out",theme:"Theme",dark:"🌙 Dark",light:"☀️ Light",
    lang:"Language",langEs:"🇦🇷 Spanish",langEn:"🇺🇸 English",
    newPublication:"+ New publication",
    chatSupport:"Luderis Support",respondsNow:"Responds instantly",
    sendMsg:"Send message →",contactTitle:"Do you have a question?",
    aboutUs:"About us",contact:"Contact",functions:"Features",howItWorks:"How it works?",
  },
};
export const t=(key)=>STRINGS[_LANG]?.[key]??STRINGS.es[key]??key;

// ─── PRIVACIDAD ───────────────────────────────────────────────────────────────
export const maskEmail=(email)=>{
  if(!email)return"Usuario";
  const local=email.split("@")[0];
  if(local.length<=3)return local+"***";
  return local.slice(0,3)+"***";
};
export const safeDisplayName=(nombre,email)=>{
  if(nombre&&nombre.trim()&&!nombre.includes("@"))return nombre.trim();
  if(email)return maskEmail(email);
  return"Usuario";
};
export const CONTACT_REGEX=/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(\+?[\d\s\-().]{8,15}\d)|(instagram|ig|wa|whatsapp|telegram|tg|signal)\s*[:=@]?\s*\w+)/gi;
export const sanitizeContactInfo=(text)=>{
  if(!text)return text;
  return text.replace(CONTACT_REGEX,(match)=>{
    if(/\d/.test(match)&&match.replace(/\D/g,"").length>=7)return"[📵 dato de contacto oculto]";
    if(match.includes("@"))return"[📧 email oculto]";
    return"[📵 contacto externo oculto]";
  });
};

// ─── AVATAR CACHE + HOOK ──────────────────────────────────────────────────────
export const _avatarCache={};
export const useAutorAvatar=(email,token)=>{
  const lsAvatar=()=>{try{return localStorage.getItem("cl_avatar_"+email)||null;}catch{return null;}};
  const [url,setUrl]=useState(_avatarCache[email]||lsAvatar());
  useEffect(()=>{
    if(!email)return;
    const ls=lsAvatar();if(ls)_avatarCache[email]=ls;
    if(_avatarCache[email]!==undefined&&_avatarCache[email]!==null)return;
    _avatarCache[email]=null;
    sb.getUsuarioByEmail(email,token).then(u=>{
      const av=u?.avatar_url||null;
      _avatarCache[email]=av;
      if(av)try{localStorage.setItem("cl_avatar_"+email,av);}catch{}
      setUrl(av);
    }).catch(()=>{_avatarCache[email]=null;});
  },[email]);// eslint-disable-line
  return url;
};

// ─── MICRO-COMPONENTES ────────────────────────────────────────────────────────
export const Spinner=({small})=>(<div style={{display:"flex",justifyContent:"center",padding:small?"4px":"32px 0"}}><div style={{width:small?16:26,height:small?16:26,border:`2px solid ${C.border}`,borderTop:`2px solid ${C.accent}`,borderRight:`2px solid ${C.teal||C.accent}40`,borderRadius:"50%",animation:"spin .6s linear infinite"}}/></div>);

export const SkeletonCard=()=>(<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 18px",fontFamily:FONT}}>
  <style>{`@keyframes shimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}.sk{background:linear-gradient(90deg,${C.border} 25%,${C.bg} 50%,${C.border} 75%);background-size:400px;animation:shimmer 1.4s infinite linear;border-radius:6px}`}</style>
  <div style={{display:"flex",gap:10,marginBottom:12}}>
    <div className="sk" style={{width:38,height:38,borderRadius:"50%",flexShrink:0}}/>
    <div style={{flex:1}}><div className="sk" style={{height:13,width:"55%",marginBottom:6}}/><div className="sk" style={{height:11,width:"35%"}}/></div>
    <div className="sk" style={{width:48,height:22,borderRadius:20}}/>
  </div>
  <div className="sk" style={{height:14,width:"80%",marginBottom:6}}/>
  <div className="sk" style={{height:12,width:"60%",marginBottom:12}}/>
  <div style={{display:"flex",gap:8}}>
    <div className="sk" style={{height:22,width:64,borderRadius:20}}/>
    <div className="sk" style={{height:22,width:48,borderRadius:20}}/>
  </div>
</div>);

export const SkeletonList=({n=3})=>(<div style={{display:"grid",gap:11}}>{Array.from({length:n}).map((_,i)=><SkeletonCard key={i}/>)}</div>);

export const Avatar=({letra,size=38,img})=>{
  const colors=[
    ["#1A6ED8","#2EC4A0"],["#7B5CF0","#E05C9A"],["#E05C9A","#F5A623"],
    ["#2EC4A0","#1A6ED8"],["#F5A623","#E05C5C"],["#0F3F7A","#1A6ED8"],
  ];
  const [from,to]=colors[(letra||"?").toUpperCase().charCodeAt(0)%colors.length];
  if(img)return<div style={{width:size,height:size,borderRadius:"50%",overflow:"hidden",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,.12)"}}><img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>;
  return<div title={typeof letra==='string'&&letra.length>1?letra:undefined} style={{width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${from},${to})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:size*0.38,flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,.15)",letterSpacing:"-.5px"}}>{(letra||"?").toUpperCase()}</div>;
};

export const Tag=({tipo})=>(<span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:tipo==="oferta"?C.accentDim:"#F59E0B15",color:tipo==="oferta"?C.accent:"#92400E",border:`1px solid ${tipo==="oferta"?C.accent+"50":"#F59E0B60"}`,fontFamily:FONT,letterSpacing:.2,display:"inline-flex",alignItems:"center",gap:4}}>{tipo==="oferta"?<>🎓 Clase</>:<>🔍 Búsqueda</>}</span>);

export const StatusBadge=({activo,finalizado,pendiente})=>{
  if(finalizado)return<span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:"#4A5568",color:"#E2E8F0",letterSpacing:.2}}>Finalizado</span>;
  if(pendiente)return<span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:"#F59E0B15",color:"#B45309",border:"1px solid #F59E0B40",letterSpacing:.2}}>⏳ Pendiente</span>;
  if(activo)return<span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:"#2EC4A015",color:"#2EC4A0",border:"1px solid #2EC4A040",letterSpacing:.2}}>● Activa</span>;
  return<span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:"#71809615",color:"#718096",border:"1px solid #71809640",letterSpacing:.2}}>Pausada</span>;
};

export const VerifiedBadge=()=>(<span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:"linear-gradient(135deg,#1A6ED812,#2EC4A012)",color:C.info,border:`1px solid ${C.info}40`,fontFamily:FONT,display:"inline-flex",alignItems:"center",gap:3}}><span style={{fontSize:10}}>✓</span> Verificado</span>);

export const StarRating=({val,count,small})=>{if(!count&&!val)return <span style={{color:C.muted,fontSize:small?11:12,fontStyle:"italic"}}>Sin valoraciones</span>;const v=parseFloat(val)||0;const full=Math.round(v);return<span style={{display:"inline-flex",alignItems:"center",gap:3}}><span style={{color:"#F59E0B",fontSize:small?13:14,letterSpacing:1}}>{"★".repeat(full)}<span style={{color:C.border}}>{"★".repeat(5-full)}</span></span><span style={{color:"#B45309",fontWeight:700,fontSize:small?11:13,marginLeft:2}}>{v.toFixed(1)}</span>{count!==undefined&&<span style={{color:C.muted,fontSize:small?10:11}}>({count})</span>}</span>;};

export const Input=({style={},...props})=>(<input style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 13px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:FONT,transition:"border-color .15s",...style}}
  onFocus={e=>{e.target.style.borderColor=C.accent;e.target.style.boxShadow=`0 0 0 1px ${C.accent}`;}}
  onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none";}}
  {...props}/>);

export const Btn=({children,variant="primary",style={},...props})=>{
  const styles={
    primary:{bg:C.accent,color:"#fff",border:"none"},
    danger:{bg:C.danger,color:"#fff",border:"none"},
    success:{bg:C.success,color:"#fff",border:"none"},
    warn:{bg:C.warn,color:"#fff",border:"none"},
    info:{bg:C.info,color:"#fff",border:"none"},
    ghost:{bg:"transparent",color:C.text,border:`1px solid ${C.border}`},
    outline:{bg:"transparent",color:C.accent,border:`1px solid ${C.accent}`},
  };
  const s=styles[variant]||styles.primary;
  return(<button style={{background:s.bg,color:s.color,border:s.border,borderRadius:20,padding:"8px 20px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:FONT,transition:"all .15s",...style}}
    onMouseEnter={e=>{e.currentTarget.style.opacity=".88";e.currentTarget.style.transform="scale(1.01)";}}
    onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)";}}
    {...props}>{children}</button>);
};

export function SearchableSelect({value,onChange,options,placeholder="Todas",style={}}){
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState("");
  const ref=useRef(null);
  const inputRef=useRef(null);
  useEffect(()=>{
    const handler=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[]);
  useEffect(()=>{if(open)setTimeout(()=>inputRef.current?.focus(),50);},[open]);
  const filtered=options.filter(o=>o.toLowerCase().includes(q.toLowerCase()));
  const label=value||placeholder;
  const data=CATEGORIAS_DATA[value]||null;
  return(
    <div ref={ref} style={{position:"relative",...style}}>
      <button type="button" onClick={()=>setOpen(v=>!v)}
        style={{width:"100%",background:C.surface,border:`1px solid ${open?C.accent:C.border}`,borderRadius:8,padding:"9px 34px 9px 12px",color:value?C.text:C.muted,fontSize:13,fontFamily:FONT,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"border-color .15s",position:"relative"}}>
        {data&&<span style={{fontSize:16}}>{data.emoji}</span>}
        <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>
        <span style={{position:"absolute",right:10,color:C.muted,fontSize:11,pointerEvents:"none"}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,zIndex:200,boxShadow:"0 8px 24px rgba(0,0,0,.12)",overflow:"hidden",animation:"fadeUp .12s ease"}}>
          <div style={{padding:"8px 10px",borderBottom:`1px solid ${C.border}`}}>
            <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
              placeholder="Buscar categoría..."
              style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 10px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}
              onKeyDown={e=>e.stopPropagation()}/>
          </div>
          <div style={{maxHeight:240,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
            <button type="button" onClick={()=>{onChange("");setOpen(false);setQ("");}}
              style={{width:"100%",background:!value?"rgba(26,110,216,.06)":"transparent",border:"none",padding:"9px 12px",cursor:"pointer",fontFamily:FONT,fontSize:13,color:!value?C.accent:C.muted,textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:15}}>✕</span> {placeholder}
            </button>
            {filtered.length===0?(
              <div style={{padding:"12px",textAlign:"center",color:C.muted,fontSize:13}}>Sin resultados</div>
            ):filtered.map(opt=>{
              const d=CATEGORIAS_DATA[opt]||{emoji:"📚"};
              const sel=opt===value;
              return(
                <button type="button" key={opt} onClick={()=>{onChange(opt);setOpen(false);setQ("");}}
                  style={{width:"100%",background:sel?C.accentDim:"transparent",border:"none",padding:"9px 12px",cursor:"pointer",fontFamily:FONT,fontSize:13,color:sel?C.accent:C.text,textAlign:"left",display:"flex",alignItems:"center",gap:8,transition:"background .1s"}}
                  onMouseEnter={e=>{if(!sel)e.currentTarget.style.background=C.bg;}}
                  onMouseLeave={e=>{if(!sel)e.currentTarget.style.background="transparent";}}>
                  <span style={{fontSize:16,flexShrink:0}}>{d.emoji}</span>
                  <span style={{flex:1}}>{opt}</span>
                  {sel&&<span style={{color:C.accent,fontSize:14}}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const ErrMsg=({msg})=>msg?<div style={{color:C.danger,fontSize:12,margin:"5px 0",fontFamily:FONT,display:"flex",alignItems:"center",gap:5}}><span>⚠</span>{msg}</div>:null;
export const Label=({children})=><div style={{color:C.muted,fontSize:12,fontWeight:600,letterSpacing:.3,marginBottom:6}}>{children}</div>;
export const Modal=({children,onClose,width="min(600px,97vw)"})=>(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"8px 6px",fontFamily:FONT}} onClick={onClose}><div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,width,maxHeight:"96vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,.15)",WebkitOverflowScrolling:"touch"}} onClick={e=>e.stopPropagation()}>{children}</div></div>);
export const Chip=({label,val})=>val?(<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 14px"}}><div style={{color:C.muted,fontSize:11,marginBottom:2}}>{label}</div><div style={{color:C.text,fontWeight:600,fontSize:13}}>{val}</div></div>):null;
export const MiniStars=({val,count})=>{if(!val)return null;const v=parseFloat(val);return(<span style={{display:"inline-flex",alignItems:"center",gap:4,background:"linear-gradient(135deg,#F59E0B12,#F5C84212)",border:"1px solid #F59E0B35",borderRadius:20,padding:"3px 9px"}}><span style={{color:"#B45309",fontSize:12}}>★</span><span style={{color:"#B45309",fontSize:12,fontWeight:700}}>{v.toFixed(1)}</span>{count>0&&<span style={{color:C.muted,fontSize:11}}>({count})</span>}</span>);};

// ─── CALENDARIO CURSO ─────────────────────────────────────────────────────────
export function CalendarioCurso({post,compact=false}){
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
          return(<div key={i} onClick={()=>tc&&setDiaSelec(sel?null:d)} style={{textAlign:"center",padding:compact?"4px 1px":"5px 1px",borderRadius:7,fontSize:compact?11:12,fontWeight:tc?700:400,background:sel?C.accent:tc?C.accentDim:"transparent",color:sel?"#fff":tc?C.accent:esHoy?C.text:C.muted,border:esHoy?`1px solid ${C.border}`:"1px solid transparent",cursor:tc?"pointer":"default"}}>
            {d}{tc&&!sel&&<div style={{width:3,height:3,background:C.accent,borderRadius:"50%",margin:"1px auto 0"}}/>}
          </div>);
        })}
      </div>
      {diaSelec&&clasesDelDia(diaSelec).map((c,i)=>(<div key={i} style={{marginTop:8,background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:9,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14}}>🕐</span><div><div style={{color:C.accent,fontWeight:700,fontSize:11}}>{c.dia} {new Date(year,month,diaSelec).toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</div><div style={{color:C.text,fontSize:12}}>{c.hora_inicio} → {c.hora_fin}</div></div></div>))}
    </div>
  );
}

// ─── PALETA LUDERIS ───────────────────────────────────────────────────────────
export const LUD={
  blue:"#1A6ED8",
  teal:"#2EC4A0",
  dark:"#0F3F7A",
  grad:"linear-gradient(135deg,#1A6ED8 0%,#2EC4A0 100%)",
  gradDark:"linear-gradient(135deg,#0F3F7A 0%,#1A6ED8 60%,#2EC4A0 100%)",
};

// ─── MP RETORNO HOOK ──────────────────────────────────────────────────────────
// Maneja el retorno de MercadoPago (?mp=success|pending|failure)
// Se ubica en shared porque App.js lo necesita al cargar, antes de que CursoPage sea lazy-loaded
export function useMPRetorno(onSuccess){
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const mp=params.get("mp");
    if(!mp)return;
    const url=new URL(window.location.href);
    url.searchParams.delete("mp");
    url.searchParams.delete("pub");
    window.history.replaceState({},"",url.toString());
    if(mp==="success"){
      toast("¡Pago aprobado! Ya tenés acceso a la clase 🎉","success",6000);
      try{const p=JSON.parse(localStorage.getItem("mp_pending")||"{}");if(p.pub_id)onSuccess(p.pub_id);}catch{}
      try{localStorage.removeItem("mp_pending");}catch{}
    }else if(mp==="pending"){
      toast("El pago está siendo procesado. Te avisaremos cuando se confirme.","info",6000);
    }else if(mp==="failure"){
      toast("El pago no pudo completarse. Podés intentar de nuevo.","error",5000);
    }
  },[]);// eslint-disable-line
}

// ─── HOOKS DE UTILIDAD ────────────────────────────────────────────────────────
export function useDebounce(value, delay=300){
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(()=>{
    const t = setTimeout(()=>setDebouncedValue(value), delay);
    return ()=>clearTimeout(t);
  },[value, delay]);
  return debouncedValue;
}

export function useIntersectionObserver(ref, options={}){
  const [isIntersecting, setIsIntersecting] = useState(false);
  useEffect(()=>{
    if(!ref.current) return;
    const obs = new IntersectionObserver(([entry])=>setIsIntersecting(entry.isIntersecting), options);
    obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[ref, options.threshold, options.rootMargin]);// eslint-disable-line
  return isIntersecting;
}
