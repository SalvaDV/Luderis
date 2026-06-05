import React, { useState } from "react";
import * as sb from "./supabase";
import { C, FONT, LUD, MATERIAS, CATEGORIAS_DATA } from "./shared";

function OnboardingModal({session,onClose,onPublicar,upgradeMode}){
  const [step,setStep]=useState(0);
  const [rol,setRol]=useState("");// "alumno" | "docente" | "ambos"
  const [materias,setMaterias]=useState([]);
  const [objetivo,setObjetivo]=useState("");// "aprender_nuevo" | "mejorar" | "certificar" | "ensenar"
  const [nivelEdu,setNivelEdu]=useState("");
  const [ubicacion,setUbicacion]=useState("");
  const [saving,setSaving]=useState(false);
  const [nombre,setNombre]=useState("");
  const [finishDone,setFinishDone]=useState(false);
  // KYC (solo docentes)
  const [dni,setDni]=useState("");
  const [fechaNac,setFechaNac]=useState("");
  const [situacionFiscal,setSituacionFiscal]=useState("");
  const [cuit,setCuit]=useState("");
  const [esPep,setEsPep]=useState(false);
  const [terminosAceptados,setTerminosAceptados]=useState(false);
  const [fotoDniFrente,setFotoDniFrente]=useState(null);
  const [fotoDniPreview,setFotoDniPreview]=useState(null);

  const [modalidadPref,setModalidadPref]=useState(""); // "virtual" | "presencial" | "ambas"
  const [presupuesto,setPresupuesto]=useState(""); // "gratis" | "bajo" | "medio" | "alto"
  const [matchResults,setMatchResults]=useState(null); // publicaciones recomendadas
  const [matchLoading,setMatchLoading]=useState(false);

  const esDocente=rol==="docente"||rol==="ambos";
  const toggleM=m=>setMaterias(p=>p.includes(m)?p.filter(x=>x!==m):[...p,m]);

  // ── Pasos base ──────────────────────────────────────────────────────────────
  const PASOS_BASE=[
    // Paso 0: Bienvenida + rol
    {id:"bienvenida",title:upgradeMode?"Convertirte en docente":"¡Bienvenido/a a Luderis!",sub:upgradeMode?"Elegí cómo querés usar Luderis de ahora en adelante.":"La plataforma educativa argentina. Contanos un poco sobre vos.",
     canNext:!!rol,
     body:(
      <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.7,margin:0}}>{upgradeMode?"Completá tu verificación para empezar a enseñar en Luderis.":"Aprendé lo que quieras, enseñá lo que sabés. ¿Cómo vas a usar Luderis?"}</p>
        <div style={{display:"grid",gap:10,marginTop:4}}>
          {[
            ...(!upgradeMode?[{v:"alumno",icon:"🎓",title:"Quiero aprender",sub:"Busco clases, cursos y docentes"}]:[]),
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
     canNext:nombre.trim().length>0,
     body:(
      <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
        <div>
          <label htmlFor="onb-nombre" style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>Tu nombre *</label>
          <input id="onb-nombre" aria-label="Tu nombre" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="¿Cómo te llamás?"
            style={{width:"100%",background:C.bg,border:`1px solid ${nombre.trim()?C.success:C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>¿En qué etapa educativa estás?</div>
          <div role="group" aria-label="Etapa educativa" style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {[["secundaria","📗 Secundaria"],["universitario","🎓 Universitario"],["posgrado","📜 Posgrado"],["adulto_prof","💼 Adulto/Profesional"],["otro","Otro"]].map(([v,l])=>(
              <button key={v} onClick={()=>setNivelEdu(v)}
                style={{padding:"6px 14px",borderRadius:20,fontSize:12,cursor:"pointer",fontFamily:FONT,background:nivelEdu===v?C.accent:C.surface,color:nivelEdu===v?"#fff":C.muted,border:`1px solid ${nivelEdu===v?C.accent:C.border}`,transition:"all .12s"}}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>¿Cuál es tu objetivo?</div>
          <div role="group" aria-label="Tu objetivo" style={{display:"flex",flexWrap:"wrap",gap:6}}>
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
          <label htmlFor="onb-ubicacion" style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>¿En qué ciudad estás? (opcional)</label>
          <input id="onb-ubicacion" aria-label="Ciudad" value={ubicacion} onChange={e=>setUbicacion(e.target.value)} placeholder="Ej: Buenos Aires, Córdoba..."
            style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
        </div>
      </div>
    )},
  ];

  // ── Pasos KYC (solo docentes) ───────────────────────────────────────────────
  // Pasos extra para alumnos — modalidad y presupuesto
  const PASOS_ALUMNO = rol !== "docente" ? [
    {id:"modalidad",title:"¿Cómo preferís aprender?",sub:"Esto nos ayuda a mostrarte las clases más relevantes.",
     canNext:!!modalidadPref,
     body:(
      <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
        {[
          {v:"virtual",icon:"💻",label:"Online / Virtual",desc:"Desde donde quieras, por videollamada"},
          {v:"presencial",icon:"🏫",label:"Presencial",desc:"En persona, en un lugar físico"},
          {v:"ambas",icon:"🔀",label:"Me da igual",desc:"Cualquiera de las dos opciones"},
        ].map(({v,icon,label,desc})=>(
          <button key={v} onClick={()=>setModalidadPref(v)}
            style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderRadius:12,border:`2px solid ${modalidadPref===v?C.accent:C.border}`,background:modalidadPref===v?C.accentDim:C.bg,cursor:"pointer",textAlign:"left",transition:"all .15s",fontFamily:FONT}}>
            <span style={{fontSize:28,flexShrink:0}}>{icon}</span>
            <div>
              <div style={{fontWeight:700,color:C.text,fontSize:14}}>{label}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{desc}</div>
            </div>
            {modalidadPref===v&&<span style={{marginLeft:"auto",color:C.accent,fontSize:18,flexShrink:0}}>✓</span>}
          </button>
        ))}
      </div>
    )},
    {id:"presupuesto",title:"¿Cuál es tu presupuesto?",sub:"Sin compromiso, solo para recomendarte mejor.",
     canNext:!!presupuesto,
     body:(
      <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
        {[
          {v:"gratis",icon:"🆓",label:"Gratuitas",desc:"Solo clases sin costo"},
          {v:"bajo",icon:"💵",label:"Económico",desc:"Accesible para cualquier bolsillo"},
          {v:"medio",icon:"💴",label:"Intermedio",desc:"Precio estándar del mercado"},
          {v:"alto",icon:"💎",label:"Premium",desc:"Alta especialización o dedicación"},
        ].map(({v,icon,label,desc})=>(
          <button key={v} onClick={()=>setPresupuesto(v)}
            style={{display:"flex",alignItems:"center",gap:14,padding:"13px 18px",borderRadius:12,border:`2px solid ${presupuesto===v?C.accent:C.border}`,background:presupuesto===v?C.accentDim:C.bg,cursor:"pointer",textAlign:"left",transition:"all .15s",fontFamily:FONT}}>
            <span style={{fontSize:22,flexShrink:0}}>{icon}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,color:C.text,fontSize:14}}>{label}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{desc}</div>
            </div>
            {presupuesto===v&&<span style={{color:C.accent,fontSize:18,flexShrink:0}}>✓</span>}
          </button>
        ))}
      </div>
    )},
  ] : [];

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
          <label htmlFor="onb-dni" style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>DNI *</label>
          <input id="onb-dni" aria-label="DNI" value={dni} onChange={e=>setDni(e.target.value.replace(/\D/g,"").slice(0,8))} placeholder="12345678" maxLength={8}
            style={{width:"100%",background:C.bg,border:`1px solid ${dni.length>=7?C.success:C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box",letterSpacing:2}}/>
        </div>
        <div>
          <label htmlFor="onb-fechanac" style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>Fecha de nacimiento *</label>
          <input id="onb-fechanac" aria-label="Fecha de nacimiento" type="date" value={fechaNac} onChange={e=>setFechaNac(e.target.value)}
            max={new Date(Date.now()-18*365*24*3600*1000).toISOString().split("T")[0]}
            style={{width:"100%",background:C.bg,border:`1px solid ${fechaNac?C.success:C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box",colorScheme:"dark"}}/>
          {fechaNac&&(()=>{const edad=Math.floor((Date.now()-new Date(fechaNac).getTime())/(365.25*24*3600*1000));return edad<18?(<div style={{fontSize:11,color:C.danger,marginTop:4,fontWeight:600}}>⚠ Debés ser mayor de 18 años para registrarte como docente.</div>):(<div style={{fontSize:11,color:C.success,marginTop:4}}>✓ Edad verificada</div>);})()}
        </div>
      </div>
    )},

    // Paso KYC 1: Foto del DNI
    {id:"kyc_foto_dni",title:"Foto del frente de tu DNI",sub:"Necesitamos verificar tu identidad con una imagen.",
     canNext:!!fotoDniFrente,
     body:(
      <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
        <div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.accent,display:"flex",gap:8,alignItems:"flex-start"}}>
          <span>🔒</span>
          <span>La foto se almacena de forma segura y solo la ve el equipo de Luderis para verificar tu identidad.</span>
        </div>
        {/* Drop zone / preview */}
        <label style={{display:"block",cursor:"pointer"}}>
          <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Foto del frente del DNI" style={{display:"none"}}
            onChange={e=>{
              const f=e.target.files?.[0];
              if(!f)return;
              setFotoDniFrente(f);
              const reader=new FileReader();
              reader.onload=ev=>setFotoDniPreview(ev.target.result);
              reader.readAsDataURL(f);
            }}/>
          {fotoDniPreview?(
            <div style={{position:"relative",borderRadius:12,overflow:"hidden",border:`2px solid ${C.accent}`}}>
              <img src={fotoDniPreview} alt="DNI frente" style={{width:"100%",display:"block",maxHeight:200,objectFit:"cover"}}/>
              <div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.5)",color:"#fff",borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:600}}>✓ Foto cargada — tocá para cambiar</div>
            </div>
          ):(
            // Zona dentro del <label>: el click lo gestiona el input asociado; el hover es decorativo
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions
            <div style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"32px 20px",textAlign:"center",background:C.bg,transition:"border-color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{fontSize:36,marginBottom:8}}>📷</div>
              <div style={{fontWeight:600,color:C.text,fontSize:13,marginBottom:4}}>Seleccioná una foto del frente de tu DNI</div>
              <div style={{color:C.muted,fontSize:11}}>JPG, PNG o WEBP · Máx. 5 MB</div>
            </div>
          )}
        </label>
        <p style={{color:C.muted,fontSize:11,margin:0,lineHeight:1.5}}>
          Asegurate de que el número de DNI, nombre y apellido sean legibles. Podés usar la foto de tu cámara o galería.
        </p>
      </div>
    )},

    // Paso KYC 2: Situación fiscal + CUIT
    {id:"kyc_fiscal",title:"Situación fiscal",sub:"¿Cómo vas a facturar tus servicios educativos?",
     canNext:true,
     body:(
      <div style={{marginTop:8}}>
        <div style={{background:"#FEF3C710",border:"1px solid #F59E0B50",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#92400E",marginBottom:12,display:"flex",gap:8,alignItems:"flex-start"}}>
          <span style={{flexShrink:0}}>⚠️</span>
          <span>Podés completar esto después. Pero <strong>no podrás recibir pagos</strong> hasta ingresar tu situación fiscal y CUIT.</span>
        </div>
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
        {/* CUIT */}
        <div style={{marginTop:14}}>
          <label htmlFor="onb-cuit" style={{display:"block",fontSize:12,fontWeight:600,color:C.text,marginBottom:6}}>
            CUIT / CUIL
          </label>
          <input
            id="onb-cuit"
            aria-label="CUIT o CUIL"
            type="text"
            inputMode="numeric"
            placeholder="20-12345678-9"
            value={cuit}
            maxLength={13}
            onChange={e=>{
              // Permitir solo números y guiones, formato XX-XXXXXXXX-X
              const raw=e.target.value.replace(/[^\d]/g,"").slice(0,11);
              const fmt=raw.length>2
                ?raw.length>10
                  ?`${raw.slice(0,2)}-${raw.slice(2,10)}-${raw.slice(10)}`
                  :`${raw.slice(0,2)}-${raw.slice(2)}`
                :raw;
              setCuit(fmt);
            }}
            style={{width:"100%",boxSizing:"border-box",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${cuit.replace(/-/g,"").length===11?C.accent:C.border}`,background:C.surface,color:C.text,fontSize:15,fontFamily:FONT,outline:"none",transition:"border .15s"}}
          />
          <p style={{fontSize:11,color:C.muted,margin:"5px 0 0",lineHeight:1.5}}>
            Necesario para emitir liquidaciones y cumplir con AFIP. Lo usamos solo para documentación fiscal.
          </p>
          {cuit.replace(/-/g,"").length>0&&cuit.replace(/-/g,"").length<11&&(
            <p style={{fontSize:11,color:C.danger,margin:"4px 0 0",fontWeight:600}}>⚠ El CUIT debe tener 11 dígitos</p>
          )}
          {cuit.replace(/-/g,"").length===11&&(
            <p style={{fontSize:11,color:C.success,margin:"4px 0 0",fontWeight:600}}>✓ CUIT válido</p>
          )}
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
        <div role="checkbox" aria-checked={terminosAceptados} tabIndex={0} aria-label="Acepto la Declaración Jurada"
          onClick={()=>setTerminosAceptados(v=>!v)}
          onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setTerminosAceptados(v=>!v);}}}
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
    id:"listo",title:"¡Todo listo!",sub:esDocente?"Tu solicitud está en revisión.":"Ya podés empezar a explorar Luderis.",
    canNext:true,
    body:(
      <div style={{textAlign:"center",padding:"20px 0"}}>
        <div style={{fontSize:56,marginBottom:16,animation:"fadeUp .3s ease"}}>{esDocente?"⏳":"🚀"}</div>
        <div style={{fontWeight:700,color:C.text,fontSize:17,marginBottom:10}}>
          {esDocente?"¡Solicitud enviada!":"¡Bienvenido/a a Luderis!"}
        </div>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.8,margin:"0 0 16px"}}>
          {esDocente
            ?"Recibimos tu solicitud para ser docente. La revisaremos en las próximas 24-48 hs y te avisamos por email cuando esté aprobada."
            :"Explorá publicaciones, inscribite en cursos, y cuando quieras podés completar la verificación para enseñar también."}
        </p>
        {esDocente&&(
          <div style={{background:"#FEF3C710",border:"1px solid #F59E0B30",borderRadius:14,padding:"14px 18px",marginBottom:16,textAlign:"left"}}>
            <div style={{fontWeight:700,color:"#92400E",fontSize:13,marginBottom:4}}>⏱ ¿Qué pasa ahora?</div>
            <ul style={{color:"#92400E",fontSize:12,margin:0,paddingLeft:18,lineHeight:1.8}}>
              <li>El equipo de Luderis revisa tu DNI e información en 24-48 hs.</li>
              <li>Te enviamos un email cuando tu cuenta sea aprobada.</li>
              <li>Podés seguir usando Luderis como alumno mientras tanto.</li>
            </ul>
          </div>
        )}
        {materias.length>0&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginTop:8}}>
            {materias.slice(0,5).map(m=>{
              const cat=CATEGORIAS_DATA[m]||{emoji:"📚"};
              return<span key={m} style={{background:C.accentDim,color:C.accent,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600}}>{cat.emoji} {m}</span>;
            })}
          </div>
        )}
        {/* Recomendaciones IA para alumnos */}
        {!esDocente&&(
          <div style={{marginTop:16}}>
            {matchLoading&&(
              <div style={{textAlign:"center",padding:"16px 0"}}>
                <div style={{width:20,height:20,border:`2px solid ${C.accent}`,borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 8px"}}/>
                <div style={{color:C.muted,fontSize:12}}>Buscando clases para vos con IA…</div>
              </div>
            )}
            {matchResults&&matchResults.length>0&&(
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.muted,letterSpacing:.4,marginBottom:8}}>✨ CLASES RECOMENDADAS PARA VOS</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {matchResults.slice(0,3).map(p=>(
                    <div key={p.id} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",textAlign:"left"}}>
                      <div style={{fontWeight:600,color:C.text,fontSize:13,marginBottom:2}}>{p.titulo}</div>
                      <div style={{fontSize:11,color:C.muted}}>{p.materia}{p.precio?` · $${Number(p.precio).toLocaleString("es-AR")}`:""}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {matchResults&&matchResults.length===0&&(
              <div style={{color:C.muted,fontSize:12,textAlign:"center"}}>No encontramos clases todavía — explorá cuando quieras.</div>
            )}
          </div>
        )}
      </div>
    ),
  };

  // ── Construir lista de pasos según rol ─────────────────────────────────────
  const allSteps=[...PASOS_BASE,...PASOS_ALUMNO,...(esDocente?PASOS_KYC:[]),PASO_FINAL];
  const cur=allSteps[step];
  const isLast=step===allSteps.length-1;

  const finish=async(postAction)=>{
    setSaving(true);
    try{
      // Guardar preferencias en tabla usuarios
      const nombreFinal=nombre.trim();
      const updates={
        onboarding_completado:true,
        // Docentes quedan como "alumno" hasta aprobación de admin
        rol:esDocente?"alumno":rol,
        ...(nombreFinal&&{nombre:nombreFinal,display_name:nombreFinal}),
        materias_interes:materias,
        nivel_educativo:nivelEdu||null,
        objetivo:objetivo||null,
        modalidad_preferida:modalidadPref||null,
        presupuesto:presupuesto||null,
      };
      if(ubicacion.trim())updates.ubicacion=ubicacion.trim();
      await sb.updateUsuario(session.user.id,updates,session.access_token).catch(()=>{});
      // Sincronizar display name en localStorage y en publicaciones existentes
      if(nombreFinal){
        sb.setDisplayName(session.user.email,nombreFinal);
        await sb.updatePublicacionesNombre(session.user.email,nombreFinal,session.access_token).catch(()=>{});
      }

      // Si es docente, subir foto DNI y guardar verificación KYC
      if(esDocente){
        let fotoDniUrl=null;
        if(fotoDniFrente){
          fotoDniUrl=await sb.uploadDniFoto(session.user.id,fotoDniFrente,session.access_token).catch(()=>null);
        }
        await sb.db("verificaciones_usuario","POST",{
          usuario_id:session.user.id,
          usuario_email:session.user.email,
          dni:dni||null,
          fecha_nacimiento:fechaNac||null,
          situacion_fiscal:situacionFiscal||null,
          cuit:cuit.replace(/-/g,"")||null,
          es_pep:esPep,
          terminos_aceptados:terminosAceptados,
          terminos_fecha:new Date().toISOString(),
          estado:"pendiente",
          foto_dni_frente:fotoDniUrl,
        },session.access_token,"return=minimal").catch(()=>{});

        // Notificar a todos los admins que hay un nuevo docente pendiente de verificación
        try{
          const admins=await sb.db("usuarios?rol=eq.admin&select=id,email","GET",null,session.access_token).catch(()=>[]);
          if(admins?.length){
            await sb.db("notificaciones","POST",
              admins.map(a=>({
                usuario_id:a.id,
                tipo:"sistema",
                pub_titulo:`Nuevo docente pendiente de verificación: ${session.user.email}`,
                alumno_email:a.email, // email del admin, no del solicitante
                leida:false,
              })),
              session.access_token,"return=minimal");
          }
        }catch{}
      }

      // Matching con IA para alumnos — buscar clases recomendadas
      if(!esDocente&&materias.length>0){
        setMatchLoading(true);
        const matchTimeout=new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),15000));
        try{
          const pubs=await sb.getPublicaciones({},session.access_token).catch(()=>[]);
          const candidatos=pubs.filter(p=>p.tipo==="oferta"&&p.activo!==false).slice(0,80).map(p=>({
            id:p.id,titulo:p.titulo,materia:p.materia,precio:p.precio,modalidad:p.modalidad,descripcion:(p.descripcion||"").slice(0,80)
          }));
          const presupGte={gratis:"0",bajo:"5000",medio:"15000",alto:"999999"}[presupuesto]||"0";
          const raw=await Promise.race([
            sb.callIA(
              `Sos un asistente de recomendación para Luderis, plataforma educativa argentina. Respondé SOLO con JSON válido: {"ids":["id1","id2","id3"]}. Máximo 3 publicaciones, ordenadas por relevancia. Sin resultados: {"ids":[]}`,
              `Alumno nuevo. Materias de interés: ${materias.join(", ")}. Modalidad preferida: ${modalidadPref||"cualquiera"}. Presupuesto máximo: ${presupGte==="999999"?"sin límite":"$"+Number(presupGte).toLocaleString("es-AR")}/hora.

Publicaciones disponibles:
${JSON.stringify(candidatos)}

Respondé SOLO JSON.`,
              400, session.access_token
            ),
            matchTimeout,
          ]);
          const match=raw.match(/\{[\s\S]*\}/);
          if(match){
            const parsed=JSON.parse(match[0]);
            const ids=parsed.ids||[];
            setMatchResults(pubs.filter(p=>ids.includes(p.id)).sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id)));
          }
        }catch{setMatchResults([]);}
        finally{setMatchLoading(false);}
      }

      // Guardar en localStorage como respaldo
      try{
        localStorage.setItem("cl_onboarding_done_"+session.user.email,"1");
        if(materias.length)localStorage.setItem("cl_materias_pref_"+session.user.email,JSON.stringify(materias));
        // Docentes quedan como alumno hasta aprobación
        if(rol)localStorage.setItem("cl_rol_"+session.user.email,esDocente?"alumno":rol);
        if(ubicacion)localStorage.setItem("cl_user_city",ubicacion);
        if(modalidadPref)localStorage.setItem("cl_modalidad_pref_"+session.user.email,modalidadPref);
        if(presupuesto)localStorage.setItem("cl_presupuesto_"+session.user.email,presupuesto);
      }catch{}
      // Alumnos con recomendaciones IA: mostrar resultados antes de cerrar
      if(!esDocente&&materias.length>0){setFinishDone(true);}
      else{onClose(esDocente?"docente":rol);if(postAction)postAction();}
    }catch(e){
      console.error("Onboarding error:",e);
      try{localStorage.setItem("cl_onboarding_done_"+session.user.email,"1");}catch{}
      onClose(rol);
      if(postAction)postAction();
    }finally{setSaving(false);}
  };

  const handleNext=()=>{
    if(isLast){
      if(finishDone){onClose(esDocente?"docente":rol);return;}
      finish();
      return;
    }
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
            <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0,marginTop:2}}>
              <span style={{fontSize:11,color:C.muted}}>{step+1} / {allSteps.length}</span>
              <button onClick={onClose} title="Cerrar" style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",lineHeight:1,padding:"0 2px"}}>×</button>
            </div>
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
            <button onClick={handleNext} disabled={!cur.canNext||saving}
              style={{background:isLast?LUD.grad:(cur.canNext?LUD.grad:C.border),border:"none",borderRadius:20,color:"#fff",padding:"10px 28px",fontWeight:700,fontSize:14,cursor:cur.canNext&&!saving?"pointer":"default",fontFamily:FONT,boxShadow:cur.canNext?"0 4px 12px rgba(26,110,216,.3)":"none",transition:"all .2s",opacity:cur.canNext?1:0.5}}>
              {saving?"Guardando…":isLast&&finishDone?"Ir a explorar →":isLast?"Empezar →":"Continuar →"}
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
