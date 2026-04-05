import React, { useState, useEffect, useCallback, useRef } from "react";
import * as sb from "./supabase";
import {
  C, FONT, toast,
  Avatar, Spinner, Btn, Label, Modal, StatusBadge, Tag,
  fmt, fmtRel, fmtPrice, calcAvg,
  safeDisplayName, sanitizeContactInfo, avatarColor,
  LUD,
  _avatarCache,
} from "./shared";
import { MyPostCard, OfertasRecibidasModal } from "./App";
import { StreakBadge } from "./PostFormModal";

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

  const [pagos,setPagos]=useState([]);const [loadingPagos,setLoadingPagos]=useState(false);
  React.useEffect(()=>{
    if(seccion!=="ingresos")return;
    setLoadingPagos(true);
    sb.getPagosDocente(pubs[0]?.autor_email||"",null).then(p=>setPagos(p||[])).catch(()=>setPagos([])).finally(()=>setLoadingPagos(false));
  },[seccion]);

  const secciones=[{id:"resumen",label:"Resumen"},{id:"ingresos",label:"💰 Ingresos"},{id:"publicaciones",label:"Publicaciones"},{id:"reseñas",label:"Reseñas"}];
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

      {/* ── INGRESOS ── */}
      {seccion==="ingresos"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {loadingPagos?<Spinner/>:(
            <>
              {/* KPIs de ingresos */}
              {(()=>{
                const aprobados=pagos.filter(p=>p.estado==="approved"||p.estado==="succeeded");
                const totalBruto=aprobados.reduce((a,p)=>a+(Number(p.monto)||0),0);
                const comisionPct=Number(JSON.parse(localStorage.getItem("ldrs_admin_cfg")||"{}").comision_pct||10);
                const totalNeto=totalBruto*(1-comisionPct/100);
                const pendientes=pagos.filter(p=>p.estado==="pending").length;
                const porMes={};
                aprobados.forEach(p=>{
                  const mes=new Date(p.created_at).toLocaleString("es-AR",{month:"short",year:"2-digit"});
                  porMes[mes]=(porMes[mes]||0)+(Number(p.monto)||0);
                });
                const mesesArr=Object.entries(porMes).slice(-6).map(([label,v])=>({label,v}));
                return(
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div style={{background:C.success+"12",border:`1px solid ${C.success}30`,borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
                        <div style={{fontSize:11,color:C.muted,marginBottom:4}}>INGRESOS BRUTOS</div>
                        <div style={{fontSize:24,fontWeight:800,color:C.success}}>${totalBruto.toLocaleString("es-AR",{maximumFractionDigits:0})}</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:2}}>{aprobados.length} pago{aprobados.length!==1?"s":""} aprobado{aprobados.length!==1?"s":""}</div>
                      </div>
                      <div style={{background:"#7B3FBE12",border:"1px solid #7B3FBE30",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
                        <div style={{fontSize:11,color:C.muted,marginBottom:4}}>TU PARTE NETA</div>
                        <div style={{fontSize:24,fontWeight:800,color:"#7B3FBE"}}>${totalNeto.toLocaleString("es-AR",{maximumFractionDigits:0})}</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:2}}>Luderis retiene {comisionPct}%</div>
                      </div>
                    </div>
                    {pendientes>0&&(
                      <div style={{background:C.warn+"12",border:`1px solid ${C.warn}30`,borderRadius:10,padding:"10px 14px",fontSize:13,color:C.warn,fontWeight:600}}>
                        ⏳ {pendientes} pago{pendientes!==1?"s":""} pendiente{pendientes!==1?"s":""}
                      </div>
                    )}
                    {mesesArr.length>0&&(
                      <div style={{background:C.surface,borderRadius:12,padding:"14px 16px"}}>
                        <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:10}}>INGRESOS POR MES</div>
                        <MiniBarChart data={mesesArr} color={C.success} height={56}/>
                        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                          {mesesArr.map((d,i)=><span key={i} style={{fontSize:9,color:C.muted,flex:1,textAlign:"center"}}>{d.label}</span>)}
                        </div>
                      </div>
                    )}
                    {/* Historial de pagos */}
                    <div style={{background:C.surface,borderRadius:12,padding:"14px 16px"}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:10}}>HISTORIAL</div>
                      {pagos.length===0?<div style={{color:C.muted,fontSize:13}}>Sin pagos registrados aún.</div>:
                        pagos.slice(0,10).map((p,i)=>{
                          const color=p.estado==="approved"||p.estado==="succeeded"?C.success:p.estado==="pending"?C.warn:C.danger;
                          return(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<pagos.length-1?`1px solid ${C.border}`:"none"}}>
                              <div>
                                <div style={{fontSize:13,color:C.text,fontWeight:600}}>${Number(p.monto||0).toLocaleString("es-AR")}</div>
                                <div style={{fontSize:11,color:C.muted}}>{new Date(p.created_at).toLocaleDateString("es-AR")} · {p.modo||"mp"}</div>
                              </div>
                              <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:color+"20",color}}>{p.estado}</span>
                            </div>
                          );
                        })
                      }
                    </div>
                  </>
                );
              })()}
            </>
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
// ─── ALERTAS TAB ──────────────────────────────────────────────────────────────
// Sistema de alertas por email: el usuario define criterios con lenguaje natural
// y cuando se publica algo similar, recibe un email automático.
function BilleteraTab({session}){
  const [saldo,setSaldo]=useState(null);
  const [movimientos,setMovimientos]=useState([]);
  const [loading,setLoading]=useState(true);
  const [monto,setMonto]=useState("");
  const [cargando,setCargando]=useState(false);

  const cargar=useCallback(async()=>{
    try{
      const [bil,movs]=await Promise.all([
        sb.db(`billetera?usuario_id=eq.${session.user.id}&select=saldo`,
          "GET",null,session.access_token).then(r=>r?.[0]||{saldo:0}).catch(()=>({saldo:0})),
        sb.db(`billetera_movimientos?usuario_id=eq.${session.user.id}&order=created_at.desc&limit=20`,
          "GET",null,session.access_token).catch(()=>[]),
      ]);
      setSaldo(parseFloat(bil.saldo)||0);
      setMovimientos(movs||[]);
    }catch{setSaldo(0);setMovimientos([]);}
    finally{setLoading(false);}
  },[session]);

  useEffect(()=>{cargar();},[cargar]);

  const cargarSaldo=async()=>{
    const n=parseFloat(monto);
    if(!n||n<100){toast("Monto mínimo: $100","error");return;}
    setCargando(true);
    try{
      // Crear preferencia MP para cargar saldo
      const result=await sb.createMPCheckout({
        publicacion_id:"00000000-0000-0000-0000-000000000001",// placeholder para recarga billetera
        titulo:`Recarga de billetera Luderis — $${n.toLocaleString("es-AR")}`,
        descripcion:"Créditos para usar en clases en Luderis",
        precio:n,cantidad:1,
        alumno_email:session.user.email,
        alumno_nombre:session.user.email.split("@")[0],
        docente_email:session.user.email,
        tipo:"recarga_billetera",
      },session.access_token);
      if(result.disabled){toast("Pago online no disponible aún","info");return;}
      localStorage.setItem("mp_pending_billetera",JSON.stringify({monto:n,email:session.user.email}));
      window.location.href=result.checkout_url;
    }catch(e){toast("Error: "+e.message,"error");}
    finally{setCargando(false);}
  };

  const TIPO_ICONS={recarga:"⬆️",pago:"⬇️",reembolso:"↩️",bono:"🎁"};
  const TIPO_LABELS={recarga:"Recarga",pago:"Pago de clase",reembolso:"Reembolso",bono:"Bono"};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Saldo actual */}
      <div style={{background:"linear-gradient(135deg,#0F3F7A,#1A6ED8)",borderRadius:18,padding:"24px 22px",color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}/>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:.8,opacity:.75,marginBottom:8}}>SALDO DISPONIBLE</div>
        {loading
          ?<div style={{fontSize:36,fontWeight:800}}>…</div>
          :<div style={{fontSize:42,fontWeight:800}}>${(saldo||0).toLocaleString("es-AR",{maximumFractionDigits:0})}</div>
        }
        <div style={{fontSize:12,opacity:.65,marginTop:4}}>Créditos Luderis · ARS</div>
      </div>

      {/* Cargar saldo */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px"}}>
        <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:12}}>Cargar saldo</div>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          {[500,1000,2000,5000].map(n=>(
            <button key={n} onClick={()=>setMonto(String(n))}
              style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${monto===String(n)?C.accent:C.border}`,background:monto===String(n)?C.accentDim:C.bg,color:monto===String(n)?C.accent:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT}}>
              ${n.toLocaleString("es-AR")}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={monto} onChange={e=>setMonto(e.target.value)} type="number" min="100" placeholder="Otro monto (mín. $100)"
            style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:14,outline:"none",fontFamily:FONT}}/>
          <button onClick={cargarSaldo} disabled={cargando||!monto}
            style={{background:C.accent,border:"none",borderRadius:9,color:"#fff",padding:"9px 18px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,opacity:(!monto||cargando)?.5:1}}>
            {cargando?"…":"Cargar"}
          </button>
        </div>
        <div style={{fontSize:11,color:C.muted,marginTop:8}}>Pagá con Mercado Pago · Los créditos se acreditan al instante</div>
      </div>

      {/* Movimientos */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px"}}>
        <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:12}}>Historial</div>
        {loading?<Spinner small/>:movimientos.length===0
          ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"12px 0"}}>Sin movimientos aún.</div>
          :movimientos.map((m,i)=>{
            const esIngreso=m.tipo==="recarga"||m.tipo==="reembolso"||m.tipo==="bono";
            return(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<movimientos.length-1?`1px solid ${C.border}`:"none"}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:20}}>{TIPO_ICONS[m.tipo]||"💳"}</span>
                  <div>
                    <div style={{fontSize:13,color:C.text,fontWeight:500}}>{TIPO_LABELS[m.tipo]||m.tipo}{m.descripcion?` — ${m.descripcion}`:""}</div>
                    <div style={{fontSize:11,color:C.muted}}>{new Date(m.created_at).toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"})}</div>
                  </div>
                </div>
                <div style={{fontWeight:700,fontSize:14,color:esIngreso?C.success:C.danger}}>
                  {esIngreso?"+":"-"}${Math.abs(m.monto||0).toLocaleString("es-AR")}
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

function ReferidosTab({session}){
  const refCode=btoa(session.user.id).replace(/[^a-zA-Z0-9]/g,"").slice(0,10);
  const refUrl=`${window.location.origin}?ref=${refCode}`;
  const [copiado,setCopiado]=useState(false);
  const [referidos,setReferidos]=useState([]);
  const [loadingRef,setLoadingRef]=useState(true);

  // Cargar referidos del usuario
  useEffect(()=>{
    sb.db(`referidos?referidor_id=eq.${session.user.id}&select=*&order=created_at.desc`,
      "GET",null,session.access_token)
      .then(r=>setReferidos(r||[])).catch(()=>setReferidos([]))
      .finally(()=>setLoadingRef(false));
  },[session]);

  const copiar=()=>{
    navigator.clipboard.writeText(refUrl)
      .then(()=>{setCopiado(true);setTimeout(()=>setCopiado(false),2500);})
      .catch(()=>{});
  };

  const compartirWhatsApp=()=>{
    const texto=`¡Te invito a Luderis! 🎓 La plataforma para aprender y enseñar en Argentina.

Encontrá docentes verificados para clases particulares, cursos online y presenciales.

👉 Registrate con mi link y arrancar a aprender hoy:
${refUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`,"_blank");
  };

  const completados=referidos.filter(r=>r.estado==="completado").length;
  const pendientes=referidos.filter(r=>r.estado==="pendiente").length;

  return(
    <div style={{padding:"4px 0",display:"flex",flexDirection:"column",gap:16}}>

      {/* Header con stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[
          {n:referidos.length,label:"Invitados",icon:"👥",color:C.accent},
          {n:completados,label:"Completados",icon:"✅",color:C.success},
          {n:pendientes,label:"Pendientes",icon:"⏳",color:C.warn},
        ].map(({n,label,icon,color})=>(
          <div key={label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",textAlign:"center"}}>
            <div style={{fontSize:20}}>{icon}</div>
            <div style={{fontSize:22,fontWeight:800,color}}>{n}</div>
            <div style={{fontSize:11,color:C.muted}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Beneficio */}
      <div style={{background:"linear-gradient(135deg,#7B3FBE15,#1A6ED815)",border:"1px solid #7B3FBE30",borderRadius:14,padding:"16px 18px"}}>
        <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:6}}>🎁 ¿Qué ganan?</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:16}}>👤</span>
            <span style={{fontSize:13,color:C.muted}}>Tu amigo se registra y obtiene <strong style={{color:C.text}}>acceso prioritario</strong> a docentes verificados</span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:16}}>⭐</span>
            <span style={{fontSize:13,color:C.muted}}>Vos sumás <strong style={{color:C.text}}>puntos de reputación</strong> por cada referido que completa su primer clase</span>
          </div>
        </div>
      </div>

      {/* Link */}
      <div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:14,padding:"16px 18px"}}>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.4,marginBottom:8}}>TU LINK ÚNICO</div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
          <div style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",fontSize:12,color:C.text,wordBreak:"break-all",fontFamily:"monospace",lineHeight:1.4}}>
            {refUrl}
          </div>
          <button onClick={copiar}
            style={{background:copiado?C.success:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",border:"none",borderRadius:9,color:"#fff",padding:"9px 16px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT,flexShrink:0,transition:"background .2s",minWidth:80}}>
            {copiado?"✓ Copiado":"Copiar"}
          </button>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={compartirWhatsApp}
            style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:20,background:"#25D36615",border:"1px solid #25D36640",color:"#25D366",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:FONT}}>
            💬 WhatsApp
          </button>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(refUrl)}&text=${encodeURIComponent("¡Sumate a Luderis! La plataforma para aprender y enseñar en Argentina 🎓")}`}
            target="_blank" rel="noreferrer"
            style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:20,background:"#0088cc15",border:"1px solid #0088cc40",color:"#0088cc",fontWeight:600,fontSize:13,textDecoration:"none",fontFamily:FONT}}>
            ✈️ Telegram
          </a>
          <a href={`mailto:?subject=${encodeURIComponent("Te invito a Luderis")}&body=${encodeURIComponent("¡Hola! Te invito a Luderis. Registrate con mi link: "+refUrl)}`}
            style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:20,background:C.accentDim,border:`1px solid ${C.accent}40`,color:C.accent,fontWeight:600,fontSize:13,textDecoration:"none",fontFamily:FONT}}>
            📧 Email
          </a>
        </div>
      </div>

      {/* Lista de referidos */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px"}}>
        <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:12}}>Historial de invitaciones</div>
        {loadingRef?<div style={{color:C.muted,fontSize:13}}>Cargando…</div>:
          referidos.length===0?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"12px 0"}}>Todavía no invitaste a nadie. ¡Compartí tu link!</div>:
          referidos.map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<referidos.length-1?`1px solid ${C.border}`:"none"}}>
              <div style={{fontSize:13,color:C.text}}>{r.referido_email||"Usuario"}</div>
              <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,
                background:r.estado==="completado"?C.success+"20":C.warn+"20",
                color:r.estado==="completado"?C.success:C.warn}}>
                {r.estado==="completado"?"✓ Completado":"⏳ Pendiente"}
              </span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function AlertasTab({session}){
  const [alertas,setAlertas]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [desc,setDesc]=useState("");
  const [saving,setSaving]=useState(false);
  const [tipoAlerta,setTipoAlerta]=useState("ambos");

  const cargar=useCallback(async()=>{
    try{
      const data=await sb.db(`alertas_publicacion?usuario_id=eq.${session.user.id}&order=created_at.desc`,"GET",null,session.access_token);
      setAlertas(data||[]);
    }catch{setAlertas([]);}finally{setLoading(false);}
  },[session.user.id,session.access_token]);

  useEffect(()=>{cargar();},[cargar]);

  const crear=async()=>{
    if(!desc.trim())return;
    setSaving(true);
    try{
      // Usar IA para extraer criterios estructurados de la descripción
      const raw=await sb.callIA(
        `Sos un asistente que extrae criterios de búsqueda de publicaciones educativas.\nAnalizá la descripción y devolvé JSON con: {"materia":"...","tipo":"oferta|busqueda|cualquiera","modalidad":"virtual|presencial|cualquiera","palabras_clave":["..."],"resumen":"frase corta de qué busca"}\nSOLO JSON, sin markdown.`,
        `Descripción del usuario: "${desc}"`,
        300,session.access_token
      );
      let criterios={materia:"",tipo:"cualquiera",modalidad:"cualquiera",palabras_clave:[],resumen:desc};
      try{const m=raw.match(/\{[\s\S]*\}/);if(m)criterios=JSON.parse(m[0]);}catch{}
      await sb.db("alertas_publicacion","POST",{
        usuario_id:session.user.id,
        usuario_email:session.user.email,
        descripcion:desc,
        criterios_json:JSON.stringify(criterios),
        tipo_alerta:tipoAlerta,
        usuario_ciudad:(() => { try { return localStorage.getItem("cl_user_city") || null; } catch { return null; } })(),
        activa:true,
      },session.access_token,"return=representation");
      setDesc("");setShowForm(false);
      toast("Alerta creada. Te avisaremos cuando aparezca algo similar 🔔","success",4000);
      cargar();
    }catch(e){toast("Error al crear la alerta: "+e.message,"error");}
    finally{setSaving(false);}
  };

  const eliminar=async(id)=>{
    try{
      await sb.db(`alertas_publicacion?id=eq.${id}`,"DELETE",null,session.access_token);
      setAlertas(p=>p.filter(a=>a.id!==id));
      toast("Alerta eliminada","info");
    }catch{}
  };

  const toggleActiva=async(alerta)=>{
    try{
      await sb.db(`alertas_publicacion?id=eq.${alerta.id}`,"PATCH",{activa:!alerta.activa},session.access_token);
      setAlertas(p=>p.map(a=>a.id===alerta.id?{...a,activa:!a.activa}:a));
    }catch{}
  };

  return(
    <div style={{fontFamily:FONT}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontWeight:700,color:C.text,fontSize:16,marginBottom:4}}>🔔 Alertas de publicaciones</div>
          <div style={{fontSize:13,color:C.muted,lineHeight:1.5}}>
            Recibís un email cuando se publique algo que coincida con tus criterios.
          </div>
        </div>
        <button onClick={()=>setShowForm(v=>!v)}
          style={{background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 12px rgba(26,110,216,.25)",flexShrink:0}}>
          + Nueva alerta
        </button>
      </div>

      {/* Formulario nueva alerta */}
      {showForm&&(
        <div style={{background:C.surface,border:`1px solid ${C.accent}33`,borderRadius:14,padding:"18px 20px",marginBottom:20,animation:"fadeUp .15s ease"}}>
          <div style={{fontWeight:600,color:C.text,fontSize:14,marginBottom:10}}>¿Qué tipo de publicación buscás?</div>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)}
            placeholder="Ej: Clases de guitarra online para principiantes, profesor con experiencia en rock..."
            rows={3}
            style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",fontFamily:FONT,boxSizing:"border-box",resize:"vertical",marginBottom:12}}/>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:6}}>¿Qué tipo de publicaciones querés monitorear?</div>
            <div style={{display:"flex",gap:6}}>
              {[["ambos","📢 Ambas"],["oferta","🎓 Clases/Cursos"],["busqueda","🔍 Búsquedas"]].map(([v,l])=>(
                <button key={v} onClick={()=>setTipoAlerta(v)}
                  style={{padding:"6px 14px",borderRadius:20,fontSize:12,cursor:"pointer",fontFamily:FONT,
                    background:tipoAlerta===v?(v==="oferta"?C.accent:v==="busqueda"?"#F59E0B":LUD.grad):C.bg,
                    color:tipoAlerta===v?"#fff":C.muted,
                    border:`1px solid ${tipoAlerta===v?(v==="oferta"?C.accent:v==="busqueda"?"#F59E0B":C.accent):C.border}`,
                    fontWeight:tipoAlerta===v?700:400,transition:"all .12s"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div style={{fontSize:12,color:C.muted,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:14,background:"linear-gradient(135deg,#7B3FBE,#1A6ED8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700}}>✦</span>
            La IA va a analizar tu descripción y detectar publicaciones similares automáticamente.
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={crear} disabled={saving||!desc.trim()}
              style={{background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"9px 24px",fontWeight:700,fontSize:13,cursor:saving?"wait":"pointer",fontFamily:FONT,opacity:saving||!desc.trim()?0.6:1}}>
              {saving?"Procesando…":"Crear alerta →"}
            </button>
            <button onClick={()=>{setShowForm(false);setDesc("");}}
              style={{background:"none",border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"9px 16px",cursor:"pointer",fontFamily:FONT,fontSize:13}}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de alertas */}
      {loading?<Spinner/>:alertas.length===0?(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"48px 24px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>🔔</div>
          <div style={{fontWeight:600,color:C.text,fontSize:15,marginBottom:8}}>Sin alertas activas</div>
          <div style={{color:C.muted,fontSize:13,marginBottom:20}}>Creá una alerta y te avisamos cuando aparezca algo que te interese.</div>
          <button onClick={()=>setShowForm(true)}
            style={{background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"10px 24px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:FONT}}>
            Crear mi primera alerta
          </button>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {alertas.map(a=>{
            let criterios={};try{criterios=JSON.parse(a.criterios_json||"{}"); }catch{}
            return(
              <div key={a.id} style={{background:C.surface,border:`1px solid ${a.activa?(a.tipo_alerta==="oferta"?C.accent+"44":a.tipo_alerta==="busqueda"?"#F59E0B44":"#7B3FBE44"):C.border}`,borderLeft:`3px solid ${a.tipo_alerta==="oferta"?C.accent:a.tipo_alerta==="busqueda"?"#F59E0B":"#7B3FBE"}`,borderRadius:12,padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start",opacity:a.activa?1:0.6,transition:"all .2s"}}>
                <div style={{fontSize:22,flexShrink:0,marginTop:2,width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:a.tipo_alerta==="oferta"?C.accentDim:a.tipo_alerta==="busqueda"?"#F59E0B15":"#7B3FBE12",border:`1px solid ${a.tipo_alerta==="oferta"?C.accent+"40":a.tipo_alerta==="busqueda"?"#F59E0B40":"#7B3FBE40"}`}}>
                  {a.tipo_alerta==="oferta"?"🎓":a.tipo_alerta==="busqueda"?"🔍":"📢"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,color:C.text,fontSize:14,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {criterios.resumen||a.descripcion}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                    {criterios.materia&&<span style={{fontSize:11,background:C.accentDim,color:C.accent,borderRadius:20,padding:"2px 9px",fontWeight:600}}>{criterios.materia}</span>}
                    {criterios.tipo&&criterios.tipo!=="cualquiera"&&<span style={{fontSize:11,background:C.bg,color:C.muted,borderRadius:20,padding:"2px 9px",border:`1px solid ${C.border}`}}>{criterios.tipo==="oferta"?"Clases":"Búsquedas"}</span>}
                    {criterios.modalidad&&criterios.modalidad!=="cualquiera"&&<span style={{fontSize:11,background:C.bg,color:C.muted,borderRadius:20,padding:"2px 9px",border:`1px solid ${C.border}`}}>{criterios.modalidad==="virtual"?"🌐 Virtual":"📍 Presencial"}</span>}
                    {(criterios.palabras_clave||[]).slice(0,3).map(p=>(
                      <span key={p} style={{fontSize:11,background:C.bg,color:C.muted,borderRadius:20,padding:"2px 9px",border:`1px solid ${C.border}`}}>{p}</span>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:C.muted}}>Creada {fmtRel(a.created_at)}</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
                  {/* Toggle activa/pausada */}
                  <button onClick={()=>toggleActiva(a)}
                    style={{fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:20,border:`1px solid ${a.activa?C.accent+"40":C.border}`,background:a.activa?C.accentDim:"transparent",color:a.activa?C.accent:C.muted,cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap"}}>
                    {a.activa?"● Activa":"Pausada"}
                  </button>
                  <button onClick={()=>eliminar(a.id)}
                    style={{background:"none",border:`1px solid ${C.border}`,borderRadius:20,color:C.danger,padding:"4px 10px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiCuentaPage({session,onOpenDetail,onOpenCurso,onEdit,onNew,onOpenChat,onRefreshOfertas,onClearBadge,onStartOnboarding}){
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
  const [videoPresentacion,setVideoPresentacion]=useState("");
  const [avatarUrl,setAvatarUrl]=useState("");
  const [savingDisplayName,setSavingDisplayName]=useState(false);
  const [perfilLoaded,setPerfilLoaded]=useState(false);
  // Cargar bio, ubicacion y avatar desde la tabla usuarios al montar
  useEffect(()=>{
    if(perfilLoaded)return;
    sb.getUsuarioByIdFull(session.user.id,session.access_token).then(u=>{
      if(u){if(u.bio)setBio(u.bio);if(u.ubicacion)setUbicacionPerfil(u.ubicacion);if(u.avatar_url)setAvatarUrl(u.avatar_url);if(u.video_presentacion)setVideoPresentacion(u.video_presentacion);}
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
                  {/* Foto de perfil */}
                  <Label>Foto de perfil</Label>
                  <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
                    <div style={{width:64,height:64,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:`2px solid ${avatarUrl?C.accent:C.border}`,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:avatarUrl?"0 2px 12px rgba(26,110,216,.2)":"none"}}>
                      {avatarUrl&&avatarUrl.startsWith("http")
                        ?<img src={avatarUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>
                        :<Avatar letra={nombre[0]||session.user.email[0]} size={64}/>
                      }
                    </div>
                    <div style={{flex:1}}>
                      <input value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} placeholder="URL de tu foto (ej: https://...)" style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box",marginBottom:4}}/>
                      <div style={{fontSize:11,color:C.muted}}>Pegá la URL de una imagen. Recomendado: foto cuadrada, mínimo 200×200px.</div>
                    </div>
                  </div>
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
              <div>
                <label style={{fontSize:12,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>🎬 Video de presentación (YouTube)</label>
                <input value={videoPresentacion} onChange={e=>setVideoPresentacion(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                <div style={{fontSize:10,color:C.muted,marginTop:3}}>Se muestra en tu perfil público.</div>
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
                    await sb.updateUsuario(uid,{display_name:newName,nombre:newName,bio:bio.trim()||null,ubicacion:ubicacionPerfil.trim()||null,avatar_url:avatarUrl.trim()||null,video_presentacion:videoPresentacion.trim()||null},session.access_token);
                    // Guardar bio y ciudad en localStorage para el progreso de perfil
                    try{
                      if(bio.trim())localStorage.setItem("cl_bio_"+session.user.email,bio.trim());else localStorage.removeItem("cl_bio_"+session.user.email);
                      if(ubicacionPerfil.trim())localStorage.setItem("cl_user_city",ubicacionPerfil.trim());
                    }catch{}
                    // Actualizar cache local de avatar
                    const avTrim=avatarUrl.trim()||null;
                    _avatarCache[session.user.email]=avTrim;
                    try{if(avTrim)localStorage.setItem("cl_avatar_"+session.user.email,avTrim);else localStorage.removeItem("cl_avatar_"+session.user.email);}catch{}
                    // Forzar re-render del sidebar
                    try{window.dispatchEvent(new Event("avatar-updated"));}catch{}
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
          {id:"alertas",label:"🔔 Alertas ✦",count:null},
          {id:"referidos",label:"🎁 Referidos",count:null},
          {id:"billetera",label:"💰 Billetera",count:null},
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
          {/* Banner verificación docente — para quienes no completaron el KYC */}
          {(()=>{
            const rolLocal=localStorage.getItem("cl_rol_"+session.user.email)||"alumno";
            const kycDone=localStorage.getItem("cl_kyc_done_"+session.user.email);
            if(!kycDone&&rolLocal==="alumno")return(
              <div style={{background:`linear-gradient(135deg,${C.accentDim},#7B3FBE08)`,border:`1px solid ${C.accent}33`,borderRadius:14,padding:"16px 18px",marginBottom:16,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{fontSize:32}}>🎓</div>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:3}}>¿Querés enseñar en Luderis?</div>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>Completá tu verificación de identidad para publicar clases y cursos.</div>
                </div>
                <button onClick={()=>onStartOnboarding&&onStartOnboarding()}
                  style={{background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 12px rgba(26,110,216,.25)",flexShrink:0,whiteSpace:"nowrap"}}>
                  Verificarme →
                </button>
              </div>
            );
            return null;
          })()}
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
      {tabCuenta==="alertas"&&<AlertasTab session={session}/>}
      {tabCuenta==="referidos"&&<ReferidosTab session={session}/>}
      {tabCuenta==="billetera"&&<BilleteraTab session={session}/>}
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
// ─── PANEL DE NOTIFICACIONES ──────────────────────────────────────────────────
export default MiCuentaPage;
