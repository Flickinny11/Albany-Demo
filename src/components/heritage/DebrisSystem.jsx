import { useMemo } from 'react'
import { InstancedRigidBodies, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'

// Seeded pseudo-random for deterministic debris generation
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateDebrisInstances(count, layerY, id) {
  const rand = seededRandom(id.charCodeAt(0) * 1000 + count)
  return Array.from({ length: count }, (_, i) => ({
    key: `debris-${id}-${i}`,
    position: [
      (rand() - 0.5) * 12,
      layerY + rand() * 0.3,
      (rand() - 0.5) * 4,
    ],
    rotation: [
      rand() * Math.PI,
      rand() * Math.PI,
      rand() * Math.PI,
    ],
  }))
}

/**
 * Physics-driven debris chunks that fall when a geological layer dissolves.
 * Uses Rapier WASM rigid bodies with InstancedMesh for performance.
 */
export default function DebrisSystem({ layers, isMobile }) {
  return (
    <>
      {layers.map((layer) => (
        <DebrisField
          key={layer.id}
          layerY={layer.layerDepth}
          color={new THREE.Color(...layer.colors.a)}
          active={layer.debrisActive}
          count={isMobile ? 15 : 40}
          id={layer.id}
        />
      ))}
      {/* Floor collider to catch fallen debris */}
      <CuboidCollider position={[0, -15, 0]} args={[50, 0.5, 50]} />
    </>
  )
}

function DebrisField({ count, layerY, color, active, id }) {
  const instances = useMemo(
    () => generateDebrisInstances(count, layerY, id),
    [count, layerY, id]
  )

  if (!active) return null

  return (
    <InstancedRigidBodies
      instances={instances}
      colliders="cuboid"
      restitution={0.2}
      friction={0.8}
      linearDamping={0.1}
      angularDamping={0.3}
    >
      <instancedMesh args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[0.35, 0.15, 0.25]} />
        <meshStandardMaterial
          color={color}
          roughness={0.9}
          metalness={0.05}
          envMapIntensity={0.3}
        />
      </instancedMesh>
    </InstancedRigidBodies>
  )
}
