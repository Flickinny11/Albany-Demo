import { useRef, useMemo, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  ChromaticAberration,
  Noise,
  SSAO,
} from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import * as THREE from 'three'
import GeologicalLayer from './GeologicalLayer'
import DebrisSystem from './DebrisSystem'
import GoldParticleField from './GoldParticleField'

/**
 * Scroll-driven camera that descends through geological layers.
 */
function ExcavationCamera({ cameraY, progress }) {
  useFrame(({ camera }) => {
    // Smooth interpolation toward target Y
    const newY = THREE.MathUtils.lerp(camera.position.y, cameraY, 0.08)
    const newX = Math.sin(progress * Math.PI * 2) * 0.5

    camera.position.set(newX, newY, 5)

    // Camera looks slightly ahead (below) current position
    camera.lookAt(0, newY - 1.5, 0)

    // FOV shifts for dramatic effect during transitions
    const isTransitioning =
      (progress % 0.25) < 0.05 || (progress % 0.25) > 0.2
    const targetFov = isTransitioning ? 62 : 55
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.05)
    camera.updateProjectionMatrix()
  })

  return null
}

/**
 * Scene lighting — warm directional + ambient for geological layers.
 */
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.3} color="#1a1a3a" />
      <directionalLight
        position={[5, 10, 3]}
        intensity={1.2}
        color="#fff5e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-3, 2, 4]} intensity={0.5} color="#D4A843" />
      <pointLight position={[4, -3, 2]} intensity={0.3} color="#0039A6" />
    </>
  )
}

/**
 * A small emissive mesh that acts as the "sun" for GodRays.
 * Positioned above the scene, piercing light through cracks.
 */
function GodRaySun({ sunRef }) {
  return (
    <mesh ref={sunRef} position={[0, 12, -3]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color="#fff8e0" transparent opacity={0.0} />
    </mesh>
  )
}

/**
 * Main R3F scene containing geological layers, physics debris,
 * gold particles, camera, lighting, and post-processing.
 */
export default function ExcavationScene({
  progress,
  excavationState,
  isMobile,
}) {
  const sunRef = useRef()
  const {
    layers,
    cameraY,
    chromaOffset,
    vignetteDarkness,
    bloomIntensity,
    focusDistance,
    goldParticlesActive,
  } = excavationState

  const chromaOffsetVec = useMemo(
    () => new THREE.Vector2(chromaOffset, chromaOffset),
    [chromaOffset]
  )

  return (
    <>
      <ExcavationCamera cameraY={cameraY} progress={progress} />
      <SceneLighting />
      <GodRaySun sunRef={sunRef} />

      <Suspense fallback={null}>
        <Physics
          gravity={[0, -9.81, 0]}
          timeStep={isMobile ? 'vary' : 'vary'}
        >
          {/* Geological layers */}
          {layers.map((layer) => (
            <GeologicalLayer
              key={layer.id}
              depth={layer.layerDepth}
              colors={layer.colors}
              dissolveProgress={layer.dissolveProgress}
              isMobile={isMobile}
            />
          ))}

          {/* Physics debris chunks */}
          <DebrisSystem layers={layers} isMobile={isMobile} />
        </Physics>

        {/* Gold particles — outside Physics (they defy gravity) */}
        {goldParticlesActive && (
          <GoldParticleField progress={progress} isMobile={isMobile} />
        )}
      </Suspense>

      {/* Post-processing pipeline (pmndrs — merged effects, minimal passes) */}
      <EffectComposer multisampling={isMobile ? 0 : 4}>
        {!isMobile && (
          <SSAO
            blendFunction={BlendFunction.MULTIPLY}
            samples={30}
            radius={0.15}
            intensity={15}
          />
        )}

        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.3}
          kernelSize={isMobile ? KernelSize.SMALL : KernelSize.LARGE}
        />

        {!isMobile && (
          <DepthOfField
            focusDistance={focusDistance}
            focalLength={0.05}
            bokehScale={4}
          />
        )}

        <Vignette darkness={vignetteDarkness} offset={0.3} />

        <ChromaticAberration
          offset={chromaOffsetVec}
          blendFunction={BlendFunction.NORMAL}
        />

        <Noise
          opacity={0.03}
          premultiply
          blendFunction={BlendFunction.SOFT_LIGHT}
        />
      </EffectComposer>
    </>
  )
}
