// Sección para docentes — lado oferta del marketplace
function Testimonials({onEnter}){
  const benefits = [
    { n:'01', k:'Tu precio, tus reglas', v:'Vos fijás cuánto cobrás por clase o por curso. Sin negociar con nadie.' },
    { n:'02', k:'Publicás en minutos', v:'Cargá tu perfil, describí lo que enseñás y empezás a recibir consultas.' },
    { n:'03', k:'Alumnos que ya buscan', v:'La IA conecta tu oferta con alumnos que buscan exactamente lo que sabés.' },
    { n:'04', k:'Pagos directos', v:'MercadoPago integrado. Sin demoras, sin intermediarios en la plata.' },
  ];

  return (
    <section style={{
      padding:'140px 28px',
      position:'relative', overflow:'hidden',
      background:'linear-gradient(160deg, #07102A 0%, #0D2055 50%, #071428 100%)'
    }}>
      {/* Orbe decorativo */}
      <div aria-hidden style={{
        position:'absolute', width:900, height:900, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(26,110,216,0.14) 0%, transparent 65%)',
        left:'50%', top:'50%', transform:'translate(-50%,-50%)',
        pointerEvents:'none'
      }}/>

      <div style={{maxWidth:1200, margin:'0 auto', position:'relative', zIndex:2}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center'}} className="lud-doc-grid">

          {/* Left — headline + CTA */}
          <Reveal>
            <Kicker color="rgba(255,255,255,0.45)">07 · Para docentes</Kicker>
            <h2 style={{
              fontSize:'clamp(48px, 7vw, 100px)',
              fontWeight:700, letterSpacing:'-.055em', lineHeight:.9,
              margin:'20px 0 0', color:'#fff', textWrap:'balance'
            }}>
              Enseñás algo que amás.<br/>
              <i style={{fontStyle:'italic', fontWeight:500, color:'#7EFAEA'}}>Empezá a cobrar hoy.</i>
            </h2>
            <p style={{
              fontSize:18, lineHeight:1.55, color:'rgba(255,255,255,0.6)',
              margin:'28px 0 40px', maxWidth:440
            }}>
              Publicá tus clases o cursos en minutos. Conectá directo con alumnos que ya están buscando lo que sabés enseñar.
            </p>
            <div style={{display:'flex', gap:12, flexWrap:'wrap', alignItems:'center'}}>
              <MagBtn onClick={onEnter} variant="paper">Crear perfil docente</MagBtn>
              <span style={{fontFamily:'var(--font-mono)', fontSize:12, color:'rgba(255,255,255,0.35)'}}>Es gratis, siempre.</span>
            </div>
          </Reveal>

          {/* Right — benefits grid */}
          <Reveal delay={0.15}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              {benefits.map(b=>(
                <div key={b.n} style={{
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:16, padding:'24px'
                }}>
                  <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.14em', color:'rgba(126,250,234,0.7)', marginBottom:10}}>{b.n}</div>
                  <div style={{fontSize:16, fontWeight:700, color:'#fff', letterSpacing:'-.02em', marginBottom:8}}>{b.k}</div>
                  <p style={{fontSize:13, lineHeight:1.55, color:'rgba(255,255,255,0.45)', margin:0}}>{b.v}</p>
                </div>
              ))}
            </div>
          </Reveal>

        </div>
      </div>

      <style>{`@media(max-width:900px){.lud-doc-grid{grid-template-columns:1fr!important;gap:48px!important;}}`}</style>
    </section>
  );
}

window.Testimonials = Testimonials;
