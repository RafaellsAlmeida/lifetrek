import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const Letterbox: React.FC<{
  durationInFrames: number;
  maxBarHeight?: number;
}> = ({ durationInFrames, maxBarHeight = 118 }) => {
  const frame = useCurrentFrame();
  const height = interpolate(
    frame,
    [0, 14, Math.max(15, durationInFrames - 14), durationInFrames],
    [0, maxBarHeight, maxBarHeight, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height,
          background: "#02050b",
          zIndex: 45,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height,
          background: "#02050b",
          zIndex: 45,
        }}
      />
    </>
  );
};
