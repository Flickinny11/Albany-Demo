import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  BatchedParticleRenderer,
  ParticleSystem,
  SphereEmitter,
  ColorOverLife,
  SizeOverLife,
  RenderMode,
  ConstantValue,
  IntervalValue,
  ConstantColor,
  ColorRange,
  PiecewiseBezier,
  Bezier,
} from 'three.quarks'

/**
 * Gold particle VFX using three.quarks GPU-instanced particle system.
 * Particles rise upward during the "Today" reveal — defying gravity
 * for the "future rising" metaphor.
 */
export default function GoldParticleVFX({ progress, isMobile }) {
  const batchRendererRef = useRef(null)
  const systemRef = useRef(null)
  const { scene } = useThree()
  const intensity = Math.max(0, (progress - 0.78) / 0.22)

  useEffect(() => {
    const batchRenderer = new BatchedParticleRenderer()
    batchRendererRef.current = batchRenderer

    const particleSystem = new ParticleSystem({
      duration: 5,
      looping: true,
      startLife: new IntervalValue(2, 4),
      startSpeed: new IntervalValue(0.5, 2),
      startSize: new IntervalValue(0.02, 0.08),
      startColor: new ColorRange(
        new THREE.Vector4(0.83, 0.66, 0.26, 1),
        new THREE.Vector4(1.0, 0.84, 0.0, 1)
      ),
      emissionOverTime: new ConstantValue(isMobile ? 60 : 200),
      shape: new SphereEmitter({ radius: 6 }),
      renderMode: RenderMode.BillBoard,
      worldSpace: true,
    })

    // Color over lifetime: gold → bright gold → fade out
    particleSystem.addBehavior(
      new ColorOverLife(
        new ColorRange(
          new THREE.Vector4(0.83, 0.66, 0.26, 1),
          new THREE.Vector4(1.0, 0.84, 0.0, 0)
        )
      )
    )

    // Size over lifetime: grow then shrink
    particleSystem.addBehavior(
      new SizeOverLife(
        new PiecewiseBezier([
          [new Bezier(0.5, 0.8, 1.0, 1.0), 0],
          [new Bezier(1.0, 0.8, 0.3, 0.0), 0.5],
        ])
      )
    )

    // Position upward
    particleSystem.emitter.position.set(0, -6, 0)

    batchRenderer.addSystem(particleSystem)
    scene.add(batchRenderer)
    systemRef.current = particleSystem

    return () => {
      scene.remove(batchRenderer)
      batchRenderer.dispose()
      batchRendererRef.current = null
      systemRef.current = null
    }
  }, [scene, isMobile])

  useFrame((_, delta) => {
    if (!batchRendererRef.current) return
    // Scale update speed by intensity so particles only appear during "Today" era
    batchRendererRef.current.update(delta * intensity)
  })

  return null
}
