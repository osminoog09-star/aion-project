/**
 * Append execution transition to ecosystem-implementation-feed.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FEED_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/content/ecosystem-implementation-feed.json");

export function appendExecutionFeed({
  title,
  summary,
  eventType = "execution_runtime",
  reasoning,
  confidence = "high",
  files,
  repository = "aion-project",
}) {
  try {
    const feed = JSON.parse(fs.readFileSync(FEED_FILE, "utf8"));
    const id = `evt-${new Date().toISOString().slice(0, 10)}-exec-${Math.random().toString(36).slice(2, 8)}`;
    const item = {
      id,
      occurredAt: new Date().toISOString().slice(0, 10),
      title,
      summary,
      subsystemIds: ["operations-center", "web-portal"],
      eventType,
      reasoning: reasoning ?? summary,
      confidence,
      repository,
      changedFiles: files,
      rollup: {
        fullyDone: [`✅ ${title}`],
        partiallyDone: [],
        notStarted: [],
        technicalDebt: [],
      },
      stillMissing: [],
      blocked: [],
      impacts: { release: "medium", otaApk: "none", backend: "low", realtime: "high", ux: "high", cloud: "low" },
      validation: { web_build: "pending" },
    };
    feed.items = [item, ...(feed.items ?? [])];
    feed.lastUpdated = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(FEED_FILE, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
    return id;
  } catch (e) {
    console.warn("[AION] feed append skipped:", e instanceof Error ? e.message : e);
    return null;
  }
}
