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
  let raw;
  try {
    raw = execFileSync(
      bin,
      ["eas-cli@latest", "build:view", buildId, "--json", "--non-interactive"],
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
  } catch (e) {
    const stderr = Buffer.isBuffer(e.stderr) ? e.stderr.toString("utf8").trim() : "";
    const stdout = Buffer.isBuffer(e.stdout) ? e.stdout.toString("utf8").trim() : "";
    const detail = [e.message, stderr ? `stderr:\n${stderr}` : "", stdout ? `stdout:\n${stdout}` : ""]
      .filter(Boolean)
      .join("\n");
    throw new Error(detail);
  }
  const trimmed = raw.trim();
  const parsed = JSON.parse(trimmed);
  return Array.isArray(parsed) ? parsed[0] : parsed;
}
