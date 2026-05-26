
// --- primitives.jsx ---
// Primitivos reutilizables

// Reveal: anima entrada al entrar en viewport
function Reveal({
  children,
  delay = 0,
  y = 24,
  className = '',
  style = {},
  as = 'div'
}) {
  const ref = React.useRef(null);
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setOn(true);
          io.unobserve(el);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -80px 0px'
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, {
    ref: ref,
    className: className,
    style: {
      ...style,
      opacity: on ? 1 : 0,
      transform: on ? 'translate3d(0,0,0)' : `translate3d(0,${y}px,0)`,
      transition: `opacity .9s cubic-bezier(.2,.7,.2,1) ${delay}s, transform .9s cubic-bezier(.2,.7,.2,1) ${delay}s`,
      willChange: 'opacity,transform'
    }
  }, children);
}

// Counter animado
function Counter({
  to,
  suffix = '',
  duration = 1800
}) {
  const ref = React.useRef(null);
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf,
      started = false,
      t0;
    const step = t => {
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      setVal(Math.round(to * e));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !started) {
          started = true;
          raf = requestAnimationFrame(step);
          io.unobserve(el);
        }
      });
    }, {
      threshold: 0.4
    });
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [to, duration]);
  const formatted = val.toLocaleString('es-AR');
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      fontVariantNumeric: 'tabular-nums'
    }
  }, formatted, suffix);
}

// Marquee horizontal infinito con soporte reverse y pausa en hover
function Marquee({
  children,
  speed = 40,
  reverse = false,
  className = '',
  style = {}
}) {
  const [paused, setPaused] = React.useState(false);
  const anim = reverse ? 'lud-marquee-rev' : 'lud-marquee';
  return /*#__PURE__*/React.createElement("div", {
    className: className,
    style: {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      ...style
    },
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      animation: `${anim} ${speed}s linear infinite`,
      animationPlayState: paused ? 'paused' : 'running',
      gap: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 40,
      paddingRight: 40
    }
  }, children), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 40,
      paddingRight: 40
    },
    "aria-hidden": true
  }, children)), /*#__PURE__*/React.createElement("style", null, `
        @keyframes lud-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes lud-marquee-rev{from{transform:translateX(-50%)}to{transform:translateX(0)}}
      `));
}

// Barra de progreso de scroll pegada arriba
function ScrollProgress() {
  const [p, setP] = React.useState(0);
  React.useEffect(() => {
    const fn = () => {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      setP(window.scrollY / max);
    };
    window.addEventListener('scroll', fn, {
      passive: true
    });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      zIndex: 9999,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: 'linear-gradient(90deg,var(--blue) 0%,var(--orange) 100%)',
      width: `${p * 100}%`,
      transition: 'width .08s linear',
      borderRadius: '0 3px 3px 0'
    }
  }));
}

// Estrella SVG para testimonios
function SvgStar({
  color = 'var(--orange)',
  size = 14
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color,
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("polygon", {
    points: "12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
  }));
}

// Kicker (etiqueta monoespaciada)
function Kicker({
  children,
  color = 'var(--ink)',
  dot = true
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '.12em',
      textTransform: 'uppercase',
      color
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 0 3px ${color}22`
    }
  }), children);
}

// Pill
function Pill({
  children,
  variant = 'line'
}) {
  const styles = {
    line: {
      border: '1px solid var(--line)',
      background: 'transparent'
    },
    ink: {
      border: '1px solid var(--ink)',
      background: 'var(--ink)',
      color: 'var(--paper)'
    },
    blue: {
      border: '1px solid var(--blue)',
      background: 'var(--blue)',
      color: '#fff'
    }
  }[variant];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      borderRadius: 99,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '.06em',
      ...styles
    }
  }, children);
}

// Magnetic button: atrae el cursor sutilmente
function MagBtn({
  children,
  onClick,
  variant = 'ink',
  style = {},
  icon = 'arrow',
  className = ''
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const strength = 14;
    const onMove = e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x / r.width * strength}px, ${y / r.height * strength}px)`;
    };
    const onLeave = () => {
      el.style.transform = 'translate(0,0)';
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  const vs = {
    ink: {
      background: 'var(--ink)',
      color: 'var(--paper)',
      border: '1px solid var(--ink)'
    },
    blue: {
      background: 'var(--blue)',
      color: '#fff',
      border: '1px solid var(--blue)'
    },
    orange: {
      background: 'var(--orange)',
      color: 'var(--ink)',
      border: '1px solid var(--orange)'
    },
    line: {
      background: 'transparent',
      color: 'var(--ink)',
      border: '1px solid var(--ink)'
    },
    paper: {
      background: 'var(--paper)',
      color: 'var(--ink)',
      border: '1px solid var(--paper)'
    },
    gradient: {
      background: 'linear-gradient(135deg, var(--blue) 0%, var(--orange) 100%)',
      color: '#fff',
      border: 'none'
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", {
    ref: ref,
    onClick: onClick,
    "data-cursor": true,
    "data-cursor-label": "TAP",
    className: className,
    style: {
      ...vs,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '14px 22px',
      borderRadius: 99,
      fontFamily: 'var(--font-display)',
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: '-.01em',
      transition: 'transform .3s cubic-bezier(.2,.7,.2,1), background .2s, color .2s',
      willChange: 'transform',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", null, children), icon === 'arrow' && /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 8h10M9 4l4 4-4 4",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })));
}

// Noise overlay (grain)
function Grain({
  opacity = 0.05,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      mixBlendMode: 'multiply',
      opacity,
      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
      ...style
    }
  });
}
function useWindowWidth() {
  const [w, setW] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h, {
      passive: true
    });
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}
Object.assign(window, {
  Reveal,
  Counter,
  Marquee,
  Kicker,
  Pill,
  MagBtn,
  Grain,
  useWindowWidth,
  ScrollProgress,
  SvgStar
});

// --- shader.jsx ---
// Fragment shader de fondo: campo de flujo con interferencia
// Original, responde al scroll y al cursor
function Shader({
  intensity = 1,
  palette = 'blue',
  className = '',
  style = {}
}) {
  const canvasRef = React.useRef(null);
  const stateRef = React.useRef({
    mx: 0.5,
    my: 0.5,
    scroll: 0,
    t0: performance.now()
  });
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', {
      premultipliedAlpha: false,
      antialias: true
    });
    if (!gl) return;
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

        // vignette suave — base más clara para evitar esquinas negras
        float vig = smoothstep(1.4,.4, length(uv));
        col = mix(uA*1.35, col, vig);

        col *= uIntensity;
        gl_FragColor = vec4(col,1.);
      }
    `;
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      mouse: gl.getUniformLocation(prog, 'uMouse'),
      scroll: gl.getUniformLocation(prog, 'uScroll'),
      intensity: gl.getUniformLocation(prog, 'uIntensity'),
      a: gl.getUniformLocation(prog, 'uA'),
      b: gl.getUniformLocation(prog, 'uB'),
      c: gl.getUniformLocation(prog, 'uC')
    };

    // paletas Luderis — colores exactos de la app
    // Cursos:  #1A6ED8 azul  +  #2EC4A0 teal
    // Clases:  #E8891C naranja  +  #F4C030 amber
    // Pedidos: #7B5CF0 violeta  +  #D85AA3 rosa
    const palettes = {
      // familia Cursos — base más clara para evitar oscuridad excesiva
      blue: [[0.18, 0.40, 0.72], [0.16, 0.55, 0.94], [0.24, 0.84, 0.74]],
      dark: [[0.14, 0.33, 0.64], [0.16, 0.55, 0.94], [0.24, 0.84, 0.74]],
      warm: [[0.16, 0.40, 0.70], [0.24, 0.84, 0.74], [0.16, 0.55, 0.94]],
      deep: [[0.16, 0.36, 0.68], [0.16, 0.55, 0.94], [0.24, 0.84, 0.74]],
      // Clases — naranja/ámbar vibrante, sin marrón oscuro
      amber: [[0.78, 0.46, 0.10], [0.96, 0.62, 0.16], [0.99, 0.82, 0.24]],
      // Pedidos — violeta vibrante
      pedidos: [[0.40, 0.24, 0.68], [0.58, 0.45, 0.97], [0.90, 0.42, 0.72]]
    };

    // DPR capped at 1 — retina no aporta al shader y duplica el costo GPU
    let resizeTimer;
    const doResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    // Debounce: evita resetear el canvas durante CSS transitions (p.ej. split hero hover)
    // canvas.width = X limpia el canvas; deferirlo 80ms hasta que el resize se estabilice
    const resize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 80);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    doResize(); // primer call inmediato

    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      stateRef.current.mx = (e.clientX - r.left) / r.width;
      stateRef.current.my = 1 - (e.clientY - r.top) / r.height;
    };
    const onScroll = () => {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      stateRef.current.scroll = window.scrollY / max;
    };
    window.addEventListener('pointermove', onMove, {
      passive: true
    });
    window.addEventListener('scroll', onScroll, {
      passive: true
    });

    // Pausa el DIBUJO cuando no está visible, pero RAF sigue corriendo → sin restart lag
    let visible = true;
    const io = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
    }, {
      threshold: 0
    });
    io.observe(canvas);

    // Throttle: renderiza cada 2 frames (~30fps) para reducir carga GPU
    let raf,
      frame = 0;
    const loop = () => {
      frame++;
      if (frame % 2 === 0 && visible) {
        const s = stateRef.current;
        const t = (performance.now() - s.t0) / 1000;
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
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, [palette, intensity]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    className: className,
    style: {
      display: 'block',
      width: '100%',
      height: '100%',
      ...style
    }
  });
}
window.Shader = Shader;

// --- cursor.jsx ---
// Cursor custom: orbe con trail + magnetic hover
function Cursor() {
  const isTouch = window.matchMedia('(pointer:coarse)').matches;
  if (isTouch) return null;
  const dotRef = React.useRef(null);
  const ringRef = React.useRef(null);
  const stateRef = React.useRef({
    x: -100,
    y: -100,
    rx: -100,
    ry: -100,
    scale: 1,
    tScale: 1,
    label: ''
  });
  const [label, setLabel] = React.useState('');
  React.useEffect(() => {
    const onMove = e => {
      stateRef.current.x = e.clientX;
      stateRef.current.y = e.clientY;
      const el = e.target.closest('[data-cursor]');
      stateRef.current.tScale = el ? 2.4 : 1;
      const l = el ? el.getAttribute('data-cursor-label') || '' : '';
      if (l !== stateRef.current.label) {
        stateRef.current.label = l;
        setLabel(l);
      }
    };
    window.addEventListener('pointermove', onMove, {
      passive: true
    });
    let raf;
    const loop = () => {
      const s = stateRef.current;
      s.rx += (s.x - s.rx) * 0.22;
      s.ry += (s.y - s.ry) * 0.22;
      s.scale += (s.tScale - s.scale) * 0.15;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${s.x - 4}px,${s.y - 4}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${s.rx - 18}px,${s.ry - 18}px) scale(${s.scale})`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    ref: dotRef,
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--ink)',
      pointerEvents: 'none',
      zIndex: 9999,
      mixBlendMode: 'difference'
    }
  }), /*#__PURE__*/React.createElement("div", {
    ref: ringRef,
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: 36,
      height: 36,
      borderRadius: '50%',
      border: '1.5px solid var(--ink)',
      pointerEvents: 'none',
      zIndex: 9998,
      mixBlendMode: 'difference',
      transition: 'border-color .2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      fontWeight: 600,
      color: 'var(--ink)',
      whiteSpace: 'nowrap',
      transform: 'translateY(0)',
      letterSpacing: '.5px'
    }
  }, label)));
}
window.Cursor = Cursor;

