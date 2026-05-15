/**
 * Autonomous production deploy pipeline (local or CI).
 * Requires: vercel CLI auth (`npx vercel login`) OR VERCEL_TOKEN env.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function gitHead() {
  const r = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  });
  return r.status === 0 ? r.stdout.trim() : null;
}

const statusPath = path.join(root, "src/content/deployment-status.json");
const status = JSON.parse(fs.readFileSync(statusPath, "utf8"));

status.lastProductionDeploy = {
  ...status.lastProductionDeploy,
  status: "in_progress",
  deployedAt: new Date().toISOString(),
  commit: gitHead(),
  trigger: process.env.GITHUB_ACTIONS ? "github-actions" : "local-pipeline",
};
fs.writeFileSync(statusPath, `${JSON.stringify(status, null, 2)}\n`);

console.log("→ npm run build");
run("npm", ["run", "build"]);

console.log("→ verify routes");
run("node", ["scripts/verify-app-routes.mjs"]);

console.log("→ vercel deploy --prod");
const token = process.env.VERCEL_TOKEN;
const vercelArgs = token
  ? ["--yes", "vercel@54", "deploy", "--prod", `--token=${token}`]
  : ["--yes", "vercel@54", "deploy", "--prod"];
run("npx", vercelArgs);

console.log("→ post-deploy validate");
const validate = spawnSync("node", ["scripts/post-deploy-validate.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});
if (validate.status !== 0) {
  console.error("Post-deploy validation failed — production may still be stale.");
  process.exit(1);
}

const final = JSON.parse(fs.readFileSync(statusPath, "utf8"));
final.lastProductionDeploy = {
  status: "ok",
  deployedAt: new Date().toISOString(),
  commit: gitHead(),
  deploymentUrl: final.productionUrl,
  trigger: process.env.GITHUB_ACTIONS ? "github-actions" : "local-pipeline",
  notes: "Pipeline completed; routes validated.",
};
final.pipelineBlockers = [];
fs.writeFileSync(statusPath, `${JSON.stringify(final, null, 2)}\n`);

console.log("✓ deploy pipeline complete");
