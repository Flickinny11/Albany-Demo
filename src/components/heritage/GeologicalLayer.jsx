import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material'
import geologicalVertShader from './shaders/geological.vert.glsl?raw'
import geologicalFragShader from './shaders/geological.frag.glsl?raw'

// Poly Haven CDN — CC0 PBR texture sets, CORS enabled
// CSM extends these with procedural domain-warped FBM noise
const TEXTURE_SETS = {
  surface: {
    map: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brown_mud_leaves_01/brown_mud_leaves_01_diff_1k.jpg',
    normalMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brown_mud_leaves_01/brown_mud_leaves_01_nor_gl_1k.jpg',
    roughnessMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brown_mud_leaves_01/brown_mud_leaves_01_rough_1k.jpg',
  },
  '1903': {
    map: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/red_brick_03/red_brick_03_diff_1k.jpg',
    normalMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/red_brick_03/red_brick_03_nor_gl_1k.jpg',
    roughnessMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/red_brick_03/red_brick_03_rough_1k.jpg',
  },
  '1943': {
    map: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_04/rock_face_04_diff_1k.jpg',
    normalMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_04/rock_face_04_nor_gl_1k.jpg',
    roughnessMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_04/rock_face_04_rough_1k.jpg',
  },
  '1960s': {
    map: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/slate_floor/slate_floor_diff_1k.jpg',
    normalMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/slate_floor/slate_floor_nor_gl_1k.jpg',
    roughnessMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/slate_floor/slate_floor_rough_1k.jpg',
  },
  today: {
    map: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/marble_01/marble_01_diff_1k.jpg',
    normalMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/marble_01/marble_01_nor_gl_1k.jpg',
    roughnessMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/marble_01/marble_01_rough_1k.jpg',
  },
}

/**
 * Geological layer with PHOTOREALISTIC rendering:
 * - Poly Haven PBR textures (map, normalMap, roughnessMap) as base
 * - three-custom-shader-material extends MeshPhysicalMaterial with custom GLSL
 * - CSM fragment shader blends procedural FBM domain-warped patterns INTO the PBR texture
 * - Retains full PBR lighting, shadows, environment maps, and tone mapping
 * - Dissolve effect with HDR ember edge glow (picked up by Bloom)
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

  const textureUrls = TEXTURE_SETS[id] || TEXTURE_SETS['1903']

  // Load PBR textures — these are passed to the base MeshPhysicalMaterial
  const textures = useTexture(textureUrls, (loaded) => {
    const texList = Array.isArray(loaded) ? loaded : Object.values(loaded)
    texList.forEach((tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(3, 2)
    })
    if (loaded.map) loaded.map.colorSpace = THREE.SRGBColorSpace
  })

  // Memoize uniforms — stable reference prevents CSM material rebuild
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

  // Mutate uniform values per-frame (no material rebuild)
  useFrame(({ clock }) => {
    if (!materialRef.current) return
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
        // PBR textures from Poly Haven — CSM blends procedural patterns on top
        {...textures}
        normalScale={new THREE.Vector2(1.5, 1.5)}
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
