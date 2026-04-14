// CSM fragment shader — FBM domain warp + dissolve + ember edge
// Runs inside three-custom-shader-material extending MeshPhysicalMaterial
//
// Available outputs (v6.4.0):
//   csm_DiffuseColor (vec4) — already includes map texture if provided
//   csm_Roughness (float), csm_Metalness (float), csm_Emissive (vec3)
//   csm_FragNormal (vec3, view space) — replaces csm_Bump which was removed
//   csm_AO (float), csm_Clearcoat (float), csm_ClearcoatRoughness (float)
//
// NOTE: csm_Position and csm_UV do NOT exist in fragment shader.
// Use varyings from the vertex shader instead.

uniform float uTime;
uniform float uDissolveProgress;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uLayerSeed;
uniform float uFbmOctaves;

varying vec2 vUv2;
varying vec3 vWorldPos;

// ─── Simplex 3D Noise (Ashima Arts) ────────────────────────────
vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289v4(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289v3(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// ─── FBM with variable octaves ─────────────────────────────────
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  int octaves = int(uFbmOctaves);
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p * frequency + uLayerSeed);
    frequency *= 2.1;
    amplitude *= 0.48;
  }
  return value;
}

// ─── Domain warping — creates realistic marble/geological patterns ──
float domainWarp(vec3 p) {
  vec3 q = vec3(
    fbm(p + vec3(0.0, 0.0, 0.0)),
    fbm(p + vec3(5.2, 1.3, 2.8)),
    fbm(p + vec3(2.1, 7.8, 4.3))
  );
  vec3 r = vec3(
    fbm(p + 4.0 * q + vec3(1.7, 9.2, 3.4)),
    fbm(p + 4.0 * q + vec3(8.3, 2.8, 6.1)),
    fbm(p + 4.0 * q + vec3(4.2, 5.1, 1.8))
  );
  return fbm(p + 4.0 * r);
}

void main() {
  vec2 uv = vUv2;

  // ─── Geological texture via double domain warping ───
  float pattern = domainWarp(vec3(uv * 3.0, uTime * 0.005));
  float pattern2 = domainWarp(vec3(uv * 7.0 + 100.0, uTime * 0.003));

  // ─── Blend procedural color with base PBR texture ───
  // csm_DiffuseColor is initialized to texture(map, vMapUv) * diffuse if map is provided
  // We blend our procedural pattern INTO the existing texture for photorealism
  vec3 proceduralColor = mix(uColorA, uColorB, smoothstep(-0.2, 0.6, pattern));
  proceduralColor = mix(proceduralColor, uColorC, smoothstep(0.5, 0.9, pattern) * 0.35);

  // Veining — thin bright mineral lines
  float vein = smoothstep(0.015, 0.0, abs(pattern - 0.3));
  float vein2 = smoothstep(0.01, 0.0, abs(pattern2 - 0.5));
  proceduralColor = mix(proceduralColor, uColorC * 1.4, vein * 0.5 + vein2 * 0.3);

  // Micro-texture variation (prevents flat look)
  float micro = fbm(vec3(uv * 50.0, 0.0)) * 0.08;
  proceduralColor += micro;

  // Blend procedural with base texture (csm_DiffuseColor already has map if provided)
  // 60% texture + 40% procedural for realistic geological look
  vec3 blendedColor = mix(csm_DiffuseColor.rgb, proceduralColor, 0.4);
  // Add vein highlights on top
  blendedColor = mix(blendedColor, uColorC * 1.4, (vein * 0.3 + vein2 * 0.2));

  // ─── Dissolve system ───
  float dissolveNoise = fbm(vec3(uv * 8.0, uTime * 0.05 + uLayerSeed));
  float dissolveMask = smoothstep(uDissolveProgress - 0.05, uDissolveProgress, dissolveNoise);

  // Ember edge glow at dissolve boundary
  float edgeBand = smoothstep(uDissolveProgress - 0.1, uDissolveProgress - 0.03, dissolveNoise)
                 - smoothstep(uDissolveProgress - 0.03, uDissolveProgress, dissolveNoise);
  vec3 emberColor = vec3(1.0, 0.55, 0.05) * 4.0; // HDR for bloom pickup

  if (dissolveNoise < uDissolveProgress) discard;

  // ─── CSM outputs ───
  csm_DiffuseColor = vec4(blendedColor, dissolveMask);
  csm_Roughness = 0.75 - vein * 0.3;         // Veins are slightly smoother
  csm_Metalness = vein * 0.15;                // Veins have subtle metallic sheen
  csm_Emissive = emberColor * edgeBand;       // Dissolve edges glow (picked up by Bloom)
  csm_AO = 1.0 - pattern * 0.15;             // Procedural ambient occlusion in crevices
}
