/**
 * classifyKilometers — node assert.
 */
import assert from "node:assert/strict";
import { importTsOrFail } from "./lib/importTsOrFail.mjs";

async function main() {
  const { classifyKilometers } = await importTsOrFail(
    () => import("../../features/intelligence/classifyKilometers.ts"),
    "classifyKilometers",
  );

  let cases = 0;

  // Нет окон заказов → unclassified, дистанция = сумма dM.
  const u = classifyKilometers({
    points: [{ t: 1200, dM: 100 }, { t: 1300, dM: 50 }, { t: 1400, dM: null }],
    orderWindows: [],
    shiftStartMs: 1000,
    shiftEndMs: 5000,
  });
  assert.equal(u.length, 1);
  assert.equal(u[0].status, "unclassified");
  assert.equal(u[0].class, null);
  assert.equal(u[0].distanceMeters, 150);
  cases += 1;

  // Нет точек → пусто.
  assert.equal(
    classifyKilometers({ points: [], orderWindows: [], shiftStartMs: 0, shiftEndMs: 1 }).length,
    0,
  );
  cases += 1;

  // С окнами: заказ/подача/порожняк/личное.
  const c = classifyKilometers({
    points: [
      { t: 1200, dM: 100 }, // в смене, до подачи → порожняк
      { t: 1700, dM: 50 }, // подача [1500,2000)
      { t: 2000, dM: 30 }, // граница: начало on_order [2000,3000) → заказ
      { t: 2500, dM: 200 }, // заказ
      { t: 4000, dM: 80 }, // в смене, без окна → порожняк
      { t: 6000, dM: 40 }, // вне смены → личное
      { t: 2600, dM: null }, // null → пропуск
    ],
    orderWindows: [
      { kind: "pickup", startMs: 1500, endMs: 2000 },
      { kind: "on_order", startMs: 2000, endMs: 3000 },
    ],
    shiftStartMs: 1000,
    shiftEndMs: 5000,
  });
  const by = Object.fromEntries(c.map((x) => [x.class, x.distanceMeters]));
  assert.equal(by.on_order, 230); // 30 + 200
  assert.equal(by.pickup, 50);
  assert.equal(by.empty, 180); // 100 + 80
  assert.equal(by.personal, 40);
  assert.ok(c.every((x) => x.status === "classified" && x.evidence === "driver_event"));
  // Порядок классов стабильный.
  assert.deepEqual(c.map((x) => x.class), ["on_order", "pickup", "empty", "personal"]);
  cases += 1;

  console.log(`test-classify-kilometers: ok (${cases} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
