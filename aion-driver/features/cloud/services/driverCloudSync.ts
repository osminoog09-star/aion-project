import type { Json } from "../../../lib/database.types";
import { requireSupabase } from "../../../lib/supabase";
import { captureSyncError } from "../../../lib/sentry";
import {
  loadDeviceSettings,
  mergeDeviceSettings,
  saveDeviceSettings,
} from "../../../services/deviceModeService";
import { loadProfile, saveProfile } from "../../../storage/driver/profileStorage";
import { loadShiftHistory, replaceHistory } from "../../../storage/driver/shiftHistoryStorage";
import {
  appendPendingFuelEntry,
  loadPendingFuelEntries,
} from "../../../storage/driver/pendingFuelStorage";
import {
  loadCloudSyncMeta,
  saveCloudSyncMeta,
} from "../../../storage/driver/cloudSyncMetaStorage";
import type { Shift, UserProfile } from "../../../types";
import {
  DEFAULT_DEVICE_SETTINGS,
  type DeviceSettings,
} from "../../../types/device";
import {
  fetchDriverCloudState,
  upsertDriverCloudStatePayload,
} from "../repositories/driverCloudStateRepository";
import {
  listTrips,
  rowPayloadToShift,
  upsertTripFromShift,
} from "../repositories/tripsRepository";
import { syncLocalUserProfileToCloud } from "../repositories/profileRepository";
import { enqueueSyncOperation } from "../../sync/services/offlineQueue";
import {
  parseDriverCloudBackup,
  type DriverCloudBackupPayload,
} from "../types/driverCloudBackup";
import { emitCloudDataRestored } from "./cloudRestoreBus";

function mergeShiftHistories(local: Shift[], cloud: Shift[]): Shift[] {
  const byId = new Map<string, Shift>();
  for (const s of cloud) byId.set(s.id, s);
  for (const s of local) {
    const prev = byId.get(s.id);
    if (!prev || Date.parse(s.endedAt) >= Date.parse(prev.endedAt)) {
      byId.set(s.id, s);
    }
  }
  return [...byId.values()].sort(
    (a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt),
  );
}

export async function buildLocalDriverCloudBackup(): Promise<DriverCloudBackupPayload> {
  const [profile, deviceSettings, pendingFuelEntries] = await Promise.all([
    loadProfile(),
    loadDeviceSettings(),
    loadPendingFuelEntries(),
  ]);
  return {
    version: 1,
    updatedAtMs: Date.now(),
    profile,
    deviceSettings,
    pendingFuelEntries,
  };
}

export async function pushDriverCloudBackup(userId: string): Promise<void> {
  const client = requireSupabase();
  const payload = await buildLocalDriverCloudBackup();
  const profile = payload.profile;
  if (profile) {
    await syncLocalUserProfileToCloud(client, userId, profile);
  }
  await upsertDriverCloudStatePayload(
    client,
    userId,
    payload as unknown as Json,
  );
  await saveCloudSyncMeta(userId, {
    lastPushAtMs: payload.updatedAtMs,
  });
}

async function applyCloudProfile(profile: UserProfile): Promise<boolean> {
  const local = await loadProfile();
  if (local?.name && local.carModel && !profile.name) return false;
  await saveProfile(profile);
  return true;
}

async function applyCloudDeviceSettings(
  incoming: DeviceSettings,
): Promise<boolean> {
  const local = await loadDeviceSettings();
  const merged = mergeDeviceSettings({ ...local, ...incoming });
  await saveDeviceSettings(merged);
  return true;
}

async function applyPendingFuel(entries: DriverCloudBackupPayload["pendingFuelEntries"]): Promise<void> {
  if (!entries.length) return;
  const local = await loadPendingFuelEntries();
  const ids = new Set(local.map((e) => e.id));
  for (const e of entries) {
    if (!ids.has(e.id)) {
      await appendPendingFuelEntry(e);
    }
  }
}

export async function restoreDriverDataFromCloud(userId: string): Promise<void> {
  const client = requireSupabase();
  const meta = await loadCloudSyncMeta(userId);

  let changed = false;

  const stateRow = await fetchDriverCloudState(client, userId);
  const cloudPayload = parseDriverCloudBackup(stateRow?.payload);

  const localProfile = await loadProfile();

  if (cloudPayload?.profile && !localProfile) {
    await applyCloudProfile(cloudPayload.profile);
    changed = true;
  }

  if (cloudPayload?.deviceSettings) {
    const localSettings = await loadDeviceSettings();
    const cloudTs = cloudPayload.updatedAtMs;
    const localIsDefault =
      localSettings.currencyCode === DEFAULT_DEVICE_SETTINGS.currencyCode &&
      localSettings.regionCountryCode === DEFAULT_DEVICE_SETTINGS.regionCountryCode;
    if (!localProfile || cloudTs > meta.lastPullAtMs || localIsDefault) {
      await applyCloudDeviceSettings(cloudPayload.deviceSettings);
      changed = true;
    }
  }

  if (cloudPayload?.pendingFuelEntries?.length) {
    await applyPendingFuel(cloudPayload.pendingFuelEntries);
    changed = true;
  }

  const tripRows = await listTrips(client, userId, 500);
  const cloudShifts = tripRows
    .map((r) => rowPayloadToShift(r))
    .filter((s): s is Shift => s != null);
  if (cloudShifts.length > 0) {
    const localHistory = await loadShiftHistory();
    const merged = mergeShiftHistories(localHistory, cloudShifts);
    if (merged.length !== localHistory.length) {
      await replaceHistory(merged);
      changed = true;
    } else {
      const localIds = new Set(localHistory.map((s) => s.id));
      if (cloudShifts.some((s) => !localIds.has(s.id))) {
        await replaceHistory(merged);
        changed = true;
      }
    }
  }

  await saveCloudSyncMeta(userId, { lastPullAtMs: Date.now() });

  if (changed) {
    emitCloudDataRestored();
  }
}

export async function backfillLocalDataToCloud(userId: string): Promise<void> {
  const meta = await loadCloudSyncMeta(userId);
  if (meta.backfillDone) return;

  const history = await loadShiftHistory();
  for (const shift of history) {
    await enqueueSyncOperation({
      type: "trip_upsert",
      payload: shift,
      dedupeKey: `trip:${shift.id}`,
    });
  }

  await pushDriverCloudBackup(userId);
  await saveCloudSyncMeta(userId, { backfillDone: true });
}

export async function runCloudRestoreAndBackfill(userId: string): Promise<void> {
  try {
    await restoreDriverDataFromCloud(userId);
    await backfillLocalDataToCloud(userId);
  } catch (e) {
    captureSyncError(e, { phase: "cloud_restore_backfill", userId });
    throw e;
  }
}
