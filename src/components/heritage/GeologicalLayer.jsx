import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import geologicalLayerVert from './shaders/geologicalLayer.vert?raw'
import geologicalLayerFrag from './shaders/geologicalLayer.frag?raw'

/**
 * A geological layer slab with FBM domain-warped marble texture.
 * Dissolves based on scroll progress using noise-threshold discard.
 */
export default function GeologicalLayer({ depth, colors, dissolveProgress, isMobile }) {
  const meshRef = useRef()
  const materialRef = useRef()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDissolveProgress: { value: 0 },
      uColorA: { value: new THREE.Color(...colors.a) },
      uColorB: { value: new THREE.Color(...colors.b) },
      uColorC: { value: new THREE.Color(...colors.c) },
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
      ref={meshRef}
      position={[0, depth, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[14, 6, isMobile ? 32 : 64, isMobile ? 16 : 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={geologicalLayerVert}
        fragmentShader={isMobile ? geologicalLayerFrag.replace('i < 6', 'i < 3') : geologicalLayerFrag}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite
      />
    </mesh>
  )
}
