import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../core/keys";

export type ShiftLocationHeartbeat = {
  atMs: number;
  ageMs: number;
  lat: number;
  lng: number;
};

/** Последний сигнал headless FGS merge (для field validation / diagnostics). */
export async function readShiftLocationHeartbeat(): Promise<ShiftLocationHeartbeat | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LOC_TASK_HEARTBEAT);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { at?: number; lat?: number; lng?: number };
    if (typeof v.at !== "number" || !Number.isFinite(v.at)) return null;
    const now = Date.now();
    return {
      atMs: v.at,
      ageMs: Math.max(0, now - v.at),
      lat: typeof v.lat === "number" ? v.lat : 0,
      lng: typeof v.lng === "number" ? v.lng : 0,
    };
  } catch {
    return null;
  }
}

export async function readShiftBgMergeStatePresent(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_BG_MERGE_STATE);
  return Boolean(raw && raw.length > 2);
}

export { FGS_HEARTBEAT_FRESH_MS, isFgsHeartbeatFresh } from "../../utils/fgsHeartbeatFresh";
