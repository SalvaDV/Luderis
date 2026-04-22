// Sección Dos mundos (Cursos / Clases particulares)
function Worlds({onEnter}){
  return (
    <section id="mundos" style={{padding:'140px 28px 120px', position:'relative'}}>
      <div style={{maxWidth:1344, margin:'0 auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:40, marginBottom:60, flexWrap:'wrap'}}>
          <Reveal>
            <Kicker>02 · Productos</Kicker>
            <h2 style={{fontSize:'clamp(44px, 7vw, 92px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, margin:'18px 0 0', textWrap:'balance', maxWidth:900}}>
              Una app.<br/>Dos formas <i style={{fontStyle:'italic', fontWeight:500, fontFamily:'var(--font-display)', color:'var(--blue)'}}>de aprender.</i>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{fontSize:16, lineHeight:1.5, color:'var(--ink-2)', maxWidth:320, margin:0}}>
              Cada modo tiene su identidad, su flujo y su propósito. Elegí el que se adapta a cómo querés aprender hoy.
            </p>
          </Reveal>
        </div>

        <div className="lud-worlds-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
          {/* CURSOS */}
          <Reveal delay={0.1}>
            <div data-cursor data-cursor-label="CURSOS" onClick={onEnter} style={{
              background:'var(--ink)', color:'var(--paper)', borderRadius:28, padding:'40px',
              position:'relative', overflow:'hidden', minHeight:540,
              display:'flex', flexDirection:'column', justifyContent:'space-between'
            }}>
              <div style={{position:'absolute', inset:0, opacity:.9}}>
                <Shader palette="warm"/>
              </div>
              <div style={{position:'relative', zIndex:2}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <Kicker color="var(--paper)">◎ Cursos estructurados</Kicker>
                  <div style={{fontFamily:'var(--font-mono)', fontSize:11, opacity:.5}}>01</div>
                </div>
                <h3 style={{fontSize:72, fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, margin:'24px 0 0'}}>
                  Cursos<br/><span style={{color:'#2EC4A0'}}>completos.</span>
                </h3>
                <p style={{fontSize:16, lineHeight:1.55, opacity:.92, margin:'20px 0 0', maxWidth:400}}>
                  Experiencias de aprendizaje de punta a punta. Contenido, evaluaciones, seguimiento, certificados.
                </p>
              </div>
              <div style={{position:'relative', zIndex:2, marginTop:40}}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'oklch(1 0 0 / .12)', border:'1px solid oklch(1 0 0 / .12)', borderRadius:14, overflow:'hidden'}}>
                  {[
                    ['Clases organizadas','Módulos + lecciones'],
                    ['Evaluaciones','Automáticas + revisadas'],
                    ['Certificados','Verificables'],
                    ['Foro grupal','Chat + archivos'],
                  ].map(([a,b],i)=>(
                    <div key={i} style={{background:'oklch(0.20 0.04 230)', padding:'16px 18px'}}>
                      <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.1em', opacity:.82, textTransform:'uppercase'}}>{a}</div>
                      <div style={{fontSize:14, fontWeight:500, marginTop:4}}>{b}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:24}}>
                  <span style={{fontFamily:'var(--font-mono)', fontSize:12, opacity:.88}}>3.428 cursos activos</span>
                  <MagBtn variant="paper" onClick={onEnter}>Explorar cursos</MagBtn>
                </div>
              </div>
            </div>
          </Reveal>

          {/* CLASES */}
          <Reveal delay={0.2}>
            <div data-cursor data-cursor-label="CLASES" onClick={onEnter} style={{
              background:'#100A00', color:'var(--paper)', borderRadius:28, padding:'40px',
              position:'relative', overflow:'hidden', minHeight:540,
              display:'flex', flexDirection:'column', justifyContent:'space-between'
            }}>
              <div style={{position:'absolute', inset:0, opacity:.9}}>
                <Shader palette="amber"/>
              </div>
              <div style={{position:'relative', zIndex:2}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <Kicker color="var(--paper)">◎ 1:1 a tu medida</Kicker>
                  <div style={{fontFamily:'var(--font-mono)', fontSize:11, opacity:.5}}>02</div>
                </div>
                <h3 style={{fontSize:72, fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, margin:'24px 0 0'}}>
                  Clases<br/><span style={{fontStyle:'italic', fontWeight:500, color:'#F4C030'}}>particulares.</span>
                </h3>
                <p style={{fontSize:16, lineHeight:1.55, margin:'20px 0 0', maxWidth:400, opacity:.93}}>
                  Conexión directa con un docente. Tu horario, tu ritmo, tu objetivo. Sin intermediarios.
                </p>
              </div>
              <div style={{position:'relative', zIndex:2, marginTop:40}}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'oklch(1 0 0 / .12)', border:'1px solid oklch(1 0 0 / .12)', borderRadius:14, overflow:'hidden'}}>
                  {[
                    ['Horarios','A tu medida'],
                    ['Chat directo','Sin intermediarios'],
                    ['Precio','Acordado 1:1'],
                    ['Duración','Vos elegís'],
                  ].map(([a,b],i)=>(
                    <div key={i} style={{background:'oklch(0.24 0.08 55)', padding:'16px 18px'}}>
                      <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.1em', opacity:.82, textTransform:'uppercase'}}>{a}</div>
                      <div style={{fontSize:14, fontWeight:500, marginTop:4}}>{b}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:24}}>
                  <span style={{fontFamily:'var(--font-mono)', fontSize:12, opacity:.88}}>14.203 clases esta semana</span>
                  <MagBtn variant="paper" onClick={onEnter}>Encontrar docente</MagBtn>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px){ .lud-worlds-grid{ grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

window.Worlds = Worlds;