// --- nav.jsx ---
// Nav + ticker superior
function Ticker() {
  const items = [{
    k: 'AR',
    v: 'Plataforma educativa argentina'
  }, {
    k: 'v2026.1',
    v: 'Búsqueda semántica con IA'
  }, {
    k: 'NEW',
    v: 'Certificados verificables on-chain'
  }, {
    k: 'LIVE',
    v: '14.203 clases activas esta semana'
  }, {
    k: 'MATCH',
    v: 'Tu próxima clase a un scroll'
  }, {
    k: 'AR',
    v: 'Plataforma educativa argentina'
  }, {
    k: 'v2026.1',
    v: 'Búsqueda semántica con IA'
  }, {
    k: 'NEW',
    v: 'Certificados verificables on-chain'
  }, {
    k: 'LIVE',
    v: '14.203 clases activas esta semana'
  }, {
    k: 'AI',
    v: 'Match en menos de 2 minutos'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--ink)',
      color: 'var(--paper)',
      padding: '8px 0',
      overflow: 'hidden',
      borderBottom: '1px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement(Marquee, {
    speed: 55
  }, items.map((it, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '.06em'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '2px 8px',
      borderRadius: 99,
      background: i % 3 === 0 ? 'var(--orange)' : 'var(--blue)',
      color: i % 3 === 0 ? 'var(--ink)' : '#fff',
      fontSize: 10,
      fontWeight: 600
    }
  }, it.k), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .85
    }
  }, it.v), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .35
    }
  }, "\u25C6")))));
}
function Nav({
  onEnter
}) {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [['inicio', 'Inicio'], ['mundos', 'Dos mundos'], ['features', 'Funciones'], ['como', 'Cómo funciona'], ['nosotros', 'Nosotros'], ['contacto', 'Contacto']];
  const go = id => document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 80,
      isolation: 'isolate'
    }
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      background: scrolled ? 'color-mix(in srgb, var(--paper) 78%, transparent)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px) saturate(1.2)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(1.2)' : 'none',
      borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
      transition: 'background .3s, border-color .3s, backdrop-filter .3s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1400,
      margin: '0 auto',
      padding: '16px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#inicio",
    onClick: e => {
      e.preventDefault();
      go('inicio');
    },
    "data-cursor": true,
    "data-cursor-label": "HOME",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(LudLogo, {
    size: 28
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 20,
      letterSpacing: '-.03em'
    }
  }, "Luderis"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: 'var(--muted)',
      marginLeft: 2,
      padding: '2px 6px',
      border: '1px solid var(--line)',
      borderRadius: 4
    }
  }, "v2026.1")), /*#__PURE__*/React.createElement("div", {
    className: "lud-nav-links",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      background: 'var(--paper)',
      border: '1px solid var(--line)',
      borderRadius: 99,
      padding: 4
    }
  }, links.map(([id, l]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => go(id),
    "data-cursor": true,
    style: {
      background: 'transparent',
      border: 'none',
      padding: '8px 14px',
      borderRadius: 99,
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--ink-2)',
      fontFamily: 'inherit',
      transition: 'background .2s, color .2s'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--ink)';
      e.currentTarget.style.color = 'var(--paper)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = 'var(--ink-2)';
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onEnter,
    "data-cursor": true,
    "data-cursor-label": "LOGIN",
    className: "lud-nav-ingresar",
    style: {
      background: 'transparent',
      border: 'none',
      padding: '10px 16px',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--ink)',
      fontFamily: 'inherit',
      borderRadius: 99
    }
  }, "Ingresar"), /*#__PURE__*/React.createElement(MagBtn, {
    onClick: onEnter,
    variant: "gradient",
    className: "lud-nav-cta"
  }, "Empezar gratis"), /*#__PURE__*/React.createElement("button", {
    className: "lud-burger",
    onClick: () => setMobile(m => !m),
    style: {
      display: 'none',
      background: 'none',
      border: '1px solid var(--line)',
      borderRadius: 12,
      padding: 10,
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 1.5,
      background: 'var(--ink)',
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 1.5,
      background: 'var(--ink)',
      display: 'block'
    }
  })))), mobile && /*#__PURE__*/React.createElement("div", {
    className: "lud-mobile-menu",
    style: {
      borderTop: '1px solid var(--line)',
      padding: '12px 20px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, links.map(([id, l]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => {
      go(id);
      setMobile(false);
    },
    style: {
      textAlign: 'left',
      background: 'none',
      border: 'none',
      padding: '12px 0',
      fontSize: 16,
      fontWeight: 500,
      color: 'var(--ink)',
      fontFamily: 'inherit',
      borderBottom: '1px solid var(--line)'
    }
  }, l)))), /*#__PURE__*/React.createElement("style", null, `
        @media (max-width: 960px){
          .lud-nav-links{display:none !important}
          .lud-burger{display:flex !important}
        }
        @media (max-width: 640px){
          .lud-nav-links{display:none !important}
          .lud-nav-ingresar{display:none !important}
          .lud-nav-cta{padding:9px 14px !important;font-size:13px !important}
        }
      `));
}
function LudLogo({
  size = 28
}) {
  return /*#__PURE__*/React.createElement("img", {
    src: "../logo.png",
    alt: "Luderis",
    width: size,
    height: size,
    style: {
      display: 'block',
      borderRadius: Math.round(size * 0.22),
      flexShrink: 0
    }
  });
}
Object.assign(window, {
  Nav,
  LudLogo,
  Ticker
});

// --- trustbar.jsx ---
// TrustBar — stack tecnológico real de Luderis
function TrustBar() {
  const techs = [{
    label: 'MercadoPago',
    desc: 'Pagos',
    color: '#00B1EA'
  }, {
    label: 'OpenAI',
    desc: 'Búsqueda IA',
    color: '#10A37F'
  }, {
    label: 'Google',
    desc: 'Autenticación',
    color: '#4285F4'
  }, {
    label: 'Supabase',
    desc: 'Base de datos',
    color: '#3ECF8E'
  }, {
    label: 'Vercel',
    desc: 'Infraestructura',
    color: '#fff'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--ink)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '28px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1344,
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      gap: 48,
      flexWrap: 'wrap',
      justifyContent: 'space-between'
    },
    className: "lud-trust-row"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.16em',
      color: 'oklch(1 0 0 / .35)',
      textTransform: 'uppercase',
      flexShrink: 0
    }
  }, "Construido sobre"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 40,
      flexWrap: 'wrap',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center'
    }
  }, techs.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.label,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'oklch(1 0 0 / .3)'
    }
  }, t.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: '-.02em',
      color: t.color
    }
  }, t.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.14em',
      color: 'oklch(1 0 0 / .25)',
      flexShrink: 0
    }
  }, "100% argentino")), /*#__PURE__*/React.createElement("style", null, `@media(max-width:640px){.lud-trust-row{gap:24px!important; justify-content:center!important;}}`));
}
window.TrustBar = TrustBar;

