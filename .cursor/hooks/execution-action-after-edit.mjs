#!/usr/bin/env node
/**
 * Cursor afterFileEdit → execution:action (owner stream).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function main() {
  const raw = fs.readFileSync(0, "utf8");
  if (!raw.trim()) process.exit(0);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const filePath =
    payload.file_path ??
    payload.path ??
    payload.filePath ??
    payload.edited_file ??
    null;
  if (!filePath || typeof filePath !== "string") process.exit(0);

  const rel = filePath.replace(/\\/g, "/");
  const base = path.basename(rel);
  const repo = rel.includes("aion-driver") ? "aion-driver" : "aion-project";
  const msg = `Правка: ${base}`;

  try {
    execSync(
      `node scripts/execution-action.mjs CODE "${msg.replace(/"/g, "'")}" --file "${rel.replace(/"/g, "'")}" --repo ${repo}`,
      { cwd: root, stdio: "inherit", shell: true },
    );
  } catch {
    process.exit(0);
  }
}

main();
