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

const { recoverInterruptedOcrItems } = compileTsModule(
  "features/import/ocrQueue/recoverInterruptedOcrItems.ts",
);
const now = 1_750_000_000_000;
const queue = [
  {
    id: "processing",
    dedupeKey: "paste:1",
    status: "processing",
    attemptCount: 2,
    maxAttempts: 5,
    createdAtMs: now - 10_000,
    updatedAtMs: now - 5_000,
    payload: { imageUris: [], pastedText: "x", platform: "bolt", currencyCode: "EUR" },
  },
  {
    id: "done",
    dedupeKey: "paste:2",
    status: "done",
    attemptCount: 1,
    maxAttempts: 5,
    createdAtMs: now - 20_000,
    updatedAtMs: now - 15_000,
    payload: { imageUris: [], pastedText: "y", platform: "bolt", currencyCode: "EUR" },
  },
];
const recovered = recoverInterruptedOcrItems(queue, now);
assert.equal(recovered.recoveredCount, 1);
assert.equal(recovered.items[0].status, "pending");
assert.equal(recovered.items[0].attemptCount, 2);
assert.equal(recovered.items[0].nextRetryAtMs, now);
assert.equal(recovered.items[1], queue[1]);

console.log("test-ocr-queue-recovery: ok (5 cases)");
