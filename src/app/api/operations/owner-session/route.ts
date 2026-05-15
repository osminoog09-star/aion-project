import { NextResponse } from "next/server";
import { isOwnerAuthenticated, isOwnerAuthConfigured } from "@/lib/operations/owner-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    configured: isOwnerAuthConfigured(),
    authenticated: await isOwnerAuthenticated(),
  });
}
