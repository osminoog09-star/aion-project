#!/usr/bin/env node
/**
 * Сводка готовности Driver + APK (читает JSON SoT в репозитории).
 *   npm run driver:release-status
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(rel) {
  const p = path.join(root, rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const manifest = readJson("public/apk-manifest.preview.json");
const fv = readJson("src/content/owner-field-validation-report.json");
const eco = readJson("src/content/ecosystem-status.json");
const auto = readJson("src/content/autonomous-execution-state.json");

const driverPkg = JSON.parse(
  fs.readFileSync(path.join(root, "aion-driver/package.json"), "utf8"),
);

console.log(`
=== AION Driver · release status ===

Код в репо:     ${driverPkg.version} (package.json)
Манифест APK:   ${manifest.latestVersion} (build ${manifest.buildNumber ?? "?"})
Field 8/8:      ${fv.ready ? "READY" : `ожидает устройство (${fv.gateStatus})`}
Google auth:    npm run auth:verify
Приоритет:      ${eco.execution?.currentPriority ?? "—"}

Следующий шаг владельца:
  ${eco.execution?.nextPriority ?? auto.note ?? "—"}
`);
