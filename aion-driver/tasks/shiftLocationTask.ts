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
