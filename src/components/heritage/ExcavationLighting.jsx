import { Environment, Lightformer } from '@react-three/drei'

/**
 * Studio-quality lighting setup for geological layers.
 * Uses Environment IBL with custom Lightformers for rim lighting,
 * plus a 3-point light rig for dramatic stone rendering.
 */
export default function ExcavationLighting() {
  return (
    <>
      <ambientLight intensity={0.1} color="#0a0a1a" />

      {/* Key light — warm directional with shadow map */}
      <directionalLight
        position={[3, 8, 5]}
        intensity={2.0}
        color="#fff0d4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      {/* Fill light — cool blue from the side */}
      <directionalLight position={[-5, 3, -2]} intensity={0.3} color="#6688cc" />

      {/* Rim light — golden accent from below */}
      <pointLight
        position={[0, -4, -3]}
        intensity={0.5}
        color="#D4A843"
        distance={20}
        decay={2}
      />

      {/* Hemisphere for natural sky/ground fill */}
      <hemisphereLight color="#fff8e8" groundColor="#0a0a1a" intensity={0.25} />

      {/* Image-Based Lighting with custom Lightformers */}
      <Environment preset="warehouse" background={false} environmentIntensity={0.8}>
        {/* Large warm key panel — drives gold highlights on stone */}
        <Lightformer
          form="rect"
          intensity={2}
          position={[0, 5, -5]}
          scale={[10, 2, 1]}
          color="#D4A843"
        />
        {/* Bottom ring — warm glow from below */}
        <Lightformer
          form="ring"
          intensity={1.5}
          position={[0, -3, 0]}
          scale={3}
          color="#FFFFFF"
        />
        {/* Cool fill panel — adds blue accent to shadow side */}
        <Lightformer
          form="rect"
          intensity={0.6}
          color="#6688cc"
          scale={[8, 4]}
          position={[-6, 3, 2]}
        />
      </Environment>
    </>
  )
}
