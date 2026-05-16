/**
 * Verify AION monorepo module layout.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAionDriverPath } from "./resolve-aion-driver-path.mjs";

const portalRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

let failed = false;

if (!fs.existsSync(path.join(portalRoot, "next.config.ts"))) {
  console.error("FAIL: not portal root");
  failed = true;
}

const driverPath = resolveAionDriverPath();
if (!driverPath) {
  console.error("FAIL: aion-driver module missing");
  console.error("  Expected: aion-driver/ inside repo OR ../aion-driver locally");
  failed = true;
} else {
  const inRepo = driverPath.startsWith(portalRoot);
  console.log(`OK: aion-driver at ${driverPath} (${inRepo ? "in-repo module" : "sibling dev layout"})`);
  if (!inRepo) {
    console.warn("WARN: using legacy sibling ../aion-driver — use aion-com/aion-driver/ instead");
    if (process.env.CI === "true") {
      console.error("FAIL: CI requires aion-driver/ inside aion-project repo");
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("AION modules OK");
