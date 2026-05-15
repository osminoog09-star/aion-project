/**
 * Autonomous preflight: GitHub repo exists? push possible? Prints ownerUnblock if blocked.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const statusPath = path.join(root, "src/content/deployment-status.json");

const status = JSON.parse(fs.readFileSync(statusPath, "utf8"));
const remote = status.expectedGitRemote;

const ls = spawnSync("git", ["ls-remote", remote, "HEAD"], {
  cwd: root,
  encoding: "utf8",
  shell: true,
});

if (ls.status === 0) {
  status.gitLinkage.githubRepoExists = true;
  status.gitLinkage.lastPushError = null;
  console.log("OK: GitHub repo reachable");
  const push = spawnSync("git", ["push", "-u", "origin", "master"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  process.exit(push.status ?? 0);
}

status.gitLinkage.githubRepoExists = false;
status.gitLinkage.lastPushError = (ls.stderr || ls.stdout || "not found").trim();
fs.writeFileSync(statusPath, `${JSON.stringify(status, null, 2)}\n`);

console.error("\n⬜ BLOCKER: GitHub repo missing. Owner one-time action:\n");
console.error(status.ownerUnblock.stepA_github);
console.error("\nThen run: npm run owner:unblock-check\n");
process.exit(2);
