/**
 * deriveProfitFuelRates + rentalEconomics — чистая money-логика. node assert.
 * Run: node scripts/ci/test-driver-cost-rates.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { deriveProfitFuelRates } = compileTsModule("utils/profitDiagnostics.ts");
const { computeRentalAccrual, computeFixedOpsAccrual, computeShiftOperationalCosts } =
  compileTsModule("utils/rentalEconomics.ts");

const H2 = 2 * 3_600_000; // 2 часа
const H12 = 12 * 3_600_000; // 12 часов
const DAY = 86_400_000;

async function main() {
  let cases = 0;

  // deriveProfitFuelRates: точные ставки за км и за час.
  const r = deriveProfitFuelRates(
    { distanceKm: 100, fuelCostTotal: 500, netProfit: 1000 },
    H2,
  );
  assert.equal(r.fuelCostPerKm, 5); // 500 / 100
  assert.equal(r.fuelCostPerHour, 250); // 500 / 2ч
  assert.equal(r.netProfitPerKm, 10); // 1000 / 100
  assert.equal(r.netProfitPerHour, 500); // 1000 / 2ч
  cases += 1;

  // Нулевая дистанция и длительность → все ставки 0 (без деления на ноль).
  const z = deriveProfitFuelRates({ distanceKm: 0, fuelCostTotal: 500, netProfit: 1000 }, 0);
  assert.equal(z.fuelCostPerKm, 0);
  assert.equal(z.fuelCostPerHour, 0);
  assert.equal(z.netProfitPerKm, 0);
  assert.equal(z.netProfitPerHour, 0);
  cases += 1;

  // Аренда: пропорционально длительности; clamp до 1 периода.
  assert.equal(computeRentalAccrual({ enabled: true, amount: 700, period: "week" }, DAY), 100); // 700/7
  assert.equal(computeRentalAccrual({ enabled: true, amount: 600, period: "day" }, H12), 300); // 600*0.5
  // clamp: смена длиннее периода → не больше полной суммы.
  assert.equal(computeRentalAccrual({ enabled: true, amount: 600, period: "day" }, 3 * DAY), 600);
  // выключено / нет суммы / нулевая длительность → 0.
  assert.equal(computeRentalAccrual({ enabled: false, amount: 600, period: "day" }, H12), 0);
  assert.equal(computeRentalAccrual({ enabled: true, amount: 0, period: "day" }, H12), 0);
  assert.equal(computeRentalAccrual({ enabled: true, amount: 600, period: "day" }, 0), 0);
  cases += 1;

  // Фиксированные операционные расходы: perDay * доля суток.
  assert.equal(computeFixedOpsAccrual({ enabled: true, fixedOpsPerDay: 240 }, H12), 120); // 240*0.5
  assert.equal(computeFixedOpsAccrual({ enabled: true, fixedOpsPerDay: 0 }, H12), 0);
  assert.equal(computeFixedOpsAccrual({ enabled: false, fixedOpsPerDay: 240 }, H12), 0);
  assert.equal(computeFixedOpsAccrual({ enabled: true, fixedOpsPerDay: 240 }, 0), 0);
  cases += 1;

  // Полные операционные расходы смены: аренда + фикс, прибыль после.
  const ops = computeShiftOperationalCosts(1000, H12, {
    enabled: true,
    amount: 700,
    period: "week",
    fixedOpsPerDay: 240,
  });
  assert.ok(ops);
  assert.equal(ops.rentalAccrued, 50); // 700 * (12ч / 7сут) = 50
  assert.equal(ops.fixedOpsAccrued, 120); // 240 * 0.5
  assert.equal(ops.totalOperationalCost, 170);
  assert.equal(ops.profitAfterCosts, 830); // 1000 - 170
  // выключенный конфиг → null (нет выдуманных расходов).
  assert.equal(computeShiftOperationalCosts(1000, H12, { enabled: false }), null);
  assert.equal(computeShiftOperationalCosts(1000, H12, null), null);
  cases += 1;

  console.log(`test-driver-cost-rates: ok (${cases} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
