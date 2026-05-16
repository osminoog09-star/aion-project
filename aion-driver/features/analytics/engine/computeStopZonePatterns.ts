import { detectStopPoints } from "../../gps/tripStore/detectStopPoints";
import type { GpsStopPoint, ShiftGpsSession } from "../../gps/tripStore/gpsTripTypes";
import { haversineMeters } from "../../../utils/geo";
import { WEEKDAY_LABELS_RU } from "../types/historicalDriverRollupsTypes";
import type { ShiftAnalyticsSnapshot } from "../types/shiftAnalyticsTypes";
import type { StopZoneInsight, StopZonePatterns } from "../types/stopZonePatternsTypes";

const CLUSTER_RADIUS_M = 120;
const MIN_CLUSTER_SHIFTS = 2;
const MIN_CLUSTER_STOPS = 3;
const MIN_CLUSTER_IDLE_MS = 15 * 60_000;
const MIN_PEAK_WAITING_MS = 20 * 60_000;
import {
  STOP_ZONE_MIN_CLUSTER_SHIFTS,
  STOP_ZONE_MIN_OBSERVATIONS,
} from "../stopZoneProgressRu";

const MIN_OBSERVATIONS = STOP_ZONE_MIN_OBSERVATIONS;
const WEEKDAY_IDLE_DELTA = 0.12;

type StopObservation = {
  shiftId: string;
  lat: number;
  lng: number;
  startedAtMs: number;
  durationMs: number;
  weekday: number;
  hour: number;
};

type StopCluster = {
  centroidLat: number;
  centroidLng: number;
  stops: StopObservation[];
};

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function padHour(h: number): string {
  return String(h).padStart(2, "0");
}

function formatCoordLabel(lat: number, lng: number): string {
  return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
}

function filterSnapshotsByWindow(
  snapshots: ShiftAnalyticsSnapshot[],
  windowDays: number,
  nowMs: number,
): ShiftAnalyticsSnapshot[] {
  const cutoff = nowMs - windowDays * 86_400_000;
  return snapshots.filter((s) => s.time.shiftEndedAtMs >= cutoff);
}

function resolveStops(session: ShiftGpsSession): GpsStopPoint[] {
  if (session.stops.length > 0) return session.stops;
  if (session.points.length >= 2) return detectStopPoints(session.points);
  return [];
}

function buildObservations(
  snapshots: ShiftAnalyticsSnapshot[],
  sessions: ShiftGpsSession[],
): StopObservation[] {
  const snapshotIds = new Set(snapshots.map((s) => s.shiftId));
  const observations: StopObservation[] = [];

  for (const session of sessions) {
    if (!snapshotIds.has(session.shiftId)) continue;
    for (const stop of resolveStops(session)) {
      if (stop.durationMs < 3 * 60_000) continue;
      const started = new Date(stop.startedAtMs);
      observations.push({
        shiftId: session.shiftId,
        lat: stop.lat,
        lng: stop.lng,
        startedAtMs: stop.startedAtMs,
        durationMs: stop.durationMs,
        weekday: started.getDay(),
        hour: started.getHours(),
      });
    }
  }

  return observations;
}

function recomputeCentroid(cluster: StopCluster): void {
  let weight = 0;
  let lat = 0;
  let lng = 0;
  for (const s of cluster.stops) {
    lat += s.lat * s.durationMs;
    lng += s.lng * s.durationMs;
    weight += s.durationMs;
  }
  if (weight <= 0) return;
  cluster.centroidLat = lat / weight;
  cluster.centroidLng = lng / weight;
}

function clusterStops(observations: StopObservation[]): StopCluster[] {
  const clusters: StopCluster[] = [];

  for (const obs of observations) {
    let best: StopCluster | null = null;
    let bestDist = Infinity;

    for (const cluster of clusters) {
      const dist = haversineMeters(obs, {
        lat: cluster.centroidLat,
        lng: cluster.centroidLng,
      });
      if (dist <= CLUSTER_RADIUS_M && dist < bestDist) {
        best = cluster;
        bestDist = dist;
      }
    }

    if (best) {
      best.stops.push(obs);
      recomputeCentroid(best);
    } else {
      clusters.push({
        centroidLat: obs.lat,
        centroidLng: obs.lng,
        stops: [obs],
      });
    }
  }

  return clusters;
}

