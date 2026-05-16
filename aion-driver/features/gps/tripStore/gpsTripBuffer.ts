import type { LocationTick } from "../../../services/locationService";
import { appendGpsTripPoints, tickToGpsRecord } from "./gpsTripStorage";
import type { GpsTripPointRecord } from "./gpsTripTypes";

const FLUSH_EVERY_N = 12;
const HEARTBEAT_MS = 25_000;

let activeShiftId: string | null = null;
let buffer: GpsTripPointRecord[] = [];
let lastHeartbeatMs = 0;
let lastFlushPromise: Promise<void> = Promise.resolve();

export function bindGpsTripBuffer(shiftId: string | null): void {
  if (shiftId === activeShiftId) return;
  void flushGpsTripBuffer();
  activeShiftId = shiftId;
  buffer = [];
  lastHeartbeatMs = shiftId ? Date.now() : 0;
}

export function pushGpsTripTick(tick: LocationTick): void {
  if (!activeShiftId) return;
  const now = Date.now();
  const rec = tickToGpsRecord(tick);
  const moved = (rec.dM ?? 0) > 0;
  const heartbeat = now - lastHeartbeatMs >= HEARTBEAT_MS;

  if (moved || heartbeat) {
    buffer.push(rec);
    if (heartbeat) lastHeartbeatMs = now;
  }

  if (buffer.length >= FLUSH_EVERY_N) {
    void flushGpsTripBuffer();
  }
}

export async function flushGpsTripBuffer(): Promise<void> {
  const id = activeShiftId;
  const batch = buffer;
  buffer = [];
  if (!id || !batch.length) return;
  lastFlushPromise = lastFlushPromise.then(() => appendGpsTripPoints(id, batch));
  await lastFlushPromise;
}

export async function unbindAndFlushGpsTripBuffer(): Promise<void> {
  await flushGpsTripBuffer();
  activeShiftId = null;
  buffer = [];
}
