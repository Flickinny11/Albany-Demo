import { useMemo } from 'react'
import { InstancedRigidBodies, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import createRockGeometry from './utils/createRockGeometry'

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateDebrisInstances(count, layerY, id) {
  const seedVal = typeof id === 'string' ? id.charCodeAt(0) * 1000 + count : count
  const rand = seededRandom(seedVal)
  return Array.from({ length: count }, (_, i) => ({
    key: `debris-${id}-${i}`,
    position: [
      (rand() - 0.5) * 14,
      layerY + rand() * 0.4,
      (rand() - 0.5) * 3,
    ],
    rotation: [
      rand() * Math.PI,
      rand() * Math.PI,
      rand() * Math.PI,
    ],
  }))
}

/**
 * Physics-driven debris chunks with irregular rock geometry.
 * Uses simplex-noise displaced icosahedrons for realistic stone fragments.
 * MeshPhysicalMaterial with proper PBR stone properties (NOT plastic).
 */
export default function DebrisSystem({ layers, isMobile }) {
  return (
    <>
      {layers.map((layer) => (
        <DebrisField
          key={layer.id}
          layerY={layer.layerDepth}
          color={layer.debrisColor || '#8B4513'}
          active={layer.debrisActive}
          count={isMobile ? 15 : 40}
          id={layer.id}
        />
      ))}
      <CuboidCollider position={[0, -15, 0]} args={[50, 0.5, 50]} />
    </>
  )
}

function DebrisField({ count, layerY, color, active, id }) {
  const instances = useMemo(
    () => generateDebrisInstances(count, layerY, id),
    [count, layerY, id]
  )

  const rockGeo = useMemo(() => {
    const seedVal = typeof id === 'string' ? id.charCodeAt(0) * 137 : 42
    return createRockGeometry(seedVal, 0.2, 1)
  }, [id])

  if (!active) return null

  return (
    <InstancedRigidBodies
      instances={instances}
      colliders="hull"
      restitution={0.15}
      friction={0.85}
      linearDamping={0.1}
      angularDamping={0.3}
    >
      <instancedMesh args={[rockGeo, undefined, count]} castShadow receiveShadow>
        {/* MeshPhysicalMaterial — stone, NOT plastic */}
        <meshPhysicalMaterial
          color={color}
          roughness={0.85}
          metalness={0.05}
          clearcoat={0.1}
          clearcoatRoughness={0.7}
          envMapIntensity={0.3}
        />
      </instancedMesh>
    </InstancedRigidBodies>
  )
}
