// Testimonios
function Testimonials(){
  const items = [
    {n:'Martina L.', r:'Alumna · Matemática', t:'Encontré una profesora increíble en 2 minutos. La búsqueda con IA me recomendó exactamente lo que necesitaba para rendir el final.', c:'var(--blue)'},
    {n:'Carlos R.', r:'Docente · Guitarra', t:'Empecé a subir mis clases hace un mes y ya tengo 8 alumnos. La plataforma es facilísima y llegan alumnos solos.', c:'var(--orange)'},
    {n:'Sofía M.', r:'Alumna · Inglés', t:'Me gustó que pude ver el perfil del docente con reseñas reales antes de inscribirme. Nada de sorpresas.', c:'var(--ink)'},
    {n:'Juan P.', r:'Docente · Programación', t:'Los certificados verificables y las evaluaciones automáticas me ahorran horas. Hecho con cabeza.', c:'var(--blue-deep)'},
    {n:'Valentina G.', r:'Alumna · Piano', t:'En una semana encontré al profe ideal. El sistema de reseñas y perfiles verificados le da mucha confianza.', c:'var(--orange)'},
    {n:'Rodrigo B.', r:'Docente · Física', t:'Mis alumnos pueden ver su progreso en tiempo real y eso los mantiene motivados. La diferencia se nota en los resultados.', c:'var(--blue)'},
  ];

  const Card = ({it,i})=>(
    <div style={{width:400, background:'var(--paper)', border:'1px solid var(--line)', borderRadius:20, padding:'26px', display:'inline-block', whiteSpace:'normal', verticalAlign:'top', marginRight:16, transition:'transform .3s, box-shadow .3s'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px oklch(0 0 0 / .08)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none';}}>
      <div style={{display:'flex', gap:3, marginBottom:12}}>
        {[0,1,2,3,4].map(j=><SvgStar key={j}/>)}
      </div>
      <p style={{fontSize:16, lineHeight:1.55, margin:'0 0 20px', color:'var(--ink)', textWrap:'pretty'}}>"{it.t}"</p>
      <div style={{display:'flex', alignItems:'center', gap:10, paddingTop:16, borderTop:'1px solid var(--line)'}}>
        <div style={{width:38, height:38, borderRadius:'50%', background:it.c, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0}}>{it.n[0]}</div>
        <div>
          <div style={{fontSize:14, fontWeight:600}}>{it.n}</div>
          <div style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--muted)'}}>{it.r}</div>
        </div>
      </div>
    </div>
  );

  return (
    <section style={{padding:'120px 0', background:'var(--paper-2)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', overflow:'hidden'}}>
      <div style={{maxWidth:1344, margin:'0 auto', marginBottom:60, padding:'0 28px'}}>
        <Reveal>
          <Kicker>07 · Voces</Kicker>
          <h2 style={{fontSize:'clamp(44px, 7vw, 92px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, margin:'18px 0 0', maxWidth:900}}>
            Lo que dicen <i style={{fontStyle:'italic', fontWeight:500, color:'var(--blue)'}}>los que ya usan</i> Luderis.
          </h2>
        </Reveal>
      </div>
      {/* Fila 1 — izquierda */}
      <Marquee speed={60} style={{marginBottom:16}}>
        {items.map((it,i)=><Card key={i} it={it} i={i}/>)}
      </Marquee>
      {/* Fila 2 — derecha (reverse) */}
      <Marquee speed={50} reverse>
        {[...items].reverse().map((it,i)=><Card key={i} it={it} i={i}/>)}
      </Marquee>
    </section>
  );
}

window.Testimonials = Testimonials;
