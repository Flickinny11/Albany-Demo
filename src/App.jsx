import { useEffect, useRef, useCallback } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import Navigation from './components/Navigation'
import Footer from './components/Footer'
import CustomCursor from './components/CustomCursor'
import ScrollProgress from './components/ScrollProgress'
import ErrorBoundary from './components/ErrorBoundary'

import Home from './pages/Home'
import About from './pages/About'
import Academics from './pages/Academics'
import StudentLife from './pages/StudentLife'
import Apply from './pages/Apply'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const lenisRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(lenis.raf)
    }
  }, [])

  const navigateWithTransition = useCallback((updateFn) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        updateFn()
      })
    } else {
      updateFn()
    }
  }, [])

  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true })
    }
    ScrollTrigger.refresh()
  }, [location.pathname])

  return (
    <ErrorBoundary fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000D26', color: '#fff', fontFamily: 'DM Sans, sans-serif', textAlign: 'center', padding: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#EAAB00' }}>Albany State University</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Something went wrong loading the page. Please refresh.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1.5rem', padding: '12px 32px', background: '#EAAB00', color: '#000D26', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Refresh Page</button>
        </div>
      </div>
    }>
      <ErrorBoundary><CustomCursor /></ErrorBoundary>
      <ScrollProgress />
      <Navigation navigateWithTransition={navigateWithTransition} />
      <main className="page-wrapper">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/student-life" element={<StudentLife />} />
          <Route path="/apply" element={<Apply />} />
        </Routes>
      </main>
      <Footer />
    </ErrorBoundary>
  )
}
