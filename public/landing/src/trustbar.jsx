// TrustBar — stack tecnológico real de Luderis
function TrustBar(){
  const techs = [
    { label:'MercadoPago', desc:'Pagos', color:'#00B1EA' },
    { label:'OpenAI',      desc:'Búsqueda IA', color:'#10A37F' },
    { label:'Google',      desc:'Autenticación', color:'#4285F4' },
    { label:'Supabase',    desc:'Base de datos', color:'#3ECF8E' },
    { label:'Vercel',      desc:'Infraestructura', color:'#fff' },
  ];

  return (
    <div style={{
      background:'var(--ink)',
      borderTop:'1px solid rgba(255,255,255,0.06)',
      borderBottom:'1px solid rgba(255,255,255,0.06)',
      padding:'28px 28px',
    }}>
      <div style={{maxWidth:1344, margin:'0 auto', display:'flex', alignItems:'center', gap:48, flexWrap:'wrap', justifyContent:'space-between'}} className="lud-trust-row">
        <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.16em', color:'oklch(1 0 0 / .35)', textTransform:'uppercase', flexShrink:0}}>
          Construido sobre
        </div>
        <div style={{display:'flex', gap:40, flexWrap:'wrap', alignItems:'center', flex:1, justifyContent:'center'}}>
          {techs.map(t=>(
            <div key={t.label} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
              <div style={{fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'.14em', textTransform:'uppercase', color:'oklch(1 0 0 / .3)'}}>{t.desc}</div>
              <div style={{fontSize:15, fontWeight:700, letterSpacing:'-.02em', color:t.color}}>{t.label}</div>
            </div>
          ))}
        </div>
        <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.14em', color:'oklch(1 0 0 / .25)', flexShrink:0}}>
          100% argentino
        </div>
      </div>
      <style>{`@media(max-width:640px){.lud-trust-row{gap:24px!important; justify-content:center!important;}}`}</style>
    </div>
  );
}

window.TrustBar = TrustBar;
