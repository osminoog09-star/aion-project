/**
 * processBoltNotifications — раннер авто-фиксации (персистентность + порядок + анти-дубль).
 * Run: node scripts/ci/test-order-capture-runner.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

// In-memory AsyncStorage (плоский объект → esModuleInterop подставит его как default).
const mem = new Map();
const fakeAsyncStorage = {
  async getItem(k) {
    return mem.has(k) ? mem.get(k) : null;
  },
  async setItem(k, v) {
    mem.set(k, v);
  },
  async removeItem(k) {
    mem.delete(k);
  },
};

const reducer = compileTsModule("features/intelligence/orderWindowReducer.ts");
const capture = compileTsModule("features/orders/boltNotificationCapture.ts", {
  "../intelligence/orderWindowReducer": reducer,
});
const storage = compileTsModule("storage/driver/orderWindowStorage.ts", {
  "@react-native-async-storage/async-storage": fakeAsyncStorage,
  "../../features/intelligence/orderWindowReducer": reducer,
});
const { processBoltNotifications } = compileTsModule("features/orders/orderCaptureRunner.ts", {
  "./boltNotificationCapture": capture,
  "../../storage/driver/orderWindowStorage": storage,
});

const BOLT = "ee.mtakso.driver";
const n = (title, text, postedAtMs) => ({ packageName: BOLT, title, text, postedAtMs });
const plain = (v) => JSON.parse(JSON.stringify(v));

async function main() {
  let cases = 0;

  // Полный цикл одной пачкой, НАМЕРЕННО не по порядку — раннер сортирует по времени.
  const r1 = await processBoltNotifications("shift-1", [
    n("Поездка завершена", "Заработано 4 €", 3000),
    n("Новый заказ", "Поездка за 4 €", 1000),
    n("Bolt", "Поездка началась", 2000),
    { packageName: "com.whatsapp", title: "Новый заказ", text: "спам", postedAtMs: 1500 },
  ]);
  assert.equal(r1.appliedEvents, 3);
  assert.deepEqual(plain(r1.incomeDrafts), [{ amount: 4, currencyCode: "EUR", paymentMethod: null }]);
  assert.equal(r1.windowCount, 2); // подача + заказ
  cases += 1;

  // Состояние реально сохранено: окна читаются из хранилища.
  const persisted = await storage.loadOrderWindowState("shift-1");
  assert.equal(persisted.windows.length, 2);
  assert.deepEqual(plain(persisted.windows[0]), { kind: "pickup", startMs: 1000, endMs: 2000 });
  assert.equal(persisted.active, null);
  cases += 1;

  // Дубль «завершена» второй пачкой: события применяются, но дохода НЕТ (окно уже закрыто).
  const r2 = await processBoltNotifications("shift-1", [
    n("Поездка завершена", "Заработано 4 €", 3500),
  ]);
  assert.equal(r2.appliedEvents, 1);
  assert.equal(r2.incomeDrafts.length, 0);
  assert.equal(r2.windowCount, 2);
  cases += 1;

  // Пачка без событий Bolt — ничего не применяется и не пишется.
  const before = mem.get("aion.driver.orderWindows.v1.shift-2");
  const r3 = await processBoltNotifications("shift-2", [
    { packageName: "com.telegram", title: "hi", text: "там", postedAtMs: 1 },
  ]);
  assert.equal(r3.appliedEvents, 0);
  assert.equal(r3.windowCount, 0);
  assert.equal(mem.get("aion.driver.orderWindows.v1.shift-2"), before); // не записано
  cases += 1;

  // Смены изолированы по ключу.
  const other = await storage.loadOrderWindowState("shift-2");
  assert.equal(other.windows.length, 0);
  cases += 1;

  console.log(`test-order-capture-runner: ok (${cases} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
