// Hero split-screen animado aprender / enseñar
function Hero({onEnter}){
  const w = useWindowWidth();
  const isMobile = w <= 640;
  const [side, setSide] = React.useState(null); // null | 'learn' | 'teach'
  const [query, setQuery] = React.useState('fotografía de retrato nocturno');
  const ref = React.useRef(null);

  // parallax del orbe shader
  const [p, setP] = React.useState(0);
  React.useEffect(()=>{
    const onScroll = ()=>{
      const el = ref.current; if(!el) return;
      const r = el.getBoundingClientRect();
      const k = 1 - Math.max(0, Math.min(1, (r.bottom)/window.innerHeight));
      setP(k);
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
    return ()=>window.removeEventListener('scroll', onScroll);
  },[]);

  const leftPct = side==='learn' ? 68 : side==='teach' ? 32 : 50;

  return (
    <section id="inicio" ref={ref} style={{position:'relative', padding:'40px 0 0', overflow:'hidden'}}>
      {/* Shader background */}
      <div style={{position:'absolute', inset:0, opacity:.68, pointerEvents:'none', maskImage:'radial-gradient(ellipse at 50% 40%, black 55%, transparent 90%)', WebkitMaskImage:'radial-gradient(ellipse at 50% 40%, black 55%, transparent 90%)'}}>
        <Shader palette="deep" intensity={1}/>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding: isMobile ? '0 16px' : '0 28px', position:'relative'}}>

        {/* Kicker + meta */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:20, flexWrap:'wrap', marginBottom:24}}>
          <Reveal>
            <Kicker color="var(--ink)">● Luderis · Buenos Aires, 2026</Kicker>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              <Pill>▲ 12.4K alumnos activos</Pill>
              <Pill>◆ 3.218 docentes</Pill>
            </div>
          </Reveal>
        </div>

        {/* Big headline */}
        <Reveal delay={0.15}>
          <h1 style={{
            fontSize:'clamp(56px, 11vw, 180px)',
            fontWeight:700,
            letterSpacing:'-.055em',
            lineHeight:.92,
            margin:'16px 0 0',
            color:'var(--ink)',
            textWrap:'balance'
          }}>
            Aprendé<br/>
            <span style={{display:'inline-flex', alignItems:'center', gap:'.15em', flexWrap:'wrap'}}>
              <span>lo que</span>
              <InlineMorph/>
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.25}>
          <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:40, marginTop:28, flexWrap:'wrap'}}>
            <p style={{
              fontSize:19, lineHeight:1.45, color:'var(--ink-2)',
              maxWidth:460, margin:0, textWrap:'pretty'
            }}>
              Siempre hay alguien dispuesto a enseñar lo que otro quiere aprender. Sin catálogo fijo, sin filtros que te limiten. Vos decidís qué, cuándo y cómo.
            </p>
            <div style={{display:'flex', gap:10, alignItems:'center'}}>
              <MagBtn onClick={onEnter} variant="ink">Crear cuenta</MagBtn>
              <MagBtn onClick={()=>document.getElementById('mundos')?.scrollIntoView({behavior:'smooth'})} variant="line" icon="arrow">Explorar</MagBtn>
            </div>
          </div>
        </Reveal>

        {/* AI Search bar */}
        <Reveal delay={0.35}>
          <div style={{marginTop:40, background:'var(--ink)', color:'var(--paper)', borderRadius:20, padding:6, display:'flex', alignItems:'center', gap:6, boxShadow:'0 20px 60px -20px oklch(0.15 0.03 260 / 0.5)'}}>
            <div style={{display:'flex', alignItems:'center', gap:10, padding:'10px 14px', color:'var(--paper)'}}>
              <SparkIcon/>
              <span style={{fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'.1em', opacity:.7}}>BUSCAR CON IA</span>
            </div>
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              data-cursor data-cursor-label="TYPE"
              style={{
                flex:1, minWidth:0, background:'transparent', border:'none', outline:'none',
                color:'var(--paper)', fontSize:17, fontFamily:'var(--font-display)', padding:'14px 0'
              }}
              placeholder="Quiero aprender..."
            />
            <button data-cursor data-cursor-label="ENTER" style={{
              background:'var(--paper)', color:'var(--ink)', border:'none', borderRadius:16,
              padding:'12px 20px', fontFamily:'inherit', fontSize:14, fontWeight:600, display:'inline-flex', alignItems:'center', gap:8
            }}>
              Buscar <kbd style={{fontFamily:'var(--font-mono)', fontSize:10, padding:'2px 6px', background:'var(--line)', borderRadius:4}}>↵</kbd>
            </button>
          </div>
        </Reveal>

        {/* Chips de sugerencia */}
        <Reveal delay={0.45}>
          <div style={{marginTop:14, display:'flex', gap:8, flexWrap:'wrap'}}>
            <span style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--muted)', letterSpacing:'.1em'}}>PROBÁ →</span>
            {['Python desde cero','Guitarra flamenca','Preparación para CBC','Inglés conversacional','Fotografía nocturna','Finanzas personales'].map((s,i)=>(
              <button key={s} onClick={()=>setQuery(s)} data-cursor style={{
                background:'transparent', border:'1px solid var(--line)', color:'var(--ink-2)',
                padding:'5px 12px', borderRadius:99, fontSize:12, fontFamily:'var(--font-mono)',
                transition:'all .2s'
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--ink)'; e.currentTarget.style.color='var(--paper)'; e.currentTarget.style.borderColor='var(--ink)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--ink-2)'; e.currentTarget.style.borderColor='var(--line)';}}>
                {s}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Split screen interactivo */}
      <Reveal delay={0.5}>
        <div style={{margin: isMobile ? '40px 16px 0' : '72px 28px 0', maxWidth:1344, marginLeft:'auto', marginRight:'auto'}}>
          <div className="lud-split" style={{
            position:'relative', borderRadius:28, overflow:'hidden',
            height: isMobile ? 'auto' : 420, display:'flex', flexDirection: isMobile ? 'column' : 'row', background:'var(--ink)',
            boxShadow:'0 30px 80px -30px oklch(0.2 0.05 260 / .35)'
          }}>
            {/* LEFT - APRENDER */}
            <div
              onMouseEnter={()=>setSide('learn')}
              onMouseLeave={()=>setSide(null)}
              onClick={onEnter}
              data-cursor data-cursor-label="APRENDER"
              style={{
                width: isMobile ? '100%' : `${leftPct}%`, minHeight: isMobile ? 300 : undefined,
                transition: isMobile ? 'none' : 'width .55s cubic-bezier(.2,.7,.2,1)',
                background:'var(--blue)', position:'relative', overflow:'hidden', padding:'38px 40px',
                display:'flex', flexDirection:'column', justifyContent:'space-between', color:'#fff'
              }}>
              <div style={{position:'absolute', inset:0, opacity:.75}}>
                <Shader palette="dark" intensity={1}/>
              </div>
              <div style={{position:'relative', zIndex:2, display:'flex', justifyContent:'space-between'}}>
                <Kicker color="#fff">◎ Modo alumno</Kicker>
                <span style={{fontFamily:'var(--font-mono)', fontSize:11, opacity:.8}}>01 / 02</span>
              </div>
              <div style={{position:'relative', zIndex:2}}>
                <div style={{fontSize:'clamp(48px, 7vw, 112px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.9}}>Aprender.</div>
                <p style={{maxWidth:360, fontSize:15, lineHeight:1.5, marginTop:14, opacity:.88}}>
                  Encontrá clases y cursos que realmente coincidan con tu objetivo. La IA entiende lo que buscás.
                </p>
                <div style={{display:'flex', gap:24, marginTop:22, flexWrap:'wrap'}}>
                  <Stat k="Cursos" v="3.4K"/>
                  <Stat k="Clases" v="14.2K"/>
                  <Stat k="Match promedio" v="< 2 min"/>
                </div>
              </div>
            </div>

            {/* RIGHT - ENSEÑAR */}
            <div
              onMouseEnter={()=>setSide('teach')}
              onMouseLeave={()=>setSide(null)}
              onClick={onEnter}
              data-cursor data-cursor-label="ENSEÑAR"
              style={{
                flex:1, background:'#160830', position:'relative', overflow:'hidden', padding:'38px 40px',
                display:'flex', flexDirection:'column', justifyContent:'space-between', color:'#fff'
              }}>
              <div style={{position:'absolute', inset:0, opacity:.75}}>
                <Shader palette="pedidos" intensity={1}/>
              </div>
              <div style={{position:'relative', zIndex:2, display:'flex', justifyContent:'space-between'}}>
                <Kicker color="#fff">◎ Modo docente</Kicker>
                <span style={{fontFamily:'var(--font-mono)', fontSize:11, opacity:.7}}>02 / 02</span>
              </div>
              <div style={{position:'relative', zIndex:2}}>
                <div style={{fontSize:'clamp(48px, 7vw, 112px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.9}}>Enseñar.</div>
                <p style={{maxWidth:360, fontSize:15, lineHeight:1.5, marginTop:14}}>
                  Publicá lo que sabés, poné tu precio y conectá directo con alumnos. Vos manejás tu agenda.
                </p>
                <div style={{display:'flex', gap:24, marginTop:22, flexWrap:'wrap'}}>
                  <Stat k="Docentes" v="3.2K"/>
                  <Stat k="Publicación" v="< 5 min"/>
                  <Stat k="Alumnos/mes" v="+8"/>
                </div>
              </div>
            </div>

            {/* Divisor con label */}
            <div aria-hidden style={{
              display: isMobile ? 'none' : 'block',
              position:'absolute', top:0, bottom:0, left:`${leftPct}%`,
              transform:'translateX(-50%)', width:2, background:'var(--paper)',
              transition:'left .55s cubic-bezier(.2,.7,.2,1)', zIndex:3, pointerEvents:'none'
            }}>
              <div style={{
                position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                width:46, height:46, borderRadius:'50%', background:'var(--paper)', color:'var(--ink)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, letterSpacing:'.05em',
                boxShadow:'0 8px 20px oklch(0 0 0 / .2)'
              }}>VS</div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Stat({k, v, dark=false}){
  return (
    <div>
      <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.12em', opacity:.88, textTransform:'uppercase'}}>{k}</div>
      <div style={{fontSize:26, fontWeight:700, letterSpacing:'-.03em', marginTop:2, color: dark? 'var(--ink)' : 'inherit'}}>{v}</div>
    </div>
  );
}

function InlineMorph(){
  const words = ['querés.','necesitás.','soñás.','imaginás.'];
  const [i,setI] = React.useState(0);
  React.useEffect(()=>{
    const t = setInterval(()=> setI(x=>(x+1)%words.length), 2200);
    return ()=>clearInterval(t);
  },[]);
  return (
    <span style={{
      display:'inline-flex', position:'relative', verticalAlign:'baseline',
      background:'var(--blue)', color:'var(--paper)',
      padding:'0 .24em', borderRadius:'.12em', overflow:'hidden',
      transform:'skewX(-4deg)', transition:'background .5s'
    }}>
      <span style={{display:'inline-block', transform:'skewX(4deg)', minWidth:'4ch'}} key={i}>
        <span style={{display:'inline-block', animation:'lud-morph .5s cubic-bezier(.2,.7,.2,1)'}}>{words[i]}</span>
      </span>
      <style>{`@keyframes lud-morph{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </span>
  );
}

function SparkIcon(){
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2l1.8 5.2L17 9l-5.2 1.8L10 16l-1.8-5.2L3 9l5.2-1.8L10 2z" fill="var(--orange)"/>
    </svg>
  );
}

Object.assign(window, {Hero});
