import React from "react";
import { C } from "../shared";

// Extraído de PostFormModal.jsx: ExplorePage lo importaba estáticamente y eso
// arrastraba todo PostFormModal (incl. PerfilPage) al chunk de Inicio, rompiendo
// el code-splitting (INEFFECTIVE_DYNAMIC_IMPORT).

// ── PriceSlider — Slider de rango de precios ──────────────────────────────────
export function PriceSlider({min,max,valMin,valMax,onChangeMin,onChangeMax}){
  const pct=(v)=>((v-min)/(max-min))*100;
  return(
    <div style={{padding:"4px 0 8px"}}>
      <div style={{position:"relative",height:4,background:C.border,borderRadius:2,margin:"12px 8px"}}>
        <div style={{position:"absolute",left:`${pct(valMin)}%`,right:`${100-pct(valMax)}%`,height:"100%",background:C.accent,borderRadius:2}}/>
        {[{val:valMin,onChange:onChangeMin},{val:valMax,onChange:onChangeMax}].map(({val,onChange},i)=>(
          <input key={i} type="range" aria-label={i===0?"Precio mínimo":"Precio máximo"} min={min} max={max} value={val}
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

export default PriceSlider;
