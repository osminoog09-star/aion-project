/**
 * pickProfitFromRouteRow — node assert.
 * Run: node scripts/ci/test-shift-display-economics.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { getCompletedShiftEconomicsProjection, getCompletedShiftProfit, pickProfitFromRouteRow } = compileTsModule("utils/shiftDisplayEconomics.ts", {
  "./formatting": {
    formatCurrencyDisplay(value, currency = "RUB") {
      return `${Math.round(value)} ${currency}`;
    },
  },
});

function profitSnapshot(overrides = {}) {
  return {
    income: 100,
    netProfit: 80,
    netProfitAfterCosts: 55,
    profitPerHour: 20,
    profitPerHourAfterCosts: 14,
    profitPerKm: 2,
    fuelCostTotal: 10,
    fuelEfficiencyLPer100Km: null,
    rentalCostAccrued: 5,
    ...overrides,
  };
}

async function main() {
  const afterCosts = pickProfitFromRouteRow({
    analytics: { profit: profitSnapshot() },
  });
  assert.equal(afterCosts.profit, 55);
  assert.equal(afterCosts.profitPerHour, 14);
  assert.equal(afterCosts.usesAfterCosts, true);

  const grossOnly = pickProfitFromRouteRow({
    analytics: {
      profit: profitSnapshot({
        netProfitAfterCosts: null,
        profitPerHourAfterCosts: null,
      }),
    },
  });
  assert.equal(grossOnly.profit, 80);
  assert.equal(grossOnly.usesAfterCosts, false);

  const fromShift = pickProfitFromRouteRow({
    shift: {
      id: "s1",
      netProfit: 70,
      profitPerHour: 18,
      netProfitAfterCosts: 50,
      profitPerHourAfterCosts: 12,
    },
  });
  assert.equal(fromShift.profit, 50);
  assert.equal(fromShift.usesAfterCosts, true);
  assert.equal(getCompletedShiftProfit(fromShiftInput()), 50, "aggregates must prefer after-costs profit");
  assert.deepEqual(
    JSON.parse(JSON.stringify(getCompletedShiftEconomicsProjection({
      ...fromShiftInput(),
      income: 100,
      distanceKm: 10,
      profitPerKm: 7,
    }))),
    { profit: 50, profitPerHour: 12, profitPerKm: 5, totalExpenses: 50 },
    "cloud/UI projection must use after-costs values",
  );

  assert.equal(
    getCompletedShiftProfit(fromShiftInput({ netProfitAfterCosts: undefined, profitPerHourAfterCosts: undefined })),
    70,
    "legacy shifts must fall back to netProfit",
  );

  const empty = pickProfitFromRouteRow({});
  assert.equal(empty.profit, null);
  assert.equal(empty.usesAfterCosts, false);

  console.log("test-shift-display-economics: ok (7 cases)");

  const { formatShiftRowLabel } = compileTsModule("features/statistics/shiftPeriod.ts", {
    "../../utils/shiftDisplayEconomics": {
      getCompletedShiftProfit: () => 42,
    },
  });
  assert.match(
    formatShiftRowLabel({ endedAt: "2026-06-21T12:00:00.000Z", distanceKm: 10, netProfit: 99 }),
    /· 42 · 10\.0 км$/,
    "statistics labels must use the shared completed-shift profit",
  );
}

function fromShiftInput(overrides = {}) {
  return {
    id: "s1",
    netProfit: 70,
    profitPerHour: 18,
    netProfitAfterCosts: 50,
    profitPerHourAfterCosts: 12,
    ...overrides,
  };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
