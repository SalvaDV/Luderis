import React, { useState, useEffect, useCallback, useRef } from "react";
import * as sb from "./supabase";
import {
  C, FONT, toast, t,
  Avatar, Spinner, Btn, Input, Modal, Label, ErrMsg, Chip,
  MiniStars, StarRating, StatusBadge, VerifiedBadge, Tag,
  fmt, fmtRel, fmtPrice, calcAvg, calcDuracion,
  safeDisplayName, sanitizeContactInfo, useConfirm,
  CalendarioCurso,
  LUD,
  CATEGORIAS_DATA,
} from "./shared";
import { dispararAlertasIA } from "./PostFormModal";
import { DenunciaModal, FinalizarClaseModal, ContraofertaModal } from "./App";

// ─── CALENDAR SYNC HELPERS ────────────────────────────────────────────────────
const BYDAY_MAP={Lunes:"MO",Martes:"TU","Miércoles":"WE",Jueves:"TH",Viernes:"FR",Sábado:"SA",Domingo:"SU"};
function nextWeekday(dayName,from){
  const target=Object.keys(BYDAY_MAP).indexOf(dayName);// 0=Lun…6=Dom
  const date=new Date(from);
  const cur=(date.getDay()+6)%7;// lunes=0
  const diff=(target-cur+7)%7||7;
  date.setDate(date.getDate()+diff);
  return date;
}
function toGCalDate(d,timeStr){
  // Returns YYYYMMDDTHHMMSS (local)
  const [h,m]=timeStr.split(":").map(Number);
  const out=new Date(d);out.setHours(h,m,0,0);
  return out.toISOString().replace(/[-:]/g,"").slice(0,15);
}
function buildGCalUrl(titulo,descripcion,dia,horaI,horaF,fechaInicio,fechaFin){
  const from=fechaInicio?new Date(fechaInicio):new Date();
  const start=nextWeekday(dia,from);
  const startStr=toGCalDate(start,horaI);
  const endStr=toGCalDate(start,horaF);
  const byDay=BYDAY_MAP[dia]||"MO";
  let recur=`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`;
  if(fechaFin){const until=new Date(fechaFin).toISOString().replace(/[-:]/g,"").slice(0,8)+"T235959Z";recur+=`;UNTIL=${until}`;}
  const params=new URLSearchParams({
    action:"TEMPLATE",
    text:titulo,
    details:descripcion||"",
    dates:`${startStr}/${endStr}`,
    recur,
    sf:"true",
    output:"xml",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
function generarICS(titulo,descripcion,clases,fechaInicio,fechaFin){
  const from=fechaInicio?new Date(fechaInicio):new Date();
  let eventos="";
  clases.forEach((c,idx)=>{
    const start=nextWeekday(c.dia,from);
    const [h1,m1]=c.hora_inicio.split(":").map(Number);const [h2,m2]=c.hora_fin.split(":").map(Number);
    const dtStart=new Date(start);dtStart.setHours(h1,m1,0,0);
    const dtEnd=new Date(start);dtEnd.setHours(h2,m2,0,0);
    const fmt=d=>d.toISOString().replace(/[-:]/g,"").slice(0,15);
    const byDay=BYDAY_MAP[c.dia]||"MO";
    let rrule=`FREQ=WEEKLY;BYDAY=${byDay}`;
    if(fechaFin){const until=new Date(fechaFin).toISOString().replace(/[-:]/g,"").slice(0,8)+"T235959Z";rrule+=`;UNTIL=${until}`;}
    eventos+=`BEGIN:VEVENT\r\nUID:luderis-${idx}-${Date.now()}\r\nDTSTART:${fmt(dtStart)}\r\nDTEND:${fmt(dtEnd)}\r\nRRULE:${rrule}\r\nSUMMARY:${titulo}\r\nDESCRIPTION:${descripcion||""}\r\nEND:VEVENT\r\n`;
  });
  return`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Luderis//ES\r\nCALSCALE:GREGORIAN\r\n${eventos}END:VCALENDAR`;
}
function descargarICS(content,nombre){
  const blob=new Blob([content],{type:"text/calendar;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=nombre+".ics";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),60000);
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
// ─── JITSI MODAL ─────────────────────────────────────────────────────────────
function JitsiModal({roomName,displayName,onClose}){
  const room=roomName.replace(/[^a-zA-Z0-9]/g,"").slice(0,32)||"luderisclase";
  const url=`https://meet.jit.si/${room}#userInfo.displayName="${encodeURIComponent(displayName)}"`;
  const [copied,setCopied]=useState(false);
  const copiar=()=>{try{navigator.clipboard.writeText(url);}catch{} setCopied(true);setTimeout(()=>setCopied(false),2000);};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:FONT}} onClick={onClose}>
      <div style={{background:"#12122a",borderRadius:20,width:"min(480px,96vw)",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.6)"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#0F3F7A,#1A6ED8)",padding:"24px 28px",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:12,right:14,background:"none",border:"none",color:"rgba(255,255,255,.6)",fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:36}}>📹</span>
            <div>
              <div style={{color:"#fff",fontWeight:800,fontSize:18}}>Videollamada grupal</div>
              <div style={{color:"rgba(255,255,255,.6)",fontSize:12}}>Sala privada de Luderis</div>
            </div>
          </div>
        </div>
        {/* Body */}
        <div style={{padding:"24px 28px",display:"flex",flexDirection:"column",gap:16}}>
          <div style={{background:"#1e1e3a",borderRadius:12,padding:"14px 16px",border:"1px solid rgba(255,255,255,.1)"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,.4)",fontWeight:700,letterSpacing:.5,marginBottom:6}}>NOMBRE DE LA SALA</div>
            <div style={{color:"#fff",fontSize:14,fontFamily:"monospace",wordBreak:"break-all"}}>{room}</div>
          </div>
          <p style={{color:"rgba(255,255,255,.55)",fontSize:13,margin:0,lineHeight:1.6}}>
            La videollamada se abre en una nueva pestaña. Podés compartir el link con los participantes.
          </p>
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",border:"none",borderRadius:12,color:"#fff",padding:"14px",fontWeight:700,fontSize:15,textDecoration:"none",textAlign:"center",boxShadow:"0 4px 16px rgba(26,110,216,.4)",cursor:"pointer"}}
            onClick={onClose}>
            📹 Abrir videollamada →
          </a>
          <button onClick={copiar}
            style={{background:"none",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,color:copied?"#2EC4A0":"rgba(255,255,255,.5)",padding:"10px",fontSize:13,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}>
            {copied?"✓ Link copiado":"Copiar link para compartir"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CHAT CURSO — chat grupal estilo WhatsApp ────────────────────────────────
const SUPABASE_URL_CHAT=process.env.REACT_APP_SUPABASE_URL||"https://hptdyehzqfpgtrpuydny.supabase.co";
const ANON_KEY_CHAT=process.env.REACT_APP_SUPABASE_KEY||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g";

function fmtMsgTime(ts){
  if(!ts)return"";
  const d=new Date(ts);
  return d.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
}
function fmtMsgDate(ts){
  if(!ts)return"";
  const d=new Date(ts);
  const hoy=new Date();
  const ayer=new Date(hoy);ayer.setDate(ayer.getDate()-1);
  if(d.toDateString()===hoy.toDateString())return"Hoy";
  if(d.toDateString()===ayer.toDateString())return"Ayer";
  return d.toLocaleDateString("es-AR",{day:"numeric",month:"long"});
}

function ChatCurso({post,session,ayudantes=[],ayudanteEmails=[],onNewMessages}){
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(true);
  const [escribiendo,setEscribiendo]=useState([]);// emails escribiendo
  const [imagenPrevia,setImagenPrevia]=useState(null);
  const [showJitsi,setShowJitsi]=useState(false);
  const [resumen,setResumen]=useState(null);const [loadingResumen,setLoadingResumen]=useState(false);
  const miEmail=session.user.email;
  const bottomRef=useRef(null);
  const didScrollRef=useRef(false);
  const escribiendoTimer=useRef(null);
  const fileInputRef=useRef(null);

  const scrollBottom=(smooth=true)=>setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:smooth?"smooth":"auto"}),60);

  const cargar=useCallback(async()=>{
    try{
      const grupal=await sb.getMensajesGrupo(post.id,session.access_token).catch(()=>[]);
      const withNames=grupal.map(m=>({...m,de_nombre_display:sb.getDisplayName(m.de_nombre)}));
      setMsgs(prev=>{
        if(prev.length>0&&withNames.length>prev.length&&onNewMessages){
          onNewMessages(withNames.length-prev.length);
        }
        return withNames;
      });
      if(!didScrollRef.current&&withNames.length>0){didScrollRef.current=true;scrollBottom(false);}
    }finally{setLoading(false);}
  },[post.id,session.access_token,onNewMessages]);

  // Realtime WebSocket + fallback polling
  useEffect(()=>{
    cargar();
    let canal=null;
    try{
      const ws=new WebSocket(`${SUPABASE_URL_CHAT.replace("https","wss")}/realtime/v1/websocket?apikey=${ANON_KEY_CHAT}&vsn=1.0.0`);
      canal=ws;
      ws.onopen=()=>{
        ws.send(JSON.stringify({topic:`realtime:mensajes_grupo_${post.id}`,event:"phx_join",payload:{},ref:"1"}));
        ws.send(JSON.stringify({topic:"phoenix",event:"heartbeat",payload:{},ref:"hb"}));
      };
      ws.onmessage=(e)=>{
        try{const msg=JSON.parse(e.data);if(msg.event==="INSERT"||msg.payload?.type==="INSERT")cargar();}catch{}
      };
      ws.onerror=()=>{const t=setInterval(cargar,5000);canal={close:()=>clearInterval(t)};};
    }catch{const t=setInterval(cargar,5000);canal={close:()=>clearInterval(t)};}
    return()=>{try{canal?.close?.();}catch{}};
  },[cargar]);

  // Detectar quién está escribiendo via localStorage
  useEffect(()=>{
    const check=()=>{
      try{
        const key=`cl_typing_grupo_${post.id}`;
        const data=JSON.parse(localStorage.getItem(key)||"{}");
        const ahora=Date.now();
        const activos=Object.entries(data)
          .filter(([email,ts])=>email!==miEmail&&ahora-ts<3000)
          .map(([email])=>sb.getDisplayName(email)||email.split("@")[0]);
        setEscribiendo(activos);
      }catch{}
    };
    const t=setInterval(check,500);
    return()=>clearInterval(t);
  },[post.id,miEmail]);

  const emitirEscribiendo=()=>{
    try{
      const key=`cl_typing_grupo_${post.id}`;
      const data=JSON.parse(localStorage.getItem(key)||"{}");
      data[miEmail]=Date.now();
      localStorage.setItem(key,JSON.stringify(data));
    }catch{}
    clearTimeout(escribiendoTimer.current);
    escribiendoTimer.current=setTimeout(()=>{
      try{
        const key=`cl_typing_grupo_${post.id}`;
        const data=JSON.parse(localStorage.getItem(key)||"{}");
        delete data[miEmail];
        localStorage.setItem(key,JSON.stringify(data));
      }catch{}
    },2500);
  };

  const handleImageSelect=(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>4*1024*1024){alert("La imagen no puede superar 4MB");return;}
    const reader=new FileReader();
    reader.onload=(ev)=>setImagenPrevia(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value="";
  };

  const sendMsg=async()=>{
    const txt=input.trim();
    if(!txt&&!imagenPrevia)return;
    const mensajeTexto=imagenPrevia?`[img]${imagenPrevia}[/img]${txt?" "+txt:""}`:txt;
    setInput("");setImagenPrevia(null);
    try{
      localStorage.removeItem(`cl_typing_grupo_${post.id}`);
    }catch{}
    try{
      await sb.insertMensaje({publicacion_id:post.id,de_usuario:session.user.id,para_usuario:null,de_nombre:miEmail,para_nombre:"__grupo__",texto:mensajeTexto,leido:true,pub_titulo:post.titulo},session.access_token);
      const inscriptos=await sb.getInscripciones(post.id,session.access_token).catch(()=>[]);
      const todos=[...inscriptos.map(i=>i.alumno_email),post.autor_email].filter(e=>e!==miEmail);
      await Promise.all(todos.map(e=>sb.insertNotificacion({usuario_id:null,alumno_email:e,tipo:"chat_grupal",publicacion_id:post.id,pub_titulo:post.titulo,leida:false}).catch(()=>{})));
      await cargar();scrollBottom();
    }catch(e){alert("Error al enviar: "+e.message);}
  };

  const esOwner=(email)=>email===post.autor_email;
  const esAyudante=(email)=>ayudanteEmails.includes(email)||ayudantes.includes(email);
  const getDisplayName=(m)=>m.de_nombre_display||m.de_nombre.split("@")[0];

  // Agrupar mensajes por fecha para separadores
  const msgsConFecha=msgs.map((m,i)=>{
    const prev=msgs[i-1];
    const mismaFecha=prev&&new Date(m.created_at).toDateString()===new Date(prev.created_at).toDateString();
    return{...m,showDate:!mismaFecha};
  });

  const jitsiRoom=`luderis${post.id.replace(/-/g,"").slice(0,20)}`;
  const miDisplayName=sb.getDisplayName(miEmail)||miEmail.split("@")[0];

  return(
    <>
    {showJitsi&&<JitsiModal roomName={jitsiRoom} displayName={miDisplayName} onClose={()=>setShowJitsi(false)}/>}
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10,background:C.surface}}>
        <span style={{fontSize:18}}>💬</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,color:C.text,fontSize:14}}>Chat grupal</div>
          <div style={{fontSize:11,color:C.muted}}>{msgs.length} mensaje{msgs.length!==1?"s":""}</div>
        </div>
        {/* Botón resumen IA */}
        {msgs.length>=5&&<button onClick={async()=>{
          setLoadingResumen(true);setResumen(null);
          try{
            const txt=msgs.slice(-60).filter(m=>!m.texto?.startsWith("[img]")).map(m=>`${m.de_nombre_display||m.de_nombre.split("@")[0]}: ${m.texto}`).join("\n");
            const r=await sb.callIA("Sos un asistente educativo. Resumí de forma clara y concisa los puntos más importantes de esta conversación grupal de un curso, en español rioplatense. Usá viñetas (•). Máximo 5 puntos.",txt,400,session.access_token);
            setResumen(r);
          }catch(e){setResumen("No se pudo generar el resumen: "+e.message);}
          finally{setLoadingResumen(false);}
        }} style={{background:"#7B3FBE18",border:"1px solid #7B3FBE33",borderRadius:9,padding:"6px 11px",cursor:"pointer",color:"#7B3FBE",fontSize:11,fontWeight:700,fontFamily:FONT,flexShrink:0}}>
          {loadingResumen?"…":"✨ Resumir"}
        </button>}
        {/* Botón videollamada */}
        <button onClick={()=>setShowJitsi(true)}
          title="Iniciar videollamada grupal"
          style={{background:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",border:"none",borderRadius:9,padding:"6px 12px",cursor:"pointer",color:"#fff",fontSize:12,fontWeight:700,fontFamily:FONT,display:"flex",alignItems:"center",gap:5,flexShrink:0,transition:"opacity .15s"}}
          onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          📹 <span>Videollamada</span>
        </button>
        {/* Leyenda de roles */}
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:10,background:"#C85CE015",color:"#C85CE0",borderRadius:20,padding:"2px 7px",border:"1px solid #C85CE030",fontWeight:600}}>Docente</span>
          <span style={{fontSize:10,background:"#5CA8E015",color:"#5CA8E0",borderRadius:20,padding:"2px 7px",border:"1px solid #5CA8E030",fontWeight:600}}>Ayudante</span>
        </div>
      </div>

      {/* Mensajes */}
      <div style={{height:420,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:2,background:`linear-gradient(${C.bg},${C.bg})`}}>
        {loading?<div style={{display:"flex",justifyContent:"center",padding:"32px 0"}}><Spinner/></div>
          :msgs.length===0
            ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"32px 0",display:"flex",flexDirection:"column",gap:6,alignItems:"center"}}>
              <span style={{fontSize:32}}>👋</span>
              ¡Sé el primero en escribir en el grupo!
            </div>
          :msgsConFecha.map((m,i)=>{
            const esMiMsg=m.de_nombre===miEmail;
            const isOwner=esOwner(m.de_nombre);
            const isAyud=esAyudante(m.de_nombre);
            const bgMsg=esMiMsg?"#1A6ED8":isOwner?"#2d1b4e":isAyud?"#1a3a4e":C.surface;
            const colorMsg=esMiMsg||isOwner||isAyud?"#fff":C.text;
            const nameColor=isOwner?"#C85CE0":isAyud?"#5CA8E0":C.accent;
            const roleLabel=isOwner?" · Docente":isAyud?" · Ayudante":"";
            const isImg=m.texto?.startsWith("[img]");
            const imgSrc=isImg?m.texto.match(/\[img\]([\s\S]*?)\[\/img\]/)?.[1]:null;
            const textoPosterImg=isImg?m.texto.replace(/\[img\][\s\S]*?\[\/img\]/,"").trim():"";
            const prevMsg=i>0?msgsConFecha[i-1]:null;
            const mismaSerie=prevMsg&&prevMsg.de_nombre===m.de_nombre&&!m.showDate;
            return(
              <React.Fragment key={m.id||i}>
                {/* Separador de fecha */}
                {m.showDate&&(
                  <div style={{display:"flex",alignItems:"center",gap:10,margin:"10px 0 6px"}}>
                    <div style={{flex:1,height:1,background:C.border}}/>
                    <span style={{fontSize:11,color:C.muted,background:C.card,padding:"2px 10px",borderRadius:20,border:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{fmtMsgDate(m.created_at)}</span>
                    <div style={{flex:1,height:1,background:C.border}}/>
                  </div>
                )}
                <div style={{display:"flex",justifyContent:esMiMsg?"flex-end":"flex-start",gap:6,alignItems:"flex-end",marginTop:mismaSerie?2:8}}>
                  {!esMiMsg&&(
                    <div style={{width:28,flexShrink:0}}>
                      {!mismaSerie&&<Avatar letra={(m.de_nombre||"?")[0]} size={28}/>}
                    </div>
                  )}
                  <div style={{maxWidth:"72%"}}>
                    {!esMiMsg&&!mismaSerie&&(
                      <div style={{fontSize:11,fontWeight:700,marginBottom:3,display:"flex",alignItems:"center",gap:5}}>
                        <span style={{color:nameColor}}>{getDisplayName(m)}</span>
                        {(isOwner||isAyud)&&(
                          <span style={{fontSize:9,background:isOwner?"#C85CE015":"#5CA8E015",color:isOwner?"#C85CE0":"#5CA8E0",borderRadius:20,padding:"1px 6px",border:`1px solid ${isOwner?"#C85CE030":"#5CA8E030"}`,fontWeight:700}}>
                            {roleLabel.trim()}
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{background:bgMsg,color:colorMsg,padding:imgSrc?"6px":undefined,borderRadius:esMiMsg?"13px 4px 13px 13px":"4px 13px 13px 13px",fontSize:13,lineHeight:1.5,overflow:"hidden",boxShadow:"0 1px 2px rgba(0,0,0,.08)"}}>
                      {imgSrc&&<img src={imgSrc} alt="img" style={{maxWidth:"100%",maxHeight:200,borderRadius:8,display:"block",cursor:"pointer"}} onClick={()=>window.open(imgSrc,"_blank")}/>}
                      {(textoPosterImg||!isImg)&&(
                        <div style={{padding:"8px 12px",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                          {sanitizeContactInfo(isImg?textoPosterImg:m.texto)}
                        </div>
                      )}
                      {/* Timestamp */}
                      <div style={{padding:imgSrc?"0 8px 4px":"0 12px 4px",textAlign:"right",fontSize:10,opacity:.65,lineHeight:1}}>
                        {fmtMsgTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        {/* Indicador escribiendo */}
        {escribiendo.length>0&&(
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0 0 34px",fontSize:11,color:C.muted}}>
            <div style={{display:"flex",gap:3,alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:C.muted,animation:`pulse 1.2s ${i*0.2}s infinite`}}/>)}
            </div>
            {escribiendo.length===1?`${escribiendo[0]} está escribiendo…`:`${escribiendo.join(" y ")} están escribiendo…`}
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Panel resumen IA */}
      {(resumen||loadingResumen)&&(
        <div style={{margin:"0 14px 8px",background:"linear-gradient(135deg,#7B3FBE12,#1A6ED812)",border:"1px solid #7B3FBE33",borderRadius:12,padding:"12px 14px",fontSize:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontWeight:700,color:"#7B3FBE",fontSize:12}}>✨ Resumen IA</span>
            <button onClick={()=>setResumen(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>
          </div>
          {loadingResumen?<div style={{color:C.muted,fontSize:12}}>Generando resumen…</div>
            :<div style={{color:C.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{resumen}</div>}
        </div>
      )}
      {/* Preview imagen */}
      {imagenPrevia&&(
        <div style={{padding:"6px 13px",display:"flex",alignItems:"center",gap:8,background:C.bg,borderTop:`1px solid ${C.border}`}}>
          <img src={imagenPrevia} alt="preview" style={{height:48,width:48,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}`}}/>
          <div style={{flex:1,fontSize:12,color:C.muted}}>Imagen lista para enviar</div>
          <button onClick={()=>setImagenPrevia(null)} style={{background:"none",border:"none",color:C.danger,fontSize:18,cursor:"pointer"}}>×</button>
        </div>
      )}

      {/* Input */}
      <div style={{padding:"10px 13px",borderTop:`1px solid ${C.border}`,display:"flex",gap:7,alignItems:"flex-end",background:C.surface}}>
        <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImageSelect}/>
        <button onClick={()=>fileInputRef.current?.click()}
          style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 10px",cursor:"pointer",color:C.muted,fontSize:15,flexShrink:0,lineHeight:1,transition:"all .15s"}}
          title="Enviar imagen"
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
          📎
        </button>
        <textarea
          value={input}
          onChange={e=>{setInput(e.target.value);emitirEscribiendo();}}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}}
          placeholder="Escribí al grupo… (Shift+Enter para nueva línea)"
          rows={1}
          style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:"8px 14px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,resize:"none",lineHeight:1.5,maxHeight:100,overflowY:"auto",boxSizing:"border-box",transition:"border-color .15s"}}
          onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,100)+"px";}}
        />
        <button onClick={sendMsg} disabled={!input.trim()&&!imagenPrevia}
          style={{background:C.accent,border:"none",borderRadius:"50%",width:36,height:36,cursor:(input.trim()||imagenPrevia)?"pointer":"default",fontSize:16,flexShrink:0,opacity:(input.trim()||imagenPrevia)?1:0.4,transition:"all .15s",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>↑</button>
      </div>
    </div>
    </>
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
        `Sos un generador de quizzes educativos para una plataforma argentina.\nGenerá ${cantIA} preguntas de multiple choice sobre el tema indicado.\nSIEMPRE respondé con JSON válido sin markdown:\n{"preguntas":[{"texto":"...","opciones":["A","B","C","D"],"correcta":0},...]}\n- opciones: exactamente 4 opciones\n- correcta: índice (0-3) de la respuesta correcta\n- Las preguntas deben ser claras, educativas y de dificultad media`,
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
  // Parsear datos del quiz (antes de hooks para inicializar estado)
  let quizData={};
  try{quizData=JSON.parse(item?.texto||"{}"); }catch{}
  const {tipo_quiz,preguntas:_pregs,consigna,fecha_inicio,fecha_cierre}=quizData;
  const preguntas=Array.isArray(_pregs)?_pregs:[];

  // Hooks siempre primero — sin returns condicionales antes de ellos
  const [miEntrega,setMiEntrega]=useState(null);
  const [loadingEntrega,setLoadingEntrega]=useState(true);
  const [respuestas,setRespuestas]=useState(()=>preguntas.map(()=>null));
  const [textoEntrega,setTextoEntrega]=useState("");
  const [archivoEntrega,setArchivoEntrega]=useState(null);
  const [enviando,setEnviando]=useState(false);
  const [resultado,setResultado]=useState(null);
  const [entregas,setEntregas]=useState([]);
  const [loadingEntregas,setLoadingEntregas]=useState(false);
  const [notaEditing,setNotaEditing]=useState({});
  const [savingNota,setSavingNota]=useState(null);

  useEffect(()=>{
    if(!item?.id)return;
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
  },[item?.id,session.user.email,esMio,esAyudante]);// eslint-disable-line

  // Early return después de hooks
  if(!item?.id)return<div style={{fontSize:12,color:C.muted,padding:"8px 0"}}>⚠ Quiz guardado — recargá la página para verlo.</div>;

  const ahora=new Date();
  const inicio=fecha_inicio?new Date(fecha_inicio):null;
  const cierre=fecha_cierre?new Date(fecha_cierre):null;
  const noEmpezado=inicio&&ahora<inicio;
  const cerrado=cierre&&ahora>cierre;
  const abierto=!noEmpezado&&!cerrado;

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

  // Detectar clases perdidas (ayer o antes de ayer, que el alumno no marcó asistencia)
  const clasesPerdidas=[];
  for(let d=-2;d<0;d++){
    const fecha=new Date(now.getFullYear(),now.getMonth(),now.getDate()+d);
    const clases=clasesEnDia(fecha.getDate());
    clases.forEach(c=>clasesPerdidas.push({...c,fecha}));
  }

  return(
    <div style={{padding:"20px 24px",maxWidth:900,margin:"0 auto",fontFamily:FONT}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontWeight:800,color:C.text,fontSize:20,marginBottom:4,letterSpacing:"-.3px"}}>📅 Mi agenda</div>
          <div style={{color:C.muted,fontSize:13}}>{mesLabel} · {diasConClase.size} día{diasConClase.size!==1?"s":""} con clase{diasConClase.size!==1?"s":""}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {posts.map((p,i)=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:colorPost(p)}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:colorPost(p),flexShrink:0}}/>
              <span style={{maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.muted}}>{p.titulo}</span>
            </div>
          ))}
        </div>
      </div>

      {loading?<Spinner/>:(
        <>
          {/* Calendatio */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <button onClick={()=>setMesOffset(m=>m-1)} style={{width:34,height:34,background:C.bg,border:`1px solid ${C.border}`,borderRadius:"50%",color:C.muted,cursor:"pointer",fontFamily:FONT,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>‹</button>
              <div style={{textAlign:"center"}}>
                <div style={{fontWeight:800,color:C.text,fontSize:16,textTransform:"capitalize",letterSpacing:"-.2px"}}>{mes.toLocaleString("es-AR",{month:"long"})}</div>
                <div style={{fontSize:12,color:C.muted}}>{mes.getFullYear()}</div>
              </div>
              <button onClick={()=>setMesOffset(m=>m+1)} style={{width:34,height:34,background:C.bg,border:`1px solid ${C.border}`,borderRadius:"50%",color:C.muted,cursor:"pointer",fontFamily:FONT,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>›</button>
            </div>
            {/* Días de la semana */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:8}}>
              {["Lu","Ma","Mi","Ju","Vi","Sá","Do"].map((d,i)=>(
                <div key={d} style={{textAlign:"center",fontSize:11,color:i>=5?C.accent:C.muted,fontWeight:700,padding:"4px 0",letterSpacing:.3}}>{d}</div>
              ))}
            </div>
            {/* Grid días */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
              {Array.from({length:offset}).map((_,i)=><div key={"e"+i}/>)}
              {Array.from({length:diasEnMes},(_,i)=>i+1).map(d=>{
                const tieneClase=diasConClase.has(d);
                const esHoy=d===hoy.getDate()&&mes.getMonth()===hoy.getMonth()&&mes.getFullYear()===hoy.getFullYear();
                const selec=diaSelec===d;
                const nClases=clasesEnDia(d).length;
                return(
                  <button key={d} onClick={()=>setDiaSelec(tieneClase?(selec?null:d):null)}
                    style={{textAlign:"center",padding:"8px 2px",borderRadius:10,fontSize:13,
                      fontWeight:tieneClase||esHoy?700:400,
                      background:selec?C.accent:esHoy?LUD.grad:tieneClase?C.accentDim:"transparent",
                      color:selec?"#fff":esHoy?"#fff":tieneClase?C.accent:C.muted,
                      border:selec?`2px solid ${C.accent}`:esHoy?"none":tieneClase?`1px solid ${C.accent}44`:"1px solid transparent",
                      cursor:tieneClase?"pointer":"default",fontFamily:FONT,
                      position:"relative",minHeight:44,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,
                      boxShadow:tieneClase&&!selec?"0 1px 4px rgba(26,110,216,.12)":undefined,
                      transition:"all .12s"}}>
                    <span>{d}</span>
                    {nClases>0&&(
                      <div style={{display:"flex",gap:2,justifyContent:"center"}}>
                        {clasesEnDia(d).slice(0,3).map((item,ci)=>(
                          <div key={ci} style={{width:5,height:5,borderRadius:"50%",background:selec?"rgba(255,255,255,.8)":colorPost(item.post),boxShadow:"0 1px 2px rgba(0,0,0,.15)"}}/>
                        ))}
                      </div>
                    )}
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
                      style={{marginBottom:8,background:C.surface,borderRadius:12,overflow:"hidden",
                        border:`1px solid ${colorPost(item.post)}33`,cursor:"pointer",
                        display:"flex",transition:"all .15s",boxShadow:`0 2px 8px ${colorPost(item.post)}15`}}
                      onMouseEnter={e=>{e.currentTarget.style.transform="translateX(4px)";e.currentTarget.style.boxShadow=`0 4px 16px ${colorPost(item.post)}25`;}}
                      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`0 2px 8px ${colorPost(item.post)}15`;}}>
                      <div style={{width:5,background:colorPost(item.post),flexShrink:0}}/>
                      <div style={{padding:"12px 14px",flex:1}}>
                        <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:5}}>{item.post.titulo}</div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <span style={{fontWeight:700,color:colorPost(item.post),fontSize:13,display:"flex",alignItems:"center",gap:4}}>🕐 {item.clase.hora_inicio}</span>
                          <span style={{color:C.muted,fontSize:12}}>→ {item.clase.hora_fin}</span>
                          {item.post.materia&&<span style={{fontSize:11,color:"#fff",background:colorPost(item.post),borderRadius:20,padding:"2px 10px",fontWeight:600}}>{item.post.materia}</span>}
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

// ─── NOTAS PRIVADAS ──────────────────────────────────────────────────────────
// ─── PANEL DE PROGRESO DOCENTE ───────────────────────────────────────────────
function ProgresoCurso({post,session}){
  const [inscriptos,setInscriptos]=useState([]);
  const [quizEntregas,setQuizEntregas]=useState([]);// flat list
  const [evalEntregas,setEvalEntregas]=useState([]);
  const [contenido,setContenido]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busqueda,setBusqueda]=useState("");
  const [ordenar,setOrdenar]=useState("nombre");// "nombre"|"quiz"|"eval"|"fecha"

  useEffect(()=>{
    (async()=>{
      try{
        const [ins,cont,evals]=await Promise.all([
          sb.getInscripciones(post.id,session.access_token),
          sb.getContenido(post.id,session.access_token),
          sb.getEvaluaciones(post.id,session.access_token),
        ]);
        setInscriptos(ins||[]);
        setContenido(cont||[]);
        // Obtener quizzes (items de contenido tipo quiz) y todas sus entregas
        const quizItems=(cont||[]).filter(c=>c.tipo==="quiz");
        const evalIds=(evals||[]).map(e=>e.id);
        const [qEntregas,evEntregas]=await Promise.all([
          Promise.all(quizItems.map(q=>sb.getQuizEntregas(q.id,session.access_token).then(r=>r||[]))).then(rs=>rs.flat()),
          Promise.all(evalIds.map(eid=>sb.getEvaluacionEntregas(eid,session.access_token).then(r=>r||[]))).then(rs=>rs.flat()),
        ]);
        setQuizEntregas(qEntregas);
        setEvalEntregas(evEntregas);
      }catch(e){console.error(e);}
      setLoading(false);
    })();
  },[post.id,session.access_token]);

  if(loading)return <div style={{padding:"40px",textAlign:"center"}}><Spinner/></div>;

  // Construir mapa por alumno
  const totalQuizzes=contenido.filter(c=>c.tipo==="quiz").length;
  const alumnosData=inscriptos.map(ins=>{
    const email=ins.alumno_email;
    const nombre=ins.alumno_nombre||email.split("@")[0];
    const qHechos=quizEntregas.filter(q=>q.alumno_email===email);
    const qPct=totalQuizzes>0?Math.round((qHechos.length/totalQuizzes)*100):null;
    const qPromedio=qHechos.length>0?Math.round(qHechos.reduce((s,q)=>s+(q.puntaje||0),0)/qHechos.length):null;
    const eHechas=evalEntregas.filter(e=>e.alumno_email===email);
    const eCalif=eHechas.filter(e=>e.calificacion!=null);
    const ePromedio=eCalif.length>0?Math.round(eCalif.reduce((s,e)=>s+(e.calificacion||0),0)/eCalif.length):null;
    const ultimaFecha=ins.created_at?new Date(ins.created_at):null;
    return{email,nombre,qHechos:qHechos.length,qPct,qPromedio,eHechas:eHechas.length,eCalif:eCalif.length,ePromedio,ultimaFecha,inscripcion:ins};
  });

  const filtrados=alumnosData
    .filter(a=>!busqueda||a.nombre.toLowerCase().includes(busqueda.toLowerCase())||a.email.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a,b)=>{
      if(ordenar==="nombre")return a.nombre.localeCompare(b.nombre);
      if(ordenar==="quiz")return(b.qPct||0)-(a.qPct||0);
      if(ordenar==="eval")return(b.ePromedio||0)-(a.ePromedio||0);
      if(ordenar==="fecha")return(b.ultimaFecha||0)-(a.ultimaFecha||0);
      return 0;
    });

  const totalQuizzesTotal=totalQuizzes;
  const avgQuizPct=alumnosData.length>0&&totalQuizzesTotal>0?Math.round(alumnosData.reduce((s,a)=>s+(a.qPct||0),0)/alumnosData.length):null;

  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,background:C.surface}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <span style={{fontSize:20}}>📊</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:C.text,fontSize:14}}>Panel de progreso</div>
            <div style={{fontSize:11,color:C.muted}}>{inscriptos.length} alumnos inscriptos</div>
          </div>
        </div>
        {/* Stats resumen */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
          {[
            {label:"Inscriptos",value:inscriptos.length,icon:"👥"},
            {label:"Quizzes totales",value:totalQuizzesTotal,icon:"📝"},
            {label:"Promedio quiz",value:avgQuizPct!=null?`${avgQuizPct}%`:"—",icon:"📈"},
          ].map(s=>(
            <div key={s.label} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 13px",flex:1,minWidth:90}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{s.icon} {s.label}</div>
              <div style={{fontWeight:700,color:C.text,fontSize:16}}>{s.value}</div>
            </div>
          ))}
        </div>
        {/* Buscar + ordenar */}
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar alumno…"
            style={{flex:1,minWidth:120,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 11px",color:C.text,fontSize:12,fontFamily:FONT,outline:"none"}}/>
          <select value={ordenar} onChange={e=>setOrdenar(e.target.value)}
            style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",color:C.text,fontSize:12,fontFamily:FONT,outline:"none",cursor:"pointer"}}>
            <option value="nombre">Ordenar: Nombre</option>
            <option value="quiz">Ordenar: % Quiz</option>
            <option value="eval">Ordenar: Nota eval</option>
            <option value="fecha">Ordenar: Inscripción</option>
          </select>
        </div>
      </div>
      {/* Lista alumnos */}
      <div style={{maxHeight:480,overflowY:"auto"}}>
        {filtrados.length===0?(
          <div style={{padding:"32px",textAlign:"center",color:C.muted,fontSize:13}}>{inscriptos.length===0?"Nadie inscripto aún.":"No hay resultados."}</div>
        ):filtrados.map((a,i)=>(
          <div key={a.email} style={{padding:"12px 18px",borderBottom:i<filtrados.length-1?`1px solid ${C.border}`:"none",display:"flex",gap:12,alignItems:"center"}}>
            <Avatar letra={a.nombre[0]} size={34}/>
            <div style={{flex:1,overflow:"hidden",minWidth:0}}>
              <div style={{fontWeight:600,color:C.text,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.nombre}</div>
              <div style={{fontSize:11,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.email}</div>
            </div>
            {/* Métricas */}
            <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center",overflowX:"auto"}}>
              {totalQuizzesTotal>0&&(
                <div style={{textAlign:"center",minWidth:54}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>Quiz</div>
                  <div style={{fontWeight:700,color:a.qPct>=70?C.success:a.qPct>=40?C.accent:C.muted,fontSize:13}}>{a.qPct!=null?`${a.qPct}%`:"—"}</div>
                  {totalQuizzesTotal>0&&<div style={{width:50,height:3,background:C.border,borderRadius:2,marginTop:2}}><div style={{height:"100%",width:`${a.qPct||0}%`,background:a.qPct>=70?C.success:C.accent,borderRadius:2}}/></div>}
                </div>
              )}
              {a.eHechas>0&&(
                <div style={{textAlign:"center",minWidth:54}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>Nota</div>
                  <div style={{fontWeight:700,color:a.ePromedio>=6?C.success:C.danger,fontSize:13}}>{a.ePromedio!=null?a.ePromedio:"Pend."}</div>
                </div>
              )}
              <div style={{textAlign:"center",minWidth:40}}>
                <div style={{fontSize:10,color:C.muted,marginBottom:2}}>Insc.</div>
                <div style={{fontSize:11,color:C.muted}}>{a.ultimaFecha?fmtRel(a.ultimaFecha):"—"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FLASHCARDS CON IA ───────────────────────────────────────────────────────

// Shared deck key in contenido_curso: tipo="flashcards", texto=JSON
const FC_PRIV_KEY=(postId,email)=>`cl_fc_priv_${postId}_${email}`;

function FlashcardsDeck({cards,onDelete,titulo}){
  const [idx,setIdx]=useState(0);const [flipped,setFlipped]=useState(false);const [done,setDone]=useState([]);
  if(!cards||cards.length===0)return null;
  const remaining=cards.filter((_,i)=>!done.includes(i));
  if(remaining.length===0)return(
    <div style={{textAlign:"center",padding:"32px 0"}}>
      <div style={{fontSize:40,marginBottom:10}}>🎉</div>
      <div style={{fontWeight:700,color:C.text,fontSize:16,marginBottom:6}}>¡Completaste todas!</div>
      <button onClick={()=>{setDone([]);setIdx(0);setFlipped(false);}} style={{background:C.accent,border:"none",borderRadius:10,color:"#fff",padding:"9px 22px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:FONT}}>Volver a empezar</button>
    </div>
  );
  const realIdx=cards.indexOf(remaining[idx%remaining.length]);
  const card=cards[realIdx];
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:"10px 0"}}>
      <style>{`
        .fc-scene{width:100%;max-width:min(460px,100%);height:clamp(160px,45vw,210px);perspective:900px;cursor:pointer;}
        .fc-card{width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform .45s cubic-bezier(.4,0,.2,1);}
        .fc-card.flipped{transform:rotateY(180deg);}
        .fc-face{position:absolute;inset:0;backface-visibility:hidden;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 28px;text-align:center;box-shadow:0 4px 22px rgba(0,0,0,.08);}
        .fc-front{background:var(--fc-surface);border:2px solid var(--fc-border);}
        .fc-back{background:var(--fc-accent-dim);border:2px solid var(--fc-accent);transform:rotateY(180deg);}
      `}</style>
      <div style={{"--fc-surface":C.surface,"--fc-border":C.border,"--fc-accent-dim":C.accentDim,"--fc-accent":C.accent}} className="fc-scene" onClick={()=>setFlipped(f=>!f)}>
        <div className={`fc-card${flipped?" flipped":""}`}>
          <div className="fc-face fc-front">
            <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:.8,marginBottom:10,textTransform:"uppercase"}}>Pregunta · tap para voltear</div>
            <div style={{fontSize:15,color:C.text,fontWeight:700,lineHeight:1.6}}>{card.pregunta}</div>
          </div>
          <div className="fc-face fc-back">
            <div style={{fontSize:10,color:C.accent,fontWeight:700,letterSpacing:.8,marginBottom:10,textTransform:"uppercase"}}>Respuesta</div>
            <div style={{fontSize:14,color:C.text,fontWeight:400,lineHeight:1.65}}>{card.respuesta}</div>
          </div>
        </div>
      </div>
      {/* Progreso */}
      <div style={{fontSize:11,color:C.muted}}>{done.length}/{cards.length} completadas · {remaining.length} restantes</div>
      <div style={{width:"100%",maxWidth:460,height:4,background:C.border,borderRadius:2}}>
        <div style={{height:"100%",width:`${(done.length/cards.length)*100}%`,background:C.accent,borderRadius:2,transition:"width .5s"}}/>
      </div>
      {/* Botones */}
      {flipped&&(
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <button onClick={()=>{setDone(d=>[...d,realIdx]);setFlipped(false);if(idx>=remaining.length-1)setIdx(0);else setIdx(i=>i);}}
            style={{background:"#2EC4A018",border:"1px solid #2EC4A055",borderRadius:10,color:"#0F6E56",padding:"9px 20px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:FONT}}>✓ La sabía</button>
          <button onClick={()=>{setFlipped(false);setTimeout(()=>setIdx(i=>(i+1)%remaining.length),200);}}
            style={{background:"#E53E3E12",border:"1px solid #E53E3E44",borderRadius:10,color:C.danger,padding:"9px 20px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:FONT}}>✗ Repasar</button>
        </div>
      )}
      {!flipped&&(
        <button onClick={()=>{setFlipped(false);setTimeout(()=>setIdx(i=>(i+1)%remaining.length),200);}}
          style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,padding:"9px 20px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>Saltear →</button>
      )}
      {onDelete&&<button onClick={()=>onDelete(realIdx)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:11,marginTop:-4,fontFamily:FONT}}>🗑 Eliminar esta tarjeta</button>}
    </div>
  );
}

// ─── EDITOR DE MAZO (para crear/editar antes de guardar) ─────────────────────
function DeckEditor({titulo:tituloProp,cards:cardsProp,onSave,onCancel,session,post,isShared}){
  const [titulo,setTitulo]=useState(tituloProp||"");
  const [cards,setCards]=useState(cardsProp||[{pregunta:"",respuesta:""}]);
  const [generando,setGenerando]=useState(false);
  const [tema,setTema]=useState("");
  const [guardando,setGuardando]=useState(false);

  const updateCard=(i,field,val)=>{const c=[...cards];c[i]={...c[i],[field]:val};setCards(c);};
  const addCard=()=>setCards(c=>[...c,{pregunta:"",respuesta:""}]);
  const removeCard=(i)=>{if(cards.length===1)return;const c=[...cards];c.splice(i,1);setCards(c);};

  const generarConIA=async()=>{
    const contexto=tema.trim()||post.titulo;
    setGenerando(true);
    try{
      const prompt=`Generá exactamente 8 flashcards de estudio sobre "${contexto}" para el curso "${post.titulo}". Devolvé SOLO un array JSON con objetos {pregunta,respuesta}. Sin texto extra. Máximo 120 chars por campo. Español rioplatense.`;
      const r=await sb.callIA("Sos un experto en flashcards educativas.",prompt,600,session.access_token);
      const match=r.match(/\[[\s\S]*\]/);
      if(!match)throw new Error("IA no devolvió JSON válido");
      const nuevas=JSON.parse(match[0]);
      if(!Array.isArray(nuevas)||!nuevas[0]?.pregunta)throw new Error("Formato incorrecto");
      // NO guardar automáticamente — mostrar para editar
      setCards(prev=>{const base=prev.filter(c=>c.pregunta.trim()||c.respuesta.trim());return[...base,...nuevas.slice(0,8)];});
      setTema("");
      toast(`✨ ${nuevas.length} tarjetas generadas — revisalas antes de guardar`,"info",4000);
    }catch(e){toast("Error IA: "+e.message,"error");}
    setGenerando(false);
  };

  const handleSave=async()=>{
    const validas=cards.filter(c=>c.pregunta.trim()&&c.respuesta.trim());
    if(!validas.length){toast("Agregá al menos una tarjeta completa","error");return;}
    if(!titulo.trim()){toast("Ponele un nombre al mazo","error");return;}
    setGuardando(true);
    await onSave(titulo.trim(),validas);
    setGuardando(false);
  };

  const iS={background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",color:C.text,fontSize:12,fontFamily:FONT,outline:"none",boxSizing:"border-box"};

  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
      <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,background:C.surface,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18}}>{isShared?"📢":"🃏"}</span>
        <div style={{flex:1,fontWeight:700,color:C.text,fontSize:14}}>{isShared?"Crear mazo compartido":"Crear mazo personal"}</div>
        <button onClick={onCancel} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>×</button>
      </div>
      <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:14}}>
        {/* Nombre del mazo */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:5}}>NOMBRE DEL MAZO</div>
          <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ej: Derivadas, Revolución Francesa…"
            style={{...iS,width:"100%"}}/>
        </div>

        {/* Generar con IA */}
        <div style={{background:"#7B3FBE0A",border:"1px solid #7B3FBE25",borderRadius:12,padding:"12px 14px"}}>
          <div style={{fontWeight:700,color:"#7B3FBE",fontSize:12,marginBottom:8}}>✨ Generar con IA (podés editar después)</div>
          <div style={{display:"flex",gap:7}}>
            <input value={tema} onChange={e=>setTema(e.target.value)} placeholder={`Tema (ej: "fotosíntesis")`}
              style={{...iS,flex:1}}
              onKeyDown={e=>e.key==="Enter"&&!generando&&generarConIA()}/>
            <button onClick={generarConIA} disabled={generando}
              style={{background:"#7B3FBE",border:"none",borderRadius:8,color:"#fff",padding:"7px 14px",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:FONT,opacity:generando?.6:1,flexShrink:0}}>
              {generando?"…":"✨ Generar"}
            </button>
          </div>
        </div>

        {/* Tarjetas */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8}}>TARJETAS ({cards.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:360,overflowY:"auto"}}>
            {cards.map((c,i)=>(
              <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",display:"flex",gap:8,alignItems:"flex-start"}}>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                  <input value={c.pregunta} onChange={e=>updateCard(i,"pregunta",e.target.value)}
                    placeholder="Pregunta" style={{...iS,width:"100%",borderColor:c.pregunta.trim()?"":C.danger+"66"}}/>
                  <input value={c.respuesta} onChange={e=>updateCard(i,"respuesta",e.target.value)}
                    placeholder="Respuesta" style={{...iS,width:"100%",borderColor:c.respuesta.trim()?"":C.danger+"66"}}/>
                </div>
                <button onClick={()=>removeCard(i)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,flexShrink:0,paddingTop:2}} title="Eliminar">×</button>
              </div>
            ))}
          </div>
          <button onClick={addCard} style={{marginTop:8,background:"none",border:`1px dashed ${C.border}`,borderRadius:9,color:C.muted,padding:"7px",cursor:"pointer",fontSize:12,fontFamily:FONT,width:"100%"}}>+ Agregar tarjeta</button>
        </div>

        {/* Guardar */}
        <div style={{display:"flex",gap:8}}>
          <button onClick={handleSave} disabled={guardando}
            style={{flex:1,background:C.accent,border:"none",borderRadius:10,color:"#fff",padding:"10px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:FONT,opacity:guardando?.6:1}}>
            {guardando?"Guardando…":"💾 Guardar mazo"}
          </button>
          <button onClick={onCancel} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,padding:"10px 16px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function Flashcards({post,session,esMio,esAyudante}){
  const esStaff=esMio||esAyudante;
  const miEmail=session.user.email;
  const {confirm:confirmFC,confirmEl:confirmElFC}=useConfirm();
  const privKey=FC_PRIV_KEY(post.id,miEmail);

  // Mazo privado (localStorage)
  const [privCards,setPrivCards]=useState(()=>{try{return JSON.parse(localStorage.getItem(privKey)||"[]");}catch{return[];}});
  const savePriv=(c)=>{setPrivCards(c);try{localStorage.setItem(privKey,JSON.stringify(c));}catch{}};

  // Mazos compartidos (contenido_curso con tipo="flashcards")
  const [sharedDecks,setSharedDecks]=useState([]);
  const [loadingDecks,setLoadingDecks]=useState(true);

  // Vista activa: "lista"|"practica-priv"|"practica-shared-{id}"|"crear-priv"|"crear-shared"|"editar-shared-{id}"
  const [vista,setVista]=useState("lista");
  const [editingDeck,setEditingDeck]=useState(null);// {id,titulo,cards}

  useEffect(()=>{
    sb.getContenido(post.id,session.access_token)
      .then(items=>{
        const fc=(items||[]).filter(x=>x.tipo==="flashcards");
        setSharedDecks(fc.map(x=>({id:x.id,titulo:x.titulo,cards:JSON.parse(x.texto||"[]")})));
      })
      .catch(()=>{})
      .finally(()=>setLoadingDecks(false));
  },[post.id,session.access_token]);

  const guardarPriv=(titulo,cards)=>{
    savePriv(cards);// título no aplica para el mazo privado único
    setVista("lista");toast("Mazo personal guardado ✓","success");
  };

  const guardarShared=async(titulo,cards)=>{
    if(editingDeck){
      // Editar existente
      await sb.updateContenido(editingDeck.id,{titulo,texto:JSON.stringify(cards)},session.access_token);
      setSharedDecks(prev=>prev.map(d=>d.id===editingDeck.id?{...d,titulo,cards}:d));
      toast("Mazo actualizado ✓","success");
    }else{
      // Crear nuevo
      const r=await sb.insertContenido({publicacion_id:post.id,tipo:"flashcards",titulo,texto:JSON.stringify(cards),orden:999},session.access_token);
      const nuevo=r?.[0];if(nuevo)setSharedDecks(prev=>[...prev,{id:nuevo.id,titulo,cards}]);
      toast("Mazo compartido creado ✓","success");
    }
    setEditingDeck(null);setVista("lista");
  };

  const eliminarShared=async(id)=>{
    if(!await confirmFC({msg:"¿Eliminar este mazo compartido?",confirmLabel:"Eliminar",danger:true}))return;
    await sb.deleteContenido(id,session.access_token).catch(()=>{});
    setSharedDecks(prev=>prev.filter(d=>d.id!==id));
  };

  // ── Práctica privada
  if(vista==="practica-priv")return(
    <div>
      <button onClick={()=>setVista("lista")} style={{background:"none",border:"none",color:C.accent,fontSize:12,cursor:"pointer",fontFamily:FONT,marginBottom:10,fontWeight:700}}>← Volver</button>
      <FlashcardsDeck cards={privCards} titulo="Mi mazo personal" onDelete={i=>{const c=[...privCards];c.splice(i,1);savePriv(c);}}/>
    </div>
  );

  // ── Práctica de mazo compartido
  if(vista.startsWith("practica-shared-")){
    const id=vista.replace("practica-shared-","");
    const deck=sharedDecks.find(d=>d.id===id);
    if(!deck)return null;
    return(
      <div>
        <button onClick={()=>setVista("lista")} style={{background:"none",border:"none",color:C.accent,fontSize:12,cursor:"pointer",fontFamily:FONT,marginBottom:10,fontWeight:700}}>← Volver</button>
        <FlashcardsDeck cards={deck.cards} titulo={deck.titulo}/>
      </div>
    );
  }

  // ── Crear mazo privado
  if(vista==="crear-priv")return(
    <DeckEditor titulo="Mi mazo personal" cards={privCards.length?privCards:[{pregunta:"",respuesta:""}]}
      onSave={guardarPriv} onCancel={()=>setVista("lista")} session={session} post={post} isShared={false}/>
  );

  // ── Crear/editar mazo compartido
  if(vista==="crear-shared"||vista==="editar-shared")return(
    <DeckEditor titulo={editingDeck?.titulo||""} cards={editingDeck?.cards||[{pregunta:"",respuesta:""}]}
      onSave={guardarShared} onCancel={()=>{setEditingDeck(null);setVista("lista");}} session={session} post={post} isShared={true}/>
  );

  // ── Lista de mazos
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {confirmElFC}
      {/* Mazos del docente */}
      {loadingDecks?<Spinner small/>:(sharedDecks.length>0||esStaff)&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:C.muted}}>📢 MAZOS DEL DOCENTE</div>
            {esStaff&&<button onClick={()=>{setEditingDeck(null);setVista("crear-shared");}}
              style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:8,color:C.accent,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:FONT}}>
              + Crear mazo
            </button>}
          </div>
          {sharedDecks.length===0?(
            <div style={{background:C.card,border:`1px dashed ${C.border}`,borderRadius:12,padding:"20px",textAlign:"center",color:C.muted,fontSize:13}}>
              Todavía no hay mazos compartidos.{esStaff?" Creá uno para la clase.":""}
            </div>
          ):sharedDecks.map(deck=>(
            <div key={deck.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
              <span style={{fontSize:20}}>🃏</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,color:C.text,fontSize:13}}>{deck.titulo}</div>
                <div style={{fontSize:11,color:C.muted}}>{deck.cards.length} tarjetas</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setVista(`practica-shared-${deck.id}`)}
                  style={{background:C.accent,border:"none",borderRadius:8,color:"#fff",padding:"6px 13px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>
                  ▶ Practicar
                </button>
                {esStaff&&<>
                  <button onClick={()=>{setEditingDeck(deck);setVista("editar-shared");}}
                    style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"6px 10px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>✏</button>
                  <button onClick={()=>eliminarShared(deck.id)}
                    style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.danger,padding:"6px 10px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>🗑</button>
                </>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mazo privado del alumno */}
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:700,color:C.muted}}>🔒 MI MAZO PERSONAL</div>
          <button onClick={()=>setVista("crear-priv")}
            style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"4px 10px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>
            {privCards.length?"✏ Editar":"+ Crear"}
          </button>
        </div>
        {privCards.length===0?(
          <div style={{background:C.card,border:`1px dashed ${C.border}`,borderRadius:12,padding:"20px",textAlign:"center",color:C.muted,fontSize:13}}>
            Creá tu propio mazo privado para repasar.
          </div>
        ):(
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:20}}>🔒</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,color:C.text,fontSize:13}}>Mi mazo personal</div>
              <div style={{fontSize:11,color:C.muted}}>{privCards.length} tarjetas · solo vos lo ves</div>
            </div>
            <button onClick={()=>setVista("practica-priv")}
              style={{background:C.accent,border:"none",borderRadius:8,color:"#fff",padding:"6px 13px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FONT}}>
              ▶ Practicar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NotasPrivadas({storageKey,session,post}){
  const [nota,setNota]=useState(()=>{try{return localStorage.getItem(storageKey)||"";}catch{return"";}});
  const [saved,setSaved]=useState(true);
  const [expandiendoIA,setExpandiendoIA]=useState(false);
  const timerRef=useRef(null);

  const onChange=(v)=>{
    setNota(v);setSaved(false);
    clearTimeout(timerRef.current);
    timerRef.current=setTimeout(()=>{
      try{localStorage.setItem(storageKey,v);setSaved(true);}catch{}
    },800);
  };

  const expandirConIA=async()=>{
    if(!nota.trim())return;
    setExpandiendoIA(true);
    try{
      const r=await sb.callIA(
        `Sos un asistente educativo. El alumno tomó las siguientes notas del curso "${post.titulo}". Expandilas, completalas y organizalas mejor manteniendo el estilo personal. Conservá el contenido original y agregá contexto útil. Usá español rioplatense.`,
        nota,600,session.access_token
      );
      onChange(nota+"\n\n---\n✨ Expansión IA:\n"+r);
    }catch(e){alert("Error IA: "+e.message);}finally{setExpandiendoIA(false);}
  };

  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:C.surface,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18}}>📝</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,color:C.text,fontSize:14}}>Mis notas</div>
          <div style={{fontSize:11,color:C.muted}}>Privadas · solo vos las ves</div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:10,color:saved?C.success:C.muted}}>{saved?"✓ Guardado":"Guardando…"}</span>
          <button onClick={expandirConIA} disabled={expandiendoIA||!nota.trim()}
            style={{background:"#7B3FBE18",border:"1px solid #7B3FBE33",borderRadius:8,color:"#7B3FBE",padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:FONT,opacity:!nota.trim()?.5:1}}>
            {expandiendoIA?"…":"✨ Expandir con IA"}
          </button>
        </div>
      </div>
      <textarea
        value={nota}
        onChange={e=>onChange(e.target.value)}
        placeholder={`Tomá notas sobre "${post.titulo}"…\n\nSolo vos podés verlas. Guardado automático.`}
        style={{width:"100%",minHeight:380,background:C.bg,border:"none",padding:"16px 18px",color:C.text,fontSize:13,fontFamily:FONT,resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.7}}
      />
    </div>
  );
}

// ─── FORO DEL CURSO (incluye Q&A) ────────────────────────────────────────────
function ForoCurso({post,session,esMio,esAyudante}){
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [texto,setTexto]=useState("");
  const [tipoNuevo,setTipoNuevo]=useState("disc");// "disc"|"qa"
  const [filtro,setFiltro]=useState("todos");// "todos"|"qa"|"disc"
  const [enviando,setEnviando]=useState(false);
  const [expandedPost,setExpandedPost]=useState(null);
  const [respuestas,setRespuestas]=useState({});
  const [respuestaTexto,setRespuestaTexto]=useState({});
  const [generandoIA,setGenerandoIA]=useState(null);
  const miEmail=session.user.email;
  const miNombre=sb.getDisplayName(miEmail)||miEmail.split("@")[0];
  const esStaff=esMio||esAyudante;

  useEffect(()=>{
    sb.getForoPosts(post.id,session.access_token)
      .then(p=>setPosts(p||[]))
      .catch(()=>setPosts([]))
      .finally(()=>setLoading(false));
  },[post.id]);// eslint-disable-line

  const enviarPost=async()=>{
    if(!texto.trim())return;
    setEnviando(true);
    const prefijo=tipoNuevo==="qa"?"[qa] ":"";
    try{
      const r=await sb.insertForoPost({publicacion_id:post.id,autor_email:miEmail,autor_nombre:miNombre,texto:prefijo+texto.trim()},session.access_token);
      setPosts(prev=>[...prev,...(r||[])]);
      setTexto("");
    }catch{
      const fake={id:"local_"+Date.now(),publicacion_id:post.id,autor_email:miEmail,autor_nombre:miNombre,texto:prefijo+texto.trim(),created_at:new Date().toISOString()};
      setPosts(prev=>[...prev,fake]);setTexto("");
    }finally{setEnviando(false);}
  };

  const cargarResps=async(postId)=>{
    if(respuestas[postId])return;
    const r=await sb.getForoRespuestas(postId,session.access_token).catch(()=>[]);
    setRespuestas(prev=>({...prev,[postId]:r||[]}));
  };

  const togglePost=async(postId)=>{
    if(expandedPost===postId){setExpandedPost(null);return;}
    setExpandedPost(postId);await cargarResps(postId);
  };

  const enviarRespuesta=async(postId)=>{
    const txt=(respuestaTexto[postId]||"").trim();if(!txt)return;
    try{
      const r=await sb.insertForoRespuesta({foro_post_id:postId,publicacion_id:post.id,autor_email:miEmail,autor_nombre:miNombre,texto:txt},session.access_token);
      setRespuestas(prev=>({...prev,[postId]:[...(prev[postId]||[]),...(r||[{id:"local_"+Date.now(),autor_email:miEmail,autor_nombre:miNombre,texto:txt,created_at:new Date().toISOString()}])]}));
      setRespuestaTexto(prev=>({...prev,[postId]:""}));
    }catch{
      setRespuestas(prev=>({...prev,[postId]:[...(prev[postId]||[]),{id:"local_"+Date.now(),autor_email:miEmail,autor_nombre:miNombre,texto:txt,created_at:new Date().toISOString()}]}));
      setRespuestaTexto(prev=>({...prev,[postId]:""}));
    }
  };

  const sugerirConIA=async(postId,textoPregunta)=>{
    setGenerandoIA(postId);
    try{
      const r=await sb.callIA(
        `Sos docente del curso "${post.titulo}". Respondé la siguiente pregunta de un alumno de forma clara, concisa y educativa. Usá español rioplatense.`,
        textoPregunta,400,session.access_token
      );
      setRespuestaTexto(prev=>({...prev,[postId]:r}));
    }catch(e){toast("Error IA: "+e.message,"error");}
    setGenerandoIA(null);
  };

  const postsFiltrados=posts.filter(p=>{
    if(filtro==="qa")return p.texto?.startsWith("[qa]");
    if(filtro==="disc")return!p.texto?.startsWith("[qa]");
    return true;
  });
  const totalQA=posts.filter(p=>p.texto?.startsWith("[qa]")).length;
  const totalDisc=posts.filter(p=>!p.texto?.startsWith("[qa]")).length;

  const iS={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:FONT};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {/* Nuevo post */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px"}}>
        {/* Tipo selector */}
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          {[{id:"disc",label:"💬 Discusión"},{id:"qa",label:"❓ Pregunta"}].map(t=>(
            <button key={t.id} onClick={()=>setTipoNuevo(t.id)}
              style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FONT,
                background:tipoNuevo===t.id?C.accent:C.surface,
                color:tipoNuevo===t.id?"#fff":C.muted,
                border:`1px solid ${tipoNuevo===t.id?"transparent":C.border}`}}>
              {t.label}
            </button>
          ))}
        </div>
        <textarea value={texto} onChange={e=>setTexto(e.target.value.slice(0,500))}
          placeholder={tipoNuevo==="qa"?"Escribí tu pregunta al docente o al grupo…":"Escribí tu comentario o aporte…"}
          style={{...iS,minHeight:68,resize:"vertical",marginBottom:8}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:10,color:C.muted}}>{texto.length}/500</span>
          <button onClick={enviarPost} disabled={enviando||!texto.trim()}
            style={{background:C.accent,border:"none",borderRadius:8,color:"#fff",padding:"7px 16px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,opacity:!texto.trim()?0.5:1}}>
            {enviando?"Enviando…":"Publicar →"}
          </button>
        </div>
      </div>

      {/* Filtros */}
      {posts.length>0&&(
        <div style={{display:"flex",gap:4}}>
          {[{id:"todos",label:`Todo (${posts.length})`},{id:"qa",label:`❓ Preguntas (${totalQA})`},{id:"disc",label:`💬 Debates (${totalDisc})`}].map(f=>(
            <button key={f.id} onClick={()=>setFiltro(f.id)}
              style={{padding:"4px 10px",borderRadius:20,fontSize:10,fontWeight:filtro===f.id?700:400,cursor:"pointer",fontFamily:FONT,
                background:filtro===f.id?C.accentDim:"transparent",
                color:filtro===f.id?C.accent:C.muted,
                border:`1px solid ${filtro===f.id?C.accent+"55":C.border}`}}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {loading?<Spinner small/>:postsFiltrados.length===0?(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"30px",textAlign:"center",color:C.muted,fontSize:13}}>
          {filtro==="qa"?"Sin preguntas aún.":filtro==="disc"?"Sin debates aún.":"¡Sé el primero en participar!"}
        </div>
      ):postsFiltrados.map(p=>{
        const isQA=p.texto?.startsWith("[qa]");
        const textoVisible=isQA?p.texto.replace("[qa]","").trim():p.texto;
        const isExpanded=expandedPost===p.id;
        const resps=respuestas[p.id]||[];
        const esMiPost=p.autor_email===miEmail;
        const esDocPost=(p.autor_email===post.autor_email)||(post.ayudantes||[]).includes(p.autor_email);
        return(
          <div key={p.id} style={{background:C.card,border:`1px solid ${isQA?"#F59E0B44":C.border}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"12px 14px"}}>
              <div style={{display:"flex",gap:9,alignItems:"flex-start"}}>
                <Avatar letra={(p.autor_nombre||"?")[0]} size={28}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <span style={{fontWeight:600,color:C.text,fontSize:12}}>
                      {p.autor_nombre||safeDisplayName(null,p.autor_email)}
                      {esDocPost&&<span style={{fontSize:9,background:C.accentDim,color:C.accent,borderRadius:20,padding:"1px 6px",marginLeft:6,border:`1px solid ${C.accent}33`}}>Docente</span>}
                      {isQA&&<span style={{fontSize:9,background:"#F59E0B15",color:"#B45309",borderRadius:20,padding:"1px 6px",marginLeft:4,border:"1px solid #F59E0B33"}}>❓ Pregunta</span>}
                    </span>
                    <span style={{fontSize:10,color:C.muted}}>{fmtRel(p.created_at)}</span>
                  </div>
                  {p.id?.startsWith("local_")&&<div style={{fontSize:10,color:"#B45309",background:"#F59E0B12",border:"1px solid #F59E0B33",borderRadius:6,padding:"2px 8px",marginBottom:4,display:"inline-block"}}>⚠ No guardado — error de conexión</div>}
                  <p style={{color:C.text,fontSize:13,margin:0,lineHeight:1.5}}>{textoVisible}</p>
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:8,paddingLeft:37}}>
                <button onClick={()=>togglePost(p.id)}
                  style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:FONT,padding:0}}>
                  💬 {p.respuestas?.[0]?.count||resps.length||0} respuesta{(p.respuestas?.[0]?.count||resps.length)!==1?"s":""}  {isExpanded?"▴":"▾"}
                </button>
                {(esMiPost||esMio||esAyudante)&&!p.id?.startsWith("local_")&&(
                  <button onClick={async()=>{await sb.deleteForoPost(p.id,session.access_token).catch(()=>{});setPosts(prev=>prev.filter(x=>x.id!==p.id));}}
                    style={{background:"none",border:"none",color:C.danger,fontSize:11,cursor:"pointer",fontFamily:FONT,padding:0}}>Eliminar</button>
                )}
              </div>
            </div>

            {isExpanded&&(
              <div style={{borderTop:`1px solid ${C.border}`,background:C.surface,padding:"10px 14px"}}>
                {resps.length>0&&(
                  <div style={{marginBottom:10,display:"flex",flexDirection:"column",gap:8}}>
                    {resps.map(r=>{
                      const esDocR=r.autor_email===post.autor_email;
                      return(
                        <div key={r.id} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                          <Avatar letra={(r.autor_nombre||"?")[0]} size={22}/>
                          <div style={{flex:1,background:esDocR?"#2EC4A010":C.card,border:`1px solid ${esDocR?"#2EC4A033":C.border}`,borderRadius:8,padding:"7px 10px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                              <span style={{fontWeight:600,color:C.text,fontSize:11}}>
                                {r.autor_nombre||safeDisplayName(null,r.autor_email)}
                                {esDocR&&<span style={{fontSize:9,background:C.accentDim,color:C.accent,borderRadius:20,padding:"1px 5px",marginLeft:5}}>Docente</span>}
                              </span>
                              <span style={{fontSize:9,color:C.muted}}>{fmtRel(r.created_at)}</span>
                            </div>
                            <p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.4}}>{r.texto}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{display:"flex",gap:7,alignItems:"flex-end",flexDirection:"column"}}>
                  {esStaff&&isQA&&(
                    <button onClick={()=>sugerirConIA(p.id,textoVisible)} disabled={!!generandoIA}
                      style={{background:"#7B3FBE15",border:"1px solid #7B3FBE33",borderRadius:8,color:"#7B3FBE",padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:FONT,alignSelf:"flex-end",opacity:generandoIA?0.6:1}}>
                      {generandoIA===p.id?"…":"✨ Sugerir respuesta con IA"}
                    </button>
                  )}
                  <div style={{display:"flex",gap:7,alignItems:"flex-end",width:"100%"}}>
                    <textarea value={respuestaTexto[p.id]||""} onChange={e=>setRespuestaTexto(prev=>({...prev,[p.id]:e.target.value.slice(0,300)}))}
                      placeholder="Escribí una respuesta…"
                      style={{...iS,minHeight:50,resize:"none",flex:1}}/>
                    <button onClick={()=>enviarRespuesta(p.id)} disabled={!(respuestaTexto[p.id]||"").trim()}
                      style={{background:C.accent,border:"none",borderRadius:8,color:"#fff",padding:"9px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,opacity:!(respuestaTexto[p.id]||"").trim()?0.5:1,flexShrink:0}}>
                      ↑
                    </button>
                  </div>
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

      // ── Fondo degradado profesional ──
      const grad=ctx.createLinearGradient(0,0,1200,848);
      grad.addColorStop(0,"#0F3F7A");
      grad.addColorStop(0.5,"#1A6ED8");
      grad.addColorStop(1,"#0A2A5E");
      ctx.fillStyle=grad;
      ctx.fillRect(0,0,1200,848);

      // Círculos decorativos de fondo
      ctx.save();
      ctx.globalAlpha=0.06;
      ctx.fillStyle="#2EC4A0";
      ctx.beginPath();ctx.arc(1100,100,280,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(100,750,200,0,Math.PI*2);ctx.fill();
      ctx.restore();

      // Borde dorado doble
      ctx.strokeStyle="#F5C842";ctx.lineWidth=3;
      ctx.strokeRect(30,30,1140,788);
      ctx.strokeStyle="rgba(245,200,66,.3)";ctx.lineWidth=1;
      ctx.strokeRect(40,40,1120,768);

      // ── Header ──
      // Franja teal superior
      ctx.fillStyle="rgba(46,196,160,.15)";
      ctx.fillRect(30,30,1140,120);

      ctx.fillStyle="#F5C842";
      ctx.font="bold 32px Georgia, serif";
      ctx.textAlign="center";
      ctx.fillText("LUDERIS",600,85);
      ctx.fillStyle="rgba(255,255,255,.6)";
      ctx.font="14px Georgia, serif";
      ctx.fillText("Plataforma Educativa Argentina",600,112);

      // ── Título certificado ──
      ctx.fillStyle="#ffffff";
      ctx.font="bold 42px Georgia, serif";
      ctx.fillText("Certificado de Finalización",600,210);

      // Línea dorada
      ctx.strokeStyle="#F5C842";ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(250,235);ctx.lineTo(950,235);ctx.stroke();

      // ── Cuerpo ──
      ctx.fillStyle="rgba(255,255,255,.65)";
      ctx.font="18px Georgia, serif";
      ctx.fillText("Se certifica que",600,285);

      // Nombre del alumno
      const nombre=session.user.user_metadata?.display_name||safeDisplayName(null,session.user.email)||session.user.email.split("@")[0];
      ctx.fillStyle="#F5C842";
      ctx.font="bold 52px Georgia, serif";
      ctx.fillText(nombre,600,365);

      ctx.fillStyle="#ffffff";
      ctx.font="20px Georgia, serif";
      ctx.fillText("completó exitosamente",600,415);

      // Título del curso
      ctx.fillStyle="#ffffff";
      ctx.font="bold 30px Georgia, serif";
      const titulo=post.titulo.length>55?post.titulo.slice(0,52)+"...":post.titulo;
      ctx.fillText(`"${titulo}"`,600,468);

      // Materia y docente
      ctx.fillStyle="rgba(255,255,255,.7)";
      ctx.font="17px Georgia, serif";
      const docente=post.autor_nombre||safeDisplayName(post.autor_nombre,post.autor_email)||"Docente";
      ctx.fillText(`${post.materia||""}  ·  Docente: ${docente}`,600,515);

      // Línea baja
      ctx.strokeStyle="rgba(245,200,66,.4)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(250,560);ctx.lineTo(950,560);ctx.stroke();

      // ── Footer ──
      const fecha=new Date().toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"});
      ctx.fillStyle="rgba(255,255,255,.6)";
      ctx.font="15px Georgia, serif";
      ctx.fillText(fecha,600,600);

      // ID verificable único
      const uid=[post.id?.slice(0,6)||"XXXXX",Date.now().toString(36).toUpperCase().slice(-4),Math.random().toString(36).slice(2,6).toUpperCase()].join("-");
      ctx.fillStyle="#F5C842";
      ctx.font="bold 13px monospace";
      ctx.fillText(`ID: ${uid}`,600,640);

      ctx.fillStyle="rgba(255,255,255,.4)";
      ctx.font="11px Georgia, serif";
      ctx.fillText(`Verificable en luderis.com/certificado/${uid}`,600,665);

      // Sello "APROBADO"
      ctx.save();
      ctx.translate(1060,690);ctx.rotate(-0.3);
      ctx.strokeStyle="#2EC4A0";ctx.lineWidth=3;
      ctx.strokeRect(-52,-26,104,52);
      ctx.fillStyle="#2EC4A0";
      ctx.font="bold 18px Arial, sans-serif";
      ctx.textAlign="center";
      ctx.fillText("APROBADO",0,7);
      ctx.restore();

      // Guardar en DB para verificación online
      const dataUrl=canvas.toDataURL("image/png");
      sb.db("certificados","POST",{
        id:uid,
        alumno_email:session.user.email,
        alumno_nombre:nombre,
        curso_titulo:post.titulo,
        curso_id:post.id,
        docente_email:post.autor_email,
        docente_nombre:docente,
        materia:post.materia||"",
        fecha_emision:new Date().toISOString(),
      },session.access_token,"return=minimal").catch(()=>{});// no bloquear si falla

      // Descargar
      const link=document.createElement("a");
      link.download=`certificado-${post.titulo.slice(0,30).replace(/\s+/g,"-")}-${uid}.png`;
      link.href=dataUrl;
      link.click();
    }catch(e){alert("Error al generar: "+e.message);}
    finally{setGenerando(false);}
  };

  if(!post.finalizado&&!inscripcion?.clase_finalizada)return null;

  return(
    <button onClick={generar} disabled={generando}
      style={{display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#1A6ED815,#2EC4A015)",
        border:"1px solid #2EC4A040",borderRadius:12,padding:"12px 18px",cursor:"pointer",fontFamily:FONT,
        color:C.success,fontSize:14,fontWeight:700,width:"100%",justifyContent:"center",marginTop:10,
        transition:"all .15s",boxShadow:"0 2px 8px rgba(46,196,160,.1)"}}
      onMouseEnter={e=>e.currentTarget.style.background="linear-gradient(135deg,#1A6ED825,#2EC4A025)"}
      onMouseLeave={e=>e.currentTarget.style.background="linear-gradient(135deg,#1A6ED815,#2EC4A015)"}>
      <span style={{fontSize:18}}>🎓</span>
      {generando?"Generando certificado…":"Descargar certificado"}
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
        `Curso: "${post.titulo}" (materia: ${post.materia})\nHabilidad a evaluar: "${nombre}"\n¿Qué tipo de habilidad es?`
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
      const system=`Sos un experto en evaluación educativa.\nGenerás bancos de preguntas en JSON. Solo respondés con JSON válido sin backticks ni explicación.\nTipo de evaluación: ${paraTipo==="inicial"?"diagnóstico inicial (antes de aprender)":"examen final (después de aprender)"}.\n${paraTipo==="final"?"IMPORTANTE: Las preguntas finales deben ser DISTINTAS a las iniciales pero evaluar los mismos conceptos con mayor profundidad.":""}\nPara ${esParticular?"clases particulares cortas (pocas preguntas, directas)":"cursos completos"}.`;

      let prompt;
      if(esPerformance){
        prompt=`Curso: "${post.titulo}" (${post.materia})\nSkills: ${skillNombres}\nFormato: ${fmt}\n${paraTipo==="inicial"?"Nivel diagnóstico: qué sabe antes de empezar.":"Nivel final: demostrar lo aprendido."}\n\nGenerá ${nPregs} consignas prácticas para ${fmt==="video"?"grabar un video":fmt==="audio"?"subir audio":fmt==="imagen"?"subir foto/imagen":"entregar práctica"}.\nJSON: {"consignas":[{"id":"c1","titulo":"...","instruccion":"...","criterios":["...","..."],"skill":"...","nivel_esperado_inicial":${paraTipo==="inicial"?"0-1":"3-4"}}]}`;
      } else {
        prompt=`Curso: "${post.titulo}" (${post.materia})\nSkills: ${skillNombres}\n${paraTipo==="inicial"?"Diagnóstico ANTES de aprender — preguntas que miden conocimiento previo, nivel básico.":"Examen FINAL — preguntas que demuestran lo aprendido, más profundas que el diagnóstico."}\n\nGenerá exactamente ${nPregs*2} preguntas de multiple choice. El docente va a elegir ${nPregs} de ellas.\nCada pregunta debe indicar a qué skill corresponde.\nJSON: {"preguntas":[{"id":"p1","texto":"...","opciones":["a","b","c","d"],"correcta":0,"skill":"...","dificultad":${paraTipo==="inicial"?"1":"3"},"explicacion":"..."}]}`;
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
    setGuardando(true);
    try{
      await sb.updatePublicacion(post.id,{activo:true},session.access_token);
      setFase("listo");
      if(onValidado)onValidado();
      // Disparar alertas ahora que la pub está activa
      dispararAlertasIA({...post,activo:true},session).catch(()=>{});
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
      // Disparar alertas ahora que la pub está activa
      dispararAlertasIA({...post,activo:true},session).catch(()=>{});
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
      const system=`Sos un generador de evaluaciones educativas. \nGenerás evaluaciones en formato JSON. \nEl formato ${formatoSugerido} fue elegido porque las skills son de tipo ${skillTipo}.\nRespondé SOLO con JSON válido, sin explicación ni backticks.`;
      const prompt=`Curso: "${post.titulo}" (${post.materia})\nTipo de evaluación: ${evalTipo}\nSkills a evaluar: ${skillNombres}\nFormato: ${formatoSugerido}\nNivel del curso: general\n\n${formatoSugerido==="multiple_choice"?`Generá 4 preguntas de multiple choice con 4 opciones cada una. 
JSON: {"preguntas":[{"texto":"...","opciones":["a","b","c","d"],"correcta":0,"skill":"..."}]}`:""}\n${formatoSugerido==="desarrollo"?`Generá 2 preguntas a desarrollar.
JSON: {"preguntas":[{"texto":"...","criterios":"...","skill":"..."}]}`:""}\n${formatoSugerido==="consigna_practica"||formatoSugerido==="imagen"||formatoSugerido==="audio"||formatoSugerido==="video"?`Generá una consigna práctica clara.
JSON: {"consigna":"...","criterios_evaluacion":["...","..."],"formato_entrega":"${formatoSugerido}"}`:""}\n${formatoSugerido==="rubrica"?`Generá una rúbrica de evaluación.
JSON: {"criterios":[{"nombre":"...","niveles":{"1":"...","3":"...","5":"..."}}]}`:""}\n${formatoSugerido==="autoevaluacion"?`Generá preguntas de reflexión.
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
      // Notificar por email a los inscriptos
      sb.getInscripciones(pubId,session.access_token).then(ins=>{
        ins.forEach(insc=>{
          if(insc.alumno_email&&insc.alumno_email!==session.user.email){
            sb.sendEmail("nueva_evaluacion",insc.alumno_email,{
              pub_titulo:evalTitulo,
              tipo_eval:evalTipo,
              curso_titulo:evalTitulo,
            },session.access_token).catch(()=>{});
          }
        });
      }).catch(()=>{});
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
  const email=session?.user?.email||"";
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
      // Notificar por email a los inscriptos que hay una nueva evaluación
      sb.getInscripciones(pubId,session.access_token).then(ins=>{
        ins.forEach(insc=>{
          if(insc.alumno_email&&insc.alumno_email!==session.user.email){
            sb.sendEmail("nueva_evaluacion",insc.alumno_email,{
              pub_titulo:evalTitulo,
              tipo_eval:evalTipo,
              curso_titulo:evalTitulo,
            },session.access_token).catch(()=>{});
          }
        });
      }).catch(()=>{});
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
  const [editingContenidoId,setEditingContenidoId]=useState(null);
  const [mensajesNuevos,setMensajesNuevos]=useState(0);
  const [showDiagnostico,setShowDiagnostico]=useState(false);
  const [showExamenFinal,setShowExamenFinal]=useState(()=>false);
  const [tabActivo,setTabActivo]=useState(()=>{if(post._openValidacion)return"evaluaciones";try{return sessionStorage.getItem("curso_tab_"+post.id)||"contenido";}catch{return "contenido";}});
  const setTab=(t)=>{try{sessionStorage.setItem("curso_tab_"+post.id,t);}catch{}if(t==="chat"){setMensajesNuevos(0);try{sessionStorage.setItem("chat_seen_"+post.id,Date.now());}catch{}}setTabActivo(t);};const [nuevoTipo,setNuevoTipo]=useState("video");const [nuevoTitulo,setNuevoTitulo]=useState("");const [nuevoUrl,setNuevoUrl]=useState("");const [nuevoTexto,setNuevoTexto]=useState("");const [savingC,setSavingC]=useState(false);
  const [calExpanded,setCalExpanded]=useState(false);const [showEditCal,setShowEditCal]=useState(false);const [showFinalizar,setShowFinalizar]=useState(false);const [showDenuncia,setShowDenuncia]=useState(false);const [showCerrarInsc,setShowCerrarInsc]=useState(false);const [localFinalizado,setLocalFinalizado]=useState(!!post.finalizado);const [localCerrado,setLocalCerrado]=useState(!!post.inscripciones_cerradas);
  const [claseActiva,setClaseActiva]=useState(false);const [iniciandoClase,setIniciandoClase]=useState(false);
  const [showJitsiCurso,setShowJitsiCurso]=useState(false);
  const jitsiRoomCurso=`luderis${post.id.replace(/-/g,"").slice(0,20)}`;
  const {confirm:confirmCP,confirmEl:confirmElCP}=useConfirm();
  const esMio=post.autor_email===session.user.email||post.autor_id===session.user.id;const miEmail=session.user.email;const miUid=session.user.id;
  const docenteDisplayName=sb.getDisplayName(miEmail)||miEmail.split("@")[0];const refreshPost=async()=>{try{const pubs=await sb.getMisPublicaciones(post.autor_email,session.access_token);const fresh=pubs.find(p=>p.id===post.id);if(fresh&&onUpdatePost)onUpdatePost(fresh);}catch{}};
  const iniciarClase=async()=>{
    setIniciandoClase(true);
    try{
      const inscs=await sb.getInscripciones(post.id,session.access_token).catch(()=>[]);
      const jitsiUrl=`https://meet.jit.si/${jitsiRoomCurso}`;
      let enviados=0;
      // Notificaciones in-app + emails a todos los inscriptos
      for(const ins of inscs){
        const email=ins.alumno_email;if(!email)continue;
        try{
          await sb.insertNotificacion({usuario_id:ins.alumno_id||null,alumno_email:email,tipo:"clase_iniciada",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token);
          await sb.sendEmail("clase_iniciada",email,{pub_titulo:post.titulo,docente_nombre:docenteDisplayName,jitsi_url:jitsiUrl},session.access_token);
          enviados++;
        }catch(e){console.warn("Error notif a",email,e.message);}
      }
      const emails=inscs.map(i=>i.alumno_email).filter(Boolean);
      setClaseActiva(true);
      setShowJitsiCurso(true);
      if(emails.length===0){
        toast("Clase iniciada. No hay alumnos inscriptos todavía.","info",4000);
      } else {
        toast(`Clase iniciada · ${enviados}/${emails.length} alumno${emails.length!==1?"s":""} notificado${enviados!==1?"s":""}. ✓`,"success",5000);
      }
    }catch(e){alert("Error al iniciar la clase: "+e.message);}
    finally{setIniciandoClase(false);}
  };
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
            const ok=await confirmCP({msg:"⚠️ Esta clase se pisa con:\n"+choques.slice(0,3).join("\n")+"\n\n¿Querés inscribirte igual?",confirmLabel:"Inscribirme igual",cancelLabel:"Cancelar"});
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
      {!cerrado&&(inscLoading?<Spinner/>:<Btn onClick={inscribirse} variant="success" style={{padding:"10px 28px",fontSize:14}}>Inscribirme →</Btn>)}
      <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:13,cursor:"pointer",fontFamily:FONT}}>Volver atrás</button>
    </div>);
  }
  const iS={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:8};
  return(
    <div  ref={pageRef} style={{position:"fixed",inset:0,background:C.bg,zIndex:300,overflowY:"auto",fontFamily:FONT}}>
      {confirmElCP}
      {showJitsiCurso&&<JitsiModal roomName={jitsiRoomCurso} displayName={docenteDisplayName} onClose={()=>setShowJitsiCurso(false)}/>}
      {/* Banner "Clase en vivo" para alumnos */}
      {claseActiva&&!esMio&&(
        <div style={{background:"linear-gradient(135deg,#C8000015,#E0000022)",borderBottom:"1px solid #C8000033",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:"#E05C5C",display:"inline-block",animation:"pulse 1s infinite"}}/>
            <span style={{fontWeight:700,color:"#C80000",fontSize:13}}>Clase en vivo ahora</span>
            <span style={{color:"#C80000",fontSize:12,opacity:.8}}>{docenteDisplayName||post.autor_nombre} está esperándote</span>
          </div>
          <button onClick={()=>setShowJitsiCurso(true)} style={{background:"#C80000",border:"none",borderRadius:9,color:"#fff",padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:FONT,display:"flex",alignItems:"center",gap:6}}>📹 Unirme ahora</button>
        </div>
      )}
      <div style={{position:"sticky",top:0,zIndex:10,background:C.sidebar,borderBottom:`1px solid ${C.border}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <button onClick={onClose} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>← Volver</button>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:C.text,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.titulo}</div><div style={{fontSize:11,color:C.muted}}>{post.materia} · {post.autor_nombre||safeDisplayName(post.autor_nombre,post.autor_email)}</div></div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {esMio&&!localFinalizado&&!localCerrado&&<button onClick={()=>setShowCerrarInsc(true)} style={{background:"#E0955C15",border:"1px solid #E0955C33",borderRadius:9,color:C.warn,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:600}}>Cerrar inscripciones</button>}
          {esMio&&!localFinalizado&&localCerrado&&<button onClick={async()=>{try{await sb.updatePublicacion(post.id,{inscripciones_cerradas:false},session.access_token);post.inscripciones_cerradas=false;post.inscripcionesCerradas=false;setLocalCerrado(false);if(onUpdatePost)onUpdatePost({...post,inscripciones_cerradas:false});}catch(e){alert("Error: "+e.message);}}} style={{background:"#4ECB7115",border:"1px solid #4ECB7133",borderRadius:9,color:C.success,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:600}}>Reabrir inscripciones</button>}
          {esMio&&!localFinalizado&&<button onClick={claseActiva?()=>setShowJitsiCurso(true):iniciarClase} disabled={iniciandoClase}
            style={{background:claseActiva?"#C8000018":"linear-gradient(135deg,#1A6ED8,#2EC4A0)",border:claseActiva?"1px solid #C8000044":"none",borderRadius:9,color:claseActiva?"#C80000":"#fff",padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT,fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
            {claseActiva?<><span style={{width:6,height:6,borderRadius:"50%",background:"#C80000",animation:"pulse 1s infinite",display:"inline-block"}}/>Clase en vivo</>:iniciandoClase?"Iniciando…":"▶ Iniciar clase"}
          </button>}
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
              :<Btn onClick={inscribirse} variant="success" style={{padding:"7px 14px",fontSize:12}}>Inscribirme →</Btn>
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
                  // ayudantes[] stores UUIDs — compare with alumno_id
                  const isAyud=(post.ayudantes||[]).includes(ins.alumno_id);
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
                      // store UUID, not email
                      const newAyuds=isAyud?ayuds.filter(id=>id!==ins.alumno_id):[...ayuds,ins.alumno_id];
                      await sb.updatePublicacion(post.id,{ayudantes:newAyuds},session.access_token);
                      post.ayudantes=newAyuds;setInscripciones([...inscripciones]);
                      // Notificar al nuevo ayudante
                      if(!isAyud){
                        sb.insertNotificacion({usuario_id:ins.alumno_id||null,alumno_email:ins.alumno_email,tipo:"nuevo_ayudante",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
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
          {esMio&&<div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            {[
              {icon:"👥",label:"Inscriptos",value:inscripciones.length},
              {icon:"⭐",label:"Rating",value:parseFloat(post.calificacion_promedio||0)>0?parseFloat(post.calificacion_promedio).toFixed(1)+"★":"—"},
              {icon:"📝",label:"Contenido",value:contenido.length},
            ].map(s=>(
              <div key={s.label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 13px",flex:1,minWidth:80}}>
                <div style={{fontSize:10,color:C.muted}}>{s.icon} {s.label}</div>
                <div style={{fontWeight:700,color:C.text,fontSize:16,marginTop:1}}>{s.value}</div>
              </div>
            ))}
          </div>}
          {/* ── TABS ── */}
          <style>{`.curso-tabs::-webkit-scrollbar{display:none}`}</style>
          <div className="curso-tabs" style={{display:"flex",gap:2,marginBottom:14,background:C.card,borderRadius:12,padding:4,border:`1px solid ${C.border}`,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",flexWrap:"nowrap"}}>
            {[
              {id:"contenido",label:"📁 Contenido"},
              ...(post.tipo==="oferta"&&(esMio||esAyudante)?[
                {id:"evaluaciones",label:"🎓 Evaluaciones",pendiente:esPendienteValidacion},
                {id:"notas",label:"📊 Notas"},
                {id:"progreso",label:"📈 Progreso"},
              ]:[]),
              ...(hasCal?[{id:"calendario",label:"📅 Calendario"}]:[]),
              {id:"flashcards",label:"🃏 Flashcards"},
              {id:"misnotas",label:"📝 Mis notas"},
              {id:"foro",label:"🗣 Foro / Q&A"},
              {id:"chat",label:mensajesNuevos>0?`💬 Chat (${mensajesNuevos})`:"💬 Chat"},
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setTab(tab.id)}
                style={{flexShrink:0,padding:"7px 8px",borderRadius:9,border:tab.pendiente?`1.5px solid ${C.accent}`:"none",
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
                <ValidacionWizard post={post} session={session} onValidado={()=>{if(onUpdatePost)onUpdatePost({...post,activo:true,estado_validacion:"validado"});dispararAlertasIA({...post,activo:true},session).catch(()=>{});}}/>
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

          {/* ── TAB: Progreso ── */}
          {tabActivo==="progreso"&&(esMio||esAyudante)&&<div style={{marginBottom:18}}>
            <ProgresoCurso post={post} session={session}/>
          </div>}

          {/* ── TAB: Calendario ── */}
          {tabActivo==="calendario"&&(()=>{
            const clasesSinc=(()=>{try{return post.clases_sinc?JSON.parse(post.clases_sinc):[];}catch{return[];}})();
            const descripcion=`Curso en Luderis: ${post.titulo}`;
            return(
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px",marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
                <div style={{fontWeight:700,color:C.text,fontSize:15}}>Calendario de clases</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {hasCal&&clasesSinc.length>0&&(
                    <>
                      {/* Google Calendar: un botón por cada día */}
                      {clasesSinc.map((c,i)=>(
                        <a key={i} href={buildGCalUrl(post.titulo,descripcion,c.dia,c.hora_inicio,c.hora_fin,post.fecha_inicio,post.fecha_fin)}
                          target="_blank" rel="noopener noreferrer"
                          style={{background:"#EA433515",border:"1px solid #EA433544",borderRadius:8,color:"#EA4335",padding:"5px 11px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4,transition:"opacity .15s"}}
                          onMouseEnter={e=>e.currentTarget.style.opacity=".75"}
                          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                          📅 Google Cal · {c.dia}
                        </a>
                      ))}
                      {/* Descargar ICS */}
                      <button onClick={()=>descargarICS(generarICS(post.titulo,descripcion,clasesSinc,post.fecha_inicio,post.fecha_fin),post.titulo.slice(0,30))}
                        style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:8,color:C.accent,padding:"5px 11px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:600}}>
                        ⬇ Descargar .ics
                      </button>
                    </>
                  )}
                  {esMio&&<button onClick={()=>setShowEditCal(true)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"5px 11px",cursor:"pointer",fontSize:11,fontFamily:FONT,fontWeight:600}}>✏ Editar</button>}
                </div>
              </div>
              {hasCal?<CalendarioCurso post={post} compact={false}/>:<div style={{textAlign:"center",padding:"40px 0",color:C.muted,fontSize:13}}>{esMio?"No cargaste horarios aún. Hacé click en Editar para empezar.":"Este curso no tiene horarios definidos."}</div>}
            </div>
            );
          })()}

          {/* ── TAB: Flashcards ── */}
          {tabActivo==="flashcards"&&<div style={{marginBottom:18}}>
            {tieneAcceso
              ?<Flashcards post={post} session={session} esMio={esMio} esAyudante={esAyudante}/>
              :<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"30px",textAlign:"center",color:C.muted,fontSize:13}}>Inscribite para usar las flashcards.</div>
            }
          </div>}

          {/* ── TAB: Foro ── */}
          {tabActivo==="foro"&&<div style={{marginBottom:18}}>
            {tieneAcceso
              ?<ForoCurso post={post} session={session} esMio={esMio} esAyudante={esAyudante}/>
              :<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"30px",textAlign:"center",color:C.muted,fontSize:13}}>Inscribite para participar en el foro.</div>
            }
          </div>}

          {/* ── TAB: Notas ── */}
          {tabActivo==="misnotas"&&(()=>{
            const notaKey=`cl_nota_${post.id}_${miEmail}`;
            return(
              <NotasPrivadas storageKey={notaKey} session={session} post={post}/>
            );
          })()}

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
// ─── MERCADO PAGO CHECKOUT BTN ────────────────────────────────────────────────
function MPCheckoutBtn({post,session,onInscripcionOk,precioOverride=null,cantidadOverride=1,paqueteNombre=null}){
  const [estado,setEstado]=useState("idle");
  const pagar=async()=>{
    if(estado==="loading")return;
    setEstado("loading");
    try{
      const nombre=sb.getDisplayName(session.user.email)||session.user.email.split("@")[0];
      const precioFinal=precioOverride||Number(post.precio);
      const tituloFinal=paqueteNombre?`${post.titulo} — ${paqueteNombre}`:post.titulo;
      const result=await sb.createMPCheckout({
        publicacion_id:post.id,titulo:tituloFinal,
        descripcion:(post.descripcion||"").slice(0,100),
        precio:precioFinal,modo:post.modo||"particular",
        cantidad:cantidadOverride,alumno_email:session.user.email,
        alumno_nombre:nombre,docente_email:post.autor_email,
      },session.access_token);
      if(result.disabled){toast("El pago online estará disponible pronto. Coordiná directamente con el docente 🤝","info",5000);setEstado("idle");return;}
      try{localStorage.setItem("mp_pending",JSON.stringify({pub_id:post.id,preference_id:result.preference_id}));}catch{}
      window.location.href=result.checkout_url;
    }catch(err){toast("No se pudo iniciar el pago: "+err.message,"error",4000);setEstado("idle");}
  };
  return(
    <button onClick={pagar} disabled={estado==="loading"}
      style={{width:"100%",background:estado==="loading"?"#aaa":"linear-gradient(135deg,#009EE3,#0070BA)",border:"none",borderRadius:12,color:"#fff",padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 14px rgba(0,158,227,.3)"}}>
      <span style={{fontSize:18}}>💳</span>{estado==="loading"?"Procesando…":"Mercado Pago"}
    </button>
  );
}



// ─── STRIPE CHECKOUT ──────────────────────────────────────────────────────────
const STRIPE_PK = "pk_test_51TGvrrEECThBDJjlxehFtrHCHNl5fkKFJwPtABfeTQ8bFFX9mJPnYUxDi2p07jlhFyuZjkT7uB4ySakSqLZ2gz3r00IXgCMukD";

function StripeCheckoutBtn({post, session, onDone, onClose}){
  const [estado, setEstado] = useState("idle");
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [nombre, setNombre] = useState(sb.getDisplayName(session.user.email)||"");
  const [errorMsg, setErrorMsg] = useState("");
  const [stripeLoaded, setStripeLoaded] = useState(!!window.Stripe);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(()=>{
    if(window.Stripe){ setStripeLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.onload = () => setStripeLoaded(true);
    document.head.appendChild(script);
  },[]);

  const iniciarPago = async() => {
    setEstado("loading"); setErrorMsg("");
    try{
      const moneda = (post.moneda||"ARS").toLowerCase()==="usd"?"usd":"ars";
      const res = await fetch("https://hptdyehzqfpgtrpuydny.supabase.co/functions/v1/stripe-checkout",{
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGR5ZWh6cWZwZ3RycHV5ZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzYyODIsImV4cCI6MjA4ODQxMjI4Mn0.apesTxMiG-WJbhtfpxorLPagiDAnFH826wR0CuZ4y_g"},
        body: JSON.stringify({
          action:"create_payment_intent",
          publicacion_id:post.id, titulo:post.titulo,
          precio:post.precio, moneda,
          alumno_email:session.user.email,
          alumno_nombre:sb.getDisplayName(session.user.email)||"",
          docente_email:post.autor_email,
          comision_pct:10,
        })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||"Error al iniciar pago");
      setClientSecret(data.client_secret);
      setPaymentIntentId(data.payment_intent_id);
      setEstado("form");
    }catch(e){ setErrorMsg(e.message); setEstado("error"); }
  };

  useEffect(()=>{
    if(estado!=="form"||!clientSecret||!stripeLoaded||mountedRef.current)return;
    mountedRef.current = true;
    try{
      stripeRef.current = window.Stripe(STRIPE_PK);
      elementsRef.current = stripeRef.current.elements({clientSecret, locale:"es-419"});
      const paymentEl = elementsRef.current.create("payment",{layout:"tabs"});
      setTimeout(()=>{
        const el = document.getElementById("stripe-payment-element");
        if(el) paymentEl.mount("#stripe-payment-element");
      },100);
    }catch(e){ setErrorMsg(e.message); }
  },[estado, clientSecret, stripeLoaded]);

  const confirmarPago = async(e) => {
    e.preventDefault();
    if(!stripeRef.current||!elementsRef.current)return;
    setEstado("processing"); setErrorMsg("");
    try{
      const {error} = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        confirmParams:{ return_url: window.location.href, payment_method_data:{billing_details:{name:nombre||session.user.email}} },
        redirect:"if_required",
      });
      if(error){ setErrorMsg(error.message); setEstado("form"); return; }
      await sb.insertInscripcion({publicacion_id:post.id,alumno_id:session.user.id,alumno_email:session.user.email,metodo_pago:"stripe",stripe_payment_intent:paymentIntentId},session.access_token);
      sb.insertNotificacion({usuario_id:null,alumno_email:post.autor_email,tipo:"nueva_inscripcion",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      const alumnoNombre=sb.getDisplayName(session.user.email)||session.user.email.split("@")[0];
      sb.sendEmail("nueva_inscripcion",post.autor_email,{pub_titulo:post.titulo,alumno_nombre:alumnoNombre},session.access_token).catch(()=>{});
      toast("¡Pago exitoso! Ya tenés acceso","success",4000);
      setEstado("done");
      setTimeout(()=>{onClose();onDone();},800);
    }catch(e){ setErrorMsg(e.message); setEstado("form"); }
  };

  if(estado==="done") return(
    <div style={{textAlign:"center",padding:"24px 0"}}>
      <div style={{fontSize:40,marginBottom:8}}>✅</div>
      <div style={{color:C.success,fontWeight:700,fontSize:15}}>¡Pago exitoso!</div>
      <div style={{color:C.muted,fontSize:13,marginTop:4}}>Ya tenés acceso a la clase</div>
    </div>
  );

  if(estado==="idle"||estado==="error") return(
    <div>
      <button onClick={iniciarPago}
        style={{width:"100%",background:"linear-gradient(135deg,#635BFF,#7C3AED)",border:"none",borderRadius:12,color:"#fff",padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 14px rgba(99,91,255,.3)"}}>
        <span style={{fontSize:18}}>💳</span> Pagar con tarjeta
      </button>
      {errorMsg&&<div style={{color:C.danger,fontSize:12,marginTop:8,textAlign:"center"}}>{errorMsg}</div>}
    </div>
  );

  if(estado==="loading") return(
    <div style={{textAlign:"center",padding:"20px 0"}}>
      <Spinner/>
      <div style={{color:C.muted,fontSize:13,marginTop:8}}>Preparando formulario…</div>
    </div>
  );

  return(
    <form onSubmit={confirmarPago}>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",color:C.muted,fontSize:12,fontWeight:600,marginBottom:6}}>NOMBRE EN LA TARJETA</label>
        <input value={nombre} onChange={e=>setNombre(e.target.value)}
          placeholder="Como aparece en la tarjeta"
          style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:14,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
      </div>
      <div id="stripe-payment-element" style={{marginBottom:16,minHeight:200}}/>
      {errorMsg&&<div style={{color:C.danger,fontSize:12,marginBottom:10,textAlign:"center"}}>{errorMsg}</div>}
      <button type="submit" disabled={estado==="processing"}
        style={{width:"100%",background:estado==="processing"?"#aaa":"linear-gradient(135deg,#635BFF,#7C3AED)",border:"none",borderRadius:12,color:"#fff",padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 14px rgba(99,91,255,.3)"}}>
        {estado==="processing"?"Procesando…":"Confirmar pago"}
      </button>
      <div style={{textAlign:"center",fontSize:10,color:C.muted,marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
        <span>🔒</span> Pago seguro con Stripe · TLS encriptado
      </div>
    </form>
  );
}

// Modal unificado de inscripción con selector de método de pago
function InscripcionModal({post,session,onClose,onDone}){
  // Parsear paquetes disponibles (antes de los states que dependen de esto)
  const paquetesDisp=React.useMemo(()=>{
    if(!post.paquetes||post.paquetes==="null")return [];
    try{
      const parsed=JSON.parse(post.paquetes);
      if(!Array.isArray(parsed))return [];
      return parsed.filter(p=>p&&p.clases>0);
    }catch(e){return [];}
  },[post.paquetes]);

  const [paso,setPaso]=useState(1); // 1=elegir cantidad (o skip si no hay paquetes) 2=elegir pago
  const [metodo,setMetodo]=useState(null);// null | "mp" | "stripe" | "gratis"
  const [loadingInsc,setLoadingInsc]=useState(false);
  const [errInsc,setErrInsc]=useState("");

  // Precio efectivo según paquete elegido
  const tienePrecio=post.precio&&parseFloat(post.precio)>0;
  const precioBase=parseFloat(post.precio)||0;
  const inscribirDirecto=async(metodoElegido)=>{
    setLoadingInsc(true);
    try{
      await sb.insertInscripcion({publicacion_id:post.id,alumno_id:session.user.id,alumno_email:session.user.email},session.access_token);
      sb.insertNotificacion({usuario_id:null,alumno_email:post.autor_email,tipo:"nueva_inscripcion",publicacion_id:post.id,pub_titulo:post.titulo,leida:false},session.access_token).catch(()=>{});
      const alumnoNombre=sb.getDisplayName(session.user.email)||session.user.email.split("@")[0];
      sb.sendEmail("nueva_inscripcion",post.autor_email,{pub_titulo:post.titulo,alumno_nombre:alumnoNombre},session.access_token).catch(()=>{});
      // Info del mail según lo que eligió
      const esPruebaLocal=metodoElegido==="prueba";
      const paqueteInfo=paqueteElegido&&!esPruebaLocal?`${paqueteElegido.nombre||paqueteElegido.clases+" clases"}`:null;
      const precioMail=esPruebaLocal?(parseFloat(post.precio_prueba)||0):precioEfectivo;
      const clasesCount=paqueteElegido&&!esPruebaLocal?(paqueteElegido.clases||1):1;
      // Email al alumno
      sb.sendEmail("comprobante_inscripcion",session.user.email,{
        pub_titulo:post.titulo,
        docente_nombre:post.autor_nombre||post.autor_email.split("@")[0],
        modalidad:post.modalidad||"",
        precio:precioMail,
        moneda:post.moneda||"ARS",
        paquete:esPruebaLocal?"Clase de prueba":paqueteInfo,
        clases:clasesCount,
      },session.access_token).catch(()=>{});
      // Email al docente
      sb.sendEmail("nueva_inscripcion",post.autor_email,{
        pub_titulo:post.titulo,
        alumno_nombre:session.user.email.split("@")[0],
        precio:precioMail,
        moneda:post.moneda||"ARS",
        paquete:esPruebaLocal?"Clase de prueba":paqueteInfo,
        clases:clasesCount,
      },session.access_token).catch(()=>{});
      toast("¡Inscripción exitosa! Ya tenés acceso","success",4000);
      setTimeout(()=>{onClose();onDone();},700);
    }catch(e){
      if(e.message?.includes("uq_inscripcion")){onClose();onDone();}
      else{toast("Error al inscribirse: "+e.message,"error");setErrInsc("Error: "+e.message);}
    }finally{setLoadingInsc(false);}
  };



  // ── Selección unificada: qué comprar ──────────────────────────────────────
  // opcion: null | "clase" | "paquete_N" | "prueba"
  const [opcion, setOpcion] = useState(null);

  // Derivar paquete elegido y precio efectivo desde opcion
  const paqueteElegido = React.useMemo(()=>{
    if(!opcion||!opcion.startsWith("paquete_"))return null;
    const clases=parseInt(opcion.split("_")[1]);
    return paquetesDisp.find(p=>p.clases===clases)||null;
  },[opcion,paquetesDisp]);

  const esPrueba = opcion==="prueba";

  // Lógica de precio simplificada:
  // - Sin pack:  precio = post.precio,       cantidad = 1
  // - Con pack:  precio = pack.precio_total,  cantidad = 1  (pack ya tiene el total)
  // - Prueba:    precio = precio_prueba,       cantidad = 1
  const mpPrecio = React.useMemo(()=>{
    if(esPrueba) return parseFloat(post.precio_prueba)||0;
    if(paqueteElegido){
      const pt=parseFloat(paqueteElegido.precio_total)||0;
      const desc=parseFloat(paqueteElegido.descuento)||0;
      if(pt>0)return pt;
      if(desc>0)return Math.round(precioBase*(paqueteElegido.clases||1)*(1-desc/100));
      return precioBase*(paqueteElegido.clases||1);
    }
    return precioBase;
  },[esPrueba,paqueteElegido,precioBase,post.precio_prueba]);

  const mpCantidad = 1; // siempre 1 — el precio ya incluye todo

  const precioEfectivo = mpPrecio; // alias para compatibilidad

  const precioLabel = React.useMemo(()=>{
    if(!opcion)return "";
    const mon=post.moneda||"ARS";
    if(esPrueba){
      const pp=parseFloat(post.precio_prueba)||0;
      return pp>0?`${mon} $${pp.toLocaleString("es-AR")} (prueba)`:"Gratis (prueba)";
    }
    if(paqueteElegido){
      return `${mon} $${mpPrecio.toLocaleString("es-AR")} (${paqueteElegido.clases} clases)`;
    }
    return tienePrecio?`${mon} $${precioBase.toLocaleString("es-AR")}`:"Gratis";
  },[opcion,esPrueba,paqueteElegido,mpPrecio,precioBase,tienePrecio,post.moneda,post.precio_prueba]);

  // Ir a pago solo si hay precio; si es gratis inscribir directo
  const continuarAlPago = () => {
    if(!opcion){return;}
    const gratis=(esPrueba&&!(parseFloat(post.precio_prueba)>0))||(!tienePrecio&&!esPrueba);
    if(gratis){
      inscribirDirecto(esPrueba?"prueba":"gratis");
    }else{
      setPaso(2);
    }
  };

  // Si no hay paquetes ni prueba, skip paso 1
  React.useEffect(()=>{
    if(paquetesDisp.length===0&&!post.tiene_prueba){
      setOpcion("clase");
      setPaso(2);
    }
  },[paquetesDisp,post.tiene_prueba]);

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",fontFamily:FONT}} onClick={onClose}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,width:"min(420px,98vw)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:"20px 22px 16px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <h3 style={{margin:0,color:C.text,fontSize:17,fontWeight:700}}>
                {paso===1?"Inscribirse":"Elegí cómo pagar"}
              </h3>
              <div style={{color:C.muted,fontSize:12,marginTop:2}}>{post.titulo}</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",padding:"0 4px",lineHeight:1}}>×</button>
          </div>
          {/* Precio seleccionado */}
          {opcion&&(
            <div style={{background:C.bg,borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:C.muted,fontSize:13}}>
                {esPrueba?"Clase de prueba":paqueteElegido?`${paqueteElegido.nombre||paqueteElegido.clases+" clases"}`:"1 clase"}
              </span>
              <span style={{color:C.accent,fontWeight:800,fontSize:16}}>{precioLabel}</span>
            </div>
          )}
        </div>

        <div style={{padding:"16px 22px 22px",display:"flex",flexDirection:"column",gap:10}}>

          {/* ── PASO 1: Qué comprar ── */}
          {paso===1&&(
            <>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>

                {/* 1 clase */}
                <button onClick={()=>setOpcion("clase")}
                  style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderRadius:10,border:`2px solid ${opcion==="clase"?C.accent:C.border}`,background:opcion==="clase"?C.accentDim:C.bg,cursor:"pointer",fontFamily:FONT,transition:"all .15s",textAlign:"left"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:opcion==="clase"?C.accent:C.text}}>1 clase</div>
                    <div style={{fontSize:11,color:C.muted}}>Precio estándar</div>
                  </div>
                  <div style={{fontWeight:800,fontSize:14,color:opcion==="clase"?C.accent:C.text}}>
                    {tienePrecio?`${post.moneda||"ARS"} $${precioBase.toLocaleString("es-AR")}`:"Gratis"}
                  </div>
                </button>

                {/* Paquetes */}
                {paquetesDisp.map((pq,i)=>{
                  const pt=parseFloat(pq.precio_total)||0;
                  const desc=parseFloat(pq.descuento)||0;
                  const total=pt>0?pt:(desc>0?Math.round(precioBase*(pq.clases||1)*(1-desc/100)):precioBase*(pq.clases||1));
                  const porClase=Math.round(total/(pq.clases||1));
                  const key=`paquete_${pq.clases}`;
                  const activo=opcion===key;
                  return(
                    <button key={i} onClick={()=>setOpcion(key)}
                      style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderRadius:10,border:`2px solid ${activo?C.success:C.border}`,background:activo?C.success+"12":C.bg,cursor:"pointer",fontFamily:FONT,transition:"all .15s",textAlign:"left"}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:activo?C.success:C.text}}>
                          {pq.nombre||`${pq.clases} clases`}
                          {desc>0&&<span style={{marginLeft:7,fontSize:10,background:C.success+"25",color:C.success,borderRadius:20,padding:"2px 7px",fontWeight:700}}>-{desc}%</span>}
                        </div>
                        <div style={{fontSize:11,color:C.muted}}>${porClase.toLocaleString("es-AR")}/clase</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontWeight:800,fontSize:14,color:activo?C.success:C.text}}>{post.moneda||"ARS"} ${total.toLocaleString("es-AR")}</div>
                        {desc>0&&<div style={{fontSize:10,color:C.muted,textDecoration:"line-through"}}>${(precioBase*(pq.clases||1)).toLocaleString("es-AR")}</div>}
                      </div>
                    </button>
                  );
                })}

                {/* Clase de prueba */}
                {post.tiene_prueba&&(
                  <button onClick={()=>setOpcion("prueba")}
                    style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderRadius:10,border:`2px solid ${opcion==="prueba"?"#2EC4A0":C.border}`,background:opcion==="prueba"?"#2EC4A012":C.bg,cursor:"pointer",fontFamily:FONT,transition:"all .15s",textAlign:"left"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:opcion==="prueba"?"#0F6E56":C.text}}>🎓 Clase de prueba</div>
                      <div style={{fontSize:11,color:C.muted}}>
                        {parseFloat(post.precio_prueba)>0?`Precio especial · ${post.moneda||"ARS"} $${Number(post.precio_prueba).toLocaleString("es-AR")}`:"Sin compromiso · primera clase gratis"}
                      </div>
                    </div>
                    <div style={{fontWeight:800,fontSize:14,color:opcion==="prueba"?"#0F6E56":C.text}}>
                      {parseFloat(post.precio_prueba)>0?`${post.moneda||"ARS"} $${Number(post.precio_prueba).toLocaleString("es-AR")}`:"Gratis"}
                    </div>
                  </button>
                )}

              </div>

              <button onClick={continuarAlPago} disabled={!opcion}
                style={{background:opcion?"linear-gradient(135deg,#1A6ED8,#2EC4A0)":C.border,border:"none",borderRadius:12,color:opcion?"#fff":C.muted,padding:"13px",fontWeight:700,fontSize:15,cursor:opcion?"pointer":"default",fontFamily:FONT,marginTop:4,transition:"all .2s"}}>
                {opcion?(esPrueba&&!(parseFloat(post.precio_prueba)>0))?"Inscribirme gratis →":"Continuar →":"Elegí una opción"}
              </button>
            </>
          )}

          {/* ── PASO 2: Cómo pagar ── */}
          {paso===2&&(
            <>
              <button onClick={()=>setPaso(1)}
                style={{background:"none",border:"none",color:C.muted,fontSize:13,cursor:"pointer",fontFamily:FONT,textAlign:"left",padding:"0 0 4px",display:"flex",alignItems:"center",gap:4}}>
                ← Cambiar opción
              </button>

              {!metodo&&(
                <>
                  {(tienePrecio||esPrueba)&&(
                    <button onClick={()=>setMetodo("mp")}
                      style={{background:"linear-gradient(135deg,#009EE3,#0070BA)",border:"none",borderRadius:14,color:"#fff",padding:"14px 18px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:12,textAlign:"left",boxShadow:"0 4px 14px rgba(0,158,227,.25)"}}>
                      <span style={{fontSize:22}}>💳</span>
                      <div>
                        <div>Mercado Pago</div>
                        <div style={{fontWeight:400,fontSize:11,opacity:.85}}>Tarjeta, débito, efectivo · Hasta 12 cuotas</div>
                      </div>
                    </button>
                  )}
                  {(tienePrecio||esPrueba)&&(post.moneda==="USD"||post.moneda==="EUR")&&(
                    <button onClick={()=>setMetodo("stripe")}
                      style={{background:"linear-gradient(135deg,#635BFF,#7C3AED)",border:"none",borderRadius:14,color:"#fff",padding:"14px 18px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:12,textAlign:"left",boxShadow:"0 4px 14px rgba(99,91,255,.25)"}}>
                      <span style={{fontSize:22}}>💳</span>
                      <div>
                        <div style={{fontWeight:700}}>Tarjeta crédito / débito</div>
                        <div style={{fontWeight:400,fontSize:11,opacity:.85}}>Pago internacional · USD / EUR</div>
                      </div>
                    </button>
                  )}
                  <button onClick={()=>inscribirDirecto("coordinar")}
                    style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,color:C.text,padding:"14px 18px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
                    <span style={{fontSize:22}}>🤝</span>
                    <div>
                      <div>Coordinar con el docente</div>
                      <div style={{fontWeight:400,fontSize:11,color:C.muted}}>Sin pago online · El docente te contactará</div>
                    </div>
                  </button>
                </>
              )}
              {metodo==="mp"&&<MPCheckoutBtn post={post} session={session} onInscripcionOk={()=>{onClose();onDone();}} precioOverride={mpPrecio} cantidadOverride={mpCantidad} paqueteNombre={paqueteElegido?paqueteElegido.nombre||`${paqueteElegido.clases} clases`:esPrueba?"Clase de prueba":null}/>}
              {metodo==="stripe"&&<StripeCheckoutBtn post={post} session={session} onDone={onDone} onClose={onClose}/>}
              {loadingInsc&&<div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center",padding:"8px",color:C.muted,fontSize:13}}><Spinner small/>Procesando…</div>}
              {errInsc&&<div style={{color:C.danger,fontSize:12,padding:"8px 12px",background:C.danger+"10",borderRadius:8,textAlign:"center"}}>{errInsc}</div>}
            </>
          )}

        </div>
        <div style={{textAlign:"center",fontSize:11,color:C.muted,padding:"0 22px 16px",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
          <span>🔒</span> Sin comisión Luderis
        </div>
      </div>
    </div>
  );
}

function InscribirseBtn({post,session,onDone}){
  const [showModal,setShowModal]=useState(false);
  const [ok,setOk]=useState(false);
  if(ok)return<span style={{fontSize:12,color:C.success,fontWeight:700}}>✓ Inscripto</span>;
  return(
    <>
      <button onClick={()=>setShowModal(true)}
        style={{width:"100%",background:`linear-gradient(135deg,${C.accent},${C.info||C.accent})`,border:"none",borderRadius:20,color:"#fff",padding:"13px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 4px 14px ${C.accent}40`,transition:"opacity .15s"}}
        onMouseEnter={e=>e.currentTarget.style.opacity=".88"}
        onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
        ✅ Inscribirme
      </button>
      {showModal&&<InscripcionModal post={post} session={session} onClose={()=>setShowModal(false)} onDone={()=>{setOk(true);onDone();}}/>}
    </>
  );
}

// ─── DESCRIPCIÓN EXPANDIBLE ──────────────────────────────────────────────────
function DescExpandible({texto,max=300}){
  const [exp,setExp]=useState(false);
  const corto=texto.length<=max;
  return(
    <div>
      <p style={{color:C.muted,fontSize:14,lineHeight:1.8,margin:0,whiteSpace:"pre-line"}}>
        {corto||exp?texto:texto.slice(0,max)+"…"}
      </p>
      {!corto&&(
        <button onClick={()=>setExp(v=>!v)}
          style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:FONT,padding:"6px 0 0",display:"flex",alignItems:"center",gap:4}}>
          {exp?"Ver menos ▲":"Ver más ▼"}
        </button>
      )}
    </div>
  );
}

// ─── PUBLICACIONES RELACIONADAS ───────────────────────────────────────────────
function RelacionadasSection({post,session,onOpenDetail2}){
  const [relacionadas,setRelacionadas]=useState([]);
  const [reseñasRel,setReseñasRel]=useState({});
  useEffect(()=>{
    sb.getPublicaciones({},session.access_token).then(todas=>{
      const activas=todas.filter(p=>p.activo!==false&&!p.finalizado&&p.id!==post.id);
      // Ordenar por relevancia: misma materia primero, luego mismo tipo, luego recientes
      const scored=activas.map(p=>{
        let sc=0;
        if(p.materia===post.materia)sc+=10;
        if(p.tipo===post.tipo)sc+=5;
        if(p.modo===post.modo)sc+=3;
        if(p.modalidad===post.modalidad)sc+=2;
        // Bonus por calificación
        if(p.calificacion_promedio)sc+=parseFloat(p.calificacion_promedio);
        return{p,sc};
      }).sort((a,b)=>b.sc-a.sc).slice(0,6).map(x=>x.p);
      setRelacionadas(scored);
      // Rating
      const rm={};scored.forEach(p=>{if(p.calificacion_promedio)rm[p.id]={avg:parseFloat(p.calificacion_promedio),count:parseInt(p.cantidad_reseñas)||0};});
      setReseñasRel(rm);
    }).catch(()=>{});
  },[post.id,post.materia]);// eslint-disable-line

  if(!relacionadas.length)return null;
  return(
    <div style={{marginTop:32,paddingTop:24,borderTop:`1px solid ${C.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontSize:17,fontWeight:700,color:C.text,margin:0}}>
          {relacionadas.some(p=>p.materia===post.materia)?"Más clases de "+post.materia:"También te puede interesar"}
        </h2>
      </div>
      <div style={{display:"flex",gap:12,overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",paddingBottom:8}}>
        <style>{`.rel-scroll::-webkit-scrollbar{display:none}`}</style>
        <div style={{display:"flex",gap:12}} className="rel-scroll">
          {relacionadas.map(p=>{
            const catData=CATEGORIAS_DATA[p.materia]||{emoji:"📚",grad:"linear-gradient(135deg,#1A6ED8,#2EC4A0)"};
            const autorNombre=p.autor_nombre||safeDisplayName(p.autor_nombre,p.autor_email)||"Docente";
            return(
              <div key={p.id} onClick={()=>onOpenDetail2(p)}
                style={{flexShrink:0,width:200,background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.1)";e.currentTarget.style.borderColor=C.accent+"60";e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}>
                {/* Header con gradiente de categoría */}
                <div style={{height:70,background:catData.grad,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                  <span style={{fontSize:34,filter:"drop-shadow(0 2px 6px rgba(0,0,0,.2))"}}>
                    {catData.emoji}
                  </span>
                  {(new Date()-new Date(p.created_at||0))<259200000&&(
                    <span style={{position:"absolute",top:8,right:8,background:"#2EC4A0",color:"#fff",borderRadius:20,fontSize:9,fontWeight:700,padding:"2px 6px"}}>NUEVO</span>
                  )}
                </div>
                {/* Contenido */}
                <div style={{padding:"12px"}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:4,display:"flex",gap:4,alignItems:"center"}}>
                    <Avatar letra={autorNombre[0]} size={16}/>
                    <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{autorNombre}</span>
                  </div>
                  <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:6,lineHeight:1.3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                    {p.titulo}
                  </div>
                  {reseñasRel[p.id]?.avg&&(
                    <div style={{fontSize:11,color:"#B45309",marginBottom:6}}>
                      {"★".repeat(Math.round(reseñasRel[p.id].avg))} <span style={{color:C.muted}}>({reseñasRel[p.id].count})</span>
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    {p.precio
                      ?<span style={{fontWeight:800,color:C.accent,fontSize:14}}>{fmtPrice(p.precio,p.moneda)}</span>
                      :<span style={{fontSize:12,color:C.success,fontWeight:600}}>Gratis</span>
                    }
                    <Tag tipo={p.tipo}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


export { DescExpandible, InscribirseBtn, MPCheckoutBtn, RelacionadasSection, ReseñasSeccion };
export default CursoPage;
