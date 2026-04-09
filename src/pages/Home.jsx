import { useEffect, useRef } from 'react'
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
import './Home.scss'

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
  const statsRef = useRef(null)
  const collegesRef = useRef(null)
  const eventsRef = useRef(null)
  const ctaRef = useRef(null)
  const canvasRef = useRef(null)
  const navigate = useNavigate()

  // Noise-based CTA background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const noise3D = createNoise3D()
    let animId
    let time = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth * 0.5
      canvas.height = canvas.offsetHeight * 0.5
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      time += 0.003
      const w = canvas.width
      const h = canvas.height
      const imgData = ctx.createImageData(w, h)

      for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
          const nx = x / w * 3
          const ny = y / h * 3
          const v = noise3D(nx, ny, time)
          const idx = (y * w + x) * 4
          // Deep blue to gold gradient based on noise
          const t = (v + 1) * 0.5
          imgData.data[idx] = Math.floor(0 + t * 40)     // R
          imgData.data[idx + 1] = Math.floor(15 + t * 50) // G
          imgData.data[idx + 2] = Math.floor(38 + t * 80) // B
          imgData.data[idx + 3] = 255
        }
      }
      ctx.putImageData(imgData, 0, 0)
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero headline stagger
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.hero-word')
        gsap.fromTo(words,
          { y: 80, opacity: 0, rotateX: 40 },
          { y: 0, opacity: 1, rotateX: 0, stagger: 0.12, duration: 1.2, ease: 'power3.out', delay: 0.3 }
        )
      }

      // Hero subtitle
      gsap.fromTo('.hero-subtitle',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 1 }
      )

      // Hero CTA buttons
      gsap.fromTo('.hero-actions',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', delay: 1.3 }
      )

      // Scroll indicator
      gsap.to('.scroll-indicator', {
        y: 10,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })

      // Audience cards
      gsap.fromTo('.audience-card', {
        y: 60,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.audience-section',
          start: 'top 75%',
        }
      })

      // Stats counter
      if (statsRef.current) {
        const statEls = statsRef.current.querySelectorAll('.stat-number')
        statEls.forEach((el) => {
          const target = parseInt(el.dataset.value, 10)
          gsap.fromTo(el, { innerText: 0 }, {
            innerText: target,
            duration: 2,
            ease: 'power2.out',
            snap: { innerText: 1 },
            scrollTrigger: {
              trigger: el,
              start: 'top 80%',
            },
            onUpdate: function() {
              el.textContent = Math.floor(this.targets()[0].innerText)
            }
          })
        })
      }

      // Stats section title
      gsap.fromTo('.stats-title', {
        y: 40, opacity: 0,
      }, {
        y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '.stats-section', start: 'top 80%' }
      })

      // Colleges stagger
      gsap.fromTo('.college-card', {
        y: 80,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.colleges-section',
          start: 'top 70%',
        }
      })

      // Events
      gsap.fromTo('.event-card', {
        x: -40,
        opacity: 0,
      }, {
        x: 0,
        opacity: 1,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.events-section',
          start: 'top 70%',
        }
      })

      // CTA section
      gsap.fromTo('.cta-content', {
        y: 60, opacity: 0,
      }, {
        y: 0, opacity: 1, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.cta-section', start: 'top 75%' }
      })

    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="home-page">
      {/* HERO */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-video-wrap">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
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

      {/* AUDIENCE SELECTOR */}
      <section className="audience-section section">
        <div className="container">
          <div className="section-header">
            <div className="gold-line" />
            <h2 className="section-title">I Am A...</h2>
            <p className="section-subtitle">Find the resources and information tailored to you.</p>
          </div>
          <div className="audience-grid">
            {AUDIENCE.map((a, i) => {
              const Icon = a.icon
              return (
                <a
                  href={a.path}
                  onClick={(e) => { e.preventDefault(); navigate(a.path) }}
                  key={i}
                  className="audience-card card-3d"
                  data-cursor-text="View"
                >
                  <div className="audience-icon">
                    <Icon size={52} animated />
                  </div>
                  <h3>{a.label}</h3>
                  <p>{a.desc}</p>
                  <span className="audience-arrow"><IconArrowRight size={16} color="var(--asu-blue)" /></span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-section" ref={statsRef}>
        <div className="stats-bg" />
        <div className="container">
          <h2 className="stats-title">Albany State By The Numbers</h2>
          <div className="stats-grid">
            {STATS.map((stat, i) => (
              <div key={i} className="stat-item">
                <span className="stat-number" data-value={stat.value}>0</span>
                <span className="stat-suffix">{stat.suffix}</span>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COLLEGES */}
      <section className="colleges-section section" ref={collegesRef}>
        <div className="container">
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
      <section className="events-section section" ref={eventsRef}>
        <div className="container">
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

      {/* CTA */}
      <section className="cta-section" ref={ctaRef}>
        <canvas ref={canvasRef} className="cta-canvas" />
        <div className="cta-overlay" />
        <div className="container cta-content">
          <h2>Your Future Starts Here</h2>
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
      </section>
    </div>
  )
}
