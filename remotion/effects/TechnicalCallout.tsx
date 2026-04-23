import React from "react";
import { cutPath, getLength } from "@remotion/paths";
import { interpolate, useCurrentFrame } from "remotion";

export const TechnicalCallout: React.FC<{
  path: string;
  label: string;
  x: number;
  y: number;
  delay?: number;
  duration?: number;
  color?: string;
  align?: "left" | "right";
}> = ({ path, label, x, y, delay = 0, duration = 24, color = "#00D1FF", align = "left" }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - delay;
  const length = getLength(path);
  const visibleLength = interpolate(localFrame, [0, duration], [0, length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelOpacity = interpolate(localFrame, [duration - 4, duration + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelX = interpolate(localFrame, [duration - 4, duration + 12], [align === "left" ? -8 : 8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <svg
        viewBox="0 0 1080 1080"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
          pointerEvents: "none",
          zIndex: 35,
        }}
      >
        <path
          d={cutPath(path, visibleLength)}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="9 8"
          strokeLinecap="round"
          opacity={0.9}
        />
        <circle cx={x} cy={y} r="4" fill={color} opacity={labelOpacity} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(${align === "left" ? 18 : -18}px, -50%) translateX(${labelX}px)`,
          opacity: labelOpacity,
          padding: "8px 12px",
          border: `1px solid ${color}`,
          background: "rgba(3,12,27,0.78)",
          color: "#FFFFFF",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 20,
          lineHeight: 1,
          letterSpacing: 0,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          boxShadow: `0 0 22px ${color}33`,
          zIndex: 38,
        }}
      >
        {label}
      </div>
    </>
  );
};
