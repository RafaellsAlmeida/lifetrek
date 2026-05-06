import { Suspense, useMemo } from "react";
import { Bounds, OrbitControls } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { cn } from "@/lib/utils";

function GlbModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  return <primitive object={scene} />;
}

export function EngineeringDrawingGlbPreview({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-[radial-gradient(circle_at_top,_#f8fafc,_#e2e8f0)]",
        className,
      )}
    >
      <Canvas camera={{ position: [42, 24, 32], fov: 34 }}>
        <color attach="background" args={["#f8fafc"]} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[18, 24, 16]} intensity={1.2} />
        <directionalLight position={[-14, -12, 12]} intensity={0.45} />
        <gridHelper args={[120, 12, "#cbd5e1", "#e2e8f0"]} rotation={[Math.PI / 2, 0, 0]} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.3}>
            <GlbModel url={url} />
          </Bounds>
        </Suspense>
        <OrbitControls enablePan={false} minDistance={8} maxDistance={160} />
      </Canvas>
    </div>
  );
}
