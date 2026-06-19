/**
 * Field validation checklist — node assert (no Jest).
 * Run: node scripts/ci/test-route-field-validation.mjs
 */
import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const summaryBase = {
  totalSessions: 2,
  withAnalytics: 2,
  medianProfitPerHour: 12,
  medianIdleRatio: 0.2,
  medianRouteKmPerMovingHour: 8,
};

const backfillOk = {
  attempted: 3,
  created: 1,
  skippedExisting: 2,
  skippedNoGps: 0,
  skippedInvalidShift: 0,
};

const stopZonesOk = {
  windowDays: 14,
  sampleShifts: 2,
  stopObservationCount: 12,
  insights: [{ text: "Зона A", evidence: "3 остановки" }],
};

const historicalOk = {
  windowDays: 14,
  sampleSnapshots: 4,
  medianIdleRatio: 0.25,
  medianProfitPerHour: 10,
  medianProfitPerHourAfterCosts: 8,
  weekdayPatterns: [],
  hourOfDayPatterns: [],
};

const routeFieldValidation = compileTsModule("features/route/computeRouteFieldValidation.ts");

async function main() {
  const {
    computeRouteFieldValidation,
    formatFieldValidationBlockersRu,
    formatFieldValidationReportRu,
    getNextFieldValidationActionRu,
  } = routeFieldValidation;

  const empty = computeRouteFieldValidation({
    summary: {
      totalSessions: 0,
      withAnalytics: 0,
      medianProfitPerHour: null,
      medianIdleRatio: null,
      medianRouteKmPerMovingHour: null,
    },
    backfill: null,
    stopZones: null,
    historical: null,
    topZoneInsight: null,
  });
  assert.equal(empty.ready, false);
  assert.equal(empty.totalCount, 8);
  assert.ok(empty.passedCount < 8);

  const full = computeRouteFieldValidation({
    summary: summaryBase,
    backfill: backfillOk,
    stopZones: stopZonesOk,
    historical: historicalOk,
    topZoneInsight: "Топ-зона: центр",
    fgsHeartbeatAgeMs: 30_000,
    hasBgMergeState: true,
  });
  assert.equal(full.passedCount, 8);
  assert.equal(full.ready, true);
  assert.equal(full.coveragePercent, 100);

  const staleFgs = computeRouteFieldValidation({
    summary: summaryBase,
    backfill: backfillOk,
    stopZones: stopZonesOk,
    historical: historicalOk,
    topZoneInsight: "Топ-зона",
    fgsHeartbeatAgeMs: 600_000,
    hasBgMergeState: true,
  });
  assert.equal(staleFgs.ready, false);
  assert.equal(
    staleFgs.checks.find((c) => c.id === "fgs-heartbeat")?.passed,
    false,
  );

  const blockers = formatFieldValidationBlockersRu(empty);
  assert.ok(blockers.includes("Есть GPS-смены"));
  assert.equal(formatFieldValidationBlockersRu(full), "");
  assert.ok(getNextFieldValidationActionRu(empty).includes("Смена"));
  assert.ok(getNextFieldValidationActionRu(full).includes("OTA smoke"));
  assert.ok(empty.checks.every((c) => c.passed === false ? c.actionRu.length > 0 : true));
  assert.ok(full.checks.every((c) => c.actionRu.length > 0));

  const report = formatFieldValidationReportRu(full);
  assert.ok(report.includes("ГОТОВО"));
  assert.ok(report.includes("NEXT:"));

  console.log("test-route-field-validation: ok (6 cases)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
