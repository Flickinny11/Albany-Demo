import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createNoise2D } from 'simplex-noise'
import './LivingCampus.scss'

gsap.registerPlugin(ScrollTrigger)

// ─── Ray-Marched SDF Campus Scene ───────────────────────────
// Entirely in a fragment shader — no 3D models, no Three.js.
// Uses SDF primitives from Design_References.md Section 8.

const VS = `
attribute vec4 position;
void main() { gl_Position = position; }
`

const FS = `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uTimeOfDay; // 0-24 hours
uniform float uScrollReveal; // 0-1

// ── SDF Primitives (Inigo Quilez reference) ──
float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}
float sdCylinder(vec3 p, float r, float h) {
  vec2 d = vec2(length(p.xz) - r, abs(p.y) - h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdCone(vec3 p, float r, float h) {
  vec2 q = vec2(length(p.xz), p.y);
  vec2 tip = q - vec2(0, h);
  vec2 mn = vec2(clamp((tip.x * r + tip.y * h) / (r * r + h * h), 0.0, 1.0), 0.0);
  mn = vec2(mn.x * r, h - mn.x * h);
  vec2 d = vec2(length(q - mn) * sign(q.x * h - q.y * r + (q.y - h) * r), q.y - h);
  return max(d.x, d.y);
}

// ── Boolean Ops ──
float opU(float a, float b) { return min(a, b); }
float opSU(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// ── Noise ──
float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float hash3(vec3 p) { return hash(vec2(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)))); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

// ── Campus Scene SDF ──
// Material ID: 0=ground, 1=building, 2=tower, 3=tree, 4=path
vec2 mapScene(vec3 p) {
  // Ground
  float ground = p.y + fbm(p.xz * 0.3) * 0.15;
  vec2 res = vec2(ground, 0.0);

  // Clocktower (center)
  vec3 tp = p - vec3(0, 0, -8);
  float tBase = sdBox(tp, vec3(1.3, 4.5, 1.3));
  float tMid = sdBox(tp - vec3(0, 5.5, 0), vec3(1.0, 1.2, 1.0));
  float tSpire = sdCone(tp - vec3(0, 8.0, 0), 0.7, 2.8);
  float tower = opSU(tBase, tMid, 0.3);
  tower = opSU(tower, tSpire, 0.15);
  // Clock face indent
  float clockFace = sdCylinder(tp.xzy - vec3(0, -1.35, 5.5), 0.6, 0.1);
  tower = opU(tower, clockFace);
  if (tower < res.x) res = vec2(tower, 2.0);

  // Library (right)
  vec3 lp = p - vec3(7, 0, -6);
  float libMain = sdBox(lp, vec3(3.5, 2.8, 2.2));
  float libRoof = sdBox(lp - vec3(0, 3.2, 0), vec3(3.8, 0.4, 2.5));
  float lib = opU(libMain, libRoof);
  // Columns
  for (float i = -2.5; i <= 2.5; i += 1.25) {
    float col = sdCylinder(lp - vec3(i, 0, -2.2), 0.18, 2.8);
    lib = opU(lib, col);
  }
  // Steps
  float steps = sdBox(lp - vec3(0, -2.2, -2.8), vec3(3.0, 0.6, 0.8));
  lib = opU(lib, steps);
  if (lib < res.x) res = vec2(lib, 1.0);

  // Student Center (left)
  vec3 sp = p - vec3(-6.5, 0, -5);
  float sc = sdRoundBox(sp, vec3(2.8, 2.0, 1.8), 0.25);
  float scRoof = sdBox(sp - vec3(0, 2.3, 0), vec3(3.2, 0.25, 2.2));
  float scWing = sdRoundBox(sp - vec3(-2.5, -0.3, 0), vec3(1.2, 1.7, 1.5), 0.15);
  sc = opU(sc, opU(scRoof, scWing));
  if (sc < res.x) res = vec2(sc, 1.0);

  // Trees
  float trees = 1e5;
  vec3 treePos[6];
  treePos[0] = vec3(3.5, 0, -4);
  treePos[1] = vec3(-3, 0, -3);
  treePos[2] = vec3(-5, 0, -10);
  treePos[3] = vec3(5, 0, -11);
  treePos[4] = vec3(10, 0, -3);
  treePos[5] = vec3(-9, 0, -8);
  for (int i = 0; i < 6; i++) {
    vec3 tq = p - treePos[i];
    float trunk = sdCylinder(tq - vec3(0, 1.5, 0), 0.15, 1.5);
    float h2 = hash(treePos[i].xz) * 0.6 + 1.2;
    float canopy = sdSphere(tq - vec3(0, 3.0 + h2 * 0.3, 0), h2);
    float canopy2 = sdSphere(tq - vec3(0.3, 3.5, 0.2), h2 * 0.7);
    float tree = opSU(trunk, opSU(canopy, canopy2, 0.5), 0.2);
    trees = opU(trees, tree);
  }
  if (trees < res.x) res = vec2(trees, 3.0);

  // Walkway / path
  float path = sdBox(p - vec3(0, -0.08, -3), vec3(0.6, 0.1, 5.0));
  float path2 = sdBox(p - vec3(3.5, -0.08, -6), vec3(3.5, 0.1, 0.5));
  float paths = opU(path, path2);
  if (paths < res.x) res = vec2(paths, 4.0);

  return res;
}

// ── Normal Calculation ──
vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.002, 0);
  return normalize(vec3(
    mapScene(p + e.xyy).x - mapScene(p - e.xyy).x,
    mapScene(p + e.yxy).x - mapScene(p - e.yxy).x,
    mapScene(p + e.yyx).x - mapScene(p - e.yyx).x
  ));
}

// ── Ambient Occlusion ──
float calcAO(vec3 p, vec3 n) {
  float occ = 0.0, w = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.02 + 0.11 * float(i);
    occ += (h - mapScene(p + h * n).x) * w;
    w *= 0.8;
  }
  return clamp(1.0 - 2.5 * occ, 0.0, 1.0);
}

// ── Soft Shadows ──
float calcShadow(vec3 ro, vec3 rd, float mint, float maxt) {
  float res = 1.0, t = mint, ph = 1e10;
  for (int i = 0; i < 48; i++) {
    float h = mapScene(ro + rd * t).x;
    if (h < 0.001) return 0.0;
    float y = h * h / (2.0 * ph);
    float d = sqrt(max(0.0, h * h - y * y));
    res = min(res, 12.0 * d / max(0.0, t - y));
    ph = h;
    t += clamp(h, 0.02, 0.5);
    if (t > maxt) break;
  }
  return clamp(res, 0.0, 1.0);
}

// ── Time-of-Day Sky ──
vec3 skyColor(vec3 rd, float tod, vec3 sunDir) {
  float sunDot = max(0.0, dot(rd, sunDir));
  float horizon = 1.0 - max(0.0, rd.y);

  vec3 skyTop, skyHor, sunCol;
  float nightMix;

  // Dawn 5-7
  if (tod < 5.0) {
    skyTop = vec3(0.01, 0.01, 0.04);
    skyHor = vec3(0.02, 0.02, 0.06);
    sunCol = vec3(0.8, 0.3, 0.1);
    nightMix = 1.0;
  } else if (tod < 7.0) {
    float t = (tod - 5.0) / 2.0;
    skyTop = mix(vec3(0.01, 0.01, 0.04), vec3(0.15, 0.25, 0.55), t);
    skyHor = mix(vec3(0.02, 0.02, 0.06), vec3(0.7, 0.35, 0.15), t);
    sunCol = vec3(1.0, 0.45, 0.12);
    nightMix = 1.0 - t;
  } else if (tod < 11.0) {
    float t = (tod - 7.0) / 4.0;
    skyTop = mix(vec3(0.15, 0.25, 0.55), vec3(0.28, 0.47, 0.85), t);
    skyHor = mix(vec3(0.7, 0.35, 0.15), vec3(0.6, 0.7, 0.9), t);
    sunCol = mix(vec3(1.0, 0.6, 0.25), vec3(1.0, 0.95, 0.85), t);
    nightMix = 0.0;
  } else if (tod < 16.0) {
    skyTop = vec3(0.28, 0.47, 0.85);
    skyHor = vec3(0.6, 0.7, 0.9);
    sunCol = vec3(1.0, 0.95, 0.85);
    nightMix = 0.0;
  } else if (tod < 19.0) {
    float t = (tod - 16.0) / 3.0;
    skyTop = mix(vec3(0.28, 0.47, 0.85), vec3(0.1, 0.08, 0.22), t);
    skyHor = mix(vec3(0.6, 0.7, 0.9), vec3(0.85, 0.35, 0.1), t);
    sunCol = mix(vec3(1.0, 0.95, 0.85), vec3(1.0, 0.3, 0.05), t);
    nightMix = t * 0.7;
  } else {
    float t = (tod - 19.0) / 5.0;
    skyTop = mix(vec3(0.1, 0.08, 0.22), vec3(0.01, 0.01, 0.04), t);
    skyHor = mix(vec3(0.85, 0.35, 0.1), vec3(0.02, 0.02, 0.06), t);
    sunCol = vec3(0.8, 0.2, 0.05);
    nightMix = 0.7 + t * 0.3;
  }

  vec3 sky = mix(skyHor, skyTop, pow(max(0.0, rd.y), 0.45));

  // Sun disc + glow
  float sunDisc = pow(sunDot, 400.0) * 3.0;
  float sunGlow = pow(sunDot, 8.0) * 0.6;
  sky += sunCol * (sunDisc + sunGlow);

  // Stars at night
  if (nightMix > 0.1 && rd.y > 0.0) {
    float stars = pow(hash(floor(rd.xy * 600.0)), 25.0) * nightMix;
    sky += vec3(stars * 0.9, stars * 0.95, stars);
  }

  return sky;
}

// ── Material Colors ──
vec3 getMaterialColor(float matId, vec3 p, vec3 n, float tod) {
  bool isDaytime = tod > 6.5 && tod < 18.5;
  if (matId < 0.5) {
    // Ground — grass
    float grassNoise = fbm(p.xz * 2.0 + uTime * 0.02) * 0.15;
    vec3 grassGreen = mix(vec3(0.15, 0.35, 0.08), vec3(0.2, 0.45, 0.12), grassNoise + 0.5);
    if (!isDaytime) grassGreen *= 0.25;
    return grassGreen;
  } else if (matId < 1.5) {
    // Building — warm stone/brick
    float brickPattern = step(0.9, fract(p.y * 4.0)) * 0.08;
    vec3 col = mix(vec3(0.65, 0.55, 0.45), vec3(0.7, 0.6, 0.5), brickPattern);
    if (!isDaytime) {
      col *= 0.2;
      // Window glow at night
      vec2 wUV = fract(p.xz * 1.5);
      if (wUV.x > 0.2 && wUV.x < 0.8 && wUV.y > 0.3 && wUV.y < 0.7) {
        float windowOn = step(0.4, hash(floor(p.xz * 1.5)));
        col += vec3(0.9, 0.7, 0.3) * windowOn * 0.6;
      }
    }
    return col;
  } else if (matId < 2.5) {
    // Tower — lighter stone
    vec3 col = vec3(0.75, 0.7, 0.62);
    if (!isDaytime) col *= 0.2;
    return col;
  } else if (matId < 3.5) {
    // Tree
    vec3 col = mix(vec3(0.1, 0.3, 0.05), vec3(0.18, 0.42, 0.1), hash(floor(p.xz)));
    if (n.y > 0.3) col = mix(col, vec3(0.15, 0.4, 0.08), 0.3); // canopy top lighter
    if (!isDaytime) col *= 0.2;
    return col;
  } else {
    // Path — light stone
    float pat = noise(p.xz * 8.0) * 0.08;
    vec3 col = vec3(0.6, 0.58, 0.52) + pat;
    if (!isDaytime) col *= 0.15;
    return col;
  }
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float reveal = smoothstep(0.0, 0.3, uScrollReveal);

  // Sun position from time of day
  float tod = uTimeOfDay;
  float sunAngle = (tod / 24.0) * 6.283185 - 1.5708;
  vec3 sunDir = normalize(vec3(cos(sunAngle) * 0.85, sin(sunAngle), -0.35));

  // Camera — gentle orbit + mouse influence
  float camAngle = uTime * 0.06 + uMouse.x * 0.4;
  float camHeight = 5.5 + uMouse.y * 2.0;
  vec3 ro = vec3(sin(camAngle) * 14.0, camHeight, cos(camAngle) * 14.0 - 4.0);
  vec3 ta = vec3(0, 2.5, -6);
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0, 1, 0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.8 * ww);

  // ── Ray March ──
  float t = 0.0;
  vec2 hit = vec2(100.0, -1.0);
  for (int i = 0; i < 96; i++) {
    vec3 p = ro + rd * t;
    vec2 d = mapScene(p);
    if (d.x < 0.002) { hit = vec2(t, d.y); break; }
    t += d.x * 0.8; // slight understep for stability
    if (t > 80.0) break;
  }

  // ── Sky ──
  vec3 col = skyColor(rd, tod, sunDir);

  if (hit.x < 80.0) {
    vec3 pos = ro + rd * hit.x;
    vec3 nor = calcNormal(pos);

    // Material
    vec3 matCol = getMaterialColor(hit.y, pos, nor, tod);

    // Lighting
    float diff = clamp(dot(nor, sunDir), 0.0, 1.0);
    float amb = 0.15 + 0.1 * nor.y;
    float ao = calcAO(pos, nor);
    float sha = calcShadow(pos + nor * 0.01, sunDir, 0.02, 15.0);

    // Sun color by time
    vec3 sunLight = tod > 6.5 && tod < 18.5
      ? vec3(1.0, 0.95, 0.85)
      : (tod > 5.0 && tod < 7.0 || tod > 17.0 && tod < 19.5)
        ? vec3(1.0, 0.6, 0.3)
        : vec3(0.1, 0.12, 0.2);

    col = matCol * (diff * sha * sunLight + amb * vec3(0.4, 0.45, 0.6)) * ao;

    // Specular on buildings
    if (hit.y > 0.5 && hit.y < 2.5) {
      vec3 ref = reflect(rd, nor);
      float spec = pow(max(0.0, dot(ref, sunDir)), 32.0);
      col += spec * sunLight * 0.15 * sha;
    }

    // Distance fog
    float fogAmt = 1.0 - exp(-hit.x * 0.018);
    vec3 fogCol = skyColor(rd, tod, sunDir) * 0.7;
    col = mix(col, fogCol, fogAmt);
  }

  // ── Procedural grass blades on ground ──
  // Animated simplex-noise wind sway rendered as color striation
  if (hit.y < 0.5 && hit.x < 80.0) {
    vec3 pos2 = ro + rd * hit.x;
    // Blade pattern via high-freq noise
    float bladePattern = noise(pos2.xz * 12.0 + vec2(uTime * 0.8, uTime * 0.3));
    float bladeHeight = noise(pos2.xz * 8.0) * 0.5 + 0.5;
    // Wind sway: simplex-like displacement
    float windX = sin(pos2.x * 0.5 + uTime * 1.5) * 0.3 + noise(pos2.xz * 0.8 + uTime * 0.4) * 0.5;
    float grassShade = smoothstep(0.3, 0.7, bladePattern + windX * 0.2);
    // Lighter tips swaying in wind
    vec3 grassTip = vec3(0.25, 0.55, 0.15);
    vec3 grassBase2 = vec3(0.1, 0.28, 0.05);
    bool isDaytime2 = tod > 6.5 && tod < 18.5;
    if (!isDaytime2) { grassTip *= 0.2; grassBase2 *= 0.2; }
    col = mix(col, mix(grassBase2, grassTip, grassShade), 0.45 * bladeHeight);
    // Add subtle specular on grass tips for photorealism
    if (isDaytime2) {
      float grassSpec = pow(max(0.0, dot(reflect(rd, nor), sunDir)), 16.0) * grassShade * 0.12;
      col += vec3(0.8, 0.9, 0.5) * grassSpec;
    }
  }

  // ── Falling leaves (autumn months / all year for visual drama) ──
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float leafTime = uTime * 0.4 + fi * 5.0;
    vec3 leafPos = vec3(
      sin(fi * 3.7 + leafTime * 0.15) * 8.0 + cos(fi * 2.1) * 3.0,
      8.0 - mod(leafTime * 0.8 + fi * 2.3, 10.0),
      -5.0 + cos(fi * 4.3 + leafTime * 0.1) * 6.0
    );
    // Tumble
    leafPos.x += sin(leafTime * 2.0 + fi) * 0.3;
    vec3 leafDir = normalize(leafPos - ro);
    float leafDot = max(0.0, dot(rd, leafDir));
    float leafGlow = pow(leafDot, 600.0) * 1.8;
    // Autumn colors: gold, orange, red
    vec3 leafCol = mix(vec3(0.9, 0.5, 0.05), vec3(0.8, 0.2, 0.05), hash(vec2(fi, fi * 2.0)));
    col += leafCol * leafGlow;
  }

  // Fireflies at dusk/night
  if (tod < 6.0 || tod > 18.0) {
    float nightStr = tod < 6.0 ? (6.0 - tod) / 6.0 : (tod - 18.0) / 6.0;
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      vec3 fPos = vec3(
        sin(fi * 2.3 + uTime * 0.3) * 6.0,
        1.5 + sin(fi * 1.7 + uTime * 0.5) * 1.0,
        -5.0 + cos(fi * 3.1 + uTime * 0.25) * 5.0
      );
      vec3 fDir = normalize(fPos - ro);
      float fDot = max(0.0, dot(rd, fDir));
      float fGlow = pow(fDot, 800.0) * 2.5;
      float pulse = 0.5 + 0.5 * sin(uTime * 2.0 + fi * 4.0);
      col += vec3(0.6, 0.9, 0.3) * fGlow * pulse * nightStr;
    }
  }

  // Gamma + tone mapping
  col = col / (col + 0.6); // simple Reinhard
  col = pow(col, vec3(0.4545));

  // Film grain
  float grain = (hash(gl_FragCoord.xy + uTime * 100.0) - 0.5) * 0.03;
  col += grain;

  // Reveal transition
  col *= reveal;

  // Subtle vignette
  vec2 vigUV = gl_FragCoord.xy / uRes;
  float vig = 1.0 - length((vigUV - 0.5) * 1.3) * 0.35;
  col *= vig;

  gl_FragColor = vec4(col, 1.0);
}
`

