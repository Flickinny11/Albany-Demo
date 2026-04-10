import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Curtains, Plane, ShaderPass, RenderTarget } from 'curtainsjs'
import './HeritageScroll.scss'

gsap.registerPlugin(ScrollTrigger)

// ─── Chapter Data ───────────────────────────────────────────────
const CHAPTERS = [
  {
    era: '1903',
    badge: 'The Founding',
    title: 'Where It All Began',
    text: 'In 1903, Joseph Winthrop Holley founded the Albany Bible and Manual Training Institute with a bold vision: to uplift a community through education. With just a handful of students and boundless determination, a legacy was born in the heart of Southwest Georgia.',
    img: 'https://www.asurams.edu/images/ou_images/College-of-Arts-and-Sciences.jpg',
    shader: 'ink',
  },
  {
    era: '1943',
    badge: 'Growth & Purpose',
    title: 'A Growing Legacy',
    text: 'Renamed Albany State College in 1943, the institution expanded rapidly — new degree programs, a thriving campus, and an unshakable commitment to producing leaders. Generations of educators, scientists, and public servants found their calling here.',
    img: 'https://www.asurams.edu/images/ou_images/College-of-Professional-Studies.jpg',
    shader: 'chromatic',
  },
  {
    era: '1960s',
    badge: 'Voices of Change',
    title: 'Standing for Justice',
    text: 'During the Albany Movement of the 1960s, students and faculty stood at the forefront of the Civil Rights struggle. Their courage helped reshape a nation. That spirit of activism and social responsibility remains woven into Albany State\'s DNA.',
    img: 'https://www.asurams.edu/images/ou_images/Darton-College-of-Health-Professions.jpg',
    shader: 'mosaic',
  },
  {
    era: 'Today',
    badge: 'Shaping Tomorrow',
    title: 'A New Chapter',
    text: 'Today, Albany State University stands as a nationally recognized HBCU — offering 80+ degree programs, groundbreaking research, and a campus community that feels like family. The next 123 years begin with you.',
    img: 'https://www.asurams.edu/images/graduate%20photo%205.jpg',
    shader: 'liquid',
  },
]

// ─── Vertex Shader (shared) ─────────────────────────────────────
const VS = `
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
varying vec2 vTextureCoord;
varying vec2 vVertexPos;

void main() {
  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
  vTextureCoord = aTextureCoord;
  vVertexPos = aVertexPosition.xy;
}
`

// ─── Fragment Shaders per era ───────────────────────────────────

// Noise helpers used by multiple shaders
const NOISE_GLSL = `
float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1, 0)), f.x),
    mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
}
float fbm2(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise2(p); p *= 2.0; a *= 0.5; }
  return v;
}
`

// 1. Ink displacement — old paper texture bleeding through
const FS_INK = `
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler0;
uniform float uTime;
uniform float uProgress;
${NOISE_GLSL}

void main() {
  vec2 uv = vTextureCoord;

  // Procedural paper displacement
  float disp = fbm2(uv * 5.0 + uTime * 0.08);
  float dispStr = (1.0 - uProgress) * 0.06;
  vec2 duv = uv + vec2(disp * dispStr, disp * dispStr * 0.7);

  vec4 tex = texture2D(uSampler0, duv);

  // Sepia treatment fading to full color
  float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
  vec3 sepia = vec3(gray * 1.12, gray * 0.92, gray * 0.72);
  tex.rgb = mix(sepia, tex.rgb, smoothstep(0.2, 0.7, uProgress));

  // Fade-in from displaced state
  float alpha = smoothstep(0.0, 0.25, uProgress);

  // Paper grain overlay
  float grain = (hash21(uv * 800.0 + uTime * 50.0) - 0.5) * 0.06;
  tex.rgb += grain;

  // Vignette
  float vig = 1.0 - length((uv - 0.5) * 1.4) * 0.4;
  tex.rgb *= vig;

  gl_FragColor = vec4(tex.rgb, alpha);
}
`

// 2. Chromatic aberration — RGB channels arrive at different speeds
const FS_CHROMATIC = `
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler0;
uniform float uTime;
uniform float uProgress;
${NOISE_GLSL}

void main() {
  vec2 uv = vTextureCoord;
  vec2 center = uv - 0.5;
  float dist = length(center);

  // Chromatic split strength decreases as we reveal
  float str = (1.0 - uProgress) * 0.03 * (1.0 + dist);
  vec2 dir = normalize(center + 0.001);

  float r = texture2D(uSampler0, uv + dir * str).r;
  float g = texture2D(uSampler0, uv).g;
  float b = texture2D(uSampler0, uv - dir * str).b;

  vec3 col = vec3(r, g, b);

  // Slight warmth
  col *= vec3(1.05, 0.98, 0.92);

  float alpha = smoothstep(0.0, 0.2, uProgress);

  // Film grain
  float grain = (hash21(uv * 600.0 + uTime * 30.0) - 0.5) * 0.04;
  col += grain;

  float vig = 1.0 - length((uv - 0.5) * 1.5) * 0.35;
  col *= vig;

  gl_FragColor = vec4(col, alpha);
}
`

