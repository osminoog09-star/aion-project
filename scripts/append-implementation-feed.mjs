/**
 * Append one event to src/content/ecosystem-implementation-feed.json
 * Usage:
 *   node scripts/append-implementation-feed.mjs --title "..." --summary "..." [--commit abc] [--repo aion-com] [--subsystems web-portal,updates]
 * Requires: Node 20+
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const target = path.join(root, "src/content/ecosystem-implementation-feed.json");

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1 || !process.argv[i + 1]) return null;
  return process.argv[i + 1];
}

const title = arg("--title");
const summary = arg("--summary");
if (!title || !summary) {
  console.error("Required: --title and --summary");
  process.exit(1);
}

const commitHash = arg("--commit");
const repository = arg("--repo") ?? "aion-com";
const subRaw = arg("--subsystems");
const subsystemIds = subRaw ? subRaw.split(",").map((s) => s.trim()).filter(Boolean) : ["web-portal"];

const raw = fs.readFileSync(target, "utf8");
const data = JSON.parse(raw);
const id = `evt-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`;
const item = {
  id,
  occurredAt: new Date().toISOString().slice(0, 10),
  title,
  summary,
  subsystemIds,
  commitHash: commitHash ?? null,
  repository,
  rollup: {
    fullyDone: [],
    partiallyDone: ["🟨 Запись из feed:append — уточните rollup вручную"],
    notStarted: [],
    technicalDebt: [],
  },
  stillMissing: ["Уточнить rollup и validation после CI"],
  blocked: [],
  impacts: {
    release: "low",
    otaApk: "none",
    backend: "none",
    realtime: "none",
    ux: "low",
    cloud: "none",
  },
  validation: {
    web_build: "pending",
  },
};

data.items = [item, ...(data.items ?? [])];
data.lastUpdated = item.occurredAt;
fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log("Appended", id, "→", target);
