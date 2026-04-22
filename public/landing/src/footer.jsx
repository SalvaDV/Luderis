// Footer
function Footer(){
  const w = useWindowWidth();
  const isMobile = w <= 640;
  const isTablet = w <= 1024 && w > 640;
  const cols = [
    {h:'Producto', items:['Cursos','Clases particulares','Búsqueda con IA','Certificados','Pagos']},
    {h:'Empresa', items:['Nosotros','Carreras','Manifiesto','Press kit','Contacto']},
    {h:'Recursos', items:['Ayuda','Libro de Quejas','Changelog','Status','Blog']},
    {h:'Legal', items:['Términos','Devoluciones','Defensa al Consumidor','Privacidad','Accesibilidad']},
  ];
  return (
    <footer style={{background:'var(--ink)', color:'var(--paper)', padding:'80px 28px 32px', position:'relative', overflow:'hidden'}}>
      <div style={{position:'absolute', inset:0, opacity:.55}}>
        <Shader palette="dark"/>
      </div>
      <div style={{maxWidth:1344, margin:'0 auto', position:'relative', zIndex:2}}>
        {/* Big wordmark */}
        <div style={{fontSize:'clamp(100px, 22vw, 360px)', fontWeight:700, letterSpacing:'-.06em', lineHeight:.88, marginBottom:60, color:'transparent', WebkitTextStroke:'1px oklch(1 0 0 / .3)'}}>
          luderis
        </div>

        <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3, 1fr)' : '1.3fr repeat(4, 1fr)', gap:40, marginBottom:60}} className="lud-footer-grid">
          <div>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:16}}>
              <LudLogo size={32}/>
              <span style={{fontSize:22, fontWeight:700, letterSpacing:'-.03em'}}>Luderis</span>
            </div>
            <p style={{fontSize:14, lineHeight:1.6, color:'oklch(1 0 0 / .65)', maxWidth:280, margin:0}}>
              Plataforma argentina de educación entre personas. Aprendé lo que querés, enseñá lo que sabés.
            </p>
            <div style={{marginTop:24, fontFamily:'var(--font-mono)', fontSize:11, color:'oklch(1 0 0 / .45)', letterSpacing:'.1em'}}>
              contacto@luderis.com
            </div>
          </div>
          {cols.map(c=>(
            <div key={c.h}>
              <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.14em', color:'oklch(1 0 0 / .5)', textTransform:'uppercase', marginBottom:18}}>{c.h}</div>
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                {c.items.map(i=>{
                  const legalLinks={'Términos':'/terminos','Devoluciones':'/devoluciones','Defensa al Consumidor':'/consumidor','Privacidad':'/privacidad','Accesibilidad':'/accesibilidad','Ayuda':'/ayuda','Libro de Quejas':'/quejas'};
                  const href=legalLinks[i]||'#';
                  return(
                  <a key={i} href={href} data-cursor style={{fontSize:14, color:'var(--paper)', transition:'opacity .2s'}}
                    onMouseEnter={e=>e.currentTarget.style.opacity='.6'}
                    onMouseLeave={e=>e.currentTarget.style.opacity='1'}>{i}</a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{borderTop:'1px solid oklch(1 0 0 / .15)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16, fontFamily:'var(--font-mono)', fontSize:11, color:'oklch(1 0 0 / .55)'}}>
          <div>© {new Date().getFullYear()} LUDERIS S.A. · BUENOS AIRES, ARGENTINA</div>
          <div style={{display:'flex', gap:20}}>
            <span>v2026.1 · LIVE</span>
            <span>● All systems operational</span>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px){ .lud-footer-grid{ grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 520px){ .lud-footer-grid{ grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}

window.Footer = Footer;
