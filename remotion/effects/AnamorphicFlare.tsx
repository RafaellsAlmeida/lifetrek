import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const AnamorphicFlare: React.FC<{
  x: number;
  y: number;
  delay?: number;
  width?: number;
  color?: string;
}> = ({ x, y, delay = 0, width = 760, color = "rgba(0,209,255,0.72)" }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - delay;
  const opacity = interpolate(localFrame, [0, 10, 34, 48], [0, 1, 0.42, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scaleX = interpolate(localFrame, [0, 20, 48], [0.32, 1.04, 0.62], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (localFrame < 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - 1,
        width,
        height: 3,
        opacity,
        transform: `scaleX(${scaleX})`,
        transformOrigin: "center",
        background: `linear-gradient(90deg, transparent 0%, ${color} 44%, rgba(255,255,255,0.95) 50%, ${color} 56%, transparent 100%)`,
        filter: "blur(1.2px)",
        boxShadow: "0 0 18px rgba(0,209,255,0.8)",
        mixBlendMode: "screen",
        pointerEvents: "none",
        zIndex: 40,
      }}
    />
  );
};
