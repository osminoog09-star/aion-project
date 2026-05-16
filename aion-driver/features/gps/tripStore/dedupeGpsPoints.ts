import { MAX_ACCURACY_METERS, MIN_STEP_METERS } from "../../../services/locationGpsConstants";
import { haversineMeters } from "../../../utils/geo";
import type { GpsIngestionMeta, GpsPointSource, GpsTripPointRecord } from "./gpsTripTypes";

const MIN_TS_GAP_MS = 2_000;
const DRIFT_MAX_M = 12;

function sortByTime(points: GpsTripPointRecord[]): GpsTripPointRecord[] {
  return [...points].sort((a, b) => a.t - b.t);
}

/**
 * Стабильное слияние: timestamp + waterline + drift + duplicate t.
 */
export function dedupeMergeGpsPoints(
  existing: GpsTripPointRecord[],
  incoming: GpsTripPointRecord[],
  meta: GpsIngestionMeta,
): { points: GpsTripPointRecord[]; meta: GpsIngestionMeta } {
  let seq = meta.lastSeq;
  const seenTs = new Set(existing.map((p) => p.t));
  const out: GpsTripPointRecord[] = [...existing];

  const sortedIn = sortByTime(incoming);
  for (const p of sortedIn) {
    const src: GpsPointSource = p.src ?? "foreground";
    if (src === "headless" && p.t <= meta.headlessWaterlineMs) continue;
    if (seenTs.has(p.t)) continue;

    const last = out[out.length - 1];
    if (last) {
      const dt = p.t - last.t;
      if (dt > 0 && dt < MIN_TS_GAP_MS) continue;
      const seg = haversineMeters(last, p);
      const moved = (p.dM ?? 0) > MIN_STEP_METERS || seg >= MIN_STEP_METERS;
      if (!moved && seg < DRIFT_MAX_M) continue;
    }

    if (p.acc != null && p.acc > MAX_ACCURACY_METERS) continue;

    seq += 1;
    const rec: GpsTripPointRecord = { ...p, seq };
    out.push(rec);
    seenTs.add(p.t);

    if (src === "headless") {
      meta = { ...meta, headlessWaterlineMs: Math.max(meta.headlessWaterlineMs, p.t) };
    }
    if (src === "foreground") {
      meta = { ...meta, lastForegroundTs: p.t };
    }
    meta = { ...meta, lastSeq: seq };
  }

  return { points: sortByTime(out), meta };
}