// 3. Geometric mosaic — cells reveal at different times
const FS_MOSAIC = `
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler0;
uniform float uTime;
uniform float uProgress;
${NOISE_GLSL}

void main() {
  vec2 uv = vTextureCoord;

  // Grid that transitions from coarse blocks to full resolution
  float gridSize = mix(6.0, 80.0, uProgress * uProgress);
  vec2 gridUV = floor(uv * gridSize) / gridSize;

  // Per-cell reveal timing
  float cellHash = hash21(gridUV * 137.0);
  float reveal = smoothstep(cellHash * 0.6, cellHash * 0.6 + 0.25, uProgress);

  // Mix between pixelated and full-res
  vec2 finalUV = mix(gridUV + 0.5 / gridSize, uv, reveal);
  vec4 tex = texture2D(uSampler0, finalUV);

  // High contrast treatment
  float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
  vec3 highContrast = tex.rgb * (1.0 + (lum - 0.5) * 0.4);
  tex.rgb = mix(tex.rgb, highContrast, 0.3);

  float alpha = smoothstep(0.0, 0.12, uProgress);

  // Subtle scan line
  float scan = sin(uv.y * 400.0) * 0.02 * (1.0 - uProgress);
  tex.rgb += scan;

  float vig = 1.0 - length((uv - 0.5) * 1.3) * 0.35;
  tex.rgb *= vig;

  gl_FragColor = vec4(tex.rgb, alpha);
}
`

// 4. Liquid dissolve — fluid noise reveal from bottom
const FS_LIQUID = `
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler0;
uniform float uTime;
uniform float uProgress;
${NOISE_GLSL}

void main() {
  vec2 uv = vTextureCoord;

  // Liquid noise distortion
  float n = fbm2(uv * 3.0 + uTime * 0.15);
  float dispStr = (1.0 - uProgress) * 0.035;
  vec2 duv = uv + vec2(n * dispStr, n * dispStr * 0.6);

  vec4 tex = texture2D(uSampler0, duv);

  // Reveal wave sweeping upward
  float wave = sin(uv.x * 6.0 + uTime * 0.8) * 0.04;
  float revealLine = 1.0 - uProgress;
  float reveal = smoothstep(revealLine + 0.08 + wave, revealLine - 0.02 + wave, 1.0 - uv.y);

  // Edge glow at the reveal boundary
  float edge = smoothstep(0.0, 0.06, abs(1.0 - uv.y - revealLine - wave));
  vec3 edgeColor = mix(vec3(0.95, 0.66, 0.0), tex.rgb, edge);
  tex.rgb = mix(edgeColor, tex.rgb, smoothstep(0.85, 1.0, uProgress));

  float vig = 1.0 - length((uv - 0.5) * 1.4) * 0.3;
  tex.rgb *= vig;

  gl_FragColor = vec4(tex.rgb, reveal);
}
`

const SHADER_MAP = { ink: FS_INK, chromatic: FS_CHROMATIC, mosaic: FS_MOSAIC, liquid: FS_LIQUID }

// ─── Film Grain Post-Processing Pass ─────────────────────────
const GRAIN_PASS_FS = `
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uRenderTexture;
uniform float uTime;
uniform float uScrollProgress;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = vTextureCoord;
  vec4 color = texture2D(uRenderTexture, uv);

  // Animated film grain
  float grain = (hash(uv * 1200.0 + uTime * 100.0) - 0.5) * 0.04;
  color.rgb += grain;

  // Subtle vignette
  float vig = 1.0 - length((uv - 0.5) * 1.6) * 0.25;
  color.rgb *= vig;

  gl_FragColor = color;
}
`

// ─── Text Splitting Helper ──────────────────────────────────────
function splitChars(el) {
  const text = el.textContent
  el.textContent = ''
  el.setAttribute('aria-label', text)
  return text.split('').map(ch => {
    const span = document.createElement('span')
    span.textContent = ch === ' ' ? '\u00A0' : ch
    span.style.display = 'inline-block'
    span.style.willChange = 'transform, opacity'
    span.className = 'heritage-char'
    el.appendChild(span)
    return span
  })
}

