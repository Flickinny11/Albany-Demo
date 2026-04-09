import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IconArrowRight } from '../icons/CustomIcons'
import './About.scss'

gsap.registerPlugin(ScrollTrigger)

const TIMELINE = [
  { year: '1903', title: 'The Beginning', desc: 'Joseph Winthrop Holley founds the Albany Bible and Manual Training Institute with a vision to educate and uplift.' },
  { year: '1917', title: 'Growth & Expansion', desc: 'Renamed the Georgia Normal and Agricultural College, expanding its academic mission across the state.' },
  { year: '1943', title: 'Becoming Albany State', desc: 'The institution becomes Albany State College, establishing itself as a cornerstone of higher education in Southwest Georgia.' },
  { year: '1996', title: 'University Status', desc: 'Albany State College achieves university status, becoming Albany State University — a testament to decades of academic excellence.' },
  { year: '2017', title: 'A New Chapter', desc: 'ASU consolidates with Darton State College, creating a comprehensive university with two campuses and expanded program offerings.' },
  { year: 'Today', title: '123+ Years of Excellence', desc: 'A nationally top-ranked HBCU offering 80+ degree programs with over 6,000 students carrying the Golden Ram legacy forward.' },
]

export default function About() {
  const timelineRef = useRef(null)
  const heroRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero parallax
      gsap.to('.about-hero-img', {
        y: 120,
        ease: 'none',
        scrollTrigger: {
          trigger: '.about-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        }
      })

      // Hero content
      gsap.fromTo('.about-hero-content > *', {
        y: 40, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.15, duration: 1, ease: 'power3.out', delay: 0.2
      })

      // Timeline items
      const timelineItems = document.querySelectorAll('.timeline-item')
      timelineItems.forEach((item, i) => {
        gsap.fromTo(item, {
          x: i % 2 === 0 ? -60 : 60,
          opacity: 0,
        }, {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 80%',
          }
        })
      })

      // Timeline line draw
      gsap.fromTo('.timeline-line-fill', {
        scaleY: 0,
      }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.timeline-wrapper',
          start: 'top 60%',
          end: 'bottom 40%',
          scrub: true,
        }
      })

      // Mission section
      gsap.fromTo('.mission-text > *', {
        y: 50, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.12, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '.mission-section', start: 'top 70%' }
      })

      // Campus cards
      gsap.fromTo('.campus-card', {
        y: 60, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.2, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '.campuses-section', start: 'top 70%' }
      })

      // Counter animation
      const counterEl = document.querySelector('.years-counter')
      if (counterEl) {
        gsap.fromTo(counterEl, { innerText: 0 }, {
          innerText: 123,
          duration: 2.5,
          ease: 'power2.out',
          snap: { innerText: 1 },
          scrollTrigger: { trigger: counterEl, start: 'top 80%' },
          onUpdate: function() {
            counterEl.textContent = Math.floor(this.targets()[0].innerText)
          }
        })
      }

    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="about-page">
      {/* Hero */}
      <section className="about-hero" ref={heroRef}>
        <div className="about-hero-bg">
          <img
            src="https://www.asurams.edu/images/ou_images/College-of-Arts-and-Sciences.jpg"
            alt="Albany State University Campus"
            className="about-hero-img"
          />
          <div className="about-hero-overlay" />
          <div className="about-hero-vignette" />
        </div>
        <div className="container about-hero-content">
          <div className="gold-line" />
          <h1>About Albany State</h1>
          <p className="about-hero-sub">
            For more than a century, Albany State University has shaped leaders, thinkers, and innovators. Rooted in the rich traditions of the HBCU experience, we continue to transform lives and communities.
          </p>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="mission-section section">
        <div className="container mission-grid">
          <div className="mission-text">
            <div className="gold-line" />
            <h2>Our Mission</h2>
            <p className="mission-statement">
              Albany State University — a proud institution within the University System of Georgia — educates students to become contributors to a globally diverse society through excellence in teaching, research, creative expression, and public service.
            </p>
            <div className="mission-values">
              <div className="value-item">
                <span className="value-number">01</span>
                <div>
                  <h4>Academic Excellence</h4>
                  <p>Rigorous programs that prepare students for career success and lifelong learning.</p>
                </div>
              </div>
              <div className="value-item">
                <span className="value-number">02</span>
                <div>
                  <h4>Student Success</h4>
                  <p>A supportive environment where every Golden Ram has the resources to thrive.</p>
                </div>
              </div>
              <div className="value-item">
                <span className="value-number">03</span>
                <div>
                  <h4>Community Impact</h4>
                  <p>Transforming Southwest Georgia and beyond through research, service, and engagement.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mission-counter">
            <span className="years-counter">0</span>
            <span className="years-plus">+</span>
            <p>Years of Excellence</p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="timeline-section section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="gold-line" style={{ margin: '0 auto 20px' }} />
            <h2 className="section-title">Our History</h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>From a small institute in 1903 to a nationally recognized university today.</p>
          </div>
          <div className="timeline-wrapper" ref={timelineRef}>
            <div className="timeline-line">
              <div className="timeline-line-fill" />
            </div>
            {TIMELINE.map((item, i) => (
              <div key={i} className={`timeline-item ${i % 2 === 0 ? 'timeline-left' : 'timeline-right'}`}>
                <div className="timeline-dot" />
                <div className="timeline-card card-3d">
                  <span className="timeline-year">{item.year}</span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campuses */}
      <section className="campuses-section section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="gold-line" style={{ margin: '0 auto 20px' }} />
            <h2 className="section-title">Our Campuses</h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>Two beautiful campuses in Albany, Georgia — united in one mission.</p>
          </div>
          <div className="campus-grid">
            <div className="campus-card card-3d">
              <div className="campus-img depth-image">
                <img src="https://www.asurams.edu/images/ou_images/College-of-Arts-and-Sciences.jpg" alt="East Campus" loading="lazy" />
              </div>
              <div className="campus-info">
                <span className="campus-badge">East Campus</span>
                <h3>504 College Drive</h3>
                <p>Albany, GA 31705</p>
                <p className="campus-desc">The historic heart of Albany State — home to the main administrative offices, residence halls, and the iconic Golden Ram spirit.</p>
              </div>
            </div>
            <div className="campus-card card-3d">
              <div className="campus-img depth-image">
                <img src="https://www.asurams.edu/images/ou_images/Darton-College-of-Health-Professions.jpg" alt="West Campus" loading="lazy" />
              </div>
              <div className="campus-info">
                <span className="campus-badge">West Campus</span>
                <h3>2400 Gillionville Road</h3>
                <p>Albany, GA 31707</p>
                <p className="campus-desc">Home to the Darton College of Health Professions and expanded academic facilities — where healthcare leaders are made.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
