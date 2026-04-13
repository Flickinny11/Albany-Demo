import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

/**
 * HTML overlay card for each historical era.
 * Uses GSAP SplitText for staggered character reveal animations.
 */
export default function EraCard({ era, isActive }) {
  const cardRef = useRef()
  const titleRef = useRef()
  const bodyRef = useRef()
  const splitRef = useRef()
  const animatedRef = useRef(false)

  useEffect(() => {
    if (!titleRef.current || !isActive || animatedRef.current) return

    animatedRef.current = true

    // SplitText splits into chars for staggered animation
    splitRef.current = new SplitText(titleRef.current, { type: 'chars,words' })

    const tl = gsap.timeline()

    tl.from(splitRef.current.chars, {
      opacity: 0,
      y: 80,
      rotateX: -90,
      stagger: 0.03,
      duration: 0.8,
      ease: 'back.out(1.7)',
    })

    tl.from(
      bodyRef.current,
      {
        opacity: 0,
        y: 40,
        duration: 0.6,
        ease: 'power3.out',
      },
      '-=0.3'
    )

    return () => {
      tl.kill()
    }
  }, [isActive])

  // Reset animation when era becomes inactive
  useEffect(() => {
    if (!isActive && animatedRef.current) {
      animatedRef.current = false
      if (splitRef.current) {
        splitRef.current.revert()
        splitRef.current = null
      }
    }
  }, [isActive])

  if (!era.title) return null // Skip header

  return (
    <div
      ref={cardRef}
      className="excavation-era-card"
      style={{
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? 'auto' : 'none',
        transform: `translate3d(0, ${isActive ? 0 : 20}px, 0)`,
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
      data-cursor-text={era.id}
    >
      <div className="excavation-era-badge">
        <span className="excavation-era-year">{era.id}</span>
        <span className="excavation-era-label">{era.label}</span>
      </div>
      <h3 ref={titleRef} className="excavation-era-title">
        {era.title}
      </h3>
      <p ref={bodyRef} className="excavation-era-body">
        {era.text}
      </p>
    </div>
  )
}
