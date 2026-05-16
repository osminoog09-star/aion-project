import AsyncStorage from "@react-native-async-storage/async-storage";
import { dedupeMergeGpsPoints } from "../../gps/tripStore/dedupeGpsPoints";
import type { GpsIngestionMeta, GpsTripPointRecord } from "../../gps/tripStore/gpsTripTypes";
import { STORAGE_KEYS } from "../../../storage/core/keys";

type PendingStore = Record<string, GpsTripPointRecord[]>;

async function readStore(): Promise<PendingStore> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_HEADLESS_GPS);
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return {};
    return v as PendingStore;
  } catch {
    return {};
  }
}

async function writeStore(store: PendingStore): Promise<void> {
  const keys = Object.keys(store);
  if (!keys.length) {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_HEADLESS_GPS);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_HEADLESS_GPS, JSON.stringify(store));
}

export async function appendPendingHeadlessRecords(
  shiftId: string,
  records: GpsTripPointRecord[],
): Promise<void> {
  if (!records.length) return;
  const store = await readStore();
  const existing = store[shiftId] ?? [];
  const meta: GpsIngestionMeta = { headlessWaterlineMs: 0, lastSeq: 0 };
  const { points } = dedupeMergeGpsPoints(existing, records, meta);
  store[shiftId] = points;
  await writeStore(store);
}

export async function takePendingHeadlessRecords(
  shiftId: string,
): Promise<GpsTripPointRecord[]> {
  const store = await readStore();
  const batch = store[shiftId] ?? [];
  if (!batch.length) return [];
  delete store[shiftId];
  await writeStore(store);
  return batch;
}

export async function clearPendingHeadlessForShift(shiftId: string): Promise<void> {
  const store = await readStore();
  if (!store[shiftId]) return;
  delete store[shiftId];
  await writeStore(store);
}
