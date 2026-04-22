import React from 'react';
import { Reveal, Counter } from './primitives';

// Contador animado de stats
function Stats(){
  const items = [
    {k:'alumnos activos', v:12483, suffix:''},
    {k:'docentes verificados', v:3218, suffix:''},
    {k:'clases esta semana', v:14203, suffix:''},
    {k:'match promedio', v:2, suffix:' min'},
  ];
  return (
    <section style={{padding:'80px 28px', background:'var(--ink)', color:'var(--paper)', borderTop:'1px solid var(--ink)', borderBottom:'1px solid var(--ink)'}}>
      <div style={{maxWidth:1344, margin:'0 auto'}}>
        <Reveal>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:30}} className="lud-stats-grid">
            {items.map((it,i)=>(
              <div key={i} style={{borderLeft: i>0 ? '1px solid oklch(1 0 0 / .15)' : 'none', paddingLeft: i>0 ? 30 : 0}}>
                <div style={{fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'.14em', textTransform:'uppercase', color:'oklch(1 0 0 / .55)', marginBottom:14}}>{String(i+1).padStart(2,'0')} · {it.k}</div>
                <div style={{fontSize:'clamp(48px, 6vw, 90px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.95}}>
                  <Counter to={it.v} suffix={it.suffix}/>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
      <style>{`
        @media (max-width: 900px){ .lud-stats-grid{ grid-template-columns: repeat(2, 1fr) !important; gap: 30px !important; } .lud-stats-grid > *{ border-left: none !important; padding-left: 0 !important; } }
      `}</style>
    </section>
  );
}

export { Stats };
