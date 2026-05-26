// Preview — mockup fiel al UI real de la app
function Preview({onEnter}){
  const w = useWindowWidth();
  const isMobile = w <= 900;
  const [tab, setTab] = React.useState('alumno');
  return (
    <section style={{padding:'140px 28px 120px', position:'relative', overflow:'hidden'}}>
      <div style={{maxWidth:1344, margin:'0 auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:40, flexWrap:'wrap', marginBottom:56}}>
          <Reveal>
            <Kicker>05 · Producto</Kicker>
            <h2 style={{fontSize:'clamp(44px, 7vw, 92px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, margin:'18px 0 0', maxWidth:860}}>
              Así se ve <i style={{fontStyle:'italic', fontWeight:500, color:'var(--blue)'}}>por dentro.</i>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{display:'inline-flex', background:'var(--paper-2)', border:'1px solid var(--line)', borderRadius:99, padding:4}}>
              {['alumno','docente'].map(t=>(
                <button key={t} onClick={()=>setTab(t)} data-cursor style={{
                  background: tab===t?'var(--ink)':'transparent',
                  color: tab===t?'var(--paper)':'var(--ink)',
                  border:'none', padding:'10px 22px', borderRadius:99,
                  fontSize:13, fontWeight:600, fontFamily:'inherit', textTransform:'capitalize',
                  transition:'all .3s'
                }}>Vista {t}</button>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div style={{position:'relative', borderRadius:28, overflow:'hidden', background:'linear-gradient(135deg, #0A1840 0%, #1040A8 52%, #1870B8 100%)', padding: isMobile ? '40px 20px 0' : '52px 52px 0', minHeight: isMobile ? 420 : 540, border:'1px solid rgba(255,255,255,0.08)'}}>
            <div aria-hidden style={{position:'absolute', width:600, height:600, borderRadius:'50%', background:'oklch(0.7 0.2 225 / .06)', right:-150, top:-150, pointerEvents:'none'}}/>
            <div style={{position:'relative', zIndex:2, display:'flex', justifyContent:'center', alignItems:'flex-end', gap:32}}>
              {!isMobile && <DesktopMock tab={tab}/>}
              <PhoneMock tab={tab}/>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// Icono SVG reutilizable
function AppIcon({d, size=13, stroke=2}){
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

function DesktopMock({tab}){
  const isDocente = tab === 'docente';

  const nav = [
    {d:'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0', label:'Explorar',          active:!isDocente},
    {d:'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z', label:'Mi agenda'},
    {d:'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z', label:'Mis chats', badge:2},
    {d:'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z', label:'Favoritos'},
    {d:'M22 10v6M2 10l10-5 10 5-10 5z', label:'Mis clases',               active:isDocente},
  ];

  const alumnoCards = [
    {init:'L', grad:'#1A6ED8,#2EC4A0', author:'Lucía G.',   subj:'Programación', title:'Python para principiantes', price:'$2.500', unit:'/hs', tag:'Curso',  tc:'#1A6ED8', mode:'Virtual'},
    {init:'M', grad:'#E8891C,#F4C030', author:'Martín R.',  subj:'Música',        title:'Guitarra clásica 1:1',       price:'$1.800', unit:'/hs', tag:'Clase',  tc:'#E8891C', mode:'Presencial'},
    {init:'A', grad:'#1A6ED8,#2EC4A0', author:'Ana L.',     subj:'Idiomas',       title:'Inglés conversacional',      price:'$2.200', unit:'/hs', tag:'Clase',  tc:'#E8891C', mode:'Virtual'},
    {init:'C', grad:'#7B5CF0,#D85AA3', author:'Carlos M.',  subj:'Matemática',    title:'Álgebra lineal para CBC',    price:'$2.000', unit:'/hs', tag:'Curso',  tc:'#1A6ED8', mode:'Virtual'},
  ];

  const docenteCards = [
    {init:'✦', grad:'#1A6ED8,#2EC4A0', author:'',  subj:'20 inscriptos', title:'Programación web con React', price:'$3.200', unit:'', tag:'Activo',  tc:'#2EC4A0', mode:'Virtual'},
    {init:'✦', grad:'#1A6ED8,#2EC4A0', author:'',  subj:'8 inscriptos',  title:'JavaScript avanzado',        price:'$2.800', unit:'', tag:'Activo',  tc:'#2EC4A0', mode:'Virtual'},
    {init:'✦', grad:'#5A7294,#8FA0B4', author:'',  subj:'0 inscriptos',  title:'Node.js y APIs REST',         price:'$3.000', unit:'', tag:'Borrador',tc:'#5A7294', mode:'Virtual'},
    {init:'✦', grad:'#1A6ED8,#2EC4A0', author:'',  subj:'5 inscriptos',  title:'Introducción a Git',          price:'$1.500', unit:'', tag:'Activo',  tc:'#2EC4A0', mode:'Virtual'},
  ];

  const cards = isDocente ? docenteCards : alumnoCards;
  const tabs  = isDocente ? ['Todas','Activas','Borradores'] : ['Cursos','Clases','Pedidos'];

  return (
    <div style={{
      background:'#fff', borderRadius:'14px 14px 0 0',
      boxShadow:'0 32px 80px -20px rgba(0,0,0,0.3)',
      overflow:'hidden', border:'1px solid #DDE5F5', borderBottom:'none',
      width:580
    }}>
      {/* Browser chrome */}
      <div style={{display:'flex', alignItems:'center', gap:6, padding:'9px 12px', background:'#F6F9FF', borderBottom:'1px solid #DDE5F5'}}>
        <span style={{width:9, height:9, borderRadius:'50%', background:'#FF5F57'}}/>
        <span style={{width:9, height:9, borderRadius:'50%', background:'#FEBC2E'}}/>
        <span style={{width:9, height:9, borderRadius:'50%', background:'#28C840'}}/>
        <div style={{flex:1, textAlign:'center', fontFamily:'var(--font-mono)', fontSize:10, color:'#5A7294'}}>
          luderis.com/{isDocente?'mis-publicaciones':'explorar'}
        </div>
      </div>

      {/* App body */}
      <div style={{display:'grid', gridTemplateColumns:'150px 1fr', height:310}}>

        {/* Sidebar */}
        <div style={{background:'#fff', borderRight:'1px solid #DDE5F5', padding:'10px 6px', display:'flex', flexDirection:'column', gap:1}}>
          <div style={{display:'flex', alignItems:'center', gap:6, padding:'5px 8px', marginBottom:6}}>
            <LudLogo size={18}/>
            <span style={{fontSize:11, fontWeight:700, color:'#0D1F3C', letterSpacing:'-.02em'}}>Luderis</span>
          </div>
          {nav.map((it,i)=>(
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:7, padding:'6px 8px', borderRadius:7,
              background: it.active ? '#1A6ED810' : 'transparent',
              color: it.active ? '#1A6ED8' : '#5A7294',
              fontSize:11, fontWeight: it.active ? 600 : 400,
              position:'relative'
            }}>
              <AppIcon d={it.d}/>
              <span style={{flex:1}}>{it.label}</span>
              {it.badge && <span style={{background:'#E53E3E', color:'#fff', borderRadius:99, fontSize:8, padding:'1px 4px', fontWeight:700}}>{it.badge}</span>}
            </div>
          ))}
          <div style={{marginTop:'auto', background:'linear-gradient(135deg,#1A6ED8,#2EC4A0)', borderRadius:8, padding:'7px 0', color:'#fff', fontSize:11, fontWeight:700, textAlign:'center'}}>
            + Publicar
          </div>
        </div>

        {/* Content */}
        <div style={{background:'#F6F9FF', padding:'10px', display:'flex', flexDirection:'column', gap:8, overflow:'hidden'}}>
          {/* Search bar */}
          <div style={{display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid #DDE5F5', borderRadius:8, padding:'6px 10px'}}>
            <AppIcon d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0' size={12}/>
            <span style={{flex:1, fontSize:10, color:'#5A7294'}}>
              {isDocente ? 'Nueva publicación...' : 'Buscar clases, materias o docentes...'}
            </span>
            <span style={{background:'linear-gradient(135deg,#1A6ED8,#2EC4A0)', color:'#fff', borderRadius:5, padding:'2px 7px', fontSize:9, fontWeight:700}}>✦ IA</span>
          </div>

          {/* Tabs */}
          <div style={{display:'flex', gap:4}}>
            {tabs.map((t,i)=>(
              <span key={t} style={{
                padding:'3px 10px', borderRadius:99, fontSize:10,
                fontWeight: i===0?600:400,
                background: i===0?'#0D1F3C':'transparent',
                color: i===0?'#fff':'#5A7294',
                border: i===0?'none':'1px solid #DDE5F5'
              }}>{t}</span>
            ))}
          </div>

          {/* Cards 2x2 */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, flex:1}}>
            {cards.map((c,i)=>(
              <div key={i} style={{background:'#fff', border:'1px solid #DDE5F5', borderRadius:9, padding:'9px', display:'flex', flexDirection:'column', gap:5}}>
                <div style={{display:'flex', alignItems:'center', gap:6}}>
                  <div style={{
                    width:22, height:22, borderRadius:'50%',
                    background:`linear-gradient(135deg,${c.grad})`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#fff', fontSize:8, fontWeight:700, flexShrink:0
                  }}>{c.init}</div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:10, fontWeight:600, color:'#0D1F3C', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{c.title}</div>
                    <div style={{fontSize:9, color:'#5A7294'}}>{isDocente ? c.subj : `${c.author} · ${c.subj}`}</div>
                  </div>
                </div>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:2}}>
                  <span style={{fontSize:12, fontWeight:700, color:'#0D1F3C'}}>{c.price}<span style={{fontSize:8, color:'#5A7294', fontWeight:400}}>{c.unit}</span></span>
                  <span style={{background:c.tc+'18', color:c.tc, borderRadius:99, fontSize:8, padding:'2px 6px', fontWeight:600}}>{c.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMock({tab}){
  const isDocente = tab === 'docente';

  const alumnoItems = [
    {color:'#1A6ED8', label:'Python 101',       sub:'Lucía G. · Mar 18:00'},
    {color:'#2EC4A0', label:'Guitarra clásica', sub:'Martín R. · Mie 10:00'},
    {color:'#7B5CF0', label:'Álgebra CBC',      sub:'Carlos M. · Jue 16:00'},
  ];
  const docenteItems = [
    {color:'#2EC4A0', label:'M. López',  sub:'Python 101 · 18:00'},
    {color:'#1A6ED8', label:'J. Ruiz',   sub:'React básico · 20:00'},
    {color:'#E8891C', label:'A. Díaz',   sub:'JavaScript · Mañana'},
  ];
  const items = isDocente ? docenteItems : alumnoItems;

  const bottomNav = [
    'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
    'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
    'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
    'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100 8 4 4 0 000-8z',
  ];

  return (
    <div style={{width:215, background:'#0D1F3C', borderRadius:36, padding:7, boxShadow:'0 32px 70px -10px rgba(0,0,0,0.4)', marginBottom:-52, flexShrink:0}}>
      <div style={{background:'#F6F9FF', borderRadius:30, overflow:'hidden', aspectRatio:'9/19.5', position:'relative', display:'flex', flexDirection:'column'}}>
        {/* Dynamic island */}
        <div style={{position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', width:56, height:12, background:'#0D1F3C', borderRadius:99, zIndex:3}}/>

        {/* Content */}
        <div style={{padding:'28px 12px 0', flex:1, display:'flex', flexDirection:'column', gap:10}}>
          {/* Header */}
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontSize:16, fontWeight:700, letterSpacing:'-.02em', color:'#0D1F3C'}}>
              Hola, {isDocente ? 'Prof.' : 'Sofi'} 👋
            </div>
            <div style={{
              width:28, height:28, borderRadius:'50%',
              background:'linear-gradient(135deg,#1A6ED8,#2EC4A0)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontSize:11, fontWeight:700
            }}>{isDocente ? 'P' : 'S'}</div>
          </div>

          {/* Search */}
          <div style={{
            background:'#0D1F3C', borderRadius:10, padding:'9px 12px',
            display:'flex', alignItems:'center', gap:6,
            color:'rgba(255,255,255,0.9)', fontSize:10
          }}>
            <span style={{color:'#2EC4A0', fontSize:12}}>✦</span>
            <span>Buscar con IA...</span>
          </div>

          {/* Section label */}
          <div style={{fontFamily:'var(--font-mono)', fontSize:8, letterSpacing:'.14em', color:'#5A7294', textTransform:'uppercase'}}>
            {isDocente ? 'Próximas clases' : 'Próximas clases'}
          </div>

          {/* Items */}
          <div style={{display:'flex', flexDirection:'column', gap:6}}>
            {items.map((it,i)=>(
              <div key={i} style={{
                background:'#fff', border:'1px solid #DDE5F5', borderRadius:8,
                padding:'8px 10px', display:'flex', alignItems:'center', gap:8
              }}>
                <div style={{width:3, height:28, borderRadius:99, background:it.color, flexShrink:0}}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:10, fontWeight:600, color:'#0D1F3C'}}>{it.label}</div>
                  <div style={{fontSize:9, color:'#5A7294', marginTop:1}}>{it.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom nav */}
        <div style={{
          background:'#fff', borderTop:'1px solid #DDE5F5',
          padding:'8px 4px 10px',
          display:'flex', justifyContent:'space-around', alignItems:'center'
        }}>
          {bottomNav.map((d,i)=>(
            <div key={i} style={{
              padding:'5px 12px', borderRadius:8,
              color: i===0 ? '#1A6ED8' : '#5A7294',
              background: i===0 ? '#1A6ED810' : 'transparent'
            }}>
              <AppIcon d={d} size={15}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.Preview = Preview;
