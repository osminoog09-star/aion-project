import AsyncStorage from "@react-native-async-storage/async-storage";
import { listGpsTripShiftIds } from "../gps/tripStore/gpsTripStorage";
import { listShiftAnalyticsIds } from "../analytics/storage/shiftAnalyticsStorage";
import { peekSyncQueue } from "../sync/services/offlineQueue";
import { loadShiftHistory } from "../../storage/driver/shiftHistoryStorage";
import { loadPendingFuelEntries } from "../../storage/driver/pendingFuelStorage";
import { loadPostShiftHandoff } from "../../storage/driver/postShiftHandoffStorage";
import { loadActiveShift } from "../../storage/driver/activeShiftStorage";
import { STORAGE_KEYS } from "../../storage/core/keys";
import { listAionTimeline } from "../../storage/core/aionTimelineStorage";
import { STAT_ELEMENT_CATALOG } from "./catalog";
import { filterShiftsByPeriod, formatShiftRowLabel } from "./shiftPeriod";
import type { StatisticsInventory, StatElementId, StatElementInventoryItem } from "./types";
import { getCompletedShiftProfit } from "../../utils/shiftDisplayEconomics";

const TIMELINE_KEY = "@aion/core/timeline_v1";

async function ocrCount(): Promise<number> {
  const [imports, queue] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.OCR_IMPORTS),
    AsyncStorage.getItem(STORAGE_KEYS.OCR_QUEUE),
  ]);
  let n = 0;
  for (const raw of [imports, queue]) {
    if (!raw) continue;
    try {
      const v = JSON.parse(raw) as unknown;
      if (Array.isArray(v)) n += v.length;
    } catch {
      /* */
    }
  }
  return n;
}

export async function buildStatisticsInventory(): Promise<StatisticsInventory> {
  const [
    history,
    gpsIds,
    analyticsIds,
    pendingFuel,
    handoff,
    active,
    timeline,
    syncQueue,
    ocrN,
  ] = await Promise.all([
    loadShiftHistory(),
    listGpsTripShiftIds(),
    listShiftAnalyticsIds(),
    loadPendingFuelEntries(),
    loadPostShiftHandoff(),
    loadActiveShift(),
    listAionTimeline(80),
    peekSyncQueue(),
    ocrCount(),
  ]);

  const historyIds = new Set(history.map((s) => s.id));
  const orphanGps = gpsIds.filter((id) => !historyIds.has(id)).length;

  const today = filterShiftsByPeriod(history, "today");
  const week = filterShiftsByPeriod(history, "7d");
  const month = filterShiftsByPeriod(history, "30d");

  const counts: Record<StatElementId, { count: number; preview: string }> = {
    shifts_today: {
      count: today.length,
      preview: today.length
        ? `${today.length} смен · ${Math.round(today.reduce((a, s) => a + getCompletedShiftProfit(s), 0))} чистыми`
        : "Нет смен за сегодня",
    },
    shifts_7d: {
      count: week.length,
      preview: week.length
        ? `${week.length} смен · ${Math.round(week.reduce((a, s) => a + getCompletedShiftProfit(s), 0))} за 7 д`
        : "Пусто",
    },
    shifts_30d: {
      count: month.length,
      preview: month.length
        ? `${month.length} смен за 30 д`
        : "Пусто",
    },
    shifts_all: {
      count: history.length,
      preview: history.length
        ? `${history.length} смен в истории`
        : "История пуста",
    },
    shift_one: { count: history.length, preview: "Выберите смену ниже" },
    gps_all: {
      count: gpsIds.length,
      preview: gpsIds.length ? `${gpsIds.length} GPS-сессий` : "Нет треков",
    },
    gps_orphan: {
      count: orphanGps,
      preview: orphanGps ? `${orphanGps} без смены` : "Нет осиротевших",
    },
    analytics_all: {
      count: analyticsIds.length,
      preview: analyticsIds.length ? `${analyticsIds.length} снимков` : "Нет",
    },
    pending_fuel: {
      count: pendingFuel.length,
      preview: pendingFuel.length
        ? `${pendingFuel.length} записей`
        : "Очередь пуста",
    },
    ocr: {
      count: ocrN,
      preview: ocrN ? `${ocrN} элементов OCR` : "Пусто",
    },
    timeline: {
      count: timeline.length,
      preview: timeline.length ? `${timeline.length} событий` : "Лента пуста",
    },
    post_shift_handoff: {
      count: handoff ? 1 : 0,
      preview: handoff ? formatShiftRowLabel(handoff) : "Нет баннера",
    },
    sync_queue: {
      count: syncQueue.length,
      preview: syncQueue.length ? `${syncQueue.length} в очереди` : "Пусто",
    },
    cloud_trips: { count: -1, preview: "Сброс на сервере (все trips)" },
    active_shift: {
      count: active ? 1 : 0,
      preview: active
        ? `С ${new Date(active.startedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`
        : "Нет активной смены",
    },
    everything_local: {
      count:
        history.length +
        gpsIds.length +
        analyticsIds.length +
        pendingFuel.length +
        ocrN +
        timeline.length +
        (handoff ? 1 : 0) +
        syncQueue.length,
      preview: "Полный локальный сброс",
    },
  };

  const elements: StatElementInventoryItem[] = STAT_ELEMENT_CATALOG.filter(
    (d) => d.id !== "shift_one",
  ).map((d) => {
    const c = counts[d.id];
    return {
      ...d,
      count: c.count,
      preview: c.preview,
      empty: c.count === 0,
    };
  });

  const recentShifts = history.slice(0, 24).map((s) => ({
    id: s.id,
    endedAt: s.endedAt,
    netProfit: getCompletedShiftProfit(s),
    distanceKm: s.distanceKm,
    label: formatShiftRowLabel(s),
  }));

  return {
    elements,
    recentShifts,
    hasActiveShift: Boolean(active),
  };
}
