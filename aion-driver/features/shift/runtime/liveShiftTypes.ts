import type { DualFuelShiftMetrics } from "../../../utils/calculations";
import type { ShiftOperationalCosts } from "../../../types/rental";

/** Единый срез экономики активной смены (для UI и overlay). */
export type LiveShiftMetrics = DualFuelShiftMetrics & {
  durationMs: number;
  income: number;
  operationalCosts: ShiftOperationalCosts | null;
};
