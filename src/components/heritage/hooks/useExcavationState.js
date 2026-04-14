import { useMemo } from 'react'

/**
 * Era definitions with scroll ranges, colors, and camera positions.
 */
const ERAS = [
  {
    id: 'header',
    label: '123 Years',
    range: [0.0, 0.08],
    cameraY: 4.0,
    colors: null,
  },
  {
    id: '1903',
    label: 'The Founding',
    title: 'Where It All Began',
    text: 'In 1903, Joseph Winthrop Holley founded the Albany Bible and Manual Training Institute with a bold vision: to uplift a community through education. With just a handful of students and boundless determination, a legacy was born in the heart of Southwest Georgia.',
    range: [0.08, 0.30],
    cameraY: 1.0,
    layerDepth: 0,
    dissolveRange: [0.08, 0.30],
    textRange: [0.12, 0.30],
    // CSM shader colors (vec3 hex → THREE.Color in component)
    shaderColors: {
      a: '#8B4513', // Primary stone color — terra cotta
      b: '#A0522D', // Vein color
      c: '#D4A843', // Highlight/accent
    },
    debrisColor: '#8B4513',
    layerSeed: 1.0,
    img: 'https://www.asurams.edu/images/ou_images/College-of-Arts-and-Sciences.jpg',
  },
  {
    id: '1943',
    label: 'Growth & Purpose',
    title: 'A Growing Legacy',
    text: 'Renamed Albany State College in 1943, the institution expanded rapidly — new degree programs, a thriving campus, and an unshakable commitment to producing leaders. Generations of educators, scientists, and public servants found their calling here.',
    range: [0.30, 0.55],
    cameraY: -1.0,
    layerDepth: -2.5,
    dissolveRange: [0.30, 0.55],
    textRange: [0.35, 0.55],
    shaderColors: {
      a: '#C8912E', // Amber sandstone
      b: '#DAA520',
      c: '#FFD700',
    },
    debrisColor: '#C8912E',
    layerSeed: 2.0,
    img: 'https://www.asurams.edu/images/ou_images/College-of-Professional-Studies.jpg',
  },
  {
    id: '1960s',
    label: 'Voices of Change',
    title: 'Standing for Justice',
    text: "During the Albany Movement of the 1960s, students and faculty stood at the forefront of the Civil Rights struggle. Their courage helped reshape a nation. That spirit of activism and social responsibility remains woven into Albany State's DNA.",
    range: [0.55, 0.78],
    cameraY: -3.0,
    layerDepth: -5.0,
    dissolveRange: [0.55, 0.78],
    textRange: [0.60, 0.78],
    shaderColors: {
      a: '#2F4F4F', // Dark slate
      b: '#36454F',
      c: '#708090',
    },
    debrisColor: '#36454F',
    layerSeed: 3.0,
    img: 'https://www.asurams.edu/images/ou_images/Darton-College-of-Health-Professions.jpg',
  },
  {
    id: 'today',
    label: 'Shaping Tomorrow',
    title: 'A New Chapter',
    text: 'Today, Albany State University stands as a nationally recognized HBCU — offering 80+ degree programs, groundbreaking research, and a campus community that feels like family. The next 123 years begin with you.',
    range: [0.78, 1.0],
    cameraY: -6.0,
    layerDepth: -7.5,
    dissolveRange: [0.78, 1.0],
    textRange: [0.82, 1.0],
    shaderColors: {
      a: '#D4A843', // Pure gold
      b: '#FFD700',
      c: '#FFFACD',
    },
    debrisColor: '#D4A843',
    layerSeed: 4.0,
    img: 'https://www.asurams.edu/images/graduate%20photo%205.jpg',
  },
]

// Surface layer (gold topsoil) — the first layer that crumbles
const SURFACE_LAYER = {
  id: 'surface',
  layerDepth: 2.0,
  dissolveRange: [0.0, 0.12],
  shaderColors: {
    a: '#8B7355',
    b: '#D4A843',
    c: '#FFD700',
  },
  debrisColor: '#8B7355',
  layerSeed: 0.0,
}

function smoothStep(t) {
  t = Math.max(0, Math.min(1, t))
  return t * t * (3 - 2 * t)
}

/**
 * Derives the current excavation state from scroll progress.
 * Returns active era, layer dissolve values, camera target, etc.
 */
export default function useExcavationState(progress) {
  return useMemo(() => {
    const activeEra =
      ERAS.find((era) => progress >= era.range[0] && progress <= era.range[1]) ||
      ERAS[0]

    // Compute dissolve for surface layer
    const surfaceDissolve = Math.max(
      0,
      Math.min(1, (progress - SURFACE_LAYER.dissolveRange[0]) / (SURFACE_LAYER.dissolveRange[1] - SURFACE_LAYER.dissolveRange[0]))
    )

    // Compute dissolve progress for each geological era layer
    const eraLayers = ERAS.filter((e) => e.dissolveRange && e.layerDepth !== undefined).map((era) => {
      const [start, end] = era.dissolveRange
      const dissolve = Math.max(0, Math.min(1, (progress - start) / (end - start)))
      return {
        ...era,
        dissolveProgress: dissolve,
        debrisActive: dissolve > 0.15 && dissolve < 0.95,
      }
    })

    // Add surface layer
    const layers = [
      {
        ...SURFACE_LAYER,
        dissolveProgress: surfaceDissolve,
        debrisActive: surfaceDissolve > 0.15 && surfaceDissolve < 0.95,
      },
      ...eraLayers,
    ]

    // Camera Y — interpolate smoothly between era positions
    let cameraY = 4.0
    if (progress <= 0.08) {
      cameraY = 4.0
    } else if (progress <= 0.12) {
      const t = (progress - 0.08) / 0.04
      cameraY = 4.0 + (1.0 - 4.0) * smoothStep(t)
    } else if (progress <= 0.30) {
      cameraY = 1.0
    } else if (progress <= 0.35) {
      const t = (progress - 0.30) / 0.05
      cameraY = 1.0 + (-1.0 - 1.0) * smoothStep(t)
    } else if (progress <= 0.55) {
      cameraY = -1.0
    } else if (progress <= 0.60) {
      const t = (progress - 0.55) / 0.05
      cameraY = -1.0 + (-3.0 - -1.0) * smoothStep(t)
    } else if (progress <= 0.78) {
      cameraY = -3.0
    } else if (progress <= 0.82) {
      const t = (progress - 0.78) / 0.04
      cameraY = -3.0 + (-6.0 - -3.0) * smoothStep(t)
    } else {
      cameraY = -6.0
    }

    // Post-processing parameters driven by era
    const isTransitioning =
      (progress > 0.08 && progress < 0.12) ||
      (progress > 0.30 && progress < 0.35) ||
      (progress > 0.55 && progress < 0.60) ||
      (progress > 0.78 && progress < 0.82)

    const chromaOffset = isTransitioning ? 0.003 : 0.0008
    const vignetteDarkness = activeEra.id === '1960s' ? 0.7 : 0.4
    const bloomIntensity = activeEra.id === 'today' ? 2.0 : 1.2
    const focusDistance = Math.abs(cameraY) * 0.05 + 0.01

    return {
      activeEra,
      layers,
      cameraY,
      chromaOffset,
      vignetteDarkness,
      bloomIntensity,
      focusDistance,
      isTransitioning,
      goldParticlesActive: progress > 0.75,
    }
  }, [progress])
}

export { ERAS }
