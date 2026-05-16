import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../storage/core/keys";
import type { ShiftAnalyticsSnapshot } from "../types/shiftAnalyticsTypes";

const MAX_INDEXED = 64;

function snapshotKey(shiftId: string): string {
  return `${STORAGE_KEYS.SHIFT_ANALYTICS_PREFIX}${shiftId}`;
}

async function readIndex(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_ANALYTICS_INDEX);
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

async function writeIndex(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.SHIFT_ANALYTICS_INDEX,
    JSON.stringify(ids.slice(0, MAX_INDEXED)),
  );
}

export async function persistShiftAnalytics(
  snapshot: ShiftAnalyticsSnapshot,
): Promise<void> {
  await AsyncStorage.setItem(snapshotKey(snapshot.shiftId), JSON.stringify(snapshot));
  const idx = await readIndex();
  const next = [snapshot.shiftId, ...idx.filter((id) => id !== snapshot.shiftId)];
  await writeIndex(next);
}

export async function loadShiftAnalytics(
  shiftId: string,
): Promise<ShiftAnalyticsSnapshot | null> {
  const raw = await AsyncStorage.getItem(snapshotKey(shiftId));
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as ShiftAnalyticsSnapshot;
    if (!v?.shiftId || v.version !== 1) return null;
    return v;
  } catch {
    return null;
  }
}

export async function listShiftAnalyticsIds(): Promise<string[]> {
  return readIndex();
}
