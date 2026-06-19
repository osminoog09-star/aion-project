/**
 * Синхронизирует public/apk-manifest.preview.json с FINISHED EAS Android build.
 * Требует: EXPO_TOKEN (CI) или локальный eas login; build id в argv или EAS_APK_BUILD_ID.
 *
 * Usage:
 *   EAS_APK_BUILD_ID=f71cec0a-... node scripts/sync-apk-manifest-from-eas.mjs
 *   node scripts/sync-apk-manifest-from-eas.mjs f71cec0a-...
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { easBuildViewJson } from "./eas-exec.mjs";
import { loadDotenvLocal } from "./load-dotenv-local.mjs";
import { resolveAionDriverPath } from "./resolve-aion-driver-path.mjs";

loadDotenvLocal();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MANIFEST = path.join(ROOT, "public", "apk-manifest.preview.json");

const buildId = process.env.EAS_APK_BUILD_ID?.trim() || process.argv[2]?.trim();
if (!buildId) {
  console.error("Missing build id: set EAS_APK_BUILD_ID or pass as first argument.");
  process.exit(1);
}

let build;
try {
  build = await easBuildViewJson(buildId);
} catch (e) {
  console.error("eas build:view failed:", e.message ?? e);
  process.exit(1);
}
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
const reqPath = path.join(ROOT, "src/content/portal-runtime-requirements.json");
const req = fs.existsSync(reqPath) ? JSON.parse(fs.readFileSync(reqPath, "utf8")) : null;
const driverRoot = resolveAionDriverPath();
const driverManifestPath = driverRoot ? path.join(driverRoot, "build-manifest.json") : null;
const driverManifest =
  driverManifestPath && fs.existsSync(driverManifestPath)
    ? JSON.parse(fs.readFileSync(driverManifestPath, "utf8"))
    : null;

const runtimeVersion = build.runtimeVersion ?? driverManifest?.runtimeVersion ?? existing.runtimeVersion;
const appVersion = build.appVersion ?? driverManifest?.appVersion ?? existing.latestVersion;
const buildNumber = String(
  build.appBuildVersion ?? driverManifest?.versionCode ?? existing.buildNumber,
);

function semverGte(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false;
  }
  return true;
}

const compatible =
  req?.minRuntimeVersion && runtimeVersion
    ? semverGte(runtimeVersion, req.minRuntimeVersion)
    : false;

const next = {
  ...existing,
  latestVersion: appVersion,
  minimumSupported: req?.minRuntimeVersion ?? existing.minimumSupported,
  runtimeVersion,
  buildNumber,
  releaseDate: build.completedAt ?? new Date().toISOString(),
  apkUrl: url,
  easBuildId: buildId,
  compatibilityStatus: compatible
    ? "compatible_with_portal_runtime"
    : "incompatible_with_portal_runtime",
  portalMinRuntimeVersion: req?.minRuntimeVersion ?? existing.portalMinRuntimeVersion,
  supportedFeatures: driverManifest?.supportedFeatures ?? existing.supportedFeatures,
  supportedRoutes: driverManifest?.supportedRoutes ?? existing.supportedRoutes,
  releaseNotes:
    typeof existing.releaseNotes === "string"
      ? `${existing.releaseNotes}\nSynced from EAS ${buildId} (${build.gitCommitHash ?? "unknown"}).`
      : `Synced from EAS ${buildId}.`,
};

fs.writeFileSync(MANIFEST, JSON.stringify(next, null, 2) + "\n", "utf8");
console.log("Wrote", MANIFEST);
console.log("apkUrl", url);
console.log("runtimeVersion", runtimeVersion, "compatible", compatible);
