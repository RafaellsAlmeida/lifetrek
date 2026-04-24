import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const SceneProgress: React.FC<{
  sceneIndex: number;
  totalScenes: number;
  durationInFrames: number;
}> = ({ sceneIndex, totalScenes, durationInFrames }) => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        bottom: 50,
        display: "flex",
        gap: 12,
        alignItems: "center",
        zIndex: 55,
      }}
    >
      {Array.from({ length: totalScenes }, (_, index) => {
        const active = index === sceneIndex;
        const done = index < sceneIndex;
        return (
          <div
            key={index}
            style={{
              width: active ? 48 : 10,
              height: 10,
              borderRadius: 10,
              overflow: "hidden",
              background: done ? "#1A7A3E" : "rgba(255,255,255,0.26)",
              border: "1px solid rgba(255,255,255,0.28)",
            }}
          >
            {active ? (
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #1A7A3E, #00D1FF)",
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