function buildPeakWaitingInsight(observations: StopObservation[]): StopZoneInsight | null {
  if (observations.length < MIN_OBSERVATIONS) return null;

  const hourWeight = Array.from({ length: 24 }, () => 0);
  for (const o of observations) {
    hourWeight[o.hour]! += o.durationMs;
  }

  let bestStart = 0;
  let bestSum = 0;
  for (let h = 0; h < 24; h++) {
    const sum = hourWeight[h]! + hourWeight[(h + 1) % 24]!;
    if (sum > bestSum) {
      bestSum = sum;
      bestStart = h;
    }
  }

  if (bestSum < MIN_PEAK_WAITING_MS) return null;

  const endHour = (bestStart + 2) % 24;
  const shiftIds = new Set(
    observations
      .filter((o) => o.hour === bestStart || o.hour === (bestStart + 1) % 24)
      .map((o) => o.shiftId),
  );

  return {
    text: `Часто ожидание ${padHour(bestStart)}:00–${padHour(endHour)}:00`,
    evidence: `${observations.length} остановок · ${shiftIds.size} смен · ${Math.round(bestSum / 60_000)} мин простоя в окне`,
  };
}

function buildWeekdayIdleInsight(
  snapshots: ShiftAnalyticsSnapshot[],
): StopZoneInsight | null {
  const weekday = snapshots.filter((s) => {
    const d = new Date(s.time.shiftStartedAtMs).getDay();
    return d >= 1 && d <= 5;
  });
  const weekend = snapshots.filter((s) => {
    const d = new Date(s.time.shiftStartedAtMs).getDay();
    return d === 0 || d === 6;
  });

  if (weekday.length < 2 || weekend.length < 2) return null;

  const weekdayIdle = mean(weekday.map((s) => s.idle.idleRatio));
  const weekendIdle = mean(weekend.map((s) => s.idle.idleRatio));
  if (weekdayIdle == null || weekendIdle == null) return null;
  if (weekdayIdle < weekendIdle + WEEKDAY_IDLE_DELTA) return null;

  return {
    text: `Долгие простои по будням (~${Math.round(weekdayIdle * 100)}% vs вых. ~${Math.round(weekendIdle * 100)}%)`,
    evidence: `${weekday.length} будн. (${WEEKDAY_LABELS_RU[1]}–${WEEKDAY_LABELS_RU[5]}) · ${weekend.length} вых. смен`,
  };
}

function buildHighIdleClusterInsight(clusters: StopCluster[]): StopZoneInsight | null {
  const ranked = clusters
    .map((cluster) => {
      const shiftIds = new Set(cluster.stops.map((s) => s.shiftId));
      const totalIdleMs = cluster.stops.reduce((sum, s) => sum + s.durationMs, 0);
      return { cluster, shiftCount: shiftIds.size, stopCount: cluster.stops.length, totalIdleMs };
    })
    .filter(
      (row) =>
        row.shiftCount >= MIN_CLUSTER_SHIFTS &&
        row.stopCount >= MIN_CLUSTER_STOPS &&
        row.totalIdleMs >= MIN_CLUSTER_IDLE_MS,
    )
    .sort((a, b) => b.totalIdleMs - a.totalIdleMs);

  const top = ranked[0];
  if (!top) return null;

  return {
    text: `Высокий простой возле ${formatCoordLabel(top.cluster.centroidLat, top.cluster.centroidLng)}`,
    evidence: `${top.shiftCount} смен · ${top.stopCount} остановок · ${Math.round(top.totalIdleMs / 60_000)} мин GPS-простоя`,
  };
}

/**
 * Кластеризация реальных GPS-остановок + текстовые инсайты.
 * ShiftAnalyticsSnapshot — фильтр окна; GPS stops — только факты с устройства.
 */
export function computeStopZonePatterns(
  snapshots: ShiftAnalyticsSnapshot[],
  sessions: ShiftGpsSession[],
  windowDays = 30,
  nowMs = Date.now(),
): StopZonePatterns | null {
  const inWindow = filterSnapshotsByWindow(snapshots, windowDays, nowMs);
  if (inWindow.length < 2) return null;

  const observations = buildObservations(inWindow, sessions);
  if (observations.length < MIN_OBSERVATIONS) {
    const weekdayOnly = buildWeekdayIdleInsight(inWindow);
    if (!weekdayOnly) return null;
    return {
      windowDays,
      sampleShifts: inWindow.length,
      stopObservationCount: observations.length,
      insights: [weekdayOnly],
    };
  }

  const clusters = clusterStops(observations);
  const insights: StopZoneInsight[] = [];

  const waiting = buildPeakWaitingInsight(observations);
  if (waiting) insights.push(waiting);

  const weekdayIdle = buildWeekdayIdleInsight(inWindow);
  if (weekdayIdle) insights.push(weekdayIdle);

  const highIdle = buildHighIdleClusterInsight(clusters);
  if (highIdle) insights.push(highIdle);

  if (!insights.length) return null;

  return {
    windowDays,
    sampleShifts: inWindow.length,
    stopObservationCount: observations.length,
    insights: insights.slice(0, 4),
  };
}

export {
  formatStopZoneProgressRu,
  STOP_ZONE_MIN_CLUSTER_SHIFTS,
  STOP_ZONE_MIN_OBSERVATIONS,
} from "../stopZoneProgressRu";
