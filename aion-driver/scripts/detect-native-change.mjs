/**
 * Detect if changes require native APK rebuild (not OTA-only).
 * Exit 1 if native rebuild required.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const NATIVE_GLOBS = [
  "app.config.ts",
  "app.json",
  "eas.json",
  "plugins/",
  "android/",
  "ios/",
  "package.json",
];

function changedFiles(base = "HEAD~1") {
  try {
    const out = execSync(`git diff --name-only ${base}`, { cwd: root, encoding: "utf8" });
    const modulePrefix = "aion-driver/";
    return out.split("\n").map((s) => s.trim()).filter(Boolean).map((file) =>
      file.startsWith(modulePrefix) ? file.slice(modulePrefix.length) : file
    );
  } catch {
    return [];
  }
}

const files = changedFiles(process.argv[2] ?? "HEAD~1");
const nativeHits = files.filter((f) =>
  NATIVE_GLOBS.some((g) => f === g || f.startsWith(g) || f.includes("permissions")),
);

if (nativeHits.length) {
  console.error("[NATIVE] Rebuild APK/AAB required — OTA-only blocked:");
  for (const f of nativeHits) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("[NATIVE] No native-only changes detected — OTA may be sufficient.");
process.exit(0);
