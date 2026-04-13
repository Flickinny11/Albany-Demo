// curtainsjs fragment shader — displacement + heat distortion image reveal
precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler0;
uniform float uTime;
uniform float uProgress; // 0 = hidden, 1 = fully visible

// ─── Noise helpers ──────────────────────────────────────────
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vTextureCoord;

  // Displacement — pixels shift based on noise as image reveals
  float displaceStrength = (1.0 - uProgress) * 0.08;
  float n = fbm(uv * 4.0 + uTime * 0.005);
  vec2 displacement = vec2(n - 0.5, fbm(uv * 4.0 + 100.0) - 0.5) * displaceStrength;

  // Heat distortion overlay (subtle shimmer)
  float heat = sin(uv.y * 30.0 + uTime * 0.03) * 0.003 * (1.0 - uProgress);

  vec2 finalUV = uv + displacement + vec2(heat, 0.0);
  vec4 color = texture2D(uSampler0, finalUV);

  // Noise-based reveal mask
  float revealNoise = fbm(uv * 6.0);
  float mask = smoothstep(uProgress - 0.1, uProgress + 0.1, revealNoise);

  // Edge glow at reveal boundary
  float edge = smoothstep(0.0, 0.08, abs(revealNoise - uProgress));
  vec3 edgeColor = mix(vec3(0.83, 0.66, 0.26), color.rgb, edge); // Gold edge glow

  // Vignette
  float vig = 1.0 - length((uv - 0.5) * 1.4) * 0.35;
  edgeColor *= vig;

  gl_FragColor = vec4(edgeColor, mask);
}
