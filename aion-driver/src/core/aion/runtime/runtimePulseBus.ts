import { create } from "zustand";

/**
 * Лёгкая шина живых событий runtime для центральной сферы и floating orb.
 * Sphere подписывается через useRuntimePulse() и реагирует анимацией без
 * полного re-render — pulse-метки это монотонные ticks, а не сложные объекты.
 *
 * Никаких сетевых вызовов и тяжёлой логики здесь — только сигнал.
 */
export type RuntimeSyncPhase = "idle" | "queued" | "running" | "ok" | "error";

type RuntimePulseStore = {
  /** Активен ли сейчас прогон auto-sync (UI: вращение/flow). */
  syncBusy: boolean;
  /** Фаза синка для подписи. */
  syncPhase: RuntimeSyncPhase;
  /** Последний успешный flush — timestamp ms. */
  lastSyncOkAtMs: number;
  /** Сколько ops было в очереди на момент последнего flush. */
  lastQueueDelta: number;
  /** Тики живых событий (монотонные счётчики). */
  networkTick: number;
  gpsTick: number;
  uploadTick: number;
  errorTick: number;
  recoveryTick: number;
  aiThinkTick: number;
  setSyncBusy: (busy: boolean, phase?: RuntimeSyncPhase) => void;
  noteSyncResult: (phase: RuntimeSyncPhase, delta?: number) => void;
  pingNetwork: () => void;
  pingGps: () => void;
  pingUpload: () => void;
  pingError: () => void;
  pingRecovery: () => void;
  pingAiThink: () => void;
};

export const useRuntimePulse = create<RuntimePulseStore>((set) => ({
  syncBusy: false,
  syncPhase: "idle",
  lastSyncOkAtMs: 0,
  lastQueueDelta: 0,
  networkTick: 0,
  gpsTick: 0,
  uploadTick: 0,
  errorTick: 0,
  recoveryTick: 0,
  aiThinkTick: 0,
  setSyncBusy: (busy, phase) =>
    set((s) => ({
      syncBusy: busy,
      syncPhase: phase ?? s.syncPhase,
    })),
  noteSyncResult: (phase, delta = 0) =>
    set((s) => ({
      syncPhase: phase,
      syncBusy: false,
      lastSyncOkAtMs: phase === "ok" ? Date.now() : s.lastSyncOkAtMs,
      lastQueueDelta: delta,
      errorTick: phase === "error" ? s.errorTick + 1 : s.errorTick,
      uploadTick: phase === "ok" && delta > 0 ? s.uploadTick + 1 : s.uploadTick,
    })),
  pingNetwork: () => set((s) => ({ networkTick: s.networkTick + 1 })),
  pingGps: () => set((s) => ({ gpsTick: s.gpsTick + 1 })),
  pingUpload: () => set((s) => ({ uploadTick: s.uploadTick + 1 })),
  pingError: () => set((s) => ({ errorTick: s.errorTick + 1 })),
  pingRecovery: () => set((s) => ({ recoveryTick: s.recoveryTick + 1 })),
  pingAiThink: () => set((s) => ({ aiThinkTick: s.aiThinkTick + 1 })),
}));

/** Тригнуть короткий «вспых» успеха в сфере извне (например после OCR). */
export function pulseSyncOk(delta = 0): void {
  useRuntimePulse.getState().noteSyncResult("ok", delta);
}
