/**
 * Fail CI if critical App Router paths are missing from the production build.
 * Run after: npm run build
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const REQUIRED_PAGES = [
  "operations/page.tsx",
  "operations/execution/page.tsx",
  "operations/reviews/page.tsx",
  "operations/review-queue/page.tsx",
  "operations/priorities/page.tsx",
  "operations/live/page.tsx",
  "operations/command/page.tsx",
];

const REQUIRED_STATIC_PRERENDER = [
  "/operations",
  "/operations/execution",
  "/operations/reviews",
  "/operations/review-queue",
  "/operations/live",
  "/operations/command",
];

const appDir = path.join(root, "src", "app");
const missingPages = REQUIRED_PAGES.filter(
  (p) => !fs.existsSync(path.join(appDir, p)),
);
if (missingPages.length) {
  console.error("Missing page files:\n", missingPages.join("\n"));
  process.exit(1);
}

const manifestPath = path.join(root, ".next", "prerender-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("Missing .next/prerender-manifest.json — run npm run build first");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const prerendered = new Set(Object.keys(manifest.routes ?? {}));
const missingStatic = REQUIRED_STATIC_PRERENDER.filter((r) => !prerendered.has(r));
if (missingStatic.length) {
  console.error("Build missing prerendered routes:\n", missingStatic.join("\n"));
  process.exit(1);
}

console.log(
  "OK: operations pages on disk + static prerender:",
  REQUIRED_STATIC_PRERENDER.join(", "),
);
