import type { AionSemantic } from "../../tokens/semantic";

export type VisualStyleId =
  | "core_dev"
  | "cyberpunk"
  | "neo_lux"
  | "minimal_light"
  | "midnight_pro"
  | "synthwave";

export type MotionIntensity = "subtle" | "cinematic" | "energetic";

/** Runtime flags for backgrounds / HUD (keep GPU-friendly). */
export type ThemeVisualEffects = {
  scanLineOpacity: number;
  gridLineOpacity: number;
  orbRingCount: number;
  particleBudget: number;
  useHeavyBlur: boolean;
};

export type VisualStyleDefinition = {
  id: VisualStyleId;
  semantic: (resolved: "light" | "dark") => AionSemantic;
  effects: (opts: { reducedMotion: boolean }) => ThemeVisualEffects;
  defaultMotion: MotionIntensity;
};
