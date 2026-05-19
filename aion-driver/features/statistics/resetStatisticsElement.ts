import AsyncStorage from "@react-native-async-storage/async-storage";
import { listGpsTripShiftIds } from "../gps/tripStore/gpsTripStorage";
import { listShiftAnalyticsIds } from "../analytics/storage/shiftAnalyticsStorage";
import { clearSyncQueue } from "../sync/services/offlineQueue";
import { clearBackgroundShiftLocationRuntimeState } from "../../tasks/shiftLocationTask";
import { loadShiftHistory, replaceHistory } from "../../storage/driver/shiftHistoryStorage";
import { saveActiveShift } from "../../storage/driver/activeShiftStorage";
import { clearPendingFuelEntries } from "../../storage/driver/pendingFuelStorage";
import {
  loadPostShiftHandoff,
  savePostShiftHandoff,
} from "../../storage/driver/postShiftHandoffStorage";
import { loadPendingFuelEntries } from "../../storage/driver/pendingFuelStorage";
import {
  deleteCloudTripsForUser,
  executeFullLocalStatisticsReset,
} from "../../storage/driver/resetDriverStatistics";
import { STORAGE_KEYS } from "../../storage/core/keys";
import { filterShiftsByPeriod } from "./shiftPeriod";
import type { StatResetResult, StatResetTarget } from "./types";
const TIMELINE_KEY = "@aion/core/timeline_v1";

async function removeGpsForShiftIds(shiftIds: string[]): Promise<number> {
  if (!shiftIds.length) return 0;
  const keys = shiftIds.map((id) => `${STORAGE_KEYS.SHIFT_GPS_PREFIX}${id}`);
  await AsyncStorage.multiRemove(keys);
  const all = await listGpsTripShiftIds();
  const remaining = all.filter((id) => !shiftIds.includes(id));
  await AsyncStorage.setItem(STORAGE_KEYS.SHIFT_GPS_INDEX, JSON.stringify(remaining));
  return shiftIds.length;
}

async function removeAnalyticsForShiftIds(shiftIds: string[]): Promise<number> {
  if (!shiftIds.length) return 0;
  const keys = shiftIds.map((id) => `${STORAGE_KEYS.SHIFT_ANALYTICS_PREFIX}${id}`);
  await AsyncStorage.multiRemove(keys);
  const all = await listShiftAnalyticsIds();
  const remaining = all.filter((id) => !shiftIds.includes(id));
  await AsyncStorage.setItem(STORAGE_KEYS.SHIFT_ANALYTICS_INDEX, JSON.stringify(remaining));
  return shiftIds.length;
}

async function removeShiftsFromHistory(shiftIds: Set<string>): Promise<number> {
  const history = await loadShiftHistory();
  const toRemove = history.filter((s) => shiftIds.has(s.id));
  if (!toRemove.length) return 0;
  const ids = toRemove.map((s) => s.id);
  const next = history.filter((s) => !shiftIds.has(s.id));
  await replaceHistory(next);
  await removeGpsForShiftIds(ids);
  await removeAnalyticsForShiftIds(ids);
  await reconcilePostShiftHandoff(shiftIds);
  return toRemove.length;
}

async function removeShiftsByPeriod(period: "today" | "7d" | "30d"): Promise<number> {
  const history = await loadShiftHistory();
  const doomed = filterShiftsByPeriod(history, period);
  return removeShiftsFromHistory(new Set(doomed.map((s) => s.id)));
}

async function removeOrphanGps(): Promise<number> {
  const [gpsIds, history] = await Promise.all([listGpsTripShiftIds(), loadShiftHistory()]);
  const historyIds = new Set(history.map((s) => s.id));
  const orphan = gpsIds.filter((id) => !historyIds.has(id));
  return removeGpsForShiftIds(orphan);
}

async function removeAllGps(): Promise<number> {
  const ids = await listGpsTripShiftIds();
  if (!ids.length) {
    await AsyncStorage.removeItem(STORAGE_KEYS.SHIFT_GPS_INDEX);
    return 0;
  }
  const keys = ids.map((id) => `${STORAGE_KEYS.SHIFT_GPS_PREFIX}${id}`);
  await AsyncStorage.multiRemove([...keys, STORAGE_KEYS.SHIFT_GPS_INDEX]);
  return ids.length;
}

async function removeAllAnalytics(): Promise<number> {
  const ids = await listShiftAnalyticsIds();
  if (!ids.length) {
    await AsyncStorage.removeItem(STORAGE_KEYS.SHIFT_ANALYTICS_INDEX);
    return 0;
  }
  const keys = ids.map((id) => `${STORAGE_KEYS.SHIFT_ANALYTICS_PREFIX}${id}`);
  await AsyncStorage.multiRemove([...keys, STORAGE_KEYS.SHIFT_ANALYTICS_INDEX]);
  return ids.length;
}

