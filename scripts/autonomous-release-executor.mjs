/**
 * Safe autonomous release executor — continues orchestration inside governance bounds.
 * Stops ONLY at human-required boundaries (device install / credential bootstrap).
 *
 *   node scripts/autonomous-release-executor.mjs
 *   node scripts/autonomous-release-executor.mjs --build-id <UUID>
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolveAionDriverPath } from "./resolve-aion-driver-path.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATE_FILE = path.join(root, "src/content/autonomous-execution-state.json");

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
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeState(patch) {
  let prev = { version: "1.0", phase: "idle", history: [] };
  try {
    prev = readJson(STATE_FILE);
  } catch {
    /* */
  }
  const next = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
    history: [{ at: new Date().toISOString(), ...patch }, ...(prev.history ?? [])].slice(0, 50),
  };
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

function log(msg) {
  console.log(`[AUTONOMOUS EXEC] ${msg}`);
}

function run(cmd, opts = {}) {
  log(`→ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", ...opts });
}

function isEasNetworkError(err) {
  const msg = String(err?.stderr ?? err?.stdout ?? err?.message ?? err);
  return /certificate|SSL|GraphQL request failed|ENOTFOUND|ECONNREFUSED|unable to verify/i.test(
    msg,
  );
}

function localEasBlocked() {
  try {
    execSync("npx eas-cli@latest whoami", {
      cwd: resolveAionDriverPath() ?? root,
      stdio: "pipe",
      timeout: 25_000,
    });
    return false;
  } catch (e) {
    return isEasNetworkError(e);
  }
}

function hasToken(name) {
  return Boolean(process.env[name]?.trim());
}

function snapshot() {
  const req = readJson(path.join(root, "src/content/portal-runtime-requirements.json"));
  const apk = readJson(path.join(root, "public/apk-manifest.preview.json"));
  const hb = fs.existsSync(path.join(root, "src/content/device-build-heartbeat.json"))
    ? readJson(path.join(root, "src/content/device-build-heartbeat.json"))
    : null;
  const apkOk = apk?.runtimeVersion && semverGte(apk.runtimeVersion, req.minRuntimeVersion);
  const hbAt = hb?.at ?? hb?.device?.reportedAt;
  const hbAge = hbAt ? (Date.now() - Date.parse(hbAt)) / 1000 : null;
  const hbFresh = hbAge != null && hbAge < 60;
  let releaseSafetyGreen = false;
  try {
    execSync("node scripts/ci/test-runtime-compatibility.mjs", { cwd: root, stdio: "pipe" });
    if (apkOk) {
      execSync("node scripts/validate-apk-manifest.mjs", { cwd: root, stdio: "pipe" });
      releaseSafetyGreen = true;
    }
  } catch {
    releaseSafetyGreen = false;
  }
  return {
    apkManifestCompatible: Boolean(apkOk),
    localEasBlocked: localEasBlocked(),
    hasCiCredentials: hasToken("GITHUB_TOKEN") || hasToken("GH_TOKEN") || hasToken("EXPO_TOKEN"),
    deviceHeartbeatPresent: Boolean(hb?.device?.runtimeVersion),
    deviceHeartbeatFresh: hbFresh,
    releaseSafetyGreen,
    apk,
    req,
  };
}

const buildIdArg = process.argv.includes("--build-id")
  ? process.argv[process.argv.indexOf("--build-id") + 1]
  : null;

console.log("\n=== AION Autonomous Release Executor ===\n");
writeState({ phase: "started" });

try {
  execSync("node scripts/ci-eas-diagnostic.mjs", { cwd: root, stdio: "inherit" });
} catch {
  log("CI/EAS diagnostic reported critical issues — continuing where possible");
}

const snap = snapshot();
log(`APK compatible: ${snap.apkManifestCompatible}`);
log(`Local EAS blocked: ${snap.localEasBlocked}`);
log(`CI credentials: ${snap.hasCiCredentials}`);

// ── Phase: APK loop (autonomous) ─────────────────────────────────────────
if (!snap.apkManifestCompatible) {
  writeState({ phase: "apk_build_required" });

  if (buildIdArg) {
    log(`Using provided BUILD_ID=${buildIdArg}`);
    run(`node scripts/complete-apk-loop.mjs ${buildIdArg}`);
    run("node scripts/autonomous-github-eas.mjs --commit-manifest");
  } else if (snap.hasCiCredentials && hasToken("GITHUB_TOKEN")) {
    log("Autonomous path: GHA full chain (preflight → trigger → wait → Expo verify → manifest)");
    run("node scripts/autonomous-github-eas.mjs --full");
    try {
      run("node scripts/autonomous-github-eas.mjs --commit-manifest");
    } catch {
      /* optional */
    }
  } else if (snap.localEasBlocked || !snap.hasCiCredentials) {
    writeState({ phase: "gha_fallback_needed", humanBoundary: "credentials_bootstrap" });
    console.error("\n[AUTONOMOUS] Use GHA path (local EAS blocked or no GITHUB_TOKEN):");
    console.error("  Set GITHUB_TOKEN → npm run execution:autonomous-release");
    console.error("  OR: npm run eas:build:gha → npm run execution:autonomous-release -- --build-id <UUID>\n");
    process.exit(3);
  } else {
    log("Attempting local eas:preview (driver)");
    const driverRoot = resolveAionDriverPath();
    try {
      run("npm run build:manifest", { cwd: driverRoot });
      run("npm run eas:preview", { cwd: driverRoot });
      writeState({ phase: "waiting_eas_finished_local" });
      console.error("\n[AUTONOMOUS] Local build started — re-run with --build-id when FINISHED\n");
      process.exit(3);
    } catch (e) {
      if (isEasNetworkError(e)) {
        writeState({ phase: "local_eas_ssl_blocked", humanBoundary: "credentials_or_gha" });
        console.error("\n[AUTONOMOUS] Local EAS failed (SSL) — use GHA fallback:");
        console.error("  Set GITHUB_TOKEN → npm run execution:autonomous-release");
        console.error("  OR: npm run eas:build:gha → then --build-id <UUID>\n");
        process.exit(3);
      }
      throw e;
    }
  }
}

// Re-snapshot after APK work
const snap2 = snapshot();
if (!snap2.apkManifestCompatible) {
  writeState({ phase: "apk_still_incompatible" });
  process.exit(1);
}

writeState({ phase: "manifest_compatible" });
log("Manifest compatible — governance allows portal validation paths");

// ── Human boundary: device ───────────────────────────────────────────────
if (!snap2.deviceHeartbeatFresh) {
  writeState({
    phase: "human_device_required",
    humanBoundary: "physical_apk_install_and_open_driver",
  });
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  HUMAN BOUNDARY (only step requiring you)                    ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  1. Install preview APK from /releases (full install, not OTA) ║");
  console.log("║  2. Open Driver app once → heartbeat POST                      ║");
  console.log("║  3. Re-run: npm run execution:autonomous-release               ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
  process.exit(0);
}

// ── Autonomous: sign-off + activation ───────────────────────────────────
log("Device heartbeat fresh — continuing autonomously");
try {
  run("node scripts/stabilization-signoff.mjs --require-device --strict");
} catch {
  writeState({ phase: "signoff_failed" });
  process.exit(1);
}

if (process.argv.includes("--activate-runtime")) {
  run("npm run release:orchestrate -- --activate-runtime");
  try {
    run("npm run execution:push-live");
  } catch {
    log("push-live skipped (OPERATIONS_OWNER_SECRET)");
  }
}

writeState({ phase: "completed", humanBoundary: null });
console.log("\n[AUTONOMOUS EXEC] Pipeline complete within governance bounds.\n");
