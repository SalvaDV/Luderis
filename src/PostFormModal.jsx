import React, { useState, useEffect } from "react";
import * as sb from "./supabase";
import {
  C, FONT, useDebounce, t, LUD,
  Avatar, Spinner, Btn, Label, ErrMsg, Chip, Modal,
  StarRating, Tag, VerifiedBadge, SearchableSelect,
  fmt, fmtRel, fmtPrice, calcAvg, calcDuracion,
  safeDisplayName, avatarColor, MATERIAS,
} from "./shared";

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
    let mounted=true;
    sb.verificarConIA(tituloDebounced,materia,descripcionDebounced||"","",token)
      .then(r=>{if(!mounted)return;setPregunta(r.pregunta||"Contá tu experiencia.");setEstado("esperando");if(onEstadoChange)onEstadoChange("esperando");})
      .catch(()=>{if(!mounted)return;setPregunta("Contá brevemente tu experiencia enseñando este tema.");setEstado("esperando");if(onEstadoChange)onEstadoChange("esperando");});
    return()=>{mounted=false;};
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
// ─── STREAK SYSTEM ────────────────────────────────────────────────────────────
// Milestones con recompensas visuales
const STREAK_MILESTONES=[3,7,14,30,60,100,365];
const STREAK_LABELS={3:"3 días 🌱",7:"1 semana 🔥",14:"2 semanas ⚡",30:"1 mes 🏆",60:"2 meses 💎",100:"100 días 🦁",365:"1 año 👑"};

function calcStreak(email){
  try{
    const KEY=`cl_streak_${email}`;
    const DAYS_KEY=`cl_streak_days_${email}`;
    const today=new Date().toDateString();
    const last=localStorage.getItem(KEY);
    const days=parseInt(localStorage.getItem(DAYS_KEY)||"0");
    if(!last){localStorage.setItem(KEY,today);localStorage.setItem(DAYS_KEY,"1");return 1;}
    const diff=Math.floor((new Date()-new Date(last))/(86400000));
    if(diff===0)return days||1;
    if(diff===1){const n=(days||1)+1;localStorage.setItem(DAYS_KEY,String(n));localStorage.setItem(KEY,today);return n;}
    localStorage.setItem(DAYS_KEY,"1");localStorage.setItem(KEY,today);return 1;
  }catch{return 1;}
}

function StreakBadge({session}){
  const [streak,setStreak]=React.useState(()=>calcStreak(session.user.email));
  const [showModal,setShowModal]=React.useState(false);
  const [newMilestone,setNewMilestone]=React.useState(null);

  React.useEffect(()=>{
    // Detectar si acabamos de alcanzar un milestone
    const prev=parseInt(localStorage.getItem(`cl_streak_days_${session.user.email}_prev`)||"0");
    if(STREAK_MILESTONES.includes(streak)&&streak>prev){
      setNewMilestone(streak);
      localStorage.setItem(`cl_streak_days_${session.user.email}_prev`,String(streak));
      setTimeout(()=>setNewMilestone(null),5000);
    }
  },[streak]);

  const nextMilestone=STREAK_MILESTONES.find(m=>m>streak)||null;
  const progress=nextMilestone?(streak/(nextMilestone))*100:100;

  return(
    <>
      <button onClick={()=>setShowModal(true)}
        style={{display:"inline-flex",alignItems:"center",gap:6,background:streak>=7?"linear-gradient(135deg,#E0955C22,#F59E0B22)":"#E0955C12",border:`1px solid ${streak>=7?"#F59E0B55":"#E0955C33"}`,borderRadius:20,padding:"5px 14px",marginBottom:10,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}
        onMouseEnter={e=>e.currentTarget.style.background=streak>=7?"linear-gradient(135deg,#E0955C33,#F59E0B33)":"#E0955C22"}
        onMouseLeave={e=>e.currentTarget.style.background=streak>=7?"linear-gradient(135deg,#E0955C22,#F59E0B22)":"#E0955C12"}>
        <span style={{fontSize:streak>=30?20:streak>=7?18:15}}>{streak>=30?"🏆":streak>=7?"🔥":"🌱"}</span>
        <span style={{fontWeight:700,color:streak>=7?"#B45309":C.warn,fontSize:13}}>{streak} día{streak!==1?"s":""}</span>
        {streak>=3&&<span style={{color:C.muted,fontSize:10}}>en Luderis</span>}
      </button>

      {/* Modal de detalle del streak */}
      {showModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:FONT}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,width:"min(360px,95vw)",padding:"28px 24px"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:48,marginBottom:8}}>{streak>=100?"👑":streak>=30?"🏆":streak>=14?"⚡":streak>=7?"🔥":"🌱"}</div>
              <div style={{fontSize:28,fontWeight:800,color:C.text}}>{streak} día{streak!==1?"s":" "} seguido{streak!==1?"s":""}</div>
              <div style={{color:C.muted,fontSize:13,marginTop:4}}>Tu racha activa en Luderis</div>
            </div>
            {/* Barra de progreso al siguiente milestone */}
            {nextMilestone&&(
              <div style={{marginBottom:20}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:6}}>
                  <span>Progreso</span>
                  <span>Próximo: {STREAK_LABELS[nextMilestone]}</span>
                </div>
                <div style={{height:8,background:C.bg,borderRadius:4,border:`1px solid ${C.border}`}}>
                  <div style={{height:"100%",width:`${Math.min(progress,100)}%`,background:"linear-gradient(90deg,#F59E0B,#E0955C)",borderRadius:4,transition:"width .5s ease"}}/>
                </div>
                <div style={{textAlign:"right",fontSize:11,color:C.muted,marginTop:4}}>{nextMilestone-streak} día{nextMilestone-streak!==1?"s":""} más</div>
              </div>
            )}
            {/* Milestones desbloqueados */}
            <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginBottom:20}}>
              {STREAK_MILESTONES.filter(m=>m<=streak).map(m=>(
                <span key={m} style={{background:"linear-gradient(135deg,#F59E0B,#E0955C)",color:"#fff",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>{STREAK_LABELS[m]}</span>
              ))}
              {STREAK_MILESTONES.filter(m=>m>streak).slice(0,2).map(m=>(
                <span key={m} style={{background:C.bg,border:`1px solid ${C.border}`,color:C.muted,borderRadius:20,padding:"3px 10px",fontSize:11}}>🔒 {STREAK_LABELS[m]}</span>
              ))}
            </div>
            <button onClick={()=>setShowModal(false)}
              style={{width:"100%",background:C.accent,border:"none",borderRadius:12,color:"#fff",padding:"11px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT}}>
              ¡Seguir aprendiendo!
            </button>
          </div>
        </div>
      )}

      {/* Celebración de milestone */}
      {newMilestone&&(
        <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:600,background:"linear-gradient(135deg,#F59E0B,#E0955C)",borderRadius:20,padding:"12px 24px",color:"#fff",fontWeight:700,fontSize:15,boxShadow:"0 8px 30px rgba(245,158,11,.4)",animation:"fadeUp .3s ease",fontFamily:FONT,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:22}}>🎉</span> ¡Lograste {STREAK_LABELS[newMilestone]}!
        </div>
      )}
    </>
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
        `Sos un asistente para docentes de una plataforma educativa argentina (ClasseLink).\n${instruccion}\nSIEMPRE respondé con JSON válido sin markdown:\n{"titulo":"...","descripcion":"...","precio_sugerido":null,"consejos":["...","..."]}\n- titulo: máximo 60 caracteres, específico y atractivo\n- descripcion: 2-3 oraciones, máximo 250 caracteres, mencionar metodología o beneficios\n- precio_sugerido: número en ARS o null si no aplica\n- consejos: 2 tips concretos para mejorar la publicación`,
        `${contexto}\n\n${instruccion}\nRespondé SOLO JSON.`,
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
// ─── VERIFICAR ALERTAS CON IA ─────────────────────────────────────────────────
// Se llama cuando se crea una publicación nueva.
// Obtiene las alertas activas y usa IA para ver si alguna coincide.
async function verificarAlertas(pub,token){
  try{
    // Obtener todas las alertas activas de otros usuarios
    const alertas=await sb.db(
      `alertas_publicacion?activa=eq.true&usuario_email=neq.${encodeURIComponent(pub.autor_email)}&select=*`,
      "GET",null,token
    ).catch(()=>[]);
    if(!alertas?.length)return;

    const pubCtx=`Título: "${pub.titulo}". Materia: "${pub.materia||""}". Descripción: "${(pub.descripcion||"").slice(0,200)}". Tipo: ${pub.tipo}. Modalidad: ${pub.modalidad||"cualquiera"}.`;

    for(const alerta of alertas){
      try{
        const raw=await sb.callIA(
          `Sos un sistema de alertas para Luderis, plataforma educativa argentina.\nEvaluás si una publicación nueva coincide con la descripción de alerta de un usuario.\nRespondé SOLO con JSON: {"coincide":true/false,"score":0-10,"razon":"frase breve"}\nScore 7+ = coincide. Sé generoso si hay relación temática.`,
          `Publicación nueva: ${pubCtx}\n\nAlerta del usuario: "${alerta.descripcion}"\n\nRespondé SOLO JSON.`,
          300,token
        );
        const match=raw.match(/\{[\s\S]*\}/);
        if(!match)continue;
        const res=JSON.parse(match[0]);
        if(res.coincide&&res.score>=7){
          // Enviar email
          const appUrl=window.location.origin;
          await sb.sendEmail("alerta_coincidencia",alerta.usuario_email,{
            alerta_descripcion:alerta.descripcion,
            pub_titulo:pub.titulo,
            pub_materia:pub.materia||"",
            pub_tipo:pub.tipo==="oferta"?"Clase/Curso":"Búsqueda",
            pub_precio:pub.precio?`$${Number(pub.precio).toLocaleString("es-AR")}`:"Gratis",
            pub_modalidad:pub.modalidad||"",
            razon:res.razon,
            pub_url:`${appUrl}?pub=${pub.id}`,
          },token).catch(()=>{});
          // Actualizar stats de la alerta
          sb.db(`alertas_publicacion?id=eq.${alerta.id}`,"PATCH",{
            ultima_vez:new Date().toISOString(),
            total_matches:(alerta.total_matches||0)+1,
          },token).catch(()=>{});
        }
      }catch{}
    }
  }catch{}
}

