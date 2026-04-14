import { useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// Poly Haven CDN — CC0 textures, CORS enabled
const TEXTURE_SETS = {
  '1903': {
    map: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/red_brick_03/red_brick_03_diff_1k.jpg',
    normalMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/red_brick_03/red_brick_03_nor_gl_1k.jpg',
    roughnessMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/red_brick_03/red_brick_03_rough_1k.jpg',
    aoMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/red_brick_03/red_brick_03_ao_1k.jpg',
    displacementMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/red_brick_03/red_brick_03_disp_1k.jpg',
  },
  '1943': {
    map: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_04/rock_face_04_diff_1k.jpg',
    normalMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_04/rock_face_04_nor_gl_1k.jpg',
    roughnessMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_04/rock_face_04_rough_1k.jpg',
    aoMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_04/rock_face_04_ao_1k.jpg',
    displacementMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_04/rock_face_04_disp_1k.jpg',
  },
  '1960s': {
    map: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/slate_floor/slate_floor_diff_1k.jpg',
    normalMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/slate_floor/slate_floor_nor_gl_1k.jpg',
    roughnessMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/slate_floor/slate_floor_rough_1k.jpg',
    aoMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/slate_floor/slate_floor_ao_1k.jpg',
    displacementMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/slate_floor/slate_floor_disp_1k.jpg',
  },
  today: {
    map: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/marble_01/marble_01_diff_1k.jpg',
    normalMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/marble_01/marble_01_nor_gl_1k.jpg',
    roughnessMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/marble_01/marble_01_rough_1k.jpg',
    aoMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/marble_01/marble_01_ao_1k.jpg',
    displacementMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/marble_01/marble_01_disp_1k.jpg',
  },
}

// Dissolve shader injection code for onBeforeCompile
const DISSOLVE_PREAMBLE = `
  varying vec2 vDissolveCoord;
  uniform float uDissolveProgress;
  uniform float uTime;

  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }
  float dNoise2d(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1,0)), f.x),
               mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), f.x), f.y);
  }
  float dFbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * dNoise2d(p); p *= 2.0; a *= 0.5; }
    return v;
  }
`

const DISSOLVE_LOGIC = `
  // Dissolve noise from UV coordinates
  float dN = dFbm(vDissolveCoord * 8.0 + vec2(uTime * 0.06));
  float dCrack = abs(dNoise2d(vDissolveCoord * 15.0 + uTime * 0.03));
  float dMask = dN * 0.7 + dCrack * 0.3;

  if (dMask < uDissolveProgress) discard;

  // Molten edge glow — multi-layer for realism
  float e1 = smoothstep(uDissolveProgress - 0.1, uDissolveProgress - 0.03, dMask)
           - smoothstep(uDissolveProgress - 0.03, uDissolveProgress, dMask);
  float e2 = smoothstep(uDissolveProgress - 0.05, uDissolveProgress - 0.005, dMask)
           - smoothstep(uDissolveProgress - 0.005, uDissolveProgress, dMask);
  gl_FragColor.rgb += vec3(0.85, 0.35, 0.05) * e1 * 2.0;
  gl_FragColor.rgb += vec3(1.0, 0.75, 0.25) * e2 * 3.5;

  #include <dithering_fragment>
`

/**
 * Geological layer with photorealistic PBR textures from Poly Haven.
 * Uses meshPhysicalMaterial for full IBL + shadow support.
 * onBeforeCompile injects dissolve logic into the standard PBR pipeline.
 */
function LayerMesh({ textureUrls, depth, dissolveProgress, isMobile }) {
  const materialRef = useRef()
  const dissolveRef = useRef({ value: 0 })
  const timeRef = useRef({ value: 0 })

  const textures = useTexture(textureUrls, (loaded) => {
    // Configure texture tiling when textures finish loading
    const texList = Array.isArray(loaded) ? loaded : Object.values(loaded)
    texList.forEach((tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(3, 2)
    })
    if (loaded.map) loaded.map.colorSpace = THREE.SRGBColorSpace
  })

  // Set up onBeforeCompile for dissolve injection
  useLayoutEffect(() => {
    const mat = materialRef.current
    if (!mat) return

    mat.onBeforeCompile = (shader) => {
      // Add custom uniforms
      shader.uniforms.uDissolveProgress = dissolveRef.current
      shader.uniforms.uTime = timeRef.current

      // Vertex: add varying for dissolve UV
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>\nvarying vec2 vDissolveCoord;`
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>\nvDissolveCoord = uv;`
      )

      // Fragment: add noise functions and dissolve logic
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>\n${DISSOLVE_PREAMBLE}`
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        DISSOLVE_LOGIC
      )

      mat.userData.shader = shader
    }

    mat.needsUpdate = true
  }, [])

  useFrame(({ clock }) => {
    dissolveRef.current.value = dissolveProgress
    timeRef.current.value = clock.elapsedTime
  })

  if (dissolveProgress >= 0.99) return null

  return (
    <mesh
      position={[0, depth, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
    >
      <planeGeometry args={[16, 8, isMobile ? 48 : 96, isMobile ? 24 : 48]} />
      <meshPhysicalMaterial
        ref={materialRef}
        {...textures}
        displacementScale={isMobile ? 0.1 : 0.2}
        displacementBias={-0.1}
        roughness={1.0}
        metalness={0.0}
        envMapIntensity={0.8}
        aoMapIntensity={1.3}
        normalScale={new THREE.Vector2(1.5, 1.5)}
        clearcoat={0.08}
        clearcoatRoughness={0.7}
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  )
}

/**
 * Wrapper that maps era ID to texture set and renders the layer.
 */
export default function GeologicalLayer({ id, depth, dissolveProgress, isMobile }) {
  const textureUrls = TEXTURE_SETS[id]
  if (!textureUrls) return null

  return (
    <LayerMesh
      textureUrls={textureUrls}
      depth={depth}
      dissolveProgress={dissolveProgress}
      isMobile={isMobile}
    />
  )
}
