// @ts-nocheck
import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function Globe() {
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();

  // WebGL Context Recovery
  useEffect(() => {
    const canvas = gl?.domElement;
    if (!canvas) return;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      // WebGL context lost, attempting restore
    };

    const handleContextRestored = () => {
      // WebGL context restored
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  const points = 100;
  const markers: Array<[number, number, number]> = [];

  for (let i = 0; i < points; i++) {
    const phi = Math.acos(-1 + (2 * i) / points);
    const theta = Math.sqrt(points * Math.PI) * phi;

    const x = Math.cos(theta) * Math.sin(phi) * 1.5;
    const y = Math.sin(theta) * Math.sin(phi) * 1.5;
    const z = Math.cos(phi) * 1.5;

    markers.push([x, y, z]);
  }

  return (
    <group ref={groupRef}>
      <Sphere args={[1.5, 32, 32]}>
        <meshStandardMaterial
          color="#1e40af"
          wireframe={true}
          transparent
          opacity={0.3}
        />
      </Sphere>
      {markers.slice(0, 20).map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#22c55e" : "#f97316"}
            emissive={i % 3 === 0 ? "#22c55e" : "#f97316"}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

export const MedicalGlobe = () => {
  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
        <Globe />
      </Canvas>
    </div>
  );
};
