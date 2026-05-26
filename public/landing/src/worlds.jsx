// WorldCard: mesh gradient + light leaks + grain + 3D tilt
function WorldCard({children, style, onClick, 'data-cursor':dc, 'data-cursor-label':dcl}){
  const ref = React.useRef(null);
  const onMove = (e)=>{
    const el = ref.current; if(!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left)/r.width - 0.5;
    const y = (e.clientY - r.top)/r.height - 0.5;
    el.style.transform = `perspective(1200px) rotateY(${x*8}deg) rotateX(${-y*8}deg) scale(1.02)`;
    el.style.boxShadow = `${-x*32}px ${-y*32}px 80px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.22)`;
  };
  const onLeave = ()=>{
    const el = ref.current; if(!el) return;
    el.style.transform = 'perspective(1200px) rotateY(0) rotateX(0) scale(1)';
    el.style.boxShadow = '0 24px 64px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.18)';
  };
  return (
    <div ref={ref} onClick={onClick} data-cursor={dc} data-cursor-label={dcl}
      onPointerMove={onMove} onPointerLeave={onLeave}
      style={{
        ...style,
        transition:'transform .55s cubic-bezier(.2,.7,.2,1), box-shadow .55s cubic-bezier(.2,.7,.2,1)',
        willChange:'transform', cursor:'pointer',
        boxShadow:'0 24px 64px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.18)'
      }}>
      {children}
    </div>
  );
}

