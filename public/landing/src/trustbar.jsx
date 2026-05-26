// TrustBar — franja de social proof con logos/marcas argentinas
function TrustBar(){
  const brands = [
    'Mercado Libre','Despegar','Globant','OLX','Naranja X',
    'Ualá','Rappi','Bumeran','La Nación','Clarín',
    'Infobae','Grupo Oui','MercadoPago','Tiendanube','Auth0',
  ];

  // Duplicamos para scroll infinito
  const items = [...brands, ...brands];

  return (
    <div style={{
      borderTop:'1px solid var(--line)',
      borderBottom:'1px solid var(--line)',
      background:'var(--paper)',
      padding:'20px 0',
      overflow:'hidden',
      position:'relative'
    }}>
      {/* Fade lateral */}
      <div aria-hidden style={{
        position:'absolute', left:0, top:0, bottom:0, width:120, zIndex:2,
        background:'linear-gradient(to right, var(--paper), transparent)',
        pointerEvents:'none'
      }}/>
      <div aria-hidden style={{
        position:'absolute', right:0, top:0, bottom:0, width:120, zIndex:2,
        background:'linear-gradient(to left, var(--paper), transparent)',
        pointerEvents:'none'
      }}/>

      <div style={{display:'flex', gap:0}}>
        <div className="lud-trust-track" style={{
          display:'flex', gap:0, alignItems:'center',
          animation:'lud-trust-scroll 28s linear infinite',
          willChange:'transform'
        }}>
          {items.map((b,i)=>(
            <div key={i} style={{
              display:'inline-flex', alignItems:'center', gap:10,
              padding:'0 40px',
              fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600,
              letterSpacing:'.06em', color:'var(--muted)',
              whiteSpace:'nowrap', userSelect:'none',
              transition:'color .2s'
            }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--ink)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--muted)'}>
              <span style={{width:5, height:5, borderRadius:'50%', background:'var(--line)', display:'inline-block', flexShrink:0}}/>
              {b}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.14em',
        color:'var(--muted)', textTransform:'uppercase', textAlign:'center',
        marginTop:14, opacity:.7
      }}>
        Confiado por profesionales de las mejores empresas
      </div>

      <style>{`
        @keyframes lud-trust-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .lud-trust-track:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

window.TrustBar = TrustBar;
