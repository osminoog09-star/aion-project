#!/usr/bin/env node
/**
 * Guardrail: expo-doctor flags eas-cli in package.json dependencies.
 * EAS CLI must be invoked via `npx eas-cli@latest` only (see package.json scripts + ship.mjs).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const blocks = [
  pkg.dependencies,
  pkg.devDependencies,
  pkg.optionalDependencies,
  pkg.peerDependencies,
];
for (const b of blocks) {
  if (b && typeof b === "object" && Object.hasOwn(b, "eas-cli")) {
    console.error(
      "[verify-no-local-eas-cli] Remove eas-cli from package.json. Use: npx eas-cli@latest … (see npm scripts).",
    );
    process.exit(1);
  }
}
