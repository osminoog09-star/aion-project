import type { ActiveShift } from "../types";

/** Длительность смены без учёта пауз (для метрик и завершения). */
export function getEffectiveShiftDurationMs(shift: ActiveShift, nowMs: number): number {
  const start = new Date(shift.startedAt).getTime();
  const acc = shift.accumulatedPauseMs ?? 0;
  let currentPause = 0;
  if (shift.paused && shift.pauseStartedAtMs != null) {
    currentPause = Math.max(0, nowMs - shift.pauseStartedAtMs);
  }
  return Math.max(0, nowMs - start - acc - currentPause);
}
