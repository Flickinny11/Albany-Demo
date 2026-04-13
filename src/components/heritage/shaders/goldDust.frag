// Gold dust particle fragment shader — soft glow
precision highp float;

varying float vAlpha;
varying vec3 vViewPos;

uniform vec3 uColor;
uniform float uEmissiveIntensity;

void main() {
  // Emissive gold with distance-based alpha
  vec3 glow = uColor * uEmissiveIntensity;
  gl_FragColor = vec4(glow, vAlpha);
}
