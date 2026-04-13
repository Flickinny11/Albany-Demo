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
      (rand() - 0.5) * 13,
      layerY + rand() * 0.4,
      (rand() - 0.5) * 5,
    ],
    rotation: [
      rand() * Math.PI,
      rand() * Math.PI,
      rand() * Math.PI,
    ],
  }))
}

// Pre-generate varied chunk sizes per layer
function generateChunkSize(id) {
  const rand = seededRandom(id.charCodeAt(0) * 777)
  return [
    0.2 + rand() * 0.4,  // width: 0.2–0.6
    0.08 + rand() * 0.15, // height: 0.08–0.23
    0.15 + rand() * 0.35, // depth: 0.15–0.5
  ]
}

/**
 * Physics-driven debris chunks that fall when a geological layer dissolves.
 * Uses Rapier WASM rigid bodies with InstancedMesh + meshPhysicalMaterial
 * for photorealistic PBR stone chunks with environment reflections.
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

  const chunkSize = useMemo(() => generateChunkSize(id), [id])

  if (!active) return null

  return (
    <InstancedRigidBodies
      instances={instances}
      colliders="cuboid"
      restitution={0.15}
      friction={0.85}
      linearDamping={0.08}
      angularDamping={0.25}
    >
      <instancedMesh args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry args={chunkSize} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.82}
          metalness={0.02}
          envMapIntensity={0.6}
          clearcoat={0.05}
          clearcoatRoughness={0.8}
        />
      </instancedMesh>
    </InstancedRigidBodies>
  )
}
