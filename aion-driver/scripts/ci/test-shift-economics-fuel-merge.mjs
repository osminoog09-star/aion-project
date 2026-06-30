/**
 * mergeConfirmedFuelCosts — стоимость топлива смены по чекам + пересчёт прибыли. node assert.
 * Run: node scripts/ci/test-shift-economics-fuel-merge.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { mergeConfirmedFuelCosts } = compileTsModule("utils/shiftEconomics.ts");

function baseMetrics(overrides = {}) {
  return {
    distanceKm: 100,
    distanceKmPetrol: 60,
    distanceKmGas: 40,
    fuelCostPetrol: 111,
    fuelCostGas: 222,
    fuelCostTotal: 333,
    gasSavingsRub: 99,
    netProfit: 999,
    profitPerHour: 999,
    profitPerKm: 999,
    ...overrides,
  };
}

async function main() {
  let cases = 0;

  // Нет подтверждённых чеков → возвращается base без изменений (та же ссылка).
  const base = baseMetrics();
  assert.equal(mergeConfirmedFuelCosts(base, 1000, 7_200_000, []), base);
  assert.equal(mergeConfirmedFuelCosts(base, 1000, 7_200_000, undefined), base);
  cases += 1;

  // Подтверждённые чеки переопределяют стоимость топлива и пересчитывают прибыль.
  // income=1000, топливо=300, 2 часа, 100 км (60 бензин / 40 газ).
  const r = mergeConfirmedFuelCosts(baseMetrics(), 1000, 7_200_000, [
    { id: "a", totalCost: 200 },
    { id: "b", totalCost: 100 },
  ]);
  assert.equal(r.fuelCostTotal, 300);
  assert.equal(r.netProfit, 700); // 1000 - 300
  assert.equal(r.profitPerHour, 350); // 700 / 2ч
  assert.equal(r.profitPerKm, 7); // 700 / 100км
  assert.equal(r.fuelCostPetrol, 180); // 300 * 0.6
  assert.equal(r.fuelCostGas, 120); // 300 * 0.4
  assert.equal(r.gasSavingsRub, 0); // обнуляется при подтверждённых чеках
  cases += 1;

  // Некорректные суммы чеков отбрасываются (учитывается только 100).
  const r2 = mergeConfirmedFuelCosts(baseMetrics(), 500, 3_600_000, [
    { id: "x", totalCost: -50 },
    { id: "y", totalCost: Number.NaN },
    { id: "z", totalCost: Infinity },
    { id: "w", totalCost: 100 },
  ]);
  assert.equal(r2.fuelCostTotal, 100);
  assert.equal(r2.netProfit, 400);
  cases += 1;

  // distanceKm=0 → доля бензина=1, газ=0, profitPerKm=0; durationMs=0 → profitPerHour=0.
  const r3 = mergeConfirmedFuelCosts(
    baseMetrics({ distanceKm: 0, distanceKmPetrol: 0, distanceKmGas: 0 }),
    500,
    0,
    [{ id: "a", totalCost: 100 }],
  );
  assert.equal(r3.fuelCostTotal, 100);
  assert.equal(r3.netProfit, 400);
  assert.equal(r3.fuelCostPetrol, 100);
  assert.equal(r3.fuelCostGas, 0);
  assert.equal(r3.profitPerHour, 0);
  assert.equal(r3.profitPerKm, 0);
  cases += 1;

  console.log(`test-shift-economics-fuel-merge: ok (${cases} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
