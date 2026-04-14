import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { damp, damp3 } from 'maath/easing'

/**
 * Scroll-driven camera with frame-rate-independent smoothing via maath damp.
 * Descends through geological strata as user scrolls.
 */
export default function ExcavationCamera({ cameraY, progress, isTransitioning }) {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3(0, 4, 5))
  const lookTarget = useRef(new THREE.Vector3(0, 2.5, 0))

  useFrame((_, delta) => {
    // Lateral drift adds subtle parallax
    const lateralDrift = Math.sin(progress * Math.PI * 2) * 0.5

    targetPos.current.set(lateralDrift, cameraY, 5)
    lookTarget.current.set(0, cameraY - 1.5, 0)

    // Frame-rate-independent smooth follow (NOT lerp)
    damp3(camera.position, targetPos.current, 0.15, delta)

    // Look slightly ahead
    camera.lookAt(lookTarget.current.x, lookTarget.current.y, lookTarget.current.z)

    // FOV drama during transitions
    const targetFov = isTransitioning ? 62 : 55
    damp(camera, 'fov', targetFov, 0.2, delta)
    camera.updateProjectionMatrix()
  })

  return null
}
