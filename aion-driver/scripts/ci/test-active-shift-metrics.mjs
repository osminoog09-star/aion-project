/**
 * buildLiveShiftMetrics — интеграция с реальными calculations/shiftActiveDuration/
 * shiftEconomics/rentalEconomics (node assert).
 * Run: node scripts/ci/test-active-shift-metrics.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const calculations = compileTsModule("utils/calculations.ts");
const shiftActiveDuration = compileTsModule("utils/shiftActiveDuration.ts");
const shiftEconomics = compileTsModule("utils/shiftEconomics.ts");
const rentalEconomics = compileTsModule("utils/rentalEconomics.ts");

const { buildLiveShiftMetrics } = compileTsModule("utils/activeShiftMetrics.ts", {
  "./calculations": calculations,
  "./shiftActiveDuration": shiftActiveDuration,
  "./shiftEconomics": shiftEconomics,
  "./rentalEconomics": rentalEconomics,
});

const T0 = Date.parse("2026-07-04T04:00:00.000Z");
const HOUR = 3_600_000;
const STARTED_AT = "2026-07-04T04:00:00.000Z";

function profile(overrides = {}) {
  return {
    petrolConsumptionLPer100Km: 10,
    petrolPricePerLiter: 60,
    gasConsumptionLPer100Km: 10,
    gasPricePerLiter: 25,
    ...overrides,
  };
}

function activeShift(overrides = {}) {
  return {
    startedAt: STARTED_AT,
    distanceMeters: 0,
    distanceMetersPetrol: 0,
    distanceMetersGas: 0,
    totalIncome: 0,
    fuelEntries: undefined,
    paused: false,
    pauseStartedAtMs: null,
    accumulatedPauseMs: 0,
    ...overrides,
  };
}

async function main() {
  // --- Кейс A: только бензин, без чеков и аренды. 100 км за 2 часа, доход 5000. ---
  const a = buildLiveShiftMetrics(
    profile(),
    activeShift({
      distanceMeters: 100_000,
      distanceMetersPetrol: 100_000,
      distanceMetersGas: 0,
      totalIncome: 5000,
    }),
    T0 + 2 * HOUR,
  );
  assert.equal(a.durationMs, 7_200_000);
  assert.equal(a.income, 5000);
  assert.equal(a.distanceKm, 100);
  assert.equal(a.distanceKmPetrol, 100);
  assert.equal(a.distanceKmGas, 0);
  assert.equal(a.fuelUsedPetrolLiters, 10, "100 км * 10 л/100км");
  assert.equal(a.fuelCostPetrol, 600, "10 л * 60 руб");
  assert.equal(a.fuelCostGas, 0);
  assert.equal(a.fuelCostTotal, 600);
  assert.equal(a.gasSavingsRub, 0);
  assert.equal(a.netProfit, 4400, "5000 - 600");
  assert.equal(a.profitPerHour, 2200, "4400 / 2 ч");
  assert.equal(a.profitPerKm, 44, "4400 / 100 км");
  assert.equal(a.operationalCosts, null, "без конфига аренды операционных расходов нет");

  // --- Кейс B: двойное топливо, GPS-пробег 90 км > суммы сплитов (60 км) → масштабирование 1.5. ---
  const b = buildLiveShiftMetrics(
    profile(),
    activeShift({
      distanceMeters: 90_000,
      distanceMetersPetrol: 30_000,
      distanceMetersGas: 30_000,
      totalIncome: 3532.5,
    }),
    T0 + 3 * HOUR,
  );
  assert.equal(b.durationMs, 10_800_000);
  assert.equal(b.distanceKm, 90);
  assert.equal(b.distanceKmPetrol, 45, "30 км * scale 1.5");
  assert.equal(b.distanceKmGas, 45);
  assert.equal(b.fuelUsedPetrolLiters, 4.5);
  assert.equal(b.fuelUsedGasLiters, 4.5);
  assert.equal(b.fuelCostPetrol, 270, "4.5 л * 60");
  assert.equal(b.fuelCostGas, 112.5, "4.5 л * 25");
  assert.equal(b.fuelCostTotal, 382.5);
  assert.equal(b.gasSavingsRub, 157.5, "270 (если бы бензин) - 112.5");
  assert.equal(b.netProfit, 3150, "3532.5 - 382.5");
  assert.equal(b.profitPerHour, 1050, "3150 / 3 ч");
  assert.equal(b.profitPerKm, 35, "3150 / 90 км");

  // --- Кейс C: паузы + подтверждённые чеки АЗС (перекрывают оценку) + аренда. ---
  // 14ч на часах - 1ч накопленной паузы - 1ч текущей = 12ч эффективных.
  const c = buildLiveShiftMetrics(
    profile({
      rentalEconomics: { enabled: true, amount: 2400, period: "day", fixedOpsPerDay: 480 },
    }),
    activeShift({
      distanceMeters: 200_000,
      distanceMetersPetrol: 150_000,
      distanceMetersGas: 50_000,
      totalIncome: 8400,
      accumulatedPauseMs: 1 * HOUR,
      paused: true,
      pauseStartedAtMs: T0 + 13 * HOUR,
      fuelEntries: [
        { id: "f1", addedAtMs: T0, fuelType: "АИ-95", liters: 20, totalCost: 1200, unitPrice: 60, source: "manual" },
        { id: "f2", addedAtMs: T0, fuelType: "АИ-95", liters: 5, totalCost: -100, unitPrice: 0, source: "manual" },
        { id: "f3", addedAtMs: T0, fuelType: "газ", liters: 3, totalCost: NaN, unitPrice: 0, source: "manual" },
      ],
    }),
    T0 + 14 * HOUR,
  );
  assert.equal(c.durationMs, 43_200_000, "12 эффективных часов");
  assert.equal(c.fuelCostTotal, 1200, "чеки: 1200 учтён, -100 и NaN отброшены");
  assert.equal(c.fuelCostPetrol, 900, "1200 * доля бензина 0.75");
  assert.equal(c.fuelCostGas, 300, "1200 * доля газа 0.25");
  assert.equal(c.gasSavingsRub, 0, "при подтверждённых чеках экономия обнуляется");
  assert.equal(c.fuelUsedPetrolLiters, 15, "оценка литров из базы сохраняется");
  assert.equal(c.fuelUsedGasLiters, 5);
  assert.equal(c.netProfit, 7200, "8400 - 1200 (чеки, не GPS-оценка)");
  assert.equal(c.profitPerHour, 600, "7200 / 12 ч");
  assert.equal(c.profitPerKm, 36, "7200 / 200 км");
  assert.equal(c.operationalCosts.rentalAccrued, 1200, "2400/день * 0.5 дня");
  assert.equal(c.operationalCosts.fixedOpsAccrued, 240, "480/день * 0.5 дня");
  assert.equal(c.operationalCosts.totalOperationalCost, 1440);
  assert.equal(c.operationalCosts.profitAfterCosts, 5760, "7200 - 1440");
  assert.equal(c.operationalCosts.profitPerHourAfterCosts, 480, "5760 / 12 ч");

  // --- Кейс D: нулевые дистанция и длительность → гварды, деления на 0 нет. ---
  const d = buildLiveShiftMetrics(
    profile({ rentalEconomics: { enabled: false, amount: 5000, period: "day" } }),
    activeShift({ totalIncome: 500 }),
    T0,
  );
  assert.equal(d.durationMs, 0);
  assert.equal(d.distanceKm, 0);
  assert.equal(d.fuelCostTotal, 0);
  assert.equal(d.netProfit, 500);
  assert.equal(d.profitPerHour, 0, "0 часов → 0, не Infinity/NaN");
  assert.equal(d.profitPerKm, 0, "0 км → 0, не Infinity/NaN");
  assert.equal(d.operationalCosts, null, "выключенная аренда → null");

  // --- Кейс E: смена длиннее периода аренды → аренда clamp'ится, fixedOps — нет. ---
  // 36ч, 100 км бензина, доход 6900: топливо 600, netProfit 6300.
  const e = buildLiveShiftMetrics(
    profile({
      rentalEconomics: { enabled: true, amount: 2400, period: "day", fixedOpsPerDay: 440 },
    }),
    activeShift({
      distanceMeters: 100_000,
      distanceMetersPetrol: 100_000,
      totalIncome: 6900,
    }),
    T0 + 36 * HOUR,
  );
  assert.equal(e.durationMs, 129_600_000);
  assert.equal(e.netProfit, 6300);
  assert.equal(e.profitPerHour, 175, "6300 / 36 ч");
  assert.equal(e.profitPerKm, 63);
  assert.equal(e.operationalCosts.rentalAccrued, 2400, "доля периода clamp'ится к 1");
  assert.equal(e.operationalCosts.fixedOpsAccrued, 660, "440/день * 1.5 дня без clamp");
  assert.equal(e.operationalCosts.totalOperationalCost, 3060);
  assert.equal(e.operationalCosts.profitAfterCosts, 3240, "6300 - 3060");
  assert.equal(e.operationalCosts.profitPerHourAfterCosts, 90, "3240 / 36 ч");

  console.log("test-active-shift-metrics: ok (5 cases)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
