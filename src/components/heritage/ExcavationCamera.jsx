import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { damp, damp3 } from 'maath/easing'

/**
 * Scroll-driven camera with butter-smooth frame-rate-independent movement.
 * Uses maath damp for physically-based spring interpolation.
 *
 * smoothTime 0.4 = slow, cinematic movement (takes ~0.4s to reach target)
 * Lateral drift is very subtle (0.3) for gentle parallax without nausea.
 */
export default function ExcavationCamera({ cameraY, progress, isTransitioning }) {
  const { camera } = useThree()
  const lookTarget = useRef(new THREE.Vector3(0, 2.5, 0))

  useFrame((_, delta) => {
    // Very subtle lateral drift for gentle parallax
    const lateralDrift = Math.sin(progress * Math.PI * 2) * 0.3
    const target = [lateralDrift, cameraY, 6]

    // Slow, cinematic camera follow — 0.4s smoothTime for butter feel
    damp3(camera.position, target, 0.4, delta)

    // Smooth look target with damping
    const lookY = cameraY - 1.5
    damp(lookTarget.current, 'y', lookY, 0.4, delta)
    camera.lookAt(0, lookTarget.current.y, 0)

    // Gentle FOV shift during transitions
    const targetFov = isTransitioning ? 60 : 55
    damp(camera, 'fov', targetFov, 0.5, delta)
    camera.updateProjectionMatrix()
  })

  return null
}
