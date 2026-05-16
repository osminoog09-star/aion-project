import { useCallback, useEffect, useState } from "react";
import {
  backfillMissingShiftAnalytics,
  type ShiftAnalyticsBackfillResult,
} from "../engine/backfillShiftAnalyticsSnapshots";
import { computeHistoricalDriverRollups } from "../engine/computeHistoricalDriverRollups";
import { computeStopZonePatterns } from "../engine/computeStopZonePatterns";
import {
  listShiftAnalyticsIds,
  loadShiftAnalytics,
} from "../storage/shiftAnalyticsStorage";
import type { HistoricalDriverRollups } from "../types/historicalDriverRollupsTypes";
import type { StopZonePatterns } from "../types/stopZonePatternsTypes";
import { loadGpsTripSession } from "../../gps/tripStore/gpsTripStorage";
import type { ShiftGpsSession } from "../../gps/tripStore/gpsTripTypes";

const DEFAULT_WINDOW_DAYS = 30;
const MAX_SNAPSHOTS = 48;

export function useHistoricalDriverRollups(windowDays = DEFAULT_WINDOW_DAYS) {
  const [rollups, setRollups] = useState<HistoricalDriverRollups | null>(null);
  const [stopZones, setStopZones] = useState<StopZonePatterns | null>(null);
  const [backfill, setBackfill] = useState<ShiftAnalyticsBackfillResult | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const backfillResult = await backfillMissingShiftAnalytics();
      setBackfill(backfillResult);
      const ids = (await listShiftAnalyticsIds()).slice(0, MAX_SNAPSHOTS);
      const snapshots = (
        await Promise.all(ids.map((id) => loadShiftAnalytics(id)))
      ).filter((s): s is NonNullable<typeof s> => s != null);

      const sessions: ShiftGpsSession[] = [];
      for (const id of ids) {
        const session = await loadGpsTripSession(id);
        if (session) sessions.push(session);
      }

      setRollups(computeHistoricalDriverRollups(snapshots, windowDays));
      setStopZones(computeStopZonePatterns(snapshots, sessions, windowDays));
    } finally {
      setLoading(false);
    }
  }, [windowDays]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rollups, stopZones, backfill, loading, refresh };
}
