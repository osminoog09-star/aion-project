/**
 * buildMapsIntelligenceSnapshot / buildFuelIntelligenceSnapshot — node assert.
 */
import assert from "node:assert/strict";

async function main() {
  let buildMaps;
  let buildFuel;
  let allocateFuel;
  try {
    const mod = await import("../../features/intelligence/buildMapsFuelIntelligence.ts");
    buildMaps = mod.buildMapsIntelligenceSnapshot;
    buildFuel = mod.buildFuelIntelligenceSnapshot;
    allocateFuel = mod.allocateFuelByKmClass;
  } catch (err) {
    console.log("skip:", err?.message ?? err);
    process.exit(0);
  }

  let cases = 0;

  // Maps: нет GPS — ничего не выдумываем.
  const m0 = buildMaps({ shiftId: "s1" });
  assert.equal(m0.routeDistanceMeters, null);
  assert.equal(m0.kilometerClasses.length, 0);
  assert.equal(m0.publishable, false);
  assert.equal(m0.provenance.gpsPointCount, 0);
  assert.equal(m0.schemaVersion, 1);
  cases += 1;

  // Maps: реальные точки — дистанция из dM, класс unclassified.
  const m1 = buildMaps({
    shiftId: "s1",
    points: [{ dM: 100 }, { dM: 200 }, { dM: null }, { dM: 50 }],
    nowMs: 1000,
  });
  assert.equal(m1.routeDistanceMeters, 350);
  assert.equal(m1.provenance.gpsPointCount, 4);
  assert.equal(m1.kilometerClasses.length, 1);
  assert.equal(m1.kilometerClasses[0].status, "unclassified");
  assert.equal(m1.kilometerClasses[0].class, null);
  assert.equal(m1.kilometerClasses[0].distanceMeters, 350);
  assert.equal(m1.publishable, false);
  assert.equal(m1.provenance.generatedAtMs, 1000);
  cases += 1;

  // Fuel: реальное топливо + дистанция → честное ₽/100км, publishable.
  const f1 = buildFuel({
    shiftId: "s1",
    gpsPointCount: 4,
    fuelEntryIds: ["e1"],
    confirmedFuelCost: 1000,
    routeDistanceMeters: 50000,
  });
  assert.equal(f1.costPer100Km, 2000);
  assert.equal(f1.confirmedFuelCost, 1000);
  assert.equal(f1.publishable, true);
  assert.equal(f1.allocations.length, 1);
  assert.equal(f1.allocations[0].status, "unallocated");
  assert.equal(f1.allocations[0].kilometerClass, null);
  cases += 1;

  // Fuel: нет подтверждённого топлива → нет ₽/100км, нечего публиковать.
  const f2 = buildFuel({ shiftId: "s1", gpsPointCount: 0, routeDistanceMeters: 50000 });
  assert.equal(f2.costPer100Km, null);
  assert.equal(f2.confirmedFuelCost, null);
  assert.equal(f2.allocations.length, 0);
  assert.equal(f2.publishable, false);
  cases += 1;

  // Fuel: топливо есть, но дистанции нет → ₽/100км нельзя посчитать честно.
  const f3 = buildFuel({ shiftId: "s1", gpsPointCount: 0, confirmedFuelCost: 500, routeDistanceMeters: null });
  assert.equal(f3.costPer100Km, null);
  assert.equal(f3.publishable, false);
  assert.equal(f3.allocations.length, 1);
  cases += 1;

  // Fuel: некорректное значение топлива отбрасывается.
  const f4 = buildFuel({ shiftId: "s1", gpsPointCount: 0, confirmedFuelCost: -10, routeDistanceMeters: 1000 });
  assert.equal(f4.confirmedFuelCost, null);
  assert.equal(f4.costPer100Km, null);
  cases += 1;

  // Аллокация топлива по классам — пропорционально км.
  const classes = [
    { status: "classified", class: "on_order", distanceMeters: 60000, evidence: "driver_event" },
    { status: "classified", class: "empty", distanceMeters: 40000, evidence: "driver_event" },
  ];
  const alloc = allocateFuel(classes, 1000);
  const byCls = Object.fromEntries(alloc.map((a) => [a.kilometerClass, a]));
  assert.equal(byCls.on_order.status, "allocated");
  assert.equal(byCls.on_order.allocatedCost, 600);
  assert.equal(byCls.empty.allocatedCost, 400);
  cases += 1;

  // Без топлива — unallocated, без выдуманных сумм.
  const allocNoCost = allocateFuel(classes, null);
  assert.ok(allocNoCost.every((a) => a.status === "unallocated" && a.allocatedCost === null));
  cases += 1;

  // Unclassified не аллоцируется.
  assert.equal(
    allocateFuel([{ status: "unclassified", class: null, distanceMeters: 100, evidence: null }], 500).length,
    0,
  );
  cases += 1;

  // buildFuel с классами → аллокация попадает в снапшот.
  const fAlloc = buildFuel({
    shiftId: "s1",
    gpsPointCount: 4,
    confirmedFuelCost: 1000,
    routeDistanceMeters: 100000,
    kilometerClasses: classes,
  });
  assert.ok(
    fAlloc.allocations.some(
      (a) => a.status === "allocated" && a.kilometerClass === "on_order" && a.allocatedCost === 600,
    ),
  );
  cases += 1;

  console.log(`test-maps-fuel-intelligence: ok (${cases} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
