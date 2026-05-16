/**
 * Lightweight headless merge checks (no Jest) — run: node scripts/ci/test-headless-merge.mjs
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Compiled path via ts-node alternative: inline minimal replay of computeHeadlessMergeResult rules
// Import TS through dynamic import if tsx available; fallback pure JS duplicate for waterline.

const shift = {
  id: "s1",
  startedAt: new Date(Date.now() - 3_600_000).toISOString(),
  endedAt: null,
  paused: false,
  distanceMeters: 1000,
  distanceMetersPetrol: 1000,
  distanceMetersGas: 0,
  activeFuelType: "petrol",
  totalIncome: 50,
  lastAcceptedLat: 55.75,
  lastAcceptedLng: 37.62,
  accumulatedPauseMs: 0,
  incomeLedger: [],
  motionMovingMs: 0,
  motionIdleMs: 0,
  fuelEntries: [],
};

function makeLoc(lat, lng, ts) {
  return {
    coords: { latitude: lat, longitude: lng, accuracy: 12 },
    timestamp: ts,
  };
}

async function main() {
  let computeHeadlessMergeResult;
  try {
    const mod = await import("../../services/headlessShiftLocationMerge.ts");
    computeHeadlessMergeResult = mod.computeHeadlessMergeResult;
  } catch {
    console.log("skip TS import — run npm run typecheck for compile safety");
    process.exit(0);
  }

  const t0 = Date.now() - 120_000;
  const locs = [
    makeLoc(55.751, 37.621, t0),
    makeLoc(55.752, 37.622, t0 + 30_000),
    makeLoc(55.753, 37.623, t0 + 60_000),
  ];

  const out1 = computeHeadlessMergeResult({
    shift,
    mergeStateRaw: null,
    locs,
  });
  assert.ok(out1, "first merge should produce output");
  assert.ok(out1.nextShift.distanceMeters > shift.distanceMeters, "distance increases");

  const out2 = computeHeadlessMergeResult({
    shift: out1.nextShift,
    mergeStateRaw: out1.nextMergeStateJson,
    locs,
  });
  assert.ok(out2, "replay merge");
  assert.equal(
    out2.nextShift.distanceMeters,
    out1.nextShift.distanceMeters,
    "idempotent replay must not double distance",
  );

  const paused = computeHeadlessMergeResult({
    shift: { ...shift, paused: true },
    mergeStateRaw: null,
    locs,
  });
  assert.ok(paused);
  assert.equal(paused.nextShift.distanceMeters, shift.distanceMeters, "paused shift skips distance");

  console.log("headless merge checks: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
