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
  private generation = 0;
  private operationChain: Promise<unknown> = Promise.resolve();

  private runSerialized<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.operationChain.then(operation, operation);
    this.operationChain = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  private async stopTaskIfRunning(): Promise<void> {
    if (await Location.hasStartedLocationUpdatesAsync(AION_SHIFT_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(AION_SHIFT_LOCATION_TASK);
    }
  }

  private async startTask(): Promise<void> {
    await Location.startLocationUpdatesAsync(AION_SHIFT_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      distanceInterval: BACKGROUND_DISTANCE_INTERVAL_M,
      timeInterval: BACKGROUND_TIME_INTERVAL_MS,
      pausesUpdatesAutomatically: false,
      foregroundService: {
        notificationTitle: "AION — активная смена",
        notificationBody: "Трек маршрута; откройте приложение для деталей.",
        notificationColor: "#030712",
        killServiceOnDestroy: false,
      },
    });
  }

  async enableForShift(_shift: ActiveShift): Promise<BackgroundTrackingHandle> {
    const generation = ++this.generation;
    return this.runSerialized(async () => {
      const noop = { dispose: () => {} };
      if (generation !== this.generation) return noop;

      const fg = await Location.requestForegroundPermissionsAsync();
      if (fg.status !== PermissionStatus.GRANTED || generation !== this.generation) return noop;
      const bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.status !== PermissionStatus.GRANTED || generation !== this.generation) {
        if (bg.status !== PermissionStatus.GRANTED) {
          console.warn("[AION][shift-runtime] background location not granted");
        }
        return noop;
      }

      await this.stopTaskIfRunning();
      if (generation !== this.generation) return noop;
      await this.startTask();

      return {
        dispose: () => {
          if (generation !== this.generation) return;
          this.generation += 1;
          void this.runSerialized(async () => {
            try {
              await this.stopTaskIfRunning();
            } catch {
              // OEM restrictions can make cleanup fail; the next owner retries.
            }
          });
        },
        ensureHealthy: () =>
          this.runSerialized(async () => {
            if (generation !== this.generation) return "superseded" as const;
            if (await Location.hasStartedLocationUpdatesAsync(AION_SHIFT_LOCATION_TASK)) {
              return "healthy" as const;
            }
            await this.startTask();
            return "restarted" as const;
          }),
      };
    });
  }
}
