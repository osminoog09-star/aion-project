#!/usr/bin/env node
/**
 * Cursor afterShellExecution → log shell step to action stream.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SKIP = /execution:action|execution:heartbeat|execution-runtime-loop/i;

async function main() {
  const raw = fs.readFileSync(0, "utf8");
  if (!raw.trim()) process.exit(0);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const command = String(payload.command ?? payload.cmd ?? "").trim();
  if (!command || SKIP.test(command)) process.exit(0);

  let tag = "CODE";
  if (/npm run build|typecheck|tsc/i.test(command)) tag = "VALIDATE";
  if (/deploy|vercel|git push/i.test(command)) tag = "DEPLOY";
  if (/execution:heal|self-heal/i.test(command)) tag = "HEAL";

  const short = command.length > 120 ? `${command.slice(0, 117)}…` : command;
  const msg = short.replace(/"/g, "'");

  try {
    execSync(`node scripts/execution-action.mjs ${tag} "${msg}"`, {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
  } catch {
    process.exit(0);
  }
}

main();
