import type { LocationObject } from "expo-location";
import { MAX_ACCURACY_METERS, MIN_STEP_METERS } from "../../../services/locationGpsConstants";
import { haversineMeters } from "../../../utils/geo";
import type { GpsTripPointRecord } from "./gpsTripTypes";

/**
 * Те же правила, что headless distance merge — для trip store (без дублирования метров в ActiveShift).
 */
export function headlessLocationsToTripRecords(
  locs: LocationObject[],
  waterlineMs: number,
): GpsTripPointRecord[] {
  const sorted = [...locs].sort((a, b) => a.timestamp - b.timestamp);
  const out: GpsTripPointRecord[] = [];
  let anchor: { lat: number; lng: number } | null = null;

  for (const loc of sorted) {
    const acc = loc.coords.accuracy ?? 999;
    if (acc > MAX_ACCURACY_METERS) continue;
    const lat = loc.coords.latitude;
    const lng = loc.coords.longitude;
    const t = loc.timestamp;
    if (t > 0 && t <= waterlineMs) continue;

    if (!anchor) {
      anchor = { lat, lng };
      out.push({
        t,
        lat,
        lng,
        acc: loc.coords.accuracy ?? undefined,
        dM: 0,
        src: "headless",
      });
      continue;
    }

    const segment = haversineMeters(anchor, { lat, lng });
    if (segment < MIN_STEP_METERS) continue;

    out.push({
      t,
      lat,
      lng,
      acc: loc.coords.accuracy ?? undefined,
      dM: segment,
      src: "headless",
    });
    anchor = { lat, lng };
  }

  return out;
}
