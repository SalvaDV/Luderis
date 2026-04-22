// Contacto
function Contact(){
  const [form, setForm] = React.useState({nombre:'', email:'', msg:''});
  const [ok, setOk] = React.useState(false);
  return (
    <section id="contacto" style={{padding:'120px 28px', background:'var(--paper-2)', borderTop:'1px solid var(--line)'}}>
      <div style={{maxWidth:1344, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'flex-start'}} className="lud-contact-grid">
        <Reveal>
          <Kicker>09 · Contacto</Kicker>
          <h2 style={{fontSize:'clamp(44px, 6vw, 84px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, margin:'18px 0 24px', textWrap:'balance'}}>
            ¿Preguntas?<br/><i style={{fontStyle:'italic', fontWeight:500, color:'var(--blue)'}}>Escribinos.</i>
          </h2>
          <p style={{fontSize:17, lineHeight:1.55, color:'var(--ink-2)', margin:'0 0 32px', maxWidth:440}}>
            Respondemos en menos de 24 horas. También podés escribirnos directo por mail.
          </p>
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            {[
              {k:'EMAIL', v:'contacto@luderis.com'},
              {k:'UBICACIÓN', v:'Buenos Aires, Argentina'},
              {k:'HORARIO', v:'Lun–Vie 9:00–18:00 ART'},
              {k:'RESPUESTA', v:'< 24 horas'},
            ].map(c=>(
              <div key={c.k} style={{display:'flex', alignItems:'baseline', gap:16, padding:'14px 0', borderBottom:'1px solid var(--line)'}}>
                <div style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.14em', color:'var(--muted)', minWidth:100}}>{c.k}</div>
                <div style={{fontSize:16, fontWeight:500}}>{c.v}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {ok ? (
            <div style={{background:'var(--ink)', color:'var(--paper)', borderRadius:24, padding:'48px 32px', textAlign:'center'}}>
              <div style={{fontSize:48, marginBottom:16}}>✓</div>
              <div style={{fontSize:24, fontWeight:700, letterSpacing:'-.02em', marginBottom:10}}>¡Mensaje enviado!</div>
              <p style={{color:'oklch(1 0 0 / .7)', fontSize:14, margin:0}}>Te respondemos en menos de 24 horas a {form.email}.</p>
            </div>
          ) : (
            <form onSubmit={e=>{e.preventDefault(); if(form.nombre&&form.email&&form.msg) setOk(true);}} style={{background:'var(--paper)', border:'1px solid var(--line)', borderRadius:24, padding:'32px', display:'flex', flexDirection:'column', gap:16}}>
              <div style={{fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'.14em', color:'var(--muted)', textTransform:'uppercase', marginBottom:4}}>Enviá tu mensaje</div>
              {[
                {k:'nombre', l:'Nombre', t:'text'},
                {k:'email', l:'Email', t:'email'},
              ].map(f=>(
                <div key={f.k}>
                  <label style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.14em', color:'var(--muted)', textTransform:'uppercase'}}>{f.l}</label>
                  <input type={f.t} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} data-cursor
                    style={{width:'100%', border:'none', borderBottom:'1px solid var(--line)', padding:'10px 0', fontSize:18, fontFamily:'inherit', background:'transparent', outline:'none', color:'var(--ink)'}}
                    onFocus={e=>e.currentTarget.style.borderColor='var(--ink)'}
                    onBlur={e=>e.currentTarget.style.borderColor='var(--line)'}/>
                </div>
              ))}
              <div>
                <label style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.14em', color:'var(--muted)', textTransform:'uppercase'}}>Mensaje</label>
                <textarea rows={4} value={form.msg} onChange={e=>setForm(p=>({...p,msg:e.target.value}))} data-cursor
                  style={{width:'100%', border:'none', borderBottom:'1px solid var(--line)', padding:'10px 0', fontSize:18, fontFamily:'inherit', background:'transparent', outline:'none', resize:'vertical', color:'var(--ink)'}}/>
              </div>
              <div style={{marginTop:8}}>
                <MagBtn variant="ink">Enviar mensaje</MagBtn>
              </div>
            </form>
          )}
        </Reveal>
      </div>
      <style>{`
        @media (max-width: 900px){ .lud-contact-grid{ grid-template-columns: 1fr !important; gap: 40px !important;}}
      `}</style>
    </section>
  );
}

window.Contact = Contact;