// --- hero.jsx ---
// Hero split-screen animado aprender / enseñar
function Hero({
  onEnter
}) {
  const w = useWindowWidth();
  const isMobile = w <= 640;
  const [side, setSide] = React.useState(null); // null | 'learn' | 'teach'
  const [query, setQuery] = React.useState('fotografía de retrato nocturno');
  const ref = React.useRef(null);

  // parallax del orbe shader
  const [p, setP] = React.useState(0);
  React.useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const k = 1 - Math.max(0, Math.min(1, r.bottom / window.innerHeight));
      setP(k);
    };
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const leftPct = side === 'learn' ? 68 : side === 'teach' ? 32 : 50;
  return /*#__PURE__*/React.createElement("section", {
    id: "inicio",
    ref: ref,
    style: {
      position: 'relative',
      padding: '40px 0 0',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      opacity: .68,
      pointerEvents: 'none',
      maskImage: 'radial-gradient(ellipse at 50% 40%, black 55%, transparent 90%)',
      WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 55%, transparent 90%)'
    }
  }, /*#__PURE__*/React.createElement(Shader, {
    palette: "deep",
    intensity: 1
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1400,
      margin: '0 auto',
      padding: isMobile ? '0 16px' : '0 28px',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 20,
      flexWrap: 'wrap',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(Kicker, {
    color: "var(--ink)"
  }, "Luderis \xB7 Buenos Aires, 2026")), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Pill, null, "Beta abierta"), /*#__PURE__*/React.createElement(Pill, null, "Buenos Aires, AR")))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.15
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'clamp(56px, 11vw, 180px)',
      fontWeight: 700,
      letterSpacing: '-.055em',
      lineHeight: .92,
      margin: '16px 0 0',
      color: 'var(--ink)',
      textWrap: 'balance'
    }
  }, "Aprend\xE9", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '.15em',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", null, "lo que"), /*#__PURE__*/React.createElement(InlineMorph, null)))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.25
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 40,
      marginTop: 28,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 19,
      lineHeight: 1.45,
      color: 'var(--ink-2)',
      maxWidth: 460,
      margin: 0,
      textWrap: 'pretty'
    }
  }, "Siempre hay alguien dispuesto a ense\xF1ar lo que otro quiere aprender. Sin cat\xE1logo fijo, sin filtros que te limiten. Vos decid\xEDs qu\xE9, cu\xE1ndo y c\xF3mo."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(MagBtn, {
    onClick: onEnter,
    variant: "ink"
  }, "Crear cuenta"), /*#__PURE__*/React.createElement(MagBtn, {
    onClick: () => document.getElementById('mundos')?.scrollIntoView({
      behavior: 'smooth'
    }),
    variant: "line",
    icon: "arrow"
  }, "Explorar")))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.35
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      background: 'var(--ink)',
      color: 'var(--paper)',
      borderRadius: 20,
      padding: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      boxShadow: '0 20px 60px -20px oklch(0.15 0.03 260 / 0.5)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      color: 'var(--paper)'
    }
  }, /*#__PURE__*/React.createElement(SparkIcon, null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '.1em',
      opacity: .7
    }
  }, "BUSCAR CON IA")), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => setQuery(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') onEnter();
    },
    "data-cursor": true,
    "data-cursor-label": "TYPE",
    style: {
      flex: 1,
      minWidth: 0,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--paper)',
      fontSize: 17,
      fontFamily: 'var(--font-display)',
      padding: '14px 0'
    },
    placeholder: "Quiero aprender..."
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onEnter,
    "data-cursor": true,
    "data-cursor-label": "ENTER",
    style: {
      background: 'var(--paper)',
      color: 'var(--ink)',
      border: 'none',
      borderRadius: 16,
      padding: '12px 20px',
      fontFamily: 'inherit',
      fontSize: 14,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8
    }
  }, "Buscar ", /*#__PURE__*/React.createElement("kbd", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      padding: '2px 6px',
      background: 'var(--line)',
      borderRadius: 4
    }
  }, "\u21B5")))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.45
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--muted)',
      letterSpacing: '.1em'
    }
  }, "PROB\xC1 \u2192"), ['Python desde cero', 'Guitarra flamenca', 'Preparación para CBC', 'Inglés conversacional', 'Fotografía nocturna', 'Finanzas personales'].map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setQuery(s),
    "data-cursor": true,
    style: {
      background: 'transparent',
      border: '1px solid var(--line)',
      color: 'var(--ink-2)',
      padding: '5px 12px',
      borderRadius: 99,
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
      transition: 'all .2s'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--ink)';
      e.currentTarget.style.color = 'var(--paper)';
      e.currentTarget.style.borderColor = 'var(--ink)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = 'var(--ink-2)';
      e.currentTarget.style.borderColor = 'var(--line)';
    }
  }, s))))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.5
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      margin: isMobile ? '40px 16px 0' : '72px 28px 0',
      maxWidth: 1344,
      marginLeft: 'auto',
      marginRight: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lud-split",
    style: {
      position: 'relative',
      borderRadius: 28,
      overflow: 'hidden',
      height: isMobile ? 'auto' : 420,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      background: 'var(--ink)',
      boxShadow: '0 30px 80px -30px oklch(0.2 0.05 260 / .35)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setSide('learn'),
    onMouseLeave: () => setSide(null),
    onClick: onEnter,
    "data-cursor": true,
    "data-cursor-label": "APRENDER",
    style: {
      width: isMobile ? '100%' : `${leftPct}%`,
      minHeight: isMobile ? 300 : undefined,
      transition: isMobile ? 'none' : 'width .55s cubic-bezier(.2,.7,.2,1)',
      background: 'var(--blue)',
      position: 'relative',
      overflow: 'hidden',
      padding: '38px 40px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      opacity: .68
    }
  }, /*#__PURE__*/React.createElement(Shader, {
    palette: "dark",
    intensity: 1
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Kicker, {
    color: "#fff"
  }, "Modo alumno"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      opacity: .8
    }
  }, "01 / 02")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'clamp(48px, 7vw, 112px)',
      fontWeight: 700,
      letterSpacing: '-.05em',
      lineHeight: .9
    }
  }, "Aprender."), /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: 360,
      fontSize: 15,
      lineHeight: 1.5,
      marginTop: 14,
      opacity: .88
    }
  }, "Encontr\xE1 clases y cursos que realmente coincidan con tu objetivo. La IA entiende lo que busc\xE1s."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      marginTop: 22,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    k: "Cursos",
    v: "3.4K"
  }), /*#__PURE__*/React.createElement(Stat, {
    k: "Clases",
    v: "14.2K"
  }), /*#__PURE__*/React.createElement(Stat, {
    k: "Match promedio",
    v: "< 2 min"
  })))), /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setSide('teach'),
    onMouseLeave: () => setSide(null),
    onClick: onEnter,
    "data-cursor": true,
    "data-cursor-label": "ENSE\xD1AR",
    style: {
      flex: 1,
      background: '#160830',
      position: 'relative',
      overflow: 'hidden',
      padding: '38px 40px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      opacity: .68
    }
  }, /*#__PURE__*/React.createElement(Shader, {
    palette: "pedidos",
    intensity: 1
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Kicker, {
    color: "#fff"
  }, "Modo docente"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      opacity: .7
    }
  }, "02 / 02")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'clamp(48px, 7vw, 112px)',
      fontWeight: 700,
      letterSpacing: '-.05em',
      lineHeight: .9
    }
  }, "Ense\xF1ar."), /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: 360,
      fontSize: 15,
      lineHeight: 1.5,
      marginTop: 14
    }
  }, "Public\xE1 lo que sab\xE9s, pon\xE9 tu precio y conect\xE1 directo con alumnos. Vos manej\xE1s tu agenda."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      marginTop: 22,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    k: "Docentes",
    v: "3.2K"
  }), /*#__PURE__*/React.createElement(Stat, {
    k: "Publicaci\xF3n",
    v: "< 5 min"
  }), /*#__PURE__*/React.createElement(Stat, {
    k: "Alumnos/mes",
    v: "+8"
  })))), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      display: isMobile ? 'none' : 'block',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: `${leftPct}%`,
      transform: 'translateX(-50%)',
      width: 2,
      background: 'var(--paper)',
      transition: 'left .55s cubic-bezier(.2,.7,.2,1)',
      zIndex: 3,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      width: 46,
      height: 46,
      borderRadius: '50%',
      background: 'var(--paper)',
      color: 'var(--ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '.05em',
      boxShadow: '0 8px 20px oklch(0 0 0 / .2)'
    }
  }, "VS"))))));
}
function Stat({
  k,
  v,
  dark = false
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.12em',
      opacity: .88,
      textTransform: 'uppercase'
    }
  }, k), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: '-.03em',
      marginTop: 2,
      color: dark ? 'var(--ink)' : 'inherit'
    }
  }, v));
}
function InlineMorph() {
  const words = ['querés.', 'necesitás.', 'soñás.', 'imaginás.'];
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI(x => (x + 1) % words.length), 2200);
    return () => clearInterval(t);
  }, []);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      position: 'relative',
      verticalAlign: 'baseline',
      background: 'var(--blue)',
      color: 'var(--paper)',
      padding: '0 .24em',
      borderRadius: '.12em',
      overflow: 'hidden',
      transform: 'skewX(-4deg)',
      transition: 'background .5s'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      transform: 'skewX(4deg)',
      minWidth: '4ch'
    },
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      animation: 'lud-morph .5s cubic-bezier(.2,.7,.2,1)'
    }
  }, words[i])), /*#__PURE__*/React.createElement("style", null, `@keyframes lud-morph{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`));
}
function SparkIcon() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 2l1.8 5.2L17 9l-5.2 1.8L10 16l-1.8-5.2L3 9l5.2-1.8L10 2z",
    fill: "var(--orange)"
  }));
}
Object.assign(window, {
  Hero
});

