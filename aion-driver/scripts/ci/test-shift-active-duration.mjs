/**
 * getEffectiveShiftDurationMs — node assert.
 * Run: node scripts/ci/test-shift-active-duration.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { getEffectiveShiftDurationMs } = compileTsModule("utils/shiftActiveDuration.ts");

const T0 = Date.parse("2026-07-04T08:00:00.000Z");
const HOUR = 3_600_000;
const MIN = 60_000;

function shift(overrides = {}) {
  return {
    startedAt: "2026-07-04T08:00:00.000Z",
    accumulatedPauseMs: 0,
    paused: false,
    pauseStartedAtMs: null,
    ...overrides,
  };
}

async function main() {
  // 1. Простая смена без пауз: 4 часа ровно.
  assert.equal(getEffectiveShiftDurationMs(shift(), T0 + 4 * HOUR), 4 * HOUR);

  // 2. Накопленная пауза вычитается: 4ч - 10мин = 13_800_000.
  assert.equal(
    getEffectiveShiftDurationMs(shift({ accumulatedPauseMs: 10 * MIN }), T0 + 4 * HOUR),
    13_800_000,
  );

  // 3. Активная пауза: 4ч - 10мин накопленной - 1ч текущей = 10_200_000.
  assert.equal(
    getEffectiveShiftDurationMs(
      shift({ accumulatedPauseMs: 10 * MIN, paused: true, pauseStartedAtMs: T0 + 3 * HOUR }),
      T0 + 4 * HOUR,
    ),
    10_200_000,
  );

  // 4. paused=true, но pauseStartedAtMs=null → текущая пауза не считается.
  assert.equal(
    getEffectiveShiftDurationMs(
      shift({ accumulatedPauseMs: 10 * MIN, paused: true, pauseStartedAtMs: null }),
      T0 + 4 * HOUR,
    ),
    13_800_000,
  );

  // 5. pauseStartedAtMs в будущем (рассинхрон часов) → clamp текущей паузы к 0.
  assert.equal(
    getEffectiveShiftDurationMs(
      shift({ paused: true, pauseStartedAtMs: T0 + 5 * HOUR }),
      T0 + 4 * HOUR,
    ),
    4 * HOUR,
  );

  // 6. accumulatedPauseMs === undefined → трактуется как 0 (nullish).
  assert.equal(
    getEffectiveShiftDurationMs(shift({ accumulatedPauseMs: undefined }), T0 + 2 * HOUR),
    2 * HOUR,
  );

  // 7. now раньше старта → длительность clamp'ится к 0, не уходит в минус.
  assert.equal(getEffectiveShiftDurationMs(shift(), T0 - 30 * MIN), 0);

  // 8. Паузы больше прошедшего времени → 0, не отрицательное значение.
  assert.equal(
    getEffectiveShiftDurationMs(shift({ accumulatedPauseMs: 5 * HOUR }), T0 + 4 * HOUR),
    0,
  );

  // 9. now === старту → ровно 0.
  assert.equal(getEffectiveShiftDurationMs(shift(), T0), 0);

  console.log("test-shift-active-duration: ok (9 cases)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
