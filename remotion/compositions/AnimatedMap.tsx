import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Img } from "remotion";

// We'll use a static map background or generate dots programmatically
// Ideally this would be an SVG map, but we'll simulate a "network" effect

const BRAND = {
  backgroundDarkAlt: "#0a1628",
  energyOrange: "#F07818",
  corporateBlue: "#004F8F",
  textLight: "#F8FAFC",
};

export const AnimatedMap: React.FC<{
  title: string;
  subtitle: string;
}> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Simulate dots appearing on a map
  const dots = [
    { x: 30, y: 40, delay: 0 },   // North America
    { x: 35, y: 45, delay: 5 },
    { x: 45, y: 70, delay: 10 },  // South America (Brazil)
    { x: 48, y: 75, delay: 12 },  // South Brazil
    { x: 52, y: 30, delay: 15 },  // Europe
    { x: 55, y: 35, delay: 18 },
    { x: 70, y: 35, delay: 25 },  // Asia
    { x: 75, y: 40, delay: 28 },
    { x: 80, y: 80, delay: 35 },  // Australia
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.backgroundDarkAlt }}>
      {/* Subtle Grid Background */}
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.3,
        }}
      />

      {/* Styled World Map Container (Abstract) */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 100,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        {/* Abstract Map Shape (Using pure CSS/Divs for now to avoid svg asset dependency issues if not present) */}
        <div style={{ position: "relative", width: "100%", height: "100%", opacity: 0.6 }}>
            {/* Dots */}
            {dots.map((dot, i) => {
                const dotSpring = spring({
                    frame: frame - dot.delay,
                    fps,
                    config: { damping: 10, stiffness: 100 }
                });
                
                const scale = interpolate(dotSpring, [0, 1], [0, 1]);
                
                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: `${dot.x}%`,
                            top: `${dot.y}%`,
                            width: 24,
                            height: 24,
                            backgroundColor: BRAND.energyOrange,
                            borderRadius: "50%",
                            transform: `scale(${scale})`,
                            boxShadow: `0 0 20px ${BRAND.energyOrange}`,
                        }}
                    >
                        {/* Ripple effect */}
                        <div
                            style={{
                                position: "absolute",
                                inset: -10,
                                border: `2px solid ${BRAND.energyOrange}`,
                                borderRadius: "50%",
                                opacity: interpolate(frame, [dot.delay, dot.delay + 30], [1, 0], { extrapolateRight: "clamp" }),
                                transform: `scale(${interpolate(frame, [dot.delay, dot.delay + 30], [0.5, 2], { extrapolateRight: "clamp" })})`
                            }}
                        />
                    </div>
                );
            })}
        </div>
      </div>

      {/* Title Overlay */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", zIndex: 10 }}>
        <div style={{ textAlign: "center", background: "rgba(10,22,40,0.7)", padding: 40, borderRadius: 20, backdropFilter: "blur(10px)" }}>
          <h1 style={{ 
            color: BRAND.textLight, 
            fontFamily: "Inter", 
            fontSize: 80, 
            margin: 0,
            opacity: interpolate(frame, [0, 20], [0, 1]),
            transform: `translateY(${interpolate(frame, [0, 20], [20, 0], {extrapolateRight:'clamp'})}px)`
          }}>
            {title}
          </h1>
          <h2 style={{ 
            color: "#94a3b8", 
            fontFamily: "Inter", 
            fontSize: 32, 
            marginTop: 16,
            opacity: interpolate(frame, [10, 30], [0, 1]),
            transform: `translateY(${interpolate(frame, [10, 30], [20, 0], {extrapolateRight:'clamp'})}px)`
          }}>
            {subtitle}
          </h2>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
