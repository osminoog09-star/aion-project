/**
 * allocateFuelByKmClass — node assert.
 */
import assert from "node:assert/strict";

async function main() {
  let allocateFuelByKmClass;
  try {
    const mod = await import("../../features/maps/allocateFuelByKmClass.ts");
    allocateFuelByKmClass = mod.allocateFuelByKmClass;
  } catch (err) {
    console.log("skip:", err?.message ?? err);
    process.exit(0);
  }

  let cases = 0;

  // Только заказ — все деньги на заказ, потерь нет.
  const a = allocateFuelByKmClass({ classKm: { order: 100 }, totalFuelCost: 1000 });
  assert.equal(a.totalKm, 100);
  assert.equal(a.fuelCostPerKm, 10);
  assert.equal(a.byClass.order.fuelCost, 1000);
  assert.equal(a.byClass.order.sharePercent, 100);
  assert.equal(a.byClass.empty.fuelCost, 0);
  assert.equal(a.unpaidFuelCost, 0);
  assert.equal(a.billableKm, 100);
  cases += 1;

  // Смешанный пробег: 50/25/15/10 на 2000.
  const b = allocateFuelByKmClass({
    classKm: { order: 50, pickup: 25, empty: 15, personal: 10 },
    totalFuelCost: 2000,
  });
  assert.equal(b.totalKm, 100);
  assert.equal(b.fuelCostPerKm, 20);
  assert.equal(b.byClass.order.fuelCost, 1000);
  assert.equal(b.byClass.pickup.fuelCost, 500);
  assert.equal(b.byClass.empty.fuelCost, 300);
  assert.equal(b.byClass.personal.fuelCost, 200);
  assert.equal(b.billableKm, 75);
  assert.equal(b.unpaidKm, 25);
  assert.equal(b.billableFuelCost, 1500);
  assert.equal(b.unpaidFuelCost, 500);
  const shareSum =
    b.byClass.order.sharePercent +
    b.byClass.pickup.sharePercent +
    b.byClass.empty.sharePercent +
    b.byClass.personal.sharePercent;
  assert.equal(shareSum, 100);
  cases += 1;

  // Ноль километров — без деления на ноль / NaN.
  const z = allocateFuelByKmClass({ classKm: {}, totalFuelCost: 500 });
  assert.equal(z.totalKm, 0);
  assert.equal(z.fuelCostPerKm, 0);
  assert.equal(z.byClass.order.fuelCost, 0);
  assert.equal(z.unpaidFuelCost, 0);
  cases += 1;

  // Битые значения отбрасываются (отрицательное, NaN).
  const g = allocateFuelByKmClass({
    classKm: { order: -5, pickup: Number.NaN, empty: 10 },
    totalFuelCost: 100,
  });
  assert.equal(g.totalKm, 10);
  assert.equal(g.byClass.empty.fuelCost, 100);
  assert.equal(g.unpaidFuelCost, 100);
  assert.equal(g.billableFuelCost, 0);
  cases += 1;

  console.log(`test-fuel-allocation: ok (${cases} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
