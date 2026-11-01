"use client"
import { useEffect, useRef, useState } from "react"

/**
 * A real-time water surface drawn on the graphics card (WebGL), in the colours of the QubixPrep icon:
 * midnight navy and royal blue water with gold light and gold glints, and the QubixPrep shield floating on it.
 * Touch or drag across it and rings spread from your finger.
 */

const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform vec4 uRip[8];   // x, y (0..1 of height-normalised space), start time, strength

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float a = .5, s = 0.;
  for(int i=0;i<5;i++){ s += a*noise(p); p = mat2(1.6,1.2,-1.2,1.6)*p; a *= .5; }
  return s;
}

// surface height at a point
float height(vec2 p, float t){
  float h = 0.;
  // long swells travelling in two directions
  h += sin(dot(p, vec2(1.2, .5))*2.2 + t*.9) * .22;
  h += sin(dot(p, vec2(-.6, 1.1))*3.1 - t*1.1) * .13;
  // choppy detail that drifts
  h += (fbm(p*3.2 + vec2(t*.16, -t*.1)) - .5) * .5;
  h += (fbm(p*7.5 - vec2(t*.22, t*.12)) - .5) * .18;
  // rings from touches
  for(int i=0;i<8;i++){
    vec4 r = uRip[i];
    if(r.w > 0.){
      float age = t - r.z;
      if(age > 0. && age < 4.){
        float d = distance(p, r.xy);
        float front = age*.55;
        float env = exp(-pow((d-front)*5., 2.)) * exp(-age*.9);
        h += sin((d-front)*38.) * env * r.w * .42;
      }
    }
  }
  return h;
}

