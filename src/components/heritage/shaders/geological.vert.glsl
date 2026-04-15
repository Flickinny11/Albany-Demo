// CSM vertex shader — pass UV to fragment for dissolve
// Minimal — let displacement map handle surface geometry

uniform float uDissolveProgress;
uniform float uLayerSeed;

varying vec2 vUv2;

void main() {
  vUv2 = uv;
  csm_Position = position;
}
