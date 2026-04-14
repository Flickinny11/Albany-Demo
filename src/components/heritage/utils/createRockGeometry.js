import * as THREE from 'three'
import { createNoise3D } from 'simplex-noise'

// Seeded PRNG for deterministic rock shapes
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

/**
 * Creates an irregular rock-shaped geometry by displacing
 * icosahedron vertices using multi-octave simplex noise.
 * Produces convincing stone fragment shapes — NOT boxes.
 */
export default function createRockGeometry(seed = 42, baseScale = 0.2, detail = 1) {
  const noise3D = createNoise3D(seededRandom(seed))
  const geo = new THREE.IcosahedronGeometry(baseScale, detail)
  const positions = geo.attributes.position

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)

    // Multi-octave displacement for rocky appearance
    let displacement = 0
    displacement += noise3D(x * 8, y * 8, z * 8) * 0.3          // Large rocky bumps
    displacement += noise3D(x * 16, y * 16, z * 16) * 0.12      // Medium craggy detail
    displacement += noise3D(x * 32, y * 32, z * 32) * 0.04      // Fine surface roughness

    // Flatten Y axis for slab-like rock fragments (broken off a layer)
    const squashY = 0.5

    const len = Math.sqrt(x * x + y * y + z * z)
    const nx = len > 0 ? x / len : 0
    const ny = len > 0 ? y / len : 0
    const nz = len > 0 ? z / len : 0

    positions.setXYZ(
      i,
      x + nx * displacement * baseScale,
      (y + ny * displacement * baseScale) * squashY,
      z + nz * displacement * baseScale
    )
  }

  geo.computeVertexNormals()
  geo.computeBoundingSphere()
  return geo
}
