import { loadActiveShift } from "../../../storage/driver/activeShiftStorage";
import type { GpsStorageAdapter } from "../storage/gpsStorageAdapter";

/**
 * Создаёт открытую GPS-сессию только для активной смены (orphan prevention).
 */
export async function ensureGpsSessionForShift(
  adapter: GpsStorageAdapter,
  shiftId: string,
): Promise<void> {
  const existing = await adapter.loadSession(shiftId);
  if (existing && !existing.endedAtMs) return;

  const active = await loadActiveShift();
  if (active?.id !== shiftId) return;

  let startedAtMs = Date.now();
  const parsed = Date.parse(active.startedAt);
  if (Number.isFinite(parsed)) startedAtMs = parsed;

  await adapter.initSession(shiftId, startedAtMs);
}
