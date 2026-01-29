// @ts-nocheck
import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface ScrewProps {
  position: [number, number, number];
  scrollProgress: number;
  delay: number;
}

function Screw({ position, scrollProgress, delay }: ScrewProps) {
  const groupRef = useRef<THREE.Group>(null);
  const threadsRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (threadsRef.current) {
      // Calculate expansion based on scroll with wave effect
      const wave = Math.sin((scrollProgress + delay) * Math.PI * 2);
      const expansion = 1 + wave * 0.3;
      threadsRef.current.scale.y = expansion;
    }
    
    if (groupRef.current) {
      // Slight rotation on scroll
      groupRef.current.rotation.y = scrollProgress * Math.PI * 2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Screw head */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 32]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Shaft */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1.5, 32]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Threaded section - this will expand/contract */}
      <group ref={threadsRef} position={[0, -0.5, 0]}>
        {[...Array(12)].map((_, i) => (
          <mesh key={i} position={[0, -i * 0.15, 0]}>
            <torusGeometry args={[0.12, 0.025, 16, 32]} />
            <meshStandardMaterial color="#b0b0b0" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
      </group>
      
      {/* Tip */}
      <mesh position={[0, -2.3, 0]}>
        <coneGeometry args={[0.08, 0.2, 32]} />
        <meshStandardMaterial color="#a0a0a0" metalness={0.85} roughness={0.15} />
      </mesh>
    </group>
  );
}

export const ScrollScrews = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how much of the component is visible
      const visibleTop = Math.max(0, windowHeight - rect.top);
      const visibleBottom = Math.min(windowHeight, windowHeight - rect.bottom + rect.height);
      const visibleHeight = Math.min(visibleTop, visibleBottom);
      const componentHeight = rect.height;
      
      // Progress from 0 to 1 as component scrolls through viewport
      const progress = Math.max(0, Math.min(1, visibleHeight / componentHeight));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-[500px] rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate={scrollProgress > 0}
          autoRotateSpeed={scrollProgress * 2}
        />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <directionalLight position={[0, 5, 5]} intensity={0.8} />
        
        {/* Multiple screws in a line */}
        <Screw position={[-2.5, 0, 0]} scrollProgress={scrollProgress} delay={0} />
        <Screw position={[-1.5, 0, -0.5]} scrollProgress={scrollProgress} delay={0.15} />
        <Screw position={[-0.5, 0, 0.3]} scrollProgress={scrollProgress} delay={0.3} />
        <Screw position={[0.5, 0, -0.2]} scrollProgress={scrollProgress} delay={0.45} />
        <Screw position={[1.5, 0, 0.4]} scrollProgress={scrollProgress} delay={0.6} />
        <Screw position={[2.5, 0, -0.1]} scrollProgress={scrollProgress} delay={0.75} />
      </Canvas>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground bg-background/80 px-4 py-2 rounded-full backdrop-blur-sm">
        Scroll to see the magic ✨
      </div>
    </div>
  );
};
