import type { OcrParseResult } from "../types";

export function isOcrResultCacheable(result: OcrParseResult | undefined): boolean {
  if (!result) return false;
  if (result.normalizedSourceText?.trim()) return true;
  if (result.trips.length > 0 || result.earnings > 0) return true;
  if (result.fuelReceipt || result.dashboardCluster) return true;
  return false;
}
