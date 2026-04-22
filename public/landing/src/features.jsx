// Features bento grid
function Features(){
  const w = useWindowWidth();
  const isMobile = w <= 640;
  const isTablet = w <= 1024 && w > 640;
  return (
    <section id="features" style={{padding:'120px 28px', background:'var(--paper-2)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)'}}>
      <div style={{maxWidth:1344, margin:'0 auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:40, marginBottom:60, flexWrap:'wrap'}}>
          <Reveal>
            <Kicker>03 · Funciones</Kicker>
            <h2 style={{fontSize:'clamp(44px, 7vw, 92px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, margin:'18px 0 0', maxWidth:900}}>
              Tecnología que <i style={{fontStyle:'italic', fontWeight:500, color:'var(--orange-deep)'}}>desaparece.</i>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{fontSize:16, lineHeight:1.5, color:'var(--ink-2)', maxWidth:340, margin:0}}>
              IA semántica, evaluaciones automatizadas, seguimiento en tiempo real. Todo integrado. Nada molesta.
            </p>
          </Reveal>
        </div>

        <div className="lud-bento" style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gridAutoRows: isMobile ? 'auto' : '180px', gap:16}}>

          {/* AI Search — grande */}
          <Reveal style={{gridColumn: isMobile ? 'span 1' : isTablet ? 'span 3' : 'span 4', gridRow: isMobile ? 'span 1' : 'span 2'}} className="lud-bento-item">
            <BentoCard>
              <div style={{position:'absolute', inset:0, opacity:1}}>
                <Shader palette="blue" intensity={1.05}/>
              </div>
              <div style={{position:'relative', zIndex:2, display:'flex', flexDirection:'column', height:'100%', justifyContent:'space-between'}}>
                <div>
                  <Kicker>● IA Semántica</Kicker>
                  <h3 style={{fontSize:44, fontWeight:700, letterSpacing:'-.04em', lineHeight:1, margin:'20px 0 0', maxWidth:460}}>
                    Describí con tus palabras.<br/>La IA encuentra el match.
                  </h3>
                </div>
                <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                  {['"preparación para el final de álgebra"','"guitarra para zurdo"','"inglés para entrevistas tech"'].map(q=>(
                    <span key={q} style={{background:'var(--ink)', color:'var(--paper)', padding:'8px 14px', borderRadius:99, fontFamily:'var(--font-mono)', fontSize:12}}>{q}</span>
                  ))}
                </div>
              </div>
            </BentoCard>
          </Reveal>

          {/* Privacidad */}
          <Reveal delay={0.08} style={{gridColumn: isMobile ? 'span 1' : isTablet ? 'span 3' : 'span 2', gridRow: isMobile ? 'span 1' : 'span 2'}}>
            <BentoCard dark>
              <Kicker color="var(--paper)">● Privacidad primero</Kicker>
              <div style={{fontSize:'clamp(48px,5vw,72px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, marginTop:20, color:'var(--paper)'}}>
                0 datos<br/>expuestos.
              </div>
              <p style={{color:'oklch(1 0 0 / .65)', fontSize:13, lineHeight:1.5, marginTop:14}}>
                Emails y contactos nunca se muestran. Chat interno end-to-end.
              </p>
            </BentoCard>
          </Reveal>

          {/* Cert */}
          <Reveal delay={0.1} style={{gridColumn: isMobile ? 'span 1' : isTablet ? 'span 1' : 'span 2'}}>
            <BentoCard>
              <Kicker>● Certificados</Kicker>
              <div style={{display:'flex', alignItems:'center', gap:12, marginTop:16}}>
                <div style={{width:48, height:48, borderRadius:10, background:'var(--ink)', color:'var(--paper)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600}}>✓</div>
                <div>
                  <div style={{fontSize:18, fontWeight:700, letterSpacing:'-.02em'}}>Verificables</div>
                  <div style={{fontSize:12, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>SHA · timestamp · firma</div>
                </div>
              </div>
            </BentoCard>
          </Reveal>

          {/* Chat */}
          <Reveal delay={0.12} style={{gridColumn: isMobile ? 'span 1' : isTablet ? 'span 1' : 'span 2'}}>
            <BentoCard accent="var(--orange)">
              <Kicker color="var(--ink)">● Chat integrado</Kicker>
              <div style={{marginTop:14, display:'flex', flexDirection:'column', gap:6}}>
                <Bubble side="in">¿Seguro tenés lugar martes 18hs?</Bubble>
                <Bubble side="out" accent>Sí, te mando el link ahora ✨</Bubble>
              </div>
            </BentoCard>
          </Reveal>

          {/* Seguimiento */}
          <Reveal delay={0.15} style={{gridColumn: isMobile ? 'span 1' : isTablet ? 'span 1' : 'span 2'}}>
            <BentoCard>
              <Kicker>● Seguimiento</Kicker>
              <div style={{marginTop:14}}>
                <div style={{fontSize:36, fontWeight:700, letterSpacing:'-.03em'}}>82%</div>
                <div style={{height:6, background:'var(--line)', borderRadius:99, marginTop:8, overflow:'hidden'}}>
                  <div style={{width:'82%', height:'100%', background:'var(--blue)', borderRadius:99}}/>
                </div>
                <div style={{fontSize:12, color:'var(--muted)', marginTop:8, fontFamily:'var(--font-mono)'}}>Álgebra · Unidad 3 de 4</div>
              </div>
            </BentoCard>
          </Reveal>

          {/* Pagos */}
          <Reveal delay={0.18} style={{gridColumn: isMobile ? 'span 1' : isTablet ? 'span 1' : 'span 2'}}>
            <BentoCard>
              <Kicker>● Pagos</Kicker>
              <div style={{marginTop:14}}>
                <div style={{fontSize:'clamp(32px,3vw,44px)', fontWeight:700, letterSpacing:'-.04em', lineHeight:1}}>Seguros <span style={{color:'var(--muted)', fontWeight:500}}>y simples</span></div>
                <div style={{fontSize:12, color:'var(--muted)', marginTop:6, fontFamily:'var(--font-mono)'}}>Mercado Pago · transferencia · tarjeta</div>
              </div>
            </BentoCard>
          </Reveal>

          {/* Disponibilidad */}
          <Reveal delay={0.22} style={{gridColumn: isMobile ? 'span 1' : isTablet ? 'span 3' : 'span 4'}}>
            <BentoCard>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                  <Kicker>● Agenda en vivo</Kicker>
                  <div style={{fontSize:24, fontWeight:700, letterSpacing:'-.03em', marginTop:14}}>Reservá en el slot que querés</div>
                </div>
                <span style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--muted)'}}>AHORA</span>
              </div>
              <div style={{display:'flex', gap:8, marginTop:18, flexWrap:'wrap'}}>
                {['Lun 09:00','Lun 14:00','Mar 10:00','Mar 16:00','Mie 11:00','Mie 17:00','Jue 09:00'].map((s,i)=>(
                  <span key={s} style={{
                    background: i===2?'var(--ink)':'transparent',
                    color: i===2?'var(--paper)':'var(--ink)',
                    border:'1px solid var(--ink)', borderRadius:8, padding:'6px 10px', fontFamily:'var(--font-mono)', fontSize:11
                  }}>{s}</span>
                ))}
              </div>
            </BentoCard>
          </Reveal>

        </div>
      </div>

      <style>{`
        @media (max-width: 1024px){ .lud-bento{ grid-template-columns: repeat(4, 1fr) !important; } }
        @media (max-width: 640px){ .lud-bento{ grid-template-columns: repeat(2, 1fr) !important; grid-auto-rows: 160px !important; } .lud-bento > *{ grid-column: span 2 !important; grid-row: auto !important; } }
      `}</style>
    </section>
  );
}

function BentoCard({children, dark=false, accent=null}){
  return (
    <div style={{
      width:'100%', height:'100%',
      background: accent || (dark ? 'var(--ink)' : 'var(--paper)'),
      color: dark ? 'var(--paper)' : 'var(--ink)',
      border: dark ? '1px solid var(--ink)' : '1px solid var(--line)',
      borderRadius:20, padding:'24px', position:'relative', overflow:'hidden',
      display:'flex', flexDirection:'column',
      transition:'transform .4s cubic-bezier(.2,.7,.2,1)'
    }}>
      {children}
    </div>
  );
}

function Bubble({children, side, accent=false}){
  return (
    <div style={{
      alignSelf: side==='out'?'flex-end':'flex-start',
      background: accent ? 'var(--ink)' : 'var(--paper)',
      color: accent ? 'var(--paper)' : 'var(--ink)',
      padding:'8px 12px', borderRadius:14,
      fontSize:12, fontWeight:500,
      border: '1px solid var(--ink)', maxWidth:'85%'
    }}>{children}</div>
  );
}

window.Features = Features;