// --- worlds.jsx ---
// WorldCard: mesh gradient + light leaks + grain + 3D tilt
function WorldCard({
  children,
  style,
  onClick,
  'data-cursor': dc,
  'data-cursor-label': dcl
}) {
  const ref = React.useRef(null);
  const onMove = e => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1200px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
    el.style.boxShadow = `${-x * 32}px ${-y * 32}px 80px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.22)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(1200px) rotateY(0) rotateX(0) scale(1)';
    el.style.boxShadow = '0 24px 64px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.18)';
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    onClick: onClick,
    "data-cursor": dc,
    "data-cursor-label": dcl,
    onPointerMove: onMove,
    onPointerLeave: onLeave,
    style: {
      ...style,
      transition: 'transform .55s cubic-bezier(.2,.7,.2,1), box-shadow .55s cubic-bezier(.2,.7,.2,1)',
      willChange: 'transform',
      cursor: 'pointer',
      boxShadow: '0 24px 64px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.18)'
    }
  }, children);
}

// Sección Dos mundos
function Worlds({
  onEnter
}) {
  const w = useWindowWidth();
  const isMobile = w <= 640;

  // Grid cell glassmorphism style
  const cell = {
    background: 'rgba(255,255,255,0.09)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
    padding: '18px 20px'
  };
  return /*#__PURE__*/React.createElement("section", {
    id: "mundos",
    style: {
      padding: isMobile ? '80px 16px 60px' : '140px 28px 120px',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1344,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 40,
      marginBottom: 60,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(Kicker, null, "02 \xB7 Productos"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'clamp(44px, 7vw, 92px)',
      fontWeight: 700,
      letterSpacing: '-.05em',
      lineHeight: .95,
      margin: '18px 0 0',
      textWrap: 'balance',
      maxWidth: 900
    }
  }, "Una app.", /*#__PURE__*/React.createElement("br", null), "Dos formas ", /*#__PURE__*/React.createElement("i", {
    style: {
      fontStyle: 'italic',
      fontWeight: 500,
      color: 'var(--blue)'
    }
  }, "de aprender."))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.5,
      color: 'var(--ink-2)',
      maxWidth: 320,
      margin: 0
    }
  }, "Cada modo tiene su identidad, su flujo y su prop\xF3sito. Eleg\xED el que se adapta a c\xF3mo quer\xE9s aprender hoy."))), /*#__PURE__*/React.createElement("div", {
    className: "lud-worlds-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1
  }, /*#__PURE__*/React.createElement(WorldCard, {
    "data-cursor": true,
    "data-cursor-label": "CURSOS",
    onClick: onEnter,
    style: {
      background: `
                radial-gradient(ellipse at 5% 95%, rgba(34,215,200,0.55) 0%, transparent 48%),
                radial-gradient(ellipse at 92% 8%,  rgba(120,110,255,0.40) 0%, transparent 42%),
                radial-gradient(ellipse at 50% 50%, rgba(30,80,255,0.18) 0%, transparent 65%),
                #0D35CC
              `,
      color: '#fff',
      borderRadius: 28,
      padding: isMobile ? '24px' : '44px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: isMobile ? 'auto' : 560,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Grain, {
    opacity: 0.04
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      width: 260,
      height: 260,
      borderRadius: '50%',
      background: '#22D8C8',
      filter: 'blur(72px)',
      opacity: 0.38,
      bottom: -80,
      left: -60,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: '50%',
      background: '#8878FF',
      filter: 'blur(60px)',
      opacity: 0.30,
      top: -50,
      right: -40,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Kicker, {
    color: "rgba(255,255,255,0.75)",
    dot: false
  }, "\u25C8 Cursos estructurados"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'rgba(255,255,255,0.35)'
    }
  }, "01")), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: isMobile ? 52 : 76,
      fontWeight: 800,
      letterSpacing: '-.055em',
      lineHeight: .9,
      margin: '28px 0 0',
      textShadow: '0 2px 24px rgba(0,0,0,0.18)'
    }
  }, "Cursos", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#7EFAEA',
      fontStyle: 'italic',
      fontWeight: 700
    }
  }, "completos.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.6,
      color: 'rgba(255,255,255,0.82)',
      margin: '22px 0 0',
      maxWidth: 400
    }
  }, "Experiencias de aprendizaje de punta a punta. Contenido, evaluaciones, seguimiento, certificados.")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 2,
      marginTop: 44
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lud-worlds-feat-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1px',
      background: 'rgba(255,255,255,0.10)',
      border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 16,
      overflow: 'hidden'
    }
  }, [['Clases organizadas', 'Módulos + lecciones'], ['Evaluaciones', 'Automáticas + revisadas'], ['Certificados', 'Verificables on-chain'], ['Foro grupal', 'Chat + archivos']].map(([a, b], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: cell
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.10em',
      color: 'rgba(255,255,255,0.55)',
      textTransform: 'uppercase',
      marginBottom: 5
    }
  }, a), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'rgba(255,255,255,0.92)'
    }
  }, b)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(MagBtn, {
    variant: "paper",
    onClick: onEnter
  }, "Explorar cursos"))))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.2
  }, /*#__PURE__*/React.createElement(WorldCard, {
    "data-cursor": true,
    "data-cursor-label": "CLASES",
    onClick: onEnter,
    style: {
      background: `
                radial-gradient(ellipse at 5% 95%, rgba(255,210,40,0.60) 0%, transparent 48%),
                radial-gradient(ellipse at 92% 8%,  rgba(255,80,0,0.50) 0%, transparent 42%),
                radial-gradient(ellipse at 50% 50%, rgba(200,50,0,0.20) 0%, transparent 65%),
                #B83200
              `,
      color: '#fff',
      borderRadius: 28,
      padding: isMobile ? '24px' : '44px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: isMobile ? 'auto' : 560,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Grain, {
    opacity: 0.04
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: '50%',
      background: '#FFD028',
      filter: 'blur(80px)',
      opacity: 0.40,
      bottom: -90,
      left: -70,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: '50%',
      background: '#FF5000',
      filter: 'blur(65px)',
      opacity: 0.35,
      top: -50,
      right: -40,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Kicker, {
    color: "rgba(255,255,255,0.75)",
    dot: false
  }, "\u25C8 1:1 a tu medida"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'rgba(255,255,255,0.35)'
    }
  }, "02")), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: isMobile ? 52 : 76,
      fontWeight: 800,
      letterSpacing: '-.055em',
      lineHeight: .9,
      margin: '28px 0 0',
      textShadow: '0 2px 24px rgba(0,0,0,0.18)'
    }
  }, "Clases", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#FFD84A',
      fontStyle: 'italic',
      fontWeight: 700
    }
  }, "particulares.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.6,
      color: 'rgba(255,255,255,0.84)',
      margin: '22px 0 0',
      maxWidth: 400
    }
  }, "Conexi\xF3n directa con un docente. Tu horario, tu ritmo, tu objetivo. Sin intermediarios.")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 2,
      marginTop: 44
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lud-worlds-feat-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1px',
      background: 'rgba(255,255,255,0.10)',
      border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 16,
      overflow: 'hidden'
    }
  }, [['Horarios', 'A tu medida'], ['Chat directo', 'Sin intermediarios'], ['Precio', 'Acordado 1:1'], ['Duración', 'Vos elegís']].map(([a, b], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: cell
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.10em',
      color: 'rgba(255,255,255,0.55)',
      textTransform: 'uppercase',
      marginBottom: 5
    }
  }, a), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'rgba(255,255,255,0.92)'
    }
  }, b)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(MagBtn, {
    variant: "paper",
    onClick: onEnter
  }, "Encontrar docente"))))))), /*#__PURE__*/React.createElement("style", null, `
        @media (max-width: 860px){ .lud-worlds-grid{ grid-template-columns: 1fr !important; } }
        @media (max-width: 640px){ .lud-worlds-feat-grid{ grid-template-columns: 1fr !important; } }
      `));
}
window.Worlds = Worlds;

// --- features.jsx ---
// Features bento grid
function Features() {
  const w = useWindowWidth();
  const isMobile = w <= 640;
  const isTablet = w <= 1024 && w > 640;
  return /*#__PURE__*/React.createElement("section", {
    id: "features",
    style: {
      padding: '120px 28px',
      background: 'var(--paper-2)',
      borderTop: '1px solid var(--line)',
      borderBottom: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1344,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 40,
      marginBottom: 60,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(Kicker, null, "03 \xB7 Funciones"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'clamp(44px, 7vw, 92px)',
      fontWeight: 700,
      letterSpacing: '-.05em',
      lineHeight: .95,
      margin: '18px 0 0',
      maxWidth: 900
    }
  }, "Tecnolog\xEDa que ", /*#__PURE__*/React.createElement("i", {
    style: {
      fontStyle: 'italic',
      fontWeight: 500,
      color: 'var(--blue)'
    }
  }, "desaparece."))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.5,
      color: 'var(--ink-2)',
      maxWidth: 340,
      margin: 0
    }
  }, "IA sem\xE1ntica, evaluaciones automatizadas, seguimiento en tiempo real. Todo integrado. Nada molesta."))), /*#__PURE__*/React.createElement("div", {
    className: "lud-bento",
    style: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
      gridAutoRows: isMobile ? 'auto' : '180px',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    style: {
      gridColumn: isMobile ? 'span 1' : isTablet ? 'span 3' : 'span 4',
      gridRow: isMobile ? 'span 1' : 'span 2'
    },
    className: "lud-bento-item"
  }, /*#__PURE__*/React.createElement(BentoCard, {
    dark: true
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(140deg, #0D2A6E 0%, #1A52D8 55%, #1A7FCC 100%)',
      borderRadius: 20,
      zIndex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kicker, {
    color: "rgba(255,255,255,0.65)"
  }, "IA Sem\xE1ntica"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 44,
      fontWeight: 700,
      letterSpacing: '-.04em',
      lineHeight: 1,
      margin: '20px 0 0',
      maxWidth: 460,
      color: '#fff'
    }
  }, "Describ\xED con tus palabras.", /*#__PURE__*/React.createElement("br", null), "La IA encuentra el match.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, ['"preparación para el final de álgebra"', '"guitarra para zurdo"', '"inglés para entrevistas tech"'].map(q => /*#__PURE__*/React.createElement("span", {
    key: q,
    style: {
      background: 'rgba(255,255,255,0.12)',
      color: 'rgba(255,255,255,0.9)',
      padding: '8px 14px',
      borderRadius: 99,
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      border: '1px solid rgba(255,255,255,0.15)'
    }
  }, q)))))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.08,
    style: {
      gridColumn: isMobile ? 'span 1' : isTablet ? 'span 3' : 'span 2',
      gridRow: isMobile ? 'span 1' : 'span 2'
    }
  }, /*#__PURE__*/React.createElement(BentoCard, {
    dark: true
  }, /*#__PURE__*/React.createElement(Kicker, {
    color: "var(--paper)"
  }, "Privacidad primero"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'clamp(48px,5vw,72px)',
      fontWeight: 700,
      letterSpacing: '-.05em',
      lineHeight: .95,
      marginTop: 20,
      color: 'var(--paper)'
    }
  }, "0 datos", /*#__PURE__*/React.createElement("br", null), "expuestos."), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'oklch(1 0 0 / .65)',
      fontSize: 13,
      lineHeight: 1.5,
      marginTop: 14
    }
  }, "Emails y contactos nunca se muestran. Chat interno end-to-end."))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1,
    style: {
      gridColumn: isMobile ? 'span 1' : isTablet ? 'span 1' : 'span 2'
    }
  }, /*#__PURE__*/React.createElement(BentoCard, null, /*#__PURE__*/React.createElement(Kicker, null, "Certificados"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 10,
      background: 'var(--ink)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      fontWeight: 600
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: '-.02em'
    }
  }, "Verificables"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--muted)',
      fontFamily: 'var(--font-mono)'
    }
  }, "SHA \xB7 timestamp \xB7 firma"))))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.12,
    style: {
      gridColumn: isMobile ? 'span 1' : isTablet ? 'span 1' : 'span 2'
    }
  }, /*#__PURE__*/React.createElement(BentoCard, {
    accent: "#EEF4FF"
  }, /*#__PURE__*/React.createElement(Kicker, null, "Chat integrado"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Bubble, {
    side: "in"
  }, "\xBFSeguro ten\xE9s lugar martes 18hs?"), /*#__PURE__*/React.createElement(Bubble, {
    side: "out",
    accent: true
  }, "S\xED, te mando el link ahora")))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.15,
    style: {
      gridColumn: isMobile ? 'span 1' : isTablet ? 'span 1' : 'span 2'
    }
  }, /*#__PURE__*/React.createElement(BentoCard, null, /*#__PURE__*/React.createElement(Kicker, null, "Seguimiento"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      fontWeight: 700,
      letterSpacing: '-.03em'
    }
  }, "82%"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      background: 'var(--line)',
      borderRadius: 99,
      marginTop: 8,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '82%',
      height: '100%',
      background: 'var(--blue)',
      borderRadius: 99
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--muted)',
      marginTop: 8,
      fontFamily: 'var(--font-mono)'
    }
  }, "\xC1lgebra \xB7 Unidad 3 de 4")))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.18,
    style: {
      gridColumn: isMobile ? 'span 1' : isTablet ? 'span 1' : 'span 2'
    }
  }, /*#__PURE__*/React.createElement(BentoCard, null, /*#__PURE__*/React.createElement(Kicker, null, "Pagos"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'clamp(32px,3vw,44px)',
      fontWeight: 700,
      letterSpacing: '-.04em',
      lineHeight: 1
    }
  }, "Seguros ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--muted)',
      fontWeight: 500
    }
  }, "y simples")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--muted)',
      marginTop: 6,
      fontFamily: 'var(--font-mono)'
    }
  }, "Mercado Pago \xB7 transferencia \xB7 tarjeta")))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.22,
    style: {
      gridColumn: isMobile ? 'span 1' : isTablet ? 'span 3' : 'span 4'
    }
  }, /*#__PURE__*/React.createElement(BentoCard, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kicker, null, "Agenda en vivo"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: '-.03em',
      marginTop: 14
    }
  }, "Reserv\xE1 en el slot que quer\xE9s")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--muted)'
    }
  }, "AHORA")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 18,
      flexWrap: 'wrap'
    }
  }, ['Lun 09:00', 'Lun 14:00', 'Mar 10:00', 'Mar 16:00', 'Mie 11:00', 'Mie 17:00', 'Jue 09:00'].map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: s,
    style: {
      background: i === 2 ? 'var(--ink)' : 'transparent',
      color: i === 2 ? 'var(--paper)' : 'var(--ink)',
      border: '1px solid var(--ink)',
      borderRadius: 8,
      padding: '6px 10px',
      fontFamily: 'var(--font-mono)',
      fontSize: 11
    }
  }, s))))))), /*#__PURE__*/React.createElement("style", null, `
        @media (max-width: 1024px){ .lud-bento{ grid-template-columns: repeat(4, 1fr) !important; } }
        @media (max-width: 640px){ .lud-bento{ grid-template-columns: repeat(2, 1fr) !important; grid-auto-rows: 160px !important; } .lud-bento > *{ grid-column: span 2 !important; grid-row: auto !important; } }
      `));
}
function BentoCard({
  children,
  dark = false,
  accent = null
}) {
  const ref = React.useRef(null);
  const onMove = e => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.025)`;
    el.style.boxShadow = `${-x * 16}px ${-y * 16}px 40px oklch(0 0 0 / .13)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(700px) rotateY(0deg) rotateX(0deg) scale(1)';
    el.style.boxShadow = 'none';
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    onPointerMove: onMove,
    onPointerLeave: onLeave,
    style: {
      width: '100%',
      height: '100%',
      background: accent || (dark ? 'var(--ink)' : 'var(--paper)'),
      color: dark ? 'var(--paper)' : 'var(--ink)',
      border: dark ? '1px solid var(--ink)' : '1px solid var(--line)',
      borderRadius: 20,
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform .45s cubic-bezier(.2,.7,.2,1), box-shadow .45s cubic-bezier(.2,.7,.2,1)',
      willChange: 'transform'
    }
  }, children);
}
function Bubble({
  children,
  side,
  accent = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: side === 'out' ? 'flex-end' : 'flex-start',
      background: accent ? 'var(--ink)' : 'var(--paper)',
      color: accent ? 'var(--paper)' : 'var(--ink)',
      padding: '8px 12px',
      borderRadius: 14,
      fontSize: 12,
      fontWeight: 500,
      border: '1px solid var(--ink)',
      maxWidth: '85%'
    }
  }, children);
}
window.Features = Features;

// --- how.jsx ---
// Lucide icons inline
function IcoUser() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "7",
    r: "4"
  }));
}
function IcoSearch() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.35-4.35"
  }));
}
function IcoMsg() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
  }));
}
function IcoGrad() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M22 10v6M2 10l10-5 10 5-10 5z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 12v5c3 3 9 3 12 0v-5"
  }));
}

// Cómo funciona — 4 step cards con timeline line + Reveal staggered
function How() {
  const w = useWindowWidth();
  const isMobile = w <= 640;
  const steps = [{
    n: '01',
    title: 'Creá tu cuenta',
    desc: 'Menos de un minuto. Solo email. Sin tarjeta, sin datos de más.',
    detail: ['Email', 'Verificación', 'Listo'],
    Icon: IcoUser
  }, {
    n: '02',
    title: 'Decí qué querés',
    desc: 'Buscá con IA en lenguaje natural. El match es semántico, no por palabras exactas.',
    detail: ['Prompt', 'Match', 'Resultados'],
    Icon: IcoSearch
  }, {
    n: '03',
    title: 'Conectá directo',
    desc: 'Chateá con el docente sin intermediarios. Sin exponer datos personales. Acordá precio y horario.',
    detail: ['Mensajes', 'Agenda', 'Acuerdo'],
    Icon: IcoMsg
  }, {
    n: '04',
    title: 'Aprendé o enseñá',
    desc: 'Seguí el progreso, rendí evaluaciones y descargá certificados verificables.',
    detail: ['Progreso', 'Tests', 'Certificado'],
    Icon: IcoGrad
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "como",
    style: {
      position: 'relative',
      background: 'linear-gradient(160deg, #070F2A 0%, #0C2055 45%, #0E2E70 72%, #0B3858 100%)',
      color: 'var(--paper)',
      padding: isMobile ? '80px 16px' : '120px 28px',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      width: 500,
      height: 500,
      borderRadius: '50%',
      background: 'oklch(0.55 0.22 230 / .08)',
      right: -150,
      top: -150,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      width: 350,
      height: 350,
      borderRadius: '50%',
      background: 'oklch(0.60 0.20 215 / .07)',
      left: -100,
      bottom: -100,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 2,
      maxWidth: 1344,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(Kicker, {
    color: "var(--paper)"
  }, "04 \xB7 Flujo"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'clamp(44px, 6.5vw, 84px)',
      fontWeight: 700,
      letterSpacing: '-.05em',
      lineHeight: .95,
      margin: '18px 0 0',
      maxWidth: 720
    }
  }, "En 4 pasos", /*#__PURE__*/React.createElement("br", null), "est\xE1s ", /*#__PURE__*/React.createElement("i", {
    style: {
      fontStyle: 'italic',
      fontWeight: 500,
      color: 'var(--orange)'
    }
  }, "adentro."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
      gap: isMobile ? 12 : 0,
      marginTop: 60,
      position: 'relative'
    }
  }, !isMobile && /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      top: 44,
      left: '12.5%',
      right: '12.5%',
      height: 1,
      background: 'linear-gradient(90deg, transparent, oklch(1 0 0 / .2) 15%, oklch(1 0 0 / .2) 85%, transparent)',
      zIndex: 0
    }
  }), steps.map((s, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: s.n,
    delay: i * 0.12,
    style: {
      position: 'relative',
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: isMobile ? '20px' : '0 24px',
      display: 'flex',
      flexDirection: isMobile ? 'row' : 'column',
      alignItems: isMobile ? 'flex-start' : 'center',
      gap: isMobile ? 16 : 0,
      textAlign: isMobile ? 'left' : 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 88,
      height: 88,
      borderRadius: '50%',
      flexShrink: 0,
      background: 'oklch(1 0 0 / .08)',
      border: '1.5px solid oklch(1 0 0 / .18)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      backdropFilter: 'blur(8px)',
      ...(isMobile ? {} : {
        margin: '0 auto 28px'
      })
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--orange)',
      letterSpacing: '.1em',
      fontWeight: 600
    }
  }, s.n), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'white',
      opacity: .85,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(s.Icon, null))), /*#__PURE__*/React.createElement("div", {
    style: isMobile ? {
      flex: 1
    } : {}
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: isMobile ? 20 : 19,
      fontWeight: 700,
      letterSpacing: '-.02em',
      marginBottom: 10
    }
  }, s.title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: 1.6,
      color: 'oklch(1 0 0 / .68)',
      margin: '0 0 16px'
    }
  }, s.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: isMobile ? 'flex-start' : 'center'
    }
  }, s.detail.map((d, j) => /*#__PURE__*/React.createElement("span", {
    key: d,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.08em',
      color: 'oklch(1 0 0 / .5)'
    }
  }, j > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'oklch(1 0 0 / .25)'
    }
  }, "\u2192"), d))))), isMobile && i < steps.length - 1 && /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      width: 1,
      height: 24,
      background: 'oklch(1 0 0 / .15)',
      margin: '4px 44px'
    }
  }))))));
}
window.How = How;

// --- preview.jsx ---
// Preview mockup de la app (mobile + desktop flotando)
function Preview({
  onEnter
}) {
  const w = useWindowWidth();
  const isMobile = w <= 900;
  const [tab, setTab] = React.useState('alumno');
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '140px 28px 120px',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1344,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 40,
      flexWrap: 'wrap',
      marginBottom: 56
    }
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(Kicker, null, "05 \xB7 Producto"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'clamp(44px, 7vw, 92px)',
      fontWeight: 700,
      letterSpacing: '-.05em',
      lineHeight: .95,
      margin: '18px 0 0',
      maxWidth: 860
    }
  }, "As\xED se ve ", /*#__PURE__*/React.createElement("i", {
    style: {
      fontStyle: 'italic',
      fontWeight: 500,
      color: 'var(--blue)'
    }
  }, "por dentro."))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      background: 'var(--paper-2)',
      border: '1px solid var(--line)',
      borderRadius: 99,
      padding: 4
    }
  }, ['alumno', 'docente'].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setTab(t),
    "data-cursor": true,
    style: {
      background: tab === t ? 'var(--ink)' : 'transparent',
      color: tab === t ? 'var(--paper)' : 'var(--ink)',
      border: 'none',
      padding: '10px 22px',
      borderRadius: 99,
      fontSize: 13,
      fontWeight: 600,
      fontFamily: 'inherit',
      textTransform: 'capitalize',
      transition: 'all .3s'
    }
  }, "Vista ", t))))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.15
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      borderRadius: 28,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0A1840 0%, #1040A8 52%, #1870B8 100%)',
      padding: isMobile ? '40px 24px 0' : '60px 60px 0',
      minHeight: isMobile ? 420 : 560,
      border: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      width: 600,
      height: 600,
      borderRadius: '50%',
      background: 'oklch(0.7 0.2 225 / .08)',
      right: -150,
      top: -150,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: 40
    }
  }, !isMobile && /*#__PURE__*/React.createElement(DesktopMock, {
    tab: tab
  }), /*#__PURE__*/React.createElement(PhoneMock, {
    tab: tab
  }))))), /*#__PURE__*/React.createElement("style", null, `
        @media (max-width: 900px){ .lud-prev-grid{ grid-template-columns: 1fr !important; } }
      `));
}
function DesktopMock({
  tab
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper)',
      borderRadius: '16px 16px 0 0',
      boxShadow: '0 30px 80px -20px oklch(0 0 0 / .25)',
      overflow: 'hidden',
      border: '1px solid var(--line)',
      borderBottom: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px',
      background: 'var(--paper-2)',
      borderBottom: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: 'oklch(0.75 0.15 25)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: 'oklch(0.85 0.15 85)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: 'oklch(0.75 0.15 150)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--muted)'
    }
  }, "luderis.com/", tab === 'alumno' ? 'explorar' : 'panel')), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px',
      display: 'grid',
      gridTemplateColumns: '140px 1fr',
      gap: 14,
      minHeight: 280
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, ['Inicio', 'Buscar', 'Mis cursos', 'Mensajes', 'Perfil'].map((x, i) => /*#__PURE__*/React.createElement("div", {
    key: x,
    style: {
      padding: '8px 10px',
      borderRadius: 8,
      fontSize: 12,
      fontWeight: i === 1 ? 600 : 500,
      color: i === 1 ? 'var(--paper)' : 'var(--ink-2)',
      background: i === 1 ? 'var(--ink)' : 'transparent'
    }
  }, x))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper-2)',
      border: '1px solid var(--line)',
      borderRadius: 10,
      padding: '8px 12px',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--ink-2)',
      marginBottom: 12
    }
  }, "\u2728 ", tab === 'alumno' ? '"fotografía nocturna con celular"' : 'Crear nueva publicación'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 10
    }
  }, [0, 1, 2, 3, 4, 5].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: 'var(--paper-2)',
      border: '1px solid var(--line)',
      borderRadius: 10,
      padding: '10px',
      aspectRatio: '1/1.1'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '55%',
      borderRadius: 6,
      background: i % 2 ? 'var(--blue)' : 'var(--orange)',
      opacity: .15
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      marginTop: 8
    }
  }, ['Python', 'Guitarra', 'Inglés', 'Álgebra', 'Foto', 'Yoga'][i]), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      color: 'var(--muted)',
      marginTop: 2
    }
  }, "\u2605 4.9 \xB7 120 alumnos")))))));
}
function PhoneMock({
  tab
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 240,
      background: 'var(--ink)',
      borderRadius: '40px',
      padding: 8,
      boxShadow: '0 30px 70px -10px oklch(0 0 0 / .35)',
      justifySelf: 'center',
      marginBottom: -60
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper)',
      borderRadius: '32px',
      overflow: 'hidden',
      aspectRatio: '9/19',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 8,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 60,
      height: 14,
      background: 'var(--ink)',
      borderRadius: 99,
      zIndex: 3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '30px 14px 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: '-.03em'
    }
  }, "Hola, ", tab === 'alumno' ? 'Sofi' : 'Prof.'), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 26,
      height: 26,
      borderRadius: '50%',
      background: 'var(--blue)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--ink)',
      color: 'var(--paper)',
      borderRadius: 12,
      padding: '10px 12px',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      marginBottom: 14
    }
  }, "\u2728 Buscar con IA"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      color: 'var(--muted)',
      marginBottom: 8,
      letterSpacing: '.1em'
    }
  }, tab === 'alumno' ? 'PRÓXIMAS CLASES' : 'ALUMNOS ACTIVOS'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, [1, 2, 3].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      border: '1px solid var(--line)',
      borderRadius: 10,
      padding: '10px',
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: i % 2 ? 'var(--blue)' : 'var(--orange)'
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600
    }
  }, tab === 'alumno' ? ['Python 101', 'Guitarra', 'Álgebra'][i - 1] : ['M. López', 'J. Ruiz', 'A. Díaz'][i - 1]), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: 'var(--muted)',
      fontFamily: 'var(--font-mono)'
    }
  }, tab === 'alumno' ? ['Mar 18:00', 'Mie 10:00', 'Jue 16:00'][i - 1] : ['Activo', 'Activo', 'Pausa'][i - 1]))))))));
}
window.Preview = Preview;

// --- stats.jsx ---
// Propuestas de valor — cualitativas, honestas
function Stats() {
  const items = [{
    icon: () => /*#__PURE__*/React.createElement("svg", {
      width: "22",
      height: "22",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M13 2L3 14h9l-1 8 10-12h-9l1-8z"
    })),
    k: 'Match en minutos',
    v: 'IA semántica que entiende lo que buscás. No palabras clave — contexto real.',
    accent: '#3D8EF0'
  }, {
    icon: () => /*#__PURE__*/React.createElement("svg", {
      width: "22",
      height: "22",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "9",
      cy: "7",
      r: "4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
    })),
    k: 'Sin intermediarios',
    v: 'Docente y alumno se conectan directo. El precio lo acordás vos.',
    accent: '#2EC4A0'
  }, {
    icon: () => /*#__PURE__*/React.createElement("svg", {
      width: "22",
      height: "22",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "11",
      width: "18",
      height: "11",
      rx: "2",
      ry: "2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M7 11V7a5 5 0 0 1 10 0v4"
    })),
    k: 'Privacidad primero',
    v: 'Tu email nunca se muestra. Chat interno. Tus datos son tuyos, siempre.',
    accent: '#E8891C'
  }, {
    icon: () => /*#__PURE__*/React.createElement("svg", {
      width: "22",
      height: "22",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "1",
      y: "4",
      width: "22",
      height: "16",
      rx: "2",
      ry: "2"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "1",
      y1: "10",
      x2: "23",
      y2: "10"
    })),
    k: 'Pagos seguros',
    v: 'Integrado con MercadoPago. Sin cuentas extra ni comisiones ocultas.',
    accent: '#9B7BF4'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '80px 28px',
      background: 'var(--ink)',
      color: 'var(--paper)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1344,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 1,
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 20,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)'
    },
    className: "lud-stats-grid"
  }, items.map((it, i) => {
    const Icon = it.icon;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        padding: '36px 32px',
        background: 'var(--ink)',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `${it.accent}18`,
        border: `1px solid ${it.accent}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: it.accent,
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement(Icon, null)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: '-.02em',
        marginBottom: 10,
        color: 'var(--paper)'
      }
    }, it.k), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        lineHeight: 1.6,
        color: 'oklch(1 0 0 / .55)',
        margin: 0
      }
    }, it.v), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: it.accent,
        opacity: .7
      }
    }));
  })))), /*#__PURE__*/React.createElement("style", null, `
        @media (max-width: 900px){ .lud-stats-grid{ grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 520px){ .lud-stats-grid{ grid-template-columns: 1fr !important; } }
      `));
}
window.Stats = Stats;

