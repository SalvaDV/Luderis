import React, { useState } from "react";
import * as sb from "./supabase";
import { C, FONT, LUD, MATERIAS, CATEGORIAS_DATA } from "./shared";

function OnboardingModal({session,onClose}){
  const [step,setStep]=useState(0);
  const [rol,setRol]=useState("");// "alumno" | "docente" | "ambos"
  const [materias,setMaterias]=useState([]);
  const [objetivo,setObjetivo]=useState("");// "aprender_nuevo" | "mejorar" | "certificar" | "ensenar"
  const [nivelEdu,setNivelEdu]=useState("");
  const [ubicacion,setUbicacion]=useState("");
  const [saving,setSaving]=useState(false);
  // KYC (solo docentes)
  const [dni,setDni]=useState("");
  const [fechaNac,setFechaNac]=useState("");
  const [situacionFiscal,setSituacionFiscal]=useState("");
  const [esPep,setEsPep]=useState(false);
  const [terminosAceptados,setTerminosAceptados]=useState(false);
  const [kycStep,setKycStep]=useState(0);// 0=datos 1=fiscal 2=terminos

  const esDocente=rol==="docente"||rol==="ambos";
  const toggleM=m=>setMaterias(p=>p.includes(m)?p.filter(x=>x!==m):[...p,m]);

  // ── Pasos base ──────────────────────────────────────────────────────────────
  const PASOS_BASE=[
    // Paso 0: Bienvenida + rol
    {id:"bienvenida",title:"¡Bienvenido/a a Luderis!",sub:"La plataforma educativa argentina. Contanos un poco sobre vos.",
     canNext:!!rol,
     body:(
      <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.7,margin:0}}>Aprendé lo que quieras, enseñá lo que sabés. ¿Cómo vas a usar Luderis?</p>
        <div style={{display:"grid",gap:10,marginTop:4}}>
          {[
            {v:"alumno",icon:"🎓",title:"Quiero aprender",sub:"Busco clases, cursos y docentes"},
            {v:"docente",icon:"📚",title:"Quiero enseñar",sub:"Voy a publicar clases y cursos"},
            {v:"ambos",icon:"⚡",title:"Ambas cosas",sub:"Aprendo y enseño según lo que necesite"},
          ].map(({v,icon,title,sub:s})=>(
            <button key={v} onClick={()=>setRol(v)}
              style={{background:rol===v?C.accentDim:C.surface,border:`2px solid ${rol===v?C.accent:C.border}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"all .15s",display:"flex",gap:14,alignItems:"center"}}
              onMouseEnter={e=>{if(rol!==v){e.currentTarget.style.borderColor=C.accent+"60";}}}
              onMouseLeave={e=>{if(rol!==v){e.currentTarget.style.borderColor=C.border;}}}>
              <span style={{fontSize:28,flexShrink:0}}>{icon}</span>
              <div>
                <div style={{fontWeight:700,color:rol===v?C.accent:C.text,fontSize:14,marginBottom:2}}>{title}</div>
                <div style={{color:C.muted,fontSize:12}}>{s}</div>
              </div>
              {rol===v&&<span style={{marginLeft:"auto",color:C.accent,fontSize:18,flexShrink:0}}>✓</span>}
            </button>
          ))}
        </div>
        {esDocente&&<div style={{background:"#F59E0B10",border:"1px solid #F59E0B30",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#B45309",display:"flex",gap:8,alignItems:"flex-start"}}>
          <span style={{flexShrink:0}}>ℹ️</span>
          <span>Para publicar clases necesitarás completar una verificación de identidad al finalizar este proceso.</span>
        </div>}
      </div>
    )},

    // Paso 1: Materias de interés
    {id:"materias",title:"¿Qué te interesa?",sub:"Personalizamos tu experiencia según tus preferencias.",
     canNext:materias.length>0,
     body:(
      <div style={{marginTop:8}}>
        <p style={{color:C.muted,fontSize:13,margin:"0 0 12px"}}>Seleccioná las materias que más te interesan (podés elegir varias):</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:7,maxHeight:260,overflowY:"auto"}}>
          {MATERIAS.map(m=>{
            const cat=CATEGORIAS_DATA[m]||{emoji:"📚"};
            return(
              <button key={m} onClick={()=>toggleM(m)}
                style={{padding:"7px 13px",borderRadius:20,fontSize:12,cursor:"pointer",fontFamily:FONT,
                  background:materias.includes(m)?C.accent:C.surface,
                  color:materias.includes(m)?"#fff":C.muted,
                  border:`1px solid ${materias.includes(m)?C.accent:C.border}`,
                  fontWeight:materias.includes(m)?700:400,
                  display:"flex",alignItems:"center",gap:5,transition:"all .12s"}}>
                <span>{cat.emoji}</span>{m}
              </button>
            );
          })}
        </div>
      </div>
    )},

    // Paso 2: Datos básicos
    {id:"datos",title:"Datos básicos",sub:"Para mostrarte contenido relevante.",
     canNext:true,
     body:(
      <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>¿En qué etapa educativa estás?</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {[["secundaria","📗 Secundaria"],["universitario","🎓 Universitario"],["posgrado","📜 Posgrado"],["adulto_prof","💼 Adulto/Profesional"],["otro","Otro"]].map(([v,l])=>(
              <button key={v} onClick={()=>setNivelEdu(v)}
                style={{padding:"6px 14px",borderRadius:20,fontSize:12,cursor:"pointer",fontFamily:FONT,background:nivelEdu===v?C.accent:C.surface,color:nivelEdu===v?"#fff":C.muted,border:`1px solid ${nivelEdu===v?C.accent:C.border}`,transition:"all .12s"}}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>¿Cuál es tu objetivo?</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {(rol==="docente"
              ?[["ensenar_full","🧑‍🏫 Enseñar como actividad principal"],["ensenar_extra","💼 Enseñar como ingreso extra"],["compartir","🤝 Compartir conocimiento"],["crecer","📈 Crecer como docente"]]
              :rol==="ambos"
              ?[["aprender_nuevo","🌱 Aprender cosas nuevas"],["mejorar","📈 Mejorar habilidades"],["ensenar","🧑‍🏫 También enseñar"],["networking","🤝 Conectar con la comunidad"]]
              :[["aprender_nuevo","🌱 Aprender algo nuevo"],["mejorar","📈 Mejorar habilidades"],["certificar","🏅 Obtener certificado"],["hobby","🎯 Hobby o interés personal"]]
            ).map(([v,l])=>(
              <button key={v} onClick={()=>setObjetivo(v)}
                style={{padding:"6px 14px",borderRadius:20,fontSize:12,cursor:"pointer",fontFamily:FONT,background:objetivo===v?C.accent:C.surface,color:objetivo===v?"#fff":C.muted,border:`1px solid ${objetivo===v?C.accent:C.border}`,transition:"all .12s"}}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>¿En qué ciudad estás? (opcional)</label>
          <input value={ubicacion} onChange={e=>setUbicacion(e.target.value)} placeholder="Ej: Buenos Aires, Córdoba..."
            style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
        </div>
      </div>
    )},
  ];

  // ── Pasos KYC (solo docentes) ───────────────────────────────────────────────
  const PASOS_KYC=[
    // Paso KYC 0: Datos personales
    {id:"kyc_identidad",title:"Verificación de identidad",sub:"Requerida para publicar clases en Luderis.",
     canNext:(()=>{
       if(dni.trim().length<7||!fechaNac)return false;
       const nac=new Date(fechaNac);
       const edad=Math.floor((Date.now()-nac.getTime())/(365.25*24*3600*1000));
       return edad>=18;
     })(),
     body:(
      <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
        <div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.accent,display:"flex",gap:8,alignItems:"flex-start"}}>
          <span>🔒</span>
          <span>Tus datos se guardan de forma segura y solo son usados para verificar tu identidad como docente.</span>
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>DNI *</label>
          <input value={dni} onChange={e=>setDni(e.target.value.replace(/\D/g,"").slice(0,8))} placeholder="12345678" maxLength={8}
            style={{width:"100%",background:C.bg,border:`1px solid ${dni.length>=7?C.success:C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box",letterSpacing:2}}/>
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>Fecha de nacimiento *</label>
          <input type="date" value={fechaNac} onChange={e=>setFechaNac(e.target.value)}
            max={new Date(Date.now()-18*365*24*3600*1000).toISOString().split("T")[0]}
            style={{width:"100%",background:C.bg,border:`1px solid ${fechaNac?C.success:C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box",colorScheme:"dark"}}/>
          {fechaNac&&(()=>{const edad=Math.floor((Date.now()-new Date(fechaNac).getTime())/(365.25*24*3600*1000));return edad<18?(<div style={{fontSize:11,color:C.danger,marginTop:4,fontWeight:600}}>⚠ Debés ser mayor de 18 años para registrarte como docente.</div>):(<div style={{fontSize:11,color:C.success,marginTop:4}}>✓ Edad verificada</div>);})()}
        </div>
      </div>
    )},

    // Paso KYC 1: Situación fiscal
    {id:"kyc_fiscal",title:"Situación fiscal",sub:"¿Cómo vas a facturar tus servicios educativos?",
     canNext:!!situacionFiscal,
     body:(
      <div style={{marginTop:8}}>
        <p style={{color:C.muted,fontSize:12,margin:"0 0 12px",lineHeight:1.6}}>Esta información nos ayuda a cumplir con las regulaciones de AFIP. Podés cambiarla más adelante.</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            {v:"monotributo",icon:"🧾",title:"Monotributista",sub:"Estás inscripto en el monotributo"},
            {v:"resp_inscripto",icon:"📊",title:"Responsable inscripto",sub:"Estás inscripto en IVA"},
          ].map(({v,icon,title,sub:s})=>(
            <button key={v} onClick={()=>setSituacionFiscal(v)}
              style={{background:situacionFiscal===v?C.accentDim:C.surface,border:`2px solid ${situacionFiscal===v?C.accent:C.border}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",fontFamily:FONT,textAlign:"left",display:"flex",gap:12,alignItems:"center",transition:"all .12s"}}>
              <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,color:situacionFiscal===v?C.accent:C.text,fontSize:13}}>{title}</div>
                <div style={{fontSize:11,color:C.muted}}>{s}</div>
              </div>
              {situacionFiscal===v&&<span style={{color:C.accent,fontSize:16}}>✓</span>}
            </button>
          ))}
        </div>
      </div>
    )},

    // Paso KYC 2: PEP + Términos
    {id:"kyc_terminos",title:"Últimos pasos",sub:"Casi listo para publicar tus clases.",
     canNext:terminosAceptados,
     body:(
      <div style={{display:"flex",flexDirection:"column",gap:14,marginTop:8}}>
        {/* PEP */}
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
          <div style={{fontWeight:600,color:C.text,fontSize:13,marginBottom:6}}>Declaración jurada</div>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:10}}>
            Una Persona Expuesta Políticamente (PEP) es alguien que desempeña o desempeñó funciones públicas de alto rango (funcionarios, jueces, legisladores, etc.) o es familiar directo de una PEP.
          </div>
          <div style={{display:"flex",gap:10}}>
            {[["false","No soy PEP"],["true","Soy PEP"]].map(([v,l])=>(
              <button key={v} onClick={()=>setEsPep(v==="true")}
                style={{flex:1,padding:"8px",borderRadius:9,fontSize:12,cursor:"pointer",fontFamily:FONT,
                  background:String(esPep)===v?C.accentDim:C.bg,
                  color:String(esPep)===v?C.accent:C.muted,
                  border:`1px solid ${String(esPep)===v?C.accent:C.border}`,fontWeight:String(esPep)===v?700:400}}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Términos */}
        <div onClick={()=>setTerminosAceptados(v=>!v)}
          style={{display:"flex",gap:12,alignItems:"flex-start",cursor:"pointer",background:terminosAceptados?C.accentDim:C.surface,border:`2px solid ${terminosAceptados?C.accent:C.border}`,borderRadius:12,padding:"14px 16px",transition:"all .15s"}}>
          <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${terminosAceptados?C.accent:C.border}`,background:terminosAceptados?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .15s"}}>
            {terminosAceptados&&<span style={{color:"#fff",fontSize:14,fontWeight:700}}>✓</span>}
          </div>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>
            <span style={{fontWeight:700,color:C.text}}>Declaración Jurada:</span> Declaro bajo juramento que todos los datos proporcionados en este formulario son verídicos, completos y actualizados. Entiendo que la falsedad de esta declaración puede implicar la inhabilitación de mi cuenta en Luderis.
          </div>
        </div>
      </div>
    )},
  ];

  // ── Paso final ──────────────────────────────────────────────────────────────
  const PASO_FINAL={
    id:"listo",title:"¡Todo listo!",sub:esDocente?"Tu cuenta docente está siendo procesada.":"Ya podés empezar a explorar Luderis.",
    canNext:true,
    body:(
      <div style={{textAlign:"center",padding:"20px 0"}}>
        <div style={{fontSize:56,marginBottom:16,animation:"fadeUp .3s ease"}}>{esDocente?"🎓":"🚀"}</div>
        <div style={{fontWeight:700,color:C.text,fontSize:17,marginBottom:10}}>
          {esDocente?"¡Ya sos parte de Luderis como docente!":"¡Bienvenido/a a Luderis!"}
        </div>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.8,margin:"0 0 16px"}}>
          {esDocente
            ?"Tu verificación fue enviada. Una vez aprobada, podrás publicar tus clases y cursos."
            :"Explorá publicaciones, inscribite en cursos, y cuando quieras podés completar la verificación para enseñar también."}
        </p>
        {materias.length>0&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginTop:8}}>
            {materias.slice(0,5).map(m=>{
              const cat=CATEGORIAS_DATA[m]||{emoji:"📚"};
              return<span key={m} style={{background:C.accentDim,color:C.accent,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600}}>{cat.emoji} {m}</span>;
            })}
          </div>
        )}
      </div>
    ),
  };

  // ── Construir lista de pasos según rol ─────────────────────────────────────
  const allSteps=[...PASOS_BASE,...(esDocente?PASOS_KYC:[]),PASO_FINAL];
  const cur=allSteps[step];
  const isLast=step===allSteps.length-1;

  const finish=async()=>{
    setSaving(true);
    try{
      // Guardar preferencias en tabla usuarios
      const updates={
        onboarding_completado:true,
        rol,
        materias_interes:materias,
        nivel_educativo:nivelEdu||null,
        objetivo:objetivo||null,
      };
      if(ubicacion.trim())updates.ubicacion=ubicacion.trim();
      await sb.updateUsuario(session.user.id,updates,session.access_token).catch(()=>{});

      // Si es docente, guardar verificación KYC
      if(esDocente){
        await sb.db("verificaciones_usuario","POST",{
          usuario_id:session.user.id,
          usuario_email:session.user.email,
          dni:dni||null,
          fecha_nacimiento:fechaNac||null,
          situacion_fiscal:situacionFiscal||null,
          es_pep:esPep,
          terminos_aceptados:terminosAceptados,
          terminos_fecha:new Date().toISOString(),
          estado:"pendiente",
        },session.access_token,"return=minimal").catch(()=>{});
      }

      // Guardar en localStorage como respaldo
      try{
        localStorage.setItem("cl_onboarding_done_"+session.user.email,"1");
        if(materias.length)localStorage.setItem("cl_materias_pref_"+session.user.email,JSON.stringify(materias));
        if(rol)localStorage.setItem("cl_rol_"+session.user.email,rol);
        if(ubicacion)localStorage.setItem("cl_user_city",ubicacion);
      }catch{}
      onClose();
    }catch(e){
      console.error("Onboarding error:",e);
      // Fallback: guardar solo en localStorage
      try{localStorage.setItem("cl_onboarding_done_"+session.user.email,"1");}catch{}
      onClose();
    }finally{setSaving(false);}
  };

  const handleNext=()=>{
    if(isLast){finish();return;}
    setStep(s=>s+1);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,padding:"16px",backdropFilter:"blur(4px)"}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:22,width:"min(480px,96vw)",maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 64px rgba(0,0,0,.3)",animation:"fadeUp .2s ease"}}>
        {/* Barra de progreso */}
        <div style={{height:4,background:C.border,flexShrink:0}}>
          <div style={{height:"100%",background:LUD.grad,width:`${((step+1)/allSteps.length)*100}%`,transition:"width .4s ease",borderRadius:2}}/>
        </div>

        {/* Header */}
        <div style={{padding:"20px 24px 0",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div>
              <h2 style={{color:C.text,fontSize:19,fontWeight:800,margin:"0 0 4px",letterSpacing:"-.3px"}}>{cur.title}</h2>
              <p style={{color:C.muted,fontSize:12,margin:0}}>{cur.sub}</p>
            </div>
            <span style={{fontSize:11,color:C.muted,flexShrink:0,marginTop:4}}>{step+1} / {allSteps.length}</span>
          </div>
          {/* Breadcrumb visual */}
          <div style={{display:"flex",gap:4,marginTop:12}}>
            {allSteps.map((_,i)=>(
              <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?C.accent:C.border,transition:"background .3s"}}/>
            ))}
          </div>
        </div>

        {/* Body scrolleable */}
        <div style={{padding:"16px 24px",overflowY:"auto",flex:1,WebkitOverflowScrolling:"touch"}}>
          {cur.body}
        </div>

        {/* Footer */}
        <div style={{padding:"16px 24px 20px",borderTop:`1px solid ${C.border}`,flexShrink:0,display:"flex",gap:10,alignItems:"center",justifyContent:"space-between"}}>
          <div>
            {step>0&&!isLast&&(
              <button onClick={()=>setStep(s=>s-1)}
                style={{background:"none",border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"9px 18px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>
                ← Atrás
              </button>
            )}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {!isLast&&cur.id!=="kyc_identidad"&&cur.id!=="kyc_terminos"&&(
              <button onClick={()=>setStep(s=>s+1)}
                style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:FONT,padding:"0 4px"}}>
                Saltar
              </button>
            )}
            <button onClick={handleNext} disabled={!cur.canNext||saving}
              style={{background:isLast?LUD.grad:(cur.canNext?LUD.grad:C.border),border:"none",borderRadius:20,color:"#fff",padding:"10px 28px",fontWeight:700,fontSize:14,cursor:cur.canNext&&!saving?"pointer":"default",fontFamily:FONT,boxShadow:cur.canNext?"0 4px 12px rgba(26,110,216,.3)":"none",transition:"all .2s",opacity:cur.canNext?1:0.5}}>
              {saving?"Guardando…":isLast?"Empezar →":"Continuar →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── DOCENTE ANALYTICS ────────────────────────────────────────────────────────
// Mini gráfico de línea SVG
export default OnboardingModal;
