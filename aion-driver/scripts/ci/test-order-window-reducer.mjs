/**
 * orderWindowReducer — node assert.
 */
import assert from "node:assert/strict";
import { importTsOrFail } from "./lib/importTsOrFail.mjs";

async function main() {
  const {
    EMPTY_ORDER_WINDOW_STATE,
    beginOrderActivity,
    endOrderActivity,
    finalizeOrderWindows,
  } = await importTsOrFail(
    () => import("../../features/intelligence/orderWindowReducer.ts"),
    "orderWindowReducer",
  );

  let cases = 0;

  // Подача → заказ → высадка: два закрытых окна.
  let s = EMPTY_ORDER_WINDOW_STATE;
  s = beginOrderActivity(s, "pickup", 1000);
  assert.equal(s.active.kind, "pickup");
  assert.equal(s.windows.length, 0);
  s = beginOrderActivity(s, "on_order", 1500); // закрывает подачу
  assert.equal(s.windows.length, 1);
  assert.deepEqual(s.windows[0], { kind: "pickup", startMs: 1000, endMs: 1500 });
  assert.equal(s.active.kind, "on_order");
  s = endOrderActivity(s, 2000); // высадка
  assert.equal(s.active, null);
  assert.deepEqual(s.windows, [
    { kind: "pickup", startMs: 1000, endMs: 1500 },
    { kind: "on_order", startMs: 1500, endMs: 2000 },
  ]);
  cases += 1;

  // endOrderActivity без активного — no-op.
  const s2 = endOrderActivity(EMPTY_ORDER_WINDOW_STATE, 5000);
  assert.equal(s2.active, null);
  assert.equal(s2.windows.length, 0);
  cases += 1;

  // finalize закрывает активный период по концу смены.
  let s3 = beginOrderActivity(EMPTY_ORDER_WINDOW_STATE, "on_order", 1000);
  const finalized = finalizeOrderWindows(s3, 3000);
  assert.deepEqual(finalized, [{ kind: "on_order", startMs: 1000, endMs: 3000 }]);
  cases += 1;

  // Нулевое/обратное время не создаёт мусорное окно.
  let s4 = beginOrderActivity(EMPTY_ORDER_WINDOW_STATE, "pickup", 2000);
  s4 = beginOrderActivity(s4, "on_order", 2000); // тот же ms → подача не закрывается окном
  assert.equal(s4.windows.length, 0);
  assert.equal(s4.active.kind, "on_order");
  cases += 1;

  console.log(`test-order-window-reducer: ok (${cases} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
