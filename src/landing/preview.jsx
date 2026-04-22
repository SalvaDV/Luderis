import React from 'react';
import { Reveal, Kicker } from './primitives';
import { Shader } from './shader';

// Preview mockup de la app (mobile + desktop flotando)
function Preview({onEnter}){
  const [tab, setTab] = React.useState('alumno');
  return (
    <section style={{padding:'140px 28px 120px', position:'relative', overflow:'hidden'}}>
      <div style={{maxWidth:1344, margin:'0 auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:40, flexWrap:'wrap', marginBottom:56}}>
          <Reveal>
            <Kicker>05 · Producto</Kicker>
            <h2 style={{fontSize:'clamp(44px, 7vw, 92px)', fontWeight:700, letterSpacing:'-.05em', lineHeight:.95, margin:'18px 0 0', maxWidth:860}}>
              {"\n"}
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
          <div style={{position:'relative', borderRadius:28, overflow:'hidden', background:'linear-gradient(135deg, oklch(0.92 0.06 258), oklch(0.96 0.04 80))', padding:'60px 60px 0', minHeight:560, border:'1px solid var(--line)'}}>
            <div style={{position:'absolute', inset:0, opacity:.65}}>
              <Shader palette="deep" intensity={1}/>
            </div>
            <div style={{position:'relative', zIndex:2, display:'grid', gridTemplateColumns:'1.3fr .9fr', gap:40, alignItems:'flex-end'}} className="lud-prev-grid">
              {/* Desktop mock */}
              <DesktopMock tab={tab}/>
              {/* Phone mock */}
              <PhoneMock tab={tab}/>
            </div>
          </div>
        </Reveal>
      </div>

      <style>{`
        @media (max-width: 900px){ .lud-prev-grid{ grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

function DesktopMock({tab}){
  return (
    <div style={{background:'var(--paper)', borderRadius:'16px 16px 0 0', boxShadow:'0 30px 80px -20px oklch(0 0 0 / .25)', overflow:'hidden', border:'1px solid var(--line)', borderBottom:'none'}}>
      {/* Titlebar */}
      <div style={{display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'var(--paper-2)', borderBottom:'1px solid var(--line)'}}>
        <span style={{width:10, height:10, borderRadius:'50%', background:'oklch(0.75 0.15 25)'}}/>
        <span style={{width:10, height:10, borderRadius:'50%', background:'oklch(0.85 0.15 85)'}}/>
        <span style={{width:10, height:10, borderRadius:'50%', background:'oklch(0.75 0.15 150)'}}/>
        <div style={{flex:1, textAlign:'center', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--muted)'}}>luderis.com/{tab==='alumno'?'explorar':'panel'}</div>
      </div>
      {/* Body */}
      <div style={{padding:'18px', display:'grid', gridTemplateColumns:'140px 1fr', gap:14, minHeight:280}}>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {['Inicio','Buscar','Mis cursos','Mensajes','Perfil'].map((x,i)=>(
            <div key={x} style={{padding:'8px 10px', borderRadius:8, fontSize:12, fontWeight: i===1?600:500, color: i===1?'var(--paper)':'var(--ink-2)', background: i===1?'var(--ink)':'transparent'}}>{x}</div>
          ))}
        </div>
        <div>
          <div style={{background:'var(--paper-2)', border:'1px solid var(--line)', borderRadius:10, padding:'8px 12px', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-2)', marginBottom:12}}>
            ✨ {tab==='alumno'?'"fotografía nocturna con celular"':'Crear nueva publicación'}
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
            {[0,1,2,3,4,5].map(i=>(
              <div key={i} style={{background:'var(--paper-2)', border:'1px solid var(--line)', borderRadius:10, padding:'10px', aspectRatio:'1/1.1'}}>
                <div style={{height:'55%', borderRadius:6, background: i%2?'var(--blue)':'var(--orange)', opacity:.15}}/>
                <div style={{fontSize:11, fontWeight:600, marginTop:8}}>{['Python','Guitarra','Inglés','Álgebra','Foto','Yoga'][i]}</div>
                <div style={{fontFamily:'var(--font-mono)', fontSize:9, color:'var(--muted)', marginTop:2}}>★ 4.9 · 120 alumnos</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMock({tab}){
  return (
    <div style={{width:240, background:'var(--ink)', borderRadius:'40px', padding:8, boxShadow:'0 30px 70px -10px oklch(0 0 0 / .35)', justifySelf:'center', marginBottom:-60}}>
      <div style={{background:'var(--paper)', borderRadius:'32px', overflow:'hidden', aspectRatio:'9/19', position:'relative'}}>
        {/* notch */}
        <div style={{position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', width:60, height:14, background:'var(--ink)', borderRadius:99, zIndex:3}}/>
        <div style={{padding:'30px 14px 14px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
            <div style={{fontSize:18, fontWeight:700, letterSpacing:'-.03em'}}>Hola, {tab==='alumno'?'Sofi':'Prof.'}</div>
            <div style={{width:26, height:26, borderRadius:'50%', background:'var(--blue)'}}/>
          </div>
          <div style={{background:'var(--ink)', color:'var(--paper)', borderRadius:12, padding:'10px 12px', fontFamily:'var(--font-mono)', fontSize:10, marginBottom:14}}>
            ✨ Buscar con IA
          </div>
          <div style={{fontFamily:'var(--font-mono)', fontSize:9, color:'var(--muted)', marginBottom:8, letterSpacing:'.1em'}}>
            {tab==='alumno'?'PRÓXIMAS CLASES':'ALUMNOS ACTIVOS'}
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {[1,2,3].map(i=>(
              <div key={i} style={{border:'1px solid var(--line)', borderRadius:10, padding:'10px', display:'flex', gap:10, alignItems:'center'}}>
                <div style={{width:32, height:32, borderRadius:8, background: i%2?'var(--blue)':'var(--orange)'}}/>
                <div>
                  <div style={{fontSize:11, fontWeight:600}}>{tab==='alumno'?['Python 101','Guitarra','Álgebra'][i-1]:['M. López','J. Ruiz','A. Díaz'][i-1]}</div>
                  <div style={{fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)'}}>{tab==='alumno'?['Mar 18:00','Mie 10:00','Jue 16:00'][i-1]:['Activo','Activo','Pausa'][i-1]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Preview };
