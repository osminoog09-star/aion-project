import assert from "node:assert/strict";
import { compileTsModule } from "./lib/compileTsModule.mjs";

const { compareSemver, parseSemver, semverLess, semverLessOrEq } = compileTsModule(
  "src/core/updates/semverCompare.ts",
);

assert.equal(semverLess("1.0.9-beta", "1.0.9"), true, "prerelease must be below stable");
assert.equal(semverLess("1.0.9", "1.0.9-beta"), false, "stable must be above prerelease");
assert.equal(semverLess("1.0.9-beta.1", "1.0.9-beta.2"), true, "numeric identifiers must order");
assert.equal(semverLess("1.0.9-1", "1.0.9-alpha"), true, "numeric identifier must be below text");
assert.equal(compareSemver("1.0.9+build.1", "1.0.9+build.2"), 0, "build metadata must not affect order");
assert.equal(semverLessOrEq("1.0.9+build.1", "1.0.9+build.2"), true);
assert.equal(parseSemver("1.0"), null, "incomplete version must be rejected");
assert.equal(parseSemver("01.0.9"), null, "leading zero in core version must be rejected");
assert.equal(parseSemver("1.0.9-beta.01"), null, "leading zero in numeric prerelease must be rejected");
assert.equal(semverLess("2.0.0", "10.0.0"), true, "core versions must compare numerically");

console.log("test-semver-compare: ok (10 cases)");
