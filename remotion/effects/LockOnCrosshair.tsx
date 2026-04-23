import React from "react";
import { Circle } from "@remotion/shapes";
import { interpolate, useCurrentFrame } from "remotion";

export const LockOnCrosshair: React.FC<{
  x: number;
  y: number;
  size?: number;
  delay?: number;
  color?: string;
}> = ({ x, y, size = 132, delay = 0, color = "#00D1FF" }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - delay;
  const opacity = interpolate(localFrame, [0, 12, 80], [0, 1, 0.74], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(localFrame, [0, 18], [1.22, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (localFrame < 0) {
    return null;
  }

  const half = size / 2;

  return (
    <div
      style={{
        position: "absolute",
        left: x - half,
        top: y - half,
        width: size,
        height: size,
        opacity,
        transform: `scale(${scale})`,
        zIndex: 34,
        filter: `drop-shadow(0 0 12px ${color}88)`,
      }}
    >
      <Circle radius={half - 12} fill="transparent" stroke={color} strokeWidth={2} />
      <div style={{ position: "absolute", left: half - 1, top: 8, width: 2, height: 34, background: color }} />
      <div style={{ position: "absolute", left: half - 1, bottom: 8, width: 2, height: 34, background: color }} />
      <div style={{ position: "absolute", top: half - 1, left: 8, height: 2, width: 34, background: color }} />
      <div style={{ position: "absolute", top: half - 1, right: 8, height: 2, width: 34, background: color }} />
    </div>
  );
};
