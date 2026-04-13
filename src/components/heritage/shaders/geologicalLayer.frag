// Geological layer fragment — photorealistic PBR stone with Cook-Torrance BRDF
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
precision highp float;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying float vDisplacement;

uniform float uTime;
uniform float uDissolveProgress;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform vec3 uAmbientColor;

// Built-in from Three.js
// uniform vec3 cameraPosition; — available automatically

// ─── Simplex 3D Noise ──────────────────────────────────────
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
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
  i = mod289(i);
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
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// ─── FBM ────────────────────────────────────────────────────
float fbm(vec2 p) {
  float v = 0.0, a = 0.5, f = 1.0;
  for (int i = 0; i < 6; i++) {
    v += a * snoise(vec3(p * f, uTime * 0.015));
    f *= 2.1;
    a *= 0.48;
  }
  return v;
}

// ─── Domain Warping — organic marble/stone patterns ─────────
float domainWarp(vec2 p) {
  vec2 q = vec2(fbm(p + vec2(0.0, 0.0)), fbm(p + vec2(5.2, 1.3)));
  vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2)), fbm(p + 4.0 * q + vec2(8.3, 2.8)));
  return fbm(p + 4.0 * r);
}

// ─── PBR Functions ──────────────────────────────────────────
const float PI = 3.14159265359;

// GGX/Trowbridge-Reitz Normal Distribution
float distributionGGX(float NdotH, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float denom = NdotH * NdotH * (a2 - 1.0) + 1.0;
  return a2 / (PI * denom * denom);
}

// Schlick-GGX Geometry function
float geometrySchlickGGX(float NdotV, float roughness) {
  float r = roughness + 1.0;
  float k = (r * r) / 8.0;
  return NdotV / (NdotV * (1.0 - k) + k);
}

