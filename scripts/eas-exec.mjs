/**
 * Run eas-cli via npx (Windows-safe: npx.cmd + shell, cwd = aion-driver).
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAionDriverPath } from "./resolve-aion-driver-path.mjs";

const portalRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function easBuildViewJson(buildId) {
  const driverRoot = resolveAionDriverPath() ?? path.join(portalRoot, "aion-driver");
  const bin = process.platform === "win32" ? "npx.cmd" : "npx";
  const raw = execFileSync(
    bin,
    ["eas-cli@latest", "build:view", buildId, "--json"],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_OPTIONS: [process.env.NODE_OPTIONS, "--use-system-ca"].filter(Boolean).join(" "),
      },
      cwd: driverRoot,
      shell: process.platform === "win32",
    },
  );
  const trimmed = raw.trim();
  const parsed = JSON.parse(trimmed);
  return Array.isArray(parsed) ? parsed[0] : parsed;
}
