import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";

type GrainDot = {
  x: number;
  y: number;
  size: number;
  opacity: number;
};

export const FilmGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.045 }) => {
  const frame = useCurrentFrame();

  const dots: GrainDot[] = Array.from({ length: 90 }, (_, index) => {
    const phase = frame * 0.19;
    const x = (noise2D("grain-x", index * 1.37, phase) + 1) * 540;
    const y = (noise2D("grain-y", index * 2.11, phase + 14) + 1) * 540;
    const size = 1.4 + (noise2D("grain-size", index * 0.41, phase) + 1) * 1.8;
    const dotOpacity = 0.18 + (noise2D("grain-opacity", index * 0.83, phase) + 1) * 0.22;
    return { x, y, size, opacity: dotOpacity };
  });

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity,
        mixBlendMode: "screen",
        zIndex: 90,
      }}
    >
      {dots.map((dot, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            borderRadius: dot.size,
            background: "rgba(255,255,255,0.86)",
            opacity: dot.opacity,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
