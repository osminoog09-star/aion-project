import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/operations/owner-auth";
import { saveStrategicPriorities } from "@/lib/operations/priorities-persist";
import { diffStrategicPriorities } from "@/lib/operations/priority-audit";
import { validateStrategicPriorities } from "@/lib/operations/priority-validation";
import {
  buildAutonomousNextTargets,
  getStrategicPriorities,
} from "@/lib/strategic-priorities";
import type { PriorityChangeAudit, StrategicPrioritiesPayload } from "@/lib/ecosystem-types";

export const runtime = "nodejs";

export async function GET() {
  const payload = await getStrategicPriorities();
  return NextResponse.json({
    meta: {
      kind: "strategic_priorities",
      constitutionVersion: payload.constitutionVersion,
      lastUpdated: payload.lastUpdated,
    },
    payload,
    autonomousNextTargets: buildAutonomousNextTargets(payload),
  });
}

type PutBody = {
  payload: StrategicPrioritiesPayload;
  nextImplementationTarget?: string;
  audit: PriorityChangeAudit;
};

export async function PUT(req: Request) {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Owner authentication required" }, { status: 401 });
  }
  let body: PutBody;
  try {
    body = (await req.json()) as PutBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.payload?.priorities?.length || !body.audit?.reason?.trim()) {
    return NextResponse.json(
      { ok: false, error: "payload and audit.reason required" },
      { status: 400 },
    );
  }

  const validation = validateStrategicPriorities(body.payload);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: "Dependency validation failed", issues: validation.issues },
      { status: 422 },
    );
  }

  const previous = await getStrategicPriorities();
  const audit: PriorityChangeAudit = {
    reason: body.audit.reason.trim(),
    changedAt: new Date().toISOString(),
    changedBy: "product-owner",
    changes: diffStrategicPriorities(previous, body.payload),
  };

  try {
    const result = await saveStrategicPriorities({
      payload: body.payload,
      nextImplementationTarget: body.nextImplementationTarget,
      audit,
    });
    const payload = await getStrategicPriorities();
    return NextResponse.json({
      ok: true,
      persistedTo: result.persistedTo,
      feedEventId: result.feedEventId,
      validationIssues: validation.issues,
      payload,
      autonomousNextTargets: buildAutonomousNextTargets(payload),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
