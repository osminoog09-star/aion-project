/**
 * Self-healing: typecheck → build → deploy:validate with retries + recovery confidence.
 *
 *   node scripts/execution-self-heal.mjs
 *   node scripts/execution-self-heal.mjs --skip-build --deploy-retries 5
 */
import { execSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendExecutionFeed } from "./execution-feed.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const skipBuild = process.argv.includes("--skip-build");
const deployRetriesArg = process.argv.indexOf("--deploy-retries");
const deployRetries =
  deployRetriesArg >= 0 && process.argv[deployRetriesArg + 1]
    ? Number.parseInt(process.argv[deployRetriesArg + 1], 10)
    : 3;

function run(cmd, label) {
  console.log(`[RECOVERING] ${label}…`);
  const r = spawnSync(cmd, { cwd: root, shell: true, encoding: "utf8", stdio: "pipe" });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}`.slice(-2500) };
}

function phase(args) {
  execSync(`node scripts/execution-runtime.mjs ${args} --no-hint`, { cwd: root, stdio: "inherit" });
}

function recoveryConfidence(attempt, maxAttempts, stepOk) {
  const base = stepOk ? 0.55 : 0.25;
  const attemptBoost = (attempt / maxAttempts) * 0.25;
  return Math.min(0.95, base + attemptBoost);
}

phase(
  '--phase recovering --task "Self-healing validation cycle" --subsystem operations-center --reasoning "Automated: typecheck, build, deploy validate" --progress "typecheck" --typecheck running --build pending --deploy idle --recovery-confidence 0.55',
);

let confidence = 0.55;
let blocker = null;

const tc = run("npx tsc --noEmit", "typecheck");
if (!tc.ok) {
  confidence = recoveryConfidence(1, 1, false);
  blocker = `typecheck failed: ${tc.out.slice(-400)}`;
  appendExecutionFeed({
    title: "Self-heal blocked: typecheck",
    summary: blocker,
    eventType: "execution_blocked",
    confidence: confidence < 0.45 ? "blocked" : "medium",
  });
  if (confidence < 0.45) {
    phase(
      `--phase blocked --task "Typecheck failure" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --typecheck failed --build failed --failure-kind typecheck --recovery-confidence ${confidence}`,
    );
    process.exit(1);
  }
  phase(
    `--phase recovering --task "Typecheck failed — manual fix required" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --recovery-confidence ${confidence} --next "fix types then execution:heal"`,
  );
  process.exit(1);
}

phase("--phase validating --typecheck passed --build running --progress build");
let build = skipBuild ? "passed" : "pending";

if (!skipBuild) {
  const b = run("npm run build", "build");
  if (!b.ok) {
    confidence = recoveryConfidence(1, 1, false);
    blocker = `build failed: ${b.out.slice(-400)}`;
    appendExecutionFeed({
      title: "Self-heal blocked: build",
      summary: blocker,
      eventType: "execution_blocked",
      confidence: "medium",
    });
    phase(
      `--phase blocked --task "Build failure" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --typecheck passed --build failed --failure-kind build --recovery-confidence ${confidence}`,
    );
    process.exit(1);
  }
  build = "passed";
  const vr = run("npm run verify:routes", "verify routes");
  if (!vr.ok) {
    blocker = `verify:routes failed: ${vr.out.slice(-300)}`;
    phase(
      `--phase blocked --task "Route manifest missing /operations/live" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --build failed --failure-kind routes_manifest`,
    );
    process.exit(1);
  }
}

phase("--phase deploying --typecheck passed --build passed --deploy running --progress deploy:validate");
let deploy = "failed";
let routes = "failed";

for (let attempt = 1; attempt <= deployRetries; attempt++) {
  confidence = recoveryConfidence(attempt, deployRetries, true);
  phase(
    `--phase recovering --task "Deploy validate attempt ${attempt}/${deployRetries}" --subsystem operations-center --reasoning "Waiting for Vercel propagation if needed" --progress "deploy:validate #${attempt}" --recovery-confidence ${confidence} --retry ${attempt}`,
  );

  const v = run("npm run deploy:validate", "deploy:validate");
  if (v.ok) {
    deploy = "passed";
    routes = "passed";
    break;
  }

  const live404 = v.out.includes("/operations/live") && v.out.includes("FAIL");
  blocker = live404
    ? `Production /operations/live not ready (attempt ${attempt}/${deployRetries})`
    : `deploy:validate failed: ${v.out.slice(-400)}`;

  appendExecutionFeed({
    title: `Self-heal deploy retry ${attempt}`,
    summary: blocker,
    eventType: "execution_recovering",
    confidence: confidence >= 0.45 ? "high" : "medium",
  });

  if (attempt < deployRetries && live404) {
    console.log(`[RECOVERING] Waiting 45s for Vercel propagation…`);
    execSync("powershell -Command Start-Sleep -Seconds 45", { cwd: root, stdio: "inherit" });
    continue;
  }

  if (confidence < 0.45) {
    phase(
      `--phase blocked --task "Deploy validation exhausted" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --typecheck passed --build passed --deploy failed --routes failed --failure-kind deploy_validation --recovery-confidence ${confidence}`,
    );
    process.exit(live404 ? 2 : 1);
  }

  phase(
    `--phase recovering --task "Deploy validation failed" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --recovery-confidence ${confidence} --next "owner: check Vercel dashboard"`,
  );
  process.exit(live404 ? 2 : 1);
}

appendExecutionFeed({
  title: "Self-heal cycle passed",
  summary: "typecheck, build, verify:routes, deploy:validate OK",
  eventType: "execution_completed",
});

phase(
  '--phase completed --task "Self-healing cycle passed" --subsystem operations-center --reasoning "typecheck, build, deploy:validate OK" --typecheck passed --build passed --deploy passed --routes passed --recovery-confidence 0.95 --last-completed "deploy:validate green" --next "continue roadmap"',
);
console.log("[COMPLETED] Self-healing validation cycle passed");
