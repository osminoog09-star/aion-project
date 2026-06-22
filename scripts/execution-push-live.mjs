/**
 * Push execution-runtime.json to production live (Supabase via API).
 * Requires OPERATIONS_OWNER_SECRET in env or .env.local
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotenvLocal } from "./load-dotenv-local.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotenvLocal();

const secret =
  process.env.OPERATIONS_AGENT_KEY?.trim() ||
  process.env.OPERATIONS_OWNER_SECRET?.trim();
const url =
  process.env.EXECUTION_LIVE_PUSH_URL?.trim() ??
  "https://aion-com.vercel.app/api/operations/execution-live-sync";

const runtimeFile = path.join(root, "src/content/execution-runtime.json");
const document = JSON.parse(fs.readFileSync(runtimeFile, "utf8"));

if (!secret || secret.length < 16) {
  console.warn("[AION] execution-push-live: OPERATIONS_OWNER_SECRET not set — skip remote");
  process.exit(0);
}

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-aion-agent-key": secret,
  },
  body: JSON.stringify({ document }),
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = { raw: text };
}

if (!res.ok) {
  console.error("[AION] execution-push-live failed:", res.status, json);
  process.exit(1);
}

console.log(
  `[AION] Live sync OK → ${json.persistedVia ?? json.persistedTo?.join("+") ?? "ok"} · heartbeat ${document.runtime?.heartbeatAt ?? "—"}`,
);
