import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './LivingCampus.scss'

gsap.registerPlugin(ScrollTrigger)

// ASU East Campus center
const CAMPUS_CENTER = { lat: 31.5785, lng: -84.1557 }

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || 'AIzaSyC1Yv_6yzUAx-p3LaYNEM-9f--G0eTVsnI'

const HOTSPOTS = [
  {
    id: 'admin',
    label: 'Office of the President',
    info: 'Home to university leadership and administration',
  },
  {
    id: 'student-center',
    label: 'Student Life Hub',
    info: 'Dining, organizations, and campus events',
  },
  {
    id: 'arts-sciences',
    label: 'College of Arts & Sciences',
    info: '10+ degree programs in liberal arts and STEM',
  },
  {
    id: 'health',
    label: 'Darton College of Health Professions',
    info: 'Nursing, Respiratory Therapy, Dental Hygiene',
  },
  {
    id: 'library',
    label: 'James Pendergrast Memorial Library',
    info: '24/7 study spaces and digital resources',
  },
]

// Google Maps embed URL — works without API key, shows real satellite imagery
const MAPS_EMBED_URL = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3385.5!2d${CAMPUS_CENTER.lng}!3d${CAMPUS_CENTER.lat}!2m3!1f0!2f39.06!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88f18f6b7c2cb3bd%3A0x72de1c10fce94475!2sAlbany%20State%20University!5e1!3m2!1sen!2sus`

// Try Google Maps 3D API (needs working API key)
function loadGoogleMaps3D() {
  return new Promise((resolve) => {
    if (window.google?.maps?.maps3d?.Map3DElement) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=alpha&libraries=maps3d`
    script.async = true
    script.onerror = () => resolve(false)
    script.onload = () => {
      const interval = setInterval(() => {
        if (window.google?.maps?.maps3d?.Map3DElement) {
          clearInterval(interval)
          resolve(true)
        }
      }, 200)
      setTimeout(() => { clearInterval(interval); resolve(false) }, 8000)
    }
    document.head.appendChild(script)
    setTimeout(() => resolve(false), 10000)
  })
}

function startOrbitAnimation(map3D) {
  if (!map3D) return
  if (map3D.flyCameraTo) {
    map3D.flyCameraTo({
      endCamera: {
        center: { lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng, altitude: 50 },
        tilt: 65,
        heading: 45,
        range: 600,
      },
      durationMillis: 3000,
    })
    setTimeout(() => {
      if (map3D.flyCameraAround) {
        map3D.flyCameraAround({
          camera: {
            center: { lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng, altitude: 50 },
            tilt: 60,
            range: 600,
          },
          durationMillis: 60000,
          rounds: -1,
        })
      }
    }, 3500)
  }
}

export default function LivingCampus() {
  const sectionRef = useRef(null)
  const mapContainerRef = useRef(null)
  const [activeHotspot, setActiveHotspot] = useState(null)
  // 'loading' | '3d' | 'embed'
  const [mapMode, setMapMode] = useState('loading')

  useEffect(() => {
    let cancelled = false

    async function initMap() {
      try {
        const has3D = await loadGoogleMaps3D()

        if (cancelled) return

        if (has3D && window.google?.maps?.maps3d?.Map3DElement) {
          // 3D API available — use it
          const container = mapContainerRef.current
          if (!container) return

          const map3D = new window.google.maps.maps3d.Map3DElement({
            center: { lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng, altitude: 200 },
            tilt: 60,
            heading: 0,
            range: 800,
            defaultLabelsDisabled: false,
          })

          // Clear loading state and insert map
          container.querySelectorAll('.campus-map-loading').forEach(el => el.remove())
          container.appendChild(map3D)
          setMapMode('3d')

          let orbitStarted = false
          map3D.addEventListener('gmp-ready', () => {
            if (!orbitStarted) {
              orbitStarted = true
              startOrbitAnimation(map3D)
            }
          })
          setTimeout(() => {
            if (!orbitStarted) {
              orbitStarted = true
              startOrbitAnimation(map3D)
            }
          }, 4000)
        } else {
          // 3D not available — use embedded Google Maps (no API key needed)
          if (!cancelled) setMapMode('embed')
        }
      } catch {
        if (!cancelled) setMapMode('embed')
      }
    }

    initMap()

    const ctx = gsap.context(() => {
      gsap.fromTo('.campus-header > *', {
        y: 40, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.12, duration: 0.8, ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        }
      })
    })

    return () => {
      cancelled = true
      ctx.revert()
    }
  }, [])

  return (
    <section ref={sectionRef} className="living-campus-section">
      <div className="campus-section-inner">
        <div className="campus-header">
          <div className="campus-eyebrow">EXPLORE CAMPUS</div>
          <h2 className="campus-title">Your Campus. <em>Your Home.</em></h2>
          <p className="campus-sub">
            Explore Albany State University&apos;s historic East Campus — real satellite imagery, interactive controls.
          </p>
        </div>

        <div className="campus-map-wrapper">
          <div ref={mapContainerRef} className="campus-map-container">
            {/* Loading spinner */}
            {mapMode === 'loading' && (
              <div className="campus-map-loading">
                <div className="loading-spinner" />
                <span>Loading campus view...</span>
              </div>
            )}

            {/* Embedded Google Maps — always works, no API key needed */}
            {mapMode === 'embed' && (
              <iframe
                className="campus-embed-map"
                src={MAPS_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="eager"
                referrerPolicy="no-referrer-when-downgrade"
                title="Albany State University Campus Map"
              />
            )}
          </div>

          {/* Vignette */}
          <div className="campus-vignette" />

          {/* Hotspot markers */}
          <div className="campus-hotspots">
            {HOTSPOTS.map((spot, i) => (
              <div
                key={spot.id}
                className={`campus-hotspot ${activeHotspot === spot.id ? 'active' : ''}`}
                style={{
                  top: `${30 + (i % 3) * 18}%`,
                  left: `${15 + i * 16}%`,
                }}
                onMouseEnter={() => setActiveHotspot(spot.id)}
                onMouseLeave={() => setActiveHotspot(null)}
                onClick={() => setActiveHotspot(activeHotspot === spot.id ? null : spot.id)}
              >
                <div className="hotspot-marker">
                  <div className="hotspot-dot" />
                  <div className="hotspot-ring" />
                </div>
                <div className="hotspot-card">
                  <div className="hotspot-card-accent" />
                  <strong>{spot.label}</strong>
                  <span>{spot.info}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="campus-mobile-hint">
          <span>Tap and drag to explore campus</span>
        </div>
      </div>
    </section>
  )
}
