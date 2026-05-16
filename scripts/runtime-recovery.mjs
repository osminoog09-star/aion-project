/**
 * Autonomous recovery orchestrator — stale runtime, failed deploy, incompatible release.
 *
 *   node scripts/runtime-recovery.mjs
 *   node scripts/runtime-recovery.mjs --mode release
 *   node scripts/runtime-recovery.mjs --mode deploy
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv.includes("--mode")
  ? process.argv[process.argv.indexOf("--mode") + 1]
  : "runtime";

function semverGte(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false;
  }
  return true;
}

function appendEvent(type, summary) {
  const logPath = path.join(root, "src/content/runtime-event-log.json");
  let log = { version: "1.0", events: [] };
  try {
    log = JSON.parse(fs.readFileSync(logPath, "utf8"));
  } catch {
    /* new */
  }
  log.events = [
    {
      id: `evt-${Date.now()}`,
      at: new Date().toISOString(),
      type,
      summary,
    },
    ...(log.events ?? []),
  ].slice(0, 200);
  fs.writeFileSync(logPath, `${JSON.stringify(log, null, 2)}\n`, "utf8");
}

console.log(`\n[RECOVERY] mode=${mode}\n`);

if (mode === "release") {
  const req = JSON.parse(
    fs.readFileSync(path.join(root, "src/content/portal-runtime-requirements.json"), "utf8"),
  );
  const apk = JSON.parse(
    fs.readFileSync(path.join(root, "public/apk-manifest.preview.json"), "utf8"),
  );
  if (!semverGte(apk.runtimeVersion, req.minRuntimeVersion)) {
    appendEvent("compatibility_failed", `APK ${apk.runtimeVersion} < ${req.minRuntimeVersion} — rollout blocked`);
    execSync(
      'node scripts/execution-runtime.mjs --phase blocked --task "Release recovery: incompatible APK" --blocker "Keep previous runtime; build new APK" --skip-feed',
      { cwd: root, stdio: "inherit" },
    );
    console.log("[RECOVERY] Release blocked — previous portal runtime remains authoritative until manifest sync");
    process.exit(1);
  }
  console.log("[RECOVERY] Release compatibility OK");
  process.exit(0);
}

if (mode === "deploy") {
  appendEvent("deploy_failed", "Deploy recovery — marking degraded, rollback manual");
  execSync(
    'node scripts/execution-runtime.mjs --phase blocked --task "Deploy recovery" --blocker "Check Vercel deploy + post-deploy-validate" --failure-kind deploy --skip-feed',
    { cwd: root, stdio: "inherit" },
  );
  console.log("[RECOVERY] Run: npm run deploy:validate");
  process.exit(0);
}

// runtime (default)
appendEvent("stale_detected", "runtime-recovery.mjs started");
try {
  execSync("node scripts/execution-stale-recover.mjs", { cwd: root, stdio: "inherit" });
} catch {
  /* may exit early if not stale */
}

try {
  execSync("node scripts/execution-push-live.mjs", { cwd: root, stdio: "inherit" });
} catch {
  console.warn("[RECOVERY] push-live skipped (env)");
}

appendEvent("execution_resumed", "runtime recovery flow finished");
console.log("\n[RECOVERY] Runtime recovery complete.\n");
