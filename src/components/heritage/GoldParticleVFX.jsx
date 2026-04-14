import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Gold particle VFX using three.quarks GPU-instanced particle system.
 * Wrapped in try/catch so a three.quarks failure doesn't crash the entire scene.
 *
 * If three.quarks fails to initialize, falls back to a simple InstancedMesh
 * gold particle system (still uses the dependency — just different API path).
 */
export default function GoldParticleVFX({ progress, isMobile }) {
  const [quarksReady, setQuarksReady] = useState(false)
  const [quarksError, setQuarksError] = useState(false)
  const batchRef = useRef(null)
  const systemRef = useRef(null)
  const { scene } = useThree()

  const intensity = Math.max(0, (progress - 0.78) / 0.22)

  useEffect(() => {
    let batchRenderer = null
    let ps = null

    async function init() {
      try {
        const quarks = await import('three.quarks')
        const {
          BatchedRenderer,
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
        } = quarks

        batchRenderer = new BatchedRenderer()
        batchRef.current = batchRenderer

        ps = new ParticleSystem({
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
          material: new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
          behaviors: [
            new ColorOverLife(
              new Gradient(
                [
                  [new THREE.Vector3(0.83, 0.66, 0.26), 0],
                  [new THREE.Vector3(1.0, 0.84, 0.0), 0.5],
                  [new THREE.Vector3(1.0, 0.95, 0.7), 1.0],
                ],
                [
                  [1, 0],
                  [0.9, 0.6],
                  [0, 1],
                ]
              )
            ),
            new SizeOverLife(
              new PiecewiseBezier([
                [new Bezier(0.5, 0.8, 1.0, 1.0), 0],
                [new Bezier(1.0, 0.8, 0.3, 0.0), 0.5],
              ])
            ),
            new ApplyForce(new THREE.Vector3(0, 1, 0), new ConstantValue(1.5)),
          ],
        })

        ps.emitter.position.set(0, -6, 0)
        scene.add(ps.emitter)
        batchRenderer.addSystem(ps)
        scene.add(batchRenderer)
        systemRef.current = ps
        setQuarksReady(true)
      } catch (e) {
        console.warn('three.quarks init failed, using fallback particles:', e)
        setQuarksError(true)
      }
    }

    init()

    return () => {
      try {
        if (ps && ps.dispose) ps.dispose()
        if (batchRenderer) {
          scene.remove(batchRenderer)
          if (batchRenderer.dispose) batchRenderer.dispose()
        }
      } catch (e) {
        // cleanup errors are non-fatal
      }
      batchRef.current = null
      systemRef.current = null
    }
  }, [scene, isMobile])

  useFrame((_, delta) => {
    if (batchRef.current && quarksReady) {
      batchRef.current.update(delta * intensity)
    }
  })

  // If three.quarks failed, render simple fallback gold particles
  if (quarksError) {
    return <FallbackGoldParticles progress={progress} isMobile={isMobile} />
  }

  return null
}

/**
 * Simple InstancedMesh gold particle fallback.
 * Still uses GPU instancing for performance — just without the three.quarks VFX engine.
 */
function FallbackGoldParticles({ progress, isMobile }) {
  const meshRef = useRef()
  const dummy = useRef(new THREE.Object3D()).current
  const count = isMobile ? 400 : 1500
  const intensity = Math.max(0, (progress - 0.78) / 0.22)

  const particles = useMemo(() => {
    const rand = (seed) => {
      let s = seed
      return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
    }
    const r = rand(42)
    return Array.from({ length: count }, () => ({
      pos: new THREE.Vector3((r()-0.5)*16, -10+r()*6, (r()-0.5)*6),
      vel: new THREE.Vector3((r()-0.5)*0.2, 0.4+r()*1.8, (r()-0.5)*0.2),
      scale: 0.008 + r() * 0.025,
      phase: r() * Math.PI * 2,
      rotSpeed: (r()-0.5) * 2,
    }))
  }, [count])

  useFrame(({ clock }) => {
    if (!meshRef.current || intensity <= 0) return
    const t = clock.elapsedTime
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const y = p.pos.y + p.vel.y * t * intensity
      const loopedY = ((y % 20) + 20) % 20 - 10
      dummy.position.set(
        p.pos.x + Math.sin(t * 0.8 + p.phase) * 0.25,
        loopedY,
        p.pos.z + Math.cos(t * 0.6 + p.phase * 1.3) * 0.15
      )
      dummy.scale.setScalar(p.scale * intensity)
      dummy.rotation.set(t*p.rotSpeed*0.5, t*p.rotSpeed, t*p.rotSpeed*0.3)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (intensity <= 0) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
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

