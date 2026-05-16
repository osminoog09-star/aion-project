import type {
  GpsTripPointRecord,
  GpsStopPoint,
  RouteSessionSummary,
  ShiftGpsSession,
} from "../tripStore/gpsTripTypes";

/**
 * Storage adapter (V1 JSON → future SQLite).
 * Analytics engine must depend on this interface, not on AsyncStorage shape.
 */

export type GpsTripSessionSummary = {
  shiftId: string;
  pointCount: number;
  stopCount: number;
  distanceMetersFromPoints: number;
  routeSummary?: RouteSessionSummary;
};

export interface GpsStorageAdapter {
  initSession(shiftId: string, startedAtMs: number): Promise<void>;
  appendPoints(shiftId: string, points: GpsTripPointRecord[]): Promise<void>;
  finalizeSession(shiftId: string): Promise<GpsTripSessionSummary | null>;
  loadSession(shiftId: string): Promise<ShiftGpsSession | null>;
  listSessionIds(): Promise<string[]>;
}

/** V1: delegates to tripStore/gpsTripStorage (JSON blobs). */
import {
  appendGpsTripPoints,
  finalizeGpsTripSession,
  initGpsTripSession,
  listGpsTripShiftIds,
  loadGpsTripSession,
} from "../tripStore/gpsTripStorage";

export function createJsonGpsStorageAdapter(): GpsStorageAdapter {
  return {
    initSession: initGpsTripSession,
    appendPoints: appendGpsTripPoints,
    finalizeSession: finalizeGpsTripSession,
    loadSession: loadGpsTripSession,
    listSessionIds: listGpsTripShiftIds,
  };
}

export type { GpsTripPointRecord, GpsStopPoint, ShiftGpsSession };
