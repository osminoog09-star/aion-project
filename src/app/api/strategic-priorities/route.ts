import { NextResponse } from "next/server";
import { buildAutonomousNextTargets, getLocalStrategicPriorities } from "@/lib/strategic-priorities";

export const dynamic = "force-static";

export function GET() {
  const payload = getLocalStrategicPriorities();
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
