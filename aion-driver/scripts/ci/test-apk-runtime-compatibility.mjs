import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const semver = compileTsModule("src/core/updates/semverCompare.ts");
const { isRuntimeBelowMinimum } = compileTsModule(
  "src/core/updates/runtimeCompatibility.ts",
  { "./semverCompare": semver },
);

assert.equal(isRuntimeBelowMinimum("1.0.10", "1.0.9"), false, "newer semver runtime should satisfy minimum");
assert.equal(isRuntimeBelowMinimum("1.0.9", "1.0.9"), false, "equal semver runtime should satisfy minimum");
assert.equal(isRuntimeBelowMinimum("1.0.8", "1.0.9"), true, "older semver runtime should fail minimum");
assert.equal(isRuntimeBelowMinimum("runtime-hash", "runtime-hash"), false, "equal opaque runtime should pass");
assert.equal(isRuntimeBelowMinimum("runtime-old", "runtime-new"), true, "different opaque runtime should fail safely");
assert.equal(isRuntimeBelowMinimum(" 1.0.10 ", "1.0.9"), false, "runtime comparison should trim values");

console.log("test-apk-runtime-compatibility: ok (6 cases)");
