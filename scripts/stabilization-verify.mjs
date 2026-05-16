/**
 * Stabilization phase verification — run before declaring runtime trustworthy.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

console.log("\n[STABILIZATION] Audit doc present");
const audit = path.join(root, "docs/system-audit-report.md");
if (!fs.existsSync(audit)) {
  console.error("Missing docs/system-audit-report.md");
  process.exit(1);
}

const checks = [
  "node scripts/ci/test-runtime-compatibility.mjs",
  "node scripts/ci/test-field-validation-report-parse.mjs",
];

for (const cmd of checks) {
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

console.log("\n[STABILIZATION] Build (includes repo:verify)");
execSync("npm run build", { cwd: root, stdio: "inherit" });

const req = JSON.parse(
  fs.readFileSync(path.join(root, "src/content/portal-runtime-requirements.json"), "utf8"),
);
const apk = JSON.parse(fs.readFileSync(path.join(root, "public/apk-manifest.preview.json"), "utf8"));

function semverGte(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false;
  }
  return true;
}

if (!semverGte(apk.runtimeVersion, req.minRuntimeVersion)) {
  console.warn(
    `\n[WARN] APK manifest ${apk.runtimeVersion} < required ${req.minRuntimeVersion} — SAFE MODE expected until new build.\n`,
  );
} else {
  console.log(`[STABILIZATION] APK manifest OK (${apk.runtimeVersion})`);
}

console.log("\n[STABILIZATION] Verify complete.\n");
