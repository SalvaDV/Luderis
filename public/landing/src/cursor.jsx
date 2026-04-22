// Cursor custom: orbe con trail + magnetic hover
function Cursor(){
  const dotRef = React.useRef(null);
  const ringRef = React.useRef(null);
  const stateRef = React.useRef({x:window.innerWidth/2,y:window.innerHeight/2, rx:window.innerWidth/2, ry:window.innerHeight/2, scale:1, tScale:1, label:''});
  const [label, setLabel] = React.useState('');

  React.useEffect(()=>{
    if(window.matchMedia('(pointer:coarse)').matches) return;

    const onMove = (e)=>{
      stateRef.current.x = e.clientX;
      stateRef.current.y = e.clientY;
      const el = e.target.closest('[data-cursor]');
      stateRef.current.tScale = el ? 2.4 : 1;
      const l = el ? (el.getAttribute('data-cursor-label')||'') : '';
      if(l !== stateRef.current.label){
        stateRef.current.label = l;
        setLabel(l);
      }
    };
    window.addEventListener('pointermove', onMove, {passive:true});

    let raf;
    const loop = ()=>{
      const s = stateRef.current;
      s.rx += (s.x - s.rx)*0.22;
      s.ry += (s.y - s.ry)*0.22;
      s.scale += (s.tScale - s.scale)*0.15;
      if(dotRef.current){
        dotRef.current.style.transform = `translate(${s.x-4}px,${s.y-4}px)`;
      }
      if(ringRef.current){
        ringRef.current.style.transform = `translate(${s.rx-18}px,${s.ry-18}px) scale(${s.scale})`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); };
  },[]);

  return (<>
    <div ref={dotRef} style={{
      position:'fixed', top:0, left:0, width:8, height:8, borderRadius:'50%',
      background:'var(--ink)', pointerEvents:'none', zIndex:9999, mixBlendMode:'difference'
    }}/>
    <div ref={ringRef} style={{
      position:'fixed', top:0, left:0, width:36, height:36, borderRadius:'50%',
      border:'1.5px solid var(--ink)', pointerEvents:'none', zIndex:9998, mixBlendMode:'difference',
      transition:'border-color .2s', display:'flex', alignItems:'center', justifyContent:'center'
    }}>
      {label && <span style={{fontFamily:'var(--font-mono)', fontSize:9, fontWeight:600, color:'var(--ink)', whiteSpace:'nowrap', transform:'translateY(0)', letterSpacing:'.5px'}}>{label}</span>}
    </div>
  </>);
}

window.Cursor = Cursor;
