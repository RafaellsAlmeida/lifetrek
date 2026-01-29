// @ts-nocheck
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function Part({ position, delay = 0 }: { position: [number, number, number]; delay?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() + delay) * 0.3;
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.3;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.3, 0.8, 0.15]} />
      <meshStandardMaterial 
        color="#a8a8a8" 
        metalness={0.95} 
        roughness={0.05} 
      />
    </mesh>
  );
}

export const FloatingParts = () => {
  return (
    <div className="w-full h-[300px] rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Part position={[-1.5, 0, 0]} delay={0} />
        <Part position={[0, 0, 0]} delay={1} />
        <Part position={[1.5, 0, 0]} delay={2} />
      </Canvas>
    </div>
  );
};
