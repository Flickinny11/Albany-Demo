import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { IconMenu, IconClose } from '../icons/CustomIcons'
import './Navigation.scss'

const NAV_LINKS = [
  { label: 'About', path: '/about' },
  { label: 'Academics', path: '/academics' },
  { label: 'Student Life', path: '/student-life' },
  { label: 'Apply', path: '/apply' },
]

const UTIL_LINKS = [
  { label: 'Calendar', href: 'https://www.asurams.edu/calendar' },
  { label: 'Directory', href: 'https://www.asurams.edu/directory' },
  { label: 'Campus Email', href: 'https://mail.google.com' },
  { label: 'Faculty & Staff', href: 'https://www.asurams.edu/faculty-staff' },
  { label: 'Give', href: 'https://www.asurams.edu/give' },
]

export default function Navigation({ navigateWithTransition }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const navRef = useRef(null)
  const overlayRef = useRef(null)
  const mobileLinksRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // GSAP magnetic effect on nav links (Design_References.md pattern)
  useEffect(() => {
    if ('ontouchstart' in window) return
    const links = document.querySelectorAll('.nav-link, .nav-cta')
    const handlers = []

    links.forEach((link) => {
      const onMove = (e) => {
        const rect = link.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        gsap.to(link, { x: x * 0.2, y: y * 0.15, duration: 0.3, ease: 'power2.out' })
      }
      const onLeave = () => {
        gsap.to(link, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' })
      }
      link.addEventListener('mousemove', onMove)
      link.addEventListener('mouseleave', onLeave)
      handlers.push({ el: link, onMove, onLeave })
    })

    return () => {
      handlers.forEach(({ el, onMove, onLeave }) => {
        el.removeEventListener('mousemove', onMove)
        el.removeEventListener('mouseleave', onLeave)
      })
    }
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      const overlay = overlayRef.current
      if (overlay) {
        gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
      }
      if (mobileLinksRef.current) {
        const items = mobileLinksRef.current.querySelectorAll('.mobile-nav-item')
        gsap.fromTo(items,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: 'power3.out', delay: 0.2 }
        )
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const handleNavClick = (e, path) => {
    e.preventDefault()
    navigateWithTransition(() => navigate(path))
  }

  const isHome = location.pathname === '/'

  return (
    <>
      {/* Utility bar */}
      <div className={`util-bar ${scrolled ? 'util-hidden' : ''}`}>
        <div className="container util-inner">
          {UTIL_LINKS.map(link => (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" data-cursor-text="Go">
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Main nav */}
      <nav ref={navRef} className={`main-nav ${scrolled ? 'nav-scrolled' : ''} ${isHome && !scrolled ? 'nav-transparent' : ''}`}>
        <div className="container nav-inner">
          <Link to="/" className="nav-logo" onClick={(e) => handleNavClick(e, '/')} data-cursor-text="Home" style={{ viewTransitionName: 'nav-logo' }}>
            <img
              src="https://www.asurams.edu/_resources/img/asurams_official_logo.png"
              alt="Albany State University"
              width="180"
              height="48"
              className={scrolled || !isHome ? 'logo-dark' : ''}
            />
          </Link>

          <div className="nav-links-desktop">
            {NAV_LINKS.map(link => (
              <a
                key={link.path}
                href={link.path}
                onClick={(e) => handleNavClick(e, link.path)}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                data-cursor-text="View"
              >
                <span className="nav-link-text">{link.label}</span>
                <span className="nav-link-line" />
              </a>
            ))}
            <a
              href="/apply"
              onClick={(e) => handleNavClick(e, '/apply')}
              className="nav-cta"
              data-cursor-text="Apply"
            >
              <span>Apply Now</span>
            </a>
          </div>

          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <IconClose size={28} color={scrolled || !isHome ? 'var(--asu-blue-dark)' : '#fff'} /> : <IconMenu size={28} color={scrolled || !isHome ? 'var(--asu-blue-dark)' : '#fff'} />}
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div ref={overlayRef} className="mobile-overlay">
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <IconClose size={32} color="#fff" />
          </button>
          <div ref={mobileLinksRef} className="mobile-nav-content">
            <div className="mobile-nav-links">
              {[{ label: 'Home', path: '/' }, ...NAV_LINKS].map(link => (
                <a
                  key={link.path}
                  href={link.path}
                  className="mobile-nav-item"
                  onClick={(e) => { handleNavClick(e, link.path); setMobileOpen(false); }}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mobile-nav-item">
              <a href="/apply" onClick={(e) => { handleNavClick(e, '/apply'); setMobileOpen(false); }} className="nav-cta mobile-cta">
                <span>Apply Now</span>
              </a>
            </div>
            <div className="mobile-util mobile-nav-item">
              {UTIL_LINKS.map(link => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mobile-contact mobile-nav-item">
              <p>(229) 500-2000</p>
              <p>Albany, Georgia</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