// ── Time-of-Day Labels ──
function getTimeLabel(h) {
  if (h < 6) return 'Night'
  if (h < 8) return 'Dawn'
  if (h < 11) return 'Morning'
  if (h < 14) return 'Midday'
  if (h < 17) return 'Afternoon'
  if (h < 19) return 'Sunset'
  if (h < 21) return 'Dusk'
  return 'Night'
}

function getTimeIcon(h) {
  if (h >= 6 && h < 19) return '☀'
  if (h >= 19 && h < 21) return '🌅'
  return '🌙'
}

export default function LivingCampus() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [timeLabel, setTimeLabel] = useState('')
  const [timeIcon, setTimeIcon] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const now = new Date()
    const hours = now.getHours() + now.getMinutes() / 60
    setTimeLabel(getTimeLabel(hours))
    setTimeIcon(getTimeIcon(hours))

    const dpr = Math.min(1.5, window.devicePixelRatio)
    const isMobile = window.innerWidth < 768
    const resFactor = isMobile ? 0.4 : 0.6 // render at reduced res for perf

    let W = canvas.offsetWidth
    let H = canvas.offsetHeight

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false })
    if (!gl) return

    // Compile
    function mkShader(src, type) {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('LivingCampus shader:', gl.getShaderInfoLog(s))
        gl.deleteShader(s)
        return null
      }
      return s
    }

    const vs = mkShader(VS, gl.VERTEX_SHADER)
    const fs = mkShader(FS, gl.FRAGMENT_SHADER)
    if (!vs || !fs) return

    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('LivingCampus link:', gl.getProgramInfoLog(prog))
      return
    }
    gl.useProgram(prog)

    // Fullscreen quad
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW)
    const pLoc = gl.getAttribLocation(prog, 'position')
    gl.enableVertexAttribArray(pLoc)
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0)

    // Uniforms
    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uMouse = gl.getUniformLocation(prog, 'uMouse')
    const uTOD = gl.getUniformLocation(prog, 'uTimeOfDay')
    const uReveal = gl.getUniformLocation(prog, 'uScrollReveal')

    let mx = 0.5, my = 0.5
    let scrollReveal = 0
    let raf

    const resize = () => {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = Math.floor(W * dpr * resFactor)
      canvas.height = Math.floor(H * dpr * resFactor)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    // Mouse
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect()
      mx = ((e.clientX - r.left) / r.width) * 2 - 1
      my = 1 - ((e.clientY - r.top) / r.height) * 2
    }
    canvas.addEventListener('mousemove', onMove)

    // Device orientation (mobile)
    let gyroX = 0, gyroY = 0
    const onOrient = (e) => {
      if (e.gamma != null) gyroX = e.gamma / 45
      if (e.beta != null) gyroY = (e.beta - 45) / 45
    }
    if (isMobile) window.addEventListener('deviceorientation', onOrient)

    // ScrollTrigger
    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top 80%',
      end: 'bottom 20%',
      scrub: 0.5,
      onUpdate: (self) => { scrollReveal = self.progress },
    })

    // Animation
    const t0 = performance.now()
    function draw() {
      const elapsed = (performance.now() - t0) * 0.001
      const finalMx = isMobile ? gyroX * 0.3 : mx * 0.5
      const finalMy = isMobile ? gyroY * 0.3 : my * 0.3

      gl.uniform1f(uTime, elapsed)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform2f(uMouse, finalMx, finalMy)
      gl.uniform1f(uTOD, hours)
      gl.uniform1f(uReveal, scrollReveal)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      trigger.kill()
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMove)
      if (isMobile) window.removeEventListener('deviceorientation', onOrient)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
    }
  }, [])

  return (
    <section ref={containerRef} className="living-campus-section">
      <canvas ref={canvasRef} className="campus-canvas" />
      <div className="campus-overlay">
        <div className="campus-header">
          <div className="gold-line" style={{ margin: '0 auto 16px' }} />
          <h2 className="campus-title">The Living <em>Campus</em></h2>
          <p className="campus-sub">A real-time view of Albany State — right now, in your time zone.</p>
        </div>
        <div className="campus-time-badge">
          <span className="campus-time-icon">{timeIcon}</span>
          <span className="campus-time-label">{timeLabel} on Campus</span>
        </div>
        <div className="campus-hotspots">
          <div className="campus-hotspot" style={{ top: '38%', left: '48%' }}>
            <div className="hotspot-pulse" />
            <div className="hotspot-card">
              <strong>Holley Clock Tower</strong>
              <span>Heart of campus since 1903</span>
            </div>
          </div>
          <div className="campus-hotspot" style={{ top: '42%', left: '72%' }}>
            <div className="hotspot-pulse" />
            <div className="hotspot-card">
              <strong>James H. Ruffin Library</strong>
              <span>150,000+ volumes & digital resources</span>
            </div>
          </div>
          <div className="campus-hotspot" style={{ top: '45%', left: '25%' }}>
            <div className="hotspot-pulse" />
            <div className="hotspot-card">
              <strong>Student Center</strong>
              <span>Dining, recreation & student life</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
