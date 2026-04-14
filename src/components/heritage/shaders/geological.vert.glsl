// CSM vertex shader — displacement + scroll-driven cracking
// Runs inside three-custom-shader-material extending MeshPhysicalMaterial
// csm_Position is in OBJECT SPACE — CSM handles projection automatically
// All function names prefixed with geo_ to avoid Three.js internal collisions

uniform float uTime;
uniform float uDissolveProgress;
uniform float uLayerSeed;

varying vec2 vUv2;

float geo_hash31(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float geo_vnoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(mix(geo_hash31(i), geo_hash31(i + vec3(1,0,0)), f.x),
        mix(geo_hash31(i + vec3(0,1,0)), geo_hash31(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(geo_hash31(i + vec3(0,0,1)), geo_hash31(i + vec3(1,0,1)), f.x),
        mix(geo_hash31(i + vec3(0,1,1)), geo_hash31(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
  return n;
}

void main() {
  vUv2 = uv;

  float disp = geo_vnoise3(vec3(uv * 6.0 + uLayerSeed, uTime * 0.01)) * 0.15;
  disp += geo_vnoise3(vec3(uv * 12.0 + uLayerSeed * 2.0, uTime * 0.005)) * 0.05;

  float crackDisp = smoothstep(0.0, 0.3, uDissolveProgress) * 0.1;
  float crackNoise = geo_vnoise3(vec3(uv * 20.0, uLayerSeed + uTime * 0.02));
  crackDisp *= crackNoise;

  vec3 displaced = position;
  displaced.z += disp + crackDisp;

  csm_Position = displaced;
}
