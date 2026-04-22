import React from 'react';

// Fragment shader de fondo: campo de flujo con interferencia
// Original, responde al scroll y al cursor
function Shader({intensity=1, palette='blue', className='', style={}}){
  const canvasRef = React.useRef(null);
  const stateRef = React.useRef({mx:0.5, my:0.5, scroll:0, t0:performance.now()});

  React.useEffect(()=>{
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', {premultipliedAlpha:false, antialias:true});
    if(!gl) return;

    const vs = `
      attribute vec2 p;
      void main(){ gl_Position = vec4(p,0.,1.); }
    `;
    const fs = `
      precision highp float;
      uniform vec2 uRes;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uScroll;
      uniform float uIntensity;
      uniform vec3 uA;
      uniform vec3 uB;
      uniform vec3 uC;

      // hash & noise
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p);
        vec2 u=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
                   mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
      }
      float fbm(vec2 p){
        float v=0., a=.5;
        for(int i=0;i<3;i++){ v+=a*noise(p); p*=2.02; a*=.5; }
        return v;
      }

      void main(){
        vec2 uv = (gl_FragCoord.xy - .5*uRes) / min(uRes.x,uRes.y);
        vec2 m  = (uMouse - .5);
        float t = uTime*.08;

        // domain warp — campo de flujo
        vec2 q = uv*1.8;
        q += .6*vec2(fbm(q+t),fbm(q-t+7.3));
        q += .35*vec2(fbm(q*2.+t*1.3),fbm(q*2.-t));

        // ondas de interferencia entre dos "fuentes"
        vec2 s1 = vec2(-.55,-.2) + m*.25;
        vec2 s2 = vec2( .55, .2) - m*.25;
        float d1 = length(q - s1);
        float d2 = length(q - s2);
        float w1 = sin(d1*11. - uTime*.9);
        float w2 = sin(d2*11. - uTime*.7);
        float interf = (w1+w2)*.5;

        // ripple del scroll
        float ring = sin( length(uv)*14. - uScroll*3.14*2.)*.5+.5;

        float field = fbm(q + interf*.4);
        float mask  = smoothstep(.25,.85, field);

        // paleta: 3 stops
        vec3 col = mix(uA, uB, smoothstep(.1,.9,mask));
        col = mix(col, uC, smoothstep(.55,1., field + interf*.15));

        // brillo sutil en las crestas
        float crest = smoothstep(.45,.5, abs(interf));
        col += crest * uC * .35;

        // ring bloom ligado al scroll
        col += ring * .06 * uC;

        // vignette suave hacia el papel
        float vig = smoothstep(1.2,.25, length(uv));
        col = mix(uA*1.02, col, vig);

        col *= uIntensity;
        gl_FragColor = vec4(col,1.);
      }
    `;

    const compile = (type, src)=>{
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog,'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {
      res: gl.getUniformLocation(prog,'uRes'),
      time: gl.getUniformLocation(prog,'uTime'),
      mouse: gl.getUniformLocation(prog,'uMouse'),
      scroll: gl.getUniformLocation(prog,'uScroll'),
      intensity: gl.getUniformLocation(prog,'uIntensity'),
      a: gl.getUniformLocation(prog,'uA'),
      b: gl.getUniformLocation(prog,'uB'),
      c: gl.getUniformLocation(prog,'uC'),
    };

    // paletas Luderis — colores exactos de la app
    // Cursos:  #1A6ED8 azul  +  #2EC4A0 teal
    // Clases:  #E8891C naranja  +  #F4C030 amber
    // Pedidos: #7B5CF0 violeta  +  #D85AA3 rosa
    const palettes = {
      // familia Cursos — A más claro para que nunca se vea negro
      blue:    [[0.08,0.25,0.55],[0.10,0.43,0.85],[0.18,0.77,0.63]],
      dark:    [[0.06,0.20,0.48],[0.10,0.43,0.85],[0.18,0.77,0.63]],
      warm:    [[0.08,0.25,0.55],[0.18,0.77,0.63],[0.10,0.43,0.85]],
      deep:    [[0.08,0.22,0.52],[0.10,0.43,0.85],[0.18,0.77,0.63]],
      // Clases — A naranja claro para que no se vea marrón
      amber:   [[0.60,0.30,0.05],[0.91,0.54,0.11],[0.96,0.75,0.19]],
      // Pedidos — A violeta claro
      pedidos: [[0.28,0.14,0.52],[0.48,0.36,0.94],[0.85,0.35,0.64]],
    };

    // DPR capped at 1 — retina no aporta al shader y duplica el costo GPU
    const resize = ()=>{
      const dpr = Math.min(window.devicePixelRatio||1, 1);
      const w = Math.round(canvas.clientWidth*dpr);
      const h = Math.round(canvas.clientHeight*dpr);
      if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h); }
    };
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    resize();

    const onMove = (e)=>{
      const r = canvas.getBoundingClientRect();
      stateRef.current.mx = (e.clientX - r.left)/r.width;
      stateRef.current.my = 1 - (e.clientY - r.top)/r.height;
    };
    const onScroll = ()=>{
      const max = Math.max(1,document.body.scrollHeight - window.innerHeight);
      stateRef.current.scroll = window.scrollY/max;
    };
    window.addEventListener('pointermove', onMove, {passive:true});
    window.addEventListener('scroll', onScroll, {passive:true});

    // Pausa el DIBUJO cuando no está visible, pero RAF sigue corriendo → sin restart lag
    let visible = true;
    const io = new IntersectionObserver(entries=>{
      visible = entries[0].isIntersecting;
    }, {threshold: 0});
    io.observe(canvas);

    // Throttle: renderiza cada 2 frames (~30fps) para reducir carga GPU
    let raf, frame = 0;
    const loop = ()=>{
      frame++;
      if(frame % 2 === 0 && visible){
        const s = stateRef.current;
        const t = (performance.now()-s.t0)/1000;
        const pal = palettes[palette] || palettes.blue;
        gl.uniform2f(U.res, canvas.width, canvas.height);
        gl.uniform1f(U.time, t);
        gl.uniform2f(U.mouse, s.mx, s.my);
        gl.uniform1f(U.scroll, s.scroll);
        gl.uniform1f(U.intensity, intensity);
        gl.uniform3fv(U.a, pal[0]);
        gl.uniform3fv(U.b, pal[1]);
        gl.uniform3fv(U.c, pal[2]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return ()=>{
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, [palette, intensity]);

  return <canvas ref={canvasRef} className={className} style={{display:'block', width:'100%', height:'100%', ...style}}/>;
}

export { Shader };
