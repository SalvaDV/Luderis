import React, { useState, useEffect } from "react";
import * as sb from "./supabase";
import ShareBtn from "./components/ShareBtn";
import { StreakBadge } from "./components/StreakBadge";
import { PriceSlider } from "./components/PriceSlider";
import { dispararAlertasIA } from "./alertasIA";
import {
  C, FONT, FONT_DISPLAY, useDebounce, toast, accentFor, tx, Z,
  Spinner, Btn, Label, ErrMsg, Modal,
  SearchableSelect,
  fmtRel, calcAvg, calcDuracion,
  safeDisplayName, avatarColor, MATERIAS,
  getPubTipo,
} from "./shared";
import { Star, MessageCircle, BookOpen, Users, MapPin, Clock, Video, GraduationCap, ScrollText, Briefcase, FileText, Search, Target, BadgeCheck, ChevronRight, Languages, Zap, Calendar } from "lucide-react";

function VerificacionIA({titulo,materia,descripcion,onVerificado,onEstadoChange,token}){
  const [pregunta,setPregunta]=useState("");const [respuesta,setRespuesta]=useState("");const [estado,setEstado]=useState("cargando");const [feedback,setFeedback]=useState("");
  // Debounce: esperar 1.5s después del último cambio en titulo/descripcion
  // Y solo generar pregunta cuando descripcion tiene al menos 20 caracteres
  const tituloDebounced=useDebounce(titulo,5000);
  const descripcionDebounced=useDebounce(descripcion,5000);
  useEffect(()=>{
    if(!tituloDebounced||!materia)return;
    // Esperar título significativo y descripción suficiente para contextualizar la pregunta
    if(tituloDebounced.length<10)return;
    if(!descripcionDebounced||descripcionDebounced.length<20)return;
    setEstado("cargando");setRespuesta("");setPregunta("");setFeedback("");
    if(onEstadoChange)onEstadoChange("cargando");
    let mounted=true;
    sb.verificarConIA(tituloDebounced,materia,descripcionDebounced||"","",token)
      .then(r=>{if(!mounted)return;setPregunta(r.pregunta||"Contá tu experiencia.");setEstado("esperando");if(onEstadoChange)onEstadoChange("esperando");})
      .catch(()=>{if(!mounted)return;setPregunta("Contá brevemente tu experiencia enseñando este tema.");setEstado("esperando");if(onEstadoChange)onEstadoChange("esperando");});
    return()=>{mounted=false;};
  },[tituloDebounced,descripcionDebounced,materia]);// eslint-disable-line
  const evaluar=async()=>{if(!respuesta.trim())return;setEstado("evaluando");if(onEstadoChange)onEstadoChange("evaluando");try{const r=await sb.verificarConIA(titulo,materia,descripcion||"",respuesta,token);
    setFeedback(r.feedback||"");
    if(r.correcta){setEstado("ok");if(onEstadoChange)onEstadoChange("ok");onVerificado();}
    else{setEstado("error");if(onEstadoChange)onEstadoChange("error");}}catch{setEstado("error");setFeedback("No se pudo evaluar.");if(onEstadoChange)onEstadoChange("error");}};
  if(estado==="ok")return <div style={{color:C.successText,fontSize:12,padding:"7px 11px",background:"#4ECB7115",borderRadius:8,border:"1px solid #4ECB7133"}}>✓ ¡Verificado!</div>;
  return(<div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:10,padding:12,marginTop:8}}>
    <div style={{color:C.accent,fontSize:10,fontWeight:700,marginBottom:5,letterSpacing:1}}>✓ VERIFICACIÓN (IA)</div>
    {estado==="cargando"?<div style={{color:C.muted,fontSize:12,display:"flex",alignItems:"center",gap:6}}><Spinner small/>Generando...</div>:(<>
      <p style={{color:C.text,fontSize:12,marginBottom:7,lineHeight:1.5}}>{pregunta}</p>
      <textarea value={respuesta} onChange={e=>setRespuesta(e.target.value)} aria-label="Tu respuesta a la verificación" placeholder="Tu respuesta..." style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",color:C.text,fontSize:12,outline:"none",resize:"vertical",minHeight:52,boxSizing:"border-box",fontFamily:FONT,marginBottom:7}}/>
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
        `Sos un asistente para docentes de una plataforma educativa argentina (Luderis).\n${instruccion}\nSIEMPRE respondé con JSON válido sin markdown:\n{"titulo":"...","descripcion":"...","precio_sugerido":null,"consejos":["...","..."]}\n- titulo: máximo 60 caracteres, específico y atractivo\n- descripcion: 2-3 oraciones, máximo 250 caracteres, mencionar metodología o beneficios\n- precio_sugerido: número en ARS o null si no aplica\n- consejos: 2 tips concretos para mejorar la publicación`,
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
          // Encolar en digest diario
          sb.db("alertas_digest_queue","POST",{
            usuario_email: alerta.usuario_email,
            usuario_id:    alerta.usuario_id||null,
            pub_id:        pub.id||null,
            pub_titulo:    pub.titulo,
            materia:       pub.materia||null,
            tipo:          pub.tipo==="oferta"?"Clase/Curso":"Búsqueda",
            precio:        pub.precio?`$${Number(pub.precio).toLocaleString("es-AR")}`:null,
            modalidad:     pub.modalidad||null,
            criterio_desc: alerta.descripcion||null,
          },token,"resolution=ignore-duplicates").catch(()=>{});
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
  const [maxAlumnos]=useState(postToEdit?.max_alumnos||"");
  const [moneda,setMoneda]=useState(postToEdit?.moneda||"ARS");
  const [verificacionPendiente,setVerificacionPendiente]=useState(false);
  const [idioma,setIdioma]=useState(postToEdit?.idioma||"");
  const [frecuencia]=useState(postToEdit?.frecuencia||"");
  const [otorgaCertificado,setOtorgaCertificado]=useState(postToEdit?.otorga_certificado||false);
  const [aprobacionPct,setAprobacionPct]=useState(postToEdit?.aprobacion_pct??80);
  // ─── BORRADOR AUTO-GUARDADO ────────────────────────────────────────────────
  const DRAFT_KEY="ldrs_draft_"+session.user.email;
  const [hasDraft,setHasDraft]=useState(false);
  // Al abrir (solo para nuevas publis): verificar si hay borrador guardado
  useEffect(()=>{
    if(editing)return;
    try{const s=localStorage.getItem(DRAFT_KEY);if(s){const d=JSON.parse(s);if(d.titulo||d.descripcion)setHasDraft(true);}}catch{}
  },[]);// eslint-disable-line
  // Auto-guardar cuando el usuario escribe (no guarda si todos los campos están vacíos)
  useEffect(()=>{
    if(editing||(!titulo&&!descripcion&&!materia))return;
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify({tipo,materia,titulo,descripcion,modo,precio,precioTipo,modalidadForm,nivel,moneda,requisitos}));}catch{}
  },[titulo,descripcion,materia,tipo,modo,precio,precioTipo,modalidadForm,nivel,moneda,requisitos]);// eslint-disable-line
  const clearDraft=()=>{try{localStorage.removeItem(DRAFT_KEY);}catch{}};
  const restoreDraft=()=>{
    try{
      const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||"{}");
      if(d.tipo)setTipo(d.tipo);if(d.materia)setMateria(d.materia);if(d.titulo)setTitulo(d.titulo);
      if(d.descripcion)setDescripcion(d.descripcion);if(d.modo)setModo(d.modo);if(d.precio)setPrecio(d.precio);
      if(d.precioTipo)setPrecioTipo(d.precioTipo);if(d.modalidadForm)setModalidadForm(d.modalidadForm);
      if(d.nivel)setNivel(d.nivel);if(d.moneda)setMoneda(d.moneda);if(d.requisitos)setRequisitos(d.requisitos);
      setHasDraft(false);
    }catch{}
  };
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
      if(otorgaCertificado&&modo==="curso")data.aprobacion_pct=Math.min(100,Math.max(1,parseInt(aprobacionPct)||80));
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
      clearDraft();
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
            <h3 style={{color:C.text,margin:0,fontFamily:FONT_DISPLAY,fontSize:17,fontWeight:800,letterSpacing:"-.02em"}}>
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
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- role/tabIndex/onKeyDown solo cuando el paso es navegable (done)
              <div key={n} role={done?"button":undefined} tabIndex={done?0:undefined} aria-label={done?`Ir al paso ${n}`:undefined} style={{flex:1,display:"flex",flexDirection:"column",gap:4,cursor:done?"pointer":"default"}}
                onClick={done?(()=>setPaso(n)):undefined}
                onKeyDown={done?(e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setPaso(n);}}):undefined}>
                <div style={{height:3,borderRadius:2,background:done||active?"linear-gradient(90deg,#1A6ED8,#2EC4A0)":C.border,transition:"background .3s"}}/>
                <div style={{fontSize:9,color:active?C.accent:done?C.success:C.muted,fontWeight:active||done?700:400,textAlign:"center",transition:"color .3s"}}>
                  {done?"✓ ":""}{label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Borrador guardado */}
        {hasDraft&&!editing&&(
          <div style={{background:"#F59E0B12",border:"1px solid #F59E0B40",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:"#92400E",fontFamily:FONT,flex:1}}>📝 Tenés un borrador guardado de la última vez</span>
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button onClick={restoreDraft} style={{background:"#F59E0B",border:"none",borderRadius:8,color:"#fff",padding:"5px 12px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:FONT}}>Restaurar</button>
              <button onClick={()=>{clearDraft();setHasDraft(false);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"5px 10px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>Descartar</button>
            </div>
          </div>
        )}
        {/* ── PASO 1: Tipo + Formato ── */}
        {paso===1&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Banner informativo para alumnos sin rol docente */}
            {soloAlumno&&(
              <div style={{background:"#F59E0B10",border:"1px solid #F59E0B50",borderRadius:10,padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:18,flexShrink:0}}>⏳</span>
                <div style={{fontSize:12,color:"#92400E",lineHeight:1.5}}>
                  <strong style={{display:"block",marginBottom:2}}>¿Querés publicar como docente?</strong>
                  Si ya enviaste tu solicitud de verificación, está siendo revisada por el equipo de Luderis. Una vez aprobada podrás publicar clases y cursos.
                </div>
              </div>
            )}
            {/* Rol selector — solo para docentes/ambos */}
            {!soloAlumno&&(
              <div>
                <Label>¿Sos docente o alumno?</Label>
                <div style={{display:"flex",gap:8}}>
                  {[{v:"oferta",Icon:GraduationCap,label:"Soy docente",sub:"Quiero publicar"},{v:"busqueda",Icon:Search,label:"Soy alumno",sub:"Busco docente o curso"}].map(({v,Icon,label,sub})=>(
                    <button key={v} onClick={()=>setTipo(v)}
                      style={{flex:1,padding:"14px 10px",borderRadius:14,border:`2px solid ${tipo===v?C.accent:C.border}`,background:tipo===v?C.accentDim:C.bg,cursor:"pointer",fontFamily:FONT,textAlign:"center",transition:"all .15s"}}>
                      <div style={{display:"flex",justifyContent:"center",marginBottom:8,color:tipo===v?C.accent:C.muted}}><Icon size={26} strokeWidth={1.9}/></div>
                      <div style={{fontSize:13,fontWeight:700,color:tipo===v?C.accent:C.text}}>{label}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Tipo de publicación — para busquedas siempre es clase particular */}
            {tipo==="busqueda"&&modo!=="particular"&&(()=>{setModo("particular");return null;})()}
            {tipo==="busqueda"&&(
              <div style={{background:"#7B5CF015",border:"2px solid #7B5CF0",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{display:"inline-flex",color:C.purple}}><Target size={30} strokeWidth={1.8}/></span>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:C.purple}}>Pedido de clase particular</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>Los docentes podrán ver tu pedido y contactarte</div>
                </div>
              </div>
            )}
            {tipo==="oferta"&&(
              <div>
                <Label>¿Qué querés publicar?</Label>
                <div style={{display:"flex",gap:10}}>
                  {[
                    {v:"curso",Icon:BookOpen,label:"Curso",sub:"Contenido estructurado, múltiples alumnos, precio fijo",color:"#1A6ED8"},
                    {v:"particular",Icon:Target,label:"Clase particular",sub:"1 a 1 o grupo pequeño, horario flexible",color:"#E8881A"},
                  ].map(({v,Icon,label,sub,color})=>(
                    <button key={v} onClick={()=>setModo(v)}
                      style={{flex:1,padding:"16px 12px",borderRadius:16,border:`2px solid ${modo===v?color:C.border}`,background:modo===v?color+"15":C.bg,cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"all .18s",position:"relative"}}>
                      {modo===v&&<div style={{position:"absolute",top:10,right:10,width:18,height:18,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:900}}>✓</div>}
                      <div style={{marginBottom:8,color:modo===v?color:C.muted}}><Icon size={28} strokeWidth={1.9}/></div>
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
                aria-label="Título"
                placeholder={tipo==="busqueda"?"Título de tu búsqueda":"Título del curso o clase"}
                style={{...iS,marginBottom:0,paddingRight:48}}/>
              <span style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",fontSize:10,color:titulo.length>=70?C.danger:C.muted,fontFamily:FONT,pointerEvents:"none"}}>{titulo.length}/80</span>
            </div>
            <div style={{position:"relative"}}>
              <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value.slice(0,DESC_MAX))}
                aria-label="Descripción"
                placeholder="Descripción detallada..." rows={4}
                style={{...iS,resize:"vertical",marginBottom:0,paddingBottom:22}}/>
              <span style={{position:"absolute",bottom:8,right:11,fontSize:10,color:descripcion.length>=DESC_MAX?C.danger:C.muted,fontFamily:FONT,pointerEvents:"none"}}>{descripcion.length}/{DESC_MAX}</span>
            </div>
            <div>
              <Label>{tipo==="busqueda"?"Requisitos del docente (opcional)":"Requisitos previos (opcional)"}</Label>
              <input value={requisitos} onChange={e=>setRequisitos(e.target.value.slice(0,150))} aria-label="Requisitos"
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
                    <input type="date" aria-label="Fecha de inicio" value={fechaInicio} onChange={e=>{setFechaInicio(e.target.value);if(fechaFin&&fechaFin<=e.target.value)setFechaFin("");}} style={{...iS,margin:0,colorScheme:"light dark"}}/>
                    {fechaInicio&&new Date(fechaInicio)<new Date(new Date().toDateString())&&<div style={{color:"#B45309",fontSize:11,marginTop:2}}>⚠ La fecha ya pasó</div>}
                  </div>
                  <div style={{flex:1}}>
                    <Label>Fin</Label>
                    <input type="date" aria-label="Fecha de fin" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} min={fechaInicio?(()=>{const d=new Date(fechaInicio);d.setDate(d.getDate()+1);return d.toISOString().split("T")[0];})():undefined} disabled={!fechaInicio} style={{...iS,margin:0,colorScheme:"light dark",opacity:fechaInicio?1:0.4}}/>
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
                          <input type="time" aria-label="Hora de inicio" value={c.hora_inicio} onChange={e=>{const v=e.target.value;updClase(i,"hora_inicio",v);if(c.hora_fin&&toMin(c.hora_fin)!==null&&toMin(c.hora_fin)<=toMin(v)){const[h,m]=v.split(":").map(Number);const fin=`${String(h+(m>=30?1:0)).padStart(2,"0")}:${m>=30?"00":String(m+30).padStart(2,"0")}`;updClase(i,"hora_fin",fin);}}} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 7px",color:C.text,fontSize:11,fontFamily:FONT,outline:"none",colorScheme:"light dark",flex:2}}/>
                          <span style={{color:C.muted,fontSize:11}}>→</span>
                          <input type="text" aria-label="Hora de fin" value={c.hora_fin} onChange={e=>updClase(i,"hora_fin",e.target.value)} placeholder="HH:MM" maxLength={5} style={{background:C.surface,border:`1px solid ${inv?C.danger:C.border}`,borderRadius:7,padding:"4px 7px",color:inv?C.danger:C.text,fontSize:11,fontFamily:FONT,outline:"none",flex:2,width:0}}/>
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
                          <input type="time" aria-label="Hora de inicio" value={c.hora_inicio} onChange={e=>updClase(i,"hora_inicio",e.target.value)} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 7px",color:C.text,fontSize:11,fontFamily:FONT,outline:"none",colorScheme:"light dark",flex:2}}/>
                          <span style={{color:C.muted,fontSize:11}}>→</span>
                          <input type="time" aria-label="Hora de fin" value={c.hora_fin} onChange={e=>updClase(i,"hora_fin",e.target.value)} style={{background:C.bg,border:`1px solid ${inv?C.danger:C.border}`,borderRadius:7,padding:"4px 7px",color:inv?C.danger:C.text,fontSize:11,fontFamily:FONT,outline:"none",colorScheme:"light dark",flex:2}}/>
                          {inv&&<span style={{fontSize:10,color:C.danger,width:"100%"}}>⚠ Fin debe ser posterior al inicio</span>}
                          <button type="button" onClick={()=>remClase(i)} style={{background:"none",border:"none",color:C.danger,fontSize:15,cursor:"pointer",flexShrink:0}}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {modo!=="particular"&&<><div role="checkbox" aria-checked={otorgaCertificado} tabIndex={0} aria-label="Otorga certificado de aprobación" onClick={()=>setOtorgaCertificado(v=>!v)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setOtorgaCertificado(v=>!v);}}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:C.accentDim,borderRadius:8,cursor:"pointer"}}>
              <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${otorgaCertificado?C.accent:C.border}`,background:otorgaCertificado?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                {otorgaCertificado&&<span style={{color:"#fff",fontSize:13,fontWeight:700}}>✓</span>}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:C.text}}>Otorga certificado de aprobación</div>
                <div style={{fontSize:11,color:C.muted}}>Los alumnos podrán descargarlo al completar el curso</div>
              </div>
            </div>
            {otorgaCertificado&&modo==="curso"&&(
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"12px 14px"}}>
                <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:8}}>🎯 Porcentaje mínimo para aprobar</div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <input type="range" aria-label="Porcentaje mínimo para aprobar" min={10} max={100} step={5} value={aprobacionPct} onChange={e=>setAprobacionPct(Number(e.target.value))}
                    style={{flex:1,accentColor:C.accent}}/>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <input type="number" aria-label="Porcentaje mínimo para aprobar" min={1} max={100} value={aprobacionPct} onChange={e=>setAprobacionPct(Math.min(100,Math.max(1,Number(e.target.value)||1)))}
                      style={{...iS,width:60,margin:0,textAlign:"center",padding:"6px 8px"}}/>
                    <span style={{fontSize:13,color:C.muted,flexShrink:0}}>%</span>
                  </div>
                </div>
                <div style={{fontSize:11,color:C.muted,marginTop:6}}>Los alumnos necesitan completar el {aprobacionPct}% de los módulos para obtener el certificado</div>
              </div>
            )}</>}
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
                  <select value={moneda} onChange={e=>setMoneda(e.target.value)} aria-label="Moneda" style={{...iS,margin:0,flex:"0 0 80px",cursor:"pointer"}}>
                    {[["ARS","$ ARS"],["USD","US$"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                  <input value={precio} onChange={e=>setPrecio(e.target.value)} aria-label="Precio por clase" placeholder="Precio" type="number" min="0" style={{...iS,margin:0,flex:2}}/>
                  <select value={precioTipo} onChange={e=>setPrecioTipo(e.target.value)} aria-label="Unidad de precio" style={{...iS,margin:0,flex:1,cursor:"pointer"}}>
                    <option value="hora">/ hora</option>
                    <option value="clase">/ clase</option>
                  </select>
                </div>
              </div>
            ):(
              <div>
                <Label>Precio total del curso <span style={{color:C.danger,fontSize:11}}>*</span></Label>
                <div style={{display:"flex",gap:7}}>
                  <select value={moneda} onChange={e=>setMoneda(e.target.value)} aria-label="Moneda" style={{...iS,margin:0,flex:"0 0 80px",cursor:"pointer"}}>
                    {[["ARS","$ ARS"],["USD","US$"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                  <input value={precio} onChange={e=>setPrecio(e.target.value)} aria-label="Precio total del curso" placeholder="Precio" type="number" min="0" style={{...iS,margin:0,flex:1}}/>
                </div>
              </div>
            )}

            {/* Clase de prueba */}
            {modo==="particular"&&precio&&(
              <div style={{background:C.accentDim,border:`1px solid ${C.accent}30`,borderRadius:12,padding:"12px 14px"}}>
                <div role="checkbox" aria-checked={tienePrueba} tabIndex={0} aria-label="Ofrecer clase de prueba" style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setTienePrueba(v=>!v)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setTienePrueba(v=>!v);}}}>
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
                    <input value={precioPrueba} onChange={e=>setPrecioPrueba(e.target.value)} aria-label="Precio de prueba" placeholder="0 = gratis" type="number" min="0"
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
                              aria-label="Nombre del paquete (opcional)"
                              placeholder={`Ej: Pack ${pq.clases||5} clases`}
                              style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px",color:C.text,fontSize:12,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                          </div>
                          <button onClick={()=>setPaquetes(prev=>prev.filter((_,j)=>j!==i))}
                            style={{background:"none",border:"none",color:C.danger,fontSize:18,cursor:"pointer",padding:"0 4px",lineHeight:1,flexShrink:0,marginTop:16}}>×</button>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:3}}>CLASES</div>
                            <input type="number" aria-label="Cantidad de clases del paquete" min="2" max="100" value={pq.clases||""} onChange={e=>setPaquetes(prev=>prev.map((p,j)=>j===i?{...p,clases:parseInt(e.target.value)||0}:p))}
                              style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:3}}>% DESCUENTO</div>
                            <input type="number" aria-label="Porcentaje de descuento del paquete" min="0" max="80" value={pq.descuento||""} onChange={e=>setPaquetes(prev=>prev.map((p,j)=>j===i?{...p,descuento:parseInt(e.target.value)||0,precio_total:0}:p))}
                              placeholder="0"
                              style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:3}}>PRECIO TOTAL</div>
                            <input type="number" aria-label="Precio total del paquete" min="0" value={pq.precio_total||Math.round(precioFinal)||""} onChange={e=>setPaquetes(prev=>prev.map((p,j)=>j===i?{...p,precio_total:parseFloat(e.target.value)||0,descuento:0}:p))}
                              placeholder="Auto"
                              style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                          </div>
                        </div>
                        {(pq.clases>0&&precioNum>0)&&(
                          <div style={{fontSize:11,color:C.successText,fontWeight:600,background:C.success+"10",borderRadius:6,padding:"4px 10px",alignSelf:"flex-start"}}>
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
              <VerificacionIA titulo={titulo} materia={materia} descripcion={descripcion} onVerificado={(v)=>{setVerificado(v!==false);setVerificacionPendiente(false);}} onEstadoChange={(e)=>setVerificacionPendiente(e==="cargando"||e==="evaluando")} token={session?.access_token}/>
            )}
            {tipo==="oferta"&&verificacionPendiente&&(
              <div style={{color:C.warn,fontSize:11,padding:"5px 10px",background:"#E0955C15",borderRadius:7,border:"1px solid #E0955C33",display:"flex",alignItems:"center",gap:6}}><Spinner small/>Verificando…</div>
            )}
            {tipo==="oferta"&&verificado&&(
              <div style={{color:C.successText,fontSize:11,padding:"5px 10px",background:"#4ECB7115",borderRadius:7,border:"1px solid #4ECB7133"}}>✓ Verificado</div>
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
  const [respMin,setRespMin]=useState(null);// mediana de minutos hasta responder (badge)
  const [tab,setTab]=useState("clases");// clases | reseñas | credenciales
  const [pubVista,setPubVista]=useState(null);// "ofertas" | "pedidos" | null=auto según rol

  useEffect(()=>{
    if(!autorEmail){setError("Email no disponible.");setLoading(false);return;}
    setLoading(true);setError(null);
    let mounted=true;
    Promise.all([
      sb.getPublicaciones({autor:autorEmail},session.access_token).catch(()=>[]),
      sb.db(`reseñas?autor_email=eq.${encodeURIComponent(autorEmail)}&order=created_at.desc`,
        "GET",null,session.access_token).catch(()=>[]),
      sb.getDocumentos(autorEmail,session.access_token).catch(()=>[]),
      sb.getUsuarioByEmail(autorEmail,session.access_token).catch(()=>null),
      sb.getTiempoRespuesta(autorEmail,session.access_token),
    ]).then(([p,r,d,u,tr])=>{
      if(!mounted)return;
      setPubs((p||[]).filter(x=>x.activo!==false));
      setReseñas(r||[]);setDocs(d||[]);if(u)setPerfilData(u);
      if(tr?.muestras>=3&&tr.mediana_min!=null)setRespMin(tr.mediana_min);
    }).catch(e=>{if(mounted)setError(e.message);}).finally(()=>{if(mounted)setLoading(false);});
    return()=>{mounted=false;};
  },[autorEmail,session]);

  useEffect(()=>{
    if(!loading&&perfilData){
      const n=perfilData.display_name||perfilData.nombre||nombre;
      document.title=`Luderis | ${n}`;
      const url=window.location.origin+"?perfil="+encodeURIComponent(autorEmail);
      window.history.pushState({},"",url);
    }
    return()=>{window.history.pushState({},"",window.location.pathname);};
  },[loading,perfilData]);// eslint-disable-line react-hooks/exhaustive-deps

  const nombre=safeDisplayName(null,autorEmail)||"Usuario";
  const displayNombre=perfilData?.display_name||perfilData?.nombre||nombre;
  const avg=calcAvg(reseñas);
  // Cursos+clases (ofertas) vs pedidos (búsquedas). Tener ofertas ⇒ es docente.
  const ofertas=pubs.filter(p=>p.tipo!=="busqueda");
  const pedidos=pubs.filter(p=>p.tipo==="busqueda");
  const esDocentePerfil=perfilData?.rol==="docente"||ofertas.length>0;
  const totalInscriptos=ofertas.reduce((a,p)=>a+(p.cantidad_inscriptos||0),0);
  const materias=[...new Set(ofertas.map(p=>p.materia).filter(Boolean))];
  const perfilColor=perfilData?.avatar_color||localStorage.getItem("avatarColor_"+autorEmail)||avatarColor(displayNombre[0]);
  const videoUrl=perfilData?.video_presentacion||null;
  const TIPO_ICON={titulo:<GraduationCap size={20}/>,certificado:<ScrollText size={20}/>,experiencia:<Briefcase size={20}/>,otro:<FileText size={20}/>};
  // ── Derivados para el perfil estilo "Confianza" (diseño aprobado) ──
  const isMobile=typeof window!=="undefined"&&window.innerWidth<768;
  const esPropio=autorEmail===session.user.email;
  const acc=accentFor("cursos");// acento de marca (curso)
  const accPedido=accentFor("pedidos");
  const rolDocente=perfilData?.titulo_profesional||(esDocentePerfil?"Docente en Luderis":"Estudiante en Luderis");
  const preciosActivos=ofertas.filter(p=>+p.precio>0).map(p=>+p.precio);
  const desdePrecio=preciosActivos.length?Math.min(...preciosActivos):null;
  // Vista de publicaciones: docentes alternan cursos/clases ↔ pedidos; no docentes ven pedidos.
  const vistaDefault=(esDocentePerfil&&ofertas.length>0)?"ofertas":"pedidos";
  const vistaActiva=pubVista||vistaDefault;
  const pubsAVer=vistaActiva==="pedidos"?pedidos:ofertas;
  const mostrarToggle=esDocentePerfil&&ofertas.length>0&&pedidos.length>0;
  const dispHoy=perfilData?.disponible_ahora&&perfilData?.disponible_hasta&&new Date(perfilData.disponible_hasta)>new Date();
  // Helpers visuales (tokens, sin hex crudos)
  const Pill=({icon:Ic,children,tone})=>(
    <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:20,whiteSpace:"nowrap",
      ...(tone==="success"?{background:C.success+"18",color:C.successText,border:`1px solid ${C.success}33`}:{background:C.bg,color:C.muted,border:`1px solid ${C.border}`})}}>
      {Ic&&<Ic size={13} strokeWidth={2}/>}{children}
    </span>
  );
  const Stars=({size=15})=>avg>0?(
    <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:size}}>
      <Star size={size} fill="#F59E0B" color="#F59E0B" strokeWidth={0}/>
      <b style={{color:C.text}}>{avg.toFixed(1)}</b>{reseñas.length>0&&<small style={{color:C.muted}}>({reseñas.length})</small>}
    </span>
  ):null;
  const Detail=({icon:Ic,label,value})=>(
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <Ic size={16} color={C.faint||C.muted} strokeWidth={2}/>
      <span style={{fontSize:13.5,color:C.muted,flex:1}}>{label}</span>
      <span style={{fontSize:13.5,fontWeight:650,color:C.text}}>{value}</span>
    </div>
  );
  const [bannerUrl,setBannerUrl]=useState(null);
  useEffect(()=>{if(perfilData?.banner_url)setBannerUrl(perfilData.banner_url);},[perfilData]);


  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.overlayProfile,overflowY:"auto",fontFamily:FONT}}>
      {/* Sticky nav */}
      <div style={{position:"sticky",top:0,zIndex:10,background:C.sidebar,borderBottom:`1px solid ${C.border}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
        <button onClick={onClose} className="cl-tap" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",cursor:"pointer",fontSize:13,fontFamily:FONT,flexShrink:0}}>← Volver</button>
        <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
          <div style={{fontWeight:700,color:C.text,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayNombre}</div>
          <div style={{fontSize:11,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rolDocente}</div>
        </div>
        <ShareBtn url={`${window.location.origin}?perfil=${encodeURIComponent(autorEmail)}`} text={`${displayNombre} en Luderis`}
          style={{background:C.surface,borderRadius:9,color:C.text,padding:"8px 10px",fontSize:12,flexShrink:0}}/>
        {onOpenChat&&autorEmail!==session.user.email&&(
          <button className="cl-tap" onClick={()=>{onClose();onOpenChat({autor_email:autorEmail,titulo:"Consulta directa",id:"direct_"+autorEmail});}}
            style={{background:C.accent,border:"none",borderRadius:9,color:"#fff",padding:"8px 14px",cursor:"pointer",fontSize:13,fontFamily:FONT,fontWeight:600,flexShrink:0,display:"flex",alignItems:"center",gap:5}}>
            <MessageCircle size={14}/> Consultar
          </button>
        )}
      </div>

      {error?<div style={{color:C.danger,textAlign:"center",padding:40}}>{error}</div>:(
      <div style={{maxWidth:980,margin:"0 auto",paddingBottom:48}}>

        {/* Portada (banner del perfil): imagen subida, preset de gradiente, o degradado de marca */}
        <div style={{height:"clamp(110px,26vw,150px)",background:bannerUrl?.startsWith("http")?undefined:bannerUrl?.startsWith("linear-gradient")?bannerUrl:acc.heroGrad,position:"relative",overflow:"hidden"}}>
          {bannerUrl?.startsWith("http")
            // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onError solo oculta la portada rota
            ?<img src={bannerUrl} alt="portada" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.currentTarget.style.display="none"}/>
            :<div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 80% -20%, rgba(255,255,255,.22), transparent 55%)"}}/>}
        </div>

        {/* Layout 2 columnas estilo "Confianza": identidad + contacto (izq) · contenido (der) */}
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"320px 1fr",gap:isMobile?16:32,alignItems:"start",padding:isMobile?"0 14px":"0 24px",marginTop:isMobile?16:18}}>

          {/* ── Columna izquierda ── */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Identidad */}
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:24,textAlign:"center",boxShadow:C.shadow}}>
              <div style={{width:96,height:96,borderRadius:"50%",overflow:"hidden",border:`4px solid ${C.surface}`,boxShadow:"0 4px 16px rgba(0,0,0,.18)",margin:"0 auto"}}>
                {perfilData?.avatar_url&&perfilData.avatar_url.startsWith("https://")
                  // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onError gestiona el fallback del avatar
                  ?<img src={perfilData.avatar_url} alt={displayNombre} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>{e.currentTarget.style.display="none";e.currentTarget.nextSibling.style.display="flex";}}/>
                  :null}
                <div style={{width:"100%",height:"100%",background:perfilColor,display:perfilData?.avatar_url?"none":"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:40,color:"#fff"}}>{displayNombre[0].toUpperCase()}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginTop:14}}>
                <h1 style={{...tx("display"),fontSize:22,color:C.text,margin:0}}>{displayNombre}</h1>
                {perfilData?.verificado&&<BadgeCheck size={18} color={acc.solid} strokeWidth={2} aria-label="Docente verificada"/>}
              </div>
              <div style={{color:C.muted,fontSize:14,marginTop:3}}>{rolDocente}</div>
              <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:14,flexWrap:"wrap"}}>
                {perfilData?.ubicacion&&<Pill icon={MapPin}>{perfilData.ubicacion}</Pill>}
                {dispHoy&&<Pill tone="success" icon={Clock}>Disponible hoy</Pill>}
                {respMin!=null&&(respMin<=60
                  ?<Pill tone="success" icon={Zap}>Responde rápido</Pill>
                  :respMin<=1440?<Pill icon={Clock}>Responde en ~{Math.max(1,Math.round(respMin/60))} h</Pill>:null)}
              </div>
              {avg>0&&<div style={{marginTop:14,display:"flex",justifyContent:"center"}}><Stars size={16}/></div>}
            </div>

            {/* Contacto (sticky en desktop) */}
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:22,boxShadow:C.shadow,position:isMobile?"static":"sticky",top:16}}>
              {desdePrecio!=null&&(
                <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:16}}>
                  <span style={{fontSize:13,color:C.muted}}>desde</span>
                  <span style={{...tx("display"),fontSize:26,color:C.text}}>${desdePrecio.toLocaleString("es-AR")}</span>
                </div>
              )}
              {!esPropio&&onOpenChat&&(
                <button onClick={()=>{onClose();onOpenChat({autor_email:autorEmail,titulo:"Consulta directa",id:"direct_"+autorEmail});}}
                  style={{width:"100%",marginBottom:10,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px",borderRadius:12,border:"none",cursor:"pointer",fontFamily:FONT,fontSize:14,fontWeight:700,color:"#fff",background:acc.solid}}>
                  <MessageCircle size={16} strokeWidth={2.2}/>Enviar mensaje
                </button>
              )}
              <button onClick={()=>document.getElementById("perfil-pubs")?.scrollIntoView({behavior:"smooth"})}
                style={{width:"100%",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,padding:"11px",borderRadius:12,border:`1px solid ${C.border}`,cursor:"pointer",fontFamily:FONT,fontSize:13.5,fontWeight:650,color:C.text,background:C.bg}}>
                <BookOpen size={15} strokeWidth={2}/>Ver publicaciones
              </button>
              {(perfilData?.idiomas?.length>0||totalInscriptos>0||perfilData?.anios_experiencia>0)&&(
                <div style={{borderTop:`1px solid ${C.hairline||C.border}`,marginTop:18,paddingTop:16,display:"flex",flexDirection:"column",gap:11}}>
                  {perfilData?.anios_experiencia>0&&<Detail icon={Zap} label="Experiencia" value={`${perfilData.anios_experiencia} ${perfilData.anios_experiencia===1?"año":"años"}`}/>}
                  {perfilData?.idiomas?.length>0&&<Detail icon={Languages} label="Idiomas" value={perfilData.idiomas.join(", ")}/>}
                  {totalInscriptos>0&&<Detail icon={Users} label="Alumnos" value={`${totalInscriptos}+`}/>}
                </div>
              )}
            </div>
          </div>

          {/* ── Columna derecha ── */}
          <div style={{display:"flex",flexDirection:"column",gap:28,marginTop:isMobile?4:0}}>
            {loading&&<Spinner/>}

            {(perfilData?.bio||perfilData?.metodologia)&&(
              <section>
                <p style={{...tx("micro"),textTransform:"uppercase",letterSpacing:".05em",color:C.faint||C.muted,fontWeight:700,margin:"0 0 10px"}}>Sobre mí</p>
                {perfilData?.bio&&<p style={{margin:0,fontSize:15.5,lineHeight:1.6,color:C.textSoft||C.muted}}>{perfilData.bio}</p>}
                {perfilData?.metodologia&&<><div style={{fontWeight:700,color:C.text,fontSize:14,margin:"14px 0 6px"}}>Metodología</div><p style={{margin:0,fontSize:15,lineHeight:1.6,color:C.textSoft||C.muted}}>{perfilData.metodologia}</p></>}
              </section>
            )}

            {materias.length>0&&(
              <section>
                <p style={{...tx("micro"),textTransform:"uppercase",letterSpacing:".05em",color:C.faint||C.muted,fontWeight:700,margin:"0 0 10px"}}>Especialidades</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {materias.map(m=><span key={m} style={{fontSize:13,fontWeight:600,padding:"5px 12px",borderRadius:20,background:acc.soft,color:acc.text,border:`1px solid ${acc.solid}22`}}>{m}</span>)}
                </div>
              </section>
            )}

            {videoUrl&&(
              <section>
                <p style={{...tx("micro"),textTransform:"uppercase",letterSpacing:".05em",color:C.faint||C.muted,fontWeight:700,margin:"0 0 10px"}}>Presentación</p>
                <div style={{borderRadius:14,overflow:"hidden",background:"#000",aspectRatio:"16/9"}}>
                  <iframe title={`Video de presentación de ${displayNombre}`} src={(()=>{
                    // youtube.com/watch?v=ID, youtu.be/ID, /shorts/ID, /embed/ID → embed
                    // nocookie (permitido por la CSP frame-src). "youtu.be" NO contiene
                    // "youtube", así que el replace anterior lo dejaba crudo y la CSP
                    // bloqueaba el iframe.
                    const m=/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i.exec(videoUrl||"");
                    return m?`https://www.youtube-nocookie.com/embed/${m[1]}`:videoUrl;
                  })()} style={{width:"100%",height:"100%",border:"none"}} allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen/>
                </div>
              </section>
            )}

            <section id="perfil-pubs">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",margin:"0 0 14px"}}>
                <p style={{...tx("micro"),textTransform:"uppercase",letterSpacing:".05em",color:C.faint||C.muted,fontWeight:700,margin:0}}>{vistaActiva==="pedidos"?"Pedidos":"Cursos y clases"} · {pubsAVer.length}</p>
                {mostrarToggle&&(
                  <div role="group" aria-label="Filtrar publicaciones" style={{display:"inline-flex",gap:4,background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:3}}>
                    {[{k:"ofertas",l:"Cursos y clases",a:acc},{k:"pedidos",l:"Pedidos",a:accPedido}].map(({k,l,a})=>{const on=vistaActiva===k;return(
                      <button key={k} className="cl-tap" aria-pressed={on} onClick={()=>setPubVista(k)} style={{border:"none",cursor:"pointer",fontFamily:FONT,fontSize:12.5,fontWeight:700,padding:"6px 12px",borderRadius:9,background:on?a.solid:"transparent",color:on?"#fff":C.muted,transition:"all .15s"}}>{l}</button>
                    );})}
                  </div>
                )}
              </div>
              {!loading&&pubsAVer.length===0
                ?<div style={{color:C.muted,fontSize:14}}>{vistaActiva==="pedidos"?"Sin pedidos activos.":"Sin cursos ni clases activos."}</div>
                :<div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {pubsAVer.map(p=>{const T=getPubTipo(p);const tipoBadge=p.tipo==="busqueda"?"Pedido":(p.modo==="grupal"||p.modo==="curso")?"Curso":"Clase";return(
                    <div key={p.id} role="button" tabIndex={0} aria-label={`Ver ${p.titulo||"publicación"}`} onClick={()=>onOpenDetail&&onOpenDetail(p)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onOpenDetail&&onOpenDetail(p);}}}
                      style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16,cursor:"pointer",display:"flex",gap:14,alignItems:"center",boxShadow:C.shadow,transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.boxShadow=C.shadowHover||C.shadow;e.currentTarget.style.borderColor=T.accent+"55";}}
                      onMouseLeave={e=>{e.currentTarget.style.boxShadow=C.shadow;e.currentTarget.style.borderColor=C.border;}}>
                      <div style={{width:50,height:50,borderRadius:12,background:T.dim,color:T.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {(p.modo==="grupal"||p.modo==="curso")?<GraduationCap size={24} strokeWidth={1.8}/>:p.tipo==="busqueda"?<Target size={24} strokeWidth={1.8}/>:<BookOpen size={24} strokeWidth={1.8}/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                          <span style={{fontSize:10,fontWeight:700,color:T.accent,background:T.dim,borderRadius:20,padding:"1px 8px"}}>{tipoBadge}</span>
                          {p.tiene_prueba&&<Pill tone="success" icon={Zap}>Prueba gratis</Pill>}
                        </div>
                        <div style={{fontWeight:650,fontSize:15,color:C.text,letterSpacing:"-.005em",marginBottom:6,lineHeight:1.3}}>{p.titulo}</div>
                        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                          {p.modalidad&&<span style={{fontSize:12,color:C.muted}}>{p.modalidad}</span>}
                          {p.cantidad_inscriptos>0&&<span style={{fontSize:12,color:C.muted}}>{p.cantidad_inscriptos} inscriptos</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        {p.precio?<><div style={{...tx("price"),fontSize:18,color:C.text}}>${Number(p.precio).toLocaleString("es-AR")}</div><div style={{fontSize:12,color:C.muted}}>/{p.precio_tipo||"hora"}</div></>:<div style={{fontSize:13,fontWeight:700,color:C.successText}}>Gratis</div>}
                      </div>
                      <ChevronRight size={18} color={C.faint||C.muted}/>
                    </div>
                  );})}
                </div>}
            </section>

            {reseñas.length>0&&(
              <section>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                  <p style={{...tx("micro"),textTransform:"uppercase",letterSpacing:".05em",color:C.faint||C.muted,fontWeight:700,margin:0}}>Reseñas</p>
                  <Stars size={14}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {reseñas.map((r,i)=>{const rn=r.alumno_nombre||safeDisplayName(null,r.alumno_email)||"Alumno";const ap=accentFor("pedidos");return(
                    <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:18,boxShadow:C.shadow}}>
                      <div style={{display:"flex",gap:11,alignItems:"center",marginBottom:10}}>
                        <div style={{width:36,height:36,borderRadius:"50%",background:ap.soft,color:ap.text,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:15,flexShrink:0}}>{rn[0].toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:650,fontSize:14,color:C.text}}>{rn}</div>
                          <div style={{fontSize:12,color:C.faint||C.muted}}>{fmtRel(r.created_at)}</div>
                        </div>
                        <span style={{display:"inline-flex",gap:2}}>{Array.from({length:5}).map((_,j)=><Star key={j} size={13} fill={j<r.estrellas?"#F59E0B":"none"} color={j<r.estrellas?"#F59E0B":C.border} strokeWidth={j<r.estrellas?0:1.5}/>)}</span>
                      </div>
                      {r.comentario&&<p style={{margin:0,fontSize:14,lineHeight:1.55,color:C.textSoft||C.muted}}>{r.comentario}</p>}
                    </div>
                  );})}
                </div>
              </section>
            )}

            {docs.length>0&&(
              <section>
                <p style={{...tx("micro"),textTransform:"uppercase",letterSpacing:".05em",color:C.faint||C.muted,fontWeight:700,margin:"0 0 14px"}}>Credenciales</p>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {docs.map((d,i)=>(
                    <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",display:"flex",gap:12,alignItems:"center",boxShadow:C.shadow}}>
                      <span style={{flexShrink:0,color:acc.solid}}>{TIPO_ICON[d.tipo_doc]||<FileText size={20}/>}</span>
                      <div style={{minWidth:0}}>
                        <div style={{fontWeight:650,color:C.text,fontSize:14}}>{d.titulo}</div>
                        {d.descripcion&&<div style={{fontSize:13,color:C.muted,marginTop:2}}>{d.descripcion}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}


export { VerificacionIA, StreakBadge, PerfilPage, dispararAlertasIA, PriceSlider };
export default PostFormModal;
