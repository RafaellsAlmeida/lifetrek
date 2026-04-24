import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const DataCounter: React.FC<{
  from: number;
  to: number;
  delay?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}> = ({ from, to, delay = 0, duration = 45, decimals = 2, prefix = "", suffix = "" }) => {
  const frame = useCurrentFrame();
  const value = interpolate(frame - delay, [0, duration], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <span>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
};
