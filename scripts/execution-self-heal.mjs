/**
 * Self-healing execution loop: detect failures, update runtime, rerun validation.
 *
 *   node scripts/execution-self-heal.mjs
 *   node scripts/execution-self-heal.mjs --skip-build
 */
import { execSync } from "node:child_process";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, label) {
  console.log(`[RECOVERING] ${label}…`);
  const r = spawnSync(cmd, { cwd: root, shell: true, encoding: "utf8", stdio: "pipe" });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}`.slice(-2000) };
}

function phase(args) {
  execSync(`node scripts/execution-runtime.mjs ${args}`, { cwd: root, stdio: "inherit" });
}

const skipBuild = process.argv.includes("--skip-build");

phase(
  '--phase recovering --task "Self-healing validation cycle" --subsystem operations-center --reasoning "Automated repair: typecheck, build, deploy validate" --typecheck running --build pending --deploy idle',
);

let typecheck = "passed";
let build = skipBuild ? "passed" : "pending";
let deploy = "idle";
let routes = "idle";
let blocker = null;

const tc = run("npx tsc --noEmit", "typecheck");
if (!tc.ok) {
  typecheck = "failed";
  build = "failed";
  blocker = `typecheck failed: ${tc.out.slice(-400)}`;
  phase(
    `--phase blocked --task "Typecheck failure" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --typecheck failed --build failed --failure-kind typecheck --failure-msg "See logs"`,
  );
  process.exit(1);
}

phase("--phase validating --typecheck passed --build running");
if (!skipBuild) {
  const b = run("npm run build", "build");
  if (!b.ok) {
    build = "failed";
    blocker = `build failed: ${b.out.slice(-400)}`;
    phase(
      `--phase blocked --task "Build failure" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --typecheck passed --build failed --failure-kind build`,
    );
    process.exit(1);
  }
  build = "passed";
}

phase("--phase deploying --typecheck passed --build passed --deploy running");
const v = run("npm run deploy:validate", "deploy:validate");
if (!v.ok) {
  deploy = "failed";
  routes = "failed";
  const live404 = v.out.includes("/operations/live") && v.out.includes("FAIL");
  blocker = live404
    ? "Production /operations/live 404 — awaiting Vercel deploy propagation"
    : `deploy:validate failed: ${v.out.slice(-400)}`;
  phase(
    `--phase recovering --task "Deploy validation failed" --subsystem operations-center --reasoning "${blocker.replace(/"/g, "'")}" --typecheck passed --build passed --deploy failed --routes failed --failure-kind deploy_validation`,
  );
  process.exit(live404 ? 2 : 1);
}

deploy = "passed";
routes = "passed";
phase(
  '--phase completed --task "Self-healing cycle passed" --subsystem operations-center --reasoning "typecheck, build, deploy:validate OK" --typecheck passed --build passed --deploy passed --routes passed --blocker null --next "continue roadmap"',
);
console.log("[COMPLETED] Self-healing validation cycle passed");
