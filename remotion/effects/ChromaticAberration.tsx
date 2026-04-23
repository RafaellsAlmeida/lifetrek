import React from "react";

export const ChromaticAberration: React.FC<{ intensity?: number; opacity?: number }> = ({
  intensity = 2,
  opacity = 0.28,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 88,
      opacity,
      boxShadow: `inset ${intensity}px 0 0 rgba(255,32,72,0.55), inset -${intensity}px 0 0 rgba(0,209,255,0.45)`,
      mixBlendMode: "screen",
    }}
  />
);
