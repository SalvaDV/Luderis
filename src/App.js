import React, { useState, useEffect, useCallback, useRef } from "react";
import * as sb from "./supabase";

// Temas claro/oscuro — se sobreescribe en runtime via window.__CL_THEME
const THEMES={
  dark:{bg:"#080F1C",surface:"#0E1829",card:"#131E2F",border:"#1E2D42",accent:"#2EC4A0",accentDim:"#2EC4A015",text:"#E8EFF8",muted:"#5C7A9A",success:"#2EC4A0",danger:"#E05C5C",sidebar:"#080F1C",info:"#1A6ED8",purple:"#7B5CF0",warn:"#E0955C",sidebarBorder:"#1E2D42"},
  light:{bg:"#F6F9FF",surface:"#FFFFFF",card:"#FFFFFF",border:"#DDE5F5",accent:"#1A6ED8",accentDim:"#1A6ED810",text:"#0D1F3C",muted:"#5A7294",success:"#2EC4A0",danger:"#E53E3E",sidebar:"#FFFFFF",info:"#1A6ED8",purple:"#7B5CF0",warn:"#DD8A1A",sidebarBorder:"#DDE5F5"},
};
let _themeKey=()=>{try{return localStorage.getItem("cl_theme")||"light";}catch{return "light";}};
const C={...THEMES[_themeKey()]};
function applyTheme(key){Object.assign(C,THEMES[key]||THEMES.dark);try{localStorage.setItem("cl_theme",key);}catch{}}
const FONT="-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";
const MATERIAS=["Idiomas","Arte y Creatividad","Música","Deportes y Actividad Física","Cocina y Gastronomía","Desarrollo Personal y Bienestar","Negocios y Finanzas","Marketing y Comunicación","Programación y Tecnología","Diseño y Multimedia","Ciencia y Matemática","Humanidades y Ciencias Sociales","Oficios y Manualidades","Educación y Tutorías","Conducción y Manejo","Animales y Cuidado","Hobbies y Tiempo Libre","Viajes y Cultura","Otros"];

// Datos visuales de cada categoría para la pantalla home
const CATEGORIAS_DATA={
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
const avatarColor=(l)=>["#F5C842","#4ECB71","#E05C5C","#5CA8E0","#C85CE0"][(l||"?").toUpperCase().charCodeAt(0)%5];
const fmt=(d)=>d?new Date(d).toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"}):"";

// ─── SISTEMA DE IDIOMA ────────────────────────────────────────────────────────
// Idioma global mutable — mismo patrón que C para no necesitar contexto React
let _langKey=()=>{try{return localStorage.getItem("cl_lang")||"es";}catch{return "es";}};
let _LANG=_langKey();
const setLang=(l)=>{_LANG=l;try{localStorage.setItem("cl_lang",l);}catch{}};

const STRINGS={
  es:{
    explore:"Explorar",agenda:"Mi agenda",chats:"Mis chats",favorites:"Favoritos",
    classes:"Mis clases",account:"Mi cuenta",newPost:"+ Publicar",
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
// t("key") → string en idioma actual
const t=(key)=>STRINGS[_LANG]?.[key]??STRINGS.es[key]??key;

// ─── PRIVACIDAD: nunca mostrar email completo a otros usuarios ─────────────────
// Usa display_name o nombre si existen; como fallback muestra solo la parte
// antes del @ truncada. El email completo NUNCA se renderiza en UI pública.
const maskEmail=(email)=>{
  if(!email)return"Usuario";
  const local=email.split("@")[0];
  if(local.length<=3)return local+"***";
  return local.slice(0,3)+"***";
};
// Nombre público seguro: prioriza display_name/nombre, nunca expone email completo
const safeDisplayName=(nombre,email)=>{
  if(nombre&&nombre.trim()&&!nombre.includes("@"))return nombre.trim();
  if(email)return maskEmail(email);
  return"Usuario";
};
// Detección de emails/teléfonos en texto libre (para el chat)
const CONTACT_REGEX=/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(\+?[\d\s\-().]{8,15}\d)|(instagram|ig|wa|whatsapp|telegram|tg|signal)\s*[:=@]?\s*\w+)/gi;
const sanitizeContactInfo=(text)=>{
  if(!text)return text;
  return text.replace(CONTACT_REGEX,(match)=>{
    if(/\d/.test(match)&&match.replace(/\D/g,"").length>=7)return"[📵 dato de contacto oculto]";
    if(match.includes("@"))return"[📧 email oculto]";
    return"[📵 contacto externo oculto]";
  });
};

const fmtRel=(d)=>{if(!d)return"";const diff=(Date.now()-new Date(d))/1000;if(diff<60)return"ahora";if(diff<3600)return`hace ${Math.floor(diff/60)}min`;if(diff<86400)return`hace ${Math.floor(diff/3600)}h`;if(diff<604800)return`hace ${Math.floor(diff/86400)}d`;return fmt(d);};
const MONEDA_SYM={"ARS":"$","USD":"US$","EUR":"€","BRL":"R$","CLP":"CLP$","COP":"COL$","MXN":"MX$","UYU":"$U","PEN":"S/","BOB":"Bs","PYG":"₲"};
const fmtPrice=(p,moneda)=>{if(!p)return "A convenir";const sym=MONEDA_SYM[moneda]||moneda||"$";return `${sym}${Number(p).toLocaleString("es-AR")}`;};
const calcAvg=(arr)=>{if(!arr||!arr.length)return null;return arr.reduce((a,r)=>a+(r.estrellas||0),0)/arr.length;};
const calcDuracion=(ini,fin)=>{if(!ini||!fin)return null;const d=Math.round((new Date(fin)-new Date(ini))/(86400000));if(d<=0)return null;if(d<7)return `${d} día${d!==1?"s":""}`;if(d<30)return `${Math.round(d/7)} semana${Math.round(d/7)!==1?"s":""}`;return `${Math.round(d/30)} mes${Math.round(d/30)!==1?"es":""}`;};

const Spinner=({small})=>(<div style={{display:"flex",justifyContent:"center",padding:small?"4px":"32px 0"}}><div style={{width:small?16:26,height:small?16:26,border:`2px solid ${C.border}`,borderTop:`2px solid ${C.accent}`,borderRadius:"50%",animation:"spin .7s linear infinite"}}/></div>);
const Avatar=({letra,size=38,img})=>{
  if(img)return<img src={img} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`1px solid ${C.border}`}}/>;
  const colors=[["#DBEAFE","#1D4ED8"],["#DCFCE7","#15803D"],["#FEF3C7","#B45309"],["#FCE7F3","#9D174D"],["#EDE9FE","#6D28D9"]];
  const [bg,fg]=colors[(letra||"?").toUpperCase().charCodeAt(0)%5];
  return(<div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:size*.38,color:fg,flexShrink:0,fontFamily:FONT,border:`1px solid ${bg}`}}>{(letra||"?")[0].toUpperCase()}</div>);
};
const Tag=({tipo})=>(<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:tipo==="oferta"?C.accentDim:"#F59E0B12",color:tipo==="oferta"?C.accent:"#B45309",border:`1px solid ${tipo==="oferta"?C.accent+"30":"#F59E0B30"}`,fontFamily:FONT}}>{tipo==="oferta"?"Oferta":"Búsqueda"}</span>);
const StatusBadge=({activo,finalizado,pendiente})=>{
  if(finalizado)return<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:"#0A66C212",color:C.info,border:`1px solid ${C.info}30`,fontFamily:FONT}}>✓ Finalizada</span>;
  if(pendiente)return<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:"#F59E0B12",color:"#B45309",border:"1px solid #F59E0B30",fontFamily:FONT}}>⏳ Pendiente validación</span>;
  return<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:activo?C.success+"15":C.danger+"12",color:activo?C.success:C.danger,border:`1px solid ${activo?C.success+"30":C.danger+"30"}`,fontFamily:FONT}}>{activo?"● Activa":"○ Pausada"}</span>;
};
const VerifiedBadge=()=>(<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:C.info+"12",color:C.info,border:`1px solid ${C.info}30`,fontFamily:FONT}}>✓ Verificado</span>);
const StarRating=({val,count,small})=>{if(!count&&!val)return <span style={{color:C.muted,fontSize:small?11:12,fontStyle:"italic"}}>Sin valoraciones</span>;const v=parseFloat(val)||0;return <span style={{color:"#B45309",fontSize:small?12:13}}>{"★".repeat(Math.round(v))}{"☆".repeat(5-Math.round(v))}<span style={{color:C.muted,marginLeft:4,fontSize:small?11:12}}>{v.toFixed(1)}{count!==undefined&&` (${count})`}</span></span>;};
const Input=({style={},...props})=>(<input style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 13px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:FONT,transition:"border-color .15s",...style}}
  onFocus={e=>{e.target.style.borderColor=C.accent;e.target.style.boxShadow=`0 0 0 1px ${C.accent}`;}}
  onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none";}}
  {...props}/>);
const Btn=({children,variant="primary",style={},...props})=>{
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
// ─── SELECT CON BÚSQUEDA INTEGRADA ────────────────────────────────────────────
function SearchableSelect({value,onChange,options,placeholder="Todas",style={}}){
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState("");
  const ref=useRef(null);
  const inputRef=useRef(null);

  // Cerrar al hacer click afuera
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
      {/* Trigger */}
      <button type="button" onClick={()=>setOpen(v=>!v)}
        style={{width:"100%",background:C.surface,border:`1px solid ${open?C.accent:C.border}`,borderRadius:8,padding:"9px 34px 9px 12px",color:value?C.text:C.muted,fontSize:13,fontFamily:FONT,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"border-color .15s",position:"relative"}}>
        {data&&<span style={{fontSize:16}}>{data.emoji}</span>}
        <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>
        <span style={{position:"absolute",right:10,color:C.muted,fontSize:11,pointerEvents:"none"}}>{open?"▲":"▼"}</span>
      </button>

      {/* Dropdown */}
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,zIndex:200,boxShadow:"0 8px 24px rgba(0,0,0,.12)",overflow:"hidden",animation:"fadeUp .12s ease"}}>
          {/* Search input dentro del dropdown */}
          <div style={{padding:"8px 10px",borderBottom:`1px solid ${C.border}`}}>
            <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
              placeholder="Buscar categoría..."
              style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 10px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}
              onKeyDown={e=>e.stopPropagation()}/>
          </div>
          {/* Lista */}
          <div style={{maxHeight:240,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
            {/* Opción "Todas" */}
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

const ErrMsg=({msg})=>msg?<div style={{color:C.danger,fontSize:12,margin:"5px 0",fontFamily:FONT,display:"flex",alignItems:"center",gap:5}}><span>⚠</span>{msg}</div>:null;
const Label=({children})=><div style={{color:C.muted,fontSize:12,fontWeight:600,letterSpacing:.3,marginBottom:6}}>{children}</div>;
const Modal=({children,onClose,width="min(600px,97vw)"})=>(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"8px 6px",fontFamily:FONT}} onClick={onClose}><div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,width,maxHeight:"96vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,.15)",WebkitOverflowScrolling:"touch"}} onClick={e=>e.stopPropagation()}>{children}</div></div>);
const Chip=({label,val})=>val?(<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 14px"}}><div style={{color:C.muted,fontSize:11,marginBottom:2}}>{label}</div><div style={{color:C.text,fontWeight:600,fontSize:13}}>{val}</div></div>):null;
const MiniStars=({val,count})=>{if(!val)return null;const v=parseFloat(val);return(<span style={{display:"inline-flex",alignItems:"center",gap:3,background:"#F59E0B12",border:"1px solid #F59E0B30",borderRadius:4,padding:"2px 7px"}}><span style={{color:"#B45309",fontSize:12}}>★</span><span style={{color:"#B45309",fontSize:12,fontWeight:600}}>{v.toFixed(1)}</span>{count>0&&<span style={{color:C.muted,fontSize:11}}>({count})</span>}</span>);};

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
          return(<div key={i} onClick={()=>tc&&setDiaSelec(sel?null:d)} style={{textAlign:"center",padding:compact?"4px 1px":"5px 1px",borderRadius:7,fontSize:compact?11:12,fontWeight:tc?700:400,background:sel?C.accent:tc?C.accentDim:"transparent",color:sel?"#fff":tc?C.accent:esHoy?C.text:C.muted,border:esHoy?`1px solid ${C.border}`:"1px solid transparent",cursor:tc?"pointer":"default"}}>
            {d}{tc&&!sel&&<div style={{width:3,height:3,background:C.accent,borderRadius:"50%",margin:"1px auto 0"}}/>}
          </div>);
        })}
      </div>
      {diaSelec&&clasesDelDia(diaSelec).map((c,i)=>(<div key={i} style={{marginTop:8,background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:9,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14}}>🕐</span><div><div style={{color:C.accent,fontWeight:700,fontSize:11}}>{c.dia} {new Date(year,month,diaSelec).toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</div><div style={{color:C.text,fontSize:12}}>{c.hora_inicio} → {c.hora_fin}</div></div></div>))}
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
// ─── PALETA LUDERIS (extraída del logo: azul #1E6FD9 → teal #2EC4A0) ──────────
const LUD={
  blue:"#1A6ED8",
  teal:"#2EC4A0",
  dark:"#0F3F7A",
  grad:"linear-gradient(135deg,#1A6ED8 0%,#2EC4A0 100%)",
  gradDark:"linear-gradient(135deg,#0F3F7A 0%,#1A6ED8 60%,#2EC4A0 100%)",
};

function LandingPage({onEnter}){
  const [hovBtn,setHovBtn]=useState(false);
  const [seccion,setSeccion]=useState("inicio");// inicio | nosotros | contacto
  const [contactForm,setContactForm]=useState({nombre:"",email:"",msg:""});
  const [contactOk,setContactOk]=useState(false);

  const scrollTo=(id)=>{document.getElementById(id)?.scrollIntoView({behavior:"smooth"});};

  return(
    <div style={{minHeight:"100vh",background:"#F6F9FF",fontFamily:FONT,overflowX:"hidden"}}>
      <style>{`
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .ld-hero{animation:fadeSlideUp .7s ease both}
        .ld-hero2{animation:fadeSlideUp .7s .15s ease both;opacity:0;animation-fill-mode:forwards}
        .ld-hero3{animation:fadeSlideUp .7s .3s ease both;opacity:0;animation-fill-mode:forwards}
        .ld-hero4{animation:fadeSlideUp .7s .45s ease both;opacity:0;animation-fill-mode:forwards}
        .ld-logo-float{animation:floatY 4s ease-in-out infinite}
        .ld-card:hover{transform:translateY(-5px);box-shadow:0 16px 48px rgba(26,110,216,.14)!important}
        .ld-card{transition:transform .28s,box-shadow .28s}
        .ld-step:hover .ld-step-n{background:${LUD.grad};color:#fff}
        .ld-step-n{transition:background .2s,color .2s}
        .ld-nav-link{background:none;border:none;cursor:pointer;font-size:14px;font-weight:500;color:#4A5568;padding:6px 12px;border-radius:8px;transition:color .15s,background .15s;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
        .ld-nav-link:hover{color:#1A6ED8;background:rgba(26,110,216,.07)}
        .ld-nav-link.active{color:#1A6ED8;font-weight:600}
        .ld-input{width:100%;background:#F4F7FF;border:1.5px solid #DDE5F5;border-radius:10px;padding:11px 14px;color:#0D1F3C;font-size:14px;outline:none;box-sizing:border-box;font-family:-apple-system,sans-serif;transition:border-color .15s,background .15s;margin-bottom:12px}
        .ld-input:focus{border-color:#1A6ED8;background:#fff}
        .ld-orb1{animation:floatY 6s 0s ease-in-out infinite}
        .ld-orb2{animation:floatY 6s 1.5s ease-in-out infinite}
        .ld-orb3{animation:floatY 6s 3s ease-in-out infinite}
        @media(max-width:768px){.ld-hide-mobile{display:none!important}.ld-hero-flex{flex-direction:column!important;text-align:center}.ld-hero-btns{justify-content:center!important}}
      `}</style>

      {/* ══ NAV ══ */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(246,249,255,.92)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(26,110,216,.08)",padding:"0 32px",height:66,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 20px rgba(26,110,216,.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src="/logo.png" alt="Luderis" style={{width:36,height:36,objectFit:"contain"}} className="ld-logo-float"/>
          <span style={{fontWeight:800,fontSize:21,background:LUD.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-.4px"}}>Luderis</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}} className="ld-hide-mobile">
          {[["inicio","Inicio"],["features","Funciones"],["como","¿Cómo funciona?"],["nosotros","Sobre nosotros"],["contacto","Contacto"]].map(([id,label])=>(
            <button key={id} className="ld-nav-link" onClick={()=>scrollTo(id)}>{label}</button>
          ))}
        </div>
        <button onClick={onEnter}
          style={{background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"9px 22px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 14px rgba(26,110,216,.3)",transition:"box-shadow .2s"}}
          onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(26,110,216,.45)"}
          onMouseLeave={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(26,110,216,.3)"}>
          Ingresar →
        </button>
      </nav>

      {/* ══ HERO ══ */}
      <section id="inicio" style={{maxWidth:1100,margin:"0 auto",padding:"88px 32px 64px",display:"flex",alignItems:"center",gap:60,flexWrap:"wrap"}} className="ld-hero-flex">
        <div style={{flex:"1 1 420px",minWidth:0}}>
          <div className="ld-hero" style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(26,110,216,.08)",border:"1px solid rgba(26,110,216,.18)",borderRadius:20,padding:"5px 16px",marginBottom:26}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:LUD.teal,display:"inline-block",animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:12,fontWeight:600,color:LUD.blue}}>Plataforma educativa argentina</span>
          </div>
          <h1 className="ld-hero" style={{fontSize:"clamp(34px,4.5vw,56px)",fontWeight:800,lineHeight:1.1,color:"#0D1F3C",margin:"0 0 22px",letterSpacing:"-1px"}}>
            Aprendé lo que<br/>
            <span style={{background:LUD.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>quieras, enseñá</span><br/>lo que sabés.
          </h1>
          <p className="ld-hero2" style={{fontSize:17,color:"#4A5568",lineHeight:1.75,margin:"0 0 16px",maxWidth:460}}>
            Conectamos personas para compartir conocimiento. Sin intermediarios, sin comisiones.
          </p>
          <div className="ld-hero3 ld-hero-btns" style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:32}}>
            <button onClick={onEnter}
              onMouseEnter={()=>setHovBtn(true)} onMouseLeave={()=>setHovBtn(false)}
              style={{background:LUD.grad,border:"none",borderRadius:24,color:"#fff",padding:"14px 32px",fontWeight:700,fontSize:16,cursor:"pointer",fontFamily:FONT,
                boxShadow:hovBtn?"0 10px 32px rgba(26,110,216,.5)":"0 4px 18px rgba(26,110,216,.3)",
                transform:hovBtn?"translateY(-2px)":"none",transition:"all .2s"}}>
              Empezar gratis →
            </button>
            <button onClick={()=>scrollTo("features")}
              style={{background:"transparent",border:"2px solid rgba(26,110,216,.22)",borderRadius:24,color:LUD.blue,padding:"14px 24px",fontWeight:600,fontSize:15,cursor:"pointer",fontFamily:FONT,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=LUD.blue;e.currentTarget.style.background="rgba(26,110,216,.05)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(26,110,216,.22)";e.currentTarget.style.background="transparent";}}>
              Ver funciones
            </button>
          </div>
          {/* Stats rápidos */}
          <div className="ld-hero4" style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            {[["100%","Gratuito"],["IA","Búsqueda inteligente"],["🔒","Datos protegidos"]].map(([n,l])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:7}}>
                <span style={{fontWeight:800,fontSize:16,background:LUD.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{n}</span>
                <span style={{fontSize:13,color:"#718096"}}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Ilustración */}
        <div style={{flex:"0 0 320px",position:"relative",height:340,display:"flex",alignItems:"center",justifyContent:"center"}} className="ld-hide-mobile">
          <div className="ld-orb1" style={{position:"absolute",width:220,height:220,borderRadius:"50%",background:"rgba(26,110,216,.05)",top:10,left:10}}/>
          <div className="ld-orb2" style={{position:"absolute",width:150,height:150,borderRadius:"50%",background:"rgba(46,196,160,.07)",bottom:20,right:0}}/>
          <div className="ld-orb3" style={{position:"absolute",width:90,height:90,borderRadius:"50%",background:"rgba(26,110,216,.09)",top:0,right:30}}/>
          <div style={{position:"relative",zIndex:1,width:155,height:155,background:"#fff",borderRadius:32,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 24px 64px rgba(26,110,216,.18)",animation:"floatY 4s ease-in-out infinite"}}>
            <img src="/logo.png" alt="Luderis" style={{width:106,height:106,objectFit:"contain"}}/>
          </div>
          {[
            {label:"✓ Clases verificadas",top:18,left:-30,delay:"0s"},
            {label:"★ 4.9 promedio",bottom:44,right:-38,delay:".8s"},
            {label:"🤖 Búsqueda IA",top:64,right:-44,delay:"1.4s"},
          ].map(c=>(
            <div key={c.label} style={{position:"absolute",top:c.top,bottom:c.bottom,left:c.left,right:c.right,background:"#fff",borderRadius:20,padding:"8px 14px",fontSize:12,fontWeight:600,color:"#0D1F3C",boxShadow:"0 6px 22px rgba(0,0,0,.09)",whiteSpace:"nowrap",animation:`floatY 4s ${c.delay} ease-in-out infinite`}}>
              {c.label}
            </div>
          ))}
        </div>
      </section>

      {/* ══ MÉTRICAS ══ */}
      <section style={{background:"#fff",borderTop:"1px solid #EEF2FF",borderBottom:"1px solid #EEF2FF",padding:"32px 32px"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:24}}>
          {[["Gratuito siempre","Para docentes y alumnos"],["IA integrada","Búsqueda inteligente de clases"],["100% argentino","Pensado para el mercado local"],["Privacidad","Tus datos, tus reglas"]].map(([n,d])=>(
            <div key={n} style={{textAlign:"center"}}>
              <div style={{fontWeight:800,fontSize:20,background:LUD.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>{n}</div>
              <div style={{fontSize:13,color:"#718096"}}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" style={{maxWidth:1100,margin:"0 auto",padding:"80px 32px"}}>
        <div style={{textAlign:"center",marginBottom:52}}>
          <div style={{display:"inline-block",background:"rgba(26,110,216,.08)",border:"1px solid rgba(26,110,216,.15)",borderRadius:20,padding:"4px 16px",fontSize:12,fontWeight:600,color:LUD.blue,marginBottom:14}}>Funciones</div>
          <h2 style={{fontSize:34,fontWeight:800,color:"#0D1F3C",margin:"0 0 12px",letterSpacing:"-.6px"}}>Todo lo que necesitás</h2>
          <p style={{color:"#718096",fontSize:16,margin:0,maxWidth:480,marginLeft:"auto",marginRight:"auto"}}>Una plataforma pensada para el aprendizaje real, sin fricciones</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20}}>
          {[
            {icon:"🎯",title:"Clases particulares",desc:"Encontrá docentes disponibles para tu tema y horario, con precios transparentes desde el primer momento.",grad:"rgba(26,110,216,.06)",border:"rgba(26,110,216,.12)"},
            {icon:"📚",title:"Cursos completos",desc:"Cursos síncronos y asíncronos con contenido estructurado, evaluaciones propias y certificados descargables.",grad:"rgba(46,196,160,.06)",border:"rgba(46,196,160,.18)"},
            {icon:"🤖",title:"Búsqueda con IA",desc:"Describí con tus palabras lo que necesitás y nuestra IA encuentra las mejores opciones para vos.",grad:"rgba(123,92,240,.06)",border:"rgba(123,92,240,.15)"},
            {icon:"📊",title:"Seguimiento real",desc:"Evaluaciones, notas, habilidades y progreso del alumno en un solo panel. Para docentes y estudiantes.",grad:"rgba(245,158,11,.06)",border:"rgba(245,158,11,.18)"},
            {icon:"💬",title:"Chat integrado",desc:"Comunicación directa entre docente y alumno sin salir de la plataforma. Sin exponer datos personales.",grad:"rgba(46,196,160,.06)",border:"rgba(46,196,160,.18)"},
            {icon:"🔒",title:"Privacidad primero",desc:"Los emails y datos de contacto nunca se exponen. Vos decidís cuándo compartir tu información.",grad:"rgba(26,110,216,.06)",border:"rgba(26,110,216,.12)"},
          ].map(f=>(
            <div key={f.title} className="ld-card"
              style={{background:"#fff",border:`1px solid ${f.border}`,borderRadius:18,padding:"28px 24px",boxShadow:"0 2px 14px rgba(0,0,0,.03)"}}>
              <div style={{width:54,height:54,borderRadius:14,background:f.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,marginBottom:16}}>{f.icon}</div>
              <h3 style={{fontWeight:700,color:"#0D1F3C",fontSize:17,margin:"0 0 9px"}}>{f.title}</h3>
              <p style={{color:"#718096",fontSize:14,lineHeight:1.65,margin:0}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CÓMO FUNCIONA ══ */}
      <section id="como" style={{background:"#fff",padding:"80px 32px",borderTop:"1px solid #EEF2FF",borderBottom:"1px solid #EEF2FF"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <div style={{display:"inline-block",background:"rgba(46,196,160,.1)",border:"1px solid rgba(46,196,160,.25)",borderRadius:20,padding:"4px 16px",fontSize:12,fontWeight:600,color:LUD.teal,marginBottom:14}}>¿Cómo funciona?</div>
            <h2 style={{fontSize:34,fontWeight:800,color:"#0D1F3C",margin:"0 0 12px",letterSpacing:"-.6px"}}>Simple y rápido</h2>
            <p style={{color:"#718096",fontSize:16,margin:0}}>En menos de 5 minutos ya estás conectado</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:32}}>
            {[
              {n:"1",title:t("createAccount"),desc:"Registrarte es gratis y toma menos de un minuto. Solo necesitás un email.",icon:"✉️"},
              {n:"2",title:"Explorá o publicá",desc:"Buscá clases disponibles o publicá lo que enseñás. La IA te ayuda a encontrar lo mejor.",icon:"🔍"},
              {n:"3",title:"Conectá directamente",desc:"Chateá con el docente o alumno sin intermediarios. Acordá precio y horario.",icon:"💬"},
              {n:"4",title:"Aprendé o enseñá",desc:"Seguí el progreso, hacé evaluaciones y descargá certificados cuando termines.",icon:"🎓"},
            ].map((s,i)=>(
              <div key={s.n} className="ld-step" style={{textAlign:"center"}}>
                <div className="ld-step-n" style={{width:52,height:52,borderRadius:"50%",border:`2px solid ${LUD.blue}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontWeight:800,fontSize:20,color:LUD.blue}}>
                  {s.n}
                </div>
                <div style={{fontSize:26,marginBottom:10}}>{s.icon}</div>
                <h3 style={{fontWeight:700,color:"#0D1F3C",fontSize:16,margin:"0 0 8px"}}>{s.title}</h3>
                <p style={{color:"#718096",fontSize:14,lineHeight:1.6,margin:0}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SOBRE NOSOTROS ══ */}
      <section id="nosotros" style={{maxWidth:1100,margin:"0 auto",padding:"80px 32px"}}>
        <div style={{display:"flex",gap:60,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:"1 1 340px"}}>
            <div style={{display:"inline-block",background:"rgba(123,92,240,.08)",border:"1px solid rgba(123,92,240,.2)",borderRadius:20,padding:"4px 16px",fontSize:12,fontWeight:600,color:"#7B5CF0",marginBottom:18}}>Sobre nosotros</div>
            <h2 style={{fontSize:34,fontWeight:800,color:"#0D1F3C",margin:"0 0 18px",letterSpacing:"-.6px",lineHeight:1.15}}>Creemos en el poder de compartir conocimiento</h2>
            <p style={{color:"#4A5568",fontSize:15,lineHeight:1.8,margin:"0 0 16px"}}>
              Luderis nació de una idea simple: que el conocimiento no debería tener barreras. Somos un equipo argentino que construyó una plataforma donde cualquier persona puede enseñar lo que sabe o aprender lo que necesita, de forma directa y sin complicaciones.
            </p>
            <p style={{color:"#4A5568",fontSize:15,lineHeight:1.8,margin:"0 0 28px"}}>
              Creemos que la mejor educación ocurre cuando hay una conexión real entre personas. Por eso ponemos el foco en facilitar ese encuentro — sin intermediarios, sin comisiones ocultas, y con herramientas que hacen que la experiencia sea lo mejor posible para ambas partes.
            </p>
            <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
              {[["🌎","100% argentino"],["💡","Innovación educativa"],["🤝","Comunidad primero"]].map(([icon,label])=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:8,background:"#F4F7FF",borderRadius:20,padding:"8px 16px"}}>
                  <span>{icon}</span>
                  <span style={{fontSize:13,fontWeight:600,color:"#0D1F3C"}}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{flex:"1 1 320px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {[
              {icon:"🎓",title:"Misión",desc:"Democratizar el acceso al conocimiento conectando personas que quieren aprender con quienes quieren enseñar."},
              {icon:"🔭",title:"Visión",desc:"Ser la plataforma de referencia en Argentina para el intercambio de conocimiento entre personas."},
              {icon:"⚡",title:"Tecnología",desc:"IA integrada, evaluaciones automatizadas y seguimiento de progreso para una experiencia de aprendizaje moderna."},
              {icon:"🔒",title:"Confianza",desc:"Privacidad y seguridad en cada interacción. Tus datos son tuyos, siempre."},
            ].map(v=>(
              <div key={v.title} style={{background:"#fff",border:"1px solid #EEF2FF",borderRadius:14,padding:"20px 18px",boxShadow:"0 2px 12px rgba(0,0,0,.03)"}}>
                <div style={{fontSize:26,marginBottom:10}}>{v.icon}</div>
                <div style={{fontWeight:700,color:"#0D1F3C",fontSize:15,marginBottom:6}}>{v.title}</div>
                <p style={{color:"#718096",fontSize:13,lineHeight:1.6,margin:0}}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIOS ══ */}
      <section style={{background:"linear-gradient(135deg,#F0F4FF 0%,#F0FBF8 100%)",padding:"80px 32px",borderTop:"1px solid #EEF2FF"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <h2 style={{fontSize:32,fontWeight:800,color:"#0D1F3C",margin:"0 0 10px",letterSpacing:"-.5px"}}>Lo que dicen nuestros usuarios</h2>
            <p style={{color:"#718096",fontSize:15,margin:0}}>Historias reales de docentes y estudiantes</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
            {[
              {nombre:"Valentina R.",rol:"Estudiante de inglés",texto:"Encontré a mi profesora en minutos. La búsqueda con IA me sugirió exactamente lo que necesitaba. Empecé en dos días.",stars:5},
              {nombre:"Lucas M.",rol:"Docente de matemáticas",texto:"Publiqué mis clases y en la primera semana ya tenía alumnos. La plataforma es increíblemente fácil de usar.",stars:5},
              {nombre:"Sofía B.",rol:"Estudiante de programación",texto:"Me gustó que el docente y yo pudimos charlar primero sin dar datos personales. Muy seguro y cómodo.",stars:5},
            ].map(t=>(
              <div key={t.nombre} className="ld-card" style={{background:"#fff",borderRadius:16,padding:"24px 22px",boxShadow:"0 2px 16px rgba(26,110,216,.07)",border:"1px solid rgba(26,110,216,.08)"}}>
                <div style={{color:"#F5A623",fontSize:16,marginBottom:12}}>{"★".repeat(t.stars)}</div>
                <p style={{color:"#2D3748",fontSize:14,lineHeight:1.7,margin:"0 0 16px",fontStyle:"italic"}}>"{t.texto}"</p>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:LUD.grad,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:15}}>{t.nombre[0]}</div>
                  <div>
                    <div style={{fontWeight:700,color:"#0D1F3C",fontSize:13}}>{t.nombre}</div>
                    <div style={{color:"#718096",fontSize:12}}>{t.rol}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CONTACTO ══ */}
      <section id="contacto" style={{maxWidth:900,margin:"0 auto",padding:"80px 32px"}}>
        <div style={{display:"flex",gap:56,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{flex:"1 1 280px"}}>
            <div style={{display:"inline-block",background:"rgba(26,110,216,.08)",border:"1px solid rgba(26,110,216,.15)",borderRadius:20,padding:"4px 16px",fontSize:12,fontWeight:600,color:LUD.blue,marginBottom:18}}>Contacto</div>
            <h2 style={{fontSize:30,fontWeight:800,color:"#0D1F3C",margin:"0 0 14px",letterSpacing:"-.5px"}}>¿Tenés alguna pregunta?</h2>
            <p style={{color:"#4A5568",fontSize:15,lineHeight:1.75,margin:"0 0 28px"}}>Escribinos y te respondemos a la brevedad. También podés enviarnos un mail directamente.</p>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {[
                {icon:"✉️",label:"Email",val:"contacto@luderis.com"},
                {icon:"📍",label:"Ubicación",val:"Buenos Aires, Argentina"},
                {icon:"🕐",label:"Respuesta",val:"Menos de 24 horas"},
              ].map(c=>(
                <div key={c.label} style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:40,height:40,borderRadius:10,background:"rgba(26,110,216,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{c.icon}</div>
                  <div>
                    <div style={{fontSize:11,color:"#718096",fontWeight:600,letterSpacing:.3}}>{c.label.toUpperCase()}</div>
                    <div style={{fontSize:14,color:"#0D1F3C",fontWeight:500}}>{c.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{flex:"1 1 320px"}}>
            {contactOk?(
              <div style={{background:"linear-gradient(135deg,rgba(46,196,160,.08),rgba(26,110,216,.06))",border:"1px solid rgba(46,196,160,.25)",borderRadius:16,padding:"40px 32px",textAlign:"center"}}>
                <div style={{fontSize:44,marginBottom:14}}>✓</div>
                <div style={{fontWeight:700,color:"#0D1F3C",fontSize:18,marginBottom:8}}>¡Mensaje enviado!</div>
                <p style={{color:"#718096",fontSize:14,margin:0}}>Te respondemos en menos de 24 horas a {contactForm.email}.</p>
              </div>
            ):(
              <div style={{background:"#fff",border:"1px solid #EEF2FF",borderRadius:16,padding:"28px 24px",boxShadow:"0 4px 24px rgba(26,110,216,.07)"}}>
                <div style={{fontWeight:700,color:"#0D1F3C",fontSize:16,marginBottom:18}}>Envianos un mensaje</div>
                <input className="ld-input" placeholder="Tu nombre" value={contactForm.nombre} onChange={e=>setContactForm(p=>({...p,nombre:e.target.value}))}/>
                <input className="ld-input" type="email" placeholder="Tu email" value={contactForm.email} onChange={e=>setContactForm(p=>({...p,email:e.target.value}))}/>
                <textarea className="ld-input" placeholder="¿En qué te podemos ayudar?" rows={4} value={contactForm.msg} onChange={e=>setContactForm(p=>({...p,msg:e.target.value}))} style={{resize:"vertical",minHeight:100}}/>
                <button onClick={()=>{if(contactForm.nombre&&contactForm.email&&contactForm.msg)setContactOk(true);}}
                  style={{width:"100%",background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"13px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 14px rgba(26,110,216,.3)"}}>
                  Enviar mensaje →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section style={{margin:"0 24px 80px",borderRadius:24,background:LUD.gradDark,padding:"64px 40px",textAlign:"center",position:"relative",overflow:"hidden",maxWidth:1052,marginLeft:"auto",marginRight:"auto"}}>
        <div style={{position:"absolute",width:320,height:320,borderRadius:"50%",background:"rgba(255,255,255,.04)",top:-90,right:-90,pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:220,height:220,borderRadius:"50%",background:"rgba(46,196,160,.08)",bottom:-70,left:-50,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{width:68,height:68,borderRadius:20,background:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",backdropFilter:"blur(8px)"}}>
            <img src="/logo.png" alt="Luderis" style={{width:46,height:46,objectFit:"contain"}}/>
          </div>
          <h2 style={{color:"#fff",fontSize:36,fontWeight:800,margin:"0 0 14px",letterSpacing:"-.6px"}}>Empezá hoy, es gratis</h2>
          <p style={{color:"rgba(255,255,255,.72)",fontSize:16,margin:"0 0 32px",maxWidth:440,marginLeft:"auto",marginRight:"auto"}}>Registrate en segundos y conectá con docentes o estudiantes que comparten tu pasión.</p>
          <button onClick={onEnter}
            style={{background:"#fff",border:"none",borderRadius:24,color:LUD.blue,padding:"15px 40px",fontWeight:700,fontSize:16,cursor:"pointer",fontFamily:FONT,boxShadow:"0 10px 28px rgba(0,0,0,.2)",transition:"transform .2s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="none"}>
            Crear cuenta gratis →
          </button>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{borderTop:"1px solid #EEF2FF",padding:"32px 32px",background:"#fff"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src="/logo.png" alt="Luderis" style={{width:28,height:28,objectFit:"contain"}}/>
            <span style={{fontWeight:800,fontSize:16,background:LUD.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Luderis</span>
          </div>
          <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
            {[["inicio","Inicio"],["features","Funciones"],["nosotros","Sobre nosotros"],["contacto","Contacto"]].map(([id,l])=>(
              <button key={id} onClick={()=>scrollTo(id)} style={{background:"none",border:"none",color:"#718096",fontSize:13,cursor:"pointer",fontFamily:FONT,padding:0,transition:"color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.color=LUD.blue}
                onMouseLeave={e=>e.currentTarget.style.color="#718096"}>{l}</button>
            ))}
          </div>
          <span style={{fontSize:12,color:"#A0AEC0"}}>© {new Date().getFullYear()} Luderis · contacto@luderis.com</span>
        </div>
      </footer>
    </div>
  );
}

function AuthScreen({onLogin}){
  const [mode,setMode]=useState("login");const [email,setEmail]=useState("");const [pass,setPass]=useState("");const [pass2,setPass2]=useState("");
  const [loading,setLoading]=useState(false);const [err,setErr]=useState("");const [ok,setOk]=useState("");
  const [aceptoTerminos,setAceptoTerminos]=useState(false);
  const [showTerminos,setShowTerminos]=useState(false);
  const handle=async()=>{
    setErr("");setOk("");if(!email){setErr("Ingresá tu email");return;}
    if(mode!=="forgot"&&!pass){setErr("Ingresá contraseña");return;}
    if(mode==="register"&&pass!==pass2){setErr("Las contraseñas no coinciden");return;}
    if(mode==="register"&&!aceptoTerminos){setErr("Debés aceptar los Términos y Condiciones");return;}
    setLoading(true);
    try{
      if(mode==="forgot"){await sb.resetPassword(email);setOk("Te enviamos un email para recuperar tu contraseña.");}
      else if(mode==="register"){
        const r=await sb.signUp(email,pass);
        if(r.access_token){
          const uid=r.user?.id;
          if(uid){try{await sb.insertUsuario({id:uid,email,nombre:email.split("@")[0]},r.access_token);}catch{}}
          sb.saveSession(r);onLogin(r);
        }else setOk("Revisá tu email para confirmar tu cuenta.");
      }else{
        const r=await sb.signIn(email,pass);
        const uid=r.user?.id;
        if(uid){try{await sb.upsertUsuario({id:uid,email,nombre:email.split("@")[0]},r.access_token);}catch{}}
        sb.saveSession(r);onLogin(r);
      }
    }catch(e){setErr(e.message||"Error al iniciar sesión");}finally{setLoading(false);}
  };

  const iS={width:"100%",background:"#F4F7FF",border:"1.5px solid #DDE5F5",borderRadius:10,padding:"12px 14px",color:"#0D1F3C",fontSize:16,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:12,transition:"border-color .15s,background .15s"};
  const focusI=e=>{e.target.style.borderColor=LUD.blue;e.target.style.background="#fff";};
  const blurI=e=>{e.target.style.borderColor="#DDE5F5";e.target.style.background="#F4F7FF";};

  if(showTerminos)return(
    <div style={{minHeight:"100vh",background:"#F6F9FF",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:FONT}}>
      <div style={{background:"#fff",borderRadius:16,padding:"32px 28px",width:"min(640px,95vw)",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(26,110,216,.12)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h2 style={{color:"#0D1F3C",fontSize:20,fontWeight:700,margin:0}}>Términos y Condiciones</h2>
          <button onClick={()=>setShowTerminos(false)} style={{background:"none",border:"1px solid #DDE5F5",borderRadius:8,color:"#666",padding:"6px 14px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>← Volver</button>
        </div>
        {[
          ["1. Aceptación","Al registrarte en Luderis aceptás estos términos. Si no estás de acuerdo, no uses la plataforma."],
          ["2. Descripción del servicio","Luderis es una plataforma que conecta docentes y estudiantes. Facilitamos el encuentro entre partes pero no somos empleadores, agencias ni intermediarios educativos oficiales."],
          ["3. Registro y cuenta","Debés tener al menos 18 años o contar con autorización de un tutor legal. Sos responsable de mantener la confidencialidad de tu contraseña y de toda la actividad que ocurra en tu cuenta."],
          ["4. Uso aceptable","Está prohibido publicar contenido falso, ofensivo, discriminatorio o ilegal. No podés usar la plataforma para acosar, engañar o perjudicar a otros usuarios. Cualquier transacción económica es responsabilidad exclusiva de las partes involucradas."],
          ["5. Contenido del usuario","Al publicar contenido en Luderis (descripciones, materiales, reseñas), otorgás a Luderis una licencia no exclusiva para mostrarlo en la plataforma. Sos el único responsable del contenido que publicás."],
          ["6. Privacidad","Recopilamos tu email y la información que voluntariamente proporcionás (nombre, bio, ubicación). No vendemos tus datos a terceros. Podemos usar datos agregados y anónimos para mejorar el servicio."],
          ["7. Limitación de responsabilidad","Luderis no garantiza la calidad, idoneidad ni veracidad de los servicios ofrecidos por los docentes. No somos responsables por disputas, daños o pérdidas que surjan de las relaciones entre usuarios."],
          ["8. Modificaciones","Podemos actualizar estos términos con previo aviso de 30 días por email. El uso continuado de la plataforma implica la aceptación de los nuevos términos."],
          ["9. Contacto","Ante dudas o reclamos escribinos a contacto@luderis.com"],
        ].map(([titulo,texto])=>(
          <div key={titulo} style={{marginBottom:18,paddingBottom:18,borderBottom:"1px solid #F4F7FF"}}>
            <div style={{fontWeight:700,color:"#0D1F3C",fontSize:14,marginBottom:6}}>{titulo}</div>
            <p style={{color:"#4A5568",fontSize:13,lineHeight:1.7,margin:0}}>{texto}</p>
          </div>
        ))}
        <p style={{color:"#A0AEC0",fontSize:11,textAlign:"center",margin:"16px 0 12px"}}>Última actualización: {new Date().toLocaleDateString("es-AR",{month:"long",year:"numeric"})}</p>
        <button onClick={()=>{setAceptoTerminos(true);setShowTerminos(false);}}
          style={{width:"100%",background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"13px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:FONT}}>
          Acepto los Términos y Condiciones ✓
        </button>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",display:"flex",fontFamily:FONT,background:"#F6F9FF"}}>
      <style>{`
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .auth-left{display:flex!important}
        @media(max-width:720px){.auth-left{display:none!important}}
        .auth-logo-mobile{display:none!important}
        @media(max-width:720px){.auth-logo-mobile{display:flex!important}}
      `}</style>

      {/* ── Panel izquierdo — branding ── */}
      <div className="auth-left" style={{flex:"0 0 380px",background:"linear-gradient(160deg,#0A2A5E 0%,#1A6ED8 55%,#2EC4A0 100%)",display:"flex",flexDirection:"column",padding:"48px 40px",position:"relative",overflow:"hidden",justifyContent:"space-between"}}>
        {/* Orbes decorativos */}
        <div style={{position:"absolute",width:320,height:320,borderRadius:"50%",background:"rgba(255,255,255,.04)",top:-80,right:-80,pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",background:"rgba(46,196,160,.1)",bottom:40,left:-60,pointerEvents:"none"}}/>

        {/* Logo + nombre */}
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:52}}>
            <div style={{width:52,height:52,borderRadius:14,background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,.15)",animation:"floatY 4s ease-in-out infinite"}}>
              <img src="/logo.png" alt="Luderis" style={{width:36,height:36,objectFit:"contain"}}/>
            </div>
            <span style={{fontSize:26,fontWeight:800,color:"#fff",letterSpacing:"-.5px"}}>Luderis</span>
          </div>
          <h2 style={{color:"#fff",fontSize:30,fontWeight:800,lineHeight:1.2,margin:"0 0 14px",letterSpacing:"-.5px"}}>
            Aprendé lo que quieras, enseñá lo que sabés.
          </h2>
          <p style={{color:"rgba(255,255,255,.7)",fontSize:14,lineHeight:1.75,margin:0}}>
            Conectamos personas para compartir conocimiento. Sin intermediarios ni comisiones.
          </p>
        </div>

        {/* Stats */}
        <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:12}}>
          {[
            {n:"Clases particulares",d:"Encontrá tu docente ideal"},
            {n:"Cursos completos",d:"Con evaluaciones y certificados"},
            {n:"Búsqueda con IA",d:"Te encuentra lo mejor"},
          ].map(({n,d})=>(
            <div key={n} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,.08)",borderRadius:12,padding:"11px 14px",backdropFilter:"blur(4px)"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:LUD.teal,flexShrink:0}}/>
              <div>
                <div style={{color:"#fff",fontWeight:600,fontSize:13}}>{n}</div>
                <div style={{color:"rgba(255,255,255,.6)",fontSize:11,marginTop:1}}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
        <div style={{width:"min(420px,100%)",animation:"fadeSlideUp .5s ease both"}}>

          {/* Logo mobile */}
          <div className="auth-logo-mobile" style={{alignItems:"center",gap:10,marginBottom:24,justifyContent:"center"}}>
            <img src="/logo.png" alt="Luderis" style={{width:40,height:40,objectFit:"contain"}}/>
            <span style={{fontSize:22,fontWeight:800,background:LUD.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Luderis</span>
          </div>
          {/* Volver a la landing */}
          <button onClick={()=>{sessionStorage.removeItem("ld_auth");window.location.hash="";window.location.reload();}}
            style={{background:"none",border:"none",color:"#718096",fontSize:13,cursor:"pointer",fontFamily:FONT,padding:"0 0 18px",display:"flex",alignItems:"center",gap:5,transition:"color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.color=LUD.blue}
            onMouseLeave={e=>e.currentTarget.style.color="#718096"}>
            ← Volver al inicio
          </button>

          <h2 style={{color:"#0D1F3C",fontSize:24,fontWeight:800,margin:"0 0 4px",letterSpacing:"-.4px"}}>
            {mode==="login"?t("welcomeBack"):mode==="register"?t("createAccount"):"Recuperar contraseña"}
          </h2>
          <p style={{color:"#718096",fontSize:14,margin:"0 0 28px"}}>
            {mode==="login"?"Ingresá para continuar":mode==="register"?t("freeAlways"):"Te enviamos un link a tu email"}
          </p>

          {/* Tabs */}
          {mode!=="forgot"&&(
            <div style={{display:"flex",background:"#EEF3FF",borderRadius:12,padding:4,marginBottom:24}}>
              {["login","register"].map(m=>(
                <button key={m} onClick={()=>{setMode(m);setErr("");setOk("");}}
                  style={{flex:1,padding:"9px 0",borderRadius:9,border:"none",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:600,
                    background:mode===m?"#fff":"transparent",
                    color:mode===m?LUD.blue:"#718096",
                    boxShadow:mode===m?"0 2px 8px rgba(26,110,216,.12)":"none",
                    transition:"all .15s"}}>
                  {m==="login"?t("signin"):t("register")}
                </button>
              ))}
            </div>
          )}

          {mode==="forgot"?(
            <>
              <input type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={iS} onFocus={focusI} onBlur={blurI}/>
              {err&&<div style={{color:"#E53E3E",fontSize:12,marginBottom:10,display:"flex",gap:5,alignItems:"center"}}>⚠ {err}</div>}
              {ok&&<div style={{color:"#2E7D52",fontSize:13,marginBottom:10,background:"#E8F5EE",borderRadius:8,padding:"8px 12px"}}>{ok}</div>}
              <button onClick={handle} disabled={loading}
                style={{width:"100%",background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"13px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:FONT,marginBottom:14,opacity:loading?.6:1,boxShadow:"0 4px 14px rgba(26,110,216,.3)"}}>
                {loading?"Enviando...":"Enviar link de recuperación"}
              </button>
              <button onClick={()=>{setMode("login");setErr("");setOk("");}}
                style={{width:"100%",background:"none",border:"none",color:LUD.blue,fontSize:13,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>
                ← Volver al inicio de sesión
              </button>
            </>
          ):(
            <>
              <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={iS} onFocus={focusI} onBlur={blurI} onKeyDown={e=>e.key==="Enter"&&handle()}/>
              <input type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)} style={iS} onFocus={focusI} onBlur={blurI} onKeyDown={e=>e.key==="Enter"&&handle()}/>
              {mode==="register"&&(
                <input type="password" placeholder="Repetir contraseña" value={pass2} onChange={e=>setPass2(e.target.value)} style={iS} onFocus={focusI} onBlur={blurI}/>
              )}
              {mode==="register"&&(
                <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:16}}>
                  <button onClick={()=>setAceptoTerminos(v=>!v)}
                    style={{width:20,height:20,flexShrink:0,borderRadius:5,border:`2px solid ${aceptoTerminos?LUD.blue:"#CBD5E0"}`,background:aceptoTerminos?LUD.grad:"transparent",cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
                    {aceptoTerminos&&<span style={{color:"#fff",fontSize:11,fontWeight:700}}>✓</span>}
                  </button>
                  <span style={{fontSize:12,color:"#718096",lineHeight:1.6}}>
                    Acepto los{" "}
                    <button onClick={()=>setShowTerminos(true)} style={{background:"none",border:"none",color:LUD.blue,cursor:"pointer",fontSize:12,fontFamily:FONT,padding:0,textDecoration:"underline",fontWeight:600}}>Términos y Condiciones</button>
                  </span>
                </div>
              )}
              {err&&<div style={{color:"#E53E3E",fontSize:12,marginBottom:12,display:"flex",gap:5,alignItems:"center"}}>⚠ {err}</div>}
              {ok&&<div style={{color:"#2E7D52",fontSize:13,marginBottom:12,background:"#E8F5EE",borderRadius:8,padding:"9px 12px"}}>{ok}</div>}
              <button onClick={handle} disabled={loading||(mode==="register"&&!aceptoTerminos)}
                style={{width:"100%",background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"14px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:FONT,marginBottom:14,
                  boxShadow:"0 4px 18px rgba(26,110,216,.35)",transition:"opacity .15s,box-shadow .15s",
                  opacity:(loading||(mode==="register"&&!aceptoTerminos))?.5:1}}>
                {loading?"...":(mode==="login"?t("enterBtn"):t("createBtn"))}
              </button>
              {mode==="login"&&(
                <div style={{textAlign:"center"}}>
                  <button onClick={()=>{setMode("forgot");setErr("");setOk("");}}
                    style={{background:"none",border:"none",color:"#718096",fontSize:13,cursor:"pointer",fontFamily:FONT}}>
                    {t("forgotPass")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({page,setPage,session,onLogout,onNewPost,unreadCount,ofertasCount,notifCount,ofertasAceptadasNuevas,mobile,open,onClose,theme,onToggleTheme,onForceRender}){
  const nombre=sb.getDisplayName(session.user.email);
  const nav=[
    {id:"explore",icon:"◎",label:t("explore")},
    {id:"agenda",icon:"▦",label:t("agenda")},
    {id:"chats",icon:"▭",label:t("chats"),badge:unreadCount},
    {id:"favoritos",icon:"◈",label:t("favorites")},
    {id:"inscripciones",icon:"◉",label:t("classes"),badge:notifCount},
    {id:"cuenta",icon:"▢",label:t("account"),badge:ofertasAceptadasNuevas+ofertasCount},
  ];
  const inner=(
    <div style={{width:224,height:"100%",background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",fontFamily:FONT}}>
      {/* Logo */}
      <div style={{padding:"16px 20px 14px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <img src="/logo.png" alt="Luderis" style={{width:32,height:32,objectFit:"contain"}}/>
            <span style={{fontSize:16,fontWeight:700,color:C.text,letterSpacing:"-.3px",whiteSpace:"nowrap"}}>Luderis</span>
          </div>
          {mobile&&<button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer",padding:2}}>×</button>}
        </div>
      </div>

      {/* User card */}
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,background:C.bg}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Avatar letra={nombre[0]} size={40}/>
          <div style={{overflow:"hidden",flex:1}}>
            <div style={{color:C.text,fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{nombre}</div>
            <div style={{color:C.muted,fontSize:11,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:1}}>{session.user.email}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{padding:"8px 8px",flex:1,overflowY:"auto"}}>
        {nav.map(item=>{
          const active=page===item.id;
          return(<button key={item.id} onClick={()=>{setPage(item.id);if(mobile)onClose();}}
            style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:"none",
              background:active?C.accentDim:"transparent",
              color:active?C.accent:C.text,
              fontWeight:active?600:400,fontSize:13,cursor:"pointer",marginBottom:1,fontFamily:FONT,textAlign:"left",
              transition:"background .12s,color .12s"}}
            onMouseEnter={e=>{if(!active){e.currentTarget.style.background=C.bg;}}}
            onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";}}}>
            <span style={{fontSize:16,lineHeight:1}}>{item.icon}</span>
            <span style={{flex:1}}>{item.label}</span>
            {item.badge>0&&<span style={{background:C.danger,color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px",minWidth:18,textAlign:"center"}}>{item.badge>9?"9+":item.badge}</span>}
            {active&&<span style={{width:3,height:18,borderRadius:2,background:C.accent,flexShrink:0}}/>}
          </button>);
        })}
        <div style={{margin:"10px 8px",height:1,background:C.border}}/>
        <button onClick={()=>{onNewPost();if(mobile)onClose();}}
          style={{width:"100%",padding:"9px 12px",borderRadius:20,border:`1.5px solid ${C.accent}`,background:"transparent",color:C.accent,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=C.accent;e.currentTarget.style.color="#fff";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.accent;}}>
          + Publicar
        </button>
      </nav>

      {/* Footer */}
      <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:6}}>
        <div style={{display:"flex",gap:6}}>
          <button onClick={onToggleTheme}
            style={{flex:1,background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"6px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
            {theme==="light"?t("dark"):t("light")}
          </button>
          <button onClick={onLogout}
            style={{flex:1,background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"6px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.danger;e.currentTarget.style.color=C.danger;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
            ↩ {t("logout")}
          </button>
        </div>
        {/* Selector de idioma */}
        <div style={{display:"flex",gap:6}}>
          {[["es",t("langEs")],["en",t("langEn")]].map(([key,label])=>(
            <button key={key}
              onClick={()=>{setLang(key);if(onForceRender)onForceRender();else{onToggleTheme();setTimeout(onToggleTheme,10);}}}
              style={{flex:1,background:(localStorage.getItem("cl_lang")||"es")===key?C.accentDim:"none",
                border:`1px solid ${(localStorage.getItem("cl_lang")||"es")===key?C.accent:C.border}`,
                borderRadius:8,color:(localStorage.getItem("cl_lang")||"es")===key?C.accent:C.muted,
                padding:"5px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT,
                display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all .15s"}}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  if(mobile)return(<>{open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:89}}/>}<div style={{position:"fixed",left:0,top:0,height:"100vh",zIndex:90,transform:open?"translateX(0)":"translateX(-100%)",transition:"transform .25s",boxShadow:"4px 0 20px rgba(0,0,0,.1)"}}>{inner}</div></>);
  return <div style={{position:"fixed",left:0,top:0,height:"100vh",zIndex:40}}>{inner}</div>;
}

// ─── FAV BUTTON ───────────────────────────────────────────────────────────────
function FavBtn({post,session,onFavChange,isFav,favId:favIdProp}){
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

// ─── OFERTAR BTN — solo se muestra en el modal de detalle, NO en la card ──────
function OfertarBtn({post,session}){
  const [open,setOpen]=useState(false);const [precio,setPrecio]=useState("");const [tipo,setTipo]=useState("hora");const [msg,setMsg]=useState("");const [saving,setSaving]=useState(false);const [ok,setOk]=useState(false);
  const [miOferta,setMiOferta]=useState(null);// null=cargando, obj=encontrada, false=no hay
  useEffect(()=>{
    if(post.tipo!=="busqueda"||post.autor_email===session.user.email)return;
    sb.getMisOfertas(session.user.email,session.access_token).then(ofertas=>{
      // Buscar la más reciente sobre esta búsqueda (cualquier estado)
      const mia=ofertas.filter(o=>o.busqueda_id===post.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
      setMiOferta(mia||false);
    }).catch(()=>setMiOferta(false));
  },[post.id,session.user.email,session.access_token]); // eslint-disable-line
  if(post.tipo!=="busqueda"||post.autor_email===session.user.email||post.activo===false||post.finalizado)return null;
  if(miOferta===null)return null;// cargando
  if(miOferta&&miOferta.estado==="pendiente"){
    const diasEspera=miOferta.created_at?Math.floor((Date.now()-new Date(miOferta.created_at))/86400000):null;
    return(
      <div style={{display:"flex",flexDirection:"column",gap:3,alignSelf:"center"}}>
        <span style={{fontSize:12,color:C.warn,fontStyle:"italic"}}>Tu oferta está pendiente de respuesta</span>
        {diasEspera!==null&&<span style={{fontSize:10,color:C.muted}}>Enviada {diasEspera===0?"hoy":diasEspera===1?"hace 1 día":`hace ${diasEspera} días`}</span>}
      </div>
    );
  }
  if(miOferta&&miOferta.estado==="rechazada"){
    return<span style={{fontSize:12,color:C.danger,fontStyle:"italic",alignSelf:"center"}}>Tu oferta fue rechazada</span>;
  }
  const cerrar=()=>setOpen(false);
  const enviar=async()=>{
    if(!msg.trim())return;setSaving(true);
    try{
      const payload={busqueda_id:post.id,busqueda_autor_email:post.autor_email,busqueda_titulo:post.titulo,busqueda_materia:post.materia||null,ofertante_id:session.user.id,ofertante_email:session.user.email,ofertante_nombre:sb.getDisplayName(session.user.email),precio:precio?parseFloat(precio):null,precio_tipo:tipo,mensaje:msg,leida:false};
      await sb.insertOfertaBusq(payload,session.access_token);
      // Notificar al dueño de la búsqueda que recibió una nueva oferta
      sb.insertNotificacion({usuario_id:null,alumno_email:post.autor_email,tipo:"nueva_oferta",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      setOk(true);
      // Actualizar estado local y cerrar el popup
      setMiOferta({busqueda_id:post.id,estado:"pendiente",created_at:new Date().toISOString()});
      cerrar();
    }catch(e){
      const msg2=e.message||"";
      if(msg2.includes("estado"))alert("Error de esquema: la columna 'estado' no existe. Pedí al admin que ejecute el SQL de actualización.");
      else alert("Error: "+msg2);
    }finally{setSaving(false);}
  };
  const iS={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:9};
  return(
    <>
      <button onClick={e=>{e.stopPropagation();setOpen(true);}} style={{background:"#5CA8E022",border:"1px solid #5CA8E044",borderRadius:10,color:C.info,padding:"7px 14px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT}}>Ofertar mis clases</button>
      {open&&(
        <div style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:FONT,boxSizing:"border-box"}} onClick={cerrar}>
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
        {ok?(<div style={{textAlign:"center",padding:"24px 0"}}><div style={{color:C.success,fontWeight:700,fontSize:15,marginBottom:8}}>Denuncia enviada</div><div style={{color:C.muted,fontSize:13}}>Revisaremos tu reporte.</div><Btn onClick={onClose} style={{marginTop:16}}>Cerrar</Btn></div>):(
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
  const [estadoOferta,setEstadoOferta]=useState(null);// null | "pendiente" | "rechazada" | "aceptada"
  const miEmail=session.user.email;
  useEffect(()=>{
    if(post.autor_email===miEmail){setPermitido(false);return;}
    if(post.tipo==="busqueda"){
      sb.getMisOfertas(miEmail,session.access_token).then(ofertas=>{
        const mia=ofertas.find(o=>o.busqueda_id===post.id);
        if(!mia){setEstadoOferta(null);setPermitido(false);return;}
        setEstadoOferta(mia.estado);
        setPermitido(mia.estado==="aceptada");
      }).catch(()=>setPermitido(false));
      return;
    }
    // Permitir a inscriptos Y co-docentes (ayudantes) — sin traer todas las pubs
    Promise.all([
      sb.getMisInscripciones(miEmail,session.access_token).catch(()=>[]),
      sb.getPublicaciones({autor:post.autor_email},session.access_token).catch(()=>[]),
    ]).then(([ins,pubs])=>{
      const estaInscripto=ins.some(i=>i.publicacion_id===post.id);
      if(estaInscripto){setPermitido(true);return;}
      const pub=pubs.find(p=>p.id===post.id);
      const esAyud=(pub?.ayudantes||[]).includes(session.user.id);
      setPermitido(esAyud);
    }).catch(()=>setPermitido(false));
  },[post.id,post.tipo,post.autor_email,miEmail,session.access_token]);
  if(permitido===null)return null;
  if(!permitido){
    if(post.tipo==="busqueda"){
      if(estadoOferta==="pendiente")return<span style={{fontSize:11,color:C.warn,fontStyle:"italic"}}>⏳ Pendiente de respuesta</span>;
      if(estadoOferta==="rechazada")return<span style={{fontSize:11,color:C.danger,fontStyle:"italic"}}>✗ Oferta rechazada</span>;
      return<span style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>Ofertá para chatear</span>;
    }
    return<span style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>Inscribite para chatear</span>;
  }
  return <button onClick={e=>{e.stopPropagation();onOpenChat(post);}} style={{background:C.accent,color:"#fff",border:"none",borderRadius:9,padding:"5px 12px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT}}>Contactar</button>;
}

// ─── SHARE TOAST ─────────────────────────────────────────────────────────────
function ShareToast({msg,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2200);return()=>clearTimeout(t);},[onDone]);
  return(
    <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"10px 20px",fontSize:12,color:C.text,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 4px 20px #0008",fontFamily:FONT,display:"flex",alignItems:"center",gap:8}}>
      <span style={{color:C.success}}>✓</span>{msg}
    </div>
  );
}
function useShareToast(){
  const [toast,setToast]=useState(null);
  const show=(msg)=>setToast(msg);
  const el=toast?<ShareToast msg={toast} onDone={()=>setToast(null)}/>:null;
  return [show,el];
}
function ShareBtn({post,style={}}){
  const [show,toastEl]=useShareToast();
  const compartir=(e)=>{
    e.stopPropagation();
    const url=`${window.location.origin}${window.location.pathname}?pub=${post.id}`;
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(url).then(()=>show("Link copiado al portapapeles"));
    } else {
      // fallback
      const ta=document.createElement("textarea");ta.value=url;document.body.appendChild(ta);ta.select();
      try{document.execCommand("copy");show("Link copiado");}catch{show("No se pudo copiar");}
      document.body.removeChild(ta);
    }
  };
  return(
    <>
      <button onClick={compartir} title="Compartir" style={{background:"none",border:"none",fontSize:15,cursor:"pointer",color:C.muted,padding:"0 3px",lineHeight:1,...style}}
        onMouseEnter={e=>e.currentTarget.style.color=C.text}
        onMouseLeave={e=>e.currentTarget.style.color=C.muted}>
        ⎘
      </button>
      {toastEl}
    </>
  );
}

// ─── POST CARD (sin OfertarBtn — solo aparece en DetailModal) ─────────────────
function PostCard({post,session,onOpenChat,onOpenDetail,onOpenPerfil,avgPub,countPub,avgUser,yaOferte,fueRechazado,isFav,favId,onFavChange}){
  const nombre=post.autor_nombre||sb.getDisplayName(post.autor_email)||safeDisplayName(post.autor_nombre,post.autor_email)||"Usuario";
  const esMio=post.autor_email===session.user.email;
  return(
    <div onClick={()=>onOpenDetail(post)} className="cl-card-anim"
      style={{background:C.surface,border:`1px solid ${fueRechazado?C.danger+"40":C.border}`,borderRadius:10,padding:"16px 18px",cursor:"pointer",transition:"box-shadow .18s,border-color .18s",fontFamily:FONT}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 2px 14px rgba(0,0,0,.08)";e.currentTarget.style.borderColor=fueRechazado?C.danger+"60":C.accent+"50";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=fueRechazado?C.danger+"40":C.border;}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:8}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-start",minWidth:0}}>
          <Avatar letra={nombre[0]}/>
          <div style={{minWidth:0,flex:1}}>
            <button onClick={e=>{e.stopPropagation();onOpenPerfil(post.autor_email);}}
              style={{fontWeight:600,color:C.text,fontSize:14,background:"none",border:"none",cursor:"pointer",fontFamily:FONT,padding:0,textAlign:"left",lineHeight:1.3,display:"block"}}
              onMouseEnter={e=>{e.currentTarget.style.color=C.accent;e.currentTarget.style.textDecoration="underline";}}
              onMouseLeave={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.textDecoration="none";}}>
              {nombre}{post.verificado&&<span style={{fontSize:12,color:C.info,marginLeft:5}}>✓</span>}
            </button>
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3,flexWrap:"wrap"}}>
              {post.materia&&<span style={{fontSize:12,color:C.muted}}>{post.materia}</span>}
              {post.created_at&&<span style={{fontSize:12,color:C.muted}}>· {fmtRel(post.created_at)}</span>}
              {avgUser&&<MiniStars val={avgUser}/>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <Tag tipo={post.tipo}/>
          <FavBtn post={post} session={session} onFavChange={onFavChange} isFav={isFav} favId={favId}/>
        </div>
      </div>

      {/* Content */}
      <h3 style={{color:C.text,fontSize:15,fontWeight:600,margin:"0 0 5px",lineHeight:1.35}}>{post.titulo}</h3>
      <p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:"0 0 10px"}}>{post.descripcion?.slice(0,120)}{post.descripcion?.length>120?"...":""}</p>
      {avgPub&&<div style={{marginBottom:9}}><MiniStars val={avgPub} count={countPub}/></div>}

      {/* Tags info */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {post.precio&&<span style={{fontSize:12,fontWeight:600,color:C.accent,background:C.accentDim,borderRadius:4,padding:"3px 8px"}}>{fmtPrice(post.precio,post.moneda)}{post.precio_tipo&&post.modo!=="curso"?` /${post.precio_tipo}`:""}</span>}
        {(post.modo==="grupal"||post.modo==="curso")&&<span style={{fontSize:12,color:C.success,background:C.success+"12",borderRadius:4,padding:"3px 8px",border:`1px solid ${C.success}30`}}>📚 Curso</span>}
        {post.modo==="particular"&&<span style={{fontSize:12,color:C.info,background:C.info+"12",borderRadius:4,padding:"3px 8px",border:`1px solid ${C.info}30`}}>👤 Particular</span>}
        {post.modalidad==="virtual"&&<span style={{fontSize:12,color:C.muted,background:C.bg,borderRadius:4,padding:"3px 8px",border:`1px solid ${C.border}`}}>🌐 Virtual</span>}
        {post.modalidad==="presencial"&&<span style={{fontSize:12,color:C.muted,background:C.bg,borderRadius:4,padding:"3px 8px",border:`1px solid ${C.border}`}}>📍 Presencial</span>}
        {post.modalidad==="mixto"&&<span style={{fontSize:12,color:C.muted,background:C.bg,borderRadius:4,padding:"3px 8px",border:`1px solid ${C.border}`}}>↔ Mixto</span>}
        {post.fecha_inicio&&<span style={{fontSize:12,color:C.muted,background:C.bg,borderRadius:4,padding:"3px 8px",border:`1px solid ${C.border}`}}>Inicia {fmt(post.fecha_inicio)}</span>}
        {yaOferte&&!esMio&&<span style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:4,background:"#F59E0B12",border:"1px solid #F59E0B30",color:"#B45309"}}>Oferta enviada</span>}
        {fueRechazado&&<span style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:4,background:C.danger+"12",color:C.danger,border:`1px solid ${C.danger}30`}}>Oferta rechazada</span>}
      </div>

      {/* Footer */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid ${C.border}`,paddingTop:10,gap:8}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {post.vistas>0&&<span style={{fontSize:12,color:C.muted}}>{post.vistas} vista{post.vistas!==1?"s":""}</span>}
          {post.cantidad_inscriptos>0&&<span style={{fontSize:12,color:C.muted}}>{post.cantidad_inscriptos} inscripto{post.cantidad_inscriptos!==1?"s":""}</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <ShareBtn post={post}/>
          {!esMio&&<PostChatBtn post={post} session={session} onOpenChat={onOpenChat}/>}
          {esMio&&<span style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>Tu publicación</span>}
        </div>
      </div>
    </div>
  );
}

// ─── HOOK: debounce ──────────────────────────────────────────────────────────
function useDebounce(value, delay=300){
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(()=>{
    const t = setTimeout(()=>setDebouncedValue(value), delay);
    return ()=>clearTimeout(t);
  },[value, delay]);
  return debouncedValue;
}

// ─── HOOK: useIntersectionObserver (scroll infinito) ─────────────────────────
function useIntersectionObserver(ref, options={}){
  const [isIntersecting, setIsIntersecting] = useState(false);
  useEffect(()=>{
    if(!ref.current) return;
    const obs = new IntersectionObserver(([entry])=>setIsIntersecting(entry.isIntersecting), options);
    obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[ref, options.threshold, options.rootMargin]);// eslint-disable-line
  return isIntersecting;
}



// ─── BÚSQUEDA CON IA ──────────────────────────────────────────────────────────
function BusquedaIA({posts,session,userCity,onOpenDetail,onBuscar,iaLoading:parentLoading,onClose}){
  const [query,setQuery]=useState("");const [loading,setLoading]=useState(false);
  const [results,setResults]=useState(null);
  const [explanation,setExplanation]=useState("");
  const inputRef=useRef(null);
  useEffect(()=>{setTimeout(()=>inputRef.current?.focus(),80);},[]);
  const buscar=async()=>{
    if(!query.trim()||loading)return;
    setLoading(true);setResults(null);setExplanation("");
    try{
      const postsCtx=posts.slice(0,80).map(p=>({id:p.id,titulo:p.titulo,materia:p.materia,descripcion:(p.descripcion||"").slice(0,120),tipo:p.tipo,precio:p.precio,modalidad:p.modalidad,ubicacion:p.ubicacion}));
      const cityCtx=userCity?`\nCiudad del usuario: ${userCity}. Si el usuario busca clases presenciales o menciona cercanía, priorizá publicaciones cuya ubicacion contenga "${userCity}" o ciudades cercanas.`:"";
      const rawIA=await sb.callIA(`Sos un asistente de búsqueda para Luderis, plataforma educativa argentina.
El usuario describe lo que busca. Devolvé las publicaciones más relevantes.${cityCtx}
SIEMPRE respondé con JSON válido: {"ids":["id1","id2"],"explanation":"frase breve"}
Máximo 6 IDs. Sin resultados: {"ids":[],"explanation":"No encontré clases que coincidan."}`,
        `Busco: "${query}"\n\nPublicaciones:\n${JSON.stringify(postsCtx)}\n\nRespondé SOLO JSON.`,600,session?.access_token);
      const match=rawIA.match(/\{[\s\S]*\}/);
      if(!match)throw new Error("Respuesta inválida");
      const parsed=JSON.parse(match[0]);
      const ids=new Set(parsed.ids||[]);
      setResults(posts.filter(p=>ids.has(p.id)).sort((a,b)=>(parsed.ids||[]).indexOf(a.id)-(parsed.ids||[]).indexOf(b.id)));
      setExplanation(parsed.explanation||"");
    }catch{
      const q2=query.toLowerCase();
      const words=q2.split(/\s+/).filter(w=>w.length>2);
      const scored=posts.map(p=>{
        const txt=((p.titulo||"")+" "+(p.descripcion||"")+" "+(p.materia||"")+" "+(p.ubicacion||"")).toLowerCase();
        let score=words.reduce((acc,w)=>acc+(txt.includes(w)?1:0),0);
        // Bonus por ciudad del usuario si busca presencial
        if(userCity&&p.modalidad==="presencial"&&(p.ubicacion||"").toLowerCase().includes(userCity.toLowerCase()))score+=2;
        return{p,score};
      }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6).map(x=>x.p);
      setResults(scored);
      setExplanation(scored.length>0?"Resultado de búsqueda local":"Sin resultados.");
    }
    finally{setLoading(false);}
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"60px 16px 16px",fontFamily:FONT}} onClick={onClose}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,width:"min(640px,98vw)",maxHeight:"80vh",display:"flex",flexDirection:"column",overflow:"hidden",animation:"fadeUp .2s ease"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{padding:"16px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:18}}>✦</span>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&buscar()}
            placeholder="Describí lo que buscás en lenguaje natural…"
            style={{flex:1,background:"none",border:"none",color:C.text,fontSize:14,outline:"none",fontFamily:FONT}}/>
          <button onClick={buscar} disabled={!query.trim()||loading}
            style={{background:C.accent,border:"none",borderRadius:10,color:"#fff",padding:"7px 16px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,opacity:!query.trim()||loading?0.5:1,flexShrink:0}}>
            {loading?"…":"Buscar"}
          </button>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer",flexShrink:0}}>×</button>
        </div>
        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:"14px 18px"}}>
          {results===null&&!loading&&(
            <div style={{textAlign:"center",padding:"32px 0",color:C.muted,fontSize:13}}>
              <div style={{fontSize:32,marginBottom:10}}>✦</div>
              Describí lo que buscás con tus palabras — la IA va a encontrar las clases más adecuadas para vos.
            </div>
          )}
          {loading&&(
            <div style={{textAlign:"center",padding:"32px 0"}}>
              <Spinner/>
              <div style={{color:C.muted,fontSize:12,marginTop:8}}>Analizando publicaciones…</div>
            </div>
          )}
          {results!==null&&!loading&&(
            <>
              {explanation&&<div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:10,padding:"9px 13px",marginBottom:12,fontSize:12,color:C.accent,lineHeight:1.5}}>✦ {explanation}</div>}
              {results.length===0
                ?<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"24px 0"}}>No encontré clases que coincidan con eso.</div>
                :<div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {results.map((p,i)=>(
                    <div key={p.id} onClick={()=>{onOpenDetail(p);onClose();}}
                      style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 14px",cursor:"pointer",display:"flex",gap:10,alignItems:"flex-start",transition:"border-color .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                      <div style={{background:C.accentDim,borderRadius:8,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:C.accent,flexShrink:0}}>{i+1}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:2}}>{p.titulo}</div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:3}}>
                          {p.materia&&<span style={{fontSize:11,color:C.muted}}>{p.materia}</span>}
                          {p.precio&&<span style={{fontSize:11,color:C.accent,fontWeight:700}}>{fmtPrice(p.precio)}</span>}
                          {p.modalidad&&<span style={{fontSize:11,color:C.muted}}>{p.modalidad==="virtual"?"🌐":p.modalidad==="presencial"?"📍":"⟳"} {p.modalidad}</span>}
                        </div>
                        <div style={{color:C.muted,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.descripcion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RECORDATORIOS DEL DÍA ────────────────────────────────────────────────────
function RecordatoriosHoy({session,onOpenCurso}){
  const [clases,setClases]=useState([]);
  const [loading,setLoading]=useState(true);
  const DIAS=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const hoy=DIAS[new Date().getDay()];
  const ahora=new Date();
  useEffect(()=>{
    Promise.all([
      sb.getMisInscripciones(session.user.email,session.access_token).catch(()=>[]),
      sb.getPublicaciones({},session.access_token).catch(()=>[]),
    ]).then(([ins,pubs])=>{
      const pubMap={};pubs.forEach(p=>{pubMap[p.id]=p;});
      const hoy_clases=[];
      ins.forEach(insc=>{
        const pub=pubMap[insc.publicacion_id];
        if(!pub||pub.finalizado||pub.activo===false)return;
        try{
          const sinc=pub.clases_sinc?JSON.parse(pub.clases_sinc):[];
          sinc.forEach(c=>{
            if(c.dia!==hoy)return;
            hoy_clases.push({pub,hora_inicio:c.hora_inicio,hora_fin:c.hora_fin});
          });
        }catch{}
      });
      // Ordenar por hora
      hoy_clases.sort((a,b)=>a.hora_inicio.localeCompare(b.hora_inicio));
      setClases(hoy_clases);
    }).finally(()=>setLoading(false));
  },[session]);// eslint-disable-line
  if(loading||clases.length===0)return null;
  return(
    <div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:14,padding:"12px 16px",marginBottom:16,animation:"fadeUp .25s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
        <span style={{fontSize:16}}>📅</span>
        <span style={{fontWeight:700,color:C.accent,fontSize:13}}>Tus clases de hoy — {hoy}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {clases.map((c,i)=>{
          const [h,m]=c.hora_inicio.split(":").map(Number);
          const inicio=new Date();inicio.setHours(h,m,0,0);
          const enCurso=ahora>=inicio&&ahora<new Date(inicio.getTime()+90*60000);
          return(
            <div key={i} onClick={()=>onOpenCurso(c.pub)}
              style={{background:enCurso?"#4ECB7122":C.card,border:`1px solid ${enCurso?"#4ECB7155":C.border}`,borderRadius:10,padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"border-color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
              onMouseLeave={e=>e.currentTarget.style.borderColor=enCurso?"#4ECB7155":C.border}>
              <div style={{textAlign:"center",minWidth:44}}>
                <div style={{fontWeight:700,color:enCurso?C.success:C.accent,fontSize:12}}>{c.hora_inicio}</div>
                <div style={{color:C.muted,fontSize:10}}>{c.hora_fin}</div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,color:C.text,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.pub.titulo}</div>
                <div style={{color:C.muted,fontSize:11}}>{c.pub.materia}</div>
              </div>
              {enCurso&&<span style={{background:"#4ECB7122",color:C.success,border:"1px solid #4ECB7144",borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px",flexShrink:0}}>En curso</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── EXPLORE PAGE — Vista dual: Home (MercadoLibre-style) + Resultados ────────
function ExplorePage({session,onOpenChat,onOpenDetail,onOpenPerfil,onOpenCurso}){
  const [posts,setPosts]=useState([]);const [loading,setLoading]=useState(true);
  const [busqueda,setBusqueda]=useState(""); const [panelOpen,setPanelOpen]=useState(false);
  const [filtroTipo,setFiltroTipo]=useState("all"); const [filtroModo,setFiltroModo]=useState("all");
  const [filtroModalidad,setFiltroModalidad]=useState("all");
  const [filtroSinc,setFiltroSinc]=useState("all"); const [filtroMateria,setFiltroMateria]=useState("");
  const [filtroDurMin,setFiltroDurMin]=useState(0); const [maxDurSemanas,setMaxDurSemanas]=useState(0);
  const [filtroFechaDesde,setFiltroFechaDesde]=useState(""); const [filtroFechaHasta,setFiltroFechaHasta]=useState("");
  const [precioMin,setPrecioMin]=useState(0); const [precioMax,setPrecioMax]=useState(0);
  const [sliderMin,setSliderMin]=useState(0); const [sliderMax,setSliderMax]=useState(0);
  const [reseñasMap,setReseñasMap]=useState({}); const [reseñasUserMap,setReseñasUserMap]=useState({});
  const [categorias,setCategorias]=useState([]);
  const [favsMap,setFavsMap]=useState({});
  const [rechazadasIds,setRechazadasIds]=useState(new Set());
  const [hideBanner,setHideBanner]=useState(()=>{try{return localStorage.getItem("cl_hide_rechazadas")==="1";}catch{return false;}});
  const [pendientesIds,setPendientesIds]=useState(new Set());
  const [mostrarRechazadas,setMostrarRechazadas]=useState(false);
  const [showBusquedaIA,setShowBusquedaIA]=useState(false);
  const [iaQuery,setIaQuery]=useState("");// texto de la última búsqueda IA
  const [iaResults,setIaResults]=useState(null);// null=sin búsqueda, [ids]=resultados IA
  const [iaExplanation,setIaExplanation]=useState("");
  const [iaLoading,setIaLoading]=useState(false);
  const [ordenamiento,setOrdenamiento]=useState("relevancia");

  // Palabras clave de cercanía para el prompt IA
  const PALABRAS_CERCA=["cerca","cercanía","mi zona","mi barrio","mi ciudad","presencial cerca","local"];
  const CIUDADES_ARG=["buenos aires","caba","palermo","belgrano","caballito","córdoba","rosario","mendoza","tucumán","salta","mar del plata","bahía blanca","san isidro","tigre","quilmes","lomas","avellaneda","lanús","morón","merlo"];

  // Función que lanza búsqueda IA y popula iaResults
  const buscarConIA=useCallback(async(q)=>{
    if(!q.trim()||iaLoading)return;
    setIaLoading(true);setIaResults(null);setIaExplanation("");setIaQuery(q);
    setModoVista("resultados");

    // Detectar si el query menciona ubicación
    const qLow=q.toLowerCase();
    const mencionaUbic=PALABRAS_CERCA.some(p=>qLow.includes(p))||CIUDADES_ARG.some(c=>qLow.includes(c));
    const cityCtx=(mencionaUbic||userCity)?`\nCiudad del usuario: ${userCity||"desconocida"}. ${mencionaUbic?"El usuario menciona ubicación: priorizá publicaciones presenciales en o cerca de "+userCity+".":"Si busca presencial, considerá la ciudad del usuario."}`:"";

    try{
      const postsCtx=posts.slice(0,100).map(p=>({id:p.id,titulo:p.titulo,materia:p.materia,descripcion:(p.descripcion||"").slice(0,100),tipo:p.tipo,precio:p.precio,modalidad:p.modalidad,ubicacion:p.ubicacion||""}));
      const raw=await sb.callIA(
        `Sos un asistente de búsqueda para Luderis, plataforma educativa argentina.${cityCtx}
El usuario describe lo que busca. Devolvé las publicaciones más relevantes.
SOLO respondé con JSON válido: {"ids":["id1","id2"],"explanation":"frase breve en español","mencionaUbicacion":true/false}
Máximo 20 IDs ordenados por relevancia. Sin resultados: {"ids":[],"explanation":"No encontré clases que coincidan.","mencionaUbicacion":false}`,
        `Busco: "${q}"\n\nPublicaciones disponibles:\n${JSON.stringify(postsCtx)}\n\nRespondé SOLO JSON.`,
        800,session?.access_token
      );
      const match=raw.match(/\{[\s\S]*\}/);
      if(!match)throw new Error("bad json");
      const parsed=JSON.parse(match[0]);
      setIaResults(parsed.ids||[]);
      setIaExplanation(parsed.explanation||"");
    }catch{
      // Fallback local
      const words=qLow.split(/\s+/).filter(w=>w.length>2);
      const scored=posts.map(p=>{
        const txt=((p.titulo||"")+" "+(p.descripcion||"")+" "+(p.materia||"")+" "+(p.ubicacion||"")).toLowerCase();
        let sc=words.reduce((a,w)=>a+(txt.includes(w)?1:0),0);
        if(userCity&&p.modalidad==="presencial"&&(p.ubicacion||"").toLowerCase().includes(userCity.toLowerCase()))sc+=2;
        return{p,sc};
      }).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc).slice(0,20);
      setIaResults(scored.map(x=>x.p.id));
      setIaExplanation(scored.length>0?"Resultado local (IA no disponible)":"Sin resultados.");
    }finally{setIaLoading(false);}
  },[posts,userCity,session,iaLoading]);// eslint-disable-line

  // Función simple de distancia aproximada por texto (sin coordenadas)
  // Si ambas ciudades son iguales → 0. Si una está en el campo ubicacion → baja distancia.
  // Publicaciones sin ubicación → distancia media. Presenciales de otra provincia → alta.
  const distanciaScore=(p)=>{
    if(p.modalidad==="virtual")return 999;// virtuales van al final en orden cercania
    if(!userCity)return 500;
    const ub=(p.ubicacion||"").toLowerCase();
    const city=userCity.toLowerCase();
    if(ub.includes(city))return 0;
    // Ciudades del AMBA cerca de CABA
    const amba=["amba","gran buenos aires","buenos aires","gba","conurbano","palermo","belgrano","san isidro","tigre","quilmes","lomas","avellaneda","lanús","morón"];
    if(amba.some(a=>city.includes(a)||ub.includes(a)))return 100;
    if(!ub)return 300;// sin ubicación
    return 600;// otra zona
  };

  // Lista filtrada por IA (si hay) o todos los posts
  const baseList=iaResults!==null
    ?posts.filter(p=>iaResults.includes(p.id)).sort((a,b)=>iaResults.indexOf(a.id)-iaResults.indexOf(b.id))
    :filtered;

  // Aplicar ordenamiento encima de la lista base
  const sorted=useMemo(()=>{
    const arr=[...baseList];
    switch(ordenamiento){
      case"recientes":return arr.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
      case"rating":return arr.sort((a,b)=>(reseñasMap[b.id]?.avg||0)-(reseñasMap[a.id]?.avg||0));
      case"precio_asc":return arr.sort((a,b)=>(+a.precio||999999)-(+b.precio||999999));
      case"precio_desc":return arr.sort((a,b)=>(+b.precio||0)-(+a.precio||0));
      case"vistas":return arr.sort((a,b)=>(b.vistas||0)-(a.vistas||0));
      case"cercania":return arr.sort((a,b)=>distanciaScore(a)-distanciaScore(b));
      default:// "relevancia" — mantiene orden de IA si hay, sino mezcla rating+reciente
        if(iaResults!==null)return arr;
        return arr.sort((a,b)=>{
          const ratingA=reseñasMap[a.id]?.avg||0;const ratingB=reseñasMap[b.id]?.avg||0;
          const recA=new Date(a.created_at||0).getTime();const recB=new Date(b.created_at||0).getTime();
          return(ratingB*2+recB/1e11)-(ratingA*2+recA/1e11);
        });
    }
  },[baseList,ordenamiento,reseñasMap]);// eslint-disable-line

  const [filtroUbicacion,setFiltroUbicacion]=useState("");
  const [userCity,setUserCity]=useState(()=>{try{return localStorage.getItem("cl_user_city")||"";}catch{return "";}});
  const [geoLoading,setGeoLoading]=useState(false);

  // Detectar ciudad del usuario via geolocalización (una sola vez)
  const detectarUbicacion=useCallback(()=>{
    if(!navigator.geolocation)return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async(pos)=>{
        try{
          // Reverse geocoding con API pública (no requiere key)
          const res=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=es`);
          const data=await res.json();
          const city=data.address?.city||data.address?.town||data.address?.village||data.address?.suburb||"";
          if(city){setUserCity(city);try{localStorage.setItem("cl_user_city",city);}catch{}}
        }catch{}finally{setGeoLoading(false);}
      },
      ()=>setGeoLoading(false),
      {timeout:8000,maximumAge:3600000}
    );
  },[]);

  useEffect(()=>{
    // Auto-detectar si no tenemos ciudad guardada
    if(!userCity)detectarUbicacion();
  },[]);// eslint-disable-line
  const [modoVista,setModoVista]=useState("home");// "home" | "resultados"
  const PAGE_SIZE=20;
  const [pagina,setPagina]=useState(1);
  const sentinelRef=useRef(null);
  const isSentinelVisible=useIntersectionObserver(sentinelRef,{threshold:0.1});
  const busquedaDebounced=useDebounce(busqueda,280);
  const searchInputRef=useRef(null);

  const cargar=useCallback(async()=>{
    setLoading(true);
    try{
      const [d,misOfertas,favs,cats]=await Promise.all([
        sb.getPublicaciones({},session.access_token),
        sb.getMisOfertas(session.user.email,session.access_token).catch(()=>[]),
        sb.getFavoritos(session.user.email,session.access_token).catch(()=>[]),
        sb.getCategorias(session.access_token).catch(()=>[]),
      ]);
      const activos=d.filter(p=>p.activo!==false&&!p.finalizado);
      setPosts(activos);
      setCategorias(cats||[]);
      const fm={};(favs||[]).forEach(f=>{fm[f.publicacion_id]=f.id;});
      setFavsMap(fm);
      const rechSet=new Set();const pendSet=new Set();
      (misOfertas||[]).forEach(o=>{
        if(o.estado==="rechazada")rechSet.add(o.busqueda_id);
        if(o.estado==="pendiente")pendSet.add(o.busqueda_id);
      });
      setRechazadasIds(rechSet);setPendientesIds(pendSet);
      if(rechSet.size>0){try{if(localStorage.getItem("cl_hide_rechazadas")==="1"){}else{setHideBanner(false);}}catch{}}
      const precios=activos.filter(p=>p.precio>0).map(p=>+p.precio);
      if(precios.length){const mn=Math.floor(Math.min(...precios)/100)*100;const mx=Math.ceil(Math.max(...precios)/100)*100;setPrecioMin(mn);setPrecioMax(mx);setSliderMin(mn);setSliderMax(mx);}
      const durs=activos.filter(p=>p.fecha_inicio&&p.fecha_fin).map(p=>Math.ceil((new Date(p.fecha_fin)-new Date(p.fecha_inicio))/604800000));
      if(durs.length)setMaxDurSemanas(Math.max(...durs)+1);
      const hayDesnorm=activos.some(p=>p.calificacion_promedio!==undefined&&p.calificacion_promedio!==null);
      if(hayDesnorm){
        const pMap={};const uMap={};
        activos.forEach(p=>{
          const avg=parseFloat(p.calificacion_promedio)||0;const cnt=parseInt(p.cantidad_reseñas)||0;
          pMap[p.id]={avg:avg||null,count:cnt};
          if(!uMap[p.autor_email])uMap[p.autor_email]={sum:0,count:0};
          if(avg>0&&cnt>0){uMap[p.autor_email].sum+=avg*cnt;uMap[p.autor_email].count+=cnt;}
        });
        setReseñasMap(pMap);
        const fU={};Object.keys(uMap).forEach(e=>{if(uMap[e].count>0)fU[e]=uMap[e].sum/uMap[e].count;});
        setReseñasUserMap(fU);
      } else {
        const actSample=activos.slice(0,20);
        const rData=await Promise.allSettled(actSample.map(p=>sb.getReseñas(p.id,session.access_token)));
        const pMap={};const uMap={};
        actSample.forEach((p,i)=>{
          const r=rData[i].status==="fulfilled"?rData[i].value:[];
          const avg=r.length?r.reduce((a,rv)=>a+(rv.estrellas||0),0)/r.length:null;
          pMap[p.id]={avg,count:r.length};
          if(!uMap[p.autor_email])uMap[p.autor_email]={sum:0,count:0};
          r.forEach(rv=>{uMap[p.autor_email].sum+=(rv.estrellas||0);uMap[p.autor_email].count++;});
        });
        setReseñasMap(pMap);
        const fU={};Object.keys(uMap).forEach(e=>{if(uMap[e].count>0)fU[e]=uMap[e].sum/uMap[e].count;});
        setReseñasUserMap(fU);
      }
    }catch(e){console.error(e);}finally{setLoading(false);}
  },[session]);// eslint-disable-line
  useEffect(()=>{cargar();},[cargar]);

  // Solo cambia a resultados por filtros (no por búsqueda escrita — eso requiere Enter)
  useEffect(()=>{
    if(filtroTipo!=="all"||filtroModo!=="all"||filtroModalidad!=="all"||filtroMateria||filtroUbicacion){
      setModoVista("resultados");
    }
  },[filtroTipo,filtroModo,filtroModalidad,filtroMateria,filtroUbicacion]);

  const goHome=()=>{
    setModoVista("home");
    setBusqueda("");
    setFiltroTipo("all");setFiltroModo("all");setFiltroModalidad("all");
    setFiltroMateria("");setFiltroUbicacion("");
  };

  const filtered=posts.filter(p=>{
    const q=busquedaDebounced.toLowerCase().trim();
    if(q&&!p.titulo?.toLowerCase().includes(q)&&!p.descripcion?.toLowerCase().includes(q)&&!p.materia?.toLowerCase().includes(q)&&!(safeDisplayName(p.autor_nombre,p.autor_email)).toLowerCase().includes(q))return false;
    if(filtroTipo!=="all"&&p.tipo!==filtroTipo)return false;
    if(filtroModo!=="all"&&p.modo!==filtroModo)return false;
    if(filtroModalidad!=="all"&&p.modalidad!==filtroModalidad)return false;
    if(filtroSinc!=="all"&&p.sinc!==filtroSinc)return false;
    if(filtroMateria&&p.materia!==filtroMateria)return false;
    if(filtroUbicacion){
      const ubQ=filtroUbicacion.toLowerCase().trim();
      // Coincidencia parcial: incluye alguna palabra del filtro
      const words=ubQ.split(/\s+/).filter(w=>w.length>2);
      const ubMatch=(p.ubicacion||"").toLowerCase();
      const matches=words.length>0?words.some(w=>ubMatch.includes(w)):ubMatch.includes(ubQ);
      if(!matches)return false;
    }
    if(precioMax>0&&sliderMin>precioMin&&p.precio&&+p.precio<sliderMin)return false;
    if(precioMax>0&&sliderMax<precioMax&&p.precio&&+p.precio>sliderMax)return false;
    if(filtroFechaDesde&&p.fecha_inicio&&p.fecha_inicio<filtroFechaDesde)return false;
    if(filtroFechaHasta&&p.fecha_inicio&&p.fecha_inicio>filtroFechaHasta)return false;
    if(filtroDurMin>0&&p.fecha_inicio&&p.fecha_fin){const sem=Math.ceil((new Date(p.fecha_fin)-new Date(p.fecha_inicio))/604800000);if(sem<filtroDurMin)return false;}
    if(p.tipo==="busqueda"&&p.autor_email!==session.user.email&&rechazadasIds.has(p.id)&&!mostrarRechazadas)return false;
    return true;
  });

  const activeFilters=[
    filtroTipo!=="all"&&(filtroTipo==="oferta"?"Clases":"Búsquedas"),
    filtroModo!=="all"&&(filtroModo==="curso"?"Cursos":"Particulares"),
    filtroModalidad!=="all"&&(filtroModalidad==="presencial"?"Presencial":filtroModalidad==="virtual"?"Virtual":"Mixto"),
    filtroSinc!=="all"&&(filtroSinc==="sinc"?"Sincrónico":"Asincrónico"),
    filtroMateria&&filtroMateria,
    (sliderMin>precioMin||sliderMax<precioMax)&&"Precio",
    filtroFechaDesde&&`Desde ${fmt(filtroFechaDesde)}`,
    filtroFechaHasta&&`Hasta ${fmt(filtroFechaHasta)}`,
    filtroDurMin>0&&`Duración`,
    filtroUbicacion&&`📍 ${filtroUbicacion}`,
  ].filter(Boolean);
  const hasFilters=activeFilters.length>0||busqueda;
  useEffect(()=>{setPagina(1);},[busquedaDebounced,filtroTipo,filtroModo,filtroModalidad,filtroSinc,filtroMateria,sliderMin,sliderMax,filtroFechaDesde,filtroFechaHasta,filtroDurMin,iaResults]);// eslint-disable-line
  useEffect(()=>{if(isSentinelVisible&&!loading)setPagina(p=>p+1);},[isSentinelVisible]);// eslint-disable-line
  const clearAll=()=>{setFiltroTipo("all");setFiltroModo("all");setFiltroModalidad("all");setFiltroSinc("all");setFiltroMateria("");setSliderMin(precioMin);setSliderMax(precioMax);setFiltroFechaDesde("");setFiltroFechaHasta("");setFiltroDurMin(0);setBusqueda("");setFiltroUbicacion("");};
  const selS={width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 10px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT,cursor:"pointer",boxSizing:"border-box",colorScheme:localStorage.getItem("cl_theme")||"light"};
  const FL=({ch})=><div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:7,letterSpacing:.2}}>{ch}</div>;
  const FC=({label,active,onClick})=>(<button onClick={onClick} style={{padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:active?600:400,cursor:"pointer",fontFamily:FONT,background:active?C.accent:"transparent",color:active?"#fff":C.muted,border:`1px solid ${active?C.accent:C.border}`,marginBottom:5,marginRight:5,transition:"all .12s"}}>{label}</button>);

  // Barra de búsqueda reutilizable
  // JSX del searchbar — NO como componente (perdería foco al re-render)
  const searchBarJSX=(
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{position:"relative",flex:1,minWidth:200}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:16,pointerEvents:"none"}}>◎</span>
        <input ref={searchInputRef} value={busqueda} onChange={e=>setBusqueda(e.target.value)}
          onKeyDown={e=>{
            if(e.key==="Escape"){setBusqueda("");return;}
            if(e.key==="Enter"&&busqueda.trim()){
              setModoVista("resultados");
              requestAnimationFrame(()=>searchInputRef.current?.focus());
            }
          }}
          placeholder={t("search")}
          style={{width:"100%",background:C.surface,border:`2px solid ${busqueda?C.accent:C.border}`,borderRadius:10,padding:"12px 40px 12px 42px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:FONT,transition:"border-color .15s",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}
          onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>{if(!busqueda)e.target.style.borderColor=C.border;}}/>
        {busqueda&&<button onClick={()=>setBusqueda("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer",lineHeight:1,padding:0}}>×</button>}
      </div>
      <button onClick={()=>setShowBusquedaIA(true)}
        style={{display:"flex",alignItems:"center",gap:5,background:"linear-gradient(135deg,#7B3FBE,#1A6ED8)",border:"none",borderRadius:10,color:"#fff",padding:"12px 16px",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:600,flexShrink:0,boxShadow:"0 2px 8px rgba(123,63,190,.3)"}}>
        ✦ IA
      </button>
      <button onClick={()=>setPanelOpen(v=>!v)}
        style={{display:"flex",alignItems:"center",gap:6,background:hasFilters?C.accentDim:C.bg,border:`1px solid ${hasFilters?C.accent:C.border}`,borderRadius:10,color:hasFilters?C.accent:C.muted,padding:"12px 16px",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>
        ≡ Filtros{activeFilters.length>0&&<span style={{background:C.accent,color:"#fff",borderRadius:"50%",width:18,height:18,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,marginLeft:2}}>{activeFilters.length}</span>}
      </button>
    </div>
  );

  // Categorías visuales para el home — combina datos de DB con CATEGORIAS_DATA
  const cats=(categorias.length>0
    ?categorias.map(c=>({label:c.nombre,slug:c.slug,count:posts.filter(p=>p.materia===c.nombre).length}))
    :MATERIAS.map(m=>({label:m,count:posts.filter(p=>p.materia===m).length}))
  ).filter(c=>c.count>0||categorias.length===0).slice(0,19);

  // Publicaciones destacadas para el home (las más recientes con mejor rating)
  const destacadas=posts.filter(p=>p.tipo==="oferta").slice(0,6);
  const recientes=posts.slice(0,8);
  const cursos=posts.filter(p=>p.tipo==="oferta"&&(p.modo==="curso"||p.modo==="grupal")).slice(0,6);
  const particulares=posts.filter(p=>p.tipo==="oferta"&&p.modo==="particular").slice(0,6);

  return(<>
    <div style={{fontFamily:FONT}}>
      <RecordatoriosHoy session={session} onOpenCurso={onOpenCurso}/>

      {/* Drawer de filtros — siempre disponible */}
      {panelOpen&&(
        <>
          <div onClick={()=>setPanelOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:150,animation:"fadeIn .15s ease"}}/>
          <div style={{position:"fixed",top:0,right:0,bottom:0,width:"min(320px,90vw)",background:C.surface,zIndex:151,boxShadow:"-4px 0 24px rgba(0,0,0,.12)",overflowY:"auto",WebkitOverflowScrolling:"touch",animation:"slideInRight .2s ease",display:"flex",flexDirection:"column",fontFamily:FONT}}>
            <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px 14px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:C.surface,zIndex:1}}>
              <span style={{fontWeight:700,color:C.text,fontSize:16}}>Filtros</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {hasFilters&&<button onClick={clearAll} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:FONT,textDecoration:"underline"}}>Limpiar todo</button>}
                <button onClick={()=>setPanelOpen(false)} style={{width:32,height:32,borderRadius:"50%",background:C.bg,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:18,color:C.text,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            </div>
            <div style={{padding:"16px 20px",flex:1}}>
              <div style={{marginBottom:16}}><FL ch="Tipo"/><div style={{display:"flex",flexWrap:"wrap"}}>{[["all","Todo"],["oferta","Clases"],["busqueda","Búsquedas"]].map(([v,l])=><FC key={v} label={l} active={filtroTipo===v} onClick={()=>{setFiltroTipo(v);if(v!=="oferta"){setFiltroModo("all");setFiltroSinc("all");}}}/>)}</div></div>
              {(filtroTipo==="all"||filtroTipo==="oferta")&&(<div style={{marginBottom:16}}><FL ch="Formato"/><div style={{display:"flex",flexWrap:"wrap"}}>{[["all","Todos"],["curso","Cursos"],["particular","Clases part."]].map(([v,l])=><FC key={v} label={l} active={filtroModo===v} onClick={()=>{setFiltroModo(v);if(v!=="curso")setFiltroSinc("all");}}/>)}</div></div>)}
              {(filtroModo==="curso"||filtroModo==="all")&&(filtroTipo==="all"||filtroTipo==="oferta")&&(<div style={{marginBottom:16}}><FL ch="Sincronismo"/><div style={{display:"flex",flexWrap:"wrap"}}>{[["all","Todos"],["sinc","Sincrónico"],["asinc","Asincrónico"]].map(([v,l])=><FC key={v} label={l} active={filtroSinc===v} onClick={()=>setFiltroSinc(v)}/>)}</div></div>)}
              <div style={{marginBottom:16}}><FL ch="Modalidad"/><div style={{display:"flex",flexWrap:"wrap"}}>{[["all","Todas"],["presencial","Presencial"],["virtual","Virtual"],["mixto","Mixto"]].map(([v,l])=><FC key={v} label={l} active={filtroModalidad===v} onClick={()=>setFiltroModalidad(v)}/>)}</div></div>
              <div style={{marginBottom:16}}><FL ch="Materia"/>
                <SearchableSelect value={filtroMateria} onChange={setFiltroMateria} options={categorias.length>0?categorias.map(c=>c.nombre):MATERIAS} placeholder="Todas"/>
              </div>
              <div style={{marginBottom:16}}><FL ch="Ubicación"/>
                <div style={{position:"relative"}}>
                  <input value={filtroUbicacion} onChange={e=>setFiltroUbicacion(e.target.value)} placeholder={userCity?`Tu ciudad: ${userCity}`:"Ej: Palermo, CABA"} style={{width:"100%",background:C.bg,border:`1px solid ${filtroUbicacion?C.accent:C.border}`,borderRadius:8,padding:"9px 36px 9px 12px",color:C.text,fontSize:14,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                  <button title="Usar mi ubicación" onClick={()=>{if(userCity){setFiltroUbicacion(userCity);}else{detectarUbicacion();setTimeout(()=>{if(userCity)setFiltroUbicacion(userCity);},2000);}}}
                    style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:15,color:C.accent,padding:0,lineHeight:1}}>
                    {geoLoading?"⏳":"📍"}
                  </button>
                </div>
                {userCity&&!filtroUbicacion&&<button onClick={()=>setFiltroUbicacion(userCity)} style={{background:"none",border:"none",color:C.accent,fontSize:11,cursor:"pointer",fontFamily:FONT,padding:"4px 0",fontWeight:600}}>Usar {userCity}</button>}
                {filtroUbicacion&&<button onClick={()=>setFiltroUbicacion("")} style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:FONT,padding:"4px 0",textDecoration:"underline"}}>Limpiar</button>}
              </div>
              {precioMax>0&&(<div style={{marginBottom:16}}><FL ch="Precio por hora"/><PriceSlider min={precioMin} max={precioMax} valMin={sliderMin} valMax={sliderMax} onChangeMin={setSliderMin} onChangeMax={setSliderMax}/></div>)}
              <div style={{marginBottom:16}}><FL ch="Fecha de inicio"/>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Desde</div><input type="date" value={filtroFechaDesde} onChange={e=>setFiltroFechaDesde(e.target.value)} style={selS}/></div>
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Hasta</div><input type="date" value={filtroFechaHasta} min={filtroFechaDesde||undefined} onChange={e=>setFiltroFechaHasta(e.target.value)} style={selS}/></div>
                  {(filtroFechaDesde||filtroFechaHasta)&&<button onClick={()=>{setFiltroFechaDesde("");setFiltroFechaHasta("");}} style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:FONT,textAlign:"left",padding:0,textDecoration:"underline"}}>Limpiar fechas</button>}
                </div>
              </div>
              {maxDurSemanas>0&&(<div style={{marginBottom:16}}><FL ch="Duración mínima"/><select value={filtroDurMin} onChange={e=>setFiltroDurMin(+e.target.value)} style={selS}><option value={0}>Cualquier duración</option>{[1,2,4,8,12,16].filter(v=>v<maxDurSemanas).map(v=><option key={v} value={v}>{v} sem.</option>)}</select></div>)}
            </div>
            <div style={{padding:"14px 20px",borderTop:`1px solid ${C.border}`,position:"sticky",bottom:0,background:C.surface}}>
              <button onClick={()=>{setPanelOpen(false);setModoVista("resultados");}} style={{width:"100%",background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"13px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 14px rgba(26,110,216,.3)"}}>
                Ver {filtered.length} resultado{filtered.length!==1?"s":""}
              </button>
            </div>
          </div>
        </>
      )}
            {/* ══ VISTA HOME ══ */}
      {modoVista==="home"&&(
        <div>
          {/* Hero con búsqueda grande */}
          <div style={{background:`linear-gradient(135deg,${LUD.dark} 0%,${LUD.blue} 60%,${LUD.teal} 100%)`,borderRadius:16,padding:"36px 28px",marginBottom:24,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",width:280,height:280,borderRadius:"50%",background:"rgba(255,255,255,.04)",top:-80,right:-60,pointerEvents:"none"}}/>
            <div style={{position:"absolute",width:180,height:180,borderRadius:"50%",background:"rgba(46,196,160,.08)",bottom:-60,left:20,pointerEvents:"none"}}/>
            <div style={{position:"relative",zIndex:1}}>
              <h1 style={{color:"#fff",fontSize:"clamp(20px,4vw,30px)",fontWeight:800,margin:"0 0 6px",letterSpacing:"-.5px"}}>
                Aprendé lo que quieras
              </h1>
              <p style={{color:"rgba(255,255,255,.75)",fontSize:14,margin:"0 0 20px",lineHeight:1.5,display:"flex",alignItems:"center",gap:6}}>
                {userCity&&<span style={{background:"rgba(255,255,255,.15)",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600,backdropFilter:"blur(4px)"}}>📍 {userCity}</span>}
                {posts.length>0?`${posts.length} publicaciones disponibles`:"Buscá clases particulares, cursos y más"}
              </p>
              {searchBarJSX}
            </div>
          </div>

          {/* Categorías — cards con foto visual */}
          <div style={{marginBottom:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontWeight:700,color:C.text,fontSize:16}}>Explorar por categoría</div>
              <button onClick={()=>setModoVista("resultados")} style={{background:"none",border:"none",color:C.accent,fontSize:13,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>Ver todo →</button>
            </div>
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
              <style>{`.cl-cats-row::-webkit-scrollbar{display:none}`}</style>
              <div style={{display:"flex",gap:12,paddingBottom:6}} className="cl-cats-row">
                {cats.map(cat=>{
                  const data=CATEGORIAS_DATA[cat.label]||{emoji:"📚",grad:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",bg:"#1A6ED8"};
                  return(
                    <button key={cat.label} onClick={()=>{setFiltroMateria(cat.label);setModoVista("resultados");}}
                      style={{flexShrink:0,width:120,borderRadius:14,overflow:"hidden",border:"none",cursor:"pointer",fontFamily:FONT,padding:0,background:"transparent",transition:"transform .2s",textAlign:"left",display:"flex",flexDirection:"column"}}
                      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-4px) scale(1.02)"}
                      onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                      {/* Área visual */}
                      <div style={{height:90,background:data.grad,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",borderRadius:"14px 14px 0 0",overflow:"hidden",flexShrink:0}}>
                        <div style={{position:"absolute",width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,.1)",top:-20,right:-20,pointerEvents:"none"}}/>
                        <span style={{fontSize:42,filter:"drop-shadow(0 2px 8px rgba(0,0,0,.2))",lineHeight:1,position:"relative",zIndex:1}}>{data.emoji}</span>
                        {cat.count>0&&<span style={{position:"absolute",bottom:6,right:7,background:"rgba(0,0,0,.4)",color:"#fff",borderRadius:20,fontSize:10,fontWeight:700,padding:"1px 6px",backdropFilter:"blur(4px)"}}>{cat.count}</span>}
                      </div>
                      {/* Label — altura fija para que todas sean iguales */}
                      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 14px 14px",padding:"8px 9px",flex:1,height:48,display:"flex",alignItems:"center"}}>
                        <div style={{fontWeight:600,color:C.text,fontSize:11,lineHeight:1.35,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",width:"100%"}}>{cat.label}</div>
                      </div>
                    </button>
                  );
                })}
                {/* Ver todo */}
                <button onClick={()=>setModoVista("resultados")}
                  style={{flexShrink:0,width:130,borderRadius:14,overflow:"hidden",border:`2px dashed ${C.border}`,cursor:"pointer",fontFamily:FONT,padding:0,background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,height:130+36,transition:"border-color .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <span style={{fontSize:28,color:C.muted}}>→</span>
                  <span style={{fontSize:12,fontWeight:600,color:C.muted}}>Ver todas</span>
                </button>
              </div>
            </div>
          </div>

          {/* Accesos rápidos tipo ML */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:24}}>
            {[
              {icon:"🎯",title:"Clases particulares",desc:"Uno a uno",onClick:()=>{setFiltroModo("particular");setModoVista("resultados");}},
              {icon:"📚",title:"Cursos",desc:"Con certificado",onClick:()=>{setFiltroModo("curso");setModoVista("resultados");}},
              {icon:"🌐",title:"Online",desc:"Desde cualquier lugar",onClick:()=>{setFiltroModalidad("virtual");setModoVista("resultados");}},
              {icon:"📍",title:"Presencial",desc:userCity?`Cerca de ${userCity}`:"Cerca tuyo",onClick:()=>{setFiltroModalidad("presencial");if(userCity)setFiltroUbicacion(userCity);setModoVista("resultados");}},
            ].map(item=>(
              <button key={item.title} onClick={item.onClick}
                style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 14px",cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"all .18s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px rgba(0,0,0,.08)`;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                <div style={{fontSize:24,marginBottom:8}}>{item.icon}</div>
                <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:2}}>{item.title}</div>
                <div style={{fontSize:11,color:C.muted}}>{item.desc}</div>
              </button>
            ))}
          </div>

          {/* Publicaciones destacadas — scroll horizontal */}
          {loading?<Spinner/>:[
            {label:"✨ Publicaciones recientes",data:recientes},
            ...(cursos.length?[{label:"📚 Cursos",data:cursos}]:[]),
            ...(particulares.length?[{label:"🎯 Clases particulares",data:particulares}]:[]),
          ].map(({label,data})=>data.length>0&&(
            <div key={label} style={{marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontWeight:700,color:C.text,fontSize:15}}>{label}</div>
                <button onClick={()=>setModoVista("resultados")} style={{background:"none",border:"none",color:C.accent,fontSize:13,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>Ver todos →</button>
              </div>
              <div style={{display:"flex",gap:14,overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",paddingBottom:8}}>
                <style>{`.cl-hscroll::-webkit-scrollbar{display:none}`}</style>
                <div style={{display:"flex",gap:14}} className="cl-hscroll">
                  {data.map(p=>(
                    <div key={p.id} onClick={()=>onOpenDetail(p)}
                      style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px",cursor:"pointer",flexShrink:0,width:220,transition:"all .18s"}}
                      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.09)";e.currentTarget.style.borderColor=C.accent+"60";e.currentTarget.style.transform="translateY(-2px)";}}
                      onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}>
                      {/* Avatar + nombre */}
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                        <Avatar letra={(p.autor_nombre||p.autor_email||"?")[0]} size={32}/>
                        <div style={{minWidth:0}}>
                          <div style={{fontSize:11,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{safeDisplayName(p.autor_nombre,p.autor_email)}</div>
                          <div style={{fontSize:10,color:C.muted}}>{p.materia}</div>
                        </div>
                        <FavBtn post={p} session={session} onFavChange={()=>cargar()} isFav={p.id in favsMap} favId={favsMap[p.id]||null}/>
                      </div>
                      {/* Título */}
                      <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:4,lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{p.titulo}</div>
                      {/* Tags */}
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                        <Tag tipo={p.tipo}/>
                        {(p.modo==="curso"||p.modo==="grupal")&&<span style={{fontSize:10,color:C.success,background:C.success+"12",borderRadius:4,padding:"2px 6px"}}>Curso</span>}
                        {p.modalidad==="virtual"&&<span style={{fontSize:10,color:C.muted,background:C.bg,borderRadius:4,padding:"2px 6px",border:`1px solid ${C.border}`}}>Virtual</span>}
                      </div>
                      {/* Rating */}
                      {reseñasMap[p.id]?.avg&&<div style={{marginBottom:6}}><MiniStars val={reseñasMap[p.id].avg} count={reseñasMap[p.id].count}/></div>}
                      {/* Precio */}
                      {p.precio?<div style={{fontWeight:800,color:C.accent,fontSize:15}}>{fmtPrice(p.precio,p.moneda)}<span style={{fontSize:11,fontWeight:400,color:C.muted}}> /{p.precio_tipo||"hora"}</span></div>
                        :<div style={{fontWeight:600,color:C.success,fontSize:13}}>Gratis</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {posts.length>3&&<DocentesDestacados posts={posts} onOpenPerfil={onOpenPerfil} session={session}/>}

          {/* ── Footer estilo ML ── */}
          <div style={{marginTop:32,paddingTop:24,borderTop:`1px solid ${C.border}`}}>
            {/* 3 pilares */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:0,marginBottom:24}}>
              {[
                {icon:"🎓",title:"Aprendé sin intermediarios",desc:"Conectate directamente con el docente. Sin comisiones, sin sorpresas.",link:"Ver cómo funciona"},
                {icon:"🔒",title:"Tu privacidad, protegida",desc:"Tu email nunca se comparte. Todos los contactos pasan por la plataforma.",link:"Cómo protegemos tus datos"},
                {icon:"⭐",title:"Docentes verificados",desc:"El sistema valida el conocimiento de cada docente antes de publicar.",link:"Conocer el sistema de verificación"},
              ].map((item,i,arr)=>(
                <div key={item.title} style={{textAlign:"center",padding:"20px 24px",borderRight:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{fontSize:36,marginBottom:12}}>{item.icon}</div>
                  <div style={{fontWeight:700,color:C.text,fontSize:15,marginBottom:8}}>{item.title}</div>
                  <div style={{color:C.muted,fontSize:13,lineHeight:1.6,marginBottom:10}}>{item.desc}</div>
                  <button style={{background:"none",border:"none",color:C.accent,fontSize:13,cursor:"pointer",fontFamily:FONT,fontWeight:600,padding:0}}
                    onClick={()=>setModoVista("resultados")}>
                    {item.link} →
                  </button>
                </div>
              ))}
            </div>

            {/* Banners informativos */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12,marginBottom:20}}>
              <div style={{border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24}}>🤝</span>
                <div>
                  <div style={{fontWeight:600,color:C.text,fontSize:13,marginBottom:2}}>¿Querés enseñar?</div>
                  <button style={{background:"none",border:"none",color:C.accent,fontSize:12,cursor:"pointer",fontFamily:FONT,padding:0,fontWeight:600}}
                    onClick={()=>setModoVista("resultados")}>
                    Publicá tu primera clase gratis →
                  </button>
                </div>
              </div>
              <div style={{border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24}}>💬</span>
                <div>
                  <div style={{fontWeight:600,color:C.text,fontSize:13,marginBottom:2}}>¿Necesitás algo específico?</div>
                  <div style={{color:C.muted,fontSize:12}}>Publicá una búsqueda y recibí ofertas de docentes</div>
                </div>
              </div>
            </div>

            {/* Pie */}
            <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:24,padding:"16px 0",flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,color:C.muted,fontSize:12}}>
                <span>✉️</span>
                <span>contacto@luderis.com</span>
              </div>
              <div style={{width:1,height:14,background:C.border}}/>
              <div style={{display:"flex",alignItems:"center",gap:6,color:C.muted,fontSize:12}}>
                <span>🇦🇷</span>
                <span>Buenos Aires, Argentina</span>
              </div>
              <div style={{width:1,height:14,background:C.border}}/>
              <div style={{display:"flex",alignItems:"center",gap:6,color:C.muted,fontSize:12}}>
                <span>🔒</span>
                <span>Plataforma segura · Sin comisiones</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ VISTA RESULTADOS ══ */}
      {modoVista==="resultados"&&(
        <div>
          {/* ── Barra superior: volver + buscador IA ── */}
          <div style={{background:C.surface,borderRadius:12,padding:"14px 16px",marginBottom:14,border:`1px solid ${C.border}`,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <button onClick={goHome}
                style={{width:34,height:34,borderRadius:"50%",background:C.bg,border:`1px solid ${C.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:C.text,flexShrink:0,transition:"background .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.border}
                onMouseLeave={e=>e.currentTarget.style.background=C.bg}>←</button>
              {/* Buscador IA — reemplaza el buscador de texto */}
              <button onClick={()=>setShowBusquedaIA(true)}
                style={{flex:1,display:"flex",alignItems:"center",gap:10,background:C.bg,border:`2px solid ${C.border}`,borderRadius:10,padding:"11px 16px",cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <span style={{fontSize:15,background:"linear-gradient(135deg,#7B3FBE,#1A6ED8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700}}>✦</span>
                <span style={{color:busqueda||iaQuery?C.text:C.muted,fontSize:14,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {iaQuery?iaQuery:busqueda?"Búsqueda: "+busqueda:"Describí lo que buscás con IA..."}
                </span>
                {(iaQuery||busqueda)&&<span style={{fontSize:11,color:C.accent,fontWeight:600,flexShrink:0}}>✦ IA activa</span>}
              </button>
              <button onClick={()=>setPanelOpen(v=>!v)}
                style={{display:"flex",alignItems:"center",gap:6,background:hasFilters?C.accentDim:C.bg,border:`1px solid ${hasFilters?C.accent:C.border}`,borderRadius:10,color:hasFilters?C.accent:C.muted,padding:"11px 14px",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>
                ≡ Filtros{activeFilters.length>0&&<span style={{background:C.accent,color:"#fff",borderRadius:"50%",width:18,height:18,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,marginLeft:2}}>{activeFilters.length}</span>}
              </button>
            </div>

            {/* Chips de tipo + modalidad + ordenamiento */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {[["all","Todo"],["oferta","Clases"],["busqueda","Búsquedas"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFiltroTipo(v)} style={{padding:"4px 14px",borderRadius:20,fontSize:12,fontWeight:filtroTipo===v?600:400,cursor:"pointer",fontFamily:FONT,background:filtroTipo===v?C.accent:"transparent",color:filtroTipo===v?"#fff":C.muted,border:`1px solid ${filtroTipo===v?C.accent:C.border}`,transition:"all .12s"}}>{l}</button>
              ))}
              <div style={{width:1,height:18,background:C.border,margin:"0 2px"}}/>
              {[["presencial","📍 Presencial"],["virtual","🌐 Virtual"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFiltroModalidad(filtroModalidad===v?"all":v)} style={{padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:filtroModalidad===v?600:400,cursor:"pointer",fontFamily:FONT,background:filtroModalidad===v?C.accentDim:"transparent",color:filtroModalidad===v?C.accent:C.muted,border:`1px solid ${filtroModalidad===v?C.accent:C.border}`,transition:"all .12s"}}>{l}</button>
              ))}
              {/* Selector de ordenamiento */}
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>Ordenar:</span>
                <select value={ordenamiento} onChange={e=>{setOrdenamiento(e.target.value);setPagina(1);}}
                  style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"4px 8px",color:C.text,fontSize:12,outline:"none",cursor:"pointer",fontFamily:FONT,colorScheme:localStorage.getItem("cl_theme")||"light"}}>
                  <option value="relevancia">Más relevantes</option>
                  <option value="recientes">Más recientes</option>
                  <option value="rating">Mejor calificados</option>
                  <option value="precio_asc">Precio: menor a mayor</option>
                  <option value="precio_desc">Precio: mayor a menor</option>
                  <option value="vistas">Más vistos</option>
                  <option value="cercania">Más cercanos</option>
                </select>
                <span style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{sorted.length} resultado{sorted.length!==1?"s":""}</span>
              </div>
            </div>
            {activeFilters.length>0&&(
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`,alignItems:"center"}}>
                {activeFilters.map(f=><span key={f} style={{background:C.accentDim,border:`1px solid ${C.accent}30`,borderRadius:20,padding:"2px 10px",fontSize:11,color:C.accent,fontWeight:500}}>{f}</span>)}
                <button onClick={clearAll} style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:FONT,textDecoration:"underline",marginLeft:4}}>Limpiar todo</button>
              </div>
            )}
            {/* Banner IA query activa */}
            {iaQuery&&(
              <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13,fontWeight:700,background:"linear-gradient(135deg,#7B3FBE,#1A6ED8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>✦</span>
                <span style={{fontSize:12,color:C.muted,flex:1,fontStyle:"italic"}}>"{iaQuery}"</span>
                <button onClick={()=>{setIaQuery("");setIaResults(null);}} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:FONT,textDecoration:"underline"}}>Limpiar IA</button>
              </div>
            )}
            {iaExplanation&&<div style={{marginTop:6,fontSize:12,color:C.muted,fontStyle:"italic"}}>{iaExplanation}</div>}
          </div>

          {/* Banner rechazadas */}
          {rechazadasIds.size>0&&!hideBanner&&(
            <div style={{background:C.danger+"10",border:`1px solid ${C.danger}25`,borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <span style={{fontSize:12,color:C.muted,flex:1}}>
                <span style={{color:C.danger,fontWeight:700}}>{rechazadasIds.size}</span> búsqueda{rechazadasIds.size!==1?"s":""} donde tu oferta fue rechazada (oculta{rechazadasIds.size!==1?"s":""})
              </span>
              <button onClick={()=>{setHideBanner(true);try{localStorage.setItem("cl_hide_rechazadas","1");}catch{}}} style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer",lineHeight:1,padding:"2px 6px",flexShrink:0,borderRadius:"50%",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background=C.border} onMouseLeave={e=>e.currentTarget.style.background="none"} title="Cerrar">×</button>
            </div>
          )}

          {/* Lista de resultados */}
          {loading?<Spinner/>:sorted.length===0?(
            <div style={{textAlign:"center",color:C.muted,padding:"60px 0",fontSize:13}}>
              <div style={{fontSize:26,marginBottom:10,color:C.border}}>◎</div>
              {hasFilters||iaQuery?"Sin resultados con esos filtros.":posts.length===0?"Todavía no hay publicaciones.":"Sin resultados."}
              {(hasFilters||iaQuery)&&<div style={{marginTop:8,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                {hasFilters&&<button onClick={clearAll} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontFamily:FONT,fontSize:13,textDecoration:"underline"}}>Limpiar filtros</button>}
                {iaQuery&&<button onClick={()=>{setIaQuery("");setIaResults(null);}} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontFamily:FONT,fontSize:13,textDecoration:"underline"}}>Limpiar búsqueda IA</button>}
              </div>}
            </div>
          ):(
            <div>
              <div style={{display:"grid",gap:11}}>
                {sorted.slice((pagina-1)*PAGE_SIZE,pagina*PAGE_SIZE).map(p=>(
                  <PostCard key={p.id} post={p} session={session} onOpenChat={onOpenChat} onOpenDetail={onOpenDetail} onOpenPerfil={onOpenPerfil} avgPub={reseñasMap[p.id]?.avg} countPub={reseñasMap[p.id]?.count} avgUser={reseñasUserMap[p.autor_email]} yaOferte={pendientesIds.has(p.id)} fueRechazado={rechazadasIds.has(p.id)} isFav={p.id in favsMap} favId={favsMap[p.id]||null} onFavChange={()=>{cargar();}}/>
                ))}
              </div>
              {/* Paginador */}
              {sorted.length>PAGE_SIZE&&(
                <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:6,marginTop:20,flexWrap:"wrap"}}>
                  <button onClick={()=>{setPagina(p=>Math.max(1,p-1));window.scrollTo({top:0,behavior:"smooth"});}}
                    disabled={pagina===1}
                    style={{padding:"7px 14px",borderRadius:8,background:pagina===1?C.bg:C.surface,border:`1px solid ${C.border}`,color:pagina===1?C.muted:C.text,cursor:pagina===1?"default":"pointer",fontSize:13,fontFamily:FONT,opacity:pagina===1?.5:1}}>← Ant.</button>
                  {Array.from({length:Math.ceil(sorted.length/PAGE_SIZE)},(_,i)=>i+1).map(n=>(
                    <button key={n} onClick={()=>{setPagina(n);window.scrollTo({top:0,behavior:"smooth"});}}
                      style={{width:34,height:34,borderRadius:8,background:n===pagina?C.accent:C.surface,border:`1px solid ${n===pagina?C.accent:C.border}`,color:n===pagina?"#fff":C.text,cursor:"pointer",fontSize:13,fontFamily:FONT,fontWeight:n===pagina?700:400}}>
                      {n}
                    </button>
                  ))}
                  <button onClick={()=>{setPagina(p=>Math.min(Math.ceil(sorted.length/PAGE_SIZE),p+1));window.scrollTo({top:0,behavior:"smooth"});}}
                    disabled={pagina>=Math.ceil(sorted.length/PAGE_SIZE)}
                    style={{padding:"7px 14px",borderRadius:8,background:pagina>=Math.ceil(sorted.length/PAGE_SIZE)?C.bg:C.surface,border:`1px solid ${C.border}`,color:pagina>=Math.ceil(sorted.length/PAGE_SIZE)?C.muted:C.text,cursor:pagina>=Math.ceil(sorted.length/PAGE_SIZE)?"default":"pointer",fontSize:13,fontFamily:FONT,opacity:pagina>=Math.ceil(sorted.length/PAGE_SIZE)?.5:1}}>Sig. →</button>
                </div>
              )}
              <div style={{textAlign:"center",fontSize:11,color:C.muted,padding:"10px 0"}}>
                Mostrando {Math.min((pagina-1)*PAGE_SIZE+1,sorted.length)}–{Math.min(pagina*PAGE_SIZE,sorted.length)} de {sorted.length}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
    {showBusquedaIA&&<BusquedaIA posts={posts} session={session} userCity={userCity} onOpenDetail={onOpenDetail} onBuscar={buscarConIA} iaLoading={iaLoading} onClose={()=>setShowBusquedaIA(false)}/>}
  </>);
}
function MyPostCard({post,session,onEdit,onToggle,onDelete,onOpenCurso,toggling,ofertasPendientes,inscriptos}){
  const [confirmDelete,setConfirmDelete]=useState(false);
  const [ofertaAceptadaInfo,setOfertaAceptadaInfo]=useState(null);
  const [loadingDelete,setLoadingDelete]=useState(false);
  const [descExpanded,setDescExpanded]=useState(false);
  const activo=post.activo!==false;const finalizado=!!post.finalizado;
  const pendienteValidacion=post.activo===false&&post.estado_validacion==="pendiente";
  const DESC_MAX=100;
  const descLarga=(post.descripcion?.length||0)>DESC_MAX;

  const handleClickEliminar=async()=>{
    if(post.tipo==="busqueda"){
      try{
        const todas=await sb.getOfertasSobre(post.id,session.access_token);
        const aceptada=todas.find(o=>o.estado==="aceptada");
        setOfertaAceptadaInfo(aceptada?{nombre:aceptada.ofertante_nombre||safeDisplayName(null,aceptada.ofertante_email),email:aceptada.ofertante_email}:null);
      }catch{setOfertaAceptadaInfo(null);}
    }
    setConfirmDelete(true);
  };

  const handleConfirmDelete=async()=>{
    setLoadingDelete(true);
    try{
      if(post.tipo==="busqueda"&&ofertaAceptadaInfo?.email){
        sb.insertNotificacion({usuario_id:null,alumno_email:ofertaAceptadaInfo.email,tipo:"busqueda_eliminada",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      }
      setConfirmDelete(false);
      onDelete(post);
    }finally{setLoadingDelete(false);}
  };

  return(
    <div style={{background:C.surface,border:`1px solid ${ofertasPendientes>0?C.accent+"60":C.border}`,borderRadius:10,padding:"16px 18px",fontFamily:FONT,transition:"box-shadow .15s"}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,.06)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
      {/* Badges */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8,alignItems:"center"}}>
        <Tag tipo={post.tipo}/>
        <StatusBadge activo={activo} finalizado={finalizado} pendiente={pendienteValidacion}/>
        {post.verificado&&<VerifiedBadge/>}
        {ofertasPendientes>0&&<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}33`}}>{ofertasPendientes} oferta{ofertasPendientes!==1?"s":""}</span>}
        {!finalizado&&post.inscripciones_cerradas&&<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:C.warn+"12",color:C.warn,border:`1px solid ${C.warn}30`}}>Inscripciones cerradas</span>}
      </div>
      {/* Contenido + acciones */}
      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
        <div style={{flex:1,minWidth:0}}>
          <h3 style={{color:C.text,fontSize:14,fontWeight:600,margin:"0 0 5px",lineHeight:1.35,wordBreak:"break-word"}}>{post.titulo}</h3>
          <p style={{color:C.muted,fontSize:13,margin:"0 0 6px",lineHeight:1.55}}>
            {descLarga&&!descExpanded?post.descripcion.slice(0,DESC_MAX)+"...":post.descripcion}
            {descLarga&&<button onClick={e=>{e.stopPropagation();setDescExpanded(v=>!v);}} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:12,fontFamily:FONT,padding:"0 0 0 4px",fontWeight:600}}>{descExpanded?"Menos ▲":"Más ▼"}</button>}
          </p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {post.precio&&<span style={{fontSize:12,color:C.accent,fontWeight:600}}>{fmtPrice(post.precio,post.moneda)}</span>}
            {post.tipo==="oferta"&&inscriptos!==undefined&&<span style={{fontSize:12,color:C.muted}}>{inscriptos} inscripto{inscriptos!==1?"s":""}</span>}
            {post.vistas>0&&<span style={{fontSize:12,color:C.muted}}>👁 {post.vistas}</span>}
            {post.created_at&&<span style={{fontSize:12,color:C.muted}}>{fmt(post.created_at)}</span>}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0,minWidth:88}}>
          {post.tipo==="oferta"&&<button onClick={()=>onOpenCurso(pendienteValidacion?{...post,_openValidacion:true}:post)} style={{background:pendienteValidacion?C.accent:C.accentDim,border:`1px solid ${C.accent}${pendienteValidacion?"":"44"}`,borderRadius:6,color:pendienteValidacion?"#fff":C.accent,padding:"6px 8px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:FONT,textAlign:"center"}}>{pendienteValidacion?"⏳ Validar":"Contenido"}</button>}
          {!finalizado&&<button onClick={()=>onEdit(post)} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"6px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT,textAlign:"center",transition:"border-color .12s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>Editar</button>}
          {!finalizado&&!pendienteValidacion&&<button onClick={()=>onToggle(post)} disabled={toggling===post.id} style={{background:activo?C.warn+"12":C.success+"12",border:`1px solid ${activo?C.warn+"40":C.success+"40"}`,borderRadius:6,color:activo?C.warn:C.success,padding:"6px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT,textAlign:"center",opacity:toggling===post.id?.5:1}}>{toggling===post.id?"...":(activo?"Pausar":"Activar")}</button>}
          <button onClick={handleClickEliminar} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,padding:"6px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT,textAlign:"center",transition:"all .12s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.danger;e.currentTarget.style.color=C.danger;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>Eliminar</button>
        </div>
      </div>
      {confirmDelete&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:FONT}} onClick={()=>setConfirmDelete(false)}>
          <div style={{background:C.surface,borderRadius:12,padding:"28px",width:"min(400px,92vw)",textAlign:"center",boxShadow:"0 8px 40px rgba(0,0,0,.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:44,height:44,borderRadius:"50%",background:C.danger+"12",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:20,color:C.danger}}>✕</div>
            <h3 style={{color:C.text,fontSize:17,fontWeight:700,margin:"0 0 8px"}}>¿Eliminar {post.tipo==="busqueda"?"búsqueda":"publicación"}?</h3>
            {ofertaAceptadaInfo&&<div style={{background:C.warn+"10",border:`1px solid ${C.warn}30`,borderRadius:8,padding:"10px 13px",marginBottom:12,fontSize:12,color:C.warn,textAlign:"left"}}>⚠️ <strong style={{color:C.text}}>{ofertaAceptadaInfo.nombre}</strong> tiene una oferta aceptada. Se le avisará.</div>}
            <p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:"0 0 22px"}}>Se eliminará <strong style={{color:C.text}}>"{post.titulo}"</strong> permanentemente.</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmDelete(false)} style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"10px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>Cancelar</button>
              <button onClick={handleConfirmDelete} disabled={loadingDelete} style={{flex:1,background:C.danger,border:"none",borderRadius:20,color:"#fff",padding:"10px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:FONT,opacity:loadingDelete?.6:1}}>{loadingDelete?"...":"Sí, eliminar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONTRAOFERTA MODAL ───────────────────────────────────────────────────────
function ContraofertaModal({oferta,miRol,session,onClose,onEnviada}){
  // miRol: "alumno" (dueño búsqueda) o "docente" (ofertante)
  const [precio,setPrecio]=useState("");
  const [tipo,setTipo]=useState(oferta.precio_tipo||"hora");
  const [msg,setMsg]=useState("");
  const [saving,setSaving]=useState(false);
  const enviar=async()=>{
    if(!precio)return;setSaving(true);
    try{
      await sb.updateOfertaBusq(oferta.id,{
        contraoferta_precio:parseFloat(precio),
        contraoferta_tipo:tipo,
        contraoferta_mensaje:msg,
        contraoferta_de:miRol,
        estado:"pendiente",
        leida:false,
      },session.access_token);
      // Notificar al otro
      const destinatario=miRol==="alumno"?oferta.ofertante_email:oferta.busqueda_autor_email;
      sb.insertNotificacion({usuario_id:null,alumno_email:destinatario,tipo:"contraoferta",publicacion_id:oferta.busqueda_id,pub_titulo:oferta.busqueda_titulo,leida:false},session.access_token).catch(()=>{});
      onEnviada();
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const iS={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:9};
  const precioActual=oferta.contraoferta_precio||oferta.precio;
  return(
    <Modal onClose={onClose} width="min(420px,96vw)">
      <div style={{padding:"22px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>Contraoferta</h3>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>×</button>
        </div>
        <div style={{background:C.card,borderRadius:9,padding:"10px 13px",marginBottom:14,fontSize:12,color:C.muted}}>
          {oferta.busqueda_titulo}
          {precioActual&&<div style={{color:C.accent,fontWeight:600,marginTop:3}}>Precio actual: {fmtPrice(precioActual)} /{oferta.contraoferta_tipo||oferta.precio_tipo||"hora"}</div>}
        </div>
        <Label>Tu propuesta de precio</Label>
        <div style={{display:"flex",gap:7,marginBottom:9}}>
          <input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Monto" type="number" min="0" style={{...iS,margin:0,flex:2}}/>
          <select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...iS,margin:0,flex:1,cursor:"pointer",colorScheme:localStorage.getItem("cl_theme")||"light"}}>
            <option value="hora">/ hora</option>
            <option value="clase">/ clase</option>
            <option value="mes">/ mes</option>
          </select>
        </div>
        <Label>Mensaje (opcional)</Label>
        <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Explicá tu propuesta..." style={{...iS,minHeight:75,resize:"vertical"}}/>
        <Btn onClick={enviar} disabled={saving||!precio} style={{width:"100%",padding:"10px"}}>{saving?"Enviando...":"Enviar contraoferta →"}</Btn>
      </div>
    </Modal>
  );
}

// ─── OFERTAS RECIBIDAS MODAL ───────────────────────────────────────────────────
function OfertasRecibidasModal({post,session,onClose,onContactar}){
  const [ofertas,setOfertas]=useState([]);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(null);
  const [acuerdoOferta,setAcuerdoOferta]=useState(null);
  const [contraModal,setContraModal]=useState(null);// oferta sobre la que se contraoferta
  const cargar=useCallback(async()=>{
    const all=await sb.getOfertasSobre(post.id,session.access_token);
    // Marcar como leídas en state local inmediatamente (borra el borde amarillo al instante)
    setOfertas(all.map(o=>({...o,leida:true})));
    setLoading(false);
    // Persistir en DB en background solo las que no estaban leídas
    all.filter(o=>!o.leida).forEach(o=>sb.updateOfertaBusq(o.id,{leida:true},session.access_token).catch(()=>{}));
  },[post.id,session]);
  useEffect(()=>{cargar();},[cargar]);
  const responder=async(o,estado)=>{
    setSaving(o.id);
    try{
      await sb.updateOfertaBusq(o.id,{estado,leida:true},session.access_token);
      if(estado==="aceptada"){
        await sb.updatePublicacion(post.id,{activo:false},session.access_token).catch(()=>{});
        sb.insertNotificacion({usuario_id:null,alumno_email:o.ofertante_email,tipo:"oferta_aceptada",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
        const ofertaActualizada={...o,estado:"aceptada",busqueda_titulo:post.titulo,busqueda_autor_email:session.user.email};
        setAcuerdoOferta(ofertaActualizada);
        await cargar();
      } else {
        if(estado==="rechazada"){
          sb.insertNotificacion({usuario_id:null,alumno_email:o.ofertante_email,tipo:"oferta_rechazada",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
        }
        await cargar();
      }
    }finally{setSaving(null);}
  };
  const EB={pendiente:{c:C.accent,t:"Pendiente"},aceptada:{c:C.success,t:"✓ Aceptada"},rechazada:{c:C.danger,t:"✗ Rechazada"}};
  return(
    <>
    <Modal onClose={onClose} width="min(520px,97vw)">
      <div style={{padding:"20px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><div><h3 style={{color:C.text,margin:"0 0 3px",fontSize:16,fontWeight:700}}>Ofertas recibidas</h3><div style={{fontSize:12,color:C.muted}}>{post.titulo}</div></div><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button></div>
        {loading?<Spinner/>:ofertas.length===0?<div style={{color:C.muted,textAlign:"center",padding:"30px 0",fontSize:13}}>Sin ofertas aún.</div>:(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {ofertas.map(o=>{const eb=EB[o.estado||"pendiente"];
              const tieneContra=!!o.contraoferta_precio&&o.estado==="pendiente";
              const contraEsDeAlumno=o.contraoferta_de==="alumno";// yo soy alumno, si la contra es mía, el docente debe responder
              return(
              <div key={o.id} style={{background:C.card,border:`1px solid ${o.estado==="aceptada"?C.success:o.estado==="rechazada"?C.danger:(!o.leida?C.accent:C.border)}`,borderRadius:13,padding:"14px 16px"}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <Avatar letra={o.ofertante_nombre?.[0]||"?"} size={36}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                      <span style={{fontWeight:600,color:C.text,fontSize:13}}>{o.ofertante_nombre}</span>
                      <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:eb.c+"22",color:eb.c,border:`1px solid ${eb.c}44`}}>{eb.t}</span>
                      {tieneContra&&<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:"#C85CE015",color:"#C85CE0",border:"1px solid #C85CE033"}}>↔ Negociando</span>}
                    </div>
                    {/* Oferta original */}
                    {o.precio&&<div style={{fontSize:12,color:C.muted,marginBottom:2}}>Oferta: <span style={{color:C.accent,fontWeight:600}}>{fmtPrice(o.precio)} /{o.precio_tipo}</span></div>}
                    <p style={{color:C.muted,fontSize:12,margin:"0 0 8px",lineHeight:1.5}}>{o.mensaje}</p>
                    {/* Historial de negociación — línea de tiempo de precios */}
                    {(o.precio||o.contraoferta_precio)&&(
                      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:6,flexWrap:"wrap"}}>
                        {o.precio&&<span style={{fontSize:11,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"2px 7px",color:C.muted}}>Oferta: <span style={{color:C.text,fontWeight:600}}>{fmtPrice(o.precio)}/{o.precio_tipo}</span></span>}
                        {o.contraoferta_precio&&<><span style={{color:C.muted,fontSize:11}}>→</span><span style={{fontSize:11,background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:6,padding:"2px 7px",color:C.accent,fontWeight:600}}>Contra: {fmtPrice(o.contraoferta_precio)}/{o.contraoferta_tipo||o.precio_tipo}</span></>}
                        {o.acuerdo_confirmado&&o.precio&&<><span style={{color:C.muted,fontSize:11}}>→</span><span style={{fontSize:11,background:"#4ECB7115",border:"1px solid #4ECB7133",borderRadius:6,padding:"2px 7px",color:C.success,fontWeight:600}}>Acordado ✓</span></>}
                      </div>
                    )}
                    {/* Historial de contraoferta */}
                    {tieneContra&&(
                      <div style={{background:contraEsDeAlumno?"#C85CE011":"#F5C84211",border:`1px solid ${contraEsDeAlumno?"#C85CE033":"#F5C84233"}`,borderRadius:9,padding:"8px 11px",marginBottom:8}}>
                        <div style={{fontSize:10,fontWeight:700,color:contraEsDeAlumno?"#C85CE0":C.accent,marginBottom:3}}>
                          {contraEsDeAlumno?"Tu contraoferta":"Contraoferta del docente"}
                        </div>
                        <div style={{fontSize:12,color:C.accent,fontWeight:600}}>{fmtPrice(o.contraoferta_precio)} /{o.contraoferta_tipo||o.precio_tipo}</div>
                        <div style={{fontSize:12,color:C.muted,marginTop:2}}>{o.contraoferta_mensaje}</div>
                      </div>
                    )}
                    {o.estado==="pendiente"&&!contraEsDeAlumno&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <button onClick={()=>responder(o,"aceptada")} disabled={saving===o.id} style={{background:"#4ECB7122",border:"1px solid #4ECB7144",borderRadius:8,color:C.success,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>Aceptar</button>
                      <button onClick={()=>setContraModal(o)} disabled={saving===o.id} style={{background:"#C85CE015",border:"1px solid #C85CE033",borderRadius:8,color:"#C85CE0",padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>Contraoferta</button>
                      <button onClick={()=>responder(o,"rechazada")} disabled={saving===o.id} style={{background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:8,color:C.danger,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>Rechazar</button>
                      <span style={{fontSize:11,color:C.muted,alignSelf:"center"}}>{fmt(o.created_at)}</span>
                    </div>}
                    {o.estado==="pendiente"&&contraEsDeAlumno&&<div style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>Esperando respuesta del docente…</div>}
                    {o.estado==="aceptada"&&<div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                      <Btn onClick={()=>{onContactar({id:post.id,autor_email:o.ofertante_email,titulo:post.titulo,autor_nombre:o.ofertante_nombre});onClose();}} style={{padding:"6px 14px",fontSize:12}}>Chatear</Btn>
                      <button onClick={()=>setAcuerdoOferta({...o,busqueda_titulo:post.titulo,busqueda_autor_email:session.user.email})} style={{background:"#4ECB7115",border:"1px solid #4ECB7133",borderRadius:9,color:C.success,padding:"6px 13px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:700}}>
                        {o.acuerdo_confirmado?"✓ Ver acuerdo":"📋 Crear acuerdo"}
                      </button>
                    </div>}
                  </div>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>
    </Modal>
    {acuerdoOferta&&<AcuerdoModal oferta={acuerdoOferta} session={session} onClose={()=>setAcuerdoOferta(null)} onConfirmado={()=>{cargar();setAcuerdoOferta(null);}}/>}
    {contraModal&&<ContraofertaModal oferta={contraModal} miRol="alumno" session={session} onClose={()=>setContraModal(null)} onEnviada={()=>{setContraModal(null);cargar();}}/>}
    </>
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
  const toggle=async(post)=>{if(post.activo===false&&post.estado_validacion==="pendiente")return;setToggling(post.id);try{await sb.updatePublicacion(post.id,{activo:post.activo===false},session.access_token);await cargar();}catch(e){alert("Error: "+e.message);}finally{setToggling(null);}};
  const remove=async(post)=>{await sb.deletePublicacion(post.id,session.access_token);cargar();};
  return(
    <div style={{fontFamily:FONT}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h2 style={{fontSize:20,color:C.text,margin:"0 0 3px",fontWeight:700}}>Mis publicaciones</h2><p style={{color:C.muted,fontSize:12,margin:0}}>{posts.length} publicación{posts.length!==1?"es":""}</p></div>
        <Btn onClick={onNew} style={{padding:"7px 13px",fontSize:12}}>+ Nueva</Btn>
      </div>
      {loading?<Spinner/>:posts.length===0?(<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,marginBottom:12}}>—</div><p style={{color:C.muted,fontSize:13}}>Todavía no publicaste nada.</p><Btn onClick={onNew} style={{marginTop:12}}>Crear primera publicación</Btn></div>):(
        <div style={{display:"grid",gap:14}}>
          {posts.map(p=>(<div key={p.id}>
            <MyPostCard post={p} session={session} onEdit={onEdit} onToggle={toggle} onDelete={remove} onOpenCurso={onOpenCurso} toggling={toggling} ofertasPendientes={ofertasMap[p.id]||0}/>
            {ofertasMap[p.id]>0&&<button onClick={()=>setOfertasModal(p)} style={{width:"100%",marginTop:6,background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:9,color:C.accent,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT}}>Ver {ofertasMap[p.id]} oferta{ofertasMap[p.id]!==1?"s":""} nueva{ofertasMap[p.id]!==1?"s":""}</button>}
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
        {["all","busqueda","oferta"].map(t=>(<button key={t} onClick={()=>setFiltroTipo(t)} style={{background:filtroTipo===t?C.accent:C.surface,color:filtroTipo===t?"#fff":C.muted,border:`1px solid ${filtroTipo===t?C.accent:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{t==="all"?"Todo":t==="busqueda"?"Búsquedas":"Ofertas"}</button>))}
      </div>
      {loading?<Spinner/>:filtered.length===0?(<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,marginBottom:12}}>★</div><p style={{color:C.muted,fontSize:13}}>{posts.length===0?"No guardaste favoritos aún.":"Sin resultados."}</p></div>):(
        <div style={{display:"grid",gap:11}}>{filtered.map(p=><PostCard key={p.id} post={p} session={session} onOpenChat={onOpenChat} onOpenDetail={onOpenDetail} onOpenPerfil={onOpenPerfil}/>)}</div>
      )}
    </div>
  );
}

// ─── INSCRIPCIONES PAGE — con tiempo hasta inicio / hasta fin ─────────────────
function InscripcionesPage({session,onOpenCurso,onOpenChat,onMarkNotifsRead}){
  // Marcar notifs como leídas cuando el usuario cliquea una pub concreta, no al montar
  const [inscripciones,setInscripciones]=useState([]);const [posts,setPosts]=useState({});const [loading,setLoading]=useState(true);const [ayudantePubs,setAyudantePubs]=useState([]);
  const [clasesAcordadas,setClasesAcordadas]=useState([]);
  const [espacioActivo,setEspacioActivo]=useState(null);
  // notifs de tipo nuevo_ayudante no leídas, indexadas por publicacion_id
  const [ayudanteNotifs,setAyudanteNotifs]=useState({});
  // IDs de publicaciones recién notificadas (valorar_curso) sin leer
  const [pubsNotifPend,setPubsNotifPend]=useState(new Set());
  useEffect(()=>{
    const miEmail2=session.user.email;const miUid2=session.user.id;
    Promise.all([
      sb.getMisInscripciones(miEmail2,session.access_token),
      sb.getPublicaciones({},session.access_token),
      sb.getMisOfertas(miEmail2,session.access_token).catch(()=>[]),
      sb.getOfertasAceptadasRecibidas(miEmail2,session.access_token).catch(()=>[]),
      sb.getNotificaciones(miEmail2,session.access_token).catch(()=>[]),
    ]).then(([ins,todasPubs,misOfertas,ofertasRecibidas,notifs])=>{
      const insArr=ins||[];
      setInscripciones(insArr);
      const ids=[...new Set(insArr.map(i=>i.publicacion_id))];
      // ayudantes es uuid[] — comparar con UUID del usuario, no su email
      const ayudanteDe=todasPubs.filter(p=>(p.ayudantes||[]).includes(miUid2)&&!ids.includes(p.id));
      setAyudantePubs(ayudanteDe);
      const map={};
      todasPubs.filter(p=>ids.includes(p.id)||ayudanteDe.some(a=>a.id===p.id)).forEach(p=>map[p.id]=p);
      setPosts(map);
      const comoDocente=(misOfertas||[]).filter(o=>o.estado==="aceptada"&&!o.finalizada_cuenta).map(o=>({...o,_rol:"docente"}));
      const comoAlumno=(ofertasRecibidas||[]).filter(o=>!o.finalizada_cuenta).map(o=>({...o,_rol:"alumno"}));
      setClasesAcordadas([...comoDocente,...comoAlumno]);
      // Indexar notifs de nuevo_ayudante por publicacion_id
      const nMap={};
      (notifs||[]).filter(n=>n.tipo==="nuevo_ayudante").forEach(n=>{nMap[n.publicacion_id]=n;});
      setAyudanteNotifs(nMap);
      // Indexar IDs de publicaciones con notif de valorar_curso no leídas
      const pendSet=new Set();
      (notifs||[]).filter(n=>n.tipo==="valorar_curso"&&!n.leida).forEach(n=>{if(n.publicacion_id)pendSet.add(n.publicacion_id);});
      // También marcar clases acordadas recién aceptadas
      (notifs||[]).filter(n=>n.tipo==="busqueda_acordada"&&!n.leida).forEach(n=>{if(n.publicacion_id)pendSet.add(n.publicacion_id);});
      (notifs||[]).filter(n=>n.tipo==="nuevo_contenido"&&!n.leida).forEach(n=>{if(n.publicacion_id)pendSet.add(n.publicacion_id);});
      setPubsNotifPend(pendSet);
    }).finally(()=>setLoading(false));
  },[session]);

  // Marca la notif de ayudante de una pub como leída
  const marcarAyudanteLeida=async(pubId)=>{
    const n=ayudanteNotifs[pubId];
    if(!n)return;
    try{
      await sb.marcarNotifLeida(n.id,session.access_token);
      setAyudanteNotifs(prev=>{const next={...prev};delete next[pubId];return next;});
    }catch{}
  };

  const tiempoInfo=(p,ins)=>{
    if(!p)return null;
    const hoy=new Date();hoy.setHours(0,0,0,0);
    const ini=p.fecha_inicio?new Date(p.fecha_inicio):null;
    const fin=p.fecha_fin?new Date(p.fecha_fin):null;
    if(ini)ini.setHours(0,0,0,0);
    if(fin)fin.setHours(0,0,0,0);
    // Clase ya finalizada manualmente
    if(ins.clase_finalizada||p.finalizado)return{icon:"✓",texto:"Clase finalizada",color:C.success};
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
      if(dias<0)return{icon:"·",texto:"Período finalizado",color:C.muted};
      if(dias===0)return{icon:"⚠️",texto:"Finaliza hoy",color:C.danger};
      if(dias===1)return{icon:"⏳",texto:"Finaliza mañana",color:C.warn};
      return{icon:"⏳",texto:`Finaliza en ${dias} día${dias!==1?"s":""}`,color:dias<=7?C.danger:dias<=30?C.warn:C.muted};
    }
    // Empezó pero sin fecha de fin
    if(ini&&hoy>=ini)return{icon:"🟢",texto:"En curso",color:C.success};
    return null;
  };

  const marcarNotifPubLeida=async(pubId)=>{
    if(!pubsNotifPend.has(pubId))return;
    try{
      await sb.marcarNotifsTipoLeidas(session.user.email,["valorar_curso","nuevo_ayudante","busqueda_acordada","nuevo_contenido"],session.access_token);
      setPubsNotifPend(prev=>{const next=new Set(prev);next.delete(pubId);return next;});
      if(onMarkNotifsRead)onMarkNotifsRead();
    }catch{}
  };

  const renderCard=(ins)=>{
    const p=posts[ins.publicacion_id];if(!p)return null;
    const finalizado=ins.clase_finalizada||!!p.finalizado;
    const ti=tiempoInfo(p,ins);
    const tieneNotif=pubsNotifPend.has(p.id);
    return(
      <div key={ins.id} style={{background:C.card,border:`1px solid ${tieneNotif?C.accent:C.border}`,borderRadius:14,padding:"14px 18px",display:"flex",gap:13,alignItems:"center",flexWrap:"wrap",transition:"border-color .15s"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=tieneNotif?C.accent:C.border}>
        <div onClick={()=>{marcarNotifPubLeida(p.id);onOpenCurso(p);}} style={{display:"flex",gap:12,alignItems:"center",flex:1,minWidth:0,cursor:"pointer"}}>
          <div style={{width:44,height:44,borderRadius:11,background:finalizado?"#4ECB7115":tieneNotif?C.accentDim:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,position:"relative"}}>
            {finalizado?"✓":"·"}
            {tieneNotif&&<span style={{position:"absolute",top:-4,right:-4,background:C.danger,color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>!</span>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titulo}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:3}}>{p.materia} · {p.autor_nombre||safeDisplayName(p.autor_nombre,p.autor_email)}</div>
            {tieneNotif&&<span style={{fontSize:11,color:C.accent,fontWeight:700}}>🔔 Clase finalizada — dejá tu reseña</span>}
            {!tieneNotif&&(ti?<span style={{fontSize:11,color:ti.color,fontWeight:600}}>{ti.icon} {ti.texto}</span>
              :<span style={{fontSize:11,color:C.muted}}>Inscripto {fmt(ins.created_at)}</span>)}
          </div>
        </div>
        <button onClick={()=>onOpenChat({id:p.id,autor_email:p.autor_email,titulo:p.titulo,autor_nombre:p.autor_nombre||safeDisplayName(p.autor_nombre,p.autor_email)})}
          style={{background:C.accent,color:"#fff",border:"none",borderRadius:9,padding:"7px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,flexShrink:0}}>
          Contactar
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
              <span style={{fontSize:13,fontWeight:700,color:C.text}}>Cursos</span>
              <span style={{background:C.accentDim,color:C.accent,borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px"}}>{cursos.length}</span>
            </div>
            <div style={{display:"grid",gap:9,marginBottom:22}}>{cursos.map(renderCard)}</div>
          </>}
          {clases.length>0&&<>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:13,fontWeight:700,color:C.text}}>Clases particulares</span>
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
            <span style={{fontSize:13,fontWeight:700,color:C.text}}>Soy ayudante</span>
            <span style={{background:"#C85CE015",color:C.purple,borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px",border:"1px solid #C85CE033"}}>{ayudantePubs.length}</span>
          </div>
          <div style={{display:"grid",gap:9}}>
            {ayudantePubs.map(p=>{
              const tieneNotif=!!ayudanteNotifs[p.id];
              return(
              <div key={p.id} style={{background:C.card,border:`1px solid ${tieneNotif?"#C85CE088":"#C85CE033"}`,borderRadius:14,padding:"14px 18px",display:"flex",gap:13,alignItems:"center",flexWrap:"wrap",cursor:"pointer",transition:"border-color .15s",position:"relative"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.purple} onMouseLeave={e=>e.currentTarget.style.borderColor=tieneNotif?"#C85CE088":"#C85CE033"}
                onClick={()=>{marcarAyudanteLeida(p.id);onOpenCurso(p);}}>
                {tieneNotif&&(
                  <div style={{position:"absolute",top:10,right:12,background:C.purple,color:"#fff",borderRadius:20,fontSize:9,fontWeight:700,padding:"2px 7px",letterSpacing:.5}}>
                    🔔 Nuevo
                  </div>
                )}
                <div style={{width:44,height:44,borderRadius:11,background:"#C85CE015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>✦</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",padding:"2px 7px",borderRadius:10,background:p.modo==="particular"?"#5CA8E015":"#4ECB7115",color:p.modo==="particular"?C.info:C.success,border:`1px solid ${p.modo==="particular"?"#5CA8E033":"#4ECB7133"}`}}>{p.modo==="particular"?"Clase particular":"Curso"}</span>
                  {p.sinc&&p.modo!=="particular"&&<span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:10,background:C.surface,color:C.muted,border:`1px solid ${C.border}`}}>{p.sinc==="sinc"?"Sincrónico":"Asincrónico"}</span>}
                </div>
                <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titulo}</div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:3}}>{p.materia} · {p.autor_nombre||safeDisplayName(p.autor_nombre,p.autor_email)}</div>
                  <span style={{fontSize:11,color:C.purple,fontWeight:600}}>✦ Sos ayudante</span>
                </div>
                <button onClick={e=>{e.stopPropagation();marcarAyudanteLeida(p.id);onOpenCurso(p);}} style={{background:"#C85CE022",border:"1px solid #C85CE044",borderRadius:9,color:C.purple,padding:"7px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,flexShrink:0}}>Ver contenido →</button>
              </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Clases acordadas */}
      {clasesAcordadas.length>0&&(
        <div style={{marginTop:inscripciones.length>0||ayudantePubs.length>0?28:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:13,fontWeight:700,color:C.text}}>Clases particulares acordadas</span>
            <span style={{background:"#4ECB7115",color:C.success,borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px",border:"1px solid #4ECB7133"}}>{clasesAcordadas.length}</span>
          </div>
          <div style={{display:"grid",gap:9}}>
            {clasesAcordadas.map(o=>{
              const soyDoc=o._rol==="docente";
              const otroN=soyDoc?(o.busqueda_autor_nombre||safeDisplayName(o.busqueda_autor_nombre,o.busqueda_autor_email)):(o.ofertante_nombre||safeDisplayName(o.ofertante_nombre,o.ofertante_email));
              return(
                <div key={o.id} onClick={()=>setEspacioActivo(o)} style={{background:C.card,border:"1px solid #4ECB7133",borderRadius:14,padding:"14px 18px",display:"flex",gap:13,alignItems:"center",cursor:"pointer",transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.success} onMouseLeave={e=>e.currentTarget.style.borderColor="#4ECB7133"}>
                  <div style={{width:44,height:44,borderRadius:11,background:"#4ECB7115",border:"1px solid #4ECB7133",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:C.success,fontWeight:700,flexShrink:0}}>{soyDoc?"✦":"◈"}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.busqueda_titulo||"Clase particular"}</div>
                    <div style={{fontSize:12,color:C.muted,marginBottom:4}}>{soyDoc?"Alumno":"Docente"}: <span style={{color:C.text,fontWeight:600}}>{otroN}</span></div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,background:"#4ECB7115",color:C.success,border:"1px solid #4ECB7133",borderRadius:20,padding:"1px 8px",fontWeight:700}}>Acordada</span>
                      {soyDoc&&<span style={{fontSize:11,background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}33`,borderRadius:20,padding:"1px 8px",fontWeight:600}}>Sos el docente</span>}
                      {o.precio&&<span style={{fontSize:11,color:C.muted}}>{fmtPrice(o.precio)}/{o.precio_tipo||"hora"}</span>}
                    </div>
                  </div>
                  <span style={{fontSize:12,color:C.success,fontWeight:700,flexShrink:0}}>Entrar →</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {inscripciones.length===0&&ayudantePubs.length===0&&clasesAcordadas.length===0&&!loading&&(
        <div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:36,marginBottom:12,color:C.border}}>◎</div><p style={{color:C.muted,fontSize:13}}>No estás inscripto en ningún curso ni clase.</p></div>
      )}
      {espacioActivo&&<EspacioClaseModal oferta={espacioActivo} session={session} onClose={()=>setEspacioActivo(null)}/>}
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
        // Siempre actualizar ultimo al mensaje más reciente
        else if(m.created_at>pubMap[pKey].chats[cKey].ultimo.created_at)pubMap[pKey].chats[cKey].ultimo=m;
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
      {loading?<Spinner/>:grupos.length===0?(<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,marginBottom:12,color:C.border}}>◻</div><p style={{color:C.muted,fontSize:13,marginBottom:8}}>No iniciaste ninguna conversación.</p><p style={{color:C.muted,fontSize:12}}>Inscribite en una clase o que acepten tu oferta para poder chatear.</p></div>):(
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
                  <div key={i} onClick={()=>onOpenChat({id:g.pubId,autor_email:c.otro,titulo:g.pubTitulo,autor_nombre:safeDisplayName(null,c.otro)})}
                    style={{background:C.card,border:`1px solid ${c.unread>0?C.accent:C.border}`,borderRadius:13,padding:"11px 15px",cursor:"pointer",display:"flex",alignItems:"center",gap:11}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=c.unread>0?C.accent:C.border}>
                    <Avatar letra={c.otro[0]} size={34}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:1}}>{safeDisplayName(null,c.otro)}</div>
                      <div style={{color:C.muted,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        <span style={{color:c.ultimo.de_nombre===miEmail?C.accent:C.text,fontWeight:600,fontSize:11}}>{c.ultimo.de_nombre===miEmail?"Vos":safeDisplayName(null,c.otro)}: </span>
                        {c.ultimo.texto}
                      </div>
                    </div>
                    {c.unread>0&&<span style={{background:C.accent,color:"#fff",borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 7px",flexShrink:0}}>{c.unread} nuevo{c.unread!==1?"s":""}</span>}
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
    try{await sb.marcarNotifsTipoLeidas(miEmail,["nuevo_mensaje","chat_grupal"],session.access_token);}catch{}
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
  const QUICK_ACTIONS=[
    {label:"¿Cómo me inscribo?",q:"¿Cómo me inscribo a un curso?"},
    {label:"¿Cómo publico?",q:"¿Cómo publico una clase?"},
    {label:"¿Cómo verifico mi perfil?",q:"¿Cómo verifico mi perfil?"},
    {label:"¿Cómo funciona el quiz?",q:"¿Cómo funciona el sistema de exámenes/quizzes?"},
    {label:"¿Cómo contacto al docente?",q:"¿Cómo contacto a un docente?"},
    {label:"¿Cómo cambio mi nombre?",q:"¿Cómo cambio mi nombre visible?"},
  ];
  const handleQuick=(quickQ)=>{setInput(quickQ);setTimeout(()=>sendMsg(quickQ),50);};
  const sendMsg=async(overrideQ)=>{const q=(overrideQ||input).trim();if(!q)return;
    if(!input.trim())return;const txt=input;setInput("");
    try{
      await sb.insertMensaje({publicacion_id:post.id,de_usuario:session.user.id,para_usuario:null,de_nombre:miEmail,para_nombre:otroEmail,texto:txt,leido:false,pub_titulo:post.titulo},session.access_token);
      // Notificación al receptor por cada mensaje
      sb.insertNotificacion({usuario_id:null,alumno_email:otroEmail,tipo:"nuevo_mensaje",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      cargar();
    }catch(e){alert("Error al enviar: "+e.message);}
  };
  const nombre=post.autor_nombre||safeDisplayName(null,otroEmail)||"Usuario";
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,padding:"12px"}}>
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
            :msgs.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.de_nombre===miEmail?"flex-end":"flex-start"}}><div style={{background:m.de_nombre===miEmail?C.accent:C.card,color:m.de_nombre===miEmail?"#fff":C.text,padding:"8px 12px",borderRadius:13,maxWidth:"78%",fontSize:13,lineHeight:1.5}}>{sanitizeContactInfo(m.texto)}</div></div>))}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:"10px 13px",borderTop:`1px solid ${C.border}`,display:"flex",gap:7,flexShrink:0}}>
          <Input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()} placeholder="Escribí un mensaje..."/>
          <button onClick={sendMsg} style={{background:C.accent,border:"none",borderRadius:9,padding:"9px 13px",fontWeight:700,cursor:"pointer",color:"#fff",fontSize:15,flexShrink:0}}>↑</button>
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
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>Marcar clases finalizadas</h3><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button></div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",marginBottom:14,fontSize:12,color:C.muted}}>Publicación: <span style={{color:C.text,fontWeight:600}}>{post.titulo}</span></div>
        {loading?<Spinner/>:inscripciones.length===0?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No hay alumnos con clase pendiente.</div>:(
          <><div style={{color:C.muted,fontSize:13,marginBottom:12}}>Se notificará a <strong style={{color:C.text}}>{inscripciones.length} alumno{inscripciones.length!==1?"s":""}</strong>.</div>
          <Btn onClick={finalizar} disabled={saving} variant="success" style={{width:"100%",padding:"10px"}}>{saving?"Procesando...":"Confirmar"}</Btn></>
        )}
      </div>
    </Modal>
  );
}

function InscritosCount({pubId,session}){
  const [count,setCount]=useState(null);
  useEffect(()=>{sb.getInscripciones(pubId,session.access_token).then(ins=>setCount(ins.length)).catch(()=>setCount(0));},[pubId,session]);
  return <div style={{color:C.muted,fontSize:13}}><span style={{color:C.text,fontWeight:600}}>{count===null?"...":count}</span> {count===1?"Alumno inscripto":"Alumnos inscriptos"}</div>;
}

// ─── CATEGORÍAS DE RESEÑA — pesos por importancia ────────────────────────────
const RESENA_CATEGORIAS=[
  {id:"conocimiento",   label:"Dominio del tema",          peso:3.0, desc:"¿El docente conocía profundamente lo que enseñó?"},
  {id:"didactica",      label:"Capacidad para enseñar",     peso:2.5, desc:"¿Explicó con claridad y usó buenos ejemplos?"},
  {id:"feedback",       label:"Feedback y correcciones",    peso:2.0, desc:"¿Devolvió retroalimentación útil sobre tu progreso?"},
  {id:"disponibilidad", label:"Disponibilidad y respuesta", peso:1.5, desc:"¿Respondió consultas a tiempo y estuvo accesible?"},
  {id:"amabilidad",     label:"Trato y actitud",            peso:1.2, desc:"¿Fue amable, paciente y abierto a preguntas?"},
  {id:"organizacion",   label:"Organización del curso",     peso:1.0, desc:"¿El contenido estaba bien estructurado y planificado?"},
  {id:"puntualidad",    label:"Puntualidad",                peso:0.8, desc:"¿Cumplió con los horarios y fechas acordados?"},
];

// Calcula el promedio ponderado de las categorías
const calcPromedioResena=(cats)=>{
  if(!cats||Object.keys(cats).length===0)return null;
  let sumPesos=0,sumPuntos=0;
  RESENA_CATEGORIAS.forEach(c=>{
    if(cats[c.id]!=null){sumPuntos+=cats[c.id]*c.peso;sumPesos+=c.peso;}
  });
  return sumPesos>0?Math.round((sumPuntos/sumPesos)*10)/10:null;
};

function ReseñasSeccion({post,session,inscripcion,esMio}){
  const [reseñas,setReseñas]=useState([]);const [loading,setLoading]=useState(true);
  const [texto,setTexto]=useState("");
  const [catScores,setCatScores]=useState({});// {conocimiento:4, didactica:5, ...}
  const [saving,setSaving]=useState(false);const [err,setErr]=useState("");
  const finalizado=!!post.finalizado||(inscripcion?.clase_finalizada);
  const cargar=()=>sb.getReseñas(post.id,session.access_token).then(r=>setReseñas(r)).finally(()=>setLoading(false));
  useEffect(()=>{cargar();},[post.id]); // eslint-disable-line
  const puedeResena=!esMio&&(inscripcion?.clase_finalizada||post.finalizado);

  if(!finalizado&&reseñas.length===0&&!loading)return(
    <div style={{color:C.muted,fontSize:12,fontStyle:"italic",textAlign:"center",padding:"18px 0"}}>
      Las reseñas se habilitarán cuando el docente finalice las clases.
    </div>
  );

  const setScore=(catId,score)=>setCatScores(p=>({...p,[catId]:score}));
  const promedioActual=calcPromedioResena(catScores);
  const catsFilled=Object.keys(catScores).length;

  const enviar=async()=>{
    if(catsFilled<RESENA_CATEGORIAS.length){setErr(`Completá todas las categorías (${catsFilled}/${RESENA_CATEGORIAS.length})`);return;}
    const promedio=calcPromedioResena(catScores);
    setSaving(true);setErr("");
    try{
      await sb.insertReseña({
        publicacion_id:post.id,
        autor_id:session.user.id,
        autor_nombre:sb.getDisplayName(session.user.email),
        autor_pub_email:post.autor_email,
        texto:texto.trim(),
        estrellas:Math.round(promedio),// compatibilidad con campo estrellas existente
        // metadata extra guardada en texto si no hay columna dedicada
        // TODO: agregar columna categorias_json a la tabla reseñas
      },session.access_token);
      if(inscripcion?.clase_finalizada)await sb.updateInscripcion(inscripcion.id,{valorado:true},session.access_token).catch(()=>{});
      await cargar();setTexto("");setCatScores({});
    }catch(e){setErr("Error: "+e.message);}finally{setSaving(false);}
  };

  // Helper: mostrar las categorías de una reseña existente (si tiene metadata)
  const getCatDisplay=(r)=>{
    const prom=r.estrellas||0;
    return `${prom.toFixed?prom.toFixed(1):prom} ★`;
  };

  return(<>
    <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:12}}>Reseñas ({reseñas.length})</div>

    {/* Lista de reseñas */}
    {loading?<Spinner/>:reseñas.map(r=>(
      <div key={r.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8}}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
          <Avatar letra={r.autor_nombre?.[0]||"?"} size={28}/>
          <div style={{flex:1}}>
            <span style={{fontWeight:600,color:C.text,fontSize:13}}>{r.autor_nombre}</span>
            <div style={{fontSize:12,color:"#B45309",marginTop:1}}>{"★".repeat(r.estrellas||0)}{"☆".repeat(5-(r.estrellas||0))} <span style={{color:C.muted}}>({r.estrellas?.toFixed?r.estrellas.toFixed(1):r.estrellas}/5)</span></div>
          </div>
          <span style={{fontSize:11,color:C.muted}}>{fmtRel(r.created_at)}</span>
        </div>
        {r.texto&&<p style={{color:C.muted,fontSize:13,margin:0,lineHeight:1.6}}>{r.texto}</p>}
      </div>
    ))}

    {/* Formulario de nueva reseña */}
    {puedeResena&&(<div style={{marginTop:14,background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
      <div style={{fontWeight:600,color:C.text,fontSize:13,marginBottom:4}}>Tu reseña</div>
      <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Evaluá cada aspecto del 1 (muy malo) al 5 (excelente). El promedio final se calcula automáticamente según la importancia de cada categoría.</div>

      {/* Categorías ponderadas */}
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
        {RESENA_CATEGORIAS.map(cat=>{
          const score=catScores[cat.id];
          return(
            <div key={cat.id} style={{background:C.surface,borderRadius:9,padding:"10px 12px",border:`1px solid ${score?C.accent+"30":C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:6}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{cat.label}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:1}}>{cat.desc}</div>
                </div>
                <div style={{fontSize:10,color:C.muted,background:C.bg,borderRadius:20,padding:"2px 7px",flexShrink:0}}>
                  peso {cat.peso}x
                </div>
              </div>
              <div style={{display:"flex",gap:4}}>
                {[1,2,3,4,5].map(n=>(
                  <button key={n} onClick={()=>setScore(cat.id,n)}
                    style={{flex:1,padding:"6px 0",borderRadius:6,border:`1px solid ${score===n?"#B45309":"transparent"}`,
                      background:score&&n<=score?"#F59E0B18":"transparent",
                      cursor:"pointer",fontFamily:FONT,fontSize:13,
                      color:score&&n<=score?"#B45309":C.muted,fontWeight:score===n?700:400,
                      transition:"all .1s"}}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comentario libre */}
      <textarea value={texto} onChange={e=>setTexto(e.target.value.slice(0,500))}
        placeholder="Comentario adicional (opcional)..."
        style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",resize:"vertical",minHeight:70,boxSizing:"border-box",fontFamily:FONT,marginBottom:10}}/>

      {/* Preview promedio */}
      {promedioActual&&(
        <div style={{background:"#F59E0B10",border:"1px solid #F59E0B30",borderRadius:8,padding:"8px 12px",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
          <span style={{color:"#B45309",fontSize:18}}>★</span>
          <div>
            <span style={{fontWeight:700,color:"#B45309",fontSize:16}}>{promedioActual}</span>
            <span style={{color:C.muted,fontSize:12}}> /5 · promedio ponderado ({catsFilled}/{RESENA_CATEGORIAS.length} categorías)</span>
          </div>
        </div>
      )}

      <ErrMsg msg={err}/>
      <button onClick={enviar} disabled={saving||catsFilled<RESENA_CATEGORIAS.length}
        style={{background:catsFilled>=RESENA_CATEGORIAS.length?C.accent:"transparent",border:`1px solid ${catsFilled>=RESENA_CATEGORIAS.length?C.accent:C.border}`,borderRadius:20,color:catsFilled>=RESENA_CATEGORIAS.length?"#fff":C.muted,padding:"9px 20px",fontWeight:600,fontSize:13,cursor:catsFilled>=RESENA_CATEGORIAS.length?"pointer":"not-allowed",fontFamily:FONT,transition:"all .15s",opacity:saving?.6:1}}>
        {saving?"Guardando...":catsFilled<RESENA_CATEGORIAS.length?`Completá todas las categorías (${catsFilled}/${RESENA_CATEGORIAS.length})`:"Publicar reseña"}
      </button>
    </div>)}
    {!esMio&&inscripcion&&!inscripcion.clase_finalizada&&!loading&&(
      <div style={{marginTop:10,fontSize:12,color:C.muted,fontStyle:"italic"}}>Podrás dejar una reseña cuando el docente finalice las clases.</div>
    )}
  </>);
}



// ─── AYUDANTE BUSCADOR — el docente agrega co-docentes por email ──────────────
// ayudantesActuales = array de UUIDs (como los guarda Supabase en uuid[])
// Para mostrar email/nombre, resolvemos UUIDs desde la tabla usuarios al montar.
function AyudanteBuscador({post,session,ayudantesActuales,onUpdate}){
  const [emailInput,setEmailInput]=useState("");const [saving,setSaving]=useState(false);const [err,setErr]=useState("");
  // mapa uuid→{email,nombre} para mostrar en la lista
  const [uuidMap,setUuidMap]=useState({});
  useEffect(()=>{
    if(!ayudantesActuales.length)return;
    // Resolver los UUIDs que aún no están en el mapa
    const faltantes=ayudantesActuales.filter(id=>!uuidMap[id]);
    if(!faltantes.length)return;
    Promise.all(faltantes.map(id=>sb.getUsuarioById(id,session.access_token))).then(results=>{
      const nuevo={};results.forEach((u,i)=>{if(u)nuevo[faltantes[i]]=u;});
      setUuidMap(prev=>({...prev,...nuevo}));
    }).catch(()=>{});
  },[ayudantesActuales.join(",")]);// eslint-disable-line

  const agregar=async()=>{
    const email=emailInput.trim().toLowerCase();
    if(!email){setErr("Ingresá un email");return;}
    // Verificar si ya está (comparando por email en el mapa)
    const yaEsta=ayudantesActuales.some(uid=>uuidMap[uid]?.email===email);
    if(yaEsta){setErr("Ya es co-docente de este curso");return;}
    if(email===session.user.email){setErr("No podés agregarte como co-docente de tu propio curso");return;}
    setSaving(true);setErr("");
    try{
      // Buscar UUID del usuario por email
      const usuario=await sb.getUsuarioByEmail(email,session.access_token);
      if(!usuario){setErr("No se encontró ningún usuario con ese email");setSaving(false);return;}
      const uid=usuario.id;
      const newAyuds=[...ayudantesActuales,uid];
      await sb.updatePublicacion(post.id,{ayudantes:newAyuds},session.access_token);
      // Guardar en el mapa local para que aparezca de inmediato
      setUuidMap(prev=>({...prev,[uid]:usuario}));
      // Si estaba inscripto, desinscribirlo
      try{
        const insc=await sb.getInscripcionByPubEmail(post.id,email,session.access_token);
        if(insc&&insc.length>0)await sb.deleteInscripcion(insc[0].id,session.access_token);
      }catch(_){}
      // Notificar al nuevo co-docente
      sb.insertNotificacion({usuario_id:uid,alumno_email:email,tipo:"nuevo_ayudante",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      onUpdate(newAyuds);setEmailInput("");setErr("");
    }catch(e){setErr("Error: "+e.message);}finally{setSaving(false);}
  };
  const quitar=async(uid)=>{
    const newAyuds=ayudantesActuales.filter(a=>a!==uid);
    try{await sb.updatePublicacion(post.id,{ayudantes:newAyuds},session.access_token);onUpdate(newAyuds);}catch(e){alert(e.message);}
  };
  return(
    <div style={{marginTop:14,borderTop:`1px solid ${C.border}`,paddingTop:14}}>
      <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:1,marginBottom:10,display:"flex",alignItems:"center",gap:7}}>
        CO-DOCENTES
        <span style={{fontSize:10,background:"#C85CE015",color:C.purple,borderRadius:20,padding:"1px 7px",border:"1px solid #C85CE033",fontWeight:600,letterSpacing:0}}>{ayudantesActuales.length}</span>
      </div>
      {ayudantesActuales.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:10}}>
          {ayudantesActuales.map(uid=>{
            const u=uuidMap[uid];
            const displayEmail=u?.email||uid;
            const displayNombre=u?.display_name||u?.nombre||safeDisplayName(null,displayEmail);
            return(
            <div key={uid} style={{display:"flex",alignItems:"center",gap:8,background:"#C85CE015",border:"1px solid #C85CE033",borderRadius:10,padding:"6px 11px"}}>
              <Avatar letra={displayNombre[0]} size={22}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:C.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayNombre}</div>
                <div style={{fontSize:10,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayEmail}</div>
              </div>
              <button onClick={()=>quitar(uid)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,color:C.muted,fontSize:11,cursor:"pointer",padding:"2px 8px",fontFamily:FONT,flexShrink:0}}>Quitar</button>
            </div>);
          })}
        </div>
      )}
      <div style={{display:"flex",gap:7}}>
        <input value={emailInput} onChange={e=>{setEmailInput(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&agregar()} placeholder="Email del co-docente" type="email" style={{flex:1,background:C.surface,border:`1px solid ${err?C.danger:C.border}`,borderRadius:9,padding:"7px 11px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT}}/>
        <button onClick={agregar} disabled={saving||!emailInput.trim()} style={{background:"#C85CE022",border:"1px solid #C85CE044",borderRadius:9,color:C.purple,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>{saving?"…":"+"}</button>
      </div>
      {err&&<div style={{fontSize:11,color:C.danger,marginTop:4}}>{err}</div>}
      <div style={{fontSize:10,color:C.muted,marginTop:6}}>Los co-docentes acceden al contenido y alumnos sin inscribirse.</div>
    </div>
  );
}
// ─── CHAT CURSO — chat grupal para inscriptos + dueño + ayudantes ─────────────
function ChatCurso({post,session,ayudantes=[],ayudanteEmails=[],onNewMessages}){
  const [msgs,setMsgs]=useState([]);const [input,setInput]=useState("");const [loading,setLoading]=useState(true);
  const miEmail=session.user.email;
  const bottomRef=useRef(null);const listRef=useRef(null);const didScrollRef=useRef(false);
  const lastSeenRef=useRef(0);
  const cargar=useCallback(async()=>{
    try{
      const grupal=await sb.getMensajesGrupo(post.id,session.access_token).catch(()=>[]);
      const withNames=grupal.map(m=>({...m,de_nombre_display:sb.getDisplayName(m.de_nombre)}));
      setMsgs(prev=>{
        // Detectar mensajes nuevos vs última vez que se vio el chat
        if(prev.length>0&&withNames.length>prev.length&&onNewMessages){
          const nuevos=withNames.length-prev.length;
          onNewMessages(nuevos);
        }
        return withNames;
      });
      if(!didScrollRef.current&&withNames.length>0){didScrollRef.current=true;setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),60);}
    }finally{setLoading(false);}
  },[post.id,session.access_token]);
  useEffect(()=>{cargar();const t=setInterval(cargar,6000);return()=>clearInterval(t);},[cargar]);
  const QUICK_ACTIONS=[
    {label:"¿Cómo me inscribo?",q:"¿Cómo me inscribo a un curso?"},
    {label:"¿Cómo publico?",q:"¿Cómo publico una clase?"},
    {label:"¿Cómo verifico mi perfil?",q:"¿Cómo verifico mi perfil?"},
    {label:"¿Cómo funciona el quiz?",q:"¿Cómo funciona el sistema de exámenes/quizzes?"},
    {label:"¿Cómo contacto al docente?",q:"¿Cómo contacto a un docente?"},
    {label:"¿Cómo cambio mi nombre?",q:"¿Cómo cambio mi nombre visible?"},
  ];
  const handleQuick=(quickQ)=>{setInput(quickQ);setTimeout(()=>sendMsg(quickQ),50);};
  const sendMsg=async()=>{if(!input.trim())return;const txt=input.trim();setInput("");
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
  // ayudantes es uuid[] pero los mensajes tienen email — no podemos comparar directo.
  // Usamos la prop ayudanteEmails (array de emails resueltos) si está disponible,
  // o caemos a comparar con UUIDs (siempre falso, pero no rompe nada).
  const esAyudante=(email)=>ayudanteEmails.includes(email)||ayudantes.includes(email);
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
            const colorMsg=esMiMsg?"#fff":C.text;
            const nameColor=isOwner?C.purple:isAyud?C.info:C.muted;
            const roleLabel=isOwner?" · docente":isAyud?" · ayudante":"";
            return(<div key={i} style={{display:"flex",justifyContent:esMiMsg?"flex-end":"flex-start",gap:6,alignItems:"flex-end"}}>
              {!esMiMsg&&<Avatar letra={(m.de_nombre||"?")[0]} size={24}/>}
              <div style={{maxWidth:"75%"}}>
                {!esMiMsg&&<div style={{fontSize:10,color:nameColor,fontWeight:isSpec?700:500,marginBottom:3}}>
                  {getDisplayName(m)}{roleLabel}
                </div>}
                <div style={{background:bgMsg,color:colorMsg,padding:"8px 12px",borderRadius:esMiMsg?"13px 13px 4px 13px":"13px 13px 13px 4px",fontSize:12,lineHeight:1.5,border:`1px solid ${borderMsg}`}}>
                  {sanitizeContactInfo(m.texto)}
                </div>
              </div>
            </div>);
          })}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"10px 13px",borderTop:`1px solid ${C.border}`,display:"flex",gap:7}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}} placeholder="Escribí al grupo..." style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"8px 13px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT}}/>
        <button onClick={sendMsg} disabled={!input.trim()} style={{background:input.trim()?C.accent:C.surface,border:`1px solid ${input.trim()?C.accent:C.border}`,borderRadius:"50%",width:34,height:34,cursor:input.trim()?"pointer":"default",fontSize:15,flexShrink:0,transition:"all .15s"}}>↑</button>
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


// ─── EDIT CAL MODAL ───────────────────────────────────────────────────────────
function EditCalModal({post,session,onClose,onSaved}){
  const [clases,setClases]=useState(()=>{try{return post.clases_sinc?JSON.parse(post.clases_sinc):[]}catch{return [];}});
  const [saving,setSaving]=useState(false);
  const iS={background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 7px",color:C.text,fontSize:11,fontFamily:FONT,outline:"none"};
  const add=()=>setClases(p=>[...p,{dia:"Lunes",hora_inicio:"09:00",hora_fin:"10:00"}]);
  const upd=(i,k,v)=>setClases(p=>p.map((x,j)=>j===i?{...x,[k]:v}:x));
  const rem=(i)=>setClases(p=>p.filter((_,j)=>j!==i));
  const save=async()=>{setSaving(true);try{await sb.updatePublicacion(post.id,{clases_sinc:JSON.stringify(clases),sinc:"sinc"},session.access_token);onSaved(clases);}catch(e){alert(e.message);}finally{setSaving(false);}};
  return(<Modal onClose={onClose} width="min(480px,97vw)"><div style={{padding:"20px 22px"}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>Editar horarios</h3><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button></div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:12,color:C.muted}}>Días y horas de clase</span><button onClick={add} style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:7,color:C.accent,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:FONT}}>+ Agregar</button></div>
    {clases.length===0&&<div style={{textAlign:"center",padding:"20px 0",color:C.muted,fontSize:13}}>Sin horarios. Agregá al menos uno.</div>}
    {clases.map((cl,i)=>(<div key={i} style={{display:"flex",gap:5,alignItems:"center",marginBottom:6,background:C.card,borderRadius:9,padding:"7px 9px",border:`1px solid ${cl.hora_fin<=cl.hora_inicio?"#E05C5C44":C.border}`}}>
      <select value={cl.dia} onChange={e=>upd(i,"dia",e.target.value)} style={{...iS,flex:2,cursor:"pointer"}}>
        {["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map(d=><option key={d}>{d}</option>)}
      </select>
      <input type="time" value={cl.hora_inicio} onChange={e=>{const v=e.target.value;upd(i,"hora_inicio",v);if(cl.hora_fin&&cl.hora_fin<=v){const[h,m]=v.split(":").map(Number);const fin=`${String(h+(m>=30?1:0)).padStart(2,"0")}:${m>=30?"00":String(m+30).padStart(2,"0")}`;upd(i,"hora_fin",fin);}}} style={{...iS,flex:2,colorScheme:localStorage.getItem("cl_theme")||"light"}}/>
      <span style={{color:C.muted,fontSize:11}}>→</span>
      <input type="time" value={cl.hora_fin} onChange={e=>{const v=e.target.value;if(v<=cl.hora_inicio)return;upd(i,"hora_fin",v);}} style={{...iS,flex:2,colorScheme:localStorage.getItem("cl_theme")||"light",borderColor:cl.hora_fin<=cl.hora_inicio?C.danger:C.border,color:cl.hora_fin<=cl.hora_inicio?C.danger:C.text}}/>
      <button onClick={()=>rem(i)} style={{background:"none",border:"none",color:C.danger,fontSize:15,cursor:"pointer",flexShrink:0}}>×</button>
    </div>))}
    <Btn onClick={save} disabled={saving} style={{width:"100%",padding:"10px",marginTop:10}}>{saving?"Guardando...":"Guardar horarios"}</Btn>
  </div></Modal>);
}




// ─── ERROR BOUNDARY (protege componentes que pueden crashear) ─────────────────
class SafeWrapper extends React.Component {
  constructor(props){super(props);this.state={crashed:false,msg:""};}
  static getDerivedStateFromError(e){return{crashed:true,msg:e.message};}
  render(){
    if(this.state.crashed){
      const msg=this.state.msg||"";
      const needsTable=msg.includes("does not exist")||msg.includes("relation")||msg.includes("quiz_entregas");
      return(
        <div style={{background:"#E0955C15",border:"1px solid #E0955C33",borderRadius:12,padding:"14px 18px",fontSize:12,color:"#E0955C",margin:"8px 0"}}>
          <div style={{fontWeight:700,marginBottom:4}}>⚠ Error al cargar esta sección</div>
          {needsTable
            ?<div>Falta ejecutar el SQL de <code>quiz_entregas</code> en Supabase.<br/>Ejecutá el script SQL que te pasamos en una sesión anterior.</div>
            :<div>Detalle: {msg||"Error desconocido"}.<br/>Intentá recargar la página.</div>}
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── QUIZ CREATOR (para docentes) ─────────────────────────────────────────────
function QuizCreator({publicacionId,session,onSaved,onCancel}){
  const [titulo,setTitulo]=useState("");
  const [tipo,setTipo]=useState("multiple");// "multiple" | "entregable"
  const [preguntas,setPreguntas]=useState([{texto:"",opciones:["","","",""],correcta:0}]);
  const [consigna,setConsigna]=useState("");// para entregable
  const [fechaInicio,setFechaInicio]=useState("");
  const [fechaCierre,setFechaCierre]=useState("");
  const [saving,setSaving]=useState(false);

  const [cantIA,setCantIA]=useState(5);
  const [loadingIA,setLoadingIA]=useState(false);
  const [temaIA,setTemaIA]=useState("");
  const addPregunta=()=>setPreguntas(p=>[...p,{texto:"",opciones:["","","",""],correcta:0}]);
  const updPregunta=(i,field,val)=>setPreguntas(p=>p.map((q,idx)=>idx===i?{...q,[field]:val}:q));
  const updOpcion=(qi,oi,val)=>setPreguntas(p=>p.map((q,idx)=>idx===qi?{...q,opciones:q.opciones.map((o,j)=>j===oi?val:o)}:q));
  const remPregunta=(i)=>setPreguntas(p=>p.filter((_,idx)=>idx!==i));

  const generarConIA=async()=>{
    if(!temaIA.trim())return;
    setLoadingIA(true);
    try{
      const raw=await sb.callIA(
        `Sos un generador de quizzes educativos para una plataforma argentina.
Generá ${cantIA} preguntas de multiple choice sobre el tema indicado.
SIEMPRE respondé con JSON válido sin markdown:
{"preguntas":[{"texto":"...","opciones":["A","B","C","D"],"correcta":0},...]}
- opciones: exactamente 4 opciones
- correcta: índice (0-3) de la respuesta correcta
- Las preguntas deben ser claras, educativas y de dificultad media`,
        `Tema: "${temaIA}". Generá ${cantIA} preguntas. Respondé SOLO JSON.`,
        800
      );
      // Extracción robusta: buscar el array de preguntas directamente
      // Groq a veces incluye texto extra antes/después del JSON
      let parsed=null;
      // Intentar extraer JSON completo
      const jsonMatch=raw.match(/\{[\s\S]*"preguntas"[\s\S]*\}/);
      if(jsonMatch){try{parsed=JSON.parse(jsonMatch[0]);}catch{}}
      // Fallback: extraer solo el array de preguntas
      if(!parsed){const arrMatch=raw.match(/"preguntas"\s*:\s*(\[[\s\S]*?\])/);if(arrMatch){try{parsed={preguntas:JSON.parse(arrMatch[1])};}catch{}}}
      if(!parsed)throw new Error("No se pudo parsear la respuesta de la IA");
      if(parsed.preguntas?.length){
        setPreguntas(parsed.preguntas.map(p=>({
          texto:p.texto||"",
          opciones:(p.opciones||["","","",""]).slice(0,4).map(String),
          correcta:typeof p.correcta==="number"?p.correcta:0
        })));
        if(!titulo)setTitulo(`Quiz: ${temaIA}`);
      }
    }catch(e){alert("No se pudo generar: "+e.message);}
    finally{setLoadingIA(false);}
  };

  const guardar=async()=>{
    if(!titulo.trim())return;
    setSaving(true);
    try{
      const quizData={
        tipo_quiz:tipo,
        preguntas:tipo==="multiple"?preguntas:null,
        consigna:tipo==="entregable"?consigna:null,
        fecha_inicio:fechaInicio||null,
        fecha_cierre:fechaCierre||null,
      };
      const data={
        publicacion_id:publicacionId,
        tipo:"quiz",
        titulo:titulo.trim(),
        texto:JSON.stringify(quizData),
        orden:999,
        visible:true,
      };
      let saved=null;
      try{const r=await sb.insertContenido(data,session.access_token);saved=r?.[0];}catch(e){throw e;}
      // Si no vino el id, buscar el item recién creado por orden+titulo
      if(!saved?.id){
        try{
          const todos=await sb.getContenido(publicacionId,session.access_token);
          saved=todos.filter(x=>x.tipo==="quiz"&&x.titulo===titulo.trim()).pop();
        }catch{}
      }
      onSaved(saved||{...data,id:null});
    }catch(e){alert("Error: "+e.message);}
    finally{setSaving(false);}
  };

  const iS={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 11px",color:C.text,fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:8};
  const ahora=new Date().toISOString().slice(0,16);

  return(
    <div style={{background:C.surface,border:`1px solid ${C.accent}55`,borderRadius:14,padding:16,marginBottom:14,animation:"fadeIn .15s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span style={{fontWeight:700,color:C.accent,fontSize:13}}>📝 Nuevo quiz</span>
        <button onClick={onCancel} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>×</button>
      </div>
      <div style={{marginBottom:8}}>
        <div style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:.8,marginBottom:4}}>TÍTULO DEL QUIZ <span style={{color:C.danger}}>*</span></div>
        <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ej: Parcial 1 — Unidad 2" style={{...iS,marginBottom:0,border:`1px solid ${titulo.trim()?C.border:C.danger+"66"}`}}/>
        {!titulo.trim()&&<div style={{fontSize:10,color:C.danger,marginTop:3}}>Requerido para habilitar Guardar</div>}
      </div>
      {/* Tipo */}
      <div style={{display:"flex",gap:7,marginBottom:12}}>
        {[["multiple","📋 Multiple choice"],["entregable","📤 Entregable"],["autoevaluacion","🪞 Autoevaluación"],["peer","👥 Revisión entre pares"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTipo(v)} style={{flex:1,padding:"7px",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT,background:tipo===v?C.accent:C.card,color:tipo===v?"#fff":C.muted,border:`1px solid ${tipo===v?"transparent":C.border}`}}>{l}</button>
        ))}
      </div>
      {/* Fechas */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <div>
          <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:4,letterSpacing:.8}}>INICIO (opcional)</div>
          <input type="datetime-local" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} min={ahora} style={{...iS,marginBottom:0,colorScheme:localStorage.getItem("cl_theme")||"light",fontSize:11}}/>
        </div>
        <div>
          <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:4,letterSpacing:.8}}>CIERRE (opcional)</div>
          <input type="datetime-local" value={fechaCierre} onChange={e=>setFechaCierre(e.target.value)} min={fechaInicio||ahora} style={{...iS,marginBottom:0,colorScheme:localStorage.getItem("cl_theme")||"light",fontSize:11}}/>
        </div>
      </div>
      {tipo==="entregable"?(
        <div>
          <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:4,letterSpacing:.8}}>CONSIGNA</div>
          <textarea value={consigna} onChange={e=>setConsigna(e.target.value)} placeholder="Describí qué tiene que hacer el alumno..." style={{...iS,minHeight:80,resize:"vertical"}}/>
        </div>
      ):(
        <div>
          {/* Generador IA */}
          <div style={{background:C.card,border:"1px solid #C85CE033",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:700,color:C.purple,letterSpacing:.8,marginBottom:8}}>✦ GENERAR CON IA</div>
            <div style={{display:"flex",gap:7,marginBottom:7}}>
              <input value={temaIA} onChange={e=>setTemaIA(e.target.value)} placeholder="Tema del quiz (ej: Sistema solar, Revolución francesa...)" style={{...iS,marginBottom:0,flex:1,fontSize:11}}/>
            </div>
            <div style={{display:"flex",gap:7,alignItems:"center"}}>
              <span style={{fontSize:11,color:C.muted,flexShrink:0}}>Cantidad:</span>
              <input type="number" min="1" max="20" value={cantIA} onChange={e=>setCantIA(Math.max(1,Math.min(20,parseInt(e.target.value)||5)))} style={{width:52,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"4px 8px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT,textAlign:"center"}}/>
              <span style={{fontSize:11,color:C.muted}}>(máx 20)</span>
              <button onClick={generarConIA} disabled={loadingIA||!temaIA.trim()}
                style={{marginLeft:"auto",background:"#C85CE022",border:"1px solid #C85CE044",borderRadius:8,color:C.purple,padding:"5px 14px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:700,opacity:!temaIA.trim()?0.5:1}}>
                {loadingIA?"Generando…":"✦ Generar"}
              </button>
            </div>
            {loadingIA&&<div style={{fontSize:11,color:C.muted,marginTop:6,display:"flex",alignItems:"center",gap:5}}><Spinner small/>Creando {cantIA} preguntas…</div>}
            {!loadingIA&&preguntas[0]?.texto&&<div style={{fontSize:10,color:C.success,marginTop:5}}>✓ {preguntas.length} preguntas generadas — podés editarlas abajo</div>}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:.8}}>PREGUNTAS ({preguntas.length})</span>
            <button onClick={addPregunta} style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:7,color:C.accent,padding:"3px 9px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:700}}>+ Agregar</button>
          </div>
          {preguntas.map((q,qi)=>(
            <div key={qi} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:12,marginBottom:8}}>
              <div style={{display:"flex",gap:7,marginBottom:8}}>
                <input value={q.texto} onChange={e=>updPregunta(qi,"texto",e.target.value)} placeholder={`Pregunta ${qi+1}`} style={{...iS,marginBottom:0,flex:1}}/>
                {preguntas.length>1&&<button onClick={()=>remPregunta(qi)} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}
              </div>
              {q.opciones.map((op,oi)=>(
                <div key={oi} style={{display:"flex",gap:7,alignItems:"center",marginBottom:5}}>
                  <button onClick={()=>updPregunta(qi,"correcta",oi)} style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${q.correcta===oi?C.success:C.border}`,background:q.correcta===oi?C.success:"transparent",cursor:"pointer",flexShrink:0,padding:0}}/>
                  <input value={op} onChange={e=>updOpcion(qi,oi,e.target.value)} placeholder={`Opción ${oi+1}${q.correcta===oi?" (correcta)":""}`} style={{...iS,marginBottom:0,flex:1,fontSize:11}}/>
                </div>
              ))}
              <div style={{fontSize:10,color:C.muted,marginTop:3}}>● = respuesta correcta</div>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={guardar} disabled={saving||!titulo.trim()} style={{background:C.accent,border:"none",borderRadius:9,color:"#fff",padding:"8px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,opacity:!titulo.trim()?0.5:1,flex:1}}>{saving?"Guardando...":"Guardar quiz ✓"}</button>
        <button onClick={onCancel} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"8px 14px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>Cancelar</button>
      </div>
    </div>
  );
}



// ─── QUIZ EDITOR ──────────────────────────────────────────────────────────────
function QuizEditor({item,session,onSaved,onClose}){
  let qd={};try{qd=JSON.parse(item.texto||"{}");}catch{}
  const [titulo,setTitulo]=useState(item.titulo||"");
  const [tipo,setTipo]=useState(qd.tipo_quiz||"multiple");
  const [preguntas,setPreguntas]=useState(
    Array.isArray(qd.preguntas)&&qd.preguntas.length>0
      ?qd.preguntas
      :[{texto:"",opciones:["","","",""],correcta:0}]
  );
  const [consigna,setConsigna]=useState(qd.consigna||"");
  const [fechaInicio,setFechaInicio]=useState(qd.fecha_inicio||"");
  const [fechaCierre,setFechaCierre]=useState(qd.fecha_cierre||"");
  const [saving,setSaving]=useState(false);

  const addPregunta=()=>setPreguntas(p=>[...p,{texto:"",opciones:["","","",""],correcta:0}]);
  const updPregunta=(i,field,val)=>setPreguntas(p=>p.map((q,idx)=>idx===i?{...q,[field]:val}:q));
  const updOpcion=(qi,oi,val)=>setPreguntas(p=>p.map((q,idx)=>idx===qi?{...q,opciones:q.opciones.map((o,j)=>j===oi?val:o)}:q));
  const remPregunta=(i)=>setPreguntas(p=>p.filter((_,idx)=>idx!==i));

  const guardar=async()=>{
    if(!titulo.trim())return;
    setSaving(true);
    try{
      const quizData={tipo_quiz:tipo,preguntas:tipo==="multiple"?preguntas:null,consigna:tipo==="entregable"?consigna:null,fecha_inicio:fechaInicio||null,fecha_cierre:fechaCierre||null};
      const data={titulo:titulo.trim(),texto:JSON.stringify(quizData)};
      await sb.updateContenido(item.id,data,session.access_token);
      onSaved(data);
    }catch(e){alert("Error: "+e.message);}
    finally{setSaving(false);}
  };

  const iS={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 11px",color:C.text,fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:8};
  const ahora=new Date().toISOString().slice(0,16);

  return(
    <div style={{background:C.surface,borderRadius:14,padding:16,fontFamily:FONT}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span style={{fontWeight:700,color:C.accent,fontSize:14}}>✎ Editar quiz</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>×</button>
      </div>
      <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Título del quiz" style={iS}/>
      <div style={{display:"flex",gap:7,marginBottom:12}}>
        {[["multiple","📋 Multiple choice"],["entregable","📤 Entregable"],["autoevaluacion","🪞 Autoevaluación"],["peer","👥 Revisión entre pares"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTipo(v)} style={{flex:1,padding:"7px",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT,background:tipo===v?C.accent:C.card,color:tipo===v?"#fff":C.muted,border:`1px solid ${tipo===v?"transparent":C.border}`}}>{l}</button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <div>
          <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:4,letterSpacing:.8}}>INICIO (opcional)</div>
          <input type="datetime-local" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} style={{...iS,marginBottom:0,colorScheme:localStorage.getItem("cl_theme")||"light",fontSize:11}}/>
        </div>
        <div>
          <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:4,letterSpacing:.8}}>CIERRE (opcional)</div>
          <input type="datetime-local" value={fechaCierre} onChange={e=>setFechaCierre(e.target.value)} min={fechaInicio||ahora} style={{...iS,marginBottom:0,colorScheme:localStorage.getItem("cl_theme")||"light",fontSize:11}}/>
        </div>
      </div>
      {tipo==="entregable"?(
        <div>
          <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:4}}>CONSIGNA</div>
          <textarea value={consigna} onChange={e=>setConsigna(e.target.value)} placeholder="Consigna..." style={{...iS,minHeight:80,resize:"vertical"}}/>
        </div>
      ):(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:.8}}>PREGUNTAS ({preguntas.length})</span>
            <button onClick={addPregunta} style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:7,color:C.accent,padding:"3px 9px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:700}}>+ Agregar</button>
          </div>
          {preguntas.map((q,qi)=>(
            <div key={qi} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:12,marginBottom:8}}>
              <div style={{display:"flex",gap:7,marginBottom:8}}>
                <input value={q.texto} onChange={e=>updPregunta(qi,"texto",e.target.value)} placeholder={`Pregunta ${qi+1}`} style={{...iS,marginBottom:0,flex:1}}/>
                {preguntas.length>1&&<button onClick={()=>remPregunta(qi)} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}
              </div>
              {q.opciones.map((op,oi)=>(
                <div key={oi} style={{display:"flex",gap:7,alignItems:"center",marginBottom:5}}>
                  <button onClick={()=>updPregunta(qi,"correcta",oi)} style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${q.correcta===oi?C.success:C.border}`,background:q.correcta===oi?C.success:"transparent",cursor:"pointer",flexShrink:0,padding:0}}/>
                  <input value={op} onChange={e=>updOpcion(qi,oi,e.target.value)} placeholder={`Opción ${oi+1}${q.correcta===oi?" ✓":""}`} style={{...iS,marginBottom:0,flex:1,fontSize:11}}/>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={guardar} disabled={saving||!titulo.trim()} style={{background:C.accent,border:"none",borderRadius:9,color:"#fff",padding:"8px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,flex:1,opacity:!titulo.trim()?0.5:1}}>{saving?"Guardando...":"Guardar cambios ✓"}</button>
        <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"8px 14px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>Cancelar</button>
      </div>
    </div>
  );
}

// ─── ENTREGA TEXTO — renderiza texto o archivo de una entrega ─────────────────
function EntregaTexto({texto}){
  if(!texto)return null;
  const esArchivo=texto.includes("[Archivo:")&&texto.includes("data:");
  if(esArchivo){
    const lines=texto.split("\n");
    const nombreLine=lines.find(l=>l.startsWith("[Archivo:"));
    const nombre=nombreLine?.match(/\[Archivo: (.+)\]/)?.[1]||"archivo";
    const dataLine=lines.find(l=>l.startsWith("data:"));
    const textoPlano=lines.filter(l=>!l.startsWith("[Archivo:")&&!l.startsWith("data:")).join("\n").trim();
    return(
      <>
        {textoPlano&&<p style={{color:C.muted,fontSize:12,margin:"0 0 6px",lineHeight:1.5,background:C.surface,borderRadius:7,padding:"7px 10px"}}>{textoPlano}</p>}
        {dataLine&&<a href={dataLine} download={nombre} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#5CA8E015",border:"1px solid #5CA8E033",borderRadius:8,padding:"5px 11px",color:C.info,fontSize:12,textDecoration:"none",marginBottom:8}}>📎 Descargar {nombre}</a>}
      </>
    );
  }
  return <p style={{color:C.muted,fontSize:12,margin:"0 0 8px",lineHeight:1.5,background:C.surface,borderRadius:7,padding:"7px 10px"}}>{texto}</p>;
}

// ─── QUIZ VIEWER (para alumnos y docentes) ─────────────────────────────────────
function QuizViewer({item,session,esMio,esAyudante,onReabrir}){
  if(!item?.id)return<div style={{fontSize:12,color:C.muted,padding:"8px 0"}}>⚠ Quiz guardado — recargá la página para verlo.</div>;
  let quizData={};
  try{quizData=JSON.parse(item.texto||"{}"); }catch{}
  const {tipo_quiz,preguntas:_pregs,consigna,fecha_inicio,fecha_cierre}=quizData;
  const preguntas=Array.isArray(_pregs)?_pregs:[];

  const ahora=new Date();
  const inicio=fecha_inicio?new Date(fecha_inicio):null;
  const cierre=fecha_cierre?new Date(fecha_cierre):null;
  const noEmpezado=inicio&&ahora<inicio;
  const cerrado=cierre&&ahora>cierre;
  const abierto=!noEmpezado&&!cerrado;

  const [miEntrega,setMiEntrega]=useState(null);
  const [loadingEntrega,setLoadingEntrega]=useState(true);
  const [respuestas,setRespuestas]=useState(preguntas.map(()=>null));// índice de opción elegida
  const [textoEntrega,setTextoEntrega]=useState("");
  const [archivoEntrega,setArchivoEntrega]=useState(null);// {name, size, base64}
  const [enviando,setEnviando]=useState(false);
  const [resultado,setResultado]=useState(null);// {nota, correctas, total}
  // Para docente: ver entregas
  const [entregas,setEntregas]=useState([]);
  const [loadingEntregas,setLoadingEntregas]=useState(false);
  const [notaEditing,setNotaEditing]=useState({});// {id: nota}
  const [savingNota,setSavingNota]=useState(null);

  useEffect(()=>{
    if(esMio||esAyudante){
      setLoadingEntregas(true);
      sb.getQuizEntregas(item.id,session.access_token)
        .then(e=>setEntregas(e||[]))
        .catch(()=>setEntregas([]))
        .finally(()=>setLoadingEntregas(false));
      setLoadingEntrega(false);
    } else {
      sb.getMiEntregaQuiz(item.id,session.user.email,session.access_token)
        .then(e=>{
          setMiEntrega(e);
          if(e&&tipo_quiz==="multiple"&&e.resultado_json){
            try{setResultado(JSON.parse(e.resultado_json));}catch{}
          }
        })
        .catch(()=>setMiEntrega(null))
        .finally(()=>setLoadingEntrega(false));
    }
  },[item.id,session.user.email,esMio,esAyudante]);// eslint-disable-line

  const enviarMultiple=async()=>{
    if(respuestas.some(r=>r===null))return;
    setEnviando(true);
    try{
      let correctas=0;
      const detalle=preguntas.map((q,i)=>{const ok=respuestas[i]===q.correcta;if(ok)correctas++;return{pregunta:q.texto,elegida:q.opciones[respuestas[i]],correcta:q.opciones[q.correcta],ok};});
      const nota=Math.round((correctas/preguntas.length)*10*100)/100;
      const resJson=JSON.stringify({nota,correctas,total:preguntas.length,detalle});
      const r=await sb.insertEntregaQuiz({quiz_id:item.id,publicacion_id:item.publicacion_id,alumno_email:session.user.email,tipo:"multiple",resultado_json:resJson,nota},session.access_token);
      setMiEntrega(r?.[0]);
      setResultado({nota,correctas,total:preguntas.length,detalle});
    }catch(e){alert(e.message);}finally{setEnviando(false);}
  };

  const leerArchivo=(file)=>new Promise((res,rej)=>{
    if(file.size>5*1024*1024){rej(new Error("El archivo no puede superar 5MB"));return;}
    const r=new FileReader();r.onload=e=>res({name:file.name,size:file.size,base64:e.target.result});r.onerror=rej;r.readAsDataURL(file);
  });
  const onFileChange=async(e)=>{const f=e.target.files?.[0];if(!f)return;try{const d=await leerArchivo(f);setArchivoEntrega(d);}catch(err){alert(err.message);}};

  const enviarEntregable=async()=>{
    if(!textoEntrega.trim()&&!archivoEntrega)return;
    setEnviando(true);
    try{
      const payload={quiz_id:item.id,publicacion_id:item.publicacion_id,alumno_email:session.user.email,tipo:"entregable",texto_entrega:textoEntrega.trim()||null};
      if(archivoEntrega)payload.texto_entrega=(payload.texto_entrega?payload.texto_entrega+"\n\n":"")+`[Archivo: ${archivoEntrega.name}]\n${archivoEntrega.base64}`;
      const r=await sb.insertEntregaQuiz(payload,session.access_token);
      setMiEntrega(r?.[0]);
    }catch(e){alert(e.message);}finally{setEnviando(false);}
  };

  const guardarNota=async(entregaId)=>{
    const nota=parseFloat(notaEditing[entregaId]);
    if(isNaN(nota)||nota<0||nota>10)return;
    setSavingNota(entregaId);
    try{
      await sb.updateEntregaQuiz(entregaId,{nota,corregido:true},session.access_token);
      setEntregas(prev=>prev.map(e=>e.id===entregaId?{...e,nota,corregido:true}:e));
    }catch(e){alert(e.message);}finally{setSavingNota(null);}
  };

  const iS={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 11px",color:C.text,fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:FONT};

  // ── Vista docente ──────────────────────────────────────────────────────────
  if(esMio||esAyudante){
    return(
      <div style={{marginTop:8}}>
        {/* Estado del quiz */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
          {noEmpezado&&<span style={{fontSize:11,background:"#5CA8E015",color:C.info,border:"1px solid #5CA8E033",borderRadius:20,padding:"2px 9px",fontWeight:600}}>⏳ Abre {new Date(fecha_inicio).toLocaleString("es-AR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>}
          {abierto&&<span style={{fontSize:11,background:"#4ECB7115",color:C.success,border:"1px solid #4ECB7133",borderRadius:20,padding:"2px 9px",fontWeight:600}}>● Abierto</span>}
          {cerrado&&<span style={{fontSize:11,background:"#E05C5C15",color:C.danger,border:"1px solid #E05C5C33",borderRadius:20,padding:"2px 9px",fontWeight:600}}>✕ Cerrado</span>}
          {cierre&&<span style={{fontSize:11,color:C.muted}}>Cierre: {new Date(fecha_cierre).toLocaleString("es-AR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>}
          {cerrado&&esMio&&<button onClick={onReabrir} style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:8,color:C.accent,padding:"3px 10px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:700}}>Reabrir</button>}
          <span style={{fontSize:11,color:C.muted,marginLeft:"auto"}}>{entregas.length} entrega{entregas.length!==1?"s":""}</span>
        </div>
        {tipo_quiz==="multiple"&&(
          <div style={{background:C.card,borderRadius:10,padding:"10px 13px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:6}}>PREGUNTAS</div>
            {preguntas.map((q,i)=>(
              <div key={i} style={{marginBottom:6,fontSize:12,color:C.muted}}>
                <span style={{color:C.text,fontWeight:600}}>{i+1}. {q.texto}</span>
                <span style={{color:C.success,marginLeft:8}}>✓ {q.opciones[q.correcta]}</span>
              </div>
            ))}
          </div>
        )}
        {loadingEntregas?<Spinner small/>:entregas.length===0?(
          <div style={{textAlign:"center",padding:"16px 0",color:C.muted,fontSize:12}}>Sin entregas aún.</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {entregas.map(e=>(
              <div key={e.id} style={{background:C.card,border:`1px solid ${e.corregido||e.resultado_json?C.success:C.border}`,borderRadius:10,padding:"10px 13px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <div style={{fontWeight:600,color:C.text,fontSize:12}}>{safeDisplayName(null,e.alumno_email)}</div>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    {e.nota!==null&&e.nota!==undefined&&<span style={{fontWeight:700,color:e.nota>=6?C.success:C.danger,fontSize:13}}>{e.nota}/10</span>}
                    {e.corregido&&<span style={{fontSize:10,color:C.success,background:"#4ECB7115",borderRadius:20,padding:"1px 7px",border:"1px solid #4ECB7133"}}>✓ Corregido</span>}
                  </div>
                </div>
                {e.tipo==="entregable"&&(
                  <>
                    <EntregaTexto texto={e.texto_entrega}/>
                    {!e.corregido&&(
                      <div style={{display:"flex",gap:7,alignItems:"center"}}>
                        <span style={{fontSize:11,color:C.muted}}>Nota (0-10):</span>
                        <input type="number" min="0" max="10" step="0.5" value={notaEditing[e.id]??""} onChange={ev=>setNotaEditing(p=>({...p,[e.id]:ev.target.value}))} style={{width:60,...iS,padding:"4px 8px",marginBottom:0}}/>
                        <button onClick={()=>guardarNota(e.id)} disabled={savingNota===e.id||notaEditing[e.id]===""}
                          style={{background:C.success,border:"none",borderRadius:7,color:"#fff",padding:"5px 12px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:700,opacity:notaEditing[e.id]===undefined||notaEditing[e.id]===""?0.5:1}}>
                          {savingNota===e.id?"...":"Corregir ✓"}
                        </button>
                      </div>
                    )}
                    {e.corregido&&esMio&&(
                      <button onClick={()=>{setNotaEditing(p=>({...p,[e.id]:e.nota}));sb.updateEntregaQuiz(e.id,{corregido:false},session.access_token).then(()=>setEntregas(prev=>prev.map(x=>x.id===e.id?{...x,corregido:false}:x)));}}
                        style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,color:C.muted,padding:"3px 9px",cursor:"pointer",fontSize:10,fontFamily:FONT}}>Editar nota</button>
                    )}
                  </>
                )}
                {e.tipo==="multiple"&&e.resultado_json&&(()=>{
                  try{const res=JSON.parse(e.resultado_json);return<div style={{fontSize:12,color:C.muted}}>{res.correctas}/{res.total} correctas — nota: <span style={{fontWeight:700,color:res.nota>=6?C.success:C.danger}}>{res.nota}/10</span></div>;}catch{return null;}
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Vista alumno ───────────────────────────────────────────────────────────
  if(loadingEntrega)return<Spinner small/>;

  // Ya entregó
  if(miEntrega){
    return(
      <div style={{marginTop:8}}>
        {tipo_quiz==="multiple"&&resultado?(
          <div style={{background:resultado.nota>=6?"#4ECB7115":"#E05C5C15",border:`1px solid ${resultado.nota>=6?"#4ECB7133":"#E05C5C33"}`,borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontWeight:700,color:resultado.nota>=6?C.success:C.danger,fontSize:15,marginBottom:4}}>
              {resultado.nota>=6?"✓ Aprobado":"✗ Desaprobado"} — {resultado.nota}/10
            </div>
            <div style={{color:C.muted,fontSize:12,marginBottom:8}}>{resultado.correctas} de {resultado.total} respuestas correctas</div>
            {resultado.detalle?.map((d,i)=>(
              <div key={i} style={{fontSize:11,marginBottom:4,color:d.ok?C.success:C.danger}}>
                {d.ok?"✓":"✗"} {d.pregunta} — {d.ok?"Correcto":d.correcta}
              </div>
            ))}
          </div>
        ):(
          <div style={{background:"#4ECB7115",border:"1px solid #4ECB7133",borderRadius:10,padding:"12px 14px"}}>
            <div style={{color:C.success,fontWeight:700,fontSize:13,marginBottom:3}}>✓ Entrega enviada</div>
            {miEntrega.texto_entrega&&<div style={{background:C.surface,borderRadius:7,padding:"7px 10px",marginTop:6,fontSize:12,color:C.muted}}><EntregaTexto texto={miEntrega.texto_entrega}/></div>}
            {miEntrega.nota!==null&&miEntrega.nota!==undefined
              ?<div style={{fontSize:14,fontWeight:700,color:miEntrega.nota>=6?C.success:C.danger,marginTop:4}}>Nota: {miEntrega.nota}/10</div>
              :<div style={{fontSize:12,color:C.muted,marginTop:3}}>En espera de corrección del docente.</div>
            }
          </div>
        )}
      </div>
    );
  }

  // Quiz no empezado
  if(noEmpezado)return(
    <div style={{marginTop:8,background:C.card,borderRadius:10,padding:"10px 13px",fontSize:12,color:C.muted}}>
      ⏳ Este quiz abre el {new Date(fecha_inicio).toLocaleString("es-AR",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}
    </div>
  );

  // Quiz cerrado sin entrega
  if(cerrado)return(
    <div style={{marginTop:8,background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:10,padding:"10px 13px",fontSize:12,color:C.danger}}>
      ✕ Este quiz cerró el {new Date(fecha_cierre).toLocaleString("es-AR",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}. No se aceptan más entregas.
    </div>
  );

  // Quiz abierto — formulario de entrega
  return(
    <div style={{marginTop:8}}>
      {tipo_quiz==="multiple"?(
        <div>
          {preguntas.map((q,qi)=>(
            <div key={qi} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 13px",marginBottom:8}}>
              <div style={{fontWeight:600,color:C.text,fontSize:13,marginBottom:8}}>{qi+1}. {q.texto}</div>
              {q.opciones.filter(o=>o.trim()).map((op,oi)=>(
                <button key={oi} onClick={()=>setRespuestas(r=>r.map((v,i)=>i===qi?oi:v))}
                  style={{display:"block",width:"100%",textAlign:"left",background:respuestas[qi]===oi?C.accentDim:"transparent",border:`1px solid ${respuestas[qi]===oi?C.accent:C.border}`,borderRadius:8,padding:"7px 11px",color:respuestas[qi]===oi?C.accent:C.muted,fontSize:12,cursor:"pointer",fontFamily:FONT,marginBottom:5,transition:"all .1s"}}>
                  {String.fromCharCode(65+oi)}. {op}
                </button>
              ))}
            </div>
          ))}
          <button onClick={enviarMultiple} disabled={enviando||respuestas.some(r=>r===null)}
            style={{background:C.accent,border:"none",borderRadius:9,color:"#fff",padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,width:"100%",opacity:respuestas.some(r=>r===null)?0.5:1}}>
            {enviando?"Enviando...":"Enviar respuestas →"}
          </button>
          {respuestas.some(r=>r===null)&&<div style={{textAlign:"center",fontSize:11,color:C.muted,marginTop:4}}>Respondé todas las preguntas para enviar</div>}
        </div>
      ):(
        <div>
          {consigna&&<div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:9,padding:"9px 13px",marginBottom:10,fontSize:12,color:C.text,lineHeight:1.6}}>{consigna}</div>}
          <textarea value={textoEntrega} onChange={e=>setTextoEntrega(e.target.value)} placeholder="Escribí tu entrega acá... (opcional si adjuntás archivo)" style={{...iS,minHeight:80,resize:"vertical",marginBottom:8}}/>
          {/* File upload */}
          <div style={{marginBottom:8}}>
            <label style={{display:"flex",alignItems:"center",gap:8,background:C.card,border:`1px solid ${archivoEntrega?C.success:C.border}`,borderRadius:9,padding:"8px 12px",cursor:"pointer",fontSize:12,color:archivoEntrega?C.success:C.muted,fontFamily:FONT}}>
              <span style={{fontSize:15}}>{archivoEntrega?"📎":"📎"}</span>
              {archivoEntrega?`${archivoEntrega.name} (${(archivoEntrega.size/1024).toFixed(0)}KB)`:"Adjuntar archivo (opcional, max 5MB)"}
              <input type="file" onChange={onFileChange} style={{display:"none"}} accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"/>
            </label>
            {archivoEntrega&&<button onClick={()=>setArchivoEntrega(null)} style={{background:"none",border:"none",color:C.danger,fontSize:11,cursor:"pointer",fontFamily:FONT,marginTop:3}}>✕ Quitar archivo</button>}
          </div>
          <button onClick={enviarEntregable} disabled={enviando||(!textoEntrega.trim()&&!archivoEntrega)}
            style={{background:C.accent,border:"none",borderRadius:9,color:"#fff",padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,width:"100%",opacity:(!textoEntrega.trim()&&!archivoEntrega)?0.5:1}}>
            {enviando?"Enviando...":"Enviar entrega →"}
          </button>
        </div>
      )}
    </div>
  );
}


// ─── TABLA DE NOTAS ───────────────────────────────────────────────────────────
function TablaNotas({contenido,inscripciones,session,publicacionId}){
  const [notas,setNotas]=useState({});// {quizId: {alumnoEmail: nota}}
  const [loading,setLoading]=useState(true);
  const quizzes=contenido.filter(c=>c.tipo==="quiz");

  useEffect(()=>{
    if(!quizzes.length||!inscripciones.length){setLoading(false);return;}
    Promise.all(
      quizzes.map(q=>sb.getQuizEntregas(q.id,session.access_token).catch(()=>[]))
    ).then(results=>{
      const map={};
      quizzes.forEach((q,i)=>{
        map[q.id]={};
        (results[i]||[]).forEach(e=>{
          if(e.nota!==null&&e.nota!==undefined)map[q.id][e.alumno_email]=e.nota;
        });
      });
      setNotas(map);
    }).catch(()=>setNotas({})).finally(()=>setLoading(false));
  },[publicacionId,inscripciones.length,quizzes.length]);// eslint-disable-line

  if(!quizzes.length||!inscripciones.length)return null;

  // Calcular promedios
  const promedioAlumno=(email)=>{
    const vals=quizzes.map(q=>notas[q.id]?.[email]).filter(v=>v!==undefined&&v!==null);
    if(!vals.length)return null;
    return(vals.reduce((a,b)=>a+parseFloat(b),0)/vals.length).toFixed(1);
  };
  const promedioQuiz=(qId)=>{
    const vals=Object.values(notas[qId]||{}).filter(v=>v!==null&&v!==undefined);
    if(!vals.length)return null;
    return(vals.reduce((a,b)=>a+parseFloat(b),0)/vals.length).toFixed(1);
  };
  const notaColor=(n)=>{
    if(n===null||n===undefined)return C.muted;
    return parseFloat(n)>=6?C.success:C.danger;
  };

  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",marginBottom:18,animation:"fadeUp .2s ease"}}>
      <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:14}}>
        Tabla de notas
        <span style={{fontWeight:400,color:C.muted,fontSize:12,marginLeft:8}}>({quizzes.length} quiz{quizzes.length!==1?"zes":""})</span>
      </div>
      {loading?<Spinner small/>:(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:FONT}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${C.border}`}}>
                <th style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontWeight:600,whiteSpace:"nowrap",minWidth:120}}>Alumno</th>
                {quizzes.map(q=>(
                  <th key={q.id} style={{textAlign:"center",padding:"6px 8px",color:C.muted,fontWeight:600,whiteSpace:"nowrap",maxWidth:100,overflow:"hidden",textOverflow:"ellipsis"}}>
                    <div title={q.titulo} style={{overflow:"hidden",textOverflow:"ellipsis",maxWidth:90}}>{q.titulo}</div>
                  </th>
                ))}
                <th style={{textAlign:"center",padding:"6px 8px",color:C.accent,fontWeight:700}}>Promedio</th>
              </tr>
            </thead>
            <tbody>
              {inscripciones.map((ins,idx)=>{
                const email=ins.alumno_email;
                const prom=promedioAlumno(email);
                return(
                  <tr key={ins.id} style={{borderBottom:`1px solid ${C.border}`,background:idx%2===0?"transparent":C.surface+"44"}}>
                    <td style={{padding:"7px 10px",color:C.text,whiteSpace:"nowrap"}}>
                      <div style={{fontWeight:600,fontSize:11}}>{safeDisplayName(null,email)}</div>
                      <div style={{fontSize:10,color:C.muted}}>{email}</div>
                    </td>
                    {quizzes.map(q=>{
                      const nota=notas[q.id]?.[email];
                      return(
                        <td key={q.id} style={{textAlign:"center",padding:"7px 8px"}}>
                          {nota!==undefined&&nota!==null
                            ?<span style={{fontWeight:700,color:notaColor(nota),background:parseFloat(nota)>=6?"#4ECB7115":"#E05C5C15",borderRadius:6,padding:"2px 8px"}}>{nota}</span>
                            :<span style={{color:C.border,fontSize:16}}>—</span>
                          }
                        </td>
                      );
                    })}
                    <td style={{textAlign:"center",padding:"7px 8px"}}>
                      {prom!==null
                        ?<span style={{fontWeight:700,fontSize:13,color:notaColor(prom)}}>{prom}</span>
                        :<span style={{color:C.muted,fontSize:11}}>s/n</span>
                      }
                    </td>
                  </tr>
                );
              })}
              {/* Fila de promedios por quiz */}
              <tr style={{borderTop:`2px solid ${C.border}`,background:C.accentDim}}>
                <td style={{padding:"7px 10px",fontWeight:700,color:C.accent,fontSize:11}}>Promedio quiz</td>
                {quizzes.map(q=>{
                  const prom=promedioQuiz(q.id);
                  return(
                    <td key={q.id} style={{textAlign:"center",padding:"7px 8px"}}>
                      {prom!==null
                        ?<span style={{fontWeight:700,color:notaColor(prom)}}>{prom}</span>
                        :<span style={{color:C.muted}}>—</span>
                      }
                    </td>
                  );
                })}
                <td/>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



// ─── BLOC DE NOTAS DEL ALUMNO ─────────────────────────────────────────────────
function NotasPad({publicacionId,session}){
  const KEY=`cl_notas_${publicacionId}_${session.user.email}`;
  const [texto,setTexto]=useState(()=>{try{return localStorage.getItem(KEY)||"";}catch{return "";}});
  const [saved,setSaved]=useState(true);
  const timerRef=React.useRef(null);
  const onChange=(v)=>{
    setTexto(v);setSaved(false);
    clearTimeout(timerRef.current);
    timerRef.current=setTimeout(()=>{
      try{localStorage.setItem(KEY,v);setSaved(true);}catch{}
    },800);
  };
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",marginTop:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:12,fontWeight:700,color:C.text}}>📓 Mis apuntes</span>
        <span style={{fontSize:10,color:saved?C.success:C.muted}}>{saved?"✓ Guardado":"Guardando..."}</span>
      </div>
      <textarea value={texto} onChange={e=>onChange(e.target.value)}
        placeholder="Escribí tus apuntes de esta clase... Se guardan automáticamente en tu dispositivo."
        style={{width:"100%",minHeight:120,background:C.surface,border:`1px solid ${C.border}`,
          borderRadius:9,padding:"9px 12px",color:C.text,fontSize:12,outline:"none",
          resize:"vertical",boxSizing:"border-box",fontFamily:FONT,lineHeight:1.6}}/>
      {texto&&<div style={{fontSize:10,color:C.muted,marginTop:4,textAlign:"right"}}>{texto.length} caracteres</div>}
    </div>
  );
}





// ─── DOCENTES DESTACADOS ──────────────────────────────────────────────────────
function DocentesDestacados({posts,onOpenPerfil,session}){
  const [visible,setVisible]=useState(true);

  // Calcular top docentes: score = rating * 2 + inscriptos * 0.5 + reseñas
  const docenteMap={};
  posts.filter(p=>p.tipo==="oferta"&&p.activo).forEach(p=>{
    const email=p.autor_email;
    if(!docenteMap[email])docenteMap[email]={
      email,nombre:p.autor_nombre||email.split("@")[0],
      rating:0,inscriptos:0,reseñas:0,materias:new Set(),pubs:0
    };
    const d=docenteMap[email];
    d.pubs++;
    d.materias.add(p.materia);
    if(p.calificacion_promedio)d.rating=Math.max(d.rating,parseFloat(p.calificacion_promedio)||0);
    d.inscriptos+=(p.cantidad_inscriptos||0);
  });
  const top=Object.values(docenteMap)
    .filter(d=>d.rating>0||d.inscriptos>0)
    .map(d=>({...d,score:d.rating*2+d.inscriptos*0.3+d.pubs}))
    .sort((a,b)=>b.score-a.score)
    .slice(0,4);

  if(top.length<2)return null;

  return(
    <div style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontWeight:700,color:C.text,fontSize:14}}>🏆 Docentes destacados</div>
        <button onClick={()=>setVisible(v=>!v)} style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:FONT}}>{visible?"▴":"▾"}</button>
      </div>
      {visible&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
          {top.map((d,i)=>(
            <div key={d.email} onClick={()=>onOpenPerfil(d.email)}
              style={{background:C.card,border:`1px solid ${i===0?C.accent:C.border}`,borderRadius:12,
                padding:"12px 14px",cursor:"pointer",textAlign:"center",position:"relative",
                transition:"transform .15s"}}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
              {i===0&&<div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",
                background:C.accent,color:"#fff",fontSize:9,fontWeight:700,borderRadius:20,
                padding:"2px 8px",whiteSpace:"nowrap"}}>⭐ Top docente</div>}
              <Avatar letra={d.nombre[0]} size={36} style={{margin:"0 auto 6px"}}/>
              <div style={{fontWeight:700,color:C.text,fontSize:12,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.nombre}</div>
              {d.rating>0&&<div style={{color:C.accent,fontSize:11,marginBottom:2}}>{"★".repeat(Math.round(d.rating))} {d.rating.toFixed(1)}</div>}
              <div style={{color:C.muted,fontSize:10}}>{[...d.materias].slice(0,2).join(", ")}</div>
              {d.inscriptos>0&&<div style={{color:C.muted,fontSize:10,marginTop:2}}>{d.inscriptos} alumnos</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AGENDA PERSONAL ──────────────────────────────────────────────────────────
function AgendaPage({session,onOpenCurso}){
  const [inscripciones,setInscripciones]=useState([]);
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [mesOffset,setMesOffset]=useState(0);
  const [diaSelec,setDiaSelec]=useState(null);
  const [proximasOpen,setProximasOpen]=useState(true);
  const miEmail=session.user.email;

  useEffect(()=>{
    Promise.all([
      sb.getMisInscripciones(miEmail,session.access_token).catch(()=>[]),
    ]).then(([ins])=>{
      setInscripciones(ins||[]);
      // Cargar datos de las publicaciones inscriptas que tienen calendario
      const ids=[...new Set((ins||[]).map(i=>i.publicacion_id))];
      if(!ids.length){setLoading(false);return;}
      sb.getPublicacionesByIds(ids,session.access_token).then(results=>{
        const allPosts=(results||[]).filter(Boolean);
        setPosts(allPosts);
      }).finally(()=>setLoading(false));
    });
  },[miEmail]);// eslint-disable-line

  // Calcular clases del mes
  const now=new Date();
  const mes=new Date(now.getFullYear(),now.getMonth()+mesOffset,1);
  const mesLabel=mes.toLocaleString("es-AR",{month:"long",year:"numeric"});

  // Para cada publicación sincrónica, expandir sus clases en el mes
  const clasesEnDia=(dia)=>{
    const fecha=new Date(mes.getFullYear(),mes.getMonth(),dia);
    const diaNombre=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][fecha.getDay()];
    const resultado=[];
    posts.forEach(p=>{
      if(p.sinc!=="sinc"||!p.clases_sinc)return;
      let clases=[];
      try{clases=JSON.parse(p.clases_sinc);}catch{return;}
      clases.forEach(c=>{
        if(c.dia===diaNombre){
          const fechaInicio=p.fecha_inicio?new Date(p.fecha_inicio):null;
          const fechaFin=p.fecha_fin?new Date(p.fecha_fin):null;
          if((!fechaInicio||fecha>=fechaInicio)&&(!fechaFin||fecha<=fechaFin)){
            resultado.push({post:p,clase:c,fecha});
          }
        }
      });
    });
    return resultado;
  };

  // Días del mes con clases
  const diasConClase=new Set();
  const diasEnMes=new Date(mes.getFullYear(),mes.getMonth()+1,0).getDate();
  for(let d=1;d<=diasEnMes;d++){if(clasesEnDia(d).length>0)diasConClase.add(d);}

  // Generar grid del mes
  const primerDia=new Date(mes.getFullYear(),mes.getMonth(),1).getDay();
  const offset=(primerDia+6)%7;// Lunes primero

  // Próximas clases (hoy en adelante)
  const hoy=new Date();
  const proximas=[];
  for(let d=1;d<=diasEnMes;d++){
    const fecha=new Date(mes.getFullYear(),mes.getMonth(),d);
    if(fecha<new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate()))continue;
    const clases=clasesEnDia(d);
    clases.forEach(c=>proximas.push(c));
  }
  proximas.sort((a,b)=>a.fecha-b.fecha);

  const colorPost=(post)=>{
    const colors=[C.accent,C.info,C.success,C.purple,C.warn];
    const idx=posts.indexOf(post)%colors.length;
    return colors[idx<0?0:idx];
  };

  return(
    <div style={{padding:"20px 24px",maxWidth:900,margin:"0 auto",fontFamily:FONT}}>
      <div style={{fontWeight:700,color:C.text,fontSize:18,marginBottom:4}}>📅 Mi agenda</div>
      <div style={{color:C.muted,fontSize:13,marginBottom:20}}>Tus clases programadas</div>

      {loading?<Spinner/>:(
        <>
          {/* Calendatio */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <button onClick={()=>setMesOffset(m=>m-1)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"4px 12px",cursor:"pointer",fontFamily:FONT,fontSize:14}}>‹</button>
              <span style={{fontWeight:700,color:C.text,fontSize:14,textTransform:"capitalize"}}>{mesLabel}</span>
              <button onClick={()=>setMesOffset(m=>m+1)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"4px 12px",cursor:"pointer",fontFamily:FONT,fontSize:14}}>›</button>
            </div>
            {/* Días de la semana */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>
              {["Lu","Ma","Mi","Ju","Vi","Sá","Do"].map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:C.muted,fontWeight:600}}>{d}</div>)}
            </div>
            {/* Grid días */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {Array.from({length:offset}).map((_,i)=><div key={"e"+i}/>)}
              {Array.from({length:diasEnMes},(_,i)=>i+1).map(d=>{
                const tieneClase=diasConClase.has(d);
                const esHoy=d===hoy.getDate()&&mes.getMonth()===hoy.getMonth()&&mes.getFullYear()===hoy.getFullYear();
                const selec=diaSelec===d;
                return(
                  <button key={d} onClick={()=>setDiaSelec(tieneClase?(selec?null:d):null)}
                    style={{textAlign:"center",padding:"6px 2px",borderRadius:8,fontSize:12,
                      fontWeight:tieneClase?700:400,
                      background:selec?C.accent:tieneClase?C.accentDim:"transparent",
                      color:selec?"#fff":tieneClase?C.accent:esHoy?C.text:C.muted,
                      border:esHoy?`1px solid ${C.border}`:"1px solid transparent",
                      cursor:tieneClase?"pointer":"default",fontFamily:FONT,
                      position:"relative"}}>
                    {d}
                    {(()=>{const cs=clasesEnDia(d);if(!cs.length)return null;return(<div style={{display:"flex",gap:2,justifyContent:"center",marginTop:2}}>{cs.slice(0,3).map((item,ci)=><div key={ci} style={{width:4,height:4,borderRadius:"50%",background:selec?"#fff":colorPost(item.post)}}/>)}</div>);})()}
                  </button>
                );
              })}
            </div>
            {/* Clases del día seleccionado */}
            {diaSelec&&(
              <div style={{marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:10}}>
                <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:8}}>
                  {new Date(mes.getFullYear(),mes.getMonth(),diaSelec).toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}
                </div>
                {clasesEnDia(diaSelec).length===0
                  ?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"8px 0"}}>Sin clases este día.</div>
                  :clasesEnDia(diaSelec).map((item,i)=>(
                    <div key={i} onClick={()=>onOpenCurso(item.post)}
                      style={{marginBottom:8,background:C.surface,borderRadius:11,overflow:"hidden",
                        border:`1px solid ${colorPost(item.post)}44`,cursor:"pointer",
                        display:"flex",transition:"transform .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.transform="translateX(3px)"}
                      onMouseLeave={e=>e.currentTarget.style.transform="translateX(0)"}>
                      {/* Franja de color lateral */}
                      <div style={{width:4,background:colorPost(item.post),flexShrink:0}}/>
                      <div style={{padding:"10px 12px",flex:1}}>
                        <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:2}}>{item.post.titulo}</div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:18}}>🕐</span>
                          <span style={{fontWeight:600,color:colorPost(item.post),fontSize:12}}>{item.clase.hora_inicio}</span>
                          <span style={{color:C.muted,fontSize:11}}>→ {item.clase.hora_fin}</span>
                          <span style={{fontSize:10,color:C.muted,background:C.card,borderRadius:20,padding:"1px 7px"}}>{item.post.materia}</span>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Próximas clases */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 20px"}}>
            <div onClick={()=>setProximasOpen(v=>!v)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:proximasOpen?12:0,cursor:"pointer"}}>
              <div style={{fontWeight:700,color:C.text,fontSize:14}}>Próximas clases {proximas.length>0&&<span style={{fontSize:11,color:C.muted,fontWeight:400}}>({proximas.slice(0,10).length})</span>}</div>
              <span style={{color:C.muted,fontSize:13,transform:proximasOpen?"rotate(0deg)":"rotate(-90deg)",display:"inline-block",transition:"transform .2s"}}>▾</span>
            </div>
            {proximasOpen&&(
            <div>{proximas.length===0?(
              <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>
                {posts.length===0?"No tenés clases inscriptas aún.":"No hay clases programadas este mes."}
              </div>
            ):proximas.slice(0,10).map((item,i)=>{
              const esMesmo=item.fecha.getDate()===hoy.getDate()&&item.fecha.getMonth()===hoy.getMonth();
              return(
                <div key={i} onClick={()=>onOpenCurso(item.post)}
                  style={{display:"flex",gap:12,alignItems:"center",padding:"9px 0",
                    borderBottom:i<proximas.slice(0,10).length-1?`1px solid ${C.border}`:"none",cursor:"pointer"}}>
                  <div style={{textAlign:"center",minWidth:44,background:esMesmo?C.accentDim:C.surface,
                    borderRadius:9,padding:"5px 6px",border:`1px solid ${esMesmo?C.accent:C.border}`}}>
                    <div style={{fontSize:16,fontWeight:700,color:esMesmo?C.accent:C.text,lineHeight:1}}>
                      {item.fecha.getDate()}
                    </div>
                    <div style={{fontSize:9,color:C.muted,textTransform:"capitalize"}}>
                      {item.fecha.toLocaleString("es-AR",{month:"short"})}
                    </div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,color:C.text,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.post.titulo}</div>
                    <div style={{color:C.muted,fontSize:11}}>{item.clase.hora_inicio} → {item.clase.hora_fin} · {item.clase.dia}</div>
                  </div>
                  {esMesmo&&<span style={{fontSize:10,background:C.accentDim,color:C.accent,borderRadius:20,padding:"2px 8px",border:`1px solid ${C.accent}33`,flexShrink:0}}>Hoy</span>}
                </div>
              );
            })}
          </div>)}
          </div>
        </>
      )}
    </div>
  );
}

// ─── FORO DEL CURSO ───────────────────────────────────────────────────────────
function ForoCurso({post,session,esMio,esAyudante}){
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [texto,setTexto]=useState("");
  const [enviando,setEnviando]=useState(false);
  const [expandedPost,setExpandedPost]=useState(null);
  const [respuestas,setRespuestas]=useState({});// {postId: [...]}
  const [respuestaTexto,setRespuestaTexto]=useState({});// {postId: texto}
  const miEmail=session.user.email;
  const miNombre=session.user.user_metadata?.display_name||miEmail.split("@")[0];

  useEffect(()=>{
    sb.getForoPosts(post.id,session.access_token)
      .then(p=>setPosts(p||[]))
      .catch(()=>setPosts([]))
      .finally(()=>setLoading(false));
  },[post.id]);// eslint-disable-line

  const enviarPost=async()=>{
    if(!texto.trim())return;
    setEnviando(true);
    try{
      const r=await sb.insertForoPost({
        publicacion_id:post.id,
        autor_email:miEmail,
        autor_nombre:miNombre,
        texto:texto.trim(),
      },session.access_token);
      setPosts(prev=>[...prev,...(r||[])]);
      setTexto("");
    }catch(e){
      // Fallback local si tabla no existe
      const fakePost={id:"local_"+Date.now(),publicacion_id:post.id,autor_email:miEmail,autor_nombre:miNombre,texto:texto.trim(),created_at:new Date().toISOString()};
      setPosts(prev=>[...prev,fakePost]);
      setTexto("");
    }finally{setEnviando(false);}
  };

  const cargarRespuestas=async(postId)=>{
    if(respuestas[postId])return;
    const r=await sb.getForoRespuestas(postId,session.access_token).catch(()=>[]);
    setRespuestas(prev=>({...prev,[postId]:r||[]}));
  };

  const togglePost=async(postId)=>{
    if(expandedPost===postId){setExpandedPost(null);return;}
    setExpandedPost(postId);
    await cargarRespuestas(postId);
  };

  const enviarRespuesta=async(postId)=>{
    const txt=(respuestaTexto[postId]||"").trim();
    if(!txt)return;
    try{
      const r=await sb.insertForoRespuesta({
        foro_post_id:postId,
        publicacion_id:post.id,
        autor_email:miEmail,
        autor_nombre:miNombre,
        texto:txt,
      },session.access_token);
      setRespuestas(prev=>({...prev,[postId]:[...(prev[postId]||[]),...(r||[{id:"local_"+Date.now(),autor_email:miEmail,autor_nombre:miNombre,texto:txt,created_at:new Date().toISOString()}])]}));
      setRespuestaTexto(prev=>({...prev,[postId]:""}));
    }catch{
      const fake={id:"local_"+Date.now(),autor_email:miEmail,autor_nombre:miNombre,texto:txt,created_at:new Date().toISOString()};
      setRespuestas(prev=>({...prev,[postId]:[...(prev[postId]||[]),fake]}));
      setRespuestaTexto(prev=>({...prev,[postId]:""}));
    }
  };

  const iS={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:FONT};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {/* Formulario nueva pregunta */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px"}}>
        <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:8}}>💬 Hacer una pregunta</div>
        <textarea value={texto} onChange={e=>setTexto(e.target.value.slice(0,500))}
          placeholder="Escribí tu pregunta o comentario para el grupo..."
          style={{...iS,minHeight:72,resize:"vertical",marginBottom:8}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:10,color:C.muted}}>{texto.length}/500</span>
          <button onClick={enviarPost} disabled={enviando||!texto.trim()}
            style={{background:C.accent,border:"none",borderRadius:8,color:"#fff",padding:"7px 16px",
              fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,
              opacity:!texto.trim()?0.5:1}}>
            {enviando?"Enviando...":"Publicar →"}
          </button>
        </div>
      </div>

      {/* Lista de posts */}
      {loading?<Spinner small/>:posts.length===0?(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"30px",textAlign:"center",color:C.muted,fontSize:13}}>
          Sin preguntas aún. ¡Sé el primero en preguntar!
        </div>
      ):posts.map(p=>{
        const isExpanded=expandedPost===p.id;
        const resps=respuestas[p.id]||[];
        const esMiPost=p.autor_email===miEmail;
        return(
          <div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
            {/* Header del post */}
            <div style={{padding:"12px 14px"}}>
              <div style={{display:"flex",gap:9,alignItems:"flex-start"}}>
                <Avatar letra={(p.autor_nombre||"?")[0]} size={28}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <span style={{fontWeight:600,color:C.text,fontSize:12}}>
                      {p.autor_nombre||safeDisplayName(p.autor_nombre,p.autor_email)}
                      {(p.autor_email===post.autor_email)||(post.ayudantes||[]).includes(p.autor_email)?
                        <span style={{fontSize:9,background:C.accentDim,color:C.accent,borderRadius:20,padding:"1px 6px",marginLeft:6,border:`1px solid ${C.accent}33`}}>Docente</span>:null}
                    </span>
                    <span style={{fontSize:10,color:C.muted}}>{fmtRel(p.created_at)}</span>
                  </div>
                  <p style={{color:C.text,fontSize:13,margin:0,lineHeight:1.5}}>{p.texto}</p>
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:8,paddingLeft:37}}>
                <button onClick={()=>togglePost(p.id)}
                  style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:FONT,padding:0}}>
                  💬 {p.respuestas?.[0]?.count||resps.length||0} respuesta{(p.respuestas?.[0]?.count||resps.length)!==1?"s":""}  {isExpanded?"▴":"▾"}
                </button>
                {(esMiPost||esMio||esAyudante)&&!p.id?.startsWith("local_")&&(
                  <button onClick={async()=>{
                    await sb.deleteForoPost(p.id,session.access_token).catch(()=>{});
                    setPosts(prev=>prev.filter(x=>x.id!==p.id));
                  }} style={{background:"none",border:"none",color:C.danger,fontSize:11,cursor:"pointer",fontFamily:FONT,padding:0}}>Eliminar</button>
                )}
              </div>
            </div>

            {/* Respuestas expandidas */}
            {isExpanded&&(
              <div style={{borderTop:`1px solid ${C.border}`,background:C.surface,padding:"10px 14px"}}>
                {resps.length>0&&(
                  <div style={{marginBottom:10,display:"flex",flexDirection:"column",gap:8}}>
                    {resps.map(r=>(
                      <div key={r.id} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                        <Avatar letra={(r.autor_nombre||"?")[0]} size={22}/>
                        <div style={{flex:1,background:C.card,borderRadius:8,padding:"7px 10px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                            <span style={{fontWeight:600,color:C.text,fontSize:11}}>
                              {r.autor_nombre||safeDisplayName(r.autor_nombre,r.autor_email)}
                              {r.autor_email===post.autor_email?<span style={{fontSize:9,background:C.accentDim,color:C.accent,borderRadius:20,padding:"1px 5px",marginLeft:5}}>Docente</span>:null}
                            </span>
                            <span style={{fontSize:9,color:C.muted}}>{fmtRel(r.created_at)}</span>
                          </div>
                          <p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.4}}>{r.texto}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Responder */}
                <div style={{display:"flex",gap:7,alignItems:"flex-end"}}>
                  <textarea value={respuestaTexto[p.id]||""} onChange={e=>setRespuestaTexto(prev=>({...prev,[p.id]:e.target.value.slice(0,300)}))}
                    placeholder="Escribí una respuesta..."
                    style={{...iS,minHeight:50,resize:"none",flex:1}}/>
                  <button onClick={()=>enviarRespuesta(p.id)} disabled={!(respuestaTexto[p.id]||"").trim()}
                    style={{background:C.accent,border:"none",borderRadius:8,color:"#fff",padding:"9px 14px",
                      fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,
                      opacity:!(respuestaTexto[p.id]||"").trim()?0.5:1,flexShrink:0}}>
                    ↑
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── GENERADOR DE CERTIFICADO ─────────────────────────────────────────────────
function CertificadoBtn({post,session,inscripcion}){
  const [generando,setGenerando]=useState(false);

  const generar=()=>{
    setGenerando(true);
    try{
      const canvas=document.createElement("canvas");
      canvas.width=1200;canvas.height=848;
      const ctx=canvas.getContext("2d");

      // Fondo
      ctx.fillStyle="#fff";
      ctx.fillRect(0,0,1200,848);

      // Borde decorativo
      ctx.strokeStyle="#F5C842";ctx.lineWidth=3;
      ctx.strokeRect(24,24,1152,800);
      ctx.strokeStyle="#F5C84244";ctx.lineWidth=1;
      ctx.strokeRect(32,32,1136,784);

      // Logo / título app
      ctx.fillStyle="#F5C842";
      ctx.font="bold 22px Georgia, serif";
      ctx.textAlign="center";
      ctx.fillText("Luderis",600,90);

      // Texto principal
      ctx.fillStyle="#F0EDE6";
      ctx.font="28px Georgia, serif";
      ctx.fillText("Certificado de finalización",600,160);

      // Línea decorativa
      ctx.strokeStyle="#F5C84255";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(200,185);ctx.lineTo(1000,185);ctx.stroke();

      // "Certifica que"
      ctx.fillStyle="#888";
      ctx.font="18px Georgia, serif";
      ctx.fillText("Este certificado acredita que",600,230);

      // Nombre del alumno
      const nombre=session.user.user_metadata?.display_name||safeDisplayName(null,session.user.email)||"Alumno";
      ctx.fillStyle="#F5C842";
      ctx.font="bold 48px Georgia, serif";
      ctx.fillText(nombre,600,310);

      // "completó exitosamente"
      ctx.fillStyle="#F0EDE6";
      ctx.font="20px Georgia, serif";
      ctx.fillText("completó exitosamente el curso",600,365);

      // Título del curso
      ctx.fillStyle="#F0EDE6";
      ctx.font="bold 32px Georgia, serif";
      // Truncar si es muy largo
      const titulo=post.titulo.length>60?post.titulo.slice(0,57)+"...":post.titulo;
      ctx.fillText(`"${titulo}"`,600,420);

      // Materia
      ctx.fillStyle="#888";
      ctx.font="18px Georgia, serif";
      ctx.fillText(`Materia: ${post.materia}`,600,465);

      // Docente
      const docente=post.autor_nombre||safeDisplayName(post.autor_nombre,post.autor_email)||"Docente";
      ctx.fillText(`Dictado por: ${docente}`,600,500);

      // Fecha
      const fecha=new Date().toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"});
      ctx.fillText(`Fecha: ${fecha}`,600,535);

      // Línea divisoria baja
      ctx.strokeStyle="#F5C84255";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(200,580);ctx.lineTo(1000,580);ctx.stroke();

      // Firma simulada
      ctx.fillStyle="#F5C842";
      ctx.font="italic 16px Georgia, serif";
      ctx.fillText("Luderis — Plataforma Educativa",600,640);

      // ID único
      const uid=Math.random().toString(36).slice(2,10).toUpperCase();
      ctx.fillStyle=C.muted;
      ctx.font="12px monospace";
      ctx.fillText(`ID: ${uid}`,600,700);

      // Descargar
      const link=document.createElement("a");
      link.download=`certificado-${post.titulo.slice(0,30).replace(/\s+/g,"-")}.png`;
      link.href=canvas.toDataURL("image/png");
      link.click();
    }catch(e){alert("Error al generar: "+e.message);}
    finally{setGenerando(false);}
  };

  // Solo mostrar si el curso está finalizado y el alumno está inscripto
  if(!post.finalizado&&!inscripcion?.clase_finalizada)return null;

  return(
    <button onClick={generar} disabled={generando}
      style={{display:"flex",alignItems:"center",gap:8,background:"#4ECB7118",border:"1px solid #4ECB7133",
        borderRadius:10,padding:"10px 16px",cursor:"pointer",fontFamily:FONT,
        color:C.success,fontSize:13,fontWeight:600,width:"100%",justifyContent:"center",marginTop:10}}>
      <span style={{fontSize:16}}>🎓</span>
      {generando?"Generando...":"Descargar certificado"}
    </button>
  );
}

// ─── NOTAS ALUMNO — vista de sus propias notas en los quizzes ─────────────────
function NotasAlumno({contenido,session,publicacionId}){
  const [notas,setNotas]=useState([]);// [{quiz, entrega}]
  const [loading,setLoading]=useState(true);
  const quizzes=contenido.filter(c=>c.tipo==="quiz");
  useEffect(()=>{
    Promise.all(
      quizzes.map(q=>sb.getMiEntregaQuiz(q.id,session.user.email,session.access_token).catch(()=>null))
    ).then(entregas=>{
      setNotas(quizzes.map((q,i)=>({quiz:q,entrega:entregas[i]})));
    }).catch(()=>setNotas([])).finally(()=>setLoading(false));
  },[publicacionId]);// eslint-disable-line
  if(loading)return<Spinner small/>;
  const notaColor=(n)=>parseFloat(n)>=6?C.success:C.danger;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {notas.map(({quiz,entrega})=>{
        let qd={};try{qd=JSON.parse(quiz.texto||"{}");}catch{}
        const nota=entrega?.nota;
        const corregido=entrega?.corregido;
        const entrego=!!entrega;
        return(
          <div key={quiz.id} style={{background:C.surface,border:`1px solid ${nota!==null&&nota!==undefined?notaColor(nota)+"33":C.border}`,borderRadius:10,padding:"11px 14px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:18}}>📝</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,color:C.text,fontSize:13}}>{quiz.titulo}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{qd.tipo_quiz==="entregable"?"Entregable":"Multiple choice"}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              {!entrego&&<span style={{fontSize:12,color:C.muted}}>Sin entregar</span>}
              {entrego&&nota!==null&&nota!==undefined&&<div style={{fontWeight:700,fontSize:18,color:notaColor(nota)}}>{nota}<span style={{fontSize:12,fontWeight:400,color:C.muted}}>/10</span></div>}
              {entrego&&(nota===null||nota===undefined)&&<span style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>{qd.tipo_quiz==="entregable"?"Pendiente de corrección":"Enviado"}</span>}
              {nota!==null&&nota!==undefined&&<div style={{fontSize:10,color:parseFloat(nota)>=6?C.success:C.danger}}>{parseFloat(nota)>=6?"✓ Aprobado":"✗ Desaprobado"}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}



// ─── CONSTANTES DEL SISTEMA DE SKILLS ────────────────────────────────────────
const SKILL_TIPOS = {
  conceptual:    {label:"Conceptual",    desc:"Teoría, definiciones, hechos",    icon:"📖"},
  procedimental: {label:"Procedimental", desc:"Ejecutar pasos, resolver",        icon:"⚙️"},
  practica:      {label:"Práctica",      desc:"Hacer algo físico o concreto",    icon:"🛠"},
  creativa:      {label:"Creativa",      desc:"Producir algo original",          icon:"🎨"},
  interpretativa:{label:"Interpretativa",desc:"Analizar e interpretar",          icon:"🔍"},
  performance:   {label:"Performance",   desc:"Demostrar en tiempo real",        icon:"🎤"},
};

const FORMATO_POR_TIPO = {
  conceptual:    ["multiple_choice","verdadero_falso","desarrollo"],
  procedimental: ["resolucion_problema","codigo","multiple_choice"],
  practica:      ["consigna_practica","imagen","video"],
  creativa:      ["consigna_practica","imagen","rubrica"],
  interpretativa:["desarrollo","autoevaluacion"],
  performance:   ["audio","video","rubrica"],
};

const FORMATO_LABELS = {
  multiple_choice:    {label:"Multiple choice",      icon:"📋"},
  verdadero_falso:    {label:"Verdadero/Falso",      icon:"⚖️"},
  desarrollo:         {label:"Respuesta a desarrollar",icon:"✍️"},
  resolucion_problema:{label:"Resolución de problema",icon:"🧮"},
  codigo:             {label:"Ejercicio de código",  icon:"💻"},
  consigna_practica:  {label:"Consigna práctica",    icon:"📌"},
  imagen:             {label:"Subir imagen",          icon:"🖼"},
  audio:              {label:"Subir audio",           icon:"🎵"},
  video:              {label:"Subir video",           icon:"🎬"},
  rubrica:            {label:"Evaluación por rúbrica",icon:"📊"},
  autoevaluacion:     {label:"Autoevaluación guiada", icon:"🪞"},
  peer_review:        {label:"Revisión entre pares",  icon:"👥"},
};

const NIVEL_LABELS = ["No visto","Inicial","Básico","Competente","Sólido","Dominado"];
const NIVEL_COLORS = () => [C.border,"#E05C5C","#E0955C","#F5C842","#5CA8E0","#4ECB71"];

// ─── SISTEMA DE SKILLS / HABILIDADES ──────────────────────────────────────────
const SKILL_LEVELS = ["Sin ver","Principiante","Básico","Competente","Sólido","Dominado"];
const SKILL_COLORS = [C.border,"#E05C5C","#E0955C","#F5C842","#5CA8E0","#4ECB71"];

// Obtener skills de una publicación desde localStorage (hasta integrar DB)
const getSkills = (pubId) => {
  try{return JSON.parse(localStorage.getItem("cl_skills_"+pubId)||"[]");}catch{return[];}
};
const saveSkills = (pubId, skills) => {
  try{localStorage.setItem("cl_skills_"+pubId,JSON.stringify(skills));}catch{}
};
const getSkillProgress = (pubId, alumnoEmail) => {
  try{return JSON.parse(localStorage.getItem(`cl_sp_${pubId}_${alumnoEmail}`)||"{}");}catch{return{};}
};
const saveSkillProgress = (pubId, alumnoEmail, data) => {
  try{localStorage.setItem(`cl_sp_${pubId}_${alumnoEmail}`,JSON.stringify(data));}catch{}
};

// ─── SKILL MANAGER (docente) — guarda en DB ───────────────────────────────────
function SkillManager({post,session,onSkillsChange}){
  const pubId=post.id;
  // Cargar desde DB, fallback localStorage
  const [skills,setSkills]=useState(()=>getSkills(pubId));
  const [nueva,setNueva]=useState("");
  const [nuevoTipo,setNuevoTipo]=useState("conceptual");
  const [editIdx,setEditIdx]=useState(null);
  const [loading,setLoading]=useState(true);
  const [clasificandoIA,setClasificandoIA]=useState(false);

  useEffect(()=>{
    sb.getSkillsDB(pubId,session.access_token)
      .then(data=>{
        if(data&&data.length>0){setSkills(data);saveSkills(pubId,data);}
        else{/* usar localStorage */}
      }).catch(()=>{})
      .finally(()=>setLoading(false));
  },[pubId]);// eslint-disable-line

  const clasificarConIA=async(nombre)=>{
    if(!nombre.trim())return "conceptual";
    setClasificandoIA(true);
    try{
      const res=await sb.callIA(
        "Sos un clasificador de tipos de habilidades educativas. Respondé SOLO con una de estas palabras exactas: conceptual, procedimental, practica, creativa, interpretativa, performance. Sin explicación.",
        `Curso: "${post.titulo}" (materia: ${post.materia})
Habilidad a evaluar: "${nombre}"
¿Qué tipo de habilidad es?`
      ,50);
      const tipo=res?.trim()?.toLowerCase();
      if(Object.keys(SKILL_TIPOS).includes(tipo))return tipo;
    }catch{}finally{setClasificandoIA(false);}
    return "conceptual";
  };

  const agregar=async()=>{
    if(!nueva.trim()||skills.length>=6)return;
    const tipo=await clasificarConIA(nueva);
    const skillData={publicacion_id:pubId,nombre:nueva.trim(),tipo,peso:1,orden:skills.length};
    try{
      const r=await sb.upsertSkill(skillData,session.access_token);
      const newSkill=r?.[0]||{...skillData,id:Date.now()+""};
      const updated=[...skills,newSkill];
      setSkills(updated);saveSkills(pubId,updated);if(onSkillsChange)onSkillsChange(updated);
    }catch{
      const updated=[...skills,{...skillData,id:Date.now()+""}];
      setSkills(updated);saveSkills(pubId,updated);
    }
    setNueva("");
  };

  const eliminar=async(i)=>{
    const s=skills[i];
    if(s.id&&!String(s.id).startsWith(Date.now().toString().slice(0,-5))){
      await sb.deleteSkill(s.id,session.access_token).catch(()=>{});
    }
    const u=skills.filter((_,idx)=>idx!==i);
    setSkills(u);saveSkills(pubId,u);if(onSkillsChange)onSkillsChange(u);
  };

  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontWeight:700,color:C.text,fontSize:14}}>
          Habilidades del curso
          <span style={{fontSize:11,color:C.muted,fontWeight:400,marginLeft:8}}>(máx 6)</span>
        </div>
        {loading&&<Spinner small/>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
        {skills.map((s,i)=>{
          const tipoInfo=SKILL_TIPOS[s.tipo]||SKILL_TIPOS.conceptual;
          return(
            <div key={s.id||i} style={{display:"flex",alignItems:"center",gap:8,background:C.surface,borderRadius:9,padding:"7px 11px"}}>
              <span style={{fontSize:14,flexShrink:0}} title={tipoInfo.label}>{tipoInfo.icon}</span>
              {editIdx===i
                ?<input value={s.nombre} onChange={e=>{const u=skills.map((x,xi)=>xi===i?{...x,nombre:e.target.value}:x);setSkills(u);}} onBlur={async()=>{setEditIdx(null);saveSkills(pubId,skills);if(s.id)await sb.updateSkill(s.id,{nombre:skills[i].nombre},session.access_token).catch(()=>{});}} autoFocus style={{flex:1,background:"transparent",border:"none",color:C.text,fontSize:13,outline:"none",fontFamily:FONT}}/>
                :<span onClick={()=>setEditIdx(i)} style={{flex:1,color:C.text,fontSize:13,cursor:"text"}}>{s.nombre}</span>
              }
              <span style={{fontSize:10,color:C.muted,background:C.card,borderRadius:20,padding:"1px 7px",border:`1px solid ${C.border}`,flexShrink:0}}>{tipoInfo.label}</span>
              <button onClick={()=>eliminar(i)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,padding:0}}>×</button>
            </div>
          );
        })}
      </div>
      {skills.length<6&&(
        <div style={{display:"flex",gap:7}}>
          <input value={nueva} onChange={e=>setNueva(e.target.value)} onKeyDown={e=>e.key==="Enter"&&agregar()}
            placeholder="Nueva habilidad (ej: derivadas, acordes...)"
            style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 11px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT}}/>
          <button onClick={agregar} disabled={!nueva.trim()||clasificandoIA}
            style={{background:C.accent,border:"none",borderRadius:8,color:"#fff",padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT,opacity:!nueva.trim()?0.5:1}}>
            {clasificandoIA?"...":"+"}
          </button>
        </div>
      )}
      {clasificandoIA&&<div style={{fontSize:11,color:C.muted,marginTop:6}}>✦ Clasificando tipo de habilidad...</div>}
      {skills.length===0&&!loading&&<div style={{fontSize:12,color:C.muted,textAlign:"center",padding:"8px 0"}}>Agregá las habilidades que los alumnos van a desarrollar. La IA clasificará el tipo automáticamente.</div>}
    </div>
  );
}

// ─── SKILL PROGRESS VIEWER (alumno) ───────────────────────────────────────────
function SkillProgressViewer({post,session,esMio,esAyudante}){
  const pubId=post.id;
  const miEmail=session.user.email;
  const skills=getSkills(pubId);
  const [progress,setProgress]=useState(()=>getSkillProgress(pubId,miEmail));
  const [editing,setEditing]=useState(false);

  if(!skills.length)return null;

  const setLevel=(skillId,level)=>{
    const updated={...progress,[skillId]:level};
    setProgress(updated);
    saveSkillProgress(pubId,miEmail,updated);
  };

  // Calcular progreso
  const getInitial=(id)=>progress["initial_"+id]??0;
  const getCurrent=(id)=>progress[id]??0;
  const calcRelativo=(init,curr)=>init>=5?100:Math.round(((curr-init)/(5-init))*100);

  const promInicial=skills.length>0?Math.round(skills.reduce((a,s)=>a+getInitial(s.id),0)/skills.length*10)/10:0;
  const promActual=skills.length>0?Math.round(skills.reduce((a,s)=>a+getCurrent(s.id),0)/skills.length*10)/10:0;
  const progAbsoluto=Math.round((promActual-promInicial)*10)/10;
  const progRelativo=calcRelativo(promInicial*20,promActual*20);// convertir 0-5 a 0-100

  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontWeight:700,color:C.text,fontSize:14}}>Mi perfil de habilidades</div>
        <button onClick={()=>setEditing(v=>!v)}
          style={{background:editing?C.accent:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:8,color:editing?"#fff":C.accent,padding:"4px 11px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:600}}>
          {editing?"Listo ✓":"Actualizar"}
        </button>
      </div>

      {/* Stats de progreso */}
      {promActual>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
          <div style={{background:C.surface,borderRadius:10,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:700,color:C.info}}>{promActual.toFixed(1)}</div>
            <div style={{fontSize:10,color:C.muted}}>Nivel actual</div>
          </div>
          <div style={{background:C.surface,borderRadius:10,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:700,color:progAbsoluto>0?C.success:C.muted}}>
              {progAbsoluto>0?"+":""}{progAbsoluto.toFixed(1)}
            </div>
            <div style={{fontSize:10,color:C.muted}}>Progreso abs.</div>
          </div>
          <div style={{background:C.surface,borderRadius:10,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:700,color:C.accent}}>{progRelativo}%</div>
            <div style={{fontSize:10,color:C.muted}}>Progreso rel.</div>
          </div>
        </div>
      )}

      {/* Skills */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {skills.map(s=>{
          const nivel=getCurrent(s.id);
          const inicial=getInitial(s.id);
          return(
            <div key={s.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <span style={{fontSize:12,color:C.text,fontWeight:600}}>{s.nombre}</span>
                <span style={{fontSize:11,color:SKILL_COLORS[nivel]||C.muted,fontWeight:700}}>{SKILL_LEVELS[nivel]}</span>
              </div>
              {/* Barra de progreso con indicador de nivel inicial */}
              <div style={{position:"relative",height:8,background:C.border,borderRadius:4,overflow:"visible"}}>
                {/* Barra actual */}
                <div style={{height:"100%",background:SKILL_COLORS[nivel]||C.border,borderRadius:4,width:`${(nivel/5)*100}%`,transition:"width .4s ease"}}/>
                {/* Marcador nivel inicial */}
                {inicial>0&&<div style={{position:"absolute",top:-2,left:`${(inicial/5)*100}%`,width:2,height:12,background:C.muted,borderRadius:1}} title={`Inicio: ${SKILL_LEVELS[inicial]}`}/>}
              </div>
              {/* Selector de nivel cuando editing */}
              {editing&&(
                <div style={{display:"flex",gap:4,marginTop:6}}>
                  {SKILL_LEVELS.map((l,li)=>(
                    <button key={li} onClick={()=>setLevel(s.id,li)}
                      style={{flex:1,padding:"3px 2px",borderRadius:6,border:`1px solid ${nivel===li?SKILL_COLORS[li]:C.border}`,background:nivel===li?(SKILL_COLORS[li]+"22"):"transparent",color:nivel===li?SKILL_COLORS[li]:C.muted,fontSize:9,cursor:"pointer",fontFamily:FONT,fontWeight:nivel===li?700:400}}>
                      {li}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{fontSize:10,color:C.muted,marginTop:10,textAlign:"center"}}>
        Niveles: 0=Sin ver · 1=Principiante · 2=Básico · 3=Competente · 4=Sólido · 5=Dominado
      </div>
    </div>
  );
}

// ─── SKILL OVERVIEW DOCENTE — resumen de todos los alumnos ────────────────────
function SkillOverview({post,session,inscripciones}){
  const pubId=post.id;
  const skills=getSkills(pubId);
  if(!skills.length||!inscripciones.length)return null;

  // Promediar niveles por skill entre todos los alumnos
  const avgBySkill=skills.map(s=>{
    const vals=inscripciones.map(ins=>getSkillProgress(pubId,ins.alumno_email)[s.id]||0);
    const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
    return{skill:s,avg:Math.round(avg*10)/10};
  });

  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",marginBottom:14}}>
      <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:12}}>Promedio de habilidades del grupo</div>
      {avgBySkill.map(({skill,avg})=>(
        <div key={skill.id} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:C.text}}>{skill.nombre}</span>
            <span style={{fontSize:11,color:SKILL_COLORS[Math.round(avg)],fontWeight:700}}>{avg.toFixed(1)} — {SKILL_LEVELS[Math.round(avg)]}</span>
          </div>
          <div style={{height:7,background:C.border,borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",background:SKILL_COLORS[Math.round(avg)]||C.border,borderRadius:4,width:`${(avg/5)*100}%`,transition:"width .5s"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}




// ─── WIZARD DE VALIDACIÓN DE CURSO ───────────────────────────────────────────
// Estados: pendiente → habilidades → examen_inicial → examen_final → listo
function ValidacionWizard({post,session,onValidado}){
  const esParticular=post.modo==="particular"||post.modo==="particulares";
  const [fase,setFase]=useState("habilidades");// habilidades | examen_inicial | examen_final | listo
  const [skills,setSkills]=useState(()=>getSkills(post.id));
  const [bancoPregInicial,setBancoPregInicial]=useState([]);
  const [bancoPregFinal,setBancoPregFinal]=useState([]);
  const [selecInicial,setSelecInicial]=useState(new Set());
  const [selecFinal,setSelecFinal]=useState(new Set());
  const [formato,setFormato]=useState("multiple_choice");
  const [generando,setGenerando]=useState(false);
  const [guardando,setGuardando]=useState(false);
  const [evalInicial,setEvalInicial]=useState(null);
  const [evalFinal,setEvalFinal]=useState(null);

  const nPregs=esParticular?3:6;// clases particulares: menos preguntas

  // Cargar skills ya existentes desde DB
  useEffect(()=>{
    sb.getSkillsDB(post.id,session.access_token).then(d=>{if(d?.length)setSkills(d);}).catch(()=>{});
    sb.getEvaluaciones(post.id,session.access_token).then(evs=>{
      const ini=evs?.find(e=>e.tipo==="diagnostico");
      const fin=evs?.find(e=>e.tipo==="final");
      if(ini){setEvalInicial(ini);if(fin)setEvalFinal(fin);setFase(fin?"listo":"examen_final");}
    }).catch(()=>{});
  },[post.id]);// eslint-disable-line

  // ─── determinar formato según tipo de skills ─────────────────────────────
  const detectarFormato=()=>{
    const tipos=skills.map(s=>s.tipo||"conceptual");
    if(tipos.some(t=>t==="performance"))return "video";
    if(tipos.some(t=>t==="practica"))return "imagen";
    if(tipos.some(t=>t==="creativa"))return "consigna_practica";
    if(tipos.some(t=>t==="procedimental"))return "resolucion_problema";
    return "multiple_choice";
  };

  // ─── generar banco de preguntas ───────────────────────────────────────────
  const generarBanco=async(paraTipo)=>{
    if(!skills.length){alert("Primero agregá las habilidades del curso.");return;}
    setGenerando(true);
    const fmt=detectarFormato();
    setFormato(fmt);
    const skillNombres=skills.map(s=>s.nombre).join(", ");
    const esPerformance=["video","audio","imagen","consigna_practica"].includes(fmt);

    try{
      const system=`Sos un experto en evaluación educativa.
Generás bancos de preguntas en JSON. Solo respondés con JSON válido sin backticks ni explicación.
Tipo de evaluación: ${paraTipo==="inicial"?"diagnóstico inicial (antes de aprender)":"examen final (después de aprender)"}.
${paraTipo==="final"?"IMPORTANTE: Las preguntas finales deben ser DISTINTAS a las iniciales pero evaluar los mismos conceptos con mayor profundidad.":""}
Para ${esParticular?"clases particulares cortas (pocas preguntas, directas)":"cursos completos"}.`;

      let prompt;
      if(esPerformance){
        prompt=`Curso: "${post.titulo}" (${post.materia})
Skills: ${skillNombres}
Formato: ${fmt}
${paraTipo==="inicial"?"Nivel diagnóstico: qué sabe antes de empezar.":"Nivel final: demostrar lo aprendido."}

Generá ${nPregs} consignas prácticas para ${fmt==="video"?"grabar un video":fmt==="audio"?"subir audio":fmt==="imagen"?"subir foto/imagen":"entregar práctica"}.
JSON: {"consignas":[{"id":"c1","titulo":"...","instruccion":"...","criterios":["...","..."],"skill":"...","nivel_esperado_inicial":${paraTipo==="inicial"?"0-1":"3-4"}}]}`;
      } else {
        prompt=`Curso: "${post.titulo}" (${post.materia})
Skills: ${skillNombres}
${paraTipo==="inicial"?"Diagnóstico ANTES de aprender — preguntas que miden conocimiento previo, nivel básico.":"Examen FINAL — preguntas que demuestran lo aprendido, más profundas que el diagnóstico."}

Generá exactamente ${nPregs*2} preguntas de multiple choice. El docente va a elegir ${nPregs} de ellas.
Cada pregunta debe indicar a qué skill corresponde.
JSON: {"preguntas":[{"id":"p1","texto":"...","opciones":["a","b","c","d"],"correcta":0,"skill":"...","dificultad":${paraTipo==="inicial"?"1":"3"},"explicacion":"..."}]}`;
      }

      const res=await sb.callIA(system,prompt,1200);
      const clean=res.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);

      if(esPerformance){
        const items=(parsed.consignas||[]).map((c,i)=>({...c,_idx:i}));
        if(paraTipo==="inicial"){setBancoPregInicial(items);setSelecInicial(new Set(items.slice(0,nPregs).map(c=>c.id)));}
        else{setBancoPregFinal(items);setSelecFinal(new Set(items.slice(0,nPregs).map(c=>c.id)));}
      } else {
        const items=(parsed.preguntas||[]).map((p,i)=>({...p,_idx:i}));
        if(paraTipo==="inicial"){setBancoPregInicial(items);setSelecInicial(new Set(items.slice(0,nPregs).map(p=>p.id)));}
        else{setBancoPregFinal(items);setSelecFinal(new Set(items.slice(0,nPregs).map(p=>p.id)));}
      }
    }catch(e){alert("Error generando banco: "+e.message);}
    finally{setGenerando(false);}
  };

  const guardarEval=async(tipo,banco,selec)=>{
    const selecArray=banco.filter(p=>(selec.has(p.id)));
    const esPerformance=["video","audio","imagen","consigna_practica"].includes(formato);
    const contenido=esPerformance
      ?{consignas:selecArray,formato_entrega:formato}
      :{preguntas:selecArray};
    setGuardando(true);
    try{
      const r=await sb.insertEvaluacion({
        publicacion_id:post.id,
        titulo:tipo==="diagnostico"
          ?(esParticular?"Evaluación inicial":"Examen diagnóstico inicial")
          :(esParticular?"Evaluación final":"Examen final"),
        tipo:tipo==="diagnostico"?"diagnostico":"final",
        formato:esPerformance?formato:"multiple_choice",
        skill_ids:skills.map(s=>s.id).filter(Boolean),
        contenido_json:JSON.stringify(contenido),
        generado_ia:true,activo:true,
      },session.access_token);
      return r?.[0]||null;
    }catch(e){alert("Error guardando: "+e.message);return null;}
    finally{setGuardando(false);}
  };

  const omitirValidacion=async()=>{
    // Activar la publicación sin diagnóstico ni examen final
    setGuardando(true);
    try{
      await sb.updatePublicacion(post.id,{activo:true},session.access_token);
      setFase("listo");
      if(onValidado)onValidado();
    }catch(e){alert(e.message);}
    finally{setGuardando(false);}
  };

  const siguienteDesdeHabilidades=async()=>{
    if(skills.length<2){alert("Agregá al menos 2 habilidades para continuar.");return;}
    await generarBanco("inicial");
    setFase("examen_inicial");
  };

  const siguienteDesdeInicial=async()=>{
    if(selecInicial.size===0){alert("Seleccioná al menos una pregunta.");return;}
    const ev=await guardarEval("diagnostico",bancoPregInicial,selecInicial);
    if(ev){setEvalInicial(ev);await generarBanco("final");setFase("examen_final");}
  };

  const finalizarValidacion=async()=>{
    if(selecFinal.size===0){alert("Seleccioná al menos una pregunta para el examen final.");return;}
    const ev=await guardarEval("final",bancoPregFinal,selecFinal);
    if(!ev)return;
    setEvalFinal(ev);
    // Activar la publicación
    setGuardando(true);
    try{
      await sb.updatePublicacion(post.id,{activo:true},session.access_token);
      setFase("listo");
      if(onValidado)onValidado();
    }catch(e){alert(e.message);}
    finally{setGuardando(false);}
  };

  const esPerformance=["video","audio","imagen","consigna_practica"].includes(formato);
  const bancoActual=fase==="examen_inicial"?bancoPregInicial:bancoPregFinal;
  const selecActual=fase==="examen_inicial"?selecInicial:selecFinal;
  const setSelecActual=fase==="examen_inicial"?setSelecInicial:setSelecFinal;

  const pasos=[
    {id:"habilidades",label:"Habilidades"},
    {id:"examen_inicial",label:esParticular?"Eval. inicial":"Diagnóstico"},
    {id:"examen_final",label:esParticular?"Eval. final":"Examen final"},
    {id:"listo",label:"Publicar"},
  ];
  const faseIdx=pasos.findIndex(p=>p.id===fase);

  return(
    <div style={{background:C.card,border:`2px solid ${C.accent}44`,borderRadius:16,padding:"20px",marginBottom:18}}>
      {/* Header */}
      <div style={{marginBottom:18}}>
        <div style={{fontWeight:700,color:C.accent,fontSize:15,marginBottom:4}}>
          {fase==="listo"?"✓ ¡Validación completa!":"Validación — configurá las evaluaciones del curso"}
        </div>
        <div style={{fontSize:12,color:C.muted}}>{esParticular?"Las evaluaciones son opcionales pero recomendadas.":"Las evaluaciones son opcionales. Podés activar el curso sin ellas y crearlas después."}</div>
      </div>

      {/* Stepper */}
      <div style={{display:"flex",gap:0,marginBottom:20,borderRadius:9,overflow:"hidden",border:`1px solid ${C.border}`}}>
        {pasos.map((p,i)=>(
          <div key={p.id} style={{flex:1,padding:"7px 4px",textAlign:"center",fontSize:10,fontWeight:faseIdx>=i?700:400,
            background:faseIdx>i?"#4ECB7122":faseIdx===i?C.accentDim:"transparent",
            color:faseIdx>i?C.success:faseIdx===i?C.accent:C.muted,
            borderRight:i<pasos.length-1?`1px solid ${C.border}`:"none"}}>
            {faseIdx>i?"✓ ":""}{p.label}
          </div>
        ))}
      </div>

      {/* ── Fase: Habilidades ── */}
      {fase==="habilidades"&&(
        <div>
          <div style={{fontSize:13,color:C.text,marginBottom:12,fontWeight:600}}>
            Paso 1: Definí las habilidades del {esParticular?"la clase":"curso"}
          </div>
          <div style={{fontSize:12,color:C.muted,marginBottom:14}}>
            La IA clasificará cada habilidad y generará evaluaciones adaptadas al tipo de conocimiento.
          </div>
          <SkillManager post={post} session={session} onSkillsChange={setSkills}/>
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button onClick={siguienteDesdeHabilidades} disabled={generando||skills.length<2}
              style={{flex:1,background:C.accent,border:"none",borderRadius:9,color:"#fff",padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,opacity:skills.length<2?0.5:1}}>
              {generando?"✦ Generando...":"Continuar → Evaluación inicial"}
            </button>
            <button onClick={omitirValidacion} disabled={guardando}
              style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"11px 16px",cursor:"pointer",fontSize:12,fontFamily:FONT,whiteSpace:"nowrap"}}
              title="Publicar sin evaluaciones. Podés crearlas después desde la tab Evaluaciones.">
              {guardando?"Activando...":"Omitir y publicar →"}
            </button>
          </div>
          {skills.length<2&&<div style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:6}}>Agregá al menos 2 habilidades para generar evaluaciones, o publicá sin ellas</div>}
        </div>
      )}

      {/* ── Fase: Banco de preguntas ── */}
      {(fase==="examen_inicial"||fase==="examen_final")&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:13,color:C.text,fontWeight:600}}>
              {fase==="examen_inicial"?"Paso 2: Evaluación inicial":"Paso 3: Evaluación final"}
              <span style={{fontSize:11,color:C.muted,fontWeight:400,marginLeft:8}}>
                ({esParticular?"3 preguntas":"6 preguntas"})
              </span>
            </div>
            <button onClick={()=>generarBanco(fase==="examen_inicial"?"inicial":"final")} disabled={generando}
              style={{background:"#C85CE015",border:"1px solid #C85CE033",borderRadius:7,color:C.purple,padding:"4px 10px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>
              {generando?"✦ Generando...":"✦ Regenerar"}
            </button>
          </div>

          {fase==="examen_final"&&(
            <div style={{background:"#5CA8E015",border:"1px solid #5CA8E033",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11,color:C.info}}>
              Las preguntas finales evalúan los mismos conceptos con mayor profundidad. Distintas a las iniciales.
            </div>
          )}

          {generando?<Spinner small/>:(
            <>
              <div style={{fontSize:11,color:C.muted,marginBottom:8}}>
                Seleccioná las {nPregs} preguntas que mejor representan tu {esParticular?"clase":"curso"} ({selecActual.size}/{nPregs} seleccionadas):
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:400,overflowY:"auto",marginBottom:12}}>
                {bancoActual.map((item,i)=>{
                  const sel=selecActual.has(item.id);
                  return(
                    <div key={item.id||i} onClick={()=>{
                      setSelecActual(prev=>{
                        const n=new Set(prev);
                        if(n.has(item.id)){n.delete(item.id);}
                        else if(n.size<nPregs){n.add(item.id);}
                        return n;
                      });
                    }} style={{background:sel?C.accentDim:C.surface,border:`1.5px solid ${sel?C.accent:C.border}`,borderRadius:10,padding:"11px 14px",cursor:"pointer",transition:"all .15s"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                        <div style={{flex:1}}>
                          {esPerformance?(
                            <>
                              <div style={{fontWeight:600,color:C.text,fontSize:12,marginBottom:4}}>{item.titulo}</div>
                              <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{item.instruccion}</div>
                              {item.criterios?.length>0&&<div style={{fontSize:10,color:C.muted,marginTop:4}}>{item.criterios.slice(0,2).join(" · ")}</div>}
                            </>
                          ):(
                            <>
                              <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{item.texto}</div>
                              {item.opciones&&<div style={{fontSize:10,color:C.muted,marginTop:4}}>{item.opciones.slice(0,2).join(" · ")}...</div>}
                            </>
                          )}
                        </div>
                        <div style={{flexShrink:0,display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}>
                          <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${sel?C.accent:C.border}`,background:sel?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {sel&&<span style={{fontSize:10,color:"#fff",fontWeight:700}}>✓</span>}
                          </div>
                          {item.skill&&<span style={{fontSize:9,background:C.card,borderRadius:20,padding:"1px 6px",color:C.muted}}>{item.skill}</span>}
                          {item.dificultad&&<span style={{fontSize:9,color:C.muted}}>dif {item.dificultad}</span>}
                        </div>
                      </div>
                      {/* Mostrar respuesta correcta si es MC */}
                      {!esPerformance&&item.opciones&&sel&&(
                        <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}22`}}>
                          <div style={{fontSize:10,color:C.success,fontWeight:600,marginBottom:3}}>Respuesta correcta:</div>
                          <div style={{fontSize:11,color:C.text}}>{item.opciones[item.correcta]}</div>
                          {item.explicacion&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>{item.explicacion}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{display:"flex",gap:8}}>
                <button
                  onClick={fase==="examen_inicial"?siguienteDesdeInicial:finalizarValidacion}
                  disabled={guardando||selecActual.size===0}
                  style={{flex:1,background:fase==="examen_final"?C.success:C.accent,border:"none",borderRadius:9,color:"#fff",padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,opacity:selecActual.size===0?0.5:1}}>
                  {guardando?"Guardando...":(fase==="examen_inicial"?"Continuar → Examen final":"✓ Publicar")}
                </button>
                <button onClick={omitirValidacion} disabled={guardando}
                  style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"11px 14px",cursor:"pointer",fontSize:12,fontFamily:FONT,whiteSpace:"nowrap"}}
                  title="Publicar ahora sin este examen. Podés crearlo después.">
                  {fase==="examen_inicial"?"Omitir ambos →":"Omitir final →"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Fase: Listo ── */}
      {fase==="listo"&&(
        <div style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{fontSize:36,marginBottom:12}}>🎉</div>
          <div style={{fontWeight:700,color:C.success,fontSize:16,marginBottom:6}}>
            {esParticular?"Clase publicada":"Curso publicado"}
          </div>
          <div style={{color:C.muted,fontSize:13,marginBottom:16}}>
            Ahora aparece en el explorador. Al inscribirse, los alumnos completarán el diagnóstico inicial y el examen final al terminar.
          </div>
          {evalInicial&&<div style={{fontSize:12,color:C.muted,marginBottom:4}}>✓ Evaluación inicial: {evalInicial.titulo}</div>}
          {evalFinal&&<div style={{fontSize:12,color:C.muted}}>✓ Evaluación final: {evalFinal.titulo}</div>}
        </div>
      )}
    </div>
  );
}

// ─── EVALUACIONES FORMALES ────────────────────────────────────────────────────
function EvaluacionesFormales({post,session,esMio,esAyudante,inscripcion,inscripciones}){
  const pubId=post.id;
  const miEmail=session.user.email;
  const [evaluaciones,setEvaluaciones]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showCrear,setShowCrear]=useState(false);
  const [generandoIA,setGenerandoIA]=useState(false);

  // Form crear evaluación
  const [evalTipo,setEvalTipo]=useState("diagnostico");
  const [evalFormato,setEvalFormato]=useState("multiple_choice");
  const [evalTitulo,setEvalTitulo]=useState("");
  const [evalContenido,setEvalContenido]=useState("");
  const [evalSkillIds,setEvalSkillIds]=useState([]);
  const skills=getSkills(pubId);

  useEffect(()=>{
    sb.getEvaluaciones(pubId,session.access_token)
      .then(data=>setEvaluaciones(data||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[pubId]);// eslint-disable-line

  const generarConIA=async()=>{
    const selectedSkills=skills.filter(s=>evalSkillIds.includes(s.id));
    const skillNombres=selectedSkills.map(s=>s.nombre).join(", ")||"las habilidades del curso";
    const skillTipo=selectedSkills[0]?.tipo||"conceptual";
    const formatosRec=(FORMATO_POR_TIPO[skillTipo]||["multiple_choice"]);
    const formatoSugerido=formatosRec[0];
    setEvalFormato(formatoSugerido);
    setGenerandoIA(true);
    try{
      const system=`Sos un generador de evaluaciones educativas. 
Generás evaluaciones en formato JSON. 
El formato ${formatoSugerido} fue elegido porque las skills son de tipo ${skillTipo}.
Respondé SOLO con JSON válido, sin explicación ni backticks.`;
      const prompt=`Curso: "${post.titulo}" (${post.materia})
Tipo de evaluación: ${evalTipo}
Skills a evaluar: ${skillNombres}
Formato: ${formatoSugerido}
Nivel del curso: general

${formatoSugerido==="multiple_choice"?`Generá 4 preguntas de multiple choice con 4 opciones cada una. 
JSON: {"preguntas":[{"texto":"...","opciones":["a","b","c","d"],"correcta":0,"skill":"..."}]}`:""}
${formatoSugerido==="desarrollo"?`Generá 2 preguntas a desarrollar.
JSON: {"preguntas":[{"texto":"...","criterios":"...","skill":"..."}]}`:""}
${formatoSugerido==="consigna_practica"||formatoSugerido==="imagen"||formatoSugerido==="audio"||formatoSugerido==="video"?`Generá una consigna práctica clara.
JSON: {"consigna":"...","criterios_evaluacion":["...","..."],"formato_entrega":"${formatoSugerido}"}`:""}
${formatoSugerido==="rubrica"?`Generá una rúbrica de evaluación.
JSON: {"criterios":[{"nombre":"...","niveles":{"1":"...","3":"...","5":"..."}}]}`:""}
${formatoSugerido==="autoevaluacion"?`Generá preguntas de reflexión.
JSON: {"preguntas":[{"texto":"...","tipo":"reflexion"}]}`:""}`;

      const res=await sb.callIA(system,prompt,800);
      const clean=res.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      setEvalContenido(JSON.stringify(parsed,null,2));
      if(!evalTitulo)setEvalTitulo(`${evalTipo==="diagnostico"?"Diagnóstico inicial":evalTipo==="checkpoint"?"Checkpoint":"Examen final"} — ${skillNombres}`);
    }catch(e){setEvalContenido(`{"error":"No se pudo generar: ${e.message}"}`);}
    finally{setGenerandoIA(false);}
  };

  const guardarEvaluacion=async()=>{
    if(!evalTitulo.trim())return;
    try{
      const r=await sb.insertEvaluacion({
        publicacion_id:pubId,titulo:evalTitulo,tipo:evalTipo,
        formato:evalFormato,skill_ids:evalSkillIds,
        contenido_json:evalContenido,generado_ia:generandoIA||evalContenido.length>10,activo:true,
      },session.access_token);
      setEvaluaciones(prev=>[...prev,...(r||[])]);
      setShowCrear(false);setEvalTitulo("");setEvalContenido("");setEvalSkillIds([]);
    }catch(e){alert("Error al guardar: "+e.message);}
  };

  const iS={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:8};
  const tipoColor={diagnostico:C.info,checkpoint:C.warn,final:C.success};
  const tipoIcon={diagnostico:"🔍",checkpoint:"📍",final:"🏁"};

  return(
    <div>
      {/* Lista de evaluaciones */}
      {loading?<Spinner small/>:evaluaciones.length===0&&!showCrear?(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"30px",textAlign:"center",color:C.muted,fontSize:13}}>
          {esMio||esAyudante?"No hay evaluaciones formales. Creá el diagnóstico inicial para medir el progreso real de tus alumnos.":"El docente aún no cargó evaluaciones formales."}
          {(esMio||esAyudante)&&<div style={{marginTop:12}}><button onClick={()=>setShowCrear(true)} style={{background:C.info,border:"none",borderRadius:8,color:"#fff",padding:"8px 18px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>+ Crear diagnóstico inicial</button></div>}
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
          {evaluaciones.map(ev=>(
            <EvaluacionCard key={ev.id} ev={ev} post={post} session={session} esMio={esMio||esAyudante} inscripciones={inscripciones} inscripcion={inscripcion}
              onDelete={async()=>{await sb.deleteEvaluacion(ev.id,session.access_token).catch(()=>{});setEvaluaciones(p=>p.filter(x=>x.id!==ev.id));}}/>
          ))}
        </div>
      )}

      {/* Botón crear + form */}
      {(esMio||esAyudante)&&!showCrear&&evaluaciones.length>0&&(
        <button onClick={()=>setShowCrear(true)} style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:9,color:C.accent,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>+ Nueva evaluación</button>
      )}

      {(esMio||esAyudante)&&showCrear&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px"}}>
          <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:12}}>Nueva evaluación formal</div>

          {/* Tipo */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:6}}>TIPO</div>
            <div style={{display:"flex",gap:6}}>
              {[["checkpoint","📍 Checkpoint"]].map(([v,l])=>(
                <button key={v} onClick={()=>setEvalTipo(v)}
                  style={{flex:1,padding:"8px 4px",borderRadius:9,border:`1.5px solid ${C.warn}`,background:C.warn+"18",color:C.warn,fontSize:11,cursor:"pointer",fontFamily:FONT,fontWeight:700}}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{fontSize:10,color:C.muted,marginTop:5}}>Solo se pueden crear checkpoints aquí. El diagnóstico y el examen final se configuran en la validación inicial.</div>
          </div>

          {/* Skills */}
          {skills.length>0&&(
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:6}}>SKILLS QUE EVALÚA</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {skills.map(s=>(
                  <button key={s.id} onClick={()=>setEvalSkillIds(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p,s.id])}
                    style={{padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",fontFamily:FONT,
                      background:evalSkillIds.includes(s.id)?C.accent:C.surface,color:evalSkillIds.includes(s.id)?"#fff":C.muted,
                      border:`1px solid ${evalSkillIds.includes(s.id)?C.accent:C.border}`}}>
                    {SKILL_TIPOS[s.tipo]?.icon} {s.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formato */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:6}}>FORMATO</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
              {Object.entries(FORMATO_LABELS).map(([v,{label,icon}])=>(
                <button key={v} onClick={()=>setEvalFormato(v)}
                  style={{padding:"7px 6px",borderRadius:8,border:`1px solid ${evalFormato===v?C.accent:C.border}`,background:evalFormato===v?C.accentDim:"transparent",color:evalFormato===v?C.accent:C.muted,fontSize:10,cursor:"pointer",fontFamily:FONT,fontWeight:evalFormato===v?700:400,textAlign:"center"}}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <input value={evalTitulo} onChange={e=>setEvalTitulo(e.target.value)} placeholder="Título de la evaluación" style={iS}/>

          {/* Generar con IA */}
          <button onClick={generarConIA} disabled={generandoIA}
            style={{background:"#C85CE015",border:"1px solid #C85CE033",borderRadius:8,color:C.purple,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            {generandoIA?"✦ Generando...":"✦ Generar con IA"}
          </button>

          {/* Contenido JSON */}
          <textarea value={evalContenido} onChange={e=>setEvalContenido(e.target.value)}
            placeholder='{"preguntas":[...]} — Generá con IA o escribí el contenido manualmente'
            style={{...iS,minHeight:100,resize:"vertical",fontSize:11,fontFamily:"monospace"}}/>

          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button onClick={guardarEvaluacion} disabled={!evalTitulo.trim()} style={{background:C.success,border:"none",borderRadius:8,color:"#fff",padding:"8px 18px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT,opacity:!evalTitulo.trim()?0.5:1}}>Guardar evaluación</button>
            <button onClick={()=>setShowCrear(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"8px 14px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EVALUACION CARD — muestra una evaluación con opción de rendir ─────────────
function EvaluacionCard({ev,post,session,esMio,inscripciones,inscripcion,onDelete}){
  const miEmail=session.user.email;
  const [entrega,setEntrega]=useState(null);
  const [respuesta,setRespuesta]=useState({});
  const [enviando,setEnviando]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const [todasEntregas,setTodasEntregas]=useState([]);

  useEffect(()=>{
    sb.getMiEntregaEval(ev.id,miEmail,session.access_token).then(r=>setEntrega(r?.[0]||null)).catch(()=>{});
    if(esMio)sb.getEvaluacionEntregas(ev.id,session.access_token).then(r=>setTodasEntregas(r||[])).catch(()=>{});
  },[ev.id]);// eslint-disable-line

  let contenido={};
  try{contenido=JSON.parse(ev.contenido_json||"{}");}catch{}

  const tipoColor={diagnostico:C.info,checkpoint:C.warn,final:C.success};
  const tipoIcon={diagnostico:"🔍",checkpoint:"📍",final:"🏁"};
  const skills=getSkills(post.id);

  const enviarRespuesta=async()=>{
    setEnviando(true);
    try{
      const r=await sb.insertEvaluacionEntrega({
        evaluacion_id:ev.id,publicacion_id:post.id,
        alumno_email:miEmail,respuesta_json:JSON.stringify(respuesta),
      },session.access_token);
      setEntrega(r?.[0]||{});
    }catch(e){alert(e.message);}
    finally{setEnviando(false);}
  };

  const calcScore=()=>{
    if(!entrega?.respuesta_json||ev.formato!=="multiple_choice")return null;
    try{
      const resp=JSON.parse(entrega.respuesta_json);
      const pregs=contenido.preguntas||[];
      if(!pregs.length)return null;
      const correctas=pregs.filter((p,i)=>resp[i]===p.correcta).length;
      return Math.round((correctas/pregs.length)*100);
    }catch{return null;}
  };
  const score=calcScore();

  return(
    <div style={{background:C.card,border:`1px solid ${tipoColor[ev.tipo]||C.border}22`,borderRadius:12,overflow:"hidden"}}>
      {/* Header */}
      <div onClick={()=>setExpanded(v=>!v)} style={{padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18}}>{tipoIcon[ev.tipo]}</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,color:C.text,fontSize:13}}>{ev.titulo}</div>
          <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap"}}>
            <span style={{fontSize:10,background:(tipoColor[ev.tipo]||C.border)+"18",color:tipoColor[ev.tipo]||C.muted,borderRadius:20,padding:"1px 8px",border:`1px solid ${(tipoColor[ev.tipo]||C.border)}33`}}>
              {ev.tipo==="diagnostico"?"Diagnóstico":ev.tipo==="checkpoint"?"Checkpoint":"Examen final"}
            </span>
            {ev.formato&&<span style={{fontSize:10,background:C.surface,borderRadius:20,padding:"1px 7px",border:`1px solid ${C.border}`,color:C.muted}}>{FORMATO_LABELS[ev.formato]?.icon} {FORMATO_LABELS[ev.formato]?.label||ev.formato}</span>}
            {ev.generado_ia&&<span style={{fontSize:10,background:"#C85CE015",color:C.purple,borderRadius:20,padding:"1px 7px",border:"1px solid #C85CE033"}}>✦ IA</span>}
            {entrega&&<span style={{fontSize:10,background:"#4ECB7115",color:C.success,borderRadius:20,padding:"1px 7px",border:"1px solid #4ECB7133"}}>✓ Entregado</span>}
            {score!==null&&<span style={{fontSize:10,fontWeight:700,color:score>=60?C.success:C.danger}}>{score}%</span>}
            {esMio&&todasEntregas.length>0&&<span style={{fontSize:10,color:C.muted}}>{todasEntregas.length} entrega{todasEntregas.length!==1?"s":""}</span>}
          </div>
        </div>
        <span style={{color:C.muted,fontSize:12}}>{expanded?"▴":"▾"}</span>
      </div>

      {/* Body expandido */}
      {expanded&&(
        <div style={{borderTop:`1px solid ${C.border}`,padding:"14px 16px"}}>
          {/* Vista alumno — rendir evaluación */}
          {!esMio&&inscripcion&&!entrega&&(
            <div>
              {ev.formato==="multiple_choice"&&contenido.preguntas?.map((p,pi)=>(
                <div key={pi} style={{marginBottom:14}}>
                  <div style={{fontSize:13,color:C.text,fontWeight:600,marginBottom:8}}>{pi+1}. {p.texto}</div>
                  {(p.opciones||[]).map((op,oi)=>(
                    <button key={oi} onClick={()=>setRespuesta(r=>({...r,[pi]:oi}))}
                      style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",marginBottom:5,borderRadius:8,border:`1.5px solid ${respuesta[pi]===oi?C.accent:C.border}`,background:respuesta[pi]===oi?C.accentDim:"transparent",color:C.text,fontSize:12,cursor:"pointer",fontFamily:FONT}}>
                      {["A","B","C","D"][oi]}. {op}
                    </button>
                  ))}
                </div>
              ))}
              {["consigna_practica","desarrollo","audio","video","imagen"].includes(ev.formato)&&(
                <div>
                  {contenido.consigna&&<p style={{color:C.text,fontSize:13,marginBottom:12,lineHeight:1.6}}>{contenido.consigna}</p>}
                  {contenido.criterios_evaluacion&&<div style={{background:C.surface,borderRadius:8,padding:"10px 12px",marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6}}>CRITERIOS</div>{contenido.criterios_evaluacion.map((c,i)=><div key={i} style={{fontSize:12,color:C.muted,marginBottom:3}}>· {c}</div>)}</div>}
                  <textarea value={respuesta.texto||""} onChange={e=>setRespuesta(r=>({...r,texto:e.target.value}))}
                    placeholder="Tu respuesta..."
                    style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 12px",color:C.text,fontSize:12,minHeight:80,resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:8}}/>
                </div>
              )}
              {ev.formato==="autoevaluacion"&&contenido.preguntas?.map((p,pi)=>(
                <div key={pi} style={{marginBottom:12}}>
                  <div style={{fontSize:13,color:C.text,marginBottom:6}}>{p.texto}</div>
                  <textarea value={respuesta[pi]||""} onChange={e=>setRespuesta(r=>({...r,[pi]:e.target.value}))}
                    placeholder="Tu reflexión..."
                    style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 11px",color:C.text,fontSize:12,minHeight:60,resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:FONT}}/>
                </div>
              ))}
              <button onClick={enviarRespuesta} disabled={enviando}
                style={{background:C.success,border:"none",borderRadius:9,color:"#fff",padding:"9px 20px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:FONT,marginTop:8}}>
                {enviando?"Enviando...":"Entregar evaluación →"}
              </button>
            </div>
          )}

          {/* Ya entregado — mostrar resultado */}
          {!esMio&&entrega&&(
            <div>
              {score!==null&&(
                <div style={{background:score>=60?"#4ECB7115":"#E05C5C15",border:`1px solid ${score>=60?"#4ECB7133":"#E05C5C33"}`,borderRadius:10,padding:"12px 16px",marginBottom:12,textAlign:"center"}}>
                  <div style={{fontSize:28,fontWeight:700,color:score>=60?C.success:C.danger}}>{score}%</div>
                  <div style={{fontSize:12,color:C.muted}}>{score>=60?"¡Buen resultado!":"Podés mejorar"}</div>
                </div>
              )}
              {entrega.feedback&&<div style={{background:C.surface,borderRadius:8,padding:"10px 12px",fontSize:12,color:C.text}}><span style={{fontWeight:700}}>Feedback: </span>{entrega.feedback}</div>}
              {!entrega.corregido&&<div style={{fontSize:11,color:C.muted,marginTop:8}}>Pendiente de corrección por el docente.</div>}
            </div>
          )}

          {/* Vista docente — entregas de alumnos */}
          {esMio&&todasEntregas.length>0&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:8}}>ENTREGAS ({todasEntregas.length})</div>
              {todasEntregas.map(e=>(
                <EntregaEvalRow key={e.id} entrega={e} evaluacion={ev} session={session} onUpdate={(updated)=>setTodasEntregas(p=>p.map(x=>x.id===updated.id?updated:x))}/>
              ))}
            </div>
          )}

          {esMio&&<button onClick={onDelete} style={{background:"none",border:`1px solid ${C.danger}`,borderRadius:8,color:C.danger,padding:"5px 12px",cursor:"pointer",fontSize:11,fontFamily:FONT,marginTop:8}}>Eliminar evaluación</button>}
        </div>
      )}
    </div>
  );
}

// ─── FILA DE ENTREGA DE EVALUACIÓN (vista docente) ────────────────────────────
function EntregaEvalRow({entrega,evaluacion,session,onUpdate}){
  const [nota,setNota]=useState(entrega.nota||"");
  const [feedback,setFeedback]=useState(entrega.feedback||"");
  const [saving,setSaving]=useState(false);
  const [expanded,setExpanded]=useState(false);

  let resp={};try{resp=JSON.parse(entrega.respuesta_json||"{}");}catch{}
  let contenido={};try{contenido=JSON.parse(evaluacion.contenido_json||"{}");}catch{}

  const guardar=async()=>{
    setSaving(true);
    try{
      const r=await sb.updateEvaluacionEntrega(entrega.id,{nota:parseFloat(nota)||null,feedback,corregido:true},session.access_token);
      if(onUpdate)onUpdate({...entrega,...(r?.[0]||{}),nota:parseFloat(nota)||null,feedback,corregido:true});
    }catch(e){alert(e.message);}
    finally{setSaving(false);}
  };

  return(
    <div style={{background:C.surface,borderRadius:9,padding:"10px 12px",marginBottom:8}}>
      <div onClick={()=>setExpanded(v=>!v)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:C.text}}>{entrega.alumno_safeDisplayName(null,email)}</div>
          <div style={{fontSize:10,color:C.muted}}>{fmtRel(entrega.created_at)}</div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {entrega.nota&&<span style={{fontSize:11,fontWeight:700,color:C.accent}}>{entrega.nota}/100</span>}
          {entrega.corregido&&<span style={{fontSize:10,color:C.success}}>✓ Corregido</span>}
          <span style={{color:C.muted,fontSize:11}}>{expanded?"▴":"▾"}</span>
        </div>
      </div>
      {expanded&&(
        <div style={{marginTop:10}}>
          {evaluacion.formato==="multiple_choice"&&contenido.preguntas?.map((p,pi)=>(
            <div key={pi} style={{marginBottom:8}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:3}}>{pi+1}. {p.texto}</div>
              <div style={{fontSize:12,color:resp[pi]===p.correcta?C.success:C.danger}}>
                {resp[pi]===p.correcta?"✓":"✗"} Respondió: {p.opciones?.[resp[pi]]||"Sin respuesta"}
              </div>
            </div>
          ))}
          {typeof resp.texto==="string"&&<div style={{background:C.card,borderRadius:8,padding:"8px 10px",fontSize:12,color:C.text,marginBottom:10,lineHeight:1.5}}>{resp.texto}</div>}
          <div style={{display:"flex",gap:7,alignItems:"center",marginTop:8}}>
            <input type="number" value={nota} onChange={e=>setNota(e.target.value)} placeholder="Nota /100" min="0" max="100"
              style={{width:90,background:C.card,border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 9px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT}}/>
            <input value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Feedback para el alumno..."
              style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 9px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT}}/>
            <button onClick={guardar} disabled={saving}
              style={{background:C.success,border:"none",borderRadius:7,color:"#fff",padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:FONT}}>
              {saving?"...":"Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



// ─── EXAMEN FINAL MODAL — se muestra cuando el docente marca clase finalizada ──
function ExamenFinalModal({post,session,onClose}){
  const [evaluacion,setEvaluacion]=useState(null);
  const [loading,setLoading]=useState(true);
  const miEmail=session.user.email;

  useEffect(()=>{
    // Verificar si ya entregó el examen final
    sb.getEvaluaciones(post.id,session.access_token)
      .then(async evs=>{
        const fin=evs?.find(e=>e.tipo==="final"&&e.activo);
        if(!fin){setLoading(false);return;}
        const misEntregas=await sb.getMiEntregaEval(fin.id,miEmail,session.access_token).catch(()=>[]);
        if(misEntregas?.length>0){setLoading(false);onClose();return;}// ya lo rindió
        setEvaluacion(fin);setLoading(false);
      }).catch(()=>setLoading(false));
  },[post.id]);// eslint-disable-line

  if(loading)return null;
  if(!evaluacion)return null;

  return <DiagnosticoModal post={post} session={session} onClose={onClose} evaluacion={evaluacion} titulo="Examen final" subtitulo="¡El docente finalizó el curso! Completá el examen final para registrar tu progreso."/>;
}

// ─── DIAGNÓSTICO MODAL AL INSCRIBIRSE ─────────────────────────────────────────
function DiagnosticoModal({post,session,onClose,evaluacion:evalOverride,titulo:tituloOverride,subtitulo:subtituloOverride}){
  const [evaluacion,setEvaluacion]=useState(null);
  const [loading,setLoading]=useState(true);
  const [step,setStep]=useState(0);
  const [respuestas,setRespuestas]=useState({});
  const [enviando,setEnviando]=useState(false);
  const [done,setDone]=useState(false);
  const miEmail=session.user.email;

  useEffect(()=>{
    sb.getEvaluaciones(post.id,session.access_token)
      .then(evs=>{const d=evalOverride||evs?.find(e=>e.tipo==="diagnostico"&&e.activo);setEvaluacion(d||null);})
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[post.id]);// eslint-disable-line

  const entregar=async()=>{
    if(!evaluacion)return;
    setEnviando(true);
    try{
      await sb.insertEvaluacionEntrega({
        evaluacion_id:evaluacion.id,publicacion_id:post.id,
        alumno_email:miEmail,respuesta_json:JSON.stringify(respuestas),
      },session.access_token);
      setDone(true);
    }catch(e){console.error(e);}
    finally{setEnviando(false);}
  };

  if(loading)return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
      <Spinner/>
    </div>
  );

  if(!evaluacion){onClose();return null;}

  let contenido={};try{contenido=JSON.parse(evaluacion.contenido_json||"{}");}catch{}
  const preguntas=contenido.preguntas||[];
  const consignas=contenido.consignas||[];
  const esPerformance=consignas.length>0;
  const items=esPerformance?consignas:preguntas;
  const totalSteps=items.length;
  const item=items[step];

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:FONT}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,width:"min(560px,96vw)",maxHeight:"92vh",overflowY:"auto"}}>
        {/* Header */}
        <div style={{padding:"20px 24px 0",borderBottom:`1px solid ${C.border}`,paddingBottom:16,marginBottom:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontWeight:700,color:C.text,fontSize:16}}>{tituloOverride||"Diagnóstico inicial"}</div>
            {done&&<button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer"}}>×</button>}
          </div>
          <div style={{fontSize:12,color:C.muted}}>
            {done?(subtituloOverride||"¡Diagnóstico completado! Tus resultados nos ayudan a medir tu progreso real al final.")
              :subtituloOverride?subtituloOverride:`Paso ${step+1} de ${totalSteps} · ${post.titulo}`}
          </div>
          {/* Progress bar */}
          {!done&&<div style={{height:3,background:C.border,borderRadius:2,marginTop:10}}>
            <div style={{height:"100%",background:C.accent,borderRadius:2,width:`${((step+1)/totalSteps)*100}%`,transition:"width .3s"}}/>
          </div>}
        </div>

        <div style={{padding:"20px 24px"}}>
          {done?(
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:44,marginBottom:12}}>✓</div>
              <div style={{fontWeight:700,color:C.success,fontSize:17,marginBottom:8}}>Diagnóstico completado</div>
              <div style={{color:C.muted,fontSize:13,marginBottom:20,lineHeight:1.6}}>
                Tus niveles iniciales quedaron registrados. Al finalizar el curso rendirás el examen final y veremos cuánto avanzaste.
              </div>
              <button onClick={onClose} style={{background:C.accent,border:"none",borderRadius:10,color:"#fff",padding:"11px 28px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:FONT}}>
                Ir al contenido →
              </button>
            </div>
          ):item?(
            <div>
              {esPerformance?(
                <div>
                  <div style={{fontWeight:600,color:C.text,fontSize:14,marginBottom:8}}>{item.titulo}</div>
                  <div style={{color:C.muted,fontSize:13,lineHeight:1.6,marginBottom:14}}>{item.instruccion}</div>
                  {item.criterios?.length>0&&(
                    <div style={{background:C.card,borderRadius:9,padding:"10px 13px",marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6}}>Criterios de evaluación</div>
                      {item.criterios.map((c,i)=><div key={i} style={{fontSize:12,color:C.muted,marginBottom:3}}>· {c}</div>)}
                    </div>
                  )}
                  <textarea value={respuestas[step]?.texto||""} onChange={e=>setRespuestas(r=>({...r,[step]:{...r[step],texto:e.target.value}}))}
                    placeholder="Describí lo que sabés o podés hacer actualmente..."
                    style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 12px",color:C.text,fontSize:12,minHeight:80,resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:4}}/>
                  <div style={{fontSize:11,color:C.muted,marginBottom:16}}>No hay respuesta correcta — es solo para registrar tu punto de partida.</div>
                </div>
              ):(
                <div>
                  <div style={{fontSize:14,color:C.text,fontWeight:600,lineHeight:1.5,marginBottom:16}}>{item.texto}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {(item.opciones||[]).map((op,oi)=>(
                      <button key={oi} onClick={()=>setRespuestas(r=>({...r,[step]:oi}))}
                        style={{padding:"10px 14px",borderRadius:9,border:`1.5px solid ${respuestas[step]===oi?C.accent:C.border}`,background:respuestas[step]===oi?C.accentDim:"transparent",color:C.text,fontSize:13,cursor:"pointer",fontFamily:FONT,textAlign:"left",fontWeight:respuestas[step]===oi?700:400}}>
                        <span style={{color:C.muted,marginRight:10,fontSize:11}}>{["A","B","C","D"][oi]}.</span>{op}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nav buttons */}
              <div style={{display:"flex",gap:8,marginTop:20}}>
                {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"10px 18px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>← Anterior</button>}
                {step<totalSteps-1?(
                  <button onClick={()=>setStep(s=>s+1)} disabled={!esPerformance&&respuestas[step]===undefined}
                    style={{flex:1,background:C.accent,border:"none",borderRadius:9,color:"#fff",padding:"10px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,opacity:!esPerformance&&respuestas[step]===undefined?0.5:1}}>
                    Siguiente →
                  </button>
                ):(
                  <button onClick={entregar} disabled={enviando||(!esPerformance&&respuestas[step]===undefined)}
                    style={{flex:1,background:C.success,border:"none",borderRadius:9,color:"#fff",padding:"10px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,opacity:enviando?0.7:1}}>
                    {enviando?"Enviando...":"Finalizar diagnóstico ✓"}
                  </button>
                )}
              </div>
              {!esPerformance&&respuestas[step]===undefined&&<div style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:6}}>Seleccioná una opción para continuar</div>}
            </div>
          ):null}
        </div>
      </div>
    </div>
  );
}

// ─── EXAMEN DIAGNÓSTICO INICIAL ───────────────────────────────────────────────
function DiagnosticoInicial({post,session,skills}){
  const KEY=`cl_diag_${post.id}_${session.user.email}`;
  const [estado,setEstado]=useState(()=>{try{return JSON.parse(localStorage.getItem(KEY)||"null");}catch{return null;}});
  const [step,setStep]=useState(0);
  const [niveles,setNiveles]=useState({});
  const [mostrar,setMostrar]=useState(false);

  if(!skills||skills.length===0)return null;
  // Ya completado: mostrar resumen compacto
  if(estado){
    return(
      <div style={{background:"#5CA8E015",border:"1px solid #5CA8E033",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:16}}>✓</span>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:700,color:C.info}}>Diagnóstico completado</div>
          <div style={{fontSize:11,color:C.muted}}>Tu nivel inicial fue registrado. Podés ver tu progreso en esta pestaña.</div>
        </div>
      </div>
    );
  }
  if(!mostrar){
    return(
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
        <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:4}}>Diagnóstico inicial</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:10}}>Contanos tu nivel actual en cada habilidad. Esto nos ayuda a medir tu progreso real al final del curso.</div>
        <button onClick={()=>setMostrar(true)}
          style={{background:C.info,border:"none",borderRadius:8,color:"#fff",padding:"7px 16px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>
          Comenzar diagnóstico →
        </button>
      </div>
    );
  }
  const skill=skills[step];
  const completar=()=>{
    if(step<skills.length-1){setStep(s=>s+1);return;}
    // Guardar como niveles iniciales en skill progress
    const spKey=`cl_sp_${post.id}_${session.user.email}`;
    try{
      const prev=JSON.parse(localStorage.getItem(spKey)||"{}");
      const updated={...prev};
      skills.forEach(s=>{
        const n=niveles[s.id]??0;
        updated["initial_"+s.id]=n;
        if(!prev[s.id])updated[s.id]=n;// también setear nivel actual si no existe
      });
      localStorage.setItem(spKey,JSON.stringify(updated));
      localStorage.setItem(KEY,JSON.stringify({completado:new Date().toISOString(),niveles}));
      setEstado({completado:new Date().toISOString(),niveles});
    }catch{}
  };
  const NIVELES_LABEL=["No lo vi nunca","Algo escuché","Entiendo lo básico","Puedo aplicarlo","Lo manejo bien","Lo domino"];
  return(
    <div style={{background:C.card,border:`1px solid ${C.accent}44`,borderRadius:14,padding:"18px 20px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <div style={{fontWeight:700,color:C.text,fontSize:13}}>Diagnóstico inicial</div>
        <span style={{fontSize:11,color:C.muted}}>{step+1}/{skills.length}</span>
      </div>
      <div style={{height:3,background:C.border,borderRadius:2,marginBottom:16}}>
        <div style={{height:"100%",background:C.accent,borderRadius:2,width:`${((step+1)/skills.length)*100}%`,transition:"width .3s"}}/>
      </div>
      <div style={{fontSize:14,color:C.text,fontWeight:600,marginBottom:14}}>¿Cómo calificarías tu nivel en <span style={{color:C.accent}}>{skill.nombre}</span>?</div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {NIVELES_LABEL.map((l,i)=>(
          <button key={i} onClick={()=>setNiveles(p=>({...p,[skill.id]:i}))}
            style={{padding:"9px 14px",borderRadius:9,fontSize:12,cursor:"pointer",fontFamily:FONT,
              textAlign:"left",border:`1.5px solid ${niveles[skill.id]===i?C.accent:C.border}`,
              background:niveles[skill.id]===i?C.accentDim:C.surface,
              color:niveles[skill.id]===i?C.accent:C.text,fontWeight:niveles[skill.id]===i?700:400}}>
            <span style={{color:C.muted,marginRight:8,fontSize:11}}>{i}</span>{l}
          </button>
        ))}
      </div>
      <button onClick={completar} disabled={niveles[skill.id]===undefined}
        style={{marginTop:14,width:"100%",background:C.accent,border:"none",borderRadius:9,
          color:"#fff",padding:"10px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,
          opacity:niveles[skill.id]===undefined?0.4:1}}>
        {step<skills.length-1?"Siguiente →":"Finalizar diagnóstico ✓"}
      </button>
    </div>
  );
}

// ─── INLINE CONTENIDO EDITOR ──────────────────────────────────────────────────
function InlineContenidoEditor({item,session,onSaved,onCancel}){
  const [titulo,setTitulo]=useState(item.titulo||"");
  const [texto,setTexto]=useState(item.texto||"");
  const [url,setUrl]=useState(item.url||"");
  const [saving,setSaving]=useState(false);
  const esTexto=["texto","aviso","tarea"].includes(item.tipo);
  const save=async()=>{
    if(!titulo.trim())return;
    setSaving(true);
    try{
      const data={titulo:titulo.trim()};
      if(esTexto)data.texto=texto.trim()||null;else data.url=url.trim()||null;
      await sb.updateContenido(item.id,data,session.access_token);
      onSaved(data);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const iS={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",color:C.text,fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:6};
  return(
    <div style={{marginTop:8,padding:"10px",background:C.surface,borderRadius:9,border:`1px solid ${C.accent}44`,animation:"fadeIn .15s ease"}}>
      <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Título" style={iS}/>
      {esTexto
        ?<textarea value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Contenido…" style={{...iS,minHeight:55,resize:"vertical"}}/>
        :<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="URL" style={iS}/>
      }
      <div style={{display:"flex",gap:7}}>
        <button onClick={save} disabled={saving||!titulo.trim()} style={{background:C.accent,border:"none",borderRadius:8,color:"#fff",padding:"5px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,opacity:!titulo.trim()?0.5:1}}>{saving?"…":"Guardar"}</button>
        <button onClick={onCancel} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:FONT}}>Cancelar</button>
      </div>
    </div>
  );
}

// ─── EVALUACIONES FORMALES + QUIZZES FUSIONADO ────────────────────────────────
// Muestra: [Diagnóstico] → [Checkpoints] → [Final] → [Quizzes] con formulario mejorado
function EvaluacionesFormalesConQuizzes({post,session,esMio,esAyudante,inscripcion,inscripciones,contenido,setContenido,expandedQuizzes,setExpandedQuizzes,editingQuiz,setEditingQuiz,tieneAcceso}){
  const pubId=post.id;
  const [evaluaciones,setEvaluaciones]=useState([]);
  const [loadingEv,setLoadingEv]=useState(true);
  const [showCrearEv,setShowCrearEv]=useState(false);

  useEffect(()=>{
    sb.getEvaluaciones(pubId,session.access_token).then(d=>setEvaluaciones(d||[])).catch(()=>{}).finally(()=>setLoadingEv(false));
  },[pubId]);// eslint-disable-line

  const evDiag=evaluaciones.filter(e=>e.tipo==="diagnostico");
  const evCheck=evaluaciones.filter(e=>e.tipo==="checkpoint");
  const evFinal=evaluaciones.filter(e=>e.tipo==="final");
  const hasAny=evaluaciones.length>0;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontWeight:700,color:C.text,fontSize:14}}>
          Evaluaciones {hasAny&&<span style={{color:C.muted,fontWeight:400,fontSize:12}}>({evaluaciones.length})</span>}
        </div>
        {(esMio||esAyudante)&&(
          <button onClick={()=>setShowCrearEv(v=>!v)} style={{background:"#5CA8E015",border:"1px solid #5CA8E033",borderRadius:8,color:C.info,padding:"5px 11px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:700}}>+ Nueva evaluación</button>
        )}
      </div>

      {(esMio||esAyudante)&&showCrearEv&&(
        <EvaluacionCreadorMejorado post={post} session={session}
          onSaved={(ev)=>{setEvaluaciones(prev=>{const all=[...prev,ev];return[...all.filter(e=>e.tipo==="diagnostico"),...all.filter(e=>e.tipo==="checkpoint"),...all.filter(e=>e.tipo==="final")];});setShowCrearEv(false);}}
          onCancel={()=>setShowCrearEv(false)}/>
      )}

      {loadingEv?<Spinner small/>:!hasAny&&!showCrearEv?(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"30px",textAlign:"center",color:C.muted,fontSize:13}}>
          {(esMio||esAyudante)?"Creá el diagnóstico inicial para medir el nivel de tus alumnos desde el comienzo.":"El docente aún no cargó evaluaciones."}
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {evDiag.map(ev=>(
            <EvaluacionCard key={ev.id} ev={ev} post={post} session={session} esMio={esMio||esAyudante} inscripciones={inscripciones} inscripcion={inscripcion}
              onDelete={async()=>{await sb.deleteEvaluacion(ev.id,session.access_token).catch(()=>{});setEvaluaciones(p=>p.filter(x=>x.id!==ev.id));}}/>
          ))}
          {evCheck.map(ev=>(
            <EvaluacionCard key={ev.id} ev={ev} post={post} session={session} esMio={esMio||esAyudante} inscripciones={inscripciones} inscripcion={inscripcion}
              onDelete={async()=>{await sb.deleteEvaluacion(ev.id,session.access_token).catch(()=>{});setEvaluaciones(p=>p.filter(x=>x.id!==ev.id));}}/>
          ))}
          {evFinal.map(ev=>(
            <EvaluacionCard key={ev.id} ev={ev} post={post} session={session} esMio={esMio||esAyudante} inscripciones={inscripciones} inscripcion={inscripcion}
              onDelete={async()=>{await sb.deleteEvaluacion(ev.id,session.access_token).catch(()=>{});setEvaluaciones(p=>p.filter(x=>x.id!==ev.id));}}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EVALUACION CREADOR MEJORADO ──────────────────────────────────────────────
function EvaluacionCreadorMejorado({post,session,onSaved,onCancel}){
  const pubId=post.id;
  const [evalTipo,setEvalTipo]=useState("checkpoint");
  const [evalFormato,setEvalFormato]=useState("multiple_choice");
  const [evalTitulo,setEvalTitulo]=useState("");
  const [generandoIA,setGenerandoIA]=useState(false);
  const [temaIA,setTemaIA]=useState("");
  const [cantIA,setCantIA]=useState(4);
  const [pregsMC,setPregsMC]=useState([{texto:"",opciones:["","","",""],correctas:new Set([0])}]);
  const [pregsVF,setPregsVF]=useState([{texto:"",correcta:0}]);
  const [pregsDesarrollo,setPregsDesarrollo]=useState([{texto:"",criterios:""}]);
  const [consigna,setConsigna]=useState("");
  const [criterios,setCriterios]=useState([""]);
  const [pregsReflexion,setPregsReflexion]=useState([{texto:""}]);
  const [saving,setSaving]=useState(false);
  const skills=getSkills(pubId);
  const [evalSkillIds,setEvalSkillIds]=useState([]);
  const iS={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 11px",color:C.text,fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:8};
  const tipoColor={diagnostico:C.info,checkpoint:C.warn,final:C.success};
  const toggleCorrecta=(qi,oi)=>setPregsMC(p=>p.map((x,i)=>{
    if(i!==qi)return x;
    const nc=new Set(x.correctas);nc.has(oi)?nc.delete(oi):nc.add(oi);if(nc.size===0)nc.add(oi);return{...x,correctas:nc};
  }));
  const generarConIA=async()=>{
    if(!temaIA.trim())return;setGenerandoIA(true);
    try{
      const system=`Sos un generador de evaluaciones educativas. Respondé SOLO con JSON válido sin explicación ni backticks.`;
      let prompt="";
      if(evalFormato==="multiple_choice"){
        prompt=`Curso: "${post.titulo}" (${post.materia||""}). Tipo: ${evalTipo}. Tema: ${temaIA}.\nGenerá ${cantIA} preguntas de multiple choice con 4 opciones. Algunas pueden tener MÁS DE UNA respuesta correcta.\nJSON: {"preguntas":[{"texto":"...","opciones":["a","b","c","d"],"correctas":[0]}]}\nSi hay múltiples correctas: "correctas":[0,2]. Siempre al menos una.`;
      }else if(evalFormato==="verdadero_falso"){
        prompt=`Curso: "${post.titulo}" (${post.materia||""}). Tema: ${temaIA}.\nGenerá ${cantIA} afirmaciones para Verdadero/Falso.\nJSON: {"preguntas":[{"texto":"afirmación...","correcta":0}]}\ncorrecta: 0=Verdadero, 1=Falso`;
      }else if(evalFormato==="desarrollo"||evalFormato==="rubrica"){
        prompt=`Curso: "${post.titulo}". Tema: ${temaIA}. Generá ${cantIA} preguntas a desarrollar.\nJSON: {"preguntas":[{"texto":"...","criterios":"criterios de corrección"}]}`;
      }else{
        prompt=`Curso: "${post.titulo}". Tema: ${temaIA}.\nGenerá una consigna práctica.\nJSON: {"consigna":"...","criterios":["criterio 1","criterio 2","criterio 3"]}`;
      }
      const res=await sb.callIA(system,prompt,800);
      const clean=res.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      if(parsed.preguntas&&evalFormato==="multiple_choice"){
        setPregsMC(parsed.preguntas.map(p=>({texto:p.texto||"",opciones:(p.opciones||["","","",""]).slice(0,4).map(String),correctas:new Set(Array.isArray(p.correctas)?p.correctas:(p.correcta!=null?[p.correcta]:[0]))})));
      }else if(parsed.preguntas&&evalFormato==="verdadero_falso"){
        setPregsVF(parsed.preguntas.map(p=>({texto:p.texto||"",correcta:typeof p.correcta==="number"?p.correcta:0})));
      }else if(parsed.preguntas){
        setPregsDesarrollo(parsed.preguntas.map(p=>({texto:p.texto||"",criterios:p.criterios||""})));
      }else if(parsed.consigna){setConsigna(parsed.consigna);if(parsed.criterios)setCriterios(parsed.criterios);}
      if(!evalTitulo)setEvalTitulo(`${evalTipo==="diagnostico"?"Diagnóstico":evalTipo==="checkpoint"?"Checkpoint":"Examen final"} — ${temaIA}`);
    }catch(e){alert("Error generando: "+e.message);}finally{setGenerandoIA(false);}
  };
  const guardar=async()=>{
    if(!evalTitulo.trim())return;setSaving(true);
    try{
      let contenidoJson={};
      if(evalFormato==="multiple_choice")contenidoJson={preguntas:pregsMC.map(p=>({...p,correctas:[...p.correctas],correcta:[...p.correctas][0]}))};
      else if(evalFormato==="verdadero_falso")contenidoJson={preguntas:pregsVF};
      else if(evalFormato==="desarrollo"||evalFormato==="rubrica")contenidoJson={preguntas:pregsDesarrollo};
      else if(evalFormato==="autoevaluacion")contenidoJson={preguntas:pregsReflexion};
      else contenidoJson={consigna,criterios_evaluacion:criterios.filter(Boolean),formato_entrega:evalFormato};
      const r=await sb.insertEvaluacion({publicacion_id:pubId,titulo:evalTitulo,tipo:evalTipo,formato:evalFormato,skill_ids:evalSkillIds,contenido_json:JSON.stringify(contenidoJson),generado_ia:false,activo:evalTipo!=="final"},session.access_token);
      onSaved(r?.[0]||{});
    }catch(e){alert("Error: "+e.message);}finally{setSaving(false);}
  };
  const formatosGrupos=[
    {label:"Opción múltiple",items:[["multiple_choice","📋 Multiple choice"],["verdadero_falso","☑️ Verdadero/Falso"]]},
    {label:"Escritura",items:[["desarrollo","✍️ Respuesta a desarrollar"],["rubrica","📊 Rúbrica"]]},
    {label:"Práctica",items:[["consigna_practica","📌 Consigna práctica"],["ejercicio_codigo","💻 Ejercicio de código"],["imagen","🖼 Subir imagen"],["audio","🎵 Subir audio"],["video","🎬 Subir video"]]},
    {label:"Reflexión",items:[["autoevaluacion","🪞 Autoevaluación"],["peer_review","👥 Revisión entre pares"]]},
  ];
  const esSubida=["imagen","audio","video"].includes(evalFormato);
  const esPractica=["consigna_practica","ejercicio_codigo","peer_review"].includes(evalFormato);
  const esDesarrollo=["desarrollo","rubrica"].includes(evalFormato);
  const esVF=evalFormato==="verdadero_falso";
  const esMC=evalFormato==="multiple_choice";
  const esReflexion=evalFormato==="autoevaluacion";
  const tienePreguntas=esMC||esVF||esDesarrollo||esReflexion;
  return(
    <div style={{background:C.surface,border:`1px solid ${C.accent}44`,borderRadius:14,padding:18,marginBottom:14,animation:"fadeIn .15s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{fontWeight:700,color:C.text,fontSize:14}}>🎓 Nueva evaluación formal</span>
        <button onClick={onCancel} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>×</button>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:6}}>TIPO</div>
        <div style={{background:C.bg,border:`1px solid ${C.warn}`,borderRadius:9,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>📍</span>
          <div>
            <div style={{fontWeight:700,color:C.warn,fontSize:13}}>Checkpoint</div>
            <div style={{fontSize:11,color:C.muted}}>Evaluación intermedia del curso. El diagnóstico y el examen final se configuran durante la validación inicial.</div>
          </div>
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:6}}>FORMATO</div>
        {formatosGrupos.map(grupo=>(
          <div key={grupo.label} style={{marginBottom:8}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:.6,marginBottom:4,textTransform:"uppercase"}}>{grupo.label}</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {grupo.items.map(([v,l])=>(
                <button key={v} onClick={()=>setEvalFormato(v)} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${evalFormato===v?C.accent:C.border}`,background:evalFormato===v?C.accentDim:"transparent",color:evalFormato===v?C.accent:C.muted,fontSize:11,cursor:"pointer",fontFamily:FONT,fontWeight:evalFormato===v?700:400}}>{l}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {skills.length>0&&(
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:6}}>SKILLS QUE EVALÚA</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {skills.map(s=>(<button key={s.id} onClick={()=>setEvalSkillIds(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p,s.id])} style={{padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",fontFamily:FONT,background:evalSkillIds.includes(s.id)?C.accent:C.surface,color:evalSkillIds.includes(s.id)?"#fff":C.muted,border:`1px solid ${evalSkillIds.includes(s.id)?C.accent:C.border}`}}>{s.nombre}</button>))}
          </div>
        </div>
      )}
      <input value={evalTitulo} onChange={e=>setEvalTitulo(e.target.value)} placeholder="Título de la evaluación" style={iS}/>
      <div style={{background:C.card,border:"1px solid #C85CE033",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,color:C.purple,letterSpacing:.8,marginBottom:6}}>✦ GENERAR CON IA</div>
        <div style={{display:"flex",gap:7,marginBottom:7}}>
          <input value={temaIA} onChange={e=>setTemaIA(e.target.value)} placeholder="Tema a evaluar..." style={{...iS,marginBottom:0,flex:1,fontSize:11}}/>
        </div>
        <div style={{display:"flex",gap:7,alignItems:"center"}}>
          {tienePreguntas&&<><span style={{fontSize:11,color:C.muted,flexShrink:0}}>Cantidad:</span><input type="number" min="1" max="20" value={cantIA} onChange={e=>setCantIA(Math.max(1,Math.min(20,parseInt(e.target.value)||4)))} style={{width:48,background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 7px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT,textAlign:"center"}}/></>}
          <button onClick={generarConIA} disabled={generandoIA||!temaIA.trim()} style={{marginLeft:"auto",background:"#C85CE022",border:"1px solid #C85CE044",borderRadius:8,color:C.purple,padding:"5px 14px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:700,opacity:!temaIA.trim()?0.5:1}}>{generandoIA?"Generando…":"✦ Generar"}</button>
        </div>
      </div>
      {esMC&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:.8}}>PREGUNTAS ({pregsMC.length}) <span style={{fontWeight:400,fontSize:9}}>— marcá todas las correctas</span></span>
            <button onClick={()=>setPregsMC(p=>[...p,{texto:"",opciones:["","","",""],correctas:new Set([0])}])} style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:7,color:C.accent,padding:"3px 9px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:700}}>+ Agregar</button>
          </div>
          {pregsMC.map((q,qi)=>(
            <div key={qi} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:12,marginBottom:8}}>
              <div style={{display:"flex",gap:7,marginBottom:8}}>
                <input value={q.texto} onChange={e=>setPregsMC(p=>p.map((x,i)=>i===qi?{...x,texto:e.target.value}:x))} placeholder={`Pregunta ${qi+1}`} style={{...iS,marginBottom:0,flex:1}}/>
                {pregsMC.length>1&&<button onClick={()=>setPregsMC(p=>p.filter((_,i)=>i!==qi))} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}
              </div>
              {q.opciones.map((op,oi)=>{const esCorrecta=q.correctas.has(oi);return(
                <div key={oi} style={{display:"flex",gap:7,alignItems:"center",marginBottom:5}}>
                  <button onClick={()=>toggleCorrecta(qi,oi)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${esCorrecta?C.success:C.border}`,background:esCorrecta?C.success:"transparent",cursor:"pointer",flexShrink:0,padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {esCorrecta&&<span style={{color:"#fff",fontSize:10,fontWeight:700,lineHeight:1}}>✓</span>}
                  </button>
                  <input value={op} onChange={e=>setPregsMC(p=>p.map((x,i)=>i===qi?{...x,opciones:x.opciones.map((o,j)=>j===oi?e.target.value:o)}:x))} placeholder={`Opción ${oi+1}${esCorrecta?" ✓":""}`} style={{...iS,marginBottom:0,flex:1,fontSize:11,borderColor:esCorrecta?C.success+"66":C.border}}/>
                </div>
              );})}
              <div style={{fontSize:10,color:C.muted,marginTop:3}}>■ = correcta (podés marcar varias)</div>
            </div>
          ))}
        </div>
      )}
      {esVF&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:.8}}>AFIRMACIONES ({pregsVF.length})</span>
            <button onClick={()=>setPregsVF(p=>[...p,{texto:"",correcta:0}])} style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:7,color:C.accent,padding:"3px 9px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:700}}>+ Agregar</button>
          </div>
          {pregsVF.map((q,qi)=>(
            <div key={qi} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:12,marginBottom:8}}>
              <div style={{display:"flex",gap:7,marginBottom:10}}>
                <input value={q.texto} onChange={e=>setPregsVF(p=>p.map((x,i)=>i===qi?{...x,texto:e.target.value}:x))} placeholder={`Afirmación ${qi+1}`} style={{...iS,marginBottom:0,flex:1}}/>
                {pregsVF.length>1&&<button onClick={()=>setPregsVF(p=>p.filter((_,i)=>i!==qi))} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}
              </div>
              <div style={{display:"flex",gap:8}}>
                {["Verdadero","Falso"].map((op,oi)=>(
                  <button key={oi} onClick={()=>setPregsVF(p=>p.map((x,i)=>i===qi?{...x,correcta:oi}:x))} style={{flex:1,padding:"8px",borderRadius:9,border:`2px solid ${q.correcta===oi?C.success:C.border}`,background:q.correcta===oi?(C.success+"18"):"transparent",color:q.correcta===oi?C.success:C.muted,fontSize:12,fontWeight:q.correcta===oi?700:400,cursor:"pointer",fontFamily:FONT}}>
                    {q.correcta===oi?"✓ ":""}{op}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {esDesarrollo&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:.8}}>PREGUNTAS ({pregsDesarrollo.length})</span>
            <button onClick={()=>setPregsDesarrollo(p=>[...p,{texto:"",criterios:""}])} style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:7,color:C.accent,padding:"3px 9px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:700}}>+ Agregar</button>
          </div>
          {pregsDesarrollo.map((q,qi)=>(
            <div key={qi} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:12,marginBottom:8}}>
              <div style={{display:"flex",gap:7,marginBottom:6}}>
                <input value={q.texto} onChange={e=>setPregsDesarrollo(p=>p.map((x,i)=>i===qi?{...x,texto:e.target.value}:x))} placeholder={`Pregunta ${qi+1}`} style={{...iS,marginBottom:0,flex:1}}/>
                {pregsDesarrollo.length>1&&<button onClick={()=>setPregsDesarrollo(p=>p.filter((_,i)=>i!==qi))} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}
              </div>
              <input value={q.criterios} onChange={e=>setPregsDesarrollo(p=>p.map((x,i)=>i===qi?{...x,criterios:e.target.value}:x))} placeholder="Criterios de corrección (opcional)" style={{...iS,marginBottom:0,fontSize:11}}/>
            </div>
          ))}
        </div>
      )}
      {esReflexion&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:.8}}>PREGUNTAS DE REFLEXIÓN ({pregsReflexion.length})</span>
            <button onClick={()=>setPregsReflexion(p=>[...p,{texto:""}])} style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:7,color:C.accent,padding:"3px 9px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:700}}>+ Agregar</button>
          </div>
          {pregsReflexion.map((q,qi)=>(
            <div key={qi} style={{display:"flex",gap:7,marginBottom:7}}>
              <input value={q.texto} onChange={e=>setPregsReflexion(p=>p.map((x,i)=>i===qi?{texto:e.target.value}:x))} placeholder={`Pregunta ${qi+1}`} style={{...iS,marginBottom:0,flex:1}}/>
              {pregsReflexion.length>1&&<button onClick={()=>setPregsReflexion(p=>p.filter((_,i)=>i!==qi))} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}
            </div>
          ))}
        </div>
      )}
      {esPractica&&(
        <div>
          <div style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:.8,marginBottom:6}}>CONSIGNA</div>
          <textarea value={consigna} onChange={e=>setConsigna(e.target.value)} placeholder="Describí qué tiene que hacer el alumno..." style={{...iS,minHeight:80,resize:"vertical"}}/>
          <div style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:.8,marginBottom:6,marginTop:4}}>CRITERIOS DE EVALUACIÓN</div>
          {criterios.map((cr,ci)=>(<div key={ci} style={{display:"flex",gap:7,marginBottom:6}}><input value={cr} onChange={e=>setCriterios(p=>p.map((x,i)=>i===ci?e.target.value:x))} placeholder={`Criterio ${ci+1}`} style={{...iS,marginBottom:0,flex:1,fontSize:11}}/>{criterios.length>1&&<button onClick={()=>setCriterios(p=>p.filter((_,i)=>i!==ci))} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}</div>))}
          <button onClick={()=>setCriterios(p=>[...p,""])} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,color:C.muted,padding:"3px 9px",cursor:"pointer",fontSize:11,fontFamily:FONT,marginBottom:8}}>+ Criterio</button>
        </div>
      )}
      {esSubida&&(
        <div>
          <div style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:.8,marginBottom:6}}>CONSIGNA</div>
          <textarea value={consigna} onChange={e=>setConsigna(e.target.value)} placeholder="Describí qué tiene que subir el alumno..." style={{...iS,minHeight:70,resize:"vertical"}}/>
          <div style={{background:"#5CA8E015",border:"1px solid #5CA8E033",borderRadius:9,padding:"10px 12px",fontSize:12,color:C.info,marginBottom:8}}>📎 Los alumnos podrán subir un archivo {evalFormato==="imagen"?"de imagen":evalFormato==="audio"?"de audio":"de video"}.</div>
          <div style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:.8,marginBottom:6}}>CRITERIOS DE EVALUACIÓN</div>
          {criterios.map((cr,ci)=>(<div key={ci} style={{display:"flex",gap:7,marginBottom:6}}><input value={cr} onChange={e=>setCriterios(p=>p.map((x,i)=>i===ci?e.target.value:x))} placeholder={`Criterio ${ci+1}`} style={{...iS,marginBottom:0,flex:1,fontSize:11}}/>{criterios.length>1&&<button onClick={()=>setCriterios(p=>p.filter((_,i)=>i!==ci))} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}</div>))}
          <button onClick={()=>setCriterios(p=>[...p,""])} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,color:C.muted,padding:"3px 9px",cursor:"pointer",fontSize:11,fontFamily:FONT,marginBottom:8}}>+ Criterio</button>
        </div>
      )}
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <button onClick={guardar} disabled={saving||!evalTitulo.trim()} style={{background:tipoColor[evalTipo]||C.accent,border:"none",borderRadius:9,color:"#fff",padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,flex:1,opacity:!evalTitulo.trim()?0.5:1}}>{saving?"Guardando...":"Guardar evaluación ✓"}</button>
        <button onClick={onCancel} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"9px 14px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>Cancelar</button>
      </div>
    </div>
  );
}


// ─── CURSO PAGE ───────────────────────────────────────────────────────────────
function CursoPage({post,session,onClose,onUpdatePost}){
  const [contenido,setContenido]=useState([]);const [loading,setLoading]=useState(true);
  const [inscripcion,setInscripcion]=useState(null);const [inscripciones,setInscripciones]=useState([]);const [inscLoading,setInscLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);const [showQuizCreator,setShowQuizCreator]=useState(false);const [expandedQuizzes,setExpandedQuizzes]=useState(new Set());
  const [editingQuiz,setEditingQuiz]=useState(null);
  const [mensajesNuevos,setMensajesNuevos]=useState(0);
  const [showDiagnostico,setShowDiagnostico]=useState(false);
  const [showExamenFinal,setShowExamenFinal]=useState(()=>false);
  const [tabActivo,setTabActivo]=useState(()=>{if(post._openValidacion)return"evaluaciones";try{return sessionStorage.getItem("curso_tab_"+post.id)||"contenido";}catch{return "contenido";}});
  const setTab=(t)=>{try{sessionStorage.setItem("curso_tab_"+post.id,t);}catch{}if(t==="chat"){setMensajesNuevos(0);try{sessionStorage.setItem("chat_seen_"+post.id,Date.now());}catch{}}setTabActivo(t);};const [nuevoTipo,setNuevoTipo]=useState("video");const [nuevoTitulo,setNuevoTitulo]=useState("");const [nuevoUrl,setNuevoUrl]=useState("");const [nuevoTexto,setNuevoTexto]=useState("");const [savingC,setSavingC]=useState(false);
  const [calExpanded,setCalExpanded]=useState(false);const [showEditCal,setShowEditCal]=useState(false);const [showFinalizar,setShowFinalizar]=useState(false);const [showDenuncia,setShowDenuncia]=useState(false);const [showCerrarInsc,setShowCerrarInsc]=useState(false);const [localFinalizado,setLocalFinalizado]=useState(!!post.finalizado);const [localCerrado,setLocalCerrado]=useState(!!post.inscripciones_cerradas);const refreshPost=async()=>{try{const pubs=await sb.getMisPublicaciones(post.autor_email,session.access_token);const fresh=pubs.find(p=>p.id===post.id);if(fresh&&onUpdatePost)onUpdatePost(fresh);}catch{}};
  const esMio=post.autor_email===session.user.email||post.autor_id===session.user.id;const miEmail=session.user.email;const miUid=session.user.id;
  const [needsValoracion,setNeedsValoracion]=useState(false);
  // ayudantes es uuid[] — comparar con el UUID del usuario actual
  const esAyudante=(post.ayudantes||[]).includes(miUid);
  // Resolver UUIDs→emails para ChatCurso (que trabaja con emails en mensajes)
  const [ayudanteEmails,setAyudanteEmails]=useState([]);
  useEffect(()=>{
    const uids=post.ayudantes||[];
    if(!uids.length){setAyudanteEmails([]);return;}
    Promise.all(uids.map(uid=>sb.getUsuarioById(uid,session.access_token))).then(results=>{
      setAyudanteEmails(results.filter(Boolean).map(u=>u.email));
    }).catch(()=>{});
  },[post.id]);// eslint-disable-line
  const pageRef=useRef(null);
  useEffect(()=>{
    if(pageRef.current)pageRef.current.scrollTop=0;
    Promise.all([sb.getContenido(post.id,session.access_token),sb.getMisInscripciones(miEmail,session.access_token),(esMio||esAyudante)?sb.getInscripciones(post.id,session.access_token):Promise.resolve([])]).then(([cont,misIns,todos])=>{
      setContenido(cont);const miInsc=misIns.find(i=>i.publicacion_id===post.id)||null;setInscripcion(miInsc);if(esMio||esAyudante)setInscripciones(todos);
      if(miInsc?.clase_finalizada&&!miInsc?.valorado)setNeedsValoracion(true);
    }).finally(()=>{setLoading(false);setInscLoading(false);});
  },[post.id,miEmail,esMio,session]);
  const inscribirse=async()=>{
    if(post.sinc==="sinc"&&post.clases_sinc&&typeof post.clases_sinc==="string"){
      try{
        const misIns=await sb.getMisInscripciones(miEmail,session.access_token).catch(()=>[]);
        const otrasIds=misIns.filter(i=>i.publicacion_id!==post.id).map(i=>i.publicacion_id);
        if(otrasIds.length>0){
          const otras=await sb.getPublicacionesByIds(otrasIds,session.access_token).catch(()=>[]);
          let nuevas=[];try{nuevas=JSON.parse(post.clases_sinc);}catch{}
          const choques=[];
          otras.forEach(otra=>{
            if(otra.sinc!=="sinc"||!otra.clases_sinc)return;
            let otraClases=[];try{otraClases=JSON.parse(otra.clases_sinc);}catch{}
            nuevas.forEach(nc=>{otraClases.forEach(oc=>{
              if(nc.dia===oc.dia){
                const toM=(t)=>{const[h,m]=(t||"00:00").split(":").map(Number);return h*60+m;};
                if(toM(nc.hora_inicio)<toM(oc.hora_fin)&&toM(nc.hora_fin)>toM(oc.hora_inicio))
                  choques.push(`"${otra.titulo}" (${nc.dia} ${oc.hora_inicio}-${oc.hora_fin})`);
              }
            });});
          });
          if(choques.length>0){
            const ok=window.confirm("⚠️ Esta clase se pisa con:\n"+choques.slice(0,3).join("\n")+"\n\n¿Querés inscribirte igual?");
            if(!ok)return;
          }
        }
      }catch{}
    }
    setInscLoading(true);
    try{const r=await sb.insertInscripcion({publicacion_id:post.id,alumno_id:session.user.id,alumno_email:miEmail},session.access_token);setInscripcion(r[0]);sb.insertNotificacion({usuario_id:null,alumno_email:post.autor_email,tipo:"nueva_inscripcion",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      // Si el curso tiene diagnóstico inicial, ir al tab notas automáticamente
      if(post.modo==="grupal"||post.modo==="curso")setTimeout(()=>setTab("notas"),400);
    }finally{setInscLoading(false);}
  };
  const [desinscMsg,setDesinscMsg]=useState(false);
  // Mostrar examen final si el curso se finalizó y el alumno no lo rindió
  useEffect(()=>{if(post.finalizado&&inscripcion&&!esMio&&!esAyudante){setShowExamenFinal(true);}},[post.finalizado,inscripcion?.id]);// eslint-disable-line
  const desinscribirse=async()=>{
    if(!inscripcion)return;
    setInscLoading(true);
    try{
      await sb.deleteInscripcion(inscripcion.id,session.access_token);
      setInscripcion(null);
      setDesinscMsg(true);
      setTimeout(()=>onClose(),2200);
    }finally{setInscLoading(false);}
  };
  const addContenido=async()=>{
    if(!nuevoTitulo.trim())return;
    setSavingC(true);
    try{
      const data={publicacion_id:post.id,tipo:nuevoTipo,titulo:nuevoTitulo,orden:contenido.length+1};
      if(nuevoTipo!=="texto"&&nuevoTipo!=="aviso"&&nuevoTipo!=="tarea")data.url=nuevoUrl;
      else data.texto=nuevoTexto;
      const r=await sb.insertContenido(data,session.access_token);
      setContenido(prev=>[...prev,r[0]]);
      setNuevoTitulo("");setNuevoUrl("");setNuevoTexto("");setShowAdd(false);
      // Notificar a todos los inscriptos
      inscripciones.forEach(ins=>{
        if(ins.alumno_email&&ins.alumno_email!==miEmail)
          sb.insertNotificacion({usuario_id:null,alumno_email:ins.alumno_email,tipo:"nuevo_contenido",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      });
      // Notificar también a los co-docentes (no al que lo agregó)
      ayudanteEmails.forEach(e=>{
        if(e&&e!==miEmail)
          sb.insertNotificacion({usuario_id:null,alumno_email:e,tipo:"nuevo_contenido",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      });
    }catch(e){
      alert("Error al guardar: "+e.message+"\n\nSi sos co-docente, asegurate de que la RLS de contenido_curso permita inserción a co-docentes.");
    }finally{setSavingC(false);}
  };
  const removeContenido=async(id)=>{await sb.deleteContenido(id,session.access_token);setContenido(prev=>prev.filter(c=>c.id!==id));};
  const tieneAcceso=esMio||esAyudante||!!inscripcion;const duracion=calcDuracion(post.fecha_inicio,post.fecha_fin);const hasCal=post.sinc==="sinc"&&post.clases_sinc;
  const esPendienteValidacion=(esMio||esAyudante)&&(post.activo===false||post.estado_validacion==="pendiente");
  // Gate: if not owner and not inscribed, show access wall
  if(!tieneAcceso&&!loading&&!inscLoading){
    const cerrado=localCerrado||post.inscripciones_cerradas;
    return(<div style={{position:"fixed",inset:0,background:C.bg,zIndex:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:FONT,gap:16,padding:24}}>
      <button onClick={onClose} style={{position:"absolute",top:20,left:20,background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>← Volver</button>
      <div style={{fontSize:48,marginBottom:8,color:C.muted,fontWeight:300}}>·</div>
      <h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:0}}>{cerrado?"Inscripciones cerradas":"Contenido restringido"}</h2>
      <p style={{color:C.muted,fontSize:14,textAlign:"center",maxWidth:360,margin:0}}>{cerrado?"El docente ya cerró las inscripciones para este curso.":"Inscribite gratis para acceder a todo el contenido."}</p>
      {!cerrado&&(inscLoading?<Spinner/>:<Btn onClick={inscribirse} variant="success" style={{padding:"10px 28px",fontSize:14}}>Inscribirme gratis →</Btn>)}
      <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:13,cursor:"pointer",fontFamily:FONT}}>Volver atrás</button>
    </div>);
  }
  const iS={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:8};
  return(
    <div  ref={pageRef} style={{position:"fixed",inset:0,background:C.bg,zIndex:300,overflowY:"auto",fontFamily:FONT}}>
      <div style={{position:"sticky",top:0,zIndex:10,background:C.sidebar,borderBottom:`1px solid ${C.border}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <button onClick={onClose} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>← Volver</button>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:C.text,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.titulo}</div><div style={{fontSize:11,color:C.muted}}>{post.materia} · {post.autor_nombre||safeDisplayName(post.autor_nombre,post.autor_email)}</div></div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {esMio&&!localFinalizado&&!localCerrado&&<button onClick={()=>setShowCerrarInsc(true)} style={{background:"#E0955C15",border:"1px solid #E0955C33",borderRadius:9,color:C.warn,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:600}}>Cerrar inscripciones</button>}
          {esMio&&!localFinalizado&&localCerrado&&<button onClick={async()=>{try{await sb.updatePublicacion(post.id,{inscripciones_cerradas:false},session.access_token);post.inscripciones_cerradas=false;post.inscripcionesCerradas=false;setLocalCerrado(false);if(onUpdatePost)onUpdatePost({...post,inscripciones_cerradas:false});}catch(e){alert("Error: "+e.message);}}} style={{background:"#4ECB7115",border:"1px solid #4ECB7133",borderRadius:9,color:C.success,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:600}}>Reabrir inscripciones</button>}
          {(esMio||esAyudante)&&!localFinalizado&&<button onClick={()=>setShowFinalizar(true)} style={{background:"#4ECB7122",border:"1px solid #4ECB7144",borderRadius:9,color:C.success,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:600}}>Finalizar clase</button>}
          {localFinalizado&&(esMio||esAyudante)&&<span style={{fontSize:12,color:C.info,fontWeight:600}}>Clase finalizada</span>}
          {!esMio&&inscripcion&&<button onClick={()=>setShowDenuncia(true)} style={{background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:9,color:C.danger,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>Denunciar</button>}
          {esMio?<span style={{fontSize:12,color:C.muted}}>Sos el docente</span>:
            esAyudante?<span style={{fontSize:12,color:C.purple,fontWeight:600}}>✦ Co-docente</span>:(
            inscLoading?<Spinner small/>:(
              localFinalizado?<span style={{fontSize:12,color:C.info}}>Clase finalizada</span>:
              localCerrado?<span style={{fontSize:12,color:C.muted}}>Inscripciones cerradas</span>:
              inscripcion?<button onClick={desinscribirse} style={{background:"none",border:`1px solid ${C.danger}`,borderRadius:9,color:C.danger,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>Desinscribirme</button>
              :(localCerrado||post.inscripciones_cerradas)?<span style={{fontSize:12,color:C.muted}}>Inscripciones cerradas</span>
              :<Btn onClick={inscribirse} variant="success" style={{padding:"7px 14px",fontSize:12}}>Inscribirme gratis →</Btn>
            )
          )}
        </div>
      </div>
      {desinscMsg&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"32px 40px",textAlign:"center",maxWidth:340}}>
            
            <div style={{fontWeight:700,color:C.text,fontSize:16,marginBottom:6}}>Desinscripto correctamente</div>
            <div style={{color:C.muted,fontSize:13}}>Ya no tenés acceso al contenido de esta clase.</div>
            <div style={{marginTop:14,fontSize:12,color:C.muted}}>Volviendo al inicio...</div>
          </div>
        </div>
      )}
      {post.banner_url&&<div style={{width:"100%",height:"min(220px,30vw)",overflow:"hidden",flexShrink:0}}><img src={post.banner_url} alt="banner" onError={e=>e.target.parentElement.style.display='none'} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
      {needsValoracion&&(
        <div style={{background:"linear-gradient(135deg,#F5C84220,#F5C84210)",border:`1px solid ${C.accent}44`,margin:"16px 20px",borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:24}}></span>
          <div style={{flex:1}}><div style={{color:C.accent,fontWeight:700,fontSize:14,marginBottom:2}}>¡El docente marcó las clases como finalizadas!</div><div style={{color:C.muted,fontSize:12}}>Contanos tu experiencia.</div></div>
          <a href="#resenas" style={{background:C.accent,color:"#fff",borderRadius:9,padding:"7px 14px",fontSize:12,fontWeight:700,textDecoration:"none"}}>Valorar →</a>
        </div>
      )}
      <div style={{maxWidth:900,margin:"0 auto",padding:"16px 20px"}}>
        <SafeWrapper>
        <div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:18}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}><Tag tipo={post.tipo}/>{post.verificado&&<VerifiedBadge/>}{post.sinc&&<span style={{fontSize:11,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"2px 8px",color:C.muted}}>{post.sinc==="sinc"?"Sincrónico":"Asincrónico"}</span>}</div>
            <p style={{color:C.muted,fontSize:13,lineHeight:1.7,marginBottom:post.requisitos?6:12}}>{post.descripcion}</p>
            {post.requisitos&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 12px",marginBottom:12,fontSize:12,color:C.muted}}><span style={{fontWeight:600,color:C.text}}>Requisitos: </span>{post.requisitos}</div>}
            <div style={{display:"flex",gap:9,flexWrap:"wrap"}}><Chip label="MODALIDAD" val={post.modo==="curso"?"Curso":"Clase particular"}/>{post.modalidad&&<Chip label="FORMATO" val={post.modalidad==="presencial"?"📍 Presencial":post.modalidad==="virtual"?"🌐 Virtual":post.modalidad==="mixto"?"⟳ Mixto":post.modalidad}/>}{duracion&&<Chip label="DURACIÓN" val={duracion}/>}{post.fecha_inicio&&<Chip label="INICIO" val={fmt(post.fecha_inicio)}/>}{post.fecha_fin&&<Chip label="FIN" val={fmt(post.fecha_fin)}/>}</div>
          </div>
          {!esMio&&inscripcion&&(<div style={{background:"#4ECB7115",border:`1px solid #4ECB7133`,borderRadius:12,padding:"12px 16px",marginBottom:18}}>
            <div style={{color:C.success,fontWeight:600,fontSize:13}}>✓ Estás inscripto</div>
            <div style={{color:C.muted,fontSize:12,marginTop:2}}>Inscripto el {fmt(inscripcion.created_at)}</div>
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
                      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{fontSize:10,color:C.muted}}>{safeDisplayName(null,ins.alumno_email)}</div><button onClick={()=>navigator.clipboard?.writeText(ins.alumno_email)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:10,padding:0}} title="Copiar email">⎘</button></div>
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
          {/* ── TABS ── */}
          <div style={{display:"flex",gap:2,marginBottom:14,background:C.card,borderRadius:12,padding:4,border:`1px solid ${C.border}`}}>
            {[
              {id:"contenido",label:"📁 Contenido"},
              ...(post.tipo==="oferta"&&(esMio||esAyudante)?[
                {id:"evaluaciones",label:"🎓 Evaluaciones",pendiente:esPendienteValidacion},
                {id:"notas",label:"📊 Notas"},
              ]:[]),
              ...(hasCal?[{id:"calendario",label:"📅 Calendario"}]:[]),
              {id:"foro",label:"🗣 Foro"},
              {id:"chat",label:mensajesNuevos>0?`💬 Chat (${mensajesNuevos})`:"💬 Chat"},
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setTab(tab.id)}
                style={{flex:1,padding:"7px 4px",borderRadius:9,border:tab.pendiente?`1.5px solid ${C.accent}`:"none",
                  fontWeight:tabActivo===tab.id?700:400,fontSize:11,cursor:"pointer",fontFamily:FONT,
                  background:tabActivo===tab.id?C.accent:tab.pendiente?"#F5C84212":"transparent",
                  color:tabActivo===tab.id?"#fff":tab.pendiente?C.accent:C.muted,
                  transition:"all .15s",
                  animation:tab.pendiente&&tabActivo!==tab.id?"tabPulse 1.8s ease-in-out infinite":undefined}}>
                {tab.label}{tab.pendiente&&tabActivo!==tab.id?" ●":""}
              </button>
            ))}
          </div>

          {/* ── TAB: Contenido ── */}
          {tabActivo==="contenido"&&<>
          {(esMio||esAyudante)&&<SkillManager post={post} session={session}/>}
          <div id="contenido" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontWeight:700,color:C.text,fontSize:14}}>Contenido <span style={{color:C.muted,fontWeight:400,fontSize:12}}>({contenido.filter(c=>c.tipo!=="quiz").length})</span></div>
              {(esMio||esAyudante)&&<div style={{display:"flex",gap:6}}><button onClick={()=>setShowAdd(v=>!v)} style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:8,color:C.accent,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:600}}>+ Agregar</button></div>}
            </div>
            {(esMio||esAyudante)&&showQuizCreator&&(
              <QuizCreator publicacionId={post.id} session={session} onSaved={(item)=>{setContenido(prev=>[...prev,item]);setShowQuizCreator(false);}} onCancel={()=>setShowQuizCreator(false)}/>
            )}
            {(esMio||esAyudante)&&showAdd&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:14}}>
                <div style={{display:"flex",gap:5,marginBottom:9,flexWrap:"wrap"}}>
                  {[["video","🎬"],["archivo","📁"],["texto","📝"],["aviso","📢"],["tarea","📌"],["link","🔗"],["quiz","📝"]].map(([v,ic])=>(<button key={v} onClick={()=>setNuevoTipo(v)} style={{padding:"6px 9px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",background:nuevoTipo===v?C.accent:C.surface,color:nuevoTipo===v?"#fff":C.muted,border:`1px solid ${nuevoTipo===v?"transparent":C.border}`,fontFamily:FONT}}>{ic} {v}</button>))}
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
                  if(c.tipo==="quiz"){return null;}// Quizzes van en tab Exámenes
                  return(<div key={c.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 15px",opacity:tieneAcceso?1:.6}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:9}}>
                      <div style={{display:"flex",alignItems:"center",gap:9,flex:1,minWidth:0}}>
                        <div style={{width:34,height:34,borderRadius:9,background:C.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,border:`1px solid ${C.border}`}}>{t.icon}</div>
                        <div style={{minWidth:0,flex:1}}>
                          <div style={{fontWeight:600,color:t.color,fontSize:13,marginBottom:2}}>{i+1}. {c.titulo}</div>
                          {c.tipo==="texto"&&c.texto&&tieneAcceso&&<p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.5}}>{c.texto}</p>}
                          {c.tipo==="aviso"&&c.texto&&<p style={{color:C.accent,fontSize:12,margin:0,background:C.accentDim,borderRadius:7,padding:"6px 9px"}}>{c.texto}</p>}
                          {c.tipo==="tarea"&&c.texto&&tieneAcceso&&<p style={{color:C.purple,fontSize:12,margin:0,background:"#C85CE015",borderRadius:7,padding:"6px 9px"}}>{c.texto}</p>}
                          {(c.tipo==="video"||c.tipo==="archivo"||c.tipo==="link")&&c.url&&tieneAcceso&&<a href={c.url} target="_blank" rel="noreferrer" style={{color:C.info,fontSize:12,textDecoration:"none"}}>{c.tipo==="video"?"▶ Ver video":c.tipo==="archivo"?"📥 Abrir":"→ Link"}</a>}
                          {!tieneAcceso&&<div style={{color:C.muted,fontSize:11,marginTop:2}}>Inscribite para ver</div>}
                          {(esMio||esAyudante)&&editingContenidoId===c.id&&(
                            <InlineContenidoEditor item={c} session={session} onSaved={(updated)=>{setContenido(prev=>prev.map(x=>x.id===c.id?{...x,...updated}:x));setEditingContenidoId(null);}} onCancel={()=>setEditingContenidoId(null)}/>
                          )}
                        </div>
                      </div>
                      {(esMio||esAyudante)&&<div style={{display:"flex",gap:5,flexShrink:0}}>
                        <button onClick={()=>setEditingContenidoId(editingContenidoId===c.id?null:c.id)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,color:C.muted,fontSize:11,padding:"2px 8px",cursor:"pointer",fontFamily:FONT}}>✎</button>
                        <button onClick={()=>removeContenido(c.id)} style={{background:"none",border:"none",color:C.danger,fontSize:15,cursor:"pointer"}}>×</button>
                      </div>}
                    </div>
                  </div>);
                })}
              </div>
            )}
          </div>
          </>
}

          {/* ── TAB: Evaluaciones (fusionado: validación + formales + quizzes) ── */}
          {tabActivo==="evaluaciones"&&<div style={{marginBottom:18}}>
            {/* Wizard si pendiente validación */}
            {esPendienteValidacion&&(
              <div style={{marginBottom:18}}>
                <div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>⏳</span>
                  <div><div style={{fontWeight:700,color:C.accent,fontSize:13}}>Validación pendiente</div><div style={{color:C.muted,fontSize:12}}>Completá el proceso para activar tu publicación.</div></div>
                </div>
                <ValidacionWizard post={post} session={session} onValidado={()=>{if(onUpdatePost)onUpdatePost({...post,activo:true,estado_validacion:"validado"});}}/>
              </div>
            )}
            {/* Evaluaciones formales + quizzes */}
            {!esPendienteValidacion&&(
              <EvaluacionesFormalesConQuizzes
                post={post} session={session} esMio={esMio} esAyudante={esAyudante}
                inscripcion={inscripcion} inscripciones={inscripciones}
                contenido={contenido} setContenido={setContenido}
                expandedQuizzes={expandedQuizzes} setExpandedQuizzes={setExpandedQuizzes}
                editingQuiz={editingQuiz} setEditingQuiz={setEditingQuiz}
                tieneAcceso={tieneAcceso}
              />
            )}
          </div>}

          {/* ── TAB: Notas ── */}
          {tabActivo==="notas"&&<div style={{marginBottom:18}}>
            {(esMio||esAyudante)?(
              contenido.some(c=>c.tipo==="quiz")&&inscripciones.length>0
                ?<><SafeWrapper><TablaNotas contenido={contenido} inscripciones={inscripciones} session={session} publicacionId={post.id}/></SafeWrapper>
                <SkillOverview post={post} session={session} inscripciones={inscripciones}/></>
                :<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"30px",textAlign:"center",color:C.muted,fontSize:13}}>
                    {!contenido.some(c=>c.tipo==="quiz")?"Todavía no hay exámenes cargados.":"Todavía no hay alumnos inscriptos."}
                  </div>
            ):(
              /* Vista alumno: solo sus propias notas */
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px"}}>
                <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:14}}>Mis notas</div>
                {loading?<Spinner small/>:contenido.filter(c=>c.tipo==="quiz").length===0
                  ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No hay exámenes en este curso.</div>
                  :<>
                  <SafeWrapper><NotasAlumno contenido={contenido} session={session} publicacionId={post.id}/></SafeWrapper>
                  <NotasPad publicacionId={post.id} session={session}/>
                  <CertificadoBtn post={post} session={session} inscripcion={inscripcion}/>
                  <DiagnosticoInicial post={post} session={session} skills={getSkills(post.id)}/>
                  <SkillProgressViewer post={post} session={session}/>
                </>
                }
              </div>
            )}
          </div>}

          {/* ── TAB: Calendario ── */}
          {tabActivo==="calendario"&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontWeight:700,color:C.text,fontSize:15}}>Calendario de clases</div>
              {esMio&&<button onClick={()=>setShowEditCal(true)} style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:8,color:C.accent,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:600}}>Editar horarios</button>}
            </div>
            {hasCal?<CalendarioCurso post={post} compact={false}/>:<div style={{textAlign:"center",padding:"40px 0",color:C.muted,fontSize:13}}>{esMio?"No cargaste horarios aún. Hacé click en Editar horarios para empezar.":"Este curso no tiene horarios definidos."}</div>}
          </div>}

          {/* ── TAB: Foro ── */}
          {tabActivo==="foro"&&<div style={{marginBottom:18}}>
            {tieneAcceso
              ?<ForoCurso post={post} session={session} esMio={esMio} esAyudante={esAyudante}/>
              :<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"30px",textAlign:"center",color:C.muted,fontSize:13}}>Inscribite para participar en el foro.</div>
            }
          </div>}

          {/* ── TAB: Chat ── */}
          {tabActivo==="chat"&&<div style={{marginBottom:18}}>
            {tieneAcceso
              ?<ChatCurso post={post} session={session} ayudantes={post.ayudantes||[]} ayudanteEmails={ayudanteEmails} onNewMessages={(n)=>{if(tabActivo!=="chat")setMensajesNuevos(prev=>prev+n);}}/>
              :<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"30px",textAlign:"center",color:C.muted,fontSize:13}}>Inscribite para acceder al chat grupal.</div>
            }
          </div>}

          <div id="resenas" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px"}}>
            <ReseñasSeccion post={post} session={session} inscripcion={inscripcion} esMio={esMio}/>
          </div>
        </div>
        </SafeWrapper>

      </div>
      {showDiagnostico&&<DiagnosticoModal post={post} session={session} onClose={()=>{setShowDiagnostico(false);setTab("contenido");}}/> }
      {showExamenFinal&&<ExamenFinalModal post={post} session={session} onClose={()=>setShowExamenFinal(false)}/>}
      {calExpanded&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setCalExpanded(false)}><div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"28px",width:"min(780px,96vw)",maxHeight:"92vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><h3 style={{color:C.text,margin:0,fontSize:18}}>Calendario de clases</h3><button onClick={()=>setCalExpanded(false)} style={{background:"none",border:"none",color:C.muted,fontSize:24,cursor:"pointer"}}>×</button></div><CalendarioCurso post={post}/></div></div>)}
      {showFinalizar&&<FinalizarClaseModal post={post} session={session} onClose={()=>setShowFinalizar(false)} onFinalizado={()=>{setLocalFinalizado(true);refreshPost();}}/>}
      {showEditCal&&<EditCalModal post={post} session={session} onClose={()=>setShowEditCal(false)} onSaved={(newClases)=>{post.clases_sinc=JSON.stringify(newClases);post.sinc="sinc";if(onUpdatePost)onUpdatePost({...post,clases_sinc:JSON.stringify(newClases),sinc:"sinc"});setShowEditCal(false);}}/>}
      {showDenuncia&&<DenunciaModal post={post} session={session} onClose={()=>setShowDenuncia(false)}/>}
      {editingQuiz&&<Modal onClose={()=>setEditingQuiz(null)} width="min(680px,97vw)"><div style={{padding:"4px"}}><QuizEditor item={editingQuiz} session={session} onSaved={(updated)=>{setContenido(prev=>prev.map(x=>x.id===editingQuiz.id?{...x,...updated}:x));setEditingQuiz(null);}} onClose={()=>setEditingQuiz(null)}/></div></Modal>}
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
      sb.insertNotificacion({usuario_id:null,alumno_email:post.autor_email,tipo:"nueva_inscripcion",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      setOk(true);
      setTimeout(()=>onDone(),700);
    }catch(e){
      if(e.message?.includes("uq_inscripcion")){onDone();}// ya inscripto
      else alert("Error: "+e.message);
    }finally{setLoading(false);}
  };
  if(ok)return<span style={{fontSize:12,color:C.success,fontWeight:700}}>✓ Inscripto</span>;
  return<button onClick={inscribirse} disabled={loading} style={{background:"#4ECB7122",color:C.success,border:"1px solid #4ECB7144",borderRadius:11,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT}}>{loading?"...":"Inscribirme gratis"}</button>;
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
// ─── DETAIL PAGE — pantalla completa estilo Airbnb (reemplaza el popup) ──────
function DetailModal({post,session,onClose,onChat,onOpenCurso,onOpenPerfil}){
  const [reseñas,setReseñas]=useState([]);const [reseñasUsuario,setReseñasUsuario]=useState([]);const [loading,setLoading]=useState(true);
  const [inscripcion,setInscripcion]=useState(null);const [puedeChat,setPuedeChat]=useState(false);const [miOfertaPendiente,setMiOfertaPendiente]=useState(false);
  const nombre=post.autor_nombre||sb.getDisplayName(post.autor_email)||safeDisplayName(post.autor_nombre,post.autor_email)||"Usuario";
  const esMio=post.autor_email===session.user.email;
  const esAyudante=(post.ayudantes||[]).includes(session.user.id);

  useEffect(()=>{
    // Bloquear scroll del body mientras la página está abierta
    document.body.style.overflow="hidden";
    try{sb.incrementarVistas(post.id,session.access_token);}catch{}
    Promise.all([
      sb.getReseñas(post.id,session.access_token),
      sb.getReseñasByAutor(post.autor_email,session.access_token),
      sb.getMisInscripciones(session.user.email,session.access_token),
      post.tipo==="busqueda"&&!esMio?sb.getMisOfertas(session.user.email,session.access_token).catch(()=>[]):Promise.resolve([])
    ]).then(([pub,usr,ins,misOfertas])=>{
      setReseñas(pub);setReseñasUsuario(usr);
      const insc=ins.find(i=>i.publicacion_id===post.id)||null;
      setInscripcion(insc);
      if(post.tipo==="busqueda"){
        const miOfertaEsta=misOfertas.filter(o=>o.busqueda_id===post.id);
        setMiOfertaPendiente(!!miOfertaEsta.find(o=>o.estado==="pendiente"));
        setPuedeChat(!!miOfertaEsta.find(o=>o.estado==="aceptada"));
      }else{setPuedeChat(!!insc);}
    }).finally(()=>setLoading(false));
    return()=>{document.body.style.overflow="";};
  },[post.id,post.autor_email,post.tipo,session]);// eslint-disable-line

  const avgPub=calcAvg(reseñas);const avgUser=calcAvg(reseñasUsuario);

  return(
    <div style={{position:"fixed",inset:0,zIndex:200,background:C.bg,display:"flex",flexDirection:"column",fontFamily:FONT,overflowY:"auto",WebkitOverflowScrolling:"touch",animation:"fadeIn .18s ease"}}>

      {/* ── Barra superior ── */}
      <div style={{position:"sticky",top:0,zIndex:10,background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 20px",height:60,display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 8px rgba(0,0,0,.06)"}}>
        <button onClick={onClose}
          style={{width:38,height:38,borderRadius:"50%",background:C.bg,border:`1px solid ${C.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:C.text,flexShrink:0,transition:"background .15s",marginRight:4}}
          onMouseEnter={e=>e.currentTarget.style.background=C.border}
          onMouseLeave={e=>e.currentTarget.style.background=C.bg}>←</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,color:C.text,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.titulo}</div>
          <div style={{fontSize:12,color:C.muted}}>{post.materia}{post.tipo==="busqueda"?" · Búsqueda":""}</div>
        </div>
        <div style={{display:"flex",gap:8,flexShrink:0}}>
          <ShareBtn post={post} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 12px",fontSize:12}}/>
          <FavBtn post={post} session={session} onFavChange={()=>{}}/>
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div style={{flex:1,maxWidth:900,margin:"0 auto",width:"100%",padding:"0 0 100px"}}>

        {/* ── HERO: avatar + título + meta ── */}
        <div style={{padding:"24px 20px 0"}}>
          {/* Título principal */}
          <h1 style={{color:C.text,fontSize:"clamp(22px,4vw,30px)",fontWeight:800,margin:"0 0 8px",lineHeight:1.2,letterSpacing:"-.3px"}}>{post.titulo}</h1>

          {/* Valoración + materia + tags */}
          <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:16}}>
            {avgPub?<span style={{fontSize:13,color:"#B45309",fontWeight:600}}>★ {parseFloat(avgPub).toFixed(1)} <span style={{color:C.muted,fontWeight:400}}>({reseñas.length} reseña{reseñas.length!==1?"s":""})</span></span>:null}
            {post.materia&&<span style={{fontSize:13,color:C.muted}}>· {post.materia}</span>}
            {post.verificado&&<VerifiedBadge/>}
            <Tag tipo={post.tipo}/>
          </div>

          {/* Separador */}
          <div style={{height:1,background:C.border,margin:"0 0 24px"}}/>
        </div>

        {/* ── Layout principal: contenido izquierdo + caja flotante derecha ── */}
        <div style={{display:"flex",gap:32,alignItems:"flex-start",padding:"0 20px",flexWrap:"wrap"}}>

          {/* ─ Columna izquierda ─ */}
          <div style={{flex:"1 1 340px",minWidth:0}}>

            {/* Autor */}
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${C.border}`}}>
              <button onClick={()=>{onClose();onOpenPerfil(post.autor_email);}} style={{background:"none",border:"none",cursor:"pointer",padding:0,flexShrink:0}}><Avatar letra={nombre[0]} size={52}/></button>
              <div style={{flex:1,minWidth:0}}>
                <button onClick={()=>{onClose();onOpenPerfil(post.autor_email);}}
                  style={{fontWeight:700,color:C.text,fontSize:16,background:"none",border:"none",cursor:"pointer",fontFamily:FONT,padding:0,textAlign:"left",display:"block",marginBottom:3}}
                  onMouseEnter={e=>e.currentTarget.style.color=C.accent} onMouseLeave={e=>e.currentTarget.style.color=C.text}>
                  {nombre}
                </button>
                {loading?<Spinner small/>:<StarRating val={avgUser} count={reseñasUsuario.length}/>}
                {esMio&&<div style={{fontSize:12,color:C.muted,marginTop:2,fontStyle:"italic"}}>Tu publicación</div>}
                {esAyudante&&<span style={{fontSize:12,color:C.purple,fontWeight:700}}>✦ Co-docente</span>}
              </div>
            </div>

            {/* Descripción */}
            <div style={{marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${C.border}`}}>
              <h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:"0 0 10px"}}>Descripción</h2>
              <p style={{color:C.muted,fontSize:14,lineHeight:1.8,margin:0,whiteSpace:"pre-line"}}>{post.descripcion}</p>
            </div>

            {/* Chips de detalles */}
            {post.tipo==="oferta"&&(
              <div style={{marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${C.border}`}}>
                <h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:"0 0 14px"}}>Detalles</h2>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
                  {[
                    post.modo==="curso"&&{label:"Tipo",val:"Curso grupal",icon:"📚"},
                    post.modo==="particular"&&{label:"Tipo",val:"Clase particular",icon:"👤"},
                    post.sinc&&{label:"Modalidad",val:post.sinc==="sinc"?"Sincrónico":"Asincrónico",icon:"🕐"},
                    post.modalidad&&{label:"Lugar",val:post.modalidad==="virtual"?"Virtual":post.modalidad==="presencial"?"Presencial":"Mixto",icon:post.modalidad==="virtual"?"🌐":"📍"},
                    post.fecha_inicio&&{label:"Inicio",val:fmt(post.fecha_inicio),icon:"📅"},
                    calcDuracion(post.fecha_inicio,post.fecha_fin)&&{label:"Duración",val:calcDuracion(post.fecha_inicio,post.fecha_fin),icon:"⏱"},
                  ].filter(Boolean).map(({label,val,icon})=>(
                    <div key={label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px"}}>
                      <div style={{fontSize:18,marginBottom:6}}>{icon}</div>
                      <div style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:.3,marginBottom:3}}>{label.toUpperCase()}</div>
                      <div style={{fontSize:13,color:C.text,fontWeight:600}}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendario si lo tiene */}
            {post.tipo==="oferta"&&post.modo==="curso"&&post.sinc==="sinc"&&(
              <div style={{marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${C.border}`}}>
                <h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:"0 0 14px"}}>Horarios</h2>
                <CalendarioCurso post={post}/>
              </div>
            )}

            {/* Reseñas */}
            <div>
              <ReseñasSeccion post={post} session={session} inscripcion={inscripcion} esMio={esMio}/>
            </div>
          </div>

          {/* ─ Caja flotante derecha ─ */}
          <div style={{flex:"0 0 300px",minWidth:260,position:"sticky",top:72}}>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"24px",boxShadow:"0 4px 24px rgba(0,0,0,.08)"}}>

              {/* Precio */}
              {post.precio?(
                <div style={{marginBottom:16}}>
                  <span style={{fontSize:26,fontWeight:800,color:C.text}}>{fmtPrice(post.precio,post.moneda)}</span>
                  <span style={{fontSize:14,color:C.muted,fontWeight:400}}> /{post.precio_tipo||"hora"}</span>
                </div>
              ):(
                <div style={{fontSize:16,fontWeight:700,color:C.success,marginBottom:16}}>Gratis</div>
              )}

              {/* Valoración compacta */}
              {avgPub&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
                <span style={{color:"#B45309",fontSize:14}}>★ {parseFloat(avgPub).toFixed(1)}</span>
                <span style={{color:C.muted,fontSize:13}}>· {reseñas.length} reseña{reseñas.length!==1?"s":""}</span>
              </div>}

              {/* Acciones */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {loading?(
                  <Spinner small/>
                ):(
                  <>
                    {esAyudante&&<div style={{fontSize:12,color:C.purple,fontWeight:700,background:"#7B5CF010",border:"1px solid #7B5CF030",borderRadius:8,padding:"8px 12px",textAlign:"center"}}>✦ Sos co-docente de este curso</div>}

                    {post.tipo==="oferta"&&!esMio&&!esAyudante&&!inscripcion&&!post.finalizado&&!post.inscripciones_cerradas&&(
                      <InscribirseBtn post={post} session={session} onDone={()=>{onClose();onOpenCurso(post);}}/>
                    )}
                    {post.tipo==="oferta"&&!esMio&&!esAyudante&&!loading&&!inscripcion&&post.inscripciones_cerradas&&(
                      <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"8px",background:C.bg,borderRadius:8}}>Inscripciones cerradas</div>
                    )}
                    {post.tipo==="oferta"&&(esMio||esAyudante||inscripcion)&&(
                      <button onClick={()=>{onClose();onOpenCurso(post);}} style={{width:"100%",background:C.success+"15",color:C.success,border:`1px solid ${C.success}44`,borderRadius:20,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT}}>
                        Ver contenido del curso
                      </button>
                    )}
                    {!esMio&&puedeChat&&(
                      <button onClick={()=>{onClose();onChat(post);}} style={{width:"100%",background:LUD.grad,color:"#fff",border:"none",borderRadius:20,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 14px rgba(26,110,216,.3)"}}>
                        Chatear con el docente
                      </button>
                    )}
                    <OfertarBtn post={post} session={session}/>
                  </>
                )}
              </div>

              {/* Info extra */}
              <div style={{marginTop:16,paddingTop:14,borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {icon:"✓",txt:"Sin intermediarios ni comisiones"},
                  post.tipo==="oferta"&&{icon:"🔒",txt:"Pago acordado directamente"},
                  post.tipo==="busqueda"&&{icon:"📩",txt:"Recibís ofertas de docentes"},
                ].filter(Boolean).map(({icon,txt})=>(
                  <div key={txt} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <span style={{fontSize:13,color:C.success,flexShrink:0}}>{icon}</span>
                    <span style={{fontSize:12,color:C.muted}}>{txt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barra CTA fija en mobile ── */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,padding:"12px 20px",display:"flex",alignItems:"center",gap:12,zIndex:20,boxShadow:"0 -2px 16px rgba(0,0,0,.08)"}}
        className="detail-cta-mobile">
        <style>{`.detail-cta-mobile{display:none!important}@media(max-width:768px){.detail-cta-mobile{display:flex!important}}`}</style>
        {post.precio?<div style={{flex:1}}><span style={{fontWeight:800,color:C.text,fontSize:18}}>{fmtPrice(post.precio,post.moneda)}</span><span style={{fontSize:12,color:C.muted}}> /{post.precio_tipo||"hora"}</span></div>:<div style={{flex:1,fontWeight:700,color:C.success}}>Gratis</div>}
        <div style={{display:"flex",gap:8}}>
          {!esMio&&puedeChat&&<button onClick={()=>{onClose();onChat(post);}} style={{background:LUD.grad,color:"#fff",border:"none",borderRadius:20,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT}}>Chatear</button>}
          {post.tipo==="oferta"&&!esMio&&!esAyudante&&!inscripcion&&!post.finalizado&&!post.inscripciones_cerradas&&<InscribirseBtn post={post} session={session} onDone={()=>{onClose();onOpenCurso(post);}}/>}
          {post.tipo==="oferta"&&(esMio||esAyudante||inscripcion)&&<button onClick={()=>{onClose();onOpenCurso(post);}} style={{background:C.success+"15",color:C.success,border:`1px solid ${C.success}44`,borderRadius:20,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT}}>Ver curso</button>}
          {post.tipo==="busqueda"&&!esMio&&<OfertarBtn post={post} session={session}/>}
        </div>
      </div>
    </div>
  );
}

// ─── VERIFICACIÓN IA ──────────────────────────────────────────────────────────
function VerificacionIA({titulo,materia,descripcion,onVerificado,onEstadoChange,token}){
  const [pregunta,setPregunta]=useState("");const [respuesta,setRespuesta]=useState("");const [estado,setEstado]=useState("cargando");const [feedback,setFeedback]=useState("");
  // Debounce: esperar 1.5s después del último cambio en titulo/descripcion
  // Y solo generar pregunta cuando descripcion tiene al menos 20 caracteres
  const tituloDebounced=useDebounce(titulo,5000);
  const descripcionDebounced=useDebounce(descripcion,5000);
  useEffect(()=>{
    if(!tituloDebounced||!materia)return;
    // Esperar que haya suficiente descripcion para una pregunta contextual
    if(descripcionDebounced&&descripcionDebounced.length<20)return;
    setEstado("cargando");setRespuesta("");setPregunta("");setFeedback("");
    if(onEstadoChange)onEstadoChange("cargando");
    sb.verificarConIA(tituloDebounced,materia,descripcionDebounced||"","",token)
      .then(r=>{setPregunta(r.pregunta||"Contá tu experiencia.");setEstado("esperando");if(onEstadoChange)onEstadoChange("esperando");})
      .catch(()=>{setPregunta("Contá brevemente tu experiencia enseñando este tema.");setEstado("esperando");if(onEstadoChange)onEstadoChange("esperando");});
  },[tituloDebounced,descripcionDebounced,materia]);// eslint-disable-line
  const evaluar=async()=>{if(!respuesta.trim())return;setEstado("evaluando");try{const r=await sb.verificarConIA(titulo,materia,descripcion||"",respuesta,token);
    setFeedback(r.feedback||"");
    if(r.correcta){setEstado("ok");onVerificado();}
    else{setEstado("error");}}catch{setEstado("error");setFeedback("No se pudo evaluar.");}};
  if(estado==="ok")return <div style={{color:C.success,fontSize:12,padding:"7px 11px",background:"#4ECB7115",borderRadius:8,border:"1px solid #4ECB7133"}}>✓ ¡Verificado!</div>;
  return(<div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:10,padding:12,marginTop:8}}>
    <div style={{color:C.accent,fontSize:10,fontWeight:700,marginBottom:5,letterSpacing:1}}>✓ VERIFICACIÓN (IA)</div>
    {estado==="cargando"?<div style={{color:C.muted,fontSize:12,display:"flex",alignItems:"center",gap:6}}><Spinner small/>Generando...</div>:(<>
      <p style={{color:C.text,fontSize:12,marginBottom:7,lineHeight:1.5}}>{pregunta}</p>
      <textarea value={respuesta} onChange={e=>setRespuesta(e.target.value)} placeholder="Tu respuesta..." style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",color:C.text,fontSize:12,outline:"none",resize:"vertical",minHeight:52,boxSizing:"border-box",fontFamily:FONT,marginBottom:7}}/>
      {estado==="error"&&<div style={{color:C.danger,fontSize:12,marginBottom:7,background:"#E05C5C15",borderRadius:7,padding:"7px 10px",lineHeight:1.5}}>{feedback||"Respuesta incorrecta. Intentá de nuevo."}</div>}
      <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
        {estado==="error"
          ?<button onClick={()=>{setEstado("cargando");setRespuesta("");setFeedback("");sb.verificarConIA(titulo,materia,descripcion||"","",token).then(r2=>{setPregunta(r2.pregunta||"Contá tu experiencia.");setEstado("esperando");}).catch(()=>{setPregunta("Contá brevemente tu experiencia enseñando este tema.");setEstado("esperando");});}} style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"5px 12px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:FONT}}>Nueva pregunta →</button>
          :<button onClick={evaluar} disabled={estado==="evaluando"||!respuesta.trim()} style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"5px 12px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:FONT,opacity:!respuesta.trim()?0.5:1}}>{estado==="evaluando"?"Evaluando...":"Verificar →"}</button>
        }

      </div>
    </>)}
  </div>);
}



// ─── STREAK / RACHA ───────────────────────────────────────────────────────────
function StreakBadge({session}){
  const KEY=`cl_streak_${session.user.email}`;
  const DAYS_KEY=`cl_streak_days_${session.user.email}`;
  const today=new Date().toDateString();
  const [streak,setStreak]=React.useState(()=>{
    try{
      const last=localStorage.getItem(KEY);
      const days=parseInt(localStorage.getItem(DAYS_KEY)||"0");
      if(!last)return 1;
      const lastDate=new Date(last);
      const diff=Math.floor((new Date()-lastDate)/(1000*60*60*24));
      if(diff===0)return days;
      if(diff===1){
        const newDays=days+1;
        localStorage.setItem(DAYS_KEY,newDays);
        localStorage.setItem(KEY,today);
        return newDays;
      }
      localStorage.setItem(DAYS_KEY,1);
      localStorage.setItem(KEY,today);
      return 1;
    }catch{return 1;}
  });
  React.useEffect(()=>{
    try{
      if(!localStorage.getItem(KEY)){
        localStorage.setItem(KEY,today);
        localStorage.setItem(DAYS_KEY,"1");
      }
    }catch{}
  },[]);
  if(streak<2)return null;
  return(
    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#E0955C18",border:"1px solid #E0955C33",borderRadius:20,padding:"4px 12px",marginBottom:10}}>
      <span style={{fontSize:16}}>🔥</span>
      <span style={{fontWeight:700,color:C.warn,fontSize:13}}>{streak} días seguidos</span>
      <span style={{color:C.muted,fontSize:11}}>en ClasseLink</span>
    </div>
  );
}

// ─── ASISTENTE IA PUBLICACIÓN ─────────────────────────────────────────────────
function AsistentePublicacion({tipo,materia,titulo,descripcion,modo,session,onApply}){
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [sugerencia,setSugerencia]=useState(null);
  const [error,setError]=useState("");

  const generar=async()=>{
    if(!materia){setError("Elegí una materia primero.");return;}
    setLoading(true);setError("");setSugerencia(null);
    try{
      const tieneContenido=titulo&&descripcion;
      const contexto=[
        `Tipo: ${tipo==="oferta"?"Oferta de clases":"Búsqueda de clases"}`,
        `Materia: ${materia}`,
        modo&&modo!=="particular"?`Modalidad de clase: ${modo==="grupal"||modo==="curso"?"Curso":"Clase particular"}`:"",
        titulo?`Título actual: "${titulo}"`:"",
        descripcion?`Descripción actual: "${descripcion}"`:"",
      ].filter(Boolean).join(". ");
      const instruccion=tieneContenido
        ?`Tenés título y descripción. Mejorá ambos haciéndolos más atractivos y claros. Mantené la esencia pero optimizá el lenguaje.`
        :titulo
          ?`Ya tiene título. Generá una descripción que lo complemente bien.`
          :`Generá un título atractivo y descripción clara para esta publicación.`;
      const raw=await sb.callIA(
        `Sos un asistente para docentes de una plataforma educativa argentina (ClasseLink).
${instruccion}
SIEMPRE respondé con JSON válido sin markdown:
{"titulo":"...","descripcion":"...","precio_sugerido":null,"consejos":["...","..."]}
- titulo: máximo 60 caracteres, específico y atractivo
- descripcion: 2-3 oraciones, máximo 250 caracteres, mencionar metodología o beneficios
- precio_sugerido: número en ARS o null si no aplica
- consejos: 2 tips concretos para mejorar la publicación`,
        `${contexto}

${instruccion}
Respondé SOLO JSON.`,
        400,
        session?.access_token
      );
      const match=raw.match(/\{[\s\S]*\}/);
      if(!match)throw new Error("Sin respuesta");
      setSugerencia(JSON.parse(match[0]));
    }catch(e){setError("No se pudo generar. Intentá de nuevo.");}
    finally{setLoading(false);}
  };

  if(!open)return(
    <button type="button" onClick={()=>{setOpen(true);generar();}}
      style={{display:"flex",alignItems:"center",gap:6,background:"#C85CE015",border:"1px solid #C85CE033",borderRadius:9,color:C.purple,padding:"7px 12px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT,width:"100%",marginBottom:9}}>
      <span style={{fontSize:14}}>✦</span> {titulo&&descripcion?"Mejorar con IA":titulo?"Completar descripción con IA":"Completar con IA"}
    </button>
  );

  return(
    <div style={{background:C.surface,border:`1px solid ${C.purple}44`,borderRadius:12,padding:14,marginBottom:12,animation:"fadeIn .15s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontWeight:700,color:C.purple,fontSize:12}}>✦ Asistente IA</span>
        <button onClick={()=>{setOpen(false);setSugerencia(null);}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>×</button>
      </div>
      {loading&&<div style={{display:"flex",alignItems:"center",gap:8,color:C.muted,fontSize:12,padding:"8px 0"}}><Spinner small/>Generando sugerencias…</div>}
      {error&&<div style={{color:C.danger,fontSize:12,marginBottom:8}}>{error}<button onClick={generar} style={{background:"none",border:"none",color:C.accent,fontSize:11,cursor:"pointer",fontFamily:FONT,marginLeft:8}}>Reintentar</button></div>}
      {sugerencia&&!loading&&(
        <>
          <div style={{background:C.card,borderRadius:10,padding:"10px 13px",marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:4}}>TÍTULO SUGERIDO</div>
            <div style={{color:C.text,fontSize:13,fontWeight:600,marginBottom:8}}>{sugerencia.titulo}</div>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:4}}>DESCRIPCIÓN SUGERIDA</div>
            <div style={{color:C.muted,fontSize:12,lineHeight:1.5,marginBottom:sugerencia.consejos?.length?8:0}}>{sugerencia.descripcion}</div>
            {sugerencia.consejos?.length>0&&(
              <div style={{marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:5}}>TIPS</div>
                {sugerencia.consejos.map((c,i)=><div key={i} style={{fontSize:11,color:C.muted,marginBottom:3}}>💡 {c}</div>)}
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>onApply(sugerencia)} style={{flex:1,background:C.purple,border:"none",borderRadius:9,color:"#fff",padding:"8px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT}}>Usar sugerencia ✓</button>
            <button onClick={generar} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"8px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT}}>Regenerar ↺</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── POST FORM MODAL ──────────────────────────────────────────────────────────
function PostFormModal({session,postToEdit,onClose,onSave}){
  const editing=!!postToEdit;
  const [tipo,setTipo]=useState(postToEdit?.tipo||"busqueda");const [materia,setMateria]=useState(postToEdit?.materia||"");const [titulo,setTitulo]=useState(postToEdit?.titulo||"");const [descripcion,setDescripcion]=useState(postToEdit?.descripcion||"");
  const [modo,setModo]=useState(postToEdit?.modo||"particular");const [precio,setPrecio]=useState(postToEdit?.precio||"");const [precioTipo,setPrecioTipo]=useState(postToEdit?.precio_tipo||"hora");
  const [sinc,setSinc]=useState(postToEdit?.sinc||"sinc");const [fechaInicio,setFechaInicio]=useState(postToEdit?.fecha_inicio||"");const [fechaFin,setFechaFin]=useState(postToEdit?.fecha_fin||"");
  const [clasesSinc,setClasesSinc]=useState(()=>{try{return postToEdit?.clases_sinc?JSON.parse(postToEdit.clases_sinc):[]}catch{return [];}});
  const [verificado,setVerificado]=useState(postToEdit?.verificado||false);const [saving,setSaving]=useState(false);const [err,setErr]=useState("");
  const [modalidadForm,setModalidadForm]=useState(postToEdit?.modalidad||"");
  const [nivel,setNivel]=useState(postToEdit?.nivel||"");
  const [requisitos,setRequisitos]=useState(postToEdit?.requisitos||"");
  const [maxAlumnos,setMaxAlumnos]=useState(postToEdit?.max_alumnos||"");
  const [bannerUrl,setBannerUrl]=useState(postToEdit?.banner_url||"");
  const [moneda,setMoneda]=useState(postToEdit?.moneda||"ARS");
  const [showPreview,setShowPreview]=useState(false);
  const [verificacionPendiente,setVerificacionPendiente]=useState(false);
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
      const modoDb=modo==="curso"?"grupal":modo;
      const esCursoNuevo=tipo==="oferta"&&modo==="curso"&&!editing;
      const esParticularNuevo=tipo==="oferta"&&modo==="particular"&&!editing;
      // Cursos y clases particulares nuevas nacen con activo:false hasta validar
      const activoInicial=editing?undefined:(esCursoNuevo||esParticularNuevo)?false:true;
      const data={tipo,materia,titulo,descripcion,autor_id:session.user.id,activo:activoInicial??true,verificado,modo:modoDb,modalidad:modalidadForm||null,moneda:moneda||"ARS"};
      // estado_validacion se maneja localmente (columna pendiente de crear en DB)
      const _estadoLocal=activoInicial===false?"pendiente":undefined;
      if(tipo==="oferta"){if(precio)data.precio=parseFloat(precio);if(modo==="particular")data.precio_tipo=precioTipo;else{data.sinc=sinc;data.duracion_curso=modo==="curso"?"curso":null;if(fechaInicio)data.fecha_inicio=fechaInicio;if(fechaFin)data.fecha_fin=fechaFin;if(sinc==="sinc")data.clases_sinc=JSON.stringify(clasesSinc);}}
      let savedPub=null;
      if(editing){await sb.updatePublicacion(postToEdit.id,data,session.access_token);}
      else{const r=await sb.insertPublicacion(data,session.access_token);savedPub=r?.[0]||null;}
      // Inyectar estado_validacion local en el objeto guardado para que el wizard funcione sin columna DB
      if(savedPub&&_estadoLocal)savedPub.estado_validacion=_estadoLocal;
      if(savedPub&&activoInicial===false)savedPub.activo=false;
      // Inyectar autor_email/id: el INSERT no devuelve JOIN con usuarios, CursoPage lo necesita para esMio
      if(savedPub){savedPub.autor_email=session.user.email;savedPub.autor_id=session.user.id;}
      onSave(savedPub,{esCursoNuevo,esParticularNuevo});
      onClose();
    }catch(e){setSaving(false);setErr("Error: "+e.message);}
  };
  return(
    <Modal onClose={onClose}>
      <div style={{padding:"20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>{editing?"Editar publicación":"Nueva publicación"}</h3><button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:21,cursor:"pointer"}}>×</button></div>
        <div style={{display:"flex",gap:7,marginBottom:12}}>{["busqueda","oferta"].map(t=>(<button key={t} onClick={()=>setTipo(t)} style={{flex:1,padding:"8px",borderRadius:9,fontWeight:700,fontSize:12,cursor:"pointer",background:tipo===t?(t==="oferta"?C.success:C.accent):C.card,color:tipo===t?"#fff":C.muted,border:`1px solid ${tipo===t?"transparent":C.border}`,fontFamily:FONT}}>{t==="busqueda"?"Busco clases":"Ofrezco clases"}</button>))}</div>
        {/* Particular/Curso antes de materia — solo para ofertas */}
        {tipo==="oferta"&&(
          <div style={{marginBottom:12}}>
            <Label>Tipo de clase</Label>
            <div style={{display:"flex",gap:7}}>
              {[{v:"particular",l:"Clase particular",ic:"👤"},{v:"curso",l:"Curso",ic:"📚"}].map(({v,l,ic})=>(
                <button key={v} type="button" onClick={()=>setModo(v)}
                  style={{flex:1,padding:"10px 8px",borderRadius:11,fontSize:12,cursor:"pointer",fontFamily:FONT,
                    display:"flex",alignItems:"center",justifyContent:"center",gap:7,
                    background:modo===v?C.accent:C.surface,color:modo===v?"#fff":C.muted,
                    border:`1.5px solid ${modo===v?C.accent:C.border}`,fontWeight:modo===v?700:400,transition:"all .15s"}}>
                  <span style={{fontSize:18}}>{ic}</span>{l}
                </button>
              ))}
            </div>
          </div>
        )}

        <SearchableSelect value={materia} onChange={setMateria} options={MATERIAS} placeholder="Seleccioná una materia" style={{marginBottom:9}}/>
        {materia&&<AsistentePublicacion tipo={tipo} materia={materia} titulo={titulo} descripcion={descripcion} modo={modo} session={session} onApply={(s)=>{if(s.titulo)setTitulo(s.titulo);if(s.descripcion)setDescripcion(s.descripcion.slice(0,300));if(s.precio_sugerido)setPrecio(String(s.precio_sugerido));}}/>}
        <div style={{position:"relative",marginBottom:9}}><input value={titulo} onChange={e=>setTitulo(e.target.value.slice(0,80))} placeholder={tipo==="busqueda"?"Título de tu búsqueda":"Título del curso o clase"} style={{...iS,marginBottom:0,paddingRight:48}}/><span style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",fontSize:10,color:titulo.length>=70?C.danger:C.muted,fontFamily:FONT,pointerEvents:"none"}}>{titulo.length}/80</span></div>
        <div style={{position:"relative",marginBottom:9}}>
          <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value.slice(0,DESC_MAX))} placeholder="Descripción..." style={{...iS,minHeight:72,resize:"vertical",marginBottom:0,paddingBottom:22}}/>
          <span style={{position:"absolute",bottom:8,right:11,fontSize:10,color:descripcion.length>=DESC_MAX?C.danger:C.muted,fontFamily:FONT,pointerEvents:"none"}}>{descripcion.length}/{DESC_MAX}</span>
        </div>
        <div style={{marginBottom:9}}>
          <Label>{tipo==="busqueda"?"Requisitos del docente (opcional)":"Requisitos previos (opcional)"}</Label>
          <input value={requisitos} onChange={e=>setRequisitos(e.target.value.slice(0,150))} placeholder={tipo==="busqueda"?"Ej: Con experiencia en CBC, paciencia con principiantes...":"Ej: Conocimientos básicos de álgebra..."} style={{...iS,marginBottom:0}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
          <div>
            <Label>Modalidad de cursado</Label>
            <select value={modalidadForm} onChange={e=>setModalidadForm(e.target.value)} style={{...iS,marginBottom:0,cursor:"pointer"}}>
              <option value="">No especificada</option>
              <option value="presencial">📍 Presencial</option>
              <option value="virtual">🌐 Virtual</option>
              <option value="mixto">⟳ Mixto</option>
            </select>
          </div>
          <div>
            <Label>Nivel de alumnos</Label>
            <select value={nivel} onChange={e=>setNivel(e.target.value)} style={{...iS,marginBottom:0,cursor:"pointer"}}>
              <option value="">No especificado</option>
              <option value="primaria">Primaria</option>
              <option value="secundaria">Secundaria</option>
              <option value="universitario">Universitario</option>
              <option value="adultos">Adultos / Profesional</option>
              <option value="todos">Todos los niveles</option>
            </select>
          </div>
        </div>
        {tipo==="oferta"&&(<>
          {modo==="particular"&&(<div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginBottom:4}}><Label>Precio</Label><div style={{display:"flex",gap:7}}><select value={moneda} onChange={e=>setMoneda(e.target.value)} style={{...iS,margin:0,flex:"0 0 80px",cursor:"pointer"}}>{[["ARS","$ ARS"],["USD","US$"],["EUR","€"],["BRL","R$"],["CLP","CLP"],["COP","COP"],["MXN","MXN"],["UYU","UYU"],["PEN","S/"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Precio" type="number" min="0" style={{...iS,margin:0,flex:2}}/><select value={precioTipo} onChange={e=>setPrecioTipo(e.target.value)} style={{...iS,margin:0,flex:1,cursor:"pointer"}}><option value="hora">/ hora</option><option value="clase">/ clase</option></select></div></div>)}
          {modo==="curso"&&(<div style={{borderTop:`1px solid ${C.border}`,paddingTop:10}}>
            <Label>Precio total</Label><div style={{display:"flex",gap:7,marginBottom:9}}><select value={moneda} onChange={e=>setMoneda(e.target.value)} style={{...iS,margin:0,flex:"0 0 80px",cursor:"pointer"}}>{[["ARS","$ ARS"],["USD","US$"],["EUR","€"],["BRL","R$"],["CLP","CLP"],["COP","COP"],["MXN","MXN"],["UYU","UYU"],["PEN","S/"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Precio" type="number" min="0" style={{...iS,margin:0,flex:1}}/></div>
            <Label>Tipo</Label>
            <div style={{display:"flex",gap:7,marginBottom:9}}>{[{v:"sinc",l:"Sincrónico"},{v:"asinc",l:"Asincrónico"}].map(({v,l})=>(<button key={v} onClick={()=>setSinc(v)} style={{flex:1,padding:"7px",borderRadius:9,fontWeight:600,fontSize:12,cursor:"pointer",background:sinc===v?C.accent:C.card,color:sinc===v?"#fff":C.muted,border:`1px solid ${sinc===v?"transparent":C.border}`,fontFamily:FONT}}>{l}</button>))}</div>
            <div style={{display:"flex",gap:7,marginBottom:9}}>
              <div style={{flex:1}}><Label>Inicio</Label><input type="date" value={fechaInicio} onChange={e=>{setFechaInicio(e.target.value);if(fechaFin&&fechaFin<=e.target.value)setFechaFin("");}} style={{...iS,margin:0,colorScheme:localStorage.getItem("cl_theme")==="light"?"light":"dark"}}/></div>
              <div style={{flex:1}}><Label>Fin</Label><input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} min={fechaInicio?(()=>{const d=new Date(fechaInicio);d.setDate(d.getDate()+1);return d.toISOString().split("T")[0];})():undefined} disabled={!fechaInicio} style={{...iS,margin:0,colorScheme:localStorage.getItem("cl_theme")||"light",opacity:fechaInicio?1:0.4,cursor:fechaInicio?"auto":"not-allowed"}}/></div>
            </div>
            {durCalc&&<div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:8,padding:"7px 12px",marginBottom:9,fontSize:12,color:C.accent}}>⏱ Duración: <strong>{durCalc}</strong></div>}
            {sinc==="sinc"&&(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><Label>Horarios</Label><button onClick={addClase} style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:7,color:C.accent,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:FONT}}>+ Agregar</button></div>
              {clasesSinc.map((c,i)=>{
                const toMin=(t)=>{if(!t)return null;const p=t.split(":");if(p.length<2)return null;const h=parseInt(p[0]);const m=parseInt(p[1]);if(isNaN(h)||isNaN(m))return null;return h*60+m;};
                const minInicio=toMin(c.hora_inicio);const minFin=toMin(c.hora_fin);
                const horaInvalida=minInicio!==null&&minFin!==null&&minFin<=minInicio;
                return(<div key={i} style={{display:"flex",gap:5,alignItems:"center",marginBottom:6,background:C.card,borderRadius:9,padding:"7px 9px",border:`1px solid ${horaInvalida?"#E05C5C44":C.border}`,flexWrap:"wrap"}}>
                  <select value={c.dia} onChange={e=>updClase(i,"dia",e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 7px",color:C.text,fontSize:11,fontFamily:FONT,cursor:"pointer",outline:"none",flex:2}}>{["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map(d=><option key={d}>{d}</option>)}</select>
                  <input type="time" value={c.hora_inicio} onChange={e=>{const v=e.target.value;updClase(i,"hora_inicio",v);if(c.hora_fin&&toMin(c.hora_fin)!==null&&toMin(c.hora_fin)<=toMin(v)){const[h,m]=v.split(":").map(Number);const fin=`${String(h+(m>=30?1:0)).padStart(2,"0")}:${m>=30?"00":String(m+30).padStart(2,"0")}`;updClase(i,"hora_fin",fin);}}} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 7px",color:C.text,fontSize:11,fontFamily:FONT,outline:"none",colorScheme:localStorage.getItem("cl_theme")||"light",flex:2}}/>
                  <span style={{color:C.muted,fontSize:11}}>→</span>
                  <input type="text" value={c.hora_fin} onChange={e=>updClase(i,"hora_fin",e.target.value)} placeholder="HH:MM" maxLength={5} style={{background:C.surface,border:`1px solid ${horaInvalida?C.danger:C.border}`,borderRadius:7,padding:"4px 7px",color:horaInvalida?C.danger:C.text,fontSize:11,fontFamily:FONT,outline:"none",flex:2,width:0}}/>
                  {horaInvalida&&<span style={{fontSize:10,color:C.danger,width:"100%",paddingLeft:2}}>⚠ El horario de fin debe ser posterior al inicio</span>}
                  <button onClick={()=>remClase(i)} style={{background:"none",border:"none",color:C.danger,fontSize:15,cursor:"pointer",flexShrink:0}}>×</button>
                </div>);
              })}
            </>)}
          </div>)}
          {/* Verificacion solo para ofertas */}
          {tipo==="oferta"&&titulo&&materia&&!verificado&&<VerificacionIA titulo={titulo} materia={materia} descripcion={descripcion} onVerificado={(v)=>{setVerificado(v!==false);setVerificacionPendiente(false);}} onEstadoChange={(e)=>setVerificacionPendiente(e==="cargando")} token={session?.access_token}/>}
          {tipo==="oferta"&&verificacionPendiente&&<div style={{color:C.warn,fontSize:11,padding:"5px 10px",background:"#E0955C15",borderRadius:7,border:"1px solid #E0955C33",marginTop:5,display:"flex",alignItems:"center",gap:6}}><Spinner small/>Generando pregunta de verificación… (no podés publicar hasta completarla)</div>}
        {tipo==="oferta"&&verificado&&<div style={{color:C.success,fontSize:11,padding:"5px 10px",background:"#4ECB7115",borderRadius:7,border:"1px solid #4ECB7133",marginTop:5}}>✓ Verificado</div>}
        </>)}
        <ErrMsg msg={err}/>
        {sinc==="sinc"&&clasesSinc.some(c=>{const p=(t)=>{if(!t)return null;const s=t.split(":");if(s.length<2)return null;const h=parseInt(s[0]);const m=parseInt(s[1]);return isNaN(h)||isNaN(m)?null:h*60+m;};const fi=p(c.hora_inicio);const ff=p(c.hora_fin);return fi!==null&&ff!==null&&ff<=fi;})&&(
          <div style={{background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:8,padding:"7px 12px",marginBottom:6,fontSize:12,color:C.danger}}>⚠ Revisá los horarios: hay clases con fin anterior o igual al inicio.</div>
        )}
        <div style={{display:"flex",gap:8,marginTop:11}}>
          {!editing&&<button type="button" onClick={()=>setShowPreview(v=>!v)} style={{background:showPreview?C.accentDim:C.surface,border:`1px solid ${showPreview?C.accent:C.border}`,borderRadius:11,color:showPreview?C.accent:C.muted,padding:"10px 14px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT,flexShrink:0}}>{showPreview?"✕ Preview":"👁 Preview"}</button>}
          <Btn onClick={guardar} disabled={saving||verificacionPendiente||clasesSinc.some(c=>{const p=(t)=>{if(!t)return null;const s=t.split(":");if(s.length<2)return null;const h=parseInt(s[0]);const m=parseInt(s[1]);return isNaN(h)||isNaN(m)?null:h*60+m;};const fi=p(c.hora_inicio);const ff=p(c.hora_fin);return fi!==null&&ff!==null&&ff<=fi;})} style={{flex:1,padding:"10px",fontSize:13,borderRadius:11}}>{saving?"Guardando...":editing?"Guardar cambios":tipo==="busqueda"?"Publicar →":verificado?"Publicar →":"Publicar sin verificar →"}</Btn>
        </div>
        {showPreview&&titulo&&(
          <div style={{marginTop:14,border:`1px solid ${C.accent}`,borderRadius:14,overflow:"hidden",opacity:0.92}}>
            <div style={{background:C.accentDim,padding:"6px 14px",fontSize:10,fontWeight:700,color:C.accent,letterSpacing:1}}>PREVIEW</div>
            <div style={{background:C.card,padding:"14px 16px"}}>
              <div style={{display:"flex",gap:7,marginBottom:8,flexWrap:"wrap"}}>
                <Tag tipo={tipo}/>
                {modalidadForm==="virtual"&&<span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:"#4ECB7115",color:C.success,border:"1px solid #4ECB7133"}}>🌐 Virtual</span>}
                {modalidadForm==="presencial"&&<span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:"#5CA8E015",color:C.info,border:"1px solid #5CA8E033"}}>📍 Presencial</span>}
                {modalidadForm==="mixto"&&<span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:"#C85CE015",color:C.purple,border:"1px solid #C85CE033"}}>⟳ Mixto</span>}
              </div>
              <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:4}}>{titulo||"Sin título"}</div>
              <div style={{color:C.muted,fontSize:12,marginBottom:8,lineHeight:1.5}}>{descripcion?.slice(0,120)}{descripcion?.length>120?"...":""}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                {materia&&<span style={{fontSize:11,color:C.muted}}>{materia}</span>}
                {precio&&<span style={{fontSize:12,color:C.accent,fontWeight:700,background:C.accentDim,borderRadius:7,padding:"2px 8px"}}>{fmtPrice(precio)}{precioTipo?` /${precioTipo}`:""}</span>}
                {modo&&<span style={{fontSize:11,color:C.muted,background:C.surface,borderRadius:7,padding:"2px 7px"}}>{modo==="curso"?"Curso":"Clase particular"}</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── PERFIL PAGE — página completa del perfil de otro usuario (solo lectura) ──
function PerfilPage({autorEmail,session,onClose,onOpenDetail}){
  const [pubs,setPubs]=useState([]);const [reseñas,setReseñas]=useState([]);const [docs,setDocs]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  const [perfilData,setPerfilData]=useState(null);
  // Guard: autorEmail puede llegar vacío/null
  useEffect(()=>{
    if(!autorEmail){setError("Email de usuario no disponible.");setLoading(false);return;}
    setLoading(true);setError(null);
    Promise.all([
      sb.getPublicaciones({autor:autorEmail},session.access_token).catch(()=>[]),
      sb.getReseñasByAutor(autorEmail,session.access_token).catch(()=>[]),
      sb.getDocumentos(autorEmail,session.access_token).catch(()=>[]),
      sb.getUsuarioByEmail(autorEmail,session.access_token).catch(()=>null),
    ]).then(([p,r,d,u])=>{setPubs((p||[]).filter(x=>x.activo!==false));setReseñas(r||[]);setDocs(d||[]);if(u)setPerfilData(u);})
    .catch(e=>setError(e.message))
    .finally(()=>setLoading(false));
  },[autorEmail,session]);
  const nombre=autorEmail?(safeDisplayName(null,autorEmail)):"Usuario";
  const savedColor=autorEmail?localStorage.getItem("avatarColor_"+autorEmail):null;
  const perfilColor=savedColor||avatarColor(nombre[0]);
  const avg=calcAvg(reseñas);
  const TIPO_ICON={titulo:"🎓",certificado:"📜",experiencia:"💼",otro:"📄"};
  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:400,overflowY:"auto",fontFamily:FONT}}>
      <div style={{position:"sticky",top:0,zIndex:10,background:C.sidebar,borderBottom:`1px solid ${C.border}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <button onClick={onClose} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>← Volver</button>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:C.text,fontSize:15}}>{nombre}</div><div style={{fontSize:11,color:C.muted}}>Perfil del usuario</div></div>
      </div>
      <div style={{maxWidth:720,margin:"0 auto",padding:"24px 20px"}}>
        {error?<div style={{color:C.danger,textAlign:"center",padding:40,fontSize:14}}>{error}</div>:(
        <>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"24px",marginBottom:20}}>
          <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:16}}>
            <div style={{width:68,height:68,borderRadius:"50%",background:perfilColor,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:26,color:"#fff",fontFamily:FONT,flexShrink:0}}>{nombre[0].toUpperCase()}</div>
            <div style={{flex:1}}>
              <h2 style={{color:C.text,fontSize:20,fontWeight:700,margin:"0 0 3px"}}>{perfilData?.display_name||perfilData?.nombre||nombre}</h2>
              <div style={{color:C.muted,fontSize:13,marginBottom:4}}>{autorEmail}</div>
              {perfilData?.ubicacion&&<div style={{color:C.muted,fontSize:12,marginBottom:4}}>📍 {perfilData.ubicacion}</div>}
              {perfilData?.bio&&<p style={{color:C.muted,fontSize:12,margin:"0 0 6px",lineHeight:1.5}}>{perfilData.bio}</p>}
              <StarRating val={avg} count={reseñas.length}/>
            </div>
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


// ─── PRICE SLIDER ─────────────────────────────────────────────────────────────
function PriceSlider({min,max,valMin,valMax,onChangeMin,onChangeMax}){
  if(max<=0||max<=min)return null;
  const pct=v=>max>min?((v-min)/(max-min))*100:0;
  const base={WebkitAppearance:"none",appearance:"none",width:"100%",height:4,borderRadius:2,outline:"none",cursor:"pointer",background:"transparent",position:"absolute",top:0,margin:0,pointerEvents:"all"};
  return(
    <div>
      <style>{`.psr::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${C.accent};cursor:pointer;border:2px solid white;box-shadow:0 0 0 2px ${C.accent}44;position:relative;z-index:2}.psr::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:${C.accent};cursor:pointer;border:2px solid white}`}</style>
      <div style={{position:"relative",height:22,marginBottom:4}}>
        <div style={{position:"absolute",top:"50%",transform:"translateY(-50%)",left:0,right:0,height:3,background:C.border,borderRadius:2}}/>
        <div style={{position:"absolute",top:"50%",transform:"translateY(-50%)",left:`${pct(valMin)}%`,right:`${100-pct(valMax)}%`,height:3,background:C.accent,borderRadius:2}}/>
        <input type="range" className="psr" min={min} max={max} value={valMin}
          onChange={e=>{const v=Math.min(+e.target.value,valMax-1);if(v!==valMin)onChangeMin(v);}}
          style={{...base,zIndex:valMin>max*0.8?3:1}}/>
        <input type="range" className="psr" min={min} max={max} value={valMax}
          onChange={e=>{const v=Math.max(+e.target.value,valMin+1);if(v!==valMax)onChangeMax(v);}}
          style={{...base,zIndex:2}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}>
        <span>{fmtPrice(valMin)}</span><span>{fmtPrice(valMax)}{valMax===max?"+":" "}</span>
      </div>
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function OnboardingModal({session,onClose}){
  const [step,setStep]=useState(0);
  const [rol,setRol]=useState("");
  const [materias,setMaterias]=useState([]);
  const toggleM=m=>setMaterias(p=>p.includes(m)?p.filter(x=>x!==m):[...p,m]);
  const steps=[
    {title:"¡Bienvenido a ClasseLink!",sub:"La plataforma para conectar estudiantes y docentes.",body:(
      <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.7}}>Podés publicar cursos o clases, buscar docentes para lo que querés aprender, y acordar clases directamente en la plataforma.</p>
        <p style={{color:C.muted,fontSize:13}}>¿Cuál es tu rol principal?</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
          {[["docente","Soy docente","Publicar cursos y clases","★"],["alumno","Soy estudiante","Encontrar clases y docentes","◈"]].map(([v,t,sub,ic])=>(
            <button key={v} onClick={()=>setRol(v)} style={{background:rol===v?C.accentDim:C.surface,border:`2px solid ${rol===v?C.accent:C.border}`,borderRadius:14,padding:"14px 12px",cursor:"pointer",fontFamily:FONT,textAlign:"center",transition:"all .15s"}}>
              <div style={{fontSize:22,marginBottom:6,color:rol===v?C.accent:C.muted}}>{ic}</div>
              <div style={{fontWeight:700,color:rol===v?C.accent:C.text,fontSize:13,marginBottom:3}}>{t}</div>
              <div style={{color:C.muted,fontSize:11}}>{sub}</div>
            </button>
          ))}
          <button onClick={()=>setRol("ambos")} style={{gridColumn:"1/-1",background:rol==="ambos"?C.accentDim:C.surface,border:`2px solid ${rol==="ambos"?C.accent:C.border}`,borderRadius:14,padding:"10px 12px",cursor:"pointer",fontFamily:FONT}}>
            <div style={{fontWeight:700,color:rol==="ambos"?C.accent:C.text,fontSize:13}}>Ambos — enseño y aprendo</div>
          </button>
        </div>
      </div>
    )},
    {title:"¿Qué materias te interesan?",sub:"Vamos a mostrar primero lo más relevante para vos.",body:(
      <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:12}}>
        {MATERIAS.map(m=>(
          <button key={m} onClick={()=>toggleM(m)} style={{padding:"6px 13px",borderRadius:20,fontSize:12,cursor:"pointer",fontFamily:FONT,background:materias.includes(m)?C.accent:C.surface,color:materias.includes(m)?"#fff":C.muted,border:`1px solid ${materias.includes(m)?C.accent:C.border}`,fontWeight:materias.includes(m)?700:400}}>
            {m}
          </button>
        ))}
      </div>
    )},
    {title:"¡Todo listo!",sub:"Ya podés empezar a explorar ClasseLink.",body:(
      <div style={{textAlign:"center",padding:"16px 0"}}>
        <div style={{fontSize:40,marginBottom:12,color:C.accent}}>★</div>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.8}}>
          {rol==="docente"?"Usá el botón + Publicar para crear tu primera clase.":rol==="alumno"?"Explorá las publicaciones y contactá a los docentes.":"Podés explorar y publicar según lo que necesites."}<br/>
          <span style={{color:C.muted,fontSize:11}}>Tus preferencias se guardaron localmente.</span>
        </p>
      </div>
    )},
  ];
  const cur=steps[step];
  const canNext=step===0?!!rol:step===1?materias.length>0:true;
  const finish=()=>{
    try{
      localStorage.setItem("cl_onboarding_done_"+session.user.email,"1");
      if(materias.length)localStorage.setItem("cl_materias_pref_"+session.user.email,JSON.stringify(materias));
      if(rol)localStorage.setItem("cl_rol_"+session.user.email,rol);
    }catch{}
    onClose();
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,padding:20}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:22,width:"min(460px,96vw)",overflow:"hidden"}}>
        <div style={{height:3,background:C.border}}><div style={{height:"100%",background:C.accent,width:`${((step+1)/steps.length)*100}%`,transition:"width .3s"}}/></div>
        <div style={{padding:"24px 26px 26px"}}>
          <div style={{marginBottom:16}}>
            <h2 style={{color:C.text,fontSize:18,fontWeight:700,margin:"0 0 5px"}}>{cur.title}</h2>
            <p style={{color:C.muted,fontSize:12,margin:0}}>{cur.sub}</p>
          </div>
          {cur.body}
          <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"flex-end"}}>
            {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"9px 18px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>← Atrás</button>}
            {step<steps.length-1
              ?<Btn onClick={()=>setStep(s=>s+1)} disabled={!canNext} style={{padding:"9px 22px"}}>Continuar →</Btn>
              :<Btn onClick={finish} style={{padding:"9px 22px",background:C.success}}>Empezar →</Btn>
            }
          </div>
          <div style={{textAlign:"center",marginTop:10}}><button onClick={finish} style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:FONT}}>Saltar</button></div>
        </div>
      </div>
    </div>
  );
}

// ─── DOCENTE ANALYTICS ────────────────────────────────────────────────────────
// Mini gráfico de línea SVG
function MiniLineChart({data,color,height=40,width=200}){
  if(!data||data.length<2)return<div style={{color:C.muted,fontSize:11,textAlign:"center",padding:"12px 0"}}>Sin datos suficientes</div>;
  const max=Math.max(...data.map(d=>d.v),1);
  const min=Math.min(...data.map(d=>d.v),0);
  const range=max-min||1;
  const pts=data.map((d,i)=>{
    const x=(i/(data.length-1))*width;
    const y=height-((d.v-min)/range)*(height-6)-3;
    return `${x},${y}`;
  }).join(" ");
  const last=data[data.length-1];
  const lastX=(width);
  const lastY=height-((last.v-min)/range)*(height-6)-3;
  return(
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lastX} cy={lastY} r="3" fill={color}/>
    </svg>
  );
}

// Gráfico de barras SVG
function MiniBarChart({data,color,height=50,width=0,showValues=true}){
  if(!data||!data.length)return null;
  const max=Math.max(...data.map(d=>d.v),1);
  const barW=Math.max(4,(width/data.length)-2);
  const hasAnyValue=data.some(d=>d.v>0);
  return(
    <svg width="100%" viewBox={`0 0 ${width} ${height+18}`} style={{overflow:"visible"}}>
      {data.map((d,i)=>{
        const bh=Math.max(2,(d.v/max)*(height-4));
        const x=(i/(data.length))*(width)+(width/(data.length*2))-(barW/2);
        const cx=x+barW/2;
        return(<g key={i}>
          <rect x={x} y={height-bh} width={barW} height={bh} fill={color} rx="2" opacity={d.v>0?0.85:0.2}/>
          {showValues&&d.v>0&&<text x={cx} y={height-bh-4} textAnchor="middle" fontSize="9" fill={color} fontWeight="600" opacity="0.9">{d.v}</text>}
        </g>);
      })}
    </svg>
  );
}

function DocenteStats({pubs,reseñas,inscritosMap}){
  const [seccion,setSeccion]=useState("resumen");
  const ofertas=pubs.filter(p=>p.tipo==="oferta"&&p.activo!==false&&!p.finalizado);
  const finalizadas=pubs.filter(p=>p.tipo==="oferta"&&!!p.finalizado);
  const todasOfertas=pubs.filter(p=>p.tipo==="oferta");
  const totalAlumnos=Object.values(inscritosMap||{}).reduce((a,b)=>a+b,0);
  const avg=calcAvg(reseñas);
  const totalVistas=pubs.reduce((a,p)=>a+(parseInt(p.vistas)||0),0);

  // Ingresos estimados — suma de precio * inscriptos por pub (solo con precio definido)
  const ingresosEst=todasOfertas.reduce((acc,p)=>{
    if(p.precio&&inscritosMap[p.id]){
      return acc+(parseFloat(p.precio)||0)*(inscritosMap[p.id]||0);
    }
    return acc;
  },0);
  const fmtARS=(n)=>n>0?`$${n.toLocaleString("es-AR",{maximumFractionDigits:0})}`:"—";

  // Tasa de conversión vistas→inscriptos
  const tasaConversion=totalVistas>0?((totalAlumnos/totalVistas)*100).toFixed(1):null;
  // Precio promedio por clase (solo las que tienen precio)
  const pubsConPrecio=todasOfertas.filter(p=>p.precio>0);
  const precioPromedio=pubsConPrecio.length>0?(pubsConPrecio.reduce((a,p)=>a+(parseFloat(p.precio)||0),0)/pubsConPrecio.length).toFixed(0):null;
  // Tasa de completitud
  const totalFinalizados=Object.values(inscritosMap||{}).reduce((acc,_,i)=>{
    // Aproximación: finalizadas / activas ratio
    return acc;
  },0);
  // Clase más reciente
  const claseReciente=todasOfertas.length>0?todasOfertas.reduce((a,b)=>new Date(b.created_at||0)>new Date(a.created_at||0)?b:a):null;

  // Distribución de estrellas
  const starDist=[5,4,3,2,1].map(n=>({n,count:reseñas.filter(r=>r.estrellas===n).length}));
  const maxStar=Math.max(...starDist.map(s=>s.count),1);

  // Publicaciones por materia (para gráfico de barras)
  const materiaMap={};
  todasOfertas.forEach(p=>{
    if(p.materia)materiaMap[p.materia]=(materiaMap[p.materia]||0)+(inscritosMap[p.id]||0);
  });
  const materiaData=Object.entries(materiaMap).map(([k,v])=>({label:k,v})).sort((a,b)=>b.v-a.v).slice(0,6);

  // Actividad por mes — publicaciones creadas en los últimos 6 meses
  const now=new Date();
  const mesesData=Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);
    const label=d.toLocaleString("es-AR",{month:"short"});
    const pubs_mes=todasOfertas.filter(p=>{
      if(!p.created_at)return false;
      const pd=new Date(p.created_at);
      return pd.getFullYear()===d.getFullYear()&&pd.getMonth()===d.getMonth();
    });
    return{label,v:pubs_mes.length};
  });

  // Top pub por vistas y por inscriptos
  const topPorInscriptos=ofertas.length>0?ofertas.reduce((a,b)=>(inscritosMap[b.id]||0)>(inscritosMap[a.id]||0)?b:a):null;
  const topPorVistas=todasOfertas.length>0?todasOfertas.filter(p=>p.vistas>0).reduce((a,b)=>a?(parseInt(b.vistas)||0)>(parseInt(a.vistas)||0)?b:a:b,null):null;

  // Impact score: rating/5 × (alumnos>0?1:0.5) × min(pubs/3,1)
  const impactScore=avg&&totalAlumnos>0
    ?Math.round((avg/5)*Math.min(totalAlumnos/10,1)*Math.min(todasOfertas.length/3,1)*100)
    :null;

  if(todasOfertas.length===0)return null;

  const secciones=[{id:"resumen",label:"Resumen"},{id:"publicaciones",label:"Publicaciones"},{id:"reseñas",label:"Reseñas"}];
  const statStyle={background:C.surface,borderRadius:12,padding:"12px 14px"};

  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 20px",marginBottom:20}}>
      <div style={{fontWeight:700,color:C.text,fontSize:15,marginBottom:14}}>Estadísticas</div>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:2,marginBottom:16,background:C.surface,borderRadius:10,padding:3}}>
        {secciones.map(s=>(
          <button key={s.id} onClick={()=>setSeccion(s.id)}
            style={{flex:1,padding:"6px",borderRadius:8,border:"none",fontWeight:seccion===s.id?700:400,
              fontSize:11,cursor:"pointer",fontFamily:FONT,
              background:seccion===s.id?C.accent:"transparent",
              color:seccion===s.id?"#fff":C.muted}}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── RESUMEN ── */}
      {seccion==="resumen"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[
              {label:"Clases activas",val:ofertas.length,color:C.success},
              {label:"Total alumnos",val:totalAlumnos,color:C.info},
              {label:"Vistas totales",val:totalVistas||0,color:C.muted},
              {label:"Rating",val:avg?`${avg.toFixed(1)}★`:"—",color:C.accent},
              {label:"Finalizadas",val:finalizadas.length,color:C.purple},
              {label:"Reseñas",val:reseñas.length,color:C.warn},
              ...(impactScore!==null?[{label:"Impact score",val:impactScore+"/100",color:C.purple}]:[]),
              ...(precioPromedio?[{label:"Precio prom.",val:`$${parseInt(precioPromedio).toLocaleString("es-AR")}`,color:C.success}]:[]),
            ].map(s=>(
              <div key={s.label} style={{...statStyle,textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:700,color:s.color,marginBottom:2}}>{s.val}</div>
                <div style={{fontSize:10,color:C.muted}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Ingresos estimados */}
          <div style={{...statStyle,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:11,color:C.muted,marginBottom:2}}>Ingresos estimados</div>
              <div style={{fontSize:22,fontWeight:700,color:C.success}}>{fmtARS(ingresosEst)}</div>
              <div style={{fontSize:10,color:C.muted}}>Suma de precio × inscriptos por clase</div>
            </div>
            {tasaConversion&&<div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:2}}>Conversión</div>
              <div style={{fontSize:20,fontWeight:700,color:C.info}}>{tasaConversion}%</div>
              <div style={{fontSize:10,color:C.muted}}>visitas → inscriptos</div>
            </div>}
          </div>

          {/* Actividad mensual */}
          {mesesData.some(d=>d.v>0)&&(
            <div style={statStyle}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:10}}>PUBLICACIONES POR MES</div>
              <MiniBarChart data={mesesData} color={C.accent} height={48}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                {mesesData.map((d,i)=><span key={i} style={{fontSize:9,color:C.muted,flex:1,textAlign:"center"}}>{d.label}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PUBLICACIONES ── */}
      {seccion==="publicaciones"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Ranking por inscriptos */}
          <div style={statStyle}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:10}}>RANKING POR INSCRIPTOS</div>
            {todasOfertas.length===0
              ?<div style={{color:C.muted,fontSize:12}}>Sin publicaciones.</div>
              :todasOfertas.slice().sort((a,b)=>(inscritosMap[b.id]||0)-(inscritosMap[a.id]||0)).map(p=>{
                const ins=inscritosMap[p.id]||0;
                const maxIns=Math.max(...todasOfertas.map(p=>inscritosMap[p.id]||0),1);
                return(
                  <div key={p.id} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <div style={{fontSize:11,color:C.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,marginRight:8}}>{p.titulo}</div>
                      <div style={{fontSize:11,color:C.info,fontWeight:700,flexShrink:0}}>{ins} alumnos</div>
                    </div>
                    <div style={{height:5,background:C.border,borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",background:C.info,borderRadius:4,width:`${(ins/maxIns)*100}%`,transition:"width .5s ease"}}/>
                    </div>
                  </div>
                );
              })
            }
          </div>

          {/* Vistas por publicación */}
          {totalVistas>0&&(
            <div style={statStyle}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:10}}>VISTAS POR PUBLICACIÓN</div>
              {todasOfertas.filter(p=>p.vistas>0).slice().sort((a,b)=>(parseInt(b.vistas)||0)-(parseInt(a.vistas)||0)).map(p=>{
                const v=parseInt(p.vistas)||0;
                const maxV=Math.max(...todasOfertas.map(p=>parseInt(p.vistas)||0),1);
                return(
                  <div key={p.id} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <div style={{fontSize:11,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,marginRight:8}}>{p.titulo}</div>
                      <div style={{fontSize:11,color:C.muted,flexShrink:0}}>👁 {v}</div>
                    </div>
                    <div style={{height:5,background:C.border,borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",background:C.purple,borderRadius:4,width:`${(v/maxV)*100}%`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Desglose por materia */}
          {materiaData.length>0&&(
            <div style={statStyle}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:10}}>ALUMNOS POR MATERIA</div>
              <MiniBarChart data={materiaData} color={C.success} height={48}/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                {materiaData.map((d,i)=>(
                  <span key={i} style={{fontSize:10,color:C.muted,background:C.border,borderRadius:20,padding:"2px 7px"}}>{d.label}: {d.v}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RESEÑAS ── */}
      {seccion==="reseñas"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{...statStyle,display:"flex",gap:16,alignItems:"center"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:36,fontWeight:700,color:C.accent}}>{avg?avg.toFixed(1):"—"}</div>
              <div style={{color:C.accent,fontSize:16}}>{"★".repeat(Math.round(avg||0))}</div>
              <div style={{color:C.muted,fontSize:11,marginTop:2}}>{reseñas.length} reseña{reseñas.length!==1?"s":""}</div>
            </div>
            <div style={{flex:1}}>
              {starDist.map(({n,count})=>(
                <div key={n} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <span style={{color:C.muted,fontSize:10,width:10,textAlign:"right"}}>{n}</span>
                  <span style={{color:C.accent,fontSize:10}}>★</span>
                  <div style={{flex:1,height:6,background:C.border,borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",background:C.accent,borderRadius:4,width:`${(count/maxStar)*100}%`,transition:"width .4s"}}/>
                  </div>
                  <span style={{color:C.muted,fontSize:10,width:16,textAlign:"right"}}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {reseñas.length===0&&<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Todavía no tenés reseñas.</div>}

          {/* Últimas reseñas */}
          {reseñas.slice(0,3).map(r=>(
            <div key={r.id} style={{...statStyle}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontWeight:600,color:C.text,fontSize:12}}>{r.autor_nombre||"Alumno"}</div>
                <span style={{color:C.accent,fontSize:11}}>{"★".repeat(r.estrellas||0)}</span>
              </div>
              <p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.5}}>{r.texto}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ESPACIO CLASE MODAL ──────────────────────────────────────────────────────
// chatPubId usa busqueda_id para evitar FK violation en mensajes
function EspacioClaseModal({oferta,session,onClose}){
  const miEmail=session.user.email;
  const soyDocente=oferta.ofertante_email===miEmail;
  const otroEmail=soyDocente?oferta.busqueda_autor_email:oferta.ofertante_email;
  const otroNombre=soyDocente?(oferta.busqueda_autor_nombre||safeDisplayName(null,otroEmail)):(oferta.ofertante_nombre||safeDisplayName(null,otroEmail));
  const [contenido,setContenido]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);
  const [editingContenidoId,setEditingContenidoId]=useState(null);
  const [nuevoTipo,setNuevoTipo]=useState("texto");
  const [nuevoTitulo,setNuevoTitulo]=useState("");
  const [nuevoBody,setNuevoBody]=useState("");
  const [savingC,setSavingC]=useState(false);
  const pageRef=useRef(null);
  const chatPubId=oferta.busqueda_id||oferta.id;
  useEffect(()=>{
    if(pageRef.current)pageRef.current.scrollTop=0;
    sb.getContenido(oferta.id,session.access_token)
      .then(r=>setContenido(r||[])).catch(()=>{}).finally(()=>setLoading(false));
  },[oferta.id,session.access_token]);// eslint-disable-line
  const addC=async()=>{
    if(!nuevoTitulo.trim())return;setSavingC(true);
    try{
      const d={publicacion_id:oferta.id,tipo:nuevoTipo,titulo:nuevoTitulo.trim(),orden:contenido.length+1};
      if(nuevoTipo==="link"||nuevoTipo==="video")d.url=nuevoBody.trim();else d.texto=nuevoBody.trim()||null;
      const r=await sb.insertContenido(d,session.access_token);
      setContenido(p=>[...p,...(Array.isArray(r)?r:[r])]);
      setNuevoTitulo("");setNuevoBody("");setShowAdd(false);
    }catch(e){alert(e.message);}finally{setSavingC(false);}
  };
  const removeC=async(id)=>{try{await sb.deleteContenido(id,session.access_token);setContenido(p=>p.filter(x=>x.id!==id));}catch(e){alert(e.message);}};
  const TM={video:{ic:"▶",col:C.info,l:"Video"},archivo:{ic:"↓",col:C.success,l:"Archivo"},texto:{ic:"≡",col:C.text,l:"Texto"},aviso:{ic:"!",col:C.accent,l:"Aviso"},tarea:{ic:"★",col:C.purple,l:"Tarea"},link:{ic:"↗",col:C.info,l:"Link"}};
  const iS2={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:8};
  return(
    <div ref={pageRef} style={{position:"fixed",inset:0,background:C.bg,zIndex:300,overflowY:"auto",fontFamily:FONT}}>
      <div style={{position:"sticky",top:0,zIndex:10,background:C.sidebar,borderBottom:`1px solid ${C.border}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <button onClick={onClose} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>← Volver</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,color:C.text,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{oferta.busqueda_titulo||"Clase particular"}</div>
          <div style={{fontSize:11,color:C.muted}}>{oferta.busqueda_materia&&<span style={{color:C.accent,fontWeight:600,marginRight:6}}>{oferta.busqueda_materia}</span>}{soyDocente?"Alumno":"Docente"}: {otroNombre}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {oferta.precio&&<span style={{fontSize:12,color:C.accent,fontWeight:700,background:C.accentDim,borderRadius:8,padding:"4px 10px"}}>{fmtPrice(oferta.precio)}/{oferta.precio_tipo||"hora"}</span>}
          <span style={{fontSize:11,background:"#4ECB7115",color:C.success,border:"1px solid #4ECB7133",borderRadius:20,padding:"3px 10px",fontWeight:700}}>Acordada</span>
        </div>
      </div>
      <div style={{maxWidth:760,margin:"0 auto",padding:"24px 20px"}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 20px",marginBottom:20}}>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <Avatar letra={(otroNombre||"?")[0]} size={44}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,color:C.text,fontSize:15,marginBottom:2}}>{otroNombre}</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:5}}>{otroEmail}</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                <span style={{fontSize:11,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"2px 9px",color:C.muted}}>{soyDocente?"Sos el docente":"Sos el alumno"}</span>
                {oferta.precio&&<span style={{fontSize:12,color:C.accent,fontWeight:700}}>{fmtPrice(oferta.precio)}/{oferta.precio_tipo||"hora"}</span>}
              </div>
            </div>
          </div>
          {oferta.mensaje&&<div style={{marginTop:12,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px"}}><div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1,marginBottom:3,textTransform:"uppercase"}}>Mensaje original</div><p style={{color:C.muted,fontSize:13,margin:0,lineHeight:1.6}}>{oferta.mensaje}</p></div>}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 20px",marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div><div style={{fontWeight:700,color:C.text,fontSize:14}}>Material de clases</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{soyDocente?"Subí el material para tu alumno":"Material compartido por el docente"}</div></div>
            {soyDocente&&<button onClick={()=>setShowAdd(v=>!v)} style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:8,color:C.accent,padding:"6px 13px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:700}}>{showAdd?"Cancelar":"+ Agregar"}</button>}
          </div>
          {soyDocente&&showAdd&&(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:14}}>
              <div style={{display:"flex",gap:5,marginBottom:9,flexWrap:"wrap"}}>
                {Object.entries(TM).map(([v,m])=><button key={v} onClick={()=>setNuevoTipo(v)} style={{padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:FONT,background:nuevoTipo===v?C.accent:C.surface,color:nuevoTipo===v?"#fff":C.muted,border:`1px solid ${nuevoTipo===v?"transparent":C.border}`}}>{m.l}</button>)}
              </div>
              <input value={nuevoTitulo} onChange={e=>setNuevoTitulo(e.target.value)} placeholder="Título" style={iS2}/>
              <textarea value={nuevoBody} onChange={e=>setNuevoBody(e.target.value)} placeholder={nuevoTipo==="link"||nuevoTipo==="video"?"URL del enlace":"Texto (opcional)"} style={{...iS2,minHeight:65,resize:"vertical"}}/>
              <Btn onClick={addC} disabled={savingC||!nuevoTitulo.trim()} style={{width:"100%",padding:"8px"}}>{savingC?"Guardando...":"Agregar"}</Btn>
            </div>
          )}
          {loading?<Spinner/>:contenido.length===0?(
            <div style={{textAlign:"center",padding:"30px 0",color:C.muted}}><div style={{fontSize:20,marginBottom:6,color:C.border}}>◎</div><div style={{fontSize:13}}>{soyDocente?"Usá + Agregar para subir material.":"El docente aún no subió material."}</div></div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {contenido.map((item,i)=>{const m=TM[item.tipo]||{ic:"·",col:C.text};return(
                <div key={item.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 15px"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:C.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:m.col,fontWeight:700,border:`1px solid ${C.border}`,flexShrink:0}}>{m.ic}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,color:m.col,fontSize:13,marginBottom:2}}>{i+1}. {item.titulo}</div>
                      {item.tipo==="texto"&&item.texto&&<p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.6}}>{item.texto}</p>}
                      {item.tipo==="aviso"&&item.texto&&<p style={{color:C.accent,fontSize:12,margin:0,background:C.accentDim,borderRadius:7,padding:"6px 9px"}}>{item.texto}</p>}
                      {item.tipo==="tarea"&&item.texto&&<p style={{color:C.purple,fontSize:12,margin:0,background:"#C85CE015",borderRadius:7,padding:"6px 9px"}}>{item.texto}</p>}
                      {(item.tipo==="video"||item.tipo==="link"||item.tipo==="archivo")&&item.url&&<a href={item.url} target="_blank" rel="noreferrer" style={{color:C.info,fontSize:12,textDecoration:"none"}}>{item.tipo==="video"?"▶ Ver":item.tipo==="archivo"?"↓ Abrir":"↗ Link"}</a>}
                    </div>
                    {soyDocente&&<button onClick={()=>removeC(item.id)} style={{background:"none",border:"none",color:C.danger,fontSize:16,cursor:"pointer",flexShrink:0,lineHeight:1}}>×</button>}
                  </div>
                </div>
              );})}
            </div>
          )}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
          <EspacioChat pubId={chatPubId} miEmail={miEmail} miId={session.user.id} otroEmail={otroEmail} otroNombre={otroNombre} session={session}/>
        </div>
      </div>
    </div>
  );
}

// ─── ESPACIO CHAT ─────────────────────────────────────────────────────────────
function EspacioChat({pubId,miEmail,miId,otroEmail,otroNombre,session}){
  const [msgs,setMsgs]=useState([]);const [loading,setLoading]=useState(true);
  const [texto,setTexto]=useState("");const [sending,setSending]=useState(false);
  const bottomRef=useRef(null);
  const cargar=useCallback(async()=>{
    try{const all=await sb.getMensajes(pubId,miEmail,otroEmail,session.access_token);setMsgs(all||[]);await sb.marcarLeidos(pubId,miEmail,session.access_token);}catch{}finally{setLoading(false);}
  },[pubId,miEmail,otroEmail,session.access_token]);// eslint-disable-line
  useEffect(()=>{cargar();const t=setInterval(cargar,6000);return()=>clearInterval(t);},[cargar]);
  useEffect(()=>{if(bottomRef.current)bottomRef.current.scrollIntoView({behavior:"smooth"});},[msgs]);
  const enviar=async()=>{
    if(!texto.trim())return;setSending(true);const txt=texto.trim();setTexto("");
    try{
      await sb.insertMensaje({publicacion_id:pubId,de_usuario:miId,para_usuario:null,de_nombre:miEmail,para_nombre:otroEmail,texto:txt,leido:false},session.access_token);
      await cargar();
    }catch(e){alert(e.message);setTexto(txt);}finally{setSending(false);}
  };
  return(
    <div>
      <div style={{padding:"13px 18px",borderBottom:`1px solid ${C.border}`,fontWeight:700,color:C.text,fontSize:13,display:"flex",alignItems:"center",gap:7}}>
        <span style={{width:7,height:7,borderRadius:"50%",background:C.success,display:"inline-block"}}/>Chat con {otroNombre}
      </div>
      <div style={{height:280,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:8}}>
        {loading&&msgs.length===0?<Spinner small/>:msgs.length===0?<div style={{textAlign:"center",color:C.muted,fontSize:12,marginTop:30}}>Iniciá la conversación.</div>:null}
        {msgs.map(m=>{const mio=m.de_nombre===miEmail;return(
          <div key={m.id} style={{display:"flex",justifyContent:mio?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"76%",background:mio?C.accent:C.surface,color:mio?"#fff":C.text,borderRadius:mio?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"8px 12px",fontSize:13,lineHeight:1.5}}>
              {sanitizeContactInfo(m.texto)}
              <div style={{fontSize:10,color:mio?"rgba(255,255,255,.6)":C.muted,marginTop:2,textAlign:"right"}}>{new Date(m.created_at).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}</div>
            </div>
          </div>
        );})}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"11px 14px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
        <input value={texto} onChange={e=>setTexto(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();enviar();}}} placeholder="Escribí un mensaje..." style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 13px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT}}/>
        <button onClick={enviar} disabled={sending||!texto.trim()} style={{background:C.accent,border:"none",borderRadius:10,color:"#fff",padding:"9px 16px",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:FONT,opacity:!texto.trim()||sending?0.45:1}}>→</button>
      </div>
    </div>
  );
}

// ─── BÚSQUEDAS CONFIRM LIST — lista de búsquedas con popup de confirmación ──────
function BusquedasConfirmList({busquedas,ofertasMap,session,toggle,toggling,onEdit,setOfertasModal,remove}){
  const [confirmBusq,setConfirmBusq]=useState(null);
  const handleEliminarBusq=async(p)=>{
    let ofertanteAcept=null;
    try{const todas=await sb.getOfertasSobre(p.id,session.access_token);const ac=todas.find(o=>o.estado==="aceptada");if(ac)ofertanteAcept={nombre:ac.ofertante_nombre||ac.ofertante_safeDisplayName(null,email),email:ac.ofertante_email};}catch{}
    setConfirmBusq({p,ofertanteAcept});
  };
  const confirmarEliminar=async()=>{
    const p=confirmBusq.p;
    if(confirmBusq.ofertanteAcept?.email){
      sb.insertNotificacion({usuario_id:null,alumno_email:confirmBusq.ofertanteAcept.email,tipo:"busqueda_eliminada",publicacion_id:p.id,pub_titulo:p.titulo,leida:false},session.access_token).catch(()=>{});
    }
    setConfirmBusq(null);
    await remove(p);
  };
  return(
    <>
    <div style={{display:"grid",gap:12}}>
      {busquedas.map(p=>{
        const cnt=ofertasMap[p.id]||0;
        return(<div key={p.id} style={{background:C.surface,border:`1px solid ${cnt>0?C.accent:C.border}`,borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,width:"100%",height:3,background:p.activo!==false?C.accent:C.muted}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
            <div style={{flex:1,minWidth:0}}>
              {cnt>0&&<div style={{display:"inline-flex",alignItems:"center",gap:5,background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:20,padding:"3px 10px",marginBottom:8,fontSize:11,color:C.accent,fontWeight:700}}>{cnt} oferta{cnt!==1?"s":""} nueva{cnt!==1?"s":""}</div>}
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}><Tag tipo={p.tipo}/><StatusBadge activo={p.activo!==false} finalizado={!!p.finalizado}/></div>
              <h3 style={{color:C.text,fontSize:13,fontWeight:700,margin:"0 0 3px"}}>{p.titulo}</h3>
              <p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.4}}>{p.descripcion?.slice(0,90)}</p>
              {p.created_at&&<div style={{marginTop:4,fontSize:11,color:C.muted}}>Publicado {fmt(p.created_at)}</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0,minWidth:95}}>
              <button onClick={()=>setOfertasModal(p)} style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:8,color:C.accent,padding:"5px 8px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:FONT}}>Ver ofertas{cnt>0?` (${cnt})`:""}</button>
              <button onClick={()=>onEdit(p)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"5px 8px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:FONT}}>Editar</button>
              <button onClick={()=>toggle(p)} disabled={toggling===p.id} style={{background:p.activo!==false?"#E0955C15":"#4ECB7115",border:`1px solid ${p.activo!==false?"#E0955C33":"#4ECB7133"}`,borderRadius:8,color:p.activo!==false?C.warn:C.success,padding:"5px 8px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:FONT,opacity:toggling===p.id?0.5:1}}>{toggling===p.id?"...":(p.activo!==false?"Pausar":"Activar")}</button>
              <button onClick={()=>handleEliminarBusq(p)} style={{background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:8,color:C.danger,padding:"5px 8px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>Eliminar</button>
            </div>
          </div>
        </div>);
      })}
    </div>
    {confirmBusq&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:FONT}} onClick={()=>setConfirmBusq(null)}>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:"28px",width:"min(400px,92vw)",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:42,marginBottom:12,color:C.danger,fontWeight:300}}>×</div>
          <h3 style={{color:C.text,fontSize:17,fontWeight:700,margin:"0 0 8px"}}>¿Eliminar búsqueda?</h3>
          {confirmBusq.ofertanteAcept&&(
            <div style={{background:"#E0955C15",border:"1px solid #E0955C33",borderRadius:10,padding:"10px 13px",marginBottom:12,fontSize:12,color:C.warn,textAlign:"left"}}>
              ⚠️ <strong style={{color:C.text}}>{confirmBusq.ofertanteAcept.nombre}</strong> tiene una oferta aceptada. Se le notificará al eliminar.
            </div>
          )}
          <p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:"0 0 22px"}}>Se eliminará <strong style={{color:C.text}}>"{confirmBusq.p.titulo}"</strong> y todas las ofertas recibidas. Esta acción no se puede deshacer.</p>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setConfirmBusq(null)} style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,borderRadius:11,color:C.muted,padding:"10px",cursor:"pointer",fontSize:13,fontFamily:FONT,fontWeight:600}}>Cancelar</button>
            <button onClick={confirmarEliminar} style={{flex:1,background:C.danger,border:"none",borderRadius:11,color:"#fff",padding:"10px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:FONT}}>Sí, eliminar</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ─── CONTRA RESPONDEDOR — lado docente ante contraoferta del alumno ─────────────
function ContraRespondedor({oferta,session,onActualizado,onVer}){
  const [popup,setPopup]=useState(false);
  const [modo,setModo]=useState("ver");// "ver" | "contra"
  const [precio,setPrecio]=useState("");
  const [tipo,setTipo]=useState(oferta.precio_tipo||"hora");
  const [msg,setMsg]=useState("");
  const [saving,setSaving]=useState(false);

  const cerrar=()=>{setPopup(false);setModo("ver");setPrecio("");setMsg("");};

  const aceptar=async()=>{
    setSaving(true);
    try{
      await sb.updateOfertaBusq(oferta.id,{estado:"aceptada",precio:oferta.contraoferta_precio,precio_tipo:oferta.contraoferta_tipo||oferta.precio_tipo,leida:true},session.access_token);
      // Crear publicación de clase con estado pendiente desde la oferta aceptada
      // (el espacio de clase se crea automaticamente al aceptar — ya existe EspacioClaseModal)
      // Solo marcar la búsqueda original como pendiente
      // Crear clase con estado pendiente al aceptar oferta
      if(oferta.busqueda_id){
        await sb.updatePublicacion(oferta.busqueda_id,{activo:false},session.access_token).catch(()=>{});
        // Crear la oferta como publicación pendiente de validación
        const claseData={
          tipo:"oferta",modo:"particular",
          titulo:oferta.busqueda_titulo||"Clase acordada",
          descripcion:`Clase acordada a través de ClasseLink.`,
          autor_id:session.user.id,
          activo:false,
          precio:oferta.precio||oferta.contraoferta_precio,
          precio_tipo:oferta.precio_tipo||"hora",
          moneda:oferta.moneda||"ARS",
          materia:oferta.busqueda_materia||"General",
        };
        await sb.insertPublicacion(claseData,session.access_token).catch(()=>{});
      }
      sb.insertNotificacion({usuario_id:null,alumno_email:oferta.busqueda_autor_email,tipo:"oferta_aceptada",publicacion_id:oferta.busqueda_id,pub_titulo:oferta.busqueda_titulo,leida:false},session.access_token).catch(()=>{});
      sb.insertNotificacion({usuario_id:null,alumno_email:oferta.busqueda_autor_email,tipo:"busqueda_acordada",publicacion_id:oferta.busqueda_id,pub_titulo:oferta.busqueda_titulo,leida:false},session.access_token).catch(()=>{});
      await sb.updatePublicacion(oferta.busqueda_id,{activo:false},session.access_token).catch(()=>{});
      cerrar();onActualizado();
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const rechazar=async()=>{
    setSaving(true);
    try{
      await sb.updateOfertaBusq(oferta.id,{estado:"rechazada",leida:true},session.access_token);
      cerrar();onActualizado();
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const enviarContra=async()=>{
    if(!precio)return;setSaving(true);
    try{
      await sb.updateOfertaBusq(oferta.id,{contraoferta_precio:parseFloat(precio),contraoferta_tipo:tipo,contraoferta_mensaje:msg,contraoferta_de:"docente",leida:false},session.access_token);
      sb.insertNotificacion({usuario_id:null,alumno_email:oferta.busqueda_autor_email,tipo:"contraoferta",publicacion_id:oferta.busqueda_id,pub_titulo:oferta.busqueda_titulo,leida:false},session.access_token).catch(()=>{});
      cerrar();onActualizado();
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };

  const iS={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:9};

  return(
    <>
      {/* Badge compacto que abre el popup */}
      <span onClick={()=>{setPopup(true);if(onVer)onVer();}} style={{fontSize:10,fontWeight:700,color:"#C85CE0",background:"#C85CE015",border:"1px solid #C85CE033",borderRadius:20,padding:"3px 10px",cursor:"pointer",flexShrink:0,alignSelf:"center",whiteSpace:"nowrap"}}>
        ↔ Ver contraoferta
      </span>

      {popup&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:FONT}} onClick={cerrar}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:"26px 28px",width:"min(440px,94vw)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>Contraoferta recibida</h3>
              <button onClick={cerrar} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>×</button>
            </div>

            {/* Info de la búsqueda */}
            <div style={{background:C.card,borderRadius:10,padding:"10px 13px",marginBottom:14}}>
              <div style={{fontSize:12,color:C.muted}}>{oferta.busqueda_titulo||"Búsqueda"}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>Tu oferta original: <span style={{color:C.accent,fontWeight:600}}>{fmtPrice(oferta.precio)} /{oferta.precio_tipo}</span></div>
            </div>

            {/* La contraoferta */}
            <div style={{background:"#C85CE011",border:"1px solid #C85CE033",borderRadius:10,padding:"12px 15px",marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:"#C85CE0",marginBottom:6}}>↔ Propuesta del alumno</div>
              <div style={{fontSize:18,color:C.accent,fontWeight:700,marginBottom:4}}>{fmtPrice(oferta.contraoferta_precio)} <span style={{fontSize:13,fontWeight:400,color:C.muted}}>/{oferta.contraoferta_tipo||oferta.precio_tipo}</span></div>
              {oferta.contraoferta_mensaje&&<p style={{color:C.muted,fontSize:13,margin:0,lineHeight:1.5}}>{oferta.contraoferta_mensaje}</p>}
            </div>

            {modo==="ver"&&(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <button onClick={aceptar} disabled={saving} style={{background:"#4ECB7122",border:"1px solid #4ECB7144",borderRadius:10,color:C.success,padding:"11px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:FONT,opacity:saving?0.5:1}}>
                  ✓ Aceptar {fmtPrice(oferta.contraoferta_precio)} /{oferta.contraoferta_tipo||oferta.precio_tipo}
                </button>
                <button onClick={()=>setModo("contra")} disabled={saving} style={{background:"#C85CE015",border:"1px solid #C85CE033",borderRadius:10,color:"#C85CE0",padding:"11px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:FONT}}>
                  ↔ Volver a ofertar
                </button>
                <button onClick={rechazar} disabled={saving} style={{background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:10,color:C.danger,padding:"11px",cursor:"pointer",fontSize:13,fontFamily:FONT,opacity:saving?0.5:1}}>
                  ✗ Rechazar
                </button>
              </div>
            )}

            {modo==="contra"&&(
              <div>
                <Label>Tu nueva propuesta de precio</Label>
                <div style={{display:"flex",gap:7,marginBottom:9}}>
                  <input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Monto" type="number" min="0" style={{...iS,margin:0,flex:2}}/>
                  <select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...iS,margin:0,flex:1,cursor:"pointer",colorScheme:localStorage.getItem("cl_theme")||"light"}}>
                    <option value="hora">/ hora</option>
                    <option value="clase">/ clase</option>
                    <option value="mes">/ mes</option>
                  </select>
                </div>
                <Label>Mensaje (opcional)</Label>
                <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Explicá tu propuesta..." style={{...iS,minHeight:70,resize:"vertical"}}/>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setModo("ver")} style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,padding:"10px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>← Volver</button>
                  <Btn onClick={enviarContra} disabled={saving||!precio} style={{flex:2,padding:"10px"}}>{saving?"Enviando...":"Enviar contraoferta →"}</Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── MI CUENTA PAGE — perfil + credenciales + gestión de publicaciones ─────────
function MiCuentaPage({session,onOpenDetail,onOpenCurso,onEdit,onNew,onOpenChat,onRefreshOfertas,onClearBadge}){
  const [secExpanded,setSecExpanded]=useState({pubs:true,inscripciones:true,stats:false,ofertas:true,busquedas:true});
  const toggleSec=(k)=>setSecExpanded(p=>({...p,[k]:!p[k]}));
  const SecHeader=({label,k,badge})=>(<div onClick={()=>toggleSec(k)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",padding:"2px 0",marginBottom:secExpanded[k]?10:0}}><div style={{fontWeight:700,color:C.text,fontSize:14,display:"flex",alignItems:"center",gap:7}}>{label}{badge>0&&<span style={{fontSize:10,background:C.accentDim,color:C.accent,borderRadius:20,padding:"1px 7px",border:`1px solid ${C.accent}33`}}>{badge}</span>}</div><span style={{color:C.muted,fontSize:13,transition:"transform .2s",transform:secExpanded[k]?"rotate(0deg)":"rotate(-90deg)",display:"inline-block"}}>▾</span></div>);
  const [pubs,setPubs]=useState([]);const [reseñas,setReseñas]=useState([]);const [docs,setDocs]=useState([]);const [loading,setLoading]=useState(true);
  const [toggling,setToggling]=useState(null);const [ofertasMap,setOfertasMap]=useState({});const [ofertasModal,setOfertasModal]=useState(null);
  const [misOfertasEnv,setMisOfertasEnv]=useState(()=>{
    // Cargar desde localStorage para persistencia entre refreshes
    try{return JSON.parse(localStorage.getItem("cl_ofertas_env_"+session.user.email)||"[]");}catch{return [];}
  });
  const [ofertasAceptRec,setOfertasAceptRec]=useState([]);
  const [espacioModal,setEspacioModal]=useState(null);
  const [acuerdoModal,setAcuerdoModal]=useState(null);
  const [descartadas,setDescartadas]=useState(()=>{try{return JSON.parse(localStorage.getItem("ofertasDescartadas_"+session.user.email)||"[]");}catch{return [];}});
  const descartarOferta=(id)=>{const nd=[...descartadas,id];setDescartadas(nd);try{localStorage.setItem("ofertasDescartadas_"+session.user.email,JSON.stringify(nd));}catch{}};
  // Vistas de novedades (aceptadas/rechazadas/contra) - como state para re-render inmediato
  const vistasKey2=`ofertasAceptadasVistas_${session.user.email}`;
  const [vistasState,setVistasState]=useState(()=>{try{return JSON.parse(localStorage.getItem(vistasKey2)||"[]");}catch{return [];}});
  // Al montar, limpiar el badge de Mi cuenta
  useEffect(()=>{if(onClearBadge)onClearBadge();},[]);// eslint-disable-line
  // Credenciales
  const [showAddDoc,setShowAddDoc]=useState(false);
  const [docTipo,setDocTipo]=useState("titulo");const [docTitulo,setDocTitulo]=useState("");const [docInst,setDocInst]=useState("");const [docAño,setDocAño]=useState("");const [docDesc,setDocDesc]=useState("");const [savingDoc,setSavingDoc]=useState(false);
  // Perfil edición
  const [editingPerfil,setEditingPerfil]=useState(false);
  const [displayName,setDisplayName]=useState(()=>{try{return localStorage.getItem("dn_"+session.user.email)||"";}catch{return "";}});
  const [bio,setBio]=useState("");
  const [ubicacionPerfil,setUbicacionPerfil]=useState("");
  const [savingDisplayName,setSavingDisplayName]=useState(false);
  const [perfilLoaded,setPerfilLoaded]=useState(false);
  // Cargar bio y ubicacion desde la tabla usuarios al montar
  useEffect(()=>{
    if(perfilLoaded)return;
    sb.getUsuarioByIdFull(session.user.id,session.access_token).then(u=>{
      if(u){if(u.bio)setBio(u.bio);if(u.ubicacion)setUbicacionPerfil(u.ubicacion);}
      setPerfilLoaded(true);
    }).catch(()=>setPerfilLoaded(true));
  },[session.user.id,session.access_token,perfilLoaded]);
  const [avatarColor2,setAvatarColor2]=useState("");
  const email=session.user.email;const uid=session.user.id;const nombre=sb.getDisplayName(email)||email.split("@")[0];
  const AVATAR_COLORS=["#F5C842","#4ECB71","#E05C5C","#5CA8E0","#C85CE0","#E0955C","#5CE0C8","#E05CA8"];
  const savedColor=localStorage.getItem("avatarColor_"+email);
  const currentColor=avatarColor2||savedColor||avatarColor(nombre[0]);
  const [inscritosMap,setInscritosMap]=useState({});
  const cargar=useCallback(async()=>{
    setLoading(true);
    try{
      const [p,r,d,ofertasRaw,misOEnv,ofAceptRec]=await Promise.all([
        sb.getMisPublicaciones(email,session.access_token).catch(()=>[]),
        sb.getReseñasByAutor(email,session.access_token).catch(()=>[]),
        sb.getDocumentos(email,session.access_token).catch(()=>[]),
        sb.getOfertasRecibidas(email,session.access_token).catch(()=>[]),
        sb.getMisOfertas(email,session.access_token).catch(()=>[]),
        sb.getOfertasAceptadasRecibidas(email,session.access_token).catch(()=>[])
      ]);
      const pubs2=p||[];setPubs(pubs2);setReseñas(r||[]);setDocs(d||[]);
      const map={};(ofertasRaw||[]).forEach(o=>{map[o.busqueda_id]=(map[o.busqueda_id]||0)+1;});setOfertasMap(map);
      setMisOfertasEnv(prev=>{
        // Merge: combinar las del servidor con las que ya teníamos (para no perder estado)
        const serverIds=new Set((misOEnv||[]).map(o=>o.id));
        const merged=[...(misOEnv||[]),...prev.filter(o=>!serverIds.has(o.id))];
        try{localStorage.setItem("cl_ofertas_env_"+email,JSON.stringify(merged));}catch{}
        return merged;
      });
      setOfertasAceptRec(ofAceptRec||[]);
      // Usar cantidad_inscriptos desnormalizado del schema v2 (evita N+1 requests)
      // Si no viene desnormalizado, fallback a fetch por publicación
      const ofertas2=pubs2.filter(pub=>pub.tipo==="oferta");
      const hayDesnorm=ofertas2.some(p=>p.cantidad_inscriptos!==undefined&&p.cantidad_inscriptos!==null);
      if(hayDesnorm){
        const imap={};ofertas2.forEach(pub=>{imap[pub.id]=parseInt(pub.cantidad_inscriptos)||0;});setInscritosMap(imap);
      } else {
        const inscCounts=await Promise.all(ofertas2.map(pub=>sb.getInscripciones(pub.id,session.access_token).catch(()=>[])));
        const imap={};ofertas2.forEach((pub,i)=>{imap[pub.id]=inscCounts[i].length;});setInscritosMap(imap);
      }
    }catch(e){console.error("cargar error",e);}finally{setLoading(false);}
  },[session,email]);
  useEffect(()=>{cargar();},[cargar]);
  const avg=calcAvg(reseñas);
  const toggle=async(post)=>{if(post.activo===false&&post.estado_validacion==="pendiente")return;setToggling(post.id);try{await sb.updatePublicacion(post.id,{activo:post.activo===false},session.access_token);await cargar();}catch(e){alert("Error: "+e.message);}finally{setToggling(null);}};
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
  const TIPOS_DOC=[{v:"titulo",l:"Título"},{v:"certificado",l:"Certificado"},{v:"experiencia",l:"Experiencia"},{v:"otro",l:"Otro"}];
  const TIPO_ICON={titulo:"🎓",certificado:"📜",experiencia:"💼",otro:"📄"};
  const iS={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:9,fontFamily:FONT};
  const ofertas=pubs.filter(p=>p.tipo==="oferta");
  const busquedas=pubs.filter(p=>p.tipo==="busqueda");
  const [tabCuenta,setTabCuenta]=useState("publicaciones");
  const [filtroPubsTipo,setFiltroPubsTipo]=useState("all");
  const pendientesVal=pubs.filter(p=>p.tipo==="oferta"&&p.activo===false&&p.estado_validacion==="pendiente");
  const totalOfertas=Object.values(ofertasMap).reduce((a,b)=>a+b,0);
  return(
    <div style={{fontFamily:FONT}}>

      {/* ── HEADER PERFIL LINKEDIN-STYLE ── */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
        {/* Banner */}
        <div style={{height:80,background:`linear-gradient(135deg,${C.accent}22,${C.accent}08)`,borderBottom:`1px solid ${C.border}`}}/>
        <div style={{padding:"0 24px 20px",position:"relative"}}>
          {/* Avatar flotante sobre el banner */}
          <div style={{position:"relative",display:"inline-block",marginTop:-30,marginBottom:10}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:currentColor,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:26,color:"#fff",fontFamily:FONT,border:`3px solid ${C.surface}`}}>{nombre[0].toUpperCase()}</div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <h2 style={{color:C.text,fontSize:18,fontWeight:700,margin:0}}>{displayName||nombre}</h2>
                <StreakBadge session={session}/>
              </div>
              {bio&&<p style={{color:C.muted,fontSize:13,margin:"4px 0 0",lineHeight:1.5}}>{bio}</p>}
              {ubicacionPerfil&&<div style={{color:C.muted,fontSize:12,marginTop:4}}>📍 {ubicacionPerfil}</div>}
              <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
                <span style={{fontSize:13,color:C.muted}}><span style={{color:C.text,fontWeight:600}}>{pubs.length}</span> publicaciones</span>
                <span style={{fontSize:13,color:C.muted}}><span style={{color:C.text,fontWeight:600}}>{reseñas.length}</span> reseñas</span>
                {avg&&<span style={{fontSize:13,color:"#B45309",fontWeight:600}}>★ {avg.toFixed(1)}</span>}
              </div>
            </div>
            <button onClick={()=>setEditingPerfil(v=>!v)}
              style={{background:"transparent",border:`1px solid ${C.accent}`,borderRadius:20,color:C.accent,padding:"7px 18px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:FONT,flexShrink:0,transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=C.accent;e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.accent;}}>
              Editar perfil
            </button>
          </div>
          {/* Form edición inline */}
          {editingPerfil&&(
            <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginTop:14}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:12}}>
                <div>
                  <Label>Nombre visible</Label>
                  <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder={nombre} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                </div>
                <div>
                  <Label>Ubicación</Label>
                  <input value={ubicacionPerfil} onChange={e=>setUbicacionPerfil(e.target.value)} placeholder="Ej: Buenos Aires" style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                </div>
              </div>
              <Label>Bio</Label>
              <div style={{position:"relative",marginBottom:12}}>
                <textarea value={bio} onChange={e=>setBio(e.target.value.slice(0,200))} placeholder="Contá algo sobre vos..." style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px 22px",color:C.text,fontSize:13,outline:"none",resize:"vertical",minHeight:60,boxSizing:"border-box",fontFamily:FONT}}/>
                <span style={{position:"absolute",bottom:6,right:10,fontSize:10,color:bio.length>=200?C.danger:C.muted}}>{bio.length}/200</span>
              </div>
              <Label>Color de avatar</Label>
              <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
                {AVATAR_COLORS.map(c=>(<button key={c} onClick={()=>saveColor(c)} style={{width:26,height:26,borderRadius:"50%",background:c,border:currentColor===c?`2.5px solid ${C.text}`:"2.5px solid transparent",cursor:"pointer",padding:0}}/>))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={async()=>{
                  const newName=(displayName||"").trim()||email.split("@")[0];
                  setSavingDisplayName(true);
                  try{
                    sb.setDisplayName(email,newName);
                    await sb.updateUsuario(uid,{display_name:newName,nombre:newName,bio:bio.trim()||null,ubicacion:ubicacionPerfil.trim()||null},session.access_token);
                    await sb.updateReseñasNombre(email,newName,session.access_token).catch(()=>{});
                    await sb.updateMensajesNombre(email,newName,session.access_token).catch(()=>{});
                    setEditingPerfil(false);
                  }catch(e){alert("Error: "+e.message);}
                  finally{setSavingDisplayName(false);}
                }} disabled={savingDisplayName} style={{background:C.accent,border:"none",borderRadius:20,color:"#fff",padding:"8px 20px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:FONT}}>
                  {savingDisplayName?"Guardando...":"Guardar cambios"}
                </button>
                <button onClick={()=>setEditingPerfil(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"8px 16px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ALERT VALIDACIONES PENDIENTES ── */}
      {pendientesVal.length>0&&(
        <div style={{background:C.warn+"10",border:`1px solid ${C.warn}35`,borderRadius:10,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20,flexShrink:0}}>⏳</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,color:C.warn,fontSize:13,marginBottom:4}}>
              {pendientesVal.length} publicación{pendientesVal.length!==1?"es":""}  pendiente{pendientesVal.length!==1?"s":""} de validación
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {pendientesVal.map(p=>(
                <button key={p.id} onClick={()=>onOpenCurso({...p,_openValidacion:true})}
                  style={{background:C.warn,border:"none",borderRadius:20,color:"#fff",padding:"4px 14px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT}}>
                  {p.titulo.slice(0,28)}{p.titulo.length>28?"...":""} →
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TABS DE NAVEGACIÓN ── */}
      <div style={{position:"relative",marginBottom:16}}>
      <style>{`.cl-tabs-fade::after{content:'';position:absolute;right:0;top:0;bottom:2px;width:40px;background:linear-gradient(to right,transparent,${C.surface});pointer-events:none;z-index:1}`}</style>
      <div className="cl-tabs-scroll cl-tabs-fade" style={{display:"flex",gap:0,borderBottom:`2px solid ${C.border}`,background:C.surface,borderRadius:"10px 10px 0 0",padding:"0 2px"}}>
        {[
          {id:"publicaciones",label:"Publicaciones",count:pubs.length},
          {id:"estadisticas",label:"Estadísticas",count:null},
          {id:"ofertas",label:"Actividad",count:(()=>{const visible=misOfertasEnv.filter(o=>!descartadas.includes(o.id));return visible.length||null;})()},
          {id:"credenciales",label:"Credenciales",count:docs.length||null},
          {id:"resenas",label:"Reseñas",count:reseñas.length||null},
        ].map(tab=>{
          const active=tabCuenta===tab.id;
          return(
            <button key={tab.id} onClick={()=>setTabCuenta(tab.id)}
              style={{padding:"12px 16px",border:"none",background:"transparent",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:active?600:400,
                color:active?C.accent:C.muted,borderBottom:`2px solid ${active?C.accent:"transparent"}`,marginBottom:-2,transition:"all .15s",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
              {tab.label}
              {tab.count!==null&&tab.count>0&&<span style={{fontSize:11,background:active?C.accentDim:C.bg,color:active?C.accent:C.muted,borderRadius:20,padding:"1px 7px",border:`1px solid ${active?C.accent+"33":C.border}`}}>{tab.count}</span>}
            </button>
          );
        })}
      </div>
      </div>

      {/* ── TAB: PUBLICACIONES ── */}
      {tabCuenta==="publicaciones"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:5}}>
              {[["all","Todo"],["oferta","Clases"],["busqueda","Búsquedas"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFiltroPubsTipo(v)}
                  style={{padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:filtroPubsTipo===v?600:400,cursor:"pointer",fontFamily:FONT,
                    background:filtroPubsTipo===v?C.accent:"transparent",color:filtroPubsTipo===v?"#fff":C.muted,
                    border:`1px solid ${filtroPubsTipo===v?C.accent:C.border}`,transition:"all .12s"}}>{l}
                  {v==="oferta"&&<span style={{marginLeft:4,opacity:.7}}>{pubs.filter(p=>p.tipo==="oferta").length}</span>}
                  {v==="busqueda"&&<span style={{marginLeft:4,opacity:.7}}>{pubs.filter(p=>p.tipo==="busqueda").length}</span>}
                </button>
              ))}
            </div>
            <Btn onClick={onNew} style={{padding:"7px 18px",fontSize:13,borderRadius:20}}>+ Nueva publicación</Btn>
          </div>
          {loading?<Spinner/>:(()=>{const pubsFiltradas=filtroPubsTipo==="all"?pubs:pubs.filter(p=>p.tipo===filtroPubsTipo);return pubsFiltradas.length===0?(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"40px 24px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>📋</div>
              <div style={{color:C.text,fontWeight:600,fontSize:15,marginBottom:8}}>Todavía no publicaste nada</div>
              <div style={{color:C.muted,fontSize:13,marginBottom:20}}>Creá tu primera clase o búsqueda para conectar con alumnos o docentes.</div>
              <Btn onClick={onNew} style={{borderRadius:20}}>Crear primera publicación</Btn>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {(filtroPubsTipo==="all"?pubs:pubs.filter(p=>p.tipo===filtroPubsTipo)).map(p=>(<div key={p.id}>
                {/* Banner clickeable → abre DetailPage */}
                <div onClick={()=>onOpenDetail(p)} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:"10px 10px 0 0",padding:"9px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,borderBottom:"none",transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.accentDim}
                  onMouseLeave={e=>e.currentTarget.style.background=C.bg}>
                  <span style={{fontSize:12,color:C.accent,fontWeight:600}}>Ver publicación →</span>
                  <span style={{fontSize:12,color:C.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titulo}</span>
                </div>
                <div style={{borderTop:"none"}}>
                  <MyPostCard post={p} session={session} onEdit={onEdit} onToggle={toggle} onDelete={remove} onOpenCurso={onOpenCurso} toggling={toggling} ofertasPendientes={ofertasMap[p.id]||0} inscriptos={inscritosMap[p.id]}/>
                </div>
                {ofertasMap[p.id]>0&&<button onClick={()=>setOfertasModal(p)} style={{width:"100%",marginTop:4,background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:"0 0 10px 10px",color:C.accent,padding:"7px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT}}>Ver {ofertasMap[p.id]} oferta{ofertasMap[p.id]!==1?"s":""} nueva{ofertasMap[p.id]!==1?"s":""} →</button>}
              </div>))}
            </div>
          );})()}
        </div>
      )}

      {/* ── TAB: ESTADÍSTICAS ── */}
      {tabCuenta==="estadisticas"&&(
        <div>
          {loading?<Spinner/>:<DocenteStats pubs={pubs} reseñas={reseñas} inscritosMap={inscritosMap}/>}
        </div>
      )}

      {/* ── TAB: ACTIVIDAD (ofertas enviadas + recibidas) ── */}
      {tabCuenta==="ofertas"&&(
        <div>
          {(()=>{
            const ofertasEnviadas=misOfertasEnv.filter(o=>!descartadas.includes(o.id));
            const ofertasAceptadasNuevas=ofertasAceptRec.filter(o=>!vistasState.includes(o.id));
            return(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {/* Ofertas recibidas */}
                {ofertasAceptadasNuevas.length>0&&(
                  <div style={{background:C.success+"08",border:`1px solid ${C.success}25`,borderRadius:10,padding:"14px 16px"}}>
                    <div style={{fontWeight:600,color:C.success,fontSize:14,marginBottom:10}}>✓ Ofertas aceptadas</div>
                    {ofertasAceptadasNuevas.map(o=>{
                      const soyDoc=o.busqueda_autor_email===email;
                      const otroN=soyDoc?(o.ofertante_nombre||safeDisplayName(null,o.ofertante_email)):(o.busqueda_autor_nombre||safeDisplayName(null,o.busqueda_autor_email));
                      const contraEsDeAlumno=o.contraoferta_de==="alumno";
                      return(<div key={o.id} style={{background:C.surface,borderRadius:9,padding:"12px 14px",marginBottom:8,border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Con: <span style={{color:C.text,fontWeight:600}}>{otroN}</span></div>
                        <div style={{fontSize:13,color:C.text,fontWeight:600,marginBottom:6}}>{o.busqueda_titulo}</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          {o.precio&&<span style={{fontSize:11,background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:6,padding:"2px 8px",color:C.accent,fontWeight:600}}>{fmtPrice(o.precio)}/{o.precio_tipo}</span>}
                          {o.contraoferta_precio&&(<><span style={{color:C.muted,fontSize:11}}>→</span><span style={{fontSize:11,background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:6,padding:"2px 7px",color:C.accent,fontWeight:600}}>Contra: {fmtPrice(o.contraoferta_precio)}/{o.contraoferta_tipo||o.precio_tipo}</span></>)}
                        </div>
                        <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
                          <Btn onClick={()=>onOpenChat({id:o.busqueda_id,autor_email:soyDoc?o.ofertante_email:o.busqueda_autor_email,titulo:o.busqueda_titulo,autor_nombre:otroN})} style={{padding:"6px 14px",fontSize:12,borderRadius:20}}>Chatear</Btn>
                          <button onClick={()=>setAcuerdoModal(o)} style={{background:"none",border:`1px solid ${C.success}`,borderRadius:20,color:C.success,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT}}>Ver acuerdo</button>
                          <button onClick={()=>{const nv=[...vistasState,o.id];setVistasState(nv);try{localStorage.setItem(vistasKey2,JSON.stringify(nv));}catch{}}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"6px 12px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>Marcar vista</button>
                        </div>
                      </div>);
                    })}
                  </div>
                )}
                {/* Mis ofertas enviadas en búsquedas */}
                {ofertasEnviadas.length>0&&(
                  <div>
                    <div style={{fontWeight:600,color:C.text,fontSize:14,marginBottom:10}}>Mis ofertas enviadas</div>
                    {ofertasEnviadas.map(o=>(
                      <div key={o.id} style={{background:C.surface,border:`1px solid ${o.estado==="aceptada"?C.success+"50":o.estado==="rechazada"?C.danger+"50":C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:3}}>{o.busqueda_titulo}</div>
                            <div style={{fontSize:12,color:C.muted}}>Para: {o.busqueda_autor_nombre||safeDisplayName(null,o.busqueda_autor_email)}</div>
                            {o.precio&&<div style={{fontSize:12,color:C.accent,fontWeight:600,marginTop:4}}>{fmtPrice(o.precio)}/{o.precio_tipo}</div>}
                          </div>
                          <span style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:20,flexShrink:0,
                            background:o.estado==="aceptada"?C.success+"12":o.estado==="rechazada"?C.danger+"12":"#F59E0B12",
                            color:o.estado==="aceptada"?C.success:o.estado==="rechazada"?C.danger:"#B45309",
                            border:`1px solid ${o.estado==="aceptada"?C.success+"30":o.estado==="rechazada"?C.danger+"30":"#F59E0B30"}`}}>
                            {o.estado==="aceptada"?"✓ Aceptada":o.estado==="rechazada"?"✕ Rechazada":o.estado==="retirada"?"Retirada":"Pendiente"}
                          </span>
                        </div>
                        <div style={{display:"flex",gap:7,marginTop:8,flexWrap:"wrap"}}>
                          {o.estado==="aceptada"&&<Btn onClick={()=>onOpenChat({id:o.busqueda_id,autor_email:o.busqueda_autor_email,titulo:o.busqueda_titulo,autor_nombre:o.busqueda_autor_nombre||safeDisplayName(null,o.busqueda_autor_email)})} style={{padding:"5px 14px",fontSize:12,borderRadius:20}}>Chatear</Btn>}
                          <button onClick={()=>descartarOferta(o.id)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"5px 12px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>Ocultar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {ofertasEnviadas.length===0&&ofertasAceptadasNuevas.length===0&&(
                  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"40px 24px",textAlign:"center",color:C.muted,fontSize:13}}>
                    No hay actividad de ofertas reciente.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── TAB: CREDENCIALES ── */}
      {tabCuenta==="credenciales"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:13,color:C.muted}}>Tus títulos y certificados son visibles en tu perfil público.</div>
            <button onClick={()=>setShowAddDoc(v=>!v)} style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:20,color:C.accent,padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:FONT}}>+ Agregar</button>
          </div>
          {showAddDoc&&(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginBottom:14}}>
              <Label>Tipo</Label>
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {TIPOS_DOC.map(({v,l})=>(<button key={v} onClick={()=>setDocTipo(v)} style={{padding:"6px 14px",borderRadius:20,fontSize:12,cursor:"pointer",background:docTipo===v?C.accent:"transparent",color:docTipo===v?"#fff":C.muted,border:`1px solid ${docTipo===v?C.accent:C.border}`,fontFamily:FONT,fontWeight:600,transition:"all .12s"}}>{l}</button>))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><Label>Título *</Label><input value={docTitulo} onChange={e=>setDocTitulo(e.target.value)} placeholder="Nombre del documento" style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/></div>
                <div><Label>Institución</Label><input value={docInst} onChange={e=>setDocInst(e.target.value)} placeholder="Opcional" style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/></div>
              </div>
              <input value={docAño} onChange={e=>setDocAño(e.target.value)} placeholder="Año (opcional)" style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box",marginBottom:10}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={addDoc} disabled={savingDoc||!docTitulo.trim()} style={{background:C.accent,border:"none",borderRadius:20,color:"#fff",padding:"8px 20px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:FONT,opacity:!docTitulo.trim()?0.5:1}}>{savingDoc?"Guardando...":"Guardar"}</button>
                <button onClick={()=>setShowAddDoc(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"8px 16px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>Cancelar</button>
              </div>
            </div>
          )}
          {loading?<Spinner/>:docs.length===0&&!showAddDoc?(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"40px 24px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>📜</div>
              <div style={{color:C.text,fontWeight:600,fontSize:15,marginBottom:8}}>Sin credenciales aún</div>
              <div style={{color:C.muted,fontSize:13}}>Agregar títulos aumenta la confianza de los alumnos en tu perfil.</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {docs.map(d=>(<div key={d.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:40,height:40,borderRadius:8,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{TIPO_ICON[d.tipo]||"📄"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,color:C.text,fontSize:14}}>{d.titulo}</div>
                  {d.institucion&&<div style={{color:C.muted,fontSize:12,marginTop:2}}>{d.institucion}</div>}
                  {d.año&&<div style={{color:C.muted,fontSize:11,marginTop:2}}>{d.año}</div>}
                  {d.descripcion&&<div style={{color:C.muted,fontSize:12,marginTop:6,lineHeight:1.5}}>{d.descripcion}</div>}
                </div>
                <button onClick={()=>removeDoc(d.id)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,cursor:"pointer",fontSize:12,padding:"4px 9px",flexShrink:0,transition:"all .12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color=C.danger;e.currentTarget.style.borderColor=C.danger;}} onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border;}}>Eliminar</button>
              </div>))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: RESEÑAS ── */}
      {tabCuenta==="resenas"&&(
        <div>
          {loading?<Spinner/>:reseñas.length===0?(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"40px 24px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>⭐</div>
              <div style={{color:C.text,fontWeight:600,fontSize:15,marginBottom:8}}>Sin reseñas aún</div>
              <div style={{color:C.muted,fontSize:13}}>Cuando finalices clases, tus alumnos podrán valorarte aquí.</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {reseñas.map(r=>(<div key={r.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
                  <Avatar letra={r.autor_nombre?.[0]||"?"} size={32}/>
                  <div>
                    <div style={{fontWeight:600,color:C.text,fontSize:13}}>{r.autor_nombre}</div>
                    <div style={{color:"#B45309",fontSize:12,marginTop:1}}>{"★".repeat(r.estrellas||0)}{"☆".repeat(5-(r.estrellas||0))}</div>
                  </div>
                  <div style={{marginLeft:"auto",fontSize:11,color:C.muted}}>{fmtRel(r.created_at)}</div>
                </div>
                {r.texto&&<p style={{color:C.muted,fontSize:13,margin:0,lineHeight:1.6}}>{r.texto}</p>}
              </div>))}
            </div>
          )}
        </div>
      )}
      {ofertasModal&&<OfertasRecibidasModal post={ofertasModal} session={session} onClose={()=>{setOfertasModal(null);cargar();if(onRefreshOfertas)onRefreshOfertas();}} onContactar={onOpenChat}/>}
      {espacioModal&&<EspacioClaseModal oferta={espacioModal} session={session} onClose={()=>setEspacioModal(null)}/>}
      {acuerdoModal&&<AcuerdoModal oferta={acuerdoModal} session={session} onClose={()=>setAcuerdoModal(null)} onConfirmado={()=>{cargar();setAcuerdoModal(null);}}/>}
    </div>
  );
}

// ─── ACUERDO FORMAL ────────────────────────────────────────────────────────────
// Muestra y permite confirmar el acuerdo cuando se acepta una oferta.
// Se llama desde OfertasRecibidasModal al aceptar, y desde MiCuentaPage para verlo.
function AcuerdoModal({oferta,session,onClose,onConfirmado}){
  const [precio,setPrecio]=useState(oferta.precio||"");
  const [formaPago,setFormaPago]=useState(oferta.forma_pago||"efectivo");
  const [frecuencia,setFrecuencia]=useState(oferta.frecuencia||"");
  const [notas,setNotas]=useState(oferta.notas_acuerdo||"");
  const [saving,setSaving]=useState(false);
  const [confirmado,setConfirmado]=useState(!!(oferta.acuerdo_confirmado));
  const miEmail=session.user.email;
  // _rol viene del contexto: "docente"=yo soy el ofertante, "alumno"=yo soy el dueño de la búsqueda
  const soyDocente=oferta._rol?oferta._rol==="docente":(oferta.ofertante_email===miEmail);

  const FORMAS=[
    {v:"efectivo",l:"Efectivo"},
    {v:"transferencia",l:"Transferencia"},
    {v:"mercadopago",l:"Mercado Pago"},
    {v:"otro",l:"Otro / A convenir"},
  ];
  const FRECUENCIAS=[
    {v:"por_clase",l:"Por clase"},
    {v:"semanal",l:"Semanal"},
    {v:"mensual",l:"Mensual"},
    {v:"total",l:"Pago único total"},
    {v:"a_convenir",l:"A convenir"},
  ];

  const guardar=async()=>{
    setSaving(true);
    try{
      await sb.updateOfertaBusq(oferta.id,{
        precio:precio?parseFloat(precio):null,
        forma_pago:formaPago,
        frecuencia:frecuencia||"a_convenir",
        notas_acuerdo:notas.trim()||null,
        acuerdo_confirmado:true,
        acuerdo_fecha:new Date().toISOString(),
      },session.access_token);
      // Notificar a la otra parte — resolver emails de ambos lados
      const otroEmail=soyDocente
        ?(oferta.busqueda_autor_email||oferta.alumno_email)
        :(oferta.ofertante_email);
      if(otroEmail){
        sb.insertNotificacion({
          usuario_id:null,
          alumno_email:otroEmail,
          tipo:"acuerdo_confirmado",
          publicacion_id:oferta.busqueda_id||oferta.id,
          pub_titulo:oferta.busqueda_titulo||oferta.titulo||"Clase",
          leida:false
        },session.access_token).catch(()=>{});
      }
      setConfirmado(true);
      if(onConfirmado)onConfirmado();
    }catch(e){alert("Error: "+e.message);}finally{setSaving(false);}
  };

  const iS={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:9};
  const fechaAcuerdo=oferta.acuerdo_fecha?new Date(oferta.acuerdo_fecha).toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):"";

  return(
    // Si ya está confirmado → modo lectura, se puede cerrar normalmente
    // Si está en proceso de firma → bloquear cierre accidental (no hay × ni click en backdrop)
    <Modal onClose={confirmado?onClose:null} width="min(520px,97vw)">
      <div style={{padding:"22px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <h3 style={{color:C.text,fontSize:17,fontWeight:700,margin:"0 0 4px"}}>Acuerdo de clase</h3>
            <p style={{color:C.muted,fontSize:12,margin:0}}>{oferta.busqueda_titulo||"Clase particular"}</p>
          </div>
          {/* × solo visible en modo lectura (ya confirmado) */}
          {confirmado&&<button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>}
        </div>

        {/* Partes */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1,marginBottom:4}}>DOCENTE</div>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <Avatar letra={(oferta.ofertante_nombre||oferta.ofertante_email||"?")[0]} size={26}/>
              <div>
                <div style={{color:C.text,fontSize:12,fontWeight:600}}>{oferta.ofertante_nombre||oferta.ofertante_safeDisplayName(null,email)}</div>
                <div style={{color:C.muted,fontSize:10}}>{oferta.ofertante_email}</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1,marginBottom:4}}>ESTUDIANTE</div>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <Avatar letra={(oferta.busqueda_autor_nombre||oferta.busqueda_autor_email||"?")[0]} size={26}/>
              <div>
                <div style={{color:C.text,fontSize:12,fontWeight:600}}>{oferta.busqueda_autor_nombre||safeDisplayName(oferta.busqueda_autor_nombre,oferta.busqueda_autor_email)}</div>
                <div style={{color:C.muted,fontSize:10}}>{oferta.busqueda_autor_email}</div>
              </div>
            </div>
          </div>
        </div>

        {confirmado?(
          /* Vista de solo lectura si ya está confirmado */
          <div>
            <div style={{background:"#4ECB7115",border:"1px solid #4ECB7133",borderRadius:12,padding:"14px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>✓</span>
              <div>
                <div style={{color:C.success,fontWeight:700,fontSize:13}}>Acuerdo confirmado</div>
                {fechaAcuerdo&&<div style={{color:C.muted,fontSize:11,marginTop:1}}>Firmado el {fechaAcuerdo}</div>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {precio&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px"}}>
                <div style={{color:C.muted,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:3}}>PRECIO</div>
                <div style={{color:C.accent,fontWeight:700,fontSize:16}}>{fmtPrice(precio)}</div>
              </div>}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px"}}>
                <div style={{color:C.muted,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:3}}>FORMA DE PAGO</div>
                <div style={{color:C.text,fontWeight:600,fontSize:13}}>{FORMAS.find(f=>f.v===oferta.forma_pago)?.l||oferta.forma_pago||"—"}</div>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px"}}>
                <div style={{color:C.muted,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:3}}>FRECUENCIA</div>
                <div style={{color:C.text,fontWeight:600,fontSize:13}}>{FRECUENCIAS.find(f=>f.v===oferta.frecuencia)?.l||oferta.frecuencia||"—"}</div>
              </div>
            </div>
            {oferta.notas_acuerdo&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",marginBottom:14}}>
              <div style={{color:C.muted,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:4}}>NOTAS</div>
              <p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.5}}>{oferta.notas_acuerdo}</p>
            </div>}
            <div style={{textAlign:"center",fontSize:11,color:C.muted,marginTop:4}}>Este acuerdo fue generado dentro de ClasseLink y no tiene valor legal externo.</div>
          </div>
        ):(
          /* Formulario de creación */
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:2}}>
              <div>
                <div style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:1,marginBottom:5,textTransform:"uppercase"}}>Precio</div>
                <input value={precio} onChange={e=>setPrecio(e.target.value)} type="number" min="0" placeholder="Ej: 5000" style={iS}/>
              </div>
              <div>
                <div style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:1,marginBottom:5,textTransform:"uppercase"}}>Frecuencia</div>
                <select value={frecuencia} onChange={e=>setFrecuencia(e.target.value)} style={{...iS,cursor:"pointer",colorScheme:localStorage.getItem("cl_theme")||"light"}}>
                  <option value="">Seleccioná</option>
                  {FRECUENCIAS.map(f=><option key={f.v} value={f.v}>{f.l}</option>)}
                </select>
              </div>
            </div>
            <div style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:1,marginBottom:5,textTransform:"uppercase"}}>Forma de pago</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:12}}>
              {FORMAS.map(f=>(
                <button key={f.v} onClick={()=>setFormaPago(f.v)} style={{padding:"6px 12px",borderRadius:20,fontSize:12,cursor:"pointer",fontFamily:FONT,background:formaPago===f.v?C.accent:C.surface,color:formaPago===f.v?"#fff":C.muted,border:`1px solid ${formaPago===f.v?C.accent:C.border}`,fontWeight:formaPago===f.v?700:400}}>
                  {f.l}
                </button>
              ))}
            </div>
            <div style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:1,marginBottom:5,textTransform:"uppercase"}}>Notas adicionales (opcional)</div>
            <textarea value={notas} onChange={e=>setNotas(e.target.value.slice(0,400))} placeholder="Horarios acordados, condiciones especiales, etc." style={{...iS,minHeight:65,resize:"vertical"}}/>
            <div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:10,padding:"10px 13px",marginBottom:14,fontSize:11,color:C.muted,lineHeight:1.6}}>
              Al confirmar, ambas partes quedan registradas en ClasseLink. Esto no tiene valor legal externo pero sirve como constancia dentro de la plataforma.
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={guardar} disabled={saving} style={{flex:1,padding:"11px",fontSize:14}}>
                {saving?"Guardando...":"✓ Confirmar acuerdo"}
              </Btn>
              <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:11,color:C.muted,padding:"11px 16px",cursor:"pointer",fontSize:13,fontFamily:FONT,flexShrink:0}}>Después</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── CHATBOT WIDGET — flotante abajo a la derecha ──────────────────────────────
function ChatBotWidget(){
  const [open,setOpen]=useState(false);const [msgs,setMsgs]=useState([{from:"bot",text:"¡Hola! 👋 Soy el asistente de ClasseLink. ¿En qué puedo ayudarte?"}]);
  const [input,setInput]=useState("");const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{if(open)endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,open]);
  const FAQS=[
    {q:"¿Cómo me inscribo a un curso?",a:"Abrí la publicación del curso y hacé clic en 'Ver curso'. Dentro de la página del curso encontrás el botón 'Inscribirme gratis'. Con eso tendrás acceso a todo el contenido al instante.",tags:["inscrib","curso","acceso","unirme","anotarme"]},
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
  const QUICK_ACTIONS=[
    {label:"¿Cómo me inscribo?",q:"¿Cómo me inscribo a un curso?"},
    {label:"¿Cómo publico?",q:"¿Cómo publico una clase?"},
    {label:"¿Cómo verifico mi perfil?",q:"¿Cómo verifico mi perfil?"},
    {label:"¿Cómo funciona el quiz?",q:"¿Cómo funciona el sistema de exámenes/quizzes?"},
    {label:"¿Cómo contacto al docente?",q:"¿Cómo contacto a un docente?"},
    {label:"¿Cómo cambio mi nombre?",q:"¿Cómo cambio mi nombre visible?"},
  ];
  const handleQuick=(quickQ)=>{setInput(quickQ);setTimeout(()=>sendMsg(quickQ),50);};
  const sendMsg=async(overrideQ)=>{
    const q=(overrideQ||input).trim();if(!q)return;
    setInput("");
    setMsgs(prev=>[...prev,{from:"user",text:q}]);
    setLoading(true);
    // Check FAQs first
    const faq=matchFaq(q);
    if(faq){setTimeout(()=>{setMsgs(prev=>[...prev,{from:"bot",text:faq.a}]);setLoading(false);},600);return;}
    // Use AI
    try{
      const SYSTEM_CHATBOT=`Sos el asistente de soporte de ClasseLink, una plataforma educativa argentina que conecta docentes y estudiantes.

FUNCIONES PRINCIPALES:
- Explorar: ver publicaciones de clases y búsquedas. Botón ✦ IA para búsqueda inteligente.
- Publicar: botón "+ Publicar". Elegís "Busco clases" o "Ofrezco clases". Los docentes se verifican respondiendo una pregunta de IA sobre su tema.
- Inscripción: abrís una publicación → Ver curso → Inscribirme gratis.
- Chat: disponible si estás inscripto o si el docente aceptó tu oferta.
- Favoritos: botón ★ en cada publicación.
- Ofertas: en búsquedas podés ofertar tus clases con precio y mensaje.
- Quiz/Exámenes: en la página del curso, tab "Exámenes". Multiple choice (nota automática) o Entregable (corregido por docente).
- Notas: tab "Notas" en el curso. Los alumnos ven sus notas, docentes ven tabla completa.
- Verificación: los docentes suman badge ✓ respondiendo una pregunta de IA al publicar.
- Mi cuenta: gestionar publicaciones, ver estadísticas, editar perfil y bio.
- Modo oscuro/claro: Mi cuenta → Editar perfil → botones Tema.

Respondé en español, de forma breve y amable. Si no podés resolver el problema en 2 intentos, sugerí contactar al soporte por WhatsApp.`;
      const text=await sb.callIA(SYSTEM_CHATBOT,q,350,"").catch(()=>"Lo siento, el asistente no está disponible en este momento.");
      // Mostrar siempre la opción de contacto humano junto a la respuesta de IA
      setMsgs(prev=>[...prev,{from:"bot",text:text},{from:"bot",text:"¿Necesitás ayuda de una persona?",action:true}]);
    }catch{
      setMsgs(prev=>[...prev,{from:"bot",text:"Lo siento, no pude procesar tu consulta en este momento."},{from:"bot",text:"Podés hablar con un representante:",action:true}]);
    }finally{setLoading(false);}
  };
  const openWhatsApp=()=>window.open("https://wa.me/5492345459787?text=Hola,%20necesito%20ayuda%20con%20ClasseLink","_blank");
  return(
    <div style={{position:"fixed",bottom:22,right:22,zIndex:500,fontFamily:FONT}} className="cl-chatbot-fab">
      <style>{`.cl-chatbot-fab{bottom:22px!important;right:22px!important}@media(max-width:768px){.cl-chatbot-fab{bottom:74px!important;right:14px!important}}`}</style>
      {open&&(
        <div style={{position:"absolute",bottom:64,right:0,width:"min(340px,88vw)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,boxShadow:"0 8px 32px #0008",display:"flex",flexDirection:"column",maxHeight:460,overflow:"hidden"}}>
          {/* Header */}
          <div style={{background:C.accent,borderRadius:"20px 20px 0 0",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <span style={{fontSize:20}}>🎓</span>
              <div><div style={{fontWeight:700,color:"#fff",fontSize:13}}>Soporte Luderis</div><div style={{fontSize:11,color:"rgba(255,255,255,.7)"}}>Responde al instante</div></div>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer"}}>×</button>
          </div>
          {/* Quick action buttons */}
          <div style={{padding:"10px 12px 0",display:"flex",gap:5,flexWrap:"wrap",borderBottom:`1px solid ${C.border}`}}>
            {QUICK_ACTIONS.slice(0,4).map((a,i)=>(<button key={i} onClick={()=>handleQuick(a.q)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"4px 9px",fontSize:10,cursor:"pointer",fontFamily:FONT,marginBottom:8}}>{a.label}</button>))}
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
                  <div style={{background:m.from==="user"?C.accent:C.card,color:m.from==="user"?"#fff":C.text,borderRadius:m.from==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"9px 13px",maxWidth:220,fontSize:12,lineHeight:1.5,border:`1px solid ${m.from==="user"?"transparent":C.border}`}}>{m.text}</div>
                )}
              </div>
            ))}
            {loading&&<div style={{display:"flex",gap:4,padding:"9px 13px",background:C.card,borderRadius:"16px 16px 16px 4px",width:50,border:`1px solid ${C.border}`}}>{[0,1,2].map(i=>(<div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.muted,animation:`bounce .8s ${i*.2}s infinite`}}/>))}</div>}
            <div ref={endRef}/>
          </div>
          {/* Input */}
          <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()} placeholder="Escribí tu pregunta..." style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"8px 13px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT}}/>
            <button onClick={()=>sendMsg()} disabled={!input.trim()||loading} style={{background:C.accent,border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:15,flexShrink:0,opacity:!input.trim()?0.5:1}}>↑</button>
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
  // Tema: fuerza re-render global al cambiar
  const [,forceThemeRender]=useState(0);
  // Exponer setter global para que MiCuentaPage lo llame
  window.__setAppTheme=(key)=>{applyTheme(key);forceThemeRender(n=>n+1);};
  const [showOnboarding,setShowOnboarding]=useState(()=>{try{const s=sb.loadSession();if(!s)return false;return!localStorage.getItem("cl_onboarding_done_"+s.user.email);}catch{return false;}});
  const [chatPost,setChatPost]=useState(null);const [detailPost,setDetailPost]=useState(null);const [cursoPost,setCursoPost]=useState(null);const [perfilEmail,setPerfilEmail]=useState(null);const [chatsKey,setChatsKey]=useState(0);
  const [page,setPageRaw]=useState(()=>{try{return sessionStorage.getItem("cl_page")||"explore";}catch{return "explore";}});
  const setPage=(p)=>{try{sessionStorage.setItem("cl_page",p);}catch{}setPageRaw(p);};
  const [showForm,setShowForm]=useState(false);const [editPost,setEditPost]=useState(null);const [myPostsKey,setMyPostsKey]=useState(0);
  const [unread,setUnread]=useState(0);const [ofertasCount,setOfertasCount]=useState(0);const [notifCount,setNotifCount]=useState(0);const [notifs,setNotifs]=useState([]);const [showNotifs,setShowNotifs]=useState(false);
  const [ofertasAceptadasNuevas,setOfertasAceptadasNuevas]=useState(0);
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
      sb.getNotificaciones(session.user.email,session.access_token).catch(()=>[]),
    ]).then(([msgs,ofertas,nfs])=>{
      const openId=chatPostRef.current?.id;
      const openOtro=chatPostRef.current?.autor_email;
      setUnread(msgs.filter(m=>m.de_nombre!==session.user.email&&!m.leido&&m.para_nombre!=="__grupo__"&&!(m.publicacion_id===openId&&(m.de_nombre===openOtro||m.para_nombre===openOtro))).length);
      setOfertasCount(ofertas.length);
      // Notifs para Mis inscripciones
      const notifsInsc=(nfs||[]).filter(n=>["valorar_curso","nuevo_ayudante","busqueda_acordada","nuevo_contenido"].includes(n.tipo));
      setNotifCount(notifsInsc.length);setNotifs(nfs||[]);
      // Badge Mi Cuenta: notifs de ofertas/contras/inscripciones recibidas
      const notifsCuenta=(nfs||[]).filter(n=>["oferta_aceptada","oferta_rechazada","contraoferta","nueva_oferta","nueva_inscripcion"].includes(n.tipo));
      setOfertasAceptadasNuevas(notifsCuenta.length);
    }).catch(()=>{});
  },[session]);
  useEffect(()=>{
    refreshUnread();
    let t=setInterval(refreshUnread,8000);
    // Share link handler — si viene ?pub=ID en la URL, abrir el popup
    try{
      const params=new URLSearchParams(window.location.search);
      const pubId=params.get("pub");
      if(pubId){
        window.history.replaceState({},"",window.location.pathname);
        sb.db(`publicaciones_con_autor?id=eq.${pubId}`,"GET",null,session.access_token)
          .then(r=>{if(r?.[0])setDetailPost(r[0]);}).catch(()=>{});
      }
    }catch{}
    const onVisibility=()=>{
      clearInterval(t);
      if(!document.hidden){
        refreshUnread(); // actualizar inmediatamente al volver
        t=setInterval(refreshUnread,8000);
      }
    };
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{clearInterval(t);document.removeEventListener("visibilitychange",onVisibility);};
  },[refreshUnread]);
  const PAGE_TITLES={explore:"Explorar — ClasseLink",chats:"Mis chats — ClasseLink",favoritos:"Favoritos — ClasseLink",inscripciones:"Mis clases — ClasseLink",cuenta:"Mi cuenta — ClasseLink"};
  useEffect(()=>{document.title=PAGE_TITLES[page]||"Luderis";},[page]);// eslint-disable-line
  const logout=()=>{sb.clearSession();setSession(null);};
  const openChat=(p)=>{chatPostRef.current=p;setChatPost(p);};
  const closeChat=()=>{chatPostRef.current=null;setChatPost(null);refreshUnread();setChatsKey(k=>k+1);};
  // Tema con estado React para re-render
  const [currentTheme,setCurrentTheme]=useState(_themeKey());
  const toggleTheme=()=>{const next=currentTheme==="light"?"dark":"light";applyTheme(next);setCurrentTheme(next);forceThemeRender(n=>n+1);};
  if(!session){
    const showAuth=window.location.hash==="#auth"||sessionStorage.getItem("ld_auth")==="1";
    const goAuth=()=>{sessionStorage.setItem("ld_auth","1");window.location.hash="#auth";forceThemeRender(n=>n+1);};
    if(!showAuth)return(<><style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}@keyframes fadeSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}*{box-sizing:border-box;margin:0;padding:0}html,body,#root{min-height:100vh;font-family:${FONT}}`}</style><LandingPage onEnter={goAuth}/></>);
    return(<><style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}@keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}html,body,#root{background:#F6F9FF;min-height:100vh;font-family:${FONT}}input,textarea,select{color-scheme:light;background-color:#F4F7FF!important;color:#0D1F3C!important}input::placeholder,textarea::placeholder{color:#A0AEC0;opacity:1}`}</style><AuthScreen onLogin={s=>{sessionStorage.removeItem("ld_auth");window.location.hash="";sb.saveSession(s);setSession(s);}}/></>);
  }
  const SW=isMobile?0:224;
  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:FONT,color:C.text,display:"flex"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes tabPulse{0%,100%{opacity:1}50%{opacity:0.5}}*{box-sizing:border-box}html,body,#root{background:${C.bg};color:${C.text};min-height:100vh;font-family:${FONT}}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}::-webkit-scrollbar-track{background:transparent}.cl-card-anim{animation:fadeUp .2s ease both}.cl-fade{animation:fadeIn .15s ease both}input,textarea,select{color-scheme:${_themeKey()==="light"?"light":"dark"};background-color:${C.surface}!important;color:${C.text}!important;border-color:${C.border}}input::placeholder,textarea::placeholder{color:${C.muted};opacity:1}input:focus,textarea:focus,select:focus{border-color:${C.accent}!important;outline:none}@media(max-width:768px){input,textarea,select{font-size:16px!important}.cl-hide-desk{display:none!important}button{-webkit-tap-highlight-color:transparent}}.cl-tabs-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.cl-tabs-scroll::-webkit-scrollbar{display:none}.cl-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:600px){.cl-grid-2{grid-template-columns:1fr!important}}.cl-row-wrap{display:flex;flex-wrap:wrap;gap:8px}`}</style>
      <Sidebar page={page} setPage={setPage} session={session} onLogout={logout} onNewPost={()=>{setEditPost(null);setShowForm(true);}} unreadCount={unread} ofertasCount={ofertasCount} notifCount={notifCount} ofertasAceptadasNuevas={ofertasAceptadasNuevas} mobile={isMobile} open={sidebarOpen} onClose={()=>setSidebarOpen(false)} theme={currentTheme} onToggleTheme={toggleTheme} onForceRender={()=>forceThemeRender(n=>n+1)}/>
      {isMobile&&(
        <>
          {/* Top bar mobile */}
          <div style={{position:"fixed",top:0,left:0,right:0,height:52,background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",zIndex:50,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",color:C.text,fontSize:20,cursor:"pointer",padding:"4px 6px",lineHeight:1}}>☰</button>
              <span style={{fontSize:16,fontWeight:700,color:C.text,letterSpacing:"-.3px",whiteSpace:"nowrap"}}>Luderis</span>
            </div>
            <Btn onClick={()=>{setEditPost(null);setShowForm(true);}} style={{padding:"6px 14px",fontSize:12,borderRadius:16}}>{t("newPost")}</Btn>
          </div>
          {/* Bottom navbar mobile — scroll horizontal con fade en los extremos */}
          <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,zIndex:50}}>
            <div style={{display:"flex",height:58,width:"100%"}}>
              {[
                {id:"explore",icon:"◎",label:t("explore"),badge:0},
                {id:"chats",icon:"▭",label:t("chats"),badge:unread},
                {id:"inscripciones",icon:"◉",label:t("classes"),badge:notifCount},
                {id:"cuenta",icon:"▢",label:t("account"),badge:ofertasAceptadasNuevas+ofertasCount},
              ].map(item=>(
                <button key={item.id} onClick={()=>setPage(item.id)}
                  style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"6px 0",position:"relative",fontFamily:FONT,borderTop:`2px solid ${page===item.id?C.accent:"transparent"}`,transition:"all .15s"}}>
                  <span style={{fontSize:20,color:page===item.id?C.accent:C.muted,lineHeight:1,transition:"color .15s"}}>{item.icon}</span>
                  <span style={{fontSize:10,color:page===item.id?C.accent:C.muted,fontWeight:page===item.id?600:400,whiteSpace:"nowrap",transition:"color .15s"}}>{item.label}</span>
                  {item.badge>0&&<span style={{position:"absolute",top:4,right:10,background:C.danger,color:"#fff",borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 4px",lineHeight:1.4}}>{item.badge>9?"9+":item.badge}</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <main style={{marginLeft:SW,flex:1,padding:isMobile?"62px 12px 70px":"24px 24px 24px",minHeight:"100vh",maxWidth:`calc(100vw - ${SW}px)`,background:C.bg}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          {page==="explore"&&<ExplorePage session={session} onOpenChat={openChat} onOpenDetail={setDetailPost} onOpenPerfil={setPerfilEmail} onOpenCurso={setCursoPost}/>}
          {page==="agenda"&&<AgendaPage session={session} onOpenCurso={setCursoPost}/>}
          {page==="chats"&&<ChatsPage key={chatsKey} session={session} onOpenChat={openChat}/>}
          {page==="favoritos"&&<FavoritosPage session={session} onOpenDetail={setDetailPost} onOpenChat={openChat} onOpenPerfil={setPerfilEmail}/>}
          {page==="inscripciones"&&<InscripcionesPage session={session} onOpenCurso={setCursoPost} onOpenChat={openChat} onMarkNotifsRead={()=>{sb.marcarNotifsTipoLeidas(session.user.email,["valorar_curso","nuevo_ayudante","busqueda_acordada","nuevo_contenido"],session.access_token).then(refreshUnread).catch(()=>{});}}/>}
          {page==="cuenta"&&<MiCuentaPage key={myPostsKey} session={session} onOpenDetail={setDetailPost} onOpenCurso={setCursoPost} onEdit={p=>{setEditPost(p);setShowForm(true);}} onNew={()=>{setEditPost(null);setShowForm(true);}} onOpenChat={openChat} onRefreshOfertas={refreshUnread} onClearBadge={()=>{
            setOfertasAceptadasNuevas(0);
            setOfertasCount(0);
            sb.marcarNotifsTipoLeidas(session.user.email,["oferta_aceptada","oferta_rechazada","contraoferta","nueva_oferta","nueva_inscripcion"],session.access_token).then(refreshUnread).catch(()=>{});
          }}/>}
        </div>
      </main>
      {chatPost&&<ChatModal post={chatPost} session={session} onClose={closeChat} onUnreadChange={refreshUnread}/>}
      {detailPost&&<DetailModal post={detailPost} session={session} onClose={()=>setDetailPost(null)} onChat={p=>{setDetailPost(null);openChat(p);}} onOpenCurso={p=>{setDetailPost(null);setCursoPost(p);}} onOpenPerfil={setPerfilEmail}/>}
      {cursoPost&&<CursoPage post={cursoPost} session={session} onClose={()=>setCursoPost(null)} onUpdatePost={p=>setCursoPost(p)}/>}
      {perfilEmail&&<PerfilPage autorEmail={perfilEmail} session={session} onClose={()=>setPerfilEmail(null)} onOpenDetail={(p)=>{setPerfilEmail(null);setTimeout(()=>setDetailPost(p),80);}}/>}
      {showForm&&<PostFormModal session={session} postToEdit={editPost} onClose={()=>{setShowForm(false);setEditPost(null);}}
  onSave={(newPub,meta)=>{
    setMyPostsKey(k=>k+1);
    if(newPub&&(meta?.esCursoNuevo||meta?.esParticularNuevo)){
      // Abrir CursoPage directo en tab validación
      setTimeout(()=>setCursoPost({...newPub,_openValidacion:true}),200);
    }
  }}/>}
      {showOnboarding&&session&&<OnboardingModal session={session} onClose={()=>setShowOnboarding(false)}/>}
      <ChatBotWidget/>
    </div>
  );
}
