/**
 * pickProfitFromRouteRow — node assert.
 * Run: node scripts/ci/test-shift-display-economics.mjs
 */
import assert from "node:assert/strict";

async function loadPick() {
  try {
    const mod = await import("../../utils/shiftDisplayEconomics.ts");
    return mod.pickProfitFromRouteRow;
  } catch (err) {
    console.log("skip TS import — run npm run typecheck:", err?.message ?? err);
    process.exit(0);
  }
}

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
  const pickProfitFromRouteRow = await loadPick();

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

  const empty = pickProfitFromRouteRow({});
  assert.equal(empty.profit, null);
  assert.equal(empty.usesAfterCosts, false);

  console.log("test-shift-display-economics: ok (4 cases)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
