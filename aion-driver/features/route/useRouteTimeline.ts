import { useCallback, useEffect, useState } from "react";
import { loadShiftAnalytics } from "../analytics/storage/shiftAnalyticsStorage";
import type { ShiftAnalyticsSnapshot } from "../analytics/types/shiftAnalyticsTypes";
import { buildRouteSessionSummary } from "../gps/tripStore/buildRouteSummary";
import { listGpsTripShiftIds, loadGpsTripSession } from "../gps/tripStore/gpsTripStorage";
import type { RouteSessionSummary, ShiftGpsSession } from "../gps/tripStore/gpsTripTypes";
import type { Shift } from "../../types";

export type RouteTimelineRow = {
  shiftId: string;
  session: ShiftGpsSession;
  summary: RouteSessionSummary;
  shift?: Shift;
  analytics?: ShiftAnalyticsSnapshot;
  label: string;
};

export function useRouteTimeline(history: Shift[]) {
  const [rows, setRows] = useState<RouteTimelineRow[]>([]);
  const [analyticsByShift, setAnalyticsByShift] = useState<
    Map<string, ShiftAnalyticsSnapshot>
  >(() => new Map());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const ids = await listGpsTripShiftIds();
      const historyById = new Map(history.map((s) => [s.id, s]));
      const loaded: RouteTimelineRow[] = [];
      const analyticsMap = new Map<string, ShiftAnalyticsSnapshot>();

      for (const shiftId of ids) {
        const [session, analytics] = await Promise.all([
          loadGpsTripSession(shiftId),
          loadShiftAnalytics(shiftId),
        ]);
        if (!session) continue;
        if (analytics) analyticsMap.set(shiftId, analytics);

        const summary =
          analytics?.route
            ? {
                distanceMeters: analytics.route.distanceMeters,
                durationMs: analytics.route.durationMs,
                movingMs: analytics.route.movingMs,
                idleMs: analytics.route.idleMs,
                idleRatio: analytics.route.idleRatio,
                stopCount: analytics.route.stopCount,
                stopDurationMs: analytics.route.stopDurationMs,
                pointCount: analytics.route.pointCount,
                bounds: analytics.route.bounds,
                pathPreview: session.routeSummary?.pathPreview ?? [],
              }
            : session.routeSummary ??
              (session.points.length
                ? buildRouteSessionSummary({
                    points: session.points,
                    stops: session.stops,
                    startedAtMs: session.startedAtMs,
                    endedAtMs: session.endedAtMs ?? Date.now(),
                  })
                : null);

        if (!summary && session.points.length === 0) continue;

        const shift = historyById.get(shiftId);
        const started = new Date(session.startedAtMs);
        const label = shift
          ? `${new Date(shift.startedAt).toLocaleDateString()} · ${shift.id.slice(0, 8)}`
          : `${started.toLocaleDateString()} · ${shiftId.slice(0, 8)}`;

        if (!summary) continue;

        loaded.push({
          shiftId,
          session,
          summary,
          shift,
          analytics: analytics ?? undefined,
          label,
        });
      }

      loaded.sort((a, b) => b.session.startedAtMs - a.session.startedAtMs);
      setRows(loaded);
      setAnalyticsByShift(analyticsMap);
    } finally {
      setLoading(false);
    }
  }, [history]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, analyticsByShift, loading, refresh };
}
