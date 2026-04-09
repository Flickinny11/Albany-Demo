import { useEffect, useRef } from 'react'

// Custom WebGL shader overlay for the hero video
// Creates cinematic color grading, film grain, vignette, and subtle displacement
const VERTEX_SHADER = `
  attribute vec4 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = position;
  }
`

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;

  // Simplex-like hash noise
  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  // Film grain
  float grain(vec2 uv, float t) {
    return hash(uv * 1000.0 + t * 100.0) * 0.08 - 0.04;
  }

  // Vignette
  float vignette(vec2 uv, float intensity) {
    vec2 centered = uv * 2.0 - 1.0;
    float dist = length(centered);
    return 1.0 - smoothstep(0.4, 1.4, dist) * intensity;
  }

  // Chromatic aberration
  vec3 chromaShift(vec2 uv, float amount) {
    float r = hash(uv + 0.1 + uTime * 0.01);
    float g = hash(uv + 0.2 + uTime * 0.01);
    float b = hash(uv + 0.3 + uTime * 0.01);
    return vec3(r, g, b);
  }

  void main() {
    vec2 uv = vUv;

    // Subtle displacement based on time
    float dispX = sin(uv.y * 3.14 + uTime * 0.5) * 0.002;
    float dispY = cos(uv.x * 3.14 + uTime * 0.3) * 0.001;
    uv += vec2(dispX, dispY);

    // Base color — deep navy/blue tint for cinematic look
    vec3 color = vec3(0.0);

    // Color grading: blue shadows, gold highlights
    float luminance = (uv.x + uv.y) * 0.5;

    // Deep navy blue base
    vec3 shadows = vec3(0.0, 0.02, 0.08);
    vec3 midtones = vec3(0.0, 0.04, 0.12);
    vec3 highlights = vec3(0.06, 0.08, 0.18);

    color = mix(shadows, midtones, smoothstep(0.0, 0.5, luminance));
    color = mix(color, highlights, smoothstep(0.5, 1.0, luminance));

    // Gold accent glow from bottom
    float goldGlow = smoothstep(0.8, 0.0, uv.y) * 0.15;
    color += vec3(0.92, 0.67, 0.0) * goldGlow;

    // Flowing light streaks
    float streak1 = sin(uv.x * 8.0 + uTime * 0.4 + uv.y * 3.0) * 0.5 + 0.5;
    streak1 = pow(streak1, 8.0) * 0.06;
    color += vec3(0.0, 0.15, 0.65) * streak1;

    float streak2 = cos(uv.y * 6.0 + uTime * 0.3 - uv.x * 4.0) * 0.5 + 0.5;
    streak2 = pow(streak2, 10.0) * 0.04;
    color += vec3(0.92, 0.67, 0.0) * streak2;

    // Mouse interaction — subtle glow
    float mouseGlow = 1.0 - smoothstep(0.0, 0.4, length(uv - uMouse));
    color += vec3(0.92, 0.67, 0.0) * mouseGlow * 0.04;

    // Film grain
    color += grain(uv, uTime);

    // Vignette
    color *= vignette(uv, 0.6);

    // Output with semi-transparency to overlay on video
    gl_FragColor = vec4(color, 0.45);
  }
`

export default function HeroWebGL() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
    if (!gl) return

    // Compile shaders
    function compileShader(src, type) {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('Shader error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vs = compileShader(VERTEX_SHADER, gl.VERTEX_SHADER)
    const fs = compileShader(FRAGMENT_SHADER, gl.FRAGMENT_SHADER)
    if (!vs || !fs) return

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Program link error')
      return
    }

    gl.useProgram(program)

    // Fullscreen quad
    const positions = new Float32Array([
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1,
    ])

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const posLoc = gl.getAttribLocation(program, 'position')
    const uvLoc = gl.getAttribLocation(program, 'uv')

    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(uvLoc)
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8)

    const uTime = gl.getUniformLocation(program, 'uTime')
    const uResolution = gl.getUniformLocation(program, 'uResolution')
    const uMouse = gl.getUniformLocation(program, 'uMouse')

    let mouse = { x: 0.5, y: 0.5 }

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = (e.clientX - rect.left) / rect.width
      mouse.y = 1.0 - (e.clientY - rect.top) / rect.height
    }
    window.addEventListener('mousemove', onMouseMove)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    let animId
    const startTime = performance.now()

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio > 1 ? 1.5 : 1)
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio > 1 ? 1.5 : 1)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const render = () => {
      const time = (performance.now() - startTime) * 0.001
      gl.uniform1f(uTime, time)
      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animId = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', resize)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buffer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    />
  )
}
