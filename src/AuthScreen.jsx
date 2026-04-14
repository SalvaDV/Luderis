import React, { useState } from "react";
import * as sb from "./supabase";
import { C, FONT, LUD, t, Btn, logError } from "./shared";

function AuthScreen({onLogin}){
  const [mode,setMode]=useState("login");const [email,setEmail]=useState("");const [pass,setPass]=useState("");const [pass2,setPass2]=useState("");
  const [loading,setLoading]=useState(false);const [err,setErr]=useState("");const [ok,setOk]=useState("");
  const [aceptoTerminos,setAceptoTerminos]=useState(false);
  const [showTerminos,setShowTerminos]=useState(false);
  const handle=async()=>{
    setErr("");setOk("");if(!email){setErr("Ingresá tu email");return;}
    if(mode!=="forgot"&&!pass){setErr("Ingresá contraseña");return;}
    if(mode==="register"&&pass!==pass2){setErr("Las contraseñas no coinciden");return;}
    if(mode==="register"&&!aceptoTerminos){setErr("Debés aceptar los Términos y Condiciones");return;}
    setLoading(true);
    try{
      if(mode==="forgot"){await sb.resetPassword(email);setOk("Te enviamos un email para recuperar tu contraseña.");}
      else if(mode==="register"){
        const r=await sb.signUp(email,pass);
        if(r.access_token){
          const uid=r.user?.id;
          const nombre=email.split("@")[0];
          if(uid){try{await sb.insertUsuario({id:uid,email,nombre},r.access_token);}catch(e){logError("insertUsuario en registro",e);}}
          // Email de bienvenida (fire & forget)
          sb.sendEmail("bienvenida",email,{nombre,email},r.access_token).catch(e=>logError("email bienvenida",e));
          // Registrar referido si hay código guardado
          try{
            const refCode=localStorage.getItem("cl_ref_code");
            if(refCode&&uid){
              // El código es btoa(user.id) — decodificamos
              let referidorId=null;
              try{referidorId=atob(refCode.padEnd(refCode.length+((4-refCode.length%4)%4),"="));}catch(e){logError("decodificar ref_code",e);}
              if(referidorId){
                await sb.db("referidos","POST",{
                  referidor_id:referidorId,
                  referido_id:uid,
                  referido_email:email,
                  estado:"pendiente",
                },r.access_token,"return=minimal").catch(e=>logError("registrar referido",e));
                localStorage.removeItem("cl_ref_code");
              }
            }
          }catch(e){logError("bloque referidos",e);}
          sb.saveSession(r);onLogin(r);
        }else setOk("Revisá tu email para confirmar tu cuenta.");
      }else{
        const r=await sb.signIn(email,pass);
        const uid=r.user?.id;
        if(uid){try{await sb.upsertUsuario({id:uid,email,nombre:email.split("@")[0]},r.access_token);}catch{}}
        sb.saveSession(r);onLogin(r);
      }
    }catch(e){setErr(e.message||"Error al iniciar sesión");}finally{setLoading(false);}
  };

  const handleGoogle = async () => {
    setErr(""); setLoading(true);
    try {
      await sb.signInWithGoogle();
      // Redirect happens automatically — Supabase redirects to callback URL
    } catch(e) { setErr(e.message||"Error con Google"); setLoading(false); }
  };

  const iS={width:"100%",background:"#F4F7FF",border:"1.5px solid #DDE5F5",borderRadius:10,padding:"12px 14px",color:"#0D1F3C",fontSize:16,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:12,transition:"border-color .15s,background .15s"};
  const focusI=e=>{e.target.style.borderColor=LUD.blue;e.target.style.background="#fff";};
  const blurI=e=>{e.target.style.borderColor="#DDE5F5";e.target.style.background="#F4F7FF";};

  if(showTerminos)return(
    <div style={{minHeight:"100vh",background:"#F6F9FF",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:FONT}}>
      <div style={{background:"#fff",borderRadius:16,padding:"32px 28px",width:"min(640px,95vw)",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(26,110,216,.12)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h2 style={{color:"#0D1F3C",fontSize:20,fontWeight:700,margin:0}}>Términos y Condiciones</h2>
          <button onClick={()=>setShowTerminos(false)} style={{background:"none",border:"1px solid #DDE5F5",borderRadius:8,color:"#666",padding:"6px 14px",cursor:"pointer",fontSize:13,fontFamily:FONT}}>← Volver</button>
        </div>
        {[
          ["1. Aceptación","Al registrarte en Luderis aceptás estos términos. Si no estás de acuerdo, no uses la plataforma."],
          ["2. Descripción del servicio","Luderis es una plataforma que conecta docentes y estudiantes. Facilitamos el encuentro entre partes pero no somos empleadores, agencias ni intermediarios educativos oficiales."],
          ["3. Registro y cuenta","Debés tener al menos 18 años o contar con autorización de un tutor legal. Sos responsable de mantener la confidencialidad de tu contraseña y de toda la actividad que ocurra en tu cuenta."],
          ["4. Uso aceptable","Está prohibido publicar contenido falso, ofensivo, discriminatorio o ilegal. No podés usar la plataforma para acosar, engañar o perjudicar a otros usuarios. Cualquier transacción económica es responsabilidad exclusiva de las partes involucradas."],
          ["5. Contenido del usuario","Al publicar contenido en Luderis (descripciones, materiales, reseñas), otorgás a Luderis una licencia no exclusiva para mostrarlo en la plataforma. Sos el único responsable del contenido que publicás."],
          ["6. Privacidad","Recopilamos tu email y la información que voluntariamente proporcionás (nombre, bio, ubicación). No vendemos tus datos a terceros. Podemos usar datos agregados y anónimos para mejorar el servicio."],
          ["7. Limitación de responsabilidad","Luderis no garantiza la calidad, idoneidad ni veracidad de los servicios ofrecidos por los docentes. No somos responsables por disputas, daños o pérdidas que surjan de las relaciones entre usuarios."],
          ["8. Modificaciones","Podemos actualizar estos términos con previo aviso de 30 días por email. El uso continuado de la plataforma implica la aceptación de los nuevos términos."],
          ["9. Contacto","Ante dudas o reclamos escribinos a contacto@luderis.com"],
        ].map(([titulo,texto])=>(
          <div key={titulo} style={{marginBottom:18,paddingBottom:18,borderBottom:"1px solid #F4F7FF"}}>
            <div style={{fontWeight:700,color:"#0D1F3C",fontSize:14,marginBottom:6}}>{titulo}</div>
            <p style={{color:"#4A5568",fontSize:13,lineHeight:1.7,margin:0}}>{texto}</p>
          </div>
        ))}
        <p style={{color:"#A0AEC0",fontSize:11,textAlign:"center",margin:"16px 0 12px"}}>Última actualización: {new Date().toLocaleDateString("es-AR",{month:"long",year:"numeric"})}</p>
        <button onClick={()=>{setAceptoTerminos(true);setShowTerminos(false);}}
          style={{width:"100%",background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"13px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:FONT}}>
          Acepto los Términos y Condiciones ✓
        </button>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",display:"flex",fontFamily:FONT,background:"#F6F9FF"}}>
      <style>{`
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .auth-left{display:flex!important}
        @media(max-width:720px){.auth-left{display:none!important}}
        .auth-logo-mobile{display:none!important}
        @media(max-width:720px){.auth-logo-mobile{display:flex!important}}
      `}</style>

      {/* ── Panel izquierdo — branding ── */}
      <div className="auth-left" style={{flex:"0 0 380px",background:"linear-gradient(160deg,#0A2A5E 0%,#1A6ED8 55%,#2EC4A0 100%)",display:"flex",flexDirection:"column",padding:"48px 40px",position:"relative",overflow:"hidden",justifyContent:"space-between"}}>
        {/* Orbes decorativos */}
        <div style={{position:"absolute",width:320,height:320,borderRadius:"50%",background:"rgba(255,255,255,.04)",top:-80,right:-80,pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",background:"rgba(46,196,160,.1)",bottom:40,left:-60,pointerEvents:"none"}}/>

        {/* Logo + nombre */}
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:52}}>
            <div style={{width:52,height:52,borderRadius:14,background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,.15)",animation:"floatY 4s ease-in-out infinite"}}>
              <img src="/logo.png" alt="Luderis" style={{width:36,height:36,objectFit:"contain"}}/>
            </div>
            <span style={{fontSize:26,fontWeight:800,color:"#fff",letterSpacing:"-.5px"}}>Luderis</span>
          </div>
          <h2 style={{color:"#fff",fontSize:30,fontWeight:800,lineHeight:1.2,margin:"0 0 14px",letterSpacing:"-.5px"}}>
            Aprendé lo que quieras, enseñá lo que sabés.
          </h2>
          <p style={{color:"rgba(255,255,255,.7)",fontSize:14,lineHeight:1.75,margin:0}}>
            Conectamos personas para compartir conocimiento. Sin intermediarios ni comisiones.
          </p>
        </div>

        {/* Stats */}
        <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:12}}>
          {[
            {n:"Clases particulares",d:"Encontrá tu docente ideal"},
            {n:"Cursos completos",d:"Con evaluaciones y certificados"},
            {n:"Búsqueda con IA",d:"Te encuentra lo mejor"},
          ].map(({n,d})=>(
            <div key={n} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,.08)",borderRadius:12,padding:"11px 14px",backdropFilter:"blur(4px)"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:LUD.teal,flexShrink:0}}/>
              <div>
                <div style={{color:"#fff",fontWeight:600,fontSize:13}}>{n}</div>
                <div style={{color:"rgba(255,255,255,.6)",fontSize:11,marginTop:1}}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
        <div style={{width:"min(420px,100%)",animation:"fadeSlideUp .5s ease both"}}>

          {/* Logo mobile */}
          <div className="auth-logo-mobile" style={{alignItems:"center",gap:10,marginBottom:24,justifyContent:"center"}}>
            <img src="/logo.png" alt="Luderis" style={{width:40,height:40,objectFit:"contain"}}/>
            <span style={{fontSize:22,fontWeight:800,background:LUD.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Luderis</span>
          </div>
          {/* Volver a la landing */}
          <button onClick={()=>{sessionStorage.removeItem("ld_auth");window.location.hash="";window.location.reload();}}
            style={{background:"none",border:"none",color:"#718096",fontSize:13,cursor:"pointer",fontFamily:FONT,padding:"0 0 18px",display:"flex",alignItems:"center",gap:5,transition:"color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.color=LUD.blue}
            onMouseLeave={e=>e.currentTarget.style.color="#718096"}>
            ← Volver al inicio
          </button>

          <h2 style={{color:"#0D1F3C",fontSize:24,fontWeight:800,margin:"0 0 4px",letterSpacing:"-.4px"}}>
            {mode==="login"?t("welcomeBack"):mode==="register"?t("createAccount"):"Recuperar contraseña"}
          </h2>
          <p style={{color:"#718096",fontSize:14,margin:"0 0 28px"}}>
            {mode==="login"?"Ingresá para continuar":mode==="register"?t("freeAlways"):"Te enviamos un link a tu email"}
          </p>

          {/* Google OAuth */}
          {mode!=="forgot"&&(
            <>
              <button onClick={handleGoogle} disabled={loading}
                style={{width:"100%",background:"#fff",border:"1.5px solid #DDE5F5",borderRadius:12,padding:"12px 16px",fontFamily:FONT,fontSize:14,fontWeight:600,color:"#0D1F3C",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16,transition:"box-shadow .15s,border-color .15s",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#1A6ED8";e.currentTarget.style.boxShadow="0 2px 10px rgba(26,110,216,.15)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#DDE5F5";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.06)";}}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
                Continuar con Google
              </button>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                <div style={{flex:1,height:1,background:"#DDE5F5"}}/>
                <span style={{color:"#A0AEC0",fontSize:12,whiteSpace:"nowrap"}}>o con email</span>
                <div style={{flex:1,height:1,background:"#DDE5F5"}}/>
              </div>
            </>
          )}

          {/* Tabs */}
          {mode!=="forgot"&&(
            <div style={{display:"flex",background:"#EEF3FF",borderRadius:12,padding:4,marginBottom:24}}>
              {["login","register"].map(m=>(
                <button key={m} onClick={()=>{setMode(m);setErr("");setOk("");}}
                  style={{flex:1,padding:"9px 0",borderRadius:9,border:"none",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:600,
                    background:mode===m?"#fff":"transparent",
                    color:mode===m?LUD.blue:"#718096",
                    boxShadow:mode===m?"0 2px 8px rgba(26,110,216,.12)":"none",
                    transition:"all .15s"}}>
                  {m==="login"?t("signin"):t("register")}
                </button>
              ))}
            </div>
          )}

          {mode==="forgot"?(
            <>
              <input type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={iS} onFocus={focusI} onBlur={blurI}/>
              {err&&<div style={{color:"#E53E3E",fontSize:12,marginBottom:10,display:"flex",gap:5,alignItems:"center"}}>⚠ {err}</div>}
              {ok&&<div style={{color:"#2E7D52",fontSize:13,marginBottom:10,background:"#E8F5EE",borderRadius:8,padding:"8px 12px"}}>{ok}</div>}
              <button onClick={handle} disabled={loading}
                style={{width:"100%",background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"13px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:FONT,marginBottom:14,opacity:loading?.6:1,boxShadow:"0 4px 14px rgba(26,110,216,.3)"}}>
                {loading?"Enviando...":"Enviar link de recuperación"}
              </button>
              <button onClick={()=>{setMode("login");setErr("");setOk("");}}
                style={{width:"100%",background:"none",border:"none",color:LUD.blue,fontSize:13,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>
                ← Volver al inicio de sesión
              </button>
            </>
          ):(
            <>
              <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={iS} onFocus={focusI} onBlur={blurI} onKeyDown={e=>e.key==="Enter"&&handle()}/>
              <input type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)} style={iS} onFocus={focusI} onBlur={blurI} onKeyDown={e=>e.key==="Enter"&&handle()}/>
              {mode==="register"&&(
                <input type="password" placeholder="Repetir contraseña" value={pass2} onChange={e=>setPass2(e.target.value)} style={iS} onFocus={focusI} onBlur={blurI}/>
              )}
              {mode==="register"&&(
                <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:16}}>
                  <button onClick={()=>setAceptoTerminos(v=>!v)}
                    style={{width:20,height:20,flexShrink:0,borderRadius:5,border:`2px solid ${aceptoTerminos?LUD.blue:"#CBD5E0"}`,background:aceptoTerminos?LUD.grad:"transparent",cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
                    {aceptoTerminos&&<span style={{color:"#fff",fontSize:11,fontWeight:700}}>✓</span>}
                  </button>
                  <span style={{fontSize:12,color:"#718096",lineHeight:1.6}}>
                    Acepto los{" "}
                    <button onClick={()=>setShowTerminos(true)} style={{background:"none",border:"none",color:LUD.blue,cursor:"pointer",fontSize:12,fontFamily:FONT,padding:0,textDecoration:"underline",fontWeight:600}}>Términos y Condiciones</button>
                  </span>
                </div>
              )}
              {err&&<div style={{color:"#E53E3E",fontSize:12,marginBottom:12,display:"flex",gap:5,alignItems:"center"}}>⚠ {err}</div>}
              {ok&&<div style={{color:"#2E7D52",fontSize:13,marginBottom:12,background:"#E8F5EE",borderRadius:8,padding:"9px 12px"}}>{ok}</div>}
              <button onClick={handle} disabled={loading||(mode==="register"&&!aceptoTerminos)}
                style={{width:"100%",background:LUD.grad,border:"none",borderRadius:20,color:"#fff",padding:"14px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:FONT,marginBottom:14,
                  boxShadow:"0 4px 18px rgba(26,110,216,.35)",transition:"opacity .15s,box-shadow .15s",
                  opacity:(loading||(mode==="register"&&!aceptoTerminos))?.5:1}}>
                {loading?"...":(mode==="login"?t("enterBtn"):t("createBtn"))}
              </button>
              {mode==="login"&&(
                <div style={{textAlign:"center"}}>
                  <button onClick={()=>{setMode("forgot");setErr("");setOk("");}}
                    style={{background:"none",border:"none",color:"#718096",fontSize:13,cursor:"pointer",fontFamily:FONT}}>
                    {t("forgotPass")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

export default AuthScreen;
