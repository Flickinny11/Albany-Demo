import { useEffect, useRef } from 'react'
import gsap from 'gsap'

// Healthcare / Medical — stylized heart + pulse
export function IconHealthcare({ size = 48, color = 'var(--asu-blue)', animated = false }) {
  const pathRef = useRef(null)
  useEffect(() => {
    if (animated && pathRef.current) {
      gsap.fromTo(pathRef.current, { strokeDashoffset: 200 }, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.out' })
    }
  }, [animated])
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 42S6 30 6 18a9 9 0 0 1 18-2 9 9 0 0 1 18 2c0 12-18 24-18 24Z" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <path ref={pathRef} d="M10 24h7l3-6 4 12 3-6h11" stroke="var(--asu-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="200" />
    </svg>
  )
}

// Business / Growth — ascending chart arrow
export function IconBusiness({ size = 48, color = 'var(--asu-blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="38" width="6" height="8" rx="1" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5"/>
      <rect x="14" y="30" width="6" height="16" rx="1" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5"/>
      <rect x="24" y="22" width="6" height="24" rx="1" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="1.5"/>
      <rect x="34" y="12" width="6" height="34" rx="1" fill={color} fillOpacity="0.6" stroke={color} strokeWidth="1.5"/>
      <path d="M6 28L18 18L28 22L42 8" stroke="var(--asu-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M36 8h6v6" stroke="var(--asu-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Science / Discovery — atom orbits
export function IconScience({ size = 48, color = 'var(--asu-blue)', animated = false }) {
  const groupRef = useRef(null)
  useEffect(() => {
    if (animated && groupRef.current) {
      gsap.to(groupRef.current, { rotation: 360, duration: 12, repeat: -1, ease: 'none', transformOrigin: '50% 50%' })
    }
  }, [animated])
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="4" fill="var(--asu-gold)"/>
      <g ref={groupRef}>
        <ellipse cx="24" cy="24" rx="18" ry="7" stroke={color} strokeWidth="1.5" fill="none" transform="rotate(0 24 24)"/>
        <ellipse cx="24" cy="24" rx="18" ry="7" stroke={color} strokeWidth="1.5" fill="none" transform="rotate(60 24 24)"/>
        <ellipse cx="24" cy="24" rx="18" ry="7" stroke={color} strokeWidth="1.5" fill="none" transform="rotate(-60 24 24)"/>
      </g>
      <circle cx="42" cy="24" r="2" fill="var(--asu-gold)"/>
      <circle cx="15" cy="11" r="2" fill="var(--asu-gold)"/>
      <circle cx="15" cy="37" r="2" fill="var(--asu-gold)"/>
    </svg>
  )
}

// Graduation / Achievement — cap with motion
export function IconGraduation({ size = 48, color = 'var(--asu-blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 6L2 18l22 12 22-12L24 6Z" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <path d="M10 24v12c0 0 6 6 14 6s14-6 14-6V24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="44" y1="18" x2="44" y2="36" stroke="var(--asu-gold)" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="44" cy="37" r="2" fill="var(--asu-gold)"/>
      <path d="M20 10l4-4 4 4" stroke="var(--asu-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    </svg>
  )
}

// Housing — geometric building
export function IconHousing({ size = 48, color = 'var(--asu-blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4L4 20h4v24h32V20h4L24 4Z" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <rect x="18" y="30" width="12" height="14" rx="1" stroke={color} strokeWidth="2"/>
      <rect x="14" y="22" width="6" height="6" rx="1" fill="var(--asu-gold)" fillOpacity="0.4" stroke="var(--asu-gold)" strokeWidth="1.5"/>
      <rect x="28" y="22" width="6" height="6" rx="1" fill="var(--asu-gold)" fillOpacity="0.4" stroke="var(--asu-gold)" strokeWidth="1.5"/>
      <circle cx="27" cy="37" r="1.5" fill="var(--asu-gold)"/>
    </svg>
  )
}

// Organizations / Community — connected nodes
export function IconOrganizations({ size = 48, color = 'var(--asu-blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="24" y1="14" x2="12" y2="28" stroke={color} strokeWidth="1.5"/>
      <line x1="24" y1="14" x2="36" y2="28" stroke={color} strokeWidth="1.5"/>
      <line x1="12" y1="28" x2="36" y2="28" stroke={color} strokeWidth="1.5"/>
      <line x1="12" y1="28" x2="8" y2="40" stroke={color} strokeWidth="1.5"/>
      <line x1="36" y1="28" x2="40" y2="40" stroke={color} strokeWidth="1.5"/>
      <line x1="24" y1="14" x2="24" y2="4" stroke={color} strokeWidth="1.5"/>
      <circle cx="24" cy="14" r="5" fill="var(--asu-gold)" stroke={color} strokeWidth="1.5"/>
      <circle cx="12" cy="28" r="5" fill="var(--asu-gold)" fillOpacity="0.7" stroke={color} strokeWidth="1.5"/>
      <circle cx="36" cy="28" r="5" fill="var(--asu-gold)" fillOpacity="0.7" stroke={color} strokeWidth="1.5"/>
      <circle cx="8" cy="40" r="3" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5"/>
      <circle cx="40" cy="40" r="3" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5"/>
      <circle cx="24" cy="4" r="3" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5"/>
    </svg>
  )
}

// Athletics — dynamic motion figure
export function IconAthletics({ size = 48, color = 'var(--asu-blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="8" r="5" fill="var(--asu-gold)" stroke={color} strokeWidth="1.5"/>
      <path d="M18 20l8-4 6 6-4 10-8 2" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill={color} fillOpacity="0.1"/>
      <path d="M30 32l4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M22 28l-6 16" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M26 16l10-4" stroke="var(--asu-gold)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 22l10-2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 18l-4-6" stroke="var(--asu-gold)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3"/>
    </svg>
  )
}

// Dining — minimal fork and plate
export function IconDining({ size = 48, color = 'var(--asu-blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="16" fill={color} fillOpacity="0.06" stroke={color} strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="11" stroke={color} strokeWidth="1" strokeDasharray="3 3"/>
      <line x1="16" y1="14" x2="16" y2="26" stroke="var(--asu-gold)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="14" x2="12" y2="22" stroke="var(--asu-gold)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="26" x2="14" y2="40" stroke="var(--asu-gold)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 22h4" stroke="var(--asu-gold)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M32 14c0 0 3 4 3 10s-3 3-3 3v13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Career — briefcase with upward arrow
export function IconCareer({ size = 48, color = 'var(--asu-blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="16" width="36" height="26" rx="3" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2"/>
      <path d="M16 16V12a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" stroke={color} strokeWidth="2"/>
      <line x1="6" y1="28" x2="42" y2="28" stroke={color} strokeWidth="1.5"/>
      <path d="M24 22v-12M20 14l4-4 4 4" stroke="var(--asu-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Safety — shield with check
export function IconSafety({ size = 48, color = 'var(--asu-blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4L6 12v12c0 11 8 18 18 22 10-4 18-11 18-22V12L24 4Z" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <path d="M16 24l6 6 10-12" stroke="var(--asu-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Future Student — compass
export function IconFutureStudent({ size = 48, color = 'var(--asu-blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.05"/>
      <polygon points="24,8 28,22 24,18 20,22" fill="var(--asu-gold)" stroke="var(--asu-gold)" strokeWidth="1"/>
      <polygon points="24,40 20,26 24,30 28,26" fill={color} stroke={color} strokeWidth="1"/>
      <polygon points="8,24 22,20 18,24 22,28" fill={color} fillOpacity="0.5" stroke={color} strokeWidth="1"/>
      <polygon points="40,24 26,28 30,24 26,20" fill={color} fillOpacity="0.5" stroke={color} strokeWidth="1"/>
      <circle cx="24" cy="24" r="3" fill="var(--asu-gold)"/>
    </svg>
  )
}

// Current Student — book/laptop
export function IconCurrentStudent({ size = 48, color = 'var(--asu-blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 10h16v28H6a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2Z" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2"/>
      <path d="M42 10H26v28h16a2 2 0 0 0 2-2V12a2 2 0 0 0-2-2Z" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2"/>
      <line x1="24" y1="10" x2="24" y2="38" stroke="var(--asu-gold)" strokeWidth="2.5"/>
      <line x1="10" y1="18" x2="18" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10" y1="23" x2="18" y2="23" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10" y1="28" x2="16" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="30" y1="18" x2="38" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="30" y1="23" x2="38" y2="23" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="30" y1="28" x2="36" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// Faculty — podium/presentation
export function IconFaculty({ size = 48, color = 'var(--asu-blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="6" width="32" height="22" rx="2" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2"/>
      <rect x="14" y="12" width="20" height="2" rx="1" fill="var(--asu-gold)"/>
      <rect x="14" y="17" width="14" height="2" rx="1" fill={color} fillOpacity="0.4"/>
      <rect x="14" y="22" width="18" height="2" rx="1" fill={color} fillOpacity="0.3"/>
      <path d="M16 28h16v4H16z" fill={color} fillOpacity="0.2"/>
      <path d="M20 32v10M28 32v10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 42h20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// Parent / Family — connected figures
export function IconFamily({ size = 48, color = 'var(--asu-blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="12" r="5" fill="var(--asu-gold)" fillOpacity="0.3" stroke={color} strokeWidth="1.5"/>
      <circle cx="32" cy="12" r="5" fill="var(--asu-gold)" fillOpacity="0.3" stroke={color} strokeWidth="1.5"/>
      <path d="M6 34c0-8 4-12 10-12h0c3 0 5 1 6 3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M42 34c0-8-4-12-10-12h0c-3 0-5 1-6 3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="24" cy="28" r="4" fill="var(--asu-gold)" stroke={color} strokeWidth="1.5"/>
      <path d="M16 44c0-6 3-10 8-10s8 4 8 10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// Alumni — connected rings
export function IconAlumni({ size = 48, color = 'var(--asu-blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="24" r="12" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.05"/>
      <circle cx="30" cy="24" r="12" stroke="var(--asu-gold)" strokeWidth="2" fill="var(--asu-gold)" fillOpacity="0.08"/>
      <path d="M24 14.5c2.5 2.5 4 5.8 4 9.5s-1.5 7-4 9.5c-2.5-2.5-4-5.8-4-9.5s1.5-7 4-9.5Z" fill={color} fillOpacity="0.15"/>
    </svg>
  )
}

// Arrow right for CTAs
export function IconArrowRight({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10h12M12 6l4 4-4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Social media icons
export function IconFacebook({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
}

export function IconTwitter({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 4l6.5 8.5L4 20h2l5.5-6.2L16 20h4l-7-9 6-7h-2l-5 5.7L8 4H4Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
}

export function IconInstagram({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke={color} strokeWidth="1.5"/><circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.5"/><circle cx="17.5" cy="6.5" r="1.5" fill={color}/></svg>
  )
}

export function IconYoutube({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58Z" stroke={color} strokeWidth="1.5"/><polygon points="9.75,15.02 15.5,12 9.75,8.98" fill={color}/></svg>
  )
}

export function IconLinkedin({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6ZM2 9h4v12H2ZM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
}

// Scroll indicator arrow
export function IconScrollDown({ size = 32, color = 'var(--asu-gold)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="12" y="4" width="8" height="16" rx="4" stroke={color} strokeWidth="1.5"/>
      <line x1="16" y1="8" x2="16" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 24l6 4 6-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Menu hamburger
export function IconMenu({ size = 28, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <line x1="4" y1="8" x2="24" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="14" x2="20" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="20" x2="24" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// Close X
export function IconClose({ size = 28, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <line x1="7" y1="7" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="21" y1="7" x2="7" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// Search / Apply / Checkmark for various states
export function IconCheckmark({ size = 20, color = 'var(--asu-gold)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
}
