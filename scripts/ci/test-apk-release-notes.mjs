import assert from "node:assert/strict";
import { buildSyncedApkReleaseNotes } from "../lib/apk-release-notes.mjs";

const notes = buildSyncedApkReleaseNotes({
  appVersion: "1.0.9",
  buildNumber: "13",
  runtimeVersion: "1.0.9",
  buildId: "build-current",
  gitCommitHash: "commit-current",
});

assert.match(notes, /Preview APK 1\.0\.9 build 13/);
assert.match(notes, /Runtime 1\.0\.9/);
assert.match(notes, /build-current \(commit-current\)/);
assert.doesNotMatch(notes, /placeholder|плейсхолдер/i);
assert.doesNotMatch(notes, /Synced from EAS/i, "legacy append-only wording must not return");

const unknownCommit = buildSyncedApkReleaseNotes({
  appVersion: "1.0.9",
  buildNumber: "13",
  runtimeVersion: "1.0.9",
  buildId: "build-current",
});
assert.match(unknownCommit, /\(unknown\)\.$/);

console.log("test-apk-release-notes: ok (6 assertions)");
