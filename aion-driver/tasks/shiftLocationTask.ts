import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { mergeHeadlessGpsLocationsIntoStore } from "../storage/driver/activeShiftStorage";
import { STORAGE_KEYS } from "../storage/core/keys";

/** Имя задачи должно совпадать с аргументом startLocationUpdatesAsync. */
export const AION_SHIFT_LOCATION_TASK = "AION_SHIFT_LOCATION_TASK";

/**
 * Сброс waterline/heartbeat/legacy anchor (новая смена / завершение).
 */
export async function clearBackgroundShiftLocationRuntimeState(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.SHIFT_LOC_TASK_HEARTBEAT,
    STORAGE_KEYS.SHIFT_BG_MERGE_STATE,
    STORAGE_KEYS.SHIFT_BG_MERGE_ANCHOR,
  ]);
}

export async function stopShiftLocationTaskIfRunning(): Promise<void> {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(AION_SHIFT_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(AION_SHIFT_LOCATION_TASK);
    }
  } catch {
    // ignore: OEM/Expo can throw in background restrictions
  }
}

export async function getShiftLocationTaskDiagnostics(): Promise<{
  taskRunning: boolean | null;
  lastHeartbeatJson: string | null;
  lastMergeStateJson: string | null;
}> {
  const [hb, st] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LOC_TASK_HEARTBEAT),
    AsyncStorage.getItem(STORAGE_KEYS.SHIFT_BG_MERGE_STATE),
  ]);
  let running: boolean | null = null;
  try {
    running = await Location.hasStartedLocationUpdatesAsync(AION_SHIFT_LOCATION_TASK);
  } catch {
    running = null;
  }
  return {
    taskRunning: running,
    lastHeartbeatJson: hb ?? null,
    lastMergeStateJson: st ?? null,
  };
}

/**
 * Фоновая доставка точек: сериализованный merge в ActiveShift.
 * Foreground watch только в AppState active; FGS только вне active — один владелец GPS-дельты.
 */
TaskManager.defineTask(AION_SHIFT_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn("[AION][shift-loc-task]", error);
    return;
  }
  const payload = data as { locations?: Location.LocationObject[] } | undefined;
  const locs = payload?.locations;
  if (locs?.length) {
    await mergeHeadlessGpsLocationsIntoStore(locs);
  }
});
