import { useMemo, useState, useEffect } from 'react'
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
import { BlendFunction, ToneMappingMode, KernelSize } from 'postprocessing'
import * as THREE from 'three'

/**
 * Dynamically load LensFlare — it has older peer deps but works at runtime.
 */
function LensFlareWrapper({ enabled, progress, colorGain }) {
  const [LensFlare, setLensFlare] = useState(null)

  useEffect(() => {
    import('@andersonmancini/lens-flare')
      .then((mod) => setLensFlare(() => mod.LensFlare))
      .catch(() => {})
  }, [])

  if (!LensFlare || !enabled) return null

  return (
    <LensFlare
      enabled={true}
      opacity={0.6}
      position={new THREE.Vector3(0, 8, 0)}
      starPoints={6}
      glareSize={0.4}
      flareSize={0.01}
      flareSpeed={0.4}
      colorGain={colorGain}
      anamorphic={false}
      secondaryGhosts={true}
      ghostScale={0.3}
      aditionalStreaks={true}
      animated={true}
    />
  )
}

/**
 * Cinematic post-processing pipeline.
 * N8AO + Bloom + LensFlare + DOF + Vignette + ChromAb + Noise + AgX ToneMapping
 *
 * SSGI from realism-effects is skipped in this build because it requires
 * manual EffectComposer integration (not compatible with R3F's declarative EffectComposer).
 * N8AO provides the ambient occlusion, Bloom provides the glow, and the geological
 * CSM shaders provide the emissive edge lighting for photorealism.
 */
export default function ExcavationPostProcessing({
  progress,
  isMobile,
  bloomIntensity,
  vignetteDarkness,
  chromaOffset,
  focusDistance,
  isTransitioning,
}) {
  const chromaOffsetVec = useMemo(
    () => new THREE.Vector2(chromaOffset, chromaOffset),
    [chromaOffset]
  )

  const n8aoColor = useMemo(() => new THREE.Color('#00174D'), [])
  const lensFlareColorGain = useMemo(() => new THREE.Color('#D4A843'), [])
  const lensFlareEnabled = !isMobile && progress > 0.05 && progress < 0.85

  return (
    <EffectComposer
      multisampling={isMobile ? 4 : 0}
      frameBufferType={THREE.HalfFloatType}
    >
      {/* N8AO — high-quality ambient occlusion with navy-tinted shadows */}
      <N8AO
        aoRadius={0.5}
        intensity={isMobile ? 2 : 3.5}
        color={n8aoColor}
        quality={isMobile ? 'Medium' : 'Ultra'}
        halfRes={isMobile}
        distanceFalloff={1}
      />

      {/* Bloom — selective on gold emissive surfaces via luminanceThreshold */}
      <Bloom
        intensity={isMobile ? 0.8 : bloomIntensity * 0.8}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.3}
        mipmapBlur
        kernelSize={isMobile ? KernelSize.MEDIUM : KernelSize.LARGE}
      />

      {/* Lens Flare — volumetric light through geological cracks */}
      <LensFlareWrapper
        enabled={lensFlareEnabled}
        progress={progress}
        colorGain={lensFlareColorGain}
      />

      {/* Depth of Field — bokeh shift between geological layers */}
      {!isMobile && (
        <DepthOfField
          focusDistance={focusDistance}
          focalLength={0.05}
          bokehScale={4}
        />
      )}

      {/* Vignette — cinematic framing, heavier during 1960s Civil Rights era */}
      <Vignette darkness={vignetteDarkness} offset={0.3} />

      {/* Chromatic Aberration — spikes during era transitions */}
      <ChromaticAberration
        offset={chromaOffsetVec}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Film grain — subtle cinematic texture */}
      <Noise
        opacity={0.03}
        blendFunction={BlendFunction.SOFT_LIGHT}
        premultiply
      />

      {/* Tone Mapping — AgX for photorealistic gold rendering (NOT ACES) */}
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  )
}
