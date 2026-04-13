// Geological layer vertex shader — displacement + UV pass-through
precision highp float;

varying vec2 vUv;
varying vec3 vNormal;

uniform float uTime;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  // Subtle vertex displacement for surface roughness
  vec3 pos = position;
  float displacement = sin(pos.x * 4.0 + uTime * 0.3) * cos(pos.z * 3.0 + uTime * 0.2) * 0.02;
  pos.y += displacement;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
