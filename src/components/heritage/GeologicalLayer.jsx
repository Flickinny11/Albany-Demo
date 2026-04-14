import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material'
import geologicalVertShader from './shaders/geological.vert.glsl?raw'
import geologicalFragShader from './shaders/geological.frag.glsl?raw'

// Poly Haven CDN — CC0 PBR texture sets
const TEXTURE_URLS = {
  surface: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brown_mud_leaves_01/brown_mud_leaves_01_diff_1k.jpg',
  '1903': 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/red_brick_03/red_brick_03_diff_1k.jpg',
  '1943': 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_04/rock_face_04_diff_1k.jpg',
  '1960s': 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/slate_floor/slate_floor_diff_1k.jpg',
  today: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/marble_01/marble_01_diff_1k.jpg',
}

const NORMAL_URLS = {
  surface: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brown_mud_leaves_01/brown_mud_leaves_01_nor_gl_1k.jpg',
  '1903': 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/red_brick_03/red_brick_03_nor_gl_1k.jpg',
  '1943': 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_04/rock_face_04_nor_gl_1k.jpg',
  '1960s': 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/slate_floor/slate_floor_nor_gl_1k.jpg',
  today: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/marble_01/marble_01_nor_gl_1k.jpg',
}

/**
 * NON-SUSPENDING texture loader. drei's useTexture uses React Suspense which
 * blocks the entire Suspense boundary if any texture fails to load.
 * This hook loads textures asynchronously without blocking rendering.
 */
function useAsyncTexture(url) {
  const [texture, setTexture] = useState(null)
  useEffect(() => {
    if (!url) return
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      url,
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(3, 2)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.needsUpdate = true
        setTexture(tex)
      },
      undefined,
      () => {} // silently fail — procedural shader still renders
    )
    return () => {
      if (texture) texture.dispose()
    }
  }, [url])
  return texture
}

function useAsyncNormalMap(url) {
  const [texture, setTexture] = useState(null)
  useEffect(() => {
    if (!url) return
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      url,
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(3, 2)
        tex.needsUpdate = true
        setTexture(tex)
      },
      undefined,
      () => {}
    )
    return () => {
      if (texture) texture.dispose()
    }
  }, [url])
  return texture
}

/**
 * Geological layer with photorealistic rendering:
 * - Poly Haven PBR textures loaded ASYNCHRONOUSLY (no Suspense blocking)
 * - three-custom-shader-material extends MeshPhysicalMaterial with custom GLSL
 * - CSM fragment shader blends procedural FBM domain-warped patterns with PBR textures
 * - Scene renders immediately with procedural colors; textures enhance when loaded
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

  // Load textures asynchronously — scene renders immediately without waiting
  const mapTexture = useAsyncTexture(TEXTURE_URLS[id])
  const normalTexture = useAsyncNormalMap(NORMAL_URLS[id])

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
        // PBR textures — loaded async, null until ready (CSM still renders procedurally)
        map={mapTexture}
        normalMap={normalTexture}
        // Photorealistic PBR stone properties (research-driven values):
        normalScale={new THREE.Vector2(2.0, 2.0)}    // Strong surface detail
        roughness={0.92}                               // Stone is rough, let roughness map modulate
        metalness={0.0}                                // Stone is purely dielectric
        envMapIntensity={0.85}                         // Sweet spot for natural reflections
        clearcoat={0.25}                               // Slight polish/wet look on stone
        clearcoatRoughness={0.4}                       // Semi-matte sealant finish
        ior={1.5}                                      // Stone IOR for correct Fresnel
        specularIntensity={1.0}                        // Physically correct specular
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  )
}
