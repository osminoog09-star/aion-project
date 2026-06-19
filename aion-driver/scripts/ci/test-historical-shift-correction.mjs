/**
 * applyHistoricalShiftCorrection regression checks.
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const rentalEconomics = compileTsModule("utils/rentalEconomics.ts");
const historyCorrection = compileTsModule("utils/historicalShiftCorrection.ts", {
  "./rentalEconomics": rentalEconomics,
});

const { applyHistoricalShiftCorrection } = historyCorrection;

function makeShift(overrides = {}) {
  return {
    id: "shift-1",
    startedAt: "2026-05-18T08:00:00.000Z",
    endedAt: "2026-05-18T12:00:00.000Z",
    durationMs: 4 * 3_600_000,
    distanceKm: 100,
    distanceKmPetrol: 40,
    distanceKmGas: 60,
    income: 1000,
    fuelUsedPetrolLiters: 4,
    fuelUsedGasLiters: 6,
    fuelCostPetrol: 200,
    fuelCostGas: 300,
    fuelCostTotal: 500,
    gasSavingsRub: 120,
    netProfit: 500,
    profitPerHour: 125,
    profitPerKm: 5,
    ...overrides,
  };
}

const profile = {
  name: "Owner",
  carModel: "AION",
  petrolConsumptionLPer100Km: 8,
  petrolPricePerLiter: 2,
  gasConsumptionLPer100Km: 10,
  gasPricePerLiter: 1,
  rentalEconomics: {
    enabled: true,
    amount: 240,
    period: "day",
    fixedOpsPerDay: 24,
  },
};

const corrected = applyHistoricalShiftCorrection(makeShift(), profile, {
  income: 1200,
  fuelCostTotal: 250,
  distanceKm: 50,
  durationMs: 2 * 3_600_000,
});

assert.equal(corrected.income, 1200);
assert.equal(corrected.fuelCostTotal, 250);
assert.equal(corrected.fuelCostPetrol, 100);
assert.equal(corrected.fuelCostGas, 150);
assert.equal(corrected.distanceKm, 50);
assert.equal(corrected.distanceKmPetrol, 20);
assert.equal(corrected.distanceKmGas, 30);
assert.equal(corrected.fuelUsedPetrolLiters, 2);
assert.equal(corrected.fuelUsedGasLiters, 3);
assert.equal(corrected.gasSavingsRub, 0);
assert.equal(corrected.netProfit, 950);
assert.equal(corrected.profitPerHour, 475);
assert.equal(corrected.profitPerKm, 19);
assert.equal(corrected.rentalCostAccrued, 20);
assert.equal(corrected.fixedOpsCost, 2);
assert.equal(corrected.netProfitAfterCosts, 928);
assert.equal(corrected.profitPerHourAfterCosts, 464);

const clamped = applyHistoricalShiftCorrection(makeShift(), null, {
  income: -100,
  fuelCostTotal: Number.NaN,
  distanceKm: -5,
  durationMs: -1,
});

assert.equal(clamped.income, 0);
assert.equal(clamped.fuelCostTotal, 0);
assert.equal(clamped.distanceKm, 0);
assert.equal(clamped.durationMs, 0);
assert.equal(clamped.netProfit, 0);
assert.equal(clamped.profitPerHour, 0);
assert.equal(clamped.profitPerKm, 0);
assert.equal(clamped.netProfitAfterCosts, undefined);

console.log("test-historical-shift-correction: ok (2 cases)");
