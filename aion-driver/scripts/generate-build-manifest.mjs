/**
 * Generates build-manifest.json from app.config + route scan.
 *   node scripts/generate-build-manifest.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const appConfigPath = path.join(root, "app.config.ts");
const appDir = path.join(root, "app");
const out = path.join(root, "build-manifest.json");

function gitSha() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function scanRoutes(dir, prefix = "") {
  const routes = [];
  if (!fs.existsSync(dir)) return routes;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name.startsWith("(") && name.endsWith(")")) {
        routes.push(...scanRoutes(full, prefix));
      } else {
        routes.push(...scanRoutes(full, `${prefix}/${name}`));
      }
      continue;
    }
    if (!name.endsWith(".tsx") && !name.endsWith(".ts")) continue;
    const base = name.replace(/\.(tsx|ts)$/, "");
    if (base === "_layout" || base === "+not-found") continue;
    const route = base === "index" ? prefix || "/" : `${prefix}/${base}`;
    routes.push(route.replace(/\/\(/g, "/").replace(/\)[/]/g, "/"));
  }
  return routes;
}

const versionMatch = fs.readFileSync(appConfigPath, "utf8").match(/version:\s*"([^"]+)"/);
const vcMatch = fs.readFileSync(appConfigPath, "utf8").match(/versionCode:\s*(\d+)/);
const appVersion = versionMatch?.[1] ?? "0.0.0";
const versionCode = vcMatch ? Number(vcMatch[1]) : 1;

const routes = [
  ...new Set(
    scanRoutes(appDir)
      .map((r) => r.replace(/\/\([^)]+\)/g, ""))
      .filter(Boolean),
  ),
];

const manifest = {
  appVersion,
  runtimeVersion: appVersion,
  versionCode,
  gitSha: gitSha(),
  buildTimestamp: new Date().toISOString(),
  channel: "preview",
  supportedFeatures: [
    "field_validation_8_8",
    "ota_smoke_from_validation",
    "bg_production_gate_ui",
    "route_timeline",
    "device_heartbeat",
  ],
  supportedRoutes: routes.filter((r) =>
    ["/driver/route-timeline", "/ota-debug", "/update-center"].some((req) => r.includes(req.replace(/^\//, ""))),
  ),
  requiresNativeBuild: false,
};

if (!manifest.supportedRoutes.includes("/driver/route-timeline")) {
  manifest.supportedRoutes.push("/driver/route-timeline");
}
if (!manifest.supportedRoutes.includes("/ota-debug")) {
  manifest.supportedRoutes.push("/ota-debug");
}

fs.writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`build-manifest.json → ${appVersion} vc${versionCode} routes=${manifest.supportedRoutes.length}`);
