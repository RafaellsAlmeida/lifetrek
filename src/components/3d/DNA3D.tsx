// @ts-nocheck
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function DNAHelix() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  const helixPoints = 50;
  const radius = 1;
  const height = 5;

  return (
    <group ref={groupRef}>
      {[...Array(helixPoints)].map((_, i) => {
        const angle = (i / helixPoints) * Math.PI * 4;
        const y = (i / helixPoints) * height - height / 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        const angle2 = angle + Math.PI;
        const x2 = Math.cos(angle2) * radius;
        const z2 = Math.sin(angle2) * radius;
        
        return (
          <group key={i}>
            {/* Backbone spheres - orange gradient */}
            <mesh position={[x, y, z]}>
              <sphereGeometry args={[0.1, 20, 20]} />
              <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.2} emissive="#f97316" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[x2, y, z2]}>
              <sphereGeometry args={[0.1, 20, 20]} />
              <meshStandardMaterial color="#fb923c" metalness={0.6} roughness={0.2} emissive="#fb923c" emissiveIntensity={0.2} />
            </mesh>
            
            {/* Base pair connections - every 2 points for DNA realism */}
            {i % 2 === 0 && (
              <>
                {/* Horizontal rung connecting base pairs */}
                <mesh position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} rotation-y={angle}>
                  <cylinderGeometry args={[0.035, 0.035, radius * 2, 12]} />
                  <meshStandardMaterial color="#ea580c" metalness={0.7} roughness={0.3} />
                </mesh>
                
                {/* Base pair detail spheres */}
                <mesh position={[x * 0.5, y, z * 0.5]}>
                  <sphereGeometry args={[0.06, 16, 16]} />
                  <meshStandardMaterial color="#fdba74" metalness={0.5} roughness={0.3} />
                </mesh>
                <mesh position={[x2 * 0.5, y, z2 * 0.5]}>
                  <sphereGeometry args={[0.06, 16, 16]} />
                  <meshStandardMaterial color="#fed7aa" metalness={0.5} roughness={0.3} />
                </mesh>
              </>
            )}
            
            {/* Sugar-phosphate backbone connectors */}
            {i < helixPoints - 1 && (
              <>
                <mesh position={[x, y + (height / helixPoints / 2), z]}>
                  <cylinderGeometry args={[0.04, 0.04, height / helixPoints, 8]} />
                  <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.25} />
                </mesh>
                <mesh position={[x2, y + (height / helixPoints / 2), z2]}>
                  <cylinderGeometry args={[0.04, 0.04, height / helixPoints, 8]} />
                  <meshStandardMaterial color="#fb923c" metalness={0.6} roughness={0.25} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

export const DNA3D = () => {
  return (
    <div className="w-full h-[350px] rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[3, 2, 4]} />
        <OrbitControls enableZoom={false} />
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={0.8} />
        <pointLight position={[-10, 0, -10]} intensity={0.4} color="#3b82f6" />
        <DNAHelix />
      </Canvas>
    </div>
  );
};
