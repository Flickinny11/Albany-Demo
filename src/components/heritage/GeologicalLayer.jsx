import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material'
import geologicalVertShader from './shaders/geological.vert.glsl?raw'
import geologicalFragShader from './shaders/geological.frag.glsl?raw'

/**
 * Full 2k PBR texture sets from Poly Haven CDN (CC0, CORS-enabled).
 * Each set: diffuse, normal (OpenGL), roughness, AO, displacement
 * These are PHOTOGRAPHIC scans of real materials — they provide the photorealism.
 */
const PBR_SETS = {
  surface: {
    diff: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/brown_mud_leaves_01/brown_mud_leaves_01_diff_2k.jpg',
    nor: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/brown_mud_leaves_01/brown_mud_leaves_01_nor_gl_2k.jpg',
    rough: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/brown_mud_leaves_01/brown_mud_leaves_01_rough_2k.jpg',
    ao: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/brown_mud_leaves_01/brown_mud_leaves_01_ao_2k.jpg',
    disp: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/brown_mud_leaves_01/brown_mud_leaves_01_disp_2k.jpg',
  },
  '1903': {
    diff: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/red_brick_03/red_brick_03_diff_2k.jpg',
    nor: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/red_brick_03/red_brick_03_nor_gl_2k.jpg',
    rough: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/red_brick_03/red_brick_03_rough_2k.jpg',
    ao: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/red_brick_03/red_brick_03_ao_2k.jpg',
    disp: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/red_brick_03/red_brick_03_disp_2k.jpg',
  },
  '1943': {
    diff: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/rock_face_04/rock_face_04_diff_2k.jpg',
    nor: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/rock_face_04/rock_face_04_nor_gl_2k.jpg',
    rough: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/rock_face_04/rock_face_04_rough_2k.jpg',
    ao: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/rock_face_04/rock_face_04_ao_2k.jpg',
    disp: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/rock_face_04/rock_face_04_disp_2k.jpg',
  },
  '1960s': {
    diff: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/slate_floor/slate_floor_diff_2k.jpg',
    nor: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/slate_floor/slate_floor_nor_gl_2k.jpg',
    rough: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/slate_floor/slate_floor_rough_2k.jpg',
    ao: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/slate_floor/slate_floor_ao_2k.jpg',
    disp: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/slate_floor/slate_floor_disp_2k.jpg',
  },
  today: {
    diff: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/marble_01/marble_01_diff_2k.jpg',
    nor: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/marble_01/marble_01_nor_gl_2k.jpg',
    rough: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/marble_01/marble_01_rough_2k.jpg',
    ao: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/marble_01/marble_01_ao_2k.jpg',
    disp: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/marble_01/marble_01_disp_2k.jpg',
  },
}

/**
 * Non-suspending async texture loader. Loads a full PBR set (5 maps)
 * and returns them as they become available. Scene renders immediately
 * with material defaults; textures enhance progressively.
 */
function usePBRTextures(id, tileX = 3, tileY = 2) {
  const [textures, setTextures] = useState({})
  const loadedRef = useRef({})

  useEffect(() => {
    const set = PBR_SETS[id] || PBR_SETS['1903']
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')

    const mapConfig = [
      { key: 'map', url: set.diff, srgb: true },
      { key: 'normalMap', url: set.nor, srgb: false },
      { key: 'roughnessMap', url: set.rough, srgb: false },
      { key: 'aoMap', url: set.ao, srgb: false },
      { key: 'displacementMap', url: set.disp, srgb: false },
    ]

    const loaded = {}

    mapConfig.forEach(({ key, url, srgb }) => {
      loader.load(
        url,
        (tex) => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping
          tex.repeat.set(tileX, tileY)
          if (srgb) tex.colorSpace = THREE.SRGBColorSpace
          tex.needsUpdate = true
          loaded[key] = tex
          loadedRef.current[key] = tex
          // Update state with all loaded so far
          setTextures((prev) => ({ ...prev, [key]: tex }))
        },
        undefined,
        () => {} // silent fail — material still renders with PBR defaults
      )
    })

    return () => {
      Object.values(loadedRef.current).forEach((t) => {
        if (t && t.dispose) t.dispose()
      })
      loadedRef.current = {}
    }
  }, [id, tileX, tileY])

  return textures
}

/**
 * Geological layer with PHOTOREALISTIC rendering via full PBR texture pipeline.
 *
 * The photorealism comes from:
 * 1. Poly Haven 2k photographic PBR scans (diffuse, normal, roughness, AO, displacement)
 * 2. MeshPhysicalMaterial with clearcoat, IOR, envMap for correct light interaction
 * 3. CSM shader ONLY adds dissolve effect + ember edge glow
 * 4. The shader does NOT override textures — it preserves them
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
  const pbr = usePBRTextures(id)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDissolveProgress: { value: 0 },
      uColorA: { value: new THREE.Color(shaderColors.a) },
      uLayerSeed: { value: layerSeed },
    }),
    [shaderColors, layerSeed]
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
      <planeGeometry args={[16, 8, isMobile ? 64 : 128, isMobile ? 32 : 64]} />
      <CustomShaderMaterial
        ref={materialRef}
        baseMaterial={THREE.MeshPhysicalMaterial}
        vertexShader={geologicalVertShader}
        fragmentShader={geologicalFragShader}
        uniforms={uniforms}
        // === FULL PBR TEXTURE SET — this is where photorealism comes from ===
        map={pbr.map || null}
        normalMap={pbr.normalMap || null}
        roughnessMap={pbr.roughnessMap || null}
        aoMap={pbr.aoMap || null}
        displacementMap={pbr.displacementMap || null}
        // PBR parameters tuned for photorealistic stone
        normalScale={new THREE.Vector2(2.0, 2.0)}
        displacementScale={isMobile ? 0.08 : 0.15}
        displacementBias={isMobile ? -0.04 : -0.075}
        aoMapIntensity={1.3}
        roughness={1.0}
        metalness={0.0}
        envMapIntensity={0.9}
        clearcoat={0.2}
        clearcoatRoughness={0.4}
        ior={1.5}
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  )
}
