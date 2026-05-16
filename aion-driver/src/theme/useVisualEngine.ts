import { useTheme } from "../../contexts/ThemeContext";

/** Visual style + effects + motion (alias over ThemeContext). */
export function useVisualEngine() {
  const t = useTheme();
  return {
    visualStyle: t.visualStyle,
    setVisualStyle: t.setVisualStyle,
    visualEffects: t.visualEffects,
    motionIntensity: t.motionIntensity,
    setMotionIntensity: t.setMotionIntensity,
    motionTiming: t.motionTiming,
    semantic: t.semantic,
    resolved: t.resolved,
    preference: t.preference,
    setPreference: t.setPreference,
    reducedMotion: t.reducedMotion,
  };
}

/** Narrow hook for screens that only need identity + tokens (same provider as useTheme). */
export function useVisualStyle() {
  const t = useTheme();
  return {
    visualStyle: t.visualStyle,
    setVisualStyle: t.setVisualStyle,
    semantic: t.semantic,
    resolved: t.resolved,
    visualEffects: t.visualEffects,
    motionTiming: t.motionTiming,
    reducedMotion: t.reducedMotion,
  };
}
