/**
 * parseBoltNotification / applyCapturedOrderEvent — чистый слой авто-фиксации. node assert.
 * Run: node scripts/ci/test-bolt-notification-capture.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const reducer = compileTsModule("features/intelligence/orderWindowReducer.ts");
const { parseBoltNotification, applyCapturedOrderEvent } = compileTsModule(
  "features/orders/boltNotificationCapture.ts",
  { "../intelligence/orderWindowReducer": reducer },
);

const BOLT = "ee.mtakso.driver";
const plain = (v) => JSON.parse(JSON.stringify(v));
const n = (title, text, postedAtMs = 1000, packageName = BOLT) => ({
  packageName,
  title,
  text,
  postedAtMs,
});

async function main() {
  let cases = 0;

  // Чужое приложение — игнор, даже с «заказными» словами.
  assert.equal(parseBoltNotification(n("Новый заказ", "4.50 €", 1, "com.whatsapp")), null);
  // Пустое уведомление Bolt — null.
  assert.equal(parseBoltNotification(n(null, null)), null);
  // Просто болтовня Bolt (не про заказ) — null.
  assert.equal(parseBoltNotification(n("Bolt", "Хорошей смены!")), null);
  cases += 1;

  // Назначение заказа с суммой — событие + сумма из текста.
  const assigned = parseBoltNotification(n("Новый заказ", "Поездка за 4,50 €", 111));
  assert.deepEqual(JSON.parse(JSON.stringify(assigned)), {
    type: "order_assigned",
    amount: 4.5,
    currencyCode: "EUR",
    atMs: 111,
  });
  cases += 1;

  // Начало поездки.
  assert.equal(parseBoltNotification(n("Bolt", "Поездка началась", 222)).type, "ride_started");
  // Завершение с суммой (и приоритет finished над «поездка…»).
  const fin = parseBoltNotification(n("Поездка завершена", "Заработано 6 €", 333));
  assert.equal(fin.type, "ride_finished");
  assert.equal(fin.amount, 6);
  // Английский вариант.
  assert.equal(parseBoltNotification(n("Ride finished", "You earned 5.20 €", 4)).type, "ride_finished");
  cases += 1;

  // Сумма без валюты в тексте — amount null (не выдумываем).
  const noCur = parseBoltNotification(n("Поездка завершена", "Спасибо за поездку", 5));
  assert.equal(noCur.amount, null);
  assert.equal(noCur.currencyCode, null);
  cases += 1;

  // Полный цикл: assigned → started → finished = окна pickup + on_order + доход.
  let state = reducer.EMPTY_ORDER_WINDOW_STATE;
  let r = applyCapturedOrderEvent(state, parseBoltNotification(n("Новый заказ", "за 4 €", 1000)));
  assert.equal(r.windows.active.kind, "pickup");
  assert.equal(r.incomeDraft, null);
  r = applyCapturedOrderEvent(r.windows, parseBoltNotification(n("Bolt", "Поездка началась", 2000)));
  assert.equal(r.windows.active.kind, "on_order");
  assert.equal(r.windows.windows.length, 1); // окно подачи закрыто
  assert.deepEqual(plain(r.windows.windows[0]), { kind: "pickup", startMs: 1000, endMs: 2000 });
  r = applyCapturedOrderEvent(r.windows, parseBoltNotification(n("Поездка завершена", "Заработано 4 €", 3000)));
  assert.equal(r.windows.active, null);
  assert.equal(r.windows.windows.length, 2);
  assert.deepEqual(plain(r.windows.windows[1]), { kind: "on_order", startMs: 2000, endMs: 3000 });
  assert.deepEqual(plain(r.incomeDraft), { amount: 4, currencyCode: "EUR" });
  cases += 1;

  // Завершение без суммы — окна закрываются, дохода нет (не выдумываем).
  const r2 = applyCapturedOrderEvent(
    reducer.beginOrderActivity(reducer.EMPTY_ORDER_WINDOW_STATE, "on_order", 10),
    parseBoltNotification(n("Поездка завершена", "Спасибо!", 20)),
  );
  assert.equal(r2.windows.windows.length, 1);
  assert.equal(r2.incomeDraft, null);
  cases += 1;

  // Анти-дубль: «завершена» с суммой БЕЗ открытого заказа → дохода нет.
  const dup = applyCapturedOrderEvent(
    reducer.EMPTY_ORDER_WINDOW_STATE,
    parseBoltNotification(n("Поездка завершена", "Заработано 4 €", 30)),
  );
  assert.equal(dup.incomeDraft, null);
  assert.equal(dup.windows.windows.length, 0);
  cases += 1;

  console.log(`test-bolt-notification-capture: ok (${cases} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
