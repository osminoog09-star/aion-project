import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocationTick } from "../../../services/locationService";
import { STORAGE_KEYS } from "../../../storage/core/keys";
import { buildRouteSessionSummary } from "./buildRouteSummary";
import { dedupeMergeGpsPoints } from "./dedupeGpsPoints";
import { detectStopPoints } from "./detectStopPoints";
import type {
  GpsIngestionMeta,
  GpsTripPointRecord,
  ShiftGpsSession,
  ShiftGpsSummary,
} from "./gpsTripTypes";

const MAX_POINTS_PER_SHIFT = 4_000;
const MAX_INDEXED_SHIFTS = 48;

function defaultIngestionMeta(): GpsIngestionMeta {
  return { headlessWaterlineMs: 0, lastSeq: 0 };
}

function sessionKey(shiftId: string): string {
  return `${STORAGE_KEYS.SHIFT_GPS_PREFIX}${shiftId}`;
}

function safeSession(raw: string | null): ShiftGpsSession | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as ShiftGpsSession;
    if (!v?.shiftId || !Array.isArray(v.points)) return null;
    return v;
  } catch {
    return null;
  }
}

function downsampleIfNeeded(points: GpsTripPointRecord[]): {
  points: GpsTripPointRecord[];
  truncated: boolean;
} {
  if (points.length <= MAX_POINTS_PER_SHIFT) {
    return { points, truncated: false };
  }
  const step = Math.ceil(points.length / MAX_POINTS_PER_SHIFT);
  const sampled = points.filter((_, i) => i % step === 0);
  return { points: sampled, truncated: true };
}

let serialized: Promise<unknown> = Promise.resolve();

function runSerialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = serialized.then(fn, fn);
  serialized = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function readIndex(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_GPS_INDEX);
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

async function writeIndex(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.SHIFT_GPS_INDEX,
    JSON.stringify(ids.slice(0, MAX_INDEXED_SHIFTS)),
  );
}

export async function initGpsTripSession(shiftId: string, startedAtMs: number): Promise<void> {
  await runSerialized(async () => {
    const session: ShiftGpsSession = {
      shiftId,
      startedAtMs,
      points: [],
      stops: [],
      pointCount: 0,
      ingestion: defaultIngestionMeta(),
    };
    await AsyncStorage.setItem(sessionKey(shiftId), JSON.stringify(session));
    const idx = await readIndex();
    const next = [shiftId, ...idx.filter((id) => id !== shiftId)];
    await writeIndex(next);
  });
}

export async function appendGpsTripPoints(
  shiftId: string,
  records: GpsTripPointRecord[],
): Promise<void> {
  if (!records.length) return;
  await runSerialized(async () => {
    const session = safeSession(await AsyncStorage.getItem(sessionKey(shiftId)));
    if (!session || session.endedAtMs) return;

    const meta = session.ingestion ?? defaultIngestionMeta();
    const { points: merged, meta: nextMeta } = dedupeMergeGpsPoints(
      session.points,
      records,
      meta,
    );
    const { points, truncated } = downsampleIfNeeded(merged);
    const next: ShiftGpsSession = {
      ...session,
      points,
      pointCount: points.length,
      truncated: session.truncated || truncated,
      ingestion: nextMeta,
    };
    await AsyncStorage.setItem(sessionKey(shiftId), JSON.stringify(next));
  });
}

export function tickToGpsRecord(tick: LocationTick): GpsTripPointRecord {
  return {
    t: tick.point.timestamp,
    lat: tick.point.lat,
    lng: tick.point.lng,
    acc: tick.point.accuracy ?? undefined,
    dM: tick.distanceDeltaMeters > 0 ? tick.distanceDeltaMeters : undefined,
    src: "foreground",
  };
}

export async function finalizeGpsTripSession(shiftId: string): Promise<ShiftGpsSummary | null> {
  return runSerialized(async () => {
    const session = safeSession(await AsyncStorage.getItem(sessionKey(shiftId)));
    if (!session) return null;
    const endedAtMs = Date.now();
    const stops = detectStopPoints(session.points);
    let distanceMetersFromPoints = 0;
    for (const p of session.points) {
      if (p.dM != null && p.dM > 0) distanceMetersFromPoints += p.dM;
    }
    const routeSummary = buildRouteSessionSummary({
      points: session.points,
      stops,
      startedAtMs: session.startedAtMs,
      endedAtMs,
    });
    const finalized: ShiftGpsSession = {
      ...session,
      endedAtMs,
      stops,
      pointCount: session.points.length,
      routeSummary,
    };
    await AsyncStorage.setItem(sessionKey(shiftId), JSON.stringify(finalized));
    return {
      shiftId,
      pointCount: finalized.pointCount,
      stopCount: stops.length,
      distanceMetersFromPoints,
      routeSummary,
    };
  });
}

export async function loadGpsTripSession(shiftId: string): Promise<ShiftGpsSession | null> {
  return safeSession(await AsyncStorage.getItem(sessionKey(shiftId)));
}

export async function listGpsTripShiftIds(): Promise<string[]> {
  return readIndex();
}
