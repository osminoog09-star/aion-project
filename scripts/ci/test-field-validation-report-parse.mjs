import assert from "node:assert/strict";

/** Mirror of src/lib/operations/field-validation-report.ts */
function parseFieldValidationReport(text) {
  const header = text.split("\n")[0]?.trim() ?? "";
  const ready =
    /8\/8/i.test(header) ||
    /ГОТОВО/i.test(header) ||
    /FIELD VALIDATION:\s*ГОТОВО/i.test(text);
  const frac = header.match(/(\d+)\/(\d+)/);
  const passedCount = frac ? Number.parseInt(frac[1], 10) : ready ? 8 : null;
  const totalCount = frac ? Number.parseInt(frac[2], 10) : 8;
  return {
    ready: ready || (passedCount != null && passedCount >= 8),
    passedCount,
    totalCount,
  };
}

const ready = parseFieldValidationReport(
  "FIELD VALIDATION: ГОТОВО (8/8) — OTA smoke\n✓ Есть GPS-смены: 2 смен",
);
assert.equal(ready.ready, true);
assert.equal(ready.passedCount, 8);

const partial = parseFieldValidationReport("FIELD VALIDATION: 5/8\n○ FGS heartbeat");
assert.equal(partial.ready, false);
assert.equal(partial.passedCount, 5);

console.log("test-field-validation-report-parse: OK");
