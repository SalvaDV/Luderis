import React, { useState, useEffect } from "react";
import * as sb from "./supabase";
import { C, FONT, Avatar, Spinner } from "./shared";

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

// ─── FORO DEL CURSO ───────────────────────────────────────────────────────────
-e 
export { DocentesDestacados };
export default AgendaPage;
