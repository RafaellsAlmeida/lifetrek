import { useReducer, useCallback, useMemo } from "react";
import type { VideoEditorState, VideoEditorAction, EditorScene } from "../types";

const initialState: VideoEditorState = {
  scenes: [],
  selectedSceneId: null,
  playheadFrame: 0,
  isPlaying: false,
  zoom: 1,
  fps: 30,
};

function videoEditorReducer(
  state: VideoEditorState,
  action: VideoEditorAction
): VideoEditorState {
  switch (action.type) {
    case "SET_SCENES":
      return { ...state, scenes: action.scenes };

    case "SELECT_SCENE":
      return { ...state, selectedSceneId: action.sceneId };

    case "REORDER_SCENES": {
      const newScenes = [...state.scenes];
      const [removed] = newScenes.splice(action.sourceIndex, 1);
      newScenes.splice(action.destinationIndex, 0, removed);
      return { ...state, scenes: newScenes };
    }

    case "UPDATE_SCENE": {
      const newScenes = state.scenes.map((scene) =>
        scene.id === action.sceneId ? { ...scene, ...action.updates } : scene
      );
      return { ...state, scenes: newScenes };
    }

    case "SET_PLAYHEAD":
      return { ...state, playheadFrame: action.frame };

    case "SET_PLAYING":
      return { ...state, isPlaying: action.isPlaying };

    case "SET_ZOOM":
      return { ...state, zoom: Math.max(0.5, Math.min(3, action.zoom)) };

    case "DELETE_SCENE": {
      const newScenes = state.scenes.filter((scene) => scene.id !== action.sceneId);
      const newSelectedId =
        state.selectedSceneId === action.sceneId ? null : state.selectedSceneId;
      return { ...state, scenes: newScenes, selectedSceneId: newSelectedId };
    }

    case "DUPLICATE_SCENE": {
      const sceneIndex = state.scenes.findIndex((s) => s.id === action.sceneId);
      if (sceneIndex === -1) return state;
      const sceneToDuplicate = state.scenes[sceneIndex];
      const newScene: EditorScene = {
        ...sceneToDuplicate,
        id: `${sceneToDuplicate.id}-copy-${Date.now()}`,
        label: `${sceneToDuplicate.label} (copy)`,
      };
      const newScenes = [...state.scenes];
      newScenes.splice(sceneIndex + 1, 0, newScene);
      return { ...state, scenes: newScenes };
    }

    default:
      return state;
  }
}

export function useVideoStudioState(initialScenes?: EditorScene[]) {
  const [state, dispatch] = useReducer(videoEditorReducer, {
    ...initialState,
    scenes: initialScenes ?? [],
  });

  const setScenes = useCallback((scenes: EditorScene[]) => {
    dispatch({ type: "SET_SCENES", scenes });
  }, []);

  const selectScene = useCallback((sceneId: string | null) => {
    dispatch({ type: "SELECT_SCENE", sceneId });
  }, []);

  const reorderScenes = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      dispatch({ type: "REORDER_SCENES", sourceIndex, destinationIndex });
    },
    []
  );

  const updateScene = useCallback(
    (sceneId: string, updates: Partial<EditorScene>) => {
      dispatch({ type: "UPDATE_SCENE", sceneId, updates });
    },
    []
  );

  const setPlayhead = useCallback((frame: number) => {
    dispatch({ type: "SET_PLAYHEAD", frame });
  }, []);

  const setPlaying = useCallback((isPlaying: boolean) => {
    dispatch({ type: "SET_PLAYING", isPlaying });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: "SET_ZOOM", zoom });
  }, []);

  const deleteScene = useCallback((sceneId: string) => {
    dispatch({ type: "DELETE_SCENE", sceneId });
  }, []);

  const duplicateScene = useCallback((sceneId: string) => {
    dispatch({ type: "DUPLICATE_SCENE", sceneId });
  }, []);

  const selectedScene = useMemo(
    () => state.scenes.find((s) => s.id === state.selectedSceneId) ?? null,
    [state.scenes, state.selectedSceneId]
  );

  const totalDuration = useMemo(
    () => state.scenes.reduce((sum, s) => sum + s.durationSeconds, 0),
    [state.scenes]
  );

  const totalFrames = useMemo(
    () => Math.round(totalDuration * state.fps),
    [totalDuration, state.fps]
  );

  return {
    state,
    selectedScene,
    totalDuration,
    totalFrames,
    setScenes,
    selectScene,
    reorderScenes,
    updateScene,
    setPlayhead,
    setPlaying,
    setZoom,
    deleteScene,
    duplicateScene,
  };
}