float geometrySmith(float NdotV, float NdotL, float roughness) {
  return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

// Schlick Fresnel
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

void main() {
  vec2 uv = vUv;

  // ─── Geological texture (domain-warped FBM) ──────────────
  float pattern = domainWarp(uv * 3.0);

  // Multi-layer color mixing for realistic stone
  vec3 baseColor = mix(uColorA, uColorB, smoothstep(-0.3, 0.7, pattern));
  baseColor = mix(baseColor, uColorC, smoothstep(0.4, 0.95, pattern) * 0.35);

  // Veining: thin bright mineral lines through the stone
  float vein = smoothstep(0.015, 0.0, abs(pattern - 0.3));
  float vein2 = smoothstep(0.01, 0.0, abs(pattern - 0.6)) * 0.5;
  baseColor = mix(baseColor, uColorC * 1.2, vein * 0.5 + vein2 * 0.3);

  // Micro-detail: fine grain texture overlay
  float microNoise = snoise(vec3(uv * 40.0, uTime * 0.005)) * 0.04;
  float grain = snoise(vec3(uv * 80.0, uTime * 0.003)) * 0.02;
  baseColor += microNoise + grain;

  // Subtle mineral sparkle in highlights
  float sparkle = pow(max(snoise(vec3(uv * 100.0, uTime * 0.02)), 0.0), 12.0) * 0.15;
  baseColor += vec3(sparkle) * uColorC;

  // ─── Normal perturbation from height field (dFdx/dFdy) ───
  float bumpStrength = 3.5;
  float dhdx = dFdx(pattern + vDisplacement * 2.0);
  float dhdy = dFdy(pattern + vDisplacement * 2.0);
  vec3 bumpNormal = normalize(vec3(-dhdx * bumpStrength, -dhdy * bumpStrength, 1.0));

  // Tangent frame from world position derivatives
  vec3 worldNormal = normalize(vNormal);
  vec3 T = normalize(dFdx(vWorldPosition));
  vec3 B = normalize(cross(worldNormal, T));
  mat3 TBN = mat3(T, B, worldNormal);
  vec3 N = normalize(TBN * bumpNormal);

  // ─── PBR Lighting (Cook-Torrance BRDF) ────────────────────
  vec3 V = normalize(cameraPosition - vWorldPosition);
  vec3 L = normalize(uLightDir);
  vec3 H = normalize(V + L);

  // Vary roughness with texture — crevices are rougher
  float roughness = 0.72 + pattern * 0.18;
  float metalness = 0.02; // Stone is dielectric

  vec3 F0 = mix(vec3(0.04), baseColor, metalness);

  float NdotV = max(dot(N, V), 0.001);
  float NdotL = max(dot(N, L), 0.0);
  float NdotH = max(dot(N, H), 0.0);
  float HdotV = max(dot(H, V), 0.0);

  // Cook-Torrance specular BRDF
  float D = distributionGGX(NdotH, roughness);
  float G = geometrySmith(NdotV, NdotL, roughness);
  vec3 F = fresnelSchlick(HdotV, F0);

  vec3 kD = (vec3(1.0) - F) * (1.0 - metalness);
  vec3 specular = (D * G * F) / (4.0 * NdotV * NdotL + 0.0001);

  // Direct lighting
  vec3 Lo = (kD * baseColor / PI + specular) * uLightColor * NdotL * uLightIntensity;

  // Fill light from below (subtle, blue-tinted)
  vec3 fillL = normalize(vec3(-0.3, -1.0, 0.5));
  float fillNdotL = max(dot(N, fillL), 0.0);
  Lo += baseColor * vec3(0.03, 0.04, 0.08) * fillNdotL * 0.5;

  // ─── Ambient + Occlusion ─────────────────────────────────
  // Crevices (low pattern values) are darker
  float ao = smoothstep(-0.4, 0.6, pattern) * 0.5 + 0.5;
  ao *= smoothstep(-0.3, 0.1, vDisplacement * 5.0) * 0.3 + 0.7;
  vec3 ambient = baseColor * uAmbientColor * ao;

  // ─── Subsurface scattering approximation ─────────────────
  // Light wraps around the surface, making stone look slightly translucent
  float sssWrap = max(dot(N, -L) * 0.4 + 0.3, 0.0);
  vec3 sss = baseColor * uLightColor * sssWrap * 0.06;

  // ─── Fresnel rim lighting ────────────────────────────────
  float fresnel = pow(1.0 - NdotV, 4.0);
  vec3 rim = vec3(0.06, 0.08, 0.14) * fresnel * 1.5;

  // ─── Fake environment reflection ─────────────────────────
  vec3 R = reflect(-V, N);
  // Warm earth tones above, cool shadow below
  vec3 envColor = mix(
    vec3(0.03, 0.02, 0.015),
    vec3(0.25, 0.18, 0.12),
    pow(max(R.y, 0.0), 0.6)
  );
  vec3 envReflection = envColor * fresnel * 0.12 * (1.0 - roughness);

  vec3 finalColor = ambient + Lo + sss + rim + envReflection;

  // ─── Tone mapping (Reinhard) for HDR ─────────────────────
  finalColor = finalColor / (finalColor + vec3(1.0));

  // ─── Dissolve with geological cracking ────────────────────
  float dissolveNoise = fbm(uv * 8.0 + vec2(uTime * 0.08));
  // Add Voronoi-like crack influence for sharper cracks
  float crackNoise = snoise(vec3(uv * 12.0, uTime * 0.05));
  float combinedDissolve = dissolveNoise * 0.7 + abs(crackNoise) * 0.3;

  // Multi-layer edge glow (molten rock at crack boundary)
  float edge1 = smoothstep(uDissolveProgress - 0.12, uDissolveProgress - 0.04, combinedDissolve)
              - smoothstep(uDissolveProgress - 0.04, uDissolveProgress, combinedDissolve);
  float edge2 = smoothstep(uDissolveProgress - 0.06, uDissolveProgress - 0.01, combinedDissolve)
              - smoothstep(uDissolveProgress - 0.01, uDissolveProgress, combinedDissolve);

  // Outer glow: warm orange
  finalColor += vec3(0.9, 0.4, 0.05) * edge1 * 2.5;
  // Inner glow: bright gold-white (molten)
  finalColor += vec3(1.0, 0.8, 0.3) * edge2 * 4.0;

  // Discard dissolved fragments
  if (combinedDissolve < uDissolveProgress) discard;

  // Edge alpha for smooth fadeout
  float edgeAlpha = smoothstep(uDissolveProgress, uDissolveProgress + 0.03, combinedDissolve);

  gl_FragColor = vec4(finalColor, edgeAlpha);
}
