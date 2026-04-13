import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Seeded pseudo-random for deterministic particle generation
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateParticles(count) {
  const rand = seededRandom(42)
  return Array.from({ length: count }, () => ({
    position: new THREE.Vector3(
      (rand() - 0.5) * 15,
      -10 + rand() * 5,
      (rand() - 0.5) * 5
    ),
    velocity: new THREE.Vector3(
      (rand() - 0.5) * 0.3,
      0.5 + rand() * 2, // Upward velocity
      (rand() - 0.5) * 0.3
    ),
    scale: 0.02 + rand() * 0.06,
    phase: rand() * Math.PI * 2,
  }))
}

/**
 * GPU-instanced gold particles that rise upward during the "Today" era.
 * Uses emissive material above luminanceThreshold to trigger Bloom post-processing.
 */
export default function GoldParticleField({ progress, isMobile }) {
  const meshRef = useRef()
  const dummy = useRef(new THREE.Object3D()).current
  const count = isMobile ? 500 : 2000

  // Only active when progress > 0.75 (Today era)
  const intensity = Math.max(0, (progress - 0.75) / 0.25)

  const particles = useMemo(() => generateParticles(count), [count])

  useFrame(({ clock }) => {
    if (!meshRef.current || intensity <= 0) return
    const t = clock.elapsedTime
    const pData = particles

    for (let i = 0; i < pData.length; i++) {
      const p = pData[i]
      // Upward drift with sinusoidal wobble
      const wobbleX = Math.sin(t * 0.8 + p.phase) * 0.3
      const wobbleZ = Math.cos(t * 0.6 + p.phase * 1.3) * 0.2
      const y = p.position.y + p.velocity.y * t * intensity
      const loopedY = ((y % 20) + 20) % 20 - 10 // Loop particles vertically

      dummy.position.set(
        p.position.x + wobbleX,
        loopedY,
        p.position.z + wobbleZ
      )
      dummy.scale.setScalar(p.scale * intensity)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (intensity <= 0) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color="#FFD700"
        emissive="#D4A843"
        emissiveIntensity={2.5} // Above luminanceThreshold → triggers Bloom
        toneMapped={false} // Required for selective bloom
        transparent
        opacity={intensity}
      />
    </instancedMesh>
  )
}
