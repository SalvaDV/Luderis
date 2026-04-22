// CTA final gigante
function CTA({onEnter}){
  return (
    <section style={{padding:'120px 28px', position:'relative', overflow:'hidden'}}>
      <div style={{position:'absolute', inset:0, opacity:.9}}>
        <Shader palette="warm" intensity={1.1}/>
      </div>
      <div style={{maxWidth:1200, margin:'0 auto', position:'relative', zIndex:2, textAlign:'center'}}>
        <Reveal>
          <Kicker>08 · Empezá</Kicker>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 style={{fontSize:'clamp(64px, 13vw, 220px)', fontWeight:700, letterSpacing:'-.06em', lineHeight:.88, margin:'20px auto 0', maxWidth:1100, textWrap:'balance'}}>
            Empezá <i style={{fontStyle:'italic', fontWeight:500, color:'var(--blue)'}}>hoy.</i><br/>
            Es <span style={{background:'var(--ink)', color:'var(--paper)', padding:'0 .15em', borderRadius:'.1em', transform:'skewX(-4deg)', display:'inline-block'}}>gratis.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p style={{fontSize:19, color:'var(--ink-2)', margin:'32px auto 0', maxWidth:520, lineHeight:1.5}}>
            Registrate en segundos. Sin tarjeta de crédito. Sin compromisos. Probalo ya mismo.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div style={{display:'flex', gap:12, justifyContent:'center', marginTop:40, flexWrap:'wrap'}}>
            <MagBtn variant="ink" onClick={onEnter}>Crear cuenta gratis</MagBtn>
            <MagBtn variant="line" onClick={()=>document.getElementById('features')?.scrollIntoView({behavior:'smooth'})} icon="arrow">Ver funciones</MagBtn>
          </div>
        </Reveal>
        <Reveal delay={0.4}>
          <div style={{display:'flex', justifyContent:'center', gap:24, marginTop:36, flexWrap:'wrap', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ink)'}}>
            {['✓ Match instantáneo','✓ Docentes verificados','✓ Búsqueda con IA','✓ Privacidad primero'].map(x=>(
              <span key={x}>{x}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

window.CTA = CTA;
