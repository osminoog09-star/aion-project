const CURSOR_KIND = "ops_bug_alert_cursor";

export type BugReportAlertCursor = {
  lastNotifiedId: string | null;
  lastNotifiedAt: string | null;
};

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

export async function readBugReportAlertCursor(): Promise<BugReportAlertCursor> {
  if (!supabaseConfigured()) {
    return { lastNotifiedId: null, lastNotifiedAt: null };
  }
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("ecosystem_public_snapshots")
      .select("payload")
      .eq("kind", CURSOR_KIND)
      .limit(1)
      .maybeSingle();
    const p = data?.payload as BugReportAlertCursor | undefined;
    return {
      lastNotifiedId: p?.lastNotifiedId ?? null,
      lastNotifiedAt: p?.lastNotifiedAt ?? null,
    };
  } catch {
    return { lastNotifiedId: null, lastNotifiedAt: null };
  }
}

export async function writeBugReportAlertCursor(cursor: BugReportAlertCursor): Promise<void> {
  if (!supabaseConfigured()) return;
  try {
    const supabase = await createServiceClient();
    const row = {
      kind: CURSOR_KIND,
      payload: cursor as unknown as Record<string, unknown>,
      is_public: false,
      updated_at: new Date().toISOString(),
    };
    const { data: existing } = await supabase
      .from("ecosystem_public_snapshots")
      .select("id")
      .eq("kind", CURSOR_KIND)
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from("ecosystem_public_snapshots").update(row).eq("id", existing.id);
    } else {
      await supabase.from("ecosystem_public_snapshots").insert(row);
    }
  } catch (e) {
    console.error("[bug-alert-cursor] write failed:", e);
  }
}
