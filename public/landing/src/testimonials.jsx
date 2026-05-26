// Early Access — reemplaza testimonios, honesto y convierte
function Testimonials(){
  const [email, setEmail] = React.useState('');
  const [done, setDone]   = React.useState(false);
  const [err, setErr]     = React.useState(false);

  const submit = (e)=>{
    e.preventDefault();
    if(!email || !email.includes('@')){ setErr(true); return; }
    setErr(false);
    setDone(true);
    // TODO: conectar con backend / Supabase
  };

  return (
    <section style={{
      padding:'140px 28px',
      position:'relative', overflow:'hidden',
      background:'linear-gradient(160deg, #07102A 0%, #0D2055 50%, #071428 100%)'
    }}>
      {/* Orbe decorativo */}
      <div aria-hidden style={{
        position:'absolute', width:800, height:800, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(26,110,216,0.18) 0%, transparent 70%)',
        left:'50%', top:'50%', transform:'translate(-50%,-50%)',
        pointerEvents:'none'
      }}/>

      <div style={{maxWidth:680, margin:'0 auto', textAlign:'center', position:'relative', zIndex:2}}>
        <Reveal>
          <Kicker color="rgba(255,255,255,0.5)">07 · Acceso temprano</Kicker>
          <h2 style={{
            fontSize:'clamp(48px, 8vw, 110px)',
            fontWeight:700, letterSpacing:'-.055em', lineHeight:.9,
            margin:'20px 0 0', color:'#fff', textWrap:'balance'
          }}>
            Somos nuevos.<br/>
            <i style={{fontStyle:'italic', fontWeight:500, color:'#7EFAEA'}}>Vos llegás primero.</i>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p style={{
            fontSize:18, lineHeight:1.55, color:'rgba(255,255,255,0.65)',
            margin:'28px auto 0', maxWidth:480
          }}>
            Luderis está en etapa de lanzamiento. Anotate y te avisamos cuando tu acceso esté listo — sin spam, sin compromisos.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          {done ? (
            <div style={{
              marginTop:44, padding:'40px 32px',
              background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(126,250,234,0.25)',
              borderRadius:20,
              display:'flex', flexDirection:'column', alignItems:'center', gap:12
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7EFAEA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12.5l3 3 5-6"/>
              </svg>
              <div style={{fontSize:20, fontWeight:700, color:'#fff', letterSpacing:'-.02em'}}>¡Te anotamos!</div>
              <div style={{fontSize:14, color:'rgba(255,255,255,0.55)', fontFamily:'var(--font-mono)'}}>
                Te avisamos a <span style={{color:'#7EFAEA'}}>{email}</span> cuando estés listo.
              </div>
            </div>
          ) : (
            <form onSubmit={submit} style={{marginTop:44}}>
              <div style={{
                display:'flex', gap:8, background:'rgba(255,255,255,0.07)',
                border:`1px solid ${err ? '#D85AA3' : 'rgba(255,255,255,0.12)'}`,
                borderRadius:16, padding:6, maxWidth:480, margin:'0 auto',
                transition:'border-color .25s'
              }}>
                <input
                  type="email"
                  value={email}
                  onChange={e=>{ setEmail(e.target.value); setErr(false); }}
                  placeholder="tu@email.com"
                  data-cursor
                  style={{
                    flex:1, background:'transparent', border:'none', outline:'none',
                    color:'#fff', fontSize:16, fontFamily:'var(--font-display)',
                    padding:'12px 16px', minWidth:0
                  }}
                />
                <button type="submit" data-cursor style={{
                  background:'#fff', color:'var(--ink)',
                  border:'none', borderRadius:11, padding:'12px 22px',
                  fontFamily:'var(--font-display)', fontSize:14, fontWeight:700,
                  cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
                  transition:'opacity .2s'
                }}
                onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                  Quiero acceso
                </button>
              </div>
              {err && (
                <div style={{marginTop:10, fontFamily:'var(--font-mono)', fontSize:12, color:'#D85AA3'}}>
                  Ingresá un email válido.
                </div>
              )}
            </form>
          )}
        </Reveal>

        <Reveal delay={0.3}>
          <div style={{
            display:'flex', justifyContent:'center', gap:28,
            marginTop:36, flexWrap:'wrap',
            fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.35)',
            letterSpacing:'.06em'
          }}>
            {['Sin spam','Gratis para siempre','Cancelás cuando querés'].map(x=>(
              <span key={x} style={{display:'inline-flex', alignItems:'center', gap:6}}>
                <span style={{width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'inline-block'}}/>
                {x}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

window.Testimonials = Testimonials;
