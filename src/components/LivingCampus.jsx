import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './LivingCampus.scss'

gsap.registerPlugin(ScrollTrigger)

// ASU East Campus center
const CAMPUS_CENTER = { lat: 31.5785, lng: -84.1557 }

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

// Wait for Google Maps API to be fully loaded
function waitForGoogleMaps() {
  return new Promise((resolve) => {
    if (window.google?.maps?.maps3d?.Map3DElement) {
      resolve()
      return
    }
    const interval = setInterval(() => {
      if (window.google?.maps?.maps3d?.Map3DElement) {
        clearInterval(interval)
        resolve()
      }
    }, 100)
    setTimeout(() => {
      clearInterval(interval)
      resolve()
    }, 15000)
  })
}

function startOrbitAnimation(map3D) {
  if (!map3D) return

  // Fly to a cinematic angle first
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

    // Then start orbiting
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
  const map3dRef = useRef(null)
  const [activeHotspot, setActiveHotspot] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)
  const orbitStartedRef = useRef(false)

  // Initialize map on mount
  useEffect(() => {
    let cancelled = false

    async function initMap() {
      try {
        await waitForGoogleMaps()

        if (cancelled) return

        if (!window.google?.maps?.maps3d?.Map3DElement) {
          setMapError(true)
          return
        }

        const container = mapContainerRef.current
        if (!container) return

        container.innerHTML = ''

        const map3D = new window.google.maps.maps3d.Map3DElement({
          center: { lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng, altitude: 200 },
          tilt: 60,
          heading: 0,
          range: 800,
          defaultLabelsDisabled: false,
        })

        container.appendChild(map3D)
        map3dRef.current = map3D

        const onReady = () => {
          if (cancelled) return
          setMapLoaded(true)
          if (!orbitStartedRef.current) {
            orbitStartedRef.current = true
            startOrbitAnimation(map3D)
          }
        }

        map3D.addEventListener('gmp-ready', onReady)

        // Fallback timeout in case gmp-ready doesn't fire
        setTimeout(() => {
          if (!cancelled && !orbitStartedRef.current) {
            setMapLoaded(true)
            orbitStartedRef.current = true
            startOrbitAnimation(map3D)
          }
        }, 4000)
      } catch (err) {
        if (!cancelled) {
          console.warn('LivingCampus: Map init error', err)
          setMapError(true)
        }
      }
    }

    initMap()

    // GSAP scroll animation for section reveal
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
            Explore Albany State University&apos;s historic East Campus in immersive 3D.
          </p>
        </div>

        <div className="campus-map-wrapper">
          <div ref={mapContainerRef} className="campus-map-container">
            {!mapLoaded && !mapError && (
              <div className="campus-map-loading">
                <div className="loading-spinner" />
                <span>Loading campus view...</span>
              </div>
            )}
            {mapError && (
              <div className="campus-map-fallback">
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=31.5785,-84.1557&zoom=17&size=1200x800&maptype=satellite&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || 'AIzaSyC1Yv_6yzUAx-p3LaYNEM-9f--G0eTVsnI'}`}
                  alt="Albany State University Campus"
                  className="campus-fallback-img"
                />
                <div className="campus-fallback-overlay" />
              </div>
            )}
          </div>

          <div className="campus-vignette" />

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
