import { useMemo, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  ChromaticAberration,
  Noise,
  N8AO,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import GeologicalLayer from './GeologicalLayer'
import DebrisSystem from './DebrisSystem'
import GoldParticleField from './GoldParticleField'

/**
 * Scroll-driven camera that descends through geological layers.
 */
function ExcavationCamera({ cameraY, progress }) {
  useFrame(({ camera }) => {
    const newY = THREE.MathUtils.lerp(camera.position.y, cameraY, 0.08)
    const newX = Math.sin(progress * Math.PI * 2) * 0.4

    camera.position.set(newX, newY, 6)
    camera.lookAt(0, newY - 1.5, 0)

    // FOV shifts for dramatic effect during transitions
    const mod = progress % 0.25
    const isTransitioning = mod < 0.05 || mod > 0.2
    const targetFov = isTransitioning ? 60 : 52
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.05)
    camera.updateProjectionMatrix()
  })

  return null
}

/**
 * Scene lighting — 3-point lighting for photorealism:
 * key light (warm directional), fill light (cool), rim light.
 */
function SceneLighting() {
  return (
    <>
      {/* Ambient base — very subtle to keep shadows dark */}
      <ambientLight intensity={0.15} color="#1a1a3a" />

      {/* Key light — warm directional with proper shadow camera */}
      <directionalLight
        position={[3, 8, 5]}
        intensity={2.5}
        color="#fff0d4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-bias={-0.0005}
      />

      {/* Fill light — cool blue from the side */}
      <directionalLight
        position={[-5, 3, -2]}
        intensity={0.4}
        color="#6688cc"
      />

      {/* Rim light — golden accent from behind/below */}
      <pointLight position={[0, -4, -3]} intensity={0.6} color="#D4A843" distance={20} decay={2} />

      {/* Subtle overhead fill for geological detail visibility */}
      <hemisphereLight
        color="#fff8e8"
        groundColor="#0a0a1a"
        intensity={0.3}
      />
    </>
  )
}

/**
 * Main R3F scene containing geological layers, physics debris,
 * gold particles, camera, IBL environment, lighting, and post-processing.
 */
export default function ExcavationScene({
  progress,
  excavationState,
  isMobile,
}) {
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

      {/* Image-Based Lighting — Environment map for photorealistic reflections */}
      <Environment preset="sunset" background={false} environmentIntensity={0.8} />

      <Suspense fallback={null}>
        <Physics
          gravity={[0, -9.81, 0]}
          timeStep="vary"
        >
          {/* Geological layers with PBR stone shaders */}
          {layers.map((layer) => (
            <GeologicalLayer
              key={layer.id}
              depth={layer.layerDepth}
              colors={layer.colors}
              dissolveProgress={layer.dissolveProgress}
              isMobile={isMobile}
            />
          ))}

          {/* Physics debris chunks with physical materials */}
          <DebrisSystem layers={layers} isMobile={isMobile} />
        </Physics>

        {/* Gold dust particles — outside Physics (they defy gravity) */}
        {goldParticlesActive && (
          <GoldParticleField progress={progress} isMobile={isMobile} />
        )}
      </Suspense>

      {/* Post-processing pipeline (pmndrs — merged effects for performance) */}
      <EffectComposer multisampling={isMobile ? 0 : 4}>
        {/* N8AO — better quality ambient occlusion than SSAO */}
        {!isMobile && (
          <N8AO
            aoRadius={0.5}
            intensity={2.5}
            aoSamples={16}
            denoiseSamples={4}
            denoiseRadius={12}
            distanceFalloff={1.0}
            screenSpaceRadius
          />
        )}

        {/* Bloom — subtle natural glow, not blown-out */}
        <Bloom
          intensity={bloomIntensity * 0.5}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.4}
          mipmapBlur
          kernelSize={isMobile ? KernelSize.SMALL : KernelSize.LARGE}
        />

        {/* Depth of Field — cinematic shallow focus */}
        {!isMobile && (
          <DepthOfField
            focusDistance={focusDistance}
            focalLength={0.04}
            bokehScale={3}
          />
        )}

        {/* Vignette — cinematic framing */}
        <Vignette darkness={vignetteDarkness} offset={0.3} />

        {/* Chromatic Aberration — subtle, spikes during transitions */}
        <ChromaticAberration
          offset={chromaOffsetVec}
          blendFunction={BlendFunction.NORMAL}
        />

        {/* Film grain — subtle texture for cinematic quality */}
        <Noise
          opacity={0.025}
          premultiply
          blendFunction={BlendFunction.SOFT_LIGHT}
        />

        {/* ACES Filmic tone mapping for natural HDR rendering */}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}
