import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

const BRAND = {
  corporateBlue: "#004F8F",
  corporateBlueHover: "#003D75",
  innovationGreen: "#1A7A3E",
  energyOrange: "#F07818",
  textLight: "#F8FAFC",
  backgroundDark: "#0a0d12",
};

export const KineticText: React.FC<{
  title: string;
  subtitle: string;
  backgroundColor?: string;
}> = ({ title, subtitle, backgroundColor = BRAND.corporateBlue }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background animated gradient
  const bgScale = interpolate(frame, [0, 100], [1, 1.2]);
  
  // Title Animation (Scale + Slide Up)
  const titleSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });
  
  // Subtitle Animation (Fade in + Slide Up)
  const subtitleSpring = spring({
    frame: frame - 15, // Delayed
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Staggered letter effect could be added here, but keep it simple/bold for now
  
  const titleScale = interpolate(titleSpring, [0, 1], [0.8, 1]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);

  const subtitleOpacity = subtitleSpring;
  const subtitleY = interpolate(subtitleSpring, [0, 1], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Dynamic Background Pattern */}
      <AbsoluteFill
        style={{
          opacity: 0.1,
          background: "radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 70%)",
          transform: `scale(${bgScale})`,
        }}
      />
      
      <div style={{ textAlign: "center", zIndex: 1, padding: 40 }}>
        {/* Main Title - BIG */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale}) translateY(${titleY}px)`,
            fontSize: 140,
            fontWeight: 900,
            fontFamily: "Inter, system-ui, sans-serif",
            color: BRAND.textLight,
            lineHeight: 0.9,
            textTransform: "uppercase",
            letterSpacing: "-0.04em",
            marginBottom: 20,
            textShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          {title}
        </div>

        {/* Subtitle - Elegant */}
        <div
          style={{
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            fontSize: 42,
            fontWeight: 500,
            fontFamily: "Inter, system-ui, sans-serif",
            color: "rgba(248, 250, 252, 0.9)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {subtitle}
        </div>
      </div>
      
      {/* Decorative Line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 12,
          background: `linear-gradient(90deg, ${BRAND.energyOrange}, transparent)`,
        }}
      />
    </AbsoluteFill>
  );
};