// ─── FUNCIÓN GLOBAL: DISPARAR ALERTAS ────────────────────────────────────────
// Se llama cuando una publicación pasa a estado activo:true
// Puede ser al crear (si no tiene wizard), al omitir wizard, o al finalizar wizard
async function dispararAlertasIA(pub, session){
  try{
    const alertas=await sb.db(
      `alertas_publicacion?activa=eq.true&usuario_id=neq.${session.user.id}&select=*`,
      "GET",null,session.access_token
    ).catch(()=>[]);
    if(!alertas?.length)return;

    const pubPerfil={
      titulo:pub.titulo||"",
      descripcion:(pub.descripcion||"").slice(0,300),
      materia:pub.materia||"",
      tipo:pub.tipo||"oferta",
      modalidad:pub.modalidad||"",
      ubicacion:pub.ubicacion||"",
      precio:pub.precio?String(pub.precio):"Gratis",
      nivel:pub.nivel||"",
      certificado:pub.otorga_certificado?"Sí":"No",
      frecuencia:pub.frecuencia||"",
    };

    for(const alerta of alertas){
      try{
        const tipoAlerta=alerta.tipo_alerta||"ambos";
        if(tipoAlerta!=="ambos"&&pubPerfil.tipo!==tipoAlerta)continue;

        let criterios={};
        try{criterios=JSON.parse(alerta.criterios_json||"{}");}catch{}

        const alertaCtx=[
          `Descripción libre: "${alerta.descripcion}"`,
          criterios.materia?`Materia de interés: ${criterios.materia}`:"",
          criterios.modalidad&&criterios.modalidad!=="cualquiera"?`Modalidad preferida: ${criterios.modalidad}`:"",
          criterios.palabras_clave?.length?`Palabras clave: ${criterios.palabras_clave.join(", ")}`:"",
          alerta.usuario_ciudad?`Ciudad del usuario: ${alerta.usuario_ciudad}`:"",
        ].filter(Boolean).join("\n");

        const pubCtx=[
          `Título: "${pubPerfil.titulo}"`,
          `Descripción: "${pubPerfil.descripcion}"`,
          `Materia: ${pubPerfil.materia||"No especificada"}`,
          `Modalidad: ${pubPerfil.modalidad||"No especificada"}`,
          pubPerfil.ubicacion?`Ubicación: ${pubPerfil.ubicacion}`:"Sin ubicación",
          `Precio: ${pubPerfil.precio}`,
          pubPerfil.nivel?`Nivel: ${pubPerfil.nivel}`:"",
          `Otorga certificado: ${pubPerfil.certificado}`,
          pubPerfil.frecuencia?`Frecuencia: ${pubPerfil.frecuencia}`:"",
        ].filter(Boolean).join("\n");

        const raw=await sb.callIA(
          `Sos un sistema de matching para alertas educativas en Argentina.\nEvaluá si una publicación nueva es relevante para la búsqueda del usuario.\n\nREGLAS (evaluá TODAS):\n1. TEMA: ¿El título/descripción/materia es relevante? Considerá sinónimos y conceptos relacionados. Es el criterio más importante.\n2. MODALIDAD: Si pidió "presencial" y es "virtual" → NO coincide. Si no especificó → cualquiera sirve.\n3. UBICACIÓN: Si mencionó ciudad y la clase es presencial en otra ciudad → NO coincide. Si es virtual → ubicación no importa.\n4. CERTIFICADO: Si explícitamente quiere certificado y la pub no lo otorga → NO coincide.\n5. NIVEL: Si mencionó nivel específico y no coincide → penaliza pero no descarta solo por esto.\n6. PRECIO: Solo considerar si el usuario mencionó un rango explícito.\n\nREGLA FINAL: El TEMA debe coincidir. Contradicciones duras (modalidad, ciudad, certificado) → NO coincide.\nSi el usuario NO especificó restricciones → solo el tema importa.\n\nRespondé SOLO con JSON sin markdown: {"match":true,"razon":"frase"} o {"match":false,"razon":"por qué no"}`,
          `ALERTA DEL USUARIO:\n${alertaCtx}\n\nPUBLICACIÓN:\n${pubCtx}`,
          120,session.access_token
        );

        let match=false;let razon="";
        try{
          const j=JSON.parse(raw.match(/\{[\s\S]*?\}/)?.[0]||"{}");
          match=j.match===true;razon=j.razon||"";
        }catch{match=raw.includes('"match":true')||raw.includes('"match": true');}
        console.log(`[Alerta] "${alerta.descripcion}" → pub:"${pub.titulo}" → match:${match} ${razon}`);

        if(match){
          const pubUrl=`${window.location.origin}${window.location.pathname}?pub=${pub.id}`;
          sb.sendEmail("alerta_publicacion",alerta.usuario_email,{
            pub_titulo:pub.titulo,
            materia:pub.materia||"",
            tipo:pub.tipo==="oferta"?"Clase/Curso":"Búsqueda",
            precio:pubPerfil.precio,
            modalidad:pub.modalidad||"",
            descripcion:(pub.descripcion||"").slice(0,150),
            criterio_desc:alerta.descripcion,
            pub_url:pubUrl,
          },session.access_token).catch(()=>{});
        }
      }catch{}
    }
  }catch{}
}

