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
 * Dynamically load LensFlare to handle peer dep mismatch gracefully.
 *
 * LensFlare API (confirmed via research):
 * - Must be INSIDE <EffectComposer> as a child
 * - position: {x, y, z} object (NOT Vector3 or array)
 * - colorGain: THREE.Color
 * - starBurst: very GPU-intensive, disable on mobile
 * - dirtTextureFile: path to 16:9 lens dirt texture (optional but improves quality)
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
      opacity={0.5}
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
      aditionalStreaks={true}
      animated={true}
      starBurst={!isMobile}
      haloScale={0.5}
      followMouse={false}
    />
  )
}

/**
 * Cinematic post-processing pipeline:
 * N8AO → Bloom → LensFlare → DOF → Vignette → ChromAb → Noise → AgX ToneMapping
 *
 * N8AO provides navy-tinted ambient occlusion for deep stone crevice shadows.
 * Bloom picks up HDR emissive from dissolve edge glow.
 * LensFlare creates volumetric light through geological cracks.
 * AgX tone mapping renders gold colors warm and natural (not ACES which oversaturates).
 * HalfFloatType framebuffers enable the HDR pipeline.
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
  const lensFlareEnabled = !isMobile && progress > 0.05 && progress < 0.85

  return (
    <EffectComposer
      multisampling={4}
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
      <LensFlareWrapper enabled={lensFlareEnabled} isMobile={isMobile} />

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
