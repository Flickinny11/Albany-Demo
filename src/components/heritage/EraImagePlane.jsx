import { useEffect, useRef } from 'react'
import { Curtains, Plane } from 'curtainsjs'
import imageRevealVert from './shaders/imageReveal.vert?raw'
import imageRevealFrag from './shaders/imageReveal.frag?raw'

/**
 * curtainsjs WebGL plane for each historical photograph.
 * Applies GLSL displacement + distortion shaders driven by scroll progress.
 */
export default function EraImagePlane({ src, alt, isActive, progress, curtainsInstance }) {
  const containerRef = useRef()
  const planeRef = useRef()
  const isActiveRef = useRef(isActive)
  const progressRef = useRef(progress)

  // Keep refs in sync with props (avoids stale closure in onRender)
  useEffect(() => {
    isActiveRef.current = isActive
    progressRef.current = progress
  })

  useEffect(() => {
    if (!containerRef.current || !curtainsInstance) return

    try {
      const params = {
        vertexShader: imageRevealVert,
        fragmentShader: imageRevealFrag,
        uniforms: {
          time: { name: 'uTime', type: '1f', value: 0 },
          progress: { name: 'uProgress', type: '1f', value: 0 },
        },
        widthSegments: 20,
        heightSegments: 20,
        texturesOptions: {
          premultiplyAlpha: true,
        },
        crossOrigin: 'anonymous',
      }

      const plane = new Plane(curtainsInstance, containerRef.current, params)

      plane
        .onReady(() => {
          planeRef.current = plane
        })
        .onRender(() => {
          if (plane.uniforms && plane.uniforms.time) {
            plane.uniforms.time.value += 0.008
          }
          if (plane.uniforms && plane.uniforms.progress) {
            plane.uniforms.progress.value = isActiveRef.current ? progressRef.current : 0
          }
        })
        .onError(() => {
          // Image CORS failure — show DOM image as fallback
          if (containerRef.current) {
            containerRef.current.classList.add('era-image-fallback')
          }
        })

      return () => {
        if (plane.remove) plane.remove()
        planeRef.current = null
      }
    } catch (e) {
      console.warn('curtainsjs plane init failed:', e)
    }
  }, [curtainsInstance])

  return (
    <div
      ref={containerRef}
      className="excavation-era-image"
      style={{
        opacity: isActive ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}
    >
      <img
        src={src}
        alt={alt || ''}
        crossOrigin="anonymous"
        loading="lazy"
        data-sampler="uSampler0"
      />
    </div>
  )
}
