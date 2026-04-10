import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './LivingCampus.scss'

gsap.registerPlugin(ScrollTrigger)

const CAMPUS_CENTER = { lat: 31.5785, lng: -84.1557 }
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || 'AIzaSyAwfB0WNqV-1kBrge-HHFAo9Vi75E2CLYA'

const HOTSPOTS = [
  { id: 'admin', label: 'Office of the President', info: 'Home to university leadership and administration', lat: 31.5790, lng: -84.1555 },
  { id: 'student-center', label: 'Student Life Hub', info: 'Dining, organizations, and campus events', lat: 31.5782, lng: -84.1560 },
  { id: 'arts-sciences', label: 'College of Arts & Sciences', info: '10+ degree programs in liberal arts and STEM', lat: 31.5788, lng: -84.1548 },
  { id: 'health', label: 'Darton College of Health Professions', info: 'Nursing, Respiratory Therapy, Dental Hygiene', lat: 31.5780, lng: -84.1565 },
  { id: 'library', label: 'James Pendergrast Memorial Library', info: '24/7 study spaces and digital resources', lat: 31.5785, lng: -84.1552 },
]

function loadGoogleMapsAPI() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return }
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const t = setInterval(() => {
        if (window.google?.maps) { clearInterval(t); resolve() }
      }, 150)
      setTimeout(() => { clearInterval(t); reject(new Error('timeout')) }, 15000)
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=beta&loading=async`
    script.async = true
    script.onerror = () => reject(new Error('script load failed'))
    script.onload = () => {
      const t = setInterval(() => {
        if (window.google?.maps) { clearInterval(t); resolve() }
      }, 150)
      setTimeout(() => { clearInterval(t); reject(new Error('init timeout')) }, 15000)
    }
    document.head.appendChild(script)
  })
}

export default function LivingCampus() {
  const sectionRef = useRef(null)
  // This div is NOT managed by React conditional rendering — safe to appendChild into
  const mapSlotRef = useRef(null)
  // 'loading' | '3d' | 'satellite' | 'error'
  const [mapMode, setMapMode] = useState('loading')

  useEffect(() => {
    let cancelled = false

    async function init() {
      const slot = mapSlotRef.current
      if (!slot) { setMapMode('error'); return }

      try {
        await loadGoogleMapsAPI()
        if (cancelled) return

        // Approach A: gmp-map-3d (use importLibrary for dynamic loading — 2026 best practice)
        let Map3DElement = null
        try {
          const maps3d = await window.google.maps.importLibrary('maps3d')
          Map3DElement = maps3d.Map3DElement
        } catch { /* maps3d not available, fall through to Approach B */ }

        if (Map3DElement) {
          const map3D = new Map3DElement({
            center: { lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng, altitude: 200 },
            tilt: 60, heading: 0, range: 800, defaultLabelsDisabled: false,
          })
          slot.appendChild(map3D)
          setMapMode('3d')

          let started = false
          const startOrbit = () => {
            if (started) return
            started = true
            if (map3D.flyCameraTo) {
              map3D.flyCameraTo({
                endCamera: {
                  center: { lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng, altitude: 50 },
                  tilt: 67.5, heading: 45, range: 600,
                },
                durationMillis: 3000,
              })
              setTimeout(() => {
                if (map3D.flyCameraAround) {
                  map3D.flyCameraAround({
                    camera: {
                      center: { lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng, altitude: 50 },
                      tilt: 60, range: 600,
                    },
                    durationMillis: 60000, rounds: -1,
                  })
                }
              }, 3500)
            }
          }
          map3D.addEventListener('gmp-ready', startOrbit)
          setTimeout(startOrbit, 5000)
          return
        }

        // Approach B: Standard Google Maps with satellite + tilt
        const mapsLib = await window.google.maps.importLibrary('maps')
        if (mapsLib?.Map) {
          const { Map: GoogleMap } = mapsLib
          const mapDiv = document.createElement('div')
          mapDiv.style.cssText = 'width:100%;height:100%'
          slot.appendChild(mapDiv)

          const map = new GoogleMap(mapDiv, {
            center: CAMPUS_CENTER, zoom: 17, mapTypeId: 'satellite',
            tilt: 45, heading: 0,
            disableDefaultUI: true, zoomControl: true,
            mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
            gestureHandling: 'cooperative', mapId: 'DEMO_MAP_ID',
          })

          HOTSPOTS.forEach((spot) => {
            const marker = new window.google.maps.Marker({
              position: { lat: spot.lat, lng: spot.lng }, map, title: spot.label,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE, scale: 8,
                fillColor: '#EAAB00', fillOpacity: 1, strokeColor: '#EAAB00', strokeWeight: 2,
              },
            })
            const iw = new window.google.maps.InfoWindow({
              content: `<div style="background:rgba(0,27,77,0.95);padding:14px 18px;border-radius:10px;border-top:3px solid #EAAB00;min-width:180px">
                <strong style="color:#fff;font-size:0.9rem;display:block;margin-bottom:4px">${spot.label}</strong>
                <span style="color:rgba(255,255,255,0.7);font-size:0.75rem">${spot.info}</span>
              </div>`,
            })
            marker.addListener('click', () => iw.open(map, marker))
          })

          let heading = 0, orbiting = true, raf
          function orbit() {
            if (!orbiting) return
            heading = (heading + 0.2) % 360
            map.setHeading(heading)
            raf = requestAnimationFrame(orbit)
          }
          map.addListener('tilesloaded', () => { if (!raf) orbit() })
          map.addListener('mousedown', () => { orbiting = false })
          map.addListener('touchstart', () => { orbiting = false })
          map.addListener('mouseup', () => { setTimeout(() => { orbiting = true; orbit() }, 3000) })
          map.addListener('touchend', () => { setTimeout(() => { orbiting = true; orbit() }, 3000) })

          setMapMode('satellite')
          return
        }

        // Neither approach worked
        if (!cancelled) setMapMode('error')
      } catch (err) {
        console.warn('LivingCampus:', err)
        if (!cancelled) setMapMode('error')
      }
    }

    init()

    const ctx = gsap.context(() => {
      gsap.fromTo('.living-campus-section .campus-header > *', {
        y: 40, opacity: 0,
      }, {
        y: 0, opacity: 1, stagger: 0.12, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })
    })

    return () => { cancelled = true; ctx.revert() }
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
          <div className="campus-map-container">
            {/* This div is the map slot — NOT conditionally rendered, safe for direct DOM manipulation */}
            <div ref={mapSlotRef} className="campus-map-slot" />

            {/* React-controlled overlays */}
            {mapMode === 'loading' && (
              <div className="campus-map-overlay">
                <div className="loading-spinner" />
                <span>Loading campus view...</span>
              </div>
            )}
            {mapMode === 'error' && (
              <div className="campus-map-overlay">
                <p>Unable to load the 3D campus map.</p>
                <p className="campus-error-sub">Please check that the Google Maps API key is configured correctly.</p>
              </div>
            )}
          </div>
          <div className="campus-vignette" />
        </div>

        <div className="campus-mobile-hint">
          <span>Tap and drag to explore campus</span>
        </div>
      </div>
    </section>
  )
}
