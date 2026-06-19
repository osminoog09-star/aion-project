import assert from "node:assert/strict";

/** Mirror of src/lib/operations/field-validation-report.ts */
function parseFieldValidationReport(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const header = lines[0] ?? "";
  const ready =
    /8\/8/i.test(header) ||
    /ГОТОВО/i.test(header) ||
    /FIELD VALIDATION:\s*ГОТОВО/i.test(text);
  const frac = header.match(/(\d+)\/(\d+)/);
  const passedCount = frac ? Number.parseInt(frac[1], 10) : ready ? 8 : null;
  const totalCount = frac ? Number.parseInt(frac[2], 10) : 8;
  const nextLine = lines.find((line) => /^NEXT\s*:/i.test(line));
  const nextActionRu = nextLine ? nextLine.replace(/^NEXT\s*:\s*/i, "").trim() || null : null;
  return {
    ready: ready || (passedCount != null && passedCount >= 8),
    passedCount,
    totalCount,
    nextActionRu,
  };
}

const ready = parseFieldValidationReport(
  "FIELD VALIDATION: ГОТОВО (8/8) — OTA smoke\nNEXT: Все пункты пройдены — скопируйте отчёт и переходите к OTA smoke.\n✓ Есть GPS-смены: 2 смен",
);
assert.equal(ready.ready, true);
assert.equal(ready.passedCount, 8);
assert.ok(ready.nextActionRu.includes("OTA smoke"));

const partial = parseFieldValidationReport("FIELD VALIDATION: 5/8\nNEXT: FGS heartbeat: сверните приложение\n○ FGS heartbeat");
assert.equal(partial.ready, false);
assert.equal(partial.passedCount, 5);
assert.equal(partial.nextActionRu, "FGS heartbeat: сверните приложение");

console.log("test-field-validation-report-parse: OK");
