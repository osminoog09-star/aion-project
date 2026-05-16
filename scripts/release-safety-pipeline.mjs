/**
 * Mandatory release safety gate before runtime activation / portal deploy.
 *   node scripts/release-safety-pipeline.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

console.log("\n[1/6] Portal build + repo verify");
execSync("npm run build", { cwd: root, stdio: "inherit" });

console.log("\n[2/6] Runtime compatibility tests");
execSync("node scripts/ci/test-runtime-compatibility.mjs", { cwd: root, stdio: "inherit" });

const req = readJson(path.join(root, "src/content/portal-runtime-requirements.json"));
const apk = readJson(path.join(root, "public/apk-manifest.preview.json"));

console.log("\n[3/6] APK manifest vs portal requirements");
if (!apk.runtimeVersion) {
  console.error("FAIL: apk-manifest.preview.json missing runtimeVersion");
  process.exit(1);
}

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
  console.error(
    `FAIL: APK manifest runtime ${apk.runtimeVersion} < required ${req.minRuntimeVersion}`,
  );
  console.error("→ Run EAS preview build + npm run release:apk-manifest:sync <buildId>");
  process.exit(1);
}

console.log(`OK: manifest ${apk.runtimeVersion} >= ${req.minRuntimeVersion}`);

const driverManifest = path.join(root, "../aion-driver/build-manifest.json");
if (fs.existsSync(driverManifest)) {
  const dm = readJson(driverManifest);
  console.log("\n[4/6] Driver build-manifest");
  if (!semverGte(dm.runtimeVersion, req.minRuntimeVersion)) {
    console.error(`FAIL: driver source ${dm.runtimeVersion} < ${req.minRuntimeVersion}`);
    process.exit(1);
  }
  console.log(`OK: driver tree ${dm.runtimeVersion}`);
} else {
  console.warn("[4/6] Skip — aion-driver/build-manifest.json not found");
}

console.log("\n[5/6] Release safety — manifest gate already enforced in step 3");

console.log("\n[6/6] Stamp runtime — only if gates passed");
execSync(
  'node scripts/execution-runtime.mjs --phase coding --task "Release safety gates passed" --progress-pct 99 --skip-feed',
  { cwd: root, stdio: "inherit" },
);

console.log("\n[RELEASE SAFETY] All gates passed.\n");