export type ResetElementContext = {
  hasActiveShift: boolean;
  userId?: string | null;
};

export async function resetStatisticsElement(
  target: StatResetTarget,
  ctx: ResetElementContext,
): Promise<StatResetResult> {
  const { id } = target;

  const needsNoActive =
    id === "shifts_all" ||
    id === "shifts_today" ||
    id === "shifts_7d" ||
    id === "shifts_30d" ||
    id === "shift_one" ||
    id === "everything_local" ||
    id === "post_shift_handoff" ||
    id === "cloud_trips";

  if (needsNoActive && ctx.hasActiveShift) {
    return {
      ok: false,
      error: "Сначала завершите или сбросьте текущую смену.",
    };
  }

  try {
    switch (id) {
      case "shifts_today": {
        const n = await removeShiftsByPeriod("today");
        return { ok: true, affected: n, message: n ? `Удалено смен: ${n}` : "Нечего удалять" };
      }
      case "shifts_7d": {
        const n = await removeShiftsByPeriod("7d");
        return { ok: true, affected: n, message: n ? `Удалено смен: ${n}` : "Нечего удалять" };
      }
      case "shifts_30d": {
        const n = await removeShiftsByPeriod("30d");
        return { ok: true, affected: n, message: n ? `Удалено смен: ${n}` : "Нечего удалять" };
      }
      case "shifts_all": {
        const hist = await loadShiftHistory();
        const n = hist.length;
        await replaceHistory([]);
        await removeAllGps();
        await removeAllAnalytics();
        return { ok: true, affected: n, message: n ? `Удалено смен: ${n}` : "История уже пуста" };
      }
      case "shift_one": {
        const n = await removeShiftsFromHistory(new Set([target.shiftId]));
        return { ok: true, affected: n, message: n ? "Смена удалена" : "Смена не найдена" };
      }
      case "gps_all": {
        const n = await removeAllGps();
        return { ok: true, affected: n, message: n ? `GPS-сессий: ${n}` : "Нет треков" };
      }
      case "gps_orphan": {
        const n = await removeOrphanGps();
        return { ok: true, affected: n, message: n ? `Удалено: ${n}` : "Нет осиротевших" };
      }
      case "analytics_all": {
        const n = await removeAllAnalytics();
        return { ok: true, affected: n, message: n ? `Снимков: ${n}` : "Нет аналитики" };
      }
      case "pending_fuel": {
        const before = await loadPendingFuelEntries();
        const n = before.length;
        await clearPendingFuelEntries();
        return { ok: true, affected: n, message: n ? `Заправок: ${n}` : "Очередь пуста" };
      }
      case "ocr": {
        await AsyncStorage.multiRemove([STORAGE_KEYS.OCR_IMPORTS, STORAGE_KEYS.OCR_QUEUE]);
        return { ok: true, message: "OCR очищен" };
      }
      case "timeline": {
        await AsyncStorage.removeItem(TIMELINE_KEY);
        return { ok: true, message: "Лента очищена" };
      }
      case "post_shift_handoff": {
        await savePostShiftHandoff(null);
        return { ok: true, message: "Итог смены скрыт" };
      }
      case "sync_queue": {
        await clearSyncQueue();
        return { ok: true, message: "Очередь синхронизации очищена" };
      }
      case "cloud_trips": {
        if (!ctx.userId) {
          return { ok: false, error: "Нужен вход в аккаунт для облачного сброса." };
        }
        const n = await deleteCloudTripsForUser(ctx.userId);
        return { ok: true, affected: n, message: n ? `Удалено в облаке: ${n}` : "В облаке пусто" };
      }
      case "active_shift": {
        if (!ctx.hasActiveShift) {
          return { ok: true, message: "Активной смены нет" };
        }
        const active = await (
          await import("../../storage/driver/activeShiftStorage")
        ).loadActiveShift();
        if (active?.id) {
          await removeGpsForShiftIds([active.id]);
          await removeAnalyticsForShiftIds([active.id]);
        }
        await saveActiveShift(null);
        await clearBackgroundShiftLocationRuntimeState();
        return { ok: true, message: "Текущая смена сброшена" };
      }
      case "everything_local": {
        const r = await executeFullLocalStatisticsReset();
        return {
          ok: true,
          affected: r.shifts,
          message: `Смен: ${r.shifts}, GPS: ${r.gpsSessions}, аналитика: ${r.analyticsSnapshots}`,
        };
      }
      default:
        return { ok: false, error: "Неизвестный элемент" };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** После сброса смен — обновить handoff если он ссылался на удалённую смену. */
export async function reconcilePostShiftHandoff(removedIds: Set<string>): Promise<void> {
  const handoff = await loadPostShiftHandoff();
  if (handoff && removedIds.has(handoff.id)) {
    await savePostShiftHandoff(null);
  }
}
