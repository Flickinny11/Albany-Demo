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
 * Dynamically load LensFlare — handles peer dep mismatch gracefully.
 * position: {x, y, z} object (NOT Vector3), starBurst disabled on mobile (GPU heavy).
 */
function LensFlareWrapper({ enabled, isMobile }) {
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
      opacity={0.4}
      position={{ x: 0, y: 8, z: -5 }}
      starPoints={6}
      glareSize={0.35}
      flareSize={0.004}
      flareSpeed={0.3}
      flareShape={0.1}
      colorGain={new THREE.Color(0.83, 0.66, 0.26)}
      anamorphic={false}
      secondaryGhosts={true}
      ghostScale={0.15}
      aditionalStreaks={!isMobile}
      animated={true}
      starBurst={false}
      haloScale={0.5}
      followMouse={false}
    />
  )
}

/**
 * Cinematic post-processing pipeline — research-driven values.
 *
 * All values tuned based on extensive research:
 * - N8AO: "Medium" desktop / "Low" mobile, navy-tinted for brand cohesion
 * - Bloom: luminanceThreshold 0.9 for SELECTIVE bloom (only HDR emissive surfaces)
 * - Vignette: offset 0.5, darkness 0.35 (subtle, cinematic framing)
 * - ChromaticAberration: 0.001 (barely perceptible, real lens behavior)
 * - AgX tone mapping for natural warm gold rendering
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
  // Cinematic chromatic aberration — barely visible, spikes during transitions
  const chromaVec = useMemo(() => {
    const v = isTransitioning ? 0.003 : 0.001
    return new THREE.Vector2(v, v)
  }, [isTransitioning])

  const n8aoColor = useMemo(() => new THREE.Color('#00174D'), [])
  const lensFlareEnabled = !isMobile && progress > 0.05 && progress < 0.85

  return (
    <EffectComposer
      multisampling={4}
      frameBufferType={THREE.HalfFloatType}
    >
      {/* N8AO — high-quality ambient occlusion, navy-tinted for ASU brand */}
      <N8AO
        aoRadius={isMobile ? 0.3 : 0.5}
        intensity={isMobile ? 2.5 : 5.0}
        color={n8aoColor}
        quality={isMobile ? 'Low' : 'Medium'}
        halfRes={isMobile}
        distanceFalloff={0.2}
        screenSpaceRadius
      />

      {/* Bloom — SELECTIVE: luminanceThreshold 0.9 = only HDR emissive glows */}
      <Bloom
        intensity={isMobile ? 0.6 : bloomIntensity * 0.6}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.85}
        kernelSize={isMobile ? KernelSize.MEDIUM : KernelSize.LARGE}
      />

      {/* Lens Flare — volumetric light through geological cracks */}
      <LensFlareWrapper enabled={lensFlareEnabled} isMobile={isMobile} />

      {/* Depth of Field — subtle architectural look */}
      {!isMobile && (
        <DepthOfField
          focusDistance={focusDistance}
          focalLength={0.02}
          bokehScale={2}
        />
      )}

      {/* Vignette — subtle cinematic framing */}
      <Vignette
        darkness={vignetteDarkness}
        offset={0.5}
      />

      {/* Chromatic Aberration — barely perceptible, real lens behavior */}
      <ChromaticAberration
        offset={chromaVec}
        blendFunction={BlendFunction.NORMAL}
        radialModulation
        modulationOffset={0.5}
      />

      {/* Film grain — very subtle */}
      <Noise
        opacity={0.025}
        blendFunction={BlendFunction.SOFT_LIGHT}
        premultiply
      />

      {/* AgX — best for warm gold tones without oversaturation */}
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  )
}
