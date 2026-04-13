// Gold dust particle vertex shader — instanced rendering
precision highp float;

varying float vAlpha;
varying vec3 vViewPos;

uniform float uIntensity;

void main() {
  // instanceMatrix is injected by Three.js for InstancedMesh
  vec4 worldPos = instanceMatrix * vec4(position, 1.0);
  vec4 mvPosition = modelViewMatrix * worldPos;

  vViewPos = mvPosition.xyz;

  // Distance-based alpha fade
  float dist = length(mvPosition.xyz);
  vAlpha = smoothstep(20.0, 5.0, dist) * uIntensity;

  gl_Position = projectionMatrix * mvPosition;
}
