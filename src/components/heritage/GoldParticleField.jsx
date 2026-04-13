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
      (rand() - 0.5) * 16,
      -10 + rand() * 6,
      (rand() - 0.5) * 6
    ),
    velocity: new THREE.Vector3(
      (rand() - 0.5) * 0.2,
      0.4 + rand() * 1.8,
      (rand() - 0.5) * 0.2
    ),
    scale: 0.008 + rand() * 0.025, // Tiny flecks, not blobs
    phase: rand() * Math.PI * 2,
    rotSpeed: (rand() - 0.5) * 2.0, // Each fleck tumbles
  }))
}

/**
 * GPU-instanced gold dust particles that rise upward during the "Today" era.
 * Uses meshPhysicalMaterial with metalness=1 for realistic metallic gold flecks
 * that catch light from the Environment map. Bloom adds subtle natural glow.
 */
export default function GoldParticleField({ progress, isMobile }) {
  const meshRef = useRef()
  const dummy = useRef(new THREE.Object3D()).current
  const count = isMobile ? 400 : 1500

  const intensity = Math.max(0, (progress - 0.75) / 0.25)

  const particles = useMemo(() => generateParticles(count), [count])

  useFrame(({ clock }) => {
    if (!meshRef.current || intensity <= 0) return
    const t = clock.elapsedTime

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const wobbleX = Math.sin(t * 0.8 + p.phase) * 0.25
      const wobbleZ = Math.cos(t * 0.6 + p.phase * 1.3) * 0.15
      const y = p.position.y + p.velocity.y * t * intensity
      const loopedY = ((y % 20) + 20) % 20 - 10

      dummy.position.set(
        p.position.x + wobbleX,
        loopedY,
        p.position.z + wobbleZ
      )
      // Tiny scale — gold dust, not orbs
      dummy.scale.setScalar(p.scale * intensity)
      // Tumbling rotation for sparkle as facets catch light
      dummy.rotation.set(
        t * p.rotSpeed * 0.5,
        t * p.rotSpeed,
        t * p.rotSpeed * 0.3
      )
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (intensity <= 0) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Icosahedron gives more faceted reflections than sphere — looks like real metallic flecks */}
      <icosahedronGeometry args={[1, 0]} />
      <meshPhysicalMaterial
        color="#C9A855"
        metalness={1.0}
        roughness={0.18}
        envMapIntensity={3.0}
        emissive="#8B6914"
        emissiveIntensity={0.5}
        toneMapped={false}
        transparent
        opacity={Math.min(intensity * 1.2, 1.0)}
      />
    </instancedMesh>
  )
}
