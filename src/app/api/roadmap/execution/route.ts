import { AION_AI_SCHEMA_VERSION } from "@/lib/aion-ai-context";
import { getEcosystemStatus } from "@/lib/ecosystem-data";
import { buildRoadmapExecutionPayload } from "@/lib/roadmap-execution";
import { aiJsonResponse, aiOptionsResponse } from "@/lib/ai-http-response";

export async function OPTIONS() {
  return aiOptionsResponse();
}

export async function GET() {
  const eco = await getEcosystemStatus();
  const payload = buildRoadmapExecutionPayload(eco);
  return aiJsonResponse({
    meta: {
      schemaVersion: AION_AI_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      ecosystemLastUpdated: eco.lastUpdated,
      kind: "roadmap_execution_api",
    },
    executionEngine: payload,
    summary: {
      currentActiveEpic: payload.executionQueue?.currentActiveEpic ?? null,
      currentSubsystemFocus: payload.executionQueue?.currentSubsystemFocus ?? null,
      nextImplementationTarget: payload.executionQueue?.nextImplementationTarget ?? null,
    },
  });
}
