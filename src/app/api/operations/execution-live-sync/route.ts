import { NextResponse } from "next/server";
import type { ExecutionRuntimeDocument } from "@/contracts/execution-runtime";
import { buildLiveExecutionView } from "@/lib/execution-runtime";
import { saveExecutionRuntimeDocument } from "@/lib/operations/execution-runtime-persist";
import { canWriteArchitectureReviews } from "@/lib/operations/review-agent-auth";

export const runtime = "nodejs";

type Body = {
  document?: ExecutionRuntimeDocument;
};

export async function POST(req: Request) {
  if (!(await canWriteArchitectureReviews(req))) {
    return NextResponse.json(
      { ok: false, error: "Agent key or owner session required" },
      { status: 401 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.document?.runtime) {
    return NextResponse.json({ ok: false, error: "document.runtime required" }, { status: 400 });
  }

  try {
    const { persistedTo } = await saveExecutionRuntimeDocument(body.document);
    const view = buildLiveExecutionView(body.document);
    return NextResponse.json({
      ok: true,
      persistedTo,
      persistedVia: persistedTo.includes("supabase") ? "supabase_live" : "filesystem",
      ...view,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
