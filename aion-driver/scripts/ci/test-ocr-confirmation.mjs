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

const { buildOcrDedupeKey } = compileTsModule(
  "features/import/ocrQueue/buildOcrDedupeKey.ts",
);
const imagePayload = {
  imageUris: ["file:///receipt.jpg"],
  pastedText: null,
  platform: "bolt",
  currencyCode: "eur",
};
const imageKey = buildOcrDedupeKey(imagePayload);
assert.equal(imageKey, buildOcrDedupeKey({ ...imagePayload, currencyCode: "EUR" }));
assert.notEqual(imageKey, buildOcrDedupeKey({ ...imagePayload, platform: "uber" }));
assert.notEqual(imageKey, buildOcrDedupeKey({ ...imagePayload, currencyCode: "USD" }));
assert.notEqual(
  imageKey,
  buildOcrDedupeKey({ ...imagePayload, imageUris: ["file:///other.jpg"] }),
);

console.log("test-ocr-dedupe-key: ok (4 cases)");

const { summarizeOcrQueue } = compileTsModule(
  "features/import/ocrQueue/summarizeOcrQueue.ts",
);
const summary = summarizeOcrQueue([
  { status: "pending" },
  { status: "pending" },
  { status: "processing" },
  { status: "failed" },
  { status: "done" },
]);
assert.equal(summary.pending, 2);
assert.equal(summary.processing, 1);
assert.equal(summary.failed, 1);
assert.equal(summary.done, 1);

console.log("test-ocr-queue-summary: ok (4 counters)");
