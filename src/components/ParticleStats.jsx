import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createNoise2D } from 'simplex-noise'
import './ParticleStats.scss'

gsap.registerPlugin(ScrollTrigger)

const STATS = [
  { value: '6,000+', label: 'Students Enrolled' },
  { value: '80+', label: 'Degree Programs' },
  { value: '123', label: 'Years of Excellence' },
  { value: '50+', label: 'Student Organizations' },
]

// ASU brand colors in linear RGB
const COL_BLUE = [0.0, 0.325, 0.608]    // #00539B
const COL_GOLD = [0.949, 0.663, 0.0]    // #F2A900
const COL_WHITE = [0.85, 0.88, 0.95]

// ─── GLSL Shaders ───────────────────────────────────────────────
// Vertex shader: positions point sprites in clip space
const VERT = `
attribute vec2 aPos;
attribute vec3 aCol;
attribute float aSize;
attribute float aAlpha;

uniform vec2 uRes;
uniform float uDpr;

varying vec3 vCol;
varying float vAlpha;

void main() {
  vec2 clip = (aPos / uRes) * 2.0 - 1.0;
  clip.y *= -1.0;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = aSize * uDpr;
  vCol = aCol;
  vAlpha = aAlpha;
}
`

// Fragment shader: multi-layer luminous glow with additive blending
const FRAG = `
precision highp float;
varying vec3 vCol;
varying float vAlpha;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);

  // Bright core + soft outer halo
  float core = exp(-d * d * 60.0);
  float halo = exp(-d * d * 12.0);
  float ring = exp(-d * d * 4.0) * 0.15;
  float a = (core * 1.0 + halo * 0.45 + ring) * vAlpha;

  if (a < 0.003) discard;

  vec3 col = vCol * (core * 1.4 + halo * 0.6 + ring * 0.3);
  gl_FragColor = vec4(col * a, a);
}
`

// ─── Helpers ────────────────────────────────────────────────────
function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

function lerp(a, b, t) { return a + (b - a) * t }

