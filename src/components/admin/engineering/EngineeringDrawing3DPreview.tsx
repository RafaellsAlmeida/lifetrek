import { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { buildTechnicalDrawingGroup } from "@/lib/engineering-drawing/render3d";
import type { AxisymmetricPartSpec } from "@/lib/engineering-drawing/types";

function disposeGroup(group: THREE.Group) {
  group.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.geometry.dispose();

    if (Array.isArray(node.material)) {
      node.material.forEach((material) => material.dispose());
      return;
    }

    node.material.dispose();
  });
}

function PreviewMesh({ spec }: { spec: AxisymmetricPartSpec }) {
  const built = useMemo(() => buildTechnicalDrawingGroup(spec), [spec]);

  useEffect(() => {
    return () => disposeGroup(built.group);
  }, [built.group]);

  return <primitive object={built.group} />;
}

export function EngineeringDrawing3DPreview({ spec }: { spec: AxisymmetricPartSpec }) {
  return (
    <div className="h-[420px] overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top,_#f8fafc,_#e2e8f0)]">
      <Canvas camera={{ position: [42, 24, 32], fov: 34 }}>
        <color attach="background" args={["#f8fafc"]} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[18, 24, 16]} intensity={1.2} />
        <directionalLight position={[-14, -12, 12]} intensity={0.45} />
        <gridHelper args={[120, 12, "#cbd5e1", "#e2e8f0"]} rotation={[Math.PI / 2, 0, 0]} />
        <PreviewMesh spec={spec} />
        <OrbitControls enablePan={false} minDistance={18} maxDistance={120} />
      </Canvas>
    </div>
  );
}
