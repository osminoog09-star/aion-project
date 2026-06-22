import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { rowPayloadToShift } = compileTsModule(
  "features/cloud/repositories/tripsRepository.ts",
  {
    "../../../utils/shiftDisplayEconomics": {
      getCompletedShiftEconomicsProjection: () => ({
        totalExpenses: 0,
        profitPerHour: 0,
        profitPerKm: 0,
      }),
    },
  },
);

const shift = rowPayloadToShift({
  id: "remote-1",
  client_ref: "shift-1",
  payload: {},
  started_at: "2026-06-22T00:00:00.000Z",
  ended_at: "2026-06-22T01:00:00.000Z",
  earnings: 100,
  expenses_total: 150,
  distance_km: 10,
  duration_seconds: 3600,
  fuel_liters_equivalent: 5,
  profit_per_hour: -50,
  profit_per_km: -5,
});

assert.equal(shift.netProfit, -50);
assert.equal(shift.netProfitAfterCosts, -50);
assert.equal(shift.profitPerHourAfterCosts, -50);
assert.equal(shift.profitPerKm, -5);

console.log("cloud trip economics: OK (negative after-costs profit preserved)");
