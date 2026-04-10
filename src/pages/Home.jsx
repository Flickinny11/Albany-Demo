import { useEffect, useRef, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createNoise3D } from 'simplex-noise'
import {
  IconFutureStudent, IconCurrentStudent, IconFaculty, IconFamily, IconAlumni,
  IconHealthcare, IconBusiness, IconScience, IconGraduation,
  IconArrowRight, IconScrollDown
} from '../icons/CustomIcons'
import HeroWebGL from '../components/HeroWebGL'
import AudienceCard from '../components/AudienceCard'
import FlipCounter from '../components/FlipCounter'
import './Home.scss'

// Lazy-load heavy WebGL components for code-splitting
const HeritageScroll = lazy(() => import('../components/HeritageScroll'))
const ParticleStats = lazy(() => import('../components/ParticleStats'))
const LivingCampus = lazy(() => import('../components/LivingCampus'))

gsap.registerPlugin(ScrollTrigger)

const AUDIENCE = [
  { label: 'Future Students', icon: IconFutureStudent, desc: 'Start your journey at ASU', path: '/apply' },
  { label: 'Current Students', icon: IconCurrentStudent, desc: 'Resources for Rams', path: '/student-life' },
  { label: 'Faculty & Staff', icon: IconFaculty, desc: 'Tools and information', path: '/about' },
  { label: 'Parents & Family', icon: IconFamily, desc: 'Support your student', path: '/about' },
  { label: 'Alumni', icon: IconAlumni, desc: 'Stay connected', path: '/about' },
]

const STATS = [
  { value: 123, suffix: '+', label: 'Years of Excellence' },
  { value: 6000, suffix: '+', label: 'Students Enrolled' },
  { value: 80, suffix: '+', label: 'Degree Programs' },
  { value: 50, suffix: '+', label: 'Organizations' },
]

const COLLEGES = [
  { name: 'Darton College of Health Professions', img: 'https://www.asurams.edu/images/ou_images/Darton-College-of-Health-Professions.jpg', icon: IconHealthcare, desc: 'Preparing the next generation of healthcare professionals with hands-on clinical experience.' },
  { name: 'College of Professional Studies', img: 'https://www.asurams.edu/images/ou_images/College-of-Professional-Studies.jpg', icon: IconBusiness, desc: 'Building business leaders, educators, and professionals who transform communities.' },
  { name: 'College of Arts & Sciences', img: 'https://www.asurams.edu/images/ou_images/College-of-Arts-and-Sciences.jpg', icon: IconScience, desc: 'Discover, innovate, and create across the full spectrum of liberal arts and sciences.' },
  { name: 'Graduate School', img: 'https://www.asurams.edu/images/graduate%20photo%205.jpg', icon: IconGraduation, desc: 'Advanced degrees that advance your career and expand your impact.' },
]

const EVENTS = [
  { title: '123rd Founders Day', desc: 'Dr. Ontario Wooden as Convocation Speaker — celebrating over a century of excellence.', tag: 'Celebration' },
  { title: 'ASU Foundation Scholarship Gala', desc: 'April 11, 2026, 6:00 PM — An evening of giving to support the next generation of Golden Rams.', tag: 'Gala' },
  { title: 'Application Fee Waived', desc: 'Use code RAMSAPPLY26 to apply for free. Your future starts here.', tag: 'Admissions' },
  { title: 'ASU Open House', desc: 'Tour our campus, meet faculty, and discover what makes Albany State unforgettable.', tag: 'Visit' },
]

