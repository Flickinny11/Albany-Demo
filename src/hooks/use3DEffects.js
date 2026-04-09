import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'

// 3D tilt effect hook using GSAP — magnetic feel, photorealistic depth
export function useTilt3D(ref, options = {}) {
  const { intensity = 15, scale = 1.02, speed = 0.4, glare = true } = options
  const bounds = useRef(null)

  const onMouseMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    if (!bounds.current) bounds.current = el.getBoundingClientRect()
    const b = bounds.current
    const x = e.clientX - b.left
    const y = e.clientY - b.top
    const xPct = (x / b.width - 0.5) * 2
    const yPct = (y / b.height - 0.5) * 2

    gsap.to(el, {
      rotateY: xPct * intensity,
      rotateX: -yPct * intensity,
      scale: scale,
      duration: speed,
      ease: 'power2.out',
      transformPerspective: 800,
      transformOrigin: 'center center',
    })

    if (glare) {
      const glareEl = el.querySelector('.tilt-glare')
      if (glareEl) {
        gsap.to(glareEl, {
          opacity: 0.15 + Math.abs(xPct) * 0.15,
          x: `${xPct * 40}%`,
          y: `${yPct * 40}%`,
          duration: speed,
          ease: 'power2.out',
        })
      }
    }
  }, [ref, intensity, scale, speed, glare])

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    bounds.current = null
    gsap.to(el, {
      rotateY: 0,
      rotateX: 0,
      scale: 1,
      duration: 0.6,
      ease: 'elastic.out(1,0.5)',
    })
    const glareEl = el.querySelector('.tilt-glare')
    if (glareEl) {
      gsap.to(glareEl, { opacity: 0, duration: 0.4 })
    }
  }, [ref])

  const onMouseEnter = useCallback(() => {
    bounds.current = ref.current?.getBoundingClientRect() || null
  }, [ref])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Check for touch device
    if ('ontouchstart' in window) return

    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseleave', onMouseLeave)
    el.addEventListener('mouseenter', onMouseEnter)

    return () => {
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseleave', onMouseLeave)
      el.removeEventListener('mouseenter', onMouseEnter)
    }
  }, [ref, onMouseMove, onMouseLeave, onMouseEnter])
}

// Magnetic element hook — pulls element toward cursor
export function useMagnetic(ref, strength = 0.3) {
  useEffect(() => {
    const el = ref.current
    if (!el || 'ontouchstart' in window) return

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      gsap.to(el, {
        x: x * strength,
        y: y * strength,
        duration: 0.4,
        ease: 'power2.out',
      })
    }

    const onLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1,0.4)',
      })
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [ref, strength])
}
