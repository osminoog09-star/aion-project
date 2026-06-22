import * as Location from "expo-location";
import type { GPSPoint } from "../types";
import { haversineMeters } from "../utils/geo";
import { MAX_ACCURACY_METERS, MIN_STEP_METERS } from "./locationGpsConstants";

export type LocationTick = {
  point: GPSPoint;
  distanceDeltaMeters: number;
  totalDistanceMeters: number;
};

export type LocationSession = {
  stop: () => void;
  getTotalMeters: () => number;
};

export type StartSessionOptions = {
  onTick: (tick: LocationTick) => void;
  timeIntervalMs?: number;
  distanceIntervalMeters?: number;
  /** Resume tracking after app restart */
  resume?: {
    lastLat: number;
    lastLng: number;
    totalMeters: number;
  };
};

export async function ensureForegroundPermission(): Promise<boolean> {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.status === "granted") return true;
  const req = await Location.requestForegroundPermissionsAsync();
  return req.status === "granted";
}

/**
 * GPS tracking with noise rejection: skips poor-accuracy fixes and
 * movements smaller than MIN_STEP_METERS (reduces stationary jitter).
 */
export function startFilteredLocationSession(
  options: StartSessionOptions
): LocationSession {
  let totalMeters = options.resume?.totalMeters ?? 0;
  let lastAccepted: { lat: number; lng: number } | null = options.resume
    ? { lat: options.resume.lastLat, lng: options.resume.lastLng }
    : null;

  const timeInterval = options.timeIntervalMs ?? 4000;
  const distanceInterval = options.distanceIntervalMeters ?? 8;

  let subscription: Location.LocationSubscription | null = null;
  let stopped = false;

  const handleLocation = (loc: Location.LocationObject) => {
    const acc = loc.coords.accuracy ?? 999;
    if (acc > MAX_ACCURACY_METERS) return;

    const point: GPSPoint = {
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
      timestamp: loc.timestamp,
    };

    if (!lastAccepted) {
      lastAccepted = { lat: point.lat, lng: point.lng };
      options.onTick({
        point,
        distanceDeltaMeters: 0,
        totalDistanceMeters: totalMeters,
      });
      return;
    }

    const segment = haversineMeters(lastAccepted, point);
    if (segment < MIN_STEP_METERS) {
      options.onTick({
        point,
        distanceDeltaMeters: 0,
        totalDistanceMeters: totalMeters,
      });
      return;
    }

    totalMeters += segment;
    lastAccepted = { lat: point.lat, lng: point.lng };
    options.onTick({
      point,
      distanceDeltaMeters: segment,
      totalDistanceMeters: totalMeters,
    });
  };

  void (async () => {
    try {
      const next = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval,
          distanceInterval,
        },
        handleLocation
      );
      if (stopped) {
        next.remove();
        return;
      }
      subscription = next;
    } catch (error) {
      if (!stopped) console.warn("[AION][location] foreground watcher failed", error);
    }
  })();

  return {
    stop: () => {
      stopped = true;
      subscription?.remove();
      subscription = null;
    },
    getTotalMeters: () => totalMeters,
  };
}