export default function Home() {
  const heroRef = useRef(null)
  const headlineRef = useRef(null)
  const ctaCanvasRef = useRef(null)
  const navigate = useNavigate()

  // WebGL CTA background with animated noise
  useEffect(() => {
    const canvas = ctaCanvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: false })
    if (!gl) return

    // Fullscreen quad shader for flowing energy effect
    const vsSource = `attribute vec4 p;void main(){gl_Position=p;}`
    const fsSource = `
      precision mediump float;
      uniform float t;
      uniform vec2 r;

      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.0;a*=0.5;}return v;}

      void main(){
        vec2 uv=gl_FragCoord.xy/r;
        float n1=fbm(uv*3.0+t*0.15);
        float n2=fbm(uv*4.0-t*0.1+vec2(5.0));
        float n3=fbm(vec2(n1,n2)*3.0+t*0.08);

        vec3 deep=vec3(0.0,0.02,0.06);
        vec3 mid=vec3(0.0,0.08,0.25);
        vec3 gold=vec3(0.92,0.67,0.0);

        vec3 c=mix(deep,mid,n1*0.8);
        c+=gold*pow(n3,3.0)*0.35;
        c+=vec3(0.0,0.04,0.12)*pow(n2,2.0)*0.5;

        // Soft gold particles
        float p=pow(noise(uv*20.0+t*0.5),8.0)*0.4;
        c+=gold*p;

        // Vignette
        float v=1.0-length((uv-0.5)*1.6)*0.5;
        c*=v;

        gl_FragColor=vec4(c,1.0);
      }
    `

    function compile(src, type) {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }

    const prog = gl.createProgram()
    gl.attachShader(prog, compile(vsSource, gl.VERTEX_SHADER))
    gl.attachShader(prog, compile(fsSource, gl.FRAGMENT_SHADER))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uT = gl.getUniformLocation(prog, 't')
    const uR = gl.getUniformLocation(prog, 'r')

    let raf
    const t0 = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      canvas.width = canvas.offsetWidth * dpr * 0.5
      canvas.height = canvas.offsetHeight * dpr * 0.5
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      gl.uniform1f(uT, (performance.now() - t0) * 0.001)
      gl.uniform2f(uR, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero headline stagger — dramatic 3D entrance
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.hero-word')
        gsap.fromTo(words,
          { y: 100, opacity: 0, rotateX: 50, scale: 0.9 },
          { y: 0, opacity: 1, rotateX: 0, scale: 1, stagger: 0.12, duration: 1.4, ease: 'power4.out', delay: 0.3 }
        )
      }

      gsap.fromTo('.hero-subtitle',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 1 }
      )

      gsap.fromTo('.hero-actions',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', delay: 1.3 }
      )

      // Scroll indicator pulse
      gsap.to('.scroll-indicator', {
        y: 12,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })

      // Audience section header
      gsap.fromTo('.audience-section .section-header > *', {
        y: 40, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '.audience-section', start: 'top 78%' }
      })

      // Audience cards — 3D staggered entrance from below with rotation
      gsap.fromTo('.audience-card-3d', {
        y: 80,
        opacity: 0,
        rotateX: 15,
        scale: 0.92,
      }, {
        y: 0,
        opacity: 1,
        rotateX: 0,
        scale: 1,
        stagger: 0.1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.audience-section',
          start: 'top 72%',
        }
      })

      // Stats section title — dramatic entrance
      gsap.fromTo('.stats-title-wrap', {
        y: 50, opacity: 0, scale: 0.95,
      }, {
        y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.stats-section', start: 'top 80%' }
      })

      // Colleges — 3D stagger with rotation
      gsap.fromTo('.college-card', {
        y: 100,
        opacity: 0,
        rotateY: -8,
      }, {
        y: 0,
        opacity: 1,
        rotateY: 0,
        stagger: 0.15,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.colleges-section',
          start: 'top 70%',
        }
      })

      // College section header
      gsap.fromTo('.colleges-section .section-header > *', {
        y: 30, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.08, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.colleges-section', start: 'top 80%' }
      })

      // Events — stagger with depth
      gsap.fromTo('.events-section .section-header > *', {
        y: 30, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.08, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.events-section', start: 'top 80%' }
      })

      gsap.fromTo('.event-card', {
        x: -50,
        opacity: 0,
        rotateY: -5,
      }, {
        x: 0,
        opacity: 1,
        rotateY: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.events-section',
          start: 'top 68%',
        }
      })

      gsap.fromTo('.events-featured', {
        y: 60, opacity: 0, scale: 0.95,
      }, {
        y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.events-section', start: 'top 72%' }
      })

      // CTA section — dramatic entrance
      gsap.fromTo('.cta-inner > *', {
        y: 50, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.12, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.cta-section', start: 'top 75%' }
      })

    })

    return () => ctx.revert()
  }, [])

  // Magnetic effect on buttons using GSAP
  useEffect(() => {
    if ('ontouchstart' in window) return

    const buttons = document.querySelectorAll('.hero-actions .btn-primary, .hero-actions .btn-outline')
    const handlers = []

    buttons.forEach((btn) => {
      const onMove = (e) => {
        const rect = btn.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        gsap.to(btn, { x: x * 0.25, y: y * 0.25, duration: 0.3, ease: 'power2.out' })
      }
      const onLeave = () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' })
      }
      btn.addEventListener('mousemove', onMove)
      btn.addEventListener('mouseleave', onLeave)
      handlers.push({ el: btn, onMove, onLeave })
    })

    return () => {
      handlers.forEach(({ el, onMove, onLeave }) => {
        el.removeEventListener('mousemove', onMove)
        el.removeEventListener('mouseleave', onLeave)
      })
    }
  }, [])

  return (
    <div className="home-page">
      {/* HERO */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-video-wrap">
          <video
            autoPlay muted loop playsInline preload="auto"
            className="hero-video"
            poster="https://www.asurams.edu/images/ou_images/College-of-Arts-and-Sciences.jpg"
          >
            <source src="https://www.asurams.edu/_resources/videos/asu-home-video-2026-2.mp4" type="video/mp4" />
          </video>
          <div className="hero-overlay" />
          <HeroWebGL />
          <div className="hero-grain" />
          <div className="hero-vignette" />
        </div>

        <div className="container hero-content">
          <div className="hero-badge">Est. 1903 &mdash; Albany, Georgia</div>
          <h1 ref={headlineRef} className="hero-headline">
            <span className="hero-word">Where</span>{' '}
            <span className="hero-word">Dreams</span>{' '}
            <span className="hero-word hero-word-gold">Find</span>{' '}
            <span className="hero-word">Direction</span>
          </h1>
          <p className="hero-subtitle">
            A nationally top-ranked HBCU offering 80+ degree programs across four distinguished colleges. Join the Golden Ram family.
          </p>
          <div className="hero-actions">
            <a href="/apply" onClick={(e) => { e.preventDefault(); navigate('/apply') }} className="btn-primary" data-cursor-text="Apply">
              <span>Apply Now</span>
              <IconArrowRight size={18} />
            </a>
            <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about') }} className="btn-outline" data-cursor-text="Explore">
              <span>Explore ASU</span>
            </a>
          </div>
        </div>

        <div className="scroll-indicator">
          <IconScrollDown size={32} />
          <span className="scroll-text">Scroll</span>
        </div>
      </section>

      {/* HERITAGE SCROLL — ASU's 123-year story told through shader-driven image effects */}
      <Suspense fallback={null}>
        <HeritageScroll />
      </Suspense>

      {/* AUDIENCE SELECTOR */}
      <section className="audience-section section">
        {/* Animated gradient background */}
        <div className="audience-bg" />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="section-header">
            <div className="gold-line" />
            <h2 className="section-title">I Am A...</h2>
            <p className="section-subtitle">Find the resources and information tailored to you.</p>
          </div>
          <div className="audience-grid">
            {AUDIENCE.map((a, i) => (
              <AudienceCard
                key={i}
                icon={a.icon}
                label={a.label}
                desc={a.desc}
                path={a.path}
                index={i}
                onNavigate={navigate}
              />
            ))}
          </div>
        </div>
      </section>

      {/* PARTICLE CONSTELLATION DATA WALL — stats that feel alive */}
      <Suspense fallback={null}>
        <ParticleStats />
      </Suspense>

      {/* COLLEGES */}
      <section className="colleges-section section">
        <div className="colleges-bg" />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="section-header">
            <div className="gold-line" />
            <h2 className="section-title">Our Colleges</h2>
            <p className="section-subtitle">Four distinguished colleges, 80+ programs, and one unwavering commitment to your success.</p>
          </div>
          <div className="colleges-grid">
            {COLLEGES.map((college, i) => {
              const Icon = college.icon
              return (
                <a href="/academics" onClick={(e) => { e.preventDefault(); navigate('/academics') }} key={i} className="college-card" data-cursor-text="Explore">
                  <div className="college-image depth-image">
                    <img src={college.img} alt={college.name} loading="lazy" />
                    <div className="college-img-overlay" />
                  </div>
                  <div className="college-info">
                    <div className="college-icon-wrap">
                      <Icon size={36} color="var(--asu-blue)" animated />
                    </div>
                    <h3>{college.name}</h3>
                    <p>{college.desc}</p>
                    <span className="college-link">
                      Explore Programs <IconArrowRight size={14} color="var(--asu-gold)" />
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* NEWS & EVENTS */}
      <section className="events-section section">
        <div className="events-bg" />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="section-header">
            <div className="gold-line" />
            <h2 className="section-title">News & Events</h2>
            <p className="section-subtitle">What's happening at Albany State University.</p>
          </div>
          <div className="events-grid">
            <div className="events-featured">
              <div className="depth-image events-img-wrap">
                <img
                  src="https://www.asurams.edu/_resources/img/event-calendar-teaser.jpg"
                  alt="ASU Events"
                  loading="lazy"
                />
              </div>
              <div className="events-featured-info">
                <span className="event-tag">Featured</span>
                <h3>LiveSafe Campus Safety App</h3>
                <p>Download the LiveSafe app for real-time safety alerts, campus resources, and direct communication with ASU Police. Your safety is our priority.</p>
              </div>
            </div>
            <div className="events-list">
              {EVENTS.map((event, i) => (
                <div key={i} className="event-card" data-cursor-text="Read">
                  <span className="event-tag">{event.tag}</span>
                  <h4>{event.title}</h4>
                  <p>{event.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LIVING CAMPUS — real-time 3D ray-marched SDF campus scene */}
      <Suspense fallback={null}>
        <LivingCampus />
      </Suspense>

      {/* CTA */}
      <section className="cta-section">
        <canvas ref={ctaCanvasRef} className="cta-canvas" />
        <div className="cta-overlay" />
        <div className="container cta-inner" style={{ position: 'relative', zIndex: 3 }}>
          <div className="cta-badge">Your Journey Awaits</div>
          <h2>Your Future <em>Starts Here</em></h2>
          <p>Apply today with fee waiver code <strong>RAMSAPPLY26</strong> and join over a century of Golden Ram excellence.</p>
          <div className="cta-buttons">
            <a href="/apply" onClick={(e) => { e.preventDefault(); navigate('/apply') }} className="btn-primary" data-cursor-text="Apply">
              <span>Apply Now — It's Free</span>
              <IconArrowRight size={18} />
            </a>
            <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about') }} className="btn-outline" data-cursor-text="Visit">
              <span>Schedule a Visit</span>
            </a>
          </div>
        </div>
        {/* Decorative floating rings */}
        <div className="cta-ring cta-ring-1" />
        <div className="cta-ring cta-ring-2" />
        <div className="cta-ring cta-ring-3" />
      </section>
    </div>
  )
}
