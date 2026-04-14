import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  BatchedRenderer,         // NOT BatchedParticleRenderer (deprecated)
  ParticleSystem,
  SphereEmitter,
  ConstantValue,
  IntervalValue,
  ConstantColor,
  ColorOverLife,
  SizeOverLife,
  ApplyForce,
  RenderMode,
  Gradient,
  PiecewiseBezier,
  Bezier,
} from 'three.quarks'

/**
 * Gold particle VFX using three.quarks GPU-instanced particle system.
 * Particles rise upward during the "Today" reveal — defying gravity.
 *
 * Key API notes (from research):
 * - BatchedRenderer (not BatchedParticleRenderer which is deprecated)
 * - ColorOverLife requires FunctionColorGenerator (use Gradient, NOT ColorRange)
 * - ParticleSystem requires material property
 * - emitter must be added to scene via scene.add(ps.emitter)
 * - ps.dispose() handles unregistration from BatchedRenderer
 * - Use MeshBasicMaterial (MeshStandardMaterial has texture bugs in v0.17)
 */
export default function GoldParticleVFX({ progress, isMobile }) {
  const batchRef = useRef(null)
  const systemRef = useRef(null)
  const { scene } = useThree()

  const intensity = Math.max(0, (progress - 0.78) / 0.22)

  useEffect(() => {
    const batchRenderer = new BatchedRenderer()
    batchRef.current = batchRenderer

    const ps = new ParticleSystem({
      duration: 5,
      looping: true,
      prewarm: false,
      startLife: new IntervalValue(2, 4),
      startSpeed: new IntervalValue(0.5, 2.0),
      startSize: new IntervalValue(0.02, 0.08),
      startColor: new ConstantColor(new THREE.Vector4(0.83, 0.66, 0.26, 1)),
      emissionOverTime: new ConstantValue(isMobile ? 60 : 200),
      shape: new SphereEmitter({ radius: 6, thickness: 0.3 }),
      worldSpace: true,
      renderMode: RenderMode.BillBoard,
      renderOrder: 10,

      // Material is REQUIRED — use MeshBasicMaterial (MeshStandardMaterial has bugs)
      material: new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),

      behaviors: [
        // ColorOverLife requires FunctionColorGenerator — use Gradient, NOT ColorRange
        new ColorOverLife(
          new Gradient(
            [
              [new THREE.Vector3(0.83, 0.66, 0.26), 0],     // Gold at start
              [new THREE.Vector3(1.0, 0.84, 0.0), 0.5],     // Bright gold at midlife
              [new THREE.Vector3(1.0, 0.95, 0.7), 1.0],     // Pale gold at end
            ],
            [
              [1, 0],       // Fully opaque at start
              [0.9, 0.6],   // Slightly transparent at midlife
              [0, 1],       // Fully transparent at end (fade out)
            ]
          )
        ),
        // SizeOverLife requires FunctionValueGenerator — use PiecewiseBezier
        new SizeOverLife(
          new PiecewiseBezier([
            [new Bezier(0.5, 0.8, 1.0, 1.0), 0],     // Grow in first half
            [new Bezier(1.0, 0.8, 0.3, 0.0), 0.5],   // Shrink in second half
          ])
        ),
        // Upward force — defying gravity for the "future rising" metaphor
        new ApplyForce(new THREE.Vector3(0, 1, 0), new ConstantValue(1.5)),
      ],
    })

    // Position emitter at the bottom of the excavation
    ps.emitter.position.set(0, -6, 0)

    // MUST add emitter to scene (three.quarks requirement)
    scene.add(ps.emitter)
    batchRenderer.addSystem(ps)
    scene.add(batchRenderer)
    systemRef.current = ps

    return () => {
      // ps.dispose() handles: deleteSystem, emitter.dispose, remove from parent
      ps.dispose()
      scene.remove(batchRenderer)
      batchRenderer.dispose()
      batchRef.current = null
      systemRef.current = null
    }
  }, [scene, isMobile])

  useFrame((_, delta) => {
    if (!batchRef.current) return
    // Scale update speed by intensity so particles only appear during "Today" era
    batchRef.current.update(delta * intensity)
  })

  return null
}
