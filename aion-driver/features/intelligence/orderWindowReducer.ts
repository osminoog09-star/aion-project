/**
 * Захват окон активности заказа из ручных отметок водителя
 * («взял заказ» / «подача» / «высадил») — для классификатора километров.
 * Чистый редьюсер (roadmap maps-gps-intelligence). Тест: scripts/ci/test-order-window-reducer.mjs
 */
import type { OrderActivityWindow } from "./classifyKilometers";

export type OrderActivityKind = "on_order" | "pickup";

export type OrderWindowState = {
  active: { kind: OrderActivityKind; startMs: number } | null;
  windows: OrderActivityWindow[];
};

export const EMPTY_ORDER_WINDOW_STATE: OrderWindowState = {
  active: null,
  windows: [],
};

function closeActive(state: OrderWindowState, nowMs: number): OrderActivityWindow[] {
  if (!state.active || nowMs <= state.active.startMs) return state.windows;
  return [
    ...state.windows,
    { kind: state.active.kind, startMs: state.active.startMs, endMs: nowMs },
  ];
}

/** Начать период подачи/заказа. Предыдущий активный период закрывается этим же моментом. */
export function beginOrderActivity(
  state: OrderWindowState,
  kind: OrderActivityKind,
  nowMs: number,
): OrderWindowState {
  return { active: { kind, startMs: nowMs }, windows: closeActive(state, nowMs) };
}

/** Закрыть текущий период (высадка / конец подачи). Без активного — no-op. */
export function endOrderActivity(
  state: OrderWindowState,
  nowMs: number,
): OrderWindowState {
  return { active: null, windows: closeActive(state, nowMs) };
}

/** Финализировать окна при завершении смены (закрывает активный период). */
export function finalizeOrderWindows(
  state: OrderWindowState,
  nowMs: number,
): OrderActivityWindow[] {
  return closeActive(state, nowMs);
}
