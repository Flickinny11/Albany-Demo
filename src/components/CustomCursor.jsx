import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef = useRef(null)
  const circleRef = useRef(null)
  const mouse = useRef({ x: 0, y: 0 })
  const pos = useRef({ x: 0, y: 0 })
  const dotPos = useRef({ x: 0, y: 0 })
  const visible = useRef(false)
  const hovered = useRef(false)
  const textRef = useRef(null)

  useEffect(() => {
    // Disable on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return

    const dot = dotRef.current
    const circle = circleRef.current
    const textEl = textRef.current
    if (!dot || !circle) return

    const onMouseMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      if (!visible.current) {
        visible.current = true
        dot.style.opacity = '1'
        circle.style.opacity = '1'
      }
    }

    const onMouseLeave = () => {
      visible.current = false
      dot.style.opacity = '0'
      circle.style.opacity = '0'
    }

    const onMouseEnter = () => {
      visible.current = true
      dot.style.opacity = '1'
      circle.style.opacity = '1'
    }

    const handleHoverEnter = (e) => {
      hovered.current = true
      circle.style.width = '60px'
      circle.style.height = '60px'
      circle.style.borderColor = 'var(--asu-gold)'
      circle.style.background = 'rgba(234,171,0,0.08)'
      const text = e.target.closest('[data-cursor-text]')?.getAttribute('data-cursor-text')
      if (text && textEl) {
        textEl.textContent = text
        textEl.style.opacity = '1'
      }
    }

    const handleHoverLeave = () => {
      hovered.current = false
      circle.style.width = '40px'
      circle.style.height = '40px'
      circle.style.borderColor = 'rgba(0,57,166,0.4)'
      circle.style.background = 'transparent'
      if (textEl) {
        textEl.style.opacity = '0'
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)

    // Set up hover listeners using event delegation
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button, [data-cursor-text], .card-3d, .depth-image')) {
        handleHoverEnter(e)
      }
    })
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, [data-cursor-text], .card-3d, .depth-image')) {
        handleHoverLeave()
      }
    })

    // Animation loop with lerp
    let raf
    const animate = () => {
      // Dot follows fast
      dotPos.current.x += (mouse.current.x - dotPos.current.x) * 0.35
      dotPos.current.y += (mouse.current.y - dotPos.current.y) * 0.35
      // Circle follows with more lag
      pos.current.x += (mouse.current.x - pos.current.x) * 0.12
      pos.current.y += (mouse.current.y - pos.current.y) * 0.12

      // Skew based on velocity
      const dx = mouse.current.x - pos.current.x
      const dy = mouse.current.y - pos.current.y
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)
      const speed = Math.min(Math.sqrt(dx * dx + dy * dy), 30)
      const skew = speed * 0.15

      dot.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%)`
      circle.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%) rotate(${angle}deg) scaleX(${1 + skew * 0.02}) scaleY(${1 - skew * 0.01})`

      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'var(--asu-gold)',
        pointerEvents: 'none',
        zIndex: 99999,
        opacity: 0,
        transition: 'opacity 0.3s ease',
        mixBlendMode: 'difference',
      }} />
      <div ref={circleRef} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '1.5px solid rgba(0,57,166,0.4)',
        pointerEvents: 'none',
        zIndex: 99998,
        opacity: 0,
        transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1), height 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease, background 0.3s ease, opacity 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span ref={textRef} style={{
          color: 'var(--asu-gold)',
          fontSize: '10px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          fontFamily: 'var(--font-body)',
        }} />
      </div>
    </>
  )
}
