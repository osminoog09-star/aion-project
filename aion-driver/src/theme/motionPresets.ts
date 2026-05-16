import type { MotionIntensity } from "./visualTypes";

export type MotionTimingPreset = {
  orbPulseMs: number;
  scanLineCycleMs: number;
};

export const MOTION_TIMING: Record<MotionIntensity, MotionTimingPreset> = {
  subtle: { orbPulseMs: 6400, scanLineCycleMs: 14000 },
  cinematic: { orbPulseMs: 4800, scanLineCycleMs: 10000 },
  energetic: { orbPulseMs: 3200, scanLineCycleMs: 6500 },
};

export function motionForStyle(
  intensity: MotionIntensity,
  reducedMotion: boolean,
): MotionTimingPreset {
  if (reducedMotion) {
    return { orbPulseMs: 9000, scanLineCycleMs: 0 };
  }
  return MOTION_TIMING[intensity];
}