// ─── Component ──────────────────────────────────────────────────
export default function HeritageScroll() {
  const sectionRef = useRef(null)
  const curtainsRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    // ── curtains.js initialization ──
    let curtains
    try {
      curtains = new Curtains({
        container: section.querySelector('.heritage-curtains-container'),
        pixelRatio: Math.min(1.5, window.devicePixelRatio),
        autoResize: true,
        autoRender: true,
        watchScroll: false,   // We drive updates manually
        premultipliedAlpha: true,
      })
      curtainsRef.current = curtains
    } catch (e) {
      console.warn('curtains.js init failed:', e)
      // Graceful fallback: images show normally without shaders
      section.classList.add('heritage-no-webgl')
      return
    }

    const planes = []
    const triggers = []

    curtains.onError(() => {
      section.classList.add('heritage-no-webgl')
    })

    curtains.onSuccess(() => {
      // ── Global film grain + vignette ShaderPass (post-processing) ──
      let grainTime = 0
      try {
        const grainPass = new ShaderPass(curtains, {
          fragmentShader: GRAIN_PASS_FS,
          uniforms: {
            time: { name: 'uTime', type: '1f', value: 0 },
            scrollProgress: { name: 'uScrollProgress', type: '1f', value: 0 },
          },
        })
        grainPass.onRender(() => {
          grainTime += 0.016
          grainPass.uniforms.time.value = grainTime
        })
      } catch (e) {
        // ShaderPass not supported — grain is still in individual plane shaders
      }

      // Create planes for each chapter image
      const planeEls = section.querySelectorAll('.heritage-plane')

      planeEls.forEach((el, index) => {
        const shaderType = el.dataset.shader || 'ink'
        const fragSrc = SHADER_MAP[shaderType] || FS_INK

        const plane = new Plane(curtains, el, {
          vertexShader: VS,
          fragmentShader: fragSrc,
          widthSegments: 10,
          heightSegments: 10,
          texturesOptions: {
            premultiplyAlpha: true,
          },
          crossOrigin: 'anonymous',
          uniforms: {
            time: { name: 'uTime', type: '1f', value: 0 },
            progress: { name: 'uProgress', type: '1f', value: 0 },
          },
        })

        plane.onReady(() => {
          // ScrollTrigger pins each chapter and maps progress to shader
          const chapter = el.closest('.heritage-chapter')
          if (chapter) {
            const st = ScrollTrigger.create({
              trigger: chapter,
              start: 'top center',
              end: 'bottom center',
              pin: false,  // pin breaks curtains plane positioning; use scrub instead
              scrub: 0.6,
              onUpdate: (self) => {
                if (plane.uniforms && plane.uniforms.progress) {
                  plane.uniforms.progress.value = self.progress
                }
              },
            })
            triggers.push(st)
          }
        }).onRender(() => {
          if (plane.uniforms && plane.uniforms.time) {
            plane.uniforms.time.value += 0.008
          }
        }).onError(() => {
          // Image CORS failure — just show DOM image
          el.classList.add('heritage-plane-fallback')
        })

        planes.push(plane)
      })

      // ── Text character animations ──
      const titles = section.querySelectorAll('.heritage-title')
      titles.forEach((title) => {
        const chars = splitChars(title)
        const chapter = title.closest('.heritage-chapter')

        gsap.fromTo(chars,
          { y: 40, opacity: 0, rotateX: -40 },
          {
            y: 0, opacity: 1, rotateX: 0,
            stagger: 0.025,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: chapter,
              start: 'top 72%',
            },
          }
        )
      })

      // ── Body text fade-in ──
      const bodies = section.querySelectorAll('.heritage-body')
      bodies.forEach((body) => {
        const chapter = body.closest('.heritage-chapter')
        gsap.fromTo(body,
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: chapter,
              start: 'top 65%',
            },
          }
        )
      })

      // ── Era badges ──
      const badges = section.querySelectorAll('.heritage-era-badge')
      badges.forEach((badge) => {
        const chapter = badge.closest('.heritage-chapter')
        gsap.fromTo(badge,
          { scale: 0.8, opacity: 0 },
          {
            scale: 1, opacity: 1,
            duration: 0.6,
            ease: 'back.out(2)',
            scrollTrigger: {
              trigger: chapter,
              start: 'top 78%',
            },
          }
        )
      })
    })

    return () => {
      triggers.forEach(t => t.kill())
      planes.forEach(p => {
        if (p.remove) p.remove()
      })
      if (curtains) curtains.dispose()
      curtainsRef.current = null
    }
  }, [])

  return (
    <section ref={sectionRef} className="heritage-section">
      {/* curtains.js canvas container */}
      <div className="heritage-curtains-container" />

      {/* Background gradient overlay */}
      <div className="heritage-bg-gradient" />

      <div className="heritage-header">
        <div className="container">
          <div className="gold-line" />
          <h2 className="heritage-section-title">123 Years of <em>Golden</em> Legacy</h2>
          <p className="heritage-section-sub">A story of faith, resilience, and transformation.</p>
        </div>
      </div>

      {CHAPTERS.map((ch, i) => (
        <div key={i} className={`heritage-chapter heritage-chapter-${ch.shader}`}>
          <div className="container heritage-chapter-inner">
            <div className="heritage-text-col">
              <div className="heritage-era-badge">
                <span className="heritage-era-year">{ch.era}</span>
                <span className="heritage-era-label">{ch.badge}</span>
              </div>
              <h3 className="heritage-title">{ch.title}</h3>
              <p className="heritage-body">{ch.text}</p>
            </div>
            <div className="heritage-img-col">
              <div className="heritage-plane" data-shader={ch.shader}>
                <img
                  src={ch.img}
                  alt={ch.title}
                  crossOrigin="anonymous"
                  loading="lazy"
                  data-sampler="uSampler0"
                />
              </div>
            </div>
          </div>
          {/* Era divider line */}
          {i < CHAPTERS.length - 1 && <div className="heritage-divider" />}
        </div>
      ))}
    </section>
  )
}
