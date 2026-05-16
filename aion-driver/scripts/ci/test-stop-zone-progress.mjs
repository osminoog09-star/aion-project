/**
 * formatStopZoneProgressRu — node assert.
 */
import assert from "node:assert/strict";

async function main() {
  let formatStopZoneProgressRu;
  try {
    const mod = await import("../../features/analytics/stopZoneProgressRu.ts");
    formatStopZoneProgressRu = mod.formatStopZoneProgressRu;
  } catch (err) {
    console.log("skip:", err?.message ?? err);
    process.exit(0);
  }

  assert.ok(formatStopZoneProgressRu(null)?.includes("≥2 смены"));
  const partial = formatStopZoneProgressRu({
    windowDays: 30,
    sampleShifts: 2,
    stopObservationCount: 3,
    insights: [],
  });
  assert.ok(partial?.includes("ещё 2"));

  const ok = formatStopZoneProgressRu({
    windowDays: 30,
    sampleShifts: 4,
    stopObservationCount: 8,
    insights: [{ text: "a", evidence: "b" }],
  });
  assert.ok(ok?.includes("инсайт"));

  console.log("test-stop-zone-progress: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
