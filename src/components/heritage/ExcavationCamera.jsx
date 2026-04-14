import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { damp, damp3 } from 'maath/easing'

/**
 * Scroll-driven camera with frame-rate-independent smoothing via maath damp.
 * Descends through geological strata as user scrolls.
 *
 * maath API (confirmed via research):
 * - damp(object, prop, target, smoothTime, delta) — modifies object[prop] in place
 * - damp3(vector3, target, smoothTime, delta) — modifies vector3.xyz in place
 * - smoothTime: smaller = snappier, larger = more sluggish (0.25 is ~0.25s to target)
 */
export default function ExcavationCamera({ cameraY, progress, isTransitioning }) {
  const { camera } = useThree()
  const lookTarget = useRef(new THREE.Vector3(0, 2.5, 0))

  useFrame((_, delta) => {
    // Lateral drift adds subtle parallax
    const lateralDrift = Math.sin(progress * Math.PI * 2) * 0.5
    const target = [lateralDrift, cameraY, 5]

    // Frame-rate-independent smooth camera follow
    damp3(camera.position, target, 0.25, delta)

    // Smooth look target
    lookTarget.current.set(0, cameraY - 1.5, 0)
    camera.lookAt(lookTarget.current)

    // FOV drama during transitions
    const targetFov = isTransitioning ? 62 : 55
    damp(camera, 'fov', targetFov, 0.2, delta)
    camera.updateProjectionMatrix()
  })

  return null
}