// --- about.jsx ---
// Sobre nosotros
function About() {
  return /*#__PURE__*/React.createElement("section", {
    id: "nosotros",
    style: {
      padding: '140px 28px 120px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1344,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 80,
      alignItems: 'flex-start'
    },
    className: "lud-about-grid"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(Kicker, null, "06 \xB7 Nosotros"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'clamp(44px, 7vw, 92px)',
      fontWeight: 700,
      letterSpacing: '-.05em',
      lineHeight: .95,
      margin: '18px 0 32px',
      textWrap: 'balance'
    }
  }, "Creemos que el conocimiento no deber\xEDa tener ", /*#__PURE__*/React.createElement("i", {
    style: {
      fontStyle: 'italic',
      fontWeight: 500,
      color: 'var(--orange-deep)'
    }
  }, "barreras.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      lineHeight: 1.6,
      color: 'var(--ink-2)',
      margin: '0 0 20px',
      maxWidth: 520,
      textWrap: 'pretty'
    }
  }, "Luderis naci\xF3 de una idea simple: que cualquier persona pueda ense\xF1ar lo que sabe o aprender lo que necesita. De forma directa, clara, sin filtros innecesarios."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.65,
      color: 'var(--muted)',
      margin: '0 0 32px',
      maxWidth: 520
    }
  }, "La mejor educaci\xF3n ocurre cuando hay una conexi\xF3n real entre personas. Nuestro foco es facilitar ese encuentro \u2014 con tecnolog\xEDa que hace la experiencia mejor para ambos lados."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, ['🇦🇷 Marca Argentina', '▲ Equipo de 12', '◆ Founded 2026'].map(l => /*#__PURE__*/React.createElement("span", {
    key: l,
    style: {
      padding: '8px 14px',
      borderRadius: 99,
      border: '1px solid var(--line)',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--ink-2)'
    }
  }, l)))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.15
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, [{
    k: 'Misión',
    v: 'Democratizar el acceso al conocimiento conectando personas que quieren aprender con quienes quieren enseñar.',
    dark: true,
    accent: '#1A6ED8'
  }, {
    k: 'Visión',
    v: 'Ser la plataforma de referencia en Argentina para el intercambio de conocimiento entre personas.',
    dark: false,
    accent: '#1E8E73'
  }, {
    k: 'Tecnología',
    v: 'IA semántica, evaluaciones automatizadas, seguimiento en tiempo real. Construido sobre infra moderna.',
    dark: true,
    accent: '#7B5CF0'
  }, {
    k: 'Confianza',
    v: 'Privacidad y seguridad en cada interacción. Tus datos son tuyos, siempre.',
    dark: false,
    accent: '#E8891C'
  }].map((v, i) => /*#__PURE__*/React.createElement("div", {
    key: v.k,
    style: {
      background: v.dark ? '#0D1F3C' : 'var(--paper)',
      color: v.dark ? '#fff' : 'var(--ink)',
      border: v.dark ? '1px solid transparent' : '1px solid var(--line)',
      borderTop: `3px solid ${v.accent}`,
      borderRadius: 18,
      padding: '24px',
      minHeight: 200,
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: v.accent
    }
  }, "0", i + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '-.03em',
      margin: '8px 0 10px'
    }
  }, v.k), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      lineHeight: 1.5,
      opacity: .85,
      margin: 0
    }
  }, v.v))))))), /*#__PURE__*/React.createElement("style", null, `
        @media (max-width: 900px){ .lud-about-grid{ grid-template-columns: 1fr !important; gap: 40px !important; } }
      `));
}
window.About = About;

