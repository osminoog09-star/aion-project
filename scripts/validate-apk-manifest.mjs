/**
 * Post-sync manifest validation (Phase 1 gate).
 *   node scripts/validate-apk-manifest.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "public/apk-manifest.preview.json");
const reqPath = path.join(root, "src/content/portal-runtime-requirements.json");

function semverGte(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false;
  }
  return true;
}

const apk = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const req = JSON.parse(fs.readFileSync(reqPath, "utf8"));
let ok = true;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  ok = false;
}

function pass(msg) {
  console.log(`OK: ${msg}`);
}

if (!apk.runtimeVersion) fail("missing runtimeVersion");
else if (!semverGte(apk.runtimeVersion, req.minRuntimeVersion))
  fail(`runtimeVersion ${apk.runtimeVersion} < ${req.minRuntimeVersion}`);
else pass(`runtimeVersion ${apk.runtimeVersion} >= ${req.minRuntimeVersion}`);

const vc = Number.parseInt(String(apk.buildNumber ?? "0"), 10);
if (req.minVersionCode && vc < req.minVersionCode)
  fail(`buildNumber ${vc} < minVersionCode ${req.minVersionCode}`);
else pass(`versionCode ${vc} >= ${req.minVersionCode}`);

if (!apk.apkUrl || !/^https:\/\//i.test(apk.apkUrl) || /example\.com/i.test(apk.apkUrl))
  fail("apkUrl missing or placeholder");
else pass(`apkUrl ${apk.apkUrl.slice(0, 60)}…`);

if (apk.compatibilityStatus !== "compatible_with_portal_runtime")
  fail(`compatibilityStatus=${apk.compatibilityStatus ?? "unset"}`);
else pass("compatibilityStatus compatible");

if (req.requiredFeatures?.length) {
  const have = new Set(apk.supportedFeatures ?? []);
  const missing = req.requiredFeatures.filter((f) => !have.has(f));
  if (missing.length) fail(`supportedFeatures missing: ${missing.join(", ")}`);
  else pass("required features present in manifest");
}

if (!ok) process.exit(1);
console.log("\n[MANIFEST] All checks passed.\n");
