import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './LivingCampus.scss'

gsap.registerPlugin(ScrollTrigger)

const CAMPUS_CENTER = { lat: 31.5785, lng: -84.1557 }
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || 'AIzaSyC1Yv_6yzUAx-p3LaYNEM-9f--G0eTVsnI'

const HOTSPOTS = [
  { id: 'admin', label: 'Office of the President', info: 'Home to university leadership and administration', lat: 31.5790, lng: -84.1555 },
  { id: 'student-center', label: 'Student Life Hub', info: 'Dining, organizations, and campus events', lat: 31.5782, lng: -84.1560 },
  { id: 'arts-sciences', label: 'College of Arts & Sciences', info: '10+ degree programs in liberal arts and STEM', lat: 31.5788, lng: -84.1548 },
  { id: 'health', label: 'Darton College of Health Professions', info: 'Nursing, Respiratory Therapy, Dental Hygiene', lat: 31.5780, lng: -84.1565 },
  { id: 'library', label: 'James Pendergrast Memorial Library', info: '24/7 study spaces and digital resources', lat: 31.5785, lng: -84.1552 },
]

// ── Google Maps 3D loader ──
function loadGoogleMaps3D() {
  return new Promise((resolve) => {
    if (window.google?.maps?.maps3d?.Map3DElement) {
      resolve(true)
      return
    }
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const t = setInterval(() => {
        if (window.google?.maps?.maps3d?.Map3DElement) { clearInterval(t); resolve(true) }
      }, 200)
      setTimeout(() => { clearInterval(t); resolve(false) }, 10000)
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=alpha&libraries=maps3d`
    script.async = true
    script.onerror = () => resolve(false)
    script.onload = () => {
      const t = setInterval(() => {
        if (window.google?.maps?.maps3d?.Map3DElement) { clearInterval(t); resolve(true) }
      }, 200)
      setTimeout(() => { clearInterval(t); resolve(false) }, 10000)
    }
    document.head.appendChild(script)
    setTimeout(() => resolve(false), 12000)
  })
}

// ── MapLibre fallback with ESRI satellite tiles ──
async function initMapLibreFallback(container) {
  const maplibregl = (await import('maplibre-gl')).default
  // Import MapLibre CSS
  await import('maplibre-gl/dist/maplibre-gl.css')

  const map = new maplibregl.Map({
    container,
    style: {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          maxzoom: 19,
        }
      },
      layers: [{
        id: 'satellite',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 19,
      }],
    },
    center: [CAMPUS_CENTER.lng, CAMPUS_CENTER.lat],
    zoom: 17,
    pitch: 60,
    bearing: 0,
    antialias: true,
    maxBounds: [
      [CAMPUS_CENTER.lng - 0.01, CAMPUS_CENTER.lat - 0.01],
      [CAMPUS_CENTER.lng + 0.01, CAMPUS_CENTER.lat + 0.01],
    ],
  })

  // Navigation controls
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')

  // Add hotspot markers
  map.on('load', () => {
    HOTSPOTS.forEach((spot) => {
      const markerEl = document.createElement('div')
      markerEl.className = 'maplibre-marker'
      markerEl.innerHTML = '<div class="hotspot-dot"></div><div class="hotspot-ring"></div>'

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false,
        className: 'campus-popup',
      }).setHTML(`
        <div class="popup-accent"></div>
        <strong>${spot.label}</strong>
        <span>${spot.info}</span>
      `)

      new maplibregl.Marker({ element: markerEl })
        .setLngLat([spot.lng, spot.lat])
        .setPopup(popup)
        .addTo(map)
    })

    // Gentle auto-orbit
    let bearing = 0
    let orbiting = true

    function orbit() {
      if (!orbiting) return
      bearing = (bearing + 0.1) % 360
      map.rotateTo(bearing, { duration: 0 })
      requestAnimationFrame(orbit)
    }
    orbit()

    // Pause orbit on user interaction, resume after
    map.on('mousedown', () => { orbiting = false })
    map.on('touchstart', () => { orbiting = false })
    map.on('mouseup', () => { setTimeout(() => { orbiting = true; orbit() }, 3000) })
    map.on('touchend', () => { setTimeout(() => { orbiting = true; orbit() }, 3000) })
  })

  return map
}

export default function LivingCampus() {
  const sectionRef = useRef(null)
  const mapContainerRef = useRef(null)
  const [activeHotspot, setActiveHotspot] = useState(null)
  // 'loading' | '3d' | 'maplibre'
  const [mapMode, setMapMode] = useState('loading')

  useEffect(() => {
    let cancelled = false
    let maplibreInstance = null

    async function initMap() {
      try {
        // Try Google Maps 3D first (Approach A)
        const has3D = await loadGoogleMaps3D()
        if (cancelled) return

        if (has3D && window.google?.maps?.maps3d?.Map3DElement) {
          const container = mapContainerRef.current
          if (!container) return

          const map3D = new window.google.maps.maps3d.Map3DElement({
            center: { lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng, altitude: 200 },
            tilt: 60,
            heading: 0,
            range: 800,
            defaultLabelsDisabled: false,
          })

          // Remove loading spinner
          container.querySelectorAll('.campus-map-loading').forEach(el => el.remove())
          container.appendChild(map3D)
          setMapMode('3d')

          // Cinematic flythrough then orbit
          let orbitStarted = false
          const startOrbit = () => {
            if (orbitStarted) return
            orbitStarted = true
            // Fly to cinematic angle
            if (map3D.flyCameraTo) {
              map3D.flyCameraTo({
                endCamera: {
                  center: { lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng, altitude: 50 },
                  tilt: 67.5,
                  heading: 45,
                  range: 600,
                },
                durationMillis: 3000,
              })
              // Then orbit
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

          map3D.addEventListener('gmp-ready', startOrbit)
          setTimeout(startOrbit, 5000)
          return
        }

        // Fallback: MapLibre GL JS with ESRI satellite tiles
        if (cancelled) return
        const container = mapContainerRef.current
        if (!container) return

        // Create a div for MapLibre inside the container
        const mapDiv = document.createElement('div')
        mapDiv.className = 'maplibre-container'
        mapDiv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'
        container.querySelectorAll('.campus-map-loading').forEach(el => el.remove())
        container.appendChild(mapDiv)

        maplibreInstance = await initMapLibreFallback(mapDiv)
        if (!cancelled) setMapMode('maplibre')
      } catch (err) {
        console.warn('LivingCampus init error:', err)
        if (!cancelled) setMapMode('maplibre')
      }
    }

    initMap()

    const ctx = gsap.context(() => {
      gsap.fromTo('.living-campus-section .campus-header > *', {
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
      if (maplibreInstance) maplibreInstance.remove()
    }
  }, [])

  // For Google Maps 3D mode, hotspots are overlay HTML
  // For MapLibre mode, hotspots are actual map markers (added in initMapLibreFallback)
  const showOverlayHotspots = mapMode === '3d'

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
            {mapMode === 'loading' && (
              <div className="campus-map-loading">
                <div className="loading-spinner" />
                <span>Loading campus view...</span>
              </div>
            )}
          </div>

          <div className="campus-vignette" />

          {showOverlayHotspots && (
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
          )}
        </div>

        <div className="campus-mobile-hint">
          <span>Tap and drag to explore campus</span>
        </div>
      </div>
    </section>
  )
}
