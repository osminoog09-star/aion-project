import assert from "node:assert/strict";
import { requiresDriverApkBuild } from "../lib/driver-apk-build-paths.mjs";

assert.equal(requiresDriverApkBuild(["aion-driver/app.config.ts"]), true);
assert.equal(requiresDriverApkBuild(["aion-driver/package.json"]), true);
assert.equal(requiresDriverApkBuild(["aion-driver/native-modules/orb/OrbView.kt"]), true);
assert.equal(requiresDriverApkBuild(["aion-driver/plugins/withOrb.js"]), true);
assert.equal(requiresDriverApkBuild(["aion-driver/src/core/updates/fetchApkManifest.ts"]), false);
assert.equal(requiresDriverApkBuild(["scripts/sync-apk-manifest-from-eas.mjs"]), false);
assert.equal(requiresDriverApkBuild(["src/content/codex-work-status.json"]), false);

console.log("test-driver-apk-build-paths: ok (7 cases)");
