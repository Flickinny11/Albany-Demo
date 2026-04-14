import { useState, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Maps scroll position through a trigger element to a 0→1 progress value.
 * Uses GSAP ScrollTrigger which is already synced with Lenis (set up in App.jsx).
 */
export default function useScrollProgress(triggerRef) {
  const [progress, setProgress] = useState(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!triggerRef.current) return

    const trigger = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5, // Smoother interpolation for longer scroll distance
      onUpdate: (self) => {
        setProgress(self.progress)
      },
      onEnter: () => setIsActive(true),
      onLeave: () => setIsActive(false),
      onEnterBack: () => setIsActive(true),
      onLeaveBack: () => setIsActive(false),
    })

    return () => trigger.kill()
  }, [triggerRef])

  return { progress, isActive }
}
