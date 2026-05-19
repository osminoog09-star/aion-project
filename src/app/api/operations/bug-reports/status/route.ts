import { NextResponse } from "next/server";
import {
  bugReportNotifyConfigured,
  bugReportNotifyStatus,
} from "@/lib/operations/notify-bug-report-owner";

export const runtime = "nodejs";

export async function GET() {
  const channels = bugReportNotifyStatus();
  const active = bugReportNotifyConfigured();
  return NextResponse.json({
    ok: true,
    active,
    channels,
    docs: "/docs/BUG-REPORT-OWNER-ALERTS.md",
    endpoints: {
      cron: "/api/cron/bug-report-alerts",
      supabaseInsert: "/api/operations/bug-reports/notify",
    },
  });
}
