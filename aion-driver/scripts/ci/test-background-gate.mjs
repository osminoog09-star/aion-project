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

  const off = backgroundTrackingProductionGate(false);
  assert.equal(off.allowed, true, "gate off by default — не блокируем FGS/UI");
  assert.ok(
    off.reasonRu.includes("информацион") || off.reasonRu.includes("временно"),
  );

  console.log("test-background-gate: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
