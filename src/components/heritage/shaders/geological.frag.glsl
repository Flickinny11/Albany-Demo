// CSM fragment shader — FBM domain warp + dissolve + ember edge
// All function names prefixed with geo_ to avoid Three.js internal shader collisions
// (Three.js defines permute, taylorInvSqrt, etc. in its own chunks)

uniform float uTime;
uniform float uDissolveProgress;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uLayerSeed;
uniform float uFbmOctaves;

varying vec2 vUv2;

// ─── Simplex 3D Noise — all functions prefixed geo_ ────────────
vec3 geo_mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 geo_mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 geo_permute(vec4 x) { return geo_mod289v4(((x * 34.0) + 10.0) * x); }
vec4 geo_taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float geo_snoise(vec3 v) {
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

  i = geo_mod289v3(i);
  vec4 p = geo_permute(geo_permute(geo_permute(
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

  vec4 norm = geo_taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float geo_fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  int octaves = int(uFbmOctaves);
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * geo_snoise(p * frequency + uLayerSeed);
    frequency *= 2.1;
    amplitude *= 0.48;
  }
  return value;
}

float geo_domainWarp(vec3 p) {
  vec3 q = vec3(
    geo_fbm(p + vec3(0.0, 0.0, 0.0)),
    geo_fbm(p + vec3(5.2, 1.3, 2.8)),
    geo_fbm(p + vec3(2.1, 7.8, 4.3))
  );
  vec3 r = vec3(
    geo_fbm(p + 4.0 * q + vec3(1.7, 9.2, 3.4)),
    geo_fbm(p + 4.0 * q + vec3(8.3, 2.8, 6.1)),
    geo_fbm(p + 4.0 * q + vec3(4.2, 5.1, 1.8))
  );
  return geo_fbm(p + 4.0 * r);
}

void main() {
  vec2 uv = vUv2;

  float pattern = geo_domainWarp(vec3(uv * 3.0, uTime * 0.005));
  float pattern2 = geo_domainWarp(vec3(uv * 7.0 + 100.0, uTime * 0.003));

  // Procedural geological color
  vec3 proceduralColor = mix(uColorA, uColorB, smoothstep(-0.2, 0.6, pattern));
  proceduralColor = mix(proceduralColor, uColorC, smoothstep(0.5, 0.9, pattern) * 0.35);

  // Veining — thin bright mineral lines
  float vein = smoothstep(0.015, 0.0, abs(pattern - 0.3));
  float vein2 = smoothstep(0.01, 0.0, abs(pattern2 - 0.5));
  proceduralColor = mix(proceduralColor, uColorC * 1.4, vein * 0.5 + vein2 * 0.3);

  // Micro-texture variation
  float micro = geo_fbm(vec3(uv * 50.0, 0.0)) * 0.08;
  proceduralColor += micro;

  // Blend with base PBR texture (csm_DiffuseColor has map if provided)
  vec3 blendedColor = mix(csm_DiffuseColor.rgb, proceduralColor, 0.4);
  blendedColor = mix(blendedColor, uColorC * 1.4, (vein * 0.3 + vein2 * 0.2));

  // Dissolve
  float dissolveNoise = geo_fbm(vec3(uv * 8.0, uTime * 0.05 + uLayerSeed));

  if (dissolveNoise < uDissolveProgress) discard;

  // Ember edge glow
  float edgeBand = smoothstep(uDissolveProgress - 0.1, uDissolveProgress - 0.03, dissolveNoise)
                 - smoothstep(uDissolveProgress - 0.03, uDissolveProgress, dissolveNoise);
  vec3 emberColor = vec3(1.0, 0.55, 0.05) * 4.0;

  float dissolveMask = smoothstep(uDissolveProgress - 0.05, uDissolveProgress, dissolveNoise);

  csm_DiffuseColor = vec4(blendedColor, dissolveMask);
  csm_Roughness = 0.75 - vein * 0.3;
  csm_Metalness = vein * 0.15;
  csm_Emissive = emberColor * edgeBand;
}
