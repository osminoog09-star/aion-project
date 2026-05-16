import type { Shift } from "../../../types";

export type ShiftRecordedListener = (shift: Shift) => void;

const listeners = new Set<ShiftRecordedListener>();

export function onShiftRecorded(listener: ShiftRecordedListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitShiftRecorded(shift: Shift): void {
  listeners.forEach((fn) => {
    try {
      fn(shift);
    } catch {
      /* isolate listener errors */
    }
  });
}
