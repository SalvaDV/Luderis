// Primitivos reutilizables

// Reveal: anima entrada al entrar en viewport
function Reveal({children, delay=0, y=24, className='', style={}, as='div'}){
  const ref = React.useRef(null);
  const [on, setOn] = React.useState(false);
  React.useEffect(()=>{
    const el = ref.current; if(!el) return;
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ setOn(true); io.unobserve(el); }});
    },{threshold:0.15, rootMargin:'0px 0px -80px 0px'});
    io.observe(el);
    return ()=>io.disconnect();
  },[]);
  const Tag = as;
  return (
    <Tag ref={ref} className={className} style={{
      ...style,
      opacity: on?1:0,
      transform: on?'translate3d(0,0,0)':`translate3d(0,${y}px,0)`,
      transition:`opacity .9s cubic-bezier(.2,.7,.2,1) ${delay}s, transform .9s cubic-bezier(.2,.7,.2,1) ${delay}s`,
      willChange:'opacity,transform'
    }}>
      {children}
    </Tag>
  );
}

// Counter animado
function Counter({to, suffix='', duration=1800}){
  const ref = React.useRef(null);
  const [val, setVal] = React.useState(0);
  React.useEffect(()=>{
    const el = ref.current; if(!el) return;
    let raf, started=false, t0;
    const step = (t)=>{
      if(!t0) t0 = t;
      const k = Math.min(1, (t - t0)/duration);
      const e = 1 - Math.pow(1-k, 3);
      setVal(Math.round(to*e));
      if(k<1) raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting && !started){ started=true; raf = requestAnimationFrame(step); io.unobserve(el); }
      });
    },{threshold:0.4});
    io.observe(el);
    return ()=>{ cancelAnimationFrame(raf); io.disconnect(); };
  },[to, duration]);
  const formatted = val.toLocaleString('es-AR');
  return <span ref={ref} style={{fontVariantNumeric:'tabular-nums'}}>{formatted}{suffix}</span>;
}

// Marquee horizontal infinito con soporte reverse y pausa en hover
function Marquee({children, speed=40, reverse=false, className='', style={}}){
  const [paused, setPaused] = React.useState(false);
  const anim = reverse ? 'lud-marquee-rev' : 'lud-marquee';
  return (
    <div className={className} style={{overflow:'hidden', whiteSpace:'nowrap', ...style}}
      onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
      <div style={{display:'inline-flex', animation:`${anim} ${speed}s linear infinite`, animationPlayState:paused?'paused':'running', gap:0}}>
        <div style={{display:'inline-flex', gap:40, paddingRight:40}}>{children}</div>
        <div style={{display:'inline-flex', gap:40, paddingRight:40}} aria-hidden>{children}</div>
      </div>
      <style>{`
        @keyframes lud-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes lud-marquee-rev{from{transform:translateX(-50%)}to{transform:translateX(0)}}
      `}</style>
    </div>
  );
}

// Barra de progreso de scroll pegada arriba
function ScrollProgress(){
  const [p, setP] = React.useState(0);
  React.useEffect(()=>{
    const fn = ()=>{
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      setP(window.scrollY / max);
    };
    window.addEventListener('scroll', fn, {passive:true});
    return ()=>window.removeEventListener('scroll', fn);
  },[]);
  return (
    <div aria-hidden style={{position:'fixed',top:0,left:0,right:0,height:3,zIndex:9999,pointerEvents:'none'}}>
      <div style={{height:'100%',background:'linear-gradient(90deg,var(--blue) 0%,var(--orange) 100%)',width:`${p*100}%`,transition:'width .08s linear',borderRadius:'0 3px 3px 0'}}/>
    </div>
  );
}

// Estrella SVG para testimonios
function SvgStar({color='var(--orange)',size=14}){
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{display:'block'}}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  );
}

// Kicker (etiqueta monoespaciada)
function Kicker({children, color='var(--ink)', dot=true}){
  return (
    <div style={{display:'inline-flex', alignItems:'center', gap:8, fontFamily:'var(--font-mono)', fontSize:11, fontWeight:500, letterSpacing:'.12em', textTransform:'uppercase', color}}>
      {dot && <span style={{width:6, height:6, borderRadius:'50%', background:color, boxShadow:`0 0 0 3px ${color}22`}}/>}
      {children}
    </div>
  );
}

// Pill
function Pill({children, variant='line'}){
  const styles = {
    line: {border:'1px solid var(--line)', background:'transparent'},
    ink:  {border:'1px solid var(--ink)', background:'var(--ink)', color:'var(--paper)'},
    blue: {border:'1px solid var(--blue)', background:'var(--blue)', color:'#fff'},
  }[variant];
  return <span style={{display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:99, fontFamily:'var(--font-mono)', fontSize:11, fontWeight:500, letterSpacing:'.06em', ...styles}}>{children}</span>;
}

// Magnetic button: atrae el cursor sutilmente
function MagBtn({children, onClick, variant='ink', style={}, icon='arrow', className=''}){
  const ref = React.useRef(null);
  React.useEffect(()=>{
    const el = ref.current; if(!el) return;
    const strength = 14;
    const onMove = (e)=>{
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width/2);
      const y = e.clientY - (r.top + r.height/2);
      el.style.transform = `translate(${x/r.width*strength}px, ${y/r.height*strength}px)`;
    };
    const onLeave = ()=>{ el.style.transform = 'translate(0,0)'; };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return ()=>{ el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave); };
  },[]);

  const vs = {
    ink:      {background:'var(--ink)', color:'var(--paper)', border:'1px solid var(--ink)'},
    blue:     {background:'var(--blue)', color:'#fff', border:'1px solid var(--blue)'},
    orange:   {background:'var(--orange)', color:'var(--ink)', border:'1px solid var(--orange)'},
    line:     {background:'transparent', color:'var(--ink)', border:'1px solid var(--ink)'},
    paper:    {background:'var(--paper)', color:'var(--ink)', border:'1px solid var(--paper)'},
    gradient: {background:'linear-gradient(135deg, var(--blue) 0%, var(--orange) 100%)', color:'#fff', border:'none'},
  }[variant];

  return (
    <button ref={ref} onClick={onClick} data-cursor data-cursor-label="TAP" className={className}
      style={{
        ...vs,
        display:'inline-flex', alignItems:'center', gap:10,
        padding:'14px 22px', borderRadius:99,
        fontFamily:'var(--font-display)', fontSize:15, fontWeight:600, letterSpacing:'-.01em',
        transition:'transform .3s cubic-bezier(.2,.7,.2,1), background .2s, color .2s',
        willChange:'transform', ...style
      }}>
      <span>{children}</span>
      {icon==='arrow' && <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </button>
  );
}

// Noise overlay (grain)
function Grain({opacity=0.05, style={}}){
  return <div aria-hidden style={{
    position:'absolute', inset:0, pointerEvents:'none', mixBlendMode:'multiply', opacity,
    backgroundImage:`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
    ...style
  }}/>;
}

function useWindowWidth(){
  const [w, setW] = React.useState(window.innerWidth);
  React.useEffect(()=>{
    const h = ()=> setW(window.innerWidth);
    window.addEventListener('resize', h, {passive:true});
    return ()=> window.removeEventListener('resize', h);
  },[]);
  return w;
}

Object.assign(window, {Reveal, Counter, Marquee, Kicker, Pill, MagBtn, Grain, useWindowWidth, ScrollProgress, SvgStar});
