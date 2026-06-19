import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const semver = compileTsModule("src/core/updates/semverCompare.ts");
const { isApkManifest } = compileTsModule("src/core/updates/apkManifest.types.ts", {
  "./semverCompare": semver,
});

const valid = {
  latestVersion: "1.0.9",
  minimumSupported: "1.0.6",
  apkUrl: "https://example.com/aion-driver.apk",
};

assert.equal(isApkManifest(valid), true, "valid release manifest should pass");
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
  isApkManifest({ ...valid, fallbackApkUrl: "javascript:alert(1)" }),
  false,
  "unsafe fallback URL must be rejected",
);

console.log("test-apk-manifest-validation: ok (7 cases)");
