/**
 * Синхронизирует public/apk-manifest.preview.json с FINISHED EAS Android build.
 * Требует: EXPO_TOKEN (CI) или локальный eas login; build id в argv или EAS_APK_BUILD_ID.
 *
 * Usage:
 *   EAS_APK_BUILD_ID=f71cec0a-... node scripts/sync-apk-manifest-from-eas.mjs
 *   node scripts/sync-apk-manifest-from-eas.mjs f71cec0a-...
 */
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MANIFEST = path.join(ROOT, "public", "apk-manifest.preview.json");

const buildId = process.env.EAS_APK_BUILD_ID?.trim() || process.argv[2]?.trim();
if (!buildId) {
  console.error("Missing build id: set EAS_APK_BUILD_ID or pass as first argument.");
  process.exit(1);
}

let jsonRaw;
try {
  jsonRaw = execFileSync("npx", ["eas-cli@latest", "build:view", buildId, "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
} catch (e) {
  console.error("eas build:view failed:", e);
  process.exit(1);
}

const build = JSON.parse(jsonRaw);
if (build.status !== "FINISHED") {
  console.error(`Build ${buildId} status=${build.status} (need FINISHED). No manifest write.`);
  process.exit(2);
}

const url = build.artifacts?.applicationArchiveUrl || build.artifacts?.buildUrl;
if (!url || typeof url !== "string" || !/^https:\/\//i.test(url)) {
  console.error("No applicationArchiveUrl in artifacts:", build.artifacts);
  process.exit(3);
}

const existing = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const next = {
  ...existing,
  latestVersion: build.appVersion ?? existing.latestVersion,
  runtimeVersion: build.runtimeVersion ?? existing.runtimeVersion,
  buildNumber: String(build.appBuildVersion ?? existing.buildNumber),
  releaseDate: build.completedAt ?? new Date().toISOString(),
  apkUrl: url,
  releaseNotes:
    typeof existing.releaseNotes === "string"
      ? `${existing.releaseNotes}\nSynced from EAS ${buildId} (${build.gitCommitHash ?? "unknown"}).`
      : `Synced from EAS ${buildId}.`,
};

fs.writeFileSync(MANIFEST, JSON.stringify(next, null, 2) + "\n", "utf8");
console.log("Wrote", MANIFEST);
console.log("apkUrl", url);
