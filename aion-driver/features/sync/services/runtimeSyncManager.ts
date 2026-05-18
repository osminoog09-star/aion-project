import { AppState, type AppStateStatus } from "react-native";
import NetInfo, { type NetInfoSubscription } from "@react-native-community/netinfo";
import { captureSyncError } from "../../../lib/sentry";
import { useRuntimePulse } from "../../../src/core/aion/runtime/runtimePulseBus";
import { onShiftRecorded } from "../../trips/services/shiftRecordedBus";
import { peekSyncQueue } from "./offlineQueue";
import { flushSyncQueue } from "./syncEngine";

/**
 * Intelligent Auto-Sync Manager.
 *
 * Цель: пользователь НИКОГДА не должен жать «SYNC» руками. Сфера живёт сама.
 *
 * Триггеры (всё debounce + дедуп):
 *  - app start                → init()
 *  - app resume (foreground)  → AppState 'active'
 *  - network reconnect        → NetInfo isConnected: false → true
 *  - shift recorded           → onShiftRecorded
 *  - external request         → request(reason)
 *  - periodic foreground tick → каждые 60s пока приложение активно
 *
 * Контракт:
 *  - flush НЕ блокирует UI: всё async, ошибки идут в Sentry, состояние — в runtimePulseBus
 *  - flush один за раз: внутренний lock + chained queue (no overlap)
 *  - debounce 600ms: серия событий за короткое время вызывает один прогон
 *  - userId передаётся через setUserId() из CloudSyncBootstrap (одно место знает auth)
 */

type Reason =
  | "app_start"
  | "app_resume"
  | "net_reconnect"
  | "shift_recorded"
  | "manual"
  | "periodic"
  | "external";

const DEBOUNCE_MS = 600;
const PERIODIC_MS = 60_000;

type State = {
  userId: string | null;
  online: boolean;
  appActive: boolean;
  initialized: boolean;
  debounce: ReturnType<typeof setTimeout> | null;
  periodic: ReturnType<typeof setInterval> | null;
  inFlight: Promise<void> | null;
  pending: Reason | null;
  netSub: NetInfoSubscription | null;
  appSub: { remove: () => void } | null;
  shiftUnsub: (() => void) | null;
};

const state: State = {
  userId: null,
  online: true,
  appActive: true,
  initialized: false,
  debounce: null,
  periodic: null,
  inFlight: null,
  pending: null,
  netSub: null,
  appSub: null,
  shiftUnsub: null,
};

function clearDebounce() {
  if (state.debounce) {
    clearTimeout(state.debounce);
    state.debounce = null;
  }
}

function clearPeriodic() {
  if (state.periodic) {
    clearInterval(state.periodic);
    state.periodic = null;
  }
}

async function runFlushOnce(reason: Reason): Promise<void> {
  const pulse = useRuntimePulse.getState();
  const uid = state.userId;
  if (!uid) {
    pulse.noteSyncResult("idle", 0);
    return;
  }
  const before = (await peekSyncQueue()).length;
  if (!state.online && before === 0) {
    pulse.noteSyncResult("idle", 0);
    return;
  }
  pulse.setSyncBusy(true, before > 0 ? "running" : "queued");
  try {
    await flushSyncQueue(uid);
    const after = (await peekSyncQueue()).length;
    const delta = Math.max(0, before - after);
    pulse.noteSyncResult("ok", delta);
  } catch (e) {
    captureSyncError(e, { phase: "runtime_sync_manager", reason });
    pulse.noteSyncResult("error", 0);
  }
}

function scheduleFlush(reason: Reason): void {
  state.pending = reason;
  clearDebounce();
  state.debounce = setTimeout(() => {
    state.debounce = null;
    const r = state.pending ?? "external";
    state.pending = null;
    if (state.inFlight) {
      void state.inFlight.then(() => {
        state.inFlight = runFlushOnce(r).finally(() => {
          state.inFlight = null;
        });
      });
      return;
    }
    state.inFlight = runFlushOnce(r).finally(() => {
      state.inFlight = null;
    });
  }, DEBOUNCE_MS);
}

function handleAppState(s: AppStateStatus): void {
  const wasActive = state.appActive;
  state.appActive = s === "active";
  if (state.appActive) {
    if (!state.periodic) {
      state.periodic = setInterval(() => {
        scheduleFlush("periodic");
      }, PERIODIC_MS);
    }
    if (!wasActive) scheduleFlush("app_resume");
  } else {
    clearPeriodic();
  }
}

function handleNet(isOnline: boolean): void {
  const was = state.online;
  state.online = isOnline;
  if (!was && isOnline) {
    useRuntimePulse.getState().pingRecovery();
    scheduleFlush("net_reconnect");
  }
  useRuntimePulse.getState().pingNetwork();
}

export function initRuntimeSyncManager(): void {
  if (state.initialized) return;
  state.initialized = true;
  state.appActive = AppState.currentState === "active";
  state.appSub = AppState.addEventListener("change", handleAppState);
  state.netSub = NetInfo.addEventListener((info) => {
    const on = info.isConnected === true && info.isInternetReachable !== false;
    handleNet(on);
  });
  state.shiftUnsub = onShiftRecorded(() => scheduleFlush("shift_recorded"));
  if (state.appActive) {
    state.periodic = setInterval(() => scheduleFlush("periodic"), PERIODIC_MS);
  }
  scheduleFlush("app_start");
}

export function disposeRuntimeSyncManager(): void {
  clearDebounce();
  clearPeriodic();
  if (state.netSub) {
    try {
      state.netSub();
    } catch {
      // intentionally ignored: bus teardown isolation
    }
    state.netSub = null;
  }
  if (state.appSub) {
    try {
      state.appSub.remove();
    } catch {
      // intentionally ignored: bus teardown isolation
    }
    state.appSub = null;
  }
  if (state.shiftUnsub) {
    try {
      state.shiftUnsub();
    } catch {
      // intentionally ignored: bus teardown isolation
    }
    state.shiftUnsub = null;
  }
  state.initialized = false;
}

export function setRuntimeSyncUserId(userId: string | null): void {
  if (state.userId === userId) return;
  state.userId = userId;
  if (userId) scheduleFlush("app_start");
}

/** Запросить sync вручную (например, тап на сферу). UI остаётся отзывчивым. */
export function requestRuntimeSync(reason: Reason = "manual"): void {
  scheduleFlush(reason);
}
