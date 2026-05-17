/**
 * Final stabilization sign-off — checks operational loop closure.
 *
 *   node scripts/stabilization-signoff.mjs
 *   node scripts/stabilization-signoff.mjs --strict   # exit 1 if any blocker
 *   node scripts/stabilization-signoff.mjs --require-device
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolveAionDriverPath } from "./resolve-aion-driver-path.mjs";
import { resolveDeviceHeartbeatRemote } from "./resolve-device-heartbeat-remote.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");
const requireDevice = process.argv.includes("--require-device");
const OUT = path.join(root, "src/content/stabilization-signoff-status.json");

function semverGte(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false;
  }
  return true;
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

/** @type {{ id: string, category: string, status: 'pass'|'fail'|'warn'|'blocked', detail: string }[]} */
const checks = [];

function add(id, category, status, detail) {
  checks.push({ id, category, status, detail });
  const tag = status.toUpperCase().padEnd(7);
  console.log(`  [${tag}] ${id}: ${detail}`);
}

async function main() {
console.log("\n=== AION Stabilization Sign-Off ===\n");

// --- Phase A: APK manifest ---
const req = readJson(path.join(root, "src/content/portal-runtime-requirements.json"));
const apk = readJson(path.join(root, "public/apk-manifest.preview.json"));
const driverRoot = resolveAionDriverPath();
const driverManifest = driverRoot
  ? readJson(path.join(driverRoot, "build-manifest.json"))
  : null;

if (!req) add("A-req", "compatibility", "fail", "portal-runtime-requirements.json missing");
else if (!apk?.runtimeVersion)
  add("A-apk-runtime", "compatibility", "blocked", "apk-manifest.preview.json has no runtimeVersion");
else if (!semverGte(apk.runtimeVersion, req.minRuntimeVersion))
  add(
    "A-apk-runtime",
    "compatibility",
    "blocked",
    `APK manifest ${apk.runtimeVersion} < required ${req.minRuntimeVersion} — run EAS preview + sync`,
  );
else
  add("A-apk-runtime", "compatibility", "pass", `manifest ${apk.runtimeVersion} >= ${req.minRuntimeVersion}`);

const vc = Number.parseInt(String(apk?.buildNumber ?? "0"), 10);
if (req?.minVersionCode && vc < req.minVersionCode)
  add("A-version-code", "compatibility", "blocked", `buildNumber ${vc} < min ${req.minVersionCode}`);
else if (req?.minVersionCode)
  add("A-version-code", "compatibility", "pass", `versionCode ${vc} >= ${req.minVersionCode}`);

if (apk?.apkUrl && /^https:\/\//i.test(apk.apkUrl) && !apk.apkUrl.includes("example.com"))
  add("A-apk-url", "compatibility", "pass", "real apkUrl from EAS");
else add("A-apk-url", "compatibility", "blocked", "apkUrl missing or placeholder — sync from FINISHED EAS build");

if (driverManifest?.runtimeVersion && apk?.runtimeVersion) {
  if (semverGte(driverManifest.runtimeVersion, apk.runtimeVersion))
    add("A-driver-source", "compatibility", "pass", `driver tree ${driverManifest.runtimeVersion}`);
  else
    add("A-driver-source", "compatibility", "warn", `driver ${driverManifest.runtimeVersion} ahead of published APK`);
}

// --- Phase B: device heartbeat (local → Supabase → production) ---
const hbRemote = await resolveDeviceHeartbeatRemote();
const hb = hbRemote ?? readJson(path.join(root, "src/content/device-build-heartbeat.json"));
if (hbRemote?.source && hbRemote.source !== "local") {
  add("B-heartbeat-source", "device", "pass", `heartbeat from ${hbRemote.source}`);
}
const hbAt = hb?.at ?? hb?.device?.reportedAt ?? null;
const hbAgeSec = hbAt ? Math.round((Date.now() - Date.parse(hbAt)) / 1000) : null;
const device = hb?.device ?? null;

if (!device?.runtimeVersion)
  add(
    "B-heartbeat",
    "device",
    requireDevice ? "blocked" : "warn",
    "no device heartbeat — install APK 1.0.6, open Driver 30s",
  );
else {
  add(
    "B-heartbeat",
    "device",
    "pass",
    `device ${device.appVersion} rv ${device.runtimeVersion} (vc ${device.versionCode ?? "?"})`,
  );
  if (hbAgeSec != null && hbAgeSec > 300)
    add("B-heartbeat-fresh", "device", requireDevice ? "blocked" : "warn", `heartbeat stale ${hbAgeSec}s`);
  else if (hbAgeSec != null)
    add("B-heartbeat-fresh", "device", "pass", `heartbeat ${hbAgeSec}s ago`);
}

if (device && req) {
  const missingF = (req.requiredFeatures ?? []).filter((f) => !(device.features ?? []).includes(f));
  const missingR = (req.requiredRoutes ?? []).filter((r) => !(device.routes ?? []).includes(r));
  if (missingF.length || missingR.length)
    add(
      "B-device-compat",
      "device",
      "blocked",
      `missing features=${missingF.join(",")} routes=${missingR.join(",")}`,
    );
  else if (semverGte(device.runtimeVersion, req.minRuntimeVersion))
    add("B-device-compat", "device", "pass", `device ${device.runtimeVersion} compatible`);
  else
    add("B-device-compat", "device", "blocked", `device ${device.runtimeVersion} < ${req.minRuntimeVersion}`);
}

// --- Phase C/D: release safety + runtime ---
try {
  execSync("node scripts/ci/test-runtime-compatibility.mjs", { cwd: root, stdio: "pipe" });
  add("D-compat-tests", "release", "pass", "runtime-compatibility tests OK");
} catch {
  add("D-compat-tests", "release", "fail", "test-runtime-compatibility failed");
}

try {
  execSync("node scripts/release-safety-pipeline.mjs", { cwd: root, stdio: "pipe" });
  add("D-release-safety", "release", "pass", "release:safety pipeline green");
} catch (e) {
  add("D-release-safety", "release", "blocked", "release:safety failed (APK/manifest gate)");
}

const runtime = readJson(path.join(root, "src/content/execution-runtime.json"))?.runtime;
const rtAge = runtime?.heartbeatAt
  ? Math.round((Date.now() - Date.parse(runtime.heartbeatAt)) / 1000)
  : null;
if (rtAge != null && rtAge < 120)
  add("D-runtime-hb", "runtime", "pass", `execution-runtime heartbeat ${rtAge}s`);
else
  add("D-runtime-hb", "runtime", "warn", `execution-runtime heartbeat ${rtAge ?? "n/a"}s`);

const safeModeExpected =
  apk?.runtimeVersion && req && !semverGte(apk.runtimeVersion, req.minRuntimeVersion);
if (safeModeExpected)
  add("D-safe-mode", "governance", "pass", "SAFE MODE correctly expected until APK 1.0.6+");
else if (device && req) {
  const ok =
    semverGte(device.runtimeVersion, req.minRuntimeVersion) &&
    !(req.requiredFeatures ?? []).some((f) => !(device.features ?? []).includes(f));
  add("D-safe-mode", "governance", ok ? "pass" : "blocked", ok ? "SAFE MODE can be off" : "SAFE MODE should stay on");
}

// Recovery scripts present
for (const s of ["runtime-recovery.mjs", "execution-stale-recover.mjs", "release-orchestrator.mjs"]) {
  const p = path.join(root, "scripts", s);
  add(`E-recovery-${s}`, "recovery", fs.existsSync(p) ? "pass" : "fail", fs.existsSync(p) ? "present" : "missing");
}

const blocked = checks.filter((c) => c.status === "blocked" || c.status === "fail");
const passed = checks.filter((c) => c.status === "pass");
const signedOff = blocked.length === 0 && passed.some((c) => c.id === "A-apk-runtime" && c.status === "pass");

const report = {
  version: "1.0",
  at: new Date().toISOString(),
  signedOff,
  summary: signedOff
    ? "STABILIZATION SIGNED OFF"
    : `BLOCKED — ${blocked.length} blocker(s), complete Phases A–B on device`,
  checks,
  nextSteps: [],
};

if (!semverGte(apk?.runtimeVersion ?? "0", req?.minRuntimeVersion ?? "9")) {
  report.nextSteps.push("PRIMARY: GitHub Actions → EAS Build Android (preview) — see docs/EAS_PREVIEW_BUILD_GHA.md");
  report.nextSteps.push("npm run eas:build:gha  # print GHA instructions (do NOT use local eas if SSL fails)");
  report.nextSteps.push("Wait EAS FINISHED → aion-com: npm run release:apk-manifest:sync <BUILD_ID>");
  report.nextSteps.push("Install APK on device (not OTA) → open Driver → heartbeat");
  report.nextSteps.push("npm run release:orchestrate -- --activate-runtime");
}
if (!device?.runtimeVersion) {
  report.nextSteps.push("Physical device: install preview APK ≥1.0.6, open app once");
}
report.nextSteps.push("npm run stabilization:signoff -- --strict");

fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`\n---\nSigned off: ${signedOff ? "YES" : "NO"}`);
console.log(`Report: ${OUT}\n`);
if (report.nextSteps.length) {
  console.log("Next steps:");
  for (const s of report.nextSteps) console.log(`  • ${s}`);
  console.log("");
}

if (strict && !signedOff) process.exit(1);
process.exit(signedOff ? 0 : 2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
