import { NextResponse } from "next/server";
import { clearOwnerSessionCookie } from "@/lib/operations/owner-auth";

export const runtime = "nodejs";

export async function POST() {
  await clearOwnerSessionCookie();
  return NextResponse.json({ ok: true });
}
