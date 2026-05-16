import * as Location from "expo-location";
import { PermissionStatus } from "expo-location";
import type { ActiveShift } from "../types";
import { AION_SHIFT_LOCATION_TASK } from "../tasks/shiftLocationTask";
import type { BackgroundTrackingAdapter, BackgroundTrackingHandle } from "./backgroundTracking";
import {
  BACKGROUND_DISTANCE_INTERVAL_M,
  BACKGROUND_TIME_INTERVAL_MS,
} from "./locationGpsConstants";

/**
 * Android: TaskManager + периодические location updates с foregroundService notification (Expo).
 * Включается только когда приложение не в AppState active (см. ShiftContext) — без гонки с foreground watch.
 */
export class AndroidForegroundLocationShiftAdapter implements BackgroundTrackingAdapter {
  async enableForShift(_shift: ActiveShift): Promise<BackgroundTrackingHandle> {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== PermissionStatus.GRANTED) {
      return { dispose: () => {} };
    }
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== PermissionStatus.GRANTED) {
      console.warn(
        "[AION][shift-runtime] background location not granted — трек при полном фоне может прерываться",
      );
    }
    if (await Location.hasStartedLocationUpdatesAsync(AION_SHIFT_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(AION_SHIFT_LOCATION_TASK);
    }
    await Location.startLocationUpdatesAsync(AION_SHIFT_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: BACKGROUND_DISTANCE_INTERVAL_M,
      timeInterval: BACKGROUND_TIME_INTERVAL_MS,
      pausesUpdatesAutomatically: true,
      foregroundService: {
        notificationTitle: "AION — активная смена",
        notificationBody: "Трек маршрута; откройте приложение для деталей.",
        notificationColor: "#030712",
        killServiceOnDestroy: true,
      },
    });
    return {
      dispose: () => {
        void (async () => {
          try {
            if (await Location.hasStartedLocationUpdatesAsync(AION_SHIFT_LOCATION_TASK)) {
              await Location.stopLocationUpdatesAsync(AION_SHIFT_LOCATION_TASK);
            }
          } catch {
            /* ignore */
          }
        })();
      },
    };
  }
}
