import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Curtains } from 'curtainsjs'
import useScrollProgress from './hooks/useScrollProgress'
import useExcavationState, { ERAS } from './hooks/useExcavationState'
import ExcavationScene from './ExcavationScene'
import EraCard from './EraCard'
import EraImagePlane from './EraImagePlane'
import './HeritageExcavation.scss'

gsap.registerPlugin(ScrollTrigger, SplitText)

/**
 * "Excavation of Legacy" — Heritage section redesign.
 *
 * Scrolling becomes archaeological excavation. A fullscreen 3D scene shows
 * stratified geological layers, each representing an era of ASU history.
 * Rapier WASM physics makes debris crumble. Historical photographs are
 * revealed with curtainsjs displacement shaders. Gold particles rise
 * during the final era.
 *
 * Section is 500vh tall — scroll drives the entire excavation.
 */
export default function HeritageExcavation() {
  const sectionRef = useRef(null)
  const curtainsContainerRef = useRef(null)
  const headerTitleRef = useRef(null)
  const headerSubRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [curtainsInstance, setCurtainsInstance] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  // Scroll progress (0→1) over the 500vh section
  const { progress, isActive } = useScrollProgress(sectionRef)

  // Derive excavation state from progress
  const excavationState = useExcavationState(progress)

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Lazy load via IntersectionObserver ──
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.01, rootMargin: '200px' }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  // ── Initialize curtainsjs ──
  useEffect(() => {
    if (!isVisible || !curtainsContainerRef.current) return

    try {
      const curtains = new Curtains({
        container: curtainsContainerRef.current,
        pixelRatio: Math.min(1.5, window.devicePixelRatio),
        autoResize: true,
        autoRender: true,
        watchScroll: false, // We drive updates manually via scroll progress
        premultipliedAlpha: true,
      })

      curtains.onError(() => {
        console.warn('curtainsjs WebGL context failed')
      })

      curtains.onSuccess(() => {
        setCurtainsInstance(curtains)
      })

      return () => {
        curtains.dispose()
        setCurtainsInstance(null)
      }
    } catch (e) {
      console.warn('curtainsjs init failed:', e)
    }
  }, [isVisible])

  // ── Header text animation ──
  useEffect(() => {
    if (!isVisible || !headerTitleRef.current) return

    const split = new SplitText(headerTitleRef.current, { type: 'chars,words' })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        end: 'top 40%',
        scrub: 1,
      },
    })

    tl.from(split.chars, {
      opacity: 0,
      y: 60,
      rotateX: -60,
      stagger: 0.02,
      duration: 0.6,
      ease: 'back.out(1.7)',
    })

    tl.from(
      headerSubRef.current,
      {
        opacity: 0,
        y: 30,
        duration: 0.5,
        ease: 'power3.out',
      },
      '-=0.2'
    )

    return () => {
      split.revert()
      tl.kill()
    }
  }, [isVisible])

  // Eras with image data (skip header)
  const imageEras = ERAS.filter((e) => e.img)

  return (
    <section
      ref={sectionRef}
      className="excavation-section"
      data-cursor-text="Explore"
      data-cursor-color="#D4A843"
    >
      {/* ── R3F Canvas (geological layers, physics, particles, post-processing) ── */}
      {isVisible && (
        <div
          className="excavation-canvas-wrap"
          style={{
            opacity: isActive ? 1 : 0,
            visibility: isActive ? 'visible' : 'hidden',
            transition: 'opacity 0.5s ease',
          }}
        >
          <Canvas
            shadows
            dpr={isMobile ? [1, 1.5] : [1, 2]}
            performance={{ min: 0.5 }}
            gl={{
              powerPreference: 'high-performance',
              antialias: !isMobile,
              alpha: false,
              toneMapping: 0, // Disable default — postprocessing handles it
            }}
            camera={{ position: [0, 4, 6], fov: 52, near: 0.1, far: 100 }}
          >
            <color attach="background" args={['#000D26']} />
            <ExcavationScene
              progress={progress}
              excavationState={excavationState}
              isMobile={isMobile}
            />
          </Canvas>
        </div>
      )}

      {/* ── curtainsjs image planes ── */}
      <div
        ref={curtainsContainerRef}
        className="excavation-curtains-container"
        style={{
          opacity: isActive ? 1 : 0,
          visibility: isActive ? 'visible' : 'hidden',
          transition: 'opacity 0.5s ease',
        }}
      />

      {isVisible && (
        <div
          className="excavation-images-wrap"
          style={{
            opacity: isActive ? 1 : 0,
            visibility: isActive ? 'visible' : 'hidden',
            transition: 'opacity 0.5s ease',
          }}
        >
          {imageEras.map((era) => {
            const eraIsActive =
              progress >= era.range[0] && progress <= era.range[1]
            const eraProgress = eraIsActive
              ? (progress - era.range[0]) / (era.range[1] - era.range[0])
              : 0
            return (
              <EraImagePlane
                key={era.id}
                src={era.img}
                alt={era.title}
                isActive={eraIsActive}
                progress={eraProgress}
                curtainsInstance={curtainsInstance}
              />
            )
          })}
        </div>
      )}

      {/* ── Text overlays ── */}
      <div
        className="excavation-overlays"
        style={{
          opacity: isActive ? 1 : 0,
          visibility: isActive ? 'visible' : 'hidden',
          transition: 'opacity 0.5s ease',
        }}
      >
        {/* Header card */}
        <div
          className="excavation-header-card"
          style={{
            opacity: progress < 0.12 && isActive ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        >
          <div className="gold-line" />
          <h2 ref={headerTitleRef} className="excavation-header-title">
            123 Years of <em>Golden</em> Legacy
          </h2>
          <p ref={headerSubRef} className="excavation-header-sub">
            A story of faith, resilience, and transformation.
          </p>
        </div>

        {/* Era cards */}
        {imageEras.map((era) => {
          const textActive =
            era.textRange &&
            progress >= era.textRange[0] &&
            progress <= era.textRange[1]
          return (
            <EraCard
              key={era.id}
              era={era}
              isActive={textActive}
              progress={progress}
            />
          )
        })}
      </div>

      {/* ── Scroll spacer (500vh) ── */}
      <div className="excavation-scroll-spacer" />
    </section>
  )
}
