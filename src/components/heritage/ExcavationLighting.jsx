import { Environment, Lightformer } from '@react-three/drei'

/**
 * Studio-quality lighting for photorealistic geological layer rendering.
 * Uses warehouse HDRI for large soft highlights + custom Lightformers for
 * studio rim/key lighting. 3-point rig adds directionality for stone depth.
 *
 * Research-driven: HDRI is the single biggest factor for photorealism.
 * envMapIntensity on materials should be 0.8-1.0 to look natural.
 */
export default function ExcavationLighting() {
  return (
    <>
      {/* Subtle ambient — very low, let HDRI do the work */}
      <ambientLight intensity={0.05} color="#0a0a1a" />

      {/* Key light — warm directional with high-quality shadow map */}
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.5}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />

      {/* Fill light — cooler, defines shadow side */}
      <directionalLight
        position={[-3, 4, -2]}
        intensity={0.4}
        color="#e6f0ff"
      />

      {/* Rim/back light — defines edges, creates depth separation */}
      <directionalLight
        position={[-2, 6, -5]}
        intensity={0.8}
        color="#ffffff"
      />

      {/* Ground bounce — subtle warm uplight for underside detail */}
      <pointLight
        position={[0, -4, -3]}
        intensity={0.3}
        color="#D4A843"
        distance={20}
        decay={2}
      />

      {/* Hemisphere for natural sky/ground fill */}
      <hemisphereLight color="#fff8e8" groundColor="#0a0a1a" intensity={0.15} />

      {/* High-quality HDRI environment with custom Lightformers */}
      <Environment preset="warehouse" background={false} environmentIntensity={1.0}>
        {/* Large soft overhead panel — primary stone illumination */}
        <Lightformer
          form="rect"
          intensity={2.0}
          position={[0, 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 4, 1]}
          color="#ffffff"
        />
        {/* Gold-tinted accent panel — drives warm highlights on stone */}
        <Lightformer
          form="rect"
          intensity={1.8}
          position={[0, 5, -5]}
          scale={[10, 2, 1]}
          color="#D4A843"
        />
        {/* Cool side panel — blue accent for shadow side depth */}
        <Lightformer
          form="rect"
          intensity={0.8}
          color="#6688cc"
          scale={[4, 2, 1]}
          position={[-6, 3, 2]}
          rotation={[0, Math.PI / 3, 0]}
        />
        {/* Bottom ring — warm glow from below for rim separation */}
        <Lightformer
          form="ring"
          intensity={1.2}
          position={[0, -3, 0]}
          scale={3}
          color="#FFFFFF"
        />
        {/* Small bright specular highlight — creates that "photo studio" look */}
        <Lightformer
          form="circle"
          intensity={4.0}
          position={[2, 4, -3]}
          scale={[0.5, 0.5, 1]}
          color="#ffffff"
        />
        {/* Ground fill — warm bounce from below */}
        <Lightformer
          form="rect"
          intensity={0.3}
          position={[0, -1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[20, 20, 1]}
          color="#e8ddd0"
        />
      </Environment>
    </>
  )
}
