/**
 * Configure canonical GitHub remote for aion-com autonomous deploys.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const CANONICAL = "https://github.com/osminoog09-star/aion-com.git";

function git(...args) {
  return spawnSync("git", args, { cwd: root, encoding: "utf8", shell: true });
}

const remotes = git("remote");
const hasOrigin = remotes.stdout?.includes("origin");

if (!hasOrigin) {
  const add = git("remote", "add", "origin", CANONICAL);
  if (add.status !== 0) {
    console.error(add.stderr || add.stdout);
    process.exit(1);
  }
  console.log("Added origin:", CANONICAL);
} else {
  git("remote", "set-url", "origin", CANONICAL);
  console.log("Updated origin:", CANONICAL);
}

console.log(git("remote", "-v").stdout);
