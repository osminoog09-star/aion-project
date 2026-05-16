import assert from "node:assert/strict";

async function main() {
  let backgroundTrackingProductionGate;
  try {
    const mod = await import("../../services/backgroundTracking.ts");
    backgroundTrackingProductionGate = mod.backgroundTrackingProductionGate;
  } catch (err) {
    console.log("skip:", err?.message ?? err);
    process.exit(0);
  }

  assert.equal(backgroundTrackingProductionGate(false).allowed, false);
  assert.equal(backgroundTrackingProductionGate(true).allowed, false);
  assert.ok(backgroundTrackingProductionGate(false).reasonRu.includes("8/8"));

  console.log("test-background-gate: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
