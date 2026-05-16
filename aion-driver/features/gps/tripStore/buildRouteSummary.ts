import type { GpsStopPoint, GpsTripPointRecord, RouteSessionSummary } from "./gpsTripTypes";

const PREVIEW_MAX = 120;

function simplifyPath(points: GpsTripPointRecord[]): { lat: number; lng: number }[] {
  if (points.length <= PREVIEW_MAX) {
    return points.map((p) => ({ lat: p.lat, lng: p.lng }));
  }
  const step = Math.ceil(points.length / PREVIEW_MAX);
  return points.filter((_, i) => i % step === 0).map((p) => ({ lat: p.lat, lng: p.lng }));
}

function computeBounds(points: GpsTripPointRecord[]) {
  if (!points.length) return null;
  let minLat = points[0]!.lat;
  let maxLat = points[0]!.lat;
  let minLng = points[0]!.lng;
  let maxLng = points[0]!.lng;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  return { minLat, maxLat, minLng, maxLng };
}

export function buildRouteSessionSummary(input: {
  points: GpsTripPointRecord[];
  stops: GpsStopPoint[];
  startedAtMs: number;
  endedAtMs: number;
}): RouteSessionSummary {
  const { points, stops, startedAtMs, endedAtMs } = input;
  const durationMs = Math.max(0, endedAtMs - startedAtMs);

  let distanceMeters = 0;
  for (const p of points) {
    if (p.dM != null && p.dM > 0) distanceMeters += p.dM;
  }

  const stopDurationMs = stops.reduce((s, x) => s + x.durationMs, 0);
  const idleMs = Math.min(durationMs, stopDurationMs);
  const movingMs = Math.max(0, durationMs - idleMs);
  const idleRatio = durationMs > 0 ? idleMs / durationMs : 0;

  return {
    distanceMeters,
    durationMs,
    movingMs,
    idleMs,
    idleRatio,
    stopCount: stops.length,
    stopDurationMs,
    pointCount: points.length,
    bounds: computeBounds(points),
    pathPreview: simplifyPath(points),
  };
}
