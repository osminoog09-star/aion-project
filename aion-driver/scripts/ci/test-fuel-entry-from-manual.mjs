/**
 * buildManualFuelEntry / sumFuelEntries* / fuelCostPer100Km — node assert.
 * Run: node scripts/ci/test-fuel-entry-from-manual.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const {
  buildManualFuelEntry,
  sumFuelEntriesTotal,
  sumFuelEntriesLiters,
  fuelCostPer100Km,
} = compileTsModule("utils/fuelEntryFromManual.ts");

async function main() {
  // --- buildManualFuelEntry: валидная запись ---
  const entry = buildManualFuelEntry({ totalCost: 2000, liters: 32, fuelType: "  АИ-92  " });
  assert.equal(entry.totalCost, 2000);
  assert.equal(entry.liters, 32);
  assert.equal(entry.unitPrice, 62.5, "2000 / 32 = 62.5 руб/л");
  assert.equal(entry.fuelType, "АИ-92", "тип топлива должен быть trim'нут");
  assert.equal(entry.source, "manual");
  assert.match(entry.id, /^fuel_manual_\d+_[0-9a-f]{1,6}$/);
  assert.equal(typeof entry.addedAtMs, "number");

  // Округление цены за литр до 3 знаков: 1000/3 = 333.333333... → 333.333.
  assert.equal(buildManualFuelEntry({ totalCost: 1000, liters: 3, fuelType: "АИ-95" }).unitPrice, 333.333);

  // Пустой/пробельный тип топлива → дефолт "АИ-95".
  assert.equal(buildManualFuelEntry({ totalCost: 100, liters: 2, fuelType: "   " }).fuelType, "АИ-95");

  // Числовые строки коэрсятся через Number(): "1500"/"30" → 50 руб/л.
  assert.equal(buildManualFuelEntry({ totalCost: "1500", liters: "30", fuelType: "газ" }).unitPrice, 50);

  // --- buildManualFuelEntry: мусорные входы → null ---
  assert.equal(buildManualFuelEntry({ totalCost: 0, liters: 10, fuelType: "АИ-95" }), null, "нулевая сумма");
  assert.equal(buildManualFuelEntry({ totalCost: -500, liters: 10, fuelType: "АИ-95" }), null, "отрицательная сумма");
  assert.equal(buildManualFuelEntry({ totalCost: NaN, liters: 10, fuelType: "АИ-95" }), null, "NaN сумма");
  assert.equal(buildManualFuelEntry({ totalCost: Infinity, liters: 10, fuelType: "АИ-95" }), null, "Infinity сумма");
  assert.equal(buildManualFuelEntry({ totalCost: 1000, liters: 0, fuelType: "АИ-95" }), null, "нулевые литры");
  assert.equal(buildManualFuelEntry({ totalCost: 1000, liters: -5, fuelType: "АИ-95" }), null, "отрицательные литры");
  assert.equal(buildManualFuelEntry({ totalCost: 1000, liters: NaN, fuelType: "АИ-95" }), null, "NaN литры");
  assert.equal(buildManualFuelEntry({ totalCost: "abc", liters: 10, fuelType: "АИ-95" }), null, "нечисловая строка");

  // --- sumFuelEntriesTotal ---
  assert.equal(sumFuelEntriesTotal(undefined), 0);
  assert.equal(sumFuelEntriesTotal([]), 0);
  assert.equal(
    sumFuelEntriesTotal([
      { totalCost: 2000, liters: 32 },
      { totalCost: NaN, liters: 5 },
      { totalCost: -50, liters: 1 },
      { totalCost: 500.5, liters: 8 },
    ]),
    2500.5,
    "мусорные totalCost (NaN/отрицательные) игнорируются",
  );

  // --- sumFuelEntriesLiters ---
  assert.equal(sumFuelEntriesLiters(undefined), 0);
  assert.equal(
    sumFuelEntriesLiters([
      { totalCost: 100, liters: 30 },
      { totalCost: 100, liters: 0 },
      { totalCost: 100, liters: NaN },
      { totalCost: 100, liters: 10.5 },
    ]),
    40.5,
    "мусорные liters (0/NaN) игнорируются",
  );

  // --- fuelCostPer100Km ---
  assert.equal(fuelCostPer100Km(2000, 250), 800, "2000 руб / 250 км = 800 руб/100км");
  assert.equal(fuelCostPer100Km(1234, 321), 384.4, "округление до 1 знака: 384.4236 → 384.4");
  assert.equal(fuelCostPer100Km(0, 100), null, "нулевая стоимость → null");
  assert.equal(fuelCostPer100Km(-10, 100), null, "отрицательная стоимость → null");
  assert.equal(fuelCostPer100Km(1000, 0), null, "нулевая дистанция → null");
  assert.equal(fuelCostPer100Km(1000, -5), null, "отрицательная дистанция → null");

  console.log("test-fuel-entry-from-manual: ok (23 cases)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
