// Cómo funciona — scroll-driven con sticky
function How(){
  const w = useWindowWidth();
  const isMobile = w <= 640;
  const steps = [
    {n:'01', title:'Creá tu cuenta', desc:'Menos de un minuto. Solo email. Sin tarjeta, sin datos de más.', detail:'Email · Verificación · Listo'},
    {n:'02', title:'Decí qué querés', desc:'Buscá con IA en lenguaje natural o elegí entre categorías. El match es semántico, no por palabras exactas.', detail:'Prompt · Match · Resultados'},
    {n:'03', title:'Conectá directo', desc:'Chateá con el docente o el alumno sin intermediarios. Sin exponer datos personales. Acordá precio y horario.', detail:'Mensajes · Agenda · Acuerdo'},
    {n:'04', title:'Aprendé o enseñá', desc:'Seguí el progreso, rendí evaluaciones y descargá certificados verificables cuando termines.', detail:'Progreso · Tests · Certificado'},
  ];
  const sectionRef = React.useRef(null);
  const [active, setActive] = React.useState(0);

  React.useEffect(()=>{
    const onScroll = ()=>{
      const el = sectionRef.current; if(!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.max(0, Math.min(1, (-r.top)/total));
      const idx = Math.min(steps.length-1, Math.floor(p*steps.length*0.999));
      setActive(idx);
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
    return ()=>window.removeEventListener('scroll', onScroll);
  },[]);

  // Mobile: tab-selectable layout (no scroll-driven)
  if(isMobile){
    return (
      <section id="como" style={{position:'relative', background:'var(--blue-deep)', color:'var(--paper)', padding:'60px 16px 60px'}}>
        <div style={{position:'absolute', inset:0, opacity:.75}}>
          <Shader palette="dark"/>
        </div>
        <div style={{position:'relative', zIndex:2}}>
          <Kicker color="var(--paper)">04 · Flujo</Kicker>
          <h2 style={{fontSize:'clamp(36px, 10vw, 56px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, margin:'18px 0 24px', maxWidth:720}}>
            En 4 pasos<br/>estás <i style={{fontStyle:'italic', fontWeight:500, color:'var(--orange)'}}>adentro.</i>
          </h2>

          {/* Step selector tabs */}
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:32}}>
            {steps.map((s,i)=>(
              <button key={s.n} onClick={()=>setActive(i)} style={{
                padding:'8px 16px', borderRadius:99, fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600,
                background: i===active ? 'var(--orange)' : 'transparent',
                color: i===active ? 'var(--ink)' : 'oklch(1 0 0 / .7)',
                border: i===active ? '1px solid var(--orange)' : '1px solid oklch(1 0 0 / .2)',
                transition:'all .3s'
              }}>PASO {s.n}</button>
            ))}
          </div>

          {/* Active step content */}
          <div style={{minHeight:200}}>
            <div style={{fontFamily:'var(--font-mono)', fontSize:13, color:'var(--orange)', marginBottom:12}}>PASO {steps[active].n}</div>
            <div style={{fontSize:'clamp(32px,8vw,52px)', fontWeight:700, letterSpacing:'-.04em', lineHeight:1}}>{steps[active].title}</div>
            <p style={{fontSize:16, lineHeight:1.55, color:'oklch(1 0 0 / .8)', margin:'16px 0 0'}}>{steps[active].desc}</p>
            <div style={{marginTop:18, display:'flex', flexWrap:'wrap', gap:8, fontFamily:'var(--font-mono)', fontSize:11, color:'oklch(1 0 0 / .55)'}}>
              {steps[active].detail.split(' · ').map((d,j)=>(
                <span key={j} style={{display:'flex', alignItems:'center', gap:6}}>{j>0 && <span>→</span>}{d}</span>
              ))}
            </div>
          </div>

          {/* Progress bar (clickeable) */}
          <div style={{display:'flex', gap:6, marginTop:32}}>
            {steps.map((_,i)=>(
              <button key={i} onClick={()=>setActive(i)} style={{
                flex:1, height:4, borderRadius:99, border:'none', padding:0,
                background: i<=active?'var(--orange)':'oklch(1 0 0 / .15)', transition:'background .4s'
              }}/>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="como" ref={sectionRef} style={{position:'relative', background:'var(--blue-deep)', color:'var(--paper)', padding:'0', height:`${steps.length*80}vh`}}>
      <div style={{position:'sticky', top:0, height:'100vh', overflow:'hidden'}}>
        <div style={{position:'absolute', inset:0, opacity:.75}}>
          <Shader palette="dark"/>
        </div>
        <div style={{position:'relative', zIndex:2, height:'100%', display:'flex', flexDirection:'column', padding:'80px 28px 60px', maxWidth:1344, margin:'0 auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:24}}>
            <div>
              <Kicker color="var(--paper)">04 · Flujo</Kicker>
              <h2 style={{fontSize:'clamp(44px, 6.5vw, 84px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, margin:'18px 0 0', maxWidth:720}}>
                En 4 pasos<br/>estás <i style={{fontStyle:'italic', fontWeight:500, color:'var(--orange)'}}>adentro.</i>
              </h2>
            </div>
            <div style={{fontFamily:'var(--font-mono)', fontSize:12, color:'oklch(1 0 0 / .5)', letterSpacing:'.1em'}}>SCROLL →</div>
          </div>

          <div style={{flex:1, display:'flex', alignItems:'center', position:'relative'}}>
            <div style={{width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center'}}>
              {/* Step detail */}
              <div style={{position:'relative', minHeight:300}}>
                {steps.map((s,i)=>(
                  <div key={s.n} style={{
                    position:'absolute', inset:0,
                    opacity: i===active?1:0,
                    transform: i===active?'translateY(0)':'translateY(20px)',
                    transition:'opacity .6s, transform .6s'
                  }}>
                    <div style={{fontFamily:'var(--font-mono)', fontSize:14, color:'var(--orange)', marginBottom:14}}>PASO {s.n}</div>
                    <div style={{fontSize:'clamp(42px,5vw,72px)', fontWeight:700, letterSpacing:'-.04em', lineHeight:1}}>{s.title}</div>
                    <p style={{fontSize:18, lineHeight:1.5, color:'oklch(1 0 0 / .7)', margin:'20px 0 0', maxWidth:440}}>{s.desc}</p>
                    <div style={{marginTop:22, display:'inline-flex', gap:8, fontFamily:'var(--font-mono)', fontSize:11, color:'oklch(1 0 0 / .5)'}}>
                      {s.detail.split(' · ').map((d,j)=>(
                        <span key={j}>{j>0 && <span style={{marginRight:8}}>→</span>}{d}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Visual: stepper */}
              <div>
                <div style={{display:'flex', flexDirection:'column', gap:10}}>
                  {steps.map((s,i)=>(
                    <div key={s.n} style={{
                      display:'flex', alignItems:'center', gap:16,
                      padding:'16px 20px', borderRadius:16,
                      background: i===active ? 'oklch(1 0 0 / .08)' : 'transparent',
                      border: '1px solid ' + (i===active ? 'oklch(1 0 0 / .2)' : 'oklch(1 0 0 / .06)'),
                      transition:'all .5s'
                    }}>
                      <div style={{
                        width:44, height:44, borderRadius:12,
                        background: i===active ? 'var(--orange)' : 'transparent',
                        color: i===active ? 'var(--ink)' : 'var(--paper)',
                        border: i===active ? '1px solid var(--orange)' : '1px solid oklch(1 0 0 / .2)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600,
                        transition:'all .5s'
                      }}>{s.n}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:17, fontWeight:600, letterSpacing:'-.01em'}}>{s.title}</div>
                        <div style={{fontFamily:'var(--font-mono)', fontSize:10, color:'oklch(1 0 0 / .45)', marginTop:2}}>{s.detail}</div>
                      </div>
                      {i===active && <div style={{width:8, height:8, borderRadius:'50%', background:'var(--orange)', boxShadow:'0 0 0 4px oklch(0.72 0.2 55 / .3)'}}/>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* progress bar */}
          <div style={{display:'flex', gap:6, marginTop:20}}>
            {steps.map((_,i)=>(
              <div key={i} style={{flex:1, height:3, borderRadius:99, background: i<=active?'var(--orange)':'oklch(1 0 0 / .12)', transition:'background .4s'}}/>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

window.How = How;
