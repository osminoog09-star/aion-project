export type {
  MotionIntensity,
  ThemeVisualEffects,
  VisualStyleDefinition,
  VisualStyleId,
} from "./visualTypes";
export { MOTION_TIMING, motionForStyle } from "./motionPresets";
export type { MotionTimingPreset } from "./motionPresets";
export {
  VISUAL_STYLE_IDS,
  defaultMotionForStyle,
  isVisualStyleId,
  resolveVisualEffects,
  resolveVisualSemantic,
} from "./styles/registry";
