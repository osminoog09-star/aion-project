/**
 * Poll EAS build until FINISHED or terminal failure.
 *
 *   node scripts/wait-eas-build.mjs <BUILD_ID>
 *   EAS_APK_BUILD_ID=... node scripts/wait-eas-build.mjs
 */
import { loadDotenvLocal } from "./load-dotenv-local.mjs";
import { easBuildViewJson } from "./eas-exec.mjs";

loadDotenvLocal();

const buildId = process.env.EAS_APK_BUILD_ID?.trim() || process.argv[2]?.trim();
const intervalMs = Number(process.env.EAS_POLL_MS ?? 30_000);
const maxWaitMs = Number(process.env.EAS_MAX_WAIT_MS ?? 90 * 60_000);

if (!buildId) {
  console.error("Usage: wait-eas-build.mjs <BUILD_ID>");
  process.exit(2);
}

const terminal = new Set(["FINISHED", "ERRORED", "CANCELED"]);

function view() {
  return easBuildViewJson(buildId);
}

const started = Date.now();
console.log(`[EAS] Waiting for build ${buildId} (max ${Math.round(maxWaitMs / 60000)} min)\n`);

while (Date.now() - started < maxWaitMs) {
  let build;
  try {
    build = view();
  } catch (e) {
    console.error("[EAS] build:view failed:", e.message ?? e);
    process.exit(1);
  }
  const status = build.status;
  console.log(`[EAS] ${new Date().toISOString()} status=${status}`);
  if (terminal.has(status)) {
    if (status === "FINISHED") {
      console.log("\n[EAS] FINISHED — run:");
      console.log(`  cd aion-com && npm run release:apk-manifest:sync ${buildId}\n`);
      process.exit(0);
    }
    console.error(`\n[EAS] Build ended: ${status}\n`);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, intervalMs));
}

console.error("\n[EAS] Timeout waiting for build\n");
process.exit(3);
