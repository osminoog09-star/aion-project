/**
 * Load secrets for local scripts (never commit .env.local).
 * Auto-provisions GITHUB_TOKEN from Windows Git Credential Manager when missing.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const portalRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) return null;
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return [m[1], v];
}

function readEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    const [key, value] = parsed;
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

/** Git Credential Manager (Cursor / GitHub Desktop login). */
export function provisionGithubTokenFromGit() {
  if (process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim()) return false;
  try {
    const out = execSync("git credential fill", {
      input: "protocol=https\nhost=github.com\n\n",
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const m = out.match(/^password=(.+)$/m);
    if (!m?.[1]?.trim()) return false;
    process.env.GITHUB_TOKEN = m[1].trim();
    return true;
  } catch {
    return false;
  }
}

function persistEnvLocal(keys) {
  const envPath = path.join(portalRoot, ".env.local");
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const lines = existing ? existing.split(/\r?\n/) : [];
  const have = new Set(
    lines
      .map((l) => parseLine(l)?.[0])
      .filter(Boolean),
  );
  let changed = false;
  for (const [key, value] of Object.entries(keys)) {
    if (!value || have.has(key)) continue;
    lines.push(`${key}=${value}`);
    have.add(key);
    changed = true;
  }
  if (!changed && existing) return;
  const header = lines.some((l) => l.includes("auto-provisioned"))
    ? ""
    : "# auto-provisioned — gitignored\n";
  const body = lines.filter((l) => l.length > 0).join("\n");
  fs.writeFileSync(envPath, `${header}${body}\n`, "utf8");
}

export function loadDotenvLocal(options = {}) {
  const roots = options.roots ?? [portalRoot, path.join(portalRoot, "..")];
  const loaded = [];
  for (const root of roots) {
    const f = path.join(root, ".env.local");
    if (fs.existsSync(f)) {
      readEnvFile(f);
      loaded.push(f);
    }
  }
  const provisioned = provisionGithubTokenFromGit();
  if (provisioned) {
    persistEnvLocal({ GITHUB_TOKEN: process.env.GITHUB_TOKEN });
    if (!loaded.includes(path.join(portalRoot, ".env.local"))) {
      loaded.push(path.join(portalRoot, ".env.local"));
    }
  }
  return loaded;
}

/** Mask a secret for logs/diagnostics (never fully expose short values). */
export function maskSecret(value) {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) return null;
  if (v.length <= 8) return "***";
  return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

/** @param {string[]} keys */
export function maskEnv(keys) {
  const out = {};
  for (const k of keys) {
    out[k] = maskSecret(process.env[k]);
  }
  return out;
}
