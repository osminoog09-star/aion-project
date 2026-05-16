/**
 * Extend owner autonomous mandate.
 *   node scripts/execution-extend-mandate.mjs --hours 1
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const loopFile = path.join(root, "src/content/execution-loop-state.json");

const hoursArg = process.argv.indexOf("--hours");
const hours =
  hoursArg >= 0 && process.argv[hoursArg + 1]
    ? Number.parseFloat(process.argv[hoursArg + 1])
    : 1;
const ms = Math.round(hours * 3_600_000);
const now = Date.now();
const endsAt = new Date(now + ms).toISOString();
const startedAt = new Date(now).toISOString();

const loop = JSON.parse(readFileSync(loopFile, "utf8"));
loop.ownerMandate = {
  active: true,
  labelRu: `Автономная работа ${hours} ч (владелец)`,
  startedAt,
  endsAt,
  durationMs: ms,
};
writeFileSync(loopFile, `${JSON.stringify(loop, null, 2)}\n`, "utf8");
console.log(`[AION] Mandate extended until ${endsAt} (${hours}h)`);
