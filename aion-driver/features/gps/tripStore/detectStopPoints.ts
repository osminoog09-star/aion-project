import { haversineMeters } from "../../../utils/geo";
import type { GpsStopPoint, GpsTripPointRecord } from "./gpsTripTypes";

export const MIN_STOP_DURATION_MS = 3 * 60_000;
export const STOP_RADIUS_M = 80;

/**
 * Детекция остановок только по фактическим точкам (без выдуманных зон).
 */
export function detectStopPoints(points: GpsTripPointRecord[]): GpsStopPoint[] {
  if (points.length < 2) return [];

  const stops: GpsStopPoint[] = [];
  let clusterStart = 0;

  const flushCluster = (endIdx: number) => {
    if (endIdx <= clusterStart) return;
    const slice = points.slice(clusterStart, endIdx + 1);
    const t0 = slice[0]!.t;
    const t1 = slice[slice.length - 1]!.t;
    if (t1 - t0 < MIN_STOP_DURATION_MS) return;

    let lat = 0;
    let lng = 0;
    for (const p of slice) {
      lat += p.lat;
      lng += p.lng;
    }
    lat /= slice.length;
    lng /= slice.length;

    const maxR = slice.reduce(
      (m, p) => Math.max(m, haversineMeters({ lat, lng }, p)),
      0,
    );
    if (maxR > STOP_RADIUS_M) return;

    stops.push({
      lat,
      lng,
      startedAtMs: t0,
      endedAtMs: t1,
      durationMs: t1 - t0,
    });
  };

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const cur = points[i]!;
    const moved = (cur.dM ?? 0) > 2 || haversineMeters(prev, cur) > STOP_RADIUS_M * 0.5;
    if (moved) {
      flushCluster(i - 1);
      clusterStart = i;
    }
  }
  flushCluster(points.length - 1);
  return stops;
}
