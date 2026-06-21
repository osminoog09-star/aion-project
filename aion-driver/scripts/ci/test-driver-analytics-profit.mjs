import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const display = compileTsModule("utils/shiftDisplayEconomics.ts", {
  "./formatting": { formatCurrencyDisplay: String },
});
const { computeDriverAnalytics } = compileTsModule("features/driver/analytics/computeDriverAnalytics.ts", {
  "../../../utils/shiftDisplayEconomics": display,
});

function shift(hour, afterCosts, grossPerHour = 100) {
  const startedAt = new Date("2026-06-20T00:00:00.000Z");
  startedAt.setUTCHours(hour);
  return {
    id: `s-${hour}`,
    startedAt: startedAt.toISOString(),
    endedAt: new Date(startedAt.getTime() + 3_600_000).toISOString(),
    durationMs: 3_600_000,
    income: 140,
    fuelCostTotal: 40,
    netProfit: grossPerHour,
    profitPerHour: grossPerHour,
    profitPerKm: grossPerHour / 10,
    distanceKm: 10,
    netProfitAfterCosts: afterCosts,
    profitPerHourAfterCosts: afterCosts,
  };
}

const lowAfterCosts = shift(8, 10);
const highAfterCosts = shift(18, 80);
const analytics = computeDriverAnalytics([lowAfterCosts, highAfterCosts]);
assert.equal(analytics.medianProfitPerHour, 45);
assert.equal(analytics.lastTenAvgProfitPerHour, 45);
assert.equal(
  analytics.bestStartHours[0],
  new Date(highAfterCosts.startedAt).getHours(),
  "best hour must use after-costs profit",
);
assert.equal(analytics.routeEfficiencyScore < 50, true, "route score must use after-costs profit/km");

console.log("test-driver-analytics-profit: ok (4 assertions)");
