/**
 * Run eas-cli via npx (Windows-safe: npx.cmd + shell, cwd = aion-driver).
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchExpoBuildById } from "./expo-build-api.mjs";
import { resolveAionDriverPath } from "./resolve-aion-driver-path.mjs";

const portalRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function easBuildViewJson(buildId) {
  // В CI (есть EXPO_TOKEN) стабильный Expo GraphQL идёт ПЕРВЫМ. Причина: свежие
  // eas-cli@latest печатают апдейт-нотисы/предупреждения в stdout, из-за чего
  // `build:view --json` не парсится (JSON.parse падает), а старый порядок
  // фолбэчил в GraphQL только при НЕнулевом выходе CLI — то есть при «грязном»
  // stdout фолбэк не срабатывал и sync-manifest падал хронически. GraphQL от
  // версии CLI не зависит.
  if (process.env.EXPO_TOKEN?.trim()) {
    try {
      return await fetchExpoBuildById(buildId);
    } catch (e) {
      console.warn("[EAS] Expo GraphQL build fetch failed; falling back to eas-cli build:view.");
      console.warn(e.message ?? e);
    }
  }

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
  // eas-cli может добавить не-JSON шум (нотисы) перед объектом — режем до первого { или [.
  const trimmed = raw.trim();
  const start = trimmed.search(/[[{]/);
  const jsonText = start >= 0 ? trimmed.slice(start) : trimmed;
  const parsed = JSON.parse(jsonText);
  return Array.isArray(parsed) ? parsed[0] : parsed;
}
