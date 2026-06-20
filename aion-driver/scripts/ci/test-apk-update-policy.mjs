import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const semver = compileTsModule("src/core/updates/semverCompare.ts");
const runtimeCompatibility = compileTsModule("src/core/updates/runtimeCompatibility.ts", {
  "./semverCompare": semver,
});
const { evaluateApkUpdatePolicy } = compileTsModule("src/core/updates/apkUpdatePolicy.ts", {
  "./apkManifest.types": {},
  "./runtimeCompatibility": runtimeCompatibility,
  "./semverCompare": semver,
});

const base = {
  latestVersion: "1.1.0",
  minimumSupported: "1.0.0",
  apkUrl: "https://example.com/aion.apk",
};

assert.deepEqual(
  JSON.parse(JSON.stringify(evaluateApkUpdatePolicy({ ...base, rolloutState: "paused" }, "1.0.9", "1.0.9"))),
  { reason: "none", critical: false },
  "paused rollout should hide an optional newer APK",
);
assert.deepEqual(
  JSON.parse(JSON.stringify(evaluateApkUpdatePolicy({ ...base, rolloutState: "paused", forceUpdate: true }, "1.0.9", "1.0.9"))),
  { reason: "newer_available", critical: true },
  "forceUpdate should explicitly override pause",
);
assert.deepEqual(
  JSON.parse(JSON.stringify(evaluateApkUpdatePolicy({ ...base, rolloutState: "emergency" }, "1.0.9", "1.0.9"))),
  { reason: "newer_available", critical: true },
  "emergency rollout state should be critical",
);
assert.deepEqual(
  JSON.parse(JSON.stringify(evaluateApkUpdatePolicy({ ...base, rolloutState: "paused" }, "0.9.9", "1.0.9"))),
  { reason: "below_minimum", critical: true },
  "minimum support must remain enforced while rollout is paused",
);
assert.deepEqual(
  JSON.parse(JSON.stringify(evaluateApkUpdatePolicy(base, "1.0.9", "1.0.9"))),
  { reason: "newer_available", critical: false },
);
assert.deepEqual(
  JSON.parse(JSON.stringify(evaluateApkUpdatePolicy({ ...base, critical: true }, "1.0.9", "1.0.9"))),
  { reason: "newer_available", critical: true },
);
assert.deepEqual(
  JSON.parse(JSON.stringify(evaluateApkUpdatePolicy({ ...base, latestVersion: "1.0.9" }, "1.0.9", "1.0.9"))),
  { reason: "none", critical: false },
);
assert.deepEqual(
  JSON.parse(JSON.stringify(evaluateApkUpdatePolicy({ ...base, latestVersion: "1.0.9", runtimeVersion: "1.1.0", rolloutState: "emergency" }, "1.0.9", "1.0.9"))),
  { reason: "runtime_mismatch", critical: true },
  "emergency runtime mismatch should be critical",
);

assert.deepEqual(
  JSON.parse(JSON.stringify(evaluateApkUpdatePolicy({ ...base, latestVersion: "1.0.9", runtimeVersion: "1.1.0", forceUpdate: true }, "1.0.9", "1.0.9"))),
  { reason: "runtime_mismatch", critical: true },
  "forceUpdate must remain mandatory when the version matches but runtime does not",
);
assert.deepEqual(
  JSON.parse(JSON.stringify(evaluateApkUpdatePolicy({ ...base, latestVersion: "1.0.9", runtimeVersion: "1.1.0", critical: true }, "1.0.9", "1.0.9"))),
  { reason: "runtime_mismatch", critical: true },
  "critical manifest must remain critical for runtime mismatch",
);
assert.deepEqual(
  JSON.parse(JSON.stringify(evaluateApkUpdatePolicy({ ...base, latestVersion: "1.0.9", runtimeVersion: "1.1.0" }, "1.0.9", "1.0.9"))),
  { reason: "runtime_mismatch", critical: false },
  "ordinary runtime mismatch may still be postponed",
);
assert.deepEqual(
  JSON.parse(JSON.stringify(evaluateApkUpdatePolicy({ ...base, latestVersion: "1.0.9", minimumRuntimeVersion: "1.1.0", forceUpdate: true }, "1.0.9", "1.0.9"))),
  { reason: "runtime_mismatch", critical: true },
  "minimum runtime mismatch must honor forceUpdate",
);

console.log("test-apk-update-policy: ok (12 cases)");
