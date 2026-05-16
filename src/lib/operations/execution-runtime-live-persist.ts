import type { ExecutionRuntimeDocument } from "@/contracts/execution-runtime";

export const EXECUTION_RUNTIME_LIVE_KIND = "portal_execution_runtime_live";

export type ExecutionRuntimePersistSource = "supabase_live" | "filesystem" | "build_snapshot";

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.OPERATIONS_SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  );
}

async function createServiceClient() {
  const key = process.env.OPERATIONS_SUPABASE_SERVICE_ROLE_KEY!.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function readExecutionRuntimeFromSupabase(): Promise<ExecutionRuntimeDocument | null> {
  if (!supabaseConfigured()) return null;
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("ecosystem_public_snapshots")
      .select("payload, updated_at")
      .eq("kind", EXECUTION_RUNTIME_LIVE_KIND)
      .limit(1)
      .maybeSingle();
    if (error || !data?.payload) return null;
    return data.payload as unknown as ExecutionRuntimeDocument;
  } catch {
    return null;
  }
}

export async function writeExecutionRuntimeToSupabase(
  doc: ExecutionRuntimeDocument,
): Promise<boolean> {
  if (!supabaseConfigured()) return false;
  try {
    const supabase = await createServiceClient();
    const row = {
      kind: EXECUTION_RUNTIME_LIVE_KIND,
      payload: doc as unknown as Record<string, unknown>,
      is_public: true,
      updated_at: new Date().toISOString(),
    };
    const { data: existing } = await supabase
      .from("ecosystem_public_snapshots")
      .select("id")
      .eq("kind", EXECUTION_RUNTIME_LIVE_KIND)
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await supabase
        .from("ecosystem_public_snapshots")
        .update(row)
        .eq("id", existing.id);
      return !error;
    }
    const { error } = await supabase.from("ecosystem_public_snapshots").insert(row);
    return !error;
  } catch {
    return false;
  }
}

function heartbeatMs(doc: ExecutionRuntimeDocument): number {
  const raw = doc.runtime.heartbeatAt || doc.runtime.updatedAt;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

/** Newest runtime: Supabase live beats local FS; on Vercel without Supabase → build snapshot. */
export async function resolveExecutionRuntimeDocument(
  local: ExecutionRuntimeDocument,
): Promise<{ doc: ExecutionRuntimeDocument; persistedVia: ExecutionRuntimePersistSource }> {
  const remote = await readExecutionRuntimeFromSupabase();
  if (remote && heartbeatMs(remote) >= heartbeatMs(local)) {
    return { doc: remote, persistedVia: "supabase_live" };
  }
  if (remote && heartbeatMs(remote) < heartbeatMs(local)) {
    void writeExecutionRuntimeToSupabase(local);
    return { doc: local, persistedVia: process.env.VERCEL ? "build_snapshot" : "filesystem" };
  }
  if (process.env.VERCEL) {
    return { doc: local, persistedVia: "build_snapshot" };
  }
  return { doc: local, persistedVia: "filesystem" };
}
