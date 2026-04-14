import { Suspense } from 'react'
import { Physics, CuboidCollider } from '@react-three/rapier'
import GeologicalLayer from './GeologicalLayer'
import DebrisSystem from './DebrisSystem'
import GoldParticleVFX from './GoldParticleVFX'
import ExcavationCamera from './ExcavationCamera'
import ExcavationLighting from './ExcavationLighting'
import ExcavationPostProcessing from './ExcavationPostProcessing'

/**
 * Main R3F scene: geological layers with CSM shaders, Rapier physics debris,
 * three.quarks gold particles, Environment IBL with Lightformers, maath damp camera,
 * and cinematic postprocessing (N8AO + Bloom + LensFlare + DOF + AgX).
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
    isTransitioning,
  } = excavationState

  return (
    <>
      <ExcavationCamera
        cameraY={cameraY}
        progress={progress}
        isTransitioning={isTransitioning}
      />

      <ExcavationLighting />

      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          {/* Geological layers with CSM-extended MeshPhysicalMaterial + FBM domain warping */}
          {layers.map((layer) => (
            <GeologicalLayer
              key={layer.id}
              id={layer.id}
              depth={layer.layerDepth}
              dissolveProgress={layer.dissolveProgress}
              shaderColors={layer.shaderColors}
              layerSeed={layer.layerSeed}
              isMobile={isMobile}
            />
          ))}

          {/* Physics-driven irregular rock debris */}
          <DebrisSystem layers={layers} isMobile={isMobile} />

          {/* Floor collider to catch fallen debris */}
          <CuboidCollider position={[0, -15, 0]} args={[50, 0.5, 50]} />
        </Physics>

        {/* Gold dust particles — three.quarks VFX (outside Physics — defy gravity) */}
        {goldParticlesActive && (
          <GoldParticleVFX progress={progress} isMobile={isMobile} />
        )}
      </Suspense>

      {/* Cinematic postprocessing pipeline */}
      <ExcavationPostProcessing
        progress={progress}
        isMobile={isMobile}
        bloomIntensity={bloomIntensity}
        vignetteDarkness={vignetteDarkness}
        chromaOffset={chromaOffset}
        focusDistance={focusDistance}
        isTransitioning={isTransitioning}
      />
    </>
  )
}
