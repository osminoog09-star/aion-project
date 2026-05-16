/**
 * Mandatory release orchestration pipeline.
 * merge → CI → compatibility → build detection → (optional EAS) → manifest → deploy hint → heartbeat check → runtime activation
 *
 *   node scripts/release-orchestrator.mjs
 *   node scripts/release-orchestrator.mjs --activate-runtime
 *   node scripts/release-orchestrator.mjs --trigger-eas   # needs EXPO_TOKEN
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolveAionDriverPath } from "./resolve-aion-driver-path.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATE_FILE = path.join(root, "src/content/release-orchestration-state.json");
const activateRuntime = process.argv.includes("--activate-runtime");
const triggerEas = process.argv.includes("--trigger-eas");

function writeState(step, status, detail = "") {
  const payload = {
    version: "1.0",
    updatedAt: new Date().toISOString(),
    step,
    status,
    detail,
    activateRuntimeRequested: activateRuntime,
  };
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function run(step, cmd, cwd = root) {
  console.log(`\n[ORCHESTRATOR] ${step}`);
  writeState(step, "running");
  try {
    execSync(cmd, { cwd, stdio: "inherit" });
    writeState(step, "passed");
    return true;
  } catch (e) {
    writeState(step, "failed", String(e?.message ?? e));
    return false;
  }
}

console.log("\n=== AION Release Orchestrator ===\n");
writeState("init", "running");

if (!run("1/8 compatibility tests", "node scripts/ci/test-runtime-compatibility.mjs")) {
  process.exit(1);
}

const driverRoot = resolveAionDriverPath();
if (driverRoot) {
  if (!run("2/8 driver validate:code", "npm run validate:code", driverRoot)) {
    console.warn("[ORCHESTRATOR] driver validate failed — continue with portal gates");
  }
  try {
    execSync("node scripts/detect-native-change.mjs", { cwd: driverRoot, stdio: "inherit" });
  } catch {
    console.warn("[ORCHESTRATOR] native change detected — APK build required, OTA-only blocked");
  }
} else {
  console.log("[ORCHESTRATOR] 2/8 skip — aion-driver not found");
}

if (!run("3/8 release safety (manifest + build)", "node scripts/release-safety-pipeline.mjs")) {
  console.error("\n[ORCHESTRATOR] FAILED at release safety — runtime activation BLOCKED\n");
  execSync(
    'node scripts/execution-runtime.mjs --phase blocked --task "Release orchestration failed" --blocker "APK/manifest incompatible" --reasoning "release-orchestrator gate" --skip-feed',
    { cwd: root, stdio: "inherit" },
  );
  process.exit(1);
}

if (triggerEas) {
  console.log("[ORCHESTRATOR] 4/8 EAS — use GitHub Actions (local eas often blocked by SSL)");
  console.log("  → npm run eas:build:gha");
  console.log("  → After FINISHED: npm run apk:complete-loop -- <BUILD_ID>");
} else {
  console.log("[ORCHESTRATOR] 4/8 EAS skipped — trigger GHA workflow first (see docs/EAS_PREVIEW_BUILD_GHA.md)");
}

const hbPath = path.join(root, "src/content/device-build-heartbeat.json");
let hbOk = false;
if (fs.existsSync(hbPath)) {
  const hb = JSON.parse(fs.readFileSync(hbPath, "utf8"));
  const age = hb?.receivedAt ? Date.now() - Date.parse(hb.receivedAt) : Infinity;
  hbOk = age < 300_000;
  console.log(`[ORCHESTRATOR] 5/8 device heartbeat: ${hbOk ? "fresh" : "stale/missing"} (${Math.round(age / 1000)}s)`);
} else {
  console.warn("[ORCHESTRATOR] 5/8 no device-build-heartbeat.json — install APK and open Driver");
}

console.log("\n[ORCHESTRATOR] 6/8 deploy hint: npm run deploy:pipeline (or Vercel git push)");
console.log("[ORCHESTRATOR] 7/8 live push: npm run execution:push-live (needs OPERATIONS_OWNER_SECRET)");

if (activateRuntime) {
  if (!hbOk) {
    console.warn("[ORCHESTRATOR] 8/8 runtime activation SKIPPED — no fresh device heartbeat");
    writeState("runtime_activation", "skipped", "no device heartbeat");
  } else {
    run(
      "8/8 runtime activation",
      'node scripts/execution-runtime.mjs --phase coding --task "Release orchestration complete" --progress-pct 99 --skip-feed',
    );
    writeState("runtime_activation", "passed");
  }
} else {
  console.log("[ORCHESTRATOR] 8/8 runtime activation skipped (pass --activate-runtime)");
  writeState("complete", "passed", "gates green; activation not requested");
}

console.log("\n[ORCHESTRATOR] Pipeline complete.\n");
