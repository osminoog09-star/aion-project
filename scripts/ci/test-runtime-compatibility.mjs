import assert from "node:assert/strict";

function semverGte(a, b) {
  const pa = a.split(".").map((x) => Number.parseInt(x, 10));
  const pb = b.split(".").map((x) => Number.parseInt(x, 10));
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false;
  }
  return true;
}

function validateCompatibility(requirements, device) {
  if (!device?.runtimeVersion) {
    return { compatible: false, upgradeRequired: true };
  }
  if (!semverGte(device.runtimeVersion, requirements.minRuntimeVersion)) {
    return { compatible: false, upgradeRequired: true };
  }
  const missingFeatures = requirements.requiredFeatures.filter(
    (f) => !(device.features ?? []).includes(f),
  );
  const missingRoutes = requirements.requiredRoutes.filter(
    (r) => !(device.routes ?? []).includes(r),
  );
  if (missingFeatures.length || missingRoutes.length) {
    return { compatible: false, upgradeRequired: true };
  }
  return { compatible: true, upgradeRequired: false };
}

assert.equal(semverGte("1.0.6", "1.0.4"), true);
const ok = validateCompatibility(
  { minRuntimeVersion: "1.0.6", requiredFeatures: ["field_validation_8_8"], requiredRoutes: ["/ota-debug"] },
  {
    runtimeVersion: "1.0.6",
    features: ["field_validation_8_8"],
    routes: ["/ota-debug"],
  },
);
assert.equal(ok.compatible, true);

const stale = validateCompatibility(
  { minRuntimeVersion: "1.0.6", requiredFeatures: ["field_validation_8_8"], requiredRoutes: ["/ota-debug"] },
  { runtimeVersion: "1.0.4", features: [], routes: [] },
);
assert.equal(stale.compatible, false);

console.log("test-runtime-compatibility: OK");
