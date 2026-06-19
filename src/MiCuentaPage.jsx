import React, { useState, useEffect, useCallback, useRef } from "react";
import { BarChart2, Eye, Clock, Clipboard, Bookmark, Star, CreditCard, Sparkles, Banknote, FileText, Gift, GraduationCap, BookOpen, CheckCircle2, Users, Bell, Globe, MapPin, Lock, AlertTriangle, RefreshCw, ArrowUp, ArrowDown, Briefcase, ScrollText, Megaphone, MessageCircle, Video, ExternalLink, Send, Camera, Upload, PlayCircle, TrendingUp, Trash2, BadgeCheck, Mail } from "lucide-react";
import * as sb from "./supabase";
import { useAppActions } from "./AppContext";
import {
  C, FONT, FONT_DISPLAY, toast, accentFor, tx,
  Avatar, Spinner, Btn, Label, Modal,
  fmtRel, fmtPrice, calcAvg,
  safeDisplayName, sanitizeContactInfo, moderarMensaje, avatarColor,
  LUD,
  _avatarCache,
} from "./shared";
import { MyPostCard, OfertasRecibidasModal } from "./App";
import { StreakBadge } from "./PostFormModal";

// Sanitiza URLs para evitar javascript: protocol XSS
const safeUrl=(url)=>{if(!url)return null;const u=String(url).trim();return(/^https?:\/\//i.test(u))?u:null;};

// Gráfico de barras SVG
function MiniBarChart({data,color,height=50,width=0,showValues=true}){
  if(!data||!data.length)return null;
  const max=Math.max(...data.map(d=>d.v),1);
  const barW=Math.max(4,(width/data.length)-2);
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

// ─── StatCard / SubHead (estilo prototipo) ───────────────────────────────────
function StatCard({icon:Icon,label,value,suffix,accentKey="cursos"}){
  const ac=accentFor(accentKey);
  return(
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",boxShadow:C.shadow,minWidth:150}}>
      <div style={{width:40,height:40,borderRadius:11,background:ac.soft,color:ac.solid,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}><Icon size={20} strokeWidth={2}/></div>
      <div style={{...tx("display"),fontSize:26,color:C.text,letterSpacing:"-.02em",lineHeight:1.1}}>{value}{suffix&&<span style={{fontSize:16,color:C.muted,fontWeight:600}}>{suffix}</span>}</div>
      <div style={{...tx("meta"),color:C.muted,marginTop:3}}>{label}</div>
    </div>
  );
}
function SubHead({icon:Icon,title}){
  return <h3 style={{...tx("h2"),color:C.text,margin:"0 0 14px",display:"flex",alignItems:"center",gap:8}}><Icon size={17} color={C.muted} strokeWidth={2}/>{title}</h3>;
}
// Card "Vistas / actividad por mes" (estilo prototipo)
function VistasCard({totalVistas,mesesData}){
  const ac=accentFor("cursos");
  const max=Math.max(...mesesData.map(d=>d.v),1);
  return(
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20,boxShadow:C.shadow}}>
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{...tx("meta"),color:C.muted,fontWeight:500}}>Vistas totales</div>
          <div style={{...tx("display"),fontSize:24,color:C.text,letterSpacing:"-.02em"}}>{(totalVistas||0).toLocaleString("es-AR")}</div>
        </div>
      </div>
      <div style={{...tx("micro"),color:C.faint||C.muted,fontWeight:700,letterSpacing:.6,marginBottom:8}}>PUBLICACIONES POR MES</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:10,height:84}}>
        {mesesData.map((d,i)=>(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:7}}>
            <div style={{width:"100%",maxWidth:26,height:`${Math.max((d.v/max)*64,2)}px`,borderRadius:6,background:`linear-gradient(180deg,${ac.solid},${ac.solid}aa)`,opacity:i===mesesData.length-1?1:.55}}/>
            <span style={{...tx("micro"),color:C.faint||C.muted}}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// Card "Ingresos estimados" (estilo prototipo)
function IngresosCard({ingresosEst,onVerDetalle}){
  const ac=accentFor("cursos");
  return(
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20,boxShadow:C.shadow,display:"flex",flexDirection:"column"}}>
      <div style={{...tx("meta"),color:C.muted,fontWeight:500,marginBottom:4}}>Ingresos estimados (mes)</div>
      <div style={{...tx("display"),fontSize:28,color:C.text,letterSpacing:"-.02em",marginBottom:4}}>{ingresosEst>0?`$${ingresosEst.toLocaleString("es-AR",{maximumFractionDigits:0})}`:"—"}</div>
      <div style={{...tx("micro"),color:C.faint||C.muted,marginBottom:"auto"}}>Precio × inscriptos · no refleja pagos reales</div>
      <button onClick={onVerDetalle} style={{marginTop:18,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,padding:"11px 16px",borderRadius:10,border:`1px solid ${ac.solid}`,background:ac.soft,color:ac.text,fontFamily:FONT,fontSize:13,fontWeight:650,cursor:"pointer"}}>
        <TrendingUp size={16}/>Ver detalle de cobros
      </button>
    </div>
  );
}

function MiActividadCard({session}){
  const [insc,setInsc]=useState(null);
  useEffect(()=>{
    let mounted=true;
    sb.getMisInscripciones(session.user.email,session.access_token).then(r=>{if(mounted)setInsc(r||[]);}).catch(()=>{if(mounted)setInsc([]);});
    return()=>{mounted=false;};
  },[session.user.email,session.access_token]);
  if(insc===null)return null;
  const activos=insc.filter(i=>!i.clase_finalizada).length;
  const completados=insc.filter(i=>i.clase_finalizada).length;
  return(
    <div style={{marginBottom:26}}>
      <SubHead icon={BookOpen} title="Mi actividad como alumno"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
        <StatCard icon={GraduationCap} label="Cursos inscripto" value={insc.length} accentKey="cursos"/>
        <StatCard icon={PlayCircle} label="En curso" value={activos} accentKey="clases"/>
        <StatCard icon={CheckCircle2} label="Completados" value={completados} accentKey="pedidos"/>
      </div>
    </div>
  );
}

function DocenteStats({pubs,reseñas,inscritosMap,misOfertasEnv=[],session}){
  const [seccion,setSeccion]=useState("resumen");
  const ofertas=pubs.filter(p=>p.tipo==="oferta"&&p.activo!==false&&!p.finalizado);
  const finalizadas=pubs.filter(p=>p.tipo==="oferta"&&!!p.finalizado);
  const todasOfertas=pubs.filter(p=>p.tipo==="oferta");
  const totalAlumnos=Object.values(inscritosMap||{}).reduce((a,b)=>a+b,0);
  const avg=calcAvg(reseñas);
  const totalVistas=pubs.reduce((a,p)=>a+(parseInt(p.vistas)||0),0);

  // Alumnos activos vs finalizados
  const alumnosActivos=ofertas.reduce((a,p)=>a+(inscritosMap[p.id]||0),0);
  const alumnosFinalizados=finalizadas.reduce((a,p)=>a+(inscritosMap[p.id]||0),0);

  // Tasa de conversión: ofertas enviadas en pedidos → aceptadas
  const ofertasEnv=misOfertasEnv.length;
  const ofertasAcept=misOfertasEnv.filter(o=>o.estado==="aceptada").length;
  const tasaOfertas=ofertasEnv>0?Math.round((ofertasAcept/ofertasEnv)*100):null;

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


  // Impact score: rating/5 × (alumnos>0?1:0.5) × min(pubs/3,1)
  const impactScore=avg&&totalAlumnos>0
    ?Math.round((avg/5)*Math.min(totalAlumnos/10,1)*Math.min(todasOfertas.length/3,1)*100)
    :null;

  const [pagos,setPagos]=useState([]);const [loadingPagos,setLoadingPagos]=useState(false);const [pagosVisible,setPagosVisible]=useState(10);
  const [comisionPct,setComisionPct]=useState(10);
  React.useEffect(()=>{
    if(seccion!=="ingresos")return;
    setLoadingPagos(true);
    Promise.all([
      sb.getPagosDocente(session?.user?.email||"",session?.access_token||null).catch(()=>[]),
      sb.getConfigValor("comision_pct",session?.access_token||null),
    ]).then(([p,cfg])=>{
      setPagos(p||[]);
      if(cfg!==null)setComisionPct(Number(cfg)||10);
    }).finally(()=>setLoadingPagos(false));
  },[seccion]);// eslint-disable-line

  if(todasOfertas.length===0)return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"24px 20px",marginBottom:20,textAlign:"center"}}>
      <div style={{marginBottom:8,color:C.muted}}><Megaphone size={28} strokeWidth={1.5}/></div>
      <div style={{fontWeight:700,color:C.text,fontSize:15,marginBottom:6}}>Publicá tu primera clase</div>
      <div style={{color:C.muted,fontSize:13,marginBottom:16}}>Una vez que publiques, acá vas a ver tus estadísticas de ingresos y alumnos.</div>
    </div>
  );
  const secciones=[{id:"resumen",label:"Resumen"},{id:"ingresos",label:"Ingresos"},{id:"publicaciones",label:"Publicaciones"}];
  const statStyle={background:C.surface,borderRadius:12,padding:"12px 14px"};

  const KPIS=[
    {label:"Publicaciones activas",val:ofertas.length,Icon:Megaphone,acc:"clases"},
    {label:"Alumnos activos",val:alumnosActivos||totalAlumnos,Icon:Users,acc:"cursos"},
    {label:"Valoración",val:avg?avg.toFixed(1):"—",suffix:avg?"★":"",Icon:Star,acc:"clases"},
    {label:"Tasa de aceptación",val:tasaOfertas!==null?tasaOfertas:0,suffix:"%",Icon:MessageCircle,acc:"pedidos"},
  ];
  return(
    <div style={{marginBottom:20}}>
      <SubHead icon={TrendingUp} title="Mi actividad como docente"/>

      {/* 4 KPIs como StatCards (estilo prototipo) */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:14}}>
        {KPIS.map(k=>(<StatCard key={k.label} icon={k.Icon} label={k.label} value={k.val} suffix={k.suffix} accentKey={k.acc}/>))}
      </div>

      {/* Vistas + Ingresos (2 columnas, estilo prototipo) */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12,marginBottom:20}}>
        <VistasCard totalVistas={totalVistas} mesesData={mesesData}/>
        <IngresosCard ingresosEst={ingresosEst} onVerDetalle={()=>setSeccion("ingresos")}/>
      </div>

      {/* Sub-tabs de detalle */}
      <div style={{display:"flex",gap:2,marginBottom:16,background:C.surfaceAlt||C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:3,maxWidth:360}}>
        {secciones.map(s=>(
          <button key={s.id} onClick={()=>setSeccion(s.id)}
            style={{flex:1,padding:"8px",borderRadius:8,border:"none",fontWeight:seccion===s.id?700:500,
              fontSize:12.5,cursor:"pointer",fontFamily:FONT,transition:"all .14s",
              background:seccion===s.id?C.surface:"transparent",
              color:seccion===s.id?accentFor("cursos").text:C.muted,
              boxShadow:seccion===s.id?C.shadow:"none"}}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── RESUMEN ── */}
      {seccion==="resumen"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>

          {/* Conversión visitas → inscriptos */}
          {tasaConversion&&(
            <div style={{...statStyle,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:11,color:C.muted,marginBottom:2}}>Conversión</div>
                <div style={{fontSize:10,color:C.muted}}>visitas → inscriptos</div>
              </div>
              <div style={{fontSize:20,fontWeight:700,color:C.info}}>{tasaConversion}%</div>
            </div>
          )}

          {/* Alumnos activos vs finalizados */}
          {(alumnosActivos>0||alumnosFinalizados>0)&&(
            <div style={statStyle}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,marginBottom:10}}>ALUMNOS POR ESTADO</div>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <div style={{flex:1,textAlign:"center",background:C.success+"12",borderRadius:10,padding:"10px 6px"}}>
                  <div style={{fontSize:22,fontWeight:700,color:C.successText}}>{alumnosActivos}</div>
                  <div style={{fontSize:10,color:C.muted}}>En clases activas</div>
                </div>
                <div style={{flex:1,textAlign:"center",background:C.purple+"12",borderRadius:10,padding:"10px 6px"}}>
                  <div style={{fontSize:22,fontWeight:700,color:C.purple}}>{alumnosFinalizados}</div>
                  <div style={{fontSize:10,color:C.muted}}>En clases finalizadas</div>
                </div>
              </div>
              {/* Barra de proporción */}
              {totalAlumnos>0&&(
                <div style={{height:6,background:C.border,borderRadius:4,overflow:"hidden",display:"flex"}}>
                  <div style={{height:"100%",background:C.success,width:`${(alumnosActivos/totalAlumnos)*100}%`,transition:"width .5s ease"}}/>
                  <div style={{height:"100%",background:C.purple,width:`${(alumnosFinalizados/totalAlumnos)*100}%`,transition:"width .5s ease"}}/>
                </div>
              )}
            </div>
          )}

          {/* Tasa de conversión de ofertas en pedidos */}
          {tasaOfertas!==null&&(
            <div style={{...statStyle,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:11,color:C.muted,marginBottom:2}}>Ofertas en pedidos</div>
                <div style={{fontSize:10,color:C.muted}}>{ofertasAcept} aceptadas de {ofertasEnv} enviadas</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:24,fontWeight:700,color:tasaOfertas>=50?C.success:C.warn}}>{tasaOfertas}%</div>
                <div style={{fontSize:10,color:C.muted}}>tasa de aceptación</div>
              </div>
            </div>
          )}

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
                      <div style={{fontSize:11,color:C.muted,flexShrink:0,display:"inline-flex",alignItems:"center",gap:3}}><Eye size={10} strokeWidth={2}/>{v}</div>
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
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
                      <div style={{background:C.success+"12",border:`1px solid ${C.success}30`,borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
                        <div style={{fontSize:11,color:C.muted,marginBottom:4}}>INGRESOS BRUTOS</div>
                        <div style={{fontFamily:FONT_DISPLAY,fontSize:24,fontWeight:800,letterSpacing:"-.02em",color:C.successText}}>${totalBruto.toLocaleString("es-AR",{maximumFractionDigits:0})}</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:2}}>{aprobados.length} pago{aprobados.length!==1?"s":""} aprobado{aprobados.length!==1?"s":""}</div>
                      </div>
                      <div style={{background:C.purple+"12",border:`1px solid ${C.purple}30`,borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
                        <div style={{fontSize:11,color:C.muted,marginBottom:4}}>TU PARTE NETA</div>
                        <div style={{fontFamily:FONT_DISPLAY,fontSize:24,fontWeight:800,letterSpacing:"-.02em",color:C.purple}}>${totalNeto.toLocaleString("es-AR",{maximumFractionDigits:0})}</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:2}}>Luderis retiene {comisionPct}%</div>
                      </div>
                    </div>
                    {pendientes>0&&(
                      <div style={{background:C.warn+"12",border:`1px solid ${C.warn}30`,borderRadius:10,padding:"10px 14px",fontSize:13,color:C.warn,fontWeight:600}}>
                        <span style={{display:"inline-flex",alignItems:"center",gap:3}}><Clock size={10} strokeWidth={2}/>{pendientes} pago{pendientes!==1?"s":""} pendiente{pendientes!==1?"s":""}</span>
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
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8}}>HISTORIAL</div>
                        {pagos.length>0&&<div style={{fontSize:11,color:C.muted}}>{Math.min(pagosVisible,pagos.length)} de {pagos.length}</div>}
                      </div>
                      {pagos.length===0?<div style={{color:C.muted,fontSize:13}}>Sin pagos registrados aún.</div>:(
                        <>
                          {pagos.slice(0,pagosVisible).map((p,i)=>{
                            const color=p.estado==="approved"||p.estado==="succeeded"?C.success:p.estado==="pending"?C.warn:C.danger;
                            return(
                              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<Math.min(pagosVisible,pagos.length)-1?`1px solid ${C.border}`:"none"}}>
                                <div>
                                  <div style={{fontSize:13,color:C.text,fontWeight:600}}>${Number(p.monto||0).toLocaleString("es-AR")}</div>
                                  <div style={{fontSize:11,color:C.muted}}>{new Date(p.created_at).toLocaleDateString("es-AR")} · {p.modo||"mp"}</div>
                                </div>
                                <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:color+"20",color}}>{p.estado}</span>
                              </div>
                            );
                          })}
                          {pagos.length>pagosVisible&&(
                            <button onClick={()=>setPagosVisible(v=>v+20)} style={{marginTop:10,width:"100%",background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:"7px",fontSize:12,cursor:"pointer",fontFamily:FONT,fontWeight:600,transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                              Ver {Math.min(20,pagos.length-pagosVisible)} más ↓
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </>
                );
              })()}
            </>
          )}
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
  const [nuevoTipo,setNuevoTipo]=useState("texto");
  const [nuevoTitulo,setNuevoTitulo]=useState("");
  const [nuevoBody,setNuevoBody]=useState("");
  const [savingC,setSavingC]=useState(false);
  const pageRef=useRef(null);
  const chatPubId=oferta.busqueda_id||oferta.id;
  useEffect(()=>{
    if(pageRef.current)pageRef.current.scrollTop=0;
    let mounted=true;
    sb.getContenido(oferta.id,session.access_token)
      .then(r=>{if(mounted)setContenido(r||[]);})
      .catch(()=>{})
      .finally(()=>{if(mounted)setLoading(false);});
    return()=>{mounted=false;};
  },[oferta.id,session.access_token]);// eslint-disable-line
  const addC=async()=>{
    if(!nuevoTitulo.trim())return;setSavingC(true);
    try{
      const d={publicacion_id:oferta.id,tipo:nuevoTipo,titulo:nuevoTitulo.trim(),orden:contenido.length+1};
      if(nuevoTipo==="link"||nuevoTipo==="video")d.url=nuevoBody.trim();else d.texto=nuevoBody.trim()||null;
      const r=await sb.insertContenido(d,session.access_token);
      setContenido(p=>[...p,...(Array.isArray(r)?r:[r])]);
      setNuevoTitulo("");setNuevoBody("");setShowAdd(false);
    }catch(e){toast(e.message,"error");}finally{setSavingC(false);}
  };
  const removeC=async(id)=>{try{await sb.deleteContenido(id,session.access_token);setContenido(p=>p.filter(x=>x.id!==id));}catch(e){toast(e.message,"error");}};
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
          <span style={{fontSize:11,background:"#4ECB7115",color:C.successText,border:"1px solid #4ECB7133",borderRadius:20,padding:"3px 10px",fontWeight:700}}>Acordada</span>
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
              <input value={nuevoTitulo} onChange={e=>setNuevoTitulo(e.target.value)} aria-label="Título del contenido" placeholder="Título" style={iS2}/>
              <textarea value={nuevoBody} onChange={e=>setNuevoBody(e.target.value)} aria-label={nuevoTipo==="link"||nuevoTipo==="video"?"URL del enlace":"Texto del contenido"} placeholder={nuevoTipo==="link"||nuevoTipo==="video"?"URL del enlace":"Texto (opcional)"} style={{...iS2,minHeight:65,resize:"vertical"}}/>
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
                      {(item.tipo==="video"||item.tipo==="link"||item.tipo==="archivo")&&safeUrl(item.url)&&<a href={safeUrl(item.url)} target="_blank" rel="noopener noreferrer" style={{color:C.info,fontSize:12,textDecoration:"none"}}>{item.tipo==="video"?"▶ Ver":item.tipo==="archivo"?"↓ Abrir":"↗ Link"}</a>}
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
  useEffect(()=>{
    let mounted=true;
    const safeCargar=async()=>{if(mounted)await cargar();};
    safeCargar();
    // Realtime: mensajes en vivo (postgres_changes en mensajes de esta pub, scopeado
    // por RLS al par) + fallback de polling si el WebSocket no se puede crear.
    // Antes era polling cada 6s (no instantáneo).
    const topic=`realtime:espacio_${pubId}_${[miEmail,otroEmail].map(s=>(s||"").toLowerCase().replace(/[^a-z0-9]/g,"")).sort().join("_")}`;
    let ws,heartbeat,reconnectTimer,pollFallback,dead=false,retries=0;
    const token=session.access_token;
    const scheduleReconnect=()=>{if(dead)return;retries++;reconnectTimer=setTimeout(connect,Math.min(2000*retries,15000));};
    function connect(){
      if(dead||!token)return;
      try{
        ws=new WebSocket(`${sb.SUPABASE_URL.replace("https","wss")}/realtime/v1/websocket?apikey=${sb.SUPABASE_KEY}&vsn=1.0.0`);
        ws.onopen=()=>{
          retries=0;
          ws.send(JSON.stringify({topic,event:"phx_join",payload:{config:{postgres_changes:[{event:"INSERT",schema:"public",table:"mensajes",filter:`publicacion_id=eq.${pubId}`}]},access_token:token},ref:"1"}));
          heartbeat=setInterval(()=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({topic:"phoenix",event:"heartbeat",payload:{},ref:"hb"}));},25000);
        };
        ws.onmessage=(e)=>{try{const msg=JSON.parse(e.data);if(msg.event==="postgres_changes"){const rec=msg.payload?.data?.record;if(rec&&((rec.de_nombre===miEmail&&rec.para_nombre===otroEmail)||(rec.de_nombre===otroEmail&&rec.para_nombre===miEmail)))safeCargar();}}catch{}};
        ws.onclose=()=>{clearInterval(heartbeat);if(!dead)scheduleReconnect();};
        ws.onerror=()=>{try{ws.close();}catch{}};
      }catch{pollFallback=setInterval(safeCargar,8000);}
    }
    connect();
    return()=>{mounted=false;dead=true;clearInterval(heartbeat);clearTimeout(reconnectTimer);clearInterval(pollFallback);try{ws?.close();}catch{}};
  },[cargar,pubId,miEmail,otroEmail,session.access_token]);
  useEffect(()=>{if(bottomRef.current)bottomRef.current.scrollIntoView({behavior:"smooth"});},[msgs]);
  const enviar=async()=>{
    if(!texto.trim())return;
    const txt=texto.trim();
    const mod=moderarMensaje(txt);
    if(mod.advertencia){toast(mod.advertencia,mod.block?"error":"warn",5000);if(mod.block)return;}
    setSending(true);setTexto("");
    try{
      await sb.insertMensaje({publicacion_id:pubId,de_usuario:miId,para_usuario:null,de_nombre:miEmail,para_nombre:otroEmail,texto:txt,leido:false},session.access_token);
      await cargar();
    }catch(e){toast(e.message,"error");setTexto(txt);}finally{setSending(false);}
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
        <input value={texto} onChange={e=>setTexto(e.target.value)} aria-label="Escribí un mensaje" onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();enviar();}}} placeholder="Escribí un mensaje..." style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 13px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT}}/>
        <button onClick={enviar} disabled={sending||!texto.trim()} style={{background:C.accent,border:"none",borderRadius:10,color:"#fff",padding:"9px 16px",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:FONT,opacity:!texto.trim()||sending?0.45:1}}>→</button>
      </div>
    </div>
  );
}

