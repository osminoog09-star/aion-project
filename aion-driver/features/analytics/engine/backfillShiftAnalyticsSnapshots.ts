import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GpsTripSessionSummary } from "../../gps/storage/gpsStorageAdapter";
import { buildRouteSessionSummary } from "../../gps/tripStore/buildRouteSummary";
import { detectStopPoints } from "../../gps/tripStore/detectStopPoints";
import { loadGpsTripSession } from "../../gps/tripStore/gpsTripStorage";
import type { ShiftGpsSession } from "../../gps/tripStore/gpsTripTypes";
import { loadShiftHistory } from "../../../storage/driver/shiftHistoryStorage";
import type { ActiveShift, Shift } from "../../../types";
import {
  loadShiftAnalytics,
  persistShiftAnalytics,
} from "../storage/shiftAnalyticsStorage";
import { buildPostShiftAnalytics } from "./buildPostShiftAnalytics";

const BACKFILL_STATE_KEY = "@aion_driver/analytics_backfill_v1";
const BACKFILL_ENGINE_VERSION = 1;
const BACKFILL_COOLDOWN_MS = 24 * 3_600_000;
const DEFAULT_MAX_SHIFTS = 32;
const MIN_GPS_POINTS = 5;

export type ShiftAnalyticsBackfillResult = {
  attempted: number;
  created: number;
  skippedExisting: number;
  skippedNoGps: number;
  skippedInvalidShift: number;
};

function synthesizeActiveShiftForBackfill(
  shift: Shift,
  session: ShiftGpsSession | null,
): ActiveShift {
  const route = session?.routeSummary;
  return {
    id: shift.id,
    startedAt: shift.startedAt,
    distanceMeters: Math.max(0, shift.distanceKm * 1000),
    distanceMetersPetrol: Math.max(0, shift.distanceKmPetrol * 1000),
    distanceMetersGas: Math.max(0, shift.distanceKmGas * 1000),
    activeFuelType: "petrol",
    totalIncome: shift.income,
    lastAcceptedLat: null,
    lastAcceptedLng: null,
    accumulatedPauseMs: 0,
    incomeLedger: [],
    motionMovingMs: route?.movingMs ?? 0,
    motionIdleMs: route?.idleMs ?? 0,
    fuelEntries: [],
  };
}

function enrichGpsSession(session: ShiftGpsSession): ShiftGpsSession | null {
  if (session.points.length < MIN_GPS_POINTS) return null;

  const endedAtMs = session.endedAtMs ?? Date.now();
  const stops = session.stops.length ? session.stops : detectStopPoints(session.points);
  const routeSummary =
    session.routeSummary ??
    buildRouteSessionSummary({
      points: session.points,
      stops,
      startedAtMs: session.startedAtMs,
      endedAtMs,
    });

  return { ...session, stops, endedAtMs, routeSummary };
}

function toGpsSummary(session: ShiftGpsSession): GpsTripSessionSummary {
  const rs = session.routeSummary;
  return {
    shiftId: session.shiftId,
    pointCount: rs?.pointCount ?? session.points.length,
    stopCount: rs?.stopCount ?? session.stops.length,
    distanceMetersFromPoints: rs?.distanceMeters ?? 0,
    routeSummary: rs,
  };
}

function isValidCompletedShift(shift: Shift): boolean {
  if (!shift.id || !shift.endedAt || !shift.startedAt) return false;
  const end = Date.parse(shift.endedAt);
  const start = Date.parse(shift.startedAt);
  return Number.isFinite(end) && Number.isFinite(start) && end > start;
}

export async function backfillMissingShiftAnalytics(options?: {
  maxShifts?: number;
  force?: boolean;
}): Promise<ShiftAnalyticsBackfillResult> {
  const maxShifts = options?.maxShifts ?? DEFAULT_MAX_SHIFTS;
  const result: ShiftAnalyticsBackfillResult = {
    attempted: 0,
    created: 0,
    skippedExisting: 0,
    skippedNoGps: 0,
    skippedInvalidShift: 0,
  };

  if (!options?.force) {
    const raw = await AsyncStorage.getItem(BACKFILL_STATE_KEY);
    if (raw) {
      try {
        const state = JSON.parse(raw) as { lastRunMs: number; version: number };
        if (
          state.version >= BACKFILL_ENGINE_VERSION &&
          Date.now() - state.lastRunMs < BACKFILL_COOLDOWN_MS
        ) {
          return result;
        }
      } catch {
        /* run */
      }
    }
  }

  const history = await loadShiftHistory();
  const candidates = history.slice(0, maxShifts);

  for (const shift of candidates) {
    result.attempted += 1;
    if (!isValidCompletedShift(shift)) {
      result.skippedInvalidShift += 1;
      continue;
    }

    const existing = await loadShiftAnalytics(shift.id);
    if (existing) {
      result.skippedExisting += 1;
      continue;
    }

    const rawSession = await loadGpsTripSession(shift.id);
    const session = rawSession ? enrichGpsSession(rawSession) : null;
    if (!session) {
      result.skippedNoGps += 1;
      continue;
    }

    const snapshot = buildPostShiftAnalytics({
      shift,
      activeShift: synthesizeActiveShiftForBackfill(shift, session),
      gpsSummary: toGpsSummary(session),
      gpsSession: session,
    });
    await persistShiftAnalytics(snapshot);
    result.created += 1;
  }

  await AsyncStorage.setItem(
    BACKFILL_STATE_KEY,
    JSON.stringify({ lastRunMs: Date.now(), version: BACKFILL_ENGINE_VERSION }),
  );

  return result;
}
