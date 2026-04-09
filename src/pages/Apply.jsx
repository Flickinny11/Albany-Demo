import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IconArrowRight, IconCheckmark } from '../icons/CustomIcons'
import './Apply.scss'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  { num: '01', title: 'Choose Your Path', desc: 'Select your admission type — First-Year, Transfer, Graduate, International, Readmission, or Dual Enrollment.' },
  { num: '02', title: 'Complete the Application', desc: 'Fill out the online application at apply.asurams.edu. Use code RAMSAPPLY26 to waive the application fee.' },
  { num: '03', title: 'Submit Documents', desc: 'Send official transcripts, test scores (if applicable), and any required supplementary documents.' },
  { num: '04', title: 'Receive Your Decision', desc: 'Our admissions team reviews your application and notifies you of the decision.' },
  { num: '05', title: 'Enroll & Become a Ram', desc: 'Accept your offer, attend orientation, register for classes, and join the Golden Ram family.' },
]

const ADMISSION_TYPES = [
  { title: 'First-Year', desc: 'High school graduates and GED holders ready to start their college journey.' },
  { title: 'Transfer', desc: 'Students transferring from another college or university.' },
  { title: 'Graduate', desc: 'Students pursuing a master\'s degree or graduate certificate.' },
  { title: 'International', desc: 'Students from outside the United States seeking a world-class education.' },
  { title: 'Readmission', desc: 'Former ASU students returning to complete their degree.' },
  { title: 'Dual Enrollment', desc: 'High school students earning college credit early.' },
]

export default function Apply() {
  const stepsRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero
      gsap.fromTo('.apply-hero-content > *', {
        y: 40, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.12, duration: 1, ease: 'power3.out', delay: 0.2
      })

      // Fee waiver banner
      gsap.fromTo('.fee-waiver-banner', {
        y: 30, opacity: 0, scale: 0.98,
      }, {
        y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '.fee-waiver-banner', start: 'top 85%' }
      })

      // Steps
      gsap.fromTo('.step-item', {
        x: -40, opacity: 0,
      }, {
        x: 0, opacity: 1, stagger: 0.12, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.steps-section', start: 'top 70%' }
      })

      // Step line draw
      gsap.fromTo('.steps-line-fill', {
        scaleY: 0,
      }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.steps-wrapper',
          start: 'top 60%',
          end: 'bottom 50%',
          scrub: true,
        }
      })

      // Admission types
      gsap.fromTo('.admission-card', {
        y: 40, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: '.admission-types', start: 'top 75%' }
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <div className="apply-page">
      {/* Hero */}
      <section className="apply-hero">
        <div className="apply-hero-bg">
          <img src="https://www.asurams.edu/images/graduate%20photo%205.jpg" alt="Apply to ASU" className="apply-hero-img" />
          <div className="apply-hero-overlay" />
        </div>
        <div className="container apply-hero-content">
          <div className="gold-line" />
          <h1>Apply to Albany State</h1>
          <p>Your future as a Golden Ram starts with a single step. Apply today and discover what makes Albany State one of America's top HBCUs.</p>
          <div className="apply-hero-actions">
            <a href="https://apply.asurams.edu/" target="_blank" rel="noopener noreferrer" className="btn-primary" data-cursor-text="Apply">
              <span>Start Your Application</span>
              <IconArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* Fee Waiver */}
      <section className="fee-waiver-section section">
        <div className="container">
          <div className="fee-waiver-banner">
            <div className="fee-waiver-content">
              <div className="fee-waiver-badge">Limited Time</div>
              <h2>Application Fee Waived</h2>
              <p>Apply for free using the code below. No barriers between you and your future.</p>
              <div className="fee-waiver-code">
                <span className="code-label">Use Code:</span>
                <span className="code-value">RAMSAPPLY26</span>
              </div>
              <a href="https://apply.asurams.edu/" target="_blank" rel="noopener noreferrer" className="btn-primary" data-cursor-text="Apply Free">
                <span>Apply Now — It's Free</span>
                <IconArrowRight size={18} />
              </a>
            </div>
            <div className="fee-waiver-decoration">
              <div className="fw-circle fw-circle-1" />
              <div className="fw-circle fw-circle-2" />
              <div className="fw-circle fw-circle-3" />
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="steps-section section">
        <div className="container">
          <div className="section-header">
            <div className="gold-line" />
            <h2 className="section-title">How to Apply</h2>
            <p className="section-subtitle">Five simple steps to becoming a Golden Ram.</p>
          </div>
          <div className="steps-wrapper" ref={stepsRef}>
            <div className="steps-line">
              <div className="steps-line-fill" />
            </div>
            {STEPS.map((step, i) => (
              <div key={i} className="step-item">
                <div className="step-number-wrap">
                  <span className="step-number">{step.num}</span>
                </div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admission Types */}
      <section className="admission-types section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="gold-line" style={{ margin: '0 auto 20px' }} />
            <h2 className="section-title">Admission Types</h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>No matter where you are in your journey, there's a path to ASU.</p>
          </div>
          <div className="admission-grid">
            {ADMISSION_TYPES.map((type, i) => (
              <div key={i} className="admission-card card-3d" data-cursor-text="Learn More">
                <div className="admission-check">
                  <IconCheckmark size={20} />
                </div>
                <h3>{type.title}</h3>
                <p>{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="apply-final-cta section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Don't Wait — Your Future Is Calling</h2>
          <p>Join over 6,000 students who chose Albany State. Use code <strong>RAMSAPPLY26</strong> for a free application.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '32px', flexWrap: 'wrap' }}>
            <a href="https://apply.asurams.edu/" target="_blank" rel="noopener noreferrer" className="btn-primary" data-cursor-text="Apply">
              <span>Start Your Application</span>
              <IconArrowRight size={18} />
            </a>
          </div>
          <p className="apply-phone">Questions? Call us at <a href="tel:2295002000">(229) 500-2000</a></p>
        </div>
      </section>
    </div>
  )
}