// Sección Dos mundos
function Worlds({onEnter}){
  const w = useWindowWidth();
  const isMobile = w <= 640;

  // Grid cell glassmorphism style
  const cell = {
    background:'rgba(255,255,255,0.09)',
    backdropFilter:'blur(12px)',
    WebkitBackdropFilter:'blur(12px)',
    boxShadow:'inset 0 1px 0 rgba(255,255,255,0.14)',
    padding:'18px 20px'
  };

  return (
    <section id="mundos" style={{padding: isMobile ? '80px 16px 60px' : '140px 28px 120px', position:'relative'}}>
      <div style={{maxWidth:1344, margin:'0 auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:40, marginBottom:60, flexWrap:'wrap'}}>
          <Reveal>
            <Kicker>02 · Productos</Kicker>
            <h2 style={{fontSize:'clamp(44px, 7vw, 92px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, margin:'18px 0 0', textWrap:'balance', maxWidth:900}}>
              Una app.<br/>Dos formas <i style={{fontStyle:'italic', fontWeight:500, color:'var(--blue)'}}>de aprender.</i>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{fontSize:16, lineHeight:1.5, color:'var(--ink-2)', maxWidth:320, margin:0}}>
              Cada modo tiene su identidad, su flujo y su propósito. Elegí el que se adapta a cómo querés aprender hoy.
            </p>
          </Reveal>
        </div>

        <div className="lud-worlds-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>

          {/* ─── CURSOS — Electric Blue ─────────────────── */}
          <Reveal delay={0.1}>
            <WorldCard data-cursor data-cursor-label="CURSOS" onClick={onEnter} style={{
              background:`
                radial-gradient(ellipse at 5% 95%, rgba(34,215,200,0.55) 0%, transparent 48%),
                radial-gradient(ellipse at 92% 8%,  rgba(120,110,255,0.40) 0%, transparent 42%),
                radial-gradient(ellipse at 50% 50%, rgba(30,80,255,0.18) 0%, transparent 65%),
                #0D35CC
              `,
              color:'#fff', borderRadius:28, padding: isMobile ? '24px' : '44px',
              position:'relative', overflow:'hidden',
              minHeight: isMobile ? 'auto' : 560,
              display:'flex', flexDirection:'column', justifyContent:'space-between'
            }}>
              {/* Grain de textura */}
              <Grain opacity={0.04}/>

              {/* Light leak — teal en esquina inferior-izquierda */}
              <div aria-hidden style={{
                position:'absolute', width:260, height:260, borderRadius:'50%',
                background:'#22D8C8', filter:'blur(72px)', opacity:0.38,
                bottom:-80, left:-60, pointerEvents:'none'
              }}/>
              {/* Light leak — purpura en superior-derecha */}
              <div aria-hidden style={{
                position:'absolute', width:180, height:180, borderRadius:'50%',
                background:'#8878FF', filter:'blur(60px)', opacity:0.30,
                top:-50, right:-40, pointerEvents:'none'
              }}/>

              {/* Contenido */}
              <div style={{position:'relative', zIndex:2}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <Kicker color="rgba(255,255,255,0.75)" dot={false}>◈ Cursos estructurados</Kicker>
                  <span style={{fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.35)'}}>01</span>
                </div>
                <h3 style={{fontSize: isMobile ? 52 : 76, fontWeight:800, letterSpacing:'-.055em', lineHeight:.9, margin:'28px 0 0', textShadow:'0 2px 24px rgba(0,0,0,0.18)'}}>
                  Cursos<br/>
                  <span style={{color:'#7EFAEA', fontStyle:'italic', fontWeight:700}}>completos.</span>
                </h3>
                <p style={{fontSize:16, lineHeight:1.6, color:'rgba(255,255,255,0.82)', margin:'22px 0 0', maxWidth:400}}>
                  Experiencias de aprendizaje de punta a punta. Contenido, evaluaciones, seguimiento, certificados.
                </p>
              </div>

              <div style={{position:'relative', zIndex:2, marginTop:44}}>
                <div className="lud-worlds-feat-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.14)', borderRadius:16, overflow:'hidden'}}>
                  {[
                    ['Clases organizadas','Módulos + lecciones'],
                    ['Evaluaciones','Automáticas + revisadas'],
                    ['Certificados','Verificables on-chain'],
                    ['Foro grupal','Chat + archivos'],
                  ].map(([a,b],i)=>(
                    <div key={i} style={cell}>
                      <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.10em', color:'rgba(255,255,255,0.55)', textTransform:'uppercase', marginBottom:5}}>{a}</div>
                      <div style={{fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.92)'}}>{b}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex', justifyContent:'flex-end', alignItems:'center', marginTop:28}}>
                  <MagBtn variant="paper" onClick={onEnter}>Explorar cursos</MagBtn>
                </div>
              </div>
            </WorldCard>
          </Reveal>

          {/* ─── CLASES — Vibrant Amber ─────────────────── */}
          <Reveal delay={0.2}>
            <WorldCard data-cursor data-cursor-label="CLASES" onClick={onEnter} style={{
              background:`
                radial-gradient(ellipse at 5% 95%, rgba(255,210,40,0.60) 0%, transparent 48%),
                radial-gradient(ellipse at 92% 8%,  rgba(255,80,0,0.50) 0%, transparent 42%),
                radial-gradient(ellipse at 50% 50%, rgba(200,50,0,0.20) 0%, transparent 65%),
                #B83200
              `,
              color:'#fff', borderRadius:28, padding: isMobile ? '24px' : '44px',
              position:'relative', overflow:'hidden',
              minHeight: isMobile ? 'auto' : 560,
              display:'flex', flexDirection:'column', justifyContent:'space-between'
            }}>
              {/* Grain de textura */}
              <Grain opacity={0.04}/>

              {/* Light leak — gold en inferior-izquierda */}
              <div aria-hidden style={{
                position:'absolute', width:280, height:280, borderRadius:'50%',
                background:'#FFD028', filter:'blur(80px)', opacity:0.40,
                bottom:-90, left:-70, pointerEvents:'none'
              }}/>
              {/* Light leak — rojo-naranja en superior-derecha */}
              <div aria-hidden style={{
                position:'absolute', width:200, height:200, borderRadius:'50%',
                background:'#FF5000', filter:'blur(65px)', opacity:0.35,
                top:-50, right:-40, pointerEvents:'none'
              }}/>

              {/* Contenido */}
              <div style={{position:'relative', zIndex:2}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <Kicker color="rgba(255,255,255,0.75)" dot={false}>◈ 1:1 a tu medida</Kicker>
                  <span style={{fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.35)'}}>02</span>
                </div>
                <h3 style={{fontSize: isMobile ? 52 : 76, fontWeight:800, letterSpacing:'-.055em', lineHeight:.9, margin:'28px 0 0', textShadow:'0 2px 24px rgba(0,0,0,0.18)'}}>
                  Clases<br/>
                  <span style={{color:'#FFD84A', fontStyle:'italic', fontWeight:700}}>particulares.</span>
                </h3>
                <p style={{fontSize:16, lineHeight:1.6, color:'rgba(255,255,255,0.84)', margin:'22px 0 0', maxWidth:400}}>
                  Conexión directa con un docente. Tu horario, tu ritmo, tu objetivo. Sin intermediarios.
                </p>
              </div>

              <div style={{position:'relative', zIndex:2, marginTop:44}}>
                <div className="lud-worlds-feat-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.14)', borderRadius:16, overflow:'hidden'}}>
                  {[
                    ['Horarios','A tu medida'],
                    ['Chat directo','Sin intermediarios'],
                    ['Precio','Acordado 1:1'],
                    ['Duración','Vos elegís'],
                  ].map(([a,b],i)=>(
                    <div key={i} style={cell}>
                      <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.10em', color:'rgba(255,255,255,0.55)', textTransform:'uppercase', marginBottom:5}}>{a}</div>
                      <div style={{fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.92)'}}>{b}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex', justifyContent:'flex-end', alignItems:'center', marginTop:28}}>
                  <MagBtn variant="paper" onClick={onEnter}>Encontrar docente</MagBtn>
                </div>
              </div>
            </WorldCard>
          </Reveal>

        </div>
      </div>

      <style>{`
        @media (max-width: 860px){ .lud-worlds-grid{ grid-template-columns: 1fr !important; } }
        @media (max-width: 640px){ .lud-worlds-feat-grid{ grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

window.Worlds = Worlds;
