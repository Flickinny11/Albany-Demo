// CSM vertex shader — displacement + scroll-driven cracking
// Runs inside three-custom-shader-material extending MeshPhysicalMaterial
// csm_Position is in OBJECT SPACE — CSM handles projection automatically

uniform float uTime;
uniform float uDissolveProgress;
uniform float uLayerSeed;

varying vec2 vUv2;
varying vec3 vWorldPos;

float hash31(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float vnoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x),
        mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
        mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
  return n;
}

void main() {
  vUv2 = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

  // Vertex displacement for surface roughness
  float disp = vnoise3(vec3(uv * 6.0 + uLayerSeed, uTime * 0.01)) * 0.15;
  disp += vnoise3(vec3(uv * 12.0 + uLayerSeed * 2.0, uTime * 0.005)) * 0.05;

  // Cracking displacement near dissolve edge
  float crackDisp = smoothstep(0.0, 0.3, uDissolveProgress) * 0.1;
  float crackNoise = vnoise3(vec3(uv * 20.0, uLayerSeed + uTime * 0.02));
  crackDisp *= crackNoise;

  vec3 displaced = position;
  displaced.z += disp + crackDisp;

  csm_Position = displaced;
  csm_Normal = normal;
}
