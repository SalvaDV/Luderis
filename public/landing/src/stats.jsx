// Propuestas de valor — cualitativas, honestas
function Stats(){
  const items = [
    {
      icon: ()=>(
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      ),
      k:'Match en minutos',
      v:'IA semántica que entiende lo que buscás. No palabras clave — contexto real.',
      accent:'#3D8EF0'
    },
    {
      icon: ()=>(
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      k:'Sin intermediarios',
      v:'Docente y alumno se conectan directo. El precio lo acordás vos.',
      accent:'#2EC4A0'
    },
    {
      icon: ()=>(
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      k:'Privacidad primero',
      v:'Tu email nunca se muestra. Chat interno. Tus datos son tuyos, siempre.',
      accent:'#E8891C'
    },
    {
      icon: ()=>(
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      ),
      k:'Pagos seguros',
      v:'Integrado con MercadoPago. Sin cuentas extra ni comisiones ocultas.',
      accent:'#9B7BF4'
    },
  ];

  return (
    <section style={{padding:'80px 28px', background:'var(--ink)', color:'var(--paper)'}}>
      <div style={{maxWidth:1344, margin:'0 auto'}}>
        <Reveal>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:1, background:'rgba(255,255,255,0.06)', borderRadius:20, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)'}} className="lud-stats-grid">
            {items.map((it,i)=>{
              const Icon = it.icon;
              return (
                <div key={i} style={{padding:'36px 32px', background:'var(--ink)', position:'relative'}}>
                  <div style={{
                    width:44, height:44, borderRadius:12,
                    background:`${it.accent}18`,
                    border:`1px solid ${it.accent}30`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:it.accent, marginBottom:20
                  }}>
                    <Icon/>
                  </div>
                  <div style={{fontSize:18, fontWeight:700, letterSpacing:'-.02em', marginBottom:10, color:'var(--paper)'}}>{it.k}</div>
                  <p style={{fontSize:13, lineHeight:1.6, color:'oklch(1 0 0 / .55)', margin:0}}>{it.v}</p>
                  <div style={{position:'absolute', top:0, left:0, right:0, height:2, background:it.accent, opacity:.7}}/>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
      <style>{`
        @media (max-width: 900px){ .lud-stats-grid{ grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 520px){ .lud-stats-grid{ grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

window.Stats = Stats;
