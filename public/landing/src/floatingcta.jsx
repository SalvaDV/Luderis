// Floating sticky CTA — aparece al scrollear 600px
function FloatingCTA({onEnter}){
  const [visible, setVisible] = React.useState(false);

  React.useEffect(()=>{
    const onScroll = ()=> setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
    return ()=> window.removeEventListener('scroll', onScroll);
  },[]);

  return (
    <div aria-hidden={!visible} style={{
      position:'fixed', bottom:28, right:28, zIndex:900,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(.95)',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      transition:'transform .4s cubic-bezier(.2,.7,.2,1), opacity .35s ease',
    }}>
      <button onClick={onEnter} data-cursor style={{
        display:'inline-flex', alignItems:'center', gap:10,
        background:'var(--ink)', color:'var(--paper)',
        border:'none', borderRadius:99, padding:'14px 22px',
        fontFamily:'var(--font-display)', fontSize:14, fontWeight:600, cursor:'pointer',
        boxShadow:'0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.1)',
        transition:'transform .25s, box-shadow .25s',
      }}
      onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.12)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.1)';}}>
        <LudLogo size={20}/>
        Empezar gratis
      </button>
    </div>
  );
}

window.FloatingCTA = FloatingCTA;
