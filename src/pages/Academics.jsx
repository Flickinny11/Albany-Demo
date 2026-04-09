import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IconHealthcare, IconBusiness, IconScience, IconGraduation, IconArrowRight } from '../icons/CustomIcons'
import './Academics.scss'

gsap.registerPlugin(ScrollTrigger)

const COLLEGES = [
  {
    id: 'health',
    name: 'Darton College of Health Professions',
    shortName: 'Health Professions',
    icon: IconHealthcare,
    img: 'https://www.asurams.edu/images/ou_images/Darton-College-of-Health-Professions.jpg',
    desc: 'The Darton College of Health Professions prepares students for rewarding careers in healthcare through rigorous academic programs, cutting-edge simulation labs, and extensive clinical partnerships. Our graduates are in high demand across Georgia and the nation.',
    programs: [
      'Nursing (BSN)', 'Biology (Pre-Med)', 'Health Informatics', 'Respiratory Therapy',
      'Histotechnology', 'Emergency Medical Services', 'Health Sciences',
      'Public Health', 'Dental Hygiene', 'Medical Laboratory Technology'
    ]
  },
  {
    id: 'business',
    name: 'College of Business, Education & Professional Studies',
    shortName: 'Professional Studies',
    icon: IconBusiness,
    img: 'https://www.asurams.edu/images/ou_images/College-of-Professional-Studies.jpg',
    desc: 'From business administration to education, criminal justice to social work, this college prepares professionals who lead with integrity. Our programs blend theory with practice through internships, community partnerships, and real-world projects.',
    programs: [
      'Business Administration', 'Accounting', 'Marketing', 'Supply Chain Management',
      'Early Childhood Education', 'Middle Grades Education', 'Special Education',
      'Criminal Justice', 'Social Work', 'Sport Management', 'Psychology'
    ]
  },
  {
    id: 'arts',
    name: 'College of Arts & Sciences',
    shortName: 'Arts & Sciences',
    icon: IconScience,
    img: 'https://www.asurams.edu/images/ou_images/College-of-Arts-and-Sciences.jpg',
    desc: 'The College of Arts & Sciences is the academic core of Albany State — spanning the humanities, natural sciences, mathematics, and social sciences. Our faculty are active researchers and dedicated mentors who inspire the next generation of thinkers.',
    programs: [
      'Biology', 'Chemistry', 'Mathematics', 'Computer Science',
      'English', 'History', 'Political Science', 'Sociology',
      'Music', 'Visual Arts', 'Communication Studies', 'Forensic Science'
    ]
  },
  {
    id: 'graduate',
    name: 'Graduate School',
    shortName: 'Graduate Studies',
    icon: IconGraduation,
    img: 'https://www.asurams.edu/images/graduate%20photo%205.jpg',
    desc: 'The Graduate School offers advanced degrees that propel careers forward. Our programs combine rigorous academics with flexibility for working professionals, and our faculty are leaders in their fields.',
    programs: [
      'MBA', 'M.Ed. in Educational Leadership', 'MS in Criminal Justice',
      'MSN in Nursing', 'MPA in Public Administration', 'MS in Biotechnology',
      'Ed.S. in Educational Leadership', 'MS in Water Resources',
      'MS in Health Sciences', 'Graduate Certificates'
    ]
  },
]

export default function Academics() {
  const [activeCollege, setActiveCollege] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const contentRef = useRef(null)
  const tabIndicatorRef = useRef(null)
  const tabsRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.acad-hero-content > *', {
        y: 40, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.12, duration: 1, ease: 'power3.out', delay: 0.2
      })

      gsap.to('.acad-hero-img', {
        y: 100,
        ease: 'none',
        scrollTrigger: { trigger: '.acad-hero', start: 'top top', end: 'bottom top', scrub: true }
      })

      gsap.fromTo('.explorer-section .section-header > *', {
        y: 30, opacity: 0
      }, {
        y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '.explorer-section', start: 'top 75%' }
      })
    })
    return () => ctx.revert()
  }, [])

  const handleTabChange = (idx) => {
    if (idx === activeCollege) return
    // Animate content out, swap, animate in
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0, y: 20, duration: 0.25, ease: 'power2.in',
        onComplete: () => {
          setActiveCollege(idx)
          gsap.fromTo(contentRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' })
        }
      })
    } else {
      setActiveCollege(idx)
    }
  }

  const college = COLLEGES[activeCollege]
  const Icon = college.icon

  const filteredPrograms = searchTerm
    ? college.programs.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
    : college.programs

  return (
    <div className="academics-page">
      {/* Hero */}
      <section className="acad-hero">
        <div className="acad-hero-bg">
          <img src="https://www.asurams.edu/images/ou_images/College-of-Professional-Studies.jpg" alt="Academics" className="acad-hero-img" />
          <div className="acad-hero-overlay" />
        </div>
        <div className="container acad-hero-content">
          <div className="gold-line" />
          <h1>Academics</h1>
          <p>80+ degree programs across four distinguished colleges — from associate to graduate level. Find the program that fits your passion.</p>
        </div>
      </section>

      {/* College Explorer */}
      <section className="explorer-section section">
        <div className="container">
          <div className="section-header">
            <div className="gold-line" />
            <h2 className="section-title">Explore Our Colleges</h2>
            <p className="section-subtitle">Select a college to discover its programs and opportunities.</p>
          </div>

          {/* Tabs */}
          <div className="college-tabs" ref={tabsRef}>
            {COLLEGES.map((c, i) => {
              const TabIcon = c.icon
              return (
                <button
                  key={c.id}
                  className={`college-tab ${i === activeCollege ? 'active' : ''}`}
                  onClick={() => handleTabChange(i)}
                  data-cursor-text="Select"
                >
                  <TabIcon size={28} color={i === activeCollege ? 'var(--asu-blue)' : 'var(--asu-gray)'} />
                  <span>{c.shortName}</span>
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div ref={contentRef} className="college-content">
            <div className="college-detail-grid">
              <div className="college-detail-img depth-image">
                <img src={college.img} alt={college.name} />
              </div>
              <div className="college-detail-info">
                <div className="college-detail-icon">
                  <Icon size={44} color="var(--asu-blue)" animated />
                </div>
                <h3>{college.name}</h3>
                <p className="college-detail-desc">{college.desc}</p>

                {/* Search */}
                <div className="program-search">
                  <input
                    type="text"
                    placeholder="Search programs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="program-search-input"
                  />
                </div>

                {/* Programs */}
                <div className="program-list">
                  {filteredPrograms.map((program, i) => (
                    <div key={i} className="program-item" data-cursor-text="View">
                      <span className="program-name">{program}</span>
                      <IconArrowRight size={14} color="var(--asu-gray)" />
                    </div>
                  ))}
                  {filteredPrograms.length === 0 && (
                    <p className="no-results">No programs match your search.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="acad-cta section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Ready to Start Your Journey?</h2>
          <p>Explore our full program catalog and find the degree that fits your goals.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '32px', flexWrap: 'wrap' }}>
            <a href="https://apply.asurams.edu/" target="_blank" rel="noopener noreferrer" className="btn-primary" data-cursor-text="Apply">
              <span>Apply Now</span>
              <IconArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
