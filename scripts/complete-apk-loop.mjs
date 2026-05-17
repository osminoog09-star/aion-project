/**
 * Phase A helper: wait EAS → sync manifest → verify compatibility → release:safety
 * Does NOT start EAS build (run eas:preview or GHA workflow first).
 *
 *   node scripts/complete-apk-loop.mjs <EAS_BUILD_ID>
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDotenvLocal } from "./load-dotenv-local.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotenvLocal();
const buildId = process.env.EAS_APK_BUILD_ID?.trim() || process.argv[2]?.trim();

if (!buildId) {
  console.error("Usage: complete-apk-loop.mjs <EAS_BUILD_ID>");
  console.error("Start build first: cd aion-driver && npm run eas:preview");
  process.exit(2);
}

console.log("\n[APK LOOP] 1/4 Wait for EAS FINISHED\n");
execSync(`node scripts/wait-eas-build.mjs ${buildId}`, { cwd: root, stdio: "inherit", env: process.env });

console.log("\n[APK LOOP] 2/4 Sync manifest\n");
execSync(`node scripts/sync-apk-manifest-from-eas.mjs ${buildId}`, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

console.log("\n[APK LOOP] 3/5 Manifest validation\n");
execSync("node scripts/validate-apk-manifest.mjs", { cwd: root, stdio: "inherit" });

console.log("\n[APK LOOP] 4/5 Compatibility tests\n");
execSync("node scripts/ci/test-runtime-compatibility.mjs", { cwd: root, stdio: "inherit" });

console.log("\n[APK LOOP] 5/5 Release safety\n");
try {
  execSync("node scripts/release-safety-pipeline.mjs", { cwd: root, stdio: "inherit" });
} catch {
  console.error("\n[APK LOOP] release:safety failed — fix manifest before device validation\n");
  process.exit(1);
}

console.log("\n[APK LOOP] Manifest ready.");
console.log("  1. git add public/apk-manifest.preview.json && git commit && git push");
console.log("  2. Install APK on device (NOT OTA) → open Driver");
console.log("  3. npm run stabilization:signoff -- --require-device --strict");
console.log("  4. npm run release:orchestrate -- --activate-runtime  (only if sign-off exit 0)\n");
