import { NextResponse } from "next/server";
import { processNewBugReportAlerts } from "@/lib/operations/process-new-bug-report-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret =
    process.env.CRON_SECRET?.trim() || process.env.BUG_REPORT_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return req.headers.get("x-cron-secret") === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await processNewBugReportAlerts();
  return NextResponse.json({ ok: true, ...result });
}