// --- testimonials.jsx ---
// Sección para docentes — lado oferta del marketplace
function Testimonials({
  onEnter
}) {
  const benefits = [{
    n: '01',
    k: 'Tu precio, tus reglas',
    v: 'Vos fijás cuánto cobrás por clase o por curso. Sin negociar con nadie.'
  }, {
    n: '02',
    k: 'Publicás en minutos',
    v: 'Cargá tu perfil, describí lo que enseñás y empezás a recibir consultas.'
  }, {
    n: '03',
    k: 'Alumnos que ya buscan',
    v: 'La IA conecta tu oferta con alumnos que buscan exactamente lo que sabés.'
  }, {
    n: '04',
    k: 'Pagos directos',
    v: 'MercadoPago integrado. Sin demoras, sin intermediarios en la plata.'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '140px 28px',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(160deg, #07102A 0%, #0D2055 50%, #071428 100%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      width: 900,
      height: 900,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(26,110,216,0.14) 0%, transparent 65%)',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%,-50%)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      position: 'relative',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 80,
      alignItems: 'center'
    },
    className: "lud-doc-grid"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(Kicker, {
    color: "rgba(255,255,255,0.45)"
  }, "07 \xB7 Para docentes"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'clamp(48px, 7vw, 100px)',
      fontWeight: 700,
      letterSpacing: '-.055em',
      lineHeight: .9,
      margin: '20px 0 0',
      color: '#fff',
      textWrap: 'balance'
    }
  }, "Ense\xF1\xE1s algo que am\xE1s.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("i", {
    style: {
      fontStyle: 'italic',
      fontWeight: 500,
      color: '#7EFAEA'
    }
  }, "Empez\xE1 a cobrar hoy.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      lineHeight: 1.55,
      color: 'rgba(255,255,255,0.6)',
      margin: '28px 0 40px',
      maxWidth: 440
    }
  }, "Public\xE1 tus clases o cursos en minutos. Conect\xE1 directo con alumnos que ya est\xE1n buscando lo que sab\xE9s ense\xF1ar."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(MagBtn, {
    onClick: onEnter,
    variant: "paper"
  }, "Crear perfil docente"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'rgba(255,255,255,0.35)'
    }
  }, "Es gratis, siempre."))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.15
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, benefits.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.n,
    style: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.14em',
      color: 'rgba(126,250,234,0.7)',
      marginBottom: 10
    }
  }, b.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: '#fff',
      letterSpacing: '-.02em',
      marginBottom: 8
    }
  }, b.k), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      lineHeight: 1.55,
      color: 'rgba(255,255,255,0.45)',
      margin: 0
    }
  }, b.v))))))), /*#__PURE__*/React.createElement("style", null, `@media(max-width:900px){.lud-doc-grid{grid-template-columns:1fr!important;gap:48px!important;}}`));
}
window.Testimonials = Testimonials;

