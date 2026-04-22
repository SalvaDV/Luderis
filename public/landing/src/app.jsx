// App: compone todo
const {useState} = React;

function App(){
  const onEnter = ()=> {
    sessionStorage.setItem("ld_auth", "1");
    window.location.href = '/#auth';
  };
  React.useEffect(()=>{
    const el = document.createElement('style');
    el.textContent = `
      @media (max-width: 640px){
        .lud-nav-links{display:none!important}
        .lud-burger{display:flex!important}
        .lud-worlds-grid{grid-template-columns:1fr!important}
        .lud-prev-grid{grid-template-columns:1fr!important}
        section{padding-left:16px!important;padding-right:16px!important}
      }
    `;
    document.head.appendChild(el);
    return ()=>{ try{document.head.removeChild(el);}catch{} };
  },[]);
  return (
    <>
      <Cursor/>
      <Nav onEnter={onEnter}/>
      <Hero onEnter={onEnter}/>
      <Worlds onEnter={onEnter}/>
      <Features/>
      <How/>
      <Preview onEnter={onEnter}/>
      <Stats/>
      <About/>
      <Testimonials/>
      <CTA onEnter={onEnter}/>
      <Contact/>
      <Footer/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
