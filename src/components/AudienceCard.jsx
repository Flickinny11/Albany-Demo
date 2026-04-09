import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { IconArrowRight } from '../icons/CustomIcons'
import './AudienceCard.scss'

export default function AudienceCard({ icon: Icon, label, desc, path, index, onNavigate }) {
  const cardRef = useRef(null)
  const glareRef = useRef(null)
  const iconRef = useRef(null)
  const arrowRef = useRef(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el || 'ontouchstart' in window) return

    let bounds = null

    const onEnter = () => {
      bounds = el.getBoundingClientRect()
      gsap.to(el, {
        boxShadow: '0 20px 40px rgba(0,57,166,0.12), 0 8px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(234,171,0,0.2)',
        duration: 0.3,
      })
    }

    const onMove = (e) => {
      if (!bounds) return
      const x = e.clientX - bounds.left
      const y = e.clientY - bounds.top
      const xPct = (x / bounds.width - 0.5) * 2
      const yPct = (y / bounds.height - 0.5) * 2

      gsap.to(el, {
        rotateY: xPct * 12,
        rotateX: -yPct * 12,
        scale: 1.04,
        duration: 0.35,
        ease: 'power2.out',
        transformPerspective: 600,
      })

      // Glare follow
      if (glareRef.current) {
        gsap.to(glareRef.current, {
          opacity: 0.12 + Math.abs(xPct) * 0.1,
          x: xPct * 50,
          y: yPct * 50,
          duration: 0.3,
        })
      }

      // Icon float
      if (iconRef.current) {
        gsap.to(iconRef.current, {
          x: xPct * 6,
          y: yPct * 6,
          rotateZ: xPct * 3,
          duration: 0.3,
        })
      }
    }

    const onLeave = () => {
      bounds = null
      gsap.to(el, {
        rotateY: 0,
        rotateX: 0,
        scale: 1,
        boxShadow: '0 4px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
        duration: 0.5,
        ease: 'elastic.out(1,0.5)',
      })
      if (glareRef.current) gsap.to(glareRef.current, { opacity: 0, duration: 0.3 })
      if (iconRef.current) gsap.to(iconRef.current, { x: 0, y: 0, rotateZ: 0, duration: 0.4, ease: 'power2.out' })
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <a
      href={path}
      onClick={(e) => { e.preventDefault(); onNavigate(path) }}
      ref={cardRef}
      className="audience-card-3d"
      data-cursor-text="View"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Glass refraction glare */}
      <div ref={glareRef} className="card-glare" />

      {/* Edge highlight for depth */}
      <div className="card-edge-top" />
      <div className="card-edge-left" />

      {/* Content */}
      <div ref={iconRef} className="aud-icon-wrap">
        <Icon size={48} animated />
      </div>
      <h3 className="aud-label">{label}</h3>
      <p className="aud-desc">{desc}</p>
      <div ref={arrowRef} className="aud-arrow-wrap">
        <IconArrowRight size={16} color="var(--asu-blue)" />
      </div>

      {/* Bottom ambient glow */}
      <div className="card-ambient-glow" />
    </a>
  )
}
