// Types for the Video Studio interactive editor

export type SceneKind = "broll" | "image" | "solid";

export interface EditorScene {
  id: string;
  label: string;
  kind: SceneKind;
  durationSeconds: number;
  asset: string;
  notes: string;
  fallbackAsset?: string;
  optional?: boolean;
  altAssets?: string[];
  onScreen?: string;
  backgroundColor?: string;
  overlayImages?: string[];
  // Editor-specific fields
  title?: string;
  subtitle?: string;
}

export interface VideoEditorState {
  scenes: EditorScene[];
  selectedSceneId: string | null;
  playheadFrame: number;
  isPlaying: boolean;
  zoom: number;
  fps: number;
}

export type VideoEditorAction =
  | { type: "SET_SCENES"; scenes: EditorScene[] }
  | { type: "SELECT_SCENE"; sceneId: string | null }
  | { type: "REORDER_SCENES"; sourceIndex: number; destinationIndex: number }
  | { type: "UPDATE_SCENE"; sceneId: string; updates: Partial<EditorScene> }
  | { type: "SET_PLAYHEAD"; frame: number }
  | { type: "SET_PLAYING"; isPlaying: boolean }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "DELETE_SCENE"; sceneId: string }
  | { type: "DUPLICATE_SCENE"; sceneId: string };

// Color mapping for scene kinds
export const SCENE_KIND_COLORS: Record<SceneKind, { bg: string; border: string; text: string }> = {
  broll: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-700" },
  image: { bg: "bg-green-100", border: "border-green-300", text: "text-green-700" },
  solid: { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-700" },
};

// Helper to calculate total duration
export function calculateTotalDuration(scenes: EditorScene[]): number {
  return scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
}

// Helper to get scene start time
export function getSceneStartTime(scenes: EditorScene[], sceneIndex: number): number {
  return scenes.slice(0, sceneIndex).reduce((total, scene) => total + scene.durationSeconds, 0);
}

// Helper to convert time to frame
export function timeToFrame(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

// Helper to convert frame to time
export function frameToTime(frame: number, fps: number): number {
  return frame / fps;
}

// Helper to format time as mm:ss
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
