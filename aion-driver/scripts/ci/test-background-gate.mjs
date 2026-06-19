import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

async function main() {
  const routeValidation = compileTsModule(
    "features/route/computeRouteFieldValidation.ts",
  );
  const { backgroundTrackingProductionGate } = compileTsModule(
    "services/backgroundTracking.ts",
    {
      "../features/route/computeRouteFieldValidation": routeValidation,
    },
  );

  delete process.env.EXPO_PUBLIC_FIELD_VALIDATION_GATE;
  const off = backgroundTrackingProductionGate(false);
  assert.equal(off.allowed, true, "gate off by default — не блокируем FGS/UI");
  assert.ok(
    off.reasonRu.includes("информацион") || off.reasonRu.includes("временно"),
  );

  process.env.EXPO_PUBLIC_FIELD_VALIDATION_GATE = "1";
  const blocked = backgroundTrackingProductionGate(false);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.reasonRu.includes("8/8"));

  const needsOwner = backgroundTrackingProductionGate(true);
  assert.equal(needsOwner.allowed, false);
  assert.ok(needsOwner.reasonRu.includes("owner sign-off"));

  delete process.env.EXPO_PUBLIC_FIELD_VALIDATION_GATE;
  console.log("test-background-gate: ok (3 cases)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
