/**
 * Portal-only deploy safety: block Driver-only trees from Vercel pipeline scripts.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTAL_REPO_SLUG = "osminoog09-star/aion-project";

function readOrigin() {
  try {
    return execSync("git remote get-url origin", { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const isPortalRoot = fs.existsSync(path.join(root, "next.config.ts"));
const isDriverOnlyRoot =
  fs.existsSync(path.join(root, "app.config.ts")) &&
  !fs.existsSync(path.join(root, "src", "app", "operations"));

let failed = false;

if (!isPortalRoot) {
  console.error("PORTAL SAFETY: next.config.ts missing — not a portal deploy root.");
  failed = true;
}

if (isDriverOnlyRoot && !isPortalRoot) {
  console.error("PORTAL SAFETY: Expo driver root without portal routes — do not run portal deploy here.");
  failed = true;
}

const origin = readOrigin();
if (isPortalRoot && origin && !origin.includes(PORTAL_REPO_SLUG)) {
  console.warn(`PORTAL SAFETY: origin is not canonical ${PORTAL_REPO_SLUG}: ${origin}`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (pkg.name !== "aion-project") {
  console.error('PORTAL SAFETY: package name must be "aion-project".');
  failed = true;
}

if (failed) process.exit(1);

execSync("node scripts/ci/test-field-validation-report-parse.mjs", {
  cwd: root,
  stdio: "inherit",
});
execSync("node scripts/ci/test-runtime-compatibility.mjs", {
  cwd: root,
  stdio: "inherit",
});
execSync("node scripts/ci/test-apk-release-notes.mjs", {
  cwd: root,
  stdio: "inherit",
});
execSync("node scripts/ci/test-driver-apk-build-paths.mjs", {
  cwd: root,
  stdio: "inherit",
});

console.log("Portal deploy safety OK.");
