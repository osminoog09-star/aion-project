/**
 * Раннер авто-фиксации: пачка сырых уведомлений → окна активности сохранены,
 * черновики дохода возвращены. Это ЕДИНСТВЕННОЕ, что должен вызывать будущий
 * нативный слушатель уведомлений (см. docs/AUTO-ORDER-CAPTURE.md).
 *
 * Чистая логика — в boltNotificationCapture; здесь порядок, персистентность
 * и сериализация (пачки могут прилетать конкурентно).
 *
 * Тест: scripts/ci/test-order-capture-runner.mjs
 */
import {
  applyCapturedOrderEvent,
  parseBoltNotification,
  type PaymentMethod,
  type RawNotification,
} from "./boltNotificationCapture";
import {
  loadOrderWindowState,
  saveOrderWindowState,
} from "../../storage/driver/orderWindowStorage";

export type OrderCaptureRunResult = {
  /** Сколько уведомлений оказались событиями заказа. */
  appliedEvents: number;
  /** Доходы, найденные в завершённых заказах (суммы только из текста уведомлений).
      paymentMethod — наличные/карта, если Bolt их показал; иначе null (не выдумываем). */
  incomeDrafts: { amount: number; currencyCode: "EUR"; paymentMethod: PaymentMethod | null }[];
  /** Закрытых окон в хранилище после применения. */
  windowCount: number;
};

let serialized: Promise<unknown> = Promise.resolve();

function runSerialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = serialized.then(fn, fn);
  serialized = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function processBoltNotifications(
  shiftId: string,
  notifications: readonly RawNotification[],
): Promise<OrderCaptureRunResult> {
  return runSerialized(async () => {
    const events = notifications
      .map(parseBoltNotification)
      .filter((e): e is NonNullable<typeof e> => e != null)
      .sort((a, b) => a.atMs - b.atMs);

    const incomeDrafts: OrderCaptureRunResult["incomeDrafts"] = [];
    let state = await loadOrderWindowState(shiftId);
    for (const event of events) {
      const r = applyCapturedOrderEvent(state, event);
      state = r.windows;
      if (r.incomeDraft) incomeDrafts.push(r.incomeDraft);
    }
    if (events.length > 0) {
      await saveOrderWindowState(shiftId, state);
    }
    return {
      appliedEvents: events.length,
      incomeDrafts,
      windowCount: state.windows.length,
    };
  });
}
