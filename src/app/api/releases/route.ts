import { buildAionAiContextDocument } from "@/lib/aion-ai-context";
import { aiJsonResponse, aiOptionsResponse } from "@/lib/ai-http-response";

export async function OPTIONS() {
  return aiOptionsResponse();
}

export async function GET() {
  const doc = await buildAionAiContextDocument();
  return aiJsonResponse({ meta: doc.meta, releases: doc.releases });
}
