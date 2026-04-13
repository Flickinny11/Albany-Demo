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
    colors: null, // No layer for header
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
    colors: {
      a: [0.42, 0.34, 0.28], // Warm clay-brown — realistic terra cotta stone
      b: [0.55, 0.42, 0.30], // Lighter warm tan veining
      c: [0.78, 0.68, 0.52], // Pale cream-gold mineral highlights
    },
    img: 'https://www.asurams.edu/images/ou_images/College-of-Arts-and-Sciences.jpg',
  },
  {
    id: '1943',
    label: 'Growth & Purpose',
    title: 'A Growing Legacy',
    text: 'Renamed Albany State College in 1943, the institution expanded rapidly — new degree programs, a thriving campus, and an unshakable commitment to producing leaders. Generations of educators, scientists, and public servants found their calling here.',
    range: [0.30, 0.55],
    cameraY: -1.0,
    layerDepth: -2,
    dissolveRange: [0.30, 0.55],
    textRange: [0.35, 0.55],
    colors: {
      a: [0.62, 0.50, 0.36], // Sandy beige — realistic layered sandstone
      b: [0.72, 0.58, 0.40], // Warm tan strata
      c: [0.85, 0.76, 0.58], // Pale gold-cream mineral deposits
    },
    img: 'https://www.asurams.edu/images/ou_images/College-of-Professional-Studies.jpg',
  },
  {
    id: '1960s',
    label: 'Voices of Change',
    title: 'Standing for Justice',
    text: "During the Albany Movement of the 1960s, students and faculty stood at the forefront of the Civil Rights struggle. Their courage helped reshape a nation. That spirit of activism and social responsibility remains woven into Albany State's DNA.",
    range: [0.55, 0.78],
    cameraY: -3.0,
    layerDepth: -4,
    dissolveRange: [0.55, 0.78],
    textRange: [0.60, 0.78],
    colors: {
      a: [0.22, 0.25, 0.30], // Deep blue-gray — realistic dark slate
      b: [0.32, 0.36, 0.42], // Lighter slate veining
      c: [0.48, 0.52, 0.58], // Silver-gray mica flecks
    },
    img: 'https://www.asurams.edu/images/ou_images/Darton-College-of-Health-Professions.jpg',
  },
  {
    id: 'today',
    label: 'Shaping Tomorrow',
    title: 'A New Chapter',
    text: 'Today, Albany State University stands as a nationally recognized HBCU — offering 80+ degree programs, groundbreaking research, and a campus community that feels like family. The next 123 years begin with you.',
    range: [0.78, 1.0],
    cameraY: -6.0,
    layerDepth: -6,
    dissolveRange: [0.78, 1.0],
    textRange: [0.82, 1.0],
    colors: {
      a: [0.50, 0.40, 0.22], // Deep gold-brown — realistic gold-bearing quartz
      b: [0.72, 0.58, 0.30], // Rich gold veining
      c: [0.88, 0.78, 0.48], // Bright gold mineral highlights
    },
    img: 'https://www.asurams.edu/images/graduate%20photo%205.jpg',
  },
]

/**
 * Derives the current excavation state from scroll progress.
 * Returns active era, layer dissolve values, camera target, etc.
 */
export default function useExcavationState(progress) {
  return useMemo(() => {
    // Find the active era
    const activeEra = ERAS.find(
      (era) => progress >= era.range[0] && progress <= era.range[1]
    ) || ERAS[0]

    // Compute dissolve progress for each geological layer (eras 1-4)
    const layers = ERAS.filter((e) => e.dissolveRange).map((era) => {
      const [start, end] = era.dissolveRange
      const dissolve = Math.max(0, Math.min(1, (progress - start) / (end - start)))
      return {
        ...era,
        dissolveProgress: dissolve,
        debrisActive: dissolve > 0.15 && dissolve < 0.95,
      }
    })

    // Camera Y — interpolate smoothly between era positions
    let cameraY = 4.0
    if (progress <= 0.08) {
      cameraY = 4.0
    } else if (progress <= 0.30) {
      const t = (progress - 0.08) / 0.22
      cameraY = 4.0 + (1.0 - 4.0) * smoothStep(t)
    } else if (progress <= 0.55) {
      const t = (progress - 0.30) / 0.25
      cameraY = 1.0 + (-1.0 - 1.0) * smoothStep(t)
    } else if (progress <= 0.78) {
      const t = (progress - 0.55) / 0.23
      cameraY = -1.0 + (-3.0 - -1.0) * smoothStep(t)
    } else {
      const t = (progress - 0.78) / 0.22
      cameraY = -3.0 + (-6.0 - -3.0) * smoothStep(t)
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

    // Focus distance shifts between layers
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

function smoothStep(t) {
  t = Math.max(0, Math.min(1, t))
  return t * t * (3 - 2 * t)
}

export { ERAS }
