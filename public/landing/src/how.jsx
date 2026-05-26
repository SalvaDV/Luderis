// Cómo funciona — 4 step cards con timeline line + Reveal staggered
function How(){
  const w = useWindowWidth();
  const isMobile = w <= 640;
  const steps = [
    {n:'01', title:'Creá tu cuenta', desc:'Menos de un minuto. Solo email. Sin tarjeta, sin datos de más.', detail:['Email','Verificación','Listo'], icon:'👤'},
    {n:'02', title:'Decí qué querés', desc:'Buscá con IA en lenguaje natural. El match es semántico, no por palabras exactas.', detail:['Prompt','Match','Resultados'], icon:'🔍'},
    {n:'03', title:'Conectá directo', desc:'Chateá con el docente sin intermediarios. Sin exponer datos personales. Acordá precio y horario.', detail:['Mensajes','Agenda','Acuerdo'], icon:'💬'},
    {n:'04', title:'Aprendé o enseñá', desc:'Seguí el progreso, rendí evaluaciones y descargá certificados verificables.', detail:['Progreso','Tests','Certificado'], icon:'🎓'},
  ];

  return (
    <section id="como" style={{position:'relative', background:'var(--blue-deep)', color:'var(--paper)', padding: isMobile ? '80px 16px' : '120px 28px', overflow:'hidden'}}>
      <div style={{position:'absolute', inset:0, opacity:.65}}>
        <Shader palette="dark"/>
      </div>

      <div style={{position:'relative', zIndex:2, maxWidth:1344, margin:'0 auto'}}>
        <Reveal>
          <Kicker color="var(--paper)">04 · Flujo</Kicker>
          <h2 style={{fontSize:'clamp(44px, 6.5vw, 84px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, margin:'18px 0 0', maxWidth:720}}>
            En 4 pasos<br/>estás <i style={{fontStyle:'italic', fontWeight:500, color:'var(--orange)'}}>adentro.</i>
          </h2>
        </Reveal>

        <div style={{
          display:'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: isMobile ? 12 : 0,
          marginTop:60,
          position:'relative'
        }}>
          {/* Línea horizontal conectora — solo desktop */}
          {!isMobile && (
            <div aria-hidden style={{
              position:'absolute',
              top:44, left:'12.5%', right:'12.5%',
              height:1,
              background:'linear-gradient(90deg, transparent, oklch(1 0 0 / .2) 15%, oklch(1 0 0 / .2) 85%, transparent)',
              zIndex:0
            }}/>
          )}

          {steps.map((s,i)=>(
            <Reveal key={s.n} delay={i*0.12} style={{position:'relative', zIndex:1}}>
              <div style={{
                padding: isMobile ? '20px' : '0 24px',
                display:'flex', flexDirection: isMobile ? 'row' : 'column',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? 16 : 0,
                textAlign: isMobile ? 'left' : 'center'
              }}>
                {/* Número en círculo */}
                <div style={{
                  width:88, height:88, borderRadius:'50%', flexShrink:0,
                  background:'oklch(1 0 0 / .08)',
                  border:'1.5px solid oklch(1 0 0 / .18)',
                  display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center', gap:2,
                  backdropFilter:'blur(8px)',
                  ...(isMobile ? {} : {margin:'0 auto 28px'})
                }}>
                  <span style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--orange)', letterSpacing:'.1em', fontWeight:600}}>{s.n}</span>
                  <span style={{fontSize:22}}>{s.icon}</span>
                </div>

                <div style={isMobile ? {flex:1} : {}}>
                  <div style={{fontSize: isMobile ? 20 : 19, fontWeight:700, letterSpacing:'-.02em', marginBottom:10}}>{s.title}</div>
                  <p style={{fontSize:14, lineHeight:1.6, color:'oklch(1 0 0 / .68)', margin:'0 0 16px'}}>{s.desc}</p>
                  <div style={{display:'flex', flexWrap:'wrap', gap:6, justifyContent: isMobile ? 'flex-start' : 'center'}}>
                    {s.detail.map((d,j)=>(
                      <span key={d} style={{
                        display:'inline-flex', alignItems:'center', gap:4,
                        fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.08em',
                        color:'oklch(1 0 0 / .5)'
                      }}>
                        {j > 0 && <span style={{color:'oklch(1 0 0 / .25)'}}>→</span>}
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conector vertical en mobile */}
              {isMobile && i < steps.length-1 && (
                <div aria-hidden style={{width:1, height:24, background:'oklch(1 0 0 / .15)', margin:'4px 44px'}}/>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

window.How = How;
