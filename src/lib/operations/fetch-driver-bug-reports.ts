export type DriverBugReportRow = {
  id: string;
  user_id: string | null;
  category: string;
  description: string;
  diagnostics: Record<string, unknown> | null;
  app_version: string | null;
  platform: string | null;
  status: string;
  created_at: string;
};

export async function fetchDriverBugReports(limit = 40): Promise<DriverBugReportRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.OPERATIONS_SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const apiKey = serviceKey || anonKey;
  if (!url || !apiKey) return [];

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, apiKey, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("driver_bug_reports")
      .select(
        "id, user_id, category, description, diagnostics, app_version, platform, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[bug-reports] fetch failed:", error.message);
      return [];
    }
    return (data ?? []) as DriverBugReportRow[];
  } catch (e) {
    console.error("[bug-reports] error:", e);
    return [];
  }
}
