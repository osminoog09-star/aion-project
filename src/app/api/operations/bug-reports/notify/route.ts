import { NextResponse } from "next/server";
import type { DriverBugReportRow } from "@/lib/operations/fetch-driver-bug-reports";
import { notifySingleBugReportIfNew } from "@/lib/operations/process-new-bug-report-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.BUG_REPORT_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  return (
    req.headers.get("x-aion-webhook-secret") === secret ||
    req.headers.get("authorization") === `Bearer ${secret}`
  );
}

type SupabaseWebhookBody = {
  type?: string;
  table?: string;
  record?: DriverBugReportRow;
};

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: SupabaseWebhookBody;
  try {
    body = (await req.json()) as SupabaseWebhookBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const record = body.record;
  if (!record?.id || !record.description) {
    return NextResponse.json({ ok: false, error: "missing record" }, { status: 400 });
  }

  const result = await notifySingleBugReportIfNew(record);
  return NextResponse.json({ ok: true, sent: result.sent, errors: result.errors });
}
