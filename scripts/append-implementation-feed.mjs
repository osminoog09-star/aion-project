/**
 * Append one event to src/content/ecosystem-implementation-feed.json
 * Usage:
 *   node scripts/append-implementation-feed.mjs --title "..." --summary "..." \
 *     [--commit abc] [--repo aion-project] [--subsystems web-portal,operations-center] \
 *     [--event-type implementation_finished] [--reasoning "..."] [--task "..."] \
 *     [--confidence high|medium|experimental|unstable|blocked] \
 *     [--files "path/a,path/b"] [--runtime-impact "..."] [--apk-impact "..."]
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
const repository = arg("--repo") ?? "aion-project";
const subRaw = arg("--subsystems");
const subsystemIds = subRaw ? subRaw.split(",").map((s) => s.trim()).filter(Boolean) : ["operations-center"];
const eventType = arg("--event-type") ?? "implementation_finished";
const reasoning = arg("--reasoning");
const task = arg("--task");
const confidence = arg("--confidence");
const filesRaw = arg("--files");
const changedFiles = filesRaw ? filesRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
const runtimeImpact = arg("--runtime-impact");
const apkImpact = arg("--apk-impact");

const raw = fs.readFileSync(target, "utf8");
const data = JSON.parse(raw);
const id = `evt-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`;
const item = {
  id,
  occurredAt: new Date().toISOString().slice(0, 10),
  title,
  summary,
  subsystemIds,
  eventType,
  commitHash: commitHash ?? null,
  repository,
  rollup: {
    fullyDone: [],
    partiallyDone: reasoning ? ["🟨 См. reasoning в audit"] : ["🟨 Запись из feed:append — уточните rollup"],
    notStarted: [],
    technicalDebt: [],
  },
  stillMissing: ["Уточнить rollup и validation после CI"],
  blocked: [],
  impacts: {
    release: apkImpact ? "medium" : "low",
    otaApk: apkImpact ? "medium" : "none",
    backend: "none",
    realtime: runtimeImpact ? "low" : "none",
    ux: "medium",
    cloud: "low",
  },
  validation: {
    web_build: "pending",
  },
};

if (reasoning) item.reasoning = reasoning;
if (task) item.task = task;
if (confidence) item.confidence = confidence;
if (changedFiles?.length) item.changedFiles = changedFiles;
if (runtimeImpact) item.runtimeImpact = runtimeImpact;
if (apkImpact) item.apkImpact = apkImpact;

data.items = [item, ...(data.items ?? [])];
data.lastUpdated = item.occurredAt;
fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log("Appended", id, "→", target);
