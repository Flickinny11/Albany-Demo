// CSM fragment shader — DISSOLVE ONLY
// The photorealism comes from the PBR texture maps (diffuse, normal, roughness, AO).
// This shader ONLY adds: dissolve noise, discard, ember edge glow, and subtle era tinting.
// It does NOT override csm_Roughness or csm_Metalness — those come from texture maps.

uniform float uTime;
uniform float uDissolveProgress;
uniform vec3 uColorA;
uniform float uLayerSeed;

varying vec2 vUv2;

// Simple hash noise — lightweight, no name collisions
float geo_hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float geo_noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(geo_hash(i), geo_hash(i + vec2(1, 0)), f.x),
    mix(geo_hash(i + vec2(0, 1)), geo_hash(i + vec2(1, 1)), f.x),
    f.y
  );
}

float geo_fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * geo_noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv2;

  // ─── Dissolve noise ───
  float dN = geo_fbm(uv * 8.0 + vec2(uLayerSeed));
  float dCrack = abs(geo_noise(uv * 15.0 + uTime * 0.03));
  float dissolveMask = dN * 0.7 + dCrack * 0.3;

  // Discard dissolved fragments
  if (dissolveMask < uDissolveProgress) discard;

  // ─── Ember edge glow at dissolve boundary ───
  float e1 = smoothstep(uDissolveProgress - 0.1, uDissolveProgress - 0.03, dissolveMask)
           - smoothstep(uDissolveProgress - 0.03, uDissolveProgress, dissolveMask);
  float e2 = smoothstep(uDissolveProgress - 0.05, uDissolveProgress - 0.005, dissolveMask)
           - smoothstep(uDissolveProgress - 0.005, uDissolveProgress, dissolveMask);

  // HDR ember colors — picked up by selective Bloom (luminanceThreshold 0.9)
  vec3 emberGlow = vec3(0.85, 0.35, 0.05) * e1 * 2.0
                 + vec3(1.0, 0.75, 0.25) * e2 * 3.5;

  // ─── Very subtle era color tint (5% overlay — preserves texture) ───
  csm_DiffuseColor.rgb = mix(csm_DiffuseColor.rgb, uColorA, 0.05);

  // Alpha fade near dissolve edge
  float alpha = smoothstep(uDissolveProgress, uDissolveProgress + 0.05, dissolveMask);
  csm_DiffuseColor.a = alpha;

  // Ember glow on dissolve edges
  csm_Emissive = emberGlow;
}
