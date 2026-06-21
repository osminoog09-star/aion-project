import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const semver = compileTsModule("src/core/updates/semverCompare.ts");
const { isApkManifest } = compileTsModule(
  "src/core/updates/apkManifest.types.ts",
  { "./semverCompare": semver },
  { URL },
);

const valid = {
  latestVersion: "1.0.9",
  minimumSupported: "1.0.6",
  apkUrl: "https://example.com/aion-driver.apk",
};

const validExtended = {
  ...valid,
  runtimeVersion: "1.0.9",
  buildNumber: "13",
  critical: false,
  forceUpdate: false,
  emergency: false,
  rolloutState: "full",
  releaseDate: "2026-06-20T00:00:00.000Z",
  changelog: ["Update Center hardening"],
};

assert.equal(isApkManifest(valid), true, "valid release manifest should pass");
assert.equal(isApkManifest(validExtended), true, "valid optional release fields should pass");
assert.equal(
  isApkManifest({ ...valid, fallbackApkUrl: "https://cdn.example.com/aion-driver.apk" }),
  true,
  "valid fallback URL should pass",
);
assert.equal(
  isApkManifest({ ...valid, latestVersion: "1.0" }),
  false,
  "malformed latestVersion must be rejected",
);
assert.equal(
  isApkManifest({ ...valid, minimumSupported: "latest" }),
  false,
  "malformed minimumSupported must be rejected",
);
assert.equal(
  isApkManifest({ ...valid, latestVersion: "1.0.8", minimumSupported: "1.0.9" }),
  false,
  "minimumSupported above latestVersion must be rejected",
);
assert.equal(
  isApkManifest({ ...valid, apkUrl: "file:///tmp/aion-driver.apk" }),
  false,
  "non-HTTP APK URL must be rejected",
);
assert.equal(
  isApkManifest({ ...valid, latestVersion: " 1.0.9" }),
  false,
  "padded latestVersion must be rejected at the manifest boundary",
);
assert.equal(
  isApkManifest({ ...valid, minimumSupported: "1.0.6 " }),
  false,
  "padded minimumSupported must be rejected at the manifest boundary",
);
assert.equal(
  isApkManifest({ ...valid, apkUrl: "http://example.com/aion-driver.apk" }),
  false,
  "cleartext HTTP APK URL must be rejected",
);
assert.equal(
  isApkManifest({ ...valid, fallbackApkUrl: "http://example.com/aion-driver.apk" }),
  false,
  "cleartext HTTP fallback URL must be rejected",
);
assert.equal(
  isApkManifest({ ...valid, fallbackApkUrl: "javascript:alert(1)" }),
  false,
  "unsafe fallback URL must be rejected",
);
assert.equal(isApkManifest({ ...valid, apkUrl: "https://" }), false, "HTTPS URL without host must be rejected");
assert.equal(
  isApkManifest({ ...valid, apkUrl: "https://user:secret@example.com/aion.apk" }),
  false,
  "credential-bearing APK URL must be rejected",
);
assert.equal(
  isApkManifest({ ...valid, apkUrl: " https://example.com/aion.apk" }),
  false,
  "APK URL with external whitespace must be rejected",
);
assert.equal(isApkManifest({ ...valid, forceUpdate: "false" }), false, "string forceUpdate must be rejected");
assert.equal(isApkManifest({ ...valid, critical: "false" }), false, "string critical flag must be rejected");
assert.equal(isApkManifest({ ...valid, emergency: 1 }), false, "numeric emergency flag must be rejected");
assert.equal(isApkManifest({ ...valid, rolloutState: "rolling" }), false, "unknown rollout state must be rejected");
assert.equal(isApkManifest({ ...valid, runtimeVersion: 109 }), false, "numeric runtime version must be rejected");
assert.equal(isApkManifest({ ...valid, runtimeVersion: " 1.0.9 " }), false, "padded runtime version must be rejected");
assert.equal(isApkManifest({ ...valid, minimumRuntimeVersion: "" }), false, "empty minimum runtime must be rejected");
assert.equal(isApkManifest({ ...valid, buildNumber: " " }), false, "blank build number must be rejected");
assert.equal(isApkManifest({ ...valid, easBuildId: " build-id" }), false, "padded EAS build id must be rejected");
assert.equal(isApkManifest({ ...valid, releaseDate: "tomorrow" }), false, "invalid release date must be rejected");
assert.equal(isApkManifest({ ...valid, releaseDate: "2026-06-20" }), false, "date-only release date must be rejected");
assert.equal(
  isApkManifest({ ...valid, releaseDate: "2026-06-20T03:00:00+03:00" }),
  false,
  "non-canonical timezone offset must be rejected",
);
assert.equal(
  isApkManifest({ ...valid, releaseDate: "2026-02-30T00:00:00.000Z" }),
  false,
  "normalized impossible release date must be rejected",
);
assert.equal(isApkManifest({ ...valid, changelog: ["ok", 7] }), false, "non-string changelog item must be rejected");
assert.equal(isApkManifest({ ...valid, changelog: [""] }), false, "empty changelog item must be rejected");
assert.equal(isApkManifest({ ...valid, changelog: ["   "] }), false, "blank changelog item must be rejected");
assert.equal(isApkManifest({ ...valid, changelog: [" padded"] }), false, "padded changelog item must be rejected");

console.log("test-apk-manifest-validation: ok (32 cases)");

await import("./test-apk-manifest-cache.mjs");
await import("./test-apk-runtime-compatibility.mjs");
await import("./test-apk-download-open.mjs");
await import("./test-semver-compare.mjs");
await import("./test-apk-update-policy.mjs");
await import("./test-apk-verdict.mjs");
await import("./test-update-system-state.mjs");
