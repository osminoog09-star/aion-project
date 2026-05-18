import { NextResponse } from "next/server";
import { fetchDriverBugReports } from "@/lib/operations/fetch-driver-bug-reports";

export const runtime = "nodejs";

export async function GET() {
  const reports = await fetchDriverBugReports(50);
  return NextResponse.json({
    ok: true,
    meta: { kind: "driver_bug_reports" },
    count: reports.length,
    reports,
  });
}
