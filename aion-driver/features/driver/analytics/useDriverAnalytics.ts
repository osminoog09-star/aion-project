import { useMemo } from "react";
import type { Shift } from "../../../types";
import { computeDriverAnalytics, type DriverAnalytics } from "./computeDriverAnalytics";

export function useDriverAnalytics(shifts: Shift[]): DriverAnalytics {
  return useMemo(() => computeDriverAnalytics(shifts), [shifts]);
}
