import type { LocationTick } from "../../../services/locationService";
import {
  appendPendingHeadlessRecords,
  clearPendingHeadlessForShift,
  takePendingHeadlessRecords,
} from "../../analytics/storage/pendingHeadlessGpsStorage";
import {
  bindGpsTripBuffer,
  flushGpsTripBuffer,
  pushGpsTripTick,
  unbindAndFlushGpsTripBuffer,
} from "../tripStore/gpsTripBuffer";
import type { GpsTripPointRecord } from "../tripStore/gpsTripTypes";
import {
  initGpsTripSession,
  tickToGpsRecord,
} from "../tripStore/gpsTripStorage";
import type { GpsStorageAdapter } from "../storage/gpsStorageAdapter";
import { createJsonGpsStorageAdapter } from "../storage/gpsStorageAdapter";
import { ensureGpsSessionForShift } from "./ensureGpsSession";

/**
 * Single ingestion gateway for foreground, background, and headless batches.
 * Pending headless persisted by shiftId — safe across cold start / resumeShift.
 */
export class GpsIngestionGateway {
  private adapter: GpsStorageAdapter;
  private activeShiftId: string | null = null;
  private memoryPending = new Map<string, GpsTripPointRecord[]>();

  constructor(adapter: GpsStorageAdapter = createJsonGpsStorageAdapter()) {
    this.adapter = adapter;
  }

  async resumeShift(shiftId: string): Promise<void> {
    this.activeShiftId = shiftId;
    bindGpsTripBuffer(shiftId);
    await this.flushPendingForShift(shiftId);
  }

  async startShift(shiftId: string, startedAtMs: number): Promise<void> {
    this.activeShiftId = shiftId;
    await this.adapter.initSession(shiftId, startedAtMs);
    bindGpsTripBuffer(shiftId);
    await this.flushPendingForShift(shiftId);
  }

  ingestForegroundTick(tick: LocationTick): void {
    if (!this.activeShiftId) return;
    pushGpsTripTick(tick);
  }

  async ingestHeadlessRecords(shiftId: string, records: GpsTripPointRecord[]): Promise<void> {
    if (!records.length) return;

    if (this.activeShiftId !== shiftId) {
      const mem = this.memoryPending.get(shiftId) ?? [];
      this.memoryPending.set(shiftId, [...mem, ...records]);
      await appendPendingHeadlessRecords(shiftId, records);
      return;
    }

    await this.appendToActiveShift(shiftId, records);
  }

  async ingestHeadlessBatch(shiftId: string, ticks: LocationTick[]): Promise<void> {
    if (!ticks.length) return;
    const records = ticks.map((t) => ({ ...tickToGpsRecord(t), src: "headless" as const }));
    await this.ingestHeadlessRecords(shiftId, records);
  }

  async endShift(shiftId: string) {
    await unbindAndFlushGpsTripBuffer();
    await this.flushPendingForShift(shiftId);
    this.activeShiftId = null;
    this.memoryPending.delete(shiftId);
    await clearPendingHeadlessForShift(shiftId);
    return this.adapter.finalizeSession(shiftId);
  }

  async pauseFlush(): Promise<void> {
    await flushGpsTripBuffer();
  }

  private async flushPendingForShift(shiftId: string): Promise<void> {
    const mem = this.memoryPending.get(shiftId) ?? [];
    this.memoryPending.delete(shiftId);
    const disk = await takePendingHeadlessRecords(shiftId);
    const batch = [...disk, ...mem];
    if (!batch.length) return;
    await this.appendToActiveShift(shiftId, batch);
  }

  private async appendToActiveShift(
    shiftId: string,
    records: GpsTripPointRecord[],
  ): Promise<void> {
    await ensureGpsSessionForShift(this.adapter, shiftId);
    await flushGpsTripBuffer();
    await this.adapter.appendPoints(shiftId, records);
  }
}

export const gpsIngestionGateway = new GpsIngestionGateway();

/** @internal test / recovery */
export async function initGpsSessionIfMissing(
  shiftId: string,
  startedAtMs: number,
): Promise<void> {
  await initGpsTripSession(shiftId, startedAtMs);
}
