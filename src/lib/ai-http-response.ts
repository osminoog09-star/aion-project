import { NextResponse } from "next/server";

const AI_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "X-AION-AI-Schema": "1.1.0",
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export function aiJsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: AI_HEADERS });
}

export function aiOptionsResponse() {
  return new NextResponse(null, { status: 204, headers: AI_HEADERS });
}
