import { useMemo } from 'react'
import { InstancedRigidBodies, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import createRockGeometry from './utils/createRockGeometry'

// Seeded pseudo-random for deterministic debris placement
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
      (rand() - 0.5) * 13,
      layerY + rand() * 0.5,
      (rand() - 0.5) * 5,
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
 * Rapier WASM rigid bodies with ConvexHull colliders for physical accuracy.
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
          count={isMobile ? 12 : 35}
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

  // Irregular rock geometry — NOT boxes
  const rockGeo = useMemo(
    () => createRockGeometry(id.charCodeAt(0) * 137, 0.2, 1),
    [id]
  )

  if (!active) return null

  return (
    <InstancedRigidBodies
      instances={instances}
      colliders="hull"
      restitution={0.15}
      friction={0.9}
      linearDamping={0.25}
      angularDamping={0.35}
    >
      <instancedMesh args={[rockGeo, undefined, count]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={color}
          roughness={0.85}
          metalness={0.0}
          envMapIntensity={0.8}
          clearcoat={0.08}
          clearcoatRoughness={0.7}
        />
      </instancedMesh>
    </InstancedRigidBodies>
  )
}
