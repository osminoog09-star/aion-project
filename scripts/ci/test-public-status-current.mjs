import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const json = (file) => JSON.parse(readFileSync(file, "utf8"));
const manifest = json("public/apk-manifest.preview.json");
const work = json("src/content/codex-work-status.json");
const releases = json("src/content/releases.json");
const roadmap = json("src/content/roadmap-execution.json");
const ecosystem = json("src/content/ecosystem-status.json");

assert.match(work.latestRun.label, new RegExp(`build ${manifest.buildNumber}$`));
assert.equal(work.latestRun.url, manifest.apkUrl);
assert.equal(releases.apk.latestKnownVersion, manifest.latestVersion);
assert.match(releases.channels.find((item) => item.id === "preview")?.notes ?? "", /build 14/);
assert.doesNotMatch(roadmap.executionQueue.nextImplementationTarget, /device smoke|8\/8/i);
assert.doesNotMatch(ecosystem.execution.nextPriority, /device smoke|8\/8/i);

for (const file of [
  "src/app/operations/live/page.tsx",
  "src/app/operations/validation/page.tsx",
  "src/app/operations/blockers/page.tsx",
]) {
  const source = readFileSync(file, "utf8");
  assert.doesNotMatch(source, /DriverFieldValidationOwnerGuide|OwnerFieldValidationReportPanel/);
}

console.log("public status: OK (manifest-aligned, retired owner gate hidden)");
