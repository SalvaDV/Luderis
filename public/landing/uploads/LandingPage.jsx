import React, { useState } from "react";
import { C, FONT, LUD, t, Btn } from "./shared";

function LandingPage({onEnter}){
  const [hovBtn,setHovBtn]=useState(false);
  const [seccion,setSeccion]=useState("inicio");// inicio | nosotros | contacto
  const [contactForm,setContactForm]=useState({nombre:"",email:"",msg:""});
  const [contactOk,setContactOk]=useState(false);
  const [mobileMenu,setMobileMenu]=useState(false);

  const scrollTo=(id)=>{document.getElementById(id)?.scrollIntoView({behavior:"smooth"});};

  return(
    <div style={{minHeight:"100vh",background:"#F6F9FF",fontFamily:FONT,overflowX:"hidden"}}>
      <style>{`
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .ld-hero{animation:fadeSlideUp .7s ease both}
        .ld-hero2{animation:fadeSlideUp .7s .15s ease both;opacity:0;animation-fill-mode:forwards}
        .ld-hero3{animation:fadeSlideUp .7s .3s ease both;opacity:0;animation-fill-mode:forwards}
        .ld-hero4{animation:fadeSlideUp .7s .45s ease both;opacity:0;animation-fill-mode:forwards}
        .ld-logo-float{animation:floatY 4s ease-in-out infinite}
        .ld-card:hover{transform:translateY(-5px);box-shadow:0 16px 48px rgba(26,110,216,.14)!important}
        .ld-card{transition:transform .28s,box-shadow .28s}
        .ld-step:hover .ld-step-n{background:${LUD.grad};color:#fff}
        .ld-step-n{transition:background .2s,color .2s}
        .ld-nav-link{background:none;border:none;cursor:pointer;font-size:14px;font-weight:500;color:#4A5568;padding:6px 12px;border-radius:8px;transition:color .15s,background .15s;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
        .ld-nav-link:hover{color:#1A6ED8;background:rgba(26,110,216,.07)}
        .ld-nav-link.active{color:#1A6ED8;font-weight:600}
        .ld-input{width:100%;background:#F4F7FF;border:1.5px solid #DDE5F5;border-radius:10px;padding:11px 14px;color:#0D1F3C;font-size:14px;outline:none;box-sizing:border-box;font-family:-apple-system,sans-serif;transition:border-color .15s,background .15s;margin-bottom:12px}
        .ld-input:focus{border-color:#1A6ED8;background:#fff}
        .ld-orb1{animation:floatY 6s 0s ease-in-out infinite}
        .ld-orb2{animation:floatY 6s 1.5s ease-in-out infinite}
        .ld-orb3{animation:floatY 6s 3s ease-in-out infinite}
        @media(max-width:768px){
          .ld-hide-mobile{display:none!important}
          .ld-hero-flex{flex-direction:column!important;text-align:center}
          .ld-hero-btns{justify-content:center!important}
          .ld-dos-grid{grid-template-columns:1fr!important}
          .ld-nosotros-vals{grid-template-columns:1fr 1fr!important}
          .ld-section-pad{padding-left:20px!important;padding-right:20px!important}
          .ld-hero-cta-grid{grid-template-columns:1fr!important}
          .ld-cta-final{margin-left:16px!important;margin-right:16px!important;padding:48px 24px!important}
          .ld-hamburger{display:flex!important}
          .ld-mobile-nav{display:flex!important}
          .ld-nav-inner{padding:0 20px!important}
        }
        @media(max-width:480px){
          .ld-nosotros-vals{grid-template-columns:1fr!important}
          .ld-hero-cta-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* ══ NAV ══ */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(246,249,255,.96)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(26,110,216,.08)",boxShadow:"0 1px 20px rgba(26,110,216,.05)"}}>
        <div className="ld-nav-inner" style={{padding:"0 32px",height:66,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src="/logo.png" alt="Luderis" style={{width:36,height:36,objectFit:"contain"}} className="ld-logo-float"/>
            <span style={{fontWeight:800,fontSize:21,background:LUD.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-.4px"}}>Luderis</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}} className="ld-hide-mobile">
            {[["inicio","Inicio"],["features","Funciones"],["como","¿Cómo funciona?"],["nosotros","Sobre nosotros"],["contacto","Contacto"]].map(([id,label])=>(
              <button key={id} className="ld-nav-link" onClick={()=>scrollTo(id)}>{label}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={onEnter}
              style={{background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"9px 22px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 14px rgba(26,110,216,.3)",transition:"box-shadow .2s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(26,110,216,.45)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(26,110,216,.3)"}>
              Ingresar →
            </button>
            {/* Hamburger */}
            <button className="ld-hamburger" onClick={()=>setMobileMenu(m=>!m)}
              style={{display:"none",flexDirection:"column",gap:5,background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:8}}>
              <span style={{width:22,height:2,background:"#4A5568",borderRadius:2,display:"block",transition:"all .2s",transform:mobileMenu?"rotate(45deg) translate(5px,5px)":"none"}}/>
              <span style={{width:22,height:2,background:"#4A5568",borderRadius:2,display:"block",transition:"all .2s",opacity:mobileMenu?0:1}}/>
              <span style={{width:22,height:2,background:"#4A5568",borderRadius:2,display:"block",transition:"all .2s",transform:mobileMenu?"rotate(-45deg) translate(5px,-5px)":"none"}}/>
            </button>
          </div>
        </div>
        {/* Mobile menu dropdown */}
        {mobileMenu&&(
          <div style={{display:"flex",flexDirection:"column",background:"rgba(246,249,255,.98)",borderTop:"1px solid rgba(26,110,216,.08)",padding:"12px 20px 16px",gap:4}}>
            {[["inicio","Inicio"],["features","Funciones"],["como","¿Cómo funciona?"],["nosotros","Sobre nosotros"],["contacto","Contacto"]].map(([id,label])=>(
              <button key={id} className="ld-nav-link" style={{textAlign:"left",padding:"10px 12px",fontSize:15}}
                onClick={()=>{scrollTo(id);setMobileMenu(false);}}>
                {label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ══ HERO ══ */}
      <section id="inicio" style={{maxWidth:1100,margin:"0 auto",padding:"88px 32px 72px",display:"flex",alignItems:"center",gap:60,flexWrap:"wrap"}} className="ld-hero-flex ld-section-pad">
        <div style={{flex:"1 1 420px",minWidth:0}}>
          <div className="ld-hero" style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(26,110,216,.08)",border:"1px solid rgba(26,110,216,.18)",borderRadius:20,padding:"5px 16px",marginBottom:26}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:LUD.teal,display:"inline-block",animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:12,fontWeight:600,color:LUD.blue}}>Plataforma educativa argentina · 100% gratis</span>
          </div>
          <h1 className="ld-hero" style={{fontSize:"clamp(32px,4.2vw,54px)",fontWeight:800,lineHeight:1.1,color:"#0D1F3C",margin:"0 0 20px",letterSpacing:"-1px"}}>
            Aprendé exactamente<br/>
            <span style={{background:LUD.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>lo que querés.</span>
          </h1>
          <p className="ld-hero2" style={{fontSize:17,color:"#4A5568",lineHeight:1.75,margin:"0 0 8px",maxWidth:480}}>
            Siempre hay alguien dispuesto a enseñar lo que otro quiere aprender.
          </p>
          <p className="ld-hero2" style={{fontSize:15,color:"#718096",lineHeight:1.7,margin:"0 0 32px",maxWidth:460}}>
            Vos decidís qué, cuándo y cómo. No hay un catálogo fijo que te limite.
          </p>
          {/* Dos caminos — el diferencial visual */}
          <div className="ld-hero3 ld-hero-cta-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:28,maxWidth:480}}>
            <button onClick={onEnter}
              style={{background:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",border:"none",borderRadius:16,color:"#fff",padding:"16px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,boxShadow:"0 6px 20px rgba(26,110,216,.35)",transition:"all .2s",textAlign:"left"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 10px 28px rgba(26,110,216,.45)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 6px 20px rgba(26,110,216,.35)";}}>
              <div style={{fontSize:22,marginBottom:6}}>🎓</div>
              <div style={{fontWeight:800,fontSize:15,marginBottom:3}}>Quiero aprender</div>
              <div style={{fontSize:12,opacity:.85,fontWeight:400}}>Encontrá cursos y docentes</div>
            </button>
            <button onClick={onEnter}
              style={{background:"linear-gradient(135deg,#E8881A,#F5C842)",border:"none",borderRadius:16,color:"#fff",padding:"16px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:FONT,boxShadow:"0 6px 20px rgba(232,136,26,.35)",transition:"all .2s",textAlign:"left"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 10px 28px rgba(232,136,26,.45)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 6px 20px rgba(232,136,26,.35)";}}>
              <div style={{fontSize:22,marginBottom:6}}>👤</div>
              <div style={{fontWeight:800,fontSize:15,marginBottom:3}}>Quiero enseñar</div>
              <div style={{fontSize:12,opacity:.85,fontWeight:400}}>Publicá tus clases gratis</div>
            </button>
          </div>
          <div className="ld-hero4" style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            {["✓ Sin costo de registro","✓ Sin comisiones ocultas","✓ Búsqueda con IA"].map(f=>(
              <span key={f} style={{fontSize:13,color:"#718096"}}>{f}</span>
            ))}
          </div>
        </div>
        {/* Visual */}
        <div style={{flex:"0 0 320px",position:"relative",height:360,display:"flex",alignItems:"center",justifyContent:"center"}} className="ld-hide-mobile">
          <div className="ld-orb1" style={{position:"absolute",width:220,height:220,borderRadius:"50%",background:"rgba(26,110,216,.05)",top:10,left:10}}/>
          <div className="ld-orb2" style={{position:"absolute",width:150,height:150,borderRadius:"50%",background:"rgba(232,136,26,.06)",bottom:20,right:0}}/>
          <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:12,width:"100%",padding:"0 16px"}}>
            {/* Card ejemplo curso */}
            <div style={{background:"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 8px 28px rgba(26,110,216,.12)",borderLeft:"3px solid #1A6ED8",animation:"floatY 4s ease-in-out infinite"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#1A6ED8",marginBottom:6}}>🎓 CURSO · Python desde cero</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:12,color:"#4A5568"}}>8 semanas · Online</div>
                <div style={{fontWeight:800,color:"#1A6ED8",fontSize:14}}>$8.500/mes</div>
              </div>
            </div>
            {/* Card ejemplo clase */}
            <div style={{background:"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 8px 28px rgba(232,136,26,.12)",borderLeft:"3px solid #E8881A",animation:"floatY 4s .8s ease-in-out infinite"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#E8881A",marginBottom:6}}>👤 CLASE · Guitarra flamenca</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:12,color:"#4A5568"}}>1 hora · Presencial</div>
                <div style={{fontWeight:800,color:"#E8881A",fontSize:14}}>$4.000/hora</div>
              </div>
            </div>
            {/* Card IA */}
            <div style={{background:"linear-gradient(135deg,#7B5CF005,#1A6ED808)",borderRadius:14,padding:"12px 16px",boxShadow:"0 4px 16px rgba(0,0,0,.06)",border:"1px solid #EEF2FF",animation:"floatY 4s 1.4s ease-in-out infinite"}}>
              <div style={{fontSize:11,color:"#7B5CF0",fontWeight:700,marginBottom:4}}>✨ Búsqueda con IA</div>
              <div style={{fontSize:12,color:"#4A5568"}}>"Quiero aprender fotografía de retrato nocturno"</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ DOS MUNDOS ══ */}
      <section style={{background:"#fff",borderTop:"1px solid #EEF2FF",borderBottom:"1px solid #EEF2FF",padding:"64px 32px"}} className="ld-section-pad">
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <h2 style={{fontSize:30,fontWeight:800,color:"#0D1F3C",margin:"0 0 10px",letterSpacing:"-.5px"}}>Una app. Dos experiencias.</h2>
            <p style={{color:"#718096",fontSize:15,margin:0}}>Cada modo tiene su identidad, su flujo y su propósito</p>
          </div>
          <div className="ld-dos-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            {/* Cursos */}
            <div style={{background:"linear-gradient(135deg,#EEF6FF,#E8F8F5)",border:"1px solid #1A6ED820",borderRadius:20,padding:"32px 28px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-30,right:-30,width:100,height:100,borderRadius:"50%",background:"rgba(26,110,216,.06)"}}/>
              <div style={{fontSize:36,marginBottom:16}}>🎓</div>
              <h3 style={{fontWeight:800,color:"#0D1F3C",fontSize:22,margin:"0 0 10px",letterSpacing:"-.4px"}}>Cursos</h3>
              <p style={{color:"#4A5568",fontSize:14,lineHeight:1.7,margin:"0 0 20px"}}>
                Experiencias de aprendizaje estructuradas. Con contenido, evaluaciones, seguimiento de progreso y certificados.
              </p>
              {["Contenido organizado por clases","Evaluaciones y certificados","Chat grupal + foro","Seguimiento de habilidades"].map(f=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{width:18,height:18,borderRadius:"50%",background:"#1A6ED815",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#1A6ED8",fontWeight:700,flexShrink:0}}>✓</span>
                  <span style={{fontSize:13,color:"#4A5568"}}>{f}</span>
                </div>
              ))}
              <div style={{marginTop:20,display:"inline-block",background:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",borderRadius:20,padding:"8px 20px",color:"#fff",fontSize:13,fontWeight:700}}>
                Explorar cursos →
              </div>
            </div>
            {/* Clases particulares */}
            <div style={{background:"linear-gradient(135deg,#FEF6EE,#FFFBEB)",border:"1px solid #E8881A20",borderRadius:20,padding:"32px 28px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-30,right:-30,width:100,height:100,borderRadius:"50%",background:"rgba(232,136,26,.06)"}}/>
              <div style={{fontSize:36,marginBottom:16}}>👤</div>
              <h3 style={{fontWeight:800,color:"#0D1F3C",fontSize:22,margin:"0 0 10px",letterSpacing:"-.4px"}}>Clases particulares</h3>
              <p style={{color:"#4A5568",fontSize:14,lineHeight:1.7,margin:"0 0 20px"}}>
                Conexión directa con un docente. A tu ritmo, en tu horario, sobre lo que vos necesitás exactamente.
              </p>
              {["Horarios a tu medida","Comunicación directa","Sin intermediarios","Precio acordado entre vos"].map(f=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{width:18,height:18,borderRadius:"50%",background:"#E8881A15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#E8881A",fontWeight:700,flexShrink:0}}>✓</span>
                  <span style={{fontSize:13,color:"#4A5568"}}>{f}</span>
                </div>
              ))}
              <div style={{marginTop:20,display:"inline-block",background:"linear-gradient(135deg,#E8881A,#F5C842)",borderRadius:20,padding:"8px 20px",color:"#fff",fontSize:13,fontWeight:700}}>
                Encontrar docente →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" style={{maxWidth:1100,margin:"0 auto",padding:"80px 32px"}} className="ld-section-pad">
        <div style={{textAlign:"center",marginBottom:52}}>
          <div style={{display:"inline-block",background:"rgba(26,110,216,.08)",border:"1px solid rgba(26,110,216,.15)",borderRadius:20,padding:"4px 16px",fontSize:12,fontWeight:600,color:LUD.blue,marginBottom:14}}>Funciones</div>
          <h2 style={{fontSize:34,fontWeight:800,color:"#0D1F3C",margin:"0 0 12px",letterSpacing:"-.6px"}}>Todo lo que necesitás</h2>
          <p style={{color:"#718096",fontSize:16,margin:0,maxWidth:480,marginLeft:"auto",marginRight:"auto"}}>Una plataforma pensada para el aprendizaje real, sin fricciones</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20}}>
          {[
            {icon:"🎯",title:"Clases particulares",desc:"Encontrá docentes disponibles para tu tema y horario, con precios transparentes desde el primer momento.",grad:"rgba(26,110,216,.06)",border:"rgba(26,110,216,.12)"},
            {icon:"📚",title:"Cursos completos",desc:"Cursos síncronos y asíncronos con contenido estructurado, evaluaciones propias y certificados descargables.",grad:"rgba(46,196,160,.06)",border:"rgba(46,196,160,.18)"},
            {icon:"🤖",title:"Búsqueda con IA",desc:"Describí con tus palabras lo que necesitás y nuestra IA encuentra las mejores opciones para vos.",grad:"rgba(123,92,240,.06)",border:"rgba(123,92,240,.15)"},
            {icon:"📊",title:"Seguimiento real",desc:"Evaluaciones, notas, habilidades y progreso del alumno en un solo panel. Para docentes y estudiantes.",grad:"rgba(245,158,11,.06)",border:"rgba(245,158,11,.18)"},
            {icon:"💬",title:"Chat integrado",desc:"Comunicación directa entre docente y alumno sin salir de la plataforma. Sin exponer datos personales.",grad:"rgba(46,196,160,.06)",border:"rgba(46,196,160,.18)"},
            {icon:"🔒",title:"Privacidad primero",desc:"Los emails y datos de contacto nunca se exponen. Vos decidís cuándo compartir tu información.",grad:"rgba(26,110,216,.06)",border:"rgba(26,110,216,.12)"},
          ].map(f=>(
            <div key={f.title} className="ld-card"
              style={{background:"#fff",border:`1px solid ${f.border}`,borderRadius:18,padding:"28px 24px",boxShadow:"0 2px 14px rgba(0,0,0,.03)"}}>
              <div style={{width:54,height:54,borderRadius:14,background:f.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,marginBottom:16}}>{f.icon}</div>
              <h3 style={{fontWeight:700,color:"#0D1F3C",fontSize:17,margin:"0 0 9px"}}>{f.title}</h3>
              <p style={{color:"#718096",fontSize:14,lineHeight:1.65,margin:0}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CÓMO FUNCIONA ══ */}
      <section id="como" style={{background:"#fff",padding:"80px 32px",borderTop:"1px solid #EEF2FF",borderBottom:"1px solid #EEF2FF"}} className="ld-section-pad">
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <div style={{display:"inline-block",background:"rgba(46,196,160,.1)",border:"1px solid rgba(46,196,160,.25)",borderRadius:20,padding:"4px 16px",fontSize:12,fontWeight:600,color:LUD.teal,marginBottom:14}}>¿Cómo funciona?</div>
            <h2 style={{fontSize:34,fontWeight:800,color:"#0D1F3C",margin:"0 0 12px",letterSpacing:"-.6px"}}>Simple y rápido</h2>
            <p style={{color:"#718096",fontSize:16,margin:0}}>En menos de 5 minutos ya estás conectado</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:32}}>
            {[
              {n:"1",title:t("createAccount"),desc:"Registrarte es gratis y toma menos de un minuto. Solo necesitás un email.",icon:"✉️"},
              {n:"2",title:"Explorá o publicá",desc:"Buscá clases disponibles o publicá lo que enseñás. La IA te ayuda a encontrar lo mejor.",icon:"🔍"},
              {n:"3",title:"Conectá directamente",desc:"Chateá con el docente o alumno sin intermediarios. Acordá precio y horario.",icon:"💬"},
              {n:"4",title:"Aprendé o enseñá",desc:"Seguí el progreso, hacé evaluaciones y descargá certificados cuando termines.",icon:"🎓"},
            ].map((s,i)=>(
              <div key={s.n} className="ld-step" style={{textAlign:"center"}}>
                <div className="ld-step-n" style={{width:52,height:52,borderRadius:"50%",border:`2px solid ${LUD.blue}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontWeight:800,fontSize:20,color:LUD.blue}}>
                  {s.n}
                </div>
                <div style={{fontSize:26,marginBottom:10}}>{s.icon}</div>
                <h3 style={{fontWeight:700,color:"#0D1F3C",fontSize:16,margin:"0 0 8px"}}>{s.title}</h3>
                <p style={{color:"#718096",fontSize:14,lineHeight:1.6,margin:0}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SOBRE NOSOTROS ══ */}
      <section id="nosotros" style={{maxWidth:1100,margin:"0 auto",padding:"80px 32px"}} className="ld-section-pad">
        <div style={{display:"flex",gap:60,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:"1 1 340px"}}>
            <div style={{display:"inline-block",background:"rgba(123,92,240,.08)",border:"1px solid rgba(123,92,240,.2)",borderRadius:20,padding:"4px 16px",fontSize:12,fontWeight:600,color:"#7B5CF0",marginBottom:18}}>Sobre nosotros</div>
            <h2 style={{fontSize:34,fontWeight:800,color:"#0D1F3C",margin:"0 0 18px",letterSpacing:"-.6px",lineHeight:1.15}}>Creemos en el poder de compartir conocimiento</h2>
            <p style={{color:"#4A5568",fontSize:15,lineHeight:1.8,margin:"0 0 16px"}}>
              Luderis nació de una idea simple: que el conocimiento no debería tener barreras. Somos un equipo argentino que construyó una plataforma donde cualquier persona puede enseñar lo que sabe o aprender lo que necesita, de forma directa y sin complicaciones.
            </p>
            <p style={{color:"#4A5568",fontSize:15,lineHeight:1.8,margin:"0 0 28px"}}>
              Creemos que la mejor educación ocurre cuando hay una conexión real entre personas. Por eso ponemos el foco en facilitar ese encuentro — sin intermediarios, sin comisiones ocultas, y con herramientas que hacen que la experiencia sea lo mejor posible para ambas partes.
            </p>
            <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
              {[["🌎","100% argentino"],["💡","Innovación educativa"],["🤝","Comunidad primero"]].map(([icon,label])=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:8,background:"#F4F7FF",borderRadius:20,padding:"8px 16px"}}>
                  <span>{icon}</span>
                  <span style={{fontSize:13,fontWeight:600,color:"#0D1F3C"}}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ld-nosotros-vals" style={{flex:"1 1 320px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {[
              {icon:"🎓",title:"Misión",desc:"Democratizar el acceso al conocimiento conectando personas que quieren aprender con quienes quieren enseñar."},
              {icon:"🔭",title:"Visión",desc:"Ser la plataforma de referencia en Argentina para el intercambio de conocimiento entre personas."},
              {icon:"⚡",title:"Tecnología",desc:"IA integrada, evaluaciones automatizadas y seguimiento de progreso para una experiencia de aprendizaje moderna."},
              {icon:"🔒",title:"Confianza",desc:"Privacidad y seguridad en cada interacción. Tus datos son tuyos, siempre."},
            ].map(v=>(
              <div key={v.title} style={{background:"#fff",border:"1px solid #EEF2FF",borderRadius:14,padding:"20px 18px",boxShadow:"0 2px 12px rgba(0,0,0,.03)"}}>
                <div style={{fontSize:26,marginBottom:10}}>{v.icon}</div>
                <div style={{fontWeight:700,color:"#0D1F3C",fontSize:15,marginBottom:6}}>{v.title}</div>
                <p style={{color:"#718096",fontSize:13,lineHeight:1.6,margin:0}}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIOS ══ */}
      <section style={{background:"linear-gradient(135deg,#0A2A5E,#1A6ED8)",padding:"80px 32px"}} className="ld-section-pad">
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <h2 style={{fontSize:"clamp(26px,3.5vw,38px)",fontWeight:800,color:"#fff",margin:"0 0 12px",letterSpacing:"-.5px"}}>
              Lo que dicen nuestros usuarios
            </h2>
            <p style={{color:"rgba(255,255,255,.7)",fontSize:16}}>Docentes y alumnos que ya usan Luderis</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
            {[
              {nombre:"Martina L.",rol:"Alumna de Matemática",texto:"Encontré una profesora increíble en 2 minutos. La búsqueda con IA me recomendó exactamente lo que necesitaba para rendir el final.",rating:5},
              {nombre:"Carlos R.",rol:"Docente de Guitarra",texto:"Empecé a subir mis clases hace un mes y ya tengo 8 alumnos. La plataforma es facilísima y llegan alumnos solos.",rating:5},
              {nombre:"Sofia M.",rol:"Alumna de Inglés",texto:"Me gustó que pude ver el perfil del docente con reseñas reales antes de inscribirme. Nada de sorpresas.",rating:5},
            ].map((t,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,.1)",backdropFilter:"blur(10px)",borderRadius:20,padding:"24px",border:"1px solid rgba(255,255,255,.15)"}}>
                <div style={{display:"flex",gap:3,marginBottom:12}}>
                  {Array.from({length:t.rating}).map((_,j)=>(
                    <span key={j} style={{color:"#F59E0B",fontSize:16}}>★</span>
                  ))}
                </div>
                <p style={{color:"rgba(255,255,255,.9)",fontSize:14,lineHeight:1.7,margin:"0 0 16px",fontStyle:"italic"}}>"{t.texto}"</p>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:15,color:"#fff"}}>
                    {t.nombre[0]}
                  </div>
                  <div>
                    <div style={{color:"#fff",fontWeight:700,fontSize:13}}>{t.nombre}</div>
                    <div style={{color:"rgba(255,255,255,.6)",fontSize:11}}>{t.rol}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section style={{background:"#F6F9FF",padding:"80px 32px",textAlign:"center"}} className="ld-section-pad">
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{fontSize:40,marginBottom:16}}>🚀</div>
          <h2 style={{fontSize:"clamp(28px,4vw,44px)",fontWeight:800,color:"#0D1F3C",margin:"0 0 16px",letterSpacing:"-.5px"}}>
            ¿Listo para empezar?
          </h2>
          <p style={{fontSize:17,color:"#4A5568",lineHeight:1.75,margin:"0 0 32px"}}>
            Registrate gratis en menos de 2 minutos.<br/>
            Sin tarjeta de crédito. Sin compromisos.
          </p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={onEnter}
              style={{background:"linear-gradient(135deg,#1A6ED8,#2EC4A0)",border:"none",borderRadius:24,color:"#fff",padding:"16px 40px",fontWeight:700,fontSize:17,cursor:"pointer",fontFamily:FONT,boxShadow:"0 8px 32px rgba(26,110,216,.35)",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(26,110,216,.5)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 8px 32px rgba(26,110,216,.35)";}}>
              Crear mi cuenta gratis →
            </button>
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:24,flexWrap:"wrap"}}>
            {["✓ Sin costo de registro","✓ Docentes verificados","✓ Búsqueda con IA","✓ Pagos protegidos"].map(f=>(
              <span key={f} style={{fontSize:13,color:"#718096"}}>{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CONTACTO ══ */}
      <section id="contacto" style={{maxWidth:900,margin:"0 auto",padding:"80px 32px"}} className="ld-section-pad">
        <div style={{display:"flex",gap:56,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{flex:"1 1 280px"}}>
            <div style={{display:"inline-block",background:"rgba(26,110,216,.08)",border:"1px solid rgba(26,110,216,.15)",borderRadius:20,padding:"4px 16px",fontSize:12,fontWeight:600,color:LUD.blue,marginBottom:18}}>Contacto</div>
            <h2 style={{fontSize:30,fontWeight:800,color:"#0D1F3C",margin:"0 0 14px",letterSpacing:"-.5px"}}>¿Tenés alguna pregunta?</h2>
            <p style={{color:"#4A5568",fontSize:15,lineHeight:1.75,margin:"0 0 28px"}}>Escribinos y te respondemos a la brevedad. También podés enviarnos un mail directamente.</p>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {[
                {icon:"✉️",label:"Email",val:"contacto@luderis.com"},
                {icon:"📍",label:"Ubicación",val:"Buenos Aires, Argentina"},
                {icon:"🕐",label:"Respuesta",val:"Menos de 24 horas"},
              ].map(c=>(
                <div key={c.label} style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:40,height:40,borderRadius:10,background:"rgba(26,110,216,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{c.icon}</div>
                  <div>
                    <div style={{fontSize:11,color:"#718096",fontWeight:600,letterSpacing:.3}}>{c.label.toUpperCase()}</div>
                    <div style={{fontSize:14,color:"#0D1F3C",fontWeight:500}}>{c.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{flex:"1 1 320px"}}>
            {contactOk?(
              <div style={{background:"linear-gradient(135deg,rgba(46,196,160,.08),rgba(26,110,216,.06))",border:"1px solid rgba(46,196,160,.25)",borderRadius:16,padding:"40px 32px",textAlign:"center"}}>
                <div style={{fontSize:44,marginBottom:14}}>✓</div>
                <div style={{fontWeight:700,color:"#0D1F3C",fontSize:18,marginBottom:8}}>¡Mensaje enviado!</div>
                <p style={{color:"#718096",fontSize:14,margin:0}}>Te respondemos en menos de 24 horas a {contactForm.email}.</p>
              </div>
            ):(
              <div style={{background:"#fff",border:"1px solid #EEF2FF",borderRadius:16,padding:"28px 24px",boxShadow:"0 4px 24px rgba(26,110,216,.07)"}}>
                <div style={{fontWeight:700,color:"#0D1F3C",fontSize:16,marginBottom:18}}>Envianos un mensaje</div>
                <input className="ld-input" placeholder="Tu nombre" value={contactForm.nombre} onChange={e=>setContactForm(p=>({...p,nombre:e.target.value}))}/>
                <input className="ld-input" type="email" placeholder="Tu email" value={contactForm.email} onChange={e=>setContactForm(p=>({...p,email:e.target.value}))}/>
                <textarea className="ld-input" placeholder="¿En qué te podemos ayudar?" rows={4} value={contactForm.msg} onChange={e=>setContactForm(p=>({...p,msg:e.target.value}))} style={{resize:"vertical",minHeight:100}}/>
                <button onClick={()=>{if(contactForm.nombre&&contactForm.email&&contactForm.msg)setContactOk(true);}}
                  style={{width:"100%",background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"13px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:FONT,boxShadow:"0 4px 14px rgba(26,110,216,.3)"}}>
                  Enviar mensaje →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section className="ld-cta-final" style={{margin:"0 24px 80px",borderRadius:24,background:LUD.gradDark,padding:"64px 40px",textAlign:"center",position:"relative",overflow:"hidden",maxWidth:1052,marginLeft:"auto",marginRight:"auto"}}>
        <div style={{position:"absolute",width:320,height:320,borderRadius:"50%",background:"rgba(255,255,255,.04)",top:-90,right:-90,pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:220,height:220,borderRadius:"50%",background:"rgba(46,196,160,.08)",bottom:-70,left:-50,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{width:68,height:68,borderRadius:20,background:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",backdropFilter:"blur(8px)"}}>
            <img src="/logo.png" alt="Luderis" style={{width:46,height:46,objectFit:"contain"}}/>
          </div>
          <h2 style={{color:"#fff",fontSize:36,fontWeight:800,margin:"0 0 14px",letterSpacing:"-.6px"}}>Empezá hoy, es gratis</h2>
          <p style={{color:"rgba(255,255,255,.72)",fontSize:16,margin:"0 0 32px",maxWidth:440,marginLeft:"auto",marginRight:"auto"}}>Registrate en segundos y conectá con docentes o estudiantes que comparten tu pasión.</p>
          <button onClick={onEnter}
            style={{background:"#fff",border:"none",borderRadius:24,color:LUD.blue,padding:"15px 40px",fontWeight:700,fontSize:16,cursor:"pointer",fontFamily:FONT,boxShadow:"0 10px 28px rgba(0,0,0,.2)",transition:"transform .2s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="none"}>
            Crear cuenta gratis →
          </button>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{borderTop:"1px solid #EEF2FF",padding:"32px 32px",background:"#fff"}} className="ld-section-pad">
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src="/logo.png" alt="Luderis" style={{width:28,height:28,objectFit:"contain"}}/>
            <span style={{fontWeight:800,fontSize:16,background:LUD.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Luderis</span>
          </div>
          <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
            {[["inicio","Inicio"],["features","Funciones"],["nosotros","Sobre nosotros"],["contacto","Contacto"]].map(([id,l])=>(
              <button key={id} onClick={()=>scrollTo(id)} style={{background:"none",border:"none",color:"#718096",fontSize:13,cursor:"pointer",fontFamily:FONT,padding:0,transition:"color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.color=LUD.blue}
                onMouseLeave={e=>e.currentTarget.style.color="#718096"}>{l}</button>
            ))}
          </div>
          <span style={{fontSize:12,color:"#A0AEC0"}}>© {new Date().getFullYear()} Luderis · contacto@luderis.com</span>
        </div>
      </footer>
    </div>
  );
}


export default LandingPage;
