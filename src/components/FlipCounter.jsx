import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './FlipCounter.scss'

gsap.registerPlugin(ScrollTrigger)

// A single digit that flips like a rolodex
function FlipDigit({ digit, delay = 0, triggered }) {
  const wrapRef = useRef(null)
  const [displayDigit, setDisplayDigit] = useState(0)
  const animating = useRef(false)

  useEffect(() => {
    if (!triggered || animating.current) return
    animating.current = true

    const target = parseInt(digit, 10)
    if (isNaN(target)) {
      setDisplayDigit(digit)
      return
    }

    // Animate through digits with flip effect
    const totalFlips = target + Math.floor(Math.random() * 5) + 3
    let current = 0
    const duration = 1.8 + delay * 0.3
    const stepTime = duration / totalFlips

    const el = wrapRef.current
    if (!el) return

    const flipNext = () => {
      if (current > totalFlips) return

      const d = current <= target ? current : target
      setDisplayDigit(d > 9 ? d % 10 : d)

      // 3D flip animation on each step
      gsap.fromTo(el, {
        rotateX: -90,
        opacity: 0.3,
        scale: 0.9,
      }, {
        rotateX: 0,
        opacity: 1,
        scale: 1,
        duration: Math.max(0.08, stepTime * 0.6),
        ease: current >= totalFlips - 3 ? 'back.out(2)' : 'power2.out',
      })

      current++
      if (current <= totalFlips) {
        setTimeout(flipNext, stepTime * 1000 * (current >= totalFlips - 3 ? 1.5 : 0.5))
      }
    }

    setTimeout(() => flipNext(), delay * 200)
  }, [digit, delay, triggered])

  return (
    <div className="flip-digit-container">
      <div ref={wrapRef} className="flip-digit" style={{ transformStyle: 'preserve-3d', perspective: '300px' }}>
        <span>{displayDigit}</span>
      </div>
      {/* Top shine / reflection */}
      <div className="flip-shine" />
      {/* Center split line for rolodex look */}
      <div className="flip-split" />
    </div>
  )
}

export default function FlipCounter({ value, suffix, label }) {
  const containerRef = useRef(null)
  const [triggered, setTriggered] = useState(false)
  const digits = String(value).split('')

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      once: true,
      onEnter: () => setTriggered(true),
    })

    return () => trigger.kill()
  }, [])

  return (
    <div ref={containerRef} className="flip-counter">
      <div className="flip-digits-row">
        {digits.map((d, i) => (
          <FlipDigit key={i} digit={d} delay={i} triggered={triggered} />
        ))}
        {suffix && <span className="flip-suffix">{suffix}</span>}
      </div>
      <p className="flip-label">{label}</p>
    </div>
  )
}