// Sample text bitmap → array of [x, y] positions
function sampleText(text, w, h) {
  const cvs = document.createElement('canvas')
  cvs.width = w; cvs.height = h
  const ctx = cvs.getContext('2d')
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#fff'
  const fontSize = Math.floor(h * 0.52)
  ctx.font = `800 ${fontSize}px "DM Serif Display", Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, w / 2, h / 2)
  const img = ctx.getImageData(0, 0, w, h)
  const pts = []
  const step = 2
  for (let y = 0; y < h; y += step)
    for (let x = 0; x < w; x += step)
      if (img.data[(y * w + x) * 4 + 3] > 100) pts.push([x, y])
  return pts
}

// Compile a WebGL shader
function makeShader(gl, src, type) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('Shader:', gl.getShaderInfoLog(s))
    gl.deleteShader(s)
    return null
  }
  return s
}

// ─── Component ──────────────────────────────────────────────────
export default function ParticleStats() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [label, setLabel] = useState(STATS[0].label)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // ── Config ──
    const isMobile = window.innerWidth < 768
    const COUNT = isMobile ? 12000 : 50000
    const noise = createNoise2D()
    const dpr = Math.min(1.5, window.devicePixelRatio)

    let W = canvas.offsetWidth
    let H = canvas.offsetHeight

    // ── WebGL context ──
    const gl = canvas.getContext('webgl', {
      alpha: true, premultipliedAlpha: false, antialias: false,
    })
    if (!gl) return

    // ── Compile program ──
    const vs = makeShader(gl, VERT, gl.VERTEX_SHADER)
    const fs = makeShader(gl, FRAG, gl.FRAGMENT_SHADER)
    if (!vs || !fs) return

    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    // Locations
    const aPos = gl.getAttribLocation(prog, 'aPos')
    const aCol = gl.getAttribLocation(prog, 'aCol')
    const aSize = gl.getAttribLocation(prog, 'aSize')
    const aAlpha = gl.getAttribLocation(prog, 'aAlpha')
    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uDpr = gl.getUniformLocation(prog, 'uDpr')

    // ── Pre-sample all stat text targets ──
    const sW = 512, sH = 200
    const allTargets = STATS.map(s => sampleText(s.value, sW, sH))

    // ── Particle arrays ──
    const pos = new Float32Array(COUNT * 2)
    const vel = new Float32Array(COUNT * 2)
    const tgt = new Float32Array(COUNT * 2)
    const col = new Float32Array(COUNT * 3)
    const siz = new Float32Array(COUNT)
    const alp = new Float32Array(COUNT)

    // Initialize
    for (let i = 0; i < COUNT; i++) {
      pos[i * 2] = Math.random() * W
      pos[i * 2 + 1] = Math.random() * H
      const t = Math.random()
      const c = t < 0.55 ? COL_BLUE : t < 0.9 ? COL_GOLD : COL_WHITE
      col[i * 3] = c[0] * (0.7 + Math.random() * 0.3)
      col[i * 3 + 1] = c[1] * (0.7 + Math.random() * 0.3)
      col[i * 3 + 2] = c[2] * (0.7 + Math.random() * 0.3)
      siz[i] = (1.0 + Math.random() * 3.5) * dpr
      alp[i] = 0.5 + Math.random() * 0.5
    }

    // Assign targets for a given stat index
    function assignTargets(si) {
      const pts = allTargets[si]
      if (!pts || !pts.length) return
      const scale = Math.min((W * 0.82) / sW, (H * 0.45) / sH)
      const ox = (W - sW * scale) / 2
      const oy = (H - sH * scale) / 2
      for (let i = 0; i < COUNT; i++) {
        const p = pts[i % pts.length]
        const jitter = i >= pts.length ? (Math.random() - 0.5) * 6 * scale : (Math.random() - 0.5) * 1.5
        tgt[i * 2] = p[0] * scale + ox + jitter
        tgt[i * 2 + 1] = p[1] * scale + oy + jitter
      }
    }
    assignTargets(0)

    // ── WebGL buffers ──
    const bPos = gl.createBuffer()
    const bCol = gl.createBuffer()
    const bSiz = gl.createBuffer()
    const bAlp = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, bCol)
    gl.bufferData(gl.ARRAY_BUFFER, col, gl.DYNAMIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, bSiz)
    gl.bufferData(gl.ARRAY_BUFFER, siz, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, bAlp)
    gl.bufferData(gl.ARRAY_BUFFER, alp, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, bPos)
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW)

    // Additive blending for luminous glow
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

    // ── State ──
    let scrollProg = 0
    let mx = W / 2, my = H / 2, mouseIn = false
    let curStat = 0
    let raf

    // ── Resize ──
    const resize = () => {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
      assignTargets(curStat)
    }
    resize()
    window.addEventListener('resize', resize)

    // ── Mouse ──
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect()
      mx = e.clientX - r.left; my = e.clientY - r.top
      mouseIn = true
    }
    const onLeave = () => { mouseIn = false }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)

    // ── Device tilt on mobile (gravitational wells) ──
    let gyroX = 0, gyroY = 0
    const onDeviceOrient = (e) => {
      if (e.gamma != null) gyroX = e.gamma / 30 // -1 to 1
      if (e.beta != null) gyroY = (e.beta - 45) / 30
      // Simulate mouse position from tilt
      mx = W / 2 + gyroX * W * 0.3
      my = H / 2 + gyroY * H * 0.3
      mouseIn = true
    }
    if (isMobile) window.addEventListener('deviceorientation', onDeviceOrient)

    // ── Performance monitoring — fallback for low-end devices ──
    let frameCount = 0, lastFpsCheck = performance.now(), lowFpsCount = 0
    let useFallback = false

    // ── ScrollTrigger ──
    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: '+=400%',
      pin: true,
      scrub: 0.8,
      onUpdate: (self) => {
        scrollProg = self.progress
        const ni = Math.min(3, Math.floor(self.progress * 4))
        if (ni !== curStat) {
          curStat = ni
          assignTargets(ni)
          setLabel(STATS[ni].label)
          setIdx(ni)

          // Shift color palette per stat
          for (let i = 0; i < COUNT; i++) {
            const t = Math.random()
            const bias = ni % 2 === 0
            const c = bias
              ? (t < 0.5 ? COL_BLUE : t < 0.85 ? COL_GOLD : COL_WHITE)
              : (t < 0.5 ? COL_GOLD : t < 0.85 ? COL_BLUE : COL_WHITE)
            col[i * 3] = c[0] * (0.75 + Math.random() * 0.25)
            col[i * 3 + 1] = c[1] * (0.75 + Math.random() * 0.25)
            col[i * 3 + 2] = c[2] * (0.75 + Math.random() * 0.25)
          }
          gl.bindBuffer(gl.ARRAY_BUFFER, bCol)
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, col)
        }
      },
    })

    // ── Animation loop ──
    let t = 0
    const NF = 0.003   // noise frequency
    const NS = 0.6     // noise strength
    const SP = 0.07    // spring pull
    const DMP = 0.91   // damping

    // FPS check helper
    function checkFps() {
      frameCount++
      const now = performance.now()
      if (now - lastFpsCheck > 2000) {
        const fps = frameCount / ((now - lastFpsCheck) / 1000)
        if (fps < 20) lowFpsCount++
        else lowFpsCount = Math.max(0, lowFpsCount - 1)
        // If consistently low FPS, flag for fallback
        if (lowFpsCount >= 3) useFallback = true
        frameCount = 0
        lastFpsCheck = now
      }
    }

    function animate() {
      checkFps()
      // If persistent low FPS, signal fallback (component shows CSS counter)
      if (useFallback) {
        container.classList.add('particle-fallback')
        cancelAnimationFrame(raf)
        return
      }
      t += 0.016

      // Phase within current stat quarter (0-1)
      const sp = (scrollProg * 4) % 1

      for (let i = 0; i < COUNT; i++) {
        const i2 = i * 2
        let px = pos[i2], py = pos[i2 + 1]
        let vx = vel[i2], vy = vel[i2 + 1]
        const tx = tgt[i2], ty = tgt[i2 + 1]

        if (sp < 0.12) {
          // ── SCATTER: noise flow ──
          vx += noise(px * NF, py * NF + t * 0.4) * NS
          vy += noise(px * NF + 97, py * NF + 97 + t * 0.4) * NS
        } else if (sp < 0.82) {
          // ── CONVERGE → HOLD ──
          const intensity = smoothstep(0.12, 0.35, sp)
          const dx = tx - px, dy = ty - py
          vx += dx * SP * intensity
          vy += dy * SP * intensity
          // Subtle breathing when holding
          if (sp > 0.4) {
            vx += noise(px * 0.008 + t * 0.7, py * 0.008) * 0.12
            vy += noise(px * 0.008 + 53, py * 0.008 + 53 + t * 0.7) * 0.12
          }
        } else {
          // ── DISPERSE: radial explosion + noise ──
          const ax = Math.atan2(py - H * 0.5, px - W * 0.5)
          const disperseForce = smoothstep(0.82, 1.0, sp) * 1.2
          vx += Math.cos(ax) * disperseForce
          vy += Math.sin(ax) * disperseForce
          vx += noise(px * NF * 1.5, py * NF * 1.5 + t) * NS * 0.4
          vy += noise(px * NF * 1.5 + 80, py * NF * 1.5 + 80 + t) * NS * 0.4
        }

        // Mouse repulsion
        if (mouseIn) {
          const dx = mx - px, dy = my - py
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120 && dist > 0.1) {
            const f = (120 - dist) / 120 * 2.5
            vx -= (dx / dist) * f
            vy -= (dy / dist) * f
          }
        }

        // Damping & integrate
        vx *= DMP; vy *= DMP
        px += vx; py += vy
        vel[i2] = vx; vel[i2 + 1] = vy

        // Wrap edges
        if (px < -40) px = W + 40
        else if (px > W + 40) px = -40
        if (py < -40) py = H + 40
        else if (py > H + 40) py = -40

        pos[i2] = px; pos[i2 + 1] = py
      }

      // Upload positions
      gl.bindBuffer(gl.ARRAY_BUFFER, bPos)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos)

      // Clear with deep dark blue
      gl.clearColor(0.0, 0.012, 0.045, 1.0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      // Uniforms
      gl.uniform2f(uRes, W, H)
      gl.uniform1f(uDpr, dpr)

      // Bind attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, bPos)
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, bCol)
      gl.enableVertexAttribArray(aCol)
      gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, bSiz)
      gl.enableVertexAttribArray(aSize)
      gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, bAlp)
      gl.enableVertexAttribArray(aAlpha)
      gl.vertexAttribPointer(aAlpha, 1, gl.FLOAT, false, 0, 0)

      gl.drawArrays(gl.POINTS, 0, COUNT)
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      trigger.kill()
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', resize)
      if (isMobile) window.removeEventListener('deviceorientation', onDeviceOrient)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(bPos)
      gl.deleteBuffer(bCol)
      gl.deleteBuffer(bSiz)
      gl.deleteBuffer(bAlp)
    }
  }, [])

  return (
    <section ref={containerRef} className="particle-stats-section">
      <canvas ref={canvasRef} className="particle-canvas" />
      {/* CSS @property fallback counter for low-end devices */}
      <div className="particle-css-fallback">
        <div className="fallback-stat">
          <span className="fallback-value" style={{ '--target': STATS[idx].value.replace(/[^0-9]/g, '') }}>{STATS[idx].value}</span>
          <span className="fallback-label">{label}</span>
        </div>
      </div>
      <div className="particle-overlay">
        <div className="particle-label-wrap">
          <span className="particle-label" key={idx}>{label}</span>
        </div>
        <div className="particle-dots">
          {STATS.map((_, i) => (
            <span key={i} className={`particle-dot${i === idx ? ' active' : ''}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
