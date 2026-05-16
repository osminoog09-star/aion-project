import type { ActiveShift } from "../types";
import { MAX_ACCURACY_METERS, MIN_STEP_METERS } from "./locationGpsConstants";
import { haversineMeters } from "../utils/geo";

export type HeadlessGpsFix = {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  };
  timestamp?: number;
};

export type BgMergeStateV1 = {
  shiftId: string;
  lastMergedFixEpochMs: number;
};

export function parseBgMergeState(raw: string | null): BgMergeStateV1 | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    const shiftId = (v as { shiftId?: unknown }).shiftId;
    const lastMerged = (v as { lastMergedFixEpochMs?: unknown }).lastMergedFixEpochMs;
    if (typeof shiftId !== "string" || typeof lastMerged !== "number" || !Number.isFinite(lastMerged)) {
      return null;
    }
    return { shiftId, lastMergedFixEpochMs: lastMerged };
  } catch {
    return null;
  }
}

export type HeadlessMergeComputation = {
  shift: ActiveShift | null;
  mergeStateRaw: string | null;
  locs: HeadlessGpsFix[];
};

export type HeadlessMergeOutput = {
  nextShift: ActiveShift;
  nextMergeStateJson: string;
  heartbeatJson: string;
};

/**
 * Якорь дистанции — только из persisted shift (lastAccepted).
 * Idempotency: lastMergedFixEpochMs + фильтр ts>0 (повтор доставки не дублирует метры).
 */
export function computeHeadlessMergeResult(input: HeadlessMergeComputation): HeadlessMergeOutput | null {
  const { shift, mergeStateRaw, locs } = input;
  if (!shift || shift.paused || !locs.length) return null;

  let state = parseBgMergeState(mergeStateRaw);
  if (!state || state.shiftId !== shift.id) {
    state = { shiftId: shift.id, lastMergedFixEpochMs: 0 };
  }
  const waterline = state.lastMergedFixEpochMs;

  const sorted = [...locs].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

  let batchMaxTs = waterline;
  for (const loc of sorted) {
    batchMaxTs = Math.max(batchMaxTs, loc.timestamp ?? 0);
  }
  const nextWaterline = Math.max(waterline, batchMaxTs);

  let anchorLat = shift.lastAcceptedLat;
  let anchorLng = shift.lastAcceptedLng;
  let distanceMeters = shift.distanceMeters;
  let distanceMetersPetrol = shift.distanceMetersPetrol;
  let distanceMetersGas = shift.distanceMetersGas;
  let lastAcceptedLat = shift.lastAcceptedLat;
  let lastAcceptedLng = shift.lastAcceptedLng;

  for (const loc of sorted) {
    const acc = loc.coords.accuracy ?? 999;
    if (acc > MAX_ACCURACY_METERS) continue;

    const lat = loc.coords.latitude;
    const lng = loc.coords.longitude;
    const ts = loc.timestamp ?? 0;
    if (ts > 0 && ts <= waterline) continue;

    if (anchorLat == null || anchorLng == null) {
      anchorLat = lat;
      anchorLng = lng;
      lastAcceptedLat = lat;
      lastAcceptedLng = lng;
      continue;
    }

    const segment = haversineMeters({ lat: anchorLat, lng: anchorLng }, { lat, lng });
    if (segment < MIN_STEP_METERS) continue;

    distanceMeters += segment;
    if (shift.activeFuelType === "petrol") {
      distanceMetersPetrol += segment;
    } else {
      distanceMetersGas += segment;
    }
    anchorLat = lat;
    anchorLng = lng;
    lastAcceptedLat = lat;
    lastAcceptedLng = lng;
  }

  const nextShift: ActiveShift = {
    ...shift,
    distanceMeters,
    distanceMetersPetrol,
    distanceMetersGas,
    lastAcceptedLat,
    lastAcceptedLng,
  };

  const last = sorted[sorted.length - 1];
  const heartbeatJson = JSON.stringify({
    at: Date.now(),
    lat: last.coords.latitude,
    lng: last.coords.longitude,
  });

  return {
    nextShift,
    nextMergeStateJson: JSON.stringify({
      shiftId: shift.id,
      lastMergedFixEpochMs: nextWaterline,
    } satisfies BgMergeStateV1),
    heartbeatJson,
  };
}
