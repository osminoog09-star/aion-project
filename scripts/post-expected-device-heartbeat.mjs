/**
 * POST driver build-manifest capabilities to production portal (bootstrap heartbeat).
 * Use after APK 1.0.6 install when the app has not yet reached /api/operations/device-heartbeat.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAionDriverPath } from "./resolve-aion-driver-path.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const driverRoot = resolveAionDriverPath();
if (!driverRoot) {
  console.error("aion-driver not found");
  process.exit(1);
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(driverRoot, "build-manifest.json"), "utf8"),
);
const deployment = JSON.parse(
  fs.readFileSync(path.join(root, "src/content/deployment-status.json"), "utf8"),
);
const base = (process.env.AION_PORTAL_URL ?? deployment.productionUrl).replace(/\/$/, "");

const device = {
  appVersion: manifest.appVersion,
  runtimeVersion: manifest.runtimeVersion,
  versionCode: manifest.versionCode,
  gitSha: manifest.gitSha ?? undefined,
  buildTimestamp: manifest.buildTimestamp ?? undefined,
  features: manifest.supportedFeatures ?? [],
  routes: manifest.supportedRoutes ?? [],
  channel: manifest.channel ?? "preview",
};

const at = new Date().toISOString();
const localRecord = { at, device };
fs.writeFileSync(
  path.join(root, "src/content/device-build-heartbeat.json"),
  `${JSON.stringify(localRecord, null, 2)}\n`,
);

const res = await fetch(`${base}/api/operations/device-heartbeat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ device }),
});

const body = await res.json().catch(() => ({}));
console.log("local heartbeat written");
console.log("POST", res.status, body.ok, "supabasePersisted:", body.supabasePersisted);
console.log("safeMode:", body.safety?.safeMode, "compatible:", body.safety?.compatibility?.compatible);
if (!res.ok) {
  console.warn("Production POST failed — local signoff still OK:", await res.text().catch(() => ""));
}
