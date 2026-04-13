import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import geologicalLayerVert from './shaders/geologicalLayer.vert?raw'
import geologicalLayerFrag from './shaders/geologicalLayer.frag?raw'

// Light direction (matches the scene directional light)
const LIGHT_DIR = new THREE.Vector3(3, 8, 5).normalize()
const LIGHT_COLOR = new THREE.Color(1.0, 0.95, 0.85)
const AMBIENT_COLOR = new THREE.Color(0.08, 0.06, 0.12)

/**
 * A geological layer slab with photorealistic PBR stone textures.
 * Uses Cook-Torrance BRDF with procedural normal perturbation,
 * domain-warped FBM marble patterns, and noise-based dissolve.
 */
export default function GeologicalLayer({ depth, colors, dissolveProgress, isMobile }) {
  const materialRef = useRef()

  // Mobile: reduce FBM iterations for performance
  const fragShader = useMemo(() => {
    if (isMobile) {
      return geologicalLayerFrag
        .replace('i < 6', 'i < 3')
        .replace('bumpStrength = 3.5', 'bumpStrength = 2.0')
    }
    return geologicalLayerFrag
  }, [isMobile])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDissolveProgress: { value: 0 },
      uColorA: { value: new THREE.Color(...colors.a) },
      uColorB: { value: new THREE.Color(...colors.b) },
      uColorC: { value: new THREE.Color(...colors.c) },
      uLightDir: { value: LIGHT_DIR.clone() },
      uLightColor: { value: LIGHT_COLOR.clone() },
      uLightIntensity: { value: 2.5 },
      uAmbientColor: { value: AMBIENT_COLOR.clone() },
    }),
    [colors.a, colors.b, colors.c]
  )

  useFrame(({ clock }) => {
    if (!materialRef.current) return
    materialRef.current.uniforms.uTime.value = clock.elapsedTime
    materialRef.current.uniforms.uDissolveProgress.value = dissolveProgress
  })

  // Skip rendering if fully dissolved
  if (dissolveProgress >= 0.99) return null

  return (
    <mesh
      position={[0, depth, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
    >
      <planeGeometry args={[16, 8, isMobile ? 48 : 96, isMobile ? 24 : 48]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={geologicalLayerVert}
        fragmentShader={fragShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite
        extensions={{ derivatives: true }}
      />
    </mesh>
  )
}
