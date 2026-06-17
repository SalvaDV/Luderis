import React, { useState, useEffect } from "react";
import { Trophy, Calendar, GraduationCap, BookOpen, Star, Clock, Play, Users, Check } from "lucide-react";
import * as sb from "./supabase";
import { C, FONT, FONT_DISPLAY, Avatar, Spinner, LUD, tx, accentFor } from "./shared";

// Badge compacto que indica si el usuario es docente o alumno en esa publicación
const RolBadge=({rol})=>rol==="docente"
  ?<span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:10,fontWeight:700,background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}33`,borderRadius:20,padding:"2px 7px",whiteSpace:"nowrap",flexShrink:0}}><GraduationCap size={10} strokeWidth={2.5}/>Docente</span>
  :<span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:10,fontWeight:700,background:"#2EC4A012",color:"#0F6E56",border:"1px solid #2EC4A033",borderRadius:20,padding:"2px 7px",whiteSpace:"nowrap",flexShrink:0}}><BookOpen size={10} strokeWidth={2.5}/>Alumno</span>;

function DocentesDestacados({posts,onOpenPerfil,session}){
  const [visible,setVisible]=useState(true);

  // Calcular top docentes: score = rating * 2 + inscriptos * 0.5 + reseñas
  const docenteMap={};
  posts.filter(p=>p.tipo==="oferta"&&p.activo).forEach(p=>{
    const email=p.autor_email;
    if(!docenteMap[email])docenteMap[email]={
      email,nombre:p.autor_nombre||email.split("@")[0],
      rating:0,inscriptos:0,reseñas:0,materias:new Set(),pubs:0,verificado:false
    };
    const d=docenteMap[email];
    d.pubs++;
    d.materias.add(p.materia);
    if(p.verificado)d.verificado=true;
    if(p.calificacion_promedio){d.ratingSum=(d.ratingSum||0)+parseFloat(p.calificacion_promedio)||0;d.ratingCount=(d.ratingCount||0)+1;d.reseñas+=(p.cantidad_reseñas||p.cantidad_reseñas||0);}
    d.inscriptos+=(p.cantidad_inscriptos||0);
  });
  const top=Object.values(docenteMap)
    .map(d=>({...d,rating:d.ratingCount>0?d.ratingSum/d.ratingCount:0}))
    .filter(d=>d.rating>0||d.inscriptos>0)
    .map(d=>({...d,score:d.rating*2+d.inscriptos*0.3+d.pubs}))
    .sort((a,b)=>b.score-a.score)
    .slice(0,4);

  if(top.length<2)return null;

  return(
    <div style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14}}>
        <div>
          <h2 style={{...tx("h2"),color:C.text,margin:0}}>Docentes destacados</h2>
          <p style={{...tx("meta"),color:C.muted,margin:"4px 0 0"}}>Los mejor valorados de la plataforma</p>
        </div>
        <button onClick={()=>setVisible(v=>!v)} style={{background:"none",border:"none",color:C.muted,fontSize:13,cursor:"pointer",fontFamily:FONT}}>{visible?"▴":"▾"}</button>
      </div>
      {visible&&(
        <div className="cl-hscroll" style={{display:"flex",gap:12,overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",paddingBottom:6}}>
          <style>{`.cl-hscroll::-webkit-scrollbar{display:none}`}</style>
          {top.map((d)=>{
            const ac=accentFor("clases");
            const materias=[...d.materias].filter(Boolean);
            return(
            <button key={d.email} onClick={()=>onOpenPerfil(d.email)}
              style={{flexShrink:0,width:200,display:"flex",flexDirection:"column",alignItems:"flex-start",padding:"18px 16px 16px",background:C.surface,textAlign:"left",border:`1px solid ${C.border}`,borderRadius:16,cursor:"pointer",fontFamily:FONT,boxShadow:C.shadow,transition:"all .18s"}}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow=C.shadowHover;e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor=C.borderStrong||C.border;}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow=C.shadow;e.currentTarget.style.transform="none";e.currentTarget.style.borderColor=C.border;}}>
              {/* Avatar cuadrado-redondeado + badge verificado */}
              <div style={{position:"relative",marginBottom:12}}>
                <Avatar letra={d.nombre[0]} size={56} radius={16}/>
                {d.verificado&&<span title="Verificado" style={{position:"absolute",bottom:-4,right:-4,width:20,height:20,borderRadius:"50%",background:ac.solid,border:`2px solid ${C.surface}`,display:"flex",alignItems:"center",justifyContent:"center"}}><Check size={10} strokeWidth={3} color="#fff"/></span>}
                {d.inscriptos>0&&<span title="Activo" style={{position:"absolute",top:-4,right:-4,width:14,height:14,borderRadius:"50%",background:C.teal,border:`2px solid ${C.surface}`}}/>}
              </div>
              <div style={{...tx("bodyStrong"),fontWeight:700,color:C.text,marginBottom:3,lineHeight:1.2,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.nombre}</div>
              {materias.length>0&&<div style={{...tx("micro"),color:ac.text,fontWeight:600,marginBottom:10,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{materias.slice(0,2).join(" · ")}</div>}
              {/* Rating */}
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:10}}>
                {d.rating>0?<>
                  <span style={{...tx("meta"),fontWeight:700,color:C.text}}>{d.rating.toFixed(1)}</span>
                  <Star size={13} fill="#F59E0B" color="#F59E0B"/>
                  {d.reseñas>0&&<span style={{...tx("micro"),color:C.faint||C.muted}}>({d.reseñas})</span>}
                </>:<span style={{...tx("micro"),color:C.faint||C.muted}}>Sin reseñas</span>}
              </div>
              {/* Stats footer */}
              <div style={{marginTop:"auto",paddingTop:10,borderTop:`1px solid ${C.hairline||C.border}`,width:"100%",display:"flex",gap:12}}>
                <span style={{display:"flex",alignItems:"center",gap:4}}><BookOpen size={13} color={ac.solid}/><span style={{...tx("micro"),fontWeight:650,color:C.textSoft||C.text}}>{d.pubs}</span><span style={{...tx("micro"),color:C.faint||C.muted}}>public.</span></span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><Users size={13} color={ac.solid}/><span style={{...tx("micro"),fontWeight:650,color:C.textSoft||C.text}}>{d.inscriptos}</span><span style={{...tx("micro"),color:C.faint||C.muted}}>alumnos</span></span>
              </div>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AGENDA PERSONAL ──────────────────────────────────────────────────────────
function AgendaPage({session,onOpenCurso,onGoExplore}){
  const [,setInscripciones]=useState([]);
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [mesOffset,setMesOffset]=useState(0);
  const [diaSelec,setDiaSelec]=useState(null);
  const [proximasOpen,setProximasOpen]=useState(true);
  const miEmail=session.user.email;

  useEffect(()=>{
    let mounted=true;
    Promise.all([
      sb.getMisInscripciones(miEmail,session.access_token).catch(()=>[]),
      sb.getMisPublicaciones(miEmail,session.access_token).catch(()=>[]),
    ]).then(([ins,misPublis])=>{
      if(!mounted)return;
      setInscripciones(ins||[]);
      const idsIns=new Set((ins||[]).map(i=>i.publicacion_id));
      const idsPropias=new Set((misPublis||[]).filter(p=>!p.finalizado&&p.activo!==false).map(p=>p.id));
      const allIds=[...new Set([...idsIns,...idsPropias])];
      if(!allIds.length){setLoading(false);return;}
      sb.getPublicacionesByIds(allIds,session.access_token).then(results=>{
        if(!mounted)return;
        const allPosts=(results||[]).filter(Boolean).filter(p=>!p.finalizado).map(p=>({
          ...p,
          // _rol: "docente" si es publicación propia, "alumno" si es inscripción
          // puede ser ambos si el docente se inscribe a su propio curso
          _rol: idsPropias.has(p.id) ? "docente" : "alumno",
        }));
        setPosts(allPosts);
      }).finally(()=>{if(mounted)setLoading(false);});
    });
    return()=>{mounted=false;};
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
          // Clases particulares recurrentes no tienen fechaFin
          const esParticular=p.modo==="particular";
          const dentroRango=esParticular
            ?(!fechaInicio||fecha>=fechaInicio)  // sin límite de fin
            :(!fechaInicio||fecha>=fechaInicio)&&(!fechaFin||fecha<=fechaFin);
          if(dentroRango){
            resultado.push({post:p,clase:c,fecha,esRecurrente:esParticular});
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
      <div style={{marginBottom:20}}>
        <div style={{fontFamily:FONT_DISPLAY,fontWeight:800,color:C.text,fontSize:21,marginBottom:6,letterSpacing:"-.02em",display:"flex",alignItems:"center",gap:8}}><Calendar size={20} strokeWidth={2} color={C.accent}/>Mi agenda</div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{color:C.muted,fontSize:13}}>{mesLabel} · {diasConClase.size} día{diasConClase.size!==1?"s":""} con clase{diasConClase.size!==1?"s":""}</span>
          {(()=>{
            const nDocente=posts.filter(p=>p._rol==="docente").length;
            const nAlumno=posts.filter(p=>p._rol==="alumno").length;
            return(<>
              {nDocente>0&&<span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}33`,borderRadius:20,padding:"3px 10px"}}>
                <GraduationCap size={12} strokeWidth={2}/>{nDocente} como docente
              </span>}
              {nAlumno>0&&<span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,background:"#2EC4A012",color:C.successText||"#2EC4A0",border:`1px solid ${C.success||"#2EC4A0"}33`,borderRadius:20,padding:"3px 10px"}}>
                <BookOpen size={12} strokeWidth={2}/>{nAlumno} como alumno
              </span>}
            </>);
          })()}
        </div>
      </div>

      {loading?<Spinner/>:(
        <>
          {/* Calendatio */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <button onClick={()=>setMesOffset(m=>m-1)} style={{width:34,height:34,background:C.bg,border:`1px solid ${C.border}`,borderRadius:"50%",color:C.muted,cursor:"pointer",fontFamily:FONT,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>‹</button>
              <div style={{textAlign:"center"}}>
                <div style={{...tx("h2"),color:C.text,textTransform:"capitalize"}}>{mes.toLocaleString("es-AR",{month:"long"})}</div>
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
                    style={{textAlign:"center",padding:"8px 2px",borderRadius:9,fontSize:13.5,
                      fontWeight:selec||tieneClase||esHoy?650:450,
                      background:selec?accentFor("cursos").solid:tieneClase?accentFor("cursos").soft:"transparent",
                      color:selec?"#fff":esHoy||tieneClase?accentFor("cursos").text:C.muted,
                      border:esHoy&&!selec?`1.5px solid ${accentFor("cursos").solid}`:"1.5px solid transparent",
                      cursor:tieneClase?"pointer":"default",fontFamily:FONT,
                      position:"relative",minHeight:44,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,
                      transition:"all .12s"}}>
                    <span>{d}</span>
                    {nClases>0&&(
                      <div style={{display:"flex",gap:2,justifyContent:"center"}}>
                        {clasesEnDia(d).slice(0,3).map((item,ci)=>{
                          const col=selec?"rgba(255,255,255,.8)":colorPost(item.post);
                          const esDoc=item.post._rol==="docente";
                          return esDoc
                            ?<div key={ci} style={{width:5,height:5,borderRadius:"50%",background:col,boxShadow:"0 1px 2px rgba(0,0,0,.15)"}}/>
                            :<div key={ci} style={{width:5,height:5,borderRadius:"50%",background:"transparent",border:`1.5px solid ${col}`,boxShadow:"0 1px 2px rgba(0,0,0,.1)"}}/>;
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Clases del día seleccionado */}
            {diaSelec&&(
              <div style={{marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:10}}>
                <div style={{...tx("eyebrow"),color:C.muted,marginBottom:8}}>
                  {new Date(mes.getFullYear(),mes.getMonth(),diaSelec).toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}
                </div>
                {clasesEnDia(diaSelec).length===0
                  ?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"8px 0"}}>Sin clases este día.</div>
                  :clasesEnDia(diaSelec).map((item,i)=>(
                    <div key={i} role="button" tabIndex={0} aria-label={`Abrir ${item.post?.titulo||"clase"}`} onClick={()=>onOpenCurso(item.post)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onOpenCurso(item.post);}}}
                      style={{marginBottom:8,background:C.surface,borderRadius:12,overflow:"hidden",
                        border:`1px solid ${colorPost(item.post)}33`,cursor:"pointer",
                        display:"flex",transition:"all .15s",boxShadow:`0 2px 8px ${colorPost(item.post)}15`}}
                      onMouseEnter={e=>{e.currentTarget.style.transform="translateX(4px)";e.currentTarget.style.boxShadow=`0 4px 16px ${colorPost(item.post)}25`;}}
                      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`0 2px 8px ${colorPost(item.post)}15`;}}>
                      <div style={{width:5,background:colorPost(item.post),flexShrink:0}}/>
                      <div style={{padding:"12px 14px",flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap"}}>
                          <div style={{fontWeight:700,color:C.text,fontSize:14,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.post.titulo}</div>
                          <RolBadge rol={item.post._rol}/>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <span style={{fontWeight:700,color:colorPost(item.post),fontSize:13,display:"flex",alignItems:"center",gap:4}}><Clock size={13} strokeWidth={2}/>{item.clase.hora_inicio}</span>
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
            <div role="button" tabIndex={0} aria-expanded={proximasOpen} aria-label="Mostrar u ocultar próximas clases" onClick={()=>setProximasOpen(v=>!v)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setProximasOpen(v=>!v);}}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:proximasOpen?12:0,cursor:"pointer"}}>
              <div style={{...tx("h2"),color:C.text}}>Próximas clases {proximas.length>0&&<span style={{...tx("meta"),color:C.muted,fontWeight:400}}>({proximas.slice(0,10).length})</span>}</div>
              <span style={{color:C.muted,fontSize:13,transform:proximasOpen?"rotate(0deg)":"rotate(-90deg)",display:"inline-block",transition:"transform .2s"}}>▾</span>
            </div>
            {proximasOpen&&(
            <div>{proximas.length===0?(
              <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>
                {posts.length===0?(
                  <>
                    <p style={{margin:"0 0 14px",fontFamily:FONT}}>No tenés clases agendadas aún.</p>
                    {onGoExplore&&<button onClick={onGoExplore} style={{background:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",border:"none",borderRadius:20,color:"#fff",padding:"9px 20px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 12px rgba(26,110,216,.25)"}}>Buscar clases →</button>}
                  </>
                ):"No hay clases programadas este mes."}
              </div>
            ):proximas.slice(0,10).map((item,i)=>{
              const esMesmo=item.fecha.getDate()===hoy.getDate()&&item.fecha.getMonth()===hoy.getMonth();
              return(
                <div key={i} role="button" tabIndex={0} aria-label={`Abrir ${item.post?.titulo||"clase"}`} onClick={()=>onOpenCurso(item.post)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onOpenCurso(item.post);}}}
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
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:1}}>
                      <div style={{fontWeight:600,color:C.text,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,minWidth:0}}>{item.post.titulo}</div>
                      <RolBadge rol={item.post._rol}/>
                    </div>
                    <div style={{color:C.muted,fontSize:11}}>{item.clase.hora_inicio} → {item.clase.hora_fin} · {item.clase.dia}</div>
                  </div>
                  {esMesmo&&<span style={{fontSize:10,background:C.accentDim,color:C.accent,borderRadius:20,padding:"2px 8px",border:`1px solid ${C.accent}33`,flexShrink:0}}>Hoy</span>}
                </div>
              );
            })}
          </div>)}
          </div>
          {/* Cursos sin horario fijo — asincrónicos o sin clases_sinc */}
          {(()=>{
            const sinHorario=posts.filter(p=>p.sinc!=="sinc"||!p.clases_sinc);
            if(sinHorario.length===0)return null;
            return(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 20px",marginTop:12}}>
                <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:12,display:"flex",alignItems:"center",gap:7}}>
                  <BookOpen size={16} strokeWidth={2} color={C.accent}/> Sin horario fijo
                  <span style={{fontSize:11,color:C.muted,fontWeight:400}}>({sinHorario.length})</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {sinHorario.map(p=>(
                    <div key={p.id} role="button" tabIndex={0} aria-label={`Abrir ${p.titulo||"clase"}`} onClick={()=>onOpenCurso(p)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onOpenCurso(p);}}}
                      style={{display:"flex",gap:11,alignItems:"center",background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,padding:"10px 14px",cursor:"pointer",transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.transform="translateX(3px)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}>
                      <div style={{width:36,height:36,borderRadius:9,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14}}>
                        {p.sinc==="asinc"?<Play size={15} strokeWidth={2} color={C.accent}/>:<BookOpen size={15} strokeWidth={2} color={C.accent}/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:1}}>
                          <div style={{fontWeight:600,color:C.text,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,minWidth:0}}>{p.titulo}</div>
                          <RolBadge rol={p._rol}/>
                        </div>
                        <div style={{fontSize:11,color:C.muted}}>
                          {p.sinc==="asinc"?"Asincrónico · a tu ritmo":p.modo==="particular"?"Clase particular":!p.sinc?"Sin horario definido":"Sin calendario cargado"}
                          {p.materia&&<span style={{marginLeft:5,background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:"0px 7px"}}>{p.materia}</span>}
                        </div>
                      </div>
                      <span style={{fontSize:11,color:C.accent,fontWeight:700,flexShrink:0}}>Ver →</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

export { DocentesDestacados };
export default AgendaPage;