// bright web of focused light on the bed, as seen through a rippling surface
float caustics(vec2 uv, float t){
  vec2 p = mod(uv*6.2831*1.4, 6.2831) - 250.;
  vec2 i = p;
  float c = 1., inten = .005;
  for(int n=0;n<4;n++){
    float tt = t*.5*(1. - 3.5/float(n+1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1./length(vec2(p.x/(sin(i.x+tt)/inten), p.y/(cos(i.y+tt)/inten)));
  }
  c /= 4.;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.);
}

void main(){
  float asp = uRes.x/uRes.y;
  vec2 p = vec2(vUv.x*asp, vUv.y);
  float t = uTime;

  float e = .004;
  float h  = height(p, t);
  float hx = height(p+vec2(e,0.), t);
  float hy = height(p+vec2(0.,e), t);
  vec3 n = normalize(vec3(-(hx-h)/e*.045, -(hy-h)/e*.045, 1.));

  vec3 V = vec3(0.,0.,1.);
  vec3 L = normalize(vec3(-.35, .55, .75));
  float fres = pow(1. - max(dot(n,V),0.), 3.);
  fres = mix(.06, 1., fres);

  // colour of the water itself: midnight navy at the bottom, royal blue near the top (the icon's two blues)
  vec3 deep    = vec3(.035, .075, .17);
  vec3 shallow = vec3(.075, .21, .50);
  vec3 body = mix(deep, shallow, smoothstep(.0, 1.05, vUv.y + (h*.35)));

  // gold light on the bed, bent by the surface
  vec2 bed = p + n.xy*.35;
  float cau = caustics(bed*.55, t);
  body += vec3(.95, .72, .28) * cau * .42;

  // sky in the reflection: deep blue to pale gold, with moving cloud
  float cl = fbm(p*1.4 + n.xy*1.5 + vec2(t*.03, 0.));
  vec3 sky = mix(vec3(.16,.26,.55), vec3(.98,.86,.58), smoothstep(.25,.85,cl));
  vec3 col = mix(body, sky, fres*.75);

  // glints: warm gold-white
  vec3 R = reflect(-L, n);
  float spec = pow(max(dot(R, V), 0.), 140.);
  col += vec3(1.,.9,.62) * spec * 1.5;
  col += vec3(.95,.75,.35) * pow(max(dot(R,V),0.), 18.) * .10;

  // light foam where a ring crests
  float crest = smoothstep(.5, 1.2, abs(h));
  col = mix(col, vec3(1.,.94,.8), crest*.22);

  // soft darkening at the edges so it sits like a window
  vec2 q = vUv - .5;
  col *= 1. - dot(q,q)*.45;

  gl_FragColor = vec4(col, 1.);
}
`

type Rip = { x: number; y: number; t: number; s: number }

export function WaterHero({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null)
  const cvs = useRef<HTMLCanvasElement>(null)
  const ripples = useRef<Rip[]>([])
  const clock = useRef(0)
  const [gl, setGl] = useState(true)

  useEffect(() => {
    const canvas = cvs.current, box = wrap.current
    if (!canvas || !box) return
    const ctx = (canvas.getContext("webgl", { antialias: true, alpha: false, powerPreference: "low-power" }) || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null
    if (!ctx) { setGl(false); return }
    const g = ctx

    const mk = (type: number, src: string) => { const s = g.createShader(type)!; g.shaderSource(s, src); g.compileShader(s); return s }
    const vs = mk(g.VERTEX_SHADER, VERT), fs = mk(g.FRAGMENT_SHADER, FRAG)
    const prog = g.createProgram()!
    g.attachShader(prog, vs); g.attachShader(prog, fs); g.linkProgram(prog)
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) { setGl(false); return }
    g.useProgram(prog)
    const buf = g.createBuffer()
    g.bindBuffer(g.ARRAY_BUFFER, buf)
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW)
    const loc = g.getAttribLocation(prog, "p")
    g.enableVertexAttribArray(loc)
    g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0)
    const uRes = g.getUniformLocation(prog, "uRes"), uTime = g.getUniformLocation(prog, "uTime"), uRip = g.getUniformLocation(prog, "uRip")

    const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0, visible = true, last = performance.now()
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.max(2, Math.round(box.clientWidth * dpr)), h = Math.max(2, Math.round(box.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; g.viewport(0, 0, w, h) }
    }
    const draw = () => {
      resize()
      const now = clock.current
      g.uniform2f(uRes, canvas.width, canvas.height)
      g.uniform1f(uTime, now)
      const arr = new Float32Array(32)
      ripples.current = ripples.current.filter((r) => now - r.t < 4).slice(-8)
      ripples.current.forEach((r, i) => { arr[i * 4] = r.x; arr[i * 4 + 1] = r.y; arr[i * 4 + 2] = r.t; arr[i * 4 + 3] = r.s })
      g.uniform4fv(uRip, arr)
      g.drawArrays(g.TRIANGLE_STRIP, 0, 4)
    }
    const loop = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05); last = ts
      clock.current += dt
      if (visible) draw()
      raf = requestAnimationFrame(loop)
    }
    clock.current = 3 + Math.random() * 20
    if (reduced) { draw() } else { raf = requestAnimationFrame(loop) }

    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([e]) => { visible = e.isIntersecting }) : null
    io?.observe(box)
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { if (reduced) draw() }) : null
    ro?.observe(box)
    return () => { cancelAnimationFrame(raf); io?.disconnect(); ro?.disconnect() }
  }, [])

  // where a pointer is, in the shader's own space (x scaled by the panel's shape, y from the bottom)
  const spot = (e: React.PointerEvent) => {
    const r = wrap.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.height), y: 1 - (e.clientY - r.top) / r.height }
  }
  const lastTrail = useRef(0)
  const drop = (e: React.PointerEvent, strength: number) => {
    if (!wrap.current) return
    const p = spot(e)
    ripples.current.push({ x: p.x, y: p.y, t: clock.current, s: strength })
  }

  return (
    <div
      ref={wrap}
      onPointerDown={(e) => drop(e, 1)}
      onPointerMove={(e) => { const n = performance.now(); if ((e.buttons || e.pointerType === "mouse") && n - lastTrail.current > 110) { lastTrail.current = n; drop(e, 0.45) } }}
      className="relative isolate overflow-hidden rounded-[28px] border border-[#c9a24a]/60 shadow-[0_18px_50px_-18px_rgba(8,20,60,.7)]"
      style={{ background: "linear-gradient(160deg,#143a80,#0c2250 60%,#07122b)" }}
    >
      <canvas ref={cvs} aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full" style={{ display: gl ? "block" : "none" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-mark-512.png" alt="" aria-hidden="true" draggable={false} className="wh-logo pointer-events-none absolute right-4 top-1/2 z-0 h-[84%] w-auto select-none opacity-30 sm:opacity-95 md:right-10" />
      <style>{`.wh-logo{filter:drop-shadow(0 10px 22px rgba(2,10,40,.65)) drop-shadow(0 0 18px rgba(212,170,70,.35));animation:whBob 6s ease-in-out infinite;transform:translateY(-50%)}@keyframes whBob{0%,100%{transform:translateY(-50%) rotate(-1.2deg)}50%{transform:translateY(-54%) rotate(1.2deg)}}@media (prefers-reduced-motion:reduce){.wh-logo{animation:none}}`}</style>
      <div className="pointer-events-none relative px-5 pb-12 pt-7 md:px-8 md:pb-14 md:pt-9 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">{children}</div>
    </div>
  )
}
