import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  IconHousing, IconOrganizations, IconAthletics, IconDining, IconCareer, IconSafety, IconArrowRight
} from '../icons/CustomIcons'
import './StudentLife.scss'

gsap.registerPlugin(ScrollTrigger)

const FEATURES = [
  { icon: IconHousing, title: 'Housing & Residence Life', desc: 'Modern residence halls designed for comfort, community, and academic success. Multiple housing options for every lifestyle.' },
  { icon: IconOrganizations, title: '50+ Organizations', desc: 'From Greek life to academic clubs, find your community among dozens of student-led organizations and leadership opportunities.' },
  { icon: IconAthletics, title: 'Athletics', desc: 'Golden Rams compete in NCAA Division II across multiple sports. Experience the thrill of game day and the pride of being a Ram.' },
  { icon: IconDining, title: 'Campus Dining', desc: 'Multiple dining options across both campuses with diverse menus, flexible meal plans, and dietary accommodations.' },
  { icon: IconCareer, title: 'Career Services', desc: 'Professional development, internship connections, resume workshops, and career fairs to launch your professional journey.' },
  { icon: IconSafety, title: 'Campus Safety', desc: 'A safe campus environment with 24/7 campus police, LiveSafe app, emergency notification systems, and well-lit walkways.' },
]

export default function StudentLife() {
  const navigate = useNavigate()

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero
      gsap.fromTo('.sl-hero-content > *', {
        y: 40, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.12, duration: 1, ease: 'power3.out', delay: 0.2
      })

      gsap.to('.sl-hero-img', {
        y: 100,
        ease: 'none',
        scrollTrigger: { trigger: '.sl-hero', start: 'top top', end: 'bottom top', scrub: true }
      })

      // Feature cards
      gsap.fromTo('.feature-card', {
        y: 60, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.features-grid', start: 'top 75%' }
      })

      // Gallery items
      gsap.fromTo('.gallery-item', {
        y: 40, opacity: 0, scale: 0.95,
      }, {
        y: 0, opacity: 1, scale: 1, stagger: 0.12, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '.gallery-grid', start: 'top 75%' }
      })

      // CTA
      gsap.fromTo('.sl-cta-content > *', {
        y: 30, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '.sl-cta', start: 'top 80%' }
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <div className="student-life-page">
      {/* Hero */}
      <section className="sl-hero">
        <div className="sl-hero-bg">
          <img src="https://www.asurams.edu/images/ou_images/College-of-Arts-and-Sciences.jpg" alt="Student Life" className="sl-hero-img" />
          <div className="sl-hero-overlay" />
        </div>
        <div className="container sl-hero-content">
          <div className="gold-line" />
          <h1>Student Life</h1>
          <p>At Albany State, every day is an opportunity. From the classroom to the campus green, from the residence hall to the arena — life as a Golden Ram is unforgettable.</p>
        </div>
      </section>

      {/* Features */}
      <section className="features-section section">
        <div className="container">
          <div className="section-header">
            <div className="gold-line" />
            <h2 className="section-title">The Ram Experience</h2>
            <p className="section-subtitle">Everything you need for an exceptional college experience.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="feature-card card-3d" data-cursor-text="Learn More">
                  <div className="feature-icon">
                    <Icon size={44} color="var(--asu-blue)" animated />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="gallery-section section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="gold-line" style={{ margin: '0 auto 20px' }} />
            <h2 className="section-title">Campus Life</h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>Experience the energy and community that make ASU special.</p>
          </div>
          <div className="gallery-grid">
            <div className="gallery-item gallery-item-large depth-image">
              <img src="https://www.asurams.edu/images/ou_images/College-of-Professional-Studies.jpg" alt="Campus Life" loading="lazy" />
              <div className="gallery-overlay">
                <span>Golden Ram Family</span>
              </div>
            </div>
            <div className="gallery-item depth-image">
              <img src="https://www.asurams.edu/images/ou_images/Darton-College-of-Health-Professions.jpg" alt="Health Sciences" loading="lazy" />
              <div className="gallery-overlay">
                <span>Health Sciences</span>
              </div>
            </div>
            <div className="gallery-item depth-image">
              <img src="https://www.asurams.edu/images/graduate%20photo%205.jpg" alt="Graduation" loading="lazy" />
              <div className="gallery-overlay">
                <span>Commencement</span>
              </div>
            </div>
            <div className="gallery-item depth-image">
              <img src="https://www.asurams.edu/images/ou_images/College-of-Arts-and-Sciences.jpg" alt="Arts and Sciences" loading="lazy" />
              <div className="gallery-overlay">
                <span>Academic Excellence</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="sl-cta section">
        <div className="container sl-cta-content">
          <div className="gold-line" style={{ margin: '0 auto 20px' }} />
          <h2>See For Yourself</h2>
          <p>The best way to experience Albany State is in person. Schedule a campus tour and discover your future home.</p>
          <div className="sl-cta-actions">
            <a href="/apply" onClick={(e) => { e.preventDefault(); navigate('/apply') }} className="btn-primary" data-cursor-text="Visit">
              <span>Schedule a Visit</span>
              <IconArrowRight size={18} />
            </a>
            <a href="/apply" onClick={(e) => { e.preventDefault(); navigate('/apply') }} className="btn-outline" data-cursor-text="Apply">
              <span>Apply Now</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