// ─── CONTRA RESPONDEDOR — lado docente ante contraoferta del alumno ─────────────
function ContraRespondedor({oferta,session,onActualizado,onVer,onChat}){
  const [popup,setPopup]=useState(false);
  const [saving,setSaving]=useState(false);

  const cerrar=()=>{setPopup(false);};

  const aceptar=async()=>{
    setSaving(true);
    try{
      await sb.updateOfertaBusq(oferta.id,{estado:"aceptada",precio:oferta.contraoferta_precio,precio_tipo:oferta.contraoferta_tipo||oferta.precio_tipo,leida:true},session.access_token);
      // Crear publicación de clase con estado pendiente desde la oferta aceptada
      // (el espacio de clase se crea automaticamente al aceptar — ya existe EspacioClaseModal)
      // Solo marcar la búsqueda original como pendiente
      // Crear clase con estado pendiente al aceptar oferta
      if(oferta.busqueda_id){
        await sb.updatePublicacion(oferta.busqueda_id,{activo:false},session.access_token).catch(e=>console.warn("No se pudo desactivar busqueda:",e.message));
      }
      sb.insertNotificacion({usuario_id:null,alumno_email:oferta.busqueda_autor_email,tipo:"oferta_aceptada",publicacion_id:oferta.busqueda_id,pub_titulo:oferta.busqueda_titulo,leida:false},session.access_token).catch(()=>{});
      sb.insertNotificacion({usuario_id:null,alumno_email:oferta.busqueda_autor_email,tipo:"busqueda_acordada",publicacion_id:oferta.busqueda_id,pub_titulo:oferta.busqueda_titulo,leida:false},session.access_token).catch(()=>{});
      cerrar();onActualizado();
    }catch(e){toast(e.message,"error");}finally{setSaving(false);}
  };
  const rechazar=async()=>{
    setSaving(true);
    try{
      await sb.updateOfertaBusq(oferta.id,{estado:"rechazada",leida:true},session.access_token);
      cerrar();onActualizado();
    }catch(e){toast(e.message,"error");}finally{setSaving(false);}
  };

  return(
    <>
      <span role="button" tabIndex={0} aria-label="Ver oferta recibida" onClick={()=>{setPopup(true);if(onVer)onVer();}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setPopup(true);if(onVer)onVer();}}} style={{fontSize:10,fontWeight:700,color:C.accent,background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:20,padding:"3px 10px",cursor:"pointer",flexShrink:0,alignSelf:"center",whiteSpace:"nowrap"}}>
        Ver oferta recibida
      </span>

      {popup&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:FONT}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:"26px 28px",width:"min(420px,94vw)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{color:C.text,margin:0,fontSize:16,fontWeight:700}}>Oferta del alumno</h3>
              <button onClick={cerrar} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>×</button>
            </div>
            <div style={{background:C.card,borderRadius:10,padding:"10px 13px",marginBottom:14}}>
              <div style={{fontSize:12,color:C.muted,marginBottom:2}}>{oferta.busqueda_titulo||"Pedido"}</div>
              {oferta.contraoferta_precio
                ?<div style={{fontSize:16,color:C.accent,fontWeight:700}}>{fmtPrice(oferta.contraoferta_precio)} <span style={{fontSize:12,fontWeight:400,color:C.muted}}>/{oferta.contraoferta_tipo||oferta.precio_tipo}</span></div>
                :<div style={{fontSize:12,color:C.muted}}>Tu oferta: <span style={{color:C.accent,fontWeight:600}}>{oferta.precio?`${fmtPrice(oferta.precio)} /${oferta.precio_tipo}`:"sin precio definido"}</span></div>}
              {oferta.contraoferta_mensaje&&<p style={{color:C.muted,fontSize:12,margin:"6px 0 0",lineHeight:1.5}}>{oferta.contraoferta_mensaje}</p>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={aceptar} disabled={saving} style={{background:"#4ECB7122",border:"1px solid #4ECB7144",borderRadius:10,color:C.successText,padding:"11px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:FONT,opacity:saving?0.5:1}}>
                ✓ Aceptar y acordar
              </button>
              {onChat&&<button onClick={()=>{cerrar();onChat(oferta);}} style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:10,color:C.accent,padding:"11px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <MessageCircle size={14} strokeWidth={2}/> Negociar por chat
              </button>}
              <button onClick={rechazar} disabled={saving} style={{background:"#E05C5C15",border:"1px solid #E05C5C33",borderRadius:10,color:C.danger,padding:"11px",cursor:"pointer",fontSize:13,fontFamily:FONT,opacity:saving?0.5:1}}>
                ✗ Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── CLASES TAB ───────────────────────────────────────────────────────────────
function ClasesTab({session,misPubs}){
  const miEmail=session.user.email;
  const [clases,setClases]=useState([]);
  const [loading,setLoading]=useState(true);
  const [confirmando,setConfirmando]=useState(null);
  const [liberando,setLiberando]=useState(null);
  const [liberados,setLiberados]=useState({});// claseId → true
  const [showRegistrar,setShowRegistrar]=useState(false);
  const [regPubId,setRegPubId]=useState("");
  const [regAlumnoEmail,setRegAlumnoEmail]=useState("");
  const [regFecha,setRegFecha]=useState("");
  const [regDuracion,setRegDuracion]=useState("");
  const [regNotas,setRegNotas]=useState("");
  const [saving,setSaving]=useState(false);

  const misOfertas=(misPubs||[]).filter(p=>p.tipo==="oferta");

  const cargar=useCallback(async()=>{
    setLoading(true);
    try{
      const data=await sb.getClasesRealizadas(miEmail,session.access_token);
      setClases(data||[]);
    }catch{setClases([]);}finally{setLoading(false);}
  },[miEmail,session.access_token]);

  useEffect(()=>{cargar();},[cargar]);

  const confirmar=async(clase)=>{
    setConfirmando(clase.id);
    try{
      await sb.confirmarClase(clase.id,miEmail,session.access_token);
      await cargar();
      toast("Clase confirmada","success");
    }catch(e){toast("Error: "+e.message,"error");}finally{setConfirmando(null);}
  };

  const registrar=async()=>{
    if(!regAlumnoEmail.trim()||!regFecha){toast("Completá alumno y fecha","error");return;}
    setSaving(true);
    try{
      const soyDocente=misOfertas.length>0;
      const data={
        docente_email:soyDocente?miEmail:regAlumnoEmail.trim(),
        alumno_email:soyDocente?regAlumnoEmail.trim():miEmail,
        fecha_clase:regFecha,
        duracion_min:regDuracion?parseInt(regDuracion):null,
        notas:regNotas.trim()||null,
      };
      if(regPubId)data.publicacion_id=regPubId;
      await sb.insertClaseRealizada(data,session.access_token);
      setShowRegistrar(false);setRegAlumnoEmail("");setRegFecha("");setRegDuracion("");setRegNotas("");setRegPubId("");
      await cargar();
      toast("Clase registrada","success");
    }catch(e){toast("Error: "+e.message,"error");}finally{setSaving(false);}
  };

  const liberarPago=async(clase)=>{
    setLiberando(clase.id);
    try{
      await sb.liberarPagoClase(clase.id,session.access_token);
      setLiberados(prev=>({...prev,[clase.id]:true}));
      toast("Pago liberado al docente","success");
    }catch(e){toast("Error al liberar: "+e.message,"error");}finally{setLiberando(null);}
  };

  const iS={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:8};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div style={{...tx("body"),color:C.muted}}>Registrá y confirmá clases realizadas para habilitar reseñas verificadas.</div>
        {misOfertas.length>0&&(
          showRegistrar
            ?<button onClick={()=>setShowRegistrar(false)} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:22,border:`1.5px solid ${C.borderStrong||C.border}`,background:"transparent",color:C.textSoft||C.text,fontFamily:FONT,fontSize:13.5,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
            :<button onClick={()=>setShowRegistrar(true)} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 20px",borderRadius:22,border:"none",cursor:"pointer",fontFamily:FONT,fontSize:13.5,fontWeight:650,color:"#fff",background:accentFor("cursos").solid}}><span style={{fontSize:16,lineHeight:1}}>+</span>Registrar clase</button>
        )}
      </div>

      {showRegistrar&&(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:18,boxShadow:C.shadow}}>
          <div style={{...tx("cardTitle"),color:C.text,marginBottom:12}}>Registrar clase dada</div>
          {misOfertas.length>0&&(
            <div style={{marginBottom:8}}>
              <div style={{fontSize:12,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>Publicación (opcional)</div>
              <select value={regPubId} onChange={e=>setRegPubId(e.target.value)} aria-label="Publicación" style={{...iS,marginBottom:8}}>
                <option value="">— Sin publicación específica —</option>
                {misOfertas.map(p=><option key={p.id} value={p.id}>{p.titulo}</option>)}
              </select>
            </div>
          )}
          <div style={{fontSize:12,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>Email del alumno *</div>
          <input value={regAlumnoEmail} onChange={e=>setRegAlumnoEmail(e.target.value)} aria-label="Email del alumno" placeholder="alumno@email.com" style={iS}/>
          <div style={{fontSize:12,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>Fecha de la clase *</div>
          <input type="date" value={regFecha} onChange={e=>setRegFecha(e.target.value)} aria-label="Fecha de la clase" style={iS}/>
          <div style={{fontSize:12,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>Duración (min) — opcional</div>
          <input type="number" value={regDuracion} onChange={e=>setRegDuracion(e.target.value)} aria-label="Duración en minutos" placeholder="60" style={iS}/>
          <div style={{fontSize:12,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>Notas (opcional)</div>
          <textarea value={regNotas} onChange={e=>setRegNotas(e.target.value)} aria-label="Notas de la clase" placeholder="Temas vistos, observaciones..." rows={2} style={{...iS,resize:"vertical"}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={registrar} disabled={saving} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 20px",borderRadius:22,border:"none",cursor:"pointer",fontFamily:FONT,fontSize:13.5,fontWeight:650,color:"#fff",background:accentFor("cursos").solid,opacity:saving?0.6:1}}>{saving?"Guardando...":"Registrar"}</button>
            <button onClick={()=>setShowRegistrar(false)} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:22,border:`1.5px solid ${C.borderStrong||C.border}`,background:"transparent",color:C.textSoft||C.text,fontFamily:FONT,fontSize:13.5,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
          </div>
        </div>
      )}

      {loading?<Spinner/>:clases.length===0?(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"48px 24px",textAlign:"center",boxShadow:C.shadow}}>
          <div style={{width:52,height:52,borderRadius:14,background:accentFor("cursos").soft,color:accentFor("cursos").solid,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Clipboard size={26} strokeWidth={1.8}/></div>
          <div style={{...tx("cardTitle"),color:C.text,marginBottom:6}}>Sin clases registradas</div>
          <div style={{...tx("body"),color:C.muted,maxWidth:420,margin:"0 auto"}}>Registrá las clases que diste para que tus alumnos puedan confirmarte y dejarte reseñas verificadas.</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {clases.map(c=>{
            const soyDocente=c.docente_email===miEmail;
            const contraparte=soyDocente?c.alumno_email:c.docente_email;
            const yaConfirme=soyDocente?c.confirmado_docente:c.confirmado_alumno;
            const ambasConfirmaron=c.confirmado_docente&&c.confirmado_alumno;
            return(
              <div key={c.id} style={{background:C.surface,border:`1px solid ${ambasConfirmaron?C.success+"44":C.border}`,borderLeft:`3px solid ${ambasConfirmaron?C.success:accentFor("cursos").solid}`,borderRadius:14,padding:16,boxShadow:C.shadow}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{...tx("meta"),color:C.muted,marginBottom:4}}>
                      {soyDocente?"Alumno":"Docente"}: <span style={{color:C.text,fontWeight:600}}>{contraparte}</span>
                    </div>
                    {c.publicacion_id&&<div style={{fontSize:12,color:C.accent,marginBottom:4,display:"flex",alignItems:"center",gap:3}}><Bookmark size={11} strokeWidth={2}/>Publicación vinculada</div>}
                    <div style={{fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                      <Clock size={10} strokeWidth={2}/>{new Date(c.fecha_clase).toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})}
                      {c.duracion_min&&<span>· {c.duracion_min} min</span>}
                    </div>
                    {c.notas&&<div style={{fontSize:12,color:C.muted,marginTop:4,fontStyle:"italic"}}>{c.notas}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",flexShrink:0}}>
                    {ambasConfirmaron?(
                      <span style={{fontSize:11,background:"#4ECB7115",color:C.successText,border:"1px solid #4ECB7133",borderRadius:20,padding:"3px 10px",fontWeight:700}}>✓ Confirmada</span>
                    ):(
                      <span style={{fontSize:11,background:"#F59E0B12",color:"#B45309",border:"1px solid #F59E0B33",borderRadius:20,padding:"3px 10px",fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}><Clock size={10} strokeWidth={2}/>Pendiente confirmación</span>
                    )}
                    {!yaConfirme&&!ambasConfirmaron&&(
                      <button onClick={()=>confirmar(c)} disabled={confirmando===c.id}
                        style={{background:"#4ECB7115",border:"1px solid #4ECB7133",borderRadius:20,color:C.successText,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:FONT,opacity:confirmando===c.id?0.5:1}}>
                        {confirmando===c.id?"...":"✓ Confirmar que se realizó"}
                      </button>
                    )}
                    {ambasConfirmaron&&(
                      <span style={{fontSize:11,background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}33`,borderRadius:20,padding:"3px 10px",fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}><Star size={10} strokeWidth={2}/>Reseña habilitada</span>
                    )}
                    {ambasConfirmaron&&soyDocente&&!liberados[c.id]&&(
                      <button onClick={()=>liberarPago(c)} disabled={liberando===c.id}
                        style={{background:"#4ECB7115",border:"1px solid #4ECB7133",borderRadius:20,color:C.successText,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:FONT,opacity:liberando===c.id?0.5:1}}>
                        {liberando===c.id?"...":<span style={{display:"inline-flex",alignItems:"center",gap:3}}><Banknote size={10} strokeWidth={2}/>Liberar pago</span>}
                      </button>
                    )}
                    {ambasConfirmaron&&soyDocente&&liberados[c.id]&&(
                      <span style={{fontSize:11,color:C.successText,fontWeight:600}}>✓ Pago liberado</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MI CUENTA PAGE — perfil + credenciales + gestión de publicaciones ─────────
// ─── PAGOS TAB ────────────────────────────────────────────────────────────────
function PagosTab({session}){
  const [status,setStatus]=useState(null);
  const [loading,setLoading]=useState(true);
  const [disconnecting,setDisconnecting]=useState(false);
  const [cobros,setCobros]=useState([]);
  const [loadingCobros,setLoadingCobros]=useState(true);
  const [liquidaciones,setLiquidaciones]=useState([]);

  useEffect(()=>{
    if(!session?.user?.email)return;
    setLoadingCobros(true);
    Promise.all([
      sb.getPagosDocenteEscrow(session.user.email,session.access_token),
      sb.getLiquidaciones(session.user.email,session.access_token),
    ]).then(([p,l])=>{setCobros(p||[]);setLiquidaciones(l||[]);}).finally(()=>setLoadingCobros(false));
  },[session?.user?.email]);// eslint-disable-line

  const ESCROW_INFO={
    pendiente:{label:"Pendiente",color:"#F59E0B",bg:"#FEF3C720",Icon:Clock,desc:"La clase aún no fue marcada como finalizada"},
    retenido: {label:"En ventana",color:"#3B82F6",bg:"#EFF6FF",Icon:Lock,desc:"Clase finalizada — 72hs de disputa abiertas"},
    en_disputa:{label:"En disputa",color:"#EF4444",bg:"#FEF2F2",Icon:AlertTriangle,desc:"Disputa abierta — Luderis está revisando"},
    liberado:  {label:"Cobrado",color:"#10B981",bg:"#F0FDF4",Icon:CheckCircle2,desc:"Transferido a tu Mercado Pago"},
    reembolsado:{label:"Reembolsado",color:"#6B7280",bg:"#F9FAFB",Icon:RefreshCw,desc:"Reembolsado al alumno"},
  };

  const totalPendiente=cobros.filter(p=>p.estado_escrow==="pendiente"||p.estado_escrow==="retenido").reduce((a,p)=>a+Number(p.monto||0),0);
  const totalCobrado=cobros.filter(p=>p.estado_escrow==="liberado").reduce((a,p)=>a+Number(p.monto||0),0);
  const cargar=useCallback(async()=>{
    setLoading(true);
    try{
      const res=await fetch(`${sb.SUPABASE_URL}/functions/v1/mp-oauth`,{
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":sb.SUPABASE_KEY,"Authorization":`Bearer ${session.access_token}`},
        body:JSON.stringify({action:"status",user_id:session.user.id}),
      });
      setStatus(await res.json());
    }catch{setStatus({connected:false});}
    finally{setLoading(false);}
  },[session]);
  useEffect(()=>{cargar();},[cargar]);
  useEffect(()=>{
    const p=new URLSearchParams(window.location.search);
    const r=p.get("mp_connect");
    if(r==="success"){toast("Mercado Pago conectado correctamente","success");cargar();}
    if(r==="error"){toast("Error al conectar Mercado Pago. Intentá de nuevo.","error");}
    if(r){const u=new URL(window.location.href);u.searchParams.delete("mp_connect");window.history.replaceState({},"",u);}
  },[]);// eslint-disable-line
  const conectar=()=>window.open(`${sb.SUPABASE_URL}/functions/v1/mp-oauth?action=authorize&user_id=${session.user.id}&token=${encodeURIComponent(session.access_token)}`,"_self");
  const desconectar=async()=>{
    if(!window.confirm("¿Desconectar tu cuenta de Mercado Pago? Los pagos futuros usarán el sistema de Luderis."))return;
    setDisconnecting(true);
    try{
      await fetch(`${sb.SUPABASE_URL}/functions/v1/mp-oauth`,{
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":sb.SUPABASE_KEY,"Authorization":`Bearer ${session.access_token}`},
        body:JSON.stringify({action:"disconnect",user_id:session.user.id}),
      });
      toast("Cuenta de MP desconectada","info");
      setStatus({connected:false});
    }catch{toast("Error al desconectar","error");}
    finally{setDisconnecting(false);}
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:"linear-gradient(135deg,#009EE3,#007BBE)",borderRadius:18,padding:"24px 22px",color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{marginBottom:6}}><CreditCard size={22} color="#fff" strokeWidth={1.8}/></div>
          <div style={{fontWeight:800,fontSize:17,marginBottom:4}}>Mercado Pago Connect</div>
          <div style={{fontSize:13,opacity:.85,lineHeight:1.5}}>Conectá tu cuenta de MP para recibir los pagos de tus alumnos directamente en tu billetera.</div>
        </div>
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px 20px"}}>
        {loading?<div style={{textAlign:"center",padding:"20px 0"}}><Spinner/></div>:status?.connected?(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:"#2EC4A015",border:"2px solid #2EC4A0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Sparkles size={20} color="#2EC4A0" strokeWidth={1.8}/></div>
              <div>
                <div style={{fontWeight:700,color:C.text,fontSize:14}}>Cuenta conectada</div>
                {status.mp_email&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{status.mp_email}</div>}
                {status.connected_at&&<div style={{fontSize:11,color:C.muted,marginTop:1}}>Conectada el {new Date(status.connected_at).toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})}</div>}
              </div>
            </div>
            <div style={{background:"#2EC4A010",border:"1px solid #2EC4A040",borderRadius:10,padding:"12px 14px",fontSize:13,color:"#0F6E56",lineHeight:1.5,display:"flex",alignItems:"flex-start",gap:8}}><Sparkles size={14} strokeWidth={1.8} style={{flexShrink:0,marginTop:1}}/>Los pagos de tus alumnos van directo a tu cuenta de Mercado Pago.</div>
            <button onClick={desconectar} disabled={disconnecting} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.muted,padding:"9px 16px",fontSize:13,cursor:"pointer",fontFamily:FONT,alignSelf:"flex-start",opacity:disconnecting?.5:1}}>{disconnecting?"Desconectando…":"Desconectar cuenta"}</button>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:C.bg,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:C.muted}}><CreditCard size={20} strokeWidth={1.5}/></div>
              <div><div style={{fontWeight:700,color:C.text,fontSize:14}}>No conectado</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Los pagos se retienen en Luderis hasta conectar tu MP.</div></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[{n:1,t:"Conectás tu cuenta de Mercado Pago (1 click, seguro vía OAuth)"},{n:2,t:"El alumno paga al inscribirse o comprar un paquete"},{n:3,t:"La plata llega directamente a tu cuenta de MP al instante"}].map(s=>(
                <div key={s.n} style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:C.accentDim,color:C.accent,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{s.n}</div>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{s.t}</div>
                </div>
              ))}
            </div>
            <button onClick={conectar} style={{background:"#009EE3",border:"none",borderRadius:10,color:"#fff",padding:"13px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 4px 14px #009EE340"}}><CreditCard size={18} strokeWidth={1.8}/> Conectar Mercado Pago</button>
            <div style={{fontSize:11,color:C.muted,textAlign:"center",lineHeight:1.5}}>Luderis nunca accede a tu dinero ni a tus datos bancarios.</div>
          </div>
        )}
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px"}}>
        <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:10}}>¿Por qué conectar MP?</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[{Icon:Sparkles,t:"Cobro automático — 72hs después de finalizar la clase sin disputas"},{Icon:FileText,t:"100% seguro — OAuth oficial de Mercado Pago, sin contraseñas"},{Icon:BarChart2,t:"Vas a ver cada cobro en tu historial de MP directamente"},{Icon:GraduationCap,t:"Funciona para clases particulares, cursos y paquetes de clases"}].map((f,i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}><f.Icon size={16} strokeWidth={1.8} color={C.muted} style={{flexShrink:0,marginTop:1}}/><span style={{fontSize:13,color:C.muted,lineHeight:1.5}}>{f.t}</span></div>
          ))}
        </div>
      </div>

      {/* ── Dashboard de cobros ──────────────────────────────────────── */}
      <div>
        <div style={{...tx("cardTitle"),color:C.text,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><Banknote size={16} strokeWidth={1.9}/>Mis cobros</div>
        {/* Resumen */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
          <StatCard icon={Clock} label="Por recibir" value={`$${totalPendiente.toLocaleString("es-AR",{maximumFractionDigits:0})}`} accentKey="pedidos"/>
          <StatCard icon={CheckCircle2} label="Ya cobrado" value={`$${totalCobrado.toLocaleString("es-AR",{maximumFractionDigits:0})}`} accentKey="clases"/>
        </div>

        {/* Lista de cobros */}
        {loadingCobros?<div style={{textAlign:"center",padding:"16px 0"}}><Spinner/></div>:cobros.length===0?(
          <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"16px 0"}}>Todavía no tenés cobros registrados.</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {cobros.slice(0,10).map(p=>{
              const info=ESCROW_INFO[p.estado_escrow]||ESCROW_INFO.pendiente;
              const horasRestantes=p.estado_escrow==="retenido"&&p.clase_finalizada_at
                ?Math.max(0,72-Math.floor((Date.now()-new Date(p.clase_finalizada_at).getTime())/3600000))
                :null;
              return(
                <div key={p.id} style={{background:info.bg,border:`1px solid ${info.color}30`,borderRadius:10,padding:"11px 13px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flexShrink:0,display:"flex"}}><info.Icon size={18} color={info.color} strokeWidth={1.8}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8}}>
                      <span style={{fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.alumno_email}</span>
                      <span style={{fontWeight:700,color:C.text,fontSize:14,flexShrink:0}}>${Number(p.monto||0).toLocaleString("es-AR")}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                      <span style={{fontSize:11,fontWeight:600,color:info.color,background:info.bg,border:`1px solid ${info.color}40`,borderRadius:20,padding:"1px 8px"}}>{info.label}</span>
                      {horasRestantes!==null&&<span style={{fontSize:11,color:C.muted}}>{horasRestantes}hs para liberar</span>}
                      {p.estado_escrow==="liberado"&&p.liberado_at&&<span style={{fontSize:11,color:C.muted}}>el {new Date(p.liberado_at).toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Liquidaciones mensuales ──────────────────────────────────── */}
      {liquidaciones.length>0&&(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px"}}>
          <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:12,display:"flex",alignItems:"center",gap:6}}><FileText size={14} strokeWidth={1.8}/>Liquidaciones</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {liquidaciones.map(liq=>{
              const meses=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
              const [yr,mn]=liq.periodo.split("-").map(Number);
              const periodoLabel=`${meses[mn-1]} ${yr}`;
              return(
              <div key={liq.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.border}`}}>
                <div>
                  <div style={{fontWeight:600,color:C.text,fontSize:13}}>{periodoLabel}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{liq.cantidad_clases} clase{liq.cantidad_clases!==1?"s":""} · Comisión ${Number(liq.comision_luderis).toLocaleString("es-AR")}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,color:C.text,fontSize:14}}>${Number(liq.monto_neto).toLocaleString("es-AR")}</div>
                  {liq.pdf_url&&(
                    <button
                      onClick={async()=>{
                        const url=await sb.getLiquidacionSignedUrl(session?.user?.email,liq.periodo,session?.access_token);
                        if(url)window.open(url,"_blank","noopener");
                        else toast("No se pudo generar el link de descarga","error");
                      }}
                      style={{fontSize:11,color:C.accent,textDecoration:"none",background:"none",border:"none",cursor:"pointer",padding:0,marginTop:2}}
                    >⬇ Descargar PDF</button>
                  )}
                </div>
              </div>
            );})}

          </div>
          <p style={{fontSize:11,color:C.muted,margin:"12px 0 0",lineHeight:1.5}}>Usá estas liquidaciones como respaldo para emitir tu factura mensual a Luderis.</p>
        </div>
      )}
    </div>
  );
}
// ─── ALERTAS TAB ──────────────────────────────────────────────────────────────
// Sistema de alertas por email: el usuario define criterios con lenguaje natural
// y cuando se publica algo similar, recibe un email automático.
function BilleteraTab({session}){
  const esDocente=(localStorage.getItem("cl_rol_"+session.user.email)||"alumno")==="docente";
  const [saldo,setSaldo]=useState(null);
  const [movimientos,setMovimientos]=useState([]);
  const [loading,setLoading]=useState(true);
  const [monto,setMonto]=useState("");
  const [cargando,setCargando]=useState(false);
  // Retiros (solo docentes)
  const [retiros,setRetiros]=useState([]);
  const [showRetiroForm,setShowRetiroForm]=useState(false);
  const [retiroMonto,setRetiroMonto]=useState("");
  const [retiroCbu,setRetiroCbu]=useState("");
  const [retiroTitular,setRetiroTitular]=useState("");
  const [enviandoRetiro,setEnviandoRetiro]=useState(false);

  const cargar=useCallback(async()=>{
    try{
      const reqs=[
        sb.db(`billetera?usuario_id=eq.${session.user.id}&select=saldo`,
          "GET",null,session.access_token).then(r=>r?.[0]||{saldo:0}).catch(()=>({saldo:0})),
        sb.db(`billetera_movimientos?usuario_id=eq.${session.user.id}&order=created_at.desc&limit=20`,
          "GET",null,session.access_token).catch(()=>[]),
      ];
      if(esDocente) reqs.push(
        sb.db(`solicitudes_retiro?usuario_id=eq.${session.user.id}&order=created_at.desc&limit=10`,
          "GET",null,session.access_token).catch(()=>[])
      );
      const [bil,movs,retirosData]=await Promise.all(reqs);
      setSaldo(parseFloat(bil.saldo)||0);
      setMovimientos(movs||[]);
      if(esDocente) setRetiros(retirosData||[]);
    }catch{setSaldo(0);setMovimientos([]);}
    finally{setLoading(false);}
  },[session,esDocente]);

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

  const solicitarRetiro=async()=>{
    const n=parseFloat(retiroMonto);
    if(!n||n<500){toast("Monto mínimo de retiro: $500","error");return;}
    if(n>(saldo||0)){toast("No podés retirar más de tu saldo disponible","error");return;}
    if(!retiroCbu.trim()){toast("Ingresá tu CBU o alias","error");return;}
    if(!retiroTitular.trim()){toast("Ingresá el nombre del titular","error");return;}
    setEnviandoRetiro(true);
    try{
      const usrRows=await sb.db(`usuarios?email=eq.${encodeURIComponent(session.user.email)}&select=nombre,display_name`,"GET",null,session.access_token).catch(()=>[]);
      const usr=usrRows?.[0]||{};
      await sb.db("solicitudes_retiro","POST",{
        usuario_id:session.user.id,
        email:session.user.email,
        nombre:usr?.display_name||usr?.nombre||session.user.email.split("@")[0],
        monto:n,
        cbu_alias:retiroCbu.trim(),
        titular:retiroTitular.trim(),
        estado:"pendiente",
      },session.access_token);
      await sb.insertNotificacion({
        alumno_email:session.user.email,
        tipo:"retiro_solicitado",
        pub_titulo:"Solicitud de retiro recibida. Tu saldo será acreditado en 24 a 48 horas hábiles.",
        leida:false,
      },session.access_token);
      toast("✓ Solicitud enviada. Acreditamos en 24–48 hs hábiles.","success");
      setRetiroMonto(""); setRetiroCbu(""); setRetiroTitular(""); setShowRetiroForm(false);
      cargar();
    }catch(e){toast("Error: "+e.message,"error");}
    finally{setEnviandoRetiro(false);}
  };

  const ESTADO_RETIRO={pendiente:{label:"Pendiente",color:"#F59E0B"},procesado:{label:"Acreditado",color:"#10B981"},rechazado:{label:"Rechazado",color:"#EF4444"}};
  const TIPO_ICONS={recarga:ArrowUp,pago:ArrowDown,reembolso:RefreshCw,bono:Gift};
  const TIPO_LABELS={recarga:"Recarga",pago:"Pago de clase",reembolso:"Reembolso",bono:"Bono"};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Saldo actual */}
      <div style={{background:accentFor("cursos").heroGrad,borderRadius:18,padding:"24px 22px",color:"#fff",position:"relative",overflow:"hidden",boxShadow:C.shadow}}>
        <div style={{position:"absolute",top:-20,right:-20,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.08)"}}/>
        <div style={{...tx("micro"),fontWeight:700,letterSpacing:.8,opacity:.8,marginBottom:8}}>SALDO DISPONIBLE</div>
        {loading
          ?<div style={{...tx("display"),fontSize:36,color:"#fff"}}>…</div>
          :<div style={{...tx("display"),fontSize:42,color:"#fff",lineHeight:1}}>${(saldo||0).toLocaleString("es-AR",{maximumFractionDigits:0})}</div>
        }
        <div style={{...tx("meta"),opacity:.7,marginTop:6}}>Créditos Luderis · ARS</div>
      </div>

      {/* Cargar saldo */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:18,boxShadow:C.shadow}}>
        <div style={{...tx("cardTitle"),color:C.text,marginBottom:12}}>Cargar saldo</div>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          {[500,1000,2000,5000].map(n=>(
            <button key={n} onClick={()=>setMonto(String(n))}
              style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${monto===String(n)?C.accent:C.border}`,background:monto===String(n)?C.accentDim:C.bg,color:monto===String(n)?C.accent:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT}}>
              ${n.toLocaleString("es-AR")}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={monto} onChange={e=>setMonto(e.target.value)} type="number" min="100" aria-label="Monto a cargar" placeholder="Otro monto (mín. $100)"
            style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:14,outline:"none",fontFamily:FONT}}/>
          <button onClick={cargarSaldo} disabled={cargando||!monto}
            style={{background:C.accent,border:"none",borderRadius:9,color:"#fff",padding:"9px 18px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,opacity:(!monto||cargando)?.5:1}}>
            {cargando?"…":"Cargar"}
          </button>
        </div>
        <div style={{fontSize:11,color:C.muted,marginTop:8}}>Pagá con Mercado Pago · Los créditos se acreditan al instante</div>
      </div>

      {/* Solicitar retiro — solo docentes */}
      {esDocente&&(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showRetiroForm?12:0}}>
            <div>
              <div style={{fontWeight:700,color:C.text,fontSize:14}}>Solicitar retiro</div>
              {!showRetiroForm&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>Transferimos a tu CBU en 24–48 hs hábiles</div>}
            </div>
            <button onClick={()=>setShowRetiroForm(v=>!v)}
              style={{background:showRetiroForm?C.bg:C.accent,border:`1px solid ${showRetiroForm?C.border:"transparent"}`,borderRadius:9,color:showRetiroForm?C.muted:"#fff",padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT}}>
              {showRetiroForm?"Cancelar":"Retirar fondos"}
            </button>
          </div>
          {showRetiroForm&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>MONTO A RETIRAR</div>
                  <input value={retiroMonto} onChange={e=>setRetiroMonto(e.target.value)} type="number" min="500" aria-label="Monto a retirar" placeholder={`Máx. $${(saldo||0).toLocaleString("es-AR")}`}
                    style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:14,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                </div>
              </div>
              <div>
                <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>CBU O ALIAS</div>
                <input value={retiroCbu} onChange={e=>setRetiroCbu(e.target.value)} aria-label="CBU o alias" placeholder="22-digit CBU o alias de tu cuenta"
                  style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:14,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>TITULAR DE LA CUENTA</div>
                <input value={retiroTitular} onChange={e=>setRetiroTitular(e.target.value)} aria-label="Titular de la cuenta" placeholder="Nombre completo del titular"
                  style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:14,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
              </div>
              <button onClick={solicitarRetiro} disabled={enviandoRetiro||!retiroMonto||!retiroCbu||!retiroTitular}
                style={{background:C.accent,border:"none",borderRadius:9,color:"#fff",padding:"10px 18px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,opacity:(enviandoRetiro||!retiroMonto||!retiroCbu||!retiroTitular)?.5:1}}>
                {enviandoRetiro?"Enviando…":"Confirmar solicitud de retiro"}
              </button>
              <div style={{fontSize:11,color:C.muted}}>Al confirmar, Luderis procesará la transferencia a tu cuenta bancaria en 24–48 horas hábiles.</div>
            </div>
          )}
          {/* Historial de retiros */}
          {retiros.length>0&&(
            <div style={{marginTop:showRetiroForm?16:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>SOLICITUDES ANTERIORES</div>
              {retiros.map((r,i)=>(
                <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:`1px solid ${C.border}`}}>
                  <div>
                    <div style={{fontSize:13,color:C.text,fontWeight:500}}>${Number(r.monto).toLocaleString("es-AR")} → {r.cbu_alias}</div>
                    <div style={{fontSize:11,color:C.muted}}>{new Date(r.created_at).toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"})}</div>
                  </div>
                  <div style={{fontSize:11,padding:"2px 10px",borderRadius:20,background:`${ESTADO_RETIRO[r.estado]?.color}18`,color:ESTADO_RETIRO[r.estado]?.color,fontWeight:700}}>
                    {ESTADO_RETIRO[r.estado]?.label||r.estado}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Movimientos */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:18,boxShadow:C.shadow}}>
        <div style={{...tx("cardTitle"),color:C.text,marginBottom:12}}>Historial</div>
        {loading?<Spinner small/>:movimientos.length===0
          ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"12px 0"}}>Sin movimientos aún.</div>
          :movimientos.map((m,i)=>{
            const esIngreso=m.tipo==="recarga"||m.tipo==="reembolso"||m.tipo==="bono";
            return(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<movimientos.length-1?`1px solid ${C.border}`:"none"}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  {(()=>{const TIcon=TIPO_ICONS[m.tipo]||CreditCard;return<div style={{display:"flex",alignItems:"center",justifyContent:"center",width:32,height:32,borderRadius:8,background:esIngreso?C.success+"18":C.danger+"12",flexShrink:0}}><TIcon size={16} color={esIngreso?C.success:C.danger} strokeWidth={2}/></div>;})()}
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
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`,"_blank","noopener,noreferrer");
  };

  const completados=referidos.filter(r=>r.estado==="completado").length;
  const pendientes=referidos.filter(r=>r.estado==="pendiente").length;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* Hero degradado (estilo prototipo) — modelo real: reputación + acceso prioritario */}
      <div style={{background:accentFor("cursos").heroGrad,borderRadius:18,padding:"24px 26px",boxShadow:C.shadow}}>
        <h2 style={{...tx("h1"),color:"#fff",margin:0}}>Invitá a tus amigos a Luderis</h2>
        <p style={{...tx("body"),color:"rgba(255,255,255,.9)",margin:"6px 0 18px",maxWidth:560}}>Tu amigo obtiene <strong style={{color:"#fff"}}>acceso prioritario</strong> a docentes verificados y vos sumás <strong style={{color:"#fff"}}>puntos de reputación</strong> por cada referido que completa su primera clase.</p>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200,display:"flex",alignItems:"center",gap:8,background:C.surface,borderRadius:11,padding:"10px 14px"}}>
            <Globe size={15} color={C.muted} style={{flexShrink:0}}/>
            <span style={{...tx("meta"),color:C.text,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{refUrl}</span>
          </div>
          <button onClick={copiar}
            style={{display:"inline-flex",alignItems:"center",gap:7,background:"#fff",border:"none",borderRadius:11,color:accentFor("cursos").text,padding:"11px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT,flexShrink:0}}>
            {copiado?<><CheckCircle2 size={15} strokeWidth={2.5}/>Copiado</>:<><Bookmark size={15} strokeWidth={2}/>Copiar link</>}
          </button>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
          {[
            {el:"button",label:"WhatsApp",Icon:MessageCircle,onClick:compartirWhatsApp},
            {el:"a",label:"Telegram",Icon:Send,href:`https://t.me/share/url?url=${encodeURIComponent(refUrl)}&text=${encodeURIComponent("¡Sumate a Luderis! La plataforma para aprender y enseñar en Argentina")}`},
            {el:"a",label:"Email",Icon:Mail,href:`mailto:?subject=${encodeURIComponent("Te invito a Luderis")}&body=${encodeURIComponent("¡Hola! Te invito a Luderis. Registrate con mi link: "+refUrl)}`},
          ].map(({el,label,Icon:SI,onClick,href})=>{
            const st={display:"inline-flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:20,background:"rgba(255,255,255,.18)",border:"1px solid rgba(255,255,255,.3)",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:FONT,textDecoration:"none"};
            return el==="a"
              ?<a key={label} href={href} target="_blank" rel="noreferrer" style={st}><SI size={14} strokeWidth={2}/>{label}</a>
              :<button key={label} onClick={onClick} style={st}><SI size={14} strokeWidth={2}/>{label}</button>;
          })}
        </div>
      </div>

      {/* StatCards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
        <StatCard icon={Users} label="Invitados" value={referidos.length} accentKey="cursos"/>
        <StatCard icon={CheckCircle2} label="Completados" value={completados} accentKey="clases"/>
        <StatCard icon={Clock} label="Pendientes" value={pendientes} accentKey="pedidos"/>
      </div>

      {/* Tus invitados */}
      <div>
        <SubHead icon={Users} title="Tus invitados"/>
        {loadingRef?<Spinner/>:
          referidos.length===0?(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"40px 24px",textAlign:"center",boxShadow:C.shadow}}>
              <div style={{...tx("body"),color:C.muted}}>Todavía no invitaste a nadie. ¡Compartí tu link!</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {referidos.map((r,i)=>{
                const completado=r.estado==="completado";
                return(
                <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 16px",boxShadow:C.shadow,display:"flex",alignItems:"center",gap:12}}>
                  <Avatar letra={(r.referido_email||"U")[0]} size={36}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{...tx("bodyStrong"),color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.referido_email||"Usuario"}</div>
                    {r.created_at&&<div style={{...tx("micro"),color:C.muted}}>{fmtRel(r.created_at)}</div>}
                  </div>
                  <span style={{...tx("micro"),fontWeight:700,padding:"3px 10px",borderRadius:20,display:"inline-flex",alignItems:"center",gap:4,flexShrink:0,
                    background:completado?C.success+"18":C.warn+"18",color:completado?C.successText:"#B45309",border:`1px solid ${completado?C.success+"33":"#F59E0B33"}`}}>
                    {completado?<><CheckCircle2 size={11} strokeWidth={2.5}/>Completado</>:<><Clock size={11} strokeWidth={2}/>Pendiente</>}
                  </span>
                </div>
                );
              })}
            </div>
          )
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
      toast("Alerta creada. Te avisaremos cuando aparezca algo similar","success",4000);
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
      {/* Header card (estilo prototipo) */}
      <div style={{background:accentFor("cursos").soft,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 18px",marginBottom:14,display:"flex",alignItems:"flex-start",gap:12}}>
        <div style={{width:40,height:40,borderRadius:11,background:C.surface,color:accentFor("cursos").solid,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Bell size={20} strokeWidth={2}/></div>
        <div>
          <div style={{...tx("cardTitle"),color:C.text}}>Alertas de publicaciones</div>
          <div style={{...tx("meta"),color:C.muted,marginTop:2,lineHeight:1.5}}>Te avisamos por email cuando aparezca una clase o pedido que coincida con tus criterios.</div>
        </div>
      </div>
      {/* Nueva alerta */}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        {showForm
          ?<button onClick={()=>{setShowForm(false);setDesc("");}} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:22,border:`1.5px solid ${C.borderStrong||C.border}`,background:"transparent",color:C.textSoft||C.text,fontFamily:FONT,fontSize:13.5,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
          :<button onClick={()=>setShowForm(true)} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 20px",borderRadius:22,border:"none",cursor:"pointer",fontFamily:FONT,fontSize:13.5,fontWeight:650,color:"#fff",background:accentFor("cursos").solid}}><span style={{fontSize:16,lineHeight:1}}>+</span>Nueva alerta</button>}
      </div>

      {/* Formulario nueva alerta */}
      {showForm&&(
        <div style={{background:C.surface,border:`1px solid ${C.accent}33`,borderRadius:14,padding:"18px 20px",marginBottom:20,animation:"fadeUp .15s ease"}}>
          <div style={{fontWeight:600,color:C.text,fontSize:14,marginBottom:10}}>¿Qué tipo de publicación buscás?</div>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)}
            aria-label="Descripción de lo que buscás"
            placeholder="Ej: Clases de guitarra online para principiantes, profesor con experiencia en rock..."
            rows={3}
            style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",fontFamily:FONT,boxSizing:"border-box",resize:"vertical",marginBottom:12}}/>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:6}}>¿Qué tipo de publicaciones querés monitorear?</div>
            <div style={{display:"flex",gap:6}}>
              {[["ambos","Ambas",Bell],["oferta","Clases/Cursos",GraduationCap],["busqueda","Pedidos",Bookmark]].map(([v,l,TIcon])=>(
                <button key={v} onClick={()=>setTipoAlerta(v)}
                  style={{padding:"6px 14px",borderRadius:20,fontSize:12,cursor:"pointer",fontFamily:FONT,
                    background:tipoAlerta===v?(v==="oferta"?C.accent:v==="busqueda"?"#F59E0B":LUD.grad):C.bg,
                    color:tipoAlerta===v?"#fff":C.muted,
                    border:`1px solid ${tipoAlerta===v?(v==="oferta"?C.accent:v==="busqueda"?"#F59E0B":C.accent):C.border}`,
                    fontWeight:tipoAlerta===v?700:400,transition:"all .12s",display:"flex",alignItems:"center",gap:4}}>
                  <TIcon size={11} strokeWidth={2}/>{l}
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
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"48px 24px",textAlign:"center",boxShadow:C.shadow}}>
          <div style={{width:52,height:52,borderRadius:14,background:accentFor("cursos").soft,color:accentFor("cursos").solid,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Bell size={26} strokeWidth={1.8}/></div>
          <div style={{...tx("cardTitle"),color:C.text,marginBottom:6}}>Sin alertas activas</div>
          <div style={{...tx("body"),color:C.muted,maxWidth:420,margin:"0 auto 20px"}}>Creá una alerta y te avisamos cuando aparezca algo que te interese.</div>
          <button onClick={()=>setShowForm(true)}
            style={{display:"inline-flex",alignItems:"center",gap:7,padding:"10px 22px",borderRadius:22,border:"none",cursor:"pointer",fontFamily:FONT,fontSize:13.5,fontWeight:650,color:"#fff",background:accentFor("cursos").solid}}>
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
                  {a.tipo_alerta==="oferta"?<GraduationCap size={18} strokeWidth={1.8}/>:a.tipo_alerta==="busqueda"?<Bookmark size={18} strokeWidth={1.8}/>:<Bell size={18} strokeWidth={1.8}/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,color:C.text,fontSize:14,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {criterios.resumen||a.descripcion}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                    {criterios.materia&&<span style={{fontSize:11,background:C.accentDim,color:C.accent,borderRadius:20,padding:"2px 9px",fontWeight:600}}>{criterios.materia}</span>}
                    {criterios.tipo&&criterios.tipo!=="cualquiera"&&<span style={{fontSize:11,background:C.bg,color:C.muted,borderRadius:20,padding:"2px 9px",border:`1px solid ${C.border}`}}>{criterios.tipo==="oferta"?"Clases":"Pedidos"}</span>}
                    {criterios.modalidad&&criterios.modalidad!=="cualquiera"&&<span style={{fontSize:11,background:C.bg,color:C.muted,borderRadius:20,padding:"2px 9px",border:`1px solid ${C.border}`,display:"inline-flex",alignItems:"center",gap:3}}>{criterios.modalidad==="virtual"?<><Globe size={9} strokeWidth={2}/>Virtual</>:<><MapPin size={9} strokeWidth={2}/>Presencial</>}</span>}
                    {(criterios.palabras_clave||[]).slice(0,3).map(p=>(
                      <span key={p} style={{fontSize:11,background:C.bg,color:C.muted,borderRadius:20,padding:"2px 9px",border:`1px solid ${C.border}`}}>{p}</span>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:C.muted}}>Creada {fmtRel(a.created_at)}</div>
                </div>
                <div style={{display:"flex",gap:10,flexShrink:0,alignItems:"center"}}>
                  {/* Toggle activa/pausada */}
                  <button onClick={()=>toggleActiva(a)} role="switch" aria-checked={a.activa} aria-label={a.activa?"Pausar alerta":"Activar alerta"} title={a.activa?"Activa":"Pausada"}
                    style={{width:44,height:25,borderRadius:13,border:"none",cursor:"pointer",background:a.activa?accentFor("cursos").solid:C.borderStrong||C.border,position:"relative",flexShrink:0,transition:"background .16s"}}>
                    <span style={{position:"absolute",top:3,left:a.activa?22:3,width:19,height:19,borderRadius:"50%",background:"#fff",transition:"left .16s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/>
                  </button>
                  <button onClick={()=>eliminar(a.id)} aria-label="Eliminar alerta" title="Eliminar"
                    style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .12s"}}
                    onMouseEnter={e=>{e.currentTarget.style.color=C.danger;e.currentTarget.style.borderColor=C.danger;}} onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border;}}><Trash2 size={15}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── FINANZAS TAB ─────────────────────────────────────────────────────────────
function FinanzasTab({session}){
  const email=session.user.email;
  const rolLocal=localStorage.getItem("cl_rol_"+email)||"alumno";
  const esDocente=rolLocal==="docente";
  const [sub,setSub]=useState(esDocente?"cobros":"billetera");
  const subs=[
    ...(esDocente?[{id:"cobros",label:"Cobros MP"}]:[]),
    {id:"billetera",label:"Billetera"},
  ];
  return(
    <div>
      {subs.length>1&&(
        <div style={{display:"inline-flex",gap:2,marginBottom:16,background:C.surfaceAlt||C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:3}}>
          {subs.map(t=>(
            <button key={t.id} onClick={()=>setSub(t.id)}
              style={{padding:"8px 18px",borderRadius:8,border:"none",fontWeight:sub===t.id?700:500,
                fontSize:12.5,cursor:"pointer",fontFamily:FONT,transition:"all .14s",
                background:sub===t.id?C.surface:"transparent",
                color:sub===t.id?accentFor("cursos").text:C.muted,
                boxShadow:sub===t.id?C.shadow:"none"}}>
              {t.label}
            </button>
          ))}
        </div>
      )}
      {sub==="cobros"&&<PagosTab session={session}/>}
      {sub==="billetera"&&<BilleteraTab session={session}/>}
    </div>
  );
}

// ─── AJUSTES TAB ──────────────────────────────────────────────────────────────
function AjustesTab({session,nombre,displayName,bio,ubicacion,tituloProf,avatarUrl,currentColor,onEditPerfil}){
  const [confirmDelete,setConfirmDelete]=useState(false);
  const [deleteText,setDeleteText]=useState("");
  const nombreShow=displayName||nombre||session.user.email.split("@")[0];
  const subtitleParts=[tituloProf,ubicacion].filter(Boolean);
  const cambiarPass=async()=>{try{await sb.resetPassword(session.user.email);toast("Te enviamos un email para cambiar tu contraseña","success",4000);}catch(e){toast("Error: "+e.message,"error");}};
  const iS={background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box",width:"100%"};
  const memberSince=session.user.created_at
    ?new Date(session.user.created_at).toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})
    :"—";
  const Row=({label,value,last})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,padding:"11px 0",borderBottom:last?"none":`1px solid ${C.hairline||C.border}`}}>
      <span style={{...tx("meta"),color:C.muted,fontWeight:500}}>{label}</span>
      <span style={{...tx("meta"),color:C.text,fontWeight:600,textAlign:"right"}}>{value}</span>
    </div>
  );
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Datos personales */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 22px",boxShadow:C.shadow}}>
        <div style={{...tx("cardTitle"),color:C.text,marginBottom:14}}>Datos personales</div>
        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <div style={{width:52,height:52,borderRadius:"50%",overflow:"hidden",flexShrink:0}}>
            {avatarUrl&&avatarUrl.startsWith("https://")
              // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
              ?<img src={avatarUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>
              :<div style={{width:"100%",height:"100%",background:currentColor||accentFor("cursos").solid,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:22,color:"#fff",fontFamily:FONT}}>{(nombreShow[0]||"U").toUpperCase()}</div>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{...tx("bodyStrong"),color:C.text}}>{nombreShow}</div>
            {subtitleParts.length>0&&<div style={{...tx("meta"),color:C.muted,marginTop:2}}>{subtitleParts.join(" · ")}</div>}
          </div>
          {onEditPerfil&&<button onClick={onEditPerfil}
            style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:22,border:`1.5px solid ${C.borderStrong||C.border}`,background:"transparent",color:C.textSoft||C.text,fontFamily:FONT,fontSize:13.5,fontWeight:600,cursor:"pointer",flexShrink:0}}>
            <Camera size={15}/>Editar
          </button>}
        </div>
        {bio&&<p style={{...tx("body"),color:C.textSoft||C.muted,margin:"12px 0 0",lineHeight:1.6}}>{bio}</p>}
      </div>

      {/* Cuenta */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 22px",boxShadow:C.shadow}}>
        <div style={{...tx("cardTitle"),color:C.text,marginBottom:14}}>Información de cuenta</div>
        <div>
          <Row label="Email" value={session.user.email}/>
          <Row label="Miembro desde" value={memberSince}/>
          <Row label="Plan" value="Gratuito"/>
          <Row label="ID de usuario" value={<span style={{fontSize:11,fontFamily:"monospace",color:C.muted}}>{session.user.id.slice(0,18)}…</span>} last/>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:16}}>
          <button onClick={cambiarPass}
            style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.textSoft||C.text,fontFamily:FONT,fontSize:13,fontWeight:600,cursor:"pointer"}}>
            <MessageCircle size={15}/>Cambiar contraseña
          </button>
          <button onClick={()=>toast("Estamos preparando la descarga de tus datos. Te la enviamos por email.","info",4000)}
            style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.textSoft||C.text,fontFamily:FONT,fontSize:13,fontWeight:600,cursor:"pointer"}}>
            <Bookmark size={15}/>Descargar mis datos
          </button>
        </div>
      </div>

      {/* Notificaciones */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 22px",boxShadow:C.shadow}}>
        <div style={{...tx("cardTitle"),color:C.text,marginBottom:4}}>Notificaciones</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14,lineHeight:1.6}}>Recibís notificaciones dentro de la app y por email para ofertas, mensajes y actualizaciones importantes.</div>
        <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"flex-start",gap:10}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>Las preferencias de notificación se gestionan desde el panel de notificaciones. Para desuscribirse de emails, respondé cualquier email de Luderis con "Desuscribir".</div>
        </div>
      </div>

      {/* Privacidad y legales */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 22px",boxShadow:C.shadow}}>
        <div style={{...tx("cardTitle"),color:C.text,marginBottom:14}}>Privacidad y legales</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {[["Política de privacidad","/privacidad"],["Términos y condiciones","/terminos"],["Política de devoluciones","/devoluciones"],["Libro de quejas","/quejas"],["Accesibilidad","/accesibilidad"]].map(([label,href])=>(
            <a key={href} href={href}
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:C.bg,borderRadius:10,color:C.text,textDecoration:"none",fontSize:13,cursor:"pointer",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.accentDim}
              onMouseLeave={e=>e.currentTarget.style.background=C.bg}>
              {label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          ))}
        </div>
      </div>

      {/* Zona de peligro */}
      <div style={{background:C.surface,border:`1px solid ${C.danger}33`,borderRadius:16,padding:"20px 22px",boxShadow:C.shadow}}>
        <div style={{...tx("cardTitle"),color:C.danger,marginBottom:4}}>Zona de peligro</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14,lineHeight:1.6}}>Eliminar tu cuenta borrará permanentemente tu perfil, publicaciones y datos. Esta acción no se puede deshacer.</div>
        {!confirmDelete?(
          <button onClick={()=>setConfirmDelete(true)}
            style={{background:"transparent",border:`1px solid ${C.danger}`,borderRadius:20,color:C.danger,padding:"8px 20px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:FONT,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.danger;e.currentTarget.style.color="#fff";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.danger;}}>
            Eliminar mi cuenta
          </button>
        ):(
          <div style={{background:"#EF444410",border:"1px solid #EF444430",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontSize:13,color:C.text,marginBottom:10}}>Escribí <strong>ELIMINAR</strong> para confirmar:</div>
            <input value={deleteText} onChange={e=>setDeleteText(e.target.value)} aria-label="Escribí ELIMINAR para confirmar" placeholder="ELIMINAR"
              style={{...iS,marginBottom:10,borderColor:deleteText==="ELIMINAR"?C.danger:C.border}}/>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={()=>{setConfirmDelete(false);setDeleteText("");}}
                style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"8px 16px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>
                Cancelar
              </button>
              <button disabled={deleteText!=="ELIMINAR"}
                onClick={()=>window.open("/quejas","_self")}
                style={{background:deleteText==="ELIMINAR"?C.danger:"#EF444440",border:"none",borderRadius:20,color:"#fff",padding:"8px 20px",cursor:deleteText==="ELIMINAR"?"pointer":"not-allowed",fontSize:13,fontWeight:700,fontFamily:FONT,opacity:deleteText==="ELIMINAR"?1:0.6,transition:"all .15s"}}>
                Solicitar eliminación →
              </button>
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:8}}>Se abrirá el formulario de quejas para enviar tu solicitud a nuestro equipo.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiCuentaPage({session,onOpenDetail,onOpenCurso,onEdit,onNew,onOpenChat,onRefreshOfertas,onClearBadge,onStartOnboarding}){
  const {resetCuentaBadge}=useAppActions();
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
  const [docTipo,setDocTipo]=useState("titulo");const [docTitulo,setDocTitulo]=useState("");const [docInst,setDocInst]=useState("");const [docAño,setDocAño]=useState("");const [docDesc,setDocDesc]=useState("");const [docUrl,setDocUrl]=useState("");const [docPais,setDocPais]=useState("");const [savingDoc,setSavingDoc]=useState(false);
  // Perfil edición
  const [editingPerfil,setEditingPerfil]=useState(false);
  const [displayName,setDisplayName]=useState(()=>{try{return localStorage.getItem("dn_"+session.user.email)||"";}catch{return "";}});
  const [bio,setBio]=useState("");
  const [ubicacionPerfil,setUbicacionPerfil]=useState("");
  const [videoPresentacion,setVideoPresentacion]=useState("");
  const [avatarUrl,setAvatarUrl]=useState("");
  const [avatarFile,setAvatarFile]=useState(null);
  const [avatarPreview,setAvatarPreview]=useState(null);
  const avatarInputRef=useRef(null);
  const [bannerUrl,setBannerUrl]=useState("");
  const [bannerUploading,setBannerUploading]=useState(false);
  const bannerInputRef=useRef(null);
  const [savingDisplayName,setSavingDisplayName]=useState(false);
  const [perfilLoaded,setPerfilLoaded]=useState(false);
  // Docente extra fields
  const [tituloProfesional,setTituloProfesional]=useState("");
  const [aniosExperiencia,setAniosExperiencia]=useState("");
  const [metodologia,setMetodologia]=useState("");
  const [franjaHoraria,setFranjaHoraria]=useState("");
  const [idiomas,setIdiomas]=useState([]);
  // Disponibilidad ahora
  const [disponibleAhora,setDisponibleAhora]=useState(false);
  const [disponibleMensaje,setDisponibleMensaje]=useState("");
  const [disponibleDuracion,setDisponibleDuracion]=useState("4h");
  // Cargar bio, ubicacion y avatar desde la tabla usuarios al montar
  useEffect(()=>{
    if(perfilLoaded)return;
    sb.getUsuarioByIdFull(session.user.id,session.access_token).then(u=>{
      if(u){
        if(u.bio)setBio(u.bio);
        if(u.ubicacion)setUbicacionPerfil(u.ubicacion);
        if(u.avatar_url)setAvatarUrl(u.avatar_url);
        if(u.banner_url)setBannerUrl(u.banner_url);
        if(u.video_presentacion)setVideoPresentacion(u.video_presentacion);
        if(u.titulo_profesional)setTituloProfesional(u.titulo_profesional);
        if(u.anios_experiencia!=null)setAniosExperiencia(String(u.anios_experiencia));
        if(u.metodologia)setMetodologia(u.metodologia);
        if(u.franja_horaria)setFranjaHoraria(u.franja_horaria);
        if(u.idiomas)setIdiomas(u.idiomas||[]);
        // Disponibilidad: verificar si sigue vigente
        const dispActiva=u.disponible_ahora&&u.disponible_hasta&&new Date(u.disponible_hasta)>new Date();
        setDisponibleAhora(!!dispActiva);
        if(u.disponible_mensaje)setDisponibleMensaje(u.disponible_mensaje);
      }
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
  const toggle=async(post)=>{if(post.activo===false&&post.estado_validacion==="pendiente")return;setToggling(post.id);try{await sb.updatePublicacion(post.id,{activo:post.activo===false},session.access_token);await cargar();}catch(e){toast("Error: "+e.message,"error");}finally{setToggling(null);}};
  const remove=async(post)=>{await sb.deletePublicacion(post.id,session.access_token);cargar();};
  const addDoc=async()=>{
    if(!docTitulo.trim())return;setSavingDoc(true);
    try{
      await sb.insertDocumento({usuario_id:session.user.id,usuario_email:email,tipo:docTipo,titulo:docTitulo.trim(),institucion:docInst.trim()||null,año:docAño.trim()||null,descripcion:docDesc.trim()||null,url_verificacion:docUrl.trim()||null,pais:docPais.trim()||null},session.access_token);
      setDocTitulo("");setDocInst("");setDocAño("");setDocDesc("");setShowAddDoc(false);await cargar();
    }catch(e){toast("Error: "+e.message,"error");}finally{setSavingDoc(false);}
  };
  const removeDoc=async(id)=>{try{await sb.deleteDocumento(id,session.access_token);await cargar();}catch(e){toast(e.message,"error");}};
  const saveColor=(c)=>{localStorage.setItem("avatarColor_"+email,c);setAvatarColor2(c);};
  const TIPOS_DOC=[{v:"titulo",l:"Título"},{v:"certificado",l:"Certificado"},{v:"experiencia",l:"Experiencia"},{v:"otro",l:"Otro"}];
  const TIPO_ICON={titulo:GraduationCap,certificado:ScrollText,experiencia:Briefcase,otro:FileText};
  const ofertas=pubs.filter(p=>p.tipo==="oferta");
  const [tabCuenta,setTabCuenta]=useState(()=>{try{const p=new URLSearchParams(window.location.search);if(p.get("mp_connect"))return"finanzas";}catch{}return"publicaciones";});
  const [filtroPubsTipo,setFiltroPubsTipo]=useState("all");
  const [negocTab,setNegocTab]=useState("todas");
  const pendientesVal=pubs.filter(p=>p.tipo==="oferta"&&p.activo===false&&p.estado_validacion==="pendiente");
  // ── Tab list role-aware ────────────────────────────────────────────────────
  const rolLocal=localStorage.getItem("cl_rol_"+email)||"alumno";
  const esDocente=rolLocal==="docente"||ofertas.length>0;
  const ofertasVisibles=misOfertasEnv.filter(o=>!descartadas.includes(o.id));
  const CUENTA_TABS=[
    {id:"publicaciones",  label:"Publicaciones",  count:pubs.length},
    ...(esDocente?[{id:"estadisticas",label:"Analytics",   count:null}]:[]),
    ...(esDocente?[{id:"clases",      label:"Mis clases",  count:null}]:[]),
    {id:"ofertas",         label:"Negociaciones",  count:ofertasVisibles.length||null},
    ...(esDocente?[{id:"credenciales",label:"Credenciales",count:docs.length||null}]:[]),
    ...(esDocente||reseñas.length>0?[{id:"resenas",label:"Reseñas",count:reseñas.length||null}]:[]),
    {id:"alertas",         label:"Alertas",        count:null},
    ...(esDocente?[{id:"referidos",   label:"Referidos",   count:null}]:[]),
    {id:"finanzas",        label:"Finanzas",       count:null},
    {id:"ajustes",         label:"Ajustes",        count:null},
  ];
  return(
    <div style={{fontFamily:FONT}}>

      {/* ── HEADER PERFIL (estilo prototipo: portada + avatar flotante + pills) ── */}
      <div style={{position:"relative",overflow:"hidden",background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,marginBottom:16,boxShadow:C.shadow}}>
        {/* Portada */}
        <div style={{position:"relative",height:150,background:bannerUrl?undefined:accentFor("cursos").heroGrad,overflow:"hidden"}}>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onError solo oculta la portada rota */}
          {bannerUrl
            ?<img src={bannerUrl} alt="portada" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.currentTarget.style.display="none"}/>
            :<div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 80% -20%, rgba(255,255,255,.25), transparent 55%)"}}/>}
          <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Subir portada" style={{display:"none"}} onChange={async e=>{
            const file=e.target.files?.[0];if(!file)return;
            if(file.size>5*1024*1024){toast("La imagen no debe superar 5 MB","error");return;}
            setBannerUploading(true);
            try{
              const url=await sb.uploadBanner(session.user.id,file,session.access_token);
              await sb.updateUsuario(session.user.id,{banner_url:url},session.access_token);
              setBannerUrl(url);toast("Portada actualizada","success");
            }catch(err){toast("Error al subir la portada: "+err.message,"error");}
            finally{setBannerUploading(false);if(bannerInputRef.current)bannerInputRef.current.value="";}
          }}/>
          <button onClick={()=>bannerInputRef.current?.click()} disabled={bannerUploading}
            style={{position:"absolute",top:14,right:14,display:"inline-flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:20,border:"none",background:"rgba(255,255,255,.22)",color:"#fff",fontFamily:FONT,fontSize:12.5,fontWeight:600,cursor:"pointer",backdropFilter:"blur(4px)"}}>
            <Camera size={15}/>{bannerUploading?"Subiendo…":"Editar portada"}
          </button>
        </div>
        <div style={{position:"relative",padding:"0 26px 24px"}}>
          {/* Avatar flotante con badge de edición */}
          <div style={{position:"relative",width:112,marginTop:-58}}>
            <div style={{width:112,height:112,borderRadius:"50%",overflow:"hidden",border:`4px solid ${C.surface}`,background:C.surface,boxShadow:"0 2px 10px rgba(0,0,0,.12)"}}>
              {avatarUrl&&avatarUrl.startsWith("https://")
                // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onError solo oculta el avatar roto
                ?<img src={avatarUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>
                :<div style={{width:"100%",height:"100%",background:currentColor,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:46,color:"#fff",fontFamily:FONT}}>{nombre[0].toUpperCase()}</div>
              }
            </div>
            <button onClick={()=>setEditingPerfil(true)} aria-label="Cambiar foto"
              style={{position:"absolute",bottom:8,right:8,width:30,height:30,borderRadius:"50%",border:`2px solid ${C.surface}`,background:accentFor("cursos").solid,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Camera size={14}/>
            </button>
          </div>
          {/* Nombre + verificación */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12,flexWrap:"wrap"}}>
            <h2 style={{...tx("display"),fontSize:24,color:C.text,margin:0}}>{displayName||nombre}</h2>
            <StreakBadge session={session}/>
          </div>
          {/* Titular / bio */}
          {bio&&<p style={{...tx("body"),color:C.textSoft||C.muted,margin:"5px 0 0",maxWidth:620}}>{bio}</p>}
          {/* Meta: ubicación · publicaciones · reseñas · rating */}
          <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",marginTop:9}}>
            {ubicacionPerfil&&<span style={{...tx("meta"),color:C.muted,display:"inline-flex",alignItems:"center",gap:5}}><MapPin size={14} strokeWidth={2}/>{ubicacionPerfil}</span>}
            <span style={{...tx("meta"),color:C.muted}}><span style={{color:C.text,fontWeight:700}}>{pubs.length}</span> publicaciones</span>
            <span style={{...tx("meta"),color:C.muted}}><span style={{color:C.text,fontWeight:700}}>{reseñas.length}</span> reseñas</span>
            {avg&&<><span style={{width:3,height:3,borderRadius:"50%",background:C.faint||C.border}}/><span style={{...tx("meta"),color:"#B45309",fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}><Star size={14} fill="#F5B301" stroke="#F5B301"/>{avg.toFixed(1)}</span></>}
          </div>
          {/* Acciones (pills) */}
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:18}}>
            <button onClick={onNew}
              style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 20px",borderRadius:22,border:"none",cursor:"pointer",fontFamily:FONT,fontSize:13.5,fontWeight:650,color:"#fff",background:accentFor("cursos").solid,transition:"all .15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(26,110,216,.35)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
              <span style={{fontSize:16,lineHeight:1}}>+</span>Publicar
            </button>
            <button onClick={()=>setEditingPerfil(v=>!v)}
              style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:22,border:`1.5px solid ${C.borderStrong||C.border}`,background:"transparent",color:C.textSoft||C.text,fontFamily:FONT,fontSize:13.5,fontWeight:600,cursor:"pointer",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=accentFor("cursos").solid;e.currentTarget.style.background=accentFor("cursos").soft;e.currentTarget.style.color=accentFor("cursos").text;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.borderStrong||C.border;e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textSoft||C.text;}}>
              <Camera size={16}/>Editar perfil
            </button>
          </div>
          {/* Form edición inline */}
          {editingPerfil&&(
            <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginTop:14}}>
              {/* Foto de perfil */}
              <Label>Foto de perfil</Label>
              <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:14}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <div role="button" tabIndex={0} aria-label="Cambiar foto de perfil" onClick={()=>avatarInputRef.current?.click()} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();avatarInputRef.current?.click();}}} style={{width:72,height:72,borderRadius:"50%",overflow:"hidden",border:`2px solid ${(avatarPreview||avatarUrl)?C.accent:C.border}`,background:C.surface,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:(avatarPreview||avatarUrl)?"0 2px 12px rgba(26,110,216,.2)":"none"}}>
                    {avatarPreview
                      ?<img src={avatarPreview} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      :avatarUrl&&avatarUrl.startsWith("https://")
                      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onError solo oculta el avatar roto
                      ?<img src={avatarUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>
                      :<Avatar letra={nombre[0]||session.user.email[0]} size={72}/>
                    }
                  </div>
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- decorativo; el avatar de al lado ya es el control accesible */}
                  <div aria-hidden="true" onClick={()=>avatarInputRef.current?.click()} style={{position:"absolute",bottom:0,right:0,width:22,height:22,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 1px 6px rgba(26,110,216,.4)"}}>
                    <Camera size={11} color="#fff" strokeWidth={2.5}/>
                  </div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Subir foto de perfil" style={{display:"none"}} onChange={e=>{
                    const f=e.target.files[0];
                    if(!f)return;
                    if(f.size>5*1024*1024){toast("La imagen no puede superar 5MB","error");return;}
                    setAvatarFile(f);
                    setAvatarPreview(URL.createObjectURL(f));
                  }}/>
                  <button onClick={()=>avatarInputRef.current?.click()} style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:8,color:C.accent,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:FONT,display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                    <Upload size={13} strokeWidth={2}/>{avatarFile?"Cambiar imagen":"Subir foto"}
                  </button>
                  {avatarFile
                    ?<div style={{fontSize:11,color:C.successText,display:"flex",alignItems:"center",gap:4}}><CheckCircle2 size={10} strokeWidth={2.5}/>{avatarFile.name}</div>
                    :<div style={{fontSize:11,color:C.muted}}>JPG, PNG o WebP · Máx. 5 MB</div>
                  }
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:12}}>
                <div>
                  <Label>Nombre visible</Label>
                  <input value={displayName} onChange={e=>setDisplayName(e.target.value)} aria-label="Nombre visible" placeholder={nombre} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                </div>
                <div>
                  <Label>Ubicación</Label>
                  <input value={ubicacionPerfil} onChange={e=>setUbicacionPerfil(e.target.value)} aria-label="Ubicación" placeholder="Ej: Buenos Aires" style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                </div>
              </div>
              <Label>Bio</Label>
              <div style={{position:"relative",marginBottom:12}}>
                <textarea value={bio} onChange={e=>setBio(e.target.value.slice(0,200))} aria-label="Bio" placeholder="Contá algo sobre vos..." style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px 22px",color:C.text,fontSize:13,outline:"none",resize:"vertical",minHeight:60,boxSizing:"border-box",fontFamily:FONT}}/>
                <span style={{position:"absolute",bottom:6,right:10,fontSize:10,color:bio.length>=200?C.danger:C.muted}}>{bio.length}/200</span>
              </div>
              <div>
                <div style={{fontSize:12,color:C.muted,fontWeight:600,display:"flex",alignItems:"center",gap:4,marginBottom:4}}><Video size={12} strokeWidth={2}/>Video de presentación (YouTube)</div>
                <input value={videoPresentacion} onChange={e=>setVideoPresentacion(e.target.value)} aria-label="Video de presentación (YouTube)" placeholder="https://youtube.com/watch?v=..." style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                <div style={{fontSize:10,color:C.muted,marginTop:3}}>Se muestra en tu perfil público.</div>
              </div>
              {/* ── Campos extra docente ── */}
              {(()=>{const rolLocal=localStorage.getItem("cl_rol_"+email)||"alumno";if(rolLocal!=="docente"&&pubs.filter(p=>p.tipo==="oferta").length===0)return null;
                const iDoc={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"};
                const IDIOMAS_LIST=["Español","Inglés","Portugués","Francés","Alemán"];
                const toggleIdioma=(id)=>setIdiomas(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
                return(
                  <div style={{background:C.accentDim,border:`1px solid ${C.accent}22`,borderRadius:10,padding:"12px 14px",marginTop:8}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.accent,letterSpacing:1,marginBottom:10}}>PERFIL DOCENTE</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:10}}>
                      <div>
                        <div style={{fontSize:12,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>Título profesional</div>
                        <input value={tituloProfesional} onChange={e=>setTituloProfesional(e.target.value)} aria-label="Título profesional" placeholder="Ej: Lic. en Matemática, Ing. Civil..." style={iDoc}/>
                      </div>
                      <div>
                        <div style={{fontSize:12,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>Años de experiencia</div>
                        <input type="number" min="0" value={aniosExperiencia} onChange={e=>setAniosExperiencia(e.target.value)} aria-label="Años de experiencia" placeholder="5" style={iDoc}/>
                      </div>
                    </div>
                    <div style={{fontSize:12,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>Metodología de enseñanza</div>
                    <textarea value={metodologia} onChange={e=>setMetodologia(e.target.value)} aria-label="Metodología de enseñanza" placeholder="Describí tu metodología de enseñanza..." rows={2} style={{...iDoc,resize:"vertical",marginBottom:10}}/>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:12,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>Franja horaria</div>
                      <select value={franjaHoraria} onChange={e=>setFranjaHoraria(e.target.value)} aria-label="Franja horaria" style={iDoc}>
                        <option value="">— Seleccionar —</option>
                        <option value="Mañana (8-12hs)">Mañana (8-12hs)</option>
                        <option value="Tarde (12-18hs)">Tarde (12-18hs)</option>
                        <option value="Noche (18-22hs)">Noche (18-22hs)</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                    </div>
                    <div style={{fontSize:12,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>Idiomas</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                      {IDIOMAS_LIST.map(id=>(
                        <button key={id} onClick={()=>toggleIdioma(id)}
                          style={{padding:"4px 12px",borderRadius:20,fontSize:12,cursor:"pointer",fontFamily:FONT,
                            background:idiomas.includes(id)?C.accent:"transparent",
                            color:idiomas.includes(id)?"#fff":C.muted,
                            border:`1px solid ${idiomas.includes(id)?C.accent:C.border}`,fontWeight:idiomas.includes(id)?700:400}}>
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {/* Disponibilidad ahora */}
              <div style={{background:disponibleAhora?"#F0FDF4":C.bg,border:`1px solid ${disponibleAhora?C.success+"40":C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:disponibleAhora?10:0}}>
                  <button onClick={()=>setDisponibleAhora(v=>!v)} role="switch" aria-checked={disponibleAhora} aria-label="Estoy disponible ahora" style={{width:38,height:22,borderRadius:11,background:disponibleAhora?C.success:C.border,border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0,padding:0}}>
                    <span style={{position:"absolute",top:3,left:disponibleAhora?18:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",display:"block",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
                  </button>
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- texto del switch; el control accesible es el botón de al lado */}
                  <span style={{fontSize:13,color:disponibleAhora?C.success:C.text,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}} onClick={()=>setDisponibleAhora(v=>!v)}>{disponibleAhora&&<span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:C.success,flexShrink:0}}/>}Estoy disponible ahora</span>
                </div>
                {disponibleAhora&&(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <input value={disponibleMensaje} onChange={e=>setDisponibleMensaje(e.target.value)} aria-label="Mensaje de disponibilidad" placeholder='Ej: "Puedo dar clases hoy de 14 a 18hs"' style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 10px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {[{v:"2h",l:"2 horas"},{v:"4h",l:"4 horas"},{v:"8h",l:"8 horas"},{v:"mañana",l:"Hasta mañana"}].map(opt=>(
                        <button key={opt.v} onClick={()=>setDisponibleDuracion(opt.v)} style={{background:disponibleDuracion===opt.v?C.success:C.surface,border:`1px solid ${disponibleDuracion===opt.v?C.success:C.border}`,borderRadius:20,color:disponibleDuracion===opt.v?"#fff":C.muted,padding:"4px 12px",fontSize:12,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>{opt.l}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Label>Color de avatar</Label>
              <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
                {AVATAR_COLORS.map(c=>(<button key={c} onClick={()=>saveColor(c)} aria-label={`Color ${c}`} style={{width:26,height:26,borderRadius:"50%",background:c,border:currentColor===c?`2.5px solid ${C.text}`:"2.5px solid transparent",cursor:"pointer",padding:0}}/>))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={async()=>{
                  const newName=(displayName||"").trim()||email.split("@")[0];
                  setSavingDisplayName(true);
                  try{
                    sb.setDisplayName(email,newName);
                    // Subir avatar si hay un archivo nuevo seleccionado
                    let finalAvatarUrl=avatarUrl;
                    if(avatarFile){
                      try{
                        finalAvatarUrl=await sb.uploadAvatar(session.user.id,avatarFile,session.access_token);
                        setAvatarUrl(finalAvatarUrl);
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }catch(uploadErr){
                        toast("Error al subir la foto: "+uploadErr.message,"error");
                        setSavingDisplayName(false);
                        return;
                      }
                    }
                    // Calcular disponible_hasta según duración seleccionada
                    const durMap={"2h":2*3600000,"4h":4*3600000,"8h":8*3600000,"mañana":24*3600000};
                    const dispHasta=disponibleAhora?new Date(Date.now()+(durMap[disponibleDuracion]||4*3600000)).toISOString():null;
                    await sb.updateUsuario(uid,{
                      display_name:newName,nombre:newName,bio:bio.trim()||null,ubicacion:ubicacionPerfil.trim()||null,
                      avatar_url:finalAvatarUrl||null,banner_url:bannerUrl||null,video_presentacion:videoPresentacion.trim()||null,
                      disponible_ahora:disponibleAhora,disponible_hasta:dispHasta,disponible_mensaje:disponibleAhora?disponibleMensaje.trim()||null:null,
                      titulo_profesional:tituloProfesional.trim()||null,
                      anios_experiencia:aniosExperiencia?parseInt(aniosExperiencia):null,
                      metodologia:metodologia.trim()||null,
                      franja_horaria:franjaHoraria||null,
                      idiomas:idiomas.length?idiomas:null,
                    },session.access_token);
                    // Guardar bio y ciudad en localStorage para el progreso de perfil
                    try{
                      if(bio.trim())localStorage.setItem("cl_bio_"+session.user.email,bio.trim());else localStorage.removeItem("cl_bio_"+session.user.email);
                      if(ubicacionPerfil.trim())localStorage.setItem("cl_user_city",ubicacionPerfil.trim());
                    }catch{}
                    // Actualizar cache local de avatar
                    const avTrim=finalAvatarUrl||null;
                    _avatarCache[session.user.email]=avTrim;
                    try{if(avTrim)localStorage.setItem("cl_avatar_"+session.user.email,avTrim);else localStorage.removeItem("cl_avatar_"+session.user.email);}catch{}
                    // Forzar re-render del sidebar
                    try{window.dispatchEvent(new Event("avatar-updated"));}catch{}
                    await sb.updateReseñasNombre(email,newName,session.access_token).catch(()=>{});
                    await sb.updateMensajesNombre(email,newName,session.access_token).catch(()=>{});
                    await sb.updatePublicacionesNombre(email,newName,session.access_token).catch(()=>{});
                    setEditingPerfil(false);
                  }catch(e){toast("Error: "+e.message,"error");}
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
          <Clock size={20} color={C.warn} strokeWidth={1.8} style={{flexShrink:0}}/>
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
      <style>{`
        .cl-tabs-fade::after{content:'';position:absolute;right:0;top:0;bottom:2px;width:24px;background:linear-gradient(to right,transparent,${C.surface});pointer-events:none;z-index:1}
        @media(max-width:768px){.cl-tab-btn{padding:9px 11px!important;font-size:12px!important}}
      `}</style>
      <div className="cl-tabs-scroll cl-tabs-fade" style={{display:"flex",gap:0,borderBottom:`2px solid ${C.border}`,background:C.surface,borderRadius:"10px 10px 0 0",padding:"0 2px",overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",touchAction:"pan-x"}}>
        {CUENTA_TABS.map(tab=>{
          const active=tabCuenta===tab.id;
          return(
            <button key={tab.id} onClick={()=>{setTabCuenta(tab.id);if(tab.id==="ofertas"&&resetCuentaBadge)resetCuentaBadge();}} className="cl-tab-btn"
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
                <GraduationCap size={32} color={C.accent} strokeWidth={1.5}/>
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
          {/* Conteo + nueva publicación */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <div style={{...tx("body"),color:C.muted}}><span style={{color:C.text,fontWeight:700}}>{pubs.length}</span> publicación{pubs.length!==1?"es":""} activa{pubs.length!==1?"s":""}</div>
            <Btn onClick={onNew} style={{padding:"7px 18px",fontSize:13,borderRadius:20}}>+ Nueva publicación</Btn>
          </div>
          {/* Filtros por tipo */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
            {[
              {v:"all",l:"Todo",cnt:pubs.length},
              {v:"curso",l:"Cursos",cnt:pubs.filter(p=>p.tipo==="oferta"&&(p.modo==="curso"||p.modo==="grupal")).length},
              {v:"clase",l:"Clases",cnt:pubs.filter(p=>p.tipo==="oferta"&&(p.modo==="particular"||!p.modo)).length},
              {v:"busqueda",l:"Pedidos",cnt:pubs.filter(p=>p.tipo==="busqueda").length},
            ].map(({v,l,cnt})=>{
              const active=filtroPubsTipo===v;
              return(
                <button key={v} onClick={()=>setFiltroPubsTipo(v)}
                  style={{display:"inline-flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:10,cursor:"pointer",fontFamily:FONT,fontSize:13.5,fontWeight:active?650:500,
                    background:active?C.accent:C.surface,color:active?"#fff":C.textSoft||C.muted,
                    border:`1px solid ${active?"transparent":C.border}`,transition:"all .14s"}}>{l}
                  {cnt>0&&<span style={{...tx("micro"),fontWeight:700,color:active?"#fff":C.faint||C.muted,background:active?"rgba(255,255,255,.22)":C.surfaceAlt||C.bg,borderRadius:7,padding:"1px 7px"}}>{cnt}</span>}
                </button>
              );
            })}
          </div>
          {loading?<Spinner/>:(()=>{const pubsFiltradas=
            filtroPubsTipo==="all"?pubs:
            filtroPubsTipo==="curso"?pubs.filter(p=>p.tipo==="oferta"&&(p.modo==="curso"||p.modo==="grupal")):
            filtroPubsTipo==="clase"?pubs.filter(p=>p.tipo==="oferta"&&(p.modo==="particular"||!p.modo)):
            pubs.filter(p=>p.tipo===filtroPubsTipo);
          return pubsFiltradas.length===0?(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"40px 24px",textAlign:"center"}}>
              <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><Clipboard size={32} color={C.border} strokeWidth={1.5}/></div>
              <div style={{color:C.text,fontWeight:600,fontSize:15,marginBottom:8}}>Todavía no publicaste nada</div>
              <div style={{color:C.muted,fontSize:13,marginBottom:20}}>Creá tu primera clase o pedido para conectar con alumnos o docentes.</div>
              <Btn onClick={onNew} style={{borderRadius:20}}>Crear primera publicación</Btn>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {pubsFiltradas.map(p=>(<div key={p.id}>
                <MyPostCard post={p} session={session} onEdit={onEdit} onToggle={toggle} onDelete={remove} onOpenCurso={onOpenCurso} onOpenDetail={onOpenDetail} toggling={toggling} ofertasPendientes={ofertasMap[p.id]||0} inscriptos={inscritosMap[p.id]}/>
                {ofertasMap[p.id]>0&&<button onClick={()=>setOfertasModal(p)} style={{width:"100%",marginTop:4,background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:10,color:C.accent,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT}}>Ver {ofertasMap[p.id]} oferta{ofertasMap[p.id]!==1?"s":""} nueva{ofertasMap[p.id]!==1?"s":""} →</button>}
              </div>))}
            </div>
          );})()}
        </div>
      )}

      {/* ── TAB: ESTADÍSTICAS ── */}
      {tabCuenta==="estadisticas"&&(
        <div>
          <MiActividadCard session={session}/>
          {loading?<Spinner/>:<DocenteStats pubs={pubs} reseñas={reseñas} inscritosMap={inscritosMap} misOfertasEnv={misOfertasEnv} session={session}/>}
        </div>
      )}

      {/* ── TAB: MIS CLASES ── */}
      {tabCuenta==="clases"&&<ClasesTab session={session} misPubs={pubs}/>}

      {/* ── TAB: ACTIVIDAD (ofertas enviadas + recibidas) ── */}
      {tabCuenta==="ofertas"&&(
        <div>
          {(()=>{
            const ofertasEnviadas=misOfertasEnv.filter(o=>!descartadas.includes(o.id));
            const ofertasRecibidas=ofertasAceptRec.filter(o=>!vistasState.includes(o.id));
            const subtabs=[
              {id:"todas",l:"Todas",c:ofertasEnviadas.length+ofertasRecibidas.length},
              {id:"recibidas",l:"Recibidas",c:ofertasRecibidas.length},
              {id:"enviadas",l:"Enviadas",c:ofertasEnviadas.length},
            ];
            const lista=negocTab==="recibidas"?ofertasRecibidas.map(o=>({o,recibida:true}))
              :negocTab==="enviadas"?ofertasEnviadas.map(o=>({o,recibida:false}))
              :[...ofertasRecibidas.map(o=>({o,recibida:true})),...ofertasEnviadas.map(o=>({o,recibida:false}))];

            const renderOferta=(o,recibida)=>{
              const soyDoc=o.busqueda_autor_email===email;
              const otroN=recibida
                ?(soyDoc?(o.ofertante_nombre||safeDisplayName(null,o.ofertante_email)):(o.busqueda_autor_nombre||safeDisplayName(null,o.busqueda_autor_email)))
                :(o.busqueda_autor_nombre||safeDisplayName(null,o.busqueda_autor_email));
              const tieneContraAlumno=!recibida&&o.estado==="pendiente"&&o.contraoferta_precio&&o.contraoferta_de==="alumno";
              const estado=recibida?"aceptada":o.estado;
              const st=tieneContraAlumno?{t:"Negociando",c:"#C85CE0",bg:"#C85CE015",bd:"#C85CE033"}
                :estado==="aceptada"?{t:"Aceptada",c:C.successText,bg:C.success+"12",bd:C.success+"30"}
                :estado==="rechazada"?{t:"Rechazada",c:C.danger,bg:C.danger+"12",bd:C.danger+"30"}
                :estado==="retirada"?{t:"Retirada",c:C.muted,bg:C.bg,bd:C.border}
                :{t:"Pendiente",c:"#B45309",bg:"#F59E0B12",bd:"#F59E0B30"};
              const badge=recibida?accentFor("pedidos"):accentFor("clases");
              return(
                <div key={(recibida?"r":"e")+o.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16,boxShadow:C.shadow}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <Avatar letra={(otroN||"?")[0]} size={42}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{...tx("bodyStrong"),color:C.text}}>{otroN}</span>
                        <span style={{...tx("micro"),fontWeight:700,padding:"2px 8px",borderRadius:6,background:badge.soft,color:badge.text}}>{recibida?"Recibida":"Enviada"}</span>
                      </div>
                      <div style={{...tx("meta"),color:C.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.busqueda_titulo}</div>
                    </div>
                    {o.precio&&<div style={{textAlign:"right",flexShrink:0,whiteSpace:"nowrap"}}><span style={{...tx("price"),color:C.text}}>{fmtPrice(o.precio)}</span><span style={{...tx("micro"),color:C.faint}}> /{o.precio_tipo}</span></div>}
                  </div>
                  {o.mensaje&&<div style={{...tx("body"),color:C.textSoft||C.muted,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginTop:12,fontStyle:"italic"}}>“{o.mensaje}”</div>}
                  {(tieneContraAlumno||(recibida&&o.contraoferta_precio))&&<div style={{...tx("meta"),color:"#C85CE0",fontWeight:600,marginTop:8}}>↔ Contraoferta: {fmtPrice(o.contraoferta_precio)}/{o.contraoferta_tipo||o.precio_tipo}</div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginTop:12,flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{...tx("micro"),fontWeight:700,padding:"3px 10px",borderRadius:20,background:st.bg,color:st.c,border:`1px solid ${st.bd}`}}>{st.t}</span>
                      {o.created_at&&<span style={{...tx("micro"),color:C.faint}}>{fmtRel(o.created_at)}</span>}
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {recibida?(<>
                        <Btn onClick={()=>onOpenChat({id:o.busqueda_id,autor_email:soyDoc?o.ofertante_email:o.busqueda_autor_email,titulo:o.busqueda_titulo,autor_nombre:otroN})} style={{padding:"6px 14px",fontSize:12,borderRadius:20}}>Chatear</Btn>
                        <button onClick={()=>setAcuerdoModal(o)} style={{background:"none",border:`1px solid ${C.success}`,borderRadius:20,color:C.successText,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT}}>Ver acuerdo</button>
                        <button onClick={()=>{const nv=[...vistasState,o.id];setVistasState(nv);try{localStorage.setItem(vistasKey2,JSON.stringify(nv));}catch{}}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"6px 12px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>Marcar vista</button>
                      </>):(<>
                        {tieneContraAlumno&&<ContraRespondedor oferta={o} session={session} onActualizado={cargar} onVer={()=>{}} onChat={(of)=>onOpenChat({id:of.busqueda_id,autor_email:of.busqueda_autor_email,titulo:of.busqueda_titulo,autor_nombre:of.busqueda_autor_nombre||safeDisplayName(null,of.busqueda_autor_email)})}/>}
                        {o.estado==="aceptada"&&<Btn onClick={()=>onOpenChat({id:o.busqueda_id,autor_email:o.busqueda_autor_email,titulo:o.busqueda_titulo,autor_nombre:o.busqueda_autor_nombre||safeDisplayName(null,o.busqueda_autor_email)})} style={{padding:"6px 14px",fontSize:12,borderRadius:20}}>Chatear</Btn>}
                        <button onClick={()=>descartarOferta(o.id)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"6px 12px",cursor:"pointer",fontSize:11,fontFamily:FONT}}>Ocultar</button>
                      </>)}
                    </div>
                  </div>
                </div>
              );
            };

            return(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {/* Sub-tabs Todas / Recibidas / Enviadas */}
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {subtabs.map(s=>{
                    const active=negocTab===s.id;
                    return(
                      <button key={s.id} onClick={()=>setNegocTab(s.id)}
                        style={{display:"inline-flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:10,cursor:"pointer",fontFamily:FONT,fontSize:13.5,fontWeight:active?650:500,
                          background:active?C.accent:C.surface,color:active?"#fff":C.textSoft||C.muted,
                          border:`1px solid ${active?"transparent":C.border}`,transition:"all .14s"}}>{s.l}
                        <span style={{...tx("micro"),fontWeight:700,color:active?"#fff":C.faint||C.muted,background:active?"rgba(255,255,255,.22)":C.surfaceAlt||C.bg,borderRadius:7,padding:"1px 7px"}}>{s.c}</span>
                      </button>
                    );
                  })}
                </div>
                {lista.length===0?(
                  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"48px 24px",textAlign:"center",boxShadow:C.shadow}}>
                    <div style={{width:52,height:52,borderRadius:14,background:accentFor("pedidos").soft,color:accentFor("pedidos").solid,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><MessageCircle size={26} strokeWidth={1.8}/></div>
                    <div style={{...tx("cardTitle"),color:C.text,marginBottom:6}}>Sin negociaciones</div>
                    <div style={{...tx("body"),color:C.muted,maxWidth:420,margin:"0 auto"}}>Cuando envíes o recibas ofertas en pedidos, las vas a ver acá.</div>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {lista.map(({o,recibida})=>renderOferta(o,recibida))}
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
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:8,flexWrap:"wrap"}}>
            <div style={{...tx("body"),color:C.muted}}>Tus títulos y certificados respaldan tu perfil docente.</div>
            {showAddDoc
              ?<button onClick={()=>setShowAddDoc(false)} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:22,border:`1.5px solid ${C.borderStrong||C.border}`,background:"transparent",color:C.textSoft||C.text,fontFamily:FONT,fontSize:13.5,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
              :<button onClick={()=>setShowAddDoc(true)} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 20px",borderRadius:22,border:"none",cursor:"pointer",fontFamily:FONT,fontSize:13.5,fontWeight:650,color:"#fff",background:accentFor("cursos").solid}}><span style={{fontSize:16,lineHeight:1}}>+</span>Agregar credencial</button>}
          </div>
          {showAddDoc&&(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:18,marginBottom:14,boxShadow:C.shadow}}>
              <Label>Tipo</Label>
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {TIPOS_DOC.map(({v,l})=>(<button key={v} onClick={()=>setDocTipo(v)} style={{padding:"6px 14px",borderRadius:20,fontSize:12,cursor:"pointer",background:docTipo===v?C.accent:"transparent",color:docTipo===v?"#fff":C.muted,border:`1px solid ${docTipo===v?C.accent:C.border}`,fontFamily:FONT,fontWeight:600,transition:"all .12s"}}>{l}</button>))}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div><Label>Título *</Label><input value={docTitulo} onChange={e=>setDocTitulo(e.target.value)} aria-label="Título del documento" placeholder="Ej: Licenciado en Matemática" style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/></div>
                  <div><Label>Institución</Label><input value={docInst} onChange={e=>setDocInst(e.target.value)} aria-label="Institución" placeholder="Ej: UBA, Berklee..." style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div><Label>Año de obtención</Label><input value={docAño} onChange={e=>setDocAño(e.target.value)} aria-label="Año de obtención" placeholder="Ej: 2021" style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/></div>
                  <div><Label>País</Label><input value={docPais} onChange={e=>setDocPais(e.target.value)} aria-label="País" placeholder="Ej: Argentina" style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/></div>
                </div>
                <div><Label>Descripción (opcional)</Label><textarea value={docDesc} onChange={e=>setDocDesc(e.target.value.slice(0,300))} aria-label="Descripción del documento" placeholder="Descripción breve, especialización, etc." rows={2} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box",resize:"none"}}/></div>
                <div><Label>URL de verificación (opcional)</Label><input value={docUrl} onChange={e=>setDocUrl(e.target.value)} aria-label="URL de verificación" placeholder="Link al certificado online, LinkedIn, etc." style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:FONT,boxSizing:"border-box"}}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={addDoc} disabled={savingDoc||!docTitulo.trim()} style={{background:C.accent,border:"none",borderRadius:20,color:"#fff",padding:"8px 20px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:FONT,opacity:!docTitulo.trim()?0.5:1}}>{savingDoc?"Guardando...":"Guardar"}</button>
                <button onClick={()=>setShowAddDoc(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,padding:"8px 16px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>Cancelar</button>
              </div>
            </div>
          )}
          {loading?<Spinner/>:docs.length===0&&!showAddDoc?(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"48px 24px",textAlign:"center",boxShadow:C.shadow}}>
              <div style={{width:52,height:52,borderRadius:14,background:accentFor("cursos").soft,color:accentFor("cursos").solid,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><ScrollText size={26} strokeWidth={1.8}/></div>
              <div style={{...tx("cardTitle"),color:C.text,marginBottom:6}}>Sin credenciales aún</div>
              <div style={{...tx("body"),color:C.muted,maxWidth:420,margin:"0 auto"}}>Agregar títulos aumenta la confianza de los alumnos en tu perfil.</div>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
              {docs.map(d=>{
                const DIcon=TIPO_ICON[d.tipo]||FileText;
                const tipoLabel=(TIPOS_DOC.find(t=>t.v===d.tipo)?.l||d.tipo||"").toUpperCase();
                return(
                <div key={d.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:18,boxShadow:C.shadow}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:12}}>
                    <div style={{width:44,height:44,borderRadius:12,background:accentFor("cursos").soft,color:accentFor("cursos").solid,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><DIcon size={22} strokeWidth={1.9}/></div>
                    <button onClick={()=>removeDoc(d.id)} aria-label="Eliminar credencial" title="Eliminar" style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .12s"}}
                      onMouseEnter={e=>{e.currentTarget.style.color=C.danger;e.currentTarget.style.borderColor=C.danger;}} onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border;}}><Trash2 size={15}/></button>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:5,...tx("micro"),fontWeight:700,letterSpacing:.6,color:C.faint||C.muted,marginBottom:3}}>{tipoLabel}{d.verificado&&<BadgeCheck size={13} color={accentFor("cursos").solid}/>}</div>
                  <div style={{...tx("bodyStrong"),color:C.text}}>{d.titulo}</div>
                  {(d.institucion||d.año)&&<div style={{...tx("meta"),color:C.muted,marginTop:3}}>{[d.institucion,d.año].filter(Boolean).join(" · ")}</div>}
                  {d.pais&&<div style={{...tx("micro"),color:C.faint||C.muted,marginTop:3,display:"inline-flex",alignItems:"center",gap:3}}><Globe size={10} strokeWidth={2}/>{d.pais}</div>}
                  {d.descripcion&&<div style={{...tx("meta"),color:C.muted,marginTop:8,lineHeight:1.5}}>{d.descripcion}</div>}
                  {safeUrl(d.url_verificacion)&&<a href={safeUrl(d.url_verificacion)} target="_blank" rel="noopener noreferrer" style={{...tx("meta"),color:accentFor("cursos").text,marginTop:8,display:"inline-flex",alignItems:"center",gap:4}}><ExternalLink size={11} strokeWidth={2}/>Verificar credencial</a>}
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: RESEÑAS ── */}
      {tabCuenta==="resenas"&&(
        <div>
          {loading?<Spinner/>:reseñas.length===0?(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"48px 24px",textAlign:"center",boxShadow:C.shadow}}>
              <div style={{width:52,height:52,borderRadius:14,background:accentFor("clases").soft,color:accentFor("clases").solid,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Star size={26} strokeWidth={1.8}/></div>
              <div style={{...tx("cardTitle"),color:C.text,marginBottom:6}}>Sin reseñas aún</div>
              <div style={{...tx("body"),color:C.muted,maxWidth:420,margin:"0 auto"}}>Cuando finalices clases, tus alumnos podrán valorarte aquí.</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {/* Resumen: promedio + distribución */}
              {(()=>{
                const total=reseñas.length;
                const prom=avg||(reseñas.reduce((a,r)=>a+(r.estrellas||0),0)/total);
                const dist=[5,4,3,2,1].map(n=>({n,c:reseñas.filter(r=>(r.estrellas||0)===n).length}));
                return(
                  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20,boxShadow:C.shadow,display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
                    <div style={{textAlign:"center",flexShrink:0,minWidth:90}}>
                      <div style={{...tx("display"),fontSize:40,color:C.text,lineHeight:1}}>{prom.toFixed(1)}</div>
                      <div style={{color:"#F5B301",display:"inline-flex",alignItems:"center",gap:3,marginTop:6,...tx("meta"),fontWeight:700}}><Star size={14} fill="#F5B301" stroke="#F5B301"/>{prom.toFixed(1)}</div>
                      <div style={{...tx("micro"),color:C.muted,marginTop:2}}>{total} reseña{total!==1?"s":""}</div>
                    </div>
                    <div style={{flex:1,minWidth:200,display:"flex",flexDirection:"column",gap:6}}>
                      {dist.map(({n,c})=>(
                        <div key={n} style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{...tx("micro"),color:C.muted,display:"inline-flex",alignItems:"center",gap:2,width:22}}>{n}<Star size={10} fill="#F5B301" stroke="#F5B301"/></span>
                          <div style={{flex:1,height:8,background:C.surfaceAlt||C.bg,borderRadius:6,overflow:"hidden"}}><div style={{height:"100%",width:`${total>0?(c/total)*100:0}%`,background:"#F5B301",borderRadius:6}}/></div>
                          <span style={{...tx("micro"),color:C.faint||C.muted,width:36,textAlign:"right"}}>{total>0?Math.round((c/total)*100):0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {/* Lista de reseñas */}
              {reseñas.map(r=>{
                const fecha=r.created_at?new Date(r.created_at).toLocaleDateString("es-AR",{month:"long",year:"numeric"}):"";
                const sub=[r.pub_titulo,fecha].filter(Boolean).join(" · ");
                return(
                <div key={r.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16,boxShadow:C.shadow}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <Avatar letra={r.autor_nombre?.[0]||"?"} size={42}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span style={{...tx("bodyStrong"),color:C.text}}>{r.autor_nombre}</span>
                        {r.verificada&&<span style={{...tx("micro"),background:"#4ECB7115",color:C.successText,border:"1px solid #4ECB7133",borderRadius:20,padding:"1px 7px",fontWeight:700,display:"inline-flex",alignItems:"center",gap:3}}><BadgeCheck size={10}/>Verificada</span>}
                      </div>
                      {sub&&<div style={{...tx("meta"),color:C.muted,marginTop:2}}>{sub}</div>}
                    </div>
                    <div style={{color:"#F5B301",...tx("meta"),flexShrink:0,whiteSpace:"nowrap",letterSpacing:1}}>{"★".repeat(r.estrellas||0)}{"☆".repeat(5-(r.estrellas||0))}</div>
                  </div>
                  {r.texto&&<p style={{...tx("body"),color:C.textSoft||C.muted,margin:"12px 0 0",lineHeight:1.6}}>{r.texto}</p>}
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {tabCuenta==="alertas"&&<AlertasTab session={session}/>}
      {tabCuenta==="referidos"&&<ReferidosTab session={session}/>}
      {tabCuenta==="finanzas"&&<FinanzasTab session={session}/>}
      {tabCuenta==="ajustes"&&<AjustesTab session={session} nombre={nombre} displayName={displayName} bio={bio} ubicacion={ubicacionPerfil} tituloProf={tituloProfesional} avatarUrl={avatarUrl} currentColor={currentColor} onEditPerfil={()=>{setEditingPerfil(true);window.scrollTo({top:0,behavior:"smooth"});}}/>}
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
  const [frecuencia,setFrecuencia]=useState(oferta.frecuencia||"");
  const [notas,setNotas]=useState(oferta.notas_acuerdo||"");
  const [saving,setSaving]=useState(false);
  const [confirmado,setConfirmado]=useState(!!(oferta.acuerdo_confirmado));
  const miEmail=session.user.email;
  // _rol viene del contexto: "docente"=yo soy el ofertante, "alumno"=yo soy el dueño de la búsqueda
  const soyDocente=oferta._rol?oferta._rol==="docente":(oferta.ofertante_email===miEmail);

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
        forma_pago:"mercadopago",
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
    }catch(e){toast("Error: "+e.message,"error");}finally{setSaving(false);}
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
                <div style={{color:C.text,fontSize:12,fontWeight:600}}>{oferta.ofertante_nombre||oferta.ofertante_email}</div>
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
                <div style={{color:C.successText,fontWeight:700,fontSize:13}}>Acuerdo confirmado</div>
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
                <div style={{color:C.text,fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:5}}><CreditCard size={13} strokeWidth={2}/>Mercado Pago</div>
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
                <input value={precio} onChange={e=>setPrecio(e.target.value)} type="number" min="0" aria-label="Precio" placeholder="Ej: 5000" style={iS}/>
              </div>
              <div>
                <div style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:1,marginBottom:5,textTransform:"uppercase"}}>Frecuencia</div>
                <select value={frecuencia} onChange={e=>setFrecuencia(e.target.value)} aria-label="Frecuencia" style={{...iS,cursor:"pointer",colorScheme:localStorage.getItem("cl_theme")||"light"}}>
                  <option value="">Seleccioná</option>
                  {FRECUENCIAS.map(f=><option key={f.v} value={f.v}>{f.l}</option>)}
                </select>
              </div>
            </div>
            <div style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:1,marginBottom:5,textTransform:"uppercase"}}>Forma de pago</div>
            <div style={{background:"linear-gradient(135deg,#009EE320,#0070BA18)",border:"1px solid #009EE344",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
              <CreditCard size={20} color="#009EE3" strokeWidth={1.8}/>
              <div>
                <div style={{fontWeight:700,color:C.text,fontSize:13}}>Mercado Pago</div>
                <div style={{fontSize:11,color:C.muted}}>El pago se realiza a través de Luderis — protegido y garantizado</div>
              </div>
              <span style={{marginLeft:"auto",fontSize:10,background:"#4ECB7115",color:C.successText,border:"1px solid #4ECB7133",borderRadius:20,padding:"2px 8px",fontWeight:700}}>Único</span>
            </div>
            <div style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:1,marginBottom:5,textTransform:"uppercase"}}>Notas adicionales (opcional)</div>
            <textarea value={notas} onChange={e=>setNotas(e.target.value.slice(0,400))} aria-label="Notas adicionales" placeholder="Horarios acordados, condiciones especiales, etc." style={{...iS,minHeight:65,resize:"vertical"}}/>
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
export { AcuerdoModal, EspacioClaseModal };
export default MiCuentaPage;
