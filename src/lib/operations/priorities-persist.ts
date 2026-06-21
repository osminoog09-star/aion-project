import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StrategicPrioritiesPayload } from "@/lib/ecosystem-types";
import type { PriorityChangeAudit } from "@/lib/ecosystem-types";
import { shouldAllowPrioritiesFilesystemWrite } from "@/lib/operations/priorities-persist-policy";

const CONTENT = path.join(process.cwd(), "src/content");
const PRIORITIES_FILE = path.join(CONTENT, "strategic-priorities.json");
const ROADMAP_FILE = path.join(CONTENT, "roadmap-execution.json");
const FEED_FILE = path.join(CONTENT, "ecosystem-implementation-feed.json");

export type SavePrioritiesInput = {
  payload: StrategicPrioritiesPayload;
  nextImplementationTarget?: string;
  audit: PriorityChangeAudit;
};

export type SavePrioritiesResult = {
  persistedTo: ("filesystem" | "supabase")[];
  feedEventId: string | null;
};

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function appendPriorityAuditFeed(audit: PriorityChangeAudit): Promise<string> {
  const raw = await readFile(FEED_FILE, "utf8");
  const feed = JSON.parse(raw) as {
    lastUpdated: string;
    items: unknown[];
  };
  const id = `evt-${new Date().toISOString().slice(0, 10)}-priority-${Math.random().toString(36).slice(2, 8)}`;
  const occurredAt = new Date().toISOString().slice(0, 10);
  const item = {
    id,
    occurredAt,
    title: "Strategic priority change (owner)",
    summary: audit.reason,
    subsystemIds: ["operations-center", "roadmap-system"],
    eventType: "priority_changed",
    reasoning: audit.reason,
    confidence: "high" as const,
    repository: "aion-project",
    priorityAudit: audit,
    rollup: {
      fullyDone: ["✅ Priority panel save"],
      partiallyDone: [],
      notStarted: [],
      technicalDebt: [],
    },
    stillMissing: [],
    blocked: [],
    impacts: { release: "low", otaApk: "none", backend: "low", realtime: "none", ux: "medium", cloud: "low" },
    validation: { web_build: "pending" as const },
  };
  feed.items = [item, ...(feed.items ?? [])];
  feed.lastUpdated = occurredAt;
  await writeJsonFile(FEED_FILE, feed);
  return id;
}

async function trySupabaseUpsert(payload: StrategicPrioritiesPayload): Promise<boolean> {
  const key = process.env.OPERATIONS_SUPABASE_SERVICE_ROLE_KEY?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!key || !url) return false;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const kind = "portal_strategic_priorities";
    const row = {
      kind,
      payload: payload as unknown as Record<string, unknown>,
      is_public: true,
      updated_at: new Date().toISOString(),
    };
    const { data: existing } = await supabase
      .from("ecosystem_public_snapshots")
      .select("id")
      .eq("kind", kind)
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await supabase.from("ecosystem_public_snapshots").update(row).eq("id", existing.id);
      return !error;
    }
    const { error } = await supabase.from("ecosystem_public_snapshots").insert(row);
    return !error;
  } catch {
    return false;
  }
}

export async function saveStrategicPriorities(input: SavePrioritiesInput): Promise<SavePrioritiesResult> {
  const today = new Date().toISOString().slice(0, 10);
  const payload: StrategicPrioritiesPayload = {
    ...input.payload,
    lastUpdated: today,
  };

  const persistedTo: SavePrioritiesResult["persistedTo"] = [];

  const allowFs = shouldAllowPrioritiesFilesystemWrite(process.env);
  if (allowFs) {
    await writeJsonFile(PRIORITIES_FILE, payload);

    if (input.nextImplementationTarget?.trim()) {
      const roadRaw = await readFile(ROADMAP_FILE, "utf8");
      const road = JSON.parse(roadRaw) as {
        executionQueue?: { nextImplementationTarget?: string };
      };
      if (road.executionQueue) {
        road.executionQueue.nextImplementationTarget = input.nextImplementationTarget.trim();
        await writeJsonFile(ROADMAP_FILE, road);
      }
    }
    persistedTo.push("filesystem");
  }

  if (await trySupabaseUpsert(payload)) {
    persistedTo.push("supabase");
  }

  if (!persistedTo.length) {
    throw new Error(
      "No persistence backend available. Set OPERATIONS_ALLOW_FS_WRITE=1 (local) or OPERATIONS_SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const feedEventId = allowFs ? await appendPriorityAuditFeed(input.audit) : null;
  return { persistedTo, feedEventId };
}
