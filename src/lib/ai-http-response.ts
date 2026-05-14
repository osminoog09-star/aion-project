import { NextResponse } from "next/server";

import { AION_AI_SCHEMA_VERSION } from "@/lib/aion-ai-context";

const AI_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "X-AION-AI-Schema": AION_AI_SCHEMA_VERSION,
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export function aiJsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: AI_HEADERS });
}

export function aiOptionsResponse() {
  return new NextResponse(null, { status: 204, headers: AI_HEADERS });
}