// --- cta.jsx ---
// Checkmark SVG para CTA
function CheckBadge() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none",
    style: {
      display: 'inline-block',
      verticalAlign: 'middle',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "8",
    r: "7.5",
    stroke: "var(--ink)",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 8.5l2 2 4-4",
    stroke: "var(--ink)",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }));
}

// CTA final gigante
function CTA({
  onEnter
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '120px 28px',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #F5F0FF 0%, #EAF2FF 40%, #EBF9F5 100%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%,-50%)',
      width: 700,
      height: 700,
      borderRadius: '50%',
      pointerEvents: 'none',
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      background: 'conic-gradient(from 0deg, var(--blue), var(--orange), var(--blue))',
      opacity: .22,
      animation: 'lud-ring-spin 12s linear infinite',
      mask: 'radial-gradient(circle, transparent 46%, black 47%, black 50%, transparent 51%)',
      WebkitMask: 'radial-gradient(circle, transparent 46%, black 47%, black 50%, transparent 51%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 24,
      borderRadius: '50%',
      background: 'conic-gradient(from 180deg, var(--orange), var(--blue), var(--orange))',
      opacity: .15,
      animation: 'lud-ring-spin 18s linear infinite reverse',
      mask: 'radial-gradient(circle, transparent 46%, black 47%, black 50%, transparent 51%)',
      WebkitMask: 'radial-gradient(circle, transparent 46%, black 47%, black 50%, transparent 51%)'
    }
  })), /*#__PURE__*/React.createElement("style", null, `@keyframes lud-ring-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      position: 'relative',
      zIndex: 2,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(Kicker, null, "08 \xB7 Empez\xE1")), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'clamp(64px, 13vw, 220px)',
      fontWeight: 700,
      letterSpacing: '-.06em',
      lineHeight: .88,
      margin: '20px auto 0',
      maxWidth: 1100,
      textWrap: 'balance'
    }
  }, "Empez\xE1 ", /*#__PURE__*/React.createElement("i", {
    style: {
      fontStyle: 'italic',
      fontWeight: 500,
      color: 'var(--blue)'
    }
  }, "hoy."), /*#__PURE__*/React.createElement("br", null), "Es ", /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--ink)',
      color: 'var(--paper)',
      padding: '0 .15em',
      borderRadius: '.1em',
      transform: 'skewX(-4deg)',
      display: 'inline-block'
    }
  }, "gratis."))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.2
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 19,
      color: 'var(--ink-2)',
      margin: '32px auto 0',
      maxWidth: 520,
      lineHeight: 1.5
    }
  }, "Registrate en segundos. Sin tarjeta de cr\xE9dito. Sin compromisos. Probalo ya mismo.")), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.3
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'center',
      marginTop: 40,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(MagBtn, {
    variant: "ink",
    onClick: onEnter
  }, "Crear cuenta gratis"), /*#__PURE__*/React.createElement(MagBtn, {
    variant: "line",
    onClick: () => document.getElementById('features')?.scrollIntoView({
      behavior: 'smooth'
    }),
    icon: "arrow"
  }, "Ver funciones"))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.4
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      gap: 20,
      marginTop: 36,
      flexWrap: 'wrap',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--ink)'
    }
  }, ['Match instantáneo', 'Docentes verificados', 'Búsqueda con IA', 'Privacidad primero'].map(x => /*#__PURE__*/React.createElement("span", {
    key: x,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(CheckBadge, null), x))))));
}
window.CTA = CTA;

// --- contact.jsx ---
function IcoCheckCircle() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "56",
    height: "56",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#2EC4A0",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 12.5l3 3 5-6"
  }));
}

// Contacto
function Contact() {
  const [form, setForm] = React.useState({
    nombre: '',
    email: '',
    msg: ''
  });
  const [touched, setTouched] = React.useState({});
  const [ok, setOk] = React.useState(false);
  const isValid = f => f.trim().length > 0;
  const borderColor = k => {
    if (!touched[k]) return 'var(--line)';
    return isValid(form[k]) ? '#2EC4A0' : '#D85AA3';
  };
  return /*#__PURE__*/React.createElement("section", {
    id: "contacto",
    style: {
      padding: '120px 28px',
      background: 'var(--paper-2)',
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1344,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 80,
      alignItems: 'flex-start'
    },
    className: "lud-contact-grid"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(Kicker, null, "09 \xB7 Contacto"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'clamp(44px, 6vw, 84px)',
      fontWeight: 700,
      letterSpacing: '-.05em',
      lineHeight: .95,
      margin: '18px 0 24px',
      textWrap: 'balance'
    }
  }, "\xBFPreguntas?", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("i", {
    style: {
      fontStyle: 'italic',
      fontWeight: 500,
      color: 'var(--blue)'
    }
  }, "Escribinos.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.55,
      color: 'var(--ink-2)',
      margin: '0 0 32px',
      maxWidth: 440
    }
  }, "Respondemos en menos de 24 horas. Tambi\xE9n pod\xE9s escribirnos directo por mail."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, [{
    k: 'EMAIL',
    v: 'contacto@luderis.com'
  }, {
    k: 'UBICACIÓN',
    v: 'Buenos Aires, Argentina'
  }, {
    k: 'HORARIO',
    v: 'Lun–Vie 9:00–18:00 ART'
  }, {
    k: 'RESPUESTA',
    v: '< 24 horas'
  }].map(c => /*#__PURE__*/React.createElement("div", {
    key: c.k,
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      padding: '14px 0',
      borderBottom: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.14em',
      color: 'var(--muted)',
      minWidth: 100
    }
  }, c.k), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 500
    }
  }, c.v))))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1
  }, ok ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--ink)',
      color: 'var(--paper)',
      borderRadius: 24,
      padding: '48px 32px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(IcoCheckCircle, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: '-.02em',
      marginBottom: 10
    }
  }, "\xA1Mensaje enviado!"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'oklch(1 0 0 / .7)',
      fontSize: 14,
      margin: 0
    }
  }, "Te respondemos en menos de 24 horas a ", form.email, ".")) : /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      if (form.nombre && form.email && form.msg) setOk(true);
    },
    style: {
      background: 'var(--paper)',
      border: '1px solid var(--line)',
      borderRadius: 24,
      padding: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '.14em',
      color: 'var(--muted)',
      textTransform: 'uppercase',
      marginBottom: 4
    }
  }, "Envi\xE1 tu mensaje"), [{
    k: 'nombre',
    l: 'Nombre',
    t: 'text'
  }, {
    k: 'email',
    l: 'Email',
    t: 'email'
  }].map(f => /*#__PURE__*/React.createElement("div", {
    key: f.k
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.14em',
      color: touched[f.k] ? isValid(form[f.k]) ? '#2EC4A0' : '#D85AA3' : 'var(--muted)',
      textTransform: 'uppercase',
      transition: 'color .2s'
    }
  }, f.l), /*#__PURE__*/React.createElement("input", {
    type: f.t,
    value: form[f.k],
    onChange: e => setForm(p => ({
      ...p,
      [f.k]: e.target.value
    })),
    onBlur: () => setTouched(p => ({
      ...p,
      [f.k]: true
    })),
    "data-cursor": true,
    style: {
      width: '100%',
      border: 'none',
      borderBottom: `1.5px solid ${borderColor(f.k)}`,
      padding: '10px 0',
      fontSize: 18,
      fontFamily: 'inherit',
      background: 'transparent',
      outline: 'none',
      color: 'var(--ink)',
      transition: 'border-color .25s'
    }
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.14em',
      color: touched.msg ? isValid(form.msg) ? '#2EC4A0' : '#D85AA3' : 'var(--muted)',
      textTransform: 'uppercase',
      transition: 'color .2s'
    }
  }, "Mensaje"), /*#__PURE__*/React.createElement("textarea", {
    rows: 4,
    value: form.msg,
    onChange: e => setForm(p => ({
      ...p,
      msg: e.target.value
    })),
    onBlur: () => setTouched(p => ({
      ...p,
      msg: true
    })),
    "data-cursor": true,
    style: {
      width: '100%',
      border: 'none',
      borderBottom: `1.5px solid ${borderColor('msg')}`,
      padding: '10px 0',
      fontSize: 18,
      fontFamily: 'inherit',
      background: 'transparent',
      outline: 'none',
      resize: 'vertical',
      color: 'var(--ink)',
      transition: 'border-color .25s'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(MagBtn, {
    variant: "ink"
  }, "Enviar mensaje"))))), /*#__PURE__*/React.createElement("style", null, `
        @media (max-width: 900px){ .lud-contact-grid{ grid-template-columns: 1fr !important; gap: 40px !important;}}
      `));
}
window.Contact = Contact;

// --- footer.jsx ---
// Footer
function Footer() {
  const w = useWindowWidth();
  const isMobile = w <= 640;
  const isTablet = w <= 1024 && w > 640;
  const cols = [{
    h: 'Producto',
    items: ['Cursos', 'Clases particulares', 'Búsqueda con IA', 'Certificados', 'Pagos']
  }, {
    h: 'Empresa',
    items: ['Nosotros', 'Carreras', 'Manifiesto', 'Press kit', 'Contacto']
  }, {
    h: 'Recursos',
    items: ['Ayuda', 'Libro de Quejas', 'Changelog', 'Status', 'Blog']
  }, {
    h: 'Legal',
    items: [{
      label: 'Términos',
      href: '/terminos'
    }, {
      label: 'Privacidad',
      href: '/privacidad'
    }, {
      label: 'Quejas',
      href: '/quejas'
    }, {
      label: 'Accesibilidad',
      href: '/accesibilidad'
    }, {
      label: 'Defensa al Consumidor',
      href: '/consumidor'
    }, {
      label: 'Devoluciones',
      href: '/devoluciones'
    }]
  }];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--ink)',
      color: 'var(--paper)',
      padding: '80px 28px 32px',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Grain, {
    opacity: 0.055
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1344,
      margin: '0 auto',
      position: 'relative',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'clamp(100px, 22vw, 360px)',
      fontWeight: 700,
      letterSpacing: '-.06em',
      lineHeight: .88,
      marginBottom: 60,
      color: 'oklch(1 0 0 / .06)'
    }
  }, "luderis"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3, 1fr)' : '1.3fr repeat(4, 1fr)',
      gap: 40,
      marginBottom: 60
    },
    className: "lud-footer-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(LudLogo, {
    size: 32
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '-.03em'
    }
  }, "Luderis")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: 1.6,
      color: 'oklch(1 0 0 / .65)',
      maxWidth: 280,
      margin: 0
    }
  }, "Plataforma argentina de educaci\xF3n entre personas. Aprend\xE9 lo que quer\xE9s, ense\xF1\xE1 lo que sab\xE9s."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'oklch(1 0 0 / .45)',
      letterSpacing: '.1em'
    }
  }, "contacto@luderis.com")), cols.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.h
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.14em',
      color: 'oklch(1 0 0 / .5)',
      textTransform: 'uppercase',
      marginBottom: 18
    }
  }, c.h), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, c.items.map(i => {
    const isObj = typeof i === 'object';
    const label = isObj ? i.label : i;
    const resourceLinks = {
      'Ayuda': '/ayuda',
      'Libro de Quejas': '/quejas'
    };
    const href = isObj ? i.href : resourceLinks[i] || '#';
    return /*#__PURE__*/React.createElement("a", {
      key: label,
      href: href,
      "data-cursor": true,
      style: {
        fontSize: 14,
        color: 'var(--paper)',
        transition: 'opacity .2s'
      },
      onMouseEnter: e => e.currentTarget.style.opacity = '.6',
      onMouseLeave: e => e.currentTarget.style.opacity = '1'
    }, label);
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid oklch(1 0 0 / .15)',
      paddingTop: 24,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 16,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'oklch(1 0 0 / .55)'
    }
  }, /*#__PURE__*/React.createElement("div", null, "\xA9 ", new Date().getFullYear(), " LUDERIS S.A. \xB7 BUENOS AIRES, ARGENTINA"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("span", null, "v2026.1 \xB7 LIVE"), /*#__PURE__*/React.createElement("span", null, "\u25CF All systems operational")))), /*#__PURE__*/React.createElement("style", null, `
        @media (max-width: 900px){ .lud-footer-grid{ grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 520px){ .lud-footer-grid{ grid-template-columns: 1fr !important; } }
      `));
}
window.Footer = Footer;

// --- floatingcta.jsx ---
// Floating sticky CTA — aparece al scrollear 600px
function FloatingCTA({
  onEnter
}) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": !visible,
    style: {
      position: 'fixed',
      bottom: 28,
      right: 28,
      zIndex: 900,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(.95)',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'transform .4s cubic-bezier(.2,.7,.2,1), opacity .35s ease'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onEnter,
    "data-cursor": true,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      background: 'var(--ink)',
      color: 'var(--paper)',
      border: 'none',
      borderRadius: 99,
      padding: '14px 22px',
      fontFamily: 'var(--font-display)',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: '0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.1)',
      transition: 'transform .25s, box-shadow .25s'
    },
    onMouseEnter: e => {
      e.currentTarget.style.transform = 'scale(1.04)';
      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.12)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.1)';
    }
  }, /*#__PURE__*/React.createElement(LudLogo, {
    size: 20
  }), "Empezar gratis"));
}
window.FloatingCTA = FloatingCTA;

// --- app.jsx ---
// App: compone todo
const {
  useState
} = React;
function App() {
  const onEnter = () => {
    sessionStorage.setItem("ld_auth", "1");
    window.location.href = '/#auth';
  };
  React.useEffect(() => {
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
    return () => {
      try {
        document.head.removeChild(el);
      } catch {}
    };
  }, []);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ScrollProgress, null), /*#__PURE__*/React.createElement(Cursor, null), /*#__PURE__*/React.createElement(FloatingCTA, {
    onEnter: onEnter
  }), /*#__PURE__*/React.createElement(Nav, {
    onEnter: onEnter
  }), /*#__PURE__*/React.createElement(Hero, {
    onEnter: onEnter
  }), /*#__PURE__*/React.createElement(TrustBar, null), /*#__PURE__*/React.createElement(Worlds, {
    onEnter: onEnter
  }), /*#__PURE__*/React.createElement(Features, null), /*#__PURE__*/React.createElement(How, null), /*#__PURE__*/React.createElement(Preview, {
    onEnter: onEnter
  }), /*#__PURE__*/React.createElement(Stats, null), /*#__PURE__*/React.createElement(About, null), /*#__PURE__*/React.createElement(Testimonials, null), /*#__PURE__*/React.createElement(CTA, {
    onEnter: onEnter
  }), /*#__PURE__*/React.createElement(Contact, null), /*#__PURE__*/React.createElement(Footer, null));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
