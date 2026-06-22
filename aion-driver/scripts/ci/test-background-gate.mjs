import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

async function main() {
  const { backgroundTrackingProductionGate } = compileTsModule("services/backgroundTracking.ts");

  delete process.env.EXPO_PUBLIC_FIELD_VALIDATION_GATE;
  const ownerDecision = backgroundTrackingProductionGate(false);
  assert.equal(ownerDecision.allowed, true, "retired owner gate never blocks FGS/UI");
  assert.ok(ownerDecision.reasonRu.includes("снят решением владельца"));

  process.env.EXPO_PUBLIC_FIELD_VALIDATION_GATE = "1";
  const envCannotRestoreGate = backgroundTrackingProductionGate(false);
  assert.equal(envCannotRestoreGate.allowed, true, "environment cannot restore retired owner gate");

  const historicalSuccessCannotChangeDecision = backgroundTrackingProductionGate(true);
  assert.equal(historicalSuccessCannotChangeDecision.allowed, true);
  assert.equal(historicalSuccessCannotChangeDecision.reasonRu, ownerDecision.reasonRu);

  delete process.env.EXPO_PUBLIC_FIELD_VALIDATION_GATE;
  console.log("test-background-gate: ok (owner gate permanently retired, 3 cases)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
