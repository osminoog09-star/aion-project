import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocationObject } from "expo-location";
import type { ActiveShift } from "../../types";
import { gpsIngestionGateway } from "../../features/gps/ingestion/gpsIngestionGateway";
import { headlessLocationsToTripRecords } from "../../features/gps/tripStore/headlessToTripRecords";
import {
  computeHeadlessMergeResult,
  parseBgMergeState,
} from "../../services/headlessShiftLocationMerge";
import { normalizeActiveShift } from "../../utils/migrations";
import { STORAGE_KEYS } from "../core/keys";

let serializedChain: Promise<unknown> = Promise.resolve();

function runSerializedActiveShift<T>(fn: () => Promise<T>): Promise<T> {
  const next = serializedChain.then(fn, fn);
  serializedChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function readShiftFromDisk(): Promise<ActiveShift | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SHIFT);
  if (!raw) return null;
  try {
    return normalizeActiveShift(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeShiftToDisk(shift: ActiveShift | null): Promise<void> {
  if (!shift) {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SHIFT);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SHIFT, JSON.stringify(shift));
}

export async function loadActiveShift(): Promise<ActiveShift | null> {
  return runSerializedActiveShift(() => readShiftFromDisk());
}

export async function saveActiveShift(shift: ActiveShift | null): Promise<void> {
  return runSerializedActiveShift(() => writeShiftToDisk(shift));
}

/**
 * Headless FGS batch: один сериализованный RMW (без гонок с saveActiveShift / UI).
 */
export async function mergeHeadlessGpsLocationsIntoStore(
  locs: LocationObject[],
): Promise<void> {
  if (!locs.length) return;

  let tripShiftId: string | null = null;
  let tripRecords: ReturnType<typeof headlessLocationsToTripRecords> = [];

  await runSerializedActiveShift(async () => {
    const shift = await readShiftFromDisk();
    const mergeStateRaw = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_BG_MERGE_STATE);

    let waterlineMs = 0;
    if (shift) {
      const bg = parseBgMergeState(mergeStateRaw);
      if (bg?.shiftId === shift.id) waterlineMs = bg.lastMergedFixEpochMs;
    }

    const out = computeHeadlessMergeResult({ shift, mergeStateRaw, locs });
    if (!out) return;

    if (shift && !shift.paused) {
      tripShiftId = shift.id;
      tripRecords = headlessLocationsToTripRecords(locs, waterlineMs);
    }

    await writeShiftToDisk(out.nextShift);
    await AsyncStorage.setItem(STORAGE_KEYS.SHIFT_BG_MERGE_STATE, out.nextMergeStateJson);
    await AsyncStorage.setItem(STORAGE_KEYS.SHIFT_LOC_TASK_HEARTBEAT, out.heartbeatJson);
  });

  if (tripShiftId && tripRecords.length) {
    await gpsIngestionGateway.ingestHeadlessRecords(tripShiftId, tripRecords);
  }
}
