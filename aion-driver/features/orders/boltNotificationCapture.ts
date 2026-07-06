/**
 * Авто-фиксация заказов из уведомлений Bolt — ЧИСТЫЙ слой (roadmap auto-order-capture).
 *
 * Превращает текст уведомления в событие заказа и применяет его к окнам
 * активности (для классов км) + отдаёт черновик дохода (если в тексте есть сумма).
 * Нативного слушателя уведомлений здесь НЕТ — он отдельный нативный модуль
 * (см. docs/AUTO-ORDER-CAPTURE.md); этот слой полностью тестируем без устройства.
 *
 * ВАЖНО: таблица паттернов НАЧАЛЬНАЯ — собрана по типовым формулировкам и обязана
 * быть сверена с реальными текстами уведомлений с устройства владельца (RU/ET/EN)
 * до включения авто-захвата. Суммы берём только из текста уведомления — никаких
 * «средних чеков» (принцип: не выдумываем данные).
 *
 * Тест: scripts/ci/test-bolt-notification-capture.mjs
 */
import {
  beginOrderActivity,
  endOrderActivity,
  type OrderWindowState,
} from "../intelligence/orderWindowReducer";

/** Пакеты приложений Bolt для водителя. */
export const BOLT_DRIVER_PACKAGES = ["ee.mtakso.driver"] as const;

export type RawNotification = {
  packageName: string;
  title: string | null;
  text: string | null;
  postedAtMs: number;
};

/** Способ оплаты из карточки заказа Bolt: наличные (сразу в кармане) vs карта. */
export type PaymentMethod = "cash" | "card";

export type CapturedOrderEvent =
  | {
      type: "order_assigned";
      amount: number | null;
      currencyCode: "EUR" | null;
      paymentMethod: PaymentMethod | null;
      atMs: number;
    }
  | { type: "ride_started"; atMs: number }
  | {
      type: "ride_finished";
      amount: number | null;
      currencyCode: "EUR" | null;
      paymentMethod: PaymentMethod | null;
      atMs: number;
    };

/**
 * Начальные паттерны (подстроки, нижний регистр; \b с кириллицей не работает).
 * Порядок важен: finished проверяется раньше started/assigned, т.к. «поездка
 * завершена» содержит «поездка».
 */
export const INITIAL_PATTERNS = {
  finished: [
    "поездка завершена",
    "заказ выполнен",
    "заказ завершен",
    "ride finished",
    "ride completed",
    "trip completed",
    "sõit lõppes",
  ],
  started: [
    "поездка началась",
    "начало поездки",
    "пассажир в машине",
    "ride started",
    "trip started",
    "sõit algas",
  ],
  assigned: [
    "новый заказ",
    "заказ назначен",
    "новая поездка",
    "new order",
    "new ride request",
    "order accepted",
    "uus tellimus",
  ],
} as const;

function extractEuroAmount(raw: string): number | null {
  const m = raw.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur|евро)/i);
  if (!m) return null;
  const v = Number(m[1].replace(",", "."));
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
}

/** Способ оплаты из текста (наличные/карта). Нет явного указания → null. */
function extractPaymentMethod(raw: string): PaymentMethod | null {
  if (/наличн|нал\.|cash|sularaha/.test(raw)) return "cash";
  if (/карт|безнал|card|kaart/.test(raw)) return "card";
  return null;
}

/** Уведомление → событие заказа (null, если не от Bolt или не про заказ). */
export function parseBoltNotification(n: RawNotification): CapturedOrderEvent | null {
  if (!BOLT_DRIVER_PACKAGES.includes(n.packageName as (typeof BOLT_DRIVER_PACKAGES)[number])) {
    return null;
  }
  const raw = `${n.title ?? ""} ${n.text ?? ""}`.toLowerCase().replace(/ё/g, "е").trim();
  if (!raw) return null;
  const amount = extractEuroAmount(raw);
  const currencyCode = amount != null ? "EUR" : null;
  const paymentMethod = extractPaymentMethod(raw);
  if (INITIAL_PATTERNS.finished.some((p) => raw.includes(p))) {
    return { type: "ride_finished", amount, currencyCode, paymentMethod, atMs: n.postedAtMs };
  }
  if (INITIAL_PATTERNS.started.some((p) => raw.includes(p))) {
    return { type: "ride_started", atMs: n.postedAtMs };
  }
  if (INITIAL_PATTERNS.assigned.some((p) => raw.includes(p))) {
    return { type: "order_assigned", amount, currencyCode, paymentMethod, atMs: n.postedAtMs };
  }
  return null;
}

export type OrderCaptureResult = {
  windows: OrderWindowState;
  /** Черновик дохода — только если сумма реально была в тексте. Способ оплаты
      (наличные/карта) — если Bolt его показал; иначе null (не выдумываем). */
  incomeDraft: { amount: number; currencyCode: "EUR"; paymentMethod: PaymentMethod | null } | null;
};

/**
 * Применить событие к окнам активности (evidence: platform_import по контракту).
 * assigned → подача; started → везу; finished → закрыть окно (+доход, если сумма есть).
 *
 * Анти-дубль: доход из «завершена» записывается ТОЛЬКО если был открытый заказ.
 * Bolt может перепостить/обновить уведомление о завершении — повторное событие
 * находит уже закрытое окно и НЕ создаёт второй доход.
 */
export function applyCapturedOrderEvent(
  state: OrderWindowState,
  event: CapturedOrderEvent,
): OrderCaptureResult {
  if (event.type === "order_assigned") {
    return { windows: beginOrderActivity(state, "pickup", event.atMs), incomeDraft: null };
  }
  if (event.type === "ride_started") {
    return { windows: beginOrderActivity(state, "on_order", event.atMs), incomeDraft: null };
  }
  const hadOpenOrder = state.active != null;
  return {
    windows: endOrderActivity(state, event.atMs),
    incomeDraft:
      hadOpenOrder && event.amount != null && event.currencyCode != null
        ? {
            amount: event.amount,
            currencyCode: event.currencyCode,
            paymentMethod: event.paymentMethod,
          }
        : null,
  };
}
