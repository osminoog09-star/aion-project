import AsyncStorage from "@react-native-async-storage/async-storage";
import { listGpsTripShiftIds } from "../../features/gps/tripStore/gpsTripStorage";
import { listShiftAnalyticsIds } from "../../features/analytics/storage/shiftAnalyticsStorage";
import { clearBackgroundShiftLocationRuntimeState } from "../../tasks/shiftLocationTask";
import { STORAGE_KEYS } from "../core/keys";
import { replaceHistory } from "./shiftHistoryStorage";
import { saveActiveShift } from "./activeShiftStorage";
import { clearPendingFuelEntries } from "./pendingFuelStorage";
import { savePostShiftHandoff } from "./postShiftHandoffStorage";

const TIMELINE_KEY = "@aion/core/timeline_v1";

export type ResetDriverStatisticsOptions = {
  includeCloudTrips?: boolean;
  userId?: string | null;
};

export type ResetDriverStatisticsResult = {
  ok: boolean;
  error?: string;
  cleared: {
    shifts: number;
    gpsSessions: number;
    analyticsSnapshots: number;
    cloudTrips?: number;
  };
};

async function removeIndexedKeys(
  ids: string[],
  prefix: string,
  indexKey: string,
): Promise<number> {
  if (ids.length === 0) {
    await AsyncStorage.removeItem(indexKey);
    return 0;
  }
  const keys = ids.map((id) => `${prefix}${id}`);
  await AsyncStorage.multiRemove([...keys, indexKey]);
  return ids.length;
}

/** Полный локальный сброс (включая активную смену). */
export async function executeFullLocalStatisticsReset(): Promise<{
  shifts: number;
  gpsSessions: number;
  analyticsSnapshots: number;
}> {
  const [gpsIds, analyticsIds, histRaw] = await Promise.all([
    listGpsTripShiftIds(),
    listShiftAnalyticsIds(),
    AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
  ]);
  let shiftCount = 0;
  try {
    const parsed = histRaw ? (JSON.parse(histRaw) as unknown[]) : [];
    shiftCount = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    shiftCount = 0;
  }

  const gpsRemoved = await removeIndexedKeys(
    gpsIds,
    STORAGE_KEYS.SHIFT_GPS_PREFIX,
    STORAGE_KEYS.SHIFT_GPS_INDEX,
  );
  const analyticsRemoved = await removeIndexedKeys(
    analyticsIds,
    STORAGE_KEYS.SHIFT_ANALYTICS_PREFIX,
    STORAGE_KEYS.SHIFT_ANALYTICS_INDEX,
  );

  await Promise.all([
    replaceHistory([]),
    saveActiveShift(null),
    clearPendingFuelEntries(),
    savePostShiftHandoff(null),
    clearBackgroundShiftLocationRuntimeState(),
    AsyncStorage.multiRemove([
      STORAGE_KEYS.OCR_IMPORTS,
      STORAGE_KEYS.OCR_QUEUE,
      STORAGE_KEYS.PENDING_HEADLESS_GPS,
    ]),
    AsyncStorage.removeItem(TIMELINE_KEY),
  ]);

  return {
    shifts: shiftCount,
    gpsSessions: gpsRemoved,
    analyticsSnapshots: analyticsRemoved,
  };
}

export async function resetLocalDriverStatistics(): Promise<
  Omit<ResetDriverStatisticsResult, "ok" | "error">
> {
  const cleared = await executeFullLocalStatisticsReset();
  return { cleared };
}

export async function deleteCloudTripsForUser(userId: string): Promise<number> {
  const { requireSupabase } = await import("../../lib/supabase");
  const client = requireSupabase();
  const { data, error: selectErr } = await client
    .from("trips")
    .select("id")
    .eq("user_id", userId);
  if (selectErr) throw selectErr;
  const ids = (data ?? []).map((r) => r.id);
  if (ids.length === 0) return 0;
  const { error } = await client.from("trips").delete().eq("user_id", userId);
  if (error) throw error;
  return ids.length;
}

export async function resetDriverStatistics(
  opts: ResetDriverStatisticsOptions = {},
): Promise<ResetDriverStatisticsResult> {
  try {
    const local = await resetLocalDriverStatistics();
    let cloudTrips = 0;
    if (opts.includeCloudTrips && opts.userId) {
      cloudTrips = await deleteCloudTripsForUser(opts.userId);
    }
    return {
      ok: true,
      cleared: { ...local.cleared, cloudTrips: opts.includeCloudTrips ? cloudTrips : undefined },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      cleared: { shifts: 0, gpsSessions: 0, analyticsSnapshots: 0 },
    };
  }
}
