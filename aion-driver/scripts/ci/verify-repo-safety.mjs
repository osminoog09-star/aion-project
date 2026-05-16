/**
 * Block accidental portal deploy / wrong-remote push from Driver (Expo) workspace.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PORTAL_REPO_SLUG = "osminoog09-star/aion-project";
const PORTAL_DEPLOY_SCRIPTS = ["deploy:vercel", "deploy:pipeline", "deploy:hook"];

function readOrigin() {
  try {
    return execSync("git remote get-url origin", { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const strict =
  process.argv.includes("--strict") || process.env.AION_REPO_VERIFY_STRICT === "1";

const isDriverRoot =
  fs.existsSync(path.join(root, "app.config.ts")) &&
  !fs.existsSync(path.join(root, "src", "app", "operations"));
const isPortalRoot = fs.existsSync(path.join(root, "next.config.ts"));
const origin = readOrigin();
const pointsAtPortalRepo = origin.includes(PORTAL_REPO_SLUG);

let failed = false;

if (isDriverRoot && isPortalRoot) {
  console.error(
    "REPO SAFETY: Ambiguous tree (Expo + Next.js portal at same root). Use monorepo workspaces with isolated CI/deploy.",
  );
  failed = true;
}

if (strict && isDriverRoot && pointsAtPortalRepo) {
  console.error(
    `REPO SAFETY: Driver workspace origin points at portal repo (${PORTAL_REPO_SLUG}).`,
  );
  console.error(
    "Push blocked. Set origin to the Driver repository or use a monorepo subdirectory with isolated CI/deploy.",
  );
  failed = true;
} else if (isDriverRoot && pointsAtPortalRepo) {
  console.warn(
    `REPO SAFETY (warn): origin is portal repo (${PORTAL_REPO_SLUG}). Run npm run repo:verify:push before git push.`,
  );
}

if (isDriverRoot) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const scripts = pkg.scripts ?? {};
  for (const key of PORTAL_DEPLOY_SCRIPTS) {
    if (scripts[key]) {
      console.error(`REPO SAFETY: Driver package.json must not define portal script "${key}".`);
      failed = true;
    }
  }
  if (pkg.name === "aion-project") {
    console.error('REPO SAFETY: Driver package name must not be "aion-project" (portal).');
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("Driver repo safety OK.");