function PostFormModal({session,postToEdit,onClose,onSave,modoInicial}){
  const editing=!!postToEdit;
  const rolUsuario=localStorage.getItem("cl_rol_"+session.user.email)||"alumno";
  const soloAlumno=rolUsuario==="alumno";
  const [tipo,setTipo]=useState(postToEdit?.tipo||(soloAlumno?"busqueda":"oferta"));const [materia,setMateria]=useState(postToEdit?.materia||"");const [titulo,setTitulo]=useState(postToEdit?.titulo||"");const [descripcion,setDescripcion]=useState(postToEdit?.descripcion||"");
  const [modo,setModo]=useState((postToEdit?.modo==="grupal"?"curso":postToEdit?.modo)||(modoInicial==="clases"?"particular":"curso"));const [precio,setPrecio]=useState(postToEdit?.precio||"");const [precioTipo,setPrecioTipo]=useState(postToEdit?.precio_tipo||"hora");
  const [tienePrueba,setTienePrueba]=useState(postToEdit?.tiene_prueba||false);const [precioPrueba,setPrecioPrueba]=useState(postToEdit?.precio_prueba||"");
  const [paquetes,setPaquetes]=useState(()=>{try{return JSON.parse(postToEdit?.paquetes||"[]");}catch{return [];}});
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
  const [idioma,setIdioma]=useState(postToEdit?.idioma||"");
  const [frecuencia,setFrecuencia]=useState(postToEdit?.frecuencia||"");
  const [otorgaCertificado,setOtorgaCertificado]=useState(postToEdit?.otorga_certificado||false);
  const DESC_MAX=2000;
  const addClase=()=>setClasesSinc(prev=>[...prev,{dia:"Lunes",hora_inicio:"09:00",hora_fin:"10:00"}]);
  const updClase=(i,f,v)=>setClasesSinc(prev=>prev.map((c,idx)=>idx===i?{...c,[f]:v}:c));
  const remClase=(i)=>setClasesSinc(prev=>prev.filter((_,idx)=>idx!==i));
  const durCalc=calcDuracion(fechaInicio,fechaFin);
  const iS={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:9,fontFamily:FONT};
  const guardar=async()=>{
    if(!titulo.trim()){setErr("El título es obligatorio");return;}
    if(!materia){setErr("Seleccioná una materia");return;}
    if(!descripcion.trim()||descripcion.trim().length<20){setErr("La descripción debe tener al menos 20 caracteres");return;}
    if(tipo==="oferta"){
      if(!precio||parseFloat(precio)<=0){setErr("El precio es obligatorio");return;}
      if(!modalidadForm){setErr("Indicá si la clase es virtual, presencial o mixta");return;}
      if(!nivel){setErr("Indicá el nivel de los alumnos");return;}
    }
    setSaving(true);setErr("");
    try{
      const modoDb=modo==="curso"?"grupal":modo;
      const esCursoNuevo=tipo==="oferta"&&modo==="curso"&&!editing;
      const esParticularNuevo=tipo==="oferta"&&modo==="particular"&&!editing;
      // Cursos y clases particulares nuevas nacen con activo:false hasta validar
      // Al editar, NO tocar activo para no reactivar posts desactivados
      const activoInicial=editing?undefined:(esCursoNuevo||esParticularNuevo)?false:true;
      const data={tipo,materia,titulo,descripcion,verificado,modo:modoDb,modalidad:modalidadForm||null,moneda:moneda||"ARS"};
      if(!editing)data.autor_id=session.user.id;// solo en insert, no sobreescribir en update
      if(activoInicial!==undefined)data.activo=activoInicial;
      data.nivel=nivel||null;
      data.modalidad=modalidadForm||null;
      if(requisitos)data.requisitos=requisitos;
      if(maxAlumnos)data.max_alumnos=parseInt(maxAlumnos);
      if(idioma)data.idioma=idioma;
      if(tipo==="oferta"&&modo!=="particular"&&frecuencia)data.frecuencia=frecuencia;
      if(tipo==="oferta"&&modo==="particular")data.frecuencia=frecuencia||null;// opcional en particulares
      data.otorga_certificado=otorgaCertificado;
      // estado_validacion se maneja localmente (columna pendiente de crear en DB)
      const _estadoLocal=activoInicial===false?"pendiente":undefined;
      if(tipo==="oferta"){data.precio=parseFloat(precio)||null;data.moneda=moneda||"ARS";data.tiene_prueba=tienePrueba;data.precio_prueba=tienePrueba?(parseFloat(precioPrueba)||null):null;if(paquetes.length){
        const precioNum=parseFloat(precio)||0;
        const paquetesResueltos=paquetes.map(pq=>{
          const pt=parseFloat(pq.precio_total)||0;
          const desc=parseFloat(pq.descuento)||0;
          const total=pt>0?pt:(desc>0?Math.round(precioNum*(pq.clases||1)*(1-desc/100)):precioNum*(pq.clases||1));
          return{...pq,precio_total:total};
        });
        data.paquetes=JSON.stringify(paquetesResueltos);
      }if(modo==="particular"){data.precio_tipo=precioTipo;if(sinc==="recurrente"&&clasesSinc.length){data.sinc="sinc";data.clases_sinc=JSON.stringify(clasesSinc);}}else{data.sinc=sinc;data.duracion_curso=modo==="curso"?"curso":null;if(fechaInicio)data.fecha_inicio=fechaInicio;if(fechaFin)data.fecha_fin=fechaFin;if(sinc==="sinc")data.clases_sinc=JSON.stringify(clasesSinc);}}
      let savedPub=null;
      if(editing){
        await sb.updatePublicacion(postToEdit.id,data,session.access_token);
        // Disparar alertas también en edición — la publicación actualizada puede matchear
        const pubActualizada={...postToEdit,...data,id:postToEdit.id,autor_id:session.user.id};
        savedPub=pubActualizada;
      }
      else{const r=await sb.insertPublicacion(data,session.access_token);savedPub=r?.[0]||null;}
      // Verificar alertas activas — notificar usuarios por IA si coincide
      if(savedPub?.id&&!editing){
        verificarAlertas(savedPub,session.access_token).catch(()=>{});
      }
      // ── Disparar alertas solo si la pub se activa de inmediato ──
      // (si tiene wizard de validación, las alertas se disparan cuando el docente activa)
      if(savedPub&&activoInicial===true){
        dispararAlertasIA(savedPub,session).catch(()=>{});
      }
      // Inyectar estado_validacion local en el objeto guardado para que el wizard funcione sin columna DB
      if(savedPub&&_estadoLocal)savedPub.estado_validacion=_estadoLocal;
      if(savedPub&&activoInicial===false)savedPub.activo=false;
      // Inyectar autor_email/id: el INSERT no devuelve JOIN con usuarios, CursoPage lo necesita para esMio
      if(savedPub){savedPub.autor_email=session.user.email;savedPub.autor_id=session.user.id;}
      onSave(savedPub,{esCursoNuevo,esParticularNuevo});
      onClose();
    }catch(e){setErr("Error: "+e.message);}
    finally{setSaving(false);}
  };
  // ── Wizard state ──────────────────────────────────────────────────────────
  const [paso,setPaso]=useState(editing?2:1);
  // Pasos: 1=Tipo/Formato  2=Contenido  3=Detalles  4=Precio
  // Para búsquedas solo hay 2 pasos (1 y 2)
  const totalPasos=tipo==="busqueda"?2:4;

  const canNext1=!!tipo&&(tipo==="busqueda"||!!modo);
  const canNext2=titulo.trim().length>=3&&!!materia&&descripcion.trim().length>=20;
  const canNext3=tipo==="busqueda"||(!!modalidadForm&&!!nivel);
  const canPublish=tipo==="busqueda"||(!!precio&&parseFloat(precio)>0&&!verificacionPendiente);

  const nextPaso=()=>{
    if(paso===1&&!canNext1)return;
    if(paso===2&&!canNext2){setErr("Completá título (mín 3 caracteres), materia y descripción (mín 20 caracteres)");return;}
    if(paso===3&&!canNext3){setErr("Indicá modalidad y nivel de alumnos");return;}
    setErr("");
    if(tipo==="busqueda"&&paso===2){guardar();return;}
    if(paso===totalPasos){guardar();return;}
    setPaso(p=>p+1);
  };

  const PASO_LABELS=tipo==="busqueda"
    ?["Tipo","Contenido"]
    :["Tipo","Contenido","Detalles","Precio"];

  return(
    <Modal onClose={onClose}>
      <div style={{padding:"20px 20px 16px"}}>

        {/* Header con progreso */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>
              {editing?"Editar publicación":paso===1?"Nueva publicación":paso===2?"Contanos más":paso===3?`Detalles ${modo==="curso"?"del curso":"de la clase"}`:"Precio y condiciones"}
            </h3>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>Paso {paso} de {totalPasos}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
        </div>

        {/* Barra de progreso */}
        <div style={{display:"flex",gap:4,marginBottom:20}}>
          {PASO_LABELS.map((label,i)=>{
            const n=i+1;
            const done=n<paso;
            const active=n===paso;
            return(
              <div key={n} style={{flex:1,display:"flex",flexDirection:"column",gap:4,cursor:done?"pointer":"default"}}
                onClick={()=>{if(done)setPaso(n);}}>
                <div style={{height:3,borderRadius:2,background:done||active?"linear-gradient(90deg,#1A6ED8,#2EC4A0)":C.border,transition:"background .3s"}}/>
                <div style={{fontSize:9,color:active?C.accent:done?C.success:C.muted,fontWeight:active||done?700:400,textAlign:"center",transition:"color .3s"}}>
                  {done?"✓ ":""}{label}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── PASO 1: Tipo + Formato ── */}
        {paso===1&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Rol selector — solo para docentes/ambos */}
            {!soloAlumno&&(
              <div>
                <Label>¿Sos docente o alumno?</Label>
                <div style={{display:"flex",gap:8}}>
                  {[{v:"oferta",icon:"🎓",label:"Soy docente",sub:"Quiero publicar"},{v:"busqueda",icon:"🔍",label:"Soy alumno",sub:"Busco docente o curso"}].map(({v,icon,label,sub})=>(
                    <button key={v} onClick={()=>setTipo(v)}
                      style={{flex:1,padding:"14px 10px",borderRadius:14,border:`2px solid ${tipo===v?C.accent:C.border}`,background:tipo===v?C.accentDim:C.bg,cursor:"pointer",fontFamily:FONT,textAlign:"center",transition:"all .15s"}}>
                      <div style={{fontSize:28,marginBottom:6}}>{icon}</div>
                      <div style={{fontSize:13,fontWeight:700,color:tipo===v?C.accent:C.text}}>{label}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Tipo de publicación — cards para alumno (busqueda) o docente ofertando */}
            {tipo==="busqueda"&&(
              <div>
                <Label>¿Qué estás buscando?</Label>
                <div style={{display:"flex",gap:10}}>
                  {[
                    {v:"curso",icon:"📚",label:"Un curso",sub:"Contenido estructurado con múltiples clases",color:"#7B3FBE"},
                    {v:"particular",icon:"🎯",label:"Clases particulares",sub:"Clases 1 a 1 o en grupo pequeño",color:"#7B5CF0"},
                  ].map(({v,icon,label,sub,color})=>(
                    <button key={v} onClick={()=>setModo(v)}
                      style={{flex:1,padding:"16px 12px",borderRadius:16,border:`2px solid ${modo===v?color:C.border}`,background:modo===v?color+"15":C.bg,cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"all .18s",position:"relative"}}>
                      {modo===v&&<div style={{position:"absolute",top:10,right:10,width:18,height:18,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:900}}>✓</div>}
                      <div style={{fontSize:32,marginBottom:8}}>{icon}</div>
                      <div style={{fontSize:14,fontWeight:700,color:modo===v?color:C.text,marginBottom:4}}>{label}</div>
                      <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {tipo==="oferta"&&(
              <div>
                <Label>¿Qué querés publicar?</Label>
                <div style={{display:"flex",gap:10}}>
                  {[
                    {v:"curso",icon:"📚",label:"Curso",sub:"Contenido estructurado, múltiples alumnos, precio fijo",color:"#7B3FBE"},
                    {v:"particular",icon:"🎯",label:"Clase particular",sub:"1 a 1 o grupo pequeño, horario flexible",color:C.blue||"#1A6ED8"},
                  ].map(({v,icon,label,sub,color})=>(
                    <button key={v} onClick={()=>setModo(v)}
                      style={{flex:1,padding:"16px 12px",borderRadius:16,border:`2px solid ${modo===v?color:C.border}`,background:modo===v?color+"15":C.bg,cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"all .18s",position:"relative"}}>
                      {modo===v&&<div style={{position:"absolute",top:10,right:10,width:18,height:18,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:900}}>✓</div>}
                      <div style={{fontSize:32,marginBottom:8}}>{icon}</div>
                      <div style={{fontSize:14,fontWeight:700,color:modo===v?color:C.text,marginBottom:4}}>{label}</div>
                      <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PASO 2: Contenido ── */}
        {paso===2&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <SearchableSelect value={materia} onChange={setMateria} options={MATERIAS} placeholder="Seleccioná una materia" style={{marginBottom:0}}/>
            {materia&&<AsistentePublicacion tipo={tipo} materia={materia} titulo={titulo} descripcion={descripcion} modo={modo} session={session} onApply={(s)=>{if(s.titulo)setTitulo(s.titulo);if(s.descripcion)setDescripcion(s.descripcion.slice(0,300));if(s.precio_sugerido)setPrecio(String(s.precio_sugerido));}}/>}
            <div style={{position:"relative"}}>
              <input value={titulo} onChange={e=>setTitulo(e.target.value.slice(0,80))}
                placeholder={tipo==="busqueda"?"Título de tu búsqueda":"Título del curso o clase"}
                style={{...iS,marginBottom:0,paddingRight:48}}/>
              <span style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",fontSize:10,color:titulo.length>=70?C.danger:C.muted,fontFamily:FONT,pointerEvents:"none"}}>{titulo.length}/80</span>
            </div>
            <div style={{position:"relative"}}>
              <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value.slice(0,DESC_MAX))}
                placeholder="Descripción detallada..." rows={4}
                style={{...iS,resize:"vertical",marginBottom:0,paddingBottom:22}}/>
              <span style={{position:"absolute",bottom:8,right:11,fontSize:10,color:descripcion.length>=DESC_MAX?C.danger:C.muted,fontFamily:FONT,pointerEvents:"none"}}>{descripcion.length}/{DESC_MAX}</span>
            </div>
            <div>
              <Label>{tipo==="busqueda"?"Requisitos del docente (opcional)":"Requisitos previos (opcional)"}</Label>
              <input value={requisitos} onChange={e=>setRequisitos(e.target.value.slice(0,150))}
                placeholder={tipo==="busqueda"?"Ej: Con experiencia en CBC...":"Ej: Conocimientos básicos de álgebra..."}
                style={{...iS,marginBottom:0}}/>
            </div>
          </div>
        )}

        {/* ── PASO 3: Detalles (solo ofertas) ── */}
        {paso===3&&tipo==="oferta"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:9}}>
              <div>
                <Label>Modalidad <span style={{color:C.danger,fontSize:11}}>*</span></Label>
                <select value={modalidadForm} onChange={e=>setModalidadForm(e.target.value)} style={{...iS,marginBottom:0,cursor:"pointer"}}>
                  <option value="">No especificada</option>
                  <option value="presencial">📍 Presencial</option>
                  <option value="virtual">🌐 Virtual</option>
                  <option value="mixto">⟳ Mixto</option>
                </select>
              </div>
              <div>
                <Label>Nivel <span style={{color:C.danger,fontSize:11}}>*</span></Label>
                <select value={nivel} onChange={e=>setNivel(e.target.value)} style={{...iS,marginBottom:0,cursor:"pointer"}}>
                  <option value="">No especificado</option>
                  <option value="primaria">Primaria</option>
                  <option value="secundaria">Secundaria</option>
                  <option value="universitario">Universitario</option>
                  <option value="adultos">Adultos / Profesional</option>
                  <option value="todos">Todos los niveles</option>
                </select>
              </div>
              <div>
                <Label>Idioma</Label>
                <select value={idioma} onChange={e=>setIdioma(e.target.value)} style={{...iS,marginBottom:0,cursor:"pointer"}}>
                  <option value="">Español (por defecto)</option>
                  <option value="Español">🇦🇷 Español</option>
                  <option value="Inglés">🇬🇧 Inglés</option>
                  <option value="Portugués">🇧🇷 Portugués</option>
                  <option value="Francés">🇫🇷 Francés</option>
                  <option value="Alemán">🇩🇪 Alemán</option>
                  <option value="Italiano">🇮🇹 Italiano</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <Label>Frecuencia {modo==="particular"&&<span style={{color:C.muted,fontSize:11}}>(opcional)</span>}</Label>
                <select value={frecuencia} onChange={e=>setFrecuencia(e.target.value)} style={{...iS,marginBottom:0,cursor:"pointer"}}>
                  <option value="">Sin especificar</option>
                  <option value="1 vez por semana">1 vez por semana</option>
                  <option value="2 veces por semana">2 veces por semana</option>
                  <option value="3 veces por semana">3 veces por semana</option>
                  <option value="Diaria">Diaria</option>
                  <option value="A convenir">A convenir</option>
                </select>
              </div>
            </div>
            {modo==="curso"&&(
              <>
                <div>
                  <Label>Tipo de curso</Label>
                  <div style={{display:"flex",gap:7}}>{[{v:"sinc",l:"Sincrónico"},{v:"asinc",l:"Asincrónico"}].map(({v,l})=>(<button key={v} onClick={()=>setSinc(v)} style={{flex:1,padding:"8px",borderRadius:9,fontWeight:600,fontSize:12,cursor:"pointer",background:sinc===v?C.accent:C.card,color:sinc===v?"#fff":C.muted,border:`1px solid ${sinc===v?"transparent":C.border}`,fontFamily:FONT}}>{l}</button>))}</div>
                </div>
                <div style={{display:"flex",gap:7}}>
                  <div style={{flex:1}}>
                    <Label>Inicio</Label>
                    <input type="date" value={fechaInicio} onChange={e=>{setFechaInicio(e.target.value);if(fechaFin&&fechaFin<=e.target.value)setFechaFin("");}} style={{...iS,margin:0,colorScheme:"light dark"}}/>
                    {fechaInicio&&new Date(fechaInicio)<new Date(new Date().toDateString())&&<div style={{color:"#B45309",fontSize:11,marginTop:2}}>⚠ La fecha ya pasó</div>}
                  </div>
                  <div style={{flex:1}}>
                    <Label>Fin</Label>
                    <input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} min={fechaInicio?(()=>{const d=new Date(fechaInicio);d.setDate(d.getDate()+1);return d.toISOString().split("T")[0];})():undefined} disabled={!fechaInicio} style={{...iS,margin:0,colorScheme:"light dark",opacity:fechaInicio?1:0.4}}/>
                  </div>
                </div>
                {durCalc&&<div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:8,padding:"7px 12px",fontSize:12,color:C.accent}}>⏱ Duración: <strong>{durCalc}</strong></div>}
                {sinc==="sinc"&&(
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <Label>Horarios semanales</Label>
                      <button onClick={addClase} style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:7,color:C.accent,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:FONT}}>+ Agregar</button>
                    </div>
                    {clasesSinc.map((c,i)=>{
                      const toMin=(t)=>{if(!t)return null;const p=t.split(":");if(p.length<2)return null;const h=parseInt(p[0]);const m=parseInt(p[1]);if(isNaN(h)||isNaN(m))return null;return h*60+m;};
                      const fi=toMin(c.hora_inicio);const ff=toMin(c.hora_fin);
                      const inv=fi!==null&&ff!==null&&ff<=fi;
                      return(
                        <div key={i} style={{display:"flex",gap:5,alignItems:"center",background:C.card,borderRadius:9,padding:"7px 9px",border:`1px solid ${inv?"#E05C5C44":C.border}`,flexWrap:"wrap"}}>
                          <select value={c.dia} onChange={e=>updClase(i,"dia",e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 7px",color:C.text,fontSize:11,fontFamily:FONT,cursor:"pointer",outline:"none",flex:2}}>{["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map(d=><option key={d}>{d}</option>)}</select>
                          <input type="time" value={c.hora_inicio} onChange={e=>{const v=e.target.value;updClase(i,"hora_inicio",v);if(c.hora_fin&&toMin(c.hora_fin)!==null&&toMin(c.hora_fin)<=toMin(v)){const[h,m]=v.split(":").map(Number);const fin=`${String(h+(m>=30?1:0)).padStart(2,"0")}:${m>=30?"00":String(m+30).padStart(2,"0")}`;updClase(i,"hora_fin",fin);}}} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 7px",color:C.text,fontSize:11,fontFamily:FONT,outline:"none",colorScheme:"light dark",flex:2}}/>
                          <span style={{color:C.muted,fontSize:11}}>→</span>
                          <input type="text" value={c.hora_fin} onChange={e=>updClase(i,"hora_fin",e.target.value)} placeholder="HH:MM" maxLength={5} style={{background:C.surface,border:`1px solid ${inv?C.danger:C.border}`,borderRadius:7,padding:"4px 7px",color:inv?C.danger:C.text,fontSize:11,fontFamily:FONT,outline:"none",flex:2,width:0}}/>
                          {inv&&<span style={{fontSize:10,color:C.danger,width:"100%",paddingLeft:2}}>⚠ Fin debe ser posterior al inicio</span>}
                          <button onClick={()=>remClase(i)} style={{background:"none",border:"none",color:C.danger,fontSize:15,cursor:"pointer",flexShrink:0}}>×</button>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
            {/* Clase recurrente (solo particulares) */}
            {modo==="particular"&&(
              <div>
                <Label>Regularidad</Label>
                <div style={{display:"flex",gap:7}}>
                  {[{v:"unica",l:"Una vez / sin horario fijo"},{v:"recurrente",l:"Clases recurrentes"}].map(({v,l})=>(
                    <button key={v} type="button" onClick={()=>{setSinc(v);if(v==="unica")setClasesSinc([]);}}
                      style={{flex:1,padding:"8px",borderRadius:9,fontSize:12,cursor:"pointer",fontFamily:FONT,
                        background:sinc===v?C.accent:C.card,color:sinc===v?"#fff":C.muted,
                        border:`1px solid ${sinc===v?"transparent":C.border}`,fontWeight:sinc===v?700:400,transition:"all .15s"}}>
                      {l}
                    </button>
                  ))}
                </div>
                {sinc==="recurrente"&&(
                  <div style={{marginTop:10,background:C.bg,borderRadius:10,padding:"10px 12px",border:`1px solid ${C.border}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div style={{fontSize:12,color:C.muted,fontWeight:600}}>Días y horarios semanales</div>
                      <button type="button" onClick={addClase}
                        style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:7,color:C.accent,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:FONT}}>
                        + Agregar día
                      </button>
                    </div>
                    {clasesSinc.length===0&&<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"8px 0"}}>Agregá al menos un día y horario</div>}
                    {clasesSinc.map((c,i)=>{
                      const toMin=(t)=>{if(!t)return null;const p=t.split(":");if(p.length<2)return null;const h=parseInt(p[0]);const m=parseInt(p[1]);if(isNaN(h)||isNaN(m))return null;return h*60+m;};
                      const fi=toMin(c.hora_inicio);const ff=toMin(c.hora_fin);const inv=fi!==null&&ff!==null&&ff<=fi;
                      return(
                        <div key={i} style={{display:"flex",gap:5,alignItems:"center",marginBottom:6,background:C.surface,borderRadius:9,padding:"7px 9px",border:`1px solid ${inv?"#E05C5C44":C.border}`,flexWrap:"wrap"}}>
                          <select value={c.dia} onChange={e=>updClase(i,"dia",e.target.value)} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 7px",color:C.text,fontSize:11,fontFamily:FONT,cursor:"pointer",outline:"none",flex:2}}>
                            {["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map(d=><option key={d}>{d}</option>)}
                          </select>
                          <input type="time" value={c.hora_inicio} onChange={e=>updClase(i,"hora_inicio",e.target.value)} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 7px",color:C.text,fontSize:11,fontFamily:FONT,outline:"none",colorScheme:"light dark",flex:2}}/>
                          <span style={{color:C.muted,fontSize:11}}>→</span>
                          <input type="time" value={c.hora_fin} onChange={e=>updClase(i,"hora_fin",e.target.value)} style={{background:C.bg,border:`1px solid ${inv?C.danger:C.border}`,borderRadius:7,padding:"4px 7px",color:inv?C.danger:C.text,fontSize:11,fontFamily:FONT,outline:"none",colorScheme:"light dark",flex:2}}/>
                          {inv&&<span style={{fontSize:10,color:C.danger,width:"100%"}}>⚠ Fin debe ser posterior al inicio</span>}
                          <button type="button" onClick={()=>remClase(i)} style={{background:"none",border:"none",color:C.danger,fontSize:15,cursor:"pointer",flexShrink:0}}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div onClick={()=>setOtorgaCertificado(v=>!v)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:C.accentDim,borderRadius:8,cursor:"pointer"}}>
              <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${otorgaCertificado?C.accent:C.border}`,background:otorgaCertificado?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                {otorgaCertificado&&<span style={{color:"#fff",fontSize:13,fontWeight:700}}>✓</span>}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:C.text}}>Otorga certificado de aprobación</div>
                <div style={{fontSize:11,color:C.muted}}>Los alumnos podrán descargarlo al completar el curso</div>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 4: Precio (solo ofertas) ── */}
        {paso===4&&tipo==="oferta"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Precio base */}
            {modo==="particular"?(
              <div>
                <Label>Precio por clase <span style={{color:C.danger,fontSize:11}}>*</span></Label>
                <div style={{display:"flex",gap:7}}>
                  <select value={moneda} onChange={e=>setMoneda(e.target.value)} style={{...iS,margin:0,flex:"0 0 80px",cursor:"pointer"}}>
                    {[["ARS","$ ARS"],["USD","US$"],["EUR","€"],["BRL","R$"],["CLP","CLP"],["MXN","MXN"],["UYU","UYU"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                  <input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Precio" type="number" min="0" style={{...iS,margin:0,flex:2}}/>
                  <select value={precioTipo} onChange={e=>setPrecioTipo(e.target.value)} style={{...iS,margin:0,flex:1,cursor:"pointer"}}>
                    <option value="hora">/ hora</option>
                    <option value="clase">/ clase</option>
                  </select>
                </div>
              </div>
            ):(
              <div>
                <Label>Precio total del curso <span style={{color:C.danger,fontSize:11}}>*</span></Label>
                <div style={{display:"flex",gap:7}}>
                  <select value={moneda} onChange={e=>setMoneda(e.target.value)} style={{...iS,margin:0,flex:"0 0 80px",cursor:"pointer"}}>
                    {[["ARS","$ ARS"],["USD","US$"],["EUR","€"],["BRL","R$"],["CLP","CLP"],["MXN","MXN"],["UYU","UYU"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                  <input value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Precio" type="number" min="0" style={{...iS,margin:0,flex:1}}/>
                </div>
              </div>
            )}

            {/* Clase de prueba */}
            {modo==="particular"&&precio&&(
              <div style={{background:C.accentDim,border:`1px solid ${C.accent}30`,borderRadius:12,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setTienePrueba(v=>!v)}>
                  <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${tienePrueba?C.accent:"#CBD5E0"}`,background:tienePrueba?"linear-gradient(135deg,#1A6ED8,#2EC4A0)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {tienePrueba&&<span style={{color:"#fff",fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:C.text}}>Ofrecer clase de prueba</div>
                    <div style={{fontSize:11,color:C.muted}}>Atrae más alumnos — podés ponerla gratis o con descuento</div>
                  </div>
                </div>
                {tienePrueba&&(
                  <div style={{display:"flex",gap:8,alignItems:"center",marginTop:10}}>
                    <span style={{fontSize:12,color:C.muted,flexShrink:0}}>Precio de prueba:</span>
                    <input value={precioPrueba} onChange={e=>setPrecioPrueba(e.target.value)} placeholder="0 = gratis" type="number" min="0"
                      style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT}}/>
                    <span style={{fontSize:12,color:C.muted}}>{moneda}</span>
                  </div>
                )}
              </div>
            )}

            {/* Paquetes */}
            {modo==="particular"&&precio&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <Label style={{margin:0}}>Paquetes de clases <span style={{fontSize:10,color:C.muted,fontWeight:400}}>— precios especiales por cantidad</span></Label>
                  <button onClick={()=>{if(paquetes.length<5)setPaquetes(prev=>[...prev,{clases:5,descuento:10,nombre:""}]);}}
                    disabled={paquetes.length>=5}
                    style={{background:C.accentDim,border:`1px solid ${C.accent}40`,borderRadius:8,color:C.accent,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FONT,opacity:paquetes.length>=5?.4:1}}>
                    + Agregar
                  </button>
                </div>
                {paquetes.length===0&&(
                  <div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"10px",background:C.bg,borderRadius:8}}>
                    Sin paquetes. Agregá uno para ofrecer descuentos por cantidad.
                  </div>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {paquetes.map((pq,i)=>{
                    const precioNum=parseFloat(precio)||0;
                    const ptVal=parseFloat(pq.precio_total)||0;
                  const precioFinal=ptVal>0?ptVal:(pq.descuento>0?precioNum*(pq.clases||1)*(1-(pq.descuento||0)/100):precioNum*(pq.clases||1));
                    return(
                      <div key={i} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:3}}>NOMBRE (opcional)</div>
                            <input value={pq.nombre||""} onChange={e=>setPaquetes(prev=>prev.map((p,j)=>j===i?{...p,nombre:e.target.value}:p))}
                              placeholder={`Ej: Pack ${pq.clases||5} clases`}
                              style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                          </div>
                          <button onClick={()=>setPaquetes(prev=>prev.filter((_,j)=>j!==i))}
                            style={{background:"none",border:"none",color:C.danger,fontSize:18,cursor:"pointer",padding:"0 4px",lineHeight:1,flexShrink:0,marginTop:16}}>×</button>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:3}}>CLASES</div>
                            <input type="number" min="2" max="100" value={pq.clases||""} onChange={e=>setPaquetes(prev=>prev.map((p,j)=>j===i?{...p,clases:parseInt(e.target.value)||0}:p))}
                              style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:3}}>% DESCUENTO</div>
                            <input type="number" min="0" max="80" value={pq.descuento||""} onChange={e=>setPaquetes(prev=>prev.map((p,j)=>j===i?{...p,descuento:parseInt(e.target.value)||0,precio_total:0}:p))}
                              placeholder="0"
                              style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:3}}>PRECIO TOTAL</div>
                            <input type="number" min="0" value={pq.precio_total||Math.round(precioFinal)||""} onChange={e=>setPaquetes(prev=>prev.map((p,j)=>j===i?{...p,precio_total:parseFloat(e.target.value)||0,descuento:0}:p))}
                              placeholder="Auto"
                              style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                          </div>
                        </div>
                        {(pq.clases>0&&precioNum>0)&&(
                          <div style={{fontSize:11,color:C.success,fontWeight:600,background:C.success+"10",borderRadius:6,padding:"4px 10px",alignSelf:"flex-start"}}>
                            ${Math.round(precioFinal).toLocaleString("es-AR")} total · ${Math.round(precioFinal/(pq.clases||1)).toLocaleString("es-AR")}/clase
                            {pq.descuento>0&&<span style={{color:C.muted,marginLeft:6}}>(ahorrás ${(precioNum*(pq.clases||1)-precioFinal).toLocaleString("es-AR")})</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Verificacion IA */}
            {tipo==="oferta"&&titulo&&materia&&!verificado&&(
              <VerificacionIA titulo={titulo} materia={materia} descripcion={descripcion} onVerificado={(v)=>{setVerificado(v!==false);setVerificacionPendiente(false);}} onEstadoChange={(e)=>setVerificacionPendiente(e==="cargando")} token={session?.access_token}/>
            )}
            {tipo==="oferta"&&verificacionPendiente&&(
              <div style={{color:C.warn,fontSize:11,padding:"5px 10px",background:"#E0955C15",borderRadius:7,border:"1px solid #E0955C33",display:"flex",alignItems:"center",gap:6}}><Spinner small/>Verificando…</div>
            )}
            {tipo==="oferta"&&verificado&&(
              <div style={{color:C.success,fontSize:11,padding:"5px 10px",background:"#4ECB7115",borderRadius:7,border:"1px solid #4ECB7133"}}>✓ Verificado</div>
            )}
          </div>
        )}

        <ErrMsg msg={err}/>

        {/* ── Footer navegación ── */}
        <div style={{display:"flex",gap:8,marginTop:18}}>
          {paso>1&&(
            <button onClick={()=>{setErr("");setPaso(p=>p-1);}}
              style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,color:C.text,padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:FONT,flexShrink:0}}>
              ← Atrás
            </button>
          )}
          <Btn onClick={nextPaso}
            disabled={saving||verificacionPendiente||(paso===1&&!canNext1)||(paso===4&&sinc==="sinc"&&clasesSinc.some(c=>{const p=(t)=>{if(!t)return null;const s=t.split(":");if(s.length<2)return null;const h=parseInt(s[0]);const m=parseInt(s[1]);return isNaN(h)||isNaN(m)?null:h*60+m;};const fi=p(c.hora_inicio);const ff=p(c.hora_fin);return fi!==null&&ff!==null&&ff<=fi;}))}
            style={{flex:1,padding:"11px",fontSize:13,borderRadius:11}}>
            {saving?"Guardando…":paso===totalPasos?(tipo==="busqueda"?"Publicar →":verificado?"Publicar →":"Publicar sin verificar →"):"Siguiente →"}
          </Btn>
        </div>

      </div>
    </Modal>
  );
}


// ── PerfilPage — Perfil público de un usuario ─────────────────────────────────
function PerfilPage({autorEmail,session,onClose,onOpenDetail,onOpenChat}){
  const [pubs,setPubs]=useState([]);const [reseñas,setReseñas]=useState([]);const [docs,setDocs]=useState([]);
  const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  const [perfilData,setPerfilData]=useState(null);
  const [tab,setTab]=useState("clases");// clases | reseñas | credenciales

  useEffect(()=>{
    if(!autorEmail){setError("Email no disponible.");setLoading(false);return;}
    setLoading(true);setError(null);
    let mounted=true;
    Promise.all([
      sb.getPublicaciones({autor:autorEmail},session.access_token).catch(()=>[]),
      // Query reseñas via publicaciones del docente (autor_pub_email es el campo correcto)
      sb.db(`reseñas?autor_pub_email=eq.${encodeURIComponent(autorEmail)}&order=created_at.desc`,
        "GET",null,session.access_token).catch(()=>[]),
      sb.getDocumentos(autorEmail,session.access_token).catch(()=>[]),
      sb.getUsuarioByEmail(autorEmail,session.access_token).catch(()=>null),
    ]).then(([p,r,d,u])=>{
      if(!mounted)return;
      setPubs((p||[]).filter(x=>x.activo!==false));
      setReseñas(r||[]);setDocs(d||[]);if(u)setPerfilData(u);
    }).catch(e=>{if(mounted)setError(e.message);}).finally(()=>{if(mounted)setLoading(false);});
    return()=>{mounted=false;};
  },[autorEmail,session]);

  useEffect(()=>{
    if(!loading&&perfilData){
      const n=perfilData.display_name||perfilData.nombre||nombre;
      document.title=`${n} — Docente en Luderis`;
      const url=window.location.origin+"?perfil="+encodeURIComponent(autorEmail);
      window.history.pushState({},"",url);
    }
    return()=>{window.history.pushState({},"",window.location.pathname);};
  },[loading,perfilData]);

  const nombre=safeDisplayName(null,autorEmail)||"Usuario";
  const displayNombre=perfilData?.display_name||perfilData?.nombre||nombre;
  const avg=calcAvg(reseñas);
  const totalInscriptos=pubs.reduce((a,p)=>a+(p.cantidad_inscriptos||0),0);
  const materias=[...new Set(pubs.map(p=>p.materia).filter(Boolean))];
  const perfilColor=localStorage.getItem("avatarColor_"+autorEmail)||avatarColor(displayNombre[0]);
  const videoUrl=perfilData?.video_presentacion||null;
  const TIPO_ICON={titulo:"🎓",certificado:"📜",experiencia:"💼",otro:"📄"};

  const compartir=()=>{
    const url=window.location.origin+"?perfil="+encodeURIComponent(autorEmail);
    if(navigator.share)navigator.share({title:displayNombre+" en Luderis",url});
    else navigator.clipboard.writeText(url).then(()=>{
      const b=document.getElementById("btn-comp-perf");
      if(b){b.textContent="✓ Copiado";setTimeout(()=>b.textContent="🔗 Compartir",2000);}
    }).catch(()=>{});
  };

  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:400,overflowY:"auto",fontFamily:FONT}}>
      {/* Sticky nav */}
      <div style={{position:"sticky",top:0,zIndex:10,background:C.sidebar,borderBottom:`1px solid ${C.border}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
        <button onClick={onClose} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",cursor:"pointer",fontSize:13,fontFamily:FONT,flexShrink:0}}>← Volver</button>
        <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
          <div style={{fontWeight:700,color:C.text,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayNombre}</div>
          <div style={{fontSize:11,color:C.muted}}>Docente en Luderis</div>
        </div>
        <button id="btn-comp-perf" onClick={compartir} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 10px",cursor:"pointer",fontSize:12,fontFamily:FONT,flexShrink:0}}>🔗 Compartir</button>
        {onOpenChat&&autorEmail!==session.user.email&&(
          <button onClick={()=>{onClose();onOpenChat({autor_email:autorEmail,titulo:"Consulta directa",id:"direct_"+autorEmail});}}
            style={{background:C.accent,border:"none",borderRadius:9,color:"#fff",padding:"8px 14px",cursor:"pointer",fontSize:13,fontFamily:FONT,fontWeight:600,flexShrink:0}}>
            💬 Consultar
          </button>
        )}
      </div>

      {error?<div style={{color:C.danger,textAlign:"center",padding:40}}>{error}</div>:(
      <div style={{maxWidth:720,margin:"0 auto"}}>

        {/* Hero banner */}
        <div style={{background:`linear-gradient(135deg,${perfilColor}CC,${perfilColor}88)`,padding:"32px 24px 0",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-30,right:-30,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,.08)"}}/>
          <div style={{display:"flex",gap:18,alignItems:"flex-end"}}>
            <div style={{width:88,height:88,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:34,color:perfilColor,flexShrink:0,boxShadow:"0 4px 20px rgba(0,0,0,.2)",marginBottom:-20,position:"relative",zIndex:1}}>
              {displayNombre[0].toUpperCase()}
            </div>
            <div style={{paddingBottom:24,flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <h1 style={{color:"#fff",fontSize:22,fontWeight:800,margin:"0 0 4px",textShadow:"0 1px 4px rgba(0,0,0,.2)"}}>{displayNombre}</h1>
                {perfilData?.disponible_ahora&&perfilData?.disponible_hasta&&new Date(perfilData.disponible_hasta)>new Date()&&(
                  <span style={{fontSize:11,fontWeight:700,color:"#fff",background:"#16A34A",borderRadius:20,padding:"3px 10px",boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>🟢 Disponible hoy</span>
                )}
              </div>
              {perfilData?.disponible_ahora&&perfilData?.disponible_hasta&&new Date(perfilData.disponible_hasta)>new Date()&&perfilData?.disponible_mensaje&&(
                <div style={{color:"rgba(255,255,255,.9)",fontSize:12,marginBottom:2,fontStyle:"italic"}}>"{perfilData.disponible_mensaje}"</div>
              )}
              {perfilData?.ubicacion&&<div style={{color:"rgba(255,255,255,.85)",fontSize:13}}>📍 {perfilData.ubicacion}</div>}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
                {materias.slice(0,4).map(m=><span key={m} style={{fontSize:11,background:"rgba(255,255,255,.2)",color:"#fff",borderRadius:20,padding:"2px 10px",fontWeight:600}}>{m}</span>)}
              </div>
            </div>
          </div>
        </div>

        <div style={{padding:"28px 20px 20px"}}>
          {/* Stats bar */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
            {[
              {n:avg?avg.toFixed(1):"—",label:"Rating",icon:"⭐",color:"#F59E0B"},
              {n:reseñas.length,label:"Reseñas",icon:"💬",color:C.accent},
              {n:pubs.length,label:"Clases",icon:"📚",color:C.success},
              {n:totalInscriptos,label:"Alumnos",icon:"👥",color:C.purple||"#7B3FBE"},
            ].map(s=>(
              <div key={s.label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px",textAlign:"center"}}>
                <div style={{fontSize:11}}>{s.icon}</div>
                <div style={{fontSize:18,fontWeight:800,color:s.color}}>{s.n}</div>
                <div style={{fontSize:10,color:C.muted}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bio + enriched docente info */}
          {(perfilData?.bio||perfilData?.titulo_profesional||perfilData?.metodologia)&&(
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:16}}>
              {perfilData?.titulo_profesional&&(
                <div style={{fontSize:13,color:C.accent,fontWeight:700,marginBottom:6}}>{perfilData.titulo_profesional}</div>
              )}
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:perfilData?.bio||perfilData?.metodologia?10:0}}>
                {perfilData?.anios_experiencia!=null&&perfilData.anios_experiencia>0&&(
                  <span style={{fontSize:11,background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}33`,borderRadius:20,padding:"2px 10px",fontWeight:700}}>{perfilData.anios_experiencia} {perfilData.anios_experiencia===1?"año":"años"} de experiencia</span>
                )}
                {perfilData?.franja_horaria&&(
                  <span style={{fontSize:11,background:C.surface,color:C.muted,border:`1px solid ${C.border}`,borderRadius:20,padding:"2px 10px"}}>🕐 {perfilData.franja_horaria}</span>
                )}
              </div>
              {perfilData?.bio&&(
                <>
                  <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:6}}>Sobre mí</div>
                  <p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:0,marginBottom:perfilData?.metodologia?10:0}}>{perfilData.bio}</p>
                </>
              )}
              {perfilData?.metodologia&&(
                <>
                  <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:6,marginTop:perfilData?.bio?10:0}}>Metodología</div>
                  <p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:0}}>{perfilData.metodologia}</p>
                </>
              )}
              {perfilData?.idiomas&&perfilData.idiomas.length>0&&(
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
                  {perfilData.idiomas.map(id=><span key={id} style={{fontSize:11,background:C.surface,color:C.muted,border:`1px solid ${C.border}`,borderRadius:20,padding:"2px 9px"}}>🌐 {id}</span>)}
                </div>
              )}
              {(perfilData?.linkedin_url||perfilData?.sitio_web)&&(
                <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:10}}>
                  {perfilData.linkedin_url&&<a href={perfilData.linkedin_url} target="_blank" rel="noreferrer" style={{fontSize:12,color:C.accent,textDecoration:"none",display:"flex",alignItems:"center",gap:4}}>🔗 LinkedIn</a>}
                  {perfilData.sitio_web&&<a href={perfilData.sitio_web} target="_blank" rel="noreferrer" style={{fontSize:12,color:C.accent,textDecoration:"none",display:"flex",alignItems:"center",gap:4}}>🌐 Sitio web</a>}
                </div>
              )}
            </div>
          )}

          {/* Video de presentación */}
          {videoUrl&&(
            <div style={{marginBottom:16}}>
              <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:8}}>🎬 Video de presentación</div>
              <div style={{borderRadius:14,overflow:"hidden",background:"#000",aspectRatio:"16/9"}}>
                <iframe src={videoUrl.includes("youtube")?videoUrl.replace("watch?v=","embed/").replace("youtu.be/","youtube.com/embed/"):videoUrl}
                  style={{width:"100%",height:"100%",border:"none"}} allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen/>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{display:"flex",gap:2,background:C.surface,borderRadius:12,padding:3,marginBottom:16}}>
            {[["clases",`Clases (${pubs.length})`],["reseñas",`Reseñas (${reseñas.length})`],["credenciales",`Credenciales (${docs.length})`]].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                style={{flex:1,padding:"7px",borderRadius:10,border:"none",fontSize:12,cursor:"pointer",fontFamily:FONT,
                  fontWeight:tab===id?700:400,background:tab===id?C.accent:"transparent",color:tab===id?"#fff":C.muted,transition:"all .15s"}}>
                {label}
              </button>
            ))}
          </div>

          {loading&&<Spinner/>}

          {/* Tab: Clases */}
          {!loading&&tab==="clases"&&(
            pubs.length===0
              ?<div style={{textAlign:"center",padding:"24px 0",color:C.muted,fontSize:13}}>Sin clases activas</div>
              :<div style={{display:"flex",flexDirection:"column",gap:10}}>
                {pubs.map(p=>(
                  <div key={p.id} onClick={()=>onOpenDetail&&onOpenDetail(p)}
                    style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",transition:"all .15s",display:"flex",gap:12,alignItems:"center"}}
                    onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 14px rgba(26,110,216,.1)";e.currentTarget.style.borderColor=C.accent+"44";}}
                    onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=C.border;}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:3}}>{p.titulo}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                        {p.precio&&<span style={{fontSize:12,color:C.accent,fontWeight:700}}>${Number(p.precio).toLocaleString("es-AR")}/{p.precio_tipo||"hora"}</span>}
                        {p.modalidad&&<span style={{fontSize:11,color:C.muted,background:C.surface,borderRadius:6,padding:"1px 7px"}}>{p.modalidad}</span>}
                        {p.tiene_prueba&&<span style={{fontSize:10,color:"#0F6E56",fontWeight:700,background:"#2EC4A012",borderRadius:20,padding:"1px 8px"}}>✓ Prueba</span>}
                        {p.sinc==="sinc"&&p.clases_sinc&&<span style={{fontSize:10,color:C.accent,fontWeight:700,background:C.accentDim,borderRadius:20,padding:"1px 8px"}}>📅 Recurrente</span>}
                      </div>
                    </div>
                    <span style={{color:C.muted,fontSize:18,flexShrink:0}}>›</span>
                  </div>
                ))}
              </div>
          )}

          {/* Tab: Reseñas */}
          {!loading&&tab==="reseñas"&&(
            reseñas.length===0
              ?<div style={{textAlign:"center",padding:"24px 0",color:C.muted,fontSize:13}}>Sin reseñas todavía</div>
              :<div style={{display:"flex",flexDirection:"column",gap:10}}>
                {/* Rating summary */}
                {avg>0&&(
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px",display:"flex",gap:16,alignItems:"center",marginBottom:4}}>
                    <div style={{textAlign:"center",flexShrink:0}}>
                      <div style={{fontSize:40,fontWeight:800,color:"#F59E0B",lineHeight:1}}>{avg.toFixed(1)}</div>
                      <div style={{fontSize:11,color:C.muted}}>{reseñas.length} reseña{reseñas.length!==1?"s":""}</div>
                    </div>
                    <div style={{flex:1}}>
                      {[5,4,3,2,1].map(n=>{
                        const cnt=reseñas.filter(r=>r.estrellas===n).length;
                        const pct=reseñas.length?Math.round(cnt/reseñas.length*100):0;
                        return(
                          <div key={n} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                            <span style={{fontSize:10,color:C.muted,width:8}}>{n}</span>
                            <div style={{flex:1,height:6,background:C.border,borderRadius:3}}>
                              <div style={{width:`${pct}%`,height:"100%",background:"#F59E0B",borderRadius:3}}/>
                            </div>
                            <span style={{fontSize:10,color:C.muted,width:24}}>{cnt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {reseñas.map((r,i)=>(
                  <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                        <div style={{display:"flex",gap:2}}>
                          {Array.from({length:5}).map((_,j)=><span key={j} style={{color:j<r.estrellas?"#F59E0B":C.border,fontSize:14}}>★</span>)}
                        </div>
                        {r.verificada&&<span style={{fontSize:9,background:"#4ECB7115",color:C.success,border:"1px solid #4ECB7133",borderRadius:20,padding:"1px 7px",fontWeight:700}}>✓ Verificada</span>}
                      </div>
                      <span style={{fontSize:11,color:C.muted}}>{fmtRel(r.created_at)}</span>
                    </div>
                    {r.comentario&&<p style={{color:C.text,fontSize:13,margin:"0 0 6px",lineHeight:1.5}}>{r.comentario}</p>}
                    <div style={{fontSize:11,color:C.muted}}>{r.alumno_nombre||safeDisplayName(null,r.alumno_email)}</div>
                  </div>
                ))}
              </div>
          )}

          {/* Tab: Credenciales */}
          {!loading&&tab==="credenciales"&&(
            docs.length===0
              ?<div style={{textAlign:"center",padding:"24px 0",color:C.muted,fontSize:13}}>Sin credenciales cargadas</div>
              :<div style={{display:"flex",flexDirection:"column",gap:8}}>
                {docs.map((d,i)=>(
                  <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
                    <span style={{fontSize:22,flexShrink:0}}>{TIPO_ICON[d.tipo_doc]||"📄"}</span>
                    <div>
                      <div style={{fontWeight:600,color:C.text,fontSize:13}}>{d.titulo}</div>
                      {d.descripcion&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{d.descripcion}</div>}
                    </div>
                  </div>
                ))}
              </div>
          )}

          {/* CTA consultar — sticky bottom si no es propio */}
          {autorEmail!==session.user.email&&onOpenChat&&(
            <div style={{position:"sticky",bottom:0,background:C.bg,paddingTop:12,marginTop:20,borderTop:`1px solid ${C.border}`}}>
              <button onClick={()=>{onClose();onOpenChat({autor_email:autorEmail,titulo:"Consulta directa",id:"direct_"+autorEmail});}}
                style={{width:"100%",background:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",border:"none",borderRadius:14,color:"#fff",padding:"14px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 16px rgba(26,110,216,.3)"}}>
                💬 Consultarle a {displayNombre.split(" ")[0]}
              </button>
            </div>
          )}

        </div>
      </div>
      )}
    </div>
  );
}


// ── PriceSlider — Slider de rango de precios ──────────────────────────────────
function PriceSlider({min,max,valMin,valMax,onChangeMin,onChangeMax}){
  const pct=(v)=>((v-min)/(max-min))*100;
  return(
    <div style={{padding:"4px 0 8px"}}>
      <div style={{position:"relative",height:4,background:C.border,borderRadius:2,margin:"12px 8px"}}>
        <div style={{position:"absolute",left:`${pct(valMin)}%`,right:`${100-pct(valMax)}%`,height:"100%",background:C.accent,borderRadius:2}}/>
        {[{val:valMin,onChange:onChangeMin},{val:valMax,onChange:onChangeMax}].map(({val,onChange},i)=>(
          <input key={i} type="range" min={min} max={max} value={val}
            onChange={e=>onChange(Number(e.target.value))}
            style={{position:"absolute",top:"50%",transform:"translateY(-50%)",width:"100%",left:0,opacity:0,cursor:"pointer",height:20,margin:0,padding:0}}/>
        ))}
        {[valMin,valMax].map((v,i)=>(
          <div key={i} style={{position:"absolute",top:"50%",transform:"translate(-50%,-50%)",left:`${pct(v)}%`,width:16,height:16,borderRadius:"50%",background:C.accent,border:"2px solid #fff",boxShadow:"0 1px 4px rgba(0,0,0,.2)",pointerEvents:"none"}}/>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginTop:4}}>
        <span>${valMin.toLocaleString("es-AR")}</span>
        <span>${valMax.toLocaleString("es-AR")}</span>
      </div>
    </div>
  );
}

export { VerificacionIA, StreakBadge, PerfilPage, dispararAlertasIA, PriceSlider };
export default PostFormModal;
