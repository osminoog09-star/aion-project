import { NextResponse } from "next/server";
import {
  getLocalFieldValidationReport,
  saveFieldValidationReport,
} from "@/lib/operations/field-validation-report";
import { isOwnerAuthenticated } from "@/lib/operations/owner-auth";

export const runtime = "nodejs";

export async function GET() {
  const report = getLocalFieldValidationReport();
  return NextResponse.json({
    meta: { kind: "owner_field_validation_report" },
    report,
  });
}

export async function POST(req: Request) {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Owner authentication required" }, { status: 401 });
  }
  let body: { reportText?: string };
  try {
    body = (await req.json()) as { reportText?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const text = body.reportText?.trim();
  if (!text || text.length < 20) {
    return NextResponse.json(
      { ok: false, error: "reportText required (min 20 chars)" },
      { status: 400 },
    );
  }
  const report = saveFieldValidationReport({ reportText: text, source: "owner_paste" });
  return NextResponse.json({ ok: true, report });
}
