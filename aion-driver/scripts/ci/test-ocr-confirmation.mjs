import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { validateOcrConfirmation } = compileTsModule(
  "features/import/confirmation/validateOcrConfirmation.ts",
);

const valid = validateOcrConfirmation({ earnings: 18.5, trips: [{ amount: 18.5 }] });
assert.equal(valid.valid, true);
assert.equal(valid.message, null);
assert.equal(validateOcrConfirmation({ earnings: 0, trips: [] }).valid, false);
assert.equal(
  validateOcrConfirmation({ earnings: 12, trips: [{ amount: -2 }, { amount: 14 }] }).valid,
  false,
);
assert.equal(
  validateOcrConfirmation({ earnings: Number.NaN, trips: [{ amount: 10 }] }).valid,
  false,
);

console.log("test-ocr-confirmation: ok (4 cases)");
