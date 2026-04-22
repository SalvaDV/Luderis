import React from 'react';
import { Marquee, MagBtn } from './primitives';

// Nav + ticker superior
function Ticker(){
  const items = [
    {k:'AR', v:'Plataforma educativa argentina'},
    {k:'v2026.1', v:'Búsqueda semántica con IA'},
    {k:'NEW', v:'Certificados verificables on-chain'},
    {k:'LIVE', v:'14.203 clases activas esta semana'},
    {k:'MATCH', v:'Tu próxima clase a un scroll'},
    {k:'AR', v:'Plataforma educativa argentina'},
    {k:'v2026.1', v:'Búsqueda semántica con IA'},
    {k:'NEW', v:'Certificados verificables on-chain'},
    {k:'LIVE', v:'14.203 clases activas esta semana'},
    {k:'AI', v:'Match en menos de 2 minutos'},
  ];
  return (
    <div style={{background:'var(--ink)', color:'var(--paper)', padding:'8px 0', overflow:'hidden', borderBottom:'1px solid var(--ink)'}}>
      <Marquee speed={55}>
        {items.map((it,i)=>(
          <span key={i} style={{display:'inline-flex', alignItems:'center', gap:10, fontFamily:'var(--font-mono)', fontSize:11, fontWeight:500, letterSpacing:'.06em'}}>
            <span style={{padding:'2px 8px', borderRadius:99, background:i%3===0?'var(--orange)':'var(--blue)', color:i%3===0?'var(--ink)':'#fff', fontSize:10, fontWeight:600}}>{it.k}</span>
            <span style={{opacity:.85}}>{it.v}</span>
            <span style={{opacity:.35}}>◆</span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}

function Nav({onEnter}){
  const [scrolled, setScrolled] = React.useState(false);
  const [mobile, setMobile] = React.useState(false);

  React.useEffect(()=>{
    const onScroll = ()=> setScrolled(window.scrollY>20);
    window.addEventListener('scroll', onScroll, {passive:true});
    return ()=>window.removeEventListener('scroll', onScroll);
  },[]);

  const links = [['inicio','Inicio'],['mundos','Dos mundos'],['features','Funciones'],['como','Cómo funciona'],['nosotros','Nosotros'],['contacto','Contacto']];
  const go = (id)=> document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});

  return (
    <div style={{position:'sticky', top:0, zIndex:80, isolation:'isolate'}}>
      <nav style={{
        background: scrolled ? 'color-mix(in srgb, var(--paper) 78%, transparent)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px) saturate(1.2)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(1.2)' : 'none',
        borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
        transition:'background .3s, border-color .3s, backdrop-filter .3s'
      }}>
        <div style={{maxWidth:1400, margin:'0 auto', padding:'16px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:24}}>
          <a href="#inicio" onClick={(e)=>{e.preventDefault();go('inicio');}} data-cursor data-cursor-label="HOME" style={{display:'flex', alignItems:'center', gap:10}}>
            <LudLogo size={28}/>
            <span style={{fontWeight:700, fontSize:20, letterSpacing:'-.03em'}}>Luderis</span>
            <span style={{fontFamily:'var(--font-mono)', fontSize:10, color:'var(--muted)', marginLeft:2, padding:'2px 6px', border:'1px solid var(--line)', borderRadius:4}}>v2026.1</span>
          </a>
          <div className="lud-nav-links" style={{display:'flex', alignItems:'center', gap:2, background:'var(--paper)', border:'1px solid var(--line)', borderRadius:99, padding:4}}>
            {links.map(([id,l])=>(
              <button key={id} onClick={()=>go(id)} data-cursor style={{
                background:'transparent', border:'none', padding:'8px 14px', borderRadius:99,
                fontSize:13, fontWeight:500, color:'var(--ink-2)', fontFamily:'inherit',
                transition:'background .2s, color .2s'
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--ink)'; e.currentTarget.style.color='var(--paper)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--ink-2)';}}>
                {l}
              </button>
            ))}
          </div>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <button onClick={onEnter} data-cursor data-cursor-label="LOGIN" style={{
              background:'transparent', border:'none', padding:'10px 16px',
              fontSize:14, fontWeight:500, color:'var(--ink)', fontFamily:'inherit', borderRadius:99
            }}>Ingresar</button>
            <MagBtn onClick={onEnter} variant="ink">Empezar gratis</MagBtn>
            <button className="lud-burger" onClick={()=>setMobile(m=>!m)} style={{display:'none', background:'none', border:'1px solid var(--line)', borderRadius:12, padding:10, flexDirection:'column', gap:4}}>
              <span style={{width:18, height:1.5, background:'var(--ink)', display:'block'}}/>
              <span style={{width:18, height:1.5, background:'var(--ink)', display:'block'}}/>
            </button>
          </div>
        </div>
        {mobile && (
          <div className="lud-mobile-menu" style={{borderTop:'1px solid var(--line)', padding:'12px 20px', display:'flex', flexDirection:'column'}}>
            {links.map(([id,l])=>(
              <button key={id} onClick={()=>{go(id); setMobile(false);}} style={{textAlign:'left', background:'none', border:'none', padding:'12px 0', fontSize:16, fontWeight:500, color:'var(--ink)', fontFamily:'inherit', borderBottom:'1px solid var(--line)'}}>{l}</button>
            ))}
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 960px){
          .lud-nav-links{display:none !important}
          .lud-burger{display:flex !important}
        }
        @media (max-width: 640px){
          .lud-nav-links{display:none !important}
        }
      `}</style>
    </div>
  );
}

function LudLogo({size=28}){
  return (
    <div style={{width:size, height:size, borderRadius:8, background:'var(--ink)', position:'relative', overflow:'hidden', display:'inline-flex', alignItems:'center', justifyContent:'center'}}>
      <svg viewBox="0 0 28 28" width={size} height={size}>
        <circle cx="10" cy="14" r="5" fill="var(--blue)"/>
        <circle cx="18" cy="14" r="5" fill="#2EC4A0" style={{mixBlendMode:'screen'}}/>
      </svg>
    </div>
  );
}

export { Nav, LudLogo, Ticker };
