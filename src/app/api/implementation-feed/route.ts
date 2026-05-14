import { AION_AI_SCHEMA_VERSION } from "@/lib/aion-ai-context";
import { getLocalImplementationFeed } from "@/lib/ecosystem-data";
import { aiJsonResponse, aiOptionsResponse } from "@/lib/ai-http-response";

export async function OPTIONS() {
  return aiOptionsResponse();
}

export async function GET() {
  const feed = getLocalImplementationFeed();
  return aiJsonResponse({
    meta: {
      schemaVersion: AION_AI_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      kind: "implementation_feed",
    },
    ...feed,
  });
}
