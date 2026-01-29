// @ts-nocheck
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function Implant() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.2, 0.15, 2, 32]} />
        <meshStandardMaterial 
          color="#c0c0c0" 
          metalness={0.9} 
          roughness={0.1} 
        />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial 
          color="#d0d0d0" 
          metalness={0.8} 
          roughness={0.2} 
        />
      </mesh>
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[0, -0.8 + i * 0.2, 0]}>
          <torusGeometry args={[0.18, 0.03, 16, 32]} />
          <meshStandardMaterial 
            color="#b0b0b0" 
            metalness={0.9} 
            roughness={0.1} 
          />
        </mesh>
      ))}
    </group>
  );
}

export const RotatingImplant = () => {
  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[3, 2, 4]} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <Implant />
      </Canvas>
    </div>
  );
};
