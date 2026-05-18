import Constants from "expo-constants";
import { Platform } from "react-native";
import type { Json } from "../../lib/database.types";
import { diagLog } from "../../lib/diagnosticLog";
import { requireSupabase } from "../../lib/supabase";
import { captureSyncError } from "../../lib/sentry";
import type { BugReportCategory } from "./buildBugReportBundle";
import { buildBugReportDiagnostics } from "./buildBugReportBundle";

export type SubmitBugReportResult =
  | { ok: true; id: string }
  | { ok: false; reason: "offline" | "auth" | "error"; message: string };

export async function submitBugReport(input: {
  userId: string | null;
  category: BugReportCategory;
  description: string;
}): Promise<SubmitBugReportResult> {
  const desc = input.description.trim();
  if (desc.length < 3) {
    return { ok: false, reason: "error", message: "Опишите проблему хотя бы в нескольких словах" };
  }

  let diagnostics: Record<string, unknown>;
  try {
    diagnostics = await buildBugReportDiagnostics();
  } catch (e) {
    captureSyncError(e, { phase: "bug_report_diagnostics" });
    diagnostics = { buildError: String(e) };
  }

  diagnostics.userDescription = desc;
  diagnostics.category = input.category;

  try {
    const client = requireSupabase();
    const row = {
      user_id: input.userId,
      category: input.category,
      description: desc,
      diagnostics: diagnostics as unknown as Json,
      app_version: Constants.expoConfig?.version ?? null,
      platform: Platform.OS,
      status: "new" as const,
    };

    const { data, error } = await client
      .from("driver_bug_reports")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      diagLog("error", "bug_report", "Отправка не удалась", { message: error.message });
      return { ok: false, reason: "error", message: error.message };
    }

    diagLog("info", "bug_report", "Отчёт отправлен", { id: data.id, category: input.category });
    return { ok: true, id: data.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Supabase") || msg.includes("not configured")) {
      return { ok: false, reason: "offline", message: "Облако недоступно — скопируйте отчёт вручную" };
    }
    return { ok: false, reason: "error", message: msg };
  }
}
