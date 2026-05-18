import type { DeviceSettings } from "../../../types/device";
import type { FuelEntry, Shift, UserProfile } from "../../../types";

export const DRIVER_CLOUD_BACKUP_VERSION = 1 as const;

export type DriverCloudBackupPayload = {
  version: typeof DRIVER_CLOUD_BACKUP_VERSION;
  updatedAtMs: number;
  profile: UserProfile | null;
  deviceSettings: DeviceSettings | null;
  pendingFuelEntries: FuelEntry[];
};

export function emptyDriverCloudBackup(): DriverCloudBackupPayload {
  return {
    version: DRIVER_CLOUD_BACKUP_VERSION,
    updatedAtMs: Date.now(),
    profile: null,
    deviceSettings: null,
    pendingFuelEntries: [],
  };
}

export function parseDriverCloudBackup(raw: unknown): DriverCloudBackupPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== DRIVER_CLOUD_BACKUP_VERSION) return null;
  if (typeof o.updatedAtMs !== "number") return null;
  return {
    version: DRIVER_CLOUD_BACKUP_VERSION,
    updatedAtMs: o.updatedAtMs,
    profile: (o.profile as UserProfile | null) ?? null,
    deviceSettings: (o.deviceSettings as DeviceSettings | null) ?? null,
    pendingFuelEntries: Array.isArray(o.pendingFuelEntries)
      ? (o.pendingFuelEntries as FuelEntry[])
      : [],
  };
}
