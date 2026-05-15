/**
 * Fail CI if critical App Router paths are missing from the production build.
 * Run after: npm run build
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const manifestPath = path.join(root, ".next", "prerender-manifest.json");

const REQUIRED = [
  "/operations",
  "/operations/execution",
  "/operations/reviews",
  "/operations/review-queue",
  "/operations/priorities",
];

if (!fs.existsSync(manifestPath)) {
  console.error("Missing .next/prerender-manifest.json — run npm run build first");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const routes = new Set(Object.keys(manifest.routes ?? {}));

const missing = REQUIRED.filter((r) => !routes.has(r));
if (missing.length) {
  console.error("Build missing required routes:\n", missing.join("\n"));
  process.exit(1);
}

console.log("OK: required operations routes present in build:", REQUIRED.join(", "));
