import React from 'react';
import { Reveal, Kicker } from './primitives';

// Sobre nosotros
function About(){
  return (
    <section id="nosotros" style={{padding:'140px 28px 120px'}}>
      <div style={{maxWidth:1344, margin:'0 auto'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'flex-start'}} className="lud-about-grid">
          <Reveal>
            <Kicker>06 · Nosotros</Kicker>
            <h2 style={{fontSize:'clamp(44px, 7vw, 92px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, margin:'18px 0 32px', textWrap:'balance'}}>
              Creemos que el conocimiento no debería tener <i style={{fontStyle:'italic', fontWeight:500, color:'var(--orange-deep)'}}>barreras.</i>
            </h2>
            <p style={{fontSize:18, lineHeight:1.6, color:'var(--ink-2)', margin:'0 0 20px', maxWidth:520, textWrap:'pretty'}}>
              Luderis nació de una idea simple: que cualquier persona pueda enseñar lo que sabe o aprender lo que necesita. De forma directa, clara, sin filtros innecesarios.
            </p>
            <p style={{fontSize:16, lineHeight:1.65, color:'var(--muted)', margin:'0 0 32px', maxWidth:520}}>
              La mejor educación ocurre cuando hay una conexión real entre personas. Nuestro foco es facilitar ese encuentro — con tecnología que hace la experiencia mejor para ambos lados.
            </p>
            <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
              {['🇦🇷 Marca Argentina','▲ Equipo de 12','◆ Founded 2026'].map(l=>(
                <span key={l} style={{padding:'8px 14px', borderRadius:99, border:'1px solid var(--line)', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ink-2)'}}>{l}</span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              {[
                {k:'Misión', v:'Democratizar el acceso al conocimiento conectando personas que quieren aprender con quienes quieren enseñar.', c:'var(--blue)'},
                {k:'Visión', v:'Ser la plataforma de referencia en Argentina para el intercambio de conocimiento entre personas.', c:'var(--orange)'},
                {k:'Tecnología', v:'IA semántica, evaluaciones automatizadas, seguimiento en tiempo real. Construido sobre infra moderna.', c:'var(--ink)'},
                {k:'Confianza', v:'Privacidad y seguridad en cada interacción. Tus datos son tuyos, siempre.', c:'var(--blue-deep)'},
              ].map((v,i)=>(
                <div key={v.k} style={{background: i%3===0?v.c:'var(--paper)', color: i%3===0?'var(--paper)':'var(--ink)', border:'1px solid '+(i%3===0?v.c:'var(--line)'), borderRadius:18, padding:'24px', minHeight:200, position:'relative', overflow:'hidden'}}>
                  <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', opacity:.7}}>0{i+1}</div>
                  <div style={{fontSize:22, fontWeight:700, letterSpacing:'-.03em', margin:'8px 0 10px'}}>{v.k}</div>
                  <p style={{fontSize:13, lineHeight:1.5, opacity:.85, margin:0}}>{v.v}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px){ .lud-about-grid{ grid-template-columns: 1fr !important; gap: 40px !important; } }
      `}</style>
    </section>
  );
}

export { About };
