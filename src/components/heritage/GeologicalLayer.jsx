import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material'
import geologicalVertShader from './shaders/geological.vert.glsl?raw'
import geologicalFragShader from './shaders/geological.frag.glsl?raw'

/**
 * Geological layer with procedural FBM domain-warped textures via
 * three-custom-shader-material extending MeshPhysicalMaterial.
 *
 * CSM retains full PBR lighting, environment reflections, shadows,
 * and tone mapping while running custom GLSL for the geological texture.
 */
export default function GeologicalLayer({
  id,
  depth,
  dissolveProgress,
  shaderColors,
  layerSeed,
  isMobile,
}) {
  const materialRef = useRef()
  const dissolveRef = useRef(0)
  const timeRef = useRef(0)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDissolveProgress: { value: 0 },
      uColorA: { value: new THREE.Color(shaderColors.a) },
      uColorB: { value: new THREE.Color(shaderColors.b) },
      uColorC: { value: new THREE.Color(shaderColors.c) },
      uLayerSeed: { value: layerSeed },
      uFbmOctaves: { value: isMobile ? 3.0 : 6.0 },
    }),
    [shaderColors, layerSeed, isMobile]
  )

  useFrame(({ clock }) => {
    if (!materialRef.current) return
    dissolveRef.current = dissolveProgress
    timeRef.current = clock.elapsedTime

    materialRef.current.uniforms.uDissolveProgress.value = dissolveProgress
    materialRef.current.uniforms.uTime.value = clock.elapsedTime
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
      <CustomShaderMaterial
        ref={materialRef}
        baseMaterial={THREE.MeshPhysicalMaterial}
        vertexShader={geologicalVertShader}
        fragmentShader={geologicalFragShader}
        uniforms={uniforms}
        // PBR properties — stone surface
        metalness={0.1}
        roughness={0.85}
        envMapIntensity={0.4}
        clearcoat={0.15}
        clearcoatRoughness={0.6}
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  )
}
