import { useMemo, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
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
 * Scroll-driven camera descending through geological strata.
 */
function ExcavationCamera({ cameraY, progress }) {
  useFrame(({ camera }) => {
    const newY = THREE.MathUtils.lerp(camera.position.y, cameraY, 0.08)
    const newX = Math.sin(progress * Math.PI * 2) * 0.35

    camera.position.set(newX, newY, 6)
    camera.lookAt(0, newY - 1.5, 0)

    const mod = progress % 0.25
    const isTransitioning = mod < 0.05 || mod > 0.2
    const targetFov = isTransitioning ? 58 : 50
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.05)
    camera.updateProjectionMatrix()
  })

  return null
}

/**
 * 3-point lighting for photorealistic stone rendering.
 */
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.1} color="#0a0a1a" />

      {/* Key light — warm directional with shadow camera sized to scene */}
      <directionalLight
        position={[3, 8, 5]}
        intensity={2.0}
        color="#fff0d4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      {/* Fill light — cool blue from the side */}
      <directionalLight position={[-5, 3, -2]} intensity={0.3} color="#6688cc" />

      {/* Rim light — golden accent from below */}
      <pointLight position={[0, -4, -3]} intensity={0.5} color="#D4A843" distance={20} decay={2} />

      {/* Hemisphere for natural sky/ground fill */}
      <hemisphereLight color="#fff8e8" groundColor="#0a0a1a" intensity={0.25} />
    </>
  )
}

/**
 * Main R3F scene: geological layers, Rapier physics debris,
 * gold particles, Environment IBL with Lightformers, and cinematic postprocessing.
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

      {/* Image-Based Lighting with custom Lightformers for studio-quality reflections */}
      <Environment preset="sunset" background={false} environmentIntensity={1.0}>
        {/* Large warm key panel — drives gold highlights on stone */}
        <Lightformer
          form="rect"
          intensity={2.0}
          color="#fff0d4"
          scale={[10, 5]}
          position={[5, 8, -3]}
        />
        {/* Cool fill panel — adds blue accent to shadow side */}
        <Lightformer
          form="rect"
          intensity={0.6}
          color="#6688cc"
          scale={[8, 4]}
          position={[-6, 3, 2]}
        />
        {/* Golden rim ring — warm glow from below */}
        <Lightformer
          form="ring"
          intensity={1.2}
          color="#D4A843"
          scale={[5, 5]}
          position={[0, -3, -4]}
        />
      </Environment>

      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          {/* Geological layers with PBR textures + dissolve */}
          {layers.map((layer) => (
            <GeologicalLayer
              key={layer.id}
              id={layer.id}
              depth={layer.layerDepth}
              dissolveProgress={layer.dissolveProgress}
              isMobile={isMobile}
            />
          ))}

          {/* Irregular rock debris with physics */}
          <DebrisSystem layers={layers} isMobile={isMobile} />
        </Physics>

        {/* Gold dust particles (outside Physics — defy gravity) */}
        {goldParticlesActive && (
          <GoldParticleField progress={progress} isMobile={isMobile} />
        )}
      </Suspense>

      {/* Cinematic postprocessing pipeline (pmndrs — merged effects) */}
      <EffectComposer multisampling={isMobile ? 0 : 4}>
        {/* N8AO — high-quality ambient occlusion for stone crevices */}
        {!isMobile && (
          <N8AO
            aoRadius={0.6}
            intensity={3.0}
            aoSamples={16}
            denoiseSamples={6}
            denoiseRadius={12}
            distanceFalloff={1.2}
            screenSpaceRadius
          />
        )}

        {/* Bloom — selective via luminanceThreshold, mipmapBlur for quality */}
        <Bloom
          intensity={bloomIntensity * 0.5}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.35}
          mipmapBlur
          kernelSize={isMobile ? KernelSize.SMALL : KernelSize.LARGE}
        />

        {/* Depth of Field — cinematic shallow focus between layers */}
        {!isMobile && (
          <DepthOfField
            focusDistance={focusDistance}
            focalLength={0.035}
            bokehScale={3.5}
          />
        )}

        <Vignette darkness={vignetteDarkness} offset={0.25} />

        <ChromaticAberration
          offset={chromaOffsetVec}
          blendFunction={BlendFunction.NORMAL}
        />

        <Noise opacity={0.02} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />

        {/* AGX tonemapping — better highlight rolloff than ACES for stone */}
        <ToneMapping mode={ToneMappingMode.AGX} />
      </EffectComposer>
    </>
  )
}
